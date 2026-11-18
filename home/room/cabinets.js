/* room/cabinets.js: the cabinets of a room from its cabinets file: carcasses, boards, fronts, strips, panels, plinths, worktops,
   plasterboard, holes, counts, problems. The same file always gives the same model; it draws nothing and knows no room.
   Coordinates in mm per group: x along the group from its left end (seen from the front), y out from the carcass backs
   (groups[g].wall: y of the wall), h up from the floor; a box is [x0, x1, y0, y1, h0, h1]. */
(function () {
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

  // visible names of the identifiers above; the code keeps the English identifiers
  const LABELS = {
    type: { space: 'space', plasterboard: 'plasterboard casing', plinth: 'plinth', worktop: 'worktop', endPanel: 'end panel', wallPanel: 'wall panel', frontPanel: 'front panel',
      strip: 'front strip', cabinet: 'cabinet', drawer: 'drawer', oven: 'oven', microwave: 'microwave' },
    tag: { dummy: 'dummy', hob: 'hob', sink: 'sink', bins: 'bins', innerDrawer: 'inner drawer', island: 'island',
      coffee: 'coffee machine', doorDrawers: 'drawers behind the door', fridge: 'fridge', freezer: 'freezer', dishwasher: 'dishwasher' },
    carcassKind: { base: 'base', tall: 'tall', wall: 'wall' },
    edge: { front: 'front', top: 'top', bottom: 'bottom', left: 'left', right: 'right' },
    // uses that are not a type (the types have their own label)
    use: { islandWorktop: 'island worktop', islandEndPanel: 'island end panel', carcass: 'carcass', backPanel: 'back panel', drawerBox: 'drawer boxes', hobPanel: 'panel under the hob' },
    hole: { cup: 'hinge cup', plate: 'hinge plate', bumper: 'bumper', shelfPin: 'shelf pin', runner: 'drawer / pull-out shelf runner', sink: 'sink cut-out', hob: 'hob cut-out' },
    // short codes of the holes and cut-outs in the cutting list (its legend explains them): always two letters, the first one the
    // group (H hinge, S shelf / runner, C cut-out), the second the part
    holeCode: { cup: 'HC', plate: 'HP', bumper: 'HB', shelfPin: 'SP', runner: 'SR', sink: 'CS', hob: 'CH' },
    // hand of a part, as seen from the front of the furniture: a carcass side or hinge post (left / right), a door (its hinge side: front.hand)
    hand: { left: 'L', right: 'R' },
    holeFrom: { front: 'from the front', back: 'from the back', bottom: 'from the bottom', hinge: 'from the hinge edge', left: 'from the left end', right: 'from the right end' }
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

  // a lacquered material is lacquered on both faces; its edges only where the room sees them (a strip on edge: its front)
  const STRIP_LACQUERED_SIDES = ['front'];
  const LACQUERED_EDGES = {
    front: { long: 2, short: 2 },
    strip: { long: STRIP_LACQUERED_SIDES.length, short: 0 },
    plinth: { long: 0, short: 0 }
  };

  // settings the engine and the pages read: a missing one stops the build (checkSettings)
  const REQUIRED_SETTINGS = [
    'carcass.depth', 'carcass.frontGap', 'carcass.legs',
    'backPanel.inset',
    'crossRails.depth', 'crossRails.hobFront', 'crossRails.hobPanelGap',
    'shelf.setback', 'shelf.clearance', 'shelf.perDoor', 'shelf.ventGap',
    'pullOutShelf.depth', 'pullOutShelf.clearance', 'pullOutShelf.lift', 'pullOutShelf.spacerAbove', 'pullOutShelf.machineHeight', 'pullOutShelf.shelvesAbove',
    'doorDrawers.count', 'doorDrawers.sideHeight', 'doorDrawers.lift', 'doorDrawers.clearance', 'doorDrawers.runnerLengths',
    'hinges.fromEnd', 'hinges.postDepth', 'hinges.aboveShelf', 'hinges.perDoor',
    'drawers.D.frontAbove', 'drawers.D.sideHeight', 'drawers.D.backHeight', 'drawers.M.sideHeight', 'drawers.M.backHeight',
    'drawers.bottom.inset', 'drawers.bottom.depth', 'drawers.bottom.fromBack', 'drawers.back.inset',
    'drawers.liftAtBottom', 'drawers.liftAbove', 'drawers.inner.gap', 'drawers.inner.backHeight', 'drawers.inner.frontDeduction',
    'strip.depth',
    'plinth.setback',
    'worktop.overhang', 'worktop.endPanelOverhang',
    'plasterboard.depth', 'plasterboard.studSpacing', 'plasterboard.layers',
    'drilling.cup.diameter', 'drilling.cup.depth', 'drilling.cup.fromEdge',
    'drilling.plate.diameter', 'drilling.plate.depth', 'drilling.plate.fromFront', 'drilling.plate.spacing',
    'drilling.bumper.diameter', 'drilling.bumper.depth',
    'drilling.shelfPin.diameter', 'drilling.shelfPin.depth', 'drilling.shelfPin.fromFront', 'drilling.shelfPin.fromBack',
    'drilling.shelfPin.belowShelf',
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

  // for the pages: a count with its noun (1 problem, 2 problems)
  const plural = (y, one, many) => (y === 1 ? one : many);

  const valueAt = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));
  const reachesHingeSide = (item, carcass) => (item.hinge === 'left' ? item.x0 === carcass.x0 : item.x1 === carcass.x1); // the door reaches the carcass side its hinges are on

  // how a component's place is printed (warnings, lists, tooltips): "G1[4]" = group 1, column 4; "G1[1-11]" = columns 1 to 11
  const placeLabel = (group, column, span = 1) => `G${group}[${column}${span > 1 ? '-' + (column + span - 1) : ''}]`;
  const placeOf = item => placeLabel(item.group, item.column, item.span);

  // how many shelves, hinges ... a front of this height gets
  const countByHeight = (table, height) => {
    const row = table.find(r => r.maxHeight === undefined || height <= r.maxHeight);
    return row ? row.count : null;
  };

  // [h0, h1] of the boards lying flat in a carcass
  const horizontalBands = (boards, carcass) => boards.filter(b => b.carcassId === carcass.id && HORIZONTAL_BOARDS.includes(b.id)).map(b => [b.box[4], b.box[5]]);

  // the clear space of a module in its carcass: the nearest horizontal boards below and above its middle (a fixed shelf need not be
  // centred on a joint, e.g. under an oven); NaN where there is none
  function spaceAround(boards, carcass, h0, h1) {
    const mid = (h0 + h1) / 2, bands = horizontalBands(boards, carcass);
    const below = bands.filter(([a, b]) => (a + b) / 2 <= mid).map(([, b]) => b), above = bands.filter(([a, b]) => (a + b) / 2 > mid).map(([a]) => a);
    return { bottom: below.length ? Math.max(...below) : NaN, top: above.length ? Math.min(...above) : NaN };
  }

  // tags come as a list (the cabinets file) or as typed text (the editor)
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

  function materialUses(materials) {
    const materialFor = {}, problems = [];
    for (const [code, m] of Object.entries(materials || {})) {
      if (!(m.thickness > 0)) problems.push(`Material ${code}: the thickness must be > 0.`);
      if (!/^#[0-9a-f]{6}$/i.test(m.color || '')) problems.push(`Material ${code}: the colour must be "#rrggbb".`);
      if ((m.uses || []).some(use => DEPTH_USES.includes(use)) && !(m.depth > 0)) problems.push(`Material ${code}: ${m.uses.filter(use => DEPTH_USES.includes(use)).map(useLabel).join(', ')} needs a depth > 0.`);
      // factoryEdges: edges the material comes finished with (no edge banding to order)
      for (const side of m.factoryEdges || []) if (!(side in LABELS.edge)) problems.push(`Material ${code}: the factory edge "${side}" must be one of: ${Object.keys(LABELS.edge).join(', ')}.`);
      for (const use of m.uses || []) {
        if (!USES.includes(use)) problems.push(`Material ${code}: "${use}" is neither a board type nor a carcass part (${USES.join(', ')}).`);
        else if (materialFor[use]) problems.push(`${use} is in two materials: ${materialFor[use]} and ${code}.`);
        else materialFor[use] = code;
      }
    }
    for (const use of USES) if (!materialFor[use]) problems.push(`No material is used for ${use}.`);
    const frontThicknesses = new Set(FRONT_TYPES.filter(t => materialFor[t]).map(t => (materials || {})[materialFor[t]].thickness));
    if (frontThicknesses.size > 1) problems.push(`The front materials (${FRONT_TYPES.join(', ')}) must have one thickness: the plane of the fronts.`);
    return { materialFor, problems };
  }

  // problems in the materials and settings that make a build impossible; the editor lists them, build() throws them
  function checkSettings(project) {
    return [...materialUses(project && project.materials).problems, ...settingProblems((project && project.settings) || {}), ...groupProblems(project && project.groups)];
  }
  // groups: a list [{group, name, backGap, columns}], one entry per group number
  function groupProblems(groupList) {
    if (!Array.isArray(groupList)) return ['No list groups [{group, name, backGap, columns}].'];
    const problems = [], seen = new Set();
    for (const g of groupList) {
      if (!(g && Number.isInteger(g.group) && g.group >= 1)) { problems.push('groups: every group needs a number "group" (an integer ≥ 1).'); continue; }
      if (seen.has(g.group)) problems.push(`groups: group ${g.group} is on the list twice.`);
      seen.add(g.group);
      if (!(g.backGap >= 0)) problems.push(`groups: group ${g.group} needs backGap ≥ 0 (the gap behind the carcasses).`);
      if (!Array.isArray(g.columns)) problems.push(`groups: group ${g.group} needs a list columns.`);
    }
    return problems;
  }
  function settingProblems(settings) {
    const problems = [];
    for (const path of REQUIRED_SETTINGS) if (valueAt(settings, path) === undefined) problems.push(`Missing setting ${path}.`);
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

  // Each piece, in list order, starts on top of the stack of the columns it spans: in each column the stack is the run of
  // pieces that reaches up without a gap from the floor (a piece can fill a gap left under a wider piece); the highest of
  // those tops wins. Returns the pieces with x0, x1, h0, h1, and the ones that do not fit.
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
  function appliances(project, library) {
    return Object.fromEntries(Object.entries((project && project.appliances) || {}).map(([role, a]) => {
      if (!library[a.product]) throw new Error(`appliances.${role}: no product ${a.product} in the library`);
      return [role, Object.assign({}, library[a.product], a)];
    }));
  }

  // appliances (appliances(), optional): the manufacturer's sizes, under the name of the type or tag they fit, fridgeFreezer for the tags fridge and freezer (fitAppliances)
  function build(project, appliances) {
    const projectData = project || {}, settings = projectData.settings || {};
    const stops = checkSettings(projectData);
    if (stops.length) throw new Error('Settings of the cabinets file: ' + stops.join(' '));

    // every thickness comes from the material of the type or part
    const { materialFor } = materialUses(projectData.materials);
    const thickness = Object.fromEntries(Object.entries(materialFor).map(([use, code]) => [use, projectData.materials[code].thickness]));
    // label: name + thickness
    const materials = Object.fromEntries(Object.entries(projectData.materials).map(([code, m]) => [code, { ...m, label: m.name + ' ' + m.thickness }]));
    const lacquerOf = (kind, use) => (projectData.materials[materialFor[use]].lacquered ? LACQUERED_EDGES[kind] : null);
    const board = thickness.carcass, half = board / 2, frontThickness = thickness.cabinet, carcassDepth = settings.carcass.depth;
    const carcassBack = 0;
    const carcassFront = carcassBack + carcassDepth;
    const frontFace = carcassFront + settings.carcass.frontGap + frontThickness;
    const plinthFace = frontFace - settings.plinth.setback;
    // a front panel outside a carcass is screwed to its neighbour, in the front plane
    const panelFace = carcassFront + thickness.frontPanel;
    // [x0, x1] of a spacer of carcass board inside the carcass side on the hinge side (it carries runners past the hinges)
    const spacerOnHingeSide = (carcass, hinge) => (hinge === 'right' ? [carcass.x1 - 2 * board, carcass.x1 - board] : [carcass.x0 + board, carcass.x0 + 2 * board]);

    const issues = []; // { index of the component, text, skipped }
    const warn = (text, index = null, skipped = false) => { issues.push({ index, text, skipped }); };
    const groups = {}, carcasses = [], fronts = [], boards = [];
    const strips = [], plinths = [], frontPanels = [], wallPanels = [], plaster = [], worktops = {};
    // engine counts, used by info.js as {n:name}; wallBrackets: brackets of the back strips at a wall; jointLength: mm of carcass side
    // screwed to a strip and its back strip, from the first carcass (screwed) or from inside the second one (fromInside)
    const counts = {
      carcasses: 0, wallBrackets: 0, jointLength: { screwed: 0, fromInside: 0 }, fronts: 0, handles: 0, hinges: 0, bumpers: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, doorDrawers: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0,
      plasterUD: 0, plasterCD: 0, plasterEdge: 0, type: {}, tag: {}
    };

    // ---- components: checks on one component; what cannot be placed is skipped ----
    // groups by number: each with its column widths, its name and backGap
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
      const isFront = FRONT_TYPES.includes(piece.type);
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

    // ---- groups: stack the components in their columns ----
    for (const [g, widths] of Object.entries(columns)) {
      widths.forEach((w, i) => { if (!Number.isInteger(w)) warn(`${placeLabel(g, i + 1)}: the column width "${w}" must be a whole number of mm.`); });
      const stacked = stack(widths, pieces.filter(p => String(p.group) === g));
      for (const { piece, why } of stacked.skipped) warn(`${placeOf(piece)}: ${typeLabel(piece.type)} ${why} - skipped.`, piece.index, true);
      const island = stacked.items.some(item => item.type === 'worktop' && hasTag(item, 'island')); // a free-standing island: its worktop has the tag island
      const backGap = groupData[g].backGap; // behind the carcass backs: to the wall, an island to the back of its worktop
      groups[g] = {
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
      };
      for (const item of stacked.items) {
        counts.type[item.type] = (counts.type[item.type] || 0) + 1;
        for (const tag of item.tags) counts.tag[tag] = (counts.tag[tag] || 0) + 1;
        const onEdge = onEdgeSize(item, groups[g].island);
        if (!onEdge) continue;
        const { use, size, what } = onEdge;
        if (size !== thickness[use]) warn(`${placeOf(item)}: ${typeLabel(item.type)} - the ${what} ${size} does not match the material ${materials[materialFor[use]].label}.`, item.index);
      }
    }

    // ---- carcasses: one per carcass name ----
    const groupOfName = new Map();
    for (const groupModel of Object.values(groups)) {
      for (const area of groupModel.areas) {
        if (groupOfName.has(area.name)) {
          warn(`Carcass ${area.name} is in group ${groupOfName.get(area.name)} and in group ${groupModel.group} - a carcass must be in one group.`, area.members[0].index);
          continue;
        }
        groupOfName.set(area.name, groupModel.group);
        const boxes = area.members.filter(i => BOX_TYPES.includes(i.type)).sort((a, b) => a.h0 - b.h0 || a.x0 - b.x0);
        carcasses.push({
          name: area.name, group: groupModel.group, column: area.firstColumn, span: area.lastColumn - area.firstColumn + 1,
          x0: area.x0, x1: area.x1, h0: area.h0, h1: area.h1, boxes, members: area.members
        });
      }
      for (const item of groupModel.items) {
        if (BOX_TYPES.includes(item.type) && !item.carcass && !hasTag(item, 'dishwasher')) warn(`${placeOf(item)}: the ${typeLabel(item.type)} has no carcass name.`, item.index);
      }
    }
    carcasses.forEach((carcass, i) => {
      carcass.id = i + 1;
      // floor = stands on a plinth; base = floor with a worktop on top; tall = floor without a worktop; wall = not on a plinth
      const overlapsColumns = item => item.column <= carcass.column + carcass.span - 1 && item.column + item.span - 1 >= carcass.column;
      const groupItems = groups[carcass.group].items;
      carcass.floor = groupItems.some(item => item.type === 'plinth' && overlapsColumns(item) && item.h1 === carcass.h0);
      carcass.base = carcass.floor && groupItems.some(item => item.type === 'worktop' && overlapsColumns(item) && item.h0 === carcass.h1);
      carcass.kind = carcass.base ? 'base' : carcass.floor ? 'tall' : 'wall';
      for (const [flag, tags] of Object.entries(CARCASS_FLAGS)) carcass[flag] = carcass.boxes.some(b => hasTag(b, ...tags));
      carcass.flags = Object.keys(CARCASS_FLAGS).filter(flag => carcass[flag]);
      if (carcass.sink && carcass.hob) warn(`${carcass.name}: a sink and a hob in one carcass exclude each other.`, carcass.members[0].index);
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
    // edges: banded edges [{side, length, along}] - the edge seen from the front, along = the size it runs along (a | b); hidden parts get none
    const crossRails = settings.crossRails, shelf = settings.shelf, backPanel = settings.backPanel;
    for (const carcass of carcasses) {
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

      // top: a base carcass has 2 cross rails (flat; on edge under a sink or a hob), any other carcass a top panel
      const crossRailName = 'cross rail ' + crossRails.depth;
      if (carcass.base && carcass.sink) {
        // the cross rails stand on edge to clear the bowl
        part('crossRail', 'Front ' + crossRailName + ', on edge', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassFront - board, carcassFront, h1 - crossRails.depth, h1], bottomEdge);
        part('crossRail', 'Back ' + crossRailName + ', on edge', innerWidth, crossRails.depth, carcassMaterial, 'carcasses', [innerX0, innerX1, carcassBack, carcassBack + board, h1 - crossRails.depth, h1]);
      } else if (carcass.base && carcass.hob) {
        // front rail on edge (hobFront high), rear rail on edge; the separation panel behind the front rail, flush with its bottom edge
        // (hidden from the front), with an air gap at the back
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

      // back only behind cabinet doors (not behind drawers, dummy fronts, ovens, microwaves, fridges, freezers); one piece per run of doors
      const doorSpans = carcass.boxes
        .filter(b => b.type === 'cabinet' && !hasTag(b, 'fridge', 'freezer'))
        .map(b => [Math.max(h0, b.h0), Math.min(h1, b.h1)])
        .sort((a, b) => a[0] - b[0])
        .reduce((runs, span) => {
          const last = runs[runs.length - 1];
          if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
          else runs.push([...span]);
          return runs;
        }, []);
      for (const [s0, s1] of doorSpans) {
        part('backPanel', 'Back panel', width - 2 * backPanel.inset, s1 - s0 - 2 * backPanel.inset, materialFor.backPanel, 'backs',
          [x0 + backPanel.inset, x1 - backPanel.inset, carcassBack - thickness.backPanel, carcassBack, s0 + backPanel.inset, s1 - backPanel.inset]);
      }

      // a fixed shelf with its top at top; ventGap of air behind it when vented
      const fixedShelf = (top, gap) => {
        part('fixedShelf', 'Fixed shelf', innerWidth, carcassDepth - gap, carcassMaterial, 'shelves', [innerX0, innerX1, carcassBack + gap, carcassFront, top - board, top], frontEdge(innerWidth, 'a'));
        counts.shelvesFixed++;
      };
      // fixed shelf at each joint of 2 boxes; a base carcass has its rails, a fridge carcass its own shelf (below)
      if (!carcass.base && !carcass.fridge) {
        const joints = [...new Set(carcass.boxes.map(b => b.h0))].filter(joint => joint > h0);
        for (const joint of joints) {
          const vented = carcass.boxes.some(b => b.h1 === joint && VENTED_SHELF_OVER.includes(b.type));
          const top = carcass.boxes.some(b => b.h0 === joint && SHELF_UNDER_JOINT.includes(b.type)) ? joint : joint + half;
          fixedShelf(top, vented ? settings.shelf.ventGap : 0);
        }
      }
      // a fridge carcass: its joints are inside the appliance; one fixed shelf right on the appliance top, which is screwed to it;
      // shallower to let the air out
      const fridgeHeight = carcass.fridge && appliances && appliances.fridgeFreezer ? appliances.fridgeFreezer.body.height : null;
      if (fridgeHeight) {
        const top = h0 + board + fridgeHeight + board;
        if (top > h1 - board) warn(`${carcass.name}: the fridge ${fridgeHeight} does not fit the carcass (inside ${height - 2 * board}).`);
        else fixedShelf(top, settings.shelf.ventGap);
      }

      // a space at one end of a carcass (e.g. the hidden end of an L corner): the carcass runs on behind it, an inset panel
      // closes its front; a carcass of spaces only (e.g. a support under a carcass on the worktop): one inset panel over its
      // whole inner width; hidden: no edge banding
      const topThickness = carcass.base && carcass.sink ? crossRails.depth : carcass.base && carcass.hob ? crossRails.hobFront : board;
      const spaces = carcass.members.filter(i => i.type === 'space');
      for (const f of carcass.boxes.length ? spaces : spaces.slice(0, 1)) {
        const atRight = f.x1 === carcass.x1, none = !carcass.boxes.length;
        const s0 = none || !atRight ? innerX0 : Math.max(...carcass.boxes.map(b => b.x1)), s1 = none || atRight ? innerX1 : Math.min(...carcass.boxes.map(b => b.x0));
        part('insetPanel', 'Inset panel', s1 - s0, height - board - topThickness, carcassMaterial, 'carcasses',
          [s0, s1, carcassFront - board, carcassFront, h0 + board, h1 - topThickness]);
      }

      // an adjustable shelf: one plain board from side to side over the whole carcass (a hinge post, when there is one, crosses it)
      const adjustableShelf = centre => {
        const shelfWidth = innerWidth - 2 * shelf.clearance, shelfX0 = innerX0 + shelf.clearance;
        part('adjustableShelf', 'Adjustable shelf', shelfWidth, carcassDepth - shelf.setback, carcassMaterial, 'shelves',
          [shelfX0, shelfX0 + shelfWidth, carcassBack, carcassFront - shelf.setback, centre - half, centre + half], frontEdge(shelfWidth, 'a')).centre = centre;
        counts.shelvesAdjustable++;
        counts.shelfPins += PINS_PER_SHELF;
      };
      // a door with coffee: a pull-out shelf on the board under the door, shelves above it up to the board over the door. The open
      // door reaches about as far into the opening as the runner clearance: a spacer on the hinge side carries that runner
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
      if (!carcass.sink && !carcass.fridge) {
        // per door, by its front height (settings.shelf.perDoor), evenly between the boards above and below the door
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

    // ---- strips (with a back strip outside a carcass), front panels, wall panels, plinths, plasterboard ----
    const stripSettings = settings.strip, plasterSettings = settings.plasterboard, stripLacquer = lacquerOf('strip', 'strip');
    for (const groupModel of Object.values(groups)) {
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
            // back strips, cut as the carcasses: an upright strip one per carcass beside it, with a wall bracket at each joint of
            // the stack (cut in on site; none on an island); a horizontal strip one per carcass under it; no carcass: one piece
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
              // the strip and its back strips are screwed to the carcass on one side; the carcass on the other side from inside
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
          // an edge shows when the front next to it opens (its neighbour, touching and overlapping, is a front that opens):
          // a lacquered material has that edge lacquered, any other gets edge banding there
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
          // cladding: the face plus the return along the long side; profiles: UD on both fixed edges, CD on the outer edge + cross pieces
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

    // ---- worktops: at a wall cut at the back to reach the wall; an island keeps the depth of its material ----
    for (const groupModel of Object.values(groups)) {
      const top = groupModel.items.find(i => i.type === 'worktop');
      if (!top) {
        if (groupModel.items.some(i => i.type === 'endPanel')) warn(`Group ${groupModel.group}: end panels with no worktop on top.`);
        continue;
      }
      const use = groupModel.island ? ISLAND_USE : 'worktop', material = materialFor[use], materialDepth = projectData.materials[material].depth;
      // every worktop: from worktop.overhang in front of the fronts back to the wall line, the group's backGap behind the carcass backs
      // (an island: no wall, only that line); the rest of the board is cut off at the back
      const y1 = frontFace + settings.worktop.overhang, y0 = groupModel.wall, depth = y1 - y0;
      if (depth > materialDepth) warn(`Group ${groupModel.group}: the worktop is ${depth}, the material ${materials[material].label} is ${materialDepth}.`);
      if (y0 > carcassBack) warn(`Group ${groupModel.group}: the worktop ${depth} does not reach the backs of the carcasses (carcass + front + overhang = ${y1 - carcassBack}).`);
      worktops[groupModel.group] = { y0, y1, depth, back: carcassBack - y0, h0: top.h0, h1: top.h1, use, material, thickness: thickness[use] };
    }

    // ---- island back panel: panel material, between the end panels (none: the end columns), floor to the carcass tops, on the carcass backs ----
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

    // ---- fronts, hinges, hinge posts, drawer boxes ----
    const hingeSettings = settings.hinges, drawerSettings = settings.drawers;
    // height of the shelf-pin holes (their centres) under an adjustable shelf
    const shelfPinRow = shelfBoard => shelfBoard.centre - half - settings.drilling.shelfPin.belowShelf;
    // a hinge that meets a shelf (closer than half a board + hinges.aboveShelf to its centre) goes above it: to the lowest height
    // at least hinges.aboveShelf over the shelf where its mounting-plate holes miss every shelf-pin hole (settings.drilling)
    function hingeClearOfShelves(h, carcass, front, item) {
      const plate = settings.drilling.plate, pin = settings.drilling.shelfPin;
      const centreOf = b => (b.box[4] + b.box[5]) / 2;
      const inDoor = b => b.carcassId === carcass.id && centreOf(b) > front.h0 && centreOf(b) < front.h1;
      const shelves = boards.filter(b => inDoor(b) && (b.id === 'adjustableShelf' || b.id === 'pullOutShelf')).map(centreOf);
      const reach = half + hingeSettings.aboveShelf;
      const hit = shelves.find(c => Math.abs(h - c) < reach);
      if (hit === undefined) return h;
      // shelf-pin holes on the same face (only adjustable shelves have pins); centre distance as the overlap check
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
    // drawers behind a door (tag doorDrawers): the hinges take hinges.postDepth at the carcass front, so the spacer and the boxes
    // stop there; the box front covers the ends of the sides and of the bottom
    function addDoorDrawers(item, front, carcass) {
      const doorDrawerSettings = settings.doorDrawers, t = thickness.drawerBox, at = placeOf(item);
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
          edges: [{ side: 'top', length: x1 - x0, along: 'a' }, { side: 'left', length: t + doorDrawerSettings.sideHeight, along: 'b' }, { side: 'right', length: t + doorDrawerSettings.sideHeight, along: 'b' }] });
        boards.push({ id: 'doorDrawerBottom', name: 'Bottom of a drawer behind the door', a: x1 - x0 - 2 * t, b: inner, ...common, box: [x0 + t, x1 - t, y0, y1 - t, h, h + t], edges: [] });
        for (const s of [x0, x1 - t]) boards.push({ id: 'doorDrawerSide', name: 'Side of a drawer behind the door', a: inner, b: t + doorDrawerSettings.sideHeight, ...common, box: [s, s + t, y0, y1 - t, h, top], edges: [{ side: 'top', length: inner, along: 'a' }] });
        boards.push({ id: 'doorDrawerBack', name: 'Back of a drawer behind the door', a: x1 - x0 - 2 * t, b: doorDrawerSettings.sideHeight, ...common, box: [x0 + t, x1 - t, y0, y0 + t, h + t, top], edges: [{ side: 'top', length: x1 - x0 - 2 * t, along: 'a' }] });
        front.doorDrawers.boxes.push({ x0, x1, h0: h, h1: top, y0, y1 });
      }
      counts.doorDrawers += count;
    }
    for (const groupModel of Object.values(groups)) {
      for (const item of groupModel.items) {
        if (!FRONT_TYPES.includes(item.type)) continue;
        const box = frontBox(item), carcass = carcassOf(item), opening = openingOf(item), hinged = HINGED.includes(opening);
        if (box.x1 - box.x0 <= 0 || box.h1 - box.h0 <= 0) warn(`${placeOf(item)}: the gaps leave no front.`, item.index);
        // hinges are screwed to a carcass side: a door that does not reach one gets a hinge post (an appliance front has no hinges)
        if (opening === 'door' && carcass && HINGE_SIDES.includes(item.hinge) && !reachesHingeSide(item, carcass)) {
          const postX0 = item.hinge === 'left' ? item.x0 : item.x1 - board, postH0 = Math.max(item.h0, carcass.h0 + board), postH1 = Math.min(item.h1, carcass.h1 - board);
          boards.push({
            id: 'hingePost', name: 'Hinge post', a: hingeSettings.postDepth, b: postH1 - postH0, material: materialFor.carcass, layer: 'carcasses', group: groupModel.group, carcassId: carcass.id,
            box: [postX0, postX0 + board, carcassFront - hingeSettings.postDepth, carcassFront, postH0, postH1], edges: [{ side: 'front', length: postH1 - postH0, along: 'b' }], hand: item.hinge
          });
        }
        const front = {
          id: fronts.length + 1, group: groupModel.group, item, carcassId: carcass ? carcass.id : null, opening, tags: item.tags, gaps: item.gaps,
          ...box, width: box.x1 - box.x0, height: box.h1 - box.h0, handle: item.handle, hand: hinged ? item.hinge : '', material: materialFor[item.type],
          lacquer: lacquerOf('front', item.type)
        };
        item.front = front;
        fronts.push(front);
        counts.fronts++;
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

        if (opening === 'drawer' && carcass) {
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

    // ---- holes: hinge cups in the doors, mounting plates, bumpers and shelf pins in the carcass sides and hinge posts ----
    // a hole: kind, diameter, depth, x / y on the part (from the edges in part.holeFrom), at: [x, y, h] of its centre on the drilled face,
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
      const faceBoard = x => own.find(b => (b.id === 'side' || b.id === 'hingePost') && (b.box[0] === x || b.box[1] === x));
      // mounting plates: on the side or hinge post at the hinge edge of each door, plate.spacing apart around each hinge
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
      // bumpers: one opposite each hinge, at its height, pressed into the front edge of the side (or hinge post) under the other edge of
      // the door, in the middle of its thickness; they keep the front gap (carcass.frontGap) there and stay with the carcass.
      // A hole in an edge: x from the board bottom (hole.from), y 0
      for (const front of fronts.filter(f => f.carcassId === carcass.id && f.hinges)) {
        const otherEdge = front.hand === 'left' ? front.x1 : front.x0, bumper = drill.bumper, hingeBoard = faceBoard(front.hingeX);
        const side = own.filter(b => (b.id === 'side' || b.id === 'hingePost') && b !== hingeBoard && b.box[3] === carcassFront && b.box[0] < front.x1 && b.box[1] > front.x0)
          .sort((p, q) => Math.abs((p.box[0] + p.box[1]) / 2 - otherEdge) - Math.abs((q.box[0] + q.box[1]) / 2 - otherEdge))[0];
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
      // drawer runners (and the pull-out shelf runners): in both sides, runner.belowDrawer under the drawer bottom, at runner.fromFront
      const runner = drill.runner;
      const runnerRows = [
        ...fronts.filter(f => f.carcassId === carcass.id && f.drawer).flatMap(f => [f.drawer.bottomH, ...(f.drawer.inner ? [f.drawer.innerH] : [])]),
        ...own.filter(b => b.id === 'pullOutShelf').map(b => b.box[4])
      ];
      // a spacer on a side (next to the pull-out shelf) carries the runner instead of that side
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
      // ball runners of the drawers behind a door (tag doorDrawers): on the spacer (hinge side) and on the carcass side opposite,
      // drilling.ballRunner.fromFront from the runner front, drilling.ballRunner.aboveBottom above the box bottom; diameter and depth of drilling.runner
      const ballRunner = drill.ballRunner;
      for (const front of fronts.filter(f => f.carcassId === carcass.id && f.doorDrawers)) {
        const right = front.hand === 'right';
        for (const box of front.doorDrawers.boxes) {
          const runnerH = box.h0 + ballRunner.aboveBottom;
          const spacer = own.find(b => b.id === 'spacer' && b.box[4] <= runnerH && b.box[5] >= runnerH && (right ? b.box[0] >= box.x1 : b.box[1] <= box.x0));
          const side = sides.find(b => (right ? b.box[0] === carcass.x0 : b.box[1] === carcass.x1));
          for (const target of [spacer, side].filter(Boolean)) {
            target.holeFrom = { x: 'front', y: 'bottom' };
            const atRight = target.box[0] >= box.x1, inner = atRight ? target.box[0] : target.box[1], dir = atRight ? 1 : -1;
            for (const p of ballRunner.fromFront) {
              const y = box.y1 - p;
              holeAt(target, { kind: 'runner', diameter: runner.diameter, depth: runner.depth, x: target.box[3] - y, y: runnerH - target.box[4], at: [inner, y, runnerH], axis: 'x', dir });
            }
          }
        }
      }
      // holes too close on one face of one part (once per pair of kinds and part); a hole in a horizontal board (once per kind and carcass)
      const boardHits = new Set();
      for (const b of own.filter(b => b.holes)) {
        b.holes.sort((hole, g) => hole.y - g.y || hole.x - g.x);
        const near = (hole, g) => Math.hypot(g.x - hole.x, g.y - hole.y) < (g.diameter + hole.diameter) / 2 + 1;
        // a hole in a side or a hinge post must not land where a horizontal board meets it
        const inBoard = b.holes.find(hole => hole.axis === 'x' && bands.some(([b0, b1]) => hole.at[2] + hole.diameter / 2 > b0 && hole.at[2] - hole.diameter / 2 < b1));
        if (inBoard && !boardHits.has(inBoard.kind)) {
          boardHits.add(inBoard.kind);
          warn(`${carcass.name}: ${b.name.toLowerCase()} - a ${LABELS.hole[inBoard.kind]} hits a horizontal board (${inBoard.x} from the front, ${Math.round(inBoard.y)} from the bottom): check the settings drilling.`);
        }
        const pairsMet = new Set();
        b.holes.forEach((hole, i) => {
          for (const g of b.holes.slice(i + 1).filter(g => near(hole, g))) {
            if (pairsMet.has(hole.kind + '|' + g.kind)) continue;
            pairsMet.add(hole.kind + '|' + g.kind);
            warn(`${carcass.name}: ${b.name.toLowerCase()} - a ${LABELS.hole[hole.kind]} and a ${LABELS.hole[g.kind]} in the same place (${hole.x} from the front, ${Math.round(hole.y)} from the bottom): move the shelf or the hinge.`);
          }
        });
      }
    }

    // ---- appliances in their places: item.fit, shown by info.js (notes) and drawn by index.html ----
    // every fit has the body, centred on its module or carcass: {bodyU0, bodyU1, bodyV0, bodyV1}; an oven or a microwave stands on its feet
    // (appliances of the cabinets file) on the board under its module: + {feet, fasciaV0, fasciaV1}; a fridge stands on the carcass bottom, one fit on both
    // its fronts; a dishwasher stands on the floor on its feet, up to the worktop: + {feet, doorV0, doorV1}
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
      // one fit for the fridge and the freezer front of a fridge carcass
      for (const carcass of carcasses.filter(candidate => candidate.fridge && applianceData.fridgeFreezer)) {
        const a = applianceData.fridgeFreezer, bodyH0 = carcass.h0 + board;
        const fit = { ...bodyAcross(carcass, a), bodyH0, bodyH1: bodyH0 + a.body.height };
        for (const item of carcass.boxes.filter(b => hasTag(b, 'fridge', 'freezer'))) item.fit = fit;
      }
    }

    // ---- worktop pieces and their cut-outs (sink, hob): settings.cutouts[flag], centred on the carcass, fromBack from the worktop back edge ----
    const worktopPieces = [];
    for (const groupModel of Object.values(groups)) {
      const worktop = worktops[groupModel.group];
      if (!worktop) continue;
      // finished where an edge is seen: edge banding, unless the material comes with that edge (factoryEdges); cut-outs stay bare
      const items = groupModel.items.filter(i => i.type === 'worktop' || i.type === 'endPanel'), endPanels = items.filter(i => i.type === 'endPanel');
      // a worktop end is seen over an end panel at that end: nothing but spaces between them (the space = the worktop overhanging the panel)
      const onlySpaces = (a, b) => groupModel.items.every(i => i.type === 'space' || i.x1 <= a || i.x0 >= b || i.h0 >= worktop.h0);
      const endPanelAt = {
        left: item => endPanels.some(f => f.x0 >= item.x0 && onlySpaces(item.x0, f.x0)),
        right: item => endPanels.some(f => f.x1 <= item.x1 && onlySpaces(f.x1, item.x1))
      };
      // an end panel stands worktop.endPanelOverhang behind the worktop front (and its back on an island): the joint stays hidden
      const endPanelY0 = worktop.y0 + (groupModel.island ? settings.worktop.endPanelOverhang : 0), endPanelY1 = worktop.y1 - settings.worktop.endPanelOverhang;
      for (const item of items) {
        const endPanel = item.type === 'endPanel', length = endPanel ? item.h1 - item.h0 : item.x1 - item.x0;
        const material = endPanel ? materialFor[groupModel.island ? ISLAND_END_PANEL_USE : 'endPanel'] : worktop.material;
        const y0 = endPanel ? endPanelY0 : worktop.y0, y1 = endPanel ? endPanelY1 : worktop.y1, depth = y1 - y0;
        const materialDepth = projectData.materials[material].depth;
        if (endPanel && materialDepth < depth) warn(`${placeOf(item)}: the end panel is ${depth} deep, the material ${materials[material].label} is ${materialDepth}.`, item.index);
        const seen = [{ side: 'front', length, along: 'a' }];
        if (groupModel.island) seen.push({ side: 'back', length, along: 'a' });
        if (!endPanel) for (const side of ['left', 'right']) if (endPanelAt[side](item)) seen.push({ side, length: depth, along: 'b' });
        const factory = projectData.materials[material].factoryEdges || [];
        worktopPieces.push({
          group: groupModel.group, item, name: endPanel ? 'End panel' : 'Worktop', material, a: length, b: depth, y0, y1,
          edges: seen.filter(edge => !factory.includes(edge.side)), factoryEdges: seen.map(edge => edge.side).filter(side => factory.includes(side))
        });
      }
      worktop.cutouts = [];
    }
    for (const carcass of carcasses.filter(candidate => candidate.base)) {
      for (const flag of CUTOUT_FLAGS.filter(f => carcass[f])) {
        const cut = (settings.cutouts || {})[flag], worktop = worktops[carcass.group];
        if (!cut) { warn(`${carcass.name}: no cut-out sizes in settings.cutouts.${flag}.`); continue; }
        if (!worktop) continue;
        const centre = (carcass.x0 + carcass.x1) / 2, x0 = centre - cut.width / 2, x1 = centre + cut.width / 2, y0 = worktop.y0 + cut.fromBack, y1 = y0 + cut.depth;
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

    return {
      settings, warnings: issues.map(issue => issue.text), issues, counts, thickness, materials, materialFor, frontThickness, worktopPieces,
      carcassDepth, carcassBack, carcassFront, frontFace, panelFace, plinthFace, // y: from the carcass backs
      groups, carcasses, fronts, boards, strips, plinths, frontPanels, wallPanels, plaster, worktops
    };
  }

  /* ================= 6. LISTS AND FILES ================= */

  // parts with the same name, size, banded edges and lacquer counted together, one row each: the holes are drilled by hand on site, so
  // left and right parts and parts drilled differently share a row (one label) and the row lists where to drill each of them:
  //   {name, a, b, qty, where, edges, lacquer, drillings, key}
  //   where = their "at" labels, e.g. "K2, K5 ×2"; edges = banded edges of one part [{side, length, along}]; lacquer = {long, short} lacquered
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
      const where = [...at].map(([label, y]) => (y > 1 ? label + ' ×' + y : label)).join(', ');
      return { name: part.name, a: part.a, b: part.b, qty, where, edges: part.edges || [], lacquer: part.lacquer || null,
        drillings: [...drillings.values()].sort((p, q) => handOrder(p) - handOrder(q)), key };
    });
  }
  const cutKey = p => [p.name, p.a, p.b, JSON.stringify(p.edges || []), JSON.stringify(p.lacquer || null)].join('|');

  // where to drill or cut one part, in part coordinates: {from: {x, y}, hand, holes: [{kind, diameter, depth, x, y}], cutouts: [{kind, width, depth, x, y}]}
  // or null; hand (left | right) tells a left part from a right one with the same pattern (sides, hinge posts, doors)
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
  function productsOf(model, appliances, { install, ceiling } = {}) {
    const { carcassFront } = model, out = [], union = boxes => [0, 1, 2].flatMap(k => [Math.min(...boxes.map(b => b[2 * k])), Math.max(...boxes.map(b => b[2 * k + 1]))]);
    const add = (role, group, carcassId, box, extra) => out.push(Object.assign({ role, A: appliances[role], group: String(group), carcassId, box }, extra));
    for (const g of Object.values(model.groups)) for (const item of g.items) {
      if (item.type !== 'oven' && item.type !== 'microwave') continue;
      const A = appliances[item.type], f = item.fit, xc = (item.x0 + item.x1) / 2, { width: bw, height: bh, depth: bd } = A.body;
      add(item.type, g.group, item.carcassId, union([[xc - bw / 2, xc + bw / 2, carcassFront - bd, carcassFront, f.bodyH0 - f.feet, f.bodyH0 + bh],
        [xc - A.fascia.width / 2, xc + A.fascia.width / 2, carcassFront, carcassFront + A.fascia.thickness, f.fasciaH0, f.fasciaH1]]), { item });
    }
    for (const c of model.carcasses) if (c.fridge && c.boxes.some(b => b.fit)) {
      const fit = c.boxes.find(b => b.fit).fit, A = appliances.fridgeFreezer;
      add('fridgeFreezer', c.group, c.id, [fit.bodyX0, fit.bodyX1, carcassFront - A.body.depth, carcassFront, fit.bodyH0, fit.bodyH1], { fit });
    }
    for (const f of model.fronts) if (f.opening === 'dishwasher' && f.item.fit) {
      const fit = f.item.fit;
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
        add('trap', r, c.id, [x - 70, x + 125, Math.max(back - 29, model.groups[r].wall), Math.max(y + 20, back + 56), install.sink.wallOutlet - 25, from],   // its outlet ends in the wall
          { name: 'Trap', x, from, drain: y, top: install.sink.trapTop, outlet: install.sink.wallOutlet, back });
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
      add('hood', g.group, null, [x - A.body.width / 2, x + A.body.width / 2, 0, Math.max(A.body.depth, A.chimney.depth), install.hood.bottom - 1.5, ceiling],
        { x, bottom: install.hood.bottom, ceiling, worktop: model.worktops[g.group].h1 });
    }
    for (const b of model.boards) if (b.id === 'pullOutShelf') {
      const C = appliances.coffee.body, [x0, x1, , y1, , h1] = b.box, x = (x0 + x1) / 2, y = y1 - 20;
      add('coffee', b.group, b.carcassId, [x - C.width / 2, x + C.width / 2, y - C.depth, y, h1, h1 + C.height], { shelf: b });
    }
    return out;
  }

  /* ================= 7. THE TREE: every part in the coordinates of what it belongs to =================
     group -> its worktop, panels, strips, plinths, plasterboard, carcasses and loose products; carcass -> its boards, fronts and
     products; front ->
     the boards of its drawer, its inner drawer, its drawers behind the door. A node: {id, name, type, offset, size, children}
     in x, y, h: offset from its parent's origin (its smallest corner), size its box (its own parts and its children's);
     the group's origin: its left end, its wall, the floor. node.part: the part of the model it draws. The model computes
     with y from the carcass backs; the tree has no such frame. */
  function tree(model, appliances, fitting) {
    const { carcassBack, carcassFront, frontFace, frontThickness, settings } = model, PRODUCTS = productsOf(model, appliances, fitting);
    const union = boxes => [0, 1, 2].flatMap(k => [Math.min(...boxes.map(b => b[2 * k])), Math.max(...boxes.map(b => b[2 * k + 1]))]);
    /* a node with its box in the model's frame (gb) and its children; made local once its parent is known */
    const make = (id, name, type, own, children = [], part = null) => {
      const gb = union([own, ...children.map(c => c.gb)].filter(Boolean));
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
    const boardNode = b => make(b.id, b.name + ' ' + b.a + ' × ' + b.b, 'board', b.box, [], b);
    const frontBox = f => [f.x0, f.x1, frontFace - frontThickness, frontFace, f.h0, f.h1];
    function frontNode(f) {
      const own = model.boards.filter(b => b.frontId === f.id);
      const children = own.filter(b => !b.inner && b.doorDrawer === undefined).map(boardNode);
      const inner = own.filter(b => b.inner);
      if (inner.length) children.push(make('innerDrawer', 'Inner drawer', 'drawer', null, inner.map(boardNode)));
      const behind = [...new Set(own.filter(b => b.doorDrawer !== undefined).map(b => b.doorDrawer))];
      for (const j of behind) children.push(make('doorDrawer', 'Drawer behind the door ' + (j + 1), 'drawer', null, own.filter(b => b.doorDrawer === j).map(boardNode)));
      return make(f.opening, cap(typeLabel(f.item.type)) + ' ' + Math.round(f.width) + ' × ' + Math.round(f.height), 'front', frontBox(f), children, f);
    }
    const groups = Object.values(model.groups).map(g => {
      const r = g.group, mine = x => x.group === r;
      const products = PRODUCTS.filter(x => x.group === String(r)), productNode = x => make(x.role, x.name || x.A.name, 'product', x.box, [], x);
      const carcasses = model.carcasses.filter(mine).map(c => make(c.name, 'Carcass ' + c.name, 'carcass', [c.x0, c.x1, carcassBack, carcassFront, c.h0, c.h1],
        model.boards.filter(b => b.carcassId === c.id && !b.frontId).map(boardNode).concat(model.fronts.filter(f => f.carcassId === c.id).map(frontNode),
          products.filter(x => x.carcassId === c.id).map(productNode)), c));
      const loose = model.fronts.filter(f => mine(f) && !f.carcassId).map(frontNode)
        .concat(model.boards.filter(b => mine(b) && !b.carcassId).map(boardNode), products.filter(x => !x.carcassId).map(productNode));
      const piece = (list, type) => list.filter(mine).map(x => make(type, (x.name || cap(typeLabel(type))) + ' ' + x.a + ' × ' + x.b, type, x.box, [], x));
      const worktops = model.worktopPieces.filter(mine).map(w => make(w.item.type, w.name + ' ' + w.a + ' × ' + w.b, w.item.type, [w.item.x0, w.item.x1, w.y0, w.y1, w.item.h0, w.item.h1], [], w));
      const plaster = model.plaster.filter(mine).map(x => make('plasterboard', x.name + ' ' + x.a + ' × ' + x.b, 'plasterboard',
        [x.item.x0, x.item.x1, g.wall, g.wall + settings.plasterboard.depth, x.item.h0, x.item.h1], [], x));
      const children = [...worktops, ...piece(model.wallPanels, 'wallPanel'), ...plaster, ...piece(model.strips, 'strip'), ...piece(model.plinths, 'plinth'),
        ...piece(model.frontPanels, 'frontPanel'), ...carcasses, ...loose];
      const n = make('g' + r, 'G' + r + ' · ' + g.name, 'group', [0, g.length, g.wall, g.wall, 0, 0], children);
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
    return named(groups).map(n => {
      local(n, [n.gb[0], n.gb[2], n.gb[4]]);
      parentsOf(n, null);
      return n;
    });
  }
  function parentsOf(n, parent) { Object.defineProperty(n, 'parent', { value: parent }); for (const c of n.children) parentsOf(c, n); }
  /* a node's box in its group [x0, x1, y0, y1, h0, h1]: the offsets added up from the group's origin */
  function boxIn(n) {
    const o = [0, 0, 0];
    for (let p = n; p.parent; p = p.parent) for (let k = 0; k < 3; k++) o[k] += p.offset[k];
    return [o[0], o[0] + n.size[0], o[1], o[1] + n.size[1], o[2], o[2] + n.size[2]];
  }

  /* ================= 8. DRAWING: the model as solids, moving fronts and details =================
     D: the room's drawing context (room/room.js): box(list, r, gb, key, layer, info) in the frame of group r, at, detail,
     cylinder, mover, linkTo, envelope, openFront, openTop, part, frame(r) {X, Y}, has(key), STATIC; a product is drawn by
     the library (HOME.draw) by its field draw. HW: the hardware as drawn (the products' sizes and the scene's layout);
     install: how the sink, its trap and the hood are fitted. Boards are the materials 'board:' + product key ('~': the decor
     turned a quarter; ':core': the bare edge). */
  function draw(D, model, appliances, HW, install) {
    const { box, at, detail, cylinder, mover, linkTo, envelope, openTop, STATIC } = D;
    const settings = model.settings, T = model.thickness, { frontFace, panelFace, carcassBack, carcassFront, plinthFace, frontThickness } = model;
    const K = code => 'board:' + code, GROUP_IDS = Object.keys(model.groups);
    /* a part's box from the tree (from its group's wall), in the frame the drawing computes in (y from the carcass backs) */
    const placed = part => { const b = boxIn(part.node), wall = model.groups[part.group].wall; return [b[0], b[1], b[2] + wall, b[3] + wall, b[4], b[5]]; };
    const GROUP = r => model.groups[r], groupLength = r => GROUP(r).widths.reduce((s, w) => s + w, 0), itemsOf = r => GROUP(r).items;
    const shakerRail = model.materials[model.materialFor.cabinet].frameWidth;
    const product = (A, place, d = D) => HOME.draw[A.draw](d, A, place);
    /* a product draws in its own coordinates: from the origin of its node (its left, back, bottom corner); the room's
       drawing context moved there */
    const P = role => (model.products || []).filter(x => x.role === role);
    const originOf = x => { const b = placed(x); return [b[0], b[2], b[4]]; };
    function moved(o) {
      const at3 = (a, i) => { const c = a.slice(); for (let k = 0; k < 3; k++) c[i + k] += o[k]; return c; };
      const gb = b => [b[0] + o[0], b[1] + o[0], b[2] + o[1], b[3] + o[1], b[4] + o[2], b[5] + o[2]];
      return Object.assign({}, D, {
        box: (list, r, b, ...rest) => D.box(list, r, gb(b), ...rest),
        openFront: (list, r, b, ...rest) => D.openFront(list, r, gb(b), ...rest),
        openTop: (list, r, b, ...rest) => D.openTop(list, r, gb(b), ...rest),
        envelope: (r, b, ...rest) => D.envelope(r, gb(b), ...rest),
        cylinder: (...a) => D.cylinder(...at3(a, 4)), detail: (...a) => D.detail(...at3(a, 3)), display: (...a) => D.display(...at3(a, 4)),
        mover: (...a) => D.mover(...at3(a, 2)), point: (...a) => D.point(...at3(a, 1)),
        profile: (list, r, x0, x1, prof, ...rest) => D.profile(list, r, x0 + o[0], x1 + o[0], prof.map(([y, h]) => [y + o[1], h + o[2]]), ...rest)
      });
    }
    const fitOf = (fit, o) => minus(fit, o, [['bodyX0', 0], ['bodyX1', 0], ['bodyH0', 2], ['bodyH1', 2]]);
    const minus = (fit, o, keys) => Object.assign({}, fit, Object.fromEntries(keys.map(([k, i]) => [k, fit[k] - o[i]])));

    /* the face of a box by its normal: which side of the group (left/right = −x/+x, back/front = −y/+y, bottom/top) */
    const SIDE_AXIS = { left: 0, right: 0, back: 1, front: 1, bottom: 2, top: 2 };
    function sideOf(r, normal) {
      const { X, Y } = D.frame(r), dx = normal[0] * X[0] + normal[1] * X[1], dy = normal[0] * Y[0] + normal[1] * Y[1];
      return Math.abs(normal[2]) > 0.5 ? (normal[2] > 0 ? 'top' : 'bottom') : Math.abs(dx) > 0.5 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'front' : 'back');
    }
    /* the grain of a decor: along x, up (h), or (no rule) along the longer side of the face. The texture runs along the
       face's first uv axis (core/surface.js: an x face has (y, h), a y face (x, h), an h face (x, y)); '~' turns it. */
    const FACE_UV = normal => Math.abs(normal[0]) > 0.5 ? [1, 2] : Math.abs(normal[1]) > 0.5 ? [0, 2] : [0, 1];
    function turned(c, normal, grain) {
      const [a, b] = FACE_UV(normal), extent = k => c.hb[2 * k + 1] - c.hb[2 * k];
      let g = grain === 'x' ? (Math.abs(D.frame(c.r).X[0]) > 0.5 ? 0 : 1) : grain === 'h' ? 2 : null;
      if (g !== a && g !== b) g = extent(a) >= extent(b) ? a : b;
      return g === b;
    }
    /* a board: its two big faces (or the faces named) in the decor, banded edges too, every other edge bare */
    function look(c, code, { banded = [], faces = null, grain = null } = {}) {
      if (!c) return null;
      const plain = K(code), turnedKey = D.has(plain + '~') ? plain + '~' : null, bare = D.has(plain + ':core') ? plain + ':core' : null;
      const size = [c.gb[1] - c.gb[0], c.gb[5] - c.gb[4], c.gb[3] - c.gb[2]], thin = size.indexOf(Math.min(...size)), finished = new Set(banded);
      c.faceMaterial = normal => {
        const side = sideOf(c.r, normal), decor = faces ? faces.includes(side) : SIDE_AXIS[side] === thin;
        if (!decor && !finished.has(side) && bare) return bare;
        return turnedKey && turned(c, normal, grain) ? turnedKey : plain;
      };
      return c;
    }
    const ALL_SIDES = Object.keys(SIDE_AXIS);
    const BOARD_CHECK = { drawerBottom: 'drawer', drawerBack: 'drawer', doorDrawerFront: 'drawer', doorDrawerBottom: 'drawer', doorDrawerSide: 'drawer',
      doorDrawerBack: 'drawer', backStrip: 'backStrip', adjustableShelf: 'shelf' };
    /* a board of the model, with its banded edges; a carcass board is listed in its carcass */
    function board(list, b, carcass, layer, m) {
      const c = box(list, String(b.group), placed(b), K(b.material), layer || b.layer || 'carcasses', { board: b, carcass, mover: m, check: BOARD_CHECK[b.id] || 'carcass',
        name: (carcass ? carcass.name + ' ' : '') + b.name + ' ' + b.a + ' × ' + b.b, batch: (carcass ? 'c' + carcass.id : 'b') + ':' + b.id });
      if (c && carcass) carcass.parts.push({ name: b.name, a: b.a, b: b.b });
      return look(c, b.material, { banded: (b.edges || []).map(e => e.side) });
    }
    const worktopOf = r => model.worktops[r] || { y0: 0, y1: 0, depth: 0, h1: 0 };
    const worktopTop = r => worktopOf(r).h1;

    /* ---------- worktops, strips, panels, plinths, plasterboard ---------- */
    const CHECKED_TYPES = ['worktop', 'endPanel', 'strip', 'plinth', 'frontPanel', 'wallPanel'];
    /* a worktop or an end panel, one part of boxes around its cut-outs: finished edges (banded or factory) in the decor, the
       walls of the cut-outs bare */
    function worktopPiece(r, piece, info) {
      const { x0, x1, h0, h1 } = piece.item, endPanel = piece.item.type === 'endPanel', code = piece.material, I = Object.assign({ part: D.part() }, info);
      const finished = new Set([...piece.edges.map(e => e.side), ...piece.factoryEdges]);
      const outer = x0 + x1 < groupLength(r) ? 'left' : 'right';
      const faces = model.materials[code].twoSided ? (endPanel ? ['left', 'right'] : ['top', 'bottom']) : [endPanel ? outer : 'top'];
      const holes = (piece.cutouts || []).map(c => [c.x0, c.x1, c.y0, c.y1]);
      const cuts = [...new Set([x0, x1, ...holes.flatMap(([a, b]) => [a, b])])].sort((p, q) => p - q);
      for (let i = 0; i + 1 < cuts.length; i++) {
        const a = cuts[i], b = cuts[i + 1], spans = [];
        let y = piece.y0;
        for (const [, , c0, c1] of holes.filter(([c0, c1]) => c0 <= a && c1 >= b).sort((p, q) => p[2] - q[2])) { spans.push([y, c0]); y = c1; }
        spans.push([y, piece.y1]);
        for (const [y0, y1] of spans) {
          const outline = { left: a === x0, right: b === x1, back: y0 === piece.y0, front: y1 === piece.y1, top: true, bottom: true };
          look(box(STATIC, r, [a, b, y0, y1, h0, h1], K(code), endPanel ? 'endPanels' : 'worktops', I), code,
            { banded: [...finished].filter(s => outline[s]), faces, grain: endPanel ? 'h' : 'x' });
        }
      }
    }
    function drawGroup(r) {
      for (const item of itemsOf(r)) {
        const { x0, x1, h0, h1, type } = item, wall = GROUP(r).wall;
        const info = CHECKED_TYPES.includes(type) ? { check: type, name: placeLabel(r, item.column, item.span) + ' ' + typeLabel(type) + ' ' + (x1 - x0) + ' × ' + (h1 - h0) + (item.note ? ' (' + item.note + ')' : '') } : {};
        if (type === 'worktop' || type === 'endPanel') {
          const piece = model.worktopPieces.find(p => p.item === item);
          if (piece) worktopPiece(r, piece, info);
        } else if (type === 'strip') {                 // on edge in the plane of the fronts; lacquered faces and the edges the model names
          const strip = model.strips.find(s => s.item === item), code = model.materialFor.strip;
          look(box(STATIC, r, placed(strip), K(code), 'strips', info), code, { banded: (strip && strip.lacqueredSides) || [] });
        } else if (type === 'frontPanel') {
          const panel = model.frontPanels.find(p => p.item === item), code = model.materialFor.frontPanel;
          look(box(STATIC, r, placed(panel), K(code), 'frontPanel', info), code, { banded: [...panel.edges.map(e => e.side), ...panel.lacqueredSides] });
        } else if (type === 'plinth') {
          const code = model.materialFor.plinth;
          look(box(STATIC, r, placed(model.plinths.find(p => p.item === item)), K(code), 'plinth', info), code);
        } else if (type === 'wallPanel') {
          const code = model.materialFor.wallPanel;
          look(box(STATIC, r, placed(model.wallPanels.find(p => p.item === item)), K(code), 'wallPanel', info), code, { faces: ALL_SIDES, grain: 'x' });
        } else if (type === 'plasterboard') {          // a space draws nothing
          box(STATIC, r, [x0, x1, wall, wall + settings.plasterboard.depth, h0, h1], 'wall', 'plasterboard', { name: 'Plasterboard casing ' + (x1 - x0) + ' × ' + (h1 - h0) });
        } else if (type === 'oven' || type === 'microwave') {
          const x = P(type).find(p => p.item === item), o = originOf(x);
          product(appliances[type], { r, item: Object.assign({}, item, { x0: item.x0 - o[0], x1: item.x1 - o[0], fit: minus(item.fit, o, [['bodyH0', 2], ['fasciaH0', 2], ['fasciaH1', 2]]) }), front: carcassFront - o[1] }, moved(o));
        }
      }
    }

    /* ---------- the sink and the hob in their cut-outs, the hood over the hob ---------- */
    const sinkCarcass = model.carcasses.find(c => c.sink), sinkGroup = sinkCarcass ? String(sinkCarcass.group) : null;
    const sinkCut = sinkGroup && (worktopOf(sinkGroup).cutouts || []).find(c => c.kind === 'sink');
    const sinkItem = sinkCut && itemsOf(sinkGroup).find(i => hasTag(i, 'sink'));
    const sinkX = sinkCut ? (sinkCut.x0 + sinkCut.x1) / 2 : 0;
    function drawSink() {
      const r = sinkGroup, top = worktopTop(r), S = appliances.sink;
      const x = P('sink')[0], o = originOf(x), local = product(S, { r, x: x.x - o[0], y: x.y - o[1], top: x.top - o[2] }, moved(o));
      const bowl = { bottom: local.bottom + o[2], rimTop: local.rimTop + o[2], drain: local.drain + o[1] };
      const tap = P('tap')[0], t = originOf(tap), trap = P('trap')[0], q = originOf(trap);
      HOME.draw.tap(moved(t), { r, x: tap.x - t[0], y: tap.y - t[1], top: tap.top - t[2] });
      HOME.draw.trap(moved(q), { r, x: trap.x - q[0], from: trap.from - q[2], drain: trap.drain - q[1], top: trap.top - q[2], outlet: trap.outlet - q[2], back: trap.back - q[1] });
    }
    const hobGroup = GROUP_IDS.find(r => itemsOf(r).some(i => hasTag(i, 'hob')));
    const hobItem = hobGroup && itemsOf(hobGroup).find(i => hasTag(i, 'hob'));
    const hobCut = hobItem && (worktopOf(hobGroup).cutouts || []).find(c => c.kind === 'hob');
    const hobX = hobCut ? (hobCut.x0 + hobCut.x1) / 2 : hobItem ? (hobItem.x0 + hobItem.x1) / 2 : 0;

    /* ---------- carcasses: boards, holes, shelf pins, legs, the fridge, plinth grilles ---------- */
    const carcasses = model.carcasses;
    for (const c of carcasses) { c.parts = []; c.movers = []; }
    const MARKER = { cup: 'markerHinge', plate: 'markerHinge', bumper: 'markerHinge', shelfPin: 'markerShelfPin', runner: 'markerRunner' };
    function holes(a, part) {                      // a disc on the drilled face, 0.6 mm proud; small holes as 12 mm markers
      for (const hole of part.holes || []) {
        const out = -hole.dir * 0.6, p = hole.axis === 'x' ? [hole.at[0] + out, hole.at[1], hole.at[2]] : [hole.at[0], hole.at[1] + out, hole.at[2]];
        const radius = hole.kind === 'bumper' ? hole.diameter / 2 : Math.max(hole.diameter / 2, 6);
        cylinder(a, radius, 1, MARKER[hole.kind], ...p, hole.axis, 32, false);
      }
    }
    function drawCarcass(carcass) {
      const r = String(carcass.group), { x0, x1, h0 } = carcass, drilled = at(r, 'holes');
      for (const b of model.boards) {
        if (b.carcassId !== carcass.id || b.frontId || b.id === 'pullOutShelf') continue;   // drawer boards and the pull-out shelf move
        board(STATIC, b, carcass);
        holes(drilled, b);
        if (b.id === 'adjustableShelf') {          // 4 pins under the shelf, in the holes settings.drilling.shelfPin places
          const pin = settings.drilling.shelfPin, pinH = b.box[4] - pin.belowShelf, d = pin.diameter / 2;
          for (const [p0, p1] of [[b.box[0] - 1, b.box[0] + 7], [b.box[1] - 7, b.box[1] + 1]]) for (const y of [carcassBack + pin.fromBack, carcassFront - pin.fromFront]) {
            box(STATIC, r, [p0, p1, y - d, y + d, pinH - d, pinH + d], 'zinc', 'shelves', { name: carcass.name + ' shelf pin' });
          }
        }
      }
      if (carcass.floor) {                         // adjustable legs, as tall as the plinth
        const L = HW.leg, a = at(r, 'legs');
        for (const x of [x0 + L.fromSide, x1 - L.fromSide]) for (const y of [carcassBack + L.fromBack, carcassFront - L.fromFront]) {
          cylinder(a, L.radius, h0 - L.footHeight, 'foot', x, y, (h0 - L.footHeight) / 2, null, 16);
          cylinder(a, L.footRadius, L.footHeight, 'foot', x, y, h0 - L.footHeight / 2, null, 20);
          envelope(r, [x - L.footRadius, x + L.footRadius, y - L.footRadius, y + L.footRadius, h0 - L.footHeight, h0], carcass.name + ' leg', 'leg');
        }
      }
      const fridge = P('fridgeFreezer').find(x => x.carcassId === carcass.id);
      if (fridge) { const o = originOf(fridge); product(appliances.fridgeFreezer, { r, fit: fitOf(fridge.fit, o), front: carcassFront - o[1], back: carcassBack - o[1] }, moved(o)); }
      if (carcass.grille) plinthGrille(carcass);
    }
    /* an aluminium grille in the plinth under a carcass that needs air (carcass.grille) */
    function plinthGrille(carcass) {
      const g = HW.plinthGrille, r = String(carcass.group), xc = (carcass.x0 + carcass.x1) / 2, w = Math.min(g.width, carcass.x1 - carcass.x0 - 80);
      const g0 = xc - w / 2, g1 = xc + w / 2, h0 = g.bottom, h1 = g.top, I = { name: 'Ventilation grille in the plinth', part: D.part() };
      const z = gb => box(STATIC, r, gb, 'zinc', 'plinth', I);
      z([g0, g1, plinthFace, plinthFace + 3, h0, h0 + 5]); z([g0, g1, plinthFace, plinthFace + 3, h1 - 5, h1]);
      z([g0, g0 + 5, plinthFace, plinthFace + 3, h0 + 5, h1 - 5]); z([g1 - 5, g1, plinthFace, plinthFace + 3, h0 + 5, h1 - 5]);
      for (let x = g0 + 17; x < g1 - 8; x += 12) z([x - 2, x + 2, plinthFace, plinthFace + 2, h0 + 5, h1 - 5]);   // louvres
    }

    /* ---------- fronts and what moves with them ---------- */
    function shakerFront(m, x0, x1, h0, h1, key, info) {   // a frame of shakerRail wide rails round a recessed panel, one part
      const w = shakerRail, y0 = frontFace - frontThickness, y1 = frontFace, I = Object.assign({ part: D.part() }, info), f = gb => box(m.cells, m.r, gb, key, 'fronts', I);
      if (x1 - x0 <= 2 * w + 20 || h1 - h0 <= 2 * w + 20) return f([x0, x1, y0, y1, h0, h1]);
      f([x0, x1, y0, y1, h1 - w, h1]); f([x0, x1, y0, y1, h0, h0 + w]); f([x0, x0 + w, y0, y1, h0 + w, h1 - w]); f([x1 - w, x1, y0, y1, h0 + w, h1 - w]);
      f([x0 + w, x1 - w, y0, frontFace - frontThickness / 2, h0 + w, h1 - w]);
    }
    /* every front gets a cup and a bar handle; the handle setting shows one (layers cup / bar) */
    const CUP = (function () {                     // an open quarter shell with its end caps, a lip and two pads, mm
      const L = HW.handle.cupLength, R = 24, drop = -12, parts = [];
      const shell = new THREE.CylinderGeometry(R, R, L - 6, 28, 1, true, 0, Math.PI / 2); shell.rotateZ(Math.PI / 2); shell.translate(0, drop, 0); parts.push(shell);
      for (const sx of [-1, 1]) { const c = new THREE.CircleGeometry(R, 20, 0, Math.PI / 2); c.rotateY(-Math.PI / 2); c.translate(sx * (L / 2 - 3), drop, 0); parts.push(c); }
      const lip = new THREE.CylinderGeometry(2.2, 2.2, L - 6, 10); lip.rotateZ(Math.PI / 2); lip.translate(0, drop, R); parts.push(lip);
      for (const sx of [-1, 1]) { const pad = new THREE.BoxGeometry(12, 26, 4); pad.translate(sx * 32, drop + 13, 2); parts.push(pad); }
      return parts;
    })();
    function handles(m, x0, x1, h0, h1, position, info) {
      if (!position) return;
      const H = HW.handle, L = H.barLength, y = frontFace + 4, cup = at(m.r, 'handles', m, ['cup']);
      const I = Object.assign({ also: ['bar'], part: D.part() }, info), bar = gb => box(m.cells, m.r, gb, 'handle', 'handles', I);
      const addCup = (x, h, turn) => { const o = new THREE.Group(); o.position.set(x, h, frontFace); o.rotation.z = turn; cup.frame.add(o);
        for (const g of CUP) detail(Object.assign({}, cup, { frame: o }), g, 'handle', 0, 0, 0); };
      if (position === 'top' || position === 'bottom') {
        const h = position === 'top' ? h1 - H.axis : h0 + H.axis, xc = (x0 + x1) / 2;
        addCup(xc, h, 0);
        bar([xc - L / 2, xc + L / 2, y + 20, y + 30, h - 6, h + 6]); bar([xc - L / 2 + 8, xc - L / 2 + 18, y, y + 20, h - 5, h + 5]); bar([xc + L / 2 - 18, xc + L / 2 - 8, y, y + 20, h - 5, h + 5]);
      } else {
        const x = position === 'left' ? x0 + H.axis : x1 - H.axis, hc = Math.min(h0 + H.sideHeight, (h0 + h1) / 2);
        addCup(x, hc, position === 'left' ? Math.PI / 2 : -Math.PI / 2);
        bar([x - 6, x + 6, y + 20, y + 30, hc - L / 2, hc + L / 2]); bar([x - 5, x + 5, y, y + 20, hc - L / 2 + 8, hc - L / 2 + 18]); bar([x - 5, x + 5, y, y + 20, hc + L / 2 - 18, hc + L / 2 - 8]);
      }
    }
    function drawFront(r, item) {
      const front = item.front, carcass = carcasses.find(c => c.id === item.carcassId), opening = front.opening, hand = front.hand;
      const { x0: fx0, x1: fx1, h0: fh0, h1: fh1, width: fw, height: fh } = front, size = Math.round(fw) + ' × ' + Math.round(fh);
      let px = 0, ph = 0, py = 0;                  // the pivot: the hinge edge of a door, the bottom edge of a dishwasher door
      if (opening === 'door' || opening === 'fridge') { px = hand === 'left' ? fx0 : fx1; py = frontFace; }
      else if (opening === 'dishwasher') { ph = item.fit.doorH0; py = frontFace; }
      const m = mover(r, opening, px, py, ph);
      Object.assign(m, { sign: hand === 'left' ? 1 : -1, item });
      if (opening === 'door' && carcass && (HW.open.doorStop || {})[carcass.name]) m.travel = HW.open.doorStop[carcass.name];
      if (carcass) carcass.movers.push(m);
      const I = { mover: m };
      shakerFront(m, fx0, fx1, fh0, fh1, K(front.material), I);
      handles(m, fx0, fx1, fh0, fh1, item.handle, I);
      if (opening === 'door' && carcass) {
        const cup = settings.drilling.cup, dir = hand === 'left' ? 1 : -1, side = front.hingeX, cupX = hand === 'left' ? fx0 + cup.fromEdge : fx1 - cup.fromEdge;
        const hw = at(r, 'hardware'), mhw = at(r, 'hardware', m);
        holes(at(r, 'fronts', m, ['holes']), front);
        for (const h of front.hinges) {
          const H = { name: 'Hinge', part: D.part() };
          box(STATIC, r, [Math.min(side, side + dir * 10), Math.max(side, side + dir * 10), carcassFront - 75, carcassFront - 30, h - 22, h + 22], 'zinc', 'hardware', H);   // mounting plate
          box(STATIC, r, [Math.min(side + dir * 3, side + dir * 20), Math.max(side + dir * 3, side + dir * 20), carcassFront - 70, carcassFront - 2, h - 9, h + 9], 'zinc', 'hardware', H);   // arm
          cylinder(mhw, cup.diameter / 2 - 0.5, HW.hinge.cupDepth, 'zinc', cupX, frontFace - frontThickness + HW.hinge.cupDepth / 2, h, 'y', 24);   // the cup in the door
          cylinder(mhw, 24, 1.5, 'zinc', cupX, carcassFront - 1, h, 'y', 24);
        }
        const bumper = settings.drilling.bumper, gap = frontFace - frontThickness - carcassFront;   // the head fills the front gap, 0.2 short of the door
        for (const b of front.bumpers || []) cylinder(hw, bumper.diameter / 2 + 1.5, gap - 0.2, 'gasket', b.x, carcassFront + (gap - 0.2) / 2, b.h, 'y', 16);
        m.label = 'Door ' + size + ' · hinges: ' + front.hinges.length + ' · bumpers: ' + (front.bumpers || []).length + (front.doorDrawers ? ' · drawers behind it: ' + front.doorDrawers.count : '');
        if (front.doorDrawers) doorDrawers(r, item, m, carcass);
      } else if (opening === 'drawer' && carcass) {
        drawer(r, item, m, carcass, size);
      } else if (opening === 'dishwasher') {
        const x = P('dishwasher').find(p => p.item === item), o = originOf(x);
        product(appliances.dishwasher, { r, m, item: Object.assign({}, item, { x0: item.x0 - o[0], x1: item.x1 - o[0], fit: minus(item.fit, o, [['bodyX0', 0], ['bodyX1', 0], ['bodyH1', 2], ['doorH0', 2], ['doorH1', 2]]) }),
          front: carcassFront - o[1], back: carcassBack - o[1] }, moved(o));
        m.label = 'Dishwasher · front ' + size + ' on the appliance door';
      } else if (opening === 'fridge' && item.fit) {
        const freezer = hasTag(item, 'freezer');
        const fridge = P('fridgeFreezer').find(x => x.carcassId === carcass.id), o = originOf(fridge);
        HOME.draw.fridgeDoor(moved(o), appliances.fridgeFreezer, { r, m, freezer, fit: fitOf(item.fit, o), front: carcassFront - o[1], shelves: [carcass.x0 + 55 - o[0], carcass.x1 - 55 - o[0]] });
        m.label = (freezer ? 'Freezer' : 'Fridge') + ' · front ' + size + ' on the appliance door';
      } else if (opening === 'fixed') m.label = 'Dummy front ' + size + ' · fixed';
      if (!m.label) m.label = 'Front ' + size;
    }
    /* a drawer: its boards, metal sides and runners (the carcass part stays, the drawer part moves); bins; an inner drawer */
    function drawer(r, item, m, carcass, size) {
      const front = item.front, { size: kind, sideHeight, innerX0, innerX1, bottomH: b0, bins, inner } = front.drawer, Dw = HW.drawer, I = { mover: m, carcass };
      const s0 = Dw.sideFromCarcass, s1 = s0 + Dw.sideThickness, y0 = carcassBack + Dw.fromBack, y1 = carcassFront - Dw.fromFront;
      const sides = (mv, h0, h1) => { for (const [a, b] of [[innerX0 + s0, innerX0 + s1], [innerX1 - s1, innerX1 - s0]]) box(mv.cells, r, [a, b, y0, y1, h0, h1], 'drawerSide', 'drawers', { mover: mv, carcass }); };
      const runners = (mv, h) => {
        for (const [a, b, c, e] of [[innerX0, innerX0 + Dw.runnerWidth, innerX0 + Dw.runnerWidth, innerX0 + s0], [innerX1 - Dw.runnerWidth, innerX1, innerX1 - s0, innerX1 - Dw.runnerWidth]]) {
          box(STATIC, r, [a, b, y0, y1 + 2, h - 24, h - 8], 'zinc', 'hardware', { name: 'Drawer runner' });
          box(mv.cells, r, [Math.min(c, e), Math.max(c, e), y0 + 8, y1 - 2, h - 20, h - 6], 'zinc', 'hardware', { mover: mv });
        }
      };
      for (const b of model.boards) if (b.frontId === front.id && !b.inner) board(m.cells, b, carcass, 'drawers', m);
      sides(m, b0 - 4, b0 + sideHeight - 4);
      if (kind === 'D') for (const [a, b] of [[innerX0 + 28, innerX0 + 32], [innerX1 - 32, innerX1 - 28]]) box(m.cells, r, [a, b, carcassBack + 46, carcassFront - 24, b0 + sideHeight - 4, b0 + sideHeight + 60], 'drawerSide', 'drawers', I);   // gallery rails
      runners(m, b0);
      if (bins) {
        const count = HW.bins.count, x0 = innerX0 + 45, x1 = innerX1 - 45, bw = (x1 - x0 - 10 * (count - 1)) / count, floor = b0 + T.drawerBox, top = floor + HW.bins.height;
        for (let j = 0; j < count; j++) {
          const a = x0 + j * (bw + 10), b = a + bw;
          openTop(m.cells, r, [a, b, carcassBack + 66, carcassFront - 44, floor, top], 4, 'binGrey', 'drawers', I);
          box(m.cells, r, [a + bw * 0.3, b - bw * 0.3, carcassFront - 54, carcassFront - 40, top - 14, top - 4], 'binGrey', 'drawers', I);
        }
      }
      const name = 'drawer ' + kind + ' (' + sideHeight + ')';
      m.label = (bins ? 'Sink ' + name + ' with waste bins' : kind === 'D' ? 'Drawer ' + kind + ' (' + sideHeight + ')' : 'Top ' + name + (inner ? ' + an inner drawer above it' : '')) + ' · front ' + size;
      if (inner) {                                  // a shallow cutlery drawer above the box, behind the same front, on its own runners
        const ih = front.drawer.innerH, im = mover(r, 'drawer', 0, 0, 0), M = settings.drawers.M.sideHeight, top = ih - 4 + M, J = { mover: im, carcass };
        Object.assign(im, { item }); carcass.movers.push(im); linkTo(m, im);
        for (const b of model.boards) if (b.frontId === front.id && b.inner) board(im.cells, b, carcass, 'drawers', im);
        sides(im, ih - 4, top);
        box(im.cells, r, [innerX0 + s1, innerX1 - s1, y1 - 16, y1 - 2, ih - 4, top], 'drawerSide', 'drawers', J);   // its metal front
        for (let j = 1; j < 5; j++) { const x = innerX0 + s1 + (innerX1 - innerX0 - 2 * s1) * j / 5; box(im.cells, r, [x - 3, x + 3, carcassBack + 76, carcassFront - 44, ih + 16, ih + 66], 'insertGrey', 'drawers', J); }
        box(im.cells, r, [innerX0 + 40, innerX1 - 40, carcassBack + 76, carcassFront - 44, ih + 16, ih + 20], 'insertGrey', 'drawers', J);
        runners(im, ih);
        im.label = 'Inner drawer M (' + M + ') for cutlery · inner front ' + (innerX1 - innerX0 - settings.drawers.inner.frontDeduction);
      }
    }
    /* drawers behind a door: each box slides out on ball runners once the door is open */
    function doorDrawers(r, item, door, carcass) {
      const front = item.front, DD = front.doorDrawers, clearance = settings.doorDrawers.clearance;
      DD.boxes.forEach((b, j) => {
        const m = mover(r, 'drawer', 0, 0, 0);
        Object.assign(m, { item, travel: DD.runnerLength, label: 'Drawer behind the door ' + (j + 1) + '/' + DD.count + ' · ' + DD.boxWidth + ' × ' + DD.runnerLength + ' × ' + DD.boxHeight + ', ball runners ' + DD.runnerLength });
        carcass.movers.push(m); linkTo(door, m);
        for (const bd of model.boards) if (bd.frontId === front.id && bd.doorDrawer === j) board(m.cells, bd, carcass, 'drawers', m);
        const h0 = b.h0 + T.drawerBox + 20, h1 = h0 + 35;
        for (const [a, c] of [[b.x0 - clearance, b.x0], [b.x1, b.x1 + clearance]]) {
          const left = a < b.x0;
          box(STATIC, r, [...(left ? [a, a + clearance / 2] : [c - clearance / 2, c]), b.y0, b.y1, h0, h1], 'zinc', 'hardware', { name: 'Ball runner' });
          box(m.cells, r, [...(left ? [a + clearance / 2, b.x0] : [b.x1, c - clearance / 2]), b.y0 + 4, b.y1 - 2, h0 + 4, h1 - 4], 'zinc', 'hardware', { mover: m });
        }
      });
    }
    /* the pull-out shelf with the coffee machine: slides out once its door is open */
    function pullOutShelf(shelf) {
      const carcass = carcasses.find(c => c.id === shelf.carcassId), r = String(carcass.group), door = carcass.movers.find(m => m.kind === 'door' && m.item === shelf.item);
      const m = mover(r, 'drawer', 0, 0, 0), [x0, x1, y0, y1, h0, h1] = shelf.box;
      Object.assign(m, { item: shelf.item }); carcass.movers.push(m);
      if (door) linkTo(door, m);
      board(m.cells, shelf, carcass, 'drawers', m);
      const spacer = model.boards.find(b => b.carcassId === carcass.id && b.id === 'spacer' && b.box[4] < h0 && b.box[5] > h0 && (b.box[1] <= x0 || b.box[0] >= x1));
      const left = spacer && spacer.box[1] <= x0 ? spacer.box[1] : carcass.x0 + T.carcass, right = spacer && spacer.box[0] >= x1 ? spacer.box[0] : carcass.x1 - T.carcass;
      for (const [a, b] of [[left, x0], [x1, right]]) {
        box(STATIC, r, [a, b, y0, y1, h0 - 14, h0], 'zinc', 'hardware', { name: 'Pull-out shelf runner' });
        box(m.cells, r, [a, b, y0 + 8, y1 - 4, h0, h0 + 12], 'zinc', 'hardware', { mover: m });
      }
      const coffee = P('coffee').find(x => x.shelf === shelf), o = originOf(coffee);
      product(appliances.coffee, { r, m, x: (x0 + x1) / 2 - o[0], h: h1 - o[2], y: y1 - 20 - o[1] }, moved(o));
      m.label = 'Pull-out shelf ' + shelf.a + ' × ' + shelf.b + ' with ' + appliances.coffee.name;
    }

    /* ---------- all of it ---------- */
    GROUP_IDS.forEach(drawGroup);
    for (const b of model.boards) if (b.id === 'backStrip') board(STATIC, b, null, 'carcasses');
    for (const p of model.frontPanels) if (!p.item) look(box(STATIC, String(p.group), placed(p), K(p.material), 'frontPanel', { check: 'frontPanel', name: 'G' + p.group + ' ' + p.name + ' ' + p.a + ' × ' + p.b }), p.material, { banded: p.edges.map(e => e.side) });
    if (sinkItem) drawSink();
    for (const x of P('hob')) {
      const o = originOf(x), cut = { x0: x.cut.x0 - o[0], x1: x.cut.x1 - o[0], y0: x.cut.y0 - o[1], y1: x.cut.y1 - o[1] };
      product(appliances.hob, { r: x.group, x: x.x - o[0], cut, top: x.top - o[2] }, moved(o));
    }
    for (const x of P('hood')) { const o = originOf(x); product(appliances.hood, { r: x.group, x: x.x - o[0], bottom: x.bottom - o[2], ceiling: x.ceiling - o[2], worktop: x.worktop - o[2] }, moved(o)); }
    carcasses.forEach(drawCarcass);
    for (const r of GROUP_IDS) for (const item of itemsOf(r)) if (FRONT_TYPES.includes(item.type)) drawFront(r, item);
    model.boards.filter(b => b.id === 'pullOutShelf').forEach(pullOutShelf);
    return { carcasses, axes: { sink: sinkX, hob: hobX } };
  }

  /* the materials of the boards for core, from their products: a decor photo, a lacquer or a colour; the bare edge its core */
  function boardLooks(model) {
    const out = {};
    for (const [code, m] of Object.entries(model.materials)) {
      const def = m.texture ? { color: '#ffffff', image: { key: m.texture }, roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.55, reflect: 0.5 }
        : m.lacquered ? { color: m.color, roughness: 0.42, clearcoat: 0.2, clearcoatRoughness: 0.45, reflect: 0.7 }
        : { color: m.color, roughness: 0.8, reflect: 0.45 };
      out['board:' + code] = def;
      if (m.texture) out['board:' + code + '~'] = Object.assign({}, def, { image: { key: m.texture, turn: true } });
      if (m.core) out['board:' + code + ':core'] = { color: m.core, roughness: 0.92, texture: { strength: 0.9, grain: 2, tile: 90 } };
    }
    return out;
  }

  HOME.cabinets = {
    TYPES, TAGS, TAG_NAMES, LABELS, typeLabel, tagsLabel, useLabel, hasTag, FRONT_TYPES, SIDES, HINGE_SIDES,
    placeLabel, gapsText, parseTags, spaceAround, valueAt, PINS_PER_SHELF, tagsOf, readType, cutKey, checkSettings, build, cutList, 
    plural, appliances, withLibrary, tree, boxIn, draw, boardLooks
  };
})();
