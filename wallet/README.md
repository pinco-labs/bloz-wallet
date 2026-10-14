# BLOZ Wallet — prototipo locale SegWit

Stato: **privato, laboratorio regtest e collaudo mainnet separati**. 13 ottobre 2026.

## Collaudo privato mainnet

### Copia Electrum separata (14 ottobre)

`npm run build:electrum` e `npm run electrum`: anteprima locale su 8091.
La pagina si collega direttamente ai due Electrum Pinco Labs via WSS 50004;
il server 8091 distribuisce soltanto HTML/JS/CSS, senza API o accesso RPC.
Stesso formato backup mainnet di 8090, archivio browser separato per origine.
Chiavi, password, derivazione e firma restano nel browser. Ai server vengono
comunicati script hash pubblici e, solo su conferma, bytes già firmati.

Saldo e storico vengono ricostruiti dalle transazioni, con controllo ID,
output, prova Merkle rispetto agli header dei server, maturità coinbase,
spese mempool e confronto tra i due server. Questo non è un nodo completo:
non verifica autonomamente PoW/catena degli header; entrambi i server sono
dello stesso operatore. Le letture rendono correlabili IP e script pubblico.
Un server irraggiungibile o dati discordanti sospendono saldo e preparazione.
Limite deliberato: 100 transazioni nello storico e 500 UTXO per indirizzo.

La trasmissione avviene una sola volta al primo server dopo controllo su
entrambi; nessun retry automatico dopo esito incerto. Fee calcolata sul
massimo delle stime/politiche con gli stessi limiti della prova 8090.
Test invio soltanto simulati in questa integrazione; nessun nuovo pagamento.
Non pubblicata: la build mantiene vincolo locale 127.0.0.1. HTTPS pubblico,
collaudo Chrome e validazione indipendente degli header restano separati.

`npm run build:mainnet` e `npm run mainnet` avviano la copia locale su
127.0.0.1:8090. Richiede il nodo WSL dedicato sincronizzato. La porta 8088
rimane offline; backup e archivio di 8090 sono separati. Creare una chiave
nuova e verificare il backup prima del collaudo manuale con piccole somme.

Saldo e commissioni provengono dal nodo locale; chiavi e firma restano nel
browser. Un solo input confermato P2WPKH, importo e resto non nullo almeno
1.000 rex; fee totale da 200 a 100.000 rex, stimata su 141 vbyte dalla politica
del nodo e dalla stima disponibile. Il riepilogo scade dopo 60 secondi.
La stima non garantisce tempi di conferma. Blocchi storici eliminati dal nodo
pruned possono impedire di recuperare la transazione precedente e quindi
preparare la spesa. Non sono supportati input multipli, RBF o altri indirizzi.

35 test automatici superati e firma dopo ripristino accettata da Core sulla
regtest isolata (evidence/mainnet-signer-regtest.json). Letture mainnet e
flusso browser senza fondi verificati; trasferimento mainnet completo ancora
da collaudare dall'utente in Chrome. Nessuna pubblicazione effettuata.

Il JSON cifrato non è un wallet.dat e non si importa direttamente in Core.
La password web decifra il JSON; Core usa una password separata. Il recupero
compatibile passa dalla stessa chiave privata tramite descrittore locale.
Il miner Ubuntu resta privato in attesa del chiarimento sulla licenza della patch BLOZ.
Questo lavoro non modifica miner, explorer, server remoti o procedure di pubblicazione.

**Copia dimostrativa separata:** `npm run build:demo` e `npm run demo`, porta
8087. Solo creazione/backup/recupero; nessun nodo, saldo o invio. Backup e
archivio distinti dal laboratorio. Vedere [DEMO.md](DEMO.md) per la prova
finale Chrome e i requisiti della futura pubblicazione, ancora non eseguita.

## Avvio

