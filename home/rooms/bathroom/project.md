# Bathroom project

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

Both bathrooms of the house, the ground floor and the attic, in one application; the page shows one floor at a time.

## Files

| File | Holds |
|---|---|
| bathroom.dat.js | the design of both bathrooms, part by part: what goes where, the tiles, boards and fittings chosen (products of the library), the solids, doors, drawers, lamps and cameras; what Info lists and what Test measures. No room (the house's), no product (the library's) |
| room.js | the bathrooms' furniture, the implementation of the interface room.js: the design drawn as it is, the same on its page and in the house |
| index.html | the bathroom in its room from the house: 3D, 2D, Info, Test |

## How it fits together

```
shell.js ─► the room (the house's) ──────────┐
bathroom.dat.js, library ─► room.js ─────────┴─► index.html, the house ─► core
```

- Nothing is computed to fit: what is drawn and listed is what bathroom.dat.js says.
- The 2D plan is cut from the same solids at the house's height; Test measures the checks of bathroom.dat.js on the model.
- The viewer's choices (tiles, decor, fittings, style, layers, mode) are kept per floor.
