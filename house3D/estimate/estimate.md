# Dom w papawerach 5 (G): geometry estimate

This is the geometry of the house as the archon drawings and data give it, written as boxes. It stands on its own and refers to no model. Everything is in cm unless a level is given in metres (±0.00).

## 0. Projects and sources

**Projects on the PC** (repository `C:\dev\projects\knapiontek.github.io`):

| Project | Folder | What |
|---|---|---|
| house | `C:\dev\projects\knapiontek.github.io\house3D` | the whole house (this file, the drawings below) |
| kitchen | `C:\dev\projects\knapiontek.github.io\kitchen` | execution design of the kitchen (design.js, view.js, engine.js) |
| bathrooms | `C:\dev\projects\knapiontek.github.io\bath` | execution design of both bathrooms (data.js, engine.js) |

**Drawings** (in `house3D`):

| File | What |
|---|---|
| `archon-rzut-parter.png` | ground floor plan, 548 × 894 px |
| `archon-rzut-poddasze.png` | attic plan, 452 × 744 px |
| `archon-przekroj.png` | section across the house, 438 × 380 px |
| `archon-sytuacja.png` | site plan: house 910 × 1320 on a 1710 × 2120 plot, 400 free on every side; roof from above (3 roof windows, chimneys) |
| `archon-elewacja-front.png` | front elevation (x = 1322.8): garage door, entrance, front gable windows, the white portal frame |
| `archon-elewacja-ogrod.png` | garden elevation (x = 0): 600/240 glazing, 600/346 gable glazing, the portal frame |
| `archon-elewacja-prawa.png` | right elevation (y = 910): windows 100/130, 190/130, 250/240, 2 roof windows |
| `archon-elewacja-lewa.png` | left elevation (y = 0): garage window 200/100, 1 roof window |

The archon project pages are listed at the end.

## 1. Axes

| Axis | Meaning | Range |
|---|---|---|
| **x** | the long size of the building, along the windows of the kitchen and the bathrooms | 0 = garden outer face → 1322.8 = front outer face |
| **y** | across the building, at right angles to x | 0 = left outer face (garage side) → 910 = right outer face (kitchen and bathroom windows) |
| **z** | height | 0 = ±0.00, the finished ground floor; +3.06 attic floor; +8.60 ridge; terrain −0.32 |

Left and right are as seen from the garden, looking towards the front.

## 2. Modelling rules

- **Box.** The one solid is a box: axis-aligned, given by two corners, `x1 – x2, y1 – y2, z1 – z2`. Rotated boxes and other names for the same thing (rect3D, cuboid) are not used.
- **One shape, one box.** If a shape can be made with one box, it must be one box, never two. A wall of one material and thickness is one box from end to end, through its doors and windows. A wall that continues over the next floor in the same line and material is one box (the chimney). Two boxes for it is an error.
- **Openings are boxes too, cut out of the walls they cross.** A door or a window is one box, subtracted from its wall box. A wall with a door is two boxes: the wall and the opening. It is not three pieces around the opening.
- **Under the roof.** A box whose top lies under the roof (knee walls, gables, attic walls near the slopes) is still one box. Its top is cut by the two roof planes of § 5.
- **Element by element.** The rule applies to one element (a wall, a slab, a footing, the insulation of one facade). Different materials are different elements.
- **Values.** Numbers are cm to 0.1. Each value is given once and comes from the drawings (§ 3).

## 3. How it was read

1. **The printed numbers and arrows first.** They are taken as they are. Each dimension chain was checked to add up to the outer size.
2. **Pixels only place what has no number.** Both plans are at 0.4297 px/cm (910 cm = 391 px, the outer width; checked by the inside 822 = 354 px), so 1 px ≈ 2.3 cm. The section is at 0.280 px/cm, so 1 px ≈ 3.6 cm, checked by its printed 272.
3. **The kitchen furniture confirms the plan scale.** The counters are 25.8 px = 60 cm deep. The cabinets along the kitchen / bathroom wall come in 60 cm modules (fridge, appliance, hob, corner) plus one ≈ 50 cm, about 290 in all. The counter runs exactly the printed 286.
4. **Accuracy.** Measured positions are good to ±2.3 cm on the plans and ±3.6 cm on the section. Printed ones are exact.

