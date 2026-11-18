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

- **kitchen_6** (18.28 m²): x 830 – 7220, y 5800 – 8660: a rectangle by the right wall from the fixed window 2500/2400 to the wall of the bathroom, as deep as that wall is long (2860), with the island and the table;
- **hall_3** (5.72 m²): from the stair to the vestibule's door and the bathroom's door, y 4350 – 5800 (to 6150 by the bathroom);
- **living_5** (26.74 m²): the garden side and the left half, to y 5800.

Archon gives 9.67, 5.46 and 35.42 m²; as the plan says, the borders follow the rooms' use and archon's areas are only a reference (Test shows them as information). The owner set the kitchen's depth to the wall's length (2860); the strip it gave up went to the hall and the living room along their border at x 5470.

**The part of a room against the prototype's shell**: the same solids for bathroom_7, bathroom_5, wardrobe_4, wardrobe_8 and bedroom_6. wardrobe_3 takes the whole chimney beside it (the prototype's hand-written box cut it in half). The kitchen's part is new: the prototype's covered only the kitchen's strip of the salon.

**Fixed on the way**: the part's floor merged the room's own rectangles in place, so the room's area changed after a part was cut (the prototype copied them by chance).

**Not done in this step, on purpose**: the floor tiles (the Finish tab), with room/tiles.js in the next step, by one mechanism for the house and the rooms.

**After the owner's review** (17 Nov):
- **The light is soft by default**: the ☀ panel has Clouds; they weaken the sun, strengthen the sky and blur the shadows (house.js, `light.clouds`: 70% by default). The shadows' kind changed so that they can be blurred.
- **No groups in the menu** (Bathrooms, Wardrobes): one room at a time. How a room is chosen and shown is to be decided (the menu, the cut of a part).
- **The edges of a room**: a line where the room meets a wall or a ceiling hidden in front of the camera was hidden too, as if that wall still covered it (it is only a ghost, kept for its shadow). Now a ghost closes no line (core/scene.js).
- **The layers in one place**: the panel's Layers has two blocks, Floors (where: the ground floor, the attic, the roof; the cut under them) and Elements (what); a solid shows when both its floor and its kind are on. Over the view only the picked room is left (the prototype had the floors there). In house.js `view.menu` and `view.panel` are now `view.floors` and `view.elements` (the format is new in this step, so its version stays 1).
- **A room ignores the floors**: switched off in the house, a floor still shows in its room's view (the Floors block is not there); only the elements switch.
- **The corners of a room**: a wall's corner piece cut off by a door beside it (the small bedroom's corner by the hall doors, the vestibule's by the entrance) touched the room at a point only, so it was left out with the floor and the ceiling under and over it: a notch. Now such a piece is the room's when a kept wall touches it along x and another along y (house/model.js). Only bedroom_7 and vestibule_1 change; the prototype had the same notch.
- **The attic's ceiling is the roof's**, as the slab over the ground floor is the attic's: switching the roof off takes the ceiling and the loft wall over it too. In house.js the kind `ceiling` and the element `loftWall` name `floor: "roof"`; nothing is cut further (a cut along the roof's slopes would split many solids).
- **house.js tidied**: wall 3 left of the chimney is one element (attic3a, x 3760–5350); it was two in one line (attic3a and attic3c, split at x 4660 for no reason), which drew a line across it in wardrobe 4. The elements are in groups, in order (footings, foundations, ground slabs, walls, EPS, the chimney, the inner walls by number, the slab, the attic, the balustrades); the model is the same.
- **Every opening has an id**: the kind and the rooms it opens into (`door_hall_3_bathroom_7`, `window_kitchen_6_fixed`, `roofWindow_bathroom_5`), so a room can name a door or a window; Test checks the ids are unique. The balustrades are `balustradeHall` and `balustradeStair` (were N and E, a compass the house does not have). A finish's open range end is `null` (was ±9990). The other element ids stay: the outer walls by name, the inner walls by archon's numbers, which tie the data to the drawings.

## Step 3: the room engine, beginning with the kitchen (17 Nov)

The owner chose to start with the kitchen: it is finished and accepted for the CNC, and its format is the one the other rooms will follow. Nothing of it changes without a strong reason.

