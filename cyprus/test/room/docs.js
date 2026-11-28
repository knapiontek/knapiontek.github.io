// @ts-check
// test/room/docs.js: room/docs.js by use cases, as the Documents of a furnished room use it, on the kitchen (room_356: its
// cabinets' and its docs' files): the sheets; the estimate's quantities from the model (the fittings, the counts, the cut
// list's m² and banding) and its total; the cut list's blocks and labels; the placeholders filled from the model, the library
// and the file; the notes; the assembly's cards. Every function in one.

import * as module from '../../room/docs.js';
import { cabinetsOf } from '../../room/cabinets.js';
import { evaluator } from '../../core/sheet.js';
import { openCatalog } from '../../library/catalog.js';
import { uses } from '../uses.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(module);
  const catalog = await openCatalog(), json = async (/** @type {string} */ f) => (await fetch(new URL('../../room/' + f, import.meta.url))).json();
  const file = await json('room_356.cabinets.json'), docs = await json('room_356.docs.json'), cabinets = cabinetsOf(file, catalog);

  /* --- use case: a room's sheets from its files --- */
  const sheets = await $.roomSheets({ id: 'room_356' }, catalog);
  check('the kitchen\'s sheets: Estimate, Cut list, Assembly, Notes', sheets.map(s => s.name).join() === 'Estimate,Cut list,Assembly,Notes');
  const { sheets: S, fill } = $.docsOf({ cabinets, file, docs, catalog }), [E, C, A, N] = S, v = evaluator({ sheets: S });
  check('the same from the model handed in', JSON.stringify(S) === JSON.stringify(sheets));

  /* --- use case: the estimate: a quantity from the model, the library's price, the value --- */
  const item = (/** @type {string} */ name) => /** @type {number} */ (E.rows?.findIndex(r => r.cells[1] === name)) + 1;
  check('hinges and bumpers: the fittings placed (29 each), at the library\'s price', v(E, 4, item('Zawias Blum z prowadnikiem')) === 29 && v(E, 4, item('Odbojnik Blum')) === 29 && E.rows?.[item('Zawias Blum z prowadnikiem') - 1].cells[6].v === 16.73);
  check('legs 40, their plinth clips half; shelf pins a pack (64), handles in pairs (12)', v(E, 4, item('Nóżki Häfele AXILO')) === 40 && v(E, 4, item('Klips cokołu Häfele')) === 20 && v(E, 4, item('Podpórki półek')) === 1 && v(E, 4, item('Uchwyt IKEA ENERYDA')) === 12);
  const fronts = E.rows?.[item('Shaker fronts') - 1].cells[4];
  check('the fronts: the cut list\'s m² (its cell, live in the XLSX), 8.347', fronts.f === "'Cut list'!$G$26" && Math.abs(v(E, 4, item('Shaker fronts')) - 8.34735) < 1e-9);
  check('the carcass board: the sheets to buy, the m² with the waste over a sheet, up (7)', /^ROUNDUP\('Cut list'!\$G\$95\*\(1\+\$C\$3\)\/\$C\$4,0\)$/.test(E.rows?.[item('Carcass board') - 1].cells[4].f) && v(E, 4, item('Carcass board')) === 7);
  const grand = /** @type {number} */ (E.rows?.findIndex(r => r.kind === 'grand')) + 1;
  check('the total gross: the furniture, the appliances, the reserve (36140.84)', Math.abs(v(E, 7, grand) - 36140.84) < 0.005);

  /* --- use case: the cut list: a block a board, the parts as the order form has them --- */
  const label = (/** @type {string} */ l) => C.rows?.find(r => r.cells[0] === l)?.cells || [];
  check('a part: its label, its sizes the longer first, its finished edges along each, its quantity, where it goes', label('KO-30').slice(1, 6).join() === 'Side,720,1,550,0' && label('KO-30')[11].startsWith('K11'));
  check('the worktop: its cut-outs from its left and its back (the hob\'s, the sink\'s), one line each', label('BL-01')[10] === 'CH 560×490 @ 179x54\nCS 680×420 @ 1555x110');
  check('a block\'s sums: the fronts 8.347 m², 24 pieces', Math.abs(v(C, 6, 26) - 8.34735) < 1e-9 && v(C, 7, 26) === 24);
  const rows = $.cutList(cabinets.pieces.filter(P => P.carcass === 'K23' && P.id === 'side'));
  check('cutList: K23\'s two sides one row (2), each its drilling, the left first', rows.length === 1 && rows[0].qty === 2 && rows[0].drillings.map(d => d.drilling.hand).join() === 'left,right' && rows[0].key === $.cutKey(rows[0]));

  /* --- use case: the placeholders, filled from the model, the library and the file --- */
  check('a board\'s name and thickness; the fittings; the counts; a setting', fill('{m:carcass}') === 'Płyta wiórowa Egger U708 ST9 szary jasny 18' && fill('{nodes:hinge}') === '29' && fill('{n:carcasses}') === '16' && fill('{s:carcass.depth}') === '550');
  check('an item in its carcass: the oven\'s space in K25, its fit; a front\'s size', fill('{i:K25/oven.space}') === '591' && fill('{i:K25/oven.fit.fasciaH1}') === '1265' && fill('{i:K27/fridge.frontHeight}') !== '…');
  check('the makers\': an appliance\'s ({a:sink.cutout.width}), a fitting\'s ({h:hinge.cup.diameter}); an expression', fill('{a:sink.cutout.width}') === '680' && fill('{h:hinge.cup.diameter}') === '35' && fill('{=<k:K25.innerWidth> - 4}') === '560');
  check('the file\'s values, a note\'s number, a formula of the file', fill('{v:sheet.length}') === '2800' && fill('{note:oven}') === '1' && fill('{f:ovenOnShelfAbove}') === '4');
  check('no placeholder left unfilled in any sheet', S.every(s => (s.rows || []).every(r => r.cells.every(c => !/…|undefined|NaN/.test(typeof c === 'string' ? c : c?.text ?? '')))));

  /* --- use case: the notes, numbered, their documents; the assembly's cards --- */
  check('the notes: lettered sections, numbered notes, an appliance\'s documents after it', N.rows?.[4].cells[0] === 'A. APPLIANCES – SIZES AND FIT IN THE CARCASSES (mm; width × height × depth)' && N.rows?.[5].cells[0] === '1' && N.rows?.[5].cells[2].links.length > 0);
  const card = /** @type {number} */ (A.rows?.findIndex(r => r.level === 0 && String(r.cells[0]).startsWith('K13 ')));
  const K13 = A.rows?.slice(card, card + 25).map(r => String(r.cells[0]) + ' | ' + r.cells[1]) || [];
  check('the assembly: a card a carcass (K13: its place, kind, size), its parts with their labels and holes, its fronts, its hardware', K13[0] === 'K13 · G1[10-12] · base · 800 × 720 × 550 | '
    && K13.includes('KO-24 Hinge post R 684 × 80 (banding front 684) | holes from the bottom: hinge plate 82, 599')
    && K13.includes('KO-30 Side L 720 × 550 (banding front 720) | holes from the bottom: shelf pin 348; bumper in the front edge from the bottom: 100, 617')
    && K13.includes('FR-03 door 594 × 717, hinges: 2, right, handle top | holes from the bottom: hinge cup 100, 617') && K13.includes('hinges: 2 | '));
  check('the parts without a carcass, a group each', A.rows?.some(r => r.level === 0 && r.cells[0] === 'Group 1 – without a carcass') === true);

  check('the API: every function in a use case' + (missing().length ? ': not ' + missing().join(', ') : ''), missing().length === 0);
}
