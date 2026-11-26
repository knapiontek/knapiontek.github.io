# Dom w papawerach 5 (G): geometry analysis

The house as the archon drawings in this folder give it, as boxes, plus what changed on site (§ 14). It must agree with the drawings; a dimension changes only with the owner's approval. The building's data is copied from these tables by hand, in its own axes. mm, whole numbers; levels may be in metres (±0.00).

## 1. Sources

Drawings (this folder, `archon`):

| File | What |
|---|---|
| `plan-ground-floor.png` | Ground Floor plan |
| `plan-first-floor.png` | First Floor plan |
| `section.png` | section across the house |
| `site.png` | site plan: house 9100 × 13200 on a 17100 × 21200 plot, 4000 free on each side; roof from above |
| `elevation-front.png` | front elevation (x = 0, West) |
| `elevation-garden.png` | garden elevation (x = 13200, East) |
| `elevation-right.png` | right elevation (y = 9100, South): windows 1000/1300, 1900/1300, 2500/2400, 2 roof windows |
| `elevation-left.png` | left elevation (y = 0, North): garage window 2000/1000, 1 roof window |

## 2. Axes

| Axis | Range |
|---|---|
| **x**, along the house, East | 0 = front outer face (West) → 13200 = garden outer face (East) |
| **y**, across, South | 0 = left outer face (garage side, North) → 9100 = right outer face (kitchen and bathroom windows, South) |
| **h**, height, up | 0 = ±0.00 finished Ground Floor; 3060 finished First Floor; 5910 Attic floor; 8600 ridge (8820 as built, § 14); terrain −320 |

Left and right are as seen when facing the front of the house (the street side), which is also how archon names the elevations. The plans put the garden at the top and the garage on the left. Zero: the corner of the front (West) and left (North) outer faces, at ±0.00.

## 3. Modelling rules

- **Box.** The only solid is an axis-aligned box, `x1–x2, y1–y2, h1–h2`.
- **One shape, one box.** A wall of one material and thickness is one box from end to end, through its doors and windows; it is never split around an opening.
- **Openings** (doors, windows) are boxes subtracted from every wall and EPS box they cross.
- **Crossings.** Where two walls cross, the load-bearing (thicker) one runs through and the other stops at its faces.
- **Under the roof.** A box that reaches the roof is still one box, its top cut by the two roof planes (§ 6). Gable windows are cut by lines parallel to the roof (§ 10).
- **Element by element.** Each material is a separate element (block, EPS, slab, footing).

## 4. How the numbers were read

- **Printed dimensions come first.** Pixels only place things that have no printed number. Plans: 0.04297 px/mm (9100 = 391 px), 1 px ≈ 23 mm. Section: 0.0280 px/mm, 1 px ≈ 36 mm. Site plan: 0.0335 px/mm, 1 px ≈ 30 mm. archon prints whole cm, so every value is a multiple of 10 mm except where a derivation gives a finer one; measured values are good to ±23 on the plans and ±36 on the section.
- **The printed chains close:**
  - Ground Floor, y (front): 440 + 3670 + 120 + 1920 + 120 + 2390 = 8660, the inner face of the right wall.
  - Ground Floor, x (right side): 440 + 3380 + 3400 + 120 + 2510 + 120 + 1890 = 11860 from the garden outer face to the inner face of the entrance wall, which is at x 1340. Vestibule: 1340 + 2610 = 3950.
  - First Floor, x: 440 + 3200 + 120 + 1590 + 120 + 2730 + 120 + 4440 + 440 = **13200** ✓ (the printed overall length).
  - First Floor, y: 440 + 3970 + 120 + 4130 = 8660 ✓; 440 + 3350 = 3790; 8660 − 3010 = 5650; 440 + 2850 = 3290; x: 440 + 3630 = 4070; 4070 + 120 + 1520 = 5710.
- **Roof check.** The First Floor plan's dashed 1400 and 2200 clear-height lines lie at y ≈ 650 and 1560. The roof of § 6 puts them at 660 and 1550.
- **Checked against the plans (pixels):** every outer opening, the walls of § 9 and § 10, the portal wings (1000 at each end) and the vent shaft of § 14 lie where the tables put them, within ±23.

