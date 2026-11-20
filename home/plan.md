# Plan: the new house project

> We build a new project from scratch in a new folder `home/`. The old project moves to `home.proto/` and is the prototype: we take its data, its library and what worked, not its layout, its duplicates or its workarounds. The prototype is not changed; it is the reference for comparisons. We follow this plan step by step; every step ends with a check and the owner's approval.

## 1. What we want

### The principle

Everything starts from the house. There is one main page, **home**. It shows either the whole house with everything in it, or a chosen part: one room or a group of rooms (the kitchen, the bathrooms, the wardrobes). Home builds the house, cuts out the chosen part and **passes its data down**. Nothing below calls the house back, so the dependencies go one way only, as a tree.

### How it looks

```
house/        home: the page, the house's model and its data; chooses a part of the house and passes it down
  ├─ house.js           the house's data (JSON wrapped in .js); its root node's settings are our decisions shared by every room
  ├─ index.html         the home page
  └─ ...                the house's code
  │
  ▼
room/         the room engine: makes a room from what it is given (the room from the house, the house's settings,
  │           the room's files); builds the cabinets, takes products from the library and places them where the scene says
  ├─ cabinets.js        cabinets: carcasses built from the fronts, drawers, shelves, plinths, worktops, panels
  ├─ products.js        the library's products in a room: appliances, sink, taps, shower, mirror, lamps
  ├─ tiles.js           wall and floor tiles
  ├─ room.js            puts the cabinets, products and tiles together into one room
  ├─ docs.js            turns a room's .docs.js into the Documents (see below)
  ├─ cabinets.md        how cabinets are built for real, for the builder   (with cabinets.js)
  ├─ products.md        how products are fitted: mirror, basin, sink, appliances, lamps, taps   (with products.js)
  ├─ tiles.md           how tiles are laid   (with tiles.js)
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
| `.scene.js` | where everything stands in the room | where each group of furniture stands (its offset in the room); products and lamps (which from the library, where); tiles (which, where); cameras; the settings of the layout (hood height, pendant height, tap position); the design checks (distances that must hold, by ids) | the LLM, agreed with the owner | room.js, products.js, tiles.js |
| `.docs.js` | what to buy and how to build | the estimate's items (what, how many, where, remarks), the layout of the cutting list and the assembly cards | the LLM, every time for the case at hand | docs.js |

The furniture file does not know in which room or at which wall the furniture stands; the scene file does not know what it is built from. Together they make one tree: the scene holds the room's own nodes (the groups' offsets in the room, by the groups' ids; the products; the tiled surfaces), the furniture file each group's branch (cabinets, parts) with offsets inside the group. A scene node may hang under a node of the furniture file by its id (the sink under its cabinet). From the prototype: a group's distance from the wall (in kitchen.dat.js today) becomes the group's offset in the scene; the hardware's sizes "for the drawing" (handles, legs, runners, in scene.dat.js today) are the maker's data and go to the library.

**Data as JSON in .js:** every data file is plain JSON wrapped in .js, so that the pages also work opened from disk.

**Every data file says its format and version:** `"format": "cabinets", "version": 1` (likewise `scene`, `docs`, `house`). The word `format` is for files only; `type` is for nodes only (what a thing is). The code reads only the versions it knows; a file of an unknown or old version is never drawn in silence: Test says so (e.g. "kitchen_6.cabinets.js: cabinets 1, the code knows cabinets 2"). The version goes up only when an old file would be read wrongly (a field's meaning, name or shape changes); a new field with a sound default keeps the version. No converters in the code: when a format changes, the LLM rewrites the few files once and the owner checks them. Each folder's project.md describes its formats with their version and a short list of changes.

### The house knows its rooms

The house is the root of the tree, so it is the house that knows which rooms it has. house.js lists every room of the archon's plans, each a node of the tree under its floor:

```
house
 ├─ ground floor:  vestibule_1, garage_2, hall_3, living_5, kitchen_6, bathroom_7, boiler_8
 └─ attic:         hall_1, bedroom_2, wardrobe_3, wardrobe_4, bathroom_5, bedroom_6, bedroom_7, wardrobe_8
