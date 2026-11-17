/* room/room.js: one room put together from what the page hands it: the room from the house (its node: origin and height),
   the room's files (cabinets, scene) and the library. It places the groups of furniture where the scene says, builds the
   cabinets (room/cabinets.js), the products (library/draw.js) and the lamps, in the house's axes (x, y, h; mm).
   prepare() needs no browser: the model, the places of the groups, the hardware as drawn, the looks and textures the
   room needs. build() draws into a scene of core: still cells, moving parts, details (round or flat things, three.js
   meshes), lamps. */
(function () {
'use strict';
const C = () => HOME.cabinets, G = () => HOME.geometry;

/* the way a group faces and its axes: N out of its fronts, U along it (N turned a quarter to the left: a group is turned,
   never mirrored); W: which corner of its box lies on its wall line at u = 0 */
const FRONTS = {
  y0: { N: [0, -1], U: [1, 0], W: [0, 1] },
  y1: { N: [0, 1], U: [-1, 0], W: [1, 0] },
  x0: { N: [-1, 0], U: [0, -1], W: [1, 1] },
  x1: { N: [1, 0], U: [0, 1], W: [0, 0] }
};

/* room: {offset [x, y, h] of its origin in the house, size}; files: {cabinets, scene}; library: {products: group -> products, materials} */
function prepare(room, files, library) {
  const P = library.products, cabinets = files.cabinets, scene = files.scene;
  const project = C().withLibrary(cabinets, P.boards), appliances = C().appliances(project, P.appliances);
  const model = C().build(project, appliances), O = room.offset;
  /* a group: its box in the room (scene) with its back on the wall line; n = 0 at the carcass backs, the wall at n = wall */
  const PLACE = {};
  for (const [r, g] of Object.entries(scene.groups)) {
    const F = FRONTS[g.front], wall = model.groups[r] ? model.groups[r].wall : 0;
    const x = O[0] + g.offset[0] + F.W[0] * g.size[0], y = O[1] + g.offset[1] + F.W[1] * g.size[1];
    PLACE[r] = { O: [x - wall * F.N[0], y - wall * F.N[1]], U: F.U, N: F.N, box: [0, 1, 2].flatMap(k => [O[k] + g.offset[k], O[k] + g.offset[k] + g.size[k]]) };
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
  const looks = Object.assign(C().boardLooks(model), {
    wall: { color: scene.room.wallColor, roughness: 0.95, reflect: 0.45 },
    shade: { color: model.materials[model.materialFor.cabinet].color, roughness: 0.5, metalness: 0.2 }
  });
  const textures = Object.values(model.materials).map(m => m.texture).filter(Boolean);
  return { room, cabinets, scene, model, appliances, PLACE, HW, looks, textures, level: O[2], ceiling: room.size[2] };
}

/* the cells of a room outside their group's box: Test */
function outside(made, prepared) {
  const out = [];
  for (const c of made.cells()) {
    const b = prepared.PLACE[c.r] && prepared.PLACE[c.r].box, ys = c.S.poly.map(p => p[0]), hs = c.S.poly.map(p => p[1]);
    const q = [c.S.x1, c.S.x2, Math.min(...ys), Math.max(...ys), Math.min(...hs), Math.max(...hs)];
    if (b && q.some((v, k) => (k % 2 ? v > b[k] + 0.5 : v < b[k] - 0.5))) out.push(`group ${c.r}: ${c.element} ${q.map(Math.round).join(', ')}`);
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
  const point = (r, u, v, n) => { const { O, U, N } = PLACE[r]; return [O[0] + u * U[0] + n * N[0], O[1] + u * U[1] + n * N[1], LEVEL + v]; };
  /* a box of group r [u0, u1, v0, v1, n0, n1] -> a box of the house [x1, x2, y1, y2, h1, h2] */
  function houseBox(r, b) {
    const xs = [], ys = [];
    for (const u of [b[0], b[1]]) for (const n of [b[4], b[5]]) { const p = point(r, u, 0, n); xs.push(p[0]); ys.push(p[1]); }
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), LEVEL + b[2], LEVEL + b[3]];
  }
  /* a solid is a cell of core: {S, material, layers, part, info}. part: one board or piece (a joint between two parts shows
     a line, a box of the same part none); info: what it is. Layers: its group, its layer, the host's. Glass and wire draw no edges. */
  function box(list, r, gb, key, layer, info = {}) {
    if (!gb.every(Number.isFinite)) { UNDRAWN.push((info.name || layer) + ': ' + gb.join(', ')); return null; }
    if (!(gb[1] > gb[0] && gb[3] > gb[2] && gb[5] > gb[4])) return null;   // an empty box: nothing drawn
    const hb = houseBox(r, gb);
    const c = { S: G().prism(hb), element: info.name || layer, material: key, cap: key, layers: ['g' + r, layer].concat(info.also || [], EXTRA),
      edges: MATERIALS[key].opacity === undefined, part: info.part || part(), r, gb, hb, info, batch: info.batch };
    list.push(c);
    return c;
  }
  /* a prism along x over a convex profile [[n, v]] across u0..u1 of group r: only where the group runs along x */
  function profile(list, r, u0, u1, prof, info, faceMaterial) {
    const { O, U, N } = PLACE[r];
    if (Math.abs(U[0]) < 0.5) return null;
    const xs = [O[0] + u0 * U[0], O[0] + u1 * U[0]];
    const c = { S: { x1: Math.min(...xs), x2: Math.max(...xs), poly: G().ccw(prof.map(([n, v]) => [O[1] + n * N[1], LEVEL + v])) }, material: faceMaterial([0, 0, 1]),
      element: info.name, layers: ['g' + r, info.layer].concat(EXTRA), edges: true, part: part(), r, info, faceMaterial };
    c.cap = c.material;
    list.push(c);
    return c;
  }

  /* details: what is round or flat (handles, knobs, legs, rings, displays, lamps) is not a solid of core but a plain mesh in
     the frame of its group, (x, y, z) = (u, v, n) in mm */
  const FRAMES = new Map();
  function frameOf(r, parent) {
    const key = parent.uuid + '|' + r;
    if (FRAMES.has(key)) return FRAMES.get(key);
    const { O, U, N } = PLACE[r], f = new THREE.Group();
    f.matrixAutoUpdate = false;
    f.matrix.makeBasis(new THREE.Vector3(U[0], U[1], 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(N[0], N[1], 0)).setPosition(O[0], O[1], LEVEL);
    parent.add(f); FRAMES.set(key, f);
    return f;
  }
  /* where details go: group r, layers, the moving part they move with */
  const at = (r, layer, mover, also = []) => ({ r, frame: frameOf(r, mover ? mover.holder : V.root), layers: (layer === 'lamps' ? [] : ['g' + r]).concat(layer, also, EXTRA), mover });
  function detail(a, geometry, key, x, y, z, shadow = true) {
    const material = typeof key === 'string' ? V.material(key) : key, m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z); m.castShadow = shadow && !material.transparent; m.receiveShadow = shadow;
    a.frame.add(m); DETAILS.push({ mesh: m, layers: a.layers, moves: !!a.mover });
    return m;
  }
  /* a cylinder along v, or along u ('x') or n ('z'), centred on (u, v, n) */
  function cylinder(a, radius, length, key, u, v, n, axis, segments = 20, shadow) {
    const m = detail(a, new THREE.CylinderGeometry(radius, radius, length, segments), key, u, v, n, shadow);
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'z') m.rotation.x = Math.PI / 2;
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
  const display = (a, text, w, h, u, v, n) => detail(a, new THREE.PlaneGeometry(w, h), textMaterial(text), u, v, n, false);

  /* moving parts: a door, a drawer or an appliance door; its cells (built closed) and details are collected first, the
     part of core is made when all is drawn. parent / children: what opens only behind it (an inner drawer, drawers
     behind a door) */
  function mover(r, kind, pu, pv, pn) {
    const m = { r, kind, P: point(r, pu, pv, pn), holder: new THREE.Group(), cells: [], sign: 1, label: '', parent: null, children: [], item: null, travel: null, swing: null };
    MOVERS.push(m);
    return m;
  }
  const linkTo = (parent, child) => { child.parent = parent; parent.children.push(child); };
  const envelope = (r, gb, name, kind = 'appliance') => ENVELOPES.push({ kind, name, r, gb });
  /* boxes open at the front (+n) or at the top (+v), walls t thick; one part */
  function openFront(list, r, [u0, u1, v0, v1, n0, n1], t, key, layer, info) {
    const I = Object.assign({ part: part() }, info);
    for (const b of [[u0, u0 + t, v0, v1, n0, n1], [u1 - t, u1, v0, v1, n0, n1], [u0 + t, u1 - t, v0, v0 + t, n0, n1], [u0 + t, u1 - t, v1 - t, v1, n0, n1], [u0 + t, u1 - t, v0 + t, v1 - t, n0, n0 + t]]) box(list, r, b, key, layer, I);
  }
  function openTop(list, r, [u0, u1, v0, v1, n0, n1], t, key, layer, info) {
    const I = Object.assign({ part: part() }, info);
    for (const b of [[u0, u0 + t, v0, v1, n0, n1], [u1 - t, u1, v0, v1, n0, n1], [u0 + t, u1 - t, v0, v1, n0, n0 + t], [u0 + t, u1 - t, v0, v1, n1 - t, n1], [u0 + t, u1 - t, v0, v0 + t, n0 + t, n1 - t]]) box(list, r, b, key, layer, I);
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

  /* the lamps of the scene: pendants centred over the worktop of their group, downlights at {group, u, n} (n from the
     wall) or between the axes of the sink and the hob; a downlight hides with the ceiling, not with its group */
  const Lt = scene.lights;
  if (Lt) {
    const Pd = Lt.pendants, r = String(Pd.group), wt = model.worktops[r] || { n0: 0, n1: 0 }, top = model.groups[r].items.find(i => i.type === 'worktop');
    const mid = top ? (top.u0 + top.u1) / 2 : model.groups[r].widths.reduce((s, w) => s + w, 0) / 2, a = at(r, 'lamps');
    for (let i = 0; i < Pd.count; i++) HOME.draw.pendant(D, { a, r, u: mid + (i - (Pd.count - 1) / 2) * Pd.spacing, n: (wt.n0 + wt.n1) / 2, bottom: Lt.pendantBottom, ceiling: CEILING });
    for (const d of Lt.downlights) {
      const g = String(d.group), u = d.between ? d.between.reduce((s, k) => s + drawn.axes[k], 0) / d.between.length : d.u, n = model.groups[g].wall + d.n;
      const a = at(g, 'ceiling', null, opts.ceilingLayers || []); a.layers = a.layers.filter(k => k !== 'g' + g);
      HOME.draw.downlight(D, { a, r: g, u, n, ceiling: CEILING });
    }
  }

  /* the moving parts of core: a door turns about its hinge (v), a dishwasher's door and a bottom-hinged oven door about
     U, a drawer slides out along N; built closed */
  const SWING = { door: 'v', fridge: 'v', dishwasher: 'u', drawer: 'slide' };
  for (const m of MOVERS) {
    const open = m.travel ?? (m.kind === 'drawer' ? HW.open.drawer : HW.open.angle[m.kind] || 0), { U, N } = PLACE[m.r], swing = m.swing || SWING[m.kind];
    const how = swing === 'slide' ? { slide: [open * N[0], open * N[1], 0] } : swing === 'u' ? { axis: [U[0], U[1], 0], angle: open } : { axis: [0, 0, 1], angle: -m.sign * open };
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
  made.checks = () => [
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
