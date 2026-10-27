import { Fill } from './Fill';
import { getNative } from '../native/binding';

export class LinearGradient extends Fill {
  constructor(x1: number, y1: number, x2: number, y2: number) {
    const native = getNative();
    const handle = native.tvg_linear_gradient_new();
    super(handle);
    native.tvg_linear_gradient_set(handle, x1, y1, x2, y2);
  }

  public build(): this {
    this._applyStops();
    return this;
  }
}
