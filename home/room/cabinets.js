// @ts-check
/* room/cabinets.js: the cabinets of a room from its cabinets file: carcasses, boards, fronts, strips, panels, plinths, worktops,
   plasterboard, holes, counts, problems. The same file always gives the same model; it draws nothing and knows no room.
   Coordinates in mm per group: x along the group from its left end (seen from the front), y out from the carcass backs
   (groups[g].wall: y of the wall), h up from the floor; a box is [x0, x1, y0, y1, h0, h1]. */

/**
 * A room's cabinets file (format cabinets, version 1; room/project.md).
 * @typedef {object} CabinetsFile
 * @property {string} format
 * @property {number} version
 * @property {Object<string, any>} settings  materials, hardware and how the cabinets are built
 * @property {Object<string, { product: string, feet?: any }>} [appliances]  by role
 * @property {{ name: string, description?: string, details?: string[] }[]} [notes]
 * @property {FileGroup[]} groups
 * @property {Component[]} components
 * @property {Object<string, any>} [materials]  not in the file: code -> the library's board, added before the build
 */
/** @typedef {CabinetsFile & { materials: Object<string, any> }} CabinetsProject  a cabinets file with the library's boards (withLibrary) */
/** @typedef {{ group: number, name: string, backGap: number, depth?: number, columns: number[] }} FileGroup */
/**
 * One piece of a group, as written in the file.
 * @typedef {object} Component
 * @property {number} group
 * @property {number} column
 * @property {number} [span]
 * @property {string} type
 * @property {number} [height]
 * @property {string} [carcass]
 * @property {string[]} [tags]
 * @property {string} [handle]
 * @property {Gaps} [gaps]
 * @property {string} [hinge]
 * @property {string} [note]
 */

/** @typedef {{ left: number, right: number, top: number, bottom: number }} Gaps  mm from the module's edges to its front */
/** @typedef {{ side: string, length: number, along: string }} Edge  a banded edge: its side, its length, the size it runs along (a | b) */
/** @typedef {{ kind: string, diameter: number, depth: number, x: number, y: number, [more: string]: any }} Hole */
/**
 * A component of the file, placed: its column span gives x, its stack h.
 * @typedef {object} Item
 * @property {number} group
 * @property {number} column
 * @property {number} span
 * @property {string} type
 * @property {number} x0
 * @property {number} x1
 * @property {number} h0
 * @property {number} h1
 * @property {number} index  its row in components
 * @property {string} [carcass]  its carcass's name
 * @property {string[]} [tags]
 * @property {string} [handle]
 * @property {Gaps|null} [gaps]
 * @property {string} [hinge]
 * @property {string} [note]
 * @property {number} [height]
 * @property {number} [carcassId]
 * @property {Front} [front]
 * @property {Object<string, number>} [fit]  an appliance's place in its module
 */
/**
 * @typedef {object} Carcass
 * @property {number} id
 * @property {string} name
 * @property {number} group
 * @property {number} column
 * @property {number} span
 * @property {number} x0
 * @property {number} x1
 * @property {number} h0
 * @property {number} h1
 * @property {Item[]} boxes  its modules, bottom up
 * @property {Item[]} members  every component with its name
 * @property {boolean} floor  stands on a plinth
 * @property {boolean} base  under a worktop (on a plinth or hung)
 * @property {boolean} hung  on the wall: nothing under it
 * @property {string} kind  base | tall | wall
 * @property {string[]} flags
 * @property {boolean} sink
 * @property {boolean} hob
 * @property {boolean} fridge
 * @property {number} legs
 * @property {boolean} grille
 */
/** @typedef {Carcass & { parts: any[], movers: any[] }} DrawnCarcass  a carcass as room/furniture.js describes it: its cells and moving parts */
/**
 * A board to cut: a × b of its material.
 * @typedef {object} Board
 * @property {string} id  its kind, the same for every size
 * @property {string} name
 * @property {number} a
 * @property {number} b
 * @property {string} material
 * @property {string} layer
 * @property {number} group
 * @property {number} [column]
 * @property {number|null} [carcassId]
 * @property {number} [frontId]
 * @property {Box} box
 * @property {Edge[]} [edges]  none: no edge banded
 * @property {Hole[]} [holes]
 * @property {{ x: string, y: string }} [holeFrom]  the corner its holes are measured from
 * @property {object[]} [cutouts]
 * @property {string} [hand]
 * @property {string} [item]
 * @property {boolean} [inner]  of an inner drawer
 * @property {number} [doorDrawer]  of a drawer behind a door: its index
 */
/**
 * @typedef {object} Geometry  of a group, y from the carcass backs
 * @property {number} carcassDepth
 * @property {number} carcassFront
 * @property {number} frontFace
 * @property {number} plinthFace
 * @property {number} panelFace
 */
/**
 * @typedef {object} GroupModel
 * @property {number} group
 * @property {string} name
 * @property {number[]} widths  of its columns
 * @property {number[]} columnX  the columns' left ends and the group's end
 * @property {number} length
 * @property {Item[]} items
 * @property {boolean} island
 * @property {number} backGap
 * @property {number} wall  y of the wall
 * @property {object[]} areas
 * @property {Geometry} geometry  set once the group is stacked
 */
/** @typedef {Object<string, any>} Front  a front (or an open drawer): its box, size, opening, hinges, drawer */
/**
 * A panel, strip or plinth along a group: a × b of its material.
 * @typedef {object} Panel
 * @property {number} group
 * @property {Item} [item]  none: one the model adds (an island's back panel)
 * @property {string} material
 * @property {string} [name]  none: a plinth
 * @property {number} a
 * @property {number} b
 * @property {Box} box
 * @property {Edge[]} [edges]
 * @property {{ long: number, short: number } | null} [lacquer]
 * @property {string[]} [lacqueredSides]
 */
/** @typedef {{ id: string, name?: string, type: string, offset: number[], size: number[], part?: any, children: FurnitureNode[] }} FurnitureNode  a node of a room's furniture; part: what of the model it draws */
/** @typedef {{ group: number, item: Item, name: string, a: number, b: number }} PlasterPiece  a plasterboard to cut, a × b */
/** @typedef {ReturnType<ReturnType<typeof roomCabinetsModule>['build']>} CabinetsModel  the cabinets of a room, as built from its file */

function roomCabinetsModule() {
'use strict';

/* ================= 1. VOCABULARY: types, tags and what they build ================= */

/* type = what a component is; exactly one per component, it decides what gets built (cabinets.md §2) */
const TYPES = ['space', 'plasterboard', 'plinth', 'worktop', 'endPanel', 'wallPanel', 'frontPanel', 'strip', 'cabinet', 'drawer', 'oven', 'microwave'];

/* tag = an extra on a type: it adds to the same build. Each tag is allowed only on the types listed. */
const TAGS = {
  dummy: ['drawer'],       // fixed drawer front: no drawer box
  hob: ['cabinet', 'drawer'], // cross rails on edge + separation panel under the hob
  sink: ['cabinet', 'drawer'], // cross rails on edge, no shelves, sink cut-out
  basin: ['cabinet', 'drawer'], // a basin stands on the top over it: its round holes in the top (settings.cutouts.basin)
  banded: ['worktop'],     // a top banded all round (a top of board in a wet room)
  bins: ['drawer'],        // waste-sorting bins in the drawer
  innerDrawer: ['drawer'],       // inner cutlery drawer above the drawer box, behind the same front
  island: ['worktop'],     // island worktop: of the islandWorktop material, the island back panel, no wall
  coffee: ['cabinet'],     // pull-out shelf at the bottom, shelves above it, no other shelves
  doorDrawers: ['cabinet'],   // drawers of board on ball runners behind the door, a spacer on the hinge side, no shelves
  fridge: ['cabinet'],     // front on a built-in fridge door: no hinges, no adjustable shelves, no back
  freezer: ['cabinet'],    // the same, freezer door
  dishwasher: ['cabinet'], // front on a built-in dishwasher door: no carcass, no hinges
  open: ['cabinet', 'drawer']  // no front: open shelves (no door, no hinges), a drawer whose box is seen; the back runs behind it
};
const TAG_NAMES = Object.keys(TAGS);
/* at most one tag of each set per component */
const EXCLUSIVE_TAGS = [['fridge', 'freezer', 'dishwasher'], ['dummy', 'bins'], ['dummy', 'innerDrawer'], ['coffee', 'doorDrawers'], ['open', 'dummy'],
  ['open', 'fridge', 'freezer', 'dishwasher', 'coffee', 'doorDrawers']];

const FRONT_TYPES = ['cabinet', 'drawer'];              // have a front: 4 gaps, a handle
const BOX_TYPES = [...FRONT_TYPES, 'oven', 'microwave'];    // stand in a carcass (need a carcass name, except a dishwasher)
const BOARD_TYPES = ['worktop', 'endPanel', 'wallPanel', 'plinth', 'frontPanel', 'strip', ...FRONT_TYPES]; // each in the uses of exactly one material

/* parts the engine adds inside a carcass; with the board types they are the uses a material lists */
const PARTS = ['carcass', 'backPanel', 'drawerBox', 'hobPanel'];
/* the worktop and the end panels of an island have their own materials (their depth) */
const ISLAND_USE = 'islandWorktop', ISLAND_END_PANEL_USE = 'islandEndPanel';
const DEPTH_USES = ['worktop', ISLAND_USE, 'endPanel', ISLAND_END_PANEL_USE]; // worktop: the depth; end panel: the largest depth it can have
const USES = [...BOARD_TYPES, ISLAND_USE, ISLAND_END_PANEL_USE, ...PARTS];

/* carcass flags: a carcass has the flag when one of its boxes has one of the tags */
const CARCASS_FLAGS = { sink: ['sink'], basin: ['basin'], hob: ['hob'], fridge: ['fridge', 'freezer'], coffee: ['coffee'], doorDrawers: ['doorDrawers'] };

/* a carcass on a plinth gets a ventilation grille in the plinth when it holds one of these (air intake for the appliance) */
const GRILLE_FOR = { types: ['oven'], tags: ['fridge', 'freezer'] };
const VENTED_SHELF_OVER = ['oven']; // a fixed shelf over these types is shallower: settings.shelf.ventGap of air behind it
const SHELF_UNDER_JOINT = ['oven'];  // a fixed shelf under these types sits below the joint, not centred: the front under it can cover it fully

/* visible names of the identifiers above; the code keeps the English identifiers */
const LABELS = {
  type: { space: 'space', plasterboard: 'plasterboard casing', plinth: 'plinth', worktop: 'worktop', endPanel: 'end panel', wallPanel: 'wall panel', frontPanel: 'front panel',
    strip: 'front strip', cabinet: 'cabinet', drawer: 'drawer', oven: 'oven', microwave: 'microwave' },
  tag: { dummy: 'dummy', hob: 'hob', sink: 'sink', bins: 'bins', innerDrawer: 'inner drawer', island: 'island',
    coffee: 'coffee machine', doorDrawers: 'drawers behind the door', fridge: 'fridge', freezer: 'freezer', dishwasher: 'dishwasher', open: 'open' },
  carcassKind: { base: 'base', tall: 'tall', wall: 'wall' },
  edge: { front: 'front', top: 'top', bottom: 'bottom', left: 'left', right: 'right' },
  /* uses that are not a type (the types have their own label) */
  use: { islandWorktop: 'island worktop', islandEndPanel: 'island end panel', carcass: 'carcass', backPanel: 'back panel', drawerBox: 'drawer boxes', hobPanel: 'panel under the hob' },
  hole: { cup: 'hinge cup', plate: 'hinge plate', bumper: 'bumper', shelfPin: 'shelf pin', runner: 'drawer / pull-out shelf runner', sink: 'sink cut-out', hob: 'hob cut-out', basin: 'basin hole' },
  /* short codes of the holes and cut-outs in the cut list (its legend explains them): always two letters, the first one the
     group (H hinge, S shelf / runner, C cut-out), the second the part */
  holeCode: { cup: 'HC', plate: 'HP', bumper: 'HB', shelfPin: 'SP', runner: 'SR', sink: 'CS', hob: 'CH', basin: 'CB' },
  /* hand of a part, as seen from the front of the furniture: a carcass side or hinge post (left / right), a door (its hinge side: front.hand) */
  hand: { left: 'L', right: 'R' },
  holeFrom: { front: 'from the front', back: 'from the back', bottom: 'from the bottom', hinge: 'from the hinge edge', left: 'from the left end', right: 'from the right end' }
};
LABELS.flag = Object.fromEntries(Object.keys(CARCASS_FLAGS).map(flag => [flag, LABELS.tag[flag]])); // a flag is named as its tag
const typeLabel = type => LABELS.type[type] || type;
const tagsLabel = words => words.map(w => LABELS.type[w] || LABELS.tag[w] || w).join(' ');
const useLabel = use => LABELS.use[use] || typeLabel(use); // a material use: a type or a part

/* how a front opens, from its type and tags (first rule that matches) */
function openingOf(item) {
  if (hasTag(item, 'open')) return item.type === 'drawer' ? 'drawer' : 'open';
  if (hasTag(item, 'dummy')) return 'fixed';
  if (item.type === 'drawer') return 'drawer';
  if (hasTag(item, 'dishwasher')) return 'dishwasher';
  if (hasTag(item, 'fridge', 'freezer')) return 'fridge';
  return 'door';
}
const HINGED = ['door', 'fridge']; // openings with a hinge side; only 'door' gets hinges counted
const opens = item => FRONT_TYPES.includes(item.type) && openingOf(item) !== 'fixed'; // a front that opens
const isOpen = item => hasTag(item, 'open');        // a module without a front

const SIDES = ['top', 'bottom', 'left', 'right']; // the four edges of a front or a panel: handle positions, gaps, panel edges
const HINGE_SIDES = ['left', 'right'];
LABELS.side = Object.fromEntries(SIDES.map(side => [side, LABELS.edge[side]]));

/* a lacquered material is lacquered on both faces; its edges only where the room sees them (a strip on edge: its front) */
const STRIP_LACQUERED_SIDES = ['front'];
const LACQUERED_EDGES = {
  front: { long: 2, short: 2 },
  strip: { long: STRIP_LACQUERED_SIDES.length, short: 0 },
  plinth: { long: 0, short: 0 }
};

/* settings the engine and the pages read, each set needed when the file has what it is for (has: what the components
   hold, featuresOf); a missing one stops the build (checkSettings) */
const DRILLING_SHELF_PIN = ['drilling.shelfPin.diameter', 'drilling.shelfPin.depth', 'drilling.shelfPin.fromFront', 'drilling.shelfPin.fromBack', 'drilling.shelfPin.belowShelf'];
const DRILLING_RUNNER = ['drilling.runner.diameter', 'drilling.runner.depth', 'drilling.runner.fromFront', 'drilling.runner.belowDrawer'];
/** @type {[(has: any) => boolean, string[]][]} the settings a file needs: [when, paths] */
const REQUIRED_SETTINGS = [
  [() => true, ['carcass.depth', 'carcass.frontGap', 'carcass.legs', 'backPanel.inset', 'shelf.setback', 'shelf.clearance', ...DRILLING_SHELF_PIN]],
  [has => !has.grid, ['shelf.perDoor']],
  [has => has.type.oven || has.tag.fridge || has.tag.freezer, ['shelf.ventGap']],
  [has => has.type.worktop, ['crossRails.depth', 'crossRails.hobFront', 'crossRails.hobPanelGap', 'worktop.overhang', 'worktop.endPanelOverhang']],
  [has => has.tag.coffee, ['pullOutShelf.depth', 'pullOutShelf.clearance', 'pullOutShelf.lift', 'pullOutShelf.spacerAbove', 'pullOutShelf.machineHeight', 'pullOutShelf.shelvesAbove']],
  [has => has.tag.doorDrawers, ['doorDrawers.count', 'doorDrawers.sideHeight', 'doorDrawers.lift', 'doorDrawers.clearance', 'doorDrawers.runnerLengths', 'drilling.ballRunner.fromFront', 'drilling.ballRunner.aboveBottom']],
  [has => has.door, ['hinges.fromEnd', 'hinges.postDepth', 'hinges.aboveShelf', 'hinges.perDoor', 'drilling.cup.diameter', 'drilling.cup.depth', 'drilling.cup.fromEdge',
    'drilling.plate.diameter', 'drilling.plate.depth', 'drilling.plate.fromFront', 'drilling.plate.spacing', 'drilling.bumper.diameter', 'drilling.bumper.depth']],
  [has => has.drawer && !has.boardDrawers, ['drawers.D.frontAbove', 'drawers.D.sideHeight', 'drawers.D.backHeight', 'drawers.M.sideHeight', 'drawers.M.backHeight',
    'drawers.bottom.inset', 'drawers.bottom.depth', 'drawers.bottom.fromBack', 'drawers.back.inset', 'drawers.liftAtBottom', 'drawers.liftAbove', ...DRILLING_RUNNER]],
  [has => has.drawer && has.tag.innerDrawer, ['drawers.inner.gap', 'drawers.inner.backHeight', 'drawers.inner.frontDeduction']],
  [has => has.boardDrawers, ['drawers.board.sideHeight', 'drawers.board.lift', 'drawers.board.clearance', 'drawers.board.setback', 'drawers.board.backClearance',
    'drawers.board.runnerLengths', 'drilling.ballRunner.fromFront', 'drilling.ballRunner.aboveBottom', ...DRILLING_RUNNER]],
  [has => has.tag.doorDrawers, DRILLING_RUNNER],
  [has => has.type.strip, ['strip.depth']],
  [has => has.type.plinth, ['plinth.setback']],
  [has => has.type.plasterboard, ['plasterboard.depth', 'plasterboard.studSpacing', 'plasterboard.layers']],
  [has => has.grid, ['shelf.grid.from', 'shelf.grid.pitch', 'shelf.grid.fixedEvery']]
];
/* what a project holds, for the settings and the materials it needs: its types and tags, a door, a drawer, the drawer system */
function featuresOf(project) {
  const settings = (project && project.settings) || {}, comps = (project && project.components) || [], has = { type: {}, tag: {} };
  for (const c of comps) {
    const type = readType(c.type), tags = parseTags(c.tags).tags;
    has.type[type] = true;
    for (const t of tags) has.tag[t] = true;
    if (type === 'cabinet' && !tags.some(t => ['open', 'dishwasher', 'fridge', 'freezer'].includes(t))) has.door = true;
    if (type === 'drawer' && !tags.includes('dummy')) has.drawer = true;
    if (FRONT_TYPES.includes(type) && !tags.includes('open')) has.front = true;
  }
  has.boardDrawers = valueAt(settings, 'drawers.box') === 'board';
  has.grid = valueAt(settings, 'shelf.grid') !== undefined;
  return has;
}
/* the uses a project needs a material for: the carcass and its back always, the boxes of its drawers, its types (a front type
   only with a front), the panel under a hob, an island's worktop and end panels */
function usesNeeded(project) {
  const has = featuresOf(project), island = has.tag.island;
  return USES.filter(use => use === 'carcass' || use === 'backPanel' || (use === 'drawerBox' && (has.drawer || has.tag.doorDrawers)) || (use === 'hobPanel' && has.tag.hob)
    || (FRONT_TYPES.includes(use) ? has.front && has.type[use] : BOARD_TYPES.includes(use) && has.type[use])
    || (use === ISLAND_USE && island) || (use === ISLAND_END_PANEL_USE && island && has.type.endPanel));
}

/* cut-outs in a worktop: the carcass flag that asks for one -> settings.cutouts[flag] {width, depth, fromBack}, centred on the carcass */
const CUTOUT_FLAGS = ['sink', 'hob', 'basin'];

/* a shelf rests on a pin in each side at the front and at the back (cabinets.md §5) */
const PINS_PER_SHELF = 4;

/* boards lying flat in a carcass: no hole may hit them */
const HORIZONTAL_BOARDS = ['bottomBoard', 'topBoard', 'crossRail', 'fixedShelf', 'hobPanel'];

/* ================= 2. SMALL HELPERS ================= */

/* for the pages: a count with its noun (1 problem, 2 problems) */
const plural = (y, one, many) => (y === 1 ? one : many);

/** a value by its dotted path (counts.tag.coffee); undefined where there is none */
const valueAt = (/** @type {any} */ obj, /** @type {string} */ dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));
const reachesHingeSide = (item, carcass) => (item.hinge === 'left' ? item.x0 === carcass.x0 : item.x1 === carcass.x1); // the door reaches the carcass side its hinges are on

