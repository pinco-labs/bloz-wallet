import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHistory } from '../src/history-view.js';
test('history distinguishes unavailable local history, not loaded and a verified empty result',()=>{
  const list={items:[],replaceChildren(){this.items=[];},append(item){this.items.push(item.textContent);}};
  const render=state=>renderHistory(list,state,()=>({}));
  render({local:true});assert.match(list.items[0],/non disponibile.*RPC/);
  render({});assert.match(list.items[0],/Aggiorna/);
  render({history:[]});assert.match(list.items[0],/Nessuna transazione/);
  render({history:[{txid:'abc',confirmations:2}]});assert.deepEqual(list.items,['abc · 2 conferme']);
  render({local:true,history:[{txid:'old',confirmations:2}]});assert.equal(list.items.some(v=>v.includes('old')),false);
});
