import { ELECTRUM_ENDPOINTS, ElectrumReadClient } from './electrum-read.js';
export const DEFAULT_PROFILE = Object.freeze({ id: 'default', label: 'Electrum Pinco Labs (predefinito)', type: 'electrum', endpoints: [...ELECTRUM_ENDPOINTS] });
export function validateProfiles(input) {
  if (!Array.isArray(input) || input.length > 8) throw new Error('Configurazione connessioni non valida.');
  const ids = new Set(['default']);
  return [DEFAULT_PROFILE, ...input.map(p => {
    if (!p || !/^[a-z0-9-]{1,32}$/.test(p.id) || ids.has(p.id) || typeof p.label !== 'string' || !p.label.trim() || p.label.length > 80) throw new Error('Profilo non valido.');
    ids.add(p.id);
    if (p.type === 'local' && Object.keys(p).sort().join() === 'id,label,type') return { id:p.id, label:p.label, type:p.type };
    if (p.type !== 'electrum' || Object.keys(p).sort().join() !== 'endpoints,id,label,type' || !Array.isArray(p.endpoints) || p.endpoints.length !== 2) throw new Error('Servono due server Electrum.');
    const endpoints = p.endpoints.map(value => {
      if (typeof value !== 'string' || value.length > 256) throw new Error('Indirizzo server non valido.');
      const url = new URL(value);
      if (url.protocol !== 'wss:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !/^[a-zA-Z0-9.-]+$/.test(url.hostname)) throw new Error('Usare WSS senza credenziali, percorsi o parametri.');
      return url.href;
    });
    if (new Set(endpoints).size !== 2) throw new Error('Indicare due server distinti.');
    return { id:p.id, label:p.label, type:p.type, endpoints };
  })];
}
export async function probeProfile(profile, signal, makeClient = endpoint => new ElectrumReadClient(endpoint, { allowedEndpoints:profile.endpoints })) {
  if (signal?.aborted) throw new Error('Verifica annullata.');
  if (profile.type === 'local') {
    const response = await fetch('/api/mainnet/fees', {signal,cache:'no-store',credentials:'omit',redirect:'error'});
    if (!response.ok) throw new Error('Nodo locale non disponibile o non sincronizzato.');
    const result = await response.json();
    if (result.network !== 'bloz-mainnet' || !/^\d{1,6}$/.test(result.feeRex) || Math.abs(Date.now()-Date.parse(result.checkedAt)) > 60000 || !Number.isFinite(Date.parse(result.checkedAt))) throw new Error('Risposta locale non valida.');
    return;
  }
  const clients = profile.endpoints.map(makeClient), close = () => clients.forEach(c=>c.close());
  signal?.addEventListener('abort',close,{once:true});
  try {
    const tips = await Promise.all(clients.map(async c => {
      await c.verifyNetwork();
      const tip = await c.request('blockchain.headers.subscribe');
      if (!Number.isSafeInteger(tip?.height) || tip.height < 1 || !/^[a-f0-9]{160}$/.test(tip.hex)) throw new Error('Header non valido.');
      const bytes = Uint8Array.from(tip.hex.match(/../g), v=>parseInt(v,16));
      if (Math.abs(Date.now()/1000-new DataView(bytes.buffer).getUint32(68,true)) > 7200) throw new Error('Nodo non aggiornato.');
      for (const [method,params] of [['blockchain.estimatefee',[6]],['blockchain.relayfee',[]]]) {
        const rate = await c.request(method,params);
        if (typeof rate !== 'number' || !Number.isFinite(rate) || rate > 1 || (rate < 0 && !(method.endsWith('estimatefee') && rate === -1))) throw new Error('Commissioni non valide.');
      }
      return tip;
    }));
    if (signal?.aborted || tips[0].height !== tips[1].height || tips[0].hex !== tips[1].hex) throw new Error('Verifica annullata o server non concordi.');
  } finally { signal?.removeEventListener('abort',close); close(); }
}
