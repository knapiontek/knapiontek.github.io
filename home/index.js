// @ts-check
/* index.js: the application's logic (its look: index.html), one page loaded once: the whole house, or a part of it
   (?room=room_356 or ?room=bathroom_7,bathroom_5) cut out of it, in 3D, 2D, Documents (its last sheet: Test) and Cabinets.
   Everything it shows comes from house.js and the library; nothing of this house is written here. The screen is index.html, of core/ui.js's pieces (Alpine.js); build(ui) makes the model and the scene. */
'use strict';
/* ================= THE APPLICATION: each file made from its constructor, given what it needs =================
   These lines are the whole map of what needs what. */
const Geometry = coreGeometryModule(), Tools = coreToolsModule(), Tree = coreTreeModule();
const Faces = coreFacesModule(Geometry), Plan2d = corePlan2dModule(Geometry, Tools), Estimate = coreEstimateModule(Tools);
const UI = coreUiModule(Tools), Sheet = coreSheetModule(UI, Tools), Scene = coreSceneModule(Geometry, Faces);
const Catalog = libraryCatalogModule(HOME.load), Model = houseModelModule(Geometry, Tree), Tiles = roomTilesModule(Geometry);
const Shapes = libraryShapesModule(), Cabinets = roomCabinetsModule(), Furniture = roomFurnitureModule(Cabinets, Shapes);
const Parts = corePartsModule(Geometry);
const RoomModel = roomModelModule(Geometry, Tree, Tiles, Cabinets, Furniture), RoomParts = roomPartsModule(RoomModel, Cabinets, Furniture, Shapes, Parts, Plan2d);
const Docs = roomDocsModule(Tools, Estimate, Cabinets);
const Design = roomDesignModule(Cabinets, Tools, UI);
const HousePlan = housePlanModule(Geometry, Plan2d), HouseDocs = houseDocsModule();

