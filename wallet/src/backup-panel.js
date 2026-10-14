// Presentation only: activation remains controlled by WalletSession verification.
export function renderBackupPanel({ restored, downloaded, unlocked }) {
  const section = document.getElementById('backup-section');
  const summary = document.getElementById('backup-summary');
  const mode = !unlocked ? 'idle' : downloaded ? 'downloaded' : restored ? 'restored' : 'new';
  if (section.dataset.mode !== mode) {
    section.open = mode === 'new';
    section.dataset.mode = mode;
  }
  summary.hidden = mode === 'new';
  section.hidden = mode === 'restored';
  summary.textContent = downloaded ? 'Backup scaricato · mostra dettagli' : 'Prepara il backup per completare l’attivazione';
  document.getElementById('restore-success').hidden = !restored || downloaded;
}
