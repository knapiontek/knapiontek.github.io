# core

General code for any project: it knows no house, no room, no product. Everything it needs comes from its caller.

| File | What |
|---|---|
| `ui.js` | the screen on Alpine: `page()` (a page's Alpine part, its state kept in the browser), the pieces (`x-part`: nav, modes, dock, panel, layers, sun, help, corner), the layers as a collapsible tree (a layer: its name, or its name and the layers under it), light or dark, the panel's » « |
| `ui.css` | the look of the screen, light and dark |
| `geometry.js` | exact operations on convex polygons and prisms along x (a box cut by lines h = a + s·y): clip, intersect, subtract, split at a height; rectangles; the compass sides in the project's axes |
| `hierarchy.js` | `createHierarchy(root)`: the hierarchy of nodes, where a thing stands or hangs, built from the root down (`add`: a branch under a node in it): a node by its path, its place (the sum of the offsets), its box, a setting from the nearest node up, its refs, its layer and its floor (its own, or else its parent's), a walk, the checks (`checks(known)`: also a layer or a floor no one knows) |
| `tools.js` | how numbers are written (`fmt`) |