## 5. Levels (h)

| Level | h | Source |
|---|---|---|
| Footing bottom / top | ≈ −1320 / ≈ −920 | section, measured |
| Terrain | −320 | printed |
| Ground slab build-up, bottom | ≈ −360 | section, measured |
| Ground Floor, finished | 0 | ±0.00 |
| Ground Floor ceiling (underside of slab) | 2720 | printed |
| First Floor, finished | 3060 | printed +3.06 (slab + floor = 340) |
| Roof underside at the outer wall face | 3864 | 4260 − tan 42° · 440 |
| Roof underside at the knee wall's inner face | 4260 | 3060 + 1200 (printed knee wall) |
| Roof top at the outer wall face | 4510 | printed +4.51 |
| First Floor flat ceiling (Attic floor) | 5910 | 3060 + 2850 (printed) |
| Top of ceiling insulation | ≈ 6300 | section, measured |
| Roof underside at the ridge | 7960 | 3864 + tan 42° · 4550 |
| Ridge top | 8600 | printed +8.60 (derived 8607) |
| Chimney top | ≈ 9000 | section |
| Height above terrain | 8920 | archon 8.92 m |

## 6. Roof

- **Shape.** Dual pitch at 42°, with no eaves on the long sides. The ridge runs along x at y = 4550.
- **Underside.** h = 3864 + tan 42° · d, where d is the distance from the nearer long outer face (d = y or 9100 − y, up to 4550).
- **Build-up.** archon: 646 measured vertically (≈ 480 perpendicular): rafters, insulation, battens, ceramic tiles; the roof top is the underside + 646. Modelled 640 perpendicular (§ 14).
- **Length.** x −1000 → 14200. The roof runs on over both terraces as the portal frame (§ 8.4).
- **Flat ceiling** at h 5910 wherever the underside is higher, i.e. y 2270 – 6830. Above it is the Attic, an unused loft about 1.6 m high. Box: x 440 – 9440, y 440 – 8660, h 5910 → 6300 (ceiling with insulation), top cut by the roof, minus the chimney. As built, the garden bedroom (x 9560 – 12760) has a cathedral ceiling instead (§ 14).
- **Roof windows, 3 × 940/1400.** 940 along x and 1400 along the slope (1040 in plan). The plan draws ≈ 840 of that, measured in from the knee wall's inner face (the y column below); the full 1040 runs from there out over the knee wall (y 7820 – 8860 and 240 – 1280). The site plan and the elevations confirm the x positions.

| Roof window | x | y (plan) | Slope |
|---|---|---|---|
| Bedroom | 10710 – 11650 | 7820 – 8660 | right |
| Above the stairs | 5870 – 6810 | 440 – 1280 | left |
| First Floor bathroom | 5870 – 6810 | 7820 – 8660 | right |

## 7. Construction (in order)

