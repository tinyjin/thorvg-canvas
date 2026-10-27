#include "bindings.h"

#include <cstring>
#include <functional>
#include <initializer_list>
#include <memory>
#include <mutex>
#include <string>
#include <utility>
#include <vector>

#include "canvas.h"
#include "handle.h"
#include "marshal.h"

#define THORVG_TTF_LOADER_SUPPORT 1
#include "default_font.h"

namespace thorvg::node {

namespace {

constexpr const char* kBusy =
    "ThorVG: a canvas is rendering asynchronously. Await renderAsync() before touching the scene again.";

// ---------------------------------------------------------------------------
// Callbacks into JS
//
// ThorVG only calls these synchronously from inside a binding (picture load,
// accessor walk, frame change), so currentEnv() is set. With threads > 0 a loader
// may call back from a task thread instead; there is no JS to run there, so the
// callback answers "not handled".

Napi::Value dispatch(Napi::Env env, double id, std::initializer_list<napi_value> extra) {
  auto& inst = instance(env);
  if (inst.dispatcher.IsEmpty()) return env.Undefined();
  std::vector<napi_value> args;
  args.reserve(extra.size() + 1);
  args.push_back(Napi::Number::New(env, id));
  args.insert(args.end(), extra.begin(), extra.end());
  return inst.dispatcher.Call(args);
}

double callbackId(void* data) { return static_cast<double>(reinterpret_cast<intptr_t>(data)); }

void stashError(Napi::Env env) {
  auto& inst = instance(env);
  if (!inst.pendingError) inst.pendingError = std::current_exception();
}

void clearPending(Napi::Env env) { instance(env).pendingError = nullptr; }

void rethrowPending(Napi::Env env) {
  if (auto error = std::exchange(instance(env).pendingError, nullptr)) std::rethrow_exception(error);
}

bool assetResolver(Tvg_Paint paint, const char* src, void* data) {
  auto env = currentEnv();
  if (!env) return false;
  try {
    auto result = dispatch(*env, callbackId(data),
                           {makeHandle(*env, paint, Handle::Kind::Paint, false), Napi::String::New(*env, src ? src : "")});
    return result.IsBoolean() && result.As<Napi::Boolean>().Value();
  } catch (...) {
    return false;
  }
}

bool accessorVisitor(Tvg_Paint paint, void* data) {
  auto env = currentEnv();
  if (!env) return false;
  try {
    auto result = dispatch(*env, callbackId(data), {makeHandle(*env, paint, Handle::Kind::Paint, false)});
    return result.IsBoolean() && result.As<Napi::Boolean>().Value();
  } catch (...) {
    stashError(*env);
    return false;
  }
}

void audioResolver(const Tvg_Audio_Info* info, void* data) {
  auto env = currentEnv();
  if (!env || !info) return;
  try {
    auto out = Napi::Object::New(*env);
    out.Set("active", info->active);
    out.Set("embedded", info->embedded);
    out.Set("offset", static_cast<double>(info->offset));
    out.Set("volume", static_cast<double>(info->volume));
    out.Set("mimeType", string(*env, info->mimeType));
    if (info->embedded) {
      if (info->src && info->size) {
        auto bytes = Napi::Buffer<uint8_t>::Copy(*env, reinterpret_cast<const uint8_t*>(info->src), info->size);
        out.Set("data", Napi::Uint8Array::New(*env, info->size, bytes.ArrayBuffer(), bytes.ByteOffset()));
      }
    } else {
      out.Set("src", string(*env, info->src));
    }
    dispatch(*env, callbackId(data), {out});
  } catch (...) {
    stashError(*env);
  }
}

// ---------------------------------------------------------------------------
// Canvas handle

struct CanvasState {
  std::shared_ptr<CanvasHost> host;
};

CanvasHost* canvasHost(const Napi::Value& value) {
  auto env = value.Env();
  if (!value.IsExternal() || !value.As<Napi::External<CanvasState>>().CheckTypeTag(&kCanvasTag)) {
    throw Napi::TypeError::New(env, "ThorVG: expected a canvas handle");
  }
  auto host = value.As<Napi::External<CanvasState>>().Data()->host.get();
  if (!host) throw Napi::Error::New(env, "ThorVG: the canvas has been destroyed");
  return host;
}

// Renders on the libuv pool. While it runs every binding throws (see Builder::fn),
// so the scene graph cannot change under ThorVG, and native frees are queued.
class RenderWorker : public Napi::AsyncWorker {
 public:
  RenderWorker(Napi::Env env, Napi::Value canvas, bool update)
      : Napi::AsyncWorker(env, "thorvg:render"),
        deferred_(Napi::Promise::Deferred::New(env)),
        canvas_(Napi::Persistent(canvas.As<Napi::External<CanvasState>>())),
        host_(canvas.As<Napi::External<CanvasState>>().Data()->host),
        releases_(instance(env).releases),
        update_(update) {
    releases_->rendering++;
  }