```

- **A room in house.js:** its id (kind and archon number, e.g. `kitchen_6`: also the prefix of its files in room/), its name, its floor area (from which its origin follows) and which files it has: `cabinets`, `scene`, `docs`, or none (the garage has none; the house draws it all the same).
- **What bounds a room: walls first.** A room's border is its walls wherever there are walls. Only where there is no wall does an agreed border remain, and then it is described in the data: where it runs and why (e.g. "the kitchen with the dining area ends here; the garden side is the living room").
- **Rooms without walls between them are still rooms.** On the ground floor the hall 3, the living room 5 and the kitchen 6 are one open space with no walls, but three rooms, each with its own floor area as in the archon's plan (the archon gives 35.42 + 9.67 + 5.46 m²). A border without a wall is a line in the data: the house draws no wall there, but the choice of a part, the areas and the Documents know it. The 2D plan draws it as a thin grey dash-dot line (the drawing convention for a zone's border), so it is mistaken neither for a wall (solid) nor for what is above the cut (dashed); each room keeps its number and name on its side. The border follows the room's function, not the archon's areas: it may step (several straight pieces in the house's axes, the floor being rectangles), and the archon's areas stay a reference only (Test shows the difference as information, not as an error). The kitchen and the dining area are one room, kitchen_6: the island, the table right by it and the fixed window by the hob and hood cabinet; the living room living_5 is the garden side with the exit to the garden. Furniture may still reach over a border; it belongs to its room, and Test only notes it.
- **Everything else follows from this one list:** home's menu (floors → rooms, built from the tree by core/tree.js), the choice of a part (`?room=bathroom_7`: the house knows the room exists and where it is), the "Edit cabinets" button only by the rooms that have a cabinets file, and Test (every file in room/ belongs to a room of the list, every file the list names exists). A static site cannot list a folder, so the list is in the data.

### Pages and modules

- **Modules** (cabinets.js, products.js, tiles.js, docs.js, the house's model) never load anything themselves: they are given their data as arguments. That keeps the dependencies going down only.
- **The page** is the host: index.html with index.js (the application) loads the data files and passes them to the modules.
- **The cabinet editor:** the mode Cabinets edits the active room's `room/<room>.cabinets.js` with the library, both loaded by the application; it hands them to cabinets.js.
- **One loader for all data, in core.** Code is loaded by the pages statically (each page lists its modules); nothing loads code by name, so no reflection is needed. Data is loaded dynamically, always by a key, by one rule "key → file", in one place in core used by every page:
  - a room: `kitchen_6` with the role `cabinets` → `room/kitchen_6.cabinets.js`;
  - a texture: `egger-h1180` → `library/textures/egger-h1180.js`;
  - the house: `house/house.js`.

  When the file's name is known, it is loaded by name; when only a key is known (a room from the address or from the house's list), the loader turns it into the file. The loader checks the file's format and version and gives the data back. Every data file has one form instead of a global name of its own (the prototype had KITCHEN_DESIGN, KITCHEN_VIEW, BATH_DATA, WARDROBE_DATA …): JSON handed to the same function, e.g. `HOME.data({"format": "cabinets", "version": 1, …})`. The product groups are few and small, so they are loaded whole; the textures are big, so they are loaded by key, through the same loader.
- **The wall elevations with the cabinets are drawn by the cabinets module,** not by the editor page: the editor shows them beside its tables, docs.js puts the same drawing into the Documents (assembly cards, the builder's drawing). One drawing, one place.

- **Types in comments (19 Nov)**: the code stays plain JavaScript with its types written as JSDoc (`// @ts-check`, typedefs of the formats and the model's records), checked by TypeScript's compiler without building anything (`tsc --noEmit`); the pages load the same files. Details in project.md, Code style.

### Coordinates: translations only

- **The house's axes are the only real coordinates:** x along the house's long side, y across it, h up (height; written h, not z). Lengths in mm.
- **No rotations, no signs.** Every element is placed by a translation from its parent only: an **offset** from the parent's origin (always ≥ 0) and a **size** (always > 0), both in the house's axes. Nothing is turned, no direction is written with a minus.
- **The tree of elements:** house → room → group → cabinet → part (side, shelf, front …). An element's place in the house is the sum of the offsets from the root.
- **A parent's origin** is its smallest corner. A room's origin: the smallest x and y of its floor, h = 0 on top of its floor (a wardrobe's carcass in the attic stands at h = 0, not at the attic's height).
- **A front is a side of the box,** not a direction: `x0` (the side at the smaller x), `x1` (at the bigger x), `y0`, `y1`. A cabinet with its back to the wall at the room's bigger y has `front: y0`. The same for anything with a front: doors, drawers, a basin, a mirror.
- **Who is the parent:** a built-in product (sink, oven, hob) belongs to its cabinet and moves with it; a free-standing one (lamp, WC, mirror, shower) belongs to the room; a tiled surface (a floor, the wall behind the shower) is a node of the room, its offset the point the first whole tile is laid from.

