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
  check('group 1: by the South wall, fronts North (turn 2), 64 from the West wall, behind group 2\'s corner: x 6044 – 9557, y 440 – 1058', box('g1').startsWith('6044,9557,440,1058,0,'));
  check('group 1: the sink under the kitchen window (x 6580 – 8480): K12 x 7262 – 8062', box('g1/worktop/K12') === '7262,8062,468,1018,150,870');
  check('group 2: by the West wall, fronts East (turn 1): x 5980 – 6580, y 440 – 3300', box('g2').startsWith('5980,6580,440,3300,0,'));
  const [k21, k1x] = [box('g2/plasterboard_1/K21'), box('g1/worktop/K1X')].map(b => b.split(',').map(Number));
  check('K21 of group 2 on the worktop of group 1 (908), over K1X, the carcass under it', k21[4] === 908 && k21[0] < k1x[1] && k1x[0] < k21[1] && k21[2] < k1x[3] && k1x[2] < k21[3]);
  check('group 3, the island: fronts South (turn 0), its zero at the back of its worktop', box('g3/worktop').startsWith('7564,9300,2058,2958,870,'));
  /* no body of one group in another's: the groups meet as the designer drew them (their spaces stand in for each other); two
     plinths may cross in a corner, as the maker knows */
  /** @type {{ g: string, path: string, box: number[] }[]} */
  const bodies = [];
  const kitchen = /** @type {HouseNode} */ (H.node(room.slice(0, -1)));
  H.walk(n => {
    const g = H.chain(n).find(m => m.type === 'cabinetGroup');
    if (!g || !H.chain(n).includes(kitchen)) return;
    for (const p of /** @type {HouseNode} */ (n).parts || []) if (p.form === 'box') {
      const b = /** @type {number[]} */ (p.box), a = H.toRoot(n, [b[0], b[2], b[4]]), c = H.toRoot(n, [b[1], b[3], b[5]]);
      bodies.push({ g: g.id, path: H.path(n) + ' ' + (p.layer || H.layer(n)), box: [0, 1, 2].flatMap(i => [Math.min(a[i], c[i]), Math.max(a[i], c[i])]) });
    }
  });
  const hits = new Set();
  const plinths = (/** @type {{ path: string }} */ a, /** @type {{ path: string }} */ b) => a.path.endsWith(' plinth') && b.path.endsWith(' plinth');
  for (const a of bodies) for (const b of bodies) if (a.g < b.g && !plinths(a, b) && [0, 1, 2].every(i => Math.min(a.box[2 * i + 1], b.box[2 * i + 1]) - Math.max(a.box[2 * i], b.box[2 * i]) > 0.5)) hits.add(a.path.split('room_356/')[1] + ' × ' + b.path.split('room_356/')[1]);
  check('groups: no body of one in another\'s (plinths may cross)' + (hits.size ? ': ' + [...hits].join(' | ') : ''), hits.size === 0);
  check('the hood\'s chimney up to the ceiling (2720)', H.box(/** @type {HouseNode} */ (H.node(room + 'g1/hood')))[5] - zero[2] === 2720);
  /* the other rooms: their scenes, as built (archon/analysis.md § 13) */
  const at = (/** @type {string} */ path) => H.box(/** @type {HouseNode} */ (H.node('house/' + path))).map((v, i) => Math.round(v - zero[i >> 1]));
  check('rooms with a scene: each with what stands in it', ['groundFloor/bathroom_7', 'firstFloor/bathroom_5', 'firstFloor/wardrobe_3', 'firstFloor/wardrobe_4', 'firstFloor/wardrobe_8', 'firstFloor/bedroom_6']
    .every(r => (/** @type {HouseNode} */ (H.node('house/' + r)).children || []).some(n => n.type === 'cabinetGroup')));
  const screen = at('groundFloor/bathroom_7/screen');
  check('bathroom 7: the shower\'s screen at the recess\'s glass line (x ≈ 4250), the recess y 440 – 1440', Math.abs(screen[1] - 4250) < 40 && screen[2] === 440 && screen[3] === 1440);
  const corner = at('firstFloor/bathroom_5/corner');
  check('bathroom 5: the shower 1000 × 1000 at its front end, by the door wall (x 5000 – 6000, y 2450 – 3450)', Math.abs(corner[0] - 5000) < 30 && Math.abs(corner[1] - 6000) < 60 && Math.abs(corner[3] - 3450) < 30);
  check('bedroom 6: the shelving in the niche of the former shaft (x 4190 – 4880)', at('firstFloor/bedroom_6/g1')[1] === 4880);
  check('a casing less its niche: its boxes round the cut', (/** @type {HouseNode} */ (H.node('house/groundFloor/bathroom_7/builtIn1')).parts || []).length > 1);
  check('the room\'s metal, from its scene, for what stands in it', H.setting(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11')), 'metal')?.value === 'brass');
  check('floor: what stands in the room on the room\'s', H.floor(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11'))) === 'groundFloor');
}
