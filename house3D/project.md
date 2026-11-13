# House 3D

The house "Dom w papawerach 5 (G)" from archon.pl, as built, in 3D and 2D, with floor tiles in every room. Open **view.html**.

- What the page must do: [rules.md](rules.md) (Polish, like the page).
- Where the numbers come from: [archon/analysis.md](archon/analysis.md).
- This file: how the files work together. Names of functions and data keys live in the code.

## Files

| File | Holds |
|---|---|
| house.js | the house as data: geometry, layers, views (rules.md § 1) |
| materials.js | the material library and the tile products |
| textures.js | texture images (tiles, wood) |
| engine.js | house.js turned into solids |
| house-clip.js | a sub-project's room: the house's own solids, trimmed |
| analysis.js | the checks shown in Analiza |
| view.html | the page: 3D, 2D plan, Analiza, layers, cut, tiles, walk |
| core/ | shared 3D code for every view; its own small project |
| archon/ | the archon drawings and analysis.md |
| kitchen/, bathroom/ | sub-projects with their own pages and docs |
| index.html | directory listing, not part of the house |

## How it fits together

```
analysis.md ─(by hand)─► house.js ─► engine.js ─► solids ─┬─► view.html          drawn by core
                                                          ├─► analysis.js        checked, shown in Analiza
                                                          └─► house-clip.js ─► kitchen/view.html, bathroom/view.html
```

- One model for every view. A view only picks layers and cuts it.
- The page writes nothing back. The viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser and are dropped when their format changes.
- engine.js and view.html know nothing about this house: no numbers, names, products or colours of it. What differs is a value in the data, never a test in the code.

## Flow

One application over all the projects: the house, the kitchen, the bathroom on the ground floor, the bathroom upstairs, the three walk-in wardrobes upstairs (a new project). Every project keeps its own page and data; they share one layout from core.

```
┌───────────┬───────────────────────────────────────────┬──────────────────┐
│ main      │                          [3D 2D Test Info]│ panel            │
│ menu      │                                           │  [tabs]          │
│           │               main view                   │  1 Warstwy       │
│ Dom       │                                           │  2… project's    │
│ Kuchnia   │                                           │     own tabs     │
│ Łazienki  │                                           │                  │
│ Garderoby │  [cameras: 3D] [SVG: 2D] [XLSX: Info]  ☀ ?│                  │
└───────────┴───────────────────────────────────────────┴──────────────────┘
```

- **Main menu** (left, as today): a button for every application; a click moves to it freely, from any of them.
- **Mode selector** (top right of the main view): what the main view shows:
  - **3D**: the cameras at the bottom of the screen; the house's go to every room, from above, the side, the front, as today.
  - **2D**: the plan; saved as SVG.
  - **Test**: today's Analiza, the checks.
  - **Info**: the project's information, like cost.html; saved as XLSX. The spreadsheet of cost.html (editable cells, formulas, XLSX export) moves to core and knows no project.
- **Right panel**: the same in every application. At the top its menu, the **tabs**: one group at a time, no long scrolling.
  1. **Warstwy**, the first and most important tab, the same look everywhere.
  2. Then the project's own tabs (floor tiles, materials such as the worktop …). To be agreed.
- **Światło and help**: two icons at the bottom right of the main view, the same everywhere.
  - **Sun**: opens a small floating panel: a compass (the plan of the house in the middle, the sun dragged round it: the direction; an arc beside it: the sun's height) and a small brightness slider under it. Instead of today's three sliders.
  - **?**: the help of the application (today's **?**, top right).

## Sub-projects and their room

The kitchen and the bathrooms take their room from the house, never the other way round. house-clip.js does three things and nothing else:

1. **Trims** the house's solids (the element kinds house.js `copy` lists, the window frames and glass, the roof) to the box the room's link gives.
2. **Keeps** only what belongs to the room: walls standing on the edge of its floor area and the windows in them; the slab under it and the slab or roof over it, cut to that floor area and those walls.
3. **Groups** the solids as a person sees them: each wall, the floor, the ceiling, each window (with its wall).

Nothing is moved, scaled or re-measured: every solid handed over is part of a house solid, in house axes and mm. A sub-project draws its room with core, like the house, and copies its idea: the same views (3D with its parts in the menu, 2D cut at the house's height, Analiza), the same panel, the house's names of rooms and openings.

## The model in short

- **Solids**: a prism along x over a convex polygon (a box, at most cut parallel to the roof). Cutting, splitting floors, facades and sections are exact; nothing is sampled. Data, code and page in mm; only the 3D scene is in metres.
- **Elements**: the boxes of the analysis, each of a kind (footing, foundation, slab, block 240/120, EPS, ring beam, ceiling, chimney…). The kind sets the material, the section colour, the checked thickness, the layer, and whether openings cut it and windows sit in it.
- **Openings** cut every wall and EPS box they cross. Their kind says what is drawn: a glazed frame, a solid leaf with grooves and a handle, or both. Frames follow sloping heads.
- **Portal**: the long walls run on into the wings at both ends, with the ring beam over them, EPS inside and a cap on each end.
- **Roof**: two slopes from pitch, eave and thickness, over both portals; roof windows and the chimney cut out of it.
- **Facade**: finish rules on the EPS by its outer side.
- **Stair**: floating treads in flights; the landing is a flight of one tread. 17 risers to the attic.
- **Site**: the lawn stops at the box around the building.
- **Tiles**: real products (materials.js) with the link to that exact product. A room is tiled on its own or with another (the walk-in wardrobes with the bedroom); tiles run through half of every doorway.

## Code style

- Readable: consistent indentation, short functions, one idea per line, names that match the page.
- No hidden rules: what is built follows from the data. No numbers of this house in the code, no duplicated values.
- Page in Polish; code and comments in English; short comments that say why.
- Library versions pinned. No backward-compatibility code.
