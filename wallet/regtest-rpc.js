import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export const DATA_DIR = fileURLToPath(new URL('../work/wallet-regtest/', import.meta.url));
export const RPC_PORT = 18454;
export const GENESIS = '73c34a3024168f08a73380613563165c00a39e06e84a8e3e4997fd32e0ba4b39';
const READ_METHODS = new Set(['getblockchaininfo', 'getnetworkinfo', 'getblockhash', 'getblock', 'getrawmempool', 'getrawtransaction', 'gettxout', 'testmempoolaccept']);

// Fixed loopback destination and dedicated cookie; never reads explorer/.env or user wallets.
export function regtestRpc({ control = false, broadcast = false } = {}) {
  return async (method, params = []) => {
    if (!READ_METHODS.has(method) && !(broadcast && method === 'sendrawtransaction') && !(control && ['generatetoaddress', 'stop', 'invalidateblock', 'reconsiderblock'].includes(method))) throw new Error('Metodo RPC non consentito.');
    const cookie = (await readFile(new URL('../work/wallet-regtest/regtest/.cookie', import.meta.url), 'utf8')).trim();
    const response = await fetch(`http://127.0.0.1:${RPC_PORT}/`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(method === 'generatetoaddress' ? 1_800_000 : 30_000),
      headers: { Authorization: `Basic ${Buffer.from(cookie).toString('base64')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'local-regtest', method, params }),
    });
    if (!response.ok) throw new Error('Nodo regtest non disponibile.');
    const data = JSON.parse(await response.text(), (key, value, context) => key === 'value' && typeof value === 'number' ? context.source : value);
    if (data.error) throw new Error(`RPC regtest rifiutata (${data.error.code}).`);
    return data.result;
  };
}

export async function assertIsolated(rpc) {
  const chain = await rpc('getblockchaininfo');
  const net = await rpc('getnetworkinfo');
  if (chain.chain !== 'regtest' || chain.pruned || net.networkactive !== false || net.connections !== 0
    || await rpc('getblockhash', [0]) !== GENESIS) throw new Error('Serve BLOZ regtest non potato e isolato dalla rete.');
  return chain;
}
