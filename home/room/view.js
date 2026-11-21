// @ts-check
/* room/view.js: a room drawn from its model (room/model.js): the cabinets (room/furniture.js), the fixtures
   (library/shapes.js), the built-ins, the tiles laid, the lamps, described (core/drawing.js: still cells, moving parts,
   details, lamps) and shown by a scene of core; the furniture's 2D plan; the checks of what is drawn; the layers of the
   room's own view. */
/** @typedef {ReturnType<ReturnType<typeof roomViewModule>['build']>} BuiltRoom */
/** @param {ReturnType<typeof roomModelModule>} room @param {ReturnType<typeof roomCabinetsModule>} cabinets
    @param {ReturnType<typeof roomFurnitureModule>} furniture @param {ReturnType<typeof libraryShapesModule>} shapes
    @param {ReturnType<typeof coreDrawingModule>} drawing @param {ReturnType<typeof corePlan2dModule>} plan2d */
function roomViewModule(room, cabinets, furniture, shapes, drawing, plan2d) {
'use strict';
const C = cabinets;

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
  const tiles = prepared.scene.tiles ? room.layTiles(prepared, { product: opts.library.product, textures: opts.library.textures }, { layers: ['tiles'].concat(EXTRA) }, 'cuts') : { pieces: [], materials: {}, counts: {} };
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
  made.checks = () => [
    { name: 'Furniture: the tree', about: 'The tree of the furniture by the rules of every tree (ids, sizes), and each group inside the box its scene gives it in the room.', items: room.checks(prepared) },
    { name: 'Furniture: every solid has its node', about: 'Every solid drawn (a board, a front, a piece of hardware, a part of an appliance) lies inside a node of its group\'s tree: nothing is drawn that the tree does not hold.', items: unheld(made, prepared) },
    { name: 'Furniture: inside its group', about: 'Every solid of a group lies inside the box its scene gives it in the room.', items: outside(made, prepared) },
    { name: 'Furniture: parts with no size', about: 'A part whose box has no number (a size the data does not give) is not drawn; it is listed here.', items: UNDRAWN.slice() },
    { name: 'Cabinets: banded edges are seen', about: 'An edge is banded to be seen: none of the banded edges lies against another part (a board, a front, a worktop, a panel, an appliance, the wall, the floor).', items: C.coveredEdges(model) },
    { name: 'Cabinets: the model', about: 'What the cabinets\' model finds wrong in the cabinets file: a piece that does not fit its column, a hinge on a shelf, a worktop too short, …', items: model.warnings.slice() }
  ];
  return made;
}


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

return { build, layers };
}
