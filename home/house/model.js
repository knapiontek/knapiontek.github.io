// @ts-check
/* house/model.js: the house's data turned into solids, the rooms, a part of the house cut out for a room, the checks.
   No browser: index.html draws what it gives. Units mm in the house's axes (x along, y across, h up).
   Needs core/geometry.js and core/tree.js. */
(/** @param {Home} HOME */ function (HOME) {
'use strict';

const G = HOME.geometry;
const { DEG, INF, EPS, SOLID_TOL, ccw, rect2, clipHalf, leftOf, edgesOf, minus2, prism, emptyPrism, centreH, hRange,
  prismIntersect, prismMinus, splitH, subtractAll, overlaps, volume, rectArea, rectMinus, mergeRects } = G;

const byId = list => Object.fromEntries(list.map(e => [e.id, e]));
const range = r => [r && r[0] !== null ? r[0] : -INF, r && r[1] !== null ? r[1] : INF];   // a missing range or end: no limit

/* convex polygons A minus every polygon of B, in turn: convex pieces */
const polysMinus = (A, B) => B.reduce((pieces, b) => pieces.flatMap(p => G.intersect2(p, b, SOLID_TOL) ? minus2(p, b, SOLID_TOL) : [p]), A);
/* the part of polygon P between u = a and u = b (u its first coordinate) */
const stripOf = (P, a, b) => clipHalf(clipHalf(P, p => p[0] - a), p => b - p[0]);
/* the part of polygon P between v = c - w/2 and v = c + w/2 along coordinate k: a bar through c */
const bandOf = (P, k, c, w) => clipHalf(clipHalf(P, p => p[k] - c + w / 2), p => c + w / 2 - p[k]);

/* the outward side of an opening: which axis its wall faces along, and which way */
const SIDE = { x0: { axis: 0, sign: -1 }, x1: { axis: 0, sign: 1 }, y0: { axis: 1, sign: -1 }, y1: { axis: 1, sign: 1 }, h0: { axis: 2, sign: -1 } };

/* the model of a house: ROOT the root node of house.js, the site, with the house in it. The model works in the house's
   axes (its zero at its own extreme corner); the site is moved into them */
function build(ROOT) {
const HOUSE = ROOT.children.find(n => n.type === 'house'), SITE = ROOT;
const T = HOME.tree.create(HOUSE), GEO = HOUSE.geometry, KIND = GEO.kinds, OPENING_KIND = GEO.openingKinds;
const FLOORS = HOUSE.children.filter(n => n.type === 'floor'), TOP_FLOOR = FLOORS[FLOORS.length - 1];
const level = F => F.offset[2];
const fieldsOf = (n, keys) => Object.fromEntries(keys.filter(k => n[k] !== undefined).map(k => [k, n[k]]));
/* a node's lines and transoms are in its own axes: here in the house's */
const inHouse = (n, fields) => {
  const p = T.place(n);
  if (fields.below) fields.below = fields.below.map(l => Object.assign({}, l, { h: l.h + p[2], y: l.y + p[1] }));
  if (fields.transoms) fields.transoms = fields.transoms.map(h => h + p[2]);
  return fields;
};
/* the elements of the tree as the model reads them, each with its box in the house: an element (its type a kind), an
   opening in its wall, a roof window, a void and its boxes; the site, the roof and the stair are nodes of the house */
const ELEMENTS = [], OPENINGS = [], ROOF_WINDOWS = [], VOIDS = [];
T.walk(n => {
  if (KIND[n.type]) ELEMENTS.push(Object.assign(inHouse(n, fieldsOf(n, ['top', 'outer', 'cuts', 'floor', 'below'])), { id: n.id, kind: n.type, b: T.box(n) }));
  else if (OPENING_KIND[n.type]) OPENINGS.push(Object.assign(inHouse(n, fieldsOf(n, ['label', 'outer', 'cols', 'leaf', 'hinge', 'opens', 'flush', 'product', 'extras', 'below', 'transoms'])), { id: n.id, kind: n.type, b: T.box(n) }));
  else if (n.type === 'roofWindow') { const b = T.box(n); ROOF_WINDOWS.push({ id: n.id, name: n.place, label: n.label, x: [b[0], b[1]], y: [b[2], b[3]] }); }
  else if (n.type === 'void') VOIDS.push({ id: n.id, name: n.name, boxes: n.children.map(T.box) });
});
const HOUSE_NODE = id => HOUSE.children.find(n => n.id === id);
const STAIR = HOUSE_NODE('stair');
const ELEMENT = byId(ELEMENTS), VOID = byId(VOIDS);

/* ================= 1. ROOF LINES =================
   A line across the house is h = a + s·y; the roof gives the slope. */
const ROOF = Object.assign({}, HOUSE_NODE('roof'), { windows: ROOF_WINDOWS }), TAN = Math.tan(ROOF.pitch * DEG), WIDTH = ROOF.width;
const ROOF_DEPTH = ROOF.thickness / Math.cos(ROOF.pitch * DEG);   // the data gives it across the slope, the prisms vertically
const RIDGE_TOP = ROOF.eave + TAN * WIDTH / 2 + ROOF_DEPTH;
const line = l => ({ a: l.h - l.pitch * TAN * l.y, s: l.pitch * TAN });
const ROOF_UNDER = [{ a: ROOF.eave, s: TAN }, { a: ROOF.eave + TAN * WIDTH, s: -TAN }];
const floorOf = h => h < GEO.split ? FLOORS[0].id : TOP_FLOOR.id;
/* a slab of the roof between y1 and y2 along line l, from d[0] to d[1] over its top */
const slopeSlab = (x1, x2, y1, y2, l, d) => ({ x1, x2, poly: ccw([
  [y1, l.a + l.s * y1 + d[0]], [y2, l.a + l.s * y2 + d[0]], [y2, l.a + l.s * y2 + d[1]], [y1, l.a + l.s * y1 + d[1]]]) });

/* ================= 2. PRISMS OF THE DATA ================= */
const elementPrism = e => prism(e.b, (e.below || []).map(line).concat(e.top === 'roof' ? ROOF_UNDER : []));
const openingPrism = o => prism(o.b, (o.below || []).map(line));
const cutPrisms = id => ELEMENT[id] ? [elementPrism(ELEMENT[id])] : VOID[id].boxes.map(b => prism(b));
const regionPrism = r => prism([...range(r.x), ...range(r.y), ...range(r.h)], (r.below || []).map(line));
const OPENING_PRISMS = OPENINGS.map(openingPrism);

/* ================= 3. ELEMENTS =================
   A cell is a prism with what it is: {S, element, floor, material, cap, layers, raw?, finish?, walkable?, edges}. Its floor
   is the one its height gives, unless the element or its kind names another (the attic's ceiling is the roof's). */
const CELLS = [];
/* the facade rules that apply to element e: its own, or by the side of its kind's finish facing the air */
const finishesOf = e => GEO.finishes.filter(r => r.elements ? r.elements.includes(e.id) : !!KIND[e.kind].finish && (!r.side || r.side === e.outer));
/* a facade rule splits each part into what it covers (its material) and the rest; a later rule wins */
function applyFinish(parts, r) {
  const R = regionPrism(r);
  return parts.flatMap(t => {
    const inside = prismIntersect(t.S, R);
    if (!inside) return [t];
    return [{ S: inside, material: r.material }].concat(prismMinus(t.S, R).map(S => ({ S, material: t.material })));
  });
}
function elementCells(e) {
  const k = KIND[e.kind];
  let parts = subtractAll([elementPrism(e)], (e.cuts || []).flatMap(cutPrisms));
  if (k.opened) parts = subtractAll(parts, OPENING_PRISMS);
  parts = parts.flatMap(S => splitH(S, GEO.split)).map(S => ({ S, material: k.material }));
  parts = finishesOf(e).reduce(applyFinish, parts);
  return parts.map(t => {
    const floor = e.floor || k.floor || floorOf(centreH(t.S));
    return { S: t.S, element: e.id, floor, material: t.material, cap: k.cap, raw: k.raw, finish: k.finish,
      walkable: !!k.walkable, layers: [floor].concat(k.layers), edges: true };
  });
}
for (const e of ELEMENTS) CELLS.push(...elementCells(e));

/* ================= 4. ROOF =================
   Two slopes, without its cuts and the roof windows; its faces take the material of their side (a cut's walls: the reveals). */
const atEave = pts => pts.every(p => p[1] <= EPS || p[1] >= WIDTH - EPS);   // a face on the roof's outer edge
const roofFace = (n, pts) => n[2] > 0.3 ? 'top' : n[2] < -0.3 ? 'bottom' : Math.abs(n[0]) > 0.5 ? 'ends' : atEave(pts) ? 'eaves' : 'reveals';
const roofFaceMaterial = (n, pts) => ROOF.faces[roofFace(n, pts)];
const roofWindowPrism = w => prism([w.x[0], w.x[1], w.y[0], w.y[1], -INF, INF]);
function roofCells() {
  const slopes = [slopeSlab(...ROOF.x, 0, WIDTH / 2, ROOF_UNDER[0], [0, ROOF_DEPTH]), slopeSlab(...ROOF.x, WIDTH / 2, WIDTH, ROOF_UNDER[1], [0, ROOF_DEPTH])];
  const cells = subtractAll(slopes, ROOF.cuts.flatMap(cutPrisms).concat(ROOF.windows.map(roofWindowPrism)));
  return cells.map(S => ({ S, element: 'roof', floor: null, faceMaterial: roofFaceMaterial, cap: ROOF.cap, layers: ROOF.layers.slice(), edges: true }));
}
const ROOF_CELLS = roofCells();

/* ================= 5. WINDOWS AND DOORS =================
   They sit in the block that hosts them, flush with its outer face. A part of an opening is a polygon in its own
   plane: (y, h) in an x-facing wall, (x, h) in a y-facing one. */
const FIXTURES = [];                       // frames, glass, leaves: drawn, never cut by anything
const F = GEO.frames;
function addFixture(S, material, layers, element = 'opening', edges = false) {
  if (emptyPrism(S)) return;
  const floor = floorOf(centreH(S));
  FIXTURES.push({ S, element, floor, material, cap: material, layers: [floor].concat(layers), edges });
}
/* the plane of an opening: its outline, its span along the wall and how a polygon of it becomes a prism */
function openingPlane(o) {
  const side = SIDE[o.outer];
  const host = ELEMENTS.find(e => KIND[e.kind].host && prismIntersect(elementPrism(e), openingPrism(o)));
  const face = host.b[2 * side.axis + (side.sign > 0 ? 1 : 0)];
  const depth = (d1, d2) => [face - side.sign * d1, face - side.sign * d2].sort((a, b) => a - b);
  const alongX = side.axis === 0;
  /* a y-facing piece is a rectangle in x, so it is a prism along x as well */
  const toPrism = (P, d) => {
    const [a, b] = depth(...d);
    if (alongX) return { x1: a, x2: b, poly: P };
    const us = P.map(p => p[0]), hs = P.map(p => p[1]);
    return prism([Math.min(...us), Math.max(...us), a, b, Math.min(...hs), Math.max(...hs)]);
  };
  const outline = alongX ? openingPrism(o).poly : rect2(o.b[0], o.b[1], o.b[4], o.b[5]);
  const span = alongX ? [o.b[2], o.b[3]] : [o.b[0], o.b[1]];
  return { toPrism, outline, span };
}
/* an opening's layer by its kind: windows or doors */
const layersOf = o => [OPENING_KIND[o.kind].layer];
/* a solid leaf with evenly spaced grooves, and a handle if it has one; the grooves stop at the handle */
function leafFixtures(o, plane, P) {
  const D = F.leaves[OPENING_KIND[o.kind].leaf], [h1, h2] = [o.b[4], o.b[5]], layers = layersOf(o);
  addFixture(plane.toPrism(P, D.depth), D.material, layers);
  const handle = D.handle && handlePolygon(D.handle, Math.max(...P.map(p => p[0])), h1);
  if (handle) addFixture(plane.toPrism(handle, D.handle.depth), D.handle.material, layers);
  for (let i = 1; i <= D.grooves; i++) {
    const groove = bandOf(P, 1, h1 + (h2 - h1) * i / (D.grooves + 1), D.grooveHeight);
    for (const piece of polysMinus([groove], handle ? [handle] : [])) addFixture(plane.toPrism(piece, D.grooveDepth), D.groove, layers);
  }
}
const handlePolygon = (H, leafEnd, bottom) => {
  const u = leafEnd - H.inset, h = bottom + H.centre;
  return rect2(u - H.width / 2, u + H.width / 2, h - H.length / 2, h + H.length / 2);
};
/* the inner outline of a glazed frame: the frame inset follows every edge, the sill only if it has one */
function frameInner(P, sill) {
  const bottom = Math.min(...P.map(p => p[1]));
  let inner = P;
  for (const [a, b] of edgesOf(P)) {
    const isSill = Math.abs(a[1] - bottom) < EPS && Math.abs(b[1] - bottom) < EPS;
    if (isSill && !sill) continue;
    inner = clipHalf(inner, p => leftOf(a, b)(p) - F.width * Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return inner;
}
/* the bars of a frame: mullions run through, transoms stop at them */
function frameBars(o, inner) {
  const us = inner.map(p => p[0]), [i1, i2] = [Math.min(...us), Math.max(...us)], cols = o.cols || 1;
  const mullions = [];
  for (let i = 1; i < cols; i++) mullions.push(bandOf(inner, 0, i1 + (i2 - i1) * i / cols, F.bar));
  const transoms = (o.transoms || []).flatMap(h => polysMinus([bandOf(inner, 1, h, F.bar)], mullions));
  return mullions.concat(transoms);
}
/* frame, bars and glass; the panes are the glass between the bars */
function glazedFixtures(o, plane, P) {
  const inner = frameInner(P, OPENING_KIND[o.kind].glazed.sill), bars = frameBars(o, inner);
  const frameDepth = [0, F.depth], glassDepth = [(F.depth - F.glassDepth) / 2, (F.depth + F.glassDepth) / 2];
  for (const piece of minus2(P, inner, SOLID_TOL).concat(bars)) addFixture(plane.toPrism(piece, frameDepth), F.material, layersOf(o));
  for (const pane of polysMinus([inner], bars)) addFixture(plane.toPrism(pane, glassDepth), F.glass, layersOf(o));
}
function openingFixtures(o) {
  const K = OPENING_KIND[o.kind];
  if (!K.glazed && !K.leaf) return;        // an inner door: its frame and leaf are below (doorOf)
  const plane = openingPlane(o), [u1, u2] = plane.span;
  const leafEnd = K.leaf ? u1 + (o.leaf || u2 - u1) : u1;
  if (K.leaf) leafFixtures(o, plane, stripOf(plane.outline, u1, leafEnd));
  if (K.glazed && leafEnd < u2) glazedFixtures(o, plane, stripOf(plane.outline, leafEnd, u2));
}
/* roof windows lie in the slope: four bars and the glass between lines parallel to it */
function roofWindowFixtures(w) {
  const W = ROOF.windowFrame, layers = ROOF.layers.concat(W.layer), across = W.width * Math.cos(ROOF.pitch * DEG);
  const l = ROOF_UNDER[(w.y[0] + w.y[1]) / 2 > WIDTH / 2 ? 1 : 0];
  const over = d => [ROOF_DEPTH + d[0], ROOF_DEPTH + d[1]];
  const [x1, x2] = w.x, [y1, y2] = w.y, xi1 = x1 + W.width, xi2 = x2 - W.width;
  const bars = [[x1, xi1, y1, y2], [xi2, x2, y1, y2], [xi1, xi2, y1, y1 + across], [xi1, xi2, y2 - across, y2]];
  const add = (S, material) => FIXTURES.push({ S, element: 'roofWindow', floor: null, material, cap: material, layers, edges: false });
  for (const b of bars) add(slopeSlab(...b, l, over(W.frame)), W.material);
  add(slopeSlab(xi1, xi2, y1 + across, y2 - across, l, over(W.glass)), W.glazing);
}
OPENINGS.forEach(openingFixtures);
ROOF.windows.forEach(roofWindowFixtures);

/* ================= 5b. INNER DOORS =================
   Hidden doors: the leaf flush with the wall on the door's flush side (the hall's), in a frame of two steps over the
   leaf's depth: thin on the half toward which the door opens, thick (the stop) on the other half; the leaf stepped the
   other way, wide where the frame is thin, so no light passes the gap and the leaf swings clear. The rest of the reveal
   is the wall. The frame is a fixture; the leaf and its handles are a door: cells that turn together about the hinge
   (axis, on the leaf's face toward which it opens), by angle when open. */
const DOORS = [];
function doorOf(o, i) {
  const K = OPENING_KIND[o.kind], D = K.door && F.doors[K.door];
  if (!D) return;
  const [x1, x2, y1, y2, h1, h2] = o.b, alongX = x2 - x1 > y2 - y1;       // the wall runs along the opening's longer side
  const [u1, u2] = alongX ? [x1, x2] : [y1, y2], [n1, n2] = alongX ? [y1, y2] : [x1, x2];
  const sign = o.opens[1] === '1' ? 1 : -1, flushSign = o.flush[1] === '1' ? 1 : -1;
  const flush = flushSign > 0 ? n2 : n1, back = flush - flushSign * D.depth, middle = (flush + back) / 2;
  const near = sign === flushSign ? [middle, flush] : [back, middle], far = sign === flushSign ? [back, middle] : [middle, flush];   // n ranges: the half toward the opening, the other
  const face = sign === flushSign ? flush : back;                        // the leaf's face toward which it opens
  /* a box from (u, n) ranges into house axes */
  const box = (ua, ub, na, nb, ha, hb) => prism(alongX ? [ua, ub, Math.min(na, nb), Math.max(na, nb), ha, hb] : [Math.min(na, nb), Math.max(na, nb), ua, ub, ha, hb]);
  const layers = layersOf(o), floor = floorOf((h1 + h2) / 2);
  for (const [[na, nb], J] of [[near, D.frame], [far, D.stop]]) {       // the frame's jambs and head, each half its own width
    addFixture(box(u1, u1 + J, na, nb, h1, h2 - J), D.frameMaterial, layers, 'door', true);
    addFixture(box(u2 - J, u2, na, nb, h1, h2 - J), D.frameMaterial, layers, 'door', true);
    addFixture(box(u1, u2, na, nb, h2 - J, h2), D.frameMaterial, layers, 'door', true);
  }
  /* the leaf: wide on the near half (the thin frame less the gap), narrow on the far half (the stop less the gap) */
  const a = u1 + D.frame + D.gap, b = u2 - D.frame - D.gap;
  const cell = (S, material) => ({ S, element: 'door', floor, material, cap: material, layers: [floor].concat(layers), edges: true, part: 'door' + i });
  const cells = [cell(box(a, b, near[0], near[1], h1 + D.bottom, h2 - D.frame - D.gap), D.material),
    cell(box(u1 + D.stop + D.gap, u2 - D.stop - D.gap, far[0], far[1], h1 + D.bottom, h2 - D.stop - D.gap), D.material)];
  /* a handle on each face, by the free edge */
  const hinge = o.hinge === (alongX ? 'x1' : 'y1') ? b : a, free = hinge === a ? b : a, inward = free > hinge ? -1 : 1;
  const H = D.handle, hu = free + inward * H.inset, hh = h1 + H.height;
  for (const [f, out] of [[face, sign], [face - sign * D.depth, -sign]]) {
    cells.push(cell(box(hu - H.rosette / 2, hu + H.rosette / 2, f, f + out * H.rosetteDepth, hh - H.rosette / 2, hh + H.rosette / 2), H.material));
    cells.push(cell(box(Math.min(hu, hu + inward * H.lever), Math.max(hu, hu + inward * H.lever), f + out * H.offset, f + out * (H.offset + H.width), hh - H.width / 2, hh + H.width / 2), H.material));
  }
  /* the hinge axis on the opening face, and the turn that brings the free edge out toward that face */
  const axis = alongX ? [hinge, face] : [face, hinge], d = free - hinge;
  const angle = D.angle * DEG * (alongX ? Math.sign(d) * sign : -Math.sign(d) * sign);
  DOORS.push({ id: 'door' + i, label: o.label, floor, axis, angle, cells, free: alongX ? [free, face] : [face, free], centre: alongX ? [(a + b) / 2, face] : [face, (a + b) / 2],
    product: o.product || D.product || null, extras: o.extras || D.extras || [] });
}
OPENINGS.forEach(doorOf);

/* ================= 6. STAIR =================
   Floating treads, the landing is a flight of one. */
function stairCells() {
  const ST = STAIR, base = level(FLOORS[0]), rise = (level(TOP_FLOOR) - base) / ST.risers, out = [];
  for (const f of ST.flights) {
    const step = (f.y[1] - f.y[0]) / f.count;
    for (let i = 0; i < f.count; i++) {
      const ya = f.y[0] + i * step, yb = ya + step, h = base + (f.first + i) * rise;
      const S = prism([f.x[0], f.x[1], Math.min(ya, yb), Math.max(ya, yb), h - ST.tread, h]), floor = floorOf(centreH(S));
      out.push({ S, element: 'stair', floor, material: ST.material, cap: ST.material, walkable: ST.walkable, layers: [floor].concat(ST.layers), edges: true });
    }
  }
  return out;
}
const STAIR_CELLS = stairCells();

/* ================= 7. SITE =================
   The lawn and the surfaces on it; the lawn gives way to the building's footprint, the box around its elements. */
function footprintPrism() {
  const b = k => ELEMENTS.map(e => e.b[k]);
  return prism([Math.min(...b(0)), Math.max(...b(1)), Math.min(...b(2)), Math.max(...b(3)), -INF, INF]);
}
function siteCells() {
  const S = SITE, L = S.lawn, out = [], [ox, oy, oh] = HOUSE.offset;   // the site's numbers in the house's axes
  const at = (r, h0, h1) => prism([r[0] - ox, r[1] - ox, r[2] - oy, r[3] - oy, h0 - oh, h1 - oh]);
  const cell = (P, material) => ({ S: P, element: 'site', material, walkable: S.walkable, layers: S.layers.slice(), edges: false });
  let lawn = [at(L.rect, L.h - L.depth, L.h)];
  if (L.aroundBuilding) lawn = subtractAll(lawn, [footprintPrism()]);
  for (const P of lawn) out.push(cell(P, L.material));
  for (const s of S.surfaces) out.push(cell(at(s.rect, L.h, s.h), s.material));
  return out;
}
const SITE_CELLS = siteCells();

const SOLIDS = CELLS.concat(FIXTURES, STAIR_CELLS);    // what a cut caps and what the walk bumps into
const voidsAt = h => VOIDS.flatMap(v => v.boxes).filter(b => b[4] <= h && b[5] >= h);   // the void boxes open at a height

/* ================= 8. ROOMS =================
   Each room of each floor with its floor area in the house's axes. */
const ROOMS = FLOORS.flatMap(F => F.children.filter(n => n.area).map(node => {
  const [x, y] = T.place(node);
  return { id: node.id, node, floor: F, rects: node.area.map(q => [q[0] + x, q[1] + x, q[2] + y, q[3] + y]) };
}));
const ROOM = byId(ROOMS);
/* the floor tiles: one layout for each node that sets them (a floor, a room with its own grid), over the rooms that take
   them from it; a room that sets them to null has none (its own project lays its floor) */
const LAYOUTS = [];
for (const R of ROOMS) {
  const own = T.setting(R.node, 'tiles');
  if (!own || own.value === null || own.from === HOUSE) continue;
  const key = T.path(own.from), get = k => (T.setting(R.node, 'tiles.' + k) || {}).value;
  let L = LAYOUTS.find(l => l.key === key);
  if (!L) {
    const [x, y] = T.place(own.from), o = get('origin'), dir = get('dir');   // the origin in the node's axes: here in the house's, along and across the tiles
    const at = o ? [o[0] + x, o[1] + y] : null;
    LAYOUTS.push(L = { key, node: own.from, floor: R.floor, rooms: [], product: get('product'), dir, pattern: get('pattern'), oa: at && at[dir === 'x' ? 0 : 1], ob: at && at[dir === 'x' ? 1 : 0] });
  }
  L.rooms.push(R);
}
const areaOf = rects => rects.reduce((s, q) => s + rectArea(q), 0) / 1e6;   // m²
const planOf = S => { const ys = S.poly.map(p => p[0]); return [S.x1, S.x2, Math.min(...ys), Math.max(...ys)]; };
const overlap = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1);
/* where two rooms of a floor meet with no wall between them: [{floor, rooms: [a, b], line: [[x, y], [x, y]]}] */
const BORDERS = [];
for (const [i, a] of ROOMS.entries()) for (const b of ROOMS.slice(i + 1)) {
  if (a.floor !== b.floor) continue;
  for (const p of a.rects) for (const q of b.rects) {
    const ys = [Math.max(p[2], q[2]), Math.min(p[3], q[3])], xs = [Math.max(p[0], q[0]), Math.min(p[1], q[1])];
    const add = line => BORDERS.push({ floor: a.floor, rooms: [a.id, b.id], line });
    for (const x of [p[1] === q[0] ? p[1] : null, p[0] === q[1] ? p[0] : null]) if (x !== null && ys[1] - ys[0] > EPS) add([[x, ys[0]], [x, ys[1]]]);
    for (const y of [p[3] === q[2] ? p[3] : null, p[2] === q[3] ? p[2] : null]) if (y !== null && xs[1] - xs[0] > EPS) add([[xs[0], y], [xs[1], y]]);
  }
}
/* the plan as the ☀ compass draws it: the house's length and width, the rooms of the ground floor */
const FOOTPRINT = [[...GEO.body, 0, WIDTH]].concat(ROOMS.filter(r => r.floor === FLOORS[0]).flatMap(r => r.rects));

/* ================= 9. A PART OF THE HOUSE =================
   A room cut out of the house: the house's own solids (of the kinds the part takes, the fixtures, the roof) trimmed to
   the room's box and grouped as a person sees them: each wall one object, the floor one, the ceiling one, each window and
   door with the wall it sits in. Nothing is moved or re-measured. */
const TOL = 1;                             // mm: a solid this close to a face of the room lies beyond it
const PART = GEO.part, OVER = ['slabs', 'roof'];   // the layers that close a room from above
const TAKEN = CELLS.filter(c => PART.kinds.includes(ELEMENT[c.element] && ELEMENT[c.element].kind))
  .concat(PART.fixtures ? FIXTURES.map(c => Object.assign({}, c, { fixture: true })) : [], PART.roof ? ROOF_CELLS : []);
/* a box touches a rect on one of its sides: it stands on the rect's edge */
const touches = (b, rects) => rects.some(r =>
  (overlap(b[2], b[3], r[2], r[3]) > TOL && (Math.abs(b[0] - r[1]) <= TOL || Math.abs(b[1] - r[0]) <= TOL)) ||
  (overlap(b[0], b[1], r[0], r[1]) > TOL && (Math.abs(b[2] - r[3]) <= TOL || Math.abs(b[3] - r[2]) <= TOL)));
const within = (b, w) => b[0] >= w[0] - TOL && b[1] <= w[1] + TOL && b[2] >= w[2] - TOL && b[3] <= w[3] + TOL;
/* the box a room is cut out with: its floor area out to the far faces of the walls standing on its edges; from the
   bottom of the slab it stands on to the top of what closes it from above (the floor's top where nothing does) */
function partBox(R) {
  const L = level(R.floor), top = L + R.floor.size[2], b = [...[0, 1, 2, 3].map(k => (k % 2 ? Math.max : Math.min)(...R.rects.map(q => q[k])))];
  const standing = ELEMENTS.filter(e => PART.kinds.includes(e.kind) && !KIND[e.kind].walkable && e.b[4] < top && e.b[5] > L + TOL);
  for (const e of standing) for (const r of R.rects) {
    const t = KIND[e.kind].thickness || INF;   // a wall reaches back by its thickness at most (not along its length)
    const alongY = overlap(e.b[2], e.b[3], r[2], r[3]) > TOL, alongX = overlap(e.b[0], e.b[1], r[0], r[1]) > TOL;
    if (alongY && Math.abs(e.b[0] - r[1]) <= TOL) b[1] = Math.max(b[1], Math.min(e.b[1], r[1] + t));
    if (alongY && Math.abs(e.b[1] - r[0]) <= TOL) b[0] = Math.min(b[0], Math.max(e.b[0], r[0] - t));
    if (alongX && Math.abs(e.b[2] - r[3]) <= TOL) b[3] = Math.max(b[3], Math.min(e.b[3], r[3] + t));
    if (alongX && Math.abs(e.b[3] - r[2]) <= TOL) b[2] = Math.min(b[2], Math.max(e.b[2], r[2] - t));
  }
  const meets = e => R.rects.some(r => overlap(e.b[0], e.b[1], r[0], r[1]) > TOL && overlap(e.b[2], e.b[3], r[2], r[3]) > TOL);
  const under = ELEMENTS.filter(e => KIND[e.kind].walkable && Math.abs(e.b[5] - L) <= TOL && meets(e)).map(e => e.b[4]);
  const over = ELEMENTS.filter(e => KIND[e.kind].layers.includes('slabs') && e.b[4] >= L + TOL && e.b[4] <= top + TOL && meets(e));
  const open = over.reduce((rest, e) => rest.flatMap(q => rectMinus(q, e.b)), R.rects);
  const closed = !open.some(q => rectArea(q) > TOL * TOL);
  return [...b, under.length ? Math.min(...under) : L, closed ? Math.max(...over.map(e => e.b[5])) : top];
}
/* the side of the room a solid lies on, so a page can hide it while the camera is beyond it: -h under the floor, +h over
   the room, else ±x, ±y beyond the face of the floor area it shares most of */
function sideOf(c, S, rects, L) {
  const [h1, h2] = hRange(S), b = planOf(S);
  if (h2 <= L + TOL) return '-h';
  if (h1 >= L + TOL && c.layers.some(l => OVER.includes(l))) return '+h';
  let best = null;
  for (const r of rects) for (const [side, d, along] of /** @type {[string, number, number][]} */ ([
    ['+x', b[0] - r[1], overlap(b[2], b[3], r[2], r[3])], ['-x', r[0] - b[1], overlap(b[2], b[3], r[2], r[3])],
    ['+y', b[2] - r[3], overlap(b[0], b[1], r[0], r[1])], ['-y', r[2] - b[3], overlap(b[0], b[1], r[0], r[1])]])) {
    if (d < -TOL || along <= TOL) continue;
    if (!best || along > best.along + TOL || (Math.abs(along - best.along) <= TOL && d < best.d)) best = { side, d, along };
  }
  return best ? best.side : null;            // a piece touching the room at a point only: a corner, or nothing of the room's
}
const HOLES = OPENINGS.map(o => ({ id: o.id, b: o.b })).concat(ROOF.windows.map(w => ({ id: w.id, b: [w.x[0], w.x[1], w.y[0], w.y[1]] })));
/* one room cut out: {room, floor, box, cells, objects: [{id, role, side, host, cells, leaf?}], ceiling} */
function part(id) {
  const R = ROOM[id], L = level(R.floor), box = partBox(R), B = prism(box);
  const trimmed = [];
  for (const c of TAKEN) {
    const S = prismIntersect(c.S, B);
    if (S && !emptyPrism(S)) trimmed.push(Object.assign({}, c, { S, side: sideOf(c, S, R.rects, L) }));
  }
  /* a wall is the room's when it stands on the edge of its floor area; a window or a door frame when it sits in such a wall */
  const isFixture = c => !!c.fixture;
  const kept = trimmed.filter(c => c.side && (c.side[1] === 'h' || (isFixture(c)
    ? trimmed.some(w => !isFixture(w) && w.side === c.side && touches(planOf(w.S), R.rects) && within(planOf(c.S), planOf(w.S)))
    : touches(planOf(c.S), R.rects))));
  /* a corner piece of a wall, cut off by a door beside it, touches the room at a point only: it is the room's when a kept
     wall touches it along x and another along y; it faces as the first */
  const walls0 = kept.filter(c => c.side[1] !== 'h' && !isFixture(c));
  const meets = (b, w, k) => { const o = 2 * (1 - k); return overlap(b[o], b[o + 1], w[o], w[o + 1]) > TOL && (Math.abs(b[2 * k] - w[2 * k + 1]) <= TOL || Math.abs(b[2 * k + 1] - w[2 * k]) <= TOL); };
  for (const c of trimmed) {
    if (c.side || isFixture(c)) continue;
    const b = planOf(c.S), byX = walls0.find(w => meets(b, planOf(w.S), 0)), byY = walls0.find(w => meets(b, planOf(w.S), 1));
    if (byX && byY) kept.push(Object.assign(c, { side: byX.side }));
  }
  /* under the floor and over the room: exactly the room's floor area and the walls kept around it */
  const walls = kept.filter(c => c.side[1] !== 'h').map(c => planOf(c.S));
  /* the room's own rects copied: mergeRects joins them in place */
  const footprint = mergeRects(R.rects.map(q => q.slice()).concat(walls).reduce((union, w) => union.concat(union.reduce((rest, u) => rest.flatMap(q => rectMinus(q, u)), [w])), []));
  const cells = kept.flatMap(c => c.side[1] !== 'h' ? [c] : footprint.flatMap(f => {
    const S = prismIntersect(c.S, prism([f[0], f[1], f[2], f[3], -INF, INF]));
    return S && !emptyPrism(S) ? [Object.assign({}, c, { S })] : [];
  }));
  /* objects as a person sees the room */
  const holding = b => HOLES.find(o => within(b, o.b));
  const objects = new Map();
  for (const c of cells) {
    const role = c.side === '-h' ? 'floor' : c.fixture ? (c.element === 'door' ? 'door' : 'window') : c.side === '+h' ? 'ceiling' : 'wall';
    const hosted = role === 'window' || role === 'door', hole = hosted && holding(planOf(c.S));
    const key = role === 'wall' ? c.element : hosted ? (hole ? hole.id : c.element) : role;
    if (!objects.has(key)) objects.set(key, { id: key, role, sides: {}, cells: [] });
    const o = objects.get(key); o.cells.push(c); o.sides[c.side] = (o.sides[c.side] || 0) + 1;
  }
  for (const o of objects.values()) { o.side = Object.entries(o.sides).sort((p, q) => q[1] - p[1])[0][0]; delete o.sides; }
  /* a window or a door belongs to the wall (or ceiling) it sits in: it hides with it */
  const boxOf = o => { const b = o.cells.map(c => planOf(c.S)); return [Math.min(...b.map(q => q[0])), Math.max(...b.map(q => q[1])), Math.min(...b.map(q => q[2])), Math.max(...b.map(q => q[3]))]; };
  for (const w of objects.values()) if (w.role === 'window' || w.role === 'door') {
    const host = [...objects.values()].find(o => (o.role === 'wall' || o.role === 'ceiling') && o.side === w.side && within(boxOf(w), boxOf(o)));
    w.host = host ? host.id : null;
  }
  /* a door's leaf: the house's own door that turns in it */
  for (const d of DOORS) {
    const o = [...objects.values()].find(o => o.role === 'door' && within(planOf(d.cells[0].S), boxOf(o)));
    if (o) o.leaf = d;
  }
  const flat = cells.filter(c => c.side === '+h' && c.layers.includes('slabs')).map(c => hRange(c.S)[0]);
  return { room: R, floor: R.floor, box, cells, objects: [...objects.values()], ceiling: flat.length ? Math.min(...flat) : L + R.floor.size[2] };
}

/* ================= 10. CHECKS =================
   As Test shows them: {name, items}; none is OK. info: a difference to know, not a fault. */
function checks() {
  const THICKNESS_TOL = 0.5, MIN_PATCH = 100, MIN_OVERLAP = 1;   // mm; mm²: a smaller patch is a rounding; mm³: the rounding of exact cuts
  const n = v => Math.round(v);
  const thickness = ELEMENTS.filter(e => KIND[e.kind].thickness).flatMap(e => {
    const d = Math.min(e.b[1] - e.b[0], e.b[3] - e.b[2], e.b[5] - e.b[4]), t = KIND[e.kind].thickness;
    return Math.abs(d - t) > THICKNESS_TOL ? [`${e.id}: ${n(d)} mm, not ${t} mm (${KIND[e.kind].name})`] : [];
  });
  const all = [CELLS, FIXTURES, ROOF_CELLS, STAIR_CELLS, SITE_CELLS].flat();
  const overlapText = ({ a, b, common }) => {
    const [h1, h2] = hRange(common), p = planOf(common).map(n);
    return `${a.element} (${a.material || a.cap}) × ${b.element} (${b.material || b.cap}): ${n(volume(common))} mm³, x ${p[0]}–${p[1]}, y ${p[2]}–${p[3]}, h ${n(h1)}–${n(h2)}`;
  };
  /* what is left of a floor once its rooms, the rest (the stair), the walls standing on it and the voids open at it are taken */
  const floorLeft = F => {
    const L = level(F), standing = ELEMENTS.filter(e => e.b[4] <= L && e.b[5] > L).map(e => e.b);
    const taken = ROOMS.filter(r => r.floor === F).flatMap(r => r.rects).concat(F.other.flatMap(o => o.area), standing, voidsAt(L));
    const left = taken.reduce((rest, b) => rest.flatMap(a => rectMinus(a, b)), F.inside.map(q => q.slice(0, 4)));
    return mergeRects(left).filter(q => rectArea(q) > MIN_PATCH).map(q => `${F.name}: ${(rectArea(q) / 1e6).toFixed(2)} m², x ${n(q[0])}–${n(q[1])}, y ${n(q[2])}–${n(q[3])}`);
  };
  const twice = [];
  for (let i = 0; i < ROOMS.length; i++) for (let j = i + 1; j < ROOMS.length; j++) {
    const a = ROOMS[i], b = ROOMS[j];
    if (a.floor !== b.floor) continue;
    const common = a.rects.flatMap(p => b.rects.map(q => Math.max(0, overlap(p[0], p[1], q[0], q[1])) * Math.max(0, overlap(p[2], p[3], q[2], q[3])))).reduce((s, v) => s + v, 0);
    if (common > MIN_PATCH) twice.push(`${a.id} × ${b.id}: ${(common / 1e6).toFixed(2)} m²`);
  }
  const ids = ELEMENTS.concat(OPENINGS, ROOF.windows, VOIDS).map(o => o.id);
  return [
    { name: 'Every element, opening, roof window and void has its own id', about: 'The parts of the house are found by their ids (a room\'s walls, an opening\'s host, what an element cuts out); two with one id would be mixed up.', items: ids.filter((id, i) => !id || ids.indexOf(id) !== i).map(id => id || '(no id)') },
    { name: 'Thickness by kind', about: 'An element of a kind with a thickness (block 240, EPS 200, …) is that thick across its wall.', items: thickness },
    { name: `Solids do not overlap (${all.length} solids)`, about: 'No two solids of the house share volume (the site, frames and glass included): a wall, a slab and the insulation meet face to face.', items: overlaps(all, MIN_OVERLAP).map(overlapText) },
    { name: 'Floor without a room', about: 'Every part of a floor inside the outer walls belongs to a room, the stair or a wall: no floor area is left without one.', items: FLOORS.flatMap(floorLeft) },
    { name: 'Rooms do not overlap', about: 'No two rooms share floor area.', items: twice },
    { name: 'Room areas against archon (m²)', about: 'To know: each room\'s area in the model (at the block faces) beside archon\'s (after plaster), as a reference.', info: true,
      items: ROOMS.filter(r => r.node.archonArea).map(r => `${r.id}: ${areaOf(r.rects).toFixed(2)} · archon ${r.node.archonArea.toFixed(2)}`) }];
}

return { T, HOUSE, SITE, ROOF, TAN, WIDTH, RIDGE_TOP, ROOF_UNDER, line, floorOf, SIDE, OPENINGS, ELEMENTS, STAIR, FLOORS, ROOMS, ROOM, LAYOUTS, BORDERS, areaOf,
  CELLS, FIXTURES, DOORS, ROOF_CELLS, STAIR_CELLS, SITE_CELLS, SOLIDS, voidsAt, FOOTPRINT, part, checks };
}

/* the top-left menu of every page of the house: the house, its floors and in each its rooms (the nodes with an area, as
   build() finds them); part: the ids of the rooms the page shows (none: the whole house) */
function nav(ROOT, part = []) {
  const HOUSE = ROOT.children.find(n => n.type === 'house'), page = '../house/index.html';
  const floors = HOUSE.children.filter(n => n.type === 'floor'), rooms = F => F.children.filter(n => n.area);
  return { links: [{ name: 'House', href: page, on: !part.length }],
    groups: floors.map(F => ({ name: F.name, on: part.length > 0 && part.every(id => rooms(F).some(r => r.id === id)),
      items: rooms(F).map(r => ({ name: `${r.number}. ${r.name}`, href: page + '?room=' + r.id, on: part.length === 1 && part[0] === r.id })) })) };
}

HOME.model = { build, nav };
})(window.HOME = window.HOME || {});
