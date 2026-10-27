import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { Worker } from 'node:worker_threads';
import { initSync } from '../dist/index.js';

const TVG = initSync();

function pixel(image, x, y) {
  const i = (y * image.width + x) * 4;
  return [...image.data.subarray(i, i + 4)];
}

// A 100x100, 30-frame Lottie: one square layer moving from x=25 to x=75.
const lottie = JSON.stringify({
  v: '5.7.0', fr: 30, ip: 0, op: 30, w: 100, h: 100, layers: [{
    ty: 4, ip: 0, op: 30, st: 0, ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, s: { a: 0, k: [100, 100] }, a: { a: 0, k: [0, 0] },
      p: { a: 1, k: [{ t: 0, s: [25, 50], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } }, { t: 29, s: [75, 50] }] },
    },
    shapes: [{ ty: 'gr', it: [
      { ty: 'rc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [20, 20] }, r: { a: 0, k: 0 } },
      { ty: 'fl', c: { a: 0, k: [0, 0, 1, 1] }, o: { a: 0, k: 100 } },
      { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
    ] }],
  }],
});

test('renders a shape into straight-alpha RGBA', () => {
  const canvas = new TVG.Canvas({ width: 4, height: 4 });
  canvas.add(new TVG.Shape().appendRect(0, 0, 2, 4).fill(255, 0, 0, 128)).render();
  const image = canvas.getImageData();
  assert.equal(image.data.length, 4 * 4 * 4);
  assert.deepEqual(pixel(image, 0, 0), [255, 0, 0, 128]); // un-premultiplied
  assert.deepEqual(pixel(image, 3, 0), [0, 0, 0, 0]);
  canvas.destroy();
});

test('accepts the webcanvas (target, options) signature', () => {
  const canvas = new TVG.Canvas('#ignored', { width: 10, height: 6 });
  assert.equal(canvas.width, 10);
  assert.equal(canvas.height, 6);
  canvas.destroy();
});

test('pixelRatio scales the output, not the drawing units', () => {
  const canvas = new TVG.Canvas({ width: 4, height: 4, pixelRatio: 2 });
  canvas.add(new TVG.Shape().appendRect(0, 0, 2, 4).fill(0, 255, 0, 255)).render();
  const image = canvas.getImageData();
  assert.equal(image.width, 8);
  assert.deepEqual(pixel(image, 3, 7), [0, 255, 0, 255]);
  assert.deepEqual(pixel(image, 4, 0), [0, 0, 0, 0]);
  canvas.destroy();
});

test('encodes a PNG whose pixels round-trip', async () => {
  const canvas = new TVG.Canvas({ width: 3, height: 2 });
  canvas.add(new TVG.Shape().appendRect(0, 0, 3, 2).fill(10, 20, 30, 255)).render();
  const png = await canvas.toBuffer('png');
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(png.readUInt32BE(16), 3);
  assert.equal(png.readUInt32BE(20), 2);
  const idatLength = png.readUInt32BE(33);
  const scanlines = inflateSync(png.subarray(41, 41 + idatLength));
  assert.deepEqual([...scanlines.subarray(0, 5)], [0, 10, 20, 30, 255]);
  assert.deepEqual(canvas.toBufferSync('png'), png);
  canvas.destroy();
});

test('plays a Lottie frame by frame', async () => {
  const canvas = new TVG.Canvas({ width: 100, height: 100 });
  const animation = new TVG.LottieAnimation();
  await animation.load(lottie);
  canvas.add(animation.picture);

  animation.frame(0);
  canvas.update().render();
  assert.deepEqual(pixel(canvas.getImageData(), 30, 55), [0, 0, 255, 255]);
  assert.deepEqual(pixel(canvas.getImageData(), 80, 55), [0, 0, 0, 0]);

  animation.frame(29);
  canvas.update().render();
  assert.deepEqual(pixel(canvas.getImageData(), 30, 55), [0, 0, 0, 0]);
  assert.deepEqual(pixel(canvas.getImageData(), 80, 55), [0, 0, 255, 255]);

  animation.dispose();
  canvas.destroy();
});

test('renderAsync blocks scene mutation until it settles', async () => {
  const canvas = new TVG.Canvas({ width: 64, height: 64 });
  const shape = new TVG.Shape().appendCircle(32, 32, 20).fill(0, 0, 0, 255);
  canvas.add(shape);
  const pending = canvas.renderAsync();
  assert.throws(() => shape.fill(255, 255, 255, 255), /rendering asynchronously/);
  await pending;
  assert.deepEqual(pixel(canvas.getImageData(), 32, 32), [0, 0, 0, 255]);
  shape.fill(255, 255, 255, 255);
  canvas.destroy();
});

test('garbage-collected paints are freed without crashing', async () => {
  const canvas = new TVG.Canvas({ width: 32, height: 32 });
  for (let round = 0; round < 20; round++) {
    for (let i = 0; i < 500; i++) {
      const scene = new TVG.Scene();
      scene.add(new TVG.Shape().appendRect(i % 32, 0, 1, 1).fill(1, 2, 3, 255));
      if (i % 50 === 0) canvas.add(scene);
    }
    globalThis.gc?.();
    await new Promise((resolve) => setImmediate(resolve));
    canvas.remove();
    canvas.render();
  }
  canvas.destroy();
});

test('renders in worker_threads concurrently', async () => {
  const source = `
    const { parentPort, workerData } = require('node:worker_threads');
    import(workerData.url).then(({ initSync }) => {
      const TVG = initSync();
      const canvas = new TVG.Canvas({ width: 16, height: 16 });
      canvas.add(new TVG.Shape().appendRect(0, 0, 16, 16).fill(workerData.r, 0, 0, 255)).render();
      parentPort.postMessage([...canvas.getImageData().data.subarray(0, 4)]);
      canvas.destroy();
    });`;
  const url = new URL('../dist/index.js', import.meta.url).href;
  const run = (r) =>
    new Promise((resolve, reject) => {
      const worker = new Worker(source, { eval: true, workerData: { url, r } });
      worker.once('message', resolve);
      worker.once('error', reject);
    });
  const results = await Promise.all([run(10), run(20), run(30), run(40)]);
  assert.deepEqual(results, [[10, 0, 0, 255], [20, 0, 0, 255], [30, 0, 0, 255], [40, 0, 0, 255]]);
});

test('the default font is available without Font.load()', () => {
  const canvas = new TVG.Canvas({ width: 120, height: 40 });
  const text = new TVG.Text().font('default').fontSize(24).text('ThorVG').fill(0, 0, 0);
  text.translate(4, 4);
  canvas.add(text).render();
  const { data } = canvas.getImageData();
  let inked = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) inked++;
  assert.ok(inked > 100, `expected glyph pixels, got ${inked}`);
  canvas.destroy();
});
