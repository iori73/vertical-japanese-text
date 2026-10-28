// Bundles scripts/harness.ts into harness.bundle.js (gitignored) for pasting into use_figma.
import * as esbuild from 'esbuild';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await esbuild.build({
  entryPoints: [resolve(root, 'scripts/harness.ts')],
  bundle: true,
  outfile: resolve(root, 'harness.bundle.js'),
  target: 'es2018',
  format: 'iife',
  minify: true,
  logLevel: 'info',
});
