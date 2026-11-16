# Home

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

"Dom w papawerach 5 (G)" from archon.pl, as built, with everything that goes into it: the building, the kitchen, the two bathrooms, the walk-in wardrobes. One screen for all of them (core/ui.js); every part is an application of its own.

This file: the folders, the rules every folder keeps, what is left to do, the code style (for every folder). Names of functions and data keys live in the code. What is done and can be seen in the application is not described here.

## Folders

| Folder | Holds |
|---|---|
| apps.dat.js | the applications: name, page, and the file that implements its room (the composition: the only place that knows them all) |
| room.js | the interface of a room sub-project in the house: its functions and what each does |
| shell.js | the interface of a room's shell from the house: its functions and what each does |
| archon/ | the archon.pl drawings and their analysis: the source everything is drawn from, independent of the code |
| core/ | shared code: solids, meshes, the 3D scene, the 2D plan, the screen, the spreadsheet and Info; knows no project |
| library/ | everything bought: products, materials, textures; data only |
| house/ | the building, from archon/; the rooms without a sub-project |
| rooms/ | the room sub-projects, one folder each: rooms/kitchen/ (the living room's kitchen), rooms/bathroom/ (both bathrooms), rooms/wardrobe/ (the three walk-in wardrobes, to do) |
| test.md | what to check after every change; an LLM rebuilds the checks from it (nothing is installed) |
| index.html | opens the house (a short page that goes to house/) |

## Rules

### Dependencies

One way only; nobody depends on a sub-project, and no sub-project on another.

```
rooms/kitchen/, rooms/bathroom/ ──► core/, library/
house/                          ──► core/, library/
room.js, shell.js               ──► core/ (the interfaces: they know no implementation)
core/                           ──► library/ (only its layout: core loads the textures a page asks for)
apps.dat.js ──► every page (the menu; the house: each room's implementation; a room: the shell's implementation)
```

- **core** knows no project and no product; **library** knows no project; **house** knows core and the library.
- Loaded on demand through an interface (the path from apps.dat.js) is not a dependency: the house loads each room's implementation, a sub-project loads the shell's.
- **A sub-project** knows core, the library and the two interfaces; no file of the house. The house wins: a sub-project never measures or moves its room.
- **The house** knows no sub-project; it shows each one through the room interface, and gives each its room through the shell interface.

### Units and axes

- mm, whole numbers, everywhere: data, code, pages and documents; only the 3D scene is in metres.
- House axes everywhere: x along the house, y across, z up, positions of the house. A sub-project may compute in the frame of a group or of its room, but that frame is only turned and shifted in house axes (never mirrored); a page draws in house axes.

### A sub-project's room (the shell)

The house gives a sub-project its room through an interface, the same way a sub-project gives the house its furniture:

- **The interface** (shell.js, in the root): the functions, exactly what each does and returns. Nothing else is part of it. On loading, the implementation is checked against it: a missing function is an error that names it.
- **The implementation**: one, in the house (house/shell.js). It loads the house's own files itself (the building's data and its model); nobody else knows them.
- **The list** (apps.dat.js) names the implementation; a sub-project's page loads it from there, never by a path into the house.
- **What a sub-project gets**, and nothing else: the house's solids trimmed to the box of its room, grouped as a person sees them (each wall, the floor, the ceiling, each window with its wall, the roof over it), with the room's name, numbers, level, area, the 2D cut height of its floor, the underside of the roof and the light inside. Nothing is moved, scaled or re-measured.
- **Proof**: a sub-project's page and its room in the house look the same as before; no script of a sub-project names a file of the house (a check in Test).

### A room with a sub-project

The house is above the rooms. A room with a sub-project (rooms/) defines everything in it: its furniture, its finishes (the tiles of the walls and of the floor), its lamps; the house draws only its shell (walls, slabs, windows, roof) and, in the rooms without a sub-project, what the house's data gives them (the floor tiles). Where a sub-project takes only a part of an open room (the kitchen in the living room with the hall), the floor of that room stays the house's: one floor across the whole room.

The house shows a room sub-project through an interface, as in Java:

