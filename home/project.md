# Home

The house "Dom w papawerach 5 (G)" (archon.pl), as built, with everything in it: building, kitchen, bathrooms, wardrobes. One page shows the whole house or a part of it (one or more rooms) in 3D, 2D, Documents and Cabinets.

## Folders

| Folder / file | Holds |
|---|---|
| index.html, index.js | the application: one page (index.html: its screen; index.js: its logic) |
| house/ | the house: its data and its model; passes a room down |
| room/ | the room engine: a room from the house and its own data files (cabinets, products, tiles, Documents); the rooms' data, `<kind>_<number>.<role>.js` |
| core/ | shared code, no project: loader, tree, geometry, surfaces, 3D, 2D, sheets, screen |
| library/ | the outside world: products, shops, materials, textures (data); how a product is drawn (shapes.js) |
| archon/ | archon.pl drawings and their analysis: the source of the house |
| jsconfig.json, globals.d.ts | the type check (Code style); loaded by no page |
| test/ | the tests, each file's test at its path under test/ (test/test.md) |
| project.svg | every file and what it needs, data files marked JSON (generated from the code, not drawn) |

## The application (index.html, index.js)

- Loaded once. A view: the whole house (House) or a part (Room, `?room=room_356`, `?room=bathroom_7,bathroom_5`). A link to another view, Back/Forward and a change of Finish rebuild the view in the same scene, without reloading.
- Modes: 3D, 2D, Documents (last sheet: Test), Cabinets.
- **Cabinets** (the cabinet design, room/design.js): the active room's cabinets file as tables (groups, columns, components, notes; materials read-only, with their size as bought), its elevations drawn, each part in its material's colour. Panel: the part under the cursor, the data's problems. Import, Export (written as the files are), Show in 3D (replaces the room's file until the page is reloaded; needs the room's scene), Back to the file. A room without a cabinets file starts empty, with the first furnished room's settings. Edited tables stay while the page is open.

## Dependencies

```
house/  ──►  room/  ──►  core/, library/
```

- One way only. The house passes a room and its settings down; the room engine passes each node to the module of its type.
- **Modules** load nothing: their data comes as arguments. **Pages** load data.
- core knows no project and no product; library knows no project.
- Chain: node ─► module of its type (house, cabinets, products, tiles) ─► solids and parts (core/parts.js) ─► core/faces.js ─► scene.js (3D, the only file with three.js), plan2d.js (2D); counts ─► sheet.js (Documents).

## Data

