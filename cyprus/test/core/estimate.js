// @ts-check
// test/core/estimate.js: core/estimate.js by use cases, as a room's Documents use it: items by category with their quantities
// and prices, a quantity a formula of another's and of a parameter, the sums by group, the reserve, the total, what is not
// included. Every function in one.

import * as module from '../../core/estimate.js';
import { evaluator } from '../../core/sheet.js';
import { uses } from '../uses.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(module);
  const { sheet, row } = $.estimate({ title: 'Estimate of a cabinet', info: 'PLN gross', params: [{ key: 'waste', label: 'Waste', v: 0.1, pct: true }],
    categories: [
      { name: 'Boards', group: 'Furniture', items: [{ id: 'board', name: 'Board', unit: 'm²', qty: 2, price: 100 },
        { id: 'edge', name: 'Edge banding', unit: 'm', qty: ref => ({ f: `${ref.item('board')}*(1+${ref.param('waste')})*3` }), price: 5, source: { text: '', links: [{ text: 'shop', href: 'https://shop.example' }] } }] },
      { name: 'Hardware', group: 'Furniture', items: [{ id: 'hinge', name: 'Hinge', qty: 4, price: 15 }, { id: 'pins', name: 'Pins', qty: 1, price: null }] },
      { name: 'Appliances', group: 'Appliances', items: [{ id: 'oven', name: 'Oven', qty: 1, price: 1899 }] }],
    totals: [{ label: 'Furniture', group: 'Furniture' }, { label: 'Appliances', group: 'Appliances' }],
    reserve: { label: 'Reserve', note: '% of the furniture', v: 0.05, of: 0 }, excluded: ['Labour'], after: [['', 'See the notes.']] });
  const v = evaluator({ sheets: [sheet] }), H = (/** @type {number} */ r) => v(sheet, 7, r), E = (/** @type {number} */ r) => v(sheet, 4, r);
  const kind = (/** @type {string} */ k) => sheet.rows?.findIndex(r => r.kind === k) ?? -1;
  check('the sheet Estimate: its title, its parameters as inputs (the waste a percentage)', sheet.name === 'Estimate' && sheet.rows?.[0].cells[0] === 'Estimate of a cabinet' && sheet.rows?.[2].cells[2].input === true && sheet.rows?.[2].cells[2].pct === true);
  check('an item: its quantity and price the viewer may change, its value their product', E(row.board) === 2 && H(row.board) === 200 && sheet.rows?.[row.board - 1].cells[4].input === true);
  check('a quantity of another item\'s and a parameter: 2 × 1.1 × 3 = 6.6, at 5: 33', Math.abs(E(row.edge) - 6.6) < 1e-9 && H(row.edge) === 33);
  check('an item without a price: no value', sheet.rows?.[row.pins - 1].cells[7] === '' && sheet.rows?.[row.pins - 1].cells[6] === '');
  check('a category: its sum on its row (Boards 233, Hardware 60)', H(row.board - 1) === 233 && H(row.hinge - 1) === 60);
  const sums = sheet.rows?.flatMap((r, i) => (r.kind === 'sum' ? [i + 1] : [])) || [];
  check('the totals by group (Furniture 293, Appliances 1899), the reserve 5 % of the furniture (14.65)', H(sums[0]) === 293 && H(sums[1]) === 1899 && H(sums[2]) === 14.65);
  check('the total: every sum and the reserve', Math.abs(H(kind('grand') + 1) - (293 + 1899 + 14.65)) < 1e-9);
  check('what is not included; the rows after', sheet.rows?.some(r => r.cells[1] === '• Labour') === true && sheet.rows?.[sheet.rows.length - 1].cells[1] === 'See the notes.');
  check('the source: its links', sheet.rows?.[row.edge - 1].cells[8].links[0].href === 'https://shop.example');
  check('its columns: No., Item … Price source, the money in two decimals', module.ESTIMATE_COLUMNS.length === 9 && sheet.cols[7].digits === 2);

  check('the API: every function in a use case' + (missing().length ? ': not ' + missing().join(', ') : ''), missing().length === 0);
}
