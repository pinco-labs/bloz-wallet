# Connessioni e dati tecnici — bozza da completare prima della pubblicazione

Progetto e contatto pubblico: **Pinco Labs — info@pinco-labs.com**.
Il gestore ha scelto di non pubblicare altri dati identificativi. Questo nome
di progetto non va presentato come ragione sociale verificata; l'identificazione
del titolare e la sufficienza delle informazioni obbligatorie restano da
valutare prima di considerare completa l'informativa.

Il wallet è non custodial. Chiavi private e password del backup vengono
elaborate sul dispositivo e non sono inviate ai nodi. Per leggere la blockchain
e trasmettere transazioni già firmate, il wallet comunica dati pubblici al nodo
selezionato. Il gestore può associare l'IP della connessione alle richieste.

## Puoi scegliere la connessione

I nodi Pinco Labs sono predefiniti, ma non obbligatori. Nella copia locale puoi
configurare altri nodi Electrum compatibili con BLOZ oppure usare il tuo BLOZ
Core attraverso il bridge RPC locale. Questa versione richiede due endpoint
Electrum WSS distinti; il bridge RPC attuale richiede Windows e WSL
Ubuntu-24.04. I nodi di terzi possono applicare politiche diverse. La scelta
del nodo non cambia chiavi, indirizzo o backup.

## Log applicativi dei due nodi Pinco Labs

Dal 14 ottobre 2026 i riepiloghi periodici delle sessioni e i normali messaggi
informativi di connessione sono disattivati. È attiva la mascheratura IP
offerta da ElectrumX per i messaggi che la supportano. Conserviamo avvisi ed
errori tecnici in file ad accesso limitato, con rotazione oraria e conservazione
prevista di circa 24 ore nel normale funzionamento. Eventuali arresti o guasti
del processo di rotazione possono ritardare la cancellazione.

Questo non garantisce log completamente anonimi: alcuni errori possono
contenere informazioni di connessione. Gli IP sono inoltre necessari durante
le connessioni per il funzionamento del servizio e le protezioni antiabuso.

## Ambito da completare — non pubblicare come informativa definitiva

- I vecchi log Electrum nel journal condiviso non sono ancora stati eliminati.
- I log del sistema e di sicurezza hanno una gestione distinta, da verificare.
- Explorer e sito wallet passano da Cloudflare; i due endpoint Electrum sono
  diretti (DNS-only). Impostazioni effettive e conservazione Cloudflare ancora
  da verificare. La schermata DNS Analytics non risolve questi punti.
- Nginx sul server explorer mantiene access.log/error.log con rotazione
  giornaliera e 14 archivi configurati; questa politica non è stata modificata.
- Verificare eventuali copie/backup dei log, ruoli e contatti del titolare,
  finalità, basi giuridiche, fornitori/trasferimenti e diritti applicabili.

La politica di circa 24 ore riguarda i nuovi log applicativi Electrum e non
va estesa agli altri trattamenti finché non sono verificati e configurati.

## Aggiornamento tecnico del 14 ottobre 2026

Le schermate della dashboard confermano NEL disattivato, nessun percorso
Workers o Page Rule, nessuna voce Pinco Labs in Web Analytics. La regola SSL
Strict riguarda wallet ed explorer. Le risposte pubbliche verificate non
impostano cookie e non includono NEL/Report-To; eventuali challenge possono
usare cookie tecnici. Non sono configurati strumenti pubblicitari nel wallet.
La verifica del browser sulla release finale resta distinta.

Il browser conserva backup cifrato e profilo di connessione senza scadenza
automatica, fino alla rimozione o cancellazione dei dati del sito.
Nginx del wallet ha access_log disattivato; i log errori e quelli condivisi
restano separati dalla conservazione di circa 24 ore di Electrum.
