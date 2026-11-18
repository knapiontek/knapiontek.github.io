# Home

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

The house "Dom w papawerach 5 (G)" from archon.pl, as built, with everything that goes into it: the building, the kitchen, the bathrooms, the wardrobes. One main page shows the whole house or a chosen part of it (one room or a group of rooms) in 3D, 2D, Documents and Test.

## Folders

| Folder | Holds |
|---|---|
| house/ | the house: its data (the rooms, the walls, the settings shared by every room), its model and the main page; it chooses a part of the house and passes it down |
| room/ | the room engine: it makes a room from what the house gives it and from the room's own data files; cabinets, products, tiles, Documents; the cabinet editor; the rooms' data, flat, `<kind>_<number>.<role>.js` |
| core/ | shared code: the data loader, the tree, geometry, meshes, the 3D view, the 2D plan, the sheets, the screen; knows no project |
| library/ | the outside world, as the shop and the maker give it: products, shops, materials, textures (data); and how each product is drawn (draw.js, code) |
| archon/ | the archon.pl drawings and their analysis: the source the house is drawn from |
| test.md | the LLM's own file: how to rebuild its automated tests |
| report.md | what was done in each step, for the owner |

room/ is being written room by room (To do), the kitchen first. The root index.html only forwards to house/index.html.

## Dependencies

One way only, as a tree:

```
house/  ──►  room/  ──►  core/, library/
```

- Nothing below calls the house back. The house passes a room and its settings down; the room engine passes each node to the module of its type.
- **Modules** never load anything: they are given their data as arguments. **Pages** load the data and hand it to the modules.
- core knows no project and no product; library knows no project.
- One chain for everything drawn: a node ─► the module of its type (house, cabinets, products, tiles) ─► solids ─► core: surface.js ─► scene.js (3D), plan2d.js (2D); the counts ─► sheet.js (Documents).

## Data

