# Plan: the new house project

> We build a new project from scratch in a new folder `home/`. The old project moves to `home.proto/` and is the prototype: we take its data, its library and what worked, not its layout, its duplicates or its workarounds. The prototype is not changed; it is the reference for comparisons. We follow this plan step by step; every step ends with a check and the owner's approval.

## 1. What we want

### The principle

Everything starts from the house. There is one page, **home**. It shows either the whole house with everything in it, or a chosen part: one room or a group of rooms (the kitchen, the bathrooms, the wardrobes). Home builds the house, cuts out the chosen part and **passes its data down**. Nothing below calls the house back, so the dependencies go one way only, as a tree.

### How it looks

```
house/        home: the page, the house's model and its data; chooses a part of the house and passes it down
  ├─ house.js           the house's data (JSON wrapped in .js)
  ├─ settings.js        the house's settings: our decisions shared by every room
  └─ ...                the house's code and the home page
  │
  ▼
room/         the room engine: makes a room from what it is given (the room from the house, the house's settings,
  │           the room's files); builds the cabinets, takes products from the library and places them where the scene says
  ├─ cabinets.js        cabinets: carcasses built from the fronts, drawers, shelves, plinths, worktops, panels
  ├─ products.js        the library's products in a room: appliances, sink, taps, shower, mirror, lamps
  ├─ tiles.js           wall and floor tiles
  ├─ room.js            puts the cabinets, products and tiles together into one room
  ├─ docs.js            turns a room's .docs.js into the Documents (see below)
  ├─ index.html         the cabinet editor: tables, wall elevations with the cabinets
  ├─ rules.md           how it is built for real, for the builder
  │
  ├─ kitchen_6.cabinets.js   the rooms' data: JSON wrapped in .js, one room = three files
  ├─ kitchen_6.scene.js      (their roles in the table below)
  ├─ kitchen_6.docs.js
  └─ bathroom_7, bathroom_5, wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6: the same
  │
  ▼
core/, library/   drawing, geometry, the 2D plan, sheets, the look of the pages, the tree (core/tree.js);
                  products, materials, textures
```

**Names of the rooms' files:** `<kind>_<number>.<role>.js`. The kind and the number come from the house; the number alone is not enough, because numbers repeat between the floors (6 is the kitchen on the ground floor and the bedroom in the attic, 5 the living room on the ground floor and the bathroom in the attic). The role is named after the module that reads the file. The rooms: kitchen_6, bathroom_7 (ground floor); bathroom_5, wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6 (the bedroom's niche) in the attic.

**A room's three files, three roles:**

| File | Answers | Holds | Written by | Read by |
|---|---|---|---|---|
| `.cabinets.js` | what the furniture is | groups, columns, cabinets; their settings (carcass depth, plinth setback, worktop overhang); the choices (hinge, runners, board); the designer's notes | the designer (the editor) | cabinets.js |
| `.scene.js` | where everything stands in the room | where each group of furniture stands (wall, point, direction, distance from the wall); products and lamps (which from the library, where); tiles (which, where); cameras; the settings of the layout (hood height, pendant height, tap position) | the LLM, agreed with the owner | room.js, products.js, tiles.js |
| `.docs.js` | what to buy and how to build | the estimate's items (what, how many, where, remarks), the layout of the cutting list and the assembly cards | the LLM, every time for the case at hand | docs.js |

The furniture file does not know in which room or at which wall the furniture stands; the scene file does not know what it is built from. From the prototype: a group's distance from the wall (in kitchen.dat.js today) goes to the scene; the hardware's sizes "for the drawing" (handles, legs, runners, in scene.dat.js today) are the maker's data and go to the library.

**Data as JSON in .js:** every data file is plain JSON wrapped in .js, so that the pages also work opened from disk.

