# Dipendenze e attribuzioni

Le versioni dirette sono esatte; `package-lock.json` conserva il grafo e gli
hash di integrità npm. Nessuna libreria viene caricata da una CDN a runtime.

| Componente | Versione | Uso | Licenza |
|---|---|---|---|
| @noble/curves | 2.4.0 | Chiave/pubblica secp256k1 e generazione casuale | [MIT](licenses/noble-curves.txt) |
| @noble/hashes | 2.4.0 | SHA-256, RIPEMD-160 | [MIT](licenses/noble-hashes.txt) |
| @scure/base | 2.4.0 | Base58Check, Bech32, Base64 | [MIT](licenses/scure-base.txt) |
| @scure/btc-signer | 2.4.1 | Transazioni e firma SegWit locale | [MIT](licenses/scure-btc-signer.txt) |
| micro-packed | 0.11.1 | Serializzazione binaria (dipendenza del signer) | [MIT](licenses/micro-packed.txt) |
| esbuild | 0.28.2 | Solo compilazione del bundle | [MIT](licenses/esbuild.txt) |

La cifratura AES-GCM e PBKDF2 usa Web Crypto del browser.
Il checksum dei descrittori in `src/keys.js` adatta l'algoritmo del sorgente
Bitcoin Core/BLOZ Core, commit indicato in `source-lock.json`.
Copyright (c) 2018-present The Bitcoin Core developers;
copyright (c) 2019 Pieter Wuille per la corrispondente implementazione di test.
La [licenza originale MIT](licenses/blockzero-core.txt) è conservata integralmente.

Queste attribuzioni riguardano il wallet e **non risolvono la questione della
licenza della patch BLOZ al miner**, che resta sospesa e separata.