Node 24+, browser moderno con Web Crypto e Web Locks. Dalla cartella `wallet`:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm start
```

Aprire **http://127.0.0.1:8083**. Il server si lega esclusivamente a loopback e
accetta solo questo hostname, non `localhost`. Ctrl+C lo arresta. Le dipendenze
servono all'installazione/compilazione; il wallet in esecuzione non usa CDN o rete
esterna. Non copiare il bundle nel sito pubblico. Il bundle è in `wallet/dist`,
escluso da Git; nessuna modifica al `web/` dell'explorer.

## Percorso disponibile

1. Creazione con casualità crittografica del browser, oppure ripristino da backup
   cifrato o importazione di WIF **compresso di test**.
2. Derivazione di un unico indirizzo **SegWit nativo P2WPKH**, `bzrt1q…`.
   Niente P2PKH, SegWit annidato, Taproot, seed mnemonic o derivazione HD.
3. Password scelta e confermata, almeno 12 caratteri. Download di un JSON cifrato.
4. Selezione del file effettivamente scaricato e reinserimento della password.
   Il programma decifra il contenitore e verifica lo stesso indirizzo. Un file
   diverso, anche un vecchio backup della stessa chiave, non passa questa prova.
5. Solo dopo la verifica, attivazione esplicita e copia **cifrata** in localStorage.
6. Blocco manuale, dopo 5 minuti di inattività, quando la pagina viene nascosta o
   chiusa, e quando un'altra scheda cambia l'archivio. Password necessaria per
   sbloccare; nessun auto-sblocco. Web Locks serializza le attivazioni tra schede.

Il ripristino da file ricostruisce l'indirizzo ma richiede ancora download e
verifica di un nuovo backup prima dell'attivazione. Una sessione non attivata
non viene conservata: dopo il blocco occorre il file già scaricato. Il browser
non può certificare dove o per quanto tempo il file rimarrà conservato. La
verifica prova soltanto la leggibilità di quel file con quella password in
quel momento. **La password da sola non recupera la chiave.**

Il blocco per pagina nascosta dipende dagli eventi del browser. Nel pannello
incorporato usato per il collaudo, nascondere il pannello o aprire un'altra
scheda ha lasciato `document.visibilityState` su `visible`: in questo caso
usare **Blocca wallet** prima di allontanarsi. Il timer di inattività resta
attivo; alla ripresa della pagina viene ricontrollata anche la scadenza.

## Recupero nel programma ufficiale

Compatibilità verificata sui sorgenti fissati e con BLOZ Core v1.0.0-rc38,
in un nodo regtest isolato. Dettagli e riferimenti in [COMPATIBILITY.md](COMPATIBILITY.md).

Dopo lo sblocco, la sezione di recupero può mostrare localmente
`wpkh(WIF)#checksum`. Il descrittore contiene la chiave privata; importarlo
soltanto nel programma ufficiale locale avviato con `-regtest` in una cartella
dedicata ai test. `importdescriptors` richiede `timestamp: 0` per cercare tutta
la cronologia disponibile e `active: false` per questo descrittore non ranged.
Il JSON cifrato del prototipo **non è** un `wallet.dat`, un backup Core o BIP38.
Non va passato direttamente a `restorewallet`.

## Confini del prototipo

- Ricezione e saldo ora disponibili tramite il solo nodo regtest locale, con
  copia dell'indirizzo e aggiornamento manuale. Al servizio viene trasmesso solo
  l'indirizzo pubblico. Nessuna connessione a mainnet, Electrum, explorer remoto,
  telemetria, account, service worker o QR.
- Firma SegWit SIGHASH_ALL nel browser, dopo conferma esplicita del riepilogo.
  Il server riceve soltanto transazioni già firmate. Non esistono endpoint per segreti.
- Il server serve tre risorse statiche, GET per saldo/accrediti pubblici e un
  solo POST per la transazione firmata. Quest'ultimo richiede origine esatta,
  header dedicato e JSON limitato; origini esterne e percorsi estranei sono rifiutati.
  CSP permette connessioni solo alla stessa origine e vieta invio di form,
  script esterni, frame, worker e immagini; nessuna risorsa viene memorizzata in cache.
- La cifratura protegge il backup a riposo; non protegge da malware, estensioni,
  browser o codice locale compromessi, né da una password indovinabile.
- Gli array di chiavi vengono azzerati quando possibile. JavaScript, stringhe,
  garbage collector e browser non consentono una garanzia di cancellazione
  fisica dalla memoria. Il descrittore mostrato viene tolto dalla vista al blocco.
- Nessun audit indipendente del prototipo. Gli indirizzi di test condividono
  alcuni formati con altre reti: WIF da solo non prova la rete o la provenienza.

## Backup v1

