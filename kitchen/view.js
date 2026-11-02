/* Kitchen scene for view.html: only what the 3D view needs beyond design.js and appliances.js. Written per project (LLM).
   Room coordinates in mm: x along the window wall, z out from it, y up.
     placement     where each group stands (by group number) and how it is turned; an island stands free;
                   x, z = the point its anchor names (start (default), end, centre or {column}: the end of that column)
                   on the wall line of the group (an island: the line of its carcass backs);
                   against {group}: the anchor lies on the front plane of that group (an L corner), instead of x or z
     room          walls, floor and ceiling; rightWallGroup: the group against the right wall
     installation  how the sink, its trap and the hood are fitted here
     window        the window in the window wall
     finishes      extra finishes for the Project tab, drawn with a material of the view
     hardware      sizes for the drawing only (no effect on the cost); open: how far doors and drawers open
     metals        the metal finishes of the handles to choose from; hardware.handle.metal is the default
     lights        pendantBottom: the height of the pendants' bottom; pendants: centred over the worktop of their group;
                   downlights at {group, u, n} (n from the wall), between [sink, hob] instead of u: halfway between their axes
     cameras       the views in the dock; the first one opens */
window.KITCHEN_VIEW = {
 "placement": {
  "1": {"name": "pod oknem", "z": 0, "rotation": 0, "anchor": {"column": 11}, "against": {"group": 2}},
  "2": {"name": "zabudowa wysoka", "x": 3372, "z": 0, "rotation": -90},
  "3": {"name": "wyspa", "x": 920, "z": 2208, "rotation": 180, "anchor": "centre"}
 },
 "room": {"ceiling": 2740, "leftEnd": -1000, "floorDepth": 4000, "wallThickness": 300, "rightWallGroup": 2, "rightWallLength": 4000, "floorJoint": 2, "wallColor": "#f2f1ee"},
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
  "open": {"angle": {"door": 110, "fridge": 95, "dishwasher": 84, "oven": 88, "microwave": 100}, "drawer": 440, "doorStop": {"K4": 90}},
  "leg": {"radius": 15, "footRadius": 24, "footHeight": 12, "fromSide": 45, "fromBack": 45, "fromFront": 100},
  "hinge": {"cupDepth": 11.5},
  "drawer": {"runnerWidth": 13, "sideFromCarcass": 22, "sideThickness": 15.5, "fromBack": 36, "fromFront": 16},
  "bins": {"count": 3, "height": 235},
  "plinthGrille": {"width": 480, "bottom": 20, "top": 80}
 },
 "metals": {
  "brass": {"name": "Złoty (mosiądz)", "color": "#c9a063", "roughness": 0.32, "metalness": 0.7},
  "nickel": {"name": "Nikiel", "color": "#c4c4c0", "roughness": 0.34, "metalness": 0.55},
  "black": {"name": "Czarny", "color": "#222326", "roughness": 0.5, "metalness": 0.3}
 },
 "lights": {
  "pendantBottom": 1750,
  "pendants": {"group": 3, "count": 2, "spacing": 776},
  "downlights": [
   {"group": 1, "between": ["sink", "hob"], "n": 402},
   {"group": 2, "u": 402, "n": 932},
   {"group": 2, "u": 1370, "n": 932},
   {"group": 2, "u": 2338, "n": 932}
  ]
 },
 "cameras": {
  "all": {"name": "Całość", "position": {"x": -1600, "y": 2900, "z": 5400}, "target": {"x": 1600, "y": 900, "z": 1400}},
  "window": {"name": "Pod oknem", "position": {"x": 1600, "y": 1600, "z": 3200}, "target": {"x": 1600, "y": 1150, "z": 100}},
  "tall": {"name": "Zabudowa wysoka", "position": {"x": 400, "y": 1550, "z": 1700}, "target": {"x": 3200, "y": 1350, "z": 1500}},
  "island": {"name": "Wyspa", "position": {"x": 1700, "y": 1450, "z": 850}, "target": {"x": 920, "y": 600, "z": 2078}},
  "sink": {"name": "Zlew", "position": {"x": 1900, "y": 1950, "z": 1750}, "target": {"x": 1900, "y": 850, "z": 300}},
  "corner": {"name": "Narożnik", "position": {"x": 2100, "y": 1050, "z": 2300}, "target": {"x": 2950, "y": 350, "z": 500}},
  "top": {"name": "Rzut", "position": {"x": 1330, "y": 8200, "z": 1910}, "target": {"x": 1320, "y": 0, "z": 1900}}
 }
};
