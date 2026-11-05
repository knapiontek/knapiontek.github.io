/* House "Dom w papawerach 5 (G)" — DATA for both bathrooms (numbers and descriptions only, no calculations).
   Loaded by view.html before engine.js. Dimensions in metres unless marked mm.

   Model coordinate system of each bathroom (plan view, as in the design drawings: door on the left,
   exterior wall on the right):
     z — from the door wall (z = 0) to the exterior wall (z = room.width)
     x — from the bottom wall / shower line (x = 0) to the top wall with the vanity (x = room.depth)
     y — up from the floor

   Building dimensions: design plans (archon.pl) measured to scale; reading accuracy ±1.5 cm.
   The two bathrooms are stacked so that the Ø160 riser is vertical: on the ground floor it is in the
   top-right corner, in the attic in the bottom-right corner, always right next to the WC. */
window.BATH_DATA = {
  floors: {
    /* ---------- GROUND FLOOR, room 7 — graphite ----------
       Plan to scale: 251 cm = 195 px → 1.287 cm/px (check: the 286 cm kitchen dimension agrees within 1 %).
       Walls as designed; only the shower recess changed: 100 × 90 (measured on site).
       Depth from the vanity wall to the far shower wall = 251 cm, so the room up to the shower line is 161 cm. */
    ground: {
      type: 'ground', number: 7, name: 'Parter', title: 'Łazienka L grafit',
      room: {
        width: 2.39,          // from the door to the window (drawing: 186 px)
        depth: 1.61,          // from the vanity wall to the shower line: 251 (design) − 90 (shower)
        height: 2.72,         // clear height from the design section
        ceiling: 2.45,        // suspended plasterboard ceiling
        ceilingGap: 0.05,     // LED gap along the walls
      },
      walls: {
        t: 0.10,              // partition walls
        exterior: 0.44,       // exterior wall with the window (drawing: 34 px)
        reveal: 0.25,         // window reveal from the wall face to the frame
      },
      shower: {
        width: 1.00,          // along the window wall
        depth: 0.90,          // depth from the glass line
        door: 0.60,           // glass door on glass-to-glass hinges
        drain: 0.88,          // Vogi Duo linear drain at the far wall
      },
      door: {                 // concealed door Porta HIDE WC 80
        opening: 0.90,        // opening in the wall (drawing: 70 px ≈ 90 cm)
        leaf: 0.80,
        height: 2.05,
        axisFromVanityWall: 0.87,   // opening axis from the vanity wall (drawing)
        opensOut: true,       // into the hallway, as designed; hinges on the shower side
        openAngle: 1.45,
      },
      window: {
        width: 1.00, height: 1.30,  // label on the drawing: 100/130
        sill: 0.90,                 // sill height — not given in the design, 90 cm assumed
        fromShowerLine: 0.005,      // the window starts at the shower line (drawing)
      },
      casing: {               // WC casing with Ø160 riser along the vanity wall, in the window corner
        depth: 0.28, length: 0.85, riserZone: 0.32, niche: 0.15,
        riser: 0.16,
      },
      wcCabinet: { w: 0.40, h: 0.80, y0: 1.20 },   // IKEA HEJSTA above the WC frame
      wc: { w: 0.36, d: 0.53 },
      vanity: {               // vanity unit, dimensions in mm
        z0: 200, len: 1200,   // start from the door wall (space for the radiator), length
        depth: 470, height: 400, bottomY: 324,
        top: 36, topDepth: 480,
        t: 18, gap: 2.5, rail: 100,
        sections: ['B', 'A'], // B: two drawers, A: one tall drawer under a basin
        basins: [850],        // basin axes from the vanity start
        basinW: 600, basinD: 400, basinH: 140, basinBack: 50, gasket: 3,
        nlA: 350, nlB: 400,
        mirror: { w: 0.60, h: 0.80, y: 1.62 },
      },
      radiator: { w: 0.40, h: 1.20, y0: 0.82, z: 0.055, gapToCorner: 0.01 },   // Mexen Hades 1200 × 400 on the door wall
      look: { basin: 'black', doorPaint: 0x5b5e60 },
      defaultDecor: 'H1199',
      tiles: {
        wall:        { tile: 'authorityGraphite', format: '60x120', layout: 'h' },
        floor:       { tile: 'authorityGrey',     format: '80x80',  layout: 'h' },
        shower:      { tile: 'authorityGraphite', format: '60x120', layout: 'h' },
        showerFloor: { tile: 'authorityGrey',     format: '80x80',  layout: 'h' },
      },
    },

    /* ---------- ATTIC, room 5 — light ----------
       Plan to scale: 273 cm = 113 px → 2.416 cm/px (check: the 822 cm room 2 dimension agrees within 1 %).
       Knee wall 120 cm and roof pitch 42° from the design; flat ceiling at 285 cm (design section).
       Layout changed by the owner: 2 basins top-left, shower 100 × 100 bottom-left, WC bottom-middle
       next to the riser, bath along the knee wall under the roof window. Door opening moved 20 cm up
       so that the shower fits in the corner. */
    attic: {
      type: 'attic', number: 5, name: 'Poddasze', title: 'Łazienka jasna na poddaszu',
      room: {
        width: 2.80,          // from the door wall to the knee wall (drawing: 116 px)
        depth: 2.73,          // from the bottom wall to the top wall (dimension in the design)
        height: 2.85,         // flat ceiling (design section)
      },
      roof: { knee: 1.20, pitch: 42 },
      walls: { t: 0.10, knee: 0.25 },
      shower: {
        width: 1.00,          // along the bottom wall
        depth: 1.00,          // along the door wall
        door: 0.60,
        drain: 0.90,          // linear drain along the bottom wall
      },
      door: {
        opening: 0.90, leaf: 0.80, height: 2.05,
        axisFromVanityWall: 1.28,   // drawing: 1.485, moved ~20 cm up so the 100 × 100 shower clears the opening
        opensOut: true, openAngle: 1.45,
      },
      roofWindow: {
        w: 0.94, h: 1.40,     // label on the drawing: 94/140 (VELUX size)
        axisFromVanityWall: 1.58,   // drawing; the bath is centred under it
        fromKnee: 0.15,       // lower edge measured along the slope from the top of the knee wall
      },
      bath: { len: 1.70, w: 0.75, h: 0.56 },
      wc: { w: 0.36, d: 0.53, axisFromDoorWall: 1.55 },
      casing: { depth: 0.25, from: 1.25, height: 1.20, riser: 0.16 },   // along the bottom wall up to the riser corner
      vanity: {
        z0: 200, len: 1600,
        depth: 470, height: 400, bottomY: 324,
        top: 36, topDepth: 480,
        t: 18, gap: 2.5, rail: 100,
        sections: ['A', 'A'],
        basins: [400, 1200],
        basinW: 600, basinD: 400, basinH: 140, basinBack: 50, gasket: 3,
        nlA: 350, nlB: 400,
        mirror: { w: 0.60, h: 0.80, y: 1.62 },
      },
      radiator: { w: 0.40, h: 1.20, y0: 0.82, z: 0.055, gapToCorner: 0.01 },
      look: { basin: 'white', doorPaint: 0xdedcd7 },
      defaultDecor: 'H1180',
      tiles: {
        wall:        { tile: 'authorityGrey', format: '60x120', layout: 'h' },
        floor:       { tile: 'authorityGrey', format: '80x80',  layout: 'h' },
        shower:      { tile: 'authorityGrey', format: '60x120', layout: 'v' },
        showerFloor: { tile: 'authorityGrey', format: '60x60',  layout: 'h' },
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
      bathTap: 'https://www.mediaexpert.pl/dom/lazienka/baterie-wannowe/bateria-wannowa-natynkowa-hansgrohe-tecturis-e-73420140-braz-szczotkowany',
      bath: 'https://www.okazje.info.pl/szukaj/roca-linea-wanna-prostokatna-170x75x43-cm-akrylowa-biala/ceny.html',
      siphon: 'https://www.leroymerlin.pl/produkty/syfon-umywalkowy-bez-spustu-oszczedzajacy-miejsce-bialy-geberit-82199271.html',
      radiator: 'https://www.castorama.pl/departments/grzejnik-azienkowy-mexen-hades-z-oty-1200x400-mm-1-szt-/5905315071828_CAPL.prd',
      door: 'https://esklep-porta.pl/drzwi-wewnetrzne/porta/drzwi-ukryte-porta-hide-wc-bezprzylgowe-otwierane-na-zewnatrz-prawe-80cm-plyta-spa1110p08lbpwayv0o000,p22305,53.html',
    },
    prices: { legraboxC350: 156.28, basinBlack: 1825, plug: 249, radiator: 949.99, door: 1745 },
  },

  defaults: {
    floor: 'ground',
    formats: ['60x60', '60x120', '80x80', '90x90', '100x100', '120x120'],
  },
};
