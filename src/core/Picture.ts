import type { LoadDataOptions, PictureSize } from '../common/types';
import { Paint } from './Paint';
import { registerCallback, unregisterCallback } from '../native/callbacks';
import { checkResult, handleError, ThorVGResultCode } from '../common/errors';
import { ColorSpace, FilterMethod } from '../common/constants';
import { getNative, type Handle } from '../native/binding';

export type AssetResolver = (paint: Paint, src: string) => boolean;

export class Picture extends Paint {
  public _owner: object | null = null;
  #resolver: AssetResolver | null = null;
  #resolverId = 0;
  #accessible = false;

  constructor(handle?: Handle) {
    super(handle ?? getNative().tvg_picture_new());
  }

  protected _createInstance(handle: Handle): Picture {
    return new Picture(handle);
  }

  public get accessible(): boolean {
    return this.#accessible;
  }

  public set accessible(value: boolean) {
    checkResult(
      getNative().tvg_picture_set_accessible(this.handle, value),
      'accessible'
    );
    this.#accessible = value;
  }

  public resolver(callback: AssetResolver | null): this {
    const native = getNative();

    this.#releaseResolver();
    this.#resolver = callback;

    if (!callback) {
      const result = native.tvg_picture_set_asset_resolver(this.handle, 0);
      if (
        result !== ThorVGResultCode.Success &&
        result !== ThorVGResultCode.InsufficientCondition
      ) {
        checkResult(result, 'resolver');
      }
      return this;
    }

    const self = new WeakRef(this);
    this.#resolverId = registerCallback((handle: Handle, src: string) => {
      const picture = self.deref();
      const resolver = picture ? picture.#resolver : null;
      if (!resolver) return false;
      try {
        return resolver(Paint.fromHandle(handle), src);
      } catch {
        return false;
      }
    });
    checkResult(
      native.tvg_picture_set_asset_resolver(this.handle, this.#resolverId),
      'resolver'
    );
    return this;
  }

  public override dispose(): void {
    this.#releaseResolver();
    this.#resolver = null;
    this._owner = null;
    super.dispose();
  }

  public load(data: Uint8Array | string, options: LoadDataOptions = {}): this {
    const native = getNative();
    const {
      type = 'svg',
      width,
      height,
      colorSpace = ColorSpace.ARGB8888,
    } = options;

    if (type === 'raw') {
      if (!width || !height) {
        handleError(
          'Width and height are required for raw image format',
          'load'
        );
        return this;
      }
      const bytes =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;
      checkResult(
        native.tvg_picture_load_raw(this.handle, bytes, width, height, colorSpace),
        'load'
      );
      return this;
    }

    checkResult(native.tvg_picture_load_data(this.handle, data, type), 'load');
    return this;
  }

  public size(width: number, height: number): this;
  public size(): PictureSize;
  public size(width?: number, height?: number): this | PictureSize {
    const native = getNative();
    if (width !== undefined && height !== undefined) {
      checkResult(
        native.tvg_picture_set_size(this.handle, width, height),
        'size (set)'
      );
      return this;
    }
    const [w = 0, h = 0] = native.tvg_picture_get_size(this.handle);
    return { width: w, height: h };
  }

  public origin(x: number, y: number): this {
    checkResult(getNative().tvg_picture_set_origin(this.handle, x, y), 'origin');
    return this;
  }

  public paint(id: number): Paint | null;
  public paint(name: string): Paint | null;
  public paint(id: number | string): Paint | null {
    const native = getNative();
    const numericId =
      typeof id === 'string' ? native.tvg_accessor_generate_id(id) : id;
    const handle = native.tvg_picture_get_paint(this.handle, numericId);
    return handle ? Paint.fromHandle(handle) : null;
  }

  public filter(method: FilterMethod = FilterMethod.Bilinear): this {
    checkResult(getNative().tvg_picture_set_filter(this.handle, method), 'filter');
    return this;
  }

  #releaseResolver(): void {
    if (this.#resolverId) {
      unregisterCallback(this.#resolverId);
      this.#resolverId = 0;
    }
  }
}

Paint.registerType(3, (handle) => new Picture(handle));
