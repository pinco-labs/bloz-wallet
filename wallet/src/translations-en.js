// Italian source strings are retained for backwards-compatible presentation.
// Values are plain text, never HTML. Numbered placeholders preserve runtime data.
export const english = {
  'BLOZ · Mainnet sperimentale': 'BLOZ · Experimental mainnet',
  'BLOZ · Mainnet privata': 'BLOZ · Local mainnet',
  'BLOZ · Wallet di prova': 'BLOZ · Test wallet',
  'BLOZ wallet, pagina iniziale': 'BLOZ wallet, home page',
  'Lingua': 'Language',
  'La lingua scelta viene conservata nel browser. Puoi cambiarla dal selettore senza modificare il wallet.': 'Your language preference is stored in the browser. You can change it using the selector without modifying the wallet.',
  'WALLET LAB': 'WALLET LAB',
  'ELECTRUM · VERSIONE SPERIMENTALE': 'ELECTRUM · EXPERIMENTAL VERSION',
  'ELECTRUM · PROVA PRIVATA': 'ELECTRUM · LOCAL VERSION',
  'MAINNET PRIVATA': 'LOCAL MAINNET',
  '● Mainnet · piccoli importi': '● Mainnet · small amounts',
  '● Regtest · locale': '● Regtest · local',
  'IL CONTROLLO RESTA A TE': 'YOU STAY IN CONTROL',
  'Le tue chiavi.': 'Your keys.',
  'Un recupero verificato.': 'Verified recovery.',
  'Un wallet BLOZ SegWit sperimentale su mainnet. Le chiavi vengono elaborate sul tuo dispositivo.': 'An experimental BLOZ SegWit wallet on mainnet. Keys are processed on your device.',
  'Un wallet locale BLOZ SegWit per una prova privata su mainnet. Le chiavi vengono elaborate sul tuo dispositivo.': 'A local BLOZ SegWit wallet for mainnet testing. Keys are processed on your device.',
  'Versione sperimentale su mainnet.': 'Experimental mainnet version.',
  'Prova privata su mainnet.': 'Local mainnet test.',
  'Usa soltanto una chiave nuova e piccole somme dedicate al collaudo. Controlla destinatario, importo, commissione e totale prima di confermare. Firma e chiavi restano nel browser.': 'Use a new key and small amounts set aside for testing. Check the recipient, amount, fee and total before confirming. Signing and keys stay in your browser.',
  'Custodia delle chiavi': 'Key custody',
  'Non custodial: il wallet è sotto il tuo controllo': 'Non-custodial: you control your wallet',
  'Pinco Labs non custodisce i tuoi fondi.': 'Pinco Labs does not hold your funds.',
  'Chiavi private e password del backup vengono elaborate sul tuo dispositivo e non sono inviate a Pinco Labs o ai nodi. La firma delle transazioni avviene nel browser; ai nodi vengono inviate solo le richieste pubbliche necessarie e le transazioni già firmate.': 'Private keys and backup passwords are processed on your device and are not sent to Pinco Labs or the nodes. Transactions are signed in your browser; nodes receive only the necessary public queries and already-signed transactions.',
  'Nella modalità Electrum, le connessioni ai server sono cifrate tramite WSS. In alternativa, nella copia locale puoi usare il tuo nodo BLOZ Core tramite il collegamento RPC locale. I nodi Pinco Labs sono facoltativi.': 'In Electrum mode, connections to servers are encrypted using WSS. Alternatively, the local copy can use your own BLOZ Core node through the local RPC bridge. Using Pinco Labs nodes is optional.',
  'Non possiamo recuperare la tua password o sostituire un backup perso. Conserva il file cifrato e la sua password: servono entrambi per il recupero.': 'We cannot recover your password or replace a lost backup. Keep the encrypted file and its password: recovery requires both.',
  'Vuoi avviarlo sul tuo PC? Guida semplice': 'Want to run it on your PC? Setup guide',
  'Per l’uso abituale consigliamo la copia locale, possibilmente collegata al tuo nodo BLOZ Core via RPC oppure a server Electrum gestiti da te. Puoi scegliere quando aggiornare il codice e a quali nodi affidare le letture della blockchain. La versione web resta una soluzione comoda quando ne hai bisogno; in entrambe le modalità chiavi e firma restano nel browser. Scarica i': 'For regular use, we recommend the local copy, preferably connected to your own BLOZ Core node via RPC or Electrum servers you operate. You can choose when to update the code and which nodes to use for blockchain queries. The hosted version remains a convenient option; in both modes, keys and signing stay in your browser. Download the',
  'sorgenti ufficiali su GitHub': 'official source code on GitHub',
  'e segui questi passaggi.': 'and follow these steps.',
  'Installa Node.js 24 LTS. Scarica da GitHub la versione indicata da Pinco Labs ed estrai lo ZIP.': 'Install Node.js 24 LTS. Download the version indicated by Pinco Labs from GitHub and extract the ZIP.',
  'Apri un terminale nella cartella estratta che contiene la sottocartella': 'Open a terminal in the extracted folder containing the subfolder',
  'Esegui': 'Run',
  'per installare le dipendenze della versione scaricata.': 'to install the dependencies for the downloaded version.',
  ', poi': ', then',
  'Lascia aperto il terminale e apri': 'Keep the terminal open and open',
  'nel browser. Per fermare il servizio premi Ctrl+C nel terminale.': 'in your browser. To stop the service, press Ctrl+C in the terminal.',
  'In locale non significa offline: saldo e invio richiedono i nodi Electrum oppure il tuo nodo BLOZ configurato. Il wallet sul sito e quello locale hanno archivi separati nel browser: per passare da uno all’altro usa il backup cifrato. Non aprire index.html con un doppio clic.': 'Local does not mean offline: balances and transfers require Electrum nodes or your configured BLOZ node. The hosted and local wallets have separate browser storage: use your encrypted backup to move between them. Do not open index.html by double-clicking it.',
  'La custodia locale non protegge da malware o estensioni invasive. Mantieni aggiornati sistema e browser e verifica la provenienza del codice che esegui.': 'Local custody does not protect against malware or intrusive extensions. Keep your system and browser updated and verify the source of the code you run.',
  'Abilitare JavaScript per usare il prototipo locale.': 'Enable JavaScript to use the local prototype.',
  'Caricamento…': 'Loading…',
  'Configurazione wallet': 'Wallet setup',
  'INIZIA QUI': 'START HERE',
  'Crea o ripristina': 'Create or restore',
  'Un solo indirizzo SegWit nativo. Nessun account e nessuna frase seed in questo prototipo.': 'One native SegWit address. No account or seed phrase in this prototype.',
  'Come viene generata la chiave?': 'How is the key generated?',
  'L’entropia misura l’imprevedibilità dei dati casuali. Per creare la chiave usiamo Web Crypto, il generatore di casualità crittografica del browser, direttamente sul tuo dispositivo. La password serve a cifrare il backup e non determina la chiave.': 'Entropy measures the unpredictability of random data. We generate the key using Web Crypto, the browser’s cryptographic random generator, directly on your device. Your password encrypts the backup; it does not determine the private key.',
  'Crea wallet mainnet': 'Create mainnet wallet',
  'oppure recupera il tuo wallet mainnet': 'or recover your mainnet wallet',
  'Backup cifrato (.json)': 'Encrypted backup (.json)',
  'Password del backup': 'Backup password',
  'Ripristina dal file': 'Restore from file',
  'Accetta solo backup della versione mainnet privata. I file della demo 8087 e della prova offline 8088 restano separati.': 'Accepts only mainnet wallet backups. Files from the 8087 demo and 8088 offline test are separate.',
  'Importa una chiave WIF mainnet': 'Import a mainnet WIF key',
  'Importazione esterna non disponibile in questa prova. Crea una chiave nuova dedicata a questo collaudo.': 'External import is unavailable in this test. Create a new key for testing.',
  'WIF mainnet': 'Mainnet WIF',
  'Importa come SegWit': 'Import as SegWit',
  'FILE VERIFICATO': 'FILE VERIFIED',
  'Ripristino riuscito': 'Recovery successful',
  'Il file è stato decifrato e verificato. Puoi attivare il wallet senza creare un nuovo backup: verrà conservata nel browser la stessa copia cifrata, con la stessa password. Potrai scaricarne un’altra copia da Backup e recupero.': 'The file has been decrypted and verified. You can activate the wallet without creating a new backup: the same encrypted copy, with the same password, will be stored in your browser. You can download another copy under Backup and recovery.',
  'Prepara il backup per completare l’attivazione': 'Prepare your backup to complete activation',
  'METTI AL SICURO IL RECUPERO': 'SECURE YOUR RECOVERY',
  'Scarica il backup cifrato': 'Download the encrypted backup',
  'Scegli una password lunga e unica, di almeno 12 caratteri: una frase composta da più parole casuali e non collegate può essere facile da ricordare senza essere facile da indovinare. Evita citazioni famose, dati personali e password già usate altrove.': 'Choose a long, unique password of at least 12 characters: a phrase made of several random, unrelated words can be memorable without being easy to guess. Avoid famous quotes, personal details and reused passwords.',
  'Conserva almeno due copie del backup JSON cifrato su supporti diversi, per esempio una in una cartella del PC e una su una chiavetta USB. Custodiscile in luoghi fisicamente separati, così un furto, incendio o guasto non coinvolga entrambe. Aggiungi una copia del solo file cifrato su un servizio cloud, proteggendo l’account con l’autenticazione a due fattori.': 'Keep at least two copies of the encrypted JSON backup on different storage devices, such as your PC and a USB drive. Keep them in separate physical locations so theft, fire or failure does not affect both. Add a copy of the encrypted file to a cloud service and protect that account with two-factor authentication.',
  'La copia nel browser è una comodità e può essere cancellata: non sostituisce i backup esterni. Conserva la password al sicuro, separata dai file, senza affidarti soltanto alla memoria. Per recuperare servono sia il file sia la password; non possiamo reimpostarla. Verifica periodicamente che le copie siano leggibili: più copie riducono il rischio di perdita, senza garantire il recupero in ogni situazione.': 'The browser copy is convenient but can be erased: it does not replace external backups. Keep your password safe, separate from the files, without relying only on memory. Recovery requires both the file and password; we cannot reset it. Check your copies periodically: multiple copies reduce the risk of loss but cannot guarantee recovery in every situation.',
  'Nuova password (minimo 12 caratteri)': 'New password (at least 12 characters)',
  'Conferma password (minimo 12 caratteri)': 'Confirm password (at least 12 characters)',
  'Cifra e scarica il backup': 'Encrypt and download backup',
  'PROVA IL RECUPERO': 'TEST YOUR RECOVERY',
  'Riapri il file scaricato': 'Reopen the downloaded file',
  'Seleziona il file appena salvato e reinserisci la password. Verifichiamo che ricostruisca lo stesso indirizzo.': 'Select the file you just saved and enter its password again. We check that it recovers the same address.',
  'File da verificare': 'File to verify',
  'Password del file': 'File password',
  'Verifica recupero': 'Verify recovery',
  'Attiva wallet mainnet': 'Activate mainnet wallet',
  'Annulla e cancella la sessione': 'Cancel and clear the session',
  'COPIA CIFRATA LOCALE': 'LOCAL ENCRYPTED COPY',
  'Il wallet è bloccato': 'Wallet locked',
  'Inserisci la password per aprire la copia cifrata conservata in questo browser.': 'Enter the password to open the encrypted copy stored in this browser.',
  'Sblocca wallet': 'Unlock wallet',
  'Scarica un’altra copia — stessa password': 'Download another copy — same password',
  'RECUPERO VERIFICATO': 'RECOVERY VERIFIED',
  'Wallet mainnet attivo': 'Mainnet wallet active',
  'Il backup è stato decifrato e confrontato con questo wallet prima dell’attivazione. Conserva almeno due copie esterne del JSON cifrato, su supporti diversi e in luoghi separati, più una copia cloud. Custodisci la password separatamente.': 'The backup was decrypted and checked against this wallet before activation. Keep at least two external copies of the encrypted JSON on different devices in separate locations, plus a cloud copy. Store the password separately.',
  'Tipo di indirizzo': 'Address type',
  'SegWit nativo · P2WPKH': 'Native SegWit · P2WPKH',
  'Blocca wallet': 'Lock wallet',
  'Backup e recupero': 'Backup and recovery',
  'Puoi scaricare di nuovo una copia del backup cifrato salvato in questo browser. La password resta quella scelta per questo backup.': 'You can download another copy of the encrypted backup stored in this browser. It keeps the password chosen for this backup.',
  'Conserva almeno due copie del JSON cifrato su supporti diversi: per esempio PC e chiavetta USB, custoditi in luoghi fisicamente separati. Aggiungi una copia del solo file cifrato su un servizio cloud con autenticazione a due fattori. La copia nel browser può essere cancellata e non sostituisce queste copie.': 'Keep at least two encrypted JSON copies on different devices, such as a PC and USB drive, in separate physical locations. Add an encrypted-file copy to a cloud service protected with two-factor authentication. The browser copy can be erased and does not replace these backups.',
  'Tieni la password al sicuro, separata dai file, e verifica periodicamente che le copie siano leggibili. Per il recupero servono file e password: non possiamo reimpostarla. Questa precauzione riduce il rischio di perdita anche in caso di furto o calamità, ma non offre una garanzia assoluta.': 'Keep the password safe and separate from the files, and check your copies periodically. Recovery requires the file and password: we cannot reset it. These precautions reduce the risk of loss, including theft or disaster, but offer no absolute guarantee.',
  'Verifica una copia di backup': 'Verify a backup copy',
  'Seleziona una copia JSON e inserisci la password di quel file, anche se è una vecchia password. Il controllo avviene sul dispositivo e confronta l’indirizzo recuperato con il wallet aperto. Non sostituisce il wallet e non cambia password o backup.': 'Select a JSON copy and enter that file’s password, even if it is an old password. The check runs on your device and compares the recovered address with the open wallet. It does not replace the wallet or change its password or backup.',
  'Copia da verificare': 'Copy to verify',
  'Password di questa copia': 'Password for this copy',
  'Verifica questa copia': 'Verify this copy',
  'Cambia password': 'Change password',
  'Crei un nuovo file cifrato dello stesso wallet: indirizzo e fondi non cambiano. Prima scarichi e verifichi il nuovo file, poi confermi il cambio della password in questo browser.': 'Create a new encrypted file for the same wallet: the address and funds do not change. First download and verify the new file, then confirm the password change in this browser.',
  'I vecchi file restano validi con la vecchia password.': 'Old files remain valid with the old password.',
  'Il cambio non li aggiorna e non li revoca. Se qualcuno ha già il vecchio file e la sua password, può ancora accedere al wallet: in quel caso occorre un nuovo wallet e trasferire i fondi.': 'The change does not update or revoke them. Anyone who already has the old file and its password can still access the wallet: in that case you need a new wallet and must transfer the funds.',
  'Conserva le copie in cartelle riconoscibili e registra quale password appartiene a ciascun backup, tenendo la password separata dal file. Non cancellare le vecchie copie prima di avere verificato quelle nuove.': 'Keep copies in clearly named folders and record which password belongs to each backup, storing passwords separately from files. Do not delete old copies before verifying the new ones.',
  'Password attuale della copia nel browser': 'Current password for the browser copy',
  'Nuova password · minimo 12 caratteri': 'New password · at least 12 characters',
  'Minimo 12 caratteri': 'At least 12 characters',
  'Ripeti la nuova password': 'Repeat the new password',
  '1. Cifra e scarica il nuovo backup': '1. Encrypt and download the new backup',
  'Seleziona il nuovo file appena scaricato': 'Select the new file you just downloaded',
  'Nuova password del file': 'New file password',
  '2. Verifica il nuovo backup': '2. Verify the new backup',
  '3. Conferma cambio password': '3. Confirm password change',
  'Annulla cambio password': 'Cancel password change',
  'Ricezione e saldo mainnet': 'Mainnet receive and balance',
  'Ricevi piccoli importi BLOZ': 'Receive small BLOZ amounts',
  'Condividi solo l’indirizzo SegWit. Per il saldo viene comunicato ai due server Electrum l’impronta dello script pubblico. I server possono associare indirizzo e IP; password e chiavi non vengono trasmesse.': 'Share only your SegWit address. Balance queries send the public script hash to both Electrum servers. Servers can associate the address and IP; passwords and keys are not sent.',
  'Condividi solo l’indirizzo SegWit. Per il saldo viene comunicato al servizio locale esclusivamente l’indirizzo pubblico.': 'Share only your SegWit address. Only the public address is sent to the local service for balance queries.',
  'Copia indirizzo mainnet': 'Copy mainnet address',
  'Aggiorna saldo locale': 'Refresh balance',
  'Aggiornamento automatico ogni 30 secondi mentre il wallet è sbloccato e la pagina è visibile. Sospeso durante preparazione e invio.': 'Updates automatically every 30 seconds while the wallet is unlocked and the page is visible. Paused during transfer preparation and sending.',
  'Saldo non ancora letto.': 'Balance not loaded yet.',
  'Disponibili (stima)': 'Available (estimate)',
  'Confermati maturi': 'Mature confirmed funds',
  'Ricompense immature': 'Immature rewards',
  'In arrivo, non confermati': 'Incoming, unconfirmed',
  'Impegnati in mempool': 'Reserved in mempool',
  'Le ricompense di mining richiedono 100 conferme per essere candidate alla spesa nel blocco successivo. Gli importi non confermati non sono inclusi nei disponibili. Gli accrediti devono essere confermati. I due server devono concordare. Le prove delle transazioni vengono controllate rispetto agli header forniti dai server: questa versione non verifica autonomamente tutta la catena Proof of Work. Limite della prova: 100 transazioni per indirizzo.': 'Mining rewards need 100 confirmations to become eligible for spending in the next block. Unconfirmed amounts are excluded from available funds. Outputs must be confirmed and both servers must agree. Transaction proofs are checked against server-provided headers: this version does not independently verify the entire Proof-of-Work chain. Limit: 100 transactions per address.',
  'Accrediti non spesi': 'Unspent outputs',
  'Le ricompense di mining richiedono 100 conferme per essere candidate alla spesa nel blocco successivo. Gli importi non confermati non sono inclusi nei disponibili. Gli accrediti devono essere confermati. Per spendere output storici serve anche il relativo blocco, che potrebbe non essere più disponibile sul nodo con spazio limitato.': 'Mining rewards need 100 confirmations to become eligible for spending in the next block. Unconfirmed amounts are excluded from available funds. Outputs must be confirmed. Spending historical outputs also requires their block, which may no longer be available on a pruned node.',
  'Aggiorna il saldo per consultarli.': 'Refresh the balance to view them.',
  'Storico transazioni': 'Transaction history',
  'Invio mainnet': 'Mainnet transfer',
  'Invia piccoli importi BLOZ': 'Send small BLOZ amounts',
  'Solo indirizzi bz1q. In questa prova viene speso un singolo accredito confermato; il resto torna al tuo indirizzo.': 'Only bz1q addresses are supported. This version spends a single confirmed output; change returns to your address.',
  'Indirizzo destinatario mainnet': 'Mainnet recipient address',
  'Importo BLOZ (punto decimale)': 'BLOZ amount (decimal point)',
  'Commissione stimata BLOZ': 'Estimated fee in BLOZ',
  'Calcolata preparando il riepilogo': 'Calculated when preparing the review',
  'Prepara riepilogo': 'Review transfer',
  'La commissione viene calcolata dal nodo preparando il riepilogo; non viene inviata alcuna transazione in questo passaggio.': 'The fee is calculated from node data when preparing the review; no transaction is sent at this step.',
  'La conferma firma localmente e trasmette al nodo solo la transazione firmata. Il riepilogo scade dopo un minuto.': 'Confirming signs locally and sends only the signed transaction to the node. The review expires after one minute.',
  'Conferma e invia BLOZ sulla mainnet': 'Confirm and send BLOZ on mainnet',
  'Annulla invio': 'Cancel transfer',
  'Recupero nel wallet ufficiale (prova privata)': 'Recovery in the official wallet (test)',
  'Il descrittore contiene la chiave privata. Mostralo solo per una prova locale con BLOZ Core avviato in mainnet. Non inviarlo a siti o servizi.': 'The descriptor contains your private key. Reveal it only for local recovery using BLOZ Core on mainnet. Do not send it to websites or services.',
  'Chi possiede questi dati può spendere i fondi senza la password del backup. Non inviarli a siti, chat o assistenza. Per lo stesso indirizzo SegWit preferisci il descrittore: la sola WIF non specifica il tipo di indirizzo. Non modificare direttamente wallet.dat.': 'Anyone with this data can spend the funds without the backup password. Do not send it to websites, chats or support. Use the descriptor for the same SegWit address: WIF alone does not specify the address type. Do not edit wallet.dat directly.',
  'Password attuale per mostrare i dati privati': 'Current password to reveal private data',
  'Mostra chiave e descrittore privati': 'Reveal private key and descriptor',
  'Chiave privata WIF': 'WIF private key',
  'Descrittore SegWit per importdescriptors': 'SegWit descriptor for importdescriptors',
  'Importare con timestamp 0 e active false. Il file cifrato di questo prototipo non è un wallet.dat e non è importabile direttamente in Core.': 'Import with timestamp 0 and active false. This prototype’s encrypted file is not a wallet.dat and cannot be imported directly into Core.',
  'La password di questo backup serve a decifrare il file nel web wallet. BLOZ Core usa un proprio wallet e una password di cifratura separata: la password del backup web non viene trasferita a Core. Il recupero compatibile riguarda la chiave privata e lo stesso indirizzo, tramite il descrittore.': 'This backup password decrypts the file in the web wallet. BLOZ Core uses its own wallet and separate encryption password: the web backup password is not transferred to Core. Compatible recovery uses the private key and the same address through the descriptor.',
  'Rimuovi la copia da questo browser': 'Remove the copy from this browser',
  'Il file esterno e la relativa password saranno necessari per recuperarla.': 'You will need the external file and its password to recover it.',
  'Ho il backup esterno e voglio rimuovere la copia locale.': 'I have an external backup and want to remove the local copy.',
  'Rimuovi copia locale': 'Remove local copy',
  'IL TUO INDIRIZZO MAINNET': 'YOUR MAINNET ADDRESS',
  'SegWit, dall’inizio.': 'SegWit from the start.',
  'L’indirizzo comparirà quando crei o ripristini il wallet.': 'Your address will appear when you create or restore the wallet.',
  'Nessun wallet aperto': 'No wallet open',
  'Crea sul dispositivo': 'Create on your device',
  'Una chiave casuale, un indirizzo SegWit.': 'One random key, one SegWit address.',
  'Conserva il file cifrato': 'Keep the encrypted file',
  'Almeno due copie esterne su supporti diversi e in luoghi separati, più una copia cloud. Password custodita a parte.': 'At least two external copies on different devices in separate locations, plus a cloud copy. Store the password separately.',
  'Verifica prima di attivare': 'Verify before activating',
  'File, password e indirizzo devono coincidere.': 'File, password and address must match.',
  'Avanzate · Connessione': 'Advanced · Connection',
  'I nodi Pinco Labs sono una scelta predefinita, non un obbligo. Nella tua copia locale puoi configurare altri server Electrum compatibili con BLOZ, anche gestiti da te, oppure usare il tuo nodo BLOZ Core tramite il collegamento RPC locale.': 'Pinco Labs nodes are the default option, not a requirement. In your local copy you can configure other BLOZ-compatible Electrum servers, including your own, or use your BLOZ Core node through the local RPC bridge.',
  'Questa versione richiede due endpoint Electrum WSS distinti per il confronto delle risposte. Abbiamo collaudato i due server Pinco Labs; la compatibilità con installazioni di terzi non è ancora stata collaudata. Il menu mostra i profili configurati, non un elenco di tutti i nodi disponibili.': 'This version requires two distinct Electrum WSS endpoints to compare responses. We tested the two Pinco Labs servers; third-party installations have not yet been tested. The menu lists configured profiles, not every available node.',
  'La connessione serve a leggere la blockchain e trasmettere transazioni già firmate. Cambiarla non cambia chiavi, indirizzo o backup. Scegli soltanto server di cui ti fidi.': 'The connection reads blockchain data and broadcasts already-signed transactions. Changing it does not change keys, address or backup. Choose only servers you trust.',
  'Il gestore del nodo scelto può vedere l’IP della connessione e le richieste pubbliche del wallet. Le sue regole di conservazione dei dati possono differire da quelle di Pinco Labs. Chiavi private e password del backup restano sul dispositivo.': 'The selected node operator can see your connection IP and public wallet queries. Its data retention rules may differ from those of Pinco Labs. Private keys and backup passwords stay on your device.',
  'Questa pagina web usa i nodi Electrum Pinco Labs. Per usare il tuo nodo Core via RPC o server Electrum personali, avvia la copia locale del wallet seguendo la guida qui sopra.': 'This web page uses Pinco Labs Electrum nodes. To use your own Core node via RPC or personal Electrum servers, run the local wallet copy using the guide above.',
  'Connessione configurata': 'Configured connection',
  'Verifica e usa connessione': 'Verify and use connection',
  'Ripristina connessione predefinita': 'Restore default connection',
  'Caricamento configurazione…': 'Loading configuration…',
  'Questa versione pubblica usa solo i server predefiniti. Per aggiungere server alla tua copia locale, configura BLOZ_CONNECTIONS_FILE e riavvia il servizio. Sono richiesti due server WSS distinti. Il profilo nodo locale usa il collegamento RPC sul PC: non inserire password RPC in questa pagina. Consulta la guida inclusa nei sorgenti.': 'This hosted version uses only the default servers. To add servers to your local copy, configure BLOZ_CONNECTIONS_FILE and restart the service. Two distinct WSS servers are required. The local node profile uses the RPC bridge on your PC: do not enter RPC passwords on this page. See the guide included with the source code.',
  'Per aggiungere server alla tua copia locale, configura BLOZ_CONNECTIONS_FILE e riavvia il servizio. Sono richiesti due server WSS distinti. Il profilo nodo locale usa il collegamento RPC sul PC: non inserire password RPC in questa pagina. Consulta la guida inclusa nei sorgenti.': 'To add servers to your local copy, configure BLOZ_CONNECTIONS_FILE and restart the service. Two distinct WSS servers are required. The local node profile uses the RPC bridge on your PC: do not enter RPC passwords on this page. See the guide included with the source code.',
  'Come viene protetto il backup': 'How your backup is protected',
  'Il file protegge la chiave privata con la tua password. Cifratura e apertura avvengono sul tuo dispositivo: la password non viene inserita nel file né inviata ai nodi.': 'The file protects your private key with your password. Encryption and decryption happen on your device: the password is neither stored in the file nor sent to nodes.',
  'Usiamo AES-256-GCM, che cifra i dati e ne verifica l’integrità. La chiave di cifratura viene derivata dalla password con PBKDF2-HMAC-SHA-256, con 600.000 iterazioni per rallentare i tentativi di indovinarla.': 'We use AES-256-GCM to encrypt data and verify its integrity. The encryption key is derived from your password using PBKDF2-HMAC-SHA-256 with 600,000 iterations to slow down password guessing.',
  'Ogni nuova cifratura genera un salt casuale di 128 bit e un IV casuale di 96 bit tramite il generatore crittografico del browser. Il tag di autenticazione è di 128 bit. Anche i parametri di formato e rete sono autenticati. Scaricare un’altra copia dello stesso backup conserva invece lo stesso file cifrato.': 'Each new encryption generates a random 128-bit salt and 96-bit IV using the browser’s cryptographic generator. The authentication tag is 128 bits. Format and network parameters are also authenticated. Downloading another copy of the same backup preserves the same encrypted file.',
  'Il JSON contiene in chiaro i parametri tecnici necessari per aprirlo, ma chiave privata e indirizzo sono cifrati. La robustezza della password resta essenziale: scegli una password lunga e unica, per esempio composta da più parole casuali. Il minimo di 12 caratteri non garantisce da solo una password forte. La cifratura del file non protegge da un dispositivo compromesso mentre il wallet è aperto.': 'The JSON stores the technical decryption parameters in plain text, but the private key and address are encrypted. Password strength remains essential: choose a long, unique password, such as several random words. The 12-character minimum alone does not guarantee strength. File encryption does not protect against a compromised device while the wallet is open.',
  'Blocco dopo 5 minuti di inattività e quando nascondi la pagina. Prima dell’attivazione, una sessione bloccata va ripristinata dal file già scaricato.': 'Locks after 5 minutes of inactivity and when you hide the page. Before activation, a locked session must be restored from the file you downloaded.',
  'Avvertenze e privacy': 'Warnings and privacy',
  'Progetto e contatto pubblico: Pinco Labs ·': 'Project and public contact: Pinco Labs ·',
  '. Non inviare password, chiavi private o backup all’assistenza.': '. Never send passwords, private keys or backups to support.',
  'Condizioni d’uso e avvertenze · testo in revisione': 'Terms and warnings · draft under review',
  'Software sperimentale, sottoposto a revisione interna e non a un audit indipendente. Può contenere difetti: nessuna garanzia assoluta di sicurezza, disponibilità o recupero. Restano salvi i diritti e le responsabilità inderogabili previsti dalla legge.': 'Experimental software, internally reviewed but not independently audited. It may contain defects: there is no absolute guarantee of security, availability or recovery. Mandatory legal rights and responsibilities remain unaffected.',
  'Pinco Labs non custodisce i tuoi fondi e non può recuperare password o backup persi. Per il recupero da file servono il JSON integro e la sua password. Conserva copie su supporti e in luoghi diversi e verificane periodicamente la corrispondenza con il wallet. La copia nel browser può essere cancellata.': 'Pinco Labs does not hold your funds and cannot recover lost passwords or backups. File recovery requires an intact JSON and its password. Keep copies on different devices in separate locations and periodically check that they match the wallet. The browser copy can be erased.',
  'Il cambio password non revoca i vecchi backup. Controlla rete, destinatario, importo e commissioni prima di inviare: il wallet non può annullare una transazione confermata. L’accettazione in mempool non è una conferma; verifica un invio dall’esito incerto prima di ripeterlo.': 'Changing the password does not revoke old backups. Check network, recipient, amount and fees before sending: the wallet cannot reverse a confirmed transaction. Mempool acceptance is not confirmation; check uncertain transfers before retrying.',
  'Proteggi dispositivo, browser ed eventuale account cloud. Un dispositivo o un sito compromesso può mettere a rischio il wallet anche se il codice è aperto. Il testo completo e i dati del gestore sono in preparazione prima della pubblicazione.': 'Protect your device, browser and any cloud account. A compromised device or website can put the wallet at risk even if the code is open source. The full terms and operator details are still being prepared.',
  'Privacy e dati nel browser': 'Privacy and browser storage',
  'Il browser conserva una copia cifrata del wallet e la connessione scelta, fino alla loro rimozione o alla cancellazione dei dati del sito. Conserva un backup esterno verificato prima di cancellarli. Non usiamo strumenti pubblicitari o di profilazione; Cloudflare può usare strumenti tecnici per proteggere il sito.': 'The browser stores an encrypted wallet copy and the selected connection until removed or site data is cleared. Keep a verified external backup before clearing them. We do not use advertising or profiling tools; Cloudflare may use technical tools to protect the site.',
  'I nodi scelti possono associare l’IP alle richieste pubbliche del wallet. I nodi Pinco Labs sono facoltativi: la copia locale permette profili Electrum BLOZ personalizzati o il collegamento RPC al proprio Core. Chiavi private e password non vengono inviate ai nodi.': 'Selected nodes can associate your IP with public wallet queries. Pinco Labs nodes are optional: the local copy supports custom BLOZ Electrum profiles or RPC to your own Core node. Private keys and passwords are not sent to nodes.',
  'Il sito pubblico usa Cloudflare; le connessioni Electrum sono dirette. I nuovi log applicativi dei nostri nodi conservano avvisi ed errori per circa 24 ore con rotazione oraria; i log di sistema e precedenti seguono politiche separate. Non garantiamo anonimato completo. I dettagli sono in revisione prima della pubblicazione.': 'The public site uses Cloudflare; Electrum connections are direct. New application logs on our nodes retain warnings and errors for about 24 hours with hourly rotation; system and older logs follow separate policies. We do not guarantee complete anonymity. Details remain under review.',
  'Licenza del codice · AGPL': 'Code license · AGPL',
  'Copyright © 2026 Pinco Labs. Codice originale sotto GNU AGPL versione 3 o successiva; dipendenze con le rispettive licenze e attribuzioni. La licenza tutela l’accesso al sorgente secondo le sue condizioni e non certifica la sicurezza del software.': 'Copyright © 2026 Pinco Labs. Original code under GNU AGPL version 3 or later; dependencies retain their respective licenses and attributions. The license protects access to source code under its terms and does not certify software security.',
  'Il testo integrale è incluso nei sorgenti e nelle licenze del pacchetto.': 'The full license is included in the source code and package licenses.',
  'Sorgente del wallet': 'Wallet source code',
  'PINCO LABS · VERSIONE SPERIMENTALE': 'PINCO LABS · EXPERIMENTAL VERSION',
  'Nessuna telemetria applicativa': 'No application telemetry',
};