/* how a component's place is printed (warnings, lists, tooltips): "G1[4]" = group 1, column 4; "G1[1-11]" = columns 1 to 11 */
const placeLabel = (group, column, span = 1) => `G${group}[${column}${span > 1 ? '-' + (column + span - 1) : ''}]`;
const placeOf = item => placeLabel(item.group, item.column, item.span);

/* how many shelves, hinges ... a front of this height gets */
const countByHeight = (table, height) => {
  const row = table.find(r => r.maxHeight === undefined || height <= r.maxHeight);
  return row ? row.count : null;
};

/* [h0, h1] of the boards lying flat in a carcass */
const horizontalBands = (boards, carcass) => boards.filter(b => b.carcassId === carcass.id && HORIZONTAL_BOARDS.includes(b.id)).map(b => [b.box[4], b.box[5]]);

/* the clear space of a module in its carcass: the nearest horizontal boards below and above its middle (a fixed shelf need not be
   centred on a joint, e.g. under an oven); NaN where there is none */
function spaceAround(boards, carcass, h0, h1) {
  const mid = (h0 + h1) / 2, bands = horizontalBands(boards, carcass);
  const below = bands.filter(([a, b]) => (a + b) / 2 <= mid).map(([, b]) => b), above = bands.filter(([a, b]) => (a + b) / 2 > mid).map(([a]) => a);
  return { bottom: below.length ? Math.max(...below) : NaN, top: above.length ? Math.min(...above) : NaN };
}

/* tags come as a list (the cabinets file) or as typed text (the editor) */
const TAG_BY_LOWER = Object.fromEntries(TAG_NAMES.map(tag => [tag.toLowerCase(), tag])); // typed tags match in any letter case
function parseTags(tags) {
  const words = (Array.isArray(tags) ? tags : String(tags ?? '').split(/[\s,]+/)).map(w => String(w).trim()).filter(Boolean)
    .map(w => TAG_BY_LOWER[w.toLowerCase()] || w);
  return { words, tags: words.filter(w => TAG_NAMES.includes(w)), unknown: words.filter(w => !TAG_NAMES.includes(w)) };
}
const tagsOf = type => TAG_NAMES.filter(tag => TAGS[tag].includes(type));
const TYPE_BY_LOWER = Object.fromEntries(TYPES.map(type => [type.toLowerCase(), type])); // typed types match in any letter case
const readType = value => TYPE_BY_LOWER[String(value ?? '').trim().toLowerCase()] || '';

/* a worktop, an end panel or a strip is as thick as its material: which size to compare */
function onEdgeSize(item, island) {
  const width = item.x1 - item.x0, height = item.h1 - item.h0;
  if (item.type === 'worktop') return { use: island ? ISLAND_USE : 'worktop', size: height, what: 'height' };
  if (item.type === 'endPanel') return { use: island ? ISLAND_END_PANEL_USE : 'endPanel', size: width, what: 'width' };
  if (item.type === 'strip') return { use: 'strip', size: Math.min(width, height), what: height > width ? 'width' : 'height' };
  return null;
}

function frontBox(item) {
  const { left, right, top, bottom } = item.gaps;
  return { x0: item.x0 + left, x1: item.x1 - right, h0: item.h0 + bottom, h1: item.h1 - top };
}

/* ================= 3. CHECKS THAT STOP THE BUILD: materials and settings ================= */

