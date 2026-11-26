// @ts-check
// test/samples/tree.js: how the other modules use the tree, on a piece of the house (archon/analysis.md, x East, y South):
// the Ground Floor, its left wall with the garage window, room 356 with a cabinet whose front hangs on it and whose sink
// stands on it.

import { createTree } from '../../core/tree.js';

/** @typedef {import('../../core/tree.js').TreeNode} TreeNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /* the data: each node where it stands or hangs, its offset from its parent */
  /** @type {TreeNode} */
  const house = { id: 'house', type: 'house', offset: [0, 0, 0], size: [13200, 9100, 8820], children: [
    { id: 'groundFloor', type: 'level', offset: [0, 0, 0], size: [13200, 9100, 2720], layers: ['groundFloor'], children: [
      { id: 'wallLeft', type: 'block240', offset: [-800, 200, 0], size: [14800, 240, 2720], layers: ['blocks'], children: [
        { id: 'windowGarage', type: 'window', offset: [4380, -200, 1100], size: [2000, 440, 1000], layers: ['windows'] }] },
      { id: 'room_356', type: 'room', offset: [5860, 440, 0], size: [6900, 8220, 2720], settings: { metal: 'brass' }, children: [
        { id: 'g1', type: 'group', offset: [720, 7620, 0], size: [1900, 600, 900], children: [
          { id: 'K11', type: 'carcass', offset: [0, 0, 100], size: [800, 560, 720], layers: ['carcasses'], children: [
            { id: 'front', type: 'front', offset: [0, 560, 0], size: [800, 18, 720], layers: ['fronts'] },
            { id: 'sink', type: 'sink', offset: [100, 60, 758], size: [600, 440, 200], layers: ['sink'], refs: ['groundFloor/room_356/g1/K11'] }] }] }] }] }] };
  const tree = createTree(house);

  /* the scene: where a thing is, in the house's axes */
  const sink = /** @type {TreeNode} */ (tree.node('groundFloor/room_356/g1/K11/sink'));
  check('place: the sink in the house, its offsets added up', tree.place(sink).join() === '6680,8120,858');
  check('box: the garage window, x 3580 – 5580 as analysis.md', tree.box(/** @type {TreeNode} */ (tree.node('groundFloor/wallLeft/windowGarage'))).slice(0, 2).join() === '3580,5580');

  /* the panel: a thing is shown when all its layers are on; Floors come from the level it stands on */
  /** @param {TreeNode} n @param {string[]} off  the layers switched off */
  const shown = (n, off) => tree.layers(n).every(k => !off.includes(k));
  check('layers: the sink has the Ground Floor\'s layer and its own', tree.layers(sink).join() === 'groundFloor,carcasses,sink');
  check('layers: Ground Floor off hides the sink, the wall, the window', !shown(sink, ['groundFloor']) && !shown(/** @type {TreeNode} */ (tree.node('groundFloor/wallLeft')), ['groundFloor']));
  check('layers: Fronts off hides the front, not the sink', !shown(/** @type {TreeNode} */ (tree.node('groundFloor/room_356/g1/K11/front')), ['fronts']) && shown(sink, ['fronts']));

  /* Finish: the room's metal, for every fitting in it */
  check('setting: the front takes the room\'s metal', tree.setting(/** @type {TreeNode} */ (tree.node('groundFloor/room_356/g1/K11/front')), 'metal')?.value === 'brass');

  /* Documents: every element, by its path */
  /** @type {string[]} */
  const paths = [];
  tree.walk(n => { if (n.layers) paths.push(tree.path(n)); });
  check('walk: the elements, parents first', paths.join(' ') === 'groundFloor groundFloor/wallLeft groundFloor/wallLeft/windowGarage groundFloor/room_356/g1/K11 groundFloor/room_356/g1/K11/front groundFloor/room_356/g1/K11/sink');
  check('refs: the sink stands on its carcass', tree.refs(sink)[0] === tree.parent(sink));

  /* Test: the tree is sound; the wall's wings reach past the house's zero, to know */
  const below = tree.checks().find(c => c.info);
  check('checks: nothing to correct; the left wall below the zero, to know', tree.checks().filter(c => !c.info).every(c => c.items.length === 0) && below?.items.join() === 'groundFloor/wallLeft: x -800');
}