// Runtime messages: backup/session failures and network/transfer feedback.
const runtime = `
Backup scaricato · mostra dettagli|Backup downloaded · show details
Mainnet · prova privata|Mainnet · experimental
Backup verificato · pronto per attivare|Backup verified · ready to activate
In attesa di backup verificato|Waiting for verified backup
Bloccato|Locked
Sessione bloccata. Se non era ancora attiva, ripristinala dal backup scaricato.|Session locked. If it was not yet active, restore it from the downloaded backup.
Operazione interrotta o scaduta. Controlla l’esito prima di riprovare.|Operation interrupted or timed out. Check the outcome before trying again.
Operazione non riuscita.|Operation failed.
Sessione cancellata. Nessuna chiave non cifrata è stata salvata nel browser.|Session cleared. No unencrypted key was saved in the browser.
Lettura scaduta. Saldo non disponibile: riprova.|Read timed out. Balance unavailable: try again.
Chiave mainnet importata come SegWit. Prepara il backup.|Mainnet key imported as SegWit. Prepare your backup.
Invio in corso.|Transfer in progress.
Invio non confermato. Conserva l’ID e aggiorna il saldo: non ripetere un nuovo invio senza verificarne l’esito.|Transfer not confirmed. Keep the transaction ID and refresh the balance: do not send again before checking the outcome.
Commissione non disponibile. Verifica sincronizzazione e connessione del nodo.|Fee unavailable. Check the node connection and synchronization.
Accrediti non disponibili.|Outputs unavailable.
Serve un indirizzo SegWit BLOZ della rete corretta.|A BLOZ SegWit address on the correct network is required.
Lettura in corso. Riprova tra poco.|Read in progress. Try again shortly.
Saldo non disponibile: controlla il nodo locale e riprova se la catena sta cambiando.|Balance unavailable: check the local node and retry if the chain is changing.
WIF di test compresso non valido.|Invalid compressed test WIF.
WIF mainnet compresso non valido.|Invalid compressed mainnet WIF.
Seleziona un backup JSON di massimo 8 KiB.|Select a JSON backup no larger than 8 KiB.
Lettura annullata: pagina bloccata o nascosta.|Read cancelled: page locked or hidden.
Backup valido: password corretta e stesso indirizzo del wallet aperto. Nessun dato è stato modificato.|Valid backup: correct password and the same address as the open wallet. No data was changed.
Il file è valido con questa password, ma appartiene a un altro indirizzo. Non è il backup del wallet aperto.|The file is valid with this password, but belongs to another address. It is not a backup of the open wallet.
Chiave creata localmente. Ora prepara il backup.|Key created locally. Now prepare your backup.
File recuperato e verificato. Puoi attivare il wallet senza un nuovo backup.|File recovered and verified. You can activate the wallet without a new backup.
Download richiesto. Seleziona il file salvato e reinserisci la password per verificarlo.|Download requested. Select the saved file and enter its password again to verify it.
Backup verificato correttamente. Puoi attivare il wallet.|Backup verified successfully. You can activate the wallet.
Backup verificato: password corretta e stesso indirizzo SegWit. Puoi attivare il wallet mainnet.|Backup verified: correct password and the same SegWit address. You can activate the mainnet wallet.
Wallet mainnet attivo. Nel browser è salvata solo la copia cifrata.|Mainnet wallet active. Only the encrypted copy is stored in the browser.
Wallet sbloccato sul dispositivo.|Wallet unlocked on your device.
Backup locale non presente.|No local backup found.
Copia cifrata scaricata. La password resta invariata.|Encrypted copy downloaded. The password is unchanged.
Dati privati visibili. Chi li possiede può spendere i fondi: non condividerli.|Private data is visible. Anyone with it can spend the funds: do not share it.
Conferma la rimozione della copia locale.|Confirm removal of the local copy.
Copia locale rimossa. Conserva il file esterno e la password.|Local copy removed. Keep the external file and password.
Indirizzo pubblico mainnet copiato.|Public mainnet address copied.
Seleziona e copia l’indirizzo mostrato a destra.|Select and copy the address shown on the right.
Confronto dei due server Electrum…|Comparing both Electrum servers…
Lettura del nodo mainnet locale…|Reading the local mainnet node…
Nessun accredito non speso a questo indirizzo.|No unspent outputs at this address.
Connessione non pronta.|Connection not ready.
Sblocca il wallet.|Unlock the wallet.
Commissione non disponibile. Riprova quando il nodo è sincronizzato.|Fee unavailable. Try again when the node is synchronized.
Stima commissione non valida.|Invalid fee estimate.
Commissione basata sulla stima del nodo e sui minimi di relay, per un invio SegWit con un accredito e resto.|Fee based on the node estimate and relay minimums, for a SegWit transfer with one input and change.
Stima storica non disponibile: commissione basata sui minimi attuali del nodo. Non garantisce un tempo di conferma.|Historical estimate unavailable: fee based on current node minimums. Confirmation time is not guaranteed.
Preparazione annullata.|Preparation cancelled.
Controlla destinatario, importo e commissione prima di confermare.|Check the recipient, amount and fee before confirming.
Prepara un nuovo riepilogo.|Prepare a new transfer review.
Riepilogo scaduto. Preparalo nuovamente.|Review expired. Prepare it again.
Dati scaduti: aggiorna il saldo locale.|Data expired: refresh the balance.
Origine non autorizzata o browser non compatibile. Apri il wallet dal suo indirizzo previsto.|Unauthorized origin or unsupported browser. Open the wallet at its intended address.
Pronto. Tutte le operazioni del wallet avvengono nel browser.|Ready. All wallet operations run in your browser.
Electrum Pinco Labs (predefinito)|Pinco Labs Electrum (default)
Verifica rete, ultimo blocco e commissioni…|Checking network, latest block and fees…
Attendi la fine dell’operazione o annulla il riepilogo di invio.|Wait for the operation to finish or cancel the transfer review.
Profilo non disponibile.|Profile unavailable.
Riavvia il servizio locale per abilitare le impostazioni avanzate.|Restart the local service to enable advanced settings.
Formato non consentito.|Format not allowed.
Backup troppo grande.|Backup is too large.
Formato backup non supportato.|Unsupported backup format.
Versione, rete o cifratura non supportata.|Unsupported version, network or encryption.
Backup non valido.|Invalid backup.
Password errata o backup danneggiato/non compatibile.|Incorrect password or damaged/incompatible backup.
La password deve contenere da 12 a 1024 caratteri.|The password must contain 12 to 1024 characters.
Configurazione connessioni non valida.|Invalid connection configuration.
Profilo non valido.|Invalid profile.
Servono due server Electrum.|Two Electrum servers are required.
Indirizzo server non valido.|Invalid server address.
Usare WSS senza credenziali, percorsi o parametri.|Use WSS without credentials, paths or parameters.
Indicare due server distinti.|Specify two distinct servers.
Verifica annullata.|Verification cancelled.
Nodo locale non disponibile o non sincronizzato.|Local node unavailable or not synchronized.
Risposta locale non valida.|Invalid local response.
Header non valido.|Invalid header.
Nodo non aggiornato.|Node is not up to date.
Commissioni non valide.|Invalid fees.
Verifica annullata o server non concordi.|Verification cancelled or servers disagree.
Storico completo non disponibile con il collegamento RPC locale. Il saldo e gli accrediti non spesi restano consultabili. Per lo storico puoi scegliere Electrum: le richieste saranno inviate ai server selezionati.|Full history is unavailable with the local RPC bridge. Balance and unspent outputs remain available. For history you can choose Electrum: queries will be sent to the selected servers.
Aggiorna il saldo per caricare lo storico.|Refresh the balance to load transaction history.
Nessuna transazione trovata per questo indirizzo.|No transactions found for this address.
Dati Electrum incompleti, incoerenti o cambiati. Riprova.|Electrum data is incomplete, inconsistent or changed. Try again.
Electrum: ultimo blocco troppo vecchio o orario incoerente.|Electrum: latest block is too old or its timestamp is inconsistent.
I due Electrum non concordano. Saldo e invio sospesi: riprova.|The two Electrum servers disagree. Balance and transfers are suspended: try again.
Commissione oltre il limite della prova.|Fee exceeds the limit of this version.
Accredito non più disponibile o immaturo. Aggiorna il saldo.|Output no longer available or immature. Refresh the balance.
Endpoint Electrum non consentito.|Electrum endpoint not allowed.
Connessione Electrum scaduta.|Electrum connection timed out.
Electrum disconnesso.|Electrum disconnected.
Richiesta Electrum rifiutata.|Electrum request rejected.
Electrum disconnesso o risposta non valida.|Electrum disconnected or invalid response.
Solo letture Electrum consentite.|Only Electrum read requests are allowed.
Transazione firmata non valida.|Invalid signed transaction.
Esito incerto: controlla l’ID prima di riprovare.|Uncertain outcome: check the transaction ID before retrying.
Parametri non validi.|Invalid parameters.
Troppe richieste Electrum.|Too many Electrum requests.
Rete Electrum non compatibile con BLOZ.|Electrum network is incompatible with BLOZ.
Rete non supportata.|Unsupported network.
WIF compresso di una rete diversa o non valido.|Invalid compressed WIF or wrong network.
Chiave non valida.|Invalid key.
Descrittore non valido.|Invalid descriptor.
Lettura in corso: riprova tra poco.|Read in progress: try again shortly.
Saldo non disponibile. Controlla il nodo locale e riprova.|Balance unavailable. Check your local node and try again.
Risposta del nodo non valida.|Invalid node response.
Importo non valido.|Invalid amount.
Saldo incoerente.|Inconsistent balance.
Accredito non valido.|Invalid output.
Importo non valido: usa il punto e massimo 8 decimali.|Invalid amount: use a decimal point and no more than 8 decimal places.
Importo fuori limite.|Amount outside allowed limits.
Scegli un altro indirizzo mainnet.|Choose a different mainnet address.
Scegli un altro indirizzo di test.|Choose a different test address.
Minimo invio: 0.00001000 BLOZ. Commissione: da 0.00000200 a 0.00100000 BLOZ.|Minimum transfer: 0.00001000 BLOZ. Fee: 0.00000200 to 0.00100000 BLOZ.
Elenco accrediti non valido.|Invalid output list.
Accredito non valido o immaturo.|Invalid or immature output.
Transazione precedente non corrispondente.|Previous transaction does not match.
Accredito non appartenente al wallet.|Output does not belong to this wallet.
Serve un singolo accredito confermato sufficiente; il resto deve essere zero o almeno 0.00001000 BLOZ.|A single sufficient confirmed output is required; change must be zero or at least 0.00001000 BLOZ.
Riepilogo scaduto o wallet diverso. Prepara nuovamente.|Review expired or wallet changed. Prepare it again.
Commissione incoerente.|Inconsistent fee.
Accrediti non disponibili. Controlla il nodo locale e riprova.|Outputs unavailable. Check your local node and try again.
Rete o indirizzo incoerenti.|Network or address mismatch.
Esito incerto: conserva l’ID e aggiorna il saldo prima di un nuovo invio.|Uncertain outcome: keep the transaction ID and refresh the balance before sending again.
Modalità incompatibili.|Incompatible modes.
Sbloccare prima il wallet.|Unlock the wallet first.
Le nuove password non coincidono.|The new passwords do not match.
La nuova password deve essere diversa. Per una copia invariata usa Scarica copia.|The new password must be different. To keep the same password, download another copy.
Wallet modificato o bloccato.|Wallet changed or locked.
Scaricare prima il nuovo backup.|Download the new backup first.
Selezionare il nuovo file appena scaricato.|Select the new file you just downloaded.
Il backup ricostruisce un indirizzo diverso.|The backup recovers a different address.
Verificare prima il nuovo backup.|Verify the new backup first.
Un’altra scheda ha modificato il wallet. Ricaricare.|Another tab changed the wallet. Reload the page.
Questa prova non importa chiavi esterne.|This version does not import external keys.
Esiste già un wallet locale. Rimuoverlo esplicitamente prima di sostituirlo.|A local wallet already exists. Explicitly remove it before replacing it.
Operazione annullata dal blocco o da un altro wallet salvato.|Operation cancelled because the wallet was locked or another wallet was saved.
Creare o ripristinare prima un wallet.|Create or restore a wallet first.
Le password non coincidono.|Passwords do not match.
Operazione annullata dal blocco.|Operation cancelled because the wallet was locked.
Scaricare prima il backup.|Download the backup first.
Selezionare il file appena scaricato.|Select the file you just downloaded.
Wallet modificato o bloccato: ripetere la verifica.|Wallet changed or locked: repeat the verification.
Verificare il backup prima dell’attivazione.|Verify the backup before activation.
Un’altra scheda ha salvato un wallet. Ricaricare.|Another tab saved a wallet. Reload the page.
Nessun wallet salvato.|No saved wallet.
Firma ed esportazione di chiavi non disponibili in questa prova.|Signing and key export are unavailable in this version.
Sbloccare un wallet attivo.|Unlock an active wallet.
Indirizzo SegWit BLOZ non valido per questa rete.|Invalid BLOZ SegWit address for this network.
Solo P2WPKH BLOZ della rete selezionata.|Only BLOZ P2WPKH addresses for the selected network are supported.
Blocco automatico dopo 5 minuti di inattività.|Automatically locked after 5 minutes of inactivity.
Pagina nascosta: sessione bloccata.|Page hidden: session locked.
Pagina chiusa: sessione bloccata.|Page closed: session locked.
Archivio modificato da un’altra scheda.|Storage changed by another tab.
Nuovo file scaricato. La password nel browser non è ancora cambiata: seleziona il nuovo file e verificalo.|New file downloaded. The browser password has not changed yet: select the new file and verify it.
Nuovo backup verificato. Premi Conferma cambio password per aggiornare la copia nel browser.|New backup verified. Press Confirm password change to update the browser copy.
Password cambiata in questo browser. Il nuovo file usa la nuova password; i vecchi file continuano a usare quella vecchia.|Password changed in this browser. The new file uses the new password; old files still use the old password.
Cambio annullato: la copia nel browser e la sua password sono rimaste invariate. Il nuovo file eventualmente scaricato resta valido con la nuova password.|Change cancelled: the browser copy and its password are unchanged. Any new file already downloaded remains valid with the new password.
{0} · blocco {1} · aggiornato alle {2}|{0} · block {1} · updated at {2}
{0} output non spesi · mostrati i 25 più recenti.|{0} unspent outputs · showing the 25 most recent.
{0} output non spesi.|{0} unspent outputs.
Confermato · {0} conferme · ancora {1} blocchi|Confirmed · {0} confirmations · {1} blocks remaining
Ricompensa immatura · {0} conferme · ancora {1} blocchi|Immature reward · {0} confirmations · {1} blocks remaining
Impegnato in mempool · {0} conferme · ancora {1} blocchi|Reserved in mempool · {0} confirmations · {1} blocks remaining
In attesa di conferma · {0} conferme · ancora {1} blocchi|Awaiting confirmation · {0} confirmations · {1} blocks remaining
Confermato · {0} conferme|Confirmed · {0} confirmations
Ricompensa immatura · {0} conferme|Immature reward · {0} confirmations
Impegnato in mempool · {0} conferme|Reserved in mempool · {0} confirmations
In attesa di conferma · {0} conferme|Awaiting confirmation · {0} confirmations
{0} · {1} conferme|{0} · {1} confirmations
Destinatario: {0} · Importo: {1} · Commissione: {2} · Totale addebitato: {3} · Resto al tuo indirizzo: {4}.|Recipient: {0} · Amount: {1} · Fee: {2} · Total debit: {3} · Change to your address: {4}.
Invio in corso. ID: {0}. In caso di errore controlla il saldo prima di ripetere.|Sending. ID: {0}. If an error occurs, check the balance before retrying.
Accettata in mempool: {0}. Aggiorna il saldo e attendi una conferma in un blocco.|Accepted into mempool: {0}. Refresh the balance and wait for confirmation in a block.
{0}. I due server devono concordare; possono associare le richieste al tuo IP. Questo confronto non è una verifica indipendente della catena.|{0}. Both servers must agree; they can associate queries with your IP. This comparison is not independent verification of the chain.
{0}. Lettura dal nodo locale. Storico completo non disponibile in questa modalità.|{0}. Reading from the local node. Full history is unavailable in this mode.
{0} Rimane selezionato: {1}.|{0} Still selected: {1}.
`;
for (const line of runtime.trim().split('\n')) {
  const [source, target] = line.split('|');
  if (!target || Object.hasOwn(english, source)) throw new Error('Invalid or duplicate translation: ' + source);
  english[source] = target;
}
