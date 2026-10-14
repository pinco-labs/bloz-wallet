import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createWalletServer } from '../server.js';

test('loopback static server rejects hostile hosts, submissions, cross-origin and secret paths', async (t) => {
  const server = createWalletServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const request = (path, method = 'GET', headers = {}) => new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
      let body = ''; res.on('data', (data) => { body += data; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }); req.on('error', reject); req.end();
  });
  const page = await request('/'); assert.equal(page.status, 200);
  assert.match(page.headers['content-security-policy'], /connect-src 'self'/);
  assert.match(page.headers['content-security-policy'], /form-action 'none'/);
  assert.equal(page.headers['cache-control'], 'no-store');
  assert.equal((await request('/app.js')).status, 200);
  assert.equal((await request('/style.css')).status, 200);
  assert.equal((await request('/', 'POST')).status, 405);
  assert.equal((await request('/', 'GET', { Host: 'evil.example' })).status, 403);
  assert.equal((await request('/', 'GET', { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/', 'GET', { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  for (const path of ['/.env', '/../secrets/key', '/%2e%2e/.env', '/src/keys.js', '/?wif=test', '/api/wallet', '/favicon.ico']) assert.equal((await request(path)).status, 404);
});
