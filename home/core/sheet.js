// @ts-check
/* core/sheet.js: the spreadsheet of Documents: sheets in tabs, input cells the viewer may change (until a reload),
   formulas that follow them, the XLSX with the same formulas live; and the Documents screen (a title, warnings, the book,
   the bottom menu), an Alpine part. Knows no project: a page hands in the book. The formulas are computed without a browser.

   book   {sheets: [{name, cols: [{title, width, digits, fix | share, min, max}], rows: [{kind, cells}], node}]}
          width: characters in the XLSX; on screen fix (characters: numbers, codes, units) or share (text: its part of
          the room left, from min to max characters), core/ui.js setColumns; with neither, a share as its width
          node: an element of the page shown in the tab (above its rows, if it has any); only hidden on another tab, so
          the page keeps filling it. A tab without rows is not in the XLSX.
          row kind: title | head | cat | sum | grand | (none: an item); a row's place in rows is its Excel row (first = 1)
          row level: a sheet as a tree: a row's depth (0: a root); its children are the rows after it one level deeper; on
          screen a row with children opens and closes them (+ / −); sheet tree: 'open' (all open at first) or 'closed' (only
          the roots); in the XLSX the levels are Excel's outline
   cell   a string, a number, null (empty), or an object:
            {v, input: true}       a number the viewer may change
            {f: 'C5*(1+$C$2)'}     a formula as in Excel: A1 and 'Other sheet'!A1 references, ranges, + - * / ( ),
                                   SUM, ROUND, ROUNDUP, MIN, MAX
            {text, href}           a link; href '#Sheet!A12' (Excel's own form, quotes allowed) opens that sheet at that row;
                                   a text that is the address itself shows as its site only (nobody reads or retypes an address)
            {text, links: [...]}   a text with links after it, each {text, href} as above; in the XLSX their names follow
                                   the text and the cell opens the first one
          any number cell may add: digits (decimals shown; or the column's), pct (shown as a percentage), z (the XLSX
          number format; or the column's z). A text may hold line breaks (\n). */