### The tree: elements, settings, identifiers

- **One tree, one kind of node.** Every node: `id`, `name`, `type`, `offset`, `size`, `settings`, `children`. A room has many branches: furniture groups, products, tiled surfaces, where the sink hangs …; together they are a small database kept as a tree.
- **Two trees that do not clash: where a thing is, and what it is.** The tree of nodes says where each thing is, from the general to the particular (house → room → group → cabinet → part; a room → its shower, mirror, lamps, tiled surfaces): these are the things themselves, each with its place and its settings. The types say what a thing is, from the particular to the general, like a variable's type: this cabinet → type `cabinet` → the module cabinets.js → the project; this shower → type `shower` → products.js. They meet in one field: every node's `type`. room.js walks the tree of nodes and hands each node to the module its type belongs to, by a fixed list "type → module" (nothing is loaded by name); each module's project.md lists the types it knows. Settings hang in the tree of nodes but may speak of types: `cabinet: shaker` set on a room means every node of type `cabinet` in that room has shaker fronts.
- **Folders hold the "what", the data holds the "where", the file name joins them.**

  | | Holds | Example |
  |---|---|---|
  | **folders: what** | modules and their code | `core/` (drawing, tree, loader), `library/` (products, materials, textures), `house/` (the house's module), `room/` (cabinets, products, tiles, docs) |
  | **data: where** | the house as a tree of things | `house.js`: house → floors → rooms; a room's files: groups → cabinets → parts, products, tiled surfaces |
  | **a room's file name: both** | `<where>.<what>.js` | `kitchen_6.cabinets.js`: the room `kitchen_6`, read by the module `cabinets` |

  Each folder is a module or a group of modules; its project.md lists the types it knows. The tree of where things are lives in the JSON data, not in folders: all the rooms' files lie flat in room/, with no folder per room (a folder per room would bring the sub-projects back). In `kitchen_6.cabinets.js`, `kitchen_6` is a node of the "where" tree (a room of the house's list) and `cabinets` the module of the "what" that reads the file.
- **Settings follow the same tree as a cascade.** A value set on a node is the default for its whole branch; a node below that sets the same key overrides it for itself and its branch; a node without it takes it from the nearest ancestor. The root of the cascade is the house's own node in house/house.js: its settings stand at the top of the file, right after the header, before the floors and the walls, so they are easy to find. There is no separate settings file: settings always live in a node, in the house as in a room. The maker's data is not part of the cascade: it stays with the product in the library. The Test and the Documents can show where a value comes from (which node).
- **id and name.** The name is for people. The id is the identity: given once, never changed, never reused (an old reference must never point at something new). The LLM gives a meaningful id close to the name where it can (`sink_cabinet`, `basin_1`, no spaces); where it cannot (one more plain carcass) the id is a random hex string (e.g. `a3f9c2`), so that nothing suggests an order or a numbering.
- **The global identifier is the path of ids** from the root: `kitchen_6/…/a3f9c2`, `bathroom_5/basin_1`.
- **References use ids only,** never labels or positions: the scene, the docs files and Test. Moving a cabinet to another column changes nothing that refers to it; deleting one that is referred to shows in Test.
- **The label for the builder** (e.g. `G1[4]`: group 1, column 4) is computed from the place every time and shown in the Documents and drawings; it changes when the place changes, as it should; nothing in the data refers to it.
- **core/tree.js** knows only the node (its type is just a name to it), nothing of furniture: find a node by its path and give a node's path; a node's place in the house (the sum of the offsets); a key's value for a node from the cascade, with the node it comes from; walk all nodes (drawing, counting, Documents); check the tree (ids unique among siblings, offsets ≥ 0, sizes > 0, a child inside its parent, references to existing ids). The menu and the layers use it too.

### Language

