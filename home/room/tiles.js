// @ts-check
/* room/tiles.js: the floor tiles of a layout: the rooms it covers, the tiles laid over them from the grid's origin, the
   count (whole, cut, small cuts), the origin with the fewest small cuts, and the faces to draw. A layout is one tile product
   laid one way over some rooms of one floor; rooms that meet with no wall between them are one zone (a tile runs across
   the line), and the floor runs on through a door: each half of its depth belongs to the room on its side. Rectangles
   [x1, x2, y1, y2] in mm, in the floor's axes. Needs core/geometry.js; draws nothing, knows no house. */
/**
 * How a layout is laid, as the viewer may change it.
 * @typedef {object} Laying
 * @property {string} product  a key of the library's tiles
 * @property {'x' | 'y'} dir  x: the tiles' length along x, y: along y
 * @property {string} pattern  a key of PATTERNS
 * @property {number|null} oa  the grid's origin along the length, mm from the floor's zero (null: to fit)
 * @property {number|null} ob  across
 * @property {string} [grout]  its colour
 */
/** @typedef {{ name?: string, len: number, wid: number, joint: number, minCut: number[], pattern: string, texture: string, price?: number|null }} TileProduct  a library tile, as laid */
/** @typedef {Rect & { door?: boolean }} TileRect  door: the half of a door's depth */
/** @typedef {{ id: string, own: TileRect[], rects: TileRect[], zone: string }} LaidRoom  own: the room's rectangles; rects: with its doors' halves */
/**
 * A piece of one tile in one rectangle, in the layout's axes: a along the tile's length, b across.
 * @typedef {{ room: string, zone: string, j: number, k: number, ta: number, tb: number, a1: number, a2: number, b1: number, b2: number, door: boolean, small?: boolean, poly?: number[][] }} TilePiece
 */
/** @typedef {{ area: number, tiles: number, full: number, cut: number, small: number, penalty: number }} TileCount  area in m² */
function tilesModule() {
'use strict';

const G = HOME.geometry, { hash01, EPS } = G;
const INF = Infinity, M2 = 1e6;            // mm² in a m²
/* the patterns: [name, the shift of each row along the length as a part of a tile; null: at random] */
const PATTERNS = { grid: ['Grid', 0], half: ['Half bond', 1 / 2], third: ['Third bond', 1 / 3], quarter: ['Quarter bond', 1 / 4], random: ['Random', null] };
const DIRS = { x: 'Along x', y: 'Along y' };
const MIN_SPAN = 10;                       // mm: two rectangles sharing less of a side do not meet
const MIN_PIECE = 0.5;                     // mm: a thinner strip of a tile is no piece
const FULL_TOL = 1;                        // mm: a tile this much short of its size is still whole

/* the doors' halves on the side of a room: a passage's box [x1, x2, y1, y2, h1, h2] at the floor's level */
/** @param {Box[]} passages @param {number} level @param {Rect[]} rects */
function thresholds(passages, level, rects) {
  /** @type {TileRect[]} */
  const out = [];
  for (const o of passages) {
    if (Math.abs(o[4] - level) > EPS) continue;
    for (const q of rects) for (const axis of [0, 1]) {
      const [a1, a2] = [o[2 * axis], o[2 * axis + 1]], mid = (a1 + a2) / 2, other = 1 - axis;
      const lo = Math.max(o[2 * other], q[2 * other]), hi = Math.min(o[2 * other + 1], q[2 * other + 1]);
      if (hi - lo < MIN_SPAN) continue;
      const half = Math.abs(q[2 * axis + 1] - a1) < EPS ? [a1, mid] : Math.abs(q[2 * axis] - a2) < EPS ? [mid, a2] : null;
      if (!half) continue;
      /** @type {TileRect} */
      const t = []; t[2 * axis] = half[0]; t[2 * axis + 1] = half[1]; t[2 * other] = lo; t[2 * other + 1] = hi;
      t.door = true; out.push(t);
    }
  }
  return out;
}
/** the rooms of a layout, each with its doors' halves and its zone
    @param {{ id: string, rects: Rect[] }[]} list @param {Box[]} passages @param {number} level @returns {LaidRoom[]} */
function rooms(list, passages, level) {
  /** @type {LaidRoom[]} */
  const out = list.map(r => ({ id: r.id, own: r.rects, rects: r.rects.concat(thresholds(passages, level, r.rects)), zone: r.id }));
  const meet = (/** @type {Rect} */ a, /** @type {Rect} */ b) => [0, 1].some(axis => {
    const o = 1 - axis, touch = Math.abs(a[2 * axis + 1] - b[2 * axis]) < EPS || Math.abs(b[2 * axis + 1] - a[2 * axis]) < EPS;
    return touch && Math.min(a[2 * o + 1], b[2 * o + 1]) - Math.max(a[2 * o], b[2 * o]) > MIN_SPAN;
  });
  for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) if (out[i].own.some(a => out[j].own.some(b => meet(a, b)))) out[j].zone = out[i].zone;
  return out;
}

