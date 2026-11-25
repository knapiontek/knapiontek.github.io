/* house/model.js: its public API, each part with what it gives, on the house's own data (test/test.md) */
function houseModelTest({ houseModelModule, coreGeometryModule, coreTreeModule }, data, check) {
  const model = houseModelModule(coreGeometryModule(), coreTreeModule());
  check('the public API', Object.keys(model).join(' ') === 'build nav');

  const house = data('house/house.js'), M = model.build(house);
  check('build: the API of a model', Object.keys(M).join(' ') === 'T HOUSE ROOF TAN WIDTH RIDGE_TOP ROOF_UNDER floorOf SIDE OPENINGS ELEMENTS FLOORS ROOMS ROOM LAYOUTS BORDERS areaOf CELLS FIXTURES DOORS ROOF_CELLS STAIR_CELLS SITE_CELLS SOLIDS voidsAt FOOTPRINT part checks');

  const rooms = []; (function walk(n) { for (const c of n.children || []) { if (n.type === 'floor' && c.area) rooms.push(c.id); walk(c); } })(house);
  check('build: a room is a floor\'s child with an area, by its id', M.ROOMS.map(r => r.id).join() === rooms.join() && rooms.every(id => M.ROOM[id]));
  check('build: solids, doors and floors', M.CELLS.length > 0 && M.DOORS.length > 0 && M.FLOORS.length > 0);
  check('checks: no faults (what is only to know aside)', M.checks().filter(c => !c.info).every(c => c.items.length === 0));

  const inside = (a, b) => a[0] >= b[0] && a[1] <= b[1] && a[2] >= b[2] && a[3] <= b[3];
  check('part: every room\'s part has its solids, inside the roof\'s length and the house\'s width',
    M.ROOMS.every(r => { const p = M.part(r.id); return p.cells.length > 0 && inside(p.box, [M.ROOF.x[0], M.ROOF.x[1], 0, M.WIDTH]); }));

  const links = model.nav(house).links;
  check('nav: the whole house, then a room', links[0].name === 'House' && links[0].on === true && links[1].name === 'Room');
}
