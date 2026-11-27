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
// plinths, the worktop's cut-outs; the handles, legs and plinth grilles; the tap and the trap. The appliances are nodes of
// their own, drawn by the library (library/shapes.js): built in their carcass, in the worktop's cut-outs, the hood over the hob
// (up to the ceiling: room/assembly.js). The drawers' boxes, the hinges, runners and holes come later.

import { pointToModel, partToModel } from '../core/tools.js';
import { shapeOf } from '../library/shapes.js';

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
 */
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
 */
/** @typedef {Omit<HierarchyNode, 'children'> & { children?: CabinetNode[], parts?: import('../types.js').Part[] }} CabinetNode  a node of the furniture; parts: its bodies, in its axes */
/** @typedef {import('../types.js').Part & { layer: string }} Body  a body in the design's axes of its group (y from the wall): a box or a cylinder */

const VERSION = 1;   // of the format cabinets

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
/** @type {Record<string, string>} what a node is, by its kind: its layer (layers.json) */
const LAYER = { worktop: 'worktop', endPanel: 'endPanels', wallPanel: 'wallPanel', strip: 'strips', frontPanel: 'frontPanels', islandBackPanel: 'frontPanels',
  plinth: 'plinth', plasterboard: 'plasterboard', carcass: 'boards' };

/* the settings a file needs, by what it holds (has): [when, dotted paths] */
const DRILLING_SHELF_PIN = ['drilling.shelfPin.diameter', 'drilling.shelfPin.depth', 'drilling.shelfPin.fromFront', 'drilling.shelfPin.fromBack', 'drilling.shelfPin.belowShelf'];
const DRILLING_RUNNER = ['drilling.runner.diameter', 'drilling.runner.depth', 'drilling.runner.fromFront', 'drilling.runner.belowDrawer'];
/** @type {[(has: any) => boolean, string[]][]} */
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

/* ================= small helpers ================= */

/** a value by its dotted path; undefined where there is none @param {any} o @param {string} dotted */
const valueAt = (o, dotted) => dotted.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);
/** @param {{ tags: string[] }} item @param {...string} tags */
const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));
/** a place as written: G1[4] group 1, column 4; G1[1-11] @param {number | string} group @param {number} column @param {number} [span] */
const placeLabel = (group, column, span = 1) => `G${group}[${column}${span > 1 ? '-' + (column + span - 1) : ''}]`;
/** @param {Item} item */
const placeOf = item => placeLabel(item.group, item.column, item.span);
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
    if (!(m.thickness > 0)) problems.push(`materials.${use}: ${key} has no thickness.`);
    if (DEPTH_USES.includes(use) && !(m.depth > 0 || m.width > 0)) problems.push(`materials.${use}: ${key} needs a depth (or a sheet's width).`);
  }
  for (const use of usesNeeded(file)) if (!materials[use]) problems.push(`materials: none for ${use}.`);
  const thick = new Set(FRONT_TYPES.filter(t => materials[t]).map(t => { try { return /** @type {any} */ (catalog.product(materials[t])).thickness; } catch { return null; } }));
  if (thick.size > 1) problems.push(`materials: the fronts (${FRONT_TYPES.join(', ')}) need one thickness: the plane of the fronts.`);
  const needed = new Set(REQUIRED_SETTINGS.filter(([need]) => need(has)).flatMap(([, paths]) => paths));
  for (const path of needed) if (valueAt(settings, path) === undefined) problems.push(`settings: ${path} missing.`);
  for (const path of ['shelf.perDoor', 'hinges.perDoor']) {
    const table = valueAt(settings, path);
    const row = (/** @type {any} */ r, /** @type {boolean} */ last) => r && Number.isInteger(r.count) && (last ? r.maxHeight === undefined : r.maxHeight > 0);
    if (table !== undefined && !(Array.isArray(table) && table.length && table.every((r, i) => row(r, i === table.length - 1)))) problems.push(`settings: ${path} must be [{maxHeight, count}, …, {count}].`);
  }
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
 * @returns {{ groups: CabinetNode[], layout: Group[], problems: Problem[] }}
 */
