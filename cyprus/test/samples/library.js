// @ts-check
// test/samples/library.js: how the other modules use the library (types.js: Library), on its own data.

/**
 * @param {{ libraryCatalogModule: LibraryModule }} modules
 * @param {string} base  the project folder's address, ending in /
 * @param {(what: string, ok: boolean) => void} check
 */
async function librarySample({ libraryCatalogModule }, base, check) {
  /* index.js opens the library once, from the page's folder */
  const library = await libraryCatalogModule(base).open();

  /* an estimate: a board by its key, its price per unit, the shop it is bought in */
  const board = library.product('egger-u708-st9-18');
  if (board.group !== 'boards') throw new Error('not a board');          // the group tells the fields: a board has a thickness
  check('an estimate: a board, 18 mm, a sheet 2800 × 2070 at 268.18 zł',
    board.thickness === 18 && board.length === 2800 && board.width === 2070 && board.unit === 'sheet' && board.price === 268.18);
  const bought = library.products('boards').map(k => library.product(k)).filter(p => p.shop);
  check('an estimate: each board bought in a shop, by its name', bought.length > 0 && bought.every(p => library.shop(/** @type {string} */ (p.shop)).name.length > 0));

  /* Finish: a tap in another metal, among its family */
  const tap = 'hansgrohe-tecturis-e-110-73010140';
  const metals = library.variants(tap).map(k => /** @type {string} */ (library.product(k).metal));
  check('Finish: the tap\'s family in brass and nickel', metals.join() === 'brass,nickel');
  check('Finish: the metals by their names', metals.map(m => library.material(m).name).join(' / ') === 'Gold (brass) / Silver (chrome, nickel)');
  const nickel = library.variants(tap).find(k => library.product(k).metal === 'nickel');
  check('Finish: the tap in nickel', nickel === 'hansgrohe-tecturis-e-110-73010000');

  /* a tile layout: a tile's size, joint, smallest piece; its texture, loaded when the tiles are drawn */
  const tile = library.product('paradyz-authority-graphite');
  if (tile.group !== 'tiles') throw new Error('not a tile');
  check('tiles: 898 × 898, joint 2, smallest piece 300 × 300, laid in a grid',
    tile.len === 898 && tile.wid === 898 && tile.joint === 2 && tile.minCut.join() === '300,300' && tile.pattern === 'grid');
  const image = await library.texture(tile.texture);
  check('tiles: its texture, stone, one image covers 898 × 898', image.kind === 'stone' && image.size.join() === '898,898' && image.faces.length > 0);

  /* the 2D plan: how a cut material is filled */
  check('2D: a block cut is filled dark, EPS hatched', library.material('block').plan === '#2d2f31' && typeof library.material('insulation').plan === 'object');
}
