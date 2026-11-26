// @ts-check
// test/dependencies/core/tree.js: core/tree.js alone: every part of its public API, on a small tree of its own.

import * as module from '../../../core/tree.js';

/** @typedef {import('../../../core/tree.js').TreeNode} TreeNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  check('the module: createTree only', Object.keys(module).join() === 'createTree');

  /** @type {TreeNode} */
  const root = { id: 'site', type: 'site', offset: [0, 0, 0], size: [10000, 10000, 5000], settings: { wall: { thickness: 240 } }, children: [
    { id: 'house', type: 'house', offset: [2000, 3000, 0], size: [6000, 4000, 3000], layers: ['a'], children: [
      { id: 'room', type: 'room', offset: [500, 500, 0], size: [2000, 2000, 2500], settings: { wall: { color: 'white' } }, refs: ['house'], layers: ['b', 'a'] }] }] };
  const T = module.createTree(root);
  check('createTree: the tree\'s API', Object.keys(T).join() === 'root,path,node,parent,chain,place,box,setting,refs,layers,walk,checks');
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
  const bad = module.createTree(/** @type {TreeNode} */ ({ id: 'a', type: 't', offset: [0, 0, 0], size: [1, 1, 1], children: [
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
