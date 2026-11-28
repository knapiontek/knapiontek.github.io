// @ts-check
// room/cabinets.js: the cabinets' engine: a cabinets file (format cabinets) as the furniture's nodes, with what is wrong in it.
// The file is the designer's, for the maker: groups of columns, components stacked in them, carcasses by name; the engine knows
// no room and no house. It works in the design's axes, as the maker measures: per group, zero at the wall (an island: the back
// of its worktop), at its left end as one sees the fronts, on the floor; x from the left, y from the wall toward the fronts, h
// up. The nodes come out in the model's (core/tools.js: y the other way): each node's zero at its back (the wall side), left,
// bottom; its size from there to its opposite corner (negative y). Where a group stands: the room's scene (room/assembly.js).
// A carcass's place is measured from what lies on the zero over its columns: the worktop, else the plasterboard casing, else
// the group itself (settings.carcass.offset, a group's own carcass.offset). Each node carries its bodies (parts, boxes of the
// boards of the library: 'board:' and the product's key): the carcasses' boards, the fronts, the worktop, panels, strips,
// plinths, the worktop's cut-outs, the drawers' boards. Every product (an appliance, a fitting: a hinge, a bumper, a drawer
// system, runners, a shelf pin, bins, a handle, a leg, a grille; the tap, the trap) is a node of its own, placed by its anchor
// and drawn by the library (library/shapes.js), the hood up to the ceiling (room/assembly.js). The engine knows what a product
// does, not how it is made: it asks the library (where a door's hinges go, a drawer's boards, the longest runner that fits,
// how a trap fits) and checks that each product it needs is chosen and has what its drawing needs (faultsOf).

import { checkFormat, moverToModel, pointToModel, partToModel } from '../core/tools.js';
import { bodyOf, boardOf, cutoutOf, drainOf, faultsOf, fitOf, hingeHeights, hingePost, holeOf, holesOf, innerOver, pullOutFit, runnerFit, runnerFor, shapeOf, systemDrawer, systemFor, trapFit, travelOf } from '../library/shapes.js';

/** @typedef {import('../types.js').Catalog} Catalog */
/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {{ index: number | null, text: string, skipped: boolean }} Problem  a fault in the file: its component's row (none: the file's), skipped: not built */
/** @typedef {{ left: number, right: number, top: number, bottom: number }} Gaps  mm from the module's edges to its front */
/**
 * A component of the file, read; placed (x0 … h1) once stacked in its columns.
 * @typedef {object} Item
 * @property {number} index  its row in components
 * @property {number} group
 * @property {number} column
 * @property {number} span
 * @property {number} height
 * @property {string} type
 * @property {string[]} tags
 * @property {string[]} unknownTags
 * @property {string} carcass  its carcass's name; '' none
 * @property {string} handle
 * @property {string} hinge
 * @property {Gaps | null} gaps
 * @property {string} note
 * @property {number} x0
 * @property {number} x1
 * @property {number} h0
 * @property {number} h1
 * @property {Fit} [fit]  how its appliance sits in it (heights from the floor)
 */
/** @typedef {{ feet?: number, bodyH0: number, bodyH1: number, fasciaH0?: number, fasciaH1?: number, doorH0?: number, doorH1?: number }} Fit  an appliance in its place (library/shapes.js: fitOf) */
/**
 * @typedef {object} Carcass
 * @property {string} name
 * @property {number} group
 * @property {number} column
 * @property {number} span
 * @property {number} x0
 * @property {number} x1
 * @property {number} h0
 * @property {number} h1
 * @property {Item[]} boxes  its modules (types with a carcass), bottom up
 * @property {Item[]} members  every component with its name
 * @property {boolean} floor  on a plinth
 * @property {boolean} base  a worktop on it
 * @property {boolean} hung  on the wall, nothing under it
 * @property {'base' | 'tall' | 'wall'} kind
 * @property {string[]} flags  of CARCASS_FLAGS
 * @property {number} legs
 * @property {boolean} grille  in the plinth under it
 */
/**
 * A group, laid out; y from the wall.
 * @typedef {object} Group
 * @property {number} group
 * @property {string} name
 * @property {number[]} widths
 * @property {number[]} columnX  the columns' left ends and the group's end
 * @property {number} length
 * @property {Item[]} items
 * @property {boolean} island
 * @property {Carcass[]} carcasses
 * @property {{ carcassBack: number, carcassFront: number, carcassDepth: number, frontFace: number, plinthFace: number, panelFace: number }} geometry
 * @property {{ y0: number, y1: number, depth: number, h0: number, h1: number, use: string } | null} worktop  from the wall (an island: its back) to its front
 */
/** @typedef {{ side: string, length: number, along: 'a' | 'b' }} Edge  a finished edge of a piece: the side it is on (seen from the front; a lying piece: front, back, left, right), its length, the size it runs along */
/** @typedef {{ kind: string, diameter: number, depth: number, x: number, y: number, at: number[], axis: number[], from?: string }} PieceHole  a hole in a piece: x, y from the edges its holeFrom names (a hole in an edge: x along it from its end from, y 0); at, axis: in the group's design axes */
/** @typedef {{ kind: string, width: number, depth: number, x: number, y: number, round?: boolean }} Cutout  a cut-out in a worktop: its left back corner (a round one: its centre) from the piece's left end and its back */
/**
 * A part to cut (room/cabinets.md § 4): what the cut list, the assembly cards and the estimate count; made where its body is.
 * @typedef {object} Piece
 * @property {string} id  its kind: side, bottomBoard, crossRail, topBoard, backPanel, fixedShelf, adjustableShelf, insetPanel, hobPanel, hingePost, spacer,
 *   pullOutShelf, backStrip, drawerBottom, drawerBack, drawerSide, drawerEnd, doorDrawerFront, doorDrawerBottom, doorDrawerSide, doorDrawerBack, front, strip,
 *   plinth, frontPanel, islandBackPanel, wallPanel, worktop, endPanel, plasterboard
 * @property {string} name  as the maker reads it
 * @property {string} use  its material's use ('' none: the plasterboard)
 * @property {string} material  the library's board; '' none
 * @property {number} a  its sizes, its thickness left out (0.1 mm)
 * @property {number} b
 * @property {number[]} box  in its group's design axes
 * @property {number} group
 * @property {string} carcass  its carcass's name (a front: its module's); '' none
 * @property {string} place  where it is: its carcass's or its component's place (G1[4])
 * @property {number} column
 * @property {Item} [item]  its component
 * @property {Edge[]} edges  banded
 * @property {{ long: number, short: number } | null} lacquer  its lacquered edges: how many along its long and its short sides
 * @property {string[]} lacqueredSides
 * @property {string[]} factoryEdges  finished by the maker (a worktop's front)
 * @property {'left' | 'right' | ''} hand  a side's, a hinge post's, a door's (its hinges' side), seen from the front
 * @property {PieceHole[]} holes
 * @property {{ x: string, y: string } | null} holeFrom  the edges the holes are given from: front | hinge | left, bottom | back
 * @property {Cutout[]} cutouts
 * @property {Front} [front]  a front's
 * @property {number} [inner]  a drawer's board: 1 an inner drawer's
 */
/**
 * A front, or an open drawer (no panel): how it opens, its hinges and bumpers, what is behind it.
 * @typedef {object} Front
 * @property {Item} item
 * @property {number} group
 * @property {string} carcass
 * @property {number} x0
 * @property {number} x1
 * @property {number} h0
 * @property {number} h1
 * @property {number} width
 * @property {number} height
 * @property {string} opening  door, drawer, fixed, fridge, dishwasher
 * @property {boolean} open  a drawer without a front
 * @property {'left' | 'right' | ''} hand  a door's hinges' side
 * @property {number[]} hinges  their heights
 * @property {number} bumpers
 * @property {{ system: string, bins: boolean, inner: boolean, runnerLength?: number, boxWidth?: number, boxHeight?: number } | null} drawer  system: the hardware's role (drawer, drawerM) or board
 * @property {{ count: number, runnerLength: number, boxWidth: number, boxHeight: number } | null} doorDrawers
 */
/** @typedef {Record<string, any>} Counts  what the cabinets hold (room/cabinets.md § 4): carcasses, fronts, hinges, drawersD … type.<type>, tag.<tag> */
/** @typedef {Omit<HierarchyNode, 'children'> & { children?: CabinetNode[], parts?: import('../types.js').Part[] }} CabinetNode  a node of the furniture; parts: its bodies, in its axes */
/** @typedef {{ groups: CabinetNode[], layout: Group[], problems: Problem[], pieces: Piece[], fronts: Front[], counts: Counts }} Cabinets */
/** @typedef {import('../types.js').Part & { layer: string }} Body  a body in the design's axes of its group (y from the wall): a box or a cylinder */

export const CABINETS = 1;   // of the format cabinets

/* ================= the vocabulary (room/cabinets.md § 2) ================= */

/* what a component is: exactly one per component */
const TYPES = ['space', 'plasterboard', 'plinth', 'worktop', 'endPanel', 'wallPanel', 'frontPanel', 'strip', 'cabinet', 'drawer', 'oven', 'microwave'];
/** @type {Record<string, string[]>} a tag: the types it is for */
const TAGS = {
  dummy: ['drawer'], hob: ['cabinet', 'drawer'], sink: ['cabinet', 'drawer'], basin: ['cabinet', 'drawer'], banded: ['worktop'], bins: ['drawer'],
  innerDrawer: ['drawer'], island: ['worktop'], coffee: ['cabinet'], doorDrawers: ['cabinet'], fridge: ['cabinet'], freezer: ['cabinet'],
  dishwasher: ['cabinet'], open: ['cabinet', 'drawer']
};
const TAG_NAMES = Object.keys(TAGS);
/* at most one tag of each set */
const EXCLUSIVE_TAGS = [['fridge', 'freezer', 'dishwasher'], ['dummy', 'bins'], ['dummy', 'innerDrawer'], ['coffee', 'doorDrawers'], ['open', 'dummy'],
  ['open', 'fridge', 'freezer', 'dishwasher', 'coffee', 'doorDrawers']];
const FRONT_TYPES = ['cabinet', 'drawer'];                // a front: 4 gaps, a handle
const BOX_TYPES = [...FRONT_TYPES, 'oven', 'microwave'];  // in a carcass (a name; a dishwasher none)
const BOARD_TYPES = ['worktop', 'endPanel', 'wallPanel', 'plinth', 'frontPanel', 'strip', ...FRONT_TYPES];
const PARTS = ['carcass', 'backPanel', 'drawerBox', 'hobPanel'];   // what the engine adds in a carcass
const ISLAND_USE = 'islandWorktop', ISLAND_END_PANEL_USE = 'islandEndPanel';
const DEPTH_USES = ['worktop', ISLAND_USE, 'endPanel', ISLAND_END_PANEL_USE];
const USES = [...BOARD_TYPES, ISLAND_USE, ISLAND_END_PANEL_USE, ...PARTS];
/** @type {Record<string, string[]>} a carcass's flag: one of its modules has one of the tags */
const CARCASS_FLAGS = { sink: ['sink'], basin: ['basin'], hob: ['hob'], fridge: ['fridge', 'freezer'], coffee: ['coffee'], doorDrawers: ['doorDrawers'] };
const GRILLE_FOR = { types: ['oven'], tags: ['fridge', 'freezer'] };   // a carcass on a plinth with these: a grille in the plinth
const SIDES = ['top', 'bottom', 'left', 'right'];
const HINGE_SIDES = ['left', 'right'];
const HINGED = ['door', 'fridge'];
/** @type {Record<string, string>} what a node is, by its kind: its layer (index.json: layers) */
const LAYER = { worktop: 'worktop', endPanel: 'endPanels', wallPanel: 'wallPanel', strip: 'strips', frontPanel: 'frontPanels', islandBackPanel: 'frontPanels',
  plinth: 'plinth', plasterboard: 'plasterboard', carcass: 'boards' };
/* a lacquered material is lacquered on both faces, its edges where the room sees them: a front all round, a strip its front */
const LACQUERED = { front: { long: 2, short: 2 }, strip: { long: 1, short: 0 }, plinth: { long: 0, short: 0 } };
const HORIZONTAL = ['bottomBoard', 'topBoard', 'crossRail', 'fixedShelf', 'hobPanel'];   // boards lying flat in a carcass: no hole may hit one
const SLIDING = ['drawerBottom', 'drawerBack', 'drawerSide', 'drawerEnd', 'doorDrawerFront', 'doorDrawerBottom', 'doorDrawerSide', 'doorDrawerBack', 'pullOutShelf'];
/** @type {Record<string, number>} */
const FACES = { left: 0, right: 0, back: 1, front: 1, bottom: 2, top: 2 };   // a side of a box: the axis it faces along

