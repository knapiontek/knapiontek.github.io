// @ts-check
// test/room/cabinets.js: room/cabinets.js by use cases, as the project uses it on the kitchen's file (room_356.cabinets.json):
// the designer's file read and laid out; the tree the scene hangs in the room; the model's axes; the boards the maker cuts; the
// appliances in their places; what goes inside (the hardware, products of the library); the same file, the same nodes; the
// designer's mistakes: what stops the build, what is skipped. Every exported function in one.

import * as API from '../../room/cabinets.js';
import { cabinetsOf } from '../../room/cabinets.js';
import { openCatalog } from '../../library/catalog.js';
import { createHierarchy } from '../../core/hierarchy.js';
import { shapeOf } from '../../library/shapes.js';

/** @typedef {import('../../room/cabinets.js').CabinetNode} CabinetNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const catalog = await openCatalog();
  const file = await (await fetch(new URL('../../room/room_356.cabinets.json', import.meta.url))).json();
  /** @param {() => unknown} f */
  const throws = f => { try { f(); return false; } catch { return true; } };

  /* --- use case: the designer's kitchen file, read and laid out: groups of columns, components stacked, carcasses by name --- */
  const { groups, layout, problems } = cabinetsOf(file, catalog);
  const carcass = (/** @type {string} */ name) => layout.flatMap(G => G.carcasses).find(c => c.name === name);
  check('the kitchen: no problems' + (problems.length ? ': ' + problems.map(p => p.text).join(' | ') : ''), problems.length === 0);
  check('three groups, g1 g2 g3; the carcasses by name, in their groups', groups.map(g => g.id).join() === 'g1,g2,g3'
    && layout.map(G => G.carcasses.map(c => c.name).join(' ')).join(' | ') === 'K11 K12 K13 K1X | K21 K22 K23 K24 K25 K26 K27 K28 K29 K2X | K31 K32');
  check('their kinds: a base under the worktop, with a hob; a sink', carcass('K11')?.kind === 'base' && carcass('K11')?.flags.join() === 'hob' && carcass('K12')?.flags.join() === 'sink');
  check('the stack: K21 on the spaces of group 2 (plinth 150 + 720 + 38): at 908, on the worktop of group 1', carcass('K21')?.h0 === 908 && carcass('K21')?.kind === 'wall');
  check('a tall one on the plinth (four legs), the oven\'s; a fridge\'s with a grille', carcass('K25')?.kind === 'tall' && carcass('K25')?.legs === 4 && carcass('K27')?.flags.join() === 'fridge' && carcass('K27')?.grille === true);

  /* --- use case: the scene hangs the groups in the room: a carcass under the worktop or the plasterboard over it, measured from it --- */
  /** a node by its path in a group @param {CabinetNode} g @param {string} path */
  const at = (g, path) => path.split('/').reduce((/** @type {CabinetNode | undefined} */ n, id) => n?.children?.find(c => c.id === id), g);
  const [g1, g2, g3] = groups, k11 = at(g1, 'worktop/K11');
  check('K11 under the worktop, measured from it: 59 from its left, 28 from the wall, 720 under it', k11?.offset.join() === '59,-28,-720' && k11?.size.join() === '800,-550,720');
  check('the worktop from the wall (its zero) to 20 before the fronts: 28 + 550 + 2 + 18 + 20', at(g1, 'worktop')?.offset.join() === '0,0,870' && at(g1, 'worktop')?.size.join() === '3513,-618,38');
  check('the tall units under the plasterboard over them, 14 from it', ['K21', 'K23', 'K25', 'K27', 'K29'].every(k => at(g2, 'plasterboard_1/' + k)?.offset[1] === -14) && at(g2, 'plasterboard_1/K21')?.offset[2] === 908 - 2568);
  check('the island\'s carcasses 310 from the back of its worktop; its back panel', at(g3, 'worktop/K31')?.offset[1] === -310 && !!at(g3, 'islandBackPanel'));
  check('a carcass\'s modules bottom up: the oven, the microwave in K25', (at(g2, 'plasterboard_1/K25')?.children || []).filter(c => c.type !== 'product').map(c => c.id).join() === 'cabinet_1,oven,microwave,cabinet_2');
  check('what runs along a group, its layer', at(g1, 'plinth')?.layer === 'plinth' && at(g1, 'strip_1')?.layer === 'strips' && at(g1, 'worktop')?.layer === 'worktop' && k11?.layer === 'boards');

  /* --- use case: the model's axes: the designer measures from the wall, the model has y the other way --- */
  /** @param {CabinetNode} n @returns {CabinetNode[]} */
  const sizes = n => [n, ...(n.children || []).flatMap(sizes)];
  check('every node from its zero at its back toward the room: a negative y', groups.flatMap(sizes).every(n => n.size[1] < 0 && n.size[0] > 0 && n.size[2] > 0));
  const H = createHierarchy(/** @type {CabinetNode} */ (JSON.parse(JSON.stringify(g1))));
  check('K11 in its group, 28 – 578 from the wall at y −28 – −578', H.box(/** @type {CabinetNode} */ (H.node('worktop/K11'))).join() === '59,859,-578,-28,150,870');
  check('a group, a hierarchy: sound', H.checks().filter(c => !c.info).every(c => c.items.length === 0));

  /* --- use case: the maker cuts the boards: every body a board of the library, a material, or the room's metal --- */
  {
    /** @type {string[]} */
    const bad = [];
    let bodies = 0;
    const looks = new Set(catalog.materials());
    for (const n of groups.flatMap(sizes)) for (const p of n.parts || []) {
      bodies++;
      if (p.material.startsWith('board:')) { try { catalog.product(p.material.slice(6)); } catch { bad.push(p.material); } }
      else if (p.material !== 'metal' && !looks.has(p.material)) bad.push(p.material);
    }
    check('every body: a board of the library, a material, the room\'s metal (' + bodies + ')' + (bad.length ? ': not ' + bad.join(', ') : ''), bodies > 150 && bad.length === 0);
    const k11b = (k11?.parts || []).filter(p => p.form === 'box' && !p.layer).map(p => /** @type {number[]} */ (p.box));
    check('K11: two sides 18 thick, the whole carcass high, from its back (y 0) to its front (y −550)', k11b.filter(b => b[1] - b[0] === 18 && b[5] - b[4] === 720 && b[2] === -550 && b[3] === 0).length === 2);
    check('K11 under the hob: the front rail on edge, 50; the panel under the hob', k11b.some(b => b[5] === 720 && b[4] === 670 && b[2] === -550) && (k11?.parts || []).some(p => p.material === 'board:egger-u708-st9-16'));
    const front = (at(g1, 'worktop/K11/drawer_1')?.parts || []).filter(p => p.layer === 'doorsAndDrawers');
    check('a shaker front: its frame of four rails and its panel, recessed; less its gaps (3 at the sides and the top)', front.length === 5
      && Math.min(...front.map(p => /** @type {number[]} */ (p.box)[0])) === 3 && Math.max(...front.map(p => /** @type {number[]} */ (p.box)[1])) === 797 && Math.max(...front.map(p => /** @type {number[]} */ (p.box)[5])) === 417);
    check('the fronts in their plane: 2 before the carcass, 18 thick (y −552 – −570)', front.every(p => /** @type {number[]} */ (p.box)[2] >= -570 && /** @type {number[]} */ (p.box)[3] <= -552));
    check('K23: a back behind its doors, fixed shelf at the joint, shelves behind the doors', (at(g2, 'plasterboard_1/K23')?.parts || []).filter(p => p.layer === 'backs').length === 1
      && (at(g2, 'plasterboard_1/K23')?.parts || []).filter(p => p.layer === 'shelves' && p.material.startsWith('board:')).length === 1 + 1 + 3);
    check('the worktop open at the sink\'s and the hob\'s cut-outs (their makers\')', (at(g1, 'worktop')?.parts || []).length > 4);
    check('drawers behind K25\'s door: two boxes of 5 boards', (at(g2, 'plasterboard_1/K25/cabinet_1')?.parts || []).filter(p => p.layer === 'drawers').length === 2 * 5);
  }

  /* --- use case: the appliances in their places: each a node of the library's product, placed by its anchor --- */
  const product = (/** @type {CabinetNode | undefined} */ n) => /** @type {any} */ (n)?.product;
  {
    check('the oven and the microwave in their modules of K25', product(at(g2, 'plasterboard_1/K25/oven/oven')) === 'bosch-hba534bb3' && product(at(g2, 'plasterboard_1/K25/microwave/microwave')) === 'bosch-bfl623mb3');
    check('the fridge-freezer in K27, the coffee machine on K21\'s pull-out shelf', product(at(g2, 'plasterboard_1/K27/fridge')) === 'bosch-kis86afe0' && product(at(g2, 'plasterboard_1/K21/coffee')) === 'delonghi-dinamica');
    check('the dishwasher in its bay, on its feet (55)', product(at(g1, 'dishwasher/dishwasher')) === 'bosch-smv4hvx00e' && at(g1, 'dishwasher/dishwasher')?.offset[2] === 55 - 150);
    check('the sink in K12\'s cut-out, the hob in K11\'s', product(at(g1, 'worktop/K12/sink')) === 'ikea-kilsviken' && product(at(g1, 'worktop/K11/hob')) === 'electrolux-cit61443');
    const tap = /** @type {any} */ (at(g1, 'worktop/K12/sinkTap')), trap = /** @type {any} */ (at(g1, 'worktop/K12/trap'));
    check('the tap (Deante Silia) on the worktop behind the sink', tap?.type === 'product' && tap.product === 'deante-silia-bqs-z73m' && tap.layer === 'sink');
    check('the trap (Deante ZXY 9917) as short as its maker allows, its outlet at the wall (the drain 320 from it: reach 234)', trap?.product === 'deante-space-saver-zxy-9917' && trap.options.drop === 250 && trap.options.reach === 234 && trap.options.toWall === 0);
    const hood = at(g1, 'hood');
    check('the hood over the hob, on the wall, its bottom at 1500; to the ceiling (the room\'s)', product(hood) === 'electrolux-lfv416k' && hood?.offset[1] === 0 && hood?.offset[2] === 1498 && /** @type {any} */ (hood).ceiling === true);
  }

  /* --- use case: what goes inside: the hardware, each piece a node of the library's product with its holes --- */
  {
    /** what is drawn of a node: its parts, or its product's shape (its layer the node's) @param {CabinetNode | undefined} n @returns {any[]} */
    const drawn = n => !n ? [] : n.parts || (/** @type {any} */ (n).product ? shapeOf(catalog.product(/** @type {any} */ (n).product), n.size.map(Math.abs), /** @type {any} */ (n).options).parts.map(p => ({ ...p, layer: p.layer ?? n.layer })) : []);
    /** what is drawn of a node and under it @param {CabinetNode | undefined} n */
    const under = n => !n ? [] : sizes(n).flatMap(drawn);
    check('the hardware: nodes of the library\'s products (hinges, bumpers, drawer systems, runners, pins, handles, legs, grilles)', ['blum-clip-top-blumotion-110-71b3550', 'blum-servo-drive-993-0530', 'blum-tandembox-antaro-d-500',
      'shelf-pins-5-zinc', 'ikea-eneryda-shell-brass', 'hafele-axilo-h150', 'gtv-plinth-grille-480x60', 'blum-movento-760h5000s'].every(k => groups.flatMap(sizes).some(n => product(n) === k)));
    const k23 = under(at(g2, 'plasterboard_1/K23')), door = under(at(g2, 'plasterboard_1/K23/cabinet_2'));
    check('hinges: three on the 1200 door, two on the 720 one (plate and arm on the side, the cup in the door)', k23.filter(p => p.layer === 'hardware' && p.form === 'box').length === 2 * (3 + 2)
      && door.filter(p => p.layer === 'hardware' && p.form === 'cylinder').length === 2 * 3);
    check('bumpers opposite the hinges; shelf pins under the adjustable shelves (4 each)', k23.filter(p => p.material === 'gasket').length === 5 && k23.filter(p => p.layer === 'shelves' && p.material === 'zinc').length === 4 * 4);
    const sinkDrawer = under(at(g1, 'worktop/K12/drawer_1')), cutlery = under(at(g3, 'worktop/K31/drawer_2'));
    check('a drawer of the system: its metal sides and gallery rails (D); the sink\'s with bins (3)', sinkDrawer.filter(p => p.material === 'drawerSide').length === 2 + 2 && sinkDrawer.filter(p => p.material === 'binGrey').length === 3 * 5);
    check('an inner drawer for cutlery: its sides and front, the insert', cutlery.filter(p => p.material === 'insertGrey').length === 5 && cutlery.filter(p => p.material === 'drawerSide').length === 2 + 2 + 1);
    const runner = /** @type {any} */ (catalog.product(file.settings.hardware.runner));
    check('drawers behind a door on the runner\'s family, as high as the runner (' + runner.height + ')', under(at(g2, 'plasterboard_1/K25')).some(p => p.material === 'zinc' && p.box && p.box[5] - p.box[4] === runner.height));
    const handles = groups.flatMap(under).filter(p => p.layer === 'handles' && p.box).map(p => /** @type {number[]} */ (p.box)), eneryda = /** @type {any} */ (catalog.product(file.settings.hardware.handle)).length;
    check('a cup handle as its maker gives it (ENERYDA, ' + eneryda + ' long, 30 deep), on every front with one, its two holes', handles.some(b => b[1] - b[0] === eneryda || b[5] - b[4] === eneryda) && handles.some(b => Math.abs(b[3] - b[2]) === 30 || Math.abs(b[3] - b[2]) === 27)
      && under(g1).filter(p => p.layer === 'handles' && p.material === 'metal').length === 5 * 6 && under(g2).filter(p => p.layer === 'handles').length === 5 * 14 && under(g1).filter(p => p.material === 'markerHandle').length === 2 * 6);
    check('legs: four under a carcass on the plinth; a grille before the oven\'s and the fridge\'s', under(g1).filter(p => p.layer === 'legs').length === 2 * 4 * 4
      && under(at(g2, 'plasterboard_1/K25')).some(p => p.layer === 'plinth') && under(at(g2, 'plasterboard_1/K27')).some(p => p.layer === 'plinth'));
    check('the holes: their markers in the layer Holes', groups.flatMap(under).filter(p => p.layer === 'holes').length > 200);
  }

  /* --- use case: the same file twice: the same nodes --- */
  check('the same file, the same nodes', JSON.stringify(cabinetsOf(file, catalog).groups) === JSON.stringify(groups));

  /* --- use case: the designer's mistakes: what stops the build (thrown, with what to correct), what is skipped (a problem) --- */
  {
    const copy = () => JSON.parse(JSON.stringify(file));
    /** what stops the build @param {any} f */
    const stopped = f => { try { cabinetsOf(f, catalog); return ''; } catch (e) { return String(e); } };
    check('a file of another version', throws(() => cabinetsOf({ ...copy(), version: 2 }, catalog)));
    const noDepth = copy(); delete noDepth.settings.carcass.depth;
    check('a setting missing (carcass.depth)', stopped(noDepth).includes('settings: carcass.depth missing.'));
    const noM = copy(); delete noM.settings.hardware.drawerM;
    check('a product the file needs, none chosen (drawerM)', stopped(noM).includes('settings.hardware.drawerM: none.'));
    const other = copy(); other.settings.hardware.drawer = 'shelf-pins-5-zinc';
    check('a product of another kind (a shelf pin for a drawer system)', stopped(other).includes('settings.hardware.drawer: shelf-pins-5-zinc is no drawerSystem.'));
    const oven = copy(); oven.settings.appliances.sink.product = 'bosch-hba534bb3';
    check('an oven for a sink', stopped(oven).includes('settings.appliances.sink: bosch-hba534bb3 is no sink.'));
    const noOffset = copy(); delete noOffset.groups[0].carcass;
    check('a group without its carcasses\' offset (its own or the settings\')', throws(() => cabinetsOf(noOffset, catalog)));
    const bad = copy();
    bad.components.push({ group: 1, column: 4, span: 1, type: 'shelf', height: 100 }, { group: 1, column: 12, span: 3, type: 'space', height: 10 }, { group: 9, column: 1, type: 'space', height: 1 });
    const skipped = cabinetsOf(bad, catalog).problems.filter(p => p.skipped).map(p => p.text);
    check('components skipped, the rest built: an unknown type, beyond the columns, no such group', skipped.length === 3 && skipped.some(t => t.includes('unknown type "shelf"')) && skipped.some(t => t.includes('runs out')) && skipped.some(t => t.includes('no group 9')));
  }

  /* every function of the API in a use case */
  check('the API: cabinetsOf, in every use case; nothing else exported', Object.keys(API).filter(k => typeof (/** @type {any} */ (API))[k] === 'function').join() === 'cabinetsOf');
}
