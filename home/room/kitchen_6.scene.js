HOME.data({
 "format": "scene",
 "version": 1,
 "groups": {
  "1": {"front": "y0", "offset": [2813, 2228, 0], "size": [3513, 632, 2720]},
  "2": {"front": "x0", "offset": [5772, 0, 0], "size": [618, 2860, 2720]},
  "3": {"front": "y1", "offset": [3070, 342, 0], "size": [1736, 914, 908]}
 },
 "room": {"wallColor": "#f2f1ee"},
 "installation": {
  "sink": {"tapFromBack": 45, "trapTop": 575, "wallOutlet": 470},
  "hood": {"bottom": 1500}
 },
 "hardware": {
  "handle": {"axis": 28, "barLength": 160, "sideHeight": 260},
  "handles": {"options": ["brass", "nickel", "blackHandle"], "default": "brass"},
  "open": {"angle": {"door": 110, "fridge": 95, "dishwasher": 84, "oven": 88, "microwave": 100}, "drawer": 440, "doorStop": {"K21": 90}},
  "leg": {"fromSide": 45, "fromBack": 45, "fromFront": 100},
  "bins": {"count": 3, "height": 235},
  "plinthGrille": {"bottom": 20}
 },
 "floors": ["paradyz-authority-graphite", "paradyz-authority-grey"],
 "floorJoint": 2,
 "lights": {
  "pendantBottom": 1750,
  "pendants": {"group": 3, "count": 2, "spacing": 776},
  "downlights": [
   {"group": 1, "between": ["sink", "hob"], "y": 402},
   {"group": 2, "x": 402, "y": 932},
   {"group": 2, "x": 1370, "y": 932},
   {"group": 2, "x": 2338, "y": 932}
  ]
 },
 "cameras": [
  {"name": "All", "eye": [3248, 3260, 4220], "target": [6448, 7260, 2220]},
  {"name": "Under the window", "eye": [6448, 5460, 2920], "target": [6448, 8560, 2470]},
  {"name": "Tall units", "eye": [5248, 6960, 2870], "target": [8048, 7160, 2670]},
  {"name": "Island", "eye": [6548, 7810, 2770], "target": [5768, 6582, 1920]},
  {"name": "Sink", "eye": [6748, 6910, 3270], "target": [6748, 8360, 2170]},
  {"name": "Corner", "eye": [6948, 6360, 2370], "target": [7798, 8160, 1670]},
  {"name": "From above", "eye": [6178, 6750, 9520], "target": [6168, 6760, 1320]}
 ]
});