**The chains close:**

- **Along x (right side):** 44 + 338 + 340 = 722, the kitchen / bathroom wall. Then + 12 + 251 + 12 + 189 = 1186, the inside face of the front wall.
- **Along y (front):** 44 + 367 + 12 + 192 + 12 + 239 = 866, the inside face of the right wall.
- **Attic:** 44 + 320 = 364; 44 + 335 = 379; 866 − 301 = 565; 273; 285 × 152; 44 + 397 = 441, + 363 down to the front wall; 866 − 413 = 453, 444.

## 4. Levels and heights (z)

| Level | z | Source |
|---|---|---|
| Footing bottom | ≈ −132 | section, measured (1.0 m below the terrain) |
| Footing top | ≈ −92 | section, measured |
| Terrain | −32 | section, printed −0.32 |
| Ground floor slab on the ground, bottom of its build-up | ≈ −36 | section, measured |
| Ground floor, finished | 0 | ±0.00 |
| Ground floor ceiling (underside of the slab) | 272 | printed 272 |
| Attic floor, finished | 306 | printed +3.06; slab with the floor = 34 |
| Roof underside at the inside face of the knee walls | 426 | 306 + 120 (knee wall 120) |
| Roof underside above the outer face of the walls | 386.4 | 426 − tan 42° · 44 |
| Roof top at the outer face of the walls | 451 | printed +4.51 |
| Flat attic ceiling (collar) | 591 | 306 + 285 (printed 285) |
| Top of the ceiling band (insulation) | ≈ 630 | section, measured (≈ 39 thick) |
| Roof underside at the ridge | 796 | 426 + tan 42° · 411 |
| Ridge, top | 860 | printed +8.60 (derived 860.6) |
| Chimney top | ≈ 900 | section, measured |
| Building height above the terrain | 892 | archon 8.92 m = 8.60 + 0.32 |

## 5. Roof

- **Shape:** dual-pitch, 42°, no eaves. The slopes end at the outer faces y = 0 and y = 910. The ridge runs along x at y = 455.
- **Underside:** z = 386.4 + tan 42° · d, where d = the distance from the nearer long outer face (d = y, or 910 − y), up to d = 455. That gives 426 at the knee walls' inside faces and 796 at the ridge.
- **Build-up:** 64.6 vertical, about 48 perpendicular (rafters, insulation, battens, ceramic tiles). The top is the underside + 64.6.
- **Length:** the roof covers x 0 – 1322.8 and continues over both terraces as the portal frame: garden to x −101.4, front to x 1421.7 (see § 6.7). This is archon's "zadaszenie tarasu: przedłużony okap".
- **Flat ceiling:** at z 591 under the collars, wherever the underside is higher than 591, i.e. y ≈ 227.3 – 682.7. A loft about 1.6 m high is above it.
- **Roof windows, 3 × 94/140:** 94 along x, 140 along the slope (≈ 104 in plan).

| Roof window | x | y (in plan) | Slope |
|---|---|---|---|
| Bedroom | ≈ 154.5 – 249.9 | ≈ 784 – 866 | right |
| Above the stairs | ≈ 641 – 737 | ≈ 44 – 148 | left |
| Bathroom | ≈ 639 – 733 | ≈ 782 – 866 | right |

## 6. How the house is built (in order)

**6.1 Fundamenty.**

- **Footings (ławy):** about 60 wide and 40 high (z −132 → −92). They sit centred under every load-bearing wall: the outer block walls, the block 24 inner walls, the chimney. Under the outer walls the block axis is 32 in from the outer face, so a footing spans y 2 – 62 (left), y 848 – 908 (right), x 2 – 62 (garden) and x 1260.8 – 1320.8 (front). Under the inner 24 wall the section shows one 61 wide.
- **Foundation walls:** on the footings, as thick as the walls above them, z −92 → 0. archon gives 41.9 m², which is about 1 m around the ≈ 42 m axis of the outer walls. If they are of the same block as the ground floor walls, the one-box rule makes each foundation wall and its ground floor wall one box (z −92 → 272). If they are concrete blocks (usual, archon does not say), they are their own boxes.
- **Ground floor slab:** about 36 of build-up (z −36 → 0), on the ground inside the foundation walls.
- **Plinth:** 32 high above the terrain (−32 → 0).

