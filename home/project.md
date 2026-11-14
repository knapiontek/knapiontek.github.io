# Home

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

"Dom w papawerach 5 (G)" from archon.pl, as built, with everything that goes into it: the building, the kitchen, the two bathrooms, the walk-in wardrobes. One screen for all of them (core/ui.js); every part is an application of its own.

This file: the folders, the rules every folder keeps, what is left to do, the code style (for every folder). Names of functions and data keys live in the code. What is done and can be seen in the application is not described here.

## Folders

| Folder | Holds |
|---|---|
| apps.dat.js | the applications: name, page, and the file that implements its furniture (the composition: the only place that knows them all) |
| furniture.js | the interface of a sub-project's furniture in the house: its functions and what each does |
| core/ | shared code: solids, meshes, the 3D scene, the 2D plan, the screen, the spreadsheet and Info; knows no project |
| library/ | everything bought: products, materials, textures; data only |
| house/ | the building, from the archon drawings |
| kitchen/ | the kitchen in the living room (ground floor) |
| bathroom/ | both bathrooms (ground floor, attic) |
| wardrobe/ | the three walk-in wardrobes (to do) |
| test.md | what to check after every change; an LLM rebuilds the checks from it (nothing is installed) |
| index.html | directory listing of the repository, not part of the application |

## Rules

### Dependencies

One way only; nobody depends on a sub-project, and no sub-project on another.

```
kitchen/, bathroom/ ──► house/ ──► core/, library/
        └────────────────────────► core/, library/
apps.dat.js, furniture.js ──► every page (the menu; the house: each application's furniture through the interface)
```

- **core** knows no project and no product; **library** knows no project; **house** knows core and the library.
- **A sub-project** knows core, the library and the house (house.dat.js, engine.js, house-clip.js). The house wins: a sub-project never measures or moves its room.

### A sub-project's room

house/house-clip.js gives a sub-project its room, and nothing else: the house's solids trimmed to the box of the room's link, grouped as a person sees them (each wall, the floor, the ceiling, each window with its wall), with the room's name, numbers, area and the 2D cut height of its floor. Nothing is moved, scaled or re-measured: house axes (x along, y across, z up), mm.

### Furniture in the house

A sub-project's furniture is drawn in the house through an interface, as in Java:

- **The interface** (furniture.js, in the root): the functions, exactly what each does and returns. Nothing else is part of it. On loading, an implementation is checked against it: a missing function is an error that names it.
- **The implementations**: one file of the same name in each sub-project (kitchen/furniture.js, bathroom/furniture.js) does exactly what the interface says. It loads its own inner files itself; nobody else knows them.
- **The list** (apps.dat.js, in the root, not in core): every application with its implementation file. It is where everything starts: a page reads it for the menu, the house loads the implementations from it. Core stays without any project.
- **The house** calls only the functions of the interface, and names no sub-project. A sub-project's own page may use more of its own code, but not through the interface.
- **Proof**: the house opens without errors when a sub-project's folder is missing, only without its furniture (a check in Test).
- One code draws the furniture on its own page and in the house: solids, moving fronts, doors and drawers, details, lamps, the finishes of its room (the bathrooms' wall tiles), in house axes and mm. It loads when its layer (Warstwy → Meble) is on.
- Only what is in the data is drawn: nothing is made up in the code to fit.

### Library

Everything bought, once, for every application and independent of them: products, boards, tiles, appliances, hardware, screws, chemistry, tools, and the services the owner cannot do himself (cutting, banding, CNC, lacquering), with the shops. One file per group.

- A set that works only together (a hinge with its mounting plate) is one product, with one price.
- A project names a product by its key and says only where it goes, what for and how many; nothing of the product (name, price, shop, link, sizes) is repeated in a project.
- A price changed once changes everywhere.

## To do

### Cleanup (first, in one go)

1. **The bathrooms' floor tiles are chosen twice**: in house.dat.js (the rooms) and in bathroom/data.dat.js (to decide). An idea: a room with a sub-project takes all its tiles (walls and floor) from the sub-project, which has many more of them; the house lays tiles only where no sub-project is, on its own or through a small "pseudo sub-project"; the house's estimate then has only those.
2. **The bath tap's spout over the rim** (attic): a check the old engine made from the bath's curved outline and its rim (it failed: the spout ended 117 mm short of the inner rim). Not measured yet: the model has the bath's outline only as a shape; to decide how the check reads it (or the tap moves).
3. **The attic bath between the WC casing and the vanity wall**: the model has 380 and 390 mm (the old engine said 390 = 390); to correct in the data or accept.
4. **Names of the files**: there are many more files and the naming has drifted apart. Data only is *.dat.js (done). A proposal of one rule for every folder: to decide; then all renamed at once with every reference.

### Implementation

5. **The furniture in the house's 2D plan** (kitchen and bathrooms).
6. **The walk**: furniture does not stop it yet; the attic is not tested.
7. **Speed**: the house with all its furniture, measured: the time to the first frame and the frame rate while orbiting.
8. **The wardrobes' open questions** (below), then **the wardrobes (wardrobe/)**: a sub-project as the bathrooms, its own application (Garderoby) and its furniture in the house.

### Last

9. **project.svg** (the dependency graph): refreshed at the end, when the files stop changing.

### The wardrobes

The three walk-in wardrobes of the attic (house.dat.js): room 3 (L-shaped, 3760–5350 × 440–3790), room 4 (3760–5350 × 5650–8660), room 8 (7490–9010 × 440–3290). Under the roof (42°): the ceiling falls toward the eaves.

Decided:
- a run of carcasses along each long side: 400 mm deep away from the door, 300 mm (or 200 mm if the room needs it) by the door; what matters is a passage between the runs;
- carcasses 800 mm wide; a run that is not a multiple of 800 ends with two shorter carcasses or one short one, chosen per run;
- a carcass is a carcass: two sides, a top and a bottom, rectangular; under the slope each is lower (the runs step down), its top 100 mm below the lowest point of the ceiling over it;
- inside: fixed shelves to stiffen it (one in the middle, two or three at full height) and movable shelves;
- no fronts (open shelving); drawers in some places at the bottom: ball-bearing runners, boxes of 16 mm board, opened by a click;
- below: adjustable feet and a 50 mm waterproof plinth; the back HDF 3 mm;
- the board: the cheapest plain white melamine (16 or 18 mm: the cheaper that holds);
- the runs leave room to walk in through the door, set for each wardrobe.

Open:
- which carcasses get drawers, rails or shelves, and the shelf pitch;
- 16 or 18 mm for the carcasses;
- the end of a run at a short wall: a gap, an end panel or a filler;
- hinges: with no fronts nothing needs them, to confirm.

No engine: the design is written as data, part by part with its sizes, by the LLM and corrected by the owner; the code only draws the parts with core and lists them in Info (Kosztorys, Lista cięć).

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
- Scripts in a page in one order: three.js, core, apps.dat.js, library, house, then the project's own files.
- Library versions pinned (three.js r128). No backward-compatibility code: when a data format changes, the data is migrated.
- No abbreviations a reader has to decode; counters and coordinates may be one letter.
- No guessing from names, labels or sizes: what is built follows from the data (types, tags, settings).
- A list or an array holds homogeneous values: the same type and meaning.
