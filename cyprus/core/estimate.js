// @ts-check
// core/estimate.js: the sheet Estimate (core/sheet.js): the items by category, each its quantity × its unit price, the sums
// of the categories, of their groups, a reserve, the total; what it does not cover. Knows no project: a page hands in its
// items. The quantities and the prices the viewer may change; a quantity may be a formula of other items' quantities and of
// the parameters (the inputs under the title).

/** @typedef {import('./sheet.js').Sheet} Sheet */
/** @typedef {import('./sheet.js').Row} Row */
/** @typedef {import('./sheet.js').Column} Column */
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
 * @property {{ key: string, label: string, v: number, pct?: boolean }[]} [params]  the inputs under the title (column C)
 * @property {{ name: string, group?: string, items: EstimateItem[] }[]} categories
 * @property {{ label: string, group: string }[]} [totals]  a sum per group of categories (none: one total)
 * @property {{ label: string, note?: string, v: number, of: number }} [reserve]  a share of the totals' row of (its index)
 * @property {string[]} [excluded]  what the estimate does not cover
 * @property {any[][]} [after]  rows at its end
 * @property {Column[]} [cols]  its columns (none: ESTIMATE_COLUMNS)
 */

const MONEY = { digits: 2, z: '#,##0.00' };
/** @type {Column[]} No., Item, Specification, Where it goes, Qty, Unit, Unit price, Value, Price source */
export const ESTIMATE_COLUMNS = [{ width: 5, fix: 4 }, { width: 36, share: 3 }, { width: 40, share: 3 }, { width: 30, share: 3 }, { width: 10, fix: 8 }, { width: 6, fix: 5 },
  { width: 13, fix: 10, ...MONEY }, { width: 14, fix: 10, ...MONEY }, { width: 50, share: 4 }];

/**
 * The sheet Estimate and the row of each item (its id, else its name).
 * @param {EstimateSpec} spec @returns {{ sheet: Sheet, row: Record<string, number> }}
 */
export function estimate(spec) {
  /** @type {Row[]} */
  const rows = [{ kind: 'title', cells: [spec.title] }, { cells: [spec.info || ''] }];
  /** @type {Record<string, string>} */ const param = {};
  /** @type {Record<string, number>} */ const row = {};
  for (const p of spec.params || []) { param[p.key] = '$C$' + (rows.length + 1); rows.push({ cells: [p.label, '', { v: p.v, input: true, ...(p.pct ? { pct: true } : {}) }] }); }
  rows.push({ cells: [] });
  rows.push({ kind: 'head', cells: ['No.', 'Item', 'Specification', 'Where it goes', 'Qty', 'Unit', 'Unit price [PLN]', 'Value [PLN]', 'Price source / remarks'] });
  /* the rows first, so a quantity may refer to any item */
  let r = rows.length;
  for (const c of spec.categories) { r++; for (const it of c.items) row[it.id ?? it.name] = ++r; }
  /** @type {EstimateRef} */
  const ref = { item: id => 'E' + row[id], param: key => param[key] };
  /** @type {{ row: number, group?: string }[]} */
  const categoryRows = [];
  let no = 0;
  for (const c of spec.categories) {
    const at = rows.length;
    rows.push({ cells: [] });   // the category and its sum, below
    for (const it of c.items) {
      const n = rows.length + 1, q = typeof it.qty === 'function' ? it.qty(ref) : it.qty;
      const qty = typeof q === 'number' ? { v: q, input: true } : q ?? '';
      const price = it.price === null || it.price === undefined ? '' : { v: it.price, input: true };
      rows.push({ cells: [++no, it.name, it.spec || '', it.use || '', qty, it.unit || '', price, price === '' ? '' : { f: `ROUND(E${n}*G${n},2)` }, it.source ?? ''] });
    }
    rows[at] = { kind: 'cat', cells: ['', c.name, '', '', '', '', '', { f: `SUM(H${at + 2}:H${Math.max(at + 2, rows.length)})` }] };
    categoryRows.push({ row: at + 1, group: c.group });
  }
  rows.push({ cells: [] });
  const sum = (/** @type {{ row: number }[]} */ list) => list.map(c => 'H' + c.row).join('+') || '0';
  const first = rows.length + 1, totals = spec.totals || [];
  for (const t of totals) rows.push({ kind: 'sum', cells: ['', t.label, '', '', '', '', '', { f: sum(categoryRows.filter(c => c.group === t.group)) }] });
  if (spec.reserve) {
    const R = spec.reserve;
    rows.push({ kind: 'sum', cells: ['', R.label, R.note || '', '', '', '', { v: R.v, input: true, pct: true }, { f: `ROUND(H${first + R.of}*G${rows.length + 1},2)` }] });
  }
  const parts = rows.length + 1 - first;
  rows.push({ kind: 'grand', cells: ['', 'TOTAL GROSS', '', '', '', '', '', { f: parts ? Array.from({ length: parts }, (_, i) => 'H' + (first + i)).join('+') : sum(categoryRows) }] });
  if ((spec.excluded || []).length) { rows.push({ cells: [] }); rows.push({ cells: ['', 'Not included'] }); for (const e of spec.excluded || []) rows.push({ cells: ['', '• ' + e] }); }
  for (const a of spec.after || []) rows.push({ cells: a });
  return { sheet: { name: 'Estimate', cols: spec.cols || ESTIMATE_COLUMNS, rows }, row };
}
