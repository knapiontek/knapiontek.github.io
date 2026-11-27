// @ts-check
// test/uses.js: for a test written as use cases: the module's functions, each counted when a use case calls it; which none did.

/**
 * The module's API, each function counted when called; missing(): the functions no use case called.
 * @template {Record<string, any>} M @param {M} module @returns {{ $: M, missing: () => string[] }}
 */
export function uses(module) {
  const used = new Set();
  const $ = /** @type {M} */ (Object.fromEntries(Object.entries(module).map(([k, v]) => [k, typeof v === 'function' ? (/** @type {any[]} */ ...a) => { used.add(k); return v(...a); } : v])));
  return { $, missing: () => Object.keys(module).filter(k => typeof module[k] === 'function' && !used.has(k)) };
}
