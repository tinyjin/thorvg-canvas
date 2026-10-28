import { init } from 'thorvg-canvas';

const TVG = await init();
const canvas = new TVG.Canvas({ width: 480, height: 160 });

canvas.add(new TVG.Shape().appendRect(0, 0, 480, 160).fill(15, 23, 42));

const title = new TVG.Text()
  .font('default')
  .fontSize(44)
  .text('Hello ThorVG')
  .fill(
    new TVG.LinearGradient(0, 0, 300, 0)
      .addStop(0, [79, 193, 255, 255])
      .addStop(1, [250, 204, 21, 255])
  );
title.translate(32, 22);

const subtitle = new TVG.Text()
  .font('default')
  .fontSize(20)
  .text('Rendered in Node.js')
  .fill(203, 213, 225);
subtitle.translate(34, 92);

canvas.add(title).add(subtitle).render();
await canvas.toFile('text.png');
console.log('Saved text.png');
canvas.destroy();
