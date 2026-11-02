/* Kitchen project cost data - read by cost.html. Written for each project (LLM). Plain JSON after "window.KITCHEN_COST =".
   Everything measured comes from design.js through engine.js, the appliance sizes from appliances.js: nothing here repeats
   a calculated number.
     page        tab title, heading, info line, XLSX file name, excluded (what the estimate does not cover)
     params      the inputs above the estimate (waste, sheet size in m², reserve); a value or a formula
     values      fixed numbers of the estimate: stock sizes (sheet, worktop board, plasterboard), allowances
     labels      fronts: the label of a front in the cutting list, by its type and tags (first match; none = its type);
                 sheet: the label of the sheet input; cuttingNote: the text under the cutting list; legend: a remark per
                 hole kind in the drilling legend
     blocks      cutting-list tables, code = the two letters of their row labels (KO-07), rows built by engine.js: id = fronts | frames | plinths | panels | wallPanels | plaster | worktops | endPanels,
                 or a material use (carcass, drawerBox, back ...: every board of that use's material); cut = priced saw
                 cuts; columns = the header when not Element / Długość / Szerokość / Ilość
     categories  estimate items, by category {name, appliances, items}; appliances = the category counts as AGD, not
                 furniture. An item: id, name, spec, qty (a number or a formula), unit, price, refs (ids of the notes it
                 links to), source, links (the shops of the price [{name, url}], as every link in the data)
     notes       Notes tab, by section {name, notes}; a note: id, appliance (its documents come from appliances.js), topic,
                 description, assumed (in the estimate), decide (open question), links [{name, url}]; \n starts a new line.
                 Notes and sections are numbered in this order.
     formulas    named calculations used in several texts ({f:name}), written like {=...} without the braces
   Texts and formulas may hold placeholders:
     {n:hinges}        engine count ({n:type.oven}, {n:tag.bins} = items with that type / tag, 0 when none)
     {s:drawers.D.frontAbove} design.js setting     {t:carcass} thickness and {m:cabinet} material label of a board type or part
                       (a material use of engine.js: a board type, islandWorktop, endPanel, islandEndPanel, carcass, back, drawerBox, hobPanel)
     {w:1.depth}       worktop of group 1  {k:K8.innerWidth} carcass by name: width, height, innerWidth, v0, v1
     {i:K8/oven.space} item by carcass name or place (G1[6]) and type or tag, #2 = the second from the bottom:
                       width, height, v0, v1 (module), frontWidth, frontHeight, frontV0, frontV1 (front),
                       spaceBottom, spaceTop, space (clear height between the horizontal boards of the carcass around it),
                       hinge (hinge side of its door), edges (ABS edges of a panel), fit.feet, fit.fasciaV0 ... (its appliance:
                       engine.js fitAppliances)
     {a:oven.fascia.height}  appliances.js       {v:sheet.length} values
     {p:hinges}        unit price          {q:hinges} item quantity          {note:hinges} the number of a note
     {f:ovenMicrowaveGap}  a named formula of "formulas"
     {carcass.m2}      cutting-list total of a block (m2, edge, cut, qty)    {waste} {sheet} {reserve} params
     {=expression}     a calculation with placeholders in angle brackets, e.g. {=(<a:oven.fascia.width> - <k:K8.innerWidth>) / 2},
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
  "worktopBoard": {"length": 4100, "depth": 650, "islandDepth": 920},
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
  "cuttingNote": "Wymiary: długość × szerokość, dłuższy bok pierwszy; fronty szerokość × wysokość.\nKrawędź: liczba wykończonych krawędzi wzdłuż wymiaru obok (0, 1, 2), jak w formularzu hurtowni.\nSumy: ABS razem = długość ABS × ilość; cięcia = (długość + szerokość) × ilość.\nKorpus: gł. {s:carcass.depth}, {s:carcass.wallGap} od ściany; wnętrze = szerokość − 2 × {t:carcass}.\nPółki: ruchoma = wnętrze − 2 × {s:shelf.clearance}, gł. − {s:shelf.setback}; stała = pełna głębokość (nad piekarnikiem i lodówką − {s:shelf.ventGap}).\nPlecy = korpus − 2 × {s:back.inset}; front = moduł − 4 szczeliny; listwa tylna = {s:frame.depth} × długość listwy.\nSzuflady: dno = wnętrze − {s:drawers.bottom.inset} × {s:drawers.bottom.depth}; tył = wnętrze − {s:drawers.back.inset}.\nABS: tylko krawędzie widoczne; strona każdej krawędzi w zakładce Montaż.\nLakier: fronty dookoła, listwy krawędź przednia, cokół i panele bez krawędzi.\nBlaty: krawędź przednia fabryczna, wycięcia bez ABS.",
  "legend": {"runner": "pozycje do potwierdzenia wg Blum i Häfele"}
 },
 "blocks": [
  {"id": "fronts", "code": "FR", "title": "FRONTY – {m:cabinet}, shaker, lakierowane dookoła", "columns": ["Funkcja", "Szerokość", "Wysokość", "Ilość"]},
  {"id": "frames", "code": "LI", "title": "LISTWY – {m:frame} na sztorc, gł. {s:frame.depth}, lakierowane obustronnie i krawędź przednia"},
  {"id": "plinths", "code": "CO", "title": "COKÓŁ – {m:plinth}, wilgocioodporny, lakierowany obustronnie"},
  {"id": "panels", "code": "PA", "title": "PANELE – {m:panel} na płasko, lakierowane obustronnie; ABS na widocznych krawędziach"},
  {"id": "wallPanels", "code": "PS", "title": "PANEL ŚCIENNY – {m:wallPanel}, na ścianie nad blatem"},
  {
   "id": "carcass",
   "code": "KO",
   "title": "KORPUSY – wszystkie części z {m:carcass}: cięcie + ABS 0,8 na krawędziach widocznych (z listwami tylnymi, półką wysuwaną, słupkami zawiasowymi, panelami wpuszczanymi, płytami dystansowymi)",
   "cut": true
  },
  {
   "id": "drawerBox",
   "code": "SZ",
   "title": "SZUFLADY – wszystkie części z {m:drawerBox}: dna i tyły TANDEMBOX (z szufladami wewnętrznymi), szuflady za drzwiami i przegroda pod płytą",
   "cut": true
  },
  {"id": "back", "code": "PL", "title": "PLECY – {m:back}, tylko za drzwiami szafek"},
  {"id": "worktops", "code": "BL", "title": "BLATY – {m:worktop} (blat), {m:islandWorktop} (wyspa); wycięcia na zlew (WZ) i płytę (WP) wg legendy"},
  {"id": "endPanels", "code": "PK", "title": "PANELE KOŃCOWE – {m:endPanel}; blat wystaje {s:worktop.endPanelOverhang} mm poza panel końcowy (bok, przód, w wyspie tył)"},
  {"id": "plaster", "code": "GK", "title": "ZABUDOWA GK – GKBI 12,5 na CD60 / UD27, gł. {s:plasterboard.depth} (zabudowa do sufitu, grupa 2)"}
 ],
 "categories": [
  {
   "name": "Fronty, listwy i cokół",
   "items": [
    {
     "id": "fronts",
     "name": "Fronty: {m:cabinet}",
     "spec": "wg listy cięć; MDF {t:cabinet}, lakierowane dookoła",
     "qty": "={fronts.m2}",
     "unit": "m²",
     "price": 720,
     "refs": ["lacquered"],
     "source": "NIESPRAWDZONE – kwota właściciela. Ceny katalogowe online: ogony.pl 990 + 400 (2. strona), fronty.com.pl 820, zakupynawymiar.pl 796 (1 strona), gama-sklep 699 (1 strona), frontlakierowany.pl 630 netto + 70 % (2. strona), lakierowane.pl 370 netto (1 strona)",
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
     "id": "frames",
     "name": "Listwy na sztorc: {m:frame}",
     "spec": "gł. {s:frame.depth}; lakierowane obustronnie i krawędź przednia",
     "qty": "={frames.m2}",
     "unit": "m²",
     "price": 332.1,
     "refs": ["framesPanels", "lacquered"],
     "source": "MDF gładki 18, mat: 270 netto/m² (jedna strona; druga strona: zapytać)",
     "links": [{"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
    },
    {
     "id": "plinths",
     "name": "Cokół: {m:plinth}",
     "spec": "MDF wilgocioodporny, lakierowany obustronnie",
     "qty": "={plinths.m2}",
     "unit": "m²",
     "price": 332.1,
     "refs": ["lacquered", "corner"],
     "source": "MDF gładki 18, mat: 270 netto/m² (jedna strona; druga strona: zapytać)",
     "links": [{"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
    },
    {
     "id": "panels",
     "name": "Panele na płasko: {m:panel}",
     "spec": "lakierowane obustronnie; narożnik L, panel tylny wyspy",
     "qty": "={panels.m2}",
     "unit": "m²",
     "price": 332.1,
     "refs": ["lacquered", "hiddenSides"],
     "source": "MDF gładki 18, mat: 270 netto/m² (jedna strona; druga strona: zapytać)",
     "links": [{"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
    }
   ]
  },
  {
   "name": "Korpusy",
   "items": [
    {
     "id": "carcassBoard",
     "name": "{m:carcass}",
     "spec": "arkusz {v:sheet.length}×{v:sheet.width}, + odpad",
     "qty": "=ROUNDUP({carcass.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 268.18,
     "refs": ["carcassBoard"],
     "source": "Bielsko-Biała",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-U708-ST9-2800x2070x18MM-Szary-jasny/2219"}]
    },
    {
     "id": "drawerBoard",
     "name": "{m:drawerBox}",
     "spec": "dna i tyły szuflad, szuflady za drzwiami, przegroda pod płytą",
     "qty": "=ROUNDUP({drawerBox.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 344.40,
     "source": "Bielsko-Biała",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-U708-ST9-2800x2070x16MM-Szary-jasny/2190"}]
    },
    {
     "id": "backBoard",
     "name": "{m:back}",
     "spec": "plecy za drzwiami szafek, arkusz {v:sheet.length}×{v:sheet.width}",
     "qty": "=ROUNDUP({back.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 124.32,
     "source": "Bielsko-Biała",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/HDF-SZARY-LAKIEROWANY-2800x2070x3.0MM/2804"}]
    },
    {
     "id": "cutting",
     "name": "Cięcie płyt",
     "spec": "cięcia {m:carcass} + {m:drawerBox}, wg listy cięć",
     "qty": "={carcass.cut}+{drawerBox.cut}",
     "unit": "mb",
     "price": 5,
     "source": "M-HM - cena do potwierdzenia; szacunek wg ciecieoklejanie.pl (płyty 3–20 mm)",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/i/Uslugi/16"}, {"name": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"}]
    },
    {
     "id": "carcassEdging",
     "name": "Oklejanie ABS 0,8, Egger U708 ST9 szary jasny (dekor korpusu)",
     "spec": "krawędzie korpusów i szuflad za drzwiami wg sumy ABS z listy cięć + {v:edgeAllowance|%}",
     "qty": "=({carcass.edge}+{drawerBox.edge})*(1+{v:edgeAllowance})",
     "unit": "mb",
     "price": 6,
     "source": "M-HM - cena do potwierdzenia; szacunek wg ciecieoklejanie.pl (usługa oklejania, płyty 10–18 mm, 6/mb z obrzeżem (samo obrzeże U708 ST9 23/0,8: 1,77/mb w M-HM))",
     "links": [
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/i/Uslugi/16"},
      {"name": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/OBRZEZE-ABS-U708-ST9-230.8MM-Szary-jasny/1146"}
     ]
    },
    {
     "id": "panelEdging",
     "name": "Oklejanie paneli, kolor {m:panel}",
     "spec": "krawędzie paneli wg sumy ABS z listy cięć + {v:edgeAllowance|%}; obrzeże granatowe dobrane do lakieru",
     "qty": "={panels.edge}*(1+{v:edgeAllowance})",
     "unit": "mb",
     "price": 6,
     "refs": ["framesPanels"],
     "source": "panele robi producent frontów (lakierowane.pl) - zapytać o oklejanie; szacunek wg ciecieoklejanie.pl",
     "links": [
      {"name": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"},
      {"name": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"}
     ]
    }
   ]
  },
  {
   "name": "Okucia",
   "items": [
    {
     "id": "hinges",
     "name": "Zawias Blum CLIP top BLUMOTION 110° 71B3550 + prowadnik 173H7100 (mimośród)",
     "spec": "nakładany, puszka Ø{s:drilling.cup.diameter}; prowadnik 0 mm z mimośrodową regulacją wysokości ±2; na drzwi wg wysokości frontu (settings.hinges)",
     "qty": "={n:hinges}",
     "unit": "szt.",
     "price": 16.73,
     "refs": ["hinges"],
     "source": "zawias 14,25 + prowadnik 2,48 (meblownia: 11,53 + 2,00)",
     "links": [
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/CLIP-top-BLUMOTION-Zawias-110%2C-Drzwi-nakladane%2C-puszka-na-wkrety-71B3550/2253"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/CLIP-prowadnik%2C-krzyzakowy%2C-00-mm%2C-Stal%2C-Wkrety%2C-RW-mimosrod-173H7100/1376"}
     ]
    },
    {
     "id": "pullOutShelfRunners",
     "name": "Prowadnice Blum MOVENTO 760H5000S + sprzęgła T51.7601",
     "spec": "podszafkowe, pełny wysuw, 500, 40 kg, do półki wysuwanej; półka na liście cięć {m:carcass}",
     "qty": "={n:pullOutShelves}",
     "unit": "kpl.",
     "price": 151.28,
     "refs": ["pullOutShelf"],
     "source": "prowadnice 136,36 + sprzęgła 2 × 7,46 (meblownia: 121,84)",
     "links": [
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/MOVENTO-z-BLUMOTION-S%2C-40-kg%2C-L500-mm%2C-lewaprawa-760H5000S/2312"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Lewe-z-regulacja-boczna-T51.7601-LEWE/3109"},
      {"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Prawe-z-regulacja-boczna-T51.7601-PRAWE/3110"}
     ]
    },
    {
     "id": "drawersD",
     "name": "TANDEMBOX antaro D 500 szary, 30 kg, z relingiem",
     "spec": "front > {s:drawers.D.frontAbove}: dolne szuflady z szufladą zlewową; bez dna, tyłu i frontu",
     "qty": "={n:drawersD}",
     "unit": "kpl.",
     "price": 169.05,
     "refs": ["sinkCabinet"],
     "source": "",
     "links": [{"name": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-d-z-relingiem-szara-30-kg.html"}]
    },
    {
     "id": "drawersM",
     "name": "TANDEMBOX antaro M 500 szary, 30 kg",
     "spec": "front ≤ {s:drawers.D.frontAbove}; boki 378M5002SA, prowadnice 578.5001M, wsporniki",
     "qty": "={n:drawersM}",
     "unit": "kpl.",
     "price": 136.39,
     "source": "",
     "links": [{"name": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-m-szara-30-kg.html"}]
    },
    {
     "id": "innerDrawers",
     "name": "TANDEMBOX antaro szuflada wewnętrzna M 500 szara, 30 kg",
     "spec": "na sztućce, za górnym frontem; szare boki 378M5002SA, prowadnice 578.5001M; front wewnętrzny Z31L1036A przycięty do LW − {s:drawers.inner.frontDeduction}",
     "qty": "={n:innerDrawers}",
     "unit": "kpl.",
     "price": 207.81,
     "refs": ["innerDrawers"],
     "source": "",
     "links": [{"name": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-wewnetrzna-tandembox-antaro-500-m-biala-30-kg-19272.html"}]
    },
    {
     "id": "ballRunners",
     "name": "Prowadnice kulkowe Häfele z cichym domykiem (hamulcem) H45, pełny wysuw, 30 kg (494.02.184), komplet L + P",
     "spec": "do szuflad za drzwiami; L = {i:K12/doorDrawers.runnerLength}, {s:doorDrawers.clearance} na stronę; szuflady z {m:drawerBox} na liście cięć; zamiast szuflad wewnętrznych Blum ({p:innerDrawers} za szufladę) – patrz uwaga w notatce",
     "qty": "={n:doorDrawers}",
     "unit": "kpl.",
     "price": 29.52,
     "refs": ["doorDrawers"],
     "source": "M-HM Bielsko-Biała",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PROW.KULKOWA-Z-HAMUL.PW450-30KG45MM-494.02.184/1986"}]
    },
    {
     "id": "cutleryTrays",
     "name": "Wkład na sztućce Hettich OrgaTray 440 9195001, antracyt, gł. 441–520 / szer. 701–800",
     "spec": "zamówić: kolor antracyt, głębokość 441–520 (prowadnice 500), szerokość 701–800 (korpus {k:K14.width}); wys. 55; zamiast Blum ORGA-LINE ZSI.80VEI6 (495,25)",
     "qty": "={n:innerDrawers}",
     "unit": "szt.",
     "price": 128.56,
     "refs": ["innerDrawers"],
     "source": "na zamówienie 3–10 dni rob.",
     "links": [{"name": "akcesoriameble24.pl", "url": "https://akcesoriameble24.pl/product/wklad-orgatray-440-hettich-do-szuflady/"}]
    },
    {
     "id": "bins",
     "name": "Kosz do segregacji Amix RUBIO-80/3x15L",
     "spec": "3 × 15 l w szufladzie zlewowej (D, NL 500)",
     "qty": "={n:tag.bins}",
     "unit": "kpl.",
     "price": 129.25,
     "refs": ["sinkCabinet"],
     "source": "",
     "links": [{"name": "amix.pl", "url": "https://amix.pl/pl/segregatory-rubio/2000-rubio-80-3x15"}]
    },
    {
     "id": "handles",
     "name": "Uchwyt IKEA ENERYDA, kolor mosiądzu, 89 mm (706.108.37), opak. 2 szt.",
     "spec": "1 na front; rozstaw otworów 64",
     "qty": "=ROUNDUP({n:handles}/2,0)",
     "unit": "op.",
     "price": 20,
     "source": "",
     "links": [{"name": "ikea.com/pl", "url": "https://www.ikea.com/pl/pl/p/eneryda-uchwyt-kolor-mosiadzu-70610837/"}]
    },
    {
     "id": "legs",
     "name": "Nóżka Häfele AXILO H 150 (140–170) 637.76.355",
     "spec": "{s:carcass.legs} na korpus stojący, cofnięte za cokół; regulacja kluczem od przodu, przed założeniem cokołu",
     "qty": "={n:legs}",
     "unit": "szt.",
     "price": 3.23,
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/AXILO-Nozka-meblowa-H-150-mm-140-170mm-637.76.355/2210"}]
    },
    {
     "id": "plinthClips",
     "name": "Klips cokołu przykręcany Häfele 637.38.054",
     "spec": "na przednich nóżkach",
     "qty": "={n:legs}/2",
     "unit": "szt.",
     "price": 1.1,
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/AXILO%2CHE-Zatrzask-Klips-do-cokolu-do-przykrecania-do-nozki-637.38.054/2195"}]
    },
    {
     "id": "shelfPins",
     "name": "Podpórki półek ocynk Ø5 z tuleją plastikową, opak. 100 szt.",
     "spec": "{=<n:shelfPins> / <n:shelvesAdjustable>} na półkę ruchomą",
     "qty": "=ROUNDUP({n:shelfPins}/100,0)",
     "unit": "op.",
     "price": 8.4,
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Podporka-polki-ocynk-fi5-z-tuleja-plastikowa-opak100-szt./4482"}]
    },
    {
     "id": "confirmats",
     "name": "Konfirmaty 6,4 × 50, ocynk biały, opak. 1000 szt.",
     "spec": "ok. {v:confirmatsPerCarcass} na korpus ({n:carcasses} korpusów); wiertło do konfirmatów 6,4 (nie 7)",
     "qty": "=ROUNDUP({n:carcasses}*{v:confirmatsPerCarcass}/1000,0)",
     "unit": "op.",
     "price": 119.39,
     "source": "w M-HM tylko 6,4 × 50 po 1000 szt.; meblownia 7 × 50: 12,57 za 100",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Konfirmat-M-6.4-x-50-OC.BIALY-opak1000-szt./4511"}]
    },
    {
     "id": "connectors",
     "name": "Złącza skręcane Ø5 M4, nikiel, opak. 100 szt.",
     "spec": "skręcanie korpusów, z narożnikiem L",
     "qty": 1,
     "unit": "op.",
     "price": 29.52,
     "refs": ["corner"],
     "source": "",
     "links": [{"name": "g-s.com.pl", "url": "https://g-s.com.pl/zlacze-skrecane-meblowe-fi-5-m4-nikiel.html"}]
    },
    {
     "id": "wallBrackets",
     "name": "Kątownik meblowy wąski 40 × 40 × 17 Domax",
     "spec": "listwa tylna do ściany: na górze listwy pod korpusem nad nią (w szczelinie); górna listwa w stosie bez kątownika",
     "qty": "={n:wallBrackets}",
     "unit": "szt.",
     "price": 3.79,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/katownik-meblowy-waski-40-x-40-x-17-mm-domax-42855092.html"}]
    },
    {
     "id": "wallAnchors",
     "name": "Kołek fischer DuoPower 8 × 65 z wkrętem, opak. 20 + 5 szt.",
     "spec": "1 na kątownik; gazobeton",
     "qty": "=ROUNDUP({n:wallBrackets}/25,0)",
     "unit": "op.",
     "price": 30.99,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/kolki-montazowe-8x65-mm-z-wkretem-duopower-20-sztuk-5-gratis-94769354.html"}]
    },
    {
     "id": "smallScrews",
     "name": "Wkręt do drewna 4 × 16 Standers, łeb wpuszczany, opak. 35 szt.",
     "spec": "kątownik do listwy tylnej (2 na kątownik), plecy HDF do korpusów (ok. {v:backScrewsPerM2} na m²); 16 nie przebija płyty 18",
     "qty": "=ROUNDUP(({n:wallBrackets}*2+{back.m2}*{v:backScrewsPerM2})/35,0)",
     "unit": "op.",
     "price": 4.19,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/wkret-4-x-16-mm-35-szt-standers-82231803.html"}]
    },
    {
     "id": "jointScrews",
     "name": "Wkręt do drewna 4 × 30 Standers, łeb wpuszczany, opak. 25 szt.",
     "spec": "listwa i listwa tylna do pierwszego korpusu, {v:screwsPerMetre} na mb każdej",
     "qty": "=ROUNDUP({n:jointLength.screwed}/1000*{v:screwsPerMetre}*2/25,0)",
     "unit": "op.",
     "price": 3.79,
     "refs": ["wallFixing"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/wkret-4-x-30-mm-25-szt-standers-82231806.html"}]
    },
    {
     "id": "brassScrews",
     "name": "Wkręt mosiądzowany 4 × 30 PZ, łeb stożkowy",
     "spec": "drugi korpus do listwy i listwy tylnej, od środka korpusu (widoczne), {v:screwsPerMetre} na mb każdej",
     "qty": "=ROUNDUP({n:jointLength.fromInside}/1000*{v:screwsPerMetre}*2,0)",
     "unit": "szt.",
     "price": 0.4,
     "refs": ["wallFixing"],
     "source": "szacunek wg agas.pl (mosiądzowane 4 × 50, 40 zł / 100 szt.); 4 × 30 do znalezienia",
     "links": [{"name": "agas.pl", "url": "https://agas.pl/wkrety-i-gwozdzie/10724-wkrety-mosiadzowane-4x50-pz-leb-stozkowy-panelvit-100szt-8014174019531.html"}]
    },
    {
     "id": "brackets",
     "name": "Kątowniki 20×20×16, opak. 10 szt.",
     "spec": "mocowanie frontów atrap, {v:bracketsPerDummy} na front",
     "qty": "=ROUNDUP({n:tag.dummy}*{v:bracketsPerDummy}/10,0)",
     "unit": "op.",
     "price": 6,
     "source": "sprzedawca Lun Fix",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/katownik-meblowy-20x20x16x1-5-10szt-74065876.html"}]
    },
    {
     "id": "grilles",
     "name": "Kratka cokołowa GTV 480 × 60, aluminium srebrna",
     "spec": "pod słupkiem lodówki i pod słupkiem piekarnika (Bosch: 200 cm² w cokole); węższa niż wnętrze korpusu",
     "qty": "={n:grilles}",
     "unit": "szt.",
     "price": 33.99,
     "refs": ["oven", "fridgeAir"],
     "source": "",
     "links": [
      {
       "name": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/kratka-wentylacyjna-do-mebli-480-x-60-mm-aluminiowa-srebrna-gtv-42083426.html"
      }
     ]
    }
   ]
  },
  {
   "name": "Blaty i panel ścienny",
   "items": [
    {
     "id": "worktop",
     "name": "{m:worktop}, {v:worktopBoard.depth} × {v:worktopBoard.length} × {t:worktop}",
     "spec": "blat grupy 1, przycięty do {w:1.depth}; krawędź przednia fabryczna Egger 100/1.5",
     "qty": 1,
     "unit": "szt.",
     "price": 1201.01,
     "refs": ["worktops"],
     "source": "M-HM Bielsko-Biała, duża ilość; cięcie i oklejanie ABS 43/1,5 H1180 - zapytać o cenę (tel. 720 890 335)",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x650x38MM-Dab-Halifax-naturalny/1313"}]
    },
    {
     "id": "islandWorktop",
     "name": "{m:islandWorktop}, {v:worktopBoard.islandDepth} × {v:worktopBoard.length} × {t:islandWorktop}",
     "spec": "blat wyspy, przycięty do {w:3.depth}; krawędź przednia fabryczna Egger 100/1.5, krawędź tylna po przycięciu do oklejenia",
     "qty": 1,
     "unit": "szt.",
     "price": 2056.93,
     "refs": ["worktops"],
     "source": "M-HM Bielsko-Biała, duża ilość; cięcie i oklejanie ABS 43/1,5 H1180 - zapytać o cenę (tel. 720 890 335)",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x920x38MM-Dab-Halifax-naturalny/1259"}]
    },
    {
     "id": "endPanelBoard",
     "name": "Panele końcowe: {m:endPanel}",
     "spec": "głębokość blatu ({w:1.depth} grupa 1, {w:3.depth} wyspa) minus nawis {s:worktop.endPanelOverhang} mm z przodu (w wyspie także z tyłu); wymiary w liście cięć (blok PANELE KOŃCOWE)",
     "qty": "={endPanels.m2}",
     "unit": "m²",
     "price": 451,
     "refs": ["worktops"],
     "source": "NIESPRAWDZONE – szukam jeszcze rozwiązania na dąb dwustronny; szacunek: cena m² blatu {m:worktop} w M-HM",
     "links": []
    },
    {
     "id": "worktopEdging",
     "name": "Obrzeże ABS-H1180 ST37 43/1,5 Dąb Halifax naturalny",
     "spec": "krawędzie z ABS wg listy cięć (bloki BLATY i PANELE KOŃCOWE): krawędź boczna blatu nad panelem końcowym, w wyspie krawędź tylna blatu; panele końcowe: krawędź przednia, w wyspie także tylna; krawędź przednia blatów fabryczna",
     "qty": "=({worktops.edge}+{endPanels.edge})*(1+{v:edgeAllowance})",
     "unit": "m",
     "price": 10.1,
     "refs": ["worktops"],
     "source": "oklejanie maszynowe - zapytać M-HM (czy krawędź przednia blatu jest fabryczna; obrzeże paneli końcowych dobrać do ich materiału)",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/OBRZEZE-ABS-H1180-ST37-431.5MM-Dab-Halifax-naturalny/1401"}]
    },
    {
     "id": "wallPanel",
     "name": "Panel ścienny {m:wallPanel}, arkusz {v:sheet.length} × {v:sheet.width} × {t:wallPanel}",
     "spec": "wg listy cięć (blok PANEL ŚCIENNY); płyta {t:wallPanel} mm",
     "qty": "=ROUNDUP({wallPanels.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 667.18,
     "source": "M-HM Bielsko-Biała",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-H1180-ST37-2800x2070x18.6MM-Dab-Halifax-naturalny/135"}]
    },
    {
     "id": "worktopJoints",
     "name": "Złącze do blatów ZŁM-26 L-100",
     "spec": "blat z panelami końcowymi: 2 na panel końcowy",
     "qty": "={n:type.endPanel}*2",
     "unit": "szt.",
     "price": 3.3,
     "refs": ["worktops"],
     "source": "",
     "links": [{"name": "m-hm.pl", "url": "https://m-hm.pl/pl/p/ZLACZE-DO-BLATOW-ZLM-26-L-100MM/500"}]
    },
    {
     "id": "silicone",
     "name": "Silikon sanitarny biały 300 ml",
     "spec": "blat do ściany, zlew",
     "qty": 2,
     "unit": "szt.",
     "price": 25.0,
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
     "name": "Płyta GK Norgips GKBI H2 12,5, {v:plasterboard.width}×{v:plasterboard.length}",
     "spec": "czoło + bok każdej zabudowy × {s:plasterboard.layers} warstwy, + {waste|%} odpadu",
     "qty": "=ROUNDUP({plaster.m2}*{s:plasterboard.layers}*(1+{waste})/({v:plasterboard.width}*{v:plasterboard.length}/1000000),0)",
     "unit": "szt.",
     "price": 46.99,
     "refs": ["plaster"],
     "source": "",
     "links": [
      {
       "name": "castorama.pl",
       "url": "https://www.castorama.pl/plyta-gipsowo-kartonowa-impregnowana-1200-x-2600-x-12-5-mm-gkbi-typ-h2-norgips/5907651691616_CAPL.prd"
      }
     ]
    },
    {
     "id": "profileCD",
     "name": "Profil CD60 Budmat 0,5, 3 m",
     "spec": "krawędź zewnętrzna + poprzeczki co {s:plasterboard.studSpacing}",
     "qty": "=ROUNDUP({n:plasterCD}/3000,0)",
     "unit": "szt.",
     "price": 9.98,
     "refs": ["plaster"],
     "source": "",
     "links": [{"name": "castorama.pl", "url": "https://www.castorama.pl/profil-sufitowy-budmat-cd60-0-5-mm-3-m/5907595734011_CAPL.prd"}]
    },
    {
     "id": "profileUD",
     "name": "Profil UD27 Budmat, 3 m",
     "spec": "przy ścianie i suficie",
     "qty": "=ROUNDUP({n:plasterUD}/3000,0)",
     "unit": "szt.",
     "price": 5.98,
     "refs": ["plaster"],
     "source": "",
     "links": [{"name": "castorama.pl", "url": "https://www.castorama.pl/profil-budmat-ud27-3-m/5907738940163_CAPL.prd"}]
    },
    {
     "id": "jointFiller",
     "name": "Masa szpachlowa Knauf Uniflott, 5 kg",
     "spec": "spoiny i narożniki",
     "qty": 1,
     "unit": "szt.",
     "price": 31.29,
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/masa-szpachlowa-uniflott-5-kg-knauf-43360653.html"}]
    },
    {
     "id": "plasterScrews",
     "name": "Wkręty do GK 4PRO 3,5 × 35 do metalu, 1000 szt.",
     "spec": "płyty do profili",
     "qty": 1,
     "unit": "op.",
     "price": 69.98,
     "source": "",
     "links": [
      {
       "name": "castorama.pl",
       "url": "https://www.castorama.pl/wkrety-na-tasmie-do-metalu-plyt-g-k-4pro-3-5-x-35-mm-1000-szt-/5904433424875_CAPL.prd"
      }
     ]
    },
    {
     "id": "profileScrews",
     "name": "Wkręty do profili 3,5 × 9,5, 250 szt.",
     "spec": "profil do profilu",
     "qty": 1,
     "unit": "op.",
     "price": 22.49,
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/wkret-do-plyt-g-k-3-5-x-9-5-mm-250-szt-standers-45530233.html"}]
    },
    {
     "id": "anchors",
     "name": "Kołki szybkiego montażu 6 × 40",
     "spec": "profile UD do ściany i sufitu",
     "qty": 1,
     "unit": "op.",
     "price": 14.29,
     "source": "sprzedawca Robimet",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/kolki-szybkie-montazu-6x40-mm-standers-45746715.html"}]
    },
    {
     "id": "jointTape",
     "name": "Taśma spoinowa 50 mm × 25 m",
     "spec": "spoiny płyt",
     "qty": 1,
     "unit": "szt.",
     "price": 8.99,
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/tasma-fizelinowa-50-mm-25-mb-82738326.html"}]
    },
    {
     "id": "cornerBead",
     "name": "Narożnik aluminiowy Rigips 23,5 × 23,5, 3 m",
     "spec": "zewnętrzne krawędzie zabudów GK",
     "qty": "=ROUNDUP({n:plasterEdge}/3000,0)",
     "unit": "szt.",
     "price": 9.67,
     "source": "",
     "links": [{"name": "sklep.sewera.pl", "url": "https://sklep.sewera.pl/naroznik-aluminiowy-23-5x23-5mm-3m-rigips-p7500"}]
    },
    {
     "id": "seal",
     "name": "Uszczelka silikonowa T, biała, wciskana",
     "spec": "szczelina między GK a meblami (3–5); sprawdzić rozmiar do szczeliny",
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
     "name": "Zlew IKEA KILSVIKEN, 1 komora, czarny kompozyt kwarcowy, 72 × 46 (293.370.25)",
     "spec": "komora {a:sink.bowl.width} × {a:sink.bowl.depth} × {a:sink.bowl.height}; syfon LILLVIKEN, sitko i pokrywa w zestawie",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 1279,
     "refs": ["sink", "sinkTap"],
     "source": "",
     "links": [{"name": "ikea.com/pl", "url": "https://www.ikea.com/pl/pl/p/kilsviken-zlew-wpuszczany-1-komora-czarny-kompozyt-kwarcowy-s29337025/"}]
    },
    {
     "id": "trap",
     "name": "Syfon oszczędzający miejsce Deante Space Saver Lux ZXY 9917",
     "spec": "odpływ 3,5″, przelew, przyłącze zmywarki; zostawia miejsce na szufladę z koszami",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 119,
     "refs": ["sinkCabinet", "sinkTap"],
     "source": "",
     "links": [{"name": "sklep.deante.pl", "url": "https://sklep.deante.pl/pl/Syfon-do-zlewozmywaka-granitowego-1-komorowego-Space-Saver/ZXY-9917"}]
    },
    {
     "id": "tap",
     "name": "Bateria Deante Silia BQS_Z73M, złota, wyciągana wylewka",
     "spec": "jeden otwór Ø35",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 610.84,
     "refs": ["sinkTap"],
     "source": "",
     "links": [
      {
       "name": "mediaexpert.pl",
       "url": "https://www.mediaexpert.pl/agd-do-zabudowy/baterie-kuchenne/baterie-kuchenne/bateria-deante-silia-bqs-z73m-zloty"
      }
     ]
    },
    {
     "id": "coffee",
     "name": "Ekspres DeLonghi Dinamica (posiadany)",
     "spec": "na półce wysuwanej szafki z tagiem ekspres",
     "qty": "={n:tag.coffee}",
     "unit": "szt.",
     "price": 0,
     "refs": ["pullOutShelf"],
     "source": "posiadany, bez zakupu",
     "links": []
    },
    {
     "id": "fridge",
     "name": "Lodówka Bosch KIS86AFE0",
     "spec": "do zabudowy {a:fridgeFreezer.body.height}, zawias płaski",
     "qty": "={n:fridges}",
     "unit": "szt.",
     "price": 3949,
     "refs": ["fridge", "fridgeAir"],
     "source": "",
     "links": [{"name": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/lodowka-do-zabudowy-kis86afe0-bosch-82744412.html"}]
    },
    {
     "id": "dishwasher",
     "name": "Zmywarka Bosch SMV4HVX00E",
     "spec": "w pełni do zabudowy 60",
     "qty": "={n:tag.dishwasher}",
     "unit": "szt.",
     "price": 1899,
     "refs": ["dishwasher"],
     "source": "",
     "links": [{"name": "oleole.pl", "url": "https://www.oleole.pl/zmywarki-do-zabudowy/bosch-zmywarka-smv4hvx00e-bosch.bhtml"}]
    },
    {
     "id": "hob",
     "name": "Płyta indukcyjna Electrolux CIT61443",
     "spec": "60, wycięcie {s:cutouts.hob.width} × {s:cutouts.hob.depth}",
     "qty": "={n:hobs}",
     "unit": "szt.",
     "price": 1579,
     "refs": ["hob"],
     "source": "1449 z kodem do 9 lis 2026",
     "links": [{"name": "neonet.pl", "url": "https://www.neonet.pl/plyty-do-zabudowy/electrolux-cit61443.html"}]
    },
    {
     "id": "oven",
     "name": "Piekarnik Bosch Serie 4 HBA534BB3",
     "spec": "wys. {a:oven.fascia.height}, czarny, 71 l",
     "qty": "={n:type.oven}",
     "unit": "szt.",
     "price": 1899,
     "refs": ["oven", "ovenColumn"],
     "source": "RTV EURO AGD i OleOle!",
     "links": [
      {"name": "okazje.info.pl", "url": "https://www.okazje.info.pl/szukaj/bosch-serie-4-hba534bb3-termoobieg-czarny-piekarnik-elektryczny/ceny.html"}
     ]
    },
    {
     "id": "microwave",
     "name": "Mikrofalówka Bosch BFL623MB3",
     "spec": "do zabudowy, nad piekarnikiem",
     "qty": "={n:type.microwave}",
     "unit": "szt.",
     "price": 999,
     "refs": ["microwave", "ovenColumn"],
     "source": "",
     "links": [{"name": "oleole.pl", "url": "https://www.oleole.pl/kuchenki-mikrofalowe-do-zabudowy/bosch-bfl623mb3.bhtml"}]
    },
    {
     "id": "hood",
     "name": "Okap Electrolux LFV416K, 60",
     "spec": "kominowy, wylot Ø150",
     "qty": 1,
     "unit": "szt.",
     "price": 1999.99,
     "refs": ["hood"],
     "source": "",
     "links": [{"name": "mediaexpert.pl", "url": "https://www.mediaexpert.pl/agd-do-zabudowy/okapy-do-zabudowy/okap-electrolux-lfv416k"}]
    },
    {
     "id": "duct",
     "name": "Rura Equation aluminiowa Ø150, 2,7 m",
     "spec": "okap do kanału wentylacyjnego (wyciąg)",
     "qty": 1,
     "unit": "szt.",
     "price": 68.49,
     "refs": ["hood"],
     "source": "",
     "links": [
      {
       "name": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/rura-odprowadzajaca-aluminiowa-wentylacyjna-150-mm-2-7-mb-equation-40418021.html"
      }
     ]
    }
   ]
  }
 ],
 "formulas": {
  "ovenMicrowaveGap": "<i:K8/microwave.fit.fasciaV0> - <i:K8/oven.fit.fasciaV1>",
  "ovenOnShelfAbove": "<a:oven.fascia.height> - <i:K8/oven.space>",
  "microwaveOnShelfBelow": "<i:K8/microwave.spaceBottom> - <i:K8/microwave.v0>",
  "microwaveOnShelfAbove": "<i:K8/microwave.v1> - <i:K8/microwave.spaceTop>",
  "microwaveCabinetGap": "<i:K8/cabinet#2.frontV0> - <i:K8/microwave.v1>",
  "fridgeFrontAboveDoor": "<i:K10/fridge.frontV1> - <i:K10/fridge.fit.bodyV0> - <a:fridgeFreezer.doors.fridge.top>",
  "innerDrawerExtra": "<p:innerDrawers> - <p:ballRunners>"
 },
 "notes": [
  {
   "name": "AGD – WYMIARY I DOPASOWANIE DO KORPUSÓW (mm; szer. × wys. × gł.)",
   "notes": [
    {
     "id": "oven",
     "appliance": "oven",
     "topic": "Piekarnik Bosch HBA534BB3 – K8, dół",
     "description": "Wymiary: obudowa {a:oven.body.width} × {a:oven.body.height} × {a:oven.body.depth}, front {a:oven.fascia.width} × {a:oven.fascia.height} × {a:oven.fascia.thickness}; oba stoją na półce.\nFront: {f:ovenOnShelfAbove} na półkę nad, po {=(<a:oven.fascia.width> - <k:K8.innerWidth>) / 2} na boki korpusu; półki pod nim nie zakrywa.\nLuz nad obudową: {=<i:K8/oven.space> - <a:oven.body.height>}.\nSzczeliny: do frontu szafki pod {=<i:K8/oven.spaceBottom> - <i:K8/cabinet#1.frontV1>}, do mikrofalówki {f:ovenMicrowaveGap}.",
     "assumed": "Kratka w cokole; półka nad piekarnikiem płytsza o {s:shelf.ventGap}."
    },
    {
     "id": "microwave",
     "appliance": "microwave",
     "topic": "Mikrofalówka Bosch BFL623MB3 – K8, nad piekarnikiem",
     "description": "Wymiary: urządzenie {a:microwave.body.width} × {a:microwave.body.height} × {a:microwave.body.depth} na nóżkach {i:K8/microwave.fit.feet}; front {a:microwave.fascia.width} × {a:microwave.fascia.height} × {a:microwave.fascia.thickness}, {=-<a:microwave.fascia.bottom>} poniżej spodu urządzenia.\nFront: {f:microwaveOnShelfBelow} na półkę pod, {f:microwaveOnShelfAbove} na półkę nad, po {=(<a:microwave.fascia.width> - <k:K8.innerWidth>) / 2} na boki korpusu.\nLuz nad urządzeniem: {=<i:K8/microwave.space> - <i:K8/microwave.fit.feet> - <a:microwave.body.height>}; tył otwarty.\nSzczeliny: do piekarnika {f:ovenMicrowaveGap}, do szafki nad {f:microwaveCabinetGap}.",
     "assumed": "Stoi na półce płytszej o {s:shelf.ventGap}."
    },
    {
     "id": "ovenColumn",
     "topic": "Słupek K8: piekarnik + mikrofalówka",
     "description": "Od półki pod piekarnikiem w górę: piekarnik {a:oven.fascia.height}, szczelina {f:ovenMicrowaveGap}, mikrofalówka {i:K8/microwave.height}, szczelina {f:microwaveCabinetGap}, szafka górna.\nPółka środkowa: {=<i:K8/oven.spaceTop> - <i:K8/oven.spaceBottom>}–{=<i:K8/microwave.spaceBottom> - <i:K8/oven.spaceBottom>}, płytsza o {s:shelf.ventGap}.\nPółka górna: {=<i:K8/microwave.spaceTop> - <i:K8/oven.spaceBottom>}–{=<i:K8/microwave.spaceTop> + <t:carcass> - <i:K8/oven.spaceBottom>}.\nSzafka pod piekarnikiem: {i:K8/cabinet#1.height}.",
     "assumed": "Półki przymierzyć przed zamocowaniem."
    },
    {
     "id": "fridge",
     "appliance": "fridgeFreezer",
     "topic": "Lodówka Bosch KIS86AFE0 – K10",
     "description": "Wymiary: {a:fridgeFreezer.body.width} × {a:fridgeFreezer.body.height} × {a:fridgeFreezer.body.depth}, na dnie korpusu.\nPółka stała: na górze urządzenia, góra lodówki przykręcona do niej; płytsza o {s:shelf.ventGap}.\nZamrażarka: front {i:K10/freezer.frontHeight} na drzwiach {=<a:fridgeFreezer.doors.freezer.top> - <a:fridgeFreezer.doors.freezer.bottom>}; wystaje {=<i:K10/freezer.fit.bodyV0> + <a:fridgeFreezer.doors.freezer.bottom> - <i:K10/freezer.frontV0>} w dół, po {=(<i:K10/freezer.frontWidth> - <a:fridgeFreezer.body.width>) / 2} na boki; drzwi sięgają {=<i:K10/freezer.fit.bodyV0> + <a:fridgeFreezer.doors.freezer.top> - <i:K10/freezer.frontV1>} wyżej.\nLodówka: front {i:K10/fridge.frontHeight} na drzwiach {=<a:fridgeFreezer.doors.fridge.top> - <a:fridgeFreezer.doors.fridge.bottom>}; wystaje {=<i:K10/fridge.fit.bodyV0> + <a:fridgeFreezer.doors.fridge.bottom> - <i:K10/fridge.frontV0>} w dół, {f:fridgeFrontAboveDoor} w górę, po {=(<i:K10/fridge.frontWidth> - <a:fridgeFreezer.body.width>) / 2} na boki.\nSzczelina między frontami: {=<i:K10/fridge.frontV0> - <i:K10/freezer.frontV1>}.",
     "assumed": "Fronty przykręcone do drzwi urządzenia."
    },
    {
     "id": "fridgeAir",
     "topic": "Lodówka – wentylacja",
     "description": "Wlot: kratka w cokole.\nWylot: szczelina {s:shelf.ventGap} za półką stałą nad urządzeniem, {s:carcass.wallGap} za korpusem.",
     "assumed": "Kratka {p:grilles} PLN."
    },
    {
     "id": "dishwasher",
     "appliance": "dishwasher",
     "topic": "Zmywarka Bosch SMV4HVX00E – G1[6]",
     "description": "Wymiary: {a:dishwasher.body.width} × {i:G1[6]/dishwasher.fit.height} × {a:dishwasher.body.depth}, nóżki wykręcone do spodu blatu; drzwi {i:G1[6]/dishwasher.fit.doorHeight}.\nFront {i:G1[6]/dishwasher.frontWidth} × {i:G1[6]/dishwasher.frontHeight}: {=<i:G1[6]/dishwasher.fit.doorV0> - <i:G1[6]/dishwasher.frontV0>} niżej niż drzwi, {=<i:G1[6]/dishwasher.fit.height> - <i:G1[6]/dishwasher.frontV1>} pod ich górą, po {=(<a:dishwasher.body.width> - <i:G1[6]/dishwasher.frontWidth>) / 2} węższy z boków.\nNóżki: {a:dishwasher.baseSetback} za frontem, cokół przed nimi.",
     "decide": "Ciężar frontu: sprawdzić w instrukcji (zawias SMZ5003 do ciężkich frontów)."
    },
    {
     "id": "hob",
     "appliance": "hob",
     "topic": "Płyta grzewcza Electrolux CIT61443 – K1",
     "description": "Wymiary: szkło {a:hob.glass.width} × {a:hob.glass.depth}, korpus {a:hob.body.width} × {a:hob.body.depth} × {a:hob.body.height}.\nWycięcie: {s:cutouts.hob.width} × {s:cutouts.hob.depth}, {s:cutouts.hob.fromBack} od tylnej krawędzi blatu.\nSzkło na blacie: po {=(<a:hob.glass.width> - <s:cutouts.hob.width>) / 2} z boków; {=<s:cutouts.hob.fromBack> - (<a:hob.glass.depth> - <s:cutouts.hob.depth>) / 2} od tylnej, {=<w:1.depth> - <s:cutouts.hob.fromBack> - (<a:hob.glass.depth> + <s:cutouts.hob.depth>) / 2} od przedniej krawędzi blatu.\nPod płytą: trawers przedni {s:rails.hobFront}, tylny {s:rails.depth}; przegroda {m:hobPanel} za przednim trawersem, {s:rails.hobPanelGap} szczeliny z tyłu.",
     "assumed": "Na liście cięć.",
     "decide": "Odstęp korpusu płyty od przegrody: instrukcja, s. 22."
    },
    {
     "id": "sink",
     "appliance": "sink",
     "topic": "Zlew IKEA KILSVIKEN – K2",
     "description": "Wymiary: zlew {a:sink.body.width} × {a:sink.body.depth}, komora {a:sink.bowl.width} × {a:sink.bowl.depth} × {a:sink.bowl.height}.\nWycięcie: {s:cutouts.sink.width} × {s:cutouts.sink.depth}, {s:cutouts.sink.fromBack} od tylnej krawędzi blatu.\nZlew na blacie: rant po {=(<a:sink.body.width> - <s:cutouts.sink.width>) / 2} z boków; {=<s:cutouts.sink.fromBack> - (<a:sink.body.depth> - <s:cutouts.sink.depth>) / 2} od tylnej, {=<w:1.depth> - <s:cutouts.sink.fromBack> - (<a:sink.body.depth> + <s:cutouts.sink.depth>) / 2} od przedniej krawędzi blatu.",
     "assumed": "Wycięcie na liście cięć (BLATY).",
     "decide": "Wycięcie sprawdzić z szablonem IKEA przed CNC."
    },
    {
     "id": "pullOutShelf",
     "topic": "Szafka z ekspresem – półka wysuwana",
     "description": "Półka: gł. {s:pullOutShelf.depth}, {s:pullOutShelf.clearance} luzu z boków, prowadnice Blum MOVENTO.\nPłyta dystansowa po stronie zawiasów: od płyty pod drzwiami do {s:pullOutShelf.spacerAbove} nad półkę; niesie prowadnicę i odsuwa półkę od otwartych drzwi.",
     "assumed": "Prowadnice {p:pullOutShelfRunners} PLN za komplet.",
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
     "description": "Listwy tylne: tak wysokie jak korpusy obok; między korpusami jeden nad drugim {s:frame.bracketSpace} na kątownik.\nKątowniki ({n:wallBrackets}): na górze listwy tylnej; górna listwa w stosie bez kątownika.\nWkręty: listwy do pierwszego korpusu zwykłe, drugi korpus mosiądzowane od środka.\nWyspa stoi wolno.",
     "assumed": "Gazobeton, kołki DuoPower 8."
    },
    {
     "id": "corner",
     "topic": "Narożnik L – korpus narożny",
     "description": "Korpus K3: drzwi, panel {i:K3/panel.width} i ukryte wypełnienie.\nSłupek zawiasowy: {m:carcass}, gł. {s:hinges.postDepth}, niesie zawiasy.\nPanel wpuszczany: za panelem {i:K3/panel.width}, od słupka do boku korpusu.\nPółka: jedna płyta przez cały korpus; słupek ją przecina (widok 3D to zgłasza).\nCokoły grupy 1 i 2: lista cięć podaje obie pełne długości, jeden przyciąć na miejscu.",
     "assumed": "Złącza: jedno opakowanie ({p:connectors} PLN).",
     "decide": "Listwa ścienna pod blatem w narożniku?"
    },
    {
     "id": "framesPanels",
     "topic": "Listwy na sztorc, panele na płasko",
     "description": "Listwy: {m:frame}, na sztorc, gł. {s:frame.depth}; lakierowane obustronnie i krawędź przednia.\nPanele: {m:panel}, na płasko; lakierowane obustronnie.\nABS przy otwieranym froncie: panel {i:K3/panel.width} – {i:K3/panel.edges}; panel {i:G2[3]/panel.width} – {i:G2[3]/panel.edges}; panel tylny wyspy – brak.\nPanel {i:G2[3]/panel.width} zakrywa koniec panelu {i:K3/panel.width}."
    },
    {
     "id": "backStrips",
     "topic": "Listwy tylne za listwami",
     "description": "Za każdą listwą poza korpusem: listwa tylna z {m:carcass}, gł. {s:frame.depth}, długość listwy.",
     "assumed": "Na liście cięć."
    },
    {
     "id": "fixedShelves",
     "topic": "Półki stałe – pełna głębokość",
     "description": "Na styku frontów: pełna głębokość {s:carcass.depth}; półki ruchome krótsze o {s:shelf.setback}.\nNad piekarnikiem: płytsza o {s:shelf.ventGap}.\nPod piekarnikiem: pod stykiem; widać ją w całości po otwarciu szafki pod nią.\nW korpusie lodówki: jedna, na górze urządzenia (góra lodówki przykręcona do niej), płytsza o {s:shelf.ventGap}.",
     "assumed": "Na liście cięć."
    },
    {
     "id": "backs",
     "topic": "Plecy i panel tylny wyspy",
     "description": "Plecy {m:back}: tylko za drzwiami szafek.\nWyspa: panel tylny {m:panel} między panelami końcowymi, od podłogi do góry korpusów."
    },
    {
     "id": "frontSizes",
     "topic": "Wymiary frontów",
     "description": "Front = moduł − 4 szczeliny (notatka „Szczeliny frontów” w design.js).\nNarożna szafka górna na blacie: większa szczelina dolna.",
     "assumed": "Fronty wyceniane za m²."
    },
    {
     "id": "sinkCabinet",
     "topic": "Szafka zlewowa",
     "description": "Dół: szuflada D z 3 koszami, boki {s:drawers.D.sideHeight}; potrzebny syfon oszczędzający miejsce.\nGóra: front atrapa, bez szuflady.",
     "assumed": "Kosze {p:bins} PLN, syfon {p:trap} PLN.",
     "decide": "Odpływ w ścianie ≥ 450 nad podłogą."
    },
    {
     "id": "innerDrawers",
     "topic": "Szuflady wewnętrzne na sztućce (wyspa)",
     "description": "Wyspa, górne szuflady: TANDEMBOX antaro M 500 wewnętrzna, za tym samym frontem.\nFront wewnętrzny Z31L: szerokość wnętrza korpusu − {s:drawers.inner.frontDeduction}.\nDno i tył: {m:drawerBox}, na liście cięć.",
     "assumed": "{n:innerDrawers} szuflady wewnętrzne + {n:innerDrawers} wkłady na sztućce.",
     "decide": "Wysokość tyłu i wkład: konfigurator Blum."
    },
    {
     "id": "doorDrawers",
     "topic": "Szuflady za drzwiami z płyty (K8 i K12, dół)",
     "description": "K8: drzwi {i:K8/doorDrawers.frontWidth} × {i:K8/doorDrawers.frontHeight}, {i:K8/doorDrawers.count} szuflady {i:K8/doorDrawers.boxWidth} × {i:K8/doorDrawers.runnerLength} × {i:K8/doorDrawers.boxHeight}, zawiasy {i:K8/doorDrawers.hinge}.\nK12: drzwi {i:K12/doorDrawers.frontWidth} × {i:K12/doorDrawers.frontHeight}, {i:K12/doorDrawers.count} szuflady {i:K12/doorDrawers.boxWidth} × {i:K12/doorDrawers.runnerLength} × {i:K12/doorDrawers.boxHeight}, zawiasy {i:K12/doorDrawers.hinge}.\nSkrzynki: {m:drawerBox}, prowadnice kulkowe Häfele L = {i:K12/doorDrawers.runnerLength}, {s:doorDrawers.clearance} luzu z każdej strony.\nPłyta dystansowa po stronie zawiasów: kończy się {s:hinges.postDepth} przed przodem korpusu, tak jak skrzynki; szuflady mijają zawiasy i otwarte drzwi.\nBez półek ruchomych za tymi drzwiami.",
     "assumed": "{n:doorDrawers} kpl. prowadnic po {p:ballRunners} PLN.",
     "decide": "Uchwyt szuflad: wycięcie w czole albo gałka.\nBlum zamiast płyty (TANDEMBOX M, {p:innerDrawers} za kpl.): {=ROUND(<f:innerDrawerExtra>)} zł więcej za szufladę, {=ROUND(<f:innerDrawerExtra> * <n:doorDrawers>)} zł razem; boki {s:drawers.M.sideHeight} zamiast {s:doorDrawers.side}; w K12 sprawdzić minimalną szerokość ({=<k:K12.innerWidth> - <t:carcass>}).\nPłyta {m:drawerBox}: {q:drawerBoard} ark., ostatni słabo wykorzystany; skrzynki zmieszczą się w odpadach {m:carcass}."
    },
    {
     "id": "worktops",
     "topic": "Blaty",
     "description": "Grupa 1: blat z jednej płyty {v:worktopBoard.length}.\nWyspa: blat z płyty {v:worktopBoard.islandDepth}, przycięty do {w:3.depth}.\nPanele końcowe: osobny materiał, dwustronny; blat wystaje {s:worktop.endPanelOverhang} z boku, z przodu i w wyspie z tyłu.\nZłącza blatu z panelami: {q:worktopJoints}.\nWycięcia na zlew i płytę: lista cięć (BLATY), CNC w hurtowni.",
     "decide": "Panele końcowe: szukam jeszcze rozwiązania na dąb dwustronny (dekor jak blat, obie strony widoczne)."
    },
    {
     "id": "plaster",
     "topic": "Zabudowa GK",
     "description": "Zabudowa dłuższa niż płyta {v:plasterboard.length}: łączona na miejscu, {s:plasterboard.layers} warstwy, spoiny przesunięte.\nProfile liczone z całkowitej długości; przy docinkach może brakować jednego.",
     "assumed": "{q:plasterboard} płyt, {q:profileCD} CD60, {q:profileUD} UD27."
    }
   ]
  },
  {
   "name": "CENY I ZAKRES",
   "notes": [
    {
     "id": "lacquered",
     "topic": "Części lakierowane",
     "description": "Fronty shaker: {p:fronts} PLN/m², NIESPRAWDZONE (kwota właściciela).\nListwy, panele, cokół: {p:frames} PLN/m² (lakierowane.pl, jedna strona).\nCokół wilgocioodporny; wszystko od jednego producenta, jeden kolor.",
     "decide": "Pisemna oferta na wszystkie części lakierowane, obustronnie."
    },
    {
     "id": "carcassBoard",
     "topic": "{m:carcass} – {q:carcassBoard} ark.",
     "description": "{carcass.m2} m² + {waste|%} odpadu na arkuszach {sheet} m² → {q:carcassBoard} ark."
    },
    {
     "id": "hinges",
     "topic": "Zawiasy",
     "description": "Blum CLIP top BLUMOTION z prowadnikiem 173H7100: wysokość regulowana mimośrodem.\n{n:hinges} szt. po {p:hinges} PLN."
    },
    {
     "id": "sinkTap",
     "topic": "Zlew i bateria",
     "description": "Zlew IKEA KILSVIKEN {a:sink.body.width} × {a:sink.body.depth}, kompozyt kwarcowy, {p:sink} PLN; syfon LILLVIKEN w zestawie.\nBateria Deante Silia BQS_Z73M, {p:tap} PLN, otwór Ø35.\nSyfon oszczędzający miejsce Deante ZXY 9917, {p:trap} PLN (patrz {note:sinkCabinet}).",
     "assumed": "Czarny; syfon IKEA nieużywany.",
     "decide": "Czy syfon IKEA mieści się nad szufladą z koszami? Jeśli tak, bez syfonu Deante."
    },
    {
     "id": "hood",
     "appliance": "hood",
     "topic": "Okap Electrolux LFV416K – tryb pracy",
     "description": "Wyciąg: okap {p:hood} PLN + rura {p:duct} PLN.",
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
     "description": "Patrz widok 3D: dobry dla hokerów, ciasny dla krzeseł."
    },
    {
     "id": "islandSocket",
     "topic": "Gniazdko w wyspie",
     "description": "Nie ma w projekcie; zaplanować przed podłogą."
    },
    {
     "id": "hiddenSides",
     "topic": "Niewidoczne boki korpusów",
     "description": "Zakryte listwami, panelami końcowymi lub ścianą: bez lakierowanych osłon."
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
