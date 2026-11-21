/* A floor of one piece. The house (house/model.js) sets one tile layout over the ground floor's rooms, room 356 among
   them; room/tiles.js lays it over them all from one origin, through the doors; its slab has edges only round its outline;
   the house's Documents (house/docs.js) buy what is laid. */
async function floorExample({ libraryCatalogModule, coreGeometryModule, coreTreeModule, houseModelModule, roomTilesModule, houseDocsModule }, data, check) {
  const library = await libraryCatalogModule(async path => data(path)).open();
  const geometry = coreGeometryModule(), house = data('house/house.js');
  const M = houseModelModule(geometry, coreTreeModule()).build(house), tiles = roomTilesModule(geometry);

  const D = M.LAYOUTS.find(l => l.rooms.some(r => r.id === 'room_356')), P = library.product(D.product);
  const passages = M.OPENINGS.filter(o => M.HOUSE.geometry.openingKinds[o.kind].passage).map(o => o.b);
  const laying = { product: D.product, dir: D.dir, pattern: D.pattern || P.pattern, oa: D.oa ?? null, ob: D.ob ?? null };
  const F = tiles.floor(laying, P, D.rooms, passages, D.floor.offset[2]);
  check('one layout, one origin, over every room of it', F.laid.length === D.rooms.length && F.count.tiles > 0);
  check('room 356 is one zone with the rooms it meets: tiles run across', new Set(F.laid.filter(r => r.id === 'room_356').map(r => r.zone)).size === 1);

  const rects = F.laid.flatMap(r => r.rects), on = (x, y) => rects.some(q => x > q[0] && x < q[1] && y > q[2] && y < q[3]);
  check('the slab\'s edges only round its outline: the floor on one side of each, never on both', tiles.outline(rects).every(([p, q]) => {
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = Math.hypot(q[0] - p[0], q[1] - p[1]), left = [-(q[1] - p[1]) / d, (q[0] - p[0]) / d];
    return on(m[0] + left[0], m[1] + left[1]) !== on(m[0] - left[0], m[1] - left[1]);
  }));
  const sheet = houseDocsModule().tiles([{ P, rooms: D.rooms, count: F.count }], house.children.find(n => n.type === 'house').settings.tiles.reserve);
  check('the Documents buy what is laid: its tiles, its area', sheet.rows.some(r => r.cells[0] === P.name && String(r.cells[2]).startsWith(F.count.tiles + ' tiles') && r.cells[3] === Math.round(F.count.area * 100) / 100));
}
