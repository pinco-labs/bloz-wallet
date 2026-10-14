import { base64 } from '@scure/base';
import { createKeyCodec } from './keys.js';

export const MAX_BACKUP_BYTES = 8192;
const ITERATIONS = 600_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
export function createBackupCodec(format = 'bloz-local-wallet') {
if (!['bloz-local-wallet', 'bloz-demo-wallet', 'bloz-mainnet-offline-wallet', 'bloz-mainnet-wallet'].includes(format)) throw new Error('Formato non consentito.');
const { identity, importWif, exportWif, network: NETWORK } = createKeyCodec(
  ['bloz-mainnet-offline-wallet', 'bloz-mainnet-wallet'].includes(format) ? 'bloz-mainnet' : 'bloz-regtest');
const HEADER = Object.freeze({ format, version: 1, network: NETWORK,
  kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, cipher: 'AES-256-GCM' });
const aad = encoder.encode(JSON.stringify(HEADER));

function parseBackup(text) {
  if (typeof text !== 'string' || encoder.encode(text).length > MAX_BACKUP_BYTES) throw new Error('Backup troppo grande.');
  const data = JSON.parse(text);
  if (!data || Array.isArray(data) || Object.keys(data).sort().join() !== [...Object.keys(HEADER), 'salt', 'iv', 'ciphertext'].sort().join()) throw new Error('Formato backup non supportato.');
  for (const [key, value] of Object.entries(HEADER)) {
    if (data[key] !== value) throw new Error('Versione, rete o cifratura non supportata.');
  }
  const decode = (value, min, max) => {
    if (typeof value !== 'string') throw new Error('Backup non valido.');
    const bytes = base64.decode(value);
    if (bytes.length < min || bytes.length > max || base64.encode(bytes) !== value) throw new Error('Backup non valido.');
    return bytes;
  };
  return { salt: decode(data.salt, 16, 16), iv: decode(data.iv, 12, 12), ciphertext: decode(data.ciphertext, 16, 4096) };
}

async function encryptBackup(key, password) {
  const info = identity(key);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await derive(password, salt, 'encrypt');
  const plain = encoder.encode(JSON.stringify({ network: NETWORK, type: 'single-key-wpkh', wif: exportWif(key), address: info.address }));
  try {
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, aesKey, plain));
    return JSON.stringify({ ...HEADER, salt: base64.encode(salt), iv: base64.encode(iv), ciphertext: base64.encode(ciphertext) }, null, 2);
  } finally { plain.fill(0); }
}

async function decryptBackup(text, password) {
  const { salt, iv, ciphertext } = parseBackup(text);
  const aesKey = await derive(password, salt, 'decrypt');
  let plain, key;
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, aesKey, ciphertext));
    const data = JSON.parse(decoder.decode(plain));
    if (Object.keys(data).sort().join() !== 'address,network,type,wif' || data.network !== NETWORK || data.type !== 'single-key-wpkh') throw new Error();
    key = importWif(data.wif);
    if (identity(key).address !== data.address) throw new Error();
    return key;
  } catch {
    key?.fill(0);
    throw new Error('Password errata o backup danneggiato/non compatibile.');
  } finally { plain?.fill(0); }
}
return Object.freeze({ parseBackup, encryptBackup, decryptBackup });
}

export const { parseBackup, encryptBackup, decryptBackup } = createBackupCodec();

function passwordBytes(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024) {
    throw new Error('La password deve contenere da 12 a 1024 caratteri.');
  }
  // Exact UTF-8: no trimming or Unicode normalization, including on restore.
  return encoder.encode(password);
}

async function derive(password, salt, usage) {
  const bytes = passwordBytes(password);
  try {
    const material = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      material, { name: 'AES-GCM', length: 256 }, false, [usage]);
  } finally { bytes.fill(0); }
}

