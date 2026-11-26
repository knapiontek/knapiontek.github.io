// @ts-check
// test/core/tree.js: core/tree.js: every call on a small tree of its own, a faulty tree and what its checks find; then the
// tree as the other modules use it, on a piece of the house (archon/analysis.md, x East, y South).

import { createTree } from '../../core/tree.js';

/** @typedef {import('../../core/tree.js').TreeNode} TreeNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /* ---------- every call, on a small tree ---------- */
  {

    /** @type {TreeNode} */
    const root = { id: 'site', type: 'site', offset: [0, 0, 0], size: [10000, 10000, 5000], settings: { wall: { thickness: 240 } }, children: [
      { id: 'house', type: 'house', offset: [2000, 3000, 0], size: [6000, 4000, 3000], layers: ['a'], children: [
        { id: 'room', type: 'room', offset: [500, 500, 0], size: [2000, 2000, 2500], settings: { wall: { color: 'white' } }, refs: ['house'], layers: ['b', 'a'] }] }] };
    const T = createTree(root);
    check('root: the node it was made over', T.root === root);

    const house = /** @type {TreeNode[]} */ (root.children)[0], room = /** @type {TreeNode[]} */ (house.children)[0];
    check('node: a node by its path; null for none', T.node('house/room') === room && T.node('house') === house && T.node('house/none') === null);
    check('path: the ids from the root, the root itself empty', T.path(room) === 'house/room' && T.path(root) === '');
    check('parent: its parent; the root has none', T.parent(room) === house && T.parent(root) === null);
    check('chain: from the root down', T.chain(room).map(n => n.id).join() === 'site,house,room');
    check('place: the sum of the offsets below the root', T.place(room).join() === '2500,3500,0' && T.place(root).join() === '0,0,0');
    check('box: the place and the size', T.box(room).join() === '2500,4500,3500,5500,0,2500');
    const color = T.setting(room, 'wall.color'), thickness = T.setting(room, 'wall.thickness');
    check('setting: its own, or the nearest above, and where it comes from', color?.value === 'white' && color.from === room && thickness?.value === 240 && thickness.from === root);
    check('setting: none sets it, undefined', T.setting(room, 'wall.height') === undefined);
    check('refs: the nodes of its paths', T.refs(room).length === 1 && T.refs(room)[0] === house);
    check('layers: its own and those above, from the root down, each once', T.layers(room).join() === 'a,b' && T.layers(root).length === 0);
    /** @type {string[]} */
    const walked = [];
    T.walk(n => walked.push(n.id));
    check('walk: every node below the root, parents first', walked.join() === 'house,room');
    check('the nodes are not changed', JSON.stringify(Object.keys(room)) === JSON.stringify(['id', 'type', 'offset', 'size', 'settings', 'refs', 'layers']));
    check('checks: a sound tree has nothing to correct', T.checks().every(c => c.items.length === 0));

    /* a tree with faults: a bad id, a flat size, the same id twice, a broken ref, a node with no size, a node below zero */
    const bad = createTree(/** @type {TreeNode} */ ({ id: 'a', type: 't', offset: [0, 0, 0], size: [1, 1, 1], children: [
      { id: 'b c', type: 't', offset: [0, 0, 0], size: [0, 1, 1] },
      { id: 'd', type: 't', offset: [0, 0, 0], size: [1, 1, 1], refs: ['nowhere'] },
      { id: 'd', type: 't', offset: [-5, 0, 0], size: [1, 1, 1] },
      { id: 'e', type: 't', offset: [0, 0, 0] }] }));
    const found = Object.fromEntries(bad.checks().map(c => [c.name, c.items]));
    check('checks: a bad id', found['Tree: ids without spaces or slashes'].join() === 'b c: id "b c"');
    check('checks: a flat size', found['Tree: sizes above 0'].join() === 'b c: size x 0');
    check('checks: the same id twice', found['Tree: ids unique among siblings'].join() === 'd');
    check('checks: a broken ref', found['Tree: every ref is the path of a node'].join() === 'd: nowhere');
    check('checks: a node without its size', found['Tree: every node has a type, an offset and a size'].join() === 'e: size');
    check('checks: below the zero, to know', found['Tree: what lies below the zero'].join() === 'd: x -5' && bad.checks().find(c => c.name === 'Tree: what lies below the zero')?.info === true);
  }

  /* ---------- on a piece of the house: the Ground Floor, its left wall with the garage window, room 356 with a cabinet
     whose front hangs on it and whose sink stands on it ---------- */
  {
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
}
