# House

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

The house "Dom w papawerach 5 (G)" from archon.pl, as built, and the main page of the project. The house is the root of the tree: it knows its floors and rooms, and it cuts a part of itself out for a room. Where the numbers come from: archon/analysis.md.

## Files

| File | Does |
|---|---|
| house.js | the house's data: its settings (the root of the cascade), what it is made of, its floors and their rooms |
| model.js | the house's data turned into solids: walls, slabs, roof, windows, doors, stair, site; the rooms in the house's axes and where two of them meet with no wall; a part of the house cut out for a room; the checks of the house. No browser |
| index.html | the main page: the whole house, or a part of it (`?room=kitchen_6`, `?room=bathroom_7,bathroom_5`), in 3D, 2D and Documents (its last sheet: Test) |

## How it fits together

```
house.js ─► model.js ─► solids ─► index.html: 3D, 2D (core)
                     ─► rooms, borders, a part of the house ─► index.html (later: the room engine)
                     ─► checks ─► Test
```

- **The whole house**: every solid, the doors turning on their hinges. The panel's tab View: the cut, then Floors (where: the floors and the roof) and Layers (what); a solid shows when its floor and its kind are both on. With the roof off the highest floor shown is open: its cut is under the floors, and a click on its floor picks a room (Open shows it alone).
- **A part**: the solids of its rooms, trimmed to each room's box: the floor area out to the far faces of its walls, from the slab under it to what closes it from above. Each wall, the floor and the ceiling is an object; a window or a door hides with the wall it sits in. An object the camera is beyond hides (it still casts its shadow), so the room is always seen from inside. The floors (and the roof) do not apply to a part: it is always drawn, only the elements switch. The light is the house's light for an interior.
- **The menu** (top left): the house, each floor with its rooms.
- **2D**: one sheet per floor (of a part: per floor of its rooms): what the cut meets filled, what lies under it seen from above, the doors' swings, the openings' labels, the rooms with their areas, a dash-dot line where two rooms meet with no wall.
- **Documents**: the rooms (the model's area and archon's), the inner doors with what is bought for them, the notes.
- **Test** (the last sheet of Documents): the tree, the house, the library, the rooms' furniture; a room asked for that the house does not have.
- **Elements** (a sheet of Documents): the tree of what is shown, the house (or the rooms of a part) down to its floors, rooms and their furniture; each node with its offset in its parent and its size; closed at first, a + opens a node. Test is a tree too, open at first.
- The rooms' floor tiles come with room/tiles.js.

## The format `house`, version 1

The file is the house's root node (core/project.md: the node) with the format, the version and these fields:

| Field | Means |
|---|---|
| settings.view | the view of the house: `layers` (the layers' tree, names), `floors` (where: the floors and the roof) and `elements` (what: the kinds of elements), the two blocks of Layers in the panel, `edges`, `light` (with `clouds`: how many by default, and at full clouds the sun's and the sky's factors and the shadows' blur; `inside`: the light of a part), `cameras`, `walk`, `cutFrom` and `cutStep` (the cut's slider over a floor), `planNote` (under the 2D sheets) |
| source, notes | where the geometry comes from; remarks for Documents |
| geometry | what the house is made of (below) |
| children | the floors |

**A floor** is a node of type `floor`: its offset's h is its level, its size's h its height (the top of its rooms). Its own fields: `inside` (the floor area inside the outer walls, rectangles `[x1, x2, y1, y2]`, in the floor's axes), `other` (areas that are no room: the stair), `settings.view` (`cameras`, relative to its level; `cut`: where its 3D cut starts; `plan`: the height of its 2D cut). Its children are its rooms.

**A room** is a node whose type is its kind (`kitchen`, `bathroom`, `wardrobe`, `bedroom`, `hall`, `living`, `vestibule`, `garage`, `boiler`) and whose id is the kind and archon's number (`kitchen_6`). Its offset is the smallest corner of its floor area, its size the box around it and the floor's height. Its own fields: `number` (archon's), `area` (its floor area at the block faces, rectangles in the room's axes), `archonArea` (m², archon's, after plaster: a reference only), `note` (where its border runs with no wall, and why).

**geometry** (mm, the house's axes: x along the house, 0 the garden's outer face; y across, 0 the left outer face; h up, 0 the finished ground floor):

| Field | Means |
|---|---|
| split | the height between the ground floor and the attic |
| length | the house's length |
| roof | pitch, eave, width, thickness (across the slope), x (its length), faces (the material of each side), cap, cuts, layers, windows (id, name, label, x, y), windowFrame, clearHeights (the lines drawn under the roof in 2D) |
| kinds | of elements: name, material, cap (the section's colour), thickness (checked), layers; `opened`: openings are cut out of it; `host`: windows and doors sit in it; `walkable`: the walk stands on it; `finish`: the facade layer that switches its finish; `raw`: its bare material; `floor`: the floor layer it belongs to when not the one its height gives (the attic's ceiling: the roof) |
| elements | the boxes of the analysis: id, kind, `b` [x1, x2, y1, y2, h1, h2]; `top: "roof"`: under both roof planes; `below`: lines it stays under; `cuts`: ids of elements or voids taken out of it; `floor`: as a kind's; `outer`: the side facing the air (−x garden, +x front, −y left, +y right, −h down) |
| voids | boxes taken out of the elements that name them (the stair void) |
| openingKinds | what is drawn in an opening: `glazed` (frame, bars, glass; `sill`), `leaf` (a solid leaf), `door` (an inner door of frames.doors), `passage` (the floor runs through) |
| openings | boxes cut out of every opened element they cross: id (the kind and the rooms it opens into: `door_hall_3_bathroom_7`, `window_kitchen_6_fixed`), kind, label (archon's width/height), `b`, outer, cols, transoms, below, leaf; an inner door: `hinge` (the jamb it turns on), `opens` (toward which side), `product` and `extras` (what is bought for it) |
| frames | the frames, bars and glass of windows; `doors` (an inner door's frame, leaf and handle); `leaves` (a gate's and the entrance's leaf, grooves, handle) |
| finishes | the facade: which material covers which part of an EPS box, by its outer side, a region (x, y, h; a missing range or a null end: no limit) and lines; a later rule wins |
| stair | risers, the tread's thickness, material, layers, walkable, flights (x, y, the first riser, the count) |
| site | the lawn (rect, h, depth; `aroundBuilding`: it gives way to the house) and the surfaces on it (name, rect, h, material) |
| part | what a part of the house takes: the element kinds, the fixtures (frames, glass, doors), the roof |
| line | `{h, y, pitch}`: the line h + pitch · tan(roof pitch) · (y′ − y) across the house |

## Checks

The tree; every element, opening, roof window and void has its own id; every element's thickness by its kind; no two solids share volume (the site, frames and glass included); no floor area without a room; no two rooms overlap; the rooms' areas against archon's (to know, not a fault).
