// esbuild で src/ を1ファイルにまとめ、CSS と JS をインライン化した dist/index.html を出力する。
// Artifacts（単一HTML）で動かすための構成。Electron 移行時は electron-vite 等に置き換える。
import * as esbuild from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const watch = process.argv.includes('--watch');

async function writeHtml(js) {
  const css = await readFile('src/styles.css', 'utf8');
  const template = await readFile('index.template.html', 'utf8');
  const safeJs = js.replace(/<\/script/gi, '<\\/script');
  const html = template.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => safeJs);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', html);
  console.log(`dist/index.html (${(html.length / 1024).toFixed(1)} KB)`);
}

const options = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: !watch,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  write: false,
  define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
  plugins: [{
    name: 'inline-html',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length) return;
        await writeHtml(result.outputFiles[0].text);
      });
    },
  }],
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('watching src/ ... (dist/index.html をブラウザで開いてください)');
} else {
  await esbuild.build(options);
}
