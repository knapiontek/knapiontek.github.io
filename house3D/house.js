/* "Dom w papawerach 5 (G)" - the house as one tree: Building -> Floors -> Rooms (-> Tiles, laid by view.html).
   view.html holds no numbers, names or colours of this house; it renders this file (and materials.js, textures.js).
   Units: cm, angles in degrees. x across the house from the left outer wall face, z from the garden outer wall face to
   the front, y up from the finished ground floor. A floor holds its elements in the house x, z and its own level:
   every height inside a floor (sill, head, the stair, the fireplace) is measured from that floor's level.
   The house is built in this order and drawn so: foundation, ground floor walls (blocks, all up to the ground floor
   height), ring beam and slab over the whole of them, attic walls on the slab, last the EPS and the finish all round.

   BUILDING (the root)
   name, source, notes   what the page shows about the house (Polish)
   views        the top menu: 3D or 2D (one toggle). A view never builds objects of its own: the model is the same in
                every view, a view only shows layers and cuts the walls. levels = the switches of the first row
                (floors and roof, which are layers too); offer = the material layers of the second row; panels = the
                sections of the panel, the parameters of what is shown (cut and view = the see-through roof slopes and
                rooms only for the open floor: the highest floor shown with the roof off); cut = the view's own fixed
                cut (the 2D plan), else the panel's cut of the open floor; selectRooms = a click selects a room of the
                open floor; walk = the walk is offered; plan = the 2D plan of all floors side by side
   layers       what can be switched off: name, on false = off at the start, layers = the layers inside it (a child is
                shown only with its parent). Every element names its layers ("layers" on its node, its kind or its
                build-up layer, a floor on everything standing on it); it is drawn only when all of them are on.
                Layer ids are unique in the whole tree. A wall is drawn in its material layers: the block core under
                its kind's layers, the EPS and the finish under the layers of their build-up layer
   roof         pitch, knee wall height (the knee walls give the eaves line); buildUp = the section of the portal frame:
                the roof slab has the thickness of the portal wings (the build-up insulated on both sides), measured
                square to the slope; body = the white band of the portals, covering = the roof surface;
                planHeights = the clear heights drawn as lines on the attic plan
   portals      the side walls and the roof run past both gables
   chimney      the flue (the attic wall of kind chimney), "above" = how far it rises over the ridge
   slab         the ring beam and slab: poured over the whole of the ground floor walls, between their top (the ground
                floor height) and the attic level, over the outline of both floors minus the stair hole; buildUp = its
                outer layers (EPS, finish) on every side to the air and under it where there is no ground floor below
                (the soffit of the entrance recess); face = its finish where no finish rule says otherwise; the floors are split
                by one plane, the top of the ground floor walls: the slab is shown with the attic, its soffit with
                the ground floor
   buildUps     what a wall is made of: the first layer is the core (block), the next ones lie on every side of the
                wall that faces the air, from the inside out (a house wall: one side, 24 + 19 + 1 = 44; a portal wing:
                both sides and the end, 64); a layer with a material is drawn in it (on the plan and in the cut of the
                3D view); the finish layer is the outer cm of the wall: plaster, graphite or wood (see finishes)
   wallKinds    per wall kind: name, material of its surfaces (and of its finish where no finish says otherwise),
                buildUp (the view checks the thickness), rank (where walls overlap the higher rank owns the overlap;
                openings always win), wing = runs past the gables
                (not part of the house length), height = a fixed top (the stair rail), plinth = stands on the plinth
   plinth, site the base under the outer walls; lawn and terraces [x1, z1, x2, z2] at a top level y
   finishes     what the finish layer of a wall side is: side = where the side looks (left -x, right +x, garden -z,
                front +z), rect = the part of the plan it covers, floor (default both), y = its height (house y,
                default all), upTo "windowLine" = it stops at the line of the attic window tops (the wood between
                the front windows ends in a peak); in their order, a later one over the earlier ones. A wall side is
                a facade where it faces the air (nothing of the plan in front of it): no faces are guessed by position
   doors        entrance: the door leaf in the opening of kind entrance (from the hinge side), the rest is a glass
                sidelight
   gate, windows   the garage door panel; window frames (profile, mullions, transom), the attic gable windows follow
                the roof ("inset" cm below its underside); intoCore = windows sit in the block: this far behind the
                outer face of the core (behind the EPS and the finish of the wall's build-up)
   edges        delicate lines on the wall edges: colour, opacity, crease angle
   light, cameras, walk   sun and sky; the views of the dock (y of the attic views from the attic floor); walking
   tiles        reserve = extra share of tiles to buy; layers of the tiles and of the marked small cuts

   FLOORS       id (ground | attic), name, level = finished floor level; height = the top of the walls (ground floor:
                every wall stops under the slab);
                underRoof = the walls rise to the roof (attic)
     walls      r = [x1, z1, x2, z2]; kind = a key of wallKinds. Measured from the plan images on archon.pl (853 px GIF,
                2.41 cm/px, about +-3 cm); the attic aligned to the ground floor; edges closer than 3 cm share one
                coordinate. Thicknesses follow the build-ups: the outer faces stayed where they were measured, the
                inner face moved. The page checks every wall against its build-up.
     openings   the part of a wall with a window, door, entrance or gate: wall below sill and above head;
                wall = the wall kind it sits in
     rooms      id, numbers (on the archon plan; one room of the model may be several there), name; floor areas as rectangles, together the whole floor between the walls (passages without a
                door belong to a room); planArea = the area from the plan (attic: total, incl. under 1.9 m);
                tiles = the floor of the room: the product of materials.js and the direction of the tile length
                (z along the house, x across) - the rest is set on the page when the room is selected; tilesWith =
                the room is tiled together with that room (walk-in wardrobes with the bedroom); neither = no tiles;
                link = a sub-project of this room (its own page in the repository)
     stair      U-shaped: flight1 rises west from the hall (risers 1..12 up to the landing), flight2 rises east to
                the attic floor; the flights meet with no wall between them; treadMaterial
     fireplace  rect, height and material of the fireplace block
     voids      the stair hole in the attic floor */