- A data file is pure JSON passed to `HOME.data(…)` (named .js so pages work opened from disk); nothing else in it: no code, no comments.
- It starts with `format` and `version`. A page loads it through core/load.js, naming the format and version it knows; any other is an error naming the file and both versions. The version rises only when an old file would be read wrongly; the LLM then rewrites those files, the owner checks them. No converters.
- `format`: files only; `type`: nodes only.
- Data is loaded by its path through core/load.js (the folder that has a file knows its path: the library's, library/catalog.js; the house's and the rooms', the page); code is loaded statically by the page.
- A static site cannot list a folder: every list is in data (the house lists its rooms, the library its product groups).

## Tree and coordinates

- One coordinate system, the house's: x along the house (grows west), y across (grows south), h up; mm.
- One kind of node: `id`, `name`, `type`, `offset`, `size`, `settings`, `refs`, `children` (core/project.md). Placed by translation only: offset from the parent's origin, size > 0. No rotations, no direction signs; exception: a furniture group, turned a quarter (with a mirror) to face its side.
- **No absolute zero**: a node's zero is its own left-back-bottom corner; its contents lie at positive numbers. The site's zero: the lawn's corner. The house's zero: its extreme corner (wings, insulation, footings). The one negative number: the house's h in the site (below the lawn).
- **The tree says what belongs to what, not what lies inside what**: a window belongs to its wall, a tap to its carcass. A child may stand outside its parent.
- Sides by the compass: `E` (garden), `W` (entrance), `N` (garage window), `S` (bathrooms); `down`: under the floor. Defined once, in core/geometry.js.
- An id is given once, never changed or reused; the path of ids from the root is a node's global identifier. A node refers to others only by path, in `refs`; Test checks each.
- Settings cascade down the tree: a value on a node is the default for its branch; a lower node overrides it. The house is the cascade's root.

## Who decides what

| Values | Decided by | Where |
|---|---|---|
| house settings | the owner, for every room | the house's root node |
| lower settings | the designer, for a room, group, cabinet, product or surface | that node |
| maker's data | the maker | library/products |
| shapes the maker does not give | the code | library/shapes.js |

## Data, tree, drawing

Kept apart: **data** says what is decided; the **tree** holds every thing, each in its place; the **drawing** makes each thing's solids.

| Data | Says | Where |
|---|---|---|
| the house | elements (walls, slabs, ring beams, insulation, roof), openings, rooms, floors, settings | house/house.js (a tree) |
| a room's furniture | groups, carcasses, fronts, worktop, products | room/`<id>`.cabinets.js |
| a room's scene | where each group and fixture stands, its front side; finish, lights, tiles, cameras | room/`<id>`.scene.js |
| a room's Documents | what the model and library do not say | room/`<id>`.docs.js |
| products | sizes, holes, connections, price | library/products |

**The tree**: site → house → floor → wall → opening; floor → room → group → carcass → board, front → hinge. The house's part is its data. A room's part is built by the room engine; what follows from a rule (a board's size) is computed into the tree, never written in data. 3D, 2D, Documents and Test read the tree.

**A node** says *where* (offset, size: its box) and *what* (type; for a bought thing, the product key). Never its shape; never the product's data.

| Type | Drawn by | How |
|---|---|---|
| house element (block, slab, ring beam, EPS, roof) | house/model.js | prism filling the box, openings cut out |
| opening (door, window, roof window) | library, as a product | in the box; the house only cuts the hole |
| room surface (tiles) | room/tiles.js | tiles over the box |
| board (carcass part, front panel, worktop, plinth, strip, panel) | room/cabinets.js | box with decor, edges, holes |
| product (appliance, sanitary, hardware) | library/shapes.js | from the product's data, from the node's zero |
| container (assembly, floor, room, group, carcass, drawer) | — | only its contents |

Each solid is moved to its node: offsets summed up the tree; a group facing another side gets the quarter turn.

**Rule**: nothing is drawn without its node; every node is a drawn type or a container (Test checks both). So the tree can be checked (every solid in its node), counted (cut list from board nodes, bill from product nodes) and cut (2D) without knowing shapes.

## Language

- English everywhere: pages, Documents, MD files, code, data. Proper names as given (a product's shop name).
- Documents are our own format (the cut list too).
- Translations: made by the LLM when needed, not kept.

## To do

1. **Worktop and end-panel lengths** as bought: the owner gives them; the design shows ? until then.
2. **Types**: still loose (`any`): the products' group fields, the cabinets file's settings, a drawing's place, the Alpine parts.
3. **index.js, split**: the house's view (3D: solids, objects hiding, lights, walk), the finish (a metal or a decor swapped; a query of the catalog: the same product in another metal), each to its own file.

## How we work

- Every MD file: the LLM asks before changing it. We agree; the LLM writes it in the MD; the owner approves; then the work starts.
- The LLM works on its own copy, compares it with the owner's folder before starting, and writes changed files back. It cannot delete: it gives the `git rm` command.
- After every change: test/test.md's tests; every view and mode without errors; Documents, 2D and the look unchanged unless intended. Every difference explained.
- End of session: what is left goes to To do; what is done is in git.

## Code style

- **MD files**: short, for a person: what each file is for, what it must keep. A folder's project.md describes its files and data formats field by field; no function names.
- **Comments**: short, exact, only what the code does not say.
- **Design level**: the room in space, every object where it stands (bought, cut, made by the owner). Not the installer's level (pipes, sockets, cables, fitting steps); what places things stays (riser, WC frame).
- **Panel**: settings only (layers, a tile, a pattern); results (areas, counts, costs) go to Documents.
- **Types** (JSDoc, checked): the contract of every module: a typedef for each data shape (in the file that reads or makes it), `@param` and `@returns` on what a module gives, so a call from another file is checked. Every code file starts with `// @ts-check`; a module is one function that returns what it gives, so its interface is taken from its code (`ReturnType<typeof <name>Module>`; no type is written twice). Check: `tsc --noEmit -p home/jsconfig.json`, clean before handing over; nothing is built, pages load plain JavaScript. jsconfig.json lists the checked files (strictNullChecks); globals.d.ts also declares the outside globals (three.js, Alpine.js, SheetJS). Not checked: inline page scripts, data files.
- **Modules**: a code file is one constructor, `<name>Module(...)`, its name the file's path (core/plan2d.js → `corePlan2dModule`, room/docs.js → `roomDocsModule`; so two folders may hold files of one name): it gets what it needs as its parameters and gives back its public API; nothing else in the file is global, no `HOME` inside. The page runs from disk (no `import`), so a file's constructor is its one global name. index.js makes every module in its first lines: the map of what needs what (project.svg is drawn from them).
- **Public API**: each file's test (test/<its path>) builds it from its constructor and checks its public API, on a clean slate (test/test.md); the owner reads it and accepts it.
- **Parts**: an engine gives what is shown as parts, data (core/parts.js: solids, details, moving parts, lamps); core/scene.js, the only file with three.js, shows them; plan2d.js the 2D.
- **Short pieces** that belong to no one file go to core/tools.js, not to a file of their own.
- **Data channel**: the data files start with `HOME.data(` and are never touched; `HOME` is only that (core/load.js: `data`, `load`).
- **Computing without the browser**: a module computes without DOM or WebGL and touches nothing when loaded; the browser only for drawing, the screen, loading scripts. Tests run in Node first.
- **No hidden rules**: what is built follows from data (types, settings), never from names, labels or sizes. No duplicated values or code: what pages share lives in core. No dead code: what nothing uses is removed.
- **Script order** in a page: core/load.js first (the data channel, `HOME`), the page's own code last (it makes every module from its constructor); a code file between only defines its constructor, so their order is free.
- **Pinned libraries**: three.js r128, SheetJS 0.18.5, Alpine.js 3.14.1.
- **Screen (Alpine.js)**: a page is one Alpine part (core/ui.js). Shared pieces (menus, modes, panel, corner, sheets, 2D sheet) are written once in core and put together in the page's HTML (`<template x-part="…">`); the page writes only its own (view, help, panel sections). State is reactive and kept in the browser; the screen follows it. One ui.css, no page styles. Modules compute without Alpine.
- Readable: consistent indentation, short functions, one idea per line, names as on the page. No abbreviations to decode (counters and coordinates excepted).
- A list holds values of one type and meaning.
