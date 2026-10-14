import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DATA_DIR, RPC_PORT, regtestRpc, assertIsolated } from '../regtest-rpc.js';
import { setTimeout as delay } from 'node:timers/promises';

const source = JSON.parse(await readFile(new URL('../source-lock.json', import.meta.url), 'utf8'));
const binary = fileURLToPath(new URL('../../work/wallet-source/core-cli/blockzero-v1.0.0-rc38-windows-x64-cli/bin/bitcoind.exe', import.meta.url));
if (createHash('sha256').update(await readFile(binary)).digest('hex') !== source.testBinary.executableSha256) throw new Error('Binario BLOZ diverso dalla release verificata.');
await mkdir(DATA_DIR, { recursive: true });
const child = spawn(binary, ['-regtest', `-datadir=${DATA_DIR}`, '-nosettings', '-server=1', '-disablewallet=1',
  '-listen=0', '-connect=0', '-dnsseed=0', '-discover=0', '-networkactive=0', '-rpcbind=127.0.0.1',
  `-rpcport=${RPC_PORT}`, '-printtoconsole=0', '-par=1'], { windowsHide: true, stdio: 'ignore' });
child.on('error', () => { console.error('Avvio del nodo regtest fallito.'); process.exitCode = 1; });
const rpc = regtestRpc({ control: true });
let ready = false;
for (let i = 0; i < 100 && child.exitCode === null; i++) {
  try { await assertIsolated(rpc); ready = true; break; } catch { await delay(200); }
}
if (!ready) { child.kill(); throw new Error('Nodo regtest non avviato; controllare il log nella directory dedicata.'); }
console.log('BLOZ regtest isolato pronto. Wallet Core disabilitato; nessuna generazione automatica.');
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  try { await rpc('stop'); } catch { child.kill(); }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop);
child.on('exit', (code) => { process.exitCode = code ?? 1; });