/* the settings a file needs, by what it holds (has): [when, dotted paths] */
/** @type {[(has: any) => boolean, string[]][]} */
const REQUIRED_SETTINGS = [
  [() => true, ['carcass.depth', 'carcass.frontGap', 'carcass.legs', 'backPanel.inset', 'shelf.setback', 'shelf.clearance', 'shelf.pins.fromFront', 'shelf.pins.fromBack']],
  [has => !has.grid, ['shelf.perDoor']],
  [has => has.type.oven || has.tag.fridge || has.tag.freezer, ['shelf.ventGap']],
  [has => has.type.worktop, ['crossRails.depth', 'crossRails.hobFront', 'crossRails.hobPanelGap', 'worktop.overhang', 'worktop.endPanelOverhang']],
  [has => has.tag.sink, ['installation.sink.tapFromBack']],
  [has => has.tag.coffee, ['pullOutShelf.lift', 'pullOutShelf.spacerAbove', 'pullOutShelf.machineHeight', 'pullOutShelf.shelvesAbove']],
  [has => has.tag.doorDrawers, ['doorDrawers.count', 'doorDrawers.sideHeight', 'doorDrawers.lift']],
  [has => has.drawer && !has.boardDrawers, ['drawers.frontAbove']],
  [has => has.boardDrawers, ['drawers.board.sideHeight', 'drawers.board.lift', 'drawers.board.setback', 'drawers.board.backClearance']],
  [has => has.type.strip, ['strip.depth']],
  [has => has.type.plinth, ['plinth.setback']],
  [has => has.type.plasterboard, ['plasterboard.depth', 'plasterboard.studSpacing', 'plasterboard.layers']],
  [has => has.grid, ['shelf.grid.from', 'shelf.grid.pitch', 'shelf.grid.fixedEvery']]
];
/* the products a file needs, by what it holds: [when, where (settings.hardware or settings.appliances), its role, its drawing] */
/** @type {[(has: any) => boolean, 'hardware' | 'appliances', string, string][]} */
const REQUIRED_PRODUCTS = [
  [() => true, 'hardware', 'shelfPin', 'shelfPin'],
  [has => has.door, 'hardware', 'hinge', 'hinge'],
  [has => has.door, 'hardware', 'bumper', 'bumper'],
  [has => has.drawer && !has.boardDrawers, 'hardware', 'drawer', 'drawerSystem'],
  [has => has.drawer && !has.boardDrawers, 'hardware', 'drawerM', 'drawerSystem'],
  [has => has.drawer && !has.boardDrawers && has.tag.innerDrawer, 'hardware', 'innerDrawer', 'drawerSystem'],
  [has => has.tag.doorDrawers || has.boardDrawers, 'hardware', 'runner', 'ballRunners'],
  [has => has.tag.coffee, 'hardware', 'pullOut', 'pullOutRunners'],
  [has => has.tag.bins, 'hardware', 'bins', 'bins'],
  [has => has.handle, 'hardware', 'handle', 'cupHandle'],
  [has => has.tag.sink, 'appliances', 'sink', 'sink'],
  [has => has.tag.sink, 'appliances', 'sinkTap', 'kitchenTap'],
  [has => has.tag.sink, 'appliances', 'trap', 'trap'],
  [has => has.tag.hob, 'appliances', 'hob', 'hob'],
  [has => has.tag.basin, 'appliances', 'basin', 'basin']
];

/* ================= small helpers ================= */

/** a value by its dotted path; undefined where there is none @param {any} o @param {string} dotted */
const valueAt = (o, dotted) => dotted.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);
/** @param {{ tags: string[] }} item @param {...string} tags */
const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));
/** a place as written: G1[4] group 1, column 4; G1[1-11] @param {number | string} group @param {number} column @param {number} [span] */
const placeLabel = (group, column, span = 1) => `G${group}[${column}${span > 1 ? '-' + (column + span - 1) : ''}]`;
/** @param {Item} item */
const placeOf = item => placeLabel(item.group, item.column, item.span);
const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;
/** a box's sizes: the thinnest its thickness, a and b the other two in the order x, y, h @param {number[]} box */
function sizesOf(box) {
  const s = [0, 1, 2].map(k => box[2 * k + 1] - box[2 * k]), thin = s.indexOf(Math.min(...s)), [ia, ib] = [0, 1, 2].filter(k => k !== thin);
  return { thin, ia, ib, a: r1(s[ia]), b: r1(s[ib]), s };
}
/** the finished edges of a box on these sides: each as long as the box along it @param {number[]} box @param {string[]} sides @returns {Edge[]} */
function edgesOf(box, sides) {
  const { thin, ia, ib, s } = sizesOf(box);
  return sides.flatMap(side => {
    const along = [ia, ib].find(k => k !== FACES[side]);
    return along === undefined || FACES[side] === thin ? [] : [{ side, length: r1(s[along]), along: along === ia ? 'a' : 'b' }];
  });
}
/** @param {Item} item */
function openingOf(item) {
  if (hasTag(item, 'open')) return item.type === 'drawer' ? 'drawer' : 'open';
  if (hasTag(item, 'dummy')) return 'fixed';
  if (item.type === 'drawer') return 'drawer';
  if (hasTag(item, 'dishwasher')) return 'dishwasher';
  if (hasTag(item, 'fridge', 'freezer')) return 'fridge';
  return 'door';
}
/** the tags as written, known and not @param {unknown} tags */
function parseTags(tags) {
  const words = (Array.isArray(tags) ? tags : String(tags ?? '').split(/[\s,]+/)).map(w => String(w).trim()).filter(Boolean);
  return { tags: words.filter(w => TAG_NAMES.includes(w)), unknown: words.filter(w => !TAG_NAMES.includes(w)) };
}
/** what a file holds: its types and tags, a door, a drawer, the drawer system, a shelf grid @param {any} file */
function featuresOf(file) {
  const settings = file.settings || {}, /** @type {any} */ has = { type: {}, tag: {} };
  for (const c of file.components || []) {
    const type = c.type, tags = parseTags(c.tags).tags;
    has.type[type] = true;
    for (const t of tags) has.tag[t] = true;
    if (type === 'cabinet' && !tags.some(t => ['open', 'dishwasher', 'fridge', 'freezer'].includes(t))) has.door = true;
    if (type === 'drawer' && !tags.includes('dummy')) has.drawer = true;
    if (FRONT_TYPES.includes(type) && !tags.includes('open')) has.front = true;
    if (c.handle) has.handle = true;
  }
  has.boardDrawers = valueAt(settings, 'drawers.box') === 'board';
  has.grid = valueAt(settings, 'shelf.grid') !== undefined;
  return has;
}
/** the uses a file needs a material for @param {any} file */
function usesNeeded(file) {
  const has = featuresOf(file), island = has.tag.island;
  return USES.filter(use => use === 'carcass' || use === 'backPanel' || (use === 'drawerBox' && (has.drawer || has.tag.doorDrawers)) || (use === 'hobPanel' && has.tag.hob)
    || (FRONT_TYPES.includes(use) ? has.front && has.type[use] : BOARD_TYPES.includes(use) && has.type[use])
    || (use === ISLAND_USE && island) || (use === ISLAND_END_PANEL_USE && island && has.type.endPanel));
}

/* ================= what stops the build: the materials, the settings, the groups ================= */

/** @param {any} file @param {Catalog} catalog @returns {string[]} */
function stops(file, catalog) {
  const problems = [], materials = file.materials || {}, settings = file.settings || {}, has = featuresOf(file);
  for (const [use, key] of Object.entries(materials)) {
    if (!USES.includes(use)) { problems.push(`materials: "${use}" is neither a board type nor a carcass part (${USES.join(', ')}).`); continue; }
    let m;
    try { m = /** @type {any} */ (catalog.product(String(key))); } catch { problems.push(`materials.${use}: no product ${key} in the library.`); continue; }
    if (!(boardOf(m).thickness > 0)) problems.push(`materials.${use}: ${key} has no thickness.`);
    if (DEPTH_USES.includes(use) && !(boardOf(m).depth > 0)) problems.push(`materials.${use}: ${key} needs a depth (or a sheet's width).`);
  }
  for (const use of usesNeeded(file)) if (!materials[use]) problems.push(`materials: none for ${use}.`);
  const thick = new Set(FRONT_TYPES.filter(t => materials[t]).map(t => { try { return boardOf(catalog.product(materials[t])).thickness; } catch { return null; } }));
  if (thick.size > 1) problems.push(`materials: the fronts (${FRONT_TYPES.join(', ')}) need one thickness: the plane of the fronts.`);
  const needed = new Set(REQUIRED_SETTINGS.filter(([need]) => need(has)).flatMap(([, paths]) => paths));
  for (const path of needed) if (valueAt(settings, path) === undefined) problems.push(`settings: ${path} missing.`);
  /* the products: each needed one chosen, in the library, of the drawing its role needs, with what that needs of it (the library's faultsOf) */
  for (const [need, where, role, draw] of REQUIRED_PRODUCTS) {
    if (!need(has)) continue;
    const at = `settings.${where}.${role}`, key = where === 'hardware' ? settings.hardware?.[role] : settings.appliances?.[role]?.product;
    if (!key) { problems.push(`${at}: none.`); continue; }
    let p;
    try { p = /** @type {any} */ (catalog.product(String(key))); } catch { problems.push(`${at}: no product ${key} in the library.`); continue; }
    if (p.draw !== draw) { problems.push(`${at}: ${key} is no ${draw}.`); continue; }
    const family = role === 'runner' ? catalog.variants(key) : [key];
    for (const k of family) for (const path of faultsOf(catalog.product(k))) problems.push(`${at}: ${k} has no ${path}.`);
  }
  const row = (/** @type {any} */ r, /** @type {boolean} */ last) => r && Number.isInteger(r.count) && (last ? r.maxHeight === undefined : r.maxHeight > 0);
  const table = valueAt(settings, 'shelf.perDoor');
  if (table !== undefined && !(Array.isArray(table) && table.length && table.every((r, i) => row(r, i === table.length - 1)))) problems.push(`settings: shelf.perDoor must be [{maxHeight, count}, …, {count}].`);
  if (!Array.isArray(file.groups)) return [...problems, 'groups: none.'];
  const seen = new Set();
  for (const g of file.groups) {
    if (!(g && Number.isInteger(g.group) && g.group >= 1)) { problems.push('groups: every group needs a number (an integer ≥ 1).'); continue; }
    if (seen.has(g.group)) problems.push(`groups: group ${g.group} twice.`);
    seen.add(g.group);
    const offset = g.carcass?.offset ?? settings.carcass?.offset, depth = g.carcass?.depth ?? settings.carcass?.depth;
    if (!(Number.isInteger(offset) && offset >= 0)) problems.push(`groups: group ${g.group}: the carcasses' offset (carcass.offset, of the group or the settings) must be whole mm ≥ 0.`);
    if (!(Number.isInteger(depth) && depth > 0)) problems.push(`groups: group ${g.group}: the carcasses' depth must be whole mm > 0.`);
    if (!Array.isArray(g.columns)) problems.push(`groups: group ${g.group} needs its columns.`);
  }
  return problems;
}

/* ================= the layout: components stacked in their columns ================= */

/** @param {any} c @param {number} index @returns {Item} */
function readComponent(c, index) {
  const tags = parseTags(c.tags), gap = (/** @type {any} */ v) => (v === '' || v == null ? NaN : Number(v));
  return {
    index, group: +c.group, column: +c.column, span: +(c.span ?? 1), height: c.height, type: TYPES.includes(c.type) ? c.type : '',
    tags: tags.tags, unknownTags: tags.unknown, carcass: String(c.carcass || '').trim(), handle: c.handle || '', hinge: c.hinge || '',
    gaps: c.gaps && typeof c.gaps === 'object' ? /** @type {Gaps} */ (Object.fromEntries(SIDES.map(side => [side, gap(c.gaps[side])]))) : null,
    note: c.note || '', x0: 0, x1: 0, h0: 0, h1: 0
  };
}

/**
 * Each piece, in the order of the list, starts on top of the stack of its columns: in a column, the run of pieces that reaches up
 * from the floor without a gap (a piece may fill a gap left under a wider one); the highest of those tops.
 * @param {number[]} widths @param {Item[]} pieces
 */
function stack(widths, pieces) {
  const columnX = [0];
  widths.forEach(w => columnX.push(columnX[columnX.length - 1] + w));
  /** @type {number[][][]} [h0, h1] per column */
  const occupied = widths.map(() => []);
  /** @type {Item[]} */ const items = [];
  /** @type {{ piece: Item, why: string }[]} */ const skipped = [];
  const top = (/** @type {number[][]} */ ranges) => {
    let t = 0;
    for (const [a, b] of [...ranges].sort((p, q) => p[0] - q[0])) { if (a > t) break; t = Math.max(t, b); }
    return t;
  };
  for (const piece of pieces) {
    const first = piece.column - 1, end = first + piece.span;
    if (!Number.isInteger(piece.column) || !Number.isInteger(piece.span) || first < 0 || piece.span < 1 || end > widths.length || !(piece.height >= 0)) {
      skipped.push({ piece, why: 'runs out of its columns' });
      continue;
    }
    let h0 = 0;
    for (let k = first; k < end; k++) h0 = Math.max(h0, top(occupied[k]));
    const h1 = h0 + piece.height;
    if (occupied.slice(first, end).some(r => r.some(([a, b]) => Math.max(h0, a) < Math.min(h1, b)))) { skipped.push({ piece, why: 'overlaps another' }); continue; }
    for (let k = first; k < end; k++) occupied[k].push([h0, h1]);
    items.push({ ...piece, x0: columnX[first], x1: columnX[end], h0, h1 });
  }
  return { items, skipped, columnX };
}

