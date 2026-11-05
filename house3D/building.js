/* "Dom w papawerach 5 (G)" - the building shell for view.html: everything the view draws besides the walls, openings
   and rooms of plan.js and the floor tiles. view.html holds no numbers or colours of this house; it renders this file.
   Units: cm, angles in degrees. x across the house from the left outer wall face, z from the garden face to the front,
   y up from the finished ground floor.

   levels       finished floor levels; groundHeight = clear height of the ground floor (underside of the attic slab)
   roof         pitch, knee wall height (from plan.js: the knee walls give the eaves line), thickness of the roof slab
                measured square to the slope; body = the white band of the portals, covering = the roof surface
   portals      the side walls and the roof run past both gables (the portal frames); the ground floor parts of
                the portal walls rise to the attic floor
   chimney      the flue of plan.js (attic wall kind chimney), "above" = how far it rises over the ridge
   plinth       the base under the outer walls
   site         lawn and terraces, [x1, z1, x2, z2] at a top level y
   faces        which wall pieces of plan.js form the gable faces: garden at z = 0, front at z = 1323, the recessed
                entrance at z = 1232 from x 440; pieces within "margin" of the side walls belong to the portals
   finishes     facade finish of the gable faces, by face, floor and x range (exactly the edges of the openings
                of plan.js beside them); anything else on a face = default;
                upTo "windowLine": the finish stops at the line of the attic window tops (the wood between the front
                windows ends in a peak), above it the default
   bands        extra facade strips drawn in front of a face (the front one is the white band between the floors of
                the visualisation; the attic front windows start on it: sill 30 in plan.js)
   claddings    extra thin finishes [x1, z1, x2, z2] from y to y: the graphite sides of the entrance recess, its white
                beam under the band and the graphite soffit
   doors        entrance: the door leaf in the entrance opening (from the hinge side), the rest is a glass sidelight;
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
 "levels": {"ground": 0, "attic": 297, "groundHeight": 272},
 "roof": {"pitch": 42, "knee": 120, "thickness": 55, "body": "plasterWhite", "covering": "roofGraphite"},
 "portals": {"groundWingsTo": "attic"},
 "chimney": {"above": 90, "material": "graphite"},
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
  "garden": {"z": 0},
  "front": [{"z": 1323}, {"z": 1232, "fromX": 440}],
  "default": "graphite"
 },
 "finishes": [
  {"face": "front", "floor": "ground", "x": [615.5, 661.4], "material": "woodVertical"},
  {"face": "front", "floor": "ground", "x": [741.0, 866.6], "material": "woodVertical"},
  {"face": "front", "floor": "attic", "x": [390.0, 522.4], "material": "woodVertical", "upTo": "windowLine"}
 ],
 "bands": [
  {"face": "garden", "x": [43, 867], "y": [238, 300], "depth": 2, "material": "woodHorizontal"},
  {"face": "front", "x": [43.4, 866.6], "y": [245, 327], "depth": 2, "material": "plasterWhite"}
 ],
 "claddings": [
  {"floor": "ground", "rect": [453.8, 1231, 454.8, 1322.8], "y": [0, 245], "material": "graphite"},
  {"floor": "ground", "rect": [846.2, 1231, 847.2, 1322.8], "y": [0, 245], "material": "graphite"},
  {"floor": "ground", "rect": [453.8, 1231, 847.2, 1325], "y": [245, 272], "material": "plasterWhite"},
  {"floor": "ground", "rect": [453.8, 1231, 847.2, 1325], "y": [244, 245], "material": "graphite"}
 ],
 "doors": {
  "entrance": {"floor": "ground", "opening": [453.8, 1187.6, 615.5, 1231.0], "leaf": 100, "hinge": "left", "material": "graphite",
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
  "lawn":           {"color": "#6f8a52", "roughness": 1, "grass": {"tile": 120}},
  "paving":         {"color": "#b9b6ae", "roughness": 0.9, "slabs": {"size": 60, "joint": "#6a675f"}},
  "woodVertical":   {"wood": "H1180", "board": 12, "boardsVertical": true, "roughness": 0.7},
  "woodHorizontal": {"wood": "H1180", "board": 12, "boardsVertical": false, "roughness": 0.7}
 },
 "walls": {"ext": "plasterWhite", "knee": "plasterWhite", "gable": "plasterWhite", "int": "plasterInside", "chimney": "plasterInside", "rail": "glass"},
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
