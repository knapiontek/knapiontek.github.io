# Home

The house "Dom w papawerach 5 (G)" (archon.pl), as built, with everything in it: building, kitchen, bathrooms, wardrobes. One page shows the whole house or some of its rooms in 3D, 2D, Documents and Cabinets.

## Folders

| Folder / file | Holds |
|---|---|
| index.html, index.js | the page: its screen; its code, which makes every module and puts a view together |
| house/ | the house: its data (house.js), its model, its plan and its Documents |
| room/ | what is inside a room: its model, its parts, cabinets, tiles, Documents, the cabinet design; the rooms' data, `<id>.<role>.js` |
| core/ | shared code, no project: loader, geometry, tree, parts, faces, 3D, 2D, sheets, screen |
| library/ | the outside world: products, shops, materials, textures (data); the catalog; the products' shapes |
| archon/ | archon.pl drawings and their analysis: the source of the house |
| test/ | each file's test at its path under test/, and examples (test/test.md) |
| jsconfig.json, globals.d.ts | the type check; loaded by no page |
| project.svg | every file and what it needs (generated from the code) |

## The page

- A view: the whole house (House) or some rooms (Room, `?room=room_356`, `?room=bathroom_7,bathroom_5`). Another view, Back/Forward and a change of Finish rebuild it in the same scene, without reloading.
- Modes: 3D, 2D, Documents (the last sheet: Test), Cabinets (room/design.js: a room's cabinets file as tables, its fronts drawn; Import, Export, Show in 3D).
- A view is a list of parts: the house's (walls, slabs, roof, windows, doors) and each room's (cabinets, products, tiles, lamps). 3D shows the list; a room's view hides what stands between the camera and the room (a wall, the floor from below), and with it whatever lies on it (its tiles).

## How it fits together

```
house/house.js ─► house/model.js ─────────────────┐
room/<id>.*.js ─► room/model.js ─► room/parts.js ─┼─► index.js ─► core/scene.js (3D), core/plan2d.js (2D), core/sheet.js (Documents)
library/       ─► library/catalog.js ─────────────┘
```

- One way: house → room → core, library. core knows no project; library knows no house.
- **Modules** load nothing; their data comes as arguments. The page loads the data (core/load.js).
- A **model** computes without a browser; **parts** (core/parts.js) are data: solids, moving parts, details, lamps. Only core/scene.js knows three.js.

## Data

- A data file is pure JSON in `HOME.data(…)` (a .js file, so the page works opened from disk): no code, no comments, never touched by code.
- It starts with `format` and `version`; core/load.js checks both. The version rises only when an old file would be read wrongly; then the files are rewritten, no converters.
- Every list is in data (a static site cannot list a folder): the house lists its rooms, the library its product groups.

## Tree and coordinates

- One coordinate system, the house's: x along the house (grows west), y across (grows south), h up; mm.
- A node: `id`, `name`, `type`, `offset`, `size`, `settings`, `refs`, `children` (core/project.md). Placed by its offset from its parent's corner; no rotations, except a furniture group, turned to face its side.
- A node's zero is its own left-back-bottom corner. The site's: the lawn's corner; the house's: its extreme corner. The one negative number: the house's h in the site.
- The tree says what belongs to what (a window to its wall, a tap to its carcass), not what lies inside what.
- Sides by the compass: `E` (garden), `W` (entrance), `N` (garage window), `S` (bathrooms).
- An id is never changed or reused; the path of ids is a node's identifier; a node refers to another only by path, in `refs`.
- Settings cascade down the tree: a node's value is the default for its branch. The house is the root.

## Who decides what

| Values | Decided by | Where |
|---|---|---|
| house settings | the owner | the house's root node |
| lower settings | the designer | a room, group, cabinet, product or surface |
| maker's data | the maker | library/products |
| shapes the maker does not give | the code | library/shapes.js |

**A node** says where (its box) and what (its type; a bought thing, its product key), never its shape. Nothing is drawn without its node; every node is drawn or holds others (Test checks both).

| What | Its parts made by |
|---|---|
| house element, opening, stair, roof | house/model.js |
| board, front, worktop, plinth | room/furniture.js, from room/cabinets.js |
| product (appliance, sanitary, hardware) | library/shapes.js |
| tiles (a room's walls and floor, a floor's layout) | room/tiles.js |

## Language

English everywhere: pages, Documents, MD files, code, data; proper names as given. Translations when needed, not kept.

## To do

1. **Worktop and end-panel lengths** as bought: the owner gives them; the design shows ? until then.
2. **Types**: still loose (`any`): the products' group fields, the cabinets file's settings, the Alpine parts.
3. **The 2D plan**: house/plan.js draws the whole house and a room's view; where it belongs (index.js, core/plan2d.js taking only what is cut).
4. **index.js**: the 3D view (hiding, lights, walk) is still in it.

## How we work

- An MD file changes only when we agree; the owner approves, then the work starts.
- The LLM works on its own copy, writes changed files back, and gives the `git rm` command for files to remove.
- After every change: the tests (test/test.md); the look unchanged unless intended; every difference explained.

## Code style

- **Modules**: a code file is one constructor named by its path (core/plan2d.js → `corePlan2dModule`), getting what it needs as parameters and giving back its public API; nothing else is global, no `HOME` inside. index.js makes every module in its first lines: the map of what needs what (project.svg).
- **Tests**: each file's test builds it from its constructor and checks its public API on a clean slate; examples check files working together (test/test.md).
- **Types**: JSDoc, checked (`tsc -p jsconfig.json`); every code file starts with `// @ts-check`; a module's interface is taken from its code (`ReturnType<typeof …Module>`).
- **Few files**: short code that belongs to no file stays where it is used (index.js) or goes to core/tools.js; a new file only when it has a clear role.
- **No hidden rules**: what is built follows from data, never from names or sizes. No duplicated code or values; no dead code.
- **Screen** (Alpine.js): one Alpine part per page (core/ui.js); shared pieces written once in core; one ui.css. The panel holds settings; results go to Documents.
- **Pinned libraries**: three.js r128, SheetJS 0.18.5, Alpine.js 3.14.1.
- **MD files**: short, for a person: what each file is for and its data formats; no function names. Comments: short, only what the code does not say.
