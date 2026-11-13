/* engine.js: house.js turned into solids (code, no data: it runs on house.js every time). No THREE, no DOM:
   view.html draws these solids, analysis.js checks them.
   Units are mm in house axes (x along, y across, z up). Needs core/geometry.js. */
(function (root) {
'use strict';

const G = root.CORE.geometry;
const { DEG, INF, EPS, SOLID_TOL, ccw, rect2, clipHalf, leftOf, edgesOf, minus2, prism, emptyPrism, centreZ,
  prismIntersect, prismMinus, splitZ, subtractAll } = G;

const byId = list => Object.fromEntries(list.map(e => [e.id, e]));
const range = r => r || [-INF, INF];

/* convex polygons A minus every polygon of B, in turn: convex pieces */
const polysMinus = (A, B) => B.reduce((pieces, b) => pieces.flatMap(p => G.intersect2(p, b, SOLID_TOL) ? minus2(p, b, SOLID_TOL) : [p]), A);
/* the part of polygon P between u = a and u = b (u its first coordinate) */
const stripOf = (P, a, b) => clipHalf(clipHalf(P, p => p[0] - a), p => b - p[0]);
/* the part of polygon P between v = c - w/2 and v = c + w/2 along coordinate k: a bar through c */
const bandOf = (P, k, c, w) => clipHalf(clipHalf(P, p => p[k] - c + w / 2), p => c + w / 2 - p[k]);

/* the outward side of an opening: which axis its wall faces along, and which way */
const SIDE = { '-x': { axis: 0, sign: -1 }, '+x': { axis: 0, sign: 1 }, '-y': { axis: 1, sign: -1 }, '+y': { axis: 1, sign: 1 }, '-z': { axis: 2, sign: -1 } };

function buildHouse(HOUSE) {
const GEO = HOUSE.geometry, KIND = GEO.kinds, OPENING_KIND = GEO.openingKinds;
const FLOORS = GEO.floors, TOP_FLOOR = FLOORS[FLOORS.length - 1];
const ELEMENT = byId(GEO.elements), VOID = byId(GEO.voids);

/* ================= 1. ROOF LINES =================
   A line across the house is z = a + s·y; the roof gives the slope. */
const ROOF = GEO.roof, TAN = Math.tan(ROOF.pitch * DEG), WIDTH = ROOF.width;
const ROOF_DEPTH = ROOF.thickness / Math.cos(ROOF.pitch * DEG);   // the data gives it across the slope, the prisms vertically
const RIDGE_TOP = ROOF.eave + TAN * WIDTH / 2 + ROOF_DEPTH;
const line = l => ({ a: l.z - l.pitch * TAN * l.y, s: l.pitch * TAN });
const ROOF_UNDER = [{ a: ROOF.eave, s: TAN }, { a: ROOF.eave + TAN * WIDTH, s: -TAN }];
const floorOfZ = z => z < GEO.split ? FLOORS[0].id : TOP_FLOOR.id;
/* a slab of the roof between y1 and y2 along line l, from d[0] to d[1] over its top */
const slopeSlab = (x1, x2, y1, y2, l, d) => ({ x1, x2, poly: ccw([
  [y1, l.a + l.s * y1 + d[0]], [y2, l.a + l.s * y2 + d[0]], [y2, l.a + l.s * y2 + d[1]], [y1, l.a + l.s * y1 + d[1]]]) });

/* ================= 2. PRISMS OF THE DATA ================= */
const elementPrism = e => prism(e.b, (e.below || []).map(line).concat(e.top === 'roof' ? ROOF_UNDER : []));
const openingPrism = o => prism(o.b, (o.below || []).map(line));
const cutPrisms = id => ELEMENT[id] ? [elementPrism(ELEMENT[id])] : VOID[id].boxes.map(b => prism(b));
const regionPrism = r => prism([...range(r.x), ...range(r.y), ...range(r.z)], (r.below || []).map(line));
const OPENING_PRISMS = GEO.openings.map(openingPrism);

/* ================= 3. ELEMENTS =================
   A cell is a prism with what it is: {S, element, floor, material, cap, layers, raw?, finish?, walkable?, edges}. */
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
  parts = parts.flatMap(S => splitZ(S, GEO.split)).map(S => ({ S, material: k.material }));
  parts = finishesOf(e).reduce(applyFinish, parts);
  return parts.map(t => {
    const floor = floorOfZ(centreZ(t.S));
    return { S: t.S, element: e.id, floor, material: t.material, cap: k.cap, raw: k.raw, finish: k.finish,
      walkable: !!k.walkable, layers: [floor].concat(k.layers), edges: true };
  });
}
for (const e of GEO.elements) CELLS.push(...elementCells(e));

/* ================= 4. ROOF =================
   Two slopes, without its cuts and the roof windows; its faces take the material of their side. */
const roofFace = n => n[2] > 0.3 ? 'top' : n[2] < -0.3 ? 'bottom' : Math.abs(n[0]) > 0.5 ? 'ends' : 'eaves';
const roofFaceMaterial = n => ROOF.faces[roofFace(n)];
const roofWindowPrism = w => prism([w.x[0], w.x[1], w.y[0], w.y[1], -INF, INF]);
function roofCells() {
  const slopes = [slopeSlab(...ROOF.x, 0, WIDTH / 2, ROOF_UNDER[0], [0, ROOF_DEPTH]), slopeSlab(...ROOF.x, WIDTH / 2, WIDTH, ROOF_UNDER[1], [0, ROOF_DEPTH])];
  const cells = subtractAll(slopes, ROOF.cuts.flatMap(cutPrisms).concat(ROOF.windows.map(roofWindowPrism)));
  return cells.map(S => ({ S, element: 'roof', floor: null, faceMaterial: roofFaceMaterial, cap: ROOF.cap, layers: ROOF.layers.slice(), edges: true }));
}
const ROOF_CELLS = roofCells();

/* ================= 5. WINDOWS AND DOORS =================
   They sit in the block that hosts them, flush with its outer face. A part of an opening is a polygon in its own
   plane: (y, z) in an x-facing wall, (x, z) in a y-facing one. */
const FIXTURES = [];                       // frames, glass, leaves: drawn, never cut by anything
const F = GEO.frames;
function addFixture(S, material, layers, element = 'opening') {
  if (emptyPrism(S)) return;
  const floor = floorOfZ(centreZ(S));
  FIXTURES.push({ S, element, floor, material, cap: material, layers: [floor].concat(layers), edges: false });
}
/* the plane of an opening: its outline, its span along the wall and how a polygon of it becomes a prism */
function openingPlane(o) {
  const side = SIDE[o.outer];
  const host = GEO.elements.find(e => KIND[e.kind].host && prismIntersect(elementPrism(e), openingPrism(o)));
  const face = host.b[2 * side.axis + (side.sign > 0 ? 1 : 0)];
  const depth = (d1, d2) => [face - side.sign * d1, face - side.sign * d2].sort((a, b) => a - b);
  const alongX = side.axis === 0;
  /* a y-facing piece is a rectangle in x, so it is a prism along x as well */
  const toPrism = (P, d) => {
    const [a, b] = depth(...d);
    if (alongX) return { x1: a, x2: b, poly: P };
    const us = P.map(p => p[0]), zs = P.map(p => p[1]);
    return prism([Math.min(...us), Math.max(...us), a, b, Math.min(...zs), Math.max(...zs)]);
  };
  const outline = alongX ? openingPrism(o).poly : rect2(o.b[0], o.b[1], o.b[4], o.b[5]);
  const span = alongX ? [o.b[2], o.b[3]] : [o.b[0], o.b[1]];
  return { toPrism, outline, span };
}
/* a solid leaf with evenly spaced grooves, and a handle if it has one; the grooves stop at the handle */
function leafFixtures(o, plane, P) {
  const D = F.leaves[OPENING_KIND[o.kind].leaf], [z1, z2] = [o.b[4], o.b[5]];
  addFixture(plane.toPrism(P, D.depth), D.material, F.layers);
  const handle = D.handle && handlePolygon(D.handle, Math.max(...P.map(p => p[0])), z1);
  if (handle) addFixture(plane.toPrism(handle, D.handle.depth), D.handle.material, F.layers);
  for (let i = 1; i <= D.grooves; i++) {
    const groove = bandOf(P, 1, z1 + (z2 - z1) * i / (D.grooves + 1), D.grooveHeight);
    for (const piece of polysMinus([groove], handle ? [handle] : [])) addFixture(plane.toPrism(piece, D.grooveDepth), D.groove, F.layers);
  }
}
const handlePolygon = (H, leafEnd, bottom) => {
  const u = leafEnd - H.inset, z = bottom + H.centre;
  return rect2(u - H.width / 2, u + H.width / 2, z - H.length / 2, z + H.length / 2);
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
  const transoms = (o.transoms || []).flatMap(z => polysMinus([bandOf(inner, 1, z, F.bar)], mullions));
  return mullions.concat(transoms);
}
/* frame, bars and glass; the panes are the glass between the bars */
function glazedFixtures(o, plane, P) {
  const inner = frameInner(P, OPENING_KIND[o.kind].glazed.sill), bars = frameBars(o, inner);
  const frameDepth = [0, F.depth], glassDepth = [(F.depth - F.glassDepth) / 2, (F.depth + F.glassDepth) / 2];
  for (const piece of minus2(P, inner, SOLID_TOL).concat(bars)) addFixture(plane.toPrism(piece, frameDepth), F.material, F.layers);
  for (const pane of polysMinus([inner], bars)) addFixture(plane.toPrism(pane, glassDepth), F.glass, F.layers);
}
function openingFixtures(o) {
  const K = OPENING_KIND[o.kind];
  if (!K.glazed && !K.leaf) return;        // an inner door is an opening only
  const plane = openingPlane(o), [u1, u2] = plane.span;
  const leafEnd = K.leaf ? u1 + (o.leaf || u2 - u1) : u1;
  if (K.leaf) leafFixtures(o, plane, stripOf(plane.outline, u1, leafEnd));
  if (K.glazed && leafEnd < u2) glazedFixtures(o, plane, stripOf(plane.outline, leafEnd, u2));
}
/* roof windows lie in the slope: four bars and the glass between lines parallel to it */
function roofWindowFixtures(w) {
  const W = ROOF.windowFrame, layers = ROOF.layers.concat(F.layers), across = W.width * Math.cos(ROOF.pitch * DEG);
  const l = ROOF_UNDER[(w.y[0] + w.y[1]) / 2 > WIDTH / 2 ? 1 : 0];
  const over = d => [ROOF_DEPTH + d[0], ROOF_DEPTH + d[1]];
  const [x1, x2] = w.x, [y1, y2] = w.y, xi1 = x1 + W.width, xi2 = x2 - W.width;
  const bars = [[x1, xi1, y1, y2], [xi2, x2, y1, y2], [xi1, xi2, y1, y1 + across], [xi1, xi2, y2 - across, y2]];
  const add = (S, material) => FIXTURES.push({ S, element: 'roofWindow', floor: null, material, cap: material, layers, edges: false });
  for (const b of bars) add(slopeSlab(...b, l, over(W.frame)), W.material);
  add(slopeSlab(xi1, xi2, y1 + across, y2 - across, l, over(W.glass)), W.glazing);
}
GEO.openings.forEach(openingFixtures);
ROOF.windows.forEach(roofWindowFixtures);

/* ================= 6. STAIR =================
   Floating treads, the landing is a flight of one. */
function stairCells() {
  const ST = GEO.stair, rise = TOP_FLOOR.level / ST.risers, out = [];
  for (const f of ST.flights) {
    const step = (f.y[1] - f.y[0]) / f.count;
    for (let i = 0; i < f.count; i++) {
      const ya = f.y[0] + i * step, yb = ya + step, z = (f.first + i) * rise;
      const S = prism([f.x[0], f.x[1], Math.min(ya, yb), Math.max(ya, yb), z - ST.tread, z]), floor = floorOfZ(centreZ(S));
      out.push({ S, element: 'stair', floor, material: ST.material, cap: ST.material, walkable: ST.walkable, layers: [floor].concat(ST.layers), edges: true });
    }
  }
  return out;
}
const STAIR_CELLS = stairCells();

/* ================= 7. SITE =================
   The lawn and the surfaces on it; the lawn gives way to the building's footprint, the box around its elements. */
function footprintPrism() {
  const b = k => GEO.elements.map(e => e.b[k]);
  return prism([Math.min(...b(0)), Math.max(...b(1)), Math.min(...b(2)), Math.max(...b(3)), -INF, INF]);
}
function siteCells() {
  const S = GEO.site, L = S.lawn, out = [];
  const cell = (P, material) => ({ S: P, element: 'site', material, walkable: S.walkable, layers: S.layers.slice(), edges: false });
  let lawn = [prism([...L.rect, L.z - L.depth, L.z])];
  if (L.aroundBuilding) lawn = subtractAll(lawn, [footprintPrism()]);
  for (const P of lawn) out.push(cell(P, L.material));
  for (const s of S.surfaces) out.push(cell(prism([...s.rect, L.z, s.z]), s.material));
  return out;
}
const SITE_CELLS = siteCells();

const SOLIDS = CELLS.concat(FIXTURES, STAIR_CELLS);    // what a cut caps and what the walk bumps into
const voidsAt = level => GEO.voids.flatMap(v => v.boxes).filter(b => b[4] <= level && b[5] >= level);   // the void boxes open at a level
/* the plan as the ☀ compass of every application draws it: the house's length and width, the rooms of the ground floor */
const FOOTPRINT = [[0, GEO.length, 0, WIDTH]].concat(GEO.floors[0].rooms.flatMap(r => r.rects));

return { ROOF, TAN, WIDTH, ROOF_DEPTH, RIDGE_TOP, ROOF_UNDER, line, floorOfZ, SIDE,
  CELLS, FIXTURES, ROOF_CELLS, STAIR_CELLS, SITE_CELLS, SOLIDS, voidsAt, FOOTPRINT };
}

root.HouseEngine = { build: buildHouse };
})(typeof window !== 'undefined' ? window : globalThis);
