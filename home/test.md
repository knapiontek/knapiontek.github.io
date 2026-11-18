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
- the checks: all OK (refs too: `cabinet/a3f9c2` refers to `cabinet/bottom`) but "every node inside its parent", with exactly one item (`outside: x 4200 > 4000`);
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

The golden: the prototype's KitchenEngine.build on kitchen.dat.js in Node (every carcass, front, board, strip, panel, plinth, worktop piece, hole, count; golden/kitchen_model.json); the prototype's kitchen page (rooms/kitchen/index.html): every still cell and every moving part's cells as material, layers and house box (golden/kitchen_page.json), the movers' kinds, its 2D. In Node, room/cabinets.js on room/kitchen_6.cabinets.js with the library must give the same model: the only differences are the texts (the parts' names, 34 of them, each one name for one name, so the cutting list joins the same parts; group names, notes), settings.materials and settings.hardware (new), settings.front (gone: the shaker's frame width is the product's) and the library's texts. The prototype's axes are read as this code's (u → x, n → y, v → h; a box reordered to [x0, x1, y0, y1, h0, h1]; a hole's u, v, n as at: [x, y, h]). On the page (`?room=kitchen_6`): 472 still cells and 33 moving parts with 346 cells, each the same as the prototype's (its 'k.' materials named as the library's: steel → steelPolished, smoke → smokedGlass, ring → ringGrey, fridge → fridgeWhite, ice → frost, bin → binGrey, insert → insertGrey, leg → foot, a board → `board:` + its key); the room's checks OK (the tree: g1 3513 × 618 × 1080, g2 2860 × 600 × 2720, g3 1736 × 900 × 908, every offset ≥ 0, every node inside its parent; K11 at x 59, y 28, h 150 in g1); Documents' sheets: Rooms, Doors, Notes, Furniture (262 rows: the products are nodes), Test (the checks; the modes are 3D, 2D, Documents); a drawer behind a closed one opens that one first; a door turns; the 641 details (meshes) the same as before the axes were renamed; the screenshots from the scene's cameras and the 2D look as the prototype's (but the floor tiles). The whole house: 7249 pieces, 344 edge sets, 44 moving parts, all checks OK but the areas.
