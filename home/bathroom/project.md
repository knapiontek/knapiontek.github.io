# Bathroom project

Both bathrooms of the house: the ground floor (room 7) and the attic (room 5). Open **view.html**; `?floor=ground` or `?floor=attic`.

## Files

| File | Holds |
|---|---|
| data.js | the design of both bathrooms: what goes where, the tiles, boards and fittings chosen (keys of ../library/products.js), the views and cameras. No room (the house's), no product (the library's) |
| engine.js | data.js turned into geometry, cut list, edge banding, hardware, shopping list, installation points, checks, XLSX sheets. Draws nothing |
| view.html | the page in the shared screen (../project.md, Flow): 3D (Parter / Poddasze), 2D, Info (the vanity, shopping, dimensions; XLSX, CSV), Test; tabs Warstwy, Wykończenie |
| index.html | directory listing, not part of the project |

Uses ../house (house.js, engine.js, house-clip.js) for the room, ../library for products and textures, ../core for drawing and the screen.

## How it fits together

```
../house/house.js ─► ../house/house-clip.js ─► the room ─┐
data.js ─► engine.js ────────────────────────────────────┴─► view.html ─► ../core
```

- The room is the house's, in house axes and mm. Fittings are placed by their distance from the room's walls.
- The 2D plan is cut from the same solids at the house's height; Test shows engine.js's checks.
- The page writes nothing back; the viewer's choices (tiles, decor, fittings, style, layers, mode) stay in the browser, per floor.

## Code style

As [../project.md](../project.md).