PBKDF2-HMAC-SHA256, 600.000 iterazioni, salt casuale di 16 byte; chiave AES a
256 bit; AES-GCM con IV casuale di 12 byte e tag a 128 bit. Ogni esportazione
ha nuovi salt e IV. Password UTF-8 esatta, senza trim o normalizzazione Unicode.
Password minima 12 e massima 1024 caratteri JavaScript.

Intestazione fissa autenticata come AAD: formato, versione, rete, KDF, iterazioni,
cifratura. Il parser accetta solo questi parametri e limita il file a 8 KiB,
senza eseguire costi KDF scelti da file non fidati. Il payload cifrato comprende
rete, tipo single-key-wpkh, WIF e indirizzo. Dopo la decifratura l'indirizzo viene
ricalcolato dalla chiave e confrontato. Versioni/reti diverse vengono rifiutate.

## Verifiche ripetibili

```powershell
# Dalla cartella wallet, dopo la compilazione
npm test

# Dalla radice della repository: binario BLOZ ufficiale verificato a parte
node wallet/scripts/core-compat.js C:/percorso/bitcoind.exe
```

Il secondo comando crea una directory regtest nuova sotto `work/wallet-core-tests`,
disabilita P2P e usa RPC su 127.0.0.1:18453 con cookie effimero. Recupera una
chiave di test dal backup, controlla checksum, `deriveaddresses`, `importdescriptors`,
`getaddressinfo` e `listdescriptors`, poi arresta Core. Nessun mining, nessun fondo.
Le cartelle di test, con chiavi usa e getta, restano escluse da Git; non riutilizzarle.
Il runner accetta esclusivamente il binario CLI Windows della release fissata,
con SHA-256 verificato prima dell'avvio tramite `source-lock.json`.

Il test del wallet ricompila automaticamente il bundle. Alla radice, `npm test`
verifica explorer/Pay, mentre `npm run test:wallet` verifica questo prototipo
dopo l'installazione delle sue dipendenze separate.

Per verificare un **backup fittizio creato nel browser**, passare anche il suo
percorso come secondo argomento e fornire la password attraverso la variabile
di processo `BLOZ_TEST_BACKUP_PASSWORD`, da rimuovere dopo il test. Non usare
questa procedura con wallet o password reali. Il test separato comunica la
chiave fittizia al Core locale per provarne l'importazione; il server web non
partecipa al recupero.

Risultato registrato: [evidence/core-compatibility.json](evidence/core-compatibility.json),
solo indirizzo, chiave pubblica e descrittore pubblico; nessun WIF o password.
Ricezione e spesa regtest dal browser collaudate separatamente, anche dopo
recupero dal backup: vedere `evidence/send-regtest.json`. Queste prove non attestano
compatibilità con wallet Electrum, mobile, hardware o con ogni versione di Core.

Vedere [THIRD-PARTY.md](THIRD-PARTY.md) per dipendenze e attribuzioni.

## Ricezione e saldo su regtest

Dalla radice, con il binario ufficiale già verificato in `work/wallet-source`:

```powershell
npm --prefix wallet run regtest
# In un altro terminale:
npm --prefix wallet start
# Generazione esplicita verso un indirizzo PUBBLICO bzrt1q… di test:
npm --prefix wallet run fund -- INDIRIZZO_REGTEST 1
```

Il nodo usa solo `work/wallet-regtest`, RPC 127.0.0.1:18454 con cookie locale,
wallet Core disabilitato e P2P disabilitato. Non legge `.env`, wallet o dati
dell'explorer. Avviarlo non genera blocchi. Il comando `fund` genera da 1 a 101
blocchi esplicitamente, con un thread; RandomX può usare circa 2–3 GiB di RAM.
Non è un faucet mainnet. Nessun metodo di generazione o firma è esposto via HTTP.

Dopo l'attivazione del wallet, premere **Aggiorna saldo locale**. L'API legge
l'intera catena del laboratorio (massimo 500 blocchi, 1000 transazioni mempool
e 50.000 output elaborati), senza importare chiavi o descrittori. Verifica
regtest, genesis ufficiale, assenza di pruning e P2P disabilitato prima e dopo
la lettura. Cambi di tip o mempool durante la scansione fanno fallire la lettura.

