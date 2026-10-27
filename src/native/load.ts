import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ThorVGNative } from './binding';

const require = createRequire(import.meta.url);

function libc(): string {
  if (process.platform !== 'linux') return '';
  const report = process.report?.getReport() as { header?: { glibcVersionRuntime?: string } } | undefined;
  return report?.header?.glibcVersionRuntime ? '-gnu' : '-musl';
}

/** e.g. `darwin-arm64`, `linux-x64-musl`, `win32-x64`. */
export function target(): string {
  return `${process.platform}-${process.arch}${libc()}`;
}

// Every platform's binary ships inside this one package under
// prebuilds/<target>/ (each is well under 1 MB gzipped), so installing needs
// no compiler, no install script and no network. A local node-gyp build wins
// when present, for development.
export function loadNative(): ThorVGNative {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const candidates = [
    join(root, 'build', 'Release', 'thorvg.node'),
    join(root, 'prebuilds', target(), 'thorvg.node'),
  ];

  const errors: string[] = [];
  for (const candidate of candidates) {
    try {
      return require(candidate) as ThorVGNative;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'MODULE_NOT_FOUND' && code !== 'ERR_DLOPEN_FAILED') throw error;
      errors.push(`  ${candidate}: ${(error as Error).message.split('\n')[0]}`);
    }
  }
  throw new Error(`thorvg-canvas: no native binary for ${target()}.\n${errors.join('\n')}`);
}
