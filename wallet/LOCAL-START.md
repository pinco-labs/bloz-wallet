# Avvia BLOZ Wallet sul tuo PC

Il wallet è non custodial: chiavi, password e firma restano nel browser.
Pinco Labs non custodisce fondi e non può recuperare password o backup persi.

Per l’uso abituale consigliamo questa copia locale, preferibilmente con il tuo
Core tramite RPC oppure server Electrum gestiti da te. I server predefiniti
Pinco Labs e la pagina web restano alternative disponibili. La copia locale
non elimina la necessità di proteggere dispositivo, dipendenze e aggiornamenti.

1. Installa Node.js **24 LTS** dal sito ufficiale Node.js.
2. Scarica da GitHub la versione indicata da Pinco Labs, estrai lo ZIP e apri
   il terminale nella cartella che contiene `wallet`.
   Repository ufficiale: https://github.com/pinco-labs/bloz-wallet.
3. Installa le dipendenze bloccate alle versioni previste:

   ```sh
   npm ci --prefix wallet
   ```

4. Compila e avvia:

   ```sh
   npm run build:electrum --prefix wallet
   npm run electrum --prefix wallet
   ```

5. Apri **http://127.0.0.1:8091/**. Lascia aperto il terminale.
   Per fermare il servizio premi **Ctrl+C** nel terminale.

Non aprire index.html direttamente: serve il servizio locale. Se la porta è
occupata, chiudi la precedente istanza oppure configura BLOZ_WALLET_PORT.
Cambiare porta cambia anche l'archivio del browser: conserva il backup.

## Crea o recupera

Per una nuova chiave: crea, scarica il backup cifrato e verifica il file prima
di attivare. Per un wallet esistente: seleziona il JSON e usa la sua password.
Il sito pubblico e la copia locale hanno archivi del browser separati.
Conserva copie esterne su supporti distinti; non affidarti alla sola memoria
del browser. Un cambio password non revoca i file precedenti.

## Connessione

L'avvio predefinito usa i due server Electrum Pinco Labs, ma usarli non è
obbligatorio. Puoi configurare altri server compatibili con BLOZ, anche tuoi:
questa versione richiede una coppia di endpoint WSS distinti e mostra nel menu
soltanto i profili configurati. Sono stati collaudati i nodi Pinco Labs; i nodi
di terzi restano da collaudare. In alternativa puoi usare il tuo nodo BLOZ Core
tramite il bridge RPC locale, senza comunicare le credenziali RPC alla pagina.

Locale non significa
offline: leggere saldo e trasmettere transazioni richiede la rete. I server
possono associare IP e richieste pubbliche; non ricevono la chiave privata.
Per server propri o nodo RPC locale consulta le impostazioni avanzate nel
README. Il bridge RPC attuale richiede Windows e WSL Ubuntu-24.04, mentre
l'avvio Electrum non richiede BLOZ Core sul PC.

## Verifiche e limiti

`npm test --prefix wallet` esegue i test automatici senza fondi reali.
I test opzionali con Core richiedono separatamente il binario ufficiale
verificato e, dove indicato, i sorgenti fissati in source-lock.json: non sono
inclusi nel download. Leggi SECURITY-REVIEW-INTERNAL.md: è una revisione interna,
non un audit indipendente. Il software resta sperimentale. Proteggi sistema,
browser e backup; non usare copie di provenienza incerta.
