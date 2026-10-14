# BLOZ Wallet — Pinco Labs

**An experimental, non-custodial, open-source SegWit wallet for BLOZ.**

Built by Pinco Labs as a contribution to the BLOZ community.

[Open the wallet](https://wallet-bloz.pinco-labs.com/) · [Italiano](README.it.md) · [License](LICENSE)

Private keys and passwords stay on your device. Transactions are signed in
your browser. Pinco Labs does not hold your funds and cannot recover lost
passwords or backups.

## Run locally

For regular use, we encourage running your own copy, preferably with your own
Core node or Electrum servers. The hosted wallet and the default Pinco Labs
servers remain available alternatives. Running locally still requires a
protected device and trusted software updates.

Install **Node.js 24 or later**, download and extract this repository, and
open a terminal in the repository root (the folder containing `wallet`):

```sh
npm ci --prefix wallet
npm run build:electrum --prefix wallet
npm run electrum --prefix wallet
```

Open **http://127.0.0.1:8091/** in a modern browser with Web Crypto and Web Locks
support. Keep the terminal open; press **Ctrl+C** to stop the server.
Do not open `index.html` directly or substitute `localhost` for `127.0.0.1`.

The default connection uses two Pinco Labs Electrum servers. The local copy
supports custom connection profiles; the hosted version uses only the default
servers. Custom Electrum profiles require two distinct WSS endpoints.
The current Core RPC bridge requires Windows with WSL Ubuntu-24.04. The default
Electrum setup does not require Core on your PC.

See the [detailed local setup guide](wallet/LOCAL-START.md) and
[advanced configuration and technical notes](wallet/README.md), currently in
Italian. The technical notes also contain earlier development-stage information;
consult the [release review](RELEASE-REVIEW.md) for the reviewed deployment.

## Features and backups

- Native SegWit addresses (P2WPKH), balances, transaction history, and transfers.
- Encrypted JSON backups, recovery, and standalone backup verification.
- Separate actions for downloading the current backup and changing its password.
- Local signing and automatic wallet locking.

For a new wallet, download the encrypted JSON and verify the downloaded file
before activation. To restore an existing wallet, select its JSON backup and
enter that file's password; creating another backup is not mandatory.

Keep backup copies on separate storage devices and safeguard your password.
Browser storage alone is not a backup. The hosted site and local copy have
separate browser storage; use your encrypted backup to restore the same wallet.
Changing the password does not revoke older backup files, which still use
their original passwords. **A password alone cannot recover a lost key.**

## Security and current limits

This is an **experimental release**: start with small amounts.

- Backup encryption uses AES-256-GCM with PBKDF2-HMAC-SHA-256 (600,000 iterations).
- The wallet checks transaction data and Merkle proofs against server-provided
  headers and compares its two Electrum sources. It is **not a full node** and
  does not independently verify the entire Proof-of-Work chain. Both default
  servers belong to the same operator.
- Current limits include 100 history transactions, 500 UTXOs per address,
  and one input per transfer.
- Node operators can see connection IPs and public blockchain queries.
- Backup encryption does not protect an unlocked wallet from a compromised
  device, browser extension, or maliciously modified wallet code.

An [internal security review](wallet/SECURITY-REVIEW-INTERNAL.md) and an
[updated release review](RELEASE-REVIEW.md) are available in this repository
(currently in Italian). **These are not independent third-party audits or a
guarantee that the software is free of vulnerabilities.**

## Tests and public builds

Run the automated tests:

```sh
npm test --prefix wallet
```

For a public HTTPS build, set the `BLOZ_SOURCE_COMMIT` environment variable to
the exact 40-character source commit, then run:

```sh
node wallet/scripts/package-public.mjs https://wallet-bloz.pinco-labs.com
```

The generated manifest records file hashes. The web server must apply the
headers specified in `_headers`; merely uploading that file does not apply them.
The public build is restricted to its configured HTTPS origin.

## License, documentation, and feedback

Pinco Labs code is licensed under **AGPL-3.0-or-later**. Third-party licenses
and attributions are preserved. See [licensing](wallet/LICENSING.md) and
[third-party notices](wallet/THIRD-PARTY.md).

[Technical privacy information](wallet/PRIVACY-DRAFT.md) and
[terms and usage warnings](wallet/TERMS-DRAFT.md) are currently Italian drafts
under review.

Bug reports, code reviews, and contributions are welcome through
[GitHub Issues](https://github.com/pinco-labs/bloz-wallet/issues).
Contact: **info@pinco-labs.com**. Never send private keys, passwords, or backups.
