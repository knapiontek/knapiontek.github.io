# Core

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

Shared code for every page: the house and every sub-project. It knows no project.

## Files

| File | Holds |
|---|---|
| geometry.js | convex polygons and prisms: clip, subtract, intersect, split, section, volume, overlaps |
| mesh.js | welded points, faces, visible pieces, batches of triangles |
| scene.js | renderer, materials, meshes, edges, caps, light, camera, navigation, walk, loop |
| ui.js | the screen of every page: stored state, the layer tree, the menus, the panel's tabs, ☀ and ?, the mode switch, the 2D sheet, the checks list, the column widths of a table (set with its data: fixed for numbers and codes, shares of the room for text) |
| library.js | loads the library's textures when a page needs them (one file per image) |
| plan.js | the 2D plan from the solids: cut, seen from above, labels, rooms, dimensions, sheets |
| sheet.js | the spreadsheet: tabs, editable cells, formulas, pages in tabs, XLSX export |
| info.js | Info of every application: the screen, the order of the tabs, the shared sheets (Kosztorys, Lista cięć, a plain table), the bottom menu |
| ui.css | the look of every view, light and dark |

## How it fits together

```
cells ─► mesh.js ─► pieces ─► scene.js ─► view
   └───► geometry.js ─► checks
```

- geometry.js runs without a browser or three.js; mesh.js too, except its batches (three.js meshes).
- A page hands in: cells, a material library, textures, light, edge style, the body box, walk settings.

## Cells

A cell is a solid with what it is:

- **Its solid**: a prism along x over a convex polygon (a box, at most cut by sloping lines). The scene is in metres.
- **Its material**, or a material per face by its direction and corners (a board's banded and bare edges, a board's top along the grain).
- **Its layers**: shown only while all are on; whether it draws edge lines.
- Optional: the bare material under a finish and the finish's layer; whether one can walk on it; the part it belongs to (one board or piece: a joint between two parts in one plane gets a line, one part has none); a mesh of its own, so a page can recolour it (a selected cabinet).

## Mesh

- Faces that meet share the same welded point.
- A face loses what an opposite face of its own group (its layers) covers. A part covered by another group is kept but shown only while that group is hidden.
- A finished face against another solid shows its bare material.
- **Finishes** of a room on its host's faces, as data: the faces inside a box, seen from one side, take a material, switched by a layer (a room's tiles on the house's walls).
- Every triangle remembers its cell, so a pick can name what is under the cursor.

## Scene

- **Materials**: a page's library, or a ready three.js material handed in under a key (a page whose look is its own). From the library: colour, roughness, metalness, reflect, opacity; clear coat (a lacquer); emissive and glow; one generated surface at most: plaster specks, grass, paving, wood boards, or an image (a decor photo of the textures, its size in mm, turned a quarter when its grain must run the other way).
- **Meshes and edges** go under the model root, or under a group of it that moves (a door on its hinge).
- **Edges** come from the pieces: a seam (one plane, one part) has no line, a corner (an angle) always has one; any other line hides while every group that closes it is shown. Lines are pulled toward the eye by a constant fraction; faces have no depth offset.
- **Section caps** lie just under the cut.
- **Light**: a sky, a sun around the body centre (its shadow covers the reach the page gives), fog.
- **Loop**: draws only after a change. A page that animates adds a step that runs every frame and says whether something moved.

## Views

ui.js builds the screen and its modes (3D, 2D, Info, Test) from a project's views data.

The 2D plan (plan.js) is cut from the same solids as the 3D view at the house's cut height for the floor: what the cut meets is filled in its section colour, what lies under it is seen from above, what is over it is dashed. Room and opening labels come from the house's data (a sub-project gets them with its shell), so a sub-project's plan matches the house's.
