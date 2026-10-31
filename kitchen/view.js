/* Kitchen scene for view.html: only what the 3D view needs beyond design.js and appliances.js. Written per project (LLM).
   Room coordinates in mm: x along the window wall, z out from it, y up.
     placement     where each group stands (by group number) and how it is turned; an island stands free
     room          walls, floor and ceiling; rightWallGroup: the group against the right wall
     installation  how the sink, its trap and the hood are fitted here
     finishes      extra finishes for the Project tab, drawn with a material of the view
     hardware      sizes for the drawing only (no effect on the cost); open: how far doors and drawers open
     lights        pendants and downlights; a downlight can sit halfway between the sink and the hob
     cameras       the views in the dock; the first one opens */
window.KITCHEN_VIEW = {
 "placement": {
  "1": {"name": "pod oknem", "x": 0, "z": 0, "rotation": 0},
  "2": {"name": "zabudowa wysoka", "x": 3372, "z": 0, "rotation": -90},
  "3": {"name": "wyspa", "x": 1730, "z": 2440, "rotation": 180}
 },
 "room": {"ceiling": 2740, "leftEnd": -1000, "floorDepth": 4000, "wallThickness": 300, "rightWallGroup": 2, "rightWallLength": 4000, "floorJoint": 2, "floorTile": {"length": 900, "width": 900}, "wallColor": "#f2f1ee"},
 "installation": {
  "sink": {"tapFromBack": 45, "trapTop": 575, "wallOutlet": 470},
  "hood": {"bottom": 1500}
 },
 "window": {"x": 870, "width": 1900, "sill": 1080, "height": 1300, "reveal": 150, "finish": "antracyt"},
 "finishes": [
  {"use": "Zlew", "name": "Kompozyt kwarcowy", "material": "granite"}
 ],
 "hardware": {
  "handle": {"metal": "brass", "axis": 28, "cupLength": 89, "barLength": 160, "sideHeight": 260},
  "open": {"angle": {"door": 110, "fridge": 95, "dishwasher": 84, "oven": 88, "micro": 100}, "drawer": 440, "doorStop": {"K4": 90}},
  "leg": {"radius": 15, "footRadius": 24, "footHeight": 12, "fromSide": 45, "fromBack": 45, "fromFront": 100},
  "hinge": {"cupDepth": 11.5},
  "drawer": {"runner": 13, "sideFromCarcass": 22, "sideThickness": 15.5, "fromBack": 36, "fromFront": 16, "innerSide": 84},
  "bins": {"count": 3, "height": 235},
  "plinthGrille": {"width": 480, "bottom": 20, "top": 80}
 },
 "metals": {
  "brass": {"color": "#c9a063", "roughness": 0.32, "metalness": 0.7},
  "nickel": {"color": "#c4c4c0", "roughness": 0.34, "metalness": 0.55},
  "black": {"color": "#222326", "roughness": 0.5, "metalness": 0.3}
 },
 "lights": {
  "pendants": {"positions": [{"x": 477.48, "z": 2290}, {"x": 1252.52, "z": 2290}], "bottom": 1750},
  "downlights": [
   {"between": ["sink", "hob"], "z": 402},
   {"x": 2440, "z": 402},
   {"x": 2440, "z": 1370},
   {"x": 2440, "z": 2338}
  ]
 },
 "cameras": {
  "all": {"name": "Całość", "position": {"x": -1600, "y": 2900, "z": 5400}, "target": {"x": 1600, "y": 900, "z": 1400}},
  "window": {"name": "Pod oknem", "position": {"x": 1600, "y": 1600, "z": 3200}, "target": {"x": 1600, "y": 1150, "z": 100}},
  "tall": {"name": "Zabudowa wysoka", "position": {"x": 400, "y": 1550, "z": 1700}, "target": {"x": 3200, "y": 1350, "z": 1500}},
  "island": {"name": "Wyspa", "position": {"x": 1700, "y": 1450, "z": 850}, "target": {"x": 850, "y": 600, "z": 2250}},
  "sink": {"name": "Zlew", "position": {"x": 1900, "y": 1950, "z": 1750}, "target": {"x": 1900, "y": 850, "z": 300}},
  "corner": {"name": "Narożnik", "position": {"x": 2100, "y": 1050, "z": 2300}, "target": {"x": 2950, "y": 350, "z": 500}},
  "top": {"name": "Rzut", "position": {"x": 1330, "y": 8200, "z": 1910}, "target": {"x": 1320, "y": 0, "z": 1900}}
 }
};
