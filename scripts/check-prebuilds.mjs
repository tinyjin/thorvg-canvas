// Run on prepack: refuses to publish unless every supported platform's binary is
// in prebuilds/. CI collects them there from the per-platform build jobs.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The supported platforms are the ones the addon loader requires.
const addon = readFileSync(join(root, 'src', 'native', 'addon.ts'), 'utf8');
const TARGETS = [...addon.matchAll(/'\.\.\/prebuilds\/([\w-]+)\/thorvg\.node'/g)].map((match) => match[1]);

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
