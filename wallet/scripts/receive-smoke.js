// Opt-in test of the dedicated 101-block fixture; never connects to another RPC.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { regtestRpc, assertIsolated } from '../regtest-rpc.js';
import { createBalanceReader } from '../balance.js';

const address = JSON.parse(await readFile(new URL('../evidence/core-compatibility.json', import.meta.url), 'utf8')).address;
const rpc = regtestRpc({ control: true }), readBalance = createBalanceReader(rpc);
const chain = await assertIsolated(rpc);
assert.equal(chain.blocks, 101, 'This test is only for the dedicated 101-block test fixture.');
const before = await readBalance(address);
assert.equal(before.availableRex, '10000000000');
assert.equal(before.immatureRex, '495000000000');
assert.equal(before.utxoCount, 101);
const cutoff = await rpc('getblockhash', [100]);
let removed;
try {
  await rpc('invalidateblock', [cutoff]);
  removed = await readBalance(address);
  assert.equal(removed.height, 99); assert.equal(removed.availableRex, '0');
  assert.equal(removed.immatureRex, '495000000000'); assert.equal(removed.utxoCount, 99);
} finally { await rpc('reconsiderblock', [cutoff]); }
const restored = await readBalance(address);
assert.equal(restored.blockHash, before.blockHash);
assert.equal(restored.availableRex, before.availableRex);
assert.equal(restored.utxoCount, before.utxoCount);
const report = { checkedAt: new Date().toISOString(), chain: 'regtest', p2p: false, coreWalletEnabled: false, address,
  generatedBlocks: 101, miningThreads: 1, realFunds: false,
  height101: { availableRex: before.availableRex, immatureRex: before.immatureRex, utxoCount: before.utxoCount },
  rollbackTo99: { availableRex: removed.availableRex, immatureRex: removed.immatureRex, utxoCount: removed.utxoCount },
  restored: restored.blockHash === before.blockHash, pendingTransactionsTested: 'synthetic unit tests only', transactionSigningImplemented: false };
await writeFile(new URL('../evidence/receive-regtest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
