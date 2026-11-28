// @ts-check
// room/docs.js: a furnished room's Documents as sheets (core/sheet.js; docs.js shows them): the Estimate (core/estimate.js),
// the Cut list, the Assembly cards and the Notes, from the cabinets' pieces (room/cabinets.js), the library and the room's
// docs file (room/<room>.docs.json, format docs: room/project.md). The file says what the model and the library do not: the
// estimate's items by category, the cut list's blocks, the notes; its texts and quantities with placeholders filled from the
// model ({m:carcass}, {nodes:hinge}, {i:K25/oven.space} …). Data in, sheets out, no browser.

import { estimate } from '../core/estimate.js';
import { readFormat } from '../core/tools.js';
import { boardOf } from '../library/shapes.js';
import { CABINETS, cabinetsOf } from './cabinets.js';

/** @typedef {import('../core/sheet.js').Sheet} Sheet */
/** @typedef {import('../core/sheet.js').Row} Row */
/** @typedef {import('../types.js').Catalog} Catalog */
/** @typedef {import('./cabinets.js').Cabinets} Cabinets */
/** @typedef {import('./cabinets.js').Piece} Piece */
/** @typedef {import('./cabinets.js').Front} Front */
/** @typedef {import('./cabinets.js').Edge} Edge */
/**
 * @typedef {object} DocsFile  what a room's Documents say beyond the model and the library (room/project.md: format docs)
 * @property {string} format
 * @property {number} version
 * @property {{ title: string, heading: string, info: string, excluded: string[] }} page
 * @property {Record<string, number | string>} params  waste, sheet, reserve: a number or a formula
 * @property {Record<string, any>} values
 * @property {Record<string, any>} labels
 * @property {{ id: string, code: string, title: string, columns?: string[], cut?: boolean }[]} blocks
 * @property {{ name: string, appliances?: boolean, items: Record<string, any>[] }[]} categories
 * @property {Record<string, string>} [formulas]
 * @property {{ name: string, notes: Record<string, any>[] }[]} notes
 */
/** @typedef {{ m2: number, edge: number, cut: number, qty: number, length: number, rows: { m2: number, edge: number | null, cut: number | null }[] }} BlockTotals */
/** @typedef {{ name: string, a: number, b: number, qty: number, where: string, edges: Edge[], lacquer: { long: number, short: number } | null, drillings: { drilling: Drilling, qty: number }[], key: string }} CutRow */
/** @typedef {{ from: { x: string, y: string } | null, hand: string, holes: { kind: string, diameter: number, depth: number, x: number, y: number, from?: string }[], cutouts: import('./cabinets.js').Cutout[] }} Drilling */

export const DOCS = 1;   // of the format docs

/* the names the documents give */
const LABELS = {
  carcassKind: { base: 'base', tall: 'tall', wall: 'wall' },
  flag: { sink: 'sink', basin: 'basin', hob: 'hob', fridge: 'fridge', coffee: 'coffee machine', doorDrawers: 'drawers behind the door' },
  type: { cabinet: 'cabinet', drawer: 'drawer' },
  hole: { cup: 'hinge cup', plate: 'hinge plate', bumper: 'bumper', shelfPin: 'shelf pin', runner: 'drawer / pull-out shelf runner', sink: 'sink cut-out', hob: 'hob cut-out', basin: 'basin hole' },
  /* the codes of the holes and the cut-outs in the cut list (its legend says them): the first letter the group (H hinge, S shelf or runner, C cut-out) */
  holeCode: { cup: 'HC', plate: 'HP', bumper: 'HB', shelfPin: 'SP', runner: 'SR', sink: 'CS', hob: 'CH', basin: 'CB' },
  hand: { left: 'L', right: 'R' },
  holeFrom: { front: 'from the front', back: 'from the back', bottom: 'from the bottom', hinge: 'from the hinge edge', left: 'from the left end', right: 'from the right end' }
};
const HOLES = ['cup', 'bumper', 'plate', 'shelfPin', 'runner'];   // what the assembly lists, in this order (a handle's: drilled through its front by its template)
const HORIZONTAL = ['bottomBoard', 'topBoard', 'crossRail', 'fixedShelf', 'hobPanel'];
/** @type {Record<string, string>} a piece's block of the cut list by its kind; the rest: by its board (its use's) */
const BLOCK = { front: 'fronts', strip: 'strips', plinth: 'plinths', frontPanel: 'frontPanels', islandBackPanel: 'frontPanels', wallPanel: 'wallPanels', plasterboard: 'plaster', worktop: 'worktops', endPanel: 'endPanels' };
const DEFAULT_COLUMNS = ['Part', 'Length', 'Width', 'Qty'];
const r1 = (/** @type {number} */ x) => Math.round(x * 10) / 10;
/** a value by its dotted path; undefined where there is none @param {any} o @param {string} dotted */
const valueAt = (o, dotted) => dotted.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);
const placeLabel = (/** @type {number} */ group, /** @type {number} */ column, span = 1) => `G${group}[${column}${span > 1 ? '-' + (column + span - 1) : ''}]`;
const ROUNDUP = (/** @type {number} */ x, /** @type {number} */ d) => { const f = Math.pow(10, d || 0); return Math.ceil(x * f - 1e-9) / f; };
const plural = (/** @type {number} */ n, /** @type {string} */ one, /** @type {string} */ many) => (n === 1 ? one : many);
/** @param {[number, number | string][]} widths @param {Record<number, any>} [more] @returns {import('../core/sheet.js').Column[]} [XLSX width, screen: n fixed | 's2n9m36' a share, its least and most] */
const columns = (widths, more = {}) => widths.map(([width, screen], i) => {
  const m = typeof screen === 'string' ? /^s([\d.]+)(?:n(\d+))?(?:m(\d+))?$/.exec(screen) : null;
  return { width, ...(typeof screen === 'number' ? { fix: screen } : m ? { share: +m[1], ...(m[2] ? { min: +m[2] } : {}), ...(m[3] ? { max: +m[3] } : {}) } : {}), ...(more[i] || {}) };
});

