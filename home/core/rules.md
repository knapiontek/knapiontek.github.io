# Core: rules

What core must do. How: [project.md](project.md).

1. **Scope**: core knows no project. A change to core changes no project's model or picture unless that is the point.
2. **Solids**: exact operations, nothing sampled. No two solids share volume (core gives the check, projects run it).
3. **Mesh**: one list of points, welded at 0.05 mm. No T-junctions, no cracks, no two surfaces in one plane. Nothing enlarged, offset or hidden to cover a fault.
4. **Edges**: shown wherever a solid is exposed; a joint in one plane only while the neighbour is hidden, or between two parts. Edges are a layer, never a colour mode.
5. **Navigation**: the wheel zooms to the surface under the cursor; rotation about the body centre from outside, about the surface in view from inside.
6. **Cut**: clips the model; caps in the section colour, also on a solid's top.
7. **Layers**: a child only with its parent; a solid only when all its layers are on; switching changes only what is shown.
8. **Panel**: one look for every project, light and dark. The viewer's choices stay in the browser.
9. **Views**: every project has the same modes (3D, 2D, Info, Test) from its data. The 2D plan is drawn by core from the model's own solids and the house's data; no drawing by hand.
