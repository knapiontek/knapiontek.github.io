// @ts-check
/* room/room.js: one room put together from what the page hands it: the room from the house (its node: origin and height),
   the room's files (cabinets, scene) and the library. It places the groups of furniture where the scene says, builds the
   cabinets (room/cabinets.js), the products (library/shapes.js) and the lamps, in the house's axes (x, y, h; mm).
   prepare() needs no browser: the model, the places of the groups, the hardware as drawn, the looks and textures the
   room needs. build() describes the room (core/drawing.js: still cells, moving parts, details, lamps) and a scene of core
   draws it. */
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
/** @typedef {ReturnType<ReturnType<typeof roomModule>['prepare']>} PreparedRoom */
/** @typedef {ReturnType<ReturnType<typeof roomModule>['build']>} BuiltRoom */
/** @param {ReturnType<typeof geometryModule>} geometry
    @param {ReturnType<typeof treeModule>} tree @param {ReturnType<typeof plan2dModule>} plan2d @param {ReturnType<typeof tilesModule>} tiles
    @param {ReturnType<typeof cabinetsModule>} cabinets @param {ReturnType<typeof furnitureModule>} furniture @param {ReturnType<typeof shapesModule>} shapes @param {ReturnType<typeof drawingModule>} drawing */
function roomModule(geometry, tree, plan2d, tiles, cabinets, furniture, shapes, drawing) {
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
/* box [x1, x2, y1, y2, h1, h2] minus another, as boxes (a solid with an opening: a casing with its niche) */
function boxMinus(b, c) {
  const k = [Math.max(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[2]), Math.min(b[3], c[3]), Math.max(b[4], c[4]), Math.min(b[5], c[5])];
  if (k[1] - k[0] < 0.5 || k[3] - k[2] < 0.5 || k[5] - k[4] < 0.5) return [b];
  const out = [], keep = q => { if (q[1] - q[0] > 0.5 && q[3] - q[2] > 0.5 && q[5] - q[4] > 0.5) out.push(q); };
  keep([b[0], k[0], b[2], b[3], b[4], b[5]]); keep([k[1], b[1], b[2], b[3], b[4], b[5]]);
  keep([k[0], k[1], b[2], k[2], b[4], b[5]]); keep([k[0], k[1], k[3], b[3], b[4], b[5]]);
  keep([k[0], k[1], k[2], k[3], b[4], k[4]]); keep([k[0], k[1], k[2], k[3], k[5], b[5]]);
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
  area.forEach((q, i) => {
    const parts = zone ? [[minusAll(q, [zone]), 'floor'], [minusAll(q, minusAll(q, [zone])), 'showerFloor']] : [[[q], 'floor']];
    for (const [rects, key] of parts) if (L[key]) rects.forEach((r, k) => out.push({ key, id: 'f' + (i + 1) + key[0] + k, rect: [r[0], r[1], r[2], r[3]], holes: feet, n: [0, 0, 1], point: (x, y) => [x, y, TILE_TOP] }));
  });
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
    const all = [];
    for (const S of surfaces.filter(x => x.key === key)) {
      const rects = minusAll(S.rect, S.holes).filter(r => r[1] - r[0] > 1 && r[3] - r[2] > 1);
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
      /* the tiles are a slab on what they lie on: its edges from the face to the back, round it and round its holes */
      const cut = poly => under.reduce((q, l) => q.length < 3 ? q : tiles.clipHalf(q, l.p, l.q, l.c), poly);
      const R = S.rect, ring = q => [[q[0], q[2]], [q[1], q[2]], [q[1], q[3]], [q[0], q[3]]];
      const holes = S.holes.map(h => [Math.max(h[0], R[0]), Math.min(h[1], R[1]), Math.max(h[2], R[2]), Math.min(h[3], R[3])]).filter(h => h[1] - h[0] > 1 && h[3] - h[2] > 1);
      out.pieces.push(...tiles.slabEdges([{ poly: cut(ring(R)), out: 1 }].concat(holes.map(h => ({ poly: cut(ring(h)), out: -1 }))), (u, v) => at(u, v), S.point, S.n, room.tiles.depth, c0, `tiles:${P.texture}:0`));
    }
    out.counts[key] = Object.assign({ product: spec.product, name: P0.name, format: P.len + ' × ' + P.wid }, tiles.count(P, all));
  }
  return out;
}

