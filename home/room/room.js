/* room/room.js: one room put together from what the page hands it: the room from the house (its node: origin and height),
   the room's files (cabinets, scene) and the library. It places the groups of furniture where the scene says, builds the
   cabinets (room/cabinets.js), the products (library/draw.js) and the lamps, in the house's axes (x, y, h; mm).
   prepare() needs no browser: the model, the places of the groups, the hardware as drawn, the looks and textures the
   room needs. build() draws into a scene of core: still cells, moving parts, details (round or flat things, three.js
   meshes), lamps. */
(function () {
'use strict';
const C = () => HOME.cabinets, G = () => HOME.geometry;

/* the way a group faces: X, the house's direction of the group's x (left to right seen from the front), Y of its y (out of
   the fronts); a quarter turn and a mirror (the group's x, y, h are left-handed), so what is drawn comes out as built.
   W: which corner of its box in the room lies on its wall line at x = 0 */
const FRONTS = {
  y0: { Y: [0, -1], X: [1, 0], W: [0, 1] },
  y1: { Y: [0, 1], X: [-1, 0], W: [1, 0] },
  x0: { Y: [-1, 0], X: [0, -1], W: [1, 1] },
  x1: { Y: [1, 0], X: [0, 1], W: [0, 0] }
};

/* room: {offset [x, y, h] of its origin in the house, size}; files: {cabinets, scene}; library: {products: group -> products, materials} */
function prepare(room, files, library) {
  const P = library.products, cabinets = files.cabinets, scene = files.scene;
  const project = C().withLibrary(cabinets, P.boards), appliances = C().appliances(project, P.appliances);
  const model = C().build(project, appliances), O = room.offset;
  /* a group: its box in the room (scene) with its back on the wall line; y = 0 at the carcass backs, the wall at y = wall */
  const PLACE = {};
  for (const [r, g] of Object.entries(scene.groups)) {
    const F = FRONTS[g.front], wall = model.groups[r] ? model.groups[r].wall : 0;
    const x = O[0] + g.offset[0] + F.W[0] * g.size[0], y = O[1] + g.offset[1] + F.W[1] * g.size[1];
    PLACE[r] = { O: [x - wall * F.Y[0], y - wall * F.Y[1]], X: F.X, Y: F.Y, box: [0, 1, 2].flatMap(k => [O[k] + g.offset[k], O[k] + g.offset[k] + g.size[k]]) };
  }
  /* the hardware as drawn: the products' sizes (the maker's) and the scene's layout (ours) */
  const product = key => P.hardware[key], H = cabinets.settings.hardware, L = scene.hardware;
  const leg = product(H.leg), grille = product(H.plinthGrille), drawer = product(H.drawer);
  const HW = {
    handle: Object.assign({ cupLength: product(H.handle).length }, L.handle),
    handles: L.handles, open: L.open, bins: L.bins,
    leg: Object.assign({ radius: leg.radius, footRadius: leg.footRadius, footHeight: leg.footHeight }, L.leg),
    hinge: { cupDepth: product(H.hinge).cupDepth },
    drawer: { runnerWidth: drawer.runnerWidth, sideThickness: drawer.sideThickness, sideFromCarcass: drawer.sideFromCarcass, fromBack: drawer.fromBack, fromFront: drawer.fromFront },
    plinthGrille: { width: grille.width, bottom: L.plinthGrille.bottom, top: L.plinthGrille.bottom + grille.height }
  };
  /* the looks this room adds to the library's: its boards, its walls' paint, the handles' metal, the lamps' shade */
  const TREE = C().tree(model, appliances, { install: scene.installation, ceiling: room.size[2], HW });
  const looks = Object.assign(C().boardLooks(model), {
    wall: { color: scene.room.wallColor, roughness: 0.95, reflect: 0.45 },
    shade: { color: model.materials[model.materialFor.cabinet].color, roughness: 0.5, metalness: 0.2 }
  });
  const textures = Object.values(model.materials).map(m => m.texture).filter(Boolean);
  return { room, cabinets, scene, model, TREE, appliances, PLACE, HW, looks, textures, level: O[2], ceiling: room.size[2] };
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
function build(V, prepared, opts = {}) {
  const { model, appliances, PLACE, HW, scene } = prepared, LEVEL = prepared.level, CEILING = prepared.ceiling;
  const MATERIALS = opts.materials, EXTRA = opts.layers || [];
  const { piecesOf } = HOME.surface;
  const STATIC = [], MOVERS = [], DETAILS = [], ENVELOPES = [], LAMPS = [], UNDRAWN = [];
  let PART = 0;
  const part = () => ++PART;
  const point = (r, x, y, h) => { const { O, X, Y } = PLACE[r]; return [O[0] + x * X[0] + y * Y[0], O[1] + x * X[1] + y * Y[1], LEVEL + h]; };
  /* a box of group r [x0, x1, y0, y1, h0, h1] -> a box of the house [x1, x2, y1, y2, h1, h2] */
  function houseBox(r, b) {
    const xs = [], ys = [];
    for (const x of [b[0], b[1]]) for (const y of [b[2], b[3]]) { const p = point(r, x, y, 0); xs.push(p[0]); ys.push(p[1]); }
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), LEVEL + b[4], LEVEL + b[5]];
  }
  /* a solid is a cell of core: {S, material, layers, part, info}. part: one board or piece (a joint between two parts shows
     a line, a box of the same part none); info: what it is. Layers: its group, its layer, the host's. Glass and wire draw no edges. */
  function box(list, r, gb, key, layer, info = {}) {
    if (!gb.every(Number.isFinite)) { UNDRAWN.push((info.name || layer) + ': ' + gb.join(', ')); return null; }
    if (!(gb[1] > gb[0] && gb[5] > gb[4] && gb[3] > gb[2])) return null;   // an empty box: nothing drawn
    const hb = houseBox(r, gb);
    const c = { S: G().prism(hb), element: info.name || layer, material: key, cap: key, layers: ['g' + r, layer].concat(info.also || [], EXTRA),
      edges: MATERIALS[key].opacity === undefined, part: info.part || part(), r, gb, hb, info, batch: info.batch };
    list.push(c);
    return c;
  }
  /* a prism over a convex profile [[y, h]] across x0..x1 of group r: only where the group runs along the house's x */
  function profile(list, r, x0, x1, prof, info, faceMaterial) {
    const { O, X, Y } = PLACE[r];
    if (Math.abs(X[0]) < 0.5) return null;
    const xs = [O[0] + x0 * X[0], O[0] + x1 * X[0]];
    const c = { S: { x1: Math.min(...xs), x2: Math.max(...xs), poly: G().ccw(prof.map(([y, h]) => [O[1] + y * Y[1], LEVEL + h])) }, material: faceMaterial([0, 0, 1]),
      element: info.name, layers: ['g' + r, info.layer].concat(EXTRA), edges: true, part: part(), r, info, faceMaterial };
    c.cap = c.material;
    list.push(c);
    return c;
  }

  /* details: what is round or flat (handles, knobs, legs, rings, displays, lamps) is not a solid of core but a plain mesh in
     the frame of its group at (x, y, h), mm; its own axes are three.js's: x along the group, y up, z out of the wall */
  const FRAMES = new Map();
  function frameOf(r, parent) {
    const key = parent.uuid + '|' + r;
    if (FRAMES.has(key)) return FRAMES.get(key);
    const { O, X, Y } = PLACE[r], f = new THREE.Group();
    f.matrixAutoUpdate = false;
    f.matrix.makeBasis(new THREE.Vector3(X[0], X[1], 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(Y[0], Y[1], 0)).setPosition(O[0], O[1], LEVEL);
    parent.add(f); FRAMES.set(key, f);
    return f;
  }
  /* where details go: group r, layers, the moving part they move with */
  const at = (r, layer, mover, also = []) => ({ r, frame: frameOf(r, mover ? mover.holder : V.root), layers: (layer === 'lamps' ? [] : ['g' + r]).concat(layer, also, EXTRA), mover });
  function detail(a, geometry, key, x, y, h, shadow = true) {
    const material = typeof key === 'string' ? V.material(key) : key, m = new THREE.Mesh(geometry, material);
    m.position.set(x, h, y); m.castShadow = shadow && !material.transparent; m.receiveShadow = shadow;
    a.frame.add(m); DETAILS.push({ mesh: m, layers: a.layers, moves: !!a.mover });
    return m;
  }
  /* a cylinder upright, or along x ('x') or y ('y'), centred on (x, y, h) */
  function cylinder(a, radius, length, key, x, y, h, axis, segments = 20, shadow) {
    const m = detail(a, new THREE.CylinderGeometry(radius, radius, length, segments), key, x, y, h, shadow);
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'y') m.rotation.x = Math.PI / 2;
    return m;
  }
  function textMaterial(text) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 80;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 256, 80);
    g.fillStyle = '#7dd3fc'; g.font = '500 52px "IBM Plex Mono",monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 42);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    return new THREE.MeshBasicMaterial({ map: t });
  }
  const display = (a, text, w, high, x, y, h) => detail(a, new THREE.PlaneGeometry(w, high), textMaterial(text), x, y, h, false);

  /* moving parts: a door, a drawer or an appliance door; its cells (built closed) and details are collected first, the
     part of core is made when all is drawn. parent / children: what opens only behind it (an inner drawer, drawers
     behind a door) */
  function mover(r, kind, px, py, ph) {
    const m = { r, kind, P: point(r, px, py, ph), holder: new THREE.Group(), cells: [], sign: 1, label: '', parent: null, children: [], item: null, travel: null, swing: null };
    MOVERS.push(m);
    return m;
  }
  const linkTo = (parent, child) => { child.parent = parent; parent.children.push(child); };
  const envelope = (r, gb, name, kind = 'appliance') => ENVELOPES.push({ kind, name, r, gb });
  /* boxes open at the front (+y) or at the top (+h), walls t thick; one part */
  function openFront(list, r, [x0, x1, y0, y1, h0, h1], t, key, layer, info) {
    const I = Object.assign({ part: part() }, info);
    for (const b of [[x0, x0 + t, y0, y1, h0, h1], [x1 - t, x1, y0, y1, h0, h1], [x0 + t, x1 - t, y0, y1, h0, h0 + t], [x0 + t, x1 - t, y0, y1, h1 - t, h1], [x0 + t, x1 - t, y0, y0 + t, h0 + t, h1 - t]]) box(list, r, b, key, layer, I);
  }
  function openTop(list, r, [x0, x1, y0, y1, h0, h1], t, key, layer, info) {
    const I = Object.assign({ part: part() }, info);
    for (const b of [[x0, x0 + t, y0, y1, h0, h1], [x1 - t, x1, y0, y1, h0, h1], [x0 + t, x1 - t, y0, y0 + t, h0, h1], [x0 + t, x1 - t, y1 - t, y1, h0, h1], [x0 + t, x1 - t, y0 + t, y1 - t, h0, h0 + t]]) box(list, r, b, key, layer, I);
  }
  /* a lamp: off by day */
  function lamp(light, from, to, shadow) {
    light.position.copy(V.toWorld(...from));
    if (to) { light.target.position.copy(V.toWorld(...to)); V.scene.add(light.target); }
    light.visible = false; V.scene.add(light);
    LAMPS.push({ light, shadow });
    if (shadow) { light.shadow.mapSize.set(1024, 1024); light.shadow.camera.near = 0.1; light.shadow.camera.far = (from[2] - LEVEL) / 1000 + 0.3; light.shadow.bias = -0.0002; light.shadow.normalBias = 0.015; }
  }
  const D = { V, box, at, detail, cylinder, display, mover, linkTo, envelope, openFront, openTop, profile, part, lamp, point, STATIC, CEILING,
    frame: r => PLACE[r], material: key => V.material(key), has: key => key in MATERIALS };

  /* the cabinets, with their products */
  const drawn = C().draw(D, model, appliances, HW, scene.installation);

  /* the lamps of the scene: pendants centred over the worktop of their group, downlights at {group, x, y} (y from the
     wall) or between the axes of the sink and the hob; a downlight hides with the ceiling, not with its group */
  const Lt = scene.lights;
  if (Lt) {
    const Pd = Lt.pendants, r = String(Pd.group), wt = model.worktops[r] || { y0: 0, y1: 0 }, top = model.groups[r].items.find(i => i.type === 'worktop');
    const mid = top ? (top.x0 + top.x1) / 2 : model.groups[r].widths.reduce((s, w) => s + w, 0) / 2, a = at(r, 'lamps');
    for (let i = 0; i < Pd.count; i++) HOME.draw.pendant(D, { a, r, x: mid + (i - (Pd.count - 1) / 2) * Pd.spacing, y: (wt.y0 + wt.y1) / 2, bottom: Lt.pendantBottom, ceiling: CEILING });
    for (const d of Lt.downlights) {
      const g = String(d.group), x = d.between ? d.between.reduce((s, k) => s + drawn.axes[k], 0) / d.between.length : d.x, y = model.groups[g].wall + d.y;
      const a = at(g, 'ceiling', null, opts.ceilingLayers || []); a.layers = a.layers.filter(k => k !== 'g' + g);
      HOME.draw.downlight(D, { a, r: g, x, y, ceiling: CEILING });
    }
  }

  /* the moving parts of core: a door turns about its hinge (h), a dishwasher's door and a bottom-hinged oven door about
     X, a drawer slides out along Y; built closed */
  const SWING = { door: 'h', fridge: 'h', dishwasher: 'x', drawer: 'slide' };
  for (const m of MOVERS) {
    const open = m.travel ?? (m.kind === 'drawer' ? HW.open.drawer : HW.open.angle[m.kind] || 0), { X, Y } = PLACE[m.r], swing = m.swing || SWING[m.kind];
    const how = swing === 'slide' ? { slide: [open * Y[0], open * Y[1], 0] } : swing === 'x' ? { axis: [X[0], X[1], 0], angle: open } : { axis: [0, 0, 1], angle: -m.sign * open };
    m.core = V.mover(Object.assign({ pieces: piecesOf(m.cells), at: m.P, behind: m.parent ? m.parent.core : null, label: m.label }, how));
    m.core.inner.add(m.holder);
  }
  for (const d of DETAILS) d.mesh.userData.owner = null;

  const night = on => {
    for (const { light, shadow } of LAMPS) { light.visible = on; light.castShadow = on && shadow; }
    for (const k of ['bulb', 'led']) { const mt = V.material(k); mt.emissive.set(on ? 0xfff0dc : 0x000000); mt.emissiveIntensity = on ? 2 : 1; }
  };
  const showDetails = shown => { for (const d of DETAILS) d.mesh.visible = shown(d.layers); };
  const made = { STATIC, MOVERS, DETAILS, ENVELOPES, LAMPS, UNDRAWN, carcasses: drawn.carcasses, night, showDetails,
    cells: () => STATIC.concat(...MOVERS.map(m => m.cells)) };
  /* the 2D plan of the furniture: its cells (what the cut meets) and the outlines seen from above, details too */
  const NOT_SEEN = ['holes', 'hardware', 'legs', 'backs', 'lamps'], SEEN_DETAILS = ['sink', 'hob', 'hood', 'coffee'];
  made.plan = () => {
    V.root.updateMatrixWorld(true);
    const toHouse = new THREE.Matrix4().copy(V.root.matrixWorld).invert(), cells = made.cells();
    return { cells, shapes: cells.filter(c => !c.layers.some(l => NOT_SEEN.includes(l))).map(c => HOME.plan2d.solidShape(c))
      .concat(DETAILS.filter(d => d.layers.some(l => SEEN_DETAILS.includes(l)) && d.mesh.geometry.attributes.position).map(d => HOME.plan2d.meshShape(d.mesh, toHouse))) };
  };
  /* the tree: its rules (core/tree.js) and each group inside the box the scene gives it */
  const treeChecks = () => {
    const out = [];
    for (const g of prepared.TREE) {
      for (const c of HOME.tree.create(g).checks()) for (const i of c.items) out.push(g.id + ': ' + c.name + ': ' + i);
      const s = scene.groups[g.id.slice(1)];
      const size = s && (s.front[0] === 'x' ? [g.size[1], g.size[0], g.size[2]] : g.size);   // the group's x along the house's y when it faces x
      if (s && size.some((v, k) => v > s.size[k] + 0.5)) out.push(`${g.id}: ${size.map(Math.round).join(' × ')} does not fit the scene's box ${s.size.join(' × ')}`);
    }
    return out;
  };
  made.checks = () => [
    { name: 'Room: the furniture as a tree (ids, offsets ≥ 0, every part inside what it belongs to, every group in its box)', items: treeChecks() },
    { name: 'Room: furniture inside its group', items: outside(made, prepared) },
    { name: 'Room: parts with no size', items: UNDRAWN.slice() },
    { name: 'Cabinets: the model', items: model.warnings.slice() }
  ];
  return made;
}