**Every data file says its type and version:** `"type": "cabinets", "version": 1` (likewise `scene`, `docs`, `house`, `settings`). The code reads only the versions it knows; a file of an unknown or old version is never drawn in silence: Test says so (e.g. "kitchen_6.cabinets.js: cabinets 1, the code knows cabinets 2"). The version goes up only when an old file would be read wrongly (a field's meaning, name or shape changes); a new field with a sound default keeps the version. No converters in the code: when a format changes, the LLM rewrites the few files once and the owner checks them. Each folder's project.md describes its formats with their version and a short list of changes.

### Coordinates: translations only

- **The house's axes are the only real coordinates:** x along the house's long side, y across it, h up (height; written h, not z). Lengths in mm.
- **No rotations, no signs.** Every element is placed by a translation from its parent only: an **offset** from the parent's origin (always ≥ 0) and a **size** (always > 0), both in the house's axes. Nothing is turned, no direction is written with a minus.
- **The tree of elements:** house → room → group → cabinet → part (side, shelf, front …). An element's place in the house is the sum of the offsets from the root.
- **A parent's origin** is its smallest corner. A room's origin: the smallest x and y of its floor, h = 0 on top of its floor (a wardrobe's carcass in the attic stands at h = 0, not at the attic's height).
- **A front is a side of the box,** not a direction: `x0` (the side at the smaller x), `x1` (at the bigger x), `y0`, `y1`. A cabinet with its back to the wall at the room's bigger y has `front: y0`. The same for anything with a front: doors, drawers, a basin, a mirror.
- **Who is the parent:** a built-in product (sink, oven, hob) belongs to its cabinet and moves with it; a free-standing one (lamp, WC, mirror, shower) belongs to the room; a tiled surface (a floor, the wall behind the shower) is a node of the room, its offset the point the first whole tile is laid from.

### The tree: elements, settings, identifiers

- **One tree, one kind of node.** Every node: `id`, `name`, `offset`, `size`, `settings`, `children`. A room has many branches: furniture groups, products, tiled surfaces, where the sink hangs …; together they are a small database kept as a tree.
- **Settings follow the same tree as a cascade.** A value set on a node is the default for its whole branch; a node below that sets the same key overrides it for itself and its branch; a node without it takes it from the nearest ancestor. The root of the cascade is the house's settings (house/settings.js). The maker's data is not part of the cascade: it stays with the product in the library. The Test and the Documents can show where a value comes from (which node).
- **id and name.** The name is for people. The id is the identity: given once, never changed, never reused (an old reference must never point at something new). The LLM gives a meaningful id close to the name where it can (`sink_cabinet`, `basin_1`, no spaces); where it cannot (one more plain carcass) the id is a random hex string (e.g. `a3f9c2`), so that nothing suggests an order or a numbering.
- **The global identifier is the path of ids** from the root: `kitchen_6/…/a3f9c2`, `bathroom_5/basin_1`.
- **References use ids only,** never labels or positions: the scene, the docs files and Test. Moving a cabinet to another column changes nothing that refers to it; deleting one that is referred to shows in Test.
- **The label for the builder** (e.g. `G1[4]`: group 1, column 4) is computed from the place every time and shown in the Documents and drawings; it changes when the place changes, as it should; nothing in the data refers to it.
- **core/tree.js** knows only the node, nothing of furniture: find a node by its path and give a node's path; a node's place in the house (the sum of the offsets); a key's value for a node from the cascade, with the node it comes from; walk all nodes (drawing, counting, Documents); check the tree (ids unique among siblings, offsets ≥ 0, sizes > 0, a child inside its parent, references to existing ids). The menu and the layers use it too.

### Language

- **Whatever can be in English is in English:** the pages, the Documents, all MD files (rules.md too), the names in the code and in the data, the elements' names (`name`).
- **Proper names stay as they are,** because they are not a matter of language: a product's name as the shop gives it (e.g. "Płyta wiórowa laminowana biała 18 mm"; it is what one orders by), and a format a shop imposes (e.g. the shop's cutting-list format, eRozkrój, with its Polish columns).
- **Translation is done by the LLM when it is needed** (going to the shop, handing the cutting list to the builder); translations are not kept in the project.

### Assumptions

