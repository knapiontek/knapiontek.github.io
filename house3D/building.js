/* "Dom w papawerach 5 (G)" - the building shell for view.html: everything the view draws besides the walls, openings
   and rooms of plan.js and the floor tiles. view.html holds no numbers or colours of this house; it renders this file.
   Units: cm, angles in degrees. x across the house from the left outer wall face, z from the garden face to the front,
   y up from the finished ground floor.

   name, source, notes   what the page shows about the house (Polish)
   levels       finished floor levels; groundHeight = clear height of the ground floor (underside of the attic slab)
   roof         pitch, knee wall height (from plan.js: the knee walls give the eaves line); buildUp = the section of
                the portal frame: the roof slab has the thickness of the portal wings (the build-up insulated on both
                sides), measured square to the slope; body = the white band of the portals, covering = the roof surface;
                planHeights = the clear heights drawn as lines on the attic plan
   fireplace    height of the fireplace block of plan.js
   stair        materials of the treads and of the wall between the flights (the stair of plan.js)
   buildUps     what a wall is made of: the first layer is the core (block), the next ones lie on every side of the wall
                that faces outside (a house wall: one side, 24 + 20 = 44; a portal wing: both sides and the end,
                20 + 24 + 20 = 64); a layer with a material is drawn in it (on the plan and in the cut of the 3D view).
   walls        per wall kind of plan.js: name, material of its surfaces, buildUp (its thickness must equal the sum of
                the layers on its outside sides, the view checks it), rank (where walls overlap the higher rank owns the overlap; openings
                always win), upToAtticFloor (in the whole house the wall carries the slab up to the attic floor),
                wing = runs past the gables (the portal wings, not part of the house length), height = a fixed top (the stair rail)
   portals      the side walls and the roof run past both gables (the portal frames); the ground floor parts of
                the portal walls rise to the attic floor
   chimney      the flue of plan.js (attic wall kind chimney), "above" = how far it rises over the ridge
   plinth       the base under the outer walls
   site         lawn and terraces, [x1, z1, x2, z2] at a top level y
   faces        which wall pieces of plan.js form the gable faces: garden at z = 0, front at z = 1323, the recessed
                entrance at z = 1232 from x 440; pieces within "margin" of the side walls belong to the portals;
                depth = the facade layer: the finish (plaster, graphite, wood) is the outer cm of the wall itself, part of
                the EPS, never stuck on in front of it
   finishes     facade finish of the gable faces, by face, floor and x range (exactly the edges of the openings
                of plan.js beside them); anything else on a face = default;
                upTo "windowLine": the finish stops at the line of the attic window tops (the wood between the front
                windows ends in a peak), above it the default
   bands        facade strips in the facade layer (like every finish); a band takes its
                height out of the cladding under it (the front one is the white band between the floors of
                the visualisation; the attic front windows start on it: sill 30 in plan.js)
   claddings    finishes [x1, z1, x2, z2] from y to y: the graphite sides of the entrance recess (the outer cm of its side
                walls, inside them), its white beam under the band and the graphite soffit (in the recess)
   doors        entrance: the door leaf in the opening of kind entrance (from the hinge side), the rest is a glass sidelight;
                interiorLintels "fullHeight": the wall over an interior door only when the walls are at full height
   gate         the garage door panel: horizontal grooves
   windows      frame: profile width and depth, a mullion every "mullionEvery" cm, a transom at "transom" in glazing taller
                than that; gable windows of the attic follow the roof slopes ("followRoof": the glass stops "inset" cm,
                measured vertically, below the roof underside), so they are trapezoids and pentagons as in the
                visualisation; inset 140 gives the 285 cm tall edge of the front windows and 346 cm of the garden one
                (plan labels 220/285, 600/346) and the short edge of about 90 cm; attic mullions and transom of their own
   setback      windows in outer walls sit this far behind the outer face (the frames almost flush, as on the
                visualisation); the reveal in front of them on the gable faces gets the facade finish
   edges        delicate lines on the wall edges (white on white has no edge otherwise): colour, opacity, crease angle
   materials    colour, roughness; texture = generated plaster grain: strength 0..1 (0.3 = the first, fine version), grain = speck size
                in px of a 256 px tile covering "tile" cm, bump = relief depth (0 = off; the relief is shaded per triangle and shows
                faint lines along the triangle edges of large faces); wood = the oak decor photo of textures.js cut into boards
   light        exposure of the camera; sun from azimuth (0 = from the garden, 90 = from the right side) and elevation;
                sky = the gradient behind the house and the light it gives
   cameras      the views of the dock: name, eye [x, y, z], target [x, y, z]; y of the attic views from the attic floor
   walk         eye height, body radius, the highest step, head room, speed cm/s, start position and heading */
