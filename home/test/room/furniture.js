/* room/furniture.js: its public API, each part with what it gives: every room's cabinets described, as data (core/describe.js)
   (test/test.md) */
async function furnitureTest({ furnitureModule, cabinetsModule, drawModule, describeModule, roomModule, geometryModule, treeModule, plan2dModule, toolsModule, tilesModule, catalogModule }, data, check) {
  const geometry = geometryModule(), cabinets = cabinetsModule(), draw = drawModule(), describe = describeModule(geometry);
  const furniture = furnitureModule(cabinets, draw);
  check('the public API', Object.keys(furniture).join(' ') === 'draw boardLooks');

  /* each furnished room prepared as the page does (room/room.js), with the library of library/catalog.js */
  const room = roomModule(geometry, treeModule(), plan2dModule(geometry, toolsModule()), tilesModule(geometry), cabinets, furniture, draw, describe);
  const library = await catalogModule(async path => data(path)).open();
  const house = data('house/house.js'), tiles = house.children.find(n => n.type === 'house').settings.tiles;
  const furnished = []; (function walk(n) { if ((n.files || []).includes('cabinets')) furnished.push(n); (n.children || []).forEach(walk); })(house);
  for (const n of furnished) {
    const scene = data(`room/${n.id}.scene.js`);
    const P = room.prepare({ offset: [0, 0, 0], size: n.size, area: n.area, tiles }, { cabinets: data(`room/${n.id}.cabinets.js`), scene }, library);
    const boards = furniture.boardLooks(P.model);
    check(`${n.id} boardLooks: a look per board material, its bare edge's too`, Object.keys(P.model.materials).every(code => boards['board:' + code]));
    const looks = Object.assign({}, library.materials, P.looks);   // the page's materials: the library's and the room's
    const D = describe.create({ place: P.PLACE, level: 0, looks, metal: scene.finish.metal, ceiling: P.ceiling });
    const drawn = furniture.draw(D, P.model, P.appliances, P.HW, scene.installation);
    check(`${n.id} draw: every carcass described, solids and moving fronts`, drawn.carcasses.length === P.model.carcasses.length && D.STATIC.length > 0 && D.MOVERS.length > 0);
    check(`${n.id} draw: nothing left undrawn`, D.UNDRAWN.length === 0);
    check(`${n.id} draw: every front that opens is a moving part`, P.model.fronts.filter(f => !f.open && f.type !== 'fixed').length <= D.MOVERS.length);
  }
}
