// @ts-check
/* room/model.js: a room's model, from what the page hands it: the room from the house (its node: origin, size, floor area,
   openings, ceiling), the room's files (cabinets, scene) and the library. No browser: the cabinets' model (room/cabinets.js),
   the places of the groups and the fixtures, the hardware as drawn, the tree, the looks and textures the room needs, its
   tiles laid and counted; the checks of its tree. In the house's axes (x, y, h; mm). room/parts.js draws it. */
/**
 * @typedef {object} SceneFile  a room's scene (room/project.md: format scene)
 * @property {Object<string, { front: Side, offset: number[], size: number[] }>} groups  group number -> its box in the room
 * @property {Object<string, { product: string, front: Side, offset: number[], depth?: number, length?: number, height?: number, layer?: string }>} [fixtures]
 * @property {{ name: string, box: Box, cuts?: Box[], material: string, tiled?: boolean }[]} [builtIns]
 * @property {{ wallColor: string }} room
 * @property {{ metal: string }} finish
 * @property {{ sink?: { tapFromBack: number, trapTop: number, wallOutlet: number }, hood?: { bottom: number } }} [installation]
 * @property {Object<string, any>} hardware  our layout of the hardware: handle, open, leg, bins, plinthGrille
 * @property {{ pendantBottom?: number, pendants?: { group: number, count: number, spacing: number }, downlights: { at?: number[], group?: number, y?: number, x?: number, between?: string[] }[] }} [lights]  a downlight at [x, y] in the room's axes, or in a group's (y from its wall)
 * @property {{ walls?: object, floor?: object, shower?: { zone: Rect, walls?: object, floor?: object } }} [tiles]
 * @property {Camera[]} [cameras]
 */
/** @typedef {{ offset: number[], size: number[], area?: Rect[], ceiling?: Line[], openings?: Box[], tiles: { top: number, depth: number } }} RoomInHouse
    what the house gives a room, in the room's axes: ceiling: lines h ≤ a + s·y; tiles: the house's (a floor's face over the floor, a slab's depth with its glue) */
/** @typedef {ReturnType<ReturnType<typeof roomModelModule>['prepare']>} PreparedRoom */
/** @param {ReturnType<typeof coreGeometryModule>} geometry @param {ReturnType<typeof coreTreeModule>} tree
    @param {ReturnType<typeof roomTilesModule>} tiles @param {ReturnType<typeof roomCabinetsModule>} cabinets @param {ReturnType<typeof roomFurnitureModule>} furniture */
