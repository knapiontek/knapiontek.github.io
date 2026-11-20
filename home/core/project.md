# Core

Shared code for every page. Knows no project: a page hands it data; core returns what is drawn, counted or checked.

## Files

| File | Does |
|---|---|
| load.js | the one data loader: a file by its path from the home folder, checked for format and version; the path of every kind of data file by key. First script of every page |
| tree.js | the tree of nodes: node by path, path of a node, place (sum of offsets), box, setting from the cascade (and the node it comes from), refs, walk, checks |
| geometry.js | exact solids: convex polygons, prisms; clip, subtract, intersect, split, section, volume, overlap; rectangles; the compass sides; a stable random number |
| surface.js | surfaces ready to draw: welded points, faces of solids, visible pieces (a face loses what another covers) |
| scene.js | the 3D view, one per page, cleared and relit for another view: renderer (physical lights), materials, pieces batched per material, edges, ghosts (hidden, still casting shadow), moving parts, sun and clouds, camera and flights, navigation, walk; redraws only after a change |
| plan2d.js | the 2D plan from the same solids: cut filled, below seen, above dashed; labels, room borders without a wall (dash-dot), dimensions, sheets side by side |
| sheet.js | spreadsheet: sheets in tabs, input cells, live formulas, tree sheets (levels, + / −), XLSX with the same formulas and outline; the Documents screen (each table built once, changed in place) |
| estimate.js | the sheets every furnished room shares: estimate (items by category, quantity × price, sums) and cut list (boards with edges, m², banding, cuts) |
| library.js | the library for a page: products by group, shops, materials; textures by key; its checks |
| ui.js | the screen (Alpine.js): a page's part (state kept in the browser), modes, panel tabs, bottom menu, floating boxes, 2D zoom and drag; the shared pieces (below); light/dark and panel shown/hidden, one choice for all pages; layers; sun; checks (OK, faults, info); table column widths |
| ui.css | the look of every page, light and dark: menus, panel, sheets and editor tables, 2D sheet and elevations, pick lists |
| test.html, test.tree.js | core alone: every module on a small tree of boxes (test.tree.js) |

## Flow

```
data file ─► load.js ─► page ─► tree.js ─► module of each type ─► solids
solids ─► surface.js ─► scene.js (3D)      solids ─► plan2d.js (2D)
rows ─► sheet.js (Documents, XLSX)         checks ─► Test
```

- **Without a browser** (tested in Node): geometry, tree, surface, plan2d (SVG as text), the formulas of sheet. Every file but load.js loads in Node: none touches the browser on load.
- **Browser only**: load.js (script tags), scene.js (WebGL), the screen of ui.js and sheet.js, the XLSX download.
- **Screen pieces** (`<template x-part="name">`; one that takes the page's content gets the template's content): nav (top left: house, floors, rooms), view (3D canvas), loading, modes (top right), plan (2D), docs (Documents), checks (Test mode, core/test.html), dock (bottom menu), pad (walk arrows), sun, help, corner (◐ light/dark, ☀ sun, ? help, » « panel), panel (title, tabs, the page's sections), layers (blocks of switches); sheet.js adds sheet. The pieces read the page part's fields (title, modes, menu, layers, state).
- Each module is `HOME.<file name>`; `HOME.data` (defined by load.js) is the exception.

## Rules

- **Exact solids**: a prism along x over a convex polygon: a box, at most cut by sloping lines. Nothing patched afterwards: errors are fixed in the data or the module that makes the solid.
- **Built once, then only looked at**: meshes built on load; a layer shows or hides; a moving part is built closed and only moved.
- **Edges are a layer**: a seam (one plane, one part) has no line; a corner always has one.
- The scene is in metres, y up; everything in and out is mm in the house's axes.
- Kept in the browser per view: mode, tab, layers, zoom. One for every page: sun, light/dark, panel.

## Format `tree` (a node)

| Field | Means |
|---|---|
| id | letters, digits, `_`, `-`; unique among siblings; never changed or reused |
| name | for people |
| type | what the node is; the module of that type reads it |
| offset | [x, y, h] mm from the parent's origin |
| size | [x, y, h] mm, each > 0 |
| settings | defaults for the node and its branch; nested objects read by a key path (`open.door`) |
| refs | paths (from the root) of the nodes it refers to; their meaning by type (a sink: its cabinet) |
| children | its nodes |

A file whose root is a node adds `format` and `version` to it. A node's place is in the root's axes (the root's own offset excluded).

Checks: type, offset, size on every node; ids without spaces or slashes, unique among siblings; sizes > 0; every ref resolves; info: what lies below the root's zero.

## test.tree.js

A room: floor, wall, a cabinet of boxes with a door and two drawers (one refers to the cabinet's bottom), one box below the root's zero (reported as info on purpose). Root settings: material, front side, how far doors and drawers open, `view` (layers, edges, light, cameras, walk, 2D cut height).
