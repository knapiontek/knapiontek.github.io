/* engine.js - kitchen construction engine, shared by design.html, cost.html and view.html.
   Deterministic: build(data) is a pure function of the project data (data.js). Every size comes from data.rules; this file holds no
   project numbers. No drawing here: it returns positioned parts (mm) that the pages draw, price or list.

   Coordinates are per group: u along the group (from its first column), v up from the floor,
   n out from the wall: 0 = wall, carcass back at rules.wallGap, front face at wallGap + carcassDepth + frontThickness.
   The view places each group in the room.

   Component fields (data.components):
     g group, c first column, s column span, h height
     tags   exactly one kind - filler, plinth, worktop, frame, cabinet, drawer, oven, micro
            + feature tags   - hob, sink, bins, dummy, dishwasher, fridge, freezer, inner
     k      carcass name (K1, K2 ...): same name = ONE carcass over all its columns and heights; "" = no carcass
     gaps   fronts only: [left, right, top, bottom]; front = module minus these four gaps
     hd     handle position T | B | L | R | ""
*/
(function (root) {
  'use strict';
  const KIND_TAGS = ['filler', 'plinth', 'worktop', 'frame', 'cabinet', 'drawer', 'oven', 'micro'];
  const FEATURE_TAGS = ['hob', 'sink', 'bins', 'dummy', 'dishwasher', 'fridge', 'freezer', 'inner'];
  const FRONT_KINDS = ['cabinet', 'drawer'];
  const BOX_KINDS = ['cabinet', 'drawer', 'oven', 'micro'];   // pieces that sit in a carcass
  const num = (v, d) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d; };

  function parseTags(str) {
    const tags = String(str ?? '').toLowerCase().split(/[\s,]+/).filter(Boolean);
    const kinds = tags.filter(t => KIND_TAGS.includes(t));
    return { tags, kinds, kind: kinds.length === 1 ? kinds[0] : null,
      features: tags.filter(t => FEATURE_TAGS.includes(t)),
      unknown: tags.filter(t => !KIND_TAGS.includes(t) && !FEATURE_TAGS.includes(t)) };
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
      const box = members.filter(i => BOX_KINDS.includes(i.t)), v = box.length ? box : members;
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
    const noHdf = new Set((R.noHdfBack || []).map(String));
    const warnings = [], groups = {}, carcasses = [], fronts = [], boards = [], frames = [], plinths = [], panels = [];
    const counts = { carcasses: 0, fronts: 0, handles: 0, hinges: 0, drawersD: 0, drawersM: 0, innerDrawers: 0,
      shelvesAdjustable: 0, shelvesFixed: 0, shelfPins: 0, legs: 0, sinks: 0, hobs: 0, fridges: 0, grilles: 0 };

    // groups: stack the components
    for (const [g, ws] of Object.entries(P.columns || {})) {
      const widths = ws.map(Number);
      const comps = (P.components || []).filter(c => String(c.g) === g).map(c => {
        const tg = parseTags(c.tags);
        return { g: +g, c: +c.c, s: +c.s, h: +c.h, t: tg.kind || '', tags: tg.tags, k: String(c.k || '').trim(), hd: c.hd || '',
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
      const items = A.members.filter(i => BOX_KINDS.includes(i.t)).sort((a, b) => a.v0 - b.v0 || a.u0 - b.u0);
      carcasses.push({ name: A.name, g: G.g, c: A.c0, s: A.c1 - A.c0 + 1, u0: A.u0, u1: A.u1, v0: A.v0, v1: A.v1, items, members: A.members });
    }
    for (const G of Object.values(groups)) for (const it of G.items)
      if (BOX_KINDS.includes(it.t) && !it.k && !has(it, 'dishwasher')) warnings.push(`Group ${G.g} col ${it.c}: ${it.t} has no carcass name.`);
    carcasses.forEach((K, i) => {
      K.id = i + 1;
      K.floor = K.v0 <= R.base.maxBottom;
      K.base = K.floor && K.v1 <= R.base.maxTop;
      K.sink = K.items.some(i => has(i, 'sink'));
      K.fridge = K.items.some(i => has(i, 'fridge', 'freezer'));
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
          P_('Hob separation panel', IW, CD - 2 * T, 'p16', 'carcasses', [ui0, ui1, v1 - RL.hobFront, v1 - RL.hobFront + RL.hobPanel, CN0 + T, CN1 - T], [0, .4, 0]);
        } else {
          P_(TR, IW, RL.depth, 'p18', 'carcasses', [ui0, ui1, v1 - T, v1, CN1 - RL.depth, CN1], [0, 1, .6]);
          P_(TR, IW, RL.depth, 'p18', 'carcasses', [ui0, ui1, v1 - T, v1, CN0, CN0 + RL.depth], [0, 1, 0]);
        }
      } else P_('Top panel', IW, CD, 'p18', 'carcasses', [ui0, ui1, v1 - T, v1, CN0, CN1], [0, 1, 0]);
      if (!noHdf.has(String(g))) P_('Back', W - 2 * BK.inset, H - 2 * BK.inset, 'hdf', 'backs', [u0 + BK.inset, u1 - BK.inset, v0 + BK.inset, v1 - BK.inset, CN0 - BK.thickness, CN0], [0, 0, -.3]);
      // fixed shelves at the joint of 2 boxes in one carcass: full carcass depth
      if (!K.base && !K.fridge) for (let i = 1; i < K.items.length; i++) {
        const b = K.items[i].v0;
        P_('Fixed shelf', IW, CD, 'p18', 'shelves', [ui0, ui1, b - half, b + half, CN0, CN1], [0, 0, 1]); counts.shelvesFixed++;
      }
      // adjustable shelves: per door by its height (rules.shelf.perDoor); none in the sink unit or the fridge
      if (!K.sink && !K.fridge) for (const it of K.items) {
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

    // frames: strip between fronts, frontThickness wide or less = on edge (frame.depth deep), wider = flat filler.
    // Back strip behind each frame that is not part of a carcass; a flat filler needs carcasses on both sides.
    const FR = R.frame;
    for (const G of Object.values(groups)) for (const it of G.items) {
      if (it.t === 'frame') {
        const { u0, u1, v0, v1 } = it, h = v1 - v0, flat = Math.min(u1 - u0, h) > FT;
        frames.push({ g: G.g, it, flat, box: [u0, u1, v0, v1, flat ? FN - FT : FN - FR.depth, FN],
          name: flat ? 'Filler ' + (u1 - u0) + ', installed flat' : (h > u1 - u0 ? 'Frame ' + FT + ' on edge (' + FR.depth + ' deep)' : 'Horizontal frame ' + FT + ' on edge (' + FR.depth + ' deep)'),
          a: flat ? u1 - u0 : FR.depth, b: flat ? h : Math.max(u1 - u0, h) });
        if (it.k) continue;
        const hasK = c => G.items.some(x => BOX_KINDS.includes(x.t) && x.c <= c && c < x.c + x.s && x.v0 < v1 && x.v1 > v0);
        if (flat && !(hasK(it.c - 1) && hasK(it.c + it.s))) continue;
        if (flat) B({ name: 'Back strip, flat', a: u1 - u0, b: h, mat: 'p18', layer: 'carcasses', g: G.g, box: [u0, u1, v0, v1, CN0, CN0 + T], strip: true });
        else B({ name: 'Back strip ' + FR.depth, a: FR.depth, b: Math.max(u1 - u0, h), mat: 'p18', layer: 'carcasses', g: G.g, box: [u0, u1, v0, v1, CN0, CN0 + FR.depth], strip: true });
      } else if (it.t === 'plinth') {
        plinths.push({ g: G.g, it, a: it.v1 - it.v0, b: it.u1 - it.u0, box: [it.u0, it.u1, it.v0, it.v1, PF - R.plinthThickness, PF] });
      }
    }
    // island back panel: between the end columns of its group, gap behind the carcass backs
    const IP = R.islandBackPanel;
    if (IP && groups[IP.group]) { const G = groups[IP.group], wf = G.widths[0] || 0;
      panels.push({ g: G.g, name: 'Island back panel', a: G.length - 2 * wf, b: IP.height, box: [wf, G.length - wf, 0, IP.height, CN0 - IP.gap - FT, CN0 - IP.gap] }); }

    // fronts: module minus the four gaps of the component
    const HG = R.hinges, DR = R.drawers;
    for (const G of Object.values(groups)) for (const it of G.items) {
      if (!FRONT_KINDS.includes(it.t)) continue;
      if (!it.gaps || it.gaps.length !== 4 || it.gaps.some(x => !Number.isFinite(x))) { warnings.push(`Group ${G.g} col ${it.c}: ${it.t} needs 4 gaps [left, right, top, bottom].`); it.gaps = [0, 0, 0, 0]; }
      const fb = frontBox(it), K = it.K;
      if (fb.u1 - fb.u0 <= 0 || fb.v1 - fb.v0 <= 0) warnings.push(`Group ${G.g} col ${it.c}: gaps leave no front.`);
      const kind = it.t === 'drawer' ? 'drawer' : has(it, 'dishwasher') ? 'dish' : has(it, 'dummy') ? 'fixed' : has(it, 'fridge', 'freezer') ? 'fridge' : 'door';
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
    return { rules: R, FN, FT, CD, CN0, CN1, PF, warnings, groups, carcasses, fronts, boards, frames, plinths, panels, counts };
  }

  /* ---------- carcass map: where each carcass is and what it is made of (mm, group coordinates) ---------- */
  function carcassMap(m, place) {
    return m.carcasses.map(K => {
      const o = {
        carcass: K.name, group: K.g, cols: K.s > 1 ? [K.c, K.c + K.s - 1] : [K.c],
        x: [K.u0, K.u1], y: [K.v0, K.v1], z: [m.CN0, m.CN1], size: [K.u1 - K.u0, K.v1 - K.v0, m.CD],
        type: K.base ? 'base' : K.v0 >= m.rules.upperFrom ? 'upper' : K.floor ? 'tall' : 'on the worktop',
        flags: ['sink', 'hob', 'fridge'].filter(f => K[f]),
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

  /* ---------- cutting list: parts with the same name and size counted together, in first-seen order ---------- */
  function cutList(list) {
    const m = new Map();
    for (const b of list) { const k = b.name + '|' + b.a + '|' + b.b; m.set(k, (m.get(k) || 0) + 1); }
    return [...m].map(([k, q]) => { const [name, a, b] = k.split('|'); return [name, Number(a), Number(b), q]; });
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

  root.KitchenEngine = { KIND_TAGS, FEATURE_TAGS, FRONT_KINDS, BOX_KINDS, parseTags, stack, carcassAreas, frontBox, build, cutList, carcassMap, mapJSON, json1, load, toDataJS, fromDataJS, pageData, num };
})(typeof window !== 'undefined' ? window : globalThis);
