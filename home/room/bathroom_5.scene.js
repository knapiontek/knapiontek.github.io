HOME.data({
 "format": "scene",
 "version": 1,
 "groups": {
  "1": {"front": "W", "offset": [0, 200, 0], "size": [481, 1600, 1080]}
 },
 "fixtures": {
  "mirror1": {"product": "mirror-led-600x800", "front": "W", "offset": [12, 300, 1220]},
  "mirror2": {"product": "mirror-led-600x800", "front": "W", "offset": [12, 1100, 1220]},
  "radiator": {"product": "mexen-hades-1200x400-gold", "front": "S", "offset": [10, 12, 820], "metal": "nickel"},
  "corner": {"product": "shower-corner-1000x1000", "front": "W", "offset": [1685, 12, 0], "metal": "nickel"},
  "drain": {"product": "linear-drain-vogi-duo-880", "front": "E", "offset": [2658, 60, 0]},
  "shower": {"product": "shower-set-rain-thermostat", "front": "S", "offset": [1980, 12, 0], "metal": "nickel"},
  "bath": {"product": "castorama-bath-freestanding-170x75", "front": "N", "offset": [390, 2030, 0], "metal": "nickel"},
  "bathTap": {"product": "hansgrohe-tecturis-e-73445000", "front": "N", "offset": [250, 2580, 0]},
  "riser": {"product": "riser-pvc-160", "front": "E", "offset": [2540, 2820, 0], "height": 1200},
  "outlet": {"product": "pvc-pipe-90", "front": "E", "offset": [2535, 1550, 185], "length": 1350},
  "hatch": {"product": "inspection-hatch-200", "front": "E", "offset": [2462, 2710, 250], "metal": "nickel"},
  "wcFrame": {"product": "wc-frame-geberit-duofix", "front": "E", "offset": [2460, 1300, 0], "depth": 200, "metal": "nickel"},
  "wc": {"product": "wc-bowl-wall-hung-360x530", "front": "E", "offset": [1928, 1370, 0], "metal": "nickel"}
 },
 "builtIns": [
  {"name": "WC casing over the frame and the riser", "box": [2480, 2730, 1250, 3010, 0, 1200], "material": "wall"},
  {"name": "Its top, a shelf", "box": [2470, 2730, 1250, 2985, 1200, 1220], "material": "melamineWhite", "tiled": false}
 ],
 "tiles": {
  "walls": {"product": "paradyz-authority-grey", "format": [1198, 598], "dir": "x", "pattern": "grid"},
  "floor": {"product": "paradyz-authority-grey", "dir": "x", "pattern": "grid"},
  "shower": {"zone": [1730, 2730, 0, 1010],
   "walls": {"product": "paradyz-authority-grey", "format": [1198, 598], "dir": "y", "pattern": "grid"},
   "floor": {"product": "paradyz-authority-grey", "format": [598, 598], "dir": "x", "pattern": "grid"}}
 },
 "room": {"wallColor": "#eeece7"},
 "hardware": {
  "open": {"angle": {"door": 110}, "drawer": 330}
 },
 "lights": {
  "downlights": [{"at": [450, 600]}, {"at": [1365, 927]}, {"at": [2230, 500]}]
 },
 "cameras": [
  {"name": "Overview", "eye": [4930, -1900, 4600], "target": [1365, 1505, 800]},
  {"name": "From the door", "eye": [1280, 150, 1620], "target": [1565, 3010, 1000]},
  {"name": "The basins", "eye": [1830, 2510, 1650], "target": [200, 1000, 950]},
  {"name": "The bath", "eye": [2180, 900, 1700], "target": [1240, 2405, 450]},
  {"name": "The shower", "eye": [350, 1600, 1650], "target": [2230, 500, 1100]},
  {"name": "Plan", "eye": [1355, 1515, 7400], "target": [1365, 1505, 0]}
 ]
});
