import test from 'node:test';
import assert from 'node:assert/strict';
import { Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { createKeyCodec } from '../src/keys.js';
import { readSnapshot, agreedSnapshot, electrumFees, electrumBroadcast } from '../src/electrum-wallet.js';
import { prepareSend, signSend } from '../src/send.js';
const key=new Uint8Array(32);key[31]=21;const other=new Uint8Array(32);other[31]=22;
const codec=createKeyCodec('bloz-mainnet'),a=codec.identity(key),b=codec.identity(other);
function header(root){const bytes=new Uint8Array(80);bytes.set(hex.decode(root).reverse(),36);new DataView(bytes.buffer).setUint32(68,Math.floor(Date.now()/1000),true);return hex.encode(bytes);}
function fixture({pending=false,coinbase=false,confirmations=100,overrides={}}={}){
  const prev=new Transaction();prev.addInput({txid:coinbase?'00'.repeat(32):'01'.repeat(32),index:coinbase?0xffffffff:0});prev.addOutput({script:hex.decode(a.scriptPubKey),amount:3000n});
  const raw=hex.encode(prev.unsignedTx), height=200, received=height-confirmations+1;
  const plan=prepareSend({network:'bloz-mainnet',from:a.address,to:b.address,amount:'0.00001000',fee:'0.00000200',coins:[{txid:prev.id,vout:0,raw,coinbase:false,confirmations:100}]});
  const signed=signSend(plan,key), tip={height,hex:header(prev.id)};let sent=0;
  const values={
    'blockchain.headers.subscribe':tip,'blockchain.scripthash.subscribe':'status',
    'blockchain.scripthash.get_history':[{tx_hash:prev.id,height:received},...(pending?[{tx_hash:signed.txid,height:0}]:[])],
    'blockchain.scripthash.get_balance':{confirmed:3000,unconfirmed:pending?-1200:0},
    'blockchain.scripthash.listunspent':pending?[{tx_hash:signed.txid,tx_pos:1,value:1800,height:0}]:[{tx_hash:prev.id,tx_pos:0,value:3000,height:received}],
    'blockchain.transaction.get':([id])=>id===prev.id?raw:signed.raw,
    'blockchain.block.header':header(prev.id), 'blockchain.transaction.get_merkle':{block_height:received,pos:0,merkle:[]},
    'blockchain.estimatefee':0.00001,'blockchain.relayfee':0.000001,...overrides,
  };
  const client={verifyNetwork:async()=>{},close(){},request:async(m,p)=>typeof values[m]==='function'?values[m](p):values[m],broadcastSigned:async(r,id)=>{sent++;assert.equal(r,signed.raw);return id;}};
  return {client,signed,get sent(){return sent;}};
}
test('Electrum reconstructs confirmed balance and locally signed mempool change with reserved input',async()=>{
  const normal=await readSnapshot(fixture().client,a.address);assert.equal(normal.summary.availableRex,'3000');assert.equal(normal.coins.length,1);
  const pending=await readSnapshot(fixture({pending:true}).client,a.address);
  assert.equal(pending.summary.availableRex,'0');assert.equal(pending.summary.pendingSpentRex,'3000');assert.equal(pending.summary.pendingIncomingRex,'1800');assert.equal(pending.coins.length,0);
});
test('Electrum excludes immature coinbase and permits maturity boundary',async()=>{
  const early=await readSnapshot(fixture({coinbase:true,confirmations:99}).client,a.address);assert.equal(early.summary.immatureRex,'3000');assert.equal(early.coins.length,0);
  const mature=await readSnapshot(fixture({coinbase:true,confirmations:100}).client,a.address);assert.equal(mature.summary.availableRex,'3000');assert.equal(mature.coins.length,1);
});
test('Electrum rejects incorrect proof, amounts, incomplete history and changed snapshots',async()=>{
  for(const overrides of [
    {'blockchain.scripthash.get_balance':{confirmed:999,unconfirmed:0}},
    {'blockchain.scripthash.get_history':[]},
    {'blockchain.transaction.get_merkle':{block_height:101,pos:1,merkle:[]}},
    {'blockchain.scripthash.listunspent':[]},
    {'blockchain.transaction.get':'00'},
  ])await assert.rejects(readSnapshot(fixture({overrides}).client,a.address));
  let reads=0;const f=fixture();const request=f.client.request;f.client.request=async(m,p)=>m==='blockchain.scripthash.subscribe'?String(++reads):request(m,p);
  await assert.rejects(readSnapshot(f.client,a.address));
});
test('Electrum requires both servers and supports cancellation',async()=>{
  const f=fixture();assert.equal((await agreedSnapshot(a.address,null,()=>f.client)).summary.availableRex,'3000');
  let count=0;await assert.rejects(agreedSnapshot(a.address,null,()=>++count===1?fixture().client:fixture({confirmations:99}).client),/concordano/);
  const controller=new AbortController();controller.abort();await assert.rejects(agreedSnapshot(a.address,controller.signal,()=>f.client),/annullata/);
});
test('Electrum fees enforce bounds and marked fallback',async()=>{
  const f=fixture();assert.equal((await electrumFees(null,()=>f.client)).feeRex,'200');
  assert.equal((await electrumFees(null,()=>fixture({overrides:{'blockchain.estimatefee':-1}}).client)).source,'minimum-policy-fallback');
  await assert.rejects(electrumFees(null,()=>fixture({overrides:{'blockchain.estimatefee':1}}).client));
});
test('Electrum broadcast sends only signed bytes once after two preflight checks; no retry on uncertain result',async()=>{
  const f=fixture();assert.equal(await electrumBroadcast(f.signed,null,()=>f.client),f.signed.txid);assert.equal(f.sent,1);
  const unavailable=fixture({pending:true});await assert.rejects(electrumBroadcast(unavailable.signed,null,()=>unavailable.client));assert.equal(unavailable.sent,0);
  const uncertain=fixture();let attempts=0;uncertain.client.broadcastSigned=async()=>{attempts++;throw new Error('Disconnected after send');};
  await assert.rejects(electrumBroadcast(uncertain.signed,null,()=>uncertain.client));assert.equal(attempts,1);
});
