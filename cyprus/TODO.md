# To do

By the plan, one step at a time; each module: its API and examples first, then the code and its test.

## Done
- [x] UI sketch on Alpine: nav (House, floors, rooms), modes, View / Finish, layers tree, dock, sun, help, light / dark
- [x] archon: drawings in English, `analysis.md` read again: x East, y South, h up; assumptions (§ 12), as built (§ 13)
- [x] library: products, materials, shops, textures as JSON; `openCatalog`; its test
- [x] ES modules, Caddy, `types.js`, the test page
- [x] core/hierarchy: built from the root down (`add`); places from offsets, settings, refs, layers from the root down, checks; its test
- [x] tests: one per module, at its path
- [x] `layers.json` (root): the panel reads it; `checks(known)`: unknown layers; its test
- [x] `house/model.json` from the prototype's `house.js`, in x East (checked against `analysis.md`); `house/build.js`: its hierarchy, layers by type; its test
- [x] library/shapes: a product as parts in its own axes (`shapeOf`), materials by key or `metal` (Finish); its test

## Next
- [ ] `plot3d.js` (root): the hierarchy in three.js: walls cut round their openings (and the EPS they cross), boxes under the roof cut by it, an element over both floors split at `split` for its floor layer; a leaf's parts, or its product's shape (`shapeOf`); placed by the hierarchy, its look by material; the granite's speckle
- [ ] `room/build.js`: a room's fittings from the library (lamps, basin, mirror); calls the cabinets, adds what they need from the library; a WC frame's parts behind the casing (Installations): their own node
- [ ] `room/cabinets.js` and `room/<room>.cabinets.json` (materials, settings, groups, components): the cabinets' engine, by stages; the hardware, the kitchen tap, the trap; tiles
- [ ] `plot2d.js` (root): plans and dimensions
- [ ] `docs.js` (root): Documents
- [ ] Cabinet mode
- [ ] Finish: metal, boards, floor tiles
- [ ] moving parts: doors, fronts, windows
- [ ] cameras, sun, walk
- [ ] docs: the physical rules (cabinets, tiles, products); `project.svg`, `flow.svg`, `types.svg`
