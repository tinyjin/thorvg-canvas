declare const handleBrand: unique symbol;
declare const canvasBrand: unique symbol;

export type Handle = { readonly [handleBrand]: true };
export type CanvasHandle = { readonly [canvasBrand]: true };

type Result = number;
type Bytes = ArrayBufferView | ArrayBuffer;

export interface ThorVGNative {
  readonly version: string;

  engine_init(threads: number): void;
  set_dispatcher(dispatch: ((id: number, ...args: unknown[]) => unknown) | null): void;

  disown(handle: Handle): void;
  address(handle: Handle): number;

  canvas_create(engineOption: number): CanvasHandle | null;
  canvas_destroy(canvas: CanvasHandle): void;
  canvas_resize(canvas: CanvasHandle, width: number, height: number): Result;
  canvas_render(canvas: CanvasHandle, update: boolean): Result;
  canvas_render_async(canvas: CanvasHandle, update: boolean): Promise<Result>;
  canvas_pixels(canvas: CanvasHandle): Uint8Array;
  tvg_canvas_add(canvas: CanvasHandle, paint: Handle): Result;
  tvg_canvas_remove(canvas: CanvasHandle, paint: Handle | null): Result;
  tvg_canvas_update(canvas: CanvasHandle): Result;
  tvg_canvas_set_viewport(
    canvas: CanvasHandle,
    x: number,
    y: number,
    w: number,
    h: number
  ): Result;

  tvg_paint_ref(paint: Handle): number;
  tvg_paint_unref(paint: Handle, free: boolean): number;
  tvg_paint_set_visible(paint: Handle, visible: boolean): Result;
  tvg_paint_get_visible(paint: Handle): boolean;
  tvg_paint_get_id(paint: Handle): number;
  tvg_paint_set_id(paint: Handle, id: number): Result;
  tvg_paint_scale(paint: Handle, factor: number): Result;
  tvg_paint_rotate(paint: Handle, degree: number): Result;
  tvg_paint_translate(paint: Handle, x: number, y: number): Result;
  tvg_paint_set_transform(paint: Handle, matrix: Float32Array): Result;
  tvg_paint_set_opacity(paint: Handle, opacity: number): Result;
  tvg_paint_get_opacity(paint: Handle): number;
  tvg_paint_duplicate(paint: Handle): Handle | null;
  tvg_paint_intersects_region(
    paint: Handle,
    x: number,
    y: number,
    w: number,
    h: number,
    visibleOnly: boolean
  ): boolean;
  tvg_paint_get_aabb(paint: Handle): number[];
  tvg_paint_get_obb(paint: Handle): number[] | null;
  tvg_paint_set_mask_method(
    paint: Handle,
    target: Handle,
    method: number
  ): Result;
  tvg_paint_set_clip(paint: Handle, clipper: Handle): Result;
  tvg_paint_get_type(paint: Handle): number;
  tvg_paint_set_blend_method(paint: Handle, method: number): Result;

  tvg_shape_new(): Handle;
  tvg_shape_reset(paint: Handle): Result;
  tvg_shape_move_to(paint: Handle, x: number, y: number): Result;
  tvg_shape_line_to(paint: Handle, x: number, y: number): Result;
  tvg_shape_cubic_to(
    paint: Handle,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x: number,
    y: number
  ): Result;
  tvg_shape_close(paint: Handle): Result;
  tvg_shape_append_rect(
    paint: Handle,
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    cw: boolean
  ): Result;
  tvg_shape_append_circle(
    paint: Handle,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    cw: boolean
  ): Result;
  tvg_shape_append_path(
    paint: Handle,
    commands: Uint8Array,
    points: Float32Array
  ): Result;
  tvg_shape_get_path(paint: Handle): {
    result: Result;
    commands: number[];
    points: number[];
  };
  tvg_shape_set_stroke_width(paint: Handle, width: number): Result;
  tvg_shape_set_stroke_color(
    paint: Handle,
    r: number,
    g: number,
    b: number,
    a: number
  ): Result;
  tvg_shape_set_stroke_gradient(paint: Handle, gradient: Handle): Result;
  tvg_shape_set_stroke_dash(
    paint: Handle,
    pattern: Float32Array | null,
    offset: number
  ): Result;
  tvg_shape_get_stroke_dash(paint: Handle): {
    result: Result;
    pattern: number[];
    offset: number;
  };
  tvg_shape_set_stroke_cap(paint: Handle, cap: number): Result;
  tvg_shape_set_stroke_join(paint: Handle, join: number): Result;
  tvg_shape_set_stroke_miterlimit(paint: Handle, miterlimit: number): Result;
  tvg_shape_set_trimpath(
    paint: Handle,
    begin: number,
    end: number,
    simultaneous: boolean
  ): Result;
  tvg_shape_set_fill_color(
    paint: Handle,
    r: number,
    g: number,
    b: number,
    a: number
  ): Result;
  tvg_shape_set_fill_rule(paint: Handle, rule: number): Result;
  tvg_shape_set_paint_order(paint: Handle, strokeFirst: boolean): Result;
  tvg_shape_set_gradient(paint: Handle, gradient: Handle): Result;

