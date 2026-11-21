// @ts-check
/* core/faces.js: the surfaces of solids, ready to draw: welded points, the faces of cells, the visible pieces.
   Knows no project and no browser.
   A cell is {S, material, layers, edges, ...}; faceMaterial(n, points), if a cell has it, gives the material of a face by
   its normal (and its corners, mm). Gets core/geometry.js. */
/** @typedef {number[]} Vec3  [x, y, h] */
/** @typedef {Vec3 & { id?: number }} Point3  a welded point: one object per place */
/**
 * @typedef {object} CellLook  how a solid is drawn
 * @property {string} [material]  none: faceMaterial gives it
 * @property {string[]} layers
 * @property {boolean} [edges]  its edges drawn
 * @property {string} [raw]  the bare material, where it lies against another solid
 * @property {(n: Vec3, corners: Vec3[]) => string} [faceMaterial]  the material of a face by its normal
 * @property {string} [finish]  the layer of its finish: off, its faces show raw
 * @property {string} [batch]  kept in a mesh of its own (a page recolours it alone)
 * @property {any} [part]  what it belongs to (two parts meeting in a plane keep their joint's line)
 */
/** @typedef {CellLook & { S: Prism }} Cell  a solid as drawn: a prism and its look */
/**
 * @typedef {object} Piece  a visible piece of a face
 * @property {Point3[]} poly
 * @property {Vec3} n  its normal
 * @property {(v: Vec3) => number[]} uv  texture coordinates of a point
 * @property {CellLook} cell
 * @property {string} group  its cell's layers joined
 * @property {string} material
 * @property {string[] | null} [cover]  the layers of the solid it lies against (seen only while that is hidden)
 * @property {number} [d]  its plane's distance from the zero
 */
