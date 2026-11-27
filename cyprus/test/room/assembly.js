// @ts-check
// test/room/assembly.js: room/assembly.js: the kitchen's scene (room_356.scene.json) places its groups in room 356, as the house
// assembles it: each by its zero at the wall and the way its fronts face; the room's metal. In the house's axes.

import { assembleHouse } from '../../house/assembly.js';
import { openCatalog } from '../../library/catalog.js';

/** @typedef {import('../../house/assembly.js').HouseNode} HouseNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { hierarchy: H, problems } = await assembleHouse(await openCatalog());
  const house = /** @type {HouseNode} */ (H.node('house')), zero = H.place(house), room = 'house/groundFloor/room_356/';
  /** a node's box in the house's axes @param {string} path */
  const box = path => H.box(/** @type {HouseNode} */ (H.node(room + path))).map((v, i) => Math.round(v - zero[i >> 1])).join();
  check('no problems' + (problems.length ? ': ' + problems.map(p => p.text).join(' | ') : ''), problems.length === 0);
  check('the room\'s groups, under it', (/** @type {HouseNode} */ (H.node(room.slice(0, -1))).children || []).map(n => n.id).join() === 'g1,g2,g3');
  /* the room at x 4190, y 440 of the house; group 1 by its South wall, fronts North (turn 2), its zero at x 6716 of the room */
  check('group 1: by the South wall under the window, fronts North (turn 2): x 7393 – 10906, y 440 – 1058', box('g1').startsWith('7393,10906,440,1058,0,'));
  check('K11: 28 from the wall, 59 from the group\'s left (its East end): x 10047 – 10847, y 468 – 1018', box('g1/worktop/K11') === '10047,10847,468,1018,150,870');
  check('group 2: fronts East (turn 1), its zero at x 6162, y 0 of the room', box('g2').startsWith('10352,10952,440,3300,0,'));
  check('group 3, the island: fronts South (turn 0), its zero at the back of its worktop', box('g3/worktop').startsWith('7650,9386,2058,2958,870,'));
  check('the room\'s metal, from its scene, for what stands in it', H.setting(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11')), 'metal')?.value === 'brass');
  check('floor: what stands in the room on the room\'s', H.floor(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11'))) === 'groundFloor');
}
