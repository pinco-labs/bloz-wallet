import { summarize } from './src/balance-summary.js';
export { summarize } from './src/balance-summary.js';
import { addressScript } from './src/address.js';
import { assertIsolated } from './regtest-rpc.js';
import { toRex } from './src/money.js';

export const MAX_HEIGHT = 500;
const outpoint = (txid, n) => `${txid}:${n}`;

// Full, bounded scan is intentional in this private regtest lab. No wallet imports.
export async function scanSnapshot(rpc) {
  const start = await assertIsolated(rpc);
  if (!Number.isInteger(start.blocks) || start.blocks < 0 || start.blocks > MAX_HEIGHT) throw new Error('Limite laboratorio: 500 blocchi.');
  const outputs = new Map(); let previous = await rpc('getblockhash', [0]), outputCount = 0;
  for (let height = 1; height <= start.blocks; height++) {
    const hash = await rpc('getblockhash', [height]);
    const block = await rpc('getblock', [hash, 2]);
    if (block.hash !== hash || block.height !== height || block.previousblockhash !== previous || !Array.isArray(block.tx)) throw new Error('Catena cambiata durante la lettura.');
    for (const tx of block.tx) {
      for (const input of tx.vin) if (input.txid) outputs.delete(outpoint(input.txid, input.vout));
      const coinbase = tx.vin.some((input) => typeof input.coinbase === 'string');
      for (const output of tx.vout) {
        if (++outputCount > 50_000) throw new Error('Troppi output per il laboratorio locale.');
        outputs.set(outpoint(tx.txid, output.n), { txid: tx.txid, n: output.n,
          script: output.scriptPubKey.hex, rex: toRex(output.value), height, coinbase });
      }
    }
    previous = hash;
  }
  if (previous !== start.bestblockhash) throw new Error('Catena cambiata durante la lettura.');
  const poolIds = await rpc('getrawmempool');
  if (!Array.isArray(poolIds) || poolIds.length > 1000 || new Set(poolIds).size !== poolIds.length) throw new Error('Mempool non supportata dal laboratorio.');
  const spent = new Set(), pending = new Map();
  for (const id of poolIds) {
    const tx = await rpc('getrawtransaction', [id, true]);
    if (tx.txid !== id) throw new Error('Risposta mempool non coerente.');
    for (const input of tx.vin) if (input.txid) spent.add(outpoint(input.txid, input.vout));
    for (const output of tx.vout) {
      if (++outputCount > 50_000) throw new Error('Troppi output per il laboratorio locale.');
      pending.set(outpoint(id, output.n), { txid: id, n: output.n, script: output.scriptPubKey.hex,
        rex: toRex(output.value), height: null, coinbase: false });
    }
  }
  // Order-independent: a mempool child may have been read before its parent.
  for (const key of spent) pending.delete(key);
  const finalPool = await rpc('getrawmempool');
  const end = await assertIsolated(rpc);
  if (end.bestblockhash !== start.bestblockhash || end.blocks !== start.blocks
    || [...poolIds].sort().join() !== [...finalPool].sort().join()) throw new Error('Stato cambiato: aggiornare nuovamente.');
  return { height: end.blocks, hash: end.bestblockhash, outputs, pending, spent, checkedAt: new Date().toISOString() };
}


export function createBalanceReader(rpc) {
  let reading;
  return async (address) => {
    addressScript(address);
    if (!reading) reading = scanSnapshot(rpc).finally(() => { reading = null; });
    return summarize(await reading, address);
  };
}
