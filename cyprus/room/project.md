# room

What stands in the rooms. A room's things know nothing of the house; its scene says where they stand.

| File | What |
|---|---|
| `<room>.cabinets.json` | the designer's cabinets for the maker (format `cabinets`, version 1): `materials` (a part's kind → a board of the library), `settings` (how they are built; `hardware`, `appliances`, `installation`, `hardwareLayout`; `carcass.depth`, `carcass.offset`), `groups` (columns; a group's own `carcass`), `components` (stacked in their columns), `notes` (the designer's) |
| `<room>.scene.json` | where the room's things stand (format `scene`, version 1): `cabinets` (a group → `front`, the way its fronts face, and `offset`, its zero in the room's axes), `fixtures` (an id → `product`, `front`, `offset`, `layer`; `depth`, `length`, `height`: as it is built here), `builtIns` (`name`, `box`, `cuts`, `material`: what the owner builds), `lamps` (an id → `kind` downlight or pendant, `at` [x, y]; a pendant's `bottom`), `metal` (the room's one metal), `tiles` (`floor`, `walls`: each its `product`, `size` (one of its formats; none: its own), `depth`, `dir` x or y, `pattern`, `offset` (the point it is laid from in every direction: the floor [x, y], the walls [x, y, h]) and `grout`, its colour). A room with no scene is empty: no tiles. The tiles end at the middle of the door |
| `cabinets.js` | the engine: `cabinetsOf(file, catalog)` → `{ groups, layout, problems }`: the layout (columns, the stack, carcasses, their kinds), the tree in the model's axes; a fault in the materials, settings or groups throws, one in a component is a problem |
| `assembly.js` | `assembleRooms(hierarchy, catalog)`: each room with a scene (its node's `files`): its cabinets built and placed under it, its fixtures and built-ins, the scene's `metal` its setting, its `tiles` checked (`tilesFaults`) and kept on the room's node; a hood's chimney to the ceiling; the cabinets' problems by room |

## Axes

- **The design's** (the files, as the maker measures): per group, zero at the wall (an island: the back of its worktop), at its left end as one sees the fronts, on the floor; x from the left, y from the wall toward the fronts, h up. Left-handed.
- **The model's** (the nodes): the same, y the other way (`core/tools.js`): the cabinets at negative y. A node's zero at its back, left, bottom; its size to its opposite corner.
- **In the room:** the scene's `offset` is the group's zero, always the wall line, never a carcass's back; `front` gives its quarter turn: S 0, E 1, N 2, W 3.

## The tree

A group → what runs along it (worktop, end panels, wall panel, plasterboard, strips, plinth, front panels, an island's back panel) → the carcasses under the worktop, else the plasterboard over their columns, else the group, measured from it (`carcass.offset`) → their modules (cabinet, drawer, oven, microwave) and front panels. A dishwasher's bay in the row. A space at a carcass's end: an inset panel in it.

Each node carries its bodies (`parts`, boxes in its axes): a carcass its boards (layers `boards`, `backs`, `shelves`), a module its front (`doorsAndDrawers`; a shaker's frame round a recessed panel), the rest its own board. Their material: `board:` and the board's key; the scene gives it the board's look. A group knows no other: where it meets one, its spaces stand in for it.