- **Whatever can be in English is in English:** the pages, the Documents, all MD files (the builder's rules too), the names in the code and in the data, the elements' names (`name`).
- **Proper names stay as they are,** because they are not a matter of language: a product's name as the shop gives it (e.g. "Płyta wiórowa laminowana biała 18 mm"; it is what one orders by), and a format a shop imposes (e.g. the shop's cutting-list format, eRozkrój, with its Polish columns).
- **Translation is done by the LLM when it is needed** (going to the shop, handing the cutting list to the builder); translations are not kept in the project.

### Assumptions

- **One main page,** the root's index.html (its look) and index.js (its logic), with the modes 3D, 2D, Documents and Cabinets (the cabinet editor: its screen in index.html, its logic in index.js; Test is Documents' last sheet; room/ has no index.html, because a room is viewed from home with `?room=` and room/ has no page of its own). The project's root index.html only forwards to house/index.html. They work the same for the whole house and for a chosen part.
- **Two engines: house (the whole house) and room (one room).** room/ knows no particular room: no name, number or path of the kitchen or a wardrobe is in the code; everything comes in the data.
- **No sub-projects.** A room is three data files in room/, next to the engine. A new room is new data, not new code.
- **Three kinds of values.**

  | Kind | Decided by | Example | Where |
  |---|---|---|---|
  | the house's settings | us, for every room | the waste on boards and tiles, the shelf clearance, confirmats per carcass, the plinth height | the house's root node in house/house.js: the root of the cascade |
  | settings lower in the tree | the designer, for one room, group, cabinet, product or surface | the kitchen's carcass depth; one wardrobe run 300 deep; this hood's height; this floor's joint | the node they belong to, in the room's files |
  | the maker's data | the maker | an oven's size, how many hinges a door of a height needs, the hinge's drilling, the sink's cut-out | the library, with the product |

  The library speaks only of the outside world (what exists and what the maker states), never of our decisions. Our settings are one cascade along the tree (above); the maker's data is not part of it. Home passes the house's settings down with the room.
