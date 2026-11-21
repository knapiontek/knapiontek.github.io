/* A door. The house (house/model.js) makes each inner door: its leaf, the axis it turns on, its product; the house's plan
   (house/plan.js, drawn by core/plan2d.js) shows it open with its swing; the house's Documents (house/docs.js) buy it from
   the library at its price. */
async function doorExample({ libraryCatalogModule, coreGeometryModule, coreTreeModule, houseModelModule, coreToolsModule, corePlan2dModule, housePlanModule, houseDocsModule }, data, check) {
  const library = await libraryCatalogModule(async path => data(path)).open();
  const geometry = coreGeometryModule(), M = houseModelModule(geometry, coreTreeModule()).build(data('house/house.js'));
  const door = M.DOORS.find(d => d.product), product = library.product(door.product);
  check('a door of the house: a leaf, the axis it turns on, the library\'s product', door.cells.length > 0 && door.axis.length === 2 && !!product.name);

  const plan = housePlanModule(geometry, corePlan2dModule(geometry, coreToolsModule())).create(M, library.materials);
  const svg = plan.svg({ parts: [], still: [], doors: [door], furniture: [] });
  check('the plan draws it open: the leaf and its swing', svg.includes('fill="#fff" stroke="#5f6a66"') && svg.includes(' A '));

  const sheet = houseDocsModule().doors([door], M.FLOORS, library);
  const row = sheet.rows.find(r => r.cells[0] === door.label && r.cells[2] === product.name);
  check('the Documents buy it: its label, its product, the library\'s price', !!row && (product.price === null || row.cells[3].v === product.price));
  check('and what goes with it (a handle, a rosette): one row each', door.extras.every(k => sheet.rows.some(r => r.cells[0] === door.label && r.cells[2] === library.product(k).name)));
}
