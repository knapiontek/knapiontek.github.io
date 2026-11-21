/* room/docs.js: its public API, each part with what it gives, on every room with a docs file (test/test.md) */
async function docsTest({ docsModule, toolsModule, estimateModule, cabinetsModule, roomModule, geometryModule, surfaceModule, treeModule, plan2dModule, tilesModule, drawModule, catalogModule }, data, check) {
  const tools = toolsModule(), geometry = geometryModule(), cabinets = cabinetsModule();
  const docs = docsModule(tools, estimateModule(tools), cabinets);
  check('the public API', Object.keys(docs).join(' ') === 'create');

  /* each room as the page hands it in: prepared by room/room.js, with the library of library/catalog.js */
  const room = roomModule(geometry, surfaceModule(geometry), treeModule(), plan2dModule(geometry, tools), tilesModule(geometry), cabinets, drawModule());
  const library = await catalogModule(async path => data(path)).open();
  const house = data('house/house.js'), tiles = house.children.find(n => n.type === 'house').settings.tiles;
  const rooms = []; (function walk(n) { if ((n.files || []).includes('docs')) rooms.push(n); (n.children || []).forEach(walk); })(house);
  for (const n of rooms) {
    const P = room.prepare({ offset: [0, 0, 0], size: n.size, area: n.area, tiles }, { cabinets: data(`room/${n.id}.cabinets.js`), scene: data(`room/${n.id}.scene.js`) }, library);
    const D = docs.create({ model: P.model, tree: P.TREE, docs: data(`room/${n.id}.docs.js`), appliances: P.appliances, library });
    if (n === rooms[0]) check('create: the API of a room\'s Documents', Object.keys(D).join(' ') === 'book assembly warnings page fill nodes checks');
    const book = D.book();
    check(`${n.id} book: Estimate, Cut list and Notes`, ['Estimate', 'Cut list', 'Notes'].every(name => book.sheets.some(s => s.name === name)));
    check(`${n.id} checks: the tree counts as the model`, D.checks().every(c => c.items.length === 0));
    const cards = D.assembly();
    check(`${n.id} assembly: a legend and a card per carcass`, cards.legend.length > 0 && cards.cards.split('<div class="card">').length - 1 >= P.model.carcasses.length);
  }
}
