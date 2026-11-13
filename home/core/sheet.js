/* core/sheet.js: the spreadsheet of every application's Info (../project.md, Flow: Info): sheets in tabs, input cells
   the viewer may change (until a reload), formulas that follow them, and the XLSX with the same formulas live.
   Knows no project: a page hands in the workbook.

   book   {sheets: [{name, cols: [{title, width, digits}], rows: [{kind, cells}]}]}
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
(function (CORE) {
'use strict';

const el = CORE.ui.el;
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
    if (busy.has(key)) throw new Error('cykl w formule: ' + key);
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
  : v.toLocaleString('pl-PL', d === undefined ? { maximumFractionDigits: 3 } : { minimumFractionDigits: d, maximumFractionDigits: d }));
/* what a link shows: its name, or for a bare address its site (www.ogony.pl/... -> ogony.pl) */
const linkText = l => (l.text && l.text !== l.href ? l.text : (l.href.match(/^\w+:\/\/(?:www\.)?([^/?#]+)/) || [, l.href])[1]);
/* the text of a cell with links, as the XLSX has it */
const withLinks = c => [c.text, c.links.map(linkText).join(' · ')].filter(Boolean).join('\n');
/* '#'Notatki'!A12' -> [sheet name, row] */
const target = href => { const m = href.match(/^#'?([^'!]+)'?!\$?[A-Z]+\$?(\d+)$/); return m && [m[1], +m[2]]; };

/* draws book into box: tabs (one per sheet) over the table of the current one; returns {xlsx(file), restore()} */
function create(box, book) {
  const original = new Map();   // input cell -> its value as handed in
  for (const s of book.sheets) for (const r of s.rows) for (const c of r.cells || []) if (c && c.input) original.set(c, c.v);
  let current = 0;
  const tabs = el('div', { className: 'toggle sheettabs', role: 'tablist' }), wrap = el('div', { className: 'sheetwrap' });
  box.innerHTML = ''; box.append(tabs, wrap);

  function draw() {
    tabs.hidden = book.sheets.length < 2;
    tabs.innerHTML = book.sheets.map((s, i) => `<button role="tab" data-i="${i}" aria-selected="${i === current}"${i === current ? ' data-on' : ''}>${s.name}</button>`).join('');
    const sheet = book.sheets[current], value = evaluator(book), formulas = [];
    const table = el('table', { className: 'sheet' });
    if (sheet.cols.some(c => c.width)) table.append(el('colgroup', {}, sheet.cols.map(c => `<col${c.width ? ` style="width:${c.width}ch"` : ''}>`).join('')));
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
          if (cell.text) td.append(cell.text + '\n');
          cell.links.forEach((l, i) => td.append(...(i ? [' · '] : []), anchor(l)));
        }
        else if (cell !== null && cell !== undefined) td.textContent = cell;
        tr.append(td);
      });
      if (row.cells?.length === 1 && tr.firstChild) tr.firstChild.colSpan = sheet.cols.length;   // a title or a category runs across
      table.append(tr);
    });
    wrap.innerHTML = ''; wrap.append(table);
    /* the formula cells of this sheet, again after every change of an input */
    function refresh() { const v = evaluator(book); for (const [td, c, r, d, pct] of formulas) td.textContent = show(v(sheet, c, r), d, pct); }
    refresh();
  }
  /* a link: inside the book it opens that sheet, outside a new tab */
  function anchor(l) {
    const a = el('a', { href: l.href, textContent: linkText(l), title: l.href }), to = target(l.href);
    if (to) a.onclick = e => { e.preventDefault(); go(...to); };
    else Object.assign(a, { target: '_blank', rel: 'noopener' });
    return a;
  }
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
    xlsx: file => xlsx(book, file),
  };
}

/* ---------- XLSX: the same cells, the formulas live (SheetJS, loaded on the first export) ---------- */
let sheetJS = null;
function loadSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return sheetJS ||= new Promise((resolve, reject) => {
    const s = el('script', { src: XLSX_URL, onload: () => resolve(window.XLSX), onerror: () => { sheetJS = null; reject(new Error('Brak sieci: nie można wczytać SheetJS')); } });
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

CORE.sheet = { create, xlsx, letter };
})(window.CORE = window.CORE || {});
