import { bech32 } from '@scure/base';
export function addressScript(address, network = 'bloz-regtest') {
  const hrp = network === 'bloz-regtest' ? 'bzrt' : network === 'bloz-mainnet' ? 'bz' : null;
  if (!hrp || typeof address !== 'string' || address.length !== hrp.length + 40 || address !== address.toLowerCase()) throw new Error('Indirizzo SegWit BLOZ non valido per questa rete.');
  const decoded = bech32.decode(address);
  const bytes = bech32.fromWords(decoded.words.slice(1));
  if (decoded.prefix !== hrp || decoded.words[0] !== 0 || bytes.length !== 20) throw new Error('Solo P2WPKH BLOZ della rete selezionata.');
  return '0014' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
