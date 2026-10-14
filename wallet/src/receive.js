import { formatBloz } from './money.js';

// Public address only. No key, WIF, descriptor, password or backup crosses this boundary.
export async function fetchBalance(address, signal, network = 'bloz-regtest') {
  const response = await fetch(`/api/${network === 'bloz-mainnet' ? 'mainnet' : 'regtest'}/balance/${encodeURIComponent(address)}`, { signal, cache: 'no-store', credentials: 'omit', redirect: 'error' });
  if (!response.ok) throw new Error(response.status === 429 ? 'Lettura in corso: riprova tra poco.' : 'Saldo non disponibile. Controlla il nodo locale e riprova.');
  const data = await response.json();
  if (data.network !== network || data.address !== address || !Number.isInteger(data.height) || data.height < 0
    || !/^[a-f0-9]{64}$/.test(data.blockHash) || !Number.isFinite(Date.parse(data.checkedAt))) throw new Error('Risposta del nodo non valida.');
  for (const key of ['confirmedRex', 'immatureRex', 'pendingIncomingRex', 'pendingSpentRex', 'availableRex']) {
    if (typeof data[key] !== 'string' || !/^\d{1,20}$/.test(data[key])) throw new Error('Importo non valido.');
  }
  if (BigInt(data.confirmedRex) - BigInt(data.pendingSpentRex) !== BigInt(data.availableRex)
    || !Number.isInteger(data.utxoCount) || data.utxoCount < 0 || typeof data.truncated !== 'boolean'
    || !Array.isArray(data.utxos) || data.utxos.length > 25) throw new Error('Saldo incoerente.');
  for (const row of data.utxos) {
    if (!/^[a-f0-9]{64}$/.test(row.txid) || !/^\d{1,20}$/.test(row.amountRex)
      || !Number.isInteger(row.vout) || row.vout < 0 || !Number.isInteger(row.confirmations) || row.confirmations < 0
      || !['confirmed', 'immature', 'reserved', 'pending'].includes(row.status)
      || !Number.isInteger(row.blocksToMaturity) || row.blocksToMaturity < 0) throw new Error('Accredito non valido.');
  }
  return data;
}
export const amount = (rex) => formatBloz(rex) + ' BLOZ test';