- **One page** with the modes 3D, 2D, Documents and Test. They work the same for the whole house and for a chosen part.
- **Two engines: house (the whole house) and room (one room).** room/ knows no particular room: no name, number or path of the kitchen or a wardrobe is in the code; everything comes in the data.
- **No sub-projects.** A room is three data files in room/, next to the engine. A new room is new data, not new code.
- **Three kinds of values.**

  | Kind | Decided by | Example | Where |
  |---|---|---|---|
  | the house's settings | us, for every room | the waste on boards and tiles, the shelf clearance, confirmats per carcass, the plinth height | house/settings.js: the root of the cascade |
  | settings lower in the tree | the designer, for one room, group, cabinet, product or surface | the kitchen's carcass depth; one wardrobe run 300 deep; this hood's height; this floor's joint | the node they belong to, in the room's files |
  | the maker's data | the maker | an oven's size, how many hinges a door of a height needs, the hinge's drilling, the sink's cut-out | the library, with the product |

  The library speaks only of the outside world (what exists and what the maker states), never of our decisions. Our settings are one cascade along the tree (above); the maker's data is not part of it. Home passes the house's settings down with the room.
- **Settings are values already decided; rules are how the engine turns the design into concrete values** (pieces, sizes, holes). The rules are in the code of the modules (cabinets.js, tiles.js, products.js) and in words in room/rules.md; the numbers they use are in the settings or in the library.
- **A room's settings and choices** (which hinge, which runners, which board) are the designer's decisions: the LLM does not change them without asking. Changes to the house's settings and to the library are agreed too, because they act on every room.
- **The designer's notes** in the furniture file are written by a person only. The LLM does not change them, does not add to them and takes nothing from them that the code computes; the Documents show them as they are. When something in them is unclear or bears on the design, the LLM asks. Constraints the engine must know (e.g. no carcass by the recuperator's ducts in wardrobe 8) are in the data as geometry, not in the notes.
- **The Documents are written by the LLM, not by the code alone.** A room's `.docs.js` is written every time for the case at hand, because buying needs judgement (packs, substitutes, shops, leftover boards). Against drifting from the design:
  - where a quantity follows from the model, the docs file refers to the model ("as many hinges as the model has") instead of copying the number; the decision what to buy stays with the LLM;
  - Test shows a mismatch: something in the model with no item in the docs, or an item in the docs with nothing in the model; then the LLM corrects the docs file.
- **docs.js is the module that reads a .docs.js**, as cabinets.js reads a furniture file. It holds what the LLM does not write anew every time:
  - what a .docs.js may say: an item, its quantity as a number or as a reference to the model, the pack size, the waste;
  - the counting: rounding up to packs and sheets, the prices from the library, the totals;
  - the sheets: the estimate, the cutting list, the assembly cards, the designer's notes;
  - the export to XLSX;
  - the check of a .docs.js against the model, for Test.

  The format of a .docs.js (what each field means) is described in room/project.md, like the furniture and scene files.