/* the cells of a room's furniture that no node of its group's tree holds: Test */
function unheld(made, prepared) {
  const boxes = {}, M = prepared.model;
  for (const g of prepared.TREE) {
    const own = g.type === 'product' || g.type === 'builtIns', r = g.type === 'builtIns' ? 'room' : g.type === 'product' ? g.id : g.id.slice(1), wall = own ? 0 : M.groups[r].wall, list = boxes[r] = [];
    (function each(n) { const b = C.boxIn(n); list.push([b[0], b[1], b[2] + wall, b[3] + wall, b[4], b[5]]); n.children.forEach(each); })(g);
  }
  return made.cells().filter(c => c.gb && !(boxes[c.r] || []).some(b => c.gb.every((v, k) => (k % 2 ? v <= b[k] + 0.5 : v >= b[k] - 0.5))))
    .map(c => `group ${c.r}: ${c.element} ${c.gb.map(Math.round).join(', ')}`);
}
/* the cells of a room outside their group's box: Test */
function outside(made, prepared) {
  const out = [];
  for (const c of made.cells()) {
    const b = prepared.PLACE[c.r] && prepared.PLACE[c.r].box, ys = c.S.poly.map(p => p[0]), hs = c.S.poly.map(p => p[1]);
    const q = [c.S.x1, c.S.x2, Math.min(...ys), Math.max(...ys), Math.min(...hs), Math.max(...hs)];
    if (b && q.some((h, k) => (k % 2 ? h > b[k] + 0.5 : h < b[k] - 0.5))) out.push(`group ${c.r}: ${c.element} ${q.map(Math.round).join(', ')}`);
  }
  return out;
}

/* V: a scene of core; prepared: prepare(); materials: the page's library for core (the room's looks are in it, plus
   handle: the metal chosen); opts: {layers: the host's, added to every solid and detail; ceilingLayers: what hides the
   ceiling's lamps with the ceiling} */
/** @param {SceneView} V @param {PreparedRoom} prepared
    @param {{ materials: Object<string, MaterialLook>, layers?: string[], ceilingLayers?: string[], library: Library }} opts  library: library/catalog.js */
