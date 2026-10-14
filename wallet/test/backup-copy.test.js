import test from 'node:test';
import assert from 'node:assert/strict';
import { WalletSession } from '../src/session.js';
import { encryptBackup } from '../src/backup.js';
import { generateKey } from '../src/keys.js';
const password = 'Disposable test password only';
async function fixture() {
  const data = new Map();
  const storage = { getItem:k=>data.get(k)??null, setItem:(k,v)=>data.set(k,v), removeItem:k=>data.delete(k) };
  const wallet = new WalletSession(storage);
  wallet.create();
  const backup = await wallet.prepareBackup(password,password);
  await wallet.verifyBackup(backup,password); wallet.activate();
  return {wallet,storage,backup};
}
test('standalone verification accepts old-password copy after rotation without changing current wallet', async () => {
  const {wallet,storage,backup}=await fixture();
  const nextPassword='Another disposable test password';
  const next=await wallet.prepareReplacement(password,nextPassword,nextPassword);
  await wallet.verifyReplacement(next,nextPassword); wallet.commitReplacement();
  const address=wallet.info.address;
  assert.deepEqual(await wallet.checkBackupCopy(backup,password),{matches:true});
  assert.equal(wallet.info.address,address); assert.equal(wallet.active,true);
  assert.equal(storage.getItem(wallet.storageKey),next);
  assert.equal(wallet.replacementPending,false);
});
test('standalone verification distinguishes another wallet and rejects bad password, corrupt file and wrong format', async () => {
  const {wallet,storage,backup}=await fixture();
  const other=await encryptBackup(generateKey(),password);
  assert.deepEqual(await wallet.checkBackupCopy(other,password),{matches:false});
  await assert.rejects(wallet.checkBackupCopy(backup,'Incorrect password for testing'));
  const corrupt=JSON.parse(backup); corrupt.ciphertext=(corrupt.ciphertext[0]==='A'?'B':'A')+corrupt.ciphertext.slice(1);
  await assert.rejects(wallet.checkBackupCopy(JSON.stringify(corrupt),password));
  await assert.rejects(wallet.checkBackupCopy('{}',password));
  assert.equal(storage.getItem(wallet.storageKey),backup); assert.equal(wallet.active,true);
});
test('standalone verification discards results when locked or stored wallet changes during decryption', async () => {
  const {wallet,storage,backup}=await fixture();
  const pending=wallet.checkBackupCopy(backup,password); wallet.lock();
  await assert.rejects(pending,/bloccato/);
  await wallet.unlock(password);
  const changed=wallet.checkBackupCopy(backup,password); storage.setItem(wallet.storageKey,backup+' ');
  await assert.rejects(changed,/modificato/);
  wallet.lock(); await assert.rejects(wallet.checkBackupCopy(backup,password),/Sbloccare/);
});