window.HOUSE_BUILDING = {
 "name": "Dom w papawerach 5 (G)",
 "source": "Rzuty z archon.pl w skali (ok. ±3 cm).",
 "notes": [
  "Schody zabiegowe w kształcie U odczytane z rzutów: bieg z holu na zachód, spocznik przy ścianie, bieg powrotny nad garażem do holu piętra.",
  "Ściany z pustaków 24 i 12 cm, ściany zewnętrzne ocieplone od zewnątrz styropianem 20 cm. Lica zewnętrzne zostały w miejscu z rzutu, grubość odjęto od wnętrza. Portal (skrzydła ścian bocznych za szczytami i dach) ma przekrój 20 + 24 + 20 = 64 cm, pustak skrzydła w linii pustaka ściany bocznej."
 ],
 "levels": {"ground": 0, "attic": 297, "groundHeight": 272},
 "roof": {"pitch": 42, "knee": 120, "buildUp": "outer", "body": "plasterWhite", "covering": "roofGraphite", "planHeights": [140, 190, 220]},
 "portals": {"groundWingsTo": "attic"},
 "chimney": {"above": 90, "material": "graphite"},
 "fireplace": {"height": 105, "material": "fireplace"},
 "stair": {"tread": "tread", "core": "plasterInside"},
 "buildUps": {
  "outer":   {"name": "Ściana zewnętrzna", "layers": [{"name": "Pustak", "thickness": 24}, {"name": "Styropian", "thickness": 20, "material": "insulation"}]},
  "block24": {"name": "Ściana wewnętrzna 24", "layers": [{"name": "Pustak", "thickness": 24}]},
  "block12": {"name": "Ścianka działowa 12", "layers": [{"name": "Pustak", "thickness": 12}]}
 },
 "walls": {
  "ext":     {"name": "zewnętrzna", "material": "plasterWhite", "buildUp": "outer", "rank": 5, "upToAtticFloor": true},
  "portal":  {"name": "portal", "material": "plasterWhite", "buildUp": "outer", "rank": 5, "upToAtticFloor": true, "wing": true},
  "gable":   {"name": "szczytowa", "material": "plasterWhite", "buildUp": "outer", "rank": 4},
  "knee":    {"name": "kolankowa", "material": "plasterWhite", "buildUp": "outer", "rank": 3},
  "int24":   {"name": "wewnętrzna 24", "material": "plasterInside", "buildUp": "block24", "rank": 2},
  "int12":   {"name": "działowa 12", "material": "plasterInside", "buildUp": "block12", "rank": 2},
  "chimney": {"name": "komin", "material": "plasterInside", "rank": 6},
  "rail":    {"name": "balustrada", "material": "glass", "rank": 1, "height": 100}
 },
 "plinth": {"top": 0, "bottom": -30, "material": "plinth"},
 "site": {
  "lawn": {"rect": [-1500, -1500, 2400, 2800], "y": -30, "material": "lawn"},
  "terraces": [
   {"rect": [-100, -460, 1010, -101], "y": -12, "material": "paving"},
   {"rect": [0, -101, 910, 0], "y": -12, "material": "paving"},
   {"rect": [0, 1323, 910, 1700], "y": -12, "material": "paving"}
  ]
 },
 "faces": {
  "margin": 40,
  "depth": 1,
  "garden": {"z": 0},
  "front": [{"z": 1323}, {"z": 1232, "fromX": 440}],
  "default": "graphite"
 },
 "finishes": [
  {"face": "front", "floor": "ground", "x": [615.5, 661.4], "material": "woodVertical"},
  {"face": "front", "floor": "ground", "x": [741.0, 846.0], "material": "woodVertical"},
  {"face": "front", "floor": "attic", "x": [392.4, 522.4], "material": "woodVertical", "upTo": "windowLine"}
 ],
 "bands": [
  {"face": "garden", "x": [44, 866], "y": [238, 300], "material": "woodHorizontal"},
  {"face": "front", "x": [44, 866], "y": [245, 327], "material": "plasterWhite"}
 ],
 "claddings": [
  {"floor": "ground", "rect": [452.8, 1231, 453.8, 1322.8], "y": [0, 245], "material": "graphite"},
  {"floor": "ground", "rect": [846, 1231, 847, 1322.8], "y": [0, 245], "material": "graphite"},
  {"floor": "ground", "rect": [453.8, 1231, 846, 1322.8], "y": [245, 272], "material": "plasterWhite"},
  {"floor": "ground", "rect": [453.8, 1231, 846, 1322.8], "y": [244, 245], "material": "graphite"}
 ],
 "doors": {
  "entrance": {"leaf": 100, "hinge": "left", "material": "graphite",
               "grooves": 4, "handle": {"length": 120, "width": 3, "material": "steel"}},
  "interiorLintels": "fullHeight"
 },
 "gate": {"grooves": 4, "groove": "#2e3134"},
 "windows": {
  "frame": {"width": 8, "depth": 4, "mullionEvery": 150, "transom": 205, "material": "frame"},
  "glass": "glass",
  "setback": 6,
  "gate": "graphite",
  "attic": {"followRoof": true, "inset": 140, "mullionEvery": 140, "transom": 85}
 },
 "edges": {"color": "#8a8b86", "opacity": 0.4, "angle": 30},
 "materials": {
  "plasterWhite":   {"color": "#f4f3ef", "roughness": 0.94, "texture": {"strength": 0.55, "grain": 2, "tile": 110, "bump": 0}},
  "plasterInside":  {"color": "#f2eee6", "roughness": 0.95, "texture": {"strength": 0.35, "grain": 2, "tile": 110, "bump": 0}},
  "graphite":       {"color": "#45494d", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 2, "tile": 110, "bump": 0}},
  "roofGraphite":   {"color": "#3a3d40", "roughness": 0.78, "texture": {"strength": 0.35, "grain": 2, "tile": 60, "bump": 0}},
  "frame":          {"color": "#3b3e42", "roughness": 0.5, "metalness": 0.25},
  "steel":          {"color": "#c9cccf", "roughness": 0.3, "metalness": 0.8},
  "glass":          {"color": "#9fb5bf", "roughness": 0.02, "metalness": 0.1, "opacity": 0.3, "reflect": 1.6},
  "slab":           {"color": "#f1efe9", "roughness": 0.95},
  "plinth":         {"color": "#6d6e6c", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 3, "tile": 60, "bump": 0}},
  "tread":          {"color": "#a57b4f", "roughness": 0.6},
  "fireplace":      {"color": "#2b2b2c", "roughness": 0.6},
  "insulation":     {"color": "#dcc35e", "roughness": 0.95},
  "lawn":           {"color": "#6f8a52", "roughness": 1, "grass": {"tile": 120}},
  "paving":         {"color": "#b9b6ae", "roughness": 0.9, "slabs": {"size": 60, "joint": "#6a675f"}},
  "woodVertical":   {"wood": "H1180", "board": 12, "boardsVertical": true, "roughness": 0.7},
  "woodHorizontal": {"wood": "H1180", "board": 12, "boardsVertical": false, "roughness": 0.7}
 },
 "light": {
  "exposure": 0.8,
  "sun": {"azimuth": 35, "elevation": 38, "intensity": 1.35, "color": "#fff1dc"},
  "sky": {"intensity": 0.55, "color": "#cfe0ff", "groundColor": "#7a8466",
          "gradient": [[0, "#5f8fc4"], [0.32, "#9dbfe0"], [0.49, "#e4ecef"], [0.51, "#b7bfae"], [1, "#6f7a5e"]],
          "reflections": 0.8},
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
   {"name": "Hol", "eye": [560, 165, 880], "target": [150, 0, 650]},
   {"name": "Pokoje", "eye": [830, 165, 1250], "target": [300, 0, 1000]}
  ],
  "all": [
   {"name": "Od frontu", "eye": [-650, 420, 2650], "target": [455, 330, 660]},
   {"name": "Od ogrodu", "eye": [1250, 380, -1250], "target": [455, 330, 500]},
   {"name": "Z góry", "eye": [-1100, 1700, 2300], "target": [455, 250, 660]}
  ]
 },
 "walk": {"eye": 160, "radius": 22, "step": 36, "head": 18, "speed": 140, "start": {"x": 525, "z": 1150, "heading": 0}}
};
