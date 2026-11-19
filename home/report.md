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
- **Every child in its parent's axes, every field in its node's** (the owner): an element's and an opening's lines and transoms in its own axes, a floor's cameras in the floor's, a room's cameras (its scene) in the room's. The same solids and pictures.
- **Windows and Doors**: two layers instead of one (an opening's kind says which).
- **The 3D cut is gone** (the owner: not needed): the panel's Cut, its settings. The 2D plan keeps its cut height.
- **The openings' names**: "Window 6000/3460" (was "undefined 6000/3460").
- **The whole kitchen is drawn from its tree**: the fronts' panels, the worktops and the plasterboard from their nodes; a drawer system's metal (sides, gallery rails, an inner drawer's front, waste bins, the cutlery insert) are nodes now, drawn by the library; the holes' markers where their board's node is. The same solids and moving parts; the details the same (two handles' cups 0.5 mm off in the comparison's rounding only).
- **The doors unified** (the owner; the standard: a door "80" in an opening about 900 wide, a door "60" about 700, by Porta's and others' tables): every inner door 900 × 2050, the wardrobes' 700 × 2050, each on archon's centre (six changed: 920, 920, 870, 890, 940 → 900; the wardrobe 8's 820 → 700). No check changed (no overlap, every floor area in a room). A note in house.js says it is our decision.
- **The 2D, as noted** (below): the wheel zooms about the cursor (and a drag moves the sheet; the − and + gave way to Fit); the dimensions as in CAD: chains with slashes on every side of the whole house, through the openings of each side and the whole; the hob is no longer half black (the hood's filter and lights hung 1.5 mm under the hood's height, so the 1500 cut went through them: the hood's lowest point is now its height, its body 2 mm over it); the kitchen simpler: an appliance is its node's box, grey where the cut meets it (applianceBody's plan colour), the sink and the hob as seen from above.
- **Whole millimetres**: the handles' nodes on whole mm. The cups were on whole mm already; the half millimetres the comparison showed are the cup's own length (IKEA: 89 mm).
- **The entrance's side light and the boiler room's glass door have their bottom frame** (the owner): their glazed part has a sill now, as a window's (house.js, openingKinds). No check changed.
- **Turning the 3D view** (the owner: the pivot was behind the camera): a drag with the left button turns about the point under the cursor where it starts, an orange dot marks it while turning (on no surface: about the point of the last turn); the right button moves at the depth of what is under the cursor; the wheel zooms toward the cursor, as before. The body box the pages handed to core/scene.js is gone with the old rule.
- **A fault found** (the owner: white carcasses and white panels in the corner and behind the island): which faces of a board get the decor was decided by its thinnest side, measured in the old order of the axes (x, h, y) while the sides were named in the new one (x, y, h). Since the axes were reordered, every board whose thin side is not along x showed its bare core on its big faces: shelves, bottoms and tops (white core), the front panels (navy only on top and bottom), the island's back panel, the plinths. One line in room/cabinets.js. Now all 205 boards have the prototype's face on every side; a test of it is new (test.md: the kitchen's faces). The materials themselves (colours, decors, the edges' looks) were the prototype's all along.
- **The edges of a part that slides out** (the owner: the system drawers' backs had no edge on top): one rule for every board of a drawer and of a pull-out shelf: its top edge is banded, unless its top is a face. The boards of the drawers behind doors had their top edges written one by one; now the rule gives them, the same. New: the 9 backs of the system drawers. A new check: no banded edge lies against another part; it finds two fixed shelves whose front edges are behind the oven's and the microwave's fascias (to decide).
- **Bare chipboard shows its chips** (the owner: a missing edge was hard to see): a bare edge of a chipboard (the carcasses, the worktops and end panels, the white melamine) is beige with flakes lighter and darker every way (core/scene.js, a generated surface `chipboard`), of MDF an even light brown; the library's boards say which (`coreSurface`) and their core's colour (was near white for all). The check of banded edges counts an edge as covered only when it is covered all along: the two shelves behind the oven's and the microwave's fascias show a gap there, so they keep their edge.
- **The kitchen's Documents** (step 6 of the plan, the owner's approval): a furnished room's view has the sheets Estimate, Cutting list, Assembly (the cards per carcass) and Notes, before the house's (whose notes are House notes there). room/docs.js builds them from the cabinets' model, the room's tree and room/kitchen_6.docs.js (format docs: the prototype's estimate.dat.js in English, the names of the new model); core/estimate.js the shared sheets. What the tree holds is counted from it (`{nodes:hinge}`: the hinges, bumpers, legs, grilles, handles, shelf pins, the appliances); a new check: the tree counts as the model. Against the prototype: every quantity, price, formula and cut the same, but the drawers' backs' banding (agreed). The product names stay as the shops give them (Polish).
- **A room's Documents are its own** (the owner): a room's view shows its Estimate, Cut list (was Cutting list: what a woodworker calls the list of parts; a cutting layout, the parts nested on sheets, is the shop's), Assembly, Notes, then Elements and Test; the house's sheets (Rooms, Doors, Notes) only in the whole house.
- **The cabinet editor** (room/cabinets.html, step 6 of the plan): a room's cabinets file from the address (`?room=kitchen_6`; from a room's Documents, Edit the cabinets) in tables as the prototype's design.html had them: groups, columns, components (the type, tags, handle and hinges picked from a list), notes; the materials read only; the elevations drawn on every change, the cursor on a part shows its sizes; the problems of the data (the tables' and the model's) in the panel. Export writes the file as the files are written: the kitchen's file read and exported unchanged is the same file, byte for byte.
- **Alpine.js** (3.14.1, pinned) is the way of the pages' HTML in the whole repo (project.md, at the owner's direction). The editor is the first page on it: the tables, the picker, the drawing and the panel declared in the HTML; the reading of the tables, the model and the export unchanged; the same checks pass (byte-identical round trip, the problems on a change, the picker sets types and tags).
- **Alpine.js in every page of home/** (19 Nov), rebuilt the same day after the owner's review (the first version kept the old glue and copied the screen into two pages):
  - **One screen for every page.** `HOME.ui.page(name, spec)` gives a page its Alpine part: the state kept in the browser (reactive, saved on every change), the mode, the tabs, the bottom menu, the floats, the 2D sheet's zoom; the page adds load() and its own getters and methods (onMode, menus, layerBlocks, …), which the screen reads; the lists (layers, menus, tabs, the picked room) follow the state by themselves, no refresh functions.
  - **The pieces of the screen are written once**, in core: `<template x-part="dock"></template>` puts a piece in its place (an Alpine directive of core/ui.js); a piece can take the page's own content (help, panel). Pieces: nav, view, loading, modes, plan, docs, checks, dock, pad, sun, help, corner (◐ ☀ ? and » «), panel, layers; core/sheet.js adds 'sheet' (the Documents screen). The pages only put them together: house/index.html, core/test.html, room/cabinets.html.
  - **The top-left menu** (the house, its floors, their rooms) comes from one function, `HOME.model.nav(house, rooms shown)`, on the house page and in the editor.
  - **The editor looks as the other pages**: the same top-left menu, corner, bottom menu and panel (its title the room's name); its tables are the sheets of Documents (a frame with round corners, the title as the table's first row, the heads as theirs), only the fields blue as the sheets' inputs; the elevation is a sheet as the 2D plan (light or dark as the plan), each part in its material's colour (the fronts navy, the worktops oak; the appliances as they look; the handles light metal); its own CSS moved into core/ui.css (no style in the page).
  - Checked against snapshots of every page taken before the move (the whole house, the kitchen, two bathrooms, core/test): every mode, every sheet tab's text, the panel, the menus, the sun, the help, the theme: the same; the XLSX the same byte for byte; the editor's round trip the same; the earlier tests (cells, faces, docs, the house's model) unchanged.
  - Fixed: the editor did not take light or dark (nor the panel) from the other pages.
  - Fixed: the columns of a sheet crept wider at every fit (each resize): a field fills its cell, so it was measured at the last width plus 1 px; a field now counts with its min-width. The Estimate and Doors columns changed a little once (the fields narrower, the text wider) and stay so.
  - The size: the seven files together as before Alpine (+1.3%; the editor's CSS now in ui.css); the editor 355 lines instead of 417.
  - After the owner's look (19 Nov): the editor's columns set as the sheets of Documents (`setColumns`: the materials' names wider, the groups' names whole); the materials' Size as bought, length × width × thickness, `?` where the library does not give it (the worktops' length, the fronts: made to size); the library's boards got `length` and `width` (2800 × 2070) where the project already said so (the kitchen's sheet in its Documents, the HDF's link, the specs of the white boards); the fields quieter on every page: a light tint of the accent and a line under them, the text in the page's own colour (it was blue: weak in the dark), the tint stronger on hover, the accent's outline when typed in; a field changed from the data stays amber. "Blue fields" in the help and in the kitchen's Estimate: "shaded fields".
  - The MD files brought up to date with the owner's approval: project.md (the screen with Alpine.js; To do: tiles next, the worktops' lengths, the other projects of the repo), core/project.md (ui.js, sheet.js, ui.css, the pieces of the screen), house/project.md (the menu from model.js), room/project.md (the editor), library/project.md (the boards' length and width).

## Step 4: the wardrobes in the cabinets format (19 Nov)

The prototype's four wardrobes (one file of its own, rooms/wardrobe) are now rooms like the kitchen: each with its cabinets, scene and docs file, built by the same engine, with an estimate, a cut list, notes and assembly cards. wardrobe_3, wardrobe_4, wardrobe_8 (open shelving with drawer boxes) and bedroom_6 (the niche: oak doors and drawers).

- **New files**: room/wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6 `.cabinets.js`, `.scene.js`, `.docs.js` (12); house/house.js gives the four rooms their files.
- **The engine (room/cabinets.js), new and general, the kitchen unchanged** (its model the same but the moved geometry fields; its cells, faces and Documents the same):
  - the tag `open` (cabinet, drawer): no front; an open drawer is a box seen from the room;
  - `settings.drawers.box: "board"` with `drawers.board` (sideHeight, lift, clearance, setback, backClearance, runnerLengths): drawers of board on ball runners, the longest runner that fits; counted by runner length;
  - a group's own `depth` (the wardrobes stand 300, 400 and 810 deep); its geometry per group (`model.geometryOf(g)`);
  - `shelf.grid` {from, pitch, fixedEvery}: the shelves' tops on lines `from + k·pitch` for all carcasses of a room; fixed on every `fixedEvery`-th line, the others on pins; a warning if a carcass's top or a fixed shelf is off the grid;
  - no fixed shelf between two drawers; backs behind open modules and board drawers;
  - settings and materials needed only by what the room has (a wardrobe needs no worktop, no handle, no hinges if it has no doors);
  - a board front (not lacquered) banded all round, its decor's grain upright as in the prototype.
- **room/room.js**: the hardware optional (no handle, no hinge: nothing drawn); the layers only of what the room has; an information check is not a fault.
- **room/docs.js**: the fronts without open ones; the assembly cards for board drawers ("open drawer W × L × H, ball runners L") and runners by length; the legend only with what the room has; the cut list's title from the docs file (`labels.cutTitle`; the kitchen's added); a block's total `length`.
- **room/cabinets.html**: Groups has Depth (empty: the settings' depth), kept on Export; an open module drawn in its carcass's colour; an open drawer has no gaps (it stopped the drawing). Export the same byte for byte for the five rooms.
- **library**: leveling-feet-50 got its sizes for the drawing; the PVC plinth is a board (boards.js: thickness 16, sold by the metre).
- **Against the prototype**: every carcass the same (width, height, depth, place), the drawer boxes, the backs, the fronts of the niche (51–367, 369–676, 678–2045; W4 doors 303), hinges per door 3 / 2; the boards together the same as the prototype's estimate (carcass 72.4 m², drawer boxes 39.3, HDF 30.6, oak 4.8; 20 hinges, 50 brackets).
- **Deviations** (to approve):
  - the shelves on one grid for all wardrobes (from 686, every 340): the heights the prototype's, but fixed on every second line (1366, 2046), the others on pins; the prototype mixed them carcass by carcass;
  - an open drawer's front ends of its sides and bottom banded (they are seen);
  - the niche: a front gap of 2 (the prototype 0) and the plinth set back 51;
  - board fronts banded on all four edges;
  - the estimate per room (the prototype: one for all four wardrobes).
- **Not ported (yet)**: the prototype's checks of the gap under the ceiling (≥ 100) and of the passage (≥ 600).
- **Doubt, found on the way**: the kitchen's hood is drawn 2 mm higher than the prototype's (library/draw.js: its bottom = the lowest point + 2, for the lights under it); older than this step, not in this report before. To decide: as the prototype, or as now.

## Types in comments (19 Nov)

At the owner's word: the code stays plain JavaScript, its types written as JSDoc and checked by TypeScript's compiler (`tsc --noEmit`), a tool of the writer only; the pages load the same files, nothing is built.

- Every code file of core/, house/model.js, library/draw.js and room/ (cabinets.js, room.js, docs.js) begins with `// @ts-check`; home/jsconfig.json lists them (strictNullChecks on); home/globals.d.ts declares what comes from outside (HOME, three.js, Alpine.js, SheetJS).
- Typedefs: in room/cabinets.js the cabinets file (CabinetsFile, FileGroup, Component) and the model's records (Item, Carcass, Board, Edge, Hole, Gaps, Geometry, GroupModel; Front still loose); elsewhere `@type` where a value is not plain (the sheets' rows, the estimate's rows, the defaults of callbacks).
- The check passes with no error. What it found and what changed in the code (behaviour the same): the cabinets file reaches build() with `materials` added by withLibrary() (now in its type); a carcass's flags are counted as numbers; a door with no hinge side is not looked up; a stored state that is missing parses as null; a key press outside an element is ignored as before.
- Checked: the models of the five rooms in Node byte for byte as before; the editor's Export, the kitchen's Documents, cells (the same 3 of the hood), faces, the page snapshots: as before.
- Not checked: the pages' inline scripts (house/index.html, room/cabinets.html, core/test.html) and the data files (checked by the loader and the tests).
- The MD files: project.md (Code style: types; Folders; To do: tiles, then the bathrooms, the types growing with the code), plan.md (the note), room/project.md (the formats of the wardrobes: the tag open, drawers of board, a group's depth, the shelves' grid, settings needed only by what a room has, the cut list's title, a block's length), library/project.md (a board sold by the metre).

## The floor tiles (19 Nov)

The prototype's floor tiles (its house page: Wykończenie, the layouts, the count, the cost) are in home, by one mechanism: room/tiles.js computes, house.js says, the house's page draws and shows.

- **room/tiles.js** (new, no browser): a layout's rooms and zones (rooms meeting with no wall: one zone), the doors' halves (the floor runs on through a door), the tiles laid from the grid's origin, the count (whole, cut, small cuts below the product's minCut, the penalty), the fitted origin, the faces to draw. The prototype's code, moved.
- **house.js**: `settings.tiles` of the house (reserve, grout, top, mark, layers, small), of each floor (the product, the direction, the origin of its grid) and of the rooms with a grid of their own (an origin) or none (null: the garage, the two bathrooms, whose floors their projects lay); the layer Floor tiles with Small cuts (red). The layouts as in the prototype: the ground floor's (the hall, the living room, the kitchen), the vestibule, the boiler room; the attic's (the bedroom with wardrobes 3 and 4), the hall, bedrooms 6 and 7, wardrobe 8; the origins the prototype's, in each node's own axes.
- **house/model.js**: the layouts from the settings (the node a room's tiles come from is its layout).
- **house/index.html**: the tiles drawn (the grout under, the tiles over, a stone tile one whole image turned at random, a plank a random crop of the photo, a small cut red while its layer is on); the panel's tab **Finish** (3D) as the prototype's Wykończenie; the picked room marked; Documents: the sheet **Floor tiles**; Test: three checks.
- **core**: hash01 (the stable random number) moved to core/geometry.js, so a module can use it without the browser; the image surface takes which image of a texture (face); ui.css: the rooms' list of Finish.
- **Against the prototype** (tests/t_tiles.js): all 8 layouts, the same tiles, whole, cut and small cuts, the same area of the rooms; the doors' halves a few cm² apart (the doors unified on 18 Nov). On the page the same numbers as the prototype's (the salon: 84 tiles, 44 / 32, 6,686 zł).
- **Deviations**: the origin is data (the prototype fitted it on the first visit and kept it in the browser); Fit the origin does the same search, from the floor's zero (so it may land elsewhere than the prototype's: the same score).
- **To know**: the bedroom with wardrobes 3 and 4 has 11 small cuts with the third bond (as in the prototype); with the half bond and Fit, 1.

## After the owner's look (19 Nov, noon)

- **Lines through the HDF backs**: the edges of the shelves and the sides showed through a 3 mm back. The cause in core/scene.js: every edge line was pulled toward the eye by 0.2 % of its distance (6 mm at 3 m). Now the faces are pushed back a little in depth (polygonOffset) and the lines pulled 0.04 % (1 mm at 2.5 m): a line on a face shows, one behind a 3 mm board does not. The whole house and the kitchen look the same; the doubled lines of the kitchen's shaker fronts (edges behind them) are gone with it.
- **No carcass taller than 1316**: a carcass reaching over the fixed shelf at 1366 is now two, the lower to 1366 (its name, two drawers and one compartment, all alike) and the upper from 1366 (its name + U, 340 to 1360 high), screwed through its bottom (a note in the cabinets files and the Documents). wardrobe_3 13 carcasses (was 8), wardrobe_4 10 (7), wardrobe_8 8 (6), bedroom_6 6 (4); the niche's tall doors two each. Done in the data (work/split_carcasses.js), the engine as it was.
- **The niche's fronts**: 4 mm between them (2 mm a side, 2 mm to the niche's edge; was 1 a side), light grey Egger U708 ST9 instead of the oak decor, banded in U708. Later (the owner): triangles as blends, so the niche reads as one wall with only its joints; push to open.
- **Floor tiles moved** (the owner: they are bought and cut on site, the prototype's origins are not binding): the attic's bedroom with wardrobes 3 and 4 in half bond, its origin fitted: 1 small cut (was 11); the attic's hall fitted: 20 cut tiles (was 22). The other layouts stay at the prototype's origin (fitting gives nothing better).

- **The edges without a pull** (the owner: no rule in proportion to the distance): the lines are drawn where they are; only the faces are pushed back, by polygonOffset, which the graphics card counts in its own depth steps, so it fits every distance by itself. Close, at a few metres and from 100 m: the backs clean, the edges as before.
- **The panel only for settings** (the owner): Finish lost its numbers (area, tiles, whole and cut, small cuts, cost) and the product's note; they are in Documents, Floor tiles. The rule in project.md (Code style).
- **Finish: only the settings** (the owner, again): no list of floors and rooms, no product names, no "With"; the picked room's layout only (pick it on the floor in 3D; a room's own view: that room).
- **The HDF backs of the wardrobes 1 mm smaller on every side** (the owner): the prototype's wardrobes had them the carcass's full size (its data: a back 800 × 2336 on a carcass 800 × 2336), only its kitchen 1 mm in; now one rule, `backPanel.inset: 1`, as the kitchen's and as an adjustable shelf's clearance; the cut list's title says it.
- **Fixed, my mistake**: the attic's half bond (set on the floor) went down by the cascade to the rooms with their own grid (hall 1, bedrooms 6 and 7, wardrobe 8): 3 to 14 small cuts each, red at the doors. They now set their own pattern (third bond, as before): 0 small cuts each. tests/t_tiles.js compares the moved layout at the prototype's pattern and origin.

## The inner doors hidden (19 Nov, the owner)

- Every inner door is now a hidden door, all drawn alike (700 or 900 wide): the leaf flush with the wall on the hall's side (`flush` on each door node: toward a hall, then a vestibule, the living room, a bedroom; written by work/doors_flush.js), a frame over the leaf's depth only (the rest of the reveal is the wall), of two steps: 10 mm on the half toward which the door opens, 25 mm (the stop) on the other; the leaf stepped the other way. From the hall: the wall, the joint, the leaf. From the room: the leaf set back in the reveal, the stop round it.
- The light seen through in bedroom 6: the old frame lined the whole reveal and the leaf stood in it with a straight 3 mm gap through its whole depth (the prototype's model, the same); the steps close it now.
- Checked: the house's model the same but the doors (454 solids, none overlapping); its snapshot taken again (SNAP=1); the rooms' parts as well. The doors' opening directions as before.

## A room's view: the walls only as far as they close the room (19 Nov)

- bedroom_2 (an L): its view took every wall in the box round it, so the walls along wardrobes 3 and 4 came in whole, an empty frame of walls with no floor and no roof over it. Now a wall of a room's view is trimmed to its floor area grown by the thickest wall (240): the frame is gone, the roof as before. The other rooms the same but for short wall ends (living_5, garage_2, boiler_8, hall_1, wardrobe_3); the house's snapshot taken again.
- Not a fault: the beige face over the passage to the wardrobes is the attic's flat ceiling, lit from below like every ceiling.

## The ground-floor bathroom, room 7 (19 Nov)

The owner's decisions: the design is where every object stands (bought, cut, or made by the owner), not the installer's points; no suspended ceiling, downlights like the kitchen's; the vanity's top one plain 18 mm board of the same decor; the kitchen's drawers (TANDEMBOX antaro, NL 400); an estimate and a cut list like the kitchen's, no eRozkrój; the riser, the Geberit frame, the WC and the basin drawn; no pipes in the walls.

- room/bathroom_7.cabinets.js: a hung vanity of two carcasses 600 (Egger H1199 ST12), its bottom 324 above the floor, three drawers push to open, the top banded all round with the basin's holes (drain Ø 60, tap Ø 35).
- room/bathroom_7.scene.js: the fixtures (riser, WC frame with its plate on the casing, WC, wall cabinet in the casing's niche, mirror, radiator, the screen with its door, the linear drain, the shower set), the casing as built-ins, the tiles (walls and casing graphite 1198 × 598, floor grey 898 × 898, the shower apart), five downlights, five cameras.
- room/bathroom_7.docs.js: the estimate (boards, cutting and banding, hardware, basin, WC, shower, radiator and mirror, tiles counted from the drawing + 10 %, the casing), the cut list, the notes on the design.
- The engine: cabinets.js the tags basin and banded, hung carcasses, round holes; room.js fixtures, built-ins, the room's tiles (tiles.js corePieces shared with the house); draw.js the sanitary drawings; the products in sanitary.js, building.js, hardware.js, services.js (the banding in H1199, PUR).
- The kitchen and the wardrobes: their models unchanged; the house's tiles and doors unchanged.

## After the owner's look at the bathroom 7 (19 Nov, afternoon)

- The riser ended at the ceiling, in the plane of the casing's top: seen from above it showed through (taken for a lamp). Now 2700, inside the casing.
- The shower screen stood 50 mm before the tiled face of the wall beside it; it now continues that face (x 1644), the shower's zone from its glass (1656). Its door turned 1.4° (the value was read in degrees): now 90°, outward.
- Documents, Assembly: the cards were held to 880 px like the other sheets (two columns); now as many columns as the window takes.
- The cabinet editor: the basin and its tap were unknown to it (only the appliances were given, not the sanitary products): the bathroom's drawing was empty; the groups and the components tables narrower so they fit without a slider; a bin instead of × to delete a row.
- **The sides by the compass**: `E`, `W`, `N`, `S` (and `down`) instead of x0, x1, y0, y1 (and h0) in every file: house.js (outer, side, hinge, opens, flush), the scenes (front), core's test tree. x grows to the west, y to the south; one table, core/geometry.js SIDES, used by house/model.js and core/plan2d.js; room.js's quarter turns keyed by the compass.

## The bathroom 7, the owner's second look (19 Nov, evening)

- The shower's door did not open on a click: a click passed through glass (it is seen through); now a moving glass is taken (core/scene.js moverAt).
- The WC casing is one solid with its niche cut out (scene builtIns: box + cuts), no lines between its pieces; tiled on its faces and the niche's reveals.
- The layers: a tile goes with what it lies on: a wall's with Blocks, a casing's with Built in (as the facade with its EPS). Built in off shows what it hides: the layer Installations (the riser, the Geberit frame and its cistern, the WC's outlet).
- The radiator, the shower set (thermostat, rain head on its arm, hand shower on its hose), the WC bowl (lofted), the flush plate, the frame and its cistern, the riser: the prototype's own details (rooms/bathroom/bathroom.dat.js), in the products' axes (library shape, draw.js shaped; work/proto_shapes.js); my simplified drawings removed (wcFrame, wcBowl, towelRadiator, showerSet, riser). What stands on the tiles 10 mm out (the prototype drew no tiles). A hatch on the casing (inspection-hatch-200), as in the prototype.
- Unused in the library: the materials hdfWhite, plinthPvc removed. Products nothing uses yet: the attic bathroom's (white basin, plug, taps, freestanding bath and its siphon, white gasket), the decors and tiles to choose from (Egger H1181, H1399, H1346, H1176; three tiles), LEGRABOX (the prototype's attic vanity), ABS edges, eRozkrój, the H1180 banding: kept for the owner to decide.
- The bar "6. Kitchen · Open · ×" over the whole house's view: the room picked by a click on the open floor (its floor marked orange); Open goes to its own view, × unpicks it; the room picked is also the one whose tile layout Finish shows. Not changed: the owner decides.

## The attic bathroom, room 5 (19 Nov, night)

- The owner: the room-pick bar stays (it chooses the room whose tiles Finish shows); the unused products removed (LEGRABOX, ABS edges, eRozkrój, the H1180 ABS banding, four decors, three tiles); the attic bathroom's kept and used. Four textures now unused (egger-h1176, -h1181, -h1346, -h1399): for the owner to delete.
- room/bathroom_5.cabinets.js: a hung vanity 1600 of two carcasses 800 in Egger H1180 ST37 (18.6, a top of 19 in the data: the thickness compared in whole mm), a drawer under each white basin, chrome taps.
- room/bathroom_5.scene.js: as the prototype's attic: two LED mirrors, the radiator by the door, the corner shower 1000 × 1000 (its door opens outward, 77°), the drain, the shower set, the freestanding bath and its floor tap, the WC in a casing 250 × 1200 with a white shelf on top, the frame, the riser up to the casing's top, the WC's outlet, the hatch; light grey tiles (the shower's walls upright, its floor 598 × 598); three downlights under the flat ceiling; six cameras.
- The roof: the house gives a room its ceiling lines (the attic's flat ceiling, the roof's underside); the lamps hang from the flat part, a gable wall's tiles are cut along the slope (tiles.js clip: a cut piece is a polygon, counted by its area).
- Products: the bath, its tap, the corner shower (with a door in its shape), a PVC pipe Ø 90 as long as the scene says; the riser as high. Bathroom 7 got the WC's outlet as that pipe.
- room/bathroom_5.docs.js: the estimate (61 rows), the cut list, the notes.
- The kitchen, the wardrobes, bedroom 6 and the house: the same as before.

## The owner's notes of the evening (19 Nov)

- The Egger decors H1181, H1399, H1346, H1176 restored: boards to choose from (their textures stay).
- The 2D plan: a click or a drag no longer selects its texts (user-select none on the drawing).
- The tiles at the corners: a tile's face stands 10 mm off its wall; at an inside corner a face now ends 10 short (where the other's face is), at an outside one 10 past (closing the corner); a wall's tiles stop at the face of a casing's tiles; a niche's reveals meet the front's tiles. Before, two faces crossed in each inside corner.
- The speed: the whole house draws about 2500 meshes (2330 this morning, before the attic bathroom); 1309 of them are small cylinders, each its own draw call (handles, hinge cups, shelf pins, legs, the radiators' rails). Merging them per group and material would cut the draw calls by about half: proposed, not done.
- The triangle fillers in the wardrobes' niches: kept in the plan only, the owner decides later.

## Noted for later (the owner, 19 Nov)

- **2D, the whole house**: a click on the plan marks everything: ugly (to check whether it still does).
- **2D, the kitchen**: the sink only rectangles; the worktop shows joints it does not have (it is pieced round the sink: it should be one worktop with an opening, as before); too much detail (dashed lines, the strips in detail, handles and appliances one over another): a rule of what the plan leaves out, to agree.
- Not to do: the wardrobes' checks of the clearance under the slope and of the passage (the owner does it with the editor); the hood's 2 mm (good as it is); one rule of construction for every room (each room its own).

## Noted for later: the 2D view (done 18 Nov, see above) (the owner, 18 Nov)

- **Zoom with the mouse wheel**, about the cursor, instead of the + and − buttons.
- **More dimensions**, more technical: the style of AutoCAD.
- **The doors' widths are all different**: to unify, by a standard (e.g. 900 for a room, 700 for a wardrobe?), to check first.
- **The hob draws half black** in 2D.
- **The kitchen shows too much**: fridge, oven, microwave lie one over another; to simplify (what is under the cut, less detail).
