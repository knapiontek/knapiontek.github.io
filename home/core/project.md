# Core

Shared 3D code for every view: the house (../house/view.html) and its sub-projects (../kitchen/view.html, ../bathroom/view.html). It knows no project. What it must do: [rules.md](rules.md).

## Files

| File | Holds |
|---|---|
| geometry.js | convex polygons and prisms: clip, subtract, intersect, split, section, volume, overlaps |
| mesh.js | welded points, faces, visible pieces, batches of triangles |
| scene.js | renderer, materials, meshes, edges, caps, light, camera, navigation, walk, loop |
| ui.js | the screen of every page (../project.md, Flow): stored state, the layer tree, the menus, the panel's tabs, ☀ and ?, the mode switch, the 2D sheet, the checks list |
| library.js | loads the library's textures when a page needs them (one file per image) |
| plan.js | the 2D plan from the solids: cut, seen from above, labels, rooms, dimensions, sheets |
| sheet.js | the spreadsheet: tabs, editable cells, formulas, pages in tabs, XLSX export |
| info.js | Info of every application (../project.md, Info): the screen, the order of the tabs, the shared sheets (Kosztorys, Lista cięć, a plain table), the bottom menu |
| ui.css | the look of every view, light and dark |

## How it fits together

```
cells ─► mesh.js ─► pieces ─► scene.js ─► view
   └───► geometry.js ─► checks
```

- geometry.js and mesh.js run without a browser or three.js.
- A page hands in: cells, a material library, textures, light, edge style, the body box, walk settings.

## Cells

A cell is a solid with what it is:

- **S**: a prism along x over a convex polygon in y-z (a box, cut at most by lines z = a + s·y). Units mm; x along, y across, z up. The scene is in metres with y up.
- **material**, or **faceMaterial(n, points)**: a material per face by its normal and corners (a board's banded and bare edges, tiles on a wall face open to the room).
- **layers**: shown only while all are on. **edges**: whether it draws edge lines.
- Optional: **raw** (the bare material under a finish) and **finish** (its layer); **walkable**; **part** (one board or piece: a joint between two parts in one plane gets a line, one part has none); **batch** (kept in a mesh of its own, so a page can recolour it, e.g. a selected cabinet).

## Mesh

- Faces that meet share the same welded point (0.05 mm).
- A face loses what an opposite face of its own group (its layers) covers. A part covered by another group is kept but shown only while that group is hidden.
- A finished face against another solid shows its bare material.
- Every triangle remembers its cell, so a pick can name what is under the cursor.

## Scene

- **Materials**: a page's library, or a ready three.js material handed in under a key (a page whose look is its own). From the library: colour, roughness, metalness, reflect, opacity; clear coat (a lacquer); emissive and glow; one generated surface at most: plaster specks, grass, paving, wood boards, or an image (a decor photo of the textures, its size in mm, turned a quarter when its grain must run the other way).
- **Meshes and edges** go under the model root, or under a group of it that moves (a door on its hinge).
- **Edges** come from the pieces: a seam (one plane, one part) has no line, a corner (an angle) always has one; any other line hides while every group that closes it is shown. Lines are pulled toward the eye by a constant fraction; faces have no depth offset.
- **Section caps** lie 0.5 mm under the cut.
- **Light**: a sky, a sun around the body centre (its shadow covers the reach the page gives), fog.
- **Loop**: draws only after a change. A page that animates adds a step that runs every frame and says whether something moved.

## Views

The screen and its modes (3D, 2D, Info, Test) are in ../project.md, Flow; ui.js builds them from a project's views data.

The 2D plan (plan.js) is cut from the same solids as the 3D view at the house's cut height for the floor: what the cut meets is filled in its section colour, what lies under it is seen from above, what is over it is dashed. Room and opening labels come from house.js, so a sub-project's plan matches the house's.

## Code style

As ../project.md. three.js is pinned at r128.
