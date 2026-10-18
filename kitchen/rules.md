# Kitchen rules

Generic rules for any kitchen built with these pages. Project specifics (groups, materials, products, design choices such as front gaps) live in the design notes (`data.js` notes) and in the view / cost JSON.
Files: `data.js` (design + rules) → `engine.js` (parts, data checks, writes data.js) → `design.html` (edits and draws), `cost.html`, `view.html`. Update this file with every change.

## 1. General rules

| Rule | Value |
|---|---|
| Stacking | components stack bottom-up in each column, in list order; columns give the widths |
| Carcass | same carcass name = one carcass over all its columns; 550 deep, back 14 from the wall |
| Boards | carcass chipboard 18; drawer internals chipboard 16; back HDF 3 (inset 1); fronts, frames, panels MDF 18 |
| HDF back | only behind cabinet doors, one piece per run of doors; none behind drawers, fixed fronts or appliances |
| Front | module − its 4 gaps (left, right, top, bottom) from the data |
| Group roles | each group has a role in the notes (`group N` → worktop, tall, island) |
| Worktop | depth by role: worktop 600, island 900 (product size); overhang 18; gap behind the carcass = depth − 550 − 18 − 18 |
| Island | chipboard 18 back panel between the end columns, floor to the carcass tops, on the carcass backs |
| Floor / base | floor carcass = on a plinth: 4 legs; base = floor + worktop on top: 2 top rails 100, otherwise a top panel |
| Plinth | 18 thick, face 70 behind the fronts |
| Frame / panel | frame on edge, 100 deep, back strip when not in a carcass; panel laid flat in the front plane |
| Shelves | adjustable: depth − 20, clearance 1, 4 pins; door ≤ 720 → 1, taller → 3; fixed shelf at the joint of 2 boxes (not in base carcasses) |
| Hinges | doors only; 100 from the ends; door < 900 → 2, < 1600 → 3, else 4; side R when a cabinet in the column has handle L |
| Drawers | front ≥ 350 → D, else M; lift 35 at the bottom, 22 above |
| Plasterboard | 600 deep, studs every 600, 2 layers; corner bead and T seal along each box; 3-5 mm gap to the furniture |

## 2. Tag-driven rules

| Tag | Effect |
|---|---|
| `sink` | top rails on edge; no shelves; sink cut-out in the worktop on that carcass; sink, tap, trap drawn there |
| `hob` | front rail 50 + separation panel 16 with a 20 air gap at the back; hob and hood drawn there |
| `bins` | waste-sorting bins in the drawer |
| `inner` | cutlery drawer M above the drawer box, behind the same front, 40 above |
| `dishwasher` | no carcass; front on the appliance door, no hinges |
| `fridge`, `freezer` | front on the appliance door, no hinges, no shelves, no HDF; plinth grille when on the floor; fridge body splits at the top of its lowest front |
| `coffee` | pull-out shelf at the bottom (500 deep, 5 side clearance, 10 above the bottom) on full-extension runners; 450 free above it, then 2 adjustable shelves; no other shelves |
| `end` | worktop end (waterfall), upright grain |

Types: filler (void), board (plasterboard), plinth, worktop, splash, panel, frame, cabinet, drawer, dummy (fixed front in a carcass: no hinges, no drawer box, no HDF), oven, micro.

## 3. Checks

- Data (engine, shown on all three pages): exactly one type, unknown tags; group has columns; inside the columns, no overlap; only fronts have a handle, handle T / B / L / R; fronts need 4 gaps; boxes need a carcass name (not a dishwasher); one carcass name per group; worktop needs a group role and a depth; worktop shorter than carcass + front + overhang. A component without one type, outside its group or overlapping is left out of the model.
- Design table cells: group, column, span ≥ 1, height ≥ 0, gaps ≥ 0, numbers.
- View: overlap > 0.01 mm; gap 0.01 ≤ gap ≤ 3 mm; front tops / bottoms 0.01-20 mm apart (off the line, all groups); nothing behind the wall (free-standing groups excepted) or in front of the carcass / plinth.

## 4. Cost assumptions (`cost.html`) - estimates, not rules

- Waste 15% on sheets, edging +10%, plinth +10%, reserve 5%; ~18 confirmats per carcass; plinth clips 1 per 2 legs.
- Sheets 2800×2070, plasterboard 3.12 m², worktop board 4100.
- Prices are estimates until quoted.
