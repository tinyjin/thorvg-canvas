import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);

export const repository = String(pkg.repository.url)
  .replace(/^git\+/, '')
  .replace(/\.git$/, '');

const [owner, name] = new URL(repository).pathname.slice(1).split('/');

export const site = {
  owner,
  name,
  packageName: pkg.name,
  webcanvasVersion: String(pkg.dependencies['@thorvg/webcanvas']).replace(
    /^[^\d]*/,
    ''
  ),
  url: `https://${owner}.github.io`,
  baseUrl: `/${name}/`,
};
