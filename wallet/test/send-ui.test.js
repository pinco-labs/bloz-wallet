import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { installPasswordChange, renderPasswordChange } from '../src/password-change.js';
import { allowedWalletOrigin } from '../src/origin-policy.js';

// Exercise the actual UI handlers with a fake signer and transport: no keys,
// node access or transactions are used by this regression test.
async function harness(failBroadcast = false, overrides = {}) {
  const nodes = new Map();
  const element = (id) => {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', textContent: '', disabled: false, hidden: false, handlers: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, fn) { this.handlers[type] = fn; },
      replaceChildren() {}, scrollIntoView() {},
    });
    return nodes.get(id);
  };
  class Session {
    active = true; unlocked = true; hasSaved = true; info = { address: 'source' };
    withKey(fn) { return fn('fake-key'); }
  }
  const context = vm.createContext({
    __BLOZ_MAINNET__: true, WalletSession: Session, localStorage: {}, installLanguage() {}, installPasswordChange, renderPasswordChange, allowedWalletOrigin,
    REGTEST_STORAGE_KEY: 'test', MAINNET_STORAGE_KEY: 'main', MAX_BACKUP_BYTES: 8192,
    createKeyCodec: () => ({ recoveryDescriptor() {} }), renderBackupPanel() {},
    installLifecycle: () => ({ activity() {} }), formatBloz: String,
    document: { hidden: false, getElementById: element,
      querySelectorAll: (selector) => selector === 'button' ? [...nodes.values()] : [] },
    window: { isSecureContext: true }, crypto: { subtle: {} }, navigator: { locks: {} },
    location: { hostname: '127.0.0.1' }, AbortController, setTimeout, clearTimeout,
    setInterval() {},
    fetch: async () => ({ ok: true, json: async () => ({ network: 'bloz-mainnet',
      feeRex: '200', checkedAt: new Date().toISOString(), source: 'node-estimate' }) }),
    fetchCoins: async () => [],
    prepareSend: (values) => ({ ...values, value: 1000n, cost: 200n, change: 1800n }),
    signSend: () => ({ txid: 'test-accepted-txid', raw: 'fake-signed-data' }),
    broadcast: async () => { if (failBroadcast) throw new Error('Transport outcome unknown'); },
    ...overrides,
  });
  const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  vm.runInContext(source.replace(/^import .*;\r?\n/gm, ''), context);
  const submit = async () => {
    element('send-form').handlers.submit({ preventDefault() {} });
    while (vm.runInContext('busy', context)) await new Promise(setImmediate);
  };
  return { element, submit, context };
}

test('backup-copy UI shows matching, different-wallet and failed outcomes beside the form', async () => {
  const {element:el,context}=await harness();
  el('check-copy-file').files=[{size:2,text:async()=>'{}'}];
  for (const [body,expected] of [
    ['return {matches:true}',/stesso indirizzo/],
    ['return {matches:false}',/altro indirizzo/],
    ['throw new Error("Password errata o backup danneggiato/non compatibile.")',/Password errata/],
  ]) {
    vm.runInContext(`wallet.checkBackupCopy = async () => { ${body} };`,context);
    el('check-copy-password').value='test password';
    el('check-copy-form').handlers.submit({preventDefault(){}});
    while(vm.runInContext('busy',context)) await new Promise(setImmediate);
    assert.match(el('check-copy-feedback').textContent,expected);
    assert.equal(vm.runInContext('wallet.active',context),true);
  }
  el('check-copy-file').handlers.input();
  assert.equal(el('check-copy-feedback').textContent,'');
});

