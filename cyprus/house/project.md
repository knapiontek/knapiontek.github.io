# house

The house as built: its data (`model.json`) and how it becomes the hierarchy (`build.js`). The data comes from the prototype
(`home.proto/house/house.js`), in this project's axes: x East, y South, h up, zero at the front-left corner at ±0.00
(`archon/analysis.md`); it is checked against `analysis.md` (`test/house/build.js`).

| File | What |
|---|---|
| `model.json` | the house: format `house`, version 1; the root is the house; its branches: `foundation`, `groundFloor`, `firstFloor` (floors: their layer), `facade`, `roof`, `stair`, `site`; a wall's openings are its children; the rooms are places in their floor (`area`: their floor, rectangles in their own axes) |
| `build.js` | `buildHouse()`: `model.json` as a hierarchy (`core/hierarchy.js`); each node takes the layers of its type and of its floor field |

## model.json

- A node: `id`, `name`, `type`, `offset` (from its parent's corner), `size`; its own fields as its type needs (`outer`, `hinge`, `opens`, `flush`: compass sides N, S, E, W; `top: "roof"`: cut by the roof; `cuts`: the ids it is cut by).
- `geometry` on the house: `types` (a type once: name, material, cap, thickness, `layers`; an element names it by `type`), `frames`, `finishes` (the facade on the EPS), `split` (the h between the floors), `body` (x of the house without its wings), `part`.
- Layers: a type's `layers`; a floor's on the floor node; `floor` on a node or a type (the Attic) adds that floor's layer.
- Rooms: `number` and `archonArea` as archon gives them; `files`: the prototype's files of the room.
