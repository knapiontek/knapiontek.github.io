/* Kitchen appliances: what the manufacturers give - sizes and documents. Written per project (LLM).
   How an appliance fits in this kitchen is decided by engine.js (fitAppliances), not here.
   Sizes in mm, one value each. Less obvious fields:
     body      the appliance's overall size: an oven or a microwave without its fascia, a fridge or a dishwasher with its
               doors; a sink: its outline on the worktop
     fascia    the front panel of an oven or a microwave; bottom: where it starts, measured from the body bottom (below it: negative)
     feet      the height of its feet as set in this kitchen
     door      hinge: the edge the door turns on; height: the appliance door at these feet (dishwasher)
     doors     fridge and freezer doors, from the appliance bottom; doorDepth: how deep they are, from the carcass front back
     controlPanelHeight, controlColumnWidth   the part of the fascia that does not open: the panel above the door, the column beside it
     baseSetback   how far behind the front the base under the door starts (open in front for the plinth)
     source    where the values come from; "assumed" = still to check */
window.KITCHEN_APPLIANCES = {
 "oven": {"name": "Bosch HBA534BB3", "body": {"width": 558, "height": 570, "depth": 528.5}, "fascia": {"width": 594, "height": 595, "thickness": 19.5, "bottom": 0}, "feet": 0, "door": {"hinge": "bottom"}, "controlPanelHeight": 98,
  "source": "spec sheet HBA534BB3: 594 × 595 × 548 (the fascia 594 × 595); installation drawing HBA534BB0A, the same housing: housing 570 high and fascia 19.5 thick, both stand on the board, the fascia ends 25 above the housing; body depth 528.5 = 548 − 19.5; body width 558 and control panel 98: assumed",
  "links": [
   {"name": "Karta produktu (PDF, PL)", "url": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/HBA534BB3.pdf"},
   {"name": "Instrukcja, montaż s. 26–27 (PDF)", "url": "https://media3.bosch-home.com/Documents/9001910274_B.pdf"}
  ]},
 "microwave": {"name": "Bosch BFL623MB3", "body": {"width": 442, "height": 338, "depth": 315}, "fascia": {"width": 595, "height": 382, "thickness": 20, "bottom": -13}, "feet": 4, "door": {"hinge": "left"}, "controlColumnWidth": 153,
  "source": "installation drawing BFL623MB3, tall cabinet: fascia 595 × 382, 20 thick; body 442 × 338 × 315 on adjustable feet, here 4 (the fascia in the middle of its module); the fascia starts 13 below the body; door hinged on the left, controls on the right; control column 153: assumed (photo)",
  "links": [
   {"name": "Strona produktu z dokumentami (PL)", "url": "https://www.bosch-home.pl/pl/product/gotowanie-i-pieczenie/kuchenki-mikrofalowe/kuchenki-mikrofalowe-do-zabudowy/BFL623MB3"},
   {"name": "Instrukcja montażu, s. 24–25 (PDF, PL)", "url": "https://maxelektro.pl/storage/file/pimcore_import/2024/12/17/94c9b8f85ca9df2e0ed5ed5def050d92/kuchenka-mikrofalowa-bosch-serie-2-bfl623mb3-instrukcja-montazu.pdf"}
  ]},
 "fridgeFreezer": {"name": "Bosch KIS86AFE0", "body": {"width": 558, "height": 1772, "depth": 545}, "doors": {"freezer": {"bottom": 8, "top": 702}, "fridge": {"bottom": 733, "top": 1745}}, "doorDepth": 64,
  "source": "installation drawing KIS86AFE0: 1772 × 558 × 545; doors from the appliance bottom: freezer 694 high, top at 702 (8 above the bottom); fridge 1012 high, bottom at 733",
  "links": [
   {"name": "Strona produktu z instrukcją montażu (PL)", "url": "https://www.bosch-home.pl/pl/product/chlodzenie-i-zamrazanie/chlodziarko-zamrazarki/chlodziarko-zamrazarki-do-zabudowy/KIS86AFE0"}
  ]},
 "dishwasher": {"name": "Bosch SMV4HVX00E", "body": {"width": 598, "height": 815, "depth": 550}, "feet": 55, "door": {"hinge": "bottom", "height": 719}, "baseSetback": 100,
  "source": "installation drawing SMV4HVX00E: 598 × 815 × 550 with the feet screwed in; here feet 55 (up to the worktop), at these feet the appliance door is 719; feet 100 behind the front: the base is open in front for the plinth",
  "links": [
   {"name": "Strona produktu z instrukcjami (PL)", "url": "https://www.bosch-home.pl/pl/product/zmywanie/zmywarki-do-zabudowy/zintegrowane-zmywarki-o-szerokosci-60-cm/SMV4HVX00E"},
   {"name": "Karta produktu (PDF, PL)", "url": "https://media3.bosch-home.com/Documents/specsheet/pl-PL/SMV4HVX00E.pdf"}
  ]},
 "hob": {"name": "Electrolux CIT61443", "body": {"width": 560, "height": 44, "depth": 490}, "glass": {"width": 590, "depth": 520},
  "source": "electrolux.pl: glass 590 × 520, built-in 560 × 490 × 44",
  "links": [
   {"name": "Strona produktu z instrukcją", "url": "https://www.electrolux.pl/kitchen/cooking/hobs/induction-hob/cit61443/"}
  ]},
 "sink": {"name": "IKEA KILSVIKEN", "body": {"width": 720, "depth": 460}, "bowl": {"width": 660, "height": 180, "depth": 400}, "rim": 8, "wall": 10,
  "source": "ikea.com/pl: 72 × 46, bowl 66 × 40 × 18; rim and wall: assumed",
  "links": [
   {"name": "Instrukcja montażu z szablonem (PDF)", "url": "https://www.ikea.com/pl/pl/assembly_instructions/kilsviken-zlew-wpuszczany-1-komorowy-czarny-kompozyt-kwarcowy__AA-2382156-2-2.pdf"}
  ]},
 "hood": {"name": "Electrolux LFV416K", "body": {"width": 598, "height": 380, "depth": 390}, "chimney": {"width": 250, "depth": 220},
  "source": "specifications in the user manual: width 598, depth 390; body height 380 and chimney 250 × 220: assumed (not in the documents)",
  "links": [
   {"name": "Instrukcja obsługi, dane techniczne (EN)", "url": "https://www.manuals.co.uk/electrolux/lfv416k/manual?p=237"},
   {"name": "Karta sklepu z wymiarami", "url": "https://onoff.ee/en/ohupuhastid/43131-electrolux-lfv416k-20109668-7332543771257.html"}
  ]},
 "coffee": {"name": "DeLonghi Dinamica", "body": {"width": 236, "height": 348, "depth": 429},
  "source": "delonghi.com, ECAM350.55.B: 236 × 429 × 348 (w × d × h), 9.5 kg",
  "links": [
   {"name": "Strona produktu (EN)", "url": "https://delonghi-s2.delonghigroup.com/en/dinamica-fully-automatic-black-coffee-maker-ecam350-55-b/p/ECAM350.55.B%20EX%3A4"}
  ]}
};
