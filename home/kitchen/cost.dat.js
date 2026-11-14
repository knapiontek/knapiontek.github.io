/* Kitchen project cost data - read by cost-sheets.js (Info of view.html). Written for each project (LLM). Plain JSON after "window.KITCHEN_COST =".
   Everything measured comes from design.dat.js through engine.js, the appliance sizes from ../library/products: nothing here repeats
   a calculated number.
     page        tab title, heading, info line, XLSX file name, excluded (what the estimate does not cover)
     params      the inputs above the estimate (waste, sheet size in m², reserve); a value or a formula
     values      fixed numbers of the estimate: stock sizes (sheet, worktop board, plasterboard), allowances
     labels      fronts: the label of a front in the cutting list, by its type and tags (first match; none = its type);
                 sheet: the label of the sheet input; cuttingNote: the text under the cutting list; legend: a remark per
                 hole kind in the drilling rules of the Montaż tab
     blocks      cutting-list tables, code = the two letters of their row labels (KO-07), rows built by engine.js: id = fronts | strips | plinths | frontPanels | wallPanels | plaster | worktops | endPanels,
                 or a material use (carcass, drawerBox, backPanel ...: every board of that use's material); cut = priced saw
                 cuts; columns = the header when not Element / Długość / Szerokość / Ilość
     categories  estimate items, by category {name, appliances, items}; appliances = the category counts as AGD, not
                 furniture. An item: id; product (its key in ../library/products) or material (a use of design.dat.js: its
                 board), with name (the use, a material's only); spec (only what this project adds to the product's own);
                 use (where it goes); qty (a number or a formula); refs (ids of the notes it links to). The name, spec, unit,
                 price, its source and the links of a product are the library's.
     notes       Notes tab, by section {name, notes}; a note: id, appliance (its documents come from the library), topic,
                 description, assumed (in the estimate), decide (open question), links [{name, url}]; \n starts a new line.
                 Notes and sections are numbered in this order.
     formulas    named calculations used in several texts ({f:name}), written like {=...} without the braces
   Texts and formulas may hold placeholders:
     {n:hinges}        engine count ({n:type.oven}, {n:tag.bins} = items with that type / tag, 0 when none)
     {s:drawers.D.frontAbove} design.dat.js setting     {t:carcass} thickness, {d:worktop} depth (as bought) and {m:cabinet} material label of a board type or part
                       (a material use of engine.js: a board type, islandWorktop, endPanel, islandEndPanel, carcass, backPanel, drawerBox, hobPanel)
     {w:1.depth}       worktop of group 1  {g:3.backGap} group 3 (backGap, name)  {k:K25.innerWidth} carcass by name: width, height, innerWidth, v0, v1
     {i:K25/oven.space} item by carcass name or place (G1[6]) and type or tag, #2 = the second from the bottom:
                       width, height, v0, v1 (module), frontWidth, frontHeight, frontV0, frontV1 (front),
                       spaceBottom, spaceTop, space (clear height between the horizontal boards of the carcass around it),
                       count, runnerLength, boxWidth, boxHeight (drawers behind its door), hinge (hinge side of its door),
                       edges (banded edges of a panel), fit.feet, fit.fasciaV0 ... (its appliance: engine.js fitAppliances)
     {a:oven.fascia.height}  the appliance (library) {v:sheet.length} values
     {p:hinges}        unit price          {q:hinges} item quantity          {note:hinges} the number of a note
     {f:ovenMicrowaveGap}  a named formula of "formulas"
     {carcass.m2}      cutting-list total of a block (m2, edge, cut, qty)    {waste} {sheet} {reserve} params
     {=expression}     a calculation with placeholders in angle brackets, e.g. {=(<a:oven.fascia.width> - <k:K25.innerWidth>) / 2},
                       with ROUND, ROUNDUP, MIN, MAX;  |% shows a fraction as a percentage
   A quantity formula ("=..." in qty) uses the placeholders in braces and ROUNDUP only: it is exported as an Excel formula. */
