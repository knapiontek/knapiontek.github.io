/* Kitchen project cost data - read by cost-sheets.js (Info of view.html). Written for each project (LLM). Plain JSON after "window.KITCHEN_COST =".
   Everything measured comes from design.js through engine.js, the appliance sizes from ../library/products.js: nothing here repeats
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
                 furniture. An item: id, name (short), spec (the product), use (where it goes), qty (a number or a formula), unit,
                 price, refs (ids of the notes it links to), source (price remarks only), links [{name, url}]: the maker's
                 page or manual first, then the shop of the price
     notes       Notes tab, by section {name, notes}; a note: id, appliance (its documents come from the library), topic,
                 description, assumed (in the estimate), decide (open question), links [{name, url}]; \n starts a new line.
                 Notes and sections are numbered in this order.
     formulas    named calculations used in several texts ({f:name}), written like {=...} without the braces
   Texts and formulas may hold placeholders:
     {n:hinges}        engine count ({n:type.oven}, {n:tag.bins} = items with that type / tag, 0 when none)
     {s:drawers.D.frontAbove} design.js setting     {t:carcass} thickness, {d:worktop} depth (as bought) and {m:cabinet} material label of a board type or part
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
  "info": "PLN brutto, ceny sklepów internetowych z października 2026 (każda pozycja ma link do sklepu), tylko materiały (montaż własny). Niebieskie pola można zmieniać, by sprawdzić inne ceny do odświeżenia strony; stałe ceny wpisuje się w dane kosztorysu na tej stronie. Ilości z formułą pochodzą z design.js.",
  "xlsxFile": "kosztorys_kuchnia_jaworze.xlsx",
  "excluded": ["Robocizna, transport, elektryka (płyta 400 V, obwody piekarnika, zmywarki, lodówki), hydraulika, prace GK (materiały GK są w kosztorysie)."]
 },
 "params": {"waste": 0.15, "sheet": "={v:sheet.length}*{v:sheet.width}/1000000", "reserve": 0.05},
 "values": {
  "sheet": {"length": 2800, "width": 2070},
  "worktopBoard": {"length": 4100},
  "plasterboard": {"length": 2600, "width": 1200},
  "edgeAllowance": 0.1,
  "confirmatsPerCarcass": 18,
  "screwsPerMetre": 4,
  "backScrewsPerM2": 30,
  "bracketsPerDummy": 4
 },
 "labels": {
  "fronts": [
   {"type": "drawer", "tags": ["dummy"], "function": "front atrapa"},
   {"type": "drawer", "tags": ["bins"], "function": "szuflada zlewowa (kosze)"},
   {"type": "drawer", "function": "szuflada"},
   {"type": "cabinet", "tags": ["fridge", "freezer", "dishwasher"], "function": "front na drzwiach AGD"},
   {"type": "cabinet", "tags": ["doorDrawers"], "function": "drzwi, za nimi szuflady"},
   {"type": "cabinet", "function": "drzwi"}
  ],
  "sheet": "Arkusz płyty {v:sheet.length}×{v:sheet.width} [m²]",
  "cuttingNote": "Wymiary: długość × szerokość, dłuższy bok pierwszy; fronty szerokość × wysokość.\nKrawędź: liczba wykończonych krawędzi wzdłuż wymiaru obok (0, 1, 2), jak w formularzu hurtowni.\nSumy: obrzeże razem = długość obrzeża × ilość; cięcia = (długość + szerokość) × ilość.\nKorpus: gł. {s:carcass.depth}, od ściany {g:1.backGap} (grupa 1), {g:2.backGap} (grupa 2); front {s:carcass.frontGap} przed korpusem; wnętrze = szerokość − 2 × {t:carcass}.\nPółki: ruchoma = wnętrze − 2 × {s:shelf.clearance}, gł. − {s:shelf.setback}; stała = pełna głębokość (nad piekarnikiem i lodówką − {s:shelf.ventGap}).\nPlecy = korpus − 2 × {s:backPanel.inset}; front = moduł − 4 szczeliny; listwa tylna = {s:strip.depth} × długość korpusu obok (listwa pionowa; skrócić na miejscu pod kątownik) lub pod nią (listwa pozioma).\nSzuflady: dno = wnętrze − {s:drawers.bottom.inset} × {s:drawers.bottom.depth}; tył = wnętrze − {s:drawers.back.inset}.\nObrzeże: tylko krawędzie widoczne (fronty: wszystkie, listwy przednie: przednia, panele przednie: przy otwieranym froncie); strona każdej krawędzi w zakładce Montaż.\nPłyty lakierowane: lakier na obu stronach.\nBlaty: krawędź przednia fabryczna, wycięcia bez obrzeża.",
  "legend": {"runner": "pozycje do potwierdzenia wg Blum i Häfele"}
 },
 "blocks": [
  {"id": "fronts", "code": "FR", "title": "FRONTY – {m:cabinet}, shaker, lakierowane dookoła", "columns": ["Funkcja", "Szerokość", "Wysokość", "Ilość"]},
  {"id": "strips", "code": "LI", "title": "LISTWY PRZEDNIE – {m:strip} na sztorc, gł. {s:strip.depth}, lakierowane obustronnie i krawędź przednia"},
  {"id": "plinths", "code": "CO", "title": "COKÓŁ – {m:plinth}, wilgocioodporny, lakierowany obustronnie"},
  {"id": "frontPanels", "code": "PA", "title": "PANELE PRZEDNIE I PANEL TYLNY WYSPY – {m:frontPanel} na płasko, lakierowane obustronnie i krawędzie przy otwieranych frontach"},
  {"id": "wallPanels", "code": "PS", "title": "PANEL ŚCIENNY – {m:wallPanel}, na ścianie nad blatem"},
  {"id": "carcass", "code": "KO", "title": "KORPUSY – wszystkie części z {m:carcass}: cięcie + obrzeże 0,8 na krawędziach widocznych (z listwami tylnymi, półką wysuwaną, słupkami zawiasowymi, panelami wpuszczanymi, płytami dystansowymi)", "cut": true},
  {"id": "drawerBox", "code": "SZ", "title": "SZUFLADY – wszystkie części z {m:drawerBox}: dna i tyły TANDEMBOX (z szufladami wewnętrznymi), szuflady za drzwiami i przegroda pod płytą", "cut": true},
  {"id": "backPanel", "code": "PL", "title": "PLECY – {m:backPanel}, tylko za drzwiami szafek"},
  {"id": "worktops", "code": "BL", "title": "BLATY – {m:worktop} (blat), {m:islandWorktop} (wyspa); wycięcia na zlew (WZ) i płytę (WP) wg legendy"},
  {"id": "endPanels", "code": "PK", "title": "PANELE KOŃCOWE – {m:endPanel} ({d:endPanel} grupa 1, {d:islandEndPanel} wyspa); blat wystaje {s:worktop.endPanelOverhang} mm poza panel końcowy (bok, przód, w wyspie tył)"},
  {"id": "plaster", "code": "GK", "title": "ZABUDOWA GK – GKBI 12,5 na CD60 / UD27, gł. {s:plasterboard.depth} (zabudowa do sufitu, grupa 2)"}
 ],
 "categories": [
  {
   "name": "Fronty, listwy przednie i cokół",
   "items": [
    {
     "id": "fronts",
     "name": "Fronty shaker",
     "spec": "{m:cabinet}, MDF, lakierowane dookoła",
     "use": "drzwi i szuflady (lista cięć: FRONTY)",
     "qty": "={fronts.m2}",
     "unit": "m²",
     "price": 720,
     "refs": ["lacquered"],
     "source": "NIESPRAWDZONE – kwota właściciela; online: ogony.pl 990 + 400 (2. strona), fronty.com.pl 820, zakupynawymiar.pl 796, gama-sklep 699, frontlakierowany.pl 630 netto + 70 % (2. strona), lakierowane.pl 370 netto",
     "links": [
      {"name": "ogony.pl", "url": "https://ogony.pl/products/shaker-front-ikea"},
      {"name": "fronty.com.pl", "url": "https://fronty.com.pl/pl/p/Art.-301-Front-lakierowany/76"},
      {"name": "zakupynawymiar.pl", "url": "https://zakupynawymiar.pl/pl/p/front-F2-lakierowany-na-wymiar-/2967"},
      {"name": "gama-sklep.com.pl", "url": "https://www.gama-sklep.com.pl/item/front-kuchenny-mdf-lakierowany-profil-b-269976"},
      {"name": "frontlakierowany.pl", "url": "https://frontlakierowany.pl/#cennik"},
      {"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}
     ]
    },
    {
     "id": "strips",
     "name": "Listwy przednie",
     "spec": "{m:strip}, lakierowane obustronnie i krawędź przednia",
     "use": "między frontami, na sztorc, gł. {s:strip.depth} (lista cięć: LISTWY)",
     "qty": "={strips.m2}",
     "unit": "m²",
     "price": 332.1,
     "refs": ["stripsPanels", "lacquered"],
     "source": "lakierowane.pl: 270 netto/m², jedna strona; druga strona: zapytać",
     "links": [{"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
    },
    {
     "id": "plinths",
     "name": "Cokół",
     "spec": "{m:plinth}, MDF wilgocioodporny, lakierowany obustronnie",
     "use": "pod korpusami, na klipsach nóżek (lista cięć: COKÓŁ)",
     "qty": "={plinths.m2}",
     "unit": "m²",
     "price": 332.1,
     "refs": ["lacquered", "corner"],
     "source": "lakierowane.pl: 270 netto/m², jedna strona; druga strona: zapytać",
     "links": [{"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
    },
    {
     "id": "frontPanels",
     "name": "Panele przednie",
     "spec": "{m:frontPanel}, lakierowane obustronnie i krawędzie przy otwieranych frontach",
     "use": "na płasko w płaszczyźnie frontów; panel tylny wyspy (lista cięć: PANELE)",
     "qty": "={frontPanels.m2}",
     "unit": "m²",
     "price": 332.1,
     "refs": ["lacquered", "hiddenSides"],
     "source": "lakierowane.pl: 270 netto/m², jedna strona; druga strona: zapytać",
     "links": [{"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
    }
   ]
  },
  {
   "name": "Korpusy",
   "items": [
    {
     "id": "carcassBoard",
     "name": "Płyta korpusów",
     "spec": "{m:carcass}, arkusz {v:sheet.length} × {v:sheet.width}",
     "use": "boki, wieńce, trawersy, półki, listwy tylne, słupki zawiasowe, płyty dystansowe; + {waste|%} odpadu",
     "qty": "=ROUNDUP({carcass.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 268.18,
     "refs": ["carcassBoard"],
     "source": "M-HM Bielsko-Biała",
     "links": [
      {"name": "Egger: dekor U708 ST9", "url": "https://www.egger.com/en/furniture-interior-design/decors/U708_9?country=GB"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-U708-ST9-2800x2070x18MM-Szary-jasny/2219"}
     ]
    },
    {
     "id": "drawerBoard",
     "name": "Płyta szuflad",
     "spec": "{m:drawerBox}, arkusz {v:sheet.length} × {v:sheet.width}",
     "use": "dna i tyły szuflad TANDEMBOX, szuflady za drzwiami, przegroda pod płytą grzewczą",
     "qty": "=ROUNDUP({drawerBox.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 344.4,
     "source": "M-HM Bielsko-Biała",
     "links": [
      {"name": "Egger: dekor U708 ST9", "url": "https://www.egger.com/en/furniture-interior-design/decors/U708_9?country=GB"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-U708-ST9-2800x2070x16MM-Szary-jasny/2190"}
     ]
    },
    {
     "id": "backBoard",
     "name": "Plecy HDF",
     "spec": "{m:backPanel}, arkusz {v:sheet.length} × {v:sheet.width}",
     "use": "plecy za drzwiami szafek",
     "qty": "=ROUNDUP({backPanel.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 124.32,
     "source": "M-HM Bielsko-Biała",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/HDF-SZARY-LAKIEROWANY-2800x2070x3.0MM/2804"}]
    },
    {
     "id": "cutting",
     "name": "Cięcie płyt",
     "spec": "usługa hurtowni, mb cięć",
     "use": "płyty korpusów i szuflad, wg listy cięć",
     "qty": "={carcass.cut}+{drawerBox.cut}",
     "unit": "mb",
     "price": 5,
     "source": "M-HM: cena do potwierdzenia; szacunek wg ciecieoklejanie.pl (płyty 3–20 mm)",
     "links": [
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/i/Uslugi/16"},
      {"name": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"}
     ]
    },
    {
     "id": "carcassEdging",
     "name": "Oklejanie korpusów",
     "spec": "obrzeże 0,8 w dekorze U708 ST9, klejone PUR albo laserowo (bez widocznej spoiny), z usługą oklejania",
     "use": "widoczne krawędzie korpusów i szuflad za drzwiami, wg listy cięć + {v:edgeAllowance|%}",
     "qty": "=({carcass.edge}+{drawerBox.edge})*(1+{v:edgeAllowance})",
     "unit": "mb",
     "price": 6,
     "source": "M-HM: cena do potwierdzenia; szacunek wg ciecieoklejanie.pl 6/mb z obrzeżem (samo obrzeże w M-HM 1,77/mb)",
     "links": [
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/i/Uslugi/16"},
      {"name": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"},
      {"name": "m-hm.pl: obrzeże (cena orientacyjna)", "url": "https://m-hm.pl/pl/p/OBRZEZE-ABS-U708-ST9-230.8MM-Szary-jasny/1146"}
     ]
    }
   ]
  },
  {
   "name": "Okucia",
   "items": [
    {
     "id": "hinges",
     "name": "Zawias Blum z prowadnikiem",
     "spec": "CLIP top BLUMOTION 110° 71B3550, nakładany, puszka Ø{s:drilling.cup.diameter}; prowadnik 173H7100, 0 mm, mimośród ±2",
     "use": "drzwi; liczba wg wysokości frontu",
     "qty": "={n:hinges}",
     "unit": "szt.",
     "price": 16.73,
     "source": "zawias 14,25 + prowadnik 2,48 (meblownia: 11,53 + 2,00)",
     "links": [
      {"name": "Blum: CLIP top BLUMOTION – instrukcje montażu", "url": "https://www.blum.com/pl/pl/products/hingesystems/clip-top-blumotion/downloads-videos/"},
      {"name": "m-hm.pl: zawias", "url": "https://m-hm.pl/pl/p/CLIP-top-BLUMOTION-Zawias-110%2C-Drzwi-nakladane%2C-puszka-na-wkrety-71B3550/2253"},
      {"name": "m-hm.pl: prowadnik", "url": "https://m-hm.pl/pl/p/CLIP-prowadnik%2C-krzyzakowy%2C-00-mm%2C-Stal%2C-Wkrety%2C-RW-mimosrod-173H7100/1376"}
     ]
    },
    {
     "id": "bumpers",
     "name": "Odbojnik Blum",
     "spec": "SERVO-DRIVE 993.0530, wciskany, otwór Ø{s:drilling.bumper.diameter}, gł. {s:drilling.bumper.depth}; trzyma szczelinę {s:carcass.frontGap}",
     "use": "przednia krawędź boku korpusu, naprzeciw każdego zawiasu, na jego wysokości",
     "qty": "={n:bumpers}",
     "unit": "szt.",
     "price": 2,
     "source": "szacunek – brak ceny w polskim sklepie; Blum podaje go do frontu, sprawdzić odbojnik do krawędzi korpusu",
     "links": [
      {"name": "Blum: katalog, odbojnik dystansowy (EN)", "url": "https://publications.blum.com/2022/catalogue/en/520/"},
      {"name": "galaxus.at", "url": "https://www.galaxus.at/en/s4/product/blum-9930530-servo-drive-distanzpuffer-drawer-runners-64606856"}
     ]
    },
    {
     "id": "pullOutShelfRunners",
     "name": "Prowadnice półki wysuwanej Blum",
     "spec": "MOVENTO BLUMOTION S 760H5000S, 500 mm, 40 kg, pełny wysuw; sprzęgła T51.7601 L + P",
     "use": "półka wysuwana w szafce z ekspresem",
     "qty": "={n:pullOutShelves}",
     "unit": "kpl.",
     "price": 151.28,
     "refs": ["pullOutShelf"],
     "source": "prowadnice 136,36 + sprzęgła 2 × 7,46 (meblownia: 121,84)",
     "links": [
      {"name": "Blum: MOVENTO – instrukcje montażu", "url": "https://www.blum.com/pl/pl/products/runnersystems/movento/downloads-videos/"},
      {"name": "m-hm.pl: prowadnice", "url": "https://m-hm.pl/pl/p/MOVENTO-z-BLUMOTION-S%2C-40-kg%2C-L500-mm%2C-lewaprawa-760H5000S/2312"},
      {"name": "m-hm.pl: sprzęgło L", "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Lewe-z-regulacja-boczna-T51.7601-LEWE/3109"},
      {"name": "m-hm.pl: sprzęgło P", "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Prawe-z-regulacja-boczna-T51.7601-PRAWE/3110"}
     ]
    },
    {
     "id": "drawersD",
     "name": "Szuflada Blum TANDEMBOX D",
     "spec": "antaro D 500, szara, 30 kg, z relingiem; bez dna, tyłu i frontu",
     "use": "szuflady z frontem > {s:drawers.D.frontAbove}",
     "qty": "={n:drawersD}",
     "unit": "kpl.",
     "price": 169.05,
     "refs": ["sinkCabinet"],
     "source": "",
     "links": [
      {"name": "Blum: TANDEMBOX antaro – montaż", "url": "https://www.blum.com/pl/pl/products/boxsystems/tandembox-antaro/assembly/"},
      {"name": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-d-z-relingiem-szara-30-kg.html"}
     ]
    },
    {
     "id": "drawersM",
     "name": "Szuflada Blum TANDEMBOX M",
     "spec": "antaro M 500, szara, 30 kg: boki 378M5002SA, prowadnice 578.5001M, wsporniki",
     "use": "szuflady z frontem ≤ {s:drawers.D.frontAbove}",
     "qty": "={n:drawersM}",
     "unit": "kpl.",
     "price": 136.39,
     "source": "",
     "links": [
      {"name": "Blum: TANDEMBOX antaro – montaż", "url": "https://www.blum.com/pl/pl/products/boxsystems/tandembox-antaro/assembly/"},
      {"name": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-m-szara-30-kg.html"}
     ]
    },
    {
     "id": "innerDrawers",
     "name": "Szuflada wewnętrzna Blum TANDEMBOX M",
     "spec": "antaro M 500, szara, 30 kg: boki 378M5002SA, prowadnice 578.5001M; front wewnętrzny Z31L1036A, przycięty do szer. wnętrza − {s:drawers.inner.frontDeduction}",
     "use": "na sztućce, za górnym frontem szuflad wyspy",
     "qty": "={n:innerDrawers}",
     "unit": "kpl.",
     "price": 207.81,
     "refs": ["innerDrawers"],
     "source": "",
     "links": [
      {"name": "Blum: TANDEMBOX antaro – montaż", "url": "https://www.blum.com/pl/pl/products/boxsystems/tandembox-antaro/assembly/"},
      {"name": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-wewnetrzna-tandembox-antaro-500-m-biala-30-kg-19272.html"}
     ]
    },
    {
     "id": "ballRunners",
     "name": "Prowadnice kulkowe Häfele",
     "spec": "494.02.184, H45, pełny wysuw, cichy domyk, 30 kg, L = {i:K29/doorDrawers.runnerLength}, komplet L + P",
     "use": "szuflady za drzwiami, luz {s:doorDrawers.clearance} na stronę",
     "qty": "={n:doorDrawers}",
     "unit": "kpl.",
     "price": 29.52,
     "refs": ["doorDrawers"],
     "source": "M-HM Bielsko-Biała; tańsze niż Blum ({p:innerDrawers} za szufladę) – patrz notatka",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PROW.KULKOWA-Z-HAMUL.PW450-30KG45MM-494.02.184/1986"}]
    },
    {
     "id": "cutleryTrays",
     "name": "Wkład na sztućce Hettich",
     "spec": "OrgaTray 440 9195001, antracyt, gł. 441–520, szer. 701–800, wys. 55",
     "use": "szuflady wewnętrzne wyspy (korpus {k:K31.width}, prowadnice 500)",
     "qty": "={n:innerDrawers}",
     "unit": "szt.",
     "price": 128.56,
     "refs": ["innerDrawers"],
     "source": "na zamówienie 3–10 dni rob.; zamiast Blum ORGA-LINE ZSI.80VEI6 (495,25)",
     "links": [{"name": "akcesoriameble24.pl", "url": "https://akcesoriameble24.pl/product/wklad-orgatray-440-hettich-do-szuflady/"}]
    },
    {
     "id": "bins",
     "name": "Kosze na odpady Amix",
     "spec": "RUBIO-80/3x15L, 3 × 15 l",
     "use": "szuflada zlewowa D (NL 500)",
     "qty": "={n:tag.bins}",
     "unit": "kpl.",
     "price": 129.25,
     "refs": ["sinkCabinet"],
     "source": "",
     "links": [{"name": "amix.pl", "url": "https://amix.pl/pl/segregatory-rubio/2000-rubio-80-3x15"}]
    },
    {
     "id": "handles",
     "name": "Uchwyt IKEA ENERYDA",
     "spec": "muszelka, kolor mosiądzu, 89 mm, rozstaw 64, art. 706.108.37, opak. 2 szt.",
     "use": "1 na front",
     "qty": "=ROUNDUP({n:handles}/2,0)",
     "unit": "op.",
     "price": 20,
     "source": "",
     "links": [{"name": "ikea.com/pl", "url": "https://www.ikea.com/pl/pl/p/eneryda-uchwyt-kolor-mosiadzu-70610837/"}]
    },
    {
     "id": "legs",
     "name": "Nóżki Häfele AXILO",
     "spec": "H 150 (140–170), 637.76.355, regulacja kluczem od przodu",
     "use": "{s:carcass.legs} na korpus na cokole, cofnięte za cokół",
     "qty": "={n:legs}",
     "unit": "szt.",
     "price": 3.23,
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/AXILO-Nozka-meblowa-H-150-mm-140-170mm-637.76.355/2210"}]
    },
    {
     "id": "plinthClips",
     "name": "Klips cokołu Häfele",
     "spec": "przykręcany do nóżki, 637.38.054",
     "use": "przednie nóżki",
     "qty": "={n:legs}/2",
     "unit": "szt.",
     "price": 1.1,
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/AXILO%2CHE-Zatrzask-Klips-do-cokolu-do-przykrecania-do-nozki-637.38.054/2195"}]
    },
    {
     "id": "shelfPins",
     "name": "Podpórki półek",
     "spec": "Ø5, ocynk, z tuleją plastikową, opak. 100 szt.",
     "use": "{=<n:shelfPins> / <n:shelvesAdjustable>} na półkę ruchomą",
     "qty": "=ROUNDUP({n:shelfPins}/100,0)",
     "unit": "op.",
     "price": 8.4,
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Podporka-polki-ocynk-fi5-z-tuleja-plastikowa-opak100-szt./4482"}]
    },
    {
     "id": "confirmats",
     "name": "Konfirmaty",
     "spec": "6,4 × 50, ocynk biały, opak. 1000 szt.; wiertło do konfirmatów 6,4",
     "use": "skręcanie korpusów, ok. {v:confirmatsPerCarcass} na korpus ({n:carcasses} korpusów)",
     "qty": "=ROUNDUP({n:carcasses}*{v:confirmatsPerCarcass}/1000,0)",
     "unit": "op.",
     "price": 119.39,
     "source": "M-HM tylko po 1000 szt.; meblownia 7 × 50: 12,57 za 100",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Konfirmat-M-6.4-x-50-OC.BIALY-opak1000-szt./4511"}]
    },
    {
     "id": "connectors",
     "name": "Złącza skręcane",
     "spec": "Ø5 M4, nikiel, opak. 100 szt.",
     "use": "skręcanie korpusów, narożnik L",
     "qty": 1,
     "unit": "op.",
     "price": 29.52,
     "refs": ["corner"],
     "source": "",
     "links": [{"name": "g-s.com.pl", "url": "https://g-s.com.pl/zlacze-skrecane-meblowe-fi-5-m4-nikiel.html"}]
    },
    {
     "id": "wallBrackets",
     "name": "Kątownik meblowy Domax",
     "spec": "wąski, 40 × 40 × 17",
     "use": "listwa tylna do ściany, na styku listew w stosie; najwyższa bez kątownika",
     "qty": "={n:wallBrackets}",
     "unit": "szt.",
     "price": 3.79,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/katownik-meblowy-waski-40-x-40-x-17-mm-domax-42855092.html"}]
    },
    {
     "id": "wallAnchors",
     "name": "Kołki fischer DuoPower",
     "spec": "8 × 65 z wkrętem, opak. 20 + 5 szt.",
     "use": "kątowniki do ściany (gazobeton), 1 na kątownik",
     "qty": "=ROUNDUP({n:wallBrackets}/25,0)",
     "unit": "op.",
     "price": 30.99,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/kolki-montazowe-8x65-mm-z-wkretem-duopower-20-sztuk-5-gratis-94769354.html"}]
    },
    {
     "id": "smallScrews",
     "name": "Wkręty 4 × 16",
     "spec": "Standers, łeb wpuszczany, opak. 35 szt.",
     "use": "kątownik do listwy tylnej (2 na kątownik), plecy HDF (ok. {v:backScrewsPerM2} na m²); nie przebija płyty 18",
     "qty": "=ROUNDUP(({n:wallBrackets}*2+{backPanel.m2}*{v:backScrewsPerM2})/35,0)",
     "unit": "op.",
     "price": 4.19,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/wkret-4-x-16-mm-35-szt-standers-82231803.html"}]
    },
    {
     "id": "jointScrews",
     "name": "Wkręty 4 × 30",
     "spec": "Standers, łeb wpuszczany, opak. 25 szt.",
     "use": "listwy przednie i tylne do pierwszego korpusu, {v:screwsPerMetre} na mb",
     "qty": "=ROUNDUP({n:jointLength.screwed}/1000*{v:screwsPerMetre}*2/25,0)",
     "unit": "op.",
     "price": 3.79,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/wkret-4-x-30-mm-25-szt-standers-82231806.html"}]
    },
    {
     "id": "brassScrews",
     "name": "Wkręty mosiądzowane 4 × 30",
     "spec": "PZ, łeb stożkowy",
     "use": "drugi korpus do listew, od środka korpusu (widoczne), {v:screwsPerMetre} na mb",
     "qty": "=ROUNDUP({n:jointLength.fromInside}/1000*{v:screwsPerMetre}*2,0)",
     "unit": "szt.",
     "price": 0.4,
     "refs": ["wallFixing"],
     "source": "szacunek wg agas.pl (4 × 50: 40 zł / 100 szt.); 4 × 30 do znalezienia",
     "links": [{"name": "agas.pl", "url": "https://agas.pl/wkrety-i-gwozdzie/10724-wkrety-mosiadzowane-4x50-pz-leb-stozkowy-panelvit-100szt-8014174019531.html"}]
    },
    {
     "id": "brackets",
     "name": "Kątowniki 20 × 20 × 16",
     "spec": "stal 1,5 mm, opak. 10 szt.",
     "use": "fronty atrap, {v:bracketsPerDummy} na front",
     "qty": "=ROUNDUP({n:tag.dummy}*{v:bracketsPerDummy}/10,0)",
     "unit": "op.",
     "price": 6,
     "source": "sprzedawca Lun Fix",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/katownik-meblowy-20x20x16x1-5-10szt-74065876.html"}]
    },
    {
     "id": "grilles",
     "name": "Kratka cokołowa GTV",
     "spec": "480 × 60, aluminium srebrne",
     "use": "cokół pod lodówką i piekarnikiem (Bosch: 200 cm² wlotu)",
     "qty": "={n:grilles}",
     "unit": "szt.",
     "price": 33.99,
     "refs": ["oven", "fridgeAir"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/kratka-wentylacyjna-do-mebli-480-x-60-mm-aluminiowa-srebrna-gtv-42083426.html"}]
    }
   ]
  },
  {
   "name": "Blaty i panel ścienny",
   "items": [
    {
     "id": "worktop",
     "name": "Blat grupy 1",
     "spec": "{m:worktop}, {d:worktop} × {v:worktopBoard.length} × {t:worktop}, krawędź przednia fabryczna",
     "use": "grupa 1, przycięty z tyłu do {w:1.depth}",
     "qty": 1,
     "unit": "szt.",
     "price": 1201.01,
     "refs": ["worktops"],
     "source": "M-HM Bielsko-Biała; cięcie i oklejanie – zapytać (tel. 720 890 335)",
     "links": [
      {"name": "Egger: dekor H1180 ST37", "url": "https://www.egger.com/en/furniture-interior-design/decors/H1180_37?country=CA"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x650x38MM-Dab-Halifax-naturalny/1313"}
     ]
    },
    {
     "id": "islandWorktop",
     "name": "Blat wyspy",
     "spec": "{m:islandWorktop}, {d:islandWorktop} × {v:worktopBoard.length} × {t:islandWorktop}, krawędź przednia fabryczna",
     "use": "wyspa, przycięty z tyłu do {w:3.depth}; krawędź tylna z obrzeżem",
     "qty": 1,
     "unit": "szt.",
     "price": 2056.93,
     "refs": ["worktops"],
     "source": "M-HM Bielsko-Biała; cięcie i oklejanie – zapytać (tel. 720 890 335)",
     "links": [
      {"name": "Egger: dekor H1180 ST37", "url": "https://www.egger.com/en/furniture-interior-design/decors/H1180_37?country=CA"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x920x38MM-Dab-Halifax-naturalny/1259"}
     ]
    },
    {
     "id": "endPanelBoard",
     "name": "Panele końcowe",
     "spec": "{m:endPanel}, dwustronne, gł. {d:endPanel} i {d:islandEndPanel}",
     "use": "pod końcami blatów; blat wystaje {s:worktop.endPanelOverhang} (lista cięć: PANELE KOŃCOWE)",
     "qty": "={endPanels.m2}",
     "unit": "m²",
     "price": 451,
     "refs": ["worktops"],
     "source": "NIESPRAWDZONE – szacunek: cena m² blatu w M-HM",
     "links": [{"name": "Egger: dekor H1180 ST37", "url": "https://www.egger.com/en/furniture-interior-design/decors/H1180_37?country=CA"}]
    },
    {
     "id": "worktopEdging",
     "name": "Obrzeże blatu",
     "spec": "1,5 mm w dekorze H1180 ST37 dąb Halifax naturalny, klejone PUR albo laserowo (bez widocznej spoiny)",
     "use": "boki blatu nad panelami końcowymi, tył blatu wyspy, przody paneli końcowych (w wyspie też tyły)",
     "qty": "=({worktops.edge}+{endPanels.edge})*(1+{v:edgeAllowance})",
     "unit": "mb",
     "price": 10.1,
     "refs": ["worktops"],
     "source": "oklejanie maszynowe – zapytać M-HM; obrzeże paneli końcowych dobrać do ich materiału",
     "links": [{"name": "m-hm.pl: obrzeże (cena orientacyjna)", "url": "https://m-hm.pl/pl/p/OBRZEZE-ABS-H1180-ST37-431.5MM-Dab-Halifax-naturalny/1401"}]
    },
    {
     "id": "wallPanel",
     "name": "Panel ścienny",
     "spec": "{m:wallPanel}, arkusz {v:sheet.length} × {v:sheet.width} × {t:wallPanel}",
     "use": "ściana nad blatem (lista cięć: PANEL ŚCIENNY)",
     "qty": "=ROUNDUP({wallPanels.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 667.18,
     "source": "M-HM Bielsko-Biała",
     "links": [
      {"name": "Egger: dekor H1180 ST37", "url": "https://www.egger.com/en/furniture-interior-design/decors/H1180_37?country=CA"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-H1180-ST37-2800x2070x18.6MM-Dab-Halifax-naturalny/135"}
     ]
    },
    {
     "id": "worktopJoints",
     "name": "Złącza blatu",
     "spec": "ZŁM-26, L 100",
     "use": "blat z panelem końcowym, 2 na panel",
     "qty": "={n:type.endPanel}*2",
     "unit": "szt.",
     "price": 3.3,
     "refs": ["worktops"],
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/ZLACZE-DO-BLATOW-ZLM-26-L-100MM/500"}]
    },
    {
     "id": "silicone",
     "name": "Silikon sanitarny",
     "spec": "biały, 300 ml",
     "use": "blat do ściany, zlew",
     "qty": 2,
     "unit": "szt.",
     "price": 25,
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Silikon-SANITARNY-BIALY-300ML/3100"}]
    }
   ]
  },
  {
   "name": "Zabudowa GK (grupa 2)",
   "items": [
    {
     "id": "plasterboard",
     "name": "Płyta GK impregnowana",
     "spec": "Norgips GKBI H2 12,5, {v:plasterboard.width} × {v:plasterboard.length}",
     "use": "czoło i bok zabudów GK, {s:plasterboard.layers} warstwy; + {waste|%} odpadu",
     "qty": "=ROUNDUP({plaster.m2}*{s:plasterboard.layers}*(1+{waste})/({v:plasterboard.width}*{v:plasterboard.length}/1000000),0)",
     "unit": "szt.",
     "price": 46.99,
     "refs": ["plaster"],
     "source": "",
     "links": [{"name": "castorama.pl", "url": "https://www.castorama.pl/plyta-gipsowo-kartonowa-impregnowana-1200-x-2600-x-12-5-mm-gkbi-typ-h2-norgips/5907651691616_CAPL.prd"}]
    },
    {
     "id": "profileCD",
     "name": "Profil CD60",
     "spec": "Budmat, 0,5 mm, 3 m",
     "use": "krawędź zewnętrzna i poprzeczki co {s:plasterboard.studSpacing}",
     "qty": "=ROUNDUP({n:plasterCD}/3000,0)",
     "unit": "szt.",
     "price": 9.98,
     "refs": ["plaster"],
     "source": "",
     "links": [{"name": "castorama.pl", "url": "https://www.castorama.pl/profil-sufitowy-budmat-cd60-0-5-mm-3-m/5907595734011_CAPL.prd"}]
    },
    {
     "id": "profileUD",
     "name": "Profil UD27",
     "spec": "Budmat, 3 m",
     "use": "przy ścianie i suficie",
     "qty": "=ROUNDUP({n:plasterUD}/3000,0)",
     "unit": "szt.",
     "price": 5.98,
     "refs": ["plaster"],
     "source": "",
     "links": [{"name": "castorama.pl", "url": "https://www.castorama.pl/profil-budmat-ud27-3-m/5907738940163_CAPL.prd"}]
    },
    {
     "id": "jointFiller",
     "name": "Masa szpachlowa",
     "spec": "Knauf Uniflott, 5 kg",
     "use": "spoiny i narożniki GK",
     "qty": 1,
     "unit": "szt.",
     "price": 31.29,
     "source": "",
     "links": [
      {"name": "Knauf: Uniflott, karta techniczna", "url": "https://knauf.com/pl-PL/p/produkt/knauf-uniflott-10132_0120"},
      {"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/masa-szpachlowa-uniflott-5-kg-knauf-43360653.html"}
     ]
    },
    {
     "id": "plasterScrews",
     "name": "Wkręty do GK",
     "spec": "4PRO 3,5 × 35, do metalu, 1000 szt.",
     "use": "płyty GK do profili",
     "qty": 1,
     "unit": "op.",
     "price": 69.98,
     "source": "",
     "links": [{"name": "castorama.pl", "url": "https://www.castorama.pl/wkrety-na-tasmie-do-metalu-plyt-g-k-4pro-3-5-x-35-mm-1000-szt-/5904433424875_CAPL.prd"}]
    },
    {
     "id": "profileScrews",
     "name": "Wkręty do profili",
     "spec": "3,5 × 9,5, 250 szt.",
     "use": "profil do profilu",
     "qty": 1,
     "unit": "op.",
     "price": 22.49,
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/wkret-do-plyt-g-k-3-5-x-9-5-mm-250-szt-standers-45530233.html"}]
    },
    {
     "id": "anchors",
     "name": "Kołki szybkiego montażu",
     "spec": "6 × 40",
     "use": "profile UD do ściany i sufitu",
     "qty": 1,
     "unit": "op.",
     "price": 14.29,
     "source": "sprzedawca Robimet",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/kolki-szybkie-montazu-6x40-mm-standers-45746715.html"}]
    },
    {
     "id": "jointTape",
     "name": "Taśma spoinowa",
     "spec": "fizelinowa, 50 mm × 25 m",
     "use": "spoiny płyt GK",
     "qty": 1,
     "unit": "szt.",
     "price": 8.99,
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/tasma-fizelinowa-50-mm-25-mb-82738326.html"}]
    },
    {
     "id": "cornerBead",
     "name": "Narożnik aluminiowy",
     "spec": "Rigips 23,5 × 23,5, 3 m",
     "use": "zewnętrzne krawędzie zabudów GK",
     "qty": "=ROUNDUP({n:plasterEdge}/3000,0)",
     "unit": "szt.",
     "price": 9.67,
     "source": "",
     "links": [{"name": "sklep.sewera.pl", "url": "https://sklep.sewera.pl/naroznik-aluminiowy-23-5x23-5mm-3m-rigips-p7500"}]
    },
    {
     "id": "seal",
     "name": "Uszczelka T",
     "spec": "silikonowa, biała, wciskana",
     "use": "szczelina między GK a meblami (3–5); dobrać rozmiar",
     "qty": "=ROUNDUP({n:plasterEdge}/1000*(1+{v:edgeAllowance}),0)",
     "unit": "mb",
     "price": 21.53,
     "source": "",
     "links": [{"name": "centrumuszczelek.pl", "url": "https://centrumuszczelek.pl/uszczelka-typu-t/uszczelka-silikonowa-biala-wciskana-typ-t-0995462-6199"}]
    }
   ]
  },
  {
   "name": "AGD",
   "appliances": true,
   "items": [
    {
     "id": "sink",
     "name": "Zlew IKEA KILSVIKEN",
     "spec": "1 komora, czarny kompozyt kwarcowy, {a:sink.body.width} × {a:sink.body.depth}, komora {a:sink.bowl.width} × {a:sink.bowl.depth} × {a:sink.bowl.height}, art. 293.370.25; syfon LILLVIKEN w zestawie",
     "use": "blat nad szafką zlewową",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 1279,
     "refs": ["sink", "sinkTap"],
     "source": "",
     "links": [
      {"name": "IKEA: instrukcja montażu z szablonem (PDF)", "url": "https://www.ikea.com/pl/pl/assembly_instructions/kilsviken-zlew-wpuszczany-1-komorowy-czarny-kompozyt-kwarcowy__AA-2382156-2-2.pdf"},
      {"name": "ikea.com/pl", "url": "https://www.ikea.com/pl/pl/p/kilsviken-zlew-wpuszczany-1-komora-czarny-kompozyt-kwarcowy-s29337025/"}
     ]
    },
    {
     "id": "trap",
     "name": "Syfon Deante Space Saver",
     "spec": "Lux ZXY 9917, odpływ 3,5″, przelew, przyłącze zmywarki",
     "use": "szafka zlewowa; zostawia miejsce na szufladę z koszami",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 119,
     "refs": ["sinkCabinet", "sinkTap"],
     "source": "",
     "links": [{"name": "sklep.deante.pl", "url": "https://sklep.deante.pl/pl/Syfon-do-zlewozmywaka-granitowego-1-komorowego-Space-Saver/ZXY-9917"}]
    },
    {
     "id": "tap",
     "name": "Bateria Deante Silia",
     "spec": "BQS_Z73M, złota, wyciągana wylewka, 1 otwór Ø35",
     "use": "zlew",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 610.84,
     "refs": ["sinkTap"],
     "source": "",
     "links": [{"name": "mediaexpert.pl", "url": "https://www.mediaexpert.pl/agd-do-zabudowy/baterie-kuchenne/baterie-kuchenne/bateria-deante-silia-bqs-z73m-zloty"}]
    },
    {
     "id": "coffee",
     "name": "Ekspres DeLonghi Dinamica",
     "spec": "ECAM350.55.B, posiadany",
     "use": "półka wysuwana w szafce z ekspresem",
     "qty": "={n:tag.coffee}",
     "unit": "szt.",
     "price": 0,
     "refs": ["pullOutShelf"],
     "source": "bez zakupu",
     "links": [{"name": "DeLonghi: strona produktu (EN)", "url": "https://delonghi-s2.delonghigroup.com/en/dinamica-fully-automatic-black-coffee-maker-ecam350-55-b/p/ECAM350.55.B%20EX%3A4"}]
    },
    {
     "id": "fridge",
     "name": "Lodówko-zamrażarka Bosch",
     "spec": "KIS86AFE0, do zabudowy, wys. {a:fridgeFreezer.body.height}, zawias płaski",
     "use": "słupek lodówki, fronty na drzwiach urządzenia",
     "qty": "={n:fridges}",
     "unit": "szt.",
     "price": 3949,
     "refs": ["fridge", "fridgeAir"],
     "source": "",
     "links": [
      {"name": "Bosch: strona produktu z instrukcją montażu", "url": "https://www.bosch-home.pl/pl/product/chlodzenie-i-zamrazanie/chlodziarko-zamrazarki/chlodziarko-zamrazarki-do-zabudowy/KIS86AFE0"},
      {"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/lodowka-do-zabudowy-kis86afe0-bosch-82744412.html"}
     ]
    },
    {
     "id": "dishwasher",
     "name": "Zmywarka Bosch",
     "spec": "SMV4HVX00E, w pełni do zabudowy, 60 cm",
     "use": "pod blatem, front na drzwiach urządzenia",
     "qty": "={n:tag.dishwasher}",
     "unit": "szt.",
     "price": 1899,
     "refs": ["dishwasher"],
     "source": "",
     "links": [
      {"name": "Bosch: strona produktu z instrukcjami", "url": "https://www.bosch-home.pl/pl/product/zmywanie/zmywarki-do-zabudowy/zintegrowane-zmywarki-o-szerokosci-60-cm/SMV4HVX00E"},
      {"name": "Bosch: karta produktu (PDF)", "url": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/SMV4HVX00E.pdf"},
      {"name": "oleole.pl", "url": "https://www.oleole.pl/zmywarki-do-zabudowy/bosch-zmywarka-smv4hvx00e-bosch.bhtml"}
     ]
    },
    {
     "id": "hob",
     "name": "Płyta indukcyjna Electrolux",
     "spec": "CIT61443, 60 cm, wycięcie {s:cutouts.hob.width} × {s:cutouts.hob.depth}",
     "use": "blat nad korpusem z płytą",
     "qty": "={n:hobs}",
     "unit": "szt.",
     "price": 1579,
     "refs": ["hob"],
     "source": "1449 z kodem do 9 lis 2026",
     "links": [
      {"name": "Electrolux: strona produktu z instrukcją", "url": "https://www.electrolux.pl/kitchen/cooking/hobs/induction-hob/cit61443/"},
      {"name": "neonet.pl", "url": "https://www.neonet.pl/plyty-do-zabudowy/electrolux-cit61443.html"}
     ]
    },
    {
     "id": "oven",
     "name": "Piekarnik Bosch Serie 4",
     "spec": "HBA534BB3, czarny, 71 l, wys. {a:oven.fascia.height}",
     "use": "słupek, pod mikrofalówką",
     "qty": "={n:type.oven}",
     "unit": "szt.",
     "price": 1899,
     "refs": ["oven", "ovenColumn"],
     "source": "RTV EURO AGD i OleOle!",
     "links": [
      {"name": "Bosch: karta produktu (PDF)", "url": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/HBA534BB3.pdf"},
      {"name": "Bosch: instrukcja, montaż s. 26–27 (PDF)", "url": "https://media3.bosch-home.com/Documents/9001910274_B.pdf"},
      {"name": "okazje.info.pl", "url": "https://www.okazje.info.pl/szukaj/bosch-serie-4-hba534bb3-termoobieg-czarny-piekarnik-elektryczny/ceny.html"}
     ]
    },
    {
     "id": "microwave",
     "name": "Mikrofalówka Bosch",
     "spec": "BFL623MB3, do zabudowy",
     "use": "słupek, nad piekarnikiem",
     "qty": "={n:type.microwave}",
     "unit": "szt.",
     "price": 999,
     "refs": ["microwave", "ovenColumn"],
     "source": "",
     "links": [
      {"name": "Bosch: strona produktu z dokumentami", "url": "https://www.bosch-home.pl/pl/product/gotowanie-i-pieczenie/kuchenki-mikrofalowe/kuchenki-mikrofalowe-do-zabudowy/BFL623MB3"},
      {"name": "Instrukcja montażu, s. 24–25 (PDF)", "url": "https://maxelektro.pl/storage/file/pimcore_import/2024/12/17/94c9b8f85ca9df2e0ed5ed5def050d92/kuchenka-mikrofalowa-bosch-serie-2-bfl623mb3-instrukcja-montazu.pdf"},
      {"name": "oleole.pl", "url": "https://www.oleole.pl/kuchenki-mikrofalowe-do-zabudowy/bosch-bfl623mb3.bhtml"}
     ]
    },
    {
     "id": "hood",
     "name": "Okap Electrolux",
     "spec": "LFV416K, kominowy, 60 cm, wylot Ø150",
     "use": "nad płytą grzewczą",
     "qty": 1,
     "unit": "szt.",
     "price": 1999.99,
     "refs": ["hood"],
     "source": "",
     "links": [
      {"name": "Instrukcja obsługi, dane techniczne (EN)", "url": "https://www.manuals.co.uk/electrolux/lfv416k/manual?p=237"},
      {"name": "mediaexpert.pl", "url": "https://www.mediaexpert.pl/agd-do-zabudowy/okapy-do-zabudowy/okap-electrolux-lfv416k"}
     ]
    },
    {
     "id": "duct",
     "name": "Rura okapu",
     "spec": "Equation, aluminiowa Ø150, 2,7 m",
     "use": "okap do kanału wentylacyjnego (wyciąg)",
     "qty": 1,
     "unit": "szt.",
     "price": 68.49,
     "refs": ["hood"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/rura-odprowadzajaca-aluminiowa-wentylacyjna-150-mm-2-7-mb-equation-40418021.html"}]
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
