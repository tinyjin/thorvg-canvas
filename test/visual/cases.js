// Visual cases, run unchanged by @thorvg/webcanvas in a browser and by thorvg-canvas in Node;
// visual.test.mjs compares the two renders pixel by pixel.
//
// Each case gets (TVG, canvas, assets) and draws with the webcanvas API only — no DOM,
// no Node APIs — so the very same function is the reference and the subject.
// Assets are files from thorvg/test/resources, preloaded by each side.

export const SIZE = 200;

// name → how the case reads it
export const ASSETS = {
  'test1.svg': 'text',
  'test2.svg': 'text',
  'test.png': 'binary',
  'test.jpg': 'binary',
  'test.webp': 'binary',
  'rawimage_200x300.raw': 'binary',
  'PublicSans-Regular.ttf': 'binary',
  'test.lot': 'text',
  'test5.lot': 'text',
  'test11.lot': 'text',
  'segment.lot': 'text',
  'test10.lot': 'text',
  'resolver.json': 'text',
};

const fit = (picture, size = SIZE) => {
  const { width, height } = picture.size();
  const scale = Math.min(size / width, size / height);
  picture.size(width * scale, height * scale);
  return picture;
};

const star = (shape, cx, cy, outer, inner) => {
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape.close();
};

const backdrop = (TVG) =>
  new TVG.Shape()
    .appendRect(0, 0, SIZE, SIZE)
    .fill(new TVG.LinearGradient(0, 0, SIZE, SIZE).addStop(0, [255, 220, 80, 255]).addStop(1, [40, 120, 255, 255]));

