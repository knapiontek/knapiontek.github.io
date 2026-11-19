# Library

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

The outside world, once for the whole house: what is bought (products, boards, tiles, appliances, hardware, fasteners, sanitary ware, building materials and services, with the shops) and the materials (plaster, glass, lawn, a decor), none of it our decision. A product is described as the shop and the maker give it: what it is, its sizes, its price and where it comes from. Nothing of how we use it (that is a node's settings).

How a product is drawn is code: draw.js, the same for every room. Two kinds of numbers, kept apart: the maker's (the outer sizes, a frame's width, a cup's depth) are the product's data, in products/; the shapes the maker does not give (a knob, a spout, a burner's ring) are made up from the product's look and live in draw.js with the code that draws them, never as data.

- A set that works only together (a hinge with its mounting plate) is one product, with one price.
- A room names a product by its key; nothing of the product is repeated in a room.
- A price changed once changes everywhere.

## Files

| File | Holds |
|---|---|
| library.js | the product groups, in order: one file each in products/ |
| products/*.js | the products of one group, by key |
| shops.js | the shops and workshops, by key |
| materials.js | how a material looks: colour, surface, the fill of its section in 2D |
| textures/*.js | one image each (a board's decor, a tile's face), by key |
| draw.js | code: how each kind of product is drawn (`HOME.draw`), in the frame of what holds it (x, y, h), from the product's data and the place the room gives |

## Formats

All version 1.

**library**: `groups`: the names of the product groups.

**products**: `products`: key → product. Every product:

| Field | Means |
|---|---|
| name | as the shop gives it (what one orders by) |
| spec | what it is, as bought |
| code, maker | the maker's model and name |
| unit, price | the unit and the price in zł gross per unit; null: unknown |
| priceNote | where the price comes from, how sure |
| shop | a key of shops.js |
| links | [{name, url}]: the maker's documents first, then the shops |
| note | a remark on buying it |
| family, metal, code | the same thing in other metals or decors: products of one family differ by metal (the colour it is sold in: a material with finish `metal`) or code (a decor); a room's Finish takes the family's one in its metal and its boards' decors |
| draw | which drawing of draw.js draws it (oven, microwave, fridgeFreezer, dishwasher, hob, hood, sink, coffeeMachine, basin, basinTap, mirror, wallCabinet, showerScreen, linearDrain, shaped); without it, nothing is drawn. shaped: by the product's shape |
| shape | the parts of a product as drawn, in its own axes (u along its width, v out of the wall, h up from its bottom): box {b}, cyl {at, ax, r [top, bottom], h, s}, tube {p, r, s}, loft {M (its rows u, v, h: the axes and the place), sec (superellipse sections)}; m: a material, metal (the fittings' finish) or ceramic (the product's); l: sanitary or installations; fit: u or h, a part as long as the fixture's length or height in the scene (a pipe); mv: a part of its door (the product's door: {at [u, v] its hinge, angle in degrees, sign}). From the prototype's bathrooms (work/proto_shapes.js): the radiator, the shower set, the WC bowl, the WC frame with its plate, the riser, the hatch; the attic's bath, its floor tap, the corner shower |

and, by group:

| Group | Fields |
|---|---|
| appliances | body: the overall size (an oven or a microwave without its fascia, a fridge or a dishwasher with its doors, a sink's outline on the worktop); fascia: the front panel of an oven or a microwave, bottom: where it starts from the body's bottom; door: hinge (the edge it turns on), height; doors: a fridge's and a freezer's doors from the appliance's bottom, doorDepth; controlPanelHeight, controlColumnWidth: the part of a fascia that does not open; baseSetback: how far behind the front the base starts; bowl, rim, wall: a sink's; glass: a hob's; chimney: a hood's; source: where the sizes come from ("assumed": still to check) |
| boards | code and decor (the maker's), thickness, length and width (a sheet as it is bought; missing where not known: the editor shows ?), color, core (the colour of a bare edge), coreSurface (what a bare edge shows: `chipboard`, its chips; `fibre`, an even fibreboard), lacquered, frameWidth (a shaker front's frame), depth (worktops, end panels), factoryEdges, twoSided, texture (a key of textures/). What is sold by the metre (a PVC plinth) is a board too, with unit m and no sheet size |
| hardware | as drawn: a handle's length; a leg's radius, footRadius, footHeight; a hinge's cupDepth; a drawer's runnerWidth, sideThickness, sideFromCarcass, fromBack, fromFront; a grille's width, height |
| sanitary | as drawn: body (the overall size), and by kind: a basin's wall, shelf; a tap's height, spout; a screen's fixed panel and door |
| tiles | look, finish; texture; len × wid of one tile, joint; minCut: the smallest acceptable cut piece [along, across]; pattern: the maker's default (grid, half, third, quarter, random); formats: the sizes the maker makes |

Sizes in mm.

**shops**: `shops`: key → {name, links}.

**materials**: `materials`: key → look:

| Field | Means |
|---|---|
| color, roughness, metalness, opacity | the surface; opacity for glass |
| reflect | the strength of the sky's reflection |
| clearcoat, clearcoatRoughness | a lacquer over the colour |
| emissive, glow | a light |
| finish, name | `metal`: one of the metals a room's Finish offers, by its name |
| texture, grass, slabs, wood, image | one generated surface at most: plaster grain {strength, grain, tile}; grass {tile}; paving {size, joint}; boards cut from a decor {decor, board, vertical}; a decor photo {key, turn} |
| plan | the fill of its section in 2D: a colour, or hatch [ground, line]; without it, color |

**texture**: name; kind (wood, stone); source (where the image comes from, the grain's direction); size: the mm one image covers [along the grain or the length, across]; grout: the joint's colour; faces: the images as data addresses.
