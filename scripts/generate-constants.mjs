// Generates src/common/constants.ts and src/common/types.ts from the published
// @thorvg/webcanvas declarations.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = dirname(require.resolve('@thorvg/webcanvas'));
const pkg = JSON.parse(readFileSync(join(dist, '..', 'package.json'), 'utf8'));
const declarationPath = join(dist, 'webcanvas.d.ts');

// Option/value types the API classes take or return. Classes are not listed: they
// are implemented here, and test/parity.ts checks them against webcanvas.
const TYPES = [
  'AnimationInfo',
  'AnimationSegment',
  'AssetResolver',
  'AudioInfo',
  'AudioResolver',
  'Bounds',
  'CanvasOptions',
  'ColorStop',
  'ErrorContext',
  'ErrorHandler',
  'FontProvider',
  'FontProviderResult',
  'FontType',
  'InitOptions',
  'LoadDataOptions',
  'LoadFontOptions',
  'LottieMarker',
  'LottieSlotData',
  'Matrix',
  'MimeType',
  'PictureSize',
  'RectOptions',
  'RendererType',
  'StrokeOptions',
  'TextLayout',
  'TextOutline',
];

const program = ts.createProgram([declarationPath], { noEmit: true, skipLibCheck: true });
const checker = program.getTypeChecker();
const source = program.getSourceFile(declarationPath);

const enums = [];
const types = new Map();
source.forEachChild((node) => {
  if (ts.isEnumDeclaration(node)) {
    const members = node.members.map((member) => {
      const value = checker.getConstantValue(member);
      if (typeof value !== 'number') {
        throw new Error(`${node.name.text}.${member.name.getText(source)} is not a numeric constant`);
      }
      return [member.name.getText(source), value];
    });
    enums.push([node.name.text, members]);
  } else if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && TYPES.includes(node.name.text)) {
    const text = source.text.slice(node.getFullStart(), node.end).replace(/^\s+/, '');
    types.set(node.name.text, text.replace(/^((?:\/\*\*[\s\S]*?\*\/\s*)?)(?:declare\s+)?(interface|type)\b/, '$1export $2'));
  }
});

if (enums.length === 0) throw new Error(`No enums found in ${declarationPath}`);
const missing = TYPES.filter((name) => !types.has(name));
if (missing.length) throw new Error(`Not found in ${declarationPath}: ${missing.join(', ')}`);

const banner = `// Generated from @thorvg/webcanvas@${pkg.version} by scripts/generate-constants.mjs. Do not edit.\n\n`;

const constants =
  banner +
  `export const WEBCANVAS_VERSION = '${pkg.version}';\n\n` +
  enums
    .map(([name, members]) => {
      const lines = members.map(([key, value]) => `  ${key} = ${value},`).join('\n');
      return `export enum ${name} {\n${lines}\n}\n`;
    })
    .join('\n');

const typesFile =
  banner +
  `import type { Fill } from '../core/Fill';\n` +
  `import type { Paint } from '../core/Paint';\n` +
  `import type { ${enums.map(([name]) => name).join(', ')} } from './constants';\n\n` +
  [...types.values()].join('\n\n') +
  '\n';

function write(path, next) {
  mkdirSync(dirname(path), { recursive: true });
  let previous = '';
  try {
    previous = readFileSync(path, 'utf8');
  } catch {}
  if (previous !== next) writeFileSync(path, next);
}

write(join(root, 'src/common/constants.ts'), constants);
write(join(root, 'src/common/types.ts'), typesFile);
console.log(`${enums.length} enums, ${types.size} types from @thorvg/webcanvas@${pkg.version}`);
