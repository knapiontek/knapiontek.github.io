// @ts-check
/* core/geometry.js: exact operations on convex polygons and prisms. Knows no project.
   Every solid is a prism along x over a convex polygon in the y-h plane: a box, cut at most by lines h = a + s·y.
   Units mm; x along, y across, h up. */
/** @typedef {number[]} Point2  [y, h] (or [u, v]) */
/** @typedef {Point2[]} Poly  a convex polygon, counter-clockwise */
/** @typedef {{ x1: number, x2: number, poly: Poly }} Prism  along x from x1 to x2, over poly in the y-h plane */
/** @typedef {{ a: number, s: number }} Line  the line h = a + s·y */
/** @typedef {number[]} Box  [x1, x2, y1, y2, h1, h2] */
/** @typedef {number[]} Rect  [x1, x2, y1, y2] */
/** @typedef {'E' | 'W' | 'N' | 'S'} Side  a side by the compass */
function geometryModule() {
'use strict';

const DEG = Math.PI / 180, INF = 1e7, EPS = 1e-6;
const SOLID_TOL = 1e-2;                    // mm: a thinner solid is no solid

/* ================= CONVEX POLYGONS (2D) ================= */
const area2 = (/** @type {Poly} */ P) => { let s = 0; for (let i = 0; i < P.length; i++) { const q = P[(i + 1) % P.length]; s += P[i][0] * q[1] - q[0] * P[i][1]; } return s / 2; };
const ccw = (/** @type {Poly} */ P) => area2(P) < 0 ? P.slice().reverse() : P;
/** @returns {Poly} */
const rect2 = (/** @type {number} */ u1, /** @type {number} */ u2, /** @type {number} */ v1, /** @type {number} */ v2) => [[u1, v1], [u2, v1], [u2, v2], [u1, v2]];

/** the part of P where f(p) >= 0, f linear
    @param {Poly} P @param {(p: Point2) => number} f @returns {Poly} */
function clipHalf(P, f) {
  /** @type {Poly} */ const out = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length], fp = f(p), fq = f(q);
    if (fp >= -EPS) out.push(p);
    if ((fp > EPS && fq < -EPS) || (fp < -EPS && fq > EPS)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}
const leftOf = (/** @type {Point2} */ a, /** @type {Point2} */ b) => (/** @type {Point2} */ p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const rightOf = (/** @type {Point2} */ a, /** @type {Point2} */ b) => (/** @type {Point2} */ p) => -leftOf(a, b)(p);
/** the edges of a polygon, each [p, q] @template T @param {T[]} P @returns {T[][]} */
const edgesOf = P => P.map((p, i) => [p, P[(i + 1) % P.length]]);
/* a polygon counts only if it is wider than the tolerance, so slivers never become faces */
const solidPoly = (/** @type {Poly} */ P, /** @type {number} */ tol) => P.length >= 3 && area2(P) > tol * perimeter(P);
const perimeter = (/** @type {Poly} */ P) => edgesOf(P).reduce((s, [p, q]) => s + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);

/** @param {Poly} A @param {Poly} B @param {number} tol @returns {Poly | null} */
function intersect2(A, B, tol) { let P = A; for (const [a, b] of edgesOf(B)) { if (P.length < 3) break; P = clipHalf(P, leftOf(a, b)); } return solidPoly(P, tol) ? P : null; }
/** convex A minus convex B: convex pieces, both counter-clockwise
    @param {Poly} A @param {Poly} B @param {number} tol @returns {Poly[]} */
function minus2(A, B, tol) {
  /** @type {Poly[]} */ const pieces = []; let rest = A;
  for (const [a, b] of edgesOf(B)) {
    if (rest.length < 3) break;
    const outside = clipHalf(rest, rightOf(a, b));
    if (solidPoly(outside, tol)) pieces.push(outside);
    rest = clipHalf(rest, leftOf(a, b));
  }
  return pieces;
}

/* ================= PRISMS =================
   A prism {x1, x2, poly}: poly is the counter-clockwise y-h section. A line {a, s} is h = a + s·y. */
const under = (/** @type {Line} */ l) => (/** @type {Point2} */ p) => l.a + l.s * p[0] - p[1];

/** a box, cut by the lines it stays under
    @param {Box} b @param {Line[]} [below] @returns {Prism} */
function prism(b, below = []) {
  let poly = rect2(b[2], b[3], b[4], b[5]);
  for (const l of below) poly = clipHalf(poly, under(l));
  return { x1: b[0], x2: b[1], poly };
}
const emptyPrism = (/** @type {Prism} */ S) => S.x2 - S.x1 < SOLID_TOL || !solidPoly(S.poly, SOLID_TOL);
const hRange = (/** @type {Prism} */ S) => [Math.min(...S.poly.map(p => p[1])), Math.max(...S.poly.map(p => p[1]))];
const centreH = (/** @type {Prism} */ S) => S.poly.reduce((s, p) => s + p[1], 0) / S.poly.length;

/** @param {Prism} S @param {Prism} H @returns {Prism | null} */
function prismIntersect(S, H) {
  const x1 = Math.max(S.x1, H.x1), x2 = Math.min(S.x2, H.x2);
  if (x2 - x1 < SOLID_TOL) return null;
  const poly = intersect2(S.poly, H.poly, SOLID_TOL);
  return poly && { x1, x2, poly };
}
/** S minus H: convex prisms
    @param {Prism} S @param {Prism} H @returns {Prism[]} */
function prismMinus(S, H) {
  const x1 = Math.max(S.x1, H.x1), x2 = Math.min(S.x2, H.x2);
  if (x2 - x1 < SOLID_TOL || !intersect2(S.poly, H.poly, SOLID_TOL)) return [S];
  /** @type {Prism[]} */ const out = [];
  if (S.x1 < x1) out.push({ x1: S.x1, x2: x1, poly: S.poly });
  if (S.x2 > x2) out.push({ x1: x2, x2: S.x2, poly: S.poly });
  for (const poly of minus2(S.poly, H.poly, SOLID_TOL)) out.push({ x1, x2, poly });
  return out;
}
/** the parts of S on each side of the plane at height h
    @param {Prism} S @param {number} h @returns {Prism[]} */
function splitH(S, h) {
  const lo = clipHalf(S.poly, p => h - p[1]), hi = clipHalf(S.poly, p => p[1] - h);
  return [lo, hi].filter(P => solidPoly(P, SOLID_TOL)).map(poly => ({ x1: S.x1, x2: S.x2, poly }));
}
/** the y interval of S at height h, or null
    @param {Prism} S @param {number} h @returns {number[] | null} */
function sectionAt(S, h) {
  let lo = INF, hi = -INF;
  for (const [a, b] of edgesOf(S.poly)) {
    if ((a[1] - h) * (b[1] - h) > 0) continue;
    const ys = a[1] === b[1] ? [a[0], b[0]] : [a[0] + (h - a[1]) / (b[1] - a[1]) * (b[0] - a[0])];
    for (const y of ys) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  }
  return hi - lo > SOLID_TOL ? [lo, hi] : null;
}
/* a section at h belongs to a solid whose h range holds it, its top included: a cut on a cell's top still caps it */
const cutBy = (/** @type {Prism} */ S, /** @type {number} */ h) => { const [lo, hi] = hRange(S); return h > lo && h <= hi; };
const volume = (/** @type {Prism} */ S) => (S.x2 - S.x1) * area2(S.poly);
const subtractAll = (/** @type {Prism[]} */ cells, /** @type {Prism[]} */ prisms) => prisms.reduce((cs, H) => cs.flatMap(S => prismMinus(S, H)), cells);

/** every pair of cells that share more than minVolume, two pieces of one element included
    @template {{ S: Prism }} C @param {C[]} cells @param {number} [minVolume]
    @returns {{ a: C, b: C, common: Prism, volume: number }[]} */
function overlaps(cells, minVolume = SOLID_TOL) {
  /** @type {{ a: C, b: C, common: Prism, volume: number }[]} */ const out = [];
  for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) {
    const a = cells[i], b = cells[j], common = prismIntersect(a.S, b.S);
    if (common && volume(common) > minVolume) out.push({ a, b, common, volume: volume(common) });
  }
  return out;
}

/* ================= RECTANGLES [x1, x2, y1, y2] ================= */
const rectArea = (/** @type {Rect} */ q) => (q[1] - q[0]) * (q[3] - q[2]);
/** rect a minus rect b, as up to four rects @returns {Rect[]} */
const rectMinus = (/** @type {Rect} */ a, /** @type {Rect} */ b) => {
  const x1 = Math.max(a[0], b[0]), x2 = Math.min(a[1], b[1]), y1 = Math.max(a[2], b[2]), y2 = Math.min(a[3], b[3]);
  if (x2 - x1 < EPS || y2 - y1 < EPS) return [a];
  return [[a[0], x1, a[2], a[3]], [x2, a[1], a[2], a[3]], [x1, x2, a[2], y1], [x1, x2, y2, a[3]]].filter(q => q[1] - q[0] > EPS && q[3] - q[2] > EPS);
};
/** rects sharing a whole side become one: a patch is reported once; rects is changed
    @param {Rect[]} rects @returns {Rect[]} */
function mergeRects(rects) {
  const near = (a, b) => Math.abs(a - b) < EPS;
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const m = [0, 1].map(k => { const o = 1 - k;   // joined along axis k: same span across, touching along
      return near(a[2 * o], b[2 * o]) && near(a[2 * o + 1], b[2 * o + 1]) && (near(a[2 * k + 1], b[2 * k]) || near(b[2 * k + 1], a[2 * k])) ? k : null; }).find(k => k !== null);
    if (m === undefined) continue;
    a[2 * m] = Math.min(a[2 * m], b[2 * m]); a[2 * m + 1] = Math.max(a[2 * m + 1], b[2 * m + 1]);
    rects.splice(j, 1); return mergeRects(rects);
  }
  return rects;
}

/** a stable random number in [0, 1) of whole numbers: the same arguments give the same number (a layout looks the same every time)
    @param {...number} k @returns {number} */
function hash01(...k) {
  let h = 2166136261;
  for (const v of k) { h ^= (v | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); h ^= h >>> 13; }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/* the sides of the house by the compass, in its axes: x grows to the west (the garden on the east, the entrance on the
   west), y to the south (the garage window on the north, the bathrooms on the south); sign: the end of the axis */
/** @type {Record<Side, { axis: 0 | 1, sign: 1 | -1 }>} */
const SIDES = { E: { axis: 0, sign: -1 }, W: { axis: 0, sign: 1 }, N: { axis: 1, sign: -1 }, S: { axis: 1, sign: 1 } };

return { SIDES, hash01, DEG, INF, EPS, SOLID_TOL, area2, ccw, rect2, clipHalf, leftOf, edgesOf, intersect2, minus2,
  prism, emptyPrism, hRange, centreH, prismIntersect, prismMinus, splitH, sectionAt, cutBy, volume, subtractAll, overlaps,
  rectArea, rectMinus, mergeRects };
}
