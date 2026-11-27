// @ts-check
// room/tiles.js: a room's floor tiles, laid as the room's scene says: the tiles' grid from its point (offset) in every
// direction, along x or y, its rows shifted by the pattern; cut by the floor: the room's rectangles and, at each door, the half
// of the opening on the room's side (the tiles end at the middle of the door: an expansion joint there). What it gives: the
// pieces (whole, cut, small: a piece narrower than the tile's smallest cut) and the count (m², tiles, whole, cut, small).
// Rectangles [x0, x1, y0, y1] in mm, in the room's axes. Knows no house, draws nothing.

/** @typedef {[number, number, number, number]} Rect */
/** @typedef {{ len: number, wid: number, joint: number, minCut: number[] }} TileSize  the tile as laid: len along dir, wid across */
/** @typedef {{ dir: 'x' | 'y', pattern: string, offset: number[] }} Laying */
/** @typedef {{ rect: Rect, tile: string, whole: boolean, small: boolean }} TilePiece  tile: the tile it is cut from (its row and column) */
/** @typedef {{ area: number, tiles: number, whole: number, cut: number, small: number }} TileCount  area in m² */

/** @type {Record<string, number | null>} a row's shift along the length, as a part of the tile; null: at random */
export const SHIFT = { grid: 0, half: 1 / 2, third: 1 / 3, quarter: 1 / 4, random: null };
const TOL = 0.5;   // mm: a thinner strip is no piece; a tile this short of its size is still whole

/** a row's shift at random, the same every time @param {number} k */
const random = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/**
 * The floor's rectangles at the room's doors: of each opening at the floor (a box [x0, x1, y0, y1, h0, h1] in the room's
 * axes, through its wall), the half on the room's side, where it meets one of the room's rectangles.
 * @param {Rect[]} rects @param {number[][]} openings @returns {Rect[]}
 */
export function doorHalves(rects, openings) {
  /** @type {Rect[]} */
  const out = [];
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 5;
  const overlap = (/** @type {number} */ a0, /** @type {number} */ a1, /** @type {number} */ b0, /** @type {number} */ b1) => Math.min(a1, b1) - Math.max(a0, b0) > 10;
  for (const [x0, x1, y0, y1] of openings) {
    const across = y1 - y0 < x1 - x0, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;   // across: the wall runs along x
    for (const r of rects) {
      if (across && overlap(x0, x1, r[0], r[1])) {
        if (near(r[2], y1)) out.push([x0, x1, my, y1]); else if (near(r[3], y0)) out.push([x0, x1, y0, my]); else continue;
        break;
      }
      if (!across && overlap(y0, y1, r[2], r[3])) {
        if (near(r[0], x1)) out.push([mx, x1, y0, y1]); else if (near(r[1], x0)) out.push([x0, mx, y0, y1]); else continue;
        break;
      }
    }
  }
  return out;
}

/**
 * The tiles over a floor (its rectangles, not overlapping), laid from the offset in every direction.
 * @param {Rect[]} rects @param {TileSize} tile @param {Laying} lay @returns {{ pieces: TilePiece[], count: TileCount }}
 */
export function layFloor(rects, tile, lay) {
  const A = lay.dir === 'x' ? 0 : 1, B = 1 - A, pitchA = tile.len + tile.joint, pitchB = tile.wid + tile.joint, shift = SHIFT[lay.pattern];
  /** a rectangle in the tiles' axes [a0, a1, b0, b1] @param {number[]} r */
  const ab = r => A === 0 ? [r[0], r[1], r[2], r[3]] : [r[2], r[3], r[0], r[1]];
  const R = rects.map(ab), oa = lay.offset[A], ob = lay.offset[B];
  const a0 = Math.min(...R.map(r => r[0])), a1 = Math.max(...R.map(r => r[1])), b0 = Math.min(...R.map(r => r[2])), b1 = Math.max(...R.map(r => r[3]));
  /** @type {TilePiece[]} */
  const pieces = [];
  /** @type {Map<string, number>} a tile's area laid */
  const laid = new Map();
  for (let k = Math.floor((b0 - ob) / pitchB) - 1; k <= Math.ceil((b1 - ob) / pitchB); k++) {
    const tb0 = ob + k * pitchB, tb1 = tb0 + tile.wid, s = (shift === null ? random(k) : (((shift * k) % 1) + 1) % 1) * pitchA;
    for (let i = Math.floor((a0 - oa - s) / pitchA) - 1; i <= Math.ceil((a1 - oa - s) / pitchA); i++) {
      const ta0 = oa + s + i * pitchA, ta1 = ta0 + tile.len, id = `${k}:${i}`;
      for (const r of R) {
        const p = [Math.max(ta0, r[0]), Math.min(ta1, r[1]), Math.max(tb0, r[2]), Math.min(tb1, r[3])];
        if (p[1] - p[0] < TOL || p[3] - p[2] < TOL) continue;
        const along = p[1] - p[0], across = p[3] - p[2];
        laid.set(id, (laid.get(id) || 0) + along * across);
        pieces.push({ rect: /** @type {Rect} */ (A === 0 ? p : [p[2], p[3], p[0], p[1]]), tile: id, whole: false, small: along < tile.minCut[0] - TOL || across < tile.minCut[1] - TOL });
      }
    }
  }
  const full = tile.len * tile.wid - TOL * (tile.len + tile.wid);
  for (const p of pieces) { p.whole = (laid.get(p.tile) || 0) >= full; if (p.whole) p.small = false; }
  const whole = [...laid.values()].filter(v => v >= full).length;
  const area = rects.reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]), 0) / 1e6;
  return { pieces, count: { area: Math.round(area * 100) / 100, tiles: laid.size, whole, cut: laid.size - whole, small: pieces.filter(p => p.small).length } };
}

/**
 * The tile as laid: its size (the scene's, one of its formats, its length the longer side; none: the product's), its joint,
 * its smallest cut.
 * @param {any} product @param {number[]} [size] @returns {TileSize}
 */
export function tileSize(product, size) {
  const [len, wid] = size ? [Math.max(...size), Math.min(...size)] : [product.len, product.wid];
  return { len, wid, joint: product.joint, minCut: product.minCut };
}
