# Plan

What we are changing, in order. The owner decides; the LLM keeps this file up to date (a step done is marked, then dropped once the next one starts).

## The goal

- No global `HOME`. Each file is one constructor, `<name>Module(...)`, that gets what it needs as its parameters and gives back its public API. Nothing else in the file is global.
- The page puts the application together in one place, at the top of index.js, on local variables:

  ```js
  const geometry = geometryModule();
  const tools = toolsModule();
  const plan2d = plan2dModule(geometry, tools);
  ```

  These lines are the whole map of what needs what.
- A file's test (test/<its path>) builds it the same way and checks its public API. The owner reads the test and accepts the API, or not.
- Later: one drawing engine. The engines (the house, the cabinets, the tiles) give a description of what is drawn (solids, details, moving parts, lamps), as data; one engine turns any description into 3D (core/scene.js with the products' shapes, library/draw.js), plan2d into 2D.

## The limit

The page runs from disk (file://): no JavaScript modules (`import`). A script's top-level function is global, so each file leaves exactly one global: its constructor.

## The rules of a step

- One file at a time, from the bottom up: core, then the engines, then the screen, index.js last.
- Inside a constructor no `HOME`: only its parameters and JavaScript itself. Until every file is done, the last line of a file joins it to the page: `HOME.plan2d = plan2dModule(HOME.geometry, HOME.tools);`. When all are done these lines and `HOME` go.
- Before and after each step the LLM's tests (test/test.md): everything the same.
- Each step ends with test/index.html: the file's row OK.

## Steps

Done: core/geometry, tree, surface, plan2d, house/model, room/tiles get what they need as parameters; core/tools.js (short pieces of no one file: numbers, a sheet's rows and columns; was format.js); core/estimate.js gets tools (21 Nov 2026).

1. **Now**: the library in its own folder: core/library.js goes to library/catalog.js, which alone knows the library's files and serves products, materials, shops, textures by key. core/load.js only loads a data file by its path; a file's path is known by its folder (the library's by the catalog, the house's and the rooms' by the page).
2. The screen: core/ui.js, core/sheet.js, core/scene.js, core/load.js.
3. The engines: room/room.js, room/docs.js; the page asks the catalog (a product, a material) instead of reading the library's groups.
4. index.js: the application put together on local variables; `HOME` and globals.d.ts go.
5. The drawing engine. The engines give a description, as data, and draw nothing: exact solids (prisms of core/geometry.js: walls, boards, carcasses; counted, in the 2D plan, never sharing volume), details (look only: a cylinder, a turned shape, an extruded profile, a sphere; a shape, a material, a place), moving parts, lamps. One engine turns a description into 3D (core/scene.js, the only file with three.js), plan2d into 2D. First the format of a description, then: library/draw.js (a product and its place in, its description out), room/cabinets.js (its drawing out of it), the house (it draws nothing that is a room's).
6. The files' names and places.

## Kept

- core/tools.js gathers short pieces that belong to no one file, so the map of files stays simple; a piece goes there rather than into a file of its own.
- The data files keep their first word, `HOME.data(` (data from disk without a server; the files are never touched). At the end `HOME` is only that: the data channel of core/load.js.
