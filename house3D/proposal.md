# Proposal: kitchen and bath in house3D

> Not built. Once agreed, what stays moves to project.md and rules.md.

## 1. What comes across

The kitchen and bath projects are for building; house3D is for looking. The house takes their geometry, not their code or pages.

- **Kitchen**: furniture copied exactly (both in mm). Kitchen axes map to house axes by a swap, no rotation: kitchen x (along the window wall) → house x, kitchen z (out from the wall) → house −y, kitchen y (up) → house z.
- **House walls win.** The kitchen's own room (walls, window, floor, ceiling) is not taken. Only the plasterboard (Zabudowa GK) is rebuilt against the house walls.
- **Bath**: its ideas (vanity, shower, WC casing, suspended ceiling, wall tiles, fittings) are rebuilt on the house walls. Where bath numbers disagree with the house walls, the house wins. (Bath data is in metres.)
- **Converter**: a script writes the converted data into house3D data files, so view.html still knows nothing of kitchen or bath. Re-run it when kitchen/design.js changes.

## 2. Layers

The top menu says **where** (floors, then rooms); the panel says **what** (material layers).

**House view**, two levels at most:

```
Warstwy
 ☑ Konstrukcja    ▸ Fundament, Pustaki, Wieniec i strop
 ☑ Ocieplenie     ▸ Styropian, Elewacja
 ☑ Okna i drzwi
 ☑ Wnętrze        ▸ Schody, Kominek, Posadzki (Drobne docinki)
 ☑ Teren
 ☑ Krawędzie
 ─────────
 ☑ Kuchnia        ▸ Korpusy, Fronty, Blat, AGD, Zabudowa GK
 ☑ Łazienki       ▸ Płytki, Prysznic, Ceramika i armatura, Szafka, Zabudowa i sufit
```

- A group box has three states (all, some, none); the arrow opens it.
- Kuchnia and Łazienki are listed only while their floor is shown.

**Room view**: selecting Kuchnia adds a Kuchnia section with its detail, one row of check boxes per group (no third level):

```
Kuchnia
 Korpusy   ☑ Płyty ☑ Plecy ☑ Półki ☑ Szuflady ☐ Okucia ☐ Otwory ☑ Nóżki
 Fronty    ☑ Fronty ☑ Uchwyty ☑ Listwy ☑ Panele ☑ Cokół
 Blat      ☑ Blaty ☑ Panele końcowe ☑ Panel ścienny
 AGD       ☑ Zlew ☑ Płyta ☑ Okap ☑ Piekarnik …
 Ustawienia: uchwyty [mosiądz ▾]  ☐ otwarte drzwi i szuflady
```

The bathrooms get the same kind of section.

**Kitchen layer changes**: Pomieszczenie goes (its walls, window and floor belong to the house); Sufit and Lampy move under Kuchnia; Zabudowa GK becomes its own layer. house.js says where each sub-project layer hangs.

**Optional**: Solo (Alt-click or long press shows one layer only); presets at the top (Wszystko, Konstrukcja, Tylko meble).

## 3. Open questions

1. Kuchnia and Łazienki in the Warstwy list, or only in their own section?
2. Solo and presets, or plain check boxes?
3. Floors of the kitchen and bathrooms: laid by the house (as now) or taken from the sub-project? Today they differ: the ground floor bathroom floor is Authority Graphite in the house but Authority Grey 80×80 in bath/data.js.
4. Kitchen against the bathroom wall: the house gives 2500 mm from the window start to wall #5 (analysis § 11: x 4720 → 7220); the kitchen needs 2502. With the house walls fixed and the furniture fixed, where do the 2 mm go: a filler at the wall, or the kitchen shifts? (Check which point the kitchen measures from first.)
5. Kitchen ceiling: 2740 in kitchen/view.js, 2720 in the house. Does the kitchen's ceiling and lighting (Sufit, Lampy) follow the house?
