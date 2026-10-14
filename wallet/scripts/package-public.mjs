import { readFile,writeFile,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ELECTRUM_ENDPOINTS } from '../src/electrum-read.js';
const origin=process.argv[2];
if(!origin) throw Error('Indicare il dominio HTTPS effettivo: nessuna destinazione predefinita.');
const build=spawnSync(process.execPath,[fileURLToPath(new URL('../build-mainnet.js',import.meta.url)),'--public',origin],{stdio:'inherit'});
if(build.status!==0)process.exit(build.status??1);
const dir=new URL('../dist-public/',import.meta.url);
await writeFile(new URL('connections.json',dir),'[]\n');
let notices='BLOZ wallet — Copyright (C) 2026 Pinco Labs\nSPDX-License-Identifier: AGPL-3.0-or-later\n\n';
notices+=await readFile(new URL('../LICENSE',import.meta.url),'utf8');
notices+='\n\nThird-party notices (original licenses retained)\n';
for(const name of (await readdir(new URL('../licenses/',import.meta.url))).sort()) notices+=`\n--- ${name} ---\n${await readFile(new URL('../licenses/'+name,import.meta.url),'utf8')}`;
await writeFile(new URL('LICENSES.txt',dir),notices);
const csp=`default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self' ${ELECTRUM_ENDPOINTS.join(' ')}; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; worker-src 'none'`;
await writeFile(new URL('_headers',dir),`/*\n  Content-Security-Policy: ${csp}\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Cross-Origin-Opener-Policy: same-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=()\n  Strict-Transport-Security: max-age=31536000\n`);
const allowed=['index.html','app.js','style.css','connections.json','LICENSES.txt','_headers','manifest.json'];
const names=await readdir(dir);
if(names.some(n=>!allowed.includes(n)))throw Error('File estraneo nella directory pubblica: pacchetto rifiutato.');
const files=[];
for(const name of allowed.filter(n=>n!=='manifest.json')){
  const data=await readFile(new URL(name,dir));
  files.push({name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
const artifactId=createHash('sha256').update(JSON.stringify(files)).digest('hex');
await writeFile(new URL('manifest.json',dir),JSON.stringify({origin,artifactId,files,publicationApproved:false,notice:'_headers must be applied by hosting, not merely served as a file.'},null,2)+'\n');
console.log(JSON.stringify({origin,artifactId,files:files.length,publicationApproved:false}));
