# Dom w papawerach 5 (G): geometry analysis

The house as archon gives it (the drawings in this folder and archon.pl), as boxes. What we assumed where archon is silent or unclear: § 12; what was built otherwise: § 13. A number changes only with the owner's approval. mm; levels also in m (±0.00).

## 1. Sources

| Source | What |
|---|---|
| `plan-ground-floor.png` | Ground Floor plan |
| `plan-first-floor.png` | First Floor plan |
| `section.png` | section across the house |
| `site.png` | site plan: house 9100 × 13200 on a 17100 × 21200 plot, 4000 free on each side; roof from above |
| `elevation-front.png` | front (x = 0, West) |
| `elevation-garden.png` | garden (x = 13200, East) |
| `elevation-right.png` | right (y = 0, South): windows 1000/1300, 1900/1300, 2500/2400, 2 roof windows |
| `elevation-left.png` | left (y = 9100, North): garage window 2000/1000, 1 roof window |
| [archon.pl, project data](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7) | areas, materials, § 11 |
| [archon.pl, construction cost](https://www.archon.pl/projekty-domow/projekt-dom-w-papawerach-5-g-mb68264a6f24b7-koszt-budowy-7) | quantities, § 11 |
| [archon.pl, ground floor plan](https://www.archon.pl/rzut/mb68264a6f24b7/1) | the plan, larger |

## 2. Axes

| Axis | Range |
|---|---|
| **x**, East | 0 = front outer face (West) → 13200 = garden outer face (East) |
| **y**, North | 0 = right outer face (kitchen and bathroom windows, South) → 9100 = left outer face (garage, North) |
| **h**, up | 0 = ±0.00 finished Ground Floor; 3060 finished First Floor; 5910 Attic floor; ridge 8600 (8820 as built, § 13); terrain −320 |

Zero: the corner of the front and right outer faces (South-West), at ±0.00. x, y, h: East, North, up, a right-handed set. Left and right: seen facing the front, as archon names the elevations. The plans: garden at the top, garage on the left.

## 3. Modelling rules

- **Box.** The only solid: an axis-aligned box `x1–x2, y1–y2, h1–h2`.
- **One shape, one box.** A wall of one material and thickness is one box end to end, through its openings; never split around them.
- **Openings** (doors, windows): boxes subtracted from every wall and EPS box they cross.
- **Crossings.** The load-bearing (thicker) wall runs through; the other stops at its faces.
- **Under the roof.** A box reaching the roof stays one box, its top cut by the roof planes (§ 6); gable windows by lines parallel to the roof (§ 10).
- **Element by element.** One material, one element (block, EPS, slab, footing).

## 4. Reading the drawings

- **Printed dimensions first**; pixels only place what has none. Plans 0.04297 px/mm (9100 = 391 px, 1 px ≈ 23 mm); section 0.0280 px/mm (1 px ≈ 36 mm); site plan 0.0335 px/mm (1 px ≈ 30 mm). archon prints whole cm: every value is a multiple of 10 unless derived. Measured: ±23 on the plans, ±36 on the section.
- **The printed chains close:**
  - Ground Floor, y (front), from the left outer face: 440 + 3670 + 120 + 1920 + 120 + 2390 = 8660, to the right wall's inner face (y 440).
  - Ground Floor, x (right side): 440 + 3380 + 3400 + 120 + 2510 + 120 + 1890 = 11860, garden outer face to the entrance wall's inner face (x 1340). Vestibule: 1340 + 2610 = 3950.
  - First Floor, x: 440 + 3200 + 120 + 1590 + 120 + 2730 + 120 + 4440 + 440 = **13200** ✓ (printed overall length).
  - First Floor, y, from the left outer face: 440 + 3970 + 120 + 4130 = 8660 ✓; 440 + 3350 = 3790 (y 5310); 8660 − 3010 = 5650 (y 3450); 440 + 2850 = 3290 (y 5810). x: 440 + 3630 = 4070; 4070 + 120 + 1520 = 5710.
- **Roof check.** The First Floor plan's dashed clear-height lines 1400 and 2200 lie at y ≈ 650 and 1560; the roof of § 6 gives 660 and 1550.
- **Pixel check.** Every outer opening, the walls of § 9 and § 10, the portal wings (1000 at each end) and the vent shaft of § 13 lie where the tables put them, within ±23.

## 5. Levels (h)

| Level | h | Source |
|---|---|---|
| Footing bottom / top | ≈ −1320 / ≈ −920 | section, measured |
| Terrain | −320 | printed |
| Ground slab build-up, bottom | ≈ −360 | section, measured |
| Ground Floor, finished | 0 | ±0.00 |
| Ground Floor ceiling (slab underside) | 2720 | printed |
| First Floor, finished | 3060 | printed +3.06 (slab + floor = 340) |
| Roof underside, outer wall face | 3864 | 4260 − tan 42° · 440 |
| Roof underside, knee wall's inner face | 4260 | 3060 + 1200 (printed knee wall) |
| Roof top, outer wall face | 4510 | printed +4.51 |
| First Floor flat ceiling (Attic floor) | 5910 | 3060 + 2850 (printed) |
| Top of ceiling insulation | ≈ 6300 | section, measured |
| Roof underside, ridge | 7960 | 3864 + tan 42° · 4550 |
| Ridge top | 8600 | printed +8.60 (derived 8607) |
| Chimney top | ≈ 9000 | section |
| Height above terrain | 8920 | archon 8.92 m |

## 6. Roof

- **Shape.** Dual pitch 42°, no eaves on the long sides; ridge along x at y 4550.
- **Underside.** h = 3864 + tan 42° · d; d = distance from the nearer long outer face (y or 9100 − y, up to 4550).
- **Build-up.** archon: 646 vertical (≈ 480 perpendicular): rafters, insulation, battens, ceramic tiles; top = underside + 646. As built 640 perpendicular (§ 13).
- **Length.** x −1000 → 14200: on over both terraces as the portal frame (§ 8.4).
- **Flat ceiling** at h 5910 where the underside is higher: y 2270 – 6830. Above it the Attic, an unused loft ≈ 1.6 m high. Box x 440 – 9440, y 440 – 8660, h 5910 → 6300 (ceiling with insulation), top cut by the roof, minus the chimney. The garden bedroom (x 9560 – 12760): cathedral ceiling, § 13.
- **Roof windows, 3 × 940/1400**: 940 along x, 1400 along the slope (1040 in plan). The plan draws ≈ 840 of it, from the knee wall's inner face (y below); the full 1040 runs on over the knee wall (y 7820 – 8860 and 240 – 1280). x confirmed by the site plan and the elevations.

| Roof window | x | y (plan) | Slope |
|---|---|---|---|
| Bedroom | 10710 – 11650 | 440 – 1280 | right |
| Above the stairs | 5870 – 6810 | 7820 – 8660 | left |
| First Floor bathroom | 5870 – 6810 | 440 – 1280 | right |

## 7. Construction (in order)

1. **Foundations.** Footings ≈ 600 × 400 (h −1320 → −920), centred under every load-bearing wall: outer walls (block axis 320 in from the outer face), entrance wall, inner block-240 walls (the section shows one 610 wide), chimney. Foundation walls (h −920 → 0) as thick as the walls above; archon's 41.9 m² fits ≈ 0.9–1.0 m height along the ≈ 42 m axis of the outer walls. Ground slab ≈ 360 (h −360 → 0). Plinth 320 (−320 → 0). Boxes: § 7.1.
2. **Ground Floor walls.** H+H aerated concrete: **240** outer and load-bearing, **120** partitions, h 0 → 2720. Outer walls 440: block 240 + EPS 200. Block outer faces: y 200 / 8900, x 200 / 13000. Windows and doors sit in the block.
3. **Slab with ring beam.** Reinforced concrete, one box x 200 – 13000, y 200 – 8900, h 2720 – 3060 (with the First Floor's floor build-up), minus the stair void (§ 10) and the chimney; it also roofs the entrance recess.
4. **Knee walls** (block 240, h 3060 → roof, 1200 high at the inner face) and **gables** (block 240, h 3060 → roof).
5. **Roof.** Timber truss (6.61 m³), ceramic tiles (swissporTON), VELUX windows, 186.1 m².
6. **Insulation**, after the roof: EPS 200 over the whole building, around the blocks, the slab edge and the window reveals; 215.8 m² of facade. Finish: § 8.5. U: walls 0.118, roof 0.12, windows < 0.9 W/(m²·K).
7. **Services.** archon: gas boiler; as built: heat pump, underfloor heating, one chimney (living room), no vent shaft, no second stack (§ 13).

### 7.1 Foundation boxes

Footings h −1320 → −920; foundation walls h −920 → 0; ground slab h −360 → 0. Every block-240 wall of the Ground Floor stands on a foundation wall and a footing. The chimney stands on the ground slab (from h 0) over a chimney foundation of its own size; its footing reaches 180 past each face like a wall footing, in line with the footings of #2 (x 7550) and #4 (y 4570).

| Element | Footing x / y | Foundation wall x / y |
|---|---|---|
| left (both wings) | −1000 – 14200 / 8480 – 9080 | −800 – 14000 / 8660 – 8900 |
| right (both wings) | −1000 – 14200 / 20 – 620 | −800 – 14000 / 200 – 440 |
| garden | 12580 – 13180 / 620 – 8480 | 12760 – 13000 / 440 – 8660 |
| garage front | 20 – 620 / 4570 – 8480 | 200 – 440 / 4750 – 8660 |
| recess, garage side | 620 – 1520 / 4570 – 5170 | 440 – 1340 / 4750 – 4990 |
| entrance wall | 920 – 1520 / 620 – 4570 | 1100 – 1340 / 440 – 4750 |
| #2 (as built, § 13) | 7550 – 8150 / 5690 – 8480 | 7730 – 7970 / 5510 – 8660 |
| #4 | 3770 – 6960 / 4570 – 5170 | 3950 – 6660 / 4750 – 4990 |
| #7 | 3770 – 4370 / 1140 – 4570 | 3950 – 4190 / 1440 – 4750 |
| chimney | 7550 – 8670 / 4570 – 5690 | 7730 – 8490 / 4750 – 5510 (chimney foundation) |

Ground slab: x 440 – 12760, y 440 – 4110 (garage) and x 1340 – 12760, y 4110 – 8660 (house), minus the foundation walls and the chimney foundation.

## 8. Outer walls

### 8.1 Ground Floor blocks (h 0 → 2720)

| Element | x | y |
|---|---|---|
| left (through both portal wings) | −800 – 14000 | 8660 – 8900 |
| right (through both wings; also the recess's right side) | −800 – 14000 | 200 – 440 |
| garden | 12760 – 13000 | 440 – 8660 |
| garage front | 200 – 440 | 4750 – 8660 |
| garage side of the recess | 440 – 1340 | 4750 – 4990 |
| entrance wall | 1100 – 1340 | 440 – 4750 |

Entrance recess: open to the outside at x 0 – 900, y 640 – 4550, roofed by the slab.

### 8.2 First Floor blocks (h 3060 → roof)

| Element | x | y |
|---|---|---|
| knee wall left (through both wings) | −800 – 14000 | 8660 – 8900 |
| knee wall right (through both wings) | −800 – 14000 | 200 – 440 |
| garden gable | 12760 – 13000 | 440 – 8660 |
| front gable | 200 – 440 | 440 – 8660 |

### 8.3 EPS 200

| Element | x | y | h |
|---|---|---|---|
| left (house and both wings) | −1000 – 14200 | 8900 – 9100 | −920 → roof |
| right (house and both wings) | −1000 – 14200 | 0 – 200 | −920 → roof |
| garden | 13000 – 13200 | 440 – 8660 | −920 → roof |
| garage front | 0 – 200 | 4550 – 8660 | −920 → 2720 |
| recess, garage side | 200 – 900 | 4550 – 4750 | −920 → 2720 |
| entrance wall | 900 – 1100 | 640 – 4750 | −920 → 2720 |
| recess, right side | 0 – 1100 | 440 – 640 | −920 → 2720 |
| front gable and slab edge | 0 – 200 | 440 – 8660 | 2720 → roof |
| recess soffit (470, as built) | 0 – 900 | 640 – 4550 | 2250 → 2720 |

EPS covers every block on all sides, the slab edge and the gables up to the roof: no thermal bridges. Below ±0: plinth insulation, finished as plinth.

### 8.4 Portal (the white frame)

At each end the long walls run on past the gable as wings, 640 wide (EPS 200 + block 240 + EPS 200), h 0 → roof, under the roof. The frame is one width, 640, front and back: the wings across, the roof across the slope (§ 13). Depth 1000 (printed) at both ends; terraces: § 14.

- **Block**: the long wall's own block, one box end to end (§ 8.1, § 8.2; foundation −800 → 14000); no EPS between the house and a wing.
- **Ring beam** over the wing block: x −800 – 200 and 13000 – 14000, h 2720 – 3060, y 200 – 440 and 8660 – 8900.
- **EPS**: outer face = the long EPS box (§ 8.3); inner face and head cap, h −920 → roof:

| Wing | inner EPS x | inner EPS y | head EPS x | head EPS y |
|---|---|---|---|---|
| garden left | 13200 – 14000 | 8460 – 8660 | 14000 – 14200 | 8460 – 8900 |
| garden right | 13200 – 14000 | 440 – 640 | 14000 – 14200 | 200 – 640 |
| front left | −800 – 0 | 8460 – 8660 | −1000 – −800 | 8460 – 8900 |
| front right | −800 – 0 | 440 – 640 | −1000 – −800 | 200 – 640 |

### 8.5 Facade finish

Read from the elevations (image, not dimension). Covers the EPS facing the air; a later row wins. Not listed: white plaster (the portal: wings, heads, roof ends; the long walls).

| Side of the EPS facing the air | Region | Finish |
|---|---|---|
| everywhere | h < 0 | plinth |
| garden (+x) | y 640 – 8460 | graphite |
| garden | y 1550 – 7550, h 2400 – 3060 (between the two big windows) | timber, horizontal boards |
| front (−x) | y 640 – 8460 | graphite |
| front, face x 0 – 200 | y 640 – 8460, h 2250 – 3060 (band over the garage and the recess) | white |
| front gable | y 3880 – 5220, h ≥ 3060, under the windows' roof lines | timber, vertical boards |
| entrance wall | y 640 – 1690 and 2490 – 2950, h 0 – 2720 | timber, vertical boards |
| recess sides | h 0 – 2720 | graphite |
| recess soffit, underside | x 200 – 1100 | graphite |
| right (−y) | x 4170 – 9870, h 0 – 2400 (around the 1900 and 1000 windows) | graphite |
| left (+y) | x 3560 – 11930, h 0 – 2400 (garage, up to the 2000 window) | graphite |
| chimney | h ≥ 7000 | graphite |

Roof: graphite tiles on top; underside, ends and eaves white.

## 9. Ground Floor

### Inner walls (h 0 → 2720 unless stated)

| # | Kind | x | y | Note |
|---|---|---|---|---|
| 1 | chimney | 7730 – 8490 | 4750 – 5510 | h 0 → ≈ 9000, on its foundation (§ 7.1), one box through both floors and the roof; face flush with #4 (§ 13) |
| 2 | block 240 | 7730 – 7970 | 5510 – 8660 | living / garage; as built (§ 13), on a foundation wall (§ 7.1) |
| 3 | block 120 | 6660 – 6780 | 4750 – 5900 | stair wall |
| 4 | block 240 | 3950 – 6660 | 4750 – 4990 | garage / hall, load-bearing |
| 5 | block 120 | 5860 – 5980 | 440 – 3300 | kitchen / bathroom |
| 6a | block 120 | 4190 – 5860 | 2830 – 2950 | hall / bathroom |
| 6b | block 120 | 1340 – 3950 | 2830 – 2950 | vestibule / boiler room |
| 7 | block 240 | 3950 – 4190 | 1440 – 4750 | load-bearing, runs through 6; from 1440 as built (§ 13) |
| 8 | block 120 | 3350 – 3950 | 1440 – 1560 | bathroom / boiler room; at y 1440 – 1560 as built (§ 13) |
| 9 | block 120 | 1340 – 3950 | 4870 – 4990 | garage / vestibule |
| 10 | block 120 | 3230 – 3350 | 440 – 1560 | bathroom / boiler room; to 1560 as built (§ 13) |

### Openings

| Opening | W/H | In | x | y | h |
|---|---|---|---|---|---|
| window | 6000/2400 | garden | 12760 – 13200 | 1550 – 7550 | 0 → 2400 |
| window | 2000/1000 | left | 3580 – 5580 | 8660 – 9100 | 1100 → 2100 |
| window | 2500/2400 | right | 9870 – 12370 | 0 – 440 | 0 → 2400 |
| window | 1900/1300 | right | 6580 – 8480 | 0 – 440 | 1100 → 2400 |
| window | 1000/1300 | right | 4170 – 5170 | 0 – 440 | 1100 → 2400 |
| garage door | 2750/2250 | garage front | 0 – 440 | 5200 – 7950 | 0 → 2250 |
| entrance door | 1600/2100 | entrance wall | 900 – 1340 | 2950 – 4550 | 0 → 2100 (leaf 1000 on the garage side, glass beside it) |
| boiler room door | 800/2100 | entrance wall | 900 – 1340 | 1690 – 2490 | 0 → 2100 (glazed) |
| door | 870/2050 (900, § 13) | #9 | 1690 – 2560 | 4870 – 4990 | 0 → 2050 |
| door | 920/2050 (900, § 13) | #7 | 3950 – 4190 | 3300 – 4220 | 0 → 2050 |
| door | 900/2050 | #6a | 4540 – 5440 | 2830 – 2950 | 0 → 2050 |
| door | 920/2050 (900, § 13) | #6b | 1640 – 2560 | 2830 – 2950 | 0 → 2050 |

### Stair

Floating (§ 13): treads and a landing, 17 risers of 180 (0 → 3060); the plan draws treads ≈ 265 deep. Treads split as assumed (§ 12):

| Part | x | y | Risers |
|---|---|---|---|
| lower flight | 6780 – 7730 | 4750 → 7665, 11 treads | 1 – 11 |
| landing | 5830 – 7730 | 7665 – 8660 | 12 |
| upper flight | 5830 – 6780 | 7665 → 6370, 4 treads | 13 – 16 (17 = First Floor) |

### Rooms (floor at the block faces)

archon's areas are after plaster: 2–4 % smaller.

| Room | Rectangles [x1, y1, x2, y2] | Here, m² | archon, m² |
|---|---|---|---|
| Salon, kitchen and hall (5, 6, 3) | [7970,5510,12760,8660] [8490,4750,12760,5510] [7730,440,12760,4750] [5980,440,7730,4750] [5860,3300,5980,4750] [4190,2950,5860,4750] | 50.74 | 35.42 + 9.67 + 5.46 = 50.55 |
| Vestibule (1) | [1340,2950,3950,4870] | 5.01 | 4.84 |
| Bathroom (7) | [4190,440,5860,2830] [3350,440,4190,1440] | 4.83 | 4.95 (design) |
| Boiler room with laundry (8) | [1340,1560,3950,2830] [1340,440,3230,1560] | 5.43 | 4.97 (design) |
| Garage (2) | [6780,6130,7730,8660] [6660,5900,6780,8660] [440,4990,6660,8660] | 25.56 | 22.35 (25.91) |
| Stairs (4) | [6780,4750,7730,6130], not a room | – | 5.41 |

## 10. First Floor

### Inner walls (block 120, h 3060 → 5910, cut by the roof where lower)

| # | Kind | x | y |
|---|---|---|---|
| 1 | block 120 | 9440 – 9560 | 5190 – 8660 |
| 2 | block 120 | 9440 – 9560 | 440 – 3570 |
| 3 | block 120 | 4190 – 8540 | 3450 – 3570 (stops at #6: 7850 – 8540 and 4190 – 7730) |
| 4 | chimney | Ground Floor #1 | |
| 5 | block 120 | 7730 – 7850 | 5510 – 8660 |
| 6 | block 120 | 7730 – 7850 | 440 – 4750 |
| 7 | block 120 | 5710 – 5830 | 5690 – 8660 |
| 8 | block 120 | 4190 – 5710 | 5690 – 5810 |
| 9 | block 120 | 4880 – 5000 | 440 – 3450 |
| 12 | block 120 | 4070 – 4190 | 2610 – 8660 (from 3450 as built, § 13) |
| 13 | block 120 | 440 – 4070 | 4570 – 4690 |

### Openings

| Opening | W/H | In | x | y | h |
|---|---|---|---|---|---|
| window | 6000/3460 | garden gable | 12760 – 13200 | 1550 – 7550 | 3060 → 6520, top parallel to the roof: h = 6520 − tan 42° · \|y − 4550\| |
| window | 2200/2850 | front gable | 0 – 440 | 5220 – 7420 | 3060 → 5910, top: h = 5910 − tan 42° · (y − 5220); transom at 3900 |
| window | 2200/2850 | front gable | 0 – 440 | 1680 – 3880 | 3060 → 5910, top: h = 5910 − tan 42° · (3880 − y); transom at 3900 |
| door | 890/2050 (900, § 13) | #6 | 7730 – 7850 | 3620 – 4510 | 3060 → 5110 |
| door | 900/2050 | #3 | 6000 – 6900 | 3450 – 3570 | 3060 → 5110 (as built; design x 5800 – 6700, § 13) |
| door | 820/2050 (700, § 13) | #12 | 4070 – 4190 | 6500 – 7320 | 3060 → 5110 |
| door | 940/2050 (900, § 13) | #12 | 4070 – 4190 | 4690 – 5630 | 3060 → 5110 |
| door | 900/2050 | #12 | 4070 – 4190 | 3630 – 4530 | 3060 → 5110 |

Front gable windows run floor to ceiling: 2850 = First Floor clear height (3060 → 5910, printed in the section); the front elevation measures ≈ 3140 → ≈ 5800 (±36). The white band under them ends at 3060.

Stair void in the slab: [6780, 4750, 7730, 8660] + [5830, 6370, 6780, 8660], h 2720 – 3060.

### Rooms (floor at the block faces)

archon's first figure: usable area (clear height under 1400 counts 0, 1400 – 2200 counts 50 %); in brackets: floor area.

| Room | Rectangles [x1, y1, x2, y2] | Here, m² | archon, m² |
|---|---|---|---|
| Bedroom (2) | [9560,440,12760,8660] [9440,3570,9560,5190] [8490,3570,9440,5190] [7850,3570,8490,4750]: as built, § 13 (the wardrobe walls); archon's design 29.01 | 28.79 | 24.07 (28.16) |
| Wardrobe (3) | [8490,5310,9440,8660] [7850,5510,8490,8660] | 5.20 | 4.13 (5.13) |
| Wardrobe (4) | [7850,440,9440,3450] | 4.79 | 3.60 (4.60) |
| Hall (1) | [5830,5690,6780,6370] [4190,3570,6780,5690] [6780,3570,7730,4750] | 7.26 | 7.32 |
| Bathroom (5) | [5000,440,7730,3450] | 8.22 | 6.25 (7.99) |
| Wardrobe (8) | [4190,5810,5710,8660] | 4.33 | 3.20 (4.16) |
| Room (7) | [440,4690,4070,8660] | 14.41 | 11.79 (14.11) |
| Room (6) | [440,440,4070,4570] [4070,440,4880,3450]: as built, § 13 (#12 from 3450, no vent shaft); archon's design 17.33 | 17.43 | 13.69 (16.53) |

Wardrobes 3 and 4 open from the bedroom (no door in the plan; doors as built, § 13) and are tiled with it.

## 11. archon data

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

## 12. Assumed

Where archon gives no number or two that disagree, we chose:

| What | archon | Assumed |
|---|---|---|
| Garage length | printed 7240; the chain 13200 − 440 − 4910 − 120 − 440 and the drawing give 7290 | 7290 |
| Foundation walls | material not given | a box of its own under each block-240 wall, as thick as it |
| Footings | not printed; the section only (±36) | ≈ 600 × 400, h −1320 → −920 |
| Stair treads | only the void and 17 risers | 11 treads, a landing, 4 treads (§ 9) |
| Shower recess walls (§ 13) | – | which walls moved; the recess size was measured on site |

## 13. As built (differ from archon)

The owner's decisions and what was built otherwise.

| Change | archon | As built |
|---|---|---|
| Ground Floor shower recess (bathroom 7) | 840 × 1370, x 3350 – 4190, y 440 – 1810 | 900 × 1000: x 3350 – 4250 (900 from the glass line at x 4250), y 440 – 1440 (1000 along the window wall). Walls: #7 from y 1440, #8 at y 1440 – 1560, #10 to y 1560 |
| First Floor shower 1000 × 1000 (bathroom 5) | x 6830 – 7730, y 2400 – 3450 (garden end) | x 5000 – 6000, y 2450 – 3450 (front end, by the door wall) |
| First Floor bathroom door 900/2050 (#3) | x 5800 – 6700 | x 6000 – 6900 (200 toward the garden, clears the shower) |
| Chimney and wall #2 | chimney y 4550 – 5310; #2 block 120, x 7730 – 7850 | chimney y 4750 – 5510 (760 × 760, face flush with #4 at y 4750); #2 block 240, x 7730 – 7970, y 5510 – 8660 (living room 4910 → 4790), load-bearing: on a foundation wall and a footing like #4 and #7 (§ 7.1); First Floor #5 and #6 run to the chimney (y 5510, 4750) |
| Heating | gas boiler, gravity ventilation: vent shaft x 4190 – 4470 / y 2950 – 3210 (Ground Floor), x 4190 – 4880 / y 2840 – 3450 (First Floor), second stack on the roof | heat pump, one chimney (living room); no vent shaft, no second stack: the space goes to the hall (Ground Floor) and room 6 (First Floor); First Floor wall stub #11 (x 4190 – 4310, y 2610 – 2840) not built |
| Wall under the stair (garage) | diagonal, (7730, ≈ 6390) → (6780, ≈ 5870) | none: the stair floats; the garage outline keeps y 6130 toward the stair |
| Roof build-up (§ 6) | 646 vertical (≈ 480 across the slope): top 4510 at the outer wall face, ridge 8600 | 640 across the slope (861 vertical), as wide as a portal wing (EPS 200 + block 240 + EPS 200): one width for the white frame; same underside, so the top rises: 4725 at the outer wall face, ridge ≈ 8820, chimney ≈ 180 above it |
| Garden bedroom ceiling (§ 6) | flat at 5910 over the whole First Floor | cathedral over x 9560 – 12760; flat ceiling ends at x 9440; block 120 wall x 9440 – 9560, h 5910 → roof, closes the Attic |
| Inner doors (§ 9, § 10) | widths scaled from the plans: 820 – 940 | all 900/2050, wardrobe doors 700/2050 (the owner's sizes; the plans' scale is not exact), centred where archon draws them: Ground Floor #9 x 1675 – 2575, #7 y 3310 – 4210, #6b x 1650 – 2550; First Floor #6 y 3615 – 4515, #12 (room 7) y 4710 – 5610, #12 (wardrobe 8, 700) y 6560 – 7260 |
| Wall #12 (First Floor, § 10) | x 4070 – 4190, y 2610 – 8660 | only from y 3450: room 6 runs on between y 2610 and 3450 |
| Wardrobes 3 and 4 (First Floor) | open to the bedroom, no door | each closed by a block 120 wall with a door 700/2050, h 3060 → 5110: wardrobe 3: wall x 8490 – 9440, y 5190 – 5310, door x 8615 – 9315; wardrobe 4: #3 runs on to x 9440 (x 7850 – 9440), door x 8640 – 9340 |
| Recess soffit EPS (§ 8.3) | thickness not given (EPS 200 elsewhere) | 470, h 2250 – 2720: underside at the garage door head, so the white front band is one level bar over the garage and the recess |

Showers are fittings, not geometry: only their walls and doors are here.

## 14. Site

Lawn at terrain level (h −320); the plot runs 4000 beyond the house on each side (site plan). Paved and decked surfaces, measured on the Ground Floor plan and the site plan:

| Surface | x | y | Top h | Source |
|---|---|---|---|---|
| garden terrace, decking beyond the portal | 14200 – 15700 | 300 – 8800 | −20 | plan x ≈ 15720, site plan x ≈ 15660 |
| garden terrace under the portal | 13200 – 14200 | 640 – 8460 | −20 | printed 1000 |
| entrance, recess and under the front portal | −1000 – 900 | 640 – 4550 | −20 | plan |
| driveway | −4000 – 0 | 4600 – 8460 | −120 | plan (garage door 5200 – 7950), to the plot edge |
| path to the entrance | −4000 – −1000 | 3120 – 4320 | −120 | site plan |
