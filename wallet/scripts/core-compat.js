// Opt-in integration test. No mining, no real funds, no P2P connections.
// Usage: node wallet/scripts/core-compat.js <absolute-path-to-official-bitcoind>
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateKey, identity, recoveryDescriptor, descriptor } from '../src/keys.js';
import { encryptBackup, decryptBackup } from '../src/backup.js';

if (!process.argv[2]) throw new Error('Specify the verified official BLOZ bitcoind executable.');
const sourceLock = JSON.parse(await readFile(new URL('../source-lock.json', import.meta.url), 'utf8'));
const executableHash = createHash('sha256').update(await readFile(resolve(process.argv[2]))).digest('hex');
if (executableHash !== sourceLock.testBinary.executableSha256) throw new Error('Executable differs from the pinned Windows CLI release.');
const parent = resolve('work/wallet-core-tests'); await mkdir(parent, { recursive: true });
const dir = await mkdtemp(resolve(parent, 'regtest-'));
const port = 18453;
const child = spawn(resolve(process.argv[2]), ['-regtest', `-datadir=${dir}`, '-nosettings', '-server=1',
  '-listen=0', '-connect=0', '-dnsseed=0', '-discover=0', '-networkactive=0', '-rpcbind=127.0.0.1',
  `-rpcport=${port}`, '-printtoconsole=0'], { windowsHide: true, stdio: 'ignore' });
let spawnError; child.on('error', (error) => { spawnError = error; });
let auth;
const rpc = async (method, params = [], wallet = '') => {
  const response = await fetch(`http://127.0.0.1:${port}/${wallet ? `wallet/${wallet}` : ''}`, { method: 'POST',
    signal: AbortSignal.timeout(15000), headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const result = await response.json(); if (result.error) throw new Error(`${method}: ${result.error.message}`); return result.result;
};
let connected = false;
try {
  for (let i = 0; i < 100; i++) {
    if (spawnError) throw spawnError;
    if (child.exitCode !== null) throw new Error(`Core exited (${child.exitCode}); inspect ${dir}/regtest/debug.log`);
    try {
      auth = Buffer.from((await readFile(resolve(dir, 'regtest/.cookie'), 'utf8')).trim()).toString('base64');
      await rpc('getblockchaininfo'); connected = true; break;
    } catch { await delay(200); }
  }
  if (!connected) throw new Error('Core regtest startup timeout.');
  assert.equal((await rpc('getblockchaininfo')).chain, 'regtest');
  const network = await rpc('getnetworkinfo'); assert.equal(network.networkactive, false); assert.equal(network.connections, 0);
  await rpc('createwallet', ['webwallet-test', false, true]);
  let backup;
  const password = process.argv[3] ? process.env.BLOZ_TEST_BACKUP_PASSWORD : 'Only test compatibility password 2026!';
  if (process.argv[3]) {
    if (!password) throw new Error('Set BLOZ_TEST_BACKUP_PASSWORD only for a disposable test backup.');
    backup = await readFile(resolve(process.argv[3]), 'utf8');
  } else {
    const key = generateKey();
    backup = await encryptBackup(key, password); key.fill(0);
  }
  const restored = await decryptBackup(backup, password);
  const info = identity(restored);
  const privateDescriptor = recoveryDescriptor(restored); restored.fill(0);
  const canonical = await rpc('getdescriptorinfo', [privateDescriptor]);
  assert.equal(canonical.hasprivatekeys, true); assert.equal(canonical.isrange, false);
  assert.equal(canonical.descriptor, descriptor(`wpkh(${info.publicKey})`));
  const addresses = await rpc('deriveaddresses', [canonical.descriptor]); assert.deepEqual(addresses, [info.address]);
  const imported = await rpc('importdescriptors', [[{ desc: privateDescriptor, timestamp: 0, active: false, label: 'Local SegWit compatibility test' }]], 'webwallet-test');
  assert.equal(imported[0].success, true);
  const addressInfo = await rpc('getaddressinfo', [info.address], 'webwallet-test');
  assert.equal(addressInfo.ismine, true); assert.equal(addressInfo.iswitness, true);
  assert.equal(addressInfo.witness_version, 0); assert.equal(addressInfo.pubkey, info.publicKey); assert.equal(addressInfo.scriptPubKey, info.scriptPubKey);
  const exported = await rpc('listdescriptors', [true], 'webwallet-test');
  assert.ok(exported.descriptors.some((item) => item.desc === privateDescriptor));
  const report = { coreRelease: sourceLock.release, sourceCommit: sourceLock.commit, executableSha256: executableHash,
    chain: 'regtest', p2p: false, blocks: (await rpc('getblockchaininfo')).blocks,
    ...info, descriptor: canonical.descriptor, encryptedRoundTrip: true, derivedAddressMatches: true,
    privateDescriptorImported: true, ismine: addressInfo.ismine, privateDescriptorRoundTrip: true,
    browserBackupSupplied: !!process.argv[3], transactionFundingOrSpendingTested: false };
  await writeFile(resolve(parent, 'compatibility-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (connected) { try { await rpc('stop'); } catch {} }
  for (let i = 0; i < 50 && child.exitCode === null; i++) await delay(100);
  if (child.exitCode === null) child.kill();
}
