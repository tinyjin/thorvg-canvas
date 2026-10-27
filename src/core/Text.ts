import { Paint } from './Paint';
import { Fill } from './Fill';
import { checkResult } from '../common/errors';
import { getNative, type Handle } from '../native/binding';
import type { TextWrapMode } from '../common/constants';

export class Text extends Paint {
  constructor(handle?: Handle) {
    super(handle ?? getNative().tvg_text_new());
  }

  protected _createInstance(handle: Handle): Text {
    return new Text(handle);
  }

  public font(name: string): this {
    checkResult(getNative().tvg_text_set_font(this.handle, name), 'font');
    return this;
  }

  public text(content: string): this {
    checkResult(getNative().tvg_text_set_text(this.handle, content), 'text');
    return this;
  }

  public fontSize(size: number): this {
    checkResult(getNative().tvg_text_set_size(this.handle, size), 'fontSize');
    return this;
  }

  public fill(gradient: Fill): this;
  public fill(r: number, g: number, b: number): this;
  public fill(gradientOrR: Fill | number, g?: number, b?: number): this {
    const native = getNative();
    if (gradientOrR instanceof Fill) {
      gradientOrR._applyStops();
      checkResult(
        native.tvg_text_set_gradient(this.handle, gradientOrR.handle),
        'fill (gradient)'
      );
      gradientOrR._markFilled();
    } else if (
      typeof gradientOrR === 'number' &&
      g !== undefined &&
      b !== undefined
    ) {
      checkResult(
        native.tvg_text_set_color(this.handle, gradientOrR, g, b),
        'fill (color)'
      );
    } else {
      throw new TypeError('Invalid fill arguments');
    }
    return this;
  }

  public align(x: number, y: number): this {
    checkResult(getNative().tvg_text_align(this.handle, x, y), 'align');
    return this;
  }

  public layout(width: number, height: number = 0): this {
    checkResult(getNative().tvg_text_layout(this.handle, width, height), 'layout');
    return this;
  }

  public wrap(mode: TextWrapMode): this {
    checkResult(getNative().tvg_text_wrap_mode(this.handle, mode), 'wrap');
    return this;
  }

  public lines(): number {
    return getNative().tvg_text_line_count(this.handle);
  }

  public spacing(letter: number, line: number): this {
    checkResult(
      getNative().tvg_text_spacing(this.handle, letter, line),
      'spacing'
    );
    return this;
  }

  public italic(shear: number = 0.18): this {
    checkResult(getNative().tvg_text_set_italic(this.handle, shear), 'italic');
    return this;
  }

  public outline(width: number, r: number, g: number, b: number): this {
    checkResult(
      getNative().tvg_text_set_outline(this.handle, width, r, g, b),
      'outline'
    );
    return this;
  }
}

Paint.registerType(4, (handle) => new Text(handle));
