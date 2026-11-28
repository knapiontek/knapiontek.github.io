# To do

By the plan, one step at a time; each module: its API and examples first, then the code and its test.

## Done
- [x] UI sketch on Alpine: nav (House, floors, rooms), modes, View / Finish, layers tree, dock, sun, help, light / dark
- [x] archon: drawings in English, `analysis.md` read again: x East, y North, h up (ENU, right-handed); assumptions (§ 12), as built (§ 13)
- [x] library: products, materials, shops, textures as JSON; `openCatalog`; its test
- [x] ES modules, Caddy, `types.js`, the test page
- [x] core/hierarchy: built from the root down (`add`); places from offsets, settings, refs, layers from the root down, checks; its test
- [x] tests: one per module, at its path
- [x] axes ENU (x East, y North, h up), right-handed: `model.json`, `analysis.md`, tests; `view3d.js` without swapping axes; `core/surfaces.js` (was faces); tests of `core/geometry.js` and `core/surfaces.js` by examples
- [x] `view3d.js` as the prototype's: welded faces (`core/surfaces.js`), meshes by group and material, edges from the topology, generated surfaces, the sky; the roof on the Attic floor
- [x] house geometry: `core/geometry.js`, `house/shapes.js` (the prototype's `house/model.js`): cuts, roof, floors, facade, roof, windows, doors, stair; `view3d.js`: prisms, a part's layer and floor, the facade's raw material
- [x] `view3d.js` (root), stage 1: the house's boxes, the site, materials, layers and floors from the panel, edges, cameras, the sun; its test
- [x] `index.json` (root), the app's settings: the layers (the panel reads them; `checks(known)`: an unknown layer or floor) and the view (out of `house/model.json`); its test
- [x] `house/model.json` from the prototype's `house.js`: the site at the root, the house on it in `analysis.md`'s axes (checked against it); `layer` and `floor` on a node, its type's, or its parent's; `house/assembly.js`; its test
- [x] library/shapes: a product as parts in its own axes (`shapeOf`), materials by key or `metal` (Finish); its test

## Next
- [ ] `view3d.js`: moving parts (doors' hinge sense to check), the granite's speckle; the site in the House view
- [x] cabinets, stage 1: the hierarchy's quarter turns (`turn`), sizes to the opposite corner; the design's axes to the model's (`core/tools.js`, y → −y); products in them
- [x] cabinets, stage 2: `room/cabinets.js` (the layout: columns, stack, carcasses, kinds; the tree: carcasses under the worktop or the plasterboard, measured from it), `room/assembly.js` (the scene places the groups), the kitchen's `room_356.cabinets.json` and `room_356.scene.json`; their tests
- [x] cabinets, stage 3: the bodies: carcass boards (sides, rails, tops, backs, shelves, inset panels, the pull-out shelf), shaker fronts, worktop, end panels, wall panel, strips and back strips, plinth, plasterboard; the boards' looks in `view3d.js` (`board:`); the kitchen's scene corrected (group 2 by the West wall, the island before group 1); the kitchen in 3D
- [ ] cabinets: a board's bare edges (its core), the decor's grain
- [x] cabinets, stage 4a: the appliances as the library's products in their places (oven, microwave, fridge-freezer, dishwasher, coffee machine, sink and hob in the worktop's cut-outs, the hood up to the ceiling); handles (a bar), legs, plinth grilles, the tap, the trap; `view3d.js` draws every form (ring, disc, plane, text, sphere, torus, extrude, tube, mesh)
- [x] cabinets, stage 4b: hinges (plate, arm, cup; over a shelf they meet), hinge posts, bumpers, shelf pins, the system drawers (bottom, back, sides, runners, gallery rails), bins, the inner drawer and its cutlery insert, drawers behind doors, drawers of board; the holes' markers (layer Holes)
- [x] cabinets: the makers' data in their products (hinge, bumper, TANDEMBOX D / M / inner, the Häfele runners' family 300 – 600, MOVENTO, shelf pins, bins, the sink's and the hob's cut-outs, the basin's holes), chosen in `settings.hardware`; a hinge at a shelf moved clear by its plate; checked (`stops`)
- [x] cabinets: the kitchen tap a product (Deante Silia BQS_Z73M, `kitchenTap`, from Deante's drawing BQS_x73M), the trap a product (Deante ZXY 9917, `trap`, from its drawing): as short as its maker allows, its outlet at the wall, at its own height (no `installation.sink.trapTop`, `wallOutlet`)
- [x] `view3d.js`: the turn's ball a globe fixed in the world (it turns with the drawing), lit from the viewer, with a highlight
- [x] cabinets: the cup handle ENERYDA as IKEA gives it (89 × 22 × 30, holes 64 apart, Ø5: layer Holes); the hinge's plate 8.5 high (Blum)
- [ ] cabinets: the makers' data still to check against their drawings: the hinge plate's outline and the arm (Blum gives no sizes); the Häfele runners' holes (37, 229, 421); MOVENTO's holes; the bins' place in the drawer
- [x] the library's API: the makers' rules asked of `library/shapes.js`, every fitting a product node placed by its anchor; `cabinets.js` reads no product's fields (the model unchanged, part for part)
- [ ] the view: opening fronts and drawers without clashing with the turn (the left button): a click with no drag opens or closes the front under the cursor (the drag turns), Space in Walk (as in Quake); to settle
- [ ] cabinets: the holes' checks (a hole in a board lying flat, two holes in one place); moving fronts and drawers
- [x] cabinets, stage 5: the other rooms (bathrooms 5 and 7, wardrobes 3, 4 and 8, bedroom 6): their cabinets and scenes (the prototype's placements through its turned room axes, checked against analysis.md § 13); fixtures (the library's products: WC, frame, mirror, shower, bath, radiator, riser), the casings less their cuts, the basin and its tap on the vanity's top; layers Bath and Wall cabinet
- [x] the lamps in the scenes (`lamps`: downlights, pendants; from the prototype's lights, in the room's axes), under the ceiling over the room; `view3d.js` lights them at night (the lamps' and the products' lights: the hood's)
- [x] tiles, stage 1: in the rooms' scenes (floor and walls, each its depth and grout), out of `house/model.json`; checked
- [x] tiles, stage 2: `room/tiles.js`, the floor's tiles laid from the offset, ending at the middle of the doors; the grout in its colour, the tiles' photos, the small cuts marked; counted (m², tiles, whole, cut, small)
- [x] tiles, stage 3: the walls' tiles: round the floor, from the floor's tiles to the ceiling, less the openings; counted
- [x] tiles: under the roof's slope (cut on the slant), the inner corners meeting, a joint over the floor's tiles, the tile on its face toward the room (the rest its bed), no face of the grout in a tile's plane
- [x] tiles: a slab per surface, a solid through the house's surfaces (as the EPS), the grout and each tile's face on it; a tile's photo the whole tile (its image and turn by chance); casings tiled (faces, top, a niche's reveals, floor and top), none under or behind them; corners: inner short, outer past
- [x] the library's API, the rest: `lookOf` (`view3d.js` reads no product's fields); a hinge places its cup itself; the house gives a room its facts (`ceilingHeight`, `openings`: house/assembly.js `roomFacts`), `room/assembly.js` searches no house
- [ ] the model as JSON output: the hierarchy (or a group) exported; its format to settle
- [ ] `view2d.js` (root): the 2D view (the menu's 2D): plans and dimensions
- [ ] `docs.js` (root): Documents
- [ ] Cabinet mode
- [ ] Finish: metal, boards, floor tiles
- [ ] moving parts: doors, fronts, windows
- [ ] cameras, sun, walk
- [ ] docs: the physical rules (cabinets, tiles, products); `project.svg`, `flow.svg`, `types.svg`

## Generalisation (a review: mechanisms written twice, to make one)

Not now: after the prototype is carried over (much of it still to come). Order then: 3, 4, 9, 6 (cheap); 2 and 1 (the lining, with the house); 7, 8 and 5 change the data's format.

- [ ] 1. A lining, one mechanism: a layer of a depth over a set of surfaces, holes for the openings, a rule of who runs on over whom at a corner, a pattern on its face (tiles, planks, none). Today twice: the house's EPS and facade written by hand as elements and regions (`model.json` `finishes`, `house/shapes.js` `applyFinish`), the room's tiles computed (`room/tiles.js` `tiledSurfaces`). One `lining(surfaces, depth, cornerRule, pattern)`, its slabs through `core/surfaces`, the pattern on the face: EPS, facade, tiles, a skirting or a splashback only data
- [ ] 2. The room guesses what the house knows: `roomFacts` gives only the floor's rectangles and the openings' boxes; `room/tiles.js` rebuilds the walls (`wallsOf`) and guesses an opening (thinner than 600; a door: at the floor ±50). The house gives a room its walls as segments, each with the openings it hosts (kind, side)
- [x] 3a. `room/tiles.js` on `core/geometry.js`: its clipping (`clipHalf`), area (`area2`), rectangles less holes (`rectMinus`)
- [ ] 3. One 2D geometry, the rest: `core/geometry.js` (`clipHalf`, `rectMinus`, `mergeRects`, `area2`, `Line {a, s}`) and `room/tiles.js`'s own (`under`, `rectsMinus`, `areaOf`, `Line {p, q, c}`); `room/assembly.js` `minus(box, cuts)` beside `prismMinus` / `subtractAll`. One geometry, one form of a line (a half-plane)
- [x] 4. One chance: `hash01` (`core/geometry.js`) for the tiles' rows and a tile's image and turn (the view's sequence of chances, the clouds, its own)
- [ ] 5. Two axes (the design's, the model's: y mirrored): `partToModel` negates the matrix's row of y and turns the triangles, the data have mirrors of their own (the bath drawn inside out); every new form of a part must remember it. One right-handed system for the data and the model, a mirror only where the data come in. The biggest and riskiest
- [ ] 6. Two ways to place a product: the cabinets by its `anchor` (point − anchor), the scenes' fixtures by its zero (at the wall, at its left end) and `front` → `turn`. One `place(product, point, front)` by its anchor
- [ ] 7. Products drawn by code, not data: `library/shapes.js` `described`, some 25 functions (`mirror`, `wallCabinet`, `linearDrain`, `sink`, `hob`, `oven` …) beside 13 products shaped in their data (`shaped`); the lamps (`room/assembly.js` `lampOf`) not the library's products at all. A parametric shape in the data (sizes as expressions of `size` and `options`); code only for a maker's rules (hinge, runners, trap)
- [ ] 8. A material as a language in strings: `board:<key>`, `tile:<p>:<img>:<UxV>`, `tile:<p>:edge`, `grout:#hex`, `metal`, made by every module and taken apart by `view3d.js`. A material as an object (`{ product, image, size }` / `{ color }`) or one resolver in the library
- [x] 9a. One reader of a file of a format: `core/tools.js` `readFormat` / `checkFormat` (the house's model, the library's files, a room's scene and cabinets)
- [ ] 9. Checking by a format's spec, the rest; was: reading and checking files four times: `format` / `version` + `fetch` in `house/assembly.js`, `room/cabinets.js`, `library/catalog.js`, `room/assembly.js`; the scene checked by throwing inside `assembleRooms` beside `tilesFaults` and `faultsOf`. One `readFormat(url, format, version)`, one check by a format's spec, a list of faults
