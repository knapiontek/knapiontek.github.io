// @ts-check
// docs.js: the Documents mode: the book of what is shown (the house, a floor, a room), its screen and its XLSX. The book: the
// sheets of the house (house/docs.js) or of a room (room/docs.js), and two every view has: Elements (the hierarchy of what is
// shown, each node where it is in its parent, its size) and Test (the checks, each with what to correct under it). The
// screen (an Alpine part: the piece 'docs' over 'sheet'): a title, what to correct in the data, a tab a sheet, its table; the
// inputs the viewer may change (until a reload), the formulas follow them; a link into the book opens that sheet at its row.
// The XLSX: the same cells, the formulas live (core/sheet.js; SheetJS from its CDN, loaded on the first export).

import { evaluator, linkText, shown, target, worksheet } from './core/sheet.js';
import { component, part, setColumns } from './core/ui.js';

/** @typedef {import('./core/sheet.js').Book} Book */
/** @typedef {import('./core/sheet.js').Sheet} Sheet */
/** @typedef {import('./core/sheet.js').Row} Row */
/** @typedef {import('./core/hierarchy.js').HierarchyNode} Node */
/** @typedef {{ name: string, about?: string, items: string[], info?: boolean }} Check  OK when items is empty; info: to know, not to correct */
/** @typedef {{ title: string, subtitle?: string, warnings?: string[], book: Book, ready?: (s: { set: (b: Book) => void, restore: () => void, xlsx: (file: string) => Promise<void> }) => void }} Docs  what the screen shows; ready: its controls, once it is up */

const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';   // SheetJS, pinned
const mm = (/** @type {number} */ v) => Math.round(v * 10) / 10;

/**
 * The sheet Elements: the hierarchy under node, closed to its first level: each node's name, its path, its offset from its
 * parent's zero in its parent's axes, its size (mm).
 * @param {{ path: (n: Node) => string }} H @param {Node} node @param {string} title @returns {Sheet}
 */
export function elementsSheet(H, node, title) {
  const sheet = /** @type {Sheet & { rows: Row[] }} */ ({ name: 'Elements', tree: 'closed', cols: [{ width: 44, share: 3 }, { width: 40, share: 2 }, ...Array(6).fill({ width: 9, fix: 7 })],
    rows: [{ kind: 'title', cells: [title] }, { kind: 'head', cells: ['Node', 'Path', 'x', 'y', 'h', 'Size x', 'Size y', 'Size h'] }] });
  (function walk(/** @type {Node} */ n, /** @type {number} */ level) {
    sheet.rows.push({ level, ...(level ? {} : { kind: 'cat' }), cells: [n.name || n.id, H.path(n), ...n.offset.map(mm), ...n.size.map(mm)] });
    for (const c of n.children || []) walk(c, level + 1);
  })(node, 0);
  sheet.rows.push({ cells: ['A node at its offset from its parent\'s zero, in its parent\'s axes (turned by its parent\'s quarter turns); its size to its opposite corner (a cabinet from its wall: y below 0).'] });
  return sheet;
}

/** the sheet Test: each check, its result (OK; how many to correct, listed under it; i: to know), what it checks @param {string} title @param {Check[]} checks @returns {Sheet} */
export function testSheet(title, checks) {
  const sheet = /** @type {Sheet & { rows: Row[] }} */ ({ name: 'Test', tree: 'open', cols: [{ width: 44, share: 2 }, { width: 70, share: 4 }, { width: 10, fix: 8 }],
    rows: [{ kind: 'title', cells: [title] }, { kind: 'head', cells: ['Test', 'Details: what it checks', 'Result'] }] });
  for (const c of checks) {
    sheet.rows.push({ level: 0, cells: [c.name, c.about || '', c.info ? 'i' : c.items.length ? String(c.items.length) : 'OK'] });
    for (const i of c.items) sheet.rows.push({ level: 1, cells: [i, '', ''] });
  }
  sheet.rows.push({ cells: ['Result: OK, nothing to correct; a number, how many to correct (listed under it); i, to know, not a fault.'] });
  return sheet;
}