/** @typedef {{ kind?: string, level?: number, cells: any[] }} SheetRow */
/** @typedef {{ name: string, cols: Column[], rows?: SheetRow[], tree?: string, node?: HTMLElement }} Sheet */
/** @typedef {Sheet & { rows: SheetRow[] }} TableSheet  a sheet with rows */
/** @typedef {{ sheets: Sheet[] }} Book */
/** @typedef {{ width?: number, fix?: number, share?: number, min?: number, max?: number, digits?: number, z?: string }} Column */
/** @param {ReturnType<typeof uiModule>} ui @param {ReturnType<typeof toolsModule>} tools */
function sheetModule(ui, tools) {
'use strict';

const { el, setColumns } = ui, { esc, LOCALE } = tools;
const OPEN = new WeakMap();   // a tree sheet: its open rows
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';   // pinned

/* ---------- formulas ---------- */
const REF = /(?:'([^']+)'!)?\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?/g;
const column = (/** @type {string} */ letters) => [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;   // A -> 0
/** @type {(i: number) => string} */
const letter = i => (i >= 26 ? letter(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));
const scale = (/** @type {number | undefined} */ d) => Math.pow(10, d || 0);
const FUNCTIONS = {
  SUM: (...a) => a.flat().reduce((s, x) => s + x, 0),
  MIN: (...a) => Math.min(...a.flat()),
  MAX: (...a) => Math.max(...a.flat()),
  ROUND: (x, d) => Math.sign(x) * Math.round(Math.abs(x) * scale(d)) / scale(d),
  ROUNDUP: (x, d) => Math.sign(x) * Math.ceil(Math.abs(x) * scale(d) - 1e-9) / scale(d),   // away from zero, as Excel
};
/* a formula as a function of C(sheet, col, row) and R(sheet, col1, row1, col2, row2) */
/** @param {string} f */
function compile(f) {
  const q = (/** @type {string | undefined} */ s) => (s === undefined ? 'null' : JSON.stringify(s));
  const js = f.replace(REF, (m, sh, c1, r1, c2, r2) => (r2 ? `R(${q(sh)},${column(c1)},${r1},${column(c2)},${r2})` : `C(${q(sh)},${column(c1)},${r1})`));
  return new Function('C', 'R', ...Object.keys(FUNCTIONS), `return (${js});`);
}

/* the value of every cell: inputs as the viewer set them, formulas evaluated (text counts as 0, as in Excel) */
/** @param {Book} book @returns {(sheet: Sheet, col: number, row: number) => number} col from 0, row from 1 */
function evaluator(book) {
  const byName = Object.fromEntries(book.sheets.map(s => [s.name, s])), memo = new Map(), busy = new Set();
  const value = (sheet, c, r) => {
    const cell = sheet.rows[r - 1]?.cells?.[c], key = sheet.name + '!' + c + ':' + r;
    if (typeof cell === 'number') return cell;
    if (!cell || typeof cell !== 'object') return 0;
    if ('v' in cell) return Number(cell.v) || 0;
    if (!cell.f) return 0;
    if (memo.has(key)) return memo.get(key);
    if (busy.has(key)) throw new Error('a cycle in the formulas: ' + key);
    busy.add(key);
    cell.fn ||= compile(cell.f);
    const own = sh => (sh === null ? sheet : byName[sh]);
    const v = cell.fn((sh, cc, rr) => value(own(sh), cc, rr),
      (sh, c1, r1, c2, r2) => { const out = []; for (let rr = r1; rr <= r2; rr++) for (let cc = c1; cc <= c2; cc++) out.push(value(own(sh), cc, rr)); return out; },
      ...Object.values(FUNCTIONS));
    busy.delete(key); memo.set(key, v);
    return v;
  };
  return value;
}

/* ---------- the page ---------- */
const show = (v, d, pct) => (!Number.isFinite(v) ? '–' : pct ? Math.round(v * 1000) / 10 + '%'
  : v.toLocaleString(LOCALE, d === undefined ? { maximumFractionDigits: 3 } : { minimumFractionDigits: d, maximumFractionDigits: d }));
/* what a link shows: its name, or for a bare address its site (www.ogony.pl/... -> ogony.pl) */
const linkText = l => (l.text && l.text !== l.href ? l.text : (l.href.match(/^\w+:\/\/(?:www\.)?([^/?#]+)/) || [, l.href])[1]);
/* the text of a cell with links, as the XLSX has it */
const withLinks = c => [c.text, c.links.map(linkText).join(' · ')].filter(Boolean).join('\n');
/* '#'Notes'!A12' -> [sheet name, row] */
const target = href => { const m = href.match(/^#'?([^'!]+)'?!\$?[A-Z]+\$?(\d+)$/); return m && [m[1], +m[2]]; };

/* a cell's text as HTML: an address in it shown as a link with its site's name; a link inside the book carries its target */
const anchor = l => { const to = target(l.href);
  return `<a href="${esc(l.href)}" title="${esc(l.href)}"${to ? ` data-sheet="${esc(to[0])}" data-row="${to[1]}"` : ' target="_blank" rel="noopener"'}>${esc(linkText(l))}</a>`; };
const linked = text => text.split(/(https?:\/\/[^\s)]+)/).map((t, k) => (k % 2 ? anchor({ href: t }) : esc(t))).join('');
const foldHtml = (ri, open) => `<button class="fold" data-fold="${ri}" title="${open ? 'Close' : 'Open'}">${open ? '−' : '+'}</button>`;

/* the cells of a sheet as the table shows them, built once per sheet and changed in place (a formula's value, a row opened):
   rows [{kind, hidden, cells: [{cls, span, title, style, html, f: [col, row, digits, pct]}], fold}] */
function grid(sheet, open, original) {
  const isTree = r => r && r.level !== undefined, parent = [];
  return sheet.rows.map((row, ri) => {
    const out = { i: ri, kind: row.kind || '', hidden: false, cells: /** @type {Object<string, any>[]} */ ([]) };
    let fold = null;
    if (isTree(row)) {
      parent.length = row.level;
      out.hidden = parent.some(p => !open.has(p));
      out.parents = parent.slice(0, row.level);
      parent[row.level] = ri;
      const next = sheet.rows[ri + 1];
      if (isTree(next) && next.level > row.level) fold = out.fold = ri;
    }
    const cells = row.cells || [];
    cells.forEach((cell, ci) => {
      const d = cell?.digits ?? sheet.cols[ci]?.digits, td = /** @type {Object<string, any>} */ ({ cls: '', span: false, title: false, style: '', html: '' });
      if (typeof cell === 'number') { td.cls = 'n'; td.html = esc(show(cell, d)); }
      else if (cell && typeof cell === 'object' && 'v' in cell && !cell.input) { td.cls = 'n'; td.html = esc(show(cell.v, d, cell.pct)); }
      else if (cell && cell.input) { td.cls = 'n'; td.html = `<input type="number" step="any" value="${esc(cell.v)}" data-cell="${ri}:${ci}"${cell.v !== original.get(cell) ? ' class="changed"' : ''}>`; }
      else if (cell && cell.f) { td.cls = 'n'; td.title = '=' + cell.f; td.f = [ci, ri + 1, d, cell.pct]; }
      else if (cell && cell.href) td.html = anchor(cell);
      else if (cell && cell.links) td.html = (cell.text ? linked(cell.text + '\n') : '') + cell.links.map(anchor).join(' · ');
      else if (cell !== null && cell !== undefined) td.html = linked(String(cell));
      if (ci === 0 && isTree(row)) { td.cls = (td.cls + ' node').trim(); td.style = `padding-left: ${0.5 + row.level * 1.1}em;`; td.lead = fold !== null ? foldHtml(ri, open.has(ri)) : '<span class="fold"></span>'; }
      out.cells.push(td);
    });
    if (cells.length === 1 && out.cells[0]) out.cells[0].span = sheet.cols.length;   // a title or a category runs across
    else spanText(cells, out.cells, sheet.cols.length);
    out.cells = out.cells.filter(td => !td.gone);
    for (const td of out.cells) if (td.lead) td.html = td.lead + td.html;
    return out;
  });
}
/* as in Excel, a text runs on over the empty cells after it: to the end of the row (a note in a short row), or, from the
   first column, to an input (a label before its value); otherwise an empty cell keeps its column */
function spanText(cells, tds, n) {
  for (let i = cells.length - 1; i >= 0; i--) {
    if (typeof cells[i] !== 'string' || !cells[i]) continue;
    let j = i + 1;
    while (j < cells.length && (cells[j] === null || cells[j] === undefined || cells[j] === '')) j++;
    const end = j >= cells.length ? n : j;
    if (end - i < 2 || (j < cells.length && !(i === 0 && cells[j] && cells[j].input))) continue;
    for (let k = i + 1; k < Math.min(j, cells.length); k++) tds[k].gone = true;
    tds[i].span = end - i;
  }
}

/* ---------- the Documents screen: an Alpine part ----------
   The piece 'docs' of core/ui.js: x-data="sheetView(docs)" over the piece 'sheet' below; docs {title, subtitle,
   warnings: [text], book, ready(sheet)}:
   ready gets {set(book), restore(), xlsx(file)} once the screen is up. Tabs (one per sheet) over the table of the current
   one; the inputs may change until a reload, the formulas follow them. */
ui.part('sheet', `<h1 x-text="title"></h1><p class="sub" x-show="subtitle" x-text="subtitle"></p>
  <div class="issues" x-show="warnings.length"><b x-text="warnings.length + ' × to correct in the data'"></b><ul><template x-for="w in warnings"><li x-text="w"></li></template></ul></div>
  <div class="docsheets">
    <div class="toggle sheettabs" role="tablist" x-show="names.length > 1"><template x-for="(name, i) in names" :key="i">
      <button role="tab" :aria-selected="String(i === current)" :data-on="i === current && ''" @click="pick(i)" x-text="name"></button></template></div>
    <div class="sheetbody" x-ref="body"><div class="sheetwrap" x-ref="wrap" x-show="rows.length">
      <table class="sheet" x-ref="table" @click="click($event)" @change="change($event)"><template x-for="row in rows" :key="row.i">
        <tr :class="row.kind" :hidden="row.hidden"><template x-for="(c, ci) in row.cells" :key="ci">
          <td :class="c.cls" :colspan="c.span" :title="c.title" :style="c.style" x-html="c.html"></td></template></tr></template></table></div></div>
  </div>`);
ui.component('sheetView', view);
function view(docs) {
  const d = Alpine.raw(docs), original = new Map();   // input cell -> its value as handed in
  let book = null, fit = () => {};
  return {
    title: d.title, subtitle: d.subtitle || '', warnings: d.warnings || [], names: [], current: 0, rows: /** @type {Object<string, any>[]} */ ([]),
    init() { this.$nextTick(() => this.start()); },   // after the piece is in
    start() {
      this.take(d.book);
      const { wrap, table } = this.$refs;
      fit = () => { const sheet = book.sheets[this.current], room = wrap.clientWidth - 2;
        if (sheet.rows && room > 0) setColumns(table, sheet.cols.map(c => (c.fix || c.share ? c : { share: c.width || 1 })), room); };
      new ResizeObserver(() => requestAnimationFrame(fit)).observe(wrap);
      if (document.fonts) document.fonts.ready.then(fit);
      this.draw();
      if (d.ready) d.ready({ set: b => this.set(b), restore: () => this.restore(), xlsx: file => xlsx({ sheets: book.sheets.filter(s => s.rows) }, file) });
    },
    take(b) {
      book = b; original.clear();
      for (const s of book.sheets) for (const r of s.rows || []) for (const c of r.cells || []) if (c && c.input) original.set(c, c.v);
      for (const s of book.sheets) if (s.node) this.$refs.body.insertBefore(s.node, this.$refs.wrap);
      this.names = book.sheets.map(s => s.name);
    },
    /* the current sheet: its nodes shown (only hidden on another tab, so the page keeps filling them), its rows, its widths */
    draw() {
      const sheet = book.sheets[this.current];
      book.sheets.forEach((s, i) => { if (s.node) s.node.hidden = i !== this.current; });
      let open = OPEN.get(sheet);
      if (!open && sheet.rows) OPEN.set(sheet, open = new Set(sheet.tree === 'open' ? sheet.rows.map((r, i) => i) : []));
      this.rows = sheet.rows ? grid(sheet, open, original) : [];
      this.refresh();
      this.$refs.body.scrollTop = 0;
      const t = this.$refs.table;                // a new sheet is measured in its own layout, not in the last one's widths
      t.querySelector(':scope > colgroup')?.remove(); t.style.tableLayout = t.style.width = '';
      this.$nextTick(fit);
    },
    /* the formula cells, again after every change of an input */
    refresh() {
      const sheet = book.sheets[this.current], v = evaluator(book);
      for (const row of this.rows) for (const c of row.cells) if (c.f) c.html = esc(show(v(sheet, c.f[0], c.f[1]), c.f[2], c.f[3]));
    },
    pick(i) { if (i !== this.current) { this.current = i; this.draw(); } },
    click(e) {
      const f = e.target.closest('[data-fold]'), a = e.target.closest('a[data-sheet]');
      if (f) {                                 // a row opens or closes its children; the view stays where it is
        const ri = +f.dataset.fold, open = OPEN.get(book.sheets[this.current]);
        if (open.has(ri)) open.delete(ri); else open.add(ri);
        for (const row of this.rows) {
          if (row.parents) row.hidden = row.parents.some(p => !open.has(p));
          if (row.fold === ri) row.cells[0].html = row.cells[0].html.replace(/^<button[^>]*>[^<]*<\/button>/, foldHtml(ri, open.has(ri)));
        }
      }
      if (a) { e.preventDefault(); this.go(a.dataset.sheet, +a.dataset.row); }
    },
    change(e) {
      const at = e.target.dataset.cell;
      if (!at) return;
      const [ri, ci] = at.split(':').map(Number), cell = book.sheets[this.current].rows[ri].cells[ci];
      cell.v = e.target.value === '' ? 0 : +e.target.value;
      e.target.classList.toggle('changed', cell.v !== original.get(cell));
      this.refresh();
    },
    /* a link inside the book: that sheet, its row in view and flashed */
    go(name, row) {
      const i = book.sheets.findIndex(s => s.name === name);
      if (i < 0) return;
      this.current = i; this.draw();
      this.$nextTick(() => {
        const tr = this.$refs.table.querySelectorAll(':scope > tr')[row - 1];
        if (tr) { tr.scrollIntoView({ block: 'center' }); tr.classList.remove('flash'); void tr.offsetWidth; tr.classList.add('flash'); }
      });
    },
    restore() { for (const [c, v] of original) c.v = v; this.draw(); },
    /* a new book (the project changed): the same tab stays open */
    set(b) { const name = book.sheets[this.current]?.name; this.take(b); this.current = Math.max(0, book.sheets.findIndex(s => s.name === name)); this.draw(); }
  };
}
/* ---------- XLSX: the same cells, the formulas live (SheetJS, loaded on the first export) ---------- */
let sheetJS = null;
function loadSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return sheetJS ||= new Promise((resolve, reject) => {
    const s = el('script', { src: XLSX_URL, onload: () => resolve(window.XLSX), onerror: () => { sheetJS = null; reject(new Error('no network: SheetJS cannot be loaded')); } });
    document.head.append(s);
  });
}
/** @param {{ sheets: TableSheet[] }} book @param {string} file */
async function xlsx(book, file) {
  const XL = await loadSheetJS(), wb = XL.utils.book_new(), value = evaluator(book);
  for (const sheet of book.sheets) {
    const ws = {}, links = [];
    let maxC = 0;
    sheet.rows.forEach((row, ri) => (row.cells || []).forEach((cell, ci) => {
      if (cell === null || cell === undefined || cell === '') return;
      const ref = letter(ci) + (ri + 1);
      maxC = Math.max(maxC, ci);
      const z = cell.z ?? sheet.cols[ci]?.z;
      if (typeof cell === 'string') ws[ref] = { t: 's', v: cell };
      else if (typeof cell === 'number') ws[ref] = { t: 'n', v: cell };
      else if ('v' in cell) ws[ref] = { t: 'n', v: Number(cell.v) || 0 };
      else if (cell.f) ws[ref] = { t: 'n', f: cell.f, v: value(sheet, ci, ri + 1) };
      else if (cell.href) { ws[ref] = { t: 's', v: linkText(cell) }; links.push([ref, cell.href]); }
      else if (cell.links) { ws[ref] = { t: 's', v: withLinks(cell) }; if (cell.links.length) links.push([ref, cell.links[0].href]); }
      else ws[ref] = { t: 's', v: String(cell) };
      if (z && ws[ref].t === 'n') ws[ref].z = z;
    }));
    for (const [ref, url] of links) ws[ref].l = { Target: url };
    ws['!ref'] = 'A1:' + letter(Math.max(maxC, sheet.cols.length - 1)) + Math.max(1, sheet.rows.length);
    ws['!cols'] = sheet.cols.map(c => ({ wch: c.width || 12 }));
    if (sheet.rows.some(r => r.level !== undefined)) ws['!rows'] = sheet.rows.map(r => (r.level ? { level: Math.min(r.level, 7) } : {}));   // the outline
    XL.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));   // Excel's limit on a sheet's name
  }
  XL.writeFile(wb, file);
}

/* the bottom menu of Documents: the XLSX of the book, the inputs back as handed in; sheet(): the sheet shown */
const menu = (/** @type {() => any} */ sheet, /** @type {string} */ file) => [
  { name: 'Save XLSX', go: e => { const b = e.currentTarget, label = b.textContent; sheet().xlsx(file).catch(() => { b.textContent = 'No network: try again'; setTimeout(() => { b.textContent = label; }, 2500); }); } },
  { name: 'Restore data', go: () => sheet().restore() }];

return { evaluator, xlsx, view, menu };
}