/**
 * The cabinets of a file as the furniture's nodes, one per group, in the model's axes; what is wrong in it. A fault in the
 * materials, the settings or the groups stops the build (throws); a fault in a component is a problem (skipped: not built).
 * @param {any} file  the cabinets file (format cabinets, version 1)
 * @param {Catalog} catalog
 * @returns {Cabinets}  its groups' nodes, their layout, what is wrong; the pieces to cut, the fronts, the counts
 */
export function cabinetsOf(file, catalog) {
  checkFormat(file, 'cabinets', CABINETS, 'cabinets');
  const stop = stops(file, catalog);
  if (stop.length) throw new Error('cabinets: ' + stop.join(' '));
  const settings = file.settings, materials = file.materials;
  /** @param {string} use */
  const thickness = use => boardOf(catalog.product(materials[use])).thickness;
  const frontThickness = materials.cabinet ? thickness('cabinet') : materials.drawer ? thickness('drawer') : 0;
  /** @type {Problem[]} */
  const problems = [];
  const warn = (/** @type {string} */ text, /** @type {number | null} */ index = null, skipped = false) => { problems.push({ index, text, skipped }); };

  /* ---- the components, read; what cannot be placed is skipped ---- */
  /** @type {Record<string, any>} */
  const groupData = Object.fromEntries(file.groups.map((/** @type {any} */ g) => [String(g.group), g]));
  /** @type {Item[]} */
  const pieces = [];
  (file.components || []).forEach((/** @type {any} */ c, /** @type {number} */ index) => {
    const piece = readComponent(c, index), at = placeOf(piece);
    if (!(String(c.group) in groupData)) return warn(`${at}: no group ${c.group} - skipped.`, index, true);
    if (!Number.isInteger(piece.height)) return warn(`${at}: the height "${c.height}" must be whole mm - skipped.`, index, true);
    if (!piece.type) return warn(`${at}: ${String(c.type ?? '').trim() ? 'unknown type "' + c.type + '"' : 'no type'}; one of: ${TYPES.join(', ')} - skipped.`, index, true);
    for (const set of EXCLUSIVE_TAGS) if (set.filter(t => piece.tags.includes(t)).length > 1) warn(`${at}: the tags ${set.join(', ')} exclude each other.`, index);
    for (const t of piece.tags) if (!TAGS[t].includes(piece.type)) warn(`${at}: the tag ${t} is only for ${TAGS[t].join(', ')}.`, index);
    if (piece.unknownTags.length) warn(`${at}: unknown tag ${piece.unknownTags.join(', ')}.`, index);
    const isFront = FRONT_TYPES.includes(piece.type) && !hasTag(piece, 'open');
    if (hasTag(piece, 'open') && (piece.handle || piece.hinge)) warn(`${at}: an open ${piece.type} has no front: no handle, no hinges.`, index);
    if (piece.handle && !isFront) warn(`${at}: a ${piece.type} has no handle.`, index);
    else if (piece.handle && !SIDES.includes(piece.handle)) warn(`${at}: the handle "${piece.handle}" must be one of ${SIDES.join(', ')}.`, index);
    if (hasTag(piece, 'dishwasher') && piece.carcass) warn(`${at}: a dishwasher has no carcass: no name ${piece.carcass}.`, index);
    if (isFront) {
      if (!piece.gaps || !Object.values(piece.gaps).every(Number.isFinite)) {
        warn(`${at}: a ${piece.type} needs 4 gaps (left, right, top, bottom) - drawn without.`, index);
        piece.gaps = { left: 0, right: 0, top: 0, bottom: 0 };
      } else if (!Object.values(piece.gaps).every(Number.isInteger)) warn(`${at}: the gaps must be whole mm.`, index);
      const hinged = HINGED.includes(openingOf(piece));
      if (hinged && !HINGE_SIDES.includes(piece.hinge)) warn(`${at}: a door needs its hinges' side, left or right.`, index);
      else if (hinged && piece.hinge === piece.handle) warn(`${at}: the hinges and the handle on one side.`, index);
      if (!hinged && piece.hinge) warn(`${at}: only a door has a hinges' side.`, index);
    }
    pieces.push(piece);
  });

  /* ---- the groups: stacked, their geometry (y from the wall), their carcasses ---- */
  /** @type {Group[]} */
  const layout = [];
  const names = new Map();
  for (const g of file.groups) {
    const widths = g.columns;
    widths.forEach((/** @type {number} */ w, /** @type {number} */ i) => { if (!Number.isInteger(w)) warn(`${placeLabel(g.group, i + 1)}: the width "${w}" must be whole mm.`); });
    const { items, skipped, columnX } = stack(widths, pieces.filter(p => p.group === g.group));
    for (const { piece, why } of skipped) warn(`${placeOf(piece)}: the ${piece.type} ${why} - skipped.`, piece.index, true);
    const island = items.some(i => i.type === 'worktop' && hasTag(i, 'island'));
    const carcassBack = g.carcass?.offset ?? settings.carcass.offset, carcassDepth = g.carcass?.depth ?? settings.carcass.depth, carcassFront = carcassBack + carcassDepth;
    const fronted = items.some(i => FRONT_TYPES.includes(i.type) && !hasTag(i, 'open'));
    const frontFace = carcassFront + (fronted ? settings.carcass.frontGap + frontThickness : 0);
    /** @type {Group} */
    const G = { group: g.group, name: g.name || '', widths, columnX, length: columnX[columnX.length - 1], items, island, carcasses: [], worktop: null,
      geometry: { carcassBack, carcassFront, carcassDepth, frontFace, plinthFace: frontFace - (settings.plinth?.setback ?? 0),
        panelFace: carcassFront + (materials.frontPanel ? thickness('frontPanel') : 0) } };
    /* a carcass: every component of the group with its name; its height from its modules */
    /** @type {Map<string, Item[]>} */
    const byName = new Map();
    for (const i of items) if (i.carcass) (byName.get(i.carcass) || byName.set(i.carcass, []).get(i.carcass))?.push(i);
    for (const [name, members] of byName) {
      if (names.has(name)) { warn(`Carcass ${name} in group ${names.get(name)} and in group ${g.group}: one group only.`, members[0].index); continue; }
      names.set(name, g.group);
      const boxes = members.filter(i => BOX_TYPES.includes(i.type)).sort((a, b) => a.h0 - b.h0 || a.x0 - b.x0), upright = boxes.length ? boxes : members;
      const column = Math.min(...members.map(i => i.column)), last = Math.max(...members.map(i => i.column + i.span - 1));
      /** @type {Carcass} */
      const c = { name, group: g.group, column, span: last - column + 1, x0: Math.min(...members.map(i => i.x0)), x1: Math.max(...members.map(i => i.x1)),
        h0: Math.min(...upright.map(i => i.h0)), h1: Math.max(...upright.map(i => i.h1)), boxes, members,
        floor: false, base: false, hung: false, kind: 'wall', flags: [], legs: 0, grille: false };
      const over = (/** @type {Item} */ i) => i.column <= c.column + c.span - 1 && i.column + i.span - 1 >= c.column;
      c.floor = items.some(i => i.type === 'plinth' && over(i) && i.h1 === c.h0);
      c.base = items.some(i => i.type === 'worktop' && over(i) && i.h0 === c.h1);
      c.hung = !c.floor && c.h0 > 0 && items.filter(i => over(i) && i.h1 <= c.h0).every(i => i.type === 'space' && !i.carcass);
      c.kind = c.base ? 'base' : c.floor ? 'tall' : 'wall';
      c.flags = Object.keys(CARCASS_FLAGS).filter(f => boxes.some(b => hasTag(b, ...CARCASS_FLAGS[f])));
      if (c.flags.includes('sink') && c.flags.includes('hob')) warn(`${name}: a sink and a hob in one carcass exclude each other.`, members[0].index);
      c.legs = c.floor ? settings.carcass.legs : 0;
      c.grille = c.floor && boxes.some(b => GRILLE_FOR.types.includes(b.type) || hasTag(b, ...GRILLE_FOR.tags));
      G.carcasses.push(c);
    }
    for (const i of items) if (BOX_TYPES.includes(i.type) && !i.carcass && !hasTag(i, 'dishwasher')) warn(`${placeOf(i)}: the ${i.type} has no carcass name.`, i.index);
    layout.push(G);
  }

  /** @param {string} role */
  const appliance = role => settings.appliances?.[role] ? /** @type {any} */ (catalog.product(settings.appliances[role].product)) : null;
  /** @param {string} use */
  const frameWidth = use => boardOf(catalog.product(materials[use])).frameWidth;
  /** a piece of hardware of the file, the library's product; null none @param {string} kind */
  const hardware = kind => settings.hardware?.[kind] ? /** @type {any} */ (catalog.product(settings.hardware[kind])) : null;
  /** the runners of the family of hardware.runner, shortest first */
  const runners = () => settings.hardware?.runner ? catalog.variants(settings.hardware.runner).map(k => /** @type {any} */ (catalog.product(k))) : [];
  /** a runner's key, in hardware.runner's family @param {any} R */
  const runnerKey = R => /** @type {string} */ (catalog.variants(settings.hardware.runner).find(k => catalog.product(k) === R));
  const built = layout.map(G => groupNode(G, { catalog, settings, materials, thickness, frameWidth, appliance, hardware, runners, runnerKey, frontThickness }, warn));
  const cut = built.flatMap(b => b.pieces), fronts = built.flatMap(b => b.fronts);
  return { groups: built.map(b => b.node), layout, problems, pieces: cut, fronts, counts: countsOf(layout, cut, fronts, built.map(b => b.counts)) };
}

/**
 * What the cabinets hold, counted (room/cabinets.md § 4): from the pieces, the fronts, the components and what each group
 * counted as it was built (the back strips' wall brackets and joints, the plasterboard's profiles, the runners by length,
 * the fittings by kind).
 * @param {Group[]} layout @param {Piece[]} pieces @param {Front[]} fronts @param {Counts[]} partial @returns {Counts}
 */
function countsOf(layout, pieces, fronts, partial) {
  const items = layout.flatMap(G => G.items), carcasses = layout.flatMap(G => G.carcasses);
  const n = (/** @type {string} */ id) => pieces.filter(P => P.id === id).length, sum = (/** @type {(F: Front) => number} */ f) => fronts.reduce((t, F) => t + f(F), 0);
  const system = (/** @type {string} */ k) => sum(F => (F.drawer?.system === k ? 1 : 0)), flag = (/** @type {string} */ f) => carcasses.filter(c => c.flags.includes(f)).length;
  /** @type {Counts} */
  const counts = {
    carcasses: carcasses.length, fronts: n('front'), handles: items.filter(i => i.handle && FRONT_TYPES.includes(i.type) && !hasTag(i, 'open')).length,
    hinges: sum(F => F.hinges.length), bumpers: sum(F => F.bumpers), drawersD: system('drawer'), drawersM: system('drawerM'), boardDrawers: system('board'),
    innerDrawers: sum(F => (F.drawer?.inner ? 1 : 0)), doorDrawers: sum(F => F.doorDrawers?.count || 0),
    shelvesAdjustable: n('adjustableShelf'), shelvesFixed: n('fixedShelf'), pullOutShelves: n('pullOutShelf'),
    legs: carcasses.reduce((t, c) => t + c.legs, 0), hangers: carcasses.filter(c => c.hung).length, sinks: flag('sink'), hobs: flag('hob'), fridges: flag('fridge'),
    grilles: carcasses.filter(c => c.grille).length, type: {}, tag: {}
  };
  for (const i of items) { counts.type[i.type] = (counts.type[i.type] || 0) + 1; for (const t of i.tags) counts.tag[t] = (counts.tag[t] || 0) + 1; }
  /** @param {any} to @param {any} from */
  const add = (to, from) => { for (const [k, v] of Object.entries(from)) if (typeof v === 'number') to[k] = (to[k] || 0) + v; else add(to[k] = to[k] || {}, v); };
  for (const c of partial) add(counts, c);
  counts.shelfPins = counts.fittings.shelfPin || 0;
  return counts;
}

