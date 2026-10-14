import { sha256 } from '@noble/hashes/sha2.js';
import { hex } from '@scure/base';
import { Transaction } from '@scure/btc-signer';
import { addressScript } from './address.js';
import { summarize } from './balance-summary.js';
import { ElectrumReadClient, ELECTRUM_ENDPOINTS } from './electrum-read.js';
const digest = bytes => sha256(sha256(bytes));
const hashId = bytes => hex.encode(digest(bytes).reverse());
const scriptHash = script => hex.encode(sha256(hex.decode(script)).reverse());
const idPattern = /^[0-9a-f]{64}$/;
const integer = (n, min = 0) => Number.isSafeInteger(n) && n >= min;
const fail = () => { throw new Error('Dati Electrum incompleti, incoerenti o cambiati. Riprova.'); };
function tipValid(tip) {
  if (!integer(tip?.height, 1) || !/^[0-9a-f]{160}$/.test(tip.hex)) fail();
  const time = new DataView(hex.decode(tip.hex).buffer).getUint32(68, true);
  if (Math.abs(Date.now()/1000-time)>7200) throw new Error('Electrum: ultimo blocco troppo vecchio o orario incoerente.');
}
export function verifyMerkle(txid, proof, header, height) {
  if (!idPattern.test(txid) || !/^[0-9a-f]{160}$/.test(header) || proof?.block_height !== height
      || !integer(proof.pos) || !Array.isArray(proof.merkle) || proof.merkle.length > 32) fail();
  let root = hex.decode(txid).reverse(), pos = proof.pos;
  for (const sibling of proof.merkle) {
    if (!idPattern.test(sibling)) fail();
    const branch = hex.decode(sibling).reverse();
    root = digest(new Uint8Array(pos % 2 ? [...branch, ...root] : [...root, ...branch])); pos = Math.floor(pos / 2);
  }
  if (pos !== 0 || hex.encode(root) !== header.slice(72,136)) fail();
}
function rawTransaction(raw, id) {
  if (typeof raw !== 'string' || raw.length > 200000 || !/^(?:[0-9a-f]{2})+$/.test(raw)) fail();
  const tx = Transaction.fromRaw(hex.decode(raw), { allowUnknownOutputs: true });
  if (tx.id !== id || tx.inputsLength > 1000 || tx.outputsLength > 1000) fail();
  return tx;
}
const isCoinbase = tx => tx.inputsLength === 1 && hex.encode(tx.getInput(0).txid) === '00'.repeat(32) && tx.getInput(0).index === 0xffffffff;
// Reconstruct confirmed and pending outputs from the bounded full address history.
// Electrum balances alone do not distinguish coinbase maturity or reserved inputs.
export async function readSnapshot(client, address) {
  const script = addressScript(address, 'bloz-mainnet'), sh = scriptHash(script);
  await client.verifyNetwork();
  const start = await client.request('blockchain.headers.subscribe'); tipValid(start);
  const status = await client.request('blockchain.scripthash.subscribe', [sh]);
  const [history, balance, unspent] = await Promise.all([
    client.request('blockchain.scripthash.get_history', [sh]),
    client.request('blockchain.scripthash.get_balance', [sh]),
    client.request('blockchain.scripthash.listunspent', [sh]),
  ]);
  if (!Array.isArray(history) || history.length > 100 || !Array.isArray(unspent) || unspent.length > 500
      || !integer(balance?.confirmed) || !integer(balance?.unconfirmed, -Number.MAX_SAFE_INTEGER)) fail();
  const outputs = new Map(), pending = new Map(), spent = new Set(), confirmedSpent = new Set(), rawById = new Map(), ids = new Set(), headers = new Map();
  for (const item of history) {
    if (!idPattern.test(item.tx_hash) || !integer(item.height,-1) || item.height > start.height || ids.has(item.tx_hash)) fail();
    ids.add(item.tx_hash);
    const raw = await client.request('blockchain.transaction.get',[item.tx_hash,false]);
    const tx = rawTransaction(raw,item.tx_hash), coinbase = isCoinbase(tx); rawById.set(item.tx_hash,raw);
    if (coinbase && item.height <= 0) fail();
    if (item.height > 0) {
      if (!headers.has(item.height)) headers.set(item.height, await client.request('blockchain.block.header',[item.height]));
      verifyMerkle(item.tx_hash,await client.request('blockchain.transaction.get_merkle',[item.tx_hash,item.height]),headers.get(item.height),item.height);
    }
    for (let n=0;n<tx.outputsLength;n++) {
      const out=tx.getOutput(n); if(hex.encode(out.script)!==script) continue;
      if(out.amount<0n || out.amount>2100000000000000n) fail();
      (item.height>0?outputs:pending).set(`${item.tx_hash}:${n}`,{txid:item.tx_hash,n,script,rex:out.amount,height:item.height>0?item.height:null,coinbase});
    }
    if(!coinbase) for(let n=0;n<tx.inputsLength;n++) {
      const input=tx.getInput(n), key=`${hex.encode(input.txid)}:${input.index}`;
      (item.height>0?confirmedSpent:spent).add(key);
    }
  }
  for(const key of confirmedSpent){outputs.delete(key);pending.delete(key);}
  for(const key of spent) pending.delete(key);
  const expected = new Map([...outputs,...pending].filter(([key])=>!spent.has(key)));
  if(unspent.length!==expected.size) fail();
  const seen=new Set();
  for(const out of unspent){
    const key=`${out.tx_hash}:${out.tx_pos}`, value=expected.get(key);
    if(!idPattern.test(out.tx_hash)||!integer(out.tx_pos)||!integer(out.value)||!integer(out.height)||!value||seen.has(key)
      ||BigInt(out.value)!==value.rex||out.height!==(value.height??0)) fail(); seen.add(key);
  }
  let confirmed=0n,incoming=0n,reserved=0n;
  for(const [key,out] of outputs){confirmed+=out.rex;if(spent.has(key)) reserved+=out.rex;}
  for(const out of pending.values()) incoming+=out.rex;
  if(confirmed!==BigInt(balance.confirmed)||incoming-reserved!==BigInt(balance.unconfirmed)) fail();
  const end=await client.request('blockchain.headers.subscribe');tipValid(end);
  if(end.height!==start.height||end.hex!==start.hex||await client.request('blockchain.scripthash.subscribe',[sh])!==status) fail();
  const snapshot={height:end.height,hash:hashId(hex.decode(end.hex)),outputs,pending,spent,checkedAt:new Date().toISOString()};
  const summary=summarize(snapshot,address,'bloz-mainnet');
  const coins=[...outputs].filter(([key,out])=>!spent.has(key)&&end.height-out.height+1>=(out.coinbase?100:1))
    .map(([,out])=>({txid:out.txid,vout:out.n,raw:rawById.get(out.txid),confirmations:end.height-out.height+1,coinbase:out.coinbase}));
  return {summary,coins,history:history.map(({tx_hash,height})=>({txid:tx_hash,height,confirmations:height>0?end.height-height+1:0}))};
}
function stable(value){return JSON.stringify(value);}
export async function agreedSnapshot(address, signal, makeClient = endpoint => new ElectrumReadClient(endpoint), endpoints = ELECTRUM_ENDPOINTS) {
  if(signal?.aborted) throw new DOMException('Operazione annullata','AbortError');
  const clients=endpoints.map(makeClient),close=()=>clients.forEach(c=>c.close());
  signal?.addEventListener('abort',close,{once:true});
  try {
    const values=await Promise.all(clients.map(c=>readSnapshot(c,address)));
    const canonical=v=>({...v,summary:{...v.summary,checkedAt:null},coins:[...v.coins].sort((a,b)=>a.txid.localeCompare(b.txid)||a.vout-b.vout),history:[...v.history].sort((a,b)=>a.txid.localeCompare(b.txid))});
    if(stable(canonical(values[0]))!==stable(canonical(values[1]))) throw new Error('I due Electrum non concordano. Saldo e invio sospesi: riprova.');
    if(signal?.aborted) throw new DOMException('Operazione annullata','AbortError');
    return values[0];
  } finally {signal?.removeEventListener('abort',close);close();}
}
function rate(value, estimate=false) {
  if(estimate&&value===-1) return null;
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1) fail();
  // Convert only the fee rate; monetary transaction amounts always remain integers.
  return BigInt(Math.ceil(value*100000000));
}
export async function electrumFees(signal, makeClient=endpoint=>new ElectrumReadClient(endpoint), endpoints=ELECTRUM_ENDPOINTS) {
  if(signal?.aborted) throw new DOMException('Operazione annullata','AbortError');
  const clients=endpoints.map(makeClient),close=()=>clients.forEach(c=>c.close());signal?.addEventListener('abort',close,{once:true});
  try {
    const values=await Promise.all(clients.map(async c=>{await c.verifyNetwork();const [e,r]=await Promise.all([c.request('blockchain.estimatefee',[6]),c.request('blockchain.relayfee')]);return {e:rate(e,true),r:rate(r)};}));
    const maximum=[1000n,...values.flatMap(v=>[v.e??0n,v.r])].reduce((a,b)=>a>b?a:b);
    const fee=(maximum*141n+999n)/1000n, cost=fee<200n?200n:fee;
    if(cost>100000n) throw new Error('Commissione oltre il limite della prova.');
    return {network:'bloz-mainnet',feeRex:String(cost),source:values.every(v=>v.e===null)?'minimum-policy-fallback':'node-estimate',checkedAt:new Date().toISOString()};
  } finally {signal?.removeEventListener('abort',close);close();}
}
// Called only by the explicit confirmation button, with already signed bytes.
export async function electrumBroadcast(signed,signal,makeClient=endpoint=>new ElectrumReadClient(endpoint), endpoints=ELECTRUM_ENDPOINTS) {
  if(signal?.aborted) throw new DOMException('Operazione annullata','AbortError');
  const tx=rawTransaction(signed.raw,signed.txid);
  if(signed.raw.length>2000||tx.inputsLength!==1||tx.outputsLength<1||tx.outputsLength>2) fail();
  const clients=endpoints.map(makeClient),close=()=>clients.forEach(c=>c.close());signal?.addEventListener('abort',close,{once:true});
  try {
    await Promise.all(clients.map(c=>c.verifyNetwork()));
    const input=tx.getInput(0),id=hex.encode(input.txid);
    const raw=await Promise.all(clients.map(c=>c.request('blockchain.transaction.get',[id,false])));
    if(raw[0]!==raw[1]) fail();
    const previous=rawTransaction(raw[0],id),out=previous.getOutput(input.index),script=hex.encode(out.script);
    if(!/^0014[0-9a-f]{40}$/.test(script)) fail();
    let total=0n;for(let n=0;n<tx.outputsLength;n++){const o=tx.getOutput(n);if(o.amount<1000n||!/^0014[0-9a-f]{40}$/.test(hex.encode(o.script))) fail();total+=o.amount;}
    if(out.amount-total<200n||out.amount-total>100000n) fail();
    for(const c of clients){const tip=await c.request('blockchain.headers.subscribe');tipValid(tip);const list=await c.request('blockchain.scripthash.listunspent',[scriptHash(script)]);
      if(!Array.isArray(list)||list.length>500) fail();const u=list.find(u=>u.tx_hash===id&&u.tx_pos===input.index);
      if(!u||!integer(u.height,1)||!integer(u.value)||BigInt(u.value)!==out.amount||tip.height-u.height+1<(isCoinbase(previous)?100:1)) throw new Error('Accredito non più disponibile o immaturo. Aggiorna il saldo.');}
    if(signal?.aborted) throw new DOMException('Operazione annullata','AbortError');
    // Never fail over automatically after a potentially successful broadcast.
    return await clients[0].broadcastSigned(signed.raw,signed.txid);
  } finally {signal?.removeEventListener('abort',close);close();}
}
