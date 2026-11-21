# House

The house "Dom w papawerach 5 (G)" (archon.pl), as built, standing in its site (the root of house.js): its floors, rooms, and a part of itself cut out for a room. Source of the numbers: archon/analysis.md.

## Files

| File | Does |
|---|---|
| house.js | the house's data: settings (root of the cascade), what it is made of, floors and rooms |
| model.js | house.js made into solids (walls, slabs, roof, windows, doors, stair, site); the rooms in the house's axes; a part cut out for a room's view; the floor layouts; checks; the top-left menu. No browser |
| plan.js | the 2D plan, a sheet per floor (core/plan2d.js draws): what is cut, the stair, the roof's clear heights and windows, the doors open, labels, rooms, dimensions; a room's view too (To do 3) |
| docs.js | the house's Documents: rooms and their areas, inner doors, floor tiles to buy, notes |

## Views

- **The whole house**: every solid; the doors turn on their hinges. Panel View: Floors and Layers; a solid shows when its floor and its kind are on. Roof off: the highest floor shown is open. Walk: the whole house only.
- **A room's view**: its rooms' solids cut to each room's box. Each wall, floor and ceiling is an object; an object the camera is beyond hides (still casting its shadow), and with it whatever lies on it (a window, its tiles). The light is the interior light.
- **2D**: one sheet per floor (a room's view: its rooms' floors): what is cut filled, what is below seen, the doors' swings, the openings' labels, the rooms with their areas. The whole house: dimension chains on every side; a room: its overall sizes and its furniture seen from above.
- **Documents**: the whole house: Rooms, Floor tiles, Doors, Notes; a room's view: its own (room/docs.js). Then Elements (the tree shown) and Test.
- **Finish** (3D panel), per room: one metal for its fittings, each board with its stand-ins (room/model.js); the floor tiles: tile, pattern, direction, origin, grout, Fit (the origin with the fewest small cuts). Changes stay in the browser.

## Rules

- **Source**: the model copies the boxes of archon/analysis.md (with its changes as built); it never measures anew.
- **Inner doors**: a click on a leaf opens or closes it; on a walk, Space by a door.
- **Walk**: the body is a circle; walls and fixed parts push it out the shortest way; the floor runs on through a passage. Furniture shown stops it too; a door not fully open stops it.
- **Floor tiles**: one layout per node that sets `settings.tiles`, over the rooms that take it, laid from one origin; rooms meeting without a wall are one zone and the tiles run through the doors (room/tiles.md). One slab: its edges only round the floor's outline.

## Format `house`, version 3

The root node is the **site** (core/project.md: format tree), with format and version. Zero: the lawn's corner. Fields, in the site's axes: `lawn` (`rect` [x1, x2, y1, y2], `h` top, `depth`, `material`, `aroundBuilding`), `surfaces` (`rect`, `h`, `material`), `layers`, `walkable`. Its child, the **house**: offset = where it stands in the site (h below the lawn); fields:

