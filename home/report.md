# Report

What was done in each step: what moved where from the prototype, what changed and why, what is left to decide.

## Step 1: the foundation (core/, library/)

**Result.** core/ and library/ work on their own: core/test.html draws a small tree of boxes (a floor, a wall, a cabinet with a door and two drawers) in 3D, 2D, Documents and Test. Offsets add up along the tree, the material comes from the settings cascade (the cabinet sets it once for its boards), the door and the drawers open on a click, the cut and its caps work, the 2D plan is cut from the same solids, Documents shows a sheet with live formulas and saves it as XLSX with the formulas, Test lists the checks of the tree and of the library. Checked in a headless Chrome, with no errors (test.md).

### core/

| File | From the prototype | What changed |
|---|---|---|
| geometry.js | core/geometry.js | the height axis is `h` (hRange, centreH, splitH); nothing else |
| surface.js | core/mesh.js | the name ("mesh" suggests a computation grid); the three.js batching of triangles moved to scene.js, so it computes without a browser |
| scene.js | core/scene.js | the axis `h`; **one mechanism for moving parts** (a door turns about its hinge, a drawer slides; a part behind another opens it first, closing closes what is behind), taken from the three copies in the house, the kitchen and the bathroom; parts not fully open stop the walk by themselves |
| plan2d.js | core/plan.js | the name (plan.js was easy to confuse with plan.md); the axis name and the namespace |
| sheet.js | core/sheet.js + the screen of core/info.js | the formulas' evaluator exported (computed without a browser); the Documents screen (title, warnings, the book, Save XLSX / Restore data) moved here; numbers formatted in one place |
| ui.js | core/ui.js | loading it touches nothing (the prototype set the panel and the theme on load); **the skeleton of the screen is built here once** (each prototype page had its own copy of the HTML); the modes are fixed: 3D, 2D, Documents, Test; the panel's tabs are given per mode; everything about applications and interfaces is gone (the applications menu, loading implementations, checking dependencies); all texts in English; the 2D zoom and Save SVG go to the bottom menu |
| ui.css | core/ui.css | the ids of the new skeleton; unused rules removed (the old help button, the house's rooms table: it comes back with the house) |
| load.js | new | the one loader: `HOME.load(path, format, version)`; `HOME.load.file` gives the path of every kind of data file; a data file calls `HOME.data(…)` |
| tree.js | new | the tree of nodes: paths, places, the settings cascade, the checks |
| library.js | core/library.js | loads the whole library through load.js; the textures by key |
| test.html, test.tree.js | new | the check of core on its own |

Not carried over: core/info.js as a whole. Its shared sheets (the estimate, the cutting list) and the order of the Documents' tabs belong to room/docs.js and move there in the Documents step. core/rules.md is not carried over, as the plan says.

One global: everything is `HOME.<module>` (the prototype had `CORE` plus a global per data file).

**The browser only where nothing else can do it.** Every file of core but load.js loads in Node, and the solids, the surfaces, the tree, the 2D plan and the formulas are computed there: Node computes the same 2D plan of the test tree as the browser, character for character. The rule is in project.md (Code style).

### library/

- Every file rewrapped as `HOME.data({"format": …, "version": 1, …})`. **The contents are unchanged**: no field was added.
- `library.js` (new) lists the product groups: a static site cannot list a folder.
- The shops moved out of products/ to `shops.js`: a shop is not a product.
- Links tidied: the prototype had `link`, `links` and `buy` side by side; now every product has `links` only (the maker's documents first, then the shops).
- Texts in English: spec, priceNote, note, the names of links, the units (pc, set, sheet, pack, m). The products' names stay as the shops give them. A texture's comment about its photo became its field `source`.
- The field descriptions from the files' comments moved to library/project.md.

### Not done in this step, on purpose

- **The maker's data held today in the kitchen's settings** (drilling, cut-outs, the shaker frame's width) moves to the library together with cabinets.js, which reads it, so it is checked against the prototype the moment it moves. Only what the maker states; how a product is drawn stays in the code that draws it.
- The root index.html comes with the house: now it would forward to a page that does not exist yet.
- house/project.md and room/project.md come with their code.

## Decided

1. **library/materials.js** stays in library/: a material is the outside world, not our decision, like a product.
2. **English everywhere**, numbers too, as the plan says; a translation is made when needed. The cutting list is our own, not a shop's format.
3. **References between nodes**: a node's field `refs`, a list of paths; tree.js checks that each path is a node. What a ref is for, the node's type says.
