# Kitchen project

How the files of this folder work together. `rules.md` holds the kitchen rules; this file holds the structure of the code.

## Files

| File | Kind | Owns | Written by |
|---|---|---|---|
| `data.js` | data, this project | materials, rules, notes, columns, components | design.html (Export) |
| `rules.md` | text, every project | the kitchen rules, written for people and for an LLM starting a new project | by hand |
| `engine.js` | code, every project | the model: carcasses, boards, fronts, frames, panels, plinths, worktops, checks | by hand |
| `design.html` | page, every project | editing the tables, the elevation drawing | by hand |
| `cost.html` | page, LLM generated | prices, cutting lists, notes, assembly help | LLM, per project |
| `view.html` | page, LLM generated | the 3D view of the room and its geometry check | LLM, per project |
| `project.md` | text | this description | by hand |

## Data flow

```
                 data.js  (global, one per project)
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

- `data.js` is global: one file, loaded by every page with `<script src="data.js">`.
- Only `design.html` changes it (Import / Export). `cost.html` and `view.html` only read it.
- `engine.js` does not know where the data comes from. A page hands it the project and gets the model back. The engine has no project numbers and draws nothing.
- `cost.html` and `view.html` each keep their own JSON block at the top of the page (`#cost-data`, `#view-data`). It adds what only that page needs: prices and notes, or room, lights and appliance sizes. It never repeats a value from `data.js`; a value that both need belongs in `data.js`.

## What is project specific and what is not

- **Project specific:** `data.js` (its notes, columns and components are this kitchen's geometry), and the JSON blocks of `cost.html` and `view.html`.
- **Every project:** `rules.md`, `engine.js` and `design.html`. They hold no numbers or names of this kitchen; every value comes from `data.js`.
- A new kitchen starts from `rules.md`: write a new `data.js` in `design.html`, then let an LLM generate `cost.html` and `view.html` for it.

## Modules

### data.js
Plain JSON after `window.KITCHEN_DATA =`, written so a person can read and edit it:
- `rules.materials`: what you buy. Name, thickness, colour (none = oak texture), lacquered, core (colour of a bare cut edge: chipboard, and the board of the lacquered parts, whose back and ends are not lacquered), depth by group role, and `types`: the component types made of it. Carcass parts take the material their rule names (`carcass.material`, `back.material`, `drawers.material`, `rails.hobPanelMaterial`).
- `rules`: construction values (setbacks, gaps, overhang, hinges, shelves, drawers ...).
- `notes`: `[name, description, details]`; `group N` notes give each group its role (worktop, tall, island).
- `columns`: column widths per group, integer mm.
- `components`: one per line, empty fields left out: `g` group, `c` first column, `s` span, `tags`, `k` carcass name, `h` height, `hd` handle, `hg` hinge side, `gaps`, `note`.

### engine.js
Deterministic: the same project gives the same model.
- `build(project)` returns the model: carcasses, boards, fronts, frames, panels, plinths, worktops, plasterboard, counts, thicknesses, `materialFor` (type or part → material code) and `warnings`.
- Checks the data and reports problems as warnings instead of failing: one type per component, tags allowed on their type, every board type in one material, sizes matching their material, hinge and handle sides ...
- Marks the ABS edges of each board and panel (`edges`: side and length); the pages list them, nothing else decides where ABS goes. A panel gets ABS on each edge next to a front that opens (a door, a drawer, an appliance door; not a fixed front), found from the neighbouring components.
- Closes a filler that belongs to a carcass (it has a carcass name: a hole in the front, e.g. the hidden end of an L corner) with a `Filler cover`: a board in the carcass material in the front plane, without ABS.
- Adds an ortho panel (a carcass-material board `hinges.supportDepth` deep at the front, as high as the door) when a hinged door does not reach a carcass side on its hinge side.
- Fixes the lacquered edges of the finished parts (`LACQUERED_EDGES`, long and short edges of one piece): fronts all round (2 long + 2 short), frames 1 long side (the front edge, `lacqueredSides`), plinth none. It follows from how the kitchen is seen (front and top; the island from all sides), so it lives in the engine, not in `data.js`. Each front, frame and plinth carries it as `lacquer`; `cutList` returns it after the ABS edges, and the pages show one column, ABS/Lacquer ("4", "1 long", "1 long + 1 short"; nothing = no finished edge).
- Prints the place of a component as `G1[4]` (group 1, column 4) or `G1[1-11]` (columns 1 to 11) with `placeLabel`: warnings, lists and tooltips in every page use it. The data keeps `g`, `c`, `s`.
- Coordinates per group: `u` along the group, `v` up from the floor, `n` out from the wall; a box is `[u0, u1, v0, v1, n0, n1]`.

### design.html
Deterministic, and agnostic of the project and of its data: it knows the format, not the kitchen.
- Tables: Materials (read-only), Groups & Columns, Components, Notes.
- The tables become a project, the engine builds the model, and the page draws the elevations as SVG.
- Problems are listed under the tables; Import / Export messages appear under the buttons.

### cost.html (LLM generated)
Uses `data.js` and the engine model to estimate prices, list the boards to cut and edge, and help with assembly. Its `#cost-data` JSON holds prices, items, notes and page settings; texts refer to the model through placeholders (`{n:count}`, `{r:rule.path}`, `{t:type}`, `{m:type}` ...), never through copied numbers.

### view.html (LLM generated)
Uses `data.js` and the engine model to render carcasses, fronts, frames, appliances and the room around them: walls, window, floor, lamps. It checks the geometry (overlaps, gaps, fronts off the line, parts sticking out) and lists the issues. Its `#view-data` JSON holds the room, lights, appliance and hardware sizes, used only for drawing.

## Types, tags, materials

- **Material**: what you buy (a board with its thickness and colour).
- **Type**: what a component is and how it is used. One per component. The type drives the engine and the pages: it decides what gets built (a carcass, a front on a door or on an appliance, a frame, a worktop ...).
- **Tag**: a special case of a type (`sink`, `hob`, `bins`, `inner`, `coffee`, `fall`). It adds a feature to the same build, and each tag is allowed only on some types. Pages use tags to render or handle that feature.

A new feature that changes what gets built is a new type; one that adds to an existing build is a tag.

## Code style (every file)

- Human readable: consistent indentation, short functions, one idea per line.
- Meaningful names that match what the page shows (Type, Hinge, Materials ...), no abbreviations a reader has to decode.
- No hardcoded project numbers or duplicated values: every number comes from `data.js` or from the page's own JSON.
- Short comments that say why, not long narration.
- No backward compatibility code: when the format changes, `data.js` is migrated.
- Every change keeps `rules.md` and this file up to date.
