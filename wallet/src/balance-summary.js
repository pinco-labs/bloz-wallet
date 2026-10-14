import { addressScript } from './address.js';

export function summarize(snapshot, address, network = 'bloz-regtest') {
  const script = addressScript(address, network);
  let confirmed = 0n, immature = 0n, pendingIncoming = 0n, pendingSpent = 0n;
  const utxos = [];
  for (const [key, output] of snapshot.outputs) {
    if (output.script !== script) continue;
    const confirmations = snapshot.height - output.height + 1;
    // A coinbase at H can be spent in a candidate block H+100 (100 confirmations at current tip).
    const isImmature = output.coinbase && confirmations < 100;
    const reserved = snapshot.spent.has(key);
    if (isImmature) immature += output.rex;
    else { confirmed += output.rex; if (reserved) pendingSpent += output.rex; }
    utxos.push({ txid: output.txid, vout: output.n, amountRex: output.rex.toString(), confirmations,
      status: isImmature ? 'immature' : reserved ? 'reserved' : 'confirmed', blocksToMaturity: isImmature ? 100 - confirmations : 0 });
  }
  for (const output of snapshot.pending.values()) {
    if (output.script !== script) continue;
    pendingIncoming += output.rex;
    utxos.push({ txid: output.txid, vout: output.n, amountRex: output.rex.toString(), confirmations: 0, status: 'pending', blocksToMaturity: 0 });
  }
  utxos.sort((a, b) => a.confirmations - b.confirmations || a.txid.localeCompare(b.txid) || a.vout - b.vout);
  return { network, address, height: snapshot.height, blockHash: snapshot.hash, checkedAt: snapshot.checkedAt,
    confirmedRex: confirmed.toString(), immatureRex: immature.toString(), pendingIncomingRex: pendingIncoming.toString(),
    pendingSpentRex: pendingSpent.toString(), availableRex: (confirmed - pendingSpent).toString(),
    utxoCount: utxos.length, utxos: utxos.slice(0, 25), truncated: utxos.length > 25 };
}

