import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initSync } from '../dist/index.js';

const TVG = initSync();
const dir = mkdtempSync(join(tmpdir(), 'thorvg-canvas-'));

function box() {
  const canvas = new TVG.Canvas({ width: 40, height: 30 });
  canvas.add(new TVG.Shape().appendRect(0, 0, 20, 30).fill(255, 0, 0, 255)).render();
  return canvas;
}

test('toFile writes the rendered frame as PNG', async () => {
  const canvas = box();
  const path = join(dir, 'box.png');
  await canvas.toFile(path);
  const png = readFileSync(path);
  assert.deepEqual(png, await canvas.toBuffer('png'));
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [40, 30]);
  canvas.destroy();
});

test('toFileSync writes the same bytes', async () => {
  const canvas = box();
  const path = join(dir, 'box-sync.png');
  canvas.toFileSync(path);
  assert.deepEqual(readFileSync(path), canvas.toBufferSync('png'));
  canvas.destroy();
});

test('an explicit format overrides the extension', async () => {
  const canvas = box();
  const path = join(dir, 'box.bin');
  await canvas.toFile(path, 'raw');
  assert.equal(readFileSync(path).length, 40 * 30 * 4);
  canvas.destroy();
});

test('unsupported extensions fail clearly', async () => {
  const canvas = box();
  await assert.rejects(canvas.toFile(join(dir, 'box.jpg')), /unsupported format "jpg"/);
  assert.throws(() => canvas.toFileSync(join(dir, 'box')), /unsupported format/);
  canvas.destroy();
});
