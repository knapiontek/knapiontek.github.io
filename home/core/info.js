/* core/info.js: Info of every application. One title, one row of tabs in one order
   (TABS), each tab a sheet of core/sheet.js (on the screen and in the XLSX) and/or a page (a drawing, cards).
   The sheets every application shares are built here, so they look and work the same everywhere:
     estimate   Kosztorys: positions by category, quantity × unit price, sums, total
     cutList    Lista cięć: boards to order, by board, with edges, m², edge banding and cuts
     table      a header and its rows (Pomieszczenia, Podejścia, Wymiary, Montaż)
   Knows no project: a page hands in its positions, parts and rows. */
(function (CORE) {
'use strict';

/* the tabs, in this order in every application; a tab an application does not have is not shown */
const TABS = ['Kosztorys', 'Lista cięć', 'eRozkrój', 'Szafka', 'Korpusy', 'Montaż', 'Pomieszczenia', 'Podejścia', 'Wymiary', 'Notatki', 'Model'];
const order = name => (TABS.includes(name) ? TABS.indexOf(name) : TABS.length);

const formula = f => ({ f }), input = v => ({ v, input: true });
const cols = (widths, more = {}) => widths.map((width, i) => ({ width, ...(more[i] || {}) }));
const money = { digits: 2, z: '#,##0.00' };

/* ---------- Kosztorys ----------
   spec  {title, info, params: [{key, label, v, z}],                  the inputs under the title (column C)
          categories: [{name, group, items: [item]}],
          totals: [{label, group}],                                    a sum per group of categories (none: one total)
          reserve: {label, note, v, of},                               % of the total row `of` (an index in totals)
          excluded: [text], after: [cells]}                            what the estimate does not cover; rows at its end
   item  {id, name, spec, use, unit, qty, price, source}
          qty     a number (the viewer may change it), {f, z} a formula, or ref => {f, z}: ref.item(id) and ref.param(key)
                  are the cells of another position's quantity and of a parameter
          price   a number (the viewer may change it) or null (no price yet: no value)
          source  a text, or {text, links: [{text, href}]}
   Returns {sheet, row: id -> its row}. */
function estimate(spec) {
  const rows = [[spec.title], [spec.info || '']], param = {}, row = {};
  for (const p of spec.params || []) { param[p.key] = '$C$' + (rows.length + 1); rows.push([p.label, '', p.z ? { ...input(p.v), z: p.z } : input(p.v)]); }
  rows.push([]);
  rows.push({ kind: 'head', cells: ['Lp.', 'Pozycja', 'Specyfikacja', 'Gdzie użyte', 'Ilość', 'J.m.', 'Cena jedn. [PLN]', 'Wartość [PLN]', 'Źródło ceny / uwagi'] });
  /* the rows first, so a quantity may refer to any position */
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
  rows.push({ kind: 'grand', cells: ['', 'RAZEM BRUTTO', '', '', '', '', '', formula(parts ? Array.from({ length: parts }, (_, i) => 'H' + (first + i)).join('+') : sum(categoryRows))] });
  if ((spec.excluded || []).length) { rows.push([]); rows.push(['', 'Nie obejmuje']); for (const e of spec.excluded) rows.push(['', '• ' + e]); }
  for (const a of spec.after || []) rows.push(a);
  const sheet = { name: 'Kosztorys', cols: cols([5, 36, 40, 30, 10, 6, 13, 14, 50], { 6: money, 7: money }), rows: kinds(rows) };
  return { sheet, row };
}

/* ---------- Lista cięć ----------
   spec   {title, note, blocks: [block], legend: [{code, text}]}
   block  {id, title, columns: [label, size 1, size 2, qty] (or the default), cut (cuts count), rows: [part]}
   part   {label, name, a, b, edgesA, edgesB (finished edges along a and b), qty, edge (banding of one piece, mm, or null),
           cutouts: [text], where}
   Returns {sheet, total: block id -> its row of sums (G m², H pieces, I banding, J cuts)}. */
const DEFAULT_COLUMNS = ['Element', 'Długość', 'Szerokość', 'Ilość'];
function cutList(spec) {
  const rows = [[spec.title], [spec.note || ''], []], total = {};
  for (const block of spec.blocks) {
    const [labelCell, size1, size2, qtyCell] = block.columns || DEFAULT_COLUMNS;
    rows.push({ kind: 'cat', cells: [block.title] });
    rows.push({ kind: 'head', cells: ['Etykieta', labelCell, size1 + ' [mm]', 'Krawędź', size2 + ' [mm]', 'Krawędź', 'm²', qtyCell, 'Obrzeże razem [mb]', 'Cięcia [mb]', 'Wycięcia (legenda na dole)', 'Gdzie'] });
    const first = rows.length + 1;
    for (const p of block.rows) {
      const r = rows.length + 1;
      rows.push([p.label || '', p.name, p.a, p.edgesA, p.b, p.edgesB, formula(`C${r}*E${r}*H${r}/1000000`), p.qty,
        p.edge != null ? formula(`${p.edge}*H${r}/1000`) : '', block.cut ? formula(`(C${r}+E${r})*H${r}/1000`) : '', (p.cutouts || []).join('\n'), p.where || '']);
    }
    const last = rows.length;
    total[block.id] = last + 1;
    rows.push({ kind: 'sum', cells: ['', 'Razem', '', '', '', '', formula(`SUM(G${first}:G${last})`), formula(`SUM(H${first}:H${last})`), formula(`SUM(I${first}:I${last})`), formula(`SUM(J${first}:J${last})`)] });
    rows.push([]);
  }
  if ((spec.legend || []).length) { rows.push({ kind: 'cat', cells: ['ETYKIETY I WYCIĘCIA – legenda'] }); for (const l of spec.legend) rows.push([l.code, l.text]); }
  const sheet = { name: 'Lista cięć', cols: cols([9, 40, 12, 6, 12, 6, 10, 8, 15, 12, 34, 14], { 6: { digits: 3, z: '0.000' }, 8: { digits: 2, z: '0.00' }, 9: { digits: 2, z: '0.00' } }), rows: kinds(rows) };
  return { sheet, total };
}

/* ---------- a plain table: a title (optional), a header, its rows; widths in characters ---------- */
function table(name, widths, head, body, title) {
  const rows = [...(title ? [{ kind: 'title', cells: [title] }] : []), { kind: 'head', cells: head }, ...body.map(cells => ({ cells }))];
  return { name, cols: cols(widths), rows };
}

/* an array is a row of items, an object keeps its kind; the first row is the title */
const kinds = rows => rows.map((r, i) => (r && !Array.isArray(r) ? r : { kind: i === 0 ? 'title' : undefined, cells: r || [] }));

/* ---------- the screen ----------
   box: #info; info {title, subtitle, warnings: [text], book}. A tab of the book with `node` shows that element (kept in
   the page, only hidden), above its sheet if it also has rows. Returns the sheet of core/sheet.js: set(book), restore(),
   xlsx(file). */
function show(box, info) {
  box.innerHTML = '';
  box.append(CORE.ui.el('h1', { textContent: info.title }));
  if (info.subtitle) box.append(CORE.ui.el('p', { className: 'sub', textContent: info.subtitle }));
  if ((info.warnings || []).length) {
    const w = CORE.ui.el('div', { className: 'issues' });
    w.innerHTML = `<b>${info.warnings.length} × do poprawy w danych projektu</b><ul>${info.warnings.map(t => `<li>${CORE.ui.esc(t)}</li>`).join('')}</ul>`;
    box.append(w);
  }
  const sheets = CORE.ui.el('div', { className: 'infosheets' });
  box.append(sheets);
  return CORE.sheet.create(sheets, sorted(info.book));
}
const sorted = book => ({ ...book, sheets: [...book.sheets].sort((a, b) => order(a.name) - order(b.name)) });

/* the bottom menu of Info: the XLSX of the book, the inputs back as handed in; then the application's own groups */
const menu = (sheet, file, more = []) => [[
  { name: 'Zapisz XLSX', go: e => { const b = e.currentTarget, label = b.textContent; sheet().xlsx(typeof file === 'function' ? file() : file).catch(() => { b.textContent = 'Brak sieci — spróbuj ponownie'; setTimeout(() => { b.textContent = label; }, 2500); }); } },
  { name: 'Przywróć dane', go: () => sheet().restore() }], ...more];

CORE.info = { TABS, estimate, cutList, table, show, menu, sorted };
})(window.CORE = window.CORE || {});
