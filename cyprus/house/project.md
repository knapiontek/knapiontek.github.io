# house

The site and the house as built: their data (`model.json`) and how it becomes the hierarchy (`assembly.js`). The data comes from the
prototype (`home.proto/house/house.js`); the house's own axes are `archon/analysis.md`'s: x East, y North, h up (right-handed), zero at its
front-right (South-West) corner at ±0.00; the house stands on the site by its offset. Checked against `analysis.md` (`test/house/assembly.js`).

| File | What |
|---|---|
| `model.json` | format `house`, version 1; the root is the site (its lawn, its surfaces), the house on it; the house's branches: `foundation`, `groundFloor`, `firstFloor`, `facade`, `roof`, `stair`; a wall's openings are its children; the rooms are places in their floor (`area`: their floor, rectangles in their own axes) |
| `assembly.js` | `assembleHouse()`: `model.json` as a hierarchy (`core/hierarchy.js`); a node without its own `layer` or `floor` takes its type's; its parts (`shapes.js`); the site's lawn round the house and its surfaces |
| `shapes.js` | `houseShapes()`: what is drawn of the house, as the prototype's `house/model.js` made it: every element a prism cut by the roof, by its `cuts` and by the openings it hosts, split between the floors at `split`, the facade's finishes over its EPS (its raw material with the facade off); the roof's slopes less the chimney and the roof windows; windows and outer doors (frames, glass, leaves), inner doors (frame, leaf and handles on its mover `leaf`); the stair's treads |

## model.json

- A node: `id`, `name`, `type`, `offset` (from its parent's corner), `size`; its own fields as its type needs (`outer`, `hinge`, `opens`, `flush`: compass sides N, S, E, W; `top: "roof"`: cut by the roof; `cuts`: the ids it is cut by).
- `geometry` on the house: `types` (a type once: name, material, cap, thickness, `layer`; an element names it by `type`), `frames`, `finishes` (the facade on the EPS), `split` (the h between the floors), `body` (x of the house without its wings), `part`.
- `layer` (what it is) and `floor` (`groundFloor`, `firstFloor` or `attic`): one each; a node's own, or its type's, or else its parent's. A floor node sets its floor; the site its layer; the roof and the stair theirs; the roof its floor, the Attic (as the prototype's third floor: the roof, its windows, the ceiling). A node of `foundation`, `facade`, `roof` or `stair` has no floor of its own: what lies over both floors is split at `split` when drawn.
- Rooms: `number` and `archonArea` as archon gives them; `files`: the prototype's files of the room.
