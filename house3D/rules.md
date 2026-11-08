# House 3D rules

> What the page must do. How the files do it: project.md. The geometry: archon/analysis.md.

## 1. Three trees and the panel

house.js holds three trees:

- **Geometry**: what the house is made of.
- **Layers**: what can be switched on and off.
- **Views (menu)**: how the house is looked at.

The menu decides what is shown and from where. The panel holds only the parameters of that choice and never repeats it.

- **Menu node**: the parameters of the view in force (cut height, light; zoom and SVG of the 2D plan) and which panel sections it shows.
- **Geometry node**: a floor is opened from the menu: it is the highest floor shown with the roof off. A room of the open floor is selected by a click in 3D or in the list; it gets a row in the context menu (name, sub-project) and the panel shows its floor tiles. Tiles are set per room, never per floor.
- **Layer node**: switched in Warstwy, not in the room panel.

## 2. Geometry

- **Source**: archon/analysis.md with its build changes (§ 14). The model copies its boxes, voids, openings, stair, facade (§ 8.5) and site (§ 15) and never re-measures.
- **Boxes** follow the analysis (§ 2 axes, § 3 rules): an axis-aligned box `[x1, x2, y1, y2, z1, z2]` is the only solid; one shape is one box, through its doors and windows; openings are subtracted from every wall and EPS box they cross; at a crossing the load-bearing (thicker) wall runs through; a box reaching the roof is cut by the two roof planes, gable windows by lines parallel to the roof.
- **Cuts**: an element may subtract other elements or voids (the slab without the stair void and the chimney).
- **Floors** are split by one plane, the top of the ground floor walls (272): below is the ground floor, above is the attic with the slab. A box crossing the plane belongs to both, in two parts.
- **No overlaps**: no two elements share volume (checked on the page).
- **EPS** is a continuous shell outside the blocks, never between two blocks: every block is covered, front, back and sides, with no thermal bridges. Every exposed block end (the portal wing heads) gets an EPS cap. A block line runs through its corners and on into the portal wings. The portal frame, front and back, is one width, 64 (EPS 20 + block 24 + EPS 20; the roof across the slope).
- **Facade**: the finish (plaster, graphite, wood, plinth) covers only the parts of EPS faces open to the air (block → EPS → facade). A part against another solid (block, slab, roof) stays bare EPS, decided exactly by the contact pieces. The finish is chosen by rules (the side of the box facing the air, a part of it, a height); a later rule wins.
- **Windows and doors** sit in the block, flush with its outer face. Their sizes are the archon labels (width / height), shown on the 2D plan. The kind of an opening says what is drawn in it (a glazed frame with or without a sill, a solid leaf, both) and whether the floor runs through it.
- **Stair**: floating, treads and a landing only (no stringers, no wall under it).
- **Not in the model**: furniture, kitchen, bathroom fittings, the fireplace. Only the building.

## 3. Layers

- **Floors and roof** (Parter, Piętro, Dach) are in their own menu row.
- **Material layers** are in the panel: Fundament, Pustaki, Wieniec i strop, Styropian (→ Elewacja), Okna i drzwi, Schody, Posadzki (→ Drobne docinki), Teren, Krawędzie.
- **Elewacja** off shows the bare EPS; on shows its finish.
- **Krawędzie**: every element (blocks, EPS, ring beams, slabs, roof, stair) shows its edges wherever it is exposed. A joint of two elements in one plane shows only while the neighbour is hidden. Edges are computed exactly from the welded points (§ 4), no sampling.
- A child is shown only with its parent. An element is drawn only when all its layers are on.
- Switching a layer changes only what is shown, never the model, the tile counts or the camera.

## 4. Mesh

- The model has one list of 3D points. Every drawn point (solids, frames, stair, site, roof, section caps, tiles, marks, edges) is welded: a computed point within 0.005 cm of a listed point is replaced by it.
- Faces take the listed points lying on their edges: no T-junctions, no cracks.
- Faces between cells of one element are not drawn.
- Nothing is enlarged or hidden to cover a fault.

## 5. Menu

- **Top left**: one toggle 3D / 2D.
- **3D, top**: Parter, Piętro, Dach as check boxes; a second row when a room is selected.
- **3D, bottom**: Spacer (the walk), the cameras of the house and of the open floor.
- **Navigation**: the wheel zooms toward the surface under the cursor; rotation turns about the house centre while the camera is outside the house, and about the surface in the middle of the view inside it, so the pivot is never left behind the camera.
- **Help**: an icon in the corner.
- **2D**: both floors side by side, garden at the top. Cut 150 cm above the ground floor and 80 cm above the attic floor (through the knee walls and their EPS, under the eaves). The stair is drawn as a full line under the cut and dashed above it; from the attic all of it shows through the stair hole. Zoom and SVG download are in the panel.
- **Panel** follows what is shown: Przekrój and Pomieszczenia only for the open floor. Light only in 3D.
- **Cut**: a plane that clips the model. Its slider moves in whole steps from 50 cm over the floor; the last step reaches the floor's top, where the cut is off. What it opens is closed by caps in the colour of the material cut, also when the cut lies exactly on the top of a cell (a window or door head).

## 6. Materials and products

- Materials are a library of their own (materials.js); an element names its material. A material also gives its fill in the 2D plan.
- A tile product is one whole: texture, size, joint and the smallest acceptable cut. The page chooses the product, never its parts.
- The laying belongs to the room: pattern, direction, grout colour, offsets.

## 7. Rooms with sub-projects

- The living room with the kitchen links to kitchen/view.html; both bathrooms link to bath/view.html.
- Nothing of a sub-project goes into house3D until it is accepted. Then: its geometry under the room, its layers as a branch, its views as sub-views (see proposal.md).

## 8. Checks (on the page)

- Element thickness matches its kind.
- No two elements share volume.
- Every floor area inside the walls is a room, a wall, a void or named; what is left is reported as exact rectangles.
- Tile layouts: cut pieces smaller than the product's smallest cut are shown red and counted.
