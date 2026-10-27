#pragma once

#include <cstdint>
#include <vector>

#include "thorvg_capi.h"

namespace thorvg::node {

// A software canvas that renders into memory it owns. There is no surface,
// present step or vsync: the pixels are the output.
class CanvasHost {
 public:
  explicit CanvasHost(Tvg_Engine_Option option);
  ~CanvasHost();

  CanvasHost(const CanvasHost&) = delete;
  CanvasHost& operator=(const CanvasHost&) = delete;

  bool valid() const { return canvas_ != nullptr; }
  uint32_t width() const { return width_; }
  uint32_t height() const { return height_; }

  // Straight-alpha RGBA in memory order, which is exactly ImageData's layout.
  const uint8_t* pixels() const { return reinterpret_cast<const uint8_t*>(buffer_.data()); }
  size_t byteLength() const { return buffer_.size() * sizeof(uint32_t); }

  Tvg_Result resize(uint32_t width, uint32_t height);
  Tvg_Result add(Tvg_Paint paint);
  Tvg_Result remove(Tvg_Paint paint);
  Tvg_Result update();
  Tvg_Result viewport(int32_t x, int32_t y, int32_t w, int32_t h);

  // Safe to call off the JS thread as long as nothing touches the scene meanwhile;
  // the binding layer enforces that.
  Tvg_Result draw();

 private:
  Tvg_Canvas canvas_ = nullptr;
  std::vector<uint32_t> buffer_;
  uint32_t width_ = 0;
  uint32_t height_ = 0;
};

}
