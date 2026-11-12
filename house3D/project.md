# House 3D

The house "Dom w papawerach 5 (G)" from archon.pl, as built, in 3D and 2D, with floor tiles laid in every room. Open **view.html**.

What the page must do: [rules.md](rules.md) (in Polish, like the page). The geometry: [archon/analysis.md](archon/analysis.md). This file says how the files work together; names of functions and data keys live in the code. Code and comments are in English, everything about the real house is in Polish.

## Files

| File | What it holds |
|---|---|
| house.js | the house as data: geometry, layers, views (rules.md § 1) |
| materials.js | the material library and the tile products |
| textures.js | texture images (tiles, wood) |
| engine.js | turns house.js into solids |
| analysis.js | the checks shown in Analiza |
| view.html | the page: 3D, 2D plan, Analiza, layers, cut, tiles, walk |
| core/ | shared 3D code, its own small project |
| archon/ | the archon drawings and analysis.md, read from them |
| kitchen/, bath/ | sub-projects with their own pages, also in mm; bath has no docs yet |
| proposal.md | how the kitchen and bath could come in (not built) |
| index.html | directory listing, not part of the house |

## How it fits together

```
analysis.md ─(by hand)─► house.js ─► engine.js ─► solids ─┬─► view.html  draws them (materials.js, textures.js)
                                                          └─► analysis.js checks them, shown in Analiza
```

- One model for every view. A view only picks layers and cuts it.
- The page writes nothing back to the files. The viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser and are dropped when their format changes.
- engine.js and view.html know nothing about this house: no numbers, names, products or colours of it. What differs is a flag or a value in the data, never a test in the code.

## The model in short

- **Solids**: every solid is a prism along x over a convex polygon (a box, at most cut parallel to the roof). Cutting, splitting floors, facades and sections are exact; nothing is sampled. Data, code and page in mm; only the 3D scene is in metres.
- **Elements**: the boxes of the analysis, each of a kind (footing, foundation, slab, block 240/120, EPS, ring beam, ceiling, chimney…). The kind sets the material, the section colour, the checked thickness and the layer, and whether openings cut it and windows sit in it.
- **Openings** cut every wall and EPS box they cross. Their kind says what is drawn: a glazed frame, a solid leaf with grooves and a handle, or both. Frames follow sloping heads.
- **Portal**: the long walls run on into the wings at both ends, with the ring beam over them, EPS inside and a cap on each end.
- **Roof**: two slopes from pitch, eave and thickness, running over both portals; the roof windows and the chimney are cut out of it.
- **Facade**: finish rules on the EPS by its outer side.
- **Stair**: floating treads in flights; the landing is a flight of one tread. 17 risers to the attic.
- **Site**: the lawn stops at the box around the building, so it never runs through a foundation or slab.
- **Tiles**: real products from a shop (materials.js), with the link to that exact product.
- **Rooms**: rectangles at the block faces. A room is tiled on its own or together with another (the walk-in wardrobes with the bedroom). Tiles run on through half of every doorway.

## Code style

- Readable: consistent indentation, short functions, one idea per line, names that match the page.
- No hidden rules: what is built follows from the data. No numbers of this house in the code, no duplicated values.
- Library versions pinned.
- The page is in Polish; code and comments in English. Short comments that say why.
- No backward-compatibility code.
