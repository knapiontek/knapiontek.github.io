/* House "Dom w papawerach 5 (G)" — CALCULATION ENGINE for both bathrooms.
   From BATH_DATA (all lengths in mm) it computes the geometry of one floor (coordinates in metres for the 3D model and
   the plan; everything shown to the user is in mm)
   and the construction data (cut list, edge banding, hardware, shopping, installation points, dimensions,
   checks, XLSX sheets). It draws nothing. view.html: const G = BathEngine.build(BATH_DATA, 'ground' | 'attic'). */
window.BathEngine = (function () {
  'use strict';

  const mm = v => v / 1000;                                              // mm → m
  const mmText = v => String(Math.round(v * 1000));                      // m → whole mm, for the page

  /* the data is in mm; the scene in metres: every number of these sections is a length, except NOT_LENGTH */
  const LENGTH_SECTIONS = ['room', 'walls', 'shower', 'door', 'window', 'casing', 'wcCabinet', 'wc', 'radiator', 'roof', 'roofWindow', 'bath', 'bathTap'];
  const NOT_LENGTH = ['openAngle', 'pitch', 'n'];
  const inMetres = section => Object.fromEntries(Object.entries(section).map(([k, v]) => [k, typeof v === 'number' && !NOT_LENGTH.includes(k) ? mm(v) : v]));
  function floorInMetres(F) {
    const out = { ...F };
    for (const k of LENGTH_SECTIONS) if (F[k]) out[k] = inMetres(F[k]);
    return out;
  }
  const count = (list, item) => list.filter(s => s === item).length;

  /* ---------- the room frame: the house room (../house/house-clip.js) and the bath data, in mm ----------
     The room is the house's: its walls, door, window, heights and roof come from the house (house-clip.js), nothing is re-measured here.
     The frame the bath is computed in: x from the shower line (data, house x) or else from the room's +x wall, growing
     toward the vanity wall (the room's -x face); z from the door wall (-y face) toward the window or knee wall (+y face);
     y up from the floor. house x = X0 - x, house y = Y0 + z, house z = LEVEL + y. */
  function roomFrame(Fd, R) {
    const xs = R.inside.flatMap(r => [r[0], r[1]]), ys = R.inside.flatMap(r => [r[2], r[3]]);
    const X1 = Math.min(...xs), X2 = Math.max(...xs), Y1 = Math.min(...ys), Y2 = Math.max(...ys);
    const X0 = Fd.showerLine ?? X2, near = (a, b) => Math.abs(a - b) <= 1;
    const door = R.openings.find(o => near(o.b[3], Y1));                         // the opening in the door wall
    const window = R.openings.find(o => o.outer === '+y' && near(o.b[2], Y2));   // the window in the +y wall
    const ysOf = cells => cells.flatMap(c => c.S.poly.map(p => p[0]));
    const blockY = ysOf(R.cells.filter(c => c.side === '+y' && c.layers.includes('walls')));
    const frameY = ysOf(R.cells.filter(c => c.side === '+y' && c.element === 'opening'));
    const F = { ...Fd, X0, Y0: Y1, LEVEL: R.level, inside: R.inside.map(r => [X0 - r[1], X0 - r[0], r[2] - Y1, r[3] - Y1]) };
    F.room = { width: Y2 - Y1, depth: X0 - X1, height: R.ceiling - R.level };
    if (Fd.ceiling) Object.assign(F.room, { ceiling: Fd.ceiling.height, ceilingGap: Fd.ceiling.ledGap });
    F.walls = { t: door.b[3] - door.b[2], exterior: Math.max(...blockY) - Y2, reveal: frameY.length ? Math.min(...frameY) - Y2 : 0, knee: Math.max(...blockY) - Y2 };
    F.door = { ...Fd.door, opening: door.b[1] - door.b[0], height: door.b[5] - door.b[4], axisFromVanityWall: (door.b[0] + door.b[1]) / 2 - X1 };
    if (Fd.showerLine !== undefined) {                     // the recess beyond the shower line is the house's
      const recess = R.inside.reduce((a, r) => r[1] > a[1] ? r : a);   // the rectangle reaching furthest beyond the line
      F.shower = { ...Fd.shower, width: recess[3] - recess[2], depth: recess[1] - X0 };
    }
    if (window) F.window = { width: window.b[1] - window.b[0], height: window.b[5] - window.b[4], sill: window.b[4] - R.level, fromShowerLine: X0 - window.b[1] };
    if (Fd.type === 'attic') {
      const cos = Math.cos(R.pitch * Math.PI / 180), w = R.roofWindows[0], [ww, wh] = w.label.split('/').map(Number);
      F.roof = { knee: Math.round(R.roofUnder(Y2) - R.level), pitch: R.pitch };
      F.roofWindow = { w: ww, h: wh, axisFromVanityWall: (w.x[0] + w.x[1]) / 2 - X1, fromKnee: (Y2 - w.y[1]) / cos };   // along the slope from the knee wall's top
    }
    F.wcCabinet = Fd.wcCabinet && { w: Fd.wcCabinet.w, h: Fd.wcCabinet.h, y0: Fd.wcCabinet.bottom };
    F.radiator = { w: Fd.radiator.w, h: Fd.radiator.h, y0: Fd.radiator.bottom, z: Fd.radiator.fromWall, gapToCorner: Fd.radiator.gapToCorner };
    return F;
  }

  /* ---------- shared: vanity (mm) with derived values; its mirror in metres, for the scene ---------- */
  function vanity(F) {
    const { fromDoorWall, bottom, mirror, ...rest } = F.vanity;
    const V = { ...rest, z0: fromDoorWall, bottomY: bottom, basins: [...F.vanity.basins], sections: [...F.vanity.sections],
      mirror: inMetres({ w: mirror.w, h: mirror.h, y: mirror.z }) };
    const n = V.sections.length;
    V.inner = V.len - 2 * V.t;
    V.innerH = V.height - 2 * V.t;
    V.LW = (V.inner - (n - 1) * V.t) / n;                 // inside width of one section
    V.sectionZ = V.sections.map((_, i) => V.t + i * (V.LW + V.t));   // section start from the vanity start
    V.bodyD = V.depth - V.t;
    V.frontW = V.LW - 2 * V.gap;
    V.frontA = V.innerH - 2 * V.gap;
    V.frontB = Math.floor((V.innerH - 3 * V.gap) / 2);
    V.topY = V.bottomY + V.height + V.top;
    V.rimY = V.topY + V.gasket + V.basinH;
    V.basinZ = V.basins[0];                               // first basin (kept for single-basin code paths)
    V.nA = count(V.sections, 'A'); V.nB = count(V.sections, 'B');
    return V;
  }

  /* ROOM: the house room of this floor, HouseClip.roomsFor(...) of ../house/house-clip.js */
  function build(D, floorKey, ROOM, LIBRARY) {
    const F = floorInMetres(roomFrame(D.floors[floorKey], ROOM));
    const G = { key: floorKey, type: F.type, floor: F, data: { ...D, ...F }, X0: F.X0, Y0: F.Y0, LEVEL: F.LEVEL, ROOM,
      fittings: { ...D.fittings, ...F.fittings }, library: LIBRARY };   // what is bought: the library's products by role
    G.V = vanity(F);
    G.XL = F.room.depth;                                  // top wall face (vanity wall)
    G.ZW = F.room.width;                                  // exterior wall face
    G.H = F.room.height;

    // door: opening axis from the vanity wall; leaf centred in the opening
    const doorAxis = G.XL - F.door.axisFromVanityWall;
    G.OX0 = doorAxis - F.door.opening / 2; G.OX1 = doorAxis + F.door.opening / 2;

    // radiator on the door wall, in the corner next to the vanity wall
    const R = F.radiator;
    G.RAD = { ...R, x: G.XL - R.gapToCorner - R.w / 2 };

    if (F.type === 'ground') buildGround(G, F); else buildAttic(G, F);
    return G;
  }

  /* ---------- ground floor: L-shaped room with the shower recess ---------- */
  function buildGround(G, F) {
    const V = G.V;
    G.CEILING_Y = F.room.ceiling;
    G.CEILING_GAP = F.room.ceilingGap;
    G.SX = -F.shower.depth;                               // far shower wall face
    G.SZ = G.ZW - F.shower.width;                         // thermostat partition face (start of the recess)
    G.SHOWER_ZC = (G.SZ + G.ZW) / 2;
    G.WX0 = F.window.fromShowerLine; G.WX1 = G.WX0 + F.window.width;
    G.WIN_Y0 = F.window.sill;
    // WC casing with riser in the window corner
    G.ZX0 = G.XL - F.casing.depth;
    G.ZZ0 = G.ZW - F.casing.length;
    G.PZ0 = G.ZW - F.casing.riserZone;
    G.NICHE_DEPTH = F.casing.niche;
    G.WC_Z = (G.ZZ0 + G.PZ0) / 2;
    G.CAB_W = F.wcCabinet.w; G.CAB_H = F.wcCabinet.h; G.CAB_Y0 = F.wcCabinet.y0;

    G.AREA = G.XL * G.ZW + (-G.SX) * (G.ZW - G.SZ);
    const end = mm(V.z0 + V.len);
    G.checks = [
      ['Oś WC → bok szafki', mmText(G.WC_Z - end) + ' mm', G.WC_Z - end >= .40],
      ['Grzejnik → krawędź otworu drzwi', mmText(G.RAD.x - G.RAD.w / 2 - G.OX1) + ' mm', G.RAD.x - G.RAD.w / 2 - G.OX1 >= 0],
      ['Szafka → zabudowa WC', mmText(G.ZZ0 - end) + ' mm', G.ZZ0 > end],
      ['Okno → zabudowa WC', mmText(G.ZX0 - G.WX1) + ' mm', G.ZX0 > G.WX1],
    ];
  }

  /* ---------- attic: rectangle under a roof slope rising from the knee wall ---------- */
  function buildAttic(G, F) {
    const V = G.V, r = F.roof, tan = Math.tan(r.pitch * Math.PI / 180);
    G.KNEE = r.knee; G.PITCH = r.pitch * Math.PI / 180;
    G.ZF = G.ZW - (G.H - r.knee) / tan;                  // where the slope meets the flat ceiling
    G.CEILING_Y = G.H;
    G.heightAt = z => Math.min(G.H, r.knee + Math.max(0, G.ZW - z) * tan);   // ceiling height above z

    // shower in the bottom-left corner (x 0…depth along the door wall, z 0…width along the bottom wall)
    G.SHX = F.shower.depth; G.SHZ = F.shower.width;
    G.SHOWER_ZC = G.SHZ / 2;
    // roof window in the slope
    const rw = F.roofWindow;
    G.RW = { x: G.XL - rw.axisFromVanityWall, w: rw.w, h: rw.h, v0: rw.fromKnee, v1: rw.fromKnee + rw.h };
    G.RW.y0 = r.knee + G.RW.v0 * Math.sin(G.PITCH); G.RW.y1 = r.knee + G.RW.v1 * Math.sin(G.PITCH);
    G.RW.z0 = G.ZW - G.RW.v0 * Math.cos(G.PITCH); G.RW.z1 = G.ZW - G.RW.v1 * Math.cos(G.PITCH);
    // WC in front of the casing along the bottom wall; riser in the bottom-right corner inside the casing
    G.WC_Z = F.wc.axisFromDoorWall;
    G.CASE = { x1: F.casing.depth, z0: F.casing.from, z1: G.ZW, h: F.casing.height };
    // freestanding bath centred in the free area: z from the vanity end / WC side to the knee wall,
    // x from the WC casing to the vanity wall
    const b = F.bath;
    G.FREE = { x0: G.CASE.x1, x1: G.XL, z0: Math.max(mm(V.z0 + V.len), G.WC_Z + F.wc.w / 2), z1: G.ZW };
    const bx = (G.FREE.x0 + G.FREE.x1) / 2, bz = (G.FREE.z0 + G.FREE.z1) / 2;
    G.BATH = { ...b, cx: bx, cz: bz, x0: bx - b.len / 2, x1: bx + b.len / 2, z0: bz - b.w / 2, z1: bz + b.w / 2 };
    /** x of the bath outline (outer, or inner with inset) at z — superellipse. */
    G.bathEdgeX = (z, inset = 0) => {
      const A = b.len / 2 - inset, B = b.w / 2 - inset, t = Math.min(1, Math.abs(z - bz) / B);
      return bx + A * Math.pow(1 - Math.pow(t, b.n), 1 / b.n);
    };
    const tp = F.bathTap;
    G.TAP = { ...tp, x: G.BATH.x1 + tp.fromBathEnd, z: G.ZW - tp.fromKnee };
    G.TAP.tipX = G.TAP.x - tp.reach;
    G.TAP.overRim = G.bathEdgeX(G.TAP.z, b.rim) - G.TAP.tipX;   // how far the spout reaches inside the inner rim

    G.AREA = G.XL * G.ZW;
    // floor area with height ≥ 2.2 m counted fully, 1.4–2.2 m half (PN-ISO 9836)
    const z22 = G.ZW - (2.2 - r.knee) / tan, z14 = G.ZW - (1.4 - r.knee) / tan;
    G.AREA_USABLE = G.XL * (Math.min(G.ZW, z22) + .5 * Math.max(0, Math.min(G.ZW, z14) - z22));

    const wcH = G.heightAt(G.WC_Z), bathH = G.heightAt(G.BATH.z0), B_ = G.BATH;
    const lastBasin = mm(V.z0 + V.basins[V.basins.length - 1]);
    G.checks = [
      ['Prysznic → dolna krawędź otworu drzwi', mmText(G.OX0 - G.SHX) + ' mm', G.OX0 >= G.SHX],
      ['Oś WC → szyba prysznica', mmText(G.WC_Z - G.SHZ) + ' mm', G.WC_Z - G.SHZ >= .40],
      ['Oś WC → wanna', mmText(B_.z0 - G.WC_Z) + ' mm', B_.z0 - G.WC_Z >= .35],
      ['Wanna → zabudowa WC = wanna → ściana z umywalkami', `${mmText(B_.x0 - G.CASE.x1)} = ${mmText(G.XL - B_.x1)} mm`, Math.abs((B_.x0 - G.CASE.x1) - (G.XL - B_.x1)) < .005],
      ['Wanna → koniec szafki = wanna → ścianka kolankowa', `${mmText(B_.z0 - G.FREE.z0)} = ${mmText(G.ZW - B_.z1)} mm`, B_.z0 - G.FREE.z0 >= .1],
      ['Wylewka baterii za wewnętrzną krawędzią wanny', mmText(G.TAP.overRim) + ' mm', G.TAP.overRim >= .04],
      ['Bateria → ściana z umywalkami / ścianka kolankowa', `${mmText(G.XL - G.TAP.x)} / ${mmText(G.ZW - G.TAP.z)} mm`, G.XL - G.TAP.x >= .15],
      ['Wysokość nad osią WC', mmText(wcH) + ' mm', wcH >= 2.0],
      ['Wysokość przy wejściu do wanny (krawędź od strony pokoju)', mmText(bathH) + ' mm', bathH >= 1.8],
      ['Wysokość nad drugą umywalką', mmText(G.heightAt(lastBasin)) + ' mm', G.heightAt(lastBasin) >= 2.1],
      ['Grzejnik → górna krawędź otworu drzwi', mmText(G.RAD.x - G.RAD.w / 2 - G.OX1) + ' mm', G.RAD.x - G.RAD.w / 2 - G.OX1 >= 0],
    ];
  }

  /* ---------- cut list and edge banding ---------- */
  function cutParts(G, decor) {
    const V = G.V, { len, depth, height, inner, innerH, LW, bodyD, rail, topDepth, frontW, frontA, frontB, nlA, nlB, nA, nB } = V;
    const board = `${decor.code} 18 mm`, b16 = 'płyta 16 mm (dno/tył szuflad)', n = V.sections.length;
    // e: edge banding [D1 front, D2 back — edges along dimension 1; S1 left, S2 right — along dimension 2]
    const parts = [
      { name: 'Blat — warstwa górna',   qty: 1, a: len,     b: topDepth, e: [0,0,0,0], mat: board, edge: '—', note: 'sklejany z dolną, obrzeże 42 mm po sklejeniu na 4 bokach' },
      { name: 'Blat — warstwa dolna',   qty: 1, a: len,     b: topDepth, e: [0,0,0,0], mat: board, edge: '—', note: 'klej D3 / PUR' },
      { name: 'Bok korpusu',            qty: 2, a: depth,   b: height,   e: [1,0,1,0], mat: board, edge: 'przód, dół' },
      { name: 'Wieniec dolny',          qty: 1, a: inner,   b: bodyD,    e: [1,0,0,0], mat: board, edge: 'przód' },
      { name: 'Listwa górna przednia',  qty: 1, a: inner,   b: rail,     e: [1,0,0,0], mat: board, edge: 'przód' },
      { name: 'Listwa górna tylna',     qty: 1, a: inner,   b: rail,     e: [0,0,0,0], mat: board, edge: '—', note: 'otwory na wężyki baterii' },
      { name: 'Plecy nośne',            qty: 1, a: inner,   b: height,   e: [0,0,0,0], mat: board, edge: '—', note: 'zawieszki, otwory na odpływy i zawory' },
    ];
    if (n > 1) parts.push({ name: 'Przegroda', qty: n - 1, a: bodyD, b: innerH, e: [0,0,1,0], mat: board, edge: 'przód' });
    if (nA) parts.push({ name: 'Front A (pod umywalką)', qty: nA, a: frontW, b: frontA, e: [1,1,1,1], mat: board, edge: '4 boki' });
    if (nB) parts.push({ name: 'Front B (2 szuflady)', qty: 2 * nB, a: frontW, b: frontB, e: [1,1,1,1], mat: board, edge: '4 boki' });
    if (nA) parts.push({ name: 'Dno szuflady A', qty: nA, a: LW - 35, b: nlA - 10, e: [0,0,0,0], mat: b16, edge: '—', note: 'LW − 35, NL − 10' });
    if (nB) parts.push({ name: 'Dno szuflady B', qty: 2 * nB, a: LW - 35, b: nlB - 10, e: [0,0,0,0], mat: b16, edge: '—' });
    if (nA) parts.push({ name: 'Tył szuflady A (C)', qty: nA, a: LW - 38, b: 148, e: [1,0,0,0], mat: b16, edge: 'góra', note: 'LW − 38' });
    if (nB) parts.push({ name: 'Tył szuflady B (K)', qty: 2 * nB, a: LW - 38, b: 101, e: [1,0,0,0], mat: b16, edge: 'góra' });
    return parts;
  }
  function edgeLengths(G) {
    const { len, depth, height, inner, innerH, topDepth, frontW, frontA, frontB, nA, nB, sections } = G.V;
    const e22 = 2 * height + 2 * depth + inner + inner + (sections.length - 1) * innerH
              + nA * 2 * (frontW + frontA) + nB * 4 * (frontW + frontB);
    const e42 = 2 * len + 2 * topDepth;
    return { e22: e22 / 1000, e42: e42 / 1000 };
  }
  /* the vanity's hardware as positions of the estimate: the drawers' sides by their product of the library (data.js
     fittings), the rest by Blum's catalogue number (product: the library's entry that gives the shop) */
  function hardware(G) {
    const { nA, nB, len } = G.V, rows = [];
    const add = (name, spec, qty, unit, use, product) => { if (qty) rows.push({ name, spec, qty, unit, use, product }); };
    add('Boki LEGRABOX pure C, NL 350, czarny mat (carbon)', '770C3502S', nA, 'kpl.', 'szuflada A pod umywalką', 'legraboxC');
    add('Boki LEGRABOX pure K, NL 400, czarny mat (carbon)', '770K4002S', 2 * nB, 'kpl.', 'szuflady B', 'legraboxK');
    add('Prowadnica LEGRABOX 40 kg, NL 350, do TIP-ON', '750.3501T', nA, 'kpl.', 'szuflada A', 'runners');
    add('Prowadnica LEGRABOX 40 kg, NL 400, do TIP-ON', '750.4001T', 2 * nB, 'kpl.', 'szuflady B', 'runners');
    add('TIP-ON BLUMOTION L1 (≤ 20 kg), NL 350–650', 'T60L7340', nA + 2 * nB, 'szt.', 'otwieranie przez naciśnięcie, szczelina 2,5 mm', 'runners');
    add('Mocowanie frontu C', 'ZF7C7002', nA, 'para', 'szuflada A', 'runners');
    add('Mocowanie frontu K', 'ZF7K7002', 2 * nB, 'para', 'szuflady B', 'runners');
    add('Mocowanie tyłu C', 'ZB7C000S', nA, 'para', 'szuflada A', 'runners');
    add('Mocowanie tyłu K', 'ZB7K000S', 2 * nB, 'para', 'szuflady B', 'runners');
    add('Zawieszki ukryte do szafek wiszących', 'np. Camar 807', len > 1400 ? 2 : 1, 'para', 'na plecach nośnych, regulacja po zawieszeniu');
    add('Wkręty 4 × 15 do prowadnic', '609.1500', 1, 'opak.', 'prowadnice');
    return rows;
  }

  /* ---------- processing, shopping, installation points, dimensions ---------- */
  function work(G) {
    const V = G.V, many = V.basins.length > 1;
    return [
      ['Cięcie i oklejanie', 'M-HM: formatki z tabeli, obrzeże ABS 2 mm na klej PUR (wilgoć). Blat: dwie warstwy skleić, potem okleić 4 boki obrzeżem 42 mm.'],
      ['Otwory w blacie', `Odpływ Ø 60 i wężyki baterii Ø 35 w obrysie stopki ${many ? 'każdej umywalki' : 'umywalki'} — <b>z szablonu po zakupie umywalki</b>. ${many ? 'Osie' : 'Oś'}: ${V.basins.map(b => b + ' mm').join(', ')} od końca blatu przy drzwiach. Krawędzie otworów zabezpieczyć klejem PUR lub lakierem.`],
      ['Umywalka bez silikonu', 'Pod stopkę uszczelka EPDM 3 mm w kolorze umywalki (taśma samoprzylepna, przycięta w obrysie, 3 mm cofnięta od krawędzi). Umywalkę dociska nakrętka korka od spodu blatu. Spoina wygląda jak cień 3 mm — bez silikonu.'],
      ['Bateria z umywalki', `Bateria stoi na półce umywalki (otwór fabryczny), wężyki przechodzą przez blat i listwę tylną do zaworów za szufladą A${many ? ' (osobno dla każdej umywalki)' : ''}.`],
      ['Syfon', `Syfon oszczędzający miejsce — płaski, tuż pod blatem nad szufladą A, wyjście w ścianę. Szuflada A ma NL ${V.nlA}, za nią ${V.bodyD - V.t - V.nlA} mm na zawory kątowe.`],
      ['Montaż', `Zawieszki na plecach nośnych, spód korpusu ${V.bottomY} mm nad podłogą. Styk blatu ze ścianą: wąska listwa przyblatowa albo fuga 2 mm akrylem w kolorze fugi.`],
    ];
  }

  function buyItems(G, decor, metal) {
    const S = G.data.shop, L = S.links, brass = metal === 'brass', V = G.V, nb = V.basins.length;
    const white = G.floor.look.basin === 'white';
    /* a fitting of the library (data.js fittings, by metal where it differs) as a line of the list; note: what this
       bathroom adds to the product's own note */
    const product = role => { const k = G.fittings[role]; return G.library.fittings[typeof k === 'string' ? k : k[metal]]; };
    const item = (group, role, qty, note) => {
      const p = product(role), notes = [p.note, note].filter(Boolean).join('; ');
      return Object.assign({ group, name: p.name, price: p.price, qty, where: p.shop }, p.link ? { url: p.link } : {}, notes ? { note: notes } : {});
    };
    const items = [
      { group: 'Szafka', name: `Płyta Egger ${decor.code} ${decor.name}, ${decor.thick}, 2800 × 2070`, price: decor.price, qty: 1, where: S.mhm, url: decor.link, note: 'korpus, fronty i blat z jednego arkusza' },
      { group: 'Szafka', name: 'Cięcie, obrzeże ABS 2 mm (22 i 42 mm), otwory', price: null, where: S.mhm + ' — usługi / e-Rozkrój', url: L.mhmServices, note: 'arkusz eRozkroj z eksportu XLSX; odbiór na miejscu' },
      { group: 'Szafka', name: 'Płyta 16 mm na dna i tyły szuflad (formatki)', price: null, where: S.mhm, url: L.mhmBoards },
    ];
    const g = white ? 'Umywalki' : 'Umywalka';
    items.push(item(g, 'basin', nb), item(g, 'plug', nb), item(g, 'tap', nb), item(g, 'siphon', nb));
    items.push({ group: g, name: `Uszczelka EPDM 3 mm ${white ? 'biała' : 'czarna'}, samoprzylepna (taśma)`, price: null, qty: 1, where: 'Leroy Merlin / Castorama Bielsko-Biała' });
    if (G.type === 'attic') {
      items.push(item('Wanna', 'bath', 1, 'w modelu na środku wolnej przestrzeni, nie dokładnie pod oknem'));
      items.push(item('Wanna', 'bathTap', 1, `wys. ${mmText(G.TAP.h)} mm, wylewka ${mmText(G.TAP.reach)} mm; w rogu: ${mmText(G.XL - G.TAP.x)} mm od ściany z umywalkami, ${mmText(G.ZW - G.TAP.z)} mm od ścianki kolankowej; numer w brązie potwierdź w salonie`));
      items.push(item('Wanna', 'bathSet', 1));
      items.push({ group: 'Wanna', name: 'Syfon do wanny wolnostojącej z korkiem klik-klak (odpływ w posadzce)', price: null, qty: 1, where: 'Leroy Merlin / Castorama Bielsko-Biała' });
    }
    items.push(item('Grzejnik', 'radiator', 1, (brass ? '' : 'do armatury w niklu dobierz kolor chrom/inox; ') + `pas ściany od otworu drzwi do narożnika ${mmText(G.XL - G.OX1)} mm, zawieszony od ${mmText(G.RAD.y0)} mm`));
    items.push({ group: 'Grzejnik', name: 'Zawory grzejnikowe (para, przyłącze dolne), w kolorze grzejnika', price: null, qty: 1, where: 'Castorama Bielsko-Biała' });
    items.push(item('Drzwi', 'door', 1, `wersja otwierana na zewnątrz (na korytarz, jak w projekcie) — stronę lewe/prawe potwierdź w sklepie; lico skrzydła równe ze ścianą od korytarza; otwór ${Math.round(G.floor.door.opening * 1000)} × 2070`));
    items.push({ group: 'Drzwi', name: 'Klamka z rozetą WC w kolorze armatury', price: null, qty: 1, where: 'esklep-porta.pl / salon w Bielsku' });
    return items;
  }

  function points(G) {
    const V = G.V, F = G.floor, R = G.RAD, fromVanityWall = x => Math.round((G.XL - x) * 1000);
    const rows = V.basins.map((b, i) => {
      const zb = V.z0 + b, lbl = V.basins.length > 1 ? ` ${i + 1}` : '';
      return [
        [`Umywalka${lbl} — odpływ w ścianie Ø 40`, `od drzwi ${zb} · wys. ${V.bottomY + V.height - V.t - 45}`, 'syfon płaski pod blatem'],
        [`Umywalka${lbl} — zawory kątowe ciepła / zimna`, `od drzwi ${zb - 80} / ${zb + 80} · wys. 550`, `za szufladą A (NL ${V.nlA})`],
        [`Lustro LED${lbl} — puszka`, `od drzwi ${zb} · wys. ${Math.round((V.mirror.y + V.mirror.h / 2) * 1000) + 60}`, 'nad lustrem, IP44'],
      ];
    }).flat();
    rows.push(['Grzejnik — oś', `ściana z drzwiami, ${fromVanityWall(R.x)} od ściany z umywalką`, `rurki ${Math.round(R.z * 1000)} mm od ściany`]);
    rows.push(['Grzejnik — przyłącza dolne', `wys. ${Math.round(R.y0 * 1000) - 60}`, 'nad blatem szafki; rozstaw wg karty Mexen Hades']);
    rows.push(['Drzwi ukryte — otwór w murze', `${Math.round(F.door.opening * 1000)} × 2070, oś ${Math.round(F.door.axisFromVanityWall * 1000)} od ściany z umywalką`, `Porta HIDE ${F.door.opensOut ? 'na zewnątrz' : 'do wewnątrz'}: ościeżnica przed tynkiem i płytką`]);
    if (G.type === 'ground') {
      rows.push(['Okno — otwór', `${Math.round(F.window.width * 1000)} × ${Math.round(F.window.height * 1000)}, parapet ${Math.round(G.WIN_Y0 * 1000)}`, `od linii prysznica ${Math.round(G.WX0 * 1000)}`]);
      rows.push(['WC — oś', `${Math.round((G.ZW - G.WC_Z) * 1000)} od ściany z oknem`, `stelaż Geberit Duofix w zabudowie ${mmText(F.casing.depth)} mm`]);
      rows.push(['Prysznic — odpływ liniowy', `${Math.round(F.shower.drain * 1000)} przy ścianie dalszej, oś od ściany z oknem ${Math.round((G.ZW - G.SHOWER_ZC) * 1000)}`, 'Vogi Duo, ruszt pod płytkę']);
    } else {
      rows.push(['Okno dachowe', `${mmText(G.RW.w)} × ${mmText(G.RW.h)}, oś ${Math.round((G.XL - G.RW.x) * 1000)} od ściany z umywalką`, `dolna krawędź ok. ${mmText(G.RW.y0)} mm nad podłogą`]);
      rows.push(['WC — oś', `${Math.round(G.WC_Z * 1000)} od ściany z drzwiami`, `stelaż Geberit w zabudowie ${mmText(G.CASE.x1)} mm przy dolnej ścianie, podejście do pionu w rogu`]);
      rows.push(['Pion Ø160', `prawy dolny róg, w zabudowie WC`, 'w osi pionu z parteru']);
      rows.push(['Wanna — odpływ w posadzce', `środek wanny ${Math.round((G.XL - G.BATH.cx) * 1000)} od ściany z umywalkami, ${Math.round((G.ZW - G.BATH.cz) * 1000)} od ścianki kolankowej`, 'odpływ pod wanną wg karty wanny (zwykle na środku), spadek do pionu']);
      rows.push(['Wanna — bateria podłogowa (ciepła + zimna)', `${Math.round((G.XL - G.TAP.x) * 1000)} od ściany z umywalkami, ${Math.round((G.ZW - G.TAP.z) * 1000)} od ścianki kolankowej`, 'element podtynkowy w posadzce, przed wylewką']);
      rows.push(['Prysznic — odpływ liniowy', `${Math.round(F.shower.drain * 1000)} przy dolnej ścianie, w narożniku z drzwiami`, 'Vogi Duo, ruszt pod płytkę']);
    }
    rows.push(['Szafka — spód / blat / rant umywalki', `${V.bottomY} / ${V.topY} / ${V.rimY}`, `od drzwi ${V.z0} … ${V.z0 + V.len}`]);
    return rows;
  }

  function dims(G) {
    const F = G.floor, V = G.V;
    const common = [
      ['Szafka z umywalk' + (V.basins.length > 1 ? 'ami' : 'ą'), `${V.len} × ${V.depth} mm, blat ${V.topDepth} mm, ${V.basins.length} × umywalka`],
      ['Umywalk' + (V.basins.length > 1 ? 'i' : 'a'), `Catalano Green Lux 60 × 40, ${F.look.basin === 'white' ? 'biała' : 'czarny mat'}`],
      ['Grzejnik', `Mexen Hades ${mmText(G.RAD.w)} × ${mmText(G.RAD.h)}, przy drzwiach, od ${mmText(G.RAD.y0)} mm`],
      ['Drzwi', `ukryte Porta HIDE ${mmText(F.door.leaf)}, otwór ${mmText(F.door.opening)}, oś ${mmText(F.door.axisFromVanityWall)} od ściany z umywalką, ${F.door.opensOut ? 'otwierane na korytarz' : 'otwierane do łazienki'}`],
    ];
    if (G.type === 'ground') return [
      ['Pomieszczenie', `${mmText(G.ZW)} × ${mmText(G.XL)} mm (wg projektu: ${mmText(G.XL - G.SX)} z prysznicem)`], ['Prysznic', `${mmText(F.shower.width)} × ${mmText(F.shower.depth)} mm (wnęka przerobiona, ściany bez zmian)`],
      ['Powierzchnia', `${G.AREA.toFixed(2).replace('.', ',')} m²`], ['Wysokość (strop)', `${mmText(G.H)} mm`],
      ['Sufit podwieszany', `${mmText(G.CEILING_Y)} mm, szczelina LED ${mmText(G.CEILING_GAP)} mm`], ['Oprawy', '4 × wpuszczane 3000 K, 1 × IP65 w prysznicu'],
      ['Okno', `${mmText(F.window.width)} × ${mmText(F.window.height)}, parapet ${mmText(F.window.sill)}`], ['Ściana z oknem', `${mmText(F.walls.exterior)} mm, szpaleta ${mmText(F.walls.reveal)} mm w płytce`],
      ['Zabudowa WC + pion Ø160', `${mmText(F.casing.length)} × ${mmText(F.casing.depth)} × ${mmText(G.H)}`], ['Oś WC od ściany z oknem', `${mmText(G.ZW - G.WC_Z)} mm`],
      ['Szafka nad stelażem', `HEJSTA ${mmText(G.CAB_W)} × ${mmText(G.CAB_H)}, gł. ${mmText(G.NICHE_DEPTH)}, wys. ${mmText(G.CAB_Y0)}–${mmText(G.CAB_Y0 + G.CAB_H)}`], ['Miska WC podwieszana', `${mmText(F.wc.w)} × ${mmText(F.wc.d)} mm`],
      ...common, ['Bok szafki → oś WC', `${mmText(G.WC_Z - mm(V.z0 + V.len))} mm`],
      ['Drzwi prysznica', `${mmText(F.shower.door)} mm, zawias na szybie stałej`], ['Szyba stała', `${mmText(F.shower.width - F.shower.door)} mm, przy oknie`],
      ['Odpływ Vogi Duo', `przyścienny, ${mmText(F.shower.drain)} mm, pod płytkę`], ['Fuga', '3 mm, w kolorze płytki'],
    ];
    return [
      ['Pomieszczenie', `${mmText(G.ZW)} × ${mmText(G.XL)} mm (wg projektu)`], ['Powierzchnia podłogi', `${G.AREA.toFixed(2).replace('.', ',')} m²`],
      ['Powierzchnia użytkowa (≥ 2,2 m 100 %, 1,4–2,2 m 50 %)', `${G.AREA_USABLE.toFixed(2).replace('.', ',')} m²`],
      ['Ścianka kolankowa', `${mmText(G.KNEE)} mm`], ['Dach', `${G.floor.roof.pitch}°, płaski sufit ${mmText(G.H)} mm od ${mmText(G.ZF)} mm od drzwi`],
      ['Okno dachowe', `${mmText(G.RW.w)} × ${mmText(G.RW.h)} (VELUX), oś ${mmText(G.XL - G.RW.x)} mm od ściany z umywalkami`],
      ['Prysznic', `${mmText(F.shower.width)} × ${mmText(F.shower.depth)} mm, lewy dolny róg`], ['Drzwi prysznica', `${mmText(F.shower.door)} mm + szyba stała ${mmText(F.shower.width - F.shower.door)} mm, ścianka boczna szklana`],
      ['Wanna', `wolnostojąca ${mmText(G.BATH.len)} × ${mmText(G.BATH.w)}, na środku wolnej przestrzeni: odstępy ${mmText(G.BATH.x0 - G.CASE.x1)} / ${mmText(G.XL - G.BATH.x1)} mm i ${mmText(G.BATH.z0 - G.FREE.z0)} / ${mmText(G.ZW - G.BATH.z1)} mm`],
      ['Bateria wannowa', `podłogowa, ${mmText(G.XL - G.TAP.x)} mm od ściany z umywalkami, ${mmText(G.ZW - G.TAP.z)} mm od ścianki kolankowej`],
      ['WC', `oś ${mmText(G.WC_Z)} mm od ściany z drzwiami, zabudowa ${mmText(G.CASE.x1)} mm × wys. ${mmText(G.CASE.h)} mm do pionu w rogu`],
      ...common, ['Odpływ liniowy prysznica', `${mmText(F.shower.drain)} mm, pod płytkę`], ['Fuga', '3 mm, w kolorze płytki'],
    ];
  }

  /* ---------- Info: the shared sheets of every application (core/info.js) as data; view.html shows them ---------- */
  function info(G, decor, metal) {
    const V = G.V, parts = cutParts(G, decor), { e22, e42 } = edgeLengths(G), edgeCode = `ABS 2 mm ${decor.code}`;
    const fitting = role => { const k = G.fittings[role]; return G.library.fittings[typeof k === 'string' ? k : k[metal]]; };
    const source = (where, url, note) => (url ? { text: note || '', links: [{ text: where, href: url }] } : [where, note].filter(Boolean).join('; '));
    const toItem = it => ({ name: it.name, unit: it.unit || 'szt.', qty: it.qty || 1, price: it.price ?? null, use: it.use || '', spec: it.spec || '', source: source(it.where, it.url, it.note) });
    const buy = buyItems(G, decor, metal), groups = [...new Set(buy.map(it => it.group))];
    const furniture = buy.filter(it => it.group === 'Szafka');
    furniture.push({ name: 'Obrzeże ABS 2 mm × 22 mm, ' + decor.code, qty: Math.ceil(e22 + 1), unit: 'mb', price: null, where: G.data.shop.mhm, use: 'korpus, fronty' },
      { name: 'Obrzeże ABS 2 mm × 42 mm, ' + decor.code, qty: Math.ceil(e42 + 0.5), unit: 'mb', price: null, where: G.data.shop.mhm, use: 'blat, 4 boki po sklejeniu' });
    const hardwareItems = hardware(G).map(h => {
      const p = h.product ? fitting(h.product) : null, priced = p && (h.product === 'legraboxC' || h.product === 'legraboxK');
      return { name: h.name, spec: h.spec, qty: h.qty, unit: h.unit, use: h.use, price: priced ? p.price : null, where: p ? p.shop : G.data.shop.mhm, url: p ? p.link : null };
    });
    const estimate = {
      title: `Kosztorys – łazienka ${G.floor.name.toLowerCase()} (${G.floor.title})`,
      info: 'Ceny brutto z dnia projektu (5.11.2026), bez dostawy. Pozycje bez ceny: wycena w sklepie.',
      categories: [
        { name: 'Szafka – płyty i obróbka', group: 'Meble', items: furniture.map(toItem) },
        { name: 'Szafka – okucia Blum', group: 'Meble', items: hardwareItems.map(toItem) },
        ...groups.filter(g => g !== 'Szafka').map(g => ({ name: g, group: 'Wyposażenie', items: buy.filter(it => it.group === g).map(toItem) })),
      ],
      totals: [{ label: 'Meble (materiały) razem', group: 'Meble' }, { label: 'Wyposażenie razem', group: 'Wyposażenie' }],
      excluded: ['Płytki ścienne (posadzki są w kosztorysie domu), kleje i fugi, robocizna, hydraulika i elektryka.'],
    };
    const along = (e, i, j) => e[i] + e[j];
    const block = (id, title, mat) => ({ id, title, cut: true, rows: parts.filter(p => p.mat === mat).map(p => ({
      name: p.name, a: p.a, edgesA: along(p.e, 0, 1), b: p.b, edgesB: along(p.e, 2, 3), qty: p.qty,
      edge: p.e.some(Boolean) ? p.a * along(p.e, 0, 1) + p.b * along(p.e, 2, 3) : null, where: p.note })) });
    const mats = [...new Set(parts.map(p => p.mat))];
    const cutList = { title: 'Lista cięć – szafka podumywalkowa (wymiary w mm)',
      note: 'Wymiar 1 biegnie wzdłuż słoja. Na blacie, frontach i bokach słój poziomo. Obrzeże ABS 2 mm w dekorze płyty; blat: dwie warstwy sklejone, potem obrzeże 42 mm na 4 bokach.',
      blocks: mats.map((m, i) => block('b' + i, m, m)),
      legend: [{ code: 'Arkusz', text: `całość z 1 arkusza 2800 × 2070${G.type === 'attic' ? ' (na styk — przy rozkroju sprawdź układ)' : ''}` },
        { code: 'eRozkrój', text: 'zakładka eRozkrój: import w e-Rozkrój M-HM (mhm-web2.erozkroje.pl): Import z pliku XLS → przypisz kolumny → przypisz płytę i okleinę' }] };
    const tables = [
      { name: 'eRozkrój', widths: [28, 9, 10, 6, 10, 10, 10, 10, 10, 26, 22, 44],
        head: ['Nazwa formatki', 'Długość', 'Szerokość', 'Ilość', 'Usłojenie', 'Okleina przód (D1)', 'Okleina tył (D2)', 'Okleina lewa (S1)', 'Okleina prawa (S2)', 'Płyta', 'Okleina', 'Uwagi'],
        rows: parts.map(p => [p.name, p.a, p.b, p.qty, 1, ...p.e, p.mat, p.e.some(Boolean) ? edgeCode : '', p.note || '']) },
      { name: 'Szafka', widths: [38, 30, 10], head: ['Parametr', 'Wartość', 'Jednostka'], rows: [
        ['Łazienka', `${G.floor.name} — ${G.floor.title}`, ''], ['Dekor płyty', `${decor.code} ${decor.name}`, ''],
        ['Szerokość korpusu', V.len, 'mm'], ['Głębokość korpusu', V.depth, 'mm'], ['Wysokość korpusu', V.height, 'mm'],
        ['Spód korpusu nad podłogą', V.bottomY, 'mm'], ['Blat (2 × 18)', `${V.len} × ${V.topDepth} × ${V.top}`, 'mm'], ['Wierzch blatu', V.topY, 'mm'],
        ['Rant umywalki', V.rimY, 'mm'], ['Początek szafki od ściany z drzwiami', V.z0, 'mm'], ['Koniec szafki od ściany z drzwiami', V.z0 + V.len, 'mm'],
        ['Osie umywalek od ściany z drzwiami', V.basins.map(b => V.z0 + b).join(', '), 'mm'], ['Sekcje', V.sections.join(' + '), ''],
        ['Szerokość wewn. sekcji (LW)', V.LW, 'mm'], ['Szczelina frontów', V.gap, 'mm'],
        ...(V.nA ? [['Front A', `${V.frontW} × ${V.frontA}`, 'mm'], ['Szuflada A', `LEGRABOX C, NL ${V.nlA}`, '']] : []),
        ...(V.nB ? [['Front B (×2)', `${V.frontW} × ${V.frontB}`, 'mm'], ['Szuflady B', `LEGRABOX K, NL ${V.nlB}`, '']] : []),
        ['Głębokość wnętrza', `${V.bodyD} (min. NL + 3 + 18 = ${V.nlB + 21})`, 'mm'],
      ] },
      { name: 'Montaż', widths: [30, 110], head: ['Krok', 'Opis'], rows: [...work(G).map(([k, v]) => [k, v.replace(/<[^>]+>/g, '')]),
        ['Okucia', 'Fronty wpuszczane: prowadnice cofnięte o grubość frontu (18 mm) od lica korpusu. Numery sprawdź w konfiguratorze Blum E-SERVICES przy zamówieniu w M-HM.']] },
      { name: 'Podejścia', widths: [42, 52, 44], head: ['Punkt', 'Położenie (mm)', 'Uwagi'], rows: points(G),
        title: 'Wymiary od lica płytki. „Od drzwi” = od ściany z drzwiami, „od lewej” = od ściany z umywalką.' },
      { name: 'Wymiary', widths: [44, 60], head: ['Element', 'Wymiar'], rows: dims(G) },
    ];
    return { estimate, cutList, tables };
  }

  return { build, cutParts, info, mm, mmText };
})();
