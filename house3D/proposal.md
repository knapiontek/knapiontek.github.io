# Proposal: kitchen and bath in house3D, and the layers tree

> Proposal only, nothing is implemented. When agreed, the parts that stay move to project.md and rules.md.

## 1. What comes across

kitchen and bath are execution projects; house3D is a visualisation. The house takes their geometry, not their code or their pages.

- **Kitchen:** copy the furniture geometry as it is (every mm), converted to the house: mm → cm, kitchen x (along the window wall) → house z, kitchen z (out from the wall) → house −x, y stays. Turning 90° is a swap of axes, no rotation matrix.
- **House walls win.** The kitchen's own room (walls, window, floor) is not taken. The plasterboard (Zabudowa GK) is the one piece refitted: it is rebuilt to the house walls, not copied.
- **Bath:** half visual, half execution. Take the ideas (vanity, shower, WC casing, suspended ceiling, wall tiles, fittings) and build them in the house's own terms on the house walls; the bath numbers that disagree with the house walls give way.
- The converted data is written into house3D data files by a converter run, so view.html still knows no kitchen and no bath. Re-run it when kitchen/design.js changes.

## 2. Layers tree

Two separate questions, as now: **where** is the menu row at the top (floors, then rooms), **what** is the panel (material layers).

### House view: two levels at most

```
Warstwy
 ☑ Konstrukcja        ▸   Fundament, Pustaki, Wieniec i strop
 ☑ Ocieplenie         ▸   Styropian, Elewacja
 ☑ Okna i drzwi
 ☑ Wnętrze            ▸   Schody, Kominek, Posadzki (Drobne docinki)
 ☑ Teren
 ☑ Krawędzie
 ─────────
 ☑ Kuchnia            ▸   Korpusy, Fronty, Blat, AGD, Zabudowa GK
 ☑ Łazienki           ▸   Płytki, Prysznic, Ceramika i armatura, Szafka, Zabudowa i sufit
```

- A group's check box has three states: all, some, none. The arrow opens the group.
- Kuchnia and Łazienki are listed only while their floor is shown.

### Room view: the detail comes with the room

Choosing Kuchnia in the second menu row moves the camera as now and adds a Kuchnia section to the panel, with the kitchen's full detail and its settings:

```
Kuchnia
 Korpusy   ☑ Płyty  ☑ Plecy  ☑ Półki  ☑ Szuflady  ☐ Okucia  ☐ Otwory  ☑ Nóżki
 Fronty    ☑ Fronty  ☑ Uchwyty  ☑ Listwy  ☑ Panele  ☑ Cokół
 Blat      ☑ Blaty  ☑ Panele końcowe  ☑ Panel ścienny
 AGD       ☑ Zlew  ☑ Płyta  ☑ Okap  ☑ Piekarnik  …
 Ustawienia: uchwyty [mosiądz ▾]  ☐ otwarte drzwi i szuflady
```

The fine layers are a row of check boxes per group, not a third level. The bathrooms get the same kind of section.

### What changes in the kitchen's layers

- Its group Pomieszczenie is dropped: Ściany, Okno, Podłoga belong to the house.
- Sufit and Lampy go under Kuchnia (they are the kitchen's design).
- Zabudowa GK is a layer of its own under Kuchnia, because it is refitted to the house walls.

### Data, not code

house.js says where each sub-project layer hangs (kitchen carcasses → under Kuchnia). The converter maps the layers together with the geometry.

### Optional

- **Solo:** Alt-click (a long press on a phone) on a layer shows only that layer.
- **Presets** at the top of the panel: Wszystko, Konstrukcja, Tylko meble.

## 3. Open questions

1. Kuchnia and Łazienki in the same Warstwy list (as above), or only in their own panel section?
2. Solo and presets, or plain check boxes only?
3. Floors of the kitchen and the bathrooms: laid by the house (as now) or taken from the sub-project?
4. Kitchen against the bathroom wall: the house plan gives 255.6 cm from the window start, the kitchen 250.2 cm. With the house walls winning and the furniture fixed, the 5.4 cm goes where: a filler panel at the wall, or the kitchen moves along the wall?
