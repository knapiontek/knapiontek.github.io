/* room/docs.js: a furnished room's Documents: the estimate, the cut list, the notes and the assembly cards, from the
   cabinets' model, the room's tree and its docs file (room/<kind>_<number>.docs.js), with the shared sheets of
   core/estimate.js. Knows the format docs (its placeholders: room/project.md), not the room. No browser but the cards' HTML.
   What the tree holds (a hinge, a leg, an appliance) is counted from it: {nodes:kind}. */
(function (HOME) {
'use strict';

/* {cabinets (HOME.cabinets), model (its build), tree (the groups' nodes), docs (the docs file), appliances, library}.
   Returns {book(), assembly(), warnings, page, fill} */
function create({ cabinets, model, tree, docs, appliances, library }) {
const KE = cabinets, COST = docs, APPLIANCES = appliances;
const SIDE = { left: 'left', right: 'right', top: 'top', bottom: 'bottom' };
/* an item of the estimate: its product from the library (a material: the board the cabinets file gives that use), the rest
   the room's: what it is called for a material, the spec's own part, the use, the quantity, the notes */
const productOf = item => library.product(item.material ? model.materialFor[item.material] : item.product);
const ITEMS = COST.categories.flatMap(c => c.items).map(item => {
  const P = productOf(item);
  return Object.assign({}, item, { name: item.material ? item.name : P.name, spec: item.material ? item.spec : [P.spec, item.spec].filter(Boolean).join(', '),
    unit: P.unit, price: P.price, source: P.priceNote || '', links: [...(P.links || []), ...(P.buy || [])] });
});
const ITEM = Object.fromEntries(ITEMS.map(item => [item.id, item]));
/* the notes numbered in their order, the sections lettered: note id -> number ("see note 20") */
const NOTES = COST.notes.flatMap(section => section.notes);
const noteNumber = Object.fromEntries(NOTES.map((n, i) => [n.id, String(i + 1)]));
const sectionTitle = (section, i) => String.fromCharCode(65 + i) + '. ' + section.name;
/* the documents of a note: its appliance's (the library), then its own */
const noteDocuments = n => [...(n.appliance ? APPLIANCES[n.appliance].links || [] : []), ...(n.links || [])];
/* the tree's nodes by what they are (a piece of hardware's kind, a product's role): {nodes:kind} */
const NODES = {};
(function count(list) { for (const n of list) { const p = n.part, k = p && (p.kind || p.role); if (k && (n.type === 'hardware' || n.type === 'product')) NODES[k] = (NODES[k] || 0) + 1; count(n.children); } })(tree);

const round1 = x => Math.round(x * 10) / 10;
const esc = HOME.ui ? HOME.ui.esc : (v => String(v));
const edgeText = edges => (edges || []).map(edge => KE.LABELS.edge[edge.side] + ' ' + edge.length).join(' + ');
const edgeLength = edges => (edges || []).reduce((sum, edge) => sum + edge.length, 0);
const sideText = sides => (sides || []).map(side => KE.LABELS.edge[side]).join(' + ');
const num1 = x => String(x);
/* the cut-outs of a cut-list row (worktops, cut by the supplier's CNC): "CS 680×420 @ 1234x110", one line each */
function cutoutLines(row) {
  const code = KE.LABELS.holeCode;
  const lines = row.drillings.flatMap(({ drilling }) => drilling.cutouts.map(c => (code[c.kind] + ' ' + c.width + '×' + c.depth + ' @ ' + num1(c.x) + 'x' + num1(c.y)).replace(/ /g, ' ')));
  return [...new Set(lines)];
}
/* the legend over the cut list: labels and cut-out codes, from the cabinets file's settings.cutouts */
function cutoutLegend() {
  const labels = KE.LABELS, c = model.settings.cutouts || {}, from = 'x ' + labels.holeFrom.left + ', y ' + labels.holeFrom.back;
  return [
    { code: 'Label', text: 'the code in the first column (e.g. KO-07): one code for each size of part; the same code in the sheet Assembly – stick it on the parts when collecting them from the wholesaler' },
    ...Object.entries(c).map(([kind, r]) => ({ code: labels.holeCode[kind], text: labels.hole[kind] + ' ' + r.width + ' × ' + r.depth + ' – worktop; ' + from + ' (seen from the front); check the size with the maker\'s template' })),
    { code: 'Notation', text: 'a cut-out: CODE width×depth @ x x y of its left back corner, mm' }
  ];
}
/* the holes of one part for the assembly: the positions along the part only (from its bottom); how far from the front or
   the hinge edge the template or the fitting gives (assemblyLegend). A hinge plate: the axis of its pair of holes. */
function holeText(drilling) {
  const parts = [], ORDER = ['cup', 'bumper', 'plate', 'shelfPin', 'runner'];
  for (const kind of [...new Set(drilling.holes.map(h => h.kind))].sort((p, q) => ORDER.indexOf(p) - ORDER.indexOf(q))) {
    let ys = [...new Set(drilling.holes.filter(h => h.kind === kind).map(h => h.y))].sort((p, q) => p - q);
    if (kind === 'bumper') continue;   // in a board's edge: below
    if (kind === 'plate') ys = ys.filter((_, i) => i % 2 === 0).map((y, i) => round1((y + ys[2 * i + 1]) / 2));
    parts.push(KE.LABELS.hole[kind] + ' ' + ys.map(num1).join(', '));
  }
  const bumpers = drilling.holes.filter(h => h.kind === 'bumper'), ends = [...new Set(bumpers.map(h => h.from))];
  const edge = ends.map(from => 'bumper in the front edge ' + KE.LABELS.holeFrom[from] + ': ' + bumpers.filter(h => h.from === from).map(h => num1(h.x)).join(', ')).join('; ');
  return [parts.length ? 'holes ' + KE.LABELS.holeFrom[drilling.from.y] + ': ' + parts.join('; ') : '', edge].filter(Boolean).join('; ');
}
/* the drilling rules over the assembly cards, from the cabinets file's settings.drilling */
function assemblyLegend() {
  const d = model.settings.drilling, list = xs => xs.map(num1).join(', ');
  const remark = kind => ((COST.labels.legend || {})[kind] ? ' (' + COST.labels.legend[kind] + ')' : '');
  return [
    'Holes: the height of the axis from the bottom of the part (doors: from the bottom of the front), in mm. How far from the front the template or the fitting gives:',
    '· hinge cup Ø' + num1(d.cup.diameter) + ', depth ' + d.cup.depth + ', ' + d.cup.fromEdge + ' from the hinge edge',
    '· hinge plate: the hinge\'s axis given, 2 holes Ø' + num1(d.plate.diameter) + ' ' + d.plate.spacing + ' apart, ' + d.plate.fromFront + ' from the front',
    '· bumper Ø' + num1(d.bumper.diameter) + ', depth ' + num1(d.bumper.depth) + ': facing each hinge, at its height; in the front edge of the side (post), in the middle of its thickness',
    '· shelf pin Ø' + num1(d.shelfPin.diameter) + ': ' + d.shelfPin.fromFront + ' from the front and ' + d.shelfPin.fromBack + ' from the back, ' + d.shelfPin.belowShelf + ' under the shelf',
    '· drawer / pull-out shelf runner: by the runner, holes ' + list(d.runner.fromFront) + ' from the front, ' + d.runner.belowDrawer + ' under the bottom' + remark('runner'),
    '· ball runner (drawers behind doors): ' + list(d.ballRunner.fromFront) + ' from the front, ' + d.ballRunner.aboveBottom + ' over the box\'s bottom',
    'L / R: the left / right sides and hinge posts seen from the front of the cabinet (holes from the inside); doors hinged on the left / right.'
  ].join('\n');
}
/* the finished edges of one piece per side, as a supplier's order form has them: {length, width} = the edges along each,
   0, 1 or 2. Banded edges (boards, unlacquered front panels) come as [{side, length, along}] (along: a | b); lacquered
   edges (fronts, strips, plinth, lacquered front panels) as {long, short} */
const edgeCounts = row => {
  const { lacquer, edges = [] } = row;
  if (lacquer) return row.a >= row.b ? { length: lacquer.long, width: lacquer.short } : { length: lacquer.short, width: lacquer.long };
  const along = size => edges.filter(edge => edge.along === size).length;
  return { length: along('a'), width: along('b') };
};
/* the cut list's rows: the longer side first (a; the edges turn with it), by name, then the longest first */
const turnEdges = edges => (edges || []).map(edge => ({ ...edge, along: edge.along === 'a' ? 'b' : 'a' }));
const longFirst = rows => rows.map(row => (row.a >= row.b ? row : { ...row, a: row.b, b: row.a, edges: turnEdges(row.edges) }));
const sortRows = rows => rows.sort((x, y) => x.name.localeCompare(y.name) || y.a - x.a || y.b - x.b);
/* a front's function (its column): the first labels.fronts entry for its type and tags; none: its type */
function frontFunction(front) {
  const entry = COST.labels.fronts.find(f => f.type === front.item.type && (!f.tags || f.tags.some(t => front.tags.includes(t))));
  return entry ? entry.function : KE.typeLabel(front.item.type);
}
/* the place of a part without a carcass: G1[4], G1[1-3]; one without a column, its group */
const place = p => (p.item ? KE.placeLabel(p.group, p.item.column, p.item.span) : p.column ? KE.placeLabel(p.group, p.column) : 'G' + p.group);
const columnOfPart = p => (p.item ? p.item.column : p.column || 0);
/* a front as a cut-list part: width × height, as fronts are always given */
const frontPart = f => ({ ...f, name: frontFunction(f), a: round1(f.width), b: round1(f.height) });
/* the rows of one block: its id = fronts | strips | plinths | frontPanels | wallPanels | plaster | worktops | endPanels,
   or a material use (carcass, drawerBox, backPanel ...): every board of that use's material */
function blockRows(blockId) {
  const carcassName = Object.fromEntries(model.carcasses.map(carcass => [carcass.id, carcass.name]));
  const where = p => (p.carcassId ? carcassName[p.carcassId] : place(p));
  const list = items => sortRows(longFirst(KE.cutList(items.map(p => ({ ...p, at: where(p) })))));
  const FROM_MODEL = {
    fronts: () => sortRows(KE.cutList(model.fronts.map(f => ({ ...frontPart(f), at: where(f) })))),
    strips: () => list(model.strips),
    plinths: () => list(model.plinths.map(p => ({ ...p, name: 'Plinth' }))),
    frontPanels: () => list(model.frontPanels),
    wallPanels: () => list(model.wallPanels),
    plaster: () => list(model.plaster),
    worktops: () => list(model.worktopPieces.filter(p => p.item.type === 'worktop')),
    endPanels: () => list(model.worktopPieces.filter(p => p.item.type === 'endPanel'))
  };
  return FROM_MODEL[blockId] ? FROM_MODEL[blockId]() : list(model.boards.filter(b => b.material === model.materialFor[blockId]));
}
const rowsOf = Object.fromEntries(COST.blocks.map(block => [block.id, blockRows(block.id)]));
const codeOfRow = {};
for (const block of COST.blocks) (rowsOf[block.id] || []).forEach((row, i) => { codeOfRow[row.key] = block.code + '-' + String(i + 1).padStart(2, '0'); });

/* ---------- the assembly: all the parts of one carcass together, then the parts without a carcass per group ---------- */
function renderAssembly() {
  const listLines = rows => rows.map(t => (t.startsWith('\t') ? '<br><span class="holes">' + esc(t.slice(1)) + '</span>' : '<br>– ' + esc(t))).join('');
  const holeLines = drillings => drillings.map(({ drilling, qty }) => [qty, holeText(drilling)]).filter(([, text]) => text)
    .map(([qty, text], _, all) => '\t' + (all.length > 1 ? qty + ' × ' : '') + text);
  const withEdges = edges => (edges && edges.length ? ' (banding ' + edgeText(edges) + ')' : '');
  const withLacquer = sides => (sides && sides.length ? ' (banding ' + sideText(sides) + ')' : '');
  const label = key => (codeOfRow[key] ? codeOfRow[key] + ' ' : '');
  const byHand = row => {                  // one line per hand (left, right, then the rest): which side of the carcass a part goes on
    const count = new Map();
    for (const { drilling, qty } of row.drillings) count.set(drilling.hand, (count.get(drilling.hand) || 0) + qty);
    const drilled = [...count.values()].reduce((sum, n) => sum + n, 0);
    if (drilled < row.qty) count.set('', (count.get('') || 0) + row.qty - drilled);
    return [...count];
  };
  const partList = boards => sortRows(longFirst(KE.cutList(boards))).flatMap(row => byHand(row).flatMap(([hand, qty]) => [
    label(row.key) + (qty > 1 ? qty + ' × ' : '') + row.name + (hand ? ' ' + KE.LABELS.hand[hand] : '') + ' ' + row.a + ' × ' + row.b + withEdges(row.edges),
    ...holeLines(row.drillings.filter(d => d.drilling.hand === hand))]));
  const size = (a, b) => Math.max(a, b) + ' × ' + Math.min(a, b);
  const section = (title, rows) => (rows.length ? '<br><b>' + esc(title) + '</b>' + listLines(rows) : '');
  const cards = model.carcasses.map(carcass => {
    const boards = model.boards.filter(b => b.carcassId === carcass.id), fronts = model.fronts.filter(f => f.carcassId === carcass.id);
    const pins = boards.filter(b => b.id === 'adjustableShelf').length * KE.PINS_PER_SHELF;
    const hinges = fronts.reduce((n, f) => n + (f.hinges ? f.hinges.length : 0), 0);
    const bumpers = fronts.reduce((n, f) => n + (f.bumpers ? f.bumpers.length : 0), 0);
    const frontLines = fronts.flatMap(f => [label(KE.cutKey(frontPart(f))) + frontFunction(f) + ' ' + round1(f.width) + ' × ' + round1(f.height) + (f.hinges ? ', hinges: ' + f.hinges.length + ', ' + SIDE[f.hand] : '') + (f.item.handle ? ', handle ' + SIDE[f.item.handle] : ''),
      ...holeLines(KE.cutList([frontPart(f)])[0].drillings)]);
    const drawerLines = [
      ...fronts.filter(f => f.drawer).map(f => 'drawer ' + f.drawer.size + (f.drawer.bins ? ' with waste bins' : '') + (f.drawer.inner ? ' + an inner drawer M' : '')),
      ...fronts.filter(f => f.doorDrawers).map(f => f.doorDrawers.count + ' × drawer behind the door ' + f.doorDrawers.boxWidth + ' × ' + f.doorDrawers.runnerLength + ' × ' + f.doorDrawers.boxHeight + ' (a spacer on the hinges\' side)')
    ];
    const doorDrawers = fronts.reduce((n, f) => n + (f.doorDrawers ? f.doorDrawers.count : 0), 0);
    const pullOutShelves = boards.filter(b => b.id === 'pullOutShelf').length;
    const hardware = [
      carcass.legs ? 'legs: ' + carcass.legs : '',
      hinges ? 'hinges: ' + hinges : '',
      bumpers ? 'bumpers: ' + bumpers : '',
      pins ? 'shelf pins: ' + pins : '',
      pullOutShelves ? pullOutShelves + ' ' + KE.plural(pullOutShelves, 'pair', 'pairs') + ' of full-extension runners' : '',
      doorDrawers ? 'ball runners ' + fronts.find(f => f.doorDrawers).doorDrawers.runnerLength + ': ' + doorDrawers + ' sets' : ''
    ].filter(Boolean);
    return '<div class="card"><h3>' + esc(carcass.name) + '</h3>' + KE.placeLabel(carcass.group, carcass.column, carcass.span) + ' · ' + KE.LABELS.carcassKind[carcass.kind] + ' · ' + round1(carcass.x1 - carcass.x0) + ' × ' + round1(carcass.h1 - carcass.h0) + ' × ' + model.carcassDepth + (carcass.flags.length ? ' · ' + carcass.flags.map(f => KE.LABELS.flag[f]).join(', ') : '') +
      [...new Set(boards.map(b => b.material))].map(m => section(model.materials[m].label, partList(boards.filter(b => b.material === m)))).join('') +
      section('Fronts', frontLines) + section('Drawers', drawerLines) + section('Hardware', hardware) + '</div>';
  });
  /* the parts without a carcass, per group, by column (a frame and its back strip together) */
  const loose = {};
  const add = (p, text, key) => (loose[p.group] = loose[p.group] || []).push({ column: columnOfPart(p), place: place(p), label: label(key), text });
  model.fronts.filter(f => !f.carcassId).forEach(f => add(f, frontFunction(f) + ' ' + round1(f.width) + ' × ' + round1(f.height) + (f.item.handle ? ', handle ' + SIDE[f.item.handle] : ''), KE.cutKey(frontPart(f))));
  model.strips.forEach(p => add(p, p.name + ' ' + size(p.a, p.b), KE.cutKey(p)));
  model.frontPanels.forEach(p => add(p, p.name + ' ' + size(p.a, p.b) + withEdges(p.edges) + withLacquer(p.lacqueredSides), KE.cutKey(p)));
  model.wallPanels.forEach(p => add(p, p.name + ' ' + size(p.a, p.b), KE.cutKey(p)));
  model.boards.filter(b => !b.carcassId).forEach(b => add(b, b.name + ' ' + size(b.a, b.b) + ' (' + model.materials[b.material].label + ')', KE.cutKey(b)));
  model.plinths.forEach(p => add(p, 'Plinth ' + size(p.a, p.b), KE.cutKey({ ...p, name: 'Plinth' })));
  model.plaster.forEach(p => add(p, p.name + ' ' + size(p.a, p.b), KE.cutKey(p)));
  const looseCards = Object.keys(loose).sort().map(group => {
    const count = new Map();               // the same part at the same place once, with its count; the order met within a column
    for (const x of [...loose[group]].sort((p, q) => p.column - q.column)) {
      const key = x.place + ' – ' + x.label + x.text;
      count.set(key, { ...x, n: (count.has(key) ? count.get(key).n : 0) + 1 });
    }
    const sorted = [...count.values()].map(x => x.place + ' – ' + x.label + (x.n > 1 ? x.n + ' × ' : '') + x.text);
    return '<div class="card"><h3>Group ' + group + ' – without a carcass</h3>' + listLines(sorted).replace(/^<br>/, '') + '</div>';
  });
  return { legend: esc(assemblyLegend()).replace(/\n/g, '<br>'), cards: cards.join('') + looseCards.join('') };
}

/* ---------- the values of the inputs (parameters, quantities, prices) ---------- */
let values = null;
values = {
  params: Object.fromEntries(Object.entries(COST.params).map(([name, value]) => [name, evalQty(value)])),
  items: Object.fromEntries(ITEMS.map(item => [item.id, { qty: item.qty, price: item.price }]))
};
/* the totals of each cut-list block: m², banding, cutting length, pieces; and the same per row */
function blockTotals() {
  const totals = {};
  for (const block of COST.blocks) {
    const t = { m2: 0, edge: 0, cut: 0, qty: 0, rows: [] };
    (rowsOf[block.id] || []).forEach(row => {
      const { a, b, qty, edges } = row, m2 = (a * b * qty) / 1e6;
      const edge = edges && edges.length ? (edgeLength(edges) * qty) / 1000 : null;   // banded edges; fronts, strips and plinths have none
      const cut = block.cut ? ((a + b) * qty) / 1000 : null;
      t.m2 += m2; t.qty += qty; t.edge += edge || 0; t.cut += cut || 0;
      t.rows.push({ m2, edge, cut });
    });
    totals[block.id] = t;
  }
  return totals;
}
function ROUNDUP(x, digits) { const f = Math.pow(10, digits || 0); return Math.ceil(x * f - 1e-9) / f; }
/* a carcass by name: width, height, innerWidth, h0, h1 */
function carcassValue(rest) {
  const [name, field] = rest.split('.'), carcass = model.carcasses.find(c => c.name === name);
  if (!carcass) return NaN;
  const width = carcass.x1 - carcass.x0;
  return { width, height: carcass.h1 - carcass.h0, innerWidth: width - 2 * model.thickness.carcass, h0: carcass.h0, h1: carcass.h1 }[field] ?? NaN;
}
/* an item by carcass name or place and type or tag ("K25/oven", "G1[6]/dishwasher", "K25/cabinet#2" = the second from the
   bottom): width, height, h0, h1 (its module); frontWidth, frontHeight, frontH0, frontH1 (its front); space = the clear
   height between the nearest horizontal boards of its carcass below (spaceBottom) and above (spaceTop) its middle; the
   drawers behind its door: count, runnerLength, boxWidth, boxHeight, frontWidth, frontHeight; hinge = its door's hinge side;
   edges = a panel's banded edges; fit.* = how its appliance sits in it */
function itemValue(rest) {
  const dot = rest.indexOf('.'), field = rest.slice(dot + 1), [where, what = ''] = rest.slice(0, dot).split('/'), [kind, n] = what.split('#');
  const item = Object.values(model.groups).flatMap(groupModel => groupModel.items)
    .filter(i => (i.carcass === where || KE.placeLabel(i.group, i.column, i.span) === where) && (i.type === kind || i.tags.includes(kind)))
    .sort((a, b) => a.h0 - b.h0)[(Number(n) || 1) - 1];
  if (!item) return NaN;
  const f = item.front, carcass = model.carcasses.find(c => c.id === item.carcassId);
  const { bottom: spaceBottom, top: spaceTop } = carcass ? KE.spaceAround(model.boards, carcass, item.h0, item.h1) : { bottom: NaN, top: NaN };
  const panel = model.frontPanels.find(p => p.item === item);
  const v = {
    width: item.x1 - item.x0, height: item.h1 - item.h0, h0: item.h0, h1: item.h1,
    frontWidth: f ? f.width : NaN, frontHeight: f ? f.height : NaN, frontH0: f ? f.h0 : NaN, frontH1: f ? f.h1 : NaN,
    spaceBottom, spaceTop, space: spaceTop - spaceBottom,
    ...(f && f.doorDrawers ? { count: f.doorDrawers.count, runnerLength: f.doorDrawers.runnerLength, boxWidth: f.doorDrawers.boxWidth, boxHeight: f.doorDrawers.boxHeight } : {}),
    ...(f && f.hand ? { hinge: SIDE[f.hand] } : {}),
    ...(panel ? { edges: edgeText(panel.edges) || sideText(panel.lacqueredSides) || 'none' } : {}),
    fit: item.fit
  };
  return KE.valueAt(v, field) ?? NaN;
}
/* {=...}: the expression with each <placeholder> as its value */
function calculate(expr, totals, quantities) {
  const js = expr.replace(/<([^>]+)>/g, (_, key) => `(${Number(placeholder(key.trim(), totals, quantities))})`);
  return Function('ROUND', 'ROUNDUP', 'MIN', 'MAX', `return (${js});`)(Math.round, ROUNDUP, Math.min, Math.max);
}
/* a placeholder's value: the list in room/project.md (format docs) */
function placeholder(key, totals, quantities) {
  const [, prefix, rest] = key.match(/^(?:(\w+):)?(.+)$/), path = KE.valueAt;
  if (prefix === 'nodes') return NODES[rest] || 0;
  if (prefix === 'n') return path(model.counts, rest) ?? 0;
  if (prefix === 'w') return path(model.worktops, rest);
  if (prefix === 'g') return path(model.groups, rest);
  if (prefix === 's') return path(model.settings, rest);
  if (prefix === 't') return model.thickness[rest];
  if (prefix === 'd') return model.materials[model.materialFor[rest]].depth;
  if (prefix === 'm') return model.materials[model.materialFor[rest]].label;
  if (prefix === 'k') return carcassValue(rest);
  if (prefix === 'i') return itemValue(rest);
  if (prefix === 'note') return noteNumber[rest] ?? NaN;
  if (prefix === 'f') return COST.formulas && COST.formulas[rest] ? calculate(COST.formulas[rest], totals, quantities) : NaN;
  if (prefix === 'a') return path(APPLIANCES, rest);
  if (prefix === 'v') return path(COST.values, rest);
  if (prefix === 'p') return Number(values.items[rest].price);
  if (prefix === 'q') return quantities ? quantities[rest] : NaN;
  if (!prefix && values && rest in values.params) return Number(values.params[rest]);
  const [block, total] = rest.split('.');
  return totals && totals[block] ? totals[block][total] : NaN;
}
/* a quantity: a number, or a formula "=..." with placeholders and ROUNDUP only (the XLSX writes it as an Excel formula) */
function evalQty(expr, totals, quantities) {
  if (typeof expr === 'number') return expr;
  const js = expr.replace(/^=/, '').replace(/\{([^}|]+)\}/g, (_, key) => `(${Number(placeholder(key, totals, quantities))})`);
  return Function('ROUNDUP', `return (${js});`)(ROUNDUP);
}
let lastResult = null;
/* a text with its placeholders filled with the current values */
function fill(text) {
  const totals = lastResult && lastResult.totals, quantities = lastResult && lastResult.quantities;
  const show = (v, percent) => {
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'string') return v;
    if (!Number.isFinite(v)) return '…';
    return percent ? Math.round(v * 1000) / 10 + '%' : String(Math.round(v * 1000) / 1000);
  };
  return String(text ?? '')
    .replace(/\{=([^}|]+)(\|%)?\}/g, (m, expr, percent) => show(calculate(expr, totals, quantities), percent))
    .replace(/\{([^}|]+)(\|%)?\}/g, (m, key, percent) => show(placeholder(key, totals, quantities), percent));
}
/* the quantities, values, the categories' sums and the totals */
function compute() {
  const totals = blockTotals(), quantities = {}, itemValues = {}, categorySums = {};
  let furniture = 0, apps = 0;
  for (const category of COST.categories) {
    let sum = 0;
    for (const item of category.items) {
      quantities[item.id] = evalQty(values.items[item.id].qty, totals, quantities);
      itemValues[item.id] = Math.round(quantities[item.id] * Number(values.items[item.id].price) * 100) / 100;
      sum += itemValues[item.id];
    }
    categorySums[category.name] = sum;
    if (category.appliances) apps += sum; else furniture += sum;
  }
  const reserve = Math.round(furniture * Number(values.params.reserve) * 100) / 100;
  return (lastResult = { totals, quantities, itemValues, categorySums, furniture, appliances: apps, reserve, total: furniture + apps + reserve });
}

