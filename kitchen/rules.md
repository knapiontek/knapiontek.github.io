# Kitchen rules

Generic rules for any kitchen built with these pages. Every value lives once, in `data.js` `rules` (names in `code` below); project specifics (groups, products, design choices such as front gaps) are in the `data.js` notes and in the view / cost JSON.
Files: `data.js` (design + rules) → `engine.js` (parts, data checks, writes data.js) → `design.html` (edits and draws), `cost.html`, `view.html`. Update this file with every change.

## 1. General rules

| Rule | Value |
|---|---|
| Materials | `materials`: name, thickness, colour of each board. Every part names its material (`carcass`, `front`, `plinth`, `back`, `drawers`, `rails.hobPanelMaterial`, `splash`, `worktop`), so each thickness is set once |
| Stacking | components stack bottom-up in each column, in list order; columns give the widths |
| Sizes | a column width or component height is mm, or a part name (`front`, `worktop` ...) = the thickness of its material |
| Carcass | same carcass name = one carcass over all its columns; `carcass.depth` deep, back `carcass.wallGap` from the wall |
| Back | only behind cabinet doors, one piece per run of doors, `back.inset` in from the carcass; none behind drawers, fixed fronts or appliances |
| Front | module − its 4 gaps (left, right, top, bottom) from the data; shaker frame `front.shakerRail` wide |
| Group roles | each group has a role in the notes (`group N` → worktop, tall, island) |
| Worktop | depth by role (`worktop.depth`, product size); `worktop.overhang` past the fronts; gap behind the carcass = depth − carcass depth − front − overhang |
| Island | back panel in the front material, between the end columns, floor to the carcass tops, on the carcass backs (`island.backPanel`) |
| Floor / base | floor carcass = on a plinth: `legsPerCarcass` legs; base = floor + worktop on top: 2 top rails `rails.depth`, otherwise a top panel |
| Plinth | plinth material, face `plinth.setback` behind the fronts |
| Frame / panel | frame on edge, `frame.depth` deep, back strip when not in a carcass; panel laid flat in the front plane |
| Shelves | adjustable: depth − `shelf.setback`, `shelf.clearance` each side, `shelf.pins` pins; count by door height (`shelf.perDoor`); fixed shelf at the joint of 2 boxes (not in base carcasses) |
| Hinges | doors only; `hinges.fromEnd` from the ends; count by door height (`hinges.perDoor`); side R when a cabinet in the column has handle L |
| Drawers | front ≥ `drawers.dFrom` → D, else M; lift `drawers.liftAtBottom` at the bottom, `drawers.liftAbove` above |
| Plasterboard | `plasterboard.depth` deep, studs every `plasterboard.studSpacing`, `plasterboard.layers` layers; corner bead and T seal along each box; 3-5 mm gap to the furniture |

## 2. Tag-driven rules

| Tag | Effect |
|---|---|
| `sink` | top rails on edge; no shelves; sink cut-out in the worktop on that carcass; sink, tap, trap drawn there |
| `hob` | front rail `rails.hobFront` + separation panel with a `rails.hobPanelGap` air gap at the back; hob and hood drawn there |
| `bins` | waste-sorting bins in the drawer |
| `inner` | cutlery drawer M above the drawer box, behind the same front, `drawers.inner.gap` above |
| `dishwasher` | no carcass; front on the appliance door, no hinges |
| `fridge`, `freezer` | front on the appliance door, no hinges, no shelves, no back; plinth grille when on the floor; fridge body splits at the top of its lowest front |
| `coffee` | pull-out shelf at the bottom (`pullOutShelf`: depth, side clearance, lift) on full-extension runners; `pullOutShelf.space` free above it, then `pullOutShelf.shelvesAbove` adjustable shelves; no other shelves |
| `end` | worktop end (waterfall), upright grain |

Types: filler (void), board (plasterboard), plinth, worktop, splash, panel, frame, cabinet, drawer, dummy (fixed front in a carcass: no hinges, no drawer box, no back), oven, micro.

## 3. Checks

- Data (engine, shown on all three pages): exactly one type, unknown tags; group has columns; inside the columns, no overlap; only fronts have a handle, handle T / B / L / R; fronts need 4 gaps; boxes need a carcass name (not a dishwasher); one carcass name per group; worktop needs a group role and a depth; worktop shorter than carcass + front + overhang. A component without one type, outside its group or overlapping is left out of the model.
- Design table cells: group, column, span ≥ 1, height ≥ 0, gaps ≥ 0, numbers.
- View: overlap > 0.01 mm; gap 0.01 ≤ gap ≤ 3 mm; front tops / bottoms 0.01-20 mm apart (off the line, all groups); nothing behind the wall (free-standing groups excepted) or in front of the carcass / plinth.

## 4. Cost assumptions (`cost.html` vars and params) - estimates, not rules

- Board waste, edging allowance, contingency, confirmats per carcass, plinth clips per leg.
- Sheet size (`sheetLength` × `sheetWidth`), plasterboard sheet area, worktop board length (`worktopLength`).
- Prices are estimates until quoted.
