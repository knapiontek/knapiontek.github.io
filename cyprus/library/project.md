# library

The outside world, once for the whole house: what is bought (products, shops) and how a material looks. Closed in itself:
it imports nothing, draws nothing; its types are the contracts of `types.js`.

| File / folder | What |
|---|---|
| `catalog.js` | `openCatalog()`: the catalog (`types.js: Catalog`) from the JSON files: a product by key, a group's products, a family's variants, materials, textures read once, shops |
| `shapes.js` | `shapeOf(product, size?, options?)`: a product as parts (`types.js: Shape`) in its own axes, by its field `draw`; materials by key, or `metal` for the fittings' (Finish) |
| `catalog.json` | the catalog's index: the product groups, in order |
| `materials.json` | how each material looks: colour, surface, the 2D section fill |
| `shops.json` | the shops and workshops |
| `products/` | one file per product group |
| `textures/` | one image per file: a board's decor, a tile's face |

A product holds what is technical about it: its name, maker, spec, sizes and the maker's rules (how its parts are cut, where
it is drilled), the source of what it says, its links; and its price as last checked: `price`, `priced` (the month,
YYYY-MM; none: not known) and `shop` (a key of `shops.json`). Nothing else: no notes.