function roomModelModule(geometry, tree, tiles, cabinets, furniture) {
'use strict';
const C = cabinets, G = geometry;


/* the way a group faces: X, the house's direction of the group's x (left to right seen from the front), Y of its y (out of
   the fronts); a quarter turn and a mirror (the group's x, y, h are left-handed), so what is drawn comes out as built.
   W: which corner of its box in the room lies on its wall line at x = 0 */
const FRONTS = {
  N: { Y: [0, -1], X: [1, 0], W: [0, 1] },
  S: { Y: [0, 1], X: [-1, 0], W: [1, 0] },
  E: { Y: [-1, 0], X: [0, -1], W: [1, 1] },
  W: { Y: [1, 0], X: [0, 1], W: [0, 0] }
};
const facesAlongX = front => front === 'E' || front === 'W';   // its fronts face along the house's x: its width along y

/** the room without a browser: the model, the places of its groups, the hardware as drawn, its looks and textures
    @param {RoomInHouse} room @param {{ cabinets: CabinetsFile, scene: SceneFile }} files @param {Library} library  library/catalog.js */
function prepare(room, files, library) {
  const P = library.groups, cabinets = files.cabinets, scene = files.scene;
  if (!scene.finish || !scene.finish.metal) throw new Error('scene: no finish.metal');
  const project = C.withLibrary(cabinets, P.boards), appliances = C.appliances(project, Object.assign({}, P.appliances, P.sanitary));   // a basin and its tap are the sanitary group's
  const model = C.build(project, appliances), O = room.offset;
  /* a group: its box in the room (scene) with its back on the wall line; y = 0 at the carcass backs, the wall at y = wall */
  const PLACE = /** @type {Object<string, { O: number[], X: number[], Y: number[], box: number[] }>} */ ({});
  for (const [r, g] of Object.entries(scene.groups)) {
    const F = FRONTS[g.front], wall = model.groups[r] ? model.groups[r].wall : 0;
    const x = O[0] + g.offset[0] + F.W[0] * g.size[0], y = O[1] + g.offset[1] + F.W[1] * g.size[1];
    PLACE[r] = { O: [x - wall * F.Y[0], y - wall * F.Y[1]], X: F.X, Y: F.Y, box: [0, 1, 2].flatMap(k => [O[k] + g.offset[k], O[k] + g.offset[k] + g.size[k]]) };
  }
  /* the room's own frame (its x, y, h from its zero), and each fixture's: a product of the library standing at a wall of the
     room (front: the side it faces), its box from its offset and the product's body (width along the wall, depth out of it) */
  PLACE.room = { O: [O[0], O[1]], X: [1, 0], Y: [0, 1], box: [O[0], O[0] + room.size[0], O[1], O[1] + room.size[1], O[2], O[2] + room.size[2]] };
  const productOf = key => (library.group(key) ? library.product(key) : undefined);
  const FIXTURES = Object.entries(scene.fixtures || {}).map(([id, f]) => {
    const A = productOf(f.product), F = FRONTS[f.front];
    if (!A) throw new Error(`scene: fixture ${id}: no product ${f.product} in the library`);
    /* depth: what it reaches out of its wall, if more than its body (a flush plate on a casing); length, height: a pipe's, as it runs here */
    const b = Object.assign({}, A.body, f.depth ? { depth: f.depth } : {}, f.length ? { width: f.length } : {}, f.height ? { height: f.height } : {});
    const size = facesAlongX(f.front) ? [b.depth, b.width, b.height] : [b.width, b.depth, b.height];
    const x = O[0] + f.offset[0] + F.W[0] * size[0], y = O[1] + f.offset[1] + F.W[1] * size[1];
    PLACE[id] = { O: [x, y], X: F.X, Y: F.Y, box: [0, 1, 2].flatMap(k => [O[k] + f.offset[k], O[k] + f.offset[k] + size[k]]) };
    /* its node at its frame's zero (the floor under it), the product in it from its offset's h */
    const node = { id, name: A.name, type: 'product', part: { role: id }, offset: [0, 0, 0], size: [b.width, b.depth, f.offset[2] + b.height], children: /** @type {any[]} */ ([]) };
    node.children.push({ id: 'body', name: A.name, type: 'productBody', offset: [0, 0, f.offset[2]], size: [b.width, b.depth, b.height], children: [], parent: node });
    return { id, A, f, node, b };
  });
  /* the hardware as drawn: the products' sizes (the maker's) and the scene's layout (ours) */
  const product = key => (library.group(key) === 'hardware' ? library.product(key) : undefined), H = cabinets.settings.hardware, L = scene.hardware;
  const has = key => H[key] && product(H[key]), handle = has('handle'), leg = has('leg'), hinge = has('hinge'), grille = has('plinthGrille'), drawer = has('drawer');   // what the file has
  const HW = {
    handle: handle ? Object.assign({ cupLength: handle.length }, L.handle) : null,
    open: L.open, bins: L.bins,
    leg: leg ? Object.assign({ radius: leg.radius, footRadius: leg.footRadius, footHeight: leg.footHeight }, L.leg) : null,
    hinge: hinge ? { cupDepth: hinge.cupDepth } : null,
    drawer: drawer ? { runnerWidth: drawer.runnerWidth, sideThickness: drawer.sideThickness, sideFromCarcass: drawer.sideFromCarcass, fromBack: drawer.fromBack, fromFront: drawer.fromFront } : null,
    plinthGrille: grille ? { width: grille.width, bottom: L.plinthGrille.bottom, top: L.plinthGrille.bottom + grille.height } : null
  };
  /* what the owner builds: one node of the room, each piece a child at its box */
  const BUILT = (scene.builtIns || []).length ? [{ id: 'builtIns', name: 'Built in the room', type: 'builtIns', offset: [0, 0, 0], size: room.size.slice(),
    children: (scene.builtIns || []).map((b, i) => ({ id: 'b' + (i + 1), name: b.name, type: 'builtIn', offset: [b.box[0], b.box[2], b.box[4]], size: [b.box[1] - b.box[0], b.box[3] - b.box[2], b.box[5] - b.box[4]], children: [] })) }] : [];
  /* the ceiling's height: its lowest flat line (under a roof, the flat part), else the room's height */
  const ceiling = Math.min(room.size[2], ...(room.ceiling || []).filter(l => l.s === 0).map(l => l.a));
  const TREE = C.tree(model, appliances, { install: scene.installation, ceiling, HW }).concat(FIXTURES.map(x => x.node), BUILT);
  /* the looks this room adds to the library's: its boards, its walls' paint, the lamps' shade */
  const looks = Object.assign(furniture.boardLooks(model), {
    wall: { color: scene.room.wallColor, roughness: 0.95, reflect: 0.45 },
    shade: { color: (model.materials[model.materialFor.cabinet || model.materialFor.carcass]).color, roughness: 0.5, metalness: 0.2 }
  });
  const textures = Object.values(model.materials).map(m => m.texture).filter(Boolean);
  /* the tiles counted (no drawing yet): the model's counts.tiles, for Documents ({n:tiles.walls.area}, m²) */
  if (scene.tiles) model.counts.tiles = roomTiles(scene, room, { product: library.product, textures: {} }, { layers: [] }, '', false).counts;
  const tileTextures = Object.values(tileLayouts(scene)).map(t => (library.group(t.product) === 'tiles' ? library.product(t.product) : {}).texture).filter(Boolean);
  return { room, cabinets, scene, model, TREE, appliances, PLACE, HW, looks, textures: textures.concat(tileTextures), level: O[2], ceiling, FIXTURES };
}

/* ================= THE ROOM'S TILES (a bathroom's) =================
   scene.tiles: walls and floor, each {product, format? [length, width], dir (x: the tiles' length along the wall or x),
   pattern, origin [along, up] (a wall: from its start and the floor) or [x, y] (the floor: from the room's zero), grout};
   shower: {zone [x0, x1, y0, y1], walls, floor}: what lies in the zone takes these. Room axes, mm. */
const tileLayouts = scene => {
  const T = scene.tiles || {}, S = T.shower || {};
  return Object.fromEntries([['walls', T.walls], ['floor', T.floor], ['showerWalls', S.walls], ['showerFloor', S.floor]].filter(([, v]) => v));
};
/* the walls of a floor area (rects) as segments: {axis (0: the wall runs along x), at (its line), from, to, inward (+1 / -1)} */
function wallsOf(rects) {
  /** @type {{ axis: number, at: number, inward: number, from: number, to: number }[]} */
  const out = [];
  for (const q of rects) for (const [axis, at, inward, from, to] of [[0, q[2], 1, q[0], q[1]], [0, q[3], -1, q[0], q[1]], [1, q[0], 1, q[2], q[3]], [1, q[1], -1, q[2], q[3]]]) {
    let parts = [[from, to]];
    for (const o of rects) if (o !== q) {            // what another rect of the area covers is no wall
      const lo = axis === 0 ? o[0] : o[2], hi = axis === 0 ? o[1] : o[3], line = axis === 0 ? [o[2], o[3]] : [o[0], o[1]];
      if (inward > 0 ? line[0] >= at - 0.5 || line[1] < at - 0.5 : line[1] <= at + 0.5 || line[0] > at + 0.5) continue;   // the other must lie beyond the wall, touching it
      parts = parts.flatMap(([a, b]) => [[a, Math.min(b, lo)], [Math.max(a, hi), b]].filter(([c, d]) => d - c > 0.5));
    }
    for (const [a, b] of parts) out.push({ axis, at, inward, from: a, to: b });
  }
  return out;
}
/* rect [a1, a2, b1, b2] minus others, as rects */
const minusAll = (q, holes) => holes.reduce((rest, h) => rest.flatMap(r => G.rectMinus(r, h)), [q]);
/* the tiled surfaces: {key (the layout), id, rect [u1, u2, v1, v2] and its holes, point(u, v) -> room [x, y, h], n};
   tiles: a wall's face that far off the wall (depth), a floor's over the floor (top) */
function tiledSurfaces(scene, area, height, openings, tiles) {
  const TILE_DEPTH = tiles.depth, TILE_TOP = tiles.top;
  const T = scene.tiles || {}, zone = T.shower && T.shower.zone, built = scene.builtIns || [], out = [];
  const inZone = (axis, at, u) => zone && (axis === 0 ? (u >= zone[0] - 0.5 && u <= zone[1] + 0.5 && at >= zone[2] - 0.5 && at <= zone[3] + 0.5) : (u >= zone[2] - 0.5 && u <= zone[3] + 0.5 && at >= zone[0] - 0.5 && at <= zone[1] + 0.5));
  const add = (axis, at, inward, from, to, h0, h1, id, extra = [], own = null) => {
    /* split at the shower zone's edges: each part takes its own layout */
    const cuts = [from, to].concat(zone ? (axis === 0 ? [zone[0], zone[1]] : [zone[2], zone[3]]).filter(c => c > from + 0.5 && c < to - 0.5) : []).sort((p, q) => p - q);
    for (let i = 0; i + 1 < cuts.length; i++) {
      const a = cuts[i], b = cuts[i + 1], shower = inZone(axis, at, (a + b) / 2), key = shower ? 'showerWalls' : 'walls';
      if (!tileLayouts(scene)[key]) continue;
      const room = o => axis === 0 ? (inward > 0 ? o[3] > at + 0.5 && o[2] <= at + 0.5 : o[2] < at - 0.5 && o[3] >= at - 0.5) : (inward > 0 ? o[1] > at + 0.5 && o[0] <= at + 0.5 : o[0] < at - 0.5 && o[1] >= at - 0.5);   // reaching into the room from the plane
      const holes = openings.filter(o => (axis === 0 ? o[2] - 0.5 <= at && o[3] + 0.5 >= at : o[0] - 0.5 <= at && o[1] + 0.5 >= at)).map(o => axis === 0 ? [o[0], o[1], o[4], o[5]] : [o[2], o[3], o[4], o[5]])
        /* what is built stands on its own tiles: the wall's stop at their face */
        .concat(built.filter(x => x !== own).map(x => x.box).filter(room).map(o => axis === 0 ? [o[0] - TILE_DEPTH, o[1] + TILE_DEPTH, o[4], o[5]] : [o[2] - TILE_DEPTH, o[3] + TILE_DEPTH, o[4], o[5]])).concat(extra);
      const off = at + inward * TILE_DEPTH;
      out.push({ key, id: id + '_' + i, rect: [a, b, h0, h1], holes, n: axis === 0 ? [0, inward, 0] : [inward, 0, 0],
        point: (u, v) => axis === 0 ? [u, off, v] : [off, u, v] });
    }
  };
  /* the tiles' face stands TILE_DEPTH off its wall: at an inside corner a face ends that much short (the other's face is
     there), at an outside one that much past (closing the corner) */
  const WALLS = wallsOf(area), meets = (w, end) => WALLS.find(o => o.axis !== w.axis && Math.abs(o.at - end) < 0.5 && w.at >= o.from - 0.5 && w.at <= o.to + 0.5);
  const endShift = (o, sign) => !o ? 0 : (o.inward === sign ? -TILE_DEPTH : TILE_DEPTH);   // sign: +1 at the start (the room beyond it), −1 at the end
  WALLS.forEach((w, i) => add(w.axis, w.at, w.inward, w.from - endShift(meets(w, w.from), 1), w.to + endShift(meets(w, w.to), -1), 0, height, 'w' + (i + 1)));
  /* the faces of what is built that face the room (not against a wall, nor against another piece) */
  const sides = q => [[0, q[2], -1, q[0], q[1]], [0, q[3], 1, q[0], q[1]], [1, q[0], -1, q[2], q[3]], [1, q[1], 1, q[2], q[3]]];
  const across = (axis, q) => axis === 0 ? [q[0], q[1], q[4], q[5]] : [q[2], q[3], q[4], q[5]];
  built.filter(b => b.tiled !== false).forEach((b, i) => {
    sides(b.box).forEach(([axis, at, inward, from, to], s) => {
      const onWall = wallsOf(area).some(w => w.axis === axis && Math.abs(w.at - at) < 0.5 && w.inward === -inward);
      if (onWall) return;
      const touches = q => axis === 0 ? Math.abs((inward > 0 ? q[2] : q[3]) - at) < 0.5 : Math.abs((inward > 0 ? q[0] : q[1]) - at) < 0.5;
      const opens = q => axis === 0 ? Math.abs((inward > 0 ? q[3] : q[2]) - at) < 0.5 : Math.abs((inward > 0 ? q[1] : q[0]) - at) < 0.5;
      /* an opening's hole a tile's depth smaller (the face covers its reveals' edges); an end at a wall short of the wall's
         tiles, a free end past (the corner of the solid closed) */
      const holes = built.filter(o => o !== b).map(o => o.box).filter(touches).map(q => across(axis, q))
        .concat((b.cuts || []).filter(opens).map(q => across(axis, q)).map(q => [q[0] + TILE_DEPTH, q[1] - TILE_DEPTH, q[2], q[3]]));
      const atWall = e => WALLS.some(w => w.axis !== axis && Math.abs(w.at - e) < 0.5);
      add(axis, at, inward, from + (atWall(from) ? TILE_DEPTH : -TILE_DEPTH), to + (atWall(to) ? -TILE_DEPTH : TILE_DEPTH), b.box[4], b.box[5], 'b' + (i + 1) + 's' + s, holes, b);
    });
    /* an opening's reveals inside the solid, facing into it */
    (b.cuts || []).forEach((c, k) => sides(c).forEach(([axis, at, inward, from, to], s) => {
      const inside = axis === 0 ? at > b.box[2] + 0.5 && at < b.box[3] - 0.5 : at > b.box[0] + 0.5 && at < b.box[1] - 0.5;
      /* an end on the solid's face is open (past, to the face's tiles), one inside meets another reveal (short) */
      const open = e => axis === 0 ? Math.abs(e - b.box[0]) < 0.5 || Math.abs(e - b.box[1]) < 0.5 : Math.abs(e - b.box[2]) < 0.5 || Math.abs(e - b.box[3]) < 0.5;
      if (inside) add(axis, at, -inward, from + (open(from) ? -TILE_DEPTH : TILE_DEPTH), to + (open(to) ? TILE_DEPTH : -TILE_DEPTH), c[4], c[5], 'b' + (i + 1) + 'c' + k + 's' + s, [], b);
    }));
  });
  /* the floor: its area less what is built on it, the shower's zone apart */
  const L = tileLayouts(scene), feet = built.filter(b => b.box[4] <= 0.5).map(b => [b.box[0], b.box[1], b.box[2], b.box[3]]);
  /* each floor layout one surface, laid at once (one grid over all its rectangles); the shower's floor apart when it has a
     layout of its own, else the floor runs on into it */
  const floors = /** @type {Object<string, Rect[]>} */ ({ floor: [], showerFloor: [] });
  for (const q of area) {
    if (zone && L.showerFloor) { floors.floor.push(...minusAll(q, [zone])); floors.showerFloor.push(...minusAll(q, minusAll(q, [zone]))); }
    else floors.floor.push(q);
  }
  for (const [key, rects] of Object.entries(floors)) if (L[key] && rects.length) {
    const box = [Math.min(...rects.map(r => r[0])), Math.max(...rects.map(r => r[1])), Math.min(...rects.map(r => r[2])), Math.max(...rects.map(r => r[3]))];
    out.push({ key, id: 'f' + key[0], rect: box, rects, holes: feet, n: [0, 0, 1], point: (x, y) => [x, y, TILE_TOP] });
  }
  return out;
}
/* every layout laid over its surfaces (each surface a zone of its own): pieces of core in the house's axes, the materials,
   and the count of each layout (area m², tiles whole, cut, small cuts) */
function roomTiles(scene, room, library, cell, finish, draw = true) {
  const area = room.area || [[0, room.size[0], 0, room.size[1]]];   // its floor area, in its own axes
  const lines = room.ceiling || [], height = Math.min(room.size[2], ...lines.filter(l => l.s === 0).map(l => l.a));
  const L = tileLayouts(scene), surfaces = tiledSurfaces(scene, area, height, room.openings || [], room.tiles), O = room.offset;
  const out = { pieces: /** @type {any[]} */ ([]), materials: {}, counts: {} };
  for (const [key, spec] of Object.entries(L)) {
    const P0 = library.product(spec.product), T = library.textures[P0.texture] || { grout: '#888888' };
    const P = Object.assign({}, P0, spec.format ? { len: spec.format[0], wid: spec.format[1] } : {});
    const lay = { product: spec.product, dir: spec.dir || 'x', pattern: spec.pattern || P.pattern, grout: spec.grout || T.grout, oa: null, ob: null };
    const all = [], floorRects = [];        // the floor's surfaces of this layout: one slab, its edges round them all
    let floorEdge = null;
    for (const S of surfaces.filter(x => x.key === key)) {
      const rects = (S.rects || [S.rect]).flatMap(q => minusAll(q, S.holes)).filter(r => r[1] - r[0] > 1 && r[3] - r[2] > 1);
      if (!rects.length) continue;
      /* the origin: the data's, else fitted on the surface (a wall: along it only, the rows from the floor up, one line all round) */
      const laid = [{ id: S.id, own: rects, rects, zone: S.id }], wall = S.n[2] === 0;
      let oa, ob;
      if (spec.origin) { oa = S.rect[0] + spec.origin[lay.dir === 'x' ? 0 : 1]; ob = S.rect[2] + spec.origin[lay.dir === 'x' ? 1 : 0]; }
      else if (wall) {
        ob = S.rect[2]; const Pa = (lay.dir === 'x' ? P.len : P.wid) + P.joint, score = a => { const c = tiles.count(P, tiles.lay(lay, P, laid, a, ob)); return c.penalty * 4 + c.cut * 0.03; };
        oa = S.rect[0]; let best = score(oa);
        for (let a = S.rect[0]; a < S.rect[0] + Pa; a += 5) { const v = score(a); if (v < best - 1e-9) { best = v; oa = a; } }
      } else ({ oa, ob } = tiles.fit(lay, P, laid));
      /* under a roof: a wall's tiles cut to the lines h <= a + s·y, in the wall's own coordinates (S.point is affine) */
      const f = (u, v) => { const q = S.point(u, v); return q[2]; }, yOf = (u, v) => S.point(u, v)[1];
      const under = wall ? lines.filter(l => l.s !== 0).map(l => { const g = (u, v) => f(u, v) - l.s * yOf(u, v), g0 = g(0, 0); return { p: g(1, 0) - g0, q: g(0, 1) - g0, c: l.a - g0 }; }) : [];
      const pieces = tiles.clip(lay, tiles.lay(lay, P, laid, oa, ob), under);
      all.push(...pieces);
      const at = (u, v) => { const p = S.point(u, v); return [O[0] + p[0], O[1] + p[1], O[2] + p[2]]; };
      const behind = (u, v) => { const p = S.point(u, v); return [O[0] + p[0] - S.n[0] * 2, O[1] + p[1] - S.n[1] * 2, O[2] + p[2] - S.n[2] * 2]; };
      const grout = rects.map(r => under.reduce((poly, l) => poly.length < 3 ? poly : tiles.clipHalf(poly, l.p, l.q, l.c), [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]]))
        .filter(g => g.length > 2).map(g => g.map(([u, v]) => behind(u, v)));
      for (const g of grout) { const e1 = g[1].map((v, k) => v - g[0][k]), e2 = g[g.length - 1].map((v, k) => v - g[0][k]), c = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; if (c[0] * S.n[0] + c[1] * S.n[1] + c[2] * S.n[2] < 0) g.reverse(); }
      tiles.count(P, pieces);           // marks the small cuts
      if (!draw) continue;
      /* a tile goes with what it lies on: a wall's with the blocks, a casing's with the casing (like a facade with its EPS) */
      const on = S.id[0] === 'b' ? 'builtIns' : wall ? 'walls' : null;
      const c0 = on ? Object.assign({}, cell, { layers: cell.layers.concat(on) }, wall ? { face: S.n } : {}) : cell;   // face: a wall's tiles, its normal (the page hides them with their wall)
      const made = tiles.corePieces(lay, P, T, pieces, grout, at, S.n, c0, finish);
      out.pieces.push(...made.pieces); Object.assign(out.materials, made.materials);
      /* the tiles are a slab on what they lie on: its edges from the face to the back, round it and round its holes; the
         floor's round all its surfaces at once (below) */
      if (!wall && S.id[0] === 'f') { floorRects.push(...rects); floorEdge = { at, S, c0, material: `tiles:${P.texture}:0` }; continue; }
      const cut = poly => under.reduce((q, l) => q.length < 3 ? q : tiles.clipHalf(q, l.p, l.q, l.c), poly);
      const R = S.rect, ring = q => [[q[0], q[2]], [q[1], q[2]], [q[1], q[3]], [q[0], q[3]]];
      const holes = S.holes.map(h => [Math.max(h[0], R[0]), Math.min(h[1], R[1]), Math.max(h[2], R[2]), Math.min(h[3], R[3])]).filter(h => h[1] - h[0] > 1 && h[3] - h[2] > 1);
      out.pieces.push(...tiles.slabEdges([{ poly: cut(ring(R)), out: 1 }].concat(holes.map(h => ({ poly: cut(ring(h)), out: -1 }))), (u, v) => at(u, v), S.point, S.n, room.tiles.depth, c0, `tiles:${P.texture}:0`));
    }
    if (floorEdge) out.pieces.push(...tiles.slabEdges(tiles.outline(floorRects).map(poly => ({ poly, out: 1, open: true })), floorEdge.at, floorEdge.S.point, floorEdge.S.n, room.tiles.depth, floorEdge.c0, floorEdge.material));
    out.counts[key] = Object.assign({ product: spec.product, name: P0.name, format: P.len + ' × ' + P.wid }, tiles.count(P, all));
  }
  return out;
}
/* the room's tiles laid (core pieces, their materials, the counts): prepared, the library ({product, textures}), the cell
   of core the pieces go in, the finish of a cut ('cuts': its own colour) */
