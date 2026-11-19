# Tests

> **This file is the LLM's.** It is not a description of the project: it is what an LLM needs to rebuild its automated tests in a new session. The LLM keeps it up to date without asking.

Nothing is installed in the repository: the LLM rebuilds the scripts from this file in its own environment, runs them before and after a change and compares the two runs. Everything the same, or each difference explained.

## How to run

- **Pages**: a headless Chrome driven by Playwright (Python), the pages opened from disk (file://), as the owner does. Flags: `--use-gl=swiftshader --enable-unsafe-swiftshader --allow-file-access-from-files`.
- The CDN libraries from npm, served by intercepting the requests: three@0.128.0 (build/three.min.js, examples/js/controls/OrbitControls.js), xlsx@0.18.5 (dist/xlsx.full.min.js). The fonts' CSS answered empty (an aborted request is a console error).
- WebGL is software (SwiftShader): slow; wait for a state, never for a fixed time. Ignore "GL Driver Message … GPU stall".
- Errors: every page error and every console error or warning counts.
- **Without a browser first** (Node, a vm context as window, `HOME.data` replaced by a function that keeps the data): every file of core but load.js loads; the browser only for what it alone can show (WebGL, the screen, downloads).

## core/test.html

Ready when `window.TEST_VIEW` exists and #loading is hidden. Expect:

- no errors;
- the checks: all OK (refs too: `cabinet/a3f9c2` refers to `cabinet/bottom`); "what lies below the root's zero" (to know) with exactly one item (`below: x -200`);
- 10 cells, 3 moving parts; `cabinet/door` at [500, 1097, 2182, 2200, 100, 1000]; `cabinet/top` takes melamineWhite from `cabinet`;
- the door opened: angle −100 about [500, 2182], turning out of the front y0 (quaternion z ≈ −0.766, w ≈ 0.643); a drawer opened: its pivot at [0, −400, 0];
- each mode shows only its own view (gl, plan2d, documents, test) and its bottom menu (3D: the cameras and Walk; 2D: − + Save SVG; Documents: Save XLSX, Restore data; Test: none);
- Documents: 13 rows, the last "Total 3.3279"; Save XLSX downloads a workbook whose sheet Nodes keeps the formulas (`=ROUND(F3*G3*H3/1000000000,4)`, `=SUM(K3:K12)`);
- screenshots of 3D (doors open), 2D, Documents and Test look as before.

## The loader (in a page that has core/load.js)

`HOME.load` rejects with the file's name: another format (`core/test.tree.js: tree 1, the code knows cabinets 1`), another version, a missing file (`cannot be loaded`), a file without data (`no data in the file`).

## core in Node

Load geometry, surface, tree, ui, plan2d, sheet, library, scene; read core/test.tree.js and library/materials.js. Expect: the tree's checks with only `outside: x 4200 > 4000`; 48 pieces of the still cells (without the door and the drawers); the 2D plan of test.html (cut at 800: floor, seen, cut, dims) 1689 characters, the same as `TEST_VIEW.planSvg()` in the browser; the evaluator: `ROUNDUP(2*3/4,0)` = 2, `SUM(A1:B1)+'B'!A1` with A1 = 5 an input = 15.

## core/tree.js (Node)

A small tree with a duplicate id, a negative offset, a zero size, an id with a space, a node outside its parent, a node without type and size, a ref to no node and refs that are not a list: each check names exactly its node; `place` sums the offsets; `setting` finds the nearest node with the key (a nested key too) and returns it as `from`; a missing key gives undefined.

## Writing into the owner's folder

After every write, compare the owner's files with this copy (sizes from the folder listing, the contents staged back). A staged path used for an earlier write may carry its older content: write each batch from a fresh folder.

## house/ (Node, against the prototype)

The prototype's model in Node (core/geometry.js, core/ui.js with a stub localStorage and document, house.dat.js, model.js, verify.js, apps.dat.js, shell.js) gives the golden: every solid as `element|material|cap|layers|x1|x2|polygon|walkable` (rounded to 0.01 mm), the doors, the checks, the shells. The new model (geometry, tree, house/model.js, house/house.js) must give the same CELLS (243 against 244: wall 3 left of the chimney is one element, attic3a, not attic3a and attic3c; the attic's ceiling and the loft wall with the layer roof instead of attic; the balustrades named balustradeHall and balustradeStair), FIXTURES (137), ROOF_CELLS (14), STAIR_CELLS (16), SITE_CELLS (9) and 11 doors; checks all OK (the ids unique too), the areas as information. The parts against the shells (the side `h` written `z`): bathroom_7 = lazienka, bathroom_5 = lazienka5 (but the roof window's name), wardrobe_4, wardrobe_8, bedroom_6 = pokoj6 the same; wardrobe_3 23 cells (the chimney whole). A part against the model before the corner rule: only bedroom_7 (+ the corner of attic12, the slab, ceiling and roof whole) and vestibule_1 (+ the corner of blockEntrance) change. Borders: hall_3|living_5 (x 5470, y 4350–5800), hall_3|kitchen_6 (y 5800, x 5470–7220), living_5|kitchen_6 (y 5800, x 830–5470; x 830, y 5800–8660).

## house/index.html

Ready when `window.HOUSE_VIEW` exists. The whole house: no errors; with the clouds at 70% the sun's intensity 0.27 and the sky's 1.32, the shadow's radius 8 (the stored sun of an old page lacks clouds and is dropped); 3131 pieces, 94 edge sets, 11 moving parts without the kitchen's furniture (the prototype's page: 3129 and 78; the difference: wall 3 as one element, the ceiling and the loft wall in the roof's layer); with it see room/ below; 15 checks, all OK but the areas (i); a door opens (quaternion z −0.707); each mode its view and menu; with the roof off (in Floors) the ceiling and the loft wall hide too, the cut shows 1,500 mm over the attic floor and nothing is over the view; the walk moves. `?room=bathroom_5` with the attic and the roof switched off in the house: the bathroom still drawn; `?room=kitchen_6`: the kitchen's walls and windows, the ceiling hidden from Above; `?room=bathroom_7,bathroom_5` (by its address only, no longer in the menu): two sheets in 2D with 4.83 and 8.22 m², cameras per floor; `?room=…,nothing_9`: Test names nothing_9. Screenshots of 3D and 2D of the house and of the parts look as before; in `?room=living_5` the chimney has no line at 2720.

## room/ (Node and the page, against the prototype's kitchen)

The golden: the prototype's KitchenEngine.build on kitchen.dat.js in Node (every carcass, front, board, strip, panel, plinth, worktop piece, hole, count; golden/kitchen_model.json); the prototype's kitchen page (rooms/kitchen/index.html): every still cell and every moving part's cells as material, layers and house box (golden/kitchen_page.json), the movers' kinds, its 2D. In Node, room/cabinets.js on room/kitchen_6.cabinets.js with the library must give the same model: the only differences are the texts (the parts' names, 34 of them, each one name for one name, so the cutting list joins the same parts; group names, notes), settings.materials and settings.hardware (new), settings.front (gone: the shaker's frame width is the product's) and the library's texts. The prototype's axes are read as this code's (u → x, n → y, v → h; a box reordered to [x0, x1, y0, y1, h0, h1]; a hole's u, v, n as at: [x, y, h]). On the page (`?room=kitchen_6`): 472 still cells and 33 moving parts with 346 cells, each the same as the prototype's (its 'k.' materials named as the library's: steel → steelPolished, smoke → smokedGlass, ring → ringGrey, fridge → fridgeWhite, ice → frost, bin → binGrey, insert → insertGrey, leg → foot, a board → `board:` + its key); the room's checks OK (the tree: g1 3513 × 618 × 1080, g2 2860 × 600 × 2720, g3 1736 × 900 × 908, every offset ≥ 0, every node inside its parent; K11 at x 59, y 28, h 150 in g1); Documents' sheets: Rooms, Doors, Notes, Tree (the house, its floors, rooms and the kitchen's furniture; a tree, closed at first), Test (the checks as a tree, open; the modes are 3D, 2D, Documents); a drawer behind a closed one opens that one first; a door turns; the 641 details (meshes) the same as before the axes were renamed, but the trap's outlet: 1 mm shorter, to the wall; the screenshots from the scene's cameras and the 2D look as the prototype's (but the floor tiles). The whole house: 7228 pieces, 344 edge sets, 44 moving parts (7249 pieces with house v1: the cells come in another order and split into pieces a little differently; the picture is the same, 2 pixels differ), all checks OK but the areas and, to know, what lies below the house's zero.

## house v2 (the elements as nodes)

`tests/t_house_same.js` compares the house model with a snapshot of itself taken before a change (golden/house_now.json; `SNAP=1` takes it): every cell, fixture, roof, stair and site solid, the doors, every room's part (box, cells, objects), the borders, the footprint and the checks. house v1 → v2 (work/house_v2.js converts): all the same.

## house v3 (the site at the root, the house's zero at its extreme corner)

- Converter: work/house_v3.js reads the v2 copy (golden/house_v2.js, golden/kitchen_6.scene_v1.js) and writes house.js and the kitchen's scene (cameras moved).
- The house moved by S = (1000, 0, 1320) in its own axes. `OPENINGS=1 SHIFT=1000,0,1320 node t_house_same.js`: every solid, door, part, border, footprint and check the same as v2 (OPENINGS reads the layers windows and doors as v2's openings).
- `SHIFT=1000,0,1320 python3 cmp_kitchen_cells.py` after run_kitchen.sh: 472 static, 346 moving, the same (the hood's profile prints as a pair: moved, the same).
- The pictures: the garden camera the same as v2.
- After the doors were unified (18 Nov) the snapshot golden/house_now.json was taken again in v3 (SNAP=1): `node t_house_same.js` with no SHIFT from here on.

## The kitchen's faces

`tests/cmp_kitchen_faces.sh`: every board's material on each of its six faces (the decor, the decor turned, the bare core, a banded edge) against the prototype's, golden/kitchen_faces.json (taken from the prototype's kitchen page, the boxes in the prototype's house axes; the new ones moved back by the house's shift). 205 boards, all the same. The cells' comparison does not see the faces: this test was missing when the axes were reordered.
- 18 Nov: the 9 system drawers' backs have their top edge banded (agreed); golden/kitchen_faces.json taken again from the new kitchen after checking that only these 9 changed.

## The kitchen's Documents

`tests/cmp_docs.js` (Node: room/docs.js through tests/t_docs.js) against the prototype's book, golden/kitchen_book.json (its Info sheets, taken from a copy of the prototype's kitchen page that exposes its COST): every number and formula of the Estimate and the Notes row by row; the Cutting list by block, its rows' order aside (they are sorted by their names, now English). All the same but the agreed change: the 9 system drawers' backs with their top edge banded (+6.7 m of banding: 42.22 PLN with the reserve; the total 36 140.84 against 36 098.62).

## The cabinet editor

room/cabinets.html?room=kitchen_6 in the browser: no error, no problem in the data; the file read into the tables and written back (`HOME.cabinets.cabinetsText(EDITOR.built.file)`) is room/kitchen_6.cabinets.js byte for byte; a change in a table rebuilds the drawing and lists the model's problems (a drawer made 500 high: "G1[4]: drawer overlaps another piece - skipped"). The picker: a Type cell opens the list, a choice sets the type and closes it; a Tags cell toggles tags and stays open; Esc or a click outside closes it. Typing in the last (empty) row adds a new empty row.

## The pages on Alpine.js (19 Nov)

`tests/snap.py <page> <name> <HOUSE_VIEW|TEST_VIEW>` records what a page shows: each mode (the visible text, the inputs, what is pressed, which parts show), each sheet tab of Documents (its text, its column widths, its fields, its folds), then the help, the sun box, a layer off, the panel closed, the theme. Taken before the move as snaps/base_*, after it as snaps/new_*; `tests/cmp_snap.py whole kitchen bath core` lists every difference. After the move: none, but #test and #nav (no longer in pages that never used them) and the column widths of Estimate and Doors (the fit no longer creeps, see report.md). `tests/docs_ui.py`, `sun_ui.py`, `nav_ui.py <home dir>` run the interactions on the old copy and the new code with the same results: a price typed changes the totals and the focus stays in the table, the field is marked changed, a link opens its note flashed, a tree row opens, Restore puts the inputs back, the XLSX is the same byte for byte; the sun dragged, its sliders, Night: the same stored sun; the wheel zooms the 2D about the cursor; one floor list open at a time, a click elsewhere closes it, the picked room's tag opens and unpicks. Light or dark and the panel picked on the house page hold in the editor and back. `tests/editor_ui.py`: typing in the last row of Components adds an empty row; a height of 500 marks the rows the model skips; a Type cell opens the list, a choice sets the type and closes it; a Tags cell toggles tags and stays open; Esc closes it. `tests/look.py`: screenshots of Documents and of the editor, light and dark, to compare their look.

## The wardrobes (19 Nov)

- `node tests/model_snap.js <room>`: the model of a room in Node (room.js prepare) as JSON; the kitchen's the same as before the step but the geometry moved to its group and `open: false`.
- `node tests/cmp_wardrobes.js`: wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6 against the prototype's wardrobe model: every carcass's width, height, depth, place; the drawer boxes; the backs; the niche's fronts and hinges. The same, but the fixed shelves (on the grid: every second line).
- The page `?room=<room>` for the four and the kitchen: no errors, every check passes; wardrobe_3 Estimate 31 rows, Cut list 62, Notes 13; bedroom_6 Estimate 33, Cut list 52; the kitchen 4284 pieces, Estimate 80, Cut list 144 (as before).
- The estimates' boards against the prototype's (tests/proto_w_info.py reads its Info): carcass, drawer boxes, HDF and oak m² together the same, hinges 20, brackets 50.
- The editor (`cabinets.html?room=<room>`): the five rooms open with no problem, their drawing filled, Export the same byte for byte; tests/editor_ui.py as before.
- The kitchen after the step: cells (SHIFT=1000,0,1320) 472 / 346, only the hood: its profile as a pair and its filter and chimney 2 mm higher (library/draw.js, older than this step, see report.md); faces 205 / 205; the page snapshots (snap.py, cmp_snap.py): only what changed with Alpine (absent pieces, "shaded fields", the columns).

## The type check (19 Nov)

`npm i typescript@5` in a folder of the LLM's own (not in home/), then `tsc --noEmit -p home/jsconfig.json`: no error. After a change of the types only: `node tests/model_snap.js <room>` for the five rooms, the same JSON as before the change.

## The floor tiles (19 Nov)

- `python3 tests/proto_tiles.py`: the prototype's layouts, counts and pieces (from a copy of its house page that exposes them: proto_copy/house/index_t.html) into tests/golden_proto_tiles.json.
- `node tests/t_tiles.js`: each of the 8 layouts in Node (house/model.js, room/tiles.js) at the origin of the data: the prototype's origin (moved by the house's shift), the same tiles, whole, cut and small cuts, the rooms' area the same; the doors' halves apart (the doors unified); the fitted origin beside.
- The page: no errors, the Test without faults; the sheet Floor tiles; Finish: a pattern changed, fitted, an origin typed, back to the data (tests: an evaluate on the page); pictures from Above and Plan of both floors beside the prototype's (tests/shot_tiles.py, shot_tiles_proto.py).
- 19 Nov: the attic's two layouts (attic, attic/hall_1) moved by the owner's leave: t_tiles.js compares them at the prototype's origin (MOVED).

## The wardrobes split (19 Nov)

- `node work/split_carcasses.js` rewrote the four cabinets files (as the editor writes them); the editor's Export the same byte for byte after it. tests/cmp_wardrobes.js no longer holds for the carcasses (the prototype's are whole): the widths, depths, drawer boxes and the shelves' heights as before.
- The pages: no errors, every check passes; wardrobe_3 Cut list 64 rows, wardrobe_4 57, wardrobe_8 58, bedroom_6 52; the kitchen as before (Estimate 80, Cut list 144).
- The edges (core/scene.js): tests/shot_back.py <room> <eye> <target> <png> [layer to switch off | cam:<camera>]: the backs of wardrobe_3 from behind with and without the shelves and the edges; the kitchen and the whole house before and after, side by side.

## The bathroom 7 (19 Nov)

- house/index.html?room=bathroom_7: no errors, every check passes; the Estimate 55 rows, the Cut list, the Notes.
- The tiles counted on the page: walls 16.33 m² (63 tiles), floor 3.68 (8), the shower's walls 12.75 (28), its floor 0.90 (4).
- Regressions: model_snap of kitchen_6 and wardrobe_3 the same as before; the kitchen's Documents against the prototype (the cut list differs only in the order of rows, every block the same), its cells and faces the same; t_tiles, t_house_same clean; tsc clean.

## The compass sides (19 Nov)

- The models of kitchen_6, wardrobe_3, _4, _8 and bedroom_6 the same as before; the house the same (t_house_same); the kitchen's cells and faces the same; the 2D plan (SVG) of the house and of the bathroom 7 the same string as before the change, the checks the same; core/test.html without errors; tsc clean.
- The cabinet editor: kitchen_6 and bathroom_7 draw, no warnings, no table wider than its column at 1400 px.

## The bathroom 7, second look (19 Nov, evening)

- A ray through the middle of the shower door's glass finds its mover; the page's checks all pass (every solid has its node, inside its group).
- The whole house with Blocks off: the 5 wall tile meshes of the bathroom hidden, the casing's and the floors' shown.
- Pictures: the WC with its casing and with Built in off (the frame, cistern, riser), the radiator, the shower set, the rain head from below.
- Regressions: models of kitchen_6, wardrobe_3, _4, _8, bedroom_6 the same; the house the same; the kitchen's cells and faces the same; tsc clean; the cabinet editor draws the bathroom.
