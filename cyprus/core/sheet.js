// @ts-check
// core/sheet.js: the spreadsheet of Documents: a book of sheets, their cells (text, numbers, inputs the viewer may change,
// links, formulas as in Excel), the formulas computed as the viewer changes the inputs, a sheet as SheetJS's worksheet (the
// XLSX: the same cells, the formulas live, the links, the widths, the outline). Knows no project and no browser: a page hands
// in the book, shows it (docs.js) and writes the file.
//
// book   { sheets: [sheet] }
// sheet  { name, cols: [column], rows: [row], tree?: 'open' | 'closed' }; a sheet without rows is shown, not written
// column { width (characters in the XLSX), fix (characters on screen: numbers, codes) | share (text: its part of what is
//          left, min … max characters), digits (decimals shown), z (the XLSX's number format) }
// row    { kind?: 'title' | 'head' | 'cat' | 'sum' | 'grand' (none: an item), level? (a sheet as a tree: its depth, 0 a root;
//          its children the rows after it one deeper), cells }; a row's place in rows is its Excel row (the first: 1)
// cell   a string (line breaks allowed), a number, null (empty), or
//          { v, input: true }    a number the viewer may change
//          { v }                 a number shown as given (pct: as a percentage)
//          { f: 'C5*(1+$C$2)' }  a formula: A1, Notes!A1 and 'Other sheet'!A1 references, ranges, + - * / ( ), SUM, ROUND, ROUNDUP, MIN, MAX
//          { text, href }        a link; href '#Sheet!A12' opens that sheet at that row; a bare address shows its site
//          { text, links }       a text, its links after it (each { text, href }); in the XLSX their names follow it
//        any number may add digits (its decimals; else its column's), pct, z (else its column's)

/** @typedef {{ width?: number, fix?: number, share?: number, min?: number, max?: number, digits?: number, z?: string }} Column */
/** @typedef {{ kind?: string, level?: number, cells: any[] }} Row */
/** @typedef {{ name: string, cols: Column[], rows?: Row[], tree?: 'open' | 'closed' }} Sheet */
/** @typedef {{ sheets: Sheet[] }} Book */

