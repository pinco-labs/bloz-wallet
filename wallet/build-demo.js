import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const DEMO_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; worker-src 'none'";

export async function buildDemo({ mainnetOffline = false } = {}) {
  const directory = new URL(mainnetOffline ? './dist-mainnet-offline/' : './dist-demo/', import.meta.url);
  await mkdir(directory, { recursive: true });
  const result = await build({ entryPoints: [fileURLToPath(new URL(mainnetOffline ? './src/mainnet-offline-app.js' : './src/demo-app.js', import.meta.url))],
    outfile: fileURLToPath(new URL('./app.js', directory)), bundle: true, format: 'esm', platform: 'browser',
    target: 'es2022', legalComments: 'inline', sourcemap: false, metafile: true });
  for (const path of Object.keys(result.metafile.inputs)) {
    if (/btc-signer|src\/(send|receive)\.js|regtest-rpc|send-service/.test(path.replaceAll('\\', '/'))) throw new Error('La demo contiene moduli di rete o firma transazioni.');
  }
  let html = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');
  html = html.replace(/<details id="check-copy-details">[\s\S]*?<\/details>/, '');
  html = html.replace('<title>BLOZ · Wallet di prova</title>', '<title>Pinco Labs · BLOZ Wallet Demo</title>');
  html = html.replace('<script type="module"', `<meta http-equiv="Content-Security-Policy" content="${DEMO_CSP.replace("; frame-ancestors 'none'", '')}"><meta name="referrer" content="no-referrer"><script type="module"`);
  html = html.replace('WALLET LAB', 'WALLET DEMO').replace('● Regtest · locale', '● Demo · nessun fondo');
  html = html.replace('Un laboratorio locale per creare e recuperare un wallet BLOZ SegWit. Le chiavi vengono elaborate sul tuo dispositivo.', 'Prova la creazione e il recupero di una chiave dimostrativa BLOZ SegWit. File e password vengono elaborati sul tuo dispositivo.');
  html = html.replace(/<aside class="test-banner">[\s\S]*?<\/aside>/, '<aside class="test-banner"><strong>Demo sperimentale — non usare fondi reali.</strong> Crea solo chiavi nuove per questa prova. Non importare il tuo wallet reale. Questa copia non legge saldi, non firma e non invia transazioni.</aside>');
  html = html.replace(/<details><summary>Importa una chiave WIF di test[\s\S]*?<\/details>/, '');
  html = html.replace(/<section aria-label="Ricezione e saldo regtest">[\s\S]*?<details id="recovery-details">[\s\S]*?<\/details>/, '<p>Hai completato la prova di backup e recupero. Questo indirizzo è soltanto dimostrativo: non usarlo per ricevere fondi. Per ripetere la prova puoi bloccare la demo o rimuovere la sola copia locale e recuperare il file.</p>');
  html = html.replaceAll('Crea wallet di test', 'Crea una demo').replaceAll('Attiva wallet di test', 'Attiva demo').replaceAll('Wallet di test attivo', 'Demo attiva');
  html = html.replaceAll('IL TUO INDIRIZZO DI TEST', 'INDIRIZZO DIMOSTRATIVO').replaceAll('PINCO LABS · PROTOTIPO PRIVATO', 'PINCO LABS · ANTEPRIMA DIMOSTRATIVA');
  html = html.replace('Nessuna telemetria · Solo nodo regtest locale', 'Nessuna telemetria · Nessuna connessione alla blockchain');
  html = html.replace('oppure recupera il tuo wallet di test', 'oppure recupera un file creato da questa demo');
  html = html.replace('Backup cifrato (.json)', 'Backup della demo (.json)').replace('Nessun account e nessuna frase seed in questo prototipo.', 'Nessun account. Solo backup creati da questa demo, separati dai wallet del laboratorio.');
  if (/id="(send-form|wif-form|recovery|refresh-balance)"/.test(html)) throw new Error('Controlli non dimostrativi rimasti nella pagina.');
  if (mainnetOffline) {
    html = html.replaceAll('BLOZ Wallet Demo', 'BLOZ · Prova mainnet offline')
      .replace('WALLET DEMO', 'MAINNET OFFLINE').replace('● Demo · nessun fondo', '● Mainnet offline · non finanziare')
      .replaceAll('INDIRIZZO DIMOSTRATIVO', 'INDIRIZZO MAINNET DI PROVA')
      .replaceAll('PINCO LABS · ANTEPRIMA DIMOSTRATIVA', 'PINCO LABS · PROVA PRIVATA OFFLINE')
      .replaceAll('Crea una demo', 'Crea una chiave di prova').replaceAll('Attiva demo', 'Completa la prova')
      .replaceAll('Demo attiva', 'Prova locale completata').replaceAll('della demo', 'della prova mainnet offline')
      .replaceAll('questa demo', 'questa prova mainnet offline')
      .replaceAll('bloccare la demo', 'bloccare la prova')
      .replaceAll('Questo indirizzo è soltanto dimostrativo:', 'Questo indirizzo mainnet è riservato al collaudo offline:');
    html = html.replace(/<aside class="test-banner">[\s\S]*?<\/aside>/, '<aside class="test-banner"><strong>Prova privata mainnet offline — non inviare fondi.</strong> Gli indirizzi bz1q sono del formato mainnet. Questa versione verifica soltanto creazione e recupero: non legge saldi, non firma e non invia. Usa solo chiavi nuove dedicate alla prova.</aside>');
    html = html.replace('Prova la creazione e il recupero di una chiave dimostrativa BLOZ SegWit.', 'Verifica creazione e recupero di una chiave BLOZ SegWit con indirizzo mainnet, senza collegarti alla rete.');
  }
  await writeFile(new URL('./index.html', directory), html);
  await copyFile(new URL('./public/style.css', import.meta.url), new URL('./style.css', directory));
  await writeFile(new URL('./_headers', directory), `/*\n  Content-Security-Policy: ${DEMO_CSP}\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Cross-Origin-Opener-Policy: same-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=()\n`);
  let licenses = 'BLOZ Wallet Demo — dependency notices\n';
  for (const name of ['noble-curves.txt', 'noble-hashes.txt', 'scure-base.txt']) licenses += `\n--- ${name} ---\n${await readFile(new URL('./licenses/' + name, import.meta.url), 'utf8')}`;
  await writeFile(new URL('./LICENSES.txt', directory), licenses);
  const allowed = ['app.js', 'index.html', 'style.css', '_headers', 'LICENSES.txt'];
  if ((await readdir(directory)).some((name) => !allowed.includes(name))) throw new Error('File estraneo nella cartella demo: rivedere prima di distribuire.');
  console.log(`${mainnetOffline ? 'Mainnet offline' : 'Demo'} compilata separatamente: nessuna API, RPC o firma di transazioni.`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await buildDemo();
