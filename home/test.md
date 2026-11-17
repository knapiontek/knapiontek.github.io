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
