// @ts-check
// test/room/tiles.js: room/tiles.js by use cases, as a room asks for it: a floor of whole tiles; a floor laid from a point
// inside it; rows shifted; along y; a small cut; an L-shaped floor; the floor running into a door; a bathroom's walls round an L,
// a wall's face less its door. Every exported function in one.

import * as API from '../../room/tiles.js';
import { doorHalves, layTiles, rectsMinus, under, wallFace, wallsOf } from '../../room/tiles.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /** @type {Set<string>} the API's functions a use case calls */
  const used = new Set();
  /** @template {(...a: any[]) => any} F @param {string} name @param {F} f @returns {F} */
  const api = (name, f) => /** @type {F} */ ((...a) => { used.add(name); return f(...a); });
  const $ = { layTiles: api('layTiles', layTiles), doorHalves: api('doorHalves', doorHalves), wallsOf: api('wallsOf', wallsOf), rectsMinus: api('rectsMinus', rectsMinus), wallFace: api('wallFace', wallFace), under: api('under', under) };
  /* a tile as the library gives it (library/shapes.js tileOf): 600 long, 300 wide, joint 2, the smallest cut 100 × 100 */
  const tile = { len: 600, wid: 300, joint: 2, minCut: [100, 100] };

  /* --- use case: a floor 1202 × 904, laid from its corner: whole tiles only --- */
  {
    const { pieces, count } = $.layTiles([[0, 1202, 0, 904]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0] });
    check('a floor of whole tiles: 2 × 3, none cut; 1.09 m²', count.tiles === 6 && count.whole === 6 && count.cut === 0 && count.area === 1.09 && pieces.every(p => p.whole));
    check('the joints: 2 between the tiles', pieces.some(p => p.rect.join() === '602,1202,302,602'));
  }

  /* --- use case: the designer moves the grid's point into the floor: tiles both ways from it --- */
  {
    const { pieces, count } = $.layTiles([[0, 1000, 0, 300]], tile, { dir: 'x', pattern: 'grid', offset: [500, 0] });
    check('from its point both ways: a piece 500 before it (less the joint), 500 after; both cut', pieces.some(p => p.rect.join() === '0,498,0,300') && pieces.some(p => p.rect.join() === '500,1000,0,300') && count.cut === 2);
  }

  /* --- use case: planks in a half bond; then upright (along y) --- */
  {
    const { pieces } = $.layTiles([[0, 1202, 0, 602]], tile, { dir: 'x', pattern: 'half', offset: [0, 0] });
    check('half bond: the second row shifted by half a tile (301)', pieces.some(p => p.rect[2] === 302 && p.rect[0] === 301));
    const along = $.layTiles([[0, 300, 0, 600]], tile, { dir: 'y', pattern: 'grid', offset: [0, 0] }).pieces;
    check('along y: the tile\'s length along y', along.length === 1 && along[0].rect.join() === '0,300,0,600' && along[0].whole);
  }

  /* --- use case: a floor 650 long: the last piece too narrow to cut well --- */
  {
    const { pieces, count } = $.layTiles([[0, 650, 0, 300]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0] });
    check('a small cut: 48 of a tile (under its 100), marked and counted', count.small === 1 && pieces.some(p => p.small && p.rect.join() === '602,650,0,300'));
  }

  /* --- use case: an L-shaped floor of two rectangles: a tile across the line between them --- */
  {
    const { count } = $.layTiles([[0, 600, 0, 150], [0, 600, 150, 300]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0] });
    check('an L: one tile across two rectangles, counted once and whole', count.tiles === 1 && count.whole === 1);
  }

  /* --- use case: the floor runs into the doors: the tiles end at the middle of each (the expansion joint there) --- */
  {
    const room = /** @type {import('../../room/tiles.js').Rect[]} */ ([[0, 3000, 0, 2000]]);
    const halves = $.doorHalves(room, [[1000, 1900, -240, 0, 0, 2050], [3000, 3120, 500, 1400, 0, 2050], [5000, 5900, -240, 0, 0, 2050]]);
    check('a door in the wall along x: its half on the room\'s side (y −120 … 0); one in the wall along y (x 3000 … 3060); none for another room\'s', halves.map(h => h.join()).join(' | ') === '1000,1900,-120,0 | 3000,3060,500,1400');
  }

  /* --- use case: a bathroom's walls: round its floor (an L), each wall's face from the floor's tiles to the ceiling less its door --- */
  {
    const walls = $.wallsOf([[0, 2000, 0, 1000], [0, 800, 1000, 2000]]);
    check('the walls round an L: its sides (seven: the long side in two, one per rectangle), none on the line between its rectangles', walls.length === 7 && !walls.some(w => w.axis === 0 && w.at === 1000 && w.from < 800)
      && walls.some(w => w.axis === 0 && w.at === 1000 && w.from === 800 && w.to === 2000 && w.inward === -1));
    const face = $.wallFace({ axis: 0, at: 0, inward: 1, from: 0, to: 3000 }, 12, 2600, [[1000, 1900, -240, 0, 0, 2050], [1000, 1900, 2800, 3000, 0, 2050]]);
    check('a wall\'s face: from the floor\'s tiles (12) to the ceiling, less the door through it (not one through another wall)', face.length === 3 && face.every(r => r[2] >= 12) && !face.some(r => r[0] < 1900 && r[1] > 1000 && r[2] < 2050));
    const cased = $.wallFace({ axis: 0, at: 0, inward: 1, from: 0, to: 3000 }, 12, 2600, [], [[2230, 2510, 0, 850, 0, 2600]]);
    check('a casing against the wall (deeper than a wall is thick): no tiles behind it', cased.length === 2 && !cased.some(r => r[0] < 2510 && r[1] > 2230));
    check('a face less a hole: the rectangles round it', $.rectsMinus([[0, 3000, 0, 2600]], [[1000, 1900, 0, 2050]]).length === 3);
    const { count } = $.layTiles(face, tile, { dir: 'x', pattern: 'grid', offset: [0, 12] });
    check('the wall laid as a floor is (u along it, h up), from its point: counted', count.tiles > 0 && count.area === Math.round((3000 * 2588 - 900 * 2038) / 1e4) / 100);
  }

  /* --- use case: a wall under the roof's slope: the tiles cut on the slant, none above it --- */
  {
    const slope = [{ a: 1000, s: 1 }];   // the ceiling at 1000 at u 0, rising 1 in 1
    check('a rectangle under a slope: its outline cut on the slant; one under it whole; one over it nothing', $.under([0, 600, 0, 1300], slope)?.length === 5 && $.under([0, 600, 0, 900], slope)?.length === 4 && $.under([0, 600, 1700, 1800], slope) === null);
    const { pieces, count } = $.layTiles([[0, 1200, 0, 1500]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0], under: slope });
    check('laid under it: the pieces the slope cuts their outline, none above it; the area under it', pieces.some(p => p.poly) && pieces.every(p => (p.poly || [[p.rect[0], p.rect[3]], [p.rect[1], p.rect[3]]]).every(q => q[1] <= 1000 + q[0] + 0.5))
      && count.area === 1.68);   // 500 rising from 1000 to 1500 (0.625 m²), then 700 × 1500
  }

  /* every function of the API in a use case */
  const missing = Object.keys(API).filter(k => typeof (/** @type {any} */ (API))[k] === 'function' && !used.has(k));
  check('the API: every function in a use case' + (missing.length ? ': not ' + missing.join(', ') : ''), missing.length === 0);
}