/** @param {ReturnType<typeof coreGeometryModule>} geometry */
function coreFacesModule(geometry) {
'use strict';
const { EPS, ccw, edgesOf, intersect2, minus2 } = geometry;

const sub3 = (/** @type {Vec3} */ a, /** @type {Vec3} */ b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (/** @type {Vec3} */ a, /** @type {Vec3} */ b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (/** @type {Vec3} */ a, /** @type {Vec3} */ b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit3 = (/** @type {Vec3} */ a) => { const L = Math.hypot(...a); return a.map(v => v / L); };

/* One list of points: a computed point within WELD_TOL of a listed one is replaced by it. Every face, piece, triangle
   and edge uses these points only, so two faces that meet share their points exactly. */
const WELD_TOL = 0.05, WELD = /** @type {Map<string, Point3[]>} */ (new Map());  // mm; a cell of the grid -> its points
let pointCount = 0;
const NEAR = 0.5 - WELD_TOL;
/** @param {Vec3} v @returns {Point3} */
function weld(v) {
  const k = [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];   // a 1 mm grid: a neighbour cell only when the point is within the tolerance of its line
  const near = k.map((c, i) => { const d = v[i] - c; return d > NEAR ? [c, c + 1] : d < -NEAR ? [c, c - 1] : [c]; });
  for (const a of near[0]) for (const b of near[1]) for (const c of near[2]) {
    const list = WELD.get(a + ',' + b + ',' + c);
    if (list) for (const p of list) if (Math.abs(p[0] - v[0]) <= WELD_TOL && Math.abs(p[1] - v[1]) <= WELD_TOL && Math.abs(p[2] - v[2]) <= WELD_TOL) return p;
  }
  const p = /** @type {Point3} */ ([v[0], v[1], v[2]]); p.id = pointCount++;
  const key = k[0] + ',' + k[1] + ',' + k[2], list = WELD.get(key); if (list) list.push(p); else WELD.set(key, [p]); return p;
}
const noRepeats = (/** @type {Point3[]} */ P) => P.filter((p, i) => p !== P[(i + 1) % P.length]);

/* the faces of a cell: the side of every polygon edge and the two ends */
/** @param {Cell} c @returns {Piece[]} */
function cellFaces(c) {
  const S = c.S, P = S.poly, /** @type {Piece[]} */ out = [];
  const face = (/** @type {Vec3[]} */ pts, /** @type {Vec3} */ n, /** @type {(v: Vec3) => number[]} */ uv) => out.push({ poly: noRepeats(pts.map(weld)), n, uv, cell: c, group: c.layers.join('+'),
    material: c.faceMaterial ? c.faceMaterial(n, pts) : /** @type {string} */ (c.material) });
  for (const [a, b] of edgesOf(P)) {
    const dy = b[0] - a[0], dh = b[1] - a[1], L = Math.hypot(dy, dh); if (L < EPS) continue;
    let e = [dy / L, dh / L]; if (e[1] < -EPS || (Math.abs(e[1]) < EPS && e[0] < 0)) e = [-e[0], -e[1]];   // texture up the slope
    face([[S.x1, a[0], a[1]], [S.x2, a[0], a[1]], [S.x2, b[0], b[1]], [S.x1, b[0], b[1]]], [0, dh / L, -dy / L], v => [v[0], v[1] * e[0] + v[2] * e[1]]);
  }
  for (const [x, nx] of [[S.x1, -1], [S.x2, 1]]) face(P.map(p => [x, p[0], p[1]]), [nx, 0, 0], v => [v[1], v[2]]);
  return out;
}

/* A face loses, by exact subtraction, what an opposite face of its own group covers in its plane. A part covered by
   another group is a contact piece: drawn, but seen only while that group is hidden (it faces into that solid). */
const planeKey = (/** @type {Vec3} */ n, /** @type {number} */ d) => n.map(v => Math.round(v * 1e4)).join(',') + '|' + Math.round(d * 1000);
/** @param {Vec3} n @returns {Vec3[]} */
function planeBasis(n) { const u = unit3(cross3(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])); return [u, cross3(n, u)]; }
/** @param {Piece[]} faces @returns {Piece[]} */
function visiblePieces(faces) {
  const byPlane = /** @type {Map<string, Piece[]>} */ (new Map());
  for (const f of faces) { f.d = dot3(f.n, f.poly[0]); const k = planeKey(f.n, f.d), list = byPlane.get(k); if (list) list.push(f); else byPlane.set(k, [f]); }
  /** @type {Piece[]} */ const out = [];
  for (const f of faces) {
    if (f.poly.length < 3) continue;
    const d = /** @type {number} */ (f.d), opposite = byPlane.get(planeKey(f.n.map(v => -v), -d)) || [];
    if (!opposite.length) { out.push(Object.assign(f, { cover: null })); continue; }
    const [u, v] = planeBasis(f.n), to2 = (/** @type {Vec3} */ q) => [dot3(q, u), dot3(q, v)];
    const to3 = (/** @type {number[]} */ q) => weld([0, 1, 2].map(i => f.n[i] * d + u[i] * q[0] + v[i] * q[1]));
    let pieces = [ccw(f.poly.map(to2))];
    const /** @type {[Poly, string[]][]} */ contact = [], own = (/** @type {Piece} */ o) => o.group === f.group ? 0 : 1;
    for (const o of opposite.slice().sort((a, b) => own(a) - own(b))) {   // first the faces of its own group
      const O = ccw(o.poly.map(to2));
      pieces = pieces.flatMap(P => {
        const I = intersect2(P, O, WELD_TOL);
        if (!I) return [P];
        if (own(o)) contact.push([I, o.cell.layers]);
        return minus2(P, O, WELD_TOL);
      });
    }
    /* block -> EPS -> facade: a piece against another solid is the bare material */
    const keep = (/** @type {Poly} */ P, /** @type {string[] | null} */ cover) => { const q = noRepeats(P.map(to3)); if (q.length >= 3) out.push(Object.assign({}, f, { poly: q, cover, material: cover && f.cell.raw ? f.cell.raw : f.material })); };
    for (const P of pieces) keep(P, null);
    for (const [P, cover] of contact) keep(P, cover);
  }
  return out;
}

/* every welded point lying on an edge of a piece becomes a vertex of it: no T-junctions, no cracks */
/** @param {Piece[]} pieces @returns {Piece[]} */
function conform(pieces) {
  const axisOf = (/** @type {Vec3} */ a, /** @type {Vec3} */ b) => { const d = sub3(b, a).map(Math.abs); for (let k = 0; k < 3; k++) if (d[(k + 1) % 3] < EPS && d[(k + 2) % 3] < EPS) return k; return 3; };
  const keyOf = (/** @type {number} */ axis, /** @type {Vec3} */ p) => axis + '|' + [0, 1, 2].filter(k => k !== axis).map(k => Math.round(p[k] * 1000)).join('|');
  const lines = /** @type {Map<string, Set<Point3>>} */ (new Map());
  for (const f of pieces) for (const p of f.poly) for (let axis = 0; axis < 4; axis++) {   // axis 3: any slope, keyed by x only
    const k = axis === 3 ? '3|' + Math.round(p[0] * 1000) : keyOf(axis, p), set = lines.get(k);
    if (set) set.add(p); else lines.set(k, new Set([p]));
  }
  for (const f of pieces) {
    /** @type {Point3[]} */ const out = [];
    for (const [a, b] of edgesOf(f.poly)) {
      out.push(a);
      const d = sub3(b, a), L2 = dot3(d, d); if (L2 < EPS) continue;
      const axis = axisOf(a, b), /** @type {[number, Point3][]} */ on = [];
      for (const v of lines.get(axis === 3 ? '3|' + Math.round(a[0] * 1000) : keyOf(axis, a)) || []) {
        if (v === a || v === b) continue;
        const t = dot3(sub3(v, a), d) / L2; if (t <= 0 || t >= 1) continue;
        const off = sub3([a[0] + t * d[0], a[1] + t * d[1], a[2] + t * d[2]], v);
        if (dot3(off, off) <= WELD_TOL * WELD_TOL) on.push([t, v]);
      }
      for (const [, v] of on.sort((p, q) => p[0] - q[0])) if (out[out.length - 1] !== v) out.push(v);
    }
    f.poly = noRepeats(out);
  }
  return pieces;
}

/** the drawn pieces of a set of cells @returns {Piece[]} */
const piecesOf = (/** @type {Cell[]} */ cells) => conform(visiblePieces(cells.flatMap(cellFaces)));

return { sub3, dot3, cross3, weld, piecesOf };
}
