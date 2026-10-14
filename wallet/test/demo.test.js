import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WalletSession, STORAGE_KEY, DEMO_STORAGE_KEY } from '../src/session.js';
import { createBackupCodec, decryptBackup, encryptBackup } from '../src/backup.js';
import { identity } from '../src/keys.js';
import { createDemoServer } from '../demo-server.js';

const password = 'Disposable demo test 2026!';
function storage() { const data = new Map(); return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) }; }

test('demo backup domain is authenticated: lab imports and relabeling both fail', async () => {
  const key = new Uint8Array(32); key[31] = 23;
  const demo = createBackupCodec('bloz-demo-wallet');
  const encoded = await demo.encryptBackup(key, password);
  assert.deepEqual(await demo.decryptBackup(encoded, password), key);
  await assert.rejects(decryptBackup(encoded, password));
  const lab = await encryptBackup(key, password);
  await assert.rejects(demo.decryptBackup(lab, password));
  await assert.rejects(demo.decryptBackup(lab.replace('bloz-local-wallet', 'bloz-demo-wallet'), password));
  await assert.rejects(decryptBackup(encoded.replace('bloz-demo-wallet', 'bloz-local-wallet'), password));
});

test('demo refuses external WIF and signing; backup gate and storage stay separate from lab', async () => {
  const saved = storage(); saved.setItem(STORAGE_KEY, 'untouched lab fixture');
  const wallet = new WalletSession(saved, { demo: true });
  assert.throws(() => wallet.create('external-key'));
  const first = wallet.create();
  assert.throws(() => wallet.activate());
  const backup = await wallet.prepareBackup(password, password);
  await wallet.verifyBackup(backup, password); wallet.activate();
  assert.equal(saved.getItem(STORAGE_KEY), 'untouched lab fixture');
  assert.equal(JSON.parse(saved.getItem(DEMO_STORAGE_KEY)).format, 'bloz-demo-wallet');
  assert.throws(() => wallet.withKey(identity));
  wallet.lock(); await wallet.unlock(password); assert.equal(wallet.info.address, first.address);
  wallet.forget(); assert.equal(saved.getItem(DEMO_STORAGE_KEY), null); assert.equal(saved.getItem(STORAGE_KEY), 'untouched lab fixture');
  const restored = new WalletSession(storage(), { demo: true });
  await restored.restore(backup, password); assert.equal(restored.info.address, first.address);
  assert.equal(restored.canActivate, true); restored.activate();
});

test('demo artifact has no transaction/network modules or secret import controls; HTTP denies APIs and POST', async (t) => {
  const app = await readFile(new URL('../dist-demo/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /fetch\(|XMLHttpRequest|WebSocket|\/api\/regtest|sendrawtransaction|btc-signer/);
  const html = await readFile(new URL('../dist-demo/index.html', import.meta.url), 'utf8');
  assert.match(html, /non usare fondi reali/); assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /id="(send-form|wif-form|recovery|refresh-balance)"/);
  const server = createDemoServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise((r) => server.close(r)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(url); assert.equal(page.status, 200); assert.match(page.headers.get('content-security-policy'), /connect-src 'none'/);
  for (const path of ['/api/regtest/broadcast', '/api/regtest/balance/test', '/.env', '/src/session.js', '/?password=test']) assert.equal((await fetch(url + path)).status, 404);
  assert.equal((await fetch(url, { method: 'POST', body: 'test' })).status, 405);
  assert.equal((await fetch(url, { headers: { Origin: 'https://external.example' } })).status, 403);
});
