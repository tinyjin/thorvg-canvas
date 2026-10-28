import { readFileSync } from 'node:fs';
import { init } from 'thorvg-canvas';

const TVG = await init();
const file = new URL('./assets/animation.json', import.meta.url);
const lottie = readFileSync(file);

const COLUMNS = 4;
const ROWS = 2;
const CELL = 120;
const WIDTH = COLUMNS * CELL;
const HEIGHT = ROWS * CELL;
const canvas = new TVG.Canvas({ width: WIDTH, height: HEIGHT });
canvas.add(new TVG.Shape().appendRect(0, 0, WIDTH, HEIGHT).fill(255, 255, 255));

const { totalFrames } = new TVG.LottieAnimation().load(lottie).info();
for (let i = 0; i < COLUMNS * ROWS; i++) {
  const animation = new TVG.LottieAnimation().load(lottie);
  animation.frame(((totalFrames - 1) * (i + 1)) / (COLUMNS * ROWS));

  const picture = animation.picture;
  picture.size(CELL, CELL);
  const column = i % COLUMNS;
  const row = Math.floor(i / COLUMNS);
  picture.translate(column * CELL, row * CELL);
  canvas.add(picture);
}

await canvas.renderAsync();
await canvas.toFile('lottie-frames.png');
console.log('Saved lottie-frames.png');
canvas.destroy();
