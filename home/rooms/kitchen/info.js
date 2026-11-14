/* rooms/kitchen/info.js: the kitchen's estimate, cutting list and notes from model.js and estimate.dat.js, built with the
   shared sheets of core/info.js (Kosztorys, Lista cięć) as every application's, and the assembly cards. Shown in Info
   of index.html. Knows the format of estimate.dat.js (its placeholders are listed at its top), not this kitchen. */
(function (root) {
'use strict';

/* model: KE.build of the project; APPLIANCES: KE.appliances of it. Returns {book(), assembly(), warnings, page} */
function create(model, APPLIANCES) {
const KE = root.KitchenEngine, COST = root.KITCHEN_COST, LIBRARY = root.CORE.library;
/* an item of the estimate: its product from the library (a material: the board design.dat.js gives that use), the rest
   the project's: what it is called for a material, the spec's own part, the use, the quantity, the notes */
const BOARD_OF = Object.fromEntries(Object.entries(root.KITCHEN_DESIGN.materials).flatMap(([key, m]) => m.uses.map(u => [u, key])));
const productOf = item => LIBRARY.product(item.material ? BOARD_OF[item.material] : item.product);
const ITEMS = COST.categories.flatMap(c => c.items).map(item => {
  const P = productOf(item);
  return Object.assign({}, item, { name: item.material ? item.name : P.name, spec: item.material ? item.spec : [P.spec, item.spec].filter(Boolean).join(', '),
    unit: P.unit, price: P.price, source: P.priceNote || '', links: [...(P.links || []), ...(P.buy || [])] });
});
const ITEM = Object.fromEntries(ITEMS.map(item => [item.id, item]));
// notes are numbered in their order, sections lettered: note id -> number ("patrz notatka 20")
const NOTES = COST.notes.flatMap(section => section.notes);
const noteNumber = Object.fromEntries(NOTES.map((n, i) => [n.id, String(i + 1)]));
const sectionTitle = (section, i) => String.fromCharCode(65 + i) + '. ' + section.name;
// the documents of a note: its appliance's (the library), then its own
const noteDocuments = n => [...(n.appliance ? APPLIANCES[n.appliance].links : []), ...(n.links || [])];

const round1 = x => Math.round(x * 10) / 10;
const esc = root.CORE.ui.esc;
const plural = KE.plural;
// banded edges of one part, e.g. "dół 80 + lewa 720"; their total length in mm
const edgeText = edges => (edges || []).map(edge => KE.LABELS.edge[edge.side] + ' ' + edge.length).join(' + ');
const edgeLength = edges => (edges || []).reduce((sum, edge) => sum + edge.length, 0);
// finished lacquered edges of a front panel by side, e.g. "dół + lewa"
const sideText = sides => (sides || []).map(side => KE.LABELS.edge[side]).join(' + ');
const num1 = x => String(x).replace('.', ',');
// cut-outs of a cut-list row (worktops, cut by the supplier's CNC): "WZ 680×420 @ 1234x110", codes in cutoutLegend()
function cutoutLines(row) {
  const code = KE.LABELS.holeCode;
  const lines = row.drillings.flatMap(({ drilling }) => drilling.cutouts.map(c => code[c.kind] + ' ' + c.width + '×' + c.depth + ' @ ' + num1(c.x) + 'x' + num1(c.y)));
  return [...new Set(lines)];
}
// the legend under the cutting list: labels and cut-out codes, from design.dat.js settings.cutouts
function cutoutLegend() {
  const labels = KE.LABELS, c = model.settings.cutouts || {}, from = 'x ' + labels.holeFrom.left + ', y ' + labels.holeFrom.back;
  return [
    { code: 'Etykieta', text: 'kod w pierwszej kolumnie (np. KO-07): jeden kod na każdy rozmiar części; ten sam kod w zakładce Montaż – nakleić na części przy odbiorze z hurtowni' },
    ...Object.entries(c).map(([kind, r]) => ({ code: labels.holeCode[kind], text: labels.hole[kind] + ' ' + r.width + ' × ' + r.depth + ' – blat; ' + from + ' (patrząc od przodu); wymiar sprawdzić z szablonem producenta' })),
    { code: 'Zapis', text: 'wycięcie: KOD szer.×gł. @ x x y lewego tylnego narożnika, mm' }
  ];
}
// holes of one part for the assembly: only the positions along the part (from its bottom); how far from the front or the hinge edge
// comes from the template or the fitting itself (assemblyLegend). A hinge plate: the axis of its pair of holes.
function holeText(drilling) {
  const parts = [];
  const ORDER = ['cup', 'bumper', 'plate', 'shelfPin', 'runner'];
  for (const kind of [...new Set(drilling.holes.map(h => h.kind))].sort((p, q) => ORDER.indexOf(p) - ORDER.indexOf(q))) {
    let ys = [...new Set(drilling.holes.filter(h => h.kind === kind).map(h => h.y))].sort((p, q) => p - q);
    if (kind === 'bumper') continue; // in a board edge: below
    if (kind === 'plate') ys = ys.filter((_, i) => i % 2 === 0).map((y, i) => round1((y + ys[2 * i + 1]) / 2));
    parts.push(KE.LABELS.hole[kind] + ' ' + ys.map(num1).join(', '));
  }
  // bumpers in the front edge of a board: how far from which end
  const bumpers = drilling.holes.filter(h => h.kind === 'bumper'), ends = [...new Set(bumpers.map(h => h.from))];
  const edge = ends.map(from => 'odbojnik w krawędzi przedniej ' + KE.LABELS.holeFrom[from] + ': ' + bumpers.filter(h => h.from === from).map(h => num1(h.x)).join(', ')).join('; ');
  return [parts.length ? 'otwory ' + KE.LABELS.holeFrom[drilling.from.y] + ': ' + parts.join('; ') : '', edge].filter(Boolean).join('; ');
}
// the drilling rules over the assembly cards, from design.dat.js settings.drilling
function assemblyLegend() {
  const d = model.settings.drilling, list = xs => xs.map(num1).join(', ');
  const remark = kind => ((COST.labels.legend || {})[kind] ? ' (' + COST.labels.legend[kind] + ')' : '');
  return [
    'Otwory: wysokość osi od dołu części (drzwi: od dołu frontu), w mm. Odległość od przodu daje szablon albo okucie:',
    '· puszka zawiasu Ø' + num1(d.cup.diameter) + ', gł. ' + d.cup.depth + ', ' + d.cup.fromEdge + ' od krawędzi zawiasów',
    '· prowadnik zawiasu: podana oś zawiasu, 2 otwory Ø' + num1(d.plate.diameter) + ' co ' + d.plate.spacing + ', ' + d.plate.fromFront + ' od przodu',
    '· odbojnik Ø' + num1(d.bumper.diameter) + ', gł. ' + num1(d.bumper.depth) + ': naprzeciw każdego zawiasu, na jego wysokości; w przedniej krawędzi boku (słupka), na środku grubości',
    '· podpórka półki Ø' + num1(d.shelfPin.diameter) + ': ' + d.shelfPin.fromFront + ' od przodu i ' + d.shelfPin.fromBack + ' od tyłu, ' + d.shelfPin.belowShelf + ' pod półką',
    '· prowadnica szuflady / półki wysuwanej: wg prowadnicy, otwory ' + list(d.runner.fromFront) + ' od przodu, ' + d.runner.belowDrawer + ' pod dnem' + remark('runner'),
    '· prowadnica kulkowa (szuflady za drzwiami): ' + list(d.ballRunner.fromFront) + ' od przodu, ' + d.ballRunner.aboveBottom + ' nad dnem skrzynki',
    'L / P: boki i słupki zawiasowe lewy / prawy patrząc na szafkę od przodu (otwory od środka); drzwi z zawiasami po lewej / prawej.'
  ].join('\n');
}
// finished edges of one piece per side, as an order form for the board supplier has them: {length, width} = edges along each, 0, 1 or 2.
// banded edges (boards, front panels of an unlacquered material) come from model.js as [{side, length, along}] (along: a | b);
// lacquered edges (fronts, strips, plinth, lacquered front panels) as {long, short}.
// (a cut-list row, KE.cutList: a = the length, b = the width; fronts are width × height, so the long side can be either)
const edgeCounts = row => {
  const { lacquer, edges = [] } = row;
  if (lacquer) return row.a >= row.b ? { length: lacquer.long, width: lacquer.short } : { length: lacquer.short, width: lacquer.long };
  const along = size => edges.filter(edge => edge.along === size).length;
  return { length: along('a'), width: along('b') };
};
// cut-list rows: the longer side first (a; the edges turn with it), sorted by name, then longest first
const turnEdges = edges => (edges || []).map(edge => ({ ...edge, along: edge.along === 'a' ? 'b' : 'a' }));
const longFirst = rows => rows.map(row => (row.a >= row.b ? row : { ...row, a: row.b, b: row.a, edges: turnEdges(row.edges) }));
const sortRows = rows => rows.sort((x, y) => x.name.localeCompare(y.name) || y.a - x.a || y.b - x.b);

// label of a front ("Function" column): the first labels.fronts entry for its type and tags; none = its type
function frontFunction(front) {
  const entry = COST.labels.fronts.find(f => f.type === front.item.type && (!f.tags || f.tags.some(t => front.tags.includes(t))));
  return entry ? entry.function : KE.typeLabel(front.item.type);
}

// place of a part without a carcass: G1[4], G1[1-3]; a part without a column is just its group
const place = p => (p.item ? KE.placeLabel(p.group, p.item.column, p.item.span) : p.column ? KE.placeLabel(p.group, p.column) : 'G' + p.group);
const columnOfPart = p => (p.item ? p.item.column : p.column || 0);

// cutting-list rows of one block: its id = fronts | strips | plinths | frontPanels | wallPanels | plaster | worktops | endPanels, or a material use
// (carcass, drawerBox, backPanel ...): every board of that use's material
let rowsOf = {}; // block id -> its rows, from the model
let codeOfRow = {}; // cutKey of a row -> its label
// a front as a cut-list part: width × height, as fronts are always given
const frontPart = f => ({ ...f, name: frontFunction(f), a: round1(f.width), b: round1(f.height) });
function blockRows(blockId) {
  const carcassName = Object.fromEntries(model.carcasses.map(carcass => [carcass.id, carcass.name]));
  const where = p => (p.carcassId ? carcassName[p.carcassId] : place(p)); // carcass name, else group + column
  const list = items => sortRows(longFirst(KE.cutList(items.map(p => ({ ...p, at: where(p) })))));
  const FROM_MODEL = {
    // fronts: width × height
    fronts: () => sortRows(KE.cutList(model.fronts.map(f => ({ ...frontPart(f), at: where(f) })))),
    strips: () => list(model.strips),
    plinths: () => list(model.plinths.map(p => ({ ...p, name: 'Cokół' }))),
    frontPanels: () => list(model.frontPanels),
    wallPanels: () => list(model.wallPanels),
    plaster: () => list(model.plaster),
    worktops: () => list(model.worktopPieces.filter(p => p.item.type === 'worktop')),
    endPanels: () => list(model.worktopPieces.filter(p => p.item.type === 'endPanel'))
  };
  return FROM_MODEL[blockId] ? FROM_MODEL[blockId]() : list(model.boards.filter(b => b.material === model.materialFor[blockId]));
}


// cutting-list rows of each block and the label of each row, from the model
rowsOf = Object.fromEntries(COST.blocks.map(block => [block.id, blockRows(block.id)]));
codeOfRow = {};
for (const block of COST.blocks) (rowsOf[block.id] || []).forEach((row, i) => { codeOfRow[row.key] = block.code + '-' + String(i + 1).padStart(2, '0'); });

// assembly: all parts of one carcass together (boards, fronts, drawers, hardware), then the parts without a carcass per group
function renderAssembly() {
  // a line starting with a tab: a sub-line of the part above it (its holes)
  const listLines = rows => rows.map(t => (t.startsWith('\t') ? '<br><span class="holes">' + esc(t.slice(1)) + '</span>' : '<br>– ' + esc(t))).join('');
  const holeLines = drillings => drillings.map(({ drilling, qty }) => [qty, holeText(drilling)]).filter(([, text]) => text)
    .map(([qty, text], _, all) => '\t' + (all.length > 1 ? qty + ' × ' : '') + text);
  const withEdges = edges => (edges && edges.length ? ' (obrzeże ' + edgeText(edges) + ')' : '');
  const withLacquer = sides => (sides && sides.length ? ' (obrzeże ' + sideText(sides) + ')' : '');
  const label = key => (codeOfRow[key] ? codeOfRow[key] + ' ' : '');
  // one line per hand (left, right, then the rest): which side of the carcass a drilled part goes on
  const byHand = row => {
    const count = new Map();
    for (const { drilling, qty } of row.drillings) count.set(drilling.hand, (count.get(drilling.hand) || 0) + qty);
    const drilled = [...count.values()].reduce((sum, n) => sum + n, 0);
    if (drilled < row.qty) count.set('', (count.get('') || 0) + row.qty - drilled);
    return [...count];
  };
  const partList = boards => sortRows(longFirst(KE.cutList(boards))).flatMap(row => byHand(row).flatMap(([hand, qty]) => [
    label(row.key) + (qty > 1 ? qty + ' × ' : '') + row.name + (hand ? ' ' + KE.LABELS.hand[hand] : '') + ' ' + row.a + ' × ' + row.b + withEdges(row.edges),
    ...holeLines(row.drillings.filter(d => d.drilling.hand === hand))]));
  const size = (a, b) => Math.max(a, b) + ' × ' + Math.min(a, b); // the longer side first, as in the Cutting list
  const section = (title, rows) => (rows.length ? '<br><b>' + esc(title) + '</b>' + listLines(rows) : '');

  const cards = model.carcasses.map(carcass => {
    const boards = model.boards.filter(b => b.carcassId === carcass.id), fronts = model.fronts.filter(f => f.carcassId === carcass.id);
    const pins = boards.filter(b => b.id === 'adjustableShelf').length * KE.PINS_PER_SHELF;
    const hinges = fronts.reduce((n, f) => n + (f.hinges ? f.hinges.length : 0), 0);
    const bumpers = fronts.reduce((n, f) => n + (f.bumpers ? f.bumpers.length : 0), 0);
    const frontLines = fronts.flatMap(f => [label(KE.cutKey(frontPart(f))) + frontFunction(f) + ' ' + round1(f.width) + ' × ' + round1(f.height) + (f.hinges ? ', zawiasy: ' + f.hinges.length + ', strona ' + KE.LABELS.side[f.hand] : '') + (f.handle ? ', uchwyt ' + KE.LABELS.side[f.handle] : ''),
      ...holeLines(KE.cutList([frontPart(f)])[0].drillings)]);
    const drawerLines = [
      ...fronts.filter(f => f.drawer).map(f => 'szuflada ' + f.drawer.size + (f.drawer.bins ? ' z koszami na odpady' : '') + (f.drawer.inner ? ' + szuflada wewnętrzna M' : '')),
      ...fronts.filter(f => f.doorDrawers).map(f => f.doorDrawers.count + ' × szuflada za drzwiami ' + f.doorDrawers.boxWidth + ' × ' + f.doorDrawers.runnerLength + ' × ' + f.doorDrawers.boxHeight + ' (płyta dystansowa po stronie zawiasów)')
    ];
    const doorDrawers = fronts.reduce((n, f) => n + (f.doorDrawers ? f.doorDrawers.count : 0), 0);
    const pullOutShelves = boards.filter(b => b.id === 'pullOutShelf').length;
    const hardware = [
      carcass.legs ? 'nóżki: ' + carcass.legs : '',
      hinges ? 'zawiasy: ' + hinges : '',
      bumpers ? 'odbojniki: ' + bumpers : '',
      pins ? 'podpórki półek: ' + pins : '',
      pullOutShelves ? pullOutShelves + ' ' + plural(pullOutShelves, 'para', 'pary', 'par') + ' prowadnic pełnego wysuwu' : '',
      doorDrawers ? 'prowadnice kulkowe ' + fronts.find(f => f.doorDrawers).doorDrawers.runnerLength + ': ' + doorDrawers + ' kpl.' : ''
    ].filter(Boolean);
    return '<div class="card"><h3>' + esc(carcass.name) + '</h3>' + KE.placeLabel(carcass.group, carcass.column, carcass.span) + ' · ' + KE.LABELS.carcassKind[carcass.kind] + ' · ' + round1(carcass.u1 - carcass.u0) + ' × ' + round1(carcass.v1 - carcass.v0) + ' × ' + model.carcassDepth + (carcass.flags.length ? ' · ' + carcass.flags.map(f => KE.LABELS.flag[f]).join(', ') : '') +
      [...new Set(boards.map(b => b.material))].map(m => section(model.materials[m].label, partList(boards.filter(b => b.material === m)))).join('') +
      section('Fronty', frontLines) + section('Szuflady', drawerLines) + section('Okucia', hardware) + '</div>';
  });

  // parts without a carcass, per group, sorted by column (a frame and its back strip sit together)
  const loose = {};
  const add = (p, text, key) => (loose[p.group] = loose[p.group] || []).push({ column: columnOfPart(p), place: place(p), label: label(key), text });
  model.fronts.filter(f => !f.carcassId).forEach(f => add(f, frontFunction(f) + ' ' + round1(f.width) + ' × ' + round1(f.height) + (f.handle ? ', uchwyt ' + KE.LABELS.side[f.handle] : ''), KE.cutKey(frontPart(f))));
  model.strips.forEach(p => add(p, p.name + ' ' + size(p.a, p.b), KE.cutKey(p)));
  model.frontPanels.forEach(p => add(p, p.name + ' ' + size(p.a, p.b) + withEdges(p.edges) + withLacquer(p.lacqueredSides), KE.cutKey(p)));
  model.wallPanels.forEach(p => add(p, p.name + ' ' + size(p.a, p.b), KE.cutKey(p)));
  model.boards.filter(b => !b.carcassId).forEach(b => add(b, b.name + ' ' + size(b.a, b.b) + ' (' + model.materials[b.material].label + ')', KE.cutKey(b)));
  model.plinths.forEach(p => add(p, 'Cokół ' + size(p.a, p.b), KE.cutKey({ ...p, name: 'Cokół' })));
  model.plaster.forEach(p => add(p, p.name + ' ' + size(p.a, p.b), KE.cutKey(p)));
  const looseCards = Object.keys(loose).sort().map(group => {
    // a stable sort: the order met within a column; the same part at the same place once, with its count
    const count = new Map();
    for (const x of [...loose[group]].sort((p, q) => p.column - q.column)) {
      const key = x.place + ' – ' + x.label + x.text;
      count.set(key, { ...x, n: (count.has(key) ? count.get(key).n : 0) + 1 });
    }
    const sorted = [...count.values()].map(x => x.place + ' – ' + x.label + (x.n > 1 ? x.n + ' × ' : '') + x.text);
    return '<div class="card"><h3>Grupa ' + group + ' – bez korpusu</h3>' + listLines(sorted).replace(/^<br>/, '') + '</div>';
  });
  return { legend: esc(assemblyLegend()).replace(/\n/g, '<br>'), cards: cards.join('') + looseCards.join('') };
}


// note texts: \n starts a new line; under the description the documents the note comes from (noteDocuments)
const lines = text => esc(text).replace(/\n/g, '<br>');
/* ---------- 2. state: the values of the inputs (parameters, item quantities and prices); edits last until reload ---------- */
function defaultValues() {
  return {
    params: Object.fromEntries(Object.entries(COST.params).map(([name, value]) => [name, evalQty(value)])),
    items: Object.fromEntries(ITEMS.map(item => [item.id, { qty: item.qty, price: item.price }]))
  };
}
const defaults = defaultValues();
let values = defaultValues();

/* ---------- 3. calculation ---------- */
// totals of each cutting-list block: m², edging, cutting length, pieces; and the same per row
function blockTotals() {
  const totals = {};
  for (const block of COST.blocks) {
    const t = { m2: 0, edge: 0, cut: 0, qty: 0, rows: [] };
    (rowsOf[block.id] || []).forEach(row => {
      const { a, b, qty, edges } = row;
      const m2 = (a * b * qty) / 1e6;
      // banded edges from model.js; fronts, strips and the plinth have none
      const edge = edges && edges.length ? (edgeLength(edges) * qty) / 1000 : null;
      const cut = block.cut ? ((a + b) * qty) / 1000 : null;
      t.m2 += m2;
      t.qty += qty;
      t.edge += edge || 0;
      t.cut += cut || 0;
      t.rows.push({ m2, edge, cut });
    });
    totals[block.id] = t;
  }
  return totals;
}
function ROUNDUP(x, digits) {
  const f = Math.pow(10, digits || 0);
  return Math.ceil(x * f - 1e-9) / f;
}
// Placeholders in quantities and texts ({n:hinges}, {i:K25/oven.space}, {=...} ...): the full list is at the top of estimate.dat.js.
// Every value comes from design.dat.js (through model.js), the library's appliances or estimate.dat.js.

// a carcass by name: width, height, innerWidth, v0, v1
function carcassValue(rest) {
  const [name, field] = rest.split('.'), carcass = model.carcasses.find(c => c.name === name);
  if (!carcass) return NaN;
  const width = carcass.u1 - carcass.u0;
  return { width, height: carcass.v1 - carcass.v0, innerWidth: width - 2 * model.thickness.carcass, v0: carcass.v0, v1: carcass.v1 }[field] ?? NaN;
}
// an item by carcass name or place and type or tag ("K11/oven", "G1[5]/dishwasher", "K11/cabinet#2" = the second from the bottom):
// module width, height, v0, v1; its front frontWidth, frontHeight, frontV0, frontV1; space = the clear height between the
// nearest horizontal boards of its carcass below (spaceBottom) and above (spaceTop) its middle; drawers behind its door (tag doorDrawers):
// count, runnerLength, boxWidth, boxHeight; hinge = the hinge side of its door; edges = the banded edges of a panel ("lewa 717", "brak");
// fit.* = how its appliance sits in it (model.js fitAppliances: fit.bodyV0, fit.feet, fit.fasciaV0, fit.doorV0 ...)
function itemValue(rest) {
  const dot = rest.indexOf('.'), field = rest.slice(dot + 1), [where, what = ''] = rest.slice(0, dot).split('/'), [kind, n] = what.split('#');
  const item = Object.values(model.groups).flatMap(groupModel => groupModel.items)
    .filter(i => (i.carcass === where || KE.placeLabel(i.group, i.column, i.span) === where) && (i.type === kind || i.tags.includes(kind)))
    .sort((a, b) => a.v0 - b.v0)[(Number(n) || 1) - 1];
  if (!item) return NaN;
  const f = item.front, carcass = model.carcasses.find(c => c.id === item.carcassId);
  const { bottom: spaceBottom, top: spaceTop } = carcass ? KE.spaceAround(model.boards, carcass, item.v0, item.v1) : { bottom: NaN, top: NaN };
  const panel = model.frontPanels.find(p => p.item === item);
  const values = {
    width: item.u1 - item.u0, height: item.v1 - item.v0, v0: item.v0, v1: item.v1,
    frontWidth: f ? f.width : NaN, frontHeight: f ? f.height : NaN, frontV0: f ? f.v0 : NaN, frontV1: f ? f.v1 : NaN,
    spaceBottom, spaceTop, space: spaceTop - spaceBottom,
    ...(f && f.doorDrawers ? { count: f.doorDrawers.count, runnerLength: f.doorDrawers.runnerLength, boxWidth: f.doorDrawers.boxWidth, boxHeight: f.doorDrawers.boxHeight } : {}),
    ...(f && f.hand ? { hinge: KE.LABELS.side[f.hand] } : {}),
    ...(panel ? { edges: edgeText(panel.edges) || sideText(panel.lacqueredSides) || 'brak' } : {}),
    fit: item.fit
  };
  return KE.valueAt(values, field) ?? NaN;
}
// {=...}: the expression with each <placeholder> as its value
function calculate(expr, totals, quantities) {
  const js = expr.replace(/<([^>]+)>/g, (_, key) => `(${Number(placeholder(key.trim(), totals, quantities))})`);
  return Function('ROUND', 'ROUNDUP', 'MIN', 'MAX', `return (${js});`)(Math.round, ROUNDUP, Math.min, Math.max);
}
function placeholder(key, totals, quantities) {
  const [, prefix, rest] = key.match(/^(?:(\w+):)?(.+)$/);
  const path = KE.valueAt;
  if (prefix === 'n') return model ? (path(model.counts, rest) ?? 0) : NaN;
  if (prefix === 'w') return model ? path(model.worktops, rest) : NaN;
  if (prefix === 'g') return model ? path(model.groups, rest) : NaN; // a group: {g:3.backGap}
  if (prefix === 's') return model ? path(model.settings, rest) : NaN;
  if (prefix === 't') return model ? model.thickness[rest] : NaN;
  if (prefix === 'd') return model ? model.materials[model.materialFor[rest]].depth : NaN;
  if (prefix === 'm') return model ? model.materials[model.materialFor[rest]].label : '…';
  if (prefix === 'k') return model ? carcassValue(rest) : NaN;
  if (prefix === 'i') return model ? itemValue(rest) : NaN;
  if (prefix === 'note') return noteNumber[rest] ?? NaN;
  if (prefix === 'f') return model && COST.formulas && COST.formulas[rest] ? calculate(COST.formulas[rest], totals, quantities) : NaN;
  if (prefix === 'a') return path(APPLIANCES, rest);
  if (prefix === 'v') return path(COST.values, rest);
  if (prefix === 'p') return Number(values.items[rest].price);
  if (prefix === 'q') return quantities ? quantities[rest] : NaN;
  if (!prefix && rest in values.params) return Number(values.params[rest]);
  const [block, total] = rest.split('.');
  return totals && totals[block] ? totals[block][total] : NaN;
}
// quantity: a number, or a formula "=..." with placeholders and ROUNDUP only: the XLSX export writes it as an Excel formula,
// and ROUNDUP(x, digits) is the same there (the texts' {=...} may also use ROUND, MIN, MAX)
function evalQty(expr, totals, quantities) {
  if (typeof expr === 'number') return expr;
  const js = expr.replace(/^=/, '').replace(/\{([^}|]+)\}/g, (_, key) => `(${Number(placeholder(key, totals, quantities))})`);
  return Function('ROUNDUP', `return (${js});`)(ROUNDUP);
}
let lastResult = null; // last compute() result, for the texts
// text with placeholders, filled with the current values
function fill(text) {
  const totals = lastResult && lastResult.totals, quantities = lastResult && lastResult.quantities;
  const show = (v, percent) => {
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'string') return v;
    if (!Number.isFinite(v)) return '…';
    return (percent ? Math.round(v * 1000) / 10 + '%' : String(Math.round(v * 1000) / 1000)).replace('.', ','); // plain numbers: sizes read 2800, not 2 800; Polish decimal comma
  };
  return String(text ?? '')
    .replace(/\{=([^}|]+)(\|%)?\}/g, (m, expr, percent) => show(model ? calculate(expr, totals, quantities) : NaN, percent))
    .replace(/\{([^}|]+)(\|%)?\}/g, (m, key, percent) => show(placeholder(key, totals, quantities), percent));
}
// quantities, values, category sums and totals of the estimate
function compute() {
  const totals = blockTotals(), quantities = {}, itemValues = {}, categorySums = {};
  let furniture = 0, appliances = 0;
  for (const category of COST.categories) {
    let sum = 0;
    for (const item of category.items) {
      quantities[item.id] = evalQty(values.items[item.id].qty, totals, quantities);
      itemValues[item.id] = Math.round(quantities[item.id] * Number(values.items[item.id].price) * 100) / 100;
      sum += itemValues[item.id];
    }
    categorySums[category.name] = sum;
    if (category.appliances) appliances += sum;
    else furniture += sum;
  }
  const reserve = Math.round(furniture * Number(values.params.reserve) * 100) / 100;
  return (lastResult = { totals, quantities, itemValues, categorySums, furniture, appliances, reserve, total: furniture + appliances + reserve });
}

