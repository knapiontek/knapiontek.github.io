// @ts-check
// room/cabinets.js: the cabinets' engine: a cabinets file (format cabinets) as the furniture's nodes, with what is wrong in it.
// The file is the designer's, for the maker: groups of columns, components stacked in them, carcasses by name; the engine knows
// no room and no house. It works in the design's axes, as the maker measures: per group, zero at the wall (an island: the back
// of its worktop), at its left end as one sees the fronts, on the floor; x from the left, y from the wall toward the fronts, h
// up. The nodes come out in the model's (core/tools.js: y the other way): each node's zero at its back (the wall side), left,
// bottom; its size from there to its opposite corner (negative y). Where a group stands: the room's scene (room/assembly.js).
// A carcass's place is measured from what lies on the zero over its columns: the worktop, else the plasterboard casing, else
// the group itself (settings.carcass.offset, a group's own carcass.offset). Stage 2: the layout, the carcasses, the tree; the
// boards, fronts, holes and products come later.

import { pointToModel } from '../core/tools.js';

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
/** @typedef {HierarchyNode & { children?: CabinetNode[] }} CabinetNode  a node of the furniture */

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

  return { groups: layout.map(G => groupNode(G, settings, materials, thickness, warn)), layout, problems };
}

/**
 * A group as nodes. What runs along it (worktop, end panels, wall panel, plasterboard, strips, plinth, front panels) and its
 * carcasses with their modules; a carcass under the worktop or the plasterboard over its columns, measured from it. Each in
 * the design's axes first: a box [x0, x1, y0, y1, h0, h1], y from the wall; then its zero (x0, y0, h0) from its parent's, and
 * its size, to the model's.
 * @param {Group} G @param {any} settings @param {Record<string, string>} materials @param {(use: string) => number} thickness
 * @param {(text: string, index?: number | null) => void} warn @returns {CabinetNode}
 */
