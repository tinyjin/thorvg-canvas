import type { ImageFormat, NodeCanvasOptions, RawImage } from '../types';
import type { Paint } from './Paint';
import { Scene } from './Scene';
import { checkResult, handleError } from '../common/errors';
import { EngineOption } from '../common/constants';
import { getNative, type CanvasHandle } from '../native/binding';
import { encodePng } from '../encode/png';
import { writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

function formatOf(path: string, format?: ImageFormat): ImageFormat {
  if (format) return format;
  const ext = extname(path).slice(1).toLowerCase();
  if (ext === 'png' || ext === 'raw') return ext;
  throw new Error(
    `thorvg-canvas: cannot export "${path}": unsupported format "${ext || '(none)'}". Supported: png, raw.`
  );
}

const disposeSymbol: symbol =
  (Symbol as { dispose?: symbol }).dispose ?? Symbol.for('nodejs.dispose');

/**
 * Headless counterpart of webcanvas' `Canvas`: same scene API, but it renders
 * into memory instead of an HTML canvas element.
 *
 * ```ts
 * const canvas = new Canvas({ width: 512, height: 512 });
 * canvas.add(shape).render();
 * const png = await canvas.toBuffer('png');
 * ```
 */
export class Canvas {
  #handle: CanvasHandle | null = null;
  #mainScene: Scene | null = null;
  #logicalWidth: number;
  #logicalHeight: number;
  #pixelRatio: number;
  #width = 0;
  #height = 0;
  #needsUpdate = false;

  /**
   * `target` is webcanvas compat option (`new Canvas('#c', opts)`)
   */
  constructor(options?: NodeCanvasOptions);
  constructor(target: unknown, options?: NodeCanvasOptions);
  constructor(targetOrOptions?: unknown, maybeOptions?: NodeCanvasOptions) {
    const options: NodeCanvasOptions =
      maybeOptions ??
      (targetOrOptions !== null && typeof targetOrOptions === 'object'
        ? (targetOrOptions as NodeCanvasOptions)
        : {});
    const {
      width = 800,
      height = 600,
      pixelRatio = 1,
      engineOption = EngineOption.Default,
    } = options;

    this.#logicalWidth = width;
    this.#logicalHeight = height;
    this.#pixelRatio = pixelRatio > 0 ? pixelRatio : 1;

    const native = getNative();
    const handle = native.canvas_create(engineOption);
    if (!handle) {
      handleError('Failed to create canvas with sw renderer', 'Canvas constructor');
      return;
    }
    this.#handle = handle;
    this.#applySize();

    this.#mainScene = new Scene();
    if (this.#pixelRatio !== 1) {
      this.#mainScene.scale(this.#pixelRatio);
    }
    checkResult(native.tvg_canvas_add(handle, this.#mainScene.handle), 'add main scene');
    native.tvg_paint_ref(this.#mainScene.handle);
  }

  public add(paint: Paint): this {
    if (!this.#mainScene) {
      handleError('Main scene not initialized', 'add');
      return this;
    }
    this.#mainScene.add(paint);
    this.#needsUpdate = true;
    return this;
  }

  public remove(paint?: Paint): this {
    if (!this.#mainScene) {
      handleError('Main scene not initialized', 'remove');
      return this;
    }
    if (paint) {
      this.#mainScene.remove(paint);
    } else {
      this.#mainScene.remove();
    }
    this.#needsUpdate = true;
    return this;
  }

  public clear(): this {
    if (!this.#handle || !this.#mainScene) {
      return this;
    }
    this.#mainScene.clear();
    checkResult(getNative().canvas_render(this.#handle, true), 'clear');
    this.#needsUpdate = false;
    return this;
  }

  public update(): this {
    if (!this.#handle) {
      return this;
    }
    checkResult(getNative().tvg_canvas_update(this.#handle), 'update');
    return this;
  }

  public render(): this {
    if (!this.#handle) {
      return this;
    }
    checkResult(getNative().canvas_render(this.#handle, this.#needsUpdate), 'render');
    this.#needsUpdate = false;
    return this;
  }

  /**
   * Renders on the libuv thread pool instead of blocking the event loop. Until
   * the promise settles, any other ThorVG call throws: the scene must not change
   * while it is being rasterized.
   */
  public async renderAsync(): Promise<this> {
    if (!this.#handle) {
      return this;
    }
    const update = this.#needsUpdate;
    this.#needsUpdate = false;
    checkResult(await getNative().canvas_render_async(this.#handle, update), 'renderAsync');
    return this;
  }

  public resize(width: number, height: number): this {
    this.#logicalWidth = width;
    this.#logicalHeight = height;
    this.#applySize();
    return this;
  }

  public viewport(x: number, y: number, w: number, h: number): this {
    if (!this.#handle) {
      return this;
    }
    checkResult(getNative().tvg_canvas_set_viewport(this.#handle, x, y, w, h), 'viewport');
    return this;
  }

  public destroy(): void {
    if (this.#mainScene) {
      this.#mainScene.clear();
      this.#mainScene.dispose();
      this.#mainScene = null;
    }
    if (this.#handle) {
      getNative().canvas_destroy(this.#handle);
      this.#handle = null;
    }
  }

  public [disposeSymbol](): void {
    this.destroy();
  }

  public get renderer(): string {
    return 'sw';
  }

  public get dpr(): number {
    return this.#pixelRatio;
  }

  /** Output width in pixels (logical width × pixelRatio). */
  public get width(): number {
    return this.#width;
  }

  /** Output height in pixels (logical height × pixelRatio). */
  public get height(): number {
    return this.#height;
  }

  /** A copy of the last rendered frame. */
  public getImageData(): RawImage {
    const pixels = this.#handle ? getNative().canvas_pixels(this.#handle) : new Uint8Array(0);
    return {
      data: new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.byteLength),
      width: this.#width,
      height: this.#height,
    };
  }

  /** Encodes the last rendered frame. Compression runs off the event loop. */
  public async toBuffer(format: ImageFormat = 'png'): Promise<Buffer> {
    const image = this.getImageData();
    return format === 'raw' ? rawBuffer(image) : encodePng(image, false);
  }

  public toBufferSync(format: ImageFormat = 'png'): Buffer {
    const image = this.getImageData();
    return format === 'raw' ? rawBuffer(image) : encodePng(image, true);
  }

  /** Writes the last rendered frame to `path`; the format comes from the extension. */
  public async toFile(path: string, format?: ImageFormat): Promise<void> {
    await writeFile(path, await this.toBuffer(formatOf(path, format)));
  }

  public toFileSync(path: string, format?: ImageFormat): void {
    writeFileSync(path, this.toBufferSync(formatOf(path, format)));
  }

  #applySize(): void {
    if (!this.#handle) return;
    this.#width = Math.max(1, Math.floor(this.#logicalWidth * this.#pixelRatio));
    this.#height = Math.max(1, Math.floor(this.#logicalHeight * this.#pixelRatio));
    checkResult(getNative().canvas_resize(this.#handle, this.#width, this.#height), 'resize');
  }
}

function rawBuffer(image: RawImage): Buffer {
  return Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength);
}
