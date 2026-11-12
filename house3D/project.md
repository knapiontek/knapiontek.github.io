# House 3D project

> How the files of this folder work together. What the page must do: rules.md. No code details here: names of functions, variables and data keys live in the code.

The house is "Dom w papawerach 5 (G)" from archon.pl, as built. The page shows the building in 3D and 2D, with floor tiles laid in every room.

## Files

| File | Kind | Owns |
|---|---|---|
| archon/analysis.md | text | the geometry as boxes, read from the archon drawings: walls, openings, stair, facade, site, and the build changes |
| archon/*.png | images | the archon drawings the analysis is read from |
| house.js | data | the three trees: geometry (elements, kinds, voids, openings and their kinds, facade rules, roof, stair, site, floors with rooms, tile heights), layers, views (menu, cuts, cameras, light, walk, edges) |
| materials.js | data | the material library (with the 2D plan fills) and the tile products |
| textures.js | data | texture images (floor tiles, wood decor) |
| engine.js | code | house.js turned into solids: cuts, openings, floor split, facade, roof, frames, stair, site |
| view.html | page | the views (3D, 2D, Analiza), layers, cut, tile layouts and counts, 2D plan, walk |
| analysis.js | code | the checks of the solids, shown in Analiza |
| core/ | code | shared 3D code, its own project |
| rules.md | text | what the page must do |
| project.md | text | this description |
| proposal.md | text | a proposal for the kitchen, bath and layers tree (not implemented) |
| index.html | page | directory listing (not part of the house) |

## Data flow

```
  analysis.md ──(by hand)──► house.js ──► engine.js ──► solids ──┬──► view.html   draws them (with materials.js, textures.js)
                                                                 └──► analysis.js checks them; view.html shows the result in Analiza
```

- One model for every view: a view only shows layers and cuts it.
- view.html writes nothing back. The viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser.
- engine.js and view.html do not know this house: no numbers, names, ids, products or colours of it. What differs between kinds, openings, layers or views is a flag in the data, never a test in the code.

## Model

- **Solids**: every solid is a prism along x over a convex polygon across the house (a box, cut at most by lines parallel to the roof). Subtraction, intersection, the floor split, the facade regions and sections are exact operations on convex polygons; nothing is sampled.
- **Elements** are the boxes of the analysis, each of a kind (footing, foundation, ground slab, block 24, block 12, EPS, ring beam, slab, ceiling, chimney). The kind gives the face material, the section colour, the checked thickness and the layer, and says whether openings cut it and whether windows sit in it.
- **Voids** (the stair hole) are named boxes: they cut the slab and are drawn on the 2D plan.
- **Openings** cut every wall and EPS box they cross. The opening kind says what is drawn in it: a glazed frame (bars, transoms, glass; with or without a sill), a solid leaf with grooves and a handle, or both side by side; frames follow sloping heads. They are in the Okna i drzwi layer.
- **Portal**: the block, foundation and knee walls of the long walls run on into the wings; the ring beam continues over them; EPS on the inner faces and a cap on every head.
- **Roof**: two slopes from the pitch, eave and thickness, x −100 → 1420 over both portals; the roof windows (frame bars and glass between lines parallel to the slope) and the chimney are cut out of it.
- **Facade**: rules on the EPS boxes, by their outer side. Elewacja off shows the bare EPS.
- **Stair**: floating treads in flights, the landing a flight of one tread; 17 risers to the attic floor.
- **Frames**: the mullions run through, the transoms stop at them, the glass is the panes between the bars; a door's grooves stop at its handle.
- **Site**: the lawn gives way to the box around the building's elements, so it never runs through a foundation, slab or EPS.
- **Rooms**: rectangles at the block faces. A room is tiled on its own or with another room (the walk-in wardrobes with the bedroom); tiles run on through the halves of every passage.
- **Build changes** (as built, not archon): analysis.md § 14.

## Mesh

- Drawn by core.
- The floor tiles and grout lie on the slab, never in its plane.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows.
- No hidden rules: what gets built follows from the data files.
- No numbers of this house in the code and no duplicated values.
- Library versions pinned.
- Everything the page shows is Polish; code and comments are English.
- Short comments that say why.
- No backward compatibility code: when the format changes, the stored browser state is dropped.
