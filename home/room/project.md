# Room

The room engine: a room from what the house gives (its node: origin, size, floor area, openings, ceiling) and the room's own data files, drawn into the house's page. Rooms with files: room_356, bathroom_5, bathroom_7, wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6.

## Files

| File | Does |
|---|---|
| model.js | a room's model, no browser: the cabinets' model, groups and fixtures placed where the scene says, the hardware as drawn, the tree, the looks and textures it needs, its tiles laid and counted; the checks of its tree |
| view.js | a room drawn from its model: cabinets, products, built-ins, tiles, lamps described (core/parts.js), core/scene.js draws; the furniture's 2D plan; the checks of what is drawn; the layers of its view |
| cabinets.js | a cabinets file → the model (carcasses, boards, fronts, strips, panels, plinths, worktops, plasterboard, holes, counts, problems), the furniture's tree. Needs nothing |
| furniture.js | the cabinets described (core/parts.js) from their model: carcasses, fronts, worktops, panels, hardware, the products in them; the boards' looks |
| tiles.js | tiles of a layout: rooms and zones, tiles laid from the grid's origin, the count (whole, cut, small cuts), the origin with fewest small cuts, the faces to draw; a floor's layout laid over its rooms and its pieces (one slab: edges only round its outline). No browser |
| docs.js | a furnished room's Documents: estimate (core's), cut list (boards with edges, m², banding, cuts), notes, assembly cards; their check. No browser but the cards |
| design.js | the mode Cabinets: a cabinets file as tables (groups, columns, components, notes) → the model → the fronts drawn (SVG); Import, Export, Show in 3D. Its screen is in index.html |
| `<kind>_<number>.cabinets.js` | a room's furniture (format cabinets) |
| `<kind>_<number>.scene.js` | where a room's groups and fixtures stand; its finish, tiles, lights, cameras (format scene) |
| `<kind>_<number>.docs.js` | what a room's Documents say (format docs) |
| cabinets.md, tiles.md, products.md | how cabinets are made, tiles laid, products fitted: rules in words, for the builder |

```
house.js (a room's files) ─► index.js ─► model.js: cabinets.js model, tiles.js ─► tree, counts
                                       ─► view.js: furniture.js, library/shapes.js ─► a description ─► core/scene.js
```

## Coordinates

House axes: x, y, h; a box is `[x0, x1, y0, y1, h0, h1]`; mm.

- **A group** has its own axes: x from its left end seen from the fronts, y from its wall into the room, h up from the floor (an island: y from its back edge). The scene gives the group's box in the room and its fronts' side; the room turns it a quarter, with a mirror (a group's axes are left-handed).
- The cabinets model computes with y from the carcass backs; the tree comes out of it. A carcass stands at y = its group's backGap; changing the gap moves the carcass and everything in it.
- **The furniture's tree**: group → what runs along it (worktop, end panels, wall panel, plasterboard, front and back strips, plinth, front panels, hood), then its units in a row (carcasses, a dishwasher's bay) → a carcass's boards, fronts, products (oven, microwave, fridge-freezer, sink with tap and trap, hob, coffee machine) and hardware (legs, plinth grille, shelf pins, bumpers, pull-out runners) → a front's panel, hardware (hinges, handle, runners), its drawer's boards, inner drawer, drawers behind a door. Each node: id (unique among siblings), name, type, offset from its parent's left-back-bottom corner, size (a container's: with its contents).
- Drawn from its node: boards, front panels, worktops, plasterboard by furniture.js; products, hardware and a drawer system's metal (sides, gallery rails, inner drawer's front, bins, cutlery insert) by library/shapes.js, in the product's own coordinates, moved to the node; a hole where its board's node is. A trap's outlet runs to the wall, not into it.

## Format `cabinets`, version 1

Fields: `settings`, `appliances`, `notes`, `groups`, `components`. Rules for what they build: cabinets.md.

| Field | Means |
|---|---|
| settings.materials | part kind (carcass, drawerBox, hobPanel, backPanel, cabinet, drawer, frontPanel, strip, plinth, wallPanel, worktop, islandWorktop, endPanel, islandEndPanel) → a library board |
| settings.hardware | handle, leg, hinge, drawer, plinthGrille → library products; only what the room uses (no doors: no hinge) |
| settings (other) | carcass, backPanel, crossRails, shelf, pullOutShelf, doorDrawers, hinges, drawers, strip, plinth, worktop, plasterboard, drilling, cutouts; only what the room uses |
| settings.shelf.grid | from, pitch, fixedEvery: shelf tops on lines from + k·pitch, the same in every carcass of the room; every fixedEvery-th fixed, others on pins; a carcass top or fixed shelf off the grid is a warning. None: shelf.perDoor |
| settings.drawers.box | `board`: board drawers on ball runners (drawers.board: sideHeight, lift, clearance, setback, backClearance, runnerLengths); otherwise the drawer system of hardware.drawer |
| settings.cutouts.basin | fromBack; holes [{for: drain or tap, diameter, along, fromBack}]: the basin's round holes in the top |
| appliances | role (oven, microwave, fridgeFreezer, dishwasher, hob, sink, hood, coffee) → {product, feet} |
| notes | designer's notes: name, description, details |
| groups | group (number), name, backGap (gap behind the carcasses), depth (none: settings.carcass.depth), columns (widths) |
| components | group, column, span, type, height; carcass (name, unique in the room), tags, handle, gaps, hinge, note. Types and tags: cabinets.md §2 |

