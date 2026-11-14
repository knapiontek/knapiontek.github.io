# Bathroom project

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

Both bathrooms of the house: the ground floor (room 7) and the attic (room 5). Open **index.html**; `?floor=ground` or `?floor=attic`.

## Files

| File | Holds |
|---|---|
| design.dat.js | the design of both bathrooms: what goes where, the tiles, boards and fittings chosen (keys of the library); per floor `model`: solids, details, doors and drawers, lamps, cuts and cameras in house axes and mm. No room (the house's), no product (the library's); per floor also `info` (the vanity, its parts, hardware, purchases, steps, points, dimensions) and `checks` (measured on the model) |
| room.js | the bathrooms' furniture, an implementation of the interface room.js of the root: design.dat.js's model drawn in house axes and mm (solids, round details, doors and drawers, lamps, tiles, the room's cuts); the same code for this page and the house |
| index.html | the page in the shared screen: 3D (Parter / Poddasze), 2D, Info (Kosztorys, Lista cięć, eRozkrój, Szafka, Montaż, Podejścia, Wymiary; XLSX, CSV), Test; tabs Warstwy, Wykończenie |
| index.html | directory listing, not part of the project |

Uses house (building.dat.js, model.js, shell.js) for the room, library for products and textures, core for drawing and the screen.

## How it fits together

```
house/building.dat.js ─► house/shell.js ─► the room ─┐
design.dat.js ─► room.js ───────────────────────────┴─► index.html, the house ─► core
```

- The room is the house's; everything is in house axes and mm.
- The 2D plan is cut from the same solids at the house's height; Info lists what design.dat.js says (the vanity, its parts, hardware, purchases, steps, points, dimensions) with the products of the library; Test measures the checks of design.dat.js on the model.
- The page writes nothing back; the viewer's choices (tiles, decor, fittings, style, layers, mode) stay in the browser, per floor.