/**
 * @typedef {object} Context  what a group's bodies are made of
 * @property {any} settings
 * @property {Record<string, string>} materials  a use → a board of the library
 * @property {(use: string) => number} thickness
 * @property {(use: string) => number} frameWidth  a shaker front's frame; 0 a plain board
 * @property {(role: string) => any} appliance  an appliance of the file, the library's product; null none
 * @property {(kind: string) => any} hardware  a piece of hardware of the file, the library's product; null none
 * @property {() => any[]} runners  the runners of hardware.runner's family
 * @property {(runner: any) => string} runnerKey  a runner's key
 * @property {Catalog} catalog
 * @property {number} frontThickness
 */
/**
 * A group as nodes. What runs along it (worktop, end panels, wall panel, plasterboard, strips, plinth, front panels) and its
 * carcasses with their modules; a carcass under the worktop or the plasterboard over its columns, measured from it. Each in
 * the design's axes first: a box [x0, x1, y0, y1, h0, h1], y from the wall, its bodies too; then its zero (x0, y0, h0) from
 * its parent's, its size and its bodies, to the model's.
 * Each board's piece to cut is made with its body (piece); each fitting's holes go to the piece they land in.
 * @param {Group} G @param {Context} C @param {(text: string, index?: number | null) => void} warn
 * @returns {{ node: CabinetNode, pieces: Piece[], fronts: Front[], counts: Counts }}
 */
