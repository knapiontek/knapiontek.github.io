/* house/docs.js: its public API on the house's own data: each sheet from what the page hands in (test/test.md) */
async function houseDocsTest({ houseDocsModule, houseModelModule, coreGeometryModule, coreTreeModule, libraryCatalogModule }, data, check) {
  const docs = houseDocsModule();
  check('the public API', Object.keys(docs).join(' ') === 'rooms doors tiles notes elements test');

  const house = data('house/house.js'), M = houseModelModule(coreGeometryModule(), coreTreeModule()).build(house);
  const library = await libraryCatalogModule(async path => data(path)).open();
  const rows = sheet => sheet.rows.filter(r => !r.kind).length;   // the rows of data (no title, head, category or sum)

  check('rooms: a row per room, and the note under them', rows(docs.rooms(M, M.ROOMS)) === M.ROOMS.length + 1);
  const doors = docs.doors(M.DOORS, M.FLOORS, library);
  check('doors: a row per thing bought for each door, a total', rows(doors) === M.DOORS.reduce((n, d) => n + 1 + d.extras.length, 0) && doors.rows.some(r => r.kind === 'sum'));
  const tile = { name: 'A tile', price: 100 }, count = { area: 2.5, tiles: 10, full: 6, cut: 4, small: 1 };
  const tiles = docs.tiles([{ P: tile, rooms: [M.ROOMS[0]], count }], 0.1);
  check('tiles: a layout\'s row, what is laid and the m² to buy with the reserve', tiles.rows.some(r => r.cells[0] === 'A tile' && r.cells[2] === '10 tiles: 6 whole, 4 cut, 1 small cuts' && r.cells[3] === 2.5));
  check('notes: the house\'s notes', rows(docs.notes(M.HOUSE)) === M.HOUSE.notes.length);

  const tree = docs.elements(M.HOUSE.name, house, [{ node: M.HOUSE, path: '', level: 1 }], () => null);
  check('elements: the site, the house, every room in it', tree.rows.filter(r => r.level !== undefined).length >= 2 + M.ROOMS.length);
  const test = docs.test('Test', [{ name: 'A check', about: 'what it checks', items: ['one', 'two'] }, { name: 'Fine', items: [] }]);
  check('test: a check with its items under it, a check with none OK', test.rows.some(r => r.cells[0] === 'A check' && r.cells[2] === '2') && test.rows.some(r => r.cells[0] === 'Fine' && r.cells[2] === 'OK'));
}
