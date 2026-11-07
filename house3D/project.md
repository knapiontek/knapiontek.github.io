# House 3D project

> How the files of this folder work together. No code details here: names of functions, variables and data keys live in the code.

The house is "Dom w papawerach 5 (G)" from archon.pl, as built. The page shows the building in 3D and 2D with the floor tiles laid in every room.

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
| index.html | page | directory listing (not part of the house) |

## Data flow

```
  estimate.md  ──(by hand)──►  house.js ──┐
                               materials.js ──┼──► view.html   builds the model once, draws it
                               textures.js  ──┘                3D and 2D come from the same model
```

- view.html writes nothing back; the viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser.
- view.html does not know this house: no numbers, names, products or colours of it.
- One model for every view: a view only shows layers and cuts it.

## Model

- **Elements** are the boxes of the estimate, each with a kind (footing, foundation, ground slab, block 24, block 12, EPS, ring beam, slab, ceiling, chimney, shaft). A kind gives the face material, the section colour, the checked thickness and the layer.
- **Openings** cut every wall and EPS box they cross; frames, glass, the gate and the entrance leaf are drawn in the Okna i drzwi layer.
- **Portal**: the long walls' block, foundation and knee walls run on into the wings; the ring beam continues over them; EPS on the inner faces and a cap on every head.
- **Roof**: two slopes from the pitch, eave and thickness, x −100 → 1420 over both portals; roof windows, chimney and shaft are cut out of it.
- **Facade**: rules on the EPS boxes by their outer side; Elewacja off shows the bare EPS.
- **Stair**: floating treads and a landing, 17 risers to the attic floor.
- **Rooms**: rectangles at the block faces; a room is tiled itself or with another room (walk-in wardrobes with the bedroom); tiles run on through door halves.

## Points: one list, welded (important)

- Never place computed floats/doubles next to each other: two faces that meet must use the very same point.
- The model keeps one list of 3D points. A computed point (a corner, a roof intersection) is looked up in the list; a point within 0.005 cm is its neighbour and replaces it. Every drawn point is welded: solids, frames, stair, site, roof, section caps, tiles, marks and edges.
- A face then takes every listed point lying on its edges, so neighbouring faces share their vertices: no T-junctions, no pixel cracks.
- No heuristics, no sampling: faces, pieces and edges are computed exactly on the welded points.
- A face loses, by exact polygon subtraction, what an opposite face of its own visibility group (same layers) covers in its plane; a part covered by another group is a contact piece: drawn, seen only while that group is hidden. A piece narrower than the weld tolerance is no face.
- Edges come from the topology of the pieces: a segment between two welded points is a seam (no line) when two pieces of a group lie on it in one plane, a corner (line) when they meet at an angle; any other line is hidden exactly while every group that closes it is shown. So blocks, EPS, ring beams and slabs show their edges wherever they are exposed.
- Faults are fixed at their source, never masked (no enlarged faces, no hiding).

## Build changes (as built, not archon)

- Ground floor shower recess 100 × 90: walls #7 to y 766, #8 at y 754–766, #10 from y 754.
- Attic bathroom door 90/205 at x 630–720 (20 cm toward the garden); the 100 × 100 shower at the front end.
- No diagonal wall under the stair in the garage.
- Recess soffit EPS 47 thick (z 225–272): one white horizontal band on the front.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows.
- No hidden rules: what gets built follows from the data files.
- No numbers of this house in the code and no duplicated values.
- Library versions pinned.
- Everything the page shows is Polish; code and comments are English.
- Short comments that say why.
- No backward compatibility code: when the format changes, the stored browser state is dropped.
