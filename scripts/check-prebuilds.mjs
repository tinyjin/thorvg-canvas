// Run on prepack: refuses to publish unless every supported platform's binary is
// in prebuilds/. CI collects them there from the per-platform build jobs.
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TARGETS = [
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64-gnu',
  'linux-arm64-musl',
  'linux-x64-gnu',
  'linux-x64-musl',
  'win32-arm64',
  'win32-x64',
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const missing = [];
if (!existsSync(join(root, 'prebuilds', 'LICENSE'))) missing.push('LICENSE');
for (const target of TARGETS) {
  const binary = join(root, 'prebuilds', target, 'thorvg.node');
  if (existsSync(binary)) {
    console.log(`  ${target.padEnd(18)} ${(statSync(binary).size / 1024).toFixed(0)} KB`);
  } else {
    missing.push(target);
  }
}

if (missing.length) {
  console.error(`Missing prebuilds: ${missing.join(', ')}`);
  process.exit(1);
}
