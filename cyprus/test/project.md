# test

Open `index.html` over HTTP. One test per module, at the module's own path; each runs in a worker of its own.

| File | What |
|---|---|
| `index.html`, `index.js` | the test page (Alpine): every test, OK or what failed |
| `worker.js` | the worker one test runs in |
| `core/hierarchy.js` | `core/hierarchy.js`: every call on a small hierarchy, `add`, layer and floor (its own or its parent's), a faulty one; then a piece of the house built from the root down (model, room, cabinets, the sink they need): a sink's place, a window's box, layers, the room's metal, the elements by path |
| `library/catalog.js` | `library/catalog.js`: every call, unknown keys, frozen data, a texture read once, every file against its type; then a board for an estimate, a tap's metals, a tile and its texture, a 2D fill |
| `library/shapes.js` | `library/shapes.js`: every product with a drawing, its parts sound; then an oven, a microwave, a basin tap, a shower screen, a WC bowl, a pipe fitted to its node |
| `layers.js` | `layers.json`: the blocks, each layer's form, every key once, the three floors; a hierarchy with a layer or a floor the file has not |
| `house/build.js` | `house/build.js` and `model.json`: the site at the root, the hierarchy sound, every layer and floor in `layers.json`, every type known; the layer and floor of a wall, a window, a door, the ceiling, a roof window; the house in its axes against `archon/analysis.md` (walls, openings, slab, chimney, footings, soffit, doors, roof, finishes, site); the rooms and their m² |

A test's default export gets `check(what, ok)`. What the module imports and exports is left to ES modules and `tsc`.
