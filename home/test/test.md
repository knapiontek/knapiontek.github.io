# Tests

How the project is tested (the LLM's file, kept up to date without asking). Everything of the tests is in test/. Two kinds: the clean slate (test/index.html: the owner runs it) and the LLM's own before/after tests (not in the repository: the LLM rebuilds their scripts from this file).

## The clean slate (test/index.html)

The owner opens home/test/index.html from disk: every row must say OK. The LLM runs the same page after every change.

- **What it proves**: a file runs with JavaScript itself and what its constructor is given, nothing more. Its slate is a worker with every name taken away that is not JavaScript's own (no `window`, `document`, `console`, three.js, Alpine, `HOME`, no global name of the project); the page refuses a slate that is not empty.
- **A file's test**: the same path under test/ (test/core/plan2d.js tests core/plan2d.js), one function `<name>Test({ <the constructors it uses> }, data, check)`. It builds the file as the page does and checks each part of its public API; its first check is the public API itself (the names, in order): the test is the API's definition. `data(path)`: a data file's content; `check(what, ok)`.
- **Examples** (test/examples/): a story each (the sink in its cabinet, a cabinet in the Documents, a floor of one piece, a door, another metal), one function `<name>Example(…)` like a test: the files working together as index.js makes them, on the house's own data, what comes out checked. Every module an example hands to another's constructor must be an arrow of project.svg (the LLM's diagram script checks it).
- **The lists**: `FILES` and `EXAMPLES` at the top of test/index.html.
- **Rules**: a constructor on the slate is no global name, so a file reaches another only through its parameters. A test calls the public API only. A row NOT OK is never made OK by changing its test without the owner.
- Browser only: ui, sheet (the screen), scene (three.js): their tests call what needs no browser; room/parts.js's parts are shown by the page.

## The rule

Before a change, a baseline of the current state (below); after it, the same again and compared. Everything the same, or each difference explained to the owner and agreed. A baseline is taken again only after the owner agreed a difference.

## Setup

- **Node** for what needs no browser: the project's files in a `vm` context with `window` = the context; `HOME.data` replaced by a function that keeps its argument. Each module made as index.js makes it (its first lines).
- **The browser**: Playwright (Python) with Chrome, the page opened from disk (`file://…/home/index.html`); flags `--use-gl=swiftshader --enable-unsafe-swiftshader --allow-file-access-from-files`; viewport 1400 × 900. The CDN libraries from npm in the LLM's own folder, served by intercepting the requests (three@0.128.0 three.min.js and OrbitControls.js, xlsx@0.18.5, alpinejs@3.14.1; the Google fonts' CSS answered empty).
- **The type check**: `tsc -p home/jsconfig.json`: no error; the same with `noUnusedLocals`: none.
- **Data files**: `HOME.data(` JSON `)` and nothing else, never touched.
- WebGL is software (SwiftShader), slow: wait for a state, never a fixed time. Every page error and every console error or warning is a failure.

## The page

- Ready: `window.HOUSE_VIEW` exists and `document.querySelector(".app")._x_dataStack[0]` (`A`) is ready and not loading.
- Kept in the browser: localStorage `home-house`, `{mode, tab, layers, zoom, room, finish}`; a test starts clean (cleared once).
- Handles: `HOUSE_VIEW.CHECKS` (`{name, items, info}`; a fault: items and not info); `HOUSE_VIEW.book().sheets`; `A.pick("3d"|"2d"|"documents"|"cabinets")`; `A.title`, `A.subtitle`; the top-left menu's links `#nav a`.
- The page's `load` events stay 1 whatever is switched.

## What to run

### In Node

1. **Every room's model**: for each room with files, `room/model.js` prepare (the library as library/catalog.js gives it; the room node `{offset: [0,0,0], size: [10000,10000,3000], tiles}`, a bathroom's own size and area); serialised `{model, tree, looks, textures, covered edges, the cabinets file written back}`. The same string after a change.
2. **The house**: `house/model.js` build: every solid (element, material, layers, box, polygon), the doors, every room's part, the borders, the footprint, the checks. The same after a change.
3. **The tiles**: every floor layout laid: whole, cut, small cuts, area, the fitted origin.
4. **core**: the tree's checks of a small tree; the sheet evaluator (`ROUNDUP(2*3/4,0)` = 2).
5. **The library**: every file parses; every key unique; every shop exists; no price "to check".

### In the browser

6. **Every view**: the house and each room with files (`?room=`): no errors, every check passes (the house: the areas are information).
7. **The Documents** of each view: every sheet's rows as the baseline; Save XLSX gives a workbook with the formulas.
8. **One page, no reload**: House → a room in the menu → Room → another room → House → 2D, Documents, Cabinets, 3D; after each: no errors, the checks pass, the heading is the active room, View/Finish only in 3D, Walk only in House, Documents the view's own sheets.
9. **Finish**: a metal and a board changed per room: the estimate lists the swapped products, the checks name what has no variant; kept after a reload.
10. **Cabinets**: each room: no problem in the data, the fronts drawn; Export gives the room's cabinets file byte for byte; a table edited and Show in 3D changes its model, no reload; Back to the file.
11. **Pictures**: the views' screenshots before and after, compared (the same build gives the same pixels: a difference is real).
12. **tsc** clean. 13. **test/index.html**: every row OK.

## Reference values (21 Nov 2026)

| View | Sheets (rows) | Checks |
|---|---|---|
| the house | Rooms 20, Floor tiles 13, Doors 16, Notes 9, Elements 133, Test 35 | 18, the areas information |
| room_356 | Estimate 80, Cut list 144, Notes 33, Elements 538, Test 13 | 10, all pass |
| bathroom_5 | Estimate 61, Cut list 33, Notes 12, Elements 71, Test 13 | 10, all pass |
| bathroom_7 | Estimate 54, Cut list 33, Notes 11, Elements 70, Test 13 | 10, all pass |
| wardrobe_3 | Estimate 31, Cut list 64, Notes 14, Elements 307, Test 13 | 10, all pass |
| wardrobe_4 | Estimate 31, Cut list 57, Notes 14, Elements 261, Test 13 | 10, all pass |
| wardrobe_8 | Estimate 31, Cut list 58, Notes 15, Elements 218, Test 13 | 10, all pass |
| bedroom_6 | Estimate 33, Cut list 52, Notes 15, Elements 207, Test 13 | 10, all pass |

## Writing into the owner's folder

- Each batch from a fresh folder (`/mnt/user-data/outputs/syncN/`).
- After writing, the owner's folder listed and each file's size compared with this copy.
- The LLM cannot delete the owner's files: it gives the command (`git rm <file>`).
