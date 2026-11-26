// @ts-check
// test/samples/catalog.js: how the other modules use the library's catalog (types.js: Catalog), on its own data.

import { openCatalog } from '../../library/catalog.js';

/** @typedef {import('../../types.js').Board} Board */
/** @typedef {import('../../types.js').Tile} Tile */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /* index.js opens the catalog once */
  const catalog = await openCatalog();

  /* an estimate: a board by its key, its price per unit, the shop it is bought in */
  const board = /** @type {Board} */ (catalog.product('egger-u708-st9-18'));   // a board: its group says so, so it has a thickness
  check('an estimate: a board, 18 mm, a sheet 2800 × 2070 at 268.18 zł',
    board.group === 'boards' && board.thickness === 18 && board.length === 2800 && board.width === 2070 && board.unit === 'sheet' && board.price === 268.18);
  const bought = catalog.products('boards').map(k => catalog.product(k)).filter(p => p.shop);
  check('an estimate: each board bought in a shop, by its name', bought.length > 0 && bought.every(p => catalog.shop(/** @type {string} */ (p.shop)).name.length > 0));

  /* Finish: a tap in another metal, among its family */
  const tap = 'hansgrohe-tecturis-e-110-73010140';
  const metals = catalog.variants(tap).map(k => /** @type {string} */ (catalog.product(k).metal));
  check('Finish: the tap\'s family in brass and nickel', metals.join() === 'brass,nickel');
  check('Finish: the metals by their names', metals.map(m => catalog.material(m).name).join(' / ') === 'Gold (brass) / Silver (chrome, nickel)');
  const nickel = catalog.variants(tap).find(k => catalog.product(k).metal === 'nickel');
  check('Finish: the tap in nickel', nickel === 'hansgrohe-tecturis-e-110-73010000');

  /* a tile layout: a tile's size, joint, smallest piece; its texture, loaded when the tiles are drawn */
  const tile = /** @type {Tile} */ (catalog.product('paradyz-authority-graphite'));
  check('tiles: 898 × 898, joint 2, smallest piece 300 × 300, laid in a grid',
    tile.group === 'tiles' && tile.len === 898 && tile.wid === 898 && tile.joint === 2 && tile.minCut.join() === '300,300' && tile.pattern === 'grid');
  const image = await catalog.texture(tile.texture);
  check('tiles: its texture, stone, one image covers 898 × 898', image.kind === 'stone' && image.size.join() === '898,898' && image.faces.length > 0);

  /* the 2D plan: how a cut material is filled */
  check('2D: a block cut is filled dark, EPS hatched', catalog.material('block').plan === '#2d2f31' && typeof catalog.material('insulation').plan === 'object');
}
