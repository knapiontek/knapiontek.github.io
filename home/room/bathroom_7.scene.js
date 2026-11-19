HOME.data({
 "format": "scene",
 "version": 1,
 "groups": {
  "1": {"front": "W", "offset": [0, 200, 0], "size": [480, 1200, 1080]}
 },
 "fixtures": {
  "riser": {"product": "riser-pvc-160", "front": "W", "offset": [30, 2200, 0]},
  "hatch": {"product": "inspection-hatch-200", "front": "W", "offset": [292, 2120, 250]},
  "wcFrame": {"product": "wc-frame-geberit-duofix", "front": "W", "offset": [100, 1555, 0], "depth": 200},
  "outlet": {"product": "pvc-pipe-90", "front": "W", "offset": [135, 1805, 185], "length": 475},
  "wc": {"product": "wc-bowl-wall-hung-360x530", "front": "W", "offset": [292, 1625, 0]},
  "cabinet": {"product": "wall-cabinet-400x800x150", "front": "W", "offset": [142, 1605, 1200]},
  "mirror": {"product": "mirror-led-600x800", "front": "W", "offset": [12, 800, 1220]},
  "radiator": {"product": "mexen-hades-1200x400-gold", "front": "S", "offset": [10, 12, 820]},
  "screen": {"product": "shower-screen-1000-door-600", "front": "W", "offset": [1642, 1390, 0]},
  "drain": {"product": "linear-drain-vogi-duo-880", "front": "E", "offset": [2438, 1450, 0]},
  "shower": {"product": "shower-set-rain-thermostat", "front": "S", "offset": [1810, 1402, 0]}
 },
 "builtIns": [
  {"name": "WC casing over the frame and the riser", "box": [0, 280, 1540, 2390, 0, 2720], "cuts": [[130, 280, 1593, 2017, 1200, 2000]], "material": "wall"}
 ],
 "tiles": {
  "walls": {"product": "paradyz-authority-graphite", "format": [1198, 598], "dir": "x", "pattern": "grid"},
  "floor": {"product": "paradyz-authority-grey", "dir": "x", "pattern": "grid"},
  "shower": {"zone": [1654, 2510, 1390, 2390],
   "walls": {"product": "paradyz-authority-graphite", "format": [1198, 598], "dir": "x", "pattern": "grid"},
   "floor": {"product": "paradyz-authority-grey", "dir": "x", "pattern": "grid"}}
 },
 "room": {"wallColor": "#e9e7e2"},
 "hardware": {
  "open": {"angle": {"door": 110}, "drawer": 330}
 },
 "lights": {
  "downlights": [{"at": [1160, 500]}, {"at": [1060, 1350]}, {"at": [400, 1050]}, {"at": [760, 1990]}, {"at": [2060, 2140]}]
 },
 "cameras": [
  {"name": "Overview", "eye": [2710, -1700, 2980], "target": [55, 1345, 800]},
  {"name": "From the door", "eye": [870, 120, 1620], "target": [1155, 2390, 1200]},
  {"name": "The vanity", "eye": [1560, 120, 1680], "target": [250, 1245, 950]},
  {"name": "The shower", "eye": [400, 2240, 1650], "target": [2060, 1690, 1150]},
  {"name": "Plan", "eye": [1245, 1205, 7400], "target": [1255, 1195, 0]}
 ]
});