**6.2 Ściany parteru.** H+H aerated concrete blocks: **24** for the outer walls and the load-bearing inner walls, **12** for the partitions. They run z 0 → 272, up to the slab. The windows and doors sit in the openings of the **block** walls, not in the insulation. The outer walls are block 24 on the inside, with the 20 EPS of § 6.6 outside them, 44 in all. The block's outer faces are 20 in from the outer faces of the drawing: y 20 and 890, x 20 and 1302.8.

**6.3 Wieniec / strop.** A reinforced concrete slab (płyta żelbetowa) with its ring beam (wieniec), on the ground floor walls. It runs around the walls with the outline of the block walls, the same size as the foundation. It is one box, x 20 – 1302.8, y 20 – 890, z 272 – 306 (34, together with the attic floor build-up). It runs over the entrance recess, where the attic floor sits above the porch. The stair void is cut out of it (§ 8).

**6.4 Ściana kolankowa 120.** Block 24 in the line of the outer walls, standing on the slab. From the attic floor (306) to the roof underside at its inside face (426) it is 120.

**6.5 Szczyty and dach.** The two gable walls (garden, front) are block 24, z 306 → roof (boxes under the roof). The roof of § 5 has a timber truss (6.61 m³ of timber), ceramic tiles (swissporTON), VELUX roof windows, 186.1 m² in all. The chimney is one box from its footing to ≈ 900, x 468.5 – 547.9, y 380.4 – 459.8.

**6.6 Ocieplenie.** **20** EPS (styropian Termo Organika) goes **around the house once the walls, slab and roof structure stand**. It covers the outside of the blocks, the edge of the slab and the window frames' edges, 215.8 m² of facade. Then the finish: white-grey plaster, with natural timber cladding accents. U-values: walls 0.118, roof 0.12, windows < 0.9 W/(m²·K).

**6.7 Portal (the white frame).** At both ends the house has a frame in front of the gable: two wings 64 wide (EPS 20 + block 24 + EPS 20, the block in line with the side walls' block) and the roof prolonged over them. Garden: x −101.4 – 0, wings y 0 – 64 and y 846 – 910. Front: x 1322.8 – 1421.7, wings y 0 – 64 and 846 – 910. The right front wing starts on the ground floor at x 1231, beside the entrance recess.

**6.8 Instalacje.** Gas boiler, underfloor heating in all living rooms, gravity ventilation.

## 7. Outer walls as boxes

**Ground floor, z 0 → 272.** The long walls run through the corners.

| Element | x | y |
|---|---|---|
| block, left | 20 – 1302.8 | 20 – 44 |
| block, right | 20 – 1231 | 866 – 890 |
| block, garden | 20 – 44 | 44 – 866 |
| block, garage front | 1278.8 – 1302.8 | 44 – 433.8 |
| block, garage / entrance recess | 1187 – 1278.8 | 409.8 – 433.8 |
| block, entrance wall | 1187 – 1211 | 433.8 – 866 |
| EPS, left (both floors, one box under the roof, z 0 → roof) | 0 – 1322.8 | 0 – 20 |
| EPS, garden (both floors and the gable, z 0 → roof) | 0 – 20 | 20 – 890 |
| EPS, right (z 0 → roof) | 0 – 1231 | 890 – 910 |
| EPS, garage front | 1302.8 – 1322.8 | 20 – 453.8 |
| EPS, recess side | 1231 – 1302.8 | 433.8 – 453.8 |
| EPS, entrance wall | 1211 – 1231 | 433.8 – 846 |

The entrance recess is open (outside) at x 1231 – 1322.8, y 453.8 – 846, under the slab.

**Attic, z 306 → roof.**

| Element | x | y |
|---|---|---|
| block, knee wall left | 20 – 1302.8 | 20 – 44 |
| block, knee wall right | 20 – 1302.8 | 866 – 890 |
| block, garden gable | 20 – 44 | 44 – 866 |
| block, front gable | 1278.8 – 1302.8 | 44 – 866 |
| EPS, right above the wing (z 272 → roof) | 1231 – 1322.8 | 890 – 910 |
| EPS, front gable and slab edge (z 272 → roof) | 1302.8 – 1322.8 | 20 – 890 |

(The left and garden EPS boxes of the ground floor go on up.)

## 8. Inner walls, openings, rooms

The inner walls are block 12 or 24 unless named. A door is part of its wall's box, and the door is listed under the openings. The room outlines are the faces of the blocks (archon's areas are after the plaster, so 2–6 % smaller; 1.5 plaster closes it).

