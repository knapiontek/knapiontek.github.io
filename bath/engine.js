/* Bathroom "L grafit" — CALCULATION ENGINE.
   From BATH_DATA it computes the geometry (coordinates in metres for the 3D model and the plan) and the
   construction data (cut list, edge banding, hardware, shopping, installation points, dimensions, XLSX sheets).
   It draws nothing. view.html: const G = BathEngine.build(BATH_DATA). */
window.BathEngine = (function () {
  'use strict';

  const mm = v => v / 1000;
  const cm = v => String(Math.round(v * 200) / 2).replace('.', ',');   // m → cm rounded to 0.5

  function build(D) {
    const G = { data: D };

    /* ---------- room shell ---------- */
    G.H = D.room.height;
    G.CEILING_Y = D.room.ceiling;
    G.CEILING_GAP = D.room.ceilingGap;
    G.T = D.walls.t;
    G.WINDOW_WALL_T = D.walls.exterior;
    G.WINDOW_REVEAL = D.walls.reveal;
    G.XL = D.room.depth;                       // vanity wall face
    G.ZW = D.room.width;                       // window wall face
    G.SX = -D.shower.depth;                    // far shower wall face
    G.SZ = G.ZW - D.shower.width;              // thermostat partition face (start of the recess)
    G.SHOWER_ZC = (G.SZ + G.ZW) / 2;
    G.SHOWER_XC = G.SX / 2;

    // door: opening axis from the vanity wall; leaf centred in the opening
    const doorAxis = G.XL - D.door.axisFromVanityWall;
    G.DOOR_H = D.door.height;
    G.DX0 = doorAxis - D.door.leaf / 2;  G.DX1 = doorAxis + D.door.leaf / 2;
    G.OX0 = doorAxis - D.door.opening / 2; G.OX1 = doorAxis + D.door.opening / 2;

    // window: from the shower line towards the vanity
    G.WX0 = D.window.fromShowerLine; G.WX1 = G.WX0 + D.window.width;
    G.WIN_Y0 = D.window.sill; G.WIN_Y1 = D.window.sill + D.window.height;

    // WC casing with riser in the window corner
    G.ZX0 = G.XL - D.casing.depth;
    G.ZZ1 = G.ZW; G.ZZ0 = G.ZW - D.casing.length;
    G.PZ0 = G.ZW - D.casing.riserZone;
    G.NICHE_DEPTH = D.casing.niche;
    G.ZXB = G.ZX0 + G.NICHE_DEPTH;
    G.WC_Z = (G.ZZ0 + G.PZ0) / 2;
    G.RISER = { x: G.XL - .03 - D.casing.riser / 2, z: G.ZW - .03 - D.casing.riser / 2, r: D.casing.riser / 2 };
    G.CAB_W = D.wcCabinet.w; G.CAB_H = D.wcCabinet.h; G.CAB_Y0 = D.wcCabinet.y0;

    // vanity (mm) with derived values
    const V = G.V = { ...D.vanity };
    V.inner = V.len - 2 * V.t;
    V.innerH = V.height - 2 * V.t;
    V.LW = (V.inner - V.t) / 2;
    V.bodyD = V.depth - V.t;
    V.frontW = V.LW - 2 * V.gap;
    V.frontA = V.innerH - 2 * V.gap;
    V.frontB = Math.floor((V.innerH - 3 * V.gap) / 2);
    V.topY = V.bottomY + V.height + V.top;
    V.rimY = V.topY + V.gasket + V.basinH;

    // radiator on the door wall, in the corner next to the vanity wall
    const R = D.radiator;
    G.RAD = { ...R, x: G.XL - R.gapToCorner - R.w / 2 };

    // L-shaped outline [x, z], checks
    G.ROOM_OUTLINE = [[0, 0], [G.XL, 0], [G.XL, G.ZW], [G.SX, G.ZW], [G.SX, G.SZ], [0, G.SZ]];
    G.AREA = G.XL * G.ZW + (-G.SX) * (G.ZW - G.SZ);
    G.checks = [
      ['Oś WC → bok szafki', cm(G.WC_Z - mm(V.z0 + V.len)) + ' cm', G.WC_Z - mm(V.z0 + V.len) >= .40],
      ['Grzejnik → krawędź otworu drzwi', cm(G.RAD.x - R.w / 2 - G.OX1) + ' cm', G.RAD.x - R.w / 2 - G.OX1 >= 0],
      ['Szafka → zabudowa WC', cm(G.ZZ0 - mm(V.z0 + V.len)) + ' cm', G.ZZ0 > mm(V.z0 + V.len)],
      ['Okno → zabudowa WC', cm(G.ZX0 - G.WX1) + ' cm', G.ZX0 > G.WX1],
    ];
    return G;
  }

  /* ---------- cut list and edge banding ---------- */
  function cutParts(G, decor) {
    const { len, depth, height, inner, innerH, LW, bodyD, rail, topDepth, frontW, frontA, frontB, nlA, nlB } = G.V;
    const board = `${decor.code} 18 mm`, b16 = 'płyta 16 mm (dno/tył szuflad)';
    // e: edge banding [D1 front, D2 back — edges along dimension 1; S1 left, S2 right — along dimension 2]
    return [
      { name: 'Blat — warstwa górna',   qty: 1, a: len,     b: topDepth, e: [0,0,0,0], mat: board, edge: '—', note: 'sklejany z dolną, obrzeże 42 mm po sklejeniu na 4 bokach' },
      { name: 'Blat — warstwa dolna',   qty: 1, a: len,     b: topDepth, e: [0,0,0,0], mat: board, edge: '—', note: 'klej D3 / PUR' },
      { name: 'Bok korpusu',            qty: 2, a: depth,   b: height,   e: [1,0,1,0], mat: board, edge: 'przód, dół' },
      { name: 'Wieniec dolny',          qty: 1, a: inner,   b: bodyD,    e: [1,0,0,0], mat: board, edge: 'przód' },
      { name: 'Listwa górna przednia',  qty: 1, a: inner,   b: rail,     e: [1,0,0,0], mat: board, edge: 'przód' },
      { name: 'Listwa górna tylna',     qty: 1, a: inner,   b: rail,     e: [0,0,0,0], mat: board, edge: '—', note: 'otwór na wężyki baterii' },
      { name: 'Plecy nośne',            qty: 1, a: inner,   b: height,   e: [0,0,0,0], mat: board, edge: '—', note: 'zawieszki, otwory na odpływ i zawory' },
      { name: 'Przegroda',              qty: 1, a: bodyD,   b: innerH,   e: [0,0,1,0], mat: board, edge: 'przód' },
      { name: 'Front A (pod umywalką)', qty: 1, a: frontW,  b: frontA,   e: [1,1,1,1], mat: board, edge: '4 boki' },
      { name: 'Front B (2 szuflady)',   qty: 2, a: frontW,  b: frontB,   e: [1,1,1,1], mat: board, edge: '4 boki' },
      { name: 'Dno szuflady A',         qty: 1, a: LW - 35, b: nlA - 10, e: [0,0,0,0], mat: b16, edge: '—', note: 'LW − 35, NL − 10' },
      { name: 'Dno szuflady B',         qty: 2, a: LW - 35, b: nlB - 10, e: [0,0,0,0], mat: b16, edge: '—' },
      { name: 'Tył szuflady A (C)',     qty: 1, a: LW - 38, b: 148,      e: [1,0,0,0], mat: b16, edge: 'góra', note: 'LW − 38' },
      { name: 'Tył szuflady B (K)',     qty: 2, a: LW - 38, b: 101,      e: [1,0,0,0], mat: b16, edge: 'góra' },
    ];
  }
  function edgeLengths(G) {
    const { len, depth, height, inner, innerH, topDepth, frontW, frontA, frontB } = G.V;
    const e22 = 2 * height + 2 * depth + inner + inner + innerH + 2 * (frontW + frontA) + 4 * (frontW + frontB);
    const e42 = 2 * len + 2 * topDepth;
    return { e22: e22 / 1000, e42: e42 / 1000 };
  }

  /* ---------- processing, shopping, installation points, dimensions ---------- */
  function work(G) {
    const V = G.V;
    return [
      ['Cięcie i oklejanie', 'M-HM: formatki z tabeli, obrzeże ABS 2 mm na klej PUR (wilgoć). Blat: dwie warstwy skleić, potem okleić 4 boki obrzeżem 42 mm.'],
      ['Otwory w blacie', `Odpływ Ø 60 i wężyki baterii Ø 35 w obrysie stopki umywalki — <b>z szablonu po zakupie umywalki</b>. Oś: ${V.len - V.basinZ} mm od końca blatu przy WC. Krawędzie otworów zabezpieczyć klejem PUR lub lakierem.`],
      ['Umywalka bez silikonu', 'Pod stopkę czarna uszczelka EPDM 3 mm (taśma samoprzylepna, przycięta w obrysie, 3 mm cofnięta od krawędzi). Umywalkę dociska nakrętka korka od spodu blatu. Spoina wygląda jak cień 3 mm — bez silikonu.'],
      ['Bateria z umywalki', 'Bateria stoi na półce umywalki (otwór fabryczny), wężyki przechodzą przez blat i listwę tylną do zaworów za szufladą A.'],
      ['Syfon', `Syfon oszczędzający miejsce — płaski, tuż pod blatem nad szufladą A, wyjście w ścianę. Szuflada A ma NL ${V.nlA}, za nią ${V.bodyD - V.t - V.nlA} mm na zawory kątowe.`],
      ['Montaż', `Zawieszki na plecach nośnych, spód korpusu ${V.bottomY} mm nad podłogą. Styk blatu ze ścianą: wąska listwa przyblatowa albo fuga 2 mm akrylem w kolorze fugi.`],
    ];
  }

  function buyItems(G, decor, metal) {
    const S = G.data.shop, L = S.links, P = S.prices, brass = metal === 'brass';
    return [
      { group: 'Szafka', name: `Płyta Egger ${decor.code} ${decor.name}, ${decor.thick}, 2800 × 2070`, price: decor.price, qty: 1, where: S.mhm, url: decor.link, note: 'korpus, fronty i blat z jednego arkusza' },
      { group: 'Szafka', name: 'Cięcie, obrzeże ABS 2 mm (22 i 42 mm), otwory', price: null, where: S.mhm + ' — usługi / e-Rozkrój', url: L.mhmServices, note: 'arkusz eRozkroj z eksportu XLSX; odbiór na miejscu' },
      { group: 'Szafka', name: 'Płyta 16 mm na dna i tyły szuflad (formatki)', price: null, where: S.mhm, url: L.mhmBoards },
      { group: 'Szafka', name: 'Blum LEGRABOX pure C NL 350, czarny mat — boki 770C3502S', price: P.legraboxC350, qty: 1, where: S.mhm, url: L.legrabox },
      { group: 'Szafka', name: 'Blum LEGRABOX pure K NL 400, czarny mat — boki 770K4002S', price: null, qty: 2, where: S.mhm, url: L.legrabox },
      { group: 'Szafka', name: 'Prowadnice 750.xx01T, TIP-ON BLUMOTION T60L7340, mocowania', price: null, where: S.mhm, url: L.tipon, note: 'pełna lista w zakładce Szafka' },
      { group: 'Umywalka', name: 'Catalano Green Lux 60 × 40, nablatowa z półką i otworem na baterię, Nero Satinato (czarny mat), 160GRLXNNS', price: P.basin, qty: 1, where: 'tanielazienki.pl (wysyłka)', url: L.basin, note: 'bez przelewu, wys. 14 cm; lokalnie można zamówić przez salon łazienek w Bielsku, np. BLU' },
      { group: 'Umywalka', name: 'Korek ceramiczny Catalano 5POSLNS (czarny mat, bez przelewu)', price: P.plug, qty: 1, where: 'skleparmatura.com', url: L.plug, note: 'pokrywa w kolorze umywalki — bez metalowego kółka; sprawdź dopasowanie do Green Lux' },
      { group: 'Umywalka', name: brass ? 'Bateria Hansgrohe Tecturis E 110 EcoSmart+, brąz szczotkowany, 73010140' : 'Bateria Hansgrohe Tecturis E 110 EcoSmart+ (wariant chrom 73010000 lub inny kolor pod armaturę prysznica)', price: null, qty: 1, where: 'Media Expert (odbiór w Bielsku-Białej)', url: L.tap, note: 'jednootworowa, stoi na półce umywalki; wylewka trafia w środek misy' },
      { group: 'Umywalka', name: 'Syfon umywalkowy oszczędzający miejsce Geberit', price: null, qty: 1, where: 'Leroy Merlin Bielsko-Biała', url: L.siphon },
      { group: 'Umywalka', name: 'Uszczelka EPDM 3 mm czarna, samoprzylepna (taśma)', price: null, qty: 1, where: 'Leroy Merlin / Castorama Bielsko-Biała' },
      { group: 'Grzejnik', name: `Mexen Hades 1200 × 400, ${brass ? 'złoty' : 'złoty (w wariancie nikiel dobierz kolor chrom/inox)'}, 373 W`, price: P.radiator, qty: 1, where: 'Castorama Bielsko-Biała', url: L.radiator, note: `odbiór w sklepie lub dostawa; pas ściany od otworu drzwi do narożnika ${cm(G.XL - G.OX1)} cm, zawieszony od ${Math.round(G.RAD.y0 * 100)} cm; 373 W to mało na ~${G.AREA.toFixed(1).replace('.', ',')} m² — dołóż grzałkę albo ogrzewanie podłogowe` },
      { group: 'Grzejnik', name: 'Zawory grzejnikowe (para, przyłącze dolne), w kolorze grzejnika', price: null, qty: 1, where: 'Castorama Bielsko-Biała' },
      { group: 'Drzwi', name: 'Porta HIDE WC 80, bezprzylgowe, zestaw: skrzydło + ościeżnica ukryta, blokada WC', price: P.door, qty: 1, where: 'esklep-porta.pl', url: L.door, note: `wersja otwierana na zewnątrz (na korytarz, jak w projekcie), zawiasy od strony prysznica — stronę lewe/prawe potwierdź w sklepie; lico skrzydła równe ze ścianą od korytarza, od łazienki skrzydło cofnięte w ościeżu; otwór ${Math.round(G.data.door.opening * 1000)} × 2070` },
      { group: 'Drzwi', name: 'Klamka z rozetą WC w kolorze armatury', price: null, qty: 1, where: 'esklep-porta.pl / salon w Bielsku' },
    ];
  }

  function points(G) {
    const V = G.V, zb = V.z0 + V.basinZ, fromVanityWall = x => Math.round((G.XL - x) * 1000), R = G.RAD;
    return [
      ['Umywalka — odpływ w ścianie Ø 40', `od drzwi ${zb} · wys. ${V.bottomY + V.height - V.t - 45}`, 'syfon płaski pod blatem'],
      ['Umywalka — zawory kątowe ciepła / zimna', `od drzwi ${zb - 80} / ${zb + 80} · wys. 550`, `za szufladą A (NL ${V.nlA})`],
      ['Lustro LED — puszka', `od drzwi ${zb} · wys. ${Math.round((V.mirror.y + V.mirror.h / 2) * 1000) + 60}`, 'nad lustrem, IP44'],
      ['Grzejnik — oś', `ściana z drzwiami, ${fromVanityWall(R.x)} od ściany z umywalką`, `rurki ${Math.round(R.z * 1000)} mm od ściany`],
      ['Grzejnik — przyłącza dolne', `wys. ${Math.round(R.y0 * 1000) - 60}`, 'nad blatem szafki; rozstaw wg karty Mexen Hades'],
      ['Drzwi ukryte — otwór w murze', `${Math.round(G.data.door.opening * 1000)} × 2070, oś ${Math.round(G.data.door.axisFromVanityWall * 1000)} od ściany z umywalką`, `Porta HIDE ${G.data.door.opensOut ? 'na zewnątrz' : 'do wewnątrz'}: ościeżnica przed tynkiem i płytką`],
      ['Okno — otwór', `${Math.round(G.data.window.width * 1000)} × ${Math.round(G.data.window.height * 1000)}, parapet ${Math.round(G.WIN_Y0 * 1000)}`, `od linii prysznica ${Math.round(G.WX0 * 1000)}`],
      ['WC — oś', `${Math.round((G.ZW - G.WC_Z) * 1000)} od ściany z oknem`, 'stelaż Geberit Duofix w zabudowie 28 cm'],
      ['Prysznic — odpływ liniowy', `${Math.round(G.data.shower.drain * 1000)} przy ścianie dalszej, oś od ściany z oknem ${Math.round((G.ZW - G.SHOWER_ZC) * 1000)}`, 'Vogi Duo, ruszt pod płytkę'],
      ['Szafka — spód / blat / rant umywalki', `${V.bottomY} / ${V.topY} / ${V.rimY}`, `od drzwi ${V.z0} … ${V.z0 + V.len}`],
    ];
  }

  function dims(G) {
    const D = G.data, V = G.V, c = v => Math.round(v * 100);
    return [
      ['Pomieszczenie', `${c(G.ZW)} × ${c(G.XL)} cm (wg projektu: ${c(G.XL - G.SX)} z prysznicem)`], ['Prysznic', `${c(D.shower.width)} × ${c(D.shower.depth)} cm (wnęka przerobiona, ściany bez zmian)`],
      ['Powierzchnia', `${G.AREA.toFixed(2).replace('.', ',')} m²`], ['Wysokość (strop)', `${c(G.H)} cm`],
      ['Sufit podwieszany', `${c(G.CEILING_Y)} cm, szczelina LED ${c(G.CEILING_GAP)} cm`], ['Oprawy', '4 × wpuszczane 3000 K, 1 × IP65 w prysznicu'],
      ['Drzwi', `ukryte Porta HIDE ${c(D.door.leaf)}, otwór ${c(D.door.opening)}, oś ${c(D.door.axisFromVanityWall)} od ściany z umywalką, ${D.door.opensOut ? 'otwierane na korytarz' : 'otwierane do łazienki'}`],
      ['Okno', `${c(D.window.width)} × ${c(D.window.height)}, parapet ${c(D.window.sill)}`], ['Ściana z oknem', `${c(D.walls.exterior)} cm, szpaleta ${c(D.walls.reveal)} cm w płytce`],
      ['Zabudowa WC + pion Ø160', `${c(D.casing.length)} × ${c(D.casing.depth)} × ${c(G.H)}`], ['Oś WC od ściany z oknem', `${cm(G.ZW - G.WC_Z)} cm`],
      ['Szafka nad stelażem', `HEJSTA ${c(G.CAB_W)} × ${c(G.CAB_H)}, gł. ${c(G.NICHE_DEPTH)}, wys. ${c(G.CAB_Y0)}–${c(G.CAB_Y0 + G.CAB_H)}`], ['Miska WC podwieszana', `${c(D.wc.w)} × ${c(D.wc.d)} cm`],
      ['Szafka z umywalką', `${V.len / 10} × ${V.depth / 10} cm, blat ${V.topDepth / 10} cm`], ['Bok szafki → oś WC', `${cm(G.WC_Z - mm(V.z0 + V.len))} cm`],
      ['Umywalka', 'Catalano Green Lux 60 × 40, czarny mat'], ['Grzejnik', `Mexen Hades ${c(G.RAD.w)} × ${c(G.RAD.h)}, przy drzwiach, od ${c(G.RAD.y0)} cm`],
      ['Drzwi prysznica', `${c(D.shower.door)} cm, zawias na szybie stałej`], ['Szyba stała', `${c(D.shower.width - D.shower.door)} cm, przy oknie`],
      ['Odpływ Vogi Duo', `przyścienny, ${c(D.shower.drain)} cm, pod płytkę`], ['Fuga', '3 mm, w kolorze płytki'],
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
      ['Dekor płyty', `${decor.code} ${decor.name}`, ''], ['Szerokość korpusu', V.len, 'mm'], ['Głębokość korpusu', V.depth, 'mm'], ['Wysokość korpusu', V.height, 'mm'],
      ['Spód korpusu nad podłogą', V.bottomY, 'mm'], ['Blat (2 × 18)', `${V.len} × ${V.topDepth} × ${V.top}`, 'mm'], ['Wierzch blatu', V.topY, 'mm'],
      ['Rant umywalki', V.rimY, 'mm'], ['Początek szafki od ściany z drzwiami', V.z0, 'mm'], ['Koniec szafki od ściany z drzwiami', V.z0 + V.len, 'mm'],
      ['Oś umywalki od ściany z drzwiami', V.z0 + V.basinZ, 'mm'], ['Szerokość wewn. sekcji (LW)', V.LW, 'mm'], ['Szczelina frontów', V.gap, 'mm'],
      ['Front A', `${V.frontW} × ${V.frontA}`, 'mm'], ['Front B (×2)', `${V.frontW} × ${V.frontB}`, 'mm'], ['Szuflada A', `LEGRABOX C, NL ${V.nlA}`, ''], ['Szuflady B', `LEGRABOX K, NL ${V.nlB}`, ''],
    ] });
    sheets.push({ name: 'Okucia Blum', widths: [48, 22, 8, 44], rows: [['Element', 'Nr katalogowy', 'Ilość', 'Uwagi'], ...G.data.hardware.map(r => [...r])] });
    const items = buyItems(G, decor, metal);
    sheets.push({ name: 'Zakupy', widths: [10, 60, 6, 12, 12, 28, 50, 60], links: items.map((it, i) => it.url ? [`G${i + 2}`, it.url] : null).filter(Boolean), rows: [
      ['Grupa', 'Produkt', 'Ilość', 'Cena jedn. brutto (zł)', 'Wartość (zł)', 'Gdzie kupić', 'Link', 'Uwagi'],
      ...items.map((it, i) => [it.group, it.name, it.qty || 1, it.price ?? '', it.price != null ? { f: `C${i + 2}*D${i + 2}` } : '', it.where, it.url || '', it.note || '']),
      ['', 'Razem (pozycje z ceną)', '', '', { f: `SUM(E2:E${items.length + 1})` }],
    ] });
    sheets.push({ name: 'Podejścia', widths: [42, 52, 44], rows: [['Punkt', 'Położenie (mm)', 'Uwagi'], ...points(G)] });
    sheets.push({ name: 'Wymiary', widths: [32, 60], rows: [['Element', 'Wymiar'], ...dims(G)] });
    sheets.push({ name: 'Kontrole', widths: [36, 14, 10], rows: [['Sprawdzenie', 'Wartość', 'OK'], ...G.checks.map(([k, v, ok]) => [k, v, ok ? 'tak' : 'NIE'])] });
    return sheets;
  }

  return { build, cutParts, edgeLengths, work, buyItems, points, dims, workbook, mm, cm };
})();
