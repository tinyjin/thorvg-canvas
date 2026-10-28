import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXAMPLES = [
  { name: 'shapes', title: 'Shapes and gradients' },
  { name: 'svg', title: 'SVG to PNG' },
  { name: 'lottie-frames', title: 'Lottie frames' },
  { name: 'text', title: 'Text' },
];

const source = fileURLToPath(new URL('../../examples/', import.meta.url));
const images = fileURLToPath(new URL('../static/examples/', import.meta.url));
const data = fileURLToPath(new URL('../src/data/', import.meta.url));
mkdirSync(images, { recursive: true });
mkdirSync(data, { recursive: true });

const work = mkdtempSync(join(tmpdir(), 'thorvg-canvas-examples-'));
try {
  const entries = EXAMPLES.map(({ name, title }) => {
    const file = join(source, `${name}.mjs`);
    execFileSync(process.execPath, [file], { cwd: work, stdio: 'inherit' });
    copyFileSync(join(work, `${name}.png`), join(images, `${name}.png`));
    return { name, title, code: readFileSync(file, 'utf8'), image: `/examples/${name}.png` };
  });
  writeFileSync(join(data, 'examples.json'), JSON.stringify(entries, null, 2) + '\n');
  console.log(`built ${entries.length} examples`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
