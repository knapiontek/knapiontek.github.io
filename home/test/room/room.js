/* room/room.js: its public API, each part with what it gives, on every room's files; build() draws (three.js), so it is
   not called here (test/test.md) */
async function roomTest({ roomModule, geometryModule, treeModule, plan2dModule, toolsModule, tilesModule, cabinetsModule, furnitureModule, shapesModule, drawingModule, catalogModule }, data, check) {
  const geometry = geometryModule(), cabinets = cabinetsModule();
  const room = roomModule(geometry, treeModule(), plan2dModule(geometry, toolsModule()), tilesModule(geometry), cabinets, furnitureModule(cabinets, shapesModule()), shapesModule(), drawingModule(geometry));
  check('the public API', Object.keys(room).join(' ') === 'prepare build layers');

  /* the library as the page has it (library/catalog.js), and each furnished room as the house hands it in: its size, its
     area, the house's tiles */
  const library = await catalogModule(async path => data(path)).open();
  const house = data('house/house.js'), tiles = house.children.find(n => n.type === 'house').settings.tiles;
  const furnished = []; (function walk(n) { if ((n.files || []).includes('cabinets')) furnished.push(n); (n.children || []).forEach(walk); })(house);
  for (const n of furnished) {
    const files = { cabinets: data(`room/${n.id}.cabinets.js`), scene: data(`room/${n.id}.scene.js`) };
    const P = room.prepare({ offset: [0, 0, 0], size: n.size, area: n.area, tiles }, files, library);
    check(`${n.id} prepare: the cabinets' model, a node per group and per fixture`, P.TREE.length === Object.keys(P.model.groups).length + P.FIXTURES.length + ((files.scene.builtIns || []).length ? 1 : 0));
    check(`${n.id} prepare: every group placed where the scene says`, Object.keys(files.scene.groups).every(r => P.PLACE[r]));
    check(`${n.id} prepare: the textures it needs, by key`, P.textures.every(t => typeof t === 'string'));
    if (files.scene.tiles) check(`${n.id} prepare: its tiles counted`, Object.keys(P.model.counts.tiles).length > 0);
    const L = room.layers(P);
    check(`${n.id} layers: a layer per group, and only what the room has`, Object.keys(P.model.groups).every(r => L['g' + r]) && (!L.worktopParts || P.model.worktopPieces.length > 0));
  }
}
