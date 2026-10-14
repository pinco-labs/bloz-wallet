import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { base58check, bech32 } from '@scure/base';
import { bytesToHex } from '@noble/hashes/utils.js';

// Existing UI callers remain pinned to regtest; mainnet is opt-in for offline checks.
export const NETWORK = 'bloz-regtest';
const base58 = base58check(sha256);
export const toHex = bytesToHex;

export function generateKey() {
  return secp256k1.utils.randomSecretKey();
}

export function createKeyCodec(network = NETWORK) {
  const parameters = network === 'bloz-regtest' ? { wif: 239, hrp: 'bzrt' }
    : network === 'bloz-mainnet' ? { wif: 153, hrp: 'bz' } : null;
  if (!parameters) throw new Error('Rete non supportata.');
function importWif(wif) {
  if (typeof wif !== 'string' || wif.length !== 52) throw new Error('WIF di test compresso non valido.');
  const bytes = base58.decode(wif);
  try {
    if (bytes.length !== 34 || bytes[0] !== parameters.wif || bytes[33] !== 1) throw new Error('WIF compresso di una rete diversa o non valido.');
    const key = bytes.slice(1, 33);
    if (!secp256k1.utils.isValidSecretKey(key)) { key.fill(0); throw new Error('Chiave non valida.'); }
    return key;
  } finally { bytes.fill(0); }
}

function exportWif(key) {
  if (!secp256k1.utils.isValidSecretKey(key)) throw new Error('Chiave non valida.');
  const bytes = new Uint8Array(34);
  bytes[0] = parameters.wif; bytes.set(key, 1); bytes[33] = 1;
  try { return base58.encode(bytes); } finally { bytes.fill(0); }
}

function identity(key) {
  const publicKey = secp256k1.getPublicKey(key, true);
  const hash = ripemd160(sha256(publicKey));
  return {
    network,
    address: bech32.encode(parameters.hrp, [0, ...bech32.toWords(hash)]),
    publicKey: toHex(publicKey),
    scriptPubKey: '0014' + toHex(hash),
  };
}
return Object.freeze({ network, importWif, exportWif, identity,
  recoveryDescriptor: (key) => descriptor(`wpkh(${exportWif(key)})`) });
}

export const { importWif, exportWif, identity, recoveryDescriptor } = createKeyCodec();

// Descriptor checksum, adapted from Bitcoin Core / BLOZ Core descriptor.cpp (MIT).
// See THIRD-PARTY.md. BigInt keeps the full 40-bit checksum state.
export function descriptor(body) {
  const input = "0123456789()[],'/*abcdefgh@:$%{}IJKLMNOPQRSTUVWXYZ&+-.;<=>?!^_|~ijklmnopqrstuvwxyzABCDEFGH`#\"\\ ";
  const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const generators = [0xf5dee51989n, 0xa9fdca3312n, 0x1bab10e32dn, 0x3706b1677an, 0x644d626ffdn];
  let c = 1n, cls = 0, count = 0;
  const step = (v) => {
    const top = c >> 35n;
    c = ((c & 0x7ffffffffn) << 5n) ^ BigInt(v);
    generators.forEach((g, i) => { if ((top >> BigInt(i)) & 1n) c ^= g; });
  };
  for (const char of body) {
    const p = input.indexOf(char);
    if (p < 0) throw new Error('Descrittore non valido.');
    step(p & 31); cls = cls * 3 + (p >> 5);
    if (++count === 3) { step(cls); cls = 0; count = 0; }
  }
  if (count) step(cls);
  for (let i = 0; i < 8; i++) step(0);
  c ^= 1n;
  let sum = '';
  for (let i = 0; i < 8; i++) sum += charset[Number((c >> BigInt(5 * (7 - i))) & 31n)];
  return body + '#' + sum;
}

