/* House "Dom w papawerach 5 (G)" — DATA for both bathrooms (numbers and descriptions only, no calculations).
   Loaded by view.html before engine.js. Every length is in mm (whole numbers); angles in degrees (openAngle in radians);
   bath.n is an exponent.

   The room is the house's (../house/house.js, through ../house/house-clip.js): walls, door opening, window, floor, ceiling heights and
   the roof are taken from there as they are and are not repeated here. Positions are house axes: x along the house, y across,
   z up. What is left here is the bathroom's own design: fittings, finishes, products; their places are distances from the
   room's walls (vanity wall = the room's −x face, door wall = its −y face, window or knee wall = its +y face).

   The two bathrooms are stacked so that the Ø160 riser is vertical: on the ground floor it is in the
   top-right corner, in the attic in the bottom-right corner, always right next to the WC. */
window.BATH_DATA = {
  floors: {
    /* ---------- GROUND FLOOR, room 7 — graphite ----------
       The shower recess is the house's (as built: 900 × 1000 beyond the glass line). */
    ground: {
      type: 'ground', number: 7, name: 'Parter', title: 'Łazienka L grafit',
      cameras: { overview: 'Ogólny', door: 'Od drzwi', vanity: 'Umywalka i WC', shower: 'Prysznic', cabinet: 'Szafka i grzejnik', plan: 'Rzut' },   // the dock
      showerLine: 8950,       // house x of the shower glass line; the recess beyond it is the house's
      ceiling: { height: 2450, ledGap: 50 },   // suspended plasterboard ceiling over the floor, LED gap along the walls
      shower: {
        door: 600,            // glass door on glass-to-glass hinges
        drain: 880,           // Vogi Duo linear drain at the far wall
      },
      door: {                 // concealed door Porta HIDE WC 80 in the house's opening
        leaf: 800,
        opensOut: true,       // into the hallway, as designed; hinges on the shower side
        openAngle: 1.45,
      },
      casing: {               // WC casing with Ø160 riser along the vanity wall, in the window corner
        depth: 280, length: 850, riserZone: 320, niche: 150,
        riser: 160,
      },
      wcCabinet: { w: 400, h: 800, bottom: 1200 },   // IKEA HEJSTA above the WC frame; bottom: z over the floor
      wc: { w: 360, d: 530 },
      vanity: {               // vanity unit
        fromDoorWall: 200, len: 1200,   // start from the door wall (space for the radiator), length
        depth: 470, height: 400, bottom: 324,   // bottom: z of the carcass over the floor
        top: 36, topDepth: 480,
        t: 18, gap: 2.5, rail: 100,
        sections: ['B', 'A'], // B: two drawers, A: one tall drawer under a basin
        basins: [850],        // basin axes from the vanity start
        basinW: 600, basinD: 400, basinH: 140, basinBack: 50, gasket: 3,
        nlA: 350, nlB: 400,
        mirror: { w: 600, h: 800, z: 1620 },   // z: its centre over the floor
      },
      radiator: { w: 400, h: 1200, bottom: 820, fromWall: 55, gapToCorner: 10 },   // Mexen Hades 1200 × 400 on the door wall
      look: { basin: 'black', doorPaint: 0x5b5e60 },
      defaultDecor: 'H1199',
      tiles: {
        wall:        { tile: 'authorityGraphite', format: '598x1198', layout: 'h' },
        floor:       { tile: 'authorityGrey',     format: '898x898',  layout: 'h' },
        shower:      { tile: 'authorityGraphite', format: '598x1198', layout: 'h' },
        showerFloor: { tile: 'authorityGrey',     format: '898x898',  layout: 'h' },
      },
    },

    /* ---------- ATTIC, room 5 — light ----------
       Layout changed by the owner: 2 basins top-left, shower 1000 × 1000 bottom-left, WC bottom-middle
       next to the riser, freestanding bath centred in the free area by the knee wall, floor-standing mixer
       in the top-right corner. */
    attic: {
      type: 'attic', number: 5, name: 'Poddasze', title: 'Łazienka jasna na poddaszu',
      cameras: { overview: 'Ogólny', door: 'Od drzwi', vanity: 'Umywalki', bath: 'Wanna', shower: 'Prysznic', plan: 'Rzut' },
      shower: {
        width: 1000,          // along the bottom wall
        depth: 1000,          // along the door wall
        door: 600,
        drain: 900,           // linear drain along the bottom wall
      },
      door: { leaf: 800, opensOut: true, openAngle: 1.45 },
      bath: {                 // freestanding oval bath, centred in the free floor area right of the WC / vanity
        len: 1700, w: 750, h: 580, rim: 50, n: 4,    // n: superellipse exponent of the outline (2 = ellipse)
      },
      bathTap: {              // floor-standing bath mixer Hansgrohe Tecturis E, in the top-right corner (vanity wall / knee wall)
        h: 990, reach: 262,   // height, spout reach from the column axis (catalogue)
        fromBathEnd: 80,      // column axis behind the bath end
        fromKnee: 300,        // column axis from the knee wall
      },
      wc: { w: 360, d: 530, axisFromDoorWall: 1550 },
      casing: { depth: 250, from: 1250, height: 1200, riser: 160 },   // along the bottom wall up to the riser corner
      vanity: {
        fromDoorWall: 200, len: 1600,
        depth: 470, height: 400, bottom: 324,
        top: 36, topDepth: 480,
        t: 18, gap: 2.5, rail: 100,
        sections: ['A', 'A'],
        basins: [400, 1200],
        basinW: 600, basinD: 400, basinH: 140, basinBack: 50, gasket: 3,
        nlA: 350, nlB: 400,
        mirror: { w: 600, h: 800, z: 1620 },
      },
      radiator: { w: 400, h: 1200, bottom: 820, fromWall: 55, gapToCorner: 10 },
      look: { basin: 'white', doorPaint: 0xdedcd7 },
      defaultDecor: 'H1180',
      tiles: {
        wall:        { tile: 'authorityGrey', format: '598x1198', layout: 'h' },
        floor:       { tile: 'authorityGrey', format: '898x898',  layout: 'h' },
        shower:      { tile: 'authorityGrey', format: '598x1198', layout: 'v' },
        showerFloor: { tile: 'authorityGrey', format: '598x598',  layout: 'h' },
      },
    },
  },

  decors: {               // Egger boards at M-HM (photos in textures.js)
    H1199: { price: 433.42, thick: '18 mm', note: 'najciemniejszy, czarnobrązowy — szafka spokojnie ciemna na tle grafitu' },
    H1181: { price: 667.18, thick: '18 mm', note: 'średni tabaczny, wyraźny słój z pęknięciami — ciepły kontrast z grafitem i mosiądzem' },
    H1399: { price: 530.91, thick: '18 mm', note: 'jasnoszary brąz' },
    H1346: { price: 667.18, thick: '18 mm', note: 'szary dąb — ton w ton z płytką, bez ciepła drewna' },
    H1180: { price: 667.18, thick: '18,6 mm', note: 'jasny, naturalny dąb z wyraźnym słojem — ciepły i jasny, pasuje do Authority Grey' },
    H1176: { price: 667.18, thick: '18,6 mm', note: 'bielony dąb, prawie biały — najjaśniejsza szafka' },
  },

  shop: {
    mhm: 'M-HM Bielsko-Biała',
    links: {
      mhmServices: 'https://m-hm.pl/pl/i/Uslugi/16',
      mhmBoards: 'https://m-hm.pl/pl/c/Plyty-meblowe/266',
      legrabox: 'https://m-hm.pl/pl/c/Legrabox/324',
      tipon: 'https://m-hm.pl/pl/c/TIP-ON-i-Adaptery/369',
      erozkroj: 'https://mhm-web2.erozkroje.pl',
      basinBlack: 'https://tanielazienki.pl/p/11/39675/catalano-green-lux-60x40-umywalka-czarna-matowa-z-polka-z-otworem-na-baterie-160grlxnns-0625601022-umywalki.html',
      basinWhite: 'https://www.tomdom.pl/produkty/umywalka-stawiana-na-blat/catalano/green-lux-60x40-umywalka-nablatowa-z-otworem-na-baterie-160grlxn00',
      plug: 'https://skleparmatura.com/produkt/catalano-zero-umywalka-nablatowa-60x35xh12-nero-satinato-czarny-mat-0122600022/',
      tap: 'https://www.mediaexpert.pl/dom/lazienka/baterie-lazienkowe/bateria-umywalkowa-hansgrohe-tecturis-e-110-ecosmart-73010140-braz-szczotkowany',
      bathTap: 'https://www.architonic.com/en/p/hansgrohe-tecturis-e-single-lever-bath-mixer-floor-standing-20779750',
      bathTapSeries: 'https://www.mediaexpert.pl/dom/lazienka/baterie-wannowe/popularne-serie_tecturis-e',
      bath: 'https://www.castorama.pl/wanna-wolnostojaca-170-x-75-x-58-cm-biala/5063022837868_CAPL.prd',
      bathAlt: 'https://www.okazje.info.pl/szukaj/oltens-begna-wanna-wolnostojaca-przyscienna-170x75cm-12011000/ceny.html',
      siphon: 'https://www.leroymerlin.pl/produkty/syfon-umywalkowy-bez-spustu-oszczedzajacy-miejsce-bialy-geberit-82199271.html',
      radiator: 'https://www.castorama.pl/departments/grzejnik-azienkowy-mexen-hades-z-oty-1200x400-mm-1-szt-/5905315071828_CAPL.prd',
      door: 'https://esklep-porta.pl/drzwi-wewnetrzne/porta/drzwi-ukryte-porta-hide-wc-bezprzylgowe-otwierane-na-zewnatrz-prawe-80cm-plyta-spa1110p08lbpwayv0o000,p22305,53.html',
    },
    prices: { legraboxC350: 156.28, basinBlack: 1825, plug: 249, radiator: 949.99, door: 1745, bath: 1498 },
  },

  /* as house.js: 3D (the menu: the bathrooms by floor, one at a time), the 2D plan (cut at the house's own height for the
     floor), Analiza (the checks of engine.js) */
  views: {
    '3d': { name: '3D', menu: 'floors', panels: ['tabs'],
      layers: {                 // the Warstwy panel, as the house and the kitchen; off: hidden at the start
        room: { name: 'Pomieszczenie', layers: { walls: { name: 'Ściany' }, ceiling: { name: 'Sufit' }, floor: { name: 'Podłoga' } } },
        furniture: { name: 'Meble' }, sanitary: { name: 'Ceramika i armatura' }, glass: { name: 'Kabina' },
        installations: { name: 'Instalacje', off: true }, edges: { name: 'Krawędzie' },
      } },
    '2d': { name: '2D', plan: true, note: 'Ogród u góry. Linią ciągłą to, co pod cięciem (widziane z góry), przerywaną to, co nad nim.', panels: ['plan', 'tabs'] },
    analysis: { name: 'Analiza', analysis: true, panels: ['tabs'] },
  },

  defaults: {
    floor: 'ground',
    formats: ['598x598', '598x898', '598x1198', '898x898', '1198x1198'],   // Paradyż Authority formats, mm
  },
};