window.HOUSE = {
 "name": "Dom w papawerach 5 (G)",
 "source": "Rzuty z archon.pl w skali (ok. ±3 cm).",
 "notes": [
  "Schody zabiegowe w kształcie U odczytane z rzutów: bieg z holu na zachód, spocznik przy ścianie, bieg powrotny nad garażem do holu piętra.",
  "Ściany z pustaków 24 i 12 cm, ściany zewnętrzne ocieplone od zewnątrz styropianem 20 cm. Lica zewnętrzne zostały w miejscu z rzutu, grubość odjęto od wnętrza. Portal (skrzydła ścian bocznych za szczytami i dach) ma przekrój 20 + 24 + 20 = 64 cm, pustak skrzydła w linii pustaka ściany bocznej."
 ],
 "views": {
  "3d": {
   "name": "3D",
   "levels": ["ground", "attic", "roof"],
   "offer": ["foundation", "walls", "slabs", "insulation", "facade", "edges", "openings", "stair", "fittings", "floors", "site"],
   "panels": ["cut", "view", "light", "rooms", "walls", "notes"],
   "selectRooms": true,
   "roofGhost": true,
   "walk": true
  },
  "2d": {"name": "2D", "plan": true, "cut": 150, "panels": ["plan", "walls", "notes"]}
 },
 "layers": {
  "ground": {"name": "Parter"},
  "attic": {"name": "Piętro"},
  "roof": {"name": "Dach"},
  "foundation": {"name": "Fundament"},
  "walls": {"name": "Pustaki"},
  "slabs": {"name": "Wieniec i strop"},
  "insulation": {"name": "Styropian"},
  "facade": {"name": "Elewacja"},
  "edges": {"name": "Krawędzie"},
  "openings": {"name": "Okna i drzwi"},
  "stair": {"name": "Schody"},
  "fittings": {"name": "Kominek"},
  "floors": {"name": "Posadzki", "layers": {"cuts": {"name": "Drobne docinki (czerwone)"}}},
  "site": {"name": "Teren"}
 },
 "roof": {
  "pitch": 42,
  "knee": 120,
  "buildUp": "outer",
  "body": "plasterWhite",
  "covering": "roofGraphite",
  "planHeights": [140, 190, 220],
  "layers": ["roof"]
 },
 "portals": {"groundWingsTo": "attic"},
 "chimney": {"above": 90, "material": "graphite", "layers": ["roof"]},
 "slab": {"material": "slab", "buildUp": "outer", "face": "plasterWhite", "layers": ["slabs"]},
 "buildUps": {
  "outer": {
   "name": "Ściana zewnętrzna",
   "layers": [
    {"name": "Pustak", "thickness": 24},
    {"name": "Styropian", "thickness": 19, "material": "insulation", "layers": ["insulation"]},
    {"name": "Wykończenie", "thickness": 1, "finish": true, "layers": ["facade"]}
   ]
  },
  "block24": {"name": "Ściana wewnętrzna 24", "layers": [{"name": "Pustak", "thickness": 24}]},
  "block12": {"name": "Ścianka działowa 12", "layers": [{"name": "Pustak", "thickness": 12}]}
 },
 "wallKinds": {
  "ext": {
   "name": "zewnętrzna",
   "material": "plasterWhite",
   "buildUp": "outer",
   "rank": 5,
   "plinth": true,
   "layers": ["walls"]
  },
  "portal": {
   "name": "portal",
   "material": "plasterWhite",
   "buildUp": "outer",
   "rank": 5,
   "wing": true,
   "plinth": true,
   "layers": ["walls"]
  },
  "gable": {"name": "szczytowa", "material": "plasterWhite", "buildUp": "outer", "rank": 4, "layers": ["walls"]},
  "knee": {"name": "kolankowa", "material": "plasterWhite", "buildUp": "outer", "rank": 3, "layers": ["walls"]},
  "int24": {"name": "wewnętrzna 24", "material": "plasterInside", "buildUp": "block24", "rank": 2, "layers": ["walls"]},
  "int12": {"name": "działowa 12", "material": "plasterInside", "buildUp": "block12", "rank": 2, "layers": ["walls"]},
  "chimney": {"name": "komin", "material": "plasterInside", "rank": 6, "layers": ["walls"]},
  "rail": {"name": "balustrada", "material": "glass", "rank": 1, "height": 100, "layers": ["stair"]}
 },
 "plinth": {"top": 0, "bottom": -30, "material": "plinth", "layers": ["foundation"]},
 "site": {
  "lawn": {"rect": [-1500, -1500, 2400, 2800], "y": -30, "material": "lawn"},
  "terraces": [
   {"rect": [-100, -460, 1010, -101.4], "y": -12, "material": "paving"},
   {"rect": [0, -101.4, 910, 0], "y": -12, "material": "paving"},
   {"rect": [0, 1322.8, 910, 1700], "y": -12, "material": "paving"}
  ],
  "layers": ["site"]
 },
 "finishes": [
  {"side": "garden", "rect": [44, 0, 866, 44], "material": "graphite"},
  {"side": "front", "rect": [44, 1187, 866, 1322.8], "material": "graphite"},
  {"side": "right", "floor": "ground", "rect": [409.8, 1231, 453.8, 1322.8], "y": [0, 252], "material": "graphite"},
  {"side": "left", "floor": "ground", "rect": [846, 1231, 866, 1322.8], "y": [0, 252], "material": "graphite"},
  {"side": "front", "floor": "ground", "rect": [615.5, 1187, 661.4, 1231], "material": "woodVertical"},
  {"side": "front", "floor": "ground", "rect": [741, 1187, 846, 1231], "material": "woodVertical"},
  {
   "side": "front",
   "floor": "attic",
   "rect": [390.45, 1278.8, 521.95, 1322.8],
   "material": "woodVertical",
   "upTo": "windowLine"
  },
  {"side": "garden", "rect": [44, 0, 866, 44], "y": [238, 300], "material": "woodHorizontal"},
  {"side": "front", "rect": [44, 1187, 866, 1322.8], "y": [252, 327], "material": "plasterWhite"}
 ],
 "doors": {
  "entrance": {
   "leaf": 100,
   "hinge": "left",
   "material": "graphite",
   "grooves": 4,
   "handle": {"length": 120, "width": 3, "material": "steel"}
  }
 },
 "gate": {"grooves": 4, "groove": "#2e3134"},
 "windows": {
  "frame": {"width": 8, "depth": 4, "mullionEvery": 150, "transom": 205, "material": "frame"},
  "glass": "glass",
  "intoCore": 6,
  "gate": "graphite",
  "attic": {"followRoof": true, "inset": 140, "mullionEvery": 140, "transom": 85},
  "layers": ["openings"]
 },
 "edges": {"color": "#8a8b86", "opacity": 0.4, "angle": 30, "layers": ["edges"]},
 "light": {
  "exposure": 0.8,
  "sun": {"azimuth": 35, "elevation": 38, "intensity": 1.35, "color": "#fff1dc"},
  "sky": {
   "intensity": 0.55,
   "color": "#cfe0ff",
   "groundColor": "#7a8466",
   "gradient": [[0, "#5f8fc4"], [0.32, "#9dbfe0"], [0.49, "#e4ecef"], [0.51, "#b7bfae"], [1, "#6f7a5e"]],
   "reflections": 0.8
  },
  "fog": {"color": "#dfe7ea", "near": 4500, "far": 14000}
 },
 "cameras": {
  "ground": [
   {"name": "Rzut", "eye": [455, 1500, 700], "target": [455, 0, 660]},
   {"name": "Perspektywa", "eye": [-520, 980, 1650], "target": [455, 60, 620]},
   {"name": "Salon", "eye": [90, 165, 70], "target": [640, 30, 420]},
   {"name": "Kuchnia i hol", "eye": [820, 170, 110], "target": [400, 20, 640]},
   {"name": "Wejście", "eye": [330, 165, 1010], "target": [600, 20, 300]}
  ],
  "attic": [
   {"name": "Rzut", "eye": [455, 1500, 700], "target": [455, 0, 660]},
   {"name": "Perspektywa", "eye": [-520, 980, 1650], "target": [455, 60, 620]},
   {"name": "Sypialnia", "eye": [800, 165, 330], "target": [130, 0, 70]},
   {"name": "Hol", "eye": [520, 165, 880], "target": [150, 0, 650]},
   {"name": "Pokoje", "eye": [830, 165, 1250], "target": [300, 0, 1000]}
  ],
  "all": [
   {"name": "Od frontu", "eye": [-650, 420, 2650], "target": [455, 330, 660]},
   {"name": "Od ogrodu", "eye": [1250, 380, -1250], "target": [455, 330, 500]},
   {"name": "Z góry", "eye": [-1100, 1700, 2300], "target": [455, 250, 660]}
  ]
 },
 "walk": {"eye": 160, "radius": 22, "step": 36, "head": 18, "speed": 140, "start": {"x": 525, "z": 1150, "heading": 0}},
 "tiles": {"reserve": 0.1, "layers": ["floors"], "small": ["cuts"]},
 "floors": [
  {
   "id": "ground",
   "name": "Parter",
   "layers": ["ground"],
   "level": 0,
   "height": 272,
   "walls": [
    {"r": [0, 0, 44, 761.7], "kind": "ext"},
    {"r": [0, 961.7, 44, 1322.8], "kind": "ext"},
    {"r": [44, 0, 155, 44], "kind": "ext"},
    {"r": [755, 0, 866, 44], "kind": "ext"},
    {"r": [866, 0, 910, 82.6], "kind": "ext"},
    {"r": [866, 332.6, 910, 466.2], "kind": "ext"},
    {"r": [866, 656.2, 910, 802.8], "kind": "ext"},
    {"r": [866, 902.8, 910, 1322.8], "kind": "ext"},
    {"r": [44, 1278.8, 114.7, 1322.8], "kind": "ext"},
    {"r": [389.7, 1278.8, 453.8, 1322.8], "kind": "ext"},
    {"r": [409.8, 1187, 453.8, 1278.8], "kind": "ext"},
    {"r": [615.5, 1187, 661.4, 1231], "kind": "ext"},
    {"r": [741, 1187, 866, 1231], "kind": "ext"},
    {"r": [0, -101.4, 64, 0], "kind": "portal"},
    {"r": [846, -101.4, 910, 0], "kind": "portal"},
    {"r": [0, 1322.8, 64, 1421.7], "kind": "portal"},
    {"r": [846, 1231, 910, 1421.7], "kind": "portal"},
    {"r": [44, 535.9, 380.4, 547.9], "kind": "int12"},
    {"r": [380.4, 468.5, 459.8, 547.9], "kind": "chimney"},
    {"r": [318.6, 647, 433.8, 659], "kind": "int12"},
    {"r": [409.8, 659, 433.8, 1064.5], "kind": "int24"},
    {"r": [409.8, 1151.4, 433.8, 1187], "kind": "int24"},
    {"r": [433.8, 905.3, 487.6, 929.3], "kind": "int24"},
    {"r": [579.3, 905.3, 615.5, 929.3], "kind": "int24"},
    {"r": [601, 721.8, 866, 733.8], "kind": "int12"},
    {"r": [615.5, 733.8, 627.5, 760.3], "kind": "int12"},
    {"r": [615.5, 869, 627.5, 1064.5], "kind": "int12"},
    {"r": [615.5, 1156.2, 627.5, 1231], "kind": "int12"},
    {"r": [627.5, 902.8, 766, 926.8], "kind": "int24"},
    {"r": [754, 926.8, 766, 1004.8], "kind": "int12"},
    {"r": [754, 992.8, 866, 1004.8], "kind": "int12"}
   ],
   "openings": [
    {"r": [0, 761.7, 44, 961.7], "sill": 110, "head": 210, "kind": "window", "wall": "ext"},
    {"r": [155, 0, 755, 44], "sill": 0, "head": 240, "kind": "window", "wall": "ext"},
    {"r": [866, 82.6, 910, 332.6], "sill": 0, "head": 240, "kind": "window", "wall": "ext"},
    {"r": [866, 466.2, 910, 656.2], "sill": 110, "head": 240, "kind": "window", "wall": "ext"},
    {"r": [866, 802.8, 910, 902.8], "sill": 110, "head": 240, "kind": "window", "wall": "ext"},
    {"r": [114.7, 1278.8, 389.7, 1322.8], "sill": 0, "head": 225, "kind": "gate", "wall": "ext"},
    {"r": [453.8, 1187, 615.5, 1231], "sill": 0, "head": 210, "kind": "entrance", "wall": "ext"},
    {"r": [661.4, 1187, 741, 1231], "sill": 0, "head": 210, "kind": "window", "wall": "ext"},
    {"r": [409.8, 1064.5, 433.8, 1151.4], "sill": 0, "head": 205, "kind": "door", "wall": "int24"},
    {"r": [487.6, 905.3, 579.3, 929.3], "sill": 0, "head": 205, "kind": "door", "wall": "int24"},
    {"r": [615.5, 760.3, 627.5, 869], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
    {"r": [615.5, 1064.5, 627.5, 1156.2], "sill": 0, "head": 205, "kind": "door", "wall": "int12"}
   ],
   "rooms": [
    {
     "id": "salon",
     "numbers": [3, 4, 5, 6],
     "name": "Salon z kuchnią i holem",
     "planArea": 50.55,
     "tiles": {"product": "authorityGraphite", "dir": "z"},
     "link": {"href": "../kitchen/view.html", "name": "Projekt kuchni"},
     "rects": [
      [44, 44, 380.4, 535.9],
      [380.4, 44, 459.8, 468.5],
      [459.8, 44, 866, 547.9],
      [433.8, 547.9, 866, 721.8],
      [433.8, 721.8, 615.5, 905.3]
     ]
    },
    {
     "id": "wiatrolap",
     "numbers": [1],
     "name": "Wiatrołap",
     "planArea": 4.84,
     "tiles": {"product": "authorityGraphite", "dir": "z"},
     "rects": [[433.8, 929.3, 615.5, 1187]]
    },
    {
     "id": "lazienka",
     "numbers": [7],
     "name": "Łazienka",
     "planArea": 4.95,
     "tiles": {"product": "authorityGraphite", "dir": "z"},
     "link": {"href": "../bath/view.html", "name": "Projekt łazienki"},
     "rects": [[627.5, 733.8, 866, 902.8], [766, 902.8, 866, 992.8]]
    },
    {
     "id": "kotlownia",
     "numbers": [8],
     "name": "Kotłownia z pralnią",
     "planArea": 4.97,
     "tiles": {"product": "authorityGraphite", "dir": "z"},
     "rects": [[627.5, 926.8, 754, 1004.8], [627.5, 1004.8, 866, 1187]]
    },
    {
     "id": "garaz",
     "numbers": [2],
     "name": "Garaż",
     "planArea": 25.91,
     "rects": [[44, 659, 409.8, 1278.8], [44, 547.9, 318.6, 642.1], [273, 647.7, 318.6, 659]]
    }
   ],
   "stair": {
    "risers": 17,
    "flight1": {"x": [143, 433.8], "z": [547.9, 644.1], "risers": 12},
    "landing": {"x": [44, 143], "z": [547.9, 735]},
    "flight2": {"x": [143, 273], "z": [644.1, 735]},
    "treadMaterial": "tread",
    "layers": ["stair"]
   },
   "fireplace": {"rect": [335.5, 506.9, 380.4, 535.9], "height": 105, "material": "fireplace", "layers": ["fittings"]}
  },
  {
   "id": "attic",
   "name": "Piętro",
   "layers": ["attic"],
   "level": 297,
   "underRoof": true,
   "walls": [
    {"r": [0, 0, 44, 1322.8], "kind": "knee"},
    {"r": [866, 0, 910, 1322.8], "kind": "knee"},
    {"r": [44, 0, 156.2, 44], "kind": "gable"},
    {"r": [756.2, 0, 866, 44], "kind": "gable"},
    {"r": [44, 1278.8, 170.45, 1322.8], "kind": "gable"},
    {"r": [390.45, 1278.8, 521.95, 1322.8], "kind": "gable"},
    {"r": [741.95, 1278.8, 866, 1322.8], "kind": "gable"},
    {"r": [0, -101.4, 64, 0], "kind": "portal"},
    {"r": [846, -101.4, 910, 0], "kind": "portal"},
    {"r": [0, 1322.8, 64, 1421.7], "kind": "portal"},
    {"r": [846, 1322.8, 910, 1421.7], "kind": "portal"},
    {"r": [44, 362.1, 392.4, 374.1], "kind": "int12"},
    {"r": [553.7, 362.1, 866, 374.1], "kind": "int12"},
    {"r": [380.4, 468.5, 459.8, 547.9], "kind": "chimney"},
    {"r": [553.7, 465.8, 565.7, 631.7], "kind": "int12"},
    {"r": [553.7, 721.1, 565.7, 820.7], "kind": "int12"},
    {"r": [44, 535.9, 380.4, 547.9], "kind": "int12"},
    {"r": [548.9, 535.9, 866, 547.9], "kind": "int12"},
    {"r": [565.7, 820.7, 866, 832.7], "kind": "int12"},
    {"r": [553.7, 820.7, 565.7, 914.8], "kind": "int12"},
    {"r": [44, 738.7, 341.9, 750.7], "kind": "int12"},
    {"r": [329.9, 750.7, 341.9, 902.8], "kind": "int12"},
    {"r": [44, 902.8, 178.1, 914.8], "kind": "int12"},
    {"r": [260, 902.8, 346.7, 914.8], "kind": "int12"},
    {"r": [440.6, 902.8, 452.6, 1278.8], "kind": "int12"},
    {"r": [143, 642.2, 438.1, 651.7], "kind": "rail"}
   ],
   "openings": [
    {"r": [156.2, 0, 756.2, 44], "sill": 0, "head": 346, "kind": "window", "wall": "gable"},
    {"r": [170.45, 1278.8, 390.45, 1322.8], "sill": 30, "head": 315, "kind": "window", "wall": "gable"},
    {"r": [521.95, 1278.8, 741.95, 1322.8], "sill": 30, "head": 315, "kind": "window", "wall": "gable"},
    {"r": [459.8, 535.9, 553.7, 547.9], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
    {"r": [553.7, 631.7, 565.7, 721.1], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
    {"r": [178.1, 902.8, 260, 914.8], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
    {"r": [346.7, 902.8, 440.6, 914.8], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
    {"r": [452.6, 902.8, 553.7, 914.8], "sill": 0, "head": 205, "kind": "door", "wall": "int12"}
   ],
   "rooms": [
    {
     "id": "sypialnia",
     "numbers": [2],
     "name": "Sypialnia",
     "planArea": 28.16,
     "tiles": {"product": "logOak", "dir": "z"},
     "rects": [
      [44, 44, 866, 362.1],
      [392.4, 362.1, 553.7, 374.1],
      [380.4, 374.1, 565.7, 468.5],
      [459.8, 468.5, 553.7, 535.9]
     ]
    },
    {
     "id": "garderoba3",
     "numbers": [3],
     "name": "Garderoba",
     "planArea": 5.13,
     "tilesWith": "sypialnia",
     "rects": [[44, 374.1, 380.4, 535.9]]
    },
    {
     "id": "garderoba4",
     "numbers": [4],
     "name": "Garderoba",
     "planArea": 4.6,
     "tilesWith": "sypialnia",
     "rects": [[565.7, 374.1, 866, 535.9]]
    },
    {
     "id": "hol",
     "numbers": [1],
     "name": "Hol",
     "planArea": 7.32,
     "tiles": {"product": "logOak", "dir": "z"},
     "rects": [[438.1, 547.9, 553.7, 651.7], [273, 651.7, 341.9, 738.7], [341.9, 651.7, 553.7, 902.8]]
    },
    {
     "id": "lazienka5",
     "numbers": [5],
     "name": "Łazienka",
     "planArea": 7.99,
     "tiles": {"product": "authorityGrey80", "dir": "z"},
     "link": {"href": "../bath/view.html", "name": "Projekt łazienki"},
     "rects": [[565.7, 547.9, 866, 820.7]]
    },
    {
     "id": "garderoba8",
     "numbers": [8],
     "name": "Garderoba",
     "planArea": 4.16,
     "tiles": {"product": "logOak", "dir": "z"},
     "rects": [[44, 750.7, 329.9, 902.8]]
    },
    {
     "id": "pokoj7",
     "numbers": [7],
     "name": "Pokój",
     "planArea": 14.11,
     "tiles": {"product": "logOak", "dir": "z"},
     "rects": [[44, 914.8, 440.6, 1278.8]]
    },
    {
     "id": "pokoj6",
     "numbers": [6],
     "name": "Pokój",
     "planArea": 16.53,
     "tiles": {"product": "logOak", "dir": "z"},
     "rects": [[452.6, 914.8, 866, 1278.8], [565.7, 832.7, 866, 914.8]]
    }
   ],
   "voids": [[44, 547.9, 438.1, 642.2], [44, 642.2, 273, 738.7]]
  }
 ]
};
