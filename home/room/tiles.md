# Tiles: how they are laid

Rules for the tiler, in words. Every tile is 8 mm, laid on 4 mm of glue: 12 mm everywhere (the house's `settings.tiles` depth); a thicker tile is not used. Other numbers are not here: tile size, joint, smallest cut are the library product's; glue depth, reserve and layouts are in the data (the house's `settings.tiles`, a room's scene); counts in Documents. One mechanism (room/tiles.js) for the house's floors and a room's walls, floor and shower.

## 1. The tile and its layout

- **A tile is a product of a shop**: its picture, its size, its grout and the smallest cut it allows make one whole, and its link leads to that very product. A page chooses a product, never its parts.
- **The layout belongs to what is tiled** (a floor, a room, a wall, a shower): its pattern (a grid, a half, a third or a quarter offset, random), its direction (the tiles' length along it), the grout's colour, its origin.
- **The origin** is where the grid starts. Given in the data, it is kept. Without one: on a wall the rows start from the floor and the tiles are moved along the wall; on a floor the grid is moved to the origin with the fewest small cuts.
- **A small cut** is a cut piece narrower than the product's smallest cut. It is counted, and shown red in 3D while its layer is on, so the layout can be moved before a tile is cut.

## 2. On a wall

- The tiles with their glue are a slab against the wall (the blocks): their face stands off the wall by the slab's depth; no gap between the tiles and the wall.
- The slab's edges are closed from the wall to the face, round its outline and round every opening (a door, a window, a niche).
- **Corners:** at an inside corner one wall's tiles end short by the slab's depth and the other's run into the corner over them; at an outside corner the tiles run past the corner by the slab's depth, so the edge is covered.
- Under a sloping ceiling (the roof's underside) the tiles are cut along the slope; under a flat ceiling they stop at it.
- What stands on a tiled wall (a mirror, a radiator, a cabinet, a WC's frame behind it) is placed on the tiles' face, not on the blocks.
- A wall's tiles go with the wall: hidden when the wall is hidden (a room's view, the camera behind it; the layer Blocks), their edges too, and the edges of the tiles that run in under them.

## 3. On a floor

- The floor's tiles are one slab of the same depth over the whole floor of a layout (every room of it, through the doors): their face over the floor, the slab down into it; its edges only round its outline and round what stands on it, none where two rooms or two parts of a floor meet. Seen from below, the floor's tiles hide with the floor.
- The grout lies under the tiles' face, as on a wall.
- A house's floor takes its tiles from the node above that sets them (its floor), or sets its own (a room with an origin of its own: a layout of its own); a room with its own design (a bathroom) lays its own floor.

## 4. A casing and a shower

- **A casing** of plasterboard (round a riser, a WC's frame) is tiled on its outer faces and in its openings' reveals (a niche: its back, its sides, its sill); its tiles go with the casing (the layer Built in).
- **A shower** has a zone of its own: its walls, and its floor if it is given one, may take another tile and another layout than the room's; without one the room's floor runs on into the zone, one grid. Its floor falls to its drain; the drain's grate lies in the tiles' face.

## 5. Counting and buying

- For each layout: the whole tiles, the cut ones, the small cuts, the area. What is bought is the area with the reserve for cuts (the price is per square metre).
- The Documents list the tiles of each surface with the product's link and its price.