  Napi::Promise promise() const { return deferred_.Promise(); }

  void Execute() override {
    if (update_) host_->update();
    result_ = host_->draw();
  }

  void OnOK() override {
    finish();
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    finish();
    deferred_.Reject(error.Value());
  }

 private:
  void finish() {
    releases_->rendering--;
    releases_->drain();
    canvas_.Reset();
  }

  Napi::Promise::Deferred deferred_;
  Napi::Reference<Napi::External<CanvasState>> canvas_;
  std::shared_ptr<CanvasHost> host_;
  std::shared_ptr<ReleaseQueue> releases_;
  bool update_;
  Tvg_Result result_ = TVG_RESULT_UNKNOWN;
};

// ---------------------------------------------------------------------------
// Builder

using Body = std::function<Napi::Value(const Napi::CallbackInfo&)>;

class Builder {
 public:
  Builder(Napi::Env env, Napi::Object target) : env_(env), target_(target) {}

  void fn(const char* name, Body body) {
    target_.Set(name, Napi::Function::New(
                          env_,
                          [body = std::move(body)](const Napi::CallbackInfo& info) -> Napi::Value {
                            auto env = info.Env();
                            auto& releases = *instance(env).releases;
                            if (releases.rendering) throw Napi::Error::New(env, kBusy);
                            releases.drain();
                            Scope scope(env);
                            return body(info);
                          },
                          name));
  }

  template <typename R, typename... A>
  void capi(const char* name, R (*f)(A...)) {
    fn(name, [f](const Napi::CallbackInfo& info) { return call(f, info, std::index_sequence_for<A...>{}); });
  }

  template <typename R>
  void create(const char* name, R (*f)(), Handle::Kind kind) {
    fn(name, [f, kind](const Napi::CallbackInfo& info) { return makeHandle(info.Env(), f(), kind, true); });
  }

