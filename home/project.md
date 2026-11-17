# Home

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

The house "Dom w papawerach 5 (G)" from archon.pl, as built, with everything that goes into it: the building, the kitchen, the bathrooms, the wardrobes. One main page shows the whole house or a chosen part of it (one room or a group of rooms) in 3D, 2D, Documents and Test.

## Folders

| Folder | Holds |
|---|---|
| house/ | the house: its data (the rooms, the walls, the settings shared by every room), its model and the main page; it chooses a part of the house and passes it down |
| room/ | the room engine: it makes a room from what the house gives it and from the room's own data files; cabinets, products, tiles, Documents; the cabinet editor; the rooms' data, flat, `<kind>_<number>.<role>.js` |
| core/ | shared code: the data loader, the tree, geometry, meshes, the 3D view, the 2D plan, the sheets, the screen; knows no project |
| library/ | what is bought, as the shop and the maker give it: products, shops; the materials and the textures; data only |
| archon/ | the archon.pl drawings and their analysis: the source the house is drawn from |
| test.md | the LLM's own file: how to rebuild its automated tests |
| report.md | what was done in each step, for the owner |

house/ and room/ are written in the next steps (To do); their project.md comes with their code.

## Dependencies

One way only, as a tree:

```
house/  ──►  room/  ──►  core/, library/
```

- Nothing below calls the house back. The house passes a room and its settings down; the room engine passes each node to the module of its type.
- **Modules** never load anything: they are given their data as arguments. **Pages** load the data and hand it to the modules.
- core knows no project and no product; library knows no project.

## Data

- Every data file is JSON handed to `HOME.data(…)`, so the pages work opened from disk.
- Every data file starts with its `format` and `version`. A page loads a file through the one loader of core and names the format and version it knows; any other is an error that names the file and both versions. The version goes up only when an old file would be read wrongly; then the LLM rewrites the few files once and the owner checks them. No converters in the code.
- The word `format` is for files only; `type` is for nodes (what a thing is).
- Data is loaded by a key through one rule in core (a room's role, a texture, a product group); code is loaded by the pages statically.
- A static site cannot list a folder, so every list is in the data: the house lists its rooms, the library its product groups.

## The tree and the coordinates

- The house's axes are the only coordinates: x along the house, y across, h up. Lengths in mm.
- One kind of node: `id`, `name`, `type`, `offset`, `size`, `settings`, `children`. A node is placed by a translation only: its offset from its parent's smallest corner (never below 0) and its size (always above 0). No rotations, no signs.
- A front is a side of its box: `x0`, `x1`, `y0`, `y1` (the side at the smaller or the bigger x or y).
- The id is given once and never changed or reused; the path of ids from the root is a node's global identifier. References use ids only.
- Settings are a cascade along the tree: a value set on a node is the default for its branch; a node below overrides it for itself and its branch. The root of the cascade is the house.

## Three kinds of values

| Kind | Decided by | Where |
|---|---|---|
| the house's settings | us, for every room | the house's root node |
| settings lower in the tree | the designer, for one room, group, cabinet, product or surface | the node they belong to |
| the maker's data | the maker | the library, with the product |

The library describes only what is bought, as the shop and the maker give it. How a product is drawn (the shape of a tap, a handle, a hob's zones) is the business of the code that draws it, not data.

## Language

- English wherever it can be: the pages, the Documents, every MD file, the code and the data.
- Proper names stay as they are: a product's name as the shop gives it, a format a shop imposes.
- Translations are made by the LLM when needed and are not kept in the project.

## To do

1. **The house** (house/): the house's data with its rooms as nodes (the hall, the living room and the kitchen as three rooms with borders where there is no wall), its settings, its model; the main page with 3D, 2D, Documents and Test; `?room=` draws the chosen part; the root index.html forwards to it.
2. **The room engine** (room/): the room from the house; tiles and products from the library placed by the room's scene file; the bathroom stands in the house without its cabinet.
3. **Cabinets and the rooms as data**, room by room, each compared with the prototype: the kitchen first, then the bathrooms' vanity, then the wardrobes and the bedroom's niche (their data rebuilt as carcasses).
4. **Documents and the editor**: docs.js with the estimate, the cutting list and the assembly cards; each room's .docs.js; Test of the Documents against the model; the cabinet editor.
5. **The materials**: they are looks, not purchases; to decide whether they stay in library/ (report.md).

## How we work

- First we agree what to do; it is written in the MD; the owner approves; only then the work starts.
- The LLM works on its own copy and writes the changed files into the owner's folder. It cannot delete files: for a removed or renamed file it gives the git rm command. Before it starts, it compares its copy with the owner's folder.
- After every change: every page in every mode without errors, and what should not change compared with before (Documents, the 2D plan, the look). A difference is explained, never left.
- What is left at the end of a session is in To do; what was done is in report.md.

## Code style

- **MD files**: for a person, short and general: what each file is for and what it must keep. A project.md describes the files of its own folder and the formats of its data, field by field; no names of functions.
- **Comments**: short and exact, only where the code does not say it; never repeating the code.
- Readable: consistent indentation, short functions, one idea per line, names that match the page.
- No hidden rules: what is built follows from the data (types, settings), never from names, labels or sizes. No duplicated values or code: what two pages share lives in core.
- One global, `HOME`: each module of core is `HOME.<file name>`.
- Scripts in a page in one order: core/data.js first, then three.js, core, the page's own files.
- Library versions pinned (three.js r128, SheetJS 0.18.5).
- No abbreviations a reader has to decode; counters and coordinates may be one letter.
- A list or an array holds homogeneous values: the same type and meaning.
