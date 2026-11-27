// @ts-check
// house/shapes.js: what is drawn of the house (types.js: Part): every element a prism
// cut by the roof, by what it names in cuts and by the openings it hosts, split between the floors at geometry.split, the
// facade's finishes over its EPS; the roof's two slopes less the chimney and the roof windows; the windows and the outer doors
// (frames, glass, leaves), the inner doors (frame, leaf, handles); the stair's treads. Worked in the house's axes, each part
// given to its node in the node's own axes.

import { DEG, INF, EPS, SOLID_TOL, SIDES, ccw, rect2, clipHalf, leftOf, edgesOf, intersect2, minus2, prism, emptyPrism, centreH,
  prismIntersect, prismMinus, splitH, subtractAll } from '../core/geometry.js';

/** @typedef {import('../core/geometry.js').Prism} Prism */
/** @typedef {import('../core/geometry.js').Poly} Poly */
/** @typedef {import('../core/geometry.js').Line} Line */
/** @typedef {import('../core/geometry.js').Box} Box */
/** @typedef {import('../types.js').Part} Part */
/** @typedef {import('./assembly.js').HouseNode} HouseNode */
/** @typedef {{ h: number, y: number, pitch: number }} HouseLine  h + pitch · tan(roof pitch) · (y′ − y) */
/** @typedef {{ S: Prism, material: string, floor?: string, layer?: string, cap?: string, raw?: string, finish?: string, edges?: false, mover?: string, faces?: Record<string, string>, eaves?: number[] }} Cell  a prism and what it is, in the house's axes */

/** a missing range or end: no limit @param {(number | null)[] | undefined} r */
const range = r => [r && r[0] !== null ? r[0] : -INF, r && r[1] !== null ? r[1] : INF];
/** convex polygons A minus every polygon of B, in turn: convex pieces @param {Poly[]} A @param {Poly[]} B */
const polysMinus = (A, B) => B.reduce((pieces, b) => pieces.flatMap(p => intersect2(p, b, SOLID_TOL) ? minus2(p, b, SOLID_TOL) : [p]), A);
/** the part of polygon P between u = a and u = b @param {Poly} P @param {number} a @param {number} b */
const stripOf = (P, a, b) => clipHalf(clipHalf(P, p => p[0] - a), p => b - p[0]);
/** the part of polygon P within w of c along coordinate k: a bar through c @param {Poly} P @param {number} k @param {number} c @param {number} w */
const bandOf = (P, k, c, w) => clipHalf(clipHalf(P, p => p[k] - c + w / 2), p => c + w / 2 - p[k]);
/** @type {Record<string, { axis: number, sign: number }>} the compass sides, and down (under the floor) */
const SIDE = Object.assign({}, SIDES, { down: { axis: 2, sign: -1 } });

/**
 * Every node of the house that is drawn gets its parts.
 * @param {{ place: (n: HouseNode) => number[], box: (n: HouseNode) => number[], walk: (fn: (n: HouseNode) => void) => void, chain: (n: HouseNode) => HouseNode[] }} H  the hierarchy
 * @param {HouseNode} HOUSE
 */
