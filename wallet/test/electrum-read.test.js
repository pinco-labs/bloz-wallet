import test from 'node:test';
import assert from 'node:assert/strict';
import { ElectrumReadClient, ELECTRUM_ENDPOINTS, BLOZ_GENESIS } from '../src/electrum-read.js';
function fixture(reply) {
  let socket;
  class FakeSocket {
    constructor() { socket = this; queueMicrotask(() => this.onopen()); }
    send(text) { const request = JSON.parse(text); queueMicrotask(() => reply(this, request)); }
    close() { this.onclose?.(); }
  }
  return { client: new ElectrumReadClient(ELECTRUM_ENDPOINTS[0], { WebSocketClass: FakeSocket, timeoutMs: 100 }), get socket() { return socket; } };
}
const answer = (s, q, result) => s.onmessage({ data: JSON.stringify({ id: q.id, result }) });
test('Electrum verifies BLOZ network and refuses broadcast and arbitrary endpoints', async () => {
  const { client } = fixture((s,q) => answer(s,q,q.method === 'server.version' ? ['test','1.4'] : { genesis_hash: BLOZ_GENESIS, hash_function: 'sha256' }));
  try { await client.verifyNetwork(); await assert.rejects(client.request('blockchain.transaction.broadcast',['00']), /Solo letture/); }
  finally { client.close(); }
  assert.throws(() => new ElectrumReadClient('wss://example.org/'), /Endpoint/);
});
test('Electrum rejects wrong chain', async () => {
  const { client } = fixture((s,q) => answer(s,q,q.method === 'server.version' ? ['test','1.4'] : { genesis_hash: '00'.repeat(32), hash_function: 'sha256' }));
  await assert.rejects(client.verifyNetwork(), /Rete/);
});
test('Electrum rejects disconnect, timeout, malformed response and server error without invented results', async () => {
  for (const action of [(s)=>s.close(), ()=>{}, (s)=>s.onmessage({data:'invalid'}),
    (s,q)=>s.onmessage({data:JSON.stringify({id:q.id,error:{code:1}})})]) {
    const {client}=fixture(action);
    try { await assert.rejects(client.request('server.features')); } finally { client.close(); }
  }
});
test('Electrum correlates out-of-order replies and ignores notifications', async () => {
  const queue=[];
  const {client}=fixture((s,q)=>{queue.push(q);if(queue.length===2){s.onmessage({data:JSON.stringify({method:'blockchain.headers.subscribe',params:[]})});answer(s,queue[1],'second');answer(s,queue[0],'first');}});
  try { assert.deepEqual(await Promise.all([client.request('server.features'),client.request('blockchain.relayfee')]),['first','second']); } finally {client.close();}
});