export const cases = {
  // --- Shape ----------------------------------------------------------------

  'shape/rect'(TVG, canvas) {
    canvas.add(new TVG.Shape().appendRect(20, 30, 160, 110).fill(230, 60, 60, 255));
  },

  'shape/rounded-rect'(TVG, canvas) {
    canvas.add(new TVG.Shape().appendRect(20, 20, 160, 70, { rx: 30, ry: 30 }).fill(60, 160, 90, 255));
    canvas.add(new TVG.Shape().appendRect(20, 110, 160, 70, { rx: 60, ry: 20 }).fill(60, 90, 200, 255));
  },

  'shape/circle-ellipse'(TVG, canvas) {
    canvas.add(new TVG.Shape().appendCircle(60, 60, 45).fill(255, 140, 0, 255));
    canvas.add(new TVG.Shape().appendCircle(130, 140, 60, 30).fill(120, 60, 220, 200));
  },

  'shape/path-commands'(TVG, canvas) {
    const heart = new TVG.Shape()
      .moveTo(100, 170)
      .cubicTo(20, 110, 20, 40, 70, 40)
      .cubicTo(90, 40, 100, 55, 100, 70)
      .cubicTo(100, 55, 110, 40, 130, 40)
      .cubicTo(180, 40, 180, 110, 100, 170)
      .close()
      .fill(220, 30, 90, 255);
    canvas.add(heart);
  },

  'shape/append-path'(TVG, canvas) {
    const { MoveTo, LineTo, CubicTo, Close } = TVG.PathCommand;
    canvas.add(
      new TVG.Shape()
        .appendPath(
          [MoveTo, LineTo, CubicTo, LineTo, Close],
          [[30, 170], [30, 60], [60, 10], [140, 10], [170, 60], [170, 170]]
        )
        .fill(0, 150, 160, 255)
    );
  },

  'shape/fill-rule'(TVG, canvas) {
    canvas.add(star(new TVG.Shape(), 55, 100, 50, 20).fillRule(TVG.FillRule.Winding).fill(30, 30, 30, 255));
    canvas.add(
      new TVG.Shape()
        .appendCircle(145, 100, 45)
        .appendCircle(145, 100, 25)
        .fillRule(TVG.FillRule.EvenOdd)
        .fill(30, 30, 30, 255)
    );
  },

  'shape/stroke-caps'(TVG, canvas) {
    const caps = [TVG.StrokeCap.Butt, TVG.StrokeCap.Round, TVG.StrokeCap.Square];
    caps.forEach((cap, i) => {
      canvas.add(
        new TVG.Shape()
          .moveTo(40, 50 + i * 50)
          .lineTo(160, 50 + i * 50)
          .stroke({ width: 24, color: [40, 90, 200, 255], cap })
      );
    });
  },

  'shape/stroke-joins'(TVG, canvas) {
    const joins = [TVG.StrokeJoin.Miter, TVG.StrokeJoin.Round, TVG.StrokeJoin.Bevel];
    joins.forEach((join, i) => {
      const x = 20 + i * 60;
      canvas.add(
        new TVG.Shape()
          .moveTo(x, 150)
          .lineTo(x + 25, 50)
          .lineTo(x + 50, 150)
          .stroke({ width: 16, color: [200, 70, 40, 255], join, miterLimit: 10 })
      );
    });
  },

  'shape/stroke-dash'(TVG, canvas) {
    canvas.add(
      new TVG.Shape()
        .appendRect(25, 25, 150, 150, { rx: 20, ry: 20 })
        .stroke({ width: 8, color: [20, 20, 20, 255], dash: [20, 10, 4, 10] })
    );
    canvas.add(
      new TVG.Shape()
        .appendCircle(100, 100, 45)
        .stroke({ width: 10, color: [220, 60, 60, 255], dash: [15, 15], dashOffset: 7, cap: TVG.StrokeCap.Round })
    );
  },

  'shape/trim-path'(TVG, canvas) {
    canvas.add(
      new TVG.Shape()
        .appendCircle(100, 100, 70)
        .stroke({ width: 14, color: [60, 180, 120, 255], cap: TVG.StrokeCap.Round })
        .trimPath(0.1, 0.65)
    );
    canvas.add(
      new TVG.Shape()
        .moveTo(40, 100).lineTo(160, 100)
        .moveTo(40, 130).lineTo(160, 130)
        .stroke({ width: 8, color: [40, 40, 200, 255] })
        .trimPath(0.2, 0.8, false)
    );
  },

  'shape/paint-order'(TVG, canvas) {
    const make = (x) =>
      new TVG.Shape().appendCircle(x, 100, 40).fill(250, 200, 0, 255).stroke({ width: 20, color: [30, 30, 30, 200] });
    canvas.add(make(55).order(true));
    canvas.add(make(145).order(false));
  },

  'shape/opacity'(TVG, canvas) {
    canvas.add(new TVG.Shape().appendCircle(75, 80, 55).fill(255, 0, 0, 255).opacity(180));
    canvas.add(new TVG.Shape().appendCircle(125, 80, 55).fill(0, 160, 0, 255).opacity(120));
    canvas.add(new TVG.Shape().appendCircle(100, 125, 55).fill(0, 0, 255, 128));
  },

  'shape/transform'(TVG, canvas) {
    canvas.add(new TVG.Shape().appendRect(-30, -30, 60, 60).fill(255, 120, 0, 255).translate(60, 60).rotate(30));
    canvas.add(new TVG.Shape().appendRect(-20, -20, 40, 40).fill(0, 120, 255, 255).translate(140, 140).scale(1.8));
  },

  'shape/matrix'(TVG, canvas) {
    canvas.add(
      new TVG.Shape()
        .appendRect(0, 0, 100, 100)
        .fill(140, 60, 200, 255)
        .transform({ e11: 1, e12: 0.5, e13: 30, e21: 0.2, e22: 1, e23: 30, e31: 0, e32: 0, e33: 1 })
    );
  },

  // --- Fill -----------------------------------------------------------------

  'fill/linear-gradient'(TVG, canvas) {
    const fill = new TVG.LinearGradient(20, 20, 180, 180)
      .addStop(0, [255, 0, 80, 255])
      .addStop(0.5, [255, 220, 0, 255])
      .addStop(1, [0, 160, 255, 255]);
    canvas.add(new TVG.Shape().appendRect(20, 20, 160, 160).fill(fill));
  },

  'fill/radial-gradient'(TVG, canvas) {
    const fill = new TVG.RadialGradient(100, 100, 80, 70, 70, 5)
      .addStop(0, [255, 255, 255, 255])
      .addStop(0.4, [80, 200, 255, 255])
      .addStop(1, [10, 30, 120, 255]);
    canvas.add(new TVG.Shape().appendCircle(100, 100, 80).fill(fill));
  },

  'fill/conic-gradient'(TVG, canvas) {
    const fill = new TVG.ConicGradient(100, 100, 0)
      .addStop(0, [255, 0, 0, 255])
      .addStop(0.33, [0, 255, 0, 255])
      .addStop(0.66, [0, 0, 255, 255])
      .addStop(1, [255, 0, 0, 255]);
    canvas.add(new TVG.Shape().appendCircle(100, 100, 80).fill(fill));
  },

  'fill/spread'(TVG, canvas) {
    const spreads = [TVG.GradientSpread.Pad, TVG.GradientSpread.Reflect, TVG.GradientSpread.Repeat];
    spreads.forEach((spread, i) => {
      const fill = new TVG.LinearGradient(80, 0, 120, 0)
        .addStop(0, [20, 20, 20, 255])
        .addStop(1, [250, 130, 0, 255])
        .spread(spread);
      canvas.add(new TVG.Shape().appendRect(10, 15 + i * 60, 180, 50).fill(fill));
    });
  },

  'fill/gradient-stroke'(TVG, canvas) {
    const gradient = new TVG.LinearGradient(30, 30, 170, 170).addStop(0, [0, 200, 120, 255]).addStop(1, [120, 0, 200, 255]);
    canvas.add(star(new TVG.Shape(), 100, 105, 80, 35).stroke({ width: 12, gradient, join: TVG.StrokeJoin.Round }));
  },

  // --- Composition ----------------------------------------------------------

  'composite/clip'(TVG, canvas) {
    const clipped = new TVG.Scene();
    clipped.add(backdrop(TVG));
    clipped.add(new TVG.Shape().appendRect(0, 90, SIZE, 20).fill(255, 255, 255, 255));
    clipped.clip(star(new TVG.Shape(), 100, 105, 90, 40));
    canvas.add(clipped);
  },

  'composite/mask-alpha'(TVG, canvas) {
    const target = backdrop(TVG);
    const mask = new TVG.Shape().appendCircle(100, 100, 75).fill(new TVG.RadialGradient(100, 100, 75)
      .addStop(0, [0, 0, 0, 255]).addStop(1, [0, 0, 0, 0]));
    canvas.add(target.mask(mask, TVG.MaskMethod.Alpha));
  },

  'composite/mask-inverse-alpha'(TVG, canvas) {
    const target = backdrop(TVG);
    canvas.add(target.mask(star(new TVG.Shape(), 100, 100, 85, 35).fill(0, 0, 0, 255), TVG.MaskMethod.InvAlpha));
  },

  'composite/mask-luma'(TVG, canvas) {
    const target = backdrop(TVG);
    const mask = new TVG.Shape()
      .appendRect(0, 0, SIZE, SIZE)
      .fill(new TVG.LinearGradient(0, 0, SIZE, 0).addStop(0, [0, 0, 0, 255]).addStop(1, [255, 255, 255, 255]));
    canvas.add(target.mask(mask, TVG.MaskMethod.Luma));
  },

  'composite/blend-modes'(TVG, canvas) {
    const modes = ['Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten', 'ColorDodge', 'ColorBurn', 'HardLight',
      'SoftLight', 'Difference', 'Exclusion', 'Add', 'Hue', 'Saturation', 'Color', 'Luminosity'];
    canvas.add(backdrop(TVG));
    modes.forEach((mode, i) => {
      const x = 10 + (i % 4) * 47;
      const y = 10 + Math.floor(i / 4) * 47;
      canvas.add(new TVG.Shape().appendRect(x, y, 40, 40, { rx: 6, ry: 6 }).fill(200, 40, 160, 255).blend(TVG.BlendMethod[mode]));
    });
  },

  'composite/visible-duplicate'(TVG, canvas) {
    const base = new TVG.Shape().appendRect(20, 20, 70, 70).fill(0, 170, 200, 255);
    const copy = base.duplicate().translate(90, 90);
    const hidden = base.duplicate().translate(90, 0).visible(false);
    canvas.add(base).add(copy).add(hidden);
  },

  // --- Scene ----------------------------------------------------------------

  'scene/nested'(TVG, canvas) {
    const inner = new TVG.Scene();
    inner.add(new TVG.Shape().appendRect(-25, -25, 50, 50).fill(255, 80, 0, 255));
    inner.add(new TVG.Shape().appendCircle(0, 0, 18).fill(255, 255, 255, 255));
    const outer = new TVG.Scene();
    for (let i = 0; i < 6; i++) {
      const copy = inner.duplicate();
      copy.translate(Math.cos((i * Math.PI) / 3) * 55, Math.sin((i * Math.PI) / 3) * 55).rotate(i * 15);
      outer.add(copy);
    }
    outer.translate(100, 100).opacity(200);
    canvas.add(outer);
  },

  'effect/gaussian-blur'(TVG, canvas) {
    const scene = new TVG.Scene();
    scene.add(star(new TVG.Shape(), 100, 100, 70, 30).fill(30, 100, 220, 255));
    scene.gaussianBlur(6);
    canvas.add(scene);
  },

  'effect/drop-shadow'(TVG, canvas) {
    const scene = new TVG.Scene();
    scene.add(new TVG.Shape().appendRect(40, 40, 110, 110, { rx: 16, ry: 16 }).fill(255, 255, 255, 255));
    scene.dropShadow(0, 0, 0, 160, 45, 12, 8);
    canvas.add(new TVG.Shape().appendRect(0, 0, SIZE, SIZE).fill(230, 235, 240, 255));
    canvas.add(scene);
  },

  'effect/fill'(TVG, canvas) {
    const scene = new TVG.Scene();
    scene.add(star(new TVG.Shape(), 100, 100, 80, 35).fill(0, 0, 0, 255));
    scene.fillEffect(255, 60, 120, 255);
    canvas.add(scene);
  },

  'effect/motion-blur'(TVG, canvas) {
    const scene = new TVG.Scene();
    scene.add(new TVG.Shape().appendCircle(100, 100, 50).fill(220, 60, 40, 255));
    scene.motionBlur(30, 30);
    canvas.add(scene);
  },

  'effect/tint'(TVG, canvas) {
    const scene = new TVG.Scene();
    scene.add(backdrop(TVG));
    scene.tint(20, 0, 60, 255, 240, 200, 80);
    canvas.add(scene);
  },

  'effect/tritone'(TVG, canvas) {
    const scene = new TVG.Scene();
    scene.add(backdrop(TVG));
    scene.tritone(40, 0, 80, 230, 60, 90, 255, 230, 120, 0);
    canvas.add(scene);
  },

  // --- Picture --------------------------------------------------------------

  'picture/svg'(TVG, canvas, assets) {
    canvas.add(fit(new TVG.Picture().load(assets['test2.svg'], { type: 'svg' })));
  },

  'picture/svg-filter'(TVG, canvas, assets) {
    canvas.add(fit(new TVG.Picture().load(assets['test1.svg'], { type: 'svg' })));
  },

  'picture/png'(TVG, canvas, assets) {
    canvas.add(fit(new TVG.Picture().load(assets['test.png'], { type: 'png' })));
  },

  'picture/jpg'(TVG, canvas, assets) {
    canvas.add(fit(new TVG.Picture().load(assets['test.jpg'], { type: 'jpg' })));
  },

  'picture/webp'(TVG, canvas, assets) {
    canvas.add(fit(new TVG.Picture().load(assets['test.webp'], { type: 'webp' })));
  },

  'picture/raw'(TVG, canvas, assets) {
    const picture = new TVG.Picture().load(assets['rawimage_200x300.raw'], { type: 'raw', width: 200, height: 300 });
    canvas.add(fit(picture).translate(33, 0));
  },

  'picture/transform-origin'(TVG, canvas, assets) {
    const picture = new TVG.Picture().load(assets['test.png'], { type: 'png' });
    fit(picture, 120).origin(0.5, 0.5);
    canvas.add(picture.translate(100, 100).rotate(25));
  },

  'picture/filter-nearest'(TVG, canvas, assets) {
    const picture = new TVG.Picture().load(assets['rawimage_200x300.raw'], { type: 'raw', width: 200, height: 300 });
    picture.size(20, 30).filter(TVG.FilterMethod.Nearest).scale(6.5);
    canvas.add(picture.translate(35, 2));
  },

  'picture/asset-resolver'(TVG, canvas, assets) {
    // The Lottie references an external "logo.png"; the resolver supplies the bytes.
    // Frame 60: the image layer is not visible yet at frame 0.
    const animation = new TVG.LottieAnimation();
    animation.picture.resolver((paint, src) => {
      if (!src.endsWith('logo.png')) return false;
      paint.load(assets['test.png'], { type: 'png' });
      return true;
    });
    animation.load(assets['resolver.json']);
    canvas.add(fit(animation.picture));
    animation.frame(60);
  },

  'picture/paint-lookup'(TVG, canvas, assets) {
    const animation = new TVG.LottieAnimation().load(assets['test11.lot']);
    canvas.add(fit(animation.picture));
    animation.frame(40);
    animation.picture.paint('Shape Layer from test28').visible(false);
    animation.picture.paint('Shape Layer from test30').opacity(90);
  },

  // --- Accessor -------------------------------------------------------------

  'accessor/recolor'(TVG, canvas, assets) {
    const picture = new TVG.Picture().load(assets['test2.svg'], { type: 'svg' });
    let index = 0;
    new TVG.Accessor().set(picture, (paint) => {
      if (paint instanceof TVG.Shape) paint.fill(index++ % 2 ? 255 : 30, 120, index % 3 ? 220 : 40, 255);
      return true;
    });
    canvas.add(fit(picture));
  },

  // --- Text -----------------------------------------------------------------

  'text/default-font'(TVG, canvas) {
    canvas.add(new TVG.Text().font('default').fontSize(36).text('ThorVG').fill(20, 20, 20).translate(20, 30));
    canvas.add(new TVG.Text().font('default').fontSize(22).text('Hello 123').fill(200, 40, 40).translate(20, 110));
  },

  'text/custom-font-gradient'(TVG, canvas, assets) {
    TVG.Font.load('PublicSans', assets['PublicSans-Regular.ttf'], { type: 'ttf' });
    const gradient = new TVG.LinearGradient(0, 0, 160, 0).addStop(0, [255, 0, 120, 255]).addStop(1, [0, 120, 255, 255]);
    canvas.add(new TVG.Text().font('PublicSans').fontSize(44).text('Vector').fill(gradient).translate(15, 60));
  },

  'text/outline-italic'(TVG, canvas) {
    canvas.add(
      new TVG.Text().font('default').fontSize(48).text('Bold').fill(255, 220, 0).outline(3, 30, 30, 30).italic(0.25).translate(25, 60)
    );
  },

  'text/layout-wrap'(TVG, canvas) {
    canvas.add(
      new TVG.Text()
        .font('default')
        .fontSize(20)
        .text('The quick brown fox jumps over the lazy dog')
        .fill(30, 30, 30)
        .layout(170, 170)
        .wrap(TVG.TextWrapMode.Word)
        .align(0.5, 0.5)
        .spacing(1, 1.2)
        .translate(15, 15)
    );
  },

  // --- Lottie ---------------------------------------------------------------

  'animation/base-class'(TVG, canvas, assets) {
    const animation = new TVG.Animation().load(assets['test.lot']);
    canvas.add(fit(animation.picture));
    animation.frame(30);
  },

  'lottie/frame'(TVG, canvas, assets) {
    const animation = new TVG.LottieAnimation().load(assets['test.lot']);
    canvas.add(fit(animation.picture));
    animation.frame(60);
  },

  'lottie/mid-frame'(TVG, canvas, assets) {
    const animation = new TVG.LottieAnimation().load(assets['test5.lot']);
    canvas.add(fit(animation.picture));
    animation.frame(animation.info().totalFrames / 2);
  },

  'lottie/marker-segment'(TVG, canvas, assets) {
    const animation = new TVG.LottieAnimation().load(assets['segment.lot']);
    const { begin, end } = animation.marker(1);
    animation.segment(begin, end);
    canvas.add(fit(animation.picture));
    animation.frame((begin + end) / 2);
  },

  'lottie/quality'(TVG, canvas, assets) {
    const animation = new TVG.LottieAnimation().load(assets['test10.lot']); // has layer effects
    animation.quality(10);
    canvas.add(fit(animation.picture));
    animation.frame(45);
  },

  'lottie/slot'(TVG, canvas, assets) {
    const animation = new TVG.LottieAnimation().load(assets['test11.lot']);
    const id = animation.gen({ bg_color: { p: { a: 0, k: [0.1, 0.8, 0.4] } } });
    animation.apply(id);
    canvas.add(fit(animation.picture));
    animation.frame(30);
  },

  // --- Canvas ---------------------------------------------------------------

  'canvas/viewport'(TVG, canvas) {
    canvas.add(backdrop(TVG));
    canvas.add(star(new TVG.Shape(), 100, 100, 90, 40).fill(255, 255, 255, 255));
    // ThorVG only accepts a viewport once the canvas has drawn (both runtimes agree).
    canvas.render();
    canvas.viewport(40, 30, 120, 140);
  },
};

// Shared by both sides: create the canvas, run the case, render once.
export function renderCase(TVG, name, target, assets) {
  const canvas = new TVG.Canvas(target, { width: SIZE, height: SIZE, enableDevicePixelRatio: false });
  cases[name](TVG, canvas, assets);
  canvas.update().render();
  return canvas;
}