const DESIGN_HOST = {};                    // what the cabinet design asks of the page (build() fills it)
UI.page('house', Object.defineProperties({
  key: 'home-house', fresh: () => ({ mode: '3d', tab: null, layers: {}, zoom: 1, room: null, finish: {} }), valid: s => ['3d', '2d', 'documents', 'cabinets'].includes(s.mode) && s.layers,
  modes: ['3d', '2d', 'documents', 'cabinets'], tabs: { '3d': ['view', 'finish'] },   // the panel's View and Finish: 3D's only
  async load() { P = await build(this); },
  views: 0,                                // counts the views built: the panel follows a new one
  /** @this {any} */ onMode(m) { P.onMode(m); if (m === 'cabinets') this.editRoom(); }, onLayers: () => P.apply(), menus() { this.views; return P.menus(); },
  get layerBlocks() { this.views; return this.ready ? P.layerBlocks() : []; },
  get finish() { this.views; return this.ready ? P.finish() : null; },
  setTiles(key, field, value) { P.setTiles(key, field, value); },
  setFinish(room, field, from, value) { P.setFinish(room, field, from, value); },
  fitTiles(key) { P.setTiles(key, 'fit'); }
}, Object.getOwnPropertyDescriptors(Design.part(DESIGN_HOST))));
let P = null;                              // the page built: what its screen asks of it
/* builds the page into ui (the page's Alpine part) */
async function build(ui) {
const state = ui.state;
const { $ } = UI;
const { prism, hRange } = Geometry;
const { piecesOf } = Faces;
const DEG = 180 / Math.PI;

const [DATA, LIB] = await Promise.all([HOME.load('house/house.js', 'house', 3), Catalog.open()]);
const MODEL = Model.build(DATA), T = MODEL.T, HOUSE = MODEL.HOUSE;   // DATA: the site, the house in it
/** a setting the data must give: its value */
const must = (/** @type {HouseNode} */ n, /** @type {string} */ key) => { const s = T.setting(n, key); if (!s) throw new Error(`${n.id}: no setting ${key}`); return s.value; };
const VIEW = must(HOUSE, 'view'), TILES = must(HOUSE, 'tiles');
const { ROOF, WIDTH, RIDGE_TOP, FLOORS, ROOMS, ROOM, DOORS } = MODEL;
const level = F => F.offset[2];
const roomName = r => `${r.node.number}. ${r.node.name}`;
const MATERIALS = LIB.materials;
await LIB.loadTextures(Object.values(MATERIALS).flatMap(m => [m.image && m.image.key, m.wood && m.wood.decor]));

/* ================= THE ROOMS' FURNITURE (prepared once) ================= */
/* a room's finish as the viewer changes it over its data, kept in the browser: the metal (of every metal part: handles,
   taps, profiles, rails), a board in place of a board; a change builds the page again */
const FINISH = state.finish || (state.finish = {});
/* a room's furniture, prepared once (and again after a change of its finish): its files as finished, placed by room/model.js */
const PREPARED = new Map();
const furnished = r => PREPARED.get(r.id) || PREPARED.set(r.id, (async () => {
  const roles = ['cabinets', 'scene'].concat(r.node.files.includes('docs') ? ['docs'] : []);
  const [dataCabinets, dataScene, dataDocs] = await Promise.all(roles.map(role => HOME.load(`room/${r.id}.${role}.js`, role, 1)));
  const data = { cabinets: EDITED.get(r.id) || dataCabinets, scene: dataScene, docs: dataDocs }, used = RoomModel.finish(data, FINISH[r.id] || {}, LIB), { cabinets, scene, docs } = used;
  /* the room as the room engine needs it: its zero and size, its floor area and the openings in its walls, in its own axes */
  const at = T.place(r.node), near = b => b[0] <= at[0] + r.node.size[0] + 300 && b[1] >= at[0] - 300 && b[2] <= at[1] + r.node.size[1] + 300 && b[3] >= at[1] - 300 && b[4] < at[2] + r.node.size[2] && b[5] > at[2];
  /* what closes it above, as lines h <= a + s·y of its own axes: a ceiling over it (the attic's flat one), the roof's underside */
  const over = MODEL.ELEMENTS.filter(e => e.kind === 'ceiling' && e.b[0] < at[0] + r.node.size[0] && e.b[1] > at[0] && e.b[2] < at[1] + r.node.size[1] && e.b[3] > at[1] && e.b[4] > at[2]);
  const ceiling = over.map(e => ({ a: e.b[4] - at[2], s: 0 })).concat(r.floor === MODEL.FLOORS[MODEL.FLOORS.length - 1] ? MODEL.ROOF_UNDER.map(l => ({ a: l.a + l.s * at[1] - at[2], s: l.s })) : []);
  const node = { offset: at, size: r.node.size, area: r.node.area, ceiling, tiles: TILES, openings: MODEL.OPENINGS.map(o => o.b).filter(near).map(b => b.map((v, k) => v - at[k >> 1])) };
  const prepared = RoomModel.prepare(node, { cabinets, scene }, LIB);
  return { room: r, prepared, data, used, docs: docs && Docs.create({ model: prepared.model, tree: prepared.TREE, docs, appliances: prepared.appliances, library: LIB }) };
})()).get(r.id);
const TILE_PRODUCTS = /** @type {Object<string, TileProduct>} */ (LIB.groups.tiles);
await LIB.loadTextures(Object.values(TILE_PRODUCTS).map(p => p.texture));

/* ================= THE SCENE: one for every view; a view (the house, a room) is built in it and taken away =================
   ?room= the rooms asked for; a link to this page, Back and Forward change the view in place */
const V = Scene.create({ canvas: /** @type {HTMLCanvasElement} */ ($('gl')), stage: /** @type {HTMLElement} */ ($('stage')), materials: MATERIALS, textures: LIB.textures, light: VIEW.light, edges: VIEW.edges, sunCentre: [0, 0, 0] });
let CUR = null;                            // the view shown: {click, frame, key, active, P}
let SCOPE = [];                            // the rooms the view is cut to; none: the whole house
/* the active room: always one (the panel's): the one picked in the menu, kept; at first the first furnished */
const FIRST = ROOMS.find(r => (r.node.files || []).includes('cabinets')) || ROOMS[0];
const activeId = () => (ROOM[state.room] ? state.room : FIRST.id);
/* the panel's heading: the active room, whatever is shown; the menu: House or Room, the active room */
function heading() {
  const r = ROOM[activeId()];
  ui.title = roomName(r);
  ui.subtitle = r.floor.name;
  document.title = SCOPE.length ? SCOPE.map(id => ROOM[id].node.name).join(', ') : 'Home';
  ui.nav = Model.nav(DATA, SCOPE, r.id);
}
V.enableNavigation();
V.onClick(ray => CUR && CUR.click(ray));
V.onFrame(() => !!CUR && CUR.frame());
window.addEventListener('keydown', e => CUR && CUR.key(e));
Alpine.effect(() => { state.room; state.mode; if (CUR) { heading(); CUR.active(); if (state.mode === 'cabinets') ui.editRoom(); } });
/* the cabinet design (room/design.js), the mode Cabinets: the active room's file, or its draft shown in 3D; a room without
   one starts empty, with the first furnished room's settings */
const EDITED = new Map();                  // a room's cabinets shown in 3D from the design, in place of its file (this page only)
const BLANK = base => ({ format: 'cabinets', version: 1, settings: base.settings, appliances: {}, notes: [], groups: [], components: [] });
Object.assign(DESIGN_HOST, {
  async open() {
    const r = ROOM[activeId()], has = (r.node.files || []).includes('cabinets'), own = has ? await furnished(r) : null;
    const base = own ? own.data.cabinets : (await furnished(FIRST)).data.cabinets;
    return { id: r.id, name: roomName(r), file: own ? own.data.cabinets : BLANK(base), base, boards: LIB.groups.boards, appliances: Object.assign({}, LIB.groups.appliances, LIB.groups.sanitary),
      note: has ? '' : `${roomName(r)} has no cabinets file yet: the settings (the materials) are ${roomName(FIRST)}'s.` };
  },
  show(id, file) {
    if (!(ROOM[id].node.files || []).includes('scene')) return `${roomName(ROOM[id])} has no scene yet (where its groups stand, its finish): Export the file; the scene is to make.`;
    EDITED.set(id, file); PREPARED.delete(id); ui.pick('3d'); show(SCOPE, true);
    return '';
  }
});
const askedOf = search => (new URLSearchParams(search).get('room') || '').split(',').filter(Boolean);
/* the view of the rooms asked (none: the house) built in place; keep: the camera stays (the same view built again) */
async function show(asked, keep = false) {
  ui.loading = 'Loading…';
  await new Promise(r => requestAnimationFrame(() => setTimeout(r)));   // the word shows first
  V.stopWalk(); V.clear(); ui.walking = ui.opened = false; ui.docs = null;   // the new view makes its own Documents
  CUR = await view(asked, keep); P = CUR.P; heading();
  ui.loading = ''; ui.views++; V.redraw();
}
document.addEventListener('click', e => {   // a link to this page: no new page
  const a = e.target instanceof Element && e.target.closest('a[href]');
  if (!a || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const u = new URL(/** @type {string} */ (a.getAttribute('href')), location.href);
  const page = p => p.replace(/index\.html$/, '');   // the home folder or its index.html: the same page
  if (page(u.pathname) !== page(location.pathname)) return;
  e.preventDefault(); ui.navOpen = null;
  const pick = u.hash.startsWith('#room=') && u.hash.slice(6);   // a room picked in the whole house: active, the view stays
  if (pick) { state.room = pick; return; }
  if (u.search === location.search) return;
  history.pushState(null, '', u.search || location.pathname); show(askedOf(u.search));
});
window.addEventListener('popstate', () => show(askedOf(location.search)));
V.start();
CUR = await view(askedOf(location.search), false); P = CUR.P; heading();
V.run();
if (state.mode === 'cabinets') setTimeout(() => ui.editRoom());
return P;

/* ================= A VIEW =================
   everything that depends on the rooms shown, built into the scene; its handlers and its page part */
async function view(ASKED, keep) {
/* ================= THE PART SHOWN =================
   ASKED: the ids of the rooms (?room=, by commas); none: the whole house */
const PART = ASKED.filter(id => ROOM[id]), WHOLE = !PART.length;
const PARTS = PART.map(MODEL.part);
const UNION = WHOLE ? null : [0, 1, 2, 3, 4, 5].map(k => (k % 2 ? Math.max : Math.min)(...PARTS.map(p => p.box[k])));
SCOPE = PART;
if (PART.length && !PART.includes(state.room)) state.room = PART[0];   // a room's view: its room is the active one

/* ================= THE ROOMS' FURNITURE =================
   the rooms shown that have files in room/ (house.js: files): placed by room/model.js, drawn by room/parts.js; their looks join the library's */
const FURNISHED = (WHOLE ? ROOMS : PART.map(id => ROOM[id])).filter(r => (r.node.files || []).includes('cabinets'));
const FURNITURE = await Promise.all(FURNISHED.map(furnished));
for (const f of FURNITURE) Object.assign(MATERIALS, f.prepared.looks);
await LIB.loadTextures(FURNITURE.flatMap(f => f.prepared.textures));
/* the active room's furniture: its own layers too (its groups and its kinds of parts), in the house's view as in its own */
const roomLayers = () => { const f = FURNITURE.find(f => f.room.id === activeId()); return f ? RoomParts.layers(f.prepared) : {}; };
let ROOM_LAYERS = roomLayers();

/* ================= SOLIDS =================
   The whole house: every solid, each door turning on its hinge. A part: the solids of its rooms, each wall, floor and
   ceiling an object of its own (a layer), a window or a door with the wall it sits in. */
let LAYER = UI.layerTree(Object.assign({}, VIEW.layers, ROOM_LAYERS));
const OBJECTS = [];                        // the part's objects that hide while the camera is beyond them: {layer, middle, normal, box, k, inner}
/* what lies on an object (a wall, the floor, the ceiling) hides with it: a piece within its skin, the tiles' depth either
   side of its face toward the room (k: the axis of its normal, inner: that face), and along it meeting its box (as far as
   the tiles run past its end). The
   tiles on a wall or on the floor, and their edges, also an edge under another wall's tiles (in that wall's skin too) */
const TOL = 1;
const onObjects = (/** @type {number[][]} */ poly) => {
  const b = boxOf(poly), d = TILES.depth + TOL;
  return OBJECTS.filter(o => b[2 * o.k] >= o.inner - d && b[2 * o.k + 1] <= o.inner + d
    && [0, 1, 2].every(j => j === o.k || (b[2 * j] <= o.box[2 * j + 1] + d && b[2 * j + 1] >= o.box[2 * j] - d))).map(o => o.layer);
};
/* pieces of core made elsewhere (the tiles), each with the layers of the objects it lies on */
const onTheirObjects = (/** @type {any[]} */ pieces, /** @type {string[]} */ base) => pieces.map(p => { const layers = base.concat(p.cell.layers, onObjects(p.poly));
  return Object.assign(p, { cell: Object.assign({}, p.cell, { layers }), group: layers.join('+') }); });
const boxOf = poly => [0, 1, 2].flatMap(k => [Math.min(...poly.map(v => v[k])), Math.max(...poly.map(v => v[k]))]);   // [x1, x2, y1, y2, h1, h2]
const NORMAL = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+h': [0, 0, 1], '-h': [0, 0, -1] };
/** @type {HouseCell[]} */ let STILL;     // the cells that stand still
/** @type {{ door: Door, layers: string[], part?: any, mover?: Mover }[]} */ let LEAVES;   // the doors drawn, each with the layers its leaf gets
if (WHOLE) {
  STILL = MODEL.CELLS.concat(MODEL.ROOF_CELLS, MODEL.STAIR_CELLS, MODEL.FIXTURES, MODEL.SITE_CELLS);
  LEAVES = DOORS.map(d => ({ door: d, layers: [] }));
} else {
  STILL = []; LEAVES = [];
  const seen = new Set(), signature = c => c.element + '|' + c.S.x1 + '|' + c.S.x2 + '|' + c.S.poly.join(' ');   // a wall two rooms share is drawn once
  for (const p of PARTS) for (const o of p.objects) {
    const layer = 'object:' + p.room.id + '/' + (o.host || o.id);
    if (!o.host) {
      const b = o.cells.map(c => { const ys = c.S.poly.map(q => q[0]), h = hRange(c.S); return [c.S.x1, c.S.x2, Math.min(...ys), Math.max(...ys), ...h]; });
      const middle = [0, 1, 2].map(k => (Math.min(...b.map(q => q[2 * k])) + Math.max(...b.map(q => q[2 * k + 1]))) / 2);
      const normal = NORMAL[o.side], k = normal.findIndex(v => v !== 0), box = [0, 1, 2, 3, 4, 5].map(i => (i % 2 ? Math.max : Math.min)(...b.map(q => q[i])));
      OBJECTS.push({ layer, middle, normal, box, k, inner: normal[k] > 0 ? box[2 * k] : box[2 * k + 1] });
    }
    /* a room ignores the floors: a solid split at a floor is one solid again (one line round it) */
    for (const c of o.cells) if (!seen.has(signature(c))) { seen.add(signature(c)); STILL.push(Object.assign({}, c, { room: p.room.id, layers: c.layers.filter(k => !VIEW.floors.includes(k)).concat(layer) })); }
    if (o.leaf && !LEAVES.some(l => l.door === o.leaf)) LEAVES.push({ door: o.leaf, layers: [layer] });
  }
}
/* the house's parts (core/parts.js), as a room's furniture gives its own: its cells standing still, each door's leaf moving
   about its hinge */
const HOUSE_PARTS = Parts.create({ place: {}, level: 0, looks: MATERIALS, metal: '', ceiling: 0 });
HOUSE_PARTS.still(STILL);
for (const l of LEAVES) l.part = HOUSE_PARTS.moving({ cells: l.door.cells.map(c => Object.assign({}, c, { layers: c.layers.concat(l.layers) })),
  at: [l.door.axis[0], l.door.axis[1], 0], how: { axis: [0, 0, 1], angle: l.door.angle * DEG } });


/* ================= SCENE ================= */
const LIGHT = WHOLE ? VIEW.light : Object.assign({}, VIEW.light, VIEW.light.inside, {
  sun: Object.assign({}, VIEW.light.sun, VIEW.light.inside.sun), sky: Object.assign({}, VIEW.light.sky, VIEW.light.inside.sky) });
const BODY = UNION ? [[UNION[0], UNION[2], UNION[4]], [UNION[1], UNION[3], UNION[5]]] : [[ROOF.x[0], 0, level(FLOORS[0])], [ROOF.x[1], WIDTH, RIDGE_TOP]];
V.relight(LIGHT, [0, 1, 2].map(k => (BODY[0][k] + BODY[1][k]) / 2), !WHOLE);   // a room: the inside light and the lamps in physical units
for (const f of FURNITURE) {
  const own = PARTS.find(p => p.room === f.room), ceilings = own ? own.objects.filter(o => o.role === 'ceiling').map(o => 'object:' + f.room.id + '/' + o.id) : [];
  f.made = RoomParts.build(f.prepared, { materials: MATERIALS, layers: [f.room.floor.id, 'furniture'], ceilingLayers: ceilings, library: LIB });
  f.shown = V.show(f.made.parts, { layers: [f.room.floor.id, 'furniture'], apart: f.made.apart });
  STILL.push(...f.made.STATIC);
  for (const [k, m] of Object.entries(f.made.tiles.materials)) MATERIALS[k] ||= m;
  if (f.made.tiles.pieces.length) V.buildMeshes(onTheirObjects(f.made.tiles.pieces, [f.room.floor.id]));
}
const SOLIDS = WHOLE ? MODEL.SOLIDS.concat(...FURNITURE.map(f => f.made.STATIC)) : STILL;   // what the walk bumps into
const PIECES = piecesOf(STILL);
V.buildMeshes(PIECES); V.buildEdges(PIECES);
const shownHouse = V.show(HOUSE_PARTS);   // its moving parts: the doors
for (const l of LEAVES) l.mover = shownHouse.cores.get(l.part);

/* ================= THE FLOOR TILES =================
   house.js sets them (house/project.md): one layout for each node that sets tiles, over the rooms that take them from it.
   The viewer may change a layout's product, pattern, direction, origin and grout (kept in the browser, state.layouts:
   what differs from the data); each is laid and counted over all its rooms, drawn in the rooms shown */
const SHOWN_ROOMS = new Set((WHOLE ? ROOMS : PART.map(id => ROOM[id])).map(r => r.id));
const PASSAGES = MODEL.OPENINGS.filter(o => HOUSE.geometry.openingKinds[o.kind].passage), PASSAGE_BOXES = PASSAGES.map(o => o.b);
if (!state.layouts) state.layouts = {};
const LAID = {};                           // key -> {L: the laying, P: the product, laid: its rooms, pieces, count, made: its meshes}
/* the laying of a layout: the data, then what the viewer changed; a changed product, pattern or direction fits the origin anew */
function laying(D) {
  const v = state.layouts[D.key] || {}, product = TILE_PRODUCTS[v.product] ? v.product : D.product, P = TILE_PRODUCTS[product];
  const changed = product !== D.product || (v.pattern && v.pattern !== (D.pattern || P.pattern)) || (v.dir && v.dir !== D.dir);
  return { product, pattern: v.pattern || D.pattern || P.pattern, dir: v.dir || D.dir, grout: v.grout || LIB.textures[P.texture].grout,
    oa: v.oa ?? (changed ? null : D.oa), ob: v.ob ?? (changed ? null : D.ob) };
}
/* a layout laid over its rooms (room/tiles.js), drawn in the rooms shown; a fitted origin kept with the viewer's changes */
function layTiles(D) {
  const L = laying(D), P = TILE_PRODUCTS[L.product], F = Tiles.floor(L, P, D.rooms, PASSAGE_BOXES, level(D.floor));
  if (L.oa === null || L.ob === null) { Object.assign(L, { oa: F.oa, ob: F.ob }); Object.assign(state.layouts[D.key] ||= {}, { oa: F.oa, ob: F.ob }); }
  const old = LAID[D.key];
  if (old) V.removeMeshes(old.made);
  const made = Tiles.floorPieces(L, P, LIB.textures[P.texture], F, SHOWN_ROOMS, level(D.floor), TILES, { layers: [D.floor.id].concat(TILES.layers) });
  for (const [k, m] of Object.entries(made.materials)) MATERIALS[k] ||= m;
  LAID[D.key] = { D, L, P, laid: F.laid, pieces: F.pieces, count: F.count, made: V.buildMeshes(onTheirObjects(made.pieces, [])) };
}
const LAYOUTS = MODEL.LAYOUTS.filter(D => TILE_PRODUCTS[D.product]);
for (const D of LAYOUTS) layTiles(D);
const layoutOf = r => LAYOUTS.find(D => D.rooms.includes(r));

/* ================= STATE, LAYERS ================= */
let { layerOn } = UI.layerSwitch(LAYER, () => state.layers);
/* another active room: its furniture's layers */
function active() {
  ROOM_LAYERS = roomLayers(); LAYER = UI.layerTree(Object.assign({}, VIEW.layers, ROOM_LAYERS));
  ({ layerOn } = UI.layerSwitch(LAYER, () => state.layers)); apply();
}
const ROOM_VIEW = new Set(WHOLE ? [] : VIEW.floors);   // a room shows whatever the floors are switched to
const HANDLE = 'cup';                      // the handles drawn: cup or bar (each front has both)
const shown = layers => layers.every(k => k === 'cup' || k === 'bar' ? k === HANDLE : !LAYER[k] || ROOM_VIEW.has(k) || layerOn(k));
let HIDDEN = new Set();                    // the objects of a part the camera is beyond
const ghost = layers => layers.some(k => HIDDEN.has(k));
/* the open floor of the whole house: the highest floor shown with the roof off */
function openFloor() {
  if (!WHOLE || shown(ROOF.layers)) return null;
  const on = FLOORS.filter(F => layerOn(F.id));
  return on.length ? on[on.length - 1] : null;
}
function apply() {
  V.showPieces(shown, layerOn, ghost);
  for (const f of FURNITURE) f.shown.showDetails(layers => shown(layers) && !ghost(layers));
  V.redraw();
}
/* a part: the walls, the floor and the ceiling the camera is beyond hide, as it moves */
const MARGIN = 50;                         // mm beyond an object's middle before it hides
const frameStep = () => {
  if (WHOLE) return false;
  const c = V.cameraAt(), now = new Set(OBJECTS.filter(o => o.normal.reduce((s, n, k) => s + n * (c[k] - o.middle[k]), 0) >= MARGIN).map(o => o.layer));
  if (now.size === HIDDEN.size && [...now].every(k => HIDDEN.has(k))) return false;
  HIDDEN = now; apply(); return true;
};

/* ================= 3D: cameras, sun, clicks, walk ================= */
const SUN = UI.sunStore(VIEW.light);
const placeSun = () => { V.placeSun(SUN.state); for (const f of FURNITURE) f.shown.night(!!SUN.state.night); };
ui.sun = { rects: MODEL.FOOTPRINT, mark: PART.flatMap(id => ROOM[id].rects), sun: SUN.state, change: () => { SUN.save(); placeSun(); } };
/* the cameras: the house's and the open floor's; of a part, over it and from two corners, framed by its box */
function cameras() {
  if (WHOLE) {
    const F = openFloor(), own = F && T.setting(F, 'view.cameras');
    return VIEW.cameras.concat(own && own.from === F ? own.value.map(c => ({ name: c.name, eye: [c.eye[0], c.eye[1], c.eye[2] + level(F)], target: [c.target[0], c.target[1], c.target[2] + level(F)] })) : []);
  }
  const own = PART.length === 1 && FURNITURE.find(f => f.room.id === PART[0]);   // a room's own cameras (its scene)
  if (own && own.prepared.scene.cameras) {                  // in the room's axes
    const p = T.place(own.room.node), at = v => [v[0] + p[0], v[1] + p[1], v[2] + p[2]];
    return own.prepared.scene.cameras.map(c => ({ name: c.name, eye: at(c.eye), target: at(c.target) }));
  }
  const EYE = 1600, LOOK = 900;            // mm over the floor: a person's eyes; what they look at
  const floors = FLOORS.filter(F => PARTS.some(p => p.floor === F));
  return floors.flatMap(F => {
    const own = PARTS.filter(p => p.floor === F), [x1, x2, y1, y2] = [0, 1, 2, 3].map(k => (k % 2 ? Math.max : Math.min)(...own.map(p => p.box[k])));
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, size = Math.max(x2 - x1, y2 - y1), L = level(F);
    const above = { name: 'Above', eye: [cx, cy + 1, L + 2.4 * size], target: [cx, cy, L] };
    const corner = { name: 'Corner', eye: [x1 - 0.5 * size, y1 - 0.5 * size, L + EYE + 0.4 * size], target: [cx, cy, L + LOOK] };
    const opposite = { name: 'Opposite', eye: [x2 + 0.5 * size, y2 + 0.5 * size, L + EYE + 0.4 * size], target: [cx, cy, L + LOOK] };
    /* rooms on several floors: two views of each floor, named by it */
    return floors.length === 1 ? [above, corner, opposite] : [Object.assign(corner, { name: F.name }), Object.assign(above, { name: F.name + ' above' })];
  });
}
/* a click: a door opens or closes */
const click = ray => {
  if (state.mode !== '3d') return;
  const m = V.moverAt(ray);
  if (m) V.toggle(m);
};
/* the walk stands on the walkable solids and, through a passage (a door), on its floor: the floor runs on through it */
/** @type {Cell[]} */
const PASSAGE_FLOORS = PASSAGES.map(o => ({ S: prism([o.b[0], o.b[1], o.b[2], o.b[3], o.b[4] - 1, o.b[4]]), layers: [] }));
const startOf = () => {
  if (WHOLE) return VIEW.walk.start;
  const q = ROOM[PART[0]].rects[0];
  return { x: (q[0] + q[1]) / 2, y: (q[2] + q[3]) / 2, heading: VIEW.walk.start.heading };
};
V.enableWalk({ config: Object.assign({}, VIEW.walk, { start: startOf() }), solids: SOLIDS, ground: /** @type {Cell[]} */ (STILL.filter(c => c.walkable)).concat(PASSAGE_FLOORS),
  startLevel: WHOLE ? level(FLOORS[0]) : level(PARTS[0].floor), pad: /** @type {HTMLElement} */ ($('pad')), canStart: () => state.mode === '3d' && WHOLE, onToggle: () => { ui.walking = V.walk.on; apply(); }, home: () => cameras()[0] });
/* on a walk, Space: the nearest door within reach, on the walker's floor */
const DOOR_REACH = 1500;                   // mm from the walker to the middle of a leaf
const key = e => {
  if (e.key !== ' ' || !V.walk.on) return;
  const w = V.walk, near = LEAVES.filter(l => MODEL.floorOf(w.h + 1) === l.door.floor).map(l => /** @type {[typeof l, number]} */ ([l, Math.hypot(l.door.centre[0] - w.x, l.door.centre[1] - w.y)]))
    .filter(([, r]) => r <= DOOR_REACH).sort((a, b) => a[1] - b[1])[0];
  if (near && near[0].mover) { V.toggle(near[0].mover); e.preventDefault(); }
};

/* ================= 2D: one sheet per floor (house/plan.js) ================= */
const PLAN = HousePlan.create(MODEL, MATERIALS);
const planSvg = () => PLAN.svg({ parts: PARTS, still: STILL, doors: LEAVES.map(l => l.door), furniture: FURNITURE.map(f => ({ floor: f.room.floor, plan: f.made.plan(f.shown.footprints) })) });
const drawPlan = () => { ui.plan = { svg: planSvg(), note: PLAN.note() }; };
const PLAN_MENU = [{ name: 'Fit', label: 'The whole sheet', go: () => { state.zoom = 1; } },
  { name: 'Save SVG', go: () => UI.download(planSvg(), 'image/svg+xml', WHOLE ? 'house.svg' : PART.join('-') + '.svg') }];

/* ================= DOCUMENTS: the rooms, the doors, the notes ================= */
let SHEET = null;
function book() {
  const title = WHOLE ? HOUSE.name : PART.map(id => roomName(ROOM[id])).join(', ');
  const furnitureOf = n => !WHOLE && (FURNITURE.find(f => f.room.id === n.id) || {}).prepared;   // the whole house stops at its rooms
  const tree = WHOLE ? HouseDocs.elements(title, DATA, [{ node: HOUSE, path: '', level: 1 }], furnitureOf)
    : HouseDocs.elements(title, null, PART.map(id => ({ node: ROOM[id].node, path: T.path(ROOM[id].node), level: 0 })), furnitureOf);
  const test = HouseDocs.test(WHOLE ? 'Test of the house' : 'Test of ' + title, CHECKS);
  if (!WHOLE) {                              /* a furnished room's own Documents first: its estimate, cut list, assembly cards and notes */
    const own = FURNITURE.filter(f => f.docs).flatMap(f => { const b = f.docs.book(); return [b.sheets[0], b.sheets[1], { name: 'Assembly', node: assemblyNode(f) }, b.sheets[2]]; });
    return { sheets: [...own, tree, test] };   // a room's view: its own Documents, the house's stay with the house
  }
  const laid = Object.values(LAID).map(A => ({ P: A.P, rooms: A.D.rooms, count: A.count }));
  return { sheets: [HouseDocs.rooms(MODEL, ROOMS), HouseDocs.tiles(laid, TILES.reserve), HouseDocs.doors(LEAVES.map(l => l.door), FLOORS, LIB), HouseDocs.notes(HOUSE), tree, test] };
}
/* the assembly cards of a room's furniture: one element, kept (core/sheet.js shows it in its tab) */
function assemblyNode(f) {
  if (f.assembly) return f.assembly;
  const a = f.docs.assembly(), box = document.createElement('section');
  box.className = 'assembly';
  box.innerHTML = '<p class="note">All for one carcass in one place, to gather the parts on site. The parts without a carcass by group and column (G1[4] = group 1, column 4; G1[1-3] = columns 1 to 3). Sizes in mm.</p>'
    + '<p class="note">' + a.legend + '</p><div class="asm">' + a.cards + '</div>';
  return (f.assembly = box);
}
/* a room's furniture in the panel: its metal, and each of its boards (the roles it is used for) with its stand-ins */
function finishPanel(f) {
  const own = FINISH[f.room.id] || {}, roles = {}, words = s => s.replace(/[A-Z]/g, c => ' ' + c.toLowerCase());
  for (const [role, k] of Object.entries(f.data.cabinets.settings.materials)) (roles[k] ||= []).push(words(role));
  const boards = Object.entries(roles).map(([k, rs]) => ({ from: k, value: (own.boards || {})[k] || k, roles: rs.join(', ').replace(/^./, c => c.toUpperCase()),
    options: LIB.standIns(k).map(j => ({ k: j, name: LIB.boardName(j) })) })).filter(b => b.options.length > 1);
  return { metal: own.metal || f.data.scene.finish.metal, metals: LIB.metals, boards, changed: !!FINISH[f.room.id] };
}
/* a layout in the panel: its settings only (what is laid and what it costs: Documents) */
function layoutPanel(A, changed) {
  const { D, L } = A;
  return { key: D.key, L,
    products: Object.entries(TILE_PRODUCTS).map(([k, p]) => ({ k, name: p.name })),
    patterns: Object.entries(Tiles.PATTERNS).map(([k, [name]]) => ({ k, name })), dirs: Object.entries(Tiles.DIRS).map(([k, name]) => ({ k, name })),
    changed: !!changed };                  // the viewer changed it: it may go back to the data
}
function documents() {
  if (SHEET) return SHEET.set(book());
  if (!ui.docs) ui.docs = { title: ui.title, subtitle: ui.subtitle, book: book(), ready: s => { SHEET = s; } };
}

/* ================= TEST ================= */
/* the whole house: the checks of the house (its tree, its model, the library); a room: its own (its furniture) */
/** @type {Check} */
const ASKED_CHECK = { name: 'Every room asked for is a room of the house', about: 'The rooms named in the address (?room=…) are rooms of house.js.', items: ASKED.filter(id => !ROOM[id]) };
const HOUSE_CHECKS = [ASKED_CHECK].concat(T.checks(), MODEL.checks(), LIB.checks(),
  Tiles.checks(MODEL.LAYOUTS, TILE_PRODUCTS, LIB.textures, Object.values(LAID).map(A => ({ key: A.D.key, count: A.count }))));
const ROOM_CHECKS = FURNITURE.flatMap(f => f.made.checks().concat(f.docs ? f.docs.checks() : [], RoomModel.finishChecks(f.used, f.prepared, LIB)).map(c => Object.assign(c, { name: (FURNITURE.length > 1 ? roomName(f.room) + ' · ' : '') + c.name })));
const CHECKS = WHOLE ? HOUSE_CHECKS : [ASKED_CHECK, ...(ROOM_CHECKS.length ? ROOM_CHECKS
  : [{ name: 'No checks of its own', about: 'This room has nothing of its own to check yet; the house\'s checks are in the whole house\'s Documents.', items: [], info: true }])];

/* ================= THE SCREEN =================
   top-left: House or Room, the floors and their rooms (the active room) · top-right: the modes · below: the
   mode's actions · the panel: the mode's tabs (View: the floors, the layers, the furniture) */
function onMode(m) {
  if (m !== '3d') V.stopWalk();
  if (m === '2d') drawPlan();
  if (m === 'documents') documents();
  apply();
}

placeSun(); if (!keep) V.setCamera(cameras()[0]);
onMode(state.mode);
/** @type {any} */ (window).HOUSE_VIEW = { MODEL, LAID, PART, PARTS, CHECKS, STILL, LEAVES, OBJECTS, FURNITURE, V, setMode: m => ui.pick(m), setLayer: (k, on) => ui.setLayer(k, on), state, planSvg, book,   // for the automated tests
  get hidden() { return [...HIDDEN]; }, pieces: PIECES.length, edges: V.EDGE_GROUPS.length, show };
return { click, frame: frameStep, key, active, P: {
  onMode, apply,
  /* the layers in blocks: where (the floors and the roof; the whole house only), what (the elements), the furniture of a
     room; a solid shows when all its layers are on */
  layerBlocks() {
    const list = top => UI.layerList(LAYER, top, state.layers, layerOn);
    return [{ name: 'Floors', id: 'floors', tab: 'view', items: WHOLE ? list(VIEW.floors) : [] }, { name: 'Layers', id: 'layers', tab: 'view', items: list(VIEW.elements) },
      { name: 'Furniture', id: 'furniture', tab: 'view', items: list(Object.keys(ROOM_LAYERS)) }];
  },
  /* Finish: the active room, its furniture's finish and its floor's layout; null: not shown here */
  finish() {
    const v = state.layouts;               // read, so the panel follows a change
    const r = ROOM[activeId()];
    if (!r || !SHOWN_ROOMS.has(r.id)) return null;
    const D = layoutOf(r), A = D && LAID[D.key], f = FURNITURE.find(f => f.room === r);
    return { room: r.id, layout: A ? layoutPanel(A, v[D.key]) : null, furniture: f ? finishPanel(f) : null, ownTiles: !!(f && f.prepared.scene.tiles) };
  },
  /* a change of a room's finish: field metal, board (from: the data's board) or reset; the room is prepared and the view built again */
  setFinish(id, field, from, value) {
    const data = FURNITURE.find(f => f.room.id === id).data, own = FINISH[id] || (FINISH[id] = {});
    if (field === 'reset') delete FINISH[id];
    else if (field === 'metal') { if (value === data.scene.finish.metal) delete own.metal; else own.metal = value; }
    else { const b = own.boards || (own.boards = {}); if (value === from) delete b[from]; else b[from] = value; if (!Object.keys(b).length) delete own.boards; }
    if (FINISH[id] && !Object.keys(FINISH[id]).length) delete FINISH[id];
    PREPARED.delete(id); show(ASKED, true);
  },
  setTiles(key, field, value) {
    const D = LAYOUTS.find(l => l.key === key), v = state.layouts[key] ||= {};
    if (field === 'reset') delete state.layouts[key];
    else if (field === 'fit') { v.oa = v.ob = null; }
    else if (field === 'product') Object.assign(v, { product: value, pattern: undefined, grout: undefined, oa: null, ob: null });
    else if (field === 'pattern' || field === 'dir') Object.assign(v, { [field]: value, oa: null, ob: null });
    else v[field] = field === 'grout' ? value : Math.round(+value);
    layTiles(D); apply();
    if (SHEET) SHEET.set(book());
  },
  /* below: the mode's actions */
  menus() {
    /** @type {MenuItem[]} */
    const walk = WHOLE ? [{ name: 'Walk', cls: 'walk', pressed: ui.walking, go: () => (V.walk.on ? V.stopWalk() : V.startWalk()) }] : [];   // a walk: the whole house only
    const go = c => ({ name: c.name, go: () => { V.stopWalk(); V.flyTo(c); } });
    return { '3d': [walk.concat(UI.openAll(ui, V)), cameras().map(go)], '2d': [PLAN_MENU], documents: [Sheet.menu(() => SHEET, (WHOLE ? 'house' : PART.join('-')) + '.xlsx')], cabinets: ui.designMenus() };
  }
} };
}
}
