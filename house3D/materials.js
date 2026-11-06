/* "Dom w papawerach 5 (G)" - the material library of view.html, independent of the geometry: elements of house.js
   name a material; a tile product carries its texture, size and joint (they are never chosen apart from it).
   materials  colour, roughness; texture = generated plaster grain: strength 0..1, grain = speck size in px of a 256 px
              tile covering "tile" cm, bump = relief depth (0 = off); wood = the oak decor photo of textures.js cut into
              boards; grass, slabs = generated lawn and paving
   products   tile products: name, note (shown under the choice), texture = a key of textures.js, tile length and width
              in mm, joint mm, default pattern (grid | half | third | quarter | random), price zł per m² (null =
              unknown), link to the shop */
window.HOUSE_MATERIALS = {
 "materials": {
  "plasterWhite": {"color": "#f4f3ef", "roughness": 0.94, "texture": {"strength": 0.55, "grain": 2, "tile": 110, "bump": 0}},
  "plasterInside": {"color": "#f2eee6", "roughness": 0.95, "texture": {"strength": 0.35, "grain": 2, "tile": 110, "bump": 0}},
  "graphite": {"color": "#45494d", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 2, "tile": 110, "bump": 0}},
  "roofGraphite": {"color": "#3a3d40", "roughness": 0.78, "texture": {"strength": 0.35, "grain": 2, "tile": 60, "bump": 0}},
  "frame": {"color": "#3b3e42", "roughness": 0.5, "metalness": 0.25},
  "steel": {"color": "#c9cccf", "roughness": 0.3, "metalness": 0.8},
  "glass": {"color": "#9fb5bf", "roughness": 0.02, "metalness": 0.1, "opacity": 0.3, "reflect": 1.6},
  "slab": {"color": "#f1efe9", "roughness": 0.95},
  "plinth": {"color": "#6d6e6c", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 3, "tile": 60, "bump": 0}},
  "tread": {"color": "#a57b4f", "roughness": 0.6},
  "fireplace": {"color": "#2b2b2c", "roughness": 0.6},
  "insulation": {"color": "#dcc35e", "roughness": 0.95},
  "lawn": {"color": "#6f8a52", "roughness": 1, "grass": {"tile": 120}},
  "paving": {"color": "#b9b6ae", "roughness": 0.9, "slabs": {"size": 60, "joint": "#6a675f"}},
  "woodVertical": {"wood": "H1180", "board": 12, "boardsVertical": true, "roughness": 0.7},
  "woodHorizontal": {"wood": "H1180", "board": 12, "boardsVertical": false, "roughness": 0.7}
 },
 "products": {
  "authorityGraphite": {
   "name": "Paradyż My Way Authority Graphite",
   "note": "gres szkliwiony rekt., mat, 8 mm",
   "texture": "authorityGraphite",
   "len": 898,
   "wid": 898,
   "joint": 2,
   "pattern": "grid",
   "price": 119.92,
   "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10702-paradyz-my-way-authority-graphite-gres-szkl-rekt-mat-898x898-g1"
  },
  "authorityGrey": {
   "name": "Paradyż My Way Authority Grey",
   "note": "gres szkliwiony rekt., mat, 8 mm",
   "texture": "authorityGrey",
   "len": 898,
   "wid": 898,
   "joint": 2,
   "pattern": "grid",
   "price": 135.91,
   "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10703-paradyz-my-way-authority-grey-gres-szkl-rekt-mat-898x898-g1"
  },
  "authorityGrey80": {
   "name": "Authority Grey 79, 8×79, 8 (format z projektu łazienki)",
   "note": "format jak w bath/data.js",
   "texture": "authorityGrey",
   "len": 798,
   "wid": 798,
   "joint": 2,
   "pattern": "grid",
   "price": null,
   "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10703-paradyz-my-way-authority-grey-gres-szkl-rekt-mat-898x898-g1"
  },
  "logOak": {
   "name": "Atlas Concorde Log Icon Oak Forest 30×120",
   "note": "gres z efektem dębu; sprawdź wersję wewnętrzną 9 mm",
   "texture": "H1180",
   "len": 1200,
   "wid": 300,
   "joint": 2,
   "pattern": "third",
   "price": null,
   "link": "https://www.atlasconcorde.com/pl/ac-kolekcja/log/icon-oak-forest/outdoor-sensitech-30x120-20-ax4a"
  },
  "brooks": {
   "name": "Gres Brooks 30×120 (Castorama)",
   "note": "brązowe drewno, mat, R9, PEI 4; 79, 17 zł za 1, 44 m² w promocji",
   "texture": "H1181",
   "len": 1200,
   "wid": 300,
   "joint": 2,
   "pattern": "third",
   "price": 54.98,
   "link": "https://www.castorama.pl/gres-brooks-30-x-120-cm-1-44-m2/5901503230480_CAPL.prd"
  },
  "egenLux": {
   "name": "Egen Lux Beige Carving 20×120 (Leroy Merlin)",
   "note": "rektyfikowany, mat, 9 mm",
   "texture": "H1180",
   "len": 1200,
   "wid": 200,
   "joint": 2,
   "pattern": "third",
   "price": 149,
   "link": "https://www.leroymerlin.pl/produkty/gres-szkliwiony-lux-beige-carving-20x120-egen-86508645.html"
  },
  "oredessa": {
   "name": "Arte Oredessa Wood Beige 19×119, 8 (Leroy Merlin)",
   "note": "gres szkliwiony drewnopodobny",
   "texture": "H1176",
   "len": 1198,
   "wid": 190,
   "joint": 2,
   "pattern": "third",
   "price": null,
   "link": "https://www.leroymerlin.pl/produkty/gres-szkliwiony-oredessa-wood-beige-19x119-8-arte-94085002.html"
  }
 }
};
