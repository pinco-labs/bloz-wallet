import test from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, createHash } from 'node:crypto';
import { base58check, bech32 } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';
import { createKeyCodec, generateKey, identity, importWif } from '../src/keys.js';
import { createBackupCodec } from '../src/backup.js';
import { WalletSession, STORAGE_KEY, DEMO_STORAGE_KEY, MAINNET_OFFLINE_STORAGE_KEY } from '../src/session.js';
import { readFile } from 'node:fs/promises';
import { createDemoServer } from '../demo-server.js';

const main = createKeyCodec('bloz-mainnet');
const codecs = ['bloz-local-wallet', 'bloz-demo-wallet', 'bloz-mainnet-offline-wallet', 'bloz-mainnet-wallet'].map(createBackupCodec);
const password = 'Disposable offline check 2026!';

test('mainnet explicit codec uses official bz/153 parameters and independent OpenSSL public key', () => {
  const key = generateKey();
  try {
    const ec = createECDH('secp256k1'); ec.setPrivateKey(key);
    const pub = ec.getPublicKey(null, 'compressed');
    const hash = createHash('ripemd160').update(createHash('sha256').update(pub).digest()).digest('hex');
    const info = main.identity(key), decoded = bech32.decode(info.address);
    assert.equal(decoded.prefix, 'bz'); assert.equal(decoded.words[0], 0);
    assert.equal(Buffer.from(bech32.fromWords(decoded.words.slice(1))).toString('hex'), hash);
    assert.equal(info.publicKey, pub.toString('hex')); assert.equal(info.scriptPubKey, '0014' + hash);
    assert.equal(base58check(sha256).decode(main.exportWif(key))[0], 153);
    assert.deepEqual(main.importWif(main.exportWif(key)), key);
    assert.throws(() => importWif(main.exportWif(key)));
    assert.throws(() => main.importWif(createKeyCodec().exportWif(key)));
    assert.throws(() => createKeyCodec('bitcoin-mainnet'));
    assert.match(identity(key).address, /^bzrt1q/);
  } finally { key.fill(0); }
});

test('all backup domains reject each other and relabeling cannot cross the authenticated boundary', async () => {
  const key = generateKey();
  try {
    const backups = await Promise.all(codecs.map((codec) => codec.encryptBackup(key, password)));
    for (let i = 0; i < codecs.length; i++) {
      const restored = await codecs[i].decryptBackup(backups[i], password);
      assert.deepEqual(restored, key); restored.fill(0);
      for (let j = 0; j < codecs.length; j++) if (i !== j) {
        await assert.rejects(codecs[j].decryptBackup(backups[i], password));
        const source = JSON.parse(backups[i]), target = JSON.parse(backups[j]);
        source.format = target.format; source.network = target.network;
        await assert.rejects(codecs[j].decryptBackup(JSON.stringify(source), password));
      }
    }
    await assert.rejects(codecs[2].decryptBackup(backups[2], password + 'wrong'));
  } finally { key.fill(0); }
});

test('offline mainnet session gates activation, isolates storage, survives restore and refuses signing', async () => {
  const values = new Map([[STORAGE_KEY, 'lab sentinel'], [DEMO_STORAGE_KEY, 'demo sentinel']]);
  const storage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
  assert.throws(() => new WalletSession(storage, { demo: true, mainnetOffline: true }));
  const wallet = new WalletSession(storage, { mainnetOffline: true });
  assert.throws(() => wallet.create('external-key'));
  const info = wallet.create(); assert.match(info.address, /^bz1q/);
  assert.throws(() => wallet.activate());
  const backup = await wallet.prepareBackup(password, password);
  await assert.rejects(wallet.verifyBackup(backup, password + 'wrong'));
  assert.equal(wallet.canActivate, false);
  await wallet.verifyBackup(backup, password); wallet.activate();
  assert.equal(values.get(MAINNET_OFFLINE_STORAGE_KEY), backup);
  assert.throws(() => wallet.withKey(() => {}));
  wallet.lock(); await wallet.unlock(password); assert.deepEqual(wallet.info, info);
  wallet.forget(); assert.equal(values.has(MAINNET_OFFLINE_STORAGE_KEY), false);
  assert.equal(values.get(STORAGE_KEY), 'lab sentinel'); assert.equal(values.get(DEMO_STORAGE_KEY), 'demo sentinel');
  await wallet.restore(backup, password); assert.deepEqual(wallet.info, info);
  assert.equal(wallet.canActivate, true); wallet.activate();
  assert.equal(values.get(MAINNET_OFFLINE_STORAGE_KEY), backup);
  wallet.forget();
  const pending = wallet.restore(backup, password); wallet.lock();
  await assert.rejects(pending); assert.equal(wallet.unlocked, false);
});

test('mainnet offline preview excludes signing, network calls and HTTP APIs', async (t) => {
  const app = await readFile(new URL('../dist-mainnet-offline/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /fetch\(|XMLHttpRequest|WebSocket|\/api\/regtest|sendrawtransaction|btc-signer/);
  const server = createDemoServer({ mainnetOffline: true });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => server.close(r)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(url); assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /connect-src 'none'/);
  const html = await page.text(); assert.match(html, /Mainnet offline/); assert.match(html, /non inviare fondi/);
  assert.doesNotMatch(html, /id="(send-form|wif-form|recovery|refresh-balance)"/);
  assert.equal((await fetch(url, { method: 'POST', body: 'test' })).status, 405);
  assert.equal((await fetch(url + '/api/mainnet/broadcast')).status, 404);
});
