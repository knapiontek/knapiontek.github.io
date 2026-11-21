// @ts-check
/* room/furniture.js: the cabinets described (core/parts.js): carcasses, fronts, worktops, panels, plinths, hardware and
   the products in them, from the model of room/cabinets.js; and the looks of the boards. Draws nothing itself. Gets the
   cabinets' engine and the library's shapes (library/shapes.js). */
/** @param {ReturnType<typeof roomCabinetsModule>} cabinets @param {ReturnType<typeof libraryShapesModule>} shapes */
function roomFurnitureModule(cabinets, shapes) {
'use strict';
const { boxIn, hasTag, placeLabel, typeLabel } = cabinets;

/* ================= THE CABINETS DESCRIBED: the model as solids, moving fronts and details =================
   D: the room's description (core/parts.js): box(list, r, gb, key, layer, info) in the frame of group r, at, detail,
   cylinder, mover, linkTo, envelope, openFront, openTop, part, frame(r) {X, Y}, has(key), STATIC; a product is drawn by
   the library (library/shapes.js, shapes) by its field draw. HW: the hardware as drawn (the products' sizes and the scene's layout);
   install: how the sink, its trap and the hood are fitted. Boards are the materials 'board:' + product key ('~': the decor
   turned a quarter; ':core': the bare edge). */
/** @param {any} D the room's description (core/parts.js: PartsContext) @param {CabinetsModel} model @param {Object<string, any>} appliances @param {any} HW @param {any} install */
function draw(D, model, appliances, HW, install) {
  const { box, at, cylinder, mover, linkTo, STATIC } = D;
  const settings = model.settings, { carcassBack, frontThickness } = model, G = r => model.groups[String(r)].geometry;
  const K = code => 'board:' + code, GROUP_IDS = Object.keys(model.groups);
  /* a part's box from the tree (from its group's wall), in the frame the parts are computed in (y from the carcass backs) */
  const placedNode = (n, r) => { const b = boxIn(n), wall = model.groups[r].wall; return [b[0], b[1], b[2] + wall, b[3] + wall, b[4], b[5]]; };
  const placed = part => placedNode(part.node, part.group);
  /* a front's panel: the board node under its front (a dishwasher's front stands in its bay) */
  const panelOf = f => (function find(n) { return n.type === 'board' && n.id === 'panel' ? n : n.children.reduce((q, c) => q || find(c), null); })(f.node);
  const GROUP = r => model.groups[r], groupLength = r => GROUP(r).widths.reduce((s, w) => s + w, 0), itemsOf = r => GROUP(r).items;
  const shakerRail = (model.materials[model.materialFor.cabinet] || {}).frameWidth;   // none: a front is one plain board
  const product = (A, place, d = D) => shapes[A.draw](d, A, place);
  /* a product draws in its own coordinates: from the origin of its node (its left, back, bottom corner); the room's
     parts' context moved there */
  const P = role => (model.products || []).filter(x => x.role === role);
  const originOf = x => { const b = placed(x); return [b[0], b[2], b[4]]; };
  function moved(o) {
    const at3 = (a, i) => { const c = a.slice(); for (let k = 0; k < 3; k++) c[i + k] += o[k]; return c; };
    const gb = b => [b[0] + o[0], b[1] + o[0], b[2] + o[1], b[3] + o[1], b[4] + o[2], b[5] + o[2]];
    return Object.assign({}, D, {
      box: (list, r, b, ...rest) => D.box(list, r, gb(b), ...rest),
      openFront: (list, r, b, ...rest) => D.openFront(list, r, gb(b), ...rest),
      openTop: (list, r, b, ...rest) => D.openTop(list, r, gb(b), ...rest),
      envelope: (r, b, ...rest) => D.envelope(r, gb(b), ...rest),
      cylinder: (...a) => D.cylinder(...(a[0].pivot ? a : at3(a, 4))), detail: (...a) => D.detail(...(a[0].pivot ? a : at3(a, 3))),   // a pivot is placed already
      display: (...a) => D.display(...at3(a, 4)), pivot: (...a) => D.pivot(...at3(a, 1)),
      mover: (...a) => D.mover(...at3(a, 2)), point: (...a) => D.point(...at3(a, 1)),
      profile: (list, r, x0, x1, prof, ...rest) => D.profile(list, r, x0 + o[0], x1 + o[0], prof.map(([y, h]) => [y + o[1], h + o[2]]), ...rest)
    });
  }
  /* a piece of hardware drawn by the library from the zero of its node */
  const pieces = test => (model.hardware || []).filter(test);
  const fitted = (x, kind, place, ...settings) => { const o = originOf(x); shapes[kind](moved(o), ...settings, Object.assign({ r: x.group, size: x.node.size }, place(o))); };
  const fitOf = (fit, o) => minus(fit, o, [['bodyX0', 0], ['bodyX1', 0], ['bodyH0', 2], ['bodyH1', 2]]);
  const minus = (fit, o, keys) => Object.assign({}, fit, Object.fromEntries(keys.map(([k, i]) => [k, fit[k] - o[i]])));

  /* the face of a box by its normal: which side of the group (left/right = −x/+x, back/front = −y/+y, bottom/top) */
  const SIDE_AXIS = { left: 0, right: 0, back: 1, front: 1, bottom: 2, top: 2 };
  function sideOf(r, normal) {
    const { X, Y } = D.frame(r), dx = normal[0] * X[0] + normal[1] * X[1], dy = normal[0] * Y[0] + normal[1] * Y[1];
    return Math.abs(normal[2]) > 0.5 ? (normal[2] > 0 ? 'top' : 'bottom') : Math.abs(dx) > 0.5 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'front' : 'back');
  }
  /* the grain of a decor: along x, up (h), or (no rule) along the longer side of the face. The texture runs along the
     face's first uv axis (core/faces.js: an x face has (y, h), a y face (x, h), an h face (x, y)); '~' turns it. */
  const FACE_UV = normal => Math.abs(normal[0]) > 0.5 ? [1, 2] : Math.abs(normal[1]) > 0.5 ? [0, 2] : [0, 1];
  function turned(c, normal, grain) {
    const [a, b] = FACE_UV(normal), extent = k => c.hb[2 * k + 1] - c.hb[2 * k];
    let g = grain === 'x' ? (Math.abs(D.frame(c.r).X[0]) > 0.5 ? 0 : 1) : grain === 'h' ? 2 : null;
    if (g !== a && g !== b) g = extent(a) >= extent(b) ? a : b;
    return g === b;
  }
  /* a board: its two big faces (or the faces named) in the decor, banded edges too, every other edge bare */
  function look(c, code, /** @type {{ banded?: string[], faces?: string[]|null, grain?: string|null }} */ { banded = [], faces = null, grain = null } = {}) {
    if (!c) return null;
    const plain = K(code), turnedKey = D.has(plain + '~') ? plain + '~' : null, bare = D.has(plain + ':core') ? plain + ':core' : null;
    const size = [c.gb[1] - c.gb[0], c.gb[3] - c.gb[2], c.gb[5] - c.gb[4]], thin = size.indexOf(Math.min(...size)), finished = new Set(banded);
    c.faceMaterial = normal => {
      const side = sideOf(c.r, normal), decor = faces ? faces.includes(side) : SIDE_AXIS[side] === thin;
      if (!decor && !finished.has(side) && bare) return bare;
      return turnedKey && turned(c, normal, grain) ? turnedKey : plain;
    };
    return c;
  }
  const ALL_SIDES = Object.keys(SIDE_AXIS);
  const BOARD_CHECK = { drawerBottom: 'drawer', drawerBack: 'drawer', drawerSide: 'drawer', drawerEnd: 'drawer', doorDrawerFront: 'drawer', doorDrawerBottom: 'drawer', doorDrawerSide: 'drawer',
    doorDrawerBack: 'drawer', backStrip: 'backStrip', adjustableShelf: 'shelf' };
  /* a board of the model, with its banded edges; a carcass board is listed in its carcass */
  function board(list, b, carcass, layer, m) {
    const c = box(list, String(b.group), placed(b), K(b.material), layer || b.layer || 'carcasses', { board: b, carcass, mover: m, check: BOARD_CHECK[b.id] || 'carcass',
      name: (carcass ? carcass.name + ' ' : '') + b.name + ' ' + b.a + ' × ' + b.b, batch: (carcass ? 'c' + carcass.id : 'b') + ':' + b.id });
    if (c && carcass) carcass.parts.push({ name: b.name, a: b.a, b: b.b });
    return look(c, b.material, { banded: (b.edges || []).map(e => e.side) });
  }
  const worktopOf = r => model.worktops[r] || { y0: 0, y1: 0, depth: 0, h1: 0 };

  /* ---------- worktops, strips, panels, plinths, plasterboard ---------- */
  const CHECKED_TYPES = ['worktop', 'endPanel', 'strip', 'plinth', 'frontPanel', 'wallPanel'];
  /* a worktop or an end panel, one part of boxes around its cut-outs: finished edges (banded or factory) in the decor, the
     walls of the cut-outs bare */
  function worktopPiece(r, piece, info) {
    const [x0, x1, py0, py1, h0, h1] = placed(piece), endPanel = piece.item.type === 'endPanel', code = piece.material, I = Object.assign({ part: D.part() }, info);
    const finished = new Set([...piece.edges.map(e => e.side), ...piece.factoryEdges]);
    const outer = x0 + x1 < groupLength(r) ? 'left' : 'right';
    const faces = model.materials[code].twoSided ? (endPanel ? ['left', 'right'] : ['top', 'bottom']) : [endPanel ? outer : 'top'];
    const holes = (piece.cutouts || []).filter(c => !c.round).map(c => [c.x0, c.x1, c.y0, c.y1]);   // a round hole is under what stands on it
    const cuts = [...new Set([x0, x1, ...holes.flatMap(([a, b]) => [a, b])])].sort((p, q) => p - q);
    for (let i = 0; i + 1 < cuts.length; i++) {
      const a = cuts[i], b = cuts[i + 1], spans = [];
      let y = py0;
      for (const [, , c0, c1] of holes.filter(([c0, c1]) => c0 <= a && c1 >= b).sort((p, q) => p[2] - q[2])) { spans.push([y, c0]); y = c1; }
      spans.push([y, py1]);
      for (const [y0, y1] of spans) {
        const outline = { left: a === x0, right: b === x1, back: y0 === py0, front: y1 === py1, top: true, bottom: true };
        look(box(STATIC, r, [a, b, y0, y1, h0, h1], K(code), endPanel ? 'endPanels' : 'worktops', I), code,
          { banded: [...finished].filter(s => outline[s]), faces, grain: endPanel ? 'h' : 'x' });
      }
    }
  }
  function drawGroup(r) {
    for (const item of itemsOf(r)) {
      const { x0, x1, h0, h1, type } = item;
      const info = CHECKED_TYPES.includes(type) ? { check: type, name: placeLabel(r, item.column, item.span) + ' ' + typeLabel(type) + ' ' + (x1 - x0) + ' × ' + (h1 - h0) + (item.note ? ' (' + item.note + ')' : '') } : {};
      if (type === 'worktop' || type === 'endPanel') {
        const piece = model.worktopPieces.find(p => p.item === item);
        if (piece) worktopPiece(r, piece, info);
      } else if (type === 'strip') {                 // on edge in the plane of the fronts; lacquered faces and the edges the model names
        const strip = model.strips.find(s => s.item === item), code = model.materialFor.strip;
        look(box(STATIC, r, placed(strip), K(code), 'strips', info), code, { banded: (strip && strip.lacqueredSides) || [] });
      } else if (type === 'frontPanel') {
        const panel = model.frontPanels.find(p => p.item === item), code = model.materialFor.frontPanel;
        look(box(STATIC, r, placed(panel), K(code), 'frontPanel', info), code, { banded: panel ? [...(panel.edges || []).map(e => e.side), ...(panel.lacqueredSides || [])] : [] });
      } else if (type === 'plinth') {
        const code = model.materialFor.plinth;
        look(box(STATIC, r, placed(model.plinths.find(p => p.item === item)), K(code), 'plinth', info), code);
      } else if (type === 'wallPanel') {
        const code = model.materialFor.wallPanel;
        look(box(STATIC, r, placed(model.wallPanels.find(p => p.item === item)), K(code), 'wallPanel', info), code, { faces: ALL_SIDES, grain: 'x' });
      } else if (type === 'plasterboard') {          // a space draws nothing
        box(STATIC, r, placed(model.plaster.find(p => p.item === item)), 'wall', 'plasterboard', { name: 'Plasterboard casing ' + (x1 - x0) + ' × ' + (h1 - h0) });
      } else if (type === 'oven' || type === 'microwave') {
        const x = P(type).find(p => p.item === item), o = originOf(x);
        product(appliances[type], { r, item: Object.assign({}, item, { x0: item.x0 - o[0], x1: item.x1 - o[0], fit: minus(item.fit, o, [['bodyH0', 2], ['fasciaH0', 2], ['fasciaH1', 2]]) }), front: G(r).carcassFront - o[1] }, moved(o));
      }
    }
  }

  /* ---------- the sink and the hob in their cut-outs, the hood over the hob ---------- */
  const sinkCarcass = model.carcasses.find(c => c.sink), sinkGroup = sinkCarcass ? String(sinkCarcass.group) : null;
  const sinkCut = sinkGroup && (worktopOf(sinkGroup).cutouts || []).find(c => c.kind === 'sink');
  const sinkItem = sinkCut && itemsOf(sinkGroup).find(i => hasTag(i, 'sink'));
  const sinkX = sinkCut ? (sinkCut.x0 + sinkCut.x1) / 2 : 0;
  function drawSink() {
    const r = sinkGroup, S = appliances.sink;
    const x = P('sink')[0], o = originOf(x);
    product(S, { r, x: x.x - o[0], y: x.y - o[1], top: x.top - o[2] }, moved(o));
    const tap = P('tap')[0], t = originOf(tap), trap = P('trap')[0], q = originOf(trap);
    shapes.tap(moved(t), { r, x: tap.x - t[0], y: tap.y - t[1], top: tap.top - t[2] });
    shapes.trap(moved(q), { r, x: trap.x - q[0], from: trap.from - q[2], drain: trap.drain - q[1], top: trap.top - q[2], outlet: trap.outlet - q[2], back: trap.back - q[1], wall: trap.wall - q[1] });
  }
  const hobGroup = GROUP_IDS.find(r => itemsOf(r).some(i => hasTag(i, 'hob')));
  const hobItem = hobGroup && itemsOf(hobGroup).find(i => hasTag(i, 'hob'));
  const hobCut = hobItem && (worktopOf(hobGroup).cutouts || []).find(c => c.kind === 'hob');
  const hobX = hobCut ? (hobCut.x0 + hobCut.x1) / 2 : hobItem ? (hobItem.x0 + hobItem.x1) / 2 : 0;

  /* ---------- carcasses: boards, holes, shelf pins, legs, the fridge, plinth grilles ---------- */
  const carcasses = /** @type {DrawnCarcass[]} */ (model.carcasses);
  for (const c of carcasses) { c.parts = []; c.movers = []; }
  const MARKER = { cup: 'markerHinge', plate: 'markerHinge', bumper: 'markerHinge', shelfPin: 'markerShelfPin', runner: 'markerRunner' };
  /* a disc on the drilled face, 0.6 mm proud; small holes as 12 mm markers. A hole of a part (its box own) where its node is
     (base) */
  function holes(a, part, own, base) {
    const at = hole => hole.at.map((v, k) => v - own[2 * k] + base[2 * k]);
    for (const hole of part.holes || []) {
      const out = -hole.dir * 0.6, c = at(hole), p = hole.axis === 'x' ? [c[0] + out, c[1], c[2]] : [c[0], c[1] + out, c[2]];
      const radius = hole.kind === 'bumper' ? hole.diameter / 2 : Math.max(hole.diameter / 2, 6);
      cylinder(a, radius, 1, MARKER[hole.kind], ...p, hole.axis, 32, false);
    }
  }
  function drawCarcass(carcass) {
    const r = String(carcass.group), drilled = at(r, 'holes');
    for (const b of model.boards) {
      if (b.carcassId !== carcass.id || b.frontId || b.id === 'pullOutShelf') continue;   // drawer boards and the pull-out shelf move
      board(STATIC, b, carcass);
      holes(drilled, b, b.box, placed(b));
    }
    const mine = kind => pieces(x => x.carcassId === carcass.id && x.kind === kind);
    for (const x of mine('shelfPin')) fitted(x, 'shelfPin', () => ({ name: carcass.name + ' shelf pin' }));
    for (const x of mine('leg')) fitted(x, 'leg', () => ({ name: carcass.name + ' leg' }), HW.leg);
    const fridge = P('fridgeFreezer').find(x => x.carcassId === carcass.id);
    if (fridge) { const o = originOf(fridge); product(appliances.fridgeFreezer, { r, fit: fitOf(fridge.fit, o), front: G(r).carcassFront - o[1], back: carcassBack - o[1] }, moved(o)); }
    for (const x of mine('grille')) fitted(x, 'grille', () => ({}));
  }

  /* ---------- fronts and what moves with them ---------- */
  function shakerFront(m, /** @type {number[]} */ [x0, x1, y0, y1, h0, h1], code, info) {   // a frame of shakerRail wide rails round a recessed panel, one part
    const w = shakerRail, I = Object.assign({ part: D.part() }, info), f = gb => box(m.cells, m.r, gb, K(code), 'fronts', I);
    /* a plain board front (no frame): its decor up the front, banded all round */
    if (!w) return look(f([x0, x1, y0, y1, h0, h1]), code, { banded: ['left', 'right', 'top', 'bottom'], grain: 'h' });
    if (x1 - x0 <= 2 * w + 20 || h1 - h0 <= 2 * w + 20) return f([x0, x1, y0, y1, h0, h1]);
    f([x0, x1, y0, y1, h1 - w, h1]); f([x0, x1, y0, y1, h0, h0 + w]); f([x0, x0 + w, y0, y1, h0 + w, h1 - w]); f([x1 - w, x1, y0, y1, h0 + w, h1 - w]);
    f([x0 + w, x1 - w, y0, (y0 + y1) / 2, h0 + w, h1 - w]);
  }
  function drawFront(r, item) {
    const { carcassFront, frontFace } = G(r), front = item.front, carcass = /** @type {DrawnCarcass} */ (carcasses.find(c => c.id === item.carcassId)), opening = front.opening, hand = front.hand;
    const { x0: fx0, x1: fx1, h0: fh0, h1: fh1, width: fw, height: fh } = front, size = Math.round(fw) + ' × ' + Math.round(fh);
    let px = 0, ph = 0, py = 0;                  // the pivot: the hinge edge of a door, the bottom edge of a dishwasher door
    if (opening === 'door' || opening === 'fridge') { px = hand === 'left' ? fx0 : fx1; py = frontFace; }
    else if (opening === 'dishwasher') { ph = item.fit.doorH0; py = frontFace; }
    const m = mover(r, opening, px, py, ph);
    Object.assign(m, { sign: hand === 'left' ? 1 : -1, item });
    if (opening === 'door' && carcass && (HW.open.doorStop || {})[carcass.name]) m.travel = HW.open.doorStop[carcass.name];
    if (carcass) carcass.movers.push(m);
    const I = { mover: m };
    const panel = front.open ? null : placedNode(panelOf(front), r);
    if (panel) shakerFront(m, panel, front.material, I);
    for (const x of pieces(x => x.frontId === front.id && x.kind === 'handle')) fitted(x, 'handle', () => ({ m, turn: x.turn, info: I }), HW.handle);
    if (opening === 'door' && carcass) {
      const cup = settings.drilling.cup, dir = hand === 'left' ? 1 : -1, side = front.hingeX, cupX = hand === 'left' ? fx0 + cup.fromEdge : fx1 - cup.fromEdge;
      holes(at(r, 'fronts', m, ['holes']), front, [fx0, fx1, frontFace - frontThickness, frontFace, fh0, fh1], panel);
      for (const x of pieces(x => x.frontId === front.id && x.kind === 'hinge')) fitted(x, 'hinge', o => ({ m, dir, side: side - o[0], cupX: cupX - o[0], h: x.h - o[2],
        carcassFront: carcassFront - o[1], doorBack: frontFace - frontThickness - o[1], cupRadius: cup.diameter / 2 - 0.5 }), HW.hinge);
      for (const x of pieces(x => x.door === front.id && x.kind === 'bumper')) fitted(x, 'bumper', () => ({}));   // the head fills the front gap, 0.2 short of the door
      m.label = 'Door ' + size + ' · hinges: ' + front.hinges.length + ' · bumpers: ' + (front.bumpers || []).length + (front.doorDrawers ? ' · drawers behind it: ' + front.doorDrawers.count : '');
      if (front.doorDrawers) doorDrawers(r, item, m, carcass);
    } else if (opening === 'drawer' && carcass) {
      drawer(r, item, m, carcass, size);
    } else if (opening === 'dishwasher') {
      const x = P('dishwasher').find(p => p.item === item), o = originOf(x);
      product(appliances.dishwasher, { r, m, item: Object.assign({}, item, { x0: item.x0 - o[0], x1: item.x1 - o[0], fit: minus(item.fit, o, [['bodyX0', 0], ['bodyX1', 0], ['bodyH1', 2], ['doorH0', 2], ['doorH1', 2]]) }),
        front: carcassFront - o[1], back: carcassBack - o[1] }, moved(o));
      m.label = 'Dishwasher · front ' + size + ' on the appliance door';
    } else if (opening === 'fridge' && item.fit) {
      const freezer = hasTag(item, 'freezer');
      const fridge = P('fridgeFreezer').find(x => x.carcassId === carcass.id), o = originOf(fridge);
      shapes.fridgeDoor(moved(o), appliances.fridgeFreezer, { r, m, freezer, fit: fitOf(item.fit, o), front: carcassFront - o[1], shelves: [carcass.x0 + 55 - o[0], carcass.x1 - 55 - o[0]] });
      m.label = (freezer ? 'Freezer' : 'Fridge') + ' · front ' + size + ' on the appliance door';
    } else if (opening === 'fixed') m.label = 'Dummy front ' + size + ' · fixed';
    if (!m.label) m.label = 'Front ' + size;
  }
  /* a drawer: its boards, metal sides and runners (the carcass part stays, the drawer part moves); bins; an inner drawer */
  function drawer(r, item, m, carcass, size) {
    const front = item.front;
    if (front.drawer.board) {                     // a box of board on ball runners, open or behind its front
      const b = front.drawer;
      for (const bd of model.boards) if (bd.frontId === front.id) board(m.cells, bd, carcass, 'drawers', m);
      for (const x of pieces(x => x.frontId === front.id && x.runner === 'ball')) fitted(x, 'runner', () => ({ m, kind: 'ball', side: x.side }));
      m.travel = b.runnerLength;
      m.label = (front.open ? 'Open drawer ' : 'Drawer ') + b.boxWidth + ' × ' + b.runnerLength + ' × ' + b.boxHeight + ', ball runners ' + b.runnerLength + (front.open ? '' : ' · front ' + size);
      return;
    }
    const { size: kind, sideHeight, innerX0, innerX1, bins, inner } = front.drawer, Dw = HW.drawer, I = { mover: m, carcass };
    const metal = (kind, inner, mv, info, draw = 'drawerPart') => {   // the drawer system's metal, from its nodes
      for (const x of pieces(x => x.frontId === front.id && x.kind === kind && x.inner === inner)) fitted(x, draw, () => ({ m: mv, info: info || { mover: mv, carcass }, inset: x.inset }), ...(draw === 'bins' ? [HW.bins] : []));
    };
    const runners = (mv, inner) => {
      for (const x of pieces(x => x.frontId === front.id && x.runner === 'drawer' && x.inner === inner)) fitted(x, 'runner', () => ({ m: mv, kind: 'drawer', side: x.side, width: Dw.runnerWidth }));
    };
    for (const b of model.boards) if (b.frontId === front.id && !b.inner) board(m.cells, b, carcass, 'drawers', m);
    metal('drawerSide', false, m);
    metal('galleryRail', false, m, I);
    runners(m, false);
    metal('bins', false, m, I, 'bins');
    const name = 'drawer ' + kind + ' (' + sideHeight + ')';
    m.label = (bins ? 'Sink ' + name + ' with waste bins' : kind === 'D' ? 'Drawer ' + kind + ' (' + sideHeight + ')' : 'Top ' + name + (inner ? ' + an inner drawer above it' : '')) + ' · front ' + size;
    if (inner) {                                  // a shallow cutlery drawer above the box, behind the same front, on its own runners
      const im = mover(r, 'drawer', 0, 0, 0), M = settings.drawers.M.sideHeight, J = { mover: im, carcass };
      Object.assign(im, { item }); carcass.movers.push(im); linkTo(m, im);
      for (const b of model.boards) if (b.frontId === front.id && b.inner) board(im.cells, b, carcass, 'drawers', im);
      metal('drawerSide', true, im);
      metal('drawerFront', true, im, J);
      metal('cutleryInsert', true, im, J, 'cutleryInsert');
      runners(im, true);
      im.label = 'Inner drawer M (' + M + ') for cutlery · inner front ' + (innerX1 - innerX0 - settings.drawers.inner.frontDeduction);
    }
  }
  /* drawers behind a door: each box slides out on ball runners once the door is open */
  function doorDrawers(r, item, door, carcass) {
    const front = item.front, DD = front.doorDrawers;
    DD.boxes.forEach((b, j) => {
      const m = mover(r, 'drawer', 0, 0, 0);
      Object.assign(m, { item, travel: DD.runnerLength, label: 'Drawer behind the door ' + (j + 1) + '/' + DD.count + ' · ' + DD.boxWidth + ' × ' + DD.runnerLength + ' × ' + DD.boxHeight + ', ball runners ' + DD.runnerLength });
      carcass.movers.push(m); linkTo(door, m);
      for (const bd of model.boards) if (bd.frontId === front.id && bd.doorDrawer === j) board(m.cells, bd, carcass, 'drawers', m);
      for (const x of pieces(x => x.frontId === front.id && x.runner === 'ball' && x.doorDrawer === j)) fitted(x, 'runner', () => ({ m, kind: 'ball', side: x.side }));
    });
  }
  /* the pull-out shelf with the coffee machine: slides out once its door is open */
  function pullOutShelf(shelf) {
    const carcass = /** @type {DrawnCarcass} */ (carcasses.find(c => c.id === shelf.carcassId)), r = String(carcass.group), door = carcass.movers.find(m => m.kind === 'door' && m.item === shelf.item);
    const m = mover(r, 'drawer', 0, 0, 0), [x0, x1, , y1, , h1] = shelf.box;
    Object.assign(m, { item: shelf.item }); carcass.movers.push(m);
    if (door) linkTo(door, m);
    board(m.cells, shelf, carcass, 'drawers', m);
    for (const x of pieces(x => x.runner === 'pullOut' && x.shelf === shelf)) fitted(x, 'runner', () => ({ m, kind: 'pullOut', side: x.side }));
    const coffee = P('coffee').find(x => x.shelf === shelf), o = originOf(coffee);
    product(appliances.coffee, { r, m, x: (x0 + x1) / 2 - o[0], h: h1 - o[2], y: y1 - 20 - o[1] }, moved(o));
    m.label = 'Pull-out shelf ' + shelf.a + ' × ' + shelf.b + ' with ' + appliances.coffee.name;
  }

  /* ---------- all of it ---------- */
  GROUP_IDS.forEach(drawGroup);
  for (const b of model.boards) if (b.id === 'backStrip') board(STATIC, b, null, 'carcasses');
  for (const p of model.frontPanels) if (!p.item) look(box(STATIC, String(p.group), placed(p), K(p.material), 'frontPanel', { check: 'frontPanel', name: 'G' + p.group + ' ' + p.name + ' ' + p.a + ' × ' + p.b }), p.material, { banded: (p.edges || []).map(e => e.side) });
  if (sinkItem) drawSink();
  for (const role of ['basin', 'basinTap']) for (const x of P(role)) { const o = originOf(x); product(x.A, { r: x.group, x: x.x - o[0], y: x.y - o[1], top: x.top - o[2] }, moved(o)); }
  for (const x of P('hob')) {
    const o = originOf(x), cut = { x0: x.cut.x0 - o[0], x1: x.cut.x1 - o[0], y0: x.cut.y0 - o[1], y1: x.cut.y1 - o[1] };
    product(appliances.hob, { r: x.group, x: x.x - o[0], cut, top: x.top - o[2] }, moved(o));
  }
  for (const x of P('hood')) { const o = originOf(x); product(appliances.hood, { r: x.group, x: x.x - o[0], bottom: x.bottom - o[2], ceiling: x.ceiling - o[2], worktop: x.worktop - o[2] }, moved(o)); }
  carcasses.forEach(drawCarcass);
  for (const r of GROUP_IDS) for (const item of itemsOf(r)) if (item.front) drawFront(r, item);   // open shelves have none
  model.boards.filter(b => b.id === 'pullOutShelf').forEach(pullOutShelf);
  return { carcasses, axes: { sink: sinkX, hob: hobX } };
}

/* the materials of the boards for core, from their products: a decor photo, a lacquer or a colour; the bare edge its core */
/** @param {CabinetsModel} model @returns {Object<string, MaterialLook>} */
function boardLooks(model) {
  /** @type {Object<string, MaterialLook>} */
  const out = {};
  for (const [code, m] of Object.entries(model.materials)) {
    const def = m.texture ? { color: '#ffffff', image: { key: m.texture }, roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.55, reflect: 0.5 }
      : m.lacquered ? { color: m.color, roughness: 0.42, clearcoat: 0.2, clearcoatRoughness: 0.45, reflect: 0.7 }
      : { color: m.color, roughness: 0.8, reflect: 0.45 };
    out['board:' + code] = def;
    if (m.texture) out['board:' + code + '~'] = Object.assign({}, def, { image: { key: m.texture, turn: true } });
    if (m.core) out['board:' + code + ':core'] = m.coreSurface === 'chipboard' ? { color: m.core, roughness: 0.95, chipboard: { tile: 120 } }   // the chips of a bare edge, plain to see
      : { color: m.core, roughness: 0.92, texture: { strength: 0.6, grain: 1, tile: 60 } };
  }
  return out;
}

return { draw, boardLooks };
}