const REF = /(?:(?:'([^']+)'|([A-Za-z_][\w.]*))!)?\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?/g;   // a sheet's name quoted, or bare (no spaces)
/** a column's letters as its index: A → 0 @param {string} letters */
const column = letters => [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
/** a column's index as its letters: 0 → A, 26 → AA @type {(i: number) => string} */
export const letter = i => (i >= 26 ? letter(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));
const scale = (/** @type {number | undefined} */ d) => Math.pow(10, d || 0);
/** @type {Record<string, (...a: any[]) => number>} */
const FUNCTIONS = {
  SUM: (...a) => a.flat().reduce((s, x) => s + x, 0),
  MIN: (...a) => Math.min(...a.flat()),
  MAX: (...a) => Math.max(...a.flat()),
  ROUND: (x, d) => Math.sign(x) * Math.round(Math.abs(x) * scale(d)) / scale(d),
  ROUNDUP: (x, d) => Math.sign(x) * Math.ceil(Math.abs(x) * scale(d) - 1e-9) / scale(d)   // away from zero, as Excel
};
/** a formula as a function of C(sheet, col, row) and R(sheet, col1, row1, col2, row2) @param {string} f @returns {Function} */
function compile(f) {
  const q = (/** @type {string | undefined} */ s) => (s === undefined ? 'null' : JSON.stringify(s));
  const js = f.replace(REF, (m, quoted, bare, c1, r1, c2, r2) => { const sh = quoted ?? bare; return r2 ? `R(${q(sh)},${column(c1)},${r1},${column(c2)},${r2})` : `C(${q(sh)},${column(c1)},${r1})`; });
  return new Function('C', 'R', ...Object.keys(FUNCTIONS), `return (${js});`);
}
/** @type {WeakMap<object, Function>} a formula cell's function, compiled once */
const COMPILED = new WeakMap();

/**
 * The value of every cell of a book: the inputs as the viewer set them, the formulas computed (a text counts as 0, as in
 * Excel); a cycle throws, naming the cell.
 * @param {Book} book @returns {(sheet: Sheet, col: number, row: number) => number}  col from 0, row from 1
 */
export function evaluator(book) {
  const byName = Object.fromEntries(book.sheets.map(s => [s.name, s])), memo = new Map(), busy = new Set();
  /** @param {Sheet} sheet @param {number} c @param {number} r @returns {number} */
  const value = (sheet, c, r) => {
    const cell = sheet.rows?.[r - 1]?.cells?.[c], key = sheet.name + '!' + c + ':' + r;
    if (typeof cell === 'number') return cell;
    if (!cell || typeof cell !== 'object') return 0;
    if ('v' in cell) return Number(cell.v) || 0;
    if (!cell.f) return 0;
    if (memo.has(key)) return memo.get(key);
    if (busy.has(key)) throw new Error('sheet: a cycle in the formulas: ' + sheet.name + '!' + letter(c) + r);
    busy.add(key);
    if (!COMPILED.has(cell)) COMPILED.set(cell, compile(cell.f));
    const own = (/** @type {string | null} */ sh) => (sh === null ? sheet : byName[sh]);
    const v = /** @type {Function} */ (COMPILED.get(cell))((/** @type {string | null} */ sh, /** @type {number} */ cc, /** @type {number} */ rr) => value(own(sh), cc, rr),
      (/** @type {string | null} */ sh, /** @type {number} */ c1, /** @type {number} */ r1, /** @type {number} */ c2, /** @type {number} */ r2) => {
        const out = []; for (let rr = r1; rr <= r2; rr++) for (let cc = c1; cc <= c2; cc++) out.push(value(own(sh), cc, rr)); return out;
      }, ...Object.values(FUNCTIONS));
    busy.delete(key); memo.set(key, v);
    return v;
  };
  return value;
}

/** a number as the page shows it: its decimals (none given: up to 3), a percentage, a dash when it is not a number @param {number} v @param {number} [digits] @param {boolean} [pct] @param {string} [locale] */
export const shown = (v, digits, pct, locale = 'en-GB') => (!Number.isFinite(v) ? '–' : pct ? Math.round(v * 1000) / 10 + '%'
  : v.toLocaleString(locale, digits === undefined ? { maximumFractionDigits: 3 } : { minimumFractionDigits: digits, maximumFractionDigits: digits }));
/** what a link shows: its name, or for a bare address its site (www.ogony.pl/… → ogony.pl) @param {{ text?: string, href: string }} l */
export const linkText = l => (l.text && l.text !== l.href ? l.text : (l.href.match(/^\w+:\/\/(?:www\.)?([^/?#]+)/) || [, l.href])[1]);
/** a link inside the book: '#\'Notes\'!A12' → ['Notes', 12]; null: another place @param {string} href @returns {[string, number] | null} */
export const target = href => { const m = href.match(/^#'?([^'!]+)'?!\$?[A-Z]+\$?(\d+)$/); return m ? [m[1], +m[2]] : null; };

/**
 * A sheet as SheetJS's worksheet (plain data: its cells A1 … with their type, value, formula, format and link; its range,
 * its columns' widths, its rows' outline levels): the XLSX's, the formulas live and their values computed.
 * @param {Sheet} sheet @param {(sheet: Sheet, col: number, row: number) => number} value  evaluator(book)
 * @returns {Record<string, any>}
 */
export function worksheet(sheet, value) {
  /** @type {Record<string, any>} */
  const ws = {}, links = /** @type {[string, string][]} */ ([]);
  let maxC = 0;
  const rows = sheet.rows || [];
  rows.forEach((row, ri) => (row.cells || []).forEach((cell, ci) => {
    if (cell === null || cell === undefined || cell === '') return;
    const ref = letter(ci) + (ri + 1), z = cell.z ?? sheet.cols[ci]?.z;
    maxC = Math.max(maxC, ci);
    if (typeof cell === 'string') ws[ref] = { t: 's', v: cell };
    else if (typeof cell === 'number') ws[ref] = { t: 'n', v: cell };
    else if ('v' in cell) ws[ref] = { t: 'n', v: Number(cell.v) || 0 };
    else if (cell.f) ws[ref] = { t: 'n', f: cell.f, v: value(sheet, ci, ri + 1) };
    else if (cell.href) { ws[ref] = { t: 's', v: linkText(cell) }; links.push([ref, cell.href]); }
    else if (cell.links) { ws[ref] = { t: 's', v: [cell.text, cell.links.map(linkText).join(' · ')].filter(Boolean).join('\n') }; if (cell.links.length) links.push([ref, cell.links[0].href]); }
    else ws[ref] = { t: 's', v: String(cell) };
    if (z && ws[ref].t === 'n') ws[ref].z = z;
  }));
  for (const [ref, url] of links) ws[ref].l = { Target: url };
  ws['!ref'] = 'A1:' + letter(Math.max(maxC, sheet.cols.length - 1)) + Math.max(1, rows.length);
  ws['!cols'] = sheet.cols.map(c => ({ wch: c.width || 12 }));
  if (rows.some(r => r.level !== undefined)) ws['!rows'] = rows.map(r => (r.level ? { level: Math.min(r.level, 7) } : {}));   // the outline
  return ws;
}
