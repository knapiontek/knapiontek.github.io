/* library/shapes.js: its public API: one drawing per kind of product; it draws only in the browser (three.js), so here it is
   only made: making it touches nothing (test/test.md) */
function libraryShapesTest({ libraryShapesModule }, data, check) {
  const shapes = libraryShapesModule();
  check('the public API: a drawing per kind', Object.keys(shapes).join(' ') === 'oven microwave sink tap trap basin basinTap shaped mirror wallCabinet showerScreen linearDrain hob hood fridgeFreezer fridgeDoor dishwasher coffeeMachine pendant downlight leg grille shelfPin bumper hinge handle runner drawerPart bins cutleryInsert');
  const kinds = new Set(); for (const g of data('library/library.js').groups) for (const p of Object.values(data(`library/products/${g}.js`).products)) if (p.draw) kinds.add(p.draw);
  check('every drawing a product names is here', [...kinds].every(k => typeof shapes[k] === 'function'));
}
