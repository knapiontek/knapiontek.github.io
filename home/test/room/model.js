/* room/model.js: its public API, each part with what it gives, on every room's files (test/test.md) */
async function roomModelTest({ roomModelModule, coreGeometryModule, coreTreeModule, roomTilesModule, roomCabinetsModule, roomFurnitureModule, libraryShapesModule, libraryCatalogModule }, data, check) {
  const geometry = coreGeometryModule(), cabinets = roomCabinetsModule();
  const room = roomModelModule(geometry, coreTreeModule(), roomTilesModule(geometry), cabinets, roomFurnitureModule(cabinets, libraryShapesModule()));
  check('the public API', Object.keys(room).join(' ') === 'prepare layTiles checks');

  /* the library as the page has it (library/catalog.js), and each furnished room as the house hands it in: its size, its
     area, the house's tiles */
  const library = await libraryCatalogModule(async path => data(path)).open();
  const house = data('house/house.js'), tiles = house.children.find(n => n.type === 'house').settings.tiles;
  const furnished = []; (function walk(n) { if ((n.files || []).includes('cabinets')) furnished.push(n); (n.children || []).forEach(walk); })(house);
  for (const n of furnished) {
    const files = { cabinets: data(`room/${n.id}.cabinets.js`), scene: data(`room/${n.id}.scene.js`) };
    const P = room.prepare({ offset: [0, 0, 0], size: n.size, area: n.area, tiles }, files, library);
    check(`${n.id} prepare: the cabinets' model, a node per group and per fixture`, P.TREE.length === Object.keys(P.model.groups).length + P.FIXTURES.length + ((files.scene.builtIns || []).length ? 1 : 0));
    check(`${n.id} prepare: every group placed where the scene says`, Object.keys(files.scene.groups).every(r => P.PLACE[r]));
    check(`${n.id} prepare: the textures it needs, by key`, P.textures.every(t => typeof t === 'string'));
    if (files.scene.tiles) {
      check(`${n.id} prepare: its tiles counted`, Object.keys(P.model.counts.tiles).length > 0);
      await library.loadTextures(P.textures);
      const laid = room.layTiles(P, { product: library.product, textures: library.textures }, { layers: ['tiles'] }, 'cuts');
      check(`${n.id} layTiles: pieces, and the counts prepare gave`, laid.pieces.length > 0 && JSON.stringify(laid.counts) === JSON.stringify(P.model.counts.tiles));
    }
    check(`${n.id} checks: the tree right, every group in its box`, room.checks(P).length === 0);
  }
}
