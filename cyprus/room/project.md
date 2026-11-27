# room

What stands in the rooms. A room's things know nothing of the house; its scene says where they stand.

| File | What |
|---|---|
| `<room>.cabinets.json` | the designer's cabinets for the maker (format `cabinets`, version 1): `materials` (a part's kind → a board of the library), `settings` (how they are built; `hardware`, `appliances`, `installation`, `hardwareLayout`; `carcass.depth`, `carcass.offset`), `groups` (columns; a group's own `carcass`), `components` (stacked in their columns), `notes` (the designer's) |
| `<room>.scene.json` | where the room's things stand (format `scene`, version 1): `cabinets` (a group → `front`, the way its fronts face, and `offset`, its zero in the room's axes), `metal` (the room's one metal) |
| `cabinets.js` | the engine: `cabinetsOf(file, catalog)` → `{ groups, layout, problems }`: the layout (columns, the stack, carcasses, their kinds), the tree in the model's axes; a fault in the materials, settings or groups throws, one in a component is a problem |
| `assembly.js` | `assembleRooms(hierarchy, catalog)`: each room with a scene (its node's `files`): its cabinets built and placed under it, the scene's `metal` its setting; the cabinets' problems by room |

## Axes

- **The design's** (the files, as the maker measures): per group, zero at the wall (an island: the back of its worktop), at its left end as one sees the fronts, on the floor; x from the left, y from the wall toward the fronts, h up. Left-handed.
- **The model's** (the nodes): the same, y the other way (`core/tools.js`): the cabinets at negative y. A node's zero at its back, left, bottom; its size to its opposite corner.
- **In the room:** the scene's `offset` is the group's zero, always the wall line, never a carcass's back; `front` gives its quarter turn: S 0, E 1, N 2, W 3.

## The tree

A group → what runs along it (worktop, end panels, wall panel, plasterboard, strips, plinth, front panels, an island's back panel) → the carcasses under the worktop, else the plasterboard over their columns, else the group, measured from it (`carcass.offset`) → their modules (cabinet, drawer, oven, microwave) and front panels. A dishwasher's bay in the row. Spaces build nothing (stage 3: an inset panel). A group knows no other: where it meets one, its spaces stand in for it.
