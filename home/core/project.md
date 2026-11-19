# Core

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

Shared code for every page. It knows no project: a page hands it the data, and core gives back what is drawn, counted or checked.

## Files

| File | Does |
|---|---|
| load.js | the one loader of data: a data file by its path from the home folder, checked for its format and version; the path of every kind of data file by its key. The first script of every page |
| tree.js | the tree of nodes: a node by its path and the path of a node; a node's place (the sum of the offsets) and box; a setting from the cascade with the node it comes from; the nodes a node refers to; a walk over all nodes; the checks of the tree |
| geometry.js | exact solids: convex polygons and prisms; clip, subtract, intersect, split, section, volume, overlaps; rectangles; a stable random number (hash01) |
| surface.js | the surfaces of solids, ready to draw: welded points, the faces of the solids, the visible pieces (a face covered by another loses that part), finishes on the faces of a host (a room's tiles on the house's walls) |
| scene.js | the 3D view: renderer, materials, the pieces as triangles batched per material, edges, ghosts (hidden, still casting their shadow), moving parts (doors and drawers), light, the sun and the clouds (they weaken the sun, strengthen the sky and soften the shadows), camera and flights, navigation, the walk, the loop that draws only after a change |
| plan2d.js | the 2D plan from the same solids: what the cut meets is filled, what lies under it is seen from above, what is over it dashed; labels of openings and rooms, borders of rooms with no wall between them (dash-dot), dimensions, sheets side by side |
| sheet.js | the spreadsheet: sheets in tabs, inputs the viewer may change, live formulas, a sheet as a tree (rows with levels, + / − to open and close), the XLSX with the same formulas and the outline; the Documents screen, a piece of the screen (its table built once per sheet and changed in place: a field typed in is never redrawn) |
| estimate.js | the sheets every room's Documents share: the estimate (items by category, quantity × unit price, sums, the total) and the cut list (the boards to order with their edges, m², banding and cuts) |
| library.js | the library for a page: the products of every group, the shops, the materials; the textures loaded by key; the checks of the library |
| ui.js | the screen of every page, on Alpine.js: a page's Alpine part (its state kept in the browser and saved on every change, the mode, the panel's tabs, the bottom menu, the floating boxes, the 2D sheet's zoom and drag); the pieces of the screen, written once (below); light or dark and the panel shown or hidden, one choice for every page; the layers as lists; the sun; the checks (OK, faults, or to know); the widths of a table's columns |
| ui.css | the look of every page, light and dark: the menus, the panel, the sheets (Documents and the editor's tables: a frame with round corners, the title as the first row, a field the viewer may change shaded, a line under it), the 2D sheet and the elevations (light or dark alike), the list to pick from. A page has no style of its own |
| test.html | every module of core on a small tree of boxes: the check of core on its own |
| test.tree.js | the tree test.html draws |

## How it fits together

```
data file ─► load.js ─► page ─► tree.js ─► the module of each type ─► solids
solids ─► surface.js ─► pieces ─► scene.js ─► 3D
solids ─► plan2d.js ─► 2D        rows ─► sheet.js ─► Documents, XLSX        checks ─► ui.js ─► Test
```

- **Computed without a browser**: geometry.js, tree.js, surface.js, plan2d.js (the SVG as text), the formulas of sheet.js. They are tested in Node first.
- **The browser only where nothing else can do it**: load.js (script tags), scene.js (WebGL), the screen of ui.js and of sheet.js (Alpine.js), the XLSX download. No file touches the browser when it loads (a page starts its screen), so every file but load.js loads in Node.
- **The screen**: a page's HTML is its layout; a piece of the screen comes in with `<template x-part="name"></template>`, and a piece that takes the page's own content (help, panel) gets what the template holds. The pieces: nav (top left: the house, its floors and rooms), view (the 3D canvas), loading, modes (top right), plan (the 2D sheet), docs (Documents), checks (Test), dock (the bottom menu), pad (the walk's arrows), sun, help, corner (◐ light or dark, ☀ the sun and the clouds, ? help, » « the panel), panel (the title, the tabs, then the page's sections), layers (the layers in blocks, as switches); sheet.js adds sheet. A page gives its part its own fields and its load; the pieces read the part's fields (title, the modes, the menu, the layers, the state), so what is shown follows them.
- Every module is `HOME.<file name>`. The one name outside that rule is `HOME.data`, which every data file calls: it is defined by load.js.

## Rules

- **Exact solids.** A solid is a prism along x over a convex polygon across it: a box, at most cut by sloping lines. Nothing is patched afterwards: what is wrong is corrected in the data or in the module that makes the solid.
- **Built once, then only looked at.** Meshes are built when the page opens; a layer shows or hides what is built; a moving part is built once, closed, and the animation only moves it.
- **Edges are a layer**: a seam (one plane, one part) has no line, a corner always has one.
- The scene is in metres with y up; everything handed in and given back is in mm in the house's axes.
- A view's choices (the mode, the tab, the layers, the zoom) are kept in the browser; the sun, light or dark and the panel are one choice for every page.

## The node (format `tree`)

| Field | Means |
|---|---|
| id | the identity: letters, digits, `_` and `-`; unique among its siblings; never changed or reused |
| name | for people |
| type | what the node is; the module of that type reads it |
| offset | [x, y, h] mm from the parent's origin |
| size | [x, y, h] mm, each above 0 |
| settings | values for this node and its branch; a key may hold an object, read by a path of keys (`open.door`) |
| refs | the paths of the nodes it refers to, from the root of the tree; what each is for, its type says (a sink: the cabinet it sits in) |
| children | the nodes inside it |

A data file whose root is a node puts its `format` and `version` beside the node's own fields. The checks of the tree: a type, an offset and a size on every node; ids without spaces or slashes; ids unique among siblings; sizes above 0; every ref is the path of a node; to know: what lies below the root's zero. A node's place is measured in the root's own axes: the root's own offset (its place in what holds it) is not part of them.

## test.tree.js

A room with a floor, a wall, a cabinet of boxes with a door and two drawers (one refers to the cabinet's bottom), and one box outside its parent, which Test reports on purpose. The root's settings give the material, the front side, how far doors and drawers open, and `view`: the layers, the edges, the light, the cameras, the walk, the cut and the height of the 2D plan.
