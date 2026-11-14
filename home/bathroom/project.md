# Bathroom project

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

Both bathrooms of the house: the ground floor (room 7) and the attic (room 5). Open **view.html**; `?floor=ground` or `?floor=attic`.

## Files

| File | Holds |
|---|---|
| data.dat.js | the design of both bathrooms: what goes where, the tiles, boards and fittings chosen (keys of library/products.dat.js); per floor `model`: solids, details, doors and drawers, lamps, cuts and cameras in house axes and mm. No room (the house's), no product (the library's) |
| parts.js | the part: data.dat.js's model drawn in house axes and mm (solids, round details, doors and drawers, lamps, tiles, the room's cuts); the same code for this page and the house |
| engine.js | (for now) data.dat.js turned into checks and Info (estimate, cut list, tables). Draws nothing |
| view.html | the page in the shared screen: 3D (Parter / Poddasze), 2D, Info (Kosztorys, Lista cięć, eRozkrój, Szafka, Montaż, Podejścia, Wymiary; XLSX, CSV), Test; tabs Warstwy, Wykończenie |
| index.html | directory listing, not part of the project |

Uses house (house.dat.js, engine.js, house-clip.js) for the room, library for products and textures, core for drawing and the screen.

## How it fits together

```
house/house.dat.js ─► house/house-clip.js ─► the room ─┐
data.dat.js ─► parts.js ───────────────────────────────┴─► view.html, the house ─► core
        └► engine.js (Info, Test) ──────────────────► view.html
```

- The room is the house's, in house axes and mm. Fittings are placed by their distance from the room's walls.
- The 2D plan is cut from the same solids at the house's height; Test shows engine.js's checks.
- The page writes nothing back; the viewer's choices (tiles, decor, fittings, style, layers, mode) stay in the browser, per floor.
