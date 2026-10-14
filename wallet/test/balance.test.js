import test from 'node:test';
import assert from 'node:assert/strict';
import { scanSnapshot, summarize } from '../balance.js';
import { addressScript } from '../src/address.js';
import { GENESIS, assertIsolated, regtestRpc } from '../regtest-rpc.js';
import { identity } from '../src/keys.js';

const key = new Uint8Array(32); key[31] = 1;
const { address, scriptPubKey: script } = identity(key);
const txid = (n) => n.toString(16).padStart(64, '0');

test('coinbase boundary, reserved confirmed outputs, pending children and exact rex totals', () => {
  const output = (n, rex, height, coinbase = false) => ({ txid: txid(n), n: 0, rex, height, coinbase, script });
  const state = { height: 100, hash: txid(500), checkedAt: new Date().toISOString(),
    outputs: new Map([[`${txid(1)}:0`, output(1, 5_000_000_000n, 1, true)],
      [`${txid(2)}:0`, output(2, 5_000_000_000n, 2, true)], [`${txid(3)}:0`, output(3, 123456789n, 99)]]),
    pending: new Map([[`${txid(4)}:0`, output(4, 1n, null)]]), spent: new Set([`${txid(3)}:0`]) };
  let result = summarize(state, address);
  assert.equal(result.confirmedRex, '5123456789'); assert.equal(result.immatureRex, '5000000000');
  assert.equal(result.pendingSpentRex, '123456789'); assert.equal(result.pendingIncomingRex, '1');
  assert.equal(result.availableRex, '5000000000');
  state.height = 99; result = summarize(state, address);
  assert.equal(result.availableRex, '0'); assert.equal(result.immatureRex, '10000000000');
});

function fixture() {
  const blockHash = txid(200), parent = txid(2), child = txid(3), coinbase = txid(1);
  const cb = { txid: coinbase, vin: [{ coinbase: '00' }], vout: [{ n: 0, value: '50.00000000', scriptPubKey: { hex: script } }] };
  const p = { txid: parent, vin: [{ txid: txid(999), vout: 0 }], vout: [{ n: 0, value: '1.00000001', scriptPubKey: { hex: script } }] };
  const c = { txid: child, vin: [{ txid: parent, vout: 0 }], vout: [{ n: 0, value: '1.00000000', scriptPubKey: { hex: script } }] };
  const state = { chain: 'regtest', blocks: 1, bestblockhash: blockHash, pruned: false };
  const net = { networkactive: false, connections: 0 };
  const pool = [child, parent];
  const rpc = async (method, args) => {
    switch (method) {
      case 'getblockchaininfo': return { ...state };
      case 'getnetworkinfo': return net;
      case 'getblockhash': return args[0] === 0 ? GENESIS : blockHash;
      case 'getblock': return { hash: blockHash, previousblockhash: GENESIS, height: 1, tx: [cb] };
      case 'getrawmempool': return pool;
      case 'getrawtransaction': return args[0] === parent ? p : c;
      default: throw new Error('Unexpected RPC');
    }
  };
  return { rpc, state, net, pool };
}

test('scanner handles reversed mempool dependencies and never includes genesis outputs', async () => {
  const f = fixture(), snapshot = await scanSnapshot(f.rpc), result = summarize(snapshot, address);
  assert.equal(result.immatureRex, '5000000000'); assert.equal(result.pendingIncomingRex, '100000000');
  assert.equal(result.confirmedRex, '0'); assert.equal(result.utxoCount, 2);
  f.pool.splice(0); const evicted = summarize(await scanSnapshot(f.rpc), address);
  assert.equal(evicted.pendingIncomingRex, '0'); assert.equal(evicted.utxoCount, 1);
});

test('wrong network, live P2P, pruned data and over-limit chain fail closed', async () => {
  for (const bad of [{ chain: 'main' }, { pruned: true }, { blocks: 501 }]) {
    const f = fixture(); Object.assign(f.state, bad); await assert.rejects(scanSnapshot(f.rpc));
  }
  const f = fixture(); f.net.networkactive = true; await assert.rejects(assertIsolated(f.rpc));
  await assert.rejects(regtestRpc()('importdescriptors', []), /non consentito/);
  await assert.rejects(regtestRpc()('generatetoaddress', []), /non consentito/);
  assert.throws(() => addressScript(address.toUpperCase()));
  assert.throws(() => addressScript(address.replace('bzrt', 'bz')));
  assert.throws(() => addressScript(address.slice(0, -1) + (address.endsWith('q') ? 'p' : 'q')));
});

test('mid-scan chain or mempool changes and unavailable RPC never become a zero balance', async () => {
  const f = fixture(); let reads = 0;
  const changing = async (method, args) => {
    const result = await f.rpc(method, args);
    if (method === 'getblockchaininfo' && ++reads === 2) return { ...result, bestblockhash: txid(999) };
    return result;
  };
  await assert.rejects(scanSnapshot(changing), /Stato cambiato/);
  await assert.rejects(scanSnapshot(async () => { throw new Error('offline'); }), /offline/);
  let pools = 0;
  await assert.rejects(scanSnapshot(async (method, args) => method === 'getrawmempool' && ++pools === 2 ? [] : f.rpc(method, args)), /Stato cambiato/);
});