function materialUses(materials, needed = USES) {
  const materialFor = {}, problems = [];
  for (const [code, m] of Object.entries(materials || {})) {
    if (!(m.thickness > 0)) problems.push(`Material ${code}: the thickness must be > 0.`);
    if (!/^#[0-9a-f]{6}$/i.test(m.color || '')) problems.push(`Material ${code}: the colour must be "#rrggbb".`);
    if ((m.uses || []).some(use => DEPTH_USES.includes(use)) && !(m.depth > 0 || m.width > 0)) problems.push(`Material ${code}: ${m.uses.filter(use => DEPTH_USES.includes(use)).map(useLabel).join(', ')} needs a depth > 0 (or a sheet's width: a top cut from a board).`);
    /* factoryEdges: edges the material comes finished with (no edge banding to order) */
    for (const side of m.factoryEdges || []) if (!(side in LABELS.edge)) problems.push(`Material ${code}: the factory edge "${side}" must be one of: ${Object.keys(LABELS.edge).join(', ')}.`);
    for (const use of m.uses || []) {
      if (!USES.includes(use)) problems.push(`Material ${code}: "${use}" is neither a board type nor a carcass part (${USES.join(', ')}).`);
      else if (materialFor[use]) problems.push(`${use} is in two materials: ${materialFor[use]} and ${code}.`);
      else materialFor[use] = code;
    }
  }
  for (const use of needed) if (!materialFor[use]) problems.push(`No material is used for ${use}.`);
  const frontThicknesses = new Set(FRONT_TYPES.filter(t => materialFor[t]).map(t => (materials || {})[materialFor[t]].thickness));
  if (frontThicknesses.size > 1) problems.push(`The front materials (${FRONT_TYPES.join(', ')}) must have one thickness: the plane of the fronts.`);
  return { materialFor, problems };
}

/* problems in the materials and settings that make a build impossible; the editor lists them, build() throws them */
function checkSettings(project) {
  return [...materialUses(project && project.materials, usesNeeded(project)).problems, ...settingProblems((project && project.settings) || {}, featuresOf(project)), ...groupProblems(project && project.groups)];
}
/* groups: a list [{group, name, backGap, depth (optional: the carcasses' depth, else settings.carcass.depth), columns}], one entry per group number */
function groupProblems(groupList) {
  if (!Array.isArray(groupList)) return ['No list groups [{group, name, backGap, columns}].'];
  const problems = [], seen = new Set();
  for (const g of groupList) {
    if (!(g && Number.isInteger(g.group) && g.group >= 1)) { problems.push('groups: every group needs a number "group" (an integer ≥ 1).'); continue; }
    if (seen.has(g.group)) problems.push(`groups: group ${g.group} is on the list twice.`);
    seen.add(g.group);
    if (!(g.backGap >= 0)) problems.push(`groups: group ${g.group} needs backGap ≥ 0 (the gap behind the carcasses).`);
    if (g.depth !== undefined && !(Number.isInteger(g.depth) && g.depth > 0)) problems.push(`groups: the depth of group ${g.group} must be whole mm > 0 (or none: settings.carcass.depth).`);
    if (!Array.isArray(g.columns)) problems.push(`groups: group ${g.group} needs a list columns.`);
  }
  return problems;
}
function settingProblems(settings, has) {
  const problems = [], needed = new Set(REQUIRED_SETTINGS.filter(([need]) => need(has)).flatMap(([, paths]) => paths));
  for (const path of needed) if (valueAt(settings, path) === undefined) problems.push(`Missing setting ${path}.`);
  for (const path of ['shelf.perDoor', 'hinges.perDoor']) {
    const table = valueAt(settings, path);
    const isRow = (row, last) => row && Number.isInteger(row.count) && (last ? row.maxHeight === undefined : row.maxHeight > 0);
    if (table !== undefined && !(Array.isArray(table) && table.length && table.every((row, i) => isRow(row, i === table.length - 1)))) {
      problems.push(`The setting ${path} must be a list [{maxHeight, count}, ..., {count}] (the last row without maxHeight).`);
    }
  }
  const hingeTable = valueAt(settings, 'hinges.perDoor');
  if (Array.isArray(hingeTable) && hingeTable.some(row => !(row && row.count >= 2))) problems.push('The setting hinges.perDoor: every door needs at least 2 hinges.');
  const doorDrawerCount = valueAt(settings, 'doorDrawers.count');
  if (doorDrawerCount !== undefined && !(Number.isInteger(doorDrawerCount) && doorDrawerCount >= 1)) problems.push('The setting doorDrawers.count must be an integer ≥ 1.');
  return problems;
}

/* ================= 4. LAYOUT: components -> items stacked in their columns ================= */

const readGap = value => (value === '' || value == null ? NaN : Number(value)); // an empty gap is not 0
const gapsText = gaps => [gaps.left, gaps.right, gaps.top, gaps.bottom].join(':'); // left:right:top:bottom

function readComponent(c, index) {
  const tags = parseTags(c.tags);
  return {
    index,
    group: +c.group,
    column: +c.column,
    span: +c.span,
    height: c.height,
    type: readType(c.type),
    tags: tags.tags,
    unknownTags: tags.unknown,
    carcass: String(c.carcass || '').trim(),
    handle: c.handle || '',
    hinge: c.hinge || '',
    gaps: c.gaps && typeof c.gaps === 'object' ? Object.fromEntries(SIDES.map(side => [side, readGap(c.gaps[side])])) : null,
    note: c.note || ''
  };
}

/* Each piece, in list order, starts on top of the stack of the columns it spans: in each column the stack is the run of
   pieces that reaches up without a gap from the floor (a piece can fill a gap left under a wider piece); the highest of
   those tops wins. Returns the pieces with x0, x1, h0, h1, and the ones that do not fit. */
function stack(widths, pieces) {
  const columnX = [0];
  widths.forEach(w => columnX.push(columnX[columnX.length - 1] + w));
  const occupied = widths.map(() => []); // [h0, h1] ranges per column
  const items = [], skipped = [];
  const stackTop = ranges => {
    let top = 0;
    for (const [a, b] of [...ranges].sort((p, q) => p[0] - q[0])) {
      if (a > top) break;
      top = Math.max(top, b);
    }
    return top;
  };
  for (const piece of pieces) {
    const first = piece.column - 1, end = first + piece.span;
    if (!Number.isInteger(piece.column) || !Number.isInteger(piece.span) || first < 0 || piece.span < 1 || end > widths.length || !(piece.height >= 0)) {
      skipped.push({ piece, why: 'goes beyond the columns' });
      continue;
    }
    let h0 = 0;
    for (let k = first; k < end; k++) h0 = Math.max(h0, stackTop(occupied[k]));
    const h1 = h0 + piece.height;
    if (occupied.slice(first, end).some(ranges => ranges.some(([a, b]) => Math.max(h0, a) < Math.min(h1, b)))) {
      skipped.push({ piece, why: 'overlaps another piece' });
      continue;
    }
    for (let k = first; k < end; k++) occupied[k].push([h0, h1]);
    items.push({ ...piece, x0: columnX[first], x1: columnX[end], h0, h1 });
  }
  return { items, skipped, columnX };
}

/* the height of a carcass comes from its boxes, not from every member (a panel or a space in it may be lower) */
function carcassAreas(items) {
  const byName = new Map();
  for (const item of items) {
    if (!item.carcass) continue;
    if (!byName.has(item.carcass)) byName.set(item.carcass, []);
    byName.get(item.carcass).push(item);
  }
  return [...byName].map(([name, members]) => {
    const boxes = members.filter(i => BOX_TYPES.includes(i.type));
    const vertical = boxes.length ? boxes : members;
    return {
      name,
      members,
      x0: Math.min(...members.map(i => i.x0)),
      x1: Math.max(...members.map(i => i.x1)),
      h0: Math.min(...vertical.map(i => i.h0)),
      h1: Math.max(...vertical.map(i => i.h1)),
      firstColumn: Math.min(...members.map(i => i.column)),
      lastColumn: Math.max(...members.map(i => i.column + i.span - 1))
    };
  });
}

/* ================= 5. BUILD ================= */

/* the project with its materials resolved: settings.materials names the product of the library each use is made of
   (a board type or a carcass part -> product key); each material gets the library's product and the uses made of it */
/** @param {CabinetsFile} project @param {Object<string, AnyProduct>} boards @returns {CabinetsProject} */
function withLibrary(project, boards) {
  const uses = {};
  for (const [use, key] of Object.entries((project && project.settings && project.settings.materials) || {})) {
    if (!boards[key]) throw new Error(`settings.materials.${use}: no product ${key} in the library`);
    (uses[key] = uses[key] || []).push(use);
  }
  const materials = Object.fromEntries(Object.entries(uses).map(([key, x]) => [key, Object.assign({}, boards[key], { uses: x })]));
  return Object.assign({}, project, { materials });
}

/* the appliances of the project: the cabinets file names each by the type or tag it fits (fridgeFreezer for the tags fridge and
   freezer) with its product key in the library (library/products appliances) and how it is built in here (feet) */
/** @param {CabinetsFile} project @param {Object<string, AnyProduct>} library @returns {Object<string, AnyProduct & { product: string, feet?: any }>} */
function appliances(project, library) {
  return Object.fromEntries(Object.entries((project && project.appliances) || {}).map(([role, a]) => {
    if (!library[a.product]) throw new Error(`appliances.${role}: no product ${a.product} in the library`);
    return [role, Object.assign({}, library[a.product], a)];
  }));
}

/* appliances (appliances(), optional): the manufacturer's sizes, under the name of the type or tag they fit, fridgeFreezer for the tags fridge and freezer (fitAppliances) */
/** @param {CabinetsProject|null} project @param {Object<string, any>} [appliances] */
function build(project, appliances) {
  const projectData = project || /** @type {CabinetsProject} */ ({}), settings = projectData.settings || {};
  const stops = checkSettings(projectData);
  if (stops.length) throw new Error('Settings of the cabinets file: ' + stops.join(' '));

  /* every thickness comes from the material of the type or part */
  const { materialFor } = materialUses(projectData.materials);
  const thickness = Object.fromEntries(Object.entries(materialFor).map(([use, code]) => [use, projectData.materials[code].thickness]));
  /* label: name + thickness */
  const materials = Object.fromEntries(Object.entries(projectData.materials).map(([code, m]) => [code, { ...m, label: m.name + ' ' + m.thickness }]));
  const lacquerOf = (kind, use) => ((projectData.materials[materialFor[use]] || {}).lacquered ? LACQUERED_EDGES[kind] : null);   // a use the file has no material for: none
  const board = thickness.carcass, half = board / 2, frontThickness = thickness.cabinet ?? thickness.drawer;
  const carcassBack = 0;                     // y: from the carcass backs, in every group
  /* [x0, x1] of a spacer of carcass board inside the carcass side on the hinge side (it carries runners past the hinges) */
  const spacerOnHingeSide = (carcass, hinge) => (hinge === 'right' ? [carcass.x1 - 2 * board, carcass.x1 - board] : [carcass.x0 + board, carcass.x0 + 2 * board]);

  const issues = []; // { index of the component, text, skipped }
  /** @type {(text: string, index?: number|null, skipped?: boolean) => void} */
  const warn = (text, index = null, skipped = false) => { issues.push({ index, text, skipped }); };
  const groups = /** @type {Object<string, GroupModel>} */ ({}), carcasses = /** @type {Carcass[]} */ ([]), fronts = /** @type {Front[]} */ ([]), boards = /** @type {Board[]} */ ([]);
  const /** @type {Panel[]} */ strips = [], /** @type {Panel[]} */ plinths = [], /** @type {Panel[]} */ frontPanels = [], /** @type {Panel[]} */ wallPanels = [], /** @type {PlasterPiece[]} */ plaster = [];
  /** @type {Object<string, any>} */ const worktops = {};
  /* engine counts, used by info.js as {n:name}; wallBrackets: brackets of the back strips at a wall; jointLength: mm of carcass side
     screwed to a strip and its back strip, from the first carcass (screwed) or from inside the second one (fromInside) */
  const counts = {
    carcasses: 0, wallBrackets: 0, jointLength: { screwed: 0, fromInside: 0 }, fronts: 0, handles: 0, hinges: 0, bumpers: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
    shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, doorDrawers: 0, legs: 0, hangers: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0,
    plasterUD: 0, plasterCD: 0, plasterEdge: 0, type: {}, tag: {}
  };

  /* ---- components: checks on one component; what cannot be placed is skipped ----
     groups by number: each with its column widths, its name and backGap */
  const groupData = Object.fromEntries((projectData.groups || []).map(g => [String(g.group), g]));
  const columns = Object.fromEntries(Object.entries(groupData).map(([g, data]) => [g, data.columns || []])), pieces = [];
  (projectData.components || []).forEach((c, index) => {
    const piece = readComponent(c, index), at = placeOf(piece);
    if (!(String(c.group) in columns)) return warn(`${at}: group ${c.group} is not on the list groups - skipped.`, index, true);
    if (!Number.isInteger(piece.height)) return warn(`${at}: the height "${c.height}" must be a whole number of mm - skipped.`, index, true);
    if (!piece.type) {
      return warn(`${at}: ${String(c.type ?? '').trim() ? 'unknown type "' + c.type + '"' : 'no type'}; the type must be one of: ${TYPES.map(typeLabel).join(', ')} - skipped.`, index, true);
    }
    for (const set of EXCLUSIVE_TAGS) if (set.filter(tag => piece.tags.includes(tag)).length > 1) warn(`${at}: the tags ${tagsLabel(set)} exclude each other.`, index);
    for (const tag of piece.tags) if (!TAGS[tag].includes(piece.type)) warn(`${at}: tag ${tagsLabel([tag])} jest tylko dla: ${TAGS[tag].map(typeLabel).join(', ')}.`, index);
    if (piece.unknownTags.length) warn(`${at}: unknown tag ${piece.unknownTags.join(', ')} (for the type ${typeLabel(piece.type)}: ${tagsOf(piece.type).map(t => LABELS.tag[t]).join(', ') || 'no tags'}).`, index);
    const isFront = FRONT_TYPES.includes(piece.type) && !isOpen(piece);
    if (isOpen(piece) && (piece.handle || piece.hinge)) warn(`${at}: an open ${typeLabel(piece.type)} has no front: no handle, no hinges.`, index);
    if (piece.handle && !isFront) warn(`${at}: a ${typeLabel(piece.type)} cannot have a handle.`, index);
    else if (piece.handle && !SIDES.includes(piece.handle)) warn(`${at}: the handle "${piece.handle}" must be one of: ${SIDES.join(', ')}.`, index);
    if (hasTag(piece, 'dishwasher') && piece.carcass) warn(`${at}: a dishwasher has no carcass - remove the carcass name ${piece.carcass}.`, index);
    if (isFront) {
      if (!piece.gaps || !Object.values(piece.gaps).every(Number.isFinite)) {
        warn(`${at}: a ${typeLabel(piece.type)} needs 4 gaps (left, right, top, bottom) - drawn without gaps.`, index);
        piece.gaps = { left: 0, right: 0, top: 0, bottom: 0 };
      } else if (!Object.values(piece.gaps).every(Number.isInteger)) {
        warn(`${at}: the gaps ${gapsText(piece.gaps)} must be whole mm.`, index);
      }
      const hinged = HINGED.includes(openingOf(piece));
      if (hinged && !HINGE_SIDES.includes(piece.hinge)) warn(`${at}: a door needs a hinge side ${HINGE_SIDES.join(' or ')}.`, index);
      else if (hinged && piece.hinge === piece.handle) warn(`${at}: zawiasy i uchwyt po tej samej stronie.`, index);
      if (!hinged && piece.hinge) warn(`${at}: only doors have a hinge side.`, index);
    }
    pieces.push(piece);
  });

  /* ---- groups: stack the components in their columns ---- */
  for (const [g, widths] of Object.entries(columns)) {
    widths.forEach((w, i) => { if (!Number.isInteger(w)) warn(`${placeLabel(g, i + 1)}: the column width "${w}" must be a whole number of mm.`); });
    const stacked = stack(widths, pieces.filter(p => String(p.group) === g));
    for (const { piece, why } of stacked.skipped) warn(`${placeOf(piece)}: ${typeLabel(piece.type)} ${why} - skipped.`, piece.index, true);
    const island = stacked.items.some(item => item.type === 'worktop' && hasTag(item, 'island')); // a free-standing island: its worktop has the tag island
    const backGap = groupData[g].backGap; // behind the carcass backs: to the wall, an island to the back of its worktop
    groups[g] = /** @type {GroupModel} */ ({
      group: +g,
      name: groupData[g].name || '',
      widths,
      columnX: stacked.columnX,
      length: stacked.columnX[stacked.columnX.length - 1],
      items: stacked.items,
      island,
      backGap,
      wall: carcassBack - backGap,
      areas: carcassAreas(stacked.items)
    });
    for (const item of stacked.items) {
      counts.type[item.type] = (counts.type[item.type] || 0) + 1;
      for (const tag of item.tags) counts.tag[tag] = (counts.tag[tag] || 0) + 1;
      const onEdge = onEdgeSize(item, groups[g].island);
      if (!onEdge) continue;
      const { use, size, what } = onEdge;
      if (size !== Math.round(thickness[use])) warn(   // the data's sizes are whole mm: a board of 18.6 is 19 there
        `${placeOf(item)}: ${typeLabel(item.type)} - the ${what} ${size} does not match the material ${materials[materialFor[use]].label}.`, item.index);
    }
  }

  /* ---- the depth and the planes of each group, y from the carcass backs: its carcasses' depth (the group's, or settings.carcass.depth),
     the front plane (the fronts' face; a group without fronts: the carcass front), the plinth's face (plinth.setback behind the front
     plane), the face of a front panel in a carcass (one outside a carcass is screwed to its neighbour, in the front plane) ---- */
  for (const groupModel of Object.values(groups)) {
    const depth = groupData[groupModel.group].depth ?? settings.carcass.depth, front = carcassBack + depth;
    const fronted = groupModel.items.some(i => FRONT_TYPES.includes(i.type) && !isOpen(i));
    const face = front + (fronted ? settings.carcass.frontGap + frontThickness : 0);
    groupModel.geometry = { carcassDepth: depth, carcassFront: front, frontFace: face, plinthFace: face - (settings.plinth || {}).setback, panelFace: front + thickness.frontPanel };
  }
  const geometryOf = g => groups[String(g)].geometry;

  /* ---- carcasses: one per carcass name ---- */
  const groupOfName = new Map();
  for (const groupModel of Object.values(groups)) {
    for (const area of groupModel.areas) {
      if (groupOfName.has(area.name)) {
        warn(`Carcass ${area.name} is in group ${groupOfName.get(area.name)} and in group ${groupModel.group} - a carcass must be in one group.`, area.members[0].index);
        continue;
      }
      groupOfName.set(area.name, groupModel.group);
      const boxes = area.members.filter(i => BOX_TYPES.includes(i.type)).sort((a, b) => a.h0 - b.h0 || a.x0 - b.x0);
      carcasses.push(/** @type {Carcass} */ ({   // the rest is set below, once every carcass is known
        name: area.name, group: groupModel.group, column: area.firstColumn, span: area.lastColumn - area.firstColumn + 1,
        x0: area.x0, x1: area.x1, h0: area.h0, h1: area.h1, boxes, members: area.members
      }));
    }
    for (const item of groupModel.items) {
      if (BOX_TYPES.includes(item.type) && !item.carcass && !hasTag(item, 'dishwasher')) warn(`${placeOf(item)}: the ${typeLabel(item.type)} has no carcass name.`, item.index);
    }
  }
  carcasses.forEach((carcass, i) => {
    carcass.id = i + 1;
    /* floor = stands on a plinth; base = floor with a worktop on top; tall = floor without a worktop; wall = not on a plinth */
    const overlapsColumns = item => item.column <= carcass.column + carcass.span - 1 && item.column + item.span - 1 >= carcass.column;
    const groupItems = groups[carcass.group].items;
    carcass.floor = groupItems.some(item => item.type === 'plinth' && overlapsColumns(item) && item.h1 === carcass.h0);
    carcass.base = groupItems.some(item => item.type === 'worktop' && overlapsColumns(item) && item.h0 === carcass.h1);   // on a plinth or hung, a worktop on top
    /* hung on the wall: nothing under it but empty space (no plinth, no carcass) */
    carcass.hung = !carcass.floor && carcass.h0 > 0 && groupItems.filter(item => overlapsColumns(item) && item.h1 <= carcass.h0).every(item => item.type === 'space' && !item.carcass);
    carcass.kind = carcass.base ? 'base' : carcass.floor ? 'tall' : 'wall';
    for (const [flag, tags] of Object.entries(CARCASS_FLAGS)) carcass[flag] = carcass.boxes.some(b => hasTag(b, ...tags));
    carcass.flags = Object.keys(CARCASS_FLAGS).filter(flag => carcass[flag]);
    if (carcass.sink && carcass.hob) warn(`${carcass.name}: a sink and a hob in one carcass exclude each other.`, carcass.members[0].index);
    carcass.legs = carcass.floor ? settings.carcass.legs : 0;
    carcass.grille = carcass.floor && carcass.boxes.some(b => GRILLE_FOR.types.includes(b.type) || hasTag(b, ...GRILLE_FOR.tags));
    for (const item of carcass.members) item.carcassId = carcass.id;
    counts.legs += carcass.legs;
    counts.hangers += Number(carcass.hung);   // a pair each
    counts.sinks += Number(carcass.sink);
    counts.hobs += Number(carcass.hob);
    counts.fridges += Number(carcass.fridge);
    counts.grilles += Number(carcass.grille);
  });
  counts.carcasses = carcasses.length;
  const carcassOf = item => carcasses.find(carcass => carcass.id === item.carcassId); // undefined: not in a carcass

  /* ---- carcass boards ----
     id: kind of board, the same for all sizes (colours and counts on the pages); a, b: size; box: place;
     edges: banded edges [{side, length, along}] - the edge seen from the front, along = the size it runs along (a | b); hidden parts get none */
  const crossRails = settings.crossRails, shelf = settings.shelf, backPanel = settings.backPanel, boardDrawers = valueAt(settings, 'drawers.box') === 'board';
  for (const carcass of carcasses) {
    const { carcassDepth, carcassFront } = geometryOf(carcass.group);
    const { x0, x1, h0, h1 } = carcass;
    const width = x1 - x0, height = h1 - h0;
    const innerX0 = x0 + board, innerX1 = x1 - board, innerWidth = width - 2 * board;
    const carcassMaterial = materialFor.carcass;
    const part = (id, name, a, b, material, layer, box, edges = []) => {
      const piece = { id, name, a, b, material, layer, group: carcass.group, carcassId: carcass.id, box, edges };
      boards.push(piece);
      return piece;
    };
    const frontEdge = (length, along) => [{ side: 'front', length, along }];
    const bottomEdge = [{ side: 'bottom', length: innerWidth, along: 'a' }]; // a rail on edge shows its bottom edge when the drawer below is open

    part('side', 'Side', carcassDepth, height, carcassMaterial, 'carcasses', [x0, innerX0, carcassBack, carcassFront, h0, h1], frontEdge(height, 'b')).hand = 'left';
    part('side', 'Side', carcassDepth, height, carcassMaterial, 'carcasses', [innerX1, x1, carcassBack, carcassFront, h0, h1], frontEdge(height, 'b')).hand = 'right';
    part('bottomBoard', 'Bottom board', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassBack, carcassFront, h0, h0 + board], frontEdge(innerWidth, 'a'));

    /* top: a base carcass has 2 cross rails (flat; on edge under a sink or a hob), any other carcass a top panel */
    const crossRailName = carcass.base ? 'cross rail ' + crossRails.depth : '';   // only a base carcass has cross rails
    if (carcass.base && carcass.sink) {
      /* the cross rails stand on edge to clear the bowl */
      part('crossRail', 'Front ' + crossRailName + ', on edge', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassFront - board, carcassFront, h1 - crossRails.depth, h1], bottomEdge);
      part('crossRail', 'Back ' + crossRailName + ', on edge', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassBack, carcassBack + board, h1 - crossRails.depth, h1]);
    } else if (carcass.base && carcass.hob) {
      /* front rail on edge (hobFront high), rear rail on edge; the separation panel behind the front rail, flush with its bottom edge
         (hidden from the front), with an air gap at the back */
      part('crossRail', 'Front cross rail ' + crossRails.hobFront + ', on edge', innerWidth, crossRails.hobFront, carcassMaterial, 'carcasses',
        [innerX0, innerX1, carcassFront - board, carcassFront, h1 - crossRails.hobFront, h1], bottomEdge);
      part('crossRail', 'Back ' + crossRailName + ', on edge', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassBack, carcassBack + board, h1 - crossRails.depth, h1]);
      part('hobPanel', 'Panel under the hob', innerWidth, carcassDepth - 2 * board - crossRails.hobPanelGap, materialFor.hobPanel, 'carcasses',
        [innerX0, innerX1, carcassBack + board + crossRails.hobPanelGap, carcassFront - board, h1 - crossRails.hobFront, h1 - crossRails.hobFront + thickness.hobPanel]);
    } else if (carcass.base) {
      part('crossRail', 'Front ' + crossRailName, innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassFront - crossRails.depth, carcassFront, h1 - board, h1], frontEdge(innerWidth, 'a'));
      part('crossRail', 'Back ' + crossRailName, innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassBack, carcassBack + crossRails.depth, h1 - board, h1]);
    } else {
      part('topBoard', 'Top board', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassBack, carcassFront, h1 - board, h1], frontEdge(innerWidth, 'a'));
    }

    /* back behind cabinet doors and open shelves, and behind drawers of board (a system drawer has a back of its own; not behind dummy
       fronts, ovens, microwaves, fridges, freezers); one piece per run */
    const doorSpans = carcass.boxes
      .filter(b => (b.type === 'cabinet' && !hasTag(b, 'fridge', 'freezer')) || (b.type === 'drawer' && (isOpen(b) || boardDrawers)))
      .map(b => [Math.max(h0, b.h0), Math.min(h1, b.h1)])
      .sort((a, b) => a[0] - b[0])
      .reduce((runs, span) => {
        const last = runs[runs.length - 1];
        if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
        else runs.push([...span]);
        return runs;
      }, /** @type {number[][]} */ ([]));
    for (const [s0, s1] of doorSpans) {
      part('backPanel', 'Back panel', width - 2 * backPanel.inset, s1 - s0 - 2 * backPanel.inset, materialFor.backPanel, 'backs',
        [x0 + backPanel.inset, x1 - backPanel.inset, carcassBack - thickness.backPanel, carcassBack, s0 + backPanel.inset, s1 - backPanel.inset]);
    }

    /* a fixed shelf with its top at top; ventGap of air behind it when vented */
    const fixedShelf = (top, gap) => {
      part('fixedShelf', 'Fixed shelf', innerWidth, carcassDepth - gap, carcassMaterial, 'shelves', [innerX0, innerX1, carcassBack + gap, carcassFront, top - board, top], frontEdge(innerWidth, 'a'));
      counts.shelvesFixed++;
    };
    /* fixed shelf at each joint of 2 boxes; a base carcass has its rails, a fridge carcass its own shelf (below) */
    if (!carcass.base && !carcass.fridge) {
      const drawerAt = h => carcass.boxes.some(b => b.type === 'drawer' && (b.h0 === h || b.h1 === h)) && carcass.boxes.filter(b => b.h0 === h || b.h1 === h).every(b => b.type === 'drawer');
      const joints = [...new Set(carcass.boxes.map(b => b.h0))].filter(joint => joint > h0 && !drawerAt(joint));   // two drawers run one over the other
      for (const joint of joints) {
        const vented = carcass.boxes.some(b => b.h1 === joint && VENTED_SHELF_OVER.includes(b.type));
        const top = carcass.boxes.some(b => b.h0 === joint && SHELF_UNDER_JOINT.includes(b.type)) ? joint : joint + half;
        fixedShelf(top, vented ? settings.shelf.ventGap : 0);
      }
    }
    /* a fridge carcass: its joints are inside the appliance; one fixed shelf right on the appliance top, which is screwed to it;
       shallower to let the air out */
    const fridgeHeight = carcass.fridge && appliances && appliances.fridgeFreezer ? appliances.fridgeFreezer.body.height : null;
    if (fridgeHeight) {
      const top = h0 + board + fridgeHeight + board;
      if (top > h1 - board) warn(`${carcass.name}: the fridge ${fridgeHeight} does not fit the carcass (inside ${height - 2 * board}).`);
      else fixedShelf(top, settings.shelf.ventGap);
    }

    /* a space at one end of a carcass (e.g. the hidden end of an L corner): the carcass runs on behind it, an inset panel
       closes its front; a carcass of spaces only (e.g. a support under a carcass on the worktop): one inset panel over its
       whole inner width; hidden: no edge banding */
    const topThickness = carcass.base && carcass.sink ? crossRails.depth : carcass.base && carcass.hob ? crossRails.hobFront : board;
    const spaces = carcass.members.filter(i => i.type === 'space');
    for (const f of carcass.boxes.length ? spaces : spaces.slice(0, 1)) {
      const atRight = f.x1 === carcass.x1, none = !carcass.boxes.length;
      const s0 = none || !atRight ? innerX0 : Math.max(...carcass.boxes.map(b => b.x1)), s1 = none || atRight ? innerX1 : Math.min(...carcass.boxes.map(b => b.x0));
      part('insetPanel', 'Inset panel', s1 - s0, height - board - topThickness, carcassMaterial, 'carcasses',
        [s0, s1, carcassFront - board, carcassFront, h0 + board, h1 - topThickness]);
    }

    /* an adjustable shelf: one plain board from side to side over the whole carcass (a hinge post, when there is one, crosses it) */
    const adjustableShelf = centre => {
      const shelfWidth = innerWidth - 2 * shelf.clearance, shelfX0 = innerX0 + shelf.clearance;
      part('adjustableShelf', 'Adjustable shelf', shelfWidth, carcassDepth - shelf.setback, carcassMaterial, 'shelves',
        [shelfX0, shelfX0 + shelfWidth, carcassBack, carcassFront - shelf.setback, centre - half, centre + half], frontEdge(shelfWidth, 'a')).centre = centre;
      counts.shelvesAdjustable++;
      counts.shelfPins += PINS_PER_SHELF;
    };
    /* a door with coffee: a pull-out shelf on the board under the door, shelves above it up to the board over the door. The open
       door reaches about as far into the opening as the runner clearance: a spacer on the hinge side carries that runner */
    const addPullOutShelf = (door, lo, hi) => {
      const pullOut = settings.pullOutShelf, shelfH = lo + pullOut.lift;
      let s0 = innerX0, s1 = innerX1;
      if (!reachesHingeSide(door, carcass)) warn(`${placeOf(door)}: coffee machine - the door must reach the carcass side on its hinge side.`, door.index);
      else {
        const spacer = spacerOnHingeSide(carcass, door.hinge), top = shelfH + board + pullOut.spacerAbove;
        part('spacer', 'Spacer', carcassDepth, top - lo, carcassMaterial, 'carcasses',
          [...spacer, carcassBack, carcassFront, lo, top], [{ side: 'front', length: top - lo, along: 'b' }, { side: 'top', length: carcassDepth, along: 'a' }]); // the top is seen above the shelf
        if (door.hinge === 'right') s1 = spacer[0]; else s0 = spacer[1];
      }
      const shelfWidth = s1 - s0 - 2 * pullOut.clearance;
      part('pullOutShelf', 'Pull-out shelf', shelfWidth, pullOut.depth, carcassMaterial, 'shelves',
        [s0 + pullOut.clearance, s1 - pullOut.clearance, carcassFront - pullOut.depth, carcassFront, shelfH, shelfH + board], frontEdge(shelfWidth, 'a')).item = door;
      counts.pullOutShelves++;
      const above = shelfH + board + pullOut.machineHeight;
      for (let j = 0; j < pullOut.shelvesAbove; j++) adjustableShelf(Math.round(above + ((hi - above) * j) / pullOut.shelvesAbove));
    };
    if (shelf.grid && !carcass.sink && !carcass.fridge) {
      /* on the room's grid (settings.shelf.grid): a shelf's top on every line from + k × pitch between the boards above and below
         the module, fixed on every fixedEvery-th line, adjustable on the others; so every shelf of the room is level with its
         neighbours'. The carcass top and the fixed shelves of the joints are on the grid too */
      const { from, pitch, fixedEvery } = shelf.grid, onGrid = top => Number.isInteger((top - from) / pitch), placed = new Set();   // a shelf runs over the whole carcass: one per line
      for (const b of carcass.boxes) {
        if (b.type !== 'cabinet' || hasTag(b, 'doorDrawers', 'coffee')) continue;
        const { bottom: lo, top: hi } = spaceAround(boards, carcass, b.h0, b.h1);
        for (let k = Math.max(1, Math.floor((lo - from) / pitch) + 1); from + k * pitch <= hi; k++) {
          const top = from + k * pitch;
          if (top - board <= lo || placed.has(top)) continue;
          placed.add(top);
          if (k % fixedEvery === 0) fixedShelf(top, 0); else adjustableShelf(top - half);
        }
      }
      if (!onGrid(h1)) warn(`${carcass.name}: the top ${h1} is not on the shelf grid (${from} + k × ${pitch}).`);
      for (const b of boards.filter(p => p.carcassId === carcass.id && p.id === 'fixedShelf' && !onGrid(p.box[5]))) warn(`${carcass.name}: a fixed shelf at ${b.box[5]} is not on the shelf grid (${from} + k × ${pitch}).`);
    } else if (!carcass.sink && !carcass.fridge) {
      /* per door, by its front height (settings.shelf.perDoor), evenly between the boards above and below the door */
      for (const b of carcass.boxes) {
        if (b.type !== 'cabinet' || hasTag(b, 'doorDrawers')) continue; // behind a door with doorDrawers: the drawers, no shelves
        const { bottom: lo, top: hi } = spaceAround(boards, carcass, b.h0, b.h1);
        if (hasTag(b, 'coffee')) { addPullOutShelf(b, lo, hi); continue; }
        const front = frontBox(b), frontHeight = front.h1 - front.h0, count = countByHeight(shelf.perDoor, frontHeight);
        if (count === null) { warn(`${placeOf(b)}: the front height ${frontHeight} is over the last row of settings.shelf.perDoor.`, b.index); continue; }
        for (let j = 1; j <= count; j++) adjustableShelf(Math.round(lo + ((hi - lo) * j) / (count + 1)));
      }
    }
  }

  /* ---- strips (with a back strip outside a carcass), front panels, wall panels, plinths, plasterboard ---- */
  const stripSettings = settings.strip, plasterSettings = settings.plasterboard, stripLacquer = lacquerOf('strip', 'strip');
  for (const groupModel of Object.values(groups)) {
    const { frontFace, plinthFace, panelFace, carcassFront } = groupModel.geometry;
    for (const item of groupModel.items) {
      const { x0, x1, h0, h1 } = item, width = x1 - x0, height = h1 - h0;
      if (item.type === 'strip') {
        strips.push({
          group: groupModel.group, item, material: materialFor.strip, box: [x0, x1, frontFace - stripSettings.depth, frontFace, h0, h1],
          name: (height > width ? 'Front strip ' : 'Horizontal front strip ') + thickness.strip + ' on edge (depth ' + stripSettings.depth + ')',
          a: stripSettings.depth, b: Math.max(width, height),
          lacquer: stripLacquer, lacqueredSides: stripLacquer ? STRIP_LACQUERED_SIDES : []
        });
        if (!item.carcass) {
          /* back strips, cut as the carcasses: an upright strip one per carcass beside it, with a wall bracket at each joint of
             the stack (cut in on site; none on an island); a horizontal strip one per carcass under it; no carcass: one piece */
          const along = height > width, own = carcasses.filter(carcass => carcass.group === groupModel.group);
          const beside = along ? own.filter(carcass => (carcass.x0 === x1 || carcass.x1 === x0) && carcass.h0 < h1 && carcass.h1 > h0) : [];
          const under = along ? [] : own.filter(carcass => carcass.h1 === h0 && carcass.x0 < x1 && carcass.x1 > x0).sort((a, b) => a.x0 - b.x0);
          let spans = along ? [[h0, h1]] : [[x0, x1]]; // [s0, s1] along the strip
          if (under.length) spans = under.map(carcass => [Math.max(x0, carcass.x0), Math.min(x1, carcass.x1)]);
          if (beside.length) {
            const joints = [...new Set(beside.filter(carcass => beside.some(upper => upper.h0 === carcass.h1 && upper.x0 === carcass.x0)).map(carcass => carcass.h1))].sort((a, b) => a - b);
            const ends = [Math.max(h0, Math.min(...beside.map(carcass => carcass.h0))), ...joints, Math.min(h1, Math.max(...beside.map(carcass => carcass.h1)))];
            spans = ends.slice(0, -1).map((a, i) => [a, ends[i + 1]]);
            if (!groupModel.island) counts.wallBrackets += spans.length - 1; // the top strip of a stack has no bracket
            /* the strip and its back strips are screwed to the carcass on one side; the carcass on the other side from inside */
            const length = Ks => Ks.reduce((sum, carcass) => sum + Math.min(carcass.h1, h1) - Math.max(carcass.h0, h0), 0);
            const left = beside.filter(carcass => carcass.x1 === x0), right = beside.filter(carcass => carcass.x0 === x1);
            counts.jointLength.screwed += length(left.length ? left : right);
            if (left.length) counts.jointLength.fromInside += length(right);
          }
          for (const [s0, s1] of spans) {
            boards.push({
              id: 'backStrip', name: 'Back strip ' + stripSettings.depth, a: stripSettings.depth, b: s1 - s0, material: materialFor.carcass, layer: 'carcasses',
              group: groupModel.group, column: item.column, box: along ? [x0, x1, carcassBack, carcassBack + stripSettings.depth, s0, s1] : [s0, s1, carcassBack, carcassBack + stripSettings.depth, h0, h1],
              edges: [] // hidden behind its strip
            });
          }
        }
      } else if (item.type === 'frontPanel') {
        /* an edge shows when the front next to it opens (its neighbour, touching and overlapping, is a front that opens):
           a lacquered material has that edge lacquered, any other gets edge banding there */
        const overlaps = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0;
        const neighbour = {
          top: o => o.h0 === item.h1 && overlaps(o.x0, o.x1, item.x0, item.x1), bottom: o => o.h1 === item.h0 && overlaps(o.x0, o.x1, item.x0, item.x1),
          left: o => o.x1 === item.x0 && overlaps(o.h0, o.h1, item.h0, item.h1), right: o => o.x0 === item.x1 && overlaps(o.h0, o.h1, item.h0, item.h1)
        };
        const seen = SIDES
          .filter(side => groupModel.items.some(other => opens(other) && neighbour[side](other)))
          .map(side => (side === 'top' || side === 'bottom' ? { side, length: width, along: 'a' } : { side, length: height, along: 'b' }));
        const lacquered = Boolean(projectData.materials[materialFor.frontPanel].lacquered);
        const along = size => seen.filter(edge => edge.along === size).length;
        const lacquer = lacquered ? (width >= height ? { long: along('a'), short: along('b') } : { long: along('b'), short: along('a') }) : null;
        frontPanels.push({ group: groupModel.group, item, material: materialFor.frontPanel, name: 'Front panel ' + thickness.frontPanel, a: width, b: height, box: [x0, x1, ...(item.carcass ? [carcassFront, panelFace] : [frontFace - thickness.frontPanel, frontFace]), h0, h1],
          edges: lacquered ? [] : seen, lacquer, lacqueredSides: lacquered ? seen.map(edge => edge.side) : [] });
      } else if (item.type === 'wallPanel') {
        wallPanels.push({ group: groupModel.group, item, material: materialFor.wallPanel, name: 'Wall panel ' + thickness.wallPanel, a: width, b: height, box: [x0, x1, groupModel.wall, groupModel.wall + thickness.wallPanel, h0, h1], edges: [] });
      } else if (item.type === 'plinth') {
        plinths.push({ group: groupModel.group, item, material: materialFor.plinth, a: height, b: width, box: [x0, x1, plinthFace - thickness.plinth, plinthFace, h0, h1], lacquer: lacquerOf('plinth', 'plinth') });
      } else if (item.type === 'plasterboard') {
        /* cladding: the face plus the return along the long side; profiles: UD on both fixed edges, CD on the outer edge + cross pieces */
        const long = Math.max(width, height), short = Math.min(width, height), depth = plasterSettings.depth;
        plaster.push(
          { group: groupModel.group, item, name: 'Plasterboard - face', a: short, b: long },
          { group: groupModel.group, item, name: 'Plasterboard - side', a: depth, b: long }
        );
        counts.plasterUD += 2 * long;
        counts.plasterCD += long + (Math.ceil(long / plasterSettings.studSpacing) + 1) * (depth + short);
        counts.plasterEdge += long; // one outer edge (corner bead) and one joint to the furniture (seal) per box
      }
    }
  }

  /* ---- worktops: at a wall cut at the back to reach the wall; an island keeps the depth of its material ---- */
  for (const groupModel of Object.values(groups)) {
    const { frontFace } = groupModel.geometry;
    const top = groupModel.items.find(i => i.type === 'worktop');
    if (!top) {
      if (groupModel.items.some(i => i.type === 'endPanel')) warn(`Group ${groupModel.group}: end panels with no worktop on top.`);
      continue;
    }
    const use = groupModel.island ? ISLAND_USE : 'worktop', material = materialFor[use], materialDepth = projectData.materials[material].depth ?? projectData.materials[material].width;   // a top cut from a board: as deep as its sheet is wide
    /* every worktop: from worktop.overhang in front of the fronts back to the wall line, the group's backGap behind the carcass backs
       (an island: no wall, only that line); the rest of the board is cut off at the back */
    const y1 = frontFace + settings.worktop.overhang, y0 = groupModel.wall, depth = y1 - y0;
    if (depth > materialDepth) warn(`Group ${groupModel.group}: the worktop is ${depth}, the material ${materials[material].label} is ${materialDepth}.`);
    if (y0 > carcassBack) warn(`Group ${groupModel.group}: the worktop ${depth} does not reach the backs of the carcasses (carcass + front + overhang = ${y1 - carcassBack}).`);
    worktops[groupModel.group] = { y0, y1, depth, back: carcassBack - y0, h0: top.h0, h1: top.h1, use, material, thickness: thickness[use] };
  }

  /* ---- island back panel: panel material, between the end panels (none: the end columns), floor to the carcass tops, on the carcass backs ---- */
  for (const groupModel of Object.values(groups).filter(candidate => candidate.island)) {
    const own = carcasses.filter(carcass => carcass.group === groupModel.group);
    const top = Math.max(0, ...own.map(carcass => carcass.h1));
    const first = Math.min(...own.map(carcass => carcass.x0)), last = Math.max(...own.map(carcass => carcass.x1));
    const endPanels = groupModel.items.filter(i => i.type === 'endPanel');
    const left = endPanels.filter(f => f.x1 <= first), right = endPanels.filter(f => f.x0 >= last);
    const x0 = left.length ? Math.max(...left.map(f => f.x1)) : groupModel.widths[0] || 0;
    const x1 = right.length ? Math.min(...right.map(f => f.x0)) : groupModel.length - (groupModel.widths[groupModel.widths.length - 1] || 0);
    frontPanels.push({
      group: groupModel.group, material: materialFor.frontPanel, name: 'Island back panel ' + thickness.frontPanel, a: x1 - x0, b: top, edges: [],
      box: [x0, x1, carcassBack - thickness.frontPanel, carcassBack, 0, top]
    });
  }

  /* ---- fronts, hinges, hinge posts, drawer boxes ---- */
  const hingeSettings = settings.hinges, drawerSettings = settings.drawers;
  /* height of the shelf-pin holes (their centres) under an adjustable shelf */
  const shelfPinRow = shelfBoard => shelfBoard.centre - half - settings.drilling.shelfPin.belowShelf;
  /* a hinge that meets a shelf (closer than half a board + hinges.aboveShelf to its centre) goes above it: to the lowest height
     at least hinges.aboveShelf over the shelf where its mounting-plate holes miss every shelf-pin hole (settings.drilling) */
  function hingeClearOfShelves(h, carcass, front, item) {
    const plate = settings.drilling.plate, pin = settings.drilling.shelfPin, { carcassDepth } = geometryOf(carcass.group);
    const centreOf = b => (b.box[4] + b.box[5]) / 2;
    const inDoor = b => b.carcassId === carcass.id && centreOf(b) > front.h0 && centreOf(b) < front.h1;
    const shelves = boards.filter(b => inDoor(b) && (b.id === 'adjustableShelf' || b.id === 'pullOutShelf' || b.id === 'fixedShelf')).map(centreOf);
    const reach = half + hingeSettings.aboveShelf;
    const hit = shelves.find(c => Math.abs(h - c) < reach);
    if (hit === undefined) return h;
    /* shelf-pin holes on the same face (only adjustable shelves have pins); centre distance as the overlap check */
    const pins = boards.filter(b => inDoor(b) && b.id === 'adjustableShelf').map(shelfPinRow)
      .flatMap(py => [pin.fromFront, carcassDepth - pin.fromBack].map(px => ({ x: px, y: py })));
    const minDistance = (plate.diameter + pin.diameter) / 2 + 1;
    const clear = hinge => shelves.every(c => Math.abs(hinge - c) >= reach) &&
      [hinge - plate.spacing / 2, hinge + plate.spacing / 2].every(py => pins.every(p => Math.hypot(p.x - plate.fromFront, p.y - py) >= minDistance));
    let hinge = Math.ceil(hit + reach);
    while (!clear(hinge) && hinge < front.h1) hinge++;
    if (hinge > front.h1 - hingeSettings.fromEnd / 2) warn(`${placeOf(item)}: the hinge above the shelf is beyond the door - move the shelf.`, item.index);
    return hinge;
  }
  /* drawers behind a door (tag doorDrawers): the hinges take hinges.postDepth at the carcass front, so the spacer and the boxes
     stop there; the box front covers the ends of the sides and of the bottom */
  function addDoorDrawers(item, front, carcass) {
    const doorDrawerSettings = settings.doorDrawers, t = thickness.drawerBox, at = placeOf(item), { carcassFront } = geometryOf(carcass.group);
    if (!reachesHingeSide(item, carcass)) return warn(`${at}: drawers behind the door - the door must reach the carcass side on its hinge side.`, item.index);
    const count = doorDrawerSettings.count;
    const y1 = carcassFront - hingeSettings.postDepth, length = Math.max(...doorDrawerSettings.runnerLengths.filter(l => l <= y1 - carcassBack));
    if (!Number.isFinite(length)) return warn(`${at}: no runner of settings.doorDrawers.runnerLengths fits in ${y1 - carcassBack}.`, item.index);
    const { bottom: lo, top: hi } = spaceAround(boards, carcass, item.h0, item.h1);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return warn(`${at}: drawers behind the door - no horizontal board above or below the door.`, item.index);
    const innerX0 = carcass.x0 + board, innerX1 = carcass.x1 - board, right = item.hinge === 'right';
    const spacer = spacerOnHingeSide(carcass, item.hinge);
    boards.push({ id: 'spacer', name: 'Spacer', a: y1 - carcassBack, b: hi - lo, material: materialFor.carcass, layer: 'carcasses', group: carcass.group, carcassId: carcass.id,
      box: [...spacer, carcassBack, y1, lo, hi], edges: [{ side: 'front', length: hi - lo, along: 'b' }] });
    const x0 = (right ? innerX0 : spacer[1]) + doorDrawerSettings.clearance, x1 = (right ? spacer[0] : innerX1) - doorDrawerSettings.clearance, y0 = y1 - length, pitch = (hi - lo) / count;
    front.doorDrawers = { count, runnerLength: length, boxWidth: x1 - x0, boxHeight: t + doorDrawerSettings.sideHeight, boxes: [] }; // the runner length is the box depth
    for (let j = 0; j < count; j++) {
      const h = Math.round(lo + doorDrawerSettings.lift + j * pitch), top = h + t + doorDrawerSettings.sideHeight, next = j + 1 < count ? Math.round(lo + doorDrawerSettings.lift + (j + 1) * pitch) : hi;
      if (top > next) warn(`${at}: drawer behind the door ${j + 1} (${t + doorDrawerSettings.sideHeight}) does not fit under the next board.`, item.index);
      const common = { material: materialFor.drawerBox, layer: 'drawers', group: carcass.group, carcassId: carcass.id, frontId: front.id, doorDrawer: j }, inner = length - t;
      boards.push({ id: 'doorDrawerFront', name: 'Front of a drawer behind the door', a: x1 - x0, b: t + doorDrawerSettings.sideHeight, ...common, box: [x0, x1, y1 - t, y1, h, top],
        edges: [{ side: 'left', length: t + doorDrawerSettings.sideHeight, along: 'b' }, { side: 'right', length: t + doorDrawerSettings.sideHeight, along: 'b' }] });
      boards.push({ id: 'doorDrawerBottom', name: 'Bottom of a drawer behind the door', a: x1 - x0 - 2 * t, b: inner, ...common, box: [x0 + t, x1 - t, y0, y1 - t, h, h + t], edges: [] });
      for (const s of [x0, x1 - t]) boards.push({ id: 'doorDrawerSide', name: 'Side of a drawer behind the door', a: inner, b: t + doorDrawerSettings.sideHeight, ...common, box: [s, s + t, y0, y1 - t, h, top], edges: [] });
      boards.push({ id: 'doorDrawerBack', name: 'Back of a drawer behind the door', a: x1 - x0 - 2 * t, b: doorDrawerSettings.sideHeight, ...common, box: [x0 + t, x1 - t, y0, y0 + t, h + t, top], edges: [] });
      front.doorDrawers.boxes.push({ x0, x1, h0: h, h1: top, y0, y1 });
    }
    counts.doorDrawers += count;
  }
  /* a drawer of board (settings.drawers.box 'board'): a box of drawerBox board on ball runners, as long as the longest runner that
     fits (drawers.board.runnerLengths, the carcass depth less setback at the front and backClearance behind), its front setback
     behind the carcass front; the bottom under the sides, the box's front and back between them; lift over the board under it */
  function addBoardDrawer(item, front, carcass) {
    const D = settings.drawers.board, t = thickness.drawerBox, { carcassFront, carcassDepth } = geometryOf(carcass.group), at = placeOf(item);
    const length = Math.max(...D.runnerLengths.filter(l => l <= carcassDepth - D.setback - D.backClearance));
    if (!Number.isFinite(length)) return warn(`${at}: no runner of settings.drawers.board.runnerLengths fits in the carcass depth ${carcassDepth}.`, item.index);
    const innerX0 = carcass.x0 + board, innerX1 = carcass.x1 - board, x0 = innerX0 + D.clearance, x1 = innerX1 - D.clearance, y1 = carcassFront - D.setback, y0 = y1 - length;
    const h = item.h0 + (item.h0 === carcass.h0 ? board : 0) + D.lift, top = h + t + D.sideHeight;
    const above = spaceAround(boards, carcass, item.h0, item.h1).top;
    if (top > above) warn(`${at}: the drawer box reaches ${top}, the board above it starts at ${above}.`, item.index);
    const common = { material: materialFor.drawerBox, layer: 'drawers', group: carcass.group, carcassId: carcass.id, frontId: front.id };
    /* an open drawer shows the front ends of its bottom and of its sides: banded (behind a front they are hidden) */
    const seen = (length, along) => (front.open ? [{ side: 'front', length, along }] : []);
    boards.push({ id: 'drawerBottom', name: 'Drawer bottom', a: x1 - x0, b: length, ...common, box: [x0, x1, y0, y1, h, h + t], edges: seen(x1 - x0, 'a') });
    for (const s of [x0, x1 - t]) boards.push({ id: 'drawerSide', name: 'Drawer side', a: length, b: D.sideHeight, ...common, box: [s, s + t, y0, y1, h + t, top], edges: seen(D.sideHeight, 'b') });
    for (const [b0, b1] of [[y1 - t, y1], [y0, y0 + t]]) boards.push({ id: 'drawerEnd', name: 'Drawer front and back', a: x1 - x0 - 2 * t, b: D.sideHeight, ...common, box: [x0 + t, x1 - t, b0, b1, h + t, top], edges: [] });
    front.drawer = { board: true, runnerLength: length, innerX0, innerX1, x0, x1, y0, y1, bottomH: h, top, boxWidth: x1 - x0, boxHeight: t + D.sideHeight };
    counts.boardDrawers = (counts.boardDrawers || 0) + 1;
    (counts.runners || (counts.runners = {}))[length] = (counts.runners[length] || 0) + 1;
  }
  for (const groupModel of Object.values(groups)) {
    const { carcassFront } = groupModel.geometry;
    for (const item of groupModel.items) {
      if (!FRONT_TYPES.includes(item.type) || (isOpen(item) && item.type === 'cabinet')) continue;   // open shelves: no front
      const open = isOpen(item), box = open ? { x0: item.x0, x1: item.x1, h0: item.h0, h1: item.h1 } : frontBox(item);
      const carcass = carcassOf(item), opening = openingOf(item), hinged = HINGED.includes(opening);
      if (box.x1 - box.x0 <= 0 || box.h1 - box.h0 <= 0) warn(`${placeOf(item)}: the gaps leave no front.`, item.index);
      /* hinges are screwed to a carcass side: a door that does not reach one gets a hinge post (an appliance front has no hinges) */
      if (opening === 'door' && carcass && item.hinge && HINGE_SIDES.includes(item.hinge) && !reachesHingeSide(item, carcass)) {
        const postX0 = item.hinge === 'left' ? item.x0 : item.x1 - board, postH0 = Math.max(item.h0, carcass.h0 + board), postH1 = Math.min(item.h1, carcass.h1 - board);
        boards.push({
          id: 'hingePost', name: 'Hinge post', a: hingeSettings.postDepth, b: postH1 - postH0, material: materialFor.carcass, layer: 'carcasses', group: groupModel.group, carcassId: carcass.id,
          box: [postX0, postX0 + board, carcassFront - hingeSettings.postDepth, carcassFront, postH0, postH1], edges: [{ side: 'front', length: postH1 - postH0, along: 'b' }], hand: item.hinge
        });
      }
      /* an open drawer is a front without a panel: its box is what is seen and what moves */
      /** @type {Front} */
      const front = {
        id: fronts.length + 1, group: groupModel.group, item, carcassId: carcass ? carcass.id : null, opening, tags: item.tags, gaps: item.gaps,
        ...box, width: box.x1 - box.x0, height: box.h1 - box.h0, handle: item.handle, hand: hinged ? item.hinge : '', material: open ? null : materialFor[item.type],
        lacquer: open ? null : lacquerOf('front', item.type), open
      };
      if (!open && !front.lacquer) front.edges = SIDES.map(side => ({ side, length: side === 'top' || side === 'bottom' ? front.width : front.height, along: side === 'top' || side === 'bottom' ? 'a' : 'b' }));   // a board front: banded all round
      item.front = front;
      fronts.push(front);
      if (!open) counts.fronts++;
      if (item.handle) counts.handles++;

      if (opening === 'door' && carcass) {
        const count = countByHeight(hingeSettings.perDoor, front.height);
        if (count === null) warn(`${placeOf(item)}: the front height ${front.height} is over the last row of settings.hinges.perDoor.`, item.index);
        else {
          front.hinges = Array.from({ length: count }, (_, j) => Math.round(front.h0 + hingeSettings.fromEnd + ((front.height - 2 * hingeSettings.fromEnd) * j) / (count - 1)))
            .map(h => hingeClearOfShelves(h, carcass, front, item));
          front.hingeX = front.hand === 'right' ? item.x1 - board : item.x0 + board; // on the carcass side or the hinge post
          counts.hinges += count;
        }
      }

      if (opening === 'door' && carcass && hasTag(item, 'doorDrawers')) addDoorDrawers(item, front, carcass);

      if (opening === 'drawer' && carcass && boardDrawers) addBoardDrawer(item, front, carcass);
      else if (opening === 'drawer' && carcass) {
        const size = front.height > drawerSettings.D.frontAbove ? 'D' : 'M', sizeSettings = drawerSettings[size];
        const innerX0 = carcass.x0 + board, innerX1 = carcass.x1 - board;
        const drawer = {
          size,
          sideHeight: sizeSettings.sideHeight,
          backHeight: sizeSettings.backHeight,
          innerX0,
          innerX1,
          bottomWidth: innerX1 - innerX0 - drawerSettings.bottom.inset,
          bottomH: item.h0 + (item.h0 === carcass.h0 ? drawerSettings.liftAtBottom : drawerSettings.liftAbove),
          bins: hasTag(item, 'bins'),
          inner: hasTag(item, 'innerDrawer')
        };
        front.drawer = drawer;
        const bottomX0 = innerX0 + drawerSettings.bottom.inset / 2, bottomX1 = innerX1 - drawerSettings.bottom.inset / 2;
        const backX0 = innerX0 + drawerSettings.back.inset / 2, backX1 = innerX1 - drawerSettings.back.inset / 2;
        const y0 = carcassBack + drawerSettings.bottom.fromBack, y1 = y0 + drawerSettings.bottom.depth, t = thickness.drawerBox;
        const drawerBoards = (h, backHeight, backName, inner) => {
          const common = { material: materialFor.drawerBox, layer: 'drawers', group: groupModel.group, carcassId: carcass.id, frontId: front.id, inner };
          boards.push({ id: 'drawerBottom', name: 'Drawer bottom', a: drawer.bottomWidth, b: drawerSettings.bottom.depth, ...common, box: [bottomX0, bottomX1, y0, y1, h, h + t] });
          boards.push({ id: 'drawerBack', name: backName, a: innerX1 - innerX0 - drawerSettings.back.inset, b: backHeight, ...common, box: [backX0, backX1, y0, y0 + t, h + t, h + t + backHeight] });
        };
        drawerBoards(drawer.bottomH, drawer.backHeight, 'Drawer back ' + size, false);
        if (size === 'D') counts.drawersD++;
        else counts.drawersM++;
        if (drawer.inner) {
          drawer.innerH = drawer.bottomH + drawer.sideHeight + drawerSettings.inner.gap;
          drawerBoards(drawer.innerH, drawerSettings.inner.backHeight, 'Inner drawer back', true);
          counts.innerDrawers++;
          const innerTop = drawer.innerH + Math.max(t + drawerSettings.inner.backHeight, drawerSettings.M.sideHeight);
          const boardAbove = spaceAround(boards, carcass, item.h0, item.h1).top;
          if (innerTop > boardAbove) warn(`${placeOf(item)}: the inner drawer reaches ${innerTop}, the board above it starts at ${boardAbove}.`, item.index);
        }
      }
    }
  }

  /* ---- holes: hinge cups in the doors, mounting plates, bumpers and shelf pins in the carcass sides and hinge posts ----
     a hole: kind, diameter, depth, x / y on the part (from the edges in part.holeFrom), at: [x, y, h] of its centre on the drilled face,
     axis it is drilled along and dir (+1 / -1) into the part */
  const drill = settings.drilling;
  const holeAt = (part, hole) => {
    (part.holes || (part.holes = [])).push(hole);
    return hole;
  };
  for (const carcass of carcasses) {
    const { carcassDepth, carcassFront, frontFace } = geometryOf(carcass.group);
    const own = boards.filter(b => b.carcassId === carcass.id);
    /* horizontal boards of the carcass: a shelf pin must not land in one */
    const bands = horizontalBands(boards, carcass);
    const faceBoard = x => own.find(b => (b.id === 'side' || b.id === 'hingePost') && (b.box[0] === x || b.box[1] === x));
    /* mounting plates: on the side or hinge post at the hinge edge of each door, plate.spacing apart around each hinge */
    for (const front of fronts.filter(f => f.carcassId === carcass.id && f.hinges)) {
      const target = faceBoard(front.hingeX);
      if (!target) { warn(`${carcass.name}: no side or post for the hinges of the front ${placeOf(front.item)}.`); continue; }
      target.holeFrom = { x: 'front', y: 'bottom' };
      const dir = target.box[1] === front.hingeX ? -1 : 1; // drilled from the face towards the inside of the board
      for (const h of front.hinges) {
        for (const dh of [-drill.plate.spacing / 2, drill.plate.spacing / 2]) {
          holeAt(target, { kind: 'plate', diameter: drill.plate.diameter, depth: drill.plate.depth, x: drill.plate.fromFront, y: h + dh - target.box[4],
            at: [front.hingeX, carcassFront - drill.plate.fromFront, h + dh], axis: 'x', dir });
        }
      }
      front.holeFrom = { x: 'hinge', y: 'bottom' };
      const cupX = front.hand === 'left' ? front.x0 + drill.cup.fromEdge : front.x1 - drill.cup.fromEdge;
      for (const h of front.hinges) {
        holeAt(front, { kind: 'cup', diameter: drill.cup.diameter, depth: drill.cup.depth, x: drill.cup.fromEdge, y: h - front.h0,
          at: [cupX, frontFace - frontThickness, h], axis: 'y', dir: 1 });
      }
    }
    /* bumpers: one opposite each hinge, at its height, pressed into the front edge of the side (or hinge post) under the other edge of
       the door, in the middle of its thickness; they keep the front gap (carcass.frontGap) there and stay with the carcass.
       A hole in an edge: x from the board bottom (hole.from), y 0 */
    for (const front of fronts.filter(f => f.carcassId === carcass.id && f.hinges)) {
      const otherEdge = front.hand === 'left' ? front.x1 : front.x0, bumper = drill.bumper, hingeBoard = faceBoard(front.hingeX);
      const side = own.filter(b => (b.id === 'side' || b.id === 'hingePost') && b !== hingeBoard && b.box[3] === carcassFront && b.box[0] < front.x1 && b.box[1] > front.x0)
        .sort((p, q) => Math.abs((p.box[0] + p.box[1]) / 2 - otherEdge) - Math.abs((q.box[0] + q.box[1]) / 2 - otherEdge))[0];
      /* a door of a pair meets its other leaf there: no bumpers (the pair closes on itself) */
      const pair = fronts.some(o => o !== front && o.carcassId === carcass.id && o.hinges && (front.hand === 'left' ? o.item.x0 === front.item.x1 : o.item.x1 === front.item.x0) && o.h0 < front.h1 && o.h1 > front.h0);
      if (!side && pair) continue;
      if (!side) { warn(`${carcass.name}: no side for the bumpers of the front ${placeOf(front.item)} (opposite the hinges).`); continue; }
      const x = (side.box[0] + side.box[1]) / 2;
      side.holeFrom = side.holeFrom || { x: 'front', y: 'bottom' };
      front.bumpers = front.hinges.map(h => ({ x, h }));
      for (const h of front.hinges) {
        holeAt(side, { kind: 'bumper', diameter: bumper.diameter, depth: bumper.depth, x: h - side.box[4], y: 0, from: 'bottom', at: [x, carcassFront, h], axis: 'y', dir: -1 });
      }
      counts.bumpers += front.bumpers.length;
    }
    const pin = drill.shelfPin, sides = own.filter(b => b.id === 'side');
    for (const shelfBoard of own.filter(b => b.id === 'adjustableShelf')) {
      const rowH = shelfPinRow(shelfBoard);
      for (const side of sides) {
        side.holeFrom = { x: 'front', y: 'bottom' };
        const inner = side.box[0] === carcass.x0 ? side.box[1] : side.box[0], dir = side.box[0] === carcass.x0 ? -1 : 1;
        for (const px of [pin.fromFront, carcassDepth - pin.fromBack]) {
          holeAt(side, { kind: 'shelfPin', diameter: pin.diameter, depth: pin.depth, x: px, y: rowH - side.box[4], at: [inner, carcassFront - px, rowH], axis: 'x', dir });
        }
      }
    }
    /* drawer runners (and the pull-out shelf runners): in both sides, runner.belowDrawer under the drawer bottom, at runner.fromFront */
    const runner = drill.runner;
    const runnerRows = [
      ...fronts.filter(f => f.carcassId === carcass.id && f.drawer && !f.drawer.board).flatMap(f => [f.drawer.bottomH, ...(f.drawer.inner ? [f.drawer.innerH] : [])]),
      ...own.filter(b => b.id === 'pullOutShelf').map(b => b.box[4])
    ];
    /* a spacer on a side (next to the pull-out shelf) carries the runner instead of that side */
    const spacers = own.filter(b => b.id === 'spacer');
    for (const bottom of runnerRows) {
      for (const side of sides) {
        const left = side.box[0] === carcass.x0, runnerH = bottom - runner.belowDrawer;
        const target = spacers.find(s => (left ? s.box[0] === side.box[1] : s.box[1] === side.box[0]) && runnerH > s.box[4] && runnerH < s.box[5]) || side;
        target.holeFrom = { x: 'front', y: 'bottom' };
        const inner = left ? target.box[1] : target.box[0], dir = left ? -1 : 1;
        for (const px of runner.fromFront) holeAt(target, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x: px, y: runnerH - target.box[4], at: [inner, carcassFront - px, runnerH], axis: 'x', dir });
      }
    }
    /* ball runners of the drawers of board: in both carcass sides, as the drawers behind a door */
    for (const front of fronts.filter(f => f.carcassId === carcass.id && f.drawer && f.drawer.board)) {
      const box = front.drawer, runnerH = box.bottomH + drill.ballRunner.aboveBottom;
      for (const side of sides) {
        side.holeFrom = { x: 'front', y: 'bottom' };
        const left = side.box[0] === carcass.x0, inner = left ? side.box[1] : side.box[0], dir = left ? -1 : 1;
        for (const p of drill.ballRunner.fromFront.filter(p => p < box.runnerLength)) {   // the runner's own screw holes
          const y = box.y1 - p;
          holeAt(side, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x: side.box[3] - y, y: runnerH - side.box[4], at: [inner, y, runnerH], axis: 'x', dir });
        }
      }
    }
    /* ball runners of the drawers behind a door (tag doorDrawers): on the spacer (hinge side) and on the carcass side opposite,
       drilling.ballRunner.fromFront from the runner front, drilling.ballRunner.aboveBottom above the box bottom; diameter and depth of drilling.runner */
    const ballRunner = drill.ballRunner;
    for (const front of fronts.filter(f => f.carcassId === carcass.id && f.doorDrawers)) {
      const right = front.hand === 'right';
      for (const box of front.doorDrawers.boxes) {
        const runnerH = box.h0 + ballRunner.aboveBottom;
        const spacer = own.find(b => b.id === 'spacer' && b.box[4] <= runnerH && b.box[5] >= runnerH && (right ? b.box[0] >= box.x1 : b.box[1] <= box.x0));
        const side = sides.find(b => (right ? b.box[0] === carcass.x0 : b.box[1] === carcass.x1));
        for (const target of /** @type {Board[]} */ ([spacer, side].filter(Boolean))) {
          target.holeFrom = { x: 'front', y: 'bottom' };
          const atRight = target.box[0] >= box.x1, inner = atRight ? target.box[0] : target.box[1], dir = atRight ? 1 : -1;
          for (const p of ballRunner.fromFront) {
            const y = box.y1 - p;
            holeAt(target, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x: target.box[3] - y, y: runnerH - target.box[4], at: [inner, y, runnerH], axis: 'x', dir });
          }
        }
      }
    }
    /* holes too close on one face of one part (once per pair of kinds and part); a hole in a horizontal board (once per kind and carcass) */
    const boardHits = new Set();
    for (const b of own.filter(b => b.holes)) {
      if (!b.holes) continue;
      b.holes.sort((hole, g) => hole.y - g.y || hole.x - g.x);
      const near = (hole, g) => Math.hypot(g.x - hole.x, g.y - hole.y) < (g.diameter + hole.diameter) / 2 + 1;
      /* a hole in a side or a hinge post must not land where a horizontal board meets it */
      const inBoard = b.holes.find(hole => hole.axis === 'x' && bands.some(([b0, b1]) => hole.at[2] + hole.diameter / 2 > b0 && hole.at[2] - hole.diameter / 2 < b1));
      if (inBoard && !boardHits.has(inBoard.kind)) {
        boardHits.add(inBoard.kind);
        warn(`${carcass.name}: ${b.name.toLowerCase()} - a ${LABELS.hole[inBoard.kind]} hits a horizontal board (${inBoard.x} from the front, ${Math.round(inBoard.y)} from the bottom): check the settings drilling.`);
      }
      const pairsMet = new Set();
      const holes = b.holes;
      holes.forEach((hole, i) => {
        for (const g of holes.slice(i + 1).filter(g => near(hole, g))) {
          if (pairsMet.has(hole.kind + '|' + g.kind)) continue;
          pairsMet.add(hole.kind + '|' + g.kind);
          warn(`${carcass.name}: ${b.name.toLowerCase()} - a ${LABELS.hole[hole.kind]} and a ${LABELS.hole[g.kind]} in the same place (${hole.x} from the front, ${Math.round(hole.y)} from the bottom): move the shelf or the hinge.`);
        }
      });
    }
  }

  /* ---- appliances in their places: item.fit, shown by info.js (notes) and drawn by index.html ----
     every fit has the body, centred on its module or carcass: {bodyU0, bodyU1, bodyV0, bodyV1}; an oven or a microwave stands on its feet
     (appliances of the cabinets file) on the board under its module: + {feet, fasciaV0, fasciaV1}; a fridge stands on the carcass bottom, one fit on both
     its fronts; a dishwasher stands on the floor on its feet, up to the worktop: + {feet, doorV0, doorV1} */
  const bodyAcross = (place, appliance) => { const centre = (place.x0 + place.x1) / 2; return { bodyX0: centre - appliance.body.width / 2, bodyX1: centre + appliance.body.width / 2 }; };
  function fitAppliances(applianceData) {
    for (const groupModel of Object.values(groups)) {
      for (const item of groupModel.items) {
        if ((item.type === 'oven' || item.type === 'microwave') && applianceData[item.type] && item.carcassId) {
          const a = applianceData[item.type];
          const floor = spaceAround(boards, carcassOf(item), item.h0, item.h1).bottom;
          if (!Number.isFinite(floor)) { warn(`${placeOf(item)}: the ${typeLabel(item.type)} has no board under it.`, item.index); continue; }
          const bodyH0 = floor + a.feet, fasciaH0 = bodyH0 + a.fascia.bottom;
          item.fit = { ...bodyAcross(item, a), bodyH0, bodyH1: bodyH0 + a.body.height, feet: a.feet, fasciaH0, fasciaH1: fasciaH0 + a.fascia.height };
        }
        if (hasTag(item, 'dishwasher') && applianceData.dishwasher && worktops[groupModel.group]) {
          const a = applianceData.dishwasher, bodyH1 = a.feet + a.body.height;
          if (bodyH1 !== worktops[groupModel.group].h0) warn(`${placeOf(item)}: the dishwasher on its feet is ${bodyH1}, the underside of the worktop is at ${worktops[groupModel.group].h0}.`, item.index);
          item.fit = { ...bodyAcross(item, a), bodyH0: a.feet, bodyH1, feet: a.feet, doorH0: bodyH1 - a.door.height, doorH1: bodyH1 };
        }
      }
    }
    /* one fit for the fridge and the freezer front of a fridge carcass */
    for (const carcass of carcasses.filter(candidate => candidate.fridge && applianceData.fridgeFreezer)) {
      const a = applianceData.fridgeFreezer, bodyH0 = carcass.h0 + board;
      const fit = { ...bodyAcross(carcass, a), bodyH0, bodyH1: bodyH0 + a.body.height };
      for (const item of carcass.boxes.filter(b => hasTag(b, 'fridge', 'freezer'))) item.fit = fit;
    }
  }

  /* ---- worktop pieces and their cut-outs (sink, hob): settings.cutouts[flag], centred on the carcass, fromBack from the worktop back edge ---- */
  const worktopPieces = /** @type {Object<string, any>[]} */ ([]);
  for (const groupModel of Object.values(groups)) {
    const worktop = worktops[groupModel.group];
    if (!worktop) continue;
    /* finished where an edge is seen: edge banding, unless the material comes with that edge (factoryEdges); cut-outs stay bare */
    const items = groupModel.items.filter(i => i.type === 'worktop' || i.type === 'endPanel'), endPanels = items.filter(i => i.type === 'endPanel');
    /* a worktop end is seen over an end panel at that end: nothing but spaces between them (the space = the worktop overhanging the panel) */
    const onlySpaces = (a, b) => groupModel.items.every(i => i.type === 'space' || i.x1 <= a || i.x0 >= b || i.h0 >= worktop.h0);
    const endPanelAt = {
      left: item => endPanels.some(f => f.x0 >= item.x0 && onlySpaces(item.x0, f.x0)),
      right: item => endPanels.some(f => f.x1 <= item.x1 && onlySpaces(f.x1, item.x1))
    };
    /* an end panel stands worktop.endPanelOverhang behind the worktop front (and its back on an island): the joint stays hidden */
    const endPanelY0 = worktop.y0 + (groupModel.island ? settings.worktop.endPanelOverhang : 0), endPanelY1 = worktop.y1 - settings.worktop.endPanelOverhang;
    for (const item of items) {
      const endPanel = item.type === 'endPanel', length = endPanel ? item.h1 - item.h0 : item.x1 - item.x0;
      const material = endPanel ? materialFor[groupModel.island ? ISLAND_END_PANEL_USE : 'endPanel'] : worktop.material;
      const y0 = endPanel ? endPanelY0 : worktop.y0, y1 = endPanel ? endPanelY1 : worktop.y1, depth = y1 - y0;
      const materialDepth = projectData.materials[material].depth ?? projectData.materials[material].width;
      if (endPanel && materialDepth < depth) warn(`${placeOf(item)}: the end panel is ${depth} deep, the material ${materials[material].label} is ${materialDepth}.`, item.index);
      const seen = [{ side: 'front', length, along: 'a' }];
      if (groupModel.island) seen.push({ side: 'back', length, along: 'a' });
      if (!endPanel) for (const side of ['left', 'right']) if (endPanelAt[side](item) || hasTag(item, 'banded')) seen.push({ side, length: depth, along: 'b' });
      if (!endPanel && hasTag(item, 'banded') && !groupModel.island) seen.push({ side: 'back', length, along: 'a' });   // banded all round (a top of board in a wet room)
      const factory = projectData.materials[material].factoryEdges || [];
      worktopPieces.push({
        group: groupModel.group, item, name: endPanel ? 'End panel' : 'Worktop', material, a: length, b: depth, y0, y1,
        edges: seen.filter(edge => !factory.includes(edge.side)), factoryEdges: seen.map(edge => edge.side).filter(side => factory.includes(side))
      });
    }
    worktop.cutouts = [];
  }
  for (const carcass of carcasses.filter(candidate => candidate.base)) {
    const { carcassFront } = geometryOf(carcass.group);
    for (const flag of CUTOUT_FLAGS.filter(f => carcass[f])) {
      const cut = (settings.cutouts || {})[flag], worktop = worktops[carcass.group];
      if (!cut) { warn(`${carcass.name}: no cut-out sizes in settings.cutouts.${flag}.`); continue; }
      if (!worktop) continue;
      const centre = (carcass.x0 + carcass.x1) / 2;
      if (cut.holes) {                       // round holes (a basin on the top): each from the carcass's centre and the worktop's back edge
        const piece = worktopPieces.find(p => p.group === carcass.group && p.item.type === 'worktop' && p.item.x0 <= centre && p.item.x1 >= centre);
        if (!piece) { warn(`${carcass.name}: no worktop over it for the ${LABELS.hole[flag]}.`); continue; }
        for (const h of cut.holes) {
          const x = centre + h.along, y = worktop.y0 + h.fromBack, r = h.diameter / 2;
          const cutout = { kind: flag, round: true, width: h.diameter, depth: h.diameter, x0: x - r, x1: x + r, y0: y - r, y1: y + r, x: x - piece.item.x0, y: h.fromBack, carcassId: carcass.id };
          worktop.cutouts.push(cutout);
          piece.holeFrom = { x: 'left', y: 'back' };
          (piece.cutouts || (piece.cutouts = [])).push(cutout);
        }
        continue;
      }
      const x0 = centre - cut.width / 2, x1 = centre + cut.width / 2, y0 = worktop.y0 + cut.fromBack, y1 = y0 + cut.depth;
      const piece = worktopPieces.find(p => p.group === carcass.group && p.item.type === 'worktop' && p.item.x0 <= x0 && p.item.x1 >= x1);
      if (!piece) { warn(`${carcass.name}: the cut-out (${LABELS.hole[flag]}) does not fit in one worktop.`); continue; }
      if (x0 < carcass.x0 + board || x1 > carcass.x1 - board) warn(`${carcass.name}: the ${LABELS.hole[flag]} ${cut.width} is wider than the inside of the carcass ${carcass.x1 - carcass.x0 - 2 * board}.`);
      if (y0 < carcassBack + board || y1 > carcassFront - board) warn(`${carcass.name}: the ${LABELS.hole[flag]} ${cut.depth} goes beyond the inside of the carcass in depth (${y0}–${y1}, inside ${carcassBack + board}–${carcassFront - board}).`);
      const cutout = { kind: flag, width: cut.width, depth: cut.depth, x0, x1, y0, y1, x: x0 - piece.item.x0, y: cut.fromBack, carcassId: carcass.id };
      worktop.cutouts.push(cutout);
      piece.holeFrom = { x: 'left', y: 'back' };
      (piece.cutouts || (piece.cutouts = [])).push(cutout);
    }
  }

  if (appliances) fitAppliances(appliances);

  /* the edges seen as a part slides out: every board of a drawer (a system drawer's, one behind a door) and of a pull-out
     shelf has its top edge banded, unless its top is one of its faces (a bottom, the shelf) */
  for (const b of boards) {
    if (b.frontId === undefined && b.id !== 'pullOutShelf') continue;
    const size = [0, 1, 2].map(k => b.box[2 * k + 1] - b.box[2 * k]), thin = size.indexOf(Math.min(...size));
    if (thin === 2 || (b.edges || []).some(e => e.side === 'top')) continue;
    const length = Math.round(thin === 0 ? size[1] : size[0]);
    (b.edges = b.edges || []).unshift({ side: 'top', length, along: Math.abs(b.a - length) < 0.5 ? 'a' : 'b' });
  }
  return {
    settings, warnings: issues.map(issue => issue.text), issues, counts, thickness, materials, materialFor, frontThickness, worktopPieces,
    carcassBack, geometryOf, // y: from the carcass backs; each group's depth and planes (groups[g].geometry)
    groups, carcasses, fronts, boards, strips, plinths, frontPanels, wallPanels, plaster, worktops
  };
}

