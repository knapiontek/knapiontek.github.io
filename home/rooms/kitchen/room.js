/* rooms/kitchen/room.js: the kitchen's furniture, an implementation of the interface ../../room.js: the same solids, moving
   fronts and details in its own page (index.html, with its room) and in the house (without: the house draws its own). Everything
   comes from design.dat.js, scene.dat.js and model.js and the library; nothing is made up here to fit.
   Units are mm in house axes (x along the house, y across, z up); inside a group the engine keeps u along the group, v up
   from the floor, n out from the carcass backs. */
(function (root) {
'use strict';

/* env: {materials, textures, houseModel} (../../room.js) */
function make(env) {
  const CORE = root.CORE, G = CORE.geometry, { piecesOf } = CORE.mesh;
  const KE = root.KitchenEngine, SCENE = root.KITCHEN_VIEW, TEXTURES = root.LIBRARY_TEXTURES, LIBRARY_PRODUCTS = root.LIBRARY_PRODUCTS, HOUSE = root.HOUSE;
  const project = KE.withLibrary(root.KITCHEN_DESIGN, LIBRARY_PRODUCTS.boards), APPLIANCES = KE.appliances(project, LIBRARY_PRODUCTS.appliances);
  const model = KE.build(project, APPLIANCES), settings = project.settings;
  const ROOM = root.HouseShell.roomsFor(HOUSE, env.houseModel, 'rooms/kitchen/index.html')[0];
  if (!ROOM) throw new Error('W building.dat.js żadne pomieszczenie nie prowadzi do rooms/kitchen/index.html.');
  const LEVEL = ROOM.level, CEILING = ROOM.ceiling - ROOM.level;   // v of the underside of the slab over the room
  const DEG = Math.PI / 180;

  const { frontFace, panelFace, carcassDepth, carcassBack, carcassFront, plinthFace, frontThickness } = model;   // n from the carcass backs
  const T = model.thickness, shakerRail = settings.front.shakerRail, HW = SCENE.hardware;

  /* ================= 1. WHERE THE GROUPS STAND =================
     A group stands at its placement (scene.dat.js): fronts facing one of ±x, ±y; u runs along it, n out of its wall. A point
     (u, v, n) of group r is O + u·U + n·N at height LEVEL + v. U is N turned a quarter to the left, so (U, z, N) is a
     right-handed frame: a group is turned, never mirrored. */
  const GROUP_IDS = Object.keys(SCENE.placement);
  const GROUP = r => model.groups[r] || { name: 'G' + r, widths: [], items: [], columnX: [0], wall: 0, backGap: 0 };
  const groupLength = r => GROUP(r).widths.reduce((s, w) => s + w, 0);
  const itemsOf = r => GROUP(r).items;
  const FACING = { '-y': [0, -1], '+y': [0, 1], '-x': [-1, 0], '+x': [1, 0] };
  const ANCHORS = { start: 0, centre: 0.5, end: 1 };
  const PLACE = {};
  function anchorU(r) {
    const a = SCENE.placement[r].anchor || 'start';
    return typeof a === 'object' ? GROUP(r).columnX[a.column] : (ANCHORS[a] ?? 0) * groupLength(r);
  }
  /* the anchor lies on the wall line (an island: the line of its carcass backs); against: on the front plane of that group */
  function placeGroup(r) {
    const p = SCENE.placement[r], N = FACING[p.faces], U = [-N[1], N[0]], along = anchorU(r);
    const back = GROUP(r).island ? 0 : GROUP(r).backGap;
    let O = [(p.x ?? 0) - along * U[0] + back * N[0], (p.y ?? 0) - along * U[1] + back * N[1]];
    if (p.against) {
      const o = PLACE[p.against.group], F = [o.O[0] + frontFace * o.N[0], o.O[1] + frontFace * o.N[1]];
      const shift = F[0] * U[0] + F[1] * U[1] - along - (O[0] * U[0] + O[1] * U[1]);
      O = [O[0] + shift * U[0], O[1] + shift * U[1]];
    }
    PLACE[r] = { O, U, N };
  }
  GROUP_IDS.filter(r => !SCENE.placement[r].against).forEach(placeGroup);
  GROUP_IDS.filter(r => SCENE.placement[r].against).forEach(placeGroup);
  const point = (r, u, v, n) => { const { O, U, N } = PLACE[r]; return [O[0] + u * U[0] + n * N[0], O[1] + u * U[1] + n * N[1], LEVEL + v]; };
  /* a box of group r [u0, u1, v0, v1, n0, n1] -> a box of the house [x1, x2, y1, y2, z1, z2] */
  function houseBox(r, b) {
    const xs = [], ys = [];
    for (const u of [b[0], b[1]]) for (const n of [b[4], b[5]]) { const p = point(r, u, 0, n); xs.push(p[0]); ys.push(p[1]); }
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), LEVEL + b[2], LEVEL + b[3]];
  }

  /* ================= 2. MATERIALS =================
     One library for core: the house's materials (the room keeps them) and the kitchen's, prefixed k. A board of design.dat.js
     is its decor photo (../../library/textures) or its colour, a lacquer a clear coat; its bare edge is the speckled core of the board. */
  const K = key => 'k.' + key;
  const LIB = env.materials;                // the page's library for core: the kitchen's keys are added
  const TEX = env.textures;                 // core textures: key -> {faces, size [along, across] mm}
  const DECORS = {}, FLOORS = {};           // the library's: decors by texture key, floor tiles by product key
  for (const m of Object.values(project.materials)) if (m.texture) {
    const T = TEXTURES[m.texture];
    DECORS[m.texture] = { name: T.name, size: { length: T.size[0], width: T.size[1] }, image: T.faces[0] };
    TEX[m.texture] = TEX[m.texture] || { faces: T.faces, size: T.size };
  }
  for (const key of SCENE.floors) {
    const P = LIBRARY_PRODUCTS.tiles[key], T = TEXTURES[P.texture];
    FLOORS[key] = { name: P.name, size: { length: T.size[0], width: T.size[1] }, grout: T.grout, faces: T.faces };
  }
  const FLOOR_KEYS = Object.keys(FLOORS);
  const METALS = SCENE.metals;
  const HOLE_COLORS = { hinge: { hex: '#f26b1d', label: 'zawiasy, odbojniki' }, shelfPin: { hex: '#22b35e', label: 'półki' }, runner: { hex: '#2f8fe0', label: 'szuflady, prowadnice' } };
  const holeUse = kind => (['cup', 'plate', 'bumper'].includes(kind) ? 'hinge' : kind);
  const PANEL_COLORS = {                     // "Koloruj wg płyty": a colour per board id of model.js
    side: ['#f0c27b', 'Bok'], bottomBoard: ['#8fcf9f', 'Wieniec dolny'], topBoard: ['#4fae6e', 'Wieniec górny'], crossRail: ['#f29e8e', 'Trawers'],
    fixedShelf: ['#5f95da', 'Półka stała'], adjustableShelf: ['#a9c9f2', 'Półka ruchoma'], pullOutShelf: ['#a9c9f2', 'Półka wysuwana'],
    backPanel: ['#c9b9ea', 'Plecy, ' + model.materials[model.materialFor.backPanel].label], backStrip: ['#e98fc4', 'Listwa tylna za listwą przednią'],
    hobPanel: ['#7fd0c8', 'Przegroda pod płytą'], hingePost: ['#e07b39', 'Słupek zawiasowy'], spacer: ['#c46a2b', 'Płyta dystansowa'], insetPanel: ['#d9a35c', 'Panel wpuszczany'],
    drawerBottom: ['#f5d76e', 'Dno szuflady'], drawerBack: ['#e3ad3c', 'Tył szuflady'],
    doorDrawerFront: ['#d99a2b', 'Czoło szuflady za drzwiami'], doorDrawerBottom: ['#f5d76e', 'Dno szuflady za drzwiami'], doorDrawerSide: ['#ecc45a', 'Bok szuflady za drzwiami'], doorDrawerBack: ['#e3ad3c', 'Tył szuflady za drzwiami']
  };
  const metal = key => ({ color: METALS[key].color, roughness: METALS[key].roughness, metalness: METALS[key].metalness, reflect: 1.4 });
  Object.assign(LIB, Object.fromEntries(Object.entries({
    wall: { color: SCENE.room.wallColor, roughness: 0.95, reflect: 0.45 },   // plasterboard
    floor: { color: '#cfcfcb', roughness: 0.55, reflect: 0.6 },              // its map: the floor tiles of scene.dat.js (../../library)
    handle: metal(HW.handle.metal),
    steel: { color: '#d2d5d8', metalness: 1, roughness: 0.3 },
    glassBlack: { color: '#060708', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, reflect: 1.1 },
    ovenInside: { color: '#23262a', roughness: 0.6, metalness: 0.3 },
    smoke: { color: '#0a0b0d', roughness: 0.04, opacity: 0.62, reflect: 1.2 },
    ring: { color: '#5b5f66', roughness: 0.6 },
    gasket: { color: '#1a1a1a', roughness: 0.8 },
    granite: { color: '#ffffff', roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.6, reflect: 0.5 },   // its map: a speckled canvas
    blackMetal: { color: '#141517', roughness: 0.42, metalness: 0.45, reflect: 0.8 },
    applianceBody: { color: '#3a3d42', roughness: 0.6, metalness: 0.35 },
    zinc: { color: '#b9bec4', roughness: 0.32, metalness: 0.85, reflect: 1.1 },
    drawerSide: { color: '#dcdedf', roughness: 0.35, metalness: 0.35, reflect: 0.9 },
    leg: { color: '#2e2f31', roughness: 0.6 },
    wire: { color: '#c8ccd0', roughness: 0.35, metalness: 0.85, opacity: 0.55 },
    fridge: { color: '#f4f5f4', roughness: 0.35, reflect: 0.6 },
    ice: { color: '#dbe8ee', roughness: 0.1, opacity: 0.35 },
    glassShelf: { color: '#cfe4e6', roughness: 0.05, opacity: 0.45, reflect: 1.2 },
    bin: { color: '#8a8f96', roughness: 0.55, reflect: 0.5 },
    insert: { color: '#d9dadb', roughness: 0.5, reflect: 0.6 },
    pipe: { color: '#8d9196', roughness: 0.5 },
    shade: { color: model.materials[model.materialFor.cabinet].color, roughness: 0.5, metalness: 0.2 },
    shadeInside: { color: '#f4ead8', roughness: 0.6 },
    tube: { color: '#f3f3f0', roughness: 0.45 },
    bulb: { color: '#e9e5dc', roughness: 0.4, emissive: '#000000' },        // lit at night
    led: { color: '#e9e5dc', roughness: 0.4, emissive: '#000000' },
    selected: { color: '#8fd0f5', roughness: 0.6, emissive: '#1a5a80', glow: 0.6 },
    ...Object.fromEntries(Object.entries(HOLE_COLORS).map(([k, h]) => ['hole.' + k, { color: h.hex, emissive: h.hex, glow: 0.35, roughness: 0.8 }])),
    ...Object.fromEntries(Object.entries(PANEL_COLORS).map(([k, [color]]) => ['panel.' + k, { color, roughness: 0.7 }]))
  }).map(([k, d]) => [K(k), d])));
  /* the boards of design.dat.js; '~': the decor turned a quarter, so the grain runs along the face's other side */
  for (const [code, m] of Object.entries(model.materials)) {
    const decor = m.texture && DECORS[m.texture];
    const def = decor ? { color: '#ffffff', image: { key: m.texture }, roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.55, reflect: 0.5 }
      : m.lacquered ? { color: m.color, roughness: 0.42, clearcoat: 0.2, clearcoatRoughness: 0.45, reflect: 0.7 }
      : { color: m.color, roughness: 0.8, reflect: 0.45 };
    LIB[K(code)] = def;
    if (decor) LIB[K(code) + '~'] = Object.assign({}, def, { image: { key: m.texture, turn: true } });
    if (m.core) LIB[K(code) + ':core'] = { color: m.core, roughness: 0.92, texture: { strength: 0.9, grain: 2, tile: 90 } };
  }

  /* the kitchen's layers (a host adds its own: the room, the edges) */
  const LAYERS = Object.fromEntries(GROUP_IDS.map(r => ['g' + r, { name: 'G' + r + ' · ' + GROUP(r).name }]));
  Object.assign(LAYERS, {
    carcassParts: { name: 'Korpusy', layers: { carcasses: { name: 'Płyty' }, backs: { name: 'Plecy HDF' }, shelves: { name: 'Półki' }, drawers: { name: 'Szuflady' },
      hardware: { name: 'Zawiasy, odbojniki, prowadnice' }, holes: { name: 'Otwory' }, legs: { name: 'Nóżki' } } },
    frontParts: { name: 'Fronty', layers: { fronts: { name: 'Fronty' }, handles: { name: 'Uchwyty' }, strips: { name: 'Listwy przednie' }, frontPanel: { name: 'Panele' }, plinth: { name: 'Cokół' } } },
    worktopParts: { name: 'Blat', layers: { worktops: { name: 'Blaty' }, endPanels: { name: 'Panele końcowe' }, wallPanel: { name: 'Panel ścienny' } } },
    appliances: { name: 'AGD', layers: { sink: { name: 'Zlew, bateria' }, trap: { name: 'Syfon' }, hob: { name: 'Płyta grzewcza' }, hood: { name: 'Okap' }, oven: { name: 'Piekarnik' },
      microwave: { name: 'Mikrofalówka' }, coffee: { name: 'Ekspres' }, fridge: { name: 'Lodówka' }, dishwasher: { name: 'Zmywarka' } } },
    plasterboard: { name: 'Zabudowa GK' },
  });

  /* opts: {room (its own page: the house's room too), layers (the host's, added to every solid and detail)} */
  function build(V, opts = {}) {
    const EXTRA = opts.layers || [];
    V.material(K('handle')).side = THREE.DoubleSide;   // the cup handle is an open shell
    /* ================= 5. SOLIDS =================
       A solid is a cell of core: {S, material, layers, part, info}. part: one board or piece (a joint between two parts shows
       a line, a box of the same part none); info: what it is, for the tip, the checks and the colours. Layers: its group and
       its layer. Glass and wire draw no edges. */
    const STATIC = [], MOVERS = [], DETAILS = [], ENVELOPES = [], LAMPS = [], UNDRAWN = [];   // UNDRAWN: parts the engine gave no size
    let PART = 0;
    const onePart = () => ++PART;
    function box(list, r, gb, key, layer, info = {}) {
      if (!gb.every(Number.isFinite)) { UNDRAWN.push((info.name || layer) + ': ' + gb.join(', ')); return null; }
      if (!(gb[1] > gb[0] && gb[3] > gb[2] && gb[5] > gb[4])) return null;   // an empty box: nothing drawn
      const hb = houseBox(r, gb);
      const c = { S: G.prism(hb), element: info.name || layer, material: key, cap: key, layers: ['g' + r, layer].concat(info.also || [], EXTRA),
        edges: LIB[key].opacity === undefined, part: info.part || onePart(), r, gb, hb, info, batch: info.batch };
      list.push(c);
      return c;
    }
    /* the face of a box by its normal: which side of the group (left/right = −u/+u, bottom/top, back/front = −n/+n) */
    const SIDE_AXIS = { left: 0, right: 0, bottom: 1, top: 1, back: 2, front: 2 };
    function sideOf(r, n) {
      const { U, N } = PLACE[r], du = n[0] * U[0] + n[1] * U[1], dn = n[0] * N[0] + n[1] * N[1];
      return Math.abs(n[2]) > 0.5 ? (n[2] > 0 ? 'top' : 'bottom') : Math.abs(du) > 0.5 ? (du > 0 ? 'right' : 'left') : (dn > 0 ? 'front' : 'back');
    }
    /* the grain of a decor: along u, up (v), or (no rule) along the longer side of the face. The texture runs along the
       face's first uv axis (core/mesh.js: an x face has (y, z), a y face (x, z), a z face (x, y)); '~' turns it. */
    const FACE_UV = n => Math.abs(n[0]) > 0.5 ? [1, 2] : Math.abs(n[1]) > 0.5 ? [0, 2] : [0, 1];
    function turned(c, n, grain) {
      const [a, b] = FACE_UV(n), extent = k => c.hb[2 * k + 1] - c.hb[2 * k];
      let g = grain === 'u' ? (Math.abs(PLACE[c.r].U[0]) > 0.5 ? 0 : 1) : grain === 'v' ? 2 : null;
      if (g !== a && g !== b) g = extent(a) >= extent(b) ? a : b;
      return g === b;
    }
    /* a board: its two big faces (or the faces named) in the decor, banded edges too, every other edge bare */
    function look(c, code, { banded = [], faces = null, grain = null } = {}) {
      if (!c) return null;
      const plain = K(code), turnedKey = LIB[plain + '~'] ? plain + '~' : null, bare = LIB[plain + ':core'] ? plain + ':core' : null;
      const size = [c.gb[1] - c.gb[0], c.gb[3] - c.gb[2], c.gb[5] - c.gb[4]], thin = size.indexOf(Math.min(...size)), finished = new Set(banded);
      c.faceMaterial = n => {
        const side = sideOf(c.r, n), decor = faces ? faces.includes(side) : SIDE_AXIS[side] === thin;
        if (!decor && !finished.has(side) && bare) return bare;
        return turnedKey && turned(c, n, grain) ? turnedKey : plain;
      };
      return c;
    }
    const ALL_SIDES = Object.keys(SIDE_AXIS);
    const BOARD_CHECK = { drawerBottom: 'drawer', drawerBack: 'drawer', doorDrawerFront: 'drawer', doorDrawerBottom: 'drawer', doorDrawerSide: 'drawer',
      doorDrawerBack: 'drawer', backStrip: 'backStrip', adjustableShelf: 'shelf' };
    /* a board of model.js, with its banded edges; a carcass board is listed in its carcass */
    function board(list, b, carcass, layer, mover) {
      const c = box(list, b.group, b.box, K(b.material), layer || b.layer || 'carcasses', { board: b, carcass, mover, check: BOARD_CHECK[b.id] || 'carcass',
        name: (carcass ? carcass.name + ' ' : '') + b.name + ' ' + b.a + ' × ' + b.b, batch: (carcass ? 'c' + carcass.id : 'b') + ':' + b.id });
      if (c && carcass) carcass.parts.push({ name: b.name, a: b.a, b: b.b });
      return look(c, b.material, { banded: (b.edges || []).map(e => e.side) });
    }
    /* a prism along x over a convex profile [[n, v]] across u0..u1 of group r: only where the group runs along x */
    function profile(list, r, u0, u1, prof, info, faceMaterial) {
      const { O, U, N } = PLACE[r];
      if (Math.abs(U[0]) < 0.5) return null;
      const xs = [O[0] + u0 * U[0], O[0] + u1 * U[0]];
      const c = { S: { x1: Math.min(...xs), x2: Math.max(...xs), poly: G.ccw(prof.map(([n, v]) => [O[1] + n * N[1], LEVEL + v])) }, material: faceMaterial([0, 0, 1]),
        element: info.name, layers: ['g' + r, info.layer].concat(EXTRA), edges: true, part: onePart(), r, info, faceMaterial };
      c.cap = c.material;
      list.push(c);
      return c;
    }

    /* ================= 6. DETAILS =================
       What is round or flat (handles, knobs, legs, rings, displays, lamps) is not a solid of core: a plain mesh in the frame of
       its group, (x, y, z) = (u, v, n) in mm, with core's materials. */
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
    const at = (r, layer, mover, also = []) => ({ r, frame: frameOf(r, mover ? mover.inner : V.root), layers: (layer === 'lamps' ? [] : ['g' + r]).concat(layer, also, EXTRA), owner: { info: mover ? { mover } : {} } });
    function detail(a, geometry, key, x, y, z, shadow = true) {
      const material = typeof key === 'string' ? V.material(key) : key, m = new THREE.Mesh(geometry, material);
      m.position.set(x, y, z); m.castShadow = shadow && !material.transparent; m.receiveShadow = shadow;
      m.userData.owner = a.owner; a.frame.add(m); DETAILS.push({ mesh: m, layers: a.layers });
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

    /* ================= 7. MOVING PARTS =================
       A door, a drawer or an appliance door: its own solids (built closed, in house mm) under a pivot that turns about its
       hinge or slides out along n. parent / children: what opens only behind it (an inner drawer, drawers behind a door). */
    const SWING = { door: 'v', fridge: 'v', dishwasher: 'u', drawer: 'slide' };   // an oven or microwave door: mover.swing
    function mover(r, kind, pu, pv, pn) {
      const P = point(r, pu, pv, pn), pivot = new THREE.Group(), inner = new THREE.Group();
      pivot.position.set(...P); inner.position.set(-P[0], -P[1], -P[2]); pivot.add(inner); V.root.add(pivot);
      const m = { r, kind, P, pivot, inner, cells: [], progress: 0, goal: 0, sign: 1, label: '', parent: null, children: [], item: null, travel: null, swing: null };
      MOVERS.push(m);
      return m;
    }
    const linkTo = (parent, child) => { child.parent = parent; parent.children.push(child); };
    const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    /* a vertical hinge turns about z (the free edge swings out of the front); a bottom hinge about U (the top comes out along N) */
    function pose(m) {
      const open = m.travel ?? (m.kind === 'drawer' ? HW.open.drawer : HW.open.angle[m.kind]), e = ease(m.progress), { U, N } = PLACE[m.r];
      const swing = m.swing || SWING[m.kind];
      if (swing === 'v') m.pivot.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -m.sign * e * open * DEG);
      else if (swing === 'u') m.pivot.quaternion.setFromAxisAngle(new THREE.Vector3(U[0], U[1], 0), e * open * DEG);
      else m.pivot.position.set(m.P[0] + e * open * N[0], m.P[1] + e * open * N[1], m.P[2]);
    }

    /* ================= 8. THE KITCHEN ================= */
    const worktopOf = r => model.worktops[r] || { n0: 0, n1: 0, depth: 0, v1: 0 };
    const worktopTop = r => worktopOf(r).v1;
    const envelope = (r, gb, name, kind = 'appliance') => ENVELOPES.push({ kind, name, r, gb });
    /* boxes open at the front (+n) or at the top (+v), walls t thick; one part */
    function openFront(list, r, [u0, u1, v0, v1, n0, n1], t, key, layer, info) {
      const I = Object.assign({ part: onePart() }, info);
      for (const b of [[u0, u0 + t, v0, v1, n0, n1], [u1 - t, u1, v0, v1, n0, n1], [u0 + t, u1 - t, v0, v0 + t, n0, n1], [u0 + t, u1 - t, v1 - t, v1, n0, n1], [u0 + t, u1 - t, v0 + t, v1 - t, n0, n0 + t]]) box(list, r, b, key, layer, I);
    }
    function openTop(list, r, [u0, u1, v0, v1, n0, n1], t, key, layer, info) {
      const I = Object.assign({ part: onePart() }, info);
      for (const b of [[u0, u0 + t, v0, v1, n0, n1], [u1 - t, u1, v0, v1, n0, n1], [u0 + t, u1 - t, v0, v1, n0, n0 + t], [u0 + t, u1 - t, v0, v1, n1 - t, n1], [u0 + t, u1 - t, v0, v0 + t, n0 + t, n1 - t]]) box(list, r, b, key, layer, I);
    }

    /* ---------- worktops, strips, panels, plinths, plasterboard ---------- */
    const CHECKED_TYPES = ['worktop', 'endPanel', 'strip', 'plinth', 'frontPanel', 'wallPanel'];
    /* a worktop or an end panel, one part of boxes around its cut-outs: finished edges (banded or factory) in the decor, the
       walls of the cut-outs bare */
    function worktopPiece(r, piece, info) {
      const { u0, u1, v0, v1 } = piece.item, endPanel = piece.item.type === 'endPanel', code = piece.material, I = Object.assign({ part: onePart() }, info);
      const finished = new Set([...piece.edges.map(e => e.side), ...piece.factoryEdges]);
      const outer = u0 + u1 < groupLength(r) ? 'left' : 'right';
      const faces = model.materials[code].twoSided ? (endPanel ? ['left', 'right'] : ['top', 'bottom']) : [endPanel ? outer : 'top'];
      const holes = (piece.cutouts || []).map(c => [c.u0, c.u1, c.n0, c.n1]);
      const cuts = [...new Set([u0, u1, ...holes.flatMap(([a, b]) => [a, b])])].sort((x, y) => x - y);
      for (let i = 0; i + 1 < cuts.length; i++) {
        const a = cuts[i], b = cuts[i + 1], spans = [];
        let n = piece.n0;
        for (const [, , h0, h1] of holes.filter(([h0, h1]) => h0 <= a && h1 >= b).sort((x, y) => x[2] - y[2])) { spans.push([n, h0]); n = h1; }
        spans.push([n, piece.n1]);
        for (const [n0, n1] of spans) {
          const outline = { left: a === u0, right: b === u1, back: n0 === piece.n0, front: n1 === piece.n1, top: true, bottom: true };
          look(box(STATIC, r, [a, b, v0, v1, n0, n1], K(code), endPanel ? 'endPanels' : 'worktops', I), code,
            { banded: [...finished].filter(s => outline[s]), faces, grain: endPanel ? 'v' : 'u' });
        }
      }
    }
    function buildGroup(r) {
      for (const item of itemsOf(r)) {
        const { u0, u1, v0, v1, type } = item, wall = GROUP(r).wall;
        const info = CHECKED_TYPES.includes(type) ? { check: type, name: KE.placeLabel(r, item.column, item.span) + ' ' + KE.typeLabel(type) + ' ' + (u1 - u0) + ' × ' + (v1 - v0) + (item.note ? ' (' + item.note + ')' : '') } : {};
        if (type === 'worktop' || type === 'endPanel') {
          const piece = model.worktopPieces.find(p => p.item === item);
          if (piece) worktopPiece(r, piece, info);
        } else if (type === 'strip') {                 // on edge in the plane of the fronts; lacquered faces and the edges model.js names
          const strip = model.strips.find(s => s.item === item), code = model.materialFor.strip;
          look(box(STATIC, r, [u0, u1, v0, v1, frontFace - settings.strip.depth, frontFace], K(code), 'strips', info), code, { banded: (strip && strip.lacqueredSides) || [] });
        } else if (type === 'frontPanel') {
          const panel = model.frontPanels.find(p => p.item === item), code = model.materialFor.frontPanel;
          look(box(STATIC, r, [u0, u1, v0, v1, panel.box[4], panel.box[5]], K(code), 'frontPanel', info), code, { banded: [...panel.edges.map(e => e.side), ...panel.lacqueredSides] });
        } else if (type === 'plinth') {
          const code = model.materialFor.plinth;
          look(box(STATIC, r, [u0, u1, v0, v1, plinthFace - T.plinth, plinthFace], K(code), 'plinth', info), code);
        } else if (type === 'wallPanel') {
          const code = model.materialFor.wallPanel;
          look(box(STATIC, r, [u0, u1, v0, v1, wall, wall + T.wallPanel], K(code), 'wallPanel', info), code, { faces: ALL_SIDES, grain: 'u' });
        } else if (type === 'plasterboard') {          // a space draws nothing
          box(STATIC, r, [u0, u1, v0, v1, wall, wall + settings.plasterboard.depth], K('wall'), 'plasterboard', { name: 'Zabudowa GK ' + (u1 - u0) + ' × ' + (v1 - v0) });
        } else if (type === 'oven' || type === 'microwave') builtInAppliance(r, item, type);
      }
    }

    /* ---------- built-in oven and microwave (the library's appliances, where model.js fits them: item.fit) ----------
       The body on its feet behind the carcass front, the fascia in front of it; the appliance door turns on its hinge edge.
       d = how far a detail stands out of the appliance face: n = 2·face − d. */
    function builtInAppliance(r, item, type) {
      const A = APPLIANCES[type], { feet, bodyV0: b0, fasciaV0: v0, fasciaV1: v1 } = item.fit, floor = b0 - feet, uc = (item.u0 + item.u1) / 2;
      const u0 = uc - A.fascia.width / 2, u1 = uc + A.fascia.width / 2, face = carcassFront + A.fascia.thickness, { width: bw, height: bh, depth: bd } = A.body;
      const bu0 = uc - bw / 2, bu1 = uc + bw / 2, fixed = at(r, type), I = { name: A.name, part: onePart() };
      if (feet > 0) for (const fu of [bu0 + 30, bu1 - 30]) for (const fn of [carcassFront - bd + 30, carcassFront - 30]) cylinder(fixed, 10, feet, K('blackMetal'), fu, floor + feet / 2, fn, null, 16);
      envelope(r, [bu0, bu1, b0, b0 + bh, carcassFront - bd, carcassFront], A.name + ' – korpus ' + bw + ' × ' + bh + ' × ' + bd + (feet > 0 ? ' na nóżkach ' + Math.round(feet * 10) / 10 : ''));
      envelope(r, [u0, u1, v0, v1, carcassFront, face], A.name + ' – front urządzenia ' + A.fascia.width + ' × ' + A.fascia.height);
      /* the door: an oven's below its control panel, full width; a microwave's over the body opening, left of its control column */
      const door = type === 'oven' ? { u0, u1, v0, v1: v1 - A.controlPanelHeight } : { u0: bu0 + 2, u1: u1 - A.controlColumnWidth, v0: b0 + 4, v1: b0 + bh - 4 };
      const hinge = A.door.hinge, bottom = hinge === 'bottom';
      const m = mover(r, type, bottom ? 0 : hinge === 'left' ? door.u0 : door.u1, bottom ? door.v0 : 0, face);
      Object.assign(m, { sign: hinge === 'left' ? 1 : -1, swing: bottom ? 'u' : 'v', item, label: A.name + ' – drzwi ' + Math.round(door.u1 - door.u0) + ' × ' + Math.round(door.v1 - door.v0) });
      const D = { name: A.name, mover: m }, moving = at(r, type, m);
      const fixedBox = (gb, key) => box(STATIC, r, gb, key, type, I), doorBox = (gb, key) => box(m.cells, r, gb, key, type, D);
      const outBox = (put, d0, d1, y0, y1, a0, a1, key) => put([a0, a1, y0, y1, 2 * face - d1, 2 * face - d0], key);
      openFront(STATIC, r, [bu0, bu1, b0, b0 + bh, carcassFront - bd, carcassFront], 4, K('applianceBody'), type, { name: A.name });
      fixedBox([bu0 + 4, bu1 - 4, b0 + 4, b0 + bh - 4, carcassFront - bd + 4, carcassFront - bd + 6], K('ovenInside'));   // the back of the cavity
      const fascia = (a0, a1, y0, y1) => fixedBox([a0, a1, y0, y1, carcassFront, face - 6], K('blackMetal'));
      doorBox([door.u0, door.u1, door.v0, door.v1, carcassFront + 2, face - 6], K('blackMetal'));   // the leaf, 2 off the carcass front
      outBox(doorBox, face - 2, face + 6, door.v0, door.v1, door.u0, door.u1, K('blackMetal'));      // its trim
      if (type === 'oven') {
        fascia(u0, u1, door.v1, v1);
        outBox(fixedBox, face - 2, face + 6, door.v1, v1, u0, u1, K('blackMetal'));
        const panel = door.v1 + 3, mid = (panel + v1 - 10) / 2;
        outBox(fixedBox, face - 8, face - 2, panel, v1 - 10, u0 + 10, u1 - 10, K('glassBlack'));
        for (const a of [u0 + 85, u1 - 85]) {           // knobs
          cylinder(fixed, 19, 20, K('steel'), a, mid, face + 18, 'z', 32);
          cylinder(fixed, 21, 3, K('steel'), a, mid, face + 9, 'z', 32);
        }
        display(fixed, '12:30', 110, 34, uc, mid, face + 8.5);
        for (const y of [b0 + 150, b0 + 290]) cylinder(fixed, 3, bw - 40, K('steel'), uc, y, carcassFront - bd / 2, 'x', 8);   // shelf rails
        const d0 = door.v0 + 10, d1 = door.v1 - 3;
        outBox(doorBox, face - 10, face - 8, d0 + 70, d1 - 80, u0 + 70, u1 - 70, K('smoke'));       // the door glass in a black border
        outBox(doorBox, face - 12, face - 8, d1 - 80, d1, u0 + 10, u1 - 10, K('glassBlack'));
        outBox(doorBox, face - 12, face - 8, d0, d0 + 70, u0 + 10, u1 - 10, K('glassBlack'));
        outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, u0 + 10, u0 + 70, K('glassBlack'));
        outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, u1 - 70, u1 - 10, K('glassBlack'));
        cylinder(moving, 10, u1 - u0 - 140, K('steel'), uc, d1 - 40, face + 48, 'x', 24);   // bar handle
        for (const a of [u0 + 80, u1 - 80]) cylinder(moving, 7, 36, K('steel'), a, d1 - 40, face + 28, 'z', 16);
      } else {
        fascia(u0, door.u0 - 2, v0, v1); fascia(door.u1 + 2, u1, v0, v1); fascia(door.u0 - 2, door.u1 + 2, v0, door.v0 - 2); fascia(door.u0 - 2, door.u1 + 2, door.v1 + 2, v1);
        const panelLeft = door.u1 + 3;
        for (const [a0, a1, y0, y1] of [[u0, door.u0 - 2, v0, v1], [door.u1 + 2, u1, v0, v1], [door.u0 - 2, door.u1 + 2, v0, door.v0 - 2], [door.u0 - 2, door.u1 + 2, door.v1 + 2, v1]]) {
          outBox(fixedBox, face - 4, face + 6, y0, y1, a0, a1, K('blackMetal'));
        }
        outBox(fixedBox, face - 10, face - 4, v0 + 10, v1 - 10, panelLeft + 8, u1 - 10, K('glassBlack'));
        display(fixed, '0:45', 90, 28, (panelLeft + u1) / 2, v1 - 70, face + 10.5);
        cylinder(fixed, 14, 4, K('steel'), (panelLeft + u1) / 2, v0 + 90, face + 12, 'z', 32);
        const { u0: a0, u1: a1, v0: y0, v1: y1 } = door, f = 40;
        outBox(doorBox, face - 10, face - 8, y0 + f, y1 - f, a0 + f, a1 - f, K('smoke'));
        outBox(doorBox, face - 12, face - 8, y1 - f, y1, a0, a1, K('glassBlack'));
        outBox(doorBox, face - 12, face - 8, y0, y0 + f, a0, a1, K('glassBlack'));
        outBox(doorBox, face - 12, face - 8, y0 + f, y1 - f, a0, a0 + f, K('glassBlack'));
        outBox(doorBox, face - 12, face - 8, y0 + f, y1 - f, a1 - f, a1, K('glassBlack'));
      }
    }

    /* ---------- sink (the library's sink) over the cut-out model.js makes, with tap and a space-saving trap ---------- */
    const sinkCarcass = model.carcasses.find(c => c.sink), sinkGroup = sinkCarcass ? String(sinkCarcass.group) : null;
    const sinkCut = sinkGroup && (worktopOf(sinkGroup).cutouts || []).find(c => c.kind === 'sink');
    const sinkItem = sinkCut && itemsOf(sinkGroup).find(i => KE.hasTag(i, 'sink'));
    const sinkU = sinkCut ? (sinkCut.u0 + sinkCut.u1) / 2 : 0;
    function buildSink() {
      const S = APPLIANCES.sink, r = sinkGroup, sn = (sinkCut.n0 + sinkCut.n1) / 2, top = worktopTop(r), rim = S.rim, wall = S.wall, I = { name: S.name, part: onePart() };
      const s0 = sinkU - S.body.width / 2, s1 = sinkU + S.body.width / 2, sn0 = sn - S.body.depth / 2, sn1 = sn + S.body.depth / 2;
      const b0 = sinkU - S.bowl.width / 2, b1 = sinkU + S.bowl.width / 2, bn0 = sn - S.bowl.depth / 2, bn1 = sn + S.bowl.depth / 2, bottom = top - S.bowl.height;
      const g = gb => box(STATIC, r, gb, K('granite'), 'sink', I);
      for (const [u0, u1, n0, n1] of [[s0, s1, sn0, bn0 - wall], [s0, s1, bn1 + wall, sn1], [s0, b0 - wall, bn0 - wall, bn1 + wall], [b1 + wall, s1, bn0 - wall, bn1 + wall]]) g([u0, u1, top, top + rim, n0, n1]);   // the rim
      g([b0 - wall, b0, bottom, top + rim, bn0 - wall, bn1 + wall]); g([b1, b1 + wall, bottom, top + rim, bn0 - wall, bn1 + wall]);   // the bowl walls
      g([b0, b1, bottom, top + rim, bn0 - wall, bn0]); g([b0, b1, bottom, top + rim, bn1, bn1 + wall]);
      g([b0 - wall, b1 + wall, bottom - wall, bottom, bn0 - wall, bn1 + wall]);   // the bowl bottom
      envelope(r, [b0 - wall, b1 + wall, bottom - wall, top, bn0 - wall, bn1 + wall], 'Zlew – komora ' + (b1 - b0 + 2 * wall) + ' × ' + (bn1 - bn0 + 2 * wall) + ' × ' + (top - bottom + wall));
      const a = at(r, 'sink'), tapN = worktopOf(r).n0 + SCENE.installation.sink.tapFromBack, t = top + rim, bc = (bn0 + bn1) / 2;
      cylinder(a, 45, 3, K('steel'), sinkU, bottom + 1.5, bc, null, 32);             // drain
      cylinder(a, 30, 4, K('ovenInside'), sinkU, bottom + 2, bc, null, 32);
      cylinder(a, 18, 3, K('steel'), sinkU + 250, t + 1.5, tapN, null, 24);           // dispenser plate
      cylinder(a, 28, 8, K('handle'), sinkU, t + 4, tapN, null, 32);                  // tap
      cylinder(a, 20, 172, K('handle'), sinkU, t + 94, tapN, null, 32);
      cylinder(a, 21, 6, K('handle'), sinkU, t + 183, tapN, null, 32);
      cylinder(a, 11, 220, K('handle'), sinkU, t + 166, tapN + 110, 'z', 20);
      cylinder(a, 13, 26, K('handle'), sinkU, t + 152, tapN + 214, null, 20);
      cylinder(a, 7, 70, K('handle'), sinkU + 55, t + 140, tapN, 'x', 16);
      /* the trap: a short drop, a flat body against the back, the outlet into the wall above the bins */
      const p = at(r, 'trap'), yb = bottom - wall, yt = SCENE.installation.sink.trapTop, yo = SCENE.installation.sink.wallOutlet, nb = carcassBack + 31, P = { name: 'Syfon', part: onePart() };
      cylinder(p, 20, yb - yt, K('pipe'), sinkU, (yb + yt) / 2, bc, null, 20);
      cylinder(p, 20, bc - nb, K('pipe'), sinkU, yt, (bc + nb) / 2, 'z', 20);
      box(STATIC, r, [sinkU - 70, sinkU + 70, yo - 25, yt + 25, carcassBack + 6, carcassBack + 56], K('pipe'), 'trap', P);
      cylinder(p, 20, 70, K('pipe'), sinkU + 105, yo, nb - 25, 'z', 20);
      box(STATIC, r, [sinkU + 70, sinkU + 125, yo - 20, yo + 20, carcassBack + 6, carcassBack + 36], K('pipe'), 'trap', P);
    }

    /* ---------- induction hob in its cut-out, and the hood over it ---------- */
    const hobGroup = GROUP_IDS.find(r => itemsOf(r).some(i => KE.hasTag(i, 'hob')));
    const hobItem = hobGroup && itemsOf(hobGroup).find(i => KE.hasTag(i, 'hob'));
    const hobCut = hobItem && (worktopOf(hobGroup).cutouts || []).find(c => c.kind === 'hob');
    const hobU = hobCut ? (hobCut.u0 + hobCut.u1) / 2 : hobItem ? (hobItem.u0 + hobItem.u1) / 2 : 0;
    function buildHob() {
      const H = APPLIANCES.hob, r = hobGroup, v = worktopTop(r), gn = (hobCut.n0 + hobCut.n1) / 2 - H.glass.depth / 2, I = { name: H.name };
      box(STATIC, r, [hobU - H.glass.width / 2, hobU + H.glass.width / 2, v, v + 5, gn, gn + H.glass.depth], K('glassBlack'), 'hob', I);
      box(STATIC, r, [hobCut.u0, hobCut.u1, v - H.body.height, v, hobCut.n0, hobCut.n1], K('applianceBody'), 'hob', I);
      envelope(r, [hobCut.u0, hobCut.u1, v - H.body.height, v, hobCut.n0, hobCut.n1], 'Płyta grzewcza – korpus ' + (hobCut.u1 - hobCut.u0) + ' × ' + (hobCut.n1 - hobCut.n0) + ' × ' + H.body.height);
      const a = at(r, 'hob');
      for (const [du, n, radius] of [[-150, gn + 140, 100], [150, gn + 140, 85], [-150, gn + 370, 85], [150, gn + 370, 110]]) {
        detail(a, new THREE.RingGeometry(radius - 3, radius, 64), K('ring'), hobU + du, v + 5.5, n, false).rotation.x = -Math.PI / 2;   // cooking zones
      }
      detail(a, new THREE.PlaneGeometry(220, 30), K('ring'), hobU, v + 5.5, gn + 490, false).rotation.x = -Math.PI / 2;   // the slider
    }
    function buildHood() {
      const A = APPLIANCES.hood, r = hobGroup, uc = hobU, { width: w, height: h, depth: d } = A.body, bottom = SCENE.installation.hood.bottom, { width: cw, depth: cd } = A.chimney;
      const I = { name: A.name, layer: 'hood' }, a = at(r, 'hood');
      const prof = [[0, bottom], [d, bottom], [d, bottom + 40], [110, bottom + h], [0, bottom + h]];   // (n, v): an angled glass front
      const sides = n => (Math.abs(n[0] * PLACE[r].U[0] + n[1] * PLACE[r].U[1]) > 0.5 ? K('blackMetal') : K('glassBlack'));
      if (!profile(STATIC, r, uc - w / 2, uc + w / 2, prof, I, sides)) {   // a group across x: the same body as a plain mesh
        const shape = new THREE.Shape(prof.map(([n, v]) => new THREE.Vector2(n, v - bottom)));
        const body = detail(a, new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false }), K('blackMetal'), uc + w / 2, bottom, 0);
        body.geometry.rotateY(-Math.PI / 2); body.material = [V.material(K('blackMetal')), V.material(K('glassBlack'))];
      }
      box(STATIC, r, [uc - w / 2 + 20, uc + w / 2 - 20, bottom - 1, bottom, 20, d - 20], K('ovenInside'), 'hood', I);   // the filter
      box(STATIC, r, [uc - cw / 2, uc + cw / 2, bottom + h, CEILING, 0, cd], K('blackMetal'), 'hood', I);              // the chimney
      const angle = Math.atan2(h - 40, d - 110), panel = detail(a, new THREE.PlaneGeometry(200, 12), K('led'), uc,
        bottom + 40 + (h - 40) * 0.18 + Math.cos(angle) * 1.2, d - (d - 110) * 0.18 + Math.sin(angle) * 1.2, false);
      panel.rotation.x = -(Math.PI / 2 - angle);
      for (const u of [uc - 150, uc + 150]) {
        detail(a, new THREE.PlaneGeometry(160, 12), K('led'), u, bottom - 1.5, d - 90, false).rotation.x = Math.PI / 2;
        lamp(new THREE.SpotLight(0xfff0dc, 4.5, 0, 1.05, 0.8, 2), point(r, u, bottom - 5, d - 90), point(r, u, worktopTop(r), d - 170), false);
      }
    }

    /* ---------- carcasses: boards, holes, shelf pins, legs, the fridge, plinth grilles ---------- */
    const carcasses = model.carcasses;
    for (const c of carcasses) { c.parts = []; c.movers = []; }
    function holes(a, part) {                      // a disc on the drilled face, 0.6 mm proud; small holes as 12 mm markers
      for (const h of part.holes || []) {
        const out = -h.dir * 0.6, p = h.axis === 'u' ? [h.u + out, h.v, h.n] : [h.u, h.v, h.n + out];
        const radius = h.kind === 'bumper' ? h.diameter / 2 : Math.max(h.diameter / 2, 6);
        cylinder(a, radius, 1, K('hole.' + holeUse(h.kind)), ...p, h.axis === 'u' ? 'x' : 'z', 32, false);
      }
    }
    function buildCarcass(carcass) {
      const r = String(carcass.group), { u0, u1, v0 } = carcass, drilled = at(r, 'holes');
      for (const b of model.boards) {
        if (b.carcassId !== carcass.id || b.frontId || b.id === 'pullOutShelf') continue;   // drawer boards and the pull-out shelf move
        board(STATIC, b, carcass);
        holes(drilled, b);
        if (b.id === 'adjustableShelf') {          // 4 pins under the shelf, in the holes settings.drilling.shelfPin places
          const pin = settings.drilling.shelfPin, y = b.box[2] - pin.belowShelf, d = pin.diameter / 2;
          for (const [x0, x1] of [[b.box[0] - 1, b.box[0] + 7], [b.box[1] - 7, b.box[1] + 1]]) for (const n of [carcassBack + pin.fromBack, carcassFront - pin.fromFront]) {
            box(STATIC, r, [x0, x1, y - d, y + d, n - d, n + d], K('zinc'), 'shelves', { name: carcass.name + ' podpórka półki' });
          }
        }
      }
      if (carcass.floor) {                         // adjustable legs, as tall as the plinth
        const L = HW.leg, a = at(r, 'legs');
        for (const u of [u0 + L.fromSide, u1 - L.fromSide]) for (const n of [carcassBack + L.fromBack, carcassFront - L.fromFront]) {
          cylinder(a, L.radius, v0 - L.footHeight, K('leg'), u, (v0 - L.footHeight) / 2, n, null, 16);
          cylinder(a, L.footRadius, L.footHeight, K('leg'), u, v0 - L.footHeight / 2, n, null, 20);
          envelope(r, [u - L.footRadius, u + L.footRadius, v0 - L.footHeight, v0, n - L.footRadius, n + L.footRadius], carcass.name + ' nóżka', 'leg');
        }
      }
      if (carcass.fridge && carcass.boxes.some(b => b.fit)) fridgeBody(carcass);
      if (carcass.grille) plinthGrille(carcass);
    }
    /* aluminium grille in the plinth under a carcass that needs air (model.js carcass.grille) */
    function plinthGrille(carcass) {
      const g = HW.plinthGrille, r = String(carcass.group), uc = (carcass.u0 + carcass.u1) / 2, w = Math.min(g.width, carcass.u1 - carcass.u0 - 80);
      const g0 = uc - w / 2, g1 = uc + w / 2, h0 = g.bottom, h1 = g.top, I = { name: 'Kratka wentylacyjna w cokole', part: onePart() };
      const z = gb => box(STATIC, r, gb, K('zinc'), 'plinth', I);
      z([g0, g1, h0, h0 + 5, plinthFace, plinthFace + 3]); z([g0, g1, h1 - 5, h1, plinthFace, plinthFace + 3]);
      z([g0, g0 + 5, h0 + 5, h1 - 5, plinthFace, plinthFace + 3]); z([g1 - 5, g1, h0 + 5, h1 - 5, plinthFace, plinthFace + 3]);
      for (let x = g0 + 17; x < g1 - 8; x += 12) z([x - 2, x + 2, h0 + 5, h1 - 5, plinthFace, plinthFace + 2]);   // louvres
    }
    /* the built-in fridge-freezer where model.js fits it, its doors at the carcass front */
    const fridgeDoorPlane = carcassFront - APPLIANCES.fridgeFreezer.doorDepth;
    function fridgeBody(carcass) {
      const A = APPLIANCES.fridgeFreezer, r = String(carcass.group), fit = carcass.boxes.find(b => b.fit).fit, I = { name: A.name };
      const { bodyU0: u0, bodyU1: u1, bodyV0: v0, bodyV1: v1 } = fit, f = (gb, key) => box(STATIC, r, gb, key, 'fridge', I);
      envelope(r, [u0, u1, v0, v1, carcassFront - A.body.depth, fridgeDoorPlane], A.name + ' – korpus ' + A.body.width + ' × ' + A.body.height + ' (bez drzwi)');
      openFront(STATIC, r, [u0, u1, v0, v1, carcassFront - A.body.depth, fridgeDoorPlane], 24, K('fridge'), 'fridge', I);
      const split = v0 + (A.doors.freezer.top + A.doors.fridge.bottom) / 2, top = v1 - 24, lo = split + 14;
      f([u0 + 24, u1 - 24, split - 14, split + 14, carcassBack + 42, fridgeDoorPlane], K('fridge'));
      for (const k of [0.34, 0.56, 0.78]) { const y = lo + (top - lo) * k; f([u0 + 26, u1 - 26, y, y + 5, carcassBack + 44, carcassFront - 124], K('glassShelf')); }
      f([u0 + 40, u1 - 40, lo + 8, lo + 190, carcassBack + 60, carcassFront - 134], K('ice'));
      const f0 = v0 + 24, f1 = split - 14, dh = (f1 - f0) / 3;
      for (let j = 0; j < 3; j++) f([u0 + 34, u1 - 34, f0 + j * dh + 8, f0 + (j + 1) * dh - 8, carcassBack + 50, carcassFront - 84], K('ice'));
      f([u0 + 140, u1 - 140, top - 5, top, carcassBack + 226, carcassBack + 316], K('led'));
    }

    /* ---------- fronts and what moves with them ---------- */
    function shakerFront(m, u0, u1, v0, v1, key, info) {   // a frame of shakerRail wide rails round a recessed panel, one part
      const w = shakerRail, n0 = frontFace - frontThickness, n1 = frontFace, I = Object.assign({ part: onePart() }, info), f = gb => box(m.cells, m.r, gb, key, 'fronts', I);
      if (u1 - u0 <= 2 * w + 20 || v1 - v0 <= 2 * w + 20) return f([u0, u1, v0, v1, n0, n1]);
      f([u0, u1, v1 - w, v1, n0, n1]); f([u0, u1, v0, v0 + w, n0, n1]); f([u0, u0 + w, v0 + w, v1 - w, n0, n1]); f([u1 - w, u1, v0 + w, v1 - w, n0, n1]);
      f([u0 + w, u1 - w, v0 + w, v1 - w, n0, frontFace - frontThickness / 2]);
    }
    /* every front gets a cup and a bar handle; the handle setting shows one (layers cup / bar) */
    const CUP = (function () {                     // an open quarter shell with its end caps, a lip and two pads, mm
      const L = HW.handle.cupLength, R = 24, y0 = -12, parts = [];
      const shell = new THREE.CylinderGeometry(R, R, L - 6, 28, 1, true, 0, Math.PI / 2); shell.rotateZ(Math.PI / 2); shell.translate(0, y0, 0); parts.push(shell);
      for (const sx of [-1, 1]) { const c = new THREE.CircleGeometry(R, 20, 0, Math.PI / 2); c.rotateY(-Math.PI / 2); c.translate(sx * (L / 2 - 3), y0, 0); parts.push(c); }
      const lip = new THREE.CylinderGeometry(2.2, 2.2, L - 6, 10); lip.rotateZ(Math.PI / 2); lip.translate(0, y0, R); parts.push(lip);
      for (const sx of [-1, 1]) { const pad = new THREE.BoxGeometry(12, 26, 4); pad.translate(sx * 32, y0 + 13, 2); parts.push(pad); }
      return parts;
    })();
    function handles(m, u0, u1, v0, v1, position, info) {
      if (!position) return;
      const H = HW.handle, L = H.barLength, n = frontFace + 4, cup = at(m.r, 'handles', m, ['cup']);
      const I = Object.assign({ also: ['bar'], part: onePart() }, info), bar = gb => box(m.cells, m.r, gb, K('handle'), 'handles', I);
      const addCup = (u, v, turn) => { const o = new THREE.Group(); o.position.set(u, v, frontFace); o.rotation.z = turn; cup.frame.add(o);
        for (const g of CUP) detail(Object.assign({}, cup, { frame: o }), g, K('handle'), 0, 0, 0); };
      if (position === 'top' || position === 'bottom') {
        const v = position === 'top' ? v1 - H.axis : v0 + H.axis, uc = (u0 + u1) / 2;
        addCup(uc, v, 0);
        bar([uc - L / 2, uc + L / 2, v - 6, v + 6, n + 20, n + 30]); bar([uc - L / 2 + 8, uc - L / 2 + 18, v - 5, v + 5, n, n + 20]); bar([uc + L / 2 - 18, uc + L / 2 - 8, v - 5, v + 5, n, n + 20]);
      } else {
        const u = position === 'left' ? u0 + H.axis : u1 - H.axis, vc = Math.min(v0 + H.sideHeight, (v0 + v1) / 2);
        addCup(u, vc, position === 'left' ? Math.PI / 2 : -Math.PI / 2);
        bar([u - 6, u + 6, vc - L / 2, vc + L / 2, n + 20, n + 30]); bar([u - 5, u + 5, vc - L / 2 + 8, vc - L / 2 + 18, n, n + 20]); bar([u - 5, u + 5, vc + L / 2 - 18, vc + L / 2 - 8, n, n + 20]);
      }
    }
    function buildFront(r, item) {
      const front = item.front, carcass = carcasses.find(c => c.id === item.carcassId), opening = front.opening, hand = front.hand;
      const { u0: fu0, u1: fu1, v0: fv0, v1: fv1, width: fw, height: fh } = front, size = Math.round(fw) + ' × ' + Math.round(fh);
      let pu = 0, pv = 0, pn = 0;                  // the pivot: the hinge edge of a door, the bottom edge of a dishwasher door
      if (opening === 'door' || opening === 'fridge') { pu = hand === 'left' ? fu0 : fu1; pn = frontFace; }
      else if (opening === 'dishwasher') { pv = item.fit.doorV0; pn = frontFace; }
      const m = mover(r, opening, pu, pv, pn);
      Object.assign(m, { sign: hand === 'left' ? 1 : -1, item });
      if (opening === 'door' && carcass && (HW.open.doorStop || {})[carcass.name]) m.travel = HW.open.doorStop[carcass.name];
      if (carcass) carcass.movers.push(m);
      const I = { mover: m };
      shakerFront(m, fu0, fu1, fv0, fv1, K(front.material), I);
      handles(m, fu0, fu1, fv0, fv1, item.handle, I);
      if (opening === 'door' && carcass) {
        const cup = settings.drilling.cup, dir = hand === 'left' ? 1 : -1, side = front.hingeU, cupU = hand === 'left' ? fu0 + cup.fromEdge : fu1 - cup.fromEdge;
        const hw = at(r, 'hardware'), mhw = at(r, 'hardware', m);
        holes(at(r, 'fronts', m, ['holes']), front);
        for (const v of front.hinges) {
          const H = { name: 'Zawias', part: onePart() };
          box(STATIC, r, [Math.min(side, side + dir * 10), Math.max(side, side + dir * 10), v - 22, v + 22, carcassFront - 75, carcassFront - 30], K('zinc'), 'hardware', H);   // mounting plate
          box(STATIC, r, [Math.min(side + dir * 3, side + dir * 20), Math.max(side + dir * 3, side + dir * 20), v - 9, v + 9, carcassFront - 70, carcassFront - 2], K('zinc'), 'hardware', H);   // arm
          cylinder(mhw, cup.diameter / 2 - 0.5, HW.hinge.cupDepth, K('zinc'), cupU, v, frontFace - frontThickness + HW.hinge.cupDepth / 2, 'z', 24);   // the cup in the door
          cylinder(mhw, 24, 1.5, K('zinc'), cupU, v, carcassFront - 1, 'z', 24);
        }
        const bumper = settings.drilling.bumper, gap = frontFace - frontThickness - carcassFront;   // the head fills the front gap, 0.2 short of the door
        for (const b of front.bumpers || []) cylinder(hw, bumper.diameter / 2 + 1.5, gap - 0.2, K('gasket'), b.u, b.v, carcassFront + (gap - 0.2) / 2, 'z', 16);
        m.label = 'Drzwi ' + size + ' · zawiasy: ' + front.hinges.length + ' · odbojniki: ' + (front.bumpers || []).length + (front.doorDrawers ? ' · za nimi szuflady: ' + front.doorDrawers.count : '');
        if (front.doorDrawers) doorDrawers(r, item, m, carcass);
      } else if (opening === 'drawer' && carcass) {
        drawer(r, item, m, carcass, size);
      } else if (opening === 'dishwasher') {
        const A = APPLIANCES.dishwasher, uc = (item.u0 + item.u1) / 2, { bodyU0: w0, bodyU1: w1, bodyV1: h, doorV0: db, doorV1: dt } = item.fit, W = { name: A.name };
        const t0 = db, t1 = h - 6;
        openFront(STATIC, r, [w0 + 3, w1 - 3, t0, t1, carcassBack + 8, carcassFront - 24], 2, K('steel'), 'dishwasher', W);   // the tub
        for (const [y0, y1] of [[t0 + 80, t0 + 220], [t1 - 380, t1 - 250]]) openTop(STATIC, r, [w0 + 29, w1 - 29, y0, y1, carcassBack + 40, carcassFront - 50], 3, K('wire'), 'dishwasher', W);   // racks
        box(STATIC, r, [uc - 200, uc + 200, t0 + 63, t0 + 71, (carcassBack + carcassFront) / 2 - 25, (carcassBack + carcassFront) / 2 + 25], K('steel'), 'dishwasher', W);   // spray arm
        box(m.cells, r, [w0, w1, db, h - 6, carcassFront - 22, carcassFront], K('steel'), 'dishwasher', I);      // the appliance door
        box(m.cells, r, [w0, w1, h - 6, h, carcassFront - 22, carcassFront], K('glassBlack'), 'dishwasher', I);  // its control strip
        m.label = 'Zmywarka · front ' + size + ' na drzwiach urządzenia';
        envelope(r, [w0, w1, db, h, carcassFront - A.body.depth, carcassFront], A.name + ' – ' + A.body.width + ' × ' + Math.round(h) + ' × ' + A.body.depth + ', drzwi ' + Math.round(dt - db));
        envelope(r, [w0, w1, 0, db, carcassFront - A.body.depth, carcassFront - A.baseSetback], A.name + ' – podstawa, ' + A.baseSetback + ' za frontem');
      } else if (opening === 'fridge' && item.fit) {
        const A = APPLIANCES.fridgeFreezer, freezer = KE.hasTag(item, 'freezer'), D = freezer ? A.doors.freezer : A.doors.fridge;
        const bu0 = item.fit.bodyU0, bu1 = item.fit.bodyU1, d0 = item.fit.bodyV0 + D.bottom, d1 = item.fit.bodyV0 + D.top;
        envelope(r, [bu0, bu1, d0, d1, fridgeDoorPlane, carcassFront], A.name + ' – drzwi ' + (freezer ? 'zamrażarki ' : 'lodówki ') + (D.top - D.bottom));
        box(m.cells, r, [bu0, bu1, d0, d1, fridgeDoorPlane, carcassFront - 2], K('fridge'), 'fridge', I);
        if (!freezer) for (const k of [0.25, 0.5, 0.75]) { const y = d0 + (d1 - d0) * k; box(m.cells, r, [carcass.u0 + 55, carcass.u1 - 55, y, y + 80, fridgeDoorPlane - 54, fridgeDoorPlane], K('ice'), 'fridge', I); }
        m.label = (freezer ? 'Zamrażarka' : 'Lodówka') + ' · front ' + size + ' na drzwiach urządzenia';
      } else if (opening === 'fixed') m.label = 'Front atrapa ' + size + ' · stały';
      if (!m.label) m.label = 'Front ' + size;
    }
    /* a drawer: its boards, metal sides and runners (the carcass part stays, the drawer part moves); bins; an inner drawer */
    function drawer(r, item, m, carcass, size) {
      const front = item.front, { size: kind, sideHeight, innerU0, innerU1, bottomV: b0, bins, inner } = front.drawer, D = HW.drawer, I = { mover: m, carcass };
      const s0 = D.sideFromCarcass, s1 = s0 + D.sideThickness, n0 = carcassBack + D.fromBack, n1 = carcassFront - D.fromFront;
      const sides = (mv, y0, y1) => { for (const [a, b] of [[innerU0 + s0, innerU0 + s1], [innerU1 - s1, innerU1 - s0]]) box(mv.cells, r, [a, b, y0, y1, n0, n1], K('drawerSide'), 'drawers', { mover: mv, carcass }); };
      const runners = (mv, v) => {
        for (const [a, b, c, e] of [[innerU0, innerU0 + D.runnerWidth, innerU0 + D.runnerWidth, innerU0 + s0], [innerU1 - D.runnerWidth, innerU1, innerU1 - s0, innerU1 - D.runnerWidth]]) {
          box(STATIC, r, [a, b, v - 24, v - 8, n0, n1 + 2], K('zinc'), 'hardware', { name: 'Prowadnica szuflady' });
          box(mv.cells, r, [Math.min(c, e), Math.max(c, e), v - 20, v - 6, n0 + 8, n1 - 2], K('zinc'), 'hardware', { mover: mv });
        }
      };
      for (const b of model.boards) if (b.frontId === front.id && !b.inner) board(m.cells, b, carcass, 'drawers', m);
      sides(m, b0 - 4, b0 + sideHeight - 4);
      if (kind === 'D') for (const [a, b] of [[innerU0 + 28, innerU0 + 32], [innerU1 - 32, innerU1 - 28]]) box(m.cells, r, [a, b, b0 + sideHeight - 4, b0 + sideHeight + 60, carcassBack + 46, carcassFront - 24], K('drawerSide'), 'drawers', I);   // gallery rails
      runners(m, b0);
      if (bins) {
        const count = HW.bins.count, x0 = innerU0 + 45, x1 = innerU1 - 45, bw = (x1 - x0 - 10 * (count - 1)) / count, floor = b0 + T.drawerBox, top = floor + HW.bins.height;
        for (let j = 0; j < count; j++) {
          const a = x0 + j * (bw + 10), b = a + bw;
          openTop(m.cells, r, [a, b, floor, top, carcassBack + 66, carcassFront - 44], 4, K('bin'), 'drawers', I);
          box(m.cells, r, [a + bw * 0.3, b - bw * 0.3, top - 14, top - 4, carcassFront - 54, carcassFront - 40], K('bin'), 'drawers', I);
        }
      }
      const name = 'szuflada ' + kind + ' (' + sideHeight + ')';
      m.label = (bins ? 'Zlewowa ' + name + ' z koszami na odpady' : kind === 'D' ? 'Szuflada ' + kind + ' (' + sideHeight + ')' : 'Górna ' + name + (inner ? ' + szuflada wewnętrzna nad nią' : '')) + ' · front ' + size;
      if (inner) {                                  // a shallow cutlery drawer above the box, behind the same front, on its own runners
        const iv = front.drawer.innerV, im = mover(r, 'drawer', 0, 0, 0), M = settings.drawers.M.sideHeight, top = iv - 4 + M, J = { mover: im, carcass };
        Object.assign(im, { item }); carcass.movers.push(im); linkTo(m, im);
        for (const b of model.boards) if (b.frontId === front.id && b.inner) board(im.cells, b, carcass, 'drawers', im);
        sides(im, iv - 4, top);
        box(im.cells, r, [innerU0 + s1, innerU1 - s1, iv - 4, top, n1 - 16, n1 - 2], K('drawerSide'), 'drawers', J);   // its metal front
        for (let j = 1; j < 5; j++) { const x = innerU0 + s1 + (innerU1 - innerU0 - 2 * s1) * j / 5; box(im.cells, r, [x - 3, x + 3, iv + 16, iv + 66, carcassBack + 76, carcassFront - 44], K('insert'), 'drawers', J); }
        box(im.cells, r, [innerU0 + 40, innerU1 - 40, iv + 16, iv + 20, carcassBack + 76, carcassFront - 44], K('insert'), 'drawers', J);
        runners(im, iv);
        im.label = 'Szuflada wewnętrzna M (' + M + ') na sztućce · front wewnętrzny ' + (innerU1 - innerU0 - settings.drawers.inner.frontDeduction);
      }
    }
    /* drawers behind a door: each box slides out on ball runners once the door is open */
    function doorDrawers(r, item, door, carcass) {
      const front = item.front, DD = front.doorDrawers, clearance = settings.doorDrawers.clearance;
      DD.boxes.forEach((b, j) => {
        const m = mover(r, 'drawer', 0, 0, 0);
        Object.assign(m, { item, travel: DD.runnerLength, label: 'Szuflada za drzwiami ' + (j + 1) + '/' + DD.count + ' · ' + DD.boxWidth + ' × ' + DD.runnerLength + ' × ' + DD.boxHeight + ', prowadnice kulkowe ' + DD.runnerLength });
        carcass.movers.push(m); linkTo(door, m);
        for (const x of model.boards) if (x.frontId === front.id && x.doorDrawer === j) board(m.cells, x, carcass, 'drawers', m);
        const y0 = b.v0 + T.drawerBox + 20, y1 = y0 + 35;
        for (const [a, c] of [[b.u0 - clearance, b.u0], [b.u1, b.u1 + clearance]]) {
          const left = a < b.u0;
          box(STATIC, r, [...(left ? [a, a + clearance / 2] : [c - clearance / 2, c]), y0, y1, b.n0, b.n1], K('zinc'), 'hardware', { name: 'Prowadnica kulkowa' });
          box(m.cells, r, [...(left ? [a + clearance / 2, b.u0] : [b.u1, c - clearance / 2]), y0 + 4, y1 - 4, b.n0 + 4, b.n1 - 2], K('zinc'), 'hardware', { mover: m });
        }
      });
    }
    /* the pull-out shelf with the coffee machine: slides out once its door is open */
    function pullOutShelf(shelf) {
      const carcass = carcasses.find(c => c.id === shelf.carcassId), r = String(carcass.group), door = carcass.movers.find(m => m.kind === 'door' && m.item === shelf.item);
      const m = mover(r, 'drawer', 0, 0, 0), [x0, x1, y0, y1, z0, z1] = shelf.box;
      Object.assign(m, { item: shelf.item }); carcass.movers.push(m);
      if (door) linkTo(door, m);
      board(m.cells, shelf, carcass, 'drawers', m);
      const spacer = model.boards.find(b => b.carcassId === carcass.id && b.id === 'spacer' && b.box[2] < y0 && b.box[3] > y0 && (b.box[1] <= x0 || b.box[0] >= x1));
      const left = spacer && spacer.box[1] <= x0 ? spacer.box[1] : carcass.u0 + T.carcass, right = spacer && spacer.box[0] >= x1 ? spacer.box[0] : carcass.u1 - T.carcass;
      for (const [a, b] of [[left, x0], [x1, right]]) {
        box(STATIC, r, [a, b, y0 - 14, y0, z0, z1], K('zinc'), 'hardware', { name: 'Prowadnica półki wysuwanej' });
        box(m.cells, r, [a, b, y0, y0 + 12, z0 + 8, z1 - 4], K('zinc'), 'hardware', { mover: m });
      }
      coffeeMachine(m, (x0 + x1) / 2, y1, z1 - 20);
      m.label = 'Półka wysuwana ' + shelf.a + ' × ' + shelf.b + ' z ' + APPLIANCES.coffee.name;
    }
    function coffeeMachine(m, uc, y, n1) {
      const A = APPLIANCES.coffee, { width: w, height: h, depth: d } = A.body, u0 = uc - w / 2, u1 = uc + w / 2, n0 = n1 - d, top = y + h, head = top - 115, fp = n1 - 45, r = m.r;
      const I = { mover: m, name: A.name }, c = (gb, key) => box(m.cells, r, gb, key, 'coffee', I), a = at(r, 'coffee', m);
      envelope(r, [u0, u1, y, top, n0, n1], A.name + ' ' + w + ' × ' + h + ' × ' + d);
      c([u0, u1, y, top, n0, fp], K('blackMetal'));                                        // body
      c([u0, u0 + 28, y, head, fp, n1], K('steel')); c([u1 - 28, u1, y, head, fp, n1], K('steel'));   // front side columns
      c([u0, u1, head, top, fp, n1], K('steel'));                                          // head with the controls
      c([u0 + 18, u1 - 18, head + 28, top - 14, n1, n1 + 2], K('glassBlack'));
      display(a, 'ESPRESSO', 110, 30, uc, top - 40, n1 + 2.5);
      for (let i = 0; i < 4; i++) cylinder(a, 6, 3, K('steel'), u0 + 50 + i * (w - 100) / 3, head + 40, n1 + 3, 'z', 16);
      c([u0 + 28, u1 - 28, y + 32, head, fp, fp + 3], K('ovenInside'));                    // brew recess
      c([uc - 32, uc + 32, head - 34, head, fp, n1 - 8], K('steel'));                      // spout unit
      for (const du of [-12, 12]) cylinder(a, 5, 16, K('steel'), uc + du, head - 42, n1 - 24, null, 12);
      c([u0 + 6, u1 - 6, y, y + 30, fp - 60, n1 + 6], K('steel'));                         // drip tray
      c([u0 + 22, u1 - 22, y + 30, y + 32, fp - 40, n1 - 4], K('zinc'));
      cylinder(a, 32, 62, K('fridge'), uc, y + 63, n1 - 26, null, 28);                     // a cup
      c([uc - 70, uc + 70, top, top + 6, n0 + 30, n0 + 190], K('blackMetal'));             // bean container lid
      cylinder(a, 5, 150, K('steel'), u1 + 10, head - 60, n1 - 40, null, 12);              // steam wand
      cylinder(a, 8, 20, K('blackMetal'), u1 + 10, head + 20, n1 - 40, null, 16);
    }

    /* ---------- lamps: pendants over the island, downlights in the ceiling (lit at night) ---------- */
    function lamp(light, from, to, shadow) {
      light.position.copy(V.toWorld(...from));
      if (to) { light.target.position.copy(V.toWorld(...to)); V.scene.add(light.target); }
      light.visible = false; V.scene.add(light);
      LAMPS.push({ light, shadow });
      if (shadow) { light.shadow.mapSize.set(1024, 1024); light.shadow.camera.near = 0.1; light.shadow.camera.far = (from[2] - LEVEL) / 1000 + 0.3; light.shadow.bias = -0.0002; light.shadow.normalBias = 0.015; }
    }
    function buildLamps() {
      const L = SCENE.lights, P = L.pendants, r = String(P.group), wt = worktopOf(r), top = itemsOf(r).find(i => i.type === 'worktop');
      const mid = top ? (top.u0 + top.u1) / 2 : groupLength(r) / 2, y = L.pendantBottom, a = at(r, 'lamps');
      for (let i = 0; i < P.count; i++) {
        const u = mid + (i - (P.count - 1) / 2) * P.spacing, n = (wt.n0 + wt.n1) / 2;
        cylinder(a, 2, CEILING - y - 90, K('gasket'), u, (CEILING + y + 90) / 2, n, null, 6);   // cable
        detail(a, new THREE.SphereGeometry(150, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), K('shade'), u, y + 60, n);
        const inside = detail(a, new THREE.SphereGeometry(148, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), K('shadeInside'), u, y + 60, n, false);
        inside.material = V.material(K('shadeInside')).clone(); inside.material.side = THREE.BackSide;
        detail(a, new THREE.TorusGeometry(150, 4, 8, 48), K('handle'), u, y + 60, n).rotation.x = Math.PI / 2;
        cylinder(a, 14, 40, K('gasket'), u, y + 180, n, null, 16);
        detail(a, new THREE.SphereGeometry(32, 20, 12), K('bulb'), u, y + 135, n, false);
        lamp(new THREE.PointLight(0xffd9a8, 1.2, 0.9, 2), point(r, u, y + 135, n), null, false);
        lamp(new THREE.SpotLight(0xffd9a8, 7, 5, 1.2, 0.8, 2), point(r, u, y + 135, n), point(r, u, 0, n), true);
      }
      /* downlights: at {group, u, n} (n from the wall), or between the axes of the sink and the hob */
      const axisU = { sink: sinkU, hob: hobU }, ceiling = ROOM.objects.find(o => o.role === 'ceiling');
      for (const d of L.downlights) {
        const g = String(d.group), u = d.between ? d.between.reduce((s, k) => s + axisU[k], 0) / d.between.length : d.u, n = GROUP(g).wall + d.n;
        const c = at(g, 'ceiling', null, ceiling ? ['o:' + ceiling.id] : []); c.layers = c.layers.filter(k => k !== 'g' + g);   // hidden with the ceiling, not with the group
        const tube = detail(c, new THREE.CylinderGeometry(35, 35, 100, 40, 1, true), K('tube'), u, CEILING - 50, n);
        tube.material = V.material(K('tube')).clone(); tube.material.side = THREE.DoubleSide;
        detail(c, new THREE.CircleGeometry(27, 32), K('bulb'), u, CEILING - 85, n, false).rotation.x = Math.PI / 2;
        lamp(new THREE.SpotLight(0xfff0dc, 11, 0, 1.0, 1, 2), point(g, u, CEILING - 90, n), point(g, u, 0, n), true);
      }
    }

    /* ---------- build it all ---------- */
    GROUP_IDS.forEach(buildGroup);
    for (const b of model.boards) if (b.id === 'backStrip') board(STATIC, b, null, 'carcasses');
    for (const p of model.frontPanels) if (!p.item) look(box(STATIC, String(p.group), p.box, K(p.material), 'frontPanel', { check: 'frontPanel', name: 'G' + p.group + ' ' + p.name + ' ' + p.a + ' × ' + p.b }), p.material, { banded: p.edges.map(e => e.side) });
    if (sinkItem) buildSink();
    if (hobItem && hobCut) buildHob();
    if (hobItem) buildHood();
    carcasses.forEach(buildCarcass);
    for (const r of GROUP_IDS) for (const item of itemsOf(r)) if (KE.FRONT_TYPES.includes(item.type)) buildFront(r, item);
    model.boards.filter(b => b.id === 'pullOutShelf').forEach(pullOutShelf);
    buildLamps();

    /* ---------- the room: the house's own solids (../../house/shell.js), as they are. Each side of the room (a wall, the floor, the
       ceiling) is one object, hidden while the camera stands behind it; a window goes with its wall. The top of the floor
       slab shows the floor tiles chosen here. ---------- */
    const ROLE_LAYER = { wall: 'walls', floor: 'floor', ceiling: 'ceiling', window: 'window' };
    const SIDE_NORMAL = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
    const SIDES = [];
    if (opts.room) for (const o of ROOM.objects) {
      const key = 'o:' + (o.role === 'window' && o.host ? o.host : o.id);
      for (const c of o.cells) {
        const cell = Object.assign({}, c, { layers: [ROLE_LAYER[o.role], key], info: {} });
        delete cell.finish;                        // the house's facade layers are not on this page
        if (o.role === 'floor') cell.faceMaterial = n => (n[2] > 0.5 ? K('floor') : c.material);
        STATIC.push(cell);
      }
      if (o.role === 'window') continue;
      const mids = o.cells.map(c => { const ys = c.S.poly.map(p => p[0]), [z1, z2] = G.zRange(c.S); return [(c.S.x1 + c.S.x2) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (z1 + z2) / 2]; });
      SIDES.push({ key, normal: SIDE_NORMAL[o.side], mid: [0, 1, 2].map(k => mids.reduce((s, p) => s + p[k], 0) / mids.length) });
    }

    /* ---------- meshes: the static solids in one set; each moving part in its own, under its pivot ---------- */
    const PIECES = piecesOf(STATIC);
    V.buildMeshes(PIECES); V.buildEdges(PIECES);
    for (const m of MOVERS) { const p = piecesOf(m.cells); V.buildMeshes(p, m.inner); V.buildEdges(p, m.inner); }
    for (const g of V.GROUPS) if (g.cell.info && g.cell.info.board) g.base = g.mesh.material;
    /* maps drawn here: the granite of the sink, the floor tiles (uv in mm) */
    (function granite() {
      const t = V.canvasTexture(256, 256, (g, w, h) => {
        g.fillStyle = '#2a2b2d'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 5200; i++) {
          const k = V.hash01(i, 3), s = 0.6 + V.hash01(i, 4) * 1.4;
          g.fillStyle = k > 0.78 ? `rgba(190,190,186,${0.2 + V.hash01(i, 5) * 0.3})` : k > 0.35 ? 'rgba(90,90,92,.6)' : 'rgba(10,10,11,.7)';
          g.fillRect(V.hash01(i, 1) * w, V.hash01(i, 2) * h, s, s);
        }
      });
      t.repeat.set(1 / 250, 1 / 250);
      V.material(K('granite')).map = t;
    })();
    const FLOOR_TILES = 4;                         // a square of 4 × 4 tiles, each a face at random, turned 0 or 180°
    function floorTexture(key) {
      const F = FLOORS[key], px = 512, J = SCENE.room.floorJoint, c = document.createElement('canvas');
      c.width = c.height = FLOOR_TILES * px;
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = V.renderer.capabilities.getMaxAnisotropy();
      t.repeat.set(1 / (FLOOR_TILES * (F.size.width + J)), 1 / (FLOOR_TILES * (F.size.length + J)));
      Promise.all(F.faces.map(src => { const im = new Image(); im.src = src; return im.decode().then(() => im); })).then(faces => {
        const g = c.getContext('2d'), joint = Math.max(1, px * J / (F.size.width + J));
        g.fillStyle = F.grout; g.fillRect(0, 0, c.width, c.height);
        for (let y = 0; y < FLOOR_TILES; y++) for (let x = 0; x < FLOOR_TILES; x++) {
          const face = faces[Math.floor(V.hash01(x, y, 19) * faces.length)];
          g.save(); g.translate(x * px + px / 2, y * px + px / 2); if (V.hash01(x, y, 23) < 0.5) g.rotate(Math.PI);
          g.drawImage(face, -px / 2 + joint / 2, -px / 2 + joint / 2, px - joint, px - joint); g.restore();
        }
        t.needsUpdate = true; V.redraw();
      });
      return t;
    }


    const LAMP_MATERIALS = [K('bulb'), K('led')].map(k => V.material(k));
    /* doors and drawers move toward their goal */
    const reducedMotion = V.reducedMotion;
    V.onFrame(dt => {
      let moved = false;
      for (const m of MOVERS) {
        if (m.progress === m.goal) continue;
        m.progress = m.goal > m.progress ? Math.min(m.goal, m.progress + dt * 1.8) : Math.max(m.goal, m.progress - dt * 1.8);
        pose(m); moved = true;
      }
      return moved;
    });
    function setGoal(m, goal) { m.goal = goal; if (reducedMotion) { m.progress = goal; pose(m); V.redraw(); } }
    /* on: true / false / undefined = switch; what is behind a closed part opens it first; closing a part closes what is behind it */
    function toggle(m, on) {
      const goal = on === undefined ? (m.goal ? 0 : 1) : on ? 1 : 0;
      if (goal && m.parent && !m.parent.goal) return setGoal(m.parent, 1);
      setGoal(m, goal);
      if (!goal) for (const c of m.children) setGoal(c, 0);
    }

    const visibleChain = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    function ownerAlong(ray) {
      const meshes = [];
      V.root.traverse(o => { if (o.isMesh && visibleChain(o) && ![].concat(o.material).every(m => m.transparent && m.opacity < 0.5)) meshes.push(o); });
      const hit = ray.intersectObjects(meshes, false).find(h => V.CUT.distanceToPoint(h.point) >= 0);   // over a cut nothing is drawn
      if (!hit) return null;
      return hit.object.userData.owners ? hit.object.userData.owners[hit.faceIndex] : hit.object.userData.owner || null;
    }

    /* what a host without the kitchen's panel shows: every layer on, the cup handles */
    const shown = layers => layers.every(k => (k === 'cup' || k === 'bar' ? k === 'cup' : true));
    const showDetails = shown => { for (const d of DETAILS) d.mesh.visible = shown(d.layers); };
    function night(on) {
      for (const { light, shadow } of LAMPS) { light.visible = on; light.castShadow = on && shadow; }
      for (const m of LAMP_MATERIALS) { m.emissive.set(on ? 0xfff0dc : 0x000000); m.emissiveIntensity = on ? 2 : 1; }
    }
    /* a click on a door, a drawer or an appliance door of the kitchen opens or closes it */
    function click(ray) {
      const o = ownerAlong(ray), m = o && o.info && o.info.mover;
      if (!m || m.kind === 'fixed' || !MOVERS.includes(m)) return false;
      toggle(m);
      return true;
    }
    return { finishes: [], solids: STATIC.filter(c => !c.layers.some(k => k.startsWith('o:'))), shown, showDetails, click, night,
      STATIC, MOVERS, DETAILS, ENVELOPES, LAMPS, LAMP_MATERIALS, UNDRAWN, SIDES, PIECES, carcasses, floorTexture, ownerAlong, toggle };
  }

  const rooms = () => [{ floor: ROOM.floor, opts: {} }];   // one kitchen
  return { project, APPLIANCES, model, settings, ROOM, LAYERS, rooms, build,
    LEVEL, CEILING, DEG, frontFace, panelFace, carcassDepth, carcassBack, carcassFront, plinthFace, frontThickness, T, shakerRail, HW,
    GROUP_IDS, GROUP, groupLength, itemsOf, PLACE, point, houseBox,
    K, LIB, TEX, DECORS, FLOORS, FLOOR_KEYS, METALS, HOLE_COLORS, PANEL_COLORS, metal };
}

/* the textures the kitchen names: its board decors and the floor tiles to choose from */
const textures = () => Object.keys(root.KITCHEN_DESIGN.materials).map(key => root.LIBRARY_PRODUCTS.boards[key].texture)
  .concat(root.KITCHEN_VIEW.floors.map(k => root.LIBRARY_PRODUCTS.tiles[k].texture));

/* the implementation: its own page uses all of it, the house only what the interface names */
const KitchenRoom = { needs: ['../../house/shell.js', 'design.dat.js', 'scene.dat.js', 'model.js'], textures, make };
root.KitchenRoom = KitchenRoom;
root.ROOM_INTERFACE.register('kitchen', KitchenRoom);
})(window);
