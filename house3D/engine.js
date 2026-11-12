/* engine.js: house.js turned into solids (code, no data: it runs on house.js every time). No THREE, no DOM:
   view.html draws these solids, test.html checks them.
   Units are cm in house axes (x along, y across, z up). Needs core/geometry.js. */
(function (root) {
'use strict';

function buildHouse(HOUSE) {
const { DEG, INF, EPS, ccw, rect2, clipHalf, leftOf, edgesOf, minus2, prism, emptyPrism, centreZ,
  prismIntersect, prismMinus, splitZ, subtractAll, SOLID_TOL } = root.CORE.geometry;
const GEO = HOUSE.geometry, KIND = GEO.kinds, OPENING_KIND = GEO.openingKinds;
const FLOORS = GEO.floors, TOP_FLOOR = FLOORS[FLOORS.length - 1];
const byId = list => Object.fromEntries(list.map(e => [e.id, e]));

/* ================= 1. ROOF LINES =================
   A line across the house is z = a + s·y; the roof gives the slope. */
const ROOF = GEO.roof, TAN = Math.tan(ROOF.pitch * DEG), WIDTH = ROOF.width;
const ROOF_DEPTH = ROOF.thickness / Math.cos(ROOF.pitch * DEG);   // the data gives it across the slope, the prisms vertically
const RIDGE_TOP = ROOF.eave + TAN * WIDTH / 2 + ROOF_DEPTH;
const line = l => ({ a: l.z - l.pitch * TAN * l.y, s: l.pitch * TAN });
const ROOF_UNDER = [{ a: ROOF.eave, s: TAN }, { a: ROOF.eave + TAN * WIDTH, s: -TAN }];

/* ================= 2. MODEL: CELLS =================
   A cell is a prism with what it is: {S, element, floor, material, cap, layers, raw?, finish?, walkable?, edges}. */

const floorOfZ = z => z < GEO.split ? FLOORS[0].id : TOP_FLOOR.id;

const ELEMENT = byId(GEO.elements), VOID = byId(GEO.voids);
const elementPrism = e => prism(e.b, (e.below || []).map(line).concat(e.top === 'roof' ? ROOF_UNDER : []));
const openingPrism = o => prism(o.b, (o.below || []).map(line));
const cutPrisms = id => ELEMENT[id] ? [elementPrism(ELEMENT[id])] : VOID[id].boxes.map(b => prism(b));
const range = r => r || [-INF, INF];
const regionPrism = r => prism([...range(r.x), ...range(r.y), ...range(r.z)], (r.below || []).map(line));

const CELLS = [];                          // the solids of the building
const FIXTURES = [];                       // frames, glass, leaves: drawn, never cut by anything
const ROOF_CELLS = [], STAIR_CELLS = [], SITE_CELLS = [];

/* elements: cuts, openings, the floor split, the facade */
const OPENING_PRISMS = GEO.openings.map(openingPrism);
for (const e of GEO.elements) {
  const k = KIND[e.kind];
  let parts = subtractAll([elementPrism(e)], (e.cuts || []).flatMap(cutPrisms));
  if (k.opened) parts = subtractAll(parts, OPENING_PRISMS);
  parts = parts.flatMap(S => splitZ(S, GEO.split));
  let tagged = parts.map(S => ({ S, material: k.material }));
  for (const r of GEO.finishes) {          // a later rule wins
    const applies = r.elements ? r.elements.includes(e.id) : !!k.finish && (!r.side || r.side === e.outer);
    if (!applies) continue;
    const R = regionPrism(r);
    tagged = tagged.flatMap(t => {
      const inside = prismIntersect(t.S, R);
      return inside ? [{ S: inside, material: r.material }].concat(prismMinus(t.S, R).map(S => ({ S, material: t.material }))) : [t];
    });
  }
  for (const t of tagged) {
    const floor = floorOfZ(centreZ(t.S));
    CELLS.push({ S: t.S, element: e.id, floor, material: t.material, cap: k.cap, raw: k.raw, finish: k.finish,
      walkable: !!k.walkable, layers: [floor].concat(k.layers), edges: true });
  }
}

/* the roof: two slopes, without its cuts and the roof windows; its faces take the material of their side */
(function () {
  const ROOF_FACE = n => n[2] > 0.3 ? 'top' : n[2] < -0.3 ? 'bottom' : Math.abs(n[0]) > 0.5 ? 'ends' : 'eaves';
  const faceMaterial = n => ROOF.faces[ROOF_FACE(n)];
  const half = (y1, y2, l) => ({ x1: ROOF.x[0], x2: ROOF.x[1], poly: ccw([[y1, l.a + l.s * y1], [y2, l.a + l.s * y2], [y2, l.a + l.s * y2 + ROOF_DEPTH], [y1, l.a + l.s * y1 + ROOF_DEPTH]]) });
  let cells = [half(0, WIDTH / 2, ROOF_UNDER[0]), half(WIDTH / 2, WIDTH, ROOF_UNDER[1])];
  cells = subtractAll(cells, ROOF.cuts.flatMap(cutPrisms));
  cells = subtractAll(cells, ROOF.windows.map(w => prism([w.x[0], w.x[1], w.y[0], w.y[1], -INF, INF])));
  for (const S of cells) ROOF_CELLS.push({ S, element: 'roof', floor: null, faceMaterial, cap: ROOF.cap, layers: ROOF.layers.slice(), edges: true });
})();

/* windows and doors sit in the block that hosts them, flush with its outer face */
const SIDE = { '-x': { axis: 0, sign: -1 }, '+x': { axis: 0, sign: 1 }, '-y': { axis: 1, sign: -1 }, '+y': { axis: 1, sign: 1 }, '-z': { axis: 2, sign: -1 } };
(function () {
  const F = GEO.frames;
  const add = (S, material, layers) => { if (!emptyPrism(S)) FIXTURES.push({ S, element: 'opening', floor: floorOfZ(centreZ(S)), material, cap: material, layers: [floorOfZ(centreZ(S))].concat(layers), edges: false }); };
  for (const o of GEO.openings) {
    const K = OPENING_KIND[o.kind];
    if (!K.glazed && !K.leaf) continue;   // an inner door is an opening only
    const side = SIDE[o.outer], host = GEO.elements.find(e => KIND[e.kind].host && prismIntersect(elementPrism(e), openingPrism(o)));
    const face = host.b[2 * side.axis + (side.sign > 0 ? 1 : 0)];
    const depth = (d1, d2) => [face - side.sign * d1, face - side.sign * d2].sort((a, b) => a - b);
    /* a part of the opening is a polygon in its own plane: (y, z) in an x-facing wall, (x, z) in a y-facing one;
       a y-facing piece is a rectangle in x, so it is a prism along x as well */
    const toPrism = (P, d) => {
      if (side.axis === 0) return { x1: d[0], x2: d[1], poly: P };
      const us = P.map(p => p[0]), zs = P.map(p => p[1]);
      return prism([Math.min(...us), Math.max(...us), d[0], d[1], Math.min(...zs), Math.max(...zs)]);
    };
    const O = openingPrism(o);
    const outline = side.axis === 0 ? O.poly : rect2(o.b[0], o.b[1], o.b[4], o.b[5]);
    const [u1, u2] = side.axis === 0 ? [o.b[2], o.b[3]] : [o.b[0], o.b[1]];
    const strip = (a, b) => clipHalf(clipHalf(outline, p => p[0] - a), p => b - p[0]);
    const leafEnd = K.leaf ? u1 + (o.leaf || u2 - u1) : u1;
    if (K.leaf) {                            // a solid leaf with evenly spaced grooves, and a handle if it has one
      const D = F.leaves[K.leaf], P = strip(u1, leafEnd);
      add(toPrism(P, depth(...D.depth)), D.material, F.layers);
      for (let i = 1; i <= D.grooves; i++) {
        const z = o.b[4] + (o.b[5] - o.b[4]) * i / (D.grooves + 1);
        add(toPrism(clipHalf(clipHalf(P, p => p[1] - z + D.grooveHeight / 2), p => z + D.grooveHeight / 2 - p[1]), depth(...D.grooveDepth)), D.groove, F.layers);
      }
      if (D.handle) {
        const H = D.handle, u = leafEnd - H.inset, z = o.b[4] + H.centre;
        add(toPrism(rect2(u - H.width / 2, u + H.width / 2, z - H.length / 2, z + H.length / 2), depth(...H.depth)), H.material, F.layers);
      }
    }
    if (K.glazed && leafEnd < u2) {          // frame, bars and glass; the frame inset follows every edge, the sill only if it has one
      const P = strip(leafEnd, u2), bottom = Math.min(...P.map(p => p[1]));
      let inner = P;
      for (const [a, b] of edgesOf(P)) {
        const sill = Math.abs(a[1] - bottom) < EPS && Math.abs(b[1] - bottom) < EPS;
        if (sill && !K.glazed.sill) continue;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), shift = F.width * L;
        inner = clipHalf(inner, p => leftOf(a, b)(p) - shift);
      }
      for (const piece of minus2(P, inner, SOLID_TOL)) add(toPrism(piece, depth(0, F.depth)), F.material, F.layers);
      const band = (k, c) => clipHalf(clipHalf(inner, p => p[k] - c + F.bar / 2), p => c + F.bar / 2 - p[k]);   // a bar of the frame through c
      const [i1, i2] = [Math.min(...inner.map(p => p[0])), Math.max(...inner.map(p => p[0]))], cols = o.cols || 1;
      for (let i = 1; i < cols; i++) add(toPrism(band(0, i1 + (i2 - i1) * i / cols), depth(0, F.depth)), F.material, F.layers);
      for (const z of o.transoms || []) add(toPrism(band(1, z), depth(0, F.depth)), F.material, F.layers);
      add(toPrism(inner, depth((F.depth - F.glassDepth) / 2, (F.depth + F.glassDepth) / 2)), F.glass, F.layers);
    }
  }
  /* roof windows lie in the slope: four bars and the glass between lines parallel to it */
  const W = ROOF.windowFrame, layers = ROOF.layers.concat(F.layers), across = W.width * Math.cos(ROOF.pitch * DEG);
  for (const w of ROOF.windows) {
    const l = ROOF_UNDER[(w.y[0] + w.y[1]) / 2 > WIDTH / 2 ? 1 : 0];
    const slab = (x1, x2, y1, y2, d) => ({ x1, x2, poly: ccw([[y1, l.a + l.s * y1 + ROOF_DEPTH + d[0]], [y2, l.a + l.s * y2 + ROOF_DEPTH + d[0]], [y2, l.a + l.s * y2 + ROOF_DEPTH + d[1]], [y1, l.a + l.s * y1 + ROOF_DEPTH + d[1]]]) });
    const [x1, x2] = w.x, [y1, y2] = w.y, xi1 = x1 + W.width, xi2 = x2 - W.width;
    const bars = [[x1, xi1, y1, y2], [xi2, x2, y1, y2], [xi1, xi2, y1, y1 + across], [xi1, xi2, y2 - across, y2]];
    for (const b of bars) FIXTURES.push({ S: slab(...b, W.frame), element: 'roofWindow', floor: null, material: W.material, cap: W.material, layers, edges: false });
    FIXTURES.push({ S: slab(xi1, xi2, y1 + across, y2 - across, W.glass), element: 'roofWindow', floor: null, material: W.glazing, cap: W.glazing, layers, edges: false });
  }
})();

/* the stair: floating treads, the landing is a flight of one */
(function () {
  const ST = GEO.stair, rise = TOP_FLOOR.level / ST.risers;
  for (const f of ST.flights) {
    const step = (f.y[1] - f.y[0]) / f.count;
    for (let i = 0; i < f.count; i++) {
      const ya = f.y[0] + i * step, yb = ya + step, z = (f.first + i) * rise;
      const S = prism([f.x[0], f.x[1], Math.min(ya, yb), Math.max(ya, yb), z - ST.tread, z]), floor = floorOfZ(centreZ(S));
      STAIR_CELLS.push({ S, element: 'stair', floor, material: ST.material, cap: ST.material, walkable: ST.walkable, layers: [floor].concat(ST.layers), edges: true });
    }
  }
})();

/* the site: the lawn and the surfaces on it */
(function () {
  const L = GEO.site.lawn, add = (r, z1, z2, material) => SITE_CELLS.push({ S: prism([r[0], r[1], r[2], r[3], z1, z2]), element: 'site', material, walkable: GEO.site.walkable, layers: GEO.site.layers.slice(), edges: false });
  add(L.rect, L.z - L.depth, L.z, L.material);
  for (const s of GEO.site.surfaces) add(s.rect, L.z, s.z, s.material);
})();

const SOLIDS = CELLS.concat(FIXTURES, STAIR_CELLS);    // what a cut caps and what the walk bumps into

return { ROOF, TAN, WIDTH, ROOF_DEPTH, RIDGE_TOP, ROOF_UNDER, line, floorOfZ, SIDE,
  CELLS, FIXTURES, ROOF_CELLS, STAIR_CELLS, SITE_CELLS, SOLIDS };
}

root.HouseEngine = { build: buildHouse };
})(typeof window !== 'undefined' ? window : globalThis);
