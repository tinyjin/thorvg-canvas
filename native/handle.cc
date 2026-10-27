#include "handle.h"

#include <utility>

namespace thorvg::node {

namespace {

const napi_type_tag kHandleTag = {0x7468'6f72'7667'0001ULL, 0x6861'6e64'6c65'0001ULL};

thread_local Napi::Env* tCurrent = nullptr;

void release(void* ptr, Handle::Kind kind) {
  switch (kind) {
    case Handle::Kind::Paint:
      tvg_paint_unref(static_cast<Tvg_Paint>(ptr), true);
      break;
    case Handle::Kind::Gradient:
      tvg_gradient_del(static_cast<Tvg_Gradient>(ptr));
      break;
    case Handle::Kind::Animation:
      tvg_animation_del(static_cast<Tvg_Animation>(ptr));
      break;
    case Handle::Kind::Accessor:
      tvg_accessor_del(static_cast<Tvg_Accessor>(ptr));
      break;
  }
}

}

const napi_type_tag kCanvasTag = {0x7468'6f72'7667'0001ULL, 0x6361'6e76'6173'0001ULL};

void ReleaseQueue::push(std::function<void()> task) {
  if (rendering == 0) {
    task();
    return;
  }
  pending.push_back(std::move(task));
}

void ReleaseQueue::drain() {
  if (rendering != 0 || pending.empty()) return;
  auto tasks = std::exchange(pending, {});
  for (auto& task : tasks) task();
}

Instance& instance(Napi::Env env) { return *env.GetInstanceData<Instance>(); }

Napi::Env* currentEnv() { return tCurrent; }

Scope::Scope(Napi::Env env) : env_(env), previous_(tCurrent) { tCurrent = &env_; }

Scope::~Scope() { tCurrent = previous_; }

Handle::~Handle() {
  if (!owned_ || !ptr_) return;
  releases_->push([ptr = ptr_, kind = kind_] { release(ptr, kind); });
}

Napi::Value makeHandle(Napi::Env env, void* ptr, Handle::Kind kind, bool owned) {
  if (!ptr) return env.Null();
  auto handle = new Handle(ptr, kind, owned, instance(env).releases);
  auto external = Napi::External<Handle>::New(env, handle, [](Napi::Env, Handle* h) { delete h; });
  external.TypeTag(&kHandleTag);
  return external;
}

Handle* findHandle(Napi::Env env, const Napi::Value& value) {
  if (value.IsNull() || value.IsUndefined()) return nullptr;
  if (!value.IsExternal() || !value.As<Napi::External<Handle>>().CheckTypeTag(&kHandleTag)) {
    throw Napi::TypeError::New(env, "ThorVG: expected a native handle");
  }
  return value.As<Napi::External<Handle>>().Data();
}

}
