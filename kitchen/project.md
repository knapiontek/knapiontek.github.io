# Kitchen project

How the files of this folder work together. `rules.md` holds the kitchen rules; this file holds the structure of the code.

## Files

| File | Kind | Owns | Written by |
|---|---|---|---|
| `data.js` | data, this project | materials, rules, notes, columns, components | design.html (Export) |
| `rules.md` | text, every project | the kitchen rules, written for people and for an LLM starting a new project | by hand |
| `engine.js` | code, every project | the model: carcasses, boards, fronts, frames, panels, plinths, worktops, plasterboard, counts, checks | by hand |
| `design.html` | page, every project | editing the tables, the elevation drawing | by hand |
| `cost.html` | page, LLM generated | prices, cutting lists, notes, assembly help, carcass map | LLM, per project |
| `view.html` | page, LLM generated | the 3D view of the room and its geometry check | LLM, per project |
| `project.md` | text | this description | by hand |
| `index.html` | page | directory listing of the GitHub repository folder (not part of the kitchen) | by hand |

## Data flow

```
                 data.js  (one per project)
                    │
      ┌─────────────┼──────────────┐
      ▼             ▼              ▼
  design.html    cost.html      view.html        each page reads data.js
      │             │              │             and passes it to the engine
      └──────► engine.js ◄─────────┘
               build(project) → model
      │
      ▼
  Export → data.js                               only design.html writes data.js
```

- `data.js` is loaded by every page with `<script src="data.js">` (so the pages also work from `file://`).
- Only `design.html` changes it (Import / Export). `cost.html` and `view.html` only read it.
- `engine.js` does not know where the data comes from. A page hands it the project and gets the model back. The engine has no project numbers and draws nothing.
- `cost.html` and `view.html` each keep their own JSON block at the top of the page (`#cost-data`, `#view-data`). It adds what only that page needs: prices and notes, or room, lights, cameras and appliance sizes. It never repeats a value from `data.js`; a value that both need belongs in `data.js`.

## What is project specific and what is not

- **Project specific:** `data.js` (its notes, columns and components are this kitchen), and the JSON blocks of `cost.html` and `view.html`.
- **Every project:** `rules.md`, `engine.js`, `design.html`, and the code (not the JSON) of `cost.html` and `view.html`. The code holds no numbers or names of this kitchen; every value comes from `data.js`, the engine model or the page's JSON.
- A new kitchen starts from `rules.md`: write a new `data.js` in `design.html`, then let an LLM generate the JSON of `cost.html` and `view.html` for it.

## Modules

### data.js
Plain JSON after `window.KITCHEN_DATA =`, written so a person can read and edit it:
- `rules.materials`: what you buy. Name, thickness, colour (none = oak texture), lacquered, core (colour of a bare cut edge), depth by group role, and `types`: the component types made of it. Parts the engine adds take the material their rule names (`carcass.material`, `back.material`, `drawers.material`, `rails.hobPanelMaterial`).
- `rules`: construction values (setbacks, gaps, overhang, hinges, shelves, drawers ...). Every rule the engine reads must be present (`REQUIRED_RULES` in engine.js).
- `notes`: `[name, description, details]`; `group N` notes give each group its role (worktop, tall, island).
- `columns`: column widths per group, integer mm.
- `components`: one per line, empty fields left out: `g` group, `c` first column, `s` span, `tags` (type first, then its tags), `k` carcass name, `h` height, `hd` handle, `hg` hinge side, `gaps` [left, right, top, bottom], `note`.

