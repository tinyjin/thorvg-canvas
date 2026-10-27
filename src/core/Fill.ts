import type { ColorStop } from '../common/types';
import { NativeObject } from '../native/NativeObject';
import { getNative, type Handle } from '../native/binding';
import type { GradientSpread } from '../common/constants';

interface ColorStopEntry {
  offset: number;
  color: ColorStop;
}

export abstract class Fill extends NativeObject {
  protected _filled = false;
  protected _stops: ColorStopEntry[] = [];

  _markFilled(): void {
    this._filled = true;
    getNative().disown(this.handle);
  }

  protected _cleanup(handle: Handle): void {
    if (this._filled) return;
    getNative().tvg_gradient_del(handle);
  }

  public addStop(offset: number, color: ColorStop): this {
    this._stops.push({ offset, color });
    return this;
  }

  public clearStops(): this {
    this._stops = [];
    return this;
  }

  public setStops(...stops: Array<[number, ColorStop]>): this {
    this._stops = [];
    for (const [offset, color] of stops) {
      this._stops.push({ offset, color });
    }
    return this;
  }

  _applyStops(): void {
    if (this._stops.length === 0) return;
    const count = this._stops.length;
    const bytes = new Uint8Array(count * 8);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < count; i++) {
      const stop = this._stops[i]!;
      const offset = i * 8;
      view.setFloat32(offset, stop.offset, true);
      view.setUint8(offset + 4, stop.color[0]);
      view.setUint8(offset + 5, stop.color[1]);
      view.setUint8(offset + 6, stop.color[2]);
      view.setUint8(offset + 7, stop.color[3]);
    }
    try {
      getNative().tvg_gradient_set_color_stops(this.handle, bytes);
    } finally {
      this._stops = [];
    }
  }

  public spread(type: GradientSpread): this {
    getNative().tvg_gradient_set_spread(this.handle, type);
    return this;
  }
}
