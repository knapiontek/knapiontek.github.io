# House 3D rules

> What the house page must do and how its model is organised. How the files implement it: project.md. The geometry: estimate/estimate.md.

## 1. Three trees and the settings

The page is made of three trees, all stored as data in house.js:

- **Geometry**: what the house is made of.
- **Layers**: what can be switched on and off.
- **Menu (views)**: how the house is looked at.

The **menu** decides what is shown and from where. The **settings** (the panel) are only the parameters of what the menu has chosen; they never repeat a menu choice.

- **Menu node**: the parameters of the view in force (cut height, light; zoom and SVG of the 2D plan) and which panel sections it shows.
- **Geometry node**: a floor is opened with the menu (the highest floor shown with the roof off). A room of the open floor is selected by a click in 3D or in the list; it gets a row in the context menu (name, sub-project) and the panel shows its floor tiles. Tiles are set in the rooms, never per floor.
- **Layer node**: its switch is in Warstwy, not in the room panel.

## 2. Geometry

- **Source**: estimate/estimate.md, including its build changes (§ 14). The model copies its boxes; it does not re-measure.
- **Box**: the only solid, axis aligned, `[x1, x2, y1, y2, z1, z2]`. Axes as in the estimate: x along the house from the garden, y across from the garage side, z up from ±0.00.
- **One shape, one box**: a wall of one material and thickness is one box end to end, through its doors and windows.
- **Openings** are boxes subtracted from every wall and EPS box they cross.
- **Crossings**: the load-bearing (thicker) wall runs through; the other stops at its faces.
- **Under the roof**: a box that reaches the roof is cut by the two roof planes. Gable windows are cut by lines parallel to the roof.
- **Cuts**: an element may subtract other elements or boxes (the slab without the stair void, chimney and shaft).
- **Floors** are split by one plane, the top of the ground floor walls (272): below it the ground floor, above it the attic with the slab. A box crossing the plane belongs to both, in two parts.
- **Nothing overlaps**: no two elements share volume (checked on the page).
- **Facade**: the finish (plaster, graphite, wood, plinth) is the face of the EPS boxes, chosen by rules: the side of the box that faces the air, a part of it, a height. A later rule wins.
- **Windows and doors** sit in the block, flush with its outer face; their sizes are the archon labels (width / height), shown on the 2D plan.
- **Exceptions**: the diagonal stair wall in the garage (a vertical prism over a plan polygon, its top under the stair); the stair is floating (treads and a landing, no stringers).
- **Not in the model**: furniture, kitchen, bathroom fittings, the fireplace. Only the building.

## 3. Layers

- Floors and roof: Parter, Piętro, Dach; in their own menu row.
- Material layers, in the panel: Fundament, Pustaki, Wieniec i strop, Styropian (→ Elewacja), Okna i drzwi, Schody, Posadzki (→ Drobne docinki), Teren, Krawędzie.
- Elewacja off: the EPS shows bare; on: its finish.
- A child is shown only with its parent. An element is drawn only when all its layers are on.
- Switching a layer changes only what is shown, never the model, the tile counts or the camera.

## 4. Menu

- Top left: one toggle 3D / 2D.
- 3D, top: Parter, Piętro, Dach as check boxes; a second row when a room is selected.
- 3D, bottom: Spacer (the walk), the cameras of the house and of the open floor.
- Help: an icon in the corner.
- 2D: both floors side by side, cut 150 cm above each floor, garden at the top; zoom and SVG download in the panel.
- The panel follows what is shown: Przekrój and Pomieszczenia only for the open floor; at the top of its range the cut is off. Light only in 3D.
- The cut is a plane that clips the model; what it opens is closed by caps in the colour of the material cut.

## 5. Materials and products

- Materials are a library of their own (materials.js); an element names its material.
- A tile product is one whole: texture, size and joint. The page chooses the product, never its parts.
- The laying belongs to the room: pattern, direction, grout colour, offsets.

## 6. Rooms with sub-projects

- The living room with the kitchen (kitchen/view.html) and both bathrooms (bath/view.html) link to their projects.
- Nothing of a sub-project is placed in house3D until it is accepted. Integration later: its geometry under the room, its layers as a branch, its views as sub-views.

## 7. Checks (on the page)

- Element thickness against its kind.
- No two elements share volume.
- Every floor inside the walls is a room, a wall, a void or named.
- Tile layouts: small cut pieces shown red and counted.
