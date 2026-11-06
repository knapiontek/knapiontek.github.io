# House 3D rules

> Written and edited by hand. What the house page must do and how its model is organised. How the files implement it: project.md.

## 1. Three trees and the settings

The page is made of three trees, all stored as data in house.js:

- **Geometry**: what the house is made of.
- **Layers**: what can be switched on and off.
- **Menu (views)**: how the house is looked at.

The **menu** decides what is shown and from where: the view (floor), its cameras and the layers. The **settings** (the panel on the right) are only the parameters of the objects the menu has chosen; they never repeat a menu choice (no floor or layer switches in the panel). Each setting belongs to a node of one of the trees and appears only when that node is in force:

- **Menu node**: the parameters of the view in force (cut height, light, zoom and SVG of the 2D plan), and which panel sections it shows.
- **Geometry node**: the settings of what it holds. A floor is opened with the menu (Parter, Piętro on, the roof off: the highest floor shown is the open floor). A room of the open floor is selected by clicking it in the 3D view or in the list. The selected room gets a row of its own in the context menu (its name, its sub-project), and the panel shows its floor: product, pattern, direction, grout, offsets. Tiles are set in the rooms, never per floor.
- **Layer node**: its switch is in the context menu (Warstwy), not in the panel; in time a layer may get parameters of its own in the panel (for example the colour of the marked cuts).

## 2. Geometry tree

The house is built, and drawn, in this order. The 2D plans are the given: every outline comes from them.

1. Foundation under the outer walls.
2. Ground floor walls of blocks: every wall, outer and inner, up to the ground floor height (the underside of the slab).
3. The ring beam and slab poured over the whole of these walls, up to the attic level, over the outline of both floors (it carries the attic walls also where the attic reaches past the ground floor, over the entrance recess), without the stair hole.
4. Attic walls standing on the slab.
5. Last the EPS and the finish all round: on every side to the air of the walls and of the slab edge, and under the slab where no ground floor is below (the soffit of the recess). One continuous shell from the foundation to the roof. Where the soffit meets a wall, the wall's finish ends at the soffit's underside and its EPS runs on into the soffit's: block, EPS, finish, never EPS, finish, EPS.


Building → Floors → Rooms → Tiles (and later Groups → Carcasses under a kitchen room)

- **Building** (the root): the shell common to all floors: roof, portals, wall kinds and their build-ups, facade, windows, doors, site, light, cameras, tile layouts.
- **Floor**: its level and height, and what stands on it: walls, openings, stair, fireplace, the stair hole. Walls belong to the floor, not to a room, because one wall bounds two rooms.
- **Room**: its floor area as rectangles, the tile layout that covers it, and a link to its sub-project.
- **Tiles**: not stored; the page lays them from the room and its layout.
- Every node keeps its geometry relative to its parent. A floor sets the level, and everything on a floor (sills, heads, the stair, the fireplace) is measured from it. A room is in the floor's x, z. Tiles are laid in the room from the layout's offsets.
- **One model**: the objects are the same in every view. A view never builds objects of its own; it only hides layers and cuts the walls. The cut never changes the geometry: no wall, window, frame or facade board gets another shape or height. The model is built once, whole, and the cut is a plane that clips it; what the plane opens is closed by the section (a cap in the colour of the wall or of its EPS).
- Nothing overlaps: a wall stands on the plinth down to the ground, on a terrace only down to the paving; the ground floor walls end under the slab, the slab ends under the attic walls, the EPS lies outside all of them.
- A facade is a wall side that faces the air: nothing is guessed from positions. The finish (plaster, graphite, wood, the bands) is the outer layer of the wall's build-up and data say which finish covers which part of which side.
- Windows and doors sit in the block (the masonry), never in the EPS. Their sizes are the labels of the archon plans (width / height), and the 2D plan shows the same labels.
- Edges are read from the plan: along the open tops, sills and heads and up every corner of the wall outline.
- No masking panels: a finish or a band is the face of a wall or of the slab edge, only where they are. Every piece belongs to the floor it stands on; the floors are split by one horizontal plane for the whole house, the top of the ground floor walls: below it the ground floor (with the soffit over the entrance recess), above it the attic (with the ring beam and slab). The front looks as on the archon visualisation: a white band across the whole width from the underside of the beam over the entrance to the attic windows, graphite below and above. Nothing reaches into the roof: every attic wall ends at the roof underside, the knee walls too, sloping down to their outer face.

