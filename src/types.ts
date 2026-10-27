import type {
  Canvas as WebCanvas,
  CanvasOptions,
  ThorVGNamespace as WebCanvasNamespace,
} from '@thorvg/webcanvas';

// DOM type stubs for webcanvas' declarations.
declare global {
  interface HTMLCanvasElement {}
  interface OffscreenCanvas {}
}

export interface NodeCanvasOptions extends CanvasOptions {
  /**
   * Output scale. There is no display in Node, so `enableDevicePixelRatio` has
   * nothing to read from; set this instead to render at 2x, 3x, ... while drawing
   * in logical units. Default: 1
   */
  pixelRatio?: number;
}

export type ImageFormat = 'png' | 'raw';

export interface RawImage {
  /** Straight-alpha RGBA, row-major, `width * 4` bytes per row. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Canvas extends WebCanvas {
  readonly width: number;
  readonly height: number;
  renderAsync(): Promise<this>;
  getImageData(): RawImage;
  toBuffer(format?: ImageFormat): Promise<Buffer>;
  toBufferSync(format?: ImageFormat): Buffer;
  toFile(path: string, format?: ImageFormat): Promise<void>;
  toFileSync(path: string, format?: ImageFormat): void;
  [Symbol.dispose](): void;
}

export interface CanvasConstructor {
  new (options?: NodeCanvasOptions): Canvas;
  new (target: unknown, options?: NodeCanvasOptions): Canvas; // target is webcanvas compat option
}

export type ThorVGNamespace = Omit<WebCanvasNamespace, 'Canvas' | 'Video'> & {
  Canvas: CanvasConstructor;
};
