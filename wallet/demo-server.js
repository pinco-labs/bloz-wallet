// Local preview only. Public hosting must serve dist-demo with the supplied security headers.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { DEMO_CSP } from './build-demo.js';

export function createDemoServer({ mainnetOffline = false } = {}) {
  const directory = mainnetOffline ? './dist-mainnet-offline/' : './dist-demo/';
  const files = new Map([['/', ['index.html', 'text/html; charset=utf-8']], ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/style.css', ['style.css', 'text/css; charset=utf-8']], ['/LICENSES.txt', ['LICENSES.txt', 'text/plain; charset=utf-8']]]);
  return http.createServer(async (req, res) => {
    const origin = `http://127.0.0.1:${res.socket.localPort}`;
    res.setHeader('Content-Security-Policy', DEMO_CSP); res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=()');
    if (`http://${req.headers.host}` !== origin || (req.headers.origin && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site') { res.writeHead(403); res.end(); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const file = files.get(req.url);
    if (!file) { res.writeHead(404); res.end(); return; }
    try { const data = await readFile(new URL(directory + file[0], import.meta.url)); res.writeHead(200, { 'Content-Type': file[1] }); res.end(req.method === 'HEAD' ? undefined : data); }
    catch { res.writeHead(503); res.end('Compilare prima la demo.'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createDemoServer();
  server.listen(8087, '127.0.0.1', () => console.log('BLOZ Demo — http://127.0.0.1:8087'));
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
