import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { repository, site } from './site.mjs';

const WEBCANVAS_API = 'https://thorvg.github.io/thorvg.web/';

const config: Config = {
  title: 'ThorVG for Node.js',
  tagline: 'Headless vector graphics and Lottie rendering for Node.js.',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: site.url,
  baseUrl: site.baseUrl,
  organizationName: site.owner,
  projectName: site.name,
  trailingSlash: false,

  onBrokenLinks: 'throw',

  customFields: {
    repository,
    webcanvasVersion: site.webcanvasVersion,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${repository}/tree/main/docs/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ThorVG for Node.js',
      logo: {
        alt: 'ThorVG',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        { to: '/docs/api', label: 'API', position: 'left' },
        { to: '/docs/examples', label: 'Examples', position: 'left' },
        {
          href: WEBCANVAS_API,
          label: 'WebCanvas API',
          position: 'right',
        },
        {
          href: repository,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting started', to: '/docs/getting-started' },
            { label: 'API', to: '/docs/api' },
            { label: 'Examples', to: '/docs/examples' },
          ],
        },
        {
          title: 'ThorVG',
          items: [
            { label: 'thorvg.org', href: 'https://thorvg.org' },
            { label: 'WebCanvas API', href: WEBCANVAS_API },
            { label: 'ThorVG', href: 'https://github.com/thorvg/thorvg' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: repository },
            {
              label: 'npm',
              href: `https://www.npmjs.com/package/${site.packageName}`,
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
