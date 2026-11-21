HOME.data({
 "format": "docs",
 "version": 1,
 "page": {
  "title": "Estimate of the kitchen, Jaworze",
  "heading": "Estimate of materials – the kitchen, Jaworze (groups 1+2 in an L, the island group 3)",
  "info": "PLN gross, online shop prices of October 2026 (every item links to its shop), materials only (we assemble it ourselves). The shaded fields may be changed to try other prices (until the page is reloaded). The quantities are counted from the kitchen's design.",
  "xlsxFile": "estimate_room_356.xlsx",
  "excluded": [
   "Labour, transport, electrics (the 400 V hob, the oven's, dishwasher's and fridge's circuits), plumbing, the plasterboard work (its materials are in the estimate)."
  ]
 },
 "params": {"waste": 0.15, "sheet": "={v:sheet.length}*{v:sheet.width}/1000000", "reserve": 0.05},
 "values": {
  "sheet": {"length": 2800, "width": 2070},
  "worktopBoard": {"length": 4100},
  "plasterboard": {"length": 2600, "width": 1200},
  "edgeAllowance": 0.1,
  "confirmatsPerCarcass": 18,
  "screwsPerMetre": 4,
  "backScrewsPerM2": 30,
  "bracketsPerDummy": 4
 },
 "labels": {
  "fronts": [
   {"type": "drawer", "tags": ["dummy"], "function": "dummy front"},
   {"type": "drawer", "tags": ["bins"], "function": "sink drawer (bins)"},
   {"type": "drawer", "function": "drawer"},
   {"type": "cabinet", "tags": ["fridge", "freezer", "dishwasher"], "function": "front on an appliance door"},
   {"type": "cabinet", "tags": ["doorDrawers"], "function": "door, drawers behind it"},
   {"type": "cabinet", "function": "door"}
  ],
  "cutTitle": "Cut list – the kitchen's boards (sizes in mm)",
  "sheet": "Board sheet {v:sheet.length}×{v:sheet.width} [m²]",
  "cuttingNote": "Sizes: length × width, the longer side first; fronts width × height.\nEdge: how many finished edges run along the size beside it (0, 1, 2), as on the wholesaler's order form.\nTotals: banding = the length of the banded edges × the quantity; cuts = (length + width) × the quantity.\nCarcass: depth {s:carcass.depth}, {g:1.backGap} from the wall (group 1), {g:2.backGap} (group 2); the front {s:carcass.frontGap} before the carcass; inside = width − 2 × {t:carcass}.\nShelves: adjustable = inside − 2 × {s:shelf.clearance}, depth − {s:shelf.setback}; fixed = the full depth (over the oven and the fridge − {s:shelf.ventGap}).\nBack = carcass − 2 × {s:backPanel.inset}; front = module − 4 gaps; back strip = {s:strip.depth} × the length of the carcass beside it (an upright strip; cut on site for the bracket) or under it (a horizontal strip).\nDrawers: bottom = inside − {s:drawers.bottom.inset} × {s:drawers.bottom.depth}; back = inside − {s:drawers.back.inset}.\nBanding: only the edges seen (fronts: all, front strips: the front one, front panels: by the opening front, a part that slides out: its top); the side of every edge in the Assembly sheet.\nLacquered boards: lacquer on both faces.\nWorktops: the front edge from the factory, the cut-outs unbanded.",
  "legend": {"runner": "the positions to confirm by Blum's and Häfele's"}
 },
 "blocks": [
  {
   "id": "fronts",
   "code": "FR",
   "title": "FRONTS – {m:cabinet}, shaker, lacquered all round",
   "columns": ["Function", "Width", "Height", "Qty"]
  },
  {
   "id": "strips",
   "code": "LI",
   "title": "FRONT STRIPS – {m:strip} on edge, depth {s:strip.depth}, lacquered on both faces and the front edge"
  },
  {"id": "plinths", "code": "CO", "title": "PLINTH – {m:plinth}, moisture resistant, lacquered on both faces"},
  {
   "id": "frontPanels",
   "code": "PA",
   "title": "FRONT PANELS AND THE ISLAND'S BACK PANEL – {m:frontPanel} flat, lacquered on both faces and the edges by an opening front"
  },
  {"id": "wallPanels", "code": "PS", "title": "WALL PANEL – {m:wallPanel}, on the wall over the worktop"},
  {
   "id": "carcass",
   "code": "KO",
   "title": "CARCASSES – every part of {m:carcass}: cut + 0.8 banding on the edges seen (with the back strips, the pull-out shelf, the hinge posts, the inset panels, the spacers)",
   "cut": true
  },
  {
   "id": "drawerBox",
   "code": "SZ",
   "title": "DRAWERS – every part of {m:drawerBox}: TANDEMBOX bottoms and backs (with the inner drawers), the drawers behind doors and the panel under the hob",
   "cut": true
  },
  {"id": "backPanel", "code": "PL", "title": "BACKS – {m:backPanel}, only behind the cabinets' doors"},
  {
   "id": "worktops",
   "code": "BL",
   "title": "WORKTOPS – {m:worktop} (worktop), {m:islandWorktop} (island); the cut-outs for the sink (CS) and the hob (CH) as in the legend"
  },
  {
   "id": "endPanels",
   "code": "PK",
   "title": "END PANELS – {m:endPanel} ({d:endPanel} group 1, {d:islandEndPanel} island); the worktop stands {s:worktop.endPanelOverhang} mm out over the end panel (the side, the front, at the island the back)"
  },
  {
   "id": "plaster",
   "code": "GK",
   "title": "PLASTERBOARD CASING – GKBI 12.5 on CD60 / UD27, depth {s:plasterboard.depth} (up to the ceiling, group 2)"
  }
 ],
 "categories": [
  {
   "name": "Fronts, front strips and plinth",
   "items": [
    {
     "id": "fronts",
     "material": "cabinet",
     "name": "Shaker fronts",
     "spec": "{m:cabinet}, MDF, lacquered all round",
     "use": "doors and drawers (cut list: FRONTS)",
     "qty": "={fronts.m2}",
     "refs": ["lacquered"]
    },
    {
     "id": "strips",
     "material": "strip",
     "name": "Front strips",
     "spec": "{m:strip}, lacquered on both faces and the front edge",
     "use": "between the fronts, on edge, depth {s:strip.depth} (cut list: FRONT STRIPS)",
     "qty": "={strips.m2}",
     "refs": ["stripsPanels", "lacquered"]
    },
    {
     "id": "plinths",
     "material": "plinth",
     "name": "Plinth",
     "spec": "{m:plinth}, moisture resistant MDF, lacquered on both faces",
     "use": "under the carcasses, on the legs' clips (cut list: PLINTH)",
     "qty": "={plinths.m2}",
     "refs": ["lacquered", "corner"]
    },
    {
     "id": "frontPanels",
     "material": "frontPanel",
     "name": "Front panels",
     "spec": "{m:frontPanel}, lacquered on both faces and the edges by an opening front",
     "use": "flat in the plane of the fronts; the island's back panel (cut list: FRONT PANELS)",
     "qty": "={frontPanels.m2}",
     "refs": ["lacquered", "hiddenSides"]
    }
   ]
  },
  {
   "name": "Carcasses",
   "items": [
    {
     "id": "carcassBoard",
     "material": "carcass",
     "name": "Carcass board",
     "spec": "{m:carcass}, sheet {v:sheet.length} × {v:sheet.width}",
     "use": "sides, tops and bottoms, rails, shelves, back strips, hinge posts, spacers; + {waste|%} waste",
     "qty": "=ROUNDUP({carcass.m2}*(1+{waste})/{sheet},0)",
     "refs": ["carcassBoard"]
    },
    {
     "id": "drawerBoard",
     "material": "drawerBox",
     "name": "Drawer board",
     "spec": "{m:drawerBox}, sheet {v:sheet.length} × {v:sheet.width}",
     "use": "the TANDEMBOX drawers' bottoms and backs, the drawers behind doors, the panel under the hob",
     "qty": "=ROUNDUP({drawerBox.m2}*(1+{waste})/{sheet},0)"
    },
    {
     "id": "backBoard",
     "material": "backPanel",
     "name": "HDF backs",
     "spec": "{m:backPanel}, sheet {v:sheet.length} × {v:sheet.width}",
     "use": "the backs behind the cabinets' doors",
     "qty": "=ROUNDUP({backPanel.m2}*(1+{waste})/{sheet},0)"
    },
    {
     "id": "cutting",
     "product": "m-hm-board-cutting",
     "use": "the carcass and drawer boards, by the cut list",
     "qty": "={carcass.cut}+{drawerBox.cut}"
    },
    {
     "id": "carcassEdging",
     "product": "edge-banding-u708-pur",
     "use": "the edges seen of the carcasses and drawers, by the cut list + {v:edgeAllowance|%}",
     "qty": "=({carcass.edge}+{drawerBox.edge})*(1+{v:edgeAllowance})"
    }
   ]
  },
  {
   "name": "Hardware",
   "items": [
    {
     "id": "hinges",
     "product": "blum-clip-top-blumotion-110-71b3550",
     "spec": "cup Ø{s:drilling.cup.diameter}",
     "use": "doors; how many by the front's height",
     "qty": "={nodes:hinge}"
    },
    {
     "id": "bumpers",
     "product": "blum-servo-drive-993-0530",
     "spec": "hole Ø{s:drilling.bumper.diameter}, depth {s:drilling.bumper.depth}; keeps the gap of {s:carcass.frontGap}",
     "use": "the front edge of the carcass's side, facing each hinge, at its height",
     "qty": "={nodes:bumper}"
    },
    {
     "id": "pullOutShelfRunners",
     "product": "blum-movento-760h5000s",
     "use": "the pull-out shelf in the coffee machine's cabinet",
     "qty": "={n:pullOutShelves}",
     "refs": ["pullOutShelf"]
    },
    {
     "id": "drawersD",
     "product": "blum-tandembox-antaro-d-500",
     "use": "drawers with a front > {s:drawers.D.frontAbove}",
     "qty": "={n:drawersD}",
     "refs": ["sinkCabinet"]
    },
    {
     "id": "drawersM",
     "product": "blum-tandembox-antaro-m-500",
     "use": "drawers with a front ≤ {s:drawers.D.frontAbove}",
     "qty": "={n:drawersM}"
    },
    {
     "id": "innerDrawers",
     "product": "blum-tandembox-antaro-m-500-inner",
     "spec": "cut to the inside width − {s:drawers.inner.frontDeduction}",
     "use": "for cutlery, behind the top front of the island's drawers",
     "qty": "={n:innerDrawers}",
     "refs": ["innerDrawers"]
    },
    {
     "id": "ballRunners",
     "product": "hafele-ball-runners-494-02-184",
     "spec": "L = {i:K29/doorDrawers.runnerLength}",
     "use": "the drawers behind doors, {s:doorDrawers.clearance} clearance each side",
     "qty": "={n:doorDrawers}",
     "refs": ["doorDrawers"]
    },
    {
     "id": "cutleryTrays",
     "product": "hettich-orgatray-440",
     "use": "the island's inner drawers (carcass {k:K31.width}, runners 500)",
     "qty": "={n:innerDrawers}",
     "refs": ["innerDrawers"]
    },
    {"id": "bins", "product": "amix-rubio-80-3x15", "use": "the sink drawer D (NL 500)", "qty": "={n:tag.bins}", "refs": ["sinkCabinet"]},
    {"id": "handles", "product": "ikea-eneryda-shell-brass", "use": "1 per front", "qty": "=ROUNDUP({nodes:handle}/2,0)"},
    {
     "id": "legs",
     "product": "hafele-axilo-h150",
     "use": "{s:carcass.legs} per carcass on the plinth, set back behind the plinth",
     "qty": "={nodes:leg}"
    },
    {"id": "plinthClips", "product": "hafele-axilo-plinth-clip", "use": "the front legs", "qty": "={nodes:leg}/2"},
    {
     "id": "shelfPins",
     "product": "shelf-pins-5-zinc",
     "use": "{=<n:shelfPins> / <n:shelvesAdjustable>} per adjustable shelf",
     "qty": "=ROUNDUP({nodes:shelfPin}/100,0)"
    },
    {
     "id": "confirmats",
     "product": "confirmat-6-4x50",
     "use": "screwing the carcasses together, about {v:confirmatsPerCarcass} per carcass ({n:carcasses} carcasses)",
     "qty": "=ROUNDUP({n:carcasses}*{v:confirmatsPerCarcass}/1000,0)"
    },
    {
     "id": "connectors",
     "product": "connector-5-m4-nickel",
     "use": "screwing the carcasses together, the L corner",
     "qty": 1,
     "refs": ["corner"]
    },
    {
     "id": "wallBrackets",
     "product": "domax-bracket-40x40x17",
     "use": "a back strip to the wall, where the strips of a stack meet; the highest without a bracket",
     "qty": "={n:wallBrackets}",
     "refs": ["wallFixing"]
    },
    {
     "id": "wallAnchors",
     "product": "fischer-duopower-8x65",
     "use": "the brackets to the wall (aerated concrete), 1 per bracket",
     "qty": "=ROUNDUP({n:wallBrackets}/25,0)",
     "refs": ["wallFixing"]
    },
    {
     "id": "smallScrews",
     "product": "standers-screw-4x16",
     "use": "a bracket to its back strip (2 per bracket), the HDF backs (about {v:backScrewsPerM2} per m²); does not go through an 18 board",
     "qty": "=ROUNDUP(({n:wallBrackets}*2+{backPanel.m2}*{v:backScrewsPerM2})/35,0)",
     "refs": ["wallFixing"]
    },
    {
     "id": "jointScrews",
     "product": "standers-screw-4x30",
     "use": "the front and back strips to the first carcass, {v:screwsPerMetre} per metre",
     "qty": "=ROUNDUP({n:jointLength.screwed}/1000*{v:screwsPerMetre}*2/25,0)",
     "refs": ["wallFixing"]
    },
    {
     "id": "brassScrews",
     "product": "brass-screw-4x30",
     "use": "the second carcass to the strips, from inside the carcass (seen), {v:screwsPerMetre} per metre",
     "qty": "=ROUNDUP({n:jointLength.fromInside}/1000*{v:screwsPerMetre}*2,0)",
     "refs": ["wallFixing"]
    },
    {
     "id": "brackets",
     "product": "bracket-20x20x16",
     "use": "the dummy fronts, {v:bracketsPerDummy} per front",
     "qty": "=ROUNDUP({n:tag.dummy}*{v:bracketsPerDummy}/10,0)"
    },
    {
     "id": "grilles",
     "product": "gtv-plinth-grille-480x60",
     "use": "the plinth under the fridge and the oven (Bosch: 200 cm² of inlet)",
     "qty": "={nodes:grille}",
     "refs": ["oven", "fridgeAir"]
    }
   ]
  },
  {
   "name": "Worktops and wall panel",
   "items": [
    {
     "id": "worktop",
     "material": "worktop",
     "name": "Worktop of group 1",
     "spec": "{m:worktop}, {d:worktop} × {v:worktopBoard.length} × {t:worktop}, the front edge from the factory",
     "use": "group 1, cut at the back to {w:1.depth}",
     "qty": 1,
     "refs": ["worktops"]
    },
    {
     "id": "islandWorktop",
     "material": "islandWorktop",
     "name": "Island worktop",
     "spec": "{m:islandWorktop}, {d:islandWorktop} × {v:worktopBoard.length} × {t:islandWorktop}, the front edge from the factory",
     "use": "the island, cut at the back to {w:3.depth}; the back edge banded",
     "qty": 1,
     "refs": ["worktops"]
    },
    {
     "id": "endPanelBoard",
     "material": "endPanel",
     "name": "End panels",
     "spec": "{m:endPanel}, two-sided, depth {d:endPanel} and {d:islandEndPanel}",
     "use": "under the worktops' ends; the worktop stands {s:worktop.endPanelOverhang} out (cut list: END PANELS)",
     "qty": "={endPanels.m2}",
     "refs": ["worktops"]
    },
    {
     "id": "worktopEdging",
     "product": "edge-banding-h1180-pur",
     "use": "the worktop's ends over the end panels, the back of the island's worktop, the end panels' fronts (at the island their backs too)",
     "qty": "=({worktops.edge}+{endPanels.edge})*(1+{v:edgeAllowance})",
     "refs": ["worktops"]
    },
    {
     "id": "wallPanel",
     "material": "wallPanel",
     "name": "Wall panel",
     "spec": "{m:wallPanel}, sheet {v:sheet.length} × {v:sheet.width} × {t:wallPanel}",
     "use": "the wall over the worktop (cut list: WALL PANEL)",
     "qty": "=ROUNDUP({wallPanels.m2}*(1+{waste})/{sheet},0)"
    },
    {
     "id": "worktopJoints",
     "product": "worktop-joint-zlm-26",
     "use": "the worktop with an end panel, 2 per panel",
     "qty": "={n:type.endPanel}*2",
     "refs": ["worktops"]
    },
    {"id": "silicone", "product": "silicone-sanitary-white-300", "use": "the worktop to the wall, the sink", "qty": 2}
   ]
  },
  {
   "name": "Plasterboard casing (group 2)",
   "items": [
    {
     "id": "plasterboard",
     "product": "norgips-gkbi-12-5",
     "spec": "{v:plasterboard.width} × {v:plasterboard.length}",
     "use": "the casings' faces and sides, {s:plasterboard.layers} layers; + {waste|%} waste",
     "qty": "=ROUNDUP({plaster.m2}*{s:plasterboard.layers}*(1+{waste})/({v:plasterboard.width}*{v:plasterboard.length}/1000000),0)",
     "refs": ["plaster"]
    },
    {
     "id": "profileCD",
     "product": "budmat-cd60",
     "use": "the outer edge and the cross studs every {s:plasterboard.studSpacing}",
     "qty": "=ROUNDUP({n:plasterCD}/3000,0)",
     "refs": ["plaster"]
    },
    {
     "id": "profileUD",
     "product": "budmat-ud27",
     "use": "at the wall and the ceiling",
     "qty": "=ROUNDUP({n:plasterUD}/3000,0)",
     "refs": ["plaster"]
    },
    {"id": "jointFiller", "product": "knauf-uniflott-5", "use": "the plasterboard's joints and corners", "qty": 1},
    {"id": "plasterScrews", "product": "4pro-drywall-screw-3-5x35", "use": "the plasterboards to the profiles", "qty": 1},
    {"id": "profileScrews", "product": "standers-profile-screw-3-5x9-5", "use": "profile to profile", "qty": 1},
    {"id": "anchors", "product": "standers-quick-anchor-6x40", "use": "the UD profiles to the wall and the ceiling", "qty": 1},
    {"id": "jointTape", "product": "joint-tape-50x25", "use": "the plasterboards' joints", "qty": 1},
    {"id": "cornerBead", "product": "rigips-corner-bead-23-5", "use": "the casings' outer edges", "qty": "=ROUNDUP({n:plasterEdge}/3000,0)"},
    {
     "id": "seal",
     "product": "t-seal-silicone-white",
     "use": "the gap between the plasterboard and the furniture (3–5); choose the size",
     "qty": "=ROUNDUP({n:plasterEdge}/1000*(1+{v:edgeAllowance}),0)"
    }
   ]
  },
  {
   "name": "Appliances",
   "appliances": true,
   "items": [
    {
     "id": "sink",
     "product": "ikea-kilsviken",
     "spec": "{a:sink.body.width} × {a:sink.body.depth}, bowl {a:sink.bowl.width} × {a:sink.bowl.depth} × {a:sink.bowl.height}",
     "use": "the worktop over the sink cabinet",
     "qty": "={nodes:sink}",
     "refs": ["sink", "sinkTap"]
    },
    {
     "id": "trap",
     "product": "deante-space-saver-zxy-9917",
     "use": "the sink cabinet; leaves room for the drawer with bins",
     "qty": "={nodes:sink}",
     "refs": ["sinkCabinet", "sinkTap"]
    },
    {"id": "tap", "product": "deante-silia-bqs-z73m", "use": "the sink", "qty": "={nodes:sink}", "refs": ["sinkTap"]},
    {
     "id": "coffee",
     "product": "delonghi-dinamica",
     "use": "the pull-out shelf in the coffee machine's cabinet",
     "qty": "={nodes:coffee}",
     "refs": ["pullOutShelf"]
    },
    {
     "id": "fridge",
     "product": "bosch-kis86afe0",
     "spec": "height {a:fridgeFreezer.body.height}",
     "use": "the fridge's tall unit, the fronts on the appliance's doors",
     "qty": "={nodes:fridgeFreezer}",
     "refs": ["fridge", "fridgeAir"]
    },
    {
     "id": "dishwasher",
     "product": "bosch-smv4hvx00e",
     "use": "under the worktop, the front on the appliance's door",
     "qty": "={nodes:dishwasher}",
     "refs": ["dishwasher"]
    },
    {
     "id": "hob",
     "product": "electrolux-cit61443",
     "spec": "cut-out {s:cutouts.hob.width} × {s:cutouts.hob.depth}",
     "use": "the worktop over the hob's carcass",
     "qty": "={nodes:hob}",
     "refs": ["hob"]
    },
    {
     "id": "oven",
     "product": "bosch-hba534bb3",
     "spec": "height {a:oven.fascia.height}",
     "use": "the tall unit, under the microwave",
     "qty": "={nodes:oven}",
     "refs": ["oven", "ovenColumn"]
    },
    {
     "id": "microwave",
     "product": "bosch-bfl623mb3",
     "use": "the tall unit, over the oven",
     "qty": "={nodes:microwave}",
     "refs": ["microwave", "ovenColumn"]
    },
    {"id": "hood", "product": "electrolux-lfv416k", "use": "over the hob", "qty": 1, "refs": ["hood"]},
    {"id": "duct", "product": "equation-duct-150-2-7", "use": "the hood to the ventilation duct (extraction)", "qty": 1, "refs": ["hood"]}
   ]
  }
 ],
 "formulas": {
  "ovenMicrowaveGap": "<i:K25/microwave.fit.fasciaH0> - <i:K25/oven.fit.fasciaH1>",
  "ovenOnShelfAbove": "<a:oven.fascia.height> - <i:K25/oven.space>",
  "microwaveOnShelfBelow": "<i:K25/microwave.spaceBottom> - <i:K25/microwave.h0>",
  "microwaveOnShelfAbove": "<i:K25/microwave.h1> - <i:K25/microwave.spaceTop>",
  "microwaveCabinetGap": "<i:K25/cabinet#2.frontH0> - <i:K25/microwave.h1>",
  "fridgeFrontAboveDoor": "<i:K27/fridge.frontH1> - <i:K27/fridge.fit.bodyH0> - <a:fridgeFreezer.doors.fridge.top>",
  "innerDrawerExtra": "<p:innerDrawers> - <p:ballRunners>"
 },
 "notes": [
  {
   "name": "APPLIANCES – SIZES AND FIT IN THE CARCASSES (mm; width × height × depth)",
   "notes": [
    {
     "id": "oven",
     "appliance": "oven",
     "topic": "Oven Bosch HBA534BB3 – K25, below",
     "description": "Sizes: housing {a:oven.body.width} × {a:oven.body.height} × {a:oven.body.depth}, fascia {a:oven.fascia.width} × {a:oven.fascia.height} × {a:oven.fascia.thickness}; both stand on the shelf.\nFascia: {f:ovenOnShelfAbove} over the shelf above, {=(<a:oven.fascia.width> - <k:K25.innerWidth>) / 2} over each side of the carcass; it does not cover the shelf under it.\nRoom over the housing: {=<i:K25/oven.space> - <a:oven.body.height>}.\nGaps: to the front of the cabinet under it {=<i:K25/oven.spaceBottom> - <i:K25/cabinet#1.frontH1>}, to the microwave {f:ovenMicrowaveGap}.",
     "assumed": "A grille in the plinth; the shelf over the oven {s:shelf.ventGap} shallower."
    },
    {
     "id": "microwave",
     "appliance": "microwave",
     "topic": "Microwave Bosch BFL623MB3 – K25, over the oven",
     "description": "Sizes: the appliance {a:microwave.body.width} × {a:microwave.body.height} × {a:microwave.body.depth} on feet of {i:K25/microwave.fit.feet}; fascia {a:microwave.fascia.width} × {a:microwave.fascia.height} × {a:microwave.fascia.thickness}, {=-<a:microwave.fascia.bottom>} below the appliance's underside.\nFascia: {f:microwaveOnShelfBelow} over the shelf below, {f:microwaveOnShelfAbove} over the shelf above, {=(<a:microwave.fascia.width> - <k:K25.innerWidth>) / 2} over each side of the carcass.\nRoom over the appliance: {=<i:K25/microwave.space> - <i:K25/microwave.fit.feet> - <a:microwave.body.height>}; the back open.\nGaps: to the oven {f:ovenMicrowaveGap}, to the cabinet above {f:microwaveCabinetGap}.",
     "assumed": "It stands on a shelf {s:shelf.ventGap} shallower."
    },
    {
     "id": "ovenColumn",
     "topic": "The tall unit K25: oven + microwave",
     "description": "From the shelf under the oven up: the oven {a:oven.fascia.height}, a gap {f:ovenMicrowaveGap}, the microwave {i:K25/microwave.height}, a gap {f:microwaveCabinetGap}, the cabinet above.\nThe middle shelf: {=<i:K25/oven.spaceTop> - <i:K25/oven.spaceBottom>}–{=<i:K25/microwave.spaceBottom> - <i:K25/oven.spaceBottom>}, {s:shelf.ventGap} shallower.\nThe top shelf: {=<i:K25/microwave.spaceTop> - <i:K25/oven.spaceBottom>}–{=<i:K25/microwave.spaceTop> + <t:carcass> - <i:K25/oven.spaceBottom>}.\nThe cabinet under the oven: {i:K25/cabinet#1.height}.",
     "assumed": "Try the shelves before fixing them."
    },
    {
     "id": "fridge",
     "appliance": "fridgeFreezer",
     "topic": "Fridge Bosch KIS86AFE0 – K27",
     "description": "Sizes: {a:fridgeFreezer.body.width} × {a:fridgeFreezer.body.height} × {a:fridgeFreezer.body.depth}, on the carcass's bottom.\nThe fixed shelf: on top of the appliance, the fridge's top screwed to it; {s:shelf.ventGap} shallower.\nFreezer: the front {i:K27/freezer.frontHeight} on a door of {=<a:fridgeFreezer.doors.freezer.top> - <a:fridgeFreezer.doors.freezer.bottom>}; it stands {=<i:K27/freezer.fit.bodyH0> + <a:fridgeFreezer.doors.freezer.bottom> - <i:K27/freezer.frontH0>} down past it, {=(<i:K27/freezer.frontWidth> - <a:fridgeFreezer.body.width>) / 2} past each side; the door reaches {=<i:K27/freezer.fit.bodyH0> + <a:fridgeFreezer.doors.freezer.top> - <i:K27/freezer.frontH1>} higher.\nFridge: the front {i:K27/fridge.frontHeight} on a door of {=<a:fridgeFreezer.doors.fridge.top> - <a:fridgeFreezer.doors.fridge.bottom>}; it stands {=<i:K27/fridge.fit.bodyH0> + <a:fridgeFreezer.doors.fridge.bottom> - <i:K27/fridge.frontH0>} down past it, {f:fridgeFrontAboveDoor} up, {=(<i:K27/fridge.frontWidth> - <a:fridgeFreezer.body.width>) / 2} past each side.\nThe gap between the fronts: {=<i:K27/fridge.frontH0> - <i:K27/freezer.frontH1>}.",
     "assumed": "The fronts screwed to the appliance's doors."
    },
    {
     "id": "fridgeAir",
     "topic": "Fridge – ventilation",
     "description": "Inlet: a grille in the plinth.\nOutlet: a gap of {s:shelf.ventGap} behind the fixed shelf over the appliance, {g:2.backGap} behind the carcass."
    },
    {
     "id": "dishwasher",
     "appliance": "dishwasher",
     "topic": "Dishwasher Bosch SMV4HVX00E – G1[6]",
     "description": "Sizes: {a:dishwasher.body.width} × {i:G1[6]/dishwasher.fit.bodyH1} × {a:dishwasher.body.depth}, the feet screwed out to the worktop's underside; the door {a:dishwasher.door.height}.\nFront {i:G1[6]/dishwasher.frontWidth} × {i:G1[6]/dishwasher.frontHeight}: {=<i:G1[6]/dishwasher.fit.doorH0> - <i:G1[6]/dishwasher.frontH0>} lower than the door, {=<i:G1[6]/dishwasher.fit.doorH1> - <i:G1[6]/dishwasher.frontH1>} under its top, {=(<a:dishwasher.body.width> - <i:G1[6]/dishwasher.frontWidth>) / 2} narrower at each side.\nFeet: {a:dishwasher.baseSetback} behind the front, the plinth before them.",
     "decide": "The front's weight: check in the manual (hinge SMZ5003 for heavy fronts)."
    },
    {
     "id": "hob",
     "appliance": "hob",
     "topic": "Hob Electrolux CIT61443 – K11",
     "description": "Sizes: glass {a:hob.glass.width} × {a:hob.glass.depth}, body {a:hob.body.width} × {a:hob.body.depth} × {a:hob.body.height}.\nCut-out: {s:cutouts.hob.width} × {s:cutouts.hob.depth}, {s:cutouts.hob.fromBack} from the worktop's back edge.\nThe glass on the worktop: {=(<a:hob.glass.width> - <s:cutouts.hob.width>) / 2} at each side; {=<s:cutouts.hob.fromBack> - (<a:hob.glass.depth> - <s:cutouts.hob.depth>) / 2} from the back, {=<w:1.depth> - <s:cutouts.hob.fromBack> - (<a:hob.glass.depth> + <s:cutouts.hob.depth>) / 2} from the front edge of the worktop.\nUnder the hob: the front rail {s:crossRails.hobFront}, the back one {s:crossRails.depth}; a panel of {m:hobPanel} behind the front rail, {s:crossRails.hobPanelGap} gap behind it.",
     "assumed": "On the cut list.",
     "decide": "The hob's body to the panel: the manual, p. 22."
    },
    {
     "id": "sink",
     "appliance": "sink",
     "topic": "Sink IKEA KILSVIKEN – K12",
     "description": "Sizes: the sink {a:sink.body.width} × {a:sink.body.depth}, bowl {a:sink.bowl.width} × {a:sink.bowl.depth} × {a:sink.bowl.height}.\nCut-out: {s:cutouts.sink.width} × {s:cutouts.sink.depth}, {s:cutouts.sink.fromBack} from the worktop's back edge.\nThe sink on the worktop: its rim {=(<a:sink.body.width> - <s:cutouts.sink.width>) / 2} at each side; {=<s:cutouts.sink.fromBack> - (<a:sink.body.depth> - <s:cutouts.sink.depth>) / 2} from the back, {=<w:1.depth> - <s:cutouts.sink.fromBack> - (<a:sink.body.depth> + <s:cutouts.sink.depth>) / 2} from the front edge of the worktop.",
     "assumed": "The cut-out on the cut list (WORKTOPS).",
     "decide": "Check the cut-out with IKEA's template before the CNC."
    },
    {
     "id": "pullOutShelf",
     "topic": "The coffee machine's cabinet – the pull-out shelf",
     "description": "The shelf: depth {s:pullOutShelf.depth}, {s:pullOutShelf.clearance} clearance at the sides, Blum MOVENTO runners.\nA spacer on the hinges' side: from the board under the door to {s:pullOutShelf.spacerAbove} over the shelf; it carries a runner and keeps the shelf clear of the open door.",
     "decide": "The runners' drilling plan under the shelf (Blum)."
    }
   ]
  },
  {
   "name": "CONSTRUCTION",
   "notes": [
    {
     "id": "wallFixing",
     "topic": "Fixing the carcasses to the wall",
     "description": "Back strips: an upright strip, one per carcass of the stack beside it; a horizontal one, one per carcass under it.\nBrackets: {n:wallBrackets}, the strip cut on site.",
     "assumed": "Aerated concrete, DuoPower 8 plugs."
    },
    {
     "id": "corner",
     "topic": "The L corner – the corner carcass",
     "description": "Carcass K13: a door, a front panel {i:K13/frontPanel.width} and a hidden filler.\nThe hinge post: {m:carcass}, depth {s:hinges.postDepth}, carries the hinges.\nThe inset panel: behind the panel {i:K13/frontPanel.width}, from the post to the carcass's side.\nThe plinths of groups 1 and 2: the cut list gives both full lengths, cut one on site.",
     "assumed": "Connectors: one pack.",
     "decide": "The shelf in K13: the hinge post cuts through it (the 3D view reports a clash).\nA wall strip under the worktop in the corner?"
    },
    {
     "id": "stripsPanels",
     "topic": "Front strips on edge, front panels flat",
     "description": "The banding by an opening front: the front panel {i:K13/frontPanel.width} – {i:K13/frontPanel.edges}; the front panel {i:G2[3]/frontPanel.width} – {i:G2[3]/frontPanel.edges}; the island's back panel – none.\nThe front panel {i:G2[3]/frontPanel.width} covers the end of the front panel {i:K13/frontPanel.width}."
    },
    {
     "id": "sinkCabinet",
     "topic": "The sink cabinet",
     "description": "Below: a D drawer with bins, sides {s:drawers.D.sideHeight}; a space-saving trap is needed.\nAbove: a dummy front, no drawer.",
     "decide": "The outlet in the wall ≥ 450 over the floor."
    },
    {
     "id": "innerDrawers",
     "topic": "The inner drawers for cutlery (island)",
     "description": "The island, its top drawers: an inner TANDEMBOX antaro M 500, behind the same front.\nThe inner front Z31L: the carcass's inside width − {s:drawers.inner.frontDeduction}.\nBottom and back: {m:drawerBox}, on the cut list.",
     "decide": "The back's height and the insert: Blum's configurator."
    },
    {
     "id": "doorDrawers",
     "topic": "Board drawers behind doors (K25 and K29, below)",
     "description": "K25: a door {i:K25/doorDrawers.frontWidth} × {i:K25/doorDrawers.frontHeight}, {i:K25/doorDrawers.count} drawers {i:K25/doorDrawers.boxWidth} × {i:K25/doorDrawers.runnerLength} × {i:K25/doorDrawers.boxHeight}, hinges {i:K25/doorDrawers.hinge}.\nK29: a door {i:K29/doorDrawers.frontWidth} × {i:K29/doorDrawers.frontHeight}, {i:K29/doorDrawers.count} drawers {i:K29/doorDrawers.boxWidth} × {i:K29/doorDrawers.runnerLength} × {i:K29/doorDrawers.boxHeight}, hinges {i:K29/doorDrawers.hinge}.\nBoxes: {m:drawerBox}, Häfele ball runners L = {i:K29/doorDrawers.runnerLength}, {s:doorDrawers.clearance} clearance at each side.\nA spacer on the hinges' side: it ends {s:hinges.postDepth} before the carcass's front, as the boxes do; the drawers pass the hinges and the open door.\nNo adjustable shelves behind these doors.",
     "decide": "The drawers' grip: a cut-out in the front or a knob.\nBlum instead of board (TANDEMBOX M, {p:innerDrawers} a set): {=ROUND(<f:innerDrawerExtra>)} PLN more a drawer, {=ROUND(<f:innerDrawerExtra> * <n:doorDrawers>)} PLN in all; sides {s:drawers.M.sideHeight} instead of {s:doorDrawers.sideHeight}; in K29 check the least width ({=<k:K29.innerWidth> - <t:carcass>}).\nThe board {m:drawerBox}: {q:drawerBoard} sheets, the last one little used; the boxes fit in the offcuts of {m:carcass}."
    },
    {
     "id": "worktops",
     "topic": "Worktops",
     "description": "Group 1: one board, cut at the back to {w:1.depth}.\nThe island: a board of {d:islandWorktop}, cut at the back to {w:3.depth}.\nThe cut-outs for the sink and the hob: CNC at the wholesaler's (cut list: WORKTOPS).",
     "decide": "End panels: still looking for a two-sided oak (the worktop's decor, both faces seen)."
    },
    {
     "id": "plaster",
     "topic": "Plasterboard casing",
     "description": "A casing longer than a board of {v:plasterboard.length}: joined on site, {s:plasterboard.layers} layers, the joints staggered.\nThe profiles counted from the whole length; with offcuts one may be short."
    }
   ]
  },
  {
   "name": "PRICES AND SCOPE",
   "notes": [
    {
     "id": "lacquered",
     "topic": "Lacquered parts",
     "description": "The fronts, front strips, panels and plinth from one maker, one colour; the plinth moisture resistant.",
     "decide": "A written offer for all the lacquered parts, both faces."
    },
    {
     "id": "carcassBoard",
     "topic": "{m:carcass} – {q:carcassBoard} sheets",
     "description": "{carcass.m2} m² + {waste|%} waste on sheets of {sheet} m² → {q:carcassBoard} sheets"
    },
    {
     "id": "sinkTap",
     "topic": "Sink and tap",
     "description": "The LILLVIKEN trap comes with the sink; the Deante ZXY 9917 leaves room for the drawer with bins (see {note:sinkCabinet}).",
     "assumed": "Black; IKEA's trap not used.",
     "decide": "Does IKEA's trap fit over the drawer with bins? If so, no Deante trap."
    },
    {
     "id": "hood",
     "appliance": "hood",
     "topic": "Hood Electrolux LFV416K – the mode",
     "description": "Extraction: the hood + a Ø150 duct to the ventilation shaft.",
     "decide": "Extraction or recirculation (a carbon filter, outside the estimate)?"
    }
   ]
  },
  {
   "name": "TO KNOW",
   "notes": [
    {
     "id": "islandOverhang",
     "topic": "The island worktop's overhang on the stools' side",
     "description": "The worktop stands {g:3.backGap} past the carcasses (with the back panel), the island's worktop {w:3.depth}. See the 3D view: good for stools, tight for chairs."
    },
    {"id": "islandSocket", "topic": "A socket in the island", "description": "Not in the design; plan it before the floor."},
    {
     "id": "hiddenSides",
     "topic": "The carcasses' unseen sides",
     "description": "Covered by front strips, end panels or the wall: no lacquered covers."
    },
    {
     "id": "summary",
     "topic": "Summary",
     "description": "Carcasses {n:carcasses}, fronts {n:fronts}, handles {n:handles}.\nHinges {n:hinges}, legs {n:legs}.\nDrawers: {n:drawersD} D + {n:drawersM} M + {n:innerDrawers} inner.\nShelves: {n:shelvesAdjustable} adjustable + {n:shelvesFixed} fixed."
    }
   ]
  }
 ]
});
