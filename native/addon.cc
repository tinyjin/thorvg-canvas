#include <napi.h>

#include "bindings.h"
#include "instance.h"

namespace thorvg::node {

// Context-aware: every environment (main thread, each worker_thread) gets its
// own Instance, so handles, the callback dispatcher and the release queue never
// cross isolates.
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  env.SetInstanceData(new Instance());
  install(env, exports);
  return exports;
}

}

static Napi::Object InitAddon(Napi::Env env, Napi::Object exports) { return thorvg::node::Init(env, exports); }

NODE_API_MODULE(thorvg, InitAddon)
