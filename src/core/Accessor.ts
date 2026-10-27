import { NativeObject } from '../native/NativeObject';
import { Paint } from './Paint';
import { registerCallback, unregisterCallback } from '../native/callbacks';
import { checkResult } from '../common/errors';
import { getNative, type Handle } from '../native/binding';

export class Accessor extends NativeObject {
  constructor() {
    super(getNative().tvg_accessor_new());
  }

  protected _cleanup(handle: Handle): void {
    getNative().tvg_accessor_del(handle);
  }

  static id(name: string): number {
    return getNative().tvg_accessor_generate_id(name);
  }

  public set(paint: Paint, callback: (paint: Paint) => boolean): void {
    const id = registerCallback((handle: Handle) =>
      callback(Paint.fromHandle(handle))
    );
    try {
      checkResult(
        getNative().tvg_accessor_set(this.handle, paint.handle, id),
        'Accessor.set'
      );
    } finally {
      unregisterCallback(id);
    }
  }

  public name(id: number): string | null {
    return getNative().tvg_accessor_get_name(this.handle, id);
  }
}
