// @ts-check
// test/room/tiles.js: room/tiles.js by examples: a floor of whole tiles; the grid from its point in every direction, the
// joints; a row's shift (half); along y; a small cut; an L of two rectangles, a tile across both counted once; a door's half
// on the room's side.

import { doorHalves, layTiles, rectsMinus, wallFace, wallsOf } from '../../room/tiles.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const tile = { len: 600, wid: 300, joint: 2, minCut: [100, 100] };
  /* a floor of exactly 2 × 3 tiles and their joints, from its corner */
  {
    const { pieces, count } = layTiles([[0, 1202, 0, 904]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0] });
    check('whole tiles: 2 × 3, none cut', count.tiles === 6 && count.whole === 6 && count.cut === 0 && pieces.every(p => p.whole));
    check('the joints: 2 between the tiles', pieces.some(p => p.rect.join() === '602,1202,302,602'));
    check('the area in m²', count.area === 1.09);
  }
  /* from a point inside the floor, in every direction */
  {
    const { pieces, count } = layTiles([[0, 1000, 0, 300]], tile, { dir: 'x', pattern: 'grid', offset: [500, 0] });
    check('from its point both ways: a piece 500 before it, 500 after', pieces.some(p => p.rect.join() === '0,498,0,300') && pieces.some(p => p.rect.join() === '500,1000,0,300') && count.cut === 2);
  }
  /* rows shifted by half a tile */
  {
    const { pieces } = layTiles([[0, 1202, 0, 602]], tile, { dir: 'x', pattern: 'half', offset: [0, 0] });
    check('half: the second row shifted by half a tile (301)', pieces.some(p => p.rect[2] === 302 && p.rect[0] === 301));
  }
  /* along y */
  {
    const { pieces } = layTiles([[0, 300, 0, 600]], tile, { dir: 'y', pattern: 'grid', offset: [0, 0] });
    check('along y: the tile\'s length along y', pieces.length === 1 && pieces[0].rect.join() === '0,300,0,600' && pieces[0].whole);
  }
  /* a small cut: narrower than the smallest cut */
  {
    const { pieces, count } = layTiles([[0, 650, 0, 300]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0] });
    check('a small cut: 48 of a tile (under 100)', count.small === 1 && pieces.some(p => p.small && p.rect.join() === '602,650,0,300'));
  }
  /* an L of two rectangles: a tile across the line between them counted once */
  {
    const { count } = layTiles([[0, 600, 0, 150], [0, 600, 150, 300]], tile, { dir: 'x', pattern: 'grid', offset: [0, 0] });
    check('an L: one tile across two rectangles, counted once and whole', count.tiles === 1 && count.whole === 1);
  }
  /* a door's half on the room's side; the tiles end there */
  {
    const room = /** @type {import('../../room/tiles.js').Rect[]} */ ([[0, 3000, 0, 2000]]);
    const halves = doorHalves(room, [[1000, 1900, -240, 0, 0, 2050], [3000, 3120, 500, 1400, 0, 2050], [5000, 5900, -240, 0, 0, 2050]]);
    check('door halves: of a door in the wall along x (y −120 … 0), of one in the wall along y (x 3000 … 3060); none for a door of another room', halves.map(h => h.join()).join(' | ') === '1000,1900,-120,0 | 3000,3060,500,1400');
  }
  /* the walls round a floor: an L of two rectangles, none on the line between them */
  {
    const walls = wallsOf([[0, 2000, 0, 1000], [0, 800, 1000, 2000]]);
    check('wallsOf: an L, its sides (seven: the long side in two, one per rectangle), the line between its rectangles none', walls.length === 7 && !walls.some(w => w.axis === 0 && w.at === 1000 && w.from < 800)
      && walls.some(w => w.axis === 0 && w.at === 1000 && w.from === 800 && w.to === 2000 && w.inward === -1));
    check('rectsMinus: a wall less a door in it: three pieces round it', rectsMinus([[0, 3000, 0, 2600]], [[1000, 1900, 0, 2050]]).length === 3);
    const face = wallFace({ axis: 0, at: 0, inward: 1, from: 0, to: 3000 }, 12, 2600, [[1000, 1900, -240, 0, 0, 2050], [1000, 1900, 2800, 3000, 0, 2050]]);
    check('wallFace: from the floor\'s tiles to the ceiling, less the door through it (not one through another wall)', face.length === 3 && face.every(r => r[2] >= 12) && !face.some(r => r[0] < 1900 && r[1] > 1000 && r[2] < 2050));
  }
}