/* ================= 6. LISTS AND FILES ================= */

/* parts with the same name, size, banded edges and lacquer counted together, one row each: the holes are drilled by hand on site, so
   left and right parts and parts drilled differently share a row (one label) and the row lists where to drill each of them:
     {name, a, b, qty, where, edges, lacquer, drillings, key}
     where = their "at" labels, e.g. "K2, K5 ×2"; edges = banded edges of one part [{side, length, along}]; lacquer = {long, short} lacquered
     edges or null; drillings = [{drilling, qty}]: each drilling (drillingOf) with the number of parts that have it, left parts first;
     key = cutKey (the same parts listed elsewhere, e.g. per carcass, find their row by it) */
function cutList(parts) {
  const rows = new Map();
  for (const p of parts) {
    const key = cutKey(p);
    const row = rows.get(key) || { part: p, qty: 0, at: new Map(), drillings: new Map() };
    row.qty++;
    if (p.at) row.at.set(p.at, (row.at.get(p.at) || 0) + 1);
    const drilling = drillingOf(p), drillingKey = JSON.stringify(drilling);
    if (drilling) row.drillings.set(drillingKey, { drilling, qty: (row.drillings.has(drillingKey) ? row.drillings.get(drillingKey).qty : 0) + 1 });
    rows.set(key, row);
  }
  const handOrder = d => ({ left: 0, right: 1 }[d.drilling.hand] ?? 2);
  return [...rows].map(([key, { part, qty, at, drillings }]) => {
    const where = [...at].map(([label, y]) => (y > 1 ? label + ' ×' + y : label)).join(', ');
    return { name: part.name, a: part.a, b: part.b, qty, where, edges: part.edges || [], lacquer: part.lacquer || null,
      drillings: [...drillings.values()].sort((p, q) => handOrder(p) - handOrder(q)), key };
  });
}
const cutKey = p => [p.name, p.a, p.b, JSON.stringify(p.edges || []), JSON.stringify(p.lacquer || null)].join('|');

