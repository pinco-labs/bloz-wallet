# Revisione di sicurezza interna — Pinco Labs

Data: 14 ottobre 2026. Candidata per revisione manuale sul dominio pubblico,
non annunciata. Revisione interna assistita da strumenti automatici, non audit
indipendente né certificazione. Il commit che contiene questo rapporto
identifica i sorgenti esaminati; il manifest del sito identifica l'artefatto.

## Controlli e risultati

- Suite finale: 66 test superati, cinque modalità ricompilate. Test con chiavi
  usa e getta e simulazioni; nessun pagamento mainnet eseguito dall'agente.
- Verificati cifratura e recupero, password errata, file alterati, rete e limiti
  del formato, verifica autonoma di copie, copie con password precedenti,
  concorrenza tra schede, blocco durante operazioni asincrone e persistenza.
- Invio: importi interi, prevout/script/rete, fee e resto, firma locale,
  conferma esplicita, nessun reinvio automatico dopo esito incerto.
- Trasporti: errori e risposte discordanti non diventano saldi zero; polling,
  header/prove Merkle e confronto dei due endpoint; bridge RPC solo loopback,
  nessun proxy generico e nessuna credenziale RPC inviata al browser.
- Compatibilità chiavi/descrittore verificata in sessioni precedenti contro
  BLOZ Core v1.0.0-rc38 in regtest isolata. Il JSON cifrato non è wallet.dat.
- Letture live sui due Electrum Pinco Labs e sul Core locale già collaudate.
  Server Electrum di terzi non collaudati. RPC locale attuale Windows/WSL.
- HTTPS di manutenzione verificato; regola Cloudflare Strict limitata a
  wallet ed explorer documentata da dashboard. NEL disattivato, nessun Worker
  o Page Rule configurati, nessun Web Analytics Pinco Labs rilevato.
  Sei richieste pubbliche senza Set-Cookie, NEL o Report-To.
- Licenza AGPL-3.0-or-later, attribuzioni delle dipendenze conservate.
  Il build pubblico richiede un commit sorgente e vi collega il sito.

## Crittografia e custodia

CSPRNG del browser per chiavi secp256k1 e parametri casuali. Backup AES-256-GCM,
PBKDF2-HMAC-SHA-256 con 600.000 iterazioni, salt 128 bit, IV 96 bit e tag
128 bit; metadati autenticati e formato limitato. Il browser persiste il
contenitore cifrato. Vecchi backup non sono revocati dal cambio password.
La verifica autonoma decifra e confronta l'indirizzo senza sostituire il wallet.

## Limiti della revisione e rischi residui

Nessuna verifica formale, fuzzing esteso o audit completo delle dipendenze.
Non garantisce assenza di vulnerabilità. Malware, estensioni, browser o host
compromessi possono sottrarre segreti. Le stringhe JavaScript non sono
azzerabili con garanzia; la password può essere attaccata offline.

I due Electrum appartengono allo stesso operatore; il wallet non verifica
indipendentemente tutta la catena Proof of Work. Non è un nodo completo.
Limiti: 100 transazioni, 500 UTXO, un input per invio. Lo storico RPC può
non essere completo e dipende dai dati disponibili sul nodo.

La verifica browser della release HTTPS finale e il confronto degli hash
pubblici sono passaggi successivi al caricamento: non sono attestati da questo
rapporto sorgente. La revisione Chrome dell'utente resta necessaria prima
dell'annuncio. La pubblicazione senza link e noindex non è controllo accessi.

Cookie condizionali di sicurezza Cloudflare non provocati; nessun banner di
consenso previsto in assenza di tracciamento non necessario osservato.
Informativa tecnica presente; testi legali ancora in revisione, nessuna
attestazione di conformità legale. Log Electrum nuovi circa 24h; vecchi log,
log di sistema e Cloudflare seguono politiche separate.

## Attività successive

- Revisione manuale dell'utente prima di collegamento explorer e annuncio.
- Guida passo passo per un proprio Electrum BLOZ, da provare prima di proporla.
- Collaudo browser ulteriori e interoperabilità con nodi di terzi.

Il miner è escluso dal pacchetto e resta privato.