- Every data file is JSON handed to `HOME.data(…)`, so the pages work opened from disk.
- Every data file starts with its `format` and `version`. A page loads a file through the one loader of core and names the format and version it knows; any other is an error that names the file and both versions. The version goes up only when an old file would be read wrongly; then the LLM rewrites the few files once and the owner checks them. No converters in the code.
- The word `format` is for files only; `type` is for nodes (what a thing is).
- Data is loaded by a key through one rule in core (a room's role, a texture, a product group); code is loaded by the pages statically.
- A static site cannot list a folder, so every list is in the data: the house lists its rooms, the library its product groups.

## The tree and the coordinates

- The house's axes are the only coordinates: x along the house, y across, h up. Lengths in mm.
- One kind of node: `id`, `name`, `type`, `offset`, `size`, `settings`, `refs`, `children`. A node is placed by a translation only: its offset from its parent's origin and its size (above 0). No rotations, no signs for directions; the one exception, a group of furniture, is turned a quarter (with a mirror) to face its side of the room.
- **No absolute zero**: every node has its own zero, its extreme corner (left, back, bottom), and what it holds lies in positive numbers from it. The site's zero is the corner of its lawn; the house's is its own extreme corner (with the wings, the insulation and the footings: deep in the ground), so every part of the house is positive. The one negative number is where the house stands in the site: it starts below the lawn.
- **The tree says what belongs to what, not what lies inside what**: a room is in the house, a window in its wall, a sink and its tap in their carcass though they stand over it. A child may stand outside its parent.
- A front is a side of its box: `x0`, `x1`, `y0`, `y1` (the side at the smaller or the bigger x or y).
- The id is given once and never changed or reused; the path of ids from the root is a node's global identifier. A node refers to others only by their paths, in its `refs`, and Test checks that each exists.
- Settings are a cascade along the tree: a value set on a node is the default for its branch; a node below overrides it for itself and its branch. The root of the cascade is the house.

## Three kinds of values

| Kind | Decided by | Where |
|---|---|---|
| the house's settings | us, for every room | the house's root node |
| settings lower in the tree | the designer, for one room, group, cabinet, product or surface | the node they belong to |
| the maker's data | the maker | the library, with the product |

The library describes only the outside world: what is bought and the materials, as the shop and the maker give them; nothing of it is our decision. How a product is drawn (the shape of a tap, a handle, a hob's zones) is code: library/draw.js, whatever room the product stands in. The shapes the maker does not give live in that code with it, code and its numbers inseparable; the maker's data (sizes, holes, connections) stay in the product's data file.

## Data, tree, drawing

Three things, kept apart: the **data** says what is decided; the **tree** holds every thing there is, each in its place; the **drawing** makes each thing's solids.

**Where the data is**

| Data | Says | Where |
|---|---|---|
| the house | its elements (walls, slabs, ring beams, insulation, roof), openings, rooms, floors, the house's settings | house/house.js, written as a tree |
| a room's furniture | what the designer decides: the groups, their carcasses (width, height, what is inside), fronts, worktop, which product stands where | room/`<kind>_<number>`.cabinets.js |
| a room's scene | where each group stands in the room, the side its fronts face; the lights, the cameras | room/`<kind>_<number>`.scene.js |
| the maker's | a product's sizes, holes, connections, price | library/products |
| how a product looks | the shapes the maker does not give | library/draw.js, code |

**The tree.** One tree from the site down to the smallest thing drawn: site → house → floor → wall → opening; house → floor → room → group → carcass → board, front → hinge. The house's part is its data as written. A room's part is made by the room engine from the room's data: what follows from a rule (a board's size from its carcass and the settings) is computed once into the tree, never written in the data. Everything after reads the tree: 3D, 2D, Documents, Test.

**A node and the data.** A node says *where* (its offset and size: the box the thing takes) and *what* (its type, and for a thing bought, the product's key). Nothing of its shape: the shape belongs to whoever draws its type. A node names a product; it never repeats the product's data.

**Who draws what**, by the node's type:

| Type | Drawn by | How |
|---|---|---|
| an element of the house (block, slab, ring beam, EPS, roof) | the house (house/model.js) | a prism filling the node's box, its openings cut out |
| an opening (door, window, roof window) | the library, as a product (frame, leaf, glass, handle) | in the node's box; the house only cuts the hole |
| a room's surface (tiles, a floor's finish) | the room engine | the tiles laid over the node's box |
| a board (a carcass's side, shelf, back; a front's panel; worktop, plinth, strip, panel) | the cabinets (room/cabinets.js) | a box of the node's size, with its decor, edges, profile and holes |
| a product (appliance, sink, tap, trap, hob, hood; hinge, runner, handle, leg) | the library (library/draw.js) | from the product's data, in its own coordinates from the node's zero |
| a container (assembly, floor, room, group, carcass, drawer) | no one | only what it holds |

Each solid is then moved to its node: the offsets summed up the tree, and for a group facing another side, the room's quarter turn.

**Why.** Whoever knows a shape draws it, and only that: the house its walls, the cabinets their boards, the library a product the same in every room. The tree knows only boxes, so it can be checked (every solid inside its node), counted (the cutting list from the boards' nodes, the bill from the products' nodes) and cut (2D) without knowing a shape. A thing moved in the data moves with all it holds.

**The rule.** Nothing is drawn without its node; every node is a type someone draws, or a container. Test checks both.

## Language

- English wherever it can be: the pages, the Documents, every MD file, the code and the data.
- Proper names stay as they are: a product's name as the shop gives it.
- The Documents are our own (the cutting list too), not a shop's format.
- Translations are made by the LLM when needed and are not kept in the project.

## To do

1. **The borders of the open rooms**: the owner checks where the hall, the living room and the kitchen end (house.js, drawn in 2D).
2. **The room engine** (room/): the room from the house; tiles (the house's floors too) and products from the library placed by the room's scene file; the bathroom stands in the house without its cabinet.
3. **Cabinets and the rooms as data**, room by room, each compared with the prototype: the kitchen first, then the bathrooms' vanity, then the wardrobes and the bedroom's niche (their data rebuilt as carcasses).
4. **Documents and the editor**: docs.js with the estimate, our own cutting list and the assembly cards; each room's .docs.js; Test of the Documents against the model; the cabinet editor.

## How we work

- First we agree what to do; it is written in the MD; the owner approves; only then the work starts.
- The LLM works on its own copy and writes the changed files into the owner's folder. It cannot delete files: for a removed or renamed file it gives the git rm command. Before it starts, it compares its copy with the owner's folder.
- After every change: every page in every mode without errors, and what should not change compared with before (Documents, the 2D plan, the look). A difference is explained, never left.
- What is left at the end of a session is in To do; what was done is in report.md.

## Code style

- **MD files**: for a person, short and general: what each file is for and what it must keep. A project.md describes the files of its own folder and the formats of its data, field by field; no names of functions.
- **Comments**: short and exact, only where the code does not say it; never repeating the code.
- Readable: consistent indentation, short functions, one idea per line, names that match the page.
- **Computing apart from the browser**: a module computes without the browser (no DOM, no WebGL, nothing touched when its file loads); the browser only where nothing else can do it (drawing, the screen, loading the scripts). Tests run in Node first; the browser only for what only it can show.
- No hidden rules: what is built follows from the data (types, settings), never from names, labels or sizes. No duplicated values or code: what two pages share lives in core.
- One global, `HOME`: each module is `HOME.<file name>` (house/model.js: `HOME.model`), so a module's file name is unique in the project; a data file calls `HOME.data(…)`.
- Scripts in a page in one order: core/load.js first, then three.js, core, the page's own files.
- Library versions pinned (three.js r128, SheetJS 0.18.5).
- No abbreviations a reader has to decode; counters and coordinates may be one letter.
- A list or an array holds homogeneous values: the same type and meaning.
