/* rooms/wardrobe/room.js: the walk-in wardrobes' furniture, an implementation of the interface ../../room.js: the drawing of
   wardrobe.dat.js (each wardrobe's solids, board by board, and its drawers, in mm in house axes), drawn by core the same in
   index.html (with its room, from the house) and in the house (without: the house draws its own). Nothing is computed here to
   fit: what is drawn is what wardrobe.dat.js says; its looks are the library's materials. */
(function (root) {
'use strict';

/* env: {materials, textures, library, shell} (../../room.js); its own file (needs) is wired here, nowhere else */
function make(env) {
  const CORE = root.CORE, THREE = root.THREE, D = root.WARDROBE_DATA, LIB = env.materials;
  const NUMBERS = Object.keys(D.wardrobes).map(Number);
  const found = env.shell.rooms('wardrobe');
  const ROOMS = Object.fromEntries(NUMBERS.map(n => [n, found.find(r => r.numbers.includes(n))]));
  for (const n of NUMBERS) if (!ROOMS[n]) throw new Error('apps.dat.js nie daje garderobom pomieszczenia domu nr ' + n + '.');
  for (const k of Object.values(D.looks)) if (!LIB[k]) throw new Error('brak materiału ' + k + ' w bibliotece (library/materials.dat.js)');

  /* ---------- one wardrobe in a view V (core/scene.js) ----------
     opts: {number, room (its own page: the house's room too), layers (the host's, on every solid)} */
  function build(V, opts) {
    const n = opts.number, M = D.wardrobes[n].model, ROOM = ROOMS[n], EXTRA = opts.layers || [], GE = CORE.geometry;

    /* ---------- the room (its own page): the house's walls, slabs, floor and door, as they are. Each wall is a record that
       hides while the camera is behind it (index.html); the longest one of a side is its record (wall-x, wall+y ...), its
       door hides with it. ---------- */
    const ROOM_CELLS = [], RECORDS = [], LEAVES = [];   // LEAVES: the doors of the room (the house's), each turning about its hinge
    if (opts.room) {
      const ROLE_LAYER = { wall: 'walls', window: 'walls', door: 'walls', floor: 'floor', ceiling: 'ceiling' };
      const hosted = o => o.role === 'window' || o.role === 'door';
      const OUT = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
      const byId = new Map(), longest = {};
      for (const o of ROOM.objects.slice().sort((a, b) => hosted(a) - hosted(b))) {
        let rec = hosted(o) ? byId.get(o.host) : null;
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
        if (o.leaf) LEAVES.push({ leaf: o.leaf, rec });
      }
      RECORDS.forEach((r, i) => { r.key = 'C:' + (Object.entries(longest).find(([, x]) => x === r) ? 'wall' + r.side : 'room' + i); for (const c of r.cells) c.layers = [r.key]; });
    }

    /* ---------- the solids: cells of core, one part each; a drawer's under its pivot ---------- */
    let parts = 0;
    const cellOf = s => ({ S: GE.prism(s.box), element: 'fixture', material: D.looks[s.material], cap: D.looks[s.material], layers: ['L:' + s.layer].concat(EXTRA),
      edges: true, part: ++parts, name: s.name, label: s.label, board: s.board, cut: s.cut, mover: s.mover });
    const STATIC = ROOM_CELLS.concat(M.solids.filter(s => !s.mover).map(cellOf));
    const pieces = CORE.mesh.piecesOf(STATIC);
    V.buildMeshes(pieces); V.buildEdges(pieces);

    const reduced = V.reducedMotion, MOVERS = [];
    for (const m of M.movers) {
      const pivot = new THREE.Group(); V.root.add(pivot);
      const cells = M.solids.filter(s => s.mover === m.id).map(cellOf), p = CORE.mesh.piecesOf(cells);
      V.buildMeshes(p, pivot); V.buildEdges(p, pivot);
      const mover = { id: m.id, kind: 'drawer', slide: m.slide, pivot, cells, progress: 0, target: 0 };
      pivot.userData.mover = mover;
      MOVERS.push(mover);
    }
    /* the room's doors: the house's leaves, hidden with their wall */
    for (const [i, { leaf, rec }] of LEAVES.entries()) {
      const pivot = new THREE.Group(), pin = new THREE.Group();
      pivot.position.set(leaf.axis[0], leaf.axis[1], 0); pin.position.set(-leaf.axis[0], -leaf.axis[1], 0);
      pivot.add(pin); V.root.add(pivot);
      const cells = leaf.cells.map(c => Object.assign({}, c, { layers: [rec.key] })), p = CORE.mesh.piecesOf(cells);
      V.buildMeshes(p, pin); V.buildEdges(p, pin);
      const mover = { id: 'room-door' + i, kind: 'door', angle: leaf.angle, pivot, cells, progress: 0, target: 0 };
      pivot.userData.mover = mover;
      MOVERS.push(mover);
    }
    /* by time (dt s), eased */
    const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const pose = m => { const e = ease(m.progress); if (m.kind === 'drawer') m.pivot.position.set(m.slide[0] * e, m.slide[1] * e, 0); else m.pivot.rotation.z = m.angle * e; };
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

    /* ---------- what a host without the wardrobes' panel shows: everything; a click opens or closes a drawer ---------- */
    const shown = () => true;
    const showDetails = () => {};
    const visible = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    function moverAlong(ray) {
      const meshes = []; V.root.traverse(o => { if (o.isMesh && visible(o) && o.material.visible !== false && o.material.colorWrite !== false) meshes.push(o); });
      const hit = ray.intersectObjects(meshes, false).find(h => V.CUT.distanceToPoint(h.point) >= 0);   // over a cut nothing is drawn
      for (let o = hit && hit.object; o; o = o.parent) if (o.userData.mover && MOVERS.includes(o.userData.mover)) return o.userData.mover;
      return null;
    }
    function click(ray) { const m = moverAlong(ray); if (!m) return false; toggle(m); return true; }
    const night = () => {};   // no lamps of its own

    const SOLIDS = STATIC.filter(c => !ROOM_CELLS.includes(c));
    /* what a walker bumps into: the solids that stand still (drawers open, so they do not) */
    const obstacles = shownBy => V.boxes(SOLIDS.filter(c => shownBy(c.layers)), []);
    return { solids: SOLIDS, finishes: [], shown, showDetails, click, night, obstacles,
      ROOM, RECORDS, STATIC, MOVERS, toggle, moverAlong, cameras: M.cameras };
  }

  const rooms = () => NUMBERS.map(n => ({ floor: ROOMS[n].floor, opts: { number: n } }));   // every room it furnishes, one build each
  return { ROOMS, NUMBERS, rooms, build };
}

/* the textures the wardrobes name: none (plain white boards) */
const textures = () => [];

/* the implementation: its own page uses all of it, the house only what the interface names */
const WardrobeRoom = { needs: ['wardrobe.dat.js'], textures, make };
root.WardrobeRoom = WardrobeRoom;
root.ROOM_INTERFACE.register('wardrobe', WardrobeRoom);
})(window);