/* where to drill or cut one part, in part coordinates: {from: {x, y}, hand, holes: [{kind, diameter, depth, x, y}], cutouts: [{kind, width, depth, x, y}]}
   or null; hand (left | right) tells a left part from a right one with the same pattern (sides, hinge posts, doors) */
function drillingOf(part) {
  if (!part.holes && !part.cutouts) return null;
  const r = value => Math.round(value * 10) / 10;
  return {
    from: part.holeFrom,
    hand: part.hand || '',
    holes: (part.holes || []).map(hole => ({ kind: hole.kind, diameter: hole.diameter, depth: hole.depth, x: r(hole.x), y: r(hole.y), ...(hole.from ? { from: hole.from } : {}) }))
      .sort((p, q) => p.kind.localeCompare(q.kind) || p.y - q.y || p.x - q.x),
    cutouts: (part.cutouts || []).map(c => ({ kind: c.kind, width: c.width, depth: c.depth, x: r(c.x), y: r(c.y) }))
  };
}

/* the products built into the cabinets, each with its box in its group (the model's frame) and what holds it: an oven
   and a microwave in their carcass, the fridge-freezer in its carcass, the dishwasher in its group, the sink and the hob in
   the worktop over their carcass, the coffee machine on its pull-out shelf; with the room's fitting (install: the scene's
   installation; ceiling: the room's height) the sink's tap and trap in its carcass and the hood over the hob in its group */
