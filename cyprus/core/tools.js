// @ts-check
// core/tools.js: short pieces that belong to no one file: how numbers are written (the same on every page), text into HTML.
// Knows no project and no browser.

const LOCALE = 'en-GB';

/** a number with exactly d decimals: fmt(12, 2) = '12.00', fmt(1234.5, 1) = '1,234.5' @param {number} v @param {number} d */
export const fmt = (v, d) => v.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

/** text into HTML @param {unknown} v */
export const esc = v => String(v ?? '').replace(/[&<>"]/g, c => /** @type {Record<string, string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
