import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const file = fileURLToPath(new URL('./scripts/mainnet-rpc-wsl.py', import.meta.url));
const script = '/mnt/' + file[0].toLowerCase() + file.slice(2).replaceAll('\\', '/');
const allowed = new Set(['getblockchaininfo', 'getnetworkinfo', 'getblockhash', 'scantxoutset', 'getrawmempool',
  'getrawtransaction', 'gettxout', 'estimatesmartfee', 'getmempoolinfo', 'testmempoolaccept', 'sendrawtransaction']);
export function mainnetRpc(method, params = []) {
  if (!allowed.has(method)) return Promise.reject(new Error('Metodo non consentito.'));
  return new Promise((resolve, reject) => {
    const child = spawn('wsl.exe', ['-d', 'Ubuntu-24.04', '--', 'python3', script], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    let text = '', done = false;
    const timer = setTimeout(() => { child.kill(); finish(new Error('Nodo mainnet: timeout.')); }, 85_000);
    function finish(error, value) { if (done) return; done = true; clearTimeout(timer); error ? reject(error) : resolve(value); }
    child.on('error', () => finish(new Error('Bridge WSL non disponibile.')));
    child.stdout.setEncoding('utf8'); child.stdout.on('data', (part) => {
      text += part;
      if (text.length > 8_000_000) { child.kill(); finish(new Error('Risposta eccessiva.')); }
    });
    child.on('close', (code) => {
      if (code !== 0) return finish(new Error('Nodo mainnet non disponibile o richiesta rifiutata.'));
      try { finish(null, JSON.parse(text)); } catch { finish(new Error('Risposta mainnet non valida.')); }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify({ method, params }));
  });
}
export async function assertMainnetReady(rpc) {
  const info = await rpc('getblockchaininfo');
  if (info.chain !== 'main' || info.initialblockdownload !== false || info.blocks !== info.headers
      || !Number.isInteger(info.blocks) || info.blocks < 1
      || await rpc('getblockhash', [0]) !== '44c1a8c852b3eda21966e1ddb6b0807e22488dffe8a270bf24bf1fa2d66c13bd') throw new Error('Serve il nodo BLOZ mainnet sincronizzato.');
  const net = await rpc('getnetworkinfo');
  if (!net.networkactive || !Number.isInteger(net.connections) || net.connections < 1
      || !Number.isInteger(info.time) || Date.now() / 1000 - info.time > 7200
      || info.time > Date.now() / 1000 + 7200) throw new Error('Nodo disconnesso o catena non aggiornata.');
  return info;
}
