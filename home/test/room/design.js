/* room/design.js: its public API on every room with a cabinets file (test/test.md); its part(host) is the page's
   (Alpine, the document), tried on the page */
async function roomDesignTest({ roomDesignModule, roomCabinetsModule, coreToolsModule, coreUiModule, libraryCatalogModule }, data, check) {
  const tools = coreToolsModule(), cabinets = roomCabinetsModule();
  const design = roomDesignModule(cabinets, tools, coreUiModule(tools));
  check('the public API', Object.keys(design).join(' ') === 'rowsOf build readFile part');

  const library = await libraryCatalogModule(async path => data(path)).open();
  const boards = library.groups.boards, appliances = Object.assign({}, library.groups.appliances, library.groups.sanitary);
  const house = data('house/house.js'), rooms = [];
  (function walk(n) { if ((n.files || []).includes('cabinets')) rooms.push(n); (n.children || []).forEach(walk); })(house);
  for (const n of rooms) {
    const file = data(`room/${n.id}.cabinets.js`), text = cabinets.cabinetsText(file);
    const rows = design.rowsOf(file);
    if (n === rooms[0]) check('rowsOf: the tables of a file', Object.keys(rows).join(' ') === 'groups columns components notes');
    const built = design.build(file, rows, boards, appliances);
    check(`${n.id} build: the tables give the file back`, cabinets.cabinetsText(built.file) === text);
    check(`${n.id} build: no problem in the data, the fronts drawn`, built.warnings.length === 0 && built.svg.startsWith('<svg'));
    check(`${n.id} readFile: the file as written`, cabinets.cabinetsText(design.readFile(text)) === text);
  }
}
