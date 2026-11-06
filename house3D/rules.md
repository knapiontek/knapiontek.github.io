# House 3D rules

> Written and edited by hand. What the house page must do and how its model is organised. How the files implement it: project.md.

## 1. Three trees and the settings

The page is made of three trees, all stored as data in house.js:

- **Geometry**: what the house is made of.
- **Layers**: what can be switched on and off.
- **Menu (views)**: how the house is looked at.

The **settings** (the panel on the right) always belong to a node of one of these trees and appear only when that node is in force:

- **Menu node**: the view's own settings (cut height, light), and which panel sections it shows.
- **Geometry node**: the settings of what it holds. A floor is selected with the menu (Parter, Piętro). A room is selected by clicking it in the 3D view, on the 2D plan or in the list. The selected room gets a row of its own in the context menu (its name, its sub-project), and the panel shows its floor: product, pattern, direction, grout, offsets. Tiles are set in the rooms, never per floor.
- **Layer node**: its switch, and in time settings of its own (for example the colour of the marked cuts).

## 2. Geometry tree

Building → Floors → Rooms → Tiles (and later Groups → Carcasses under a kitchen room)

- **Building** (the root): the shell common to all floors: roof, portals, wall kinds and their build-ups, facade, windows, doors, site, light, cameras, tile layouts.
- **Floor**: its level and height, and what stands on it: walls, openings, stair, fireplace, the stair hole. Walls belong to the floor, not to a room, because one wall bounds two rooms.
- **Room**: its floor area as rectangles, the tile layout that covers it, and a link to its sub-project.
- **Tiles**: not stored; the page lays them from the room and its layout.
- Every node keeps its geometry relative to its parent. A floor sets the level, and everything on a floor (sills, heads, the stair, the fireplace) is measured from it. A room is in the floor's x, z. Tiles are laid in the room from the layout's offsets.
- **One model**: the objects are the same in every view. A view never builds objects of its own; it only hides layers and cuts the walls. The cut runs through everything at that height, openings too: glass, frames and doors are cut like the walls, never left out.
- Nothing overlaps: a wall stands on the plinth down to the ground, on a terrace only down to the paving.

## 3. Layer tree

- The layers form a tree: Parter, Piętro, Ściany (Styropian, Elewacja, Krawędzie), Okna i drzwi, Stropy, Schody, Kominek, Dach, Teren, Posadzki (Drobne docinki).
- A child is shown only with its parent: no EPS without walls, no marked cuts without tiles.
- Every element is assigned to one or more layers, on its own node or on its kind; a floor gives its layer to everything standing on it. An element is drawn only when **all** of its layers are on and the view hides none of them.
- Switching a layer changes only what is shown, never the model or the tile counts.
- A sub-project adds its layers as a branch, for example Kuchnia (Korpusy, Fronty, Blaty, Półki, Nóżki).

## 4. Menu tree

- **Level 1** (top bar): Cały dom, Parter, Piętro, Rzut 2D.
- **Level 2**, the context menu of the chosen view:
  - Cały dom: Spacer (the walk is here only) and its cameras.
  - Parter, Piętro: their cameras.
  - Rzut 2D: zoom and download. The 2D plan shows both floors side by side, in the page itself, with the same bars as the 3D view.
- **Deeper levels**: a view may hold views of its own. Each level gets its own row of the menu, and the last row has the tools of the view in force: cameras, layer switches, plan tools. Example: Parter → Kuchnia → switches for worktops and carcasses.
- A deeper view inherits from its parent: what the parent hides stays hidden, and the deeper view may hide more, set its own cameras and show its own settings.
- The panel follows the view:
  - Przekrój (the cut height) only in views that cut the walls: not in Cały dom.
  - Cały dom offers only the coarse layers (floors, walls, openings, slabs, stair, fireplace, roof, site); the tiles and their cuts are a matter of the floors.
  - The floor settings of a room open under its own row in the list of rooms (an accordion, read from top to bottom), only in Parter and Piętro. Rooms with no wall between them (walk-in wardrobes) are tiled with their room.
  - Rzut 2D has only its own tools: cut height, zoom, download; no rooms, no layers, no light, no room selection.
  - Pomieszczenia only of the shown floor (both floors in Rzut 2D): name, area, the product on its floor; a click selects the room.
  - Light only in the 3D views.

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
