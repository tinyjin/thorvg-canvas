import { Fill } from './Fill';
import { getNative } from '../native/binding';

export class ConicGradient extends Fill {
  constructor(cx: number, cy: number, angle: number = 0) {
    const native = getNative();
    const handle = native.tvg_conic_gradient_new();
    super(handle);
    native.tvg_conic_gradient_set(handle, cx, cy, angle);
  }

  public build(): this {
    this._applyStops();
    return this;
  }
}
