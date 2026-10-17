# Kitchen rules

Everything the pages calculate follows from the data and these rules - nothing else is guessed.
Update this file with every change to data.js, engine.js, cost.html or view.html.
The design notes (data.js `notes`) hold the project, materials and products; the rules are here.

Files: `data.js` (shared data + rules, edited in design.html) → `engine.js` (builds the parts) → `design.html`, `cost.html`, `view.html`.

## 1. Rules in data.js (`rules`)

| Rule | Value | Settled |
|---|---|---|
| `board` | carcass boards 18 (drawer internals: grey chipboard 16) | product size |
| `frontThickness` | fronts, frames, panels 18 | product size |
| `carcassDepth` | 550 | product size |
| `wallGap` | carcass back 14 from the wall | you set it, both walls |
| `worktop` | depth 600 (group 1) / 900 (group 3) = product size; overhang 18 over the fronts; gap behind the carcass is calculated: depth − 550 − 18 − 18 = 14 / 314 | you set it: depth first |
| `plinthSetback`, `plinthThickness` | plinth face 70 behind the fronts, 18 thick | accepted |
| `frame.depth` | frame on edge, 100 deep | accepted |
| `rails` | base carcass: 2 top rails 100; hob: front rail 50 + separation panel 16 | accepted (sink / hob make it special) |
| `back` | HDF 3, inset 1 | accepted |
| `backPanel` | group 3: blue panel 820 high fixed to the carcass backs instead of HDF | you set it |
| `shelf` | adjustable: depth − 20, clearance 1, 4 pins; door ≤ 720 → 1, taller → 3 | accepted (tags make exceptions) |
| `hinges` | 100 from the ends; door < 900 → 2, < 1600 → 3, else 4 | accepted |
| `drawers` | front ≥ 350 → D, else M; box sizes; lift 35 bottom / 22 above; inner drawer 40 above | accepted |
| `legsPerCarcass` | 4 per floor carcass | accepted |
| `plasterboard` | 600 deep, studs every 600 | accepted |

## 2. Read from the data (engine.js)

| Rule | Settled |
|---|---|
| Components stack bottom-up in each column, in list order; columns give the widths | your design |
| Same carcass name (K1, K2 …) = one carcass over all its columns | you set it |
| Front = module − 4 gaps (left, right, top, bottom); joints between fronts 2 + 2, bottom 0 on the plinth, 4 on the worktop (door clears it) | you set it |
| Fronts on one line share the same edge - set by the gaps of each front, nothing is calculated | you set it |
| Floor carcass = stands on a plinth (legs, fridge grille); base = floor + worktop on top (rails) | accepted |
| Frame gets a back strip when it is not part of a carcass; panel is laid flat in the front plane | you set it (types) |
| Hinge side: R when a cabinet in the column has handle L | you kept it |
| Fixed shelf at the joint of 2 boxes (not in base / fridge carcasses); no adjustable shelves in sink / fridge carcasses | accepted |
| Plasterboard: face + long return; UD 2 × long side; CD outer edge + cross pieces | accepted |
| Fridge body splits at the top of its lowest front | accepted |

## 3. Types and tags (no rules - picked in design.html)

- Types (exactly one): filler (void), board (plasterboard), plinth, worktop, splash, panel, frame, cabinet, drawer, oven, micro
- Tags: `end` worktop end / waterfall, `sink`, `hob`, `bins`, `dummy`, `dishwasher` (no carcass), `fridge`, `freezer`, `inner`
- Sink, hob, hood, oven and microwave are placed where their component is, in any group.

## 4. Checks

- Design: every front needs 4 gaps; only fronts have a handle; cabinet / drawer / oven / micro need a carcass name (not a dishwasher); one carcass name in one group; unknown tags and two types are reported.
- Engine: worktop shorter than carcass + front + overhang is reported.
- View geometry: overlap > 0.01 mm; gap 0.01 ≤ gap ≤ 3 mm; nothing behind the wall (except free-standing groups) or in front of the carcass / plinth.
- Accepted and reported: plinth overlap in the corner (cut on site).

## 5. This kitchen only (view.html JSON)

- Room: right wall 3372, ceiling 2740, window from 870 (to be measured), downlights, pendants.
- Group placement (`runs`): group 1 x 0; group 2 at 2790 + 582 = 3372, turned −90°; island x 1730, z 2440, turned 180°, free-standing.
- Plinths run into the L corner; length cut on site.
- Appliance sizes (sink, hob, hood, fridge body) from the model manuals; colours; drawing offsets (`fittings`, no effect on the cost).

## 6. Cost assumptions (cost.html) - estimates, not rules

- Waste 15% on sheets, edging +10%, plinth +10%, reserve 5%; ~18 confirmats per carcass; plinth clips 1 per 2 legs.
- Sheets 2800×2070 (chipboard, HDF), plasterboard 3.12 m², worktop board 4100.
- Prices: estimates until quoted - blue parts (fronts, frames, panels) 500 PLN/m² for now; every price marked "est." still needs a real quote. Next step.
- Appliances (October 2026): oven Bosch HBA534BB3 1339, fridge Bosch KIS86AFE0 3209, microwave Bosch BFL623MB3 999.
