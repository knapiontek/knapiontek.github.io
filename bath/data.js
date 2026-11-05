/* Bathroom "L grafit" — DATA (numbers and descriptions only, no calculations).
   Loaded by view.html before engine.js. Dimensions in metres unless marked mm.

   Model coordinate system (plan view, as in the original design drawing: door on the left, window on the right):
     z — from the door wall (z = 0) to the window wall (z = room.width)
     x — from the shower line (x = 0) to the vanity wall (x = room.depth); the shower recess has x < 0
     y — up from the floor

   Building dimensions: original design plan measured to scale (251 cm = 195 px → 1.287 cm/px;
   check: the 286 cm kitchen dimension agrees within 1 %). Reading accuracy ±1.5 cm.
   Walls as designed; only the shower recess changed: 100 × 90 (measured on site).
   Depth from the vanity wall to the far shower wall = 251 cm (dimension in the design),
   so the room up to the shower line is 251 − 90 = 161 cm. */
window.BATH_DATA = {
  room: {
    width: 2.39,          // from the door to the window (drawing: 186 px)
    depth: 1.61,          // from the vanity wall to the shower line: 251 (design) − 90 (shower)
    height: 2.60,         // structural slab
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
    basinW: 600, basinD: 400, basinH: 140, basinZ: 850, basinBack: 50, gasket: 3,
    nlA: 350, nlB: 400,
    mirror: { w: 0.60, h: 0.80, y: 1.62 },
  },
  radiator: { w: 0.40, h: 1.20, y0: 0.82, z: 0.055, gapToCorner: 0.01 },   // Mexen Hades 1200 × 400 on the door wall

  decors: {               // Egger boards at M-HM (photos in textures.js)
    H1199: { price: 433.42, thick: '18 mm', note: 'najciemniejszy, czarnobrązowy — szafka spokojnie ciemna na tle grafitu' },
    H1181: { price: 667.18, thick: '18 mm', note: 'średni tabaczny, wyraźny słój z pęknięciami — ciepły kontrast z grafitem i mosiądzem' },
    H1399: { price: 530.91, thick: '18 mm', note: 'jasnoszary brąz — najjaśniejszy z czterech' },
    H1346: { price: 667.18, thick: '18 mm', note: 'szary dąb — ton w ton z płytką, bez ciepła drewna' },
  },
  defaultDecor: 'H1199',

  hardware: [
    ['Boki LEGRABOX pure C, NL 350, czarny mat (carbon)', '770C3502S', 1, 'szuflada A'],
    ['Boki LEGRABOX pure K, NL 400, czarny mat (carbon)', '770K4002S', 2, 'szuflady B'],
    ['Prowadnica LEGRABOX 40 kg, NL 350, do TIP-ON', '750.3501T', 1, ''],
    ['Prowadnica LEGRABOX 40 kg, NL 400, do TIP-ON', '750.4001T', 2, ''],
    ['TIP-ON BLUMOTION L1 (≤ 20 kg), NL 350–650', 'T60L7340', 3, 'otwieranie przez naciśnięcie, szczelina 2,5 mm'],
    ['Mocowanie frontu C / K', 'ZF7C7002 / ZF7K7002', '1 / 2', 'para'],
    ['Mocowanie tyłu C / K', 'ZB7C000S / ZB7K000S', '1 / 2', 'para'],
    ['Zawieszki ukryte do szafek wiszących', 'np. Camar 807', '1 para', 'na plecach nośnych, regulacja po zawieszeniu'],
    ['Wkręty 4 × 15 do prowadnic', '609.1500', 1, 'opak.'],
  ],

  shop: {
    mhm: 'M-HM Bielsko-Biała',
    links: {
      mhmServices: 'https://m-hm.pl/pl/i/Uslugi/16',
      mhmBoards: 'https://m-hm.pl/pl/c/Plyty-meblowe/266',
      legrabox: 'https://m-hm.pl/pl/c/Legrabox/324',
      tipon: 'https://m-hm.pl/pl/c/TIP-ON-i-Adaptery/369',
      erozkroj: 'https://mhm-web2.erozkroje.pl',
      basin: 'https://tanielazienki.pl/p/11/39675/catalano-green-lux-60x40-umywalka-czarna-matowa-z-polka-z-otworem-na-baterie-160grlxnns-0625601022-umywalki.html',
      plug: 'https://skleparmatura.com/produkt/catalano-zero-umywalka-nablatowa-60x35xh12-nero-satinato-czarny-mat-0122600022/',
      tap: 'https://www.mediaexpert.pl/dom/lazienka/baterie-lazienkowe/bateria-umywalkowa-hansgrohe-tecturis-e-110-ecosmart-73010140-braz-szczotkowany',
      siphon: 'https://www.leroymerlin.pl/produkty/syfon-umywalkowy-bez-spustu-oszczedzajacy-miejsce-bialy-geberit-82199271.html',
      radiator: 'https://www.castorama.pl/departments/grzejnik-azienkowy-mexen-hades-z-oty-1200x400-mm-1-szt-/5905315071828_CAPL.prd',
      door: 'https://esklep-porta.pl/drzwi-wewnetrzne/porta/drzwi-ukryte-porta-hide-wc-bezprzylgowe-otwierane-na-zewnatrz-prawe-80cm-plyta-spa1110p08lbpwayv0o000,p22305,53.html',
    },
    prices: { legraboxC350: 156.28, basin: 1825, plug: 249, radiator: 949.99, door: 1745 },
  },

  defaults: {
    tiles: {
      wall:        { tile: 'authorityGraphite', format: '60x120', layout: 'h' },
      floor:       { tile: 'authorityGrey',     format: '80x80',  layout: 'h' },
      shower:      { tile: 'authorityGraphite', format: '60x120', layout: 'h' },
      showerFloor: { tile: 'authorityGrey',     format: '80x80',  layout: 'h' },
    },
    formats: ['60x60', '60x120', '80x80', '90x90', '100x100', '120x120'],
  },
};
