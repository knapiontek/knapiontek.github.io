/* "Dom w papawerach 5 (G)" (archon.pl) - walls, openings and rooms of both floors, cm.
   Measured from the plan images on archon.pl (853 px GIF, 2.41 cm/px, reading accuracy about +-3 cm);
   the attic is aligned to the ground floor (outer walls, portal wings and length snapped, differences 2-3 cm);
   gaps up to 8 cm between neighbouring walls and openings (reading errors) are closed, walls next to a door take
   its thickness, walls meeting only at a corner point are extended into a proper joint, a wall continuing another one with a
   step of up to 13 cm is widened to the same face, and on each floor all edges (walls, openings, rooms, the stair
   hole) closer than 3 cm on one axis share one coordinate.
   Wall thicknesses follow the build-ups of building.js (outer walls: block 24 + EPS 20 = 44, interior: block 24 or 12):
   the outer faces stayed where they were measured, the inner face moved; an interior wall kept the face shared with
   most of its neighbours. The portal wings are the side walls running past the gables, insulated on both sides and
   the end: EPS 20 + block 24 + EPS 20 = 64, the block in line with the block of the side wall.
   The view checks every wall against its build-up.
   x across the house from the left outer wall face, z from the garden outer wall face towards the entrance.
   walls     r = [x1, z1, x2, z2]; kind = a key of "walls" in building.js: ext | knee (attic side wall) | gable |
             portal (the side walls run past the gables) | int24 | int12 | chimney | rail
   openings  the part of a wall with a window, door, entrance or gate: wall below sill and above head, glass in windows;
             wall = the wall kind it sits in (its build-up and surfaces)
   rooms     floor areas as rectangles, together the whole floor between the walls (passages without a door
             belong to a room: the bedroom has the wall gaps to its wardrobes, room (6) the niche beside the shaft); planArea = the area from the plan
             (attic: total, incl. under 1.9 m);
             layout = the floor layout of floors.js that covers it, or none
   stair     U-shaped: flight1 rises west from the hall (risers 1..12 up to the landing), flight2 rises east to the
             attic floor (risers 13..17); core = the wall between the flights; voids = the stair hole in the attic floor */
