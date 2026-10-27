import type { AnimationInfo } from '../common/types';
import { NativeObject } from '../native/NativeObject';
import { Picture } from './Picture';
import { checkResult, handleError, ThorVGResultCode } from '../common/errors';
import { getNative, type Handle } from '../native/binding';
import { cancelFrame, requestFrame, type FrameHandle } from '../native/frame';

export class Animation extends NativeObject {
  #picture: Picture | null = null;
  #info: AnimationInfo | null = null;
  #isPlaying = false;
  #currentFrame = 0;
  #animationFrameId: FrameHandle | null = null;
  #lastTime = 0;
  #onFrame?: (frame: number) => void;
  #loop = true;

  constructor(handle?: Handle) {
    super(handle ?? getNative().tvg_animation_new());
  }

  protected _cleanup(handle: Handle): void {
    getNative().tvg_animation_del(handle);
  }

  public get picture(): Picture | null {
    if (!this.#picture && !this.isDisposed) {
      const handle = getNative().tvg_animation_get_picture(this.handle);
      if (handle) {
        this.#picture = new Picture(handle);
        this.#picture._owner = this;
      }
    }
    return this.#picture;
  }

  public load(data: Uint8Array | string): this {
    const picture = this.picture;
    if (!picture) {
      handleError('Failed to get picture from animation', 'load');
      return this;
    }

    picture.load(data, { type: 'lot' });
    this.#updateInfo();
    return this;
  }

  public info(): AnimationInfo | null {
    return this.#info;
  }

  public frame(): number;
  public frame(frameNumber: number): this;
  public frame(frameNumber?: number): number | this {
    if (frameNumber !== undefined) {
      this.#currentFrame = frameNumber;
      const result = getNative().tvg_animation_set_frame(this.handle, frameNumber);
      if (
        result !== ThorVGResultCode.Success &&
        result !== ThorVGResultCode.InsufficientCondition
      ) {
        checkResult(result, 'frame (set)');
      }
      return this;
    }
    return this.#currentFrame;
  }

  public segment(begin: number, end: number): this {
    checkResult(
      getNative().tvg_animation_set_segment(this.handle, begin, end),
      'segment'
    );
    return this;
  }

  public play(onFrame?: (frame: number) => void): this {
    if (this.#isPlaying) {
      return this;
    }

    if (!this.#info) {
      handleError('No animation loaded', 'play');
      return this;
    }

    this.#isPlaying = true;
    this.#onFrame = onFrame;
    this.#lastTime = 0;
    this.#animate(performance.now());
    return this;
  }

  public pause(): this {
    this.#isPlaying = false;
    if (this.#animationFrameId !== null) {
      cancelFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
    return this;
  }

  public stop(): this {
    this.pause();
    this.frame(0);
    return this;
  }

  public isPlaying(): boolean {
    return this.#isPlaying;
  }

  public setLoop(loop: boolean): this {
    this.#loop = loop;
    return this;
  }

  public getLoop(): boolean {
    return this.#loop;
  }

  public seek(time: number): this {
    if (!this.#info) {
      handleError('No animation loaded', 'seek');
      return this;
    }
    const frame = (time / this.#info.duration) * this.#info.totalFrames;
    this.frame(Math.max(0, Math.min(this.#info.totalFrames - 1, frame)));
    return this;
  }

  public getCurrentTime(): number {
    if (!this.#info) {
      return 0;
    }
    return (this.#currentFrame / this.#info.totalFrames) * this.#info.duration;
  }

  public override dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.pause();
    this.#info = null;

    if (this.#picture) {
      const picture = this.#picture;
      picture.resolver(null);
      picture._owner = null;
      this.#picture = null;
      for (; picture._retains > 0; picture._retains--) {
        getNative().tvg_paint_unref(picture.handle, false);
      }
    }

    super.dispose();
  }

  #animate = (time: number): void => {
    if (!this.#isPlaying || !this.#info) {
      return;
    }

    if (this.#lastTime === 0) {
      this.#lastTime = time;
    }

    const deltaTime = (time - this.#lastTime) / 1000;
    this.#lastTime = time;

    this.#currentFrame += this.#info.fps * deltaTime;

    if (this.#currentFrame >= this.#info.totalFrames) {
      if (this.#loop) {
        this.#currentFrame = this.#currentFrame % this.#info.totalFrames;
      } else {
        this.#currentFrame = this.#info.totalFrames - 1;
        this.pause();
        return;
      }
    }

    getNative().tvg_animation_set_frame(this.handle, this.#currentFrame);

    if (this.#onFrame) {
      this.#onFrame(this.#currentFrame);
    }

    this.#animationFrameId = requestFrame(this.#animate);
  };

  #updateInfo(): void {
    const native = getNative();
    const totalFrames = native.tvg_animation_get_total_frame(this.handle);
    const duration = native.tvg_animation_get_duration(this.handle);
    this.#info = {
      totalFrames,
      duration,
      fps: totalFrames / duration,
    };
  }
}