#### Ground floor: inner walls (11 boxes)

| # | Kind | x | y | z |
|---|---|---|---|---|
| 1 | chimney | 468.5 – 547.9 | 380.4 – 459.8 | −132 → ≈ +900 (one box through both floors and the roof) |
| 2 | block 12 | 535.9 – 547.9 | 44 – 380.4 | 0 → 272 |
| 3 | block 12 | 642.2 – 654.2 | 273 – 433.8 | 0 → 272 |
| 4 | block 24 | 654.2 – 929.3 | 409.8 – 433.8 | 0 → 272 |
| 5 | block 12 | 721.8 – 733.8 | 580 – 866 | 0 → 272 |
| 6 | block 12 | 733.8 – 1231 | 615.5 – 627.5 | 0 → 272 |
| 7 | block 24 | 902.8 – 926.8 | 627.5 – 730.8 | 0 → 272 |
| 8 | block 24 | 905.3 – 929.3 | 433.8 – 615.5 | 0 → 272 |
| 9 | block 12 | 926.8 – 984.8 | 718.8 – 730.8 | 0 → 272 |
| 10 | block 12 | 929.3 – 1187 | 409.8 – 421.8 | 0 → 272 |
| 11 | block 12 | 984.8 – 996.8 | 718.8 – 866 | 0 → 272 |

#### Ground floor: openings (boxes cut out of the walls they cross)

| Opening | W/H (archon) | x | y | z |
|---|---|---|---|---|
| window | 200/100 | 761.7 – 961.7 | 0 – 44 | 110 → 210 |
| window | 600/240 | 0 – 44 | 155 – 755 | 0 → 240 |
| window | 250/240 | 82.6 – 332.6 | 866 – 910 | 0 → 240 |
| window | 190/130 | 471.6 – 661.6 | 866 – 910 | 110 → 240 |
| window | 100/130 | 802.8 – 902.8 | 866 – 910 | 110 → 240 |
| garage door | 275/225 | 1278.8 – 1322.8 | 114.7 – 389.7 | 0 → 225 |
| entrance door | 160/210 (161.7) | 1187 – 1231 | 453.8 – 615.5 | 0 → 210 |
| boiler room door (outside) | 80/210 | 1187 – 1231 | 661.4 – 741 | 0 → 210 |
| door | 87/205 | 1064.5 – 1151.4 | 409.8 – 421.8 | 0 → 205 |
| door | 92/205 | 905.3 – 929.3 | 487.6 – 579.3 | 0 → 205 |
| door | 90/205 | 775.8 – 865.8 | 615.5 – 627.5 | 0 → 205 |
| door | 92/205 | 1064.5 – 1156.2 | 615.5 – 627.5 | 0 → 205 |

#### Ground floor: rooms (floor outline as rectangles, block faces)

