# House

The house "Dom w papawerach 5 (G)" (archon.pl), as built, standing in its site (the root of house.js): its floors, rooms, and a part of itself cut out for a room. Source of the numbers: archon/analysis.md.

## Files

| File | Does |
|---|---|
| house.js | the house's data: settings (root of the cascade), what it is made of, floors and rooms |
| model.js | house.js turned into solids (walls, slabs, roof, windows, doors, stair, site); rooms in the house's axes and their borders without a wall; a part cut out for a room; checks; the top-left menu. No browser |

```
house.js ─► model.js ─► solids ─► index.js: 3D, 2D (core)
                     ─► rooms, borders, parts ─► index.js, room engine
                     ─► checks ─► Test
```

## Views (index.js)

- **Active room**: always one, the panel's title (its floor under it), picked in the floors' menus, kept in the browser; at first the first furnished room.
- **House / Room** (top left): the whole house, or its walls cut to the active room. A room picked in House keeps the view; in Room it shows that room.
- **Whole house**: every solid; doors turn on their hinges. Panel View: Floors (floors, roof) and Layers (element kinds); a solid shows when its floor and kind are both on. Roof off: the highest floor shown is open and adds its cameras. Walk: whole house only.
- **A part**: its rooms' solids trimmed to each room's box (floor area to the far faces of its walls, from the slab under it to what closes it above). Each wall, floor and ceiling is an object; a window or door hides with its wall; an object the camera is beyond hides (still casting shadow). Floors do not apply; the light is the interior light.
- **3D panel**: View (the house's layers and the active room's furniture; a furniture layer switches that kind in every room) and Finish (the active room's). Cameras: the house's or the room's own. Open / Close: every moving part (doors, drawers, a shower door).
- **2D**: one sheet per floor (of a part: its rooms' floors): cut filled, below seen, door swings, opening labels, rooms with areas, dash-dot borders. Whole house: CAD dimension chains on every side (openings, then overall); a part: overall sizes. A furnished room: appliances as their boxes (cut grey, seen outlined), sink and hob seen from above. Wheel zooms at the cursor; drag moves.
- **Documents**, whole house: Rooms (model and archon areas), Floor tiles, Doors (what is bought per door, each by name and place), Notes; a room's view: its own (room/docs.js). Then Elements (the tree shown, each node's offset and size; closed) and Test (open).
- **Test**: the tree, the house, the library, the rooms' furniture, the floor tiles; a requested room the house lacks.

## Rules

- **Source**: the model copies the boxes of archon/analysis.md (with its changes as built); it never measures anew.
- **Outside the model**: furniture and fittings (the rooms'). The fireplace is the house's (not drawn yet).
- **Inner doors**: a click on a leaf opens or closes it; on a walk, Space by a door. A room cut out gets its doors with its walls.
- **Walk**: the body is a circle (walk radius); walls and fixed parts push it out the shortest way (it slides along a wall, turns into a doorway at a jamb); the floor runs on through a passage; a step is split so nothing is passed through. Furniture shown stops it too; a door not fully open stops it.
- **2D stair**: under the cut a full line, over it dashed; from the floor above all of it, through the void.

## Floor tiles and Finish

- One layout per node that sets `settings.tiles`, over the rooms that take it. A slab from the tiles' face down into the floor, edges closed; grout below the face; the face drawn ahead of what lies close behind (no flicker). Rooms of one layout meeting without a wall are one zone: tiles run across the border and through doors. How tiles are laid: room/tiles.md.
- **Finish** (3D panel), per active room:
  - Furniture: one metal for all fittings; each board with its stand-ins (same kind, within 1 mm of thickness; a top follows its board's thickness). A family product (tap, radiator, edge banding) follows the metal and decor; none in that variant: Test reports it.
  - Floor tiles: tile, pattern, direction, origin, grout; Fit the origin (fewest small cuts). Small cuts red on their layer.
  - Back to the data. Changes stay in the browser; the room is rebuilt.
- Documents, Floor tiles: per layout, tiles whole, cut, small cuts; m² to buy with reserve; value. Test: every room tiled or set to none; every layout's tile in the library; small cuts (info).

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

**A room**: type = its kind (`kitchen`, `bathroom`, `wardrobe`, `bedroom`, `hall`, `living`, `vestibule`, `garage`, `boiler`); id = kind and archon's number (`kitchen_6`). Offset: the smallest corner of its floor area; size: its bounding box and the floor's height. Fields: `number` (archon's), `area` (floor area at the block faces, rectangles in its axes), `archonArea` (m², after plaster; reference only), `note` (where a wall-less border runs, why), `files` (its data files in room/: cabinets, scene, docs).

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
