import { installLanguage } from './language.js';
import { installConnections } from './connection-ui.js';
import { allowedWalletOrigin } from './origin-policy.js';
import { renderHistory } from './history-view.js';
import { backupFilename } from './backup-name.js';
import { installPasswordChange, renderPasswordChange } from './password-change.js';
import { WalletSession, STORAGE_KEY as REGTEST_STORAGE_KEY, MAINNET_STORAGE_KEY } from './session.js';
import { createKeyCodec } from './keys.js';
import { MAX_BACKUP_BYTES } from './backup.js';
import { installLifecycle } from './lifecycle.js';
import { renderBackupPanel } from './backup-panel.js';
import { fetchBalance } from './receive.js';
import { formatBloz } from './money.js';
import { prepareSend, signSend, fetchCoins, broadcast } from './send.js';
import { agreedSnapshot, electrumFees, electrumBroadcast } from './electrum-wallet.js';

const $ = (id) => document.getElementById(id);
const mainnet = typeof __BLOZ_MAINNET__ !== 'undefined' && __BLOZ_MAINNET__;
if (mainnet) installLanguage();
const electrum = typeof __BLOZ_ELECTRUM__ !== 'undefined' && __BLOZ_ELECTRUM__;
const network = mainnet ? 'bloz-mainnet' : 'bloz-regtest';
const STORAGE_KEY = mainnet ? MAINNET_STORAGE_KEY : REGTEST_STORAGE_KEY;
const recoveryDescriptor = createKeyCodec(network).recoveryDescriptor;
const amount = (rex) => formatBloz(rex) + (mainnet ? ' BLOZ' : ' BLOZ test');
const wallet = new WalletSession(localStorage, { mainnet });
let busy = false, downloaded = false, restored = false, uiEpoch = 0;
let balanceRequest = null, balanceTime = 0, balanceAttempt = 0;
let sendPlan = null, sendController = null;
function renderSendForm() {
  $('send-prepare').disabled = busy || !wallet.active || !$('send-to').value.trim()
    || !$('send-amount').value.trim() || (!mainnet && !$('send-fee').value.trim());
}
function clearSend() { sendPlan = null; sendController?.abort(); sendController = null; $('send-review').hidden = true; $('send-summary').textContent = ''; }
function clearBalance() {
  balanceRequest?.abort(); balanceRequest = null; balanceTime = 0;
  for (const id of ['available-balance', 'confirmed-balance', 'immature-balance', 'pending-balance', 'reserved-balance']) $(id).textContent = '—';
  $('utxo-list').replaceChildren(); $('utxo-summary').textContent = 'Aggiorna il saldo per consultarli.';
  if (electrum) renderHistory($('history-list'), { local: connections.local });
  $('balance-status').textContent = 'Saldo non ancora letto.';
}
const message = (text, error = false) => { $('message').textContent = mainnet ? text.replaceAll('di test', 'mainnet').replaceAll('regtest', 'mainnet') : text; $('message').classList.toggle('error', error); };
const clearSecrets = () => {
  document.querySelectorAll('input[type=password]').forEach((input) => { input.value = ''; });
  $('recovery').value = ''; $('recovery-details').open = false;
  $('recovery-wif').value = '';
};
function render() {
  if (electrum && !balanceTime) renderHistory($('history-list'), { local: connections.local });
  renderPasswordChange(wallet, $, busy);
  renderBackupPanel({ restored, downloaded, unlocked: wallet.unlocked });
  const saved = wallet.hasSaved, info = wallet.info;
  $('start-panel').hidden = saved || wallet.unlocked;
  $('setup-panel').hidden = !wallet.unlocked || wallet.active;
  $('locked-panel').hidden = !saved || wallet.unlocked;
  $('active-panel').hidden = !wallet.active;
  $('forget-panel').hidden = !saved;
  $('verify-panel').hidden = !downloaded;
  if (!downloaded) $('verify-feedback').textContent = '';
  $('backup-download').disabled = downloaded || busy;
  $('verify-backup').disabled = busy || wallet.canActivate || wallet.active;
  $('check-copy-button').disabled = busy || !wallet.active;
  $('address').textContent = info?.address ?? '';
  $('address-placeholder').hidden = !!info;
  $('wallet-status').textContent = wallet.active ? (mainnet ? 'Mainnet · prova privata' : 'Attivo · solo test') : wallet.unlocked ? (wallet.canActivate ? 'Backup verificato · pronto per attivare' : 'In attesa di backup verificato') : saved ? 'Bloccato' : 'Nessun wallet aperto';
  $('activate').disabled = !wallet.canActivate;
  $('activate').hidden = !downloaded && !restored;
  $('forget').disabled = !$('forget-check').checked;
  $('refresh-balance').disabled = busy || !!balanceRequest || !wallet.active;
  renderSendForm();
}
function lock(text = 'Sessione bloccata. Se non era ancora attiva, ripristinala dal backup scaricato.') {
  $('check-copy-feedback').textContent = ''; $('check-copy-file').value = '';
  uiEpoch++; wallet.lock(); downloaded = false; clearSend(); clearBalance(); clearSecrets(); render(); message(text);
}
async function run(action, feedbackId = null) {
  if (busy) return;
  const epoch = uiEpoch;
  if (feedbackId) $(feedbackId).textContent = '';
  busy = true; document.querySelectorAll('button').forEach((button) => { button.disabled = true; });
  // Blocking remains available during a slow RPC or password derivation.
  if (wallet.active) $('lock').disabled = false;
  if (wallet.unlocked && !wallet.active) $('cancel').disabled = false;
  try { await action(); } catch (error) {
    if (epoch === uiEpoch) {
      const text = error.name === 'AbortError' ? 'Operazione interrotta o scaduta. Controlla l’esito prima di riprovare.' : error.message || 'Operazione non riuscita.';
      message(text, true);
      if (feedbackId) { $(feedbackId).textContent = text; $(feedbackId).classList.add('error'); $(feedbackId).scrollIntoView({ block: 'nearest' }); }
    }
  }
  finally {
    clearSecrets(); busy = false; lifecycle.activity();
    document.querySelectorAll('button').forEach((button) => { button.disabled = false; }); render();
  }
}
function download(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = backupFilename(text, mainnet ? 'MAINNET' : 'regtest'); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function readBackup(id) {
  const epoch = uiEpoch;
  const file = $(id).files[0];
  if (!file || file.size > MAX_BACKUP_BYTES) throw new Error('Seleziona un backup JSON di massimo 8 KiB.');
  const text = await file.text();
  if (epoch !== uiEpoch || document.hidden) throw new Error('Lettura annullata: pagina bloccata o nascosta.');
  return text;
}
function onForm(id, action) { $(id).addEventListener('submit', (event) => { event.preventDefault(); run(action, id === 'verify-form' ? 'verify-feedback' : id === 'send-form' ? 'send-result' : null); }); }
installPasswordChange({ wallet, $, run, download, readBackup, message });
$('check-copy-form').addEventListener('submit', event => {
  event.preventDefault();
  run(async () => {
    const password = $('check-copy-password').value;
    const result = await wallet.checkBackupCopy(await readBackup('check-copy-file'), password);
    $('check-copy-feedback').textContent = result.matches
      ? 'Backup valido: password corretta e stesso indirizzo del wallet aperto. Nessun dato è stato modificato.'
      : 'Il file è valido con questa password, ma appartiene a un altro indirizzo. Non è il backup del wallet aperto.';
    $('check-copy-feedback').classList.toggle('error', !result.matches);
  }, 'check-copy-feedback');
});
for (const id of ['check-copy-file', 'check-copy-password']) $(id).addEventListener('input', () => { $('check-copy-feedback').textContent = ''; });
$('create').addEventListener('click', () => run(() => { wallet.create(); restored = false; downloaded = false; message('Chiave creata localmente. Ora prepara il backup.'); }));
onForm('wif-form', () => { wallet.create($('wif').value.trim()); restored = false; downloaded = false; message('Chiave di test importata come SegWit. Prepara il backup.'); });
onForm('restore-form', async () => {
  const password = $('restore-password').value;
  await wallet.restore(await readBackup('restore-file'), password); restored = true; downloaded = false;
  message('File recuperato e verificato. Puoi attivare il wallet senza un nuovo backup.');
});
onForm('backup-form', async () => {
  if (downloaded) return;
  downloaded = false;
  const text = await wallet.prepareBackup($('backup-password').value, $('backup-confirm').value);
  download(text); downloaded = true; $('verify-file').value = '';
  message('Download richiesto. Seleziona il file salvato e reinserisci la password per verificarlo.');
});
onForm('verify-form', async () => {
  if (wallet.canActivate || wallet.active) return;
  const password = $('verify-password').value;
  await wallet.verifyBackup(await readBackup('verify-file'), password);
  $('verify-feedback').textContent = 'Backup verificato correttamente. Puoi attivare il wallet.';
  $('verify-feedback').classList.remove('error');
  message('Backup verificato: password corretta e stesso indirizzo SegWit. Puoi attivare il wallet di test.');
});
$('activate').addEventListener('click', () => run(async () => {
  // Same-origin Web Lock makes the storage check + write atomic across tabs.
  await navigator.locks.request(STORAGE_KEY, () => wallet.activate());
  message('Wallet di test attivo. Nel browser è salvata solo la copia cifrata.');
}));
onForm('unlock-form', async () => { await wallet.unlock($('unlock-password').value); message('Wallet sbloccato sul dispositivo.'); });
$('cancel').addEventListener('click', () => lock('Sessione cancellata. Nessuna chiave non cifrata è stata salvata nel browser.'));
$('lock').addEventListener('click', () => lock());
for (const id of ['saved-download', 'active-saved-download']) $(id).addEventListener('click', () => run(() => {
  const text = localStorage.getItem(STORAGE_KEY); if (!text) throw new Error('Backup locale non presente.'); download(text); message('Copia cifrata scaricata. La password resta invariata.');
}));
$('recovery-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  const epoch = uiEpoch;
  let result;
  await run(async () => { result = await wallet.revealRecovery($('recovery-password').value); });
  if (result && epoch === uiEpoch && wallet.active && !document.hidden) {
    $('recovery-details').open = true;
    $('recovery').value = result.descriptor; $('recovery-wif').value = result.wif;
    message('Dati privati visibili. Chi li possiede può spendere i fondi: non condividerli.');
  }
});
$('recovery-details').addEventListener('toggle', () => { if (!$('recovery-details').open) { $('recovery').value = ''; $('recovery-wif').value = ''; } });
$('forget-check').addEventListener('change', render);
$('forget').addEventListener('click', () => run(() => {
  if (!$('forget-check').checked) throw new Error('Conferma la rimozione della copia locale.');
  uiEpoch++; wallet.forget(); clearSend(); clearBalance(); downloaded = false; $('forget-check').checked = false; message('Copia locale rimossa. Conserva il file esterno e la password.');
}));
$('copy-address').addEventListener('click', async () => {
  if (!wallet.active) return;
  try { await navigator.clipboard.writeText(wallet.info.address); message('Indirizzo pubblico di test copiato.'); }
  catch { message('Seleziona e copia l’indirizzo mostrato a destra.', true); }
});
async function refreshBalance() {
  if (electrum && !connections.ready) return;
  if (!wallet.active || document.hidden || busy || sendPlan || sendController || balanceRequest) return;
  balanceAttempt = Date.now();
  const epoch = uiEpoch, address = wallet.info.address;
  const controller = new AbortController(); balanceRequest = controller;
  $('refresh-balance').disabled = true;
  $('balance-status').textContent = electrum && !connections.local ? 'Confronto dei due server Electrum…' : mainnet ? 'Lettura del nodo mainnet locale…' : 'Lettura del nodo regtest locale…';
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const snapshot = electrum && !connections.local ? await agreedSnapshot(address, controller.signal, connections.makeClient, connections.endpoints) : null;
    const data = snapshot ? snapshot.summary : await fetchBalance(address, controller.signal, network);
    if (epoch !== uiEpoch || !wallet.active || balanceRequest !== controller) return;
    for (const [id, field] of [['available-balance','availableRex'], ['confirmed-balance','confirmedRex'], ['immature-balance','immatureRex'], ['pending-balance','pendingIncomingRex'], ['reserved-balance','pendingSpentRex']]) $(id).textContent = amount(data[field]);
    balanceTime = Date.now();
    if (electrum) {
      renderHistory($('history-list'), { local: connections.local, history: snapshot?.history ?? null });
    }
    $('balance-status').textContent = `${mainnet ? 'Mainnet' : 'Regtest isolata'} · blocco ${data.height} · aggiornato alle ${new Date(data.checkedAt).toLocaleTimeString('it-IT')}`;
    $('utxo-summary').textContent = data.utxoCount ? `${data.utxoCount} output non spesi${data.truncated ? ' · mostrati i 25 più recenti' : ''}.` : 'Nessun accredito non speso a questo indirizzo.';
    $('utxo-list').replaceChildren();
    const labels = { confirmed: 'Confermato', immature: 'Ricompensa immatura', reserved: 'Impegnato in mempool', pending: 'In attesa di conferma' };
    for (const row of data.utxos) {
      const li = document.createElement('li'), value = document.createElement('strong'), status = document.createElement('p'), tx = document.createElement('code');
      value.textContent = amount(row.amountRex);
      status.textContent = `${labels[row.status]} · ${row.confirmations} conferme${row.blocksToMaturity ? ` · ancora ${row.blocksToMaturity} blocchi` : ''}`;
      tx.textContent = `${row.txid}:${row.vout}`; li.append(value, status, tx); $('utxo-list').append(li);
    }
  } catch (error) {
    if (epoch === uiEpoch && wallet.active && balanceRequest === controller) {
      const text = controller.signal.aborted ? 'Lettura scaduta. Saldo non disponibile: riprova.' : error.message;
      clearBalance(); $('balance-status').textContent = text;
    }
  } finally {
    clearTimeout(timeout); if (balanceRequest === controller) balanceRequest = null;
    $('refresh-balance').disabled = busy || !!balanceRequest || !wallet.active;
  }
}
$('refresh-balance').addEventListener('click', refreshBalance);
onForm('send-form', async () => {
  if (electrum && !connections.ready) throw new Error('Connessione non pronta.');
  clearSend();
  if (balanceRequest) clearBalance();
  if (!wallet.active) throw new Error('Sblocca il wallet.');
  const epoch = uiEpoch, from = wallet.info.address;
  const values = { network, from, to: $('send-to').value.trim(), amount: $('send-amount').value.trim(), fee: $('send-fee').value.trim() };
  const controller = new AbortController(); sendController = controller;
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    if (mainnet) {
      let fees;
      if (electrum && !connections.local) fees = await electrumFees(controller.signal, connections.makeClient, connections.endpoints);
      else {
        const response = await fetch('/api/mainnet/fees', { signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error' });
        if (!response.ok) throw new Error('Commissione non disponibile. Riprova quando il nodo è sincronizzato.');
        fees = await response.json();
      }
      if (fees.network !== network || !/^\d{1,6}$/.test(fees.feeRex) || BigInt(fees.feeRex) < 200n || BigInt(fees.feeRex) > 100000n
          || !Number.isFinite(Date.parse(fees.checkedAt)) || Math.abs(Date.now() - Date.parse(fees.checkedAt)) > 60_000) throw new Error('Stima commissione non valida.');
      values.fee = formatBloz(fees.feeRex); $('send-fee').value = values.fee;
      $('fee-note').textContent = fees.source === 'node-estimate'
        ? 'Commissione basata sulla stima del nodo e sui minimi di relay, per un invio SegWit con un accredito e resto.'
        : 'Stima storica non disponibile: commissione basata sui minimi attuali del nodo. Non garantisce un tempo di conferma.';
    }
    const coins = electrum && !connections.local ? (await agreedSnapshot(from, controller.signal, connections.makeClient, connections.endpoints)).coins : await fetchCoins(from, controller.signal, network);
    if (epoch !== uiEpoch || !wallet.active || controller.signal.aborted || document.hidden) throw new Error('Preparazione annullata.');
    sendPlan = prepareSend({ ...values, coins });
    $('send-result').textContent = ''; $('send-result').classList.remove('error');
    $('send-summary').textContent = `Destinatario: ${sendPlan.to} · Importo: ${amount(sendPlan.value)} · Commissione: ${amount(sendPlan.cost)} · Totale addebitato: ${amount(sendPlan.value + sendPlan.cost)} · Resto al tuo indirizzo: ${amount(sendPlan.change)}.`;
    $('send-review').hidden = false; message('Controlla destinatario, importo e commissione prima di confermare.');
  } finally { clearTimeout(timer); if (sendController === controller) sendController = null; }
});
$('send-form').addEventListener('input', () => { clearSend(); renderSendForm(); });
$('send-cancel').addEventListener('click', clearSend);
$('send-confirm').addEventListener('click', () => run(async () => {
  const plan = sendPlan;
  if (!plan || document.hidden) throw new Error('Prepara un nuovo riepilogo.');
  // Signing is synchronous; session.withKey wipes its temporary private-key copy afterwards.
  const signed = wallet.withKey((key) => signSend(plan, key));
  clearSend(); clearBalance();
  $('send-result').textContent = `Invio in corso. ID: ${signed.txid}. In caso di errore controlla il saldo prima di ripetere.`;
  const controller = new AbortController(); sendController = controller;
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    if (electrum && !connections.local) await electrumBroadcast(signed, controller.signal, connections.makeClient, connections.endpoints);
    else await broadcast(signed, controller.signal, network);
    $('send-to').value = ''; $('send-amount').value = '';
    if (mainnet) {
      $('send-fee').value = '';
      $('fee-note').textContent = 'La commissione viene calcolata dal nodo preparando il riepilogo; non viene inviata alcuna transazione in questo passaggio.';
    }
    renderSendForm();
    $('send-result').classList.remove('error');
    $('send-result').textContent = `Accettata in mempool: ${signed.txid}. Aggiorna il saldo e attendi una conferma in un blocco.`;
  }
  finally { clearTimeout(timer); if (sendController === controller) sendController = null; }
}));
setInterval(() => {
  if (sendPlan && Date.now() >= sendPlan.expires) { clearSend(); message('Riepilogo scaduto. Preparalo nuovamente.'); }
  if (balanceTime && Date.now() - balanceTime > 60_000) {
    clearBalance(); $('balance-status').textContent = 'Dati scaduti: aggiorna il saldo locale.';
  }
  // Polling must not count as user activity or postpone the idle lock.
  if (Date.now() - balanceAttempt >= 30_000) void refreshBalance();
}, 1000);
const connections = electrum ? installConnections({ $, run, reset: () => { clearSend(); clearBalance(); }, blocked: () => !!sendController || !!sendPlan }) : null;
const lifecycle = installLifecycle({ page: document, window, hasSession: () => wallet.unlocked, lock, render, storageKey: STORAGE_KEY });
if (!window.isSecureContext || !crypto.subtle || !navigator.locks || !allowedWalletOrigin(location, typeof __BLOZ_PUBLIC_ORIGIN__ === 'undefined' ? '' : __BLOZ_PUBLIC_ORIGIN__)) {
  document.querySelectorAll('button').forEach((button) => { button.disabled = true; });
  message('Origine non autorizzata o browser non compatibile. Apri il wallet dal suo indirizzo previsto.', true);
} else { render(); message('Pronto. Tutte le operazioni del wallet avvengono nel browser.'); }
