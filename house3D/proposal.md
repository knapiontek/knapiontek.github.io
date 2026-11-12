# Proposal: kitchen and bath in house3D

> Status: the kitchen and the bathrooms take their room from the house (rooms.js); the kitchen is drawn by core in house axes. Still open: bringing their furniture into the house view (below), and the bathrooms moving to house axes and core. Once agreed, what stays moves to project.md and rules.md.

## 1. What comes across

The kitchen and bath projects are for building; house3D is for looking. The house takes their geometry, not their code or pages.

- **Kitchen**: furniture copied exactly. Both projects already use house axes and positions (view.js), so nothing is converted.
- **The kitchen follows the house.** Its own room (walls, window, floor, ceiling) is not taken; it already draws the house's. Only the plasterboard (Zabudowa GK) is rebuilt against the house walls.
- **Bath**: its ideas (vanity, shower, WC casing, suspended ceiling, wall tiles, fittings) are rebuilt on the house walls. Where bath numbers disagree with the house walls, the house wins.
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
3. Floors of the kitchen and bathrooms: laid by the house or taken from the sub-project? Today the house lays tiles in every room, the kitchen paints its own tile choice (kitchen/textures.js) on the top of the house's slab, and the bathrooms lay their own tiles 3 mm over it.
4. Kitchen against wall #5: the furniture now stands against the real wall #5 (x 7220), so the kitchen's 2 mm sit at the window (the house window starts at kitchen x 872, the kitchen planned 870). Accept, or add a filler?
5. Kitchen tall units (group 2) run 2888 out from the window wall, wall #5 is 2860: the last 28 mm stand past the wall's end, in the passage.
