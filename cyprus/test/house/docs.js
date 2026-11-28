// @ts-check
// test/house/docs.js: house/docs.js by use cases, as the Documents of the house use it: the rooms and their areas against
// archon's, the tiles laid with their prices and sums, the inner doors as bought, the notes. Every function in one.

import * as docs from '../../house/docs.js';
import { evaluator } from '../../core/sheet.js';
import { openCatalog } from '../../library/catalog.js';
import { assembleHouse } from '../../house/assembly.js';
import { uses } from '../uses.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(docs);
  const catalog = await openCatalog(), { hierarchy: H } = await assembleHouse(catalog);
  const house = /** @type {any} */ (H.node('house'));
  const sheets = $.houseSheets(house, catalog, /** @type {any} */ (H)), value = evaluator({ sheets });
  check('the house\'s sheets: Rooms, Tiles, Doors, Notes', sheets.map(s => s.name).join() === 'Rooms,Tiles,Doors,Notes');

  /* --- use case: the rooms, a floor a block, the model's area against archon's, summed --- */
  const R = /** @type {any} */ ($.roomsSheet(house));
  const kitchen = R.rows.find((/** @type {any} */ r) => r.cells[0] === '356. Room');
  check('a room: its number and name, the model\'s area (its floor\'s rectangles), archon\'s', kitchen && kitchen.cells[1] > 45 && kitchen.cells[1] < 55 && kitchen.cells[2] === 50.55);
  check('a floor: its rooms under it, their sum', R.rows.filter((/** @type {any} */ r) => r.kind === 'cat').map((/** @type {any} */ r) => r.cells[0]).join() === 'Ground floor,Attic'
    && value(sheets[0], 2, R.rows.findIndex((/** @type {any} */ r) => r.kind === 'sum') + 1) > 90);

  /* --- use case: the tiles as laid: each room's floor and walls, the area, its price, the value --- */
  const T = /** @type {any} */ ($.tilesSheet(house, catalog));
  const rows = T.rows.filter((/** @type {any} */ r) => !r.kind && r.cells.length > 4);
  check('the tiles laid: every room with a scene, its floor and its walls (' + rows.length + ': the kitchen\'s floor, the bathrooms\' floors and walls, the oak in four rooms)', rows.length === 9 && rows.some((/** @type {any} */ r) => r.cells[1] === '356. Room' && r.cells[2] === 'floor'));
  check('each: its product with its shop\'s link, how many tiles (whole, cut, small cuts), the area, its price a m² to change, its value', rows.every((/** @type {any} */ r) => r.cells[0].links?.length && /tiles: \d+ whole, \d+ cut, \d+ small cuts/.test(r.cells[3]) && r.cells[4] > 0 && (r.cells[5].input || r.cells[5] === '') && r.cells[6].f) && rows.some((/** @type {any} */ r) => r.cells[5].v === 119.92));
  const total = T.rows.findIndex((/** @type {any} */ r) => r.kind === 'sum') + 1, ev = evaluator({ sheets: [T] });
  check('the total: the area and the value summed', ev(T, 4, total) > 30 && Math.abs(ev(T, 6, total) - rows.reduce((/** @type {number} */ s, /** @type {any} */ r) => s + r.cells[4] * (r.cells[5].v || 0), 0)) < 1e-6);

  /* --- use case: the inner doors as bought; to choose where none is --- */
  const D = /** @type {any} */ ($.doorsSheet(house, catalog, /** @type {any} */ (H)));
  check('a door bought: its product and its extras (the handle), its floor, its price to change', D.rows.some((/** @type {any} */ r) => String(r.cells[2]).startsWith('Porta HIDE WC 80') && r.cells[3].v === 1745 && r.cells[1] === 'Ground floor')
    && D.rows.some((/** @type {any} */ r) => String(r.cells[2]).startsWith('Klamka z rozetą WC')));
  check('a door with none yet: to choose', D.rows.some((/** @type {any} */ r) => r.cells[2] === 'to choose'));

  /* --- use case: the notes under their source --- */
  const N = /** @type {any} */ ($.notesSheet(house));
  check('the notes: the source as the title, a note a row', N.rows[0].cells[0].startsWith('Geometry from the archon.pl plans') && N.rows.length === 2 + house.notes.length);

  check('the API: every function in a use case' + (missing().length ? ': not ' + missing().join(', ') : ''), missing().length === 0);
}
