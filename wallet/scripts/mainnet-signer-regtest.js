// Exercise mainnet-format addresses/signing against actual Core consensus on isolated regtest.
// Generates only test blocks, checks mempool acceptance, NEVER broadcasts the signed transaction.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createKeyCodec, generateKey } from '../src/keys.js';
import { prepareSend, signSend } from '../src/send.js';
import { createBackupCodec } from '../src/backup.js';
import { regtestRpc, assertIsolated } from '../regtest-rpc.js';
const rpc = regtestRpc({ control: true });
const main = createKeyCodec('bloz-mainnet'), reg = createKeyCodec();
const key = generateKey(), other = generateKey();
const from = main.identity(key), to = main.identity(other), regAddress = reg.identity(key).address;
const password = 'Disposable mainnet signer regtest check!';
const codec = createBackupCodec('bloz-mainnet-wallet');
let restored;
try {
  const chain = await assertIsolated(rpc);
  assert.ok(chain.blocks + 100 <= 500);
  const backup = await codec.encryptBackup(key, password);
  restored = await codec.decryptBackup(backup, password);
  key.fill(0);
  let first;
  for (let i = 0; i < 100; i++) {
    await assertIsolated(rpc);
    const [hash] = await rpc('generatetoaddress', [1, regAddress, 10000, 1]);
    if (i === 0) first = hash;
    if ((i + 1) % 25 === 0) console.log(`Blocchi isolati di prova: ${i + 1}/100`);
  }
  const block = await rpc('getblock', [first, 2]);
  const prev = block.tx[0], vout = prev.vout.findIndex((o) => o.scriptPubKey.hex === from.scriptPubKey);
  assert.ok(vout >= 0);
  const raw = await rpc('getrawtransaction', [prev.txid, false, first]);
  const plan = prepareSend({ network: 'bloz-mainnet', from: from.address, to: to.address, amount: '0.00001000', fee: '0.00000200',
    coins: [{ txid: prev.txid, vout, confirmations: 100, coinbase: true, raw }] });
  const signed = signSend(plan, restored);
  const [accepted] = await rpc('testmempoolaccept', [[signed.raw], 0.01]);
  assert.equal(accepted.allowed, true, JSON.stringify(accepted));
  assert.equal(accepted.txid, signed.txid);
  assert.ok(!(await rpc('getrawmempool')).includes(signed.txid));
  await assertIsolated(rpc);
  const report = { checkedAt: new Date().toISOString(), validationChain: 'regtest', addressCodec: 'bloz-mainnet',
    from: from.address, to: to.address, recoveredFromMainnetBackup: true, feeRex: '200', amountRex: '1000',
    coreMempoolAcceptance: true, vsize: signed.vsize, broadcast: false, realFundsUsed: false };
  await writeFile(new URL('../evidence/mainnet-signer-regtest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally { key.fill(0); other.fill(0); restored?.fill(0); }
