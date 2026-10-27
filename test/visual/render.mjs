// Renders every case twice: with thorvg-canvas here in Node, and with @thorvg/webcanvas
// (sw renderer, WebAssembly) in headless Chromium. Both return { name: Uint8Array RGBA }.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { initSync } from '../../dist/index.js';
import { ASSETS, cases, renderCase } from './cases.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const resources = join(root, 'thorvg', 'test', 'resources');
const webcanvas = dirname(createRequire(import.meta.url).resolve('@thorvg/webcanvas'));

function loadAssets() {
  return Object.fromEntries(
    Object.entries(ASSETS).map(([name, kind]) => {
      const bytes = readFileSync(join(resources, name));
      return [name, kind === 'text' ? bytes.toString('utf8') : new Uint8Array(bytes)];
    })
  );
}

export function renderNode() {
  const TVG = initSync();
  const assets = loadAssets();
  const results = {};
  for (const name of Object.keys(cases)) {
    try {
      const canvas = renderCase(TVG, name, null, assets);
      results[name] = { data: new Uint8Array(canvas.getImageData().data) };
      canvas.destroy();
    } catch (error) {
      results[name] = { error: String(error?.stack ?? error) };
    }
  }
  return { version: TVG.version, results };
}

// The page is served from a fake origin straight off disk: no server, no port.
const ORIGIN = 'http://thorvg.test';
const ROUTES = [
  ['/webcanvas/', webcanvas],
  ['/visual/', here],
  ['/resources/', resources],
];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };

function resolve(pathname) {
  if (pathname === '/') return join(here, 'page.html');
  for (const [prefix, dir] of ROUTES) {
    if (pathname.startsWith(prefix)) return join(dir, decodeURIComponent(pathname.slice(prefix.length)));
  }
  return null;
}

export async function renderWeb() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const logs = [];
    page.on('console', (message) => logs.push(`[${message.type()}] ${message.text()}`));
    page.on('pageerror', (error) => logs.push(`[pageerror] ${error.message}`));
    await page.route(`${ORIGIN}/**`, (route) => {
      const file = resolve(new URL(route.request().url()).pathname);
      try {
        const body = readFileSync(file);
        return route.fulfill({ body, contentType: MIME[extname(file)] ?? 'application/octet-stream' });
      } catch {
        return route.fulfill({ status: 404, body: `not found: ${file}` });
      }
    });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => typeof window.renderAll === 'function', null, { timeout: 30_000 }).catch(() => {
      throw new Error(`webcanvas page did not load:\n${logs.join('\n')}`);
    });
    const { version, results } = await page.evaluate(() => window.renderAll());
    for (const entry of Object.values(results)) {
      if (entry.data) entry.data = new Uint8Array(Buffer.from(entry.data, 'base64'));
    }
    return { version, results, logs };
  } finally {
    await browser.close();
  }
}
