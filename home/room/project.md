# Room

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

The room engine: it makes a room from what the house gives it (the room's node: its origin and height) and from the room's own data files, and draws it into the house's page. So far the kitchen (kitchen_6), the walk-in wardrobes (wardrobe_3, wardrobe_4, wardrobe_8) and the bedroom's niche (bedroom_6).

## Files

| File | Does |
|---|---|
| room.js | puts a room together: places its groups where the scene says, builds its cabinets and products, its lamps; its layers for the panel; its checks. prepare() needs no browser, build() draws |
| cabinets.js | the cabinets of a room from its cabinets file: the model (carcasses, boards, fronts, strips, panels, plinths, worktops, plasterboard, holes, counts, problems), the tree of the furniture, and its drawing. The model needs no browser |
| `<kind>_<number>.cabinets.js` | a room's cabinets (format cabinets) |
| `<kind>_<number>.scene.js` | where a room's groups stand and how it is fitted and lit (format scene) |
| tiles.js | the floor tiles of a layout (house/project.md): its rooms and zones, the tiles laid from the grid's origin, the count (whole, cut, small cuts), the origin with the fewest small cuts, the faces to draw (a tile's image and turn, a plank's crop of the photo). No browser |
| cabinets.md, tiles.md, products.md | how cabinets are made, tiles laid, products fitted: for the builder, in words (no code, no numbers); with cabinets.js, tiles.js, library/draw.js |
| docs.js | a furnished room's Documents: the estimate, the cut list, the notes, the assembly cards, from the cabinets' model, the room's tree and its docs file; their check. No browser but the cards |
| `<kind>_<number>.docs.js` | what a room's Documents say (format docs) |

The products (an oven, a sink, a lamp) are drawn by library/draw.js; the room only says where.

## How it fits together

```
house.js (files of a room) ─► index.html ─► room.js prepare: cabinets.js build ─► the model ─► tree
                                           room.js build: cabinets.js draw, library/draw.js ─► solids, moving parts, details, lamps ─► core
```

## Coordinates

In the house's axes and order: x, y, h; a box is `[x0, x1, y0, y1, h0, h1]`, all in mm.

- **A group** has its own x, y, h: x from its left end as seen from its fronts, y from its wall out into the room, h up from the floor. Its origin is its left end, its wall, the floor; for an island the wall is its back edge. The room sets a group by its box in the room and the side its fronts face: a quarter turn (with a mirror, as a group's x, y, h are left-handed); the furniture comes out as built.
- **The tree**: group → first what runs along it (worktop, end panels, wall panel, plasterboard, front and back strips, plinth, front panels, the hood), then its units in a row as they stand: its carcasses and a dishwasher's bay (its front and the appliance) → a carcass's boards, fronts, products and hardware (legs, a plinth's grille, shelf pins, bumpers, a pull-out shelf's runners) (oven, microwave, fridge-freezer, sink with its tap and trap, hob, coffee machine) → a front's panel, its hardware (hinges, handle, runners) and its drawer's boards, its inner drawer, its drawers behind the door. Each node: id (unique among its siblings), name, type, offset from its parent's origin (the parent's left, back, bottom corner), size (its own part; a carcass's or a container's: with what it holds). A carcass stands at y = its group's backGap; changing the gap moves the carcass and all in it.
- A product is drawn in its own coordinates, from the origin of its node; the room moves the drawing there (a translation).
- The model still computes with y from the carcass backs; the tree is what comes out of it. The hardware is drawn by the library from its node, like the products (legs, grilles, shelf pins, bumpers, hinges, handles, runners). Everything of the furniture is drawn from its node: the boards, the fronts' panels, the worktops and the plasterboard by the cabinets; the products, the hardware and a drawer system's metal (its sides, gallery rails, an inner drawer's front, bins, a cutlery insert) by the library; a hole where its board's node is. The trap's outlet runs to the wall, not into it.

## Formats

**cabinets** (version 1): `settings`, `appliances`, `notes`, `groups`, `components`.

| Field | Means |
|---|---|
| settings.materials | each kind of part (carcass, drawerBox, hobPanel, backPanel, cabinet, drawer, frontPanel, strip, plinth, wallPanel, worktop, islandWorktop, endPanel, islandEndPanel) → a board of the library |
| settings.hardware | the hardware chosen: handle, leg, hinge, drawer, plinthGrille → products of the library; each only if the room has what it serves (no doors: no hinge) |
| settings (the rest) | how the cabinets are built: carcass, backPanel, crossRails, shelf, pullOutShelf, doorDrawers, hinges, drawers, strip, plinth, worktop, plasterboard, drilling, cutouts. A setting is needed only by what the room has (a wardrobe needs no worktop, no cross rails) |
| settings.shelf.grid | from, pitch, fixedEvery: the shelves' tops on the lines from + k·pitch, the same for every carcass of the room; fixed on every fixedEvery-th line, the others on pins; a carcass's top or a fixed shelf off the grid is a warning. Without it: shelf.perDoor |
| settings.drawers.box | `board`: drawers of board on ball runners (drawers.board: sideHeight, lift, clearance, setback, backClearance, runnerLengths: the longest runner that fits the depth); otherwise the drawer system of settings.hardware.drawer |
| appliances | role (oven, microwave, fridgeFreezer, dishwasher, hob, sink, hood, coffee) → {product, feet}: the product and how it is built in |
| notes | the designer's notes: name, description, details |
| groups | group (a number), name, backGap (the gap behind the carcasses), depth (its carcasses' depth; none: settings.carcass.depth), columns (their widths) |
| components | one piece each: group, column, span, type, height; carcass (its name, unique in the room), tags, handle, gaps, hinge, note. The tag `open` (cabinet, drawer): no front, an open shelf or a drawer box seen from the room; `basin` (drawer): the basin stands over it, its holes cut in the top above; `banded` (worktop): banded on all four edges (a vanity's top) |
| carcass.base, carcass.hung | base: the carcasses carry a worktop but need not stand on the floor; hung: nothing under them but space (a vanity on hidden hangers, counted a pair a carcass) |
| cutouts.basin | fromBack; holes [{for: drain or tap, diameter, along, fromBack}]: the round holes of a basin on the top, from its template |

**scene** (version 1):

| Field | Means |
|---|---|
| groups | group number → {front: the side its fronts face (N, S, E, W), offset, size}: its box in the room, from the room's origin, in the house's axes |
| room | wallColor: the paint of the plasterboard |
| finish | metal: the one metal of the room (a material of the library with finish `metal`): every metal part drawn in it (handles, taps, profiles, a radiator's rails, the lamps' rings); a product sold in a metal is in it (Test) |
| installation | sink: tapFromBack, trapTop, wallOutlet; hood: bottom |
| hardware | our layout of the hardware as drawn: handle (axis, barLength, sideHeight), open (the angles and the drawers' travel; doorStop: a carcass's door that opens less), leg (fromSide, fromBack, fromFront), bins (count, height), plinthGrille (bottom) |
| floors, floorJoint | the tiles to choose for the floor (not drawn yet) |
| lights | (the layer Lights: the lamps and their light) pendantBottom; pendants {group, count, spacing}; downlights: {group, x, y} or {group, between: [axes], y}, y from the wall |
| fixtures | id → {product, front, offset, depth?, length?, height?}: a bought thing placed like a group (a WC frame, a WC, a mirror, a radiator, a screen, a drain, a shower set, a riser, an inspection hatch); depth: what it reaches out of its wall as built (a frame with its flush plate on the casing); length, height: a pipe's as it runs here (the WC's outlet to the riser, the riser up to its casing's top). What stands on a tiled wall stands on the tiles (10 mm out) |
| builtIns | [{name, box, cuts?, material, tiled?}]: tiled false: a part with no tiles (a shelf on a casing); what the owner builds (a plasterboard casing): one solid, its box in the room's axes, its openings (a niche) cut out of it as boxes; no line between its pieces. Tiled like a wall: its faces that face the room, the openings' reveals |
| the room's ceiling | the house gives a room what closes it above as lines h <= a + s·y of its own axes: a ceiling over it (the attic's flat one) and, on the top floor, the roof's underside. The lowest flat line is the ceiling (its lamps); a wall's tiles are cut along the others (a gable wall under the slope) |
| the 2D plan | a room's furniture as a plan of about 1:50 shows it: not cut, seen from above. A carcass is one rectangle with its front (its handles left out); the tops (worktops, end panels) one figure without joints, their openings left; a sink and a hob their outlines, an appliance its body; built-ins and the sanitary fittings their own outlines (glass in blue). Over the plan's cut (wall units, the hood): dashed. Left out: boards, drawers, hardware, handles, strips, plinths, backs, legs, holes, installations |
| layers | a tile goes with what it lies on: a wall's with the blocks (walls), a casing's with the casing (builtIns), as a facade with its EPS; installations: what a casing hides (the riser, the WC frame and its cistern) |
| tiles | walls, floor, shower {zone, walls, floor}: each {product, pattern, origin?}; without an origin the tiles are moved along each wall (rows from the floor) and on the floor for the fewest small cuts; the shower's zone [x0, x1, y0, y1] tiled apart |
| lights.downlights.at | [x, y] in the room's axes, where no group carries them (a bathroom) |
| cameras | name, eye, target: in the room's axes, from its zero |

## The format `docs`, version 1

What the Documents of a room say that the model and the library do not: `page` (title, heading, info, the XLSX's name, what is excluded), `params` (waste, the sheet's m², the reserve), `values` (stock sizes, allowances), `labels` (a front's function by type and tags, the sheet's label, the cut list's title and note, the drilling legend's remarks), `blocks` (the cut list's tables: id, a two-letter code for the rows' labels, title, columns, cut: the saw cuts priced), `categories` (the estimate's items: id; a product (its key) or a material (a use of the cabinets file) with its name; spec (only what the room adds to the product's); use; qty; refs to notes), `formulas` (named, used in texts), `notes` (by section: topic, description, assumed, decide, an appliance, links). The name, spec, unit, price, source and links of a product are the library's.

A quantity is a number or a formula `=…` (ROUNDUP); a text may hold placeholders: `{nodes:hinge}` how many nodes of that kind the room's tree holds (hardware, appliances); `{n:…}` the model's counts; `{s:…}` a setting; `{t:…}` a thickness; `{d:…}` a depth and `{m:…}` the label of a use's board; `{w:…}` a worktop, `{g:…}` a group, `{k:K25.innerWidth}` a carcass, `{i:K25/oven.space}` an item (its module, front, the space around it, the drawers behind its door, its appliance's fit); `{a:…}` an appliance; `{v:…}` a value; `{p:…}` an item's price and `{q:…}` its quantity; `{note:…}` a note's number; `{f:…}` a formula; `{carcass.m2}` a block's total (m2, edge, cut, length: m of the longer side, for what is sold by the metre); `{=…}` a calculation of `<placeholders>`; `|%` as a percentage.

## Edge banding

An edge is banded to be seen, by three rules, each for every board alike: an edge facing the fronts (into the room) is banded on the boards that show it (sides, tops, bottoms, shelves, horizontal rails, the hinge post, a spacer; a front on every edge); a part that slides out (a drawer's boards, a pull-out shelf) has its top edge banded, seen from above when it is out; what is hidden behind another part (a back rail behind its strip, backs, inset panels, a system drawer's bottom) has none. Test checks that no banded edge lies against another part.

## Checks (Test)

- The model's problems (cabinets.js); a check marked as information (a hinge's cup by a door's edge) is shown, not counted as a fault.
- The tree (core/tree.js): ids, sizes; each group inside the box its scene gives it.
- Every solid inside its group's box; no part with no size.
- No banded edge lies against another part (a board, a front, a worktop, a panel, an appliance, the wall, the floor).