function build(V, prepared, opts) {
  const { model, appliances, PLACE, HW, scene } = prepared, CEILING = prepared.ceiling;
  const EXTRA = opts.layers || [];
  /* what is drawn, described (core/drawing.js): the cabinets, the fixtures, the tiles' cells, the lamps */
  const D = drawing.create({ place: PLACE, level: prepared.level, layers: EXTRA, looks: opts.materials, metal: scene.finish.metal, ceiling: CEILING });
  const { box, at, part, STATIC, MOVERS, ENVELOPES, UNDRAWN } = D;

  /* the cabinets, with their products */
  const drawn = furniture.draw(D, model, appliances, HW, scene.installation);

  /* the fixtures: each drawn by the library in its own frame (x along its wall, y out of it, h up from the floor) */
  for (const x of prepared.FIXTURES) shapes[x.A.draw](D, x.A, { r: x.id, a: at(x.id, x.f.layer || 'sanitary'), w: x.b.width, d: x.b.depth, h: x.b.height, h0: x.f.offset[2], f: x.f });
  /* the room's tiles (room/tiles.js): pieces of core and their materials, for the page */
  const tiles = prepared.scene.tiles ? roomTiles(prepared.scene, prepared.room, { product: opts.library.product, textures: opts.library.textures }, { layers: ['tiles'].concat(EXTRA) }, 'cuts') : { pieces: [], materials: {}, counts: {} };
  /* what the owner builds in the room (a casing of plasterboard), boxes in the room's axes */
  /* a built-in is one solid, its openings cut out: its pieces one part, so no line between them */
  for (const b of scene.builtIns || []) {
    const one = part();
    for (const q of (b.cuts || []).reduce((ps, c) => ps.flatMap(p => boxMinus(p, c)), [b.box])) box(STATIC, 'room', q, b.material, 'builtIns', { name: b.name, part: one });
  }

  /* the lamps of the scene: pendants centred over the worktop of their group, downlights at {group, x, y} (y from the
     wall) or between the axes of the sink and the hob; a downlight hides with the ceiling, not with its group */
  const Lt = scene.lights;
  if (Lt && Lt.pendants) {
    const Pd = Lt.pendants, r = String(Pd.group), wt = model.worktops[r] || { y0: 0, y1: 0 }, top = model.groups[r].items.find(i => i.type === 'worktop');
    const mid = top ? (top.x0 + top.x1) / 2 : model.groups[r].widths.reduce((s, w) => s + w, 0) / 2, a = at(r, 'lamps');
    for (let i = 0; i < Pd.count; i++) shapes.pendant(D, { a, r, x: mid + (i - (Pd.count - 1) / 2) * Pd.spacing, y: (wt.y0 + wt.y1) / 2, bottom: Lt.pendantBottom, ceiling: CEILING });
  }
  if (Lt) {
    for (const d of Lt.downlights) {
      if (!d.at) continue;                 // in the room's axes
      const a = at('room', 'ceiling', null, ['lamps'].concat(opts.ceilingLayers || [])); a.layers = a.layers.filter(k => k !== 'groom');
      shapes.downlight(D, { a, r: 'room', x: d.at[0], y: d.at[1], ceiling: CEILING });
    }
    for (const d of Lt.downlights) {
      if (d.at) continue;
      const g = String(d.group), x = d.between ? d.between.reduce((s, k) => s + drawn.axes[k], 0) / d.between.length : d.x, y = model.groups[g].wall + Number(d.y);
      const a = at(g, 'ceiling', null, ['lamps'].concat(opts.ceilingLayers || [])); a.layers = a.layers.filter(k => k !== 'g' + g);
      shapes.downlight(D, { a, r: g, x, y, ceiling: CEILING });
    }
  }

  /* the moving parts: a door turns about its hinge (h), a dishwasher's door and a bottom-hinged oven door about X, a drawer
     slides out along Y; built closed */
  const SWING = { door: 'h', fridge: 'h', dishwasher: 'x', drawer: 'slide' };
  for (const m of MOVERS) {
    const open = m.travel ?? (m.kind === 'drawer' ? HW.open.drawer : HW.open.angle[m.kind] || 0), { X, Y } = PLACE[m.r], swing = m.swing || SWING[m.kind];
    m.how = swing === 'slide' ? { slide: [open * Y[0], open * Y[1], 0] } : swing === 'x' ? { axis: [X[0], X[1], 0], angle: open } : { axis: [0, 0, 1], angle: -m.sign * open };
  }
  /* drawn (core/scene.js); of the sink and the hob the plan draws what is seen from above: their details stay apart */
  const shown = V.show(D, { layers: EXTRA, apart: ['sink', 'hob'] });
  const { night, showDetails } = shown;
  const made = { STATIC, MOVERS, DETAILS: shown.DETAILS, ENVELOPES, LAMPS: shown.LAMPS, UNDRAWN, tiles, carcasses: drawn.carcasses, night, showDetails,
    cells: () => STATIC.concat(...MOVERS.map(m => m.cells)) };
  /* the 2D plan of the furniture, as a room's plan shows it (about 1:50): not cut, seen from above. A carcass is one
     rectangle with its front; the tops (worktops, end panels) one figure, no joints, their openings left; a sink and a hob
     their outlines, an appliance its body; what is built and the sanitary fittings their own outlines. What is over the
     plan's cut (wall units, the hood) dashed. Left out: the boards, drawers, hardware, handles, strips, plinths, backs,
     legs, holes, the installations. */
  const APPLIANCES = ['sink', 'trap', 'hob', 'hood', 'oven', 'microwave', 'coffee', 'fridge', 'dishwasher'];
  made.plan = () => {
    const cells = made.cells(), outlines = [];
    const span = list => { const s = list.map(c => plan2d.solidShape(c)), xs = s.flatMap(q => q.poly.map(p => p[0])), ys = s.flatMap(q => q.poly.map(p => p[1]));
      return { poly: [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)], [Math.min(...xs), Math.max(...ys)]], bottom: Math.min(...s.map(q => q.bottom)), top: Math.max(...s.map(q => q.top)) }; };
    for (const c of drawn.carcasses) {
      const own = cells.filter(x => x.info && x.info.carcass === c).concat(...c.movers.map(m => m.cells)).filter(x => !x.layers.some(l => ['handles', 'hardware', 'holes', 'legs'].includes(l)));   // a handle past the front: not the carcass
      if (own.length) outlines.push(span(own));
    }
    for (const x of model.products || []) {
      if (!APPLIANCES.includes(x.role) || ['sink', 'hob', 'trap'].includes(x.role)) continue;   // the sink and the hob: their own outlines below
      const b = C.boxIn(x.node), wall = model.groups[x.group].wall, list = [];
      box(list, x.group, [b[0], b[1], b[2] + wall, b[3] + wall, b[4], b[5]], 'applianceBody', 'appliance', { name: x.name || x.role });
      outlines.push(...list.map(c => plan2d.solidShape(c)));
    }
    const tops = cells.filter(c => c.layers.includes('worktops') || c.layers.includes('endPanels')).map(c => plan2d.solidShape(c));
    outlines.push(...cells.filter(c => c.layers.some(l => ['builtIns', 'plasterboard', 'sanitary', 'basin'].includes(l)) && !c.layers.includes('installations')).map(c => plan2d.solidShape(c, c.material === 'glass')));
    outlines.push(...shown.footprints(layers => !layers.includes('installations') && layers.some(l => ['sink', 'hob', 'basin', 'sanitary'].includes(l))));
    if (tops.length) outlines.push({ pieces: tops, poly: tops[0].poly, bottom: Math.min(...tops.map(q => q.bottom)), top: Math.max(...tops.map(q => q.top)) });
    return { cells: [], shapes: outlines };
  };
  /* the tree: its rules (core/tree.js) and each group inside the box the scene gives it */
  const treeChecks = () => {
    const out = [];
    for (const g of prepared.TREE) {
      for (const c of tree.create(g).checks()) if (!c.info) for (const i of c.items) out.push(g.id + ': ' + c.name + ': ' + i);   // to know (a child outside its parent) is no fault
      const s = scene.groups[g.id.slice(1)];
      const size = s && (facesAlongX(s.front) ? [g.size[1], g.size[0], g.size[2]] : g.size);   // the group's x along the house's y when it faces x
      if (s && size.some((v, k) => v > s.size[k] + 0.5)) out.push(`${g.id}: ${size.map(Math.round).join(' × ')} does not fit the scene's box ${s.size.join(' × ')}`);
    }
    return out;
  };
  made.checks = () => [
    { name: 'Furniture: the tree', about: 'The tree of the furniture by the rules of every tree (ids, sizes), and each group inside the box its scene gives it in the room.', items: treeChecks() },
    { name: 'Furniture: every solid has its node', about: 'Every solid drawn (a board, a front, a piece of hardware, a part of an appliance) lies inside a node of its group\'s tree: nothing is drawn that the tree does not hold.', items: unheld(made, prepared) },
    { name: 'Furniture: inside its group', about: 'Every solid of a group lies inside the box its scene gives it in the room.', items: outside(made, prepared) },
    { name: 'Furniture: parts with no size', about: 'A part whose box has no number (a size the data does not give) is not drawn; it is listed here.', items: UNDRAWN.slice() },
    { name: 'Cabinets: banded edges are seen', about: 'An edge is banded to be seen: none of the banded edges lies against another part (a board, a front, a worktop, a panel, an appliance, the wall, the floor).', items: C.coveredEdges(model) },
    { name: 'Cabinets: the model', about: 'What the cabinets\' model finds wrong in the cabinets file: a piece that does not fit its column, a hinge on a shelf, a worktop too short, …', items: model.warnings.slice() }
  ];
  return made;
}

