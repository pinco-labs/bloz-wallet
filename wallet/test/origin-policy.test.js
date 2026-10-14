import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedWalletOrigin } from '../src/origin-policy.js';
test('public build only runs on its exact HTTPS origin; local build stays loopback',()=>{
  const origin='https://wallet.example';
  assert.equal(allowedWalletOrigin(new URL(origin),origin),true);
  for(const value of ['http://wallet.example','https://wallet.example.evil.test','https://wallet.example:444','http://127.0.0.1:8091']) assert.equal(allowedWalletOrigin(new URL(value),origin),false);
  assert.equal(allowedWalletOrigin(new URL('http://127.0.0.1:8091')),true);
  assert.equal(allowedWalletOrigin(new URL(origin)),false);
});
