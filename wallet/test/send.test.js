import test from 'node:test';
import assert from 'node:assert/strict';
import { Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { identity } from '../src/keys.js';
import { parseAmount, prepareSend, signSend } from '../src/send.js';

const key = new Uint8Array(32); key[31] = 11;
const other = new Uint8Array(32); other[31] = 12;
const a = identity(key), b = identity(other);
function fixture() {
  const previous = new Transaction();
  previous.addInput({ txid: '01'.repeat(32), index: 0 });
  previous.addOutput({ amount: 500_000_000n, script: hex.decode(a.scriptPubKey) });
  const raw = hex.encode(previous.unsignedTx);
  return { from: a.address, to: b.address, amount: '1', fee: '0.00001000',
    coins: [{ txid: previous.id, vout: 0, confirmations: 100, coinbase: true, raw }] };
}
test('exact amounts reject rounding, exponent, comma, negative and oversized values', () => {
  assert.equal(parseAmount('0.00000001'), 1n);
  for (const bad of ['1e2', '1,2', '-1', 'NaN', '0', '1.000000001', '99999999', ' 1']) assert.throws(() => parseAmount(bad));
});
test('browser signer commits exact recipient, fee and change with SegWit SIGHASH_ALL', () => {
  const plan = prepareSend(fixture(), 0), signed = signSend(plan, key, 1);
  const tx = Transaction.fromRaw(hex.decode(signed.raw));
  assert.equal(tx.id, signed.txid); assert.equal(tx.inputsLength, 1); assert.equal(tx.outputsLength, 2);
  assert.equal(tx.getOutput(0).amount, 100_000_000n); assert.equal(hex.encode(tx.getOutput(0).script), b.scriptPubKey);
  assert.equal(tx.getOutput(1).amount, 399_999_000n); assert.equal(hex.encode(tx.getOutput(1).script), a.scriptPubKey);
  const witness = tx.getInput(0).finalScriptWitness;
  assert.equal(witness.length, 2); assert.equal(witness[0].at(-1), 1); assert.equal(hex.encode(witness[1]), a.publicKey);
  assert.throws(() => signSend(plan, other, 1)); assert.throws(() => signSend(plan, key, 60_000));
});
test('rejects forged prevout, wrong wallet, immature coinbase, excessive fee and dust change', () => {
  const data = fixture();
  assert.throws(() => prepareSend({ ...data, fee: '0.01' }));
  assert.throws(() => prepareSend({ ...data, amount: '4.99998999' }));
  assert.throws(() => prepareSend({ ...data, to: 'bc1qnotbloz' }));
  assert.throws(() => prepareSend({ ...data, coins: [{ ...data.coins[0], confirmations: 99 }] }));
  assert.throws(() => prepareSend({ ...data, coins: [{ ...data.coins[0], txid: 'ff'.repeat(32) }] }));
  assert.throws(() => prepareSend({ ...data, from: b.address, to: a.address }));
});
