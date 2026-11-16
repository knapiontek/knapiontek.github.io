# House

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

The building "Dom w papawerach 5 (G)" from archon.pl, as built, in 3D and 2D, with floor tiles in every room without a sub-project of its own (a sub-project's floor is its own). Open **index.html**.

What the page must do is in rules.md (Polish, like the page); where the numbers come from, in archon/analysis.md.

## Files

| File | Holds |
|---|---|
| house.dat.js | the house as data: geometry, layers, views |
| model.js | house.dat.js turned into solids |
| shell.js | a sub-project's room: the house's own solids, trimmed; the implementation of the interface shell.js of the root |
| verify.js | the checks shown in Test |
| index.html | the page in the shared screen: 3D, 2D, Test, Info; panel tabs Warstwy (layers, cut), Wykończenie (tiles); ☀ and ? in the corner |

## How it fits together

```
analysis.md ─(by hand)─► house.dat.js ─► model.js ─► solids ─┬─► index.html          drawn by core
                                                          ├─► verify.js        checked, shown in Test
                                                          └─► shell.js ─► a sub-project's room (through the interface)
```

- One model for every view. A view only picks layers and cuts it.
- The page writes nothing back; the viewer's choices are its tiles, offsets, layers, sun and cut.
- model.js and index.html know nothing about this house: no numbers, names, products or colours of it. What differs is a value in the data, never a test in the code.

## The model in short

- **Elements**: the boxes of the analysis, each of a kind (footing, foundation, slab, block, EPS, ring beam, ceiling, chimney…). The kind sets the material, the section colour, the checked thickness, the layer, and whether openings cut it and windows sit in it.
- **Openings**: a glazed frame, a solid leaf with grooves and a handle, or both.
- **Portal**: the long walls run on into the wings at both ends, with the ring beam over them, EPS inside and a cap on each end.
- **Roof**: two slopes from pitch, eave and thickness, over both portals; roof windows and the chimney cut out of it.
- **Stair**: floating treads in flights; the landing is a flight of one tread.
- **Site**: the lawn stops at the box around the building.
- **Tiles**: a room is tiled on its own or with another (the walk-in wardrobes with the bedroom); tiles run through half of every doorway.
