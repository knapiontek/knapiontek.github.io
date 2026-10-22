# Kitchen rules

Generic rules for any kitchen built with these pages. Every value lives once, in `data.js` `rules` (names in `code` below); project specifics (groups, products, design choices such as front gaps) are in the `data.js` notes and in the view / cost JSON.
Files: `data.js` (design + rules) → `engine.js` (parts, data checks, writes data.js) → `design.html` (edits and draws), `cost.html`, `view.html`. Update this file with every change.

## 1. General rules

| Rule | Value |
|---|---|
| Materials | what you buy, set in data.js (shown read-only in design.html): name, thickness, colour (none = oak texture), lacquered, core (colour of a bare cut edge: chipboard, the lacquered board), depth by group role, and `types`: the component types made of it; every board type is in exactly one material. Carcass parts take the material their rule names: `carcass.material`, `back.material`, `drawers.material` (drawer box), `rails.hobPanelMaterial`; all front types one thickness (the front plane). The pages read names, colours and thicknesses from here |
| Stacking | components stack bottom-up in each column, in list order; columns give the widths. A component's place is printed `G1[4]` (group 1, column 4) or `G1[1-11]` (group 1, columns 1 to 11) in warnings, lists and tooltips; the data keeps group, column, span |
| Sizes | column widths and component heights are integer mm |
| Carcass | same carcass name = one carcass over all its columns; `carcass.depth` deep, back `carcass.wallGap` from the wall |
| Back | only behind cabinet doors, one piece per run of doors, `back.inset` in from the carcass; none behind drawers (dummy fronts too) or appliances |
| Front | cabinet (also with the tag `fridge`, `freezer` or `dishwasher`), drawer (also `dummy`): module − its 4 gaps (left, right, top, bottom) from the data; shaker frame `front.shakerRail` wide |
| Group roles | each group has a role in the notes (`group N` → worktop, tall, island) |
| Worktop | depth by group role from the worktop material (`depth`, e.g. worktop 600, island 900); `worktop.overhang` past the fronts; gap behind the carcass = depth − carcass depth − front − overhang |
| Island | back panel in the panel material, between the end columns, floor to the carcass tops, on the carcass backs (`island.backPanel`) |
| Floor / base | floor carcass = on a plinth: `legsPerCarcass` legs; base = floor + worktop on top: 2 top rails `rails.depth`, otherwise a top panel |
| Plinth | face `plinth.setback` behind the fronts |
| Lacquer | fixed in engine.js, not in data.js (how the kitchen is seen: front and top, the island from all sides): fronts all round (both faces and all edges); frames both faces and 1 long side (the front edge); plinth both faces, no lacquered edge; panels both faces only, so their edges seen get ABS. |
| ABS | carcass boards on the edge seen from the front: sides on the long front edge, bottoms, tops, shelves and front rails on the front edge, rails on edge on the bottom edge; rear rails, back strips, backs, inset panels and drawer parts none; hinge posts on the front edge. Panels on each edge next to a front that opens (a door, a drawer, an appliance door; not a fixed front): that edge shows when the front is open. Next to anything else (another panel, a frame, a filler, the worktop, the plinth) none. The cutting list gives ABS as long / short edges (what the board supplier needs); the Assembly tab says where each one faces. Fronts and frames have lacquered edges, the plinth none: no ABS. The cutting list column "ABS/Lacquer" shows ABS for boards and panels (e.g. "1 long", "1 long + 1 short") and the lacquered edges for fronts ("4"), frames ("1 long") and the plinth (nothing); "4" = all four edges |
| Frame / panel | frame on edge, `frame.depth` deep, back strip when not in a carcass; panel laid flat in the front plane |
| Shelves | adjustable: depth − `shelf.setback`, `shelf.clearance` each side, `shelf.pins` pins; count by door height (`shelf.perDoor`); a shelf is one piece over the whole inside, side to side (also behind an inset panel): a plain board; a hinge post crosses it (the 3D view reports the crossing, fixed on site); fixed shelf at the joint of 2 boxes (not in base carcasses) |
| Hinges | doors only; `hinges.fromEnd` from the ends; count by door height (`hinges.perDoor`); side from the data (`hg` L / R), required on doors and on fridge / freezer doors (a cabinet with that tag), never on the side of the handle, and the hinges are screwed to a carcass side: when the door does not reach one on its hinge side, the engine adds a **hinge post** there (carcass material, `hinges.supportDepth` deep at the front, as high as the door) |
| Drawers | front ≥ `drawers.dFrom` → D, else M; lift `drawers.liftAtBottom` at the bottom, `drawers.liftAbove` above |
| Plasterboard | `plasterboard.depth` deep, studs every `plasterboard.studSpacing`, `plasterboard.layers` layers; corner bead and T seal along each box; 3-5 mm gap to the furniture |

