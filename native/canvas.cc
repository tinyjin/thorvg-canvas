#include "canvas.h"

namespace thorvg::node {

namespace {

// ABGR8888 on a little-endian host lays bytes out as R, G, B, A; the S variant
// keeps alpha un-premultiplied. Together that is ImageData's format verbatim.
constexpr Tvg_Colorspace kColorspace = TVG_COLORSPACE_ABGR8888S;

}

CanvasHost::CanvasHost(Tvg_Engine_Option option) : canvas_(tvg_swcanvas_create(option)) {}

CanvasHost::~CanvasHost() {
  if (canvas_) tvg_canvas_destroy(canvas_);
}

Tvg_Result CanvasHost::resize(uint32_t width, uint32_t height) {
  if (!canvas_) return TVG_RESULT_INSUFFICIENT_CONDITION;
  if (width == 0 || height == 0) return TVG_RESULT_INVALID_ARGUMENT;
  if (width == width_ && height == height_) return TVG_RESULT_SUCCESS;

  // ThorVG must not keep drawing into the old allocation.
  tvg_canvas_sync(canvas_);
  buffer_.assign(static_cast<size_t>(width) * height, 0);
  width_ = width;
  height_ = height;
  return tvg_swcanvas_set_target(canvas_, buffer_.data(), width, width, height, kColorspace);
}

Tvg_Result CanvasHost::add(Tvg_Paint paint) {
  return canvas_ ? tvg_canvas_add(canvas_, paint) : TVG_RESULT_INSUFFICIENT_CONDITION;
}

Tvg_Result CanvasHost::remove(Tvg_Paint paint) {
  return canvas_ ? tvg_canvas_remove(canvas_, paint) : TVG_RESULT_INSUFFICIENT_CONDITION;
}

Tvg_Result CanvasHost::update() {
  return canvas_ ? tvg_canvas_update(canvas_) : TVG_RESULT_INSUFFICIENT_CONDITION;
}

Tvg_Result CanvasHost::viewport(int32_t x, int32_t y, int32_t w, int32_t h) {
  return canvas_ ? tvg_canvas_set_viewport(canvas_, x, y, w, h) : TVG_RESULT_INSUFFICIENT_CONDITION;
}

Tvg_Result CanvasHost::draw() {
  if (!canvas_ || buffer_.empty()) return TVG_RESULT_INSUFFICIENT_CONDITION;
  auto result = tvg_canvas_draw(canvas_, true);
  // Nothing changed since the last draw: the buffer already holds this frame.
  if (result == TVG_RESULT_INSUFFICIENT_CONDITION) return TVG_RESULT_SUCCESS;
  if (result != TVG_RESULT_SUCCESS) return result;
  return tvg_canvas_sync(canvas_);
}

}
