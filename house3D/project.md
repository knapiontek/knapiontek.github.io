# Home

"Dom w papawerach 5 (G)" from archon.pl, as built, with everything that goes into it: the building, the kitchen, the two bathrooms, the walk-in wardrobes. One application in 3D, 2D, Test and Info; every part is an application of its own on the same layout.

- This file: the whole, how the folders depend on each other, the screen (Flow), the library. Each folder has its own project.md.
- Names of functions and data keys live in the code.

## Folders

| Folder | Holds | project.md |
|---|---|---|
| apps.js | the applications: name, page; the top-left menu reads it (planned) | — |
| core/ | the shared code: solids, meshes, the 2D plan, the screen, the spreadsheet; knows no project | [core](core/project.md) |
| library/ | everything bought: products, materials, textures; knows no project (planned) | — |
| house/ | the building: walls, slabs, roof, stair, windows, floor tiles; from the archon drawings | [house](house/project.md) |
| kitchen/ | the kitchen in the living room (ground floor) | [kitchen](kitchen/project.md) |
| bathroom/ | both bathrooms (ground floor, upstairs) | [bathroom](bathroom/project.md) |
| wardrobe/ | the three walk-in wardrobes upstairs (planned) | — |
| index.html | directory listing, not part of the application | — |

## Dependencies

One way only. Nobody depends on a sub-project.

```
            core/ ◄──────────────┬──────────────┬─────────────┐
              ▲                  │              │             │
 library/ ◄───┼──────────── house/ ◄──── kitchen/, bathroom/, wardrobe/
              │                  ▲
         apps.js                 └── the room: house/house-clip.js
```

- **core** knows no project and no product.
- **library** is data only: products, materials, textures.
- **house** knows core and the library.
- **A sub-project** (kitchen, bathroom, wardrobe) knows core, the library and the house: the house's data and engine, and house-clip.js for its room. The house wins: a sub-project never measures or moves its room.
- **apps.js** joins them: the top-left menu, and which files give a sub-project's solids.

## A sub-project in the house

The house view can show a sub-project's furniture (the kitchen in the living room) without knowing it. core defines the contract, the sub-project keeps it, apps.js joins them:

- **The contract** (core): a sub-project may give `solids(houseModel)`: its solids in house axes and mm, with layers, and its layer tree.
- **The sub-project keeps it** in one file used by both pages (kitchen/solids.js: engine.js + design.js + view.js → solids). Its own page draws the same solids: no copy, no fake.
- **apps.js** says which files give a sub-project's solids; the house page loads them and calls the contract. The word "kitchen" is nowhere in the house's code.
- **To look at, not to change**: in the house, the sub-project is one more group in Warstwy; a click opens its application.

## Sub-projects and their room

The kitchen and the bathrooms take their room from the house, never the other way round. house/house-clip.js does three things and nothing else:

1. **Trims** the house's solids (the element kinds house.js `copy` lists, the window frames and glass, the roof) to the box the room's link gives.
2. **Keeps** only what belongs to the room: walls standing on the edge of its floor area and the windows in them; the slab under it and the slab or roof over it, cut to that floor area and those walls.
3. **Groups** the solids as a person sees them: each wall, the floor, the ceiling, each window (with its wall).

Nothing is moved, scaled or re-measured: every solid handed over is part of a house solid, in house axes and mm. A sub-project draws its room with core, like the house, and copies its idea: the same screen (Flow), the house's names of rooms and openings.

## Flow

One application over all the projects: the house, the kitchen, the bathroom on the ground floor, the bathroom upstairs, the three walk-in wardrobes upstairs (a new project). Every project keeps its own page and data; they share one layout from core.

```
┌───────────┬───────────────────────────────────────────┬──────────────────┐
│ top-left  │                    top-right menu: [3D 2D │ right panel      │
│ menu      │                              Test Info]   │  [tabs]          │
│           │                main view                  │  Warstwy         │
│ Dom       │                                           │  Wykończenie     │
│ Kuchnia   │                                           │  …               │
│ Łazienki  │                                           │                  │
│ Garderoby │ bottom menu: cameras | SVG | XLSX     ☀ ? │                  │
└───────────┴───────────────────────────────────────────┴──────────────────┘
```

### Names and roles

Every part of the screen has one role. These names are used everywhere (docs, code, talk).

