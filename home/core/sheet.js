/* core/sheet.js: the spreadsheet of Documents: sheets in tabs, input cells the viewer may change (until a reload),
   formulas that follow them, the XLSX with the same formulas live; and the Documents screen (a title, warnings, the book,
   the bottom menu). Knows no project: a page hands in the book. The formulas are computed without a browser.

   book   {sheets: [{name, cols: [{title, width, digits, fix | share, min, max}], rows: [{kind, cells}], node}]}
          width: characters in the XLSX; on screen fix (characters: numbers, codes, units) or share (text: its part of
          the room left, from min to max characters), HOME.ui.setColumns; with neither, a share as its width
          node: an element of the page shown in the tab (above its rows, if it has any); only hidden on another tab, so
          the page keeps filling it. A tab without rows is not in the XLSX.
          row kind: title | head | cat | sum | grand | (none: an item); a row's place in rows is its Excel row (first = 1)
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
(function (HOME) {
'use strict';

const { el, esc, LOCALE } = HOME.ui;
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';   // pinned

/* ---------- formulas ---------- */
const REF = /(?:'([^']+)'!)?\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?/g;
const column = letters => [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;   // A -> 0
const letter = i => (i >= 26 ? letter(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));
const scale = d => Math.pow(10, d || 0);
const FUNCTIONS = {
  SUM: (...a) => a.flat().reduce((s, x) => s + x, 0),
  MIN: (...a) => Math.min(...a.flat()),
  MAX: (...a) => Math.max(...a.flat()),
  ROUND: (x, d) => Math.sign(x) * Math.round(Math.abs(x) * scale(d)) / scale(d),
  ROUNDUP: (x, d) => Math.sign(x) * Math.ceil(Math.abs(x) * scale(d) - 1e-9) / scale(d),   // away from zero, as Excel
};
/* a formula as a function of C(sheet, col, row) and R(sheet, col1, row1, col2, row2) */
function compile(f) {
  const q = s => (s === undefined ? 'null' : JSON.stringify(s));
  const js = f.replace(REF, (m, sh, c1, r1, c2, r2) => (r2 ? `R(${q(sh)},${column(c1)},${r1},${column(c2)},${r2})` : `C(${q(sh)},${column(c1)},${r1})`));
  return new Function('C', 'R', ...Object.keys(FUNCTIONS), `return (${js});`);
}

/* the value of every cell: inputs as the viewer set them, formulas evaluated (text counts as 0, as in Excel) */
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

/* draws book into box: tabs (one per sheet) over the table of the current one; returns {xlsx(file), restore()} */
function create(box, book) {
  const original = new Map();   // input cell -> its value as handed in
  let current = 0;
  const tabs = el('div', { className: 'toggle sheettabs', role: 'tablist' }), body = el('div', { className: 'sheetbody' }), wrap = el('div', { className: 'sheetwrap' });
  box.innerHTML = ''; box.append(tabs, body);   // the tabs stay, the body scrolls
  function take(b) {
    book = b; original.clear();
    for (const s of book.sheets) for (const r of s.rows || []) for (const c of r.cells || []) if (c && c.input) original.set(c, c.v);
    for (const s of book.sheets) if (s.node) body.append(s.node);
    body.append(wrap);
  }
  take(book);

  function draw() {
    tabs.hidden = book.sheets.length < 2;
    tabs.innerHTML = book.sheets.map((s, i) => `<button role="tab" data-i="${i}" aria-selected="${i === current}"${i === current ? ' data-on' : ''}>${s.name}</button>`).join('');
    const sheet = book.sheets[current], value = evaluator(book), formulas = [];
    book.sheets.forEach((s, i) => { if (s.node) s.node.hidden = i !== current; });
    wrap.hidden = !sheet.rows; wrap.innerHTML = ''; body.scrollTop = 0;
    if (!sheet.rows) return;
    const table = el('table', { className: 'sheet' });
    sheet.rows.forEach((row, ri) => {
      const tr = el('tr', { className: row.kind || '' });
      (row.cells || []).forEach((cell, ci) => {
        const d = cell?.digits ?? sheet.cols[ci]?.digits, td = el('td');
        if (typeof cell === 'number') { td.className = 'n'; td.textContent = show(cell, d); }
        else if (cell && typeof cell === 'object' && 'v' in cell && !cell.input) { td.className = 'n'; td.textContent = show(cell.v, d, cell.pct); }
        else if (cell && cell.input) {
          td.className = 'n';
          const input = el('input', { type: 'number', step: 'any', value: cell.v });
          input.classList.toggle('changed', cell.v !== original.get(cell));
          input.onchange = () => { cell.v = input.value === '' ? 0 : +input.value; input.classList.toggle('changed', cell.v !== original.get(cell)); refresh(); };
          td.append(input);
        } else if (cell && cell.f) { td.className = 'n'; td.title = '=' + cell.f; formulas.push([td, ci, ri + 1, d, cell.pct]); }
        else if (cell && cell.href) td.append(anchor(cell));
        else if (cell && cell.links) {
          if (cell.text) linked(td, cell.text + '\n');
          cell.links.forEach((l, i) => td.append(...(i ? [' · '] : []), anchor(l)));
        }
        else if (cell !== null && cell !== undefined) linked(td, String(cell));
        tr.append(td);
      });
      if (row.cells?.length === 1 && tr.firstChild) tr.firstChild.colSpan = sheet.cols.length;   // a title or a category runs across
      else spanText(row.cells || [], tr, sheet.cols.length);
      table.append(tr);
    });
    wrap.innerHTML = ''; wrap.append(table);
    /* the formula cells of this sheet, again after every change of an input */
    function refresh() { const v = evaluator(book); for (const [td, c, r, d, pct] of formulas) td.textContent = show(v(sheet, c, r), d, pct); }
    refresh();
    /* on screen: the widths set in cols, over the room there is */
    HOME.ui.autoFit(table, wrap, sheet.cols.map(c => (c.fix || c.share ? c : { share: c.width || 1 })));
  }
  /* as in Excel, a text runs on over the empty cells after it: to the end of the row (a note in a short row), or, from the
     first column, to an input (a label before its value); otherwise an empty cell keeps its column */
  function spanText(cells, tr, n) {
    const tds = [...tr.children];
    for (let i = cells.length - 1; i >= 0; i--) {
      if (typeof cells[i] !== 'string' || !cells[i]) continue;
      let j = i + 1;
      while (j < cells.length && (cells[j] === null || cells[j] === undefined || cells[j] === '')) j++;
      const end = j >= cells.length ? n : j;
      if (end - i < 2 || (j < cells.length && !(i === 0 && cells[j] && cells[j].input))) continue;
      for (let k = i + 1; k < Math.min(j, cells.length); k++) tds[k].remove();
      tds[i].colSpan = end - i;
    }
  }
  /* a link: inside the book it opens that sheet, outside a new tab */
  function anchor(l) {
    const a = el('a', { href: l.href, textContent: linkText(l), title: l.href }), to = target(l.href);
    if (to) a.onclick = e => { e.preventDefault(); go(...to); };
    else Object.assign(a, { target: '_blank', rel: 'noopener' });
    return a;
  }
  /* a text into a cell, an address in it shown as a link with its site's name */
  function linked(td, text) { text.split(/(https?:\/\/[^\s)]+)/).forEach((t, k) => td.append(k % 2 ? anchor({ href: t }) : t)); }
  /* a link inside the book: that sheet, its row in view and flashed */
  function go(name, row) {
    const i = book.sheets.findIndex(s => s.name === name);
    if (i < 0) return;
    current = i; draw();
    const tr = wrap.querySelectorAll('table.sheet > tr')[row - 1];
    if (tr) { tr.scrollIntoView({ block: 'center' }); tr.classList.remove('flash'); void tr.offsetWidth; tr.classList.add('flash'); }
  }
  tabs.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { current = +b.dataset.i; draw(); } };
  draw();

  return {
    restore() { for (const [c, v] of original) c.v = v; draw(); },
    /* a new book (the project changed): the same tab stays open */
    set(b) { const name = book.sheets[current]?.name; take(b); current = Math.max(0, book.sheets.findIndex(s => s.name === name)); draw(); },
    xlsx: file => xlsx({ sheets: book.sheets.filter(s => s.rows) }, file),
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
    XL.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));   // Excel's limit on a sheet's name
  }
  XL.writeFile(wb, file);
}

/* ---------- the Documents screen ----------
   box: #documents; docs {title, subtitle, warnings: [text], book}. Returns the sheet of create: set(book), restore(), xlsx(file). */
function screen(box, docs) {
  box.innerHTML = '';
  box.append(el('h1', { textContent: docs.title }));
  if (docs.subtitle) box.append(el('p', { className: 'sub', textContent: docs.subtitle }));
  if ((docs.warnings || []).length) box.append(el('div', { className: 'issues' }, `<b>${docs.warnings.length} × to correct in the data</b><ul>${docs.warnings.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`));
  const sheets = el('div', { className: 'docsheets' });
  box.append(sheets);
  return create(sheets, docs.book);
}
/* the bottom menu of Documents: the XLSX of the book, the inputs back as handed in; sheet(): the sheet shown */
const menu = (sheet, file) => [
  { name: 'Save XLSX', go: e => { const b = e.currentTarget, label = b.textContent; sheet().xlsx(file).catch(() => { b.textContent = 'No network: try again'; setTimeout(() => { b.textContent = label; }, 2500); }); } },
  { name: 'Restore data', go: () => sheet().restore() }];

HOME.sheet = { evaluator, create, xlsx, screen, menu };
})(window.HOME = window.HOME || {});