- **cabinets.js makes cabinets only**, no lamps, products or tiles. It can do the kitchen and the wardrobes from the start: fronts and doors, drawers with and without a front, open shelves on a grid of heights shared by neighbouring carcasses, a depth for each run, carcasses under the slope.
- **Products and lamps:** what it is (sizes, look, light, price) the library says; where it stands the room's scene file says; how to draw and count it products.js does.
- **The room from the house** (walls, floor, ceiling, slope, windows, doors) is one described structure that home passes down with the house's settings, in the room's own coordinates (its origin as above). No plug-in interfaces, no registration.
- **Every module has a contract,** written in the project.md of its folder before its code: what it is given and what it gives back. E.g. cabinets.js gets the furniture branch of the tree (with its settings) and gives the solids to draw, the boards to cut and the counts (hinges, runners); products.js gets the products branch and the library and gives solids and counts; docs.js gets a room's .docs.js and the modules' counts and gives the sheets. A module reaches into no other module's inside, only its contract.
- **One place for everything:** moving doors and drawers, hiding the walls in front of the camera, the 2D plan, the tiles (of the house and of the rooms), the Documents' sheets. The prototype had them in several copies.
- **Built once, then only looked at.** The model is built once, when the page opens; then only the view changes: turning, zooming and walking move the camera; switching a layer shows or hides objects already built; nothing is rebuilt. Core joins the still solids of one material into one drawn object; the moving ones (doors, drawers) stay apart, built once too, and an animation only moves or turns them on the screen. A door's swing is drawing, not data: in the data a door has no rotation, only its hinge on one side of its box.
- **Nothing made up in the code:** every number, colour and name of the project is in the data, in the settings or in the library.
- **The editor** is a page of its own: it works on the furniture file only (editor → cabinets.js → core), it needs no house. The site is static (GitHub Pages, no server), so the editor saves by download: the owner exports, the browser downloads the `.cabinets.js`, the owner puts it into the folder and commits it. The furniture file belongs to the owner: the LLM does not change it without asking.
- **Every module checks itself.** Each module has its own checks of what it does (cabinets.js: boards do not intersect, a drawer fits its carcass; tiles.js: the tiles cover the surface; docs.js: the Documents agree with the model; tree.js: unique ids, offsets ≥ 0, a child inside its parent). The Test mode only collects them; a new module brings its checks with it.
- **Descriptions from the start**, each where it belongs:

  | File | Describes |
  |---|---|
  | project.md (root) | the whole project: folders, dependencies, file names, how we work, To do |
  | house/project.md | the house's code, the format of its data and of its settings |
  | room/project.md | the room engine's code and the format of a room's three files: what each field means |
  | core/project.md | the shared code |
  | room/rules.md | how it is built for real: cabinets, tiles, fitting the products; the same for every room; for the builder |
  | test.md | how to check the project |

  From the prototype: the carpenter's rules of kitchen/rules.md and wardrobe/rules.md go to room/rules.md (translated), the formats in the sub-projects' project.md to room/project.md; house/rules.md and core/rules.md are not carried over. A particular room's decisions from the prototype (e.g. the recuperator's ducts) are put into the data by the owner, or by the LLM once agreed, as geometry, not into the notes.

## 2. Order of building

Every step takes from the prototype what worked and compares the result with the prototype wherever the data is the same (the same numbers in the Documents, the same plan, the same Test).

### Step 0: the structure and the descriptions

- [ ] The whole folder structure of the new `home/`.
- [ ] A project.md in every folder: every file's name, what it does, what it depends on, the module's contract (what it gets and gives); the formats of the data files with every field.
- [ ] The root project.md: folders, dependencies, file names, the coordinates and the tree, how we work.

Done when: the owner has read and approved the structure and every project.md. No code before that, so that no code is written that will not be accepted.

### Step 1: the foundation

- [ ] core/: the 3D view, the solids' geometry, the meshes, the 2D plan, the sheets with XLSX export, the look of the pages (from the prototype, without copies or anything of one project); core/tree.js (new).
- [ ] library/: products, materials and textures as data (from the prototype, tidied: every material and look once; the maker's data the prototype kept in the projects goes to the products).
- [ ] test.md: how each step is checked against the prototype.

Done when: an empty page with the modes draws a test tree of solids (offsets summed, settings cascaded), and a sheet exports to XLSX.

### Step 2: the house

- [ ] house/: the house's data house.js (from the prototype), the house's model, the home page with the whole house: 3D, 2D, Documents (tiles, doors), Test.
- [ ] house/settings.js: the house's settings (from the prototype: the kitchen's settings split into the three kinds; those shared by every room go here).
- [ ] Choosing a part of the house: `?room=…` draws only the chosen rooms; the wall and the ceiling in front of the camera hide.
- [ ] The room's data for room/: one described structure (walls, floor, ceiling, slope, windows, doors), passed with the house's settings.

Done when: the house looks and counts as in the prototype, and `?room=` shows an empty room.

### Step 3: the room engine

- [ ] room/room.js: takes the room and the settings from home, and the room's files; puts the room together.
- [ ] tiles.js: the room's tiles (and the house's, by one mechanism).
- [ ] products.js: products and lamps from the library, placed by the room's scene file.

Done when: the prototype's bathroom (tiles, WC, basin, shower, mirror, lamps) stands in home, only still without its cabinet.

### Step 4: cabinets