/* the layers of a room's furniture, for its own view: its groups, then its parts by kind */
function layers(prepared) {
  const L = Object.fromEntries(Object.keys(prepared.model.groups).map(r => ['g' + r, { name: 'G' + r + ' · ' + prepared.model.groups[r].name }]));
  return Object.assign(L, {
    carcassParts: { name: 'Carcasses', layers: { carcasses: { name: 'Boards' }, backs: { name: 'HDF backs' }, shelves: { name: 'Shelves' }, drawers: { name: 'Drawers' },
      hardware: { name: 'Hinges, bumpers, runners' }, holes: { name: 'Holes' }, legs: { name: 'Legs' } } },
    frontParts: { name: 'Fronts', layers: { fronts: { name: 'Fronts' }, handles: { name: 'Handles' }, strips: { name: 'Front strips' }, frontPanel: { name: 'Panels' }, plinth: { name: 'Plinth' } } },
    worktopParts: { name: 'Worktop', layers: { worktops: { name: 'Worktops' }, endPanels: { name: 'End panels' }, wallPanel: { name: 'Wall panel' } } },
    appliances: { name: 'Appliances', layers: { sink: { name: 'Sink, tap' }, trap: { name: 'Trap' }, hob: { name: 'Hob' }, hood: { name: 'Hood' }, oven: { name: 'Oven' },
      microwave: { name: 'Microwave' }, coffee: { name: 'Coffee machine' }, fridge: { name: 'Fridge' }, dishwasher: { name: 'Dishwasher' } } },
    plasterboard: { name: 'Plasterboard casing' }
  });
}

HOME.room = { prepare, build, layers };
})();
