/* Kitchen appliances: what the manufacturers give - sizes and documents. Written per project (LLM).
   How an appliance fits in this kitchen is decided by cost.html and view.html, not here.
   Sizes in mm; a range is {min, max}. Less obvious fields:
     feet      min = max: fixed feet; adjustable feet: the front is centred in its place
     door      hinge: the edge the door turns on; height: a door that grows with the feet (dishwasher)
     doors     fridge doors from the appliance bottom; setback: where the doors start behind the front
     source    where the values come from; "assumed" = still to check */
window.KITCHEN_APPLIANCES = {
 "oven": {"name": "Bosch HBA534BB3", "body": {"width": 558, "height": 570, "depth": 528.5}, "front": {"width": 594, "height": 595, "thickness": 19.5}, "frontBottom": 0, "feet": {"min": 0, "max": 0}, "door": {"hinge": "bottom"},
  "niche": {"height": {"min": 585, "max": 595}, "width": {"min": 560, "max": 568}, "depth": 550},
  "source": "installation drawing HBA534BB0A: housing 570 and front 594 × 595 (19.5 thick) both stand on the board, the front ends 25 above the housing; overall depth 548 (body 548 − 19.5); body width 558: assumed (drawing gives only the niche 560 +8)",
  "links": [
   {"name": "Karta produktu z rysunkiem zabudowy (PDF, PL)", "url": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/HBA534BB3.pdf"},
   {"name": "Instrukcja, montaż s. 26–27 (PDF)", "url": "https://media3.bosch-home.com/Documents/9001910274_B.pdf"}
  ]},
 "micro": {"name": "Bosch BFL623MB3", "body": {"width": 442, "height": 338, "depth": 315}, "front": {"width": 595, "height": 382, "thickness": 20}, "frontBottom": -13, "feet": {"min": 0, "max": 12}, "door": {"hinge": "left"},
  "niche": {"height": {"min": 380, "max": 382}, "width": {"min": 560, "max": 568}, "depth": 550},
  "source": "installation drawing BFL623MB3, tall cabinet: front 595 × 382, 20 thick; body 442 × 338 × 315 on adjustable feet (12 in the drawing; range 0–12 assumed); the front 13 below the body; door hinged on the left (controls on the right)",
  "links": [
   {"name": "Strona produktu z dokumentami (PL)", "url": "https://www.bosch-home.pl/pl/product/gotowanie-i-pieczenie/kuchenki-mikrofalowe/kuchenki-mikrofalowe-do-zabudowy/BFL623MB3"},
   {"name": "Instrukcja montażu, s. 24–25 (PDF, PL)", "url": "https://maxelektro.pl/storage/file/pimcore_import/2024/12/17/94c9b8f85ca9df2e0ed5ed5def050d92/kuchenka-mikrofalowa-bosch-serie-2-bfl623mb3-instrukcja-montazu.pdf"}
  ]},
 "fridge": {"name": "Bosch KIS86AFE0", "body": {"width": 558, "height": 1772, "depth": 545}, "doors": {"freezer": {"bottom": 8, "top": 702}, "fridge": {"bottom": 733, "top": 1745}, "setback": 64},
  "niche": {"height": {"min": 1775, "max": 1775}, "width": {"min": 560, "max": 560}, "depth": 550},
  "source": "installation drawing KIS86AFE0: 1772 × 558 × 545; doors from the appliance bottom: freezer 694 high, top at 702 (8 above the bottom); fridge 1012 high, bottom at 733",
  "links": [
   {"name": "Strona produktu z instrukcją montażu (PL)", "url": "https://www.bosch-home.pl/pl/product/chlodzenie-i-zamrazanie/chlodziarko-zamrazarki/chlodziarko-zamrazarki-do-zabudowy/KIS86AFE0"}
  ]},
 "dishwasher": {"name": "Bosch SMV4HVX00E", "body": {"width": 598, "height": 815, "depth": 550}, "feet": {"min": 0, "max": 60}, "door": {"height": {"min": 655, "max": 725}}, "baseSetback": 100,
  "niche": {"height": {"min": 815, "max": 875}, "width": {"min": 600, "max": 600}, "depth": 550},
  "source": "installation drawing SMV4HVX00E: 598 × 550, height 815–875 (feet +60), appliance door 655–725 (grows with the height), plinth zone 90–220, feet 100 behind the front: the base is open in front for the plinth",
  "links": [
   {"name": "Strona produktu z danymi (EN)", "url": "https://www.galaxus.ch/en/s2/product/bosch-hausgeraete-serie-4-smv4hvx00e-built-in-dishwashers-37002331"}
  ]},
 "hob": {"name": "Electrolux CIT61443", "body": {"width": 560, "height": 44, "depth": 490}, "glass": {"width": 590, "depth": 520},
  "source": "electrolux.pl: glass 590 × 520, built-in 560 × 490 × 44",
  "links": [
   {"name": "Strona produktu z instrukcją", "url": "https://www.electrolux.pl/kitchen/cooking/hobs/induction-hob/cit61443/"}
  ]},
 "sink": {"name": "IKEA KILSVIKEN", "outer": {"width": 720, "depth": 460}, "bowl": {"width": 660, "height": 180, "depth": 400}, "rim": 8, "wall": 10,
  "source": "ikea.com/pl: 72 × 46, bowl 66 × 40 × 18; rim and wall: assumed",
  "links": [
   {"name": "Instrukcja montażu z szablonem (PDF)", "url": "https://www.ikea.com/pl/pl/assembly_instructions/kilsviken-zlew-wpuszczany-1-komorowy-czarny-kompozyt-kwarcowy__AA-2382156-2-2.pdf"}
  ]},
 "hood": {"name": "Electrolux LFV416K", "body": {"width": 598, "height": 380, "depth": 390}, "chimney": {"width": 250, "depth": 220},
  "source": "specifications in the user manual: width 598, depth 390, height up to 915 with the chimney; body height 380 and chimney 250 × 220: assumed (not in the documents)",
  "links": [
   {"name": "Instrukcja obsługi, dane techniczne (EN)", "url": "https://www.manuals.co.uk/electrolux/lfv416k/manual?p=237"},
   {"name": "Karta sklepu z wymiarami 915 × 598 × 390", "url": "https://onoff.ee/en/ohupuhastid/43131-electrolux-lfv416k-20109668-7332543771257.html"}
  ]},
 "coffee": {"name": "DeLonghi Dinamica", "body": {"width": 236, "height": 348, "depth": 429},
  "source": "delonghi.com, ECAM350.55.B: 236 × 429 × 348 (w × d × h), 9.5 kg",
  "links": [
   {"name": "Strona produktu (EN)", "url": "https://delonghi-s2.delonghigroup.com/en/dinamica-fully-automatic-black-coffee-maker-ecam350-55-b/p/ECAM350.55.B%20EX%3A4"}
  ]}
};
