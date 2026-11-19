HOME.data({
 "format": "scene",
 "version": 1,
 "groups": {
  "1": {"front": "N", "offset": [2813, 2228, 0], "size": [3513, 632, 2720]},
  "2": {"front": "E", "offset": [5772, 0, 0], "size": [618, 2860, 2720]},
  "3": {"front": "S", "offset": [3070, 342, 0], "size": [1736, 914, 908]}
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
  {"name": "All", "eye": [1418, -2540, 2900], "target": [4618, 1460, 900]},
  {"name": "Under the window", "eye": [4618, -340, 1600], "target": [4618, 2760, 1150]},
  {"name": "Tall units", "eye": [3418, 1160, 1550], "target": [6218, 1360, 1350]},
  {"name": "Island", "eye": [4718, 2010, 1450], "target": [3938, 782, 600]},
  {"name": "Sink", "eye": [4918, 1110, 1950], "target": [4918, 2560, 850]},
  {"name": "Corner", "eye": [5118, 560, 1050], "target": [5968, 2360, 350]},
  {"name": "From above", "eye": [4348, 950, 8200], "target": [4338, 960, 0]}
 ]
});
