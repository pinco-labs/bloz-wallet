import { backupFilename } from './backup-name.js';
import { installPasswordChange, renderPasswordChange } from './password-change.js';
import { WalletSession, DEMO_STORAGE_KEY, MAINNET_OFFLINE_STORAGE_KEY } from './session.js';
import { MAX_BACKUP_BYTES, createBackupCodec } from './backup.js';
import { installLifecycle } from './lifecycle.js';
import { renderBackupPanel } from './backup-panel.js';

export function startOfflineWallet({ mainnetOffline = false } = {}) {
const storageKey = mainnetOffline ? MAINNET_OFFLINE_STORAGE_KEY : DEMO_STORAGE_KEY;
const $ = (id) => document.getElementById(id);
const codec = createBackupCodec(mainnetOffline ? 'bloz-mainnet-offline-wallet' : 'bloz-demo-wallet');
let wallet, lifecycle, busy = false, downloaded = false, restored = false, epoch = 0;
const message = (text, error = false) => { if (mainnetOffline) text = text.replaceAll('Demo', 'Prova mainnet offline').replaceAll('demo', 'prova mainnet offline').replaceAll('dimostrativo', 'di prova').replaceAll('dimostrativa', 'di prova'); $('message').textContent = text; $('message').classList.toggle('error', error); };
const clearPasswords = () => document.querySelectorAll('input[type=password]').forEach((input) => { input.value = ''; });
function render() {
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
  $('address').textContent = info?.address ?? '';
  $('address-placeholder').hidden = !!info;
  $('wallet-status').textContent = wallet.active ? (mainnetOffline ? 'Prova mainnet offline · nessun fondo' : 'Demo attiva · nessun fondo') : wallet.unlocked ? (wallet.canActivate ? 'Backup verificato · pronto per attivare' : 'Backup da verificare') : saved ? (mainnetOffline ? 'Prova mainnet offline bloccata' : 'Demo bloccata') : 'Crea una chiave di prova';
  $('activate').disabled = !wallet.canActivate;
  $('activate').hidden = !downloaded && !restored;
  $('forget').disabled = !$('forget-check').checked;
}
function lock(text = 'Demo bloccata. Sblocca la copia cifrata o recupera il file dimostrativo.') {
  epoch++; wallet.lock(); downloaded = false; clearPasswords(); render(); message(text);
}
async function run(action, feedbackId = null) {
  if (busy) return;
  const started = epoch; busy = true;
  if (feedbackId) $(feedbackId).textContent = '';
  document.querySelectorAll('button').forEach((button) => { button.disabled = true; });
  if (wallet.active) $('lock').disabled = false;
  if (wallet.unlocked && !wallet.active) $('cancel').disabled = false;
  try { await action(); } catch (error) {
    if (epoch === started) {
      const text = error.message || 'Operazione non riuscita.'; message(text, true);
      if (feedbackId) { $(feedbackId).textContent = text; $(feedbackId).classList.add('error'); $(feedbackId).scrollIntoView({ block: 'nearest' }); }
    }
  }
  finally {
    clearPasswords(); busy = false; lifecycle.activity();
    document.querySelectorAll('button').forEach((button) => { button.disabled = false; }); render();
  }
}
function download(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = backupFilename(text, mainnetOffline ? 'MAINNET-OFFLINE' : 'DEMO'); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function readBackup(id) {
  const started = epoch, file = $(id).files[0];
  if (!file || file.size > MAX_BACKUP_BYTES) throw new Error('Scegli un file dimostrativo di massimo 8 KiB.');
  const text = await file.text();
  if (started !== epoch || document.hidden) throw new Error('Lettura annullata dal blocco.');
  try { codec.parseBackup(text); } catch { throw new Error('Questa prova accetta solo i propri backup. File di altre modalità o reti non sono compatibili.'); }
  return text;
}
function onForm(id, action) { $(id).addEventListener('submit', (event) => { event.preventDefault(); run(action, id === 'verify-form' ? 'verify-feedback' : null); }); }

try {
  if (!window.isSecureContext || !crypto.subtle || !navigator.locks) throw new Error('Serve un browser aggiornato con HTTPS, oppure l’anteprima su 127.0.0.1.');
  wallet = new WalletSession(localStorage, { demo: !mainnetOffline, mainnetOffline });
  // Fail visibly if browser policy blocks storage; never fall back to plaintext.
  wallet.hasSaved;
  lifecycle = installLifecycle({ page: document, window, hasSession: () => wallet.unlocked, lock, render, storageKey });
  $('create').addEventListener('click', () => run(() => { wallet.create(); restored = false; downloaded = false; message('Chiave dimostrativa creata sul dispositivo. Non usarla per ricevere fondi.'); }));
  onForm('restore-form', async () => { const password = $('restore-password').value; await wallet.restore(await readBackup('restore-file'), password); restored = true; downloaded = false; message('Demo recuperata. Il tuo indirizzo è pronto per il confronto.'); });
  onForm('backup-form', async () => { if (downloaded) return; downloaded = false; const text = await wallet.prepareBackup($('backup-password').value, $('backup-confirm').value); download(text); downloaded = true; $('verify-file').value = ''; message('Seleziona il file dimostrativo scaricato e verifica la password.'); });
  onForm('verify-form', async () => { if (wallet.canActivate || wallet.active) return; const password = $('verify-password').value; await wallet.verifyBackup(await readBackup('verify-file'), password); $('verify-feedback').textContent = 'Backup verificato correttamente. Puoi completare l’attivazione.'; $('verify-feedback').classList.remove('error'); message('Backup verificato: stesso indirizzo dimostrativo. Puoi attivare la demo.'); });
  $('activate').addEventListener('click', () => run(async () => { await navigator.locks.request(storageKey, () => wallet.activate()); message('Demo attiva. È stata salvata soltanto la copia cifrata. Nessuna connessione alla blockchain.'); }));
  onForm('unlock-form', async () => { await wallet.unlock($('unlock-password').value); message('Demo sbloccata localmente.'); });
  $('lock').addEventListener('click', () => lock());
  $('cancel').addEventListener('click', () => lock('Sessione annullata. Per recuperarla serve il file dimostrativo già scaricato.'));
  for (const id of ['saved-download', 'active-saved-download']) $(id).addEventListener('click', () => run(() => { const text = localStorage.getItem(storageKey); codec.parseBackup(text); download(text); message('Copia cifrata dimostrativa scaricata. La password resta invariata.'); }));
  $('forget-check').addEventListener('change', render);
  $('forget').addEventListener('click', () => run(() => { if (!$('forget-check').checked) throw new Error('Conferma la rimozione della copia locale.'); wallet.forget(); epoch++; downloaded = false; $('forget-check').checked = false; message('Copia dimostrativa rimossa dal browser. Il file scaricato resta utilizzabile.'); }));
installPasswordChange({ wallet, $, run, download, readBackup, message });
  render(); message(wallet.hasSaved ? 'Demo bloccata. Usa la password per aprire la copia cifrata salvata in questo browser.' : 'Demo pronta. Crea una chiave nuova: non importare il tuo wallet reale.');
} catch (error) {
  document.querySelectorAll('button').forEach((button) => { button.disabled = true; });
  message(error.message || 'Browser non compatibile con la demo.', true);
}

}
