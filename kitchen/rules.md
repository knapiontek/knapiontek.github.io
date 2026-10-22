# Kitchen rules

Generic rules for any kitchen built with these pages. Every value lives once, in `data.js` `rules` (names in `code` below); project specifics (groups, products, design choices such as front gaps) are in the `data.js` notes and in the `cost.html` / `view.html` JSON.
Every rule here is implemented in `engine.js`, and every rule the engine applies is written here. Update this file with every change.

## 1. General rules

| Rule | Value |
|---|---|
| Materials | what you buy, set in `rules.materials` (shown read-only in design.html): name, thickness, colour (none = oak texture), lacquered, core (colour of a bare cut edge), depth by group role, and `types`: the component types made of it. Every board type (worktop, splash, plinth, panel, frame, cabinet, drawer) is in exactly one material; all front types (cabinet, drawer) have one thickness, the front plane. Parts the engine adds take the material their rule names: `carcass.material`, `back.material`, `drawers.material` (drawer box), `rails.hobPanelMaterial` |
| Stacking | components are placed in list order. In each column the stack is the run of components that reaches up from the floor without a gap; a component starts on the highest of those tops over the columns it spans (so it can fill a gap left under a wider component placed before it). A component outside the columns or overlapping another is skipped |
| Place | printed `G1[4]` (group 1, column 4) or `G1[1-11]` (group 1, columns 1 to 11) in warnings, lists and tooltips; the data keeps group, column, span |
| Sizes | column widths and component heights are integer mm; front gaps may be decimals |
| Group roles | each group has a role in the notes (`group N` → worktop, tall, island). The worktop depth is per role; an island gets a back panel and stands free (no wall behind it, no wall hangers) |
| Carcass | same carcass name = one carcass over all its columns (one group only); `carcass.depth` deep, back `carcass.wallGap` from the wall. Floor carcass = stands on a plinth (`legsPerCarcass` legs); base = floor carcass with a worktop on top; tall = floor carcass without; wall = not on a plinth |
| Top | base carcass: 2 flat top rails `rails.depth` deep (on edge under a sink or a hob, see the tags); any other carcass: a top panel |
| Back | only behind cabinet doors, one piece per run of doors, `back.inset` in from the carcass; none behind drawers, dummy fronts, ovens, microwaves, fridges or freezers |
| Front | cabinet and drawer: module − its 4 gaps (left, right, top, bottom) from the data; shaker frame `front.shakerRail` wide. How it opens comes from type and tags: dummy → fixed; drawer → drawer; dishwasher → appliance door, folds down; fridge / freezer → appliance door, hinged; else a door |
| Worktop | depth by group role from the worktop material (`depth`, e.g. worktop 600, island 900); `worktop.overhang` past the fronts; gap behind the carcass = depth − carcass depth − front − overhang |
| Island | when `island.backPanel`: a back panel in the panel material, between the end columns, floor to the carcass tops, on the carcass backs |
| Plinth | face `plinth.setback` behind the fronts |
| Lacquer | fixed in engine.js, not in data.js (how the kitchen is seen: from the front and from above, the island from all sides): fronts all round (both faces and all 4 edges); frames both faces and 1 long edge (the front edge); plinth both faces, no lacquered edge; panels both faces only, so their seen edges get ABS |
| ABS | carcass boards on the edge seen from the front: sides on the long front edge; bottoms, tops, fixed, adjustable and pull-out shelves, flat front rails and hinge posts on the front edge; a front rail on edge on its bottom edge (seen when the drawer below opens). None: rear rails, back strips, backs, inset panels, the hob separation panel, drawer parts. Panels: ABS on each edge next to a front that opens (a door, a drawer, an appliance door; not a dummy front); next to anything else (a panel, a frame, a filler, the worktop, the plinth) none. Fronts and frames are lacquered, the plinth has no finished edge: no ABS. The cutting list gives ABS as long / short edges (what the board supplier needs), the Assembly tab says where each one faces. Column "ABS/Lacquer": ABS for boards and panels ("1 long", "1 long + 1 short"), lacquered edges for fronts ("4" = all four), frames ("1 long") and the plinth (empty) |
| Frame / panel | frame on edge, `frame.depth` deep, with a back strip (carcass material, same size, at the carcass back) when it has no carcass name; panel laid flat in the front plane |
| Shelves | fixed shelf at each joint of 2 boxes, full carcass depth; none in a base carcass (it has rails) or a fridge carcass (ventilation). Adjustable shelves only behind cabinet doors: count by the front height of the door (`shelf.perDoor`), evenly spaced; depth − `shelf.setback`; `shelf.clearance` each side; `shelf.pins` pins. A shelf is one plain board over the whole inside, side to side (also behind an inset panel); a hinge post crosses it (the 3D view reports the crossing, fixed on site). No adjustable shelves in a sink or fridge carcass; a coffee carcass has its own (see the tag) |
| Hinges | doors only (not dummy, dishwasher, fridge or freezer fronts); count by the front height (`hinges.perDoor`), `hinges.fromEnd` from the ends, evenly between. Hinge side from the data (`hg` L / R), required on doors and on fridge / freezer fronts, never on the side of the handle. Hinges are screwed to a carcass side: when the door does not reach one on its hinge side, the engine adds a **hinge post** there (carcass material, `hinges.supportDepth` deep at the carcass front, as high as the door inside the carcass) |
| Per-height tables | `shelf.perDoor`, `hinges.perDoor`: rows `[maxHeight, count]`, ascending; the first row with front height ≤ maxHeight gives the count |
| Drawers | front ≥ `drawers.dFrom` → D box, else M; bottom lifted `drawers.liftAtBottom` in the lowest box, `drawers.liftAbove` above; bottom `drawers.bottom.fromWall` from the wall, `drawers.bottom.depth` deep, interior − `drawers.bottom.inset` wide; back interior − `drawers.back.inset` wide |
| Filler | a void: nothing built. At one end of a carcass (same carcass name), the carcass runs on behind it and an **inset panel** closes its front: carcass material, from the last box (the hinge post) to the far carcass side, between the bottom and the top board, one board thick at the carcass front, touching the panel in front of it; no ABS |
| Plasterboard | `plasterboard.depth` deep (face + return), studs every `plasterboard.studSpacing`, `plasterboard.layers` layers; UD profile on both fixed edges, CD on the outer edge and the cross pieces; corner bead and T seal along each box; 3-5 mm gap to the furniture |

