HOME.data({
 "format": "scene",
 "version": 1,
 "groups": {
  "1": {"front": "x1", "offset": [0, 200, 0], "size": [480, 1200, 1080]}
 },
 "fixtures": {
  "riser": {"product": "riser-pvc-160", "front": "x1", "offset": [30, 2200, 0]},
  "wcFrame": {"product": "wc-frame-geberit-duofix", "front": "x1", "offset": [100, 1555, 0], "plate": 190, "depth": 198},
  "wc": {"product": "wc-bowl-wall-hung-360x530", "front": "x1", "offset": [290, 1625, 70]},
  "cabinet": {"product": "wall-cabinet-400x800x150", "front": "x1", "offset": [130, 1605, 1200]},
  "mirror": {"product": "mirror-led-600x800", "front": "x1", "offset": [10, 800, 1220]},
  "radiator": {"product": "mexen-hades-1200x400-gold", "front": "y1", "offset": [20, 10, 820]},
  "screen": {"product": "shower-screen-1000-door-600", "front": "x1", "offset": [1598, 1390, 0]},
  "drain": {"product": "linear-drain-vogi-duo-880", "front": "x0", "offset": [2450, 1450, 0]},
  "shower": {"product": "shower-set-rain-thermostat", "front": "y1", "offset": [1910, 1400, 0]}
 },
 "builtIns": [
  {"name": "WC casing, behind the frame", "box": [0, 130, 1540, 2390, 0, 2720], "material": "wall"},
  {"name": "WC casing, in front of the frame", "box": [130, 280, 1540, 2390, 0, 1200], "material": "wall"},
  {"name": "WC casing, beside the cabinet (door side)", "box": [130, 280, 1540, 1605, 1200, 2720], "material": "wall"},
  {"name": "WC casing, beside the cabinet (window side)", "box": [130, 280, 2005, 2390, 1200, 2720], "material": "wall"},
  {"name": "WC casing, over the cabinet", "box": [130, 280, 1605, 2005, 2000, 2720], "material": "wall"}
 ],
 "tiles": {
  "walls": {"product": "paradyz-authority-graphite", "format": [1198, 598], "dir": "x", "pattern": "grid"},
  "floor": {"product": "paradyz-authority-grey", "dir": "x", "pattern": "grid"},
  "shower": {"zone": [1610, 2510, 1390, 2390],
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
