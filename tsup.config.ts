import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    mcp: 'src/mcp.ts',
  },
  format: ['esm'],
  target: 'node18',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  shims: true,
  external: ['@inquirer/prompts'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
