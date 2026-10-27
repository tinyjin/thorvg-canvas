import { Paint } from './Paint';
import { checkResult } from '../common/errors';
import { getNative, type Handle } from '../native/binding';

export class Scene extends Paint {
  constructor(handle?: Handle) {
    super(handle ?? getNative().tvg_scene_new());
  }

  protected _createInstance(handle: Handle): Scene {
    return new Scene(handle);
  }

  public add(paint: Paint): this {
    const native = getNative();
    checkResult(native.tvg_scene_add(this.handle, paint.handle), 'add');
    native.tvg_paint_ref(paint.handle);
    paint._retains++;
    return this;
  }

  public remove(paint?: Paint): this {
    const native = getNative();
    if (paint) {
      checkResult(native.tvg_scene_remove(this.handle, paint.handle), 'remove');
    } else {
      checkResult(native.tvg_scene_remove(this.handle, null), 'remove (all)');
    }
    return this;
  }

  public clear(): this {
    return this.remove();
  }

  public resetEffects(): this {
    checkResult(getNative().tvg_scene_clear_effects(this.handle), 'resetEffects');
    return this;
  }

  public gaussianBlur(
    sigma: number,
    direction: number = 0,
    border: number = 0,
    quality: number = 75
  ): this {
    checkResult(
      getNative().tvg_scene_add_effect_gaussian_blur(
        this.handle,
        sigma,
        direction,
        border,
        quality
      ),
      'gaussianBlur'
    );
    return this;
  }

  public motionBlur(
    distance: number,
    angle: number = 0,
    quality: number = 75
  ): this {
    checkResult(
      getNative().tvg_scene_add_effect_motion_blur(
        this.handle,
        distance,
        angle,
        quality
      ),
      'motionBlur'
    );
    return this;
  }

  public dropShadow(
    r: number,
    g: number,
    b: number,
    a: number,
    angle: number,
    distance: number,
    sigma: number,
    quality: number = 60
  ): this {
    checkResult(
      getNative().tvg_scene_add_effect_drop_shadow(
        this.handle,
        r,
        g,
        b,
        a,
        angle,
        distance,
        sigma,
        quality
      ),
      'dropShadow'
    );
    return this;
  }

  public fillEffect(r: number, g: number, b: number, a: number): this {
    checkResult(
      getNative().tvg_scene_add_effect_fill(this.handle, r, g, b, a),
      'fillEffect'
    );
    return this;
  }

  public tint(
    blackR: number,
    blackG: number,
    blackB: number,
    whiteR: number,
    whiteG: number,
    whiteB: number,
    intensity: number
  ): this {
    checkResult(
      getNative().tvg_scene_add_effect_tint(
        this.handle,
        blackR,
        blackG,
        blackB,
        whiteR,
        whiteG,
        whiteB,
        intensity
      ),
      'tint'
    );
    return this;
  }

  public tritone(
    shadowR: number,
    shadowG: number,
    shadowB: number,
    midtoneR: number,
    midtoneG: number,
    midtoneB: number,
    highlightR: number,
    highlightG: number,
    highlightB: number,
    blend: number
  ): this {
    checkResult(
      getNative().tvg_scene_add_effect_tritone(
        this.handle,
        shadowR,
        shadowG,
        shadowB,
        midtoneR,
        midtoneG,
        midtoneB,
        highlightR,
        highlightG,
        highlightB,
        blend
      ),
      'tritone'
    );
    return this;
  }
}

Paint.registerType(2, (handle) => new Scene(handle));
