import test from 'node:test';
import assert from 'node:assert/strict';
import { Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { createKeyCodec, generateKey } from '../src/keys.js';
import { WalletSession, MAINNET_STORAGE_KEY, MAINNET_OFFLINE_STORAGE_KEY } from '../src/session.js';
import { prepareSend, signSend } from '../src/send.js';
import { scanMainnet, mainnetFees, readMainnetBalance } from '../mainnet-service.js';
import { assertMainnetReady } from '../mainnet-rpc.js';
import { createSendService } from '../send-service.js';
import { createWalletServer } from '../server.js';

const keys = createKeyCodec('bloz-mainnet');
const key = generateKey(), other = generateKey(), a = keys.identity(key), b = keys.identity(other);
const hash = 'ab'.repeat(32), txid = 'cd'.repeat(32);
const genesis = '44c1a8c852b3eda21966e1ddb6b0807e22488dffe8a270bf24bf1fa2d66c13bd';
function fakeRpc(overrides = {}) {
  const calls = [];
  const values = {
    getblockchaininfo: { chain: 'main', blocks: 200, headers: 200, bestblockhash: hash, initialblockdownload: false, time: Math.floor(Date.now() / 1000) },
    getnetworkinfo: { networkactive: true, connections: 2, relayfee: '0.00001000' },
    getblockhash: (p) => p[0] === 0 ? genesis : hash,
    scantxoutset: { success: true, bestblock: hash, height: 200, unspents: [{ txid, vout: 0, scriptPubKey: a.scriptPubKey, amount: '0.00003000', height: 200 }] },
    gettxout: { scriptPubKey: { hex: a.scriptPubKey }, value: '0.00003000', coinbase: false, confirmations: 1 },
    getrawmempool: [], estimatesmartfee: { feerate: '0.00002000' }, getmempoolinfo: { mempoolminfee: '0.00001000' }, ...overrides,
  };
  const rpc = async (method, params = []) => {
    calls.push(method); const result = values[method];
    if (result === undefined) throw new Error('Unexpected RPC ' + method);
    return typeof result === 'function' ? result(params) : result;
  };
  rpc.calls = calls; return rpc;
}
test('mainnet snapshot has exact confirmed totals and fails closed on reorg, scan failure or wrong chain', async () => {
  const balance = await readMainnetBalance(fakeRpc())(a.address);
  assert.equal(balance.network, 'bloz-mainnet'); assert.equal(balance.availableRex, '3000'); assert.equal(balance.pendingIncomingRex, '0');
  for (const overrides of [
    { scantxoutset: { success: false } },
    { scantxoutset: { success: true, bestblock: 'ef'.repeat(32), height: 200, unspents: [] } },
    { gettxout: null }, { getblockhash: 'ff'.repeat(32) },
    { getblockchaininfo: { chain: 'regtest' } },
    { getnetworkinfo: { networkactive: false, connections: 0 } },
  ]) await assert.rejects(scanMainnet(fakeRpc(overrides), a.address));
});
test('mainnet snapshot accounts for mempool spends, incoming change and coinbase immaturity', async () => {
  const id = 'aa'.repeat(32);
  const rpc = fakeRpc({ getrawmempool: [id], getrawtransaction: { txid: id, vin: [{ txid, vout: 0 }],
    vout: [{ n: 1, value: '0.00001000', scriptPubKey: { hex: a.scriptPubKey } }] } });
  const balance = await readMainnetBalance(rpc)(a.address);
  assert.equal(balance.confirmedRex, '3000'); assert.equal(balance.pendingSpentRex, '3000');
  assert.equal(balance.availableRex, '0'); assert.equal(balance.pendingIncomingRex, '1000');
  const immature = await readMainnetBalance(fakeRpc({ gettxout: { scriptPubKey: { hex: a.scriptPubKey }, value: '0.00003000', coinbase: true } }))(a.address);
  assert.equal(immature.immatureRex, '3000'); assert.equal(immature.availableRex, '0');
});
test('mainnet fees use highest policy/estimate, round upward, label fallback and reject excessive fees', async () => {
  const estimated = await mainnetFees(fakeRpc()); assert.equal(estimated.feeRex, '282'); assert.equal(estimated.source, 'node-estimate');
  const fallback = await mainnetFees(fakeRpc({ estimatesmartfee: { errors: ['insufficient data'] } }));
  assert.equal(fallback.feeRex, '200'); assert.equal(fallback.source, 'minimum-policy-fallback');
  const pool = await mainnetFees(fakeRpc({ getmempoolinfo: { mempoolminfee: '0.00003001' } }));
  assert.equal(pool.feeRex, '424');
  await assert.rejects(mainnetFees(fakeRpc({ estimatesmartfee: { feerate: '1.00000000' } })));
});
test('mainnet signature commits recipient, exact fee and change; mainnet broadcaster preflights before sending', async () => {
  const prev = new Transaction(); prev.addInput({ txid: '01'.repeat(32), index: 0 });
  prev.addOutput({ script: hex.decode(a.scriptPubKey), amount: 3000n });
  const plan = prepareSend({ network: 'bloz-mainnet', from: a.address, to: b.address, amount: '0.00001000', fee: '0.00000282',
    coins: [{ txid: prev.id, vout: 0, confirmations: 1, coinbase: false, raw: hex.encode(prev.unsignedTx) }] }, 0);
  const signed = signSend(plan, key, 1), tx = Transaction.fromRaw(hex.decode(signed.raw));
  assert.equal(tx.getOutput(0).amount, 1000n); assert.equal(tx.getOutput(1).amount, 1718n);
  assert.equal(hex.encode(tx.getOutput(0).script), b.scriptPubKey); assert.ok(signed.vsize <= 141);
  assert.throws(() => signSend(plan, other, 1)); assert.throws(() => signSend(plan, key, 60000));
  const rpc = fakeRpc({ testmempoolaccept: [{ allowed: true, txid: signed.txid }], sendrawtransaction: signed.txid });
  const service = createSendService(rpc, { network: 'bloz-mainnet', scan: scanMainnet, assertReady: assertMainnetReady });
  assert.equal((await service.broadcast(signed.raw)).txid, signed.txid);
  assert.ok(rpc.calls.indexOf('testmempoolaccept') < rpc.calls.indexOf('sendrawtransaction'));
  for (const overrides of [{ gettxout: null }, { testmempoolaccept: [{ allowed: false }] }, { getblockchaininfo: { chain: 'main', initialblockdownload: true } }]) {
    const bad = fakeRpc(overrides);
    await assert.rejects(createSendService(bad, { network: 'bloz-mainnet', assertReady: assertMainnetReady }).broadcast(signed.raw));
    assert.ok(!bad.calls.includes('sendrawtransaction'));
  }
});
test('mainnet session is separate from offline; refuses its backups and only signs after verification', async () => {
  const map = new Map([[MAINNET_OFFLINE_STORAGE_KEY, 'offline sentinel']]);
  const store = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
  const session = new WalletSession(store, { mainnet: true }); session.create();
  assert.throws(() => session.withKey(() => {}));
  const pw = 'Disposable mainnet session password!';
  const backup = await session.prepareBackup(pw, pw); await session.verifyBackup(backup, pw); session.activate();
  assert.equal(JSON.parse(map.get(MAINNET_STORAGE_KEY)).format, 'bloz-mainnet-wallet');
  assert.equal(map.get(MAINNET_OFFLINE_STORAGE_KEY), 'offline sentinel');
  assert.equal(session.withKey((k) => keys.identity(k).address), session.info.address);
  session.lock(); await session.unlock(pw); assert.match(session.info.address, /^bz1q/);
});
test('mainnet HTTP accepts only public read routes and explicit same-origin signed transaction payloads', async (t) => {
  let broadcasts = 0;
  const server = createWalletServer({ mainnet: true, readFees: async () => ({ network: 'bloz-mainnet', feeRex: '200' }),
    readBalance: async (address) => ({ address }), sendService: { broadcast: async () => { broadcasts++; return { txid }; }, coins: async () => ({ coins: [] }) } });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise((r) => server.close(r)));
  const url = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(url + '/api/mainnet/fees')).status, 200);
  assert.equal((await fetch(url + '/api/mainnet/balance/' + a.address)).status, 200);
  assert.equal((await fetch(url + '/api/mainnet/balance/' + createKeyCodec().identity(key).address)).status, 400);
  assert.equal((await fetch(url + '/api/regtest/coins/' + a.address)).status, 404);
  assert.equal((await fetch(url + '/api/mainnet/broadcast', { method: 'POST', body: '{}' })).status, 403);
  const headers = { Origin: url, 'Content-Type': 'application/json', 'X-BLOZ-mainnet': 'signed-only' };
  assert.equal((await fetch(url + '/api/mainnet/broadcast', { method: 'POST', headers, body: JSON.stringify({ password: 'no' }) })).status, 400);
  assert.equal(broadcasts, 0);
  assert.equal((await fetch(url + '/api/mainnet/broadcast', { method: 'POST', headers, body: JSON.stringify({ raw: '00' }) })).status, 200);
  assert.equal(broadcasts, 1);
});
test('concurrent fee reads are bounded and recover after an RPC error', async (t) => {
  let finish, started, calls=0;
  const entered=new Promise(resolve=>{started=resolve;});
  const server=createWalletServer({mainnet:true,readBalance:async()=>({}),sendService:{},readFees:()=>{
    calls++; if(calls>1)return Promise.resolve({feeRex:'200'});
    started();return new Promise((resolve,reject)=>{finish=()=>reject(Error('offline'));});
  }});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const url=`http://127.0.0.1:${server.address().port}/api/mainnet/fees`;
  const first=fetch(url);await entered;
  assert.equal((await fetch(url)).status,429);assert.equal(calls,1);
  finish();assert.equal((await first).status,503);
  assert.equal((await fetch(url)).status,200);assert.equal(calls,2);
});
