/* engine.js - kitchen construction engine, shared by design.html, cost.html and view.html.
   Deterministic: build(data) is a pure function of the project data (data.js). Every size comes from data.rules; this file holds no
   project numbers. No drawing here: it returns positioned parts (mm) that the pages draw, price or list.

   Coordinates are per group: u along the group (from its first column), v up from the floor,
   n out from the wall: 0 = wall, carcass back at rules.wallGap, front face at wallGap + carcassDepth + frontThickness.
   The view places each group in the room.

   Component fields (data.components):
     g group, c first column, s column span, h height
     tags   exactly one type - filler, board, plinth, worktop, splash, panel, frame, cabinet, drawer, dummy, oven, micro
            + feature tags   - hob, sink, bins, dishwasher, fridge, freezer, inner, end (worktop end / waterfall), coffee
     group roles (worktop, tall, island) come from the notes: a note named "group N" with the role as its description
     k      carcass name (K1, K2 ...): same name = ONE carcass over all its columns and heights; "" = no carcass
     gaps   fronts only: [left, right, top, bottom]; front = module minus these four gaps
     hd     handle position T | B | L | R | ""
*/
(function (root) {
  'use strict';
  // filler = void / spacer, nothing built; board = plasterboard box; splash = splash board on the wall (worktop material);
  // panel = MDF board laid flat in the front plane, both faces lacquered; frame = MDF strip on edge, edge + both faces lacquered
  // dummy = fixed front in a carcass: no hinges, no drawer box, no HDF behind
  const TYPE_TAGS = ['filler', 'board', 'plinth', 'worktop', 'splash', 'panel', 'frame', 'cabinet', 'drawer', 'dummy', 'oven', 'micro'];
  // end = worktop end (waterfall); coffee = pull-out shelf at the bottom for a coffee machine, no other shelves
  const FEATURE_TAGS = ['hob', 'sink', 'bins', 'dishwasher', 'fridge', 'freezer', 'inner', 'end', 'coffee'];
  const FRONT_TYPES = ['cabinet', 'drawer', 'dummy'];
  const BOX_TYPES = ['cabinet', 'drawer', 'dummy', 'oven', 'micro'];   // pieces that sit in a carcass
  const num = (v, d) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d; };

  function parseTags(str) {
    const tags = String(str ?? '').toLowerCase().split(/[\s,]+/).filter(Boolean);
    const types = tags.filter(t => TYPE_TAGS.includes(t));
    return { tags, types, type: types.length === 1 ? types[0] : null,
      features: tags.filter(t => FEATURE_TAGS.includes(t)),
      unknown: tags.filter(t => !TYPE_TAGS.includes(t) && !FEATURE_TAGS.includes(t)) };
  }
  const has = (it, ...t) => t.some(x => it.tags.includes(x));

  /* ---------- stacking: a piece starts on top of the contiguous stack from 0 in the columns it spans ---------- */
  function stack(widths, comps) {
    const n = widths.length, x = [0];
    widths.forEach(w => x.push(x[x.length - 1] + w));
    const occ = widths.map(() => []), items = [], skipped = [];
    const top = r => { let y = 0; for (const [a, b] of [...r].sort((p, q) => p[0] - q[0])) { if (a <= y) { if (b > y) y = b; } else break; } return y; };
    for (const it of comps) {
      const i = it.c - 1, j = Math.min(i + it.s, n), h = it.h;
      if (i < 0 || i >= n || !(it.s >= 1) || !(h >= 0)) { skipped.push({ it, why: 'columns' }); continue; }
      let v = 0;
      for (let k = i; k < j; k++) v = Math.max(v, top(occ[k]));
      if (occ.slice(i, j).some(r => r.some(([a, b]) => Math.max(v, a) < Math.min(v + h, b)))) { skipped.push({ it, why: 'overlap' }); continue; }
      for (let k = i; k < j; k++) occ[k].push([v, v + h]);
      items.push({ ...it, u0: x[i], u1: x[j], v0: v, v1: v + h });
    }
    return { items, skipped, x };
  }

  /* ---------- carcass areas: all components with the same carcass name (k) in one group ----------
     width = all their columns; height = their boxes (fronts, appliances), or all members if there is no box */
  function carcassAreas(items) {
    const m = new Map();
    for (const it of items) if (it.k) (m.get(it.k) || m.set(it.k, []).get(it.k)).push(it);
    return [...m].map(([name, members]) => {
      const box = members.filter(i => BOX_TYPES.includes(i.t)), v = box.length ? box : members;
      return { name, members, u0: Math.min(...members.map(i => i.u0)), u1: Math.max(...members.map(i => i.u1)),
        v0: Math.min(...v.map(i => i.v0)), v1: Math.max(...v.map(i => i.v1)),
        c0: Math.min(...members.map(i => i.c)), c1: Math.max(...members.map(i => i.c + i.s - 1)) };
    });
  }

  /* ---------- front = module minus its four gaps [left, right, top, bottom] ---------- */
  function frontBox(it) {
    const [l, r, t, b] = it.gaps;
    return { u0: it.u0 + l, u1: it.u1 - r, v0: it.v0 + b, v1: it.v1 - t };
  }

  /* ---------- the model ---------- */
  function build(project) {
    const P = project || {}, R = P.rules || {};
    const T = R.board, FT = R.frontThickness, CD = R.carcassDepth;
    const CN0 = R.wallGap, CN1 = CN0 + CD, FN = CN1 + FT, PF = FN - R.plinthSetback;   // carcass back, carcass front, front face, plinth face
    // group roles from the project notes: note "group N" -> role (worktop, tall, island); the rules are written per role
    const ROLE = {};
    for (const [n, d] of P.notes || []) { const m = /^group\s+(\d+)$/i.exec(String(n ?? '').trim()); if (m) ROLE[m[1]] = String(d ?? '').trim().toLowerCase(); }
    const islands = R.island && R.island.backPanel ? Object.keys(ROLE).filter(g => ROLE[g] === 'island') : [];   // island: chipboard back panel
    const warnings = [], groups = {}, carcasses = [], fronts = [], boards = [], frames = [], plinths = [], panels = [], plaster = [];
    const counts = { carcasses: 0, fronts: 0, handles: 0, hinges: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, pullOutShelves: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0, plasterUD: 0, plasterCD: 0, plasterEdge: 0 };

    // groups: stack the components
    for (const [g, ws] of Object.entries(P.columns || {})) {
      const widths = ws.map(Number);
      const comps = (P.components || []).filter(c => String(c.g) === g).map(c => {
        const tg = parseTags(c.tags);
        return { g: +g, c: +c.c, s: +c.s, h: +c.h, t: tg.type || '', tags: tg.tags, k: String(c.k || '').trim(), hd: c.hd || '',
          gaps: Array.isArray(c.gaps) ? c.gaps.map(Number) : null, note: c.note || '' };
      }).filter(c => c.t);
      const st = stack(widths, comps);
      for (const { it, why } of st.skipped) warnings.push(`Group ${g} col ${it.c}: ${it.t} ${why === 'overlap' ? 'overlaps another component' : 'is outside the columns'} - skipped.`);
      groups[g] = { g: +g, widths, x: st.x, length: st.x[st.x.length - 1], items: st.items, areas: carcassAreas(st.items) };
    }
    for (const c of P.components || []) for (const t of String(c.tags || '').toLowerCase().split(/[\s,]+/).filter(Boolean)) counts['tag:' + t] = (counts['tag:' + t] || 0) + 1;

    // carcasses: named in the data (component.k); same name = one carcass over all its columns and heights
    const seen = new Map();
    for (const G of Object.values(groups)) for (const A of G.areas) {
      if (seen.has(A.name)) { warnings.push(`Carcass ${A.name} is used in Group ${seen.get(A.name)} and Group ${G.g} - one carcass must stay in one group.`); continue; }
      seen.set(A.name, G.g);
      const items = A.members.filter(i => BOX_TYPES.includes(i.t)).sort((a, b) => a.v0 - b.v0 || a.u0 - b.u0);
      carcasses.push({ name: A.name, g: G.g, c: A.c0, s: A.c1 - A.c0 + 1, u0: A.u0, u1: A.u1, v0: A.v0, v1: A.v1, items, members: A.members });
    }
    for (const G of Object.values(groups)) for (const it of G.items)
      if (BOX_TYPES.includes(it.t) && !it.k && !has(it, 'dishwasher')) warnings.push(`Group ${G.g} col ${it.c}: ${it.t} has no carcass name.`);
    carcasses.forEach((K, i) => {
      K.id = i + 1;
      // read from the stack, no heights in the rules: floor = stands on a plinth, base = floor with a worktop on top
      const over = i => i.c <= K.c + K.s - 1 && i.c + i.s - 1 >= K.c, GI = groups[K.g].items;
      K.floor = GI.some(i => i.t === 'plinth' && over(i) && i.v1 === K.v0);
      K.base = K.floor && GI.some(i => i.t === 'worktop' && over(i) && i.v0 === K.v1);
      K.sink = K.items.some(i => has(i, 'sink'));
      K.fridge = K.items.some(i => has(i, 'fridge', 'freezer'));
      K.coffee = K.items.some(i => has(i, 'coffee'));
      K.hob = K.items.some(i => has(i, 'hob'));
      K.legs = K.floor ? R.legsPerCarcass : 0;
      K.grille = K.fridge && K.floor;
      for (const it of K.members) it.K = K;
      counts.legs += K.legs; counts.sinks += K.sink; counts.hobs += K.hob; counts.fridges += K.fridge; counts.grilles += K.grille;
    });
    counts.carcasses = carcasses.length;

    // boards of each carcass (A × B = cut size; box = position; mat: p18 chipboard 18, p16 chipboard 16, hdf HDF)
    const B = o => { boards.push(o); return o; };
    const RL = R.rails, SH = R.shelf, BK = R.back, half = T / 2;
    for (const K of carcasses) {
      const { u0, u1, v0, v1 } = K, W = u1 - u0, H = v1 - v0, ui0 = u0 + T, ui1 = u1 - T, IW = W - 2 * T, g = K.g;
      const P_ = (name, a, b, mat, layer, box, dir) => B({ name, a, b, mat, layer, g, K: K.id, box, dir });
      P_('Side', CD, H, 'p18', 'carcasses', [u0, ui0, v0, v1, CN0, CN1], [-1, 0, 0]);
      P_('Side', CD, H, 'p18', 'carcasses', [ui1, u1, v0, v1, CN0, CN1], [1, 0, 0]);
      P_('Bottom panel', IW, CD, 'p18', 'carcasses', [ui0, ui1, v0, v0 + T, CN0, CN1], [0, 0, 0]);
      const TR = 'Top rail ' + RL.depth;
      if (K.base) {
        if (K.sink) {   // under the sink the rails stand on edge to clear the bowl
          P_(TR, IW, RL.depth, 'p18', 'carcasses', [ui0, ui1, v1 - RL.depth, v1, CN1 - T, CN1], [0, .6, 1]);
          P_(TR, IW, RL.depth, 'p18', 'carcasses', [ui0, ui1, v1 - RL.depth, v1, CN0, CN0 + T], [0, 1, 0]);
        } else if (K.hob) {   // under the hob: front rail on edge (hobFront high), rear rail on edge, separation panel below the front rail
          P_('Top rail ' + RL.hobFront + ' (front, on edge)', IW, RL.hobFront, 'p18', 'carcasses', [ui0, ui1, v1 - RL.hobFront, v1, CN1 - T, CN1], [0, .6, 1]);
          P_(TR, IW, RL.depth, 'p18', 'carcasses', [ui0, ui1, v1 - RL.depth, v1, CN0, CN0 + T], [0, 1, 0]);
          P_('Hob separation panel', IW, CD - 2 * T - RL.hobPanelGap, 'p16', 'carcasses', [ui0, ui1, v1 - RL.hobFront, v1 - RL.hobFront + RL.hobPanel, CN0 + T + RL.hobPanelGap, CN1 - T], [0, .4, 0]);   // air gap at the back
        } else {
          P_(TR, IW, RL.depth, 'p18', 'carcasses', [ui0, ui1, v1 - T, v1, CN1 - RL.depth, CN1], [0, 1, .6]);
          P_(TR, IW, RL.depth, 'p18', 'carcasses', [ui0, ui1, v1 - T, v1, CN0, CN0 + RL.depth], [0, 1, 0]);
        }
      } else P_('Top panel', IW, CD, 'p18', 'carcasses', [ui0, ui1, v1 - T, v1, CN0, CN1], [0, 1, 0]);
      // HDF back only behind cabinet doors: not behind drawers, fixed (dummy) fronts or appliances (oven, micro, fridge, freezer); one piece per run of doors
      const spans = K.items.filter(i => i.t === 'cabinet' && !has(i, 'fridge', 'freezer')).map(i => [Math.max(v0, i.v0), Math.min(v1, i.v1)]).sort((a, b) => a[0] - b[0])
        .reduce((L, s) => { const p = L[L.length - 1]; if (p && s[0] <= p[1]) p[1] = Math.max(p[1], s[1]); else L.push([...s]); return L; }, []);
      for (const [s0, s1] of spans) P_('Back', W - 2 * BK.inset, s1 - s0 - 2 * BK.inset, 'hdf', 'backs', [u0 + BK.inset, u1 - BK.inset, s0 + BK.inset, s1 - BK.inset, CN0 - BK.thickness, CN0], [0, 0, -.3]);
      // fixed shelves at the joint of 2 boxes in one carcass: full carcass depth
      if (!K.base && !K.fridge) for (let i = 1; i < K.items.length; i++) {
        const b = K.items[i].v0;
        P_('Fixed shelf', IW, CD, 'p18', 'shelves', [ui0, ui1, b - half, b + half, CN0, CN1], [0, 0, 1]); counts.shelvesFixed++;
      }
      // adjustable shelves: per door by its height (rules.shelf.perDoor); none in the sink unit or the fridge
      // tag coffee (rules.pullOutShelf): one pull-out shelf at the bottom on full-extension runners, no other shelves
      if (K.coffee) { const PS = R.pullOutShelf, y = v0 + T + PS.lift;
        P_('Pull-out shelf', IW - 2 * PS.clearance, PS.depth, 'p18', 'shelves', [ui0 + PS.clearance, ui1 - PS.clearance, y, y + T, CN1 - PS.depth, CN1], [0, 0, 1]); counts.pullOutShelves++;
        // shelves above the machine: the first one PS.space above the pull-out shelf, the rest evenly up to the top
        const lo = y + T + PS.space, hi = v1 - T;
        for (let j = 0; j < (PS.shelvesAbove || 0); j++) { const yy = Math.round(lo + (hi - lo) * j / PS.shelvesAbove);
          P_('Adjustable shelf', IW - 2 * SH.clearance, CD - SH.setback, 'p18', 'shelves', [ui0 + SH.clearance, ui1 - SH.clearance, yy - half, yy + half, CN0, CN1 - SH.setback], [0, 0, 1]);
          counts.shelvesAdjustable++; counts.shelfPins += SH.pins; } }
      if (!K.sink && !K.fridge && !K.coffee) for (const it of K.items) {
        if (it.t !== 'cabinet') continue;
        const lo = it.v0 === v0 ? v0 + T : it.v0 + half, hi = it.v1 === v1 ? v1 - T : it.v1 - half;
        const n = SH.perDoor.find(([h]) => (it.v1 - it.v0) <= h)[1];
        for (let j = 1; j <= n; j++) {
          const y = Math.round(lo + (hi - lo) * j / (n + 1));
          P_('Adjustable shelf', IW - 2 * SH.clearance, CD - SH.setback, 'p18', 'shelves', [ui0 + SH.clearance, ui1 - SH.clearance, y - half, y + half, CN0, CN1 - SH.setback], [0, 0, 1]);
          counts.shelvesAdjustable++; counts.shelfPins += SH.pins;
        }
      }
    }

    // frame: MDF strip on edge (frame.depth deep), with a back strip when it is not part of a carcass.
    // panel: MDF board laid flat in the front plane. board: plasterboard box, rules.plasterboard.depth deep from the wall.
    const FR = R.frame, PB = R.plasterboard;
    for (const G of Object.values(groups)) for (const it of G.items) {
      const { u0, u1, v0, v1 } = it, w = u1 - u0, h = v1 - v0;
      if (it.t === 'frame') {
        frames.push({ g: G.g, it, box: [u0, u1, v0, v1, FN - FR.depth, FN],
          name: (h > w ? 'Frame ' : 'Horizontal frame ') + FT + ' on edge (' + FR.depth + ' deep)', a: FR.depth, b: Math.max(w, h) });
        if (!it.k) B({ name: 'Back strip ' + FR.depth, a: FR.depth, b: Math.max(w, h), mat: 'p18', layer: 'carcasses', g: G.g, c: it.c, box: [u0, u1, v0, v1, CN0, CN0 + FR.depth], strip: true });
      } else if (it.t === 'panel') {
        panels.push({ g: G.g, it, name: 'Panel ' + FT, a: w, b: h, box: [u0, u1, v0, v1, FN - FT, FN] });
      } else if (it.t === 'plinth') {
        plinths.push({ g: G.g, it, a: h, b: w, box: [u0, u1, v0, v1, PF - R.plinthThickness, PF] });
      } else if (it.t === 'board' && PB) {
        // cladding: the face plus the return along the long side; profiles: UD on both fixed edges, CD on the outer edge + cross pieces
        const L = Math.max(w, h), S = Math.min(w, h), D = PB.depth;
        plaster.push({ g: G.g, it, name: 'Plasterboard face', a: S, b: L }, { g: G.g, it, name: 'Plasterboard return', a: D, b: L });
        counts.plasterUD += 2 * L;
        counts.plasterCD += L + (Math.ceil(L / PB.studSpacing) + 1) * (D + S);
        counts.plasterEdge += L;   // one outer edge (corner bead) and one joint to the furniture (seal) per box
      }
    }

    // worktop of a group (rules.worktop.depth by the group role): the depth is the product size; front edge = front face + overhang;
    // behind the carcass back = depth - carcassDepth - frontThickness - overhang, e.g. 600 - 550 - 18 - 18 = 14, 900 - 550 - 18 - 18 = 314
    const WT = R.worktop || {}, worktops = {};
    for (const G of Object.values(groups)) if (G.items.some(i => i.t === 'worktop')) {
      const role = ROLE[G.g], depth = (WT.depth || {})[role];
      if (!Number.isFinite(depth)) { warnings.push(`Group ${G.g}: worktop needs a group role in the notes ("group ${G.g}") and rules.worktop.depth for it (role: ${role || 'none'}).`); continue; }
      const back = depth - CD - FT - WT.overhang;
      if (back < 0) warnings.push(`Group ${G.g}: worktop ${depth} is shorter than carcass + front + overhang (${CD + FT + WT.overhang}).`);
      const W = worktops[G.g] = { n0: CN0 - back, n1: FN + WT.overhang, depth, back };
      counts['worktop:' + G.g] = W.depth;
    }

    // island (rules.island.backPanel): chipboard back panel instead of HDF backs, between the end columns, floor to the carcass tops, on the carcass backs
    for (const g of islands) { const G = groups[g]; if (!G) continue; const w0 = G.widths[0] || 0, w1 = G.widths[G.widths.length - 1] || 0;
      const top = Math.max(0, ...carcasses.filter(K => K.g === G.g).map(K => K.v1));
      B({ name: 'Back panel', a: G.length - w0 - w1, b: top, mat: 'p18', layer: 'carcasses', g: G.g, backPanel: true, box: [w0, G.length - w1, 0, top, CN0 - T, CN0] }); }

    // fronts: module minus the four gaps of the component
    const HG = R.hinges, DR = R.drawers;
    for (const G of Object.values(groups)) for (const it of G.items) {
      if (!FRONT_TYPES.includes(it.t)) continue;
      if (!it.gaps || it.gaps.length !== 4 || it.gaps.some(x => !Number.isFinite(x))) { warnings.push(`Group ${G.g} col ${it.c}: ${it.t} needs 4 gaps [left, right, top, bottom].`); it.gaps = [0, 0, 0, 0]; }
      const fb = frontBox(it), K = it.K;
      if (fb.u1 - fb.u0 <= 0 || fb.v1 - fb.v0 <= 0) warnings.push(`Group ${G.g} col ${it.c}: gaps leave no front.`);
      const kind = it.t === 'dummy' ? 'fixed' : it.t === 'drawer' ? 'drawer' : has(it, 'dishwasher') ? 'dish' : has(it, 'fridge', 'freezer') ? 'fridge' : 'door';
      // hinges on the side away from a side handle; every door of one column opens the same way
      const hingeSide = G.items.some(x => x.c === it.c && x.s === it.s && x.t === 'cabinet' && x.hd === 'L') ? 'R' : 'L';
      const F = { id: fronts.length + 1, g: G.g, it, K: K ? K.id : null, kind, tags: it.tags, hingeSide, gaps: it.gaps,
        ...fb, w: fb.u1 - fb.u0, h: fb.v1 - fb.v0, handle: it.hd };
      it.F = F;
      fronts.push(F); counts.fronts++; if (it.hd) counts.handles++;
      if (kind === 'door' && K) {   // hinges by front height (rules.hinges.perDoor), fromEnd from the front ends
        const n = HG.perDoor.find(([h]) => F.h < h)[1];
        F.hinges = Array.from({ length: n }, (_, j) => Math.round(F.v0 + HG.fromEnd + (F.h - 2 * HG.fromEnd) * j / (n - 1)));
        F.hingeU = hingeSide === 'L' ? K.u0 + T : K.u1 - T;
        counts.hinges += n;
      }
      if (kind === 'drawer' && K) {   // drawer box: type D from rules.drawers.dFrom front height, else type M
        const D = F.h >= DR.dFrom, ty = D ? DR.D : DR.M, ui0 = K.u0 + T, ui1 = K.u1 - T, bw = ui1 - ui0 - DR.bottom.inset;
        const box = { D, sh: ty.side, bh: ty.back, ui0, ui1, bw, b0: it.v0 + (it.v0 === K.v0 ? DR.liftAtBottom : DR.liftAbove), bins: has(it, 'bins'), inner: has(it, 'inner') };
        F.drawer = box;
        const bx0 = ui0 + DR.bottom.inset / 2, bx1 = ui1 - DR.bottom.inset / 2, kx0 = ui0 + DR.back.inset / 2, kx1 = ui1 - DR.back.inset / 2;
        const z0 = DR.bottom.z, z1 = DR.bottom.z + DR.bottom.depth, BT = DR.bottom.thickness;
        const drawerBoards = (v, backH, backName, inner) => {
          B({ name: 'Drawer bottom', a: bw, b: DR.bottom.depth, mat: 'p16', layer: 'drawers', g: G.g, K: K.id, front: F.id, inner, box: [bx0, bx1, v, v + BT, z0, z1] });
          B({ name: backName, a: ui1 - ui0 - DR.back.inset, b: backH, mat: 'p16', layer: 'drawers', g: G.g, K: K.id, front: F.id, inner, box: [kx0, kx1, v + BT, v + BT + backH, z0, z0 + DR.back.thickness] });
        };
        drawerBoards(box.b0, box.bh, 'Drawer back ' + (D ? 'D' : 'M'), false);
        D ? counts.drawersD++ : counts.drawersM++;
        if (box.inner) {   // inner drawer above the top drawer box, behind the same front
          box.iv = box.b0 + box.sh + DR.inner.gap;
          drawerBoards(box.iv, DR.inner.back, 'Inner drawer back', true);
          counts.innerDrawers++;
        }
      }
    }
    return { rules: R, roles: ROLE, FN, FT, CD, CN0, CN1, PF, warnings, groups, carcasses, fronts, boards, frames, plinths, panels, plaster, worktops, counts };
  }

  /* ---------- carcass map: where each carcass is and what it is made of (mm, group coordinates) ---------- */
  function carcassMap(m, place) {
    return m.carcasses.map(K => {
      const o = {
        carcass: K.name, group: K.g, cols: K.s > 1 ? [K.c, K.c + K.s - 1] : [K.c],
        x: [K.u0, K.u1], y: [K.v0, K.v1], z: [m.CN0, m.CN1], size: [K.u1 - K.u0, K.v1 - K.v0, m.CD],
        type: K.base ? 'base' : K.floor ? 'tall' : 'wall',
        flags: ['sink', 'hob', 'fridge', 'coffee'].filter(f => K[f]),
        members: K.members.map(i => ({ col: i.s > 1 ? [i.c, i.c + i.s - 1] : i.c, tags: i.tags.join(' '), x: [i.u0, i.u1], y: [i.v0, i.v1] })),
        boards: cutList(m.boards.filter(b => b.K === K.id)).map(([n, a, b, q]) => (q > 1 ? q + ' × ' : '') + n + ' ' + a + ' × ' + b),
        legs: K.legs
      };
      if (place) o.room = place(K);
      return o;
    });
  }
  // JSON for reading: one carcass per block, short arrays and members on one line
  function mapJSON(map) {
    return '[\n' + map.map(o => '  {\n' + Object.entries(o).map(([k, v]) =>
      '    ' + JSON.stringify(k) + ': ' + ((k === 'members' || k === 'boards') && v.length ? '[\n' + v.map(x => '      ' + json1(x)).join(',\n') + '\n    ]' : json1(v))).join(',\n') + '\n  }').join(',\n') + '\n]\n';
  }
  // compact one-line JSON with spaces after ':' and ','
  function json1(v) {
    return Array.isArray(v) ? '[' + v.map(json1).join(', ') + ']'
      : v && typeof v === 'object' ? '{' + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ': ' + json1(x)).join(', ') + '}' : JSON.stringify(v);
  }

  /* ---------- cutting list: parts with the same name and size counted together, in first-seen order;
     5th field = where they go (b.at labels, e.g. "K2, K5 ×2") ---------- */
  function cutList(list) {
    const m = new Map();
    for (const b of list) { const k = b.name + '|' + b.a + '|' + b.b, e = m.get(k) || { q: 0, at: new Map() }; e.q++; if (b.at) e.at.set(b.at, (e.at.get(b.at) || 0) + 1); m.set(k, e); }
    return [...m].map(([k, e]) => { const [name, a, b] = k.split('|'); return [name, Number(a), Number(b), e.q, [...e.at].map(([s, n]) => n > 1 ? s + ' ×' + n : s).join(', ')]; });
  }

  /* ---------- project data: data.js next to the page sets window.KITCHEN_DATA ----------
     loaded with <script src="data.js">, so it works from a local folder (file://) and from a web server alike */
  const DATA_HEAD = '/* Kitchen project data - shared by design.html, cost.html and view.html.\n   Plain JSON after "window.KITCHEN_DATA =". Edit it in design.html (Import data / Export data). */\nwindow.KITCHEN_DATA = ';
  function load() {
    const d = root.KITCHEN_DATA;
    return d ? Promise.resolve(d) : Promise.reject(new Error('data.js not found next to this page'));
  }
  // data.js text for a project JSON text, and back (also accepts plain JSON)
  const toDataJS = json => DATA_HEAD + json.replace(/\n$/, '') + ';\n';
  const fromDataJS = text => { const i = text.indexOf('{'), j = text.lastIndexOf('}'); if (i < 0 || j < i) throw new Error('no JSON object found'); return JSON.parse(text.slice(i, j + 1)); };
  // one JSON block of a page: <script type="application/json" id="...">
  function pageData(id) { return JSON.parse(document.getElementById(id).textContent); }

  root.KitchenEngine = { TYPE_TAGS, FEATURE_TAGS, FRONT_TYPES, BOX_TYPES, parseTags, stack, carcassAreas, frontBox, build, cutList, carcassMap, mapJSON, json1, load, toDataJS, fromDataJS, pageData, num };
})(typeof window !== 'undefined' ? window : globalThis);
