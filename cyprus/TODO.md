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
- [ ] cabinets: the cup handle (ENERYDA) for the bar; the holes' checks (a hole in a board lying flat, two holes in one place); moving fronts and drawers
- [x] cabinets, stage 5: the other rooms (bathrooms 5 and 7, wardrobes 3, 4 and 8, bedroom 6): their cabinets and scenes (the prototype's placements through its turned room axes, checked against analysis.md § 13); fixtures (the library's products: WC, frame, mirror, shower, bath, radiator, riser), the casings less their cuts, the basin and its tap on the vanity's top; layers Bath and Wall cabinet
- [x] the lamps in the scenes (`lamps`: downlights, pendants; from the prototype's lights, in the room's axes), under the ceiling over the room; `view3d.js` lights them at night (the lamps' and the products' lights: the hood's)
- [ ] tiles
- [ ] `view2d.js` (root): the 2D view (the menu's 2D): plans and dimensions
- [ ] `docs.js` (root): Documents
- [ ] Cabinet mode
- [ ] Finish: metal, boards, floor tiles
- [ ] moving parts: doors, fronts, windows
- [ ] cameras, sun, walk
- [ ] docs: the physical rules (cabinets, tiles, products); `project.svg`, `flow.svg`, `types.svg`
