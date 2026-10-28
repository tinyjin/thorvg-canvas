import { init } from 'thorvg-canvas';

const TVG = await init();
const canvas = new TVG.Canvas({ width: 480, height: 240 });

const background = new TVG.Shape()
  .appendRect(0, 0, 480, 240)
  .fill(15, 23, 42);

const card = new TVG.Shape()
  .appendRect(30, 30, 180, 180, { rx: 28, ry: 28 })
  .fill(
    new TVG.LinearGradient(30, 30, 210, 210)
      .addStop(0, [37, 99, 235, 255])
      .addStop(1, [147, 51, 234, 255])
  );

const ring = new TVG.Shape()
  .appendCircle(345, 120, 80, 80)
  .stroke({
    width: 18,
    color: [250, 204, 21, 255],
    cap: TVG.StrokeCap.Round,
  })
  .trimPath(0.05, 0.8);

const dot = new TVG.Shape()
  .appendCircle(345, 120, 36, 36)
  .fill(244, 63, 94, 255);

canvas.add(background).add(card).add(ring).add(dot).render();
await canvas.toFile('shapes.png');
console.log('Saved shapes.png');
canvas.destroy();
