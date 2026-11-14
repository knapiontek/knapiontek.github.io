# Kitchen project

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

> No code details here: names of functions, variables, data keys and formats live in the code itself.

How the files of this folder work together.

## Files

| File | Kind | Owns | Written by |
|---|---|---|---|
| design.js | data, this project | materials and appliances (product keys of the library; how each is used: uses, or built in: feet), settings, notes, groups, components | design.html (export); materials, appliances and settings by hand |
| cost.js | data, this project | prices, items, notes and settings of the estimate (Info of view.html) | LLM, per project |
| view.js | data, this project | placement of the groups in the house, how the appliances are fitted, the floor tiles to choose from (library keys), the views (3D with G1/G2/Wyspa in the menu, 2D, Test, Info; the panel's tabs), lights and cameras of view.html, in house axes | LLM, per project |
| rules.md | text, every project | the kitchen rules in Polish, as the app names things | by hand |
| engine.js | code, every project | the model: carcasses, boards, fronts, strips, panels, plinths, worktops, plasterboard, holes, counts, checks | by hand |
| design.html | page, every project | editing the tables, the elevation drawing | by hand |
| cost-sheets.js | code, every project | cost.js and the model as the shared sheets of core/info.js (Kosztorys, Lista cięć) and Notatki, and the assembly cards, shown in Info of view.html | by hand |
| parts.js | code, every project | the kitchen as a part: its solids, moving fronts and details from design.js, view.js and engine.js, in house axes and mm; drawn the same by view.html (with its room) and by the house | by hand / LLM |
| view.html | page, every project | the kitchen in its room (its solids from parts.js): 3D, the 2D plan, Test (its geometry check) and Info (the estimate, assembly, carcasses), drawn by core like the house | LLM, every project |
| house/house.js, house/house-clip.js | the house | the room: the house's own walls, slab, floor and window, trimmed to the kitchen | house |
| library/ | data, every project | what is bought: the appliances as the maker gives them (sizes, documents), tiles, boards, materials, texture images | library |
| core/ | code, every project | drawing: solids, welded meshes, edges, light, camera, the 2D plan, the screen, the spreadsheet | core |
| project.md | text | this description | by hand |
| index.html | page | directory listing of the repository folder (not part of the kitchen) | by hand |

## Data flow

Nothing is stored as geometry: every time a page opens, the kitchen is computed again from the data.

```
design.js, view.js        the data: what stands where (written in design.html; view.js by the LLM)
      │
      ▼
engine.js                 computes the model: carcasses, boards, fronts, sizes, hardware, holes; draws nothing
      │
      ▼
parts.js                  turns the model into solids and 3D meshes of core:
      │                   places the groups in the room, makes the moving fronts, handles a click
      ├──► view.html         + its room (from the house), the panel, the 2D plan, Info, Test
      └──► house/view.html   only the furniture, without the room (the house draws its own);
                             loaded through apps.js and core/parts.js, the house names no kitchen file

design.html ──► engine.js ──► export ──► design.js     only design.html writes design.js
library ──► engine.js, parts.js                         appliances, boards, textures, materials
cost.js ──► cost-sheets.js ──► view.html (Info)         estimate, cutting list, notes, assembly; core/info.js shows them
house/house.js ──► house/house-clip.js ──► parts.js     the room, from the house
```

engine.js says what is built; parts.js draws it in 3D. The drawing used to be inside view.html, so the house could not use it without copying; now both pages call the same code, and a change in design.js shows in the kitchen and in the house.

- Every page loads design.js directly, so the pages also work opened from disk.
- design.html shows the materials read only and keeps the settings as they are; view.html (with cost-sheets.js) only reads design.js.
- engine.js does not know where the data comes from: a page hands it the project (and its appliances from the library, KE.appliances, to fit them in their places) and gets the model back. The engine has no numbers of this kitchen and draws nothing.
- cost.js and view.js hold only what they need; what both pages need (appliance sizes) is in the library, and a project choice the engine needs belongs in design.js.
- the library says what the manufacturer gives, design.js what the project chose (the product, its feet); the same number can be in both. The notes of the estimate (Info) put them side by side.
- The room is the house's: view.html takes the walls, slab, floor and window from the house (house.js, through house-clip.js) as they are. The house wins: the kitchen never draws or measures a room of its own.
- Axes are the house's: x along the house, y across, z up, in mm and house positions. Inside a group the engine keeps u along, v up, n out from the wall; view.js places the groups in the house.

## What is project specific and what is not

- **Project specific:** design.js (its notes, groups and components are this kitchen), cost.js and view.js; the products it uses are in library.
- **Every project:** rules.md, engine.js, design.html, view.html and cost-sheets.js, which hold no numbers or names of this kitchen.
- A new kitchen starts from rules.md: make a new design.js in design.html, then let an LLM generate cost.js and view.js for it, adding to library what it buys that is not there yet.

## The files in short

- **design.js**: plain data a person can read and edit: materials (what you buy and what each is used for), construction settings (setbacks, gaps, hinges, shelves, drawers, drilling, cut-outs), user notes (an LLM may read them, but no code parses them), the groups (number, name, back gap, column widths) and the components, one per line.
- **engine.js**: knows no kitchen. It places the components in their columns, joins them into carcasses, builds the boards, fronts, strips, panels, plinths, worktops and holes, and reports problems. Every decision comes from the type, the tags and the settings in design.js.
- **design.html**: knows the format, not the kitchen. Tables for materials (read only: they define what each type is made of), groups and columns, components and user notes; the elevation drawing; problems listed under the tables.
- **cost-sheets.js** (shown in Info of view.html): the estimate, the cutting list with drilling and cut-outs, the notes (the detailed geometry of the appliances, written by the LLM) as sheets of core/sheet.js, with editable inputs and live formulas, the same in the XLSX; and the assembly cards. Its texts refer to the model, not to copied numbers.
- **view.html**: the kitchen in the house's room, drawn by core like the house, in the shared screen: 3D (the groups G1, G2, Wyspa), 2D, Test, Info. Every part is a solid of core in house axes, doors and drawers are solids that turn or slide. Carcasses, fronts, appliances at the manufacturer's sizes, holes and cut-outs. The 2D plan is cut from the same solids at the house's height. Test checks the geometry (collisions, gaps, fronts off the line, parts sticking out) and lists parts the engine gave no size. Round details (handles, knobs, legs, lamps) are plain meshes beside the solids. The panel's tabs are Warstwy and Wykończenie; Info holds the estimate (cost-sheets.js), the assembly, the summary, carcasses, materials, dimensions and notes.

## Types, tags, materials

- **Material**: what you buy (a board with its thickness and colour).
- **Type**: what a component is, one per component. It decides what gets built (a carcass box, a front, a frame, a worktop ...).
- **Tag**: an extra on a type (sink, hob, bins, fridge, dishwasher ...). It adds a feature to the same build, and each tag is allowed only on some types.

A new feature that changes what gets built is a new type; one that adds to an existing build is a tag.
