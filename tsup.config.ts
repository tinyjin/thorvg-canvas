import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'node20',
    esbuildPlugins: [
      {
        name: 'external-addon',
        setup(build) {
          build.onResolve({ filter: /^\.\/addon$/ }, () => ({ path: './addon.cjs', external: true }));
        },
      },
    ],
  },
  {
    // Required for bundlers to find the binaries
    entry: { addon: 'src/native/addon.ts' },
    format: ['cjs'],
    bundle: false,
    sourcemap: true,
    target: 'node20',
  },
]);
