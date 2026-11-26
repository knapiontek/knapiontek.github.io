# To do

By the plan, one step at a time; each module: its API and examples first, then the code and its test.

## Done
- [x] UI sketch on Alpine: nav (House, floors, rooms), modes, View / Finish, layers tree, dock, sun, help, light / dark
- [x] archon: drawings in English, `analysis.md` read again: x East, y South, h up; assumptions (§ 12), as built (§ 13)
- [x] library: products, materials, shops, textures as JSON; `openCatalog`; its test
- [x] ES modules, Caddy, `types.js`, the test page
- [x] core/hierarchy: built from the root down (`add`); places from offsets, settings, refs, layers from the root down, checks; its test
- [x] tests: one per module, at its path
- [x] `scene.js` as the prototype's: welded faces (`core/faces.js`), meshes by group and material, edges from the topology, generated surfaces, the sky; the roof on the Attic floor
- [x] house geometry: `core/geometry.js`, `house/parts.js` (the prototype's `house/model.js`): cuts, roof, floors, facade, roof, windows, doors, stair; `scene.js`: prisms, a part's layer and floor, the facade's raw material
- [x] `scene.js` (root), stage 1: the house's boxes, the site, materials, layers and floors from the panel, edges, cameras, the sun; its test
- [x] `layers.json` (root): the panel reads it; `checks(known)`: an unknown layer or floor; its test
- [x] `house/model.json` from the prototype's `house.js`: the site at the root, the house on it in `analysis.md`'s axes (checked against it); `layer` and `floor` on a node, its type's, or its parent's; `house/build.js`; its test
- [x] library/shapes: a product as parts in its own axes (`shapeOf`), materials by key or `metal` (Finish); its test

## Next
- [ ] `scene.js`: the other forms (ring, plane, sphere, torus, extrude, tube, mesh, text), moving parts (doors' hinge sense to check), the granite's speckle; the site in the House view
- [ ] `room/build.js`: a room's fittings from the library (lamps, basin, mirror); calls the cabinets, adds what they need from the library; a WC frame's parts behind the casing (Installations): their own node
- [ ] `room/cabinets.js` and `room/<room>.cabinets.json` (materials, settings, groups, components): the cabinets' engine, by stages; the hardware, the kitchen tap, the trap; tiles
- [ ] `plan.js` (root): plans and dimensions
- [ ] `docs.js` (root): Documents
- [ ] Cabinet mode
- [ ] Finish: metal, boards, floor tiles
- [ ] moving parts: doors, fronts, windows
- [ ] cameras, sun, walk
- [ ] docs: the physical rules (cabinets, tiles, products); `project.svg`, `flow.svg`, `types.svg`
