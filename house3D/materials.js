/* "Dom w papawerach 5 (G)": the material library of view.html, independent of the geometry. Elements of house.js
   name a material; a tile product is one whole: texture, size, joint and smallest acceptable cut.
   materials  colour, roughness, metalness, opacity (glass), reflect = strength of the sky reflection;
              one generated surface at most: texture = plaster grain (strength 0..1, grain = speck size in px of a
              256 px tile covering "tile" mm), grass, slabs (paving of "size" mm with a joint colour), wood = an oak
              decor photo of textures.js cut into boards "board" mm wide;
              plan = the fill of a section in the 2D plan (a colour, or hatch [ground, line]); without it the colour.
              A material is also the colour of a section cap (block, insulation, concrete, timber)
   products   tile products: name, note (shown under the choice), texture = a key of textures.js, tile length and
              width mm, joint mm, minCut = the smallest acceptable cut piece [along the length, across] mm (smaller
              pieces are shown red and counted), default pattern (grid | half | third | quarter | random),
              price zł per m² (null = unknown), link to the shop */
window.HOUSE_MATERIALS = {
 "materials": {
  "plasterWhite": {"color": "#f4f3ef", "roughness": 0.94, "texture": {"strength": 0.55, "grain": 2, "tile": 1100}},
  "plasterInside": {"color": "#f2eee6", "roughness": 0.95, "texture": {"strength": 0.35, "grain": 2, "tile": 1100}},
  "graphite": {"color": "#45494d", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 2, "tile": 1100}},
  "roofGraphite": {"color": "#3a3d40", "roughness": 0.78, "texture": {"strength": 0.35, "grain": 2, "tile": 600}},
  "frame": {"color": "#3b3e42", "roughness": 0.5, "metalness": 0.25},
  "groove": {"color": "#2e3134", "roughness": 0.8},
  "steel": {"color": "#c9cccf", "roughness": 0.3, "metalness": 0.8},
  "glass": {"color": "#9fb5bf", "roughness": 0.02, "metalness": 0.1, "opacity": 0.3, "reflect": 1.6, "plan": "#9fc3d6"},
  "plinth": {"color": "#6d6e6c", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 3, "tile": 600}},
  "tread": {"color": "#a57b4f", "roughness": 0.6},
  "insulation": {"color": "#dcc35e", "roughness": 0.95, "plan": {"hatch": ["#f3e6b0", "#b39a3c"]}},
  "block": {"color": "#d6d2c8", "roughness": 0.95, "plan": "#2d2f31"},
  "concrete": {"color": "#9e9c96", "roughness": 0.95, "texture": {"strength": 0.45, "grain": 3, "tile": 800}, "plan": "#7d7b76"},
  "timber": {"color": "#b89466", "roughness": 0.8},
  "lawn": {"color": "#6f8a52", "roughness": 1, "grass": {"tile": 1200}},
  "paving": {"color": "#b9b6ae", "roughness": 0.9, "slabs": {"size": 600, "joint": "#6a675f"}},
  "woodVertical": {"wood": {"decor": "H1180", "board": 120, "vertical": true}, "roughness": 0.7},
  "woodHorizontal": {"wood": {"decor": "H1180", "board": 120, "vertical": false}, "roughness": 0.7}
 },
 "products": {
  "authorityGraphite": {
   "name": "Paradyż My Way Authority Graphite",
   "note": "gres szkliwiony rekt., mat, 8 mm",
   "texture": "authorityGraphite",
   "len": 898, "wid": 898, "joint": 2, "minCut": [300, 300],
   "pattern": "grid",
   "price": 119.92,
   "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10702-paradyz-my-way-authority-graphite-gres-szkl-rekt-mat-898x898-g1"
  },
  "authorityGrey": {
   "name": "Paradyż My Way Authority Grey",
   "note": "gres szkliwiony rekt., mat, 8 mm",
   "texture": "authorityGrey",
   "len": 898, "wid": 898, "joint": 2, "minCut": [300, 300],
   "pattern": "grid",
   "price": 135.91,
   "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10703-paradyz-my-way-authority-grey-gres-szkl-rekt-mat-898x898-g1"
  },
  "logOak": {
   "name": "Atlas Concorde Log Icon Oak Forest 300×1200 mm",
   "note": "gres z efektem dębu; sprawdź wersję wewnętrzną 9 mm",
   "texture": "H1180",
   "len": 1200, "wid": 300, "joint": 2, "minCut": [200, 100],
   "pattern": "third",
   "price": null,
   "link": "https://www.atlasconcorde.com/pl/ac-kolekcja/log/icon-oak-forest/outdoor-sensitech-30x120-20-ax4a"
  },
  "brooks": {
   "name": "Gres Brooks 300×1200 mm (Castorama)",
   "note": "brązowe drewno, mat, R9, PEI 4; 79,17 zł za 1,44 m² w promocji",
   "texture": "H1181",
   "len": 1200, "wid": 300, "joint": 2, "minCut": [200, 100],
   "pattern": "third",
   "price": 54.98,
   "link": "https://www.castorama.pl/gres-brooks-30-x-120-cm-1-44-m2/5901503230480_CAPL.prd"
  },
  "egenLux": {
   "name": "Egen Lux Beige Carving 200×1200 mm (Leroy Merlin)",
   "note": "rektyfikowany, mat, 9 mm",
   "texture": "H1180",
   "len": 1200, "wid": 200, "joint": 2, "minCut": [200, 67],
   "pattern": "third",
   "price": 149,
   "link": "https://www.leroymerlin.pl/produkty/gres-szkliwiony-lux-beige-carving-20x120-egen-86508645.html"
  },
  "oredessa": {
   "name": "Arte Oredessa Wood Beige 190×1198 mm (Leroy Merlin)",
   "note": "gres szkliwiony drewnopodobny",
   "texture": "H1176",
   "len": 1198, "wid": 190, "joint": 2, "minCut": [200, 63],
   "pattern": "third",
   "price": null,
   "link": "https://www.leroymerlin.pl/produkty/gres-szkliwiony-oredessa-wood-beige-19x119-8-arte-94085002.html"
  }
 }
};