/* ================= the cut list's rows: the same parts together, where to drill each ================= */

/** a part's row key: its name, sizes, banded edges, lacquer @param {{ name: string, a: number, b: number, edges?: Edge[], lacquer?: any }} p */
export const cutKey = p => [p.name, p.a, p.b, JSON.stringify(p.edges || []), JSON.stringify(p.lacquer || null)].join('|');
/** where to drill or cut one part, in its own coordinates; null: nowhere @param {Piece} P @returns {Drilling | null} */
function drillingOf(P) {
  const holes = P.holes.filter(o => HOLES.includes(o.kind));
  if (!holes.length && !P.cutouts.length) return null;
  return { from: P.holeFrom, hand: P.hand, holes: holes.map(o => ({ kind: o.kind, diameter: o.diameter, depth: o.depth, x: o.x, y: o.y, ...(o.from ? { from: o.from } : {}) }))
    .sort((p, q) => p.kind.localeCompare(q.kind) || p.y - q.y || p.x - q.x), cutouts: P.cutouts };
}
/**
 * Parts of one name, size, banding and lacquer together, a row each; the holes drilled on site, so left and right parts and
 * parts drilled otherwise share a row and its list of where to drill each (left parts first).
 * @param {(Piece & { at?: string })[]} parts @returns {CutRow[]}
 */
export function cutList(parts) {
  /** @type {Map<string, { part: Piece, qty: number, at: Map<string, number>, drillings: Map<string, { drilling: Drilling, qty: number }> }>} */
  const rows = new Map();
  for (const p of parts) {
    const key = cutKey(p), row = rows.get(key) || { part: p, qty: 0, at: new Map(), drillings: new Map() };
    row.qty++;
    if (p.at) row.at.set(p.at, (row.at.get(p.at) || 0) + 1);
    const drilling = drillingOf(p), dk = JSON.stringify(drilling);
    if (drilling) row.drillings.set(dk, { drilling, qty: (row.drillings.get(dk)?.qty || 0) + 1 });
    rows.set(key, row);
  }
  const hand = (/** @type {{ drilling: Drilling }} */ d) => ({ left: 0, right: 1 })[/** @type {'left'} */ (d.drilling.hand)] ?? 2;
  return [...rows].map(([key, { part, qty, at, drillings }]) => ({ name: part.name, a: part.a, b: part.b, qty, where: [...at].map(([l, n]) => (n > 1 ? l + ' ×' + n : l)).join(', '),
    edges: part.edges, lacquer: part.lacquer, drillings: [...drillings.values()].sort((p, q) => hand(p) - hand(q)), key }));
}

/**
 * The sheet Cut list: the boards to order, a block a board, each part with its finished edges, m², banding, cuts, cut-outs.
 * @param {{ title: string, note: string, legend: { code: string, text: string }[], blocks: { id: string, title: string, columns?: string[], cut?: boolean, rows: any[] }[] }} spec
 * @returns {{ sheet: Sheet, total: Record<string, number> }}  total: a block's row of sums (G m², H pieces, I banding, J cuts)
 */
function cutListSheet(spec) {
  /** @type {Row[]} */
  const rows = [{ kind: 'title', cells: [spec.title] }, { cells: [spec.note] }];
  /** @type {Record<string, number>} */ const total = {};
  if (spec.legend.length) { rows.push({ kind: 'cat', cells: ['Labels and cut-outs'] }); for (const l of spec.legend) rows.push({ cells: [l.code, l.text] }); }
  rows.push({ cells: [] });
  for (const block of spec.blocks) {
    const [labelCell, size1, size2, qtyCell] = block.columns || DEFAULT_COLUMNS;
    rows.push({ kind: 'cat', cells: [block.title] });
    rows.push({ kind: 'head', cells: ['Label', labelCell, size1 + ' [mm]', 'Edge', size2 + ' [mm]', 'Edge', 'm²', qtyCell, 'Banding [m]', 'Cuts [m]', 'Cut-outs', 'Where'] });
    const first = rows.length + 1;
    for (const p of block.rows) {
      const r = rows.length + 1;
      rows.push({ cells: [p.label || '', p.name, p.a, p.edgesA, p.b, p.edgesB, { f: `C${r}*E${r}*H${r}/1000000` }, p.qty,
        p.edge != null ? { f: `${p.edge}*H${r}/1000` } : '', block.cut ? { f: `(C${r}+E${r})*H${r}/1000` } : '', (p.cutouts || []).join('\n'), p.where || ''] });
    }
    const last = rows.length;
    total[block.id] = last + 1;
    rows.push({ kind: 'sum', cells: ['', 'Total', '', '', '', '', { f: `SUM(G${first}:G${last})` }, { f: `SUM(H${first}:H${last})` }, { f: `SUM(I${first}:I${last})` }, { f: `SUM(J${first}:J${last})` }] });
    rows.push({ cells: [] });
  }
  const cols = columns([[9, 6], [40, 's2n9m36'], [12, 6], [6, 3], [12, 6], [6, 3], [10, 6], [8, 5], [15, 7], [12, 6], [34, 21], [14, 's1n8m24']],
    { 6: { digits: 3, z: '0.000' }, 8: { digits: 2, z: '0.00' }, 9: { digits: 2, z: '0.00' } });
  return { sheet: { name: 'Cut list', cols, rows }, total };
}

