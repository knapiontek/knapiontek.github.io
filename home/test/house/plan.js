/* house/plan.js: its public API on the house's own data: the whole house's plan, and one room's (test/test.md) */
function housePlanTest({ housePlanModule, houseModelModule, coreGeometryModule, coreTreeModule, corePlan2dModule, coreToolsModule }, data, check) {
  const geometry = coreGeometryModule(), plan2d = corePlan2dModule(geometry, coreToolsModule());
  const plan = housePlanModule(geometry, plan2d);
  check('the public API', Object.keys(plan).join(' ') === 'create');

  const M = houseModelModule(geometry, coreTreeModule()).build(data('house/house.js'));
  const P = plan.create(M, data('library/materials.js').materials);
  check('create: the API of a plan', Object.keys(P).join(' ') === 'svg note');

  const whole = P.svg({ parts: [], still: [], doors: M.DOORS, furniture: [] });
  check('svg: the whole house, a sheet per floor with its cut', whole.startsWith('<svg') && M.FLOORS.every(F => whole.includes(F.name + ' · cut ')));
  const part = M.part(M.ROOMS[0].id), one = P.svg({ parts: [part], still: part.cells, doors: [], furniture: [] });
  check('svg: a room\'s view, its floor only, its name', one.includes(M.ROOMS[0].node.name) && M.FLOORS.filter(F => one.includes(F.name + ' · cut ')).length === 1);
  check('note: each floor\'s cut', M.FLOORS.every(F => P.note().includes((F.name || F.id).toLowerCase())));
}
