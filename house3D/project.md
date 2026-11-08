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
| view.html | page | the views, layers, cut, tile layouts and counts, 2D plan, walk, checks |
| rules.md | text | what the page must do |
| project.md | text | this description |
| proposal.md | text | a proposal for the kitchen, bath and layers tree (not implemented) |
| index.html | page | directory listing (not part of the house) |

## Data flow

```
  analysis.md  ──(by hand)──►  house.js ──┐
                               materials.js ──┼──► view.html   builds the model once and draws it;
                               textures.js  ──┘                3D and 2D come from the same model
```

- One model for every view: a view only shows layers and cuts it.
- view.html writes nothing back. The viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser.
- view.html does not know this house: no numbers, names, ids, products or colours of it. What differs between kinds, openings, layers or views is a flag in the data, never a test in the code.

## Model

- **Solids**: every solid is a prism along x over a convex polygon across the house (a box, cut at most by lines parallel to the roof). Subtraction, intersection, the floor split, the facade regions and sections are exact operations on convex polygons; nothing is sampled.
- **Elements** are the boxes of the analysis, each of a kind (footing, foundation, ground slab, block 24, block 12, EPS, ring beam, slab, ceiling, chimney). The kind gives the face material, the section colour, the checked thickness and the layer, and says whether openings cut it and whether windows sit in it.
- **Voids** (the stair hole) are named boxes: they cut the slab and are drawn on the 2D plan.
- **Openings** cut every wall and EPS box they cross. The opening kind says what is drawn in it: a glazed frame (bars, transoms, glass; with or without a sill), a solid leaf with grooves and a handle, or both side by side; frames follow sloping heads. They are in the Okna i drzwi layer.
- **Portal**: the block, foundation and knee walls of the long walls run on into the wings; the ring beam continues over them; EPS on the inner faces and a cap on every head.
- **Roof**: two slopes from the pitch, eave and thickness, x −100 → 1420 over both portals; the roof windows (frame bars and glass between lines parallel to the slope) and the chimney are cut out of it.
- **Facade**: rules on the EPS boxes, by their outer side. Elewacja off shows the bare EPS.
- **Stair**: floating treads in flights, the landing a flight of one tread; 17 risers to the attic floor.
- **Rooms**: rectangles at the block faces. A room is tiled on its own or with another room (the walk-in wardrobes with the bedroom); tiles run on through the halves of every passage.
- **Build changes** (as built, not archon): analysis.md § 14.

## Mesh (how rules.md § 4 is met)

- Computed floats are never placed side by side: two faces that meet use the very same welded point.
- No heuristics, no sampling: faces, pieces and edges are computed exactly on the welded points.
- A face loses, by exact polygon subtraction, what an opposite face of its own visibility group (same layers) covers in its plane. A part covered by another group is a contact piece: drawn, but seen only while that group is hidden. A piece narrower than the weld tolerance is no face.
- Edges come from the topology of the pieces. A segment between two welded points is a seam (no line) when two pieces of one group lie on it in one plane, and a corner (a line) when they meet at an angle. Any other line is hidden exactly while every group that closes it is shown.
- No two surfaces share a plane: the floor tiles and grout lie on the slab, never in its plane; a section cap lies a constant 0.05 cm under the cut.
- No slope-dependent depth offset (polygonOffset factor) anywhere: at grazing angles it pushes surfaces through walls. Faces get only a constant minimal bias. Edge lines are pulled toward the eye along their view ray by a constant fraction of their distance: nothing lies between the eye and a visible edge on that ray, so inner corners stay drawn at any angle.
- Faults are fixed at their source, never masked.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows.
- No hidden rules: what gets built follows from the data files.
- No numbers of this house in the code and no duplicated values.
- Library versions pinned.
- Everything the page shows is Polish; code and comments are English.
- Short comments that say why.
- No backward compatibility code: when the format changes, the stored browser state is dropped.
