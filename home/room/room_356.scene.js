HOME.data({
 "format": "scene",
 "version": 1,
 "groups": {
  "1": {"front": "N", "offset": [3203, 7588, 0], "size": [3513, 632, 2720]},
  "2": {"front": "E", "offset": [6162, 5360, 0], "size": [618, 2860, 2720]},
  "3": {"front": "S", "offset": [3460, 5702, 0], "size": [1736, 914, 908]}
 },
 "room": {"wallColor": "#f2f1ee"},
 "finish": {"metal": "brass"},
 "installation": {
  "sink": {"tapFromBack": 45, "trapTop": 575, "wallOutlet": 470},
  "hood": {"bottom": 1500}
 },
 "hardware": {
  "handle": {"axis": 28, "barLength": 160, "sideHeight": 260},
  "open": {"angle": {"door": 110, "fridge": 95, "dishwasher": 84, "oven": 88, "microwave": 100}, "drawer": 440, "doorStop": {"K21": 90}},
  "leg": {"fromSide": 45, "fromBack": 45, "fromFront": 100},
  "bins": {"count": 3, "height": 235},
  "plinthGrille": {"bottom": 20}
 },
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
  {"name": "All", "eye": [1808, 2820, 2900], "target": [5008, 6820, 900]},
  {"name": "Under the window", "eye": [5008, 5020, 1600], "target": [5008, 8120, 1150]},
  {"name": "Tall units", "eye": [3808, 6520, 1550], "target": [6608, 6720, 1350]},
  {"name": "Island", "eye": [5108, 7370, 1450], "target": [4328, 6142, 600]},
  {"name": "Sink", "eye": [5308, 6470, 1950], "target": [5308, 7920, 850]},
  {"name": "Corner", "eye": [5508, 5920, 1050], "target": [6358, 7720, 350]},
  {"name": "From above", "eye": [4738, 6310, 8200], "target": [4728, 6320, 0]}
 ]
});