/* a rectangle in the layout's axes [a1, b1, a2, b2], and a point back in the floor's [x, y] */
const toAB = (/** @type {Laying} */ L, /** @type {Rect} */ q) => L.dir === 'x' ? [q[0], q[2], q[1], q[3]] : [q[2], q[0], q[3], q[1]];
const toXY = (/** @type {Laying} */ L, /** @type {number} */ a, /** @type {number} */ b) => L.dir === 'x' ? [a, b] : [b, a];
/** @param {TileProduct} P */
const sizes = P => ({ TA: P.len, TB: P.wid, Pa: P.len + P.joint, Pb: P.wid + P.joint, minA: P.minCut[0], minB: P.minCut[1] });
const rowShift = (/** @type {Laying} */ L, /** @type {number} */ j, /** @type {number} */ Pa) => PATTERNS[L.pattern][1] === null ? hash01(j, 911) * Pa : (((j * PATTERNS[L.pattern][1]) % 1 + 1) % 1) * Pa;

/** @param {Laying} L @param {TileProduct} P @param {LaidRoom[]} laid @param {number} oa @param {number} ob @returns {TilePiece[]} */
function lay(L, P, laid, oa, ob) {
  const { TA, TB, Pa, Pb } = sizes(P), out = [];
  for (const room of laid) for (const q of room.rects) {
    const [a1, b1, a2, b2] = toAB(L, q);
    for (let j = Math.floor((b1 - ob) / Pb); ob + j * Pb < b2; j++) {
      const tb = ob + j * Pb, pb1 = Math.max(b1, tb), pb2 = Math.min(b2, tb + TB);
      if (pb2 - pb1 < MIN_PIECE) continue;
      const sh = oa + rowShift(L, j, Pa);
      for (let k = Math.floor((a1 - sh) / Pa); sh + k * Pa < a2; k++) {
        const ta = sh + k * Pa, pa1 = Math.max(a1, ta), pa2 = Math.min(a2, ta + TA);
        if (pa2 - pa1 >= MIN_PIECE) out.push({ room: room.id, zone: room.zone, j, k, ta, tb, a1: pa1, a2: pa2, b1: pb1, b2: pb2, door: !!q.door });
      }
    }
  }
  return out;
}
/* a polygon [[x, y]] cut to the side p·x + q·y <= c of a line */
const clipHalf = (/** @type {Poly} */ poly, /** @type {number} */ p, /** @type {number} */ q, /** @type {number} */ c) => G.clipHalf(poly, v => c - p * v[0] - q * v[1]);
const polyArea = (/** @type {Poly} */ poly) => Math.abs(G.area2(poly));
/* the pieces cut to the sides of lines {p, q, c}: p·x + q·y <= c in the plane's coordinates (a wall under a roof's slope);
   a piece cut becomes a polygon (poly, in the layout's a, b), its box the polygon's; one wholly past a line goes */
