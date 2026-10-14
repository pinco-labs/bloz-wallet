import { generateKey, createKeyCodec } from './keys.js';
import { createBackupCodec } from './backup.js';

export const STORAGE_KEY = 'bloz.regtest.wallet.v1';
export const DEMO_STORAGE_KEY = 'bloz.demo.wallet.v1';
export const MAINNET_OFFLINE_STORAGE_KEY = 'bloz.mainnet.offline.wallet.v1';
export const MAINNET_STORAGE_KEY = 'bloz.mainnet.wallet.v1';

// Activation is enforced here, independently of button visibility.
export class WalletSession {
  #key = null;
  #epoch = 0;
  #backup = null;
  #verified = false;
  #replacement = null;
  get replacementPending() { return this.#replacement !== null; }
  get replacementVerified() { return this.#replacement?.verified === true; }
  #demo;
  #codec;
  #keys;
  #mainnetOffline;
  #mainnet;
  constructor(storage, { demo = false, mainnetOffline = false, mainnet = false } = {}) {
    if ([demo, mainnetOffline, mainnet].filter(Boolean).length > 1) throw new Error('Modalità incompatibili.');
    this.storage = storage; this.active = false; this.#demo = demo;
    this.#mainnetOffline = mainnetOffline;
    this.#mainnet = mainnet;
    this.#keys = createKeyCodec(mainnetOffline || mainnet ? 'bloz-mainnet' : 'bloz-regtest');
    this.#codec = createBackupCodec(mainnet ? 'bloz-mainnet-wallet' : mainnetOffline ? 'bloz-mainnet-offline-wallet' : demo ? 'bloz-demo-wallet' : 'bloz-local-wallet');
  }
  get storageKey() { return this.#mainnet ? MAINNET_STORAGE_KEY : this.#mainnetOffline ? MAINNET_OFFLINE_STORAGE_KEY : this.#demo ? DEMO_STORAGE_KEY : STORAGE_KEY; }
  get unlocked() { return this.#key !== null; }
  get info() { return this.#key ? this.#keys.identity(this.#key) : null; }
  get canActivate() { return this.#verified && this.#key !== null && !this.active; }
  get hasSaved() { return this.storage.getItem(this.storageKey) !== null; }
  lock() { this.#epoch++; this.#replacement = null; this.#key?.fill(0); this.#key = null; this.#backup = null; this.#verified = false; this.active = false; }
  cancelReplacement() { this.#epoch++; this.#replacement = null; }
  async prepareReplacement(currentPassword, password, confirmation) {
    if (!this.active || !this.#key) throw new Error('Sbloccare prima il wallet.');
    this.cancelReplacement();
    if (password !== confirmation) throw new Error('Le nuove password non coincidono.');
    if (password === currentPassword) throw new Error('La nuova password deve essere diversa. Per una copia invariata usa Scarica copia.');
    const epoch = this.#epoch, previous = this.storage.getItem(this.storageKey);
    const key = await this.#codec.decryptBackup(previous, currentPassword);
    try {
      if (epoch !== this.#epoch || !this.active || this.#keys.identity(key).address !== this.info.address) throw new Error('Wallet modificato o bloccato.');
      const backup = await this.#codec.encryptBackup(key, password);
      if (epoch !== this.#epoch || previous !== this.storage.getItem(this.storageKey)) throw new Error('Wallet modificato o bloccato.');
      this.#replacement = { previous, backup, verified: false };
      return backup;
    } finally { key.fill(0); }
  }
  async verifyReplacement(text, password) {
    const pending = this.#replacement, epoch = this.#epoch;
    if (!pending || !this.active) throw new Error('Scaricare prima il nuovo backup.');
    pending.verified = false;
    this.#codec.parseBackup(text);
    if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(JSON.parse(pending.backup))) throw new Error('Selezionare il nuovo file appena scaricato.');
    const key = await this.#codec.decryptBackup(text, password);
    try {
      if (epoch !== this.#epoch || pending !== this.#replacement || !this.active || pending.previous !== this.storage.getItem(this.storageKey)) throw new Error('Wallet modificato o bloccato.');
      if (this.#keys.identity(key).address !== this.info.address) throw new Error('Il backup ricostruisce un indirizzo diverso.');
      pending.verified = true;
    } finally { key.fill(0); }
  }
  commitReplacement() {
    const pending = this.#replacement;
    if (!this.active || !pending?.verified) throw new Error('Verificare prima il nuovo backup.');
    if (pending.previous !== this.storage.getItem(this.storageKey)) throw new Error('Un’altra scheda ha modificato il wallet. Ricaricare.');
    this.storage.setItem(this.storageKey, pending.backup);
    this.cancelReplacement();
  }
  create(wif) {
    if ((this.#demo || this.#mainnetOffline || this.#mainnet) && wif !== undefined) throw new Error('Questa prova non importa chiavi esterne.');
    if (this.hasSaved) throw new Error('Esiste già un wallet locale. Rimuoverlo esplicitamente prima di sostituirlo.');
    this.lock();
    this.#key = wif === undefined ? generateKey() : this.#keys.importWif(wif);
    return this.info;
  }
  async restore(text, password) {
    if (this.hasSaved) throw new Error('Esiste già un wallet locale. Rimuoverlo esplicitamente prima di sostituirlo.');
    this.lock(); const epoch = this.#epoch;
    const key = await this.#codec.decryptBackup(text, password);
    if (epoch !== this.#epoch || this.hasSaved) { key.fill(0); throw new Error('Operazione annullata dal blocco o da un altro wallet salvato.'); }
    this.#key = key;
    // Successful authenticated decryption already proves recovery from this file.
    // Persist this same encrypted container only when the user activates it.
    this.#backup = text;
    this.#verified = true;
    return this.info;
  }
  async prepareBackup(password, confirmation) {
    if (!this.#key || this.active) throw new Error('Creare o ripristinare prima un wallet.');
    this.#epoch++; this.#verified = false; this.#backup = null;
    if (password !== confirmation) throw new Error('Le password non coincidono.');
    const epoch = this.#epoch;
    const key = this.#key.slice();
    try {
      const backup = await this.#codec.encryptBackup(key, password);
      if (epoch !== this.#epoch) throw new Error('Operazione annullata dal blocco.');
      this.#backup = backup;
      return backup;
    } finally { key.fill(0); }
  }
  async verifyBackup(text, password) {
    this.#epoch++; this.#verified = false;
    if (!this.#key || !this.#backup || this.active) throw new Error('Scaricare prima il backup.');
    const epoch = this.#epoch;
    // Require the actual prepared container, not merely another backup of the key.
    this.#codec.parseBackup(text);
    if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(JSON.parse(this.#backup))) throw new Error('Selezionare il file appena scaricato.');
    const restored = await this.#codec.decryptBackup(text, password);
    try {
      if (epoch !== this.#epoch || !this.#key) throw new Error('Operazione annullata dal blocco.');
      if (this.#keys.identity(restored).address !== this.info.address) throw new Error('Il backup ricostruisce un indirizzo diverso.');
      this.#verified = true;
      return this.info;
    } finally { restored.fill(0); }
  }
  async checkBackupCopy(text, password) {
    if (!this.active || !this.#key) throw new Error('Sbloccare prima il wallet.');
    const epoch = this.#epoch, address = this.info.address;
    const saved = this.storage.getItem(this.storageKey);
    const key = await this.#codec.decryptBackup(text, password);
    try {
      if (epoch !== this.#epoch || !this.active || saved !== this.storage.getItem(this.storageKey)) throw new Error('Wallet modificato o bloccato: ripetere la verifica.');
      return { matches: this.#keys.identity(key).address === address };
    } finally { key.fill(0); }
  }
  activate() {
    if (!this.canActivate || !this.#backup) throw new Error('Verificare il backup prima dell’attivazione.');
    if (this.hasSaved) throw new Error('Un’altra scheda ha salvato un wallet. Ricaricare.');
    this.storage.setItem(this.storageKey, this.#backup);
    this.active = true; this.#verified = false; this.#backup = null;
  }
  async unlock(password) {
    this.lock(); const epoch = this.#epoch;
    const text = this.storage.getItem(this.storageKey);
    if (!text) throw new Error('Nessun wallet salvato.');
    const key = await this.#codec.decryptBackup(text, password);
    if (epoch !== this.#epoch || text !== this.storage.getItem(this.storageKey)) { key.fill(0); throw new Error('Wallet modificato o bloccato.'); }
    this.#key = key; this.active = true;
    return this.info;
  }
  withKey(fn) {
    if (this.#demo || this.#mainnetOffline) throw new Error('Firma ed esportazione di chiavi non disponibili in questa prova.');
    if (!this.#key || !this.active) throw new Error('Sbloccare un wallet attivo.');
    const key = this.#key.slice();
    try { return fn(key); } finally { key.fill(0); }
  }
  async revealRecovery(password) {
    if (this.#demo || this.#mainnetOffline || !this.active) throw new Error('Sbloccare un wallet attivo.');
    const epoch = this.#epoch, saved = this.storage.getItem(this.storageKey);
    const key = await this.#codec.decryptBackup(saved, password);
    try {
      if (epoch !== this.#epoch || !this.active || saved !== this.storage.getItem(this.storageKey) || this.#keys.identity(key).address !== this.info.address) throw new Error('Wallet modificato o bloccato.');
      return { wif:this.#keys.exportWif(key), descriptor:this.#keys.recoveryDescriptor(key) };
    } finally {key.fill(0);}
  }
  forget() { this.lock(); this.storage.removeItem(this.storageKey); }
}
