import test from 'node:test';
import assert from 'node:assert/strict';
import { createWalletServer } from '../server.js';
import { identity } from '../src/keys.js';

test('balance endpoint accepts public regtest addresses only; no generic RPC and no zero on error', async (t) => {
  const key = new Uint8Array(32); key[31] = 1; const { address } = identity(key);
  const seen = [];
  const server = createWalletServer({ readBalance: async (a) => { seen.push(a); return { network: 'bloz-regtest', address: a, availableRex: '1' }; } });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise((r) => server.close(r)));
  const url = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${url}/api/regtest/balance/private-key`)).status, 400);
  const good = await fetch(`${url}/api/regtest/balance/${address}`); assert.equal(good.status, 200);
  assert.equal((await good.json()).availableRex, '1'); assert.deepEqual(seen, [address]);
  assert.equal((await fetch(`${url}/api/regtest/balance/${address}`)).status, 429);
  assert.equal((await fetch(`${url}/api/regtest/balance/${address}`, { method: 'POST', body: '{}' })).status, 405);
  assert.equal((await fetch(`${url}/api/regtest/rpc?method=stop`)).status, 404);
  assert.equal((await fetch(`${url}/api/regtest/balance/${address}`, { headers: { Origin: 'https://evil.example' } })).status, 403);
});

test('offline balance is a 503 error without invented amounts or internal RPC errors', async (t) => {
  const key = new Uint8Array(32); key[31] = 2; const { address } = identity(key);
  const server = createWalletServer({ readBalance: async () => { throw new Error('private/internal/rpc-error'); } });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise((r) => server.close(r)));
  const result = await fetch(`http://127.0.0.1:${server.address().port}/api/regtest/balance/${address}`);
  assert.equal(result.status, 503); const data = await result.json();
  assert.deepEqual(Object.keys(data), ['error']); assert.ok(!data.error.includes('private/internal'));
});
