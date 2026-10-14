// Opt-in Windows -> WSL check. Disposable keys only, transferred via stdin to local Core.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createKeyCodec, generateKey, identity, descriptor } from '../src/keys.js';
import { createBackupCodec } from '../src/backup.js';

const lock = JSON.parse(await readFile(new URL('../source-lock.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../../work/wallet-source/src_kernel_chainparams.cpp', import.meta.url));
assert.equal(createHash('sha256').update(source).digest('hex'), lock.files.find((f) => f.path === 'src/kernel/chainparams.cpp').sha256);
const codec = createBackupCodec('bloz-mainnet-offline-wallet');
const main = createKeyCodec('bloz-mainnet');
const password = 'Disposable offline compatibility test 2026!';
const fixtures = [];
for (let i = 0; i < 3; i++) {
  const key = generateKey();
  let restored;
  try {
    const before = main.identity(key);
    const backup = await codec.encryptBackup(key, password);
    await assert.rejects(codec.decryptBackup(backup, password + 'wrong'));
    restored = await codec.decryptBackup(backup, password);
    assert.deepEqual(main.identity(restored), before);
    fixtures.push({ ...before, privateDescriptor: main.recoveryDescriptor(restored),
      publicDescriptor: descriptor(`wpkh(${before.publicKey})`), regtestAddress: identity(restored).address });
  } finally { key.fill(0); restored?.fill(0); }
}
const localScript = fileURLToPath(new URL('./mainnet-core-offline.py', import.meta.url));
assert.match(localScript, /^[A-Za-z]:\\/);
const wslScript = '/mnt/' + localScript[0].toLowerCase() + localScript.slice(2).replaceAll('\\', '/');
const child = spawn('wsl.exe', ['-d', 'Ubuntu-24.04', '--', 'python3', wslScript], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
let output = '', errors = '';
child.stdout.setEncoding('utf8'); child.stdout.on('data', (data) => { output += data; });
child.stderr.setEncoding('utf8'); child.stderr.on('data', (data) => { errors += data; });
const result = new Promise((resolve, reject) => {
  child.on('error', reject);
  child.on('close', (code) => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(`Offline Core check failed (${code}); ${errors}`)));
});
child.stdin.on('error', () => {});
child.stdin.end(JSON.stringify(fixtures));
fixtures.length = 0;
const report = { checkedAt: new Date().toISOString(), sourceCommit: lock.commit, release: lock.release,
  encryptedBackupRoundTrip: true, wrongPasswordRejected: true, ...await result,
  realFundsUsed: false, transactionsTested: false, browserMainnetTested: false,
  readyForRealFunds: false };
await writeFile(new URL('../evidence/mainnet-offline-compatibility.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
