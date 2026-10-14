// Checks only public transaction data produced by the browser. No private key or password.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { regtestRpc, assertIsolated } from '../regtest-rpc.js';
import { createBalanceReader } from '../balance.js';
import { createSendService } from '../send-service.js';
import { addressScript } from '../src/address.js';
import { toRex } from '../src/money.js';

const [phase, from, to, txid] = process.argv.slice(2);
if (!['first', 'restored'].includes(phase) || !/^[a-f0-9]{64}$/.test(txid)) throw new Error('Uso: send-check.js first|restored from to txid');
addressScript(from); addressScript(to);
const rpc = regtestRpc({ control: true, broadcast: true });
const chain = await assertIsolated(rpc), reader = createBalanceReader(rpc);
const tx = await rpc('getrawtransaction', [txid, true]);
assert.equal(tx.vin.length, 1); assert.equal(tx.vin[0].txinwitness.length, 2); assert.equal(tx.vout.length, 2);
assert.equal(tx.vout[0].scriptPubKey.hex, addressScript(to));
assert.equal(tx.vout[1].scriptPubKey.hex, addressScript(from));
assert.equal(toRex(tx.vout[0].value), phase === 'first' ? 100_000_000n : 25_000_000n);
assert.equal(toRex(tx.vout[1].value), phase === 'first' ? 4_899_999_000n : 74_999_000n);
assert.equal((await createSendService(rpc).broadcast(tx.hex)).txid, txid); // same signed payload: no second payment
const beforeFrom = await reader(from), beforeTo = await reader(to);
assert.ok(BigInt(beforeFrom.pendingSpentRex) > 0n);
assert.equal(beforeTo.utxos.some((row) => row.txid === txid && row.status === 'pending'), true);
const [blockHash] = await rpc('generatetoaddress', [1, from, 10000, 1]);
const block = await rpc('getblock', [blockHash, 2]);
assert.ok(block.tx.some((entry) => entry.txid === txid));
const afterFrom = await reader(from), afterTo = await reader(to);
assert.equal(afterFrom.pendingSpentRex, '0');
assert.equal(afterTo.utxos.some((row) => row.txid === txid && row.status === 'confirmed'), true);
if (phase === 'restored') assert.equal(afterFrom.availableRex, '74999000');
await assertIsolated(rpc);
const reportPath = new URL('../evidence/send-regtest.json', import.meta.url);
let report = { network: 'bloz-regtest', realFunds: false, privateKeysInReport: false, coreWalletEnabled: false };
try { report = JSON.parse(await readFile(reportPath, 'utf8')); } catch {}
report[phase] = { checkedAt: new Date().toISOString(), from, to, txid, beforeHeight: chain.blocks,
  confirmationBlock: blockHash, amountRex: toRex(tx.vout[0].value).toString(), feeRex: '1000',
  changeRex: toRex(tx.vout[1].value).toString(), duplicatePayloadIdempotent: true,
  before: { sender: beforeFrom, recipient: beforeTo }, after: { sender: afterFrom, recipient: afterTo } };
await mkdir(new URL('../evidence/', import.meta.url), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ phase, txid, confirmed: true, senderAvailableRex: afterFrom.availableRex, recipientAvailableRex: afterTo.availableRex }));
