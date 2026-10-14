// Negative tests reuse public signed bytes; no key is loaded or created.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { Transaction, RawTx } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { regtestRpc, assertIsolated } from '../regtest-rpc.js';
import { createSendService } from '../send-service.js';

const path = new URL('../evidence/send-regtest.json', import.meta.url);
const report = JSON.parse(await readFile(path, 'utf8'));
const rpc = regtestRpc(), service = createSendService(rpc);
const chain = await assertIsolated(rpc), beforePool = await rpc('getrawmempool');
const original = await rpc('getrawtransaction', [report.first.txid, false, report.first.confirmationBlock]);
const coins = (await service.coins(report.first.from)).coins;
const candidate = coins.find((coin) => coin.coinbase);
assert.ok(candidate);
const tampered = RawTx.decode(hex.decode(original));
tampered.inputs[0].txid = hex.decode(candidate.txid); tampered.inputs[0].index = candidate.vout;
const badSignature = hex.encode(RawTx.encode(tampered));
const [signatureCheck] = await rpc('testmempoolaccept', [[badSignature]]);
assert.equal(signatureCheck.allowed, false);
assert.match(signatureCheck['reject-reason'], /script|signature/i);
await assert.rejects(service.broadcast(badSignature));
await assert.rejects(service.broadcast(original)); // spent outpoint, no second payment
const lastBlock = await rpc('getblock', [chain.bestblockhash, 2]);
tampered.inputs[0].txid = hex.decode(lastBlock.tx[0].txid); tampered.inputs[0].index = 0;
await assert.rejects(service.broadcast(hex.encode(RawTx.encode(tampered))), /immaturo/);
tampered.inputs[0].txid = hex.decode(candidate.txid); tampered.inputs[0].index = candidate.vout;
const prev = Transaction.fromRaw(hex.decode(candidate.raw), { allowUnknownOutputs: true }).getOutput(candidate.vout);
tampered.outputs[1].amount = prev.amount - tampered.outputs[0].amount - 100_001n;
await assert.rejects(service.broadcast(hex.encode(RawTx.encode(tampered))), /Commissione/);
assert.deepEqual(await rpc('getrawmempool'), beforePool);
assert.equal((await assertIsolated(rpc)).bestblockhash, chain.bestblockhash);
report.negativeChecks = { checkedAt: new Date().toISOString(), badSignatureRejectedByCore: signatureCheck['reject-reason'],
  spentInputRejected: true, immatureCoinbaseRejected: true, excessiveFeeRejected: true, noBroadcast: true };
await writeFile(path, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.negativeChecks));
