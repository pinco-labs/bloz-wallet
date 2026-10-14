import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await build({ entryPoints: [fileURLToPath(new URL('./src/app.js', import.meta.url))],
  outfile: fileURLToPath(new URL('./dist/app.js', import.meta.url)),
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', legalComments: 'linked', sourcemap: false });
for (const file of ['index.html', 'style.css']) await copyFile(new URL(`./public/${file}`, import.meta.url), new URL(`./dist/${file}`, import.meta.url));
console.log('Wallet locale compilato: risorse autonome, nessuna CDN.');
