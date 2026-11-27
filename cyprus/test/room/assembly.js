// @ts-check
// test/room/assembly.js: room/assembly.js: the kitchen's scene (room_356.scene.json) places its groups in room 356, as the house
// assembles it: each by its zero at the wall and the way its fronts face; the room's metal. In the house's axes.

import { assembleHouse } from '../../house/assembly.js';
import { openCatalog } from '../../library/catalog.js';
import { tilesFaults } from '../../room/assembly.js';

/** @typedef {import('../../house/assembly.js').HouseNode} HouseNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const catalog = await openCatalog(), { hierarchy: H, problems } = await assembleHouse(catalog);
  const house = /** @type {HouseNode} */ (H.node('house')), zero = H.place(house), room = 'house/groundFloor/room_356/';
  /** a node's box in the house's axes @param {string} path */
  const box = path => H.box(/** @type {HouseNode} */ (H.node(room + path))).map((v, i) => Math.round(v - zero[i >> 1])).join();
  check('no problems' + (problems.length ? ': ' + problems.map(p => p.text).join(' | ') : ''), problems.length === 0);
  check('the room\'s groups, under it', (/** @type {HouseNode} */ (H.node(room.slice(0, -1))).children || []).filter(n => n.type === 'cabinetGroup').map(n => n.id).join() === 'g1,g2,g3');
  /* the room at x 4190, y 440 of the house; the kitchen's West wall at x 5980 (wall 5) */
  check('group 1: by the South wall, fronts North (turn 2), 64 from the West wall, behind group 2\'s corner: x 6044 – 9557, y 440 – 1068 (its handles)', box('g1').startsWith('6044,9557,440,1068,0,'));
  check('group 1: the sink under the kitchen window (x 6580 – 8480): K12 x 7262 – 8062', box('g1/worktop/K12') === '7262,8062,468,1018,150,870');
  check('group 2: by the West wall, fronts East (turn 1): x 5980 – 6594 (its handles), y 440 – 3300', box('g2').startsWith('5980,6594,440,3300,0,'));
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
  /* lamps: under the ceiling over the room, lit at night */
  const lamp = (/** @type {string} */ p) => /** @type {HouseNode} */ (H.node('house/' + p));
  check('lamps: the kitchen\'s under its ceiling (the slab, 2720): a downlight\'s tube there, its spot down', lamp('groundFloor/room_356/downlight1').size[2] === 2720
    && lamp('groundFloor/room_356/downlight1').lights?.[0].kind === 'spot' && lamp('groundFloor/room_356/downlight1').layer === 'downlights');
  check('lamps: two pendants over the island, 776 apart, their shades\' rims at 1750', Math.abs(at('groundFloor/room_356/pendant2')[0] - at('groundFloor/room_356/pendant1')[0]) === 776 && lamp('groundFloor/room_356/pendant1').layer === 'pendants');
  check('lamps: the downlight between the sink and the hob, 402 from the wall', H.fromRoot(lamp('groundFloor/room_356'), H.place(lamp('groundFloor/room_356/downlight1'))).slice(0, 2).join() === '4190,402');
  check('lamps: bathroom 5\'s under the Attic\'s ceiling (5910 − 3060 = 2850)', lamp('firstFloor/bathroom_5/downlight1').size[2] === 2850);
  check('the room\'s metal, from its scene, for what stands in it', H.setting(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11')), 'metal')?.value === 'brass');
  check('floor: what stands in the room on the room\'s', H.floor(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11'))) === 'groundFloor');
  /* tiles: the room's, from its scene, the floor's and the walls'; none without a scene */
  const tiled = (/** @type {string} */ p) => /** @type {any} */ (H.node('house/' + p)).tiles;
  check('tiles: the kitchen\'s floor, graphite, laid from its point; no walls', tiled('groundFloor/room_356').floor.product === 'paradyz-authority-graphite' && tiled('groundFloor/room_356').floor.offset.join() === '9775,7910' && !tiled('groundFloor/room_356').walls);
  check('tiles: bathroom 5, floor and walls, each its depth and grout', ['floor', 'walls'].every(k => tiled('firstFloor/bathroom_5')[k].depth === 12 && /^#/.test(tiled('firstFloor/bathroom_5')[k].grout)));
  check('tiles: none in a room with no scene (the garage, the hall)', !tiled('groundFloor/garage_2') && !tiled('firstFloor/hall_1'));
  const good = { product: 'paradyz-authority-grey', depth: 12, dir: 'x', pattern: 'grid', offset: [0, 0], grout: '#202020' };
  check('tiles: a good floor, a size of its formats', tilesFaults({ floor: good }, catalog).length === 0 && tilesFaults({ floor: { ...good, size: [598, 1198] } }, catalog).length === 0);
  const faults = tilesFaults({ shower: {}, floor: { ...good, size: [600, 600], depth: 0, dir: 'z', pattern: 'herring', grout: 'grey', top: 3 }, walls: { ...good } }, catalog);
  check('tiles: what is wrong, each' + ' (' + faults.length + ')', faults.length === 8 && faults.some(f => f.includes('only floor and walls')) && faults.some(f => f.includes('walls: offset')) && faults.some(f => f.includes('top: not known')));
  /* the floor tiles: laid over the floor and the doors' halves, the grout under them, counted */
  const ft = /** @type {any} */ (H.node(room + 'floorTiles'));
  check('floor tiles: the kitchen\'s, a node of its own (layer floorTiles), as deep as the scene says (12)', ft?.layer === 'floorTiles' && ft.size[2] === 12);
  check('floor tiles: the kitchen counted (m², tiles, whole, cut, small): ' + JSON.stringify(ft?.count), ft?.count.area > 50.55 && ft.count.tiles === ft.count.whole + ft.count.cut && ft.count.tiles > 60);
  check('floor tiles: the grout in the scene\'s colour, the tiles of their product, small cuts marked', ft.parts.some((/** @type {any} */ p) => p.material === 'grout:#686a68') && ft.parts.some((/** @type {any} */ p) => p.material === 'tile:paradyz-authority-graphite') && ft.parts.filter((/** @type {any} */ p) => p.layer === 'smallCuts').length === ft.count.small);
  check('floor tiles: none in a room with no scene', !H.node('house/groundFloor/garage_2/floorTiles'));
}
