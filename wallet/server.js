import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { regtestRpc } from './regtest-rpc.js';
import { createBalanceReader } from './balance.js';
import { addressScript } from './src/address.js';
import { createSendService } from './send-service.js';

const resources = new Map([['/', ['index.html', 'text/html; charset=utf-8']], ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/style.css', ['style.css', 'text/css; charset=utf-8']]]);
export const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; worker-src 'none'";

export function createWalletServer({ mainnet = false, readFees = null, readBalance = createBalanceReader(regtestRpc()), sendService = createSendService(regtestRpc({ broadcast: true })), profiles = null, localApi = true, directory = null, csp = CSP } = {}) {
  const scope = mainnet ? 'mainnet' : 'regtest';
  const network = mainnet ? 'bloz-mainnet' : 'bloz-regtest';
  const api = '/api/' + scope;
  let activeReads = 0, lastRead = 0;
  let sending = false;
  let readingFees = false;
  return http.createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=()');
    const authority = `127.0.0.1:${res.socket.localPort}`;
    if (req.headers.host !== authority || (req.headers.origin && req.headers.origin !== `http://${authority}`)
        || req.headers['sec-fetch-site'] === 'cross-site') { res.writeHead(403); res.end(); return; }
    if (profiles && req.url === '/connections.json' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(profiles)); return;
    }
    if (!localApi && req.url.startsWith('/api/')) { res.writeHead(404); res.end(); return; }
    if (req.url === api + '/broadcast' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (req.headers.origin !== `http://${authority}` || req.headers['x-bloz-' + scope] !== 'signed-only'
          || req.headers['content-type'] !== 'application/json') { res.writeHead(403); res.end('{}'); return; }
      if (sending) { res.writeHead(429); res.end(JSON.stringify({ error: 'Invio in corso.' })); return; }
      sending = true;
      try {
        let body = '';
        req.setTimeout(10_000, () => req.destroy());
        for await (const chunk of req) { body += chunk; if (body.length > 4096) throw new Error('Payload eccessivo.'); }
        req.setTimeout(0);
        const data = JSON.parse(body);
        if (!data || Object.keys(data).join() !== 'raw') throw new Error('Payload non valido.');
        const result = await sendService.broadcast(data.raw);
        res.writeHead(200); res.end(JSON.stringify(result));
      } catch {
        res.writeHead(400); res.end(JSON.stringify({ error: 'Invio non confermato. Conserva l’ID e aggiorna il saldo: non ripetere un nuovo invio senza verificarne l’esito.' }));
      } finally { sending = false; }
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    if (mainnet && req.url === api + '/fees' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (readingFees) { res.writeHead(429); res.end('{}'); return; }
      readingFees = true;
      try { const result = await readFees(); res.writeHead(200); res.end(JSON.stringify(result)); }
      catch { res.writeHead(503); res.end(JSON.stringify({ error: 'Commissione non disponibile. Verifica sincronizzazione e connessione del nodo.' })); }
      finally { readingFees = false; }
      return;
    }
    if (req.url.startsWith(api + '/coins/')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const address = req.url.slice((api + '/coins/').length);
      try { addressScript(address, network); } catch { res.writeHead(400); res.end('{}'); return; }
      if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
      if (activeReads || Date.now() - lastRead < 1000) { res.writeHead(429); res.end('{}'); return; }
      activeReads++; lastRead = Date.now();
      try { const result = await sendService.coins(address); res.writeHead(200); res.end(JSON.stringify(result)); }
      catch { if (!res.headersSent) res.writeHead(503); res.end(JSON.stringify({ error: 'Accrediti non disponibili.' })); }
      finally { activeReads--; }
      return;
    }
    if (req.url.startsWith(api + '/balance/')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const address = req.url.slice((api + '/balance/').length);
      try { addressScript(address, network); } catch { res.writeHead(400); res.end(JSON.stringify({ error: 'Serve un indirizzo SegWit BLOZ della rete corretta.' })); return; }
      if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
      if (activeReads || Date.now() - lastRead < 1000) { res.writeHead(429, { 'Retry-After': '1' }); res.end(JSON.stringify({ error: 'Lettura in corso. Riprova tra poco.' })); return; }
      activeReads++; lastRead = Date.now();
      try { const data = await readBalance(address); res.writeHead(200); res.end(JSON.stringify(data)); }
      catch { res.writeHead(503); res.end(JSON.stringify({ error: 'Saldo non disponibile: controlla il nodo locale e riprova se la catena sta cambiando.' })); }
      finally { activeReads--; }
      return;
    }
    const resource = resources.get(req.url);
    if (!resource) { res.writeHead(404); res.end(); return; }
    try {
      const bytes = await readFile(new URL(`./${directory ?? (mainnet ? 'dist-mainnet' : 'dist')}/${resource[0]}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': resource[1] });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(503); res.end('Eseguire prima npm run build nella cartella wallet.'); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createWalletServer();
  server.listen(8083, '127.0.0.1', () => console.log('BLOZ Wallet TEST — http://127.0.0.1:8083'));
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}

