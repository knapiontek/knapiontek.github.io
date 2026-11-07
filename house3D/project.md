# House 3D project

> How the files of this folder work together. What the page must do: rules.md. No code details here: names of functions, variables and data keys live in the code.

The house is "Dom w papawerach 5 (G)" from archon.pl, as built. The page shows the building in 3D and 2D, with floor tiles laid in every room.

## Files

| File | Kind | Owns |
|---|---|---|
| estimate/estimate.md | text | the geometry as boxes, read from the archon drawings, and the build changes |
| estimate/*.png | images | the archon drawings the estimate is read from |
| house.js | data | the three trees: elements (boxes, kinds, cuts), openings, facade rules, roof, stair, site, floors with rooms; layers; views, cameras, light, walk |
| materials.js | data | the material library and the tile products |
| textures.js | data | texture images (floor tiles, wood decor) |
| view.html | page | the views, layers, cut, tile layouts and counts, 2D plan, walk, checks |
| rules.md | text | what the page must do |
| project.md | text | this description |
| proposal.md | text | a proposal for the kitchen, bath and layers tree (not implemented) |
| index.html | page | directory listing (not part of the house) |

## Data flow

```
  estimate.md  ──(by hand)──►  house.js ──┐
                               materials.js ──┼──► view.html   builds the model once and draws it;
                               textures.js  ──┘                3D and 2D come from the same model
```

- One model for every view: a view only shows layers and cuts it.
- view.html writes nothing back. The viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser.
- view.html does not know this house: no numbers, names, ids, products or colours of it. What differs between kinds, layers or views is a flag in the data.

## Model

- **Elements** are the boxes of the estimate, each of a kind (footing, foundation, ground slab, block 24, block 12, EPS, ring beam, slab, ceiling, chimney). The kind gives the face material, the section colour, the checked thickness and the layer.
- **Openings** cut every wall and EPS box they cross. Frames, glass, the gate and the entrance leaf are drawn in the Okna i drzwi layer.
- **Portal**: the block, foundation and knee walls of the long walls run on into the wings; the ring beam continues over them; EPS on the inner faces and a cap on every head.
- **Roof**: two slopes from the pitch, eave and thickness, x −100 → 1420 over both portals; the roof windows and the chimney are cut out of it.
- **Facade**: rules on the EPS boxes, by their outer side. Elewacja off shows the bare EPS.
- **Stair**: floating treads and a landing, 17 risers to the attic floor.
- **Rooms**: rectangles at the block faces. A room is tiled on its own or with another room (the walk-in wardrobes with the bedroom); tiles run on through door halves.
- **Build changes** (as built, not archon): estimate.md § 14.

## Mesh (how rules.md § 4 is met)

- Computed floats are never placed side by side: two faces that meet use the very same welded point.
- No heuristics, no sampling: faces, pieces and edges are computed exactly on the welded points.
- A face loses, by exact polygon subtraction, what an opposite face of its own visibility group (same layers) covers in its plane. A part covered by another group is a contact piece: drawn, but seen only while that group is hidden. A piece narrower than the weld tolerance is no face.
- Edges come from the topology of the pieces. A segment between two welded points is a seam (no line) when two pieces of one group lie on it in one plane, and a corner (a line) when they meet at an angle. Any other line is hidden exactly while every group that closes it is shown.
- No two surfaces share a plane: the floor tiles and grout lie on the slab, never in its plane.
- No slope-dependent depth offset (polygonOffset factor) anywhere: at grazing angles it pushes surfaces through walls. Only a constant minimal bias keeps edge lines in front.
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