function buildBook() {
  const result = compute(), E = HOME.estimate;
  /* the cut list: as an order form, each size followed by the number of its finished edges */
  const cutting = E.cutList({ title: 'Cut list – the kitchen\'s boards (sizes in mm)', note: fill(COST.labels.cuttingNote),
    screen: [6, 's2n9m36', 6, 3, 6, 3, 6, 5, 7, 6, 21, 's1n8m24'],
    blocks: COST.blocks.map(block => ({ id: block.id, title: fill(block.title), columns: block.columns, cut: block.cut,
      rows: (rowsOf[block.id] || []).map((row, i) => {
        const along = edgeCounts(row);
        return { label: codeOfRow[row.key], name: row.name, a: row.a, edgesA: along.length, b: row.b, edgesB: along.width, qty: row.qty,
          edge: result.totals[block.id].rows[i].edge != null ? edgeLength(row.edges) : null, cutouts: cutoutLines(row), where: row.where };
      }) })),
    legend: cutoutLegend() });
  /* the notes */
  const notes = [{ kind: 'title', cells: ['Notes – open questions / assumptions'] }, { cells: ['The estimate\'s items refer here by "see note N".'] }, { cells: [] },
    { kind: 'head', cells: ['No.', 'Topic', 'Description', 'Assumed in the estimate', 'To decide'] }];
  const noteRow = {};
  COST.notes.forEach((section, i) => {
    notes.push({ kind: 'cat', cells: [sectionTitle(section, i)] });
    for (const n of section.notes) {
      noteRow[n.id] = notes.length + 1;
      notes.push({ cells: [noteNumber[n.id], fill(n.topic), { text: fill(n.description), links: noteDocuments(n).map(l => ({ text: l.name, href: l.url })) }, fill(n.assumed), fill(n.decide)] });
    }
  });
  /* the estimate: a quantity -> an Excel formula: other items' quantities, the parameters and the cut list's m², banding
     and cut totals as references to their cells, the rest as values */
  const toExcel = (expr, ref) => expr.replace(/^=/, '')
    .replace(/\{q:(\w+)\}/g, (_, id) => ref.item(id))
    .replace(/\{(\w+)\.(m2|edge|cut)\}/g, (_, block, total) => `'Cut list'!$${{ m2: 'G', edge: 'I', cut: 'J' }[total]}$${cutting.total[block]}`)
    .replaceAll('{waste}', ref.param('waste'))
    .replaceAll('{sheet}', ref.param('sheet'))
    .replace(/\{([^}|]+)\}/g, (_, key) => String(Number(placeholder(key, result.totals, result.quantities))));
  const estimate = E.estimate({ title: COST.page.heading, info: fill(COST.page.info),
    screen: [4, 's2n16', 's3', 's3', 8, 5, 10, 10, 's5'],
    params: [{ key: 'waste', label: 'Board waste allowance', v: Number(values.params.waste), z: '0%' }, { key: 'sheet', label: fill(COST.labels.sheet), v: Number(values.params.sheet) }],
    categories: COST.categories.map(category => ({ name: category.name, group: category.appliances ? 'Appliances' : 'Furniture', items: category.items.map(({ id }) => ITEM[id]).map(item => ({
      id: item.id, name: fill(item.name), spec: fill(item.spec), use: fill(item.use), unit: item.unit, price: Number(values.items[item.id].price),
      qty: typeof item.qty === 'string' ? ref => ({ f: toExcel(item.qty, ref), z: /ROUNDUP/.test(item.qty) ? undefined : '#,##0.00' }) : Number(values.items[item.id].qty),
      source: { text: fill(item.source), links: [...(item.links || []).map(l => ({ text: l.name, href: l.url })),
        ...(item.refs || []).map(id => ({ text: 'see note ' + noteNumber[id], href: `#'Notes'!A${noteRow[id]}` }))] } })) })),
    totals: [{ label: 'Furniture (materials) total', group: 'Furniture' }, { label: 'Appliances total', group: 'Appliances' }],
    reserve: { label: 'Reserve for small items / estimated prices', note: '% of the furniture', v: Number(values.params.reserve), of: 0 },
    excluded: COST.page.excluded.map(fill),
    after: [['', { text: '• Questions and assumptions: see the sheet Notes.', href: "#'Notes'!A1" }]] });
  return { sheets: [estimate.sheet, cutting.sheet, { name: 'Notes', cols: [6, 34, 70, 42, 40].map((width, i) => ({ width, ...[{ fix: 3 }, { share: 2, max: 40 }, { share: 5 }, { share: 2 }, { share: 4 }][i] })), rows: notes }],
    result };
}

/* the checks of the Documents: what the tree holds counted as the model counts it */
const SAME = [['hinge', 'hinges'], ['bumper', 'bumpers'], ['leg', 'legs'], ['grille', 'grilles'], ['handle', 'handles'], ['shelfPin', 'shelfPins'], ['sink', 'sinks'],
  ['hob', 'hobs'], ['fridgeFreezer', 'fridges'], ['oven', 'type.oven'], ['microwave', 'type.microwave'], ['coffee', 'tag.coffee'], ['dishwasher', 'tag.dishwasher']];
const checks = () => [{ name: 'Documents: the tree counts as the model', about: 'Each kind of hardware and appliance the estimate counts from the tree\'s nodes (hinges, legs, handles, the sink …) is as many as the cabinets\' model counts.',
  items: SAME.filter(([k, c]) => (NODES[k] || 0) !== (KE.valueAt(model.counts, c) || 0)).map(([k, c]) => `${k}: ${NODES[k] || 0} nodes, the model ${KE.valueAt(model.counts, c) || 0}`) }];

return { book: buildBook, assembly: renderAssembly, warnings: model.warnings, page: COST.page, fill, nodes: NODES, checks };
}

HOME.docs = { create };
})(window.HOME = window.HOME || {});
