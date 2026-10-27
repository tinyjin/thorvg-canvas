import { Fill } from './Fill';
import { getNative } from '../native/binding';

export class RadialGradient extends Fill {
  constructor(
    cx: number,
    cy: number,
    r: number,
    fx: number = cx,
    fy: number = cy,
    fr: number = 0
  ) {
    const native = getNative();
    const handle = native.tvg_radial_gradient_new();
    super(handle);
    native.tvg_radial_gradient_set(handle, cx, cy, r, fx, fy, fr);
  }

  public build(): this {
    this._applyStops();
    return this;
  }
}
