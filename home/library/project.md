# Library

The outside world, once for the whole house: what is bought (products and shops) and the materials, as the shop and the maker give them. None of it is our decision; how we use a product is a node's settings.

- Two kinds of numbers, kept apart: the maker's (outer sizes, a frame's width, a cup's depth) are data in products/; shapes the maker does not give (a knob, a spout, a burner ring) are code in draw.js, never data.
- A set sold only together (a hinge with its plate) is one product, one price.
- A room names a product by key and repeats none of its data; a price changed once changes everywhere.

## Files

| File | Holds |
|---|---|
| library.js | the product groups, in order: one file each in products/ |
| products/*.js | one group's products, by key |
| shops.js | shops and workshops, by key |
| materials.js | how a material looks: colour, surface, 2D section fill |
| textures/*.js | one image each (a board's decor, a tile's face), by key |
| draw.js | code: how each kind of product is drawn, in the frame of its node (x, y, h), from its data and its place |

## Formats (all version 1; sizes in mm)

**library**: `groups`: the product groups' names.

**shops**: `shops`: key → {name, links}.

**products**: `products`: key → product:

| Field | Means |
|---|---|
| name | as the shop gives it (what one orders by) |
| spec | what it is, as bought |
| code, maker | the maker's model and name |
| unit, price | unit; price in zł gross per unit (null: unknown) |
| priceNote | where the price comes from, how sure |
| shop | a key of shops.js |
| links | [{name, url}]: maker's documents first, then shops |
| note | a remark on buying it |
| family, metal, code | variants: one family's products differ by `metal` (a material with finish `metal`) or `code` (a decor); a room's Finish takes the family member in its metal and its boards' decors |
| draw | the draw.js drawing (oven, microwave, fridgeFreezer, dishwasher, hob, hood, sink, coffeeMachine, basin, basinTap, mirror, wallCabinet, showerScreen, linearDrain, shaped); none: not drawn |
| shape | for `shaped`: the parts in the product's axes (u along its width, v out of the wall, h up from its bottom): box {b}, cyl {at, ax, r [top, bottom], h, s}, tube {p, r, s}, loft {M: rows u, v, h; sec: superellipse sections}; m: material, `metal` (the room's fittings) or `ceramic`; l: layer (sanitary, installations); fit: u or h, a part as long as the fixture's length or height in the scene (a pipe); mv: a part of the product's door {at [u, v] hinge, angle (°), sign} |

By group:

| Group | Fields |
|---|---|
| appliances | body (overall: an oven or microwave without fascia, a fridge or dishwasher with doors, a sink's outline on the worktop); fascia (oven, microwave front; bottom: from the body's bottom); door (hinge edge, height); doors (fridge and freezer, from the bottom), doorDepth; controlPanelHeight, controlColumnWidth (fascia parts that do not open); baseSetback; bowl, rim, wall (sink); glass (hob); chimney (hood); source ("assumed": to check) |
| boards | code, decor (maker's); thickness; length, width (sheet as bought; missing: the editor shows ?); color; core (bare edge colour); coreSurface (`chipboard` or `fibre`); lacquered; frameWidth (shaker front); depth (worktops, end panels); factoryEdges; twoSided; texture (textures/ key). Sold by the metre (PVC plinth): unit m, no sheet size |
| hardware | as drawn: handle length; leg radius, footRadius, footHeight; hinge cupDepth; drawer runnerWidth, sideThickness, sideFromCarcass, fromBack, fromFront; grille width, height |
| sanitary | as drawn: body; basin wall, shelf; tap height, spout; screen fixed panel, door |
| tiles | 8 mm thick, all (room/tiles.md); look, finish, texture; len × wid, joint; minCut (smallest acceptable piece [along, across]); pattern (maker's default: grid, half, third, quarter, random); formats (sizes made) |

**materials**: `materials`: key → look:

| Field | Means |
|---|---|
| color, roughness, metalness, opacity | the surface; opacity for glass |
| reflect | strength of the sky's reflection |
| clearcoat, clearcoatRoughness | lacquer over the colour |
| emissive, glow | a light |
| finish, name | `metal`: a metal offered by Finish, by its name |
| texture, grass, slabs, wood, image | at most one generated surface: plaster grain {strength, grain, tile}; grass {tile}; paving {size, joint}; boards cut from a decor {decor, board, vertical}; a decor photo {key, turn} |
| plan | 2D section fill: a colour, or hatch [ground, line]; none: color |

**texture**: name; kind (wood, stone); source (image origin, grain direction); size (mm one image covers [along grain or length, across]); grout (joint colour); faces (images as data URLs).
