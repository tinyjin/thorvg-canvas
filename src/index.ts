/**
 * thorvg-canvas — the ThorVG WebCanvas API for Node.js.
 *
 * Same classes and methods as `@thorvg/webcanvas`, backed by a native ThorVG
 * software renderer instead of WebAssembly, and rendering into memory instead of
 * an HTML canvas.
 *
 * ```ts
 * import { init } from 'thorvg-canvas';
 *
 * const TVG = await init();
 * const canvas = new TVG.Canvas({ width: 256, height: 256 });
 * canvas.add(new TVG.Shape().appendCircle(128, 128, 96).fill(255, 80, 0, 255)).render();
 * await canvas.toFile('out.png');
 * ```
 */

import type * as WebCanvas from '@thorvg/webcanvas';
import type { InitOptions } from '@thorvg/webcanvas';
import { setGlobalErrorHandler } from './common/errors';
import * as constantsImpl from './common/constants';
import { getNative, setNative } from './native/binding';
import { loadNative } from './native/load';
import { classes, createNamespace } from './namespace';
import type { Canvas as NodeCanvas, ThorVGNamespace } from './types';

let namespace: ThorVGNamespace | null = null;

/**
 * Loads the native binding and starts the engine. Signature-compatible with
 * webcanvas' `init()`: `locateFile` is ignored and the renderer is always `sw`.
 * Resolves immediately; it stays async so isomorphic code needs no branches.
 */
export async function init(options: InitOptions = {}): Promise<ThorVGNamespace> {
  return initSync(options);
}

/** Synchronous `init()`, for scripts and workers that would rather not await. */
export function initSync(options: InitOptions = {}): ThorVGNamespace {
  if (options.renderer && options.renderer !== 'sw') {
    throw new Error(`thorvg-canvas: only the 'sw' renderer is available in Node (got '${options.renderer}').`);
  }
  setGlobalErrorHandler(options.onError);
  if (!namespace) {
    setNative(loadNative());
    getNative().engine_init(options.threads ?? 0);
    namespace = createNamespace(() => {
      namespace = null;
    }) as unknown as ThorVGNamespace;
  }
  return namespace;
}

const ThorVG = { init, initSync };
export default ThorVG;

const api = classes as unknown as Pick<ThorVGNamespace, keyof typeof classes>;
export const Accessor = api.Accessor;
export const Animation = api.Animation;
export const Canvas = api.Canvas;
export const ConicGradient = api.ConicGradient;
export const Font = api.Font;
export const LinearGradient = api.LinearGradient;
export const LottieAnimation = api.LottieAnimation;
export const Paint = api.Paint;
export const Picture = api.Picture;
export const RadialGradient = api.RadialGradient;
export const Scene = api.Scene;
export const Shape = api.Shape;
export const Text = api.Text;
export const constants = constantsImpl as unknown as typeof WebCanvas.constants;
export type Canvas = NodeCanvas;
export type Accessor = WebCanvas.Accessor;
export type Animation = WebCanvas.Animation;
export type ConicGradient = WebCanvas.ConicGradient;
export type Font = WebCanvas.Font;
export type LinearGradient = WebCanvas.LinearGradient;
export type LottieAnimation = WebCanvas.LottieAnimation;
export type Paint = WebCanvas.Paint;
export type Picture = WebCanvas.Picture;
export type RadialGradient = WebCanvas.RadialGradient;
export type Scene = WebCanvas.Scene;
export type Shape = WebCanvas.Shape;
export type Text = WebCanvas.Text;

export { ThorVGError, ThorVGResultCode } from './common/errors';

export type { CanvasConstructor, ImageFormat, NodeCanvasOptions, RawImage, ThorVGNamespace } from './types';
export type {
  AnimationInfo,
  AnimationSegment,
  AssetResolver,
  AudioInfo,
  AudioResolver,
  Bounds,
  CanvasOptions,
  ColorStop,
  ErrorContext,
  ErrorHandler,
  FontProvider,
  FontProviderResult,
  FontType,
  InitOptions,
  LoadDataOptions,
  LoadFontOptions,
  LottieMarker,
  LottieSlotData,
  Matrix,
  MimeType,
  PictureSize,
  RectOptions,
  RendererType,
  StrokeOptions,
  TextLayout,
  TextOutline,
} from '@thorvg/webcanvas';