## Format `scene`, version 1

| Field | Means |
|---|---|
| groups | group number → {front (N, S, E, W), offset, size}: its box in the room's axes |
| fixtures | id → {product, front, offset, depth?, length?, height?}: a bought thing placed like a group (WC frame, WC, mirror, radiator, screen, drain, shower set, riser, hatch); depth: reach out of the wall as built; length, height: a pipe's run |
| builtIns | [{name, box, cuts?, material, tiled?}]: what the owner builds (plasterboard casing): one solid, box in the room's axes, openings (a niche) cut out; `tiled: false`: no tiles |
| room | wallColor: plasterboard paint |
| finish | metal: the room's one metal (a library material with finish `metal`) for every metal part; a product sold in metals is in it (Test) |
| installation | sink: tapFromBack, trapTop, wallOutlet; hood: bottom |
| hardware | our layout of hardware: handle (axis, barLength, sideHeight), open (angles, drawer travel; doorStop: a door that opens less), leg (fromSide, fromBack, fromFront), bins (count, height), plinthGrille (bottom) |
| lights | pendantBottom; pendants {group, count, spacing}; downlights {group, x, y} or {group, between: [axes], y} (y from the wall), or `at` [x, y] in the room's axes (no group: a bathroom) |
| tiles | walls, floor, shower {zone [x0, x1, y0, y1], walls, floor}: each {product, format? [length, width] (a size the product is made in), dir (x or y: the tiles' length along it), pattern?, origin?, grout?} (room/tiles.md) |
| cameras | name, eye, target in the room's axes |

How a room is drawn from it:

- **Ceiling**: the house gives what closes the room above as lines h ≤ a + s·y in its axes (a flat ceiling; on the top floor the roof's underside). The lowest flat line is the ceiling (lamps); wall tiles are cut along the others.
- **On tiles**: what stands on a tiled wall stands on the tiles' face.
- **2D** (about 1:50, seen from above, not cut): a carcass as one rectangle with its front; tops (worktops, end panels) as one figure with their openings; sink and hob outlines, appliance bodies; built-ins and sanitary outlines (glass blue); over the cut (wall units, hood) dashed. Left out: boards, drawers, hardware, strips, plinths, backs, legs, holes, installations.
- **Layers**: a tile goes with what it lies on (a wall's with Blocks, a casing's with Built in); Installations: what a casing hides (riser, WC frame, cistern).

## Format `docs`, version 1

What a room's Documents say beyond the model and the library:

| Field | Means |
|---|---|
| page | title, heading, info, xlsxFile, excluded |
| params | waste, sheet m², reserve |
| values | stock sizes, allowances |
| labels | a front's function by type and tags; the sheet's label; the cut list's title and note; drilling legend remarks |
| blocks | cut list tables: id, two-letter row code, title, columns, cut (saw cuts priced) |
| categories | estimate items: id; a product (key) or a material (a use of the cabinets file) with its name; spec (only what the room adds); use; qty; refs to notes |
| formulas | named, used in texts |
| notes | by section: topic, description, assumed, decide, appliance, links |

A product's name, spec, unit, price, source and links come from the library.

A quantity is a number or a formula `=…` (ROUNDUP). Text placeholders: `{nodes:hinge}` nodes of that kind in the room's tree; `{n:…}` model counts; `{s:…}` setting; `{t:…}` thickness; `{d:…}` depth; `{m:…}` label of a use's board; `{w:…}` worktop; `{g:…}` group; `{k:K25.innerWidth}` carcass; `{i:K25/oven.space}` item (module, front, space, drawers behind its door, appliance fit); `{a:…}` appliance; `{v:…}` value; `{p:…}` item price; `{q:…}` item quantity; `{note:…}` note number; `{f:…}` formula; `{carcass.m2}` block total (m2, edge, cut, length: m of the longer side); `{=…}` calculation of placeholders; `|%` percentage.

## Checks (Test)

- The model's problems (cabinets.js); info items (a hinge cup by a door's edge) shown, not counted.
- The tree: ids, sizes; each group inside its scene box; every solid inside its group's box; no part without size.
- No banded edge against another part (board, front, worktop, panel, appliance, wall, floor). Which edges are banded: cabinets.md §6.
- Documents: the tree's counts equal the model's.
- Finish: products in the room's metal; every edge banding in a board's decor.