  tvg_linear_gradient_new(): Handle;
  tvg_radial_gradient_new(): Handle;
  tvg_conic_gradient_new(): Handle;
  tvg_linear_gradient_set(
    gradient: Handle,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Result;
  tvg_radial_gradient_set(
    gradient: Handle,
    cx: number,
    cy: number,
    r: number,
    fx: number,
    fy: number,
    fr: number
  ): Result;
  tvg_conic_gradient_set(
    gradient: Handle,
    cx: number,
    cy: number,
    angle: number
  ): Result;
  tvg_gradient_set_color_stops(gradient: Handle, stops: Uint8Array): Result;
  tvg_gradient_set_spread(gradient: Handle, spread: number): Result;
  tvg_gradient_del(gradient: Handle): Result;

  tvg_picture_new(): Handle;
  tvg_picture_load_data(
    picture: Handle,
    data: Bytes | string,
    mimetype: string
  ): Result;
  tvg_picture_load_raw(
    picture: Handle,
    data: Bytes,
    w: number,
    h: number,
    colorspace: number
  ): Result;
  tvg_picture_set_asset_resolver(picture: Handle, callbackId: number): Result;
  tvg_picture_set_size(picture: Handle, w: number, h: number): Result;
  tvg_picture_get_size(picture: Handle): number[];
  tvg_picture_set_origin(picture: Handle, x: number, y: number): Result;
  tvg_picture_get_paint(picture: Handle, id: number): Handle | null;
  tvg_picture_set_filter(picture: Handle, method: number): Result;
  tvg_picture_set_accessible(picture: Handle, accessible: boolean): Result;

  tvg_scene_new(): Handle;
  tvg_scene_add(scene: Handle, paint: Handle): Result;
  tvg_scene_remove(scene: Handle, paint: Handle | null): Result;
  tvg_scene_clear_effects(scene: Handle): Result;
  tvg_scene_add_effect_gaussian_blur(
    scene: Handle,
    sigma: number,
    direction: number,
    border: number,
    quality: number
  ): Result;
  tvg_scene_add_effect_motion_blur(
    scene: Handle,
    distance: number,
    angle: number,
    quality: number
  ): Result;
  tvg_scene_add_effect_drop_shadow(
    scene: Handle,
    r: number,
    g: number,
    b: number,
    a: number,
    angle: number,
    distance: number,
    sigma: number,
    quality: number
  ): Result;
  tvg_scene_add_effect_fill(
    scene: Handle,
    r: number,
    g: number,
    b: number,
    a: number
  ): Result;
  tvg_scene_add_effect_tint(
    scene: Handle,
    blackR: number,
    blackG: number,
    blackB: number,
    whiteR: number,
    whiteG: number,
    whiteB: number,
    intensity: number
  ): Result;
  tvg_scene_add_effect_tritone(
    scene: Handle,
    shadowR: number,
    shadowG: number,
    shadowB: number,
    midtoneR: number,
    midtoneG: number,
    midtoneB: number,
    highlightR: number,
    highlightG: number,
    highlightB: number,
    blend: number
  ): Result;

  tvg_text_new(): Handle;
  tvg_text_set_font(text: Handle, name: string): Result;
  tvg_text_set_size(text: Handle, size: number): Result;
  tvg_text_set_text(text: Handle, utf8: string): Result;
  tvg_text_align(text: Handle, x: number, y: number): Result;
  tvg_text_layout(text: Handle, w: number, h: number): Result;
  tvg_text_wrap_mode(text: Handle, mode: number): Result;
  tvg_text_line_count(text: Handle): number;
  tvg_text_spacing(text: Handle, letter: number, line: number): Result;
  tvg_text_set_italic(text: Handle, shear: number): Result;
  tvg_text_set_outline(
    text: Handle,
    width: number,
    r: number,
    g: number,
    b: number
  ): Result;
  tvg_text_set_color(text: Handle, r: number, g: number, b: number): Result;
  tvg_text_set_gradient(text: Handle, gradient: Handle): Result;
  tvg_font_load_data(
    name: string,
    data: Bytes | null,
    mimetype: string | null
  ): Result;

  tvg_animation_new(): Handle;
  tvg_lottie_animation_new(): Handle;
  tvg_animation_set_frame(animation: Handle, no: number): Result;
  tvg_animation_get_picture(animation: Handle): Handle | null;
  tvg_animation_get_total_frame(animation: Handle): number;
  tvg_animation_get_duration(animation: Handle): number;
  tvg_animation_set_segment(
    animation: Handle,
    begin: number,
    end: number
  ): Result;
  tvg_animation_del(animation: Handle): Result;
  tvg_lottie_animation_gen_slot(animation: Handle, slot: string): number;
  tvg_lottie_animation_apply_slot(animation: Handle, id: number): Result;
  tvg_lottie_animation_del_slot(animation: Handle, id: number): Result;
  tvg_lottie_animation_set_marker(
    animation: Handle,
    marker: string | null
  ): Result;
  tvg_lottie_animation_get_markers_cnt(animation: Handle): {
    result: Result;
    count: number;
  };
  tvg_lottie_animation_get_marker_info(
    animation: Handle,
    idx: number
  ): { result: Result; name: string | null; begin: number; end: number };
  tvg_lottie_animation_set_quality(animation: Handle, value: number): Result;
  tvg_lottie_animation_set_audio_resolver(
    animation: Handle,
    callbackId: number
  ): Result;
  tvg_lottie_animation_set_volume(animation: Handle, volume: number): Result;
  tvg_lottie_animation_get_volume(animation: Handle): number;

  tvg_accessor_new(): Handle;
  tvg_accessor_del(accessor: Handle): Result;
  tvg_accessor_set(accessor: Handle, paint: Handle, callbackId: number): Result;
  tvg_accessor_generate_id(name: string): number;
  tvg_accessor_get_name(accessor: Handle, id: number): string | null;
}

export interface NativeAudioInfo {
  active: boolean;
  embedded: boolean;
  offset: number;
  volume: number;
  mimeType: string | null;
  src?: string | null;
  data?: Uint8Array;
}

let native: ThorVGNative | null = null;

export function setNative(binding: ThorVGNative): void {
  native = binding;
}

export function getNative(): ThorVGNative {
  if (!native) {
    throw new Error('ThorVG native module not initialized. Call init() first.');
  }
  return native;
}
