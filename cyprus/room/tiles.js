// @ts-check
// room/tiles.js: a room's tiles (the floor's, the walls'), laid as the room's scene says: the tiles' grid from its point (offset) in every
// direction, along x or y, its rows shifted by the pattern; cut by the floor: the room's rectangles and, at each door, the half
// of the opening on the room's side (the tiles end at the middle of the door: an expansion joint there). What it gives: the
// pieces (whole, cut, small: a piece narrower than the tile's smallest cut) and the count (m², tiles, whole, cut, small); a
// room's surfaces to tile (its floor, its walls, the faces of what is built before the tiles), each the plane of the tiles' face.
// Rectangles [x0, x1, y0, y1] in mm, in the room's axes. Knows no house, draws nothing.

/** @typedef {[number, number, number, number]} Rect */
/** @typedef {{ len: number, wid: number, joint: number, minCut: number[] }} TileSize  the tile as laid: len along dir, wid across */
/** @typedef {{ p: number, q: number, c: number }} Line  a limit over a surface: p · u + q · v ≤ c (a sloped ceiling over a wall, over a casing's top) */
/** @typedef {{ dir: 'x' | 'y', pattern: string, offset: number[], under?: Line[] }} Laying  under: the lines the tiles stay under */
/** @typedef {{ rect: Rect, tile: string, at: number[], whole: boolean, small: boolean, poly?: number[][] }} TilePiece  tile: the tile it is cut from (its row and column); at: that tile's corner [u, v] (its photo from there); poly: its outline [u, v], counter-clockwise, where a line cuts it (rect: its box) */
/** @typedef {{ area: number, tiles: number, whole: number, cut: number, small: number }} TileCount  area in m² */

/** @type {Record<string, number | null>} a row's shift along the length, as a part of the tile; null: at random */
export const SHIFT = { grid: 0, half: 1 / 2, third: 1 / 3, quarter: 1 / 4, random: null };
const TOL = 0.5;   // mm: a thinner strip is no piece; a tile this short of its size is still whole

/** a polygon's area @param {number[][]} P */
const areaOf = P => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
/**
 * A rectangle [u0, u1, v0, v1] on the side of lines (p · u + q · v ≤ c each): its outline, counter-clockwise; null: nothing
 * there; the rectangle's own corners when no line cuts it.
 * @param {Rect} r @param {Line[]} lines @returns {number[][] | null}
 */
