# Tests

> **This file is the LLM's.** It is not a description of the project: it is what an LLM needs to rebuild its automated tests in a new session. One file for the whole project. The LLM keeps it up to date and orders it as it sees fit, without asking; what the project must do is in the project.md and rules.md files, not here.

Nothing is installed in the repository: the LLM rebuilds the scripts from this file in its own environment, runs them before and after a change and compares the two runs. Everything the same, or each difference explained (a renamed file shown in Info changes its length; a new feature changes its screenshot).

## How to run

- **Pages**: a headless Chrome driven by a script (e.g. Python with Playwright), the pages opened from disk (file://), as the owner does. three.js r128, its OrbitControls, Alpine.js and the fonts come from a CDN: serve them from a local copy, or let the browser fetch them.
- WebGL in a headless Chrome: software rendering (SwiftShader). It is slow: a frame can take a second; wait for a state, never for a fixed time.
- A page is ready when its loading note is hidden. Each page exposes its view on window (the house HOUSE_VIEW, the kitchen KITCHEN_VIEW_PAGE, the bathroom bath): its mode switch, layers, camera and model.
- Errors: every page error and every console error or warning counts, except a CDN request the test blocked on purpose.
- **Without a browser** (node, a vm context as window): core/geometry.js, apps.dat.js, house/house.dat.js, house/model.js and house/shell.js run without THREE and DOM. HouseShell.rooms(app) for every application with rooms gives the shell a sub-project gets; keep it as JSON and compare.

## 1. Every page in every mode

Pages: the house; the kitchen; the bathroom on the ground floor and in the attic (?floor=ground, ?floor=attic); the kitchen editor (rooms/kitchen/design.html, one state). Modes: 3D, 2D, Test, Info.

Record per page and mode:
- the errors;
- the counts of the model (pieces, edges, cells, as the page gives them);
- the 2D plan as SVG, kept as a hash and a length;
- the length of the text of Info and of Test, and every tab of Info (not only the first);
- what is visible (the 2D sheet, Test, Info, the sun button), the bottom menu, the top menu, the panel's tabs;
- a screenshot (compared only on the same machine).

## 2. Interfaces and dependencies

- Test of every page lists the dependencies: a file of a sub-project is on its own page, or loaded through room.js; a file of the house is on its own page, or loaded through shell.js. Expected: OK on the house, the kitchen and both bathrooms (on the house after the furniture is loaded).
- A sub-project's page with a file of the house added by hand: its Test names that file. A copy without the house's folder: the sub-project's pages show an error that names the missing shell, with no page error.
- A sub-project's inner files (needs) stay in its folder; one outside is an error that names it.
- An implementation missing a member (e.g. night in what build returns) is an error that names it; the house's view of a furniture has only the members of room.js.
- Which room belongs to which application is only in apps.dat.js (rooms); the house's rooms have a shell, no link to a page.
- In the text of the files (code, data and MD): outside apps.dat.js, no file names a sub-project's folder or a file of it; no sub-project names another, nor a file of the house. Search every folder for the other folders' names and their file names (house.dat.js, kitchen.dat.js, bathroom.dat.js, …).

## 3. The furniture in the house

- With Warstwy → Meble on, the house loads the furniture of every application that has it: the kitchen (one room) and the bathrooms (one per floor), with no error and no error status in the panel. Note the time: the house shown, then the furniture built.
- A room furnished by an application has its name as a link to the application's page (room tag and Wykończenie).
- The bathrooms' wall tiles lie on the house's walls (ground floor: graphite in the shower, on the walls around the vanity; attic: grey), and go with the layer.
- The floor of a room with a sub-project is the sub-project's: the house lays no tiles of its own there (Wykończenie says so) and its estimate has only the rooms without one; the bathrooms' floor tiles show with their layer.
- A real mouse click on a drawer front of the ground-floor bathroom (camera in front of it) opens the drawer by its full travel (328 mm); a second click closes it. The same in the kitchen: a click on a front opens it.
- Test of the house: the furniture of every application matches room.js, naming those checked.
- Without a sub-project (a copy without its folder) the house opens without page errors; the only console error is the failed load of its furniture file; the panel and Test name what is missing; the other furniture loads.

## 4. The walk in the house

With all the furniture loaded and on.
- Through every interior door of the ground floor, both ways: aimed at the middle and at 200 mm off it, straight and 30° askew, from 900 mm before the wall. Walking forward until it stops; it must end 400 mm past the wall. Expected: all pass (40), the bathroom's door included.
- Through every interior door of the attic, both ways: aimed at the middle and at 150 mm off it, straight, from 600 mm before the wall (the hall is narrow). Standing on the attic floor. Expected: all pass (30).
- Straight at a wall away from any door, running: it stops on its side, never through.
- The furniture stops it, the body (its radius) short of it: toward the kitchen island from the living room (220 mm before the worktop), into the attic bathroom toward the bath (220 mm before its rim); a page that hides a furniture's layer walks through where it stood.

## 5. Values to keep

- **The bathrooms**: tiles, doors and drawers (open positions to the mm), plans and Info as before, the estimate to the grosz. Tiles in the estimate: m² from the tiled faces of the model, with the reserve; the ground floor 4,74 m² floor and 28,10 m² walls, the attic 33,78 m² (default tiles). Test: the checks of bathroom.dat.js with their values (ground floor: 405, 10, 140, 410 mm; attic: 0, 550, 480, 390 = 390, 230 / 230, 42 (the spout inside the bath's inner rim), 310 / 380, 2515, 2083, 2650, 420 mm), all OK.
- **The shells** (without a browser): the kitchen one room (Salon z kuchnią i holem, 5 objects, 1 opening); the bathrooms the ground floor (9 objects, 2 openings) and the attic (7 objects, 1 opening).