| Field | Means |
|---|---|
| settings.view | `layers` (layer tree, names), `floors` and `elements` (the two Layers blocks), `edges`, `light` (`clouds`: default count, the sun's and sky's factors and shadow blur at full cloud; `inside`: a part's light), `cameras`, `walk`, `planNote` (under the 2D sheets) |
| settings.tiles | floor tiles, common: `reserve` (cut reserve, fraction), `top` (tile face over the floor, mm), `grout` (grout face over the floor, mm), `depth` (tile with glue, from the face down: 12 = 8 tile + 4 glue, room/tiles.md), `layers`, `small` (the layer showing small cuts) |
| source, notes | source of the geometry; remarks for Documents |
| geometry | materials and drawing rules (below) |
| children | `foundation`, the floors (`ground`, `attic`), `facade`, `roof`, `stair` |

**The house's tree.** Every element is a node. The house's zero: its extreme corner (left wing's insulation, garden insulation, footings' bottom).

- `foundation` (assembly): footings, foundation walls, chimney foundation, ground slabs.
- a floor: walls (blocks, chimney, balustrades), ring beams, the slab over it, its rooms; an opening is a node of its wall, from the wall's origin.
- `facade` (assembly): EPS of the walls and soffit.
- `roof` (assembly): planes (pitch, eave, width, thickness, x, faces, cap, cuts, layers, windowFrame, clearHeights), the attic ceiling, loft walls, roof windows (`roofWindow`: place, label).
- `stair` (assembly): flights (risers, tread, material, layers, walkable, flights), its void (`void` of `voidBox`es).

An assembly stands at the house's zero with the house's size; a floor at its level.

**An element**: type = its kind. Fields: `top: "roof"` (under both roof planes), `below` (lines it stays under), `cuts` (ids of elements or voids removed from it), `floor` (as a kind's), `outer` (side facing the air: E, W, N, S, down).

**An opening**: `label` (archon's width/height), `outer`, `cols`, `transoms` (heights), `below`, `leaf`. An inner door also: `hinge` (jamb it turns on), `opens` (side it opens to), `flush` (side where the leaf is flush with the wall: toward a hall, then a vestibule, the living room, a bedroom), `product`, `extras`.

**A floor** (type `floor`): offset h = its level; size h = its height (the top of its rooms). Fields: `inside` (floor area within the outer walls, `[x1, x2, y1, y2]`), `other` (non-room areas: the stair), `settings.view` (`cameras`; `plan`: 2D cut height over the floor). Children: walls, slabs, rooms.

**A room**: type = its kind (`bathroom`, `wardrobe`, `bedroom`, `hall`, `vestibule`, `garage`, `boiler`; `room`: a space of several of archon's rooms); id = kind and archon's number (`bathroom_7`; `room_356`: archon's hall 3, living room 5 and kitchen 6, one space with no walls between them). Offset: the smallest corner of its floor area; size: its bounding box and the floor's height. Fields: `number` (archon's), `area` (floor area at the block faces, rectangles in its axes), `archonArea` (m², after plaster; reference only), `note` (where a wall-less border runs, why), `files` (its data files in room/: cabinets, scene, docs).

**Floor tiles** (`settings.tiles` of a floor or a room): `product` (a library tile), `dir` (x or y: the tiles' length along it), `pattern` (grid, half, third, quarter, random; none: the product's), `origin` ([x, y] in the node's axes: a tile corner; the grid runs both ways). A room takes its floor's; a room that sets an origin has its own layout (the rest from its floor); `null`: no tiles (the room's own design lays its floor: the bathrooms; the garage).

**geometry**. Every number of a node's fields is in that node's axes: the house's geometry and views in the house's; a floor's areas and cameras in the floor's; roof planes and stair flights in theirs; an element's or opening's `below` and transoms in its own.

| Field | Means |
|---|---|
| split | height between ground floor and attic |
| body | the main body along x [x1, x2], without the wings |
| kinds | element kinds: name, material, cap (section colour), thickness (checked), layers; `opened` (openings cut out), `host` (windows and doors sit in it), `walkable`, `finish` (the facade layer switching its finish), `raw` (bare material), `floor` (its floor layer when not the one its height gives: the attic ceiling → roof) |
| openingKinds | `glazed` (frame, bars, glass; `sill`), `leaf` (solid leaf), `door` (inner door of frames.doors), `passage` (the floor runs through), `layer` |
| frames | window frames, bars, glass; `doors`: the inner door, hidden frame, all alike: `frame` (width on the opening half of the leaf's depth), `stop` (on the other half), `gap`, `bottom` (gap at the floor), `depth` (leaf), `angle` (open), materials, handle; the leaf flush on the door's `flush` side, stepped against the frame (no light passes); `leaves` (gate's and entrance's leaf, grooves, handle) |
| finishes | facade: which material covers which part of an EPS box, by outer side, region (x, y, h; missing or null end: unbounded) and lines; a later rule wins |
| part | what a part takes: element kinds, fixtures (frames, glass, doors), roof |
| line | `{h, y, pitch}`: h + pitch · tan(roof pitch) · (y′ − y) |

## Checks

Tree (info: what lies below the house's zero: nothing); unique ids of elements, openings, roof windows, voids; every element's thickness by its kind; no two solids share volume (site, frames, glass included); no floor area without a room; no overlapping rooms; room areas against archon's (info).
