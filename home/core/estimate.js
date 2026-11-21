// @ts-check
/* core/estimate.js: the sheet Estimate: items by category, quantity × unit price, sums, the total; the same on every page
   (core/sheet.js draws it and makes the XLSX). Knows no project: a page hands in its items. No browser. Gets core/tools.js. */
/** @param {ReturnType<typeof coreToolsModule>} tools */
function coreEstimateModule(tools) {
'use strict';

const { formula, input, cols, money, kinds } = tools;

/* ---------- Estimate ---------- */
/** @typedef {{ item: (id: string) => string, param: (key: string) => string }} EstimateRef  the cells of an item's quantity, of a parameter */
/** @typedef {string | { text: string, links: { text: string, href: string }[] }} EstimateSource */
/**
 * @typedef {object} EstimateItem
 * @property {string} [id]
 * @property {string} name
 * @property {string} [spec]
 * @property {string} [use]
 * @property {string} [unit]
 * @property {number | { f: string, z?: string } | ((ref: EstimateRef) => { f: string, z?: string })} qty  a number the viewer may change, or a formula
 * @property {number | null} [price]  the viewer may change it; null: no price yet, no value
 * @property {EstimateSource} [source]
 */
/**
 * @typedef {object} EstimateSpec
 * @property {string} title
 * @property {string} [info]
 * @property {{ key: string, label: string, v: number, z?: string }[]} [params]  the inputs under the title (column C)
 * @property {{ name: string, group?: string, items: EstimateItem[] }[]} categories
 * @property {{ label: string, group: string }[]} [totals]  a sum per group of categories (none: one total)
 * @property {{ label: string, note?: string, v: number, of: number }} [reserve]  a share of the totals' row `of` (its index)
 * @property {string[]} [excluded]  what the estimate does not cover
 * @property {any[][]} [after]  rows at its end
 * @property {(number | string)[]} [screen]  how each column shows (core/tools.js cols)
 */
/** @param {EstimateSpec} spec @returns {{ sheet: TableSheet, row: Object<string, number> }} row: an item's id -> its row */
function estimate(spec) {
  const rows = /** @type {any[]} */ ([[spec.title], [spec.info || '']]), /** @type {Object<string, string>} */ param = {}, /** @type {Object<string, number>} */ row = {};
  for (const p of spec.params || []) { param[p.key] = '$C$' + (rows.length + 1); rows.push([p.label, '', p.z ? { ...input(p.v), z: p.z } : input(p.v)]); }
  rows.push([]);
  rows.push({ kind: 'head', cells: ['No.', 'Item', 'Specification', 'Where it goes', 'Qty', 'Unit', 'Unit price [PLN]', 'Value [PLN]', 'Price source / remarks'] });
  /* the rows first, so a quantity may refer to any item */
  let r = rows.length;
  for (const c of spec.categories) { r++; for (const it of c.items) row[it.id ?? it.name] = ++r; }
  /** @type {EstimateRef} */
  const ref = { item: id => 'E' + row[id], param: key => param[key] };
  const categoryRows = [];
  let no = 0;
  for (const c of spec.categories) {
    const at = rows.length;
    rows.push(null);   // the category and its sum, below
    for (const it of c.items) {
      const n = rows.length + 1, q = typeof it.qty === 'function' ? it.qty(ref) : it.qty;
      const qty = typeof q === 'number' ? input(q) : q ?? '';
      const price = it.price === null || it.price === undefined ? '' : input(it.price);
      rows.push([++no, it.name, it.spec || '', it.use || '', qty, it.unit || '', price, price === '' ? '' : formula(`ROUND(E${n}*G${n},2)`), it.source ?? '']);
    }
    rows[at] = { kind: 'cat', cells: ['', c.name, '', '', '', '', '', formula(`SUM(H${at + 2}:H${rows.length})`)] };
    categoryRows.push({ row: at + 1, group: c.group });
  }
  rows.push([]);
  const sum = list => list.map(c => 'H' + c.row).join('+') || '0';
  const first = rows.length + 1, totals = spec.totals || [];
  for (const t of totals) rows.push({ kind: 'sum', cells: ['', t.label, '', '', '', '', '', formula(sum(categoryRows.filter(c => c.group === t.group)))] });
  if (spec.reserve) {
    const R = spec.reserve;
    rows.push({ kind: 'sum', cells: ['', R.label, R.note || '', '', '', '', { ...input(R.v), z: '0%' }, formula(`ROUND(H${first + R.of}*G${rows.length + 1},2)`)] });
  }
  const parts = rows.length + 1 - first;
  rows.push({ kind: 'grand', cells: ['', 'TOTAL GROSS', '', '', '', '', '', formula(parts ? Array.from({ length: parts }, (_, i) => 'H' + (first + i)).join('+') : sum(categoryRows))] });
  if ((spec.excluded || []).length) { rows.push([]); rows.push(['', 'Not included']); for (const e of spec.excluded || []) rows.push(['', '• ' + e]); }
  for (const a of spec.after || []) rows.push(a);
  const sheet = { name: 'Estimate', cols: cols([5, 36, 40, 30, 10, 6, 13, 14, 50], { 6: money, 7: money },
    spec.screen || [4, 's3', 's3', 's3', 8, 5, 10, 10, 's4']), rows: kinds(rows) };
  return { sheet, row };
}

return { estimate };
}
