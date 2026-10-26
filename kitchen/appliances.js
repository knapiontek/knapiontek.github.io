/* Kitchen project appliances - read by cost.html and view.html. Written for each project (LLM), from the manufacturers' documents.
   Plain JSON after "window.KITCHEN_APPLIANCES =", one entry per appliance (the key is the one the pages use).
   Sizes in mm, [width, height, depth] unless a field says otherwise.
     name        make and model, as the pages show it
     body        the appliance body behind the carcass front (coffee: the machine)
     front       the visible fascia [width, height]; projection = how far it stands out of the carcass front
     feet        height of the body bottom above the board it stands on; "auto" = adjustable: the front is centred in its module
     frontBottom front bottom from the body bottom
     niche       the manufacturer's installation niche {h, w: [min, max], d}, for reference only (not checked)
     source      where every value comes from; "assumed" = not in the documents, to check in the installation drawing
     links       the documents [{name, url}]; the first one is the installation drawing or the product page
   Appliance-specific fields are described where they are used: fridge (freezerDoor, fridgeDoor: [bottom, top] from the
   appliance bottom; doorDepth: how far behind the carcass front the body ends and the doors start), dishwasher (door:
   [lowest, highest] door height as the feet grow; baseSetback: how far behind the front the base is open for the plinth),
   hob (glass [width, depth]; body sits in the worktop cut-out, design.js rules.cutouts.hob), sink (outer [width, depth];
   bowl [width, depth, depth down]; rim and wall thickness; tapFromBack from the back edge of the worktop; trapTop and
   wallOutlet heights above the floor; centred on design.js rules.cutouts.sink), hood (bottom = height above the floor;
   chimney [width, depth]). */
window.KITCHEN_APPLIANCES = {
 "oven": {"name": "Bosch HBA534BB3", "body": [558, 570, 528.5], "front": [594, 595], "projection": 19.5, "feet": 0, "frontBottom": 0,
  "niche": {"h": [585, 595], "w": [560, 568], "d": 550},
  "source": "installation drawing HBA534BB0A: housing 570 and front 594 × 595 (19.5 thick) both stand on the board, the front ends 25 above the housing; overall depth 548 (body 548 − 19.5); body width 558: assumed (drawing gives only the niche 560 +8)",
  "links": [
   {"name": "Karta produktu z rysunkiem zabudowy (PDF, PL)", "url": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/HBA534BB3.pdf"},
   {"name": "Instrukcja, montaż s. 26–27 (PDF)", "url": "https://media3.bosch-home.com/Documents/9001910274_B.pdf"}
  ]},
 "micro": {"name": "Bosch BFL623MB3", "body": [442, 338, 315], "front": [595, 382], "projection": 20, "feet": "auto", "frontBottom": -13,
  "niche": {"h": [380, 382], "w": [560, 568], "d": 550},
  "source": "installation drawing BFL623MB3, tall cabinet: front 595 × 382, 20 thick; body 442 × 338 × 315 on adjustable feet (12 in the drawing); the front 13 below the body; here the front is centred in its module and the feet follow",
  "links": [
   {"name": "Strona produktu z dokumentami (PL)", "url": "https://www.bosch-home.pl/pl/product/gotowanie-i-pieczenie/kuchenki-mikrofalowe/kuchenki-mikrofalowe-do-zabudowy/BFL623MB3"},
   {"name": "Instrukcja montażu, s. 24–25 (PDF, PL)", "url": "https://maxelektro.pl/storage/file/pimcore_import/2024/12/17/94c9b8f85ca9df2e0ed5ed5def050d92/kuchenka-mikrofalowa-bosch-serie-2-bfl623mb3-instrukcja-montazu.pdf"}
  ]},
 "fridge": {"name": "Bosch KIS86AFE0", "body": [558, 1772, 545], "freezerDoor": [8, 702], "fridgeDoor": [733, 1745], "doorDepth": 64,
  "niche": {"h": [1775, 1775], "w": [560, 560], "d": 550},
  "source": "installation drawing KIS86AFE0: 1772 × 558 × 545; doors from the appliance bottom: freezer 694 high, top at 702 (8 above the bottom); fridge 1012 high, bottom at 733",
  "links": [
   {"name": "Strona produktu z instrukcją montażu (PL)", "url": "https://www.bosch-home.pl/pl/product/chlodzenie-i-zamrazanie/chlodziarko-zamrazarki/chlodziarko-zamrazarki-do-zabudowy/KIS86AFE0"}
  ]},
 "dishwasher": {"name": "Bosch SMV4HVX00E", "body": [598, 815, 550], "feet": 60, "door": [655, 725], "baseSetback": 100,
  "niche": {"h": [815, 875], "w": [600, 600], "d": 550},
  "source": "installation drawing SMV4HVX00E: 598 × 550, height 815–875 (feet +60), appliance door 655–725 (grows with the height), plinth zone 90–220, feet 100 behind the front: the base is open in front for the plinth",
  "links": [
   {"name": "Strona produktu z danymi (EN)", "url": "https://www.galaxus.ch/en/s2/product/bosch-hausgeraete-serie-4-smv4hvx00e-built-in-dishwashers-37002331"}
  ]},
 "hob": {"name": "Electrolux CIT61443", "glass": [590, 520], "body": [560, 490, 44],
  "source": "electrolux.pl: glass 590 × 520, built-in 560 × 490 × 44",
  "links": [
   {"name": "Strona produktu z instrukcją", "url": "https://www.electrolux.pl/kitchen/cooking/hobs/induction-hob/cit61443/"}
  ]},
 "sink": {"name": "IKEA KILSVIKEN", "outer": [720, 460], "bowl": [660, 400, 180], "rim": 8, "wall": 10, "tapFromBack": 45, "trapTop": 575, "wallOutlet": 470,
  "source": "ikea.com/pl: 72 × 46, bowl 66 × 40 × 18; rim, wall, tap and trap: assumed",
  "links": [
   {"name": "Instrukcja montażu z szablonem (PDF)", "url": "https://www.ikea.com/pl/pl/assembly_instructions/kilsviken-zlew-wpuszczany-1-komorowy-czarny-kompozyt-kwarcowy__AA-2382156-2-2.pdf"}
  ]},
 "hood": {"name": "Electrolux LFV416K", "width": 598, "depth": 390, "bottom": 1500, "height": 380, "chimney": [250, 220],
  "source": "",
  "links": []},
 "coffee": {"name": "DeLonghi Dinamica", "body": [236, 348, 429],
  "source": "",
  "links": []}
};
