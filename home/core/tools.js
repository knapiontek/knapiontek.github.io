// @ts-check
/* core/tools.js: short pieces that belong to no one file: how numbers are written (the same on every page and in every
   sheet); how a sheet's rows and columns are built. Knows no project and no browser. */
function toolsModule() {
'use strict';

/* ---------- numbers ---------- */
const LOCALE = 'en-GB';
/* a number with exactly d decimals: fmt(12, 2) = '12.00', fmt(1234.5, 1) = '1,234.5' */
const fmt = (/** @type {number} */ v, /** @type {number} */ d) => v.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---------- a sheet's rows and columns ----------
   A page's sheets are rows of cells (core/sheet.js draws them); these make them alike everywhere. */
const formula = (/** @type {string} */ f) => ({ f }), input = (/** @type {number} */ v) => ({ v, input: true });
/* widths: characters in the XLSX; screen: one per column, how it is shown (core/ui.js setColumns): a number n is fixed at n
   characters (numbers, codes, units); a text 's3' has a share of 3, 's2n16m40' at least 16 and at most 40 characters */
/** @returns {Column} */
const screenOf = (/** @type {number | string | undefined} */ t) => (typeof t === 'number' ? { fix: t } : (m => (m ? { share: +m[1], min: m[2] ? +m[2] : undefined, max: m[3] ? +m[3] : undefined } : { share: 1 }))(/^s([\d.]+)(?:n(\d+))?(?:m(\d+))?$/.exec(t || '')));
/** columns of these widths (XLSX characters), with more (index -> fields) and how each shows on screen @returns {Column[]} */
const cols = (/** @type {number[]} */ widths, /** @type {Object<number, Column>} */ more = {}, /** @type {(number | string)[]} */ screen = []) => widths.map((width, i) => ({ width, ...(screen[i] !== undefined ? screenOf(screen[i]) : {}), ...(more[i] || {}) }));
const money = { digits: 2, z: '#,##0.00' };   // a column of zł
/* an array is a row of cells, an object keeps its kind; the first row is the title */
/** @returns {SheetRow[]} */
const kinds = (/** @type {any[]} */ rows) => rows.map((r, i) => (r && !Array.isArray(r) ? r : { kind: i === 0 ? 'title' : undefined, cells: r || [] }));

return { LOCALE, fmt, formula, input, cols, money, kinds };
}
HOME.tools = toolsModule();