/** @param {Laying} L @param {TilePiece[]} pieces @param {{ p: number, q: number, c: number }[]} lines @returns {TilePiece[]} */
function clip(L, pieces, lines) {
  if (!lines.length) return pieces;
  const out = [];
  for (const piece of pieces) {
    let poly = [[piece.a1, piece.b1], [piece.a2, piece.b1], [piece.a2, piece.b2], [piece.a1, piece.b2]];
    for (const l of lines) { const [p, q] = L.dir === 'x' ? [l.p, l.q] : [l.q, l.p]; poly = clipHalf(poly, p, q, l.c); if (poly.length < 3) break; }
    const area = poly.length < 3 ? 0 : polyArea(poly), whole = (piece.a2 - piece.a1) * (piece.b2 - piece.b1);
    if (area < MIN_PIECE * MIN_PIECE) continue;
    if (area > whole - 1e-6) { out.push(piece); continue; }
    const as = poly.map(v => v[0]), bs = poly.map(v => v[1]);
    out.push(Object.assign({}, piece, { poly, a1: Math.min(...as), a2: Math.max(...as), b1: Math.min(...bs), b2: Math.max(...bs) }));
  }
  return out;
}
/* one tile is all the pieces with its row and column in one zone; the doors' halves do not make it cut. Marks the pieces of
   a small cut (shorter than the product's minCut) */
/** @param {TileProduct} P @param {TilePiece[]} pieces @returns {TileCount} */
function count(P, pieces) {
  const { TA, TB, minA, minB } = sizes(P), tiles = new Map();
  let area = 0;
  for (const p of pieces) {
    const k = p.zone + '|' + p.j + '|' + p.k;
    if (!tiles.has(k)) tiles.set(k, { a1: INF, a2: -INF, b1: INF, b2: -INF, pieces: [] });
    const t = tiles.get(k); t.pieces.push(p); area += p.poly ? polyArea(p.poly) : (p.a2 - p.a1) * (p.b2 - p.b1);
    if (!p.door) Object.assign(t, { a1: Math.min(t.a1, p.a1), a2: Math.max(t.a2, p.a2), b1: Math.min(t.b1, p.b1), b2: Math.max(t.b2, p.b2) });
  }
  let full = 0, cut = 0, small = 0, penalty = 0;
  for (const t of tiles.values()) {
    if (t.a1 === INF) { cut++; continue; }  // only doors' halves: a strip of its own size, never judged small
    const da = t.a2 - t.a1, db = t.b2 - t.b1;
    if (da > TA - FULL_TOL && db > TB - FULL_TOL) { full++; continue; }
    cut++;
    const short = [[da, minA], [db, minB]].filter(([d, m]) => d < m);
    if (!short.length) continue;
    small++; penalty += short.reduce((s, [d, m]) => s + 1 + (m - d) / m, 0);
    for (const p of t.pieces) p.small = true;
  }
  return { area: area / M2, tiles: tiles.size, full, cut, small, penalty };
}
/* the origin with the fewest and largest cuts: a coarse grid over one period, then a finer one around the best; whole mm */
/** @param {Laying} L @param {TileProduct} P @param {LaidRoom[]} laid */
function fit(L, P, laid) {
  const { Pa, Pb } = sizes(P), score = (oa, ob) => { const s = count(P, lay(L, P, laid, oa, ob)); return s.penalty * 4 + s.cut * 0.03; };
  const sa = Math.max(20, Math.round(Pa / 20)), sb = Math.max(10, Math.round(Pb / 30));
  let best = { oa: 0, ob: 0, s: INF };
  const search = (a0, a1, da, b0, b1, db) => { for (let ob = b0; ob < b1; ob += db) for (let oa = a0; oa < a1; oa += da) { const s = score(oa, ob); if (s < best.s) best = { oa, ob, s }; } };
  search(0, Pa, sa, 0, Pb, sb);
  const c = { ...best };
  search(c.oa - sa, c.oa + sa + EPS, Math.max(1, Math.round(sa / 4)), c.ob - sb, c.ob + sb + EPS, Math.max(1, Math.round(sb / 4)));
  const wrap = (v, p) => Math.round(((v % p) + p) % p);
  return { oa: wrap(best.oa, Pa), ob: wrap(best.ob, Pb) };
}

