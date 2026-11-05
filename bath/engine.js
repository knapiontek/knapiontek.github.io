/* House "Dom w papawerach 5 (G)" — CALCULATION ENGINE for both bathrooms.
   From BATH_DATA it computes the geometry of one floor (coordinates in metres for the 3D model and the plan)
   and the construction data (cut list, edge banding, hardware, shopping, installation points, dimensions,
   checks, XLSX sheets). It draws nothing. view.html: const G = BathEngine.build(BATH_DATA, 'ground' | 'attic'). */
window.BathEngine = (function () {
  'use strict';

  const mm = v => v / 1000;
  const cm = v => String(Math.round(v * 200) / 2).replace('.', ',');   // m → cm rounded to 0.5
  const c0 = v => Math.round(v * 100);                                   // m → whole cm
  const count = (list, item) => list.filter(s => s === item).length;

  /* ---------- shared: vanity (mm) with derived values ---------- */
  function vanity(F) {
    const V = { ...F.vanity, basins: [...F.vanity.basins], sections: [...F.vanity.sections] };
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

  function build(D, floorKey = D.defaults.floor) {
    const F = D.floors[floorKey];
    const G = { key: floorKey, type: F.type, floor: F, data: { ...D, ...F } };
    G.V = vanity(F);
    G.T = F.walls.t;
    G.XL = F.room.depth;                                  // top wall face (vanity wall)
    G.ZW = F.room.width;                                  // exterior wall face
    G.H = F.room.height;

    // door: opening axis from the vanity wall; leaf centred in the opening
    const doorAxis = G.XL - F.door.axisFromVanityWall;
    G.DOOR_H = F.door.height;
    G.DX0 = doorAxis - F.door.leaf / 2;  G.DX1 = doorAxis + F.door.leaf / 2;
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
    G.WINDOW_WALL_T = F.walls.exterior;
    G.WINDOW_REVEAL = F.walls.reveal;
    G.SX = -F.shower.depth;                               // far shower wall face
    G.SZ = G.ZW - F.shower.width;                         // thermostat partition face (start of the recess)
    G.SHOWER_ZC = (G.SZ + G.ZW) / 2;
    G.SHOWER_XC = G.SX / 2;
    G.WX0 = F.window.fromShowerLine; G.WX1 = G.WX0 + F.window.width;
    G.WIN_Y0 = F.window.sill; G.WIN_Y1 = F.window.sill + F.window.height;
    // WC casing with riser in the window corner
    G.ZX0 = G.XL - F.casing.depth;
    G.ZZ1 = G.ZW; G.ZZ0 = G.ZW - F.casing.length;
    G.PZ0 = G.ZW - F.casing.riserZone;
    G.NICHE_DEPTH = F.casing.niche;
    G.ZXB = G.ZX0 + G.NICHE_DEPTH;
    G.WC_Z = (G.ZZ0 + G.PZ0) / 2;
    G.RISER = { x: G.XL - .03 - F.casing.riser / 2, z: G.ZW - .03 - F.casing.riser / 2, r: F.casing.riser / 2 };
    G.CAB_W = F.wcCabinet.w; G.CAB_H = F.wcCabinet.h; G.CAB_Y0 = F.wcCabinet.y0;

    G.ROOM_OUTLINE = [[0, 0], [G.XL, 0], [G.XL, G.ZW], [G.SX, G.ZW], [G.SX, G.SZ], [0, G.SZ]];
    G.AREA = G.XL * G.ZW + (-G.SX) * (G.ZW - G.SZ);
    const end = mm(V.z0 + V.len);
    G.checks = [
      ['Oś WC → bok szafki', cm(G.WC_Z - end) + ' cm', G.WC_Z - end >= .40],
      ['Grzejnik → krawędź otworu drzwi', cm(G.RAD.x - G.RAD.w / 2 - G.OX1) + ' cm', G.RAD.x - G.RAD.w / 2 - G.OX1 >= 0],
      ['Szafka → zabudowa WC', cm(G.ZZ0 - end) + ' cm', G.ZZ0 > end],
      ['Okno → zabudowa WC', cm(G.ZX0 - G.WX1) + ' cm', G.ZX0 > G.WX1],
    ];
  }

  /* ---------- attic: rectangle under a roof slope rising from the knee wall ---------- */
  function buildAttic(G, F) {
    const V = G.V, r = F.roof, tan = Math.tan(r.pitch * Math.PI / 180);
    G.KNEE = r.knee; G.PITCH = r.pitch * Math.PI / 180; G.TAN = tan;
    G.KNEE_T = F.walls.knee;
    G.ZF = G.ZW - (G.H - r.knee) / tan;                  // where the slope meets the flat ceiling
    G.CEILING_Y = G.H;
    G.heightAt = z => Math.min(G.H, r.knee + Math.max(0, G.ZW - z) * tan);   // ceiling height above z
    G.SLOPE_LEN = (G.ZW - G.ZF) / Math.cos(G.PITCH);

    // shower in the bottom-left corner (x 0…depth along the door wall, z 0…width along the bottom wall)
    G.SHX = F.shower.depth; G.SHZ = F.shower.width;
    G.SHOWER_XC = G.SHX / 2; G.SHOWER_ZC = G.SHZ / 2;
    // roof window in the slope, bath centred under it along the knee wall
    const rw = F.roofWindow;
    G.RW = { x: G.XL - rw.axisFromVanityWall, w: rw.w, h: rw.h, v0: rw.fromKnee, v1: rw.fromKnee + rw.h };
    G.RW.y0 = r.knee + G.RW.v0 * Math.sin(G.PITCH); G.RW.y1 = r.knee + G.RW.v1 * Math.sin(G.PITCH);
    G.RW.z0 = G.ZW - G.RW.v0 * Math.cos(G.PITCH); G.RW.z1 = G.ZW - G.RW.v1 * Math.cos(G.PITCH);
    const b = F.bath;
    G.BATH = { ...b, x0: G.RW.x - b.len / 2, x1: G.RW.x + b.len / 2, z0: G.ZW - b.w, z1: G.ZW };
    // WC in front of the casing along the bottom wall; riser in the bottom-right corner inside the casing
    G.WC_Z = F.wc.axisFromDoorWall;
    G.CASE = { x1: F.casing.depth, z0: F.casing.from, z1: G.ZW, h: F.casing.height };
    G.RISER = { x: .03 + F.casing.riser / 2, z: G.ZW - .03 - F.casing.riser / 2, r: F.casing.riser / 2 };

    G.ROOM_OUTLINE = [[0, 0], [G.XL, 0], [G.XL, G.ZW], [0, G.ZW]];
    G.AREA = G.XL * G.ZW;
    // floor area with height ≥ 2.2 m counted fully, 1.4–2.2 m half (PN-ISO 9836)
    const z22 = G.ZW - (2.2 - r.knee) / tan, z14 = G.ZW - (1.4 - r.knee) / tan;
    G.AREA_USABLE = G.XL * (Math.min(G.ZW, z22) + .5 * Math.max(0, Math.min(G.ZW, z14) - z22));

    const vEnd = mm(V.z0 + V.len), wcH = G.heightAt(G.WC_Z), bathH = G.heightAt(G.BATH.z0);
    const lastBasin = mm(V.z0 + V.basins[V.basins.length - 1]);
    G.checks = [
      ['Prysznic → dolna krawędź otworu drzwi', cm(G.OX0 - G.SHX) + ' cm', G.OX0 >= G.SHX],
      ['Oś WC → szyba prysznica', cm(G.WC_Z - G.SHZ) + ' cm', G.WC_Z - G.SHZ >= .40],
      ['Oś WC → wanna', cm(G.BATH.z0 - G.WC_Z) + ' cm', G.BATH.z0 - G.WC_Z >= .40],
      ['Wanna → zabudowa WC', cm(G.BATH.x0 - G.CASE.x1) + ' cm', G.BATH.x0 >= G.CASE.x1],
      ['Wysokość nad osią WC', cm(wcH) + ' cm', wcH >= 2.0],
      ['Wysokość przy przedniej krawędzi wanny', cm(bathH) + ' cm', bathH >= 1.8],
      ['Wysokość nad drugą umywalką', cm(G.heightAt(lastBasin)) + ' cm', G.heightAt(lastBasin) >= 2.1],
      ['Wanna → front szafki', cm(G.XL - mm(V.topDepth) - G.BATH.x1) + ' cm', G.XL - mm(V.topDepth) >= G.BATH.x1],
      ['Grzejnik → górna krawędź otworu drzwi', cm(G.RAD.x - G.RAD.w / 2 - G.OX1) + ' cm', G.RAD.x - G.RAD.w / 2 - G.OX1 >= 0],
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
  function hardware(G) {
    const { nA, nB } = G.V, rows = [];
    if (nA) rows.push(['Boki LEGRABOX pure C, NL 350, czarny mat (carbon)', '770C3502S', nA, 'szuflada A pod umywalką']);
    if (nB) rows.push(['Boki LEGRABOX pure K, NL 400, czarny mat (carbon)', '770K4002S', 2 * nB, 'szuflady B']);
    if (nA) rows.push(['Prowadnica LEGRABOX 40 kg, NL 350, do TIP-ON', '750.3501T', nA, '']);
    if (nB) rows.push(['Prowadnica LEGRABOX 40 kg, NL 400, do TIP-ON', '750.4001T', 2 * nB, '']);
    rows.push(['TIP-ON BLUMOTION L1 (≤ 20 kg), NL 350–650', 'T60L7340', nA + 2 * nB, 'otwieranie przez naciśnięcie, szczelina 2,5 mm']);
    rows.push(['Mocowanie frontu C / K', 'ZF7C7002 / ZF7K7002', `${nA} / ${2 * nB}`, 'para']);
    rows.push(['Mocowanie tyłu C / K', 'ZB7C000S / ZB7K000S', `${nA} / ${2 * nB}`, 'para']);
    rows.push(['Zawieszki ukryte do szafek wiszących', 'np. Camar 807', G.V.len > 1400 ? '2 pary' : '1 para', 'na plecach nośnych, regulacja po zawieszeniu']);
    rows.push(['Wkręty 4 × 15 do prowadnic', '609.1500', 1, 'opak.']);
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
    const S = G.data.shop, L = S.links, P = S.prices, brass = metal === 'brass', V = G.V, nb = V.basins.length;
    const white = G.floor.look.basin === 'white';
    const items = [
      { group: 'Szafka', name: `Płyta Egger ${decor.code} ${decor.name}, ${decor.thick}, 2800 × 2070`, price: decor.price, qty: 1, where: S.mhm, url: decor.link, note: 'korpus, fronty i blat z jednego arkusza' },
      { group: 'Szafka', name: 'Cięcie, obrzeże ABS 2 mm (22 i 42 mm), otwory', price: null, where: S.mhm + ' — usługi / e-Rozkrój', url: L.mhmServices, note: 'arkusz eRozkroj z eksportu XLSX; odbiór na miejscu' },
      { group: 'Szafka', name: 'Płyta 16 mm na dna i tyły szuflad (formatki)', price: null, where: S.mhm, url: L.mhmBoards },
    ];
    if (V.nA) items.push({ group: 'Szafka', name: 'Blum LEGRABOX pure C NL 350, czarny mat — boki 770C3502S', price: P.legraboxC350, qty: V.nA, where: S.mhm, url: L.legrabox });
    if (V.nB) items.push({ group: 'Szafka', name: 'Blum LEGRABOX pure K NL 400, czarny mat — boki 770K4002S', price: null, qty: 2 * V.nB, where: S.mhm, url: L.legrabox });
    items.push({ group: 'Szafka', name: 'Prowadnice 750.xx01T, TIP-ON BLUMOTION T60L7340, mocowania', price: null, where: S.mhm, url: L.tipon, note: 'pełna lista w zakładce Szafka' });
    items.push(white
      ? { group: 'Umywalki', name: 'Catalano Green Lux 60 × 40, nablatowa z półką i otworem na baterię, biała, 160GRLXN00', price: null, qty: nb, where: 'tomdom.pl (wysyłka)', url: L.basinWhite, note: 'ten sam model co na parterze, w bieli; lokalnie przez salon łazienek w Bielsku, np. BLU' }
      : { group: 'Umywalka', name: 'Catalano Green Lux 60 × 40, nablatowa z półką i otworem na baterię, Nero Satinato (czarny mat), 160GRLXNNS', price: P.basinBlack, qty: nb, where: 'tanielazienki.pl (wysyłka)', url: L.basinBlack, note: 'bez przelewu, wys. 14 cm; lokalnie można zamówić przez salon łazienek w Bielsku, np. BLU' });
    const g = white ? 'Umywalki' : 'Umywalka';
    items.push({ group: g, name: white ? 'Korek ceramiczny Catalano bez przelewu, biały (pokrywa w kolorze umywalki)' : 'Korek ceramiczny Catalano 5POSLNS (czarny mat, bez przelewu)', price: white ? null : P.plug, qty: nb, where: 'skleparmatura.com', url: L.plug, note: 'pokrywa w kolorze umywalki — bez metalowego kółka; sprawdź dopasowanie do Green Lux' });
    items.push({ group: g, name: brass ? 'Bateria Hansgrohe Tecturis E 110 EcoSmart+, brąz szczotkowany, 73010140' : 'Bateria Hansgrohe Tecturis E 110 EcoSmart+ (wariant chrom 73010000 lub inny kolor pod armaturę prysznica)', price: null, qty: nb, where: 'Media Expert (odbiór w Bielsku-Białej)', url: L.tap, note: 'jednootworowa, stoi na półce umywalki' });
    items.push({ group: g, name: 'Syfon umywalkowy oszczędzający miejsce Geberit', price: null, qty: nb, where: 'Leroy Merlin Bielsko-Biała', url: L.siphon });
    items.push({ group: g, name: `Uszczelka EPDM 3 mm ${white ? 'biała' : 'czarna'}, samoprzylepna (taśma)`, price: null, qty: 1, where: 'Leroy Merlin / Castorama Bielsko-Biała' });
    if (G.type === 'attic') {
      items.push({ group: 'Wanna', name: `Wanna prostokątna akrylowa ${c0(G.BATH.len)} × ${c0(G.BATH.w)}, biała (np. Roca Linea)`, price: null, qty: 1, where: 'okazje.info.pl — porównanie cen', url: L.bath, note: 'zabudowa z płytek; pod oknem dachowym wzdłuż ścianki kolankowej' });
      items.push({ group: 'Wanna', name: brass ? 'Bateria wannowa natynkowa Hansgrohe Tecturis E, brąz szczotkowany, 73420140' : 'Bateria wannowa natynkowa Hansgrohe Tecturis E (73420000 chrom lub kolor pod armaturę)', price: null, qty: 1, where: 'Media Expert (odbiór w Bielsku-Białej)', url: L.bathTap, note: `na ściance kolankowej (wys. ${c0(G.KNEE)} cm), nad środkiem wanny` });
    }
    items.push({ group: 'Grzejnik', name: `Mexen Hades 1200 × 400, ${brass ? 'złoty' : 'złoty (w wariancie nikiel dobierz kolor chrom/inox)'}, 373 W`, price: P.radiator, qty: 1, where: 'Castorama Bielsko-Biała', url: L.radiator, note: `odbiór w sklepie lub dostawa; pas ściany od otworu drzwi do narożnika ${cm(G.XL - G.OX1)} cm, zawieszony od ${c0(G.RAD.y0)} cm` });
    items.push({ group: 'Grzejnik', name: 'Zawory grzejnikowe (para, przyłącze dolne), w kolorze grzejnika', price: null, qty: 1, where: 'Castorama Bielsko-Biała' });
    items.push({ group: 'Drzwi', name: 'Porta HIDE WC 80, bezprzylgowe, zestaw: skrzydło + ościeżnica ukryta, blokada WC', price: P.door, qty: 1, where: 'esklep-porta.pl', url: L.door, note: `wersja otwierana na zewnątrz (na korytarz, jak w projekcie) — stronę lewe/prawe potwierdź w sklepie; lico skrzydła równe ze ścianą od korytarza; otwór ${Math.round(G.floor.door.opening * 1000)} × 2070` });
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
      rows.push(['WC — oś', `${Math.round((G.ZW - G.WC_Z) * 1000)} od ściany z oknem`, 'stelaż Geberit Duofix w zabudowie 28 cm']);
      rows.push(['Prysznic — odpływ liniowy', `${Math.round(F.shower.drain * 1000)} przy ścianie dalszej, oś od ściany z oknem ${Math.round((G.ZW - G.SHOWER_ZC) * 1000)}`, 'Vogi Duo, ruszt pod płytkę']);
    } else {
      rows.push(['Okno dachowe', `${c0(G.RW.w)} × ${c0(G.RW.h)}, oś ${Math.round((G.XL - G.RW.x) * 1000)} od ściany z umywalką`, `dolna krawędź ok. ${c0(G.RW.y0)} cm nad podłogą`]);
      rows.push(['WC — oś', `${Math.round(G.WC_Z * 1000)} od ściany z drzwiami`, `stelaż Geberit w zabudowie ${c0(G.CASE.x1)} cm przy dolnej ścianie, podejście do pionu w rogu`]);
      rows.push(['Pion Ø160', `prawy dolny róg, w zabudowie WC`, 'w osi pionu z parteru']);
      rows.push(['Wanna — odpływ i bateria', `oś wanny ${Math.round((G.XL - G.RW.x) * 1000)} od ściany z umywalką`, `bateria natynkowa na ściance kolankowej, wys. ok. 700`]);
      rows.push(['Prysznic — odpływ liniowy', `${Math.round(F.shower.drain * 1000)} przy dolnej ścianie, w narożniku z drzwiami`, 'Vogi Duo, ruszt pod płytkę']);
    }
    rows.push(['Szafka — spód / blat / rant umywalki', `${V.bottomY} / ${V.topY} / ${V.rimY}`, `od drzwi ${V.z0} … ${V.z0 + V.len}`]);
    return rows;
  }

  function dims(G) {
    const F = G.floor, V = G.V;
    const common = [
      ['Szafka z umywalk' + (V.basins.length > 1 ? 'ami' : 'ą'), `${V.len / 10} × ${V.depth / 10} cm, blat ${V.topDepth / 10} cm, ${V.basins.length} × umywalka`],
      ['Umywalk' + (V.basins.length > 1 ? 'i' : 'a'), `Catalano Green Lux 60 × 40, ${F.look.basin === 'white' ? 'biała' : 'czarny mat'}`],
      ['Grzejnik', `Mexen Hades ${c0(G.RAD.w)} × ${c0(G.RAD.h)}, przy drzwiach, od ${c0(G.RAD.y0)} cm`],
      ['Drzwi', `ukryte Porta HIDE ${c0(F.door.leaf)}, otwór ${c0(F.door.opening)}, oś ${cm(F.door.axisFromVanityWall)} od ściany z umywalką, ${F.door.opensOut ? 'otwierane na korytarz' : 'otwierane do łazienki'}`],
    ];
    if (G.type === 'ground') return [
      ['Pomieszczenie', `${c0(G.ZW)} × ${c0(G.XL)} cm (wg projektu: ${c0(G.XL - G.SX)} z prysznicem)`], ['Prysznic', `${c0(F.shower.width)} × ${c0(F.shower.depth)} cm (wnęka przerobiona, ściany bez zmian)`],
      ['Powierzchnia', `${G.AREA.toFixed(2).replace('.', ',')} m²`], ['Wysokość (strop)', `${c0(G.H)} cm`],
      ['Sufit podwieszany', `${c0(G.CEILING_Y)} cm, szczelina LED ${c0(G.CEILING_GAP)} cm`], ['Oprawy', '4 × wpuszczane 3000 K, 1 × IP65 w prysznicu'],
      ['Okno', `${c0(F.window.width)} × ${c0(F.window.height)}, parapet ${c0(F.window.sill)}`], ['Ściana z oknem', `${c0(F.walls.exterior)} cm, szpaleta ${c0(F.walls.reveal)} cm w płytce`],
      ['Zabudowa WC + pion Ø160', `${c0(F.casing.length)} × ${c0(F.casing.depth)} × ${c0(G.H)}`], ['Oś WC od ściany z oknem', `${cm(G.ZW - G.WC_Z)} cm`],
      ['Szafka nad stelażem', `HEJSTA ${c0(G.CAB_W)} × ${c0(G.CAB_H)}, gł. ${c0(G.NICHE_DEPTH)}, wys. ${c0(G.CAB_Y0)}–${c0(G.CAB_Y0 + G.CAB_H)}`], ['Miska WC podwieszana', `${c0(F.wc.w)} × ${c0(F.wc.d)} cm`],
      ...common, ['Bok szafki → oś WC', `${cm(G.WC_Z - mm(V.z0 + V.len))} cm`],
      ['Drzwi prysznica', `${c0(F.shower.door)} cm, zawias na szybie stałej`], ['Szyba stała', `${c0(F.shower.width - F.shower.door)} cm, przy oknie`],
      ['Odpływ Vogi Duo', `przyścienny, ${c0(F.shower.drain)} cm, pod płytkę`], ['Fuga', '3 mm, w kolorze płytki'],
    ];
    return [
      ['Pomieszczenie', `${c0(G.ZW)} × ${c0(G.XL)} cm (wg projektu)`], ['Powierzchnia podłogi', `${G.AREA.toFixed(2).replace('.', ',')} m²`],
      ['Powierzchnia użytkowa (≥ 2,2 m 100 %, 1,4–2,2 m 50 %)', `${G.AREA_USABLE.toFixed(2).replace('.', ',')} m²`],
      ['Ścianka kolankowa', `${c0(G.KNEE)} cm`], ['Dach', `${G.floor.roof.pitch}°, płaski sufit ${c0(G.H)} cm od ${cm(G.ZF)} cm od drzwi`],
      ['Okno dachowe', `${c0(G.RW.w)} × ${c0(G.RW.h)} (VELUX), nad wanną`],
      ['Prysznic', `${c0(F.shower.width)} × ${c0(F.shower.depth)} cm, lewy dolny róg`], ['Drzwi prysznica', `${c0(F.shower.door)} cm + szyba stała ${c0(F.shower.width - F.shower.door)} cm, ścianka boczna szklana`],
      ['Wanna', `${c0(G.BATH.len)} × ${c0(G.BATH.w)}, zabudowana płytką, wzdłuż ścianki kolankowej`],
      ['WC', `oś ${cm(G.WC_Z)} cm od ściany z drzwiami, zabudowa ${c0(G.CASE.x1)} cm × wys. ${c0(G.CASE.h)} cm do pionu w rogu`],
      ...common, ['Odpływ liniowy prysznica', `${c0(F.shower.drain)} cm, pod płytkę`], ['Fuga', '3 mm, w kolorze płytki'],
    ];
  }

  /* ---------- XLSX sheets (data only; view.html writes the file) ---------- */
  function workbook(G, decor, metal) {
    const V = G.V, parts = cutParts(G, decor), { e22, e42 } = edgeLengths(G), edgeCode = `ABS 2 mm ${decor.code}`;
    const sheets = [];
    sheets.push({ name: 'eRozkroj', widths: [28, 9, 10, 6, 10, 10, 10, 10, 10, 26, 22, 44], rows: [
      ['Nazwa formatki', 'Długość', 'Szerokość', 'Ilość', 'Usłojenie', 'Okleina przód (D1)', 'Okleina tył (D2)', 'Okleina lewa (S1)', 'Okleina prawa (S2)', 'Płyta', 'Okleina', 'Uwagi'],
      ...parts.map(p => [p.name, p.a, p.b, p.qty, 1, ...p.e, p.mat, p.e.some(Boolean) ? edgeCode : '', p.note || '']),
    ] });
    sheets.push({ name: 'Formatki', widths: [28, 26, 6, 14, 12, 14, 50], rows: [
      ['Element', 'Materiał', 'Ilość', 'Wymiar 1 — wzdłuż słoja (mm)', 'Wymiar 2 (mm)', 'Obrzeże', 'Uwagi'],
      ...parts.map(p => [p.name, p.mat, p.qty, p.a, p.b, p.edge, p.note || '']),
      [], ['Obrzeże ABS 2 mm × 22 mm (m)', '', Math.ceil(e22 + 1)], ['Obrzeże ABS 2 mm × 42 mm, blat (m)', '', Math.ceil(e42 + .5)], ['Arkusze 2800 × 2070', '', 1],
    ] });
    sheets.push({ name: 'Szafka', widths: [38, 30, 10], rows: [['Parametr', 'Wartość', 'Jednostka'],
      ['Łazienka', `${G.floor.name} — ${G.floor.title}`, ''], ['Dekor płyty', `${decor.code} ${decor.name}`, ''],
      ['Szerokość korpusu', V.len, 'mm'], ['Głębokość korpusu', V.depth, 'mm'], ['Wysokość korpusu', V.height, 'mm'],
      ['Spód korpusu nad podłogą', V.bottomY, 'mm'], ['Blat (2 × 18)', `${V.len} × ${V.topDepth} × ${V.top}`, 'mm'], ['Wierzch blatu', V.topY, 'mm'],
      ['Rant umywalki', V.rimY, 'mm'], ['Początek szafki od ściany z drzwiami', V.z0, 'mm'], ['Koniec szafki od ściany z drzwiami', V.z0 + V.len, 'mm'],
      ['Osie umywalek od ściany z drzwiami', V.basins.map(b => V.z0 + b).join(', '), 'mm'], ['Sekcje', V.sections.join(' + '), ''],
      ['Szerokość wewn. sekcji (LW)', V.LW, 'mm'], ['Szczelina frontów', V.gap, 'mm'],
      ...(V.nA ? [['Front A', `${V.frontW} × ${V.frontA}`, 'mm'], ['Szuflada A', `LEGRABOX C, NL ${V.nlA}`, '']] : []),
      ...(V.nB ? [['Front B (×2)', `${V.frontW} × ${V.frontB}`, 'mm'], ['Szuflady B', `LEGRABOX K, NL ${V.nlB}`, '']] : []),
    ] });
    sheets.push({ name: 'Okucia Blum', widths: [48, 22, 8, 44], rows: [['Element', 'Nr katalogowy', 'Ilość', 'Uwagi'], ...hardware(G)] });
    const items = buyItems(G, decor, metal);
    sheets.push({ name: 'Zakupy', widths: [10, 60, 6, 12, 12, 28, 50, 60], links: items.map((it, i) => it.url ? [`G${i + 2}`, it.url] : null).filter(Boolean), rows: [
      ['Grupa', 'Produkt', 'Ilość', 'Cena jedn. brutto (zł)', 'Wartość (zł)', 'Gdzie kupić', 'Link', 'Uwagi'],
      ...items.map((it, i) => [it.group, it.name, it.qty || 1, it.price ?? '', it.price != null ? { f: `C${i + 2}*D${i + 2}` } : '', it.where, it.url || '', it.note || '']),
      ['', 'Razem (pozycje z ceną)', '', '', { f: `SUM(E2:E${items.length + 1})` }],
    ] });
    sheets.push({ name: 'Podejścia', widths: [42, 52, 44], rows: [['Punkt', 'Położenie (mm)', 'Uwagi'], ...points(G)] });
    sheets.push({ name: 'Wymiary', widths: [44, 60], rows: [['Element', 'Wymiar'], ...dims(G)] });
    sheets.push({ name: 'Kontrole', widths: [40, 18, 10], rows: [['Sprawdzenie', 'Wartość', 'OK'], ...G.checks.map(([k, v, ok]) => [k, v, ok ? 'tak' : 'NIE'])] });
    return sheets;
  }

  return { build, cutParts, edgeLengths, hardware, work, buyItems, points, dims, workbook, mm, cm };
})();
