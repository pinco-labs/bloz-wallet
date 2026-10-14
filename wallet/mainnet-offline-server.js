import { createDemoServer } from './demo-server.js';
const server = createDemoServer({ mainnetOffline: true });
server.listen(8088, '127.0.0.1', () => console.log('BLOZ Mainnet offline — http://127.0.0.1:8088'));
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
