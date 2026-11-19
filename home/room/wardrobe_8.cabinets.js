HOME.data({
 "format": "cabinets",
 "version": 1,
 "settings": {
  "materials": {"carcass": "white-melamine-18", "drawerBox": "white-melamine-16", "backPanel": "hdf-white-3", "plinth": "plinth-pvc-50-white"},
  "hardware": {"leg": "leveling-feet-50"},
  "carcass": {"depth": 397, "frontGap": 2, "legs": 4},
  "backPanel": {"inset": 0},
  "shelf": {"setback": 20, "clearance": 1, "grid": {"from": 686, "pitch": 340, "fixedEvery": 2}},
  "drawers": {"box": "board", "board": {"sideHeight": 264, "lift": 10, "clearance": 13, "setback": 2, "backClearance": 40, "runnerLengths": [250, 350, 750]}},
  "plinth": {"setback": 30},
  "drilling": {
   "shelfPin": {"diameter": 5, "depth": 10, "fromFront": 69, "fromBack": 65, "belowShelf": 3},
   "runner": {"diameter": 2.5, "depth": 10, "fromFront": [37, 261, 485], "belowDrawer": 10},
   "ballRunner": {"fromFront": [37, 229, 421], "aboveBottom": 23}
  }
 },
 "appliances": {

 },
 "notes": [
  {"name": "Room", "description": "Walk-in wardrobe 8, attic", "details": "A deep run (400) opposite the door, a shallow one (300) by the door from the slope; no carcass between the door and the hall wall (the heat-recovery ducts)."},
  {"name": "Carcass", "description": "Sides the full height of the carcass, the bottom and the top between them, the back of HDF nailed on behind; at most 1316 high", "details": "Where a run is taller, a second carcass (its name + U) stands on the lower one at 1366, the fixed shelf’s line, screwed to it through its bottom. Under the slope each carcass is lower: its top stays clear of the lowest point of the ceiling over it."},
  {"name": "Shelves", "description": "On one grid of the room: 686 above the floor, then every 340", "details": "Fixed on every second line (they stiffen the carcass), adjustable on pins on the others; every shelf level with its neighbours’."},
  {"name": "Drawers", "description": "Two at the bottom of every carcass, boxes of 16 mm board on full-extension ball runners, push to open", "details": "The runners as long as the carcass allows: 250 in a 300 carcass, 350 in a 400 one, 750 in the niche."},
  {"name": "Plinth", "description": "Levelling feet under every carcass, a waterproof PVC plinth in front, set back 30", "details": ""},
  {"name": "Board", "description": "The cheapest plain white melamine", "details": "Edge banding only where an edge is seen: the front edges of the sides, the bottom, the top and the shelves; the top edges of the drawer boxes."}
 ],
 "groups": [
  {"group": 1, "name": "opposite the door", "backGap": 3, "depth": 397, "columns": [450, 800, 800, 800]},
  {"group": 2, "name": "by the door, from the slope", "backGap": 3, "depth": 297, "columns": [800, 490]}
 ],
 "components": [
  {"group": 1, "column": 1, "span": 4, "type": "plinth", "height": 50},
  {"group": 1, "column": 1, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L4", "height": 318},
  {"group": 1, "column": 1, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L4", "height": 309},
  {"group": 1, "column": 1, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "L4", "height": 349},
  {"group": 1, "column": 2, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L3", "height": 318},
  {"group": 1, "column": 2, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L3", "height": 309},
  {"group": 1, "column": 2, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "L3", "height": 689},
  {"group": 1, "column": 3, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L2", "height": 318},
  {"group": 1, "column": 3, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L2", "height": 309},
  {"group": 1, "column": 3, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "L2", "height": 689},
  {"group": 1, "column": 3, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "L2U", "height": 680},
  {"group": 1, "column": 4, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L1", "height": 318},
  {"group": 1, "column": 4, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "L1", "height": 309},
  {"group": 1, "column": 4, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "L1", "height": 689},
  {"group": 1, "column": 4, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "L1U", "height": 1360},

  {"group": 2, "column": 1, "span": 2, "type": "plinth", "height": 50},
  {"group": 2, "column": 1, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "P1", "height": 318},
  {"group": 2, "column": 1, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "P1", "height": 309},
  {"group": 2, "column": 1, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "P1", "height": 689},
  {"group": 2, "column": 2, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "P2", "height": 318},
  {"group": 2, "column": 2, "span": 1, "type": "drawer", "tags": ["open"], "carcass": "P2", "height": 309},
  {"group": 2, "column": 2, "span": 1, "type": "cabinet", "tags": ["open"], "carcass": "P2", "height": 349}
 ]
});
