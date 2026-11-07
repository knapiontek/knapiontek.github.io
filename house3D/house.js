/* "Dom w papawerach 5 (G)" - the building as data: the boxes of estimate/estimate.md, with the as-built changes (§ 14).
   view.html holds no numbers, names or colours of this house; it draws this file with materials.js and textures.js.

   Units cm. Axes as in the estimate: x along the house (0 = garden outer face, 1320 = front outer face), y across
   (0 = left outer face, garage side; 910 = right), z up (0 = finished ground floor).

   b         a box [x1, x2, y1, y2, z1, z2]
   line      {z, y, pitch}: the line z = z + pitch · tan(roof pitch) · (y' - y) in the y-z plane (pitch +1 or -1);
             {z, y, slope}: the same with a slope of its own (the stair underside)
   poly      a vertical prism over a plan polygon [[x, y], ...] (the one exception to boxes: the diagonal stair wall)
   below     lines a solid stays under; above: lines it stays over
   top       "roof": the box is cut by the two roof planes (its top follows the roof underside)
   cuts      ids of other elements or boxes subtracted from this one (the slab without the stair void, ...)
   outer     the side of an EPS box that faces the air: -x garden, +x front, -y left, +y right, -z down
   kinds     what an element is: material of its faces, its section colour (cap), thickness (checked), layer
   floors    split by one plane: everything under "split" is the ground floor, everything over it the attic
   openings  boxes cut out of every wall and EPS box they cross; label = archon width/height; outer = side to the air
   finishes  the facade: which material covers which part of an EPS box (by its outer side, a box, lines);
             a later rule wins; anything not covered is the default finish of the kind */
