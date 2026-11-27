# test

Open `index.html` over HTTP. One test per module, at the module's own path; each runs in a worker of its own.

| File | What |
|---|---|
| `index.html`, `index.js` | the test page (Alpine): every test, OK or what failed |
| `worker.js` | the worker one test runs in |
| `core/geometry.js` | `core/geometry.js` by examples: a wall as a prism cut by the roof, less its window, the EPS split between the floors; polygons clipped, intersected, subtracted; rectangles; the compass sides (x East, y North) |
| `core/surfaces.js` | `core/surfaces.js` by examples: one box (six faces, eight welded corners); two boxes of one group (the joint gone) or two (a contact piece each side, raw); a small box on a big one (no T-junctions); a face's material by its side; the welding |
| `core/hierarchy.js` | `core/hierarchy.js`: every call on a small hierarchy, `add`, layer and floor (its own or its parent's), a faulty one; then a piece of the house built from the root down (model, room, cabinets, the sink they need): a sink's place, a window's box, layers, the room's metal, the elements by path |
| `core/tools.js` | `core/tools.js`: `fmt`; the design's axes to the model's: a point, a box, a section (its sense kept), a cylinder, a mesh, a shape's turns, lights and envelopes; the mirror its own inverse |
| `library/catalog.js` | `library/catalog.js`: every call, unknown keys, frozen data, a texture read once, every file against its type; then a board for an estimate, a tap's metals, a tile and its texture, a 2D fill |
| `library/shapes.js` | `library/shapes.js`: every product with a drawing, its parts sound; then an oven, a microwave, a basin tap, a shower screen, a WC bowl, a pipe fitted to its node |
| `settings.js` | `index.json`, the app's settings: its layers (the blocks, each layer's form, every key once, the three floors; a hierarchy with a layer or a floor the file has not); its view (edges in their layer, the cameras of the house and its floors, the plans) |
| `house/assembly.js` | `house/assembly.js` and `model.json`: the site at the root, the hierarchy sound, every layer and floor in `index.json`, every type known; the layer and floor of a wall, a window, a door, the ceiling, a roof window; the house in its axes against `archon/analysis.md` (walls, openings, slab, chimney, footings, soffit, doors, roof, finishes, site); its parts (materials known, the wall less its window, the ridge, the knee wall under the roof, the EPS split, an inner door on its hinge); the rooms and their m² |
| `room/cabinets.js` | `room/cabinets.js` and the kitchen's `room_356.cabinets.json`: no problems; groups, carcasses stacked (K21 on the spaces at 908), their kinds and flags; the tree: a carcass under the worktop or the plasterboard over it, measured from it (offset 28, 14, 310); the model's axes (negative y toward the room, K11 28 – 578 from the wall); a faulty file: what stops it, what is skipped |
| `room/assembly.js` | `room/assembly.js` and `room_356.scene.json`, as the house assembles them: the groups under room 356, each at its wall by its turn, in the house's axes; K11's box; the room's metal and floor for what stands in it |
| `view3d.js` | `view3d.js` without a canvas (the scene only): our axes as three's (h up), two boxes welded (the joint gone, no line on the seam) or of two groups (a contact piece, raw); the house drawn, in its axes and three's, a material's look, a prism's faces; layers, floors, the Attic with the roof, the facade, edges switched; the cameras, the site; a product by its shape, in the fittings' metal, and none without it |

A test's default export gets `check(what, ok)`. What the module imports and exports is left to ES modules and `tsc`.
