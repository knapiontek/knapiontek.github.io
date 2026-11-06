# House 3D rules

> Written and edited by hand. What the house page must do and how its model is organised. How the files implement it: project.md.

## 1. Views and the panel

- The view menu is at the top of the screen: Parter, Piętro, Cały dom, Spacer (walk), the cameras of the current view, Rzut 2D.
- The settings panel on the right follows the current view: the floor layouts of the shown floor are open, the others closed; the cut height, the layers and the light apply to the 3D view and the 2D plan alike.
- The 3D view and the 2D plan are drawn from the same model: what one shows, the other shows.

## 2. The model is one tree

- The house is one tree, stored as JSON in a JavaScript file (house.js) that is loaded before anything is drawn:

  Building → Floors → Rooms → Tiles

- **Building** (the root): the shell common to all floors: roof, portals, wall kinds and their build-ups, facade, windows, doors, site, light, cameras, layers, tile layouts.
- **Floor**: its level and height, and what stands on it: walls, openings, stair, fireplace, the stair hole. Walls belong to the floor, not to a room: one wall bounds two rooms.
- **Room**: its floor area as rectangles, the tile layout that covers it, and a link to its sub-project (see 5).
- **Tiles**: not stored; laid by the page from the room and its layout.
- Every node keeps its geometry relative to its parent: a floor sets the level, and everything on a floor (sills, heads, the stair, the fireplace) is measured from it; a room is in the floor's x, z; tiles are laid in the room from the layout's offsets.

## 3. Layers

- Every element of the tree is assigned to one or more layers (on its own node or on its kind).
- An element is drawn only when **all** of its layers are on. The EPS in a wall cut belongs to Ściany and Styropian: it disappears with either.
- The layers can be switched in the panel: walls, EPS, facade, windows and doors, slabs, stair, fireplace, roof, site, floor tiles, the marked small cuts, edges. Switching a layer changes only what is shown, never the model or the tile counts.

## 4. Materials and products

- Materials are a library of their own (materials.js), independent of the geometry: an element names its material.
- A tile product is one inseparable whole: texture, tile size and joint belong to the product. The page lets you choose the product, never its texture, size or joint apart from it.
- What belongs to the laying, not to the product: pattern, direction of the tile length, grout colour, offsets.

## 5. Rooms with sub-projects

- A complex room has a link to its own project in the same repository: the living room with the kitchen (kitchen/view.html), the two bathrooms (bath/view.html). The rooms table and the 2D plan open it.
- Integration later: kitchen and bath will be mounted into the tree under their rooms (Room → Groups → Carcasses for the kitchen). The house is ready for it now: a room is a node of its own that can hold children; floors, rooms and their links are data, not code; materials and products are shared libraries.
- Until then the sub-projects keep their own data and coordinates; the house does not copy their numbers.

## 6. Not yet done

- Toggling single parts of a sub-project (carcasses, fronts, worktops, shelves, legs) comes with its integration, as layers of its nodes.
- The page draws exactly two floors (ground floor and attic under the roof); the tree can hold more, the drawing of the roof and the stair assumes these two.
