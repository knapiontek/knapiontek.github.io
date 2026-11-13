# Bathroom project

Both bathrooms of the house: the ground floor (room 7) and the attic (room 5). Open **view.html**; `?floor=ground` or `?floor=attic`.

## Files

| File | Holds |
|---|---|
| data.js | the design of both bathrooms: what goes where, the tiles, boards and fittings chosen (keys of ../library/products.js), the views and camera names. No room: that is the house's, no product: that is the library's |
| engine.js | data.js turned into geometry, cut list, edge banding, hardware, shopping list, installation points, checks, XLSX sheets. Draws nothing |
| view.html | the page: 3D, 2D plan, Analiza; panel tabs Wygląd, Szafka, Zakupy, Wymiary |
| ../house/house.js, ../house/house-clip.js | the room: the house's own walls, slab, floor, window and roof, as they are |
| ../core/ | drawing, the 2D plan, the panel and its menu, like the house |
| index.html | directory listing, not part of the project |

## How it fits together

```
../house/house.js ─► ../house/house-clip.js ─► the room ─┐
data.js ─► engine.js ──────────────────┴─► view.html ─► ../core
```

- The room is the house's, in house axes and mm. Fittings are placed by their distance from the room's walls.
- Copies the house's idea: the same menu (3D with Parter / Poddasze, 2D, Analiza), cameras in the dock, the 2D plan cut from the same solids at the house's height, Analiza showing engine.js's checks.
- The page writes nothing back; the viewer's choices (tiles, decor, style, light) stay in the browser.

## Code style

As ../project.md.
