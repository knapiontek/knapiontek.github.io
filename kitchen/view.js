/* Kitchen project scene - read by view.html. Written for each project (LLM). Plain JSON after "window.KITCHEN_VIEW =".
   Only what the 3D view needs and design.js does not hold: the cabinets come from design.js through engine.js, the
   appliances from appliances.js; view.html names no group, run or size of this kitchen.
   Room coordinates in mm: x along the window wall from the start of group 1, z out from the window wall, y up.
     placement   where each design.js group stands, by group number: x, z of its first column at the wall line (n = 0),
                 rot = turn in degrees (0: along the window wall, facing the room), name = its label in the view.
                 A group whose worktop has the tag island (design.js) stands free: no wall behind it.
     room        ceiling (measured), the other sizes rounded to whole metres; rightWallGroup: the group against the right
                 wall (the wall is at its x); floorJoint: the tile joint, mm (the tiles: textures.js floors);
                 floorTile [length, width]: the drawn floor when textures.js has no floors; wallColor
     installation  how appliances are fitted here: sink tap (tapFromBack: from the back edge of the worktop), its trap
                 (trapTop, wallOutlet: heights above the floor); hood (bottom: height above the floor). An appliance on
                 adjustable feet (appliances.js) gets its front centred in its module.
     window      x of its left edge, width, sill and height above the floor, reveal depth, frame finish
     finishes    finishes shown in the Project tab next to the design.js materials: [use, name, CSS swatch]
     hardware    sizes for the drawing only, no effect on the cost: handle (metal: a key of metals), open (degrees; drawer: mm;
                 doorStop: carcass → degrees where a stop holds its door, e.g. a bumper on the wall panel),
                 leg, hinge, drawer, bins, plinthGrille
     metals      colour, roughness, metalness of each metal
     lights      pendants: [x, z] points and the shade bottom height; downlights: [x, z], or {between: [sink, hob], z}:
                 x halfway between the sink axis and the hob axis
     cameras     the views in the dock, in order: p = camera position, t = target (m, room coordinates); the first one opens */
window.KITCHEN_VIEW = {
 "placement": {
  "1": {"name": "pod oknem", "x": 0, "z": 0, "rot": 0},
  "2": {"name": "zabudowa wysoka", "x": 3372, "z": 0, "rot": -90},
  "3": {"name": "wyspa", "x": 1730, "z": 2440, "rot": 180}
 },
 "room": {"ceiling": 2740, "leftEnd": -1000, "floorDepth": 4000, "wallThickness": 300, "rightWallGroup": 2, "rightWallLength": 4000, "floorJoint": 2, "floorTile": [900, 900], "wallColor": "#f2f1ee"},
 "installation": {
  "sink": {"tapFromBack": 45, "trapTop": 575, "wallOutlet": 470},
  "hood": {"bottom": 1500}
 },
 "window": {"x": 870, "width": 1900, "sill": 1080, "height": 1300, "reveal": 150, "finish": "antracyt"},
 "finishes": [
  ["Zlew", "Kompozyt kwarcowy", "radial-gradient(circle at 30% 40%,#8a8a88 0 1px,transparent 1.5px) 0 0/5px 5px,#2a2b2d"]
 ],
 "hardware": {
  "handle": {"metal": "brass", "axis": 28, "cupLength": 89, "barLength": 160, "sideHeight": 260},
  "open": {"door": 110, "fridge": 95, "dishwasher": 84, "oven": 88, "micro": 100, "drawer": 440, "doorStop": {"K4": 90}},
  "leg": {"radius": 15, "footRadius": 24, "footHeight": 12, "fromSide": 45, "fromBack": 45, "fromFront": 100},
  "hinge": {"cupDepth": 11.5},
  "drawer": {"runner": 13, "sideFromCarcass": 22, "sideThickness": 15.5, "fromBack": 36, "fromFront": 16, "innerSide": 84},
  "bins": {"count": 3, "height": 235},
  "plinthGrille": {"width": 480, "bottom": 20, "top": 80}
 },
 "metals": {
  "brass": {"color": "#c9a063", "rough": 0.32, "metal": 0.7},
  "nickel": {"color": "#c4c4c0", "rough": 0.34, "metal": 0.55},
  "black": {"color": "#222326", "rough": 0.5, "metal": 0.3}
 },
 "lights": {
  "pendants": {"points": [[477.48, 2290], [1252.52, 2290]], "bottom": 1750},
  "downlights": [{"between": ["sink", "hob"], "z": 402}, [2440, 402], [2440, 1370], [2440, 2338]]
 },
 "cameras": {
  "all": {"name": "Całość", "p": [-1.6, 2.9, 5.4], "t": [1.6, 0.9, 1.4]},
  "window": {"name": "Pod oknem", "p": [1.6, 1.6, 3.2], "t": [1.6, 1.15, 0.1]},
  "tall": {"name": "Zabudowa wysoka", "p": [0.4, 1.55, 1.7], "t": [3.2, 1.35, 1.5]},
  "island": {"name": "Wyspa", "p": [1.7, 1.45, 0.85], "t": [0.85, 0.6, 2.25]},
  "sink": {"name": "Zlew", "p": [1.9, 1.95, 1.75], "t": [1.9, 0.85, 0.3]},
  "corner": {"name": "Narożnik", "p": [2.1, 1.05, 2.3], "t": [2.95, 0.35, 0.5]},
  "top": {"name": "Rzut", "p": [1.33, 8.2, 1.91], "t": [1.32, 0, 1.9]}
 }
};
