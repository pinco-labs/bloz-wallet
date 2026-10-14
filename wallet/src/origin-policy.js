export function allowedWalletOrigin(location, publicOrigin = '') {
  if (!publicOrigin) return location.hostname === '127.0.0.1';
  try {
    const expected = new URL(publicOrigin);
    return expected.protocol === 'https:' && expected.origin === publicOrigin && location.origin === publicOrigin;
  } catch { return false; }
}