function groupNode(G, C, warn) {
  const { settings, materials, thickness } = C;
  const { carcassBack, carcassFront, frontFace, plinthFace, panelFace } = G.geometry;
  /** @typedef {{ id: string, name: string, type: string, box: number[], layer?: string, item?: Item, children: Draft[], bodies: Body[], product?: string, options?: Record<string, any>, ceiling?: boolean, movers?: import('../types.js').Mover[], mover?: string, holes?: import('../types.js').Hole[] }} Draft  movers: its moving parts (design's axes, from its box's corner); mover: it moves, all of it, with this one; holes: a fitting's, in the group's axes */
  /** @param {string} id @param {string} name @param {string} type @param {number[]} box @param {Item} [item] @returns {Draft} */
  const draft = (id, name, type, box, item) => ({ id, name, type, box, ...(LAYER[type] ? { layer: LAYER[type] } : {}), ...(item ? { item } : {}), children: [], bodies: [] });
  /** @type {Piece[]} */ const pieces = [];
  /** @type {Front[]} */ const fronts = [];
  /** @type {Map<Item, Front>} */ const frontOf = new Map();
  /** @type {Counts} */ const counts = { wallBrackets: 0, jointLength: { screwed: 0, fromInside: 0 }, plasterUD: 0, plasterCD: 0, plasterEdge: 0, runners: {}, fittings: {} };
  /** @param {string} use */
  const lacquered = use => Boolean(/** @type {any} */ (C.catalog.product(materials[use])).lacquered);
  /**
   * A piece to cut: its sizes from its box (or as given), its banded edges on these sides; what it belongs to.
   * @typedef {{ id: string, name: string, carcass?: Carcass, item?: Item, edges?: string[], hand?: 'left' | 'right' | '', size?: number[], front?: Front, column?: number, inner?: number }} Cut
   * @param {string} use @param {number[]} box @param {Cut} o @returns {Piece}
   */
  const piece = (use, box, o) => {
    const { a, b } = o.size ? { a: r1(o.size[0]), b: r1(o.size[1]) } : sizesOf(box), k = o.carcass;
    /** @type {Piece} */
    const P = { id: o.id, name: o.name, use, material: use ? materials[use] : '', a, b, box, group: G.group, carcass: k ? k.name : o.front ? o.item?.carcass || '' : '',
      place: k ? placeLabel(k.group, k.column, k.span) : o.item ? placeOf(o.item) : o.column ? placeLabel(G.group, o.column) : 'G' + G.group, column: k ? k.column : o.column ?? o.item?.column ?? 0,
      ...(o.item ? { item: o.item } : {}), edges: edgesOf(box, o.edges || []), lacquer: null, lacqueredSides: [], factoryEdges: [], hand: o.hand || '', holes: [], holeFrom: null, cutouts: [],
      ...(o.front ? { front: o.front } : {}), ...(o.inner ? { inner: o.inner } : {}) };
    /* what slides out shows its top edge: banded, unless the top is a face (a bottom, the shelf) */
    if (SLIDING.includes(P.id) && sizesOf(box).thin !== 2 && !P.edges.some(e => e.side === 'top')) P.edges.unshift(...edgesOf(box, ['top']).map(e => ({ ...e, length: Math.round(e.length) })));
    pieces.push(P);
    return P;
  };
  /** a lacquered material's edges (LACQUERED): what the room sees of it, its edges banded no more @param {Piece} P @param {{ long: number, short: number }} L @param {string[]} sides */
  const lacquer = (P, L, sides) => { P.lacquer = L; P.lacqueredSides = sides; P.edges = []; };
  /** a board of a use: its body; its piece to cut @param {Draft} d @param {string} use @param {number[]} box @param {string} [layer] @param {Cut} [cut] */
  const board = (d, use, box, layer, cut) => { d.bodies.push({ form: 'box', box, material: 'board:' + materials[use], layer: layer || d.layer || LAYER[use] || 'boards' }); if (cut) piece(use, box, cut); };
  /** @param {Draft} d @param {number[]} box @param {string} material @param {string} layer */
  const solid = (d, box, material, layer) => { d.bodies.push({ form: 'box', box, material, layer }); };
  /** an upright cylinder, or along the axis given @param {Draft} d @param {number} radius @param {number} length @param {number[]} at @param {string} material @param {string} layer @param {number[]} [axis] */
  const cylinder = (d, radius, length, at, material, layer, axis = [0, 0, 1]) => { d.bodies.push({ form: 'cylinder', radius: [radius, radius], length, at, axis, material, layer, segments: 24 }); };
  /**
   * A product, a node of its own drawn by the library: placed by its shape's anchor (its zero, where it has none).
   * @param {string} id @param {string} key  a product of the library @param {number[]} point  design's axes @param {string} layer @param {Record<string, any>} [options] @returns {Draft}
   */
  const product = (id, key, point, layer, options) => {
    const A = /** @type {any} */ (C.catalog.product(key)), S = shapeOf(A, undefined, options), anchor = S.anchor || [0, 0, 0], [x, y, h] = point.map((v, k) => v - anchor[k]);
    const holes = holesOf(A, options).map(o => ({ ...o, at: o.at.map((v, k) => v + point[k]) }));
    counts.fittings[id] = (counts.fittings[id] || 0) + 1;
    return { id, name: A.name, type: 'product', box: [x, x + S.size[0], y, y + S.size[1], h, h + S.size[2]], layer, children: [], bodies: [], product: key, ...(options ? { options } : {}), ...(holes.length ? { holes } : {}) };
  };
  /** a piece of hardware placed (settings.hardware: its product) @param {Draft} d @param {string} kind @param {number[]} point @param {string} layer @param {Record<string, any>} [options] */
  const fit = (d, kind, point, layer, options) => { d.children.push(product(kind, settings.hardware[kind], point, layer, options)); };
  /** an appliance placed (settings.appliances: its product) @param {string} role @param {number[]} point @param {string} layer @param {Record<string, any>} [options] */
  const appliance = (role, point, layer, options) => product({ fridgeFreezer: 'fridge' }[role] || role, settings.appliances[role].product, point, layer, options);
  /** a drawer: all of it slides out toward the front by travel (its runners' length); behind: what opens first (its door, the drawer before an inner one); id: its mover's @param {Draft} d @param {number} travel @param {string} [behind] @param {string} [id] */
  const slides = (d, travel, behind, id = 'drawer') => { d.movers = [{ id, pivot: [0, 0, 0], axis: [0, 1, 0], sign: 1, travel, slide: true, ...(behind ? { behind } : {}) }]; d.mover = id; };
  /** its own box, as one board of its use @param {Draft} d @param {string} use @param {Cut} [cut] */
  const whole = (d, use, cut) => board(d, use, d.box, undefined, cut);
  /**
   * What a front has inside its carcass: a door its hinges (plate and arm on the side or a hinge post, the cup in the door) and
   * the bumpers opposite them; drawers behind a door; a drawer its box (bottom, back, the system's sides, runners, gallery rails,
   * bins; an inner drawer) or a box of board on ball runners. With their holes.
   * @param {Carcass} c @param {Item} m @param {Draft} d  the module's node @param {Draft} k  the carcass's node @param {ReturnType<typeof carcassBoards>} boards
   */
  const inside = (c, m, d, k, boards) => {
    const F = frontOf.get(m);
    if (!F) return;
    const t = thickness('carcass'), opening = openingOf(m), Hg = C.hardware('hinge');
    const f = { x0: F.x0, x1: F.x1, h0: F.h0, h1: F.h1 };
    const reaches = m.hinge === 'left' ? m.x0 === c.x0 : m.x1 === c.x1, gap = frontFace - C.frontThickness - carcassFront;
    if (opening === 'door') {
      if (!reaches && HINGE_SIDES.includes(m.hinge)) {   /* a door short of the carcass's side: a hinge post */
        const px = m.hinge === 'left' ? m.x0 : m.x1 - t;
        board(k, 'carcass', [px, px + t, carcassFront - hingePost(Hg), carcassFront, Math.max(m.h0, c.h0 + t), Math.min(m.h1, c.h1 - t)], 'boards',
          { id: 'hingePost', name: 'Hinge post', carcass: c, edges: ['front'], hand: m.hinge === 'left' ? 'left' : 'right' });
      }
      const hinges = hingeHeights(Hg, f.h0, f.h1, boards.shelves.map(b => (b[4] + b[5]) / 2), t);
      if (!hinges) { warn(`${placeOf(m)}: the front's height ${f.h1 - f.h0} is over the last row of the hinge's perDoor (${settings.hardware.hinge}).`, m.index); return; }
      const right = m.hinge === 'right', side = right ? m.x1 - t : m.x0 + t, edge = right ? side - f.x1 : f.x0 - side;
      const other = right ? c.x0 + t / 2 : c.x1 - t / 2, bumpers = right ? m.x0 === c.x0 : m.x1 === c.x1;
      F.hinges = hinges;
      for (const h of hinges) {
        fit(d, 'hinge', [side, carcassFront, h], 'hardware', { hand: right ? 'right' : 'left', gap, edge });
        if (bumpers) { fit(k, 'bumper', [other, carcassFront, h], 'hardware', { gap }); F.bumpers++; }
      }
      if (hasTag(m, 'doorDrawers')) doorDrawers(c, m, d, k, boards);
      return;
    }
    if (opening !== 'drawer') return;
    if (valueAt(settings, 'drawers.box') === 'board') return boardDrawer(c, m, d, boards, F);
    /* a drawer of a system (hardware.drawer, D; a front up to drawers.frontAbove: hardware.drawerM, M): its bottom and back of
       drawerBox board, on the system's metal, as its maker gives them */
    const S = systemFor(C.hardware('drawer'), C.hardware('drawerM'), f.h1 - f.h0, settings.drawers.frontAbove), kind = S === C.hardware('drawer') ? 'drawer' : 'drawerM';
    const tb = thickness('drawerBox'), innerX0 = c.x0 + t, width = c.x1 - c.x0 - 2 * t, depth = carcassFront - carcassBack;
    /** @type {Record<string, string>} */
    const SIZE = { drawer: 'D', drawerM: 'M' };
    /** a drawer of a system at its bottom h, in the node to: its boards (its bottom, its back) and its metal @param {Draft} to @param {string} kind @param {any} W @param {number} h */
    const drawer = (to, kind, W, h) => {
      const names = ['Drawer bottom', kind === 'innerDrawer' ? 'Inner drawer back' : 'Drawer back ' + SIZE[kind]];
      systemDrawer(W, false, width, tb).boards.forEach((b, j) => board(to, 'drawerBox', [innerX0 + b[0], innerX0 + b[1], carcassBack + b[2], carcassBack + b[3], h + b[4], h + b[5]], 'drawers',
        { id: j ? 'drawerBack' : 'drawerBottom', name: names[j], carcass: c, ...(kind === 'innerDrawer' ? { inner: 1 } : {}) }));
      fit(to, kind, [innerX0, carcassBack, h], 'drawers', { width, depth });
    };
    const bottomH = m.h0 + systemDrawer(S, m.h0 === c.h0, width, tb).lift;
    F.drawer = { system: kind, bins: hasTag(m, 'bins'), inner: hasTag(m, 'innerDrawer') };
    slides(d, travelOf(S));
    drawer(d, kind, S, bottomH);
    if (hasTag(m, 'bins') && settings.hardware.bins) fit(d, 'bins', [innerX0, carcassBack, bottomH + tb], 'drawers', { width, depth });   /* waste bins in it */
    if (hasTag(m, 'innerDrawer')) {   /* an inner drawer over it: on its own runners on the carcass's sides, out after the drawer before it */
      const I = C.hardware('innerDrawer'), h = bottomH + innerOver(S, I), inner = draft('innerDrawer', 'Inner drawer', 'drawer', [innerX0, innerX0 + width, carcassBack, carcassFront, h, m.h1]);
      slides(inner, travelOf(I), 'drawer', 'innerDrawer');
      drawer(inner, 'innerDrawer', I, h);
      d.children.push(inner);
    }
  };
  /**
   * Drawers behind a door (doorDrawers): a spacer on the hinges' side, boxes of drawerBox board on ball runners, as deep as the
   * longest runner of the family of hardware.runner that fits before the hinge's post.
   * @param {Carcass} c @param {Item} m @param {Draft} d @param {Draft} k @param {ReturnType<typeof carcassBoards>} boards
   */
  const doorDrawers = (c, m, d, k, boards) => {
    const S = settings.doorDrawers, t = thickness('carcass'), tb = thickness('drawerBox'), right = m.hinge === 'right';
    if (!(right ? m.x1 === c.x1 : m.x0 === c.x0)) { warn(`${placeOf(m)}: drawers behind the door: the door must reach the carcass's side on its hinges' side.`, m.index); return; }
    const y1 = carcassFront - hingePost(C.hardware('hinge')), R = runnerFor(C.runners(), y1 - carcassBack);
    if (!R) { warn(`${placeOf(m)}: no runner of ${settings.hardware.runner}'s family fits in ${y1 - carcassBack}.`, m.index); return; }
    const { lo, hi } = boards.spaceAround(m.h0, m.h1);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) { warn(`${placeOf(m)}: drawers behind the door: no board over or under it.`, m.index); return; }
    const spacer = right ? [c.x1 - 2 * t, c.x1 - t] : [c.x0 + t, c.x0 + 2 * t];
    board(k, 'carcass', [spacer[0], spacer[1], carcassBack, y1, lo, hi], 'boards', { id: 'spacer', name: 'Spacer', carcass: c, edges: ['front'] });
    const { length, gap } = runnerFit(R), x0 = (right ? c.x0 + t : spacer[1]) + gap, x1 = (right ? spacer[0] : c.x1 - t) - gap, y0 = y1 - length, pitch = (hi - lo) / S.count;
    /** @type {Front} */ (frontOf.get(m)).doorDrawers = { count: S.count, runnerLength: length, boxWidth: x1 - x0, boxHeight: tb + S.sideHeight };
    /** @param {string} id @param {string} name @param {string[]} [edges] @returns {Cut} */
    const cut = (id, name, edges) => ({ id, name: name + ' of a drawer behind the door', carcass: c, ...(edges ? { edges } : {}) });
    for (let j = 0; j < S.count; j++) {
      const h = Math.round(lo + S.lift + j * pitch), top = h + tb + S.sideHeight, next = j + 1 < S.count ? Math.round(lo + S.lift + (j + 1) * pitch) : hi;
      if (top > next) warn(`${placeOf(m)}: the drawer behind the door ${j + 1} (${tb + S.sideHeight}) does not fit under the next board.`, m.index);
      const b = draft('drawer', 'Drawer behind the door', 'drawer', [x0, x1, y0, y1, h, top]);
      slides(b, travelOf(R), 'door');
      board(b, 'drawerBox', [x0, x1, y1 - tb, y1, h, top], 'drawers', cut('doorDrawerFront', 'Front', ['left', 'right']));
      board(b, 'drawerBox', [x0 + tb, x1 - tb, y0, y1 - tb, h, h + tb], 'drawers', cut('doorDrawerBottom', 'Bottom'));
      for (const sx of [x0, x1 - tb]) board(b, 'drawerBox', [sx, sx + tb, y0, y1 - tb, h, top], 'drawers', cut('doorDrawerSide', 'Side'));
      board(b, 'drawerBox', [x0 + tb, x1 - tb, y0, y0 + tb, h + tb, top], 'drawers', cut('doorDrawerBack', 'Back'));
      b.children.push(product('runner', C.runnerKey(R), [x0, y0, h], 'hardware', { width: x1 - x0 }));
      d.children.push(b);
    }
  };
  /**
   * A drawer of board (settings.drawers.box 'board'): a box of drawerBox board on ball runners, as long as the longest runner
   * of the family of hardware.runner that fits, lift over the board under it.
   * @param {Carcass} c @param {Item} m @param {Draft} d @param {ReturnType<typeof carcassBoards>} boards @param {Front} F
   */
  const boardDrawer = (c, m, d, boards, F) => {
    const B = settings.drawers.board, t = thickness('carcass'), tb = thickness('drawerBox'), depth = carcassFront - carcassBack;
    const R = runnerFor(C.runners(), depth - B.setback - B.backClearance);
    if (!R) { warn(`${placeOf(m)}: no runner of ${settings.hardware.runner}'s family fits in ${depth - B.setback - B.backClearance}.`, m.index); return; }
    const { length, gap } = runnerFit(R), x0 = c.x0 + t + gap, x1 = c.x1 - t - gap, y1 = carcassFront - B.setback, y0 = y1 - length;
    const h = m.h0 + (m.h0 === c.h0 ? t : 0) + B.lift, top = h + tb + B.sideHeight;
    if (top > boards.spaceAround(m.h0, m.h1).hi) warn(`${placeOf(m)}: the drawer's box reaches ${top}, over the board above it.`, m.index);
    slides(d, travelOf(R));
    F.drawer = { system: 'board', bins: false, inner: false, runnerLength: length, boxWidth: x1 - x0, boxHeight: tb + B.sideHeight };
    counts.runners[length] = (counts.runners[length] || 0) + 1;
    const seen = F.open ? ['front'] : [];   /* an open drawer shows the front ends of its bottom and its sides: banded */
    board(d, 'drawerBox', [x0, x1, y0, y1, h, h + tb], 'drawers', { id: 'drawerBottom', name: 'Drawer bottom', carcass: c, edges: seen });
    for (const sx of [x0, x1 - tb]) board(d, 'drawerBox', [sx, sx + tb, y0, y1, h + tb, top], 'drawers', { id: 'drawerSide', name: 'Drawer side', carcass: c, edges: seen });
    for (const [b0, b1] of [[y1 - tb, y1], [y0, y0 + tb]]) board(d, 'drawerBox', [x0 + tb, x1 - tb, b0, b1, h + tb, top], 'drawers', { id: 'drawerEnd', name: 'Drawer front and back', carcass: c });
    d.children.push(product('runner', C.runnerKey(R), [x0, y0, h], 'hardware', { width: x1 - x0 }));
  };
  /**
   * A module's front, less its gaps, in the plane of the fronts: a node of its own (front), a shaker's frame round a recessed
   * panel, else one board; its handle. It moves as it opens: a door turns about its hinges' side by the hinge's angle (its
   * mover door); a fridge's or a dishwasher's front with the appliance's door under it (fridge, freezer; door); a drawer's
   * with its drawer.
   * @param {Draft} d @param {Item} i
   */
  const front = (d, i) => {
    const open = hasTag(i, 'open');
    if (!FRONT_TYPES.includes(i.type) || (open ? i.type !== 'drawer' : !i.gaps)) return;
    const g = open || !i.gaps ? { left: 0, right: 0, top: 0, bottom: 0 } : i.gaps, opening = openingOf(i);
    const x0 = i.x0 + g.left, x1 = i.x1 - g.right, h0 = i.h0 + g.bottom, h1 = i.h1 - g.top, y0 = frontFace - C.frontThickness, y1 = frontFace;
    const hand = HINGED.includes(opening) && HINGE_SIDES.includes(i.hinge) ? /** @type {'left' | 'right'} */ (i.hinge) : '';
    /** @type {Front} */
    const F = { item: i, group: G.group, carcass: i.carcass, x0, x1, h0, h1, width: x1 - x0, height: h1 - h0, opening, open, hand, hinges: [], bumpers: 0, drawer: null, doorDrawers: null };
    fronts.push(F);
    frontOf.set(i, F);
    if (x1 - x0 <= 0 || h1 - h0 <= 0) warn(`${placeOf(i)}: the gaps leave no front.`, i.index);
    if (open) return;   /* an open drawer: a front without a panel, its box is what is seen */
    const P = piece(i.type, [x0, x1, y0, y1, h0, h1], { id: 'front', name: 'Front', item: i, hand, front: F, edges: SIDES });
    if (lacquered(i.type)) lacquer(P, LACQUERED.front, SIDES);
    const f = draft('front', 'Front', 'front', [x0, x1, y0, y1, h0, h1]);
    if (opening === 'door' && HINGE_SIDES.includes(i.hinge)) {
      const left = i.hinge === 'left';
      f.movers = [{ id: 'door', pivot: [left ? 0 : x1 - x0, y1 - y0, 0], axis: [0, 0, 1], sign: left ? 1 : -1, travel: travelOf(C.hardware('hinge')) }];
      f.mover = 'door';
    }
    else if (opening === 'fridge') f.mover = hasTag(i, 'freezer') ? 'freezer' : 'fridge';
    else if (opening === 'dishwasher') f.mover = 'door';
    d.children.push(f);
    d = f;
    const w = C.frameWidth(i.type), part = (/** @type {number[]} */ b) => board(d, i.type, b, 'doorsAndDrawers');
    if (!w || x1 - x0 <= 2 * w + 20 || h1 - h0 <= 2 * w + 20) part([x0, x1, y0, y1, h0, h1]);
    else {
      part([x0, x1, y0, y1, h1 - w, h1]); part([x0, x1, y0, y1, h0, h0 + w]); part([x0, x0 + w, y0, y1, h0 + w, h1 - w]); part([x1 - w, x1, y0, y1, h0 + w, h1 - w]);
      part([x0 + w, x1 - w, y0, (y0 + y1) / 2, h0 + w, h1 - w]);   // the panel, recessed
    }
    handle(d, i, x0, x1, h0, h1);
  };
  /** a front's handle (hardware.handle), by its edge (hardwareLayout.handle: axis from the edge; on a side, sideHeight up), its
   * holes through the front @param {Draft} d @param {Item} i @param {number} x0 @param {number} x1 @param {number} h0 @param {number} h1 */
  const handle = (d, i, x0, x1, h0, h1) => {
    const H = settings.hardwareLayout?.handle, at = i.handle;
    if (!H || !at) return;
    const lying = at === 'top' || at === 'bottom';
    const x = lying ? (x0 + x1) / 2 : at === 'left' ? x0 + H.axis : x1 - H.axis, h = lying ? (at === 'top' ? h1 - H.axis : h0 + H.axis) : Math.min(h0 + H.sideHeight, (h0 + h1) / 2);
    fit(d, 'handle', [x, frontFace, h], 'handles', { hand: lying ? 'lying' : at, front: C.frontThickness });
  };
  /** a strip's back strips at the carcasses' backs, cut as the carcasses beside it (upright) or under it (lying) @param {Draft} d @param {Item} i */
  const backStrips = (d, i) => {
    const { x0, x1, h0, h1 } = i, upright = h1 - h0 > x1 - x0, depth = settings.strip.depth;
    const beside = upright ? G.carcasses.filter(c => (c.x0 === x1 || c.x1 === x0) && c.h0 < h1 && c.h1 > h0) : [];
    const under = upright ? [] : G.carcasses.filter(c => c.h1 === h0 && c.x0 < x1 && c.x1 > x0).sort((a, b) => a.x0 - b.x0);
    let spans = upright ? [[h0, h1]] : [[x0, x1]];
    if (under.length) spans = under.map(c => [Math.max(x0, c.x0), Math.min(x1, c.x1)]);
    if (beside.length) {
      const joints = [...new Set(beside.filter(c => beside.some(u => u.h0 === c.h1 && u.x0 === c.x0)).map(c => c.h1))].sort((a, b) => a - b);
      const ends = [Math.max(h0, Math.min(...beside.map(c => c.h0))), ...joints, Math.min(h1, Math.max(...beside.map(c => c.h1)))];
      spans = ends.slice(0, -1).map((a, k) => [a, ends[k + 1]]);
      if (!G.island) counts.wallBrackets += spans.length - 1;   // a bracket at each joint of the stack; the top strip has none
      /* the strip and its back strips screwed to the carcasses on one side, those on the other side from inside */
      const length = (/** @type {Carcass[]} */ Ks) => Ks.reduce((t, c) => t + Math.min(c.h1, h1) - Math.max(c.h0, h0), 0);
      const left = beside.filter(c => c.x1 === x0), right = beside.filter(c => c.x0 === x1);
      counts.jointLength.screwed += length(left.length ? left : right);
      if (left.length) counts.jointLength.fromInside += length(right);
    }
    for (const [s0, s1] of spans) board(d, 'carcass', upright ? [x0, x1, carcassBack, carcassBack + depth, s0, s1] : [s0, s1, carcassBack, carcassBack + depth, h0, h1], 'boards',
      { id: 'backStrip', name: 'Back strip ' + depth, column: i.column, ...(upright ? { size: [depth, s1 - s0] } : {}) });
  };
  /** a front panel's edges the room sees: where a front beside it opens @param {Item} i */
  const seenSides = i => {
    const over = (/** @type {number} */ a0, /** @type {number} */ a1, /** @type {number} */ b0, /** @type {number} */ b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0;
    /** @type {Record<string, (o: Item) => boolean>} */
    const by = { top: o => o.h0 === i.h1 && over(o.x0, o.x1, i.x0, i.x1), bottom: o => o.h1 === i.h0 && over(o.x0, o.x1, i.x0, i.x1),
      left: o => o.x1 === i.x0 && over(o.h0, o.h1, i.h0, i.h1), right: o => o.x0 === i.x1 && over(o.h0, o.h1, i.h0, i.h1) };
    return SIDES.filter(side => G.items.some(o => FRONT_TYPES.includes(o.type) && openingOf(o) !== 'fixed' && by[side](o)));
  };
  /** a front panel's piece (screwed to what is beside it, of no carcass): banded where it is seen, a lacquered one lacquered there @param {number[]} box @param {Item} i */
  const frontPanel = (box, i) => {
    const sides = seenSides(i), P = piece('frontPanel', box, { id: 'frontPanel', name: 'Front panel ' + thickness('frontPanel'), item: i, edges: sides });
    if (lacquered('frontPanel')) {
      const n = (/** @type {string} */ along) => P.edges.filter(e => e.along === along).length;
      lacquer(P, P.a >= P.b ? { long: n('a'), short: n('b') } : { long: n('b'), short: n('a') }, sides);
    }
  };
  /** @type {Draft[]} */
  const along = [];
  /* the worktop: from the wall (the zero) to worktop.overhang before the fronts */
  const top = G.items.find(i => i.type === 'worktop');
  const worktop = top ? { y0: 0, y1: frontFace + settings.worktop.overhang, h1: top.h1 } : null;
  if (top && worktop) {
    const use = G.island ? ISLAND_USE : 'worktop', depth = worktop.y1 - worktop.y0, has = boardOf(C.catalog.product(materials[use])).depth;
    G.worktop = { ...worktop, depth, h0: top.h0, use };
    if (depth > has) warn(`Group ${G.group}: the worktop is ${depth} deep, its board ${materials[use]} ${has}.`);
  }
  /* the cut-outs in the worktop: for the sink and the hob of a base carcass, centred on it, as their makers give them (cutout),
     settings.cutouts.<kind>.fromBack from the worktop's back */
  /** @type {{ kind: string, carcass: Carcass, x0: number, x1: number, y0: number, y1: number }[]} */
  const cutouts = [];
  if (worktop) for (const c of G.carcasses.filter(k => k.base)) for (const kind of ['sink', 'hob'].filter(f => c.flags.includes(f))) {
    const at = settings.cutouts?.[kind], A = C.appliance(kind), xc = (c.x0 + c.x1) / 2;
    if (!at || !A) { warn(`${c.name}: no ${kind} (settings.appliances.${kind}) or no settings.cutouts.${kind}.fromBack.`); continue; }
    const cut = cutoutOf(A);
    cutouts.push({ kind, carcass: c, x0: xc - cut.width / 2, x1: xc + cut.width / 2, y0: worktop.y0 + at.fromBack, y1: worktop.y0 + at.fromBack + cut.depth });
  }
  /** a worktop as boxes round its cut-outs @param {Draft} d @param {string} use */
  const worktopBoards = (d, use) => {
    const [x0, x1, py0, py1, h0, h1] = d.box, holes = cutouts.filter(k => k.x0 >= x0 && k.x1 <= x1);
    const xs = [...new Set([x0, x1, ...holes.flatMap(k => [k.x0, k.x1])])].sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k++) {
      const a = xs[k], b = xs[k + 1];
      let y = py0;
      for (const hole of holes.filter(c => c.x0 <= a && c.x1 >= b).sort((p, q) => p.y0 - q.y0)) { board(d, use, [a, b, y, hole.y0, h0, h1]); y = hole.y1; }
      board(d, use, [a, b, y, py1, h0, h1]);
    }
  };
  /* a worktop's and an end panel's edges the room sees: the front; an island's back; a worktop's end over an end panel (only
     spaces between: the worktop over it), or banded all round (a top in a wet room), less what its maker finishes */
  const onlySpaces = (/** @type {number} */ a, /** @type {number} */ b) => G.items.every(i => i.type === 'space' || i.x1 <= a || i.x0 >= b || (worktop && i.h0 >= /** @type {Item} */ (top).h0));
  const endPanels = G.items.filter(i => i.type === 'endPanel');
  /** @type {Record<string, (i: Item) => boolean>} */
  const endPanelAt = { left: i => endPanels.some(f => f.x0 >= i.x0 && onlySpaces(i.x0, f.x0)), right: i => endPanels.some(f => f.x1 <= i.x1 && onlySpaces(f.x1, i.x1)) };
  /** @param {string} use @param {number[]} box @param {Item} i */
  const topPiece = (use, box, i) => {
    const end = i.type === 'endPanel', seen = ['front', ...(G.island || (!end && hasTag(i, 'banded')) ? ['back'] : []), ...(end ? [] : ['left', 'right'].filter(s => endPanelAt[s](i) || hasTag(i, 'banded')))];
    const factory = /** @type {string[]} */ (/** @type {any} */ (C.catalog.product(materials[use])).factoryEdges || []);
    const P = piece(use, box, { id: i.type, name: end ? 'End panel' : 'Worktop', item: i, edges: seen.filter(e => !factory.includes(e)) });
    P.factoryEdges = seen.filter(e => factory.includes(e));
    return P;
  };
  /** @type {Piece[]} */
  const topPieces = [];
  for (const i of G.items) {
    const { x0, x1, h0, h1 } = i, width = x1 - x0, height = h1 - h0;
    if (i.type === 'worktop' && worktop) {
      const d = draft('worktop', 'Worktop', 'worktop', [x0, x1, worktop.y0, worktop.y1, h0, h1], i), use = G.island ? ISLAND_USE : 'worktop', P = topPiece(use, d.box, i);
      worktopBoards(d, use);
      P.holeFrom = { x: 'left', y: 'back' };
      for (const k of cutouts.filter(k => k.x0 >= x0 && k.x1 <= x1)) P.cutouts.push({ kind: k.kind, width: r1(k.x1 - k.x0), depth: r1(k.y1 - k.y0), x: r1(k.x0 - x0), y: r1(k.y0 - worktop.y0) });
      topPieces.push(P);
      along.push(d);
    }
    else if (i.type === 'endPanel') {
      if (!worktop) { warn(`Group ${G.group}: an end panel with no worktop on it.`, i.index); continue; }
      const y0 = worktop.y0 + (G.island ? settings.worktop.endPanelOverhang : 0), y1 = worktop.y1 - settings.worktop.endPanelOverhang, use = G.island ? ISLAND_END_PANEL_USE : 'endPanel';
      const d = draft('endPanel', 'End panel', 'endPanel', [x0, x1, y0, y1, h0, h1], i); whole(d, use); topPiece(use, d.box, i); along.push(d);
    }
    else if (i.type === 'wallPanel') { const d = draft('wallPanel', 'Wall panel', 'wallPanel', [x0, x1, 0, thickness('wallPanel'), h0, h1], i); whole(d, 'wallPanel', { id: 'wallPanel', name: 'Wall panel ' + thickness('wallPanel'), item: i }); along.push(d); }
    else if (i.type === 'plasterboard') {
      const P = settings.plasterboard, depth = P.depth, d = draft('plasterboard', 'Plasterboard casing', 'plasterboard', [x0, x1, 0, depth, h0, h1], i);
      d.bodies.push({ form: 'box', box: d.box, material: 'plasterWhite', layer: 'plasterboard' });
      /* its face and its return along the long side; the profiles: UD on both fixed edges, CD on the outer edge and across */
      const long = Math.max(width, height), short = Math.min(width, height);
      piece('', d.box, { id: 'plasterboard', name: 'Plasterboard - face', item: i, size: [short, long] });
      piece('', d.box, { id: 'plasterboard', name: 'Plasterboard - side', item: i, size: [depth, long] });
      counts.plasterUD += 2 * long;
      counts.plasterCD += long + (Math.ceil(long / P.studSpacing) + 1) * (depth + short);
      counts.plasterEdge += long;   // its outer edge (a corner bead), its joint to the furniture (a seal)
      along.push(d);
    }
    else if (i.type === 'strip') {
      const d = draft('strip', height > width ? 'Front strip' : 'Horizontal front strip', 'strip', [x0, x1, frontFace - settings.strip.depth, frontFace, h0, h1], i);
      whole(d, 'strip', { id: 'strip', name: (height > width ? 'Front strip ' : 'Horizontal front strip ') + thickness('strip') + ' on edge (depth ' + settings.strip.depth + ')', item: i });
      if (lacquered('strip')) lacquer(pieces[pieces.length - 1], LACQUERED.strip, ['front']);
      if (!i.carcass) backStrips(d, i);
      along.push(d);
    }
    else if (i.type === 'plinth') {
      const d = draft('plinth', 'Plinth', 'plinth', [x0, x1, plinthFace - thickness('plinth'), plinthFace, h0, h1], i); whole(d, 'plinth', { id: 'plinth', name: 'Plinth', item: i });
      if (lacquered('plinth')) lacquer(pieces[pieces.length - 1], LACQUERED.plinth, []);
      along.push(d);
    }
    else if (i.type === 'frontPanel' && !i.carcass) { const d = draft('frontPanel', 'Front panel', 'frontPanel', [x0, x1, frontFace - thickness('frontPanel'), frontFace, h0, h1], i); whole(d, 'frontPanel'); frontPanel(d.box, i); along.push(d); }
  }
  /* an island's back panel: between its end panels, from the floor to the carcasses' tops, on their backs */
  if (G.island && G.carcasses.length) {
    const tops = Math.max(...G.carcasses.map(c => c.h1)), first = Math.min(...G.carcasses.map(c => c.x0)), last = Math.max(...G.carcasses.map(c => c.x1));
    const ends = G.items.filter(i => i.type === 'endPanel'), left = ends.filter(f => f.x1 <= first), right = ends.filter(f => f.x0 >= last);
    const x0 = left.length ? Math.max(...left.map(f => f.x1)) : G.widths[0] || 0, x1 = right.length ? Math.min(...right.map(f => f.x0)) : G.length - (G.widths[G.widths.length - 1] || 0);
    const d = draft('islandBackPanel', 'Island back panel', 'islandBackPanel', [x0, x1, carcassBack - thickness('frontPanel'), carcassBack, 0, tops]);
    whole(d, 'frontPanel', { id: 'islandBackPanel', name: 'Island back panel ' + thickness('frontPanel'), column: 0 });
    along.push(d);
  }
  /* the carcasses, their modules; a dishwasher's bay (no carcass) in the row */
  const covers = (/** @type {Item} */ i, /** @type {Carcass} */ c) => i.column <= c.column && i.column + i.span - 1 >= c.column + c.span - 1;
  /** @type {Draft[]} */
  const units = [];
  for (const c of G.carcasses) {
    const node = draft(c.name, 'Carcass ' + c.name, 'carcass', [c.x0, c.x1, carcassBack, carcassFront, c.h0, c.h1]);
    const boards = carcassBoards(c, G, C, warn, piece), xc = (c.x0 + c.x1) / 2;
    node.bodies.push(...boards.bodies);
    /* shelf pins under the adjustable shelves, at the front and the back of both sides; their holes */
    const at = settings.shelf.pins;
    for (const b of boards.adjustable) for (const [hand, side] of [['left', c.x0 + thickness('carcass')], ['right', c.x1 - thickness('carcass')]]) {
      for (const y of [carcassBack + at.fromBack, carcassFront - at.fromFront]) fit(node, 'shelfPin', [side, y, b[4]], 'shelves', { hand });
    }
    /* the pull-out shelf's runners, between it and the side or the spacer; their holes */
    if (boards.pullOut) {
      const [x0, x1, y0, y1, h0] = boards.pullOut, t = thickness('carcass'), spacer = boards.bodies.find(b => b.layer === 'boards' && b.box && b.box[4] < h0 && b.box[5] > h0 && b.box[1] - b.box[0] === t && b.box[0] > c.x0 + t / 2 && b.box[1] < c.x1 - t / 2);
      const left = spacer && /** @type {number[]} */ (spacer.box)[1] <= x0 ? /** @type {number[]} */ (spacer.box)[1] : c.x0 + t, right = spacer && /** @type {number[]} */ (spacer.box)[0] >= x1 ? /** @type {number[]} */ (spacer.box)[0] : c.x1 - t;
      fit(node, 'pullOut', [x0, carcassFront, h0], 'hardware', { width: x1 - x0, left: x0 - left, right: right - x1 });
    }
    for (const m of c.members) {
      if (BOX_TYPES.includes(m.type)) {
        const d = draft(m.type, m.type[0].toUpperCase() + m.type.slice(1), 'module', [m.x0, m.x1, carcassBack, carcassFront, m.h0, m.h1], m);
        front(d, m);
        inside(c, m, d, node, boards);
        /* an oven, a microwave: on the board under it (on its feet), its fascia before the carcass */
        if ((m.type === 'oven' || m.type === 'microwave') && C.appliance(m.type)) {
          const feet = settings.appliances[m.type].feet || 0, floor = boards.spaceAround(m.h0, m.h1).lo;
          if (!Number.isFinite(floor)) warn(`${placeOf(m)}: the ${m.type} has no board under it.`, m.index);
          else { d.children.push(appliance(m.type, [(m.x0 + m.x1) / 2, carcassFront, floor], m.type, { feet })); m.fit = fitAt(C.appliance(m.type), floor, { feet }); }
        }
        node.children.push(d);
      }
      else if (m.type === 'frontPanel') { const d = draft('frontPanel', 'Front panel', 'frontPanel', [m.x0, m.x1, carcassFront, panelFace, m.h0, m.h1], m); whole(d, 'frontPanel'); frontPanel(d.box, m); node.children.push(d); }
    }
    /* a fridge-freezer on the bottom board, its doors carried by the fronts */
    if (c.flags.includes('fridge') && C.appliance('fridgeFreezer')) {
      node.children.push(appliance('fridgeFreezer', [xc, carcassFront, c.h0 + thickness('carcass')], 'fridge'));
      for (const b of c.boxes.filter(b => hasTag(b, 'fridge', 'freezer'))) b.fit = fitAt(C.appliance('fridgeFreezer'), c.h0 + thickness('carcass'));
    }
    /* a coffee machine on its pull-out shelf, 20 behind its front */
    if (boards.pullOut && C.appliance('coffee')) { const b = boards.pullOut; node.children.push(appliance('coffee', [(b[0] + b[1]) / 2, b[3] - 20, b[5]], 'coffee')); }
    /* the sink and the hob in their cut-outs; the tap behind the sink, the trap under it */
    for (const cut of cutouts.filter(k => k.carcass === c)) {
      const x = (cut.x0 + cut.x1) / 2, y = (cut.y0 + cut.y1) / 2, top = /** @type {{ h1: number }} */ (worktop).h1;
      node.children.push(appliance(cut.kind, [x, y, top], cut.kind));
      if (cut.kind !== 'sink') continue;
      /* the tap behind the sink, installation.sink.tapFromBack from the worktop's back, its spout over the bowl */
      node.children.push(appliance('sinkTap', [x, /** @type {{ y0: number }} */ (worktop).y0 + settings.installation.sink.tapFromBack, top], 'sink'));
      /* the trap under its drain, as its maker lets it fit; its outlet at the wall, at its own height (the wall's outlet there) */
      const fits = trapFit(C.appliance('trap'), y), drain = drainOf(C.appliance('sink'));
      if (!fits) warn(`${c.name}: the sink's drain is ${y} from the wall: too near for the trap.`);
      else node.children.push(appliance('trap', [x + drain[0], y + drain[1], top + drain[2]], 'trap', fits));
    }
    /* a basin on the top over it (settings.cutouts.basin: its back fromBack from the top's back), its tap over its tap's hole */
    const basinCut = c.flags.includes('basin') && c.base && worktop && settings.cutouts?.basin;
    if (basinCut && C.appliance('basin') && worktop) {
      const at = [xc, worktop.y0 + basinCut.fromBack, worktop.h1], tap = holeOf(C.appliance('basin'), 'tap');
      node.children.push(appliance('basin', at, 'basin'));
      /* its holes through the top (its drain, its tap), round */
      const P = topPieces.find(p => p.box[0] <= xc && p.box[1] >= xc);
      if (!P) warn(`${c.name}: no top over it for the basin's holes.`);
      else for (const o of C.appliance('basin').holes.filter((/** @type {any} */ o) => o.diameter)) {
        P.cutouts.push({ kind: 'basin', round: true, width: o.diameter, depth: o.diameter, x: r1(xc + o.along - P.box[0]), y: r1(basinCut.fromBack + o.fromBack) });
        P.holeFrom = { x: 'left', y: 'back' };
      }
      if (C.appliance('basinTap') && tap) node.children.push(appliance('basinTap', at.map((v, k) => v + tap[k]), 'basin'));
    }
    /* legs under a carcass on the plinth (hardwareLayout.leg: from its sides, back and front); a grille in the plinth before it */
    const L = settings.hardwareLayout?.leg;
    if (c.floor && c.legs && settings.hardware.leg && L) for (const x of [c.x0 + L.fromSide, c.x1 - L.fromSide]) for (const y of [carcassBack + L.fromBack, carcassFront - L.fromFront]) fit(node, 'leg', [x, y, 0], 'legs', { height: c.h0 });
    const gl = settings.hardwareLayout?.plinthGrille;
    if (c.grille && settings.hardware.plinthGrille && gl) fit(node, 'plinthGrille', [xc, plinthFace, gl.bottom], 'plinth', { width: c.x1 - c.x0 - 80 });
    /* measured from what lies on the zero over its columns: the worktop, else the plasterboard; else the group */
    const parent = along.find(d => d.type === 'worktop' && d.item && covers(d.item, c)) || along.find(d => d.type === 'plasterboard' && d.item && covers(d.item, c));
    (parent ? parent.children : units).push(node);
  }
  for (const i of G.items) if (hasTag(i, 'dishwasher')) {
    const d = draft('dishwasher', 'Dishwasher bay', 'bay', [i.x0, i.x1, carcassBack, frontFace, i.h0, i.h1], i);
    front(d, i);
    if (C.appliance('dishwasher')) {
      const feet = settings.appliances.dishwasher.feet || 0, D = appliance('dishwasher', [(i.x0 + i.x1) / 2, carcassFront, feet], 'dishwasher');
      i.fit = fitAt(C.appliance('dishwasher'), feet, { feet });
      if (worktop && D.box[5] !== top?.h0) warn(`${placeOf(i)}: the dishwasher on its feet is ${D.box[5]}, the worktop's underside ${top?.h0}.`, i.index);
      d.children.push(D);
    }
    units.push(d);
  }
  /* the hood over the hob, on the wall, its bottom at installation.hood.bottom; its chimney up to the ceiling (the room's) */
  const hob = cutouts.find(k => k.kind === 'hob'), hoodAt = settings.installation?.hood;
  if (hob && C.appliance('hood') && hoodAt && worktop) {
    const d = appliance('hood', [(hob.x0 + hob.x1) / 2, 0, hoodAt.bottom], 'hood', { worktop: hoodAt.bottom - worktop.h1 });
    d.ceiling = true;
    units.push(d);
  }
  const children = [...along, ...units.sort((a, b) => a.box[0] - b.box[0])];
  const all = (/** @type {Draft[]} */ ds) => ds.flatMap(/** @returns {Draft[]} */ d => [d, ...all(d.children)]);
  const every = all(children);
  /** @type {Draft} */
  const group = { id: 'g' + G.group, name: 'G' + G.group + (G.name ? ' · ' + G.name : ''), type: 'cabinetGroup', box: [0, G.length, 0, Math.max(1, ...every.map(d => d.box[3])), 0, Math.max(1, ...every.map(d => d.box[5]))], children, bodies: [] };
  /** ids unique among siblings: the kind, numbered when more @param {Draft[]} list */
  const named = list => {
    /** @type {Record<string, number>} */ const count = {};
    /** @type {Record<string, number>} */ const seen = {};
    for (const d of list) count[d.id] = (count[d.id] || 0) + 1;
    for (const d of list) if (count[d.id] > 1) d.id = d.id + '_' + (seen[d.id] = (seen[d.id] || 0) + 1);
    for (const d of list) named(d.children);
  };
  named([group]);
  /* each fitting's holes in the piece they go into (half a mm in along the hole); a hole into a face, else into an edge */
  for (const d of every) for (const o of d.holes || []) {
    const q = o.at.map((v, k) => v + 0.5 * o.axis[k]), axis = o.axis.findIndex(v => v !== 0);
    const hits = pieces.filter(P => [0, 1, 2].every(k => q[k] > P.box[2 * k] && q[k] < P.box[2 * k + 1]));
    const P = hits.find(P => sizesOf(P.box).thin === axis) || hits[0];
    if (P) holeIn(P, o);
  }
  holeProblems(pieces, warn);
  /** a draft as a node: its zero from its parent's, its size, in the model's axes @param {Draft} d @param {number[]} zero @returns {CabinetNode} */
  const node = (d, zero) => {
    const [x0, x1, y0, y1, h0, h1] = d.box, at = [x0, y0, h0];
    const parts = d.bodies.map(({ layer, ...b }) => partToModel({ ...b, ...(b.box ? { box: b.box.map((v, k) => v - at[k >> 1]) } : {}), ...(b.at ? { at: b.at.map((v, k) => v - at[k]) } : {}),
      ...(layer !== d.layer ? { layer } : {}) }));
    return { id: d.id, name: d.name, type: d.type, offset: pointToModel(at.map((v, k) => v - zero[k])), size: pointToModel([x1 - x0, y1 - y0, h1 - h0]),
      ...(d.layer ? { layer: d.layer } : {}), ...(d.product ? { product: d.product } : {}), ...(d.options ? { options: d.options } : {}), ...(d.ceiling ? { ceiling: true } : {}),
      ...(d.movers ? { movers: d.movers.map(moverToModel) } : {}), ...(d.mover ? { mover: d.mover } : {}),
      ...(parts.length ? { parts } : {}), ...(d.children.length ? { children: d.children.map(c => node(c, at)) } : {}) };
  };
  return { node: node(group, [0, 0, 0]), pieces, fronts, counts };
}

