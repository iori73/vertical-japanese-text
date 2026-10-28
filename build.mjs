import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

async function buildCode() {
  const options = {
    entryPoints: [resolve(__dirname, 'src/code.ts')],
    bundle: true,
    outfile: resolve(__dirname, 'code.js'),
    target: 'es2018',
    format: 'iife',
    minify: !isWatch,
    logLevel: 'info',
  };
  if (isWatch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('[watch] code.ts');
  } else {
    await esbuild.build(options);
  }
}

async function buildUI() {
  const once = async () => {
    const result = await esbuild.build({
      entryPoints: [resolve(__dirname, 'src/ui/main.ts')],
      bundle: true,
      write: false,
      target: 'es2018',
      format: 'iife',
      minify: !isWatch,
    });
    const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
    const css = readFileSync(resolve(__dirname, 'src/ui/styles.css'), 'utf-8');
    const template = readFileSync(resolve(__dirname, 'src/ui/index.html'), 'utf-8');
    writeFileSync(
      resolve(__dirname, 'ui.html'),
      template.replace('/* __STYLES__ */', () => css).replace('/* __SCRIPT__ */', () => js),
    );
  };
  await once();
  if (isWatch) {
    const { watch } = await import('fs');
    watch(resolve(__dirname, 'src'), { recursive: true }, () => {
      once().catch((e) => console.error(e));
    });
    console.log('[watch] ui');
  }
}

await Promise.all([buildCode(), buildUI()]);
