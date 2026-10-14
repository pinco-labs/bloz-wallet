import test from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, createHash } from 'node:crypto';
import { base58check, bech32 } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';
import { generateKey, exportWif, importWif, identity, recoveryDescriptor } from '../src/keys.js';
import { encryptBackup, decryptBackup, parseBackup } from '../src/backup.js';
import { WalletSession, STORAGE_KEY } from '../src/session.js';

// Public, deliberately insecure test vector. NEVER fund this key on any real chain.
const one = new Uint8Array(32); one[31] = 1;
const password = 'BLOZ test password 2026!';
const storage = () => { const values = new Map(); return { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) }; };

test('native SegWit uses compressed secp256k1 + HASH160, independently checked with OpenSSL', () => {
  for (const key of [one, generateKey(), generateKey()]) {
    const ec = createECDH('secp256k1'); ec.setPrivateKey(key);
    const pub = ec.getPublicKey(null, 'compressed');
    const hash = createHash('ripemd160').update(createHash('sha256').update(pub).digest()).digest('hex');
    const actual = identity(key);
    assert.equal(actual.publicKey, pub.toString('hex'));
    assert.equal(actual.scriptPubKey, '0014' + hash);
    const decoded = bech32.decode(actual.address);
    assert.equal(decoded.prefix, 'bzrt'); assert.equal(decoded.words[0], 0);
    assert.equal(Buffer.from(bech32.fromWords(decoded.words.slice(1))).toString('hex'), hash);
    assert.deepEqual(importWif(exportWif(key)), key);
  }
  assert.equal(identity(one).publicKey, '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
  assert.equal(identity(one).scriptPubKey, '0014751e76e8199196d454941c45d1b3a323f1433bd6');
  assert.equal(exportWif(one), 'cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN87JcbXMTcA');
});

test('WIF rejects mainnet, uncompressed, zero, out-of-range, bad checksum and oversize', () => {
  const base = base58check(sha256);
  for (const value of [base.encode(Uint8Array.from([153, ...one, 1])), base.encode(Uint8Array.from([239, ...one])),
    base.encode(Uint8Array.from([239, ...new Uint8Array(32), 1])), base.encode(Uint8Array.from([239, ...new Uint8Array(32).fill(255), 1])),
    exportWif(one).slice(0, -1) + 'B', 'x'.repeat(10000), 'abandon '.repeat(12)]) assert.throws(() => importWif(value));
});

test('encrypted backup recovers exact key; unique salt/IV and no plaintext secrets', async () => {
  const first = await encryptBackup(one, password), second = await encryptBackup(one, password);
  assert.notEqual(first, second);
  assert.notEqual(JSON.parse(first).salt, JSON.parse(second).salt);
  assert.notEqual(JSON.parse(first).iv, JSON.parse(second).iv);
  assert.ok(!first.includes(exportWif(one))); assert.ok(!first.includes(identity(one).address));
  assert.deepEqual(await decryptBackup(first, password), one);
  await assert.rejects(decryptBackup(first, password + 'wrong'));
  for (const field of ['salt', 'iv', 'ciphertext']) {
    const data = JSON.parse(first); const bytes = Buffer.from(data[field], 'base64'); bytes[0] ^= 1; data[field] = bytes.toString('base64');
    await assert.rejects(decryptBackup(JSON.stringify(data), password));
  }
});

test('strict format rejects unsupported network, versions, hostile KDF and excessive size', async () => {
  const good = JSON.parse(await encryptBackup(one, password));
  for (const patch of [{ network: 'bloz-mainnet' }, { version: 2 }, { iterations: 1 }, { iterations: 1e12 },
    { cipher: 'AES-CBC' }, { salt: '' }, { iv: null }, { ciphertext: 'a'.repeat(10000) }, { extra: true }]) {
    assert.throws(() => parseBackup(JSON.stringify({ ...good, ...patch })));
  }
  for (const text of ['null', '[]', '{}', '{', ' '.repeat(9000)]) assert.throws(() => parseBackup(text));
  await assert.rejects(encryptBackup(one, 'short'));
  const unicode = ' Pàssword di test 🔐 ';
  assert.deepEqual(await decryptBackup(await encryptBackup(one, unicode), unicode), one);
});

test('activation needs downloaded container reloaded with correct password; persistence is encrypted', async () => {
  const store = storage(), session = new WalletSession(store);
  session.create(exportWif(one)); assert.throws(() => session.activate()); assert.equal(session.hasSaved, false);
  await assert.rejects(session.prepareBackup(password, 'different'));
  const backup = await session.prepareBackup(password, password);
  assert.throws(() => session.activate());
  const other = await encryptBackup(generateKey(), password);
  await assert.rejects(session.verifyBackup(other, password)); assert.throws(() => session.activate());
  await assert.rejects(session.verifyBackup(backup, password + 'wrong')); assert.throws(() => session.activate());
  await session.verifyBackup(backup, password); assert.equal(session.canActivate, true);
  session.activate(); assert.equal(store.getItem(STORAGE_KEY), backup);
  assert.throws(() => session.create());
  session.lock(); assert.equal(session.info, null); assert.throws(() => session.withKey(recoveryDescriptor));
  await assert.rejects(session.unlock(password + 'wrong')); assert.equal(session.unlocked, false);
  await session.unlock(password); assert.equal(session.info.address, identity(one).address); assert.equal(session.active, true);
  session.forget(); assert.equal(session.hasSaved, false);
  await session.restore(backup, password); assert.equal(session.canActivate, true);
  session.activate(); assert.equal(store.getItem(STORAGE_KEY), backup);
  session.lock(); await session.unlock(password); assert.equal(session.info.address, identity(one).address);
});

test('failed restore cannot activate; restored backups preserve storage guards and password', async () => {
  const store = storage(), session = new WalletSession(store, { mainnet: true });
  const original = session.create().address;
  const backup = await session.prepareBackup(password, password);
  session.lock();
  await assert.rejects(session.restore(backup, password + 'wrong'));
  assert.equal(session.canActivate, false); assert.throws(() => session.activate());
  await session.restore(backup, password);
  assert.equal(session.canActivate, true); assert.equal(session.hasSaved, false);
  const second = new WalletSession(store, { mainnet: true });
  await second.restore(backup, password);
  session.activate(); assert.throws(() => second.activate(), /altra scheda/);
  assert.equal(store.getItem(session.storageKey), backup);
  session.lock(); await session.unlock(password); assert.equal(session.info.address, original);
});

test('failed re-verification revokes activation; saving failures do not activate', async () => {
  const store = storage(), session = new WalletSession(store); session.create(exportWif(one));
  const backup = await session.prepareBackup(password, password); await session.verifyBackup(backup, password);
  await assert.rejects(session.verifyBackup(backup, password + 'wrong')); assert.equal(session.canActivate, false);
  await session.verifyBackup(backup, password); store.setItem = () => { throw new Error('quota'); };
  assert.throws(() => session.activate(), /quota/); assert.equal(session.active, false);
});

test('lock during expensive crypto prevents late resurrection or activation', async () => {
  const session = new WalletSession(storage()); session.create(exportWif(one));
  const pending = session.prepareBackup(password, password); session.lock(); await assert.rejects(pending, /annullata/);
  const backup = await encryptBackup(one, password);
  const restore = session.restore(backup, password); session.lock(); await assert.rejects(restore, /annullata/); assert.equal(session.info, null);
  session.create(exportWif(one)); const fresh = await session.prepareBackup(password, password);
  const verify = session.verifyBackup(fresh, password); session.lock(); await assert.rejects(verify, /annullata/); assert.equal(session.canActivate, false);
});

test('two tabs cannot overwrite a saved wallet during activation', async () => {
  const store = storage(), first = new WalletSession(store), second = new WalletSession(store);
  first.create(exportWif(one)); second.create();
  for (const session of [first, second]) { const backup = await session.prepareBackup(password, password); await session.verifyBackup(backup, password); }
  first.activate(); const saved = store.getItem(STORAGE_KEY);
  assert.throws(() => second.activate(), /altra scheda/); assert.equal(store.getItem(STORAGE_KEY), saved);
});

test('late backup verification cannot approve a newer, unverified export', async () => {
  const session = new WalletSession(storage()); session.create(exportWif(one));
  const first = await session.prepareBackup(password, password);
  const verification = session.verifyBackup(first, password);
  const rejected = assert.rejects(verification, /annullata/);
  await session.prepareBackup(password + 'new', password + 'new');
  await rejected; assert.equal(session.canActivate, false); assert.throws(() => session.activate());
});
