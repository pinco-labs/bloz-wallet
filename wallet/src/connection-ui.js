import { validateProfiles, DEFAULT_PROFILE, probeProfile } from './connections.js';
import { ElectrumReadClient } from './electrum-read.js';
export function installConnections({ $, run, reset, blocked, probe = probeProfile }) {
  let profiles=[DEFAULT_PROFILE], selected=DEFAULT_PROFILE;
  const key='bloz.connection.profile.v1';
  const status=text=>{$('connection-status').textContent=text;};
  const describe=()=>status(`${selected.label}. ${selected.type==='local'?'Lettura dal nodo locale. Storico completo non disponibile in questa modalità.':'I due server devono concordare; possono associare le richieste al tuo IP. Questo confronto non è una verifica indipendente della catena.'}`);
  const api={ready:false,get local(){return selected.type==='local';},get endpoints(){return selected.endpoints;},
    makeClient:endpoint=>new ElectrumReadClient(endpoint,{allowedEndpoints:selected.endpoints})};
  $('connection-panel').hidden=false;
  const apply=async candidate=>{
    if(blocked()) throw new Error('Attendi la fine dell’operazione o annulla il riepilogo di invio.');
    reset(); api.ready=false;
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),20000);
    try {
      status('Verifica rete, ultimo blocco e commissioni…');
      await probe(candidate,controller.signal);
      localStorage.setItem(key,candidate.id);
      selected=candidate; $('connection-choice').value=candidate.id; describe();
    } catch(error) {
      $('connection-choice').value=selected.id;
      throw new Error(`${error.message} Rimane selezionato: ${selected.label}.`);
    } finally {clearTimeout(timer);api.ready=true;}
  };
  $('connection-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
    const candidate=profiles.find(p=>p.id===$('connection-choice').value);
    if(!candidate) throw new Error('Profilo non disponibile.');
    await apply(candidate);
  },'connection-status');});
  $('connection-default').addEventListener('click',()=>run(()=>apply(DEFAULT_PROFILE),'connection-status'));
  void (async()=>{
    try {
      const response=await fetch('/connections.json',{cache:'no-store',credentials:'omit',redirect:'error'});
      if(!response.ok) throw new Error('Riavvia il servizio locale per abilitare le impostazioni avanzate.');
      profiles=validateProfiles(await response.json());
      selected=profiles.find(p=>p.id===localStorage.getItem(key))??DEFAULT_PROFILE;
      for(const profile of profiles){const option=document.createElement('option');option.value=profile.id;option.textContent=profile.label;$('connection-choice').append(option);}
      $('connection-choice').value=selected.id;
      describe(); api.ready=true;
    } catch(error){status(error.message);}
  })();
  return api;
}
