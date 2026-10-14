import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfiles, probeProfile, DEFAULT_PROFILE } from '../src/connections.js';
import { createWalletServer } from '../server.js';
import { installConnections } from '../src/connection-ui.js';
test('connection UI preserves previous profile on failure and blocks changes during send review',async()=>{
  const original={fetch:globalThis.fetch,document:globalThis.document,localStorage:globalThis.localStorage};
  const nodes=new Map(), $=id=>{if(!nodes.has(id))nodes.set(id,{value:'',handlers:{},addEventListener(t,fn){this.handlers[t]=fn;},append(){}});return nodes.get(id);};
  let saved='default',pending,error,blocked=false,fail=false,resets=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>[{id:'local',type:'local',label:'Local'}]});
  globalThis.document={createElement:()=>({})};
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>saved,setItem:(k,v)=>{saved=v;}}});
  try {
    const api=installConnections({$,run:action=>{pending=Promise.resolve().then(action).catch(e=>{error=e;});},reset:()=>resets++,blocked:()=>blocked,probe:async()=>{if(fail)throw Error('Offline');}});
    await new Promise(setImmediate);assert.equal(api.ready,true);
    const submit=async()=>{$('connection-form').handlers.submit({preventDefault(){}});await pending;};
    $('connection-choice').value='local';blocked=true;await submit();assert.equal(resets,0);assert.equal(saved,'default');
    blocked=false;fail=true;await submit();assert.equal(api.local,false);assert.equal(saved,'default');assert.match(error.message,/Rimane selezionato/);
    $('connection-choice').value='local';fail=false;await submit();assert.equal(api.local,true);assert.equal(saved,'local');
    $('connection-default').handlers.click();await pending;assert.equal(api.local,false);assert.equal(saved,'default');
  } finally {globalThis.fetch=original.fetch;globalThis.document=original.document;Object.defineProperty(globalThis,'localStorage',{configurable:true,value:original.localStorage});}
});
test('connection profiles reject credential URLs, CSP injection, duplicate servers and unexpected fields',()=>{
  const valid={id:'custom',label:'My nodes',type:'electrum',endpoints:['wss://one.example/','wss://two.example:50004/']};
  assert.equal(validateProfiles([valid]).length,2);
  for(const url of ['http://one.example/','ws://one.example/','wss://u:p@one.example/','wss://one.example/?secret=x',"wss://one.example/; connect-src *",'wss://one.example/path']) assert.throws(()=>validateProfiles([{...valid,endpoints:[url,valid.endpoints[1]]}]));
  assert.throws(()=>validateProfiles([{...valid,endpoints:[valid.endpoints[0],valid.endpoints[0]]}]));
  assert.throws(()=>validateProfiles([{...valid,password:'secret'}]));
  assert.throws(()=>validateProfiles([{id:'local',label:'Local',type:'local',password:'secret'}]));
  assert.throws(()=>validateProfiles([valid,valid]));
});
test('connection probe requires matching recent headers and closes all clients on failure',async()=>{
  const bytes=new Uint8Array(80);new DataView(bytes.buffer).setUint32(68,Math.floor(Date.now()/1000),true);
  const tip={height:100,hex:Buffer.from(bytes).toString('hex')};
  for(const bad of [false,true]) {
    let closed=0,n=0;
    const make=()=>{const index=n++;return {verifyNetwork:async()=>{},request:async method=>method.includes('headers')?{...tip,height:tip.height+(bad?index:0)}:0.00001,close(){closed++;}};};
    if(bad) await assert.rejects(probeProfile(DEFAULT_PROFILE,null,make));else await probeProfile(DEFAULT_PROFILE,null,make);
    assert.equal(closed,2);
  }
});
test('Electrum-only server exposes public profiles but denies local RPC routes',async()=>{
  const server=createWalletServer({mainnet:true,profiles:[],localApi:false,readBalance:()=>{throw Error('must not run');},sendService:{}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    assert.deepEqual(await (await fetch(base+'/connections.json')).json(),[]);
    assert.equal((await fetch(base+'/api/mainnet/fees')).status,404);
    assert.equal((await fetch(base+'/connections.json',{headers:{Origin:'https://hostile.example'}})).status,403);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
