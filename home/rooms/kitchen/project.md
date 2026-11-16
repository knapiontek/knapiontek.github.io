# Kitchen project

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

The kitchen in the living room: designed in design.html, shown in index.html and, as furniture, in the house.

## Files

| File | Holds | Written by |
|---|---|---|
| kitchen.dat.js | the design: materials and appliances (products of the library and how each is used), settings, notes, groups, components | design.html (export); materials, appliances and settings by hand |
| scene.dat.js | where the groups stand in the house, how the appliances are fitted, the floor tiles to choose from, the views, lights and cameras | LLM |
| estimate.dat.js | the estimate's items (a product or a material's board, where it goes, how many) and its notes; no prices, shops or links | LLM |
| model.js | the model computed from the design: carcasses, boards, fronts, strips, panels, plinths, worktops, plasterboard, holes, counts, problems; knows no kitchen, draws nothing | by hand |
| room.js | the kitchen's furniture, the implementation of the interface room.js: the model as solids, moving fronts and details, the same on its page and in the house | by hand / LLM |
| info.js | Info of index.html: the estimate, the cutting list, the notes and the assembly cards as sheets with editable inputs and live formulas; its texts refer to the model, never to copied numbers | by hand |
| index.html | the kitchen in its room from the house: 3D, 2D, Test (the geometry: collisions, gaps, fronts off the line, parts sticking out, parts with no size), Info | LLM |
| design.html | the editor, in the shared screen of core: tables of materials (read only), groups, columns, components and notes; the elevation; the problems in the panel. Opens the kitchen by default; knows the format, not the kitchen | by hand |
| rules.md | the kitchen as it is built, in Polish, as the app names things | by hand |

## Data flow

Nothing is stored as geometry: every time a page opens, the kitchen is computed again from the data.

```
design.html ──► model.js ──► export ──► kitchen.dat.js      only design.html writes it
kitchen.dat.js, scene.dat.js, library ──► model.js ──► room.js ──┬─► index.html   with its room (shell.js)
                                                                  └─► the house   only the furniture (room.js)
estimate.dat.js, model.js ──► info.js ──► index.html (Info)
```

- Every page loads kitchen.dat.js directly, so the pages also work opened from disk; only design.html writes it.
- model.js does not know where the data comes from: a page hands it the project and its appliances from the library and gets the model back.
- The library says what the manufacturer gives; kitchen.dat.js what the project chose (the product, how it is built in). A project choice the engine needs belongs in kitchen.dat.js, never in the code.

## What is project specific and what is not

- **This kitchen**: kitchen.dat.js, scene.dat.js and estimate.dat.js; the products it uses are in the library.
- **Every kitchen**: rules.md, model.js, room.js, info.js, design.html and index.html, which hold no numbers or names of this kitchen.
- A new kitchen starts from rules.md: a new kitchen.dat.js made in design.html, then an LLM writes scene.dat.js and estimate.dat.js for it, adding to the library what it buys that is not there yet.

## Types, tags, materials

- **Material**: what you buy (a board with its thickness and colour).
- **Type**: what a component is, one per component. It decides what gets built (a carcass box, a front, a frame, a worktop ...).
- **Tag**: an extra on a type (sink, hob, bins, fridge, dishwasher ...). It adds a feature to the same build, and each tag is allowed only on some types.

A new feature that changes what gets built is a new type; one that adds to an existing build is a tag.
