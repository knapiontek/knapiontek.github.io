# Core

Shared code for every page. Knows no project: a page hands it data; core returns what is drawn, counted or checked.

## Files

| File | Does |
|---|---|
| load.js | the one data loader: a file by its path from the home folder, checked for format and version (the folder that has a file knows its path). First script of every page |
| tree.js | the tree of nodes: node by path, path of a node, place (sum of offsets), box, setting from the cascade (and the node it comes from), refs, walk, checks |
| tools.js | short pieces of no one file: how numbers are written (en-GB on every page and in every sheet); text into HTML; a sheet's rows and columns (formula and input cells, column widths and how each shows, money columns, row kinds) |
| geometry.js | exact solids: convex polygons, prisms; clip, subtract, intersect, split, section, volume, overlap; rectangles; the compass sides; a stable random number |
| faces.js | surfaces ready to draw: welded points, faces of solids, visible pieces (a face loses what another covers) |
| scene.js | the 3D view, one per page, cleared and relit for another view: renderer (physical lights), materials, pieces batched per material, edges, ghosts (hidden, still casting shadow), moving parts, sun and clouds, camera and flights, navigation, walk; a description drawn (below); redraws only after a change. The only file with three.js |
| drawing.js | a description of what is drawn, as data (below): the drawing context a room hands its cabinets and products |
| plan2d.js | the 2D plan from the same solids: cut filled, below seen, above dashed; labels, room borders without a wall (dash-dot), dimensions, sheets side by side |
| sheet.js | spreadsheet: sheets in tabs, input cells, live formulas, tree sheets (levels, + / −), XLSX with the same formulas and outline; the Documents screen (each table built once, changed in place) |
| estimate.js | the sheet Estimate, alike on every page: items by category, quantity × price, sums, reserve, total |
| ui.js | the screen (Alpine.js): a page's part (state kept in the browser), modes, panel tabs, bottom menu, floating boxes, 2D zoom and drag; the shared pieces (below); light/dark and panel shown/hidden, one choice for all pages; layers; sun; table column widths |
| ui.css | the look of every page, light and dark: menus, panel, sheets and design tables, 2D sheet and elevations, pick lists |

## Flow

```
data file ─► load.js ─► page ─► tree.js ─► module of each type ─► solids, or a description (drawing.js)
solids ─► faces.js ─► scene.js (3D)      solids ─► plan2d.js (2D)
description ─► scene.js (3D)
rows ─► sheet.js (Documents, XLSX)         checks ─► Test
```

- **Without a browser** (tested in Node): tools, geometry, tree, faces, drawing, plan2d (SVG as text), the formulas of sheet. Every file but load.js loads in Node: none touches the browser on load.
- **Browser only**: load.js (script tags), scene.js (WebGL), the screen of ui.js and sheet.js, the XLSX download.
- **Screen pieces** (`<template x-part="name">`; one that takes the page's content gets the template's content): nav (top left: house, floors, rooms), view (3D canvas), loading, modes (top right), plan (2D), docs (Documents), dock (bottom menu), pad (walk arrows), sun, help, corner (◐ light/dark, ☀ sun, ? help, » « panel), panel (title, tabs, the page's sections), layers (blocks of switches); sheet.js adds sheet. The pieces read the page part's fields (title, modes, menu, layers, state).

## Description (drawing.js)

What a drawing gives, as data; scene.js draws it, in the order described. Places in a group's frame: x along the group, y out of its wall, h up from the floor (mm).

| Part | Holds |
|---|---|
| solids | exact solids (cells of core): a prism, its material, layers, part (a joint between parts shows a line), name |
| details | a shape only for the look (not counted, not cut in 2D): the shape, its material, its frame, its place [x, y, h] and turn (angles, a direction or a matrix), its layers, shadow |
| shapes | in the detail's own axes (x along, y up, z out of the wall): box, cylinder (two radii, open, an arc), sphere (arcs), disc, ring, plane, torus, tube (a curve's points), extrude (a profile, a depth), mesh (points, triangles); then turned and moved, in order |
| material of a detail | a key; a key per face group; a key seen from inside or both sides; a display's text |
| frames | a group's frame, in a moving part or not; or a frame turned about h at a point of another |
| moving parts | a door, a drawer, an appliance door: a point of its axis, which way, how far, what must open first; its solids and details |
| lamps | point or spot: colour, intensity, reach, angle, from and to (points of the house), shadow; lit by night while their layer is on |
| looks | a material painted once with specks: size, background, count, dots (colour, share, alpha), repeat |

## Rules

- **Exact solids**: a prism along x over a convex polygon: a box, at most cut by sloping lines. Nothing patched afterwards: errors are fixed in the data or the module that makes the solid.
- **Built once, then only looked at**: meshes built on load; a layer shows or hides; a moving part is built closed and only moved.
- **One mesh**: one list of points, welded at 0.05 mm: no T-junctions, no cracks, no two faces in one plane. Nothing enlarged, moved or hidden to cover a fault.
- **No shared volume**: no two solids share volume; core gives the check, a page runs it.
- **Edges are a layer**: a seam (one plane, one part) has no line; a corner always has one.
- **Layers**: a child shows only with its parent; a solid only while all its layers are on. A switch changes only what shows: no count, no camera.
- A change to core changes no page's model or picture unless that is its point.
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
