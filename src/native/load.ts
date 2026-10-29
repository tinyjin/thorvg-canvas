import type { ThorVGNative } from './binding';
import { load } from './addon';

function libc(): string {
  if (process.platform !== 'linux') return '';
  const report = process.report?.getReport() as { header?: { glibcVersionRuntime?: string } } | undefined;
  return report?.header?.glibcVersionRuntime ? '-gnu' : '-musl';
}

/** e.g. `darwin-arm64`, `linux-x64-musl`, `win32-x64`. */
export function target(): string {
  return `${process.platform}-${process.arch}${libc()}`;
}

export function loadNative(): ThorVGNative {
  return load(target());
}
