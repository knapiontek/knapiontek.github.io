# To do

By the plan, one step at a time; each module: its API and samples first, then the code.

## Done
- [x] UI sketch on Alpine: nav (House, floors, rooms), modes, View / Finish, layers tree, dock, sun, help, light / dark
- [x] archon: drawings in English, `analysis.md` read again: x East, y South, h up; assumptions (§ 12), as built (§ 13)
- [x] library: products, materials, shops, textures as JSON; `openCatalog`; its test and sample
- [x] ES modules, Caddy, `types.js`, the test page
- [x] core/tree: places from offsets, settings, refs, layers from the root down, checks; its test and sample

## Next
- [ ] library: the shape of a product (`shape`) as the scene takes it; a product's kind, for its layer
- [ ] the tree of objects in the data: by where a thing stands or hangs (floor → wall → cabinet → front; sink on a carcass); siblings under their group when neither holds the other
- [ ] the layers: Floors from the tree; Construction and Interiors from each element's type; the panel's tree from the data
- [ ] the building's data from `analysis.md`: Ground Floor / First Floor / Attic, each from its slab; offsets from the parent; ids
- [ ] the scene (three.js): the three sources (building, cabinets, library) as one kind of node
- [ ] the rooms: cabinets, tiles, fittings (room ids as archon's)
- [ ] 2D: plans and dimensions
- [ ] Documents
- [ ] Cabinet mode
- [ ] Finish: metal, boards, floor tiles
- [ ] moving parts: doors, fronts, windows
- [ ] cameras, sun, walk
- [ ] docs: the physical rules (cabinets, tiles, products); `project.svg`, `flow.svg`, `types.svg`