function buildBook() {
  const result = compute(), INFO = root.CORE.info;

  // sheet "Lista cięć" (core/info.js): as an order form, each size followed by the number of finished edges along it
  const cutting = INFO.cutList({ title: 'Lista cięć – płyty obliczone przez model.js z design.dat.js (wymiary w mm)', note: fill(COST.labels.cuttingNote),
    blocks: COST.blocks.map(block => ({ id: block.id, title: fill(block.title), columns: block.columns, cut: block.cut,
      rows: (rowsOf[block.id] || []).map((row, i) => {
        const along = edgeCounts(row);
        return { label: codeOfRow[row.key], name: row.name, a: row.a, edgesA: along.length, b: row.b, edgesB: along.width, qty: row.qty,
          edge: result.totals[block.id].rows[i].edge != null ? edgeLength(row.edges) : null, cutouts: cutoutLines(row), where: row.where };
      }) })),
    legend: cutoutLegend() });

  // sheet "Notatki"
  const notes = [{ kind: 'title', cells: ['Notatki – pytania otwarte / założenia'] }, { cells: ['Pozycje kosztorysu odsyłają tu przez „patrz notatka N”.'] }, { cells: [] },
    { kind: 'head', cells: ['Lp.', 'Temat', 'Opis', 'Przyjęte w kosztorysie', 'Do decyzji'] }];
  const noteRow = {};
  COST.notes.forEach((section, i) => {
    notes.push({ kind: 'cat', cells: [sectionTitle(section, i)] });
    for (const n of section.notes) {
      noteRow[n.id] = notes.length + 1;
      notes.push({ cells: [noteNumber[n.id], fill(n.topic), { text: fill(n.description), links: noteDocuments(n).map(l => ({ text: l.name, href: l.url })) }, fill(n.assumed), fill(n.decide)] });
    }
  });

  // sheet "Kosztorys" (core/info.js): a quantity of estimate.dat.js -> an Excel formula: other positions' quantities, the parameters
  // and the m², edge banding and cut totals of the cutting list as cell references, the rest as values
  const toExcel = (expr, ref) => expr.replace(/^=/, '')
    .replace(/\{q:(\w+)\}/g, (_, id) => ref.item(id))
    .replace(/\{(\w+)\.(m2|edge|cut)\}/g, (_, block, total) => `'Lista cięć'!$${{ m2: 'G', edge: 'I', cut: 'J' }[total]}$${cutting.total[block]}`)
    .replaceAll('{waste}', ref.param('waste'))
    .replaceAll('{sheet}', ref.param('sheet'))
    .replace(/\{([^}|]+)\}/g, (_, key) => String(Number(placeholder(key, result.totals, result.quantities))));
  const estimate = INFO.estimate({ title: COST.page.heading, info: fill(COST.page.info),
    params: [{ key: 'waste', label: 'Naddatek na odpad płyt', v: Number(values.params.waste), z: '0%' }, { key: 'sheet', label: fill(COST.labels.sheet), v: Number(values.params.sheet) }],
    categories: COST.categories.map(category => ({ name: category.name, group: category.appliances ? 'AGD' : 'Meble', items: category.items.map(({ id }) => ITEM[id]).map(item => ({
      id: item.id, name: fill(item.name), spec: fill(item.spec), use: fill(item.use), unit: item.unit, price: Number(values.items[item.id].price),
      qty: typeof item.qty === 'string' ? ref => ({ f: toExcel(item.qty, ref), z: /ROUNDUP/.test(item.qty) ? undefined : '#,##0.00' }) : Number(values.items[item.id].qty),
      // the remark, then the shops by name and the notes it refers to (a link each; the XLSX cell opens the first)
      source: { text: fill(item.source), links: [...(item.links || []).map(l => ({ text: l.name, href: l.url })),
        ...(item.refs || []).map(id => ({ text: 'patrz notatka ' + noteNumber[id], href: `#'Notatki'!A${noteRow[id]}` }))] } })) })),
    totals: [{ label: 'Meble (materiały) razem', group: 'Meble' }, { label: 'AGD razem', group: 'AGD' }],
    reserve: { label: 'Rezerwa na drobne pozycje / ceny szacunkowe', note: '% mebli', v: Number(values.params.reserve), of: 0 },
    excluded: COST.page.excluded.map(fill),
    after: [['', { text: '• Pytania i założenia: patrz arkusz Notatki.', href: "#'Notatki'!A1" }]] });

  return { sheets: [estimate.sheet, cutting.sheet, { name: 'Notatki', cols: [6, 34, 70, 42, 40].map(width => ({ width })), rows: notes }] };
}

return { book: buildBook, assembly: renderAssembly, warnings: model.warnings, page: COST.page, fill };
}

root.KitchenCost = { create };
})(window);
