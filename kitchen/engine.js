/* engine.js - builds the kitchen model from design.js for design.html, cost.html and view.html.
   Deterministic: the same project always gives the same model. No drawing, no project numbers: every number comes
   from design.js (rules, columns, components) or from the tables at the top of this file.

   Coordinates in mm per group: u along the group, v up from the floor, n out from the wall; a box is [u0, u1, v0, v1, n0, n1].
   data.columns:    column widths per group, integer mm.
   data.components: group, column (the first one), span (number of columns), height, type (one of TYPES), tags (tags of that type, space separated),
                    carcass (carcass name), handle (T | B | L | R), hinge (hinge side L | R), gaps [left, right, top, bottom] of a front, note. */
(function (root) {
  'use strict';

  /* ================= 1. VOCABULARY: types, tags and what they build ================= */

  // type = what a component is; exactly one per component, it decides what gets built
  //   filler   void / spacer, nothing built (at one end of a carcass: an inset panel closes the carcass front)
  //   board    plasterboard box          plinth   plinth board          worktop  worktop board (fall: turned down)
  //   splash   board on the wall         panel    board laid flat in the front plane
  //   frame    strip on edge in the front plane
  //   cabinet  box with a door           drawer   box with a drawer     oven, micro  built-in appliances
  const TYPES = ['filler', 'board', 'plinth', 'worktop', 'splash', 'panel', 'frame', 'cabinet', 'drawer', 'oven', 'micro'];

  // tag = an extra on a type: it adds to the same build. Each tag is allowed only on the types listed.
  const TAGS = {
    dummy: ['drawer'],       // fixed drawer front: no drawer box
    hob: ['cabinet', 'drawer'], // rails on edge + separation panel under the hob
    sink: ['cabinet', 'drawer'], // rails on edge, no shelves, sink cut-out
    bins: ['drawer'],        // waste-sorting bins in the drawer
    inner: ['drawer'],       // inner cutlery drawer above the drawer box, behind the same front
    fall: ['worktop'],       // worktop fall: the worktop board turned down to the floor
    island: ['worktop'],     // island worktop: the island depth of the worktop material, the island back panel, no wall
    coffee: ['cabinet'],     // pull-out shelf at the bottom, shelves above it, no other shelves
    fridge: ['cabinet'],     // front on a built-in fridge door: no hinges, no shelves, no back
    freezer: ['cabinet'],    // the same, freezer door
    dishwasher: ['cabinet']  // front on a built-in dishwasher door: no carcass, no hinges
  };
  const TAG_NAMES = Object.keys(TAGS);
  const APPLIANCE_TAGS = ['fridge', 'freezer', 'dishwasher']; // a front on an appliance door: at most one per component

  const FRONT_TYPES = ['cabinet', 'drawer'];              // have a front: 4 gaps, a handle
  const BOX_TYPES = [...FRONT_TYPES, 'oven', 'micro'];    // stand in a carcass (need a carcass name, except a dishwasher)
  const BOARD_TYPES = ['worktop', 'splash', 'plinth', 'panel', 'frame', ...FRONT_TYPES]; // each in the types of exactly one material

  // parts the engine adds inside a carcass: the rule that names their material
  const PART_RULES = { carcass: 'carcass.material', back: 'back.material', drawerBox: 'drawers.material', hobPanel: 'rails.hobPanelMaterial' };

  // carcass flags: a carcass has the flag when one of its boxes has one of the tags
  const CARCASS_FLAGS = { sink: ['sink'], hob: ['hob'], fridge: ['fridge', 'freezer'], coffee: ['coffee'] };

  // a carcass on a plinth gets a ventilation grille in the plinth when it holds one of these (air intake for the appliance)
  const GRILLE_FOR = { types: ['oven'], tags: ['fridge', 'freezer'] };
  const VENTED_SHELF_OVER = ['oven']; // a fixed shelf over these types is shallower: rules.shelf.ventGap of air behind it
  const SHELF_UNDER_JOINT = ['oven'];  // a fixed shelf under these types sits below the joint, not centred: the front under it can cover it fully

  // visible names (Polish) of the identifiers above; the code keeps the English identifiers
  const LABELS = {
    type: { filler: 'wypełnienie', board: 'zabudowa GK', plinth: 'cokół', worktop: 'blat', splash: 'panel ścienny', panel: 'panel',
      frame: 'listwa', cabinet: 'szafka', drawer: 'szuflada', oven: 'piekarnik', micro: 'mikrofalówka' },
    tag: { dummy: 'atrapa', hob: 'płyta grzewcza', sink: 'zlew', bins: 'kosze', inner: 'szuflada wewnętrzna', fall: 'bok blatu', island: 'wyspa',
      coffee: 'ekspres', fridge: 'lodówka', freezer: 'zamrażarka', dishwasher: 'zmywarka' },
    carcassType: { base: 'dolna', tall: 'słupek', wall: 'górna' },
    flag: { sink: 'zlew', hob: 'płyta grzewcza', fridge: 'lodówka', coffee: 'ekspres' },
    opening: { door: 'drzwi', drawer: 'szuflada', fixed: 'atrapa', fridge: 'drzwi lodówki', dishwasher: 'drzwi zmywarki' },
    edge: { front: 'przód', top: 'góra', bottom: 'dół', left: 'lewa', right: 'prawa' },
    handle: { T: 'góra', B: 'dół', L: 'lewa', R: 'prawa' },
    part: { carcass: 'korpus', back: 'plecy', drawerBox: 'szuflady', hobPanel: 'przegroda pod płytą' },
    worktopDepth: { worktop: 'blat', island: 'wyspa' },
    hole: { cup: 'puszka zawiasu', plate: 'prowadnik zawiasu', shelfPin: 'podpórka półki', runner: 'prowadnica szuflady / półki wysuwanej', sink: 'wycięcie na zlew', hob: 'wycięcie na płytę grzewczą' },
    // short codes of the holes and cut-outs in the cutting list (its legend explains them)
    holeCode: { cup: 'Z', plate: 'P', shelfPin: 'K', runner: 'S', sink: 'ZL', hob: 'PG' },
    holeFrom: { front: 'od przodu', back: 'od tyłu', bottom: 'od dołu', hinge: 'od krawędzi zawiasów', left: 'od lewego końca' }
  };
  const typeLabel = type => LABELS.type[type] || type;
  const tagsLabel = words => words.map(w => LABELS.type[w] || LABELS.tag[w] || w).join(' ');

  // how a front opens, from its type and tags (first rule that matches)
  function openingOf(item) {
    if (hasTag(item, 'dummy')) return 'fixed';
    if (item.type === 'drawer') return 'drawer';
    if (hasTag(item, 'dishwasher')) return 'dishwasher';
    if (hasTag(item, 'fridge', 'freezer')) return 'fridge';
    return 'door';
  }
  const HINGED = ['door', 'fridge']; // openings with a hinge side (hg); only 'door' gets hinges counted
  const opens = item => FRONT_TYPES.includes(item.type) && openingOf(item) !== 'fixed'; // a front that opens

  const HANDLE_POSITIONS = ['T', 'B', 'L', 'R']; // top, bottom, left, right; "" = no handle
  const HINGE_SIDES = ['L', 'R'];
  const EDGE_NAMES = { T: 'top', B: 'bottom', L: 'left', R: 'right' }; // the four edges of a panel

  // Lacquered edges of the finished parts: how many long and short edges one piece has (they get no ABS), and for a
  // frame which edge (the one facing the room). Fixed here, not in design.js: it follows from how the kitchen is seen
  // (from the front and from above; the island from all sides).
  const LACQUER = {
    front: { long: 2, short: 2 },   // all round
    frame: { long: 1, short: 0 },   // the front edge: FRAME_LACQUERED_SIDES
    plinth: { long: 0, short: 0 }   // none
  };
  const FRAME_LACQUERED_SIDES = ['front']; // the long edge of a frame on edge that faces the room

  // rules the engine reads: a missing one stops the build (checkRules)
  const REQUIRED_RULES = [
    'carcass.depth', 'carcass.wallGap', 'front.shakerRail', 'plinth.setback',
    'rails.depth', 'rails.hobFront', 'rails.hobPanelGap', 'back.inset',
    'shelf.setback', 'shelf.clearance', 'shelf.pins', 'shelf.perDoor', 'shelf.ventGap', 'frame.depth',
    'hinges.fromEnd', 'hinges.supportDepth', 'hinges.aboveShelf', 'hinges.perDoor',
    'drawers.dFrom', 'drawers.D.side', 'drawers.D.back', 'drawers.M.side', 'drawers.M.back',
    'drawers.bottom.inset', 'drawers.bottom.depth', 'drawers.bottom.fromWall', 'drawers.back.inset',
    'drawers.liftAtBottom', 'drawers.liftAbove', 'drawers.inner.gap', 'drawers.inner.back', 'drawers.inner.frontDeduction',
    'legsPerCarcass', 'island.backPanel', 'worktop.overhang',
    'pullOutShelf.depth', 'pullOutShelf.clearance', 'pullOutShelf.lift', 'pullOutShelf.space', 'pullOutShelf.shelvesAbove',
    'plasterboard.depth', 'plasterboard.studSpacing', 'plasterboard.layers',
    'drilling.cup.diameter', 'drilling.cup.depth', 'drilling.cup.fromEdge',
    'drilling.plate.diameter', 'drilling.plate.depth', 'drilling.plate.fromFront', 'drilling.plate.spacing',
    'drilling.shelfPin.diameter', 'drilling.shelfPin.depth', 'drilling.shelfPin.fromFront', 'drilling.shelfPin.fromBack',
    'drilling.shelfPin.belowShelf', 'drilling.shelfPin.extra', 'drilling.shelfPin.pitch',
    'drilling.runner.diameter', 'drilling.runner.depth', 'drilling.runner.fromFront', 'drilling.runner.belowDrawer'
  ];

  // cut-outs in a worktop: the carcass flag that asks for one -> rules.cutouts[flag] {width, depth, fromBack}, centred on the carcass
  const CUTOUT_FLAGS = ['sink', 'hob'];

  /* ================= 2. SMALL HELPERS ================= */

  const valueAt = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));

  // how a component's place is printed (warnings, lists, tooltips): "G1[4]" = group 1, column 4; "G1[1-11]" = columns 1 to 11
  const placeLabel = (group, col, span = 1) => `G${group}[${col}${span > 1 ? '-' + (col + span - 1) : ''}]`;
  const placeOf = item => placeLabel(item.group, item.col, item.span);

  // a per-height table [[maxHeight, count], ...] (ascending): the count of the first row with height <= maxHeight
  const countByHeight = (table, height) => (table.find(([maxHeight]) => height <= maxHeight) || [null, null])[1];

  // the tags field: tag names separated by spaces (the type has its own field)
  function parseTags(text) {
    const words = String(text ?? '').toLowerCase().split(/[\s,]+/).filter(Boolean);
    return { words, tags: words.filter(w => TAG_NAMES.includes(w)), unknown: words.filter(w => !TAG_NAMES.includes(w)) };
  }
  // the tags a type allows (TAGS), in TAG_NAMES order
  const tagsOf = type => TAG_NAMES.filter(tag => TAGS[tag].includes(type));
  const readType = value => { const t = String(value ?? '').trim().toLowerCase(); return TYPES.includes(t) ? t : ''; };

  // the module of a front minus its 4 gaps
  function frontBox(item) {
    const [left, right, top, bottom] = item.gaps;
    return { u0: item.u0 + left, u1: item.u1 - right, v0: item.v0 + bottom, v1: item.v1 - top };
  }

  /* ================= 3. CHECKS THAT STOP THE BUILD: materials and rules ================= */

  // board type or part -> material code: types from materials[code].types, parts from their rule
  function materialUses(rules) {
    const materials = (rules && rules.materials) || {}, materialFor = {}, problems = [];
    for (const [code, m] of Object.entries(materials)) {
      if (!(m.thickness > 0)) problems.push(`Materiał ${code}: grubość musi być > 0.`);
      for (const type of m.types || []) {
        if (!BOARD_TYPES.includes(type)) problems.push(`Materiał ${code}: "${type}" nie jest typem płyty (${BOARD_TYPES.join(', ')}).`);
        else if (materialFor[type]) problems.push(`Typ ${type} jest w dwóch materiałach: ${materialFor[type]} i ${code}.`);
        else materialFor[type] = code;
      }
    }
    for (const type of BOARD_TYPES) if (!materialFor[type]) problems.push(`Żaden materiał nie ma typu ${type}.`);
    for (const [part, path] of Object.entries(PART_RULES)) {
      const code = valueAt(rules, path);
      if (materials[code]) materialFor[part] = code;
      else problems.push(`Reguła ${path}: materiału "${code ?? ''}" nie ma w materiałach.`);
    }
    const frontThicknesses = new Set(FRONT_TYPES.filter(t => materialFor[t]).map(t => materials[materialFor[t]].thickness));
    if (frontThicknesses.size > 1) problems.push(`Materiały frontów (${FRONT_TYPES.join(', ')}) muszą mieć jedną grubość: płaszczyzna frontów.`);
    return { materialFor, problems };
  }

  // problems in design.js rules that make a build impossible; design.html lists them, build() throws them
  function checkRules(rules) {
    const problems = [...materialUses(rules).problems];
    for (const path of REQUIRED_RULES) if (valueAt(rules, path) === undefined) problems.push(`Brak reguły ${path}.`);
    for (const path of ['shelf.perDoor', 'hinges.perDoor']) {
      const table = valueAt(rules, path);
      if (table !== undefined && !(Array.isArray(table) && table.every(row => Array.isArray(row) && row.length === 2))) {
        problems.push(`Reguła ${path} musi być tabelą [[maxHeight, count], ...].`);
      }
    }
    const hingeTable = valueAt(rules, 'hinges.perDoor');
    if (Array.isArray(hingeTable) && hingeTable.some(row => !(row[1] >= 2))) problems.push('Reguła hinges.perDoor: każde drzwi potrzebują co najmniej 2 zawiasów.');
    return problems;
  }

  /* ================= 4. LAYOUT: components -> items stacked in their columns ================= */

  // design.js component -> item fields
  function readComponent(c, index) {
    return {
      index,
      group: +c.group,
      col: +c.column,
      span: +c.span,
      height: c.height,
      type: readType(c.type),
      tags: parseTags(c.tags).tags,
      carcassName: String(c.carcass || '').trim(),
      handle: c.handle || '',
      hinge: c.hinge || '',
      gaps: Array.isArray(c.gaps) ? c.gaps.map(x => (x === '' || x == null ? NaN : Number(x))) : null, // an empty gap is not 0
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

  function build(project) {
    const P = project || {}, rules = P.rules || {};
    const stops = checkRules(rules);
    if (stops.length) throw new Error('Reguły w design.js: ' + stops.join(' '));

    // every thickness comes from the material of the type or part
    const { materialFor } = materialUses(rules);
    const thickness = Object.fromEntries(Object.entries(materialFor).map(([use, code]) => [use, rules.materials[code].thickness]));
    // label of each material: name + thickness, e.g. "Chipboard Egger U963 ST9 diamond grey 18"
    const materials = Object.fromEntries(Object.entries(rules.materials).map(([code, m]) => [code, { ...m, label: m.name + ' ' + m.thickness }]));
    const board = thickness.carcass, half = board / 2, frontThickness = thickness.cabinet, carcassDepth = rules.carcass.depth;
    // depths from the wall (n)
    const carcassBack = rules.carcass.wallGap;
    const carcassFront = carcassBack + carcassDepth;
    const frontFace = carcassFront + frontThickness;
    const plinthFace = frontFace - rules.plinth.setback;

    // issues: { index of the component, text, skipped }; warnings: their texts
    const issues = [], warnings = [];
    const warn = (text, index = null, skipped = false) => {
      issues.push({ index, text, skipped });
      warnings.push(text);
    };
    const groups = {}, carcasses = [], fronts = [], boards = [];
    const frames = [], plinths = [], panels = [], plaster = [], worktops = {};
    // engine counts, used by cost.html as {n:name}; type and tag: items per type / tag ({n:type.oven}, {n:tag.bins})
    const counts = {
      carcasses: 0, floorCarcasses: 0, wallFixedCarcasses: 0, fronts: 0, handles: 0, hinges: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0,
      plasterUD: 0, plasterCD: 0, plasterEdge: 0, plinthHeight: 0, drillHoles: 0, cupHoles: 0, cutouts: 0, type: {}, tag: {}
    };

    // ---- components: checks on one component; what cannot be placed is skipped ----
    const columns = P.columns || {}, pieces = [];
    (P.components || []).forEach((c, index) => {
      const piece = readComponent(c, index), parsed = parseTags(c.tags), at = placeOf(piece);
      if (!(String(c.group) in columns)) return warn(`${at}: grupa ${c.group} nie ma kolumn - pominięty.`, index, true);
      if (!Number.isInteger(piece.height)) return warn(`${at}: wysokość "${c.height}" musi być całkowitą liczbą mm - pominięty.`, index, true);
      if (!piece.type) {
        return warn(`${at}: ${String(c.type ?? '').trim() ? 'nieznany typ "' + c.type + '"' : 'brak typu'}; typ musi być jednym z: ${TYPES.map(typeLabel).join(', ')} - pominięty.`, index, true);
      }
      if (APPLIANCE_TAGS.filter(tag => parsed.tags.includes(tag)).length > 1) warn(`${at}: tagi ${tagsLabel(APPLIANCE_TAGS)} wykluczają się.`, index);
      for (const tag of parsed.tags) if (!TAGS[tag].includes(piece.type)) warn(`${at}: tag ${tagsLabel([tag])} jest tylko dla: ${TAGS[tag].map(typeLabel).join(', ')}.`, index);
      if (parsed.unknown.length) warn(`${at}: nieznany tag ${parsed.unknown.join(', ')} (dla typu ${typeLabel(piece.type)}: ${tagsOf(piece.type).map(t => LABELS.tag[t]).join(', ') || 'brak tagów'}).`, index);
      const isFront = FRONT_TYPES.includes(piece.type);
      if (piece.handle && !isFront) warn(`${at}: ${typeLabel(piece.type)} nie może mieć uchwytu.`, index);
      else if (piece.handle && !HANDLE_POSITIONS.includes(piece.handle)) warn(`${at}: uchwyt "${piece.handle}" musi być jednym z ${HANDLE_POSITIONS.join(', ')}.`, index);
      if (hasTag(piece, 'dishwasher') && piece.carcassName) warn(`${at}: zmywarka nie ma korpusu - usuń nazwę korpusu ${piece.carcassName}.`, index);
      if (isFront) {
        if (!piece.gaps || piece.gaps.length !== 4 || piece.gaps.some(x => !Number.isFinite(x))) {
          warn(`${at}: ${typeLabel(piece.type)} potrzebuje 4 szczelin [lewa, prawa, góra, dół] - narysowano bez szczelin.`, index);
          piece.gaps = [0, 0, 0, 0];
        } else if (!piece.gaps.every(Number.isInteger)) {
          warn(`${at}: szczeliny [${piece.gaps.join(', ')}] muszą być całkowitymi mm.`, index);
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
        // a board seen on edge must be as thick as its material: worktop (fall: its width), frame (its narrow side)
        const width = item.u1 - item.u0, height = item.v1 - item.v0;
        const [part, size, what] = item.type === 'worktop' ? ['worktop', hasTag(item, 'fall') ? width : height, hasTag(item, 'fall') ? 'szerokość' : 'wysokość']
          : item.type === 'frame' ? ['frame', Math.min(width, height), height > width ? 'szerokość' : 'wysokość'] : [];
        if (part && size !== thickness[part]) warn(`${placeOf(item)}: ${typeLabel(item.type)} - ${what} ${size} nie zgadza się z materiałem ${materials[materialFor[part]].label}.`, item.index);
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
      K.legs = K.floor ? rules.legsPerCarcass : 0;
      K.grille = K.floor && K.boxes.some(b => GRILLE_FOR.types.includes(b.type) || hasTag(b, ...GRILLE_FOR.tags));
      for (const item of K.members) item.carcass = K;
      counts.legs += K.legs;
      counts.floorCarcasses += K.floor;
      counts.wallFixedCarcasses += K.floor && !groups[K.group].island; // the island stands free
      counts.sinks += K.sink;
      counts.hobs += K.hob;
      counts.fridges += K.fridge;
      counts.grilles += K.grille;
    });
    counts.carcasses = carcasses.length;

    // ---- carcass boards ----
    // id: kind of board, the same for all sizes (colours and counts on the pages); a, b: size; box: place;
    // edges: ABS edges [[side, length]] - the edge seen from the front; hidden parts get none
    const addBoard = b => {
      boards.push(b);
      return b;
    };
    const rails = rules.rails, shelf = rules.shelf, back = rules.back;
    for (const K of carcasses) {
      const { u0, u1, v0, v1 } = K;
      const width = u1 - u0, height = v1 - v0;
      const innerU0 = u0 + board, innerU1 = u1 - board, innerWidth = width - 2 * board;
      const carcassMaterial = materialFor.carcass;
      const part = (id, name, a, b, material, layer, box, edges = []) => addBoard({ id, name, a, b, material, layer, group: K.group, carcassId: K.id, box, edges });
      const frontEdge = length => [['front', length]];
      const bottomEdge = [['bottom', innerWidth]]; // a rail on edge shows its bottom edge when the drawer below is open

      part('side', 'Bok', carcassDepth, height, carcassMaterial, 'carcasses', [u0, innerU0, v0, v1, carcassBack, carcassFront], frontEdge(height));
      part('side', 'Bok', carcassDepth, height, carcassMaterial, 'carcasses', [innerU1, u1, v0, v1, carcassBack, carcassFront], frontEdge(height));
      part('bottom', 'Wieniec dolny', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v0, v0 + board, carcassBack, carcassFront], frontEdge(innerWidth));

      // top: a base carcass has 2 top rails (flat; on edge under a sink or a hob), any other carcass a top panel
      const railName = 'Trawers ' + rails.depth;
      if (K.base && K.sink) {
        // the rails stand on edge to clear the bowl
        part('rail', railName + ' przedni, na sztorc', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassFront - board, carcassFront], bottomEdge);
        part('rail', railName + ' tylny, na sztorc', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
      } else if (K.base && K.hob) {
        // front rail on edge (hobFront high), rear rail on edge, separation panel below the front rail with an air gap at the back
        part('rail', 'Trawers ' + rails.hobFront + ' przedni, na sztorc', innerWidth, rails.hobFront, carcassMaterial, 'carcasses',
          [innerU0, innerU1, v1 - rails.hobFront, v1, carcassFront - board, carcassFront], bottomEdge);
        part('rail', railName + ' tylny, na sztorc', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
        part('hobPanel', 'Przegroda pod płytą', innerWidth, carcassDepth - 2 * board - rails.hobPanelGap, materialFor.hobPanel, 'carcasses',
          [innerU0, innerU1, v1 - rails.hobFront, v1 - rails.hobFront + thickness.hobPanel, carcassBack + board + rails.hobPanelGap, carcassFront - board]);
      } else if (K.base) {
        part('rail', railName + ' przedni', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassFront - rails.depth, carcassFront], frontEdge(innerWidth));
        part('rail', railName + ' tylny', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassBack + rails.depth]);
      } else {
        part('top', 'Wieniec górny', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassFront], frontEdge(innerWidth));
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

      // fixed shelf at each joint of 2 boxes, full carcass depth; not in a base carcass (rails), not in a fridge carcass (ventilation);
      // over a VENTED_SHELF_OVER box (oven) it is rules.shelf.ventGap shallower, the gap at the back lets the hot air out;
      // under a SHELF_UNDER_JOINT box (oven) it sits below the joint
      if (!K.base && !K.fridge) {
        const joints = [...new Set(K.boxes.map(b => b.v0))].filter(joint => joint > v0);
        for (const joint of joints) {
          const vented = K.boxes.some(b => b.v1 === joint && VENTED_SHELF_OVER.includes(b.type)), gap = vented ? rules.shelf.ventGap : 0;
          const top = K.boxes.some(b => b.v0 === joint && SHELF_UNDER_JOINT.includes(b.type)) ? joint : joint + half;
          part('fixedShelf', 'Półka stała', innerWidth, carcassDepth - gap, carcassMaterial, 'shelves', [innerU0, innerU1, top - board, top, carcassBack + gap, carcassFront], frontEdge(innerWidth));
          counts.shelvesFixed++;
        }
      }

      // a filler at one end of a carcass (e.g. the hidden end of an L corner): the carcass runs on behind it and an inset panel
      // closes its front - carcass material, from the last box to the far side, between the bottom and the top board,
      // at the carcass front, touching the panel in front of it; hidden: no ABS
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
          [shelfU0, shelfU0 + shelfWidth, centre - half, centre + half, carcassBack, carcassFront - shelf.setback], frontEdge(shelfWidth)).centre = centre;
        counts.shelvesAdjustable++;
        counts.shelfPins += shelf.pins;
      };
      if (K.coffee) {
        // pull-out shelf at the bottom; the first shelf pullOutShelf.space above it, the rest evenly up to the top
        const pullOut = rules.pullOutShelf, y = v0 + board + pullOut.lift, shelfWidth = innerWidth - 2 * pullOut.clearance;
        part('pullOutShelf', 'Półka wysuwana', shelfWidth, pullOut.depth, carcassMaterial, 'shelves',
          [innerU0 + pullOut.clearance, innerU1 - pullOut.clearance, y, y + board, carcassFront - pullOut.depth, carcassFront], frontEdge(shelfWidth));
        counts.pullOutShelves++;
        const lo = y + board + pullOut.space, hi = v1 - board;
        for (let j = 0; j < pullOut.shelvesAbove; j++) adjustableShelf(Math.round(lo + ((hi - lo) * j) / pullOut.shelvesAbove));
      } else if (!K.sink && !K.fridge) {
        // per door, by its front height (rules.shelf.perDoor), evenly between the boards above and below the door
        for (const b of K.boxes) {
          if (b.type !== 'cabinet') continue;
          const lo = b.v0 === v0 ? v0 + board : b.v0 + half;
          const hi = b.v1 === v1 ? v1 - board : b.v1 - half;
          const frontHeight = frontBox(b).v1 - frontBox(b).v0, count = countByHeight(shelf.perDoor, frontHeight);
          if (count === null) { warn(`${placeOf(b)}: wysokość frontu ${frontHeight} przekracza ostatni wiersz rules.shelf.perDoor.`, b.index); continue; }
          for (let j = 1; j <= count; j++) adjustableShelf(Math.round(lo + ((hi - lo) * j) / (count + 1)));
        }
      }
    }

    // ---- frames (with a back strip outside a carcass), panels, plinths, plasterboard ----
    const frameRule = rules.frame, plasterRule = rules.plasterboard;
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        const { u0, u1, v0, v1 } = item, width = u1 - u0, height = v1 - v0;
        if (item.type === 'frame') {
          frames.push({
            group: G.group, item, material: materialFor.frame, box: [u0, u1, v0, v1, frontFace - frameRule.depth, frontFace],
            name: (height > width ? 'Listwa ' : 'Listwa pozioma ') + thickness.frame + ' na sztorc (gł. ' + frameRule.depth + ')',
            a: frameRule.depth, b: Math.max(width, height),
            lacquer: LACQUER.frame, lacqueredSides: FRAME_LACQUERED_SIDES
          });
          if (!item.carcassName) {
            addBoard({
              id: 'backStrip', name: 'Listwa tylna ' + frameRule.depth, a: frameRule.depth, b: Math.max(width, height), material: materialFor.carcass, layer: 'carcasses',
              group: G.group, col: item.col, box: [u0, u1, v0, v1, carcassBack, carcassBack + frameRule.depth], strip: true, edges: [] // hidden behind its frame
            });
          }
        } else if (item.type === 'panel') {
          // an edge shows when the front next to it opens: ABS on each edge whose neighbour (touching, overlapping) is a front that opens
          const overlaps = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0;
          const neighbour = {
            L: o => o.u1 === item.u0 && overlaps(o.v0, o.v1, item.v0, item.v1), R: o => o.u0 === item.u1 && overlaps(o.v0, o.v1, item.v0, item.v1),
            T: o => o.v0 === item.v1 && overlaps(o.u0, o.u1, item.u0, item.u1), B: o => o.v1 === item.v0 && overlaps(o.u0, o.u1, item.u0, item.u1)
          };
          const edges = Object.keys(EDGE_NAMES)
            .filter(side => G.items.some(other => opens(other) && neighbour[side](other)))
            .map(side => [EDGE_NAMES[side], side === 'T' || side === 'B' ? width : height]);
          panels.push({ group: G.group, item, material: materialFor.panel, name: 'Panel ' + thickness.panel, a: width, b: height, box: [u0, u1, v0, v1, frontFace - thickness.panel, frontFace], edges });
        } else if (item.type === 'plinth') {
          plinths.push({ group: G.group, item, material: materialFor.plinth, a: height, b: width, box: [u0, u1, v0, v1, plinthFace - thickness.plinth, plinthFace], lacquer: LACQUER.plinth });
          counts.plinthHeight = Math.max(counts.plinthHeight, height);
        } else if (item.type === 'board') {
          // cladding: the face plus the return along the long side; profiles: UD on both fixed edges, CD on the outer edge + cross pieces
          const long = Math.max(width, height), short = Math.min(width, height), depth = plasterRule.depth;
          plaster.push(
            { group: G.group, item, name: 'Płyta GK - czoło', a: short, b: long },
            { group: G.group, item, name: 'Płyta GK - bok', a: depth, b: long }
          );
          counts.plasterUD += 2 * long;
          counts.plasterCD += long + (Math.ceil(long / plasterRule.studSpacing) + 1) * (depth + short);
          counts.plasterEdge += long; // one outer edge (corner bead) and one joint to the furniture (seal) per box
        }
      }
    }

    // ---- worktops: depth from the worktop material (island: its island depth); behind the carcass = depth - carcass - front - overhang ----
    for (const G of Object.values(groups)) {
      const top = G.items.find(i => i.type === 'worktop' && !hasTag(i, 'fall')); // the top board, not a worktop fall
      if (!G.items.some(i => i.type === 'worktop')) continue;
      if (!top) {
        warn(`Grupa ${G.group}: boki blatu bez blatu na górze.`);
        continue;
      }
      const kind = G.island ? 'island' : 'worktop', depth = (rules.materials[materialFor.worktop].depth || {})[kind];
      if (!Number.isFinite(depth)) {
        warn(`Grupa ${G.group}: materiał blatu nie ma głębokości dla: ${LABELS.worktopDepth[kind]}.`);
        continue;
      }
      const behind = depth - carcassDepth - frontThickness - rules.worktop.overhang;
      if (behind < 0) warn(`Grupa ${G.group}: blat ${depth} jest krótszy niż korpus + front + nawis (${carcassDepth + frontThickness + rules.worktop.overhang}).`);
      worktops[G.group] = { n0: carcassBack - behind, n1: frontFace + rules.worktop.overhang, depth, back: behind, v0: top.v0, v1: top.v1, thickness: thickness.worktop };
    }

    // ---- island back panel: panel material, between the end columns, floor to the carcass tops, on the carcass backs ----
    if (rules.island.backPanel) {
      for (const G of Object.values(groups).filter(G => G.island)) {
        const firstWidth = G.widths[0] || 0, lastWidth = G.widths[G.widths.length - 1] || 0;
        const top = Math.max(0, ...carcasses.filter(K => K.group === G.group).map(K => K.v1));
        panels.push({
          group: G.group, material: materialFor.panel, name: 'Panel tylny wyspy ' + thickness.panel, a: G.length - firstWidth - lastWidth, b: top, edges: [],
          box: [firstWidth, G.length - lastWidth, 0, top, carcassBack - thickness.panel, carcassBack]
        });
      }
    }

    // ---- fronts, hinges, hinge posts, drawer boxes ----
    const hingeRule = rules.hinges, drawerRule = rules.drawers;
    // a hinge that meets a shelf (closer than half a board + hinges.aboveShelf to its centre) goes above it: to the lowest height
    // at least hinges.aboveShelf over the shelf where its mounting-plate holes miss every shelf-pin hole (rules.drilling)
    function hingeClearOfShelves(v, K, front, item) {
      const plate = rules.drilling.plate, pin = rules.drilling.shelfPin;
      const shelves = boards.filter(b => b.carcassId === K.id && (b.id === 'adjustableShelf' || b.id === 'pullOutShelf'))
        .map(b => (b.box[2] + b.box[3]) / 2).filter(c => c > front.v0 && c < front.v1);
      const reach = half + hingeRule.aboveShelf;
      const hit = shelves.find(c => Math.abs(v - c) < reach);
      if (hit === undefined) return v;
      const samePinLine = [pin.fromFront, carcassDepth - pin.fromBack].includes(plate.fromFront);
      const pinRows = samePinLine ? shelves.flatMap(c => { const m = c - half - pin.belowShelf; return Array.from({ length: 2 * pin.extra + 1 }, (_, k) => m + (k - pin.extra) * pin.pitch); }) : [];
      const clear = h => shelves.every(c => Math.abs(h - c) >= reach) &&
        [h - plate.spacing / 2, h + plate.spacing / 2].every(y => pinRows.every(p => Math.abs(y - p) >= (plate.diameter + pin.diameter) / 2 + 1));
      let h = Math.ceil(hit + reach);
      while (!clear(h) && h < front.v1) h++;
      if (h > front.v1 - hingeRule.fromEnd / 2) warn(`${placeOf(item)}: zawias nad półką wychodzi poza drzwi - przesuń półkę.`, item.index);
      return h;
    }
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        if (!FRONT_TYPES.includes(item.type)) continue;
        const box = frontBox(item), K = item.carcass, opening = openingOf(item), hinged = HINGED.includes(opening);
        if (box.u1 - box.u0 <= 0 || box.v1 - box.v0 <= 0) warn(`${placeOf(item)}: szczeliny nie zostawiają frontu.`, item.index);
        // hinges are screwed to a carcass side: when the door does not reach one on its hinge side, a hinge post is added there
        // (carcass material, hinges.supportDepth deep at the carcass front, as high as the door inside the carcass)
        if (hinged && K && HINGE_SIDES.includes(item.hinge) && (item.hinge === 'L' ? item.u0 !== K.u0 : item.u1 !== K.u1)) {
          const postU0 = item.hinge === 'L' ? item.u0 : item.u1 - board, postV0 = Math.max(item.v0, K.v0 + board), postV1 = Math.min(item.v1, K.v1 - board);
          addBoard({
            id: 'hingePost', name: 'Słupek zawiasowy', a: hingeRule.supportDepth, b: postV1 - postV0, material: materialFor.carcass, layer: 'carcasses', group: G.group, carcassId: K.id,
            box: [postU0, postU0 + board, postV0, postV1, carcassFront - hingeRule.supportDepth, carcassFront], edges: [['front', postV1 - postV0]]
          });
        }
        const front = {
          id: fronts.length + 1, group: G.group, item, carcassId: K ? K.id : null, opening, tags: item.tags, gaps: item.gaps,
          ...box, width: box.u1 - box.u0, height: box.v1 - box.v0, handle: item.handle, hingeSide: hinged ? item.hinge : '', material: materialFor[item.type],
          lacquer: LACQUER.front
        };
        item.front = front;
        fronts.push(front);
        counts.fronts++;
        if (item.handle) counts.handles++;

        // hinges of a door: count by its front height (rules.hinges.perDoor), hinges.fromEnd from the ends, evenly between
        if (opening === 'door' && K) {
          const count = countByHeight(hingeRule.perDoor, front.height);
          if (count === null) warn(`${placeOf(item)}: wysokość frontu ${front.height} przekracza ostatni wiersz rules.hinges.perDoor.`, item.index);
          else {
            front.hinges = Array.from({ length: count }, (_, j) => Math.round(front.v0 + hingeRule.fromEnd + ((front.height - 2 * hingeRule.fromEnd) * j) / (count - 1)))
              .map(v => hingeClearOfShelves(v, K, front, item));
            front.hingeU = front.hingeSide === 'R' ? item.u1 - board : item.u0 + board; // on the carcass side or the hinge post
            counts.hinges += count;
          }
        }

        // drawer box: D when the front is higher than drawers.dFrom, else M; bottom and back in rules.drawers.material
        if (opening === 'drawer' && K) {
          const size = front.height > drawerRule.dFrom ? 'D' : 'M', sizeRule = drawerRule[size];
          const innerU0 = K.u0 + board, innerU1 = K.u1 - board;
          const drawer = {
            size,
            sideHeight: sizeRule.side,
            backHeight: sizeRule.back,
            innerU0,
            innerU1,
            bottomWidth: innerU1 - innerU0 - drawerRule.bottom.inset,
            bottomV: item.v0 + (item.v0 === K.v0 ? drawerRule.liftAtBottom : drawerRule.liftAbove),
            bins: hasTag(item, 'bins'),
            inner: hasTag(item, 'inner')
          };
          front.drawer = drawer;
          const bottomU0 = innerU0 + drawerRule.bottom.inset / 2, bottomU1 = innerU1 - drawerRule.bottom.inset / 2;
          const backU0 = innerU0 + drawerRule.back.inset / 2, backU1 = innerU1 - drawerRule.back.inset / 2;
          const n0 = drawerRule.bottom.fromWall, n1 = n0 + drawerRule.bottom.depth, t = thickness.drawerBox;
          const drawerBoards = (v, backHeight, backName, inner) => {
            const common = { material: materialFor.drawerBox, layer: 'drawers', group: G.group, carcassId: K.id, frontId: front.id, inner };
            addBoard({ id: 'drawerBottom', name: 'Dno szuflady', a: drawer.bottomWidth, b: drawerRule.bottom.depth, ...common, box: [bottomU0, bottomU1, v, v + t, n0, n1] });
            addBoard({ id: 'drawerBack', name: backName, a: innerU1 - innerU0 - drawerRule.back.inset, b: backHeight, ...common, box: [backU0, backU1, v + t, v + t + backHeight, n0, n0 + t] });
          };
          drawerBoards(drawer.bottomV, drawer.backHeight, 'Tył szuflady ' + size, false);
          if (size === 'D') counts.drawersD++;
          else counts.drawersM++;
          if (drawer.inner) {
            // inner drawer M above the drawer box, behind the same front
            drawer.innerV = drawer.bottomV + drawer.sideHeight + drawerRule.inner.gap;
            drawerBoards(drawer.innerV, drawerRule.inner.back, 'Tył szuflady wewnętrznej', true);
            counts.innerDrawers++;
          }
        }
      }
    }

    // ---- holes: hinge cups in the doors, mounting plates and shelf pins in the carcass sides and hinge posts ----
    // a hole: kind, diameter, depth, x / y on the part (from the edges in part.holeFrom), u / v / n of its centre on the drilled face,
    // axis it is drilled along and dir (+1 / -1) into the part
    const drill = rules.drilling;
    const holeAt = (part, hole) => {
      (part.holes || (part.holes = [])).push(hole);
      return hole;
    };
    for (const K of carcasses) {
      const own = boards.filter(b => b.carcassId === K.id);
      // horizontal boards of the carcass: a shelf pin must not land in one
      const bands = own.filter(b => ['bottom', 'top', 'rail', 'fixedShelf', 'hobPanel'].includes(b.id)).map(b => [b.box[2], b.box[3]]);
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
        // hinge cups: in the back of the door, cup.fromEdge from its hinge edge
        front.holeFrom = { x: 'hinge', y: 'bottom' };
        const cupU = front.hingeSide === 'L' ? front.u0 + drill.cup.fromEdge : front.u1 - drill.cup.fromEdge;
        for (const v of front.hinges) {
          holeAt(front, { kind: 'cup', diameter: drill.cup.diameter, depth: drill.cup.depth, x: drill.cup.fromEdge, y: v - front.v0,
            u: cupU, v, n: frontFace - frontThickness, axis: 'n', dir: 1 });
          counts.cupHoles++;
        }
      }
      // shelf pins: under each adjustable shelf, in both sides, at fromFront and fromBack; extra rows pitch above and below
      const pin = drill.shelfPin, sides = own.filter(b => b.id === 'side');
      for (const shelfBoard of own.filter(b => b.id === 'adjustableShelf')) {
        const main = shelfBoard.centre - half - pin.belowShelf;
        const rows = [main];
        for (let k = 1; k <= pin.extra; k++) rows.push(main - k * pin.pitch, main + k * pin.pitch);
        const clear = y => bands.every(([b0, b1]) => y + pin.diameter / 2 < b0 || y - pin.diameter / 2 > b1) && y > K.v0 && y < K.v1;
        for (const y of rows.filter((y, i) => i === 0 || clear(y))) {
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
      for (const bottom of runnerRows) {
        for (const side of sides) {
          side.holeFrom = { x: 'front', y: 'bottom' };
          const inner = side.box[0] === K.u0 ? side.box[1] : side.box[0], dir = side.box[0] === K.u0 ? -1 : 1, y = bottom - runner.belowDrawer;
          for (const x of runner.fromFront) holeAt(side, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x, y: y - side.box[2], u: inner, v: y, n: carcassFront - x, axis: 'u', dir });
        }
      }
      // holes too close on one face of one part; a hole in a horizontal board (once per kind and carcass)
      const boardHits = new Set();
      for (const b of own.filter(b => b.holes)) {
        b.holes.sort((h, g) => h.y - g.y || h.x - g.x);
        const near = (h, g) => Math.hypot(g.x - h.x, g.y - h.y) < (g.diameter + h.diameter) / 2 + 1;
        const pairs = b.holes.flatMap((h, i) => b.holes.slice(i + 1).filter(g => near(h, g)).map(g => [h, g]));
        // a hole in a side or a hinge post must not land where a horizontal board meets it
        const inBoard = b.holes.find(h => h.axis === 'u' && bands.some(([b0, b1]) => h.v + h.diameter / 2 > b0 && h.v - h.diameter / 2 < b1));
        if (inBoard && !boardHits.has(inBoard.kind)) (boardHits.add(inBoard.kind), warn(`${K.name}: ${b.name.toLowerCase()} - ${LABELS.hole[inBoard.kind]} trafia w płytę poziomą (${inBoard.x} od przodu, ${Math.round(inBoard.y)} od dołu): sprawdź reguły drilling.`));
        for (const [h, g] of pairs.filter(([h, g], i) => pairs.findIndex(([h2, g2]) => h2.kind === h.kind && g2.kind === g.kind) === i)) {
          warn(`${K.name}: ${b.name.toLowerCase()} - ${LABELS.hole[h.kind]} i ${LABELS.hole[g.kind]} w tym samym miejscu (${h.x} od przodu, ${Math.round(h.y)} od dołu): przesuń półkę albo zawias.`);
        }
        counts.drillHoles += b.holes.length;
      }
    }

    // ---- worktop pieces and their cut-outs (sink, hob): rules.cutouts[flag], centred on the carcass, fromBack from the worktop back edge ----
    const worktopPieces = [];
    for (const G of Object.values(groups)) {
      const W = worktops[G.group];
      if (!W) continue;
      for (const item of G.items.filter(i => i.type === 'worktop')) {
        const fall = hasTag(item, 'fall');
        worktopPieces.push({ group: G.group, item, name: fall ? 'Bok blatu' : 'Blat', material: materialFor.worktop, a: fall ? item.v1 - item.v0 : item.u1 - item.u0, b: W.depth, edges: [] });
      }
      W.cutouts = [];
    }
    for (const K of carcasses.filter(K => K.base)) {
      for (const flag of CUTOUT_FLAGS.filter(f => K[f])) {
        const cut = (rules.cutouts || {})[flag], W = worktops[K.group];
        if (!cut) { warn(`${K.name}: brak wymiarów wycięcia w rules.cutouts.${flag}.`); continue; }
        if (!W) continue;
        const centre = (K.u0 + K.u1) / 2, u0 = centre - cut.width / 2, u1 = centre + cut.width / 2, n0 = W.n0 + cut.fromBack, n1 = n0 + cut.depth;
        const piece = worktopPieces.find(p => p.group === K.group && !hasTag(p.item, 'fall') && p.item.u0 <= u0 && p.item.u1 >= u1);
        if (!piece) { warn(`${K.name}: wycięcie (${LABELS.hole[flag]}) nie mieści się w jednym blacie.`); continue; }
        if (u0 < K.u0 + board || u1 > K.u1 - board) warn(`${K.name}: ${LABELS.hole[flag]} ${cut.width} szersze niż wnętrze korpusu ${K.u1 - K.u0 - 2 * board}.`);
        if (n1 > W.n1) warn(`${K.name}: ${LABELS.hole[flag]} wychodzi poza przód blatu.`);
        const cutout = { kind: flag, width: cut.width, depth: cut.depth, u0, u1, n0, n1, x: u0 - piece.item.u0, y: cut.fromBack, carcassId: K.id };
        W.cutouts.push(cutout);
        piece.holeFrom = { x: 'left', y: 'back' };
        (piece.cutouts || (piece.cutouts = [])).push(cutout);
        counts.cutouts++;
      }
    }

    return {
      rules, warnings, issues, counts, thickness, materials, materialFor, frontThickness, worktopPieces,
      carcassDepth, carcassBack, carcassFront, frontFace, plinthFace, // n: from the wall
      groups, carcasses, fronts, boards, frames, plinths, panels, plaster, worktops
    };
  }

  /* ================= 6. LISTS AND FILES ================= */

  // parts with the same name, size, ABS edges and lacquer counted together: [name, a, b, qty, where, edges, lacquer];
  // where = their "at" labels, e.g. "K2, K5 ×2"; edges = ABS edges of one part [[side, length]]; lacquer = {long, short} lacquered edges
  function cutList(parts) {
    const rows = new Map();
    for (const p of parts) {
      const key = p.name + '|' + p.a + '|' + p.b + '|' + JSON.stringify(p.edges || []) + '|' + JSON.stringify(p.lacquer || null) + '|' + JSON.stringify(drillingOf(p));
      const row = rows.get(key) || { qty: 0, at: new Map() };
      row.qty++;
      if (p.at) row.at.set(p.at, (row.at.get(p.at) || 0) + 1);
      rows.set(key, row);
    }
    return [...rows].map(([key, row]) => {
      const [name, a, b, edges, lacquer, drilling] = key.split('|');
      const where = [...row.at].map(([label, n]) => (n > 1 ? label + ' ×' + n : label)).join(', ');
      return [name, Number(a), Number(b), row.qty, where, JSON.parse(edges), JSON.parse(lacquer), JSON.parse(drilling)];
    });
  }

  // what a manufacturer drills or cuts in one part, in part coordinates: {from: {x, y}, holes: [[kind, diameter, depth, x, y]], cutouts: [[kind, width, depth, x, y]]}
  // or null; mirrored parts (a left and a right side with the same pattern) give the same value, so they share a cut-list row
  function drillingOf(part) {
    if (!part.holes && !part.cutouts) return null;
    const r = x => Math.round(x * 10) / 10;
    return {
      from: part.holeFrom,
      holes: (part.holes || []).map(h => [h.kind, h.diameter, h.depth, r(h.x), r(h.y)]).sort((p, q) => p[0].localeCompare(q[0]) || p[4] - q[4] || p[3] - q[3]),
      cutouts: (part.cutouts || []).map(c => [c.kind, c.width, c.depth, r(c.x), r(c.y)])
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
        boards: cutList(model.boards.filter(b => b.carcassId === K.id)).map(([name, a, b, qty]) => (qty > 1 ? qty + ' × ' : '') + name + ' ' + a + ' × ' + b),
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

  // the text of design.js: one rule / note / component per line, a blank line between groups
  function designJS(project) {
    const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
    // a table (an object of objects, e.g. rules.materials) gets one line per entry
    const value = v => (isObject(v) && Object.values(v).every(isObject)
      ? '{\n' + Object.entries(v).map(([k, x]) => '   ' + json1(k) + ': ' + json1(x)).join(',\n') + '\n  }'
      : json1(v));
    const entries = obj => Object.entries(obj || {}).map(([k, v]) => '  ' + json1(k) + ': ' + value(v)).join(',\n');
    const components = project.components.map((c, i) => (i && c.group !== project.components[i - 1].group ? '\n' : '') + '  ' + json1(c)).join(',\n');
    return '/* Kitchen project design - shared by design.html, cost.html and view.html.\n' +
      '   Plain JSON after "window.KITCHEN_DESIGN =". Edit it in design.html (Import data / Export data). */\n' +
      'window.KITCHEN_DESIGN = {\n "rules": {\n' + entries(project.rules) +
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
    TYPES, TAGS, TAG_NAMES, LABELS, typeLabel, tagsLabel, FRONT_TYPES, BOX_TYPES, BOARD_TYPES, PART_RULES, CARCASS_FLAGS, GRILLE_FOR, VENTED_SHELF_OVER, SHELF_UNDER_JOINT, LACQUER,
    HANDLE_POSITIONS, HINGE_SIDES, placeLabel, parseTags, tagsOf, readType, openingOf, drillingOf, checkRules, build, cutList, carcassMap, mapJSON,
    load, designJS, fromDesignJS
  };
})(typeof window !== 'undefined' ? window : globalThis);