/* the layers of a room's furniture, for its own view: its groups, then its parts by kind */
/** @param {PreparedRoom} prepared @returns {Object<string, { name: string, layers?: object }>} */
function layers(prepared) {
  const M = prepared.model, kinds = new Set((M.hardware || []).map(x => x.kind)), roles = new Set((M.products || []).map(x => x.role));
  const boards = id => M.boards.some(b => b.id === id);
  /* what the room has: a layer only for that (a wardrobe has no worktop, no handles, no appliances) */
  const has = {
    carcasses: true, backs: boards('backPanel'), shelves: ['fixedShelf', 'adjustableShelf', 'pullOutShelf'].some(boards), drawers: M.boards.some(b => b.layer === 'drawers'),
    hardware: ['hinge', 'bumper', 'runner'].some(k => kinds.has(k)), holes: M.boards.some(b => b.holes) || M.fronts.some(f => f.holes), legs: M.carcasses.some(c => c.legs),
    fronts: M.fronts.some(f => !f.open), handles: kinds.has('handle'), strips: M.strips.length, frontPanel: M.frontPanels.length, plinth: M.plinths.length,
    worktops: M.worktopPieces.some(p => p.item.type === 'worktop'), endPanels: M.worktopPieces.some(p => p.item.type === 'endPanel'), wallPanel: M.wallPanels.length,
    sink: roles.has('sink'), trap: roles.has('trap'), hob: roles.has('hob'), hood: roles.has('hood'), oven: roles.has('oven'), microwave: roles.has('microwave'),
    coffee: roles.has('coffee'), fridge: roles.has('fridgeFreezer'), dishwasher: roles.has('dishwasher'), basin: roles.has('basin'), plasterboard: M.plaster.length,
    sanitary: (prepared.FIXTURES || []).length, builtIns: (prepared.scene.builtIns || []).length,
    installations: (prepared.FIXTURES || []).some(x => (x.A.shape || []).some(p => p.l === 'installations')),
    lamps: !!(prepared.scene.lights && (prepared.scene.lights.pendants || (prepared.scene.lights.downlights || []).length))
  };
  const L = Object.fromEntries(Object.keys(M.groups).map(r => ['g' + r, { name: 'G' + r + ' · ' + M.groups[r].name }]));
  const all = {
    carcassParts: { name: 'Carcasses', layers: { carcasses: { name: 'Boards' }, backs: { name: 'HDF backs' }, shelves: { name: 'Shelves' }, drawers: { name: 'Drawers' },
      hardware: { name: 'Hinges, bumpers, runners' }, holes: { name: 'Holes' }, legs: { name: 'Legs' } } },
    frontParts: { name: 'Fronts', layers: { fronts: { name: 'Fronts' }, handles: { name: 'Handles' }, strips: { name: 'Front strips' }, frontPanel: { name: 'Panels' }, plinth: { name: 'Plinth' } } },
    worktopParts: { name: 'Worktop', layers: { worktops: { name: 'Worktops' }, endPanels: { name: 'End panels' }, wallPanel: { name: 'Wall panel' } } },
    appliances: { name: 'Appliances', layers: { sink: { name: 'Sink, tap' }, trap: { name: 'Trap' }, hob: { name: 'Hob' }, hood: { name: 'Hood' }, oven: { name: 'Oven' },
      microwave: { name: 'Microwave' }, coffee: { name: 'Coffee machine' }, fridge: { name: 'Fridge' }, dishwasher: { name: 'Dishwasher' }, basin: { name: 'Basin, tap' } } },
    plasterboard: { name: 'Plasterboard casing' },
    sanitary: { name: 'Sanitary and fittings' }, builtIns: { name: 'Built in (casings, their tiles)' }, installations: { name: 'Installations (riser, WC frame)' },
    lamps: { name: 'Lights (lamps and their light)' }
  };
  for (const [k, v] of Object.entries(all)) {
    if (v.layers) { for (const c of Object.keys(v.layers)) if (!has[c]) delete v.layers[c]; if (Object.keys(v.layers).length) L[k] = v; }
    else if (has[k]) L[k] = v;
  }
  return L;
}

return { prepare, build, layers };
}