### engine.js
Deterministic: the same project gives the same model. Read top-down:
1. **Vocabulary**: `TYPES`, `TAGS` (tag → the types it is allowed on), `FRONT_TYPES`, `BOX_TYPES`, `BOARD_TYPES`, `PART_RULES`, `CARCASS_FLAGS`, `openingOf` (how a front opens), `LACQUER`, `REQUIRED_RULES`. Every decision below is made from these tables, the item's type and tags, and `data.js` rules.
2. **Helpers**: `parseTags`, `placeLabel` (`G1[4]`, `G1[1-11]`), `countByHeight` (per-height tables).
3. **Checks that stop the build**: `checkRules` (materials, required rules). `build` throws when it finds one; design.html lists them first.
4. **Layout**: `stack` places the components in their columns (rule "Stacking"); `carcassAreas` joins the items of one carcass name.
5. **Build**, in this order: component checks → groups → carcasses (floor, base, type, flags, legs) → carcass boards (sides, bottom, top / rails, backs, fixed shelves, inset panels, shelves) → frames, back strips, panels (ABS from the neighbouring fronts), plinths, plasterboard → worktops → island back panel → fronts (hinge posts, hinges, drawer boxes).
6. **Lists and files**: `cutList`, `carcassMap` / `mapJSON`, `dataJS` / `fromDataJS`, `load`.

The model: `carcasses`, `boards` (each with `id`, `name`, size `a × b`, `material`, `box`, ABS `edges`), `fronts` (with `opening`, `hinges`, `drawer`, `lacquer`), `frames`, `panels`, `plinths`, `worktops`, `plaster`, `counts` (incl. `type` and `tag`: items per type / tag), `thickness`, `materials`, `materialFor` (type or part → material code), `roles`, `warnings` / `issues`.
Coordinates per group: `u` along the group, `v` up from the floor, `n` out from the wall; a box is `[u0, u1, v0, v1, n0, n1]`.

### design.html
Deterministic, and agnostic of the project: it knows the format, not the kitchen.
- Tables: Materials (read-only), Groups & Columns, Components, Notes. The type and tags of a component are picked from `KE.TYPES` and `KE.TAGS` (only the tags its type allows).
- The tables become a project, the engine builds the model, and the page draws the elevations (the modules) as SVG; hover shows front sizes and gaps. Drawing sizes and colours are in its `#design-config` JSON.
- Problems are listed under the tables; Import / Export messages appear under the buttons.

### cost.html (LLM generated JSON, generic code)
Uses the engine model to estimate prices, list the boards to cut and edge, and help with assembly. Its `#cost-data` JSON holds prices (each with the shop `links` it comes from), items, notes and page settings. Texts and quantities refer to the model through placeholders, never through copied numbers: `{n:count}` (`{n:type.oven}`, `{n:tag.bins}`), `{r:rule.path}`, `{t:use}` thickness, `{m:use}` material, `{w:group.depth}` worktop, `{v:var}`, `{p:item}` price, `{q:item}` quantity, `{block.m2|edge|cut|len|qty}` cutting-list totals.

### view.html (LLM generated JSON, generic code)
Uses the engine model to render carcasses, fronts, frames, appliances and the room around them: walls, window, floor, lamps. It checks the geometry (overlaps, gaps, fronts off the line, parts sticking out) and lists the issues. Its `#view-data` JSON holds where each group stands in the room (`runs`), the room, lights, cameras, appliance and hardware sizes, used only for drawing. The shapes of the appliances themselves (an oven door, a tap) are drawing details in the code.

## Types, tags, materials

- **Material**: what you buy (a board with its thickness and colour).
- **Type**: what a component is. One per component. The type drives the engine and the pages: it decides what gets built (a carcass box, a front, a frame, a worktop ...).
- **Tag**: an extra on a type (`dummy`, `sink`, `hob`, `bins`, `inner`, `coffee`, `fall`, `fridge`, `freezer`, `dishwasher`). It adds a feature to the same build, and each tag is allowed only on some types. Pages use tags to render or handle that feature.

A new feature that changes what gets built is a new type; one that adds to an existing build is a tag. Both go into the tables at the top of `engine.js` and into `rules.md`.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows (Type, Tag, Hinge, Materials ...), no abbreviations a reader has to decode.
- No hidden rules: what gets built follows from the type, the tags and the `data.js` rules, through the tables at the top of `engine.js`. No guessing from names, labels or sizes.
- No hardcoded project numbers or duplicated values: every number comes from `data.js`, the engine or the page's own JSON.
- Library versions pinned (deterministic pages).
- Short comments that say why, not long narration.
- No backward compatibility code: when the format changes, `data.js` is migrated.
- Every change keeps `rules.md` and this file up to date.
