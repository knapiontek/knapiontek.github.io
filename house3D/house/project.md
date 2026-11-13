# House

The building "Dom w papawerach 5 (G)" from archon.pl, as built, in 3D and 2D, with floor tiles in every room. Open **view.html**.

- What the page must do: [rules.md](rules.md) (Polish, like the page).
- Where the numbers come from: [archon/analysis.md](archon/analysis.md).
- The whole application, the screen and the library: [../project.md](../project.md).

## Files

| File | Holds |
|---|---|
| house.js | the house as data: geometry, layers, views (rules.md § 1) |
| engine.js | house.js turned into solids |
| house-clip.js | a sub-project's room: the house's own solids, trimmed (../project.md, Sub-projects and their room) |
| analysis.js | the checks shown in Test (Analiza) |
| view.html | the page: 3D, 2D plan, Analiza, layers, cut, tiles, walk |
| archon/ | the archon drawings and analysis.md |
| index.html | directory listing, not part of the house |

## How it fits together

```
analysis.md ─(by hand)─► house.js ─► engine.js ─► solids ─┬─► view.html          drawn by ../core
                                                          ├─► analysis.js        checked, shown in Analiza
                                                          └─► house-clip.js ─► ../kitchen, ../bathroom
```

- One model for every view. A view only picks layers and cuts it.
- The page writes nothing back. The viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser and are dropped when their format changes.
- engine.js and view.html know nothing about this house: no numbers, names, products or colours of it. What differs is a value in the data, never a test in the code.

## The model in short

- **Solids**: a prism along x over a convex polygon (a box, at most cut parallel to the roof). Cutting, splitting floors, facades and sections are exact; nothing is sampled. Data, code and page in mm; only the 3D scene is in metres.
- **Elements**: the boxes of the analysis, each of a kind (footing, foundation, slab, block 240/120, EPS, ring beam, ceiling, chimney…). The kind sets the material, the section colour, the checked thickness, the layer, and whether openings cut it and windows sit in it.
- **Openings** cut every wall and EPS box they cross. Their kind says what is drawn: a glazed frame, a solid leaf with grooves and a handle, or both. Frames follow sloping heads.
- **Portal**: the long walls run on into the wings at both ends, with the ring beam over them, EPS inside and a cap on each end.
- **Roof**: two slopes from pitch, eave and thickness, over both portals; roof windows and the chimney cut out of it.
- **Facade**: finish rules on the EPS by its outer side.
- **Stair**: floating treads in flights; the landing is a flight of one tread. 17 risers to the attic.
- **Site**: the lawn stops at the box around the building.
- **Tiles**: real products (../library/products.js) with the link to that exact product. A room is tiled on its own or with another (the walk-in wardrobes with the bedroom); tiles run through half of every doorway.

## Code style

As [../project.md](../project.md).