function productsOf(model, appliances, /** @type {{ install?: any, ceiling?: number }} */ { install, ceiling } = {}) {
  const front = g => model.groups[String(g)].geometry.carcassFront, out = [], union = boxes => [0, 1, 2].flatMap(k => [Math.min(...boxes.map(b => b[2 * k])), Math.max(...boxes.map(b => b[2 * k + 1]))]);
  const add = (role, group, carcassId, box, extra) => out.push(Object.assign({ role, A: appliances[role], group: String(group), carcassId, box }, extra));
  for (const g of Object.values(model.groups)) for (const item of g.items) {
    if (item.type !== 'oven' && item.type !== 'microwave') continue;
    const A = appliances[item.type], f = item.fit, xc = (item.x0 + item.x1) / 2, { width: bw, height: bh, depth: bd } = A.body, carcassFront = front(g.group);
    add(item.type, g.group, item.carcassId, union([[xc - bw / 2, xc + bw / 2, carcassFront - bd, carcassFront, f.bodyH0 - f.feet, f.bodyH0 + bh],
      [xc - A.fascia.width / 2, xc + A.fascia.width / 2, carcassFront, carcassFront + A.fascia.thickness, f.fasciaH0, f.fasciaH1]]), { item });
  }
  for (const c of model.carcasses) if (c.fridge && c.boxes.some(b => b.fit)) {
    const fit = c.boxes.find(b => b.fit).fit, A = appliances.fridgeFreezer, carcassFront = front(c.group);
    add('fridgeFreezer', c.group, c.id, [fit.bodyX0, fit.bodyX1, carcassFront - A.body.depth, carcassFront, fit.bodyH0, fit.bodyH1], { fit });
  }
  for (const f of model.fronts) if (f.opening === 'dishwasher' && f.item.fit) {
    const fit = f.item.fit, carcassFront = front(f.group);
    add('dishwasher', f.group, null, [fit.bodyX0, fit.bodyX1, carcassFront - appliances.dishwasher.body.depth, carcassFront, 0, fit.bodyH1], { item: f.item });
  }
  const worktopOf = r => model.worktops[r] || { cutouts: [] };
  for (const c of model.carcasses) {
    const r = String(c.group), cuts = worktopOf(r).cutouts || [], top = (model.worktops[r] || {}).h1;
    const sink = c.sink && cuts.find(k => k.kind === 'sink'), S = appliances.sink;
    if (sink) {
      const x = (sink.x0 + sink.x1) / 2, y = (sink.y0 + sink.y1) / 2;
      add('sink', r, c.id, [x - S.body.width / 2, x + S.body.width / 2, y - S.body.depth / 2, y + S.body.depth / 2, top - S.bowl.height - S.wall, top + S.rim], { x, y, top });
      if (!install) continue;
      const tapY = model.worktops[r].y0 + install.sink.tapFromBack, rim = top + S.rim, from = top - S.bowl.height - S.wall, back = model.carcassBack;
      add('tap', r, c.id, [x - 28, x + 268, tapY - 28, tapY + 227, rim, rim + 189], { name: 'Tap', x, y: tapY, top: rim });
      const wall = model.groups[r].wall;
      add('trap', r, c.id, [x - 70, x + 125, wall, Math.max(y + 20, back + 56), install.sink.wallOutlet - 25, from],   // its outlet runs to the wall
        { name: 'Trap', x, from, drain: y, top: install.sink.trapTop, outlet: install.sink.wallOutlet, back, wall });
    }
  }
  /* a basin on the top over a carcass tagged basin, its back settings.cutouts.basin.fromBack from the top's back edge; its tap
     over the hole for the tap */
  const basinCut = (model.settings.cutouts || {}).basin, B = appliances.basin, BT = appliances.basinTap;
  for (const c of model.carcasses.filter(c => c.basin && B && basinCut)) {
    const r = String(c.group), w = model.worktops[r];
    if (!w) continue;
    const x = (c.x0 + c.x1) / 2, y0 = w.y0 + basinCut.fromBack, top = w.h1;
    add('basin', r, c.id, [x - B.body.width / 2, x + B.body.width / 2, y0, y0 + B.body.depth, top, top + B.body.height], { name: B.name, x, y: y0 + B.body.depth / 2, top });
    const tapHole = basinCut.holes.find(h => h.for === 'tap');
    if (BT && tapHole) {
      const tx = x + tapHole.along, ty = w.y0 + tapHole.fromBack, rim = top + B.body.height;
      add('basinTap', r, c.id, [tx - 25, tx + 25, ty - 25, ty + BT.spout + 10, rim, rim + BT.height], { name: BT.name, x: tx, y: ty, top: rim });
    }
  }
  for (const g of Object.values(model.groups)) {
    const item = g.items.find(i => hasTag(i, 'hob')), cut = item && (worktopOf(String(g.group)).cutouts || []).find(k => k.kind === 'hob');
    if (!cut) continue;
    const H = appliances.hob, top = model.worktops[g.group].h1, x = (cut.x0 + cut.x1) / 2, gy = (cut.y0 + cut.y1) / 2 - H.glass.depth / 2;
    add('hob', g.group, item.carcassId, union([[cut.x0, cut.x1, cut.y0, cut.y1, top - H.body.height, top], [x - H.glass.width / 2, x + H.glass.width / 2, gy, gy + H.glass.depth, top, top + 5]]), { x, cut, top });
  }
  for (const g of Object.values(model.groups)) {
    const item = g.items.find(i => hasTag(i, 'hob'));
    if (!item || !install) continue;
    const cut = (worktopOf(String(g.group)).cutouts || []).find(k => k.kind === 'hob'), x = cut ? (cut.x0 + cut.x1) / 2 : (item.x0 + item.x1) / 2, A = appliances.hood;
    add('hood', g.group, null, [x - A.body.width / 2, x + A.body.width / 2, 0, Math.max(A.body.depth, A.chimney.depth), install.hood.bottom, ceiling],
      { x, bottom: install.hood.bottom, ceiling, worktop: model.worktops[g.group].h1 });
  }
  for (const b of model.boards) if (b.id === 'pullOutShelf') {
    const C = appliances.coffee.body, [x0, x1, , y1, , h1] = b.box, x = (x0 + x1) / 2, y = y1 - 20;
    add('coffee', b.group, b.carcassId, [x - C.width / 2, x + C.width / 2, y - C.depth, y, h1, h1 + C.height], { shelf: b });
  }
  return out;
}

