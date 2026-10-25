# Kitchen project

> Written and edited by hand. An LLM does not change this file. No code details here: names of functions, variables, data keys and formats live in the code itself.

How the files of this folder work together. rules.md holds the kitchen rules; this file says what each file is for.

## Files

| File | Kind | Owns | Written by |
|---|---|---|---|
| design.js | data, this project | materials, rules, notes, columns, components | design.html (export) |
| cost.js | data, this project | prices, items, notes and settings of cost.html | LLM, per project |
| view.js | data, this project | room, runs, appliances, lights and cameras of view.html | LLM, per project |
| rules.md | text, every project | the kitchen rules in Polish, as the app names things | by hand |
| engine.js | code, every project | the model: carcasses, boards, fronts, frames, panels, plinths, worktops, plasterboard, holes, counts, checks | by hand |
| design.html | page, every project | editing the tables, the elevation drawing | by hand |
| cost.html | page, LLM generated | prices, cutting lists, notes, assembly help, carcass map | LLM, per project |
| view.html | page, LLM generated | the 3D view of the room and its geometry check | LLM, per project |
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
               project → model
      │
      ▼
  export → design.js                             only design.html writes design.js
```

- Every page loads design.js directly, so the pages also work opened from disk.
- Only design.html changes design.js (import / export). cost.html and view.html only read it.
- engine.js does not know where the data comes from: a page hands it the project and gets the model back. The engine has no numbers of this kitchen and draws nothing.
- cost.html and view.html each keep their own data in cost.js and view.js, for what only that page needs: prices and notes, or the room, lights, cameras and appliance sizes. A value that both pages need belongs in design.js.

## What is project specific and what is not

- **Project specific:** design.js (its notes, columns and components are this kitchen), cost.js and view.js.
- **Every project:** rules.md, engine.js, design.html and the code of cost.html and view.html. The code holds no numbers or names of this kitchen.
- A new kitchen starts from rules.md: make a new design.js in design.html, then let an LLM generate cost.js and view.js for it.

## The files in short

- **design.js**: plain data a person can read and edit: materials (what you buy), construction rules (setbacks, gaps, hinges, shelves, drawers, drilling, cut-outs), notes (the design notes; the group notes give each group its role), column widths, and the components, one per line.
- **engine.js**: deterministic, the same project gives the same model. It places the components in their columns, joins them into carcasses, builds the boards, fronts, frames, panels, plinths, worktops and holes, and reports problems. Every decision comes from the type, the tags and the rules in design.js.
- **design.html**: knows the format, not the kitchen. Tables for materials, groups and columns, components and notes; the elevation drawing; problems listed under the tables.
- **cost.html**: the estimate, the cutting list with drilling and cut-outs, the notes (the detailed geometry of the appliances, written by the LLM), assembly help and the carcass map; exports the XLSX. Its texts refer to the model, not to copied numbers.
- **view.html**: the room in 3D with the carcasses, fronts, appliances at the manufacturer's sizes, holes and cut-outs; it checks the geometry (collisions, gaps, fronts off the line, parts sticking out).

## Types, tags, materials

- **Material**: what you buy (a board with its thickness and colour).
- **Type**: what a component is, one per component. It decides what gets built (a carcass box, a front, a frame, a worktop ...).
- **Tag**: an extra on a type (sink, hob, bins, fridge, dishwasher ...). It adds a feature to the same build, and each tag is allowed only on some types.

A new feature that changes what gets built is a new type; one that adds to an existing build is a tag. Both are described in rules.md.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows, no abbreviations a reader has to decode.
- No hidden rules: what gets built follows from the type, the tags and the rules in design.js. No guessing from names, labels or sizes.
- No numbers of this kitchen in the code and no duplicated values.
- Library versions pinned (deterministic pages).
- Language: everything the pages show is Polish; code and comments are English.
- Short comments that say why, not long narration.
- No backward compatibility code: when the format changes, design.js is migrated.
- rules.md and this file are kept up to date by hand.
