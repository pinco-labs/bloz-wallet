// Shared by online and offline modes. Only encrypted containers are downloaded.
export function installPasswordChange({ wallet, $, run, download, readBackup, message }) {
  const feedback = (text) => { $('change-feedback').textContent = text; $('change-feedback').classList.remove('error'); message(text); };
  const form = (id, action) => $(id).addEventListener('submit', (event) => {
    event.preventDefault(); run(action, 'change-feedback');
  });
  form('change-password-form', async () => {
    if (wallet.replacementPending) return;
    const text = await wallet.prepareReplacement($('change-current').value, $('change-new').value, $('change-confirm').value);
    download(text); $('change-file').value = '';
    feedback('Nuovo file scaricato. La password nel browser non è ancora cambiata: seleziona il nuovo file e verificalo.');
  });
  form('change-verify-form', async () => {
    if (wallet.replacementVerified) return;
    const password = $('change-verify-password').value;
    await wallet.verifyReplacement(await readBackup('change-file'), password);
    feedback('Nuovo backup verificato. Premi Conferma cambio password per aggiornare la copia nel browser.');
  });
  $('change-commit').addEventListener('click', () => run(async () => {
    await navigator.locks.request(wallet.storageKey, () => wallet.commitReplacement());
    $('change-file').value = '';
    feedback('Password cambiata in questo browser. Il nuovo file usa la nuova password; i vecchi file continuano a usare quella vecchia.');
  }, 'change-feedback'));
  $('change-cancel').addEventListener('click', () => run(() => {
    wallet.cancelReplacement(); $('change-file').value = '';
    feedback('Cambio annullato: la copia nel browser e la sua password sono rimaste invariate. Il nuovo file eventualmente scaricato resta valido con la nuova password.');
  }, 'change-feedback'));
}

export function renderPasswordChange(wallet, $, busy) {
  $('change-prepare').disabled = busy || !wallet.active || wallet.replacementPending;
  $('change-verify-form').hidden = !wallet.replacementPending;
  $('change-verify').disabled = busy || !wallet.replacementPending || wallet.replacementVerified;
  $('change-commit').hidden = !wallet.replacementPending;
  $('change-commit').disabled = busy || !wallet.replacementVerified;
  $('change-cancel').hidden = !wallet.replacementPending;
  if (!wallet.active) {
    $('change-details').open = false;
    $('change-feedback').textContent = '';
    $('change-file').value = '';
  }
}
