// Drag to draw, scroll to resize the brush. Keys: Z undo, Y redo, C clear, S save, Esc quit.
import { setTimeout as sleep } from 'node:timers/promises';
import sdl from '@kmamal/sdl';
import { init } from 'thorvg-canvas';

const TVG = await init();

const WIDTH = 800;
const HEIGHT = 560;
const TOOLBAR = 56;
const COLORS = [
  [15, 23, 42],
  [239, 68, 68],
  [245, 158, 11],
  [34, 197, 94],
  [59, 130, 246],
  [168, 85, 247],
];

const window = sdl.video.createWindow({ title: 'ThorVG Sketch', width: WIDTH, height: HEIGHT });
const dpr = window.pixelWidth / window.width;
const canvas = new TVG.Canvas({ width: WIDTH, height: HEIGHT, pixelRatio: dpr });

const paper = new TVG.Shape().appendRect(0, 0, WIDTH, HEIGHT).fill(248, 250, 252);
const drawing = new TVG.Scene();

const toolbar = new TVG.Scene();
toolbar.add(new TVG.Shape().appendRect(0, 0, WIDTH, TOOLBAR).fill(30, 41, 59));
toolbar.dropShadow(0, 0, 0, 60, 90, 2, 6);

const swatches = COLORS.map(([r, g, b], i) => {
  const swatch = new TVG.Shape().appendCircle(32 + i * 40, TOOLBAR / 2, 13, 13).fill(r, g, b);
  swatch.stroke({ width: 2, color: [255, 255, 255, 90] });
  toolbar.add(swatch);
  return swatch;
});
const selection = new TVG.Shape()
  .appendCircle(0, TOOLBAR / 2, 18, 18)
  .stroke({ width: 3, color: [255, 255, 255, 255] });
toolbar.add(selection);

function label(x, width, content, size, color) {
  const text = new TVG.Text()
    .font('default')
    .fontSize(size)
    .text(content)
    .fill(...color)
    .layout(width, TOOLBAR)
    .align(0.5, 0.5);
  text.translate(x, 0);
  toolbar.add(text);
  return text;
}

function button(x, width, content, action, enabled) {
  const shape = new TVG.Shape().appendRect(x, 12, width, 32, { rx: 8, ry: 8 });
  toolbar.add(shape);
  return { shape, text: label(x, width, content, 15, [241, 245, 249]), action, enabled };
}

const sizeLabel = label(300, 56, '', 14, [203, 213, 225]);
const status = label(400, 100, '', 14, [148, 163, 184]);
const buttons = [
  button(268, 32, '-', () => resize(-1), () => size > 1),
  button(356, 32, '+', () => resize(1), () => size < 48),
  button(WIDTH - 280, 80, 'Undo', () => undo(), () => strokes.length > 0),
  button(WIDTH - 188, 80, 'Redo', () => redo(), () => undone.length > 0),
  button(WIDTH - 96, 80, 'Clear', () => clear(), () => strokes.length > 0),
];

const brush = new TVG.Shape();

canvas.add(paper).add(drawing).add(brush).add(toolbar);

let color = COLORS[0];
let size = 6;
const strokes = [];
const undone = [];
let stroke = null;
let pointer = null;
let hovered = null;
const pending = []; // Input events only queue work

function selectColor(index) {
  color = COLORS[index];
  selection.translate(32 + index * 40, 0);
}

function hitTest(paint, x, y) {
  return paint.intersects(x * dpr, y * dpr, 1, 1);
}

function updateBrush() {
  brush.reset();
  if (!pointer || pointer.y < TOOLBAR) return;
  brush.appendCircle(pointer.x, pointer.y, size / 2, size / 2).fill(...color, 110);
}

function updateToolbar() {
  sizeLabel.text(`${size}px`);
  status.text(`${strokes.length} strokes`);
  for (const b of buttons) {
    const enabled = b.enabled();
    b.shape.fill(...(enabled && b === hovered ? [100, 116, 139] : [71, 85, 105]));
    b.shape.opacity(enabled ? 255 : 100);
    b.text.opacity(enabled ? 255 : 100);
  }
}

function apply(event) {
  switch (event.type) {
    case 'down': {
      const index = swatches.findIndex((swatch) => hitTest(swatch, event.x, event.y));
      if (index >= 0) return selectColor(index);
      const target = buttons.find((b) => hitTest(b.shape, event.x, event.y));
      if (target) return target.enabled() && target.action();
      if (event.y < TOOLBAR) return;
      stroke = new TVG.Shape().moveTo(event.x, event.y).lineTo(event.x, event.y);
      stroke.stroke({
        width: size,
        color: [...color, 255],
        cap: TVG.StrokeCap.Round,
        join: TVG.StrokeJoin.Round,
      });
      drawing.add(stroke);
      strokes.push(stroke);
      undone.length = 0;
      return;
    }
    case 'move': {
      pointer = event;
      if (stroke) stroke.lineTo(event.x, event.y);
      hovered = buttons.find((b) => hitTest(b.shape, event.x, event.y)) ?? null;
      const clickable =
        hovered?.enabled() || swatches.some((swatch) => hitTest(swatch, event.x, event.y));
      sdl.mouse.setCursor(clickable ? 'pointer' : 'crosshair');
      return;
    }
    case 'up':
      stroke = null;
      return;
    case 'leave':
      pointer = null;
      return;
    case 'wheel':
      return resize(Math.sign(event.dy));
    case 'undo':
      return undo();
    case 'redo':
      return redo();
    case 'clear':
      return clear();
    case 'save':
      return save();
  }
}

function resize(step) {
  size = Math.min(48, Math.max(1, size + step));
}

function undo() {
  const last = strokes.pop();
  if (!last) return;
  drawing.remove(last);
  undone.push(last);
}

function redo() {
  const last = undone.pop();
  if (!last) return;
  drawing.add(last);
  strokes.push(last);
}

function clear() {
  drawing.clear();
  strokes.length = 0;
  undone.length = 0;
}

async function save() {
  await canvas.toFile('sketch.png');
  console.log('Saved sketch.png');
}

function queue(event) {
  pending.push(event);
}

window
  .on('mouseButtonDown', ({ x, y, button }) => button === 1 && queue({ type: 'down', x, y }))
  .on('mouseButtonUp', ({ button }) => button === 1 && queue({ type: 'up' }))
  .on('mouseMove', ({ x, y }) => queue({ type: 'move', x, y }))
  .on('leave', () => queue({ type: 'leave' }))
  .on('mouseWheel', ({ dy }) => queue({ type: 'wheel', dy }))
  .on('keyDown', ({ key }) => {
    if (key === 'escape') window.destroy();
    else if (key === 'z') queue({ type: 'undo' });
    else if (key === 'y') queue({ type: 'redo' });
    else if (key === 'c') queue({ type: 'clear' });
    else if (key === 's') queue({ type: 'save' });
  });

selectColor(0);
sdl.mouse.setCursor('crosshair');

const FRAME_TIME = 1000 / 60;
while (!window.destroyed) {
  const frameStart = performance.now();

  for (const event of pending.splice(0)) await apply(event);
  updateBrush();
  updateToolbar();

  await canvas.update().renderAsync();
  if (window.destroyed) break;

  // ThorVG writes R, G, B, A bytes, which is SDL's 'rgba32' on any host.
  const { data } = canvas.getImageData();
  window.render(canvas.width, canvas.height, canvas.width * 4, 'rgba32', Buffer.from(data.buffer, data.byteOffset, data.byteLength));

  await sleep(Math.max(0, FRAME_TIME - (performance.now() - frameStart)));
}

canvas.destroy();
