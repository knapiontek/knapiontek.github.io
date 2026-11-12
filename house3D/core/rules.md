# Core rules

> What core must do. How: project.md.

1. **Scope**: knows no project; a change to core changes no project's model unless that is the point.
2. **Solids**: exact operations, nothing sampled. No two solids share volume (core gives the check, projects run it).
3. **Mesh**: one list of points, welded at 0.05 mm. No T-junctions, no cracks. No two surfaces in one plane. Nothing enlarged or hidden to cover a fault.
4. **Edges**: shown wherever a solid is exposed; a joint in one plane only while the neighbour is hidden. Edges are a layer, never a colour mode.
5. **Navigation**: wheel zooms to the surface under the cursor; rotation about the body centre from outside, about the surface in view inside.
6. **Cut**: clips the model; caps in the section colour, also on a solid's top.
7. **Layers**: a child only with its parent; a solid only when all its layers are on; switching changes only what is shown.
8. **Panel**: one look for every project, light and dark. Viewer's choices stay in the browser.
