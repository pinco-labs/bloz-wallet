import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { ElectrumReadClient, ELECTRUM_ENDPOINTS } from '../src/electrum-read.js';
import { addressScript } from '../src/address.js';
import { createKeyCodec, generateKey } from '../src/keys.js';
import { createBackupCodec } from '../src/backup.js';
const address = 'bz1qlc8gajp3s8e9npmausgcz8rxkqnleuej639xv3';
const txid = '668809e6b90a1693b73a37e67763e33bf90f6048dc35efbdecf178c18e0f92be';
const hash = data => createHash('sha256').update(data).digest();
const sh = address => hash(Buffer.from(addressScript(address,'bloz-mainnet'),'hex')).reverse().toString('hex');
async function probe(endpoint) {
  const client = new ElectrumReadClient(endpoint);
  try {
    const features = await client.verifyNetwork();
    const before = await client.request('blockchain.headers.subscribe');
    const status = await client.request('blockchain.scripthash.subscribe',[sh(address)]);
    const [balance,history,utxos,estimate,relay,raw] = await Promise.all([
      client.request('blockchain.scripthash.get_balance',[sh(address)]),
      client.request('blockchain.scripthash.get_history',[sh(address)]),
      client.request('blockchain.scripthash.listunspent',[sh(address)]),
      client.request('blockchain.estimatefee',[6]), client.request('blockchain.relayfee'),
      client.request('blockchain.transaction.get',[txid,false]),
    ]);
    assert.equal(balance.confirmed,1800); assert.equal(balance.unconfirmed,0);
    assert.equal(utxos.length,1); assert.equal(utxos[0].tx_hash,txid); assert.equal(utxos[0].tx_pos,1); assert.equal(utxos[0].value,1800);
    assert.equal(history.find(row=>row.tx_hash===txid)?.height,17966);
    assert.ok(Number.isFinite(estimate) && estimate>0); assert.ok(Number.isFinite(relay) && relay>=0);
    const tx=Transaction.fromRaw(hex.decode(raw),{allowUnknownOutputs:true}); assert.equal(tx.id,txid);
    assert.equal(tx.getOutput(1).amount,1800n); assert.equal(hex.encode(tx.getOutput(1).script),addressScript(address,'bloz-mainnet'));
    const proof=await client.request('blockchain.transaction.get_merkle',[txid,17966]);
    const header=await client.request('blockchain.block.header',[17966]);
    assert.equal(header.length,160); assert.equal(proof.block_height,17966);
    let root=Buffer.from(txid,'hex').reverse(),position=proof.pos;
    assert.ok(Number.isSafeInteger(position)&&position>=0&&proof.merkle.length<=32);
    for(const sibling of proof.merkle){assert.match(sibling,/^[0-9a-f]{64}$/);const branch=Buffer.from(sibling,'hex').reverse();root=hash(hash(Buffer.concat(position%2?[branch,root]:[root,branch])));position=Math.floor(position/2);}
    assert.equal(root.toString('hex'),Buffer.from(header,'hex').subarray(36,68).toString('hex'));
    const after=await client.request('blockchain.headers.subscribe');
    assert.deepEqual(after,before); assert.equal(await client.request('blockchain.scripthash.subscribe',[sh(address)]),status);
    return {endpoint,server:features.server_version,height:after.height,balance,history,utxos,estimate,relay,rawTransactionVerified:true,merkleProofVerifiedAgainstServerHeader:true};
  } finally { client.close(); }
}
const reports=await Promise.all(ELECTRUM_ENDPOINTS.map(probe));
assert.deepEqual(reports[0].balance,reports[1].balance); assert.deepEqual(reports[0].history,reports[1].history);
const result={checkedAt:new Date().toISOString(),readOnly:true,mainnetBroadcast:false,address,txid,reports,limitations:['Header supplied by server; not an independently validated BLOZ PoW header chain.','Experimental read transport is not connected to wallet UI or signing/broadcast.','Live WSS exercised through Node, not yet through Chrome page origin/CSP.']};
await writeFile(new URL('../evidence/electrum-read-checks.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
