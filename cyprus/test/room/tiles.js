// @ts-check
// test/room/tiles.js: room/tiles.js by use cases, as a room asks for it: a floor of whole tiles; a floor laid from a point
// inside it; rows shifted; along y; a small cut; an L-shaped floor; the floor running into a door; a bathroom's walls round an L,
// a wall's face less its door. Every exported function in one.

import * as API from '../../room/tiles.js';
import { doorHalves, layTiles, pointOf, rectsMinus, tiledSurfaces, under, wallsOf } from '../../room/tiles.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /** @type {Set<string>} the API's functions a use case calls */
  const used = new Set();
  /** @template {(...a: any[]) => any} F @param {string} name @param {F} f @returns {F} */
  const api = (name, f) => /** @type {F} */ ((...a) => { used.add(name); return f(...a); });
  const $ = { layTiles: api('layTiles', layTiles), doorHalves: api('doorHalves', doorHalves), wallsOf: api('wallsOf', wallsOf), rectsMinus: api('rectsMinus', rectsMinus), tiledSurfaces: api('tiledSurfaces', tiledSurfaces), pointOf: api('pointOf', pointOf), under: api('under', under) };
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
    const S = $.tiledSurfaces({ rects: [[0, 3000, 0, 2000]], height: 2600, slopes: [], openings: [[1000, 1900, -240, 0, 0, 2050], [3000, 3240, 500, 1400, 0, 2050]], built: [] }, { depth: 12 }, { depth: 12, joint: 2 });
    const w = S.find(s => s.axis === 0 && s.n[1] === 1), face = /** @type {import('../../room/tiles.js').Rect[]} */ (w?.rects);
    check('a wall along x: 12 off the wall, from the floor\'s tiles and a joint (14) to the ceiling, less its door; to the corners (it covers the ends of those along y)', w?.at === 12 && face.length === 3 && face.every(r => r[2] >= 14 && r[0] >= 0 && r[1] <= 3000) && face.some(r => r[0] === 0) && !face.some(r => r[0] < 1900 && r[1] > 1000 && r[2] < 2050));
    const y = S.find(s => s.axis === 1 && s.n[0] === 1);
    check('a wall along y: at the inner corners short, at the face of those along x (12 … 1988)', !!y && y.rects.every(r => r[0] >= 12 && r[1] <= 1988) && y.rects.some(r => r[0] === 12));
    check('the floor: face up at the tiles\' depth, the door\'s half on its side (to its middle)', S.some(s => s.layout === 'floor' && s.at === 12 && s.rects.some(r => r[0] === 3000 && r[1] === 3120)));
    check('a face less a hole: the rectangles round it', $.rectsMinus([[0, 3000, 0, 2600]], [[1000, 1900, 0, 2050]]).length === 3);
    const { count } = $.layTiles(face, tile, { dir: 'x', pattern: 'grid', offset: [0, 14] });
    check('the wall laid as a floor is (u along it, h up), from its point: counted', count.tiles > 0 && count.area === Math.round((3000 * 2586 - 900 * 2036) / 1e4) / 100);
  }

  /* --- use case: a wall under the roof's slope: the tiles cut on the slant, none above it --- */
  {
    const slope = [{ p: -1, q: 1, c: 1000 }];   // the ceiling at 1000 at u 0, rising 1 in 1 (v - u ≤ 1000)
    check('a rectangle under a slope: its outline cut on the slant; one under it whole; one over it nothing', $.under([0, 600, 0, 1300], slope)?.length === 5 && $.under([0, 600, 0, 900], slope)?.length === 4 && $.under([0, 600, 1700, 1800], slope) === null);
    const { pieces, count } = $.layTiles([[0, 1200, 0, 1500]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0], under: slope });
    check('laid under it: the pieces the slope cuts their outline, none above it; the area under it', pieces.some(p => p.poly) && pieces.every(p => (p.poly || [[p.rect[0], p.rect[3]], [p.rect[1], p.rect[3]]]).every(q => q[1] <= 1000 + q[0] + 0.5))
      && count.area === 1.68);   // 500 rising from 1000 to 1500 (0.625 m²), then 700 × 1500
  }

  /* --- use case: a casing against two walls (an outer corner): the tiles a slab 12 deep off what they lie on; where two meet
     one runs on over the other's end, the corners closed, no slab in another --- */
  {
    const S = $.tiledSurfaces({ rects: [[0, 2510, 0, 2390]], height: 2720, slopes: [], openings: [], built: [{ box: [2230, 2510, 0, 850, 0, 2720] }] }, null, { depth: 12, joint: 2 });
    const front = /** @type {import('../../room/tiles.js').Surface} */ (S.find(s => s.axis === 1 && s.at === 2218)), side = /** @type {import('../../room/tiles.js').Surface} */ (S.find(s => s.axis === 0 && s.at === 862));
    check('the casing\'s front (along y) past the outer corner (to 862), its side (along x) to it (from 2230)', front?.rects.some(r => r[1] === 862) && side?.rects.some(r => r[0] === 2230));
    /** a surface's slabs, boxes in the room's axes @param {import('../../room/tiles.js').Surface} s */
    const slabs = s => s.rects.map(r => { const A = $.pointOf(s, [r[0], r[2]]), B = $.pointOf(s, [r[1], r[3]], -12); return [0, 1, 2].flatMap(k => [Math.min(A[k], B[k]), Math.max(A[k], B[k])]); });
    const all = S.flatMap(slabs), meet = (/** @type {number[]} */ a, /** @type {number[]} */ b) => [0, 1, 2].every(k => Math.min(a[2 * k + 1], b[2 * k + 1]) - Math.max(a[2 * k], b[2 * k]) > 0.1);
    check('no slab in another', !all.some((a, i) => all.slice(i + 1).some(b => meet(a, b))));
    const inSlab = (/** @type {number[]} */ p) => all.some(b => [0, 1, 2].every(k => b[2 * k] - 1e-6 <= p[k] && p[k] <= b[2 * k + 1] + 1e-6));
    check('the corners closed: the inner (0, 0), the outer of the casing (2224, 856), the casing at the walls (2224, 6), (2504, 856)', [[6, 6, 1000], [2224, 856, 1000], [2224, 6, 1000], [2504, 856, 1000]].every(inSlab));
    check('a point of a surface: in the room\'s axes, off its face along its way', $.pointOf(front, [500, 1000]).join() === '2218,500,1000' && $.pointOf(front, [500, 1000], -12).join() === '2230,500,1000');
  }

  /* every function of the API in a use case */
  const missing = Object.keys(API).filter(k => typeof (/** @type {any} */ (API))[k] === 'function' && !used.has(k));
  check('the API: every function in a use case' + (missing.length ? ': not ' + missing.join(', ') : ''), missing.length === 0);
}
