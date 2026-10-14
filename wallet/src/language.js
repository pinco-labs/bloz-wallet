import { english } from './translations-en.js';

export const LANGUAGE_KEY = 'bloz.wallet.language.v1';
export function chooseLanguage(saved, languages = []) {
  if (saved === 'it' || saved === 'en') return saved;
  return languages[0]?.toLowerCase().startsWith('it') ? 'it' : 'en';
}

// Only presentation strings are translated. No HTML is parsed or inserted.
// Placeholders retain the original address, amount, ID and other runtime data.
const patterns = Object.entries(english).filter(([key]) => key.includes('{0}')).map(([source, target]) => {
  const parts = source.split(/\{\d+\}/);
  const escaped = parts.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return [new RegExp('^' + escaped.join('([\\s\\S]*?)') + '$'), target];
});
export function translate(text, language) {
  if (language !== 'en' || typeof text !== 'string') return text;
  const trimmed = text.trim();
  let translated = Object.hasOwn(english, trimmed) ? english[trimmed] : undefined;
  if (translated === undefined) {
    for (const [pattern, template] of patterns) {
      const match = trimmed.match(pattern);
      if (match) { translated = template.replace(/\{(\d+)\}/g, (_, n) => {
        const value = match[Number(n) + 1];
        return Object.hasOwn(english, value) ? english[value] : value;
      }); break; }
    }
  }
  if (translated === undefined) return text;
  return text.slice(0, text.length - text.trimStart().length) + translated + text.slice(text.trimEnd().length);
}

export function installLanguage(page = document, storage = localStorage, browser = navigator) {
  const select = page.getElementById('wallet-language');
  if (!select) return;
  select.parentElement.hidden = false;
  let saved;
  try { saved = storage.getItem(LANGUAGE_KEY); } catch { /* Storage may be disabled. */ }
  let language = chooseLanguage(saved, browser.languages ?? [browser.language]);
  const originals = new WeakMap();
  const excluded = 'script,style,textarea,input,code,pre,output,#address,#wallet-language';
  function applyText(node) {
    if (!node.parentElement || node.parentElement.closest(excluded)) return;
    const previous = originals.get(node);
    const source = previous && node.data === previous.result ? previous.source : node.data;
    const result = translate(source, language);
    originals.set(node, { source, result });
    if (node.data !== result) node.data = result;
  }
  const attributes = new WeakMap();
  function applyAttributes(element) {
    if (element.closest('script,style,textarea,code,pre,output,#wallet-language')) return;
    let savedAttributes = attributes.get(element);
    if (!savedAttributes) { savedAttributes = {}; attributes.set(element, savedAttributes); }
    for (const name of ['aria-label', 'placeholder', 'title']) {
      const value = element.getAttribute(name);
      if (value === null) continue;
      const previous = savedAttributes[name];
      const source = previous && value === previous.result ? previous.source : value;
      const result = translate(source, language);
      savedAttributes[name] = { source, result };
      if (value !== result) element.setAttribute(name, result);
    }
  }
  function apply(root) {
    if (root.nodeType === 3) { applyText(root); return; }
    if (root.nodeType !== 1) return;
    applyAttributes(root);
    const walker = page.createTreeWalker(root, 5); // Element and text nodes only.
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === 3) applyText(node); else applyAttributes(node);
    }
  }
  const observer = new MutationObserver(records => {
    // Disconnect while applying translations to avoid self-generated mutations.
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(apply);
      else if (record.type === 'characterData') applyText(record.target);
      else applyAttributes(record.target);
    }
    observe();
  });
  const observe = () => observer.observe(page.documentElement, { subtree: true, childList: true,
    characterData: true, attributes: true, attributeFilter: ['aria-label', 'placeholder', 'title'] });
  function refresh() {
    observer.disconnect();
    page.documentElement.lang = language;
    select.value = language;
    apply(page.documentElement);
    observe();
  }
  select.addEventListener('change', () => {
    if (!['it', 'en'].includes(select.value)) return;
    language = select.value;
    try { storage.setItem(LANGUAGE_KEY, language); } catch { /* Session-only preference. */ }
    refresh();
  });
  refresh();
  return { dispose: () => observer.disconnect(), get language() { return language; } };
}
