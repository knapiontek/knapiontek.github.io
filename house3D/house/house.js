/* "Dom w papawerach 5 (G)": the house as data, in three trees (rules.md § 1).
   geometry  what the house is made of: the boxes of archon/analysis.md with its build changes (§ 14)
   layers    what can be switched on and off
   views     how the house is looked at: 3D (cameras, light, walk), the 2D plan and Analiza (the checks)
   view.html holds no number, name or colour of this house; it draws this file with ../library (materials, tile products, textures).

   Units mm, whole numbers. Axes of the analysis (§ 2): x along the house (0 garden outer face, 13200 front outer face),
   y across (0 left outer face, garage side; 9100 right), z up (0 finished ground floor).

   b          a box [x1, x2, y1, y2, z1, z2]
   line       {z, y, pitch}: the line z = z + pitch · tan(roof pitch) · (y' − y) across the house (pitch +1 or −1)
   below      lines a solid stays under (a sloping window head); "top": "roof" = under both roof planes
   cuts       ids of elements or voids subtracted from an element
   outer      the side of a box that faces the air: −x garden, +x front, −y left, +y right, −z down
   kinds      of elements: material of the faces, section colour (cap), checked thickness, layers;
              opened = openings are cut out of it, host = windows and doors sit in it, flush with its outer face,
              walkable = the walk stands on it, finish = the facade layer that switches its finish, raw = its bare material
   openings   boxes cut out of every opened element they cross; label = archon width/height in mm; their kind says what
              is drawn in them (glazed: frame, bars, glass; leaf: a solid leaf of "leaf" mm, the rest glazed) and
              whether the floor runs through (passage)
   finishes   the facade: which material covers which part of an EPS box, by its outer side, a region and lines;
              a later rule wins; anything not covered keeps the material of its kind
   site       the lawn (aroundBuilding: it gives way to the box around the elements) and the surfaces on it
   floors     split by one plane (split): under it the ground floor, over it the attic; a floor's id is its layer;
              rooms are rectangles [x1, x2, y1, y2] at the block faces, tiled on their own or with another room;
              a room's link opens its sub-project, which takes the house's own solids (house-clip.js) inside box
              [x1, x2, y1, y2, z1, z2], trimmed; inside = its floor area, rectangles [x1, x2, y1, y2] at the wall faces
   copy       what a sub-project takes from the house: the element kinds, the window frames and glass, the roof */
