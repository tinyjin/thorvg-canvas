import type { Bounds, Matrix } from '../common/types';
import { NativeObject } from '../native/NativeObject';
import { checkResult, handleError } from '../common/errors';
import { getNative, type Handle } from '../native/binding';
import type { BlendMethod, MaskMethod } from '../common/constants';

export interface Point {
  x: number;
  y: number;
}

type PaintFactory = (handle: Handle) => Paint;

const paintFactories = new Map<number, PaintFactory>();

export abstract class Paint extends NativeObject {
  static registerType(type: number, factory: PaintFactory): void {
    paintFactories.set(type, factory);
  }

  /** @internal */
  public _retains = 0;

  protected _cleanup(handle: Handle): void {
    getNative().tvg_paint_unref(handle, true);
  }

  public get id(): number {
    return getNative().tvg_paint_get_id(this.handle);
  }

  public set id(value: number | string) {
    const native = getNative();
    const id =
      typeof value === 'string' ? native.tvg_accessor_generate_id(value) : value;
    checkResult(native.tvg_paint_set_id(this.handle, id), 'id');
  }

  public translate(x: number, y: number): this {
    getNative().tvg_paint_translate(this.handle, x, y);
    return this;
  }

  public rotate(angle: number): this {
    getNative().tvg_paint_rotate(this.handle, angle);
    return this;
  }

  public scale(factor: number): this {
    getNative().tvg_paint_scale(this.handle, factor);
    return this;
  }

  public blend(method: BlendMethod): this {
    checkResult(
      getNative().tvg_paint_set_blend_method(this.handle, method),
      'blend'
    );
    return this;
  }

  public opacity(): number;
  public opacity(value: number): this;
  public opacity(value?: number): number | this {
    const native = getNative();
    if (value !== undefined) {
      native.tvg_paint_set_opacity(this.handle, value);
      return this;
    }
    return native.tvg_paint_get_opacity(this.handle);
  }

  public visible(): boolean;
  public visible(value: boolean): this;
  public visible(value?: boolean): boolean | this {
    const native = getNative();
    if (value !== undefined) {
      native.tvg_paint_set_visible(this.handle, value);
      return this;
    }
    return native.tvg_paint_get_visible(this.handle);
  }

  public bounds(): Bounds;
  public bounds(options: { oriented: true }): Point[];
  public bounds(options?: { oriented?: boolean }): Bounds | Point[] {
    const native = getNative();
    if (options?.oriented) {
      const pts = native.tvg_paint_get_obb(this.handle);
      if (!pts) return [];
      return [
        { x: pts[0]!, y: pts[1]! },
        { x: pts[2]!, y: pts[3]! },
        { x: pts[4]!, y: pts[5]! },
        { x: pts[6]!, y: pts[7]! },
      ];
    }
    const [x = 0, y = 0, width = 0, height = 0] = native.tvg_paint_get_aabb(
      this.handle
    );
    return { x, y, width, height };
  }

  public duplicate<T extends Paint>(): T {
    const handle = getNative().tvg_paint_duplicate(this.handle);
    if (!handle) {
      handleError('Failed to duplicate paint', 'duplicate');
    }
    return this._createInstance(handle as Handle) as T;
  }

  public transform(matrix: Matrix): this {
    const m = new Float32Array([
      matrix.e11,
      matrix.e12,
      matrix.e13,
      matrix.e21,
      matrix.e22,
      matrix.e23,
      matrix.e31,
      matrix.e32,
      matrix.e33,
    ]);
    checkResult(getNative().tvg_paint_set_transform(this.handle, m), 'transform');
    return this;
  }

  public clip(clipper: Paint): this {
    const native = getNative();
    checkResult(native.tvg_paint_set_clip(this.handle, clipper.handle), 'clip');
    native.tvg_paint_ref(clipper.handle);
    return this;
  }

  public mask(target: Paint, method: MaskMethod): this {
    const native = getNative();
    checkResult(
      native.tvg_paint_set_mask_method(this.handle, target.handle, method),
      'mask'
    );
    native.tvg_paint_ref(target.handle);
    return this;
  }

  public intersects(
    x: number,
    y: number,
    width: number,
    height: number,
    visibleOnly: boolean = false
  ): boolean {
    return getNative().tvg_paint_intersects_region(
      this.handle,
      x,
      y,
      width,
      height,
      visibleOnly
    );
  }

  protected abstract _createInstance(handle: Handle): Paint;

  static fromHandle(handle: Handle): Paint {
    const type = getNative().tvg_paint_get_type(handle);
    const factory = paintFactories.get(type);
    if (!factory) throw new Error(`Unknown paint type: ${type}`);
    return factory(handle);
  }
}
