/* Kitchen project cost data - read by cost.html. Written for each project (LLM). Plain JSON after "window.KITCHEN_COST =".
   Everything measured comes from design.js through engine.js, the appliance sizes from appliances.js: nothing here repeats
   a calculated number.
     page        tab title, heading, info line, XLSX file name, excluded (what the estimate does not cover)
     params      the inputs above the estimate (waste, sheet size in m², reserve); a value or a formula
     values      fixed numbers of the estimate: stock sizes (sheet, worktop board, plasterboard), allowances
     labels      fronts: the label of a front in the cutting list, by its type and tags (first match; none = its type);
                 sheet: the label of the sheet input; cuttingNote: the text under the cutting list; legend: a remark per
                 hole kind in the drilling legend
     blocks      cutting-list tables, rows built by engine.js: parts = front | frames | plinths | panels | plaster | worktops,
                 or a material use (carcass, drawerBox, back ...: every board of that use's material); cut = priced saw
                 cuts; columns = the header when not Element / Długość / Szerokość / Ilość
     categories  estimate items; appliances = the category counts as AGD, not furniture. An item: id, name, spec,
                 qty (a number or a formula), unit, price, refs (ids of the notes it links to), source, links (the shops
                 of the price [{shop, url}])
     notes       Notes tab, by section; a note: id, appliance (its documents come from appliances.js), topic,
                 description, assumed (in the estimate), decide (open question), links [{name, url}]; \n starts a new line.
                 Notes and sections are numbered in this order.
   Texts and formulas may hold placeholders:
     {n:hinges}        engine count ({n:type.oven}, {n:tag.bins} = items with that type / tag)
     {s:drawers.dFrom} design.js setting     {t:carcass} thickness and {m:cabinet} material label of a board type or part
     {w:1.depth}       worktop of group 1  {k:K8.innerWidth} carcass by name: width, height, innerWidth, v0, v1
     {i:K8/oven.niche} item by carcass name or place (G1[5]) and type or tag, #2 = the second from the bottom:
                       width, height, v0, v1 (module), frontWidth, frontHeight, frontV0, frontV1 (front),
                       nicheBottom, nicheTop, niche (clear height between the horizontal boards of the carcass around it)
     {a:oven.front.1}  appliances.js       {v:sheet.length} values
     {p:hinges}        unit price          {q:hinges} item quantity          {note:hinges} the number of a note
     {carcass.m2}      cutting-list total of a block (m2, edge, cut, len, qty)    {waste} {sheet} {reserve} params
     {=expression}     a calculation with placeholders in angle brackets, e.g. {=(<a:oven.front.0> - <k:K8.innerWidth>) / 2},
                       with ROUND, ROUNDUP, MIN, MAX;  |% shows a fraction as a percentage */
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
  "confirmatsPerCarcass": 18
 },
 "labels": {
  "fronts": [
   {"type": "drawer", "tags": ["dummy"], "function": "front atrapa"},
   {"type": "drawer", "tags": ["bins"], "function": "szuflada zlewowa (kosze)"},
   {"type": "drawer", "function": "szuflada"},
   {"type": "cabinet", "tags": ["fridge", "freezer", "dishwasher"], "function": "front na drzwiach AGD"},
   {"type": "cabinet", "tags": ["pullouts"], "function": "drzwi, za nimi szuflady"},
   {"type": "cabinet", "function": "drzwi"}
  ],
  "sheet": "Arkusz płyty {v:sheet.length}×{v:sheet.width} [m²]",
  "cuttingNote": "Długość = dłuższy bok, Szerokość = krótszy (fronty: wysokość × szerokość, jak potrzebuje producent frontów); wiersze wg elementu, najdłuższe pierwsze. Krawędź = liczba wykończonych krawędzi wzdłuż wymiaru obok (0, 1 lub 2), jak w formularzu hurtowni (np. Bok 1920 | 1 | 550 | 0); ABS na płytach i panelach, lakier na frontach (2 i 2), listwach (krawędź przednia) i cokole (brak). ABS razem = długość ABS × ilość; strona każdej krawędzi ABS jest w zakładce Montaż. Cięcia = (długość + szerokość) × ilość, wyceniane w pozycji Cięcie płyt. Korpus = wszystkie kolumny z jedną nazwą korpusu, głębokość {s:carcass.depth}, {s:carcass.wallGap} od ściany; wnętrze = szerokość − 2 × {t:carcass}; półka ruchoma = wnętrze − 2 × {s:shelf.clearance}, głębokość − {s:shelf.setback}; półka stała = wnętrze × pełna głębokość; plecy {m:back} = korpus − 2 × {s:back.inset}; front = moduł − 4 szczeliny; listwa tylna = {s:frame.depth} × długość listwy; dno szuflady = wnętrze − {s:drawers.bottom.inset} × {s:drawers.bottom.depth}, tył = wnętrze − {s:drawers.back.inset}; tył szuflady wewnętrznej wys. {s:drawers.inner.back}. ABS na częściach korpusu: krawędź widoczna z przodu (boki: długa krawędź przednia; wieńce, półki, trawersy przednie: krawędź przednia; trawersy na sztorc: krawędź dolna); trawersy tylne, listwy tylne, plecy, części szuflad TANDEMBOX, panele wpuszczane: brak; szuflady za drzwiami: górne krawędzie i boki czoła. Panele: ABS na każdej krawędzi przy otwieranym froncie.",
  "legend": {"runner": "pozycje do potwierdzenia wg Blum"}
 },
 "blocks": [
  {"id": "fronts", "title": "FRONTY – {m:cabinet}, shaker, lakierowane dookoła", "columns": ["Funkcja", "Wysokość", "Szerokość", "Ilość"]},
  {"id": "frames", "title": "LISTWY – {m:frame} na sztorc, gł. {s:frame.depth}, lakierowane obustronnie i krawędź przednia"},
  {"id": "plinths", "title": "COKÓŁ – {m:plinth}, wilgocioodporny, lakierowany obustronnie"},
  {"id": "panels", "title": "PANELE – {m:panel} na płasko, lakierowane obustronnie; ABS na widocznych krawędziach"},
  {
   "id": "carcass",
   "title": "KORPUSY – wszystkie części z {m:carcass}: cięcie + ABS 0,8 na krawędziach przednich (z listwami tylnymi, półką wysuwaną, słupkami zawiasowymi, panelami wpuszczanymi, płytami dystansowymi)",
   "cut": true
  },
  {
   "id": "drawerBox",
   "title": "SZUFLADY – wszystkie części z {m:drawerBox}: dna i tyły TANDEMBOX (z szufladami wewnętrznymi), szuflady za drzwiami i przegroda pod płytą",
   "cut": true
  },
  {"id": "back", "title": "PLECY – {m:back}, tylko za drzwiami szafek"},
  {"id": "worktops", "title": "BLATY – {m:worktop} (blat), {m:islandWorktop} (wyspa): blaty i boki blatu; wycięcia na zlew (ZL) i płytę (PG) wg legendy"},
  {"id": "plaster", "title": "ZABUDOWA GK – GKBI 12,5 na CD60 / UD27, gł. {s:plasterboard.depth} (zabudowa do sufitu, grupa 2)"}
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
      {"shop": "ogony.pl", "url": "https://ogony.pl/products/shaker-front-ikea"},
      {"shop": "fronty.com.pl", "url": "https://fronty.com.pl/pl/p/Art.-301-Front-lakierowany/76"},
      {"shop": "zakupynawymiar.pl", "url": "https://zakupynawymiar.pl/pl/p/front-F2-lakierowany-na-wymiar-/2967"},
      {"shop": "gama-sklep.com.pl", "url": "https://www.gama-sklep.com.pl/item/front-kuchenny-mdf-lakierowany-profil-b-269976"},
      {"shop": "frontlakierowany.pl", "url": "https://frontlakierowany.pl/#cennik"},
      {"shop": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}
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
     "links": [{"shop": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
    },
    {
     "id": "plinth",
     "name": "Cokół: {m:plinth}",
     "spec": "MDF wilgocioodporny, lakierowany obustronnie",
     "qty": "={plinths.m2}",
     "unit": "m²",
     "price": 332.1,
     "refs": ["lacquered", "corner"],
     "source": "MDF gładki 18, mat: 270 netto/m² (jedna strona; druga strona: zapytać)",
     "links": [{"shop": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
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
     "links": [{"shop": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"}]
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
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-U708-ST9-2800x2070x18MM-Szary-jasny/2219"}]
    },
    {
     "id": "drawerBoard",
     "name": "{m:drawerBox}",
     "spec": "dna i tyły szuflad, szuflady za drzwiami, przegroda pod płytą",
     "qty": "=ROUNDUP({drawerBox.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 344.40,
     "source": "Bielsko-Biała",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/PLYTA-U708-ST9-2800x2070x16MM-Szary-jasny/2190"}]
    },
    {
     "id": "backBoard",
     "name": "{m:back}",
     "spec": "plecy za drzwiami szafek, arkusz {v:sheet.length}×{v:sheet.width}",
     "qty": "=ROUNDUP({back.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 124.32,
     "source": "Bielsko-Biała",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/HDF-SZARY-LAKIEROWANY-2800x2070x3.0MM/2804"}]
    },
    {
     "id": "cutting",
     "name": "Cięcie płyt",
     "spec": "cięcia {m:carcass} + {m:drawerBox}, wg listy cięć",
     "qty": "={carcass.cut}+{drawerBox.cut}",
     "unit": "mb",
     "price": 5,
     "source": "M-HM - cena do potwierdzenia; szacunek wg ciecieoklejanie.pl (płyty 3–20 mm)",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/i/Uslugi/16"}, {"shop": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"}]
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
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/i/Uslugi/16"},
      {"shop": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"},
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/OBRZEZE-ABS-U708-ST9-230.8MM-Szary-jasny/1146"}
     ]
    },
    {
     "id": "panelEdging",
     "name": "Oklejanie paneli, kolor {m:panel}",
     "spec": "krawędzie paneli wg sumy ABS z listy cięć + {v:edgeAllowance|%}",
     "qty": "={panels.edge}*(1+{v:edgeAllowance})",
     "unit": "mb",
     "price": 6,
     "refs": ["framesPanels"],
     "source": "panele robi producent frontów (lakierowane.pl) - zapytać o oklejanie; szacunek wg ciecieoklejanie.pl; obrzeże granatowe dobrane do lakieru",
     "links": [
      {"shop": "lakierowane.pl", "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"},
      {"shop": "ciecieoklejanie.pl", "url": "https://ciecieoklejanie.pl/cennik/"}
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
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/CLIP-top-BLUMOTION-Zawias-110%2C-Drzwi-nakladane%2C-puszka-na-wkrety-71B3550/2253"},
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/CLIP-prowadnik%2C-krzyzakowy%2C-00-mm%2C-Stal%2C-Wkrety%2C-RW-mimosrod-173H7100/1376"}
     ]
    },
    {
     "id": "pullOutRunners",
     "name": "Prowadnice Blum MOVENTO 760H5000S + sprzęgła T51.7601",
     "spec": "podszafkowe, pełny wysuw, 500, 40 kg, do półki wysuwanej; półka na liście cięć {m:carcass}",
     "qty": "={n:pullOutShelves}",
     "unit": "kpl.",
     "price": 151.28,
     "refs": ["pullOutShelf"],
     "source": "prowadnice 136,36 + sprzęgła 2 × 7,46 (meblownia: 121,84)",
     "links": [
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/MOVENTO-z-BLUMOTION-S%2C-40-kg%2C-L500-mm%2C-lewaprawa-760H5000S/2312"},
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Lewe-z-regulacja-boczna-T51.7601-LEWE/3109"},
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Prawe-z-regulacja-boczna-T51.7601-PRAWE/3110"}
     ]
    },
    {
     "id": "drawersD",
     "name": "TANDEMBOX antaro D 500 szary, 30 kg, z relingiem",
     "spec": "front > {s:drawers.dFrom}: dolne szuflady z szufladą zlewową; bez dna, tyłu i frontu",
     "qty": "={n:drawersD}",
     "unit": "kpl.",
     "price": 169.05,
     "refs": ["sinkCabinet"],
     "source": "",
     "links": [{"shop": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-d-z-relingiem-szara-30-kg.html"}]
    },
    {
     "id": "drawersM",
     "name": "TANDEMBOX antaro M 500 szary, 30 kg",
     "spec": "front ≤ {s:drawers.dFrom}; boki 378M5002SA, prowadnice 578.5001M, wsporniki",
     "qty": "={n:drawersM}",
     "unit": "kpl.",
     "price": 136.39,
     "source": "",
     "links": [{"shop": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-m-szara-30-kg.html"}]
    },
    {
     "id": "innerDrawers",
     "name": "TANDEMBOX antaro szuflada wewnętrzna M 500 szara, 30 kg",
     "spec": "na sztućce, za górnym frontem; front wewnętrzny Z31L przycięty do LW − {s:drawers.inner.frontDeduction}",
     "qty": "={n:innerDrawers}",
     "unit": "kpl.",
     "price": 207.81,
     "refs": ["innerDrawers"],
     "source": "szare boki 378M5002SA, prowadnice 578.5001M, front wewnętrzny Z31L1036A",
     "links": [{"shop": "meblownia.pl", "url": "https://meblownia.pl/blum-szuflada-wewnetrzna-tandembox-antaro-500-m-biala-30-kg-19272.html"}]
    },
    {
     "id": "pulloutRunners",
     "name": "Prowadnice kulkowe GTV H45, pełny wysuw, 30 kg (PK-0H45450HK), komplet L + P",
     "spec": "do szuflad za drzwiami; L = {i:K12/pullouts.runner}, {s:pullouts.runner.gap} na stronę; szuflady z {m:drawerBox} na liście cięć",
     "qty": "={n:pullouts}",
     "unit": "kpl.",
     "price": 17.44,
     "refs": ["pullouts"],
     "source": "zamiast szuflad wewnętrznych Blum ({p:innerDrawers} za szufladę)",
     "links": [{"shop": "meblownia.pl", "url": "https://meblownia.pl/gtv-prowadnica-pelny-wys-l-450-hk-pk-oh45450kh.html"}]
    },
    {
     "id": "cutleryTrays",
     "name": "Wkład na sztućce Hettich OrgaTray 440 9195001, antracyt, gł. 441–520 / szer. 701–800",
     "spec": "zamówić: kolor antracyt, głębokość 441–520 (prowadnice 500), szerokość 701–800 (korpus {k:K14.width}); wys. 55",
     "qty": "={n:innerDrawers}",
     "unit": "szt.",
     "price": 128.56,
     "refs": ["innerDrawers"],
     "source": "zamiast Blum ORGA-LINE ZSI.80VEI6 (495,25); na zamówienie 3–10 dni rob.",
     "links": [{"shop": "akcesoriameble24.pl", "url": "https://akcesoriameble24.pl/product/wklad-orgatray-440-hettich-do-szuflady/"}]
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
     "links": [{"shop": "amix.pl", "url": "https://amix.pl/pl/segregatory-rubio/2000-rubio-80-3x15"}]
    },
    {
     "id": "handles",
     "name": "Uchwyt IKEA ENERYDA, kolor mosiądzu, 89 mm (706.108.37), opak. 2 szt.",
     "spec": "1 na front; rozstaw otworów 64",
     "qty": "=ROUNDUP({n:handles}/2,0)",
     "unit": "op.",
     "price": 20,
     "source": "",
     "links": [{"shop": "ikea.com/pl", "url": "https://www.ikea.com/pl/pl/p/eneryda-uchwyt-kolor-mosiadzu-70610837/"}]
    },
    {
     "id": "legs",
     "name": "Nóżka Häfele AXILO H 150 (140–170) 637.76.355 + klips cokołu przykręcany 637.38.054",
     "spec": "{s:carcass.legs} na korpus stojący, cofnięte za cokół",
     "qty": "={n:legs}",
     "unit": "szt.",
     "price": 4.33,
     "source": "nóżka 3,23 + klips 1,10; regulacja kluczem od frontu przez cokół",
     "links": [
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/AXILO-Nozka-meblowa-H-150-mm-140-170mm-637.76.355/2210"},
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/AXILO%2CHE-Zatrzask-Klips-do-cokolu-do-przykrecania-do-nozki-637.38.054/2195"}
     ]
    },
    {
     "id": "shelfPins",
     "name": "Podpórki półek ocynk Ø5 z tuleją plastikową, opak. 100 szt.",
     "spec": "{s:shelf.pins} na półkę ruchomą",
     "qty": "=ROUNDUP({n:shelfPins}/100,0)",
     "unit": "op.",
     "price": 8.4,
     "source": "",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Podporka-polki-ocynk-fi5-z-tuleja-plastikowa-opak100-szt./4482"}]
    },
    {
     "id": "confirmats",
     "name": "Konfirmaty 6,4 × 50, ocynk biały, opak. 1000 szt.",
     "spec": "ok. {v:confirmatsPerCarcass} na korpus ({n:carcasses} korpusów); wiertło do konfirmatów 6,4 (nie 7)",
     "qty": 1,
     "unit": "op.",
     "price": 119.39,
     "source": "w M-HM tylko 6,4 × 50 po 1000 szt.; meblownia 7 × 50: 12,57 za 100",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Konfirmat-M-6.4-x-50-OC.BIALY-opak1000-szt./4511"}]
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
     "links": [{"shop": "g-s.com.pl", "url": "https://g-s.com.pl/zlacze-skrecane-meblowe-fi-5-m4-nikiel.html"}]
    },
    {
     "id": "wallHangers",
     "name": "Zawieszka szafki CAMAR 807, kpl. L+P",
     "spec": "korpusy stojące mocowane do ściany (bez wyspy)",
     "qty": "={n:wallFixedCarcasses}",
     "unit": "kpl.",
     "price": 26.44,
     "source": "2 × 13,22 (L + P)",
     "links": [
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/CAMAR-807-Zawieszka-meblowa-do-szafek-dolnych-na-wcisk-udzwig-240kgpare-Lewa-290.40.902/1755"},
      {"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/CAMAR-807-Zawieszka-meblowa-do-szafek-dolnych-na-wcisk-udzwig-240kgpare-Prawa-290.40.901/1754"}
     ]
    },
    {
     "id": "brackets",
     "name": "Kątowniki 20×20×16, opak. 10 szt.",
     "spec": "mocowanie frontów atrap",
     "qty": "={n:tag.dummy}",
     "unit": "op.",
     "price": 6,
     "source": "sprzedawca Lun Fix",
     "links": [{"shop": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/katownik-meblowy-20x20x16x1-5-10szt-74065876.html"}]
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
       "shop": "leroymerlin.pl",
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
     "spec": "blat grupy 1 + bok blatu z 1 płyty, przycięty do {w:1.depth}; prosta krawędź Egger 100/1.5",
     "qty": 1,
     "unit": "szt.",
     "price": 1201.01,
     "refs": ["worktops"],
     "source": "M-HM Bielsko-Biała, duża ilość; cięcie i oklejanie ABS 43/1,5 H1180 - zapytać o cenę (tel. 720 890 335)",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x650x38MM-Dab-Halifax-naturalny/1313"}]
    },
    {
     "id": "islandWorktop",
     "name": "{m:islandWorktop}, {v:worktopBoard.islandDepth} × {v:worktopBoard.length} × {t:islandWorktop}",
     "spec": "blat wyspy ({w:3.depth}) + 2 boki blatu z 1 płyty; prosta krawędź Egger 100/1.5; tylna krawędź po przycięciu do oklejenia",
     "qty": 1,
     "unit": "szt.",
     "price": 2056.93,
     "refs": ["worktops"],
     "source": "M-HM Bielsko-Biała, duża ilość; cięcie i oklejanie ABS 43/1,5 H1180 - zapytać o cenę (tel. 720 890 335)",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x920x38MM-Dab-Halifax-naturalny/1259"}]
    },
    {
     "id": "worktopEdging",
     "name": "Obrzeże ABS-H1180 ST37 43/1,5 Dąb Halifax naturalny",
     "spec": "do blatów: przód blatów, tył blatu wyspy, krawędzie boków blatu",
     "qty": 12,
     "unit": "m",
     "price": 10.1,
     "refs": ["worktops"],
     "source": "blaty Egger 100/1.5 bez obrzeża; oklejanie maszynowe - zapytać M-HM",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/OBRZEZE-ABS-H1180-ST37-431.5MM-Dab-Halifax-naturalny/1401"}]
    },
    {
     "id": "splash",
     "name": "Panel ścienny {m:splash}, arkusz {v:sheet.length} × {v:sheet.width} × {t:splash}",
     "spec": "grupa 1, przy oknie: jeden pas",
     "qty": 1,
     "unit": "ark.",
     "price": 695.29,
     "source": "płyta 18 mm (M-HM Bielsko-Biała ma tylko 18,6); bez wysyłki",
     "links": [{"shop": "wiprumia.pl", "url": "https://wiprumia.pl/produkt/plyta-18-mm-dab-halifax-nat-h1180-st37/"}]
    },
    {
     "id": "worktopJoints",
     "name": "Złącze do blatów ZŁM-26 L-100",
     "spec": "blat z bokami blatu",
     "qty": 6,
     "unit": "szt.",
     "price": 3.3,
     "refs": ["worktops"],
     "source": "",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/ZLACZE-DO-BLATOW-ZLM-26-L-100MM/500"}]
    },
    {
     "id": "silicone",
     "name": "Silikon sanitarny biały 300 ml",
     "spec": "blat do ściany, zlew",
     "qty": 2,
     "unit": "szt.",
     "price": 25.0,
     "source": "",
     "links": [{"shop": "m-hm.pl", "url": "https://m-hm.pl/pl/p/Silikon-SANITARNY-BIALY-300ML/3100"}]
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
       "shop": "castorama.pl",
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
     "links": [{"shop": "castorama.pl", "url": "https://www.castorama.pl/profil-sufitowy-budmat-cd60-0-5-mm-3-m/5907595734011_CAPL.prd"}]
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
     "links": [{"shop": "castorama.pl", "url": "https://www.castorama.pl/profil-budmat-ud27-3-m/5907738940163_CAPL.prd"}]
    },
    {
     "id": "jointFiller",
     "name": "Masa szpachlowa Knauf Uniflott, 5 kg",
     "spec": "spoiny i narożniki",
     "qty": 1,
     "unit": "szt.",
     "price": 31.29,
     "source": "",
     "links": [{"shop": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/masa-szpachlowa-uniflott-5-kg-knauf-43360653.html"}]
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
       "shop": "castorama.pl",
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
     "links": [{"shop": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/wkret-do-plyt-g-k-3-5-x-9-5-mm-250-szt-standers-45530233.html"}]
    },
    {
     "id": "anchors",
     "name": "Kołki szybkiego montażu 6 × 40",
     "spec": "profile UD do ściany i sufitu",
     "qty": 1,
     "unit": "op.",
     "price": 14.29,
     "source": "sprzedawca Robimet",
     "links": [{"shop": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/kolki-szybkie-montazu-6x40-mm-standers-45746715.html"}]
    },
    {
     "id": "jointTape",
     "name": "Taśma spoinowa 50 mm × 25 m",
     "spec": "spoiny płyt",
     "qty": 1,
     "unit": "szt.",
     "price": 8.99,
     "source": "",
     "links": [{"shop": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/tasma-fizelinowa-50-mm-25-mb-82738326.html"}]
    },
    {
     "id": "cornerBead",
     "name": "Narożnik aluminiowy Rigips 23,5 × 23,5, 3 m",
     "spec": "zewnętrzne krawędzie zabudów GK",
     "qty": "=ROUNDUP({n:plasterEdge}/3000,0)",
     "unit": "szt.",
     "price": 9.67,
     "source": "",
     "links": [{"shop": "sklep.sewera.pl", "url": "https://sklep.sewera.pl/naroznik-aluminiowy-23-5x23-5mm-3m-rigips-p7500"}]
    },
    {
     "id": "seal",
     "name": "Uszczelka silikonowa T, biała, wciskana",
     "spec": "szczelina między GK a meblami (3–5)",
     "qty": "=ROUNDUP({n:plasterEdge}/1000*(1+{v:edgeAllowance}),0)",
     "unit": "mb",
     "price": 21.53,
     "source": "sprawdzić rozmiar do szczeliny",
     "links": [{"shop": "centrumuszczelek.pl", "url": "https://centrumuszczelek.pl/uszczelka-typu-t/uszczelka-silikonowa-biala-wciskana-typ-t-0995462-6199"}]
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
     "spec": "komora 66 × 40 × 18; syfon LILLVIKEN, sitko i pokrywa w zestawie",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 1279,
     "refs": ["sink", "sinkTap"],
     "source": "",
     "links": [{"shop": "ikea.com/pl", "url": "https://www.ikea.com/pl/pl/p/kilsviken-zlew-wpuszczany-1-komora-czarny-kompozyt-kwarcowy-s29337025/"}]
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
     "links": [{"shop": "sklep.deante.pl", "url": "https://sklep.deante.pl/pl/Syfon-do-zlewozmywaka-granitowego-1-komorowego-Space-Saver/ZXY-9917"}]
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
       "shop": "mediaexpert.pl",
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
     "spec": "do zabudowy {a:fridge.body.1}, zawias płaski",
     "qty": "={n:fridges}",
     "unit": "szt.",
     "price": 3949,
     "refs": ["fridge", "fridgeAir"],
     "source": "",
     "links": [{"shop": "leroymerlin.pl", "url": "https://www.leroymerlin.pl/produkty/lodowka-do-zabudowy-kis86afe0-bosch-82744412.html"}]
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
     "links": [{"shop": "oleole.pl", "url": "https://www.oleole.pl/zmywarki-do-zabudowy/bosch-zmywarka-smv4hvx00e-bosch.bhtml"}]
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
     "links": [{"shop": "neonet.pl", "url": "https://www.neonet.pl/plyty-do-zabudowy/electrolux-cit61443.html"}]
    },
    {
     "id": "oven",
     "name": "Piekarnik Bosch Serie 4 HBA534BB3",
     "spec": "wys. {a:oven.front.1}, czarny, 71 l",
     "qty": "={n:type.oven}",
     "unit": "szt.",
     "price": 1899,
     "refs": ["oven", "ovenColumn"],
     "source": "RTV EURO AGD i OleOle!",
     "links": [
      {"shop": "okazje.info.pl", "url": "https://www.okazje.info.pl/szukaj/bosch-serie-4-hba534bb3-termoobieg-czarny-piekarnik-elektryczny/ceny.html"}
     ]
    },
    {
     "id": "micro",
     "name": "Mikrofalówka Bosch BFL623MB3",
     "spec": "do zabudowy, nad piekarnikiem",
     "qty": "={n:type.micro}",
     "unit": "szt.",
     "price": 999,
     "refs": ["micro", "ovenColumn"],
     "source": "",
     "links": [{"shop": "oleole.pl", "url": "https://www.oleole.pl/kuchenki-mikrofalowe-do-zabudowy/bosch-bfl623mb3.bhtml"}]
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
     "links": [{"shop": "mediaexpert.pl", "url": "https://www.mediaexpert.pl/agd-do-zabudowy/okapy-do-zabudowy/okap-electrolux-lfv416k"}]
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
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/rura-odprowadzajaca-aluminiowa-wentylacyjna-150-mm-2-7-mb-equation-40418021.html"
      }
     ]
    }
   ]
  }
 ],
 "notes": [
  {
   "section": "AGD – WYMIARY I DOPASOWANIE DO KORPUSÓW (mm; szer. × wys. × gł.)",
   "notes": [
    {
     "id": "oven",
     "appliance": "oven",
     "topic": "Piekarnik Bosch HBA534BB3 – K8, dół",
     "description": "Obudowa {a:oven.body.0} × {a:oven.body.1} × {a:oven.body.2} i front {a:oven.front.0} × {a:oven.front.1} × {a:oven.projection} stoją na półce; front kończy się {=<a:oven.front.1> - <a:oven.body.1>} nad obudową.\nFront zachodzi: {=<a:oven.front.1> - <i:K8/oven.niche>} na półkę nad, po {=(<a:oven.front.0> - <k:K8.innerWidth>) / 2} na boki korpusu; na półkę pod nie zachodzi.\nWnęka {i:K8/oven.niche} × {k:K8.innerWidth} × {s:carcass.depth}; nad obudową {=<i:K8/oven.niche> - <a:oven.body.1>} luzu.\nPółka pod piekarnikiem leży pod złączem, za frontem szafki pod nim: po otwarciu tego frontu widać ją w całości. Szczelina między frontem szafki a frontem piekarnika {=<i:K8/oven.nicheBottom> - <i:K8/cabinet#1.frontV1>}; do frontu mikrofalówki {=<i:K8/micro.v0> - <i:K8/oven.nicheBottom> - <a:oven.front.1>}.",
     "assumed": "Kratka w cokole ({p:grilles} PLN), półka nad piekarnikiem płytsza o {s:shelf.ventGap}."
    },
    {
     "id": "micro",
     "appliance": "micro",
     "topic": "Mikrofalówka Bosch BFL623MB3 – K8, nad piekarnikiem",
     "description": "Urządzenie {a:micro.body.0} × {a:micro.body.1} × {a:micro.body.2} na regulowanych nóżkach {=((<i:K8/micro.v0> + <i:K8/micro.v1> - <a:micro.front.1>) / 2 - <a:micro.frontBottom> - <i:K8/micro.nicheBottom>)}; front {a:micro.front.0} × {a:micro.front.1} × {a:micro.projection} ({=-<a:micro.frontBottom>} poniżej spodu urządzenia).\nFront zachodzi: {=<i:K8/micro.nicheBottom> - <i:K8/micro.v0>} na półkę pod, {=<i:K8/micro.v1> - <i:K8/micro.nicheTop>} na półkę nad ({=<i:K8/micro.nicheBottom> - <i:K8/micro.v0>} + {i:K8/micro.niche} + {=<i:K8/micro.v1> - <i:K8/micro.nicheTop>} = {i:K8/micro.height}), po {=(<a:micro.front.0> - <k:K8.innerWidth>) / 2} na boki korpusu.\nWnęka {i:K8/micro.niche} × {k:K8.innerWidth} × {s:carcass.depth}; tył otwarty; nad urządzeniem {=<i:K8/micro.niche> - (((<i:K8/micro.v0> + <i:K8/micro.v1> - <a:micro.front.1>) / 2 - <a:micro.frontBottom> - <i:K8/micro.nicheBottom>)) - <a:micro.body.1>} luzu.\nSzczelina do frontu piekarnika {=<i:K8/micro.v0> - <i:K8/oven.nicheBottom> - <a:oven.front.1>}; front szafki nad: szczelina {=<i:K8/cabinet#2.frontV0> - <i:K8/micro.v1>} nad frontem mikrofalówki, zachodzi {=<i:K8/micro.nicheTop> + <t:carcass> - <i:K8/cabinet#2.frontV0>} na tę samą półkę.",
     "assumed": "Stoi na półce płytszej o {s:shelf.ventGap}; nóżki ustawione na 4.",
     "decide": "Rysunek Bosch (szafka wysoka) pokazuje 35 wolnego za korpusem; półka nad mikrofalówką sięga do {s:carcass.wallGap} od ściany – sprawdzić, czy wystarczy."
    },
    {
     "id": "ovenColumn",
     "topic": "Słupek K8: piekarnik + mikrofalówka",
     "description": "Od podstawy piekarnika: {a:oven.front.1} piekarnik (ostatnie {=<a:oven.front.1> - <i:K8/oven.niche>} na półce środkowej), {=<i:K8/micro.v0> - <i:K8/oven.nicheBottom> - <a:oven.front.1>} szczeliny, {=<i:K8/micro.nicheBottom> - <i:K8/micro.v0>} mikrofalówka na półce środkowej, {i:K8/micro.niche} mikrofalówka, {=<i:K8/micro.v1> - <i:K8/micro.nicheTop>} mikrofalówka na półce górnej, {=<i:K8/cabinet#2.frontV0> - <i:K8/micro.v1>} szczeliny, {=<i:K8/micro.nicheTop> + <t:carcass> - <i:K8/cabinet#2.frontV0>} szafka górna na półce górnej.\nPółka środkowa {=<i:K8/oven.nicheTop> - <i:K8/oven.nicheBottom>}–{=<i:K8/micro.nicheBottom> - <i:K8/oven.nicheBottom>} (płytsza o {s:shelf.ventGap}), półka górna {=<i:K8/micro.nicheTop> - <i:K8/oven.nicheBottom>}–{=<i:K8/micro.nicheTop> + <t:carcass> - <i:K8/oven.nicheBottom>}; szafka pod piekarnikiem {i:K8/cabinet#1.height} (front = korpus), szafka górna od {=<i:K8/cabinet#2.v0> - <i:K8/oven.nicheBottom>}.\nWnęki: piekarnik {i:K8/oven.niche}, mikrofalówka {i:K8/micro.niche}.",
     "assumed": "Półki przymierzyć na miejscu przed zamocowaniem."
    },
    {
     "id": "fridge",
     "appliance": "fridge",
     "topic": "Lodówka Bosch KIS86AFE0 – K10",
     "description": "Urządzenie {a:fridge.body.0} × {a:fridge.body.1} × {a:fridge.body.2} na dnie korpusu; nad nim {=<i:K10/fridge.niche> - <a:fridge.body.1>} luzu.\nWnęka {i:K10/fridge.niche} × {k:K10.innerWidth} × {s:carcass.depth} (Bosch {a:fridge.niche.h.0}), zamknięta półką stałą nad urządzeniem, płytszą o {s:shelf.ventGap}.\nZamrażarka: front {i:K10/freezer.frontHeight} na drzwiach {=<a:fridge.freezerDoor.1> - <a:fridge.freezerDoor.0>} – wystaje {=<i:K10/freezer.nicheBottom> + <a:fridge.freezerDoor.0> - <i:K10/freezer.frontV0>} w dół, po {=(<i:K10/freezer.frontWidth> - <a:fridge.body.0>) / 2} na boki; góra drzwi {=<i:K10/freezer.nicheBottom> + <a:fridge.freezerDoor.1> - <i:K10/freezer.frontV1>} wyżej niż front ({a:fridge.freezerDoor.1} + {t:carcass} = {=<a:fridge.freezerDoor.1> + <t:carcass>}), widać krawędź drzwi w szczelinie.\nLodówka: front {i:K10/fridge.frontHeight} na drzwiach {=<a:fridge.fridgeDoor.1> - <a:fridge.fridgeDoor.0>} – wystaje {=<i:K10/fridge.nicheBottom> + <a:fridge.fridgeDoor.0> - <i:K10/fridge.frontV0>} w dół, {=<i:K10/fridge.frontV1> - <i:K10/fridge.nicheBottom> - <a:fridge.fridgeDoor.1>} w górę, po {=(<i:K10/fridge.frontWidth> - <a:fridge.body.0>) / 2} na boki.\nSzczelina między frontami {=<i:K10/fridge.frontV0> - <i:K10/freezer.frontV1>}; fronty przykręcone do drzwi urządzenia.",
     "assumed": "Front lodówki wystaje {=<i:K10/fridge.frontV1> - <i:K10/fridge.nicheBottom> - <a:fridge.fridgeDoor.1>} nad drzwi urządzenia – normalne w tej zabudowie."
    },
    {
     "id": "fridgeAir",
     "topic": "Lodówka – wentylacja",
     "description": "Wlot: kratka w cokole pod lodówką. Wylot: {=<i:K10/fridge.niche> - <a:fridge.body.1>} nad urządzeniem, przez szczelinę {s:shelf.ventGap} za półką nad lodówką, i {s:carcass.wallGap} za korpusem.",
     "assumed": "Kratka {p:grilles} PLN."
    },
    {
     "id": "dishwasher",
     "appliance": "dishwasher",
     "topic": "Zmywarka Bosch SMV4HVX00E – G1[5]",
     "description": "Urządzenie {a:dishwasher.body.0} × {=MIN(<a:dishwasher.body.1> + <a:dishwasher.feet>, MAX(<a:dishwasher.body.1>, <w:1.v0>))} × {a:dishwasher.body.2}, nóżki wykręcone do spodu blatu; drzwi {=ROUND((<a:dishwasher.door.0> + (<a:dishwasher.door.1> - <a:dishwasher.door.0>) * (MIN(<a:dishwasher.body.1> + <a:dishwasher.feet>, MAX(<a:dishwasher.body.1>, <w:1.v0>)) - <a:dishwasher.body.1>) / <a:dishwasher.feet>))}.\nWnęka {w:1.v0} × {i:G1[5]/dishwasher.width} × {s:carcass.depth}.\nFront {i:G1[5]/dishwasher.frontWidth} × {i:G1[5]/dishwasher.frontHeight}: sięga {=ROUND(MIN(<a:dishwasher.body.1> + <a:dishwasher.feet>, MAX(<a:dishwasher.body.1>, <w:1.v0>)) - (<a:dishwasher.door.0> + (<a:dishwasher.door.1> - <a:dishwasher.door.0>) * (MIN(<a:dishwasher.body.1> + <a:dishwasher.feet>, MAX(<a:dishwasher.body.1>, <w:1.v0>)) - <a:dishwasher.body.1>) / <a:dishwasher.feet>) - <i:G1[5]/dishwasher.frontV0>)} niżej niż drzwi, kończy się {=MIN(<a:dishwasher.body.1> + <a:dishwasher.feet>, MAX(<a:dishwasher.body.1>, <w:1.v0>)) - <i:G1[5]/dishwasher.frontV1>} pod ich górą, po {=(<a:dishwasher.body.0> - <i:G1[5]/dishwasher.frontWidth>) / 2} węższy z boków.\nNóżki {a:dishwasher.baseSetback} za frontem, cokół przed nimi.",
     "decide": "Ciężar frontu: sprawdzić w instrukcji (Bosch ma zawias SMZ5003 do ciężkich frontów)."
    },
    {
     "id": "hob",
     "appliance": "hob",
     "topic": "Płyta grzewcza Electrolux CIT61443 – K1",
     "description": "Szkło {a:hob.glass.0} × {a:hob.glass.1}; korpus {a:hob.body.0} × {a:hob.body.1} × {a:hob.body.2} w wycięciu {s:cutouts.hob.width} × {s:cutouts.hob.depth}, {s:cutouts.hob.fromBack} od tylnej krawędzi blatu.\nSzkło zachodzi na blat po {=(<a:hob.glass.0> - <s:cutouts.hob.width>) / 2} z każdej strony; {=<s:cutouts.hob.fromBack> - (<a:hob.glass.1> - <s:cutouts.hob.depth>) / 2} od tylnej i {=<w:1.depth> - <s:cutouts.hob.fromBack> - (<a:hob.glass.1> + <s:cutouts.hob.depth>) / 2} od przedniej krawędzi blatu.\nPod płytą: trawers przedni {t:carcass} × {s:rails.hobFront}, tylny {t:carcass} × {s:rails.depth}; przegroda {m:hobPanel} pod przednim trawersem, {s:rails.hobPanelGap} szczeliny z tyłu.",
     "assumed": "Na liście cięć.",
     "decide": "Odstęp korpusu płyty od przegrody: sprawdzić w instrukcji (s. 22)."
    },
    {
     "id": "sink",
     "appliance": "sink",
     "topic": "Zlew IKEA KILSVIKEN – K2",
     "description": "Zlew {a:sink.outer.0} × {a:sink.outer.1}, komora {a:sink.bowl.0} × {a:sink.bowl.1} × {a:sink.bowl.2}; wycięcie {s:cutouts.sink.width} × {s:cutouts.sink.depth}, {s:cutouts.sink.fromBack} od tylnej krawędzi blatu.\nRant zachodzi na blat po {=(<a:sink.outer.0> - <s:cutouts.sink.width>) / 2}; zlew {=<s:cutouts.sink.fromBack> - (<a:sink.outer.1> - <s:cutouts.sink.depth>) / 2} od tylnej i {=<w:1.depth> - <s:cutouts.sink.fromBack> - (<a:sink.outer.1> + <s:cutouts.sink.depth>) / 2} od przedniej krawędzi blatu.",
     "assumed": "Wycięcie w liście cięć (blok BLATY).",
     "decide": "Wycięcie sprawdzić z szablonem IKEA przed CNC."
    },
    {
     "id": "pullOutShelf",
     "topic": "Szafka z ekspresem – półka wysuwana",
     "description": "Półka gł. {s:pullOutShelf.depth}, {s:pullOutShelf.clearance} luzu z każdej strony, na prowadnicach podszafkowych Blum MOVENTO (są pod półką, więc luz boczny wystarcza). Otwarte drzwi (zawiasy 110°) nie mogą blokować półki.",
     "assumed": "Prowadnice {p:pullOutRunners} PLN za komplet.",
     "decide": "Plan wierceń prowadnic pod półką (Blum)."
    }
   ]
  },
  {
   "section": "KONSTRUKCJA",
   "notes": [
    {
     "id": "corner",
     "topic": "Narożnik L – korpus narożny",
     "description": "Jeden korpus (K3) za drzwiami, panelem {i:K3/panel.width} i ukrytym wypełnieniem. Dwie części niestandardowe z {m:carcass}: słupek zawiasowy, gł. {s:hinges.supportDepth}, przy krawędzi zawiasowej drzwi, niesie zawiasy; panel wpuszczany, tuż za panelem {i:K3/panel.width}, zamyka front korpusu od słupka do drugiego boku (panel {i:K3/panel.width} + wypełnienie − jeden bok). Półka to jedna zwykła płyta przez cały korpus; słupek zawiasowy ją przecina (zgłaszane w widoku 3D). Blat na korpusie i na listwach tylnych; korpusy skręcone. Cokoły grupy 1 i 2 spotykają się w narożniku: lista cięć podaje obie pełne długości, jeden przyciąć na miejscu.",
     "assumed": "Złącza: jedno opakowanie ({p:connectors} PLN).",
     "decide": "Listwa ścienna pod blatem w narożniku?"
    },
    {
     "id": "framesPanels",
     "topic": "Listwy na sztorc, panele na płasko",
     "description": "Listwy: {m:frame} na sztorc, gł. {s:frame.depth}, lakierowane obustronnie i krawędź przednia. Panele: {m:panel} na płasko, lakierowane obustronnie; ABS w kolorze panelu na krawędzi przy otwieranym froncie (panel {i:K3/panel.width}: lewa krawędź, przy drzwiach; panel {i:G2[3]/panel.width} i panel tylny wyspy: brak). Panel {i:G2[3]/panel.width} zakrywa koniec panelu {i:K3/panel.width}."
    },
    {
     "id": "backStrips",
     "topic": "Listwy tylne za listwami",
     "description": "Każda listwa poza korpusem: listwa z {m:carcass} na sztorc, gł. {s:frame.depth}, długość listwy.",
     "assumed": "Na liście cięć."
    },
    {
     "id": "fixedShelves",
     "topic": "Półki stałe – pełna głębokość",
     "description": "Na styku 2 frontów: pełna głębokość korpusu {s:carcass.depth}, więc oba fronty się o nią zamykają; półki ruchome są o {s:shelf.setback} krótsze. Przy piekarniku: półka nad nim płytsza o {s:shelf.ventGap}, półka pod nim pod złączem: front piekarnika na nią nie zachodzi, po otwarciu frontu szafki pod nią widać ją w całości. Przy lodówce: tylko półka nad urządzeniem, wnęka {s:shelf.fridgeNiche}, płytsza o {s:shelf.ventGap}.",
     "assumed": "Na liście cięć."
    },
    {
     "id": "backs",
     "topic": "Plecy i panel tylny wyspy",
     "description": "Plecy {m:back} tylko za drzwiami szafek (powietrze dla piekarnika, mikrofalówki, lodówki). Wyspa: panel tylny {m:panel} między bokami blatu, od podłogi do góry korpusów, na plecach korpusów."
    },
    {
     "id": "frontSizes",
     "topic": "Wymiary frontów",
     "description": "Front = moduł − 4 szczeliny (lewa, prawa, góra, dół), dla każdego frontu w design.js; wartości w notatce „Szczeliny frontów”. Narożna szafka górna na blacie ma większą szczelinę dolną nad blatem.",
     "assumed": "Fronty wyceniane za m²."
    },
    {
     "id": "sinkCabinet",
     "topic": "Szafka zlewowa",
     "description": "Dół: szuflada D z 3 koszami; wymaga syfonu oszczędzającego miejsce (płaski korpus przy tylnej ścianie, odpływ nad szufladą, boki {s:drawers.D.side}). Góra: front atrapa, bez szuflady.",
     "assumed": "Kosze {p:bins} PLN, syfon {p:trap} PLN.",
     "decide": "Odpływ w ścianie ≥ 450 nad podłogą."
    },
    {
     "id": "innerDrawers",
     "topic": "Szuflady wewnętrzne na sztućce (wyspa)",
     "description": "Górne szuflady wyspy: TANDEMBOX antaro szuflada wewnętrzna M 500 za górnym frontem, własne prowadnice; zamknięcie frontu zamyka ją. Front wewnętrzny Z31L przycięty do LW − {s:drawers.inner.frontDeduction} (LW = szerokość wnętrza korpusu). Dno i tył na liście cięć ({m:drawerBox}). Bez szuflady wewnętrznej pod płytą.",
     "assumed": "{n:innerDrawers} szuflady wewnętrzne + {n:innerDrawers} wkłady na sztućce.",
     "decide": "Wysokość tyłu i dopasowanie wkładu: konfigurator Blum."
    },
    {
     "id": "pullouts",
     "topic": "Szuflady za drzwiami z płyty (K12, dół)",
     "description": "Za drzwiami {i:K12/pullouts.frontHeight} × {i:K12/pullouts.frontWidth}: {i:K12/pullouts.count} szuflady z {m:drawerBox} na prowadnicach kulkowych L = {i:K12/pullouts.runner}; skrzynka {i:K12/pullouts.boxWidth} × {i:K12/pullouts.runner} × {i:K12/pullouts.boxHeight} (czoło na całą skrzynkę zakrywa boki i dno, dno i tył między bokami; ABS na górnych krawędziach i bokach czoła), {s:pullouts.runner.gap} luzu na prowadnicę z każdej strony.\nZawiasy zajmują {s:hinges.supportDepth} przy przodzie korpusu (jak słupek zawiasowy): po stronie zawiasów płyta dystansowa z {m:carcass} ({t:carcass}) od pleców do {s:hinges.supportDepth} przed przodem korpusu niesie prowadnicę, a skrzynki zaczynają się na tej samej głębokości. Szuflada mija ramię zawiasu i otwarte drzwi o {t:carcass} + {s:pullouts.runner.gap}; drzwi zamykają się przed szufladami.\nBez półek ruchomych w tej części korpusu.",
     "assumed": "{n:pullouts} kompletów prowadnic po {p:pulloutRunners} PLN zamiast {p:innerDrawers} PLN za szufladę Blum.",
     "decide": "Uchwyt szuflad: wycięcie w czole albo gałka."
    },
    {
     "id": "worktops",
     "topic": "Blaty",
     "description": "Blat grupy 1 + bok z jednej płyty {v:worktopBoard.length}; blat wyspy + 2 boki z jednej płyty {v:worktopBoard.islandDepth}, przycięty do {w:3.depth}. Blat stoi na bokach (łączenie na styk), {q:worktopJoints} złącza. Wycięcia na zlew i płytę: wymiary i położenie w liście cięć (blok BLATY, kolumna Wiercenie / wycięcia) – do zlecenia w hurtowni (CNC); wymiar otworu zlewu sprawdzić z szablonem IKEA."
    },
    {
     "id": "plaster",
     "topic": "Zabudowa GK",
     "description": "Zabudowa do sufitu jest dłuższa niż jedna płyta {v:plasterboard.length}: łączone i docinane na miejscu, {s:plasterboard.layers} warstwy, spoiny przesunięte. Profile liczone z całkowitej długości; przy docinkach może być potrzebny jeden więcej.",
     "assumed": "{q:plasterboard} płyt, {q:profileCD} CD60, {q:profileUD} UD27."
    }
   ]
  },
  {
   "section": "CENY I ZAKRES",
   "notes": [
    {
     "id": "lacquered",
     "topic": "Części lakierowane",
     "description": "Fronty shaker {p:fronts} PLN/m², obustronnie: NIESPRAWDZONE (kwota właściciela, brak oferty sklepu). Części gładkie – listwy, panele, cokół – {p:frames} PLN/m² (lakierowane.pl, jedna strona; zapytać o drugą). Cokół musi być wilgocioodporny. Wszystkie części lakierowane od jednego producenta, dla jednego koloru.",
     "decide": "Pisemna oferta na wszystkie części lakierowane, obustronnie, od jednego producenta."
    },
    {
     "id": "carcassBoard",
     "topic": "{m:carcass} – {q:carcassBoard} ark.",
     "description": "{carcass.m2} m² + {waste|%} odpadu na arkuszach {sheet} m² → {q:carcassBoard} ark."
    },
    {
     "id": "hinges",
     "topic": "Zawiasy",
     "description": "Blum CLIP top BLUMOTION z prowadnikiem 173H7100: wysokość regulowana mimośrodem przy zawieszonych drzwiach, bez luzowania wkrętów. {p:hinges} PLN za szt., {n:hinges} zawiasów."
    },
    {
     "id": "sinkTap",
     "topic": "Zlew i bateria",
     "description": "IKEA KILSVIKEN 72 × 46, komora 66 × 40 × 18, kompozyt kwarcowy, {p:sink} PLN; wymaga szafki 80; syfon LILLVIKEN i pokrywa w zestawie. Bateria Deante Silia BQS_Z73M, {p:tap} PLN, otwór Ø35. Syfon oszczędzający miejsce Deante ZXY 9917, {p:trap} PLN (patrz {note:sinkCabinet}).",
     "assumed": "Czarny; syfon IKEA nieużywany.",
     "decide": "Czy syfon IKEA mieści się nad szufladą z koszami? Jeśli tak, zrezygnować z syfonu Deante."
    },
    {
     "id": "hood",
     "topic": "Okap Electrolux LFV416K – tryb pracy",
     "description": "Wyciąg: okap {p:hood} PLN + rura {p:duct} PLN.",
     "decide": "Wyciąg czy pochłaniacz (filtr węglowy, poza kosztorysem)?"
    },
    {
     "id": "excluded",
     "topic": "Poza kosztorysem",
     "description": "Robocizna, transport, elektryka, hydraulika, prace GK (materiały GK są w kosztorysie): lista pod kosztorysem."
    }
   ]
  },
  {
   "section": "DO WIADOMOŚCI",
   "notes": [
    {"id": "islandOverhang", "topic": "Nawis blatu wyspy od strony hokerów", "description": "Patrz widok 3D: dobry dla hokerów, ciasny dla krzeseł."},
    {"id": "islandSocket", "topic": "Gniazdko w wyspie", "description": "Nie ma w projekcie; zaplanować przed podłogą."},
    {
     "id": "hiddenSides",
     "topic": "Niewidoczne boki korpusów",
     "description": "Zakryte listwami, bokami blatu lub ścianą: bez lakierowanych paneli bocznych."
    },
    {
     "id": "summary",
     "topic": "Podsumowanie",
     "description": "{n:carcasses} korpusów, {n:fronts} frontów, {n:hinges} zawiasów, szuflady {n:drawersD} D + {n:drawersM} M + {n:innerDrawers} wewnętrzne, {n:handles} uchwytów, {n:legs} nóżek, półki {n:shelvesAdjustable} ruchome + {n:shelvesFixed} stałe."
    }
   ]
  }
 ]
};