- **room/cabinets.js**: the prototype's kitchen model.js (the cabinets' model) and the drawing of its room.js (boards, fronts, handles, hinges, drawers, legs, grilles), the texts in English. The model is the same board for board, hole for hole (test.md).
- **library/draw.js**: how a product is drawn, whatever room it is in: the oven and the microwave, the fridge-freezer, the dishwasher, the hob, the hood, the sink with its tap and trap, the coffee machine, the pendant and the downlight. A product names its drawing (`draw`); the maker's sizes stay in the product's data, the shapes the maker does not give are the code's.
- **room/room.js**: puts a room together: the groups placed by the scene, the cabinets, the products, the lamps; the furniture's layers for the room's panel; its checks (every solid inside its group's box).
- **room/kitchen_6.cabinets.js** (format cabinets 1): kitchen.dat.js as it was, but each kind of part names its material (`settings.materials`), the hardware chosen is named (`settings.hardware`), the texts in English. **room/kitchen_6.scene.js** (format scene 1): each group's box in the room (offset, size) and the side its fronts face, the installation, the hardware's layout, the lamps, the cameras.
- **The library**: the maker's sizes the prototype kept for the drawing are the products' (the shaker's frame width, the handle's length, the leg's, the hinge cup's depth, the drawer's sides and runners, the grille's size); the looks of the appliances and of the handles' metals are materials; each appliance names its drawing.
- **house/**: house.js names the kitchen's files and has a layer Furniture; the page draws the furniture of the rooms shown (the whole house too), its lamps at night, its 2D, its checks; a room with furniture has its own layers in the panel and its scene's cameras. A room's view uses physical lights, as the prototype's room pages did: the inside light was made for them (without them the kitchen was too bright).

Not yet: the floor tiles (room/tiles.js), the Documents of the kitchen (estimate, cutting list, assembly: room/docs.js and kitchen_6.docs.js), the cabinet editor, the Finish tab (handles' metal and style, the floor tile).

**After the owner's review** (18 Nov):
- **The axes of a group are x, y, h**, as the house's: x along the group from its left end (seen from the front), y out from the carcass backs, h up; a box is `[x0, x1, y0, y1, h0, h1]` and every drawing takes (x, y, h). The group is set in the room by a quarter turn and a mirror (its x, y, h are left-handed), so the kitchen comes out as built. The names u, v, n are gone; every board, hole, solid and detail is the same as before (test.md). Next, proposed: the furniture as a tree (group → carcass → its boards, front → drawer → its boards), each node in its own coordinates with its offset to its parent, all numbers positive, the group's zero at the wall.
- **K21** opens to 90° (`doorStop`): it stands in the corner with its hinges on the wall's side. The prototype's `K4` was a name of the old numbering and stopped nothing.
- **The note on hardware** names K25 and K29 (were K8 and K12, the old numbering), the carcasses with drawers behind their doors.
- **The furniture is a tree** (room/cabinets.js, `tree`): group → its worktop, panels, strips, plinths, plasterboard and carcasses → each carcass's boards and fronts → a front's drawer boards, its inner drawer, its drawers behind the door. Every node has its offset from its parent's origin (the parent's left, back, bottom corner) and its size, all positive; a group's origin is its left end, its wall and the floor, so a carcass stands at y = backGap: changing that gap moves only the carcass. The boards, strips, plinths and panels are drawn from the tree (the same solids as before); the model still computes as it did, with y from the carcass backs, and the appliances, hardware and fronts are still drawn from it. Documents has a sheet Furniture (the tree with its offsets and sizes); Test checks the tree with core/tree.js and that each group fits the box its scene gives it. Not yet nodes: the appliances, sink, hob, hood and the hardware.
- **The chimney in a room's view** is one solid again: the house splits every solid at the ground floor's height so a floor can be switched off, and that split showed as a line; a room ignores the floors, so its solids lose the floor layer and the split pieces join (house/index.html). In the whole house the line stays: there the floors switch.
- **Test is the last sheet of Documents** (the owner's wish): each check with its result (OK, a number to correct, i to know) and what to correct under it; the modes are 3D, 2D, Documents. The sheet Furniture shows in the whole house too.
- **The products are nodes too**: the oven and the microwave, the fridge-freezer, the sink and the hob in their carcasses, the coffee machine with the carcass of its pull-out shelf, the dishwasher in its group; each is drawn by the library in its own coordinates, from the origin of its node, and moved there. The same solids and details as before. Not yet nodes: the hood, the tap and the trap, the hardware.
- **Documents as trees** (the owner's wish): core/sheet.js shows a sheet as a tree when its rows have levels: + and − before a row open and close its children; a sheet says whether it opens all or only its roots; the XLSX gets Excel's outline. The sheet **Tree** (was Furniture) shows the tree of what is shown: the whole house down to its floors, rooms and their furniture, or in a room's view only its rooms; closed at first. **Test** is a tree, open at first.
- **The panel's tab View**: the cut first, then the floors, the elements and the furniture's layers.
- **The hood, the tap and the trap are nodes too**: the hood in the group of the hob, the tap and the trap in the sink's carcass; drawn in their own coordinates. The same solids and details as before.
- **The tree is uniform** (the owner's wish): a group holds first what runs along it, then its units in a row as they stand, every one a carcass, the dishwasher in a bay of its own with its front and the appliance (K11, dishwasher, K12, K13, K1X).
- **The trap's outlet runs to the wall** (in the prototype it went 1 mm into it: the only drawn difference from the prototype, one pipe 1 mm shorter).
- **Documents and the panel, renamed** (the owner's wish): the sheet Tree is **Elements** (the nodes of the tree); in the panel the block Elements is **Layers** (the kinds of solid: blocks, slabs, EPS…). Opening or closing a node keeps the sheet where it is.

- **The hardware and the fronts' panels are nodes too**: under a carcass its legs, its plinth's grille, its shelf pins, the bumpers, a pull-out shelf's runners; under a front its panel, its hinges (plate, arm, cup), its handle, its drawer's runners. 216 pieces of hardware; every drawn piece lies inside its node. The hardware is still drawn from the model's numbers, not from its node.

- **The house's elements are nodes** (house v2; the plan asked for it, the first house file kept them as a list): the house holds the site, the foundation, its floors (each with its walls, ring beams and slab, an opening a node of its wall, then its rooms), the facade's insulation, the roof (its planes' data, the attic's ceiling and loft walls, the roof windows) and the stair (its flights, its void). One zero, archon's corner: the house in positive numbers, only what is outside it negative. The directions in the data have no signs (x0, x1, y0, y1; a door's hinge and the side it opens toward the same). The model reads the tree: every solid, door, room's part and check the same as with v1.
- **The tree says what belongs to what, not what lies inside what** (the owner): no check of a node inside its parent, none of offsets below 0; to know instead, what lies below the zero. A node's size is its own part's; what only holds others (a group, a drawer's boxes) has theirs. The sheet Elements shows the whole house down to its rooms, a room's view from the room down.
- **Test by view** (the owner): the whole house's Documents test the house (its tree, its model, the library); a room's view tests only that room (its furniture). Columns Test, Details (what the test checks), Result; a line under the table says what the results mean. A new test: every solid of the furniture lies inside a node of its group's tree (the handle's node now holds the bar handle too, as long as the cup).
- **Who draws what** (the owner's wish): a new section of project.md, "Data, tree, drawing", as it is to be: where the data is, what the tree holds, a node and the data, who draws each type and why.
- **The hardware is drawn from its nodes**: legs, plinth grilles, shelf pins, bumpers, hinges, handles and runners are drawn by the library (library/draw.js), each in its own coordinates from the zero of its node. The same solids, moving parts and details as before.
- **No absolute zero** (house v3, the owner): the root of house.js is the site, its zero the lawn's corner; the house stands in it (its h −800: the only negative number) with its zero at its own extreme corner: the left wing's EPS, the garden's EPS, the bottom of the footings; every part of the house positive (it moved by 1000, 0, 1320). Each container (foundation, facade, roof, stair) at the house's zero, a floor at its level (ground 1320, attic 4380). The model is the same, moved (every solid, door and check). Two hidden assumptions of the code went with it: the stair's risers counted from h 0 (now from the ground floor) and the house's length from x 0 (now `geometry.body`). A tree measures in its root's own axes (core/tree.js): the house's place in the site is not part of them.
- **Windows and Doors**: two layers instead of one (an opening's kind says which).
- **The 3D cut is gone** (the owner: not needed): the panel's Cut, its settings. The 2D plan keeps its cut height.
- **The openings' names**: "Window 6000/3460" (was "undefined 6000/3460").

## Noted for later: the 2D view (the owner, 18 Nov)

- **Zoom with the mouse wheel**, about the cursor, instead of the + and − buttons.
- **More dimensions**, more technical: the style of AutoCAD.
- **The doors' widths are all different**: to unify, by a standard (e.g. 900 for a room, 700 for a wardrobe?), to check first.
- **The hob draws half black** in 2D.
- **The kitchen shows too much**: fridge, oven, microwave lie one over another; to simplify (what is under the cut, less detail).
