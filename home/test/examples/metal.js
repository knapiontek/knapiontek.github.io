/* Another metal. Bathroom 7's finish is chosen in another metal (room/model.js finish): every product of a family that the
   library has in that metal (library/catalog.js variant) is swapped for it; the room's checks of its finish stay clean. */
async function metalExample({ libraryCatalogModule, coreGeometryModule, coreTreeModule, roomTilesModule, roomCabinetsModule, libraryShapesModule, roomFurnitureModule, roomModelModule }, data, check) {
  const library = await libraryCatalogModule(async path => data(path)).open();
  const geometry = coreGeometryModule(), cabinets = roomCabinetsModule();
  const room = roomModelModule(geometry, coreTreeModule(), roomTilesModule(geometry), cabinets, roomFurnitureModule(cabinets, libraryShapesModule()));

  const files = { cabinets: data('room/bathroom_7.cabinets.js'), scene: data('room/bathroom_7.scene.js'), docs: data('room/bathroom_7.docs.js') };
  const all = Object.assign({}, ...Object.values(library.groups)), keys = f => (JSON.stringify(f).match(/"[^"]+"/g) || []).map(s => s.slice(1, -1)).filter(k => all[k]);
  const was = files.scene.finish.metal, metal = library.metals.map(m => m.k).find(k => k !== was);
  const finished = room.finish(files, { metal }, library);
  check('the room\'s metal is the one chosen', finished.scene.finish.metal === metal && files.scene.finish.metal === was);

  const metalOnes = keys(files).filter(k => all[k].metal && all[k].family);
  check('it has products in a metal, of a family', metalOnes.length > 0);
  const now = keys(finished);
  check('each is now its family\'s product in that metal, where the family has one', metalOnes.every(k => {
    const other = Object.keys(all).find(j => all[j].family === all[k].family && all[j].metal === metal);
    return other ? now.includes(other) && !now.includes(k) : now.includes(k);
  }));
  const tiles = data('house/house.js').children.find(n => n.type === 'house').settings.tiles;
  const P = room.prepare({ offset: [0, 0, 0], size: [10000, 10000, 3000], tiles }, finished, library);
  check('the checks of its finish: what the library has in that metal is in it', room.finishChecks(finished, P, library)[1].items.length === 0);
}