/** @param {{ scene: SceneFile, room: RoomInHouse }} prepared @param {{ product: Function, textures: Object<string, any> }} library @param {any} cell @param {string} finish */
const layTiles = (prepared, library, cell, finish) => roomTiles(prepared.scene, prepared.room, library, cell, finish);

/** the tree: its rules (core/tree.js) and each group inside the box the scene gives it: Test's items
   @param {{ scene: SceneFile, TREE: any[] }} prepared @returns {string[]} */
function checks(prepared) {
  const scene = prepared.scene, out = [];
  for (const g of prepared.TREE) {
    for (const c of tree.create(g).checks()) if (!c.info) for (const i of c.items) out.push(g.id + ': ' + c.name + ': ' + i);   // to know (a child outside its parent) is no fault
    const s = scene.groups[g.id.slice(1)];
    const size = s && (facesAlongX(s.front) ? [g.size[1], g.size[0], g.size[2]] : g.size);   // the group's x along the house's y when it faces x
    if (s && size.some((v, k) => v > s.size[k] + 0.5)) out.push(`${g.id}: ${size.map(Math.round).join(' × ')} does not fit the scene's box ${s.size.join(' × ')}`);
  }
  return out;
}

/* ================= THE ROOM'S FINISH =================
   the room's files as the viewer finished them (choice: {metal, boards: {board: the board in its place}}): the boards
   swapped, a metal chosen; every product of a family (a tap, an edge banding) in that metal and in the decor of the board
   that took its board's place; a worktop of a board that board thick */
