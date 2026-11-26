# library

The outside world, once for the whole house: what is bought (products, shops) and how a material looks. Closed in itself:
it imports nothing; its types are the contracts of `types.js`.

| File / folder | What |
|---|---|
| `catalog.js` | `openCatalog()`: the catalog (`types.js: Catalog`) from the JSON files: a product by key, a group's products, a family's variants, materials, textures read once, shops |
| `catalog.json` | the catalog's index: the product groups, in order |
| `materials.json` | how each material looks: colour, surface, the 2D section fill |
| `shops.json` | the shops and workshops |
| `products/` | one file per product group |
| `textures/` | one image per file: a board's decor, a tile's face |