- [ ] cabinets.js: the kitchen and the wardrobes from the start (all of the assumptions above).
- [ ] room/rules.md: how cabinets, tiles and the fitting of products are made (from the prototype, in words, no numbers).
- [ ] The bathroom's vanity as an ordinary cabinet from the data.

Done when: the kitchen's cabinets have the same boards and sizes as in the prototype, and the wardrobes look as in the prototype.

### Step 5: the rooms as data

Moving the prototype's rooms into the new format is done once, by the LLM, from what the prototype already writes down; every moved room is drawn by the new engine and its solids compared with the prototype's:
- the kitchen: kitchen.dat.js is already a design (groups, columns, components): translated to the new format (offsets from the parent, the front as a side of the box, ids);
- the wardrobes: wardrobe.dat.js lists, beside its solids, every carcass (run, span, width, depth, height, shelves, drawers, doors): the runs and carcasses are rebuilt from it, the engine builds the solids;
- the bathroom's vanity: rebuilt as a cabinet from its few solids in bathroom.dat.js.

After the move the furniture files are the owner's: changed in the editor and exported by the owner.

- [ ] kitchen_6: the prototype's kitchen in the new format: furniture (.cabinets.js) and scene (.scene.js), every value by its kind.
- [ ] bathroom_7, bathroom_5: both bathrooms.
- [ ] wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6: the wardrobes and the bedroom's niche.

Done when: the whole house with all its rooms in home, Test without errors.

### Step 6: the Documents and the editor

- [ ] docs.js: makes the Documents' sheets (estimate, cutting list, the designer's notes, assembly cards) from the .docs.js of the chosen part of the house, with the library's prices and XLSX export.
- [ ] The rooms' .docs.js: written by the LLM for every room (from the prototype: the kitchen's estimate.dat.js as the starting point), with references to the model where a quantity follows from it.
- [ ] Test: every .docs.js against the model.
- [ ] room/index.html: the cabinet editor; opens a room's furniture file from the address (`?room=kitchen_6`, `?room=wardrobe_3`).

Done when: the kitchen's Documents agree with the prototype's Info, and the editor saves data that home draws unchanged.

## 3. Decided

- New project: folder `home/`; old project: `home.proto/`, untouched, the reference for comparisons.
- Language: whatever can be in English is in English, `name` too; proper names (a product's name, a shop's format) stay as they are; the LLM translates when needed, nothing translated is kept.
- The page's modes: 3D, 2D, Documents, Test.
- Engines: house/ (the whole house) and room/ (one room); the rooms' files in room/, the house's data and settings in house/.
- A room = three files: `<kind>_<number>.cabinets.js`, `.scene.js`, `.docs.js`; a role is named after the module that reads the file.
- Three kinds of values: the room's settings (the room's files), the house's settings (house/settings.js), the maker's data (the library).
- The Documents: written by the LLM for the room at hand; docs.js reads them and makes the sheets; Test checks them against the model.
- The designer's notes: a person only; the LLM asks, never changes them.
- Coordinates: the house's axes x (along the long side), y (across), h (height); translations only, no rotations, no signs; offsets ≥ 0 from the parent's smallest corner, sizes > 0; a room's origin at the smallest x, y of its floor, h = 0 on its floor; a front is a side of the box (x0, x1, y0, y1).
- One tree of nodes (id, name, offset, size, settings, children); settings cascade down the tree from the house's settings; the maker's data stays in the library.
- id: meaningful where the LLM can give one, else random hex; never changed or reused; references by id only; the global identifier is the path; the builder's labels (G1[4]) are computed.
- Built-in products belong to their cabinet, free-standing ones to the room; tiled surfaces are nodes of the room.
- core/tree.js: the shared handling of the tree.
- Step 0 first: the folders and every project.md approved before any code.
- Every module has its own checks; the Test mode collects them.
- Every data file has its type and version; the code reads only known versions, Test shows the others; the LLM rewrites files when a format changes, no converters.
- Performance: the model is built once when the page opens, then only the view changes; still solids of one material joined into one drawn object; doors and drawers apart, moved only on the screen.
- The editor saves by download (static site); the owner exports and commits; moving the prototype's rooms is done once by the LLM in step 5.