/**
 * A room's sheets from its files (its cabinets', its docs'), next to this module: the Estimate, the Cut list, the Assembly,
 * the Notes. A fault in a file throws.
 * @param {{ id: string, children?: any[] }} room @param {Catalog} catalog @returns {Promise<Sheet[]>}
 */
export async function roomSheets(room, catalog) {
  const read = (/** @type {string} */ name, /** @type {string} */ format, /** @type {number} */ version) => readFormat(new URL(name, import.meta.url), format, version, `room: ${name}`);
  const file = await read(`${room.id}.cabinets.json`, 'cabinets', CABINETS), docs = await read(`${room.id}.docs.json`, 'docs', DOCS);
  return docsOf({ cabinets: cabinetsOf(file, catalog), file, docs, catalog, room }).sheets;
}

/**
 * A room's Documents: its sheets, and fill (a text with its placeholders filled).
 * @param {{ cabinets: Cabinets, file: any, docs: DocsFile, catalog: Catalog, room?: { children?: any[] } }} o
 * @returns {{ sheets: Sheet[], fill: (text: string) => string }}
 */
export function docsOf({ cabinets, file, docs, catalog, room }) {
  const { pieces, fronts, counts, layout } = cabinets, settings = file.settings, materials = file.materials, COST = docs;
  const product = (/** @type {string} */ key) => /** @type {any} */ (catalog.product(key));
  const board = (/** @type {string} */ use) => boardOf(product(materials[use]));
  /** @type {Record<string, string>} a use's board as the documents name it: its name and thickness */
  const label = Object.fromEntries(Object.entries(materials).map(([use, key]) => [use, product(/** @type {string} */ (key)).name + ' ' + board(use).thickness]));
  /** @type {Record<string, any>} the appliances by role: the library's product with how the room builds it in (its feet) */
  const APPLIANCES = Object.fromEntries(Object.entries(settings.appliances || {}).map(([role, a]) => [role, { ...product(/** @type {any} */ (a).product), ...(/** @type {any} */ (a)) }]));
  /** @type {Record<string, any>} the hardware by role: the library's product */
  const HARDWARE = Object.fromEntries(Object.entries(settings.hardware || {}).map(([role, key]) => [role, product(/** @type {string} */ (key))]));
  const carcasses = layout.flatMap(G => G.carcasses), items = layout.flatMap(G => G.items), groups = Object.fromEntries(layout.map(G => [String(G.group), G]));
  const frontOf = new Map(fronts.map(F => [F.item, F]));
  /* the tiles laid in the room: {n:tiles.<where>.<count>} */
  const tiles = Object.fromEntries((room?.children || []).filter(c => c.count && /Tiles$/.test(c.id)).map(c => [c.id.replace(/Tiles$/, ''), { ...c.count, full: c.count.whole }]));
  const N = { ...counts, tiles };

  /* an item of the estimate: its product (a material: the board of that use), what the room says of it */
  const productOf = (/** @type {any} */ item) => product(item.material ? materials[item.material] : item.product);
  const ITEMS = COST.categories.flatMap(c => c.items).map(item => {
    const P = productOf(item);
    return { ...item, id: /** @type {string} */ (item.id), qty: item.qty, use: item.use, refs: item.refs, name: item.material ? item.name : P.name, spec: item.material ? item.spec : [P.spec, item.spec].filter(Boolean).join(', '),
      unit: P.unit, price: P.price ?? null, links: P.links || [] };
  });
  const ITEM = Object.fromEntries(ITEMS.map(item => [item.id, item]));
  /* the notes numbered in their order, the sections lettered */
  const NOTES = COST.notes.flatMap(section => section.notes);
  const noteNumber = Object.fromEntries(NOTES.map((n, i) => [n.id, String(i + 1)]));
  const sectionTitle = (/** @type {{ name: string }} */ section, /** @type {number} */ i) => String.fromCharCode(65 + i) + '. ' + section.name;
  const noteDocuments = (/** @type {any} */ n) => [...(n.appliance ? APPLIANCES[n.appliance]?.links || [] : []), ...(n.links || [])];

  const edgeText = (/** @type {Edge[]} */ edges) => edges.map(e => e.side + ' ' + e.length).join(' + ');
  const edgeLength = (/** @type {Edge[]} */ edges) => edges.reduce((s, e) => s + e.length, 0);
  const sideText = (/** @type {string[]} */ sides) => sides.join(' + ');
  /* the cut-outs of a row (a worktop's, cut by the supplier's CNC), one line each */
  const cutoutLines = (/** @type {CutRow} */ row) => [...new Set(row.drillings.flatMap(({ drilling }) => drilling.cutouts.map(c => LABELS.holeCode[/** @type {'sink'} */ (c.kind)] + ' ' + (c.round ? 'Ø' + c.width : c.width + '×' + c.depth) + ' @ ' + c.x + 'x' + c.y).map(t => t.replace(/ /g, '\u00a0'))))];   // one line each, unbroken
  /* the legend over the cut list: the labels and the cut-outs' codes */
  function cutoutLegend() {
    const order = Object.keys(settings.cutouts || {});
    const kinds = [...new Map(pieces.flatMap(P => P.cutouts).map(c => [c.kind + (c.round ? c.width : ''), c])).values()].sort((p, q) => order.indexOf(p.kind) - order.indexOf(q.kind));
    return [
      { code: 'Label', text: 'the code in the first column (e.g. KO-07): one code for each size of part; the same code in the sheet Assembly – stick it on the parts when collecting them from the wholesaler' },
      ...kinds.map(c => ({ code: LABELS.holeCode[/** @type {'sink'} */ (c.kind)], text: LABELS.hole[/** @type {'sink'} */ (c.kind)] + ' ' + (c.round ? 'Ø' + c.width : c.width + ' × ' + c.depth) + ' – worktop; x ' + LABELS.holeFrom.left + ', y ' + LABELS.holeFrom.back + ' (seen from the front); check the size with the maker\'s template' })),
      { code: 'Notation', text: 'a cut-out: CODE width×depth @ x x y of its left back corner (a round one: of its centre), mm' }
    ];
  }
  /* the holes of one part for the assembly: their heights from its bottom; a hinge plate: the axis of its pair; the bumpers in an edge */
  function holeText(/** @type {Drilling} */ drilling) {
    const parts = [];
    for (const kind of HOLES.filter(k => k !== 'bumper' && drilling.holes.some(h => h.kind === k))) {
      let ys = [...new Set(drilling.holes.filter(h => h.kind === kind).map(h => h.y))].sort((p, q) => p - q);
      if (kind === 'plate') ys = ys.filter((_, i) => i % 2 === 0).map((y, i) => r1((y + ys[2 * i + 1]) / 2));
      parts.push(LABELS.hole[/** @type {'cup'} */ (kind)] + ' ' + ys.join(', '));
    }
    const bumpers = drilling.holes.filter(h => h.kind === 'bumper'), ends = [...new Set(bumpers.map(h => h.from))];
    const edge = ends.map(from => 'bumper in the front edge ' + LABELS.holeFrom[/** @type {'bottom'} */ (from)] + ': ' + bumpers.filter(h => h.from === from).map(h => h.x).join(', ')).join('; ');
    return [parts.length && drilling.from ? 'holes ' + LABELS.holeFrom[/** @type {'bottom'} */ (drilling.from.y)] + ': ' + parts.join('; ') : '', edge].filter(Boolean).join('; ');
  }
  /* the drilling rules over the assembly cards, from the makers' data; only what the room has */
  function assemblyLegend() {
    const H = HARDWARE, list = (/** @type {number[]} */ xs) => xs.join(', '), c = counts, boardDrawers = valueAt(settings, 'drawers.box') === 'board';
    const remark = (/** @type {string} */ kind) => (COST.labels.legend?.[kind] ? ' (' + COST.labels.legend[kind] + ')' : '');
    const system = H.drawer || H.drawerM, pins = settings.shelf.pins;
    return [
      'Holes: the height of the axis from the bottom of the part (doors: from the bottom of the front), in mm. How far from the front the template or the fitting gives:',
      c.hinges && H.hinge && '· hinge cup Ø' + H.hinge.cup.diameter + ', depth ' + H.hinge.cup.depth + ', ' + H.hinge.cup.fromEdge + ' from the hinge edge',
      c.hinges && H.hinge && '· hinge plate: the hinge\'s axis given, 2 holes Ø' + H.hinge.plate.holes.diameter + ' ' + H.hinge.plate.holes.spacing + ' apart, ' + H.hinge.plate.holes.fromFront + ' from the front',
      c.bumpers && H.bumper && '· bumper Ø' + H.bumper.hole.diameter + ', depth ' + H.bumper.hole.depth + ': facing each hinge, at its height; in the front edge of the side (post), in the middle of its thickness',
      c.shelfPins && H.shelfPin && '· shelf pin Ø' + H.shelfPin.hole.diameter + ': ' + pins.fromFront + ' from the front and ' + pins.fromBack + ' from the back, ' + H.shelfPin.belowShelf + ' under the shelf',
      (c.drawersD || c.drawersM) && system && '· drawer runner: by the runner, holes ' + list(system.holes.fromFront) + ' from the front, ' + system.holes.belowDrawer + ' under the bottom' + remark('runner'),
      c.pullOutShelves && H.pullOut && '· pull-out shelf runner: holes ' + list(H.pullOut.holes.fromFront) + ' from the front, ' + H.pullOut.holes.belowShelf + ' under the shelf' + remark('runner'),
      (c.doorDrawers || boardDrawers) && H.runner && '· ball runner (' + (boardDrawers ? 'drawers of board' : 'drawers behind doors') + '): ' + list(H.runner.holes.fromFront) + ' from the box\'s front (those within the runner), ' + H.runner.holes.aboveBottom + ' over the box\'s bottom',
      'L / R: the left / right sides' + (c.hinges ? ' and hinge posts' : '') + ' seen from the front of the cabinet (holes from the inside)' + (c.hinges ? '; doors hinged on the left / right.' : '.')
    ].filter(Boolean);
  }
  /* a piece's finished edges per side, as a supplier's order form has them: along its length and its width, 0, 1 or 2 */
  const edgeCounts = (/** @type {CutRow} */ row) => {
    const { lacquer, edges } = row;
    if (lacquer) return row.a >= row.b ? { length: lacquer.long, width: lacquer.short } : { length: lacquer.short, width: lacquer.long };
    const along = (/** @type {string} */ size) => edges.filter(e => e.along === size).length;
    return { length: along('a'), width: along('b') };
  };
  /* the rows: the longer side first (a; the edges turn with it), by name, then the longest first */
  const turn = (/** @type {Edge[]} */ edges) => edges.map(e => ({ ...e, along: /** @type {'a' | 'b'} */ (e.along === 'a' ? 'b' : 'a') }));
  const longFirst = (/** @type {CutRow[]} */ rows) => rows.map(row => (row.a >= row.b ? row : { ...row, a: row.b, b: row.a, edges: turn(row.edges) }));
  const sortRows = (/** @type {CutRow[]} */ rows) => rows.sort((x, y) => x.name.localeCompare(y.name) || y.a - x.a || y.b - x.b);
  /* a front's function: the first labels.fronts entry for its type and tags; none: its type */
  const frontFunction = (/** @type {Front} */ f) => COST.labels.fronts.find((/** @type {any} */ e) => e.type === f.item.type && (!e.tags || e.tags.some((/** @type {string} */ t) => f.item.tags.includes(t))))?.function
    || LABELS.type[/** @type {'cabinet'} */ (f.item.type)] || f.item.type;
  /** a front as a part of the cut list: its function, width × height @param {Piece} P */
  const frontPart = P => ({ ...P, name: frontFunction(/** @type {Front} */ (P.front)) });
  const where = (/** @type {Piece} */ P) => P.carcass || P.place;
  /* the rows of one block: fronts, strips … (BLOCK), else a use's board: every other piece of that board */
  const blockRows = (/** @type {string} */ id) => {
    const own = id in BLOCK_IDS ? pieces.filter(P => BLOCK[P.id] === id) : pieces.filter(P => !BLOCK[P.id] && P.material === materials[id]);
    const list = own.map(P => ({ ...(P.id === 'front' ? frontPart(P) : P), at: where(P) }));
    return id === 'fronts' ? sortRows(cutList(list)) : sortRows(longFirst(cutList(list)));
  };
  const BLOCK_IDS = Object.fromEntries(Object.values(BLOCK).map(b => [b, true]));
  const rowsOf = Object.fromEntries(COST.blocks.map(block => [block.id, blockRows(block.id)]));
  /** @type {Record<string, string>} a row's key → its label (KO-07) */
  const codeOfRow = {};
  for (const block of COST.blocks) rowsOf[block.id].forEach((row, i) => { codeOfRow[row.key] = block.code + '-' + String(i + 1).padStart(2, '0'); });

  /* ---------- the values: parameters, the items' quantities and prices; the blocks' totals ---------- */
  /** @type {{ params: Record<string, number>, items: Record<string, { qty: any, price: number | null }> }} */
  const values = { params: {}, items: Object.fromEntries(ITEMS.map(item => [item.id, { qty: item.qty, price: item.price }])) };
  for (const [name, value] of Object.entries(COST.params)) values.params[name] = evalQty(value);
  /** @returns {Record<string, BlockTotals>} */
  function blockTotals() {
    /** @type {Record<string, BlockTotals>} */
    const totals = {};
    for (const block of COST.blocks) {
      /** @type {BlockTotals} */
      const t = { m2: 0, edge: 0, cut: 0, qty: 0, length: 0, rows: [] };
      for (const row of rowsOf[block.id]) {
        const { a, b, qty, edges } = row, m2 = (a * b * qty) / 1e6, edge = edges.length ? (edgeLength(edges) * qty) / 1000 : null, cut = block.cut ? ((a + b) * qty) / 1000 : null;
        t.length += (Math.max(a, b) * qty) / 1000; t.m2 += m2; t.qty += qty; t.edge += edge || 0; t.cut += cut || 0;
        t.rows.push({ m2, edge, cut });
      }
      totals[block.id] = t;
    }
    return totals;
  }
  /* the clear space round a module: the nearest boards lying flat in its carcass under and over its middle */
  const spaceAround = (/** @type {string} */ carcass, /** @type {number} */ h0, /** @type {number} */ h1) => {
    const mid = (h0 + h1) / 2, flat = pieces.filter(P => P.carcass === carcass && HORIZONTAL.includes(P.id)).map(P => [P.box[4], P.box[5]]);
    const below = flat.filter(([a, b]) => (a + b) / 2 <= mid).map(([, b]) => b), above = flat.filter(([a, b]) => (a + b) / 2 > mid).map(([a]) => a);
    return { bottom: below.length ? Math.max(...below) : NaN, top: above.length ? Math.min(...above) : NaN };
  };
  /* a carcass by name: width, height, innerWidth, h0, h1 */
  function carcassValue(/** @type {string} */ rest) {
    const [name, field] = rest.split('.'), c = carcasses.find(k => k.name === name);
    if (!c) return NaN;
    const width = c.x1 - c.x0;
    return /** @type {Record<string, number>} */ ({ width, height: c.h1 - c.h0, innerWidth: width - 2 * board('carcass').thickness, h0: c.h0, h1: c.h1 })[field] ?? NaN;
  }
  /* an item by its carcass's name or its place and its type or tag ("K25/oven", "G1[6]/dishwasher", "K25/cabinet#2": the second
     from the bottom): width, height, h0, h1; its front's frontWidth, frontHeight, frontH0, frontH1; space, spaceBottom, spaceTop
     (the boards round it in its carcass); the drawers behind its door: count, runnerLength, boxWidth, boxHeight; hinge (its
     door's side); edges (a panel's banded or lacquered edges); fit.* (its appliance in it) */
  function itemValue(/** @type {string} */ rest) {
    const dot = rest.indexOf('.'), field = rest.slice(dot + 1), [at, what = ''] = rest.slice(0, dot).split('/'), [kind, n] = what.split('#');
    const item = items.filter(i => (i.carcass === at || placeLabel(i.group, i.column, i.span) === at) && (i.type === kind || i.tags.includes(kind))).sort((a, b) => a.h0 - b.h0)[(Number(n) || 1) - 1];
    if (!item) return NaN;
    const f = frontOf.get(item), { bottom: spaceBottom, top: spaceTop } = item.carcass ? spaceAround(item.carcass, item.h0, item.h1) : { bottom: NaN, top: NaN };
    const panel = pieces.find(P => P.id === 'frontPanel' && P.item === item);
    const v = {
      width: item.x1 - item.x0, height: item.h1 - item.h0, h0: item.h0, h1: item.h1,
      frontWidth: f ? f.width : NaN, frontHeight: f ? f.height : NaN, frontH0: f ? f.h0 : NaN, frontH1: f ? f.h1 : NaN, spaceBottom, spaceTop, space: spaceTop - spaceBottom,
      ...(f?.doorDrawers ? f.doorDrawers : {}), ...(f?.hand ? { hinge: f.hand } : {}),
      ...(panel ? { edges: edgeText(panel.edges) || sideText(panel.lacqueredSides) || 'none' } : {}), fit: item.fit
    };
    return valueAt(v, field) ?? NaN;
  }
  /** {=…}: the expression, each <placeholder> its value @param {string} expr @param {any} [totals] @param {any} [quantities] @returns {number} */
  function calculate(expr, totals, quantities) {
    const js = expr.replace(/<([^>]+)>/g, (_, key) => `(${Number(placeholder(key.trim(), totals, quantities))})`);
    return Function('ROUND', 'ROUNDUP', 'MIN', 'MAX', `return (${js});`)(Math.round, ROUNDUP, Math.min, Math.max);
  }
  /** a placeholder's value (room/project.md: format docs) @param {string} key @param {any} [totals] @param {any} [quantities] @returns {any} */
  function placeholder(key, totals, quantities) {
    const [, prefix, rest] = /** @type {RegExpMatchArray} */ (key.match(/^(?:(\w+):)?(.+)$/));
    if (prefix === 'nodes') return counts.fittings[rest] || 0;
    if (prefix === 'n') return valueAt(N, rest) ?? 0;
    if (prefix === 'w') return valueAt(Object.fromEntries(layout.map(G => [String(G.group), G.worktop])), rest);
    if (prefix === 'g') return valueAt(groups, rest);
    if (prefix === 's') return valueAt(settings, rest);
    if (prefix === 't') return board(rest).thickness;
    if (prefix === 'd') return board(rest).depth;
    if (prefix === 'm') return label[rest];
    if (prefix === 'k') return carcassValue(rest);
    if (prefix === 'i') return itemValue(rest);
    if (prefix === 'note') return noteNumber[rest] ?? NaN;
    if (prefix === 'f') return COST.formulas?.[rest] ? calculate(COST.formulas[rest], totals, quantities) : NaN;
    if (prefix === 'a') return valueAt(APPLIANCES, rest);
    if (prefix === 'h') return valueAt(HARDWARE, rest);
    if (prefix === 'v') return valueAt(COST.values, rest);
    if (prefix === 'p') return Number(values.items[rest].price);
    if (prefix === 'q') return quantities ? quantities[rest] : NaN;
    if (!prefix && rest in values.params) return Number(values.params[rest]);
    const [block, total] = rest.split('.');
    return totals?.[block] ? totals[block][total] : NaN;
  }
  /** a quantity: a number, or a formula "=…" with placeholders and ROUNDUP only (the XLSX writes it as Excel's) @param {any} expr @param {any} [totals] @param {any} [quantities] @returns {number} */
  function evalQty(expr, totals, quantities) {
    if (typeof expr === 'number') return expr;
    const js = String(expr).replace(/^=/, '').replace(/\{([^}|]+)\}/g, (_, key) => `(${Number(placeholder(key, totals, quantities))})`);
    return Function('ROUNDUP', `return (${js});`)(ROUNDUP);
  }
  /** @type {{ totals: Record<string, BlockTotals>, quantities: Record<string, number> } | null} */
  let last = null;
  /** a text, its placeholders filled with the current values @param {string} text */
  function fill(text) {
    const totals = last?.totals, quantities = last?.quantities;
    const show = (/** @type {any} */ v, /** @type {string | undefined} */ percent) => (Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : !Number.isFinite(v) ? '…'
      : percent ? Math.round(v * 1000) / 10 + '%' : String(Math.round(v * 1000) / 1000));
    return String(text ?? '')
      .replace(/\{=([^}|]+)(\|%)?\}/g, (m, expr, percent) => show(calculate(expr, totals, quantities), percent))
      .replace(/\{([^}|]+)(\|%)?\}/g, (m, key, percent) => show(placeholder(key, totals, quantities), percent));
  }
  /* the quantities in order (one may use the ones before it), the blocks' totals */
  const totals = blockTotals(), /** @type {Record<string, number>} */ quantities = {};
  for (const category of COST.categories) for (const item of category.items) quantities[item.id] = evalQty(values.items[item.id].qty, totals, quantities);
  last = { totals, quantities };

  /* ---------- the sheets ---------- */
  const cutting = cutListSheet({ title: fill(COST.labels.cutTitle), note: fill(COST.labels.cuttingNote), legend: cutoutLegend(),
    blocks: COST.blocks.map(block => ({ id: block.id, title: fill(block.title), columns: block.columns, cut: block.cut,
      rows: rowsOf[block.id].map((row, i) => {
        const along = edgeCounts(row);
        return { label: codeOfRow[row.key], name: row.name, a: row.a, edgesA: along.length, b: row.b, edgesB: along.width, qty: row.qty,
          edge: totals[block.id].rows[i].edge != null ? r1(edgeLength(row.edges)) : null, cutouts: cutoutLines(row), where: row.where };
      }) })) });
  /* the notes */
  /** @type {Row[]} */
  const notes = [{ kind: 'title', cells: ['Notes – open questions / assumptions'] }, { cells: ['The estimate\'s items refer here by "see note N".'] }, { cells: [] },
    { kind: 'head', cells: ['No.', 'Topic', 'Description', 'Assumed in the estimate', 'To decide'] }];
  /** @type {Record<string, number>} */ const noteRow = {};
  COST.notes.forEach((section, i) => {
    notes.push({ kind: 'cat', cells: [sectionTitle(section, i)] });
    for (const n of section.notes) {
      noteRow[n.id] = notes.length + 1;
      notes.push({ cells: [noteNumber[n.id], fill(n.topic), { text: fill(n.description), links: noteDocuments(n).map((/** @type {any} */ l) => ({ text: l.name, href: l.url })) }, fill(n.assumed), fill(n.decide)] });
    }
  });
  /* the estimate: a quantity as Excel's formula: other items' quantities, the parameters and the cut list's m², banding and
     cuts as references to their cells, the rest as values */
  const toExcel = (/** @type {string} */ expr, /** @type {import('../core/estimate.js').EstimateRef} */ ref) => expr.replace(/^=/, '')
    .replace(/\{q:(\w+)\}/g, (_, id) => ref.item(id))
    .replace(/\{(\w+)\.(m2|edge|cut)\}/g, (_, block, total) => `'Cut list'!$${/** @type {Record<string, string>} */ ({ m2: 'G', edge: 'I', cut: 'J' })[total]}$${cutting.total[block]}`)
    .replaceAll('{waste}', ref.param('waste')).replaceAll('{sheet}', ref.param('sheet'))
    .replace(/\{([^}|]+)\}/g, (_, key) => String(Number(placeholder(key, totals, quantities))));
  const E = estimate({ title: COST.page.heading, info: fill(COST.page.info),
    params: [{ key: 'waste', label: 'Board waste allowance', v: Number(values.params.waste), pct: true }, { key: 'sheet', label: fill(COST.labels.sheet), v: Number(values.params.sheet) }],
    categories: COST.categories.map(category => ({ name: category.name, group: category.appliances ? 'Appliances' : 'Furniture', items: category.items.map(({ id }) => ITEM[id]).map(item => ({
      id: item.id, name: fill(item.name), spec: fill(item.spec), use: fill(item.use), unit: item.unit, price: item.price === null ? null : Number(values.items[item.id].price),
      qty: typeof item.qty === 'string' ? (/** @type {any} */ ref) => ({ f: toExcel(item.qty, ref) }) : Number(values.items[item.id].qty),
      source: { text: '', links: [...item.links.map((/** @type {any} */ l) => ({ text: l.name, href: l.url })), ...(item.refs || []).map((/** @type {string} */ id) => ({ text: 'see note ' + noteNumber[id], href: `#'Notes'!A${noteRow[id]}` }))] } })) })),
    totals: [{ label: 'Furniture (materials) total', group: 'Furniture' }, { label: 'Appliances total', group: 'Appliances' }],
    reserve: { label: 'Reserve for small items / estimated prices', note: '% of the furniture', v: Number(values.params.reserve), of: 0 },
    excluded: COST.page.excluded.map(fill), after: [['', { text: '• Questions and assumptions: see the sheet Notes.', href: "#'Notes'!A1" }]] });
  const notesSheet = { name: 'Notes', cols: columns([[6, 3], [34, 's2m40'], [70, 's5'], [42, 's2'], [40, 's4']]), rows: notes };
  return { sheets: [E.sheet, cutting.sheet, assemblySheet(), notesSheet], fill };

  /* ---------- the assembly: a card a carcass, all its parts together; then the parts without a carcass, a group each ---------- */
  /** @returns {Sheet} */
  function assemblySheet() {
    const lab = (/** @type {string} */ key) => (codeOfRow[key] ? codeOfRow[key] + ' ' : '');
    /** a row's lines, one per hand (left, right, the rest), each its holes @param {CutRow} row @returns {[string, string][]} */
    const byHand = row => {
      const count = new Map();
      for (const { drilling, qty } of row.drillings) count.set(drilling.hand, (count.get(drilling.hand) || 0) + qty);
      const drilled = [...count.values()].reduce((s, n) => s + n, 0);
      if (drilled < row.qty) count.set('', (count.get('') || 0) + row.qty - drilled);
      return [...count].map(([hand, qty]) => [lab(row.key) + (qty > 1 ? qty + ' × ' : '') + row.name + (hand ? ' ' + LABELS.hand[/** @type {'left'} */ (hand)] : '') + ' ' + row.a + ' × ' + row.b + (row.edges.length ? ' (banding ' + edgeText(row.edges) + ')' : ''),
        row.drillings.filter(d => d.drilling.hand === hand).map(({ drilling, qty: q }, _, all) => [all.length > 1 ? q + ' × ' : '', holeText(drilling)]).filter(([, t]) => t).map(([n, t]) => n + t).join('\n')]);
    };
    const partList = (/** @type {Piece[]} */ ps) => sortRows(longFirst(cutList(ps))).flatMap(byHand);
    const size = (/** @type {number} */ a, /** @type {number} */ b) => Math.max(a, b) + ' × ' + Math.min(a, b);
    /** @type {Row[]} */
    const rows = [{ kind: 'title', cells: ['Assembly'] }, ...assemblyLegend().map(t => ({ cells: [t] })), { cells: [] }, { kind: 'head', cells: ['Part', 'Holes'] }];
    const section = (/** @type {string} */ title, /** @type {[string, string][]} */ lines) => { if (!lines.length) return; rows.push({ level: 1, cells: [title, ''] }); for (const [t, h] of lines) rows.push({ level: 2, cells: [t, h] }); };
    for (const c of carcasses) {
      const own = pieces.filter(P => P.carcass === c.name && P.id !== 'front' && !BLOCK[P.id]), F = fronts.filter(f => f.carcass === c.name), shut = F.filter(f => !f.open);
      const G = groups[String(c.group)], flags = c.flags.length ? ' · ' + c.flags.map(f => LABELS.flag[/** @type {'sink'} */ (f)]).join(', ') : '';
      rows.push({ level: 0, kind: 'cat', cells: [c.name + ' · ' + placeLabel(c.group, c.column, c.span) + ' · ' + LABELS.carcassKind[c.kind] + ' · ' + r1(c.x1 - c.x0) + ' × ' + r1(c.h1 - c.h0) + ' × ' + G.geometry.carcassDepth + flags, ''] });
      for (const m of [...new Set(own.map(P => P.material))]) section(label[/** @type {string} */ (own.find(P => P.material === m)?.use)], partList(own.filter(P => P.material === m)));
      section('Fronts', shut.map(f => {
        const P = /** @type {Piece} */ (pieces.find(p => p.front === f)), d = drillingOf(P);
        return [lab(cutKey(frontPart(P))) + frontFunction(f) + ' ' + r1(f.width) + ' × ' + r1(f.height) + (f.hinges.length ? ', hinges: ' + f.hinges.length + ', ' + f.hand : '') + (f.item.handle ? ', handle ' + f.item.handle : ''), d ? holeText(d) : ''];
      }));
      section('Drawers', [...F.filter(f => f.drawer).map(f => /** @type {[string, string]} */ ([f.drawer?.system === 'board' ? (f.open ? 'open drawer ' : 'drawer ') + f.drawer.boxWidth + ' × ' + f.drawer.runnerLength + ' × ' + f.drawer.boxHeight + ', ball runners ' + f.drawer.runnerLength
        : 'drawer ' + ({ drawer: 'D', drawerM: 'M' })[/** @type {'drawer'} */ (f.drawer?.system)] + (f.drawer?.bins ? ' with waste bins' : '') + (f.drawer?.inner ? ' + an inner drawer M' : ''), ''])),
        ...shut.filter(f => f.doorDrawers).map(f => { const D = /** @type {NonNullable<Front['doorDrawers']>} */ (f.doorDrawers); return /** @type {[string, string]} */ ([D.count + ' × drawer behind the door ' + D.boxWidth + ' × ' + D.runnerLength + ' × ' + D.boxHeight + ' (a spacer on the hinges\' side)', '']); })]);
      const hinges = shut.reduce((n, f) => n + f.hinges.length, 0), bumpers = shut.reduce((n, f) => n + f.bumpers, 0), pins = own.filter(P => P.id === 'adjustableShelf').length * 4;
      const doorDrawers = shut.reduce((n, f) => n + (f.doorDrawers?.count || 0), 0), pullOut = own.filter(P => P.id === 'pullOutShelf').length;
      const boardRunners = [...new Set(F.filter(f => f.drawer?.system === 'board').map(f => f.drawer?.runnerLength))];
      section('Hardware', /** @type {[string, string][]} */ ([c.legs ? 'legs: ' + c.legs : '', hinges ? 'hinges: ' + hinges : '', bumpers ? 'bumpers: ' + bumpers : '', pins ? 'shelf pins: ' + pins : '',
        pullOut ? pullOut + ' ' + plural(pullOut, 'pair', 'pairs') + ' of full-extension runners' : '',
        doorDrawers ? 'ball runners ' + shut.find(f => f.doorDrawers)?.doorDrawers?.runnerLength + ': ' + doorDrawers + ' sets' : '',
        ...boardRunners.map(l => 'ball runners ' + l + ': ' + F.filter(f => f.drawer?.system === 'board' && f.drawer.runnerLength === l).length + ' sets')].filter(Boolean).map(t => [t, ''])));
    }
    /* the parts without a carcass, per group, by column; the same part at the same place once, with its count */
    /** @type {Record<string, { column: number, text: string }[]>} */
    const loose = {};
    const add = (/** @type {Piece} */ P, /** @type {string} */ text, /** @type {string} */ key) => (loose[P.group] = loose[P.group] || []).push({ column: P.column, text: P.place + ' – ' + lab(key) + '\u0000' + text });
    for (const P of pieces.filter(p => !p.carcass)) {
      if (P.id === 'front') { const f = /** @type {Front} */ (P.front); add(P, frontFunction(f) + ' ' + r1(f.width) + ' × ' + r1(f.height) + (f.item.handle ? ', handle ' + f.item.handle : ''), cutKey(frontPart(P))); }
      else if (P.id === 'frontPanel') add(P, P.name + ' ' + size(P.a, P.b) + (P.edges.length ? ' (banding ' + edgeText(P.edges) + ')' : '') + (P.lacqueredSides.length ? ' (banding ' + sideText(P.lacqueredSides) + ')' : ''), cutKey(P));
      else if (['worktop', 'endPanel'].includes(P.id)) continue;   // on the cut list (WORKTOPS, END PANELS)
      else add(P, P.name + ' ' + size(P.a, P.b) + (BLOCK[P.id] || !P.use ? '' : ' (' + label[P.use] + ')'), cutKey(P));
    }
    for (const group of Object.keys(loose).sort()) {
      rows.push({ level: 0, kind: 'cat', cells: ['Group ' + group + ' – without a carcass', ''] });
      /** @type {Map<string, number>} */ const count = new Map();
      for (const x of [...loose[group]].sort((p, q) => p.column - q.column)) count.set(x.text, (count.get(x.text) || 0) + 1);
      for (const [t, n] of count) { const [head, text] = t.split('\u0000'); rows.push({ level: 1, cells: [head + (n > 1 ? n + ' × ' : '') + text, ''] }); }
    }
    return { name: 'Assembly', tree: 'closed', cols: columns([[90, 's5'], [70, 's4']]), rows };
  }
}
