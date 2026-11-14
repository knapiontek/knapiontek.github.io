# Bathroom project

Both bathrooms of the house: the ground floor (room 7) and the attic (room 5). Open **view.html**; `?floor=ground` or `?floor=attic`.

## Files

| File | Holds |
|---|---|
| data.js | the design of both bathrooms: what goes where, the tiles, boards and fittings chosen (keys of ../library/products.js); per floor `model`: solids, details, doors and drawers, lamps, cuts and cameras in house axes and mm. No room (the house's), no product (the library's) |
| parts.js | the part (../core/parts.js): data.js's model drawn in house axes and mm (solids, round details, doors and drawers, lamps, tiles, the room's cuts); the same code for this page and the house |
| engine.js | (until stage 3, ../project.md Plan 1) data.js turned into checks and Info as data in the shared format of ../core/info.js (estimate, cut list, tables). Draws nothing |
| view.html | the page in the shared screen (../project.md, Flow): 3D (Parter / Poddasze), 2D, Info (Kosztorys, Lista cięć, eRozkrój, Szafka, Montaż, Podejścia, Wymiary; XLSX, CSV), Test; tabs Warstwy, Wykończenie |
| index.html | directory listing, not part of the project |

Uses ../house (house.js, engine.js, house-clip.js) for the room, ../library for products and textures, ../core for drawing and the screen.

## How it fits together

```
../house/house.js ─► ../house/house-clip.js ─► the room ─┐
data.js ─► parts.js ──────────────────────────────────────┴─► view.html, the house ─► ../core
        └► engine.js (Info, Test) ─────────────────────────────► view.html
```

- The room is the house's, in house axes and mm. Fittings are placed by their distance from the room's walls.
- The 2D plan is cut from the same solids at the house's height; Test shows engine.js's checks.
- The page writes nothing back; the viewer's choices (tiles, decor, fittings, style, layers, mode) stay in the browser, per floor.

## Code style

As [../project.md](../project.md).
