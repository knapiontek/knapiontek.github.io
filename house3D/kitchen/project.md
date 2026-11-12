# Kitchen project

> Written and edited by hand. An LLM does not change this file. No code details here: names of functions, variables, data keys and formats live in the code itself.

How the files of this folder work together. The kitchen rules are in rules.md.

## Files

| File | Kind | Owns | Written by |
|---|---|---|---|
| design.js | data, this project | materials, settings, notes, groups, components | design.html (export); materials and settings by hand |
| cost.js | data, this project | prices, items, notes and settings of cost.html | LLM, per project |
| view.js | data, this project | placement of the groups in the house, how the appliances are fitted, lights and cameras of view.html, in house axes | LLM, per project |
| appliances.js | data, this project | the appliances as the manufacturer gives them: overall sizes as fixed values (no niches, no ranges) and documents, for cost.html and view.html | LLM, per project |
| textures.js | data, this project | texture images and their names only (the textures the materials name, the floor tiles to choose from), with what drawing them needs: the size an image covers, the grout colour of a tile; for view.html | LLM, per project |
| rules.md | text, every project | the kitchen rules in Polish, as the app names things | by hand |
| engine.js | code, every project | the model: carcasses, boards, fronts, strips, panels, plinths, worktops, plasterboard, holes, counts, checks | by hand |
| design.html | page, every project | editing the tables, the elevation drawing | by hand |
| cost.html | page, LLM generated | prices, cutting lists, notes, assembly help, carcass map | LLM, per project |
| view.html | page, LLM generated | the 3D view of the kitchen in its room and its geometry check | LLM, per project |
| ../house.js, ../rooms.js | data and code of house3D | the room: the house's own walls, slab, floor and window, copied as they are and trimmed to the kitchen | house3D |
| project.md | text | this description | by hand |
| index.html | page | directory listing of the repository folder (not part of the kitchen) | by hand |

## Data flow

```
                 design.js  (one per project)
                    │
      ┌─────────────┼──────────────┐
      ▼             ▼              ▼
  design.html    cost.html      view.html        each page reads design.js
      │             │              │             and passes it to the engine
      └──────► engine.js ◄─────────┘
      │        project → model
      ▼
  export → design.js                             only design.html writes design.js

  appliances.js ──► cost.html, view.html         passed on to engine.js; design.html does not read it
  textures.js   ──► view.html                    without it a material shows its colour
  ../house.js ─► ../rooms.js ─► view.html        the room, from the house
```

- Every page loads design.js directly, so the pages also work opened from disk.
- design.html shows the materials read only and keeps the settings as they are; cost.html and view.html only read design.js.
- engine.js does not know where the data comes from: a page hands it the project (and appliances.js, to fit the appliances in their places) and gets the model back. The engine has no numbers of this kitchen and draws nothing.
- cost.js and view.js hold only what their page needs; what both pages need (appliance sizes) is in appliances.js, and a project choice the engine needs belongs in design.js.
- appliances.js says what the manufacturer gives, design.js what the project chose; the same number can be in both. The notes of cost.html put them side by side.
- The room is the house's: view.html takes the walls, slab, floor and window from house3D (house.js, through rooms.js) as they are. The house wins: the kitchen never draws or measures a room of its own.
- Axes are the house's: x along the house, y across, z up, in mm and house positions. Inside a group the engine keeps u along, v up, n out from the wall; view.js places the groups in the house.

## What is project specific and what is not

- **Project specific:** design.js (its notes, groups and components are this kitchen), cost.js, view.js, appliances.js and textures.js.
- **Every project:** rules.md, engine.js, design.html and the code of cost.html and view.html, which holds no numbers or names of this kitchen.
- A new kitchen starts from rules.md: make a new design.js in design.html, then let an LLM generate cost.js, view.js, appliances.js and textures.js for it.

## The files in short

- **design.js**: plain data a person can read and edit: materials (what you buy and what each is used for), construction settings (setbacks, gaps, hinges, shelves, drawers, drilling, cut-outs), user notes (an LLM may read them, but no code parses them), the groups (number, name, back gap, column widths) and the components, one per line.
- **engine.js**: knows no kitchen. It places the components in their columns, joins them into carcasses, builds the boards, fronts, strips, panels, plinths, worktops and holes, and reports problems. Every decision comes from the type, the tags and the settings in design.js.
- **design.html**: knows the format, not the kitchen. Tables for materials (read only: they define what each type is made of), groups and columns, components and user notes; the elevation drawing; problems listed under the tables.
- **cost.html**: the estimate, the cutting list with drilling and cut-outs, the notes (the detailed geometry of the appliances, written by the LLM), assembly help and the carcass map; exports the XLSX. Its texts refer to the model, not to copied numbers.
- **view.html**: the kitchen in 3D in the house's room, with the carcasses, fronts, appliances at the manufacturer's sizes, holes and cut-outs; it checks the geometry (collisions, gaps, fronts off the line, parts sticking out). It shows only hard data, no guessing.

## Types, tags, materials

- **Material**: what you buy (a board with its thickness and colour).
- **Type**: what a component is, one per component. It decides what gets built (a carcass box, a front, a frame, a worktop ...).
- **Tag**: an extra on a type (sink, hob, bins, fridge, dishwasher ...). It adds a feature to the same build, and each tag is allowed only on some types.

A new feature that changes what gets built is a new type; one that adds to an existing build is a tag. Both are described in rules.md.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows, no abbreviations a reader has to decode; counters and coordinates may be one letter.
- No hidden rules: what gets built follows from the type, the tags and the settings in design.js. No guessing from names, labels or sizes.
- No numbers of this kitchen in the code and no duplicated values.
- A list or an array holds homogeneous values: the same type and meaning.
- Library versions pinned (deterministic pages).
- Language: everything the pages show is Polish; code and comments are English.
- Short comments that say why, not long narration.
- No backward compatibility code: when the format changes, design.js is migrated.
- rules.md and this file are kept up to date by hand.
