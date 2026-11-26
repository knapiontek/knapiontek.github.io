# core

General code for any project: it knows no house, no room, no product. Everything it needs comes from its caller.

| File | What |
|---|---|
| `ui.js` | the screen on Alpine: `page()` (a page's Alpine part, its state kept in the browser), the pieces (`x-part`: nav, modes, dock, panel, layers, sun, help, corner), the layers as a collapsible tree, light or dark, the panel's » « |
| `ui.css` | the look of the screen, light and dark |
| `tree.js` | `createTree(root)`: the tree of nodes, where a thing stands or hangs: a node by its path, its place (the sum of the offsets), its box, a setting from the nearest node up, its refs, its layers (its own and those above), a walk, the checks |
| `tools.js` | how numbers are written (`fmt`) |