| Name | Polish | Role | Answers |
|---|---|---|---|
| **top-left menu** | lewe górne menu | the application: Dom, Kuchnia, Łazienki, Garderoby | where am I? |
| **top-right menu** | prawe górne menu | the mode: 3D, 2D, Test, Info | how do I look? |
| **main view** | główny widok | what the mode shows; direct work in it (orbit, a click opens a door, selects a carcass) | what do I see? |
| **bottom menu** | dolne menu | one-off actions of the mode: cameras in 3D, save SVG in 2D, save XLSX in Info; nothing stays set | what to do now? |
| **right panel** | prawy panel | the project's settings, in tabs; settings only, never information | how should it be? |
| **bottom-right panel** | prawy dolny panel | ☀ light, shared by all the applications; ? help | |

### Modes

- **3D**: the model; the cameras in the bottom menu (the house's go to every room, from above, the side, the front).
- **2D**: static, like a CAD drawing for the engineer: everything in one sheet, full lines what is seen under the cut, dashed what is over it, at the house's fixed cut height. Settings do not change it. Saved as SVG to print.
- **Test**: the checks (today's Analiza).
- **Info**: all the project's information, in parts, like cost.html: dimensions, project notes and materials, drawings (the bathroom vanity), carcasses, shopping, the estimate. Saved as XLSX. The spreadsheet of cost.html (editable cells, formulas, XLSX export) moves to core and knows no project.

### Right panel

Tabs at its top, one group at a time, no long scrolling; the same tab names in every application, each showing only what it has:

1. **Warstwy**, the first and most important: the layer tree and its presets, the cut, open/close all doors and drawers. What is seen and in what state.
2. **Wykończenie**: the style (realistic / drawing), then the project's choices: tiles, materials (the worktop …), handles, fittings.

### What each mode shows

What never means anything in a mode is not shown there. Dimmed (with the reason in a hint) only an exception: a setting that works in the mode but cannot right now (open all, while the fronts' layer is off).

| Mode | Right panel | ☀ | Bottom menu |
|---|---|---|---|
| 3D | Warstwy, Wykończenie | yes | cameras |
| 2D | none: the plan takes the whole width, like CAD | no | save SVG, zoom |
| Test | none | no | — |
| Info | Wykończenie (the tiles change the prices) | no | save XLSX |

? help is always there; it tells about the current application and mode.

### Bottom-right panel

- **☀**: a small floating panel: a compass (the plan of the house in the middle, the sun dragged round it: the direction; an arc beside it: the sun's height) and a small brightness slider. One house, one sun: shared by all the applications, so the kitchen has the same afternoon and the same shadows as the house. Next to the view, because the sun is dragged while watching the shadows. 3D only.
- **?**: the help of the current application and mode.

### Switching

- **Another application** (top-left menu): the mode stays (the 2D of the house opens the 2D of the kitchen; 3D when it has no such mode); the sun stays; each application keeps its own layers, tab and camera.
- **Another mode** (top-right menu): the main view, the bottom menu and what the right panel shows change (the table above).
- **A setting** (right panel, ☀): every mode shows it at once.
- **An action** (bottom menu): does one thing (a camera flight, a file) and sets nothing.
- The choices stay in the browser, as today.

## Library

Everything bought is in **library/**, once, for every application: materials, textures, products (tiles, boards, worktops, fittings, sinks, taps, appliances, hardware). It is taken as it is, never changed by a project.

```
library/
  products.js    a product by key: name, maker, sizes and formats, price, link to the shop, texture key;
                 appliances with the maker's sizes (today kitchen/appliances.js)
  materials.js   how a material looks: in 3D (colour, roughness, gloss) and in 2D (section fill)
  textures/      one image, one file (<key>.js, a data URL, so the pages work opened from disk)
```

- A project names a product by its key and says only where it goes and how (a bathroom wall: paradyz-authority-grey, 598×1198, vertical; an appliance: how it is built in). Nothing of the product is repeated.
- A page loads only the textures it uses: core loads library/textures/<key>.js when a product needs it.
- Info takes price and link from the library: a price changed once is changed everywhere.
- library/ is data, not code: core knows no product, the library knows no project.

## Code style (every folder)

- Readable: consistent indentation, short functions, one idea per line, names that match the page.
- No hidden rules: what is built follows from the data. No numbers of a project in the code, no duplicated values.
- Pages in Polish; code and comments in English; short comments that say why.
- Library versions pinned. No backward-compatibility code.
