import type {
  AudioInfo,
  AudioResolver,
  LottieMarker,
  LottieSlotData,
} from '../common/types';
import { Animation } from './Animation';
import { registerCallback, unregisterCallback } from '../native/callbacks';
import { checkResult, handleError, ThorVGResultCode } from '../common/errors';
import { getNative, type NativeAudioInfo } from '../native/binding';

function toAudioInfo(info: NativeAudioInfo): AudioInfo | null {
  let src: string | Uint8Array;
  if (info.embedded) {
    if (!info.data || info.data.length === 0) return null;
    src = info.data;
  } else {
    if (!info.src) return null;
    src = info.src;
  }
  return {
    active: info.active,
    offset: info.offset,
    volume: info.volume / 100,
    src,
    mimeType: info.embedded && info.mimeType ? info.mimeType : null,
  };
}

export class LottieAnimation extends Animation {
  #resolver: AudioResolver | null = null;
  #resolverId = 0;

  constructor() {
    super(getNative().tvg_lottie_animation_new());
  }

  public override load(data: Uint8Array | string): this {
    super.load(data);
    this.#attachAudio();
    return this;
  }

  public override segment(marker: string | null): this;
  public override segment(begin: number, end: number): this;
  public override segment(arg: string | null | number, end?: number): this {
    if (typeof arg === 'number') {
      return super.segment(arg, end as number);
    }
    checkResult(
      getNative().tvg_lottie_animation_set_marker(this.handle, arg),
      'segment (marker)'
    );
    return this;
  }

  public markersCnt(): number {
    const { result, count } = getNative().tvg_lottie_animation_get_markers_cnt(
      this.handle
    );
    if (result !== ThorVGResultCode.Success) {
      checkResult(result, 'markersCnt');
      return 0;
    }
    return count;
  }

  public marker(idx: number): LottieMarker | null {
    const { result, name, begin, end } =
      getNative().tvg_lottie_animation_get_marker_info(this.handle, idx);
    if (result !== ThorVGResultCode.Success) {
      checkResult(result, 'marker');
      return null;
    }
    if (!name) return null;
    return { name, begin, end };
  }

  public gen(slot: LottieSlotData | string): number {
    const json = typeof slot === 'string' ? slot : JSON.stringify(slot);
    const id = getNative().tvg_lottie_animation_gen_slot(this.handle, json);
    if (id === 0) {
      handleError('Failed to generate slot', 'gen');
    }
    return id;
  }

  public apply(id: number): this {
    checkResult(
      getNative().tvg_lottie_animation_apply_slot(this.handle, id),
      'apply'
    );
    return this;
  }

  public del(id: number): this {
    checkResult(getNative().tvg_lottie_animation_del_slot(this.handle, id), 'del');
    return this;
  }

  public quality(value: number): this {
    const clamped = Math.round(Math.max(0, Math.min(100, value)));
    checkResult(
      getNative().tvg_lottie_animation_set_quality(this.handle, clamped),
      'quality'
    );
    return this;
  }

  public volume(): number;
  public volume(value: number): this;
  public volume(value?: number): number | this {
    const native = getNative();
    if (value === undefined)
      return native.tvg_lottie_animation_get_volume(this.handle);
    checkResult(
      native.tvg_lottie_animation_set_volume(this.handle, value),
      'volume'
    );
    return this;
  }

  public resolver(callback: AudioResolver | null): this {
    this.#resolver = callback;
    this.#attachAudio();
    return this;
  }

  public override dispose(): void {
    if (this.isDisposed) {
      return;
    }
    if (this.#resolverId) {
      getNative().tvg_lottie_animation_set_audio_resolver(this.handle, 0);
      unregisterCallback(this.#resolverId);
      this.#resolverId = 0;
    }
    this.#resolver = null;
    super.dispose();
  }

  #attachAudio(): void {
    const native = getNative();

    if (!this.#resolver) {
      if (this.#resolverId) {
        native.tvg_lottie_animation_set_audio_resolver(this.handle, 0);
        unregisterCallback(this.#resolverId);
        this.#resolverId = 0;
      }
      return;
    }

    if (!this.#resolverId) {
      const self = new WeakRef(this);
      this.#resolverId = registerCallback((info: NativeAudioInfo) => {
        const animation = self.deref();
        const resolver = animation ? animation.#resolver : null;
        if (!resolver) return;
        const audio = toAudioInfo(info);
        if (audio) resolver(audio);
      });
    }

    const result = native.tvg_lottie_animation_set_audio_resolver(
      this.handle,
      this.#resolverId
    );
    if (
      result !== ThorVGResultCode.Success &&
      result !== ThorVGResultCode.InsufficientCondition
    ) {
      checkResult(result, 'audio resolver');
    }
  }
}
