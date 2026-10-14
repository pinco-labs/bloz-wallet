import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const publicBuild = process.argv.includes('--public');
const publicOrigin = publicBuild ? process.argv[process.argv.indexOf('--public') + 1] : '';
if (publicBuild) {
  const url = new URL(publicOrigin);
  if (url.protocol !== 'https:' || url.origin !== publicOrigin || url.username || url.password) throw new Error('Specificare una origine HTTPS esatta senza percorso o credenziali.');
}
const electrum = publicBuild || process.argv.includes('--electrum');
const directory = new URL(publicBuild ? './dist-public/' : electrum ? './dist-electrum/' : './dist-mainnet/', import.meta.url);
await mkdir(directory, { recursive: true });
await build({ entryPoints: [fileURLToPath(new URL('./src/app.js', import.meta.url))],
  outfile: fileURLToPath(new URL('./app.js', directory)), bundle: true, format: 'esm', platform: 'browser',
  target: 'es2022', legalComments: 'inline', sourcemap: false, define: { __BLOZ_MAINNET__: 'true', __BLOZ_ELECTRUM__: String(electrum), __BLOZ_PUBLIC_ORIGIN__: JSON.stringify(publicOrigin) } });
let html = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');
html = html.replace('<title>BLOZ · Wallet di prova</title>', '<title>BLOZ · Mainnet privata</title>')
  .replace('WALLET LAB', 'MAINNET PRIVATA').replace('● Regtest · locale', '● Mainnet · piccoli importi')
  .replace(/<aside class="test-banner">[\s\S]*?<\/aside>/, '<aside class="test-banner"><strong>Prova privata su mainnet.</strong> Usa soltanto una chiave nuova e piccole somme dedicate al collaudo. Controlla destinatario, importo, commissione e totale prima di confermare. Firma e chiavi restano nel browser.</aside>')
  .replace('<details><summary>Importa una chiave WIF di test', '<details hidden><summary>Importa una chiave WIF di test')
  .replaceAll('bzrt1q', 'bz1q').replaceAll('BLOZ regtest', 'BLOZ mainnet')
  .replaceAll('Regtest', 'Mainnet').replaceAll('regtest', 'mainnet').replaceAll('di test', 'mainnet')
  .replaceAll('monete di prova', 'piccoli importi BLOZ').replaceAll('solo test', 'prova privata')
  .replace('Solo chiavi mainnet compresse.', 'Importazione esterna non disponibile in questa prova.')
  .replace('IL TUO INDIRIZZO DI TEST', 'IL TUO INDIRIZZO MAINNET')
  .replace('Conferma e invia sulla mainnet', 'Conferma e invia BLOZ sulla mainnet')
  .replace('value="0.00001000" required', 'value="" readonly placeholder="Calcolata preparando il riepilogo"')
  .replace('Commissione totale BLOZ', 'Commissione stimata BLOZ')
  .replace('Questa è una stima UTXO, non una verifica completa di spendibilità.', 'Gli accrediti devono essere confermati. Per spendere output storici serve anche il relativo blocco, che potrebbe non essere più disponibile sul nodo con spazio limitato.')
  .replace('Un laboratorio locale per creare e recuperare un wallet BLOZ SegWit.', 'Un wallet locale BLOZ SegWit per una prova privata su mainnet.');
html = html.replace('<div id="send-review"', '<p id="fee-note">La commissione viene calcolata dal nodo preparando il riepilogo; non viene inviata alcuna transazione in questo passaggio.</p><div id="send-review"');
html = html.replace('<label for="restore-file">', '<p>Accetta solo backup della versione mainnet privata. I file della demo 8087 e della prova offline 8088 restano separati.</p><label for="restore-file">')
  .replace('WIF non distingue mainnet da altre reti mainnet: verifica sempre la provenienza. Le chiavi mainnet vengono rifiutate.', 'Crea una chiave nuova dedicata a questo collaudo.');
if (electrum) html = html.replace('MAINNET PRIVATA', 'ELECTRUM · PROVA PRIVATA')
  .replace('al servizio locale esclusivamente l’indirizzo pubblico', 'ai due server Electrum l’impronta dello script pubblico. I server possono associare indirizzo e IP; password e chiavi non vengono trasmesse')
  .replace('Solo nodo mainnet locale', 'Connessione diretta ai due Electrum Pinco Labs')
  .replace('Gli accrediti devono essere confermati. Per spendere output storici serve anche il relativo blocco, che potrebbe non essere più disponibile sul nodo con spazio limitato.', 'Gli accrediti devono essere confermati. I due server devono concordare. Le prove delle transazioni vengono controllate rispetto agli header forniti dai server: questa versione non verifica autonomamente tutta la catena Proof of Work. Limite della prova: 100 transazioni per indirizzo.')
  .replace('<section aria-label="Invio mainnet">', '<details><summary>Storico transazioni</summary><ul id="history-list" class="utxo-list"></ul></details><section aria-label="Invio mainnet">');
if (publicBuild) {
  const commit = process.env.BLOZ_SOURCE_COMMIT;
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('BLOZ_SOURCE_COMMIT deve identificare il sorgente pubblicato.');
  html = html.replace('id="source-link" href="https://github.com/pinco-labs/bloz-wallet"', `id="source-link" href="https://github.com/pinco-labs/bloz-wallet/tree/${commit}"`);
  html = html.replace('<meta charset="utf-8">', '<meta name="robots" content="noindex, nofollow"><meta charset="utf-8">');
  html = html.replace('Un wallet locale BLOZ SegWit per una prova privata su mainnet.', 'Un wallet BLOZ SegWit sperimentale su mainnet.');
  html = html.replaceAll('MAINNET PRIVATA','MAINNET SPERIMENTALE').replaceAll('Mainnet privata','Mainnet sperimentale').replaceAll('PROVA PRIVATA','VERSIONE SPERIMENTALE').replaceAll('Prova privata su mainnet.','Versione sperimentale su mainnet.');
  html = html.replace('<form id="connection-form">', '<p id="public-connection-note">Questa pagina web usa i nodi Electrum Pinco Labs. Per usare il tuo nodo Core via RPC o server Electrum personali, avvia la copia locale del wallet seguendo la guida qui sopra.</p><form id="connection-form">');
  html = html.replace('Per aggiungere server alla tua copia locale,', 'Questa versione pubblica usa solo i server predefiniti. Per aggiungere server alla tua copia locale,');
}
await writeFile(new URL('./index.html', directory), html);
await copyFile(new URL('./public/style.css', import.meta.url), new URL('./style.css', directory));
console.log(publicBuild ? `Candidata HTTPS compilata per ${publicOrigin}; non pubblicata.` : 'Mainnet privata compilata, origine locale separata.');
