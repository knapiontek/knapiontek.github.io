# Dom w papawerach 5 (G): geometry estimate

The house as the archon drawings give it, written as boxes. It stands on its own and refers to no model. All values in cm; levels may be quoted in metres (±0.00).

## 1. Sources

Drawings (this folder, `house3D\estimate`):

| File | What |
|---|---|
| `archon-rzut-parter.png` | ground floor plan |
| `archon-rzut-poddasze.png` | attic plan |
| `archon-przekroj.png` | section across the house |
| `archon-sytuacja.png` | site plan: house 910 × 1320 on a 1710 × 2120 plot, 400 free on each side; roof from above |
| `archon-elewacja-front.png` | front elevation (x = 1320) |
| `archon-elewacja-ogrod.png` | garden elevation (x = 0) |
| `archon-elewacja-prawa.png` | right elevation (y = 910): windows 100/130, 190/130, 250/240, 2 roof windows |
| `archon-elewacja-lewa.png` | left elevation (y = 0): garage window 200/100, 1 roof window |

Related projects in `C:\dev\projects\knapiontek.github.io`: `kitchen` (kitchen design) and `bath` (both bathrooms).

## 2. Axes

| Axis | Range |
|---|---|
| **x**, along the house | 0 = garden outer face → 1320 = front outer face |
| **y**, across | 0 = left outer face (garage side) → 910 = right outer face (kitchen and bathroom windows) |
| **z**, height | 0 = ±0.00 finished ground floor; 306 attic floor; 860 ridge; terrain −32 |

Left and right are as seen when facing the front of the house (the street side), which is also how archon names the elevations.

## 3. Modelling rules

- **Box.** The only solid is an axis-aligned box, `x1–x2, y1–y2, z1–z2`.
- **One shape, one box.** A wall of one material and thickness is one box from end to end, including through its doors and windows. It is never split into pieces around an opening.
- **Openings** (doors, windows) are boxes subtracted from the wall box they cross.
- **Crossings.** Where two walls cross, the load-bearing (thicker) one runs through and the other stops at its faces.
- **Under the roof.** A box that reaches the roof is still one box, with its top cut by the two roof planes (§ 6).
- **Element by element.** Each material is a separate element (block, EPS, slab, footing).
- **Points.** One list of 3D points for the model. A computed point within 0.005 cm of a listed one is replaced by it (welded); faces and edges use only listed points and take the points lying on their edges. Computed floats are never placed side by side.

## 4. How the numbers were read

- **Printed dimensions come first.** Pixels are used only to place things that have no printed number. Both plans are at 0.4297 px/cm (910 = 391 px), so 1 px ≈ 2.3 cm. The section is at 0.280 px/cm (1 px ≈ 3.6 cm). Measured values are rounded to whole cm and good to ±2.3 on the plans and ±3.6 on the section.
- **The printed chains close:**
  - Ground floor, y (front): 44 + 367 + 12 + 192 + 12 + 239 = 866, the inner face of the right wall.
  - Ground floor, x (right side): 44 + 338 + 340 + 12 + 251 + 12 + 189 = 1186, the inner face of the entrance wall. Vestibule: 1186 − 261 = 925.
  - Attic, x: 44 + 320 + 12 + 159 + 12 + 273 + 12 + 444 + 44 = **1320** ✓ (the printed overall length).
  - Attic, y: 44 + 397 + 12 + 413 = 866 ✓; 44 + 335 = 379; 866 − 301 = 565; 44 + 285 = 329; 1276 − 363 = 913; 913 − 12 − 152 = 749.
- **Roof check.** The attic plan's dashed 140 and 220 clear-height lines lie at y ≈ 65 and 156. The roof of § 6 puts them at 66 and 155.

## 5. Levels (z)

| Level | z | Source |
|---|---|---|
| Footing bottom / top | ≈ −132 / ≈ −92 | section, measured |
| Terrain | −32 | printed |
| Ground slab build-up, bottom | ≈ −36 | section, measured |
| Ground floor, finished | 0 | ±0.00 |
| Ground floor ceiling (underside of slab) | 272 | printed |
| Attic floor, finished | 306 | printed +3.06 (slab + floor = 34) |
| Roof underside at the outer wall face | 386.4 | 426 − tan 42° · 44 |
| Roof underside at the knee wall's inner face | 426 | 306 + 120 (printed knee wall) |
| Roof top at the outer wall face | 451 | printed +4.51 |
| Flat attic ceiling | 591 | 306 + 285 (printed) |
| Top of ceiling insulation | ≈ 630 | section, measured |
| Roof underside at the ridge | 796 | 426 + tan 42° · 411 |
| Ridge top | 860 | printed +8.60 (derived 860.7) |
| Chimney top / vent stack top | ≈ 900 / ≈ 870 | section / elevations |
| Height above terrain | 892 | archon 8.92 m |

