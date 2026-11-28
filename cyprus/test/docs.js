// @ts-check
// test/docs.js: docs.js by use cases, as index.js uses it: the book of what is shown (a room, the house): its sheets Elements
// (the hierarchy under it, closed to its first level) and Test (the checks, what to correct under each). The screen and the
// XLSX need a page: not here.

import * as docs from '../docs.js';
import { openCatalog } from '../library/catalog.js';
import { assembleHouse } from '../house/assembly.js';
import { uses } from './uses.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(docs);
  const { hierarchy: H } = await assembleHouse(await openCatalog());
  const room = /** @type {any} */ (H.node('house/groundFloor/room_356'));

  /* --- use case: a room's Documents: Elements, Test --- */
  const checks = [...H.checks(), { name: 'Cabinets: what is wrong in their files', items: ['room_356: a fault'] }];
  const book = $.bookOf(H, room, '356. Room', checks);
  check('the book: Elements, then Test', book.sheets.map((/** @type {any} */ s) => s.name).join() === 'Elements,Test');
  const E = /** @type {any} */ (book.sheets[0]);
  check('Elements: the room first (a category), its nodes under it by their depth, each its path, offset and size (mm)', E.rows[2].kind === 'cat' && E.rows[2].cells[1] === 'house/groundFloor/room_356'
    && E.rows.some((/** @type {any} */ r) => r.level === 2 && r.cells[1] === 'house/groundFloor/room_356/g1/worktop') && E.rows[2].cells.length === 8 && E.tree === 'closed');
  check('Elements: as many rows as nodes under the room (and the title, the head, the note)', E.rows.length === 3 + (function count(/** @type {any} */ n) { return 1 + (n.children || []).reduce((/** @type {number} */ s, /** @type {any} */ c) => s + count(c), 0); })(room));
  const T = /** @type {any} */ (book.sheets[1]);
  check('Test: each check, its result (OK, or how many to correct, listed under it)', T.rows.some((/** @type {any} */ r) => r.cells[0] === 'Cabinets: what is wrong in their files' && r.cells[2] === '1')
    && T.rows.some((/** @type {any} */ r) => r.level === 1 && r.cells[0] === 'room_356: a fault') && T.rows.some((/** @type {any} */ r) => r.cells[2] === 'OK'));
  check('Test: to know, not a fault (i)', T.rows.some((/** @type {any} */ r) => r.cells[2] === 'i'));
  check('a sheet of its own, by itself: Elements of the house, Test of nothing to correct', $.elementsSheet(H, /** @type {any} */ (H.node('house')), 'The house').rows?.[2].cells[0] !== undefined
    && $.testSheet('Test', [{ name: 'a', items: [] }]).rows?.[2].cells[2] === 'OK');

  /* the screen and the XLSX: a page's (a canvas, a download) */
  check('the API: every function in a use case' + (missing().filter(k => k !== 'saveXlsx').length ? ': not ' + missing().join(', ') : ''), missing().filter(k => k !== 'saveXlsx').length === 0);
}
