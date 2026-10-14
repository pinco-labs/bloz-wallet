import { readFile } from 'node:fs/promises';
import { createWalletServer, CSP } from './server.js';
import { validateProfiles } from './src/connections.js';
import { mainnetRpc, assertMainnetReady } from './mainnet-rpc.js';
import { scanMainnet, readMainnetBalance, mainnetFees } from './mainnet-service.js';
import { createSendService } from './send-service.js';
const input = process.env.BLOZ_CONNECTIONS_FILE ? JSON.parse(await readFile(process.env.BLOZ_CONNECTIONS_FILE,'utf8')) : [];
const profiles = validateProfiles(input);
const endpoints = [...new Set(profiles.flatMap(p=>p.endpoints ?? []))];
const server = createWalletServer({ mainnet:true, directory:'dist-electrum', profiles:input,
  localApi:profiles.some(p=>p.type==='local'), csp:CSP.replace("connect-src 'self'", `connect-src 'self' ${endpoints.join(' ')}`),
  readBalance:readMainnetBalance(mainnetRpc), readFees:()=>mainnetFees(mainnetRpc),
  sendService:createSendService(mainnetRpc,{network:'bloz-mainnet',scan:scanMainnet,assertReady:assertMainnetReady}) });
const port = Number(process.env.BLOZ_WALLET_PORT ?? 8091);
if (!Number.isInteger(port) || port<1024 || port>65535) throw new Error('Porta non valida.');
server.listen(port,'127.0.0.1',()=>console.log(`BLOZ Electrum privata: http://127.0.0.1:${port}/`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close());
