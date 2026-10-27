// Node has no requestAnimationFrame. play() still works (e.g. streaming frames
// out in real time) on a 60 Hz timer; offline rendering should drive frame(n)
// directly instead, which is deterministic and as fast as the CPU allows.

export type FrameHandle = ReturnType<typeof setTimeout>;

export function requestFrame(callback: (time: number) => void): FrameHandle {
  return setTimeout(() => callback(performance.now()), 1000 / 60);
}

export function cancelFrame(handle: FrameHandle): void {
  clearTimeout(handle);
}
