# Tests

> **Changes to this file: an LLM always asks first.** We agree what to do; the LLM writes it here; the owner approves it; only then is the work done. Without that approval an LLM does not change this file.

What to check after every change, so that nothing drifts apart. Nothing is installed in the repository: an LLM rebuilds the script from this file in its own environment (a headless Chrome driven by a script, e.g. Python with Playwright), runs it before and after a change, and compares the two runs.

## How to run the pages

- Open the pages from disk (file://), as the owner does. three.js r128, its OrbitControls, Alpine.js and the fonts come from a CDN: serve them from a local copy, or let the browser fetch them.
- WebGL in a headless Chrome: software rendering (SwiftShader). It is slow: a frame can take a second; wait for a state, never for a fixed time.
- A page is ready when its loading note is hidden. Each page exposes its view on window (the house HOUSE_VIEW, the kitchen KITCHEN_VIEW_PAGE, the bathroom bath): its mode switch, layers, camera and model.
- Errors: every page error and every console error or warning counts, except a CDN request the test blocked on purpose.

## 1. Every page in every mode

Pages: the house; the kitchen; the bathroom on the ground floor and in the attic (?floor=ground, ?floor=attic); the kitchen editor (rooms/kitchen/design.html, one state). Modes: 3D, 2D, Test, Info.

Record per page and mode:
- the errors;
- the counts of the model (pieces, edges, cells, as the page gives them);
- the 2D plan as SVG, kept as a hash and a length;
- the length of the text of Info and of Test;
- what is visible (the 2D sheet, Test, Info, the sun button), the bottom menu, the top menu, the panel's tabs;
- a screenshot.

Compare with the run before the change: everything the same, or each difference explained (a renamed file shown in Info changes its length; a new feature changes its screenshot). Screenshots compare only on the same machine.

## 2. The furniture in the house

- With Warstwy → Meble on, the house loads the furniture of every application that has it: the kitchen (one room) and the bathrooms (one per floor), with no error and no error status in the panel. Note the time: the house shown, then the furniture built.
- The bathrooms' wall tiles lie on the house's walls (ground floor: graphite in the shower, on the walls around the vanity; attic: grey), and go with the layer.
- The floor of a room with a sub-project is the sub-project's: the house lays no tiles of its own there (Wykończenie says so) and its estimate has only the rooms without one; the bathrooms' floor tiles show with their layer.
- A real mouse click on a drawer front of the ground-floor bathroom (camera in front of it) opens the drawer by its full travel (328 mm); a second click closes it.
- The same in the kitchen: a click on a front opens it.
- Test of the house: the furniture of every application matches the interface (room.js), naming those checked.
- Without a sub-project (a copy of the repository without its folder) the house opens without page errors; the only console error is the failed load of its furniture file; the panel and Test name what is missing; the other furniture loads.
- The interface itself: an implementation missing a member (e.g. night in what build returns) is an error that names it; the house's view of a furniture has only the members of the interface.

## 3. The walk in the house

With the furniture loaded (all of it on).
- Through every interior door of the ground floor, both ways: aimed at the middle and at 200 mm off it, straight and 30° askew, from 900 mm before the wall. Walking forward until it stops; it must end 400 mm past the wall. Expected: all pass (40), the bathroom's door included: a room's door in a passage does not stop it.
- Through every interior door of the attic, both ways: aimed at the middle and at 150 mm off it, straight, from 600 mm before the wall (the hall is narrow: a start further or askew lies in the next room). Standing on the attic floor. Expected: all pass (30).
- Straight at a wall away from any door, running: it stops on its side, never through.
- The furniture stops it, the body (its radius) short of it: toward the kitchen island from the living room (stops 220 mm before the worktop), into the attic bathroom toward the bath (220 mm before its rim); a page that hides a furniture's layer walks through where it stood.

## 4. The dependencies

- Test of every page lists the dependencies: a file of a sub-project is on its own page, or loaded through the interface (room.js); a file of the house is on its own page, or loaded through the interface (shell.js). Expected: OK on the house, the kitchen and both bathrooms (on the house after the furniture is loaded).
- A sub-project's page with a file of the house added by hand: its Test names that file. A copy without the house's folder: the sub-project's pages show an error that names the missing shell, with no page error.
- A sub-project's inner files (needs) stay in its folder; one outside is an error that names it.
- In the text of the files: no file outside a sub-project's folder names a file of it, except apps.dat.js; no sub-project names another's, nor a file of the house (search the folders for the other folders' names and file names).

## 5. The bathroom's own page against the house

- Its tiles, its doors and drawers (open positions to the mm), its plans and its Info are the same as before the change: every tab of Info (not only the first), the estimate to the grosz. The tiles in the estimate: m² of each tile from the tiled faces of the model, with the reserve; the ground floor 4,74 m² floor and 28,10 m² walls, the attic 33,78 m² (with the default tiles).
- Its Test: the checks of design.dat.js, measured on the model, with their values (the ground floor: 405, 10, 140, 410 mm; the attic: 0, 550, 480, 390 = 390, 230 / 230, 42 (the spout inside the bath's inner rim), 310 / 380, 2515, 2083, 2650, 420 mm), all OK.
