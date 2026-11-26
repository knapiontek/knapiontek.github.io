# To do

By the plan, one step at a time; each module: its API and examples first, then the code and its test.

## Done
- [x] UI sketch on Alpine: nav (House, floors, rooms), modes, View / Finish, layers tree, dock, sun, help, light / dark
- [x] archon: drawings in English, `analysis.md` read again: x East, y South, h up; assumptions (§ 12), as built (§ 13)
- [x] library: products, materials, shops, textures as JSON; `openCatalog`; its test
- [x] ES modules, Caddy, `types.js`, the test page
- [x] core/tree: places from offsets, settings, refs, layers from the root down, checks; its test
- [x] tests: one per module, at its path
- [x] library/shapes: a product as parts in its own axes (`shapeOf`), materials by key or `metal` (Finish); its test

## Next
- [ ] the tree of objects in the data: by where a thing stands or hangs (floor → wall → cabinet → front; sink on a carcass); siblings under their group when neither holds the other
- [ ] the layers: in the tree's nodes (the library knows none); the panel's tree from the data; a WC frame's parts behind the casing (Installations): their own node
- [ ] the building's data from `analysis.md`: Ground Floor / First Floor / Attic, each from its slab; offsets from the parent; ids
- [ ] the scene (three.js): one tree; each leaf's parts (types.js: Part), placed by the tree, its look by material; makers before it: walls with their openings, the cabinets' engine; the granite's speckle
- [ ] the rooms: cabinets, tiles, fittings (room ids as archon's); the hardware, the kitchen tap, the trap, lamps (pendant, downlight)
- [ ] 2D: plans and dimensions
- [ ] Documents
- [ ] Cabinet mode
- [ ] Finish: metal, boards, floor tiles
- [ ] moving parts: doors, fronts, windows
- [ ] cameras, sun, walk
- [ ] docs: the physical rules (cabinets, tiles, products); `project.svg`, `flow.svg`, `types.svg`
