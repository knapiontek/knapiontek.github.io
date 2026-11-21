/* room/cabinets.js: its public API, each part with what it gives, on every room's cabinets (test/test.md) */
function roomCabinetsTest({ roomCabinetsModule }, data, check) {
  const C = roomCabinetsModule();
  check('the public API', Object.keys(C).join(' ') === 'TYPES TAGS TAG_NAMES LABELS typeLabel tagsLabel useLabel hasTag FRONT_TYPES SIDES HINGE_SIDES placeLabel gapsText parseTags spaceAround valueAt PINS_PER_SHELF tagsOf readType cutKey checkSettings build cutList plural appliances withLibrary tree boxIn coveredEdges cabinetsText');

  const products = {};
  for (const group of data('library/library.js').groups) products[group] = data(`library/products/${group}.js`).products;
  const rooms = []; (function walk(n) { if ((n.files || []).includes('cabinets')) rooms.push(n.id); (n.children || []).forEach(walk); })(data('house/house.js'));

  for (const id of rooms) {
    const file = data(`room/${id}.cabinets.js`), scene = data(`room/${id}.scene.js`);
    const project = C.withLibrary(file, products.boards);
    const appliances = C.appliances(project, Object.assign({}, products.appliances, products.sanitary));
    const model = C.build(project, appliances);
    check(`${id} build: its groups and carcasses, nothing stops it`, Object.keys(model.groups).length > 0 && model.carcasses.length > 0);
    check(`${id} cutList: the boards, the same ones in one row`, C.cutList(model.boards).length > 0 && C.cutList(model.boards).length <= model.boards.length);

    /* the hardware as drawn, as room/model.js hands it in: the products' sizes, the scene's layout */
    const has = key => products.hardware[file.settings.hardware[key]], L = scene.hardware;
    const HW = {
      handle: has('handle') && Object.assign({ cupLength: has('handle').length }, L.handle), open: L.open, bins: L.bins,
      leg: has('leg') && Object.assign({ radius: has('leg').radius, footRadius: has('leg').footRadius, footHeight: has('leg').footHeight }, L.leg),
      hinge: has('hinge') && { cupDepth: has('hinge').cupDepth },
      drawer: has('drawer') && { runnerWidth: has('drawer').runnerWidth, sideThickness: has('drawer').sideThickness, sideFromCarcass: has('drawer').sideFromCarcass, fromBack: has('drawer').fromBack, fromFront: has('drawer').fromFront },
      plinthGrille: has('plinthGrille') && { width: has('plinthGrille').width, bottom: L.plinthGrille.bottom, top: L.plinthGrille.bottom + has('plinthGrille').height }
    };
    check(`${id} tree: a node per group`, C.tree(model, appliances, { install: scene.installation, ceiling: 2600, HW }).length === Object.keys(model.groups).length);
    check(`${id} coveredEdges: a list`, Array.isArray(C.coveredEdges(model)));
    const text = C.cabinetsText(file);
    check(`${id} cabinetsText: the file written back is the same data`, JSON.stringify(JSON.parse(text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')))) === JSON.stringify(file));
  }
}
