HOME.data({
 "format": "cabinets",
 "version": 1,
 "settings": {
  "materials": {"carcass": "egger-h1199-st12", "drawerBox": "board-16-drawer-parts", "backPanel": "hdf-white-3", "drawer": "egger-h1199-st12", "worktop": "egger-h1199-st12"},
  "hardware": {"drawer": "blum-tandembox-antaro-d-400"},
  "carcass": {"depth": 450, "frontGap": 2, "legs": 0},
  "backPanel": {"inset": 1},
  "crossRails": {"depth": 100, "hobFront": 50, "hobPanelGap": 20},
  "shelf": {"setback": 18, "clearance": 1, "perDoor": [{"count": 1}]},
  "drawers": {"D": {"frontAbove": 350, "sideHeight": 224, "backHeight": 199}, "M": {"sideHeight": 83, "backHeight": 84}, "bottom": {"inset": 75, "depth": 376, "fromBack": 38}, "back": {"inset": 87}, "liftAtBottom": 35, "liftAbove": 22, "inner": {"gap": 40, "backHeight": 84, "frontDeduction": 132}},
  "worktop": {"overhang": 10, "endPanelOverhang": 3},
  "drilling": {
   "cup": {"diameter": 35, "depth": 13, "fromEdge": 22},
   "plate": {"diameter": 2.5, "depth": 10, "fromFront": 37, "spacing": 32},
   "bumper": {"diameter": 5, "depth": 11.5},
   "shelfPin": {"diameter": 5, "depth": 10, "fromFront": 69, "fromBack": 65, "belowShelf": 3},
   "runner": {"diameter": 2.5, "depth": 10, "fromFront": [37, 261], "belowDrawer": 10}
  },
  "cutouts": {
   "basin": {"fromBack": 40, "holes": [{"for": "drain", "diameter": 60, "along": 0, "fromBack": 300}, {"for": "tap", "diameter": 35, "along": 0, "fromBack": 95}]}
  }
 },
 "appliances": {
  "basin": {"product": "catalano-green-lux-60x40-nero"},
  "basinTap": {"product": "hansgrohe-tecturis-e-110-73010140"}
 },
 "notes": [
  {"name": "Vanity", "description": "Hung on the wall, its bottom 324 above the floor, the top at 760", "details": "Two carcasses side by side, screwed together, on hidden hangers; drawers push to open."},
  {"name": "Board", "description": "Carcasses, fronts and the top of one decor board, 18 mm", "details": "Banded all round where an edge is seen, the top on all four edges: a wet room."},
  {"name": "Basin", "description": "On the top, over the drawer tagged basin", "details": "The drain and the tap’s hoses through the top, round holes from the basin’s template."}
 ],
 "groups": [
  {"group": 1, "name": "the vanity", "backGap": 0, "columns": [600, 600]}
 ],
 "components": [
  {"group": 1, "column": 1, "span": 2, "type": "space", "height": 324},
  {"group": 1, "column": 1, "span": 1, "type": "drawer", "carcass": "V1", "height": 209, "gaps": {"left": 2, "right": 2, "top": 2, "bottom": 2}},
  {"group": 1, "column": 1, "span": 1, "type": "drawer", "carcass": "V1", "height": 209, "gaps": {"left": 2, "right": 2, "top": 2, "bottom": 2}},
  {"group": 1, "column": 2, "span": 1, "type": "drawer", "tags": ["basin"], "carcass": "V2", "height": 418, "gaps": {"left": 2, "right": 2, "top": 2, "bottom": 2}},
  {"group": 1, "column": 1, "span": 2, "type": "worktop", "tags": ["banded"], "height": 18}
 ]
});
