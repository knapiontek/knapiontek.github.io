/* engine.js - builds the kitchen model from data.js for design.html, cost.html and view.html. No drawing, no project numbers.
   Coordinates in mm per group: u along the group, v up from the floor, n out from the wall; a box is [u0, u1, v0, v1, n0, n1].
   data.columns: column widths per group, integer mm.
   data.components: g group, c first column, s column span, h height, tags (one type + features), k carcass name,
   hd handle (T | B | L | R), hg hinge side of a door (L | R), gaps [left, right, top, bottom] on fronts, note.
   ABS: carcass boards get it on the edge seen from the front (parts that are hidden get none); a panel on each edge next to a front
   that opens (a door, a drawer, an appliance door), because that edge shows when the front is open. */
(function (root) {
  'use strict';

  // type = what a component is (one per component); tag = an extra on some types
  // filler = void / spacer, nothing built; board = plasterboard box; splash = board on the wall; panel = board laid flat in the front plane;
  // frame = strip on edge in the front plane; dummy = fixed front in a carcass: no hinges, no drawer box, no back;
  // dishwasher = front on the appliance door, no carcass; fridge, freezer = front on the appliance door in a carcass
  const TYPE_TAGS = ['filler', 'board', 'plinth', 'worktop', 'splash', 'panel', 'frame', 'cabinet', 'drawer', 'dummy', 'dishwasher', 'fridge', 'freezer', 'oven', 'micro'];
  // the types each tag is allowed on; fall = worktop fall (the worktop board turned down to the floor); coffee = pull-out shelf at the bottom, no other shelves
  const TAG_TYPES = {
    hob: ['cabinet', 'drawer'], sink: ['cabinet', 'drawer', 'dummy'], bins: ['drawer'], inner: ['drawer'], fall: ['worktop'], coffee: ['cabinet']
  };
  const FEATURE_TAGS = Object.keys(TAG_TYPES);
  const FRONT_TYPES = ['cabinet', 'drawer', 'dummy', 'dishwasher', 'fridge', 'freezer'];
  const BOX_TYPES = ['cabinet', 'drawer', 'dummy', 'fridge', 'freezer', 'oven', 'micro']; // in a carcass
  // the component types made of a board: each is in the types of exactly one material (materials[code].types)
  const BOARD_TYPES = ['worktop', 'splash', 'plinth', 'panel', 'frame', ...FRONT_TYPES];
  // parts the engine adds inside a carcass: their material is named by a rule
  const PART_RULES = { carcass: 'carcass.material', back: 'back.material', drawerBox: 'drawers.material', hobPanel: 'rails.hobPanelMaterial' };
  const HANDLE_POSITIONS = ['T', 'B', 'L', 'R']; // top, bottom, left, right; "" = no handle
  const HINGE_SIDES = ['L', 'R']; // left, right; doors and fridge doors only
  const EDGE_NAMES = { T: 'top', B: 'bottom', L: 'left', R: 'right' }; // the four sides of a panel
  const OPENING_FRONT_TYPES = FRONT_TYPES.filter(type => type !== 'dummy'); // fronts that open; a dummy is fixed
  // Lacquered edges of the finished parts (they get no ABS): how many long and short edges one piece has. It follows from how the
  // kitchen is seen (from the front and from above; the island from all sides), so it is fixed here and data.js knows nothing about it.
  const LACQUERED_EDGES = { front: { long: 2, short: 2 }, frame: { long: 1, short: 0 }, plinth: { long: 0, short: 0 } };
  const FRAME_LACQUERED_SIDES = ['front']; // the long edge of a frame on edge that faces the room

  // how a component's place is printed (warnings, lists, tooltips): "G1[4]" = group 1, column 4; "G1[1-11]" = group 1, columns 1 to 11.
  // The data keeps group, column and span (g, c, s).
  const placeLabel = (group, col, span = 1) => `G${group}[${col}${span > 1 ? '-' + (col + span - 1) : ''}]`;
  const placeOf = item => placeLabel(item.group, item.col, item.span);

  function parseTags(text) {
    const tags = String(text ?? '').toLowerCase().split(/[\s,]+/).filter(Boolean);
    const types = tags.filter(t => TYPE_TAGS.includes(t));
    return {
      tags,
      types,
      type: types.length === 1 ? types[0] : null,
      features: tags.filter(t => FEATURE_TAGS.includes(t)),
      unknown: tags.filter(t => !TYPE_TAGS.includes(t) && !FEATURE_TAGS.includes(t))
    };
  }
  const hasTag = (item, ...tags) => tags.some(t => item.tags.includes(t));

  // each piece starts on top of the stack in the columns it spans; returns the pieces with u0, u1, v0, v1
  function stack(widths, pieces) {
    const columnCount = widths.length;
    const colX = [0];
    widths.forEach(w => colX.push(colX[colX.length - 1] + w));
    const occupied = widths.map(() => []); // [v0, v1] ranges per column
    const items = [], skipped = [];
    const stackTop = ranges => {
      let top = 0;
      for (const [a, b] of [...ranges].sort((p, q) => p[0] - q[0])) {
        if (a <= top) {
          if (b > top) top = b;
        } else break;
      }
      return top;
    };
    for (const piece of pieces) {
      const first = piece.col - 1, end = Math.min(first + piece.span, columnCount), height = piece.height;
      if (first < 0 || first >= columnCount || !(piece.span >= 1) || !(height >= 0)) {
        skipped.push({ piece, why: 'columns' });
        continue;
      }
      let v0 = 0;
      for (let k = first; k < end; k++) v0 = Math.max(v0, stackTop(occupied[k]));
      const overlaps = occupied.slice(first, end).some(ranges => ranges.some(([a, b]) => Math.max(v0, a) < Math.min(v0 + height, b)));
      if (overlaps) {
        skipped.push({ piece, why: 'overlap' });
        continue;
      }
      for (let k = first; k < end; k++) occupied[k].push([v0, v0 + height]);
      items.push({ ...piece, u0: colX[first], u1: colX[end], v0, v1: v0 + height });
    }
    return { items, skipped, colX };
  }

  // items with the same carcass name: width over all their columns, height of their boxes (fronts, appliances)
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

  function frontBox(item) {
    const [left, right, top, bottom] = item.gaps;
    return { u0: item.u0 + left, u1: item.u1 - right, v0: item.v0 + bottom, v1: item.v1 - top };
  }

  // data.js component -> item fields
  function readComponent(c, index) {
    const parsed = parseTags(c.tags);
    return {
      index,
      group: +c.g,
      col: +c.c,
      span: +c.s,
      height: c.h,
      type: parsed.type || '',
      tags: parsed.tags,
      carcassName: String(c.k || '').trim(),
      handle: c.hd || '',
      hinge: c.hg || '',
      gaps: Array.isArray(c.gaps) ? c.gaps.map(x => (x === '' || x == null ? NaN : Number(x))) : null, // an empty gap is not 0
      note: c.note || ''
    };
  }

  // board type or part -> material code: types from materials[code].types, parts from their rule; problems stop the build
  function materialUses(rules) {
    const materials = (rules && rules.materials) || {}, materialFor = {}, problems = [];
    for (const [code, m] of Object.entries(materials)) {
      if (!(m.thickness > 0)) problems.push(`Material ${code}: thickness must be > 0.`);
      for (const type of m.types || []) {
        if (!BOARD_TYPES.includes(type)) problems.push(`Material ${code}: "${type}" is not a board type (${BOARD_TYPES.join(', ')}).`);
        else if (materialFor[type]) problems.push(`Type ${type} is in two materials: ${materialFor[type]} and ${code}.`);
        else materialFor[type] = code;
      }
    }
    for (const type of BOARD_TYPES) if (!materialFor[type]) problems.push(`No material has the type ${type}.`);
    for (const [part, path] of Object.entries(PART_RULES)) {
      const code = path.split('.').reduce((o, k) => (o ? o[k] : undefined), rules || {});
      if (materials[code]) materialFor[part] = code;
      else problems.push(`Rule ${path}: material "${code ?? ''}" is not in the materials.`);
    }
    const frontThicknesses = new Set(FRONT_TYPES.filter(t => materialFor[t]).map(t => materials[materialFor[t]].thickness));
    if (frontThicknesses.size > 1) problems.push(`The front materials (${FRONT_TYPES.join(', ')}) must have one thickness: the front plane.`);
    return { materialFor, problems };
  }
  const checkMaterials = rules => materialUses(rules).problems;

  function build(project) {
    const P = project || {}, rules = P.rules || {};
    // every thickness comes from the material of the type or part
    const { materialFor } = materialUses(rules);
    const thickness = Object.fromEntries(Object.entries(materialFor).map(([use, code]) => [use, rules.materials[code].thickness]));
    // label of each material: name + thickness, e.g. "Chipboard dark grey 18"
    const materials = Object.fromEntries(Object.entries(rules.materials).map(([code, m]) => [code, { ...m, label: m.name + ' ' + m.thickness }]));
    const board = thickness.carcass, frontThickness = thickness.cabinet, carcassDepth = rules.carcass.depth;
    // depths from the wall (n)
    const carcassBack = rules.carcass.wallGap;
    const carcassFront = carcassBack + carcassDepth;
    const frontFace = carcassFront + frontThickness;
    const plinthFace = frontFace - rules.plinth.setback;

    // group roles from the project notes: note "group N" -> role (worktop, tall, island); the rules are written per role
    const roles = {};
    for (const [name, description] of P.notes || []) {
      const m = /^group\s+(\d+)$/i.exec(String(name ?? '').trim());
      if (m) roles[m[1]] = String(description ?? '').trim().toLowerCase();
    }
    const islandGroups = rules.island && rules.island.backPanel ? Object.keys(roles).filter(g => roles[g] === 'island') : [];

    // issues: { index of the component, text, skipped }; warnings: their texts
    const issues = [], warnings = [];
    const warn = (text, index = null, skipped = false) => {
      issues.push({ index, text, skipped });
      warnings.push(text);
    };
    const groups = {}, carcasses = [], fronts = [], boards = [];
    const frames = [], plinths = [], panels = [], plaster = [];
    // used by cost.html as {n:name}
    const counts = {
      carcasses: 0, fronts: 0, handles: 0, hinges: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0,
      plasterUD: 0, plasterCD: 0, plasterEdge: 0, plinthHeight: 0
    };

    // ---- components ----
    const columns = P.columns || {}, pieces = [];
    (P.components || []).forEach((c, index) => {
      const piece = readComponent(c, index), parsed = parseTags(c.tags), at = placeOf(piece);
      if (!(String(c.g) in columns)) return warn(`${at}: group ${c.g} has no columns - skipped.`, index, true);
      if (!Number.isInteger(piece.height)) return warn(`${at}: height "${c.h}" must be an integer mm - skipped.`, index, true);
      if (!piece.type) {
        return warn(`${at}: tags need exactly one type: ${TYPE_TAGS.join(', ')}${parsed.types.length ? ' (found ' + parsed.types.join(' + ') + ')' : ''} - skipped.`, index, true);
      }
      for (const tag of parsed.features) if (!TAG_TYPES[tag].includes(parsed.type)) warn(`${at}: tag ${tag} is only for ${TAG_TYPES[tag].join(', ')}.`, index);
      if (parsed.unknown.length) warn(`${at}: unknown tag ${parsed.unknown.join(', ')} (known: ${[...TYPE_TAGS, ...FEATURE_TAGS].join(', ')}).`, index);
      if (piece.handle && !FRONT_TYPES.includes(piece.type)) warn(`${at}: a ${piece.type} cannot have a handle.`, index);
      else if (piece.handle && !HANDLE_POSITIONS.includes(piece.handle)) warn(`${at}: handle "${piece.handle}" must be one of ${HANDLE_POSITIONS.join(', ')}.`, index);
      pieces.push(piece);
    });

    // ---- groups ----
    for (const [g, columnWidths] of Object.entries(columns)) {
      const widths = columnWidths;
      widths.forEach((w, i) => { if (!Number.isInteger(w)) warn(`${placeLabel(g, i + 1)}: column width "${w}" must be an integer mm.`); });
      const stacked = stack(widths, pieces.filter(p => String(p.group) === g));
      for (const { piece, why } of stacked.skipped) {
        warn(`${placeOf(piece)}: ${piece.type} ${why === 'overlap' ? 'overlaps another component' : 'is outside the columns'} - skipped.`, piece.index, true);
      }
      groups[g] = {
        group: +g,
        widths,
        colX: stacked.colX,
        length: stacked.colX[stacked.colX.length - 1],
        items: stacked.items,
        areas: carcassAreas(stacked.items)
      };
      // a board seen on edge must be as thick as its material: worktop (fall: its width), frame
      for (const item of stacked.items) {
        const width = item.u1 - item.u0, height = item.v1 - item.v0;
        const [part, size, what] = item.type === 'worktop' ? ['worktop', hasTag(item, 'fall') ? width : height, hasTag(item, 'fall') ? 'width' : 'height']
          : item.type === 'frame' ? ['frame', Math.min(width, height), height > width ? 'width' : 'height'] : [];
        if (part && size !== thickness[part]) warn(`${placeOf(item)}: ${item.type} ${what} ${size} does not match its material ${materials[materialFor[part]].label}.`, item.index);
      }
    }
    for (const c of P.components || []) {
      for (const t of String(c.tags || '').toLowerCase().split(/[\s,]+/).filter(Boolean)) counts['tag:' + t] = (counts['tag:' + t] || 0) + 1;
    }

    // ---- carcasses: one per carcass name ----
    const groupOfName = new Map();
    for (const G of Object.values(groups)) {
      for (const area of G.areas) {
        if (groupOfName.has(area.name)) {
          warn(`Carcass ${area.name} is used in Group ${groupOfName.get(area.name)} and Group ${G.group} - one carcass must stay in one group.`, area.members[0].index);
          continue;
        }
        groupOfName.set(area.name, G.group);
        const boxes = area.members.filter(i => BOX_TYPES.includes(i.type)).sort((a, b) => a.v0 - b.v0 || a.u0 - b.u0);
        carcasses.push({
          name: area.name, group: G.group, col: area.firstCol, span: area.lastCol - area.firstCol + 1,
          u0: area.u0, u1: area.u1, v0: area.v0, v1: area.v1, boxes, members: area.members
        });
      }
    }
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        if (BOX_TYPES.includes(item.type) && !item.carcassName) warn(`${placeOf(item)}: ${item.type} has no carcass name.`, item.index);
      }
    }
    carcasses.forEach((K, i) => {
      K.id = i + 1;
      // floor: stands on a plinth; base: floor with a worktop on top
      const overlapsColumns = item => item.col <= K.col + K.span - 1 && item.col + item.span - 1 >= K.col;
      const groupItems = groups[K.group].items;
      K.floor = groupItems.some(item => item.type === 'plinth' && overlapsColumns(item) && item.v1 === K.v0);
      K.base = K.floor && groupItems.some(item => item.type === 'worktop' && overlapsColumns(item) && item.v0 === K.v1);
      K.type = K.base ? 'base' : K.floor ? 'tall' : 'wall';
      K.sink = K.boxes.some(b => hasTag(b, 'sink'));
      K.fridge = K.boxes.some(b => b.type === 'fridge' || b.type === 'freezer');
      K.coffee = K.boxes.some(b => hasTag(b, 'coffee'));
      K.hob = K.boxes.some(b => hasTag(b, 'hob'));
      K.legs = K.floor ? rules.legsPerCarcass : 0;
      K.grille = K.fridge && K.floor;
      for (const item of K.members) item.carcass = K;
      counts.legs += K.legs;
      counts.sinks += K.sink;
      counts.hobs += K.hob;
      counts.fridges += K.fridge;
      counts.grilles += K.grille;
    });
    counts.carcasses = carcasses.length;

    // ---- carcass boards ----
    const addBoard = b => {
      boards.push(b);
      return b;
    };
    const rails = rules.rails, shelf = rules.shelf, back = rules.back, half = board / 2;
    for (const K of carcasses) {
      const { u0, u1, v0, v1 } = K;
      const width = u1 - u0, height = v1 - v0;
      const innerU0 = u0 + board, innerU1 = u1 - board, innerWidth = width - 2 * board;
      const carcassMaterial = materialFor.carcass;
      // id: kind of board, the same for all sizes (used for colours and counts on the pages); edges: ABS edges [[side, length]]
      const part = (id, name, a, b, material, layer, box, edges = []) => addBoard({ id, name, a, b, material, layer, group: K.group, carcassId: K.id, box, edges });
      const front = length => [['front', length]];

      part('side', 'Side', carcassDepth, height, carcassMaterial, 'carcasses', [u0, innerU0, v0, v1, carcassBack, carcassFront], front(height));
      part('side', 'Side', carcassDepth, height, carcassMaterial, 'carcasses', [innerU1, u1, v0, v1, carcassBack, carcassFront], front(height));
      part('bottom', 'Bottom panel', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v0, v0 + board, carcassBack, carcassFront], front(innerWidth));
      const railName = 'Top rail ' + rails.depth;
      // a rail on edge shows its bottom edge when the drawer below is open; a rear rail is hidden
      const bottomEdge = [['bottom', innerWidth]];
      if (K.base) {
        if (K.sink) {
          // under the sink the rails stand on edge to clear the bowl
          part('rail', railName + ' front, on edge', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassFront - board, carcassFront], bottomEdge);
          part('rail', railName + ' back, on edge', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
        } else if (K.hob) {
          // under the hob: front rail on edge (hobFront high), rear rail on edge, separation panel below the front rail, air gap at the back
          part('rail', 'Top rail ' + rails.hobFront + ' front, on edge', innerWidth, rails.hobFront, carcassMaterial, 'carcasses',
            [innerU0, innerU1, v1 - rails.hobFront, v1, carcassFront - board, carcassFront], bottomEdge);
          part('rail', railName + ' back, on edge', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
          part('hobPanel', 'Hob separation panel', innerWidth, carcassDepth - 2 * board - rails.hobPanelGap, materialFor.hobPanel, 'carcasses',
            [innerU0, innerU1, v1 - rails.hobFront, v1 - rails.hobFront + thickness.hobPanel, carcassBack + board + rails.hobPanelGap, carcassFront - board]);
        } else {
          // two flat top rails, front and back
          part('rail', railName + ' front', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassFront - rails.depth, carcassFront], front(innerWidth));
          part('rail', railName + ' back', innerWidth, rails.depth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassBack + rails.depth]);
        }
      } else {
        part('top', 'Top panel', innerWidth, carcassDepth, carcassMaterial, 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassFront], front(innerWidth));
      }

      // back only behind cabinet doors: not behind drawers, fixed (dummy) fronts or appliances (oven, micro, fridge, freezer);
      // one piece per run of doors
      const doorSpans = K.boxes
        .filter(b => b.type === 'cabinet')
        .map(b => [Math.max(v0, b.v0), Math.min(v1, b.v1)])
        .sort((a, b) => a[0] - b[0])
        .reduce((runs, span) => {
          const last = runs[runs.length - 1];
          if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
          else runs.push([...span]);
          return runs;
        }, []);
      for (const [s0, s1] of doorSpans) {
        part('back', 'Back', width - 2 * back.inset, s1 - s0 - 2 * back.inset, materialFor.back, 'backs',
          [u0 + back.inset, u1 - back.inset, s0 + back.inset, s1 - back.inset, carcassBack - thickness.back, carcassBack]);
      }

      // fixed shelves at the joint of 2 boxes in one carcass: full carcass depth
      if (!K.base && !K.fridge) {
        for (let i = 1; i < K.boxes.length; i++) {
          const joint = K.boxes[i].v0;
          part('fixedShelf', 'Fixed shelf', innerWidth, carcassDepth, carcassMaterial, 'shelves', [innerU0, innerU1, joint - half, joint + half, carcassBack, carcassFront], front(innerWidth));
          counts.shelvesFixed++;
        }
      }

      const adjustableShelf = centre => {
        part('adjustableShelf', 'Adjustable shelf', innerWidth - 2 * shelf.clearance, carcassDepth - shelf.setback, carcassMaterial, 'shelves',
          [innerU0 + shelf.clearance, innerU1 - shelf.clearance, centre - half, centre + half, carcassBack, carcassFront - shelf.setback], front(innerWidth - 2 * shelf.clearance));
        counts.shelvesAdjustable++;
        counts.shelfPins += shelf.pins;
      };
      // tag coffee (rules.pullOutShelf): one pull-out shelf at the bottom on full-extension runners, no other shelves
      if (K.coffee) {
        const pullOut = rules.pullOutShelf, y = v0 + board + pullOut.lift;
        part('pullOutShelf', 'Pull-out shelf', innerWidth - 2 * pullOut.clearance, pullOut.depth, carcassMaterial, 'shelves',
          [innerU0 + pullOut.clearance, innerU1 - pullOut.clearance, y, y + board, carcassFront - pullOut.depth, carcassFront], front(innerWidth - 2 * pullOut.clearance));
        counts.pullOutShelves++;
        // shelves above the machine: the first one pullOut.space above the pull-out shelf, the rest evenly up to the top
        const lo = y + board + pullOut.space, hi = v1 - board;
        for (let j = 0; j < (pullOut.shelvesAbove || 0); j++) adjustableShelf(Math.round(lo + ((hi - lo) * j) / pullOut.shelvesAbove));
      }
      // adjustable shelves: per door by its height (rules.shelf.perDoor); none in the sink unit or the fridge
      if (!K.sink && !K.fridge && !K.coffee) {
        for (const b of K.boxes) {
          if (b.type !== 'cabinet') continue;
          const lo = b.v0 === v0 ? v0 + board : b.v0 + half;
          const hi = b.v1 === v1 ? v1 - board : b.v1 - half;
          const count = shelf.perDoor.find(([maxHeight]) => b.v1 - b.v0 <= maxHeight)[1];
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
            name: (height > width ? 'Frame ' : 'Horizontal frame ') + thickness.frame + ' on edge (' + frameRule.depth + ' deep)',
            a: frameRule.depth, b: Math.max(width, height), lacquer: LACQUERED_EDGES.frame, lacqueredSides: FRAME_LACQUERED_SIDES
          });
          if (!item.carcassName) {
            addBoard({
              id: 'backStrip', name: 'Back strip ' + frameRule.depth, a: frameRule.depth, b: Math.max(width, height), material: materialFor.carcass, layer: 'carcasses',
              group: G.group, col: item.col, box: [u0, u1, v0, v1, carcassBack, carcassBack + frameRule.depth], strip: true, edges: [] // hidden behind its frame
            });
          }
        } else if (item.type === 'panel') {
          // an edge shows when the front next to it opens: ABS on each side whose neighbour (touching, overlapping) is a front that opens
          const overlaps = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0;
          const neighbour = {
            L: o => o.u1 === item.u0 && overlaps(o.v0, o.v1, item.v0, item.v1), R: o => o.u0 === item.u1 && overlaps(o.v0, o.v1, item.v0, item.v1),
            T: o => o.v0 === item.v1 && overlaps(o.u0, o.u1, item.u0, item.u1), B: o => o.v1 === item.v0 && overlaps(o.u0, o.u1, item.u0, item.u1)
          };
          const edges = Object.keys(EDGE_NAMES)
            .filter(side => G.items.some(other => OPENING_FRONT_TYPES.includes(other.type) && neighbour[side](other)))
            .map(side => [EDGE_NAMES[side], side === 'T' || side === 'B' ? width : height]);
          panels.push({ group: G.group, item, material: materialFor.panel, name: 'Panel ' + thickness.panel, a: width, b: height, box: [u0, u1, v0, v1, frontFace - thickness.panel, frontFace], edges });
        } else if (item.type === 'plinth') {
          plinths.push({ group: G.group, item, material: materialFor.plinth, a: height, b: width, box: [u0, u1, v0, v1, plinthFace - thickness.plinth, plinthFace], lacquer: LACQUERED_EDGES.plinth });
          counts.plinthHeight = Math.max(counts.plinthHeight, height);
        } else if (item.type === 'board' && plasterRule) {
          // cladding: the face plus the return along the long side; profiles: UD on both fixed edges, CD on the outer edge + cross pieces
          const long = Math.max(width, height), short = Math.min(width, height), depth = plasterRule.depth;
          plaster.push(
            { group: G.group, item, name: 'Plasterboard face', a: short, b: long },
            { group: G.group, item, name: 'Plasterboard return', a: depth, b: long }
          );
          counts.plasterUD += 2 * long;
          counts.plasterCD += long + (Math.ceil(long / plasterRule.studSpacing) + 1) * (depth + short);
          counts.plasterEdge += long; // one outer edge (corner bead) and one joint to the furniture (seal) per box
        }
      }
    }

    // ---- worktops: depth by group role; behind the carcass = depth - carcass - front - overhang (600 -> 14, 900 -> 314) ----
    const worktopRule = rules.worktop || {}, worktops = {};
    for (const G of Object.values(groups)) {
      if (!G.items.some(i => i.type === 'worktop')) continue;
      const role = roles[G.group], depth = (rules.materials[materialFor.worktop].depth || {})[role];
      if (!Number.isFinite(depth)) {
        warn(`Group ${G.group}: worktop needs a group role in the notes ("group ${G.group}") and a depth for it in the worktop material (role: ${role || 'none'}).`);
        continue;
      }
      const behind = depth - carcassDepth - frontThickness - worktopRule.overhang;
      if (behind < 0) warn(`Group ${G.group}: worktop ${depth} is shorter than carcass + front + overhang (${carcassDepth + frontThickness + worktopRule.overhang}).`);
      const top = G.items.find(i => i.type === 'worktop' && !hasTag(i, 'fall')); // the top board, not a worktop fall
      worktops[G.group] = { n0: carcassBack - behind, n1: frontFace + worktopRule.overhang, depth, back: behind, v0: top.v0, v1: top.v1, thickness: thickness.worktop };
      counts['worktop:' + G.group] = depth;
    }

    // ---- island back panel: in the panel material, between the end columns, floor to the carcass tops ----
    for (const g of islandGroups) {
      const G = groups[g];
      if (!G) continue;
      const firstWidth = G.widths[0] || 0, lastWidth = G.widths[G.widths.length - 1] || 0;
      const top = Math.max(0, ...carcasses.filter(K => K.group === G.group).map(K => K.v1));
      panels.push({
        group: G.group, material: materialFor.panel, name: 'Island back panel ' + thickness.panel, a: G.length - firstWidth - lastWidth, b: top, edges: [],
        box: [firstWidth, G.length - lastWidth, 0, top, carcassBack - thickness.panel, carcassBack]
      });
    }

    // ---- fronts, hinges, drawer boxes ----
    const hingeRule = rules.hinges, drawerRule = rules.drawers;
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        if (!FRONT_TYPES.includes(item.type)) continue;
        if (!item.gaps || item.gaps.length !== 4 || item.gaps.some(x => !Number.isFinite(x))) {
          warn(`${placeOf(item)}: ${item.type} needs 4 gaps [left, right, top, bottom] - drawn without gaps.`, item.index);
          item.gaps = [0, 0, 0, 0];
        }
        const box = frontBox(item), K = item.carcass;
        if (box.u1 - box.u0 <= 0 || box.v1 - box.v0 <= 0) warn(`${placeOf(item)}: gaps leave no front.`, item.index);
        const opening = item.type === 'dummy' ? 'fixed'
          : item.type === 'drawer' ? 'drawer'
          : item.type === 'dishwasher' ? 'dishwasher'
          : item.type === 'fridge' || item.type === 'freezer' ? 'fridge'
          : 'door';
        const hinged = opening === 'door' || opening === 'fridge';
        if (hinged && !HINGE_SIDES.includes(item.hinge)) warn(`${placeOf(item)}: a door needs a hinge side ${HINGE_SIDES.join(' or ')}.`, item.index);
        if (hinged && item.hinge === item.handle) warn(`${placeOf(item)}: hinge and handle on the same side.`, item.index);
        if (!hinged && item.hinge) warn(`${placeOf(item)}: only doors have a hinge side.`, item.index);
        // hinges are screwed to a carcass side: when the door does not reach one on its hinge side, the engine adds an ortho panel
        // (a board in the carcass material, hinges.supportDepth deep, at the front) at the hinge edge of the door, as high as the door
        if (hinged && K && HINGE_SIDES.includes(item.hinge) && (item.hinge === 'L' ? item.u0 !== K.u0 : item.u1 !== K.u1)) {
          const panelU0 = item.hinge === 'L' ? item.u0 : item.u1 - board, panelV0 = Math.max(item.v0, K.v0 + board), panelV1 = Math.min(item.v1, K.v1 - board);
          addBoard({
            id: 'side', name: 'Ortho panel', a: hingeRule.supportDepth, b: panelV1 - panelV0, material: materialFor.carcass, layer: 'carcasses', group: G.group, carcassId: K.id,
            box: [panelU0, panelU0 + board, panelV0, panelV1, carcassFront - hingeRule.supportDepth, carcassFront], edges: [['front', panelV1 - panelV0]]
          });
        }
        const front = {
          id: fronts.length + 1, group: G.group, item, carcassId: K ? K.id : null, opening, tags: item.tags, gaps: item.gaps,
          ...box, width: box.u1 - box.u0, height: box.v1 - box.v0, handle: item.handle, hingeSide: hinged ? item.hinge : '', material: materialFor[item.type], lacquer: LACQUERED_EDGES.front
        };
        item.front = front;
        fronts.push(front);
        counts.fronts++;
        if (item.handle) counts.handles++;

        if (opening === 'door' && K) {
          const count = hingeRule.perDoor.find(([maxHeight]) => front.height < maxHeight)[1];
          front.hinges = Array.from({ length: count }, (_, j) => Math.round(front.v0 + hingeRule.fromEnd + ((front.height - 2 * hingeRule.fromEnd) * j) / (count - 1)));
          front.hingeU = front.hingeSide === 'R' ? item.u1 - board : item.u0 + board; // on the carcass side or the ortho panel
          counts.hinges += count;
        }

        if (opening === 'drawer' && K) {
          const size = front.height >= drawerRule.dFrom ? 'D' : 'M', sizeRule = drawerRule[size];
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
          const n0 = drawerRule.bottom.z, n1 = drawerRule.bottom.z + drawerRule.bottom.depth, t = thickness.drawerBox;
          const drawerBoards = (v, backHeight, backName, inner) => {
            const common = { material: materialFor.drawerBox, layer: 'drawers', group: G.group, carcassId: K.id, frontId: front.id, inner };
            addBoard({ id: 'drawerBottom', name: 'Drawer bottom', a: drawer.bottomWidth, b: drawerRule.bottom.depth, ...common, box: [bottomU0, bottomU1, v, v + t, n0, n1] });
            addBoard({ id: 'drawerBack', name: backName, a: innerU1 - innerU0 - drawerRule.back.inset, b: backHeight, ...common, box: [backU0, backU1, v + t, v + t + backHeight, n0, n0 + t] });
          };
          drawerBoards(drawer.bottomV, drawer.backHeight, 'Drawer back ' + size, false);
          size === 'D' ? counts.drawersD++ : counts.drawersM++;
          if (drawer.inner) {
            // inner drawer above the top drawer box, behind the same front
            drawer.innerV = drawer.bottomV + drawer.sideHeight + drawerRule.inner.gap;
            drawerBoards(drawer.innerV, drawerRule.inner.back, 'Inner drawer back', true);
            counts.innerDrawers++;
          }
        }
      }
    }

    return {
      rules, roles, warnings, issues, counts, thickness, materials, materialFor, frontThickness,
      carcassDepth, carcassBack, carcassFront, frontFace, plinthFace, // n: from the wall
      groups, carcasses, fronts, boards, frames, plinths, panels, plaster, worktops
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
        type: K.type,
        flags: ['sink', 'hob', 'fridge', 'coffee'].filter(f => K[f]),
        members: K.members.map(i => ({ col: i.span > 1 ? [i.col, i.col + i.span - 1] : i.col, tags: i.tags.join(' '), x: [i.u0, i.u1], y: [i.v0, i.v1] })),
        boards: cutList(model.boards.filter(b => b.carcassId === K.id)).map(([name, a, b, qty]) => (qty > 1 ? qty + ' × ' : '') + name + ' ' + a + ' × ' + b),
        legs: K.legs
      };
      if (roomPosition) entry.room = roomPosition(K);
      return entry;
    });
  }

  // one carcass per block, short arrays on one line
  function mapJSON(map) {
    const field = ([key, value]) =>
      '    ' + JSON.stringify(key) + ': ' +
      ((key === 'members' || key === 'boards') && value.length ? '[\n' + value.map(x => '      ' + json1(x)).join(',\n') + '\n    ]' : json1(value));
    return '[\n' + map.map(entry => '  {\n' + Object.entries(entry).map(field).join(',\n') + '\n  }').join(',\n') + '\n]\n';
  }

  function json1(value) {
    if (Array.isArray(value)) return '[' + value.map(json1).join(', ') + ']';
    if (value && typeof value === 'object') return '{' + Object.entries(value).map(([k, x]) => JSON.stringify(k) + ': ' + json1(x)).join(', ') + '}';
    return JSON.stringify(value);
  }

  // parts with the same name, size and ABS edges counted together: [name, a, b, qty, where, edges],
  // where = "at" labels, e.g. "K2, K5 ×2"; edges = ABS edges of one part [[side, length]]; lacquer = lacquered edges of one part
  function cutList(parts) {
    const rows = new Map();
    for (const p of parts) {
      const key = p.name + '|' + p.a + '|' + p.b + '|' + JSON.stringify(p.edges || []) + '|' + JSON.stringify(p.lacquer || null);
      const row = rows.get(key) || { qty: 0, at: new Map() };
      row.qty++;
      if (p.at) row.at.set(p.at, (row.at.get(p.at) || 0) + 1);
      rows.set(key, row);
    }
    return [...rows].map(([key, row]) => {
      const [name, a, b, edges, lacquer] = key.split('|');
      const where = [...row.at].map(([label, n]) => (n > 1 ? label + ' ×' + n : label)).join(', ');
      return [name, Number(a), Number(b), row.qty, where, JSON.parse(edges), JSON.parse(lacquer)]; // edges: ABS [[side, length]]; lacquer: {long, short} edges of a front, frame, plinth
    });
  }

  // data.js sets window.KITCHEN_DATA (a script tag, so the pages also work from file://)
  function load() {
    const data = root.KITCHEN_DATA;
    return data ? Promise.resolve(data) : Promise.reject(new Error('data.js not found next to this page'));
  }
  // one rule / note / component per line, a blank line between groups
  function dataJS(project) {
    const J = json1;
    const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
    // a table (an object of objects, e.g. rules.materials) gets one line per entry
    const value = v => (isObject(v) && Object.values(v).every(isObject)
      ? '{\n' + Object.entries(v).map(([k, x]) => '   ' + J(k) + ': ' + J(x)).join(',\n') + '\n  }'
      : J(v));
    const entries = obj => Object.entries(obj || {}).map(([k, v]) => '  ' + J(k) + ': ' + value(v)).join(',\n');
    const components = project.components.map((c, i) => (i && c.g !== project.components[i - 1].g ? '\n' : '') + '  ' + J(c)).join(',\n');
    return '/* Kitchen project data - shared by design.html, cost.html and view.html.\n' +
      '   Plain JSON after "window.KITCHEN_DATA =". Edit it in design.html (Import data / Export data). */\n' +
      'window.KITCHEN_DATA = {\n "rules": {\n' + entries(project.rules) +
      '\n },\n "notes": [\n' + project.notes.map(n => '  ' + J(n)).join(',\n') +
      '\n ],\n "columns": {\n' + entries(project.columns) +
      '\n },\n "components": [\n' + components + '\n ]\n};\n';
  }
  function fromDataJS(text) {
    const i = text.indexOf('{'), j = text.lastIndexOf('}');
    if (i < 0 || j < i) throw new Error('no JSON object found');
    return JSON.parse(text.slice(i, j + 1));
  }

  root.KitchenEngine = {
    TYPE_TAGS, FEATURE_TAGS, FRONT_TYPES, BOX_TYPES, HANDLE_POSITIONS, HINGE_SIDES, EDGE_NAMES, LACQUERED_EDGES, placeLabel,
    BOARD_TYPES, PART_RULES, TAG_TYPES, checkMaterials, parseTags, build, cutList, carcassMap, mapJSON,
    load, dataJS, fromDataJS
  };
})(typeof window !== 'undefined' ? window : globalThis);
