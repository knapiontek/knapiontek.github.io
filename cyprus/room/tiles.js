// @ts-check
// room/tiles.js: a room's tiles (the floor's, the walls'), laid as the room's scene says: the tiles' grid from its point (offset) in every
// direction, along x or y, its rows shifted by the pattern; cut by the floor: the room's rectangles and, at each door, the half
// of the opening on the room's side (the tiles end at the middle of the door: an expansion joint there). What it gives: the
// pieces (whole, cut, small: a piece narrower than the tile's smallest cut) and the count (m², tiles, whole, cut, small).
// Rectangles [x0, x1, y0, y1] in mm, in the room's axes. Knows no house, draws nothing.

/** @typedef {[number, number, number, number]} Rect */
/** @typedef {{ len: number, wid: number, joint: number, minCut: number[] }} TileSize  the tile as laid: len along dir, wid across */
/** @typedef {{ a: number, s: number }} Line  a limit over a surface: its second coordinate v up to a + s · u (a sloped ceiling over a wall) */
/** @typedef {{ dir: 'x' | 'y', pattern: string, offset: number[], under?: Line[] }} Laying  under: the lines the tiles stay under */
/** @typedef {{ rect: Rect, tile: string, at: number[], whole: boolean, small: boolean, poly?: number[][] }} TilePiece  tile: the tile it is cut from (its row and column); at: that tile's corner [u, v] (its photo from there); poly: its outline [u, v], counter-clockwise, where a line cuts it (rect: its box) */
/** @typedef {{ area: number, tiles: number, whole: number, cut: number, small: number }} TileCount  area in m² */

/** @type {Record<string, number | null>} a row's shift along the length, as a part of the tile; null: at random */
export const SHIFT = { grid: 0, half: 1 / 2, third: 1 / 3, quarter: 1 / 4, random: null };
const TOL = 0.5;   // mm: a thinner strip is no piece; a tile this short of its size is still whole

/** a polygon's area @param {number[][]} P */
const areaOf = P => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
/**
 * A rectangle [u0, u1, v0, v1] under lines (v ≤ a + s · u each): its outline, counter-clockwise; null: nothing under them;
 * the rectangle's own corners when no line cuts it.
 * @param {Rect} r @param {Line[]} lines @returns {number[][] | null}
 */
export function under(r, lines) {
  let P = [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]];
  for (const { a, s } of lines) {
    const f = (/** @type {number[]} */ p) => a + s * p[0] - p[1], out = /** @type {number[][]} */ ([]);
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], fp = f(p), fq = f(q);
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
    }
    P = out;
    if (P.length < 3 || areaOf(P) < TOL) return null;
  }
  return P;
}

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
 * The tiles over a surface (its rectangles, not overlapping: a floor in x, y; a wall in u along it, h), laid from the offset
 * in every direction; dir: the tiles' length along the first axis (x; on a wall, along it) or the second (y; upright).
 * @param {Rect[]} rects @param {TileSize} tile @param {Laying} lay @returns {{ pieces: TilePiece[], count: TileCount }}
 */
export function layTiles(rects, tile, lay) {
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
        const rect = /** @type {Rect} */ (A === 0 ? p : [p[2], p[3], p[0], p[1]]), poly = lay.under?.length ? under(rect, lay.under) : null;
        if (lay.under?.length && !poly) continue;
        const cut = poly && areaOf(poly) < (rect[1] - rect[0]) * (rect[3] - rect[2]) - TOL;
        const along = p[1] - p[0], across = p[3] - p[2], area = cut ? areaOf(/** @type {number[][]} */ (poly)) : along * across;
        laid.set(id, (laid.get(id) || 0) + area);
        pieces.push({ rect, tile: id, at: A === 0 ? [ta0, tb0] : [tb0, ta0], whole: false, small: along < tile.minCut[0] - TOL || across < tile.minCut[1] - TOL, ...(cut ? { poly: /** @type {number[][]} */ (poly) } : {}) });
      }
    }
  }
  const full = tile.len * tile.wid - TOL * (tile.len + tile.wid);
  for (const p of pieces) { p.whole = (laid.get(p.tile) || 0) >= full; if (p.whole) p.small = false; }
  const whole = [...laid.values()].filter(v => v >= full).length;
  const area = rects.reduce((s, r) => s + (lay.under?.length ? areaOf(under(r, lay.under) || [[0, 0]]) : (r[1] - r[0]) * (r[3] - r[2])), 0) / 1e6;
  return { pieces, count: { area: Math.round(area * 100) / 100, tiles: laid.size, whole, cut: laid.size - whole, small: pieces.filter(p => p.small).length } };
}