function groupNode(G, settings, materials, thickness, warn) {
  const { carcassBack, carcassFront, frontFace, plinthFace, panelFace } = G.geometry;
  /** @typedef {{ id: string, name: string, type: string, box: number[], layer?: string, item?: Item, children: Draft[] }} Draft */
  /** @param {string} id @param {string} name @param {string} type @param {number[]} box @param {Item} [item] @returns {Draft} */
  const draft = (id, name, type, box, item) => ({ id, name, type, box, ...(LAYER[type] ? { layer: LAYER[type] } : {}), ...(item ? { item } : {}), children: [] });
  /** @type {Draft[]} */
  const along = [];
  /* the worktop: from the wall (the zero) to worktop.overhang before the fronts */
  const top = G.items.find(i => i.type === 'worktop');
  const worktop = top ? { y0: 0, y1: frontFace + settings.worktop.overhang } : null;
  for (const i of G.items) {
    const { x0, x1, h0, h1 } = i, width = x1 - x0, height = h1 - h0;
    if (i.type === 'worktop' && worktop) along.push(draft('worktop', 'Worktop', 'worktop', [x0, x1, worktop.y0, worktop.y1, h0, h1], i));
    else if (i.type === 'endPanel') {
      if (!worktop) { warn(`Group ${G.group}: an end panel with no worktop on it.`, i.index); continue; }
      const y0 = worktop.y0 + (G.island ? settings.worktop.endPanelOverhang : 0), y1 = worktop.y1 - settings.worktop.endPanelOverhang;
      along.push(draft('endPanel', 'End panel', 'endPanel', [x0, x1, y0, y1, h0, h1], i));
    }
    else if (i.type === 'wallPanel') along.push(draft('wallPanel', 'Wall panel', 'wallPanel', [x0, x1, 0, thickness('wallPanel'), h0, h1], i));
    else if (i.type === 'plasterboard') along.push(draft('plasterboard', 'Plasterboard casing', 'plasterboard', [x0, x1, 0, settings.plasterboard.depth, h0, h1], i));
    else if (i.type === 'strip') along.push(draft('strip', height > width ? 'Front strip' : 'Horizontal front strip', 'strip', [x0, x1, frontFace - settings.strip.depth, frontFace, h0, h1], i));
    else if (i.type === 'plinth') along.push(draft('plinth', 'Plinth', 'plinth', [x0, x1, plinthFace - thickness('plinth'), plinthFace, h0, h1], i));
    else if (i.type === 'frontPanel' && !i.carcass) along.push(draft('frontPanel', 'Front panel', 'frontPanel', [x0, x1, frontFace - thickness('frontPanel'), frontFace, h0, h1], i));
  }
  /* an island's back panel: between its end panels, from the floor to the carcasses' tops, on their backs */
  if (G.island && G.carcasses.length) {
    const tops = Math.max(...G.carcasses.map(c => c.h1)), first = Math.min(...G.carcasses.map(c => c.x0)), last = Math.max(...G.carcasses.map(c => c.x1));
    const ends = G.items.filter(i => i.type === 'endPanel'), left = ends.filter(f => f.x1 <= first), right = ends.filter(f => f.x0 >= last);
    const x0 = left.length ? Math.max(...left.map(f => f.x1)) : G.widths[0] || 0, x1 = right.length ? Math.min(...right.map(f => f.x0)) : G.length - (G.widths[G.widths.length - 1] || 0);
    along.push(draft('islandBackPanel', 'Island back panel', 'islandBackPanel', [x0, x1, carcassBack - thickness('frontPanel'), carcassBack, 0, tops]));
  }
  /* the carcasses, their modules; a dishwasher's bay (no carcass) in the row */
  const covers = (/** @type {Item} */ i, /** @type {Carcass} */ c) => i.column <= c.column && i.column + i.span - 1 >= c.column + c.span - 1;
  /** @type {Draft[]} */
  const units = [];
  for (const c of G.carcasses) {
    const node = draft(c.name, 'Carcass ' + c.name, 'carcass', [c.x0, c.x1, carcassBack, carcassFront, c.h0, c.h1]);
    for (const m of c.members) {
      if (BOX_TYPES.includes(m.type)) node.children.push(draft(m.type, m.type[0].toUpperCase() + m.type.slice(1), 'module', [m.x0, m.x1, carcassBack, carcassFront, m.h0, m.h1], m));
      else if (m.type === 'frontPanel') node.children.push(draft('frontPanel', 'Front panel', 'frontPanel', [m.x0, m.x1, carcassFront, panelFace, m.h0, m.h1], m));
    }
    /* measured from what lies on the zero over its columns: the worktop, else the plasterboard; else the group */
    const parent = along.find(d => d.type === 'worktop' && d.item && covers(d.item, c)) || along.find(d => d.type === 'plasterboard' && d.item && covers(d.item, c));
    (parent ? parent.children : units).push(node);
  }
  for (const i of G.items) if (hasTag(i, 'dishwasher')) units.push(draft('dishwasher', 'Dishwasher bay', 'bay', [i.x0, i.x1, carcassBack, frontFace, i.h0, i.h1], i));
  const children = [...along, ...units.sort((a, b) => a.box[0] - b.box[0])];
  const all = (/** @type {Draft[]} */ ds) => ds.flatMap(/** @returns {Draft[]} */ d => [d, ...all(d.children)]);
  const every = all(children);
  /** @type {Draft} */
  const group = { id: 'g' + G.group, name: 'G' + G.group + (G.name ? ' · ' + G.name : ''), type: 'cabinetGroup', box: [0, G.length, 0, Math.max(1, ...every.map(d => d.box[3])), 0, Math.max(1, ...every.map(d => d.box[5]))], children };
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
    return { id: d.id, name: d.name, type: d.type, offset: pointToModel(at.map((v, k) => v - zero[k])), size: pointToModel([x1 - x0, y1 - y0, h1 - h0]),
      ...(d.layer ? { layer: d.layer } : {}), ...(d.children.length ? { children: d.children.map(c => node(c, at)) } : {}) };
  };
  return node(group, [0, 0, 0]);
}
