// Clock and event sources are injectable for deterministic inactivity tests.
export function installLifecycle({ page, window, hasSession, lock, render, storageKey,
  now = Date.now, every = setInterval, cancel = clearInterval }) {
  let lastActivity = now();
  const activity = () => { lastActivity = now(); };
  const checkIdle = () => {
    if (hasSession() && now() - lastActivity >= 300_000) lock('Blocco automatico dopo 5 minuti di inattività.');
  };
  const visibility = () => { if (page.hidden) lock('Pagina nascosta: sessione bloccata.'); else checkIdle(); };
  const hide = () => lock('Pagina chiusa: sessione bloccata.');
  const show = () => { checkIdle(); render(); };
  const storage = (event) => { if (event.key === storageKey || event.key === null) lock('Archivio modificato da un’altra scheda.'); };
  page.addEventListener('pointerdown', activity);
  page.addEventListener('keydown', activity);
  page.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  window.addEventListener('storage', storage);
  const timer = every(checkIdle, 1000);
  return { activity, dispose() {
    cancel(timer);
    page.removeEventListener('pointerdown', activity);
    page.removeEventListener('keydown', activity);
    page.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', hide);
    window.removeEventListener('pageshow', show);
    window.removeEventListener('storage', storage);
  } };
}