Importi interi in rex, resi con otto decimali. Disponibili = UTXO confermati
candidati alla spesa nel blocco successivo, meno quelli impegnati in mempool.
Per coinbase la soglia usata è 100 conferme al tip: il blocco successivo soddisfa
la distanza di consenso di 100 blocchi. È una stima, non la classificazione
conservativa del saldo di ogni wallet Core, né una prova completa di spendibilità.
Ricompense immature e arrivi in mempool sono separati. Output mempool già spesi
da figli non sono contati due volte. La lista mostra al massimo 25 output,
ma i totali li includono tutti. Dati scaduti dopo un minuto vengono rimossi;
errori/offline non vengono mostrati come saldo zero. Il blocco del wallet
cancella la vista e annulla richieste pendenti.

Collaudo reale locale: 101 blocchi sul solo indirizzo usa e getta del precedente
test, 100 BLOZ test candidati alla spesa e 4.950 immaturi; rollback a 99 blocchi
porta i disponibili a zero, e il ripristino restituisce il saldo iniziale.
Rapporto: [evidence/receive-regtest.json](evidence/receive-regtest.json).
Mempool inizialmente testata con fixture sintetiche, poi con gli invii sotto.
Lo script `receive-smoke.js` è riservato
alla fixture dedicata di esattamente 101 blocchi, poiché simula una reorg.

## Invio locale e test dopo il recupero

Dopo l'attivazione, inserire destinatario `bzrt1q…`, importo e commissione
totale; **Prepara riepilogo** legge gli accrediti pubblici. Il browser verifica
le transazioni precedenti complete e il loro ID, ricava importi/script e
costruisce destinazione e resto. **Conferma e invia sulla regtest** firma
localmente SIGHASH_ALL e invia soltanto la transazione firmata al servizio locale.
Core controlla nuovamente disponibilità dell'input, maturità, fee e firma.

Limiti deliberati: un input confermato per invio, solo P2WPKH, nessun invio a sé,
importo e resto non nullo minimo 1.000 rex, fee totale da 200 a 100.000 rex.
Il resto torna all'indirizzo corrente. Nessuna selezione multipla, cambio
indirizzo HD, stima fee, RBF o spesa non confermata. Non viene aggiunto resto
troppo piccolo alla commissione in modo silenzioso. Il riepilogo scade in 60
secondi e viene annullato da modifica dei campi o blocco. Un errore dopo la
trasmissione può avere esito incerto: conservare l'ID e aggiornare il saldo,
senza preparare subito un secondo pagamento. Lo stesso payload è idempotente
finché presente in mempool; dopo conferma l'input speso viene rifiutato.

Prova completata con due chiavi nuove generate nel browser, 101 blocchi di
maturazione, A→B 1 BLOZ test, conferma, recupero di B dal backup scaricato in
un'origine vuota, nuovo backup verificato e B→A 0,25 BLOZ test, conferma.
Saldo finale disponibile di B: 0,74999000 BLOZ test; fee 0,00001000 per invio.
Solo origini QA 8084/8085/8086: il wallet dell'utente su 8083 non è stato aperto.
Si tratta di contesti separati dello stesso browser incorporato; non attesta
collaudo in Chrome o su un altro dispositivo.

`scripts/send-check.js` controlla i dati pubblici delle transazioni prodotte dal
browser e genera esplicitamente un blocco di conferma (un thread).
`scripts/send-negative-check.js` altera copie pubbliche per provare il rifiuto
della firma, dell'input speso, della coinbase immatura e di fee eccessive; non
carica chiavi e non pubblica nuove transazioni.
Risultati: [evidence/send-regtest.json](evidence/send-regtest.json).
# Copie di backup e password

## Preparazione artefatto HTTPS (nessuna pubblicazione automatica)

`node wallet/scripts/package-public.mjs https://DOMINIO-EFFETTIVO` prepara
`wallet/dist-public` con vincolo all'origine indicata, profili pubblici
predefiniti, licenze, `_headers` e manifesto SHA-256. Il comando
`node wallet/scripts/verify-public.mjs` verifica file, integrità e controlli
statici. Hosting che non interpreta `_headers` richiede regole equivalenti
nel server. Verificare TLS e header reali prima del rilascio. La build per
wallet.example presente durante il collaudo è una fixture, non distribuibile.
Il file manifest.json identifica l'artefatto e mantiene publicationApproved
false: i controlli locali non approvano automaticamente il deployment.

## Connessioni avanzate (anteprima locale)

