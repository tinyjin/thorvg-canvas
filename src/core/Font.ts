import type { FontProvider, LoadFontOptions } from '../common/types';
import { checkResult } from '../common/errors';
import { getNative } from '../native/binding';

export class Font {
  static #provider: FontProvider | null = null;
  static readonly #loaded = new Set<string>();

  public static provider(provider: FontProvider): void {
    Font.#provider = provider;
  }

  public static load(
    name: string,
    data: Uint8Array,
    options?: LoadFontOptions
  ): void;
  public static load(
    name: string,
    options?: Record<string, unknown>
  ): Promise<void>;
  public static load(
    name: string,
    dataOrOptions?: Uint8Array | Record<string, unknown>,
    loadOptions?: LoadFontOptions
  ): void | Promise<void> {
    if (dataOrOptions instanceof Uint8Array) {
      Font.#loadData(name, dataOrOptions, loadOptions);
      return;
    }

    if (Font.#loaded.has(name)) {
      return Promise.resolve();
    }

    const provider = Font.#provider;
    if (!provider) {
      return Promise.reject(
        new Error(
          `Font.load("${name}"): no font provider is set. Call Font.provider() or pass the font data.`
        )
      );
    }

    Font.#loaded.add(name);
    return provider
      .fetch(name, dataOrOptions)
      .then((result) => {
        Font.#loadData(name, result.data, { type: result.type });
      })
      .catch((err) => {
        Font.#loaded.delete(name);
        throw err;
      });
  }

  public static unload(name: string): void {
    Font.#loaded.delete(name);
    checkResult(
      getNative().tvg_font_load_data(name, null, null),
      `Font.unload("${name}")`
    );
  }

  static #loadData(
    name: string,
    data: Uint8Array,
    options: LoadFontOptions = {}
  ): void {
    const { type = 'ttf' } = options;
    checkResult(
      getNative().tvg_font_load_data(name, data, type),
      `Font.load("${name}")`
    );
  }
}