/* the faces to draw on a plane: per image of the texture ({kind: stone | wood, size: [u, v] mm, faces}), the tiles' quads,
   each with its uv in mm of that image at a point. at(p, q): the point [x, y, h] of the plane's coordinates (p, q) (a floor:
   x, y; a wall: along it, up), n: the face's normal (the quads turn toward it). Stone: one image is one whole tile, a random
   image and turn per tile; wood: each plank a random crop of the photo. small: the pieces of a small cut, apart */
/** @param {Laying} L @param {TileProduct} P @param {Texture} T @param {TilePiece[]} pieces @param {(p: number, q: number) => Vec3} at @param {Vec3} n */
function faces(L, P, T, pieces, at, n) {
  const { TA, TB } = sizes(P), stone = T.kind === 'stone', [imgA, imgB] = T.size;
  /** @type {Object<string, { face: number, small: boolean, quads: { poly: number[][], uv: (v: number[]) => number[] }[] }>} */
  const sets = {};
  for (const p of pieces) {
    const face = stone ? Math.floor(hash01(p.j, p.k, 3) * T.faces.length) : 0;
    const turns = !stone ? 0 : TA === TB ? Math.floor(hash01(p.j, p.k, 5) * 4) : 2 * Math.floor(hash01(p.j, p.k, 5) * 2);
    const set = sets[face + (p.small ? 's' : '')] ||= { face, small: !!p.small, quads: [] };
    const ca = stone ? 0 : hash01(p.j, p.k, 7) * Math.max(0, imgA - TA), cb = stone ? 0 : hash01(p.j, p.k, 9) * Math.max(0, imgB - TB);
    const uvAB = (a, b) => {               // affine in a and b: right inside the quad too
      if (!stone) return [ca + a - p.ta, imgB - (cb + b - p.tb)];
      let u = (a - p.ta) / TA, v = (b - p.tb) / TB;
      for (let i = 0; i < turns; i++) [u, v] = [1 - v, u];
      return [u * imgA, v * imgB];
    };
    const point = ([a, b]) => { const [x, y] = toXY(L, a, b); return { a, b, pt: at(x, y) }; };
    const box = [[p.a1, p.b1], [p.a2, p.b1], [p.a2, p.b2], [p.a1, p.b2]].map(point), corners = (p.poly || box.map(q => [q.a, q.b])).map(point);
    const e1 = box[1].pt.map((v, k) => v - box[0].pt[k]), e2 = box[3].pt.map((v, k) => v - box[0].pt[k]);
    const c = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (c[0] * n[0] + c[1] * n[1] + c[2] * n[2] < 0) corners.reverse();   // counter-clockwise seen from where the face looks
    /* uv at a point: back through the plane's coordinates (affine: the piece's box gives it; a cut piece is drawn as its polygon) */
    const o = box[0], du = box[1], dv = box[3];
    const ea = du.pt.map((v, k) => v - o.pt[k]), eb = dv.pt.map((v, k) => v - o.pt[k]);
    const la = ea.reduce((s, v) => s + v * v, 0), lb = eb.reduce((s, v) => s + v * v, 0);
    const uv = v => {
      const d = v.map((x, k) => x - o.pt[k]), sa = d.reduce((s, x, k) => s + x * ea[k], 0) / la, sb = d.reduce((s, x, k) => s + x * eb[k], 0) / lb;
      return uvAB(o.a + sa * (du.a - o.a) + sb * (dv.a - o.a), o.b + sa * (du.b - o.b) + sb * (dv.b - o.b));
    };
    set.quads.push({ poly: corners.map(q => q.pt), uv });
  }
  return Object.values(sets);
}
/* the pieces of core for a layout's faces and its grout: materials by key (added to the page's library: tiles:<texture>:<face>,
   its red twin for a small cut, tiles:grout:<colour>); cell: the cell's fields (layers), finish: the layer that shows a small cut red */
