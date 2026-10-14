import test from 'node:test';
import assert from 'node:assert/strict';
import { installLifecycle } from '../src/lifecycle.js';

test('inactivity resets on input, locks at five minutes, checks resume and handles hidden pages/storage', () => {
  const page = new EventTarget(), window = new EventTarget(); page.hidden = false;
  let now = 0, tick, unlocked = true, locks = 0, rendered = 0, canceled = false;
  const lifecycle = installLifecycle({ page, window, hasSession: () => unlocked,
    lock: () => { locks++; unlocked = false; }, render: () => { rendered++; }, storageKey: 'test-wallet',
    now: () => now, every: (fn) => { tick = fn; return 1; }, cancel: () => { canceled = true; } });
  now = 299_999; tick(); assert.equal(locks, 0);
  page.dispatchEvent(new Event('keydown')); now += 299_999; tick(); assert.equal(locks, 0);
  page.dispatchEvent(new Event('pointerdown')); now += 299_999; tick(); assert.equal(locks, 0);
  now++; tick(); assert.equal(locks, 1); tick(); assert.equal(locks, 1);
  unlocked = true; lifecycle.activity(); now += 300_000;
  window.dispatchEvent(new Event('pageshow')); assert.equal(locks, 2); assert.equal(rendered, 1);
  unlocked = true; lifecycle.activity(); page.dispatchEvent(new Event('visibilitychange')); assert.equal(locks, 2);
  page.hidden = true; page.dispatchEvent(new Event('visibilitychange')); assert.equal(locks, 3);
  unlocked = true; window.dispatchEvent(new Event('pagehide')); assert.equal(locks, 4);
  const change = (key) => { const event = new Event('storage'); event.key = key; window.dispatchEvent(event); };
  change('unrelated'); assert.equal(locks, 4);
  change('test-wallet'); assert.equal(locks, 5);
  change(null); assert.equal(locks, 6);
  lifecycle.dispose(); assert.equal(canceled, true);
  window.dispatchEvent(new Event('pagehide')); assert.equal(locks, 6);
});
