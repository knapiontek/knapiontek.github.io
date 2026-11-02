/* engine.js - builds the kitchen model from design.js for design.html, cost.html and view.html.
   The same project always gives the same model. No drawing and no numbers of this kitchen: they all come from design.js.
   Coordinates in mm per group: u along the group, v up from the floor, n out from the wall; a box is [u0, u1, v0, v1, n0, n1]. */
(function (root) {
  'use strict';

  /* ================= 1. VOCABULARY: types, tags and what they build ================= */

  // type = what a component is; exactly one per component, it decides what gets built (rules.md, section 2)
  const TYPES = ['filler', 'plasterboard', 'plinth', 'worktop', 'fall', 'splash', 'panel', 'frame', 'cabinet', 'drawer', 'oven', 'micro'];

  // tag = an extra on a type: it adds to the same build. Each tag is allowed only on the types listed.
  const TAGS = {
    dummy: ['drawer'],       // fixed drawer front: no drawer box
    hob: ['cabinet', 'drawer'], // rails on edge + separation panel under the hob
    sink: ['cabinet', 'drawer'], // rails on edge, no shelves, sink cut-out
    bins: ['drawer'],        // waste-sorting bins in the drawer
    inner: ['drawer'],       // inner cutlery drawer above the drawer box, behind the same front
    island: ['worktop'],     // island worktop: of the islandWorktop material, the island back panel, no wall
    coffee: ['cabinet'],     // pull-out shelf at the bottom, shelves above it, no other shelves
    doorDrawers: ['cabinet'],   // drawers of board on ball runners behind the door, a spacer on the hinge side, no shelves
    fridge: ['cabinet'],     // front on a built-in fridge door: no hinges, no adjustable shelves, no back
    freezer: ['cabinet'],    // the same, freezer door
    dishwasher: ['cabinet']  // front on a built-in dishwasher door: no carcass, no hinges
  };
  const TAG_NAMES = Object.keys(TAGS);
  // at most one tag of each set per component
  const EXCLUSIVE_TAGS = [['fridge', 'freezer', 'dishwasher'], ['dummy', 'bins'], ['dummy', 'inner'], ['coffee', 'doorDrawers']];

  const FRONT_TYPES = ['cabinet', 'drawer'];              // have a front: 4 gaps, a handle
  const BOX_TYPES = [...FRONT_TYPES, 'oven', 'micro'];    // stand in a carcass (need a carcass name, except a dishwasher)
  const BOARD_TYPES = ['worktop', 'fall', 'splash', 'plinth', 'panel', 'frame', ...FRONT_TYPES]; // each in the uses of exactly one material

  // parts the engine adds inside a carcass; with the board types they are the uses a material lists
  const PARTS = ['carcass', 'back', 'drawerBox', 'hobPanel'];
  // the worktop and the side panels (fall) of an island have their own materials (their depth)
  const ISLAND_USE = 'islandWorktop', ISLAND_FALL_USE = 'islandFall';
  const DEPTH_USES = ['worktop', ISLAND_USE, 'fall', ISLAND_FALL_USE]; // worktop: the depth; side panel: the largest depth it can have
  const USES = [...BOARD_TYPES, ISLAND_USE, ISLAND_FALL_USE, ...PARTS];

  // carcass flags: a carcass has the flag when one of its boxes has one of the tags
  const CARCASS_FLAGS = { sink: ['sink'], hob: ['hob'], fridge: ['fridge', 'freezer'], coffee: ['coffee'], doorDrawers: ['doorDrawers'] };

  // a carcass on a plinth gets a ventilation grille in the plinth when it holds one of these (air intake for the appliance)
  const GRILLE_FOR = { types: ['oven'], tags: ['fridge', 'freezer'] };
  const VENTED_SHELF_OVER = ['oven']; // a fixed shelf over these types is shallower: settings.shelf.ventGap of air behind it
  const SHELF_UNDER_JOINT = ['oven'];  // a fixed shelf under these types sits below the joint, not centred: the front under it can cover it fully

  // visible names (Polish) of the identifiers above; the code keeps the English identifiers
  const LABELS = {
    type: { filler: 'wypełnienie', plasterboard: 'zabudowa GK', plinth: 'cokół', worktop: 'blat', fall: 'panel boczny', splash: 'panel ścienny', panel: 'panel',
      frame: 'listwa', cabinet: 'szafka', drawer: 'szuflada', oven: 'piekarnik', micro: 'mikrofalówka' },
    tag: { dummy: 'atrapa', hob: 'płyta grzewcza', sink: 'zlew', bins: 'kosze', inner: 'szuflada wewnętrzna', island: 'wyspa',
      coffee: 'ekspres', doorDrawers: 'szuflady za drzwiami', fridge: 'lodówka', freezer: 'zamrażarka', dishwasher: 'zmywarka' },
    carcassType: { base: 'dolna', tall: 'słupek', wall: 'górna' },
    opening: { door: 'drzwi', drawer: 'szuflada', fixed: 'atrapa', fridge: 'drzwi lodówki', dishwasher: 'drzwi zmywarki' },
    edge: { front: 'przód', top: 'góra', bottom: 'dół', left: 'lewa', right: 'prawa' },
    // uses that are not a type (the types have their own label)
    use: { islandWorktop: 'blat wyspy', islandFall: 'panel boczny wyspy', carcass: 'korpus', back: 'plecy', drawerBox: 'szuflady', hobPanel: 'przegroda pod płytą' },
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
  // the kitchen is seen. A frame on edge shows only its long edge facing the room.
  const FRAME_LACQUERED_SIDES = ['front'];
  const LACQUER = {
    front: { long: 2, short: 2 },
    frame: { long: FRAME_LACQUERED_SIDES.length, short: 0 },
    plinth: { long: 0, short: 0 }
  };

  // settings the engine and the pages read: a missing one stops the build (checkSettings)
  const REQUIRED_SETTINGS = [
    'carcass.depth', 'carcass.wallGap', 'carcass.legs',
    'back.inset',
    'rails.depth', 'rails.hobFront', 'rails.hobPanelGap',
    'shelf.setback', 'shelf.clearance', 'shelf.perDoor', 'shelf.ventGap',
    'pullOutShelf.depth', 'pullOutShelf.clearance', 'pullOutShelf.lift', 'pullOutShelf.spacerAbove', 'pullOutShelf.space', 'pullOutShelf.shelvesAbove',
    'doorDrawers.perDoor', 'doorDrawers.side', 'doorDrawers.lift', 'doorDrawers.runner.gap', 'doorDrawers.runner.lengths', 'doorDrawers.runner.fromFront', 'doorDrawers.runner.axis',
    'hinges.fromEnd', 'hinges.postDepth', 'hinges.aboveShelf', 'hinges.perDoor',
    'drawers.dAbove', 'drawers.D.sideHeight', 'drawers.D.backHeight', 'drawers.M.sideHeight', 'drawers.M.backHeight',
    'drawers.bottom.inset', 'drawers.bottom.depth', 'drawers.bottom.fromBack', 'drawers.back.inset',
    'drawers.liftAtBottom', 'drawers.liftAbove', 'drawers.inner.gap', 'drawers.inner.backHeight', 'drawers.inner.frontDeduction',
    'front.shakerRail',
    'frame.bracketSpace', 'frame.depth',
    'plinth.setback',
    'worktop.overhang', 'worktop.fallOverhang',
    'plasterboard.depth', 'plasterboard.studSpacing', 'plasterboard.layers',
    'drilling.cup.diameter', 'drilling.cup.depth', 'drilling.cup.fromEdge',
    'drilling.plate.diameter', 'drilling.plate.depth', 'drilling.plate.fromFront', 'drilling.plate.spacing',
    'drilling.shelfPin.diameter', 'drilling.shelfPin.depth', 'drilling.shelfPin.fromFront', 'drilling.shelfPin.fromBack',
    'drilling.shelfPin.belowShelf', 'drilling.shelfPin.extra', 'drilling.shelfPin.pitch',
    'drilling.runner.diameter', 'drilling.runner.depth', 'drilling.runner.fromFront', 'drilling.runner.belowDrawer'
  ];

  // cut-outs in a worktop: the carcass flag that asks for one -> settings.cutouts[flag] {width, depth, fromBack}, centred on the carcass
  const CUTOUT_FLAGS = ['sink', 'hob'];

  // a shelf rests on a pin in each side at the front and at the back (rules.md, section 5)
  const PINS_PER_SHELF = 4;

  // boards lying flat in a carcass: no hole may hit them
  const HORIZONTAL_BOARDS = ['bottom', 'top', 'rail', 'fixedShelf', 'hobPanel'];

  /* ================= 2. SMALL HELPERS ================= */

  // for the pages: the Polish plural form of a count (1 problem, 2 problemy, 5 problemów)
  const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? few : many);

  const valueAt = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));
  const reachesHingeSide = (item, K) => (item.hinge === 'left' ? item.u0 === K.u0 : item.u1 === K.u1); // the door reaches the carcass side its hinges are on

  // how a component's place is printed (warnings, lists, tooltips): "G1[4]" = group 1, column 4; "G1[1-11]" = columns 1 to 11
  const placeLabel = (group, col, span = 1) => `G${group}[${col}${span > 1 ? '-' + (col + span - 1) : ''}]`;
  const placeOf = item => placeLabel(item.group, item.col, item.span);

  // how many shelves, hinges ... a front of this height gets
  const countByHeight = (table, height) => {
    const row = table.find(r => r.maxHeight === undefined || height <= r.maxHeight);
    return row ? row.count : null;
  };

  // the clear space of a module in its carcass: the nearest horizontal boards below and above its middle (a fixed shelf need not be
  // centred on a joint, e.g. under an oven); NaN where there is none
  function spaceAround(boards, K, v0, v1) {
    const mid = (v0 + v1) / 2, bands = boards.filter(b => b.carcassId === K.id && HORIZONTAL_BOARDS.includes(b.id)).map(b => [b.box[2], b.box[3]]);
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
  // the tags a type allows (TAGS), in TAG_NAMES order
  const tagsOf = type => TAG_NAMES.filter(tag => TAGS[tag].includes(type));
  const readType = value => { const t = String(value ?? '').trim().toLowerCase(); return TYPES.includes(t) ? t : ''; };

  // a worktop, a side panel or a frame is as thick as its material: which size to compare
  function onEdgeSize(item, island) {
    const width = item.u1 - item.u0, height = item.v1 - item.v0;
    if (item.type === 'worktop') return { use: island ? ISLAND_USE : 'worktop', size: height, what: 'wysokość' };
    if (item.type === 'fall') return { use: island ? ISLAND_FALL_USE : 'fall', size: width, what: 'szerokość' };
    if (item.type === 'frame') return { use: 'frame', size: Math.min(width, height), what: height > width ? 'szerokość' : 'wysokość' };
    return null;
  }

  function frontBox(item) {
    const { left, right, top, bottom } = item.gaps;
    return { u0: item.u0 + left, u1: item.u1 - right, v0: item.v0 + bottom, v1: item.v1 - top };
  }

  /* ================= 3. CHECKS THAT STOP THE BUILD: materials and settings ================= */

  // use (board type or part) -> material code, from materials[code].uses
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
    for (const path of ['shelf.perDoor', 'hinges.perDoor', 'doorDrawers.perDoor']) {
      const table = valueAt(settings, path);
      const isRow = (row, last) => row && Number.isInteger(row.count) && (last ? row.maxHeight === undefined : row.maxHeight > 0);
      if (table !== undefined && !(Array.isArray(table) && table.length && table.every((row, i) => isRow(row, i === table.length - 1)))) {
        problems.push(`Ustawienie ${path} musi być listą [{maxHeight, count}, ..., {count}] (ostatni wiersz bez maxHeight).`);
      }
    }
    const hingeTable = valueAt(settings, 'hinges.perDoor');
    if (Array.isArray(hingeTable) && hingeTable.some(row => !(row && row.count >= 2))) problems.push('Ustawienie hinges.perDoor: każde drzwi potrzebują co najmniej 2 zawiasów.');
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
      col: +c.column,
      span: +c.span,
      height: c.height,
      type: readType(c.type),
      tags: tags.tags,
      unknownTags: tags.unknown,
      carcassName: String(c.carcass || '').trim(),
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
    const colX = [0];
    widths.forEach(w => colX.push(colX[colX.length - 1] + w));
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
      const first = piece.col - 1, end = first + piece.span;
      if (!Number.isInteger(piece.col) || !Number.isInteger(piece.span) || first < 0 || piece.span < 1 || end > widths.length || !(piece.height >= 0)) {
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
      items.push({ ...piece, u0: colX[first], u1: colX[end], v0, v1 });
    }
    return { items, skipped, colX };
  }

  // items with the same carcass name: width over all their columns, height of their boxes
  function carcassAreas(items) {
    const byName = new Map();
    for (const item of items) {
      if (!item.carcassName) continue;
      if (!byName.has(item.carcassName)) byName.set(item.carcassName, []);
      byName.get(item.carcassName).push(item);
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
        firstCol: Math.min(...members.map(i => i.col)),
        lastCol: Math.max(...members.map(i => i.col + i.span - 1))
      };
    });
  }

  /* ================= 5. BUILD ================= */

  // appliances (appliances.js, optional): the manufacturer's sizes, under the name of the type or tag they fit (fitAppliances)
  function build(project, appliances) {
    const P = project || {}, settings = P.settings || {};
    const stops = checkSettings(P);
    if (stops.length) throw new Error('Ustawienia w design.js: ' + stops.join(' '));

    // every thickness comes from the material of the type or part
    const { materialFor } = materialUses(P.materials);
    const thickness = Object.fromEntries(Object.entries(materialFor).map(([use, code]) => [use, P.materials[code].thickness]));
    // label of each material: name + thickness, e.g. "Płyta wiórowa Egger U708 ST9 szary jasny 18"
    const materials = Object.fromEntries(Object.entries(P.materials).map(([code, m]) => [code, { ...m, label: m.name + ' ' + m.thickness }]));
    const board = thickness.carcass, half = board / 2, frontThickness = thickness.cabinet, carcassDepth = settings.carcass.depth;
    // depths from the wall (n)
    const carcassBack = settings.carcass.wallGap;
    const carcassFront = carcassBack + carcassDepth;
    const frontFace = carcassFront + frontThickness;
    const plinthFace = frontFace - settings.plinth.setback;
    // [u0, u1] of a spacer of carcass board inside the carcass side on the hinge side (it carries runners past the hinges)
    const spacerOnHingeSide = (K, hinge) => (hinge === 'right' ? [K.u1 - 2 * board, K.u1 - board] : [K.u0 + board, K.u0 + 2 * board]);

    const issues = []; // { index of the component, text, skipped }
    const warn = (text, index = null, skipped = false) => { issues.push({ index, text, skipped }); };
    const groups = {}, carcasses = [], fronts = [], boards = [];
    const frames = [], plinths = [], panels = [], splashes = [], plaster = [], worktops = {};
    // engine counts, used by cost.html as {n:name}; wallBrackets: brackets of the back strips at a wall; jointLength: mm of carcass side
    // screwed to a frame and its back strip, from the first carcass (screwed) or from inside the second one (fromInside)
    const counts = {
      carcasses: 0, wallBrackets: 0, jointLength: { screwed: 0, fromInside: 0 }, fronts: 0, handles: 0, hinges: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, doorDrawers: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0,
      plasterUD: 0, plasterCD: 0, plasterEdge: 0, type: {}, tag: {}
    };

    // ---- components: checks on one component; what cannot be placed is skipped ----
    const columns = P.columns || {}, pieces = [];
    (P.components || []).forEach((c, index) => {
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
      if (hasTag(piece, 'dishwasher') && piece.carcassName) warn(`${at}: zmywarka nie ma korpusu - usuń nazwę korpusu ${piece.carcassName}.`, index);
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
      groups[g] = {
        group: +g,
        widths,
        colX: stacked.colX,
        length: stacked.colX[stacked.colX.length - 1],
        items: stacked.items,
        island: stacked.items.some(item => item.type === 'worktop' && hasTag(item, 'island')), // a free-standing island: its worktop has the tag island
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
    for (const G of Object.values(groups)) {
      for (const area of G.areas) {
        if (groupOfName.has(area.name)) {
          warn(`Korpus ${area.name} jest w grupie ${groupOfName.get(area.name)} i w grupie ${G.group} - korpus musi być w jednej grupie.`, area.members[0].index);
          continue;
        }
        groupOfName.set(area.name, G.group);
        const boxes = area.members.filter(i => BOX_TYPES.includes(i.type)).sort((a, b) => a.v0 - b.v0 || a.u0 - b.u0);
        carcasses.push({
          name: area.name, group: G.group, col: area.firstCol, span: area.lastCol - area.firstCol + 1,
          u0: area.u0, u1: area.u1, v0: area.v0, v1: area.v1, boxes, members: area.members
        });
      }
      for (const item of G.items) {
        if (BOX_TYPES.includes(item.type) && !item.carcassName && !hasTag(item, 'dishwasher')) warn(`${placeOf(item)}: ${typeLabel(item.type)} nie ma nazwy korpusu.`, item.index);
      }
    }
    carcasses.forEach((K, i) => {
      K.id = i + 1;
      // floor = stands on a plinth; base = floor with a worktop on top; tall = floor without a worktop; wall = not on a plinth
      const overlapsColumns = item => item.col <= K.col + K.span - 1 && item.col + item.span - 1 >= K.col;
      const groupItems = groups[K.group].items;
      K.floor = groupItems.some(item => item.type === 'plinth' && overlapsColumns(item) && item.v1 === K.v0);
      K.base = K.floor && groupItems.some(item => item.type === 'worktop' && overlapsColumns(item) && item.v0 === K.v1);
      K.type = K.base ? 'base' : K.floor ? 'tall' : 'wall';
      for (const [flag, tags] of Object.entries(CARCASS_FLAGS)) K[flag] = K.boxes.some(b => hasTag(b, ...tags));
      K.flags = Object.keys(CARCASS_FLAGS).filter(flag => K[flag]);
      if (K.sink && K.hob) warn(`${K.name}: zlew i płyta grzewcza w jednym korpusie wykluczają się.`, K.members[0].index);
      K.legs = K.floor ? settings.carcass.legs : 0;
      K.grille = K.floor && K.boxes.some(b => GRILLE_FOR.types.includes(b.type) || hasTag(b, ...GRILLE_FOR.tags));
      for (const item of K.members) item.carcass = K;
      counts.legs += K.legs;
      counts.sinks += K.sink;
      counts.hobs += K.hob;
      counts.fridges += K.fridge;
      counts.grilles += K.grille;
    });
    counts.carcasses = carcasses.length;

    // ---- carcass boards ----
    // id: kind of board, the same for all sizes (colours and counts on the pages); a, b: size; box: place;
    // edges: ABS edges [{side, length, along}] - the edge seen from the front, along = the size it runs along (a | b); hidden parts get none
    const addBoard = b => {
      boards.push(b);
      return b;
    };
    const rails = settings.rails, shelf = settings.shelf, back = settings.back;
    for (const K of carcasses) {
      const { u0, u1, v0, v1 } = K;
      const width = u1 - u0, height = v1 - v0;
      const innerU0 = u0 + board, innerU1 = u1 - board, innerWidth = width - 2 * board;
      const carcassMaterial = materialFor.carcass;
      const part = (id, name, a, b, material, layer, box, edges = []) => addBoard({ id, name, a, b, material, layer, group: K.group, carcassId: K.id, box, edges });
      const frontEdge = (length, along) => [{ side: 'front', length, along }];
      const bottomEdge = [{ side: 'bottom', length: innerWidth, along: 'a' }]; // a rail on edge shows its bottom edge when the drawer below is open

      part('side', 'Bok', carcassDepth, height, carcassMaterial, 'carcasses', [u0, innerU0, v0, v1, carcassBack, carcassFront], frontEdge(height, 'b')).hand = 'left';
      part('side', 'Bok', carcassDepth, height, carcassMaterial, 'carcasses', [innerU1, u1, v0, v1, carcassBack, carcassFront], frontEdge(height, 'b')).hand = 'right';
      part('bottom', 'Wieniec dolny', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v0, v0 + board, carcassBack, carcassFront], frontEdge(innerWidth, 'a'));

      // top: a base carcass has 2 top rails (flat; on edge under a sink or a hob), any other carcass a top panel
      const railName = 'Trawers ' + rails.depth;
      if (K.base && K.sink) {
        // the rails stand on edge to clear the bowl
        part('rail', railName + ' przedni, na sztorc', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassFront - board, carcassFront], bottomEdge);
        part('rail', railName + ' tylny, na sztorc', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
      } else if (K.base && K.hob) {
        // front rail on edge (hobFront high), rear rail on edge; the separation panel behind the front rail, flush with its bottom edge
        // (hidden from the front), with an air gap at the back
        part('rail', 'Trawers ' + rails.hobFront + ' przedni, na sztorc', innerWidth, rails.hobFront, carcassMaterial, 'carcasses',
          [innerU0, innerU1, v1 - rails.hobFront, v1, carcassFront - board, carcassFront], bottomEdge);
        part('rail', railName + ' tylny, na sztorc', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
        part('hobPanel', 'Przegroda pod płytą', innerWidth, carcassDepth - 2 * board - rails.hobPanelGap, materialFor.hobPanel, 'carcasses',
          [innerU0, innerU1, v1 - rails.hobFront, v1 - rails.hobFront + thickness.hobPanel, carcassBack + board + rails.hobPanelGap, carcassFront - board]);
      } else if (K.base) {
        part('rail', railName + ' przedni', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassFront - rails.depth, carcassFront], frontEdge(innerWidth, 'a'));
        part('rail', railName + ' tylny', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassBack + rails.depth]);
      } else {
        part('top', 'Wieniec górny', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassFront], frontEdge(innerWidth, 'a'));
      }

      // back only behind cabinet doors (not behind drawers, dummy fronts, ovens, microwaves, fridges, freezers); one piece per run of doors
      const doorSpans = K.boxes
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
        part('back', 'Plecy', width - 2 * back.inset, s1 - s0 - 2 * back.inset, materialFor.back, 'backs',
          [u0 + back.inset, u1 - back.inset, s0 + back.inset, s1 - back.inset, carcassBack - thickness.back, carcassBack]);
      }

      // fixed shelf at each joint of 2 boxes; a base carcass has its rails, a fridge carcass its own shelf (below)
      if (!K.base && !K.fridge) {
        const joints = [...new Set(K.boxes.map(b => b.v0))].filter(joint => joint > v0);
        for (const joint of joints) {
          const vented = K.boxes.some(b => b.v1 === joint && VENTED_SHELF_OVER.includes(b.type)), gap = vented ? settings.shelf.ventGap : 0;
          const top = K.boxes.some(b => b.v0 === joint && SHELF_UNDER_JOINT.includes(b.type)) ? joint : joint + half;
          part('fixedShelf', 'Półka stała', innerWidth, carcassDepth - gap, carcassMaterial, 'shelves', [innerU0, innerU1, top - board, top, carcassBack + gap, carcassFront], frontEdge(innerWidth, 'a'));
          counts.shelvesFixed++;
        }
      }
      // a fridge carcass: its joints are inside the appliance; one fixed shelf right on the appliance top, which is screwed to it;
      // shallower to let the air out
      const fridgeHeight = K.fridge && appliances && appliances.fridge ? appliances.fridge.body.height : null;
      if (fridgeHeight) {
        const top = v0 + board + fridgeHeight + board, gap = settings.shelf.ventGap;
        if (top > v1 - board) warn(`${K.name}: lodówka ${fridgeHeight} nie mieści się w korpusie (wnętrze ${height - 2 * board}).`);
        else {
          part('fixedShelf', 'Półka stała', innerWidth, carcassDepth - gap, carcassMaterial, 'shelves', [innerU0, innerU1, top - board, top, carcassBack + gap, carcassFront], frontEdge(innerWidth, 'a'));
          counts.shelvesFixed++;
        }
      }

      // a filler at one end of a carcass (e.g. the hidden end of an L corner): the carcass runs on behind it, an inset panel
      // closes its front; hidden: no ABS
      const topBoard = K.base && K.sink ? rails.depth : K.base && K.hob ? rails.hobFront : board;
      for (const f of K.members.filter(i => i.type === 'filler')) {
        const atRight = f.u1 === K.u1, atLeft = f.u0 === K.u0;
        if (atRight === atLeft) {
          warn(`${placeOf(f)}: wypełnienie w korpusie musi być na jego końcu.`, f.index);
          continue;
        }
        const s0 = atRight ? Math.max(...K.boxes.map(b => b.u1)) : innerU0, s1 = atRight ? innerU1 : Math.min(...K.boxes.map(b => b.u0));
        part('insetPanel', 'Panel wpuszczany', s1 - s0, height - board - topBoard, carcassMaterial, 'carcasses',
          [s0, s1, v0 + board, v1 - topBoard, carcassFront - board, carcassFront]);
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
        if (!reachesHingeSide(door, K)) warn(`${placeOf(door)}: ekspres - drzwi muszą sięgać boku korpusu po stronie zawiasów.`, door.index);
        else {
          const spacer = spacerOnHingeSide(K, door.hinge), top = y + board + pullOut.spacerAbove;
          part('spacer', 'Płyta dystansowa', carcassDepth, top - lo, carcassMaterial, 'carcasses',
            [...spacer, lo, top, carcassBack, carcassFront], [{ side: 'front', length: top - lo, along: 'b' }, { side: 'top', length: carcassDepth, along: 'a' }]); // the top is seen above the shelf
          if (door.hinge === 'right') s1 = spacer[0]; else s0 = spacer[1];
        }
        const shelfWidth = s1 - s0 - 2 * pullOut.clearance;
        part('pullOutShelf', 'Półka wysuwana', shelfWidth, pullOut.depth, carcassMaterial, 'shelves',
          [s0 + pullOut.clearance, s1 - pullOut.clearance, y, y + board, carcassFront - pullOut.depth, carcassFront], frontEdge(shelfWidth, 'a')).item = door;
        counts.pullOutShelves++;
        const above = y + board + pullOut.space;
        for (let j = 0; j < pullOut.shelvesAbove; j++) adjustableShelf(Math.round(above + ((hi - above) * j) / pullOut.shelvesAbove));
      };
      if (!K.sink && !K.fridge) {
        // per door, by its front height (settings.shelf.perDoor), evenly between the boards above and below the door
        for (const b of K.boxes) {
          if (b.type !== 'cabinet' || hasTag(b, 'doorDrawers')) continue; // behind a door with doorDrawers: the drawers, no shelves
          const { bottom: lo, top: hi } = spaceAround(boards, K, b.v0, b.v1);
          if (hasTag(b, 'coffee')) { addPullOutShelf(b, lo, hi); continue; }
          const front = frontBox(b), frontHeight = front.v1 - front.v0, count = countByHeight(shelf.perDoor, frontHeight);
          if (count === null) { warn(`${placeOf(b)}: wysokość frontu ${frontHeight} przekracza ostatni wiersz settings.shelf.perDoor.`, b.index); continue; }
          for (let j = 1; j <= count; j++) adjustableShelf(Math.round(lo + ((hi - lo) * j) / (count + 1)));
        }
      }
    }

    // ---- frames (with a back strip outside a carcass), panels, wall panels, plinths, plasterboard ----
    const frameSettings = settings.frame, plasterSettings = settings.plasterboard;
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        const { u0, u1, v0, v1 } = item, width = u1 - u0, height = v1 - v0;
        if (item.type === 'frame') {
          frames.push({
            group: G.group, item, material: materialFor.frame, box: [u0, u1, v0, v1, frontFace - frameSettings.depth, frontFace],
            name: (height > width ? 'Listwa ' : 'Listwa pozioma ') + thickness.frame + ' na sztorc (gł. ' + frameSettings.depth + ')',
            a: frameSettings.depth, b: Math.max(width, height),
            lacquer: LACQUER.frame, lacqueredSides: FRAME_LACQUERED_SIDES
          });
          if (!item.carcassName) {
            // back strips: as high as the carcasses beside the frame, one per carcass one above the other; a strip on another one starts
            // frame.bracketSpace higher, room for the wall bracket on top of the strip below (the island stands free: no bracket)
            const along = height > width;
            const beside = along ? carcasses.filter(K => K.group === G.group && (K.u0 === u1 || K.u1 === u0) && K.v0 < v1 && K.v1 > v0) : [];
            let spans = [[v0, v1]];
            if (beside.length) {
              const joints = [...new Set(beside.filter(K => beside.some(L => L.v0 === K.v1 && L.u0 === K.u0)).map(K => K.v1))].sort((a, b) => a - b);
              const ends = [Math.max(v0, Math.min(...beside.map(K => K.v0))), ...joints, Math.min(v1, Math.max(...beside.map(K => K.v1)))];
              spans = ends.slice(0, -1).map((a, i) => [i ? a + frameSettings.bracketSpace : a, ends[i + 1]]);
              if (!G.island) counts.wallBrackets += spans.length - 1; // the top strip of a stack has no bracket
              // the frame and its strips are screwed to the carcass on one side; the carcass on the other side from inside
              const length = Ks => Ks.reduce((sum, K) => sum + Math.min(K.v1, v1) - Math.max(K.v0, v0), 0);
              const left = beside.filter(K => K.u1 === u0), right = beside.filter(K => K.u0 === u1);
              counts.jointLength.screwed += length(left.length ? left : right);
              if (left.length) counts.jointLength.fromInside += length(right);
            }
            for (const [s0, s1] of spans) {
              addBoard({
                id: 'backStrip', name: 'Listwa tylna ' + frameSettings.depth, a: frameSettings.depth, b: along ? s1 - s0 : width, material: materialFor.carcass, layer: 'carcasses',
                group: G.group, col: item.col, box: along ? [u0, u1, s0, s1, carcassBack, carcassBack + frameSettings.depth] : [u0, u1, v0, v1, carcassBack, carcassBack + frameSettings.depth],
                strip: true, edges: [] // hidden behind its frame
              });
            }
          }
        } else if (item.type === 'panel') {
          // an edge shows when the front next to it opens: ABS on each edge whose neighbour (touching, overlapping) is a front that opens
          const overlaps = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0;
          const neighbour = {
            top: o => o.v0 === item.v1 && overlaps(o.u0, o.u1, item.u0, item.u1), bottom: o => o.v1 === item.v0 && overlaps(o.u0, o.u1, item.u0, item.u1),
            left: o => o.u1 === item.u0 && overlaps(o.v0, o.v1, item.v0, item.v1), right: o => o.u0 === item.u1 && overlaps(o.v0, o.v1, item.v0, item.v1)
          };
          const edges = SIDES
            .filter(side => G.items.some(other => opens(other) && neighbour[side](other)))
            .map(side => (side === 'top' || side === 'bottom' ? { side, length: width, along: 'a' } : { side, length: height, along: 'b' }));
          panels.push({ group: G.group, item, material: materialFor.panel, name: 'Panel ' + thickness.panel, a: width, b: height, box: [u0, u1, v0, v1, frontFace - thickness.panel, frontFace], edges });
        } else if (item.type === 'splash') {
          splashes.push({ group: G.group, item, material: materialFor.splash, name: 'Panel ścienny ' + thickness.splash, a: width, b: height, box: [u0, u1, v0, v1, 0, thickness.splash], edges: [] });
        } else if (item.type === 'plinth') {
          plinths.push({ group: G.group, item, material: materialFor.plinth, a: height, b: width, box: [u0, u1, v0, v1, plinthFace - thickness.plinth, plinthFace], lacquer: LACQUER.plinth });
        } else if (item.type === 'plasterboard') {
          // cladding: the face plus the return along the long side; profiles: UD on both fixed edges, CD on the outer edge + cross pieces
          const long = Math.max(width, height), short = Math.min(width, height), depth = plasterSettings.depth;
          plaster.push(
            { group: G.group, item, name: 'Płyta GK - czoło', a: short, b: long },
            { group: G.group, item, name: 'Płyta GK - bok', a: depth, b: long }
          );
          counts.plasterUD += 2 * long;
          counts.plasterCD += long + (Math.ceil(long / plasterSettings.studSpacing) + 1) * (depth + short);
          counts.plasterEdge += long; // one outer edge (corner bead) and one joint to the furniture (seal) per box
        }
      }
    }

    // ---- worktops: depth and thickness from the worktop material (island: the islandWorktop material); behind the carcass = depth - carcass - front - overhang ----
    for (const G of Object.values(groups)) {
      const top = G.items.find(i => i.type === 'worktop');
      if (!top) {
        if (G.items.some(i => i.type === 'fall')) warn(`Grupa ${G.group}: panele boczne bez blatu na górze.`);
        continue;
      }
      const use = G.island ? ISLAND_USE : 'worktop', material = materialFor[use], depth = P.materials[material].depth;
      const behind = depth - carcassDepth - frontThickness - settings.worktop.overhang;
      if (behind < 0) warn(`Grupa ${G.group}: blat ${depth} jest krótszy niż korpus + front + nawis (${carcassDepth + frontThickness + settings.worktop.overhang}).`);
      worktops[G.group] = { n0: carcassBack - behind, n1: frontFace + settings.worktop.overhang, depth, back: behind, v0: top.v0, v1: top.v1, use, material, thickness: thickness[use] };
    }

    // ---- island back panel: panel material, between the side panels (none: the end columns), floor to the carcass tops, on the carcass backs ----
    for (const G of Object.values(groups).filter(G => G.island)) {
      const own = carcasses.filter(K => K.group === G.group);
      const top = Math.max(0, ...own.map(K => K.v1));
      const first = Math.min(...own.map(K => K.u0)), last = Math.max(...own.map(K => K.u1));
      const falls = G.items.filter(i => i.type === 'fall');
      const left = falls.filter(f => f.u1 <= first), right = falls.filter(f => f.u0 >= last);
      const u0 = left.length ? Math.max(...left.map(f => f.u1)) : G.widths[0] || 0;
      const u1 = right.length ? Math.min(...right.map(f => f.u0)) : G.length - (G.widths[G.widths.length - 1] || 0);
      panels.push({
        group: G.group, material: materialFor.panel, name: 'Panel tylny wyspy ' + thickness.panel, a: u1 - u0, b: top, edges: [],
        box: [u0, u1, 0, top, carcassBack - thickness.panel, carcassBack]
      });
    }

    // ---- fronts, hinges, hinge posts, drawer boxes ----
    const hingeSettings = settings.hinges, drawerSettings = settings.drawers;
    // a hinge that meets a shelf (closer than half a board + hinges.aboveShelf to its centre) goes above it: to the lowest height
    // at least hinges.aboveShelf over the shelf where its mounting-plate holes miss every shelf-pin hole (settings.drilling)
    // shelf-pin rows (y of the hole centres) under an adjustable shelf: the main row always (a hit is reported), the extra rows
    // only where they miss the horizontal boards and stay in the carcass
    function shelfPinRows(shelfBoard, K) {
      const pin = settings.drilling.shelfPin, main = shelfBoard.centre - half - pin.belowShelf;
      const bands = boards.filter(b => b.carcassId === K.id && HORIZONTAL_BOARDS.includes(b.id)).map(b => [b.box[2], b.box[3]]);
      const clear = y => bands.every(([b0, b1]) => y + pin.diameter / 2 < b0 || y - pin.diameter / 2 > b1) && y > K.v0 && y < K.v1;
      const extra = [];
      for (let k = 1; k <= pin.extra; k++) extra.push(main - k * pin.pitch, main + k * pin.pitch);
      return [main, ...extra.filter(clear)];
    }
    function hingeClearOfShelves(v, K, front, item) {
      const plate = settings.drilling.plate, pin = settings.drilling.shelfPin;
      const centreOf = b => (b.box[2] + b.box[3]) / 2;
      const inDoor = b => b.carcassId === K.id && centreOf(b) > front.v0 && centreOf(b) < front.v1;
      const shelves = boards.filter(b => inDoor(b) && (b.id === 'adjustableShelf' || b.id === 'pullOutShelf')).map(centreOf);
      const reach = half + hingeSettings.aboveShelf;
      const hit = shelves.find(c => Math.abs(v - c) < reach);
      if (hit === undefined) return v;
      // shelf-pin holes on the same face (only adjustable shelves have pins), the rows the drilling keeps; centre distance as the overlap check
      const pins = boards.filter(b => inDoor(b) && b.id === 'adjustableShelf').flatMap(b => shelfPinRows(b, K))
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
    function addDoorDrawers(item, front, K) {
      const S = settings.doorDrawers, t = thickness.drawerBox, at = placeOf(item);
      if (!reachesHingeSide(item, K)) return warn(`${at}: szuflady za drzwiami - drzwi muszą sięgać boku korpusu po stronie zawiasów.`, item.index);
      const count = countByHeight(S.perDoor, front.height);
      if (count === null) return warn(`${at}: wysokość frontu ${front.height} przekracza ostatni wiersz settings.doorDrawers.perDoor.`, item.index);
      const n1 = carcassFront - hingeSettings.postDepth, length = Math.max(...S.runner.lengths.filter(l => l <= n1 - carcassBack));
      if (!Number.isFinite(length)) return warn(`${at}: żadna prowadnica z settings.doorDrawers.runner.lengths nie mieści się w ${n1 - carcassBack}.`, item.index);
      const { bottom: lo, top: hi } = spaceAround(boards, K, item.v0, item.v1);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return warn(`${at}: szuflady za drzwiami - brak płyty poziomej nad lub pod drzwiami.`, item.index);
      const innerU0 = K.u0 + board, innerU1 = K.u1 - board, right = item.hinge === 'right';
      const spacer = spacerOnHingeSide(K, item.hinge);
      addBoard({ id: 'spacer', name: 'Płyta dystansowa', a: n1 - carcassBack, b: hi - lo, material: materialFor.carcass, layer: 'carcasses', group: K.group, carcassId: K.id,
        box: [...spacer, lo, hi, carcassBack, n1], edges: [{ side: 'front', length: hi - lo, along: 'b' }] });
      const u0 = (right ? innerU0 : spacer[1]) + S.runner.gap, u1 = (right ? spacer[0] : innerU1) - S.runner.gap, n0 = n1 - length, pitch = (hi - lo) / count;
      front.doorDrawers = { count, runner: length, boxWidth: u1 - u0, boxHeight: t + S.side, boxes: [] }; // runner length = the box depth
      for (let j = 0; j < count; j++) {
        const v = Math.round(lo + S.lift + j * pitch), top = v + t + S.side, next = j + 1 < count ? Math.round(lo + S.lift + (j + 1) * pitch) : hi;
        if (top > next) warn(`${at}: szuflada za drzwiami ${j + 1} (${t + S.side}) nie mieści się pod następną płytą.`, item.index);
        const common = { material: materialFor.drawerBox, layer: 'drawers', group: K.group, carcassId: K.id, frontId: front.id, doorDrawer: j }, inner = length - t;
        addBoard({ id: 'doorDrawerFront', name: 'Czoło szuflady za drzwiami', a: u1 - u0, b: t + S.side, ...common, box: [u0, u1, v, top, n1 - t, n1],
          edges: [{ side: 'top', length: u1 - u0, along: 'a' }, { side: 'left', length: t + S.side, along: 'b' }, { side: 'right', length: t + S.side, along: 'b' }] });
        addBoard({ id: 'doorDrawerBottom', name: 'Dno szuflady za drzwiami', a: u1 - u0 - 2 * t, b: inner, ...common, box: [u0 + t, u1 - t, v, v + t, n0, n1 - t], edges: [] });
        for (const s of [u0, u1 - t]) addBoard({ id: 'doorDrawerSide', name: 'Bok szuflady za drzwiami', a: inner, b: t + S.side, ...common, box: [s, s + t, v, top, n0, n1 - t], edges: [{ side: 'top', length: inner, along: 'a' }] });
        addBoard({ id: 'doorDrawerBack', name: 'Tył szuflady za drzwiami', a: u1 - u0 - 2 * t, b: S.side, ...common, box: [u0 + t, u1 - t, v + t, top, n0, n0 + t], edges: [{ side: 'top', length: u1 - u0 - 2 * t, along: 'a' }] });
        front.doorDrawers.boxes.push({ u0, u1, v0: v, v1: top, n0, n1 });
      }
      counts.doorDrawers += count;
    }
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        if (!FRONT_TYPES.includes(item.type)) continue;
        const box = frontBox(item), K = item.carcass, opening = openingOf(item), hinged = HINGED.includes(opening);
        if (box.u1 - box.u0 <= 0 || box.v1 - box.v0 <= 0) warn(`${placeOf(item)}: szczeliny nie zostawiają frontu.`, item.index);
        // hinges are screwed to a carcass side: a door that does not reach one gets a hinge post (an appliance front has no hinges)
        if (opening === 'door' && K && HINGE_SIDES.includes(item.hinge) && !reachesHingeSide(item, K)) {
          const postU0 = item.hinge === 'left' ? item.u0 : item.u1 - board, postV0 = Math.max(item.v0, K.v0 + board), postV1 = Math.min(item.v1, K.v1 - board);
          addBoard({
            id: 'hingePost', name: 'Słupek zawiasowy', a: hingeSettings.postDepth, b: postV1 - postV0, material: materialFor.carcass, layer: 'carcasses', group: G.group, carcassId: K.id,
            box: [postU0, postU0 + board, postV0, postV1, carcassFront - hingeSettings.postDepth, carcassFront], edges: [{ side: 'front', length: postV1 - postV0, along: 'b' }], hand: item.hinge
          });
        }
        const front = {
          id: fronts.length + 1, group: G.group, item, carcassId: K ? K.id : null, opening, tags: item.tags, gaps: item.gaps,
          ...box, width: box.u1 - box.u0, height: box.v1 - box.v0, handle: item.handle, hand: hinged ? item.hinge : '', material: materialFor[item.type],
          lacquer: LACQUER.front
        };
        item.front = front;
        fronts.push(front);
        counts.fronts++;
        if (item.handle) counts.handles++;

        if (opening === 'door' && K) {
          const count = countByHeight(hingeSettings.perDoor, front.height);
          if (count === null) warn(`${placeOf(item)}: wysokość frontu ${front.height} przekracza ostatni wiersz settings.hinges.perDoor.`, item.index);
          else {
            front.hinges = Array.from({ length: count }, (_, j) => Math.round(front.v0 + hingeSettings.fromEnd + ((front.height - 2 * hingeSettings.fromEnd) * j) / (count - 1)))
              .map(v => hingeClearOfShelves(v, K, front, item));
            front.hingeU = front.hand === 'right' ? item.u1 - board : item.u0 + board; // on the carcass side or the hinge post
            counts.hinges += count;
          }
        }

        if (opening === 'door' && K && hasTag(item, 'doorDrawers')) addDoorDrawers(item, front, K);

        if (opening === 'drawer' && K) {
          const size = front.height > drawerSettings.dAbove ? 'D' : 'M', sizeSettings = drawerSettings[size];
          const innerU0 = K.u0 + board, innerU1 = K.u1 - board;
          const drawer = {
            size,
            sideHeight: sizeSettings.sideHeight,
            backHeight: sizeSettings.backHeight,
            innerU0,
            innerU1,
            bottomWidth: innerU1 - innerU0 - drawerSettings.bottom.inset,
            bottomV: item.v0 + (item.v0 === K.v0 ? drawerSettings.liftAtBottom : drawerSettings.liftAbove),
            bins: hasTag(item, 'bins'),
            inner: hasTag(item, 'inner')
          };
          front.drawer = drawer;
          const bottomU0 = innerU0 + drawerSettings.bottom.inset / 2, bottomU1 = innerU1 - drawerSettings.bottom.inset / 2;
          const backU0 = innerU0 + drawerSettings.back.inset / 2, backU1 = innerU1 - drawerSettings.back.inset / 2;
          const n0 = carcassBack + drawerSettings.bottom.fromBack, n1 = n0 + drawerSettings.bottom.depth, t = thickness.drawerBox;
          const drawerBoards = (v, backHeight, backName, inner) => {
            const common = { material: materialFor.drawerBox, layer: 'drawers', group: G.group, carcassId: K.id, frontId: front.id, inner };
            addBoard({ id: 'drawerBottom', name: 'Dno szuflady', a: drawer.bottomWidth, b: drawerSettings.bottom.depth, ...common, box: [bottomU0, bottomU1, v, v + t, n0, n1] });
            addBoard({ id: 'drawerBack', name: backName, a: innerU1 - innerU0 - drawerSettings.back.inset, b: backHeight, ...common, box: [backU0, backU1, v + t, v + t + backHeight, n0, n0 + t] });
          };
          drawerBoards(drawer.bottomV, drawer.backHeight, 'Tył szuflady ' + size, false);
          if (size === 'D') counts.drawersD++;
          else counts.drawersM++;
          if (drawer.inner) {
            drawer.innerV = drawer.bottomV + drawer.sideHeight + drawerSettings.inner.gap;
            drawerBoards(drawer.innerV, drawerSettings.inner.backHeight, 'Tył szuflady wewnętrznej', true);
            counts.innerDrawers++;
            const innerTop = drawer.innerV + Math.max(t + drawerSettings.inner.backHeight, drawerSettings.M.sideHeight);
            const boardAbove = spaceAround(boards, K, item.v0, item.v1).top;
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
    for (const K of carcasses) {
      const own = boards.filter(b => b.carcassId === K.id);
      // horizontal boards of the carcass: a shelf pin must not land in one
      const bands = own.filter(b => HORIZONTAL_BOARDS.includes(b.id)).map(b => [b.box[2], b.box[3]]);
      const faceBoard = u => own.find(b => (b.id === 'side' || b.id === 'hingePost') && (b.box[0] === u || b.box[1] === u));
      // mounting plates: on the side or hinge post at the hinge edge of each door, plate.spacing apart around each hinge
      for (const front of fronts.filter(f => f.carcassId === K.id && f.hinges)) {
        const target = faceBoard(front.hingeU);
        if (!target) { warn(`${K.name}: brak boku lub słupka pod zawiasy frontu ${placeOf(front.item)}.`); continue; }
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
        for (const y of shelfPinRows(shelfBoard, K)) {
          for (const side of sides) {
            side.holeFrom = { x: 'front', y: 'bottom' };
            const inner = side.box[0] === K.u0 ? side.box[1] : side.box[0], dir = side.box[0] === K.u0 ? -1 : 1;
            for (const x of [pin.fromFront, carcassDepth - pin.fromBack]) {
              holeAt(side, { kind: 'shelfPin', diameter: pin.diameter, depth: pin.depth, x, y: y - side.box[2], u: inner, v: y, n: carcassFront - x, axis: 'u', dir });
            }
          }
        }
      }
      // drawer runners (and the pull-out shelf runners): in both sides, runner.belowDrawer under the drawer bottom, at runner.fromFront
      const runner = drill.runner;
      const runnerRows = [
        ...fronts.filter(f => f.carcassId === K.id && f.drawer).flatMap(f => [f.drawer.bottomV, ...(f.drawer.inner ? [f.drawer.innerV] : [])]),
        ...own.filter(b => b.id === 'pullOutShelf').map(b => b.box[2])
      ];
      // a spacer on a side (next to the pull-out shelf) carries the runner instead of that side
      const spacers = own.filter(b => b.id === 'spacer');
      for (const bottom of runnerRows) {
        for (const side of sides) {
          const left = side.box[0] === K.u0, y = bottom - runner.belowDrawer;
          const target = spacers.find(s => (left ? s.box[0] === side.box[1] : s.box[1] === side.box[0]) && y > s.box[2] && y < s.box[3]) || side;
          target.holeFrom = { x: 'front', y: 'bottom' };
          const inner = left ? target.box[1] : target.box[0], dir = left ? -1 : 1;
          for (const x of runner.fromFront) holeAt(target, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x, y: y - target.box[2], u: inner, v: y, n: carcassFront - x, axis: 'u', dir });
        }
      }
      // ball runners of the drawers behind a door (tag doorDrawers): on the spacer (hinge side) and on the carcass side opposite,
      // doorDrawers.runner.fromFront from the runner front, doorDrawers.runner.axis above the box bottom
      const doorDrawerRunner = settings.doorDrawers.runner;
      for (const front of fronts.filter(f => f.carcassId === K.id && f.doorDrawers)) {
        const right = front.hand === 'right';
        for (const box of front.doorDrawers.boxes) {
          const y = box.v0 + doorDrawerRunner.axis;
          const spacer = own.find(b => b.id === 'spacer' && b.box[2] <= y && b.box[3] >= y && (right ? b.box[0] >= box.u1 : b.box[1] <= box.u0));
          const side = sides.find(b => (right ? b.box[0] === K.u0 : b.box[1] === K.u1));
          for (const target of [spacer, side].filter(Boolean)) {
            target.holeFrom = { x: 'front', y: 'bottom' };
            const atRight = target.box[0] >= box.u1, inner = atRight ? target.box[0] : target.box[1], dir = atRight ? 1 : -1;
            for (const p of doorDrawerRunner.fromFront) {
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
          warn(`${K.name}: ${b.name.toLowerCase()} - ${LABELS.hole[inBoard.kind]} trafia w płytę poziomą (${inBoard.x} od przodu, ${Math.round(inBoard.y)} od dołu): sprawdź ustawienia drilling.`);
        }
        const pairsMet = new Set();
        b.holes.forEach((h, i) => {
          for (const g of b.holes.slice(i + 1).filter(g => near(h, g))) {
            if (pairsMet.has(h.kind + '|' + g.kind)) continue;
            pairsMet.add(h.kind + '|' + g.kind);
            warn(`${K.name}: ${b.name.toLowerCase()} - ${LABELS.hole[h.kind]} i ${LABELS.hole[g.kind]} w tym samym miejscu (${h.x} od przodu, ${Math.round(h.y)} od dołu): przesuń półkę albo zawias.`);
          }
        });
      }
    }

    // ---- appliances in their places: item.fit, shown by cost.html (notes) and drawn by view.html ----
    // an oven or a microwave stands on its feet (appliances.js) on the board under its module: fit {feet, bodyV0, frontV0, frontV1}. A fridge stands on the carcass bottom, centred: fit {bodyU0, bodyU1,
    // bodyV0, bodyV1} on both its fronts. A dishwasher stands on the floor on its feet, up to the worktop: fit {height, doorHeight, doorV0}.
    function fitAppliances(A) {
      for (const G of Object.values(groups)) {
        for (const item of G.items) {
          if ((item.type === 'oven' || item.type === 'micro') && A[item.type] && item.carcass) {
            const a = A[item.type];
            const floor = spaceAround(boards, item.carcass, item.v0, item.v1).bottom;
            if (!Number.isFinite(floor)) { warn(`${placeOf(item)}: ${typeLabel(item.type)} nie ma płyty pod sobą.`, item.index); continue; }
            const bodyV0 = floor + a.feet, frontV0 = bodyV0 + a.front.bottom;
            item.fit = { feet: a.feet, bodyV0, frontV0, frontV1: frontV0 + a.front.height };
          }
          if (hasTag(item, 'fridge', 'freezer') && A.fridge && item.carcass) {
            const K = item.carcass, uc = (K.u0 + K.u1) / 2, bodyV0 = spaceAround(boards, K, K.v0, K.v0 + 2 * board).bottom;
            item.fit = { bodyU0: uc - A.fridge.body.width / 2, bodyU1: uc + A.fridge.body.width / 2, bodyV0, bodyV1: bodyV0 + A.fridge.body.height };
          }
          if (hasTag(item, 'dishwasher') && A.dishwasher && worktops[G.group]) {
            const a = A.dishwasher, height = a.body.height + a.feet, doorHeight = a.door.height;
            if (height !== worktops[G.group].v0) warn(`${placeOf(item)}: zmywarka na nóżkach ma ${height}, spód blatu jest na ${worktops[G.group].v0}.`, item.index);
            item.fit = { height, doorHeight, doorV0: height - doorHeight };
          }
        }
      }
    }

    // ---- worktop pieces and their cut-outs (sink, hob): settings.cutouts[flag], centred on the carcass, fromBack from the worktop back edge ----
    const worktopPieces = [];
    for (const G of Object.values(groups)) {
      const W = worktops[G.group];
      if (!W) continue;
      // finished where an edge is seen: ABS, unless the material comes with that edge (factoryEdges); cut-outs stay bare
      const items = G.items.filter(i => i.type === 'worktop' || i.type === 'fall'), falls = items.filter(i => i.type === 'fall');
      // a worktop end is seen over a side panel at that end: nothing but fillers between them (the filler = the worktop overhanging the panel)
      const onlyFillers = (a, b) => G.items.every(i => i.type === 'filler' || i.u1 <= a || i.u0 >= b || i.v0 >= W.v0);
      const fallAt = {
        left: item => falls.some(f => f.u0 >= item.u0 && onlyFillers(item.u0, f.u0)),
        right: item => falls.some(f => f.u1 <= item.u1 && onlyFillers(f.u1, item.u1))
      };
      // a side panel stands worktop.fallOverhang behind the worktop front (and its back on an island): the joint stays hidden
      const fallN0 = W.n0 + (G.island ? settings.worktop.fallOverhang : 0), fallN1 = W.n1 - settings.worktop.fallOverhang;
      for (const item of items) {
        const fall = item.type === 'fall', length = fall ? item.v1 - item.v0 : item.u1 - item.u0;
        const material = fall ? materialFor[G.island ? ISLAND_FALL_USE : 'fall'] : W.material;
        const n0 = fall ? fallN0 : W.n0, n1 = fall ? fallN1 : W.n1, depth = n1 - n0;
        const materialDepth = P.materials[material].depth;
        if (fall && materialDepth < depth) warn(`${placeOf(item)}: panel boczny ${depth} głęboki, materiał ${materials[material].label} ma ${materialDepth}.`, item.index);
        const seen = [{ side: 'front', length, along: 'a' }];
        if (G.island) seen.push({ side: 'back', length, along: 'a' });
        if (!fall) for (const side of ['left', 'right']) if (fallAt[side](item)) seen.push({ side, length: depth, along: 'b' });
        const factory = P.materials[material].factoryEdges || [];
        worktopPieces.push({
          group: G.group, item, name: fall ? 'Panel boczny' : 'Blat', material, a: length, b: depth, n0, n1,
          edges: seen.filter(edge => !factory.includes(edge.side)), factoryEdges: seen.map(edge => edge.side).filter(side => factory.includes(side))
        });
      }
      W.cutouts = [];
    }
    for (const K of carcasses.filter(K => K.base)) {
      for (const flag of CUTOUT_FLAGS.filter(f => K[f])) {
        const cut = (settings.cutouts || {})[flag], W = worktops[K.group];
        if (!cut) { warn(`${K.name}: brak wymiarów wycięcia w settings.cutouts.${flag}.`); continue; }
        if (!W) continue;
        const centre = (K.u0 + K.u1) / 2, u0 = centre - cut.width / 2, u1 = centre + cut.width / 2, n0 = W.n0 + cut.fromBack, n1 = n0 + cut.depth;
        const piece = worktopPieces.find(p => p.group === K.group && p.item.type === 'worktop' && p.item.u0 <= u0 && p.item.u1 >= u1);
        if (!piece) { warn(`${K.name}: wycięcie (${LABELS.hole[flag]}) nie mieści się w jednym blacie.`); continue; }
        if (u0 < K.u0 + board || u1 > K.u1 - board) warn(`${K.name}: ${LABELS.hole[flag]} ${cut.width} szersze niż wnętrze korpusu ${K.u1 - K.u0 - 2 * board}.`);
        if (n0 < carcassBack + board || n1 > carcassFront - board) warn(`${K.name}: ${LABELS.hole[flag]} ${cut.depth} wychodzi poza wnętrze korpusu w głębokości (${n0}–${n1}, wnętrze ${carcassBack + board}–${carcassFront - board}).`);
        const cutout = { kind: flag, width: cut.width, depth: cut.depth, u0, u1, n0, n1, x: u0 - piece.item.u0, y: cut.fromBack, carcassId: K.id };
        W.cutouts.push(cutout);
        piece.holeFrom = { x: 'left', y: 'back' };
        (piece.cutouts || (piece.cutouts = [])).push(cutout);
      }
    }

    if (appliances) fitAppliances(appliances);

    return {
      settings, warnings: issues.map(issue => issue.text), issues, counts, thickness, materials, materialFor, frontThickness, worktopPieces,
      carcassDepth, carcassBack, carcassFront, frontFace, plinthFace, // n: from the wall
      groups, carcasses, fronts, boards, frames, plinths, panels, splashes, plaster, worktops
    };
  }

  /* ================= 6. LISTS AND FILES ================= */

  // parts with the same name, size, ABS edges, lacquer and drilling counted together, one row each:
  //   {name, a, b, qty, where, edges, lacquer, drilling, key}
  //   where = their "at" labels, e.g. "K2, K5 ×2"; edges = ABS edges of one part [{side, length, along}]; lacquer = {long, short} lacquered
  //   edges or null; drilling = drillingOf(part) or null; key = cutKey (the same parts listed elsewhere, e.g. per carcass, find their row by it)
  function cutList(parts) {
    const rows = new Map();
    for (const p of parts) {
      const key = cutKey(p);
      const row = rows.get(key) || { part: p, qty: 0, at: new Map() };
      row.qty++;
      if (p.at) row.at.set(p.at, (row.at.get(p.at) || 0) + 1);
      rows.set(key, row);
    }
    return [...rows].map(([key, { part, qty, at }]) => {
      const where = [...at].map(([label, n]) => (n > 1 ? label + ' ×' + n : label)).join(', ');
      return { name: part.name, a: part.a, b: part.b, qty, where, edges: part.edges || [], lacquer: part.lacquer || null, drilling: drillingOf(part), key };
    });
  }
  const cutKey = p => p.name + '|' + p.a + '|' + p.b + '|' + JSON.stringify(p.edges || []) + '|' + JSON.stringify(p.lacquer || null) + '|' + JSON.stringify(drillingOf(p));

  // what a manufacturer drills or cuts in one part, in part coordinates: {from: {x, y}, hand, holes: [{kind, diameter, depth, x, y}], cutouts: [{kind, width, depth, x, y}]}
  // or null; hand (left | right) tells a left part from a right one with the same pattern (sides, hinge posts, doors): each gets its own row
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

  // where each carcass is and what it is made of; roomPosition(K) adds its place in the room (view.html)
  function carcassMap(model, roomPosition) {
    return model.carcasses.map(K => {
      const entry = {
        carcass: K.name,
        group: K.group,
        cols: K.span > 1 ? [K.col, K.col + K.span - 1] : [K.col],
        x: [K.u0, K.u1],
        y: [K.v0, K.v1],
        z: [model.carcassBack, model.carcassFront],
        size: [K.u1 - K.u0, K.v1 - K.v0, model.carcassDepth],
        type: LABELS.carcassType[K.type],
        flags: K.flags.map(flag => LABELS.flag[flag]),
        members: K.members.map(i => ({ col: i.span > 1 ? [i.col, i.col + i.span - 1] : i.col, tags: tagsLabel([i.type, ...i.tags]), x: [i.u0, i.u1], y: [i.v0, i.v1] })),
        boards: cutList(model.boards.filter(b => b.carcassId === K.id)).map(row => (row.qty > 1 ? row.qty + ' × ' : '') + row.name + ' ' + row.a + ' × ' + row.b),
        legs: K.legs
      };
      if (roomPosition) entry.room = roomPosition(K);
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
    TYPES, TAGS, TAG_NAMES, LABELS, typeLabel, tagsLabel, useLabel, hasTag, FRONT_TYPES, HORIZONTAL_BOARDS, SIDES, HINGE_SIDES,
    placeLabel, gapsText, parseTags, spaceAround, valueAt, PINS_PER_SHELF, tagsOf, readType, cutKey, checkSettings, build, cutList, carcassMap, mapJSON,
    load, designJS, fromDesignJS, plural
  };
})(typeof window !== 'undefined' ? window : globalThis);
