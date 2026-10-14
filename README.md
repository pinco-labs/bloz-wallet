# BLOZ Wallet — Pinco Labs

Wallet SegWit non custodial, versione sperimentale per revisione. Chiavi e
password restano sul dispositivo; la firma avviene nel browser.

Consigliamo l'[avvio locale](wallet/LOCAL-START.md), preferibilmente con il
proprio Core via RPC oppure server Electrum gestiti dall'utente. I due nodi
Pinco Labs restano un'alternativa predefinita.

- [Revisione interna di sicurezza](wallet/SECURITY-REVIEW-INTERNAL.md): non audit indipendente.
- [Licenza e attribuzioni](wallet/LICENSING.md): AGPL-3.0-or-later, licenze dei terzi preservate.
- [Limiti e funzionamento](wallet/README.md).
- [Informazioni tecniche privacy in revisione](wallet/PRIVACY-DRAFT.md).

Questa versione non è un nodo completo: non verifica autonomamente tutta
la Proof of Work e usa per default due server dello stesso operatore.
Usare soltanto piccoli importi dedicati al collaudo. Nessuna garanzia assoluta.

## Verifica e build

Richiede Node.js 24 o successivo.

```sh
npm ci --prefix wallet
npm test --prefix wallet
npm run build:electrum --prefix wallet
npm run electrum --prefix wallet
```

Per l'artefatto HTTPS impostare BLOZ_SOURCE_COMMIT al commit sorgente e poi:

```sh
node wallet/scripts/package-public.mjs https://wallet-bloz.pinco-labs.com
```

Il manifest contiene gli hash dei file. Le intestazioni in _headers devono
essere applicate dal server, non basta pubblicare il file.

Contatto: info@pinco-labs.com. Non inviare chiavi, password o backup.
