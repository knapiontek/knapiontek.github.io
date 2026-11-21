/* room/parts.js: its public API; build() draws (three.js), so it is not called here: the page draws every room
   (test/test.md) */
async function roomPartsTest({ roomPartsModule, roomModelModule, coreGeometryModule, coreTreeModule, corePlan2dModule, coreToolsModule, roomTilesModule, roomCabinetsModule, roomFurnitureModule, libraryShapesModule, corePartsModule, libraryCatalogModule }, data, check) {
  const geometry = coreGeometryModule(), cabinets = roomCabinetsModule(), shapes = libraryShapesModule(), furniture = roomFurnitureModule(cabinets, shapes);
  const model = roomModelModule(geometry, coreTreeModule(), roomTilesModule(geometry), cabinets, furniture);
  const view = roomPartsModule(model, cabinets, furniture, shapes, corePartsModule(geometry), corePlan2dModule(geometry, coreToolsModule()));
  check('the public API', Object.keys(view).join(' ') === 'build layers');

  /* each furnished room prepared as the page does (room/model.js) */
  const library = await libraryCatalogModule(async path => data(path)).open();
  const house = data('house/house.js'), tiles = house.children.find(n => n.type === 'house').settings.tiles;
  const furnished = []; (function walk(n) { if ((n.files || []).includes('cabinets')) furnished.push(n); (n.children || []).forEach(walk); })(house);
  for (const n of furnished) {
    const P = model.prepare({ offset: [0, 0, 0], size: n.size, area: n.area, tiles }, { cabinets: data(`room/${n.id}.cabinets.js`), scene: data(`room/${n.id}.scene.js`) }, library);
    const L = view.layers(P);
    check(`${n.id} layers: a layer per group, and only what the room has`, Object.keys(P.model.groups).every(r => L['g' + r]) && (!L.worktopParts || P.model.worktopPieces.length > 0));
  }
}
