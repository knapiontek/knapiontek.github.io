# house

The site and the house as built: their data (`model.json`) and how it becomes the hierarchy (`build.js`). The data comes from the
prototype (`home.proto/house/house.js`); the house's own axes are `archon/analysis.md`'s: x East, y South, h up, zero at its
front-left corner at ±0.00; the house stands on the site by its offset. Checked against `analysis.md` (`test/house/build.js`).

| File | What |
|---|---|
| `model.json` | format `house`, version 1; the root is the site (its lawn, its surfaces), the house on it; the house's branches: `foundation`, `groundFloor`, `firstFloor`, `facade`, `roof`, `stair`; a wall's openings are its children; the rooms are places in their floor (`area`: their floor, rectangles in their own axes) |
| `build.js` | `buildHouse()`: `model.json` as a hierarchy (`core/hierarchy.js`); a node without its own `layer` or `floor` takes its type's |

## model.json

- A node: `id`, `name`, `type`, `offset` (from its parent's corner), `size`; its own fields as its type needs (`outer`, `hinge`, `opens`, `flush`: compass sides N, S, E, W; `top: "roof"`: cut by the roof; `cuts`: the ids it is cut by).
- `geometry` on the house: `types` (a type once: name, material, cap, thickness, `layer`; an element names it by `type`), `frames`, `finishes` (the facade on the EPS), `split` (the h between the floors), `body` (x of the house without its wings), `part`.
- `layer` (what it is) and `floor` (`groundFloor`, `firstFloor` or `attic`): one each; a node's own, or its type's, or else its parent's. A floor node sets its floor; the site its layer; the roof and the stair theirs. A node of `foundation`, `facade`, `roof` or `stair` has no floor of its own: what lies over both floors is split at `split` when drawn.
- Rooms: `number` and `archonArea` as archon gives them; `files`: the prototype's files of the room.