Perimetro del supporto Electrum: configurazione collaudata con i due server
Pinco Labs. Il collaudo con un operatore terzo è sospeso e non blocca questo
perimetro; non promettiamo compatibilità verificata con qualsiasi server.
Resta possibile configurare server propri compatibili BLOZ via WSS. Questa
versione richiede due endpoint distinti (anche un proprio nodo insieme a uno
predefinito); non supporta un profilo Electrum con un solo endpoint.
Il 14 ottobre 2026 non sono stati trovati endpoint Electrum nelle pagine
ufficiali consultate: elenco official-links e guida how-to-use-wallet di
Rexemre/blockzero-docs. Questo non dimostra che non esistano server non elencati.

La build Electrum legge `/connections.json` dal servizio locale. Senza
configurazione resta disponibile soltanto il profilo predefinito Pinco Labs.
Per aggiungere profili, copia `connections.example.json`, sostituisci i domini
di esempio con i tuoi server e imposta `BLOZ_CONNECTIONS_FILE` al percorso del
file prima di avviare `node wallet/electrum-server.js`. Non inserire segreti:
questo file viene servito al browser. Il servizio accetta al massimo 8 profili.
Ogni profilo Electrum richiede due URL WSS distinti, senza credenziali,
parametri o percorsi. I due server devono concordare; non sono necessariamente
operatori indipendenti. La CSP ammette solo le destinazioni configurate.

Nella sezione Avanzate seleziona il profilo e premi Verifica e usa connessione.
Il controllo verifica rete BLOZ, header recente concorde e commissioni;
saldo e invio fanno ulteriori verifiche ad ogni utilizzo. Un errore mantiene
il profilo precedente. Non si può cambiare mentre un riepilogo di invio è
aperto. La scelta è ricordata per questa origine del browser. Ripristina
connessione predefinita ripete la verifica prima di applicarla.

Il profilo `local` abilita le sole API wallet limitate, non un proxy RPC
generico. Attualmente richiede Windows con WSL Ubuntu-24.04 e Python 3.
Nel filesystem Ubuntu puoi configurare `~/.config/bloz-wallet-rpc.json` con
`{"port":19466,"cookie_path":"/percorso/al/datadir/.cookie"}`. L'indirizzo RPC
resta 127.0.0.1; il cookie rimane nel processo locale e non raggiunge il browser.
Omettendo il file viene usato il percorso del collaudo originale.
Il nodo deve essere BLOZ mainnet sincronizzato e connesso. Storico completo
non disponibile via questo adapter; gli output storici possono richiedere
blocchi non più presenti su un nodo pruned. Il collaudo live RPC del
14 ottobre 2026 è bloccato da nodo non disponibile/richiesta rifiutata.

## Esportazione privata verso BLOZ Core

Il wallet attivo richiede la password corrente prima di mostrare WIF e
descrittore. Nasconde i dati quando si chiude la sezione o si blocca la pagina.
Preferire il descrittore `wpkh(...)#checksum` per importdescriptors in un wallet
Core compatibile con descrittori; non modificare wallet.dat a mano.
La verifica automatica del 14 ottobre 2026 con Core rc38 su regtest isolata
ha confermato indirizzo, ismine e riesportazione del descrittore privato.
Non è una verifica di importprivkey nei wallet legacy né un test con fondi.

Scarica un'altra copia salva il JSON cifrato attuale senza cambiare password.
Cambia password richiede la password attuale e una nuova password diversa
(minimo 12 caratteri), poi download, rilettura e verifica del nuovo file.
Solo Conferma cambio password sostituisce la copia cifrata nel browser.
I file precedenti restano recuperabili con la vecchia password. Se vecchio
file e password sono compromessi occorre una nuova chiave, non una ricifratura.
I nomi dei download includono data UTC e identificatore del contenitore;
la password non viene inclusa. Un file già recuperato correttamente non
richiede un nuovo backup obbligatorio.

# Licenza e informazioni per gli utenti

Codice originale Pinco Labs: **AGPL-3.0-or-later**, copyright 2026 Pinco Labs.
Testo integrale in [LICENSE](LICENSE), ambito e attribuzioni in
[LICENSING.md](LICENSING.md) e [THIRD-PARTY.md](THIRD-PARTY.md).
Consulta [condizioni e avvertenze](TERMS-DRAFT.md) e la
[bozza privacy](PRIVACY-DRAFT.md). I testi legali e i dati organizzativi
restano da completare prima della pubblicazione.

