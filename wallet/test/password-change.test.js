import test from 'node:test';
import assert from 'node:assert/strict';
import { WalletSession } from '../src/session.js';
import { createBackupCodec } from '../src/backup.js';
import { backupFilename } from '../src/backup-name.js';
import { installPasswordChange, renderPasswordChange } from '../src/password-change.js';
const oldPassword = 'Disposable old password 2026!';
const newPassword = 'Disposable new password 2026!';
test('download names identify encrypted versions without passwords', () => {
  const date = new Date('2026-10-14T10:00:00Z');
  assert.equal(backupFilename('ciphertext','DEMO',date), backupFilename('ciphertext','DEMO',date));
  assert.notEqual(backupFilename('ciphertext','DEMO',date), backupFilename('new ciphertext','DEMO',date));
  assert.match(backupFilename('ciphertext','DEMO',date), /^bloz-DEMO-2026-10-14-[a-f0-9]{12}\.json$/);
});
test('password UI disables completed steps and only commits after file verification', async () => {
  const { wallet, storage, original } = await setup();
  const nodes = new Map();
  const $ = id => {
    if (!nodes.has(id)) nodes.set(id, { value:'', handlers:{}, classList:{ remove(){} }, addEventListener(type,fn){this.handlers[type]=fn;} });
    return nodes.get(id);
  };
  let pending, exported, error;
  const run = action => { pending = Promise.resolve().then(action).catch(e => { error=e; }).finally(() => renderPasswordChange(wallet,$,false)); };
  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis,'navigator',{ configurable:true,value:{locks:{request:async(name,fn)=>fn()}} });
  try {
    installPasswordChange({wallet,$,run,download:text=>{exported=text;},readBackup:async()=>exported,message(){} });
    const submit = async id => { $(id).handlers.submit({preventDefault(){}}); await pending; };
    $('change-current').value=oldPassword; $('change-new').value=newPassword; $('change-confirm').value=newPassword;
    await submit('change-password-form');
    assert.equal(error,undefined); assert.equal($('change-prepare').disabled,true);
    assert.equal($('change-commit').disabled,true); assert.equal(storage.getItem(wallet.storageKey),original);
    $('change-verify-password').value='wrong'; await submit('change-verify-form');
    assert.ok(error); assert.equal($('change-commit').disabled,true);
    error=undefined; $('change-verify-password').value=newPassword; await submit('change-verify-form');
    assert.equal(error,undefined); assert.equal($('change-verify').disabled,true); assert.equal($('change-commit').disabled,false);
    $('change-commit').handlers.click(); await pending;
    assert.equal(storage.getItem(wallet.storageKey),exported);
    assert.equal($('change-prepare').disabled,false); assert.equal($('change-commit').hidden,true);
  } finally { Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator}); }
});
async function setup() {
  const entries = new Map();
  const storage = { getItem: k => entries.get(k) ?? null, setItem: (k,v) => entries.set(k,v), removeItem: k => entries.delete(k) };
  const wallet = new WalletSession(storage);
  wallet.create();
  const original = await wallet.prepareBackup(oldPassword, oldPassword);
  await wallet.verifyBackup(original, oldPassword); wallet.activate();
  return { wallet, storage, original };
}
test('password change is staged until verified and committed; old and new files retain the same key', async () => {
  const { wallet, storage, original } = await setup();
  const address = wallet.info.address;
  await assert.rejects(wallet.prepareReplacement('wrong password', newPassword, newPassword));
  await assert.rejects(wallet.prepareReplacement(oldPassword, oldPassword, oldPassword));
  await assert.rejects(wallet.prepareReplacement(oldPassword, newPassword, 'mismatch'));
  const replacement = await wallet.prepareReplacement(oldPassword, newPassword, newPassword);
  assert.equal(storage.getItem(wallet.storageKey), original);
  assert.throws(() => wallet.commitReplacement());
  await assert.rejects(wallet.verifyReplacement(original, oldPassword));
  await assert.rejects(wallet.verifyReplacement(replacement, oldPassword));
  assert.equal(wallet.replacementVerified, false);
  await wallet.verifyReplacement(replacement, newPassword);
  const setItem = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => wallet.commitReplacement(), /Quota/);
  assert.equal(storage.getItem(wallet.storageKey), original);
  storage.setItem = setItem;
  wallet.commitReplacement();
  assert.equal(storage.getItem(wallet.storageKey), replacement);
  assert.equal(wallet.info.address, address);
  wallet.lock(); await assert.rejects(wallet.unlock(oldPassword)); await wallet.unlock(newPassword);
  assert.equal(wallet.info.address, address);
  const codec = createBackupCodec();
  const a = await codec.decryptBackup(original, oldPassword), b = await codec.decryptBackup(replacement, newPassword);
  assert.deepEqual(a,b); a.fill(0); b.fill(0);
});
test('lock, cancellation and competing storage writes cannot replace the saved backup', async () => {
  const { wallet, storage, original } = await setup();
  const preparing = wallet.prepareReplacement(oldPassword,newPassword,newPassword);
  wallet.lock(); await assert.rejects(preparing);
  assert.equal(wallet.replacementPending,false);
  await wallet.unlock(oldPassword);
  const replacement = await wallet.prepareReplacement(oldPassword,newPassword,newPassword);
  const verifying = wallet.verifyReplacement(replacement,newPassword);
  wallet.cancelReplacement(); await assert.rejects(verifying);
  assert.equal(storage.getItem(wallet.storageKey),original);
  const second = await wallet.prepareReplacement(oldPassword,newPassword,newPassword);
  await wallet.verifyReplacement(second,newPassword);
  storage.setItem(wallet.storageKey,'other tab');
  assert.throws(() => wallet.commitReplacement(), /scheda/);
  assert.equal(storage.getItem(wallet.storageKey),'other tab');
});
test('private recovery export requires current password and is cancelled by lock',async()=>{
  const {wallet}=await setup();
  await assert.rejects(wallet.revealRecovery('incorrect password'));
  const exported=await wallet.revealRecovery(oldPassword);
  assert.ok(exported.descriptor.startsWith(`wpkh(${exported.wif})#`));
  const pending=wallet.revealRecovery(oldPassword);wallet.lock();await assert.rejects(pending);
});
