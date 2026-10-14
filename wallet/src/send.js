import { Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { createKeyCodec } from './keys.js';
import { addressScript } from './address.js';

const MAX = 21_000_000n * 100_000_000n;
export function parseAmount(text) {
  if (typeof text !== 'string' || !/^(0|[1-9][0-9]{0,7})(\.[0-9]{1,8})?$/.test(text)) throw new Error('Importo non valido: usa il punto e massimo 8 decimali.');
  const [whole, fraction = ''] = text.split('.');
  const value = BigInt(whole) * 100_000_000n + BigInt(fraction.padEnd(8, '0'));
  if (value <= 0n || value > MAX) throw new Error('Importo fuori limite.');
  return value;
}

// Only a single confirmed native SegWit input; all outputs are built here, never by the server.
export function prepareSend({ from, to, amount, fee, coins, network = 'bloz-regtest' }, now = Date.now()) {
  const script = addressScript(from, network), destination = addressScript(to, network);
  if (from === to) throw new Error('Scegli un altro indirizzo di test.');
  const value = parseAmount(amount), cost = parseAmount(fee);
  if (value < 1000n || cost < 200n || cost > 100_000n) throw new Error('Minimo invio: 0.00001000 BLOZ. Commissione: da 0.00000200 a 0.00100000 BLOZ.');
  if (!Array.isArray(coins) || coins.length > 500) throw new Error('Elenco accrediti non valido.');
  for (const coin of coins) {
    if (!/^[0-9a-f]{64}$/.test(coin.txid) || !Number.isInteger(coin.vout) || coin.vout < 0
        || typeof coin.raw !== 'string' || coin.raw.length > 200_000 || !/^(?:[0-9a-f]{2})+$/.test(coin.raw)
        || !Number.isInteger(coin.confirmations) || coin.confirmations < (coin.coinbase ? 100 : 1)) throw new Error('Accredito non valido o immaturo.');
    const previous = Transaction.fromRaw(hex.decode(coin.raw), { allowUnknownOutputs: true });
    if (previous.id !== coin.txid || coin.vout >= previous.outputsLength) throw new Error('Transazione precedente non corrispondente.');
    const output = previous.getOutput(coin.vout);
    if (hex.encode(output.script) !== script) throw new Error('Accredito non appartenente al wallet.');
    const change = output.amount - value - cost;
    if (change < 0n || (change > 0n && change < 1000n)) continue;
    return Object.freeze({ network, from, to, script, destination, value, cost, change, inputAmount: output.amount,
      txid: coin.txid, vout: coin.vout, raw: coin.raw, expires: now + 60_000 });
  }
  throw new Error('Serve un singolo accredito confermato sufficiente; il resto deve essere zero o almeno 0.00001000 BLOZ.');
}

export function signSend(plan, key, now = Date.now()) {
  if (now >= plan.expires || createKeyCodec(plan.network).identity(key).address !== plan.from) throw new Error('Riepilogo scaduto o wallet diverso. Prepara nuovamente.');
  const tx = new Transaction({ version: 2, lockTime: 0, strictPrevoutValidation: true });
  tx.addInput({ txid: plan.txid, index: plan.vout, sequence: 0xffffffff, sighashType: 1,
    nonWitnessUtxo: plan.raw, witnessUtxo: { script: hex.decode(plan.script), amount: plan.inputAmount } });
  tx.addOutput({ script: hex.decode(plan.destination), amount: plan.value });
  if (plan.change) tx.addOutput({ script: hex.decode(plan.script), amount: plan.change });
  if (tx.fee !== plan.cost) throw new Error('Commissione incoerente.');
  tx.sign(key); tx.finalize();
  return Object.freeze({ raw: tx.hex, txid: tx.id, vsize: tx.vsize });
}

export async function fetchCoins(address, signal, network = 'bloz-regtest') {
  addressScript(address, network);
  const response = await fetch(`/api/${network === 'bloz-mainnet' ? 'mainnet' : 'regtest'}/coins/${address}`, { signal, cache: 'no-store', credentials: 'omit', redirect: 'error' });
  if (!response.ok) throw new Error('Accrediti non disponibili. Controlla il nodo locale e riprova.');
  const data = await response.json();
  if (data.address !== address || data.network !== network) throw new Error('Rete o indirizzo incoerenti.');
  return data.coins;
}

export async function broadcast(signed, signal, network = 'bloz-regtest') {
  const scope = network === 'bloz-mainnet' ? 'mainnet' : 'regtest';
  const response = await fetch(`/api/${scope}/broadcast`, { method: 'POST', signal, cache: 'no-store', credentials: 'omit', redirect: 'error',
    headers: { 'Content-Type': 'application/json', [`X-BLOZ-${scope}`]: 'signed-only' }, body: JSON.stringify({ raw: signed.raw }) });
  const data = await response.json();
  if (!response.ok || data.txid !== signed.txid) throw new Error(data.error || 'Esito incerto: conserva l’ID e aggiorna il saldo prima di un nuovo invio.');
  return data.txid;
}