 private:
  Napi::Env env_;
  Napi::Object target_;
};

#define TVG_BIND(builder, name) builder.capi(#name, name)

using Info = const Napi::CallbackInfo&;

void installEngine(Builder& b) {
  b.fn("engine_init", [](Info info) {
    // ThorVG's initializer is process-wide; worker_threads share it and the
    // first caller decides the task thread count. It is never terminated, so a
    // finalizer that runs during env teardown can still free into a live engine.
    static std::once_flag once;
    auto threads = arg<uint32_t>(info, 0);
    std::call_once(once, [threads] {
      tvg_engine_init(threads);
      tvg_font_load_data("default", requestFont(), DEFAULT_FONT_SIZE, "ttf", false);
    });
    return info.Env().Undefined();
  });

  b.fn("set_dispatcher", [](Info info) {
    auto& inst = instance(info.Env());
    if (info[0].IsFunction()) {
      inst.dispatcher = Napi::Persistent(info[0].As<Napi::Function>());
    } else {
      inst.dispatcher.Reset();
    }
    return info.Env().Undefined();
  });
}

void installHandles(Builder& b) {
  b.fn("disown", [](Info info) {
    if (auto handle = findHandle(info.Env(), info[0])) handle->disown();
    return info.Env().Undefined();
  });

  b.fn("address", [](Info info) {
    auto handle = findHandle(info.Env(), info[0]);
    return Napi::Number::New(info.Env(), handle ? static_cast<double>(reinterpret_cast<uintptr_t>(handle->ptr())) : 0.0);
  });
}

void installCanvas(Builder& b) {
  b.fn("canvas_create", [](Info info) -> Napi::Value {
    auto host = std::make_shared<CanvasHost>(arg<Tvg_Engine_Option>(info, 0));
    if (!host->valid()) return info.Env().Null();
    auto external = Napi::External<CanvasState>::New(info.Env(), new CanvasState{std::move(host)},
                                                     [](Napi::Env, CanvasState* state) { delete state; });
    external.TypeTag(&kCanvasTag);
    return external;
  });

  b.fn("canvas_destroy", [](Info info) {
    if (info[0].IsExternal() && info[0].As<Napi::External<CanvasState>>().CheckTypeTag(&kCanvasTag)) {
      info[0].As<Napi::External<CanvasState>>().Data()->host.reset();
    }
    return info.Env().Undefined();
  });

  b.fn("canvas_resize", [](Info info) {
    return result(info.Env(), canvasHost(info[0])->resize(arg<uint32_t>(info, 1), arg<uint32_t>(info, 2)));
  });

  b.fn("canvas_render", [](Info info) {
    auto host = canvasHost(info[0]);
    if (arg<bool>(info, 1)) host->update();
    return result(info.Env(), host->draw());
  });

  b.fn("canvas_render_async", [](Info info) {
    canvasHost(info[0]);
    auto worker = new RenderWorker(info.Env(), info[0], arg<bool>(info, 1));
    auto promise = worker->promise();
    worker->Queue();
    return promise;
  });

  b.fn("canvas_pixels", [](Info info) {
    // A copy, not a view: the buffer is reallocated on resize and rewritten on
    // every render, and external ArrayBuffers are unavailable under Electron's
    // V8 sandbox anyway.
    auto host = canvasHost(info[0]);
    auto bytes = Napi::Buffer<uint8_t>::Copy(info.Env(), host->pixels(), host->byteLength());
    return Napi::Uint8Array::New(info.Env(), host->byteLength(), bytes.ArrayBuffer(), bytes.ByteOffset());
  });

  b.fn("tvg_canvas_add", [](Info info) {
    return result(info.Env(), canvasHost(info[0])->add(handlePtr<Tvg_Paint>(info.Env(), info[1])));
  });

  b.fn("tvg_canvas_remove", [](Info info) {
    return result(info.Env(), canvasHost(info[0])->remove(handlePtr<Tvg_Paint>(info.Env(), info[1])));
  });

  b.fn("tvg_canvas_update", [](Info info) { return result(info.Env(), canvasHost(info[0])->update()); });

  b.fn("tvg_canvas_set_viewport", [](Info info) {
    return result(info.Env(), canvasHost(info[0])->viewport(arg<int32_t>(info, 1), arg<int32_t>(info, 2),
                                                            arg<int32_t>(info, 3), arg<int32_t>(info, 4)));
  });
}

void installPaint(Builder& b) {
  TVG_BIND(b, tvg_paint_ref);
  TVG_BIND(b, tvg_paint_unref);
  TVG_BIND(b, tvg_paint_set_visible);
  TVG_BIND(b, tvg_paint_get_visible);
  TVG_BIND(b, tvg_paint_get_id);
  TVG_BIND(b, tvg_paint_set_id);
  TVG_BIND(b, tvg_paint_scale);
  TVG_BIND(b, tvg_paint_rotate);
  TVG_BIND(b, tvg_paint_translate);
  TVG_BIND(b, tvg_paint_set_opacity);
  TVG_BIND(b, tvg_paint_intersects_region);
  TVG_BIND(b, tvg_paint_set_mask_method);
  TVG_BIND(b, tvg_paint_set_clip);
  TVG_BIND(b, tvg_paint_set_blend_method);

  b.fn("tvg_paint_duplicate", [](Info info) {
    return makeHandle(info.Env(), tvg_paint_duplicate(arg<Tvg_Paint>(info, 0)), Handle::Kind::Paint, true);
  });

  b.fn("tvg_paint_get_opacity", [](Info info) {
    uint8_t opacity = 0;
    tvg_paint_get_opacity(arg<Tvg_Paint>(info, 0), &opacity);
    return Napi::Number::New(info.Env(), opacity);
  });

  b.fn("tvg_paint_get_type", [](Info info) {
    Tvg_Type type = TVG_TYPE_UNDEF;
    tvg_paint_get_type(arg<Tvg_Paint>(info, 0), &type);
    return Napi::Number::New(info.Env(), type);
  });

  b.fn("tvg_paint_get_aabb", [](Info info) -> Napi::Value {
    float box[4] = {0, 0, 0, 0};
    tvg_paint_get_aabb(arg<Tvg_Paint>(info, 0), &box[0], &box[1], &box[2], &box[3]);
    return floatArray(info.Env(), box, 4);
  });

  b.fn("tvg_paint_get_obb", [](Info info) -> Napi::Value {
    Tvg_Point points[4];
    if (tvg_paint_get_obb(arg<Tvg_Paint>(info, 0), points) != TVG_RESULT_SUCCESS) return info.Env().Null();
    return floatArray(info.Env(), &points[0].x, 8);
  });

  b.fn("tvg_paint_set_transform", [](Info info) {
    auto matrix = bytes(info[1]);
    if (matrix.size < sizeof(Tvg_Matrix)) return result(info.Env(), TVG_RESULT_INVALID_ARGUMENT);
    Tvg_Matrix m;
    std::memcpy(&m, matrix.data, sizeof(Tvg_Matrix));
    return result(info.Env(), tvg_paint_set_transform(arg<Tvg_Paint>(info, 0), &m));
  });
}

void installShape(Builder& b) {
  b.create("tvg_shape_new", tvg_shape_new, Handle::Kind::Paint);
  TVG_BIND(b, tvg_shape_reset);
  TVG_BIND(b, tvg_shape_move_to);
  TVG_BIND(b, tvg_shape_line_to);
  TVG_BIND(b, tvg_shape_cubic_to);
  TVG_BIND(b, tvg_shape_close);
  TVG_BIND(b, tvg_shape_append_rect);
  TVG_BIND(b, tvg_shape_append_circle);
  TVG_BIND(b, tvg_shape_set_stroke_width);
  TVG_BIND(b, tvg_shape_set_stroke_color);
  TVG_BIND(b, tvg_shape_set_stroke_gradient);
  TVG_BIND(b, tvg_shape_set_stroke_cap);
  TVG_BIND(b, tvg_shape_set_stroke_join);
  TVG_BIND(b, tvg_shape_set_stroke_miterlimit);
  TVG_BIND(b, tvg_shape_set_trimpath);
  TVG_BIND(b, tvg_shape_set_fill_color);
  TVG_BIND(b, tvg_shape_set_fill_rule);
  TVG_BIND(b, tvg_shape_set_paint_order);
  TVG_BIND(b, tvg_shape_set_gradient);

  b.fn("tvg_shape_append_path", [](Info info) {
    auto commands = bytes(info[1]);
    auto points = bytes(info[2]);
    std::vector<Tvg_Point> pts(points.size / sizeof(Tvg_Point));
    if (!pts.empty()) std::memcpy(pts.data(), points.data, pts.size() * sizeof(Tvg_Point));
    return result(info.Env(), tvg_shape_append_path(arg<Tvg_Paint>(info, 0),
                                                    reinterpret_cast<const Tvg_Path_Command*>(commands.data),
                                                    static_cast<uint32_t>(commands.size),
                                                    pts.empty() ? nullptr : pts.data(), static_cast<uint32_t>(pts.size())));
  });

  b.fn("tvg_shape_get_path", [](Info info) -> Napi::Value {
    auto env = info.Env();
    const Tvg_Path_Command* cmds = nullptr;
    const Tvg_Point* pts = nullptr;
    uint32_t cmdsCnt = 0;
    uint32_t ptsCnt = 0;
    auto res = tvg_shape_get_path(arg<Tvg_Paint>(info, 0), &cmds, &cmdsCnt, &pts, &ptsCnt);
    auto out = Napi::Object::New(env);
    out.Set("result", static_cast<int>(res));
    auto commands = Napi::Array::New(env, cmds ? cmdsCnt : 0);
    for (uint32_t i = 0; cmds && i < cmdsCnt; ++i) commands.Set(i, static_cast<int>(cmds[i]));
    out.Set("commands", commands);
    out.Set("points", pts ? floatArray(env, &pts[0].x, ptsCnt * 2) : Napi::Array::New(env, 0));
    return out;
  });

  b.fn("tvg_shape_set_stroke_dash", [](Info info) {
    auto pattern = bytes(info[1]);
    std::vector<float> dash(pattern.size / sizeof(float));
    if (!dash.empty()) std::memcpy(dash.data(), pattern.data, dash.size() * sizeof(float));
    return result(info.Env(), tvg_shape_set_stroke_dash(arg<Tvg_Paint>(info, 0), dash.empty() ? nullptr : dash.data(),
                                                        static_cast<uint32_t>(dash.size()), arg<float>(info, 2)));
  });

  b.fn("tvg_shape_get_stroke_dash", [](Info info) -> Napi::Value {
    auto env = info.Env();
    const float* pattern = nullptr;
    uint32_t cnt = 0;
    float offset = 0;
    auto res = tvg_shape_get_stroke_dash(arg<Tvg_Paint>(info, 0), &pattern, &cnt, &offset);
    auto out = Napi::Object::New(env);
    out.Set("result", static_cast<int>(res));
    out.Set("pattern", pattern ? floatArray(env, pattern, cnt) : Napi::Array::New(env, 0));
    out.Set("offset", static_cast<double>(offset));
    return out;
  });
}

void installGradient(Builder& b) {
  b.create("tvg_linear_gradient_new", tvg_linear_gradient_new, Handle::Kind::Gradient);
  b.create("tvg_radial_gradient_new", tvg_radial_gradient_new, Handle::Kind::Gradient);
  b.create("tvg_conic_gradient_new", tvg_conic_gradient_new, Handle::Kind::Gradient);
  TVG_BIND(b, tvg_linear_gradient_set);
  TVG_BIND(b, tvg_radial_gradient_set);
  TVG_BIND(b, tvg_conic_gradient_set);
  TVG_BIND(b, tvg_gradient_set_spread);
  TVG_BIND(b, tvg_gradient_del);

  b.fn("tvg_gradient_set_color_stops", [](Info info) {
    auto stops = bytes(info[1]);
    std::vector<Tvg_Color_Stop> list(stops.size / sizeof(Tvg_Color_Stop));
    if (!list.empty()) std::memcpy(list.data(), stops.data, list.size() * sizeof(Tvg_Color_Stop));
    return result(info.Env(), tvg_gradient_set_color_stops(arg<Tvg_Gradient>(info, 0), list.empty() ? nullptr : list.data(),
                                                           static_cast<uint32_t>(list.size())));
  });
}

void installPicture(Builder& b) {
  b.create("tvg_picture_new", tvg_picture_new, Handle::Kind::Paint);
  TVG_BIND(b, tvg_picture_set_size);
  TVG_BIND(b, tvg_picture_set_origin);
  TVG_BIND(b, tvg_picture_set_filter);
  TVG_BIND(b, tvg_picture_set_accessible);

  b.fn("tvg_picture_load_data", [](Info info) {
    auto env = info.Env();
    auto picture = arg<Tvg_Paint>(info, 0);
    auto mime = text(info[2]);
    clearPending(env);
    Tvg_Result res;
    if (info[1].IsString()) {
      auto source = text(info[1]);
      res = tvg_picture_load_data(picture, source.data(), static_cast<uint32_t>(source.size()), mime.c_str(), "", true);
    } else {
      auto data = bytes(info[1]);
      res = tvg_picture_load_data(picture, reinterpret_cast<const char*>(data.data), static_cast<uint32_t>(data.size),
                                  mime.c_str(), "", true);
    }
    rethrowPending(env);
    return result(env, res);
  });

  b.fn("tvg_picture_load_raw", [](Info info) {
    auto data = bytes(info[1]);
    auto width = arg<uint32_t>(info, 2);
    auto height = arg<uint32_t>(info, 3);
    if (data.size < static_cast<size_t>(width) * height * 4) return result(info.Env(), TVG_RESULT_INVALID_ARGUMENT);
    // ThorVG copies the pixels (copy = true), but wants them 4-byte aligned.
    std::vector<uint32_t> pixels(static_cast<size_t>(width) * height);
    std::memcpy(pixels.data(), data.data, pixels.size() * 4);
    return result(info.Env(), tvg_picture_load_raw(arg<Tvg_Paint>(info, 0), pixels.data(), width, height,
                                                   arg<Tvg_Colorspace>(info, 4), true));
  });

  b.fn("tvg_picture_get_size", [](Info info) -> Napi::Value {
    float size[2] = {0, 0};
    tvg_picture_get_size(arg<Tvg_Paint>(info, 0), &size[0], &size[1]);
    return floatArray(info.Env(), size, 2);
  });

  b.fn("tvg_picture_get_paint", [](Info info) {
    auto paint = tvg_picture_get_paint(arg<Tvg_Paint>(info, 0), arg<uint32_t>(info, 1));
    return makeHandle(info.Env(), paint, Handle::Kind::Paint, false);
  });

  b.fn("tvg_picture_set_asset_resolver", [](Info info) {
    auto picture = arg<Tvg_Paint>(info, 0);
    auto id = arg<intptr_t>(info, 1);
    auto res = id ? tvg_picture_set_asset_resolver(picture, assetResolver, reinterpret_cast<void*>(id))
                  : tvg_picture_set_asset_resolver(picture, nullptr, nullptr);
    return result(info.Env(), res);
  });
}

void installScene(Builder& b) {
  b.create("tvg_scene_new", tvg_scene_new, Handle::Kind::Paint);
  TVG_BIND(b, tvg_scene_add);
  TVG_BIND(b, tvg_scene_remove);
  TVG_BIND(b, tvg_scene_clear_effects);
  TVG_BIND(b, tvg_scene_add_effect_gaussian_blur);
  TVG_BIND(b, tvg_scene_add_effect_motion_blur);
  TVG_BIND(b, tvg_scene_add_effect_drop_shadow);
  TVG_BIND(b, tvg_scene_add_effect_fill);
  TVG_BIND(b, tvg_scene_add_effect_tint);
  TVG_BIND(b, tvg_scene_add_effect_tritone);
}

void installText(Builder& b) {
  b.create("tvg_text_new", tvg_text_new, Handle::Kind::Paint);
  TVG_BIND(b, tvg_text_set_size);
  TVG_BIND(b, tvg_text_align);
  TVG_BIND(b, tvg_text_layout);
  TVG_BIND(b, tvg_text_wrap_mode);
  TVG_BIND(b, tvg_text_line_count);
  TVG_BIND(b, tvg_text_spacing);
  TVG_BIND(b, tvg_text_set_italic);
  TVG_BIND(b, tvg_text_set_outline);
  TVG_BIND(b, tvg_text_set_color);
  TVG_BIND(b, tvg_text_set_gradient);

  b.fn("tvg_text_set_font", [](Info info) {
    auto name = text(info[1]);
    return result(info.Env(), tvg_text_set_font(arg<Tvg_Paint>(info, 0), name.c_str()));
  });

  b.fn("tvg_text_set_text", [](Info info) {
    auto content = text(info[1]);
    return result(info.Env(), tvg_text_set_text(arg<Tvg_Paint>(info, 0), content.c_str()));
  });

  b.fn("tvg_font_load_data", [](Info info) {
    auto name = text(info[0]);
    if (!info[1].IsObject()) return result(info.Env(), tvg_font_load_data(name.c_str(), nullptr, 0, nullptr, false));
    auto data = bytes(info[1]);
    auto mime = text(info[2]);
    return result(info.Env(), tvg_font_load_data(name.c_str(), reinterpret_cast<const char*>(data.data),
                                                 static_cast<uint32_t>(data.size), mime.c_str(), true));
  });
}

void installAnimation(Builder& b) {
  b.create("tvg_animation_new", tvg_animation_new, Handle::Kind::Animation);
  b.create("tvg_lottie_animation_new", tvg_lottie_animation_new, Handle::Kind::Animation);
  TVG_BIND(b, tvg_animation_set_segment);
  TVG_BIND(b, tvg_animation_del);
  TVG_BIND(b, tvg_lottie_animation_apply_slot);
  TVG_BIND(b, tvg_lottie_animation_del_slot);
  TVG_BIND(b, tvg_lottie_animation_set_quality);
  TVG_BIND(b, tvg_lottie_animation_set_volume);
  TVG_BIND(b, tvg_lottie_animation_get_volume);

  b.fn("tvg_animation_set_frame", [](Info info) {
    auto env = info.Env();
    clearPending(env);
    auto res = tvg_animation_set_frame(arg<Tvg_Animation>(info, 0), arg<float>(info, 1));
    rethrowPending(env);
    return result(env, res);
  });

  b.fn("tvg_lottie_animation_set_audio_resolver", [](Info info) {
    auto env = info.Env();
    auto animation = arg<Tvg_Animation>(info, 0);
    auto id = arg<intptr_t>(info, 1);
    clearPending(env);
    auto res = id ? tvg_lottie_animation_set_audio_resolver(animation, audioResolver, reinterpret_cast<void*>(id))
                  : tvg_lottie_animation_set_audio_resolver(animation, nullptr, nullptr);
    rethrowPending(env);
    return result(env, res);
  });

  b.fn("tvg_animation_get_picture", [](Info info) {
    return makeHandle(info.Env(), tvg_animation_get_picture(arg<Tvg_Animation>(info, 0)), Handle::Kind::Paint, false);
  });

  b.fn("tvg_animation_get_total_frame", [](Info info) {
    float frames = 0;
    tvg_animation_get_total_frame(arg<Tvg_Animation>(info, 0), &frames);
    return Napi::Number::New(info.Env(), frames);
  });

  b.fn("tvg_animation_get_duration", [](Info info) {
    float duration = 0;
    tvg_animation_get_duration(arg<Tvg_Animation>(info, 0), &duration);
    return Napi::Number::New(info.Env(), duration);
  });

  b.fn("tvg_lottie_animation_gen_slot", [](Info info) {
    auto slot = text(info[1]);
    return Napi::Number::New(info.Env(), tvg_lottie_animation_gen_slot(arg<Tvg_Animation>(info, 0), slot.c_str()));
  });

  b.fn("tvg_lottie_animation_set_marker", [](Info info) {
    auto animation = arg<Tvg_Animation>(info, 0);
    if (!info[1].IsString()) return result(info.Env(), tvg_lottie_animation_set_marker(animation, nullptr));
    auto marker = text(info[1]);
    return result(info.Env(), tvg_lottie_animation_set_marker(animation, marker.c_str()));
  });

  b.fn("tvg_lottie_animation_get_markers_cnt", [](Info info) -> Napi::Value {
    uint32_t cnt = 0;
    auto res = tvg_lottie_animation_get_markers_cnt(arg<Tvg_Animation>(info, 0), &cnt);
    auto out = Napi::Object::New(info.Env());
    out.Set("result", static_cast<int>(res));
    out.Set("count", static_cast<double>(cnt));
    return out;
  });

  b.fn("tvg_lottie_animation_get_marker_info", [](Info info) -> Napi::Value {
    auto env = info.Env();
    const char* name = nullptr;
    float begin = 0;
    float end = 0;
    auto res = tvg_lottie_animation_get_marker_info(arg<Tvg_Animation>(info, 0), arg<uint32_t>(info, 1), &name, &begin, &end);
    auto out = Napi::Object::New(env);
    out.Set("result", static_cast<int>(res));
    out.Set("name", string(env, name));
    out.Set("begin", static_cast<double>(begin));
    out.Set("end", static_cast<double>(end));
    return out;
  });
}

void installAccessor(Builder& b) {
  b.create("tvg_accessor_new", tvg_accessor_new, Handle::Kind::Accessor);
  TVG_BIND(b, tvg_accessor_del);

  b.fn("tvg_accessor_generate_id", [](Info info) {
    auto name = text(info[0]);
    return Napi::Number::New(info.Env(), tvg_accessor_generate_id(name.c_str()));
  });

  b.fn("tvg_accessor_get_name", [](Info info) {
    return string(info.Env(), tvg_accessor_get_name(arg<Tvg_Accessor>(info, 0), arg<uint32_t>(info, 1)));
  });

  b.fn("tvg_accessor_set", [](Info info) {
    auto env = info.Env();
    auto id = arg<intptr_t>(info, 2);
    clearPending(env);
    auto res = tvg_accessor_set(arg<Tvg_Accessor>(info, 0), arg<Tvg_Paint>(info, 1), accessorVisitor,
                                reinterpret_cast<void*>(id));
    rethrowPending(env);
    return result(env, res);
  });
}

std::string engineVersion() {
  uint32_t major = 0;
  uint32_t minor = 0;
  uint32_t micro = 0;
  const char* version = nullptr;
  tvg_engine_version(&major, &minor, &micro, &version);
  if (version) return version;
  return std::to_string(major) + "." + std::to_string(minor) + "." + std::to_string(micro);
}

}

void install(Napi::Env env, Napi::Object exports) {
  Builder builder(env, exports);
  installEngine(builder);
  installHandles(builder);
  installCanvas(builder);
  installPaint(builder);
  installShape(builder);
  installGradient(builder);
  installPicture(builder);
  installScene(builder);
  installText(builder);
  installAnimation(builder);
  installAccessor(builder);
  exports.Set("version", Napi::String::New(env, engineVersion()));
}

}