/* the hardware, each piece with its box in its group (the model's frame) and what it belongs to: a leg, a plinth's grille,
   a shelf pin and a hinge's bumper to its carcass; a hinge (plate, arm, cup), a handle and the runners of a drawer, of the
   drawers behind a door and of a pull-out shelf to their front or shelf. HW: the hardware as drawn (room/room.js) */
function hardwareOf(model, HW) {
  const { carcassBack, frontThickness, settings, thickness: T } = model, out = [], G = g => model.groups[String(g)].geometry;
  const union = boxes => [0, 1, 2].flatMap(k => [Math.min(...boxes.map(b => b[2 * k])), Math.max(...boxes.map(b => b[2 * k + 1]))]);
  const add = (kind, name, to, box, more) => out.push(Object.assign({ kind, name, box }, to, more));
  for (const c of model.carcasses) {
    const to = { carcassId: c.id, group: String(c.group) }, { carcassFront, plinthFace } = G(c.group);
    if (c.floor) {
      const L = HW.leg, f = L.footRadius;
      for (const x of [c.x0 + L.fromSide, c.x1 - L.fromSide]) for (const y of [carcassBack + L.fromBack, carcassFront - L.fromFront]) add('leg', 'Leg', to, [x - f, x + f, y - f, y + f, 0, c.h0]);
    }
    if (c.grille) {
      const g = HW.plinthGrille, xc = (c.x0 + c.x1) / 2, w = Math.min(g.width, c.x1 - c.x0 - 80);
      add('grille', 'Ventilation grille', to, [xc - w / 2, xc + w / 2, plinthFace, plinthFace + 3, g.bottom, g.top]);
    }
    for (const b of model.boards) if (b.carcassId === c.id && b.id === 'adjustableShelf') {
      const pin = settings.drilling.shelfPin, h = b.box[4] - pin.belowShelf, d = pin.diameter / 2;
      for (const [p0, p1] of [[b.box[0] - 1, b.box[0] + 7], [b.box[1] - 7, b.box[1] + 1]]) for (const y of [carcassBack + pin.fromBack, carcassFront - pin.fromFront]) add('shelfPin', 'Shelf pin', to, [p0, p1, y - d, y + d, h - d, h + d]);
    }
  }
  for (const f of model.fronts) {
    const { carcassFront, frontFace } = G(f.group);
    const to = { frontId: f.id, group: String(f.group) }, H = HW.handle, L = H ? Math.ceil(Math.max(H.cupLength / 2 - 3, H.barLength / 2)) : 0, reach = frontFace + 34;   // whole mm: the cup or the bar, whichever is drawn
    if (f.opening === 'door' && f.carcassId) {
      const cup = settings.drilling.cup, dir = f.hand === 'left' ? 1 : -1, side = f.hingeX, cupX = f.hand === 'left' ? f.x0 + cup.fromEdge : f.x1 - cup.fromEdge, R = cup.diameter / 2 - 0.5;
      const span = (a, b) => [Math.min(a, b), Math.max(a, b)];
      for (const h of f.hinges) add('hinge', 'Hinge', Object.assign({ h }, to), union([[...span(side, side + dir * 10), carcassFront - 75, carcassFront - 30, h - 22, h + 22],
        [...span(side + dir * 3, side + dir * 20), carcassFront - 70, carcassFront - 2, h - 9, h + 9],
        [cupX - 24, cupX + 24, carcassFront - 1.75, frontFace - frontThickness + HW.hinge.cupDepth, h - 24, h + 24], [cupX - R, cupX + R, frontFace - frontThickness, frontFace - frontThickness + HW.hinge.cupDepth, h - R, h + R]]));
      const bumper = settings.drilling.bumper, gap = frontFace - frontThickness - carcassFront, br = bumper.diameter / 2 + 1.5;
      for (const b of f.bumpers || []) add('bumper', 'Bumper', { carcassId: f.carcassId, group: String(f.group), door: f.id }, [b.x - br, b.x + br, carcassFront, carcassFront + gap - 0.2, b.h - br, b.h + br]);
    }
    const position = f.item.handle;
    if (position === 'top' || position === 'bottom') {
      const h = Math.round(position === 'top' ? f.h1 - H.axis : f.h0 + H.axis), xc = Math.round((f.x0 + f.x1) / 2);
      add('handle', 'Handle', to, [xc - L, xc + L, frontFace, reach, h - 15, h + 15], { turn: null });
    } else if (position) {
      const x = Math.round(position === 'left' ? f.x0 + H.axis : f.x1 - H.axis), hc = Math.round(Math.min(f.h0 + H.sideHeight, (f.h0 + f.h1) / 2));
      add('handle', 'Handle', to, [x - 15, x + 15, frontFace, reach, hc - L, hc + L], { turn: position });
    }
    if (f.opening === 'drawer' && f.drawer && f.drawer.board) {        // a drawer of board: a ball runner on each side
      const b = f.drawer, h0 = b.bottomH + T.drawerBox + 20, h1 = h0 + 35;
      add('runner', 'Ball runner', to, [b.innerX0, b.x0, b.y0, b.y1, h0, h1], { runner: 'ball', side: 'left' });
      add('runner', 'Ball runner', to, [b.x1, b.innerX1, b.y0, b.y1, h0, h1], { runner: 'ball', side: 'right' });
    } else if (f.opening === 'drawer' && f.drawer) {
      const { innerX0, innerX1, bottomH } = f.drawer, Dw = HW.drawer, s0 = Dw.sideFromCarcass, y0 = carcassBack + Dw.fromBack, y1 = carcassFront - Dw.fromFront;
      const runners = (h, name, inner) => {
        add('runner', name, to, [innerX0, innerX0 + s0, y0, y1 + 2, h - 24, h - 6], { runner: 'drawer', side: 'left', inner });
        add('runner', name, to, [innerX1 - s0, innerX1, y0, y1 + 2, h - 24, h - 6], { runner: 'drawer', side: 'right', inner });
      };
      runners(bottomH, 'Drawer runner', false);
      if (f.drawer.inner) runners(f.drawer.innerH, 'Inner drawer runner', true);
      /* the drawer system's metal: its sides, a D drawer's gallery rails, the bins of a sink drawer; an inner drawer's sides,
         front and cutlery insert */
      const { size: kind, sideHeight, bins } = f.drawer, s1 = s0 + Dw.sideThickness;
      const sides = (h0, h1, inner) => {
        add('drawerSide', 'Drawer side', to, [innerX0 + s0, innerX0 + s1, y0, y1, h0, h1], { inner });
        add('drawerSide', 'Drawer side', to, [innerX1 - s1, innerX1 - s0, y0, y1, h0, h1], { inner });
      };
      sides(bottomH - 4, bottomH + sideHeight - 4, false);
      if (kind === 'D') for (const [a, b] of [[innerX0 + 28, innerX0 + 32], [innerX1 - 32, innerX1 - 28]]) add('galleryRail', 'Gallery rail', to, [a, b, carcassBack + 46, carcassFront - 24, bottomH + sideHeight - 4, bottomH + sideHeight + 60], { inner: false });
      if (bins) { const floor = bottomH + T.drawerBox; add('bins', 'Waste bins', to, [innerX0 + 45, innerX1 - 45, carcassBack + 66, carcassFront - 40, floor, floor + HW.bins.height], { inner: false }); }
      if (f.drawer.inner) {
        const ih = f.drawer.innerH, top = ih - 4 + settings.drawers.M.sideHeight;
        sides(ih - 4, top, true);
        add('drawerFront', 'Inner drawer front', to, [innerX0 + s1, innerX1 - s1, y1 - 16, y1 - 2, ih - 4, top], { inner: true });
        add('cutleryInsert', 'Cutlery insert', to, [innerX0 + 40, innerX1 - 40, carcassBack + 76, carcassFront - 44, ih + 16, ih + 66], { inner: true, inset: s1 - 40 });
      }
    }
    if (f.doorDrawers) {
      const clearance = settings.doorDrawers.clearance;
      f.doorDrawers.boxes.forEach((b, j) => {
        const h0 = b.h0 + T.drawerBox + 20, h1 = h0 + 35;
        add('runner', 'Ball runner', to, [b.x0 - clearance, b.x0, b.y0, b.y1, h0, h1], { runner: 'ball', side: 'left', doorDrawer: j });
        add('runner', 'Ball runner', to, [b.x1, b.x1 + clearance, b.y0, b.y1, h0, h1], { runner: 'ball', side: 'right', doorDrawer: j });
      });
    }
  }
  for (const shelf of model.boards) if (shelf.id === 'pullOutShelf') {
    const c = model.carcasses.find(k => k.id === shelf.carcassId), [x0, x1, y0, y1, h0] = shelf.box;
    const spacer = model.boards.find(b => b.carcassId === c.id && b.id === 'spacer' && b.box[4] < h0 && b.box[5] > h0 && (b.box[1] <= x0 || b.box[0] >= x1));
    const left = spacer && spacer.box[1] <= x0 ? spacer.box[1] : c.x0 + T.carcass, right = spacer && spacer.box[0] >= x1 ? spacer.box[0] : c.x1 - T.carcass;
    for (const [a, b] of [[left, x0], [x1, right]]) add('runner', 'Pull-out shelf runner', { carcassId: c.id, group: String(c.group) }, [a, b, y0, y1, h0 - 14, h0 + 12], { runner: 'pullOut', side: a === left ? 'left' : 'right', shelf });
  }
  return out;
}

