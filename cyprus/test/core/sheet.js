// @ts-check
// test/core/sheet.js: core/sheet.js by use cases: an estimate's sums as the viewer changes a price; a formula reading another
// sheet; a cycle named; numbers as the page shows them; links (to a shop, inside the book); a sheet as the XLSX's worksheet
// (its cells, formulas live, links, widths, outline). Every function in one.

import * as sheet from '../../core/sheet.js';
import { uses } from '../uses.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(sheet);

  /* --- use case: an estimate: quantity × price, a sum; the viewer changes a price, the sums follow --- */
  const price = { v: 12.5, input: true };
  /** @type {import('../../core/sheet.js').Book} */
  const book = { sheets: [
    { name: 'Estimate', cols: [{ width: 30 }, { width: 8 }, { width: 10, digits: 2, z: '#,##0.00' }, { width: 12, digits: 2 }], rows: [
      { kind: 'title', cells: ['Estimate'] },
      { kind: 'head', cells: ['Item', 'Qty', 'Price', 'Value'] },
      { cells: ['Hinges', 8, price, { f: 'B3*C3' }] },
      { cells: ['Legs', 4, { v: 3, input: true }, { f: 'B4*C4' }] },
      { kind: 'sum', cells: ['Total', '', '', { f: 'ROUND(SUM(D3:D4),2)' }] },
      { cells: [{ text: 'Blum', href: 'https://www.blum.com/pl/pl/' }, { text: 'see the notes', href: "#'Notes'!A2" }] }] },
    { name: 'Notes', cols: [{ width: 60 }], rows: [{ kind: 'title', cells: ['Notes'] }, { cells: ['The total is ', { f: "Estimate!D5" }] }] }] };
  let value = $.evaluator(book);
  check('the formulas: quantity × price, the sum, rounded (8 × 12.5 + 4 × 3 = 112)', value(book.sheets[0], 3, 5) === 112);
  price.v = 14;
  value = $.evaluator(book);
  check('a price changed: the sums follow (8 × 14 + 12 = 124), another sheet reading it too', value(book.sheets[0], 3, 5) === 124 && value(book.sheets[1], 1, 2) === 124);
  /** @type {import('../../core/sheet.js').Book} */
  const loop = { sheets: [{ name: 'Loop', cols: [{}], rows: [{ cells: [{ f: 'A2' }] }, { cells: [{ f: 'A1' }] }] }] };
  let said = '';
  try { $.evaluator(loop)(loop.sheets[0], 0, 1); } catch (e) { said = String(e); }
  check('a cycle in the formulas: it says where', said.includes('a cycle') && said.includes('Loop!A'));

  /* --- use case: the page shows a number, a link --- */
  check('a number: its decimals, thousands grouped; a share as a percentage; none: a dash', $.shown(1234.5, 2) === '1,234.50' && $.shown(0.155, undefined, true) === '15.5%' && $.shown(NaN) === '–');
  check('a link: its name; a bare address: its site', $.linkText({ text: 'Blum', href: 'https://www.blum.com/pl/pl/' }) === 'Blum' && $.linkText({ href: 'https://www.ogony.pl/a/b' }) === 'ogony.pl');
  check('a link inside the book: its sheet and row; another: none', JSON.stringify($.target("#'Notes'!A2")) === '["Notes",2]' && $.target('https://blum.com') === null);
  check('a column\'s letters: A, Z, AA', $.letter(0) === 'A' && $.letter(25) === 'Z' && $.letter(26) === 'AA');

  /* --- use case: the XLSX: a sheet as its worksheet, the formulas live with their values --- */
  const ws = $.worksheet(book.sheets[0], value);
  check('its cells: text, numbers, an input as a number, a formula live with its value, its format', ws.A3.v === 'Hinges' && ws.B3.v === 8 && ws.C3.v === 14 && ws.C3.z === '#,##0.00' && ws.D5.f === 'ROUND(SUM(D3:D4),2)' && ws.D5.v === 124);
  check('its links: to a shop, inside the book', ws.A6.l.Target === 'https://www.blum.com/pl/pl/' && ws.B6.l.Target === "#'Notes'!A2");
  check('its range and the columns\' widths', ws['!ref'] === 'A1:D6' && ws['!cols'].map((/** @type {any} */ c) => c.wch).join() === '30,8,10,12');
  const tree = $.worksheet({ name: 'Tree', cols: [{}], rows: [{ level: 0, cells: ['a'] }, { level: 1, cells: ['b'] }] }, value);
  check('a tree: its rows\' outline levels', tree['!rows'][1].level === 1);

  check('the API: every function in a use case' + (missing().length ? ': not ' + missing().join(', ') : ''), missing().length === 0);
}
