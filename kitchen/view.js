/* Kitchen project scene data - read by view.html (room, runs, appliances, lights, colours, cameras).
   Plain JSON after "window.KITCHEN_VIEW =". Written for each project. */
window.KITCHEN_VIEW = {
 "about": "Scene data for this kitchen only (where the groups stand, room, appliances, lights, colours, cameras), used only for drawing. The cabinets come from design.js through engine.js; the code below this block names no group, run or size of this kitchen.",
 "runs": {
   "about": "where each design group stands: x, z of its first column at the wall line (n = 0), rot = turn in degrees (0: along the window wall, facing the room). A group whose worktop has the tag island (design.js) stands free: no wall behind it.",
   "A": {"group": 1, "name": "pod oknem", "x": 0, "z": 0, "rot": 0},
   "B": {"group": 2, "name": "zabudowa wysoka", "x": 3372, "z": 0, "rot": -90},
   "C": {"group": 3, "name": "wyspa", "x": 1730, "z": 2440, "rot": 180}
 },
 "fittings": {
   "about": "hardware and appliance sizes for the drawing only, no effect on the cost",
   "handle": {"axis": 28, "cupLength": 89, "barLength": 160, "sideHeight": 260},
   "open": {"door": 105, "fridge": 95, "dishwasher": 84, "drawer": 440},
   "leg": {"radius": 15, "footRadius": 24, "footHeight": 12, "fromSide": 45, "fromBack": 45, "fromFront": 100},
      "hinge": {"cupDepth": 11.5},
   "drawer": {"runner": 13, "sideFromCarcass": 22, "sideThickness": 15.5, "fromBack": 36, "fromFront": 16, "innerSide": 84},
   "bins": {"count": 3, "height": 235},
      "plinthGrille": {"width": 480, "bottom": 20, "top": 80}
 },
 "finishes": {
   "about": "finishes shown in the Project tab next to the design.js materials: [use, name, CSS swatch]",
   "list": [
     ["Zlew", "Kompozyt kwarcowy", "radial-gradient(circle at 30% 40%,#8a8a88 0 1px,transparent 1.5px) 0 0/5px 5px,#2a2b2d"],
     ["Podłoga", "Szare płytki 120 × 60, wygląd marmuru", "linear-gradient(120deg,#c4c6c7,#b5b8ba 45%,#cfd1d2)"]
   ]
 },
 "room": {"about": "The room, mm: ceiling measured, the other sizes rounded to whole metres. x along the window wall from the start of Group 1, z out from the window wall, y up. rightWallRun: the run that stands against the right wall (the wall is at its x).",
   "ceiling": 2740, "leftEnd": -1000, "floorDepth": 4000, "wallThickness": 300, "rightWallRun": "B", "rightWallLength": 4000, "floorTile": [1200, 600]},
 "window": {"x": 870, "width": 1900, "sill": 1080, "height": 1300, "reveal": 150, "finish": "antracyt"},
 "sink": {"about": "centred on the worktop cut-out (design.js rules.cutouts.sink); tapFromBack from the back edge of the worktop", "outer": [720, 460], "bowl": [660, 400], "rim": 8, "wall": 10, "bowlDepth": 180, "tapFromBack": 45, "trapTop": 575, "wallOutlet": 470},
 "hob": {"about": "Electrolux CIT61443 (electrolux.pl): glass 590 × 520, built-in 560 × 490 × 44; the body sits in the worktop cut-out (design.js rules.cutouts.hob), the glass centred on it", "glass": [590, 520], "builtInHeight": 44},
 "appliances": {
   "about": "appliances as they are built in, mm. front = the visible fascia [width, height]; body = the part behind the carcass front [width, height, depth]; projection = how far the front stands out of the carcass front; feet = height of the body bottom above the board it stands on (\"auto\": adjustable, the front centred in its module); frontBottom = front bottom from the body bottom. Every value names its source; 'assumed' = not found in the documents, to check in the installation drawing. niche = the manufacturer's installation niche, for reference only (not checked).",
   "oven": {"name": "Bosch HBA534BB3", "front": [594, 595], "body": [558, 570, 528.5], "projection": 19.5, "feet": 0, "frontBottom": 0,
     "source": "installation drawing HBA534BB0A: housing 570 and front 594 × 595 (19.5 thick) both stand on the board, the front ends 25 above the housing; overall depth 548 (body 548 − 19.5); body width 558: assumed (drawing gives only the niche 560 +8)",
     "niche": {"h": [585, 595], "w": [560, 568], "d": 550}, "link": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/HBA534BB3.pdf"},
   "micro": {"name": "Bosch BFL623MB3", "front": [595, 382], "body": [442, 338, 315], "projection": 20, "feet": "auto", "frontBottom": -13,
     "source": "installation drawing BFL623MB3, tall cabinet: front 595 × 382, 20 thick; body 442 × 338 × 315 on adjustable feet (12 in the drawing); the front 13 below the body; here the front is centred in its module and the feet follow",
     "niche": {"h": [380, 382], "w": [560, 568], "d": 550}, "link": "https://www.bosch-home.pl/pl/product/gotowanie-i-pieczenie/kuchenki-mikrofalowe/kuchenki-mikrofalowe-do-zabudowy/BFL623MB3"},
   "fridge": {"name": "Bosch KIS86AFE0", "body": [558, 1772, 545], "freezerDoor": [8, 702], "fridgeDoor": [733, 1745],
     "source": "installation drawing KIS86AFE0: 1772 × 558 × 545; doors from the appliance bottom: freezer 694 high, top at 702 (8 above the bottom); fridge 1012 high, bottom at 733",
     "niche": {"h": [1775, 1775], "w": [560, 560], "d": 550}, "link": "https://www.bosch-home.pl/pl/product/chlodzenie-i-zamrazanie/chlodziarko-zamrazarki/chlodziarko-zamrazarki-do-zabudowy/KIS86AFE0"},
   "dishwasher": {"name": "Bosch SMV4HVX00E", "body": [598, 815, 550], "feet": 60, "door": [655, 725], "baseSetback": 100,
     "source": "installation drawing SMV4HVX00E: 598 × 550, height 815–875 (feet +60), appliance door 655–725 (grows with the height), plinth zone 90–220, feet 100 behind the front: the base is open in front for the plinth", "niche": {"h": [815, 875], "w": [600, 600], "d": 550}, "link": "https://www.galaxus.ch/en/s2/product/bosch-hausgeraete-serie-4-smv4hvx00e-built-in-dishwashers-37002331"}
 },
 "hood": {"name": "Electrolux LFV416K", "width": 598, "depth": 390, "bottom": 1500, "height": 380, "chimney": [250, 220]},
 "fridge": {"about": "doorDepth: how far behind the carcass front the fridge body ends and its doors start; the body size is in appliances.fridge", "doorDepth": 64},
 "coffee": {"name": "DeLonghi Dinamica", "size": [236, 348, 429]},
 "pendants": {"points": [[477.48, 2290], [1252.52, 2290]], "bottom": 1750},
 "downlights": {"about": "[x, z], or {between: [sink, hob], z}: x halfway between the sink axis and the hob axis", "points": [{"between": ["sink", "hob"], "z": 402}, [2440, 402], [2440, 1370], [2440, 2338]]},
 "colors": {"wall": "#f2f1ee"},
 "metals": {
   "brass": {"color": "#c9a063", "rough": 0.32, "metal": 0.7},
   "nickel": {"color": "#c4c4c0", "rough": 0.34, "metal": 0.55},
   "black": {"color": "#222326", "rough": 0.5, "metal": 0.3}
 },
 "handleMetal": "brass",
 "views": {
   "about": "camera views in the dock, in order: p = camera position, t = target (m, room coordinates); the first one opens",
   "all": {"name": "Całość", "p": [-1.6, 2.9, 5.4], "t": [1.6, 0.9, 1.4]},
   "a": {"name": "Pod oknem", "p": [1.6, 1.6, 3.2], "t": [1.6, 1.15, 0.1]},
   "b": {"name": "Zabudowa wysoka", "p": [0.4, 1.55, 1.7], "t": [3.2, 1.35, 1.5]},
   "c": {"name": "Wyspa", "p": [1.7, 1.45, 0.85], "t": [0.85, 0.6, 2.25]},
   "sink": {"name": "Zlew", "p": [1.9, 1.95, 1.75], "t": [1.9, 0.85, 0.3]},
   "corner": {"name": "Narożnik", "p": [2.1, 1.05, 2.3], "t": [2.95, 0.35, 0.5]},
   "top": {"name": "Rzut", "p": [1.33, 8.2, 1.91], "t": [1.32, 0, 1.9]}
 }
};
