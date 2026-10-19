# Kitchen rules

Generic rules for any kitchen built with these pages. Every value lives once, in `data.js` `rules` (names in `code` below); project specifics (groups, products, design choices such as front gaps) are in the `data.js` notes and in the view / cost JSON.
Files: `data.js` (design + rules) → `engine.js` (parts, data checks, writes data.js) → `design.html` (edits and draws), `cost.html`, `view.html`. Update this file with every change.

## 1. General rules

| Rule | Value |
|---|---|
| Materials | what you buy, set in data.js (shown read-only in design.html): name, thickness, colour (none = oak texture), lacquered, core (colour of a bare cut edge: chipboard, the frames' MDF), depth by group role, and `types`: the component types made of it; every board type is in exactly one material. Carcass parts take the material their rule names: `carcass.material`, `back.material`, `drawers.material` (drawer box), `rails.hobPanelMaterial`; all front types one thickness (the front plane). The pages read names, colours and thicknesses from here |
| Stacking | components stack bottom-up in each column, in list order; columns give the widths |
| Sizes | column widths and component heights are integer mm |
| Carcass | same carcass name = one carcass over all its columns; `carcass.depth` deep, back `carcass.wallGap` from the wall |
| Back | only behind cabinet doors, one piece per run of doors, `back.inset` in from the carcass; none behind drawers, fixed fronts or appliances |
| Front | cabinet, drawer, dummy, dishwasher, fridge, freezer: module − its 4 gaps (left, right, top, bottom) from the data; shaker frame `front.shakerRail` wide |
| Group roles | each group has a role in the notes (`group N` → worktop, tall, island) |
| Worktop | depth by group role from the worktop material (`depth`, e.g. worktop 600, island 900); `worktop.overhang` past the fronts; gap behind the carcass = depth − carcass depth − front − overhang |
| Island | back panel in the panel material, between the end columns, floor to the carcass tops, on the carcass backs (`island.backPanel`) |
| Floor / base | floor carcass = on a plinth: `legsPerCarcass` legs; base = floor + worktop on top: 2 top rails `rails.depth`, otherwise a top panel |
| Plinth | face `plinth.setback` behind the fronts |
| Lacquer | fronts all round (both faces and all edges); frames both faces and the edges in `frame.lacqueredEdges` (the front edge); panels both faces only, so their edges seen get ABS; plinth both faces only. Edges of the plinth and the island back panel are painted on site with a waterproof product |
| ABS | carcass boards on the edge seen from the front: sides on the long front edge, bottoms, tops, shelves and front rails on the front edge, rails on edge on the bottom edge; rear rails, back strips, backs and drawer parts none. Panels on the sides set per component (`abs`: T B L R, seen from the room). The cutting list gives ABS as long / short edges (what the board supplier needs); the Assembly tab says where each one faces. Fronts, frames and the plinth have lacquered edges, no ABS |
| Frame / panel | frame on edge, `frame.depth` deep, back strip when not in a carcass; panel laid flat in the front plane |
| Shelves | adjustable: depth − `shelf.setback`, `shelf.clearance` each side, `shelf.pins` pins; count by door height (`shelf.perDoor`); fixed shelf at the joint of 2 boxes (not in base carcasses) |
| Hinges | doors only; `hinges.fromEnd` from the ends; count by door height (`hinges.perDoor`); side from the data (`hg` L / R), required on doors and fridge doors, never on the side of the handle, and only on a side where the door reaches a carcass side (the hinges are screwed to it) |
| Drawers | front ≥ `drawers.dFrom` → D, else M; lift `drawers.liftAtBottom` at the bottom, `drawers.liftAbove` above |
| Plasterboard | `plasterboard.depth` deep, studs every `plasterboard.studSpacing`, `plasterboard.layers` layers; corner bead and T seal along each box; 3-5 mm gap to the furniture |

## 2. Types and tags

Type = what a component is (one per component); tag = an extra on a type, allowed only on the types listed.

| Tag | Effect |
|---|---|
| `sink` (cabinet, drawer, dummy) | top rails on edge; no shelves; sink cut-out in the worktop on that carcass; sink, tap, trap drawn there |
| `hob` (cabinet, drawer) | front rail `rails.hobFront` + separation panel with a `rails.hobPanelGap` air gap at the back; hob and hood drawn there |
| `bins` (drawer) | waste-sorting bins in the drawer |
| `inner` (drawer) | cutlery drawer M above the drawer box, behind the same front, `drawers.inner.gap` above |
| type `dishwasher` | no carcass; front on the appliance door, no hinges |
| type `fridge`, `freezer` | front on the appliance door (hinge side `hg`), no shelves, no back; plinth grille when on the floor; fridge body splits at the top of its lowest front |
| `coffee` (cabinet) | pull-out shelf at the bottom (`pullOutShelf`: depth, side clearance, lift) on full-extension runners; `pullOutShelf.space` free above it, then `pullOutShelf.shelvesAbove` adjustable shelves; no other shelves |
| `fall` (worktop) | worktop fall: the worktop board turned down to the floor, upright grain |

Types: filler (void), board (plasterboard), plinth, worktop, splash, panel, frame, cabinet, drawer, dummy (fixed front in a carcass: no hinges, no drawer box, no back), dishwasher, fridge, freezer, oven, micro.

## 3. Checks

- Data (engine, shown on all three pages): every board type in exactly one material, every part rule names a material, each with a thickness; a tag only on its types; a worktop height (end: width) and a frame's narrow side match the thickness of their material; hinge and handle not on the same side; a hinge side needs a carcass side behind it; exactly one type, unknown tags; group has columns; inside the columns, no overlap; only fronts have a handle, handle T / B / L / R; ABS sides (abs) only on panels, T / B / L / R; fronts need 4 gaps; boxes need a carcass name (not a dishwasher); one carcass name per group; worktop needs a group role and a depth; worktop shorter than carcass + front + overhang. A component without one type, outside its group or overlapping is left out of the model.
- Design table cells: group, column, span ≥ 1, height ≥ 0, gaps ≥ 0, numbers.
- View: overlap > 0.01 mm; gap 0.01 ≤ gap ≤ 3 mm; front tops / bottoms 0.01-20 mm apart (off the line, all groups); nothing behind the wall (free-standing groups excepted) or in front of the carcass / plinth.

## 4. Cost assumptions (`cost.html` vars and params) - estimates, not rules

- Board waste, edging allowance, contingency, confirmats per carcass, plinth clips per leg.
- Sheet size (`sheetLength` × `sheetWidth`), plasterboard sheet area, worktop board length (`worktopLength`).
- Prices are estimates until quoted.
