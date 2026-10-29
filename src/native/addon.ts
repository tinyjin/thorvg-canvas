import type { ThorVGNative } from './binding';

// Built to CommonJS only, and requires the binary by literal paths inside try blocks, so
// that bundlers can embed the binaries that are installed and skip the rest. Paths are
// relative to dist/.
export function load(target: string): ThorVGNative {
  const errors: string[] = [];
  try {
    return require('../build/Release/thorvg.node');
  } catch (error) {
    errors.push(`  build/Release: ${(error as Error).message.split('\n')[0]}`);
  }
  try {
    switch (target) {
      case 'darwin-arm64':
        return require('../prebuilds/darwin-arm64/thorvg.node');
      case 'darwin-x64':
        return require('../prebuilds/darwin-x64/thorvg.node');
      case 'linux-arm64-gnu':
        return require('../prebuilds/linux-arm64-gnu/thorvg.node');
      case 'linux-arm64-musl':
        return require('../prebuilds/linux-arm64-musl/thorvg.node');
      case 'linux-x64-gnu':
        return require('../prebuilds/linux-x64-gnu/thorvg.node');
      case 'linux-x64-musl':
        return require('../prebuilds/linux-x64-musl/thorvg.node');
      case 'win32-arm64':
        return require('../prebuilds/win32-arm64/thorvg.node');
      case 'win32-x64':
        return require('../prebuilds/win32-x64/thorvg.node');
    }
  } catch (error) {
    errors.push(`  prebuilds/${target}: ${(error as Error).message.split('\n')[0]}`);
  }
  throw new Error(`thorvg-canvas: cannot load the native binary for ${target}.\n${errors.join('\n')}`);
}
