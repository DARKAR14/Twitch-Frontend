export function createAuthSession({ storage, location, history, exchange, now = Date.now }) {
  const key = "darkops.apiSession";
  let current = null;
  let pending = null;
  try { current = JSON.parse(storage.getItem(key)); } catch { /* Storage may be unavailable. */ }

  function clear() {
    current = null;
    try { storage.removeItem(key); } catch { /* In-memory sessions still work. */ }
  }

  function token() {
    if (!current?.access_token || current.expiresAt <= now()) {
      clear();
      return null;
    }
    return current.access_token;
  }

  function save(data) {
    if (!data?.access_token || !(data.expires_in > 0)) throw new Error("Respuesta de acceso inválida");
    current = { access_token: data.access_token, expiresAt: now() + data.expires_in * 1000 };
    try { storage.setItem(key, JSON.stringify(current)); } catch { /* Keep it in memory. */ }
    return data;
  }

  function initialize() {
    if (pending) return pending;
    const fragment = new URLSearchParams(location.hash.slice(1));
    const code = fragment.get("code");
    if (!code) return Promise.resolve(null);
    history.replaceState(history.state, "", `${location.pathname}${location.search}`);
    clear();
    // React StrictMode may mount twice; exchange a one-use code only once.
    pending = Promise.resolve().then(() => exchange(code)).then(save);
    return pending;
  }

  return { initialize, token, save, clear, expiresAt: () => current?.expiresAt || 0 };
}
