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
