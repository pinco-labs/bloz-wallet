export function renderHistory(list, { local = false, history = null } = {}, create = tag => document.createElement(tag)) {
  list.replaceChildren();
  const line = text => { const item = create('li'); item.textContent = text; list.append(item); };
  if (local) {
    line('Storico completo non disponibile con il collegamento RPC locale. Il saldo e gli accrediti non spesi restano consultabili. Per lo storico puoi scegliere Electrum: le richieste saranno inviate ai server selezionati.');
  } else if (history === null) {
    line('Aggiorna il saldo per caricare lo storico.');
  } else if (!history.length) {
    line('Nessuna transazione trovata per questo indirizzo.');
  } else {
    for (const tx of history.slice().reverse()) line(`${tx.txid} · ${tx.confirmations} conferme`);
  }
}
