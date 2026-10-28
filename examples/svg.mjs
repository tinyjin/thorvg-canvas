import { readFileSync } from 'node:fs';
import { init } from 'thorvg-canvas';

const TVG = await init();
const canvas = new TVG.Canvas({ width: 240, height: 240, pixelRatio: 2 });

const svg = readFileSync(new URL('./assets/logo.svg', import.meta.url));
const picture = new TVG.Picture().load(svg);
const { width, height } = picture.size();
const scale = Math.min(200 / width, 200 / height);
picture.size(width * scale, height * scale);
picture.translate((240 - width * scale) / 2, (240 - height * scale) / 2);

canvas.add(picture).render();
await canvas.toFile('svg.png');
console.log(`Saved svg.png (${canvas.width} x ${canvas.height})`);
canvas.destroy();