/** @param {Laying} L @param {TileProduct} P @param {Texture} T @param {TilePiece[]} pieces @param {Poly[]} grout @param {(p: number, q: number) => Vec3} at
    @param {Vec3} n @param {CellLook} cell @param {string} finish @returns {{ pieces: Piece[], materials: Object<string, MaterialLook> }} */
function corePieces(L, P, T, pieces, grout, at, n, cell, finish) {
  const /** @type {Piece[]} */ out = [], /** @type {Object<string, MaterialLook>} */ materials = {}, stone = T.kind === 'stone', group = cell.layers.join('+');
  const g = 'tiles:grout:' + L.grout; materials[g] = { color: L.grout, roughness: 0.95 };
  for (const q of grout) out.push({ poly: q, n, uv: (/** @type {Vec3} */ v) => [v[0] + v[2], v[1] + v[2]], cell, group, material: g });
  for (const set of faces(L, P, T, pieces, at, n)) {
    const key = `tiles:${P.texture}:${set.face}`, red = key + ':small';
    materials[key] = { image: { key: P.texture, face: set.face }, roughness: stone ? 0.6 : 0.65, reflect: 0.35, ahead: true };
    materials[red] = Object.assign({}, materials[key], { color: '#ff9a92' });
    const c = set.small ? Object.assign({}, cell, { finish, raw: key }) : cell;
    for (const qd of set.quads) out.push({ poly: qd.poly, n, uv: qd.uv, cell: c, group, material: set.small ? red : key });
  }
  return { pieces: out, materials };
}

/* the edges of a slab of tiles: rings [{poly [[u, v]], out: 1 its outline, -1 a hole}] on its face, at (u, v) -> the point on
   the face, point (u, v): the surface's own (affine), n: the face's normal; each edge a quad from the face back by depth */
/** @param {{ poly: number[][], out: number }[]} rings @param {(u: number, v: number) => Vec3} at @param {(u: number, v: number) => Vec3} point
    @param {Vec3} n @param {number} depth @param {CellLook} cell @param {string} material @returns {Piece[]} */
function slabEdges(rings, at, point, n, depth, cell, material) {
  const P0 = point(0, 0), U3 = point(1, 0).map((v, k) => v - P0[k]), V3 = point(0, 1).map((v, k) => v - P0[k]), /** @type {Piece[]} */ out = [], group = cell.layers.join('+');
  for (const { poly, out: side } of rings) for (let k = 0; k < poly.length; k++) {
    const p = poly[k], q = poly[(k + 1) % poly.length], du = q[0] - p[0], dv = q[1] - p[1], len = Math.hypot(du, dv);
    if (len < 0.5) continue;
    const nu = side * dv / len, nv = -side * du / len, m = U3.map((v, i) => nu * v + nv * V3[i]);
    const face = [at(p[0], p[1]), at(q[0], q[1])], back = face.map(x => x.map((v, i) => v - n[i] * depth));
    const quad = [face[0], face[1], back[1], back[0]], e1 = quad[1].map((v, i) => v - quad[0][i]), e2 = quad[3].map((v, i) => v - quad[0][i]);
    const c = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (c[0] * m[0] + c[1] * m[1] + c[2] * m[2] < 0) quad.reverse();   // facing out of the slab
    out.push({ poly: quad, n: m, uv: (/** @type {Vec3} */ v) => [v[0] + v[1], v[2]], cell, group, material });
  }
  return out;
}

return { PATTERNS, DIRS, rooms, lay, clip, clipHalf, count, fit, corePieces, slabEdges };
}
HOME.tiles = tilesModule();