/** @typedef {{ axis: 0 | 1, at: number, inward: 1 | -1, from: number, to: number }} Wall  a wall of a floor: along x (0) or y (1), at its line, the room on its inward side, from … to along it */

/**
 * The walls round a floor (its rectangles): each rectangle's sides, less what another rectangle covers beyond it.
 * @param {Rect[]} rects @returns {Wall[]}
 */
export function wallsOf(rects) {
  /** @type {Wall[]} */
  const out = [];
  for (const q of rects) for (const [axis, at, inward, from, to] of /** @type {[0 | 1, number, 1 | -1, number, number][]} */ ([[0, q[2], 1, q[0], q[1]], [0, q[3], -1, q[0], q[1]], [1, q[0], 1, q[2], q[3]], [1, q[1], -1, q[2], q[3]]])) {
    let parts = [[from, to]];
    for (const o of rects) if (o !== q) {   /* another rectangle beyond the side, touching it: no wall there */
      const lo = axis === 0 ? o[0] : o[2], hi = axis === 0 ? o[1] : o[3], line = axis === 0 ? [o[2], o[3]] : [o[0], o[1]];
      if (inward > 0 ? Math.abs(line[1] - at) > TOL : Math.abs(line[0] - at) > TOL) continue;
      parts = parts.flatMap(([a, b]) => [[a, Math.min(b, lo)], [Math.max(a, hi), b]].filter(([c, d]) => d - c > TOL));
    }
    for (const [a, b] of parts) out.push({ axis, at, inward, from: a, to: b });
  }
  return out;
}

/** rectangles less holes, as rectangles @param {Rect[]} rects @param {Rect[]} holes @returns {Rect[]} */
export function rectsMinus(rects, holes) {
  return holes.reduce((rest, h) => rest.flatMap(r => {
    if (h[0] >= r[1] - TOL || h[1] <= r[0] + TOL || h[2] >= r[3] - TOL || h[3] <= r[2] + TOL) return [r];
    const x0 = Math.max(r[0], h[0]), x1 = Math.min(r[1], h[1]);
    return /** @type {Rect[]} */ ([[r[0], x0, r[2], r[3]], [x1, r[1], r[2], r[3]], [x0, x1, r[2], Math.max(r[2], h[2])], [x0, x1, Math.min(r[3], h[3]), r[3]]])
      .filter(q => q[1] - q[0] > TOL && q[3] - q[2] > TOL);
  }), rects);
}

/**
 * A wall's face to tile, in its own axes (u along the wall, h up): from the floor's tiles to the ceiling, less the openings
 * through it (a box [x0, x1, y0, y1, h0, h1] in the room's axes, across its line), less what stands against it (a casing's box).
 * @param {Wall} w @param {number} h0 @param {number} h1 @param {number[][]} openings @param {number[][]} [against] @returns {Rect[]}
 */
export function wallFace(w, h0, h1, openings, against = []) {
  const on = (/** @type {number[]} */ b, /** @type {number} */ most) => {
    const [a0, a1] = w.axis === 0 ? [b[2], b[3]] : [b[0], b[1]];
    return a0 - 5 <= w.at && w.at <= a1 + 5 && a1 - a0 < most;   // across this wall's line, or against it
  };
  const holes = /** @type {Rect[]} */ ([...openings.filter(b => on(b, 600)), ...against.filter(b => on(b, Infinity))]   // an opening: thinner than a wall (600)
    .map(b => w.axis === 0 ? [b[0], b[1], b[4], b[5]] : [b[2], b[3], b[4], b[5]]));
  return rectsMinus([[w.from, w.to, h0, h1]], holes);
}