window.KITCHEN_COST = {
 "page": {
  "title": "Kosztorys kuchni Jaworze",
  "heading": "Kosztorys materiałów – Kuchnia Jaworze (grupa 1+2 w L, wyspa grupa 3)",
  "info": "PLN brutto, ceny sklepów internetowych z października 2026 (każda pozycja ma link do sklepu), tylko materiały (montaż własny). Niebieskie pola można zmieniać, by sprawdzić inne ceny do odświeżenia strony; stałe ceny wpisuje się w dane kosztorysu na tej stronie. Ilości z formułą pochodzą z design.dat.js.",
  "xlsxFile": "kosztorys_kuchnia_jaworze.xlsx",
  "excluded": [
   "Robocizna, transport, elektryka (płyta 400 V, obwody piekarnika, zmywarki, lodówki), hydraulika, prace GK (materiały GK są w kosztorysie)."
  ]
 },
 "params": {
  "waste": 0.15,
  "sheet": "={v:sheet.length}*{v:sheet.width}/1000000",
  "reserve": 0.05
 },
 "values": {
  "sheet": {
   "length": 2800,
   "width": 2070
  },
  "worktopBoard": {
   "length": 4100
  },
  "plasterboard": {
   "length": 2600,
   "width": 1200
  },
  "edgeAllowance": 0.1,
  "confirmatsPerCarcass": 18,
  "screwsPerMetre": 4,
  "backScrewsPerM2": 30,
  "bracketsPerDummy": 4
 },
 "labels": {
  "fronts": [
   {
    "type": "drawer",
    "tags": [
     "dummy"
    ],
    "function": "front atrapa"
   },
   {
    "type": "drawer",
    "tags": [
     "bins"
    ],
    "function": "szuflada zlewowa (kosze)"
   },
   {
    "type": "drawer",
    "function": "szuflada"
   },
   {
    "type": "cabinet",
    "tags": [
     "fridge",
     "freezer",
     "dishwasher"
    ],
    "function": "front na drzwiach AGD"
   },
   {
    "type": "cabinet",
    "tags": [
     "doorDrawers"
    ],
    "function": "drzwi, za nimi szuflady"
   },
   {
    "type": "cabinet",
    "function": "drzwi"
   }
  ],
  "sheet": "Arkusz płyty {v:sheet.length}×{v:sheet.width} [m²]",
  "cuttingNote": "Wymiary: długość × szerokość, dłuższy bok pierwszy; fronty szerokość × wysokość.\nKrawędź: liczba wykończonych krawędzi wzdłuż wymiaru obok (0, 1, 2), jak w formularzu hurtowni.\nSumy: obrzeże razem = długość obrzeża × ilość; cięcia = (długość + szerokość) × ilość.\nKorpus: gł. {s:carcass.depth}, od ściany {g:1.backGap} (grupa 1), {g:2.backGap} (grupa 2); front {s:carcass.frontGap} przed korpusem; wnętrze = szerokość − 2 × {t:carcass}.\nPółki: ruchoma = wnętrze − 2 × {s:shelf.clearance}, gł. − {s:shelf.setback}; stała = pełna głębokość (nad piekarnikiem i lodówką − {s:shelf.ventGap}).\nPlecy = korpus − 2 × {s:backPanel.inset}; front = moduł − 4 szczeliny; listwa tylna = {s:strip.depth} × długość korpusu obok (listwa pionowa; skrócić na miejscu pod kątownik) lub pod nią (listwa pozioma).\nSzuflady: dno = wnętrze − {s:drawers.bottom.inset} × {s:drawers.bottom.depth}; tył = wnętrze − {s:drawers.back.inset}.\nObrzeże: tylko krawędzie widoczne (fronty: wszystkie, listwy przednie: przednia, panele przednie: przy otwieranym froncie); strona każdej krawędzi w zakładce Montaż.\nPłyty lakierowane: lakier na obu stronach.\nBlaty: krawędź przednia fabryczna, wycięcia bez obrzeża.",
  "legend": {
   "runner": "pozycje do potwierdzenia wg Blum i Häfele"
  }
 },
 "blocks": [
  {
   "id": "fronts",
   "code": "FR",
   "title": "FRONTY – {m:cabinet}, shaker, lakierowane dookoła",
   "columns": [
    "Funkcja",
    "Szerokość",
    "Wysokość",
    "Ilość"
   ]
  },
  {
   "id": "strips",
   "code": "LI",
   "title": "LISTWY PRZEDNIE – {m:strip} na sztorc, gł. {s:strip.depth}, lakierowane obustronnie i krawędź przednia"
  },
  {
   "id": "plinths",
   "code": "CO",
   "title": "COKÓŁ – {m:plinth}, wilgocioodporny, lakierowany obustronnie"
  },
  {
   "id": "frontPanels",
   "code": "PA",
   "title": "PANELE PRZEDNIE I PANEL TYLNY WYSPY – {m:frontPanel} na płasko, lakierowane obustronnie i krawędzie przy otwieranych frontach"
  },
  {
   "id": "wallPanels",
   "code": "PS",
   "title": "PANEL ŚCIENNY – {m:wallPanel}, na ścianie nad blatem"
  },
  {
   "id": "carcass",
   "code": "KO",
   "title": "KORPUSY – wszystkie części z {m:carcass}: cięcie + obrzeże 0,8 na krawędziach widocznych (z listwami tylnymi, półką wysuwaną, słupkami zawiasowymi, panelami wpuszczanymi, płytami dystansowymi)",
   "cut": true
  },
  {
   "id": "drawerBox",
   "code": "SZ",
   "title": "SZUFLADY – wszystkie części z {m:drawerBox}: dna i tyły TANDEMBOX (z szufladami wewnętrznymi), szuflady za drzwiami i przegroda pod płytą",
   "cut": true
  },
  {
   "id": "backPanel",
   "code": "PL",
   "title": "PLECY – {m:backPanel}, tylko za drzwiami szafek"
  },
  {
   "id": "worktops",
   "code": "BL",
   "title": "BLATY – {m:worktop} (blat), {m:islandWorktop} (wyspa); wycięcia na zlew (WZ) i płytę (WP) wg legendy"
  },
  {
   "id": "endPanels",
   "code": "PK",
   "title": "PANELE KOŃCOWE – {m:endPanel} ({d:endPanel} grupa 1, {d:islandEndPanel} wyspa); blat wystaje {s:worktop.endPanelOverhang} mm poza panel końcowy (bok, przód, w wyspie tył)"
  },
  {
   "id": "plaster",
   "code": "GK",
   "title": "ZABUDOWA GK – GKBI 12,5 na CD60 / UD27, gł. {s:plasterboard.depth} (zabudowa do sufitu, grupa 2)"
  }
 ],
 "categories": [
  {
   "name": "Fronty, listwy przednie i cokół",
   "items": [
    {
     "id": "fronts",
     "material": "cabinet",
     "name": "Fronty shaker",
     "spec": "{m:cabinet}, MDF, lakierowane dookoła",
     "use": "drzwi i szuflady (lista cięć: FRONTY)",
     "qty": "={fronts.m2}",
     "refs": [
      "lacquered"
     ]
    },
    {
     "id": "strips",
     "material": "strip",
     "name": "Listwy przednie",
     "spec": "{m:strip}, lakierowane obustronnie i krawędź przednia",
     "use": "między frontami, na sztorc, gł. {s:strip.depth} (lista cięć: LISTWY)",
     "qty": "={strips.m2}",
     "refs": [
      "stripsPanels",
      "lacquered"
     ]
    },
    {
     "id": "plinths",
     "material": "plinth",
     "name": "Cokół",
     "spec": "{m:plinth}, MDF wilgocioodporny, lakierowany obustronnie",
     "use": "pod korpusami, na klipsach nóżek (lista cięć: COKÓŁ)",
     "qty": "={plinths.m2}",
     "refs": [
      "lacquered",
      "corner"
     ]
    },
    {
     "id": "frontPanels",
     "material": "frontPanel",
     "name": "Panele przednie",
     "spec": "{m:frontPanel}, lakierowane obustronnie i krawędzie przy otwieranych frontach",
     "use": "na płasko w płaszczyźnie frontów; panel tylny wyspy (lista cięć: PANELE)",
     "qty": "={frontPanels.m2}",
     "refs": [
      "lacquered",
      "hiddenSides"
     ]
    }
   ]
  },
  {
   "name": "Korpusy",
   "items": [
    {
     "id": "carcassBoard",
     "material": "carcass",
     "name": "Płyta korpusów",
     "spec": "{m:carcass}, arkusz {v:sheet.length} × {v:sheet.width}",
     "use": "boki, wieńce, trawersy, półki, listwy tylne, słupki zawiasowe, płyty dystansowe; + {waste|%} odpadu",
     "qty": "=ROUNDUP({carcass.m2}*(1+{waste})/{sheet},0)",
     "refs": [
      "carcassBoard"
     ]
    },
    {
     "id": "drawerBoard",
     "material": "drawerBox",
     "name": "Płyta szuflad",
     "spec": "{m:drawerBox}, arkusz {v:sheet.length} × {v:sheet.width}",
     "use": "dna i tyły szuflad TANDEMBOX, szuflady za drzwiami, przegroda pod płytą grzewczą",
     "qty": "=ROUNDUP({drawerBox.m2}*(1+{waste})/{sheet},0)"
    },
    {
     "id": "backBoard",
     "material": "backPanel",
     "name": "Plecy HDF",
     "spec": "{m:backPanel}, arkusz {v:sheet.length} × {v:sheet.width}",
     "use": "plecy za drzwiami szafek",
     "qty": "=ROUNDUP({backPanel.m2}*(1+{waste})/{sheet},0)"
    },
    {
     "id": "cutting",
     "product": "m-hm-board-cutting",
     "use": "płyty korpusów i szuflad, wg listy cięć",
     "qty": "={carcass.cut}+{drawerBox.cut}"
    },
    {
     "id": "carcassEdging",
     "product": "edge-banding-u708-pur",
     "use": "widoczne krawędzie korpusów i szuflad za drzwiami, wg listy cięć + {v:edgeAllowance|%}",
     "qty": "=({carcass.edge}+{drawerBox.edge})*(1+{v:edgeAllowance})"
    }
   ]
  },
  {
   "name": "Okucia",
   "items": [
    {
     "id": "hinges",
     "product": "blum-clip-top-blumotion-110-71b3550",
     "spec": "puszka Ø{s:drilling.cup.diameter}",
     "use": "drzwi; liczba wg wysokości frontu",
     "qty": "={n:hinges}"
    },
    {
     "id": "bumpers",
     "product": "blum-servo-drive-993-0530",
     "spec": "otwór Ø{s:drilling.bumper.diameter}, gł. {s:drilling.bumper.depth}; trzyma szczelinę {s:carcass.frontGap}",
     "use": "przednia krawędź boku korpusu, naprzeciw każdego zawiasu, na jego wysokości",
     "qty": "={n:bumpers}"
    },
    {
     "id": "pullOutShelfRunners",
     "product": "blum-movento-760h5000s",
     "use": "półka wysuwana w szafce z ekspresem",
     "qty": "={n:pullOutShelves}",
     "refs": [
      "pullOutShelf"
     ]
    },
    {
     "id": "drawersD",
     "product": "blum-tandembox-antaro-d-500",
     "use": "szuflady z frontem > {s:drawers.D.frontAbove}",
     "qty": "={n:drawersD}",
     "refs": [
      "sinkCabinet"
     ]
    },
    {
     "id": "drawersM",
     "product": "blum-tandembox-antaro-m-500",
     "use": "szuflady z frontem ≤ {s:drawers.D.frontAbove}",
     "qty": "={n:drawersM}"
    },
    {
     "id": "innerDrawers",
     "product": "blum-tandembox-antaro-m-500-inner",
     "spec": "przycięty do szer. wnętrza − {s:drawers.inner.frontDeduction}",
     "use": "na sztućce, za górnym frontem szuflad wyspy",
     "qty": "={n:innerDrawers}",
     "refs": [
      "innerDrawers"
     ]
    },
    {
     "id": "ballRunners",
     "product": "hafele-ball-runners-494-02-184",
     "spec": "L = {i:K29/doorDrawers.runnerLength}",
     "use": "szuflady za drzwiami, luz {s:doorDrawers.clearance} na stronę",
     "qty": "={n:doorDrawers}",
     "refs": [
      "doorDrawers"
     ]
    },
    {
     "id": "cutleryTrays",
     "product": "hettich-orgatray-440",
     "use": "szuflady wewnętrzne wyspy (korpus {k:K31.width}, prowadnice 500)",
     "qty": "={n:innerDrawers}",
     "refs": [
      "innerDrawers"
     ]
    },
    {
     "id": "bins",
     "product": "amix-rubio-80-3x15",
     "use": "szuflada zlewowa D (NL 500)",
     "qty": "={n:tag.bins}",
     "refs": [
      "sinkCabinet"
     ]
    },
    {
     "id": "handles",
     "product": "ikea-eneryda-shell-brass",
     "use": "1 na front",
     "qty": "=ROUNDUP({n:handles}/2,0)"
    },
    {
     "id": "legs",
     "product": "hafele-axilo-h150",
     "use": "{s:carcass.legs} na korpus na cokole, cofnięte za cokół",
     "qty": "={n:legs}"
    },
    {
     "id": "plinthClips",
     "product": "hafele-axilo-plinth-clip",
     "use": "przednie nóżki",
     "qty": "={n:legs}/2"
    },
    {
     "id": "shelfPins",
     "product": "shelf-pins-5-zinc",
     "use": "{=<n:shelfPins> / <n:shelvesAdjustable>} na półkę ruchomą",
     "qty": "=ROUNDUP({n:shelfPins}/100,0)"
    },
    {
     "id": "confirmats",
     "product": "confirmat-6-4x50",
     "use": "skręcanie korpusów, ok. {v:confirmatsPerCarcass} na korpus ({n:carcasses} korpusów)",
     "qty": "=ROUNDUP({n:carcasses}*{v:confirmatsPerCarcass}/1000,0)"
    },
    {
     "id": "connectors",
     "product": "connector-5-m4-nickel",
     "use": "skręcanie korpusów, narożnik L",
     "qty": 1,
     "refs": [
      "corner"
     ]
    },
    {
     "id": "wallBrackets",
     "product": "domax-bracket-40x40x17",
     "use": "listwa tylna do ściany, na styku listew w stosie; najwyższa bez kątownika",
     "qty": "={n:wallBrackets}",
     "refs": [
      "wallFixing"
     ]
    },
    {
     "id": "wallAnchors",
     "product": "fischer-duopower-8x65",
     "use": "kątowniki do ściany (gazobeton), 1 na kątownik",
     "qty": "=ROUNDUP({n:wallBrackets}/25,0)",
     "refs": [
      "wallFixing"
     ]
    },
    {
     "id": "smallScrews",
     "product": "standers-screw-4x16",
     "use": "kątownik do listwy tylnej (2 na kątownik), plecy HDF (ok. {v:backScrewsPerM2} na m²); nie przebija płyty 18",
     "qty": "=ROUNDUP(({n:wallBrackets}*2+{backPanel.m2}*{v:backScrewsPerM2})/35,0)",
     "refs": [
      "wallFixing"
     ]
    },
    {
     "id": "jointScrews",
     "product": "standers-screw-4x30",
     "use": "listwy przednie i tylne do pierwszego korpusu, {v:screwsPerMetre} na mb",
     "qty": "=ROUNDUP({n:jointLength.screwed}/1000*{v:screwsPerMetre}*2/25,0)",
     "refs": [
      "wallFixing"
     ]
    },
    {
     "id": "brassScrews",
     "product": "brass-screw-4x30",
     "use": "drugi korpus do listew, od środka korpusu (widoczne), {v:screwsPerMetre} na mb",
     "qty": "=ROUNDUP({n:jointLength.fromInside}/1000*{v:screwsPerMetre}*2,0)",
     "refs": [
      "wallFixing"
     ]
    },
    {
     "id": "brackets",
     "product": "bracket-20x20x16",
     "use": "fronty atrap, {v:bracketsPerDummy} na front",
     "qty": "=ROUNDUP({n:tag.dummy}*{v:bracketsPerDummy}/10,0)"
    },
    {
     "id": "grilles",
     "product": "gtv-plinth-grille-480x60",
     "use": "cokół pod lodówką i piekarnikiem (Bosch: 200 cm² wlotu)",
     "qty": "={n:grilles}",
     "refs": [
      "oven",
      "fridgeAir"
     ]
    }
   ]
  },
  {
   "name": "Blaty i panel ścienny",
   "items": [
    {
     "id": "worktop",
     "material": "worktop",
     "name": "Blat grupy 1",
     "spec": "{m:worktop}, {d:worktop} × {v:worktopBoard.length} × {t:worktop}, krawędź przednia fabryczna",
     "use": "grupa 1, przycięty z tyłu do {w:1.depth}",
     "qty": 1,
     "refs": [
      "worktops"
     ]
    },
    {
     "id": "islandWorktop",
     "material": "islandWorktop",
     "name": "Blat wyspy",
     "spec": "{m:islandWorktop}, {d:islandWorktop} × {v:worktopBoard.length} × {t:islandWorktop}, krawędź przednia fabryczna",
     "use": "wyspa, przycięty z tyłu do {w:3.depth}; krawędź tylna z obrzeżem",
     "qty": 1,
     "refs": [
      "worktops"
     ]
    },
    {
     "id": "endPanelBoard",
     "material": "endPanel",
     "name": "Panele końcowe",
     "spec": "{m:endPanel}, dwustronne, gł. {d:endPanel} i {d:islandEndPanel}",
     "use": "pod końcami blatów; blat wystaje {s:worktop.endPanelOverhang} (lista cięć: PANELE KOŃCOWE)",
     "qty": "={endPanels.m2}",
     "refs": [
      "worktops"
     ]
    },
    {
     "id": "worktopEdging",
     "product": "edge-banding-h1180-pur",
     "use": "boki blatu nad panelami końcowymi, tył blatu wyspy, przody paneli końcowych (w wyspie też tyły)",
     "qty": "=({worktops.edge}+{endPanels.edge})*(1+{v:edgeAllowance})",
     "refs": [
      "worktops"
     ]
    },
    {
     "id": "wallPanel",
     "material": "wallPanel",
     "name": "Panel ścienny",
     "spec": "{m:wallPanel}, arkusz {v:sheet.length} × {v:sheet.width} × {t:wallPanel}",
     "use": "ściana nad blatem (lista cięć: PANEL ŚCIENNY)",
     "qty": "=ROUNDUP({wallPanels.m2}*(1+{waste})/{sheet},0)"
    },
    {
     "id": "worktopJoints",
     "product": "worktop-joint-zlm-26",
     "use": "blat z panelem końcowym, 2 na panel",
     "qty": "={n:type.endPanel}*2",
     "refs": [
      "worktops"
     ]
    },
    {
     "id": "silicone",
     "product": "silicone-sanitary-white-300",
     "use": "blat do ściany, zlew",
     "qty": 2
    }
   ]
  },
  {
   "name": "Zabudowa GK (grupa 2)",
   "items": [
    {
     "id": "plasterboard",
     "product": "norgips-gkbi-12-5",
     "spec": "{v:plasterboard.width} × {v:plasterboard.length}",
     "use": "czoło i bok zabudów GK, {s:plasterboard.layers} warstwy; + {waste|%} odpadu",
     "qty": "=ROUNDUP({plaster.m2}*{s:plasterboard.layers}*(1+{waste})/({v:plasterboard.width}*{v:plasterboard.length}/1000000),0)",
     "refs": [
      "plaster"
     ]
    },
    {
     "id": "profileCD",
     "product": "budmat-cd60",
     "use": "krawędź zewnętrzna i poprzeczki co {s:plasterboard.studSpacing}",
     "qty": "=ROUNDUP({n:plasterCD}/3000,0)",
     "refs": [
      "plaster"
     ]
    },
    {
     "id": "profileUD",
     "product": "budmat-ud27",
     "use": "przy ścianie i suficie",
     "qty": "=ROUNDUP({n:plasterUD}/3000,0)",
     "refs": [
      "plaster"
     ]
    },
    {
     "id": "jointFiller",
     "product": "knauf-uniflott-5",
     "use": "spoiny i narożniki GK",
     "qty": 1
    },
    {
     "id": "plasterScrews",
     "product": "4pro-drywall-screw-3-5x35",
     "use": "płyty GK do profili",
     "qty": 1
    },
    {
     "id": "profileScrews",
     "product": "standers-profile-screw-3-5x9-5",
     "use": "profil do profilu",
     "qty": 1
    },
    {
     "id": "anchors",
     "product": "standers-quick-anchor-6x40",
     "use": "profile UD do ściany i sufitu",
     "qty": 1
    },
    {
     "id": "jointTape",
     "product": "joint-tape-50x25",
     "use": "spoiny płyt GK",
     "qty": 1
    },
    {
     "id": "cornerBead",
     "product": "rigips-corner-bead-23-5",
     "use": "zewnętrzne krawędzie zabudów GK",
     "qty": "=ROUNDUP({n:plasterEdge}/3000,0)"
    },
    {
     "id": "seal",
     "product": "t-seal-silicone-white",
     "use": "szczelina między GK a meblami (3–5); dobrać rozmiar",
     "qty": "=ROUNDUP({n:plasterEdge}/1000*(1+{v:edgeAllowance}),0)"
    }
   ]
  },
  {
   "name": "AGD",
   "appliances": true,
   "items": [
    {
     "id": "sink",
     "product": "ikea-kilsviken",
     "spec": "{a:sink.body.width} × {a:sink.body.depth}, komora {a:sink.bowl.width} × {a:sink.bowl.depth} × {a:sink.bowl.height}",
     "use": "blat nad szafką zlewową",
     "qty": "={n:sinks}",
     "refs": [
      "sink",
      "sinkTap"
     ]
    },
    {
     "id": "trap",
     "product": "deante-space-saver-zxy-9917",
     "use": "szafka zlewowa; zostawia miejsce na szufladę z koszami",
     "qty": "={n:sinks}",
     "refs": [
      "sinkCabinet",
      "sinkTap"
     ]
    },
    {
     "id": "tap",
     "product": "deante-silia-bqs-z73m",
     "use": "zlew",
     "qty": "={n:sinks}",
     "refs": [
      "sinkTap"
     ]
    },
    {
     "id": "coffee",
     "product": "delonghi-dinamica",
     "use": "półka wysuwana w szafce z ekspresem",
     "qty": "={n:tag.coffee}",
     "refs": [
      "pullOutShelf"
     ]
    },
    {
     "id": "fridge",
     "product": "bosch-kis86afe0",
     "spec": "wys. {a:fridgeFreezer.body.height}",
     "use": "słupek lodówki, fronty na drzwiach urządzenia",
     "qty": "={n:fridges}",
     "refs": [
      "fridge",
      "fridgeAir"
     ]
    },
    {
     "id": "dishwasher",
     "product": "bosch-smv4hvx00e",
     "use": "pod blatem, front na drzwiach urządzenia",
     "qty": "={n:tag.dishwasher}",
     "refs": [
      "dishwasher"
     ]
    },
    {
     "id": "hob",
     "product": "electrolux-cit61443",
     "spec": "wycięcie {s:cutouts.hob.width} × {s:cutouts.hob.depth}",
     "use": "blat nad korpusem z płytą",
     "qty": "={n:hobs}",
     "refs": [
      "hob"
     ]
    },
    {
     "id": "oven",
     "product": "bosch-hba534bb3",
     "spec": "wys. {a:oven.fascia.height}",
     "use": "słupek, pod mikrofalówką",
     "qty": "={n:type.oven}",
     "refs": [
      "oven",
      "ovenColumn"
     ]
    },
    {
     "id": "microwave",
     "product": "bosch-bfl623mb3",
     "use": "słupek, nad piekarnikiem",
     "qty": "={n:type.microwave}",
     "refs": [
      "microwave",
      "ovenColumn"
     ]
    },
    {
     "id": "hood",
     "product": "electrolux-lfv416k",
     "use": "nad płytą grzewczą",
     "qty": 1,
     "refs": [
      "hood"
     ]
    },
    {
     "id": "duct",
     "product": "equation-duct-150-2-7",
     "use": "okap do kanału wentylacyjnego (wyciąg)",
     "qty": 1,
     "refs": [
      "hood"
     ]
    }
   ]
  }
 ],
 "formulas": {
  "ovenMicrowaveGap": "<i:K25/microwave.fit.fasciaV0> - <i:K25/oven.fit.fasciaV1>",
  "ovenOnShelfAbove": "<a:oven.fascia.height> - <i:K25/oven.space>",
  "microwaveOnShelfBelow": "<i:K25/microwave.spaceBottom> - <i:K25/microwave.v0>",
  "microwaveOnShelfAbove": "<i:K25/microwave.v1> - <i:K25/microwave.spaceTop>",
  "microwaveCabinetGap": "<i:K25/cabinet#2.frontV0> - <i:K25/microwave.v1>",
  "fridgeFrontAboveDoor": "<i:K27/fridge.frontV1> - <i:K27/fridge.fit.bodyV0> - <a:fridgeFreezer.doors.fridge.top>",
  "innerDrawerExtra": "<p:innerDrawers> - <p:ballRunners>"
 },
 "notes": [
  {
   "name": "AGD – WYMIARY I DOPASOWANIE DO KORPUSÓW (mm; szer. × wys. × gł.)",
   "notes": [
    {
     "id": "oven",
     "appliance": "oven",
     "topic": "Piekarnik Bosch HBA534BB3 – K25, dół",
     "description": "Wymiary: obudowa {a:oven.body.width} × {a:oven.body.height} × {a:oven.body.depth}, front {a:oven.fascia.width} × {a:oven.fascia.height} × {a:oven.fascia.thickness}; oba stoją na półce.\nFront: {f:ovenOnShelfAbove} na półkę nad, po {=(<a:oven.fascia.width> - <k:K25.innerWidth>) / 2} na boki korpusu; półki pod nim nie zakrywa.\nLuz nad obudową: {=<i:K25/oven.space> - <a:oven.body.height>}.\nSzczeliny: do frontu szafki pod {=<i:K25/oven.spaceBottom> - <i:K25/cabinet#1.frontV1>}, do mikrofalówki {f:ovenMicrowaveGap}.",
     "assumed": "Kratka w cokole; półka nad piekarnikiem płytsza o {s:shelf.ventGap}."
    },
    {
     "id": "microwave",
     "appliance": "microwave",
     "topic": "Mikrofalówka Bosch BFL623MB3 – K25, nad piekarnikiem",
     "description": "Wymiary: urządzenie {a:microwave.body.width} × {a:microwave.body.height} × {a:microwave.body.depth} na nóżkach {i:K25/microwave.fit.feet}; front {a:microwave.fascia.width} × {a:microwave.fascia.height} × {a:microwave.fascia.thickness}, {=-<a:microwave.fascia.bottom>} poniżej spodu urządzenia.\nFront: {f:microwaveOnShelfBelow} na półkę pod, {f:microwaveOnShelfAbove} na półkę nad, po {=(<a:microwave.fascia.width> - <k:K25.innerWidth>) / 2} na boki korpusu.\nLuz nad urządzeniem: {=<i:K25/microwave.space> - <i:K25/microwave.fit.feet> - <a:microwave.body.height>}; tył otwarty.\nSzczeliny: do piekarnika {f:ovenMicrowaveGap}, do szafki nad {f:microwaveCabinetGap}.",
     "assumed": "Stoi na półce płytszej o {s:shelf.ventGap}."
    },
    {
     "id": "ovenColumn",
     "topic": "Słupek K25: piekarnik + mikrofalówka",
     "description": "Od półki pod piekarnikiem w górę: piekarnik {a:oven.fascia.height}, szczelina {f:ovenMicrowaveGap}, mikrofalówka {i:K25/microwave.height}, szczelina {f:microwaveCabinetGap}, szafka górna.\nPółka środkowa: {=<i:K25/oven.spaceTop> - <i:K25/oven.spaceBottom>}–{=<i:K25/microwave.spaceBottom> - <i:K25/oven.spaceBottom>}, płytsza o {s:shelf.ventGap}.\nPółka górna: {=<i:K25/microwave.spaceTop> - <i:K25/oven.spaceBottom>}–{=<i:K25/microwave.spaceTop> + <t:carcass> - <i:K25/oven.spaceBottom>}.\nSzafka pod piekarnikiem: {i:K25/cabinet#1.height}.",
     "assumed": "Półki przymierzyć przed zamocowaniem."
    },
    {
     "id": "fridge",
     "appliance": "fridgeFreezer",
     "topic": "Lodówka Bosch KIS86AFE0 – K27",
     "description": "Wymiary: {a:fridgeFreezer.body.width} × {a:fridgeFreezer.body.height} × {a:fridgeFreezer.body.depth}, na dnie korpusu.\nPółka stała: na górze urządzenia, góra lodówki przykręcona do niej; płytsza o {s:shelf.ventGap}.\nZamrażarka: front {i:K27/freezer.frontHeight} na drzwiach {=<a:fridgeFreezer.doors.freezer.top> - <a:fridgeFreezer.doors.freezer.bottom>}; wystaje {=<i:K27/freezer.fit.bodyV0> + <a:fridgeFreezer.doors.freezer.bottom> - <i:K27/freezer.frontV0>} w dół, po {=(<i:K27/freezer.frontWidth> - <a:fridgeFreezer.body.width>) / 2} na boki; drzwi sięgają {=<i:K27/freezer.fit.bodyV0> + <a:fridgeFreezer.doors.freezer.top> - <i:K27/freezer.frontV1>} wyżej.\nLodówka: front {i:K27/fridge.frontHeight} na drzwiach {=<a:fridgeFreezer.doors.fridge.top> - <a:fridgeFreezer.doors.fridge.bottom>}; wystaje {=<i:K27/fridge.fit.bodyV0> + <a:fridgeFreezer.doors.fridge.bottom> - <i:K27/fridge.frontV0>} w dół, {f:fridgeFrontAboveDoor} w górę, po {=(<i:K27/fridge.frontWidth> - <a:fridgeFreezer.body.width>) / 2} na boki.\nSzczelina między frontami: {=<i:K27/fridge.frontV0> - <i:K27/freezer.frontV1>}.",
     "assumed": "Fronty przykręcone do drzwi urządzenia."
    },
    {
     "id": "fridgeAir",
     "topic": "Lodówka – wentylacja",
     "description": "Wlot: kratka w cokole.\nWylot: szczelina {s:shelf.ventGap} za półką stałą nad urządzeniem, {g:2.backGap} za korpusem."
    },
    {
     "id": "dishwasher",
     "appliance": "dishwasher",
     "topic": "Zmywarka Bosch SMV4HVX00E – G1[6]",
     "description": "Wymiary: {a:dishwasher.body.width} × {i:G1[6]/dishwasher.fit.bodyV1} × {a:dishwasher.body.depth}, nóżki wykręcone do spodu blatu; drzwi {a:dishwasher.door.height}.\nFront {i:G1[6]/dishwasher.frontWidth} × {i:G1[6]/dishwasher.frontHeight}: {=<i:G1[6]/dishwasher.fit.doorV0> - <i:G1[6]/dishwasher.frontV0>} niżej niż drzwi, {=<i:G1[6]/dishwasher.fit.doorV1> - <i:G1[6]/dishwasher.frontV1>} pod ich górą, po {=(<a:dishwasher.body.width> - <i:G1[6]/dishwasher.frontWidth>) / 2} węższy z boków.\nNóżki: {a:dishwasher.baseSetback} za frontem, cokół przed nimi.",
     "decide": "Ciężar frontu: sprawdzić w instrukcji (zawias SMZ5003 do ciężkich frontów)."
    },
    {
     "id": "hob",
     "appliance": "hob",
     "topic": "Płyta grzewcza Electrolux CIT61443 – K11",
     "description": "Wymiary: szkło {a:hob.glass.width} × {a:hob.glass.depth}, korpus {a:hob.body.width} × {a:hob.body.depth} × {a:hob.body.height}.\nWycięcie: {s:cutouts.hob.width} × {s:cutouts.hob.depth}, {s:cutouts.hob.fromBack} od tylnej krawędzi blatu.\nSzkło na blacie: po {=(<a:hob.glass.width> - <s:cutouts.hob.width>) / 2} z boków; {=<s:cutouts.hob.fromBack> - (<a:hob.glass.depth> - <s:cutouts.hob.depth>) / 2} od tylnej, {=<w:1.depth> - <s:cutouts.hob.fromBack> - (<a:hob.glass.depth> + <s:cutouts.hob.depth>) / 2} od przedniej krawędzi blatu.\nPod płytą: trawers przedni {s:crossRails.hobFront}, tylny {s:crossRails.depth}; przegroda {m:hobPanel} za przednim trawersem, {s:crossRails.hobPanelGap} szczeliny z tyłu.",
     "assumed": "Na liście cięć.",
     "decide": "Odstęp korpusu płyty od przegrody: instrukcja, s. 22."
    },
    {
     "id": "sink",
     "appliance": "sink",
     "topic": "Zlew IKEA KILSVIKEN – K12",
     "description": "Wymiary: zlew {a:sink.body.width} × {a:sink.body.depth}, komora {a:sink.bowl.width} × {a:sink.bowl.depth} × {a:sink.bowl.height}.\nWycięcie: {s:cutouts.sink.width} × {s:cutouts.sink.depth}, {s:cutouts.sink.fromBack} od tylnej krawędzi blatu.\nZlew na blacie: rant po {=(<a:sink.body.width> - <s:cutouts.sink.width>) / 2} z boków; {=<s:cutouts.sink.fromBack> - (<a:sink.body.depth> - <s:cutouts.sink.depth>) / 2} od tylnej, {=<w:1.depth> - <s:cutouts.sink.fromBack> - (<a:sink.body.depth> + <s:cutouts.sink.depth>) / 2} od przedniej krawędzi blatu.",
     "assumed": "Wycięcie na liście cięć (BLATY).",
     "decide": "Wycięcie sprawdzić z szablonem IKEA przed CNC."
    },
    {
     "id": "pullOutShelf",
     "topic": "Szafka z ekspresem – półka wysuwana",
     "description": "Półka: gł. {s:pullOutShelf.depth}, {s:pullOutShelf.clearance} luzu z boków, prowadnice Blum MOVENTO.\nPłyta dystansowa po stronie zawiasów: od płyty pod drzwiami do {s:pullOutShelf.spacerAbove} nad półkę; niesie prowadnicę i odsuwa półkę od otwartych drzwi.",
     "decide": "Plan wierceń prowadnic pod półką (Blum)."
    }
   ]
  },
  {
   "name": "KONSTRUKCJA",
   "notes": [
    {
     "id": "wallFixing",
     "topic": "Mocowanie korpusów do ściany",
     "description": "Listwy tylne: przy listwie pionowej jedna na korpus w stosie obok, przy poziomej jedna na korpus pod nią.\nKątowniki: {n:wallBrackets}, listwę skrócić na miejscu.",
     "assumed": "Gazobeton, kołki DuoPower 8."
    },
    {
     "id": "corner",
     "topic": "Narożnik L – korpus narożny",
     "description": "Korpus K13: drzwi, panel przedni {i:K13/frontPanel.width} i ukryte wypełnienie.\nSłupek zawiasowy: {m:carcass}, gł. {s:hinges.postDepth}, niesie zawiasy.\nPanel wpuszczany: za panelem {i:K13/frontPanel.width}, od słupka do boku korpusu.\nCokoły grupy 1 i 2: lista cięć podaje obie pełne długości, jeden przyciąć na miejscu.",
     "assumed": "Złącza: jedno opakowanie.",
     "decide": "Półka w K13: słupek zawiasowy ją przecina (widok 3D zgłasza kolizję).\nListwa ścienna pod blatem w narożniku?"
    },
    {
     "id": "stripsPanels",
     "topic": "Listwy przednie na sztorc, panele przednie na płasko",
     "description": "Obrzeże przy otwieranym froncie: panel przedni {i:K13/frontPanel.width} – {i:K13/frontPanel.edges}; panel przedni {i:G2[3]/frontPanel.width} – {i:G2[3]/frontPanel.edges}; panel tylny wyspy – brak.\nPanel przedni {i:G2[3]/frontPanel.width} zakrywa koniec panelu przedniego {i:K13/frontPanel.width}."
    },
    {
     "id": "sinkCabinet",
     "topic": "Szafka zlewowa",
     "description": "Dół: szuflada D z koszami, boki {s:drawers.D.sideHeight}; potrzebny syfon oszczędzający miejsce.\nGóra: front atrapa, bez szuflady.",
     "decide": "Odpływ w ścianie ≥ 450 nad podłogą."
    },
    {
     "id": "innerDrawers",
     "topic": "Szuflady wewnętrzne na sztućce (wyspa)",
     "description": "Wyspa, górne szuflady: TANDEMBOX antaro M 500 wewnętrzna, za tym samym frontem.\nFront wewnętrzny Z31L: szerokość wnętrza korpusu − {s:drawers.inner.frontDeduction}.\nDno i tył: {m:drawerBox}, na liście cięć.",
     "decide": "Wysokość tyłu i wkład: konfigurator Blum."
    },
    {
     "id": "doorDrawers",
     "topic": "Szuflady za drzwiami z płyty (K25 i K29, dół)",
     "description": "K25: drzwi {i:K25/doorDrawers.frontWidth} × {i:K25/doorDrawers.frontHeight}, {i:K25/doorDrawers.count} szuflady {i:K25/doorDrawers.boxWidth} × {i:K25/doorDrawers.runnerLength} × {i:K25/doorDrawers.boxHeight}, zawiasy {i:K25/doorDrawers.hinge}.\nK12: drzwi {i:K29/doorDrawers.frontWidth} × {i:K29/doorDrawers.frontHeight}, {i:K29/doorDrawers.count} szuflady {i:K29/doorDrawers.boxWidth} × {i:K29/doorDrawers.runnerLength} × {i:K29/doorDrawers.boxHeight}, zawiasy {i:K29/doorDrawers.hinge}.\nSkrzynki: {m:drawerBox}, prowadnice kulkowe Häfele L = {i:K29/doorDrawers.runnerLength}, {s:doorDrawers.clearance} luzu z każdej strony.\nPłyta dystansowa po stronie zawiasów: kończy się {s:hinges.postDepth} przed przodem korpusu, tak jak skrzynki; szuflady mijają zawiasy i otwarte drzwi.\nBez półek ruchomych za tymi drzwiami.",
     "decide": "Uchwyt szuflad: wycięcie w czole albo gałka.\nBlum zamiast płyty (TANDEMBOX M, {p:innerDrawers} za kpl.): {=ROUND(<f:innerDrawerExtra>)} zł więcej za szufladę, {=ROUND(<f:innerDrawerExtra> * <n:doorDrawers>)} zł razem; boki {s:drawers.M.sideHeight} zamiast {s:doorDrawers.sideHeight}; w K29 sprawdzić minimalną szerokość ({=<k:K29.innerWidth> - <t:carcass>}).\nPłyta {m:drawerBox}: {q:drawerBoard} ark., ostatni słabo wykorzystany; skrzynki zmieszczą się w odpadach {m:carcass}."
    },
    {
     "id": "worktops",
     "topic": "Blaty",
     "description": "Grupa 1: jedna płyta, przycięta z tyłu do {w:1.depth}.\nWyspa: płyta {d:islandWorktop}, przycięta z tyłu do {w:3.depth}.\nWycięcia na zlew i płytę: CNC w hurtowni (lista cięć: BLATY).",
     "decide": "Panele końcowe: szukam jeszcze rozwiązania na dąb dwustronny (dekor jak blat, obie strony widoczne)."
    },
    {
     "id": "plaster",
     "topic": "Zabudowa GK",
     "description": "Zabudowa dłuższa niż płyta {v:plasterboard.length}: łączona na miejscu, {s:plasterboard.layers} warstwy, spoiny przesunięte.\nProfile liczone z całkowitej długości; przy docinkach może brakować jednego."
    }
   ]
  },
  {
   "name": "CENY I ZAKRES",
   "notes": [
    {
     "id": "lacquered",
     "topic": "Części lakierowane",
     "description": "Fronty, listwy przednie, panele i cokół od jednego producenta, jeden kolor; cokół wilgocioodporny.",
     "decide": "Pisemna oferta na wszystkie części lakierowane, obustronnie."
    },
    {
     "id": "carcassBoard",
     "topic": "{m:carcass} – {q:carcassBoard} ark.",
     "description": "{carcass.m2} m² + {waste|%} odpadu na arkuszach {sheet} m² → {q:carcassBoard} ark."
    },
    {
     "id": "sinkTap",
     "topic": "Zlew i bateria",
     "description": "Syfon LILLVIKEN jest w zestawie zlewu; Deante ZXY 9917 zostawia miejsce na szufladę z koszami (patrz {note:sinkCabinet}).",
     "assumed": "Czarny; syfon IKEA nieużywany.",
     "decide": "Czy syfon IKEA mieści się nad szufladą z koszami? Jeśli tak, bez syfonu Deante."
    },
    {
     "id": "hood",
     "appliance": "hood",
     "topic": "Okap Electrolux LFV416K – tryb pracy",
     "description": "Wyciąg: okap + rura Ø150 do kanału wentylacyjnego.",
     "decide": "Wyciąg czy pochłaniacz (filtr węglowy, poza kosztorysem)?"
    }
   ]
  },
  {
   "name": "DO WIADOMOŚCI",
   "notes": [
    {
     "id": "islandOverhang",
     "topic": "Nawis blatu wyspy od strony hokerów",
     "description": "Blat wystaje {g:3.backGap} za korpusy (z panelem tylnym), blat wyspy {w:3.depth}. Patrz widok 3D: dobry dla hokerów, ciasny dla krzeseł."
    },
    {
     "id": "islandSocket",
     "topic": "Gniazdko w wyspie",
     "description": "Nie ma w projekcie; zaplanować przed podłogą."
    },
    {
     "id": "hiddenSides",
     "topic": "Niewidoczne boki korpusów",
     "description": "Zakryte listwami przednimi, panelami końcowymi lub ścianą: bez lakierowanych osłon."
    },
    {
     "id": "summary",
     "topic": "Podsumowanie",
     "description": "Korpusy {n:carcasses}, fronty {n:fronts}, uchwyty {n:handles}.\nZawiasy {n:hinges}, nóżki {n:legs}.\nSzuflady: {n:drawersD} D + {n:drawersM} M + {n:innerDrawers} wewnętrzne.\nPółki: {n:shelvesAdjustable} ruchome + {n:shelvesFixed} stałe."
    }
   ]
  }
 ]
};
