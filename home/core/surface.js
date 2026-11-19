// @ts-check
/* core/surface.js: the surfaces of solids, ready to draw: welded points, the faces of cells, the visible pieces,
   finishes on a host's faces. Knows no project and no browser.
   A cell is {S, material, layers, edges, ...}; faceMaterial(n, points), if a cell has it, gives the material of a face by
   its normal (and its corners, mm). Needs core/geometry.js. */
(/** @param {Home} HOME */ function (HOME) {
'use strict';
const { EPS, ccw, edgesOf, intersect2, minus2 } = HOME.geometry;

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit3 = a => { const L = Math.hypot(...a); return a.map(v => v / L); };

/* One list of points: a computed point within WELD_TOL of a listed one is replaced by it. Every face, piece, triangle
   and edge uses these points only, so two faces that meet share their points exactly. */
const WELD_TOL = 0.05, WELD = new Map();  // mm; a cell of the grid -> its points
let pointCount = 0;
const NEAR = 0.5 - WELD_TOL;
function weld(v) {
  const k = [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];   // a 1 mm grid: a neighbour cell only when the point is within the tolerance of its line
  const near = k.map((c, i) => { const d = v[i] - c; return d > NEAR ? [c, c + 1] : d < -NEAR ? [c, c - 1] : [c]; });
  for (const a of near[0]) for (const b of near[1]) for (const c of near[2]) {
    const list = WELD.get(a + ',' + b + ',' + c);
    if (list) for (const p of list) if (Math.abs(p[0] - v[0]) <= WELD_TOL && Math.abs(p[1] - v[1]) <= WELD_TOL && Math.abs(p[2] - v[2]) <= WELD_TOL) return p;
  }
  const p = /** @type {number[] & { id?: number }} */ ([v[0], v[1], v[2]]); p.id = pointCount++;
  const key = k[0] + ',' + k[1] + ',' + k[2], list = WELD.get(key); if (list) list.push(p); else WELD.set(key, [p]); return p;
}
const noRepeats = P => P.filter((p, i) => p !== P[(i + 1) % P.length]);

/* the faces of a cell: the side of every polygon edge and the two ends */
function cellFaces(c) {
  const S = c.S, P = S.poly, out = [];
  const face = (pts, n, uv) => out.push({ poly: noRepeats(pts.map(weld)), n, uv, cell: c, group: c.layers.join('+'),
    material: c.faceMaterial ? c.faceMaterial(n, pts) : c.material });
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
const planeKey = (n, d) => n.map(v => Math.round(v * 1e4)).join(',') + '|' + Math.round(d * 1000);
function planeBasis(n) { const u = unit3(cross3(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])); return [u, cross3(n, u)]; }
function visiblePieces(faces) {
  const byPlane = new Map();
  for (const f of faces) { f.d = dot3(f.n, f.poly[0]); const k = planeKey(f.n, f.d); if (!byPlane.has(k)) byPlane.set(k, []); byPlane.get(k).push(f); }
  const out = [];
  for (const f of faces) {
    if (f.poly.length < 3) continue;
    const opposite = byPlane.get(planeKey(f.n.map(v => -v), -f.d)) || [];
    if (!opposite.length) { out.push(Object.assign(f, { cover: null })); continue; }
    const [u, v] = planeBasis(f.n), to2 = q => [dot3(q, u), dot3(q, v)];
    const to3 = q => weld([0, 1, 2].map(i => f.n[i] * f.d + u[i] * q[0] + v[i] * q[1]));
    let pieces = [ccw(f.poly.map(to2))];
    const contact = [], own = o => o.group === f.group ? 0 : 1;
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
    const keep = (P, cover) => { const q = noRepeats(P.map(to3)); if (q.length >= 3) out.push(Object.assign({}, f, { poly: q, cover, material: cover && f.cell.raw ? f.cell.raw : f.material })); };
    for (const P of pieces) keep(P, null);
    for (const [P, cover] of contact) keep(P, cover);
  }
  return out;
}

/* every welded point lying on an edge of a piece becomes a vertex of it: no T-junctions, no cracks */
function conform(pieces) {
  const axisOf = (a, b) => { const d = sub3(b, a).map(Math.abs); for (let k = 0; k < 3; k++) if (d[(k + 1) % 3] < EPS && d[(k + 2) % 3] < EPS) return k; return 3; };
  const keyOf = (axis, p) => axis + '|' + [0, 1, 2].filter(k => k !== axis).map(k => Math.round(p[k] * 1000)).join('|');
  const lines = new Map();
  for (const f of pieces) for (const p of f.poly) for (let axis = 0; axis < 4; axis++) {   // axis 3: any slope, keyed by x only
    const k = axis === 3 ? '3|' + Math.round(p[0] * 1000) : keyOf(axis, p);
    if (!lines.has(k)) lines.set(k, new Set()); lines.get(k).add(p);
  }
  for (const f of pieces) {
    const out = [];
    for (const [a, b] of edgesOf(f.poly)) {
      out.push(a);
      const d = sub3(b, a), L2 = dot3(d, d); if (L2 < EPS) continue;
      const axis = axisOf(a, b), on = [];
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

/* the drawn pieces of a set of cells */
const piecesOf = cells => conform(visiblePieces(cells.flatMap(cellFaces)));

/* Finishes of a room on the faces of its host (tiles on the walls and the floor), as data: [{box, n, material, finish?}].
   A rule covers the faces lying on the side of box that n faces from (n = +x: the plane x = box x1, the face looks into
   the box), inside box; the part of such a piece inside takes material. finish: a layer that switches it (off: the face's
   own material). A later rule wins. pick(piece): the pieces a rule may cover (the host's own). Seen pieces only. */
function finishPieces(pieces, finishes, pick = /** @type {(face: any) => boolean} */ (() => true)) {
  let out = pieces;
  for (const F of finishes) {
    const k = F.n.findIndex(v => Math.abs(v) > 0.5), s = Math.sign(F.n[k]), plane = F.box[2 * k + (s > 0 ? 0 : 1)];
    const [a, b] = [0, 1, 2].filter(i => i !== k), R = [[F.box[2 * a], F.box[2 * b]], [F.box[2 * a + 1], F.box[2 * b]], [F.box[2 * a + 1], F.box[2 * b + 1]], [F.box[2 * a], F.box[2 * b + 1]]];
    const to3 = q => { const v = []; v[k] = plane; v[a] = q[0]; v[b] = q[1]; return weld(v); };
    out = out.flatMap(f => {
      if (f.cover || Math.abs(f.n[k] - s) > 1e-6 || f.poly.some(p => Math.abs(p[k] - plane) > WELD_TOL) || !pick(f)) return [f];
      const P = ccw(f.poly.map(p => [p[a], p[b]])), I = intersect2(P, R, WELD_TOL);
      if (!I) return [f];
      const piece = (Q, more) => Object.assign({}, f, { poly: noRepeats(Q.map(to3)) }, more);
      return [piece(I, { material: F.material, cell: F.finish ? Object.assign({}, f.cell, { finish: F.finish, raw: f.material }) : f.cell })].concat(minus2(P, R, WELD_TOL).map(Q => piece(Q, {})));
    });
  }
  return conform(out.filter(f => f.poly.length >= 3));
}

HOME.surface = { sub3, dot3, cross3, unit3, WELD_TOL, weld, noRepeats, cellFaces, visiblePieces, conform, piecesOf, finishPieces,
  get pointCount() { return pointCount; } };
})(window.HOME = window.HOME || {});
