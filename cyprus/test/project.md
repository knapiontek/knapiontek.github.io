# test

Open `index.html` over HTTP. One test per module, at the module's own path; each runs in a worker of its own.

| File | What |
|---|---|
| `index.html`, `index.js` | the test page (Alpine): every test, OK or what failed |
| `worker.js` | the worker one test runs in |
| `core/geometry.js` | `core/geometry.js` by examples: a wall as a prism cut by the roof, less its window, the EPS split between the floors; polygons clipped, intersected, subtracted; rectangles; the compass sides (x East, y North) |
| `core/surfaces.js` | `core/surfaces.js` by examples: one box (six faces, eight welded corners); two boxes of one group (the joint gone) or two (a contact piece each side, raw); a small box on a big one (no T-junctions); a face's material by its side; the welding |
| `core/hierarchy.js` | `core/hierarchy.js` by use cases: the house built from the root down (the model, a room, its cabinets, the library's sink); where a thing is (cabinets by each wall, quarter turns); the panel (layer, floor); Finish (a setting from above); Documents (every element, its refs); the test (what to correct, what to know): every call in one |
| `core/tools.js` | `core/tools.js`: `fmt`; the design's axes to the model's: a point, a box, a section (its sense kept), a cylinder, a mesh, a shape's turns, lights and envelopes; the mirror its own inverse |
| `library/catalog.js` | `library/catalog.js`: every call, unknown keys, frozen data, a texture read once, every file against its type; then a board for an estimate, a tap's metals, a tile and its texture, a 2D fill |
| `library/shapes.js` | `library/shapes.js`: every product with a drawing, its parts sound; an oven, a microwave, a basin tap, a shower screen, a WC bowl, a pipe; then the API by use cases, as a room asks for it (a product checked, a door hung, a drawer of a system, runners, a pull-out shelf, a sink with its tap and trap, a basin, boards and tiles, a fixture): every exported function in one |
| `settings.js` | `index.json`, the app's settings: its layers (the blocks, each layer's form, every key once, the three floors; a hierarchy with a layer or a floor the file has not); its view (edges in their layer, the cameras of the house and its floors, the plans) |
| `house/assembly.js` | `house/assembly.js` and `model.json`: the site at the root, the hierarchy sound, every layer and floor in `index.json`, every type known; the layer and floor of a wall, a window, a door, the ceiling, a roof window; the house in its axes against `archon/analysis.md` (walls, openings, slab, chimney, footings, soffit, doors, roof, finishes, site); its parts (materials known, the wall less its window, the ridge, the knee wall under the roof, the EPS split, an inner door on its hinge); the rooms and their m² |
| `room/cabinets.js` | `room/cabinets.js` by use cases, on the kitchen's file: read and laid out; the tree the scene hangs (a carcass under the worktop or the plasterboard over it); the model's axes; the boards the maker cuts; the appliances in their places; what goes inside (the hardware as the library's products, their holes); the same file, the same nodes; the designer's mistakes (what stops the build, what is skipped) |
| `room/assembly.js` | `room/assembly.js` and `room_356.scene.json`, as the house assembles them: the groups under room 356, each at its wall by its turn, in the house's axes; K11's box; the room's metal and floor for what stands in it |
| `room/tiles.js` | `room/tiles.js` by use cases: a floor of whole tiles, laid from a point inside it, rows shifted, along y, a small cut, an L, the floor into the doors, a bathroom's walls round an L and a wall's face less its door: every exported function in one |
| `view3d.js` | `view3d.js` without a canvas (the scene only): our axes as three's (h up), two boxes welded (the joint gone, no line on the seam) or of two groups (a contact piece, raw); the house drawn, in its axes and three's, a material's look, a prism's faces; layers, floors, the Attic with the roof, the facade, edges switched; the cameras, the site; a product by its shape, in the fittings' metal, and none without it |

An API's test reads as its use cases: what a caller does, in the order it does it, each step checked; at its end, that every exported function is in one. A test's default export gets `check(what, ok)`. What the module imports and exports is left to ES modules and `tsc`.