## 6. Roof

- **Shape.** Dual pitch at 42°, with no eaves on the long sides. The ridge runs along x at y = 455.
- **Underside.** z = 386.4 + tan 42° · d, where d is the distance from the nearer long outer face (d = y or 910 − y, up to 455).
- **Build-up.** 64.6 measured vertically (≈ 48 perpendicular): rafters, insulation, battens, ceramic tiles. The roof top is the underside + 64.6.
- **Length.** x −100 → 1420. The roof runs on over both terraces as the portal frame (§ 8.4).
- **Flat ceiling** at z 591 wherever the underside is higher, i.e. y 227 – 683. Above it is a loft about 1.6 m high.
- **Roof windows, 3 × 94/140.** 94 along x and 140 along the slope (104 in plan). The plan draws ≈ 84 of that, measured in from the knee wall's inner face. The site plan and the elevations confirm the x positions.

| Roof window | x | y (plan) | Slope |
|---|---|---|---|
| Bedroom | 155 – 249 | 782 – 866 | right |
| Above the stairs | 639 – 733 | 44 – 128 | left |
| Attic bathroom | 639 – 733 | 782 – 866 | right |

## 7. Construction (in order)

1. **Foundations.** Footings ≈ 60 × 40 (z −132 → −92), centred under every load-bearing wall: the outer walls (block axis 32 in from the outer face, e.g. footing y 2 – 62, x 1258 – 1318), the entrance wall, the inner block-24 walls (the section shows one 61 wide) and the chimney. The foundation walls (z −92 → 0) are as thick as the walls above. archon gives 41.9 m², which fits ≈ 0.9–1.0 m height along the ≈ 42 m axis of the outer walls. Ground slab ≈ 36 thick (z −36 → 0). Plinth 32 (−32 → 0).
2. **Ground floor walls.** H+H aerated concrete: **24** for the outer and load-bearing walls, **12** for partitions, z 0 → 272. The outer walls are 44 in total: 24 block plus 20 EPS outside. The block's outer faces are at y 20 / 890 and x 20 / 1300. Windows and doors sit in the block.
3. **Slab with ring beam.** Reinforced concrete. One box x 20 – 1300, y 20 – 890, z 272 – 306 (including the attic floor build-up), minus the stair void. It also covers the entrance recess.
4. **Knee walls** (block 24, z 306 → roof, 120 high at the inner face) and **gables** (block 24, z 306 → roof).
5. **Roof.** Timber truss (6.61 m³), ceramic tiles (swissporTON), VELUX windows, 186.1 m².
6. **Insulation.** 20 EPS around the blocks, the slab edge and the window reveals, 215.8 m² of facade. Finish: white-grey plaster with timber cladding accents. U-values: walls 0.118, roof 0.12, windows < 0.9 W/(m²·K).
7. **Services.** Gas boiler, underfloor heating, gravity ventilation (the vent shaft, § 9 and § 10).

## 8. Outer walls

### 8.1 Ground floor blocks (z 0 → 272)