/** an appliance's fit where it stands, its heights from the floor @param {any} A @param {number} h  its anchor's @param {import('../types.js').ShapeOptions} [options] @returns {Fit | undefined} */
function fitAt(A, h, options) {
  const f = fitOf(A, options);
  return f ? /** @type {Fit} */ (Object.fromEntries(Object.entries(f).map(([k, v]) => [k, k === 'feet' ? v : /** @type {number} */ (v) + h]))) : undefined;
}

/**
 * A hole in a piece, given as its maker reads it: into a face of an upright from its front, of a front from its hinges' edge
 * (none: its left), of a lying piece from its left and its back; all from its bottom. Into an edge: along it from its bottom.
 * @param {Piece} P @param {import('../types.js').Hole} o
 */
function holeIn(P, o) {
  const b = P.box, axis = o.axis.findIndex(v => v !== 0), { thin } = sizesOf(b);
  let x = o.at[2] - b[4], y = 0, from;
  if (axis !== thin) { from = 'bottom'; P.holeFrom = P.holeFrom || { x: 'front', y: 'bottom' }; }
  else if (thin === 0) { P.holeFrom = { x: 'front', y: 'bottom' }; x = b[3] - o.at[1]; y = o.at[2] - b[4]; }
  else if (thin === 1) { P.holeFrom = { x: P.hand ? 'hinge' : 'left', y: 'bottom' }; x = P.hand === 'right' ? b[1] - o.at[0] : o.at[0] - b[0]; y = o.at[2] - b[4]; }
  else { P.holeFrom = { x: 'left', y: 'back' }; x = o.at[0] - b[0]; y = o.at[1] - b[2]; }
  P.holes.push({ kind: o.kind, diameter: o.diameter, depth: o.depth, x: r1(x), y: r1(y), at: o.at, axis: o.axis, ...(from ? { from } : {}) });
}

