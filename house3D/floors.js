/* "Dom w papawerach 5 (G)" - the floor tiles of view.html: products to choose from, the floor layouts and their
   defaults, the notes of the page. view.html holds no product, price or layout of this house; it reads this file.
   products   name, note (shown under the choice), texture = a key of textures.js, tile length and width in mm,
              joint mm, pattern (grid | half | third | quarter | random), price zł per m² (null = unknown), link to the shop
   layouts    one per floor finish: label, floor (ground | attic), the default product, the direction of the tile length
              (z = along the house, x = across), panelOpen false = its panel starts closed;
              the rooms of plan.js name their layout
   reserve    extra share of tiles to buy (cutting, breakage)
   notes      the notes of the page (Polish, may hold <code>) */
window.HOUSE_FLOORS = {
 "products": {
  "authorityGraphite": {"name": "Paradyż My Way Authority Graphite", "note": "gres szkliwiony rekt., mat, 8 mm", "texture": "authorityGraphite",
                        "len": 898, "wid": 898, "joint": 2, "pattern": "grid", "price": 119.92,
                        "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10702-paradyz-my-way-authority-graphite-gres-szkl-rekt-mat-898x898-g1"},
  "authorityGrey":     {"name": "Paradyż My Way Authority Grey", "note": "gres szkliwiony rekt., mat, 8 mm", "texture": "authorityGrey",
                        "len": 898, "wid": 898, "joint": 2, "pattern": "grid", "price": 135.91,
                        "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10703-paradyz-my-way-authority-grey-gres-szkl-rekt-mat-898x898-g1"},
  "authorityGrey80":   {"name": "Authority Grey 79,8×79,8 (format z projektu łazienki)", "note": "format jak w bath/data.js", "texture": "authorityGrey",
                        "len": 798, "wid": 798, "joint": 2, "pattern": "grid", "price": null,
                        "link": "https://www.abcplytki.pl/authority-paradyz-my-way/10703-paradyz-my-way-authority-grey-gres-szkl-rekt-mat-898x898-g1"},
  "logOak":            {"name": "Atlas Concorde Log Icon Oak Forest 30×120", "note": "gres z efektem dębu; sprawdź wersję wewnętrzną 9 mm", "texture": "H1180",
                        "len": 1200, "wid": 300, "joint": 2, "pattern": "third", "price": null,
                        "link": "https://www.atlasconcorde.com/pl/ac-kolekcja/log/icon-oak-forest/outdoor-sensitech-30x120-20-ax4a"},
  "brooks":            {"name": "Gres Brooks 30×120 (Castorama)", "note": "brązowe drewno, mat, R9, PEI 4; 79,17 zł za 1,44 m² w promocji", "texture": "H1181",
                        "len": 1200, "wid": 300, "joint": 2, "pattern": "third", "price": 54.98,
                        "link": "https://www.castorama.pl/gres-brooks-30-x-120-cm-1-44-m2/5901503230480_CAPL.prd"},
  "egenLux":           {"name": "Egen Lux Beige Carving 20×120 (Leroy Merlin)", "note": "rektyfikowany, mat, 9 mm", "texture": "H1180",
                        "len": 1200, "wid": 200, "joint": 2, "pattern": "third", "price": 149,
                        "link": "https://www.leroymerlin.pl/produkty/gres-szkliwiony-lux-beige-carving-20x120-egen-86508645.html"},
  "oredessa":          {"name": "Arte Oredessa Wood Beige 19×119,8 (Leroy Merlin)", "note": "gres szkliwiony drewnopodobny", "texture": "H1176",
                        "len": 1198, "wid": 190, "joint": 2, "pattern": "third", "price": null,
                        "link": "https://www.leroymerlin.pl/produkty/gres-szkliwiony-oredessa-wood-beige-19x119-8-arte-94085002.html"}
 },
 "layouts": {
  "ground":   {"label": "Parter", "floor": "ground", "product": "authorityGraphite", "dir": "z"},
  "attic":    {"label": "Piętro", "floor": "attic", "product": "logOak", "dir": "z"},
  "bathGrey": {"label": "Łazienka na piętrze", "floor": "attic", "product": "authorityGrey80", "dir": "z", "panelOpen": false}
 },
 "reserve": 0.1,
 "notes": [
  "Tekstury z Twojego repo: Authority z <code>bath/textures.js</code> (zdjęcie jednej płytki 898 mm), dąb to dekory Egger z <code>kitchen</code> i <code>bath</code>, użyte zastępczo za gres drewnopodobny. Rozmiar, fugę i teksturę zmieniasz niezależnie od produktu."
 ]
};