- **Options where the owner still chooses.** Not every value is decided: where the owner picks among options (the floor tiles, the decor, the handles' metal), the data lists the options and the default in the node they belong to. The choice made on the page is kept in the browser; the drawing and the Documents follow the choice.
- **Settings are values already decided (or an option with its default); rules are how the engine turns the design into concrete values** (pieces, sizes, holes). The rules are in the code of the modules and, in words for the builder, in an MD file named after its module: cabinets.md with cabinets.js, products.md with products.js, tiles.md with tiles.js. There is no common rules.md: building a cabinet and hanging a mirror are different crafts. A file that grows too big is split further the same way (e.g. mirrors.md). The numbers the rules use are in the settings or in the library.
- **Who changes a room's files:** the furniture file is the owner's (the editor), the scene is written by the LLM with the owner's agreement, the docs by the LLM; a room's settings and choices (which hinge, which runners, which board) are the designer's decisions: the LLM does not change them without asking. Changes to the house's settings and to the library are agreed too, because they act on every room.
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
- **cabinets.js makes cabinets only**, no lamps, products or tiles. A plasterboard casing joined to the furniture (the kitchen's casing to the ceiling, the WC casing in a bathroom) is a cabinet type too: built, drawn and counted by cabinets.js. It can do the kitchen and the wardrobes from the start: fronts and doors, drawers with and without a front, open shelves on a grid of heights shared by neighbouring carcasses, a depth for each run, carcasses under the slope.
- **New in cabinets: carcasses without fronts.** A carcass is a stack of parts in one column, each with its type and height (as in the prototype's kitchen). The new type `open`: an open part with shelves on the shared grid of heights (its pitch a setting, so neighbouring carcasses share it), no front, no hinges. The prototype's tag `doorDrawers` (board drawers on ball runners behind a door) becomes `boardDrawers`, allowed on `cabinet` and on `open`: the same drawers once in the code; cabinets.js tells the two apart by the type: on a `cabinet` a spacer strip on the hinges' side lets the drawers pass the hinges and the open door; on an `open` there is no door and no spacer. An open part with shelves only is `open`; an open part with drawers is `open` with `boardDrawers`.
- **The designer sets every size.** The engine never cuts or splits a carcass: what the designer writes is what it builds. The largest carcass one can build is a rule for the designer in cabinets.md, not a job of the engine.
- **Materials in the settings: each kind of part names its material.** The furniture file's settings say which product of the library each kind of part is made of (fronts, carcasses, back panels, worktop …), usually once for the whole room; by the cascade a group or one cabinet could override it, but normally need not. The kitchen's fronts: the English Navy shaker panel; bedroom_6's fronts: the same grey 18 mm chipboard as the carcasses, edged on all 4 sides: no new product. (The prototype did it the other way round, each material listing the parts made of it; this is the change its To do asked for.) How a front looks follows from its product, the maker's data: a shaker panel is a front with a frame (its frame width, `shakerRail: 50` in the prototype's kitchen settings, moves to that product); a plain board used as a front is a flat front edged all round. cabinets.js draws a front as its product says; there is no setting "kind of front".
- **Products and lamps:** what it is (sizes, look, light, price) the library says; where it stands the room's scene file says; how to draw and count it products.js does.
- **The room from the house** (walls, floor, ceiling, slope, windows, doors) is one described structure that home passes down with the house's settings, in the room's own coordinates (its origin as above). No plug-in interfaces, no registration.
- **Every module has a contract,** written in the project.md of its folder before its code: what it is given and what it gives back. E.g. cabinets.js gets the furniture branch of the tree (with its settings) and gives the solids to draw, the boards to cut and the counts (hinges, runners); products.js gets the products branch and the library and gives solids and counts; docs.js gets a room's .docs.js and the modules' counts and gives the sheets. A module reaches into no other module's inside, only its contract.
- **One place for everything:** moving doors and drawers, hiding the walls in front of the camera, the 2D plan, the tiles (of the house and of the rooms), the Documents' sheets. The prototype had them in several copies.
- **Built once, then only looked at.** The model is built once, when the page opens; then only the view changes: turning, zooming and walking move the camera; switching a layer shows or hides objects already built; nothing is rebuilt. Core joins the still solids of one material into one drawn object; the moving ones (doors, drawers) stay apart, built once too, and an animation only moves or turns them on the screen. A door's swing is drawing, not data: in the data a door has no rotation, only its hinge on one side of its box.
- **Nothing made up in the code:** every number, colour and name of the project is in the data, in the settings or in the library.
- **The editor** is the application's mode Cabinets (its screen in index.html, its logic in index.js; until 19 Nov a page of its own, cabinets.html): it works on the active room's furniture file. Everything about cabinets shares one stem: cabinets.js (the engine), cabinets.html (the editor), cabinets.md (the builder's rules), <kind>_<number>.cabinets.js (the data); an editor of another part would follow the same way (e.g. scene.html). The only entry page of the project is home. The site is static (GitHub Pages, no server), so the editor saves by download: the owner exports, the browser downloads the `.cabinets.js`, the owner puts it into the folder and commits it.
- **Every module checks itself.** Each module has its own checks of what it does (cabinets.js: boards do not intersect, a drawer fits its carcass; tiles.js: the tiles cover the surface; docs.js: the Documents agree with the model; tree.js: unique ids, offsets ≥ 0, a child inside its parent). The Test mode only collects them; a new module brings its checks with it.
- **Descriptions from the start**, each where it belongs:

  | File | Describes |
  |---|---|
  | project.md (root) | the whole project: folders, dependencies, file names, how we work, To do |
  | house/project.md | the house's code, the format of its data and of its settings |
  | room/project.md | the room engine's code and the format of a room's three files: what each field means |
  | core/project.md | the shared code |
  | library/project.md | the formats of the products, materials and textures; which fields are the maker's data |
  | room/cabinets.md, products.md, tiles.md | how it is built for real, one craft per file, named after its module; the same for every room; for the builder |
  | test.md | how to check the project |

  From the prototype: the carpenter's rules of kitchen/rules.md and wardrobe/rules.md go to room/cabinets.md (translated), the bathroom's fitting rules to products.md and tiles.md, the formats in the sub-projects' project.md to room/project.md; house/rules.md and core/rules.md are not carried over, nor the bathroom's installation points. A particular room's decisions from the prototype (e.g. the recuperator's ducts) are put into the data by the owner, or by the LLM once agreed, as geometry, not into the notes.

## 2. Order of building

Every step takes from the prototype what worked and compares the result with the prototype wherever the data is the same (the same numbers in the Documents, the same plan, the same Test).

### Step 0: the structure and the descriptions

- [ ] The whole folder structure of the new `home/`.
- [ ] A project.md in every folder: every file's name, what it does, what it depends on, the module's contract (what it gets and gives); the formats of the data files with every field.
- [ ] The root project.md: folders, dependencies, file names, the coordinates and the tree, how we work.

Done when: the owner has read and approved the structure and every project.md. No code before that, so that no code is written that will not be accepted.

### Step 1: the foundation

- [ ] core/: the data loader (key → file, format and version checked), the 3D view, the solids' geometry, the meshes, the 2D plan, the sheets with XLSX export, the look of the pages (from the prototype, without copies or anything of one project); core/tree.js (new).
- [ ] library/: products, materials and textures as data (from the prototype, tidied: every material and look once; the maker's data the prototype kept in the projects goes to the products, e.g. the shaker panel's frame width).
- [ ] test.md: how each step is checked against the prototype.

Done when: an empty page with the modes draws a test tree of solids (offsets summed, settings cascaded), and a sheet exports to XLSX.

### Step 2: the house

- [ ] house/: the house's data house.js (from the prototype) with the list of rooms (hall_3, living_5 and kitchen_6 as three rooms; the LLM draws the borders on the plan, kitchen_6 with the dining area, and the owner corrects them), the house's model, the home page house/index.html with the whole house: 3D, 2D, Documents (doors), Test; the house's tiles come with tiles.js in step 3.
- [ ] The house's settings at the top of house.js (from the prototype: the kitchen's settings split into the three kinds; those shared by every room go here).
- [ ] Choosing a part of the house: `?room=…` draws only the chosen rooms; the wall and the ceiling in front of the camera hide.
- [ ] The room's data for room/: one described structure (walls, floor, ceiling, slope, windows, doors), passed with the house's settings.

Done when: the house looks and counts as in the prototype (but for its tiles), and `?room=` shows an empty room.

### Step 3: the room engine

- [ ] room/room.js: takes the room and the settings from home, and the room's files; puts the room together.
- [ ] tiles.js and tiles.md: the room's tiles (and the house's, by one mechanism).
- [ ] products.js and products.md: products and lamps from the library, placed by the room's scene file.

Done when: the house's tiles are as in the prototype, and the prototype's bathroom (tiles, WC, basin, shower, mirror, lamps) stands in home, only still without its cabinet.

### Step 4: cabinets

- [ ] cabinets.js: the kitchen and the wardrobes from the start (all of the assumptions above), with the type `open`, the tag `boardDrawers` (with its spacer behind a door) and fronts drawn as their product says (shaker or plain).
- [ ] room/cabinets.md: how cabinets are made (from the prototype, in words, no numbers).
- [ ] The bathroom's vanity as an ordinary cabinet from the data.

Done when: the kitchen's cabinets have the same boards and sizes as in the prototype, and the wardrobes look as in the prototype.

### Step 5: the rooms as data

Moving the prototype's rooms into the new format is done once, by the LLM, from what the prototype already writes down; every moved room is drawn by the new engine and its solids compared with the prototype's:
- the kitchen: kitchen.dat.js is already a design (groups, columns, components): translated to the new format (offsets from the parent, the front as a side of the box, ids);
- the wardrobes: wardrobe.dat.js lists, beside its solids, every carcass (run, span, width, depth, height, shelves, drawers, doors): the runs and carcasses are rebuilt from it, the engine builds the solids;
- the bathroom's vanity: rebuilt as a cabinet from its few solids in bathroom.dat.js.

After the move the furniture files are the owner's: changed in the editor (step 6) and exported by the owner.

- [ ] kitchen_6: the prototype's kitchen in the new format: furniture (.cabinets.js) and scene (.scene.js), every value by its kind.
- [ ] bathroom_7, bathroom_5: both bathrooms.
- [ ] wardrobe_3, wardrobe_4, wardrobe_8, bedroom_6: the wardrobes and the bedroom's niche.

Done when: the whole house with all its rooms in home, Test without errors.

### Step 6: the Documents and the editor

- [ ] docs.js: makes the Documents' sheets (estimate, cutting list, the designer's notes, assembly cards) from the .docs.js of the chosen part of the house, with the library's prices and XLSX export.
- [ ] The rooms' .docs.js: written by the LLM for every room (from the prototype: the kitchen's estimate.dat.js as the starting point), with references to the model where a quantity follows from it.
- [ ] Test: every .docs.js against the model.
- [x] the cabinet editor: the application's mode Cabinets (index.html, index.js), for the active room.

Done when: the kitchen's Documents agree with the prototype's Info, and the editor saves data that home draws unchanged.
