import { addressScript } from './src/address.js';
import { assertMainnetReady } from './mainnet-rpc.js';
import { summarize } from './balance.js';
import { toRex } from './src/money.js';
export async function scanMainnet(rpc, address) {
  const script = addressScript(address, 'bloz-mainnet');
  const start = await assertMainnetReady(rpc);
  const scan = await rpc('scantxoutset', ['start', [`raw(${script})`]]);
  if (!scan.success || scan.bestblock !== start.bestblockhash || scan.height !== start.blocks
      || !Array.isArray(scan.unspents) || scan.unspents.length > 500) throw new Error('Lettura accrediti incompleta o catena cambiata.');
  const outputs = new Map(), spent = new Set(), pending = new Map();
  for (const item of scan.unspents) {
    if (item.scriptPubKey !== script) throw new Error('Accredito incoerente.');
    const prev = await rpc('gettxout', [item.txid, item.vout, false]);
    if (!prev || prev.scriptPubKey.hex !== script || toRex(prev.value) !== toRex(item.amount)) throw new Error('Accredito cambiato.');
    outputs.set(`${item.txid}:${item.vout}`, { txid: item.txid, n: item.vout, script,
      rex: toRex(item.amount), height: item.height, coinbase: prev.coinbase });
  }
  const pool = await rpc('getrawmempool');
  if (!Array.isArray(pool) || pool.length > 1000) throw new Error('Mempool oltre il limite di questa prova.');
  for (const id of pool) {
    const tx = await rpc('getrawtransaction', [id, true]);
    if (tx.txid !== id) throw new Error('Mempool incoerente.');
    for (const input of tx.vin) if (input.txid) spent.add(`${input.txid}:${input.vout}`);
    for (const output of tx.vout) if (output.scriptPubKey.hex === script) {
      pending.set(`${id}:${output.n}`, { txid: id, n: output.n, script, rex: toRex(output.value), height: null, coinbase: false });
    }
  }
  for (const outpoint of spent) pending.delete(outpoint);
  const end = await assertMainnetReady(rpc);
  if (end.bestblockhash !== start.bestblockhash || [...pool].sort().join() !== [...await rpc('getrawmempool')].sort().join()) throw new Error('Stato cambiato: aggiorna di nuovo.');
  return { height: end.blocks, hash: end.bestblockhash, outputs, spent, pending, checkedAt: new Date().toISOString() };
}
export const readMainnetBalance = (rpc) => async (address) => summarize(await scanMainnet(rpc, address), address, 'bloz-mainnet');
export async function mainnetFees(rpc) {
  await assertMainnetReady(rpc);
  const [estimate, pool, net] = await Promise.all([rpc('estimatesmartfee', [6]), rpc('getmempoolinfo'), rpc('getnetworkinfo')]);
  const rates = [toRex(pool.mempoolminfee), toRex(net.relayfee), 1000n];
  if (estimate.feerate !== undefined) rates.push(toRex(estimate.feerate));
  const rate = rates.reduce((a, b) => a > b ? a : b);
  const calculated = (rate * 141n + 999n) / 1000n;
  const fee = calculated < 200n ? 200n : calculated;
  if (fee > 100_000n) throw new Error('Commissione oltre il limite della prova.');
  return { network: 'bloz-mainnet', feeRex: fee.toString(), rateRexPerKvB: rate.toString(),
    source: estimate.feerate === undefined ? 'minimum-policy-fallback' : 'node-estimate',
    maxVsize: 141, checkedAt: new Date().toISOString() };
}
