/* room/cabinets.js: its public API, each part with what it gives, on every room's cabinets (test/test.md) */
function cabinetsTest({ cabinetsModule, drawModule }, data, check) {
  /* in place of library/draw.js (three.js): its drawings, each only counting that it was asked */
  let drawn = 0;
  const drawings = Object.fromEntries(Object.keys(drawModule()).map(kind => [kind, () => { drawn++; }]));
  const C = cabinetsModule(drawings);
  check('the public API', Object.keys(C).join(' ') === 'TYPES TAGS TAG_NAMES LABELS typeLabel tagsLabel useLabel hasTag FRONT_TYPES SIDES HINGE_SIDES placeLabel gapsText parseTags spaceAround valueAt PINS_PER_SHELF tagsOf readType cutKey checkSettings build cutList plural appliances withLibrary tree boxIn draw boardLooks coveredEdges cabinetsText');

  const products = {};
  for (const group of data('library/library.js').groups) products[group] = data(`library/products/${group}.js`).products;
  const rooms = []; (function walk(n) { if ((n.files || []).includes('cabinets')) rooms.push(n.id); (n.children || []).forEach(walk); })(data('house/house.js'));

  const built = rooms.map(id => {
    const file = data(`room/${id}.cabinets.js`), scene = data(`room/${id}.scene.js`);
    const project = C.withLibrary(file, products.boards);
    const appliances = C.appliances(project, Object.assign({}, products.appliances, products.sanitary));
    const model = C.build(project, appliances);
    check(`${id} build: its groups and carcasses, nothing stops it`, Object.keys(model.groups).length > 0 && model.carcasses.length > 0);
    check(`${id} cutList: the boards, the same ones in one row`, C.cutList(model.boards).length > 0 && C.cutList(model.boards).length <= model.boards.length);

    /* the hardware as drawn, as room/room.js hands it in: the products' sizes, the scene's layout */
    const has = key => products.hardware[file.settings.hardware[key]], L = scene.hardware;
    const HW = {
      handle: has('handle') && Object.assign({ cupLength: has('handle').length }, L.handle), open: L.open, bins: L.bins,
      leg: has('leg') && Object.assign({ radius: has('leg').radius, footRadius: has('leg').footRadius, footHeight: has('leg').footHeight }, L.leg),
      hinge: has('hinge') && { cupDepth: has('hinge').cupDepth },
      drawer: has('drawer') && { runnerWidth: has('drawer').runnerWidth, sideThickness: has('drawer').sideThickness, sideFromCarcass: has('drawer').sideFromCarcass, fromBack: has('drawer').fromBack, fromFront: has('drawer').fromFront },
      plinthGrille: has('plinthGrille') && { width: has('plinthGrille').width, bottom: L.plinthGrille.bottom, top: L.plinthGrille.bottom + has('plinthGrille').height }
    };
    check(`${id} tree: a node per group`, C.tree(model, appliances, { install: scene.installation, ceiling: 2600, HW }).length === Object.keys(model.groups).length);
    check(`${id} boardLooks: a look per board`, Object.keys(C.boardLooks(model)).length > 0);
    check(`${id} coveredEdges: a list`, Array.isArray(C.coveredEdges(model)));
    const text = C.cabinetsText(file);
    check(`${id} cabinetsText: the file written back is the same data`, JSON.stringify(JSON.parse(text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')))) === JSON.stringify(file));
    return { id, model, appliances, HW, scene };
  });

  /* draw, into a drawing context (room/room.js's) that only counts what it is asked to draw; what a call gives back is a
     blank that takes any use */
  const blank = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : blank(), apply: () => blank() });
  const D = { STATIC: [], frame: () => ({ X: [1, 0], Y: [0, 1] }), has: () => true, material: () => ({}), metal: 'steel', V: blank() };
  for (const name of ['box', 'at', 'detail', 'cylinder', 'display', 'mover', 'linkTo', 'envelope', 'openFront', 'openTop', 'profile', 'part', 'lamp', 'point', 'pivot'])
    D[name] = () => { drawn++; return blank(); };
  for (const b of built) {
    drawn = 0; C.draw(D, b.model, b.appliances, b.HW, b.scene.installation);
    check(`${b.id} draw: its solids drawn`, drawn > 0);
  }
}