| Room | Rectangles [x1, y1, x2, y2] | Area here, m² | archon, m² |
|---|---|---|---|
| Salon z kuchnią i holem | [44, 44, 535.9, 380.4] [44, 380.4, 468.5, 459.8] [44, 459.8, 547.9, 866] [547.9, 433.8, 721.8, 866] [721.8, 433.8, 733.8, 580] [733.8, 433.8, 905.3, 615.5] | 51.19 | hol 5.46 + salon 35.42 + kuchnia 9.67 |
| Wiatrołap | [929.3, 421.8, 1187, 615.5] | 4.99 | 4.84 |
| Łazienka | [733.8, 627.5, 902.8, 866] [902.8, 730.8, 984.8, 866] | 5.14 | 4.95 |
| Kotłownia z pralnią | [926.8, 627.5, 996.8, 718.8] [996.8, 627.5, 1187, 866] | 5.18 | 4.97 |
| Garaż | [659, 44, 1278.8, 409.8] [547.9, 44, 642.2, 318.6] [654.2, 273, 659, 409.8] | 25.33 | 22.35 (25.91) |

#### Attic: inner walls (14 boxes)

| # | Kind | x | y | z |
|---|---|---|---|---|
| 1 | block 12 | 362.1 – 374.1 | 44 – 392.4 | 306 → 591 (ceiling), under the roof where lower |
| 2 | block 12 | 362.1 – 374.1 | 553.7 – 866 | 306 → 591 (ceiling), under the roof where lower |
| 3 | block 12 | 465.8 – 902.8 | 553.7 – 565.7 | 306 → 591 (ceiling), under the roof where lower |
| 4 | chimney | 468.5 – 547.9 | 380.4 – 459.8 | the same box as on the ground floor |
| 5 | block 12 | 535.9 – 547.9 | 44 – 380.4 | 306 → 591 (ceiling), under the roof where lower |
| 6 | block 12 | 535.9 – 547.9 | 459.8 – 866 | 306 → 591 (ceiling), under the roof where lower |
| 7 | block 12 | 738.7 – 750.7 | 44 – 341.9 | 306 → 591 (ceiling), under the roof where lower |
| 8 | block 12 | 750.7 – 902.8 | 329.9 – 341.9 | 306 → 591 (ceiling), under the roof where lower |
| 9 | block 12 | 820.7 – 832.7 | 565.7 – 866 | 306 → 591 (ceiling), under the roof where lower |
| 10 | shaft | 832.7 – 902.8 | 565.7 – 626.6 | 306 → roof |
| 11 | block 12 | 890.8 – 902.8 | 626.6 – 649.3 | 306 → 591 (ceiling), under the roof where lower |
| 12 | block 12 | 902.8 – 914.8 | 44 – 440.6 | 306 → 591 (ceiling), under the roof where lower |
| 13 | block 12 | 902.8 – 1278.8 | 440.6 – 452.6 | 306 → 591 (ceiling), under the roof where lower |
| 14 | block 12 | 902.8 – 914.8 | 452.6 – 649.3 | 306 → 591 (ceiling), under the roof where lower |

#### Attic: openings (boxes cut out of the walls they cross)

| Opening | W/H (archon) | x | y | z |
|---|---|---|---|---|
| window | 600/346 | 0 – 44 | 156.2 – 756.2 | 306 → 652 |
| window | 220/285 | 1278.8 – 1322.8 | 170.5 – 390.5 | 336 → 621 |
| window | 220/285 | 1278.8 – 1322.8 | 522 – 742 | 336 → 621 |
| door | 89/205 | 535.9 – 547.9 | 459.8 – 548.9 | 306 → 511 |
| door | 90/205 | 651.8 – 741.8 | 553.7 – 565.7 | 306 → 511 |
| door | 82/205 | 902.8 – 914.8 | 178.1 – 260 | 306 → 511 |
| door | 94/205 | 902.8 – 914.8 | 346.7 – 440.6 | 306 → 511 |
| door | 90/205 | 902.8 – 914.8 | 457.6 – 547.6 | 306 → 511 |

#### Attic: rooms (floor outline as rectangles, block faces)

