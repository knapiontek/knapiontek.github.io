# Wardrobe project

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

The three walk-in wardrobes of the attic in one application (Garderoby); the page shows one wardrobe at a time, Info all three as one order. How a carcass is built is in rules.md (Polish, for the carpenter).

## Files

| File | Holds |
|---|---|
| wardrobe.dat.js | the design of the three wardrobes, board by board: each carcass with its boards, shelves, drawers, feet and plinth, what each is cut from and its cut size; the drawers that slide; the cameras; what Info buys and what Test checks. No room (the house's), no product or look (the library's) |
| room.js | the wardrobes' furniture, the implementation of the interface room.js: the design drawn as it is, the same on its page and in the house |
| index.html | a wardrobe in its room from the house: 3D, 2D, Info (Kosztorys, Lista cięć, Korpusy), Test |

## How it fits together

```
shell.js ─► the rooms (the house's) ─────────┐
wardrobe.dat.js, library ─► room.js ─────────┴─► index.html, the house ─► core
```

- No engine: the design is written as data, part by part with its sizes, by the LLM and corrected by the owner. Nothing is computed to fit: what is drawn and listed is what wardrobe.dat.js says.
- A wardrobe is the house's room of its number; its door, walls, ceiling and roof come with the shell.
- The floor stays the house's (tiled with the bedroom, or its own): the wardrobes give the house no finishes.
- Info counts what is drawn: the cutting list groups the boards by size, the estimate counts the parts and measures the edges and cuts.
- Test: no two solids share volume, every carcass top keeps its gap under the ceiling, the passage between the runs keeps its width; the dependencies.

## Open

- the steps under the slope (narrower carcasses, or a sloping top);
- which carcasses get drawers, rails or shelves, and the shelf pitch;
- 16 or 18 mm for the carcasses (the draft: 18);
- the end of a run at a short wall: a gap, an end panel or a filler (the draft: a gap);
- the white board, the HDF, the runners, the feet and the plinth: products and prices to check.
