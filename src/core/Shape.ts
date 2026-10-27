import type { RectOptions, StrokeOptions } from '../common/types';
import { Paint } from './Paint';
import { Fill } from './Fill';
import { checkResult } from '../common/errors';
import { getNative, type Handle } from '../native/binding';
import type { FillRule, PathCommand } from '../common/constants';

type NativeStrokeOptions = Omit<StrokeOptions, 'gradient'> & {
  gradient?: Fill;
};

export class Shape extends Paint {
  constructor(handle?: Handle) {
    super(handle ?? getNative().tvg_shape_new());
  }

  protected _createInstance(handle: Handle): Shape {
    return new Shape(handle);
  }

  public moveTo(x: number, y: number): this {
    checkResult(getNative().tvg_shape_move_to(this.handle, x, y), 'moveTo');
    return this;
  }

  public lineTo(x: number, y: number): this {
    checkResult(getNative().tvg_shape_line_to(this.handle, x, y), 'lineTo');
    return this;
  }

  public cubicTo(
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x: number,
    y: number
  ): this {
    checkResult(
      getNative().tvg_shape_cubic_to(this.handle, cx1, cy1, cx2, cy2, x, y),
      'cubicTo'
    );
    return this;
  }

  public close(): this {
    checkResult(getNative().tvg_shape_close(this.handle), 'close');
    return this;
  }

  public appendRect(
    x: number,
    y: number,
    w: number,
    h: number,
    options: RectOptions = {}
  ): this {
    const { rx = 0, ry = 0, clockwise = true } = options;
    checkResult(
      getNative().tvg_shape_append_rect(
        this.handle,
        x,
        y,
        w,
        h,
        rx,
        ry,
        clockwise
      ),
      'appendRect'
    );
    return this;
  }

  public appendCircle(
    cx: number,
    cy: number,
    rx: number,
    ry: number = rx,
    clockwise: boolean = true
  ): this {
    checkResult(
      getNative().tvg_shape_append_circle(this.handle, cx, cy, rx, ry, clockwise),
      'appendCircle'
    );
    return this;
  }

  public appendPath(
    commands: readonly PathCommand[],
    points: ReadonlyArray<readonly number[]>
  ): this {
    if (commands.length === 0) return this;
    const pts = new Float32Array(points.length * 2);
    for (let i = 0; i < points.length; i++) {
      const point = points[i]!;
      pts[i * 2] = point[0]!;
      pts[i * 2 + 1] = point[1]!;
    }
    checkResult(
      getNative().tvg_shape_append_path(
        this.handle,
        Uint8Array.from(commands),
        pts
      ),
      'appendPath'
    );
    return this;
  }

  public path(): { commands: PathCommand[]; points: Array<[number, number]> } {
    const { result, commands, points } = getNative().tvg_shape_get_path(
      this.handle
    );
    checkResult(result, 'path');
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i + 1 < points.length; i += 2) {
      pairs.push([points[i]!, points[i + 1]!]);
    }
    return { commands: commands as PathCommand[], points: pairs };
  }

  public fillRule(rule: FillRule): this {
    checkResult(
      getNative().tvg_shape_set_fill_rule(this.handle, rule),
      'fillRule'
    );
    return this;
  }

  public trimPath(
    begin: number,
    end: number,
    simultaneous: boolean = true
  ): this {
    checkResult(
      getNative().tvg_shape_set_trimpath(this.handle, begin, end, simultaneous),
      'trimPath'
    );
    return this;
  }

  public fill(gradient: Fill): this;
  public fill(r: number, g: number, b: number, a?: number): this;
  public fill(
    gradientOrR: Fill | number,
    g?: number,
    b?: number,
    a: number = 255
  ): this {
    const native = getNative();
    if (gradientOrR instanceof Fill) {
      gradientOrR._applyStops();
      checkResult(
        native.tvg_shape_set_gradient(this.handle, gradientOrR.handle),
        'fill (gradient)'
      );
      gradientOrR._markFilled();
    } else if (
      typeof gradientOrR === 'number' &&
      g !== undefined &&
      b !== undefined
    ) {
      checkResult(
        native.tvg_shape_set_fill_color(this.handle, gradientOrR, g, b, a),
        'fill (color)'
      );
    } else {
      throw new TypeError('Invalid fill arguments');
    }
    return this;
  }

  public stroke(width: number): this;
  public stroke(options: NativeStrokeOptions): this;
  public stroke(widthOrOptions: number | NativeStrokeOptions): this {
    const native = getNative();

    if (typeof widthOrOptions === 'number') {
      checkResult(
        native.tvg_shape_set_stroke_width(this.handle, widthOrOptions),
        'stroke (width)'
      );
      return this;
    }

    const { width, color, cap, join, gradient, miterLimit, dash, dashOffset } =
      widthOrOptions;

    if (width !== undefined) {
      checkResult(
        native.tvg_shape_set_stroke_width(this.handle, width),
        'stroke (width)'
      );
    }

    if (color) {
      const [r, g, b, a = 255] = color;
      checkResult(
        native.tvg_shape_set_stroke_color(this.handle, r, g, b, a),
        'stroke (color)'
      );
    }

    if (gradient) {
      gradient._applyStops();
      checkResult(
        native.tvg_shape_set_stroke_gradient(this.handle, gradient.handle),
        'stroke (gradient)'
      );
      gradient._markFilled();
    }

    if (cap !== undefined) {
      checkResult(
        native.tvg_shape_set_stroke_cap(this.handle, cap),
        'stroke (cap)'
      );
    }

    if (join !== undefined) {
      checkResult(
        native.tvg_shape_set_stroke_join(this.handle, join),
        'stroke (join)'
      );
    }

    if (miterLimit !== undefined) {
      checkResult(
        native.tvg_shape_set_stroke_miterlimit(this.handle, miterLimit),
        'stroke (miterLimit)'
      );
    }

    if (dash !== undefined || dashOffset !== undefined) {
      let pattern = dash;
      const offset = dashOffset ?? 0;

      if (pattern === undefined && dashOffset !== undefined) {
        const current = native.tvg_shape_get_stroke_dash(this.handle);
        if (current.result === 0 && current.pattern.length > 0) {
          pattern = current.pattern;
        }
      }

      if (pattern !== undefined) {
        if (pattern.length === 0) {
          checkResult(
            native.tvg_shape_set_stroke_dash(this.handle, null, 0),
            'stroke (dash reset)'
          );
        } else {
          checkResult(
            native.tvg_shape_set_stroke_dash(
              this.handle,
              new Float32Array(pattern),
              offset
            ),
            'stroke (dash)'
          );
        }
      }
    }

    return this;
  }

  public order(strokeFirst: boolean): this {
    checkResult(
      getNative().tvg_shape_set_paint_order(this.handle, strokeFirst),
      'order'
    );
    return this;
  }

  public reset(): this {
    checkResult(getNative().tvg_shape_reset(this.handle), 'reset');
    return this;
  }
}

Paint.registerType(1, (handle) => new Shape(handle));
