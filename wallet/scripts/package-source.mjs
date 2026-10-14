import { mkdir,readFile,writeFile,readdir,copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const source=new URL('../',import.meta.url);
const rootFiles=['package.json','package-lock.json','source-lock.json','connections.example.json','README.md','LOCAL-START.md','THIRD-PARTY.md','SECURITY-REVIEW-INTERNAL.md','LICENSING.md','TERMS-DRAFT.md','PRIVACY-DRAFT.md','.gitignore'];
for(const item of await readdir(source,{withFileTypes:true}))if(item.isFile()&&item.name.endsWith('.js'))rootFiles.push(item.name);
const names=[...rootFiles];
async function visit(relative){for(const entry of await readdir(new URL(relative+'/',source),{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlink non consentito');
  const name=relative+'/'+entry.name;
  if(entry.isDirectory())await visit(name);else if(entry.isFile())names.push(name);
}}
for(const dir of ['src','public','test','scripts','licenses'])await visit(dir);
try{await readFile(new URL('LICENSE',source));names.push('LICENSE');}catch{}
const entries=[];
for(const name of names.sort()){
  if(!/\.(js|mjs|py|json|md|txt|html|css)$/.test(name)&&!['LICENSE','.gitignore'].includes(name))throw Error('File non ammesso: '+name);
  const bytes=await readFile(new URL(name,source));
  entries.push({path:'wallet/'+name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const id=createHash('sha256').update(JSON.stringify(entries)).digest('hex');
const output=new URL(`../work/wallet-source-${id.slice(0,16)}/`,source);
await mkdir(output,{recursive:false});
for(const entry of entries){const destination=new URL(entry.path,output);await mkdir(new URL('./',destination),{recursive:true});await copyFile(new URL(entry.path.slice(7),source),destination);}
await writeFile(new URL('README.md',output),'# BLOZ Wallet — Pinco Labs\n\nGuida: [Avvio locale](wallet/LOCAL-START.md).\nRevisione: [Rapporto interno](wallet/SECURITY-REVIEW-INTERNAL.md).\n\nCandidata locale: nessuna pubblicazione automatica.\n');
await writeFile(new URL('source-manifest.json',output),JSON.stringify({id,files:entries,publicationApproved:false},null,2)+'\n');
console.log(JSON.stringify({id,path:fileURLToPath(output),files:entries.length,licenseIncluded:names.includes('LICENSE')}));