export function cabinetsOf(file, catalog) {
  if (file?.format !== 'cabinets' || file.version !== VERSION) throw new Error(`cabinets: ${file?.format} ${file?.version}, the code reads cabinets ${VERSION}`);
  const stop = stops(file, catalog);
  if (stop.length) throw new Error('cabinets: ' + stop.join(' '));
  const settings = file.settings, materials = file.materials;
  /** @param {string} use */
  const thickness = use => /** @type {any} */ (catalog.product(materials[use])).thickness;
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
    const G = { group: g.group, name: g.name || '', widths, columnX, length: columnX[columnX.length - 1], items, island, carcasses: [],
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
  const frameWidth = use => /** @type {any} */ (catalog.product(materials[use])).frameWidth || 0;
  /** a piece of hardware of the file, the library's product; null none @param {string} kind */
  const hardware = kind => settings.hardware?.[kind] ? /** @type {any} */ (catalog.product(settings.hardware[kind])) : null;
  return { groups: layout.map(G => groupNode(G, { settings, materials, thickness, frameWidth, appliance, hardware, frontThickness }, warn)), layout, problems };
}

/**
 * @typedef {object} Context  what a group's bodies are made of
 * @property {any} settings
 * @property {Record<string, string>} materials  a use → a board of the library
 * @property {(use: string) => number} thickness
 * @property {(use: string) => number} frameWidth  a shaker front's frame; 0 a plain board
 * @property {(role: string) => any} appliance  an appliance of the file, the library's product; null none
 * @property {(kind: string) => any} hardware  a piece of hardware of the file, the library's product; null none
 * @property {number} frontThickness
 */
/**
 * A group as nodes. What runs along it (worktop, end panels, wall panel, plasterboard, strips, plinth, front panels) and its
 * carcasses with their modules; a carcass under the worktop or the plasterboard over its columns, measured from it. Each in
 * the design's axes first: a box [x0, x1, y0, y1, h0, h1], y from the wall, its bodies too; then its zero (x0, y0, h0) from
 * its parent's, its size and its bodies, to the model's.
 * @param {Group} G @param {Context} C @param {(text: string, index?: number | null) => void} warn @returns {CabinetNode}
 */
function groupNode(G, C, warn) {
  const { settings, materials, thickness } = C;
  const { carcassBack, carcassFront, frontFace, plinthFace, panelFace } = G.geometry;
  /** @typedef {{ id: string, name: string, type: string, box: number[], layer?: string, item?: Item, children: Draft[], bodies: Body[], product?: string, options?: Record<string, any>, ceiling?: boolean }} Draft */
  /** @param {string} id @param {string} name @param {string} type @param {number[]} box @param {Item} [item] @returns {Draft} */
  const draft = (id, name, type, box, item) => ({ id, name, type, box, ...(LAYER[type] ? { layer: LAYER[type] } : {}), ...(item ? { item } : {}), children: [], bodies: [] });
  /** a board of a use: its body @param {Draft} d @param {string} use @param {number[]} box @param {string} [layer] */
  const board = (d, use, box, layer) => { d.bodies.push({ form: 'box', box, material: 'board:' + materials[use], layer: layer || d.layer || LAYER[use] || 'boards' }); };
  /** @param {Draft} d @param {number[]} box @param {string} material @param {string} layer */
  const solid = (d, box, material, layer) => { d.bodies.push({ form: 'box', box, material, layer }); };
  /** an upright cylinder, or along the axis given @param {Draft} d @param {number} radius @param {number} length @param {number[]} at @param {string} material @param {string} layer @param {number[]} [axis] */
  const cylinder = (d, radius, length, at, material, layer, axis = [0, 0, 1]) => { d.bodies.push({ form: 'cylinder', radius: [radius, radius], length, at, axis, material, layer, segments: 24 }); };
  /**
   * An appliance, a node of its own drawn by the library: its zero at the back, left, bottom of its shape.
   * @param {string} role @param {any} A @param {number[]} zero  design's axes @param {string} layer @param {Record<string, any>} [options] @returns {Draft}
   */
  const product = (role, A, zero, layer, options) => {
    const size = shapeOf(A, undefined, options).size, [x, y, h] = zero;
    return { id: role, name: A.name, type: 'product', box: [x, x + size[0], y, y + size[1], h, h + size[2]], layer, children: [], bodies: [],
      product: C.settings.appliances[role === 'fridge' ? 'fridgeFreezer' : role].product, ...(options ? { options } : {}) };
  };
  /** its own box, as one board of its use @param {Draft} d @param {string} use */
  const whole = (d, use) => board(d, use, d.box);
  /** a hole's marker (layer Holes): a disc on the drilled face, 0.6 proud; a small one 12 across @param {Draft} d @param {number} x @param {number} y @param {number} h @param {number} r @param {string} marker @param {number[]} axis */
  const hole = (d, x, y, h, r, marker, axis) => cylinder(d, Math.max(r, 6), 1, [x, y, h], marker, 'holes', axis);
  /**
   * What a front has inside its carcass: a door its hinges (plate and arm on the side or a hinge post, the cup in the door) and
   * the bumpers opposite them; drawers behind a door; a drawer its box (bottom, back, the system's sides, runners, gallery rails,
   * bins; an inner drawer) or a box of board on ball runners. With their holes.
   * @param {Carcass} c @param {Item} m @param {Draft} d  the module's node @param {Draft} k  the carcass's node @param {ReturnType<typeof carcassBoards>} boards
   */
  const inside = (c, m, d, k, boards) => {
    if (!FRONT_TYPES.includes(m.type) || !m.gaps) return;
    const t = thickness('carcass'), opening = openingOf(m), drill = settings.drilling;
    const f = { x0: m.x0 + m.gaps.left, x1: m.x1 - m.gaps.right, h0: m.h0 + m.gaps.bottom, h1: m.h1 - m.gaps.top };
    const reaches = m.hinge === 'left' ? m.x0 === c.x0 : m.x1 === c.x1, doorBack = frontFace - C.frontThickness;
    if (opening === 'door') {
      if (!reaches && HINGE_SIDES.includes(m.hinge)) {   /* a door short of the carcass's side: a hinge post */
        const px = m.hinge === 'left' ? m.x0 : m.x1 - t;
        board(k, 'carcass', [px, px + t, carcassFront - settings.hinges.postDepth, carcassFront, Math.max(m.h0, c.h0 + t), Math.min(m.h1, c.h1 - t)], 'boards');
      }
      const height = f.h1 - f.h0, row = settings.hinges.perDoor.find((/** @type {any} */ r) => r.maxHeight === undefined || height <= r.maxHeight);
      if (!row) { warn(`${placeOf(m)}: the front's height ${height} is over the last row of settings.hinges.perDoor.`, m.index); return; }
      const reach = t / 2 + settings.hinges.aboveShelf, shelves = boards.shelves.map(b => (b[4] + b[5]) / 2).filter(h => h > f.h0 && h < f.h1);
      const hinges = Array.from({ length: row.count }, (_, j) => Math.round(f.h0 + settings.hinges.fromEnd + ((height - 2 * settings.hinges.fromEnd) * j) / (row.count - 1)))
        .map(h => { const hit = shelves.find(s => Math.abs(h - s) < reach); return hit === undefined ? h : Math.ceil(hit + reach); });   // a hinge at a shelf: over it
      const right = m.hinge === 'right', side = right ? m.x1 - t : m.x0 + t, dir = right ? -1 : 1, span = (/** @type {number} */ a, /** @type {number} */ b) => [Math.min(a, b), Math.max(a, b)];
      const cupX = right ? f.x1 - drill.cup.fromEdge : f.x0 + drill.cup.fromEdge, cup = C.hardware('hinge'), cupR = drill.cup.diameter / 2 - 0.5;
      const other = right ? c.x0 + t / 2 : c.x1 - t / 2, bumpers = right ? m.x0 === c.x0 : m.x1 === c.x1, gap = doorBack - carcassFront, br = drill.bumper.diameter / 2 + 1.5;
      for (const h of hinges) {
        solid(k, [...span(side, side + dir * 10), carcassFront - 75, carcassFront - 30, h - 22, h + 22], 'zinc', 'hardware');   // the mounting plate
        solid(k, [...span(side + dir * 3, side + dir * 20), carcassFront - 70, carcassFront - 2, h - 9, h + 9], 'zinc', 'hardware');   // the arm
        cylinder(d, cupR, cup?.cupDepth || 11.5, [cupX, doorBack + (cup?.cupDepth || 11.5) / 2, h], 'zinc', 'hardware', [0, 1, 0]);   // the cup, in the door
        cylinder(d, 24, 1.5, [cupX, carcassFront - 1, h], 'zinc', 'hardware', [0, 1, 0]);
        for (const dh of [-drill.plate.spacing / 2, drill.plate.spacing / 2]) hole(k, side, carcassFront - drill.plate.fromFront, h + dh, drill.plate.diameter / 2, 'markerHinge', [1, 0, 0]);
        hole(d, cupX, doorBack - 0.6, h, drill.cup.diameter / 2, 'markerHinge', [0, 1, 0]);
        if (bumpers) { cylinder(k, br, gap - 0.2, [other, carcassFront + (gap - 0.2) / 2, h], 'gasket', 'hardware', [0, 1, 0]); hole(k, other, carcassFront + 0.6, h, drill.bumper.diameter / 2, 'markerHinge', [0, 1, 0]); }
      }
      if (hasTag(m, 'doorDrawers')) doorDrawers(c, m, d, k, boards);
      return;
    }
    if (opening !== 'drawer') return;
    if (valueAt(settings, 'drawers.box') === 'board') return boardDrawer(c, m, d, boards);
    /* a drawer of the system (hardware.drawer): its bottom and back of drawerBox board on the system's sides and runners */
    const D = settings.drawers, Dw = C.hardware('drawer'), tb = thickness('drawerBox'), size = f.h1 - f.h0 > D.D.frontAbove ? 'D' : 'M';
    const innerX0 = c.x0 + t, innerX1 = c.x1 - t, by0 = carcassBack + D.bottom.fromBack, by1 = by0 + D.bottom.depth, inner = hasTag(m, 'innerDrawer');
    const bottomH = m.h0 + (m.h0 === c.h0 ? D.liftAtBottom : D.liftAbove), sideHeight = D[size].sideHeight;
    /** @param {number} h @param {number} backHeight */
    const box = (h, backHeight) => {
      board(d, 'drawerBox', [innerX0 + D.bottom.inset / 2, innerX1 - D.bottom.inset / 2, by0, by1, h, h + tb], 'drawers');
      board(d, 'drawerBox', [innerX0 + D.back.inset / 2, innerX1 - D.back.inset / 2, by0, by0 + tb, h + tb, h + tb + backHeight], 'drawers');
    };
    box(bottomH, D[size].backHeight);
    if (!Dw) return;
    const s0 = Dw.sideFromCarcass, s1 = s0 + Dw.sideThickness, y0 = carcassBack + Dw.fromBack, y1 = carcassFront - Dw.fromFront;
    /** the runners and the sides at a drawer's bottom h @param {number} h @param {number} top */
    const system = (h, top) => {
      for (const [a, b] of [[innerX0, innerX0 + s0], [innerX1 - s0, innerX1]]) solid(k, [a, b, y0, y1 + 2, h - 24, h - 6], 'zinc', 'hardware');
      for (const [a, b] of [[innerX0 + s0, innerX0 + s1], [innerX1 - s1, innerX1 - s0]]) solid(d, [a, b, y0, y1, h - 4, top], 'drawerSide', 'drawers');
      for (const x of [c.x0 + t, c.x1 - t]) for (const fr of drill.runner.fromFront) hole(k, x, carcassFront - fr, h - drill.runner.belowDrawer, drill.runner.diameter / 2, 'markerRunner', [1, 0, 0]);
    };
    system(bottomH, bottomH + sideHeight - 4);
    if (size === 'D') for (const [a, b] of [[innerX0 + 28, innerX0 + 32], [innerX1 - 32, innerX1 - 28]]) solid(d, [a, b, carcassBack + 46, carcassFront - 24, bottomH + sideHeight - 4, bottomH + sideHeight + 60], 'drawerSide', 'drawers');
    const bins = settings.hardwareLayout?.bins;
    if (hasTag(m, 'bins') && bins) {   /* waste bins side by side, 10 apart, open at the top */
      const x0 = innerX0 + 45, x1 = innerX1 - 45, ya = carcassBack + 66, yb = carcassFront - 40, h0 = bottomH + tb, h1 = h0 + bins.height, bw = (x1 - x0 - 10 * (bins.count - 1)) / bins.count;
      for (let j = 0; j < bins.count; j++) {
        const a = x0 + j * (bw + 10), b = a + bw;
        for (const q of [[a, a + 4, ya, yb, h0, h1], [b - 4, b, ya, yb, h0, h1], [a + 4, b - 4, ya, ya + 4, h0, h1], [a + 4, b - 4, yb - 4, yb, h0, h1], [a + 4, b - 4, ya + 4, yb - 4, h0, h0 + 4]]) solid(d, q, 'binGrey', 'drawers');
      }
    }
    if (inner) {   /* an inner drawer for cutlery over the drawer, behind the same front: its box, sides, front and insert */
      const ih = bottomH + sideHeight + D.inner.gap, top = ih - 4 + D.M.sideHeight;
      box(ih, D.inner.backHeight);
      system(ih, top);
      solid(d, [innerX0 + s1, innerX1 - s1, y1 - 16, y1 - 2, ih - 4, top], 'drawerSide', 'drawers');
      const x0 = innerX0 + 40, x1 = innerX1 - 40, ya = carcassBack + 76, yb = carcassFront - 44, inset = s1 - 40;
      for (let j = 1; j < 5; j++) { const x = x0 + inset + (x1 - x0 - 2 * inset) * j / 5; solid(d, [x - 3, x + 3, ya, yb, ih + 16, ih + 66], 'insertGrey', 'drawers'); }
      solid(d, [x0, x1, ya, yb, ih + 16, ih + 20], 'insertGrey', 'drawers');
    }
  };
  /**
   * Drawers behind a door (doorDrawers): a spacer on the hinges' side, boxes of drawerBox board on ball runners, as deep as the
   * longest runner that fits before the hinges (hinges.postDepth).
   * @param {Carcass} c @param {Item} m @param {Draft} d @param {Draft} k @param {ReturnType<typeof carcassBoards>} boards
   */
  const doorDrawers = (c, m, d, k, boards) => {
    const S = settings.doorDrawers, t = thickness('carcass'), tb = thickness('drawerBox'), right = m.hinge === 'right';
    if (!(right ? m.x1 === c.x1 : m.x0 === c.x0)) { warn(`${placeOf(m)}: drawers behind the door: the door must reach the carcass's side on its hinges' side.`, m.index); return; }
    const y1 = carcassFront - settings.hinges.postDepth, length = Math.max(...S.runnerLengths.filter((/** @type {number} */ l) => l <= y1 - carcassBack));
    if (!Number.isFinite(length)) { warn(`${placeOf(m)}: no runner of settings.doorDrawers.runnerLengths fits in ${y1 - carcassBack}.`, m.index); return; }
    const { lo, hi } = boards.spaceAround(m.h0, m.h1);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) { warn(`${placeOf(m)}: drawers behind the door: no board over or under it.`, m.index); return; }
    const spacer = right ? [c.x1 - 2 * t, c.x1 - t] : [c.x0 + t, c.x0 + 2 * t];
    board(k, 'carcass', [spacer[0], spacer[1], carcassBack, y1, lo, hi], 'boards');
    const x0 = (right ? c.x0 + t : spacer[1]) + S.clearance, x1 = (right ? spacer[0] : c.x1 - t) - S.clearance, y0 = y1 - length, pitch = (hi - lo) / S.count;
    for (let j = 0; j < S.count; j++) {
      const h = Math.round(lo + S.lift + j * pitch), top = h + tb + S.sideHeight;
      board(d, 'drawerBox', [x0, x1, y1 - tb, y1, h, top], 'drawers');
      board(d, 'drawerBox', [x0 + tb, x1 - tb, y0, y1 - tb, h, h + tb], 'drawers');
      for (const sx of [x0, x1 - tb]) board(d, 'drawerBox', [sx, sx + tb, y0, y1 - tb, h, top], 'drawers');
      board(d, 'drawerBox', [x0 + tb, x1 - tb, y0, y0 + tb, h + tb, top], 'drawers');
      const r0 = h + tb + 20;
      solid(k, [x0 - S.clearance, x0, y0, y1, r0, r0 + 35], 'zinc', 'hardware'); solid(k, [x1, x1 + S.clearance, y0, y1, r0, r0 + 35], 'zinc', 'hardware');
    }
  };
  /**
   * A drawer of board (settings.drawers.box 'board'): a box of drawerBox board on ball runners, as long as the longest runner
   * that fits, lift over the board under it.
   * @param {Carcass} c @param {Item} m @param {Draft} d @param {ReturnType<typeof carcassBoards>} boards
   */
  const boardDrawer = (c, m, d, boards) => {
    const B = settings.drawers.board, t = thickness('carcass'), tb = thickness('drawerBox'), depth = carcassFront - carcassBack;
    const length = Math.max(...B.runnerLengths.filter((/** @type {number} */ l) => l <= depth - B.setback - B.backClearance));
    if (!Number.isFinite(length)) { warn(`${placeOf(m)}: no runner of settings.drawers.board.runnerLengths fits in ${depth}.`, m.index); return; }
    const x0 = c.x0 + t + B.clearance, x1 = c.x1 - t - B.clearance, y1 = carcassFront - B.setback, y0 = y1 - length;
    const h = m.h0 + (m.h0 === c.h0 ? t : 0) + B.lift, top = h + tb + B.sideHeight;
    if (top > boards.spaceAround(m.h0, m.h1).hi) warn(`${placeOf(m)}: the drawer's box reaches ${top}, over the board above it.`, m.index);
    board(d, 'drawerBox', [x0, x1, y0, y1, h, h + tb], 'drawers');
    for (const sx of [x0, x1 - tb]) board(d, 'drawerBox', [sx, sx + tb, y0, y1, h + tb, top], 'drawers');
    for (const [b0, b1] of [[y1 - tb, y1], [y0, y0 + tb]]) board(d, 'drawerBox', [x0 + tb, x1 - tb, b0, b1, h + tb, top], 'drawers');
    const r0 = h + tb + 20;
    solid(d, [c.x0 + t, x0, y0, y1, r0, r0 + 35], 'zinc', 'hardware'); solid(d, [x1, c.x1 - t, y0, y1, r0, r0 + 35], 'zinc', 'hardware');
  };
  /** a module's front, less its gaps, in the plane of the fronts: a shaker's frame round a recessed panel, else one board @param {Draft} d @param {Item} i */
  const front = (d, i) => {
    if (!FRONT_TYPES.includes(i.type) || hasTag(i, 'open') || !i.gaps) return;
    const x0 = i.x0 + i.gaps.left, x1 = i.x1 - i.gaps.right, h0 = i.h0 + i.gaps.bottom, h1 = i.h1 - i.gaps.top, y0 = frontFace - C.frontThickness, y1 = frontFace;
    const w = C.frameWidth(i.type), part = (/** @type {number[]} */ b) => board(d, i.type, b, 'doorsAndDrawers');
    if (!w || x1 - x0 <= 2 * w + 20 || h1 - h0 <= 2 * w + 20) part([x0, x1, y0, y1, h0, h1]);
    else {
      part([x0, x1, y0, y1, h1 - w, h1]); part([x0, x1, y0, y1, h0, h0 + w]); part([x0, x0 + w, y0, y1, h0 + w, h1 - w]); part([x1 - w, x1, y0, y1, h0 + w, h1 - w]);
      part([x0 + w, x1 - w, y0, (y0 + y1) / 2, h0 + w, h1 - w]);   // the panel, recessed
    }
    handle(d, i, x0, x1, h0, h1);
  };
  /** a front's handle, a bar on two posts in the room's metal: by its edge (hardwareLayout.handle: axis from the edge; on a side, sideHeight up) @param {Draft} d @param {Item} i @param {number} x0 @param {number} x1 @param {number} h0 @param {number} h1 */
  const handle = (d, i, x0, x1, h0, h1) => {
    const H = settings.hardwareLayout?.handle, at = i.handle;
    if (!H || !at) return;
    const L = H.barLength, y = frontFace, bar = (/** @type {number[]} */ b) => solid(d, b, 'metal', 'handles');
    if (at === 'top' || at === 'bottom') {
      const h = at === 'top' ? h1 - H.axis : h0 + H.axis, x = (x0 + x1) / 2;
      bar([x - L / 2, x + L / 2, y + 24, y + 34, h - 6, h + 6]); bar([x - L / 2 + 8, x - L / 2 + 18, y, y + 24, h - 5, h + 5]); bar([x + L / 2 - 18, x + L / 2 - 8, y, y + 24, h - 5, h + 5]);
    } else {
      const x = at === 'left' ? x0 + H.axis : x1 - H.axis, h = Math.min(h0 + H.sideHeight, (h0 + h1) / 2);
      bar([x - 6, x + 6, y + 24, y + 34, h - L / 2, h + L / 2]); bar([x - 5, x + 5, y, y + 24, h - L / 2 + 8, h - L / 2 + 18]); bar([x - 5, x + 5, y, y + 24, h + L / 2 - 18, h + L / 2 - 8]);
    }
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
    }
    for (const [s0, s1] of spans) board(d, 'carcass', upright ? [x0, x1, carcassBack, carcassBack + depth, s0, s1] : [s0, s1, carcassBack, carcassBack + depth, h0, h1], 'boards');
  };
  /** @type {Draft[]} */
  const along = [];
  /* the worktop: from the wall (the zero) to worktop.overhang before the fronts */
  const top = G.items.find(i => i.type === 'worktop');
  const worktop = top ? { y0: 0, y1: frontFace + settings.worktop.overhang, h1: top.h1 } : null;
  /* the cut-outs in the worktop: for the sink and the hob of a base carcass, centred on it, cut.fromBack from the worktop's back */
  /** @type {{ kind: string, carcass: Carcass, x0: number, x1: number, y0: number, y1: number }[]} */
  const cutouts = [];
  if (worktop) for (const c of G.carcasses.filter(k => k.base)) for (const kind of ['sink', 'hob'].filter(f => c.flags.includes(f))) {
    const cut = settings.cutouts?.[kind], xc = (c.x0 + c.x1) / 2;
    if (!cut) { warn(`${c.name}: no cut-out in settings.cutouts.${kind}.`); continue; }
    cutouts.push({ kind, carcass: c, x0: xc - cut.width / 2, x1: xc + cut.width / 2, y0: worktop.y0 + cut.fromBack, y1: worktop.y0 + cut.fromBack + cut.depth });
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
  for (const i of G.items) {
    const { x0, x1, h0, h1 } = i, width = x1 - x0, height = h1 - h0;
    if (i.type === 'worktop' && worktop) { const d = draft('worktop', 'Worktop', 'worktop', [x0, x1, worktop.y0, worktop.y1, h0, h1], i); worktopBoards(d, G.island ? ISLAND_USE : 'worktop'); along.push(d); }
    else if (i.type === 'endPanel') {
      if (!worktop) { warn(`Group ${G.group}: an end panel with no worktop on it.`, i.index); continue; }
      const y0 = worktop.y0 + (G.island ? settings.worktop.endPanelOverhang : 0), y1 = worktop.y1 - settings.worktop.endPanelOverhang;
      const d = draft('endPanel', 'End panel', 'endPanel', [x0, x1, y0, y1, h0, h1], i); whole(d, G.island ? ISLAND_END_PANEL_USE : 'endPanel'); along.push(d);
    }
    else if (i.type === 'wallPanel') { const d = draft('wallPanel', 'Wall panel', 'wallPanel', [x0, x1, 0, thickness('wallPanel'), h0, h1], i); whole(d, 'wallPanel'); along.push(d); }
    else if (i.type === 'plasterboard') { const d = draft('plasterboard', 'Plasterboard casing', 'plasterboard', [x0, x1, 0, settings.plasterboard.depth, h0, h1], i); d.bodies.push({ form: 'box', box: d.box, material: 'plasterWhite', layer: 'plasterboard' }); along.push(d); }
    else if (i.type === 'strip') { const d = draft('strip', height > width ? 'Front strip' : 'Horizontal front strip', 'strip', [x0, x1, frontFace - settings.strip.depth, frontFace, h0, h1], i); whole(d, 'strip'); if (!i.carcass) backStrips(d, i); along.push(d); }
    else if (i.type === 'plinth') { const d = draft('plinth', 'Plinth', 'plinth', [x0, x1, plinthFace - thickness('plinth'), plinthFace, h0, h1], i); whole(d, 'plinth'); along.push(d); }
    else if (i.type === 'frontPanel' && !i.carcass) { const d = draft('frontPanel', 'Front panel', 'frontPanel', [x0, x1, frontFace - thickness('frontPanel'), frontFace, h0, h1], i); whole(d, 'frontPanel'); along.push(d); }
  }
  /* an island's back panel: between its end panels, from the floor to the carcasses' tops, on their backs */
  if (G.island && G.carcasses.length) {
    const tops = Math.max(...G.carcasses.map(c => c.h1)), first = Math.min(...G.carcasses.map(c => c.x0)), last = Math.max(...G.carcasses.map(c => c.x1));
    const ends = G.items.filter(i => i.type === 'endPanel'), left = ends.filter(f => f.x1 <= first), right = ends.filter(f => f.x0 >= last);
    const x0 = left.length ? Math.max(...left.map(f => f.x1)) : G.widths[0] || 0, x1 = right.length ? Math.min(...right.map(f => f.x0)) : G.length - (G.widths[G.widths.length - 1] || 0);
    const d = draft('islandBackPanel', 'Island back panel', 'islandBackPanel', [x0, x1, carcassBack - thickness('frontPanel'), carcassBack, 0, tops]); whole(d, 'frontPanel'); along.push(d);
  }
  /* the carcasses, their modules; a dishwasher's bay (no carcass) in the row */
  const covers = (/** @type {Item} */ i, /** @type {Carcass} */ c) => i.column <= c.column && i.column + i.span - 1 >= c.column + c.span - 1;
  /** @type {Draft[]} */
  const units = [];
  for (const c of G.carcasses) {
    const node = draft(c.name, 'Carcass ' + c.name, 'carcass', [c.x0, c.x1, carcassBack, carcassFront, c.h0, c.h1]);
    const boards = carcassBoards(c, G, C, warn), xc = (c.x0 + c.x1) / 2;
    node.bodies.push(...boards.bodies);
    /* shelf pins under the adjustable shelves, at the front and the back of both sides; their holes */
    const pin = settings.drilling.shelfPin;
    for (const b of boards.adjustable) {
      const h = b[4] - pin.belowShelf, r = pin.diameter / 2;
      for (const [p0, p1, side] of [[b[0] - 1, b[0] + 7, c.x0 + thickness('carcass')], [b[1] - 7, b[1] + 1, c.x1 - thickness('carcass')]]) for (const y of [carcassBack + pin.fromBack, carcassFront - pin.fromFront]) {
        solid(node, [p0, p1, y - r, y + r, h - r, h + r], 'zinc', 'shelves');
        hole(node, side, y, h, r, 'markerShelfPin', [1, 0, 0]);
      }
    }
    /* the pull-out shelf's runners, between it and the side or the spacer; their holes */
    if (boards.pullOut) {
      const [x0, x1, y0, y1, h0] = boards.pullOut, t = thickness('carcass'), spacer = boards.bodies.find(b => b.layer === 'boards' && b.box && b.box[4] < h0 && b.box[5] > h0 && b.box[1] - b.box[0] === t && b.box[0] > c.x0 + t / 2 && b.box[1] < c.x1 - t / 2);
      const left = spacer && /** @type {number[]} */ (spacer.box)[1] <= x0 ? /** @type {number[]} */ (spacer.box)[1] : c.x0 + t, right = spacer && /** @type {number[]} */ (spacer.box)[0] >= x1 ? /** @type {number[]} */ (spacer.box)[0] : c.x1 - t;
      for (const [a, b] of [[left, x0], [x1, right]]) { solid(node, [a, b, y0, y1, h0 - 14, h0], 'zinc', 'hardware'); for (const f of settings.drilling.runner.fromFront) hole(node, a === left ? left : right, carcassFront - f, h0 - settings.drilling.runner.belowDrawer, settings.drilling.runner.diameter / 2, 'markerRunner', [1, 0, 0]); }
    }
    for (const m of c.members) {
      if (BOX_TYPES.includes(m.type)) {
        const d = draft(m.type, m.type[0].toUpperCase() + m.type.slice(1), 'module', [m.x0, m.x1, carcassBack, carcassFront, m.h0, m.h1], m);
        front(d, m);
        inside(c, m, d, node, boards);
        /* an oven, a microwave: on the board under it (on its feet), its fascia before the carcass */
        const A = (m.type === 'oven' || m.type === 'microwave') && C.appliance(m.type);
        if (A) {
          const feet = settings.appliances[m.type].feet || 0, floor = boards.spaceAround(m.h0, m.h1).lo;
          if (!Number.isFinite(floor)) warn(`${placeOf(m)}: the ${m.type} has no board under it.`, m.index);
          else d.children.push(product(m.type, A, [(m.x0 + m.x1) / 2 - A.fascia.width / 2, carcassFront - A.body.depth, floor - Math.max(0, -(feet + A.fascia.bottom))], m.type, { feet }));
        }
        node.children.push(d);
      }
      else if (m.type === 'frontPanel') { const d = draft('frontPanel', 'Front panel', 'frontPanel', [m.x0, m.x1, carcassFront, panelFace, m.h0, m.h1], m); whole(d, 'frontPanel'); node.children.push(d); }
    }
    /* a fridge-freezer on the bottom board, its doors carried by the fronts */
    const F = c.flags.includes('fridge') && C.appliance('fridgeFreezer');
    if (F) node.children.push(product('fridge', F, [xc - F.body.width / 2, carcassFront - F.body.depth, c.h0 + thickness('carcass')], 'fridge'));
    /* a coffee machine on its pull-out shelf, 20 behind its front */
    const coffee = boards.pullOut && C.appliance('coffee');
    if (coffee && boards.pullOut) { const b = boards.pullOut; node.children.push(product('coffee', coffee, [(b[0] + b[1]) / 2 - coffee.body.width / 2, b[3] - 20 - coffee.body.depth, b[5]], 'coffee')); }
    /* the sink and the hob in their cut-outs; the tap behind the sink, the trap under it */
    for (const cut of cutouts.filter(k => k.carcass === c)) {
      const A = C.appliance(cut.kind), x = (cut.x0 + cut.x1) / 2, y = (cut.y0 + cut.y1) / 2, top = /** @type {{ h1: number }} */ (worktop).h1;
      if (!A) continue;
      if (cut.kind === 'hob') node.children.push(product('hob', A, [x - A.glass.width / 2, y - A.glass.depth / 2, top - A.body.height], 'hob'));
      else {
        node.children.push(product('sink', A, [x - A.body.width / 2, y - A.body.depth / 2, top - A.bowl.height - A.wall], 'sink'));
        const I = settings.installation?.sink;
        if (I) {
          const ty = /** @type {{ y0: number }} */ (worktop).y0 + I.tapFromBack, rim = top + A.rim, metal = 'metal';
          cylinder(node, 28, 8, [x, ty, rim + 4], metal, 'sink'); cylinder(node, 20, 172, [x, ty, rim + 94], metal, 'sink'); cylinder(node, 21, 6, [x, ty, rim + 183], metal, 'sink');
          cylinder(node, 11, 220, [x, ty + 110, rim + 166], metal, 'sink', [0, 1, 0]); cylinder(node, 13, 26, [x, ty + 214, rim + 152], metal, 'sink');
          const from = top - A.bowl.height - A.wall, yb = carcassBack + 31;
          cylinder(node, 20, from - I.trapTop, [x, y, (from + I.trapTop) / 2], 'pipe', 'trap'); cylinder(node, 20, y - yb, [x, (y + yb) / 2, I.trapTop], 'pipe', 'trap', [0, 1, 0]);
          solid(node, [x - 70, x + 70, carcassBack + 6, carcassBack + 56, I.wallOutlet - 25, I.trapTop + 25], 'pipe', 'trap');
          cylinder(node, 20, yb + 10, [x + 105, (yb + 10) / 2, I.wallOutlet], 'pipe', 'trap', [0, 1, 0]);   // the outlet, to the wall
        }
      }
    }
    /* legs under a carcass on the plinth (hardwareLayout.leg: from its sides, back and front); a grille in the plinth before it */
    const leg = C.hardware('leg'), L = settings.hardwareLayout?.leg;
    if (c.floor && c.legs && leg && L) for (const x of [c.x0 + L.fromSide, c.x1 - L.fromSide]) for (const y of [carcassBack + L.fromBack, carcassFront - L.fromFront]) {
      cylinder(node, leg.radius, c.h0 - leg.footHeight, [x, y, leg.footHeight + (c.h0 - leg.footHeight) / 2], 'foot', 'legs');
      cylinder(node, leg.footRadius, leg.footHeight, [x, y, leg.footHeight / 2], 'foot', 'legs');
    }
    const grille = C.hardware('plinthGrille'), gl = settings.hardwareLayout?.plinthGrille;
    if (c.grille && grille && gl) {
      const w = Math.min(grille.width, c.x1 - c.x0 - 80), g0 = xc - w / 2, b = gl.bottom, t = gl.bottom + grille.height, z = (/** @type {number[]} */ q) => solid(node, q, 'zinc', 'plinth');
      z([g0, g0 + w, plinthFace, plinthFace + 3, b, b + 5]); z([g0, g0 + w, plinthFace, plinthFace + 3, t - 5, t]); z([g0, g0 + 5, plinthFace, plinthFace + 3, b + 5, t - 5]); z([g0 + w - 5, g0 + w, plinthFace, plinthFace + 3, b + 5, t - 5]);
      for (let x = g0 + 17; x < g0 + w - 8; x += 12) z([x - 2, x + 2, plinthFace, plinthFace + 2, b + 5, t - 5]);
    }
    /* measured from what lies on the zero over its columns: the worktop, else the plasterboard; else the group */
    const parent = along.find(d => d.type === 'worktop' && d.item && covers(d.item, c)) || along.find(d => d.type === 'plasterboard' && d.item && covers(d.item, c));
    (parent ? parent.children : units).push(node);
  }
  for (const i of G.items) if (hasTag(i, 'dishwasher')) {
    const d = draft('dishwasher', 'Dishwasher bay', 'bay', [i.x0, i.x1, carcassBack, frontFace, i.h0, i.h1], i), A = C.appliance('dishwasher');
    front(d, i);
    if (A) {
      const feet = settings.appliances.dishwasher.feet || 0;
      if (worktop && feet + A.body.height !== top?.h0) warn(`${placeOf(i)}: the dishwasher on its feet is ${feet + A.body.height}, the worktop's underside ${top?.h0}.`, i.index);
      d.children.push(product('dishwasher', A, [(i.x0 + i.x1) / 2 - A.body.width / 2, carcassFront - A.body.depth, feet], 'dishwasher'));
    }
    units.push(d);
  }
  /* the hood over the hob, on the wall, its bottom at installation.hood.bottom; its chimney up to the ceiling (the room's) */
  const hob = cutouts.find(k => k.kind === 'hob'), hoodA = C.appliance('hood'), hoodAt = settings.installation?.hood;
  if (hob && hoodA && hoodAt && worktop) {
    const d = product('hood', hoodA, [(hob.x0 + hob.x1) / 2 - hoodA.body.width / 2, 0, hoodAt.bottom - 2], 'hood', { worktop: hoodAt.bottom - worktop.h1 });
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
  /** a draft as a node: its zero from its parent's, its size, in the model's axes @param {Draft} d @param {number[]} zero @returns {CabinetNode} */
  const node = (d, zero) => {
    const [x0, x1, y0, y1, h0, h1] = d.box, at = [x0, y0, h0];
    const parts = d.bodies.map(({ layer, ...b }) => partToModel({ ...b, ...(b.box ? { box: b.box.map((v, k) => v - at[k >> 1]) } : {}), ...(b.at ? { at: b.at.map((v, k) => v - at[k]) } : {}),
      ...(layer !== d.layer ? { layer } : {}) }));
    return { id: d.id, name: d.name, type: d.type, offset: pointToModel(at.map((v, k) => v - zero[k])), size: pointToModel([x1 - x0, y1 - y0, h1 - h0]),
      ...(d.layer ? { layer: d.layer } : {}), ...(d.product ? { product: d.product } : {}), ...(d.options ? { options: d.options } : {}), ...(d.ceiling ? { ceiling: true } : {}),
      ...(parts.length ? { parts } : {}), ...(d.children.length ? { children: d.children.map(c => node(c, at)) } : {}) };
  };
  return node(group, [0, 0, 0]);
}

/**
 * A carcass's boards (room/cabinets.md § 3), in its group's design axes: its sides and bottom; on top two rails (a base: flat, on
 * edge over a sink or a hob, with the panel under the hob) or a top board; its backs behind doors and open shelves; fixed shelves
 * at the joints of its modules (over an oven shallower, under one lower; a fridge's on the appliance); the inset panels of its
 * spaces; the shelves behind its doors (by the front's height, or on the room's grid); a coffee machine's pull-out shelf and
 * spacer.
 * @param {Carcass} carcass @param {Group} G @param {Context} C @param {(text: string, index?: number | null) => void} warn
 * @returns {{ bodies: Body[], spaceAround: (a: number, b: number) => { lo: number, hi: number }, pullOut: number[] | null, shelves: number[][], adjustable: number[][] }}
 *   its boards; the clear space round a module; the pull-out shelf's box; its shelves' boxes (every one; the adjustable ones)
 */
function carcassBoards(carcass, G, C, warn) {
  const { settings, materials, thickness } = C, { carcassBack, carcassFront, carcassDepth } = G.geometry;
  const board = thickness('carcass'), half = board / 2, boardDrawers = valueAt(settings, 'drawers.box') === 'board';
  const { x0, x1, h0, h1 } = carcass, height = h1 - h0, innerX0 = x0 + board, innerX1 = x1 - board, innerWidth = innerX1 - innerX0;
  const rails = settings.crossRails, shelf = settings.shelf, backPanel = settings.backPanel;
  /** @type {(Body & { id: string })[]} */
  const out = [];
  /** @param {string} id @param {string} use @param {number[]} box @param {string} [layer] */
  const part = (id, use, box, layer = 'boards') => { out.push({ id, form: 'box', box, material: 'board:' + materials[use], layer }); };
  part('side', 'carcass', [x0, innerX0, carcassBack, carcassFront, h0, h1]);
  part('side', 'carcass', [innerX1, x1, carcassBack, carcassFront, h0, h1]);
  part('bottomBoard', 'carcass', [innerX0, innerX1, carcassBack, carcassFront, h0, h0 + board]);
  const flags = carcass.flags, sink = flags.includes('sink'), hob = flags.includes('hob'), fridge = flags.includes('fridge');
  if (carcass.base && sink) {
    part('crossRail', 'carcass', [innerX0, innerX1, carcassFront - board, carcassFront, h1 - rails.depth, h1]);
    part('crossRail', 'carcass', [innerX0, innerX1, carcassBack, carcassBack + board, h1 - rails.depth, h1]);
  } else if (carcass.base && hob) {
    part('crossRail', 'carcass', [innerX0, innerX1, carcassFront - board, carcassFront, h1 - rails.hobFront, h1]);
    part('crossRail', 'carcass', [innerX0, innerX1, carcassBack, carcassBack + board, h1 - rails.depth, h1]);
    part('hobPanel', 'hobPanel', [innerX0, innerX1, carcassBack + board + rails.hobPanelGap, carcassFront - board, h1 - rails.hobFront, h1 - rails.hobFront + thickness('hobPanel')]);
  } else if (carcass.base) {
    part('crossRail', 'carcass', [innerX0, innerX1, carcassFront - rails.depth, carcassFront, h1 - board, h1]);
    part('crossRail', 'carcass', [innerX0, innerX1, carcassBack, carcassBack + rails.depth, h1 - board, h1]);
  } else part('topBoard', 'carcass', [innerX0, innerX1, carcassBack, carcassFront, h1 - board, h1]);

  /* the back: behind doors and open shelves, behind drawers of board; one piece a run */
  const runs = carcass.boxes.filter(b => (b.type === 'cabinet' && !hasTag(b, 'fridge', 'freezer')) || (b.type === 'drawer' && (hasTag(b, 'open') || boardDrawers)))
    .map(b => [Math.max(h0, b.h0), Math.min(h1, b.h1)]).sort((a, b) => a[0] - b[0])
    .reduce((/** @type {number[][]} */ r, span) => { const last = r[r.length - 1]; if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]); else r.push([...span]); return r; }, []);
  for (const [s0, s1] of runs) part('backPanel', 'backPanel', [x0 + backPanel.inset, x1 - backPanel.inset, carcassBack - thickness('backPanel'), carcassBack, s0 + backPanel.inset, s1 - backPanel.inset], 'backs');

  /** a fixed shelf, its top at top, gap of air behind it @param {number} top @param {number} gap */
  const fixedShelf = (top, gap) => part('fixedShelf', 'carcass', [innerX0, innerX1, carcassBack + gap, carcassFront, top - board, top], 'shelves');
  if (!carcass.base && !fridge) {
    const drawerAt = (/** @type {number} */ h) => carcass.boxes.some(b => b.type === 'drawer' && (b.h0 === h || b.h1 === h)) && carcass.boxes.filter(b => b.h0 === h || b.h1 === h).every(b => b.type === 'drawer');
    for (const joint of [...new Set(carcass.boxes.map(b => b.h0))].filter(j => j > h0 && !drawerAt(j))) {
      const vented = carcass.boxes.some(b => b.h1 === joint && b.type === 'oven');
      fixedShelf(carcass.boxes.some(b => b.h0 === joint && b.type === 'oven') ? joint : joint + half, vented ? shelf.ventGap : 0);
    }
  }
  const fridgeBody = fridge ? C.appliance('fridgeFreezer')?.body?.height : null;
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
    part('insetPanel', 'carcass', [s0, s1, carcassFront - board, carcassFront, h0 + board, h1 - topThickness]);
  }

  /** an adjustable shelf, over the whole carcass @param {number} centre */
  const adjustableShelf = centre => { part('adjustableShelf', 'carcass', [innerX0 + shelf.clearance, innerX1 - shelf.clearance, carcassBack, carcassFront - shelf.setback, centre - half, centre + half], 'shelves'); };
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
      part('spacer', 'carcass', [spacer[0], spacer[1], carcassBack, carcassFront, lo, top]);
      if (door.hinge === 'right') s1 = spacer[0]; else s0 = spacer[1];
    }
    part('pullOutShelf', 'carcass', [s0 + P.clearance, s1 - P.clearance, carcassFront - P.depth, carcassFront, shelfH, shelfH + board], 'shelves');
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
