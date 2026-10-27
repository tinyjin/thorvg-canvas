#pragma once

#include <napi.h>

#include <cstdint>
#include <memory>

#include "instance.h"
#include "thorvg_capi.h"

namespace thorvg::node {

// Opaque JS handle for a ThorVG object. The JS side only ever sees an External
// tagged with kHandleTag, so a forged or mismatched value is rejected instead of
// being dereferenced.
class Handle {
 public:
  enum class Kind : uint8_t { Paint, Gradient, Animation, Accessor };

  Handle(void* ptr, Kind kind, bool owned, std::shared_ptr<ReleaseQueue> releases)
      : ptr_(ptr), kind_(kind), owned_(owned), releases_(std::move(releases)) {}
  ~Handle();

  Handle(const Handle&) = delete;
  Handle& operator=(const Handle&) = delete;

  void* ptr() const { return ptr_; }
  Kind kind() const { return kind_; }
  void disown() { owned_ = false; }

 private:
  void* ptr_;
  Kind kind_;
  bool owned_;
  std::shared_ptr<ReleaseQueue> releases_;
};

Napi::Value makeHandle(Napi::Env env, void* ptr, Handle::Kind kind, bool owned);

// Null for null/undefined, throws for anything that is not a handle.
Handle* findHandle(Napi::Env env, const Napi::Value& value);

template <typename T>
T handlePtr(Napi::Env env, const Napi::Value& value) {
  auto handle = findHandle(env, value);
  return handle ? static_cast<T>(handle->ptr()) : nullptr;
}

extern const napi_type_tag kCanvasTag;

}
