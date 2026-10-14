# Verifica della distribuzione per revisione — 14 ottobre 2026

Revisione interna Pinco Labs, non audit indipendente.

- Sito: https://wallet-bloz.pinco-labs.com/
- Commit sorgente esatto: 793bc4a7abc6fe53f87b4281031205cb9efc115a.
- Artefatto: 5d2cbe8ba536b8f21f55b7101b07e8396da12f20c6bbaa861fb7ec94de85a5f4.
- Il link sorgente nel sito punta al commit sopra, non al branch mobile.

## Superato

66 test nel pacchetto isolato; npm ci con zero vulnerabilità note riportate.
Integrità e controlli statici del pacchetto pubblico superati. Il controllo
finale HTTPS confronta byte per byte HTML, JavaScript, CSS, connections.json e
LICENSES.txt con il manifest; tutti corrispondono. Redirect HTTP 301 verso
HTTPS; file sensibili e sorgenti non distribuiti restituiscono 404.
CSP, no-store/no-transform, nosniff, referrer policy, HSTS, frame protection,
COOP, permissions policy e X-Robots-Tag presenti. Nessun Set-Cookie, NEL o
Report-To nelle risposte esaminate. Non prova assenza di cookie condizionali.

Risolti durante la preparazione: inizializzazione del collegamento al commit
nel build pubblico; trasformazione automatica dell'email da Cloudflare,
impedita con Cache-Control no-transform. HTML ora identico all'artefatto.

Browser integrato: pagina inizializzata, creazione locale di chiave usa e
getta riuscita. Dopo inattività il wallet torna bloccato. Nessun backup o
chiave dell'utente letto; nessun invio mainnet.

## Da completare prima dell'annuncio

Il tentativo automatico di download del backup nel browser integrato è
terminato per timeout dell'automazione; il ciclo download/rilettura della
release HTTPS NON è attestato. Va verificato in Chrome con chiave usa e getta,
insieme a ripristino, corrispondenza indirizzo e verifica autonoma delle copie.
Le funzioni crittografiche e i flussi sono coperti dalla suite locale, che non
sostituisce questo controllo end-to-end sul dominio definitivo.

Nessun link wallet aggiunto all'explorer, nessun annuncio. Noindex è una
richiesta ai motori, non autenticazione: sito e repository sono accessibili.
Testi legali restano in revisione; nessuna attestazione di conformità legale.
Guida completa per un proprio Electrum rimandata a una fase successiva.

## Aggiornamento avviso connessione

Aggiunto un avviso immediatamente sopra il menu della versione pubblica:
Core RPC e server Electrum personali sono disponibili nella copia locale.
Commit applicativo corrente: a98a7839e852dd9e78fadb5bb7a33a238df52a8e.
Artefatto corrente: 40ba892007db8262f59d5f077cfa448dd8b252eb6e2c51a746249ba8ca9df940.
Controlli statici e confronto hash HTTPS ripetuti e superati. Nessuna modifica
alla logica del wallet; restano validi i limiti del collaudo browser sopra.

## Chiusura della revisione tecnica interna

Riesame del 14 ottobre 2026 sul commit applicativo
`a98a7839e852dd9e78fadb5bb7a33a238df52a8e` e sull'artefatto
`40ba892007db8262f59d5f077cfa448dd8b252eb6e2c51a746249ba8ca9df940`.
I file sorgente del workspace sottoposto ai test coincidono con quelli
nel pacchetto isolato pubblicato (confronto SHA-256).

Riletti i flussi di sessione e blocco, cifratura e verifica dei backup,
cambio password, recupero chiave, firma e invio, validazione Electrum,
selezione connessioni, server loopback e bridge RPC. Non sono emerse nuove
vulnerabilità confermate in questo riesame. Non equivale a una prova di
assenza di vulnerabilità né a un audit indipendente.

Ripetuti: cinque build e 66 test, tutti superati. Il primo tentativo dei
test HTTP è stato impedito dalla sandbox (EACCES su loopback); la ripetizione
con accesso al loopback ha superato tutti i test. npm audit riporta zero
vulnerabilità note alla data della verifica, senza attestare la sicurezza
intrinseca delle dipendenze. Nessuna transazione mainnet effettuata.

Ripetuto anche il confronto HTTPS dei cinque file distribuiti: tutti
corrispondono al manifest. Redirect 301, percorsi non pubblici 404,
nessun Set-Cookie o NEL osservato. Evidenza aggiornata in
`https-review-evidence.json`. Nessun link wallet nell'explorer.

La parte di riesame del codice e verifica tecnica della distribuzione è
conclusa per questa versione. Resta aperta l'accettazione end-to-end in
Chrome sul dominio pubblico: creazione con chiave usa e getta, download e
rilettura del backup, blocco/ripristino e verifica autonoma della copia.
Il precedente timeout dell'automazione non consente di attestare questo
passaggio. Nessun via libera definitivo all'annuncio finché questo controllo
e la revisione dell'utente non sono conclusi. Restano validi gli altri limiti
elencati nel rapporto interno e in questo documento.

## Esiti del collaudo manuale Chrome

Il controllo manuale dei backup precedentemente indicato come aperto è
completato. Esiti osservati tramite schermate del collaudo, distinti dai test
automatici; nessuna attestazione di audit indipendente.

- Creazione, download JSON, verifica e attivazione riusciti.
- Ripristino da JSON riuscito con indirizzo corrispondente, senza obbligo
  di creare un ulteriore backup.
- Caricamento di saldo e storico dopo il ripristino riuscito.
- Verifica autonoma: copia corretta riconosciuta con indirizzo corrispondente.
- Copia valida di un altro wallet: segnalata come indirizzo diverso.
- Password errata: verifica rifiutata con il messaggio previsto.

Nessun nuovo difetto emerso da queste prove. Via libera tecnico alla versione
sperimentale esaminata, nei limiti documentati della revisione interna.
Collegamento dall'explorer e annuncio restano in attesa dell'approvazione
finale del progetto. Nessuna modifica al codice o all'artefatto.
