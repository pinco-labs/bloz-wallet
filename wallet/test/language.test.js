import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chooseLanguage, translate, LANGUAGE_KEY } from '../src/language.js';
import { english } from '../src/translations-en.js';
import { MAINNET_STORAGE_KEY } from '../src/session.js';

test('language selection uses explicit preference, Italian browser, then English fallback', () => {
  assert.equal(chooseLanguage('en', ['it-IT']), 'en');
  assert.equal(chooseLanguage('it', ['en-US']), 'it');
  assert.equal(chooseLanguage(null, ['it-CH']), 'it');
  assert.equal(chooseLanguage('bad', ['fr-FR']), 'en');
  assert.equal(chooseLanguage(null, []), 'en');
  assert.notEqual(LANGUAGE_KEY, MAINNET_STORAGE_KEY);
});

test('translation preserves exact addresses, decimal values and transaction IDs in review and history', () => {
  const address = 'bz1q' + 'a'.repeat(38), txid = 'b'.repeat(64);
  const summary = `Destinatario: ${address} · Importo: 0.00010000 BLOZ · Commissione: 0.00000200 BLOZ · Totale addebitato: 0.00010200 BLOZ · Resto al tuo indirizzo: 0.00000000 BLOZ.`;
  assert.equal(translate(summary, 'en'), `Recipient: ${address} · Amount: 0.00010000 BLOZ · Fee: 0.00000200 BLOZ · Total debit: 0.00010200 BLOZ · Change to your address: 0.00000000 BLOZ.`);
  assert.equal(translate(summary, 'it'), summary);
  assert.equal(translate(`${txid} · 22 conferme`, 'en'), `${txid} · 22 confirmations`);
  assert.equal(translate('Ricompensa immatura · 99 conferme · ancora 1 blocchi', 'en'), 'Immature reward · 99 confirmations · 1 blocks remaining');
  assert.equal(translate(address, 'en'), address);
  assert.equal(translate('0.00010000 BLOZ', 'en'), '0.00010000 BLOZ');
  assert.equal(translate('constructor', 'en'), 'constructor');
  assert.equal(translate('__proto__', 'en'), '__proto__');
  assert.equal(translate('<img src=x onerror=alert(1)>', 'en'), '<img src=x onerror=alert(1)>');
});

test('backup outcomes stay distinct and all translation templates preserve placeholders', () => {
  assert.match(translate('Backup valido: password corretta e stesso indirizzo del wallet aperto. Nessun dato è stato modificato.', 'en'), /same address.*No data was changed/);
  assert.match(translate('Il file è valido con questa password, ma appartiene a un altro indirizzo. Non è il backup del wallet aperto.', 'en'), /another address.*not a backup/);
  assert.match(translate('Password errata o backup danneggiato/non compatibile.', 'en'), /Incorrect password or damaged/);
  for (const [source, target] of Object.entries(english)) {
    assert.deepEqual((source.match(/\{\d+\}/g) ?? []).sort(), (target.match(/\{\d+\}/g) ?? []).sort(), source);
    assert.equal(typeof target, 'string');
    assert.ok(target.length);
  }
});

test('Electrum mainnet markup has English coverage for every static text node and label', () => {
  const html = readFileSync(new URL('../dist-electrum/index.html', import.meta.url), 'utf8');
  const texts = [...html.matchAll(/>([^<>]+)</g)].map(m => m[1].trim()).filter(Boolean);
  const attrs = [...html.matchAll(/(?:aria-label|placeholder)="([^"]+)"/g)].map(m => m[1]);
  const unchanged = /^(?:[0-9]+|[✓→↗.]|B$|Ø$|Z$|English$|Italiano$|Password$|—$|info@|npm |http|wallet$|Language \/ Lingua$)/;
  for (const text of [...texts, ...attrs]) assert.ok(english[text] || unchanged.test(text), 'Missing translation: ' + text);
});

test('all explicit online wallet errors and literal lifecycle messages have English translations', () => {
  for (const name of ['app','session','backup','send','receive','connections','connection-ui','electrum-read','electrum-wallet','address','keys','lifecycle']) {
    const source = readFileSync(new URL(`../src/${name}.js`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/(?:new Error|message|lock)\('([^']+)'/g)) {
      const text = match[1].replaceAll('di test', 'mainnet').replaceAll('regtest', 'mainnet');
      assert.ok(english[text], `${name}: ${text}`);
    }
  }
});
