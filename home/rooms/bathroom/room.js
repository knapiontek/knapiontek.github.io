/* rooms/bathroom/room.js: both bathrooms' furniture, an implementation of the interface ../../room.js: the drawing of design.dat.js (each
   floor's model: solids, doors and drawers, round details, lamps, in mm in house axes), drawn by core the same in
   index.html (with its room, from the house) and in the house (without: the house draws its own). Nothing is computed
   here to fit: what is drawn is what design.dat.js says. Tiles and board decors come from the library. */
(function (root) {
'use strict';

const SURFACES = ['wall', 'floor', 'shower', 'showerFloor'];
const WARM = 0xffdcb4;                     // the lamps: 3000 K
const PER_FLOOR = new Set(['metal', 'decor', 'decorTurned', 'basin', 'basinIn', 'rubber', 'doorPaint']);   // each bathroom its own
const DEG = Math.PI / 180;

/* env: {materials, textures, houseModel} (../../room.js) */
function make(env) {
  const CORE = root.CORE, THREE = root.THREE, D = root.BATH_DATA, PRODUCTS = root.LIBRARY_PRODUCTS, TEXTURES = root.LIBRARY_TEXTURES;
  const LIB = env.materials, TEX = env.textures, FLOORS = Object.keys(D.floors);
  const found = root.HouseShell.roomsFor(root.HOUSE, env.houseModel, 'rooms/bathroom/index.html');
  const ROOMS = Object.fromEntries(FLOORS.map(f => [f, found.find(r => r.floor === f)]));
  for (const f of FLOORS) if (!ROOMS[f]) throw new Error('W building.dat.js żadne pomieszczenie na kondygnacji ' + f + ' nie prowadzi do rooms/bathroom/index.html.');

  /* ---------- materials: definitions of core (core/scene.js material), under b.*; those of one bathroom end in :floor ---------- */
  const METALS = { brass: { color: '#b8935a', roughness: .32 }, nickel: { color: '#bab8b1', roughness: .28 } };
  Object.assign(LIB, {
    'b.ceramic': { color: '#f4f4f2', roughness: .1, clearcoat: .6, clearcoatRoughness: .08 },
    'b.glass':   { color: '#daeaec', roughness: .03, opacity: .18 },
    'b.mirror':  { color: '#d4dade', roughness: .03, metalness: 1 },
    'b.led':     { color: '#d8d6d0', roughness: .9, emissive: '#ffe2b0', glow: 0 },   // glowing strips and downlights, lit by night
    'b.frame':   { color: '#2a2c2e', roughness: .5, metalness: .3 },
    'b.white':   { color: '#f1f1ef', roughness: .4 },
    'b.ceiling': { color: '#f3f2ef', roughness: .9 },
    'b.gap':     { color: '#2a211a', roughness: .8 },
    'b.black':   { color: '#050505', roughness: 1 },
    'b.legrabox': { color: '#1e1f21', roughness: .42, metalness: .55 },   // czarny karbon matowy
    'b.pvc':     { color: '#8f969c', roughness: .5 },
    'b.slot':    { color: '#000000', roughness: .6 },             // the flush plate's slot
    'b.amber':   { color: '#7a4a1c', roughness: .15, clearcoat: 0, opacity: .85 },
    'b.stone':   { color: '#d9d4cb', roughness: .5 },
    'b.towel':   { color: '#cfc8bc', roughness: .95 },
    'b.aluminium': { color: '#1c1d1f', roughness: .55, reflect: .4 },   // anthracite aluminium frame
    'b.steel':   { color: '#7d8a93', roughness: .45, metalness: .5 },
    'b.blue':    { color: '#2f6db5', roughness: .5 },
    'b.showerHead': { color: '#222222', roughness: .8 },
    'b.acrylic': { color: '#f6f6f3', roughness: .18, clearcoat: .5, clearcoatRoughness: .1 },
    'b.fluted':  { color: '#8a9295' },                            // the cabinet's fluted glass: its look is made in build
  });
  const DECORS = {};
  for (const id of Object.keys(D.decors)) {
    const T = TEXTURES[PRODUCTS.boards[id].texture];
    if (!T) continue;
    TEX[PRODUCTS.boards[id].texture] = TEX[PRODUCTS.boards[id].texture] || { faces: T.faces, size: T.size };
    DECORS[id] = PRODUCTS.boards[id].texture;
  }
  for (const f of FLOORS) {
    const F = D.floors[f], basin = F.look.basin === 'white' ? '#f1f0ec' : '#0f0f10', decor = DECORS[F.defaultDecor] || Object.values(DECORS)[0];
    Object.assign(LIB, {
      ['b.metal:' + f]: { color: METALS.brass.color, metalness: 1, roughness: METALS.brass.roughness },
      ['b.decor:' + f]: { color: '#ffffff', roughness: .62, reflect: .3, image: { key: decor } },
      ['b.decorTurned:' + f]: { color: '#ffffff', roughness: .62, reflect: .3, image: { key: decor, turn: true } },   // the top: grain along the wall
      ['b.basin:' + f]: { color: basin, roughness: .62, clearcoat: .1, clearcoatRoughness: .6, reflect: .25 },
      ['b.basinIn:' + f]: { color: basin, roughness: .58, clearcoat: .12, clearcoatRoughness: .5, reflect: .25 },
      ['b.rubber:' + f]: { color: F.look.basin === 'white' ? '#e6e4df' : '#0b0b0b', roughness: .9 },
      ['b.doorPaint:' + f]: { color: '#' + F.look.doorPaint.toString(16).padStart(6, '0'), roughness: .85 },
    });
  }
  /* a material of the data, for a floor */
  const keyOf = (name, f) => (name.startsWith('tile:') ? 'tile:' + f + ':' + name.slice(5) : PER_FLOOR.has(name.slice(2)) ? name + ':' + f : name);

  /* ---------- tiles: each photo of the library is one whole tile; a block of them (random photo, turn and crop, grout)
     repeats over a surface. UVs of core are mm on the face plane. ---------- */
  const TILES = {};
  for (const id of D.defaults.tiles) {
    const T = TEXTURES[PRODUCTS.tiles[id].texture];
    TILES[id] = { id, size: T.size, grout: T.grout, faces: T.faces, images: null };
  }
  const GROUT = 3, PX_PER_MM = .512, MAX_PX = 2048, MAX_SIDE = 6;   // grout mm; texture pixels per mm; block size
  const seededRandom = seed => () => {      // mulberry32: the same tiles after every reload
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const hashString = s => [...s].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7);
  const powerOfTwo = px => Math.min(MAX_PX, 2 ** Math.round(Math.log2(px)));
  /* a tile's size on a surface, mm: {w: horizontal, h: vertical or in depth} */
  function tileSize(choice) {
    const [a, b] = choice.format.split('x').map(Number), long = Math.max(a, b), short = Math.min(a, b);
    return choice.layout === 'v' ? { w: short, h: long } : { w: long, h: short };
  }
  const textureCache = new Map();
  function blockOf(w, h) {
    const cols = Math.max(1, Math.min(MAX_SIDE, Math.floor(MAX_PX / (w * PX_PER_MM)))), rows = Math.max(1, Math.min(MAX_SIDE, Math.floor(MAX_PX / (h * PX_PER_MM))));
    const canvas = document.createElement('canvas');
    canvas.width = powerOfTwo(cols * w * PX_PER_MM); canvas.height = powerOfTwo(rows * h * PX_PER_MM);
    return { cols, rows, bw: cols * w, bh: rows * h, canvas };
  }
  function finish(canvas, bw, bh, srgb, anisotropy) {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = anisotropy; t.repeat.set(1 / bw, 1 / bh);
    return t;
  }
  function tileTexture(tile, w, h, anisotropy) {
    const key = `${tile.id}|${w}x${h}`;
    if (textureCache.has(key)) return textureCache.get(key);
    const { cols, rows, bw, bh, canvas } = blockOf(w, h), ctx = canvas.getContext('2d');
    ctx.scale(canvas.width / bw, canvas.height / bh);   // from here on in mm
    const random = seededRandom(hashString(key)), drawn = Math.max(tile.size[0], w, h);   // the photo covers the whole tile
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const image = tile.images[Math.floor(random() * tile.images.length)], turns = Math.floor(random() * 4);
      const [ex, ey] = turns % 2 ? [h, w] : [w, h], dx = (random() - .5) * (drawn - ex), dy = (random() - .5) * (drawn - ey);
      ctx.save(); ctx.beginPath(); ctx.rect(c * w, r * h, w, h); ctx.clip();
      ctx.translate(c * w + w / 2, r * h + h / 2); ctx.rotate(turns * Math.PI / 2);
      ctx.drawImage(image, -drawn / 2 + dx, -drawn / 2 + dy, drawn, drawn); ctx.restore();
    }
    const grout = Math.max(GROUT, 1.3 / (canvas.width / bw));   // half a joint at a block's border: the next block completes it
    ctx.fillStyle = tile.grout;
    for (let c = 0; c <= cols; c++) ctx.fillRect(c * w - grout / 2, 0, grout, bh);
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * h - grout / 2, bw, grout);
    const t = finish(canvas, bw, bh, true, anisotropy);
    textureCache.set(key, t);
    return t;
  }
  function lineTexture(w, h, anisotropy) {   // the "Drawing" style: white tiles, the joints only
    const key = `lines|${w}x${h}`;
    if (textureCache.has(key)) return textureCache.get(key);
    const { cols, rows, bw, bh, canvas } = blockOf(w, h), ctx = canvas.getContext('2d'), sx = canvas.width / bw, sy = canvas.height / bh;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#8a8d90';
    for (let c = 0; c <= cols; c++) ctx.fillRect(c * w * sx - 1, 0, 2, canvas.height);
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * h * sy - 1, canvas.width, 2);
    const t = finish(canvas, bw, bh, false, anisotropy);
    textureCache.set(key, t);
    return t;
  }
  const loadTiles = () => Promise.all(Object.values(TILES).map(tile => tile.images || Promise.all(tile.faces.map(src => {
    const img = new Image(); img.src = src; return img.decode().then(() => img);
  })).then(images => { tile.images = images; })));

  /* ---------- a round detail: a mesh in house mm ---------- */
  function superellipse(t, n) { const c = Math.cos(t), s = Math.sin(t); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / n), Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; }
  function loft(sections, bottom, top) {    // a solid lofted from superellipse sections {y, a, b, n, nb, cx, cz} (WC bowl, basin, bath)
    const SEG = 72, positions = [], index = [];
    const ring = s => Array.from({ length: SEG }, (_, j) => {
      const t = j / SEG * Math.PI * 2, n = Math.sin(t) < 0 ? (s.nb || s.n || 2.5) : (s.n || 2.5), [cx, cz] = superellipse(t, n);
      return [s.a * cx + (s.cx || 0), s.y, s.b * cz + (s.cz || 0)];
    });
    const rings = sections.map(ring);
    rings.forEach(r => r.forEach(p => positions.push(...p)));
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < SEG; j++) {
      const a = i * SEG + j, b = i * SEG + (j + 1) % SEG, c = (i + 1) * SEG + j, d = (i + 1) * SEG + (j + 1) % SEG;
      index.push(a, c, b, b, c, d);
    }
    const cap = (r, s, up) => {
      const base = positions.length / 3;
      r.forEach(p => positions.push(...p)); positions.push(s.cx || 0, s.y, s.cz || 0);
      for (let j = 0; j < SEG; j++) { const a = base + j, b = base + (j + 1) % SEG; up ? index.push(base + SEG, b, a) : index.push(base + SEG, a, b); }
    };
    if (bottom) cap(rings[0], sections[0], false);
    if (top) cap(rings[rings.length - 1], sections[sections.length - 1], true);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(index); g.computeVertexNormals();
    return g;
  }
  function shapeOf(d) {
    const s = new THREE.Shape(d.outline.map(p => new THREE.Vector2(...p)));
    for (const h of d.holes || []) s.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(...p))));
    return s;
  }
  function geometryOf(d) {
    switch (d.kind) {
      case 'cylinder': return new THREE.CylinderGeometry(d.r[0], d.r[1], d.h, d.seg, 1, !!d.open);
      case 'tube': return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(d.points.map(p => new THREE.Vector3(...p))), d.seg, d.r, 12, false);
      case 'loft': return loft(d.sections, d.bottom !== false, d.top !== false);
      case 'extrude': return new THREE.ExtrudeGeometry(shapeOf(d), Object.assign({ depth: d.depth, bevelEnabled: !!d.bevel, curveSegments: d.curve || 12 },
        d.bevel ? { bevelThickness: d.bevel[0], bevelSize: d.bevel[1], bevelSegments: d.bevel[2] } : {}));
      case 'shape': return new THREE.ShapeGeometry(shapeOf(d));
      case 'box': return new THREE.BoxGeometry(...d.size);
    }
    throw new Error('Nieznany rodzaj detalu: ' + d.kind);
  }
  function place(mesh, d) {
    if (d.kind === 'cylinder') { mesh.position.set(...d.at); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d.axis).normalize()); }
    else if (d.at) { mesh.position.set(...d.at); mesh.rotation.set(d.rot[0] * DEG, d.rot[1] * DEG, d.rot[2] * DEG); }
    mesh.castShadow = d.shadow !== false;
    mesh.receiveShadow = ['loft', 'extrude', 'box'].includes(d.kind);
  }

  /* ---------- one bathroom in a view V (core/scene.js) ----------
     opts: {floor, room (its own page: the house's room too, tiled), layers (the host's, on every solid and detail)} */
  function build(V, opts) {
    const f = opts.floor, F = D.floors[f], M = F.model, ROOM = ROOMS[f], EXTRA = opts.layers || [], GE = CORE.geometry;
    const tileKey = surface => 'tile:' + f + ':' + surface;
    const anisotropy = V.renderer.capabilities.getMaxAnisotropy();

    /* tiles: one material per surface; a new choice only swaps its texture */
    const tileMaterials = {}, tileChoice = JSON.parse(JSON.stringify(F.tiles));
    let lines = false;
    for (const s of SURFACES) {
      LIB[tileKey(s)] = { color: '#ffffff' };
      tileMaterials[s] = new THREE.MeshStandardMaterial({ roughness: .78, metalness: 0, envMapIntensity: .35, clippingPlanes: V.CLIP, clipShadows: true });
      V.useMaterial(tileKey(s), tileMaterials[s]);
    }
    function showTiles(s) {
      const m = tileMaterials[s], { w, h } = tileSize(tileChoice[s]), tile = TILES[tileChoice[s].tile];
      if (!tile.images) return;
      m.userData.photo = tileTexture(tile, w, h, anisotropy); m.userData.lines = lineTexture(w, h, anisotropy);
      m.map = lines ? m.userData.lines : m.userData.photo; m.needsUpdate = true; V.redraw();
    }
    const setTiles = (s, choice) => { Object.assign(tileChoice[s], choice); return loadTiles().then(() => showTiles(s)); };
    const tileLines = on => { lines = on; for (const s of SURFACES) showTiles(s); };
    loadTiles().then(() => SURFACES.forEach(showTiles));

    /* the cabinet's fluted glass: ribs every 11 mm, as its texture and its relief */
    const fluted = () => {
      const c = document.createElement('canvas'), n = 32; c.width = n; c.height = 2;
      const g = c.getContext('2d');
      for (let i = 0; i < n; i++) { const t = i / n, v = Math.round(120 + 75 * Math.pow(Math.sin(t * Math.PI), .6) - 40 * Math.pow(t, 3)); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i, 0, 1, 2); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 11, 1); return t;
    };
    if (!V.material('b.fluted').map) {
      const ribs = fluted(); ribs.encoding = THREE.sRGBEncoding;
      Object.assign(V.material('b.fluted'), { map: ribs, bumpMap: fluted(), bumpScale: .004, roughness: .3, transparent: true, opacity: .55, depthWrite: false });
    }
    for (const k of ['b.glass', 'b.acrylic', 'b.basinIn:' + f]) V.material(k).side = THREE.DoubleSide;

    /* ---------- the tiles: finishes of the room's faces (core/mesh.js finishPieces): the walls and the floor of every
       rectangle of its floor area, the reveals of its doors and windows and the floor under a door (the opening inside the
       room's box); in the shower zone the shower's (a later rule wins). The same on this page and in the house, which lays
       them on its own faces. */
    const Z = M.showerZone, B = ROOM.box, SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
    const cross = (q, r) => { const o = [Math.max(q[0], r[0]), Math.min(q[1], r[1]), Math.max(q[2], r[2]), Math.min(q[3], r[3])]; return o[0] < o[1] && o[2] < o[3] ? o : null; };
    const tiled = (q, z, normals, surface, shower) => {
      const inZone = cross(q, Z), rule = (box, s) => normals.map(n => ({ box: box.concat(z), n, material: tileKey(s) }));
      return rule(q, surface).concat(inZone ? rule(inZone, shower) : []);
    };
    const FINISHES = ROOM.inside.flatMap(r => tiled(r, [ROOM.level, ROOM.level + 9990], SIDES, 'wall', 'shower'))
      .concat(ROOM.openings.flatMap(o => { const q = cross(o.b, B); return q ? tiled(q, [o.b[4], o.b[5]], SIDES.concat(o.b[4] > ROOM.level + 1 ? [[0, 0, 1]] : [], [[0, 0, -1]]), 'wall', 'shower') : []; }))
      .concat(ROOM.inside.flatMap(r => tiled(r, [ROOM.level, ROOM.level + 9990], [[0, 0, 1]], 'floor', 'showerFloor')))
      .concat(ROOM.openings.filter(o => o.b[4] <= ROOM.level + 1).flatMap(o => { const q = cross(o.b, B); return q ? tiled(q, [o.b[4], o.b[5]], [[0, 0, 1]], 'floor', 'showerFloor') : []; }));   // the floor runs on under a door

    /* ---------- the room (its own page): the house's walls, slabs, floor and window, as they are, tiled by FINISHES. Each
       wall is a record that hides while the camera is behind it (index.html); the longest one of a side is its record
       (wall-x, wall+y ...), its fixtures hide with it. ---------- */
    const ROOM_CELLS = [], RECORDS = [];
    if (opts.room) {
      const ROLE_LAYER = { wall: 'walls', window: 'walls', floor: 'floor', ceiling: 'ceiling' };
      const OUT = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
      const byId = new Map(), longest = {};
      for (const o of ROOM.objects.slice().sort((a, b) => (a.role === 'window') - (b.role === 'window'))) {
        let rec = o.role === 'window' ? byId.get(o.host) : null;
        if (!rec) {
          const points = o.cells.flatMap(c => c.S.poly.flatMap(p => [[c.S.x1, p[0], p[1]], [c.S.x2, p[0], p[1]]]));
          const span = k => Math.max(...points.map(p => p[k])) - Math.min(...points.map(p => p[k]));
          rec = { layer: ROLE_LAYER[o.role], side: o.side, normal: OUT[o.side], middle: [0, 1, 2].map(k => points.reduce((s, p) => s + p[k], 0) / points.length), length: span(0) + span(1), cells: [] };
          byId.set(o.id, rec); RECORDS.push(rec);
          if (o.role === 'wall' && (!longest[o.side] || longest[o.side].length < rec.length)) longest[o.side] = rec;
        }
        for (const c of o.cells) {
          const cell = Object.assign({}, c, { raw: c.material });   // raw: a face against another solid stays bare
          delete cell.finish;
          rec.cells.push(cell); ROOM_CELLS.push(cell);
        }
      }
      RECORDS.forEach((r, i) => { r.key = 'C:' + (Object.entries(longest).find(([, x]) => x === r) ? 'wall' + r.side : 'room' + i); for (const c of r.cells) c.layers = [r.key]; });
    }

    /* ---------- the solids: cells of core; a door's or a drawer's under its pivot ---------- */
    const layersOf = x => {
      const k = [...(x.layer ? ['L:' + x.layer] : []), ...(x.cut ? ['C:' + x.cut] : [])];
      return (k.length ? k : ['fixture']).concat(EXTRA);
    };
    const partOf = new Map();
    let parts = 0;
    function cellOf(s) {
      const key = keyOf(s.material, f), def = LIB[key];
      const cell = { S: GE.prism(s.box), element: 'fixture', material: key, cap: key, layers: layersOf(s), edges: def.opacity === undefined,
        part: s.part ? partOf.get(s.part) || partOf.set(s.part, ++parts).get(s.part) : ++parts, name: s.name };
      if (s.material === 'b.decor') cell.faceMaterial = n => (Math.abs(n[2]) > .5 ? keyOf('b.decorTurned', f) : key);   // the grain along the wall on the top
      return cell;
    }
    const STATIC = ROOM_CELLS.concat(M.solids.filter(s => !s.mover).map(cellOf));
    const ROOM_SET = new Set(ROOM_CELLS), raw = CORE.mesh.piecesOf(STATIC);
    const pieces = ROOM_CELLS.length ? CORE.mesh.finishPieces(raw, FINISHES, p => ROOM_SET.has(p.cell)) : raw;
    V.buildMeshes(pieces); V.buildEdges(raw);

    const reduced = V.reducedMotion, MOVERS = [];
    for (const m of M.movers) {
      const pivot = new THREE.Group(), pin = new THREE.Group();
      pivot.position.set(m.axis[0], m.axis[1], 0); pin.position.set(-m.axis[0], -m.axis[1], 0);
      pivot.add(pin); V.root.add(pivot);
      const cells = M.solids.filter(s => s.mover === m.id).map(cellOf), p = CORE.mesh.piecesOf(cells);
      V.buildMeshes(p, pin); V.buildEdges(p, pin);
      const mover = Object.assign({}, m, { pivot, pin, cells, progress: 0, target: 0 });
      pivot.userData.mover = mover;
      MOVERS.push(mover);
    }
    /* as the kitchen: by time (dt s), eased */
    const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const pose = m => { const e = ease(m.progress); if (m.kind === 'drawer') m.pivot.position.x = m.axis[0] + m.slide * e; else m.pivot.rotation.z = m.angle * e; };
    V.onFrame(dt => {
      let moved = false;
      for (const m of MOVERS) {
        if (m.progress === m.target) continue;
        m.progress = reduced ? m.target : m.target > m.progress ? Math.min(m.target, m.progress + dt * 1.8) : Math.max(m.target, m.progress - dt * 1.8);
        pose(m); moved = true;
      }
      return moved;
    });
    const toggle = m => { m.target = m.target ? 0 : 1; V.redraw(); };

    /* ---------- the round details: meshes beside the solids ---------- */
    const DETAILS = M.details.map(d => {
      const mesh = new THREE.Mesh(geometryOf(d), V.material(keyOf(d.material, f)));
      place(mesh, d);
      (d.mover ? MOVERS.find(m => m.id === d.mover).pin : V.root).add(mesh);
      mesh.userData.detail = true;
      return { mesh, layers: layersOf(d), name: d.name, room: d.cut && (M.cuts[d.cut] || {}).room };
    });

    /* ---------- the lamps, on by night ---------- */
    const LAMPS = M.lamps.map(l => {
      const light = l.kind === 'spot' ? new THREE.SpotLight(WARM, l.intensity, l.distance, l.angle, l.penumbra, l.decay) : new THREE.PointLight(WARM, l.intensity, l.distance, l.decay);
      light.visible = false; light.position.copy(V.toWorld(...l.at)); V.scene.add(light);
      if (l.aim) { light.target.position.copy(V.toWorld(...l.aim)); V.scene.add(light.target); }
      if (l.shadow) { light.shadow.mapSize.set(1024, 1024); light.shadow.bias = -.0005; light.shadow.normalBias = .02; }
      return { light, shadow: !!l.shadow };
    });
    function night(on) {
      for (const { light, shadow } of LAMPS) { light.visible = on; light.castShadow = on && shadow; }
      V.material('b.led').emissiveIntensity = on ? 2 : 0;
      V.redraw();
    }

    /* ---------- what a host without the bathroom's panel shows: all but the installations; a click opens or closes ---------- */
    const ceilings = new Set(Object.entries(M.cuts).filter(([, c]) => c.room).map(([k]) => 'C:' + k));
    const shown = layers => !layers.includes('L:installations') && !layers.some(k => ceilings.has(k));
    const showDetails = (shownBy, ghost) => { for (const d of DETAILS) { d.mesh.visible = shownBy(d.layers); if (ghost) ghost(d); } };
    const visible = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    function moverAlong(ray) {
      const meshes = []; V.root.traverse(o => { if (o.isMesh && visible(o) && o.material.visible !== false && o.material.colorWrite !== false) meshes.push(o); });
      const hit = ray.intersectObjects(meshes, false).find(h => V.CUT.distanceToPoint(h.point) >= 0);   // over a cut nothing is drawn
      for (let o = hit && hit.object; o; o = o.parent) if (o.userData.mover && MOVERS.includes(o.userData.mover)) return o.userData.mover;
      return null;
    }
    function click(ray) { const m = moverAlong(ray); if (!m) return false; toggle(m); return true; }

    return { solids: STATIC.filter(c => !ROOM_CELLS.includes(c)), finishes: FINISHES, shown, showDetails, click, night,
      ROOM, ROOM_CELLS, RECORDS, STATIC, MOVERS, DETAILS, LAMPS, toggle, moverAlong, setTiles, tileLines, tileMaterials, tileSize,
      material: name => V.material(keyOf(name, f)), METALS, cameras: M.cameras, cuts: M.cuts };
  }

  const rooms = () => FLOORS.map(f => ({ floor: ROOMS[f].floor, opts: { floor: f } }));   // a bathroom on each floor
  return { ROOMS, FLOORS, DECORS, TILES, tileSize, rooms, build };
}

/* the textures the bathrooms name: the tiles and the board decors to choose from */
const textures = () => root.BATH_DATA.defaults.tiles.map(k => root.LIBRARY_PRODUCTS.tiles[k].texture)
  .concat(Object.keys(root.BATH_DATA.decors).map(k => root.LIBRARY_PRODUCTS.boards[k].texture));

/* the implementation: its own page uses all of it, the house only what the interface names */
const BathroomRoom = { needs: ['../../house/shell.js', 'design.dat.js'], textures, make };
root.BathroomRoom = BathroomRoom;
root.ROOM_INTERFACE.register('bathroom', BathroomRoom);
})(window);
