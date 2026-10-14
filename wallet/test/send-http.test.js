import test from 'node:test';
import assert from 'node:assert/strict';
import { createWalletServer } from '../server.js';
import { identity } from '../src/keys.js';

test('broadcast requires same origin, custom header, bounded signed-only body and excludes secrets', async (t) => {
  const seen = [];
  const server = createWalletServer({ sendService: { broadcast: async (raw) => { seen.push(raw); return { txid: 'ab'.repeat(32) }; } } });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise((r) => server.close(r)));
  const origin = `http://127.0.0.1:${server.address().port}`, url = origin + '/api/regtest/broadcast';
  const headers = { Origin: origin, 'Content-Type': 'application/json', 'X-BLOZ-Regtest': 'signed-only' };
  const post = (body, h = headers) => fetch(url, { method: 'POST', headers: h, body });
  assert.equal((await post('{"raw":"00"}', { 'Content-Type': 'application/json' })).status, 403);
  assert.equal((await post('{"raw":"00"}', { ...headers, Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post('{"raw":"00","wif":"test"}')).status, 400);
  assert.equal((await post('x'.repeat(4097))).status, 400);
  assert.equal((await post('null')).status, 400);
  assert.equal((await post('{"raw":"00"}')).status, 200);
  assert.deepEqual(seen, ['00']);
});
test('unavailable spendable coins returns 503 rather than an empty or successful response', async (t) => {
  const key = new Uint8Array(32); key[31] = 1;
  const server = createWalletServer({ sendService: { coins: async () => { throw new Error('internal'); } } });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise((r) => server.close(r)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/regtest/coins/${identity(key).address}`);
  assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('internal'));
});
