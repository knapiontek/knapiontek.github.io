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
      fittings: { basin: 'catalano-green-lux-60x40-nero', plug: 'catalano-plug-5poslns-nero' },
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
      defaultDecor: 'egger-h1199-st12',
      tiles: {
        wall:        { tile: 'paradyz-authority-graphite', format: '598x1198', layout: 'h' },
        floor:       { tile: 'paradyz-authority-grey', format: '898x898',  layout: 'h' },
        shower:      { tile: 'paradyz-authority-graphite', format: '598x1198', layout: 'h' },
        showerFloor: { tile: 'paradyz-authority-grey', format: '898x898',  layout: 'h' },
      },
    },

    /* ---------- ATTIC, room 5 — light ----------
       Layout changed by the owner: 2 basins top-left, shower 1000 × 1000 bottom-left, WC bottom-middle
       next to the riser, freestanding bath centred in the free area by the knee wall, floor-standing mixer
       in the top-right corner. */
    attic: {
      type: 'attic', number: 5, name: 'Poddasze', title: 'Łazienka jasna na poddaszu',
      fittings: { basin: 'catalano-green-lux-60x40-white', plug: 'catalano-plug-white', bath: 'castorama-bath-freestanding-170x75' },
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
      defaultDecor: 'egger-h1180-st37',
      tiles: {
        wall:        { tile: 'paradyz-authority-grey', format: '598x1198', layout: 'h' },
        floor:       { tile: 'paradyz-authority-grey', format: '898x898',  layout: 'h' },
        shower:      { tile: 'paradyz-authority-grey', format: '598x1198', layout: 'v' },
        showerFloor: { tile: 'paradyz-authority-grey', format: '598x598',  layout: 'h' },
      },
    },
  },

  decors: {               // the Egger boards to choose from (../library/products.js boards): why each would suit
    'egger-h1199-st12': { note: 'najciemniejszy, czarnobrązowy — szafka spokojnie ciemna na tle grafitu' },
    'egger-h1181-st37': { note: 'średni tabaczny, wyraźny słój z pęknięciami — ciepły kontrast z grafitem i mosiądzem' },
    'egger-h1399-st10': { note: 'jasnoszary brąz' },
    'egger-h1346-st32': { note: 'szary dąb — ton w ton z płytką, bez ciepła drewna' },
    'egger-h1180-st37': { note: 'jasny, naturalny dąb z wyraźnym słojem — ciepły i jasny, pasuje do Authority Grey' },
    'egger-h1176-st37': { note: 'bielony dąb, prawie biały — najjaśniejsza szafka' },
  },

  shop: {                 // shops and services that are not products (the products are in ../library/products.js)
    mhm: 'M-HM Bielsko-Biała',
    links: {
      mhmServices: 'https://m-hm.pl/pl/i/Uslugi/16',
      mhmBoards: 'https://m-hm.pl/pl/c/Plyty-meblowe/266',
    },
  },

  /* the fittings bought (keys of ../library/products.js fittings), by what they are for; by the metal of the fittings
     where it differs; a floor adds its own (its basin and plug, the bath) */
  fittings: {
    legraboxC: 'blum-legrabox-pure-c-350-black', legraboxK: 'blum-legrabox-pure-k-400-black', runners: 'blum-runners-tip-on-blumotion',
    tap: { brass: 'hansgrohe-tecturis-e-110-73010140', nickel: 'hansgrohe-tecturis-e-110-73010000' },
    siphon: 'geberit-siphon-space-saving',
    bathTap: { brass: 'hansgrohe-tecturis-e-73445140', nickel: 'hansgrohe-tecturis-e-73445000' }, bathSet: 'hansgrohe-10452180',
    radiator: 'mexen-hades-1200x400-gold', door: 'porta-hide-wc-80',
  },

  /* as house.js, one per mode: 3D (the menu: the bathrooms by floor, one at a time), the 2D plan (cut at the house's own
     height for the floor), Test (the checks of engine.js), Info; tabs: of the right panel */
  views: {
    '3d': { name: '3D', menu: 'floors', tabs: ['layers', 'finish'],
      layers: {                 // the Warstwy panel, as the house and the kitchen; off: hidden at the start
        room: { name: 'Pomieszczenie', layers: { walls: { name: 'Ściany' }, ceiling: { name: 'Sufit' }, floor: { name: 'Podłoga' } } },
        furniture: { name: 'Meble' }, sanitary: { name: 'Ceramika i armatura' }, glass: { name: 'Kabina' },
        installations: { name: 'Instalacje', off: true }, edges: { name: 'Krawędzie' },
      } },
    '2d': { name: '2D', plan: true, note: 'Ogród u góry. Linią ciągłą to, co pod cięciem (widziane z góry), przerywaną to, co nad nim.' },
    test: { name: 'Test', test: true },
    info: { name: 'Info', info: true, tabs: ['finish'] },
  },

  defaults: {
    floor: 'ground',
    tiles: ['paradyz-authority-graphite', 'paradyz-authority-grey'],          // to choose from (../library/products.js tiles)
    formats: ['598x598', '598x898', '598x1198', '898x898', '1198x1198'],   // Paradyż Authority formats, mm
  },
};