| Room | Rectangles [x1, y1, x2, y2] | Area here, m² | archon, m² |
|---|---|---|---|
| Sypialnia | [44, 44, 362.1, 866] [362.1, 392.4, 374.1, 553.7] [374.1, 380.4, 468.5, 565.7] [468.5, 459.8, 535.9, 553.7] | 28.72 | 24.07 (28.16) |
| Garderoba | [374.1, 44, 535.9, 380.4] | 5.44 | 4.13 (5.13) |
| Garderoba | [374.1, 565.7, 535.9, 866] | 4.86 | 3.60 (4.60) |
| Hol | [642.2, 273, 651.7, 438.1] [547.9, 438.1, 651.7, 553.7] [651.7, 273, 738.7, 341.9] [651.7, 341.9, 902.8, 553.7] | 7.27 | 7.32 |
| Łazienka | [547.9, 565.7, 820.7, 866] | 8.19 | 6.25 (7.99) |
| Garderoba | [750.7, 44, 902.8, 329.9] | 4.35 | 3.20 (4.16) |
| Pokój | [914.8, 44, 1278.8, 440.6] | 14.44 | 11.79 (14.11) |
| Pokój | [914.8, 452.6, 1278.8, 866] [832.7, 649.3, 914.8, 866] [832.7, 626.6, 890.8, 649.3] | 16.96 | 13.69 (16.53) |

Stair void in the slab: [547.9, 44, 642.2, 438.1] + [642.2, 44, 738.7, 273] (x1, y1, x2, y2).


## 9. Kitchen in the archon drawing

The kitchen is an L of 60-deep counters:

- **Along the right wall:** x ≈ 472 – 660, y 806 – 866, with the sink under the 190 window.
- **Along the kitchen / bathroom wall:** x 661.8 – 721.8, y 580 – 866 (286). It holds the fridge, an appliance, a ≈ 50 cabinet, the hob (y ≈ 749 – 807) and the corner.

The wall between the 250 and 190 windows runs x 332.6 – 471.6, centre ≈ 402. The kitchen project in `kitchen` has its own layout.

## 10. archon data

| Item | Value |
|---|---|
| Usable area, without stairs | 161.71 m² |
| House net, without boiler room and garage | 139.8 m² |
| Garage | 22.35 m² |
| Boiler room | 4.97 m² |
| Ground floor | 93.07 (96.72) m² |
| Attic | 74.05 (88.00) m²; the bracket is the floor area, the first figure the usable area under the slopes |
| Built-up area | 120.57 m² |
| Floor area | 184.72 m² |
| Total area | 237.04 m² |
| Volume | 826.19 m³ |
| Roof area | 186.1 m² |
| Height | 8.92 m |
| Minimum plot | 17.1 × 21.2 m (16.1 × 21.2 after adaptation) |
| Foundation walls | 41.9 m² |
| Outer walls | 115.2 m² |
| Load-bearing inner walls | 13.9 m² |
| Partitions, ground floor | 49.1 m² |
| Partitions, attic | 76.9 m² |
| External joinery | 48.33 m² |
| Facade to insulate | 215.8 m² |
| Roof timber | 6.61 m³ |
| Construction cost, Q3 2026, net | 698,300 – 795,600 zł |
| Walls | H+H aerated concrete 24, styropian 20, plaster |
| Slab | reinforced concrete |
| Knee wall | 120 |
| Roof | dual-pitch 42° without eaves, timber truss, ceramic tiles swissporTON, VELUX |
| Garage door | HÖRMANN |
| Heating | gas boiler, underfloor heating |
| Ventilation | gravity |

## 11. Open points

- **Garage length:** printed 724, but the walls drawn give 731 (x 547.9 → 1278.8). The overall length is printed 1320 against 1322.8 drawn.
- **Foundation walls:** their material is not given. It decides whether each is one box with its ground floor wall.
- **The grey block on the attic:** below the bathroom, x 832.7 – 902.8, y 565.7 – 626.6. Read as a shaft; to be confirmed.
- **Footing sizes and depths:** read from the section only, ±3.6.

Sources: [archon.pl, project data](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7), [archon.pl, construction cost](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7-koszt-budowy-7), [archon.pl, ground floor plan](https://www.archon.pl/rzut/mb68264a6f24b7/1), [osiedladomow.pl](https://www.osiedladomow.pl/projekty-domow/mb68264a6f24b7/dom-w-papawerach-5-g.html), [projektydomownowoczesnych.pl](https://www.projektydomownowoczesnych.pl/p,mb68264a6f24b7,dom-w-papawerach-5-g).
