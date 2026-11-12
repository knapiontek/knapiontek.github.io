# House 3D: rules

What the page must do. How the files do it: [project.md](project.md). Where the numbers come from: [archon/analysis.md](archon/analysis.md).

## 1. Three trees

house.js holds three trees:

- **Geometry**: what the house is made of.
- **Layers**: what can be switched on and off.
- **Views**: how the house is looked at (3D, 2D, Analiza).

The menu decides what is shown and from where. The panel only holds the settings of that choice; it never repeats the menu.

- **Open floor**: the highest floor shown while the roof is off. Its cut and its rooms appear in the panel.
- **Rooms**: click a room (in 3D or in the list) to select it. It gets a row in the top menu (name, link to its sub-project) and the panel shows its floor tiles. Tiles are set per room, never per floor.
- **Layers** are switched in Warstwy, not in the room panel.

## 2. Geometry

- **Units**: mm, whole numbers, in data, code, page and docs. The kitchen project is in mm too; the bath project is in metres.
- **Source**: archon/analysis.md, with its build changes (§ 14). The model copies its boxes and never re-measures.
- **Boxes**: the only solid is an axis-aligned box. One wall is one box, through its doors and windows. Openings are cut out of every wall and EPS box they cross. Where walls cross, the thicker one runs through. A box that reaches the roof is cut by the two roof planes; gable windows by lines parallel to the roof.
- **Cuts**: an element may subtract other elements or voids (the slab minus the stair hole and the chimney).
- **Floors**: one plane splits the house at the top of the ground floor walls (2720). Below is the ground floor; above is the attic with the slab. A box crossing the plane is split in two.
- **No overlaps**: no two solids share volume (checked in Analiza).
- **EPS** wraps the blocks outside, never between two blocks: every block is covered on every side, with no thermal bridges. Every exposed block end gets an EPS cap. The portal frame is one width all round: 640 (EPS 200 + block 240 + EPS 200; the roof measured across the slope).
- **Facade**: the finish (plaster, graphite, wood, plinth) covers only EPS faces open to the air. Where EPS touches another solid it stays bare. Finishes are chosen by rules (side, region, height); a later rule wins.
- **Windows and doors** sit in the block, flush with its outer face. Their sizes are the archon labels (width/height), shown on the 2D plan. The opening kind says what is drawn (glazed frame with or without a sill, a solid leaf, or both) and whether the floor runs through.
- **Foundations**: every ground floor block-240 wall stands on a foundation wall and a footing. The chimney stands on the ground slab over its own foundation. Footings in line share an edge.
- **Stair**: floating treads and a landing; no stringers, no wall under it.
- **Not modelled**: furniture, kitchen, bathroom fittings, the fireplace.
- **Drawing** follows core: welded points, no T-junctions, nothing hidden to cover a fault. Faces between pieces of one element are not drawn. Tiles and grout lie just above the slab, never in its plane.

## 3. Layers

- **Parter, Piętro, Dach** are check boxes in the top menu.
- **Material layers** are in the panel: Fundament, Pustaki, Wieniec i strop, Styropian (→ Elewacja), Okna i drzwi, Schody, Posadzki (→ Drobne docinki), Teren, Krawędzie.
- **Elewacja** off shows bare EPS.
- **Krawędzie**: every element shows its edges wherever it is exposed. A joint between two elements in one plane shows only while the neighbour is hidden. Edges are exact, never sampled.
- A child layer shows only with its parent; an element shows only when all its layers are on.
- Switching a layer changes only what is shown: never the model, the tile counts or the camera.

## 4. Menu and navigation

- **Top left**: one toggle 3D / 2D / Analiza.
- **3D top**: Parter, Piętro, Dach; a second row when a room is selected.
- **3D bottom**: Spacer (walk) and the cameras of the house and of the open floor.
- **Navigation**: the wheel zooms toward the surface under the cursor. Outside the house, rotation turns about its centre; inside, about the surface in the middle of the view. The pivot is never behind the camera.
- **Help**: the ? icon in the corner.
- **Panel**: Przekrój and Pomieszczenia only with an open floor; Światło only in 3D.
- **Cut**: a plane that clips the model. The slider moves in whole steps from 500 mm above the floor; its last step is the floor's top, where the cut is off. The cut faces are closed with caps in the colour of the material cut, also when the cut lies exactly on top of a piece (a window or door head).
- **2D**: both floors side by side, garden at the top. Cut 1500 mm above the ground floor and 800 mm above the attic floor. The stair is a full line under the cut and dashed above it; from the attic all of it shows through the stair hole. Zoom and SVG download are in the panel.

## 5. Materials and tiles

- Materials are a library of their own (materials.js); an element names its material. A material also gives its fill on the 2D plan.
- A tile product is one whole: texture, size, joint and smallest acceptable cut. The page picks the product, never its parts.
- The laying belongs to the room: pattern, direction, grout colour, offsets.

## 6. Sub-projects

- The living room links to kitchen/view.html; both bathrooms link to bath/view.html.
- Nothing from a sub-project goes into house3D until it is accepted (see proposal.md).

## 7. Checks (Analiza)

- Element thickness matches its kind.
- No two solids share volume: elements, frames, glass, leaves, roof, stair, site.
- Every bit of floor inside the walls is a room, a wall, a void or named; anything left is listed as exact rectangles.
- Tiles: cut pieces smaller than the product's smallest cut are shown red and counted.
