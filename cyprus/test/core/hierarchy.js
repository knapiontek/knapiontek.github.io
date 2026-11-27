// @ts-check
// test/core/hierarchy.js: core/hierarchy.js by use cases, as the project uses it: the house built from the root down (the
// model, a room, its cabinets and what they need from the library); where a thing is (offsets and quarter turns: cabinets by
// each wall); the panel showing a thing by its layer and floor; Finish (a setting from above); Documents (every element, its
// refs); the test (what to correct, what to know). Every call in one.

import * as API from '../../core/hierarchy.js';
import { createHierarchy, turned } from '../../core/hierarchy.js';

/** @typedef {import('../../core/hierarchy.js').HierarchyNode} HierarchyNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /** @type {Set<string>} the calls a use case makes */
  const used = new Set();
  /** a hierarchy whose calls are counted @param {HierarchyNode} root */
  const counted = root => {
    const T = /** @type {Record<string, any>} */ (createHierarchy(root));
    used.add('createHierarchy');
    return /** @type {ReturnType<typeof createHierarchy>} */ (new Proxy(T, { get: (t, k) => { if (typeof t[/** @type {string} */ (k)] === 'function') used.add(String(k)); return t[/** @type {string} */ (k)]; } }));
  };
  /** @param {() => unknown} f */
  const throws = f => { try { f(); return false; } catch (e) { return true; } };

  /* --- use case: the house built from the root down: house/assembly.js makes the hierarchy from model.json; room/assembly.js
     adds a room's cabinets under the room; the cabinets add what they need from the library under themselves --- */
  /** @type {HierarchyNode} */
  const model = { id: 'house', type: 'house', offset: [0, 0, 0], size: [13200, 9100, 8820], children: [
    { id: 'groundFloor', type: 'level', offset: [0, 0, 0], size: [13200, 9100, 2720], floor: 'groundFloor', children: [
      { id: 'wallLeft', type: 'block240', offset: [-800, 8660, 0], size: [14800, 240, 2720], layer: 'blocks', children: [
        { id: 'windowGarage', type: 'window', offset: [4380, 0, 1100], size: [2000, 440, 1000], layer: 'windows' }] },
      { id: 'room_356', type: 'room', offset: [5860, 440, 0], size: [6900, 8220, 2720], settings: { metal: 'brass' } }] }] };
  const H = counted(model);
  {
    check('the hierarchy over the model: its root the model\'s', H.root === model);
    const room = /** @type {HierarchyNode} */ (H.node('groundFloor/room_356'));
    const g1 = H.add(room, { id: 'g1', type: 'group', offset: [720, 0, 0], size: [1900, 600, 900] });
    check('a branch added under a node in it: given back, the last of its children', g1 === /** @type {HierarchyNode[]} */ (room.children).at(-1));
    const K11 = H.add(g1, { id: 'K11', type: 'carcass', offset: [0, 40, 100], size: [800, 560, 720], layer: 'carcasses', children: [
      { id: 'front', type: 'front', offset: [0, -18, 0], size: [800, 18, 720], layer: 'fronts' }] });
    H.add(K11, { id: 'sink', type: 'sink', offset: [100, 60, 758], size: [600, 440, 200], layer: 'sink', refs: ['groundFloor/room_356/g1/K11'] });
    const sink = /** @type {HierarchyNode} */ (H.node('groundFloor/room_356/g1/K11/sink'));
    check('a node by its path; none: null', sink.id === 'sink' && H.node('groundFloor/none') === null);
    check('its path, its parent, its chain from the root', H.path(sink) === 'groundFloor/room_356/g1/K11/sink' && H.parent(sink) === K11 && H.chain(sink).map(n => n.id).join() === 'house,groundFloor,room_356,g1,K11,sink');
    check('the root: no path, no parent', H.path(model) === '' && H.parent(model) === null);
    check('a parent not in it, a node in it already, an id its siblings have: each throws', throws(() => H.add({ id: 'x', type: 't', offset: [0, 0, 0], size: [1, 1, 1] }, { id: 'y', type: 't', offset: [0, 0, 0], size: [1, 1, 1] }))
      && throws(() => H.add(room, g1)) && throws(() => H.add(room, { id: 'g1', type: 't', offset: [0, 0, 0], size: [1, 1, 1] })));
    check('the nodes as they were given: nothing added to them', JSON.stringify(Object.keys(sink)) === JSON.stringify(['id', 'type', 'offset', 'size', 'layer', 'refs']));
  }

  /* --- use case: where a thing is: the scene draws it there, in the house's axes (x East, y North, h up) --- */
  {
    const sink = /** @type {HierarchyNode} */ (H.node('groundFloor/room_356/g1/K11/sink'));
    check('the sink in the house: its offsets added up', H.place(sink).join() === '6680,540,858');
    check('the garage window\'s box: x 3580 – 5580, as analysis.md', H.box(/** @type {HierarchyNode} */ (H.node('groundFloor/wallLeft/windowGarage'))).slice(0, 2).join() === '3580,5580');
  }

  /* --- use case: cabinets by each wall of a room 4000 × 3000: a run 1200 long, 600 deep, its zero at the wall at its left end
     as one sees its fronts, x along it, y toward the wall (the cabinets at negative y); the scene turns it by quarter turns --- */
  {
    check('a quarter turn counterclockwise: x to y; four, none', turned([1, 0, 5], 1).join() === '0,1,5' && turned([0, 1, 5], 1).join() === '-1,0,5' && turned([3, 4, 5], 4).join() === '3,4,5' && turned([3, 4, 5], -1).join() === turned([3, 4, 5], 3).join());
    used.add('turned');
    /** a run of cabinets @param {number} turn @param {number[]} offset */
    const group = (turn, offset) => ({ id: 'g' + turn, type: 'group', offset, turn, size: [1200, -600, 900] });
    /** @type {HierarchyNode} */
    const root = { id: 'room', type: 'room', offset: [0, 0, 0], size: [4000, 3000, 2700], children: [group(0, [0, 3000, 0]), group(1, [0, 0, 0]), group(2, [4000, 0, 0]), group(3, [4000, 3000, 0])] };
    const T = counted(root), g = (/** @type {number} */ t) => /** @type {HierarchyNode} */ (T.node('g' + t));
    check('by the North wall, fronts South (turn 0): x East, y North', T.box(g(0)).join() === '0,1200,2400,3000,0,900');
    check('by the West wall, fronts East (turn 1): x North, y West', T.box(g(1)).join() === '0,600,0,1200,0,900');
    check('by the South wall, fronts North (turn 2): x West, y South', T.box(g(2)).join() === '2800,4000,0,600,0,900');
    check('by the East wall, fronts West (turn 3): x South, y East', T.box(g(3)).join() === '3400,4000,1800,3000,0,900');
    check('a carcass\'s back, 28 from the wall, 100 along it (turn 1): into the room\'s axes and back', T.toRoot(g(1), [100, -28, 0]).join() === '28,100,0' && T.fromRoot(g(1), [28, 100, 0]).join() === '100,-28,0');
    T.add(g(1), { id: 'k', type: 'carcass', offset: [100, -28, 0], turn: 2, size: [10, 10, 10] });
    check('a turned node in a turned node: the turns added up, its zero through its parent\'s turn', T.turnOf(/** @type {HierarchyNode} */ (T.node('g1/k'))) === 3 && T.turnOf(root) === 0 && T.place(/** @type {HierarchyNode} */ (T.node('g1/k'))).join() === '28,100,0');
    const cab = /** @type {HierarchyNode} */ (T.add(g(0), { id: 'carcass', type: 'carcass', offset: [100, -28, 0], size: [600, -550, 720] }));
    check('a size from the zero to the opposite corner, negative toward the room (a carcass 28 from the wall, 550 deep)', T.box(cab).join() === '100,700,2422,2972,0,720');
  }

  /* --- use case: the panel: a thing is shown when its layer and its floor are on (its own, or else its parent's) --- */
  {
    const sink = /** @type {HierarchyNode} */ (H.node('groundFloor/room_356/g1/K11/sink')), wall = /** @type {HierarchyNode} */ (H.node('groundFloor/wallLeft'));
    const window = /** @type {HierarchyNode} */ (H.node('groundFloor/wallLeft/windowGarage')), front = /** @type {HierarchyNode} */ (H.node('groundFloor/room_356/g1/K11/front'));
    /** @param {HierarchyNode} n @param {string[]} off  the layers and floors switched off */
    const shown = (n, off) => !off.includes(/** @type {string} */ (H.layer(n))) && !off.includes(/** @type {string} */ (H.floor(n)));
    check('the sink: its own layer, the Ground Floor\'s floor; the root none', H.layer(sink) === 'sink' && H.floor(sink) === 'groundFloor' && H.layer(model) === undefined);
    check('Ground Floor off hides the sink, the wall, the window', !shown(sink, ['groundFloor']) && !shown(wall, ['groundFloor']) && !shown(window, ['groundFloor']));
    check('Blocks off hides the wall, not the window in it', !shown(wall, ['blocks']) && shown(window, ['blocks']));
    check('Fronts off hides the front, not the sink', !shown(front, ['fronts']) && shown(sink, ['fronts']));
  }

  /* --- use case: Finish: the room's metal for every fitting in it; a setting none sets --- */
  {
    const front = /** @type {HierarchyNode} */ (H.node('groundFloor/room_356/g1/K11/front')), metal = H.setting(front, 'metal');
    check('the front takes the room\'s metal, and knows where it comes from', metal?.value === 'brass' && metal.from === H.node('groundFloor/room_356'));
    check('a setting none sets: undefined', H.setting(front, 'wall.height') === undefined);
  }

  /* --- use case: Documents: every element, parents first; what it refers to --- */
  {
    /** @type {string[]} */
    const paths = [];
    H.walk(n => { if (n.layer || n.floor) paths.push(H.path(n)); });
    check('every element, parents first', paths.join(' ') === 'groundFloor groundFloor/wallLeft groundFloor/wallLeft/windowGarage groundFloor/room_356/g1/K11 groundFloor/room_356/g1/K11/front groundFloor/room_356/g1/K11/sink');
    const sink = /** @type {HierarchyNode} */ (H.node('groundFloor/room_356/g1/K11/sink'));
    check('the sink refers to its carcass', H.refs(sink)[0] === H.parent(sink));
  }

  /* --- use case: the test: what to correct in a hierarchy, what to know --- */
  {
    const below = H.checks().find(c => c.info);
    check('the house: nothing to correct; its left wall below the zero, to know', H.checks().filter(c => !c.info).every(c => c.items.length === 0) && below?.items.join() === 'groundFloor/wallLeft: x -800');
    const bad = counted(/** @type {HierarchyNode} */ ({ id: 'a', type: 't', offset: [0, 0, 0], size: [1, 1, 1], children: [
      { id: 'b c', type: 't', offset: [0, 0, 0], size: [0, 1, 1] },
      { id: 'd', type: 't', offset: [0, 0, 0], size: [1, 1, 1], refs: ['nowhere'] },
      { id: 'd', type: 't', offset: [-5, 0, 0], size: [1, 1, 1] },
      { id: 'e', type: 't', offset: [0, 0, 0] },
      { id: 'f', type: 't', offset: [0, 0, 0], size: [1, 1, 1], turn: 5, layer: 'nolayer' }] }));
    const found = Object.fromEntries(bad.checks({ floors: [], layers: [] }).map(c => [c.name, c.items]));
    check('a faulty one: a bad id, a flat size, the same id twice, a broken ref, no size, a turn not 0 – 3, a layer no one knows', found['Hierarchy: ids without spaces or slashes'].join() === 'b c: id "b c"'
      && found['Hierarchy: sizes not 0'].join() === 'b c: size x 0' && found['Hierarchy: ids unique among siblings'].join() === 'd'
      && found['Hierarchy: every ref is the path of a node'].join() === 'd: nowhere' && found['Hierarchy: every node has a type, an offset and a size'].join() === 'e: size,f: turn 5'
      && found['Hierarchy: every layer and floor is known'].join() === 'f: layer nolayer');
    check('below the zero: to know, not to correct', found['Hierarchy: what lies below the zero'].join() === 'd: x -5' && bad.checks().find(c => c.name === 'Hierarchy: what lies below the zero')?.info === true);
  }

  /* every call in a use case: the module's exports and the hierarchy's */
  const calls = [...Object.keys(API), ...Object.keys(createHierarchy({ id: 'r', type: 'r', offset: [0, 0, 0], size: [1, 1, 1] })).filter(k => k !== 'root')];
  const missing = calls.filter(k => !used.has(k));
  check('every call in a use case' + (missing.length ? ': not ' + missing.join(', ') : ''), missing.length === 0);
}
