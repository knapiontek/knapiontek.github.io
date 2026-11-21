# Plan

What we are changing, in order. The owner decides; the LLM keeps this file up to date (a step done is marked, then dropped once the next one starts).

## The goal

- No global `HOME`. Each file is one constructor, `<name>Module(...)`, that gets what it needs as its parameters and gives back its public API. Nothing else in the file is global.
- The page puts the application together in one place, at the top of index.js, on local variables:

  ```js
  const geometry = geometryModule();
  const format = formatModule();
  const plan2d = plan2dModule(geometry, format);
  ```

  These lines are the whole map of what needs what.
- A file's test (test/<its path>) builds it the same way and checks its public API. The owner reads the test and accepts the API, or not.
- Later: one drawing engine. The engines (the house, the cabinets, the tiles) give a description of what is drawn (solids, details, moving parts, lamps), as data; one engine turns any description into 3D (core/scene.js with the products' shapes, library/draw.js), plan2d into 2D.

## The limit

The page runs from disk (file://): no JavaScript modules (`import`). A script's top-level function is global, so each file leaves exactly one global: its constructor.

## The rules of a step

- One file at a time, from the bottom up: core, then the engines, then the screen, index.js last.
- Inside a constructor no `HOME`: only its parameters and JavaScript itself. Until every file is done, the last line of a file joins it to the page: `HOME.plan2d = plan2dModule(HOME.geometry, HOME.format);`. When all are done these lines and `HOME` go.
- Before and after each step the LLM's tests (test/test.md): everything the same.
- Each step ends with test/index.html: the file's row OK.

## Steps

1. **Done** (20 Nov 2026): core/format.js (new: how numbers are written, en-GB everywhere); core/plan2d.js gets geometry and format (meshShape, the footprint of a three.js mesh, goes to room/room.js: its only caller, on the 3D side). The files already pure get their dependencies as parameters too: core/geometry.js, core/tree.js, core/surface.js, room/tiles.js, house/model.js. The tests build each file from its constructor; GETS went.
2. **Next**: core/estimate.js: gets the sheet's helpers it uses, or they move (to decide).
3. The screen: core/ui.js, core/sheet.js, core/scene.js, core/load.js, core/library.js.
4. The engines: room/cabinets.js (its drawing out of it, see 6), room/room.js, room/docs.js, library/draw.js.
5. index.js: the application put together on local variables; `HOME` and globals.d.ts go.
6. The drawing engine: the format of a description; cabinets give a description instead of drawing; the house draws nothing that is a room's.
7. The files' names and places.

## Open

- The data files start with `HOME.data(` (the only way to load data from disk without a server). Keep that name as the one data channel (core/load.js), or change the first word of all 41 files (their JSON untouched)?