| Element | x | y |
|---|---|---|
| left (runs through both portal wings) | −80 – 1400 | 20 – 44 |
| right (through both wings; also the recess's right side) | −80 – 1400 | 866 – 890 |
| garden | 20 – 44 | 44 – 866 |
| garage front | 1276 – 1300 | 44 – 435 |
| garage side of the recess | 1186 – 1276 | 411 – 435 |
| entrance wall | 1186 – 1210 | 435 – 866 |

The entrance recess is open to the outside at x 1230 – 1320, y 455 – 846, roofed by the slab.

### 8.2 Attic blocks (z 306 → roof)

| Element | x | y |
|---|---|---|
| knee wall left (through both wings) | −80 – 1400 | 20 – 44 |
| knee wall right (through both wings) | −80 – 1400 | 866 – 890 |
| garden gable | 20 – 44 | 44 – 866 |
| front gable | 1276 – 1300 | 44 – 866 |

### 8.3 EPS 20

| Element | x | y | z |
|---|---|---|---|
| left (house and both wings) | −100 – 1420 | 0 – 20 | 0 → roof |
| right (house and both wings) | −100 – 1420 | 890 – 910 | 0 → roof |
| garden | 0 – 20 | 44 – 866 | 0 → roof |
| garage front | 1300 – 1320 | 44 – 455 | 0 → 272 |
| recess, garage side | 1230 – 1300 | 435 – 455 | 0 → 272 |
| entrance wall | 1210 – 1230 | 435 – 846 | 0 → 272 |
| recess, right side | 1210 – 1320 | 846 – 866 | 0 → 272 |
| front gable and slab edge | 1300 – 1320 | 44 – 866 | 272 → roof |
| recess soffit | 1230 – 1320 | 455 – 846 | 252 → 272 |

The EPS boxes start at −92 (the plinth insulation, finish below ±0 = plinth).

### 8.4 Portal (the white frame)

At each end the long walls run on past the gable as wings, 64 wide (EPS 20 + block 24 + EPS 20), z 0 → roof, with the roof over them.

- **Block**: the long wall's block itself, one box from end to end (§ 8.1, § 8.2, foundation −80 → 1400). No EPS between the house and a wing.
- **Ring beam** over the wing block, between the two floors: x −80 – 20 and 1300 – 1400, z 272 – 306, at y 20 – 44 and 866 – 890.
- **EPS**: the outer face is part of the long EPS box (§ 8.3); the inner face and a cap on the head:

| Wing | inner EPS x | inner EPS y | head EPS x | head EPS y |
|---|---|---|---|---|
| garden left | −80 – 0 | 44 – 64 | −100 – −80 | 20 – 64 |
| garden right | −80 – 0 | 846 – 866 | −100 – −80 | 846 – 890 |
| front left | 1320 – 1400 | 44 – 64 | 1400 – 1420 | 20 – 64 |
| front right | 1320 – 1400 | 846 – 866 | 1400 – 1420 | 846 – 890 |

All z −92 → roof. The terraces are 100 deep (printed) at both ends, under the portal.

## 9. Ground floor

### Inner walls (z 0 → 272 unless stated)

| # | Kind | x | y | Note |
|---|---|---|---|---|
| 1 | chimney | 471 – 547 | 379 – 455 | z −92 → ≈ 900 (on its footing), one box through both floors and the roof |
| 2 | block 12 | 535 – 547 | 44 – 379 | living / garage |
| 3 | block 12 | 642 – 654 | 320 – 435 | stair wall |
| 4 | block 24 | 654 – 925 | 411 – 435 | garage / hall, load-bearing |
| 5 | block 12 | 722 – 734 | 580 – 866 | kitchen / bathroom |
| 6a | block 12 | 734 – 901 | 615 – 627 | hall / bathroom |
| 6b | block 12 | 925 – 1186 | 615 – 627 | vestibule / boiler room |
| 7 | block 24 | 901 – 925 | 435 – 766 | load-bearing, runs through 6; built to 766 (§ 14) |
| 8 | block 12 | 925 – 985 | 754 – 766 | bathroom / boiler room; built at 754 (§ 14) |
| 9 | block 12 | 925 – 1186 | 411 – 423 | garage / vestibule |
| 10 | block 12 | 985 – 997 | 754 – 866 | bathroom / boiler room; built from 754 (§ 14) |
| 11 | vent shaft | 873 – 901 | 589 – 615 | z 0 → 306, continues as attic #10 |

### Openings

| Opening | W/H | In | x | y | z |
|---|---|---|---|---|---|
| window | 600/240 | garden | 0 – 44 | 155 – 755 | 0 → 240 |
| window | 200/100 | left | 762 – 962 | 0 – 44 | 110 → 210 |
| window | 250/240 | right | 83 – 333 | 866 – 910 | 0 → 240 |
| window | 190/130 | right | 472 – 662 | 866 – 910 | 110 → 240 |
| window | 100/130 | right | 803 – 903 | 866 – 910 | 110 → 240 |
| garage door | 275/225 | garage front | 1276 – 1320 | 115 – 390 | 0 → 225 |
| entrance door | 160/210 | entrance wall | 1186 – 1230 | 455 – 615 | 0 → 210 |
| boiler room door | 80/210 | entrance wall | 1186 – 1230 | 661 – 741 | 0 → 210 |
| door | 87/205 | #9 | 1064 – 1151 | 411 – 423 | 0 → 205 |
| door | 92/205 | #7 | 901 – 925 | 488 – 580 | 0 → 205 |
| door | 90/205 | #6a | 776 – 866 | 615 – 627 | 0 → 205 |
| door | 92/205 | #6b | 1064 – 1156 | 615 – 627 | 0 → 205 |

### Rooms (floor outline at the block faces)

archon's areas are measured after plaster, so they are 2–4 % smaller than these.

| Room | Rectangles [x1, y1, x2, y2] | Here, m² | archon, m² |
|---|---|---|---|
| Salon, kitchen and hall (5, 6, 3) | [44,44,535,379] [44,379,471,455] [44,455,547,866] [547,435,722,866] [722,435,734,580] [734,435,901,589] [734,589,873,615] | 51.02 | 35.42 + 9.67 + 5.46 = 50.55 |
| Vestibule (1) | [925,423,1186,615] | 5.01 | 4.84 |
| Bathroom (7) | [734,627,901,866] [901,766,985,866] | 4.83 | 4.95 (design) |
| Boiler room with laundry (8) | [925,627,1186,754] [997,754,1186,866] | 5.43 | 4.97 (design) |
| Garage (2) | [547,44,642,297] [642,44,654,320] [654,44,1276,411] | 25.56 | 22.35 (25.91) |
| Stairs (4) | not modelled as a room | – | 5.41 |

## 10. Attic

### Inner walls (block 12: z 306 → 591, cut by the roof where it is lower)

| # | Kind | x | y |
|---|---|---|---|
| 1 | block 12 | 364 – 376 | 44 – 391 |
| 2 | block 12 | 364 – 376 | 553 – 866 |
| 3 | block 12 | 466 – 901 | 553 – 565 |
| 4 | chimney | ground floor #1 | |
| 5 | block 12 | 535 – 547 | 44 – 379 |
| 6 | block 12 | 535 – 547 | 455 – 866 |
| 7 | block 12 | 737 – 749 | 44 – 341 |
| 8 | block 12 | 749 – 901 | 329 – 341 |
| 9 | block 12 | 820 – 832 | 565 – 866 |
| 10 | vent shaft | 832 – 901 | 565 – 626, z 306 → ≈ 870 (the second stack on the roof) |
| 11 | block 12 | 889 – 901 | 626 – 649 |
| 12 | block 12 | 901 – 913 | 44 – 649 |
| 13 | block 12 | 913 – 1276 | 441 – 453 |

### Openings

| Opening | W/H | In | x | y | z |
|---|---|---|---|---|---|
| window | 600/346 | garden gable | 0 – 44 | 155 – 755 | 306 → 652, top cut parallel to the roof: z = 652 − tan 42° · \|y − 455\| |
| window | 220/285 | front gable | 1276 – 1320 | 168 – 388 | 336 → 621, top sloping: z = 621 − tan 42° · (388 − y) |
| window | 220/285 | front gable | 1276 – 1320 | 522 – 742 | 336 → 621, top sloping: z = 621 − tan 42° · (y − 522) |
| door | 89/205 | #6 | 535 – 547 | 459 – 548 | 306 → 511 |
| door | 90/205 | #3 | 630 – 720 | 553 – 565 | 306 → 511 (built; design 650 – 740, § 14) |
| door | 82/205 | #12 | 901 – 913 | 178 – 260 | 306 → 511 |
| door | 94/205 | #12 | 901 – 913 | 347 – 441 | 306 → 511 |
| door | 90/205 | #12 | 901 – 913 | 457 – 547 | 306 → 511 |

Stair void in the slab: [547, 44, 642, 438] + [642, 44, 737, 273].

### Rooms (floor outline at the block faces)

archon's first figure is the usable area: under 140 of clear height it counts 0, between 140 and 220 it counts 50 %. The figure in brackets is the floor area.

| Room | Rectangles [x1, y1, x2, y2] | Here, m² | archon, m² |
|---|---|---|---|
| Bedroom (2) | [44,44,364,866] [364,391,376,553] [376,379,471,553] [376,553,466,565] [471,455,535,553] | 28.89 | 24.07 (28.16) |
| Wardrobe (3) | [376,44,535,379] | 5.33 | 4.13 (5.13) |
| Wardrobe (4) | [376,565,535,866] | 4.79 | 3.60 (4.60) |
| Hall (1) | [642,273,737,341] [642,341,901,553] [547,438,642,553] | 7.23 | 7.32 |
| Bathroom (5) | [547,565,820,866] | 8.22 | 6.25 (7.99) |
| Wardrobe (8) | [749,44,901,329] | 4.33 | 3.20 (4.16) |
| Room (7) | [913,44,1276,441] | 14.41 | 11.79 (14.11) |
| Room (6) | [913,453,1276,866] [832,649,913,866] [832,626,889,649] | 16.88 | 13.69 (16.53) |

## 11. Kitchen as drawn by archon

The kitchen is an L of 60-deep counters:

- **Along the right wall:** x ≈ 472 – 662, y 806 – 866, with the sink under the 190 window.
- **Along wall #5:** x 662 – 722, y 580 – 866 (printed 286). It holds the fridge, an appliance, a ≈ 50 cabinet, the hob (y ≈ 749 – 807) and the corner.

The pier between the 250 and 190 windows is x 333 – 472. The `kitchen` project has its own layout.

## 12. archon data

| Item | Value |
|---|---|
| Ground floor | 93.07 (96.72) m², stairs 5.41 included |
| Attic | 74.05 (88.00) m² |
| Usable area, without stairs | 161.71 m² (= 93.07 + 74.05 − 5.41) |
| House net, without boiler room and garage | 139.80 m² |
| Built-up / floor / total area | 120.57 / 184.72 / 237.04 m² |
| Volume | 826.19 m³ |
| Roof area | 186.1 m² |
| Height | 8.92 m |
| Minimum plot | 17.1 × 21.2 m (16.1 × 21.2 after adaptation) |
| Foundation walls / outer walls | 41.9 / 115.2 m² |
| Load-bearing inner walls | 13.9 m² |
| Partitions, ground floor / attic | 49.1 / 76.9 m² |
| External joinery | 48.33 m² |
| Facade to insulate | 215.8 m² |
| Roof timber | 6.61 m³ |
| Construction cost, Q3 2026, net | 698,300 – 795,600 zł |
| Walls | H+H aerated concrete 24, EPS 20 (Termo Organika), plaster |
| Slab | reinforced concrete |
| Knee wall | 120 |
| Roof | dual pitch 42°, no eaves, timber truss, ceramic tiles swissporTON, VELUX |
| Garage door | HÖRMANN |
| Heating / ventilation | gas boiler, underfloor heating / gravity |

## 13. Open points

- **Garage length.** It is printed as 724, but 1320 − 44 − 491 − 12 − 44 = 729, and the drawing also measures 729. The model uses 729.
- **Foundation walls.** Their material is not given. If it is the same block as the walls above, the foundation wall and the ground floor wall become one box.
- **Footing sizes and depths.** These come from the section only (±3.6).
- **Vent stack top.** ≈ 870, from the elevations only.

## 14. Build changes (as built, differ from archon)

| Change | Design | As built |
|---|---|---|
| Ground floor shower recess (bathroom 7) | 84 × 137, x 901 – 985, y 729 – 866 | 90 × 100: x 895 – 985 (90 from the glass line at 895), y 766 – 866 (100 along the window wall). Walls: #7 to y 766, #8 at y 754 – 766, #10 from y 754. Which walls moved is assumed; the recess size was measured on site. |
| Attic shower 100 × 100 (bathroom 5) | x 547 – 637, y 565 – 670 (garden end) | x 720 – 820, y 565 – 665 (front end, by the door wall) |
| Attic bathroom door 90/205 (#3) | x 650 – 740 | x 630 – 720 (20 toward the garden, clears the shower) |
| Diagonal wall under the stair (garage) | from (547, ≈ 271) to (642, ≈ 323) | none: the stair is floating; the garage outline keeps y 297 as the line to the stair |

The showers are fittings and are not in this geometry; only the walls and the door are.

Sources: [archon.pl, project data](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7), [archon.pl, construction cost](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7-koszt-budowy-7), [archon.pl, ground floor plan](https://www.archon.pl/rzut/mb68264a6f24b7/1).