## 2. Types and tags

Type = what a component is (exactly one per component); it decides what gets built. Tag = an extra on a type, allowed only on the types listed; it adds to the same build. Both are written in the component's `tags` field, type first: `"drawer sink bins"`.
A new feature that changes what gets built is a new type; one that adds to an existing build is a tag.

| Type | Builds |
|---|---|
| `filler` | nothing (a void); at one end of a carcass: the inset panel (see Filler) |
| `board` | plasterboard box (see Plasterboard) |
| `plinth` | plinth board |
| `worktop` | worktop board; its thickness must equal the component height (a fall: its width) |
| `splash` | board on the wall |
| `panel` | board laid flat in the front plane |
| `frame` | strip on edge in the front plane; its narrow side must equal its thickness |
| `cabinet` | a box in a carcass with a door (front, hinges, back, shelves) |
| `drawer` | a box in a carcass with a drawer (front, drawer box) |
| `oven`, `micro` | a built-in appliance in a carcass; no front, no back |

| Tag | Allowed on | Effect |
|---|---|---|
| `dummy` | drawer | fixed drawer front: no drawer box, no runners; fixed with angle brackets |
| `sink` | cabinet, drawer | base carcass: both top rails on edge, `rails.depth` high, to clear the bowl; no adjustable shelves; sink cut-out in the worktop on that carcass; sink, tap, trap drawn there |
| `hob` | cabinet, drawer | base carcass: front rail on edge `rails.hobFront` high, rear rail on edge `rails.depth` high, separation panel (`rails.hobPanelMaterial`) under the front rail with a `rails.hobPanelGap` air gap at the back; hob and hood drawn there |
| `bins` | drawer | waste-sorting bins in the drawer |
| `inner` | drawer | inner drawer M above the drawer box, behind the same front, `drawers.inner.gap` above it; back `drawers.inner.back` high; inner front cut to the interior − `drawers.inner.frontDeduction` |
| `coffee` | cabinet | pull-out shelf at the bottom (`pullOutShelf`: depth, side clearance, lift) on full-extension runners; `pullOutShelf.space` free above it, then `pullOutShelf.shelvesAbove` adjustable shelves evenly up to the top; no other shelves |
| `fridge`, `freezer` | cabinet | front on the appliance door (hinge side `hg`), no hinges counted, no shelves, no fixed shelf, no back; plinth grille when on the floor; in the 3D view the fridge body splits at the top of its lowest front |
| `dishwasher` | cabinet | no carcass (no carcass name); front on the appliance door, no hinges |
| `fall` | worktop | worktop fall: the worktop board turned down to the floor, upright grain |

At most one of `fridge`, `freezer`, `dishwasher` per component.

## 3. Checks

- Rules (stop the build; listed in design.html, shown as an error in cost.html and view.html): every board type in exactly one material, every part rule names a material, each material with a thickness > 0, all fronts one thickness; every rule the engine reads is present; `shelf.perDoor` and `hinges.perDoor` are `[maxHeight, count]` tables, at least 2 hinges per door.
- Data (engine warnings, shown on all three pages): group has columns; height an integer; exactly one type; known tags, each on its types, at most one appliance tag; column widths integers; inside the columns, no overlap (else skipped); only fronts have a handle, handle T / B / L / R; fronts need 4 gaps, and the gaps must leave a front; a door or fridge / freezer front needs a hinge side L / R, not on the handle side; only those have a hinge side; boxes need a carcass name (not a dishwasher, which must have none); a carcass name stays in one group; a filler in a carcass is at one end of it; a worktop height (fall: width) and a frame's narrow side match the thickness of their material; a worktop needs a group role with a depth, a top board, and is not shorter than carcass + front + overhang; a front height above the last row of a per-height table. A component without one type, outside its group or overlapping is left out of the model.
- Design table cells: group, column, span whole numbers ≥ 1, height ≥ 0, gaps empty or all 4 ≥ 0.
- View: overlap > 0.01 mm; gap 0.01 ≤ gap ≤ 3 mm between a frame, panel or back strip and its neighbour; front tops / bottoms 0.01-20 mm apart (off the line, all groups); nothing below the floor, behind the wall (an island excepted) or, for carcass parts and legs, in front of the carcass / plinth.

## 4. Cost assumptions (`cost.html` vars and params) - estimates, not rules

- Board waste, edging allowance, contingency, confirmats per carcass.
- Board sheet size (`sheetLength` × `sheetWidth`), plasterboard sheet size (`plasterLength` × `plasterWidth`), worktop board length (`worktopLength`) and the island board depth (`islandBoardDepth`).
- Every price links to the online shop it was taken from (`links` of each item).
- Prices are shop prices on the date in the page header, until quoted.