window.HOUSE = {
 "name": "Dom w papawerach 5 (G)",
 "source": "Geometria z estimate/estimate.md (rzuty archon.pl, ±2,3 cm), ze zmianami wykonawczymi.",
 "notes": [
  "Bryła według estimate.md: każdy element to prostopadłościan, otwory wycięte z ścian, które przecinają.",
  "Zmiany wykonawcze: wnęka prysznica w łazience parteru 100 × 90 (ściany #7, #8, #10 przesunięte), drzwi łazienki na piętrze przesunięte o 20 cm w stronę ogrodu.",
  "Ukośna ścianka pod schodami w garażu to jedyny element nie-prostopadłościenny; schody są wspornikowe (bez policzków).",
  "Elewacja (grafit, biel, drewno) odczytana z wizualizacji archon - to obraz, nie wymiar."
 ],

 "views": {
  "3d": {
   "name": "3D",
   "levels": ["ground", "attic", "roof"],
   "offer": ["foundation", "walls", "slabs", "insulation", "openings", "stair", "floors", "site", "edges"],
   "panels": ["cut", "light", "layers", "rooms", "checks", "notes"],
   "cutStep": 5,
   "cutFrom": 50,
   "selectRooms": true,
   "walk": true
  },
  "2d": {"name": "2D", "plan": true, "cut": 150, "panels": ["plan", "checks", "notes"]}
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

 "floors": [
  {
   "id": "ground", "name": "Parter", "level": 0, "top": 272, "layers": ["ground"],
   "inside": [[44, 1276, 44, 411], [44, 1186, 411, 866]],
   "rooms": [
    {"id": "salon", "numbers": [3, 5, 6], "name": "Salon z kuchnią i holem", "planArea": 50.55,
     "tiles": {"product": "authorityGraphite", "dir": "x"},
     "link": {"href": "../kitchen/view.html", "name": "Projekt kuchni"},
     "rects": [[44, 535, 44, 379], [44, 471, 379, 455], [44, 547, 455, 866], [547, 722, 435, 866], [722, 734, 435, 580], [734, 901, 435, 589], [734, 873, 589, 615]]},
    {"id": "wiatrolap", "numbers": [1], "name": "Wiatrołap", "planArea": 4.84,
     "tiles": {"product": "authorityGraphite", "dir": "x"},
     "rects": [[925, 1186, 423, 615]]},
    {"id": "lazienka", "numbers": [7], "name": "Łazienka", "planArea": 4.95,
     "tiles": {"product": "authorityGraphite", "dir": "x"},
     "link": {"href": "../bath/view.html", "name": "Projekt łazienki"},
     "rects": [[734, 901, 627, 866], [901, 985, 766, 866]]},
    {"id": "kotlownia", "numbers": [8], "name": "Kotłownia z pralnią", "planArea": 4.97,
     "tiles": {"product": "authorityGraphite", "dir": "x"},
     "rects": [[925, 1186, 627, 754], [997, 1186, 754, 866]]},
    {"id": "garaz", "numbers": [2], "name": "Garaż", "planArea": 25.91,
     "rects": [[547, 642, 44, 297], [642, 654, 44, 320], [654, 1276, 44, 411]]}
   ],
   "other": [{"name": "Schody", "rects": [[547, 642, 297, 435]]}]
  },
  {
   "id": "attic", "name": "Piętro", "level": 306, "layers": ["attic"],
   "inside": [[44, 1276, 44, 866]],
   "rooms": [
    {"id": "sypialnia", "numbers": [2], "name": "Sypialnia", "planArea": 28.16,
     "tiles": {"product": "logOak", "dir": "x"},
     "rects": [[44, 364, 44, 866], [364, 376, 391, 553], [376, 471, 379, 553], [376, 466, 553, 565], [471, 535, 455, 553]]},
    {"id": "garderoba3", "numbers": [3], "name": "Garderoba", "planArea": 5.13, "tilesWith": "sypialnia",
     "rects": [[376, 535, 44, 379]]},
    {"id": "garderoba4", "numbers": [4], "name": "Garderoba", "planArea": 4.60, "tilesWith": "sypialnia",
     "rects": [[376, 535, 565, 866]]},
    {"id": "hol", "numbers": [1], "name": "Hol", "planArea": 7.32,
     "tiles": {"product": "logOak", "dir": "x"},
     "rects": [[642, 737, 273, 341], [642, 901, 341, 553], [547, 642, 438, 553]]},
    {"id": "lazienka5", "numbers": [5], "name": "Łazienka", "planArea": 7.99,
     "tiles": {"product": "authorityGrey80", "dir": "x"},
     "link": {"href": "../bath/view.html", "name": "Projekt łazienki"},
     "rects": [[547, 820, 565, 866]]},
    {"id": "garderoba8", "numbers": [8], "name": "Garderoba", "planArea": 4.16,
     "tiles": {"product": "logOak", "dir": "x"},
     "rects": [[749, 901, 44, 329]]},
    {"id": "pokoj7", "numbers": [7], "name": "Pokój", "planArea": 14.11,
     "tiles": {"product": "logOak", "dir": "x"},
     "rects": [[913, 1276, 44, 441]]},
    {"id": "pokoj6", "numbers": [6], "name": "Pokój", "planArea": 16.53,
     "tiles": {"product": "logOak", "dir": "x"},
     "rects": [[913, 1276, 453, 866], [832, 913, 649, 866], [832, 889, 626, 649]]}
   ],
   "other": []
  }
 ],
 "split": 272,

 "roof": {
  "pitch": 42,
  "eave": 386.4,
  "width": 910,
  "thickness": 64.6,
  "x": [-100, 1420],
  "faces": {"top": "roofGraphite", "bottom": "plasterWhite", "ends": "plasterWhite", "eaves": "graphite"},
  "cap": "timber",
  "cuts": ["chimney", "ventAttic"],
  "windows": [
   {"name": "Sypialnia", "label": "94/140", "x": [155, 249], "y": [782, 886]},
   {"name": "Schody", "label": "94/140", "x": [639, 733], "y": [24, 128]},
   {"name": "Łazienka", "label": "94/140", "x": [639, 733], "y": [782, 886]}
  ],
  "windowFrame": {"width": 7, "material": "frame", "glass": "glass"},
  "layers": ["roof"],
  "planHeights": [140, 220]
 },

 "kinds": {
  "footing": {"name": "ława", "material": "concrete", "cap": "concrete", "thickness": 40, "layers": ["foundation"]},
  "foundation": {"name": "ściana fundamentowa", "material": "concrete", "cap": "concrete", "thickness": 24, "layers": ["foundation"]},
  "groundSlab": {"name": "płyta na gruncie", "material": "concrete", "cap": "concrete", "thickness": 36, "layers": ["foundation"]},
  "block24": {"name": "pustak 24", "material": "plasterInside", "cap": "block", "thickness": 24, "layers": ["walls"]},
  "block12": {"name": "pustak 12", "material": "plasterInside", "cap": "block", "thickness": 12, "layers": ["walls"]},
  "wing": {"name": "skrzydło portalu (pustak 24)", "material": "plasterWhite", "cap": "block", "thickness": 24, "layers": ["walls"]},
  "eps": {"name": "styropian 20", "material": "plasterWhite", "raw": "insulation", "cap": "insulation", "thickness": 20, "finish": "facade", "layers": ["insulation"]},
  "slab": {"name": "strop z wieńcem", "material": "plasterInside", "cap": "concrete", "thickness": 34, "layers": ["slabs"]},
  "ceiling": {"name": "sufit z ociepleniem", "material": "plasterInside", "cap": "insulation", "thickness": 39, "layers": ["slabs"]},
  "chimney": {"name": "komin", "material": "plasterInside", "cap": "block", "layers": ["walls"]},
  "shaft": {"name": "szacht wentylacyjny", "material": "plasterInside", "cap": "block", "layers": ["walls"]},
  "diagonal": {"name": "ścianka ukośna pod schodami", "material": "plasterInside", "cap": "block", "thickness": 12, "layers": ["walls"]}
 },

 "elements": [
  {"id": "footingLeft", "kind": "footing", "b": [-100, 1420, 2, 62, -132, -92]},
  {"id": "footingRight", "kind": "footing", "b": [-100, 1420, 848, 908, -132, -92]},
  {"id": "footingGarden", "kind": "footing", "b": [2, 62, 62, 848, -132, -92]},
  {"id": "footingFront", "kind": "footing", "b": [1258, 1318, 62, 453, -132, -92]},
  {"id": "footingRecess", "kind": "footing", "b": [1168, 1258, 393, 453, -132, -92]},
  {"id": "footingEntrance", "kind": "footing", "b": [1168, 1228, 453, 848, -132, -92]},
  {"id": "footingWall4", "kind": "footing", "b": [624, 943, 393, 453, -132, -92]},
  {"id": "footingWall7", "kind": "footing", "b": [883, 943, 453, 796, -132, -92]},
  {"id": "footingChimney", "kind": "footing", "b": [461, 557, 369, 465, -132, -92]},

  {"id": "foundationLeft", "kind": "foundation", "b": [20, 1300, 20, 44, -92, 0]},
  {"id": "foundationRight", "kind": "foundation", "b": [20, 1420, 866, 890, -92, 0], "note": "z prawą ścianą wnęki i prawym skrzydłem frontu"},
  {"id": "foundationWingGardenLeft", "kind": "foundation", "b": [-100, 0, 20, 44, -92, 0]},
  {"id": "foundationWingGardenRight", "kind": "foundation", "b": [-100, 0, 866, 890, -92, 0]},
  {"id": "foundationWingFrontLeft", "kind": "foundation", "b": [1320, 1420, 20, 44, -92, 0]},
  {"id": "foundationGarden", "kind": "foundation", "b": [20, 44, 44, 866, -92, 0]},
  {"id": "foundationFront", "kind": "foundation", "b": [1276, 1300, 44, 435, -92, 0]},
  {"id": "foundationRecess", "kind": "foundation", "b": [1186, 1276, 411, 435, -92, 0]},
  {"id": "foundationEntrance", "kind": "foundation", "b": [1186, 1210, 435, 866, -92, 0]},
  {"id": "foundationWall4", "kind": "foundation", "b": [654, 925, 411, 435, -92, 0]},
  {"id": "foundationWall7", "kind": "foundation", "b": [901, 925, 435, 766, -92, 0]},

  {"id": "groundSlabGarage", "kind": "groundSlab", "b": [44, 1276, 44, 411, -36, 0], "cuts": ["foundationWall4", "chimney"]},
  {"id": "groundSlabHouse", "kind": "groundSlab", "b": [44, 1186, 411, 866, -36, 0], "cuts": ["foundationWall4", "foundationWall7", "chimney"]},

  {"id": "blockLeft", "kind": "block24", "b": [20, 1300, 20, 44, 0, 272]},
  {"id": "blockRight", "kind": "block24", "b": [20, 1320, 866, 890, 0, 272], "note": "biegnie dalej jako prawa ściana wnęki wejścia"},
  {"id": "blockGarden", "kind": "block24", "b": [20, 44, 44, 866, 0, 272]},
  {"id": "blockGarageFront", "kind": "block24", "b": [1276, 1300, 44, 435, 0, 272]},
  {"id": "blockRecess", "kind": "block24", "b": [1186, 1276, 411, 435, 0, 272]},
  {"id": "blockEntrance", "kind": "block24", "b": [1186, 1210, 435, 866, 0, 272]},

  {"id": "epsLeft", "kind": "eps", "b": [-100, 1420, 0, 20, -92, 900], "top": "roof", "outer": "-y"},
  {"id": "epsRight", "kind": "eps", "b": [-100, 1420, 890, 910, -92, 900], "top": "roof", "outer": "+y"},
  {"id": "epsGarden", "kind": "eps", "b": [0, 20, 20, 890, -92, 900], "top": "roof", "outer": "-x"},
  {"id": "epsGarageFront", "kind": "eps", "b": [1300, 1320, 20, 455, -92, 272], "outer": "+x"},
  {"id": "epsRecessLeft", "kind": "eps", "b": [1230, 1300, 435, 455, -92, 272], "outer": "+y"},
  {"id": "epsEntrance", "kind": "eps", "b": [1210, 1230, 435, 846, -92, 272], "outer": "+x"},
  {"id": "epsRecessRight", "kind": "eps", "b": [1210, 1320, 846, 866, -92, 272], "outer": "-y"},
  {"id": "epsSoffit", "kind": "eps", "b": [1230, 1320, 455, 846, 252, 272], "outer": "-z"},
  {"id": "epsFrontGable", "kind": "eps", "b": [1300, 1320, 20, 890, 272, 900], "top": "roof", "outer": "+x"},

  {"id": "wingGardenLeft", "kind": "wing", "b": [-100, 0, 20, 44, 0, 900], "top": "roof"},
  {"id": "wingGardenRight", "kind": "wing", "b": [-100, 0, 866, 890, 0, 900], "top": "roof"},
  {"id": "wingFrontLeft", "kind": "wing", "b": [1320, 1420, 20, 44, 0, 900], "top": "roof"},
  {"id": "wingFrontRight", "kind": "wing", "b": [1320, 1420, 866, 890, 0, 900], "top": "roof"},
  {"id": "epsWingGardenLeft", "kind": "eps", "b": [-100, 0, 44, 64, -92, 900], "top": "roof", "outer": "+y"},
  {"id": "epsWingGardenRight", "kind": "eps", "b": [-100, 0, 846, 866, -92, 900], "top": "roof", "outer": "-y"},
  {"id": "epsWingFrontLeft", "kind": "eps", "b": [1320, 1420, 44, 64, -92, 900], "top": "roof", "outer": "+y"},
  {"id": "epsWingFrontRight", "kind": "eps", "b": [1320, 1420, 846, 866, -92, 900], "top": "roof", "outer": "-y"},

  {"id": "chimney", "kind": "chimney", "b": [471, 547, 379, 455, -92, 900], "note": "jedna bryła od ławy przez oba piętra i dach"},
  {"id": "wall2", "kind": "block12", "b": [535, 547, 44, 379, 0, 272]},
  {"id": "wall3", "kind": "block12", "b": [642, 654, 320, 435, 0, 272]},
  {"id": "wall4", "kind": "block24", "b": [654, 925, 411, 435, 0, 272]},
  {"id": "wall5", "kind": "block12", "b": [722, 734, 580, 866, 0, 272]},
  {"id": "wall6a", "kind": "block12", "b": [734, 901, 615, 627, 0, 272]},
  {"id": "wall6b", "kind": "block12", "b": [925, 1186, 615, 627, 0, 272]},
  {"id": "wall7", "kind": "block24", "b": [901, 925, 435, 766, 0, 272], "note": "przechodzi przez #6; zbudowana do y 766"},
  {"id": "wall8", "kind": "block12", "b": [925, 985, 754, 766, 0, 272], "note": "przesunięta: wnęka prysznica 100 × 90"},
  {"id": "wall9", "kind": "block12", "b": [925, 1186, 411, 423, 0, 272]},
  {"id": "wall10", "kind": "block12", "b": [985, 997, 754, 866, 0, 272], "note": "skrócona: od y 754"},
  {"id": "ventGround", "kind": "shaft", "b": [873, 901, 589, 615, 0, 306]},
  {"id": "stairWall", "kind": "diagonal", "poly": [[547, 264.2], [642, 316.2], [642, 329.8], [547, 277.8]], "z": [0, 272],
   "below": [{"z": 289.5, "y": 0, "slope": -0.679}],
   "note": "ukośna, od (547, 271) do (642, 323); góra pod biegiem schodów"},

  {"id": "slab", "kind": "slab", "b": [20, 1300, 20, 890, 272, 306],
   "cuts": [[547, 642, 44, 438, 272, 306], [642, 737, 44, 273, 272, 306], "chimney", "ventGround"]},

  {"id": "kneeLeft", "kind": "block24", "b": [20, 1300, 20, 44, 306, 900], "top": "roof"},
  {"id": "kneeRight", "kind": "block24", "b": [20, 1300, 866, 890, 306, 900], "top": "roof"},
  {"id": "gableGarden", "kind": "block24", "b": [20, 44, 44, 866, 306, 900], "top": "roof"},
  {"id": "gableFront", "kind": "block24", "b": [1276, 1300, 44, 866, 306, 900], "top": "roof"},
  {"id": "ceiling", "kind": "ceiling", "b": [44, 1276, 44, 866, 591, 630], "top": "roof", "cuts": ["chimney", "ventAttic"]},

  {"id": "attic1", "kind": "block12", "b": [364, 376, 44, 391, 306, 591], "top": "roof"},
  {"id": "attic2", "kind": "block12", "b": [364, 376, 553, 866, 306, 591], "top": "roof"},
  {"id": "attic3a", "kind": "block12", "b": [466, 535, 553, 565, 306, 591], "top": "roof"},
  {"id": "attic3b", "kind": "block12", "b": [547, 901, 553, 565, 306, 591], "top": "roof", "note": "#6 przechodzi przez #3"},
  {"id": "attic5", "kind": "block12", "b": [535, 547, 44, 379, 306, 591], "top": "roof"},
  {"id": "attic6", "kind": "block12", "b": [535, 547, 455, 866, 306, 591], "top": "roof"},
  {"id": "attic7", "kind": "block12", "b": [737, 749, 44, 341, 306, 591], "top": "roof"},
  {"id": "attic8", "kind": "block12", "b": [749, 901, 329, 341, 306, 591], "top": "roof"},
  {"id": "attic9", "kind": "block12", "b": [820, 832, 565, 866, 306, 591], "top": "roof"},
  {"id": "ventAttic", "kind": "shaft", "b": [832, 901, 565, 626, 306, 870], "note": "drugi komin na dachu"},
  {"id": "attic11", "kind": "block12", "b": [889, 901, 626, 649, 306, 591], "top": "roof"},
  {"id": "attic12", "kind": "block12", "b": [901, 913, 44, 649, 306, 591], "top": "roof"},
  {"id": "attic13", "kind": "block12", "b": [913, 1276, 441, 453, 306, 591], "top": "roof"}
 ],

 "openings": [
  {"id": "o1", "kind": "window", "label": "600/240", "b": [0, 44, 155, 755, 0, 240], "outer": "-x", "cols": 4},
  {"id": "o2", "kind": "window", "label": "200/100", "b": [762, 962, 0, 44, 110, 210], "outer": "-y", "cols": 1},
  {"id": "o3", "kind": "window", "label": "250/240", "b": [83, 333, 866, 910, 0, 240], "outer": "+y", "cols": 1},
  {"id": "o4", "kind": "window", "label": "190/130", "b": [472, 662, 866, 910, 110, 240], "outer": "+y", "cols": 2},
  {"id": "o5", "kind": "window", "label": "100/130", "b": [803, 903, 866, 910, 110, 240], "outer": "+y", "cols": 1},
  {"id": "o6", "kind": "gate", "label": "275/225", "b": [1276, 1320, 115, 390, 0, 225], "outer": "+x"},
  {"id": "o7", "kind": "entrance", "label": "160/210", "b": [1186, 1230, 455, 615, 0, 210], "outer": "+x", "leaf": 100},
  {"id": "o8", "kind": "glassDoor", "label": "80/210", "b": [1186, 1230, 661, 741, 0, 210], "outer": "+x", "cols": 1},
  {"id": "o9", "kind": "door", "label": "87/205", "b": [1064, 1151, 411, 423, 0, 205]},
  {"id": "o10", "kind": "door", "label": "92/205", "b": [901, 925, 488, 580, 0, 205]},
  {"id": "o11", "kind": "door", "label": "90/205", "b": [776, 866, 615, 627, 0, 205]},
  {"id": "o12", "kind": "door", "label": "92/205", "b": [1064, 1156, 615, 627, 0, 205]},
  {"id": "o13", "kind": "window", "label": "600/346", "b": [0, 44, 155, 755, 306, 652], "outer": "-x", "cols": 4,
   "below": [{"z": 652, "y": 455, "pitch": 1}, {"z": 652, "y": 455, "pitch": -1}]},
  {"id": "o14", "kind": "window", "label": "220/285", "b": [1276, 1320, 168, 388, 336, 621], "outer": "+x", "cols": 2, "transoms": [390],
   "below": [{"z": 621, "y": 388, "pitch": 1}]},
  {"id": "o15", "kind": "window", "label": "220/285", "b": [1276, 1320, 522, 742, 336, 621], "outer": "+x", "cols": 2, "transoms": [390],
   "below": [{"z": 621, "y": 522, "pitch": -1}]},
  {"id": "o16", "kind": "door", "label": "89/205", "b": [535, 547, 459, 548, 306, 511]},
  {"id": "o17", "kind": "door", "label": "90/205", "b": [630, 720, 553, 565, 306, 511], "note": "przesunięte o 20 cm (wykonawczo)"},
  {"id": "o18", "kind": "door", "label": "82/205", "b": [901, 913, 178, 260, 306, 511]},
  {"id": "o19", "kind": "door", "label": "94/205", "b": [901, 913, 347, 441, 306, 511]},
  {"id": "o20", "kind": "door", "label": "90/205", "b": [901, 913, 457, 547, 306, 511]}
 ],
 "frames": {"width": 7, "depth": 8, "bar": 6, "material": "frame", "glass": "glass", "layers": ["openings"],
  "gate": {"material": "graphite", "grooves": 4, "groove": "groove"},
  "entrance": {"material": "graphite", "grooves": 4, "handle": {"length": 120, "width": 3, "material": "steel"}}},

 "finishes": [
  {"z": [-999, 0], "material": "plinth"},
  {"side": "-x", "y": [64, 846], "z": [0, 999], "material": "graphite"},
  {"side": "-x", "y": [155, 755], "z": [240, 306], "material": "woodHorizontal"},
  {"side": "+x", "y": [64, 846], "z": [0, 999], "material": "graphite"},
  {"side": "+x", "x": [1300, 1320], "y": [64, 846], "z": [225, 336], "material": "plasterWhite"},
  {"side": "+x", "x": [1300, 1320], "y": [388, 522], "z": [336, 999], "material": "woodVertical",
   "below": [{"z": 621, "y": 388, "pitch": 1}, {"z": 621, "y": 522, "pitch": -1}]},
  {"side": "+x", "x": [1210, 1230], "y": [615, 661], "z": [0, 272], "material": "woodVertical"},
  {"side": "+x", "x": [1210, 1230], "y": [741, 846], "z": [0, 272], "material": "woodVertical"},
  {"side": "+y", "x": [1230, 1300], "y": [435, 455], "z": [0, 272], "material": "graphite"},
  {"side": "-y", "x": [1210, 1320], "y": [846, 866], "z": [0, 272], "material": "graphite"},
  {"side": "-z", "x": [1210, 1300], "material": "graphite"},
  {"side": "+y", "x": [333, 903], "z": [0, 240], "material": "graphite"},
  {"side": "-y", "x": [127, 964], "z": [0, 240], "material": "graphite"},
  {"elements": ["chimney", "ventAttic"], "z": [700, 999], "material": "graphite"}
 ],

 "stair": {
  "risers": 17,
  "tread": 5,
  "material": "tread",
  "layers": ["stair"],
  "flights": [
   {"x": [547, 642], "y": [435, 143.5], "first": 1, "count": 11},
   {"landing": [547, 737, 44, 143.5], "riser": 12},
   {"x": [642, 737], "y": [143.5, 273], "first": 13, "count": 4}
  ]
 },

 "site": {
  "lawn": {"rect": [-1500, 2900, -1500, 2400], "z": -32, "material": "lawn"},
  "terraces": [
   {"name": "taras ogrodowy", "rect": [-250, -100, 30, 880], "z": -2, "material": "woodHorizontal"},
   {"name": "taras pod portalem", "rect": [-100, 0, 64, 846], "z": -2, "material": "woodHorizontal"},
   {"name": "wejście", "rect": [1230, 1420, 455, 846], "z": -2, "material": "paving"},
   {"name": "podjazd", "rect": [1320, 1720, 64, 450], "z": -12, "material": "paving"},
   {"name": "dojście", "rect": [1420, 1720, 478, 598], "z": -12, "material": "paving"}
  ],
  "layers": ["site"]
 },

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
  "fog": {"color": "#dfe7ea", "near": 6000, "far": 16000}
 },

 "cameras": {
  "all": [
   {"name": "Od frontu", "eye": [2750, -650, 420], "target": [660, 455, 330]},
   {"name": "Od ogrodu", "eye": [-1350, 1350, 380], "target": [500, 455, 330]},
   {"name": "Z góry", "eye": [2300, -1150, 1750], "target": [660, 455, 250]}
  ],
  "ground": [
   {"name": "Rzut", "eye": [666, 455, 2300], "target": [660, 455, 0]},
   {"name": "Perspektywa", "eye": [1900, -650, 1050], "target": [620, 455, 60]},
   {"name": "Salon", "eye": [90, 830, 160], "target": [520, 300, 90]},
   {"name": "Wejście", "eye": [1150, 540, 160], "target": [650, 520, 100]}
  ],
  "attic": [
   {"name": "Rzut", "eye": [666, 455, 2300], "target": [660, 455, 0]},
   {"name": "Perspektywa", "eye": [1900, -650, 1050], "target": [620, 455, 60]},
   {"name": "Sypialnia", "eye": [330, 820, 160], "target": [80, 200, 60]},
   {"name": "Hol", "eye": [880, 520, 160], "target": [560, 470, 60]},
   {"name": "Pokoje", "eye": [1240, 450, 160], "target": [930, 700, 60]}
  ]
 },
 "walk": {"eye": 160, "radius": 22, "step": 36, "speed": 140, "start": {"x": 1120, "y": 520, "heading": 180}},

 "tiles": {"reserve": 0.1, "layers": ["floors"], "small": ["cuts"]}
};
