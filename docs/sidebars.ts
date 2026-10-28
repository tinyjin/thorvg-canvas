import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'getting-started',
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/overview',
        'guides/canvas',
        'guides/output',
        'guides/assets',
        'guides/lottie',
        'guides/text',
        'guides/threads',
      ],
    },
    'api',
    'platforms',
    'examples',
  ],
};

export default sidebars;
