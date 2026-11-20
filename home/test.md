# Tests

> **This file is the LLM's.** It is not a description of the project (that is in the project.md files). It is what a new LLM session needs to test the project: how to set up, what to run, what must come out. Nothing of the tests is kept in the repository; the LLM rebuilds its scripts from this file in its own environment. The LLM keeps this file up to date without asking.

## The rule

Before a change, take a baseline of the current state (the snapshots below); after it, run the same and compare. Everything must be the same, or each difference explained to the owner and agreed. A test that fails is never left; a baseline is taken again only after the owner has agreed a difference.

The project's state at the end of the migration (20 Nov 2026) is the reference: its numbers are under "Reference values". The prototype (home.proto/) is no longer compared with: the migration is done and every agreed difference from it is behind us.

## Setup

- **Node** for everything that needs no browser. Load the project's files into a `vm` context with `window` = the context itself; replace `HOME.data` by a function that keeps its argument, then run a data file and read what it gave:

  ```js
  const fs = require('fs'), vm = require('vm'), H = '<path>/home/';
  const w = { console }; w.window = w; vm.createContext(w);
  const run = f => vm.runInContext(fs.readFileSync(H + f, 'utf8'), w, { filename: f });
  w.HOME = {}; let DATA; w.HOME.data = d => { DATA = d; };
  const read = f => { run(f); return DATA; };
  ```