/**
 * The holes that clash: two in one place on a piece (once a pair of kinds and piece), a hole in a side or a post where a board
 * lying flat in its carcass meets it (once a kind and carcass).
 * @param {Piece[]} pieces @param {(text: string) => void} warn
 */
function holeProblems(pieces, warn) {
  /** @type {Set<string>} */ const met = new Set();
  for (const P of pieces.filter(p => p.holes.length)) {
    const bands = pieces.filter(p => p.carcass && p.carcass === P.carcass && HORIZONTAL.includes(p.id)).map(p => [p.box[4], p.box[5]]);
    const hit = P.carcass ? P.holes.find(o => o.axis[0] !== 0 && bands.some(([b0, b1]) => o.at[2] + o.diameter / 2 > b0 && o.at[2] - o.diameter / 2 < b1)) : undefined;
    if (hit && !met.has(P.carcass + '|' + hit.kind)) {
      met.add(P.carcass + '|' + hit.kind);
      warn(`${P.carcass}: ${P.name.toLowerCase()} - a ${hit.kind} hole hits a board lying flat (${hit.x} from the front, ${Math.round(hit.y)} from the bottom).`);
    }
    /** @type {Set<string>} */ const pairs = new Set();
    P.holes.forEach((o, i) => {
      for (const g of P.holes.slice(i + 1).filter(g => !g.from === !o.from && Math.hypot(g.x - o.x, g.y - o.y) < (g.diameter + o.diameter) / 2 + 1)) {
        if (pairs.has(o.kind + '|' + g.kind)) continue;
        pairs.add(o.kind + '|' + g.kind);
        warn(`${P.carcass || P.place}: ${P.name.toLowerCase()} - a ${o.kind} hole and a ${g.kind} hole in one place (${o.x} from the ${P.holeFrom?.x}, ${Math.round(o.y)} from the bottom).`);
      }
    });
  }
}

