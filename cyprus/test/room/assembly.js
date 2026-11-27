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
  /* the room at x 4190, y 440 of the house; the kitchen's West wall at x 5980 (wall 5) */
  check('group 1: by the South wall, fronts North (turn 2), from the West wall: x 5980 – 9493, y 440 – 1058', box('g1').startsWith('5980,9493,440,1058,0,'));
  check('group 1: the sink under the kitchen window (x 6580 – 8480): K12 x 7198 – 7998', box('g1/worktop/K12') === '7198,7998,468,1018,150,870');
  check('group 2: by the West wall, fronts East (turn 1): x 5980 – 6580, y 440 – 3300', box('g2').startsWith('5980,6580,440,3300,0,'));
  const [k21, k1x] = [box('g2/plasterboard_1/K21'), box('g1/worktop/K1X')].map(b => b.split(',').map(Number));
  check('K21 of group 2 on the worktop of group 1 (908), over K1X, the carcass under it', k21[4] === 908 && k21[0] < k1x[1] && k1x[0] < k21[1] && k21[2] < k1x[3] && k1x[2] < k21[3]);
  check('group 3, the island: fronts South (turn 0), its zero at the back of its worktop', box('g3/worktop').startsWith('7500,9236,2058,2958,870,'));
  check('the hood\'s chimney up to the ceiling (2720)', H.box(/** @type {HouseNode} */ (H.node(room + 'g1/hood')))[5] - zero[2] === 2720);
  check('the room\'s metal, from its scene, for what stands in it', H.setting(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11')), 'metal')?.value === 'brass');
  check('floor: what stands in the room on the room\'s', H.floor(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11'))) === 'groundFloor');
}