export function under(r, lines) {
  let P = [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]];
  for (const { p: a, q: b, c } of lines) {
    const f = (/** @type {number[]} */ v) => c - a * v[0] - b * v[1], out = /** @type {number[][]} */ ([]);
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], fp = f(p), fq = f(q);
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const s = fp / (fp - fq); out.push([p[0] + s * (q[0] - p[0]), p[1] + s * (q[1] - p[1])]); }
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
 * A surface to tile: its layout (floor: the floor's tiles; walls: the walls'), its plane (the tiles' face: along x (axis 0, at
 * y), along y (1, at x), level (2, at h); n its side: the way the face looks) and on it, in its own coordinates (a wall: u
 * along it, v = h; level: u = x, v = y), what is tiled (rectangles, holes taken out) and the lines it stays on the side of (a
 * roof's slopes, its ceiling); holes: its openings, their reveals' edges to draw (the slab's edge round them).
 * @typedef {{ id: string, layout: 'floor' | 'walls', axis: 0 | 1 | 2, at: number, n: number[], rects: Rect[], lines: Line[], holes: Rect[], edges?: number[][][] }} Surface
 * edges: the slab's free edges, each a segment [[u, v], [u, v]] and the way out of the slab [du, dv] (a floor's at a door's middle)
 */
/**
 * A built-in, before the tiles: its box [x0, x1, y0, y1, h0, h1] in the room's axes, its cuts (a niche: a box in it).
 * @typedef {{ box: number[], cuts?: number[][] }} BuiltIn
 */
/**
 * A room's surfaces to tile. The tiles are a slab: its face that deep off what it lies on. A wall's tiles from its floor's
 * (a joint over their face) up to the ceiling or the roof, less its openings; at an inner corner a face ends that deep short
 * (the other's face is there), at an outer corner that deep past (the corner closed). What is built before the tiles (a casing)
 * stands on the floor, against the walls: none under it, none behind it; the wall's tiles stop at the face of its tiles. Its
 * faces toward the room tiled (a free end past, one at a wall short), its top (past its free edges), a cut's reveals (an end at
 * the mouth past, one inside short; on the floor's tiles of the cut, under its top's), the cut's floor and top (to the face's
 * tiles at the mouth); the face's hole at the mouth that deep narrower (it covers the reveals' edges).
 * @param {{ rects: Rect[], height: number, slopes: { a: number, s: number }[], openings: number[][], built: BuiltIn[] }} room
 *   rects: its floor; slopes: the roof's underside h = a + s · y; openings: boxes through its walls (a door's at the floor)
 * @param {{ depth: number } | null} floor  the floor's tiles (null: none) @param {{ depth: number, joint: number } | null} walls  the walls' (null: none)
 * @returns {Surface[]}
 */
export function tiledSurfaces(room, floor, walls) {
  const { rects, height: C, built } = room, out = /** @type {Surface[]} */ ([]), near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < TOL;
  const W = wallsOf(rects), F = floor ? floor.depth : 0, D = walls ? walls.depth : 0, v0 = floor && walls ? F + walls.joint : 0;
  /* the lines a face stays under: the ceiling, the roof's slopes over y (a wall along y: slanted; along x: level at its line) */
  const roof = (/** @type {0 | 1} */ axis, /** @type {number} */ at) => [{ p: 0, q: 1, c: C }, ...room.slopes.map(l => axis === 1 ? { p: -l.s, q: 1, c: l.a } : { p: 0, q: 1, c: l.a + l.s * at })];
  /** a vertical face: its line (axis, at the raw face), the way it looks, from … to along it, h0 … h1, its holes, id */
  const face = (/** @type {0 | 1} */ axis, /** @type {number} */ at, /** @type {number} */ n, /** @type {number} */ from, /** @type {number} */ to, /** @type {number} */ h0, /** @type {number} */ h1, /** @type {Rect[]} */ holes, /** @type {Rect[]} */ openings, /** @type {string} */ id) => {
    const plane = at + n * D, r = /** @type {Rect} */ ([from, to, h0, h1]);
    if (to - from < TOL || h1 - h0 < TOL) return;
    const rs = rectsMinus([r], [...holes, ...openings]);
    if (rs.length) out.push({ id, layout: 'walls', axis, at: plane, n: axis === 0 ? [0, n, 0] : [n, 0, 0], rects: rs, lines: roof(axis, plane), holes: openings.map(o => /** @type {Rect} */ ([Math.max(o[0], from), Math.min(o[1], to), Math.max(o[2], h0), Math.min(o[3], h1)])).filter(o => o[1] - o[0] > TOL && o[3] - o[2] > TOL) });
  };
  /** a level face: at h, looking up (1) or down (-1), its rectangles in x, y */
  const level = (/** @type {number} */ h, /** @type {number} */ n, /** @type {Rect[]} */ rs, /** @type {string} */ id, /** @type {'floor' | 'walls'} */ layout, /** @type {Surface['edges']} */ edges = undefined) => {
    const plane = h + n * (layout === 'floor' ? F : D);
    const lines = n > 0 ? [{ p: 0, q: 0, c: C - plane }, ...room.slopes.map(l => ({ p: 0, q: -l.s, c: l.a - plane }))] : [];   // its face under the roof
    if (rs.length) out.push({ id, layout, axis: 2, at: plane, n: [0, 0, n], rects: rs, lines, holes: [], ...(edges ? { edges } : {}) });
  };
  const side = (/** @type {number[]} */ q) => /** @type {[0 | 1, number, number, number, number][]} */ ([[0, q[2], -1, q[0], q[1]], [0, q[3], 1, q[0], q[1]], [1, q[0], -1, q[2], q[3]], [1, q[1], 1, q[2], q[3]]]);   // a box's sides: line, at, the way out, along
  const across = (/** @type {0 | 1} */ axis, /** @type {number[]} */ q) => /** @type {Rect} */ (axis === 0 ? [q[0], q[1], q[4], q[5]] : [q[2], q[3], q[4], q[5]]);
  const onLine = (/** @type {0 | 1} */ axis, /** @type {number} */ at, /** @type {number[]} */ q) => axis === 0 ? q[2] - 5 <= at && at <= q[3] + 5 : q[0] - 5 <= at && at <= q[1] + 5;
  const top = (/** @type {number[]} */ b) => b[5] < C - TOL ? b[5] + D : C;   // a built box's top tiled: the face above it stops at its tiles
  if (walls) {
    /* the walls: ends short at an inner corner, past at an outer one; less the openings through them and what is built against them */
    const meets = (/** @type {Wall} */ w, /** @type {number} */ end) => W.find(o => o.axis !== w.axis && near(o.at, end) && w.at >= o.from - TOL && w.at <= o.to + TOL);
    const shift = (/** @type {Wall | undefined} */ o, /** @type {number} */ sign) => !o ? 0 : o.inward === sign ? -D : D;
    W.forEach((w, i) => {
      const against = built.map(b => b.box).filter(q => w.axis === 0 ? near(w.inward > 0 ? q[2] : q[3], w.at) : near(w.inward > 0 ? q[0] : q[1], w.at))
        .map(q => { const a = across(w.axis, q); return /** @type {Rect} */ ([a[0] - D, a[1] + D, a[2], top(q)]); });
      const openings = room.openings.filter(o => onLine(w.axis, w.at, o) && (w.axis === 0 ? o[3] - o[2] : o[1] - o[0]) < 600).map(o => across(w.axis, o));   // through it: thinner than a wall
      face(w.axis, w.at, w.inward, w.from - shift(meets(w, w.from), 1), w.to + shift(meets(w, w.to), -1), v0, C, against, openings, 'w' + (i + 1));
    });
    built.forEach((b, i) => {
      const q = b.box, cuts = b.cuts || [], atWall = (/** @type {0 | 1} */ axis, /** @type {number} */ e) => W.some(w => w.axis !== axis && near(w.at, e));
      /* its sides toward the room (none against a wall): a free end past, one at a wall short; from the floor's tiles to its top */
      side(q).forEach(([axis, at, n, from, to], s) => {
        if (W.some(w => w.axis === axis && near(w.at, at) && w.inward === -n)) return;
        const touches = (/** @type {number[]} */ o) => axis === 0 ? near(n > 0 ? o[2] : o[3], at) : near(n > 0 ? o[0] : o[1], at);
        const opens = (/** @type {number[]} */ c) => axis === 0 ? near(n > 0 ? c[3] : c[2], at) : near(n > 0 ? c[1] : c[0], at);
        const holes = built.filter(o => o !== b).map(o => o.box).filter(touches).map(o => across(axis, o))
          .concat(cuts.filter(opens).map(c => across(axis, c)).map(c => /** @type {Rect} */ ([c[0] + D, c[1] - D, c[2], c[3]])));
        face(axis, at, n, from + (atWall(axis, from) ? D : -D), to + (atWall(axis, to) ? -D : D), q[4] < TOL ? v0 : q[4], Math.min(q[5], C), holes, [], `b${i + 1}s${s}`);
      });
      /* a cut's reveals, facing into it: an end at the mouth past, one inside short; on its floor's tiles, under its top's */
      cuts.forEach((c, k) => side(c).forEach(([axis, at, n, from, to], s) => {
        const inside = axis === 0 ? at > q[2] + TOL && at < q[3] - TOL : at > q[0] + TOL && at < q[1] - TOL;
        if (!inside) return;
        const open = (/** @type {number} */ e) => axis === 0 ? near(e, q[0]) || near(e, q[1]) : near(e, q[2]) || near(e, q[3]);
        face(axis, at, -n, from + (open(from) ? -D : D), to + (open(to) ? D : -D), c[4] > q[4] + TOL ? c[4] + D : c[4], c[5] < q[5] - TOL ? c[5] - D : c[5], [], [], `b${i + 1}c${k + 1}s${s}`);
      }));
      /* its top (under the ceiling, nothing built on it): past its free edges; a cut's floor and top: past at the mouth */
      const grow = (/** @type {number[]} */ r, /** @type {(axis: 0 | 1, e: number) => boolean} */ free) => /** @type {Rect} */ ([r[0] - (free(1, r[0]) ? D : 0), r[1] + (free(1, r[1]) ? D : 0), r[2] - (free(0, r[2]) ? D : 0), r[3] + (free(0, r[3]) ? D : 0)]);
      if (q[5] < C - TOL) level(q[5], 1, rectsMinus([grow(q, (axis, e) => !atWall(axis === 0 ? 1 : 0, e))], built.filter(o => o !== b && near(o.box[4], q[5])).map(o => /** @type {Rect} */ (o.box.slice(0, 4)))), `b${i + 1}t`, 'walls');
      cuts.forEach((c, k) => {
        const mouth = (/** @type {0 | 1} */ axis, /** @type {number} */ e) => axis === 0 ? near(e, q[2]) || near(e, q[3]) : near(e, q[0]) || near(e, q[1]);
        if (c[4] > q[4] + TOL) level(c[4], 1, [grow(c, mouth)], `b${i + 1}c${k + 1}f`, 'walls');
        if (c[5] < q[5] - TOL) level(c[5], -1, [grow(c, mouth)], `b${i + 1}c${k + 1}t`, 'walls');
      });
    });
  }
  if (floor) {
    /* the floor: its rectangles and its doors' halves, less what is built on it; its slab's edge free at the doors' middles */
    const area = rectsMinus([...rects, ...doorHalves(rects, room.openings.filter(o => Math.abs(o[4]) < 50))], built.map(b => b.box).filter(q => q[4] < TOL).map(q => /** @type {Rect} */ (q.slice(0, 4))));
    const onWall = (/** @type {Wall} */ s) => W.some(w => w.axis === s.axis && near(w.at, s.at) && w.from < s.to - TOL && s.from < w.to - TOL)
      || built.some(b => { const q = b.box; return q[4] < TOL && (s.axis === 0 ? (near(q[2], s.at) || near(q[3], s.at)) && q[0] < s.to - TOL && s.from < q[1] - TOL : (near(q[0], s.at) || near(q[1], s.at)) && q[2] < s.to - TOL && s.from < q[3] - TOL); });
    const edges = wallsOf(area).filter(s => !onWall(s)).map(s => s.axis === 0 ? [[s.from, s.at], [s.to, s.at], [0, -s.inward]] : [[s.at, s.from], [s.at, s.to], [-s.inward, 0]]);
    level(0, 1, area, 'f', 'floor', edges);
  }
  return out;
}
