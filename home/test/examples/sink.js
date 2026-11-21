/* The sink in its cabinet. The kitchen's cabinets file and the library make the cabinets' model (room/cabinets.js, through
   room/model.js); the sink is a product of the library, standing in the carcass made for it; the worktop is cut for it; the
   trap hangs under it. Then its parts: room/furniture.js puts the cabinets in, library/shapes.js the sink, into core/parts.js. */
async function sinkExample({ libraryCatalogModule, coreGeometryModule, coreTreeModule, roomTilesModule, roomCabinetsModule, libraryShapesModule, roomFurnitureModule, roomModelModule, corePartsModule }, data, check) {
  const library = await libraryCatalogModule(async path => data(path)).open();
  const geometry = coreGeometryModule(), cabinets = roomCabinetsModule(), furniture = roomFurnitureModule(cabinets, libraryShapesModule());
  const room = roomModelModule(geometry, coreTreeModule(), roomTilesModule(geometry), cabinets, furniture);

  const files = { cabinets: data('room/room_356.cabinets.js'), scene: data('room/room_356.scene.js') };
  const tiles = data('house/house.js').children.find(n => n.type === 'house').settings.tiles;
  const P = room.prepare({ offset: [0, 0, 0], size: [10000, 10000, 3000], tiles }, files, library);

  const sink = P.model.products.find(x => x.role === 'sink'), trap = P.model.products.find(x => x.role === 'trap');
  const carcass = P.model.carcasses.find(c => c.id === sink.carcassId), key = files.cabinets.appliances.sink.product;
  check('the sink: the library\'s product the cabinets file names', sink.node.name === library.product(key).name);
  check('it stands in a carcass made for a sink, within its width', carcass.sink && sink.box[0] >= carcass.x0 && sink.box[1] <= carcass.x1);
  const cut = P.model.worktops[sink.group].cutouts.find(c => c.kind === 'sink');
  check('the worktop is cut for it: the hole inside the sink\'s rim', cut.x0 > sink.box[0] && cut.x1 < sink.box[1] && cut.y0 > sink.box[2] && cut.y1 < sink.box[3]);
  check('the trap hangs under it, in the same carcass', trap.box[5] === sink.box[4] && trap.box[0] >= carcass.x0 && trap.box[1] <= carcass.x1);

  const parts = corePartsModule(geometry).create({ place: P.PLACE, level: 0, looks: Object.assign({}, library.materials, P.looks), metal: files.scene.finish.metal, ceiling: P.ceiling });
  furniture.draw(parts, P.model, P.appliances, P.HW, files.scene.installation);
  check('its parts: the sink drawn by the library (details on the layer sink), nothing left undrawn', parts.DETAILS.some(d => d.layers.includes('sink')) && parts.UNDRAWN.length === 0);
}
