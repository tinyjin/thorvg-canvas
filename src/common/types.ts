// Generated from @thorvg/webcanvas@1.1.3 by scripts/generate-constants.mjs. Do not edit.

import type { Fill } from '../core/Fill';
import type { Paint } from '../core/Paint';
import type { BlendMethod, StrokeCap, StrokeJoin, FillRule, PathCommand, GradientSpread, MaskMethod, EngineOption, SceneEffect, TextWrapMode, ColorSpace, FilterMethod, ThorVGResultCode } from './constants';

/**
 * MIME type or format hint for loading picture data.
 *
 * Supported image and vector file formats for Picture class.
 * @category Picture
 */
export type MimeType = 'svg' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'raw' | 'lot' | 'lottie+json' | 'mp4';

/**
 * Rendering backend type for Canvas.
 *
 * ThorVG supports three rendering backends, each with different performance
 * characteristics and browser compatibility:
 *
 * ## Available Renderers
 *
 * ### `'sw'` - Software Renderer
 * - **Rendering**: CPU-based software rendering
 * - **Performance**: Slower, but works everywhere
 * - **Compatibility**: All browsers and devices
 * - **Best for**: Maximum compatibility, simple graphics, server-side rendering
 *
 * ### `'gl'` - WebGL Renderer (Recommended)
 * - **Rendering**: GPU-accelerated using WebGL 2.0
 * - **Performance**: Excellent performance with wide browser support
 * - **Compatibility**: Chrome 56+, Firefox 51+, Safari 15+, Edge 79+
 * - **Best for**: Production applications, interactive graphics, animations
 * - **Recommended for most use cases**
 *
 * ### `'wg'` - WebGPU Renderer
 * - **Rendering**: Next-generation GPU API
 * - **Performance**: Best performance for complex scenes
 * - **Compatibility**: Chrome 113+, Edge 113+ (limited support)
 * - **Best for**: Maximum performance, modern browsers only
 *
 * @example
 * ```typescript
 * // Recommended setup with WebGL
 * const TVG = await ThorVG.init({ renderer: 'gl' });
 * const canvas = new TVG.Canvas('#canvas', { width: 800, height: 600 });
 * ```
 *
 * @example
 * ```typescript
 * // Maximum performance with WebGPU (modern browsers only)
 * const TVG = await ThorVG.init({ renderer: 'wg' });
 * ```
 *
 * @example
 * ```typescript
 * // Maximum compatibility with Software renderer
 * const TVG = await ThorVG.init({ renderer: 'sw' });
 * ```
 *
 * @category Other
 */
export type RendererType = 'sw' | 'gl' | 'wg';

/**
 * Load and render images and vector files
 * @category Picture
 */

/**
 * Callback that resolves an external asset (image or font) referenced by a
 * loaded picture, such as the assets inside a Lottie file.
 *
 * The callback is invoked synchronously during {@link Picture.load} for each
 * external reference, so any data it needs must already be in memory — fetch
 * and cache assets before loading, then resolve them here.
 *
 * @param paint - The paint that needs the asset. A {@link Picture} for an image
 *                reference, or a `Text` for a font reference. Use `instanceof`
 *                to tell them apart.
 * @param src - The asset source string exactly as authored in the file.
 * @returns `true` if you resolved the asset; `false` to let the engine fall
 *          back to its own resolution.
 *
 * @category Picture
 *
 * @beta
 */
export type AssetResolver = (paint: Paint, src: string) => boolean;

/**
 * @category Picture
 */
export interface LoadDataOptions {
    /** MIME type or format hint (e.g., 'svg', 'png', 'jpg', 'raw') */
    type?: MimeType;
    /** Width of raw image (required for type='raw') */
    width?: number;
    /** Height of raw image (required for type='raw') */
    height?: number;
    /** Color space of raw image (required for type='raw', default: ColorSpace.ARGB8888) */
    colorSpace?: ColorSpace;
}

/**
 * @category Picture
 */
export interface PictureSize {
    width: number;
    height: number;
}

