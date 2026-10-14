import { Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { addressScript } from './src/address.js';
import { scanSnapshot } from './balance.js';
import { assertIsolated } from './regtest-rpc.js';
import { toRex } from './src/money.js';

export function createSendService(rpc, { network = 'bloz-regtest', scan = scanSnapshot, assertReady = assertIsolated } = {}) {
  return {
    async coins(address) {
      const script = addressScript(address, network), state = await scan(rpc, address), coins = [];
      for (const [outpoint, output] of state.outputs) {
        const confirmations = state.height - output.height + 1;
        if (output.script !== script || state.spent.has(outpoint) || confirmations < (output.coinbase ? 100 : 1)) continue;
        if (coins.length >= 500) throw new Error('Troppi accrediti.');
        const block = await rpc('getblockhash', [output.height]);
        const raw = await rpc('getrawtransaction', [output.txid, false, block]);
        coins.push({ txid: output.txid, vout: output.n, confirmations, coinbase: output.coinbase, raw });
      }
      await assertReady(rpc);
      return { network, address, coins };
    },
    async broadcast(raw) {
      if (typeof raw !== 'string' || raw.length > 2000 || !/^(?:[0-9a-f]{2})+$/.test(raw)) throw new Error('Transazione non valida.');
      const tx = Transaction.fromRaw(hex.decode(raw));
      if (tx.inputsLength !== 1 || tx.outputsLength < 1 || tx.outputsLength > 2 || !tx.hasWitnesses) throw new Error('Solo invii SegWit semplici.');
      for (let i = 0; i < tx.outputsLength; i++) {
        const output = tx.getOutput(i);
        if (!/^0014[0-9a-f]{40}$/.test(hex.encode(output.script)) || output.amount < 1000n) throw new Error('Output non consentito.');
      }
      await assertReady(rpc);
      // Retrying the same signed transaction is idempotent while it is in the pool.
      if ((await rpc('getrawmempool')).includes(tx.id)) return { txid: tx.id };
      const input = tx.getInput(0);
      const prev = await rpc('gettxout', [hex.encode(input.txid), input.index, true]);
      if (!prev || prev.confirmations < (prev.coinbase ? 100 : 1) || !/^0014[0-9a-f]{40}$/.test(prev.scriptPubKey.hex)) throw new Error('Accredito speso, immaturo o non disponibile.');
      let outputSum = 0n;
      for (let i = 0; i < tx.outputsLength; i++) outputSum += tx.getOutput(i).amount;
      const fee = toRex(prev.value) - outputSum;
      if (fee < 200n || fee > 100_000n) throw new Error('Commissione fuori limite.');
      const [check] = await rpc('testmempoolaccept', [[raw], 0.01]);
      if (!check?.allowed || check.txid !== tx.id) throw new Error('Transazione rifiutata dal nodo regtest.');
      await assertReady(rpc);
      const txid = await rpc('sendrawtransaction', [raw, 0.01]);
      if (txid !== tx.id) throw new Error('Esito incoerente.');
      return { txid };
    },
  };
}