export function houseShapes(H, HOUSE) {
  const GEO = HOUSE.geometry, TYPES = GEO.types, zero = H.place(HOUSE);
  /** @param {string} t */
  const KIND = t => TYPES[t]?.material ? TYPES[t] : null;
  /** @param {string} t */
  const OPENING_KIND = t => { const k = TYPES[t]; return k && !k.material && (k.glazed || k.leaf || k.door) ? k : null; };
  const inside = (/** @type {HouseNode} */ n) => H.chain(n).includes(HOUSE);
  /** a node's box in the house's axes @param {HouseNode} n @returns {Box} */
  const boxOf = n => H.box(n).map((v, i) => v - zero[i >> 1]);
  /** a node's place in the house's axes @param {HouseNode} n */
  const placeOf = n => H.place(n).map((v, i) => v - zero[i]);
  const FLOORS = /** @type {HouseNode[]} */ (HOUSE.children || []).filter(n => n.type === 'floor'), TOP_FLOOR = FLOORS[FLOORS.length - 1];
  const level = (/** @type {HouseNode} */ F) => placeOf(F)[2];
  /** a node's lines and transoms, from its axes into the house's @param {HouseNode} n */
  const inHouse = n => {
    const p = placeOf(n);
    return { below: (n.below || []).map((/** @type {HouseLine} */ l) => ({ ...l, h: l.h + p[2], y: l.y + p[1] })), transoms: (n.transoms || []).map((/** @type {number} */ h) => h + p[2]) };
  };

  /* the elements, the openings, the roof windows, the voids, each with its box in the house */
  /** @type {any[]} */ const ELEMENTS = [];
  /** @type {any[]} */ const OPENINGS = [];
  /** @type {any[]} */ const ROOF_WINDOWS = [];
  /** @type {{ id: string, boxes: Box[] }[]} */ const VOIDS = [];
  /** @type {HouseNode | null} */ let ROOF_NODE = null;
  /** @type {HouseNode | null} */ let STAIR = null;
  H.walk(n => {
    if (!inside(n)) return;
    if (KIND(n.type)) ELEMENTS.push({ ...n, ...inHouse(n), node: n, kind: n.type, b: boxOf(n) });
    else if (OPENING_KIND(n.type)) OPENINGS.push({ ...n, ...inHouse(n), node: n, kind: n.type, b: boxOf(n) });
    else if (n.type === 'roofWindow') { const b = boxOf(n); ROOF_WINDOWS.push({ node: n, x: [b[0], b[1]], y: [b[2], b[3]] }); }
    else if (n.type === 'void') VOIDS.push({ id: n.id, boxes: /** @type {HouseNode[]} */ (n.children || []).map(boxOf) });
    if (n.id === 'roof' && H.chain(n).at(-2) === HOUSE) ROOF_NODE = n;
    if (n.id === 'stair' && H.chain(n).at(-2) === HOUSE) STAIR = n;
  });
  const ELEMENT = Object.fromEntries(ELEMENTS.map(e => [e.id, e])), VOID = Object.fromEntries(VOIDS.map(v => [v.id, v]));
  if (!ROOF_NODE || !STAIR) throw new Error('house: no roof or no stair');
  const ROOF = /** @type {HouseNode} */ (ROOF_NODE), ST = /** @type {HouseNode} */ (STAIR);
  /** @type {Map<HouseNode, Cell[]>} what each node gets */
  const OUT = new Map();
  /** @param {HouseNode} n @param {Cell} c */
  const give = (n, c) => { if (!emptyPrism(c.S)) (OUT.get(n) || OUT.set(n, []).get(n))?.push(c); };

  /* ---------- 1. the roof's lines: h = a + s·y ---------- */
  const TAN = Math.tan(ROOF.pitch * DEG), WIDTH = ROOF.width;
  const ROOF_DEPTH = ROOF.thickness / Math.cos(ROOF.pitch * DEG);   // the data gives it across the slope, the prisms vertically
  /** @param {HouseLine} l @returns {Line} */
  const line = l => ({ a: l.h - l.pitch * TAN * l.y, s: l.pitch * TAN });
  /** @type {Line[]} */
  const ROOF_UNDER = [{ a: ROOF.eave, s: TAN }, { a: ROOF.eave + TAN * WIDTH, s: -TAN }];
  const floorOf = (/** @type {number} */ h) => h < GEO.split ? FLOORS[0].floor : TOP_FLOOR.floor;
  /** a slab of the roof between y1 and y2 along line l, from d[0] to d[1] over it @param {number} x1 @param {number} x2 @param {number} y1 @param {number} y2 @param {Line} l @param {number[]} d @returns {Prism} */
  const slopeSlab = (x1, x2, y1, y2, l, d) => ({ x1, x2, poly: ccw([
    [y1, l.a + l.s * y1 + d[0]], [y2, l.a + l.s * y2 + d[0]], [y2, l.a + l.s * y2 + d[1]], [y1, l.a + l.s * y1 + d[1]]]) });

  /* ---------- 2. the prisms of the data ---------- */
  const elementPrism = (/** @type {any} */ e) => prism(e.b, e.below.map(line).concat(e.top === 'roof' ? ROOF_UNDER : []));
  const openingPrism = (/** @type {any} */ o) => prism(o.b, o.below.map(line));
  /** @param {string} id @returns {Prism[]} */
  const cutPrisms = id => ELEMENT[id] ? [elementPrism(ELEMENT[id])] : VOID[id] ? VOID[id].boxes.map(b => prism(b)) : [];
  const regionPrism = (/** @type {any} */ r) => prism([...range(r.x), ...range(r.y), ...range(r.h)], (r.below || []).map(line));
  const OPENING_PRISMS = OPENINGS.map(openingPrism);

  /* ---------- 3. the elements: cut, split between the floors, finished ---------- */
  /* the facade rules that apply to element e: its own, or by the side of its type's finish facing the air */
  const finishesOf = (/** @type {any} */ e) => GEO.finishes.filter((/** @type {any} */ r) => r.elements ? r.elements.includes(e.id) : !!TYPES[e.kind].finish && (!r.side || r.side === e.outer));
  /** a facade rule splits each piece into what it covers (its material) and the rest; a later rule wins @param {{ S: Prism, material: string }[]} pieces @param {any} r */
  const applyFinish = (pieces, r) => {
    const R = regionPrism(r);
    return pieces.flatMap(t => { const inner = prismIntersect(t.S, R); return inner ? [{ S: inner, material: r.material }, ...prismMinus(t.S, R).map(S => ({ S, material: t.material }))] : [t]; });
  };
  for (const e of ELEMENTS) {
    const k = TYPES[e.kind];
    let parts = subtractAll([elementPrism(e)], (e.cuts || []).flatMap(cutPrisms));
    if (k.opened) parts = subtractAll(parts, OPENING_PRISMS);
    const pieces = finishesOf(e).reduce(applyFinish, parts.flatMap(S => splitH(S, GEO.split)).map(S => ({ S, material: k.material })));
    for (const t of pieces) give(e.node, { S: t.S, material: t.material, floor: e.floor || k.floor || floorOf(centreH(t.S)), cap: k.cap,
      ...(k.raw ? { raw: k.raw, finish: k.finish } : {}) });
  }

  /* ---------- 4. the roof: two slopes less its cuts and the roof windows; its faces by their side ---------- */
  {
    const slopes = [slopeSlab(ROOF.x[0], ROOF.x[1], 0, WIDTH / 2, ROOF_UNDER[0], [0, ROOF_DEPTH]), slopeSlab(ROOF.x[0], ROOF.x[1], WIDTH / 2, WIDTH, ROOF_UNDER[1], [0, ROOF_DEPTH])];
    const holes = (ROOF.cuts || []).flatMap(cutPrisms).concat(ROOF_WINDOWS.map(w => prism([w.x[0], w.x[1], w.y[0], w.y[1], -INF, INF])));
    for (const S of subtractAll(slopes, holes)) give(ROOF, { S, material: ROOF.faces.top, faces: ROOF.faces, eaves: [0, WIDTH], cap: ROOF.cap, layer: 'roofPlanes' });
  }

  /* ---------- 5. the windows and the outer doors: in the block that hosts them, flush with its outer face ---------- */
  const F = GEO.frames;
  /** a part drawn as it is, never cut @param {HouseNode} n @param {Prism} S @param {string} material @param {boolean} [edges] */
  const fixture = (n, S, material, edges = false) => give(n, { S, material, floor: floorOf(centreH(S)), cap: material, ...(edges ? {} : { edges: false }) });
  /* the plane of an opening: its outline, its span along the wall and how a polygon of it becomes a prism */
  const openingPlane = (/** @type {any} */ o) => {
    const side = SIDE[o.outer];
    const host = ELEMENTS.find(e => TYPES[e.kind].host && prismIntersect(elementPrism(e), openingPrism(o)));
    const face = host.b[2 * side.axis + (side.sign > 0 ? 1 : 0)];
    const depth = (/** @type {number} */ d1, /** @type {number} */ d2) => [face - side.sign * d1, face - side.sign * d2].sort((a, b) => a - b);
    const alongX = side.axis === 0;
    /** @param {Poly} P @param {number[]} d @returns {Prism} */
    const toPrism = (P, d) => {
      const [a, b] = depth(d[0], d[1]);
      if (alongX) return { x1: a, x2: b, poly: P };
      const us = P.map(p => p[0]), hs = P.map(p => p[1]);
      return prism([Math.min(...us), Math.max(...us), a, b, Math.min(...hs), Math.max(...hs)]);
    };
    const outline = alongX ? openingPrism(o).poly : rect2(o.b[0], o.b[1], o.b[4], o.b[5]);
    const span = alongX ? [o.b[2], o.b[3]] : [o.b[0], o.b[1]];
    return { toPrism, outline, span };
  };
  /* a solid leaf with evenly spaced grooves, and a handle if it has one; the grooves stop at the handle */
  const leafFixtures = (/** @type {any} */ o, /** @type {any} */ plane, /** @type {Poly} */ P) => {
    const D = F.leaves[TYPES[o.kind].leaf], h1 = o.b[4], h2 = o.b[5];
    fixture(o.node, plane.toPrism(P, D.depth), D.material);
    const H2 = D.handle, leafEnd = Math.max(...P.map(p => p[0]));
    const handle = H2 && rect2(leafEnd - H2.inset - H2.width / 2, leafEnd - H2.inset + H2.width / 2, h1 + H2.centre - H2.length / 2, h1 + H2.centre + H2.length / 2);
    if (handle) fixture(o.node, plane.toPrism(handle, H2.depth), H2.material);
    for (let i = 1; i <= D.grooves; i++) {
      const groove = bandOf(P, 1, h1 + (h2 - h1) * i / (D.grooves + 1), D.grooveHeight);
      for (const piece of polysMinus([groove], handle ? [handle] : [])) fixture(o.node, plane.toPrism(piece, D.grooveDepth), D.groove);
    }
  };
  /* the inner outline of a glazed frame: the frame inset follows every edge, the sill only if it has one */
  const frameInner = (/** @type {Poly} */ P, /** @type {boolean} */ sill) => {
    const bottom = Math.min(...P.map(p => p[1]));
    let inner = P;
    for (const [a, b] of edgesOf(P)) {
      if (Math.abs(a[1] - bottom) < EPS && Math.abs(b[1] - bottom) < EPS && !sill) continue;
      inner = clipHalf(inner, p => leftOf(a, b)(p) - F.width * Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    return inner;
  };
  /* the bars of a frame: mullions run through, transoms stop at them */
  const frameBars = (/** @type {any} */ o, /** @type {Poly} */ inner) => {
    const us = inner.map(p => p[0]), i1 = Math.min(...us), i2 = Math.max(...us), cols = o.cols || 1;
    /** @type {Poly[]} */
    const mullions = [];
    for (let i = 1; i < cols; i++) mullions.push(bandOf(inner, 0, i1 + (i2 - i1) * i / cols, F.bar));
    return mullions.concat(o.transoms.flatMap((/** @type {number} */ h) => polysMinus([bandOf(inner, 1, h, F.bar)], mullions)));
  };
  /* frame, bars and glass; the panes are the glass between the bars */
  const glazedFixtures = (/** @type {any} */ o, /** @type {any} */ plane, /** @type {Poly} */ P) => {
    const inner = frameInner(P, TYPES[o.kind].glazed.sill), bars = frameBars(o, inner);
    for (const piece of minus2(P, inner, SOLID_TOL).concat(bars)) fixture(o.node, plane.toPrism(piece, [0, F.depth]), F.material);
    for (const pane of polysMinus([inner], bars)) fixture(o.node, plane.toPrism(pane, [(F.depth - F.glassDepth) / 2, (F.depth + F.glassDepth) / 2]), F.glass);
  };
  for (const o of OPENINGS) {
    const K = TYPES[o.kind];
    if (!K.glazed && !K.leaf) continue;     // an inner door: below
    const plane = openingPlane(o), [u1, u2] = plane.span, leafEnd = K.leaf ? u1 + (o.leaf || u2 - u1) : u1;
    if (K.leaf) leafFixtures(o, plane, stripOf(plane.outline, u1, leafEnd));
    if (K.glazed && leafEnd < u2) glazedFixtures(o, plane, stripOf(plane.outline, leafEnd, u2));
  }
  /* the roof windows lie in the slope: four bars and the glass between lines parallel to it */
  for (const w of ROOF_WINDOWS) {
    const W = ROOF.windowFrame, across = W.width * Math.cos(ROOF.pitch * DEG), l = ROOF_UNDER[(w.y[0] + w.y[1]) / 2 > WIDTH / 2 ? 1 : 0];
    const over = (/** @type {number[]} */ d) => [ROOF_DEPTH + d[0], ROOF_DEPTH + d[1]];
    const [x1, x2] = w.x, [y1, y2] = w.y, xi1 = x1 + W.width, xi2 = x2 - W.width;
    for (const b of [[x1, xi1, y1, y2], [xi2, x2, y1, y2], [xi1, xi2, y1, y1 + across], [xi1, xi2, y2 - across, y2]]) give(w.node, { S: slopeSlab(b[0], b[1], b[2], b[3], l, over(W.frame)), material: W.material, cap: W.material, edges: false });
    give(w.node, { S: slopeSlab(xi1, xi2, y1 + across, y2 - across, l, over(W.glass)), material: W.glazing, cap: W.glazing, edges: false });
  }

  /* ---------- 5b. the inner doors: hidden doors, the leaf flush with the wall on the door's flush side, a frame of two steps;
     the leaf and its handles turn about the hinge (the node's mover 'leaf') ---------- */
  for (const o of OPENINGS) {
    const K = TYPES[o.kind], D = K.door && F.doors[K.door];
    if (!D) continue;
    const [x1, x2, y1, y2, h1, h2] = o.b, alongX = x2 - x1 > y2 - y1;
    const [u1, u2] = alongX ? [x1, x2] : [y1, y2], [n1, n2] = alongX ? [y1, y2] : [x1, x2];
    const sign = SIDE[o.opens].sign, flushSign = SIDE[o.flush].sign;
    const flush = flushSign > 0 ? n2 : n1, back = flush - flushSign * D.depth, middle = (flush + back) / 2;
    const near = sign === flushSign ? [middle, flush] : [back, middle], far = sign === flushSign ? [back, middle] : [middle, flush];
    const face = sign === flushSign ? flush : back;
    /** a box from (u, n) ranges into the house's axes @param {number} ua @param {number} ub @param {number} na @param {number} nb @param {number} ha @param {number} hb */
    const box = (ua, ub, na, nb, ha, hb) => prism(alongX ? [ua, ub, Math.min(na, nb), Math.max(na, nb), ha, hb] : [Math.min(na, nb), Math.max(na, nb), ua, ub, ha, hb]);
    for (const [[na, nb], J] of /** @type {[number[], number][]} */ ([[near, D.frame], [far, D.stop]])) {
      fixture(o.node, box(u1, u1 + J, na, nb, h1, h2 - J), D.frameMaterial, true);
      fixture(o.node, box(u2 - J, u2, na, nb, h1, h2 - J), D.frameMaterial, true);
      fixture(o.node, box(u1, u2, na, nb, h2 - J, h2), D.frameMaterial, true);
    }
    const a = u1 + D.frame + D.gap, b = u2 - D.frame - D.gap, floor = floorOf((h1 + h2) / 2);
    const leaf = (/** @type {Prism} */ S, /** @type {string} */ material) => give(o.node, { S, material, floor, cap: material, mover: 'leaf' });
    leaf(box(a, b, near[0], near[1], h1 + D.bottom, h2 - D.frame - D.gap), D.material);
    leaf(box(u1 + D.stop + D.gap, u2 - D.stop - D.gap, far[0], far[1], h1 + D.bottom, h2 - D.stop - D.gap), D.material);
    const hinge = SIDE[o.hinge].sign > 0 ? b : a, free = hinge === a ? b : a, inward = free > hinge ? -1 : 1;
    const HD = D.handle, hu = free + inward * HD.inset, hh = h1 + HD.height;
    for (const [f, out] of [[face, sign], [face - sign * D.depth, -sign]]) {
      leaf(box(hu - HD.rosette / 2, hu + HD.rosette / 2, f, f + out * HD.rosetteDepth, hh - HD.rosette / 2, hh + HD.rosette / 2), HD.material);
      leaf(box(Math.min(hu, hu + inward * HD.lever), Math.max(hu, hu + inward * HD.lever), f + out * HD.offset, f + out * (HD.offset + HD.width), hh - HD.width / 2, hh + HD.width / 2), HD.material);
    }
    /* the hinge: an upright axis on the opening face; its turn brings the free edge out toward that face (to check with the moving parts) */
    const p = placeOf(o.node), axis = alongX ? [hinge, face] : [face, hinge], d = free - hinge;
    o.node.movers = [{ id: 'leaf', pivot: [axis[0] - p[0], axis[1] - p[1], h1 - p[2]], axis: [0, 0, 1], sign: (alongX ? Math.sign(d) * sign : -Math.sign(d) * sign) > 0 ? 1 : -1, travel: D.angle }];
  }

  /* ---------- 6. the stair: floating treads, the landing a flight of one ---------- */
  {
    const base = level(FLOORS[0]), rise = (level(TOP_FLOOR) - base) / ST.risers;
    for (const f of ST.flights) {
      const step = (f.y[1] - f.y[0]) / f.count;
      for (let i = 0; i < f.count; i++) {
        const ya = f.y[0] + i * step, yb = ya + step, h = base + (f.first + i) * rise;
        const S = prism([Math.min(f.x[0], f.x[1]), Math.max(f.x[0], f.x[1]), Math.min(ya, yb), Math.max(ya, yb), h - ST.tread, h]);
        give(ST, { S, material: ST.material, floor: floorOf(centreH(S)), cap: ST.material });
      }
    }
  }

  /* ---------- each node its parts, in its own axes ---------- */
  for (const [n, cells] of OUT) {
    const p = placeOf(n);
    n.parts = cells.map(({ S, ...c }) => /** @type {Part} */ ({ form: 'prism', x: [S.x1 - p[0], S.x2 - p[0]], poly: S.poly.map(q => [q[0] - p[1], q[1] - p[2]]), ...c,
      ...(c.eaves ? { eaves: c.eaves.map(y => y - p[1]) } : {}) }));
  }
}
