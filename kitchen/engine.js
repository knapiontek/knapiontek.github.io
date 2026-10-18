/* engine.js - kitchen construction engine, shared by design.html, cost.html and view.html.

   build(project) is a pure function of the project data (data.js). Every size comes from project.rules; this file holds no
   project numbers and draws nothing: it returns positioned parts (mm) that the pages draw (design, view), price or list (cost).

   DATA FLOW   data.js -> build() -> model -> design.html (2D elevations), view.html (3D room), cost.html (estimate, cutting list)

   COORDINATES (mm, per group)
     u  along the group, from the left edge of its first column
     v  up from the floor
     n  out from the wall: 0 = wall, carcass back at rules.wallGap, front face at wallGap + carcassDepth + frontThickness
   view.html turns each group into room coordinates (x, y, z); a box is [u0, u1, v0, v1, n0, n1].

   GLOSSARY - the same words are used in the data, in this file and on the pages
     group      one run of furniture (data.columns key); its role (worktop, tall, island) comes from the note "group N"
     column     one width in a group (data.columns[group]); components are placed by first column + column span
     component  one row of data.components; stacked bottom-up in its columns, in list order
     item       a component after stacking: the component with readable field names and its position (u0, u1, v0, v1)
     type       exactly one TYPE_TAGS tag of a component (cabinet, drawer, frame ...)
     features   the FEATURE_TAGS tags of a component (sink, hob, fridge ...)
     carcass    all items with the same carcass name in one group: one chipboard box. Its type is base (on a plinth,
                worktop on top), tall (on a plinth) or wall (anything else)
     box        an item that sits inside a carcass (BOX_TYPES): a front or a built-in appliance
     front      the visible face of a cabinet, drawer or dummy item: the item minus its 4 gaps
     opening    how a front moves: door (hinged), drawer, dishwasher, fridge (on the appliance door), fixed
     board      a cut chipboard / HDF part (cutting list): a × b = cut size, box = position, material p18 | p16 | hdf

   DATA FORMAT of data.components (short keys, kept as they are in data.js)
     g group, c first column, s column span, h height, tags (one type + features), k carcass name ("" = no carcass),
     gaps [left, right, top, bottom] (fronts only), hd handle position T | B | L | R | "", note free text
*/
(function (root) {
  'use strict';

  // filler = void / spacer, nothing built; board = plasterboard box; splash = splash board on the wall (worktop material);
  // panel = MDF board laid flat in the front plane, both faces lacquered; frame = MDF strip on edge, edge + both faces lacquered;
  // dummy = fixed front in a carcass: no hinges, no drawer box, no HDF behind
  const TYPE_TAGS = ['filler', 'board', 'plinth', 'worktop', 'splash', 'panel', 'frame', 'cabinet', 'drawer', 'dummy', 'oven', 'micro'];
  // end = worktop end (waterfall); coffee = pull-out shelf at the bottom for a coffee machine, no other shelves
  const FEATURE_TAGS = ['hob', 'sink', 'bins', 'dishwasher', 'fridge', 'freezer', 'inner', 'end', 'coffee'];
  const FRONT_TYPES = ['cabinet', 'drawer', 'dummy'];
  const BOX_TYPES = ['cabinet', 'drawer', 'dummy', 'oven', 'micro'];

  const num = (value, fallback) => {
    const x = parseFloat(value);
    return Number.isFinite(x) ? x : fallback;
  };

  // "drawer hob" -> { tags, types, type: 'drawer', features: ['hob'], unknown: [] }
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

  /* ---------- stacking: an item starts on top of the contiguous stack from the floor in the columns it spans ----------
     widths: column widths of one group; pieces: [{ col, span, height, ... }] in list order.
     Returns items (the pieces with u0, u1, v0, v1 added), skipped pieces with the reason, and the column edges colX. */
  function stack(widths, pieces) {
    const columnCount = widths.length;
    const colX = [0];
    widths.forEach(w => colX.push(colX[colX.length - 1] + w));
    const occupied = widths.map(() => []); // per column: [v0, v1] ranges already taken
    const items = [], skipped = [];
    // top of the contiguous stack that starts at the floor
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

  /* ---------- carcass areas: all items with the same carcass name in one group ----------
     width = all their columns; height = their boxes (fronts, appliances), or all members if there is no box */
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

  /* ---------- front = item minus its four gaps [left, right, top, bottom] ---------- */
  function frontBox(item) {
    const [left, right, top, bottom] = item.gaps;
    return { u0: item.u0 + left, u1: item.u1 - right, v0: item.v0 + bottom, v1: item.v1 - top };
  }

  // a data.js component with readable field names (see DATA FORMAT above)
  function readComponent(group, c) {
    const parsed = parseTags(c.tags);
    return {
      group: +group,
      col: +c.c,
      span: +c.s,
      height: +c.h,
      type: parsed.type || '',
      tags: parsed.tags,
      carcassName: String(c.k || '').trim(),
      handle: c.hd || '',
      gaps: Array.isArray(c.gaps) ? c.gaps.map(Number) : null,
      note: c.note || ''
    };
  }

  /* ---------- the model ---------- */
  function build(project) {
    const P = project || {}, rules = P.rules || {};
    const board = rules.board, frontThickness = rules.frontThickness, carcassDepth = rules.carcassDepth;
    // depths from the wall (n)
    const carcassBack = rules.wallGap;
    const carcassFront = carcassBack + carcassDepth;
    const frontFace = carcassFront + frontThickness;
    const plinthFace = frontFace - rules.plinthSetback;

    // group roles from the project notes: note "group N" -> role (worktop, tall, island); the rules are written per role
    const roles = {};
    for (const [name, description] of P.notes || []) {
      const m = /^group\s+(\d+)$/i.exec(String(name ?? '').trim());
      if (m) roles[m[1]] = String(description ?? '').trim().toLowerCase();
    }
    const islandGroups = rules.island && rules.island.backPanel ? Object.keys(roles).filter(g => roles[g] === 'island') : [];

    const warnings = [], groups = {}, carcasses = [], fronts = [], boards = [];
    const frames = [], plinths = [], panels = [], plaster = [];
    // the names of these counts are used by the cost page as {n:name}
    const counts = {
      carcasses: 0, fronts: 0, handles: 0, hinges: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0,
      plasterUD: 0, plasterCD: 0, plasterEdge: 0
    };

    // ---- groups: stack the components ----
    for (const [g, columnWidths] of Object.entries(P.columns || {})) {
      const widths = columnWidths.map(Number);
      const pieces = (P.components || []).filter(c => String(c.g) === g).map(c => readComponent(g, c)).filter(c => c.type);
      const stacked = stack(widths, pieces);
      for (const { piece, why } of stacked.skipped) {
        warnings.push(`Group ${g} col ${piece.col}: ${piece.type} ${why === 'overlap' ? 'overlaps another component' : 'is outside the columns'} - skipped.`);
      }
      groups[g] = {
        group: +g,
        widths,
        colX: stacked.colX,
        length: stacked.colX[stacked.colX.length - 1],
        items: stacked.items,
        areas: carcassAreas(stacked.items)
      };
    }
    // tag counts ({n:tag.bins} on the cost page)
    for (const c of P.components || []) {
      for (const t of String(c.tags || '').toLowerCase().split(/[\s,]+/).filter(Boolean)) counts['tag:' + t] = (counts['tag:' + t] || 0) + 1;
    }

    // ---- carcasses: same carcass name = one carcass over all its columns and heights ----
    const groupOfName = new Map();
    for (const G of Object.values(groups)) {
      for (const area of G.areas) {
        if (groupOfName.has(area.name)) {
          warnings.push(`Carcass ${area.name} is used in Group ${groupOfName.get(area.name)} and Group ${G.group} - one carcass must stay in one group.`);
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
        if (BOX_TYPES.includes(item.type) && !item.carcassName && !hasTag(item, 'dishwasher')) warnings.push(`Group ${G.group} col ${item.col}: ${item.type} has no carcass name.`);
      }
    }
    carcasses.forEach((K, i) => {
      K.id = i + 1;
      // read from the stack, no heights in the rules: floor = stands on a plinth, base = floor with a worktop on top
      const overlapsColumns = item => item.col <= K.col + K.span - 1 && item.col + item.span - 1 >= K.col;
      const groupItems = groups[K.group].items;
      K.floor = groupItems.some(item => item.type === 'plinth' && overlapsColumns(item) && item.v1 === K.v0);
      K.base = K.floor && groupItems.some(item => item.type === 'worktop' && overlapsColumns(item) && item.v0 === K.v1);
      K.type = K.base ? 'base' : K.floor ? 'tall' : 'wall';
      K.sink = K.boxes.some(b => hasTag(b, 'sink'));
      K.fridge = K.boxes.some(b => hasTag(b, 'fridge', 'freezer'));
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

    // ---- boards of each carcass ----
    const addBoard = b => {
      boards.push(b);
      return b;
    };
    const rails = rules.rails, shelf = rules.shelf, back = rules.back, half = board / 2;
    for (const K of carcasses) {
      const { u0, u1, v0, v1 } = K;
      const width = u1 - u0, height = v1 - v0;
      const innerU0 = u0 + board, innerU1 = u1 - board, innerWidth = width - 2 * board;
      const part = (name, a, b, material, layer, box) => addBoard({ name, a, b, material, layer, group: K.group, carcassId: K.id, box });

      part('Side', carcassDepth, height, 'p18', 'carcasses', [u0, innerU0, v0, v1, carcassBack, carcassFront]);
      part('Side', carcassDepth, height, 'p18', 'carcasses', [innerU1, u1, v0, v1, carcassBack, carcassFront]);
      part('Bottom panel', innerWidth, carcassDepth, 'p18', 'carcasses', [innerU0, innerU1, v0, v0 + board, carcassBack, carcassFront]);
      const railName = 'Top rail ' + rails.depth;
      if (K.base) {
        if (K.sink) {
          // under the sink the rails stand on edge to clear the bowl
          part(railName, innerWidth, rails.depth, 'p18', 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassFront - board, carcassFront]);
          part(railName, innerWidth, rails.depth, 'p18', 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
        } else if (K.hob) {
          // under the hob: front rail on edge (hobFront high), rear rail on edge, separation panel below the front rail, air gap at the back
          part('Top rail ' + rails.hobFront + ' (front, on edge)', innerWidth, rails.hobFront, 'p18', 'carcasses',
            [innerU0, innerU1, v1 - rails.hobFront, v1, carcassFront - board, carcassFront]);
          part(railName, innerWidth, rails.depth, 'p18', 'carcasses', [innerU0, innerU1, v1 - rails.depth, v1, carcassBack, carcassBack + board]);
          part('Hob separation panel', innerWidth, carcassDepth - 2 * board - rails.hobPanelGap, 'p16', 'carcasses',
            [innerU0, innerU1, v1 - rails.hobFront, v1 - rails.hobFront + rails.hobPanel, carcassBack + board + rails.hobPanelGap, carcassFront - board]);
        } else {
          // two flat top rails, front and back
          part(railName, innerWidth, rails.depth, 'p18', 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassFront - rails.depth, carcassFront]);
          part(railName, innerWidth, rails.depth, 'p18', 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassBack + rails.depth]);
        }
      } else {
        part('Top panel', innerWidth, carcassDepth, 'p18', 'carcasses', [innerU0, innerU1, v1 - board, v1, carcassBack, carcassFront]);
      }

      // HDF back only behind cabinet doors: not behind drawers, fixed (dummy) fronts or appliances (oven, micro, fridge, freezer);
      // one piece per run of doors
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
        part('Back', width - 2 * back.inset, s1 - s0 - 2 * back.inset, 'hdf', 'backs',
          [u0 + back.inset, u1 - back.inset, s0 + back.inset, s1 - back.inset, carcassBack - back.thickness, carcassBack]);
      }

      // fixed shelves at the joint of 2 boxes in one carcass: full carcass depth
      if (!K.base && !K.fridge) {
        for (let i = 1; i < K.boxes.length; i++) {
          const joint = K.boxes[i].v0;
          part('Fixed shelf', innerWidth, carcassDepth, 'p18', 'shelves', [innerU0, innerU1, joint - half, joint + half, carcassBack, carcassFront]);
          counts.shelvesFixed++;
        }
      }

      const adjustableShelf = centre => {
        part('Adjustable shelf', innerWidth - 2 * shelf.clearance, carcassDepth - shelf.setback, 'p18', 'shelves',
          [innerU0 + shelf.clearance, innerU1 - shelf.clearance, centre - half, centre + half, carcassBack, carcassFront - shelf.setback]);
        counts.shelvesAdjustable++;
        counts.shelfPins += shelf.pins;
      };
      // tag coffee (rules.pullOutShelf): one pull-out shelf at the bottom on full-extension runners, no other shelves
      if (K.coffee) {
        const pullOut = rules.pullOutShelf, y = v0 + board + pullOut.lift;
        part('Pull-out shelf', innerWidth - 2 * pullOut.clearance, pullOut.depth, 'p18', 'shelves',
          [innerU0 + pullOut.clearance, innerU1 - pullOut.clearance, y, y + board, carcassFront - pullOut.depth, carcassFront]);
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

    // ---- frames, panels, plinths, plasterboard: items without a carcass of their own ----
    // frame: MDF strip on edge (frame.depth deep), with a back strip when it is not part of a carcass.
    // panel: MDF board laid flat in the front plane. board: plasterboard box, rules.plasterboard.depth deep from the wall.
    const frameRule = rules.frame, plasterRule = rules.plasterboard;
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        const { u0, u1, v0, v1 } = item, width = u1 - u0, height = v1 - v0;
        if (item.type === 'frame') {
          frames.push({
            group: G.group, item, box: [u0, u1, v0, v1, frontFace - frameRule.depth, frontFace],
            name: (height > width ? 'Frame ' : 'Horizontal frame ') + frontThickness + ' on edge (' + frameRule.depth + ' deep)',
            a: frameRule.depth, b: Math.max(width, height)
          });
          if (!item.carcassName) {
            addBoard({
              name: 'Back strip ' + frameRule.depth, a: frameRule.depth, b: Math.max(width, height), material: 'p18', layer: 'carcasses',
              group: G.group, col: item.col, box: [u0, u1, v0, v1, carcassBack, carcassBack + frameRule.depth], strip: true
            });
          }
        } else if (item.type === 'panel') {
          panels.push({ group: G.group, item, name: 'Panel ' + frontThickness, a: width, b: height, box: [u0, u1, v0, v1, frontFace - frontThickness, frontFace] });
        } else if (item.type === 'plinth') {
          plinths.push({ group: G.group, item, a: height, b: width, box: [u0, u1, v0, v1, plinthFace - rules.plinthThickness, plinthFace] });
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

    // ---- worktop of a group (rules.worktop.depth by the group role) ----
    // the depth is the product size; front edge = front face + overhang;
    // behind the carcass back = depth - carcassDepth - frontThickness - overhang, e.g. 600 - 550 - 18 - 18 = 14, 900 - 550 - 18 - 18 = 314
    const worktopRule = rules.worktop || {}, worktops = {};
    for (const G of Object.values(groups)) {
      if (!G.items.some(i => i.type === 'worktop')) continue;
      const role = roles[G.group], depth = (worktopRule.depth || {})[role];
      if (!Number.isFinite(depth)) {
        warnings.push(`Group ${G.group}: worktop needs a group role in the notes ("group ${G.group}") and rules.worktop.depth for it (role: ${role || 'none'}).`);
        continue;
      }
      const behind = depth - carcassDepth - frontThickness - worktopRule.overhang;
      if (behind < 0) warnings.push(`Group ${G.group}: worktop ${depth} is shorter than carcass + front + overhang (${carcassDepth + frontThickness + worktopRule.overhang}).`);
      worktops[G.group] = { n0: carcassBack - behind, n1: frontFace + worktopRule.overhang, depth, back: behind };
      counts['worktop:' + G.group] = depth;
    }

    // ---- island (rules.island.backPanel): chipboard back panel between the end columns, floor to the carcass tops, on the carcass backs ----
    for (const g of islandGroups) {
      const G = groups[g];
      if (!G) continue;
      const firstWidth = G.widths[0] || 0, lastWidth = G.widths[G.widths.length - 1] || 0;
      const top = Math.max(0, ...carcasses.filter(K => K.group === G.group).map(K => K.v1));
      addBoard({
        name: 'Back panel', a: G.length - firstWidth - lastWidth, b: top, material: 'p18', layer: 'carcasses', group: G.group, backPanel: true,
        box: [firstWidth, G.length - lastWidth, 0, top, carcassBack - board, carcassBack]
      });
    }

    // ---- fronts: item minus its four gaps; hinges, drawer boxes ----
    const hingeRule = rules.hinges, drawerRule = rules.drawers;
    for (const G of Object.values(groups)) {
      for (const item of G.items) {
        if (!FRONT_TYPES.includes(item.type)) continue;
        if (!item.gaps || item.gaps.length !== 4 || item.gaps.some(x => !Number.isFinite(x))) {
          warnings.push(`Group ${G.group} col ${item.col}: ${item.type} needs 4 gaps [left, right, top, bottom].`);
          item.gaps = [0, 0, 0, 0];
        }
        const box = frontBox(item), K = item.carcass;
        if (box.u1 - box.u0 <= 0 || box.v1 - box.v0 <= 0) warnings.push(`Group ${G.group} col ${item.col}: gaps leave no front.`);
        const opening = item.type === 'dummy' ? 'fixed'
          : item.type === 'drawer' ? 'drawer'
          : hasTag(item, 'dishwasher') ? 'dishwasher'
          : hasTag(item, 'fridge', 'freezer') ? 'fridge'
          : 'door';
        // hinges on the side away from a side handle; every door of one column opens the same way
        const hingeSide = G.items.some(x => x.col === item.col && x.span === item.span && x.type === 'cabinet' && x.handle === 'L') ? 'R' : 'L';
        const front = {
          id: fronts.length + 1, group: G.group, item, carcassId: K ? K.id : null, opening, tags: item.tags, hingeSide, gaps: item.gaps,
          ...box, width: box.u1 - box.u0, height: box.v1 - box.v0, handle: item.handle
        };
        item.front = front;
        fronts.push(front);
        counts.fronts++;
        if (item.handle) counts.handles++;

        if (opening === 'door' && K) {
          // hinges by front height (rules.hinges.perDoor), fromEnd from the front ends
          const count = hingeRule.perDoor.find(([maxHeight]) => front.height < maxHeight)[1];
          front.hinges = Array.from({ length: count }, (_, j) => Math.round(front.v0 + hingeRule.fromEnd + ((front.height - 2 * hingeRule.fromEnd) * j) / (count - 1)));
          front.hingeU = hingeSide === 'L' ? K.u0 + board : K.u1 - board;
          counts.hinges += count;
        }

        if (opening === 'drawer' && K) {
          // drawer box: size D from rules.drawers.dFrom front height, else size M
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
          const n0 = drawerRule.bottom.z, n1 = drawerRule.bottom.z + drawerRule.bottom.depth, bottomThickness = drawerRule.bottom.thickness;
          const drawerBoards = (v, backHeight, backName, inner) => {
            addBoard({ name: 'Drawer bottom', a: drawer.bottomWidth, b: drawerRule.bottom.depth, material: 'p16', layer: 'drawers', group: G.group, carcassId: K.id, frontId: front.id, inner,
              box: [bottomU0, bottomU1, v, v + bottomThickness, n0, n1] });
            addBoard({ name: backName, a: innerU1 - innerU0 - drawerRule.back.inset, b: backHeight, material: 'p16', layer: 'drawers', group: G.group, carcassId: K.id, frontId: front.id, inner,
              box: [backU0, backU1, v + bottomThickness, v + bottomThickness + backHeight, n0, n0 + drawerRule.back.thickness] });
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
      rules, roles, warnings, counts,
      // depths from the wall (n), mm
      frontThickness, carcassDepth, carcassBack, carcassFront, frontFace, plinthFace,
      groups, carcasses, fronts, boards, frames, plinths, panels, plaster, worktops
    };
  }

  /* ---------- carcass map: where each carcass is and what it is made of (mm, group coordinates) ----------
     roomPosition(K), optional: where the carcass stands in the room (view.html) */
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

  // carcass map as JSON for reading: one carcass per block, short arrays and members on one line
  function mapJSON(map) {
    const field = ([key, value]) =>
      '    ' + JSON.stringify(key) + ': ' +
      ((key === 'members' || key === 'boards') && value.length ? '[\n' + value.map(x => '      ' + json1(x)).join(',\n') + '\n    ]' : json1(value));
    return '[\n' + map.map(entry => '  {\n' + Object.entries(entry).map(field).join(',\n') + '\n  }').join(',\n') + '\n]\n';
  }

  // compact one-line JSON with a space after ':' and ','
  function json1(value) {
    if (Array.isArray(value)) return '[' + value.map(json1).join(', ') + ']';
    if (value && typeof value === 'object') return '{' + Object.entries(value).map(([k, x]) => JSON.stringify(k) + ': ' + json1(x)).join(', ') + '}';
    return JSON.stringify(value);
  }

  /* ---------- cutting list: parts with the same name and size counted together, in first-seen order ----------
     rows [name, a, b, qty, where]; where = the parts' "at" labels, e.g. "K2, K5 ×2" */
  function cutList(parts) {
    const rows = new Map();
    for (const p of parts) {
      const key = p.name + '|' + p.a + '|' + p.b;
      const row = rows.get(key) || { qty: 0, at: new Map() };
      row.qty++;
      if (p.at) row.at.set(p.at, (row.at.get(p.at) || 0) + 1);
      rows.set(key, row);
    }
    return [...rows].map(([key, row]) => {
      const [name, a, b] = key.split('|');
      const where = [...row.at].map(([label, n]) => (n > 1 ? label + ' ×' + n : label)).join(', ');
      return [name, Number(a), Number(b), row.qty, where];
    });
  }

  /* ---------- project data: data.js next to the page sets window.KITCHEN_DATA ----------
     loaded with <script src="data.js">, so it works from a local folder (file://) and from a web server alike */
  const DATA_HEAD =
    '/* Kitchen project data - shared by design.html, cost.html and view.html.\n' +
    '   Plain JSON after "window.KITCHEN_DATA =". Edit it in design.html (Import data / Export data). */\n' +
    'window.KITCHEN_DATA = ';
  function load() {
    const data = root.KITCHEN_DATA;
    return data ? Promise.resolve(data) : Promise.reject(new Error('data.js not found next to this page'));
  }
  // data.js text for a project JSON text, and back (fromDataJS also accepts plain JSON)
  const toDataJS = json => DATA_HEAD + json.replace(/\n$/, '') + ';\n';
  const fromDataJS = text => {
    const i = text.indexOf('{'), j = text.lastIndexOf('}');
    if (i < 0 || j < i) throw new Error('no JSON object found');
    return JSON.parse(text.slice(i, j + 1));
  };
  // one JSON block of a page: <script type="application/json" id="...">
  const pageData = id => JSON.parse(document.getElementById(id).textContent);

  root.KitchenEngine = {
    TYPE_TAGS, FEATURE_TAGS, FRONT_TYPES, BOX_TYPES,
    parseTags, readComponent, stack, carcassAreas, frontBox, build,
    cutList, carcassMap, mapJSON, json1,
    load, toDataJS, fromDataJS, pageData, num
  };
})(typeof window !== 'undefined' ? window : globalThis);