window.HOUSE_PLAN = {
 "ground": {
  "walls": [
   {"r": [0, 0, 44, 760.3], "kind": "ext"},
   {"r": [0, 963.1, 44, 1322.8], "kind": "ext"},
   {"r": [44, 0, 154.5, 44], "kind": "ext"},
   {"r": [755.5, 0, 866, 44], "kind": "ext"},
   {"r": [866, 0, 910, 82.1], "kind": "ext"},
   {"r": [866, 333.1, 910, 470.7], "kind": "ext"},
   {"r": [866, 651.7, 910, 801.4], "kind": "ext"},
   {"r": [866, 902.8, 910, 1322.8], "kind": "ext"},
   {"r": [44, 1278.8, 113.4, 1322.8], "kind": "ext"},
   {"r": [391, 1278.8, 453.8, 1322.8], "kind": "ext"},
   {"r": [409.8, 1187, 453.8, 1278.8], "kind": "ext"},
   {"r": [615.5, 1187, 661.4, 1231], "kind": "ext"},
   {"r": [741, 1187, 866, 1231], "kind": "ext"},
   {"r": [0, -101.4, 64, 0], "kind": "portal"},
   {"r": [846, -101.4, 910, 0], "kind": "portal"},
   {"r": [0, 1322.8, 64, 1421.7], "kind": "portal"},
   {"r": [846, 1231, 910, 1421.7], "kind": "portal"},
   {"r": [44, 535.9, 391, 547.9], "kind": "int12"},
   {"r": [391, 470.7, 433.8, 547.9], "kind": "chimney"},
   {"r": [318.6, 647, 433.8, 659], "kind": "int12"},
   {"r": [409.8, 659, 433.8, 1064.5], "kind": "int24"},
   {"r": [409.8, 1151.4, 433.8, 1187], "kind": "int24"},
   {"r": [433.8, 905.3, 487.6, 929.3], "kind": "int24"},
   {"r": [579.3, 905.3, 615.5, 929.3], "kind": "int24"},
   {"r": [601, 721.8, 866, 733.8], "kind": "int12"},
   {"r": [615.5, 733.8, 627.5, 760.3], "kind": "int12"},
   {"r": [615.5, 869, 627.5, 1064.5], "kind": "int12"},
   {"r": [615.5, 1156.2, 627.5, 1231], "kind": "int12"},
   {"r": [627.5, 902.8, 729, 926.8], "kind": "int24"},
   {"r": [717, 926.8, 729, 996.9], "kind": "int12"},
   {"r": [729, 984.9, 866, 996.9], "kind": "int12"}
  ],
  "openings": [
   {"r": [0, 760.3, 44, 963.1], "sill": 110, "head": 210, "kind": "window", "wall": "ext"},
   {"r": [154.5, 0, 755.5, 44], "sill": 0, "head": 240, "kind": "window", "wall": "ext"},
   {"r": [866, 82.1, 910, 333.1], "sill": 0, "head": 240, "kind": "window", "wall": "ext"},
   {"r": [866, 470.7, 910, 651.7], "sill": 110, "head": 240, "kind": "window", "wall": "ext"},
   {"r": [866, 801.4, 910, 902.8], "sill": 110, "head": 240, "kind": "window", "wall": "ext"},
   {"r": [113.4, 1278.8, 391, 1322.8], "sill": 0, "head": 225, "kind": "gate", "wall": "ext"},
   {"r": [453.8, 1187, 615.5, 1231], "sill": 0, "head": 210, "kind": "entrance", "wall": "ext"},
   {"r": [661.4, 1187, 741, 1231], "sill": 0, "head": 210, "kind": "window", "wall": "ext"},
   {"r": [409.8, 1064.5, 433.8, 1151.4], "sill": 0, "head": 205, "kind": "door", "wall": "int24"},
   {"r": [487.6, 905.3, 579.3, 929.3], "sill": 0, "head": 205, "kind": "door", "wall": "int24"},
   {"r": [615.5, 760.3, 627.5, 869], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
   {"r": [615.5, 1064.5, 627.5, 1156.2], "sill": 0, "head": 205, "kind": "door", "wall": "int12"}
  ],
  "rooms": [
   {"name": "Salon z kuchnią i holem", "planArea": 50.55, "layout": "ground", "rects": [[44, 44, 391, 535.9], [391, 44, 433.8, 470.7], [433.8, 44, 866, 535.9], [433.8, 535.9, 866, 721.8], [433.8, 721.8, 615.5, 905.3]]},
   {"name": "Wiatrołap", "planArea": 4.84, "layout": "ground", "rects": [[433.8, 929.3, 615.5, 1187]]},
   {"name": "Łazienka", "planArea": 4.95, "layout": "ground", "rects": [[627.5, 733.8, 866, 902.8], [729, 902.8, 866, 984.9]]},
   {"name": "Kotłownia z pralnią", "planArea": 4.97, "layout": "ground", "rects": [[627.5, 926.8, 717, 996.9], [627.5, 996.9, 866, 1187]]},
   {"name": "Garaż", "planArea": 25.91, "layout": "none", "rects": [[44, 659, 409.8, 1278.8], [44, 547.9, 318.6, 642.1], [273, 647.7, 318.6, 659]]}
  ],
  "fireplace": [335.5, 506.9, 391, 535.9],
  "stair": {
   "risers": 17,
   "flight1": {"x": [143, 433.8], "z": [547.9, 640.5], "risers": 12},
   "landing": {"x": [44, 143], "z": [547.9, 735]},
   "flight2": {"x": [143, 273], "z": [647.7, 735]},
   "core": [143, 640.5, 433.8, 647.7]
  }
 },
 "attic": {
  "walls": [
   {"r": [0, 0, 44, 1322.8], "kind": "knee"},
   {"r": [866, 0, 910, 1322.8], "kind": "knee"},
   {"r": [44, 0, 156.5, 44], "kind": "gable"},
   {"r": [755.9, 0, 866, 44], "kind": "gable"},
   {"r": [44, 1278.8, 168.5, 1322.8], "kind": "gable"},
   {"r": [392.4, 1278.8, 522.4, 1322.8], "kind": "gable"},
   {"r": [741.5, 1278.8, 866, 1322.8], "kind": "gable"},
   {"r": [0, -101.4, 64, 0], "kind": "portal"},
   {"r": [846, -101.4, 910, 0], "kind": "portal"},
   {"r": [0, 1322.8, 64, 1421.7], "kind": "portal"},
   {"r": [846, 1322.8, 910, 1421.7], "kind": "portal"},
   {"r": [44, 362.1, 392.4, 374.1], "kind": "int12"},
   {"r": [553.7, 362.1, 866, 374.1], "kind": "int12"},
   {"r": [380.4, 465.8, 392.4, 473.2], "kind": "int12"},
   {"r": [380.4, 473.2, 459.8, 547.9], "kind": "chimney"},
   {"r": [553.7, 465.8, 565.7, 651.7], "kind": "int12"},
   {"r": [553.7, 741.1, 565.7, 820.7], "kind": "int12"},
   {"r": [44, 535.9, 380.4, 547.9], "kind": "int12"},
   {"r": [548.9, 535.9, 866, 547.9], "kind": "int12"},
   {"r": [565.7, 820.7, 866, 832.7], "kind": "int12"},
   {"r": [553.7, 820.7, 609.1, 914.8], "kind": "int24"},
   {"r": [609.1, 890.8, 650, 914.8], "kind": "int24"},
   {"r": [44, 738.7, 341.9, 750.7], "kind": "int12"},
   {"r": [329.9, 750.7, 341.9, 902.8], "kind": "int12"},
   {"r": [44, 902.8, 178.1, 914.8], "kind": "int12"},
   {"r": [260, 902.8, 346.7, 914.8], "kind": "int12"},
   {"r": [440.6, 902.8, 452.6, 1278.8], "kind": "int12"},
   {"r": [143, 642.2, 438.1, 651.7], "kind": "rail"}
  ],
  "openings": [
   {"r": [156.5, 0, 755.9, 44], "sill": 0, "head": 346, "kind": "window", "wall": "gable"},
   {"r": [168.5, 1278.8, 392.4, 1322.8], "sill": 30, "head": 285, "kind": "window", "wall": "gable"},
   {"r": [522.4, 1278.8, 741.5, 1322.8], "sill": 30, "head": 285, "kind": "window", "wall": "gable"},
   {"r": [459.8, 535.9, 553.7, 547.9], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
   {"r": [553.7, 651.7, 565.7, 741.1], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
   {"r": [178.1, 902.8, 260, 914.8], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
   {"r": [346.7, 902.8, 440.6, 914.8], "sill": 0, "head": 205, "kind": "door", "wall": "int12"},
   {"r": [452.6, 902.8, 553.7, 914.8], "sill": 0, "head": 205, "kind": "door", "wall": "int12"}
  ],
  "rooms": [
   {"name": "Sypialnia (2)", "planArea": 28.16, "layout": "attic", "rects": [[44, 44, 866, 362.1], [392.4, 362.1, 553.7, 374.1], [380.4, 374.1, 565.7, 465.8], [392.4, 465.8, 452.6, 473.2], [452.6, 465.8, 553.7, 535.9]]},
   {"name": "Garderoba (3)", "planArea": 5.13, "layout": "attic", "rects": [[44, 374.1, 380.4, 535.9]]},
   {"name": "Garderoba (4)", "planArea": 4.6, "layout": "attic", "rects": [[565.7, 374.1, 866, 535.9]]},
   {"name": "Hol (1)", "planArea": 7.32, "layout": "attic", "rects": [[438.1, 547.9, 553.7, 651.7], [273, 651.7, 341.9, 738.7], [341.9, 651.7, 553.7, 902.8]]},
   {"name": "Łazienka (5)", "planArea": 7.99, "layout": "bathGrey", "rects": [[565.7, 547.9, 866, 820.7]]},
   {"name": "Garderoba (8)", "planArea": 4.16, "layout": "attic", "rects": [[44, 750.7, 329.9, 902.8]]},
   {"name": "Pokój (7)", "planArea": 14.11, "layout": "attic", "rects": [[44, 914.8, 440.6, 1278.8]]},
   {"name": "Pokój (6)", "planArea": 16.53, "layout": "attic", "rects": [[452.6, 914.8, 866, 1278.8], [650, 832.7, 866, 914.8], [609.1, 832.7, 650, 890.8]]}
  ],
  "voids": [[44, 547.9, 438.1, 642.2], [44, 642.2, 273, 738.7]]
 }
};
