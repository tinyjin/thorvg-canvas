// Renders every case in test/visual/cases.js with @thorvg/webcanvas (browser, WebAssembly)
// and with thorvg-canvas (Node, native), and requires the two to match.
//
// A side-by-side report is written to test/visual/output/index.html.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { SIZE, cases } from './cases.js';
import { renderNode, renderWeb } from './render.mjs';

const TOLERANCE = 2;
const MAX_OUTLIERS = 4;
const OUTLIER_DELTA = 32;

const output = join(dirname(fileURLToPath(import.meta.url)), 'output');
const rows = [];
let node;
let web;

before(async () => {
  node = renderNode();
  web = await renderWeb();
});

for (const name of Object.keys(cases)) {
  test(name, () => {
    const a = node.results[name];
    const b = web.results[name];
    assert.ok(!b.error, `webcanvas failed:\n${b.error}`);
    assert.ok(!a.error, `thorvg-canvas failed:\n${a.error}`);
    assert.equal(a.data.length, SIZE * SIZE * 4, 'thorvg-canvas output size');
    assert.equal(b.data.length, SIZE * SIZE * 4, 'webcanvas output size');

    const stats = compare(b.data, a.data);
    rows.push({ name, stats, web: b.data, node: a.data });

    assert.ok(stats.ink > 0, 'the reference render is empty, so the case verifies nothing');
    assert.ok(
      passes(stats),
      `${stats.over} px differ by more than ${TOLERANCE} (max ${stats.maxDelta}); ` +
        `allowed: ${MAX_OUTLIERS} px up to ${OUTLIER_DELTA}. See test/visual/output/index.html`
    );
  });
}

after(() => {
  if (!rows.length) return;
  writeReport(rows, { node: node?.version, web: web?.version });
});

function passes(stats) {
  return stats.ink > 0 && stats.over <= MAX_OUTLIERS && stats.maxDelta <= OUTLIER_DELTA;
}

function compare(reference, actual) {
  let differing = 0;
  let over = 0;
  let maxDelta = 0;
  let ink = 0;
  const diff = new Uint8Array(reference.length);
  for (let i = 0; i < reference.length; i += 4) {
    let delta = 0;
    for (let c = 0; c < 4; c++) delta = Math.max(delta, Math.abs(reference[i + c] - actual[i + c]));
    if (reference[i + 3]) ink++;
    if (delta) differing++;
    if (delta > TOLERANCE) over++;
    if (delta > maxDelta) maxDelta = delta;
    // Faded reference underneath; within tolerance in amber, beyond it in red.
    const gray = 255 - Math.round((reference[i + 3] / 255) * 60);
    if (delta > TOLERANCE) diff.set([230, 0, 0, 255], i);
    else if (delta) diff.set([255, 170, 0, 255], i);
    else diff.set([gray, gray, gray, 255], i);
  }
  return { differing, over, maxDelta, ink, diff };
}

function png(rgba) {
  const image = new PNG({ width: SIZE, height: SIZE });
  image.data = Buffer.from(rgba);
  return PNG.sync.write(image);
}

function writeReport(results, versions) {
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });

  const identical = results.filter((r) => r.stats.differing === 0).length;
  const failed = results.filter((r) => !passes(r.stats)).length;

  const body = results
    .map(({ name, stats, web: w, node: n }) => {
      const file = name.replace(/\//g, '__');
      writeFileSync(join(output, `${file}.web.png`), png(w));
      writeFileSync(join(output, `${file}.node.png`), png(n));
      writeFileSync(join(output, `${file}.diff.png`), png(stats.diff));
      const status = !passes(stats) ? 'fail' : stats.differing ? 'close' : 'same';
      const label = { same: 'identical', close: 'within tolerance', fail: 'FAIL' }[status];
      return `<tr class="${status}">
  <th>${name}<br><small>${label} · ${stats.differing} px differ · max Δ ${stats.maxDelta}</small></th>
  <td><img src="${file}.web.png"></td>
  <td><img src="${file}.node.png"></td>
  <td><img src="${file}.diff.png"></td>
</tr>`;
    })
    .join('\n');

  writeFileSync(
    join(output, 'index.html'),
    `<!doctype html>
<meta charset="utf-8">
<title>thorvg-canvas visual parity</title>
<style>
  body { font: 14px system-ui, sans-serif; margin: 24px; color: #222; }
  table { border-collapse: collapse; }
  th, td { padding: 8px 12px; border-bottom: 1px solid #e4e4e4; text-align: left; vertical-align: middle; }
  th small { font-weight: normal; color: #777; }
  img { display: block; width: ${SIZE}px; height: ${SIZE}px;
        background: repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0 / 16px 16px; }
  tr.close th small { color: #b77800; }
  tr.fail th, tr.fail th small { color: #c00; }
</style>
<h1>webcanvas ${versions.web} (browser, wasm) vs thorvg-canvas ${versions.node} (Node, native)</h1>
<p>${results.length} cases · ${identical} identical · ${results.length - identical - failed} within tolerance · ${failed} failed.
Tolerance: ±${TOLERANCE} per channel, plus up to ${MAX_OUTLIERS} px up to ±${OUTLIER_DELTA}.
Diff: amber = within ±${TOLERANCE}, red = beyond.</p>
<table>
<tr><th>case</th><th>webcanvas</th><th>thorvg-canvas</th><th>diff</th></tr>
${body}
</table>
`
  );
}