/**
 * The book of what is shown: its own sheets (the house's, a room's), then Elements and Test.
 * @param {{ path: (n: Node) => string }} H @param {Node} node @param {string} title @param {Check[]} checks @param {Sheet[]} [own] @returns {Book}
 */
export const bookOf = (H, node, title, checks, own = []) => ({ sheets: [...own, elementsSheet(H, node, title), testSheet('Test of ' + title, checks)] });

/* ================= THE XLSX ================= */
/** @type {Promise<any> | null} */
let sheetJS = null;
const loadSheetJS = () => /** @type {any} */ (window).XLSX ? Promise.resolve(/** @type {any} */ (window).XLSX) : sheetJS ||= new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = XLSX_URL; s.onload = () => resolve(/** @type {any} */ (window).XLSX); s.onerror = () => { sheetJS = null; reject(new Error('no network: SheetJS cannot be loaded')); };
  document.head.append(s);
});
/** a book written as an XLSX file (its sheets with rows), the formulas live @param {Book} book @param {string} file */
export async function saveXlsx(book, file) {
  const XL = await loadSheetJS(), wb = XL.utils.book_new(), value = evaluator(book);
  for (const sheet of book.sheets.filter(s => s.rows)) XL.utils.book_append_sheet(wb, worksheet(sheet, value), sheet.name.slice(0, 31));   // Excel's limit on a sheet's name
  XL.writeFile(wb, file);
}

