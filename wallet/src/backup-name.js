import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
export function backupFilename(text, mode, now = new Date()) {
  const id = bytesToHex(sha256(new TextEncoder().encode(text))).slice(0, 12);
  return `bloz-${mode}-${now.toISOString().slice(0, 10)}-${id}.json`;
}
