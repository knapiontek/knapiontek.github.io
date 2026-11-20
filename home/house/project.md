# House

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

The house "Dom w papawerach 5 (G)" from archon.pl, as built, and the main page of the project. The house stands in its site (the root of house.js): it knows its floors and rooms, and it cuts a part of itself out for a room. Where the numbers come from: archon/analysis.md.

## Files

| File | Does |
|---|---|
| house.js | the house's data: its settings (the root of the cascade), what it is made of, its floors and their rooms |
| model.js | the house's data turned into solids: walls, slabs, roof, windows, doors, stair, site; the rooms in the house's axes and where two of them meet with no wall; a part of the house cut out for a room; the checks of the house; the menu of the house's pages. No browser |

## How it fits together

```
house.js ─► model.js ─► solids ─► index.html: 3D, 2D (core)
                     ─► rooms, borders, a part of the house ─► index.html (later: the room engine)
                     ─► checks ─► Test
```

- **The whole house**: every solid, the doors turning on their hinges. The panel's tab View: Floors (where: the floors and the roof) and Layers (what); a solid shows when its floor and its kind are both on. With the roof off the highest floor shown is open (its own cameras join the house's).
- **The active room**: always one, the panel's (its name the panel's title): picked in the floors' menus (top left), kept in the browser; at first the first furnished room. **House** or **Room** (top left, before the floors): the whole house, or its walls cut to the active room; picking a room in the whole house keeps the view, in a room's view shows that room. The panel's heading is what is shown: the house, or the room (a room's view, Cabinets); in the house's 3D the active room under it. View and Finish are 3D's (none in 2D, Documents, Cabinets): View, the house's layers and the active room's furniture (in the whole house too: a furniture layer switches that kind in every room); Finish, the active room's (every room has one: what is not there yet says so). The cameras are the view's (the house's, or the room's own); Walk: the whole house only; Open / Close: always.
- **A part**: the solids of its rooms, trimmed to each room's box: the floor area out to the far faces of its walls, from the slab under it to what closes it from above. Each wall, the floor and the ceiling is an object; a window or a door hides with the wall it sits in. An object the camera is beyond hides (it still casts its shadow), so the room is always seen from inside. The floors (and the roof) do not apply to a part: it is always drawn, only the elements switch. The light is the house's light for an interior.
- **The menu** (top left): the house, each floor with its rooms; the same on every page of the house (the editor too), made by model.js from house.js.
- **2D**: one sheet per floor (of a part: per floor of its rooms): what the cut meets filled, what lies under it seen from above, the doors' swings, the openings' labels, the rooms with their areas, a dash-dot line where two rooms meet with no wall. The whole house has its dimensions as in CAD on every side: a chain through the openings of that side's walls, then the whole; a part, its overall sizes. A furnished room's appliances show as their nodes' boxes (cut: grey, seen: an outline), the sink and the hob as seen from above. The wheel zooms about the cursor, a drag moves the sheet.
- **Documents**: the whole house, the rooms (the model's area and archon's), the inner doors with what is bought for them (each door one, by its own name and place: no quantity), the notes; a room's view, its own (a furnished room's estimate, cut list, assembly cards and notes: room/docs.js); both then Elements and Test.
- **Open** (the menu, 3D): one button: every moving part (the doors of the house and of the furniture, the drawers, a shower's door) opens; it is then Close.
- **Test** (the last sheet of Documents): the tree, the house, the library, the rooms' furniture; a room asked for that the house does not have.
- **Elements** (a sheet of Documents): the tree of what is shown: the site, the house down to its floors and rooms; a room's view, its rooms down to their furniture; each node with its offset in its parent and its size; closed at first, a + opens a node. Test is a tree too, open at first.
- **The floor tiles** (room/tiles.js): one layout for each node that sets `settings.tiles` (a floor: its product, direction, pattern and grid's origin; a room that sets its own origin: a layout of its own), over the rooms that take them from it; a slab 12 mm deep from the tiles' face down into the floor, its edges closed, the grout 2 mm under the face (as a wall's tiles), the face drawn ahead of what lies close behind it (no flicker from afar); rooms of one layout that meet with no wall are one zone, a tile runs across the line, and the floor runs on through a door. The panel's tab Finish (3D), the same for every room, in the house's view and in a room's: the picked room (a room's own view: that room); Furniture: the metal of all its fittings (one), each of its boards with its stand-ins (the boards of its kind within 1 mm of its thickness; a top follows its board's thickness), Back to the data: kept in the browser, the page built again; a product of a family (a tap, a radiator, an edge banding) follows the metal and the decor, else Test reports it. Floor tiles: the tile, the pattern, the direction, the origin, the grout, Fit the origin (the fewest small cuts), Back to the data; the small cuts red with their layer. The viewer's changes stay in the browser. Documents: the sheet Floor tiles (each layout as laid: tiles whole, cut, small cuts; the m² to buy with the reserve, the value); Test: every room tiled or set to none, every layout's tile in the library, the small cuts (to know).

## The format `house`, version 3

The file's root node (core/project.md: the node) is the **site**, with the format and the version: its zero the corner of its lawn, its fields `lawn` (`rect` [x1, x2, y1, y2], `h` its top, `depth`, `material`, `aroundBuilding`: it gives way to the house), `surfaces` (`rect`, `h`, `material`), `layers`, `walkable`, all in the site's axes. Its child is the **house**: its offset where the house stands in the site (its h below the lawn: the only negative number), and these fields:

| Field | Means |
|---|---|
| settings.view | the view of the house: `layers` (the layers' tree, names), `floors` (where: the floors and the roof) and `elements` (what: the kinds of elements), the two blocks of Layers in the panel, `edges`, `light` (with `clouds`: how many by default, and at full clouds the sun's and the sky's factors and the shadows' blur; `inside`: the light of a part), `cameras`, `walk`, `planNote` (under the 2D sheets) |
| settings.tiles | the floor tiles' common settings: `reserve` (for cuts, the part added to what is bought), `top` (mm over the floor: the tiles' face), `grout` (mm over the floor: the grout's face, under the tiles'), `depth` (the slab of tiles with its glue, from its face down into the floor), `layers` (the tiles' layers), `small` (the layer that shows a small cut red) |
| source, notes | where the geometry comes from; remarks for Documents |
| geometry | what the house is made of (below) |
| children | the house's parts, by what belongs to what: `foundation`, the floors (`ground`, `attic`), `facade` (the insulation), `roof`, `stair` |

**The tree of the house.** Every element is a node, placed from its parent's zero; the house's zero is its extreme corner (the left wing's insulation, the garden's insulation, the bottom of the footings), so every part of the house lies in positive numbers. What belongs to what:

- `foundation` (an assembly): footings, foundation walls, the chimney's foundation, the ground slabs;
- a floor: its walls (blocks, the chimney, balustrades), its ring beams and the slab over it, then its rooms; an opening (window, door, gate) is a node of the wall it is in, placed from the wall's origin;
- `facade` (an assembly): the EPS of the walls and the soffit;
- `roof` (an assembly): its planes (its fields: pitch, eave, width, thickness, x, faces, cap, cuts, layers, windowFrame, clearHeights), the attic's ceiling and the loft walls, its roof windows (`roofWindow`: place, label);
- `stair` (an assembly): its flights (fields: risers, tread, material, layers, walkable, flights) and its void (`void`, of boxes `voidBox`).

An assembly stands at the house's zero with the house's size; a floor at its level. An element's type is its kind; its own fields: `top: "roof"` (under both roof planes), `below` (lines it stays under), `cuts` (ids of elements or voids taken out of it), `floor` (as a kind's), `outer` (the side facing the air: E the garden, W the entrance, N, S, down). An opening's: label (archon's width/height), outer, cols, transoms (heights), below, leaf; an inner door: `hinge` (the jamb it turns on: E, W, N, S), `opens` (the side it opens toward), `product`, `extras`.

**A floor** is a node of type `floor`: its offset's h is its level, its size's h its height (the top of its rooms). Its own fields: `inside` (the floor area inside the outer walls, rectangles `[x1, x2, y1, y2]`, in the floor's axes), `other` (areas that are no room: the stair), `settings.view` (`cameras`; `plan`: the height of its 2D cut over the floor). Its children are its walls and slabs (above) and its rooms.

**A room** is a node whose type is its kind (`kitchen`, `bathroom`, `wardrobe`, `bedroom`, `hall`, `living`, `vestibule`, `garage`, `boiler`) and whose id is the kind and archon's number (`kitchen_6`). Its offset is the smallest corner of its floor area, its size the box around it and the floor's height. Its own fields: `number` (archon's), `area` (its floor area at the block faces, rectangles in the room's axes), `archonArea` (m², archon's, after plaster: a reference only), `note` (where its border runs with no wall, and why).

**Floor tiles** (`settings.tiles` of a floor or a room): `product` (a tile of the library), `dir` (x or y: the tiles' length along it), `pattern` (grid, half, third, quarter, random; none: the product's), `origin` ([x, y] in the node's axes: where a tile's corner lies; the grid runs from it both ways). A room takes the tiles of its floor; a room that sets them has its own layout (an origin of its own: the rest from its floor); `null`: no tiles (the room's own project lays its floor: the bathrooms; the garage).

**geometry**, what the elements are made of and how they are drawn. Every number of a node's own fields is in that node's axes, from its zero (mm: x along the house, y across, h up): the house's geometry and views in the house's; a floor's areas and cameras in the floor's; the roof's planes and the stair's flights in theirs; an element's or an opening's lines (`below`) and transoms in its own:

| Field | Means |
|---|---|
| split | the height between the ground floor and the attic |
| body | the main body along x [x1, x2] (without the wings) |
| kinds | of elements: name, material, cap (the section's colour), thickness (checked), layers; `opened`: openings are cut out of it; `host`: windows and doors sit in it; `walkable`: the walk stands on it; `finish`: the facade layer that switches its finish; `raw`: its bare material; `floor`: the floor layer it belongs to when not the one its height gives (the attic's ceiling: the roof) |
| A door's own fields | `hinge` (the jamb it turns on), `opens` (the side it opens toward), `flush` (the side where the leaf is flush with the wall: the hall's; toward a hall, then a vestibule, the living room, a bedroom) |
| openingKinds | what is drawn in an opening: `glazed` (frame, bars, glass; `sill`), `leaf` (a solid leaf), `door` (an inner door of frames.doors), `passage` (the floor runs through), `layer` (windows or doors) |
| frames | the frames, bars and glass of windows; `doors`: an inner door, hidden (every one alike): `frame` (the frame's width on the half of the leaf's depth toward which it opens), `stop` (its width on the other half), `gap`, `bottom` (the gap at the floor), `depth` (the leaf's), `angle` (open), the materials, the handle; the leaf is flush with the wall on the door's `flush` side, stepped against the frame so no light passes; `leaves` (a gate's and the entrance's leaf, grooves, handle) |
| finishes | the facade: which material covers which part of an EPS box, by its outer side (E, W, N, S), a region (x, y, h; a missing range or a null end: no limit) and lines; a later rule wins |
| part | what a part of the house takes: the element kinds, the fixtures (frames, glass, doors), the roof |
| line | `{h, y, pitch}`: the line h + pitch · tan(roof pitch) · (y′ − y) across the house |

## Checks

The tree (to know: what lies below the house's zero: nothing); every element, opening, roof window and void has its own id; every element's thickness by its kind; no two solids share volume (the site, frames and glass included); no floor area without a room; no two rooms overlap; the rooms' areas against archon's (to know, not a fault).