/* ================= THE SCREEN ================= */
const esc = (/** @type {any} */ v) => String(v ?? '').replace(/[&<>"]/g, c => (/** @type {Record<string, string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }))[c]);
/** @type {WeakMap<Sheet, Set<number>>} a tree sheet: its open rows */
const OPEN = new WeakMap();
/** a link as HTML: a link inside the book carries its sheet and row @param {{ text?: string, href: string }} l */
const anchor = l => { const to = target(l.href);
  return `<a href="${esc(l.href)}" title="${esc(l.href)}"${to ? ` data-sheet="${esc(to[0])}" data-row="${to[1]}"` : ' target="_blank" rel="noopener"'}>${esc(linkText(l))}</a>`; };
/** a text as HTML, an address in it a link with its site's name @param {string} text */
const linked = text => text.split(/(https?:\/\/[^\s)]+)/).map((t, k) => (k % 2 ? anchor({ href: t }) : esc(t))).join('');
const foldHtml = (/** @type {number} */ ri, /** @type {boolean} */ open) => `<button class="fold" data-fold="${ri}" title="${open ? 'Close' : 'Open'}">${open ? '−' : '+'}</button>`;

/**
 * The cells of a sheet as the table shows them: rows [{ kind, hidden, cells: [{ cls, span, title, style, html, f: [col, row,
 * digits, pct] }], fold }]; a formula's value set by refresh.
 * @param {Sheet} sheet @param {Set<number>} open @param {Map<any, number>} original
 */
function grid(sheet, open, original) {
  const rows = sheet.rows || [], isTree = (/** @type {Row | undefined} */ r) => r && r.level !== undefined, parent = /** @type {number[]} */ ([]);
  return rows.map((row, ri) => {
    /** @type {Record<string, any>} */
    const out = { i: ri, kind: row.kind || '', hidden: false, cells: [] };
    let fold = null;
    if (isTree(row)) {
      const level = /** @type {number} */ (row.level);
      parent.length = level;
      out.hidden = parent.some(p => !open.has(p));
      out.parents = parent.slice(0, level);
      parent[level] = ri;
      const next = rows[ri + 1];
      if (isTree(next) && /** @type {number} */ (next.level) > level) fold = out.fold = ri;
    }
    const cells = row.cells || [];
    cells.forEach((cell, ci) => {
      const d = cell?.digits ?? sheet.cols[ci]?.digits, /** @type {Record<string, any>} */ td = { cls: '', span: false, title: false, style: '', html: '' };
      if (typeof cell === 'number') { td.cls = 'n'; td.html = esc(shown(cell, d)); }
      else if (cell && typeof cell === 'object' && 'v' in cell && !cell.input) { td.cls = 'n'; td.html = esc(shown(cell.v, d, cell.pct)); }
      else if (cell && cell.input) { td.cls = 'n'; td.html = `<input type="number" step="any" value="${esc(cell.v)}" data-cell="${ri}:${ci}"${cell.v !== original.get(cell) ? ' class="changed"' : ''}>`; }
      else if (cell && cell.f) { td.cls = 'n'; td.title = '=' + cell.f; td.f = [ci, ri + 1, d, cell.pct]; }
      else if (cell && cell.href) td.html = anchor(cell);
      else if (cell && cell.links) td.html = (cell.text ? linked(cell.text + '\n') : '') + cell.links.map(anchor).join(' · ');
      else if (cell !== null && cell !== undefined) td.html = linked(String(cell));
      if (ci === 0 && isTree(row)) { td.cls = (td.cls + ' node').trim(); td.style = `padding-left: ${0.5 + /** @type {number} */ (row.level) * 1.1}em;`; td.lead = fold !== null ? foldHtml(ri, open.has(ri)) : '<span class="fold"></span>'; }
      out.cells.push(td);
    });
    if (cells.length === 1 && out.cells[0]) out.cells[0].span = sheet.cols.length;   // a title or a category runs across
    else spanText(cells, out.cells, sheet.cols.length);
    out.cells = out.cells.filter((/** @type {any} */ td) => !td.gone);
    for (const td of out.cells) if (td.lead) td.html = td.lead + td.html;
    return out;
  });
}
/**
 * As in Excel, a text runs on over the empty cells after it: to the end of the row (a note in a short row), or, from the first
 * column, to an input (a label before its value); otherwise an empty cell keeps its column.
 * @param {any[]} cells @param {any[]} tds @param {number} n
 */
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

part('docs', `<div id="documents" aria-label="Documents" x-show="mode === 'documents'" x-cloak><template x-if="docs"><div class="docview" x-data="sheetView(docs)"><template x-part="sheet"></template></div></template></div>`);
part('sheet', `<h1 x-text="title"></h1><p class="sub" x-show="subtitle" x-text="subtitle"></p>
  <div class="issues" x-show="warnings.length"><b x-text="warnings.length + ' × to correct in the data'"></b><ul><template x-for="w in warnings"><li x-text="w"></li></template></ul></div>
  <div class="docsheets">
    <div class="toggle sheettabs" role="tablist" x-show="names.length > 1"><template x-for="(name, i) in names" :key="i">
      <button role="tab" :aria-selected="String(i === current)" :data-on="i === current && ''" @click="pick(i)" x-text="name"></button></template></div>
    <div class="sheetbody" x-ref="body"><div class="sheetwrap" x-ref="wrap" x-show="rows.length">
      <table class="sheet" x-ref="table" @click="click($event)" @change="change($event)"><template x-for="row in rows" :key="row.i">
        <tr :class="row.kind" :hidden="row.hidden"><template x-for="(c, ci) in row.cells" :key="ci">
          <td :class="c.cls" :colspan="c.span" :title="c.title" :style="c.style" x-html="c.html"></td></template></tr></template></table></div></div>
  </div>`);
component('sheetView', sheetView);
/**
 * The Documents screen: tabs (a sheet each) over the table of the current one.
 * @param {Docs} docs
 */
function sheetView(docs) {
  const d = /** @type {Docs} */ (/** @type {any} */ (globalThis).Alpine.raw(docs)), original = new Map();   // an input cell: its value as handed in
  /** @type {Book} */ let book = { sheets: [] };
  let fit = () => {};
  return {
    title: d.title, subtitle: d.subtitle || '', warnings: d.warnings || [], names: /** @type {string[]} */ ([]), current: 0, rows: /** @type {any[]} */ ([]),
    /** @this {any} Alpine's: $refs, $nextTick */
    init() { this.$nextTick(() => this.start()); },   // after the piece is in
    /** @this {any} */
    start() {
      this.take(d.book);
      const { wrap, table } = this.$refs;
      fit = () => { const sheet = book.sheets[this.current], room = wrap.clientWidth - 2;
        if (sheet?.rows && room > 0) setColumns(table, sheet.cols.map(c => (c.fix || c.share ? c : { share: c.width || 1 })), room); };
      new ResizeObserver(() => requestAnimationFrame(fit)).observe(wrap);
      if (document.fonts) document.fonts.ready.then(fit);
      this.draw();
      if (d.ready) d.ready({ set: b => this.set(b), restore: () => this.restore(), xlsx: file => saveXlsx(book, file) });
    },
    /** @param {Book} b */
    take(b) {
      book = b; original.clear();
      for (const s of book.sheets) for (const r of s.rows || []) for (const c of r.cells || []) if (c && c.input) original.set(c, c.v);
      this.names = book.sheets.map(s => s.name);
    },
    /** the current sheet: its rows, its widths @this {any} */
    draw() {
      const sheet = book.sheets[this.current];
      let open = OPEN.get(sheet);
      if (!open && sheet?.rows) OPEN.set(sheet, open = new Set(sheet.tree === 'open' ? sheet.rows.map((r, i) => i) : []));
      this.rows = sheet?.rows && open ? grid(sheet, open, original) : [];
      this.refresh();
      this.$refs.body.scrollTop = 0;
      const t = this.$refs.table;   // a new sheet measured in its own layout, not in the last one's widths
      t.querySelector(':scope > colgroup')?.remove(); t.style.tableLayout = t.style.width = '';
      this.$nextTick(fit);
    },
    /* the formula cells, again after every change of an input */
    refresh() {
      const sheet = book.sheets[this.current], v = evaluator(book);
      for (const row of this.rows) for (const c of row.cells) if (c.f) c.html = esc(shown(v(sheet, c.f[0], c.f[1]), c.f[2], c.f[3]));
    },
    /** @param {number} i */
    pick(i) { if (i !== this.current) { this.current = i; this.draw(); } },
    /** @param {any} e */
    click(e) {
      const f = e.target.closest('[data-fold]'), a = e.target.closest('a[data-sheet]');
      if (f) {   /* a row opens or closes its children; the view stays where it is */
        const ri = +f.dataset.fold, open = /** @type {Set<number>} */ (OPEN.get(book.sheets[this.current]));
        if (open.has(ri)) open.delete(ri); else open.add(ri);
        for (const row of this.rows) {
          if (row.parents) row.hidden = row.parents.some((/** @type {number} */ p) => !open.has(p));
          if (row.fold === ri) row.cells[0].html = row.cells[0].html.replace(/^<button[^>]*>[^<]*<\/button>/, foldHtml(ri, open.has(ri)));
        }
      }
      if (a) { e.preventDefault(); this.go(a.dataset.sheet, +a.dataset.row); }
    },
    /** @param {any} e */
    change(e) {
      const at = e.target.dataset.cell;
      if (!at) return;
      const [ri, ci] = at.split(':').map(Number), cell = /** @type {any} */ (book.sheets[this.current].rows)[ri].cells[ci];
      cell.v = e.target.value === '' ? 0 : +e.target.value;
      e.target.classList.toggle('changed', cell.v !== original.get(cell));
      this.refresh();
    },
    /** a link inside the book: that sheet, its row in view and flashed @this {any} @param {string} name @param {number} row */
    go(name, row) {
      const i = book.sheets.findIndex(s => s.name === name);
      if (i < 0) return;
      this.current = i; this.draw();
      this.$nextTick(() => {
        const tr = this.$refs.table.querySelectorAll('tr')[row - 1];
        if (tr) { tr.scrollIntoView({ block: 'center' }); tr.classList.remove('flash'); void tr.offsetWidth; tr.classList.add('flash'); }
      });
    },
    restore() { for (const [c, v] of original) c.v = v; this.draw(); },
    /** a new book (what is shown changed): the same tab stays open @param {Book} b */
    set(b) { const name = book.sheets[this.current]?.name; this.take(b); this.current = Math.max(0, book.sheets.findIndex(s => s.name === name)); this.draw(); }
  };
}
