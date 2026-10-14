// Bounded WSS transport: generic requests are read-only. Broadcast has a
// separate signed-byte entry point; keys/passwords never belong in this API.
export const ELECTRUM_ENDPOINTS = Object.freeze([
  'wss://electrum-bloz.pinco-labs.com:50004/',
  'wss://electrum2-bloz.pinco-labs.com:50004/',
]);
const READ_METHODS = new Set(['server.version', 'server.features',
  'blockchain.headers.subscribe', 'blockchain.block.header',
  'blockchain.scripthash.get_balance', 'blockchain.scripthash.get_history',
  'blockchain.scripthash.listunspent', 'blockchain.scripthash.subscribe',
  'blockchain.transaction.get', 'blockchain.transaction.get_merkle',
  'blockchain.estimatefee', 'blockchain.relayfee']);
export const BLOZ_GENESIS = '44c1a8c852b3eda21966e1ddb6b0807e22488dffe8a270bf24bf1fa2d66c13bd';
export class ElectrumReadClient {
  #socket; #pending = new Map(); #id = 0; #ready = false; #connecting; #timeout;
  constructor(endpoint, { WebSocketClass = globalThis.WebSocket, timeoutMs = 15000, allowedEndpoints = ELECTRUM_ENDPOINTS } = {}) {
    if (!allowedEndpoints.includes(endpoint)) throw new Error('Endpoint Electrum non consentito.');
    this.#timeout = timeoutMs;
    this.#socket = new WebSocketClass(endpoint);
    this.#connecting = new Promise((resolve, reject) => {
      const timer = setTimeout(() => { reject(new Error('Connessione Electrum scaduta.')); this.close(); }, timeoutMs);
      this.#socket.onopen = () => { clearTimeout(timer); this.#ready = true; resolve(); };
      const fail = () => { clearTimeout(timer); reject(new Error('Electrum disconnesso.')); this.#fail(); };
      this.#socket.onerror = fail; this.#socket.onclose = fail;
    });
    // Connection errors may precede the first request.
    this.#connecting.catch(() => {});
    this.#socket.onmessage = ({ data }) => {
      try {
        if (typeof data !== 'string' || data.length > 1000000) throw new Error();
        const reply = JSON.parse(data);
        if (!reply || typeof reply !== 'object' || Array.isArray(reply)) throw new Error();
        if (reply.id === undefined && typeof reply.method === 'string') return;
        const pending = this.#pending.get(reply.id);
        if (!pending) throw new Error();
        this.#pending.delete(reply.id); clearTimeout(pending.timer);
        if (reply.error || !Object.hasOwn(reply, 'result')) pending.reject(new Error('Richiesta Electrum rifiutata.'));
        else pending.resolve(reply.result);
      } catch { this.close(); }
    };
  }
  #fail() {
    this.#ready = false;
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer); pending.reject(new Error('Electrum disconnesso o risposta non valida.'));
    }
    this.#pending.clear();
  }
  close() { this.#fail(); this.#socket.close(); }
  async request(method, params = []) {
    if (!READ_METHODS.has(method)) throw new Error('Solo letture Electrum consentite.');
    return this.#send(method, params);
  }
  async broadcastSigned(raw, txid) {
    if (typeof raw !== 'string' || raw.length > 2000 || !/^(?:[0-9a-f]{2})+$/.test(raw)
        || !/^[0-9a-f]{64}$/.test(txid)) throw new Error('Transazione firmata non valida.');
    await this.verifyNetwork();
    const result = await this.#send('blockchain.transaction.broadcast', [raw]);
    if (result !== txid) throw new Error('Esito incerto: controlla l’ID prima di riprovare.');
    return result;
  }
  async #send(method, params) {
    if (!Array.isArray(params) || JSON.stringify(params).length > 4096) throw new Error('Parametri non validi.');
    await this.#connecting;
    if (!this.#ready) throw new Error('Electrum disconnesso.');
    if (this.#pending.size >= 16) throw new Error('Troppe richieste Electrum.');
    const id = ++this.#id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.close(); }, this.#timeout);
      this.#pending.set(id, { resolve, reject, timer });
      try { this.#socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params })); }
      catch { this.close(); }
    });
  }
  async verifyNetwork() {
    const version = await this.request('server.version', ['Pinco-readonly-QA', '1.4']);
    const features = await this.request('server.features');
    if (!Array.isArray(version) || version[1] !== '1.4' || features?.genesis_hash !== BLOZ_GENESIS
        || features?.hash_function !== 'sha256') { this.close(); throw new Error('Rete Electrum non compatibile con BLOZ.'); }
    return features;
  }
}