window.HOUSE = {
 "name": "Dom w papawerach 5 (G)",
 "source": "Geometria z archon/analysis.md (rzuty archon.pl, ±23 mm), ze zmianami wykonawczymi.",
 "notes": [
  "Bryła według analysis.md: każdy element to prostopadłościan, otwory wycięte ze ścian, które przecinają.",
  "Pompa ciepła zamiast kotła gazowego: jeden komin (salon), bez szachtu wentylacyjnego i drugiego komina.",
  "Zmiany wykonawcze: wnęka prysznica w łazience parteru 1000 × 900 mm (ściany #7, #8, #10 przesunięte), drzwi łazienki na piętrze przesunięte o 200 mm w stronę ogrodu, sufit katedralny nad sypialnią.",
  "Schody wspornikowe (bez policzków), bez ścianki pod biegiem.",
  "Elewacja (grafit, biel, drewno) odczytana z wizualizacji archon: to obraz, nie wymiar."
 ],

 "geometry": {
  "split": 2720,
  "length": 13200,

  "roof": {
   "pitch": 42,
   "eave": 3864,
   "width": 9100,
   "thickness": 640,
   "x": [-1000, 14200],
   "faces": {"top": "roofGraphite", "bottom": "plasterWhite", "ends": "plasterWhite", "eaves": "graphite"},
   "cap": "timber",
   "cuts": ["chimney"],
   "layers": ["roof"],
   "windows": [
    {"name": "Sypialnia", "label": "940/1400", "x": [1550, 2490], "y": [7820, 8860]},
    {"name": "Schody", "label": "940/1400", "x": [6390, 7330], "y": [240, 1280]},
    {"name": "Łazienka", "label": "940/1400", "x": [6390, 7330], "y": [7820, 8860]}
   ],
   "windowFrame": {"width": 70, "frame": [-100, 40], "glass": [5, 15], "material": "frame", "glazing": "glass"},
   "clearHeights": [1400, 2200]
  },

  "kinds": {
   "footing": {"name": "ława", "material": "concrete", "cap": "concrete", "thickness": 400, "layers": ["foundation"]},
   "foundation": {"name": "ściana fundamentowa", "material": "concrete", "cap": "concrete", "thickness": 240, "layers": ["foundation"]},
   "chimneyFoundation": {"name": "fundament komina", "material": "concrete", "cap": "concrete", "layers": ["foundation"]},
   "groundSlab": {"name": "płyta na gruncie", "material": "concrete", "cap": "concrete", "thickness": 360, "layers": ["foundation"], "walkable": true},
   "block240": {"name": "pustak 240 mm", "material": "plasterInside", "cap": "block", "thickness": 240, "layers": ["walls"], "opened": true, "host": true},
   "block120": {"name": "pustak 120 mm", "material": "plasterInside", "cap": "block", "thickness": 120, "layers": ["walls"], "opened": true, "host": true},
   "chimney": {"name": "komin", "material": "plasterInside", "cap": "block", "layers": ["walls"]},
   "eps": {"name": "styropian 200 mm", "material": "plasterWhite", "raw": "insulation", "finish": "facade", "cap": "insulation", "thickness": 200, "layers": ["insulation"], "opened": true},
   "epsSoffit": {"name": "styropian podbitki wnęki 470 mm", "material": "plasterWhite", "raw": "insulation", "finish": "facade", "cap": "insulation", "thickness": 470, "layers": ["insulation"], "opened": true},
   "ringBeam": {"name": "wieniec nad skrzydłem portalu", "material": "plasterInside", "cap": "concrete", "thickness": 240, "layers": ["slabs"]},
   "slab": {"name": "strop z wieńcem", "material": "plasterInside", "cap": "concrete", "thickness": 340, "layers": ["slabs"], "walkable": true},
   "ceiling": {"name": "sufit z ociepleniem", "material": "plasterInside", "cap": "insulation", "thickness": 390, "layers": ["slabs"]}
  },

  "elements": [
   {"id": "footingLeft", "kind": "footing", "b": [-1000, 14200, 20, 620, -1320, -920]},
   {"id": "footingRight", "kind": "footing", "b": [-1000, 14200, 8480, 9080, -1320, -920]},
   {"id": "footingGarden", "kind": "footing", "b": [20, 620, 620, 8480, -1320, -920]},
   {"id": "footingFront", "kind": "footing", "b": [12580, 13180, 620, 4530, -1320, -920]},
   {"id": "footingRecess", "kind": "footing", "b": [11680, 12580, 3930, 4530, -1320, -920]},
   {"id": "footingEntrance", "kind": "footing", "b": [11680, 12280, 4530, 8480, -1320, -920]},
   {"id": "footingWall4", "kind": "footing", "b": [6240, 9430, 3930, 4530, -1320, -920]},
   {"id": "footingWall7", "kind": "footing", "b": [8830, 9430, 4530, 7960, -1320, -920]},
   {"id": "footingWall2", "kind": "footing", "b": [5050, 5650, 620, 3410, -1320, -920]},
   {"id": "footingChimney", "kind": "footing", "b": [4530, 5650, 3410, 4530, -1320, -920]},

   {"id": "foundationLeft", "kind": "foundation", "b": [-800, 14000, 200, 440, -920, 0]},
   {"id": "foundationRight", "kind": "foundation", "b": [-800, 14000, 8660, 8900, -920, 0]},
   {"id": "foundationGarden", "kind": "foundation", "b": [200, 440, 440, 8660, -920, 0]},
   {"id": "foundationFront", "kind": "foundation", "b": [12760, 13000, 440, 4350, -920, 0]},
   {"id": "foundationRecess", "kind": "foundation", "b": [11860, 12760, 4110, 4350, -920, 0]},
   {"id": "foundationEntrance", "kind": "foundation", "b": [11860, 12100, 4350, 8660, -920, 0]},
   {"id": "foundationWall4", "kind": "foundation", "b": [6540, 9250, 4110, 4350, -920, 0]},
   {"id": "foundationWall7", "kind": "foundation", "b": [9010, 9250, 4350, 7660, -920, 0]},
   {"id": "foundationWall2", "kind": "foundation", "b": [5230, 5470, 440, 3590, -920, 0]},
   {"id": "foundationChimney", "kind": "chimneyFoundation", "b": [4710, 5470, 3590, 4350, -920, 0]},

   {"id": "groundSlabGarage", "kind": "groundSlab", "b": [440, 12760, 440, 4110, -360, 0], "cuts": ["foundationWall2", "foundationWall4", "foundationChimney"]},
   {"id": "groundSlabHouse", "kind": "groundSlab", "b": [440, 11860, 4110, 8660, -360, 0], "cuts": ["foundationWall4", "foundationWall7", "foundationChimney"]},

   {"id": "blockLeft", "kind": "block240", "b": [-800, 14000, 200, 440, 0, 2720]},
   {"id": "blockRight", "kind": "block240", "b": [-800, 14000, 8660, 8900, 0, 2720]},
   {"id": "blockGarden", "kind": "block240", "b": [200, 440, 440, 8660, 0, 2720]},
   {"id": "blockGarageFront", "kind": "block240", "b": [12760, 13000, 440, 4350, 0, 2720]},
   {"id": "blockRecess", "kind": "block240", "b": [11860, 12760, 4110, 4350, 0, 2720]},
   {"id": "blockEntrance", "kind": "block240", "b": [11860, 12100, 4350, 8660, 0, 2720]},

   {"id": "epsLeft", "kind": "eps", "b": [-1000, 14200, 0, 200, -920, 9000], "top": "roof", "outer": "-y"},
   {"id": "epsRight", "kind": "eps", "b": [-1000, 14200, 8900, 9100, -920, 9000], "top": "roof", "outer": "+y"},
   {"id": "epsGarden", "kind": "eps", "b": [0, 200, 440, 8660, -920, 9000], "top": "roof", "outer": "-x"},
   {"id": "epsGarageFront", "kind": "eps", "b": [13000, 13200, 440, 4550, -920, 2720], "outer": "+x"},
   {"id": "epsRecessLeft", "kind": "eps", "b": [12300, 13000, 4350, 4550, -920, 2720], "outer": "+y"},
   {"id": "epsEntrance", "kind": "eps", "b": [12100, 12300, 4350, 8460, -920, 2720], "outer": "+x"},
   {"id": "epsRecessRight", "kind": "eps", "b": [12100, 13200, 8460, 8660, -920, 2720], "outer": "-y"},
   {"id": "epsSoffit", "kind": "epsSoffit", "b": [12300, 13200, 4550, 8460, 2250, 2720], "outer": "-z"},
   {"id": "epsFrontGable", "kind": "eps", "b": [13000, 13200, 440, 8660, 2720, 9000], "top": "roof", "outer": "+x"},

   {"id": "epsWingGardenLeft", "kind": "eps", "b": [-800, 0, 440, 640, -920, 9000], "top": "roof", "outer": "+y"},
   {"id": "epsWingGardenRight", "kind": "eps", "b": [-800, 0, 8460, 8660, -920, 9000], "top": "roof", "outer": "-y"},
   {"id": "epsWingFrontLeft", "kind": "eps", "b": [13200, 14000, 440, 640, -920, 9000], "top": "roof", "outer": "+y"},
   {"id": "epsWingFrontRight", "kind": "eps", "b": [13200, 14000, 8460, 8660, -920, 9000], "top": "roof", "outer": "-y"},
   {"id": "epsHeadGardenLeft", "kind": "eps", "b": [-1000, -800, 200, 640, -920, 9000], "top": "roof", "outer": "-x"},
   {"id": "epsHeadGardenRight", "kind": "eps", "b": [-1000, -800, 8460, 8900, -920, 9000], "top": "roof", "outer": "-x"},
   {"id": "epsHeadFrontLeft", "kind": "eps", "b": [14000, 14200, 200, 640, -920, 9000], "top": "roof", "outer": "+x"},
   {"id": "epsHeadFrontRight", "kind": "eps", "b": [14000, 14200, 8460, 8900, -920, 9000], "top": "roof", "outer": "+x"},

   {"id": "chimney", "kind": "chimney", "b": [4710, 5470, 3590, 4350, 0, 9000]},
   {"id": "wall2", "kind": "block240", "b": [5230, 5470, 440, 3590, 0, 2720]},
   {"id": "wall3", "kind": "block120", "b": [6420, 6540, 3200, 4350, 0, 2720]},
   {"id": "wall4", "kind": "block240", "b": [6540, 9250, 4110, 4350, 0, 2720]},
   {"id": "wall5", "kind": "block120", "b": [7220, 7340, 5800, 8660, 0, 2720]},
   {"id": "wall6a", "kind": "block120", "b": [7340, 9010, 6150, 6270, 0, 2720]},
   {"id": "wall6b", "kind": "block120", "b": [9250, 11860, 6150, 6270, 0, 2720]},
   {"id": "wall7", "kind": "block240", "b": [9010, 9250, 4350, 7660, 0, 2720]},
   {"id": "wall8", "kind": "block120", "b": [9250, 9850, 7540, 7660, 0, 2720]},
   {"id": "wall9", "kind": "block120", "b": [9250, 11860, 4110, 4230, 0, 2720]},
   {"id": "wall10", "kind": "block120", "b": [9850, 9970, 7540, 8660, 0, 2720]},

   {"id": "slab", "kind": "slab", "b": [200, 13000, 200, 8900, 2720, 3060], "cuts": ["stairVoid", "chimney"]},
   {"id": "beamWingGardenLeft", "kind": "ringBeam", "b": [-800, 200, 200, 440, 2720, 3060]},
   {"id": "beamWingGardenRight", "kind": "ringBeam", "b": [-800, 200, 8660, 8900, 2720, 3060]},
   {"id": "beamWingFrontLeft", "kind": "ringBeam", "b": [13000, 14000, 200, 440, 2720, 3060]},
   {"id": "beamWingFrontRight", "kind": "ringBeam", "b": [13000, 14000, 8660, 8900, 2720, 3060]},

   {"id": "kneeLeft", "kind": "block240", "b": [-800, 14000, 200, 440, 3060, 9000], "top": "roof"},
   {"id": "kneeRight", "kind": "block240", "b": [-800, 14000, 8660, 8900, 3060, 9000], "top": "roof"},
   {"id": "gableGarden", "kind": "block240", "b": [200, 440, 440, 8660, 3060, 9000], "top": "roof"},
   {"id": "gableFront", "kind": "block240", "b": [12760, 13000, 440, 8660, 3060, 9000], "top": "roof"},
   {"id": "ceiling", "kind": "ceiling", "b": [3760, 12760, 440, 8660, 5910, 6300], "top": "roof", "cuts": ["chimney"]},
   {"id": "loftWall", "kind": "block120", "b": [3640, 3760, 440, 8660, 5910, 9000], "top": "roof"},

   {"id": "attic1", "kind": "block120", "b": [3640, 3760, 440, 3910, 3060, 5910], "top": "roof"},
   {"id": "attic2", "kind": "block120", "b": [3640, 3760, 5530, 8660, 3060, 5910], "top": "roof"},
   {"id": "attic3a", "kind": "block120", "b": [4660, 5350, 5530, 5650, 3060, 5910], "top": "roof"},
   {"id": "attic3b", "kind": "block120", "b": [5470, 9010, 5530, 5650, 3060, 5910], "top": "roof"},
   {"id": "attic5", "kind": "block120", "b": [5350, 5470, 440, 3590, 3060, 5910], "top": "roof"},
   {"id": "attic6", "kind": "block120", "b": [5350, 5470, 4350, 8660, 3060, 5910], "top": "roof"},
   {"id": "attic7", "kind": "block120", "b": [7370, 7490, 440, 3410, 3060, 5910], "top": "roof"},
   {"id": "attic8", "kind": "block120", "b": [7490, 9010, 3290, 3410, 3060, 5910], "top": "roof"},
   {"id": "attic9", "kind": "block120", "b": [8200, 8320, 5650, 8660, 3060, 5910], "top": "roof"},
   {"id": "attic12", "kind": "block120", "b": [9010, 9130, 440, 6490, 3060, 5910], "top": "roof"},
   {"id": "attic13", "kind": "block120", "b": [9130, 12760, 4410, 4530, 3060, 5910], "top": "roof"}
  ],

  "voids": [
   {"id": "stairVoid", "name": "otwór schodów", "boxes": [[5470, 6420, 440, 4350, 2720, 3060], [6420, 7370, 440, 2730, 2720, 3060]]}
  ],

  "openingKinds": {
   "window": {"glazed": {"sill": true}},
   "glassDoor": {"glazed": {"sill": false}, "passage": true},
   "gate": {"leaf": "gate"},
   "entrance": {"leaf": "entrance", "glazed": {"sill": false}, "passage": true},
   "door": {"passage": true}
  },
  "openings": [
   {"kind": "window", "label": "6000/2400", "b": [0, 440, 1550, 7550, 0, 2400], "outer": "-x", "cols": 4},
   {"kind": "window", "label": "2000/1000", "b": [7620, 9620, 0, 440, 1100, 2100], "outer": "-y"},
   {"kind": "window", "label": "2500/2400", "b": [830, 3330, 8660, 9100, 0, 2400], "outer": "+y"},
   {"kind": "window", "label": "1900/1300", "b": [4720, 6620, 8660, 9100, 1100, 2400], "outer": "+y", "cols": 2},
   {"kind": "window", "label": "1000/1300", "b": [8030, 9030, 8660, 9100, 1100, 2400], "outer": "+y"},
   {"kind": "gate", "label": "2750/2250", "b": [12760, 13200, 1150, 3900, 0, 2250], "outer": "+x"},
   {"kind": "entrance", "label": "1600/2100", "b": [11860, 12300, 4550, 6150, 0, 2100], "outer": "+x", "leaf": 1000},
   {"kind": "glassDoor", "label": "800/2100", "b": [11860, 12300, 6610, 7410, 0, 2100], "outer": "+x"},
   {"kind": "door", "label": "870/2050", "b": [10640, 11510, 4110, 4230, 0, 2050]},
   {"kind": "door", "label": "920/2050", "b": [9010, 9250, 4880, 5800, 0, 2050]},
   {"kind": "door", "label": "900/2050", "b": [7760, 8660, 6150, 6270, 0, 2050]},
   {"kind": "door", "label": "920/2050", "b": [10640, 11560, 6150, 6270, 0, 2050]},
   {"kind": "window", "label": "6000/3460", "b": [0, 440, 1550, 7550, 3060, 6520], "outer": "-x", "cols": 4,
    "below": [{"z": 6520, "y": 4550, "pitch": 1}, {"z": 6520, "y": 4550, "pitch": -1}]},
   {"kind": "window", "label": "2200/2850", "b": [12760, 13200, 1680, 3880, 3060, 5910], "outer": "+x", "cols": 2, "transoms": [3900],
    "below": [{"z": 5910, "y": 3880, "pitch": 1}]},
   {"kind": "window", "label": "2200/2850", "b": [12760, 13200, 5220, 7420, 3060, 5910], "outer": "+x", "cols": 2, "transoms": [3900],
    "below": [{"z": 5910, "y": 5220, "pitch": -1}]},
   {"kind": "door", "label": "890/2050", "b": [5350, 5470, 4590, 5480, 3060, 5110]},
   {"kind": "door", "label": "900/2050", "b": [6300, 7200, 5530, 5650, 3060, 5110]},
   {"kind": "door", "label": "820/2050", "b": [9010, 9130, 1780, 2600, 3060, 5110]},
   {"kind": "door", "label": "940/2050", "b": [9010, 9130, 3470, 4410, 3060, 5110]},
   {"kind": "door", "label": "900/2050", "b": [9010, 9130, 4570, 5470, 3060, 5110]}
  ],
  "frames": {
   "width": 70, "depth": 80, "bar": 60, "glassDepth": 10, "material": "frame", "glass": "glass", "layers": ["openings"],
   "leaves": {
    "gate": {"material": "graphite", "depth": [20, 60], "grooves": 4, "groove": "groove", "grooveDepth": [16, 20], "grooveHeight": 16},
    "entrance": {"material": "graphite", "depth": [10, 70], "grooves": 4, "groove": "groove", "grooveDepth": [6, 10], "grooveHeight": 12,
     "handle": {"length": 1200, "width": 30, "depth": [-40, 10], "inset": 140, "centre": 1150, "material": "steel"}}
   }
  },

  "finishes": [
   {"z": [-9990, 0], "material": "plinth"},
   {"side": "-x", "y": [640, 8460], "z": [0, 9990], "material": "graphite"},
   {"side": "-x", "y": [1550, 7550], "z": [2400, 3060], "material": "woodHorizontal"},
   {"side": "+x", "y": [640, 8460], "z": [0, 9990], "material": "graphite"},
   {"side": "+x", "x": [13000, 13200], "y": [640, 8460], "z": [2250, 3060], "material": "plasterWhite"},
   {"side": "+x", "x": [13000, 13200], "y": [3880, 5220], "z": [3060, 9990], "material": "woodVertical",
    "below": [{"z": 5910, "y": 3880, "pitch": 1}, {"z": 5910, "y": 5220, "pitch": -1}]},
   {"side": "+x", "x": [12100, 12300], "y": [6150, 6610], "z": [0, 2720], "material": "woodVertical"},
   {"side": "+x", "x": [12100, 12300], "y": [7410, 8460], "z": [0, 2720], "material": "woodVertical"},
   {"side": "+y", "x": [12300, 13000], "y": [4350, 4550], "z": [0, 2720], "material": "graphite"},
   {"side": "-y", "x": [12100, 13200], "y": [8460, 8660], "z": [0, 2720], "material": "graphite"},
   {"side": "-z", "x": [12100, 13000], "material": "graphite"},
   {"side": "+y", "x": [3330, 9030], "z": [0, 2400], "material": "graphite"},
   {"side": "-y", "x": [1270, 9640], "z": [0, 2400], "material": "graphite"},
   {"elements": ["chimney"], "z": [7000, 9990], "material": "graphite"}
  ],

  "stair": {
   "risers": 17,
   "tread": 50,
   "material": "tread",
   "layers": ["stair"],
   "walkable": true,
   "flights": [
    {"x": [5470, 6420], "y": [4350, 1435], "first": 1, "count": 11},
    {"x": [5470, 7370], "y": [440, 1435], "first": 12, "count": 1},
    {"x": [6420, 7370], "y": [1435, 2730], "first": 13, "count": 4}
   ]
  },

  "site": {
   "lawn": {"rect": [-15000, 29000, -15000, 24000], "z": -320, "depth": 200, "material": "lawn", "aroundBuilding": true},
   "surfaces": [
    {"name": "taras ogrodowy", "rect": [-2500, -1000, 300, 8800], "z": -20, "material": "woodHorizontal"},
    {"name": "taras pod portalem", "rect": [-1000, 0, 640, 8460], "z": -20, "material": "woodHorizontal"},
    {"name": "wejście", "rect": [12300, 14200, 4550, 8460], "z": -20, "material": "paving"},
    {"name": "podjazd", "rect": [13200, 17200, 640, 4500], "z": -120, "material": "paving"},
    {"name": "dojście", "rect": [14200, 17200, 4780, 5980], "z": -120, "material": "paving"}
   ],
   "layers": ["site"],
   "walkable": true
  },

  "floors": [
   {
    "id": "ground", "name": "Parter", "level": 0, "top": 2720,
    "inside": [[440, 12760, 440, 4110], [440, 11860, 4110, 8660]],
    "rooms": [
     {"id": "salon", "numbers": [3, 5, 6], "name": "Salon z kuchnią i holem", "planArea": 50.55,
      "tiles": {"product": "paradyz-authority-graphite", "dir": "x"},
      "link": {"href": "../kitchen/view.html", "name": "Projekt kuchni", "inside": [[3330, 7220, 4660, 8660]], "box": [3330, 7340, 4660, 8900, -360, 3060]},
      "rects": [[440, 5230, 440, 3590], [440, 4710, 3590, 4350], [440, 5470, 4350, 8660], [5470, 7220, 4350, 8660], [7220, 7340, 4350, 5800], [7340, 9010, 4350, 6150]]},
     {"id": "wiatrolap", "numbers": [1], "name": "Wiatrołap", "planArea": 4.84,
      "tiles": {"product": "paradyz-authority-graphite", "dir": "x"},
      "rects": [[9250, 11860, 4230, 6150]]},
     {"id": "lazienka", "numbers": [7], "name": "Łazienka", "planArea": 4.95,
      "tiles": {"product": "paradyz-authority-grey", "dir": "x"},
      "link": {"href": "../bathroom/view.html", "name": "Projekt łazienki", "inside": [[7340, 9010, 6270, 8660], [9010, 9850, 7660, 8660]], "box": [7220, 9970, 6150, 8900, -360, 3060]},
      "rects": [[7340, 9010, 6270, 8660], [9010, 9850, 7660, 8660]]},
     {"id": "kotlownia", "numbers": [8], "name": "Kotłownia z pralnią", "planArea": 4.97,
      "tiles": {"product": "paradyz-authority-graphite", "dir": "x"},
      "rects": [[9250, 11860, 6270, 7540], [9970, 11860, 7540, 8660]]},
     {"id": "garaz", "numbers": [2], "name": "Garaż", "planArea": 25.91,
      "rects": [[5470, 6420, 440, 2970], [6420, 6540, 440, 3200], [6540, 12760, 440, 4110]]}
    ],
    "other": [{"name": "Schody", "rects": [[5470, 6420, 2970, 4350]]}]
   },
   {
    "id": "attic", "name": "Piętro", "level": 3060,
    "inside": [[440, 12760, 440, 8660]],
    "rooms": [
     {"id": "sypialnia", "numbers": [2], "name": "Sypialnia", "planArea": 28.16,
      "tiles": {"product": "atlas-log-icon-oak-forest", "dir": "x"},
      "rects": [[440, 3640, 440, 8660], [3640, 3760, 3910, 5530], [3760, 4710, 3790, 5530], [3760, 4660, 5530, 5650], [4710, 5350, 4350, 5530]]},
     {"id": "garderoba3", "numbers": [3], "name": "Garderoba", "planArea": 5.13, "tilesWith": "sypialnia",
      "rects": [[3760, 4710, 440, 3790], [4710, 5350, 440, 3590]]},
     {"id": "garderoba4", "numbers": [4], "name": "Garderoba", "planArea": 4.60, "tilesWith": "sypialnia",
      "rects": [[3760, 5350, 5650, 8660]]},
     {"id": "hol", "numbers": [1], "name": "Hol", "planArea": 7.32,
      "tiles": {"product": "atlas-log-icon-oak-forest", "dir": "x"},
      "rects": [[6420, 7370, 2730, 3410], [6420, 9010, 3410, 5530], [5470, 6420, 4350, 5530]]},
     {"id": "lazienka5", "numbers": [5], "name": "Łazienka", "planArea": 7.99,
      "tiles": {"product": "paradyz-authority-grey", "dir": "x"},
      "link": {"href": "../bathroom/view.html", "name": "Projekt łazienki", "inside": [[5470, 8200, 5650, 8660]], "box": [5350, 8320, 5530, 8900, 2720, 6300]},
      "rects": [[5470, 8200, 5650, 8660]]},
     {"id": "garderoba8", "numbers": [8], "name": "Garderoba", "planArea": 4.16,
      "tiles": {"product": "atlas-log-icon-oak-forest", "dir": "x"},
      "rects": [[7490, 9010, 440, 3290]]},
     {"id": "pokoj7", "numbers": [7], "name": "Pokój", "planArea": 14.11,
      "tiles": {"product": "atlas-log-icon-oak-forest", "dir": "x"},
      "rects": [[9130, 12760, 440, 4410]]},
     {"id": "pokoj6", "numbers": [6], "name": "Pokój", "planArea": 16.53,
      "tiles": {"product": "atlas-log-icon-oak-forest", "dir": "x"},
      "rects": [[9130, 12760, 4530, 8660], [8320, 9130, 6490, 8660], [8320, 9010, 5650, 6490]]}
    ],
    "other": []
   }
  ],

  "copy": {"kinds": ["groundSlab", "foundation", "chimneyFoundation", "block240", "block120", "chimney", "slab", "ringBeam", "ceiling"], "fixtures": true, "roof": true},

  "tiles": {"reserve": 0.1, "grout": 2, "top": 3, "mark": 5, "layers": ["floors"], "small": ["cuts"]}
 },

 "layers": {
  "ground": {"name": "Parter"},
  "attic": {"name": "Piętro"},
  "roof": {"name": "Dach"},
  "foundation": {"name": "Fundament"},
  "walls": {"name": "Pustaki"},
  "slabs": {"name": "Wieniec i strop"},
  "insulation": {"name": "Styropian", "layers": {"facade": {"name": "Elewacja"}}},
  "openings": {"name": "Okna i drzwi"},
  "stair": {"name": "Schody"},
  "floors": {"name": "Posadzki", "layers": {"cuts": {"name": "Drobne docinki (czerwone)"}}},
  "site": {"name": "Teren"},
  "edges": {"name": "Krawędzie"}
 },

 "views": {
  "3d": {
   "name": "3D",
   "menu": ["ground", "attic", "roof"],
   "layers": ["foundation", "walls", "slabs", "insulation", "openings", "stair", "floors", "site", "edges"],
   "panels": ["cut", "light", "layers", "rooms", "notes"],
   "roomsNote": "Powierzchnia z modelu (lica pustaków) · archon.",
   "cut": {"attic": 1500},
   "cutFrom": 500,
   "cutStep": 50,
   "edges": {"color": "#7d807b", "opacity": 0.45, "layers": ["edges"]},
   "light": {
    "exposure": 0.85,
    "sun": {"azimuth": 330, "elevation": 38, "intensity": 1.35, "color": "#fff1dc"},
    "sky": {
     "intensity": 0.6,
     "color": "#cfe0ff",
     "groundColor": "#a9a596",
     "gradient": [[0, "#5f8fc4"], [0.32, "#9dbfe0"], [0.49, "#e4ecef"], [0.51, "#b7bfae"], [1, "#6f7a5e"]]
    },
    "fog": {"color": "#dfe7ea", "near": 60000, "far": 160000}
   },
   "cameras": {
    "all": [
     {"name": "Od frontu", "eye": [27500, -6500, 4200], "target": [6600, 4550, 3300]},
     {"name": "Od ogrodu", "eye": [-13500, 13500, 3800], "target": [5000, 4550, 3300]},
     {"name": "Z góry", "eye": [23000, -11500, 17500], "target": [6600, 4550, 2500]}
    ],
    "ground": [
     {"name": "Rzut", "eye": [6660, 4550, 23000], "target": [6600, 4550, 0]},
     {"name": "Perspektywa", "eye": [19000, -6500, 10500], "target": [6200, 4550, 600]},
     {"name": "Salon", "eye": [900, 8300, 1600], "target": [5200, 3000, 900]},
     {"name": "Wejście", "eye": [11500, 5400, 1600], "target": [6500, 5200, 1000]}
    ],
    "attic": [
     {"name": "Rzut", "eye": [6660, 4550, 23000], "target": [6600, 4550, 0]},
     {"name": "Perspektywa", "eye": [19000, -6500, 10500], "target": [6200, 4550, 600]},
     {"name": "Sypialnia", "eye": [3300, 8200, 1600], "target": [800, 2000, 600]},
     {"name": "Hol", "eye": [8800, 5200, 1600], "target": [5600, 4700, 600]},
     {"name": "Pokoje", "eye": [12400, 4500, 1600], "target": [9300, 7000, 600]}
    ]
   },
   "walk": {"eye": 1600, "radius": 220, "step": 360, "headroom": 100, "speed": 1400, "turn": 90, "look": 50, "run": 2.2, "start": {"x": 11200, "y": 5200, "heading": 180}}
  },
  "2d": {
   "name": "2D",
   "plan": true,
   "cut": {"ground": 1500, "attic": 800},
   "note": "Ogród u góry, front u dołu. Kreskowanie: styropian.",
   "panels": ["plan", "notes"]
  },
  "analysis": {
   "name": "Analiza",
   "analysis": true,
   "panels": ["notes"]
  }
 }
};
