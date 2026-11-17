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
core/, library/   drawing, geometry, the 2D plan, sheets, the look of the pages; products, materials, textures
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

### Language

- **Everything we write is in English:** the pages, the Documents, the descriptions (all MD files, rules.md too), the names in the code and in the data.
- **A product's name stays exactly as the shop gives it** (often Polish, e.g. "Płyta wiórowa laminowana biała 18 mm"): it is a fact of the outside world, like a brand, and it is what one orders by. In the Documents our columns and descriptions are English, the product column holds the shop's name.

### Assumptions

- **One page** with the modes 3D, 2D, Documents and Test. They work the same for the whole house and for a chosen part.
- **Two engines: house (the whole house) and room (one room).** room/ knows no particular room: no name, number or path of the kitchen or a wardrobe is in the code; everything comes in the data.
- **No sub-projects.** A room is three data files in room/, next to the engine. A new room is new data, not new code.
- **Three kinds of values, each in one place.** They are not levels that override each other: every value has exactly one place, so nothing conflicts.

  | Kind | Decided by | Example | Where |
  |---|---|---|---|
  | the room's settings | the designer, for this one room | the kitchen's carcass depth (furniture); the distance from the wall, the hood height (scene) | the room's furniture file or scene file, by what it is about |
  | the house's settings | us, once for every room | the waste on boards and tiles, the shelf clearance, confirmats per carcass, the plinth height in the whole house | house/settings.js |
  | the maker's data | the maker | an oven's size, how many hinges a door of a height needs, the hinge's drilling, the sink's cut-out | the library, with the product |

  The library speaks only of the outside world (what exists and what the maker states), never of our decisions. The house's settings are ours, so they are in house/; home passes them down with the room.
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
- **The room from the house** (walls, floor, ceiling, slope, windows, doors) is one described structure that home passes down with the house's settings. No plug-in interfaces, no registration.
- **One place for everything:** moving doors and drawers, hiding the walls in front of the camera, the 2D plan, the tiles (of the house and of the rooms), the Documents' sheets. The prototype had them in several copies.
- **Nothing made up in the code:** every number, colour and name of the project is in the data, in the settings or in the library.
- **The editor** is a page of its own: it works on the furniture file only (editor → cabinets.js → core), it needs no house.
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

### Step 1: the foundation

- [ ] core/: the 3D view, the solids' geometry, the meshes, the 2D plan, the sheets with XLSX export, the look of the pages (from the prototype, without copies or anything of one project).
- [ ] library/: products, materials and textures as data (from the prototype, tidied: every material and look once; the maker's data the prototype kept in the projects goes to the products).
- [ ] Descriptions: project.md in the root (folders, dependencies, file names, how we work), test.md.

Done when: an empty page with the modes draws a test solid, and a sheet exports to XLSX.

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
- Language: everything we write in English; a product's name as the shop gives it.
- The page's modes: 3D, 2D, Documents, Test.
- Engines: house/ (the whole house) and room/ (one room); the rooms' files in room/, the house's data and settings in house/.
- A room = three files: `<kind>_<number>.cabinets.js`, `.scene.js`, `.docs.js`; a role is named after the module that reads the file.
- Three kinds of values: the room's settings (the room's files), the house's settings (house/settings.js), the maker's data (the library).
- The Documents: written by the LLM for the room at hand; docs.js reads them and makes the sheets; Test checks them against the model.
- The designer's notes: a person only; the LLM asks, never changes them.
