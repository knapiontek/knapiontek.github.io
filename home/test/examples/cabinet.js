/* A cabinet in the Documents. The wardrobe's cabinets make their model (room/cabinets.js through room/model.js); its
   Documents (room/docs.js, with core/estimate.js) list every board in the cut list at its size, under a label, and the
   assembly cards gather the labels of each carcass. */
async function cabinetExample({ libraryCatalogModule, coreGeometryModule, coreTreeModule, roomTilesModule, roomCabinetsModule, libraryShapesModule, roomFurnitureModule, roomModelModule, coreToolsModule, coreEstimateModule, roomDocsModule }, data, check) {
  const library = await libraryCatalogModule(async path => data(path)).open();
  const geometry = coreGeometryModule(), cabinets = roomCabinetsModule(), furniture = roomFurnitureModule(cabinets, libraryShapesModule());
  const room = roomModelModule(geometry, coreTreeModule(), roomTilesModule(geometry), cabinets, furniture);
  const tools = coreToolsModule(), docs = roomDocsModule(tools, coreEstimateModule(tools), cabinets);

  const tiles = data('house/house.js').children.find(n => n.type === 'house').settings.tiles;
  const P = room.prepare({ offset: [0, 0, 0], size: [10000, 10000, 3000], tiles }, { cabinets: data('room/wardrobe_4.cabinets.js'), scene: data('room/wardrobe_4.scene.js') }, library);
  const D = docs.create({ model: P.model, tree: P.TREE, docs: data('room/wardrobe_4.docs.js'), appliances: P.appliances, library });

  const rows = D.book().sheets.find(s => s.name === 'Cut list').rows.filter(r => !r.kind && typeof r.cells[7] === 'number');
  const sized = b => rows.find(r => r.cells[2] === Math.max(b.a, b.b) && r.cells[4] === Math.min(b.a, b.b));
  check('every board of the model is in the cut list, at its size (the longer side first)', P.model.boards.every(sized));
  const cards = D.assembly().cards;
  check('every label of the cut list is on an assembly card', rows.every(r => cards.includes(r.cells[0])));
  check('the Documents count what the model has: nothing to correct', D.checks().every(c => c.items.length === 0));
}