/**
 * Canvas Rendering context for ThorVG
 *
 * The Canvas class manages the rendering context and provides methods for drawing
 * vector graphics to an HTML canvas element. It supports multiple rendering backends
 * (Software, WebGL, WebGPU) and handles the render loop.
 *
 * @category Canvas
 *
 * @example
 * Basic usage
 * ```typescript
 * const TVG = await ThorVG.init({ renderer: 'gl' });
 * const canvas = new TVG.Canvas('#canvas', {
 *   width: 800,
 *   height: 600
 * });
 *
 * const shape = new TVG.Shape();
 * shape.appendCircle(400, 300, 100)
 *      .fill(255, 0, 0, 255);
 *
 * canvas.add(shape).render();
 * ```
 *
 * @example
 * Rendering with animation loop
 * ```typescript
 * const canvas = new TVG.Canvas('#canvas');
 * const animation = new TVG.Animation();
 * await animation.load(lottieData);
 *
 * canvas.add(animation.picture);
 *
 * function animate() {
 *   animation.frame(currentFrame++);
 *   canvas.update().render();
 *   requestAnimationFrame(animate);
 * }
 * animate();
 * ```
 */

/**
 * Configuration options for Canvas initialization.
 *
 * @category Canvas
 */
export interface CanvasOptions {
    /** Canvas width in pixels. Default: 800 */
    width?: number;
    /** Canvas height in pixels. Default: 600 */
    height?: number;
    /** Enable device pixel ratio for high-DPI displays. Default: true */
    enableDevicePixelRatio?: boolean;
    /** Rendering engine behavior option. Default: EngineOption.Default */
    engineOption?: EngineOption;
}

/**
 * Load and control Lottie animations
 * @category Animation
 */

/**
 * @category Animation
 */
export interface AnimationInfo {
    totalFrames: number;
    duration: number;
    fps: number;
}

/**
 * @category Animation
 */
export interface AnimationSegment {
    start: number;
    end: number;
}

/**
 * Control advanced Lottie features on top of Animation
 * @category LottieAnimation
 */

/**
 * Lottie slot data, keyed by the `sid` the Lottie exposes.
 *
 * @category LottieAnimation
 * @see {@link LottieAnimation.gen}
 *
 * @example
 * ```typescript
 * const slot: LottieSlotData = {
 *   ball_col: { p: { a: 0, k: [0, 1, 0, 1] } },
 * };
 * ```
 */
export type LottieSlotData = Record<string, unknown>;

/**
 * A named frame range embedded in the Lottie file at design time.
 * @category LottieAnimation
 * @see {@link LottieAnimation.marker}
 */
export interface LottieMarker {
    /** The marker name, as authored in the Lottie file */
    name: string;
    /** Starting frame of the marker */
    begin: number;
    /** Ending frame of the marker */
    end: number;
}

/**
 * Describes the current state of a Lottie audio layer.
 *
 * This structure is provided to the audio resolver callback and contains
 * the information required to synchronize audio playback with the animation
 * timeline.
 *
 * @category LottieAnimation
 * @see {@link AudioResolver}
 * @beta
 */
export interface AudioInfo {
    /** Audio source: a file path/URL, or the embedded raw bytes. */
    src: string | Uint8Array;
    /** MIME type string; valid when the source is embedded; may be `null`. */
    mimeType: string | null;
    /** Position within the audio file in seconds; valid when `active`. */
    offset: number;
    /** Volume [0, 1]; valid when `active`. */
    volume: number;
    /** `true` while the layer is within its playback range. */
    active: boolean;
}

/**
 * Audio resolver callback
 *
 * @param info - Current state of the audio layer.
 *
 * @category LottieAnimation
 * @beta
 */
export type AudioResolver = (info: AudioInfo) => void;

/**
 * @category Shapes
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * A 3x3 transformation matrix for 2D transformations.
 *
 * The matrix elements represent:
 * - e11, e12: Rotation/scale in X
 * - e21, e22: Rotation/scale in Y
 * - e13, e23: Translation in X and Y
 * - e31, e32: Always 0 (reserved for 3D)
 * - e33: Always 1 (homogeneous coordinate)
 *
 * Matrix layout:
 * ```
 * | e11  e12  e13 |
 * | e21  e22  e23 |
 * | e31  e32  e33 |
 * ```
 *
 * @category Shapes
 */
export interface Matrix {
    e11: number;
    e12: number;
    e13: number;
    e21: number;
    e22: number;
    e23: number;
    e31: number;
    e32: number;
    e33: number;
}

