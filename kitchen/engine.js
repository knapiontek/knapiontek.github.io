/* engine.js - builds the kitchen model from design.js for design.html, cost.html and view.html.
   The same project always gives the same model. No drawing and no numbers of this kitchen: they all come from design.js.
   Coordinates in mm per group: u along the group, v up from the floor, n out from the carcass backs (the same in every group;
   the wall of a group lies settings.carcass.wallGap of that group behind them: groups[g].wall); a box is [u0, u1, v0, v1, n0, n1]. */
(function (root) {
  'use strict';

  /* ================= 1. VOCABULARY: types, tags and what they build ================= */

  // type = what a component is; exactly one per component, it decides what gets built (rules.md, section 2)
  const TYPES = ['space', 'plasterboard', 'plinth', 'worktop', 'endPanel', 'wallPanel', 'frontPanel', 'strip', 'cabinet', 'drawer', 'oven', 'microwave'];

  // tag = an extra on a type: it adds to the same build. Each tag is allowed only on the types listed.
  const TAGS = {
    dummy: ['drawer'],       // fixed drawer front: no drawer box
    hob: ['cabinet', 'drawer'], // cross rails on edge + separation panel under the hob
    sink: ['cabinet', 'drawer'], // cross rails on edge, no shelves, sink cut-out
    bins: ['drawer'],        // waste-sorting bins in the drawer
    innerDrawer: ['drawer'],       // inner cutlery drawer above the drawer box, behind the same front
    island: ['worktop'],     // island worktop: of the islandWorktop material, the island back panel, no wall
    coffee: ['cabinet'],     // pull-out shelf at the bottom, shelves above it, no other shelves
    doorDrawers: ['cabinet'],   // drawers of board on ball runners behind the door, a spacer on the hinge side, no shelves
    fridge: ['cabinet'],     // front on a built-in fridge door: no hinges, no adjustable shelves, no back
    freezer: ['cabinet'],    // the same, freezer door
    dishwasher: ['cabinet']  // front on a built-in dishwasher door: no carcass, no hinges
  };
  const TAG_NAMES = Object.keys(TAGS);
  // at most one tag of each set per component
  const EXCLUSIVE_TAGS = [['fridge', 'freezer', 'dishwasher'], ['dummy', 'bins'], ['dummy', 'innerDrawer'], ['coffee', 'doorDrawers']];

  const FRONT_TYPES = ['cabinet', 'drawer'];              // have a front: 4 gaps, a handle
  const BOX_TYPES = [...FRONT_TYPES, 'oven', 'microwave'];    // stand in a carcass (need a carcass name, except a dishwasher)
  const BOARD_TYPES = ['worktop', 'endPanel', 'wallPanel', 'plinth', 'frontPanel', 'strip', ...FRONT_TYPES]; // each in the uses of exactly one material

  // parts the engine adds inside a carcass; with the board types they are the uses a material lists
  const PARTS = ['carcass', 'backPanel', 'drawerBox', 'hobPanel'];
  // the worktop and the end panels of an island have their own materials (their depth)
  const ISLAND_USE = 'islandWorktop', ISLAND_END_PANEL_USE = 'islandEndPanel';
  const DEPTH_USES = ['worktop', ISLAND_USE, 'endPanel', ISLAND_END_PANEL_USE]; // worktop: the depth; end panel: the largest depth it can have
  const USES = [...BOARD_TYPES, ISLAND_USE, ISLAND_END_PANEL_USE, ...PARTS];

  // carcass flags: a carcass has the flag when one of its boxes has one of the tags
  const CARCASS_FLAGS = { sink: ['sink'], hob: ['hob'], fridge: ['fridge', 'freezer'], coffee: ['coffee'], doorDrawers: ['doorDrawers'] };

  // a carcass on a plinth gets a ventilation grille in the plinth when it holds one of these (air intake for the appliance)
  const GRILLE_FOR = { types: ['oven'], tags: ['fridge', 'freezer'] };
  const VENTED_SHELF_OVER = ['oven']; // a fixed shelf over these types is shallower: settings.shelf.ventGap of air behind it
  const SHELF_UNDER_JOINT = ['oven'];  // a fixed shelf under these types sits below the joint, not centred: the front under it can cover it fully

  // visible names (Polish) of the identifiers above; the code keeps the English identifiers
  const LABELS = {
    type: { space: 'wypełnienie', plasterboard: 'zabudowa GK', plinth: 'cokół', worktop: 'blat', endPanel: 'panel końcowy', wallPanel: 'panel ścienny', frontPanel: 'panel',
      strip: 'listwa', cabinet: 'szafka', drawer: 'szuflada', oven: 'piekarnik', microwave: 'mikrofalówka' },
    tag: { dummy: 'atrapa', hob: 'płyta grzewcza', sink: 'zlew', bins: 'kosze', innerDrawer: 'szuflada wewnętrzna', island: 'wyspa',
      coffee: 'ekspres', doorDrawers: 'szuflady za drzwiami', fridge: 'lodówka', freezer: 'zamrażarka', dishwasher: 'zmywarka' },
    carcassKind: { base: 'dolna', tall: 'słupek', wall: 'górna' },
    opening: { door: 'drzwi', drawer: 'szuflada', fixed: 'atrapa', fridge: 'drzwi lodówki', dishwasher: 'drzwi zmywarki' },
    edge: { front: 'przód', top: 'góra', bottom: 'dół', left: 'lewa', right: 'prawa' },
    // uses that are not a type (the types have their own label)
    use: { islandWorktop: 'blat wyspy', islandEndPanel: 'panel końcowy wyspy', carcass: 'korpus', backPanel: 'plecy', drawerBox: 'szuflady', hobPanel: 'przegroda pod płytą' },
    hole: { cup: 'puszka zawiasu', plate: 'prowadnik zawiasu', shelfPin: 'podpórka półki', runner: 'prowadnica szuflady / półki wysuwanej', sink: 'wycięcie na zlew', hob: 'wycięcie na płytę grzewczą' },
    // short codes of the holes and cut-outs in the cutting list (its legend explains them): always two letters, the first one the
    // group (Z zawias, P półka / prowadnica, W wycięcie), the second the part
    holeCode: { cup: 'ZA', plate: 'ZP', shelfPin: 'PO', runner: 'PR', sink: 'WZ', hob: 'WP' },
    // hand of a part, as seen from the front of the kitchen: a carcass side or hinge post (left / right), a door (its hinge side: front.hand)
    hand: { left: 'L', right: 'P' },
    holeFrom: { front: 'od przodu', back: 'od tyłu', bottom: 'od dołu', hinge: 'od krawędzi zawiasów', left: 'od lewego końca' }
  };
  LABELS.flag = Object.fromEntries(Object.keys(CARCASS_FLAGS).map(flag => [flag, LABELS.tag[flag]])); // a flag is named as its tag
  const typeLabel = type => LABELS.type[type] || type;
  const tagsLabel = words => words.map(w => LABELS.type[w] || LABELS.tag[w] || w).join(' ');
  const useLabel = use => LABELS.use[use] || typeLabel(use); // a material use: a type or a part

  // how a front opens, from its type and tags (first rule that matches)
  function openingOf(item) {
    if (hasTag(item, 'dummy')) return 'fixed';
    if (item.type === 'drawer') return 'drawer';
    if (hasTag(item, 'dishwasher')) return 'dishwasher';
    if (hasTag(item, 'fridge', 'freezer')) return 'fridge';
    return 'door';
  }
  const HINGED = ['door', 'fridge']; // openings with a hinge side; only 'door' gets hinges counted
  const opens = item => FRONT_TYPES.includes(item.type) && openingOf(item) !== 'fixed'; // a front that opens

  const SIDES = ['top', 'bottom', 'left', 'right']; // the four edges of a front or a panel: handle positions, gaps, panel edges
  const HINGE_SIDES = ['left', 'right'];
  LABELS.side = Object.fromEntries(SIDES.map(side => [side, LABELS.edge[side]]));

  // Lacquered edges of the finished parts (they get no ABS): fixed here, not in design.js, because they follow from how
  // the kitchen is seen. A strip on edge shows only its long edge facing the room.
  const STRIP_LACQUERED_SIDES = ['front'];
  const LACQUER = {
    front: { long: 2, short: 2 },
    strip: { long: STRIP_LACQUERED_SIDES.length, short: 0 },
    plinth: { long: 0, short: 0 }
  };

  // settings the engine and the pages read: a missing one stops the build (checkSettings)
  const REQUIRED_SETTINGS = [
    'carcass.depth', 'carcass.wallGap', 'carcass.frontGap', 'carcass.legs',
    'backPanel.inset',
    'crossRails.depth', 'crossRails.hobFront', 'crossRails.hobPanelGap',
    'shelf.setback', 'shelf.clearance', 'shelf.perDoor', 'shelf.ventGap',
    'pullOutShelf.depth', 'pullOutShelf.clearance', 'pullOutShelf.lift', 'pullOutShelf.spacerAbove', 'pullOutShelf.machineHeight', 'pullOutShelf.shelvesAbove',
    'doorDrawers.count', 'doorDrawers.sideHeight', 'doorDrawers.lift', 'doorDrawers.clearance', 'doorDrawers.runnerLengths',
    'hinges.fromEnd', 'hinges.postDepth', 'hinges.aboveShelf', 'hinges.perDoor',
    'drawers.D.frontAbove', 'drawers.D.sideHeight', 'drawers.D.backHeight', 'drawers.M.sideHeight', 'drawers.M.backHeight',
    'drawers.bottom.inset', 'drawers.bottom.depth', 'drawers.bottom.fromBack', 'drawers.back.inset',
    'drawers.liftAtBottom', 'drawers.liftAbove', 'drawers.inner.gap', 'drawers.inner.backHeight', 'drawers.inner.frontDeduction',
    'front.shakerRail',
    'strip.depth',
    'plinth.setback',
    'worktop.overhang', 'worktop.endPanelOverhang',
    'plasterboard.depth', 'plasterboard.studSpacing', 'plasterboard.layers',
    'drilling.cup.diameter', 'drilling.cup.depth', 'drilling.cup.fromEdge',
    'drilling.plate.diameter', 'drilling.plate.depth', 'drilling.plate.fromFront', 'drilling.plate.spacing',
    'drilling.shelfPin.diameter', 'drilling.shelfPin.depth', 'drilling.shelfPin.fromFront', 'drilling.shelfPin.fromBack',
    'drilling.shelfPin.belowShelf', 'drilling.shelfPin.extra', 'drilling.shelfPin.pitch',
    'drilling.runner.diameter', 'drilling.runner.depth', 'drilling.runner.fromFront', 'drilling.runner.belowDrawer',
    'drilling.ballRunner.fromFront', 'drilling.ballRunner.aboveBottom'
  ];

  // cut-outs in a worktop: the carcass flag that asks for one -> settings.cutouts[flag] {width, depth, fromBack}, centred on the carcass
  const CUTOUT_FLAGS = ['sink', 'hob'];

  // a shelf rests on a pin in each side at the front and at the back (rules.md, section 5)
  const PINS_PER_SHELF = 4;

  // boards lying flat in a carcass: no hole may hit them
  const HORIZONTAL_BOARDS = ['bottomBoard', 'topBoard', 'crossRail', 'fixedShelf', 'hobPanel'];

  /* ================= 2. SMALL HELPERS ================= */

  // for the pages: the Polish plural form of a count (1 problem, 2 problemy, 5 problemów)
  const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? few : many);

  const valueAt = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));
  const reachesHingeSide = (item, carcass) => (item.hinge === 'left' ? item.u0 === carcass.u0 : item.u1 === carcass.u1); // the door reaches the carcass side its hinges are on

  // how a component's place is printed (warnings, lists, tooltips): "G1[4]" = group 1, column 4; "G1[1-11]" = columns 1 to 11
  const placeLabel = (group, column, span = 1) => `G${group}[${column}${span > 1 ? '-' + (column + span - 1) : ''}]`;
  const placeOf = item => placeLabel(item.group, item.column, item.span);

  // how many shelves, hinges ... a front of this height gets
  const countByHeight = (table, height) => {
    const row = table.find(r => r.maxHeight === undefined || height <= r.maxHeight);
    return row ? row.count : null;
  };

  // [v0, v1] of the boards lying flat in a carcass
  const horizontalBands = (boards, carcass) => boards.filter(b => b.carcassId === carcass.id && HORIZONTAL_BOARDS.includes(b.id)).map(b => [b.box[2], b.box[3]]);

  // the clear space of a module in its carcass: the nearest horizontal boards below and above its middle (a fixed shelf need not be
  // centred on a joint, e.g. under an oven); NaN where there is none
  function spaceAround(boards, carcass, v0, v1) {
    const mid = (v0 + v1) / 2, bands = horizontalBands(boards, carcass);
    const below = bands.filter(([a, b]) => (a + b) / 2 <= mid).map(([, b]) => b), above = bands.filter(([a, b]) => (a + b) / 2 > mid).map(([a]) => a);
    return { bottom: below.length ? Math.max(...below) : NaN, top: above.length ? Math.min(...above) : NaN };
  }

  // tags come as a list (design.js) or as typed text (design.html)
  const TAG_BY_LOWER = Object.fromEntries(TAG_NAMES.map(tag => [tag.toLowerCase(), tag])); // typed tags match in any letter case
  function parseTags(tags) {
    const words = (Array.isArray(tags) ? tags : String(tags ?? '').split(/[\s,]+/)).map(w => String(w).trim()).filter(Boolean)
      .map(w => TAG_BY_LOWER[w.toLowerCase()] || w);
    return { words, tags: words.filter(w => TAG_NAMES.includes(w)), unknown: words.filter(w => !TAG_NAMES.includes(w)) };
  }
  const tagsOf = type => TAG_NAMES.filter(tag => TAGS[tag].includes(type));
  const TYPE_BY_LOWER = Object.fromEntries(TYPES.map(type => [type.toLowerCase(), type])); // typed types match in any letter case
  const readType = value => TYPE_BY_LOWER[String(value ?? '').trim().toLowerCase()] || '';

  // a worktop, an end panel or a strip is as thick as its material: which size to compare
  function onEdgeSize(item, island) {
    const width = item.u1 - item.u0, height = item.v1 - item.v0;
    if (item.type === 'worktop') return { use: island ? ISLAND_USE : 'worktop', size: height, what: 'wysokość' };
    if (item.type === 'endPanel') return { use: island ? ISLAND_END_PANEL_USE : 'endPanel', size: width, what: 'szerokość' };
    if (item.type === 'strip') return { use: 'strip', size: Math.min(width, height), what: height > width ? 'szerokość' : 'wysokość' };
    return null;
  }

  function frontBox(item) {
    const { left, right, top, bottom } = item.gaps;
    return { u0: item.u0 + left, u1: item.u1 - right, v0: item.v0 + bottom, v1: item.v1 - top };
  }

  /* ================= 3. CHECKS THAT STOP THE BUILD: materials and settings ================= */

  function materialUses(materials) {
    const materialFor = {}, problems = [];
    for (const [code, m] of Object.entries(materials || {})) {
      if (!(m.thickness > 0)) problems.push(`Materiał ${code}: grubość musi być > 0.`);
      if (!/^#[0-9a-f]{6}$/i.test(m.color || '')) problems.push(`Materiał ${code}: kolor musi być "#rrggbb".`);
      if ((m.uses || []).some(use => DEPTH_USES.includes(use)) && !(m.depth > 0)) problems.push(`Materiał ${code}: ${m.uses.filter(use => DEPTH_USES.includes(use)).map(useLabel).join(', ')} potrzebuje głębokości > 0.`);
      // factoryEdges: edges the material comes finished with (no ABS to order)
      for (const side of m.factoryEdges || []) if (!(side in LABELS.edge)) problems.push(`Materiał ${code}: krawędź fabryczna "${side}" musi być jedną z: ${Object.keys(LABELS.edge).join(', ')}.`);
      for (const use of m.uses || []) {
        if (!USES.includes(use)) problems.push(`Materiał ${code}: "${use}" nie jest typem płyty ani częścią korpusu (${USES.join(', ')}).`);
        else if (materialFor[use]) problems.push(`${use} jest w dwóch materiałach: ${materialFor[use]} i ${code}.`);
        else materialFor[use] = code;
      }
    }
    for (const use of USES) if (!materialFor[use]) problems.push(`Żaden materiał nie ma użycia ${use}.`);
    const frontThicknesses = new Set(FRONT_TYPES.filter(t => materialFor[t]).map(t => (materials || {})[materialFor[t]].thickness));
    if (frontThicknesses.size > 1) problems.push(`Materiały frontów (${FRONT_TYPES.join(', ')}) muszą mieć jedną grubość: płaszczyzna frontów.`);
    return { materialFor, problems };
  }

  // problems in design.js materials and settings that make a build impossible; design.html lists them, build() throws them
  function checkSettings(project) {
    return [...materialUses(project && project.materials).problems, ...settingProblems((project && project.settings) || {})];
  }
  function settingProblems(settings) {
    const problems = [];
    for (const path of REQUIRED_SETTINGS) if (valueAt(settings, path) === undefined) problems.push(`Brak ustawienia ${path}.`);
    for (const path of ['shelf.perDoor', 'hinges.perDoor']) {
      const table = valueAt(settings, path);
      const isRow = (row, last) => row && Number.isInteger(row.count) && (last ? row.maxHeight === undefined : row.maxHeight > 0);
      if (table !== undefined && !(Array.isArray(table) && table.length && table.every((row, i) => isRow(row, i === table.length - 1)))) {
        problems.push(`Ustawienie ${path} musi być listą [{maxHeight, count}, ..., {count}] (ostatni wiersz bez maxHeight).`);
      }
    }
    const hingeTable = valueAt(settings, 'hinges.perDoor');
    if (Array.isArray(hingeTable) && hingeTable.some(row => !(row && row.count >= 2))) problems.push('Ustawienie hinges.perDoor: każde drzwi potrzebują co najmniej 2 zawiasów.');
    const wallGap = valueAt(settings, 'carcass.wallGap');
    if (wallGap !== undefined && !(wallGap && typeof wallGap === 'object' && !Array.isArray(wallGap) && Object.values(wallGap).every(gap => gap >= 0))) {
      problems.push('Ustawienie carcass.wallGap musi być obiektem {grupa: odstęp od ściany ≥ 0}.');
    }
    const doorDrawerCount = valueAt(settings, 'doorDrawers.count');
    if (doorDrawerCount !== undefined && !(Number.isInteger(doorDrawerCount) && doorDrawerCount >= 1)) problems.push('Ustawienie doorDrawers.count musi być liczbą całkowitą ≥ 1.');
    return problems;
  }

  /* ================= 4. LAYOUT: components -> items stacked in their columns ================= */

  const readGap = x => (x === '' || x == null ? NaN : Number(x)); // an empty gap is not 0
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

  // Each piece, in list order, starts on top of the stack of the columns it spans: in each column the stack is the run of
  // pieces that reaches up without a gap from the floor (a piece can fill a gap left under a wider piece); the highest of
  // those tops wins. Returns the pieces with u0, u1, v0, v1, and the ones that do not fit.
  function stack(widths, pieces) {
    const columnX = [0];
    widths.forEach(w => columnX.push(columnX[columnX.length - 1] + w));
    const occupied = widths.map(() => []); // [v0, v1] ranges per column
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
        skipped.push({ piece, why: 'wychodzi poza kolumny' });
        continue;
      }
      let v0 = 0;
      for (let k = first; k < end; k++) v0 = Math.max(v0, stackTop(occupied[k]));
      const v1 = v0 + piece.height;
      if (occupied.slice(first, end).some(ranges => ranges.some(([a, b]) => Math.max(v0, a) < Math.min(v1, b)))) {
        skipped.push({ piece, why: 'nachodzi na inny element' });
        continue;
      }
      for (let k = first; k < end; k++) occupied[k].push([v0, v1]);
      items.push({ ...piece, u0: columnX[first], u1: columnX[end], v0, v1 });
    }
    return { items, skipped, columnX };
  }

  // the height of a carcass comes from its boxes, not from every member (a panel or a space in it may be lower)
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
        u0: Math.min(...members.map(i => i.u0)),
        u1: Math.max(...members.map(i => i.u1)),
        v0: Math.min(...vertical.map(i => i.v0)),
        v1: Math.max(...vertical.map(i => i.v1)),
        firstColumn: Math.min(...members.map(i => i.column)),
        lastColumn: Math.max(...members.map(i => i.column + i.span - 1))
      };
    });
  }

  /* ================= 5. BUILD ================= */

  // appliances (appliances.js, optional): the manufacturer's sizes, under the name of the type or tag they fit, fridgeFreezer for the tags fridge and freezer (fitAppliances)
  function build(project, appliances) {
    const projectData = project || {}, settings = projectData.settings || {};
    const stops = checkSettings(projectData);
    if (stops.length) throw new Error('Ustawienia w design.js: ' + stops.join(' '));

    // every thickness comes from the material of the type or part
    const { materialFor } = materialUses(projectData.materials);
    const thickness = Object.fromEntries(Object.entries(materialFor).map(([use, code]) => [use, projectData.materials[code].thickness]));
    // label, e.g. "Płyta wiórowa Egger U708 ST9 szary jasny 18"
    const materials = Object.fromEntries(Object.entries(projectData.materials).map(([code, m]) => [code, { ...m, label: m.name + ' ' + m.thickness }]));
    const board = thickness.carcass, half = board / 2, frontThickness = thickness.cabinet, carcassDepth = settings.carcass.depth;
    // depths (n) from the carcass backs; a front stands carcass.frontGap in front of its carcass
    const carcassBack = 0;
    const carcassFront = carcassBack + carcassDepth;
    const frontFace = carcassFront + settings.carcass.frontGap + frontThickness;
    const plinthFace = frontFace - settings.plinth.setback;
    // a front panel of a carcass is screwed onto it (no gap, unlike a front); one outside a carcass stands in the front plane,
    // screwed to its neighbour
    const panelFace = carcassFront + thickness.frontPanel;
    // [u0, u1] of a spacer of carcass board inside the carcass side on the hinge side (it carries runners past the hinges)
    const spacerOnHingeSide = (carcass, hinge) => (hinge === 'right' ? [carcass.u1 - 2 * board, carcass.u1 - board] : [carcass.u0 + board, carcass.u0 + 2 * board]);

    const issues = []; // { index of the component, text, skipped }
    const warn = (text, index = null, skipped = false) => { issues.push({ index, text, skipped }); };
    const groups = {}, carcasses = [], fronts = [], boards = [];
    const strips = [], plinths = [], frontPanels = [], wallPanels = [], plaster = [], worktops = {};
    // engine counts, used by cost.html as {n:name}; wallBrackets: brackets of the back strips at a wall; jointLength: mm of carcass side
    // screwed to a strip and its back strip, from the first carcass (screwed) or from inside the second one (fromInside)
    const counts = {
      carcasses: 0, wallBrackets: 0, jointLength: { screwed: 0, fromInside: 0 }, fronts: 0, handles: 0, hinges: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, doorDrawers: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0,
      plasterUD: 0, plasterCD: 0, plasterEdge: 0, type: {}, tag: {}
    };

    // ---- components: checks on one component; what cannot be placed is skipped ----
    const columns = projectData.columns || {}, pieces = [];
    (projectData.components || []).forEach((c, index) => {
      const piece = readComponent(c, index), at = placeOf(piece);
      if (!(String(c.group) in columns)) return warn(`${at}: grupa ${c.group} nie ma kolumn - pominięty.`, index, true);
      if (!Number.isInteger(piece.height)) return warn(`${at}: wysokość "${c.height}" musi być całkowitą liczbą mm - pominięty.`, index, true);
      if (!piece.type) {
        return warn(`${at}: ${String(c.type ?? '').trim() ? 'nieznany typ "' + c.type + '"' : 'brak typu'}; typ musi być jednym z: ${TYPES.map(typeLabel).join(', ')} - pominięty.`, index, true);
      }
      for (const set of EXCLUSIVE_TAGS) if (set.filter(tag => piece.tags.includes(tag)).length > 1) warn(`${at}: tagi ${tagsLabel(set)} wykluczają się.`, index);
      for (const tag of piece.tags) if (!TAGS[tag].includes(piece.type)) warn(`${at}: tag ${tagsLabel([tag])} jest tylko dla: ${TAGS[tag].map(typeLabel).join(', ')}.`, index);
      if (piece.unknownTags.length) warn(`${at}: nieznany tag ${piece.unknownTags.join(', ')} (dla typu ${typeLabel(piece.type)}: ${tagsOf(piece.type).map(t => LABELS.tag[t]).join(', ') || 'brak tagów'}).`, index);
      const isFront = FRONT_TYPES.includes(piece.type);
      if (piece.handle && !isFront) warn(`${at}: ${typeLabel(piece.type)} nie może mieć uchwytu.`, index);
      else if (piece.handle && !SIDES.includes(piece.handle)) warn(`${at}: uchwyt "${piece.handle}" musi być jednym z: ${SIDES.join(', ')}.`, index);
      if (hasTag(piece, 'dishwasher') && piece.carcass) warn(`${at}: zmywarka nie ma korpusu - usuń nazwę korpusu ${piece.carcass}.`, index);
      if (isFront) {
        if (!piece.gaps || !Object.values(piece.gaps).every(Number.isFinite)) {
          warn(`${at}: ${typeLabel(piece.type)} potrzebuje 4 szczelin (lewa, prawa, góra, dół) - narysowano bez szczelin.`, index);
          piece.gaps = { left: 0, right: 0, top: 0, bottom: 0 };
        } else if (!Object.values(piece.gaps).every(Number.isInteger)) {
          warn(`${at}: szczeliny ${gapsText(piece.gaps)} muszą być całkowitymi mm.`, index);
        }
        const hinged = HINGED.includes(openingOf(piece));
        if (hinged && !HINGE_SIDES.includes(piece.hinge)) warn(`${at}: drzwi potrzebują strony zawiasów ${HINGE_SIDES.join(' lub ')}.`, index);
        else if (hinged && piece.hinge === piece.handle) warn(`${at}: zawiasy i uchwyt po tej samej stronie.`, index);
        if (!hinged && piece.hinge) warn(`${at}: tylko drzwi mają stronę zawiasów.`, index);
      }
      pieces.push(piece);
    });

    // ---- groups: stack the components in their columns ----
    for (const [g, widths] of Object.entries(columns)) {
      widths.forEach((w, i) => { if (!Number.isInteger(w)) warn(`${placeLabel(g, i + 1)}: szerokość kolumny "${w}" musi być całkowitą liczbą mm.`); });
      const stacked = stack(widths, pieces.filter(p => String(p.group) === g));
      for (const { piece, why } of stacked.skipped) warn(`${placeOf(piece)}: ${typeLabel(piece.type)} ${why} - pominięty.`, piece.index, true);
      const island = stacked.items.some(item => item.type === 'worktop' && hasTag(item, 'island')); // a free-standing island: its worktop has the tag island
      // an island has no wall: its line is the carcass backs
      let wallGap = island ? 0 : settings.carcass.wallGap[g];
      if (!(wallGap >= 0)) {
        warn(`Grupa ${g}: brak ustawienia carcass.wallGap.${g} (odstęp od ściany) - przyjęto 0.`);
        wallGap = 0;
      }
      groups[g] = {
        group: +g,
        widths,
        columnX: stacked.columnX,
        length: stacked.columnX[stacked.columnX.length - 1],
        items: stacked.items,
        island,
        wallGap,
        wall: carcassBack - wallGap, // n of the wall line
        areas: carcassAreas(stacked.items)
      };
      for (const item of stacked.items) {
        counts.type[item.type] = (counts.type[item.type] || 0) + 1;
        for (const tag of item.tags) counts.tag[tag] = (counts.tag[tag] || 0) + 1;
        const onEdge = onEdgeSize(item, groups[g].island);
        if (!onEdge) continue;
        const { use, size, what } = onEdge;
        if (size !== thickness[use]) warn(`${placeOf(item)}: ${typeLabel(item.type)} - ${what} ${size} nie zgadza się z materiałem ${materials[materialFor[use]].label}.`, item.index);
      }
    }

    // ---- carcasses: one per carcass name ----
    const groupOfName = new Map();
    for (const groupModel of Object.values(groups)) {
      for (const area of groupModel.areas) {
        if (groupOfName.has(area.name)) {
          warn(`Korpus ${area.name} jest w grupie ${groupOfName.get(area.name)} i w grupie ${groupModel.group} - korpus musi być w jednej grupie.`, area.members[0].index);
          continue;
        }
        groupOfName.set(area.name, groupModel.group);
        const boxes = area.members.filter(i => BOX_TYPES.includes(i.type)).sort((a, b) => a.v0 - b.v0 || a.u0 - b.u0);
        carcasses.push({
          name: area.name, group: groupModel.group, column: area.firstColumn, span: area.lastColumn - area.firstColumn + 1,
          u0: area.u0, u1: area.u1, v0: area.v0, v1: area.v1, boxes, members: area.members
        });
      }
      for (const item of groupModel.items) {
        if (BOX_TYPES.includes(item.type) && !item.carcass && !hasTag(item, 'dishwasher')) warn(`${placeOf(item)}: ${typeLabel(item.type)} nie ma nazwy korpusu.`, item.index);
      }
    }
    carcasses.forEach((carcass, i) => {
      carcass.id = i + 1;
      // floor = stands on a plinth; base = floor with a worktop on top; tall = floor without a worktop; wall = not on a plinth
      const overlapsColumns = item => item.column <= carcass.column + carcass.span - 1 && item.column + item.span - 1 >= carcass.column;
      const groupItems = groups[carcass.group].items;
      carcass.floor = groupItems.some(item => item.type === 'plinth' && overlapsColumns(item) && item.v1 === carcass.v0);
      carcass.base = carcass.floor && groupItems.some(item => item.type === 'worktop' && overlapsColumns(item) && item.v0 === carcass.v1);
      carcass.kind = carcass.base ? 'base' : carcass.floor ? 'tall' : 'wall';
      for (const [flag, tags] of Object.entries(CARCASS_FLAGS)) carcass[flag] = carcass.boxes.some(b => hasTag(b, ...tags));
      carcass.flags = Object.keys(CARCASS_FLAGS).filter(flag => carcass[flag]);
      if (carcass.sink && carcass.hob) warn(`${carcass.name}: zlew i płyta grzewcza w jednym korpusie wykluczają się.`, carcass.members[0].index);
      carcass.legs = carcass.floor ? settings.carcass.legs : 0;
      carcass.grille = carcass.floor && carcass.boxes.some(b => GRILLE_FOR.types.includes(b.type) || hasTag(b, ...GRILLE_FOR.tags));
      for (const item of carcass.members) item.carcassId = carcass.id;
      counts.legs += carcass.legs;
      counts.sinks += carcass.sink;
      counts.hobs += carcass.hob;
      counts.fridges += carcass.fridge;
      counts.grilles += carcass.grille;
    });
    counts.carcasses = carcasses.length;
    const carcassOf = item => carcasses.find(carcass => carcass.id === item.carcassId); // undefined: not in a carcass

    // ---- carcass boards ----
    // id: kind of board, the same for all sizes (colours and counts on the pages); a, b: size; box: place;
    // edges: ABS edges [{side, length, along}] - the edge seen from the front, along = the size it runs along (a | b); hidden parts get none
    const crossRails = settings.crossRails, shelf = settings.shelf, backPanel = settings.backPanel;
    for (const carcass of carcasses) {
      const { u0, u1, v0, v1 } = carcass;
      const width = u1 - u0, height = v1 - v0;
      const innerU0 = u0 + board, innerU1 = u1 - board, innerWidth = width - 2 * board;
      const carcassMaterial = materialFor.carcass;
      const part = (id, name, a, b, material, layer, box, edges = []) => {
        const piece = { id, name, a, b, material, layer, group: carcass.group, carcassId: carcass.id, box, edges };
        boards.push(piece);
        return piece;
      };
      const frontEdge = (length, along) => [{ side: 'front', length, along }];
      const bottomEdge = [{ side: 'bottom', length: innerWidth, along: 'a' }]; // a rail on edge shows its bottom edge when the drawer below is open

      part('side', 'Bok', carcassDepth, height, carcassMaterial, 'carcasses', [u0, innerU0, v0, v1, carcassBack, carcassFront], frontEdge(height, 'b')).hand = 'left';
      part('side', 'Bok', carcassDepth, height, carcassMaterial, 'carcasses', [innerU1, u1, v0, v1, carcassBack, carcassFront], frontEdge(height, 'b')).hand = 'right';
      part('bottomBoard', 'Wieniec dolny', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v0, v0 + board, carcassBack, carcassFront], frontEdge(innerWidth, 'a'));

      // top: a base carcass has 2 cross rails (flat; on edge under a sink or a hob), any other carcass a top panel
      const crossRailName = 'Trawers ' + crossRails.depth;
      if (carcass.base && carcass.sink) {
        // the cross rails stand on edge to clear the bowl
        part('crossRail', crossRailName + ' przedni, na sztorc', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - crossRails.depth, v1, carcassFront - board, carcassFront], bottomEdge);
        part('crossRail', crossRailName + ' tylny, na sztorc', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - crossRails.depth, v1, carcassBack, carcassBack + board]);
      } else if (carcass.base && carcass.hob) {
        // front rail on edge (hobFront high), rear rail on edge; the separation panel behind the front rail, flush with its bottom edge
        // (hidden from the front), with an air gap at the back
        part('crossRail', 'Trawers ' + crossRails.hobFront + ' przedni, na sztorc', innerWidth, crossRails.hobFront, carcassMaterial, 'carcasses',
          [innerU0, innerU1, v1 - crossRails.hobFront, v1, carcassFront - board, carcassFront], bottomEdge);
        part('crossRail', crossRailName + ' tylny, na sztorc', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - crossRails.depth, v1, carcassBack, carcassBack + board]);
        part('hobPanel', 'Przegroda pod płytą', innerWidth, carcassDepth - 2 * board - crossRails.hobPanelGap, materialFor.hobPanel, 'carcasses',
          [innerU0, innerU1, v1 - crossRails.hobFront, v1 - crossRails.hobFront + thickness.hobPanel, carcassBack + board + crossRails.hobPanelGap, carcassFront - board]);
      } else if (carcass.base) {
        part('crossRail', crossRailName + ' przedni', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassFront - crossRails.depth, carcassFront], frontEdge(innerWidth, 'a'));
        part('crossRail', crossRailName + ' tylny', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassBack + crossRails.depth]);
      } else {
        part('topBoard', 'Wieniec górny', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassFront], frontEdge(innerWidth, 'a'));
      }

      // back only behind cabinet doors (not behind drawers, dummy fronts, ovens, microwaves, fridges, freezers); one piece per run of doors
      const doorSpans = carcass.boxes
        .filter(b => b.type === 'cabinet' && !hasTag(b, 'fridge', 'freezer'))
        .map(b => [Math.max(v0, b.v0), Math.min(v1, b.v1)])
        .sort((a, b) => a[0] - b[0])
        .reduce((runs, span) => {
          const last = runs[runs.length - 1];
          if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
          else runs.push([...span]);
          return runs;
        }, []);
      for (const [s0, s1] of doorSpans) {
        part('backPanel', 'Plecy', width - 2 * backPanel.inset, s1 - s0 - 2 * backPanel.inset, materialFor.backPanel, 'backs',
          [u0 + backPanel.inset, u1 - backPanel.inset, s0 + backPanel.inset, s1 - backPanel.inset, carcassBack - thickness.backPanel, carcassBack]);
      }

      // fixed shelf at each joint of 2 boxes; a base carcass has its rails, a fridge carcass its own shelf (below)
      if (!carcass.base && !carcass.fridge) {
        const joints = [...new Set(carcass.boxes.map(b => b.v0))].filter(joint => joint > v0);
        for (const joint of joints) {
          const vented = carcass.boxes.some(b => b.v1 === joint && VENTED_SHELF_OVER.includes(b.type)), gap = vented ? settings.shelf.ventGap : 0;
          const top = carcass.boxes.some(b => b.v0 === joint && SHELF_UNDER_JOINT.includes(b.type)) ? joint : joint + half;
          part('fixedShelf', 'Półka stała', innerWidth, carcassDepth - gap, carcassMaterial, 'shelves', [innerU0, innerU1, top - board, top, carcassBack + gap, carcassFront], frontEdge(innerWidth, 'a'));
          counts.shelvesFixed++;
        }
      }
      // a fridge carcass: its joints are inside the appliance; one fixed shelf right on the appliance top, which is screwed to it;
      // shallower to let the air out
      const fridgeHeight = carcass.fridge && appliances && appliances.fridgeFreezer ? appliances.fridgeFreezer.body.height : null;
      if (fridgeHeight) {
        const top = v0 + board + fridgeHeight + board, gap = settings.shelf.ventGap;
        if (top > v1 - board) warn(`${carcass.name}: lodówka ${fridgeHeight} nie mieści się w korpusie (wnętrze ${height - 2 * board}).`);
        else {
          part('fixedShelf', 'Półka stała', innerWidth, carcassDepth - gap, carcassMaterial, 'shelves', [innerU0, innerU1, top - board, top, carcassBack + gap, carcassFront], frontEdge(innerWidth, 'a'));
          counts.shelvesFixed++;
        }
      }

      // a space at one end of a carcass (e.g. the hidden end of an L corner): the carcass runs on behind it, an inset panel
      // closes its front; hidden: no ABS
      const topThickness = carcass.base && carcass.sink ? crossRails.depth : carcass.base && carcass.hob ? crossRails.hobFront : board;
      for (const f of carcass.members.filter(i => i.type === 'space')) {
        const atRight = f.u1 === carcass.u1, atLeft = f.u0 === carcass.u0;
        if (atRight === atLeft) {
          warn(`${placeOf(f)}: wypełnienie w korpusie musi być na jego końcu.`, f.index);
          continue;
        }
        const s0 = atRight ? Math.max(...carcass.boxes.map(b => b.u1)) : innerU0, s1 = atRight ? innerU1 : Math.min(...carcass.boxes.map(b => b.u0));
        part('insetPanel', 'Panel wpuszczany', s1 - s0, height - board - topThickness, carcassMaterial, 'carcasses',
          [s0, s1, v0 + board, v1 - topThickness, carcassFront - board, carcassFront]);
      }

      // an adjustable shelf: one plain board from side to side over the whole carcass (a hinge post, when there is one, crosses it)
      const adjustableShelf = centre => {
        const shelfWidth = innerWidth - 2 * shelf.clearance, shelfU0 = innerU0 + shelf.clearance;
        part('adjustableShelf', 'Półka ruchoma', shelfWidth, carcassDepth - shelf.setback, carcassMaterial, 'shelves',
          [shelfU0, shelfU0 + shelfWidth, centre - half, centre + half, carcassBack, carcassFront - shelf.setback], frontEdge(shelfWidth, 'a')).centre = centre;
        counts.shelvesAdjustable++;
        counts.shelfPins += PINS_PER_SHELF;
      };
      // a door with coffee: a pull-out shelf on the board under the door, shelves above it up to the board over the door. The open
      // door reaches about as far into the opening as the runner clearance: a spacer on the hinge side carries that runner
      const addPullOutShelf = (door, lo, hi) => {
        const pullOut = settings.pullOutShelf, y = lo + pullOut.lift;
        let s0 = innerU0, s1 = innerU1;
        if (!reachesHingeSide(door, carcass)) warn(`${placeOf(door)}: ekspres - drzwi muszą sięgać boku korpusu po stronie zawiasów.`, door.index);
        else {
          const spacer = spacerOnHingeSide(carcass, door.hinge), top = y + board + pullOut.spacerAbove;
          part('spacer', 'Płyta dystansowa', carcassDepth, top - lo, carcassMaterial, 'carcasses',
            [...spacer, lo, top, carcassBack, carcassFront], [{ side: 'front', length: top - lo, along: 'b' }, { side: 'top', length: carcassDepth, along: 'a' }]); // the top is seen above the shelf
          if (door.hinge === 'right') s1 = spacer[0]; else s0 = spacer[1];
        }
        const shelfWidth = s1 - s0 - 2 * pullOut.clearance;
        part('pullOutShelf', 'Półka wysuwana', shelfWidth, pullOut.depth, carcassMaterial, 'shelves',
          [s0 + pullOut.clearance, s1 - pullOut.clearance, y, y + board, carcassFront - pullOut.depth, carcassFront], frontEdge(shelfWidth, 'a')).item = door;
        counts.pullOutShelves++;
        const above = y + board + pullOut.machineHeight;
        for (let j = 0; j < pullOut.shelvesAbove; j++) adjustableShelf(Math.round(above + ((hi - above) * j) / pullOut.shelvesAbove));
      };
      if (!carcass.sink && !carcass.fridge) {
        // per door, by its front height (settings.shelf.perDoor), evenly between the boards above and below the door
        for (const b of carcass.boxes) {
          if (b.type !== 'cabinet' || hasTag(b, 'doorDrawers')) continue; // behind a door with doorDrawers: the drawers, no shelves
          const { bottom: lo, top: hi } = spaceAround(boards, carcass, b.v0, b.v1);
          if (hasTag(b, 'coffee')) { addPullOutShelf(b, lo, hi); continue; }
          const front = frontBox(b), frontHeight = front.v1 - front.v0, count = countByHeight(shelf.perDoor, frontHeight);
          if (count === null) { warn(`${placeOf(b)}: wysokość frontu ${frontHeight} przekracza ostatni wiersz settings.shelf.perDoor.`, b.index); continue; }
          for (let j = 1; j <= count; j++) adjustableShelf(Math.round(lo + ((hi - lo) * j) / (count + 1)));
        }
      }
    }

    // ---- strips (with a back strip outside a carcass), front panels, wall panels, plinths, plasterboard ----
    const stripSettings = settings.strip, plasterSettings = settings.plasterboard;
    for (const groupModel of Object.values(groups)) {
      for (const item of groupModel.items) {
        const { u0, u1, v0, v1 } = item, width = u1 - u0, height = v1 - v0;
        if (item.type === 'strip') {
          strips.push({
            group: groupModel.group, item, material: materialFor.strip, box: [u0, u1, v0, v1, frontFace - stripSettings.depth, frontFace],
            name: (height > width ? 'Listwa ' : 'Listwa pozioma ') + thickness.strip + ' na sztorc (gł. ' + stripSettings.depth + ')',
            a: stripSettings.depth, b: Math.max(width, height),
            lacquer: LACQUER.strip, lacqueredSides: STRIP_LACQUERED_SIDES
          });
          if (!item.carcass) {
            // back strips: as high as the carcasses beside the strip, one per carcass one above the other; a wall bracket at each
            // joint of the stack (the back strip is shortened on site to make room for it; the island stands free: no bracket)
            const along = height > width;
            const beside = along ? carcasses.filter(carcass => carcass.group === groupModel.group && (carcass.u0 === u1 || carcass.u1 === u0) && carcass.v0 < v1 && carcass.v1 > v0) : [];
            let spans = [[v0, v1]];
            if (beside.length) {
              const joints = [...new Set(beside.filter(carcass => beside.some(upper => upper.v0 === carcass.v1 && upper.u0 === carcass.u0)).map(carcass => carcass.v1))].sort((a, b) => a - b);
              const ends = [Math.max(v0, Math.min(...beside.map(carcass => carcass.v0))), ...joints, Math.min(v1, Math.max(...beside.map(carcass => carcass.v1)))];
              spans = ends.slice(0, -1).map((a, i) => [a, ends[i + 1]]);
              if (!groupModel.island) counts.wallBrackets += spans.length - 1; // the top strip of a stack has no bracket
              // the strip and its back strips are screwed to the carcass on one side; the carcass on the other side from inside
              const length = Ks => Ks.reduce((sum, carcass) => sum + Math.min(carcass.v1, v1) - Math.max(carcass.v0, v0), 0);
              const left = beside.filter(carcass => carcass.u1 === u0), right = beside.filter(carcass => carcass.u0 === u1);
              counts.jointLength.screwed += length(left.length ? left : right);
              if (left.length) counts.jointLength.fromInside += length(right);
            }
            for (const [s0, s1] of spans) {
              boards.push({
                id: 'backStrip', name: 'Listwa tylna ' + stripSettings.depth, a: stripSettings.depth, b: along ? s1 - s0 : width, material: materialFor.carcass, layer: 'carcasses',
                group: groupModel.group, column: item.column, box: along ? [u0, u1, s0, s1, carcassBack, carcassBack + stripSettings.depth] : [u0, u1, v0, v1, carcassBack, carcassBack + stripSettings.depth],
                edges: [] // hidden behind its strip
              });
            }
          }
        } else if (item.type === 'frontPanel') {
          // an edge shows when the front next to it opens: ABS on each edge whose neighbour (touching, overlapping) is a front that opens
          const overlaps = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0;
          const neighbour = {
            top: o => o.v0 === item.v1 && overlaps(o.u0, o.u1, item.u0, item.u1), bottom: o => o.v1 === item.v0 && overlaps(o.u0, o.u1, item.u0, item.u1),
            left: o => o.u1 === item.u0 && overlaps(o.v0, o.v1, item.v0, item.v1), right: o => o.u0 === item.u1 && overlaps(o.v0, o.v1, item.v0, item.v1)
          };
          const edges = SIDES
            .filter(side => groupModel.items.some(other => opens(other) && neighbour[side](other)))
            .map(side => (side === 'top' || side === 'bottom' ? { side, length: width, along: 'a' } : { side, length: height, along: 'b' }));
          frontPanels.push({ group: groupModel.group, item, material: materialFor.frontPanel, name: 'Panel ' + thickness.frontPanel, a: width, b: height, box: [u0, u1, v0, v1, ...(item.carcass ? [carcassFront, panelFace] : [frontFace - thickness.frontPanel, frontFace])], edges });
        } else if (item.type === 'wallPanel') {
          wallPanels.push({ group: groupModel.group, item, material: materialFor.wallPanel, name: 'Panel ścienny ' + thickness.wallPanel, a: width, b: height, box: [u0, u1, v0, v1, groupModel.wall, groupModel.wall + thickness.wallPanel], edges: [] });
        } else if (item.type === 'plinth') {
          plinths.push({ group: groupModel.group, item, material: materialFor.plinth, a: height, b: width, box: [u0, u1, v0, v1, plinthFace - thickness.plinth, plinthFace], lacquer: LACQUER.plinth });
        } else if (item.type === 'plasterboard') {
          // cladding: the face plus the return along the long side; profiles: UD on both fixed edges, CD on the outer edge + cross pieces
          const long = Math.max(width, height), short = Math.min(width, height), depth = plasterSettings.depth;
          plaster.push(
            { group: groupModel.group, item, name: 'Płyta GK - czoło', a: short, b: long },
            { group: groupModel.group, item, name: 'Płyta GK - bok', a: depth, b: long }
          );
          counts.plasterUD += 2 * long;
          counts.plasterCD += long + (Math.ceil(long / plasterSettings.studSpacing) + 1) * (depth + short);
          counts.plasterEdge += long; // one outer edge (corner bead) and one joint to the furniture (seal) per box
        }
      }
    }

    // ---- worktops: front edge worktop.overhang before the fronts; at a wall the worktop reaches the wall (the material, as bought,
    // is cut at the back), an island worktop keeps the depth of its material (islandWorktop) ----
    for (const groupModel of Object.values(groups)) {
      const top = groupModel.items.find(i => i.type === 'worktop');
      if (!top) {
        if (groupModel.items.some(i => i.type === 'endPanel')) warn(`Grupa ${groupModel.group}: panele końcowe bez blatu na górze.`);
        continue;
      }
      const use = groupModel.island ? ISLAND_USE : 'worktop', material = materialFor[use], materialDepth = projectData.materials[material].depth;
      const n1 = frontFace + settings.worktop.overhang, n0 = groupModel.island ? n1 - materialDepth : groupModel.wall, depth = n1 - n0;
      if (depth > materialDepth) warn(`Grupa ${groupModel.group}: blat do ściany ma ${depth}, materiał ${materials[material].label} ma ${materialDepth}.`);
      if (n0 > carcassBack) warn(`Grupa ${groupModel.group}: blat ${depth} nie sięga tyłu korpusów (korpus + front + nawis = ${n1 - carcassBack}).`);
      worktops[groupModel.group] = { n0, n1, depth, back: carcassBack - n0, v0: top.v0, v1: top.v1, use, material, thickness: thickness[use] };
    }

    // ---- island back panel: panel material, between the end panels (none: the end columns), floor to the carcass tops, on the carcass backs ----
    for (const groupModel of Object.values(groups).filter(candidate => candidate.island)) {
      const own = carcasses.filter(carcass => carcass.group === groupModel.group);
      const top = Math.max(0, ...own.map(carcass => carcass.v1));
      const first = Math.min(...own.map(carcass => carcass.u0)), last = Math.max(...own.map(carcass => carcass.u1));
      const endPanels = groupModel.items.filter(i => i.type === 'endPanel');
      const left = endPanels.filter(f => f.u1 <= first), right = endPanels.filter(f => f.u0 >= last);
      const u0 = left.length ? Math.max(...left.map(f => f.u1)) : groupModel.widths[0] || 0;
      const u1 = right.length ? Math.min(...right.map(f => f.u0)) : groupModel.length - (groupModel.widths[groupModel.widths.length - 1] || 0);
      frontPanels.push({
        group: groupModel.group, material: materialFor.frontPanel, name: 'Panel tylny wyspy ' + thickness.frontPanel, a: u1 - u0, b: top, edges: [],
        box: [u0, u1, 0, top, carcassBack - thickness.frontPanel, carcassBack]
      });
    }

    // ---- fronts, hinges, hinge posts, drawer boxes ----
    const hingeSettings = settings.hinges, drawerSettings = settings.drawers;
    // shelf-pin rows (y of the hole centres) under an adjustable shelf: the main row always (a hit is reported), the extra rows
    // only where they miss the horizontal boards and stay in the carcass
    function shelfPinRows(shelfBoard, carcass) {
      const pin = settings.drilling.shelfPin, main = shelfBoard.centre - half - pin.belowShelf;
      const bands = horizontalBands(boards, carcass);
      const clear = y => bands.every(([b0, b1]) => y + pin.diameter / 2 < b0 || y - pin.diameter / 2 > b1) && y > carcass.v0 && y < carcass.v1;
      const extra = [];
      for (let k = 1; k <= pin.extra; k++) extra.push(main - k * pin.pitch, main + k * pin.pitch);
      return [main, ...extra.filter(clear)];
    }
    // a hinge that meets a shelf (closer than half a board + hinges.aboveShelf to its centre) goes above it: to the lowest height
    // at least hinges.aboveShelf over the shelf where its mounting-plate holes miss every shelf-pin hole (settings.drilling)
    function hingeClearOfShelves(v, carcass, front, item) {
      const plate = settings.drilling.plate, pin = settings.drilling.shelfPin;
      const centreOf = b => (b.box[2] + b.box[3]) / 2;
      const inDoor = b => b.carcassId === carcass.id && centreOf(b) > front.v0 && centreOf(b) < front.v1;
      const shelves = boards.filter(b => inDoor(b) && (b.id === 'adjustableShelf' || b.id === 'pullOutShelf')).map(centreOf);
      const reach = half + hingeSettings.aboveShelf;
      const hit = shelves.find(c => Math.abs(v - c) < reach);
      if (hit === undefined) return v;
      // shelf-pin holes on the same face (only adjustable shelves have pins), the rows the drilling keeps; centre distance as the overlap check
      const pins = boards.filter(b => inDoor(b) && b.id === 'adjustableShelf').flatMap(b => shelfPinRows(b, carcass))
        .flatMap(y => [pin.fromFront, carcassDepth - pin.fromBack].map(x => ({ x, y })));
      const minDistance = (plate.diameter + pin.diameter) / 2 + 1;
      const clear = h => shelves.every(c => Math.abs(h - c) >= reach) &&
        [h - plate.spacing / 2, h + plate.spacing / 2].every(y => pins.every(p => Math.hypot(p.x - plate.fromFront, p.y - y) >= minDistance));
      let h = Math.ceil(hit + reach);
      while (!clear(h) && h < front.v1) h++;
      if (h > front.v1 - hingeSettings.fromEnd / 2) warn(`${placeOf(item)}: zawias nad półką wychodzi poza drzwi - przesuń półkę.`, item.index);
      return h;
    }
    // drawers behind a door (tag doorDrawers): the hinges take hinges.postDepth at the carcass front, so the spacer and the boxes
    // stop there; the box front covers the ends of the sides and of the bottom
    function addDoorDrawers(item, front, carcass) {
      const doorDrawerSettings = settings.doorDrawers, t = thickness.drawerBox, at = placeOf(item);
      if (!reachesHingeSide(item, carcass)) return warn(`${at}: szuflady za drzwiami - drzwi muszą sięgać boku korpusu po stronie zawiasów.`, item.index);
      const count = doorDrawerSettings.count;
      const n1 = carcassFront - hingeSettings.postDepth, length = Math.max(...doorDrawerSettings.runnerLengths.filter(l => l <= n1 - carcassBack));
      if (!Number.isFinite(length)) return warn(`${at}: żadna prowadnica z settings.doorDrawers.runnerLengths nie mieści się w ${n1 - carcassBack}.`, item.index);
      const { bottom: lo, top: hi } = spaceAround(boards, carcass, item.v0, item.v1);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return warn(`${at}: szuflady za drzwiami - brak płyty poziomej nad lub pod drzwiami.`, item.index);
      const innerU0 = carcass.u0 + board, innerU1 = carcass.u1 - board, right = item.hinge === 'right';
      const spacer = spacerOnHingeSide(carcass, item.hinge);
      boards.push({ id: 'spacer', name: 'Płyta dystansowa', a: n1 - carcassBack, b: hi - lo, material: materialFor.carcass, layer: 'carcasses', group: carcass.group, carcassId: carcass.id,
        box: [...spacer, lo, hi, carcassBack, n1], edges: [{ side: 'front', length: hi - lo, along: 'b' }] });
      const u0 = (right ? innerU0 : spacer[1]) + doorDrawerSettings.clearance, u1 = (right ? spacer[0] : innerU1) - doorDrawerSettings.clearance, n0 = n1 - length, pitch = (hi - lo) / count;
      front.doorDrawers = { count, runnerLength: length, boxWidth: u1 - u0, boxHeight: t + doorDrawerSettings.sideHeight, boxes: [] }; // the runner length is the box depth
      for (let j = 0; j < count; j++) {
        const v = Math.round(lo + doorDrawerSettings.lift + j * pitch), top = v + t + doorDrawerSettings.sideHeight, next = j + 1 < count ? Math.round(lo + doorDrawerSettings.lift + (j + 1) * pitch) : hi;
        if (top > next) warn(`${at}: szuflada za drzwiami ${j + 1} (${t + doorDrawerSettings.sideHeight}) nie mieści się pod następną płytą.`, item.index);
        const common = { material: materialFor.drawerBox, layer: 'drawers', group: carcass.group, carcassId: carcass.id, frontId: front.id, doorDrawer: j }, inner = length - t;
        boards.push({ id: 'doorDrawerFront', name: 'Czoło szuflady za drzwiami', a: u1 - u0, b: t + doorDrawerSettings.sideHeight, ...common, box: [u0, u1, v, top, n1 - t, n1],
          edges: [{ side: 'top', length: u1 - u0, along: 'a' }, { side: 'left', length: t + doorDrawerSettings.sideHeight, along: 'b' }, { side: 'right', length: t + doorDrawerSettings.sideHeight, along: 'b' }] });
        boards.push({ id: 'doorDrawerBottom', name: 'Dno szuflady za drzwiami', a: u1 - u0 - 2 * t, b: inner, ...common, box: [u0 + t, u1 - t, v, v + t, n0, n1 - t], edges: [] });
        for (const s of [u0, u1 - t]) boards.push({ id: 'doorDrawerSide', name: 'Bok szuflady za drzwiami', a: inner, b: t + doorDrawerSettings.sideHeight, ...common, box: [s, s + t, v, top, n0, n1 - t], edges: [{ side: 'top', length: inner, along: 'a' }] });
        boards.push({ id: 'doorDrawerBack', name: 'Tył szuflady za drzwiami', a: u1 - u0 - 2 * t, b: doorDrawerSettings.sideHeight, ...common, box: [u0 + t, u1 - t, v + t, top, n0, n0 + t], edges: [{ side: 'top', length: u1 - u0 - 2 * t, along: 'a' }] });
        front.doorDrawers.boxes.push({ u0, u1, v0: v, v1: top, n0, n1 });
      }
      counts.doorDrawers += count;
    }
    for (const groupModel of Object.values(groups)) {
      for (const item of groupModel.items) {
        if (!FRONT_TYPES.includes(item.type)) continue;
        const box = frontBox(item), carcass = carcassOf(item), opening = openingOf(item), hinged = HINGED.includes(opening);
        if (box.u1 - box.u0 <= 0 || box.v1 - box.v0 <= 0) warn(`${placeOf(item)}: szczeliny nie zostawiają frontu.`, item.index);
        // hinges are screwed to a carcass side: a door that does not reach one gets a hinge post (an appliance front has no hinges)
        if (opening === 'door' && carcass && HINGE_SIDES.includes(item.hinge) && !reachesHingeSide(item, carcass)) {
          const postU0 = item.hinge === 'left' ? item.u0 : item.u1 - board, postV0 = Math.max(item.v0, carcass.v0 + board), postV1 = Math.min(item.v1, carcass.v1 - board);
          boards.push({
            id: 'hingePost', name: 'Słupek zawiasowy', a: hingeSettings.postDepth, b: postV1 - postV0, material: materialFor.carcass, layer: 'carcasses', group: groupModel.group, carcassId: carcass.id,
            box: [postU0, postU0 + board, postV0, postV1, carcassFront - hingeSettings.postDepth, carcassFront], edges: [{ side: 'front', length: postV1 - postV0, along: 'b' }], hand: item.hinge
          });
        }
        const front = {
          id: fronts.length + 1, group: groupModel.group, item, carcassId: carcass ? carcass.id : null, opening, tags: item.tags, gaps: item.gaps,
          ...box, width: box.u1 - box.u0, height: box.v1 - box.v0, handle: item.handle, hand: hinged ? item.hinge : '', material: materialFor[item.type],
          lacquer: LACQUER.front
        };
        item.front = front;
        fronts.push(front);
        counts.fronts++;
        if (item.handle) counts.handles++;

        if (opening === 'door' && carcass) {
          const count = countByHeight(hingeSettings.perDoor, front.height);
          if (count === null) warn(`${placeOf(item)}: wysokość frontu ${front.height} przekracza ostatni wiersz settings.hinges.perDoor.`, item.index);
          else {
            front.hinges = Array.from({ length: count }, (_, j) => Math.round(front.v0 + hingeSettings.fromEnd + ((front.height - 2 * hingeSettings.fromEnd) * j) / (count - 1)))
              .map(v => hingeClearOfShelves(v, carcass, front, item));
            front.hingeU = front.hand === 'right' ? item.u1 - board : item.u0 + board; // on the carcass side or the hinge post
            counts.hinges += count;
          }
        }

        if (opening === 'door' && carcass && hasTag(item, 'doorDrawers')) addDoorDrawers(item, front, carcass);

        if (opening === 'drawer' && carcass) {
          const size = front.height > drawerSettings.D.frontAbove ? 'D' : 'M', sizeSettings = drawerSettings[size];
          const innerU0 = carcass.u0 + board, innerU1 = carcass.u1 - board;
          const drawer = {
            size,
            sideHeight: sizeSettings.sideHeight,
            backHeight: sizeSettings.backHeight,
            innerU0,
            innerU1,
            bottomWidth: innerU1 - innerU0 - drawerSettings.bottom.inset,
            bottomV: item.v0 + (item.v0 === carcass.v0 ? drawerSettings.liftAtBottom : drawerSettings.liftAbove),
            bins: hasTag(item, 'bins'),
            inner: hasTag(item, 'innerDrawer')
          };
          front.drawer = drawer;
          const bottomU0 = innerU0 + drawerSettings.bottom.inset / 2, bottomU1 = innerU1 - drawerSettings.bottom.inset / 2;
          const backU0 = innerU0 + drawerSettings.back.inset / 2, backU1 = innerU1 - drawerSettings.back.inset / 2;
          const n0 = carcassBack + drawerSettings.bottom.fromBack, n1 = n0 + drawerSettings.bottom.depth, t = thickness.drawerBox;
          const drawerBoards = (v, backHeight, backName, inner) => {
            const common = { material: materialFor.drawerBox, layer: 'drawers', group: groupModel.group, carcassId: carcass.id, frontId: front.id, inner };
            boards.push({ id: 'drawerBottom', name: 'Dno szuflady', a: drawer.bottomWidth, b: drawerSettings.bottom.depth, ...common, box: [bottomU0, bottomU1, v, v + t, n0, n1] });
            boards.push({ id: 'drawerBack', name: backName, a: innerU1 - innerU0 - drawerSettings.back.inset, b: backHeight, ...common, box: [backU0, backU1, v + t, v + t + backHeight, n0, n0 + t] });
          };
          drawerBoards(drawer.bottomV, drawer.backHeight, 'Tył szuflady ' + size, false);
          if (size === 'D') counts.drawersD++;
          else counts.drawersM++;
          if (drawer.inner) {
            drawer.innerV = drawer.bottomV + drawer.sideHeight + drawerSettings.inner.gap;
            drawerBoards(drawer.innerV, drawerSettings.inner.backHeight, 'Tył szuflady wewnętrznej', true);
            counts.innerDrawers++;
            const innerTop = drawer.innerV + Math.max(t + drawerSettings.inner.backHeight, drawerSettings.M.sideHeight);
            const boardAbove = spaceAround(boards, carcass, item.v0, item.v1).top;
            if (innerTop > boardAbove) warn(`${placeOf(item)}: szuflada wewnętrzna sięga ${innerTop}, płyta nad nią zaczyna się na ${boardAbove}.`, item.index);
          }
        }
      }
    }

    // ---- holes: hinge cups in the doors, mounting plates and shelf pins in the carcass sides and hinge posts ----
    // a hole: kind, diameter, depth, x / y on the part (from the edges in part.holeFrom), u / v / n of its centre on the drilled face,
    // axis it is drilled along and dir (+1 / -1) into the part
    const drill = settings.drilling;
    const holeAt = (part, hole) => {
      (part.holes || (part.holes = [])).push(hole);
      return hole;
    };
    for (const carcass of carcasses) {
      const own = boards.filter(b => b.carcassId === carcass.id);
      // horizontal boards of the carcass: a shelf pin must not land in one
      const bands = horizontalBands(boards, carcass);
      const faceBoard = u => own.find(b => (b.id === 'side' || b.id === 'hingePost') && (b.box[0] === u || b.box[1] === u));
      // mounting plates: on the side or hinge post at the hinge edge of each door, plate.spacing apart around each hinge
      for (const front of fronts.filter(f => f.carcassId === carcass.id && f.hinges)) {
        const target = faceBoard(front.hingeU);
        if (!target) { warn(`${carcass.name}: brak boku lub słupka pod zawiasy frontu ${placeOf(front.item)}.`); continue; }
        target.holeFrom = { x: 'front', y: 'bottom' };
        const dir = target.box[1] === front.hingeU ? -1 : 1; // drilled from the face towards the inside of the board
        for (const v of front.hinges) {
          for (const dv of [-drill.plate.spacing / 2, drill.plate.spacing / 2]) {
            holeAt(target, { kind: 'plate', diameter: drill.plate.diameter, depth: drill.plate.depth, x: drill.plate.fromFront, y: v + dv - target.box[2],
              u: front.hingeU, v: v + dv, n: carcassFront - drill.plate.fromFront, axis: 'u', dir });
          }
        }
        front.holeFrom = { x: 'hinge', y: 'bottom' };
        const cupU = front.hand === 'left' ? front.u0 + drill.cup.fromEdge : front.u1 - drill.cup.fromEdge;
        for (const v of front.hinges) {
          holeAt(front, { kind: 'cup', diameter: drill.cup.diameter, depth: drill.cup.depth, x: drill.cup.fromEdge, y: v - front.v0,
            u: cupU, v, n: frontFace - frontThickness, axis: 'n', dir: 1 });
        }
      }
      const pin = drill.shelfPin, sides = own.filter(b => b.id === 'side');
      for (const shelfBoard of own.filter(b => b.id === 'adjustableShelf')) {
        for (const y of shelfPinRows(shelfBoard, carcass)) {
          for (const side of sides) {
            side.holeFrom = { x: 'front', y: 'bottom' };
            const inner = side.box[0] === carcass.u0 ? side.box[1] : side.box[0], dir = side.box[0] === carcass.u0 ? -1 : 1;
            for (const x of [pin.fromFront, carcassDepth - pin.fromBack]) {
              holeAt(side, { kind: 'shelfPin', diameter: pin.diameter, depth: pin.depth, x, y: y - side.box[2], u: inner, v: y, n: carcassFront - x, axis: 'u', dir });
            }
          }
        }
      }
      // drawer runners (and the pull-out shelf runners): in both sides, runner.belowDrawer under the drawer bottom, at runner.fromFront
      const runner = drill.runner;
      const runnerRows = [
        ...fronts.filter(f => f.carcassId === carcass.id && f.drawer).flatMap(f => [f.drawer.bottomV, ...(f.drawer.inner ? [f.drawer.innerV] : [])]),
        ...own.filter(b => b.id === 'pullOutShelf').map(b => b.box[2])
      ];
      // a spacer on a side (next to the pull-out shelf) carries the runner instead of that side
      const spacers = own.filter(b => b.id === 'spacer');
      for (const bottom of runnerRows) {
        for (const side of sides) {
          const left = side.box[0] === carcass.u0, y = bottom - runner.belowDrawer;
          const target = spacers.find(s => (left ? s.box[0] === side.box[1] : s.box[1] === side.box[0]) && y > s.box[2] && y < s.box[3]) || side;
          target.holeFrom = { x: 'front', y: 'bottom' };
          const inner = left ? target.box[1] : target.box[0], dir = left ? -1 : 1;
          for (const x of runner.fromFront) holeAt(target, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x, y: y - target.box[2], u: inner, v: y, n: carcassFront - x, axis: 'u', dir });
        }
      }
      // ball runners of the drawers behind a door (tag doorDrawers): on the spacer (hinge side) and on the carcass side opposite,
      // drilling.ballRunner.fromFront from the runner front, drilling.ballRunner.aboveBottom above the box bottom; diameter and depth of drilling.runner
      const ballRunner = drill.ballRunner;
      for (const front of fronts.filter(f => f.carcassId === carcass.id && f.doorDrawers)) {
        const right = front.hand === 'right';
        for (const box of front.doorDrawers.boxes) {
          const y = box.v0 + ballRunner.aboveBottom;
          const spacer = own.find(b => b.id === 'spacer' && b.box[2] <= y && b.box[3] >= y && (right ? b.box[0] >= box.u1 : b.box[1] <= box.u0));
          const side = sides.find(b => (right ? b.box[0] === carcass.u0 : b.box[1] === carcass.u1));
          for (const target of [spacer, side].filter(Boolean)) {
            target.holeFrom = { x: 'front', y: 'bottom' };
            const atRight = target.box[0] >= box.u1, inner = atRight ? target.box[0] : target.box[1], dir = atRight ? 1 : -1;
            for (const p of ballRunner.fromFront) {
              const n = box.n1 - p;
              holeAt(target, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x: target.box[5] - n, y: y - target.box[2], u: inner, v: y, n, axis: 'u', dir });
            }
          }
        }
      }
      // holes too close on one face of one part (once per pair of kinds and part); a hole in a horizontal board (once per kind and carcass)
      const boardHits = new Set();
      for (const b of own.filter(b => b.holes)) {
        b.holes.sort((h, g) => h.y - g.y || h.x - g.x);
        const near = (h, g) => Math.hypot(g.x - h.x, g.y - h.y) < (g.diameter + h.diameter) / 2 + 1;
        // a hole in a side or a hinge post must not land where a horizontal board meets it
        const inBoard = b.holes.find(h => h.axis === 'u' && bands.some(([b0, b1]) => h.v + h.diameter / 2 > b0 && h.v - h.diameter / 2 < b1));
        if (inBoard && !boardHits.has(inBoard.kind)) {
          boardHits.add(inBoard.kind);
          warn(`${carcass.name}: ${b.name.toLowerCase()} - ${LABELS.hole[inBoard.kind]} trafia w płytę poziomą (${inBoard.x} od przodu, ${Math.round(inBoard.y)} od dołu): sprawdź ustawienia drilling.`);
        }
        const pairsMet = new Set();
        b.holes.forEach((h, i) => {
          for (const g of b.holes.slice(i + 1).filter(g => near(h, g))) {
            if (pairsMet.has(h.kind + '|' + g.kind)) continue;
            pairsMet.add(h.kind + '|' + g.kind);
            warn(`${carcass.name}: ${b.name.toLowerCase()} - ${LABELS.hole[h.kind]} i ${LABELS.hole[g.kind]} w tym samym miejscu (${h.x} od przodu, ${Math.round(h.y)} od dołu): przesuń półkę albo zawias.`);
          }
        });
      }
    }

    // ---- appliances in their places: item.fit, shown by cost.html (notes) and drawn by view.html ----
    // every fit has the body, centred on its module or carcass: {bodyU0, bodyU1, bodyV0, bodyV1}; an oven or a microwave stands on its feet
    // (appliances.js) on the board under its module: + {feet, fasciaV0, fasciaV1}; a fridge stands on the carcass bottom, one fit on both
    // its fronts; a dishwasher stands on the floor on its feet, up to the worktop: + {feet, doorV0, doorV1}
    const bodyAcross = (place, appliance) => { const centre = (place.u0 + place.u1) / 2; return { bodyU0: centre - appliance.body.width / 2, bodyU1: centre + appliance.body.width / 2 }; };
    function fitAppliances(applianceData) {
      for (const groupModel of Object.values(groups)) {
        for (const item of groupModel.items) {
          if ((item.type === 'oven' || item.type === 'microwave') && applianceData[item.type] && item.carcassId) {
            const a = applianceData[item.type];
            const floor = spaceAround(boards, carcassOf(item), item.v0, item.v1).bottom;
            if (!Number.isFinite(floor)) { warn(`${placeOf(item)}: ${typeLabel(item.type)} nie ma płyty pod sobą.`, item.index); continue; }
            const bodyV0 = floor + a.feet, fasciaV0 = bodyV0 + a.fascia.bottom;
            item.fit = { ...bodyAcross(item, a), bodyV0, bodyV1: bodyV0 + a.body.height, feet: a.feet, fasciaV0, fasciaV1: fasciaV0 + a.fascia.height };
          }
          if (hasTag(item, 'dishwasher') && applianceData.dishwasher && worktops[groupModel.group]) {
            const a = applianceData.dishwasher, bodyV1 = a.feet + a.body.height;
            if (bodyV1 !== worktops[groupModel.group].v0) warn(`${placeOf(item)}: zmywarka na nóżkach ma ${bodyV1}, spód blatu jest na ${worktops[groupModel.group].v0}.`, item.index);
            item.fit = { ...bodyAcross(item, a), bodyV0: a.feet, bodyV1, feet: a.feet, doorV0: bodyV1 - a.door.height, doorV1: bodyV1 };
          }
        }
      }
      // one fit for the fridge and the freezer front of a fridge carcass
      for (const carcass of carcasses.filter(candidate => candidate.fridge && applianceData.fridgeFreezer)) {
        const a = applianceData.fridgeFreezer, bodyV0 = carcass.v0 + board;
        const fit = { ...bodyAcross(carcass, a), bodyV0, bodyV1: bodyV0 + a.body.height };
        for (const item of carcass.boxes.filter(b => hasTag(b, 'fridge', 'freezer'))) item.fit = fit;
      }
    }

    // ---- worktop pieces and their cut-outs (sink, hob): settings.cutouts[flag], centred on the carcass, fromBack from the worktop back edge ----
    const worktopPieces = [];
    for (const groupModel of Object.values(groups)) {
      const worktop = worktops[groupModel.group];
      if (!worktop) continue;
      // finished where an edge is seen: ABS, unless the material comes with that edge (factoryEdges); cut-outs stay bare
      const items = groupModel.items.filter(i => i.type === 'worktop' || i.type === 'endPanel'), endPanels = items.filter(i => i.type === 'endPanel');
      // a worktop end is seen over an end panel at that end: nothing but spaces between them (the space = the worktop overhanging the panel)
      const onlySpaces = (a, b) => groupModel.items.every(i => i.type === 'space' || i.u1 <= a || i.u0 >= b || i.v0 >= worktop.v0);
      const endPanelAt = {
        left: item => endPanels.some(f => f.u0 >= item.u0 && onlySpaces(item.u0, f.u0)),
        right: item => endPanels.some(f => f.u1 <= item.u1 && onlySpaces(f.u1, item.u1))
      };
      // an end panel stands worktop.endPanelOverhang behind the worktop front (and its back on an island): the joint stays hidden
      const endPanelN0 = worktop.n0 + (groupModel.island ? settings.worktop.endPanelOverhang : 0), endPanelN1 = worktop.n1 - settings.worktop.endPanelOverhang;
      for (const item of items) {
        const endPanel = item.type === 'endPanel', length = endPanel ? item.v1 - item.v0 : item.u1 - item.u0;
        const material = endPanel ? materialFor[groupModel.island ? ISLAND_END_PANEL_USE : 'endPanel'] : worktop.material;
        const n0 = endPanel ? endPanelN0 : worktop.n0, n1 = endPanel ? endPanelN1 : worktop.n1, depth = n1 - n0;
        const materialDepth = projectData.materials[material].depth;
        if (endPanel && materialDepth < depth) warn(`${placeOf(item)}: panel końcowy ${depth} głęboki, materiał ${materials[material].label} ma ${materialDepth}.`, item.index);
        const seen = [{ side: 'front', length, along: 'a' }];
        if (groupModel.island) seen.push({ side: 'back', length, along: 'a' });
        if (!endPanel) for (const side of ['left', 'right']) if (endPanelAt[side](item)) seen.push({ side, length: depth, along: 'b' });
        const factory = projectData.materials[material].factoryEdges || [];
        worktopPieces.push({
          group: groupModel.group, item, name: endPanel ? 'Panel końcowy' : 'Blat', material, a: length, b: depth, n0, n1,
          edges: seen.filter(edge => !factory.includes(edge.side)), factoryEdges: seen.map(edge => edge.side).filter(side => factory.includes(side))
        });
      }
      worktop.cutouts = [];
    }
    for (const carcass of carcasses.filter(candidate => candidate.base)) {
      for (const flag of CUTOUT_FLAGS.filter(f => carcass[f])) {
        const cut = (settings.cutouts || {})[flag], worktop = worktops[carcass.group];
        if (!cut) { warn(`${carcass.name}: brak wymiarów wycięcia w settings.cutouts.${flag}.`); continue; }
        if (!worktop) continue;
        const centre = (carcass.u0 + carcass.u1) / 2, u0 = centre - cut.width / 2, u1 = centre + cut.width / 2, n0 = worktop.n0 + cut.fromBack, n1 = n0 + cut.depth;
        const piece = worktopPieces.find(p => p.group === carcass.group && p.item.type === 'worktop' && p.item.u0 <= u0 && p.item.u1 >= u1);
        if (!piece) { warn(`${carcass.name}: wycięcie (${LABELS.hole[flag]}) nie mieści się w jednym blacie.`); continue; }
        if (u0 < carcass.u0 + board || u1 > carcass.u1 - board) warn(`${carcass.name}: ${LABELS.hole[flag]} ${cut.width} szersze niż wnętrze korpusu ${carcass.u1 - carcass.u0 - 2 * board}.`);
        if (n0 < carcassBack + board || n1 > carcassFront - board) warn(`${carcass.name}: ${LABELS.hole[flag]} ${cut.depth} wychodzi poza wnętrze korpusu w głębokości (${n0}–${n1}, wnętrze ${carcassBack + board}–${carcassFront - board}).`);
        const cutout = { kind: flag, width: cut.width, depth: cut.depth, u0, u1, n0, n1, x: u0 - piece.item.u0, y: cut.fromBack, carcassId: carcass.id };
        worktop.cutouts.push(cutout);
        piece.holeFrom = { x: 'left', y: 'back' };
        (piece.cutouts || (piece.cutouts = [])).push(cutout);
      }
    }

    if (appliances) fitAppliances(appliances);

    return {
      settings, warnings: issues.map(issue => issue.text), issues, counts, thickness, materials, materialFor, frontThickness, worktopPieces,
      carcassDepth, carcassBack, carcassFront, frontFace, panelFace, plinthFace, // n: from the carcass backs
      groups, carcasses, fronts, boards, strips, plinths, frontPanels, wallPanels, plaster, worktops
    };
  }

  /* ================= 6. LISTS AND FILES ================= */

  // parts with the same name, size, ABS edges and lacquer counted together, one row each: the holes are drilled by hand on site, so
  // left and right parts and parts drilled differently share a row (one label) and the row lists where to drill each of them:
  //   {name, a, b, qty, where, edges, lacquer, drillings, key}
  //   where = their "at" labels, e.g. "K2, K5 ×2"; edges = ABS edges of one part [{side, length, along}]; lacquer = {long, short} lacquered
  //   edges or null; drillings = [{drilling, qty}]: each drilling (drillingOf) with the number of parts that have it, left parts first;
  //   key = cutKey (the same parts listed elsewhere, e.g. per carcass, find their row by it)
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
      const where = [...at].map(([label, n]) => (n > 1 ? label + ' ×' + n : label)).join(', ');
      return { name: part.name, a: part.a, b: part.b, qty, where, edges: part.edges || [], lacquer: part.lacquer || null,
        drillings: [...drillings.values()].sort((x, y) => handOrder(x) - handOrder(y)), key };
    });
  }
  const cutKey = p => [p.name, p.a, p.b, JSON.stringify(p.edges || []), JSON.stringify(p.lacquer || null)].join('|');

  // where to drill or cut one part, in part coordinates: {from: {x, y}, hand, holes: [{kind, diameter, depth, x, y}], cutouts: [{kind, width, depth, x, y}]}
  // or null; hand (left | right) tells a left part from a right one with the same pattern (sides, hinge posts, doors)
  function drillingOf(part) {
    if (!part.holes && !part.cutouts) return null;
    const r = x => Math.round(x * 10) / 10;
    return {
      from: part.holeFrom,
      hand: part.hand || '',
      holes: (part.holes || []).map(h => ({ kind: h.kind, diameter: h.diameter, depth: h.depth, x: r(h.x), y: r(h.y) }))
        .sort((p, q) => p.kind.localeCompare(q.kind) || p.y - q.y || p.x - q.x),
      cutouts: (part.cutouts || []).map(c => ({ kind: c.kind, width: c.width, depth: c.depth, x: r(c.x), y: r(c.y) }))
    };
  }

  // where each carcass is and what it is made of; roomPosition(carcass) adds its place in the room (view.html)
  function carcassMap(model, roomPosition) {
    return model.carcasses.map(carcass => {
      const entry = {
        carcass: carcass.name,
        group: carcass.group,
        columns: carcass.span > 1 ? [carcass.column, carcass.column + carcass.span - 1] : [carcass.column],
        x: [carcass.u0, carcass.u1],
        y: [carcass.v0, carcass.v1],
        z: [model.carcassBack, model.carcassFront].map(n => n - model.groups[carcass.group].wall), // from the wall (an island: from its back)
        size: [carcass.u1 - carcass.u0, carcass.v1 - carcass.v0, model.carcassDepth],
        kind: LABELS.carcassKind[carcass.kind],
        flags: carcass.flags.map(flag => LABELS.flag[flag]),
        members: carcass.members.map(i => ({ column: i.span > 1 ? [i.column, i.column + i.span - 1] : i.column, tags: tagsLabel([i.type, ...i.tags]), x: [i.u0, i.u1], y: [i.v0, i.v1] })),
        boards: cutList(model.boards.filter(b => b.carcassId === carcass.id)).map(row => (row.qty > 1 ? row.qty + ' × ' : '') + row.name + ' ' + row.a + ' × ' + row.b),
        legs: carcass.legs
      };
      if (roomPosition) entry.room = roomPosition(carcass);
      return entry;
    });
  }

  // JSON with short arrays and objects on one line
  function json1(value) {
    if (Array.isArray(value)) return '[' + value.map(json1).join(', ') + ']';
    if (value && typeof value === 'object') return '{' + Object.entries(value).map(([k, x]) => JSON.stringify(k) + ': ' + json1(x)).join(', ') + '}';
    return JSON.stringify(value);
  }

  // the carcass map as text: one carcass per block, members and boards one per line
  function mapJSON(map) {
    const field = ([key, value]) =>
      '    ' + JSON.stringify(key) + ': ' +
      ((key === 'members' || key === 'boards') && value.length ? '[\n' + value.map(x => '      ' + json1(x)).join(',\n') + '\n    ]' : json1(value));
    return '[\n' + map.map(entry => '  {\n' + Object.entries(entry).map(field).join(',\n') + '\n  }').join(',\n') + '\n]\n';
  }

  // design.js sets window.KITCHEN_DESIGN (a script tag, so the pages also work from file://)
  function load() {
    const data = root.KITCHEN_DESIGN;
    return data ? Promise.resolve(data) : Promise.reject(new Error('Nie znaleziono pliku design.js obok tej strony'));
  }

  // the text of design.js: one material / setting / note / component per line, a blank line between groups
  function designJS(project) {
    const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
    // a table (an object of objects, e.g. settings.drilling) gets one line per entry
    const value = v => (isObject(v) && Object.values(v).every(isObject)
      ? '{\n' + Object.entries(v).map(([k, x]) => '   ' + json1(k) + ': ' + json1(x)).join(',\n') + '\n  }'
      : json1(v));
    const entries = (obj, line = v => value(v)) => Object.entries(obj || {}).map(([k, v]) => '  ' + json1(k) + ': ' + line(v)).join(',\n');
    const components = project.components.map((c, i) => (i && c.group !== project.components[i - 1].group ? '\n' : '') + '  ' + json1(c)).join(',\n');
    return '/* Kitchen project design - shared by design.html, cost.html and view.html.\n' +
      '   Plain JSON after "window.KITCHEN_DESIGN =". Notes, columns and components: design.html (Import data / Export data);\n' +
      '   materials and settings: by hand (design.html keeps them as they are). */\n' +
      'window.KITCHEN_DESIGN = {\n "materials": {\n' + entries(project.materials, json1) +
      '\n },\n "settings": {\n' + entries(project.settings) +
      '\n },\n "notes": [\n' + project.notes.map(n => '  ' + json1(n)).join(',\n') +
      '\n ],\n "columns": {\n' + entries(project.columns) +
      '\n },\n "components": [\n' + components + '\n ]\n};\n';
  }
  // the project object from the text of design.js (or plain JSON)
  function fromDesignJS(text) {
    const i = text.indexOf('{'), j = text.lastIndexOf('}');
    if (i < 0 || j < i) throw new Error('brak obiektu JSON');
    return JSON.parse(text.slice(i, j + 1));
  }

  root.KitchenEngine = {
    TYPES, TAGS, TAG_NAMES, LABELS, typeLabel, tagsLabel, useLabel, hasTag, FRONT_TYPES, SIDES, HINGE_SIDES,
    placeLabel, gapsText, parseTags, spaceAround, valueAt, PINS_PER_SHELF, tagsOf, readType, cutKey, checkSettings, build, cutList, carcassMap, mapJSON,
    load, designJS, fromDesignJS, plural
  };
})(typeof window !== 'undefined' ? window : globalThis);
