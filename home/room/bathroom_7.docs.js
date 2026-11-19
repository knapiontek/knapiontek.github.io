HOME.data({
 "format": "docs",
 "version": 1,
 "page": {
  "title": "Estimate of the bathroom on the ground floor",
  "heading": "Estimate of materials – the bathroom on the ground floor (room 7, graphite)",
  "info": "PLN gross, online shop prices of October 2026 where known (a product marked \"to check\" or \"to choose\" has no price yet), materials only (we build it ourselves). The shaded fields may be changed to try other prices (until the page is reloaded). The quantities are counted from the bathroom's design.",
  "xlsxFile": "estimate_bathroom_7.xlsx",
  "excluded": ["Labour, transport, glue, grout, silicone, the installations in the walls."]
 },
 "params": {"waste": 0.15, "sheet": "={v:sheet.length}*{v:sheet.width}/1000000", "reserve": 0.05, "tileReserve": 0.1},
 "values": {"sheet": {"length": 2800, "width": 2070}, "edgeAllowance": 0.1, "confirmatsPerCarcass": 12, "screwsPerDrawer": 12, "casingSheets": 3},
 "labels": {
  "fronts": [{"type": "drawer", "function": "drawer front"}],
  "cutTitle": "Cut list – the vanity of the bathroom on the ground floor (sizes in mm)",
  "sheet": "Board sheet {v:sheet.length}×{v:sheet.width} [m²]",
  "cuttingNote": "Sizes: length × width, the longer side first; fronts width × height.\nEdge: how many finished edges run along the size beside it (0, 1, 2), as on the wholesaler's order form; in a wet room PUR glue.\nTotals: banding = the length of the banded edges × the quantity; cuts = (length + width) × the quantity.",
  "legend": {}
 },
 "blocks": [
  {
   "id": "fronts",
   "code": "FR",
   "title": "FRONTS – {m:drawer}, banded all round in its decor; push to open (TIP-ON)",
   "columns": ["Function", "Width", "Height", "Qty"]
  },
  {
   "id": "worktops",
   "code": "BL",
   "title": "TOP – {m:worktop}, one layer, banded all round; the holes for the basin (CB) from the basin's template"
  },
  {"id": "carcass", "code": "KO", "title": "CARCASSES – every part of {m:carcass}: cut + banding on the edges seen", "cut": true},
  {"id": "drawerBox", "code": "SZ", "title": "DRAWERS – every part of {m:drawerBox}: the TANDEMBOX bottoms and backs", "cut": true}
 ],
 "categories": [
  {
   "name": "Boards",
   "items": [
    {
     "id": "decorBoard",
     "material": "carcass",
     "name": "Decor board",
     "spec": "{m:carcass}, sheet {v:sheet.length} × {v:sheet.width}",
     "use": "the carcasses, the fronts and the top; + {waste|%} waste",
     "qty": "=ROUNDUP(({carcass.m2}+{fronts.m2}+{worktops.m2})*(1+{waste})/{sheet},0)"
    },
    {
     "id": "drawerBoard",
     "material": "drawerBox",
     "name": "Drawer board",
     "spec": "{m:drawerBox}",
     "use": "the bottoms and backs of the drawers",
     "qty": "=1"
    }
   ]
  },
  {
   "name": "Cutting and banding",
   "items": [
    {
     "id": "cutting",
     "product": "m-hm-board-cutting",
     "use": "every part, by the cut list",
     "qty": "={carcass.cut}+{drawerBox.cut}+{fronts.cut}"
    },
    {
     "id": "edging",
     "product": "edge-banding-h1199-pur",
     "use": "the edges seen of the carcasses, the fronts all round, the top all round + {v:edgeAllowance|%}",
     "qty": "=({carcass.edge}+{fronts.edge}+{worktops.edge}+{drawerBox.edge})*(1+{v:edgeAllowance})"
    }
   ]
  },
  {
   "name": "Hardware",
   "items": [
    {
     "id": "drawersD",
     "product": "blum-tandembox-antaro-d-400",
     "use": "drawers with a front > {s:drawers.D.frontAbove}",
     "qty": "={n:drawersD}"
    },
    {
     "id": "drawersM",
     "product": "blum-tandembox-antaro-m-400",
     "use": "drawers with a front ≤ {s:drawers.D.frontAbove}",
     "qty": "={n:drawersM}"
    },
    {"id": "tipOn", "product": "blum-tip-on-blumotion-l1", "use": "push to open, one a drawer", "qty": "={n:drawersD}+{n:drawersM}"},
    {"id": "hangers", "product": "camar-807-hangers", "use": "the vanity on the wall: a pair a carcass", "qty": "={n:hangers}"},
    {
     "id": "confirmats",
     "product": "confirmat-6-4x50",
     "use": "the carcasses, about {v:confirmatsPerCarcass} each, and the two side by side",
     "qty": "=ROUNDUP(({n:carcasses}*{v:confirmatsPerCarcass}+4)/1000,0)"
    },
    {
     "id": "screws",
     "product": "standers-screw-4x16",
     "use": "the runners, about {v:screwsPerDrawer} per drawer",
     "qty": "=ROUNDUP(({n:drawersD}+{n:drawersM})*{v:screwsPerDrawer}/35,0)"
    }
   ]
  },
  {
   "name": "Basin",
   "items": [
    {"id": "basin", "product": "catalano-green-lux-60x40-nero", "use": "on the vanity's top", "qty": "=1"},
    {"id": "plug", "product": "catalano-plug-5poslns-nero", "use": "the basin's drain", "qty": "=1"},
    {"id": "tap", "product": "hansgrohe-tecturis-e-110-73010140", "use": "on the basin's shelf", "qty": "=1"},
    {"id": "siphon", "product": "geberit-siphon-space-saving", "use": "flat, under the top, into the wall", "qty": "=1"},
    {"id": "gasket", "product": "epdm-gasket-3-black", "use": "under the basin's foot, no silicone", "qty": "=1"}
   ]
  },
  {
   "name": "WC",
   "items": [
    {"id": "wcFrame", "product": "wc-frame-geberit-duofix", "use": "in the casing, with its flush plate", "qty": "=1"},
    {"id": "wcBowl", "product": "wc-bowl-wall-hung-360x530", "use": "on the frame", "qty": "=1"},
    {"id": "wallCabinet", "product": "wall-cabinet-400x800x150", "use": "in the casing's niche over the frame", "qty": "=1"}
   ]
  },
  {
   "name": "Shower",
   "items": [
    {"id": "screen", "product": "shower-screen-1000-door-600", "use": "across the shower", "qty": "=1"},
    {"id": "drain", "product": "linear-drain-vogi-duo-880", "use": "at the shower's far wall", "qty": "=1"},
    {"id": "showerSet", "product": "shower-set-rain-thermostat", "use": "on the shower's wall", "qty": "=1"}
   ]
  },
  {
   "name": "Radiator and mirror",
   "items": [
    {"id": "radiator", "product": "mexen-hades-1200x400-gold", "use": "by the door", "qty": "=1"},
    {"id": "valves", "product": "radiator-valves-pair-bottom", "use": "the radiator's connections", "qty": "=1"},
    {"id": "mirror", "product": "mirror-led-600x800", "use": "over the basin", "qty": "=1"}
   ]
  },
  {
   "name": "Tiles",
   "items": [
    {
     "id": "wallTiles",
     "product": "paradyz-authority-graphite",
     "use": "the walls and the casing, {=<n:tiles.walls.tiles>} tiles laid ({n:tiles.walls.full} whole); + {tileReserve|%}",
     "qty": "=ROUNDUP({n:tiles.walls.area}*(1+{tileReserve})*100,0)/100",
     "spec": "format 1198 × 598"
    },
    {
     "id": "floorTiles",
     "product": "paradyz-authority-grey",
     "use": "the floor, {=<n:tiles.floor.tiles>} tiles; + {tileReserve|%}",
     "qty": "=ROUNDUP({n:tiles.floor.area}*(1+{tileReserve})*100,0)/100",
     "spec": "format 898 × 898"
    },
    {
     "id": "showerWallTiles",
     "product": "paradyz-authority-graphite",
     "use": "the shower's walls, {=<n:tiles.showerWalls.tiles>} tiles; + {tileReserve|%}",
     "qty": "=ROUNDUP({n:tiles.showerWalls.area}*(1+{tileReserve})*100,0)/100",
     "spec": "format 1198 × 598"
    },
    {
     "id": "showerFloorTiles",
     "product": "paradyz-authority-grey",
     "use": "the shower's floor, {=<n:tiles.showerFloor.tiles>} tiles; + {tileReserve|%}",
     "qty": "=ROUNDUP({n:tiles.showerFloor.area}*(1+{tileReserve})*100,0)/100",
     "spec": "format 898 × 898"
    }
   ]
  },
  {
   "name": "The casing",
   "items": [
    {"id": "plasterboard", "product": "norgips-gkbi-12-5", "use": "the WC casing and its niche (by the owner)", "qty": "={v:casingSheets}"},
    {"id": "profiles", "product": "budmat-cd60", "use": "the casing's frame", "qty": "=4"},
    {"id": "tracks", "product": "budmat-ud27", "use": "the casing's frame", "qty": "=3"}
   ]
  }
 ],
 "formulas": {},
 "notes": [
  {
   "name": "DESIGN",
   "notes": [
    {
     "id": "vanity",
     "topic": "The vanity",
     "description": "Hung on the wall on hidden hangers, its bottom 324 above the floor, the top at 760; two carcasses side by side, drawers push to open; carcasses, fronts and the top of one decor board.",
     "assumed": "two carcasses of 600; the kitchen's drawers in NL 400",
     "decide": ""
    },
    {
     "id": "top",
     "topic": "The top",
     "description": "One layer of the same 18 mm board, banded all round (a wet room), 10 in front of the fronts; the basin's holes from its template once it is bought.",
     "assumed": "no bought worktop",
     "decide": ""
    },
    {
     "id": "tiles",
     "topic": "The tiles",
     "description": "The walls, the casing and the floor; the shower's walls and floor apart. Each wall laid from the floor up, its tiles moved along it for the fewest small cuts; a narrow face (a casing's side) is a small cut by its size.",
     "assumed": "the prototype's tiles and formats",
     "decide": ""
    },
    {
     "id": "casing",
     "topic": "The WC casing",
     "description": "Plasterboard on a frame, by the owner: over the WC frame and the riser, with a niche for the wall cabinet; tiled like the walls.",
     "assumed": "the prototype's sizes",
     "decide": ""
    }
   ]
  },
  {
   "name": "PRICES AND SCOPE",
   "notes": [
    {
     "id": "prices",
     "topic": "Prices",
     "description": "Where a product has no price yet it is marked to check or to choose; the total counts only what has one.",
     "assumed": "",
     "decide": ""
    }
   ]
  }
 ]
});