/**
 * A carcass's boards (room/cabinets.md § 3), in its group's design axes: its sides and bottom; on top two rails (a base: flat, on
 * edge over a sink or a hob, with the panel under the hob) or a top board; its backs behind doors and open shelves; fixed shelves
 * at the joints of its modules (over an oven shallower, under one lower; a fridge's on the appliance); the inset panels of its
 * spaces; the shelves behind its doors (by the front's height, or on the room's grid); a coffee machine's pull-out shelf and
 * spacer.
 * Each with its piece to cut (piece: the group's).
 * @param {Carcass} carcass @param {Group} G @param {Context} C @param {(text: string, index?: number | null) => void} warn
 * @param {(use: string, box: number[], cut: { id: string, name: string, carcass?: Carcass, edges?: string[], hand?: 'left' | 'right' | '' }) => Piece} piece
 * @returns {{ bodies: Body[], spaceAround: (a: number, b: number) => { lo: number, hi: number }, pullOut: number[] | null, shelves: number[][], adjustable: number[][] }}
 *   its boards; the clear space round a module; the pull-out shelf's box; its shelves' boxes (every one; the adjustable ones)
 */
function carcassBoards(carcass, G, C, warn, piece) {
  const { settings, materials, thickness } = C, { carcassBack, carcassFront, carcassDepth } = G.geometry;
  const board = thickness('carcass'), half = board / 2, boardDrawers = valueAt(settings, 'drawers.box') === 'board';
  const { x0, x1, h0, h1 } = carcass, height = h1 - h0, innerX0 = x0 + board, innerX1 = x1 - board, innerWidth = innerX1 - innerX0;
  const rails = settings.crossRails, shelf = settings.shelf, backPanel = settings.backPanel;
  /** @type {(Body & { id: string })[]} */
  const out = [];
  /** a board: its body, its piece (its name, its banded edges) @param {string} id @param {string} name @param {string} use @param {number[]} box @param {string} [layer] @param {string[]} [edges] @param {'left' | 'right' | ''} [hand] */
  const part = (id, name, use, box, layer = 'boards', edges = [], hand = '') => {
    out.push({ id, form: 'box', box, material: 'board:' + materials[use], layer });
    piece(use, box, { id, name, carcass, edges, hand });
  };
  const FRONT = ['front'];
  part('side', 'Side', 'carcass', [x0, innerX0, carcassBack, carcassFront, h0, h1], 'boards', FRONT, 'left');
  part('side', 'Side', 'carcass', [innerX1, x1, carcassBack, carcassFront, h0, h1], 'boards', FRONT, 'right');
  part('bottomBoard', 'Bottom board', 'carcass', [innerX0, innerX1, carcassBack, carcassFront, h0, h0 + board], 'boards', FRONT);
  const flags = carcass.flags, sink = flags.includes('sink'), hob = flags.includes('hob'), fridge = flags.includes('fridge'), rail = 'cross rail ' + rails?.depth;
  /* a base's rails: on edge over a sink or a hob (the front one shows its bottom edge as the drawer under it opens), else flat */
  if (carcass.base && sink) {
    part('crossRail', 'Front ' + rail + ', on edge', 'carcass', [innerX0, innerX1, carcassFront - board, carcassFront, h1 - rails.depth, h1], 'boards', ['bottom']);
    part('crossRail', 'Back ' + rail + ', on edge', 'carcass', [innerX0, innerX1, carcassBack, carcassBack + board, h1 - rails.depth, h1]);
  } else if (carcass.base && hob) {
    part('crossRail', 'Front cross rail ' + rails.hobFront + ', on edge', 'carcass', [innerX0, innerX1, carcassFront - board, carcassFront, h1 - rails.hobFront, h1], 'boards', ['bottom']);
    part('crossRail', 'Back ' + rail + ', on edge', 'carcass', [innerX0, innerX1, carcassBack, carcassBack + board, h1 - rails.depth, h1]);
    part('hobPanel', 'Panel under the hob', 'hobPanel', [innerX0, innerX1, carcassBack + board + rails.hobPanelGap, carcassFront - board, h1 - rails.hobFront, h1 - rails.hobFront + thickness('hobPanel')]);
  } else if (carcass.base) {
    part('crossRail', 'Front ' + rail, 'carcass', [innerX0, innerX1, carcassFront - rails.depth, carcassFront, h1 - board, h1], 'boards', FRONT);
    part('crossRail', 'Back ' + rail, 'carcass', [innerX0, innerX1, carcassBack, carcassBack + rails.depth, h1 - board, h1]);
  } else part('topBoard', 'Top board', 'carcass', [innerX0, innerX1, carcassBack, carcassFront, h1 - board, h1], 'boards', FRONT);

  /* the back: behind doors and open shelves, behind drawers of board; one piece a run */
  const runs = carcass.boxes.filter(b => (b.type === 'cabinet' && !hasTag(b, 'fridge', 'freezer')) || (b.type === 'drawer' && (hasTag(b, 'open') || boardDrawers)))
    .map(b => [Math.max(h0, b.h0), Math.min(h1, b.h1)]).sort((a, b) => a[0] - b[0])
    .reduce((/** @type {number[][]} */ r, span) => { const last = r[r.length - 1]; if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]); else r.push([...span]); return r; }, []);
  for (const [s0, s1] of runs) part('backPanel', 'Back panel', 'backPanel', [x0 + backPanel.inset, x1 - backPanel.inset, carcassBack - thickness('backPanel'), carcassBack, s0 + backPanel.inset, s1 - backPanel.inset], 'backs');

  /** a fixed shelf, its top at top, gap of air behind it @param {number} top @param {number} gap */
  const fixedShelf = (top, gap) => part('fixedShelf', 'Fixed shelf', 'carcass', [innerX0, innerX1, carcassBack + gap, carcassFront, top - board, top], 'shelves', FRONT);
  if (!carcass.base && !fridge) {
    const drawerAt = (/** @type {number} */ h) => carcass.boxes.some(b => b.type === 'drawer' && (b.h0 === h || b.h1 === h)) && carcass.boxes.filter(b => b.h0 === h || b.h1 === h).every(b => b.type === 'drawer');
    for (const joint of [...new Set(carcass.boxes.map(b => b.h0))].filter(j => j > h0 && !drawerAt(j))) {
      const vented = carcass.boxes.some(b => b.h1 === joint && b.type === 'oven');
      fixedShelf(carcass.boxes.some(b => b.h0 === joint && b.type === 'oven') ? joint : joint + half, vented ? shelf.ventGap : 0);
    }
  }
  const fridgeBody = fridge && C.appliance('fridgeFreezer') ? bodyOf(C.appliance('fridgeFreezer'))[2] : null;
  if (fridgeBody) {
    const top = h0 + board + fridgeBody + board;
    if (top > h1 - board) warn(`${carcass.name}: the fridge ${fridgeBody} does not fit the carcass (inside ${height - 2 * board}).`);
    else fixedShelf(top, shelf.ventGap);
  }

  /* a space at an end of the carcass (the hidden end of an L): an inset panel closes its front; spaces only: one over its width */
  const topThickness = carcass.base && sink ? rails.depth : carcass.base && hob ? rails.hobFront : board;
  const spaces = carcass.members.filter(i => i.type === 'space');
  for (const f of carcass.boxes.length ? spaces : spaces.slice(0, 1)) {
    const right = f.x1 === carcass.x1, none = !carcass.boxes.length;
    const s0 = none || !right ? innerX0 : Math.max(...carcass.boxes.map(b => b.x1)), s1 = none || right ? innerX1 : Math.min(...carcass.boxes.map(b => b.x0));
    part('insetPanel', 'Inset panel', 'carcass', [s0, s1, carcassFront - board, carcassFront, h0 + board, h1 - topThickness]);
  }

  /** an adjustable shelf, over the whole carcass @param {number} centre */
  const adjustableShelf = centre => { part('adjustableShelf', 'Adjustable shelf', 'carcass', [innerX0 + shelf.clearance, innerX1 - shelf.clearance, carcassBack, carcassFront - shelf.setback, centre - half, centre + half], 'shelves', FRONT); };
  /** the clear space round a module: the nearest boards lying flat under and over its middle @param {number} a @param {number} b */
  const spaceAround = (a, b) => {
    const mid = (a + b) / 2, flat = out.filter(p => ['bottomBoard', 'topBoard', 'crossRail', 'fixedShelf', 'hobPanel'].includes(p.id)).map(p => { const b = /** @type {number[]} */ (p.box); return [b[4], b[5]]; });
    const below = flat.filter(([p, q]) => (p + q) / 2 <= mid).map(([, q]) => q), above = flat.filter(([p, q]) => (p + q) / 2 > mid).map(([p]) => p);
    return { lo: below.length ? Math.max(...below) : NaN, hi: above.length ? Math.min(...above) : NaN };
  };
  /** a coffee machine: a pull-out shelf on the board under the door, a spacer on the hinge side, shelves over it @param {Item} door @param {number} lo @param {number} hi */
  const pullOutShelf = (door, lo, hi) => {
    const P = settings.pullOutShelf, shelfH = lo + P.lift;
    let s0 = innerX0, s1 = innerX1;
    if (!(door.hinge === 'left' ? door.x0 === carcass.x0 : door.x1 === carcass.x1)) warn(`${placeOf(door)}: a coffee machine: the door must reach the carcass's side on its hinges' side.`, door.index);
    else {
      const spacer = door.hinge === 'right' ? [x1 - 2 * board, x1 - board] : [x0 + board, x0 + 2 * board], top = shelfH + board + P.spacerAbove;
      part('spacer', 'Spacer', 'carcass', [spacer[0], spacer[1], carcassBack, carcassFront, lo, top], 'boards', ['front', 'top']);   // its top seen over the shelf
      if (door.hinge === 'right') s1 = spacer[0]; else s0 = spacer[1];
    }
    const R = pullOutFit(C.hardware('pullOut'));   /* on its runners: as long as they, their gap each side */
    part('pullOutShelf', 'Pull-out shelf', 'carcass', [s0 + R.gap, s1 - R.gap, carcassFront - R.length, carcassFront, shelfH, shelfH + board], 'shelves', FRONT);
    const above = shelfH + board + P.machineHeight;
    for (let j = 0; j < P.shelvesAbove; j++) adjustableShelf(Math.round(above + ((hi - above) * j) / P.shelvesAbove));
  };
  if (shelf.grid && !sink && !fridge) {
    const { from, pitch, fixedEvery } = shelf.grid, onGrid = (/** @type {number} */ t) => Number.isInteger((t - from) / pitch), placed = new Set();
    for (const b of carcass.boxes) {
      if (b.type !== 'cabinet' || hasTag(b, 'doorDrawers', 'coffee')) continue;
      const { lo, hi } = spaceAround(b.h0, b.h1);
      for (let k = Math.max(1, Math.floor((lo - from) / pitch) + 1); from + k * pitch <= hi; k++) {
        const top = from + k * pitch;
        if (top - board <= lo || placed.has(top)) continue;
        placed.add(top);
        if (k % fixedEvery === 0) fixedShelf(top, 0); else adjustableShelf(top - half);
      }
    }
    if (!onGrid(h1)) warn(`${carcass.name}: the top ${h1} is not on the shelf grid (${from} + k × ${pitch}).`);
  } else if (!sink && !fridge) {
    for (const b of carcass.boxes) {
      if (b.type !== 'cabinet' || hasTag(b, 'doorDrawers')) continue;
      const { lo, hi } = spaceAround(b.h0, b.h1);
      if (hasTag(b, 'coffee')) { pullOutShelf(b, lo, hi); continue; }
      const gaps = b.gaps || { top: 0, bottom: 0 }, frontHeight = b.h1 - b.h0 - gaps.top - gaps.bottom;
      const row = shelf.perDoor.find((/** @type {any} */ r) => r.maxHeight === undefined || frontHeight <= r.maxHeight);
      if (!row) { warn(`${placeOf(b)}: the front's height ${frontHeight} is over the last row of settings.shelf.perDoor.`, b.index); continue; }
      for (let j = 1; j <= row.count; j++) adjustableShelf(Math.round(lo + ((hi - lo) * j) / (row.count + 1)));
    }
  }
  const pullOut = /** @type {number[] | undefined} */ (out.find(b => b.id === 'pullOutShelf')?.box) || null;
  const of = (/** @type {string[]} */ ids) => out.filter(b => ids.includes(b.id)).map(b => /** @type {number[]} */ (b.box));
  return { bodies: out.map(({ id, ...b }) => b), spaceAround, pullOut, shelves: of(['adjustableShelf', 'fixedShelf', 'pullOutShelf']), adjustable: of(['adjustableShelf']) };
}