- **The browser**: Playwright (Python) with Chrome, the page opened from disk (`file://…/home/index.html`), as the owner does. Flags: `--use-gl=swiftshader --enable-unsafe-swiftshader --allow-file-access-from-files`; viewport 1400 × 900.
- **The CDN libraries** from npm in a folder of the LLM's own (never in home/), served by intercepting the requests (`page.route('**/*')`, `route.fulfill(path=…)` when the URL ends with):
  - `three.min.js` → three@0.128.0 build/three.min.js
  - `OrbitControls.js` → three@0.128.0 examples/js/controls/OrbitControls.js
  - `xlsx.full.min.js` → xlsx@0.18.5 dist/xlsx.full.min.js
  - `alpinejs@3.14.1/dist/cdn.min.js` → alpinejs@3.14.1 dist/cdn.min.js
  - the Google fonts' CSS: answered with an empty body (an aborted request is a console error).
- **The type check**: `npm i typescript@5` in the LLM's own folder, then `tsc -p home/jsconfig.json`: no error.
- WebGL is software here (SwiftShader), slow: wait for a state, never a fixed time. Ignore "GL Driver Message … GPU stall".
- Every page error and every console error or warning counts as a failure.

## The page (home/index.html + index.js)

- One page, loaded once; views, rooms, modes and Finish change in place. `?room=<id>` opens a room's view (Room); no query, the whole house (House).
- Ready: `window.HOUSE_VIEW` exists and the Alpine state is ready: `document.querySelector(".app")._x_dataStack[0].ready` (call it `A`). `A.loading` is falsy when a rebuild is done.
- What the page keeps in the browser: localStorage `home-house`, JSON `{mode, tab, layers, zoom, room, finish}`. To open a room with a given Finish, set it with `page.add_init_script` before `goto`; to start clean, clear localStorage once (a sessionStorage flag) in an init script.
- The handles a test uses:
  - `HOUSE_VIEW.CHECKS`: the view's checks, `{name, items, info}`; a fault is `items.length && !info`.
  - `HOUSE_VIEW.book().sheets`: the Documents' sheets, `{name, rows: [{kind, cells}]}` (Assembly has another shape: no rows).
  - `A.pick("3d"|"2d"|"documents"|"cabinets")`: the mode; `A.title`, `A.subtitle`: the panel's heading; `#tabs button` visible: View/Finish (3D only).
  - The top-left menu: links in `#nav a` by their text (`House`, `Room`, `7. Bathroom`, …); click them, as the owner does.
- Count the page's `load` events: after any number of switches it must stay 1.

## What to run

### In Node

1. **Every room's model** (`model_snap`): for each of kitchen_6, bathroom_5, bathroom_7, wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6: load core/geometry.js, core/tree.js, room/cabinets.js, room/tiles.js, room/room.js; read the 8 product files of library/products/ into `{products: {group: products}}`; read `room/<id>.cabinets.js` and `room/<id>.scene.js`; the room node is `{offset: [0,0,0], size: [10000,10000,3000]}`, but a bathroom's own `size` and `area` from house/house.js. Then `HOME.room.prepare(node, {cabinets, scene}, library)` and serialise `{model, tree: P.TREE, looks, textures, covered: HOME.cabinets.coveredEdges(model), text: HOME.cabinets.cabinetsText(cabinets)}` (Maps and Sets as arrays, functions as "fn", repeated objects by id, numbers to 0.001). Baseline JSON per room; after a change: the same string.
2. **The house** (`house_same`): load core/geometry.js, core/tree.js, house/model.js; `HOME.model.build(<house.js data>)`. Snapshot, each solid as `element|material|cap|layers|x1|x2|polygon|walkable|floor|finish` (to 0.01 mm, sorted): CELLS, FIXTURES, ROOF_CELLS, STAIR_CELLS, SITE_CELLS; the doors (label, floor, axis, angle, cells, product); every room's `part(id)` (box, cells with their side, objects); BORDERS; FOOTPRINT; `checks()`. After a change: the same, part by part.
3. **The tiles**: for every layout of house.js `settings.tiles`, room/tiles.js on house/model.js: the tiles whole, cut and small cuts, the area, the fitted origin. Baseline, then the same.
4. **core**: every core file but load.js loads; core/test.tree.js's checks give only `outside: x 4200 > 4000`; the sheet evaluator: `ROUNDUP(2*3/4,0)` = 2.
5. **The product library**: every file parses (the text inside `HOME.data(…)` is JSON); every key unique; every `shop` named is in library/shops.js; no price "to check".

### In the browser

6. **Every view loads and passes**: index.html (the house) and `?room=` each of the seven rooms: no errors; every check passes (the house: all but the areas, which are information).
7. **The Documents** of each view: the sheets' names and rows as the baseline (dump every sheet's rows as JSON strings and compare); Save XLSX downloads a workbook with the formulas.
8. **One page, no reload**: the house 3D → a room picked in the menu (the view stays the house, the panel follows) → Room → another room → House → 2D, Documents, Cabinets, back to 3D. After each step: no errors, the checks pass, the heading is the active room and its floor, View/Finish tabs only in 3D, Walk only in House, Documents the current view's own sheets (the house: Rooms, Floor tiles, Doors, Notes, Elements, Test; a room: Estimate, Cut list, Assembly, Notes, Elements, Test). `load` events: 1.
9. **Finish**: per room, a metal (brass, nickel, black) and a board changed: the estimate lists the swapped products (a tap of the family in that metal, the board's banding), the checks name what has no variant; the choice kept after a reload.
10. **Cabinets (the editor)**: pick each of the seven rooms in mode Cabinets: no problem in the data, the drawing filled; Export gives the room's `<id>.cabinets.js` byte for byte. A table edited (bathroom_7: the first column 100 narrower), Show in 3D: its model's group 1 widths 600,600 → 500,600, the mode 3D, the page not reloaded; back to Cabinets: the edits kept; Back to the file: as loaded. A room without a cabinets file (the garage): empty tables, the first furnished room's materials, the panel says so.
11. **Pictures** when a change touches the look: screenshots from the views' cameras before and after, compared side by side (the house from the garden, the kitchen, both bathrooms, a wardrobe from behind; 2D of both floors).
12. **tsc** clean.

After a change of types or comments only: 1, 2 and 12 are enough. After a change of data only (prices, products): 5, 6, 7 for the rooms concerned, 10, 12.

## Reference values (20 Nov 2026)

| View | Sheets (rows) | Checks |
|---|---|---|
| the house | Rooms 22, Floor tiles 13, Doors 16, Notes 9, Elements 135, Test 38 | 18, the areas information |
| kitchen_6 | Estimate 80, Cut list 144, Notes 33, Elements 538, Test 13 | 10, all pass |
| bathroom_5 | Estimate 61, Cut list 33, Notes 12, Elements 71, Test 13 | 10, all pass |
| bathroom_7 | Estimate 55, Cut list 33, Notes 11, Elements 70, Test 13 | 10, all pass |
| wardrobe_3 | Estimate 31, Cut list 64, Notes 14, Elements 307, Test 13 | 10, all pass |
| wardrobe_4 | Estimate 31, Cut list 57, Notes 14, Elements 261, Test 13 | 10, all pass |
| wardrobe_8 | Estimate 31, Cut list 58, Notes 15, Elements 218, Test 13 | 10, all pass |
| bedroom_6 | Estimate 33, Cut list 52, Notes 15, Elements 207, Test 13 | 10, all pass |

- The kitchen: 472 still cells, 33 moving parts with 346 cells; 205 boards, each face's material fixed (decor, decor turned, bare core, banded edge).
- The tiles of bathroom_7: walls 16.33 m² (63 tiles), floor 3.68 (8), the shower's walls 12.75 (28), its floor 0.90 (4). Bathroom_5: walls 17.54 m² (43), floor 6.74 (14), the shower's walls 5.70 (15), its floor 1.00 (4).
- The whole house: 1459 meshes, 1744 draw calls; Open opens 113 moving parts.
- Speed (software WebGL): the house loads in about 2.3 s, a room in about 1.0 s; a view rebuilt in place 0.2–1.1 s.
- Estimates: no price "to check"; only bathroom_5's radiator colour "to choose".
- The heading: always the active room and its floor, e.g. "7. Bathroom · Ground floor"; at first the kitchen.

## Writing into the owner's folder

- Write each batch from a fresh folder (`/mnt/user-data/outputs/syncN/`): a staged path used before may carry its older content.
- After every write, list the owner's folder and compare each file's size with this copy; when in doubt, stage the file back and compare its content.
- The LLM cannot delete the owner's files: it gives the command (`git rm <file>`, or `git rm -f <file>` when the file has changes not committed).
