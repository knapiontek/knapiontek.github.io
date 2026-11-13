/* Kitchen scene for view.html: only what the 3D view needs beyond design.js and ../library. Written per project (LLM).
   House axes and positions in mm: x along the house, y across, z up (../house/house.js). The room itself (walls, slab,
   floor, window) is the house's own, copied as it is by ../house/house-clip.js; nothing of it is repeated here.
     placement     where each group stands (by group number) and which way its fronts face (-y, +y, -x, +x); an island
                   stands free; x, y = the point its anchor names (start (default), end, centre or {column}: the end of
                   that column) on the wall line of the group (an island: the line of its carcass backs);
                   against {group}: the anchor lies on the front plane of that group (an L corner), instead of x or y
     floors        the floor tiles to choose from (product keys of ../library/products.js tiles); the first is the default
     room          floorJoint: the grout joint width of the floor tiles; wallColor: the plasterboard and the ceiling finish
     installation  how the sink, its trap and the hood are fitted here
     finishes      extra finishes for the Project tab, drawn with a material of the view
     hardware      sizes for the drawing only (no effect on the cost); open: how far doors and drawers open
     metals        the metal finishes of the handles to choose from; hardware.handle.metal is the default
     lights        pendantBottom: the height of the pendants' bottom; pendants: centred over the worktop of their group;
                   downlights at {group, u, n} (u along the group from its start, n out from the wall), between [sink, hob] instead of u: halfway between their axes
     views         as in house.js, one per mode: 3D (menu: the groups, by layer, with their names in the menu), the 2D plan
                   (cut at the house's own height for the floor), Test (the checks), Info; tabs: of the right panel
     cameras       the views in the bottom menu; the first one opens */
window.KITCHEN_VIEW = {
 "placement": {
  "1": {"y": 8660, "faces": "-y", "anchor": {"column": 11}, "against": {"group": 2}},
  "2": {"x": 7220, "y": 8660, "faces": "-x"},
  "3": {"x": 4768, "y": 6452, "faces": "+y", "anchor": "centre"}
 },
 "floors": ["paradyz-authority-graphite", "paradyz-authority-grey"],
 "room": {"floorJoint": 2, "wallColor": "#f2f1ee"},
 "installation": {
  "sink": {"tapFromBack": 45, "trapTop": 575, "wallOutlet": 470},
  "hood": {"bottom": 1500}
 },
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
 "views": {
  "3d": {"name": "3D", "menu": [{"layer": "g1", "name": "G1"}, {"layer": "g2", "name": "G2"}, {"layer": "g3", "name": "Wyspa"}], "tabs": ["layers", "finish"]},
  "2d": {"name": "2D", "plan": true, "note": "Ogród u góry. Linią ciągłą to, co pod cięciem (widziane z góry), przerywaną to, co nad nim.", "tabs": ["layers", "finish"]},
  "test": {"name": "Test", "test": true, "tabs": ["layers", "finish"]},
  "info": {"name": "Info", "info": true, "tabs": ["finish", "layers"]}
 },
 "cameras": {
  "all": {"name": "Całość", "position": {"x": 2248, "y": 3260, "z": 2900}, "target": {"x": 5448, "y": 7260, "z": 900}},
  "window": {"name": "Pod oknem", "position": {"x": 5448, "y": 5460, "z": 1600}, "target": {"x": 5448, "y": 8560, "z": 1150}},
  "tall": {"name": "Zabudowa wysoka", "position": {"x": 4248, "y": 6960, "z": 1550}, "target": {"x": 7048, "y": 7160, "z": 1350}},
  "island": {"name": "Wyspa", "position": {"x": 5548, "y": 7810, "z": 1450}, "target": {"x": 4768, "y": 6582, "z": 600}},
  "sink": {"name": "Zlew", "position": {"x": 5748, "y": 6910, "z": 1950}, "target": {"x": 5748, "y": 8360, "z": 850}},
  "corner": {"name": "Narożnik", "position": {"x": 5948, "y": 6360, "z": 1050}, "target": {"x": 6798, "y": 8160, "z": 350}},
  "top": {"name": "Rzut", "position": {"x": 5178, "y": 6750, "z": 8200}, "target": {"x": 5168, "y": 6760, "z": 0}}
 }
};
