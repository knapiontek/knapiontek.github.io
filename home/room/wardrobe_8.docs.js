HOME.data({
 "format": "docs",
 "version": 1,
 "page": {
  "title": "Estimate of walk-in wardrobe 8",
  "heading": "Estimate of materials – walk-in wardrobe 8 (the attic, a deep run opposite the door, a shallow one by it)",
  "info": "PLN gross, online shop prices of October 2026 where known (a product marked \"to check\" has no price yet), materials only (we assemble it ourselves). The shaded fields may be changed to try other prices (until the page is reloaded). The quantities are counted from the design.",
  "xlsxFile": "estimate_wardrobe_8.xlsx",
  "excluded": ["Labour, transport."]
 },
 "params": {"waste": 0.15, "sheet": "={v:sheet.length}*{v:sheet.width}/1000000", "reserve": 0.05},
 "values": {
  "sheet": {"length": 2800, "width": 2070},
  "edgeAllowance": 0.1,
  "confirmatsPerCarcass": 16,
  "bracketsPerCarcass": 2,
  "screwsPerDrawer": 12
 },
 "labels": {
  "fronts": [],
  "cutTitle": "Cut list – walk-in wardrobe 8 (sizes in mm)",
  "sheet": "Board sheet {v:sheet.length}×{v:sheet.width} [m²]",
  "cuttingNote": "Sizes: length × width, the longer side first.\nEdge: how many finished edges run along the size beside it (0, 1, 2), as on the wholesaler's order form.\nTotals: banding = the length of the banded edges × the quantity; cuts = (length + width) × the quantity.\nCarcass: the sides' depth {g:1.geometry.carcassDepth} (group 1), {g:2.geometry.carcassDepth} (group 2), the back ({t:backPanel}) behind, against the wall; inside = width − 2 × {t:carcass}.\nShelves on the grid {s:shelf.grid.from} + k × {s:shelf.grid.pitch}: fixed on every {s:shelf.grid.fixedEvery}nd line, the full depth; adjustable = inside − 2 × {s:shelf.clearance}, depth − {s:shelf.setback}.\nDrawers: the box = inside − 2 × {s:drawers.board.clearance} (the runners) × the runner's length; the bottom under the sides, the front and the back between them, {s:drawers.board.sideHeight} high.\nBanding: only the edges seen (the front edges of the carcass, the shelves, the top edges of the drawer boxes; an open drawer also the front ends of its sides and bottom); the side of every edge in the Assembly sheet.",
  "legend": {}
 },
 "blocks": [
  {"id": "carcass", "code": "KO", "title": "CARCASSES – every part of {m:carcass}: cut + banding on the edges seen", "cut": true},
  {
   "id": "drawerBox",
   "code": "SZ",
   "title": "DRAWERS – every part of {m:drawerBox}: the boxes on ball runners, the top edges banded",
   "cut": true
  },
  {"id": "backPanel", "code": "PL", "title": "BACKS – {m:backPanel}, {s:backPanel.inset} mm smaller than the carcass on every side, nailed on behind", "cut": true},
  {"id": "plinths", "code": "CO", "title": "PLINTH – {m:plinth}, cut to length on site, {s:plinth.setback} behind the carcass front"}
 ],
 "categories": [
  {
   "name": "Boards",
   "items": [
    {
     "id": "carcassBoard",
     "material": "carcass",
     "name": "Carcass board",
     "spec": "{m:carcass}, sheet {v:sheet.length} × {v:sheet.width}",
     "use": "sides, bottoms, tops, shelves; + {waste|%} waste",
     "qty": "=ROUNDUP({carcass.m2}*(1+{waste})/{sheet},0)",
     "refs": ["board"]
    },
    {
     "id": "drawerBoard",
     "material": "drawerBox",
     "name": "Drawer board",
     "spec": "{m:drawerBox}, sheet {v:sheet.length} × {v:sheet.width}",
     "use": "the drawer boxes",
     "qty": "=ROUNDUP({drawerBox.m2}*(1+{waste})/{sheet},0)"
    },
    {
     "id": "backBoard",
     "material": "backPanel",
     "name": "HDF backs",
     "spec": "{m:backPanel}, sheet {v:sheet.length} × {v:sheet.width}",
     "use": "the backs of the carcasses",
     "qty": "=ROUNDUP({backPanel.m2}*(1+{waste})/{sheet},0)"
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
     "qty": "={carcass.cut}+{drawerBox.cut}+{backPanel.cut}"
    },
    {
     "id": "edging",
     "product": "edge-banding-white-22",
     "use": "the edges seen of the carcasses and the drawers, by the cut list + {v:edgeAllowance|%}",
     "qty": "=({carcass.edge}+{drawerBox.edge})*(1+{v:edgeAllowance})"
    }
   ]
  },
  {
   "name": "Hardware",
   "items": [
    {
     "id": "runners250",
     "product": "ball-runners-push-open-250",
     "use": "the drawers of the shallow carcasses (300)",
     "qty": "={n:runners.250}",
     "refs": ["drawers"]
    },
    {
     "id": "runners350",
     "product": "ball-runners-push-open-350",
     "use": "the drawers of the deep carcasses (400)",
     "qty": "={n:runners.350}",
     "refs": ["drawers"]
    },
    {"id": "legs", "product": "leveling-feet-50", "use": "{s:carcass.legs} under every carcass", "qty": "={nodes:leg}", "refs": ["prices"]},
    {
     "id": "plinth",
     "material": "plinth",
     "name": "Plinth",
     "spec": "{m:plinth}",
     "use": "in front of the feet along each run (cut list: PLINTH)",
     "qty": "={plinths.length}",
     "refs": ["prices"]
    },
    {
     "id": "shelfPins",
     "product": "shelf-pins-5-zinc",
     "use": "{=<n:shelfPins> / <n:shelvesAdjustable>} per adjustable shelf",
     "qty": "=ROUNDUP({nodes:shelfPin}/100,0)"
    },
    {
     "id": "confirmats",
     "product": "confirmat-6-4x50",
     "use": "the sides to the bottom, the top and the fixed shelves, about {v:confirmatsPerCarcass} per carcass ({n:carcasses} carcasses)",
     "qty": "=ROUNDUP({n:carcasses}*{v:confirmatsPerCarcass}/1000,0)"
    },
    {
     "id": "brackets",
     "product": "domax-bracket-40x40x17",
     "use": "each carcass to the wall, under its top, {v:bracketsPerCarcass} per carcass",
     "qty": "={n:carcasses}*{v:bracketsPerCarcass}"
    },
    {
     "id": "screws",
     "product": "standers-screw-4x16",
     "use": "the runners, about {v:screwsPerDrawer} per drawer",
     "qty": "=ROUNDUP({n:boardDrawers}*{v:screwsPerDrawer}/35,0)"
    }
   ]
  }
 ],
 "formulas": {},
 "notes": [
  {
   "name": "CONSTRUCTION",
   "notes": [
    {
     "id": "grid",
     "topic": "The shelf grid",
     "description": "Every shelf of the room on one grid: {s:shelf.grid.from} above the floor, then every {s:shelf.grid.pitch}; fixed on every {s:shelf.grid.fixedEvery}nd line (they stiffen the carcass), adjustable on pins on the others; the tops of the carcasses on the grid too. The shelves of neighbouring carcasses are level.",
     "assumed": "the prototype's grid; one rule for the fixed shelves in every carcass",
     "decide": ""
    },
    {
     "id": "slope",
     "topic": "Under the slope",
     "description": "Each carcass is lower under the slope: its top stays clear of the lowest point of the ceiling over it; the run steps down.",
     "assumed": "stepped carcasses, each top on the grid",
     "decide": "steps or a sloping top"
    },
    {
     "id": "drawers",
     "topic": "Drawers",
     "description": "Two at the bottom of every carcass, one over the other: boxes of {t:drawerBox} board on full-extension ball runners, push to open; the runners as long as the carcass allows.",
     "assumed": "two rows of equal height",
     "decide": ""
    },
    {
     "id": "stacked",
     "topic": "Carcasses one on another",
     "description": "No carcass is taller than 1316: where a run goes higher, a second carcass stands on the lower one at 1366 (the fixed shelf’s line), screwed to it through its bottom from inside, the backs in one plane.",
     "assumed": "4 screws 4 × 30 per pair",
     "decide": ""
    },
    {
     "id": "ends",
     "topic": "The end of a run",
     "description": "Where a run meets a short wall it ends with a gap.",
     "assumed": "a gap",
     "decide": "a gap, an end panel or a filler"
    },
    {
     "id": "rails",
     "topic": "Hanging rails",
     "description": "No rails for hanging clothes yet.",
     "assumed": "none",
     "decide": "rails: where and how high"
    },
    {
     "id": "ducts",
     "topic": "The heat-recovery ducts",
     "description": "Between the door and the hall wall run the ducts of the heat recovery: no carcass there.",
     "assumed": "no carcass",
     "decide": ""
    }
   ]
  },
  {
   "name": "PRICES AND SCOPE",
   "notes": [
    {
     "id": "board",
     "topic": "The board",
     "description": "The cheapest plain white melamine, {t:carcass} for the carcasses, {t:drawerBox} for the drawers.",
     "assumed": "{t:carcass} mm",
     "decide": "16 or 18 mm for the carcasses"
    },
    {
     "id": "prices",
     "topic": "Prices to check",
     "description": "The white boards, the HDF, the runners, the feet and the plinth have no price yet.",
     "assumed": "no price: 0 in the totals",
     "decide": "products and prices"
    }
   ]
  }
 ]
});