/**
 * Base class for gradient fills
 * @category Gradients
 */

/**
 * @category Gradients
 */
export type ColorStop = readonly [number, number, number, number];

/**
 * Vector path drawing and manipulation
 *
 * Shape is the fundamental drawing primitive in ThorVG WebCanvas. It provides methods for
 * creating paths using moveTo/lineTo/cubicTo commands, as well as convenience methods for
 * common shapes like rectangles and circles. Shapes can be filled with solid colors or
 * gradients, and stroked with customizable line styles.
 *
 * @category Shapes
 *
 * @example
 * ```typescript
 * // Basic triangle
 * const shape = new TVG.Shape();
 * shape.moveTo(100, 50)
 *      .lineTo(150, 150)
 *      .lineTo(50, 150)
 *      .close()
 *      .fill(255, 0, 0, 255);
 * canvas.add(shape).render();
 * ```
 *
 * @example
 * ```typescript
 * // Rectangle with rounded corners
 * const rect = new TVG.Shape();
 * rect.appendRect(50, 50, 200, 100, { rx: 10, ry: 10 })
 *     .fill(0, 120, 255, 255)
 *     .stroke({ width: 3, color: [0, 0, 0, 255] });
 * ```
 *
 * @example
 * ```typescript
 * // Circle with gradient fill
 * const circle = new TVG.Shape();
 * const gradient = new TVG.RadialGradient(150, 150, 50);
 * gradient.addStop(0, [255, 255, 255, 255])
 *         .addStop(1, [0, 100, 255, 255]);
 *
 * circle.appendCircle(150, 150, 50)
 *       .fill(gradient);
 * ```
 *
 * @example
 * ```typescript
 * // Complex path with bezier curves
 * const shape = new TVG.Shape();
 * shape.moveTo(50, 100)
 *      .cubicTo(50, 50, 150, 50, 150, 100)
 *      .cubicTo(150, 150, 50, 150, 50, 100)
 *      .close()
 *      .fill(255, 100, 0, 255);
 * ```
 */

/**
 * Options for creating rectangles with rounded corners.
 *
 * @category Shapes
 */
export interface RectOptions {
    /** Horizontal corner radius. Default: 0 */
    rx?: number;
    /** Vertical corner radius. Default: 0 */
    ry?: number;
    /** Path direction. true = clockwise, false = counter-clockwise. Default: true */
    clockwise?: boolean;
}

/**
 * Comprehensive stroke styling options.
 *
 * @category Shapes
 */
export interface StrokeOptions {
    /** Stroke width in pixels */
    width?: number;
    /** Stroke color as [r, g, b, a] with values 0-255. Alpha is optional, defaults to 255. */
    color?: readonly [number, number, number, number?];
    /** Gradient fill for the stroke */
    gradient?: Fill;
    /** Line cap style: StrokeCap.Butt, StrokeCap.Round, or StrokeCap.Square. Default: StrokeCap.Butt */
    cap?: StrokeCap;
    /** Line join style: StrokeJoin.Miter, StrokeJoin.Round, or StrokeJoin.Bevel. Default: StrokeJoin.Miter */
    join?: StrokeJoin;
    /** Miter limit for 'miter' joins. Default: 4 */
    miterLimit?: number;
    /** Dash pattern as array of dash/gap lengths. Empty array [] resets to solid line. */
    dash?: number[];
    /** Dash pattern offset. Use with dash to shift pattern start position. */
    dashOffset?: number;
}

/**
 * Render text with fonts and styling
 * @category Text
 */

/**
 * @category Text
 */
export interface TextLayout {
    width: number;
    height?: number;
}

/**
 * @category Text
 */
export interface TextOutline {
    width: number;
    color: readonly [number, number, number];
}

/**
 * Font provider abstraction for pluggable font sources.
 * @category Font
 */

/**
 * Result returned by a {@link FontProvider} after fetching font data.
 * @category Font
 */
export interface FontProviderResult {
    /** Raw font binary data */
    data: Uint8Array;
    /** Font format */
    type: FontType;
}