- **The interface** (room.js, in the root): the functions, exactly what each does and returns. Nothing else is part of it. On loading, an implementation is checked against it: a missing function is an error that names it.
- **The implementations**: one file of the same name in each sub-project (rooms/kitchen/room.js, rooms/bathroom/room.js) does exactly what the interface says. It loads its own inner files itself; nobody else knows them.
- **The list** (apps.dat.js, in the root, not in core): every application with its implementation file. It is where everything starts: a page reads it for the menu, the house loads the implementations from it. Core stays without any project.
- **The house** calls only the functions of the interface, and names no sub-project. A sub-project's own page may use more of its own code, but not through the interface.
- **Proof**: the house opens without errors when a sub-project's folder is missing, only without its room (a check in Test).
- One code draws the room on its own page and in the house: solids, moving fronts, doors and drawers, details, lamps, its finishes. It loads when its layer (Warstwy → Meble) is on.
- Only what is in the data is drawn: nothing is made up in the code to fit.

### Names of the files

A name says what a file is; the same role has the same name in every folder.

- The page of an application: index.html (its folder opens it); the kitchen's design page: design.html. Data only: *.dat.js: a room's design design.dat.js, its place in the house and its views scene.dat.js, its estimate estimate.dat.js, the building building.dat.js.
- Code is named by what it does: model.js computes the model from the data, verify.js checks it (Test), info.js builds the sheets of Info, room.js gives the house a room (the interface in the root, an implementation in each sub-project), shell.js gives a sub-project the shell of its room (the interface in the root, the implementation in the house).
- core/, library/, apps.dat.js and the MD files keep their names. No directory listings: the repository shows the files.

### Library

Everything bought, once, for every application and independent of them: products, boards, tiles, appliances, hardware, screws, chemistry, tools, and the services the owner cannot do himself (cutting, banding, CNC, lacquering), with the shops. One file per group.

- A set that works only together (a hinge with its mounting plate) is one product, with one price.
- A project names a product by its key and says only where it goes, what for and how many; nothing of the product (name, price, shop, link, sizes) is repeated in a project.
- A price changed once changes everywhere.

## To do

1. **The wardrobes' open questions**, then **the wardrobes (rooms/wardrobe/)**: a sub-project as the bathrooms, its own application (Garderoby) and its furniture in the house; later.
2. **A wider view on a walk**: in a small room (a bathroom) one cannot step back to see it. Stepping the camera back and cutting off what is nearer than the eye was tried and looked bad (the walls behind cut oddly); next: a wide lens, a fisheye or the like.
3. **The design editor for more than the kitchen**: design.html moves from the kitchen to the root, to edit other designs too, not only the kitchen. The files it works on will then be named after what they hold: the kitchen's design.dat.js becomes, most likely, kitchen.dat.js. Its materials get simpler: each kind of part names its material, instead of each material listing the parts made of it (as now: a board key with its uses). To agree first.
4. **project.svg** (the dependency graph): refreshed after every change of files.

## How we work

- First we agree what to do; it is written in the MD; the owner approves and commits; only then the work starts.
- The LLM works on its own copy and writes the changed files into the owner's folder. It cannot delete files: for a removed or renamed file it gives the git rm command. Before it starts, it compares its copy with the owner's folder (the owner may have changed or committed something).
- After every change: every page in every mode without errors, and what should not change compared with before (Info, the 2D plan, the look). A difference is explained, never left.
- What is left at the end of a session is in To do, so a new session starts from here.

## Code style (every folder)

- **MD files**: for a person, general; no references to other files or their sections. An LLM changes one only after asking (the note at the top of each): first we agree what to do and it is written in the MD, the owner approves, then the code is written.
- Readable: consistent indentation, short functions, one idea per line, names that match the page.
- No hidden rules: what is built follows from the data. No numbers of a project in the code, no duplicated values or code: what two pages share lives in core (or in the house, for a room).
- Pages in Polish; code and comments in English; short comments that say why.
- Scripts in a page in one order: three.js, core, apps.dat.js and the interfaces (room.js, shell.js), library, then the page's own files.
- Library versions pinned (three.js r128). No backward-compatibility code: when a data format changes, the data is migrated.
- No abbreviations a reader has to decode; counters and coordinates may be one letter.
- No guessing from names, labels or sizes: what is built follows from the data (types, tags, settings).
- A list or an array holds homogeneous values: the same type and meaning.
