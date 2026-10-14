import { regtestRpc, assertIsolated } from '../regtest-rpc.js';
import { addressScript } from '../src/address.js';
const address = process.argv[2], blocks = Number(process.argv[3] ?? 1);
addressScript(address);
if (!Number.isInteger(blocks) || blocks < 1 || blocks > 101) throw new Error('Da 1 a 101 blocchi per prova.');
const rpc = regtestRpc({ control: true });
const chain = await assertIsolated(rpc);
if (chain.blocks + blocks > 500) throw new Error('Limite del laboratorio: 500 blocchi.');
console.log(`Generazione esplicita di ${blocks} blocchi regtest, un solo thread. Nessun fondo reale.`);
// Small rounds permit progress and re-check the isolation boundary between rounds.
for (let n = 0; n < blocks; n++) {
  await assertIsolated(rpc);
  const result = await rpc('generatetoaddress', [1, address, 10000, 1]);
  if (result.length !== 1) throw new Error('Nessun blocco generato: limite tentativi raggiunto.');
  console.log(`Blocco di prova ${n + 1}/${blocks} confermato.`);
}