## 2. Types and tags

Type = what a component is (one per component); tag = an extra on a type, allowed only on the types listed.

| Tag | Effect |
|---|---|
| `dummy` (drawer) | fixed drawer front: no drawer box, no runners; fixed with angle brackets |
| `sink` (cabinet, drawer) | top rails on edge; no shelves; sink cut-out in the worktop on that carcass; sink, tap, trap drawn there |
| `hob` (cabinet, drawer) | front rail `rails.hobFront` + separation panel with a `rails.hobPanelGap` air gap at the back; hob and hood drawn there |
| `bins` (drawer) | waste-sorting bins in the drawer |
| `inner` (drawer) | cutlery drawer M above the drawer box, behind the same front, `drawers.inner.gap` above |
| `dishwasher` (cabinet; not with `fridge` / `freezer`) | no carcass (no carcass name); front on the appliance door, no hinges |
| `fridge`, `freezer` (cabinet; one appliance tag per component) | front on the appliance door (hinge side `hg`), no hinges counted, no shelves, no back; plinth grille when on the floor; fridge body splits at the top of its lowest front |
| `coffee` (cabinet) | pull-out shelf at the bottom (`pullOutShelf`: depth, side clearance, lift) on full-extension runners; `pullOutShelf.space` free above it, then `pullOutShelf.shelvesAbove` adjustable shelves; no other shelves |
| `fall` (worktop) | worktop fall: the worktop board turned down to the floor, upright grain |

Types: filler (void; at one end of a carcass - same carcass name - the carcass runs on behind it and an **inset panel** closes its front: carcass material, from the last box (the hinge post) to the far carcass side, between the bottom and the top rail, one board thick at the front, touching the panel in front of it; no ABS), board, plinth, worktop, splash, panel, frame, cabinet, drawer, oven, micro.

## 3. Checks

- Data (engine, shown on all three pages): every board type in exactly one material, every part rule names a material, each with a thickness; a tag only on its types; a worktop height (end: width) and a frame's narrow side match the thickness of their material; hinge and handle not on the same side; exactly one type, unknown tags; group has columns; inside the columns, no overlap; only fronts have a handle, handle T / B / L / R; fronts need 4 gaps; boxes need a carcass name (not a dishwasher); one carcass name per group; worktop needs a group role and a depth; worktop shorter than carcass + front + overhang. A component without one type, outside its group or overlapping is left out of the model.
- Design table cells: group, column, span ≥ 1, height ≥ 0, gaps ≥ 0, numbers.
- View: overlap > 0.01 mm; gap 0.01 ≤ gap ≤ 3 mm; front tops / bottoms 0.01-20 mm apart (off the line, all groups); nothing behind the wall (free-standing groups excepted) or in front of the carcass / plinth.

## 4. Cost assumptions (`cost.html` vars and params) - estimates, not rules

- Board waste, edging allowance, contingency, confirmats per carcass.
- Every price links to the online shop it was taken from (`links` of each item).
- Sheet size (`sheetLength` × `sheetWidth`), plasterboard sheet area, worktop board length (`worktopLength`).
- Prices are shop prices on the date in the page header, until quoted.
