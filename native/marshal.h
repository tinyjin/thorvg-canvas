#pragma once

#include <napi.h>

#include <cmath>
#include <cstdint>
#include <string>
#include <type_traits>
#include <utility>

#include "handle.h"

namespace thorvg::node {

template <typename T>
struct IsHandle : std::false_type {};
template <>
struct IsHandle<Tvg_Paint> : std::true_type {};
template <>
struct IsHandle<Tvg_Gradient> : std::true_type {};
template <>
struct IsHandle<Tvg_Animation> : std::true_type {};
template <>
struct IsHandle<Tvg_Accessor> : std::true_type {};

inline double number(const Napi::Value& value) {
  if (value.IsNumber()) {
    double d = value.As<Napi::Number>().DoubleValue();
    return std::isfinite(d) ? d : 0.0;
  }
  if (value.IsBoolean()) return value.As<Napi::Boolean>().Value() ? 1.0 : 0.0;
  return 0.0;
}

template <typename T, typename Enable = void>
struct Arg;

template <typename T>
struct Arg<T, std::enable_if_t<std::is_same_v<T, bool>>> {
  static T get(const Napi::Value& value) { return number(value) != 0.0; }
};

template <typename T>
struct Arg<T, std::enable_if_t<std::is_floating_point_v<T>>> {
  static T get(const Napi::Value& value) { return static_cast<T>(number(value)); }
};

template <typename T>
struct Arg<T, std::enable_if_t<(std::is_integral_v<T> && !std::is_same_v<T, bool>) || std::is_enum_v<T>>> {
  static T get(const Napi::Value& value) { return static_cast<T>(static_cast<int64_t>(number(value))); }
};

template <typename T>
struct Arg<T, std::enable_if_t<IsHandle<T>::value>> {
  static T get(const Napi::Value& value) { return handlePtr<T>(value.Env(), value); }
};

template <typename T>
T arg(const Napi::CallbackInfo& info, size_t index) {
  return Arg<std::remove_cv_t<T>>::get(info[index]);
}

template <typename R>
Napi::Value ret(Napi::Env env, R value) {
  if constexpr (std::is_same_v<R, bool>) {
    return Napi::Boolean::New(env, value);
  } else {
    return Napi::Number::New(env, static_cast<double>(value));
  }
}

inline Napi::Value result(Napi::Env env, Tvg_Result value) { return Napi::Number::New(env, value); }

// Forwards a C API function whose arguments are all scalars or handles.
template <typename R, typename... A, size_t... I>
Napi::Value call(R (*fn)(A...), const Napi::CallbackInfo& info, std::index_sequence<I...>) {
  if constexpr (std::is_void_v<R>) {
    fn(arg<A>(info, I)...);
    return info.Env().Undefined();
  } else {
    return ret<R>(info.Env(), fn(arg<A>(info, I)...));
  }
}

struct Bytes {
  const uint8_t* data = nullptr;
  size_t size = 0;
};

inline Bytes bytes(const Napi::Value& value) {
  if (value.IsTypedArray()) {
    auto array = value.As<Napi::TypedArray>();
    auto buffer = array.ArrayBuffer();
    return {static_cast<const uint8_t*>(buffer.Data()) + array.ByteOffset(), array.ByteLength()};
  }
  if (value.IsArrayBuffer()) {
    auto buffer = value.As<Napi::ArrayBuffer>();
    return {static_cast<const uint8_t*>(buffer.Data()), buffer.ByteLength()};
  }
  if (value.IsDataView()) {
    auto view = value.As<Napi::DataView>();
    return {static_cast<const uint8_t*>(view.ArrayBuffer().Data()) + view.ByteOffset(), view.ByteLength()};
  }
  return {};
}

inline std::string text(const Napi::Value& value) {
  return value.IsString() ? value.As<Napi::String>().Utf8Value() : std::string();
}

inline Napi::Value string(Napi::Env env, const char* value) {
  return value ? Napi::Value(Napi::String::New(env, value)) : env.Null();
}

inline Napi::Array floatArray(Napi::Env env, const float* values, size_t count) {
  auto array = Napi::Array::New(env, count);
  for (size_t i = 0; i < count; ++i) array.Set(static_cast<uint32_t>(i), static_cast<double>(values[i]));
  return array;
}

}