/**
 * Interface for pluggable font sources.
 *
 * A font provider resolves a font name into binary font data.
 * Implement this interface to load fonts from any source — a self-hosted
 * CDN, a local server, or any custom storage.
 *
 * @category Font
 *
 * @example
 * ```typescript
 * TVG.Font.provider({
 *   fetch: async (name) => {
 *     const res = await fetch(`/my-fonts/${name}.ttf`);
 *     return { data: new Uint8Array(await res.arrayBuffer()), type: 'ttf' };
 *   }
 * });
 *
 * await TVG.Font.load('my-font');
 * ```
 */
export interface FontProvider {
    /**
     * Fetch font data by name.
     * @param name - Font name as provided by the caller
     * @param options - Provider-specific options
     * @returns Font binary data and format
     */
    fetch(name: string, options?: Record<string, unknown>): Promise<FontProviderResult>;
}

/**
 * Load and manage fonts
 * @category Font
 */

/**
 * Supported font file types.
 * - `'ttf'`: TrueType Font
 * - `'otf'`: OpenType Font
 * @category Font
 */
export type FontType = 'ttf' | 'otf';

/**
 * @category Font
 */
export interface LoadFontOptions {
    /** Font type ('ttf' | 'otf') */
    type?: FontType;
}

/**
 * Context information provided when an error occurs.
 *
 * @category Error Handling
 */
export interface ErrorContext {
    /** The operation that failed (e.g., 'moveTo', 'render', 'update') */
    operation: string;
}

/**
 * Error handler callback function.
 *
 * Handles both ThorVG WASM errors (ThorVGError) and JavaScript errors (Error).
 * Use instanceof to distinguish between error types.
 *
 * @category Error Handling
 *
 * @example
 * ```typescript
 * import { init } from '@thorvg/webcanvas';
 *
 * const TVG = await init({
 *   onError: (error, context) => {
 *     if (error instanceof ThorVGError) {
 *       // WASM error - has error.code
 *       console.log('WASM error code:', error.code);
 *     } else {
 *       // JavaScript error
 *       console.log('JS error:', error.message);
 *     }
 *   }
 * });
 * ```
 */
export interface ErrorHandler {
    (error: Error, context: ErrorContext): void;
}

/**
 * ThorVG WebCanvas - TypeScript API for ThorVG
 *
 * @packageDocumentation
 *
 * A high-performance TypeScript Canvas API for ThorVG, with fluent and
 * object-oriented vector graphics rendering via WebAssembly.
 *
 * ## Features
 *
 * - **Intuitive OOP API** - Fluent interface with method chaining
 * - **Type-Safe** - Full TypeScript support with strict typing
 * - **High Performance** - WebGPU, WebGL, and Software rendering backends
 * - **Automatic Memory Management** - FinalizationRegistry for garbage collection
 * - **Method Chaining** - Ergonomic fluent API design
 * - **Zero Overhead** - Direct WASM bindings with minimal abstraction
 * - **Animation Support** - Frame-based Lottie animation playback
 * - **Rich Primitives** - Shapes, scenes, pictures, text, and gradients
 *
 * @example
 * ```typescript
 * import ThorVG from '@thorvg/webcanvas';
 *
 * // Initialize ThorVG with renderer
 * const TVG = await ThorVG.init({
 *   locateFile: (path) => `/wasm/${path}`,
 *   renderer: 'gl'
 * });
 *
 * // Create canvas and draw
 * const canvas = new TVG.Canvas('#canvas', { width: 800, height: 600 });
 * const shape = new TVG.Shape();
 * shape.appendRect(100, 100, 200, 150)
 *      .fill(255, 0, 0, 255);
 * canvas.add(shape).render();
 * ```
 *
 * @module
 */

/**
 * @category Initialization
 */
export interface InitOptions {
    /** Optional function to locate WASM files. If not provided, assumes WASM files are in the same directory as the JavaScript bundle. */
    locateFile?: (path: string) => string;
    /** Renderer type: 'sw' (Software), 'gl' (WebGL), or 'wg' (WebGPU). Default: 'gl'. WebGPU provides best performance but requires Chrome 113+ or Edge 113+. */
    renderer?: RendererType;
    /** Global error handler for all ThorVG operations. If provided, errors will be passed to this handler instead of being thrown. */
    onError?: ErrorHandler;
    /** Number of worker threads count. Ignored in default preset. Default: 0. */
    threads?: number;
}
