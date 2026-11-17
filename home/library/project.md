# Library

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done.

The outside world, once for the whole house: what is bought (products, boards, tiles, appliances, hardware, fasteners, sanitary ware, building materials and services, with the shops) and the materials (plaster, glass, lawn, a decor), none of it our decision. A product is described as the shop and the maker give it: what it is, its sizes, its price and where it comes from. Nothing of how we use it (that is a node's settings) and nothing of how it is drawn (that is the code that draws it). Data only.

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

and, by group:

| Group | Fields |
|---|---|
| appliances | body: the overall size (an oven or a microwave without its fascia, a fridge or a dishwasher with its doors, a sink's outline on the worktop); fascia: the front panel of an oven or a microwave, bottom: where it starts from the body's bottom; door: hinge (the edge it turns on), height; doors: a fridge's and a freezer's doors from the appliance's bottom, doorDepth; controlPanelHeight, controlColumnWidth: the part of a fascia that does not open; baseSetback: how far behind the front the base starts; bowl, rim, wall: a sink's; glass: a hob's; chimney: a hood's; source: where the sizes come from ("assumed": still to check) |
| boards | code and decor (the maker's), thickness, color, core (the colour of a bare edge), lacquered, depth (worktops, end panels), factoryEdges, twoSided, texture (a key of textures/) |
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
| texture, grass, slabs, wood, image | one generated surface at most: plaster grain {strength, grain, tile}; grass {tile}; paving {size, joint}; boards cut from a decor {decor, board, vertical}; a decor photo {key, turn} |
| plan | the fill of its section in 2D: a colour, or hatch [ground, line]; without it, color |

**texture**: name; kind (wood, stone); source (where the image comes from, the grain's direction); size: the mm one image covers [along the grain or the length, across]; grout: the joint's colour; faces: the images as data addresses.
