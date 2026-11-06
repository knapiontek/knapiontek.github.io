# House 3D project

> Written and edited by hand. An LLM does not change this file. No code details here: names of functions, variables, data keys and formats live in the code itself.

How the files of this folder work together. The house is "Dom w papawerach 5 (G)" from archon.pl; the page shows it in 3D with the floor tiles laid in every room.

## Files

| File | Kind | Owns | Written by |
|---|---|---|---|
| house.js | data, this project | the tree: building (shell, wall kinds, build-ups, facade, windows, doors, site, light, cameras, layers, tile layouts) → floors (walls, openings, stair, fireplace, stair hole) → rooms (areas, layout, link to a sub-project) | LLM, per project |
| materials.js | data, this project | the material library and the tile products (texture, size, joint, price, link) | LLM, per project |
| textures.js | data, this project | texture images and their names only (the floor tiles, the wood decor of the facade), with what drawing them needs: the size an image covers, the grout colour of a tile | LLM, per project |
| view.html | page, every project | the 3D view, the walk through the house, the tile layouts and their counts, the 2D plan, the layers, the checks | LLM |
| rules.md | text | what the page must do and how the model is organised | by hand |
| project.md | text | this description | by hand |
| index.html | page | directory listing of the repository folder (not part of the house) | by hand |

## Data flow

```
  house.js      ──┐
  materials.js  ──┼──► view.html     reads the three files, builds the model, draws it
  textures.js   ──┘                  the 3D view and the 2D plan come from the same model

  view.html writes nothing back; the viewer's choices (tiles, offsets, layers, sun, cut) stay in the browser
  rooms with a link open their sub-project (../kitchen, ../bath) in its own page
```

- view.html loads the data files directly, so the page also works opened from disk.
- house.js says where things are and what they are, materials.js what they are made of. A wall names its kind, the kind names its build-up and material; a room names its layout, the layout its product; every node names its layers.
- view.html does not know this house: it has no numbers, names, products or colours of it. Everything it draws and every text about the house comes from the data files.

## What is project specific and what is not

- **Project specific:** house.js, materials.js, textures.js.
- **Every project:** the code of view.html. A new house gets new data files; view.html stays.

## Walls

- Every wall has a kind; the wall kinds of house.js say its surfaces, its build-up, which kind owns an overlap and how high it goes.
- A **build-up** lists the layers of a wall: the core (block) and the layers that lie on every side facing outside (EPS). A wall is as thick as its core plus the outer layers of each side that faces outside.
- This house: walls of blocks 24 cm and 12 cm; the outer walls (ground floor, gables, knee walls) are block 24 cm with 20 cm of EPS on the outside, 44 cm in all; the portal wings 64 cm; interior walls are block 24 or block 12.
- The outer faces of the outer walls are where the plan images put them; a change of thickness moves the inner face.
- The EPS is the part of a wall within 20 cm of the air. So a house wall has it on its outer side, a portal wing on both sides and on its end, and at a corner EPS meets EPS and block meets block, with no extra pieces.
- The 2D plan draws the EPS hatched, the 3D view shows it in the cut of the walls.
- An opening names the wall kind it sits in and has that wall's thickness.
- The page checks every wall and opening against its build-up and lists the ones that do not fit. A wall that fits no build-up stays in house.js as measured and stays on that list until it is resolved by hand.
- The portal (the side walls and the roof running past both gables) has one section: EPS 20 + block 24 + EPS 20 = 64 cm. The block of a wing is in line with the block of its side wall; the roof slab has the thickness of the wings. One section everywhere, no patches where wing and roof meet.
- The chimney and the stair rail have no build-up.
- The facade finish (plaster, graphite, wood) is the outer centimetre of the wall itself, never a piece stuck on in front of it: the outline of the house stays the outline of the walls.

## Floors and tiles

- A tile product brings its texture, size and joint; the layout chooses only the product, pattern, direction, grout colour and offsets.

- The rooms cover the whole floor between the walls; a passage without a door (the wall gaps from the bedroom to its wardrobes) belongs to a room. The page lists any floor that no room covers.
- Rooms of one layout that meet with no wall between them are one floor for the tiles: a tile across their border is one piece.
- The tiles of a room run on through its doorways: each half of the door depth belongs to the room on that side, so two floors meet under the door leaf. Cuts are judged in the room; a piece only under a door is no sliver.

## Checks

- Wall thicknesses against the build-ups (list on the page).
- Floor that no room covers (list on the page).
- Tile layouts: small cut pieces are shown red (layer) and counted; the tile count assumes every cut piece takes a tile of its own.
- The page shows only hard data: what was measured or chosen. Where the plan images leave something open, the data says so in a comment, not by a guess in the code.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows, no abbreviations a reader has to decode; counters and coordinates may be one letter.
- No hidden rules: what gets built follows from the kinds, build-ups and settings in the data files. No guessing from names, labels, positions or sizes.
- No numbers of this house in the code and no duplicated values: a value lives in one data file, others refer to it (an opening names its wall kind, a room its layout).
- A list or an array holds homogeneous values: the same type and meaning.
- Library versions pinned (deterministic pages).
- Language: everything the pages show is Polish; code and comments are English.
- Short comments that say why, not long narration.
- No backward compatibility code: when the format changes, the data files are migrated and the stored browser state is dropped.
- This file is kept up to date by hand.
