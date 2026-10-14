import { createWalletServer } from './server.js';
import { mainnetRpc, assertMainnetReady } from './mainnet-rpc.js';
import { scanMainnet, readMainnetBalance, mainnetFees } from './mainnet-service.js';
import { createSendService } from './send-service.js';
const server = createWalletServer({ mainnet: true, readBalance: readMainnetBalance(mainnetRpc),
  readFees: () => mainnetFees(mainnetRpc),
  sendService: createSendService(mainnetRpc, { network: 'bloz-mainnet', scan: scanMainnet, assertReady: assertMainnetReady }) });
server.listen(8090, '127.0.0.1', () => console.log('BLOZ Mainnet privata — http://127.0.0.1:8090'));
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
