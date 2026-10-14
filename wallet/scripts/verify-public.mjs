import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir=new URL('../dist-public/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',dir),'utf8'));
assert.deepEqual((await readdir(dir)).sort(),[...manifest.files.map(f=>f.name),'manifest.json'].sort());
for(const file of manifest.files){
  assert.ok(['app.js','index.html','style.css','connections.json','LICENSES.txt','_headers'].includes(file.name));
  const bytes=await readFile(new URL(file.name,dir));
  assert.equal(bytes.length,file.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
}
assert.equal(createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'),manifest.artifactId);
assert.deepEqual(JSON.parse(await readFile(new URL('connections.json',dir),'utf8')),[]);
const html=await readFile(new URL('index.html',dir),'utf8');
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html));
assert.ok(!/\son[a-z]+\s*=/i.test(html));
assert.ok(!/\b(?:src|href)=["'](?:https?:)?\/\//i.test(html));
const headers=await readFile(new URL('_headers',dir),'utf8');
assert.ok(!headers.includes('unsafe-inline')&&!headers.includes('unsafe-eval'));
for(const required of ["frame-ancestors 'none'","object-src 'none'",'no-store','nosniff','Strict-Transport-Security'])assert.ok(headers.includes(required));
console.log(JSON.stringify({artifactId:manifest.artifactId,origin:manifest.origin,integrity:'passed',staticChecks:'passed',liveHttps:'NOT_VERIFIED'}));
