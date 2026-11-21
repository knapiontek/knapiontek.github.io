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
- Inside a constructor no `HOME`: only its parameters and JavaScript itself.
- Before and after each step the LLM's tests (test/test.md): everything the same.
- Each step ends with test/index.html: the file's row OK.

## Steps

Done (21 Nov 2026): no file reaches another but through its constructor's parameters; index.js makes every module in its first lines (the map of what needs what); `HOME` is only the data channel of core/load.js (`data`, `load`); globals.d.ts declares only that and what comes from outside (three.js, Alpine, XLSX). Every row of test/index.html is OK.

1. **Done** (21 Nov 2026): the drawing engine. core/describe.js (a description as data) and core/scene.js `show()` (the only file with three.js, the same pixels); room/room.js, library/draw.js and the new room/furniture.js (the cabinets described, out of the engine) describe; room/cabinets.js is the engine alone and gets nothing. The house's solids and doors go to core/scene.js as data already (cells, a door's moving part).
2. index.js, split: the cabinet editor, the house's Documents, the finish (a metal or a decor swapped; a query of the catalog: the same product in another metal), each to its own file.
3. **Next**: the files' names and places (proposed: core/surface.js → faces.js, core/describe.js → drawing.js, library/draw.js → shapes.js; to agree).

## Kept

- core/tools.js gathers short pieces that belong to no one file, so the map of files stays simple; a piece goes there rather than into a file of its own.
- The data files keep their first word, `HOME.data(` (data from disk without a server; the files are never touched). At the end `HOME` is only that: the data channel of core/load.js.
