/* House "Dom w papawerach 5 (G)" — DATA for both bathrooms (numbers and descriptions only, no calculations).
   Loaded by view.html before engine.js. Every length is in mm (whole numbers); angles in degrees
   (openAngle in radians); bath.n is an exponent. engine.js turns the lengths into metres for the 3D scene.

   Model coordinate system of each bathroom (plan view, as in the design drawings: door on the left,
   exterior wall on the right):
     z — from the door wall (z = 0) to the exterior wall (z = room.width)
     x — from the bottom wall / shower line (x = 0) to the top wall with the vanity (x = room.depth)
     y — up from the floor

   Building dimensions: design plans (archon.pl) measured to scale; reading accuracy ±15 mm.
   The two bathrooms are stacked so that the Ø160 riser is vertical: on the ground floor it is in the
   top-right corner, in the attic in the bottom-right corner, always right next to the WC. */
window.BATH_DATA = {
  floors: {
    /* ---------- GROUND FLOOR, room 7 — graphite ----------
       Plan to scale: 2510 mm = 195 px → 12.87 mm/px (check: the 2860 kitchen dimension agrees within 1 %).
       Walls as designed; only the shower recess changed: 1000 × 900 (measured on site).
       Depth from the vanity wall to the far shower wall = 2510, so the room up to the shower line is 1610. */
    ground: {
      type: 'ground', number: 7, name: 'Parter', title: 'Łazienka L grafit',
      room: {
        width: 2390,          // from the door to the window (drawing: 186 px)
        depth: 1610,          // from the vanity wall to the shower line: 2510 (design) − 900 (shower)
        height: 2720,         // clear height from the design section
        ceiling: 2450,        // suspended plasterboard ceiling
        ceilingGap: 50,     // LED gap along the walls
      },
      walls: {
        t: 100,              // partition walls
        exterior: 440,       // exterior wall with the window (drawing: 34 px)
        reveal: 250,         // window reveal from the wall face to the frame
      },
      shower: {
        width: 1000,          // along the window wall
        depth: 900,          // depth from the glass line
        door: 600,           // glass door on glass-to-glass hinges
        drain: 880,          // Vogi Duo linear drain at the far wall
      },
      door: {                 // concealed door Porta HIDE WC 80
        opening: 900,        // opening in the wall (drawing: 70 px ≈ 900 mm)
        leaf: 800,
        height: 2050,
        axisFromVanityWall: 870,   // opening axis from the vanity wall (drawing)
        opensOut: true,       // into the hallway, as designed; hinges on the shower side
        openAngle: 1.45,
      },
      window: {
        width: 1000, height: 1300,  // archon label 1000/1300
        sill: 900,                 // sill height — not given in the design, 900 assumed
        fromShowerLine: 5,      // the window starts at the shower line (drawing)
      },
      casing: {               // WC casing with Ø160 riser along the vanity wall, in the window corner
        depth: 280, length: 850, riserZone: 320, niche: 150,
        riser: 160,
      },
      wcCabinet: { w: 400, h: 800, y0: 1200 },   // IKEA HEJSTA above the WC frame
      wc: { w: 360, d: 530 },
      vanity: {               // vanity unit, dimensions in mm
        z0: 200, len: 1200,   // start from the door wall (space for the radiator), length
        depth: 470, height: 400, bottomY: 324,
        top: 36, topDepth: 480,
        t: 18, gap: 2.5, rail: 100,
        sections: ['B', 'A'], // B: two drawers, A: one tall drawer under a basin
        basins: [850],        // basin axes from the vanity start
        basinW: 600, basinD: 400, basinH: 140, basinBack: 50, gasket: 3,
        nlA: 350, nlB: 400,
        mirror: { w: 600, h: 800, y: 1620 },
      },
      radiator: { w: 400, h: 1200, y0: 820, z: 55, gapToCorner: 10 },   // Mexen Hades 1200 × 400 on the door wall
      look: { basin: 'black', doorPaint: 0x5b5e60 },
      defaultDecor: 'H1199',
      tiles: {
        wall:        { tile: 'authorityGraphite', format: '598x1198', layout: 'h' },
        floor:       { tile: 'authorityGrey',     format: '898x898',  layout: 'h' },
        shower:      { tile: 'authorityGraphite', format: '598x1198', layout: 'h' },
        showerFloor: { tile: 'authorityGrey',     format: '898x898', layout: 'h' },
      },
    },

    /* ---------- ATTIC, room 5 — light ----------
       Plan to scale: 2730 mm = 113 px → 24.16 mm/px (check: the 8220 room 2 dimension agrees within 1 %).
       Knee wall 1200 and roof pitch 42° from the design; flat ceiling at 2850 (design section).
       Layout changed by the owner: 2 basins top-left, shower 1000 × 1000 bottom-left, WC bottom-middle
       next to the riser, freestanding bath centred in the free area by the knee wall, floor-standing mixer
       in the top-right corner. Door opening moved 200 up
       so that the shower fits in the corner. */
    attic: {
      type: 'attic', number: 5, name: 'Poddasze', title: 'Łazienka jasna na poddaszu',
      room: {
        width: 2800,          // from the door wall to the knee wall (drawing: 116 px)
        depth: 2730,          // from the bottom wall to the top wall (dimension in the design)
        height: 2850,         // flat ceiling (design section)
      },
      roof: { knee: 1200, pitch: 42 },
      walls: { t: 100, knee: 250 },
      shower: {
        width: 1000,          // along the bottom wall
        depth: 1000,          // along the door wall
        door: 600,
        drain: 900,          // linear drain along the bottom wall
      },
      door: {
        opening: 900, leaf: 800, height: 2050,
        axisFromVanityWall: 1280,   // drawing: 1485, moved ~200 up so the 1000 × 1000 shower clears the opening
        opensOut: true, openAngle: 1.45,
      },
      roofWindow: {
        w: 940, h: 1400,     // archon label 940/1400 (VELUX size)
        axisFromVanityWall: 1580,   // drawing; the bath is centred under it
        fromKnee: 150,       // lower edge measured along the slope from the top of the knee wall
      },   // the bath is not necessarily centred under the window
      bath: {                 // freestanding oval bath, centred in the free floor area right of the WC / vanity
        len: 1700, w: 750, h: 580, rim: 50, n: 4,    // n: superellipse exponent of the outline (2 = ellipse)
      },
      bathTap: {              // floor-standing bath mixer Hansgrohe Tecturis E, in the top-right corner (vanity wall / knee wall)
        h: 990, reach: 262, // height, spout reach from the column axis (catalogue)
        fromBathEnd: 80,    // column axis behind the bath end
        fromKnee: 300,       // column axis from the knee wall
      },
      wc: { w: 360, d: 530, axisFromDoorWall: 1550 },
      casing: { depth: 250, from: 1250, height: 1200, riser: 160 },   // along the bottom wall up to the riser corner
      vanity: {
        z0: 200, len: 1600,
        depth: 470, height: 400, bottomY: 324,
        top: 36, topDepth: 480,
        t: 18, gap: 2.5, rail: 100,
        sections: ['A', 'A'],
        basins: [400, 1200],
        basinW: 600, basinD: 400, basinH: 140, basinBack: 50, gasket: 3,
        nlA: 350, nlB: 400,
        mirror: { w: 600, h: 800, y: 1620 },
      },
      radiator: { w: 400, h: 1200, y0: 820, z: 55, gapToCorner: 10 },
      look: { basin: 'white', doorPaint: 0xdedcd7 },
      defaultDecor: 'H1180',
      tiles: {
        wall:        { tile: 'authorityGrey', format: '598x1198', layout: 'h' },
        floor:       { tile: 'authorityGrey', format: '898x898', layout: 'h' },
        shower:      { tile: 'authorityGrey', format: '598x1198', layout: 'v' },
        showerFloor: { tile: 'authorityGrey', format: '598x598', layout: 'h' },
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

  defaults: {
    floor: 'ground',
    formats: ['598x598', '598x898', '598x1198', '898x898', '1198x1198'],   // Paradyż Authority formats, mm
  },
};