/** @param {{ cabinets: any, scene: any, docs?: any }} files @param {{ metal?: string, boards?: Object<string, string> }} choice @param {Library} library */
function finish(files, choice, library) {
  const B = library.groups.boards, swap = choice.boards || {}, metal = choice.metal && library.materials[choice.metal] ? choice.metal : null;
  const codes = Object.fromEntries(Object.entries(swap).filter(([a, b]) => B[a] && B[b] && B[a].code && B[b].code).map(([a, b]) => [B[a].code, B[b].code]));
  const f = metal || Object.keys(codes).length ? JSON.parse(JSON.stringify(files), (key, x) => typeof x === 'string' ? library.variant(x, metal, codes) : x) : Object.assign({}, files);
  const materials = Object.fromEntries(Object.entries(f.cabinets.settings.materials).map(([role, k]) => [role, swap[k] && B[swap[k]] ? swap[k] : k]));
  /* a top of a board is that board thick: in whole mm, as the data has it */
  const whole = k => Math.round(B[k] ? B[k].thickness : 0), was = f.cabinets.settings.materials;
  const components = (f.cabinets.components || []).map(i => { const role = i.type === 'worktop' && ['worktop', 'islandWorktop'].find(r => materials[r] && materials[r] !== was[r] && i.height === whole(was[r]));
    return role ? Object.assign({}, i, { height: whole(materials[role]) }) : i; });
  f.cabinets = Object.assign({}, f.cabinets, { settings: Object.assign({}, f.cabinets.settings, { materials }), components });
  if (metal) f.scene = Object.assign({}, f.scene, { finish: Object.assign({}, f.scene.finish, { metal }) });
  return f;
}
/** the checks of a finish: the products in the room's metal, every edge banding in the decor of a board of the room
    @param {{ cabinets: any, scene: any, docs?: any }} files  as finished @param {PreparedRoom} prepared @param {Library} library @returns {Check[]} */
