# Core

> How the files work together. What core must do: rules.md.

Shared code of every 3D view. Knows no project.

## Files

| File | Owns |
|---|---|
| geometry.js | convex polygons and prisms: clip, subtract, intersect, split, section, volume, overlaps |
| mesh.js | welded points, faces, visible pieces, conforming faces |
| scene.js | renderer, materials, meshes, edges, caps, light, camera, navigation, walk, loop |
| ui.js | stored state, layers tree, help, checks list |
| ui.css | the look of every view |

## Data flow

```
solids ──► mesh.js ──► pieces ──► scene.js ──► view
   └─────► geometry.js ──► checks
```

- geometry.js and mesh.js run without a browser or three.js.
- A project hands in: solids, materials, textures, light, edge style, body box, walk settings.

## Solids

- Prism along x over a convex polygon in y-z: a box, cut at most by lines z = a + s·y.
- Units mm; x along, y across, z up. The scene: metres, y up.
- A solid carries: element, material, section colour, layers, edges on/off; optional bare material under a finish, finish layer, material per face direction, walkable.

## Mesh

- Two faces that meet use the same welded point.
- A face loses what an opposite face of its own group covers. A part covered by another group is a contact piece, seen only while that group is hidden.
- A finished face against another solid shows its bare material.
- Edges from the topology of the pieces: seam (one plane, no line), corner (angle, line); any other line hides while every group that closes it is shown.
- Section cap 0.5 mm under the cut.
- No slope-dependent depth offset. Edge lines pulled toward the eye by a constant fraction.

## Code style

- Short functions, one idea per line, meaningful names.
- No project numbers, names or rules in the code.
- Library versions pinned (three.js r128).
- Page text Polish; code and comments English.
- No backward compatibility code.
