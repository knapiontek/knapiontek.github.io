/* core/tree.js: its public API, each part with what it gives (test/test.md) */
function treeTest({ treeModule }, data, check) {
  const tree = treeModule();
  check('the public API', Object.keys(tree).join(' ') === 'create');

  const root = { id: 'site', type: 'site', offset: [0, 0, 0], size: [10000, 10000, 5000], settings: { wall: { thickness: 240 } }, children: [
    { id: 'house', type: 'house', offset: [2000, 3000, 0], size: [6000, 4000, 3000], children: [
      { id: 'room', type: 'room', offset: [500, 500, 0], size: [2000, 2000, 2500], settings: { wall: { color: 'white' } }, refs: ['house'], children: [] }] }] };
  const T = tree.create(root);
  check('create: the API of a tree', Object.keys(T).join(' ') === 'root path node parent chain place box setting refs walk checks');

  const room = T.node('house/room');
  check('node and path: a node by its path, the path of a node', room === root.children[0].children[0] && T.path(room) === 'house/room');
  check('parent and chain', T.parent(room) === root.children[0] && T.chain(room).map(n => n.id).join() === 'site,house,room');
  check('place: the sum of the offsets', T.place(room).join() === '2500,3500,0');
  check('box: the place and the size', T.box(room).join() === '2500,4500,3500,5500,0,2500');
  check('setting: from the node or the nearest above', T.setting(room, 'wall.color').value === 'white' && T.setting(room, 'wall.thickness').from === root);
  check('refs: the nodes of its paths', T.refs(room)[0] === root.children[0]);
  const ids = []; T.walk(n => ids.push(n.id));
  check('walk: every node below the root, parents first', ids.join() === 'house,room');
  check('checks: a sound tree has no items', T.checks().every(c => c.items.length === 0));

  const bad = tree.create({ id: 'a', type: 't', offset: [0, 0, 0], size: [1, 1, 1], children: [{ id: 'b c', type: 't', offset: [0, 0, 0], size: [0, 1, 1] }] });
  check('checks: a bad id and a flat size are found', bad.checks().filter(c => c.items.length).length === 2);
}