test('automatic balance refresh is throttled, serialized and does not reset inactivity', async () => {
  let now = 100000, tick, calls = 0, activity = 0, resolveRead;
  class Clock extends Date { static now() { return now; } }
  const { element: el, context } = await harness(false, {
    Date: Clock, setInterval(fn) { tick = fn; },
    installLifecycle: () => ({ activity() { activity++; } }),
    fetchBalance: () => { calls++; return new Promise(resolve => { resolveRead = resolve; }); },
  });
  const data = { availableRex: '1800', confirmedRex: '1800', immatureRex: '0',
    pendingIncomingRex: '0', pendingSpentRex: '0', height: 123,
    checkedAt: new Date(now).toISOString(), utxoCount: 0, utxos: [] };
  tick(); assert.equal(calls, 1);
  now += 30000; tick(); await el('refresh-balance').handlers.click();
  assert.equal(calls, 1); // Neither timer nor button duplicates an in-flight read.
  resolveRead(data); await new Promise(setImmediate);
  assert.equal(el('available-balance').textContent, '1800 BLOZ');
  tick(); assert.equal(calls, 2);
  resolveRead(data); await new Promise(setImmediate);
  now += 29999; tick(); assert.equal(calls, 2);
  now++;
  for (const guard of ['document.hidden', 'busy', 'sendPlan', 'sendController']) {
    vm.runInContext(`${guard} = true`, context); tick(); assert.equal(calls, 2);
    vm.runInContext(`${guard} = null`, context);
  }
  vm.runInContext('wallet.active = false', context); tick(); assert.equal(calls, 2);
  vm.runInContext('wallet.active = true', context); tick(); assert.equal(calls, 3);
  vm.runInContext('uiEpoch++; wallet.active = false; clearBalance()', context);
  resolveRead(data); await new Promise(setImmediate);
  assert.equal(el('available-balance').textContent, '—'); // Late response after lock ignored.
  assert.equal(activity, 0);
});

test('failed automatic balance reads clear stale amounts and wait before retrying', async () => {
  let now = 100000, tick, calls = 0;
  class Clock extends Date { static now() { return now; } }
  const { element: el } = await harness(false, { Date: Clock,
    setInterval(fn) { tick = fn; },
    fetchBalance: async () => { calls++; throw new Error('Nodo non disponibile'); },
  });
  el('available-balance').textContent = '1800 BLOZ';
  tick(); await new Promise(setImmediate);
  assert.equal(el('available-balance').textContent, '—');
  assert.equal(el('balance-status').textContent, 'Nodo non disponibile');
  now += 29999; tick(); assert.equal(calls, 1);
  now++; tick(); await new Promise(setImmediate); assert.equal(calls, 2);
  await el('refresh-balance').handlers.click(); assert.equal(calls, 3);
});

test('accepted send clears draft, retains receipt and requires new recipient and amount', async () => {
  const { element: el, submit } = await harness();
  assert.equal(el('send-prepare').disabled, true);
  el('send-to').value = 'destination'; el('send-amount').value = '0.00001000';
  el('send-form').handlers.input();
  assert.equal(el('send-prepare').disabled, false);
  await submit(); await el('send-confirm').handlers.click();
  for (const id of ['send-to', 'send-amount', 'send-fee']) assert.equal(el(id).value, '');
  assert.equal(el('send-prepare').disabled, true);
  assert.equal(el('send-review').hidden, true);
  assert.match(el('send-result').textContent, /Accettata in mempool: test-accepted-txid/);
  el('send-to').value = 'new-destination'; el('send-form').handlers.input();
  assert.equal(el('send-prepare').disabled, true);
  el('send-amount').value = '0.00001000'; el('send-form').handlers.input();
  assert.equal(el('send-prepare').disabled, false);
});

test('uncertain broadcast does not claim acceptance or discard draft and transaction ID', async () => {
  const { element: el, submit } = await harness(true);
  el('send-to').value = 'destination'; el('send-amount').value = '0.00001000';
  await submit(); await el('send-confirm').handlers.click();
  assert.equal(el('send-to').value, 'destination');
  assert.equal(el('send-amount').value, '0.00001000');
  assert.match(el('send-result').textContent, /test-accepted-txid/);
  assert.doesNotMatch(el('send-result').textContent, /Accettata/);
  assert.equal(el('send-review').hidden, true);
});