1. **Foundations.** Footings ≈ 600 × 400 (h −1320 → −920), centred under every load-bearing wall: the outer walls (block axis 320 in from the outer face), the entrance wall, the inner block-240 walls (the section shows one 610 wide) and the chimney. The foundation walls (h −920 → 0) are as thick as the walls above. archon gives 41.9 m², which fits ≈ 0.9–1.0 m height along the ≈ 42 m axis of the outer walls. Ground slab ≈ 360 thick (h −360 → 0). Plinth 320 (−320 → 0). Boxes: § 7.1.
2. **Ground Floor walls.** H+H aerated concrete: **240** for the outer and load-bearing walls, **120** for partitions, h 0 → 2720. The outer walls are 440 in total: 240 block plus 200 EPS outside. The block's outer faces are at y 200 / 8900 and x 13000 / 13000. Windows and doors sit in the block.
3. **Slab with ring beam.** Reinforced concrete. One box x 200 – 13000, y 200 – 8900, h 2720 – 3060 (including the First Floor's floor build-up), minus the stair void (§ 10) and the chimney. It also covers the entrance recess.
4. **Knee walls** (block 240, h 3060 → roof, 1200 high at the inner face) and **gables** (block 240, h 3060 → roof).
5. **Roof.** Timber truss (6.61 m³), ceramic tiles (swissporTON), VELUX windows, 186.1 m².
6. **Insulation**, once the roof is on: 200 EPS over the whole building, around the blocks, the slab edge and the window reveals, 215.8 m² of facade. Finish: § 8.5. U-values: walls 0.118, roof 0.12, windows < 0.9 W/(m²·K).
7. **Services.** As built: heat pump (archon: gas boiler), underfloor heating. One chimney (the living room); no vent shaft and no second stack (§ 14).

### 7.1 Foundation boxes

Footings h −1320 → −920; foundation walls h −920 → 0; ground slab h −360 → 0. Every block-240 wall of the Ground Floor stands on a foundation wall and a footing. The chimney stands on the ground slab (from h 0) over a chimney foundation of its own size; its footing reaches 180 past each face like a wall footing, so its edges run on in line with the footings of #2 (x 7550) and #4 (y 4530).

| Element | Footing x / y | Foundation wall x / y |
|---|---|---|
| left (both wings) | −1000 – 14200 / 20 – 620 | −800 – 14000 / 200 – 440 |
| right (both wings) | −1000 – 14200 / 8480 – 9080 | −800 – 14000 / 8660 – 8900 |
| garden | 12580 – 13180 / 620 – 8480 | 12760 – 13000 / 440 – 8660 |
| garage front | 20 – 620 / 620 – 4530 | 200 – 440 / 440 – 4350 |
| recess, garage side | 620 – 1520 / 3930 – 4530 | 440 – 1340 / 4110 – 4350 |
| entrance wall | 920 – 1520 / 4530 – 8480 | 1100 – 1340 / 4350 – 8660 |
| #2 (as built, § 14) | 7550 – 8150 / 620 – 3410 | 7730 – 7970 / 440 – 3590 |
| #4 | 3770 – 6960 / 3930 – 4530 | 3950 – 6660 / 4110 – 4350 |
| #7 | 3770 – 4370 / 4530 – 7960 | 3950 – 4190 / 4350 – 7660 |
| chimney | 7550 – 8670 / 3410 – 4530 | 7730 – 8490 / 3590 – 4350 (chimney foundation) |

Ground slab: x 440 – 12760, y 440 – 4110 (garage) and x 1340 – 12760, y 4110 – 8660 (house), minus the foundation walls and the chimney foundation.

## 8. Outer walls

### 8.1 Ground Floor blocks (h 0 → 2720)

| Element | x | y |
|---|---|---|
| left (runs through both portal wings) | −800 – 14000 | 200 – 440 |
| right (through both wings; also the recess's right side) | −800 – 14000 | 8660 – 8900 |
| garden | 12760 – 13000 | 440 – 8660 |
| garage front | 200 – 440 | 440 – 4350 |
| garage side of the recess | 440 – 1340 | 4110 – 4350 |
| entrance wall | 1100 – 1340 | 4350 – 8660 |

The entrance recess is open to the outside at x 0 – 900, y 4550 – 8460, roofed by the slab.

### 8.2 First Floor blocks (h 3060 → roof)

| Element | x | y |
|---|---|---|
| knee wall left (through both wings) | −800 – 14000 | 200 – 440 |
| knee wall right (through both wings) | −800 – 14000 | 8660 – 8900 |
| garden gable | 12760 – 13000 | 440 – 8660 |
| front gable | 200 – 440 | 440 – 8660 |

### 8.3 EPS 200

| Element | x | y | h |
|---|---|---|---|
| left (house and both wings) | −1000 – 14200 | 0 – 200 | −920 → roof |
| right (house and both wings) | −1000 – 14200 | 8900 – 9100 | −920 → roof |
| garden | 13000 – 13200 | 440 – 8660 | −920 → roof |
| garage front | 0 – 200 | 440 – 4550 | −920 → 2720 |
| recess, garage side | 200 – 900 | 4350 – 4550 | −920 → 2720 |
| entrance wall | 900 – 1100 | 4350 – 8460 | −920 → 2720 |
| recess, right side | 0 – 1100 | 8460 – 8660 | −920 → 2720 |
| front gable and slab edge | 0 – 200 | 440 – 8660 | 2720 → roof |
| recess soffit (470 thick, as built) | 0 – 900 | 4550 – 8460 | 2250 → 2720 |

The EPS covers every block completely, front, back and sides, including the slab edge and the gables up to the roof, so there are no thermal bridges. Below ±0 it is the plinth insulation, finished as plinth. The recess soffit is 470 thick (§ 14), thicker than 200 so that the white band over the garage door and the entrance is one level rectangle.

### 8.4 Portal (the white frame)

At each end the long walls run on past the gable as wings, 640 wide (EPS 200 + block 240 + EPS 200), h 0 → roof, with the roof over them. The whole frame, front and back, is one width, 640: the wings measured across, the roof measured across the slope (§ 14).

- **Block**: the long wall's block itself, one box from end to end (§ 8.1, § 8.2, foundation −800 → 14000). No EPS between the house and a wing.
- **Ring beam** over the wing block, between the two floors: x −800 – 200 and 13000 – 14000, h 2720 – 3060, at y 200 – 440 and 8660 – 8900.
- **EPS**: the outer face is part of the long EPS box (§ 8.3); the inner face and a cap on the head, all h −920 → roof:

| Wing | inner EPS x | inner EPS y | head EPS x | head EPS y |
|---|---|---|---|---|
| garden left | 13200 – 14000 | 440 – 640 | 14000 – 14200 | 200 – 640 |
| garden right | 13200 – 14000 | 8460 – 8660 | 14000 – 14200 | 8460 – 8900 |
| front left | −800 – 0 | 440 – 640 | −1000 – −800 | 200 – 640 |
| front right | −800 – 0 | 8460 – 8660 | −1000 – −800 | 8460 – 8900 |

The portal is 1000 deep (printed) at both ends; the terraces under and beyond it: § 15.

### 8.5 Facade finish

Read from the elevations (an image, not a dimension). The finish covers the EPS where it is open to the air; a later row wins over an earlier one. Anything not listed is white plaster: the portal (wings, heads, roof ends) and the long walls.

| Where (side of the EPS facing the air) | Region | Finish |
|---|---|---|
| everywhere | h < 0 | plinth |
| garden (+x) | y 640 – 8460 | graphite |
| garden | y 1550 – 7550, h 2400 – 3060 (between the two big windows) | timber, horizontal boards |
| front (−x) | y 640 – 8460 | graphite |
| front, face x 0 – 200 | y 640 – 8460, h 2250 – 3060 (band over the garage and the recess) | white |
| front gable | y 3880 – 5220, h ≥ 3060, under the windows' roof lines | timber, vertical boards |
| entrance wall | y 6150 – 6610 and 7410 – 8460, h 0 – 2720 | timber, vertical boards |
| recess sides | h 0 – 2720 | graphite |
| recess soffit, underside | x 200 – 1100 | graphite |
| right (+y) | x 4170 – 9870, h 0 – 2400 (around the 1900 and 1000 windows) | graphite |
| left (−y) | x 3560 – 11930, h 0 – 2400 (garage, up to the 2000 window) | graphite |
| chimney | h ≥ 7000 | graphite |

Roof: graphite tiles on top, white underside, ends and eaves.

## 9. Ground Floor

### Inner walls (h 0 → 2720 unless stated)

| # | Kind | x | y | Note |
|---|---|---|---|---|
| 1 | chimney | 7730 – 8490 | 3590 – 4350 | h 0 → ≈ 9000, on the ground slab over its foundation (§ 7.1), one box through both floors and the roof; face flush with #4 (§ 14) |
| 2 | block 240 | 7730 – 7970 | 440 – 3590 | living / garage; block 240 as built, on a foundation wall (§ 7.1, § 14) |
| 3 | block 120 | 6660 – 6780 | 3200 – 4350 | stair wall |
| 4 | block 240 | 3950 – 6660 | 4110 – 4350 | garage / hall, load-bearing |
| 5 | block 120 | 5860 – 5980 | 5800 – 8660 | kitchen / bathroom |
| 6a | block 120 | 4190 – 5860 | 6150 – 6270 | hall / bathroom |
| 6b | block 120 | 1340 – 3950 | 6150 – 6270 | vestibule / boiler room |
| 7 | block 240 | 3950 – 4190 | 4350 – 7660 | load-bearing, runs through 6; built to 7660 (§ 14) |
| 8 | block 120 | 3350 – 3950 | 7540 – 7660 | bathroom / boiler room; built at 7540 (§ 14) |
| 9 | block 120 | 1340 – 3950 | 4110 – 4230 | garage / vestibule |
| 10 | block 120 | 3230 – 3350 | 7540 – 8660 | bathroom / boiler room; built from 7540 (§ 14) |

### Openings

| Opening | W/H | In | x | y | h |
|---|---|---|---|---|---|
| window | 6000/2400 | garden | 12760 – 13200 | 1550 – 7550 | 0 → 2400 |
| window | 2000/1000 | left | 3580 – 5580 | 0 – 440 | 1100 → 2100 |
| window | 2500/2400 | right | 9870 – 12370 | 8660 – 9100 | 0 → 2400 |
| window | 1900/1300 | right | 6580 – 8480 | 8660 – 9100 | 1100 → 2400 |
| window | 1000/1300 | right | 4170 – 5170 | 8660 – 9100 | 1100 → 2400 |
| garage door | 2750/2250 | garage front | 0 – 440 | 1150 – 3900 | 0 → 2250 |
| entrance door | 1600/2100 | entrance wall | 900 – 1340 | 4550 – 6150 | 0 → 2100 (leaf 1000 on the garage side, glass beside it) |
| boiler room door | 800/2100 | entrance wall | 900 – 1340 | 6610 – 7410 | 0 → 2100 (glazed) |
| door | 870/2050 (900, § 14) | #9 | 1690 – 2560 | 4110 – 4230 | 0 → 2050 |
| door | 920/2050 (900, § 14) | #7 | 3950 – 4190 | 4880 – 5800 | 0 → 2050 |
| door | 900/2050 | #6a | 4540 – 5440 | 6150 – 6270 | 0 → 2050 |
| door | 920/2050 (900, § 14) | #6b | 1640 – 2560 | 6150 – 6270 | 0 → 2050 |

### Stair

Floating (§ 14): treads and a landing, 17 risers of 180 (0 → 3060). The plan draws treads ≈ 265 deep.

| Part | x | y | Risers |
|---|---|---|---|
| lower flight | 6780 – 7730 | 4350 → 1435, 11 treads | 1 – 11 |
| landing | 5830 – 7730 | 440 – 1435 | 12 |
| upper flight | 5830 – 6780 | 1435 → 2730, 4 treads | 13 – 16 (17 = First Floor) |

### Rooms (floor outline at the block faces)

archon's areas are measured after plaster, so they are 2–4 % smaller than these.

| Room | Rectangles [x1, y1, x2, y2] | Here, m² | archon, m² |
|---|---|---|---|
| Salon, kitchen and hall (5, 6, 3) | [7970,440,12760,3590] [8490,3590,12760,4350] [7730,4350,12760,8660] [5980,4350,7730,8660] [5860,4350,5980,5800] [4190,4350,5860,6150] | 50.74 | 35.42 + 9.67 + 5.46 = 50.55 |
| Vestibule (1) | [1340,4230,3950,6150] | 5.01 | 4.84 |
| Bathroom (7) | [4190,6270,5860,8660] [3350,7660,4190,8660] | 4.83 | 4.95 (design) |
| Boiler room with laundry (8) | [1340,6270,3950,7540] [1340,7540,3230,8660] | 5.43 | 4.97 (design) |
| Garage (2) | [6780,440,7730,2970] [6660,440,6780,3200] [440,440,6660,4110] | 25.56 | 22.35 (25.91) |
| Stairs (4) | [6780,2970,7730,4350], not a room | – | 5.41 |

## 10. First Floor

### Inner walls (block 120: h 3060 → 5910, cut by the roof where it is lower)

| # | Kind | x | y |
|---|---|---|---|
| 1 | block 120 | 9440 – 9560 | 440 – 3910 |
| 2 | block 120 | 9440 – 9560 | 5530 – 8660 |
| 3 | block 120 | 4190 – 8540 | 5530 – 5650 (stops at #6: 7850 – 8540 and 4190 – 7730) |
| 4 | chimney | Ground Floor #1 | |
| 5 | block 120 | 7730 – 7850 | 440 – 3590 |
| 6 | block 120 | 7730 – 7850 | 4350 – 8660 |
| 7 | block 120 | 5710 – 5830 | 440 – 3410 |
| 8 | block 120 | 4190 – 5710 | 3290 – 3410 |
| 9 | block 120 | 4880 – 5000 | 5650 – 8660 |
| 12 | block 120 | 4070 – 4190 | 440 – 6490 (built to 5650, § 14) |
| 13 | block 120 | 440 – 4070 | 4410 – 4530 |

### Openings

| Opening | W/H | In | x | y | h |
|---|---|---|---|---|---|
| window | 6000/3460 | garden gable | 12760 – 13200 | 1550 – 7550 | 3060 → 6520, top cut parallel to the roof: h = 6520 − tan 42° · \|y − 4550\| |
| window | 2200/2850 | front gable | 0 – 440 | 1680 – 3880 | 3060 → 5910, top sloping: h = 5910 − tan 42° · (3880 − y); transom at 3900 |
| window | 2200/2850 | front gable | 0 – 440 | 5220 – 7420 | 3060 → 5910, top sloping: h = 5910 − tan 42° · (y − 5220); transom at 3900 |
| door | 890/2050 (900, § 14) | #6 | 7730 – 7850 | 4590 – 5480 | 3060 → 5110 |
| door | 900/2050 | #3 | 6000 – 6900 | 5530 – 5650 | 3060 → 5110 (built; design x 5800 – 6700, § 14) |
| door | 820/2050 (700, § 14) | #12 | 4070 – 4190 | 1780 – 2600 | 3060 → 5110 |
| door | 940/2050 (900, § 14) | #12 | 4070 – 4190 | 3470 – 4410 | 3060 → 5110 |
| door | 900/2050 | #12 | 4070 – 4190 | 4570 – 5470 | 3060 → 5110 |

The front gable windows run floor to ceiling: 2850 is the First Floor clear height (3060 → 5910, printed in the section), and the front elevation measures them ≈ 3140 → ≈ 5800 (±36). The white band under them ends at the First Floor (3060).

Stair void in the slab: [6780, 440, 7730, 4350] + [5830, 440, 6780, 2730], h 2720 – 3060.

### Rooms (floor outline at the block faces)

archon's first figure is the usable area: under 1400 of clear height it counts 0, between 1400 and 2200 it counts 50 %. The figure in brackets is the floor area.

| Room | Rectangles [x1, y1, x2, y2] | Here, m² | archon, m² |
|---|---|---|---|
| Bedroom (2) | [9560,440,12760,8660] [9440,3910,9560,5530] [8490,3790,9440,5530] [8540,5530,9440,5650] [7850,4350,8490,5530] | 29.01 | 24.07 (28.16) |
| Wardrobe (3) | [8490,440,9440,3790] [7850,440,8490,3590] | 5.20 | 4.13 (5.13) |
| Wardrobe (4) | [7850,5650,9440,8660] | 4.79 | 3.60 (4.60) |
| Hall (1) | [5830,2730,6780,3410] [4190,3410,6780,5530] [6780,4350,7730,5530] | 7.26 | 7.32 |
| Bathroom (5) | [5000,5650,7730,8660] | 8.22 | 6.25 (7.99) |
| Wardrobe (8) | [4190,440,5710,3290] | 4.33 | 3.20 (4.16) |
| Room (7) | [440,440,4070,4410] | 14.41 | 11.79 (14.11) |
| Room (6) | [440,4530,4070,8660] [4070,6490,4880,8660] [4190,5650,4880,6490] | 17.33 | 13.69 (16.53) |

The wardrobes 3 and 4 open from the bedroom (no door in the plan; as built with doors, § 14) and are tiled with it.

## 11. Kitchen as drawn by archon

The kitchen is an L of 600-deep counters:

- **Along the right wall:** x ≈ 6580 – 8480, y 8060 – 8660, with the sink under the 1900 window.
- **Along wall #5:** x 5980 – 6580, y 5800 – 8660 (printed 2860). It holds the fridge, an appliance, a ≈ 500 cabinet, the hob (y ≈ 7490 – 8070) and the corner.

From the 1900 window's start (x 8480) to wall #5 (x 5980) is 2500. The pier between the 2500 and 1900 windows is x 8480 – 9870. The kitchen as built: the room_356 files.

## 12. archon data

| Item | Value |
|---|---|
| Ground Floor | 93.07 (96.72) m², stairs 5.41 included |
| First Floor | 74.05 (88.00) m² |
| Usable area, without stairs | 161.71 m² (= 93.07 + 74.05 − 5.41) |
| House net, without boiler room and garage | 139.80 m² |
| Built-up / floor / total area | 120.57 / 184.72 / 237.04 m² |
| Volume | 826.19 m³ |
| Roof area | 186.1 m² |
| Height | 8.92 m |
| Minimum plot | 17.1 × 21.2 m (16.1 × 21.2 after adaptation) |
| Foundation walls / outer walls | 41.9 / 115.2 m² |
| Load-bearing inner walls | 13.9 m² |
| Partitions, Ground Floor / First Floor | 49.1 / 76.9 m² |
| External joinery | 48.33 m² |
| Facade to insulate | 215.8 m² |
| Roof timber | 6.61 m³ |
| Construction cost, Q3 2026, net | 698,300 – 795,600 zł |
| Walls | H+H aerated concrete 240, EPS 200 (Termo Organika), plaster |
| Slab | reinforced concrete |
| Knee wall | 1200 |
| Roof | dual pitch 42°, no eaves, timber truss, ceramic tiles swissporTON, VELUX |
| Garage door | HÖRMANN |
| Heating / ventilation | gas boiler, underfloor heating / gravity |

## 13. Open points

- **Garage length.** Printed 7240, but 13200 − 440 − 4910 − 120 − 440 = 7290 and the drawing measures 7290. 7290 is used.
- **Foundation walls.** Their material is not given. If it is the same block as the walls above, the foundation wall and the Ground Floor wall become one box.
- **Footing sizes and depths.** These come from the section only (±36).
- **Stair treads.** Only the void and the riser count follow from the drawings; the tread split of § 9 is the model's.

## 14. Build changes (as built, differ from archon)

| Change | Design | As built |
|---|---|---|
| Ground Floor shower recess (bathroom 7) | 840 × 1370, x 3350 – 4190, y 7290 – 8660 | 900 × 1000: x 3350 – 4250 (900 from the glass line at x 4250), y 7660 – 8660 (1000 along the window wall). Walls: #7 to y 7660, #8 at y 7540 – 7660, #10 from y 7540. Which walls moved is assumed; the recess size was measured on site. |
| First Floor shower 1000 × 1000 (bathroom 5) | x 6830 – 7730, y 5650 – 6700 (garden end) | x 5000 – 6000, y 5650 – 6650 (front end, by the door wall) |
| First Floor bathroom door 900/2050 (#3) | x 5800 – 6700 | x 6000 – 6900 (200 toward the garden, clears the shower) |
| Chimney and wall #2 | chimney y 3790 – 4550; #2 block 120, x 7730 – 7850 | chimney y 3590 – 4350 (760 × 760, its face flush with #4 at y 4350); #2 block 240, x 7730 – 7970, y 440 – 3590 (thickened toward the living room: 4910 → 4790), load-bearing, so on a foundation wall and a footing like #4 and #7 (§ 7.1); First Floor #5 and #6 run to the chimney (y 3590, 4350) |
| Heating | gas boiler, gravity ventilation: vent shaft x 4190 – 4470 / y 5890 – 6150 (Ground Floor), x 4190 – 4880 / y 5650 – 6260 (First Floor), second stack on the roof | heat pump: one chimney (living room), no vent shaft, no second stack; the space goes to the hall (Ground Floor) and room 6 (First Floor); the First Floor wall stub #11 (x 4190 – 4310, y 6260 – 6490) is not built |
| Diagonal wall under the stair (garage) | from (7730, ≈ 2710) to (6780, ≈ 3230) | none: the stair is floating; the garage outline keeps y 2970 as the line to the stair |
| Roof build-up (§ 6) | 646 vertical (≈ 480 across the slope): top at the outer wall face 4510, ridge 8600 | 640 across the slope (861 vertical), as wide as a portal wing (EPS 200 + block 240 + EPS 200), so the white frame keeps one width; same underside, so the top rises: 4725 at the outer wall face, ridge ≈ 8820, chimney ≈ 180 above it |
| Garden bedroom ceiling (§ 6) | flat at 5910 over the whole First Floor | cathedral: open to the roof over x 9560 – 12760; the flat ceiling ends at x 9440; a block 120 wall x 9440 – 9560, h 5910 → roof, closes the Attic over the rest of the First Floor |
| Inner doors (§ 9, § 10) | widths scaled from the plans: 820 – 940 | every inner door 900/2050, a wardrobe's 700/2050 (the plans' scale is not exact; the owner's sizes), each centred where archon draws it: Ground Floor #9 x 1675 – 2575, #7 y 4890 – 5790, #6b x 1650 – 2550; First Floor #6 y 4585 – 5485, #12 (room 7) y 3490 – 4390, #12 (wardrobe 8, 700) y 1840 – 2540 |
| Wall #12 (First Floor, § 10) | x 4070 – 4190, y 440 – 6490 | built only to y 5650: no wall between y 5650 and 6490 (room 6 runs on there) |
| Wardrobes 3 and 4 (First Floor) | open to the bedroom, no door | each closed by a block 120 wall with a door 700/2050, h 3060 → 5110: wardrobe 3: wall x 8490 – 9440, y 3790 – 3910, door x 8615 – 9315; wardrobe 4: #3 runs on to x 9440 (x 7850 – 9440), door x 8640 – 9340 |
| Recess soffit EPS (§ 8.3) | thickness not given (EPS 200 elsewhere) | 470 thick, h 2250 – 2720: its underside is at the garage door head, so the white front band is one horizontal bar over the garage and the recess |

The showers are fittings and are not in this geometry; only the walls and the door are.

## 15. Site

Lawn at the terrain level (h −320). The plot runs 4000 beyond the house on each side (site plan). Paved and decked surfaces, measured on the Ground Floor plan and the site plan:

| Surface | x | y | Top h | Source |
|---|---|---|---|---|
| garden terrace, decking beyond the portal | 14200 – 15700 | 300 – 8800 | −20 | plan x ≈ 15720, site plan x ≈ 15660 |
| garden terrace under the portal | 13200 – 14200 | 640 – 8460 | −20 | printed 1000 |
| entrance, recess and under the front portal | −1000 – 900 | 4550 – 8460 | −20 | plan |
| driveway | −4000 – 0 | 640 – 4500 | −120 | plan (garage door 1150 – 3900), to the plot edge |
| path to the entrance | −4000 – −1000 | 4780 – 5980 | −120 | site plan |

Sources: [archon.pl, project data](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7), [archon.pl, construction cost](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7-koszt-budowy-7), [archon.pl, ground floor plan](https://www.archon.pl/rzut/mb68264a6f24b7/1).
