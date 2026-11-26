// @ts-check
// test/core/hierarchy.js: core/hierarchy.js: every call on a small hierarchy of its own, a faulty one and what its checks
// find; then a piece of the house built as the project builds it, from the root down: the house's model, a room, its cabinets
// and what they need from the library (archon/analysis.md, x East, y North).

import { createHierarchy } from '../../core/hierarchy.js';

/** @typedef {import('../../core/hierarchy.js').HierarchyNode} HierarchyNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /* ---------- every call, on a small hierarchy ---------- */
  {

    /** @type {HierarchyNode} */
    const root = { id: 'site', type: 'site', offset: [0, 0, 0], size: [10000, 10000, 5000], settings: { wall: { thickness: 240 } }, children: [
      { id: 'house', type: 'house', offset: [2000, 3000, 0], size: [6000, 4000, 3000], layer: 'a', floor: 'f1', children: [
        { id: 'room', type: 'room', offset: [500, 500, 0], size: [2000, 2000, 2500], settings: { wall: { color: 'white' } }, refs: ['house'], layer: 'b' }] }] };
    const T = createHierarchy(root);
    check('root: the node it was made over', T.root === root);

    const house = /** @type {HierarchyNode[]} */ (root.children)[0], room = /** @type {HierarchyNode[]} */ (house.children)[0];
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
    check('layer: its own, before its parent\'s', T.layer(room) === 'b' && T.layer(house) === 'a' && T.layer(root) === undefined);
    check('floor: its parent\'s when it has none', T.floor(room) === 'f1' && T.floor(root) === undefined);
    /** @type {string[]} */
    const walked = [];
    T.walk(n => walked.push(n.id));
    check('walk: every node below the root, parents first', walked.join() === 'house,room');
    check('the nodes are not changed', JSON.stringify(Object.keys(room)) === JSON.stringify(['id', 'type', 'offset', 'size', 'settings', 'refs', 'layer']));
    check('checks: a sound hierarchy has nothing to correct', T.checks().every(c => c.items.length === 0));

    /* add: a branch under a node already in it */
    /** @type {HierarchyNode} */
    const desk = { id: 'desk', type: 'desk', offset: [100, 200, 0], size: [1200, 600, 750], children: [
      { id: 'lamp', type: 'lamp', offset: [50, 50, 750], size: [150, 150, 400], layer: 'c' }] };
    check('add: gives the node back', T.add(room, desk) === desk);
    check('add: the last of the parent\'s children', /** @type {HierarchyNode[]} */ (room.children).at(-1) === desk);
    const lamp = /** @type {HierarchyNode} */ (T.node('house/room/desk/lamp'));
    check('add: what lies under it, found by path, placed, its layer and floor', lamp !== null && T.place(lamp).join() === '2650,3750,750' && T.layer(lamp) === 'c' && T.floor(lamp) === 'f1');
    /** @param {() => unknown} f */
    const throws = f => { try { f(); return false; } catch (e) { return true; } };
    check('add: a parent not in it throws', throws(() => T.add({ id: 'x', type: 't', offset: [0, 0, 0], size: [1, 1, 1] }, { id: 'y', type: 't', offset: [0, 0, 0], size: [1, 1, 1] })));
    check('add: a node in it already throws', throws(() => T.add(house, desk)));
    check('add: an id its siblings have throws', throws(() => T.add(room, { id: 'desk', type: 't', offset: [0, 0, 0], size: [1, 1, 1] })));

    /* a hierarchy with faults: a bad id, a flat size, the same id twice, a broken ref, a node with no size, a node below zero */
    const bad = createHierarchy(/** @type {HierarchyNode} */ ({ id: 'a', type: 't', offset: [0, 0, 0], size: [1, 1, 1], children: [
      { id: 'b c', type: 't', offset: [0, 0, 0], size: [0, 1, 1] },
      { id: 'd', type: 't', offset: [0, 0, 0], size: [1, 1, 1], refs: ['nowhere'] },
      { id: 'd', type: 't', offset: [-5, 0, 0], size: [1, 1, 1] },
      { id: 'e', type: 't', offset: [0, 0, 0] }] }));
    const found = Object.fromEntries(bad.checks().map(c => [c.name, c.items]));
    check('checks: a bad id', found['Hierarchy: ids without spaces or slashes'].join() === 'b c: id "b c"');
    check('checks: a flat size', found['Hierarchy: sizes above 0'].join() === 'b c: size x 0');
    check('checks: the same id twice', found['Hierarchy: ids unique among siblings'].join() === 'd');
    check('checks: a broken ref', found['Hierarchy: every ref is the path of a node'].join() === 'd: nowhere');
    check('checks: a node without its size', found['Hierarchy: every node has a type, an offset and a size'].join() === 'e: size');
    check('checks: below the zero, to know', found['Hierarchy: what lies below the zero'].join() === 'd: x -5' && bad.checks().find(c => c.name === 'Hierarchy: what lies below the zero')?.info === true);
  }

  /* ---------- on a piece of the house: the Ground Floor, its left wall with the garage window, room 356 with a cabinet
     whose front hangs on it and whose sink stands on it ---------- */
  {
    /* house/model.json: the house's branches, the room a place in them */
    /** @type {HierarchyNode} */
    const house = { id: 'house', type: 'house', offset: [0, 0, 0], size: [13200, 9100, 8820], children: [
      { id: 'groundFloor', type: 'level', offset: [0, 0, 0], size: [13200, 9100, 2720], floor: 'groundFloor', children: [
        { id: 'wallLeft', type: 'block240', offset: [-800, 8660, 0], size: [14800, 240, 2720], layer: 'blocks', children: [
          { id: 'windowGarage', type: 'window', offset: [4380, 0, 1100], size: [2000, 440, 1000], layer: 'windows' }] },
        { id: 'room_356', type: 'room', offset: [5860, 440, 0], size: [6900, 8220, 2720], settings: { metal: 'brass' } }] }] };
    const hierarchy = createHierarchy(house);
    /* room/build.js: the room's cabinets, as room/cabinets.js builds them, under the room */
    const room = /** @type {HierarchyNode} */ (hierarchy.node('groundFloor/room_356'));
    const g1 = hierarchy.add(room, { id: 'g1', type: 'group', offset: [720, 0, 0], size: [1900, 600, 900] });
    const K11 = hierarchy.add(g1, { id: 'K11', type: 'carcass', offset: [0, 40, 100], size: [800, 560, 720], layer: 'carcasses', children: [
      { id: 'front', type: 'front', offset: [0, -18, 0], size: [800, 18, 720], layer: 'fronts' }] });
    /* … and what the cabinets need from the library: the sink, on its carcass */
    hierarchy.add(K11, { id: 'sink', type: 'sink', offset: [100, 60, 758], size: [600, 440, 200], layer: 'sink', refs: ['groundFloor/room_356/g1/K11'] });

    /* the scene: where a thing is, in the house's axes */
    const sink = /** @type {HierarchyNode} */ (hierarchy.node('groundFloor/room_356/g1/K11/sink'));
    check('place: the sink in the house, its offsets added up', hierarchy.place(sink).join() === '6680,540,858');
    check('box: the garage window, x 3580 – 5580 as analysis.md', hierarchy.box(/** @type {HierarchyNode} */ (hierarchy.node('groundFloor/wallLeft/windowGarage'))).slice(0, 2).join() === '3580,5580');

    /* the panel: a thing is shown when its layer and its floor are on */
    /** @param {HierarchyNode} n @param {string[]} off  the layers and floors switched off */
    const shown = (n, off) => !off.includes(/** @type {string} */ (hierarchy.layer(n))) && !off.includes(/** @type {string} */ (hierarchy.floor(n)));
    const wall = /** @type {HierarchyNode} */ (hierarchy.node('groundFloor/wallLeft')), window = /** @type {HierarchyNode} */ (hierarchy.node('groundFloor/wallLeft/windowGarage'));
    check('layer and floor: the sink, its own layer, the Ground Floor\'s floor', hierarchy.layer(sink) === 'sink' && hierarchy.floor(sink) === 'groundFloor');
    check('floor: Ground Floor off hides the sink, the wall, the window', !shown(sink, ['groundFloor']) && !shown(wall, ['groundFloor']) && !shown(window, ['groundFloor']));
    check('layer: Blocks off hides the wall, not the window in it', !shown(wall, ['blocks']) && shown(window, ['blocks']));
    check('layer: Fronts off hides the front, not the sink', !shown(/** @type {HierarchyNode} */ (hierarchy.node('groundFloor/room_356/g1/K11/front')), ['fronts']) && shown(sink, ['fronts']));

    /* Finish: the room's metal, for every fitting in it */
    check('setting: the front takes the room\'s metal', hierarchy.setting(/** @type {HierarchyNode} */ (hierarchy.node('groundFloor/room_356/g1/K11/front')), 'metal')?.value === 'brass');

    /* Documents: every element, by its path */
    /** @type {string[]} */
    const paths = [];
    hierarchy.walk(n => { if (n.layer || n.floor) paths.push(hierarchy.path(n)); });
    check('walk: the elements, parents first', paths.join(' ') === 'groundFloor groundFloor/wallLeft groundFloor/wallLeft/windowGarage groundFloor/room_356/g1/K11 groundFloor/room_356/g1/K11/front groundFloor/room_356/g1/K11/sink');
    check('refs: the sink stands on its carcass', hierarchy.refs(sink)[0] === hierarchy.parent(sink));

    /* Test: the hierarchy is sound; the wall's wings reach past the house's zero, to know */
    const below = hierarchy.checks().find(c => c.info);
    check('checks: nothing to correct; the left wall below the zero, to know', hierarchy.checks().filter(c => !c.info).every(c => c.items.length === 0) && below?.items.join() === 'groundFloor/wallLeft: x -800');
  }
}