/* ================= 7. THE TREE: every part in the coordinates of what it belongs to =================
   group -> what runs along it (worktop, panels, strips, plinths, plasterboard, the hood), then its units in a row: its
   carcasses and a dishwasher's bay; carcass -> its boards, fronts, products and hardware; front -> its panel, its hardware,
   the boards of its drawer, its inner drawer, its drawers behind the door. A node: {id, name, type, offset, size, children}
   in x, y, h: offset from its parent's origin (its smallest corner), size its own part's box (what holds others: theirs);
   a child may stand outside its parent (a sink over its carcass);
   the group's origin: its left end, its wall, the floor. node.part: the part of the model it draws. The model computes
   with y from the carcass backs; the tree has no such frame. */
/** @param {CabinetsModel} model @param {Object<string, any>} appliances @param {{ install?: any, ceiling?: number, HW?: any }} fitting @returns {FurnitureNode[]} the groups' nodes */
function tree(model, appliances, fitting) {
  const { carcassBack, frontThickness, settings } = model, G = g => model.groups[String(g)].geometry, PRODUCTS = productsOf(model, appliances, fitting), HARDWARE = fitting && fitting.HW ? hardwareOf(model, fitting.HW) : [];
  const union = boxes => [0, 1, 2].flatMap(k => [Math.min(...boxes.map(b => b[2 * k])), Math.max(...boxes.map(b => b[2 * k + 1]))]);
  /* a node with its box in the model's frame (gb): its own part's, or, for what only holds others (a group, a bay, a
     drawer), what it holds; made local once its parent is known */
  /** @param {string} id @param {string} name @param {string} type @param {Box | null} own @param {any[]} [children] @param {any} [part] */
  const make = (id, name, type, own, children = [], part = null) => {
    const gb = own ? own.slice() : union(children.map(c => c.gb));
    const n = { id, name, type, gb, children };
    Object.defineProperty(n, 'part', { value: part, enumerable: false });
    return n;
  };
  /* ids unique among siblings: the kind, numbered when there are more */
  const named = list => {
    const count = {}, seen = {};
    for (const n of list) count[n.id] = (count[n.id] || 0) + 1;
    for (const n of list) if (count[n.id] > 1) n.id = n.id + '_' + (seen[n.id] = (seen[n.id] || 0) + 1);
    for (const n of list) named(n.children);
    return list;
  };
  const cap = t => t[0].toUpperCase() + t.slice(1);
  const hardwareNode = x => make(x.kind, x.name, 'hardware', x.box, [], x);
  const boardNode = b => make(b.id, b.name + ' ' + b.a + ' × ' + b.b, 'board', b.box, [], b);
  const frontBox = f => [f.x0, f.x1, G(f.group).frontFace - frontThickness, G(f.group).frontFace, f.h0, f.h1];
  /* a front: its panel, the boards and hardware that move with it; an open drawer (no front): its box and runners */
  function frontNode(f) {
    const own = model.boards.filter(b => b.frontId === f.id);
    const children = (f.open ? [] : [make('panel', (f.opening === 'drawer' ? 'Drawer front ' : 'Front panel ') + Math.round(f.width) + ' × ' + Math.round(f.height), 'board', frontBox(f), [], null)])
      .concat(own.filter(b => !b.inner && b.doorDrawer === undefined).map(boardNode), HARDWARE.filter(x => x.frontId === f.id).map(hardwareNode));
    const inner = own.filter(b => b.inner);
    if (inner.length) children.push(make('innerDrawer', 'Inner drawer', 'drawer', null, inner.map(boardNode)));
    const behind = [...new Set(own.filter(b => b.doorDrawer !== undefined).map(b => b.doorDrawer))];
    for (const j of behind) children.push(make('doorDrawer', 'Drawer behind the door ' + (Number(j) + 1), 'drawer', null, own.filter(b => b.doorDrawer === j).map(boardNode)));
    if (f.open) return make('drawer', 'Open drawer ' + Math.round(f.width) + ' × ' + Math.round(f.height), 'drawer', null, children, f);
    return make(f.opening, cap(typeLabel(f.item.type)) + ' ' + Math.round(f.width) + ' × ' + Math.round(f.height), 'front', frontBox(f), children, f);
  }
  const groups = Object.values(model.groups).map(g => {
    const r = g.group, mine = x => x.group === r;
    const products = PRODUCTS.filter(x => x.group === String(r)), productNode = x => make(x.role, x.name || x.A.name, 'product', x.box, [], x);
    const carcasses = model.carcasses.filter(mine).map(c => make(c.name, 'Carcass ' + c.name, 'carcass', [c.x0, c.x1, carcassBack, G(c.group).carcassFront, c.h0, c.h1],
      model.boards.filter(b => b.carcassId === c.id && !b.frontId).map(boardNode).concat(model.fronts.filter(f => f.carcassId === c.id).map(frontNode),
        products.filter(x => x.carcassId === c.id).map(productNode), HARDWARE.filter(x => x.carcassId === c.id).map(hardwareNode)), c));
    /* a front with no carcass (a dishwasher's) stands in a bay of its own: a unit in the row of carcasses, with its appliance */
    const bays = model.fronts.filter(f => mine(f) && !f.carcassId).map(f => {
      const inside = products.filter(x => !x.carcassId && x.item === f.item);
      return make(f.opening, cap(f.opening) + ' bay', 'bay', null, [frontNode(f), ...inside.map(productNode)], f);
    });
    const units = [...carcasses, ...bays].sort((p, q) => p.gb[0] - q.gb[0]);   // along the group, as they stand
    const along = model.boards.filter(b => mine(b) && !b.carcassId).map(boardNode)
      .concat(products.filter(x => !x.carcassId && !bays.some(n => n.children.some(c => c.part === x))).map(productNode));
    const piece = (list, type) => list.filter(mine).map(x => make(type, (x.name || cap(typeLabel(type))) + ' ' + x.a + ' × ' + x.b, type, x.box, [], x));
    const worktops = model.worktopPieces.filter(mine).map(w => make(w.item.type, w.name + ' ' + w.a + ' × ' + w.b, w.item.type, [w.item.x0, w.item.x1, w.y0, w.y1, w.item.h0, w.item.h1], [], w));
    const plaster = model.plaster.filter(mine).map(x => make('plasterboard', x.name + ' ' + x.a + ' × ' + x.b, 'plasterboard',
      [x.item.x0, x.item.x1, g.wall, g.wall + settings.plasterboard.depth, x.item.h0, x.item.h1], [], x));
    const children = [...worktops, ...piece(model.wallPanels, 'wallPanel'), ...plaster, ...piece(model.strips, 'strip'), ...piece(model.plinths, 'plinth'),
      ...piece(model.frontPanels, 'frontPanel'), ...along, ...units];   // what runs along the group, then its units in a row
    const n = make('g' + r, 'G' + r + ' · ' + g.name, 'group', null, children);
    n.gb[0] = 0; n.gb[2] = g.wall; n.gb[4] = 0;                  // the origin: the left end, the wall, the floor
    return n;
  });
  /* local: each node's offset from its parent's origin; the part it draws learns its node */
  const local = (n, origin) => {
    n.offset = [n.gb[0] - origin[0], n.gb[2] - origin[1], n.gb[4] - origin[2]];
    n.size = [n.gb[1] - n.gb[0], n.gb[3] - n.gb[2], n.gb[5] - n.gb[4]];
    for (const c of n.children) local(c, [n.gb[0], n.gb[2], n.gb[4]]);
    if (n.part) Object.defineProperty(n.part, 'node', { value: n, configurable: true });
    delete n.gb;
    return n;
  };
  Object.defineProperty(model, 'products', { value: PRODUCTS, configurable: true });
  Object.defineProperty(model, 'hardware', { value: HARDWARE, configurable: true });
  return named(groups).map(n => {
    local(n, [n.gb[0], n.gb[2], n.gb[4]]);
    parentsOf(n, null);
    return n;
  });
}
function parentsOf(n, parent) { Object.defineProperty(n, 'parent', { value: parent }); for (const c of n.children) parentsOf(c, n); }
/* a node's box in its group [x0, x1, y0, y1, h0, h1]: the offsets added up from the group's origin */
/** @param {TreeNode & { parent?: TreeNode }} n @returns {Box} */
function boxIn(n) {
  const o = [0, 0, 0];
  for (let p = n; p.parent; p = p.parent) for (let k = 0; k < 3; k++) o[k] += p.offset[k];
  return [o[0], o[0] + n.size[0], o[1], o[1] + n.size[1], o[2], o[2] + n.size[2]];
}

/* the banded edges another part covers whole: an edge is banded to be seen, so none may lie, all along, against another board, a front,
   a worktop, a panel, a piece of hardware, an appliance, the wall or the floor (Test). By samples over the edge, 1 mm out */
/** @param {CabinetsModel} model @returns {string[]} */
function coveredEdges(model) {
  const { frontThickness } = model, solids = [], face = f => model.groups[String(f.group)].geometry.frontFace;
  const add = (r, box, what) => box && solids.push({ r: String(r), box, what });
  for (const b of model.boards) add(b.group, b.box, b.id);
  for (const f of model.fronts) if (!f.open) add(f.group, [f.x0, f.x1, face(f) - frontThickness, face(f), f.h0, f.h1], 'front');
  for (const w of model.worktopPieces) add(w.group, [w.item.x0, w.item.x1, w.y0, w.y1, w.item.h0, w.item.h1], 'worktop');
  for (const k of ['strips', 'plinths', 'frontPanels', 'wallPanels']) for (const x of model[k]) add(x.group, x.box, k);
  for (const x of model.products || []) add(x.group, x.box, x.role);   // hardware hides no edge: a hinge's arm passes in front of it
  for (const [r, g] of Object.entries(model.groups)) add(r, [-1e6, 1e6, g.wall - 1e3, g.wall, -1e3, 1e6], 'the wall');
  for (const r of Object.keys(model.groups)) add(r, [-1e6, 1e6, -1e6, 1e6, -1e3, 0], 'the floor');
  const SIDES = { left: [0, 0], right: [0, 1], back: [1, 0], front: [1, 1], bottom: [2, 0], top: [2, 1] }, N = 5, out = [];
  for (const b of model.boards) for (const e of b.edges || []) {
    const [k, hi] = SIDES[e.side], others = [0, 1, 2].filter(j => j !== k), by = new Set();
    let covered = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const p = []; p[k] = b.box[2 * k + hi] + (hi ? 1 : -1);
      for (const [n, q] of [[i, others[0]], [j, others[1]]]) p[q] = b.box[2 * q] + (n + 0.5) / N * (b.box[2 * q + 1] - b.box[2 * q]);
      const s = solids.find(s => s.r === String(b.group) && s.box !== b.box && [0, 1, 2].every(q => p[q] >= s.box[2 * q] && p[q] <= s.box[2 * q + 1]));
      if (s) { covered++; by.add(s.what); }
    }
    if (covered === N * N) out.push(`G${b.group} ${b.name} ${b.a} × ${b.b}: its ${e.side} edge lies against ${[...by].join(', ')}`);
  }
  return out;
}

/* a cabinets file as its text, as the files are written: every setting, appliance, note, group and component on its
   own line (a setting of settings on lines of their own), a blank line between the groups' components */
/** @param {CabinetsFile} file @returns {string} */
function cabinetsText(file) {
  const json1 = v => (Array.isArray(v) ? '[' + v.map(json1).join(', ') + ']' : v && typeof v === 'object' ? '{' + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ': ' + json1(x)).join(', ') + '}' : JSON.stringify(v));
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const value = v => (isObj(v) && Object.values(v).every(isObj) ? '{\n' + Object.entries(v).map(([k, x]) => '   ' + json1(k) + ': ' + json1(x)).join(',\n') + '\n  }' : json1(v));
  const entries = (o, line) => Object.entries(o || {}).map(([k, v]) => '  ' + json1(k) + ': ' + line(v)).join(',\n');
  const list = l => (l || []).map(x => '  ' + json1(x)).join(',\n');
  const comps = (file.components || []).map((c, i, all) => (i && c.group !== all[i - 1].group ? '\n' : '') + '  ' + json1(c)).join(',\n');
  return 'HOME.data({\n "format": "cabinets",\n "version": 1,\n "settings": {\n' + entries(file.settings, value) +
    '\n },\n "appliances": {\n' + entries(file.appliances, json1) + '\n },\n "notes": [\n' + list(file.notes) +
    '\n ],\n "groups": [\n' + list(file.groups) + '\n ],\n "components": [\n' + comps + '\n ]\n});\n';
}

return {
  TYPES, TAGS, TAG_NAMES, LABELS, typeLabel, tagsLabel, useLabel, hasTag, FRONT_TYPES, SIDES, HINGE_SIDES,
  placeLabel, gapsText, parseTags, spaceAround, valueAt, PINS_PER_SHELF, tagsOf, readType, cutKey, checkSettings, build, cutList, 
  plural, appliances, withLibrary, tree, boxIn, coveredEdges, cabinetsText
};
}