function finishChecks(files, prepared, library) {
  const all = Object.assign({}, ...Object.values(library.groups)), B = library.groups.boards, M = library.materials;
  const words = x => new Set((JSON.stringify(x || {}).match(/"[^"]+"/g) || []).map(s => s.slice(1, -1)));
  const metal = prepared.scene.finish.metal, used = words(files);
  const wrong = [...used].filter(k => all[k] && all[k].metal && all[k].metal !== metal);
  const codes = new Set(Object.values(files.cabinets.settings.materials).map(k => (B[k] || {}).code).concat((prepared.model.products || []).map(x => (all[x.product] || {}).code)).filter(Boolean));
  return [{ name: 'Finish: the products in the room\'s metal', about: 'The room\'s metal (its scene\'s finish, or the one chosen in Finish) is one of the library\'s; a product sold in a colour of metal (a tap, a radiator, a handle) is in that one: a product of a family (product.family) takes the family\'s one, else its variant is to choose.',
    items: (library.metals.some(m => m.k === metal) ? [] : [`the metal ${metal} is not a finish of the library`]).concat(wrong.map(k => `${all[k].name}: ${M[all[k].metal].name}, the room ${M[metal] ? M[metal].name : metal}`)) },
  { name: 'Finish: every edge banding in the decor of a board', about: 'An edge banding sold in a decor (its code) bands a board of that decor in the room: when a board is changed in Finish, the banding of its family follows; none in the new decor: to choose.',
    items: [...words(files.docs)].filter(k => all[k] && all[k].unit === 'm' && /edge|banding/.test(k) && all[k].code && !codes.has(all[k].code)).map(k => `${all[k].name}: no board ${all[k].code} in the room`) }];
}

return { prepare, layTiles, checks, finish, finishChecks };
}
