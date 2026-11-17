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
| ui.css | core/ui.css | the ids of the new skeleton; unused rules removed (the old help button, the house's rooms table: it comes back with the floor tiles) |
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

## Step 2: the house (house/)

**Result.** house/index.html is the main page; the root index.html forwards to it. The whole house is drawn as in the prototype: the same 420 solids, 3129 pieces and 78 edge sets, the same 11 doors, the same checks (all OK). `?room=` shows a part of the house: one room (`?room=kitchen_6`) or several (`?room=bathroom_7,bathroom_5`); the walls, the floor and the ceiling the camera is beyond hide, so the room is seen from inside. The top-left menu: the house, each floor with its rooms, the bathrooms and the wardrobes. Checked in Node (the model against the prototype's, solid by solid) and in a headless Chrome (every mode, the whole house and parts, with no errors).

| File | From the prototype | What changed |
|---|---|---|
| house/house.js | house/house.dat.js | the house is the root node: its settings first (the view: layers, cameras, light, walk, cut, the groups of the menu), then its geometry, then the floors and their rooms as nodes; the axis `h`; every name and note in English; the floor tiles are left for room/tiles.js |
| house/model.js | house/model.js + house/shell.js + house/verify.js | one module, no interface: the solids unchanged; the rooms from the tree; the part of a room (the prototype's shell) with its box computed from the room's walls and slabs instead of written by hand; the checks |
| house/index.html | house/index.html | the screen from core; the main page for the whole house and for a part; the furniture's loading through interfaces is gone (the room engine comes next) |
| index.html | index.html | forwards to house/index.html |

**The rooms.** The rooms are nodes with English ids of the plan: on the ground floor vestibule_1, garage_2, hall_3, living_5, kitchen_6, bathroom_7, boiler_8; in the attic hall_1, bedroom_2, wardrobe_3, wardrobe_4, bathroom_5, bedroom_6, bedroom_7, wardrobe_8. The prototype's salon is three rooms with borders where there is no wall, drawn dash-dot in 2D:

- **kitchen_6** (20.51 m²): x 830 – 7220, y 5450 – 8660: the strip by the right wall from the fixed window 2500/2400 to the wall of the bathroom, with the island and the table;
- **hall_3** (5.11 m²): from the stair to the vestibule's door and the bathroom's door, y 4350 – 5450 (to 6150 by the bathroom);
- **living_5** (25.12 m²): the garden side and the left half.

Archon gives 9.67, 5.46 and 35.42 m²; as the plan says, the borders follow the rooms' use and archon's areas are only a reference (Test shows them as information). **To check by the owner** (project.md, To do).

**The part of a room against the prototype's shell**: the same solids for bathroom_7, bathroom_5, wardrobe_4, wardrobe_8 and bedroom_6. wardrobe_3 takes the whole chimney beside it (the prototype's hand-written box cut it in half). The kitchen's part is new: the prototype's covered only the kitchen's strip of the salon.

**Fixed on the way**: the part's floor merged the room's own rectangles in place, so the room's area changed after a part was cut (the prototype copied them by chance).

**Not done in this step, on purpose**: the floor tiles (the Finish tab), with room/tiles.js in the next step, by one mechanism for the house and the rooms.

**After the owner's review** (17 Nov):
- **The light is soft by default**: the ☀ panel has Clouds; they weaken the sun, strengthen the sky and blur the shadows (house.js, `light.clouds`: 70% by default). The shadows' kind changed so that they can be blurred.
- **No groups in the menu** (Bathrooms, Wardrobes): one room at a time. How a room is chosen and shown is to be decided (the menu, the cut of a part).
