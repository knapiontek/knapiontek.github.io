# Core

Shared 3D code for every view. It knows no project. What it must do: [rules.md](rules.md).

## Files

| File | What it holds |
|---|---|
| geometry.js | convex polygons and prisms: clip, subtract, intersect, split, section, volume, overlaps |
| mesh.js | welded points, faces, visible pieces |
| scene.js | renderer, materials, meshes, edges, caps, light, camera, navigation, walk |
| ui.js | stored state, layers tree, help, checks list |
| ui.css | the look of every view, light and dark |

## How it fits together

```
solids ─► mesh.js ─► pieces ─► scene.js ─► view
   └────► geometry.js ─► checks
```

- geometry.js and mesh.js run without a browser or three.js.
- A project hands in: solids, materials, textures, light, edge style, body box, walk settings.

## Solids

- A prism along x over a convex polygon in y-z: a box, cut at most by lines z = a + s·y.
- Units mm; x along, y across, z up. The scene is in metres with y up.
- A solid carries its element, material, section colour, layers and whether it shows edges; optionally a bare material under a finish, the finish layer, a material per face direction, and whether the walk can stand on it.

## Mesh

- Faces that meet share the same welded point.
- A face loses what an opposite face of its own group covers. A part covered by another group is kept but shown only while that group is hidden.
- A finished face against another solid shows its bare material.
- Edges come from the pieces: a seam (one plane) has no line, a corner (an angle) always has one; any other line hides while every group that closes it is shown.
- Section caps lie 0.5 mm under the cut.
- Depth offsets are constant, never slope-dependent; edge lines are pulled toward the eye by a constant fraction.

## Code style

As house3D/project.md. three.js is pinned at r128.
