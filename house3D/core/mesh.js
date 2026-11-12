/* core/mesh.js: welded points, faces of cells, visible pieces, conforming polygons. Knows no project.
   A cell is {S, element, material, layers, edges, ...}; faceMaterial(n), if a cell has it, gives the material of a face by
   its normal. Needs core/geometry.js and THREE. */
(function (CORE) {
'use strict';
const { EPS, ccw, edgesOf, intersect2, minus2 } = CORE.geometry;

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit3 = a => { const L = Math.hypot(...a); return a.map(v => v / L); };

/* One list of points: a computed point within WELD_TOL of a listed one is replaced by it. Every face, piece, triangle
   and edge uses these points only, so two faces that meet share their points exactly. */
const WELD_TOL = 0.05, WELD = new Map();  // mm
let pointCount = 0;
function weld(v) {
  const k = v.map(c => Math.round(c * 10));   // a 0.1 mm grid, wider than the tolerance: the neighbours are searched
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    const p = WELD.get((k[0] + a) + ',' + (k[1] + b) + ',' + (k[2] + c));
    if (p && Math.abs(p[0] - v[0]) <= WELD_TOL && Math.abs(p[1] - v[1]) <= WELD_TOL && Math.abs(p[2] - v[2]) <= WELD_TOL) return p;
  }
  const p = [v[0], v[1], v[2]]; p.id = pointCount++; WELD.set(k.join(','), p); return p;
}
const noRepeats = P => P.filter((p, i) => p !== P[(i + 1) % P.length]);

/* triangles of convex polygons, batched per (layers, material); uv in mm on the face plane */
class Batch {
  constructor() { this.p = []; this.n = []; this.uv = []; }
  polygon(points, n, uv) {                 // a fan around the centre: no thin triangles from collinear points
    const c = [0, 1, 2].map(i => points.reduce((s, v) => s + v[i], 0) / points.length);
    for (let i = 0; i < points.length; i++) this.tri(c, points[i], points[(i + 1) % points.length], n, uv);
  }
  tri(a, b, c, n, uv) {
    if (dot3(cross3(sub3(b, a), sub3(c, a)), n) < 0) [b, c] = [c, b];
    for (const v of [a, b, c]) { const w = weld(v); this.p.push(...w); this.n.push(...n); this.uv.push(...uv(v)); }
  }
  mesh(mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    const m = new THREE.Mesh(g, mat); m.castShadow = !mat.transparent; m.receiveShadow = true; return m;
  }
}

/* the faces of a cell: the side of every polygon edge and the two ends */
function cellFaces(c) {
  const S = c.S, P = S.poly, out = [];
  const face = (pts, n, uv) => out.push({ poly: noRepeats(pts.map(weld)), n, uv, cell: c, group: c.layers.join('+'),
    material: c.faceMaterial ? c.faceMaterial(n) : c.material });
  for (const [a, b] of edgesOf(P)) {
    const dy = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dy, dz); if (L < EPS) continue;
    let e = [dy / L, dz / L]; if (e[1] < -EPS || (Math.abs(e[1]) < EPS && e[0] < 0)) e = [-e[0], -e[1]];   // texture up the slope
    face([[S.x1, a[0], a[1]], [S.x2, a[0], a[1]], [S.x2, b[0], b[1]], [S.x1, b[0], b[1]]], [0, dz / L, -dy / L], v => [v[0], v[1] * e[0] + v[2] * e[1]]);
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

CORE.mesh = { sub3, dot3, cross3, unit3, WELD_TOL, weld, noRepeats, Batch, cellFaces, visiblePieces, conform, piecesOf,
  get pointCount() { return pointCount; } };
})(window.CORE = window.CORE || {});