## 3. Layer tree

- Floors and roof: Parter, Piętro, Dach. They are layers too, but the menu shows them in a row of their own.
- Material layers, flat, each a layer of the build: Fundament, Pustaki (the block core), Wieniec i strop, Styropian, Elewacja (the finish), Krawędzie, Okna i drzwi, Schody, Kominek, Posadzki (Drobne docinki), Teren.
- A wall is drawn in its material layers: its core under Pustaki, its EPS under Styropian, its finish under Elewacja. The reveals of windows and doors are part of the wall: in front of the glass under Elewacja, behind it under Pustaki; only the glass, frames and leaves are Okna i drzwi. So each layer of the build can be seen alone (for example only the EPS shell).
- A child is shown only with its parent: no marked cuts without tiles.
- Every element is assigned to one or more layers, on its own node, on its kind or on its build-up layer; a floor gives its layer to everything standing on it. An element is drawn only when **all** of its layers are on. An edge line belongs to the piece it is on.
- Switching a layer changes only what is shown, never the model or the tile counts. Nor the camera: switching floors or layers keeps the view, so the states can be compared.
- A sub-project adds its layers as a branch, for example Kuchnia (Korpusy, Fronty, Blaty, Półki, Nóżki).

## 4. Menu tree

- The menu decides what is shown and from where; the panel holds only the parameters of what the menu has chosen.
- **Top left**: one toggle 3D / 2D.
- **3D**, at the top:
  - first row: Parter, Piętro, Dach as check boxes;
  - second row: the material layers;
  - a third row when a room is selected: its name and its sub-project.
- **3D**, at the bottom: the cameras: Spacer (the walk), the cameras of the house, and those of the open floor.
- **Help**: an icon in the corner opens the instructions as a popup.
- **2D**: both floors side by side in the page itself, cut at a fixed height from the data (150 cm). Zoom and SVG download are in the panel.
- **Deeper levels** later: a view may hold views of its own, each with its own row (Parter → Kuchnia → switches for worktops and carcasses). A deeper view inherits from its parent and may hide more, set its own cameras and show its own settings.
- The panel follows what is shown:
  - Przekrój (the cut height) and Pomieszczenia only for the open floor: the highest floor shown with the roof off. With the roof on the house is whole and nothing is cut. At the top of its range the cut is off.
  - The see-through roof slopes only for an open floor under the roof.
  - The floor settings of a room open under its own row in the list of rooms (an accordion). Rooms with no wall between them (walk-in wardrobes) are tiled with their room.
  - 2D: zoom and download only; no rooms, no layers, no light, no room selection.
  - Light only in 3D.

## 5. Materials and products

- Materials are a library of their own (materials.js), independent of the geometry: an element names its material.
- A tile product is one inseparable whole: texture, tile size and joint belong to the product. The page lets you choose the product, never its texture, size or joint apart from it.
- What belongs to the laying, not to the product: pattern, direction of the tile length, grout colour, offsets.

## 6. Rooms with sub-projects

- A complex room has a link to its own project in the same repository: the living room with the kitchen (kitchen/view.html), the two bathrooms (bath/view.html). The rooms table and the 2D plan open it.
- Integration later: a sub-project is mounted into the three trees under its room:
  - its geometry under the room node;
  - its layers as a branch of the layer tree;
  - its views as sub-views of the floor view, with its settings in the panel.
- The house is ready for this now: views and layers are trees, settings follow the node in force, materials and products are shared libraries.
- Until then the sub-projects keep their own data and coordinates; the house does not copy their numbers.

## 7. Not yet done

- No sub-views exist yet: the menu tree has one level under each view.
- The page draws exactly two floors (ground floor and attic under the roof). The tree can hold more, but the drawing of the roof and the stair assumes these two.
