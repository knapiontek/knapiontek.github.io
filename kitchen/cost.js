/* Kitchen project cost data - read by cost.html (prices, items, notes, page settings; the format is described in cost.html).
   Plain JSON after "window.KITCHEN_COST =". Written for each project. */
window.KITCHEN_COST = {
 "settings": {
  "xlsxFile": "kosztorys_kuchnia_jaworze.xlsx",
  "frontFunctions": [
   {
    "type": "drawer",
    "tags": "dummy",
    "function": "front atrapa"
   },
   {
    "type": "drawer",
    "tags": "bins",
    "function": "szuflada zlewowa (kosze)"
   },
   {
    "type": "drawer",
    "function": "szuflada"
   },
   {
    "type": "cabinet",
    "tags": "fridge|freezer|dishwasher",
    "function": "front na drzwiach AGD"
   },
   {
    "type": "cabinet",
    "function": "drzwi"
   }
  ],
  "cutBlocks": [
   "carcass",
   "drawerBox"
  ],
  "applianceCategories": [
   "AGD"
  ],
  "legendNotes": {
   "runner": "pozycje do potwierdzenia wg Blum"
  },
  "sheetLabel": "Arkusz płyty {v:sheetLength}×{v:sheetWidth} [m²]",
  "cuttingNote": "Długość = dłuższy bok, Szerokość = krótszy (fronty: wysokość × szerokość, jak potrzebuje producent frontów); wiersze wg elementu, najdłuższe pierwsze. Krawędź = liczba wykończonych krawędzi wzdłuż wymiaru obok (0, 1 lub 2), jak w formularzu hurtowni (np. Bok 1920 | 1 | 550 | 0); ABS na płytach i panelach, lakier na frontach (2 i 2), listwach (krawędź przednia) i cokole (brak). ABS razem = długość ABS × ilość; strona każdej krawędzi ABS jest w zakładce Montaż. Cięcia = (długość + szerokość) × ilość, wyceniane w pozycji Cięcie płyt. Korpus = wszystkie kolumny z jedną nazwą korpusu, głębokość {r:carcass.depth}, {r:carcass.wallGap} od ściany; wnętrze = szerokość − 2 × {t:carcass}; półka ruchoma = wnętrze − 2 × {r:shelf.clearance}, głębokość − {r:shelf.setback}; półka stała = wnętrze × pełna głębokość; plecy {m:back} = korpus − 2 × {r:back.inset}; front = moduł − 4 szczeliny; listwa tylna = {r:frame.depth} × długość listwy; dno szuflady = wnętrze − {r:drawers.bottom.inset} × {r:drawers.bottom.depth}, tył = wnętrze − {r:drawers.back.inset}; tył szuflady wewnętrznej wys. {r:drawers.inner.back}. ABS na częściach korpusu: krawędź widoczna z przodu (boki: długa krawędź przednia; wieńce, półki, trawersy przednie: krawędź przednia; trawersy na sztorc: krawędź dolna); trawersy tylne, listwy tylne, plecy, części szuflad, panele wpuszczane: brak. Panele: ABS na każdej krawędzi przy otwieranym froncie."
 },
 "pageTitle": "Kosztorys kuchni Jaworze",
 "title": "Kosztorys materiałów – Kuchnia Jaworze (grupa 1+2 w L, wyspa grupa 3)",
 "info": "PLN brutto, ceny sklepów internetowych z października 2026 (każda pozycja ma link do sklepu), tylko materiały (montaż własny). Niebieskie pola można zmieniać, by sprawdzić inne ceny do odświeżenia strony; stałe ceny wpisuje się w dane kosztorysu na tej stronie. Ilości z formułą pochodzą z design.js.",
 "params": {
  "waste": 0.15,
  "sheet": "={v:sheetLength}*{v:sheetWidth}/1000000",
  "reserve": 0.05
 },
 "blocks": [
  {
   "id": "front",
   "title": "FRONTY – {m:cabinet}, shaker, lakierowane dookoła",
   "columns": [
    "Funkcja",
    "Wysokość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "front"
  },
  {
   "id": "bar",
   "title": "LISTWY – {m:frame} na sztorc, gł. {r:frame.depth}, lakierowane obustronnie i krawędź przednia",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "frames"
  },
  {
   "id": "plinth",
   "title": "COKÓŁ – {m:plinth}, wilgocioodporny, lakierowany obustronnie",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "plinths"
  },
  {
   "id": "panel",
   "title": "PANELE – {m:panel} na płasko, lakierowane obustronnie; ABS na widocznych krawędziach",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "panels"
  },
  {
   "id": "carcass",
   "title": "KORPUSY – wszystkie części z {m:carcass}: cięcie + ABS 0,8 na krawędziach przednich (z listwami tylnymi, półką wysuwaną, słupkami zawiasowymi, panelami wpuszczanymi)",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "carcass"
  },
  {
   "id": "drawerBox",
   "title": "SZUFLADY – wszystkie części z {m:drawerBox}: dna i tyły TANDEMBOX (z szufladami wewnętrznymi) i przegroda pod płytą",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "drawerBox"
  },
  {
   "id": "back",
   "title": "PLECY – {m:back}, tylko za drzwiami szafek",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "back"
  },
  {
   "id": "worktop",
   "title": "BLATY – {m:worktop}: blaty i boki blatu; wycięcia na zlew (ZL) i płytę (PG) wg legendy",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "worktops"
  },
  {
   "id": "plaster",
   "title": "ZABUDOWA GK – GKBI 12,5 na CD60 / UD27, gł. {r:plasterboard.depth} (zabudowa do sufitu, grupa 2)",
   "columns": [
    "Element",
    "Długość",
    "Szerokość",
    "Ilość"
   ],
   "rows": [],
   "parts": "plaster"
  }
 ],
 "categories": [
  {
   "name": "Fronty, listwy i cokół",
   "items": [
    {
     "id": "i1",
     "name": "Fronty: {m:cabinet}",
     "spec": "wg listy cięć; MDF {t:cabinet}, lakierowane dookoła",
     "qty": "={front.m2}",
     "unit": "m²",
     "price": 720,
     "source": "NIESPRAWDZONE – kwota właściciela. Ceny katalogowe online: ogony.pl 990 + 400 (2. strona), fronty.com.pl 820, zakupynawymiar.pl 796 (1 strona), gama-sklep 699 (1 strona), frontlakierowany.pl 630 netto + 70 % (2. strona), lakierowane.pl 370 netto (1 strona)",
     "links": [
      {
       "shop": "ogony.pl",
       "url": "https://ogony.pl/products/shaker-front-ikea"
      },
      {
       "shop": "fronty.com.pl",
       "url": "https://fronty.com.pl/pl/p/Art.-301-Front-lakierowany/76"
      },
      {
       "shop": "zakupynawymiar.pl",
       "url": "https://zakupynawymiar.pl/pl/p/front-F2-lakierowany-na-wymiar-/2967"
      },
      {
       "shop": "gama-sklep.com.pl",
       "url": "https://www.gama-sklep.com.pl/item/front-kuchenny-mdf-lakierowany-profil-b-269976"
      },
      {
       "shop": "frontlakierowany.pl",
       "url": "https://frontlakierowany.pl/#cennik"
      },
      {
       "shop": "lakierowane.pl",
       "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"
      }
     ],
     "refs": [
      "20"
     ]
    },
    {
     "id": "i2",
     "name": "Listwy na sztorc: {m:frame}",
     "spec": "gł. {r:frame.depth}; lakierowane obustronnie i krawędź przednia",
     "qty": "={bar.m2}",
     "unit": "m²",
     "price": 332.1,
     "source": "MDF gładki 18, mat: 270 netto/m² (jedna strona; druga strona: zapytać)",
     "links": [
      {
       "shop": "lakierowane.pl",
       "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"
      }
     ],
     "refs": [
      "11",
      "20"
     ]
    },
    {
     "id": "i3",
     "name": "Cokół: {m:plinth}",
     "spec": "MDF wilgocioodporny, lakierowany obustronnie",
     "qty": "={plinth.m2}",
     "unit": "m²",
     "price": 332.1,
     "source": "MDF gładki 18, mat: 270 netto/m² (jedna strona; druga strona: zapytać)",
     "links": [
      {
       "shop": "lakierowane.pl",
       "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"
      }
     ],
     "refs": [
      "20",
      "10"
     ]
    },
    {
     "id": "i4",
     "name": "Panele na płasko: {m:panel}",
     "spec": "lakierowane obustronnie; narożnik L, panel tylny wyspy",
     "qty": "={panel.m2}",
     "unit": "m²",
     "price": 332.1,
     "source": "MDF gładki 18, mat: 270 netto/m² (jedna strona; druga strona: zapytać)",
     "links": [
      {
       "shop": "lakierowane.pl",
       "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"
      }
     ],
     "refs": [
      "20",
      "28"
     ]
    }
   ]
  },
  {
   "name": "Korpusy",
   "items": [
    {
     "id": "i5",
     "name": "{m:carcass}",
     "spec": "arkusz {v:sheetLength}×{v:sheetWidth}, + odpad",
     "qty": "=ROUNDUP({carcass.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 329.44,
     "source": "Bielsko-Biała",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/PLYTA-U963-ST9-2800x2070x18MM-Szary-diamentowy/2224"
      }
     ],
     "refs": [
      "21"
     ]
    },
    {
     "id": "i6",
     "name": "{m:drawerBox}",
     "spec": "dna i tyły szuflad, przegroda pod płytą",
     "qty": "=ROUNDUP({drawerBox.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 392.74,
     "source": "Bielsko-Biała",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/PLYTA-U963U963-ST9-2800x2070x16MM-Szary-diamentowy/2419"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i7",
     "name": "{m:back}",
     "spec": "plecy za drzwiami szafek, arkusz {v:sheetLength}×{v:sheetWidth}",
     "qty": "=ROUNDUP({back.m2}*(1+{waste})/{sheet},0)",
     "unit": "ark.",
     "price": 124.32,
     "source": "Bielsko-Biała",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/HDF-SZARY-LAKIEROWANY-2800x2070x3.0MM/2804"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i8",
     "name": "Cięcie płyt",
     "spec": "cięcia {m:carcass} + {m:drawerBox}, wg listy cięć",
     "qty": "={carcass.cut}+{drawerBox.cut}",
     "unit": "mb",
     "price": 5,
     "source": "M-HM - cena do potwierdzenia; szacunek wg ciecieoklejanie.pl (płyty 3–20 mm)",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/i/Uslugi/16"
      },
      {
       "shop": "ciecieoklejanie.pl",
       "url": "https://ciecieoklejanie.pl/cennik/"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i9",
     "name": "Oklejanie ABS 0,8, Egger U963 ST9 szary diamentowy (dekor korpusu)",
     "spec": "krawędzie korpusów wg sumy ABS z listy cięć + {v:edgeAllowance|%}",
     "qty": "={carcass.edge}*(1+{v:edgeAllowance})",
     "unit": "mb",
     "price": 6,
     "source": "M-HM - cena do potwierdzenia; szacunek wg ciecieoklejanie.pl (usługa oklejania, płyty 10–18 mm, 6/mb z obrzeżem (samo obrzeże U963 ST9 23/0,8: 2,48/mb))",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/i/Uslugi/16"
      },
      {
       "shop": "ciecieoklejanie.pl",
       "url": "https://ciecieoklejanie.pl/cennik/"
      },
      {
       "shop": "belladlamebli.com",
       "url": "https://belladlamebli.com/pozostale/5507-absb-obrzeze-u963-st9-szary-diamentowy-23-0-8.html"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i57",
     "name": "Oklejanie paneli, kolor {m:panel}",
     "spec": "krawędzie paneli wg sumy ABS z listy cięć + {v:edgeAllowance|%}",
     "qty": "={panel.edge}*(1+{v:edgeAllowance})",
     "unit": "mb",
     "price": 6,
     "source": "panele robi producent frontów (lakierowane.pl) - zapytać o oklejanie; szacunek wg ciecieoklejanie.pl; obrzeże granatowe dobrane do lakieru",
     "links": [
      {
       "shop": "lakierowane.pl",
       "url": "https://lakierowane.pl/informacje,cennik_frontow_lakierowanych,2,1.html"
      },
      {
       "shop": "ciecieoklejanie.pl",
       "url": "https://ciecieoklejanie.pl/cennik/"
      }
     ],
     "refs": [
      "11"
     ]
    }
   ]
  },
  {
   "name": "Okucia (system Blum)",
   "items": [
    {
     "id": "i10",
     "name": "Zawias Blum CLIP top BLUMOTION 110° 71B3550 + prowadnik 173H7100 (mimośród)",
     "spec": "nakładany, puszka Ø{r:drilling.cup.diameter}; prowadnik 0 mm z mimośrodową regulacją wysokości ±2; na drzwi wg wysokości frontu (rules.hinges)",
     "qty": "={n:hinges}",
     "unit": "szt.",
     "price": 16.73,
     "source": "zawias 14,25 + prowadnik 2,48 (meblownia: 11,53 + 2,00)",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/CLIP-top-BLUMOTION-Zawias-110%2C-Drzwi-nakladane%2C-puszka-na-wkrety-71B3550/2253"
      },
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/CLIP-prowadnik%2C-krzyzakowy%2C-00-mm%2C-Stal%2C-Wkrety%2C-RW-mimosrod-173H7100/1376"
      }
     ],
     "refs": [
      "22"
     ]
    },
    {
     "id": "i56",
     "name": "Prowadnice Blum MOVENTO 760H5000S + sprzęgła T51.7601",
     "spec": "podszafkowe, pełny wysuw, 500, 40 kg, do półki wysuwanej; półka na liście cięć {m:carcass}",
     "qty": "={n:pullOutShelves}",
     "unit": "kpl.",
     "price": 151.28,
     "source": "prowadnice 136,36 + sprzęgła 2 × 7,46 (meblownia: 121,84)",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/MOVENTO-z-BLUMOTION-S%2C-40-kg%2C-L500-mm%2C-lewaprawa-760H5000S/2312"
      },
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Lewe-z-regulacja-boczna-T51.7601-LEWE/3109"
      },
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/MOVENTO-Sprzeglo-Prawe-z-regulacja-boczna-T51.7601-PRAWE/3110"
      }
     ],
     "refs": [
      "9"
     ]
    },
    {
     "id": "i11",
     "name": "TANDEMBOX antaro D 500 szary, 30 kg, z relingiem",
     "spec": "front > {r:drawers.dFrom}: dolne szuflady z szufladą zlewową; bez dna, tyłu i frontu",
     "qty": "={n:drawersD}",
     "unit": "kpl.",
     "price": 169.05,
     "source": "",
     "links": [
      {
       "shop": "meblownia.pl",
       "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-d-z-relingiem-szara-30-kg.html"
      }
     ],
     "refs": [
      "16"
     ]
    },
    {
     "id": "i12",
     "name": "TANDEMBOX antaro M 500 szary, 30 kg",
     "spec": "front ≤ {r:drawers.dFrom}; boki 378M5002SA, prowadnice 578.5001M, wsporniki",
     "qty": "={n:drawersM}",
     "unit": "kpl.",
     "price": 136.39,
     "source": "",
     "links": [
      {
       "shop": "meblownia.pl",
       "url": "https://meblownia.pl/blum-szuflada-tandembox-antaro-500-m-szara-30-kg.html"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i36",
     "name": "TANDEMBOX antaro szuflada wewnętrzna M 500 szara, 30 kg",
     "spec": "na sztućce, za górnym frontem; front wewnętrzny Z31L przycięty do LW − {r:drawers.inner.frontDeduction}",
     "qty": "={n:innerDrawers}",
     "unit": "kpl.",
     "price": 207.81,
     "source": "szare boki 378M5002SA, prowadnice 578.5001M, front wewnętrzny Z31L1036A",
     "links": [
      {
       "shop": "meblownia.pl",
       "url": "https://meblownia.pl/blum-szuflada-wewnetrzna-tandembox-antaro-500-m-biala-30-kg-19272.html"
      }
     ],
     "refs": [
      "17"
     ]
    },
    {
     "id": "i37",
     "name": "Wkład na sztućce Hettich OrgaTray 440 9195001, antracyt, gł. 441–520 / szer. 701–800",
     "spec": "zamówić: kolor antracyt, głębokość 441–520 (prowadnice 500), szerokość 701–800 (korpus {k:K14.width}); wys. 55",
     "qty": "={n:innerDrawers}",
     "unit": "szt.",
     "price": 128.56,
     "source": "zamiast Blum ORGA-LINE ZSI.80VEI6 (495,25); na zamówienie 3–10 dni rob.",
     "links": [
      {
       "shop": "akcesoriameble24.pl",
       "url": "https://akcesoriameble24.pl/product/wklad-orgatray-440-hettich-do-szuflady/"
      }
     ],
     "refs": [
      "17"
     ]
    },
    {
     "id": "i38",
     "name": "Kosz do segregacji Amix RUBIO-80/3x15L",
     "spec": "3 × 15 l w szufladzie zlewowej (D, NL 500)",
     "qty": "={n:tag.bins}",
     "unit": "kpl.",
     "price": 129.25,
     "source": "",
     "links": [
      {
       "shop": "amix.pl",
       "url": "https://amix.pl/pl/segregatory-rubio/2000-rubio-80-3x15"
      }
     ],
     "refs": [
      "16"
     ]
    },
    {
     "id": "i13",
     "name": "Uchwyt IKEA ENERYDA, kolor mosiądzu, 89 mm (706.108.37), opak. 2 szt.",
     "spec": "1 na front; rozstaw otworów 64",
     "qty": "=ROUNDUP({n:handles}/2,0)",
     "unit": "op.",
     "price": 20,
     "source": "",
     "links": [
      {
       "shop": "ikea.com/pl",
       "url": "https://www.ikea.com/pl/pl/p/eneryda-uchwyt-kolor-mosiadzu-70610837/"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "legs",
     "name": "Nóżka Häfele AXILO H 150 (140–170) 637.76.355 + klips cokołu przykręcany 637.38.054",
     "spec": "{r:legsPerCarcass} na korpus stojący, cofnięte za cokół",
     "qty": "={n:legs}",
     "unit": "szt.",
     "price": 4.33,
     "source": "nóżka 3,23 + klips 1,10; regulacja kluczem od frontu przez cokół",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/AXILO-Nozka-meblowa-H-150-mm-140-170mm-637.76.355/2210"
      },
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/AXILO%2CHE-Zatrzask-Klips-do-cokolu-do-przykrecania-do-nozki-637.38.054/2195"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i16",
     "name": "Podpórki półek ocynk Ø5 z tuleją plastikową, opak. 100 szt.",
     "spec": "{r:shelf.pins} na półkę ruchomą",
     "qty": "=ROUNDUP({n:shelfPins}/100,0)",
     "unit": "op.",
     "price": 8.4,
     "source": "",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/Podporka-polki-ocynk-fi5-z-tuleja-plastikowa-opak100-szt./4482"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i17",
     "name": "Konfirmaty 6,4 × 50, ocynk biały, opak. 1000 szt.",
     "spec": "ok. {v:confirmatPerCarcass} na korpus ({n:carcasses} korpusów); wiertło do konfirmatów 6,4 (nie 7)",
     "qty": 1,
     "unit": "op.",
     "price": 119.39,
     "source": "w M-HM tylko 6,4 × 50 po 1000 szt.; meblownia 7 × 50: 12,57 za 100",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/Konfirmat-M-6.4-x-50-OC.BIALY-opak1000-szt./4511"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i18",
     "name": "Złącza skręcane Ø5 M4, nikiel, opak. 100 szt.",
     "spec": "skręcanie korpusów, z narożnikiem L",
     "qty": 1,
     "unit": "op.",
     "price": 29.52,
     "source": "",
     "links": [
      {
       "shop": "g-s.com.pl",
       "url": "https://g-s.com.pl/zlacze-skrecane-meblowe-fi-5-m4-nikiel.html"
      }
     ],
     "refs": [
      "10"
     ]
    },
    {
     "id": "i58",
     "name": "Zawieszka szafki CAMAR 807, kpl. L+P",
     "spec": "korpusy stojące mocowane do ściany (bez wyspy)",
     "qty": "={n:wallFixedCarcasses}",
     "unit": "kpl.",
     "price": 26.44,
     "source": "2 × 13,22 (L + P)",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/CAMAR-807-Zawieszka-meblowa-do-szafek-dolnych-na-wcisk-udzwig-240kgpare-Lewa-290.40.902/1755"
      },
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/CAMAR-807-Zawieszka-meblowa-do-szafek-dolnych-na-wcisk-udzwig-240kgpare-Prawa-290.40.901/1754"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i19",
     "name": "Kątowniki 20×20×16, opak. 10 szt.",
     "spec": "mocowanie frontów atrap",
     "qty": "={n:tag.dummy}",
     "unit": "op.",
     "price": 6,
     "source": "sprzedawca Lun Fix",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/katownik-meblowy-20x20x16x1-5-10szt-74065876.html"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i20",
     "name": "Kratka cokołowa GTV 480 × 60, aluminium srebrna",
     "spec": "pod słupkiem lodówki i pod słupkiem piekarnika (Bosch: 200 cm² w cokole); węższa niż wnętrze korpusu",
     "qty": "={n:grilles}",
     "unit": "szt.",
     "price": 33.99,
     "source": "",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/kratka-wentylacyjna-do-mebli-480-x-60-mm-aluminiowa-srebrna-gtv-42083426.html"
      }
     ],
     "refs": [
      "1",
      "5"
     ]
    }
   ]
  },
  {
   "name": "Blaty i panel ścienny",
   "items": [
    {
     "id": "i22",
     "name": "{m:worktop}, {v:worktopBoardDepth} × {v:worktopLength} × {t:worktop}",
     "spec": "blat grupy 1 + bok blatu z 1 płyty, przycięty do {w:1.depth}; prosta krawędź Egger 100/1.5",
     "qty": 1,
     "unit": "szt.",
     "price": 1201.01,
     "source": "M-HM Bielsko-Biała, duża ilość; cięcie i oklejanie ABS 43/1,5 H1180 - zapytać o cenę (tel. 720 890 335)",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x650x38MM-Dab-Halifax-naturalny/1313"
      }
     ],
     "refs": [
      "18"
     ]
    },
    {
     "id": "i23",
     "name": "{m:worktop}, {v:islandBoardDepth} × {v:worktopLength} × {t:worktop}",
     "spec": "blat wyspy ({w:3.depth}) + 2 boki blatu z 1 płyty; prosta krawędź Egger 100/1.5; tylna krawędź po przycięciu do oklejenia",
     "qty": 1,
     "unit": "szt.",
     "price": 2056.93,
     "source": "M-HM Bielsko-Biała, duża ilość; cięcie i oklejanie ABS 43/1,5 H1180 - zapytać o cenę (tel. 720 890 335)",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/BLAT-H1180-ST37-4100x920x38MM-Dab-Halifax-naturalny/1259"
      }
     ],
     "refs": [
      "18"
     ]
    },
    {
     "id": "i64",
     "name": "Obrzeże ABS-H1180 ST37 43/1,5 Dąb Halifax naturalny",
     "spec": "do blatów: przód blatów, tył blatu wyspy, krawędzie boków blatu",
     "qty": 12,
     "unit": "m",
     "price": 10.10,
     "source": "blaty Egger 100/1.5 bez obrzeża; oklejanie maszynowe - zapytać M-HM",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/OBRZEZE-ABS-H1180-ST37-431.5MM-Dab-Halifax-naturalny/1401"
      }
     ],
     "refs": [
      "18"
     ]
    },
    {
     "id": "i24",
     "name": "Panel ścienny {m:splash}, arkusz {v:sheetLength} × {v:sheetWidth} × {t:splash}",
     "spec": "grupa 1, przy oknie: jeden pas",
     "qty": 1,
     "unit": "ark.",
     "price": 695.29,
     "source": "płyta 18 mm (M-HM Bielsko-Biała ma tylko 18,6); bez wysyłki",
     "links": [
      {
       "shop": "wiprumia.pl",
       "url": "https://wiprumia.pl/produkt/plyta-18-mm-dab-halifax-nat-h1180-st37/"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i25",
     "name": "Złącze do blatów ZŁM-26 L-100",
     "spec": "blat z bokami blatu",
     "qty": 6,
     "unit": "szt.",
     "price": 3.3,
     "source": "",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/ZLACZE-DO-BLATOW-ZLM-26-L-100MM/500"
      }
     ],
     "refs": [
      "18"
     ]
    },
    {
     "id": "i59",
     "name": "Silikon sanitarny biały 300 ml",
     "spec": "blat do ściany, zlew",
     "qty": 2,
     "unit": "szt.",
     "price": 25.0,
     "source": "",
     "links": [
      {
       "shop": "m-hm.pl",
       "url": "https://m-hm.pl/pl/p/Silikon-SANITARNY-BIALY-300ML/3100"
      }
     ],
     "refs": [
     ]
    }
   ]
  },
  {
   "name": "Zabudowa GK (grupa 2)",
   "items": [
    {
     "id": "i50",
     "name": "Płyta GK Norgips GKBI H2 12,5, {v:plasterWidth}×{v:plasterLength}",
     "spec": "czoło + bok każdej zabudowy × {r:plasterboard.layers} warstwy, + {waste|%} odpadu",
     "qty": "=ROUNDUP({plaster.m2}*{r:plasterboard.layers}*(1+{waste})/({v:plasterWidth}*{v:plasterLength}/1000000),0)",
     "unit": "szt.",
     "price": 46.99,
     "source": "",
     "links": [
      {
       "shop": "castorama.pl",
       "url": "https://www.castorama.pl/plyta-gipsowo-kartonowa-impregnowana-1200-x-2600-x-12-5-mm-gkbi-typ-h2-norgips/5907651691616_CAPL.prd"
      }
     ],
     "refs": [
      "19"
     ]
    },
    {
     "id": "i51",
     "name": "Profil CD60 Budmat 0,5, 3 m",
     "spec": "krawędź zewnętrzna + poprzeczki co {r:plasterboard.studSpacing}",
     "qty": "=ROUNDUP({n:plasterCD}/3000,0)",
     "unit": "szt.",
     "price": 9.98,
     "source": "",
     "links": [
      {
       "shop": "castorama.pl",
       "url": "https://www.castorama.pl/profil-sufitowy-budmat-cd60-0-5-mm-3-m/5907595734011_CAPL.prd"
      }
     ],
     "refs": [
      "19"
     ]
    },
    {
     "id": "i52",
     "name": "Profil UD27 Budmat, 3 m",
     "spec": "przy ścianie i suficie",
     "qty": "=ROUNDUP({n:plasterUD}/3000,0)",
     "unit": "szt.",
     "price": 5.98,
     "source": "",
     "links": [
      {
       "shop": "castorama.pl",
       "url": "https://www.castorama.pl/profil-budmat-ud27-3-m/5907738940163_CAPL.prd"
      }
     ],
     "refs": [
      "19"
     ]
    },
    {
     "id": "i53",
     "name": "Masa szpachlowa Knauf Uniflott, 5 kg",
     "spec": "spoiny i narożniki",
     "qty": 1,
     "unit": "szt.",
     "price": 31.29,
     "source": "",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/masa-szpachlowa-uniflott-5-kg-knauf-43360653.html"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i60",
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
     ],
     "refs": [
     ]
    },
    {
     "id": "i61",
     "name": "Wkręty do profili 3,5 × 9,5, 250 szt.",
     "spec": "profil do profilu",
     "qty": 1,
     "unit": "op.",
     "price": 22.49,
     "source": "",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/wkret-do-plyt-g-k-3-5-x-9-5-mm-250-szt-standers-45530233.html"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i62",
     "name": "Kołki szybkiego montażu 6 × 40",
     "spec": "profile UD do ściany i sufitu",
     "qty": 1,
     "unit": "op.",
     "price": 14.29,
     "source": "sprzedawca Robimet",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/kolki-szybkie-montazu-6x40-mm-standers-45746715.html"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i63",
     "name": "Taśma spoinowa 50 mm × 25 m",
     "spec": "spoiny płyt",
     "qty": 1,
     "unit": "szt.",
     "price": 8.99,
     "source": "",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/tasma-fizelinowa-50-mm-25-mb-82738326.html"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i54",
     "name": "Narożnik aluminiowy Rigips 23,5 × 23,5, 3 m",
     "spec": "zewnętrzne krawędzie zabudów GK",
     "qty": "=ROUNDUP({n:plasterEdge}/3000,0)",
     "unit": "szt.",
     "price": 9.67,
     "source": "",
     "links": [
      {
       "shop": "sklep.sewera.pl",
       "url": "https://sklep.sewera.pl/naroznik-aluminiowy-23-5x23-5mm-3m-rigips-p7500"
      }
     ],
     "refs": [
     ]
    },
    {
     "id": "i55",
     "name": "Uszczelka silikonowa T, biała, wciskana",
     "spec": "szczelina między GK a meblami (3–5)",
     "qty": "=ROUNDUP({n:plasterEdge}/1000*(1+{v:edgeAllowance}),0)",
     "unit": "mb",
     "price": 21.53,
     "source": "sprawdzić rozmiar do szczeliny",
     "links": [
      {
       "shop": "centrumuszczelek.pl",
       "url": "https://centrumuszczelek.pl/uszczelka-typu-t/uszczelka-silikonowa-biala-wciskana-typ-t-0995462-6199"
      }
     ],
     "refs": [
     ]
    }
   ]
  },
  {
   "name": "Zlew i bateria",
   "items": [
    {
     "id": "i27",
     "name": "Zlew IKEA KILSVIKEN, 1 komora, czarny kompozyt kwarcowy, 72 × 46 (293.370.25)",
     "spec": "komora 66 × 40 × 18; syfon LILLVIKEN, sitko i pokrywa w zestawie",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 1279,
     "source": "",
     "links": [
      {
       "shop": "ikea.com/pl",
       "url": "https://www.ikea.com/pl/pl/p/kilsviken-zlew-wpuszczany-1-komora-czarny-kompozyt-kwarcowy-s29337025/"
      }
     ],
     "refs": [
      "8",
      "23"
     ]
    },
    {
     "id": "i39",
     "name": "Syfon oszczędzający miejsce Deante Space Saver Lux ZXY 9917",
     "spec": "odpływ 3,5″, przelew, przyłącze zmywarki; zostawia miejsce na szufladę z koszami",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 119,
     "source": "",
     "links": [
      {
       "shop": "sklep.deante.pl",
       "url": "https://sklep.deante.pl/pl/Syfon-do-zlewozmywaka-granitowego-1-komorowego-Space-Saver/ZXY-9917"
      }
     ],
     "refs": [
      "16",
      "23"
     ]
    },
    {
     "id": "i28",
     "name": "Bateria Deante Silia BQS_Z73M, złota, wyciągana wylewka",
     "spec": "jeden otwór Ø35",
     "qty": "={n:sinks}",
     "unit": "szt.",
     "price": 610.84,
     "source": "",
     "links": [
      {
       "shop": "mediaexpert.pl",
       "url": "https://www.mediaexpert.pl/agd-do-zabudowy/baterie-kuchenne/baterie-kuchenne/bateria-deante-silia-bqs-z73m-zloty"
      }
     ],
     "refs": [
      "23"
     ]
    }
   ]
  },
  {
   "name": "AGD",
   "items": [
    {
     "id": "i29",
     "name": "Lodówka Bosch KIS86AFE0",
     "spec": "do zabudowy {v:fridge.body.1}, zawias płaski",
     "qty": "={n:fridges}",
     "unit": "szt.",
     "price": 3949,
     "source": "",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/lodowka-do-zabudowy-kis86afe0-bosch-82744412.html"
      }
     ],
     "refs": [
      "4",
      "5"
     ]
    },
    {
     "id": "i30",
     "name": "Zmywarka Bosch SMV4HVX00E",
     "spec": "w pełni do zabudowy 60",
     "qty": "={n:tag.dishwasher}",
     "unit": "szt.",
     "price": 1899,
     "source": "",
     "links": [
      {
       "shop": "oleole.pl",
       "url": "https://www.oleole.pl/zmywarki-do-zabudowy/bosch-zmywarka-smv4hvx00e-bosch.bhtml"
      }
     ],
     "refs": [
      "6"
     ]
    },
    {
     "id": "i31",
     "name": "Płyta indukcyjna Electrolux CIT61443",
     "spec": "60, wycięcie {r:cutouts.hob.width} × {r:cutouts.hob.depth}",
     "qty": "={n:hobs}",
     "unit": "szt.",
     "price": 1579,
     "source": "1449 z kodem do 9 lis 2026",
     "links": [
      {
       "shop": "neonet.pl",
       "url": "https://www.neonet.pl/plyty-do-zabudowy/electrolux-cit61443.html"
      }
     ],
     "refs": [
      "7"
     ]
    },
    {
     "id": "i32",
     "name": "Piekarnik Bosch Serie 4 HBA534BB3",
     "spec": "wys. {v:oven.front.1}, czarny, 71 l",
     "qty": "={n:type.oven}",
     "unit": "szt.",
     "price": 1899,
     "source": "RTV EURO AGD i OleOle!",
     "links": [
      {
       "shop": "okazje.info.pl",
       "url": "https://www.okazje.info.pl/szukaj/bosch-serie-4-hba534bb3-termoobieg-czarny-piekarnik-elektryczny/ceny.html"
      }
     ],
     "refs": [
      "1",
      "3"
     ]
    },
    {
     "id": "i33",
     "name": "Mikrofalówka Bosch BFL623MB3",
     "spec": "do zabudowy, nad piekarnikiem",
     "qty": "={n:type.micro}",
     "unit": "szt.",
     "price": 999,
     "source": "",
     "links": [
      {
       "shop": "oleole.pl",
       "url": "https://www.oleole.pl/kuchenki-mikrofalowe-do-zabudowy/bosch-bfl623mb3.bhtml"
      }
     ],
     "refs": [
      "2",
      "3"
     ]
    },
    {
     "id": "i34",
     "name": "Okap Electrolux LFV416K, 60",
     "spec": "kominowy, wylot Ø150",
     "qty": 1,
     "unit": "szt.",
     "price": 1999.99,
     "source": "",
     "links": [
      {
       "shop": "mediaexpert.pl",
       "url": "https://www.mediaexpert.pl/agd-do-zabudowy/okapy-do-zabudowy/okap-electrolux-lfv416k"
      }
     ],
     "refs": [
      "24"
     ]
    },
    {
     "id": "i35",
     "name": "Rura Equation aluminiowa Ø150, 2,7 m",
     "spec": "okap do kanału wentylacyjnego (wyciąg)",
     "qty": 1,
     "unit": "szt.",
     "price": 68.49,
     "source": "",
     "links": [
      {
       "shop": "leroymerlin.pl",
       "url": "https://www.leroymerlin.pl/produkty/rura-odprowadzajaca-aluminiowa-wentylacyjna-150-mm-2-7-mb-equation-40418021.html"
      }
     ],
     "refs": [
      "24"
     ]
    }
   ]
  }
 ],
 "excluded": [
  "Robocizna, transport, elektryka (płyta 400 V, obwody piekarnika, zmywarki, lodówki), hydraulika, prace GK (materiały GK są w kosztorysie)."
 ],
 "notes": [
  {
   "section": "A. AGD – WYMIARY I DOPASOWANIE DO KORPUSÓW (mm; szer. × wys. × gł.)"
  },
  {
   "no": "1",
   "topic": "Piekarnik Bosch HBA534BB3 – K8, dół",
   "description": "Obudowa {v:oven.housing.0} × {v:oven.housing.1} × {v:oven.housing.2} i front {v:oven.front.0} × {v:oven.front.1} × {v:oven.front.2} stoją na półce; front kończy się {=<v:oven.front.1> - <v:oven.housing.1>} nad obudową.\nFront zachodzi: {=<v:oven.front.1> - <i:K8/oven.niche>} na półkę nad, po {=(<v:oven.front.0> - <k:K8.innerWidth>) / 2} na boki korpusu; na półkę pod nie zachodzi.\nWnęka {i:K8/oven.niche} × {k:K8.innerWidth} × {r:carcass.depth}; nad obudową {=<i:K8/oven.niche> - <v:oven.housing.1>} luzu.\nPółka pod piekarnikiem leży pod złączem, za frontem szafki pod nim: po otwarciu tego frontu widać ją w całości. Szczelina między frontem szafki a frontem piekarnika {=<i:K8/oven.nicheBottom> - <i:K8/cabinet#1.frontV1>}; do frontu mikrofalówki {=<i:K8/micro.v0> - <i:K8/oven.nicheBottom> - <v:oven.front.1>}.",
   "assumed": "Kratka w cokole ({p:i20} PLN), półka nad piekarnikiem płytsza o {r:shelf.ventGap}.",
   "decide": "",
   "links": [{"name": "Karta produktu z rysunkiem zabudowy (PDF, PL)", "url": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/HBA534BB3.pdf"}, {"name": "Instrukcja, montaż s. 26–27 (PDF)", "url": "https://media3.bosch-home.com/Documents/9001910274_B.pdf"}]
  },
  {
   "no": "2",
   "topic": "Mikrofalówka Bosch BFL623MB3 – K8, nad piekarnikiem",
   "description": "Urządzenie {v:micro.body.0} × {v:micro.body.1} × {v:micro.body.2} na regulowanych nóżkach {v:micro.feet}; front {v:micro.front.0} × {v:micro.front.1} × {v:micro.front.2} ({v:micro.frontBelowBody} poniżej spodu urządzenia).\nFront zachodzi: {=<i:K8/micro.nicheBottom> - <i:K8/micro.v0>} na półkę pod, {=<i:K8/micro.v1> - <i:K8/micro.nicheTop>} na półkę nad ({=<i:K8/micro.nicheBottom> - <i:K8/micro.v0>} + {i:K8/micro.niche} + {=<i:K8/micro.v1> - <i:K8/micro.nicheTop>} = {i:K8/micro.height}), po {=(<v:micro.front.0> - <k:K8.innerWidth>) / 2} na boki korpusu.\nWnęka {i:K8/micro.niche} × {k:K8.innerWidth} × {r:carcass.depth}; tył otwarty; nad urządzeniem {=<i:K8/micro.niche> - <v:micro.feet> - <v:micro.body.1>} luzu.\nSzczelina do frontu piekarnika {=<i:K8/micro.v0> - <i:K8/oven.nicheBottom> - <v:oven.front.1>}; front szafki nad: szczelina {=<i:K8/cabinet#2.frontV0> - <i:K8/micro.v1>} nad frontem mikrofalówki, zachodzi {=<i:K8/micro.nicheTop> + <t:carcass> - <i:K8/cabinet#2.frontV0>} na tę samą półkę.",
   "assumed": "Stoi na półce płytszej o {r:shelf.ventGap}; nóżki ustawione na 4.",
   "decide": "Rysunek Bosch (szafka wysoka) pokazuje 35 wolnego za korpusem; półka nad mikrofalówką sięga do {r:carcass.wallGap} od ściany – sprawdzić, czy wystarczy.",
   "links": [{"name": "Strona produktu z dokumentami (PL)", "url": "https://www.bosch-home.pl/pl/product/gotowanie-i-pieczenie/kuchenki-mikrofalowe/kuchenki-mikrofalowe-do-zabudowy/BFL623MB3"}, {"name": "Instrukcja montażu, s. 24–25 (PDF, PL)", "url": "https://maxelektro.pl/storage/file/pimcore_import/2024/12/17/94c9b8f85ca9df2e0ed5ed5def050d92/kuchenka-mikrofalowa-bosch-serie-2-bfl623mb3-instrukcja-montazu.pdf"}]
  },
  {
   "no": "3",
   "topic": "Słupek K8: piekarnik + mikrofalówka",
   "description": "Od podstawy piekarnika: {v:oven.front.1} piekarnik (ostatnie {=<v:oven.front.1> - <i:K8/oven.niche>} na półce środkowej), {=<i:K8/micro.v0> - <i:K8/oven.nicheBottom> - <v:oven.front.1>} szczeliny, {=<i:K8/micro.nicheBottom> - <i:K8/micro.v0>} mikrofalówka na półce środkowej, {i:K8/micro.niche} mikrofalówka, {=<i:K8/micro.v1> - <i:K8/micro.nicheTop>} mikrofalówka na półce górnej, {=<i:K8/cabinet#2.frontV0> - <i:K8/micro.v1>} szczeliny, {=<i:K8/micro.nicheTop> + <t:carcass> - <i:K8/cabinet#2.frontV0>} szafka górna na półce górnej.\nPółka środkowa {=<i:K8/oven.nicheTop> - <i:K8/oven.nicheBottom>}–{=<i:K8/micro.nicheBottom> - <i:K8/oven.nicheBottom>} (płytsza o {r:shelf.ventGap}), półka górna {=<i:K8/micro.nicheTop> - <i:K8/oven.nicheBottom>}–{=<i:K8/micro.nicheTop> + <t:carcass> - <i:K8/oven.nicheBottom>}; szafka pod piekarnikiem {i:K8/cabinet#1.height} (front = korpus), szafka górna od {=<i:K8/cabinet#2.v0> - <i:K8/oven.nicheBottom>}.\nWnęki: piekarnik {i:K8/oven.niche}, mikrofalówka {i:K8/micro.niche}.",
   "assumed": "Półki przymierzyć na miejscu przed zamocowaniem.",
   "decide": "",
   "links": []
  },
  {
   "no": "4",
   "topic": "Lodówka Bosch KIS86AFE0 – K10",
   "description": "Urządzenie {v:fridge.body.0} × {v:fridge.body.1} × {v:fridge.body.2} na dnie korpusu; nad nim {=<i:K10/fridge.niche> - <v:fridge.body.1>} luzu.\nWnęka {i:K10/fridge.niche} × {k:K10.innerWidth} × {r:carcass.depth}.\nZamrażarka: front {i:K10/freezer.frontHeight} na drzwiach {=<v:fridge.freezerDoor.1> - <v:fridge.freezerDoor.0>} – wystaje {=<i:K10/freezer.nicheBottom> + <v:fridge.freezerDoor.0> - <i:K10/freezer.frontV0>} w dół, po {=(<i:K10/freezer.frontWidth> - <v:fridge.body.0>) / 2} na boki; góra drzwi {=<i:K10/freezer.nicheBottom> + <v:fridge.freezerDoor.1> - <i:K10/freezer.frontV1>} wyżej niż front ({v:fridge.freezerDoor.1} + {t:carcass} = {=<v:fridge.freezerDoor.1> + <t:carcass>}), widać krawędź drzwi w szczelinie.\nLodówka: front {i:K10/fridge.frontHeight} na drzwiach {=<v:fridge.fridgeDoor.1> - <v:fridge.fridgeDoor.0>} – wystaje {=<i:K10/fridge.nicheBottom> + <v:fridge.fridgeDoor.0> - <i:K10/fridge.frontV0>} w dół, {=<i:K10/fridge.frontV1> - <i:K10/fridge.nicheBottom> - <v:fridge.fridgeDoor.1>} w górę, po {=(<i:K10/fridge.frontWidth> - <v:fridge.body.0>) / 2} na boki.\nSzczelina między frontami {=<i:K10/fridge.frontV0> - <i:K10/freezer.frontV1>}; fronty przykręcone do drzwi urządzenia.",
   "assumed": "Front lodówki wystaje {=<i:K10/fridge.frontV1> - <i:K10/fridge.nicheBottom> - <v:fridge.fridgeDoor.1>} nad drzwi urządzenia – normalne w tej zabudowie.",
   "decide": "",
   "links": [{"name": "Strona produktu z instrukcją montażu (PL)", "url": "https://www.bosch-home.pl/pl/product/chlodzenie-i-zamrazanie/chlodziarko-zamrazarki/chlodziarko-zamrazarki-do-zabudowy/KIS86AFE0"}]
  },
  {
   "no": "5",
   "topic": "Lodówka – wentylacja",
   "description": "Wlot: kratka w cokole pod lodówką. Wylot: {=<i:K10/fridge.niche> - <v:fridge.body.1>} nad urządzeniem i {r:carcass.wallGap} za korpusem.",
   "assumed": "Kratka {p:i20} PLN.",
   "decide": "",
   "links": []
  },
  {
   "no": "6",
   "topic": "Zmywarka Bosch SMV4HVX00E – G1[5]",
   "description": "Urządzenie {v:dishwasher.body.0} × {=MIN(<v:dishwasher.body.1> + <v:dishwasher.feet>, MAX(<v:dishwasher.body.1>, <w:1.v0>))} × {v:dishwasher.body.2}, nóżki wykręcone do spodu blatu; drzwi {=ROUND((<v:dishwasher.door.0> + (<v:dishwasher.door.1> - <v:dishwasher.door.0>) * (MIN(<v:dishwasher.body.1> + <v:dishwasher.feet>, MAX(<v:dishwasher.body.1>, <w:1.v0>)) - <v:dishwasher.body.1>) / <v:dishwasher.feet>))}.\nWnęka {w:1.v0} × {i:G1[5]/dishwasher.width} × {r:carcass.depth}.\nFront {i:G1[5]/dishwasher.frontWidth} × {i:G1[5]/dishwasher.frontHeight}: sięga {=ROUND(MIN(<v:dishwasher.body.1> + <v:dishwasher.feet>, MAX(<v:dishwasher.body.1>, <w:1.v0>)) - (<v:dishwasher.door.0> + (<v:dishwasher.door.1> - <v:dishwasher.door.0>) * (MIN(<v:dishwasher.body.1> + <v:dishwasher.feet>, MAX(<v:dishwasher.body.1>, <w:1.v0>)) - <v:dishwasher.body.1>) / <v:dishwasher.feet>) - <i:G1[5]/dishwasher.frontV0>)} niżej niż drzwi, kończy się {=MIN(<v:dishwasher.body.1> + <v:dishwasher.feet>, MAX(<v:dishwasher.body.1>, <w:1.v0>)) - <i:G1[5]/dishwasher.frontV1>} pod ich górą, po {=(<v:dishwasher.body.0> - <i:G1[5]/dishwasher.frontWidth>) / 2} węższy z boków.\nNóżki {v:dishwasher.feetBehindFront} za frontem, cokół przed nimi.",
   "assumed": "",
   "decide": "Ciężar frontu: sprawdzić w instrukcji (Bosch ma zawias SMZ5003 do ciężkich frontów).",
   "links": [{"name": "Strona produktu z danymi (EN)", "url": "https://www.galaxus.ch/en/s2/product/bosch-hausgeraete-serie-4-smv4hvx00e-built-in-dishwashers-37002331"}]
  },
  {
   "no": "7",
   "topic": "Płyta grzewcza Electrolux CIT61443 – K1",
   "description": "Szkło {v:hob.glass.0} × {v:hob.glass.1}; korpus {v:hob.body.0} × {v:hob.body.1} × {v:hob.body.2} w wycięciu {r:cutouts.hob.width} × {r:cutouts.hob.depth}, {r:cutouts.hob.fromBack} od tylnej krawędzi blatu.\nSzkło zachodzi na blat po {=(<v:hob.glass.0> - <r:cutouts.hob.width>) / 2} z każdej strony; {=<r:cutouts.hob.fromBack> - (<v:hob.glass.1> - <r:cutouts.hob.depth>) / 2} od tylnej i {=<w:1.depth> - <r:cutouts.hob.fromBack> - (<v:hob.glass.1> + <r:cutouts.hob.depth>) / 2} od przedniej krawędzi blatu.\nPod płytą: trawers przedni {t:carcass} × {r:rails.hobFront}, tylny {t:carcass} × {r:rails.depth}; przegroda {m:hobPanel} pod przednim trawersem, {r:rails.hobPanelGap} szczeliny z tyłu.",
   "assumed": "Na liście cięć.",
   "decide": "Odstęp korpusu płyty od przegrody: sprawdzić w instrukcji (s. 22).",
   "links": [{"name": "Strona produktu z instrukcją", "url": "https://www.electrolux.pl/kitchen/cooking/hobs/induction-hob/cit61443/"}]
  },
  {
   "no": "8",
   "topic": "Zlew IKEA KILSVIKEN – K2",
   "description": "Zlew {v:sink.outer.0} × {v:sink.outer.1}, komora {v:sink.bowl.0} × {v:sink.bowl.1} × {v:sink.bowl.2}; wycięcie {r:cutouts.sink.width} × {r:cutouts.sink.depth}, {r:cutouts.sink.fromBack} od tylnej krawędzi blatu.\nRant zachodzi na blat po {=(<v:sink.outer.0> - <r:cutouts.sink.width>) / 2}; zlew {=<r:cutouts.sink.fromBack> - (<v:sink.outer.1> - <r:cutouts.sink.depth>) / 2} od tylnej i {=<w:1.depth> - <r:cutouts.sink.fromBack> - (<v:sink.outer.1> + <r:cutouts.sink.depth>) / 2} od przedniej krawędzi blatu.",
   "assumed": "Wycięcie w liście cięć (blok BLATY).",
   "decide": "Wycięcie sprawdzić z szablonem IKEA przed CNC.",
   "links": [{"name": "Instrukcja montażu z szablonem (PDF)", "url": "https://www.ikea.com/pl/pl/assembly_instructions/kilsviken-zlew-wpuszczany-1-komorowy-czarny-kompozyt-kwarcowy__AA-2382156-2-2.pdf"}]
  },
  {
   "no": "9",
   "topic": "Szafka z ekspresem – półka wysuwana",
   "description": "Półka gł. {r:pullOutShelf.depth}, {r:pullOutShelf.clearance} luzu z każdej strony, na prowadnicach podszafkowych Blum MOVENTO (są pod półką, więc luz boczny wystarcza). Otwarte drzwi (zawiasy 110°) nie mogą blokować półki.",
   "assumed": "Prowadnice {p:i56} PLN za komplet.",
   "decide": "Plan wierceń prowadnic pod półką (Blum)."
  },
  {
   "section": "B. KONSTRUKCJA"
  },
  {
   "no": "10",
   "topic": "Narożnik L – korpus narożny",
   "description": "Jeden korpus (K3) za drzwiami, panelem {i:K3/panel.width} i ukrytym wypełnieniem. Dwie części niestandardowe z {m:carcass}: słupek zawiasowy, gł. {r:hinges.supportDepth}, przy krawędzi zawiasowej drzwi, niesie zawiasy; panel wpuszczany, tuż za panelem {i:K3/panel.width}, zamyka front korpusu od słupka do drugiego boku (panel {i:K3/panel.width} + wypełnienie − jeden bok). Półka to jedna zwykła płyta przez cały korpus; słupek zawiasowy ją przecina (zgłaszane w widoku 3D). Blat na korpusie i na listwach tylnych; korpusy skręcone. Cokoły grupy 1 i 2 spotykają się w narożniku: lista cięć podaje obie pełne długości, jeden przyciąć na miejscu.",
   "assumed": "Złącza: jedno opakowanie ({p:i18} PLN).",
   "decide": "Listwa ścienna pod blatem w narożniku?"
  },
  {
   "no": "11",
   "topic": "Listwy na sztorc, panele na płasko",
   "description": "Listwy: {m:frame} na sztorc, gł. {r:frame.depth}, lakierowane obustronnie i krawędź przednia. Panele: {m:panel} na płasko, lakierowane obustronnie; ABS w kolorze panelu na krawędzi przy otwieranym froncie (panel {i:K3/panel.width}: lewa krawędź, przy drzwiach; panel {i:G2[3]/panel.width} i panel tylny wyspy: brak). Panel {i:G2[3]/panel.width} zakrywa koniec panelu {i:K3/panel.width}.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "12",
   "topic": "Listwy tylne za listwami",
   "description": "Każda listwa poza korpusem: listwa z {m:carcass} na sztorc, gł. {r:frame.depth}, długość listwy.",
   "assumed": "Na liście cięć.",
   "decide": ""
  },
  {
   "no": "13",
   "topic": "Półki stałe – pełna głębokość",
   "description": "Na styku 2 frontów: pełna głębokość korpusu {r:carcass.depth}, więc oba fronty się o nią zamykają; półki ruchome są o {r:shelf.setback} krótsze. Przy piekarniku: półka nad nim płytsza o {r:shelf.ventGap}, półka pod nim pod złączem: front piekarnika na nią nie zachodzi, po otwarciu frontu szafki pod nią widać ją w całości.",
   "assumed": "Na liście cięć.",
   "decide": ""
  },
  {
   "no": "14",
   "topic": "Plecy i panel tylny wyspy",
   "description": "Plecy {m:back} tylko za drzwiami szafek (powietrze dla piekarnika, mikrofalówki, lodówki). Wyspa: panel tylny {m:panel} między bokami blatu, od podłogi do góry korpusów, na plecach korpusów.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "15",
   "topic": "Wymiary frontów",
   "description": "Front = moduł − 4 szczeliny (lewa, prawa, góra, dół), dla każdego frontu w design.js; wartości w notatce „Szczeliny frontów”. Narożna szafka górna na blacie ma większą szczelinę dolną nad blatem.",
   "assumed": "Fronty wyceniane za m².",
   "decide": ""
  },
  {
   "no": "16",
   "topic": "Szafka zlewowa",
   "description": "Dół: szuflada D z 3 koszami; wymaga syfonu oszczędzającego miejsce (płaski korpus przy tylnej ścianie, odpływ nad szufladą, boki {r:drawers.D.side}). Góra: front atrapa, bez szuflady.",
   "assumed": "Kosze {p:i38} PLN, syfon {p:i39} PLN.",
   "decide": "Odpływ w ścianie ≥ 450 nad podłogą."
  },
  {
   "no": "17",
   "topic": "Szuflady wewnętrzne na sztućce (wyspa)",
   "description": "Górne szuflady wyspy: TANDEMBOX antaro szuflada wewnętrzna M 500 za górnym frontem, własne prowadnice; zamknięcie frontu zamyka ją. Front wewnętrzny Z31L przycięty do LW − {r:drawers.inner.frontDeduction} (LW = szerokość wnętrza korpusu). Dno i tył na liście cięć ({m:drawerBox}). Bez szuflady wewnętrznej pod płytą.",
   "assumed": "{n:innerDrawers} szuflady wewnętrzne + {n:innerDrawers} wkłady na sztućce.",
   "decide": "Wysokość tyłu i dopasowanie wkładu: konfigurator Blum."
  },
  {
   "no": "18",
   "topic": "Blaty",
   "description": "Blat grupy 1 + bok z jednej płyty {v:worktopLength}; blat wyspy + 2 boki z jednej płyty {v:islandBoardDepth}, przycięty do {w:3.depth}. Blat stoi na bokach (łączenie na styk), {q:i25} złącza. Wycięcia na zlew i płytę: wymiary i położenie w liście cięć (blok BLATY, kolumna Wiercenie / wycięcia) – do zlecenia w hurtowni (CNC); wymiar otworu zlewu sprawdzić z szablonem IKEA.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "19",
   "topic": "Zabudowa GK",
   "description": "Zabudowa do sufitu jest dłuższa niż jedna płyta {v:plasterLength}: łączone i docinane na miejscu, {r:plasterboard.layers} warstwy, spoiny przesunięte. Profile liczone z całkowitej długości; przy docinkach może być potrzebny jeden więcej.",
   "assumed": "{q:i50} płyt, {q:i51} CD60, {q:i52} UD27.",
   "decide": ""
  },
  {
   "section": "C. CENY I ZAKRES"
  },
  {
   "no": "20",
   "topic": "Części lakierowane",
   "description": "Fronty shaker {p:i1} PLN/m², obustronnie: NIESPRAWDZONE (kwota właściciela, brak oferty sklepu). Części gładkie – listwy, panele, cokół – {p:i2} PLN/m² (lakierowane.pl, jedna strona; zapytać o drugą). Cokół musi być wilgocioodporny. Wszystkie części lakierowane od jednego producenta, dla jednego koloru.",
   "assumed": "",
   "decide": "Pisemna oferta na wszystkie części lakierowane, obustronnie, od jednego producenta."
  },
  {
   "no": "21",
   "topic": "{m:carcass} – {q:i5} ark.",
   "description": "{carcass.m2} m² + {waste|%} odpadu na arkuszach {sheet} m² → {q:i5} ark.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "22",
   "topic": "Zawiasy",
   "description": "Blum CLIP top BLUMOTION z prowadnikiem 173H7100: wysokość regulowana mimośrodem przy zawieszonych drzwiach, bez luzowania wkrętów. {p:i10} PLN za szt., {n:hinges} zawiasów.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "23",
   "topic": "Zlew i bateria",
   "description": "IKEA KILSVIKEN 72 × 46, komora 66 × 40 × 18, kompozyt kwarcowy, {p:i27} PLN; wymaga szafki 80; syfon LILLVIKEN i pokrywa w zestawie. Bateria Deante Silia BQS_Z73M, {p:i28} PLN, otwór Ø35. Syfon oszczędzający miejsce Deante ZXY 9917, {p:i39} PLN (patrz 16).",
   "assumed": "Czarny; syfon IKEA nieużywany.",
   "decide": "Czy syfon IKEA mieści się nad szufladą z koszami? Jeśli tak, zrezygnować z syfonu Deante."
  },
  {
   "no": "24",
   "topic": "Okap Electrolux LFV416K – tryb pracy",
   "description": "Wyciąg: okap {p:i34} PLN + rura {p:i35} PLN.",
   "assumed": "",
   "decide": "Wyciąg czy pochłaniacz (filtr węglowy, poza kosztorysem)?"
  },
  {
   "no": "25",
   "topic": "Poza kosztorysem",
   "description": "Robocizna, transport, elektryka, hydraulika, prace GK (materiały GK są w kosztorysie): lista pod kosztorysem.",
   "assumed": "",
   "decide": ""
  },
  {
   "section": "D. DO WIADOMOŚCI"
  },
  {
   "no": "26",
   "topic": "Nawis blatu wyspy od strony hokerów",
   "description": "Patrz widok 3D: dobry dla hokerów, ciasny dla krzeseł.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "27",
   "topic": "Gniazdko w wyspie",
   "description": "Nie ma w projekcie; zaplanować przed podłogą.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "28",
   "topic": "Niewidoczne boki korpusów",
   "description": "Zakryte listwami, bokami blatu lub ścianą: bez lakierowanych paneli bocznych.",
   "assumed": "",
   "decide": ""
  },
  {
   "no": "29",
   "topic": "Podsumowanie",
   "description": "{n:carcasses} korpusów, {n:fronts} frontów, {n:hinges} zawiasów, szuflady {n:drawersD} D + {n:drawersM} M + {n:innerDrawers} wewnętrzne, {n:handles} uchwytów, {n:legs} nóżek, półki {n:shelvesAdjustable} ruchome + {n:shelvesFixed} stałe.",
   "assumed": "",
   "decide": ""
  }
 ],
 "vars": {
  "oven": {"housing": [558, 570, 528.5], "front": [594, 595, 19.5]},
  "micro": {"body": [442, 338, 315], "feet": 4, "front": [595, 382, 20], "frontBelowBody": 13},
  "fridge": {"body": [558, 1772, 545], "freezerDoor": [8, 702], "fridgeDoor": [733, 1745]},
  "dishwasher": {"body": [598, 815, 550], "feet": 60, "door": [655, 725], "feetBehindFront": 100},
  "hob": {"glass": [590, 520], "body": [560, 490, 44]},
  "sink": {"outer": [720, 460], "bowl": [660, 400, 180]},
  "confirmatPerCarcass": 18,
  "edgeAllowance": 0.1,
  "islandBoardDepth": 920,
  "worktopBoardDepth": 650,
  "plasterLength": 2600,
  "plasterWidth": 1200,
  "sheetLength": 2800,
  "sheetWidth": 2070,
  "worktopLength": 4100
 }
};
