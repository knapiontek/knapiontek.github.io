/* core/estimate.js: the sheets every room's Documents share, so they look and work the same everywhere (core/sheet.js
   draws them and makes the XLSX):
     estimate   Estimate: the items by category, quantity × unit price, sums, the total
     cutList    Cut list: the boards to order, by board, with their edges, m², banding and cuts
   Knows no project: a page hands in its items and parts. No browser. */
(function (HOME) {
'use strict';

const formula = f => ({ f }), input = v => ({ v, input: true });
/* widths: characters in the XLSX; screen: one per column, how it is shown (HOME.ui.setColumns): a number n is fixed at n
   characters (numbers, codes, units); a text 's3' has a share of 3, 's2n16m40' at least 16 and at most 40 characters */
const screenOf = t => (typeof t === 'number' ? { fix: t } : (m => (m ? { share: +m[1], min: m[2] ? +m[2] : undefined, max: m[3] ? +m[3] : undefined } : { share: 1 }))(/^s([\d.]+)(?:n(\d+))?(?:m(\d+))?$/.exec(t || '')));
const cols = (widths, more = {}, screen = []) => widths.map((width, i) => ({ width, ...(screen[i] !== undefined ? screenOf(screen[i]) : {}), ...(more[i] || {}) }));
const money = { digits: 2, z: '#,##0.00' };
/* an array is a row of cells, an object keeps its kind; the first row is the title */
const kinds = rows => rows.map((r, i) => (r && !Array.isArray(r) ? r : { kind: i === 0 ? 'title' : undefined, cells: r || [] }));

/* ---------- Estimate ----------
   spec  {title, info, params: [{key, label, v, z}],                  the inputs under the title (column C)
          categories: [{name, group, items: [item]}],
          totals: [{label, group}],                                    a sum per group of categories (none: one total)
          reserve: {label, note, v, of},                               % of the total row `of` (an index in totals)
          excluded: [text], after: [cells], screen}                   what the estimate does not cover; rows at its end
   item  {id, name, spec, use, unit, qty, price, source}
          qty     a number (the viewer may change it), {f, z} a formula, or ref => {f, z}: ref.item(id) and ref.param(key)
                  are the cells of another item's quantity and of a parameter
          price   a number (the viewer may change it) or null (no price yet: no value)
          source  a text, or {text, links: [{text, href}]}
   Returns {sheet, row: id -> its row}. */
function estimate(spec) {
  const rows = [[spec.title], [spec.info || '']], param = {}, row = {};
  for (const p of spec.params || []) { param[p.key] = '$C$' + (rows.length + 1); rows.push([p.label, '', p.z ? { ...input(p.v), z: p.z } : input(p.v)]); }
  rows.push([]);
  rows.push({ kind: 'head', cells: ['No.', 'Item', 'Specification', 'Where it goes', 'Qty', 'Unit', 'Unit price [PLN]', 'Value [PLN]', 'Price source / remarks'] });
  /* the rows first, so a quantity may refer to any item */
  let r = rows.length;
  for (const c of spec.categories) { r++; for (const it of c.items) row[it.id ?? it.name] = ++r; }
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
  if ((spec.excluded || []).length) { rows.push([]); rows.push(['', 'Not included']); for (const e of spec.excluded) rows.push(['', '• ' + e]); }
  for (const a of spec.after || []) rows.push(a);
  const sheet = { name: 'Estimate', cols: cols([5, 36, 40, 30, 10, 6, 13, 14, 50], { 6: money, 7: money },
    spec.screen || [4, 's3', 's3', 's3', 8, 5, 10, 10, 's4']), rows: kinds(rows) };
  return { sheet, row };
}

/* ---------- Cut list ----------
   spec   {title, note, blocks: [block], legend: [{code, text}] (under the note, before the blocks), screen (as cols)}
   block  {id, title, columns: [label, size 1, size 2, qty] (or the default), cut (cuts counted), rows: [part]}
   part   {label, name, a, b, edgesA, edgesB (finished edges along a and b), qty, edge (banding of one piece, mm, or null),
           cutouts: [text], where}
   Returns {sheet, total: block id -> its row of sums (G m², H pieces, I banding, J cuts)}. */
const DEFAULT_COLUMNS = ['Part', 'Length', 'Width', 'Qty'];
function cutList(spec) {
  const rows = [[spec.title], [spec.note || '']], total = {};
  if ((spec.legend || []).length) { rows.push({ kind: 'cat', cells: ['Labels and cut-outs'] }); for (const l of spec.legend) rows.push([l.code, l.text]); }
  rows.push([]);
  for (const block of spec.blocks) {
    const [labelCell, size1, size2, qtyCell] = block.columns || DEFAULT_COLUMNS;
    rows.push({ kind: 'cat', cells: [block.title] });
    rows.push({ kind: 'head', cells: ['Label', labelCell, size1 + ' [mm]', 'Edge', size2 + ' [mm]', 'Edge', 'm²', qtyCell, 'Banding [m]', 'Cuts [m]', 'Cut-outs', 'Where'] });
    const first = rows.length + 1;
    for (const p of block.rows) {
      const r = rows.length + 1;
      rows.push([p.label || '', p.name, p.a, p.edgesA, p.b, p.edgesB, formula(`C${r}*E${r}*H${r}/1000000`), p.qty,
        p.edge != null ? formula(`${p.edge}*H${r}/1000`) : '', block.cut ? formula(`(C${r}+E${r})*H${r}/1000`) : '', (p.cutouts || []).join('\n'), p.where || '']);
    }
    const last = rows.length;
    total[block.id] = last + 1;
    rows.push({ kind: 'sum', cells: ['', 'Total', '', '', '', '', formula(`SUM(G${first}:G${last})`), formula(`SUM(H${first}:H${last})`), formula(`SUM(I${first}:I${last})`), formula(`SUM(J${first}:J${last})`)] });
    rows.push([]);
  }
  const sheet = { name: 'Cut list', cols: cols([9, 40, 12, 6, 12, 6, 10, 8, 15, 12, 34, 14], { 6: { digits: 3, z: '0.000' }, 8: { digits: 2, z: '0.00' }, 9: { digits: 2, z: '0.00' } },
    spec.screen || [8, 's2n12m36', 6, 3, 6, 3, 7, 5, 7, 7, 's1n9m24', 's1n10m30']), rows: kinds(rows) };
  return { sheet, total };
}

HOME.estimate = { estimate, cutList };
})(window.HOME = window.HOME || {});
