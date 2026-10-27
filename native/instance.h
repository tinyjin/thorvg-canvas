#pragma once

#include <napi.h>

#include <exception>
#include <functional>
#include <memory>
#include <vector>

namespace thorvg::node {

// Native frees that must wait until no canvas is rendering off the JS thread.
// Shared with every handle so a finalizer that runs during env teardown still
// has somewhere valid to go.
struct ReleaseQueue {
  int rendering = 0;
  std::vector<std::function<void()>> pending;

  void push(std::function<void()> task);
  void drain();
};

// One per Node environment (main thread + each worker_thread).
struct Instance {
  std::shared_ptr<ReleaseQueue> releases = std::make_shared<ReleaseQueue>();
  Napi::FunctionReference dispatcher;
  std::exception_ptr pendingError;
};

Instance& instance(Napi::Env env);

// The environment whose binding is executing on this thread, or null when ThorVG
// calls back from one of its own task threads. Callbacks into JS are only legal
// while this is set.
Napi::Env* currentEnv();

class Scope {
 public:
  explicit Scope(Napi::Env env);
  ~Scope();

 private:
  Napi::Env env_;
  Napi::Env* previous_;
};

}
