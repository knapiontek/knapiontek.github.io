// @ts-check
// test/room/assembly.js: room/assembly.js by use cases, as the house assembles its rooms (house/assembly.js calls
// assembleRooms): the kitchen's scene places its groups (by their zero at the wall, the way their fronts face); the groups meet
// as the designer drew them; the hood up to the ceiling; the other rooms' scenes; the lamps under the ceiling; Finish's metal;
// the designer's tiles checked; the floor's and the walls' tiles laid and counted. In the house's axes. Every function in one.

import * as API from '../../room/assembly.js';
import { assembleHouse } from '../../house/assembly.js';
import { openCatalog } from '../../library/catalog.js';
import { uses } from '../uses.js';

/** @typedef {import('../../house/assembly.js').HouseNode} HouseNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(API), tilesFaults = $.tilesFaults;
  const catalog = await openCatalog(), { hierarchy: H, problems } = await assembleHouse(catalog);
  const house = /** @type {HouseNode} */ (H.node('house')), zero = H.place(house), room = 'house/groundFloor/room_356/';
  /** a node's box in the house's axes @param {string} path */
  const box = path => H.box(/** @type {HouseNode} */ (H.node(room + path))).map((v, i) => Math.round(v - zero[i >> 1])).join();
  /* --- use case: the kitchen's scene (room_356.scene.json) places its three groups in room 356 --- */
  check('no problems' + (problems.length ? ': ' + problems.map(p => p.text).join(' | ') : ''), problems.length === 0);
  check('the room\'s groups, under it', (/** @type {HouseNode} */ (H.node(room.slice(0, -1))).children || []).filter(n => n.type === 'cabinetGroup').map(n => n.id).join() === 'g1,g2,g3');
  /* the room at x 4190, y 440 of the house; the kitchen's West wall at x 5980 (wall 5) */
  check('group 1: by the South wall, fronts North (turn 2), 64 from the West wall, behind group 2\'s corner: x 6044 – 9557, y 440 – 1068 (its handles)', box('g1').startsWith('6044,9557,440,1068,0,'));
  check('group 1: the sink under the kitchen window (x 6580 – 8480): K12 x 7262 – 8062', box('g1/worktop/K12') === '7262,8062,468,1018,150,870');
  check('group 2: by the West wall, fronts East (turn 1): x 5980 – 6594 (its handles), y 440 – 3300', box('g2').startsWith('5980,6594,440,3300,0,'));
  const [k21, k1x] = [box('g2/plasterboard_1/K21'), box('g1/worktop/K1X')].map(b => b.split(',').map(Number));
  check('K21 of group 2 on the worktop of group 1 (908), over K1X, the carcass under it', k21[4] === 908 && k21[0] < k1x[1] && k1x[0] < k21[1] && k21[2] < k1x[3] && k1x[2] < k21[3]);
  check('group 3, the island: fronts South (turn 0), its zero at the back of its worktop', box('g3/worktop').startsWith('7564,9300,2058,2958,870,'));
  /* --- use case: the groups meet as the designer drew them (their spaces stand in for each other): no body of one in another's;
     two plinths may cross in a corner, as the maker knows --- */
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
  /* --- use case: what reaches the ceiling: the hood's chimney --- */
  check('the hood\'s chimney up to the ceiling (2720)', H.box(/** @type {HouseNode} */ (H.node(room + 'g1/hood')))[5] - zero[2] === 2720);
  /* --- use case: the other rooms' scenes, as built (archon/analysis.md § 13): their cabinets, fixtures, casings --- */
  const at = (/** @type {string} */ path) => H.box(/** @type {HouseNode} */ (H.node('house/' + path))).map((v, i) => Math.round(v - zero[i >> 1]));
  check('rooms with a scene: each with what stands in it', ['groundFloor/bathroom_7', 'firstFloor/bathroom_5', 'firstFloor/wardrobe_3', 'firstFloor/wardrobe_4', 'firstFloor/wardrobe_8', 'firstFloor/bedroom_6']
    .every(r => (/** @type {HouseNode} */ (H.node('house/' + r)).children || []).some(n => n.type === 'cabinetGroup')));
  const screen = at('groundFloor/bathroom_7/screen');
  check('bathroom 7: the shower\'s screen at the recess\'s glass line (x ≈ 4250), the recess y 440 – 1440', Math.abs(screen[1] - 4250) < 40 && screen[2] === 440 && screen[3] === 1440);
  const corner = at('firstFloor/bathroom_5/corner');
  check('bathroom 5: the shower 1000 × 1000 at its front end, by the door wall (x 5000 – 6000, y 2450 – 3450)', Math.abs(corner[0] - 5000) < 30 && Math.abs(corner[1] - 6000) < 60 && Math.abs(corner[3] - 3450) < 30);
  check('bedroom 6: the shelving in the niche of the former shaft (x 4190 – 4880)', at('firstFloor/bedroom_6/g1')[1] === 4880);
  check('a casing less its niche: its boxes round the cut', (/** @type {HouseNode} */ (H.node('house/groundFloor/bathroom_7/builtIn1')).parts || []).length > 1);
  /* --- use case: the lamps under the ceiling the house gives the room, lit at night --- */
  const lamp = (/** @type {string} */ p) => /** @type {HouseNode} */ (H.node('house/' + p));
  check('lamps: the kitchen\'s under its ceiling (the slab, 2720): a downlight\'s tube there, its spot down', lamp('groundFloor/room_356/downlight1').size[2] === 2720
    && lamp('groundFloor/room_356/downlight1').lights?.[0].kind === 'spot' && lamp('groundFloor/room_356/downlight1').layer === 'downlights');
  check('lamps: two pendants over the island, 776 apart, their shades\' rims at 1750', Math.abs(at('groundFloor/room_356/pendant2')[0] - at('groundFloor/room_356/pendant1')[0]) === 776 && lamp('groundFloor/room_356/pendant1').layer === 'pendants');
  check('lamps: the downlight between the sink and the hob, 402 from the wall', H.fromRoot(lamp('groundFloor/room_356'), H.place(lamp('groundFloor/room_356/downlight1'))).slice(0, 2).join() === '4190,402');
  check('lamps: bathroom 5\'s under the Attic\'s ceiling (5910 − 3060 = 2850)', lamp('firstFloor/bathroom_5/downlight1').size[2] === 2850);
  /* --- use case: Finish: the room's one metal for what stands in it; its floor --- */
  check('the room\'s metal, from its scene, for what stands in it', H.setting(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11')), 'metal')?.value === 'brass');
  check('floor: what stands in the room on the room\'s', H.floor(/** @type {HouseNode} */ (H.node(room + 'g1/worktop/K11'))) === 'groundFloor');
  /* --- use case: the designer's tiles in the scene: the floor's and the walls', checked; none without a scene --- */
  const tiled = (/** @type {string} */ p) => /** @type {any} */ (H.node('house/' + p)).tiles;
  check('tiles: the kitchen\'s floor, graphite, laid from its point; no walls', tiled('groundFloor/room_356').floor.product === 'paradyz-authority-graphite' && tiled('groundFloor/room_356').floor.offset.join() === '9775,7910' && !tiled('groundFloor/room_356').walls);
  check('tiles: bathroom 5, floor and walls, each its depth and grout', ['floor', 'walls'].every(k => tiled('firstFloor/bathroom_5')[k].depth === 12 && /^#/.test(tiled('firstFloor/bathroom_5')[k].grout)));
  check('tiles: none in a room with no scene (the garage, the hall)', !tiled('groundFloor/garage_2') && !tiled('firstFloor/hall_1'));
  const good = { product: 'paradyz-authority-grey', depth: 12, dir: 'x', pattern: 'grid', offset: [0, 0], grout: '#202020' };
  check('tiles: a good floor, a size of its formats', tilesFaults({ floor: good }, catalog).length === 0 && tilesFaults({ floor: { ...good, size: [598, 1198] } }, catalog).length === 0);
  const faults = tilesFaults({ shower: {}, floor: { ...good, size: [600, 600], depth: 0, dir: 'z', pattern: 'herring', grout: 'grey', top: 3 }, walls: { ...good } }, catalog);
  check('tiles: what is wrong, each' + ' (' + faults.length + ')', faults.length === 8 && faults.some(f => f.includes('only floor and walls')) && faults.some(f => f.includes('walls: offset')) && faults.some(f => f.includes('top: not known')));
  /* --- use case: the floor's tiles laid over the floor and the doors' halves, the grout under them, counted --- */
  const ft = /** @type {any} */ (H.node(room + 'floorTiles'));
  check('floor tiles: the kitchen\'s, a node of its own (layer floorTiles), as deep as the scene says (12)', ft?.layer === 'floorTiles' && ft.size[2] === 12);
  check('floor tiles: the kitchen counted (m², tiles, whole, cut, small): ' + JSON.stringify(ft?.count), ft?.count.area > 50.55 && ft.count.tiles === ft.count.whole + ft.count.cut && ft.count.tiles > 60);
  /** a node's solids: each its box (a prism's box), its material, where its photo starts, its layer @param {any} node @returns {{ b: number[], m: string, uvAt?: number[], layer?: string, poly?: number[][] }[]} */
  const solidsOf = node => node.parts.filter((/** @type {any} */ p) => p.layer !== 'smallCuts').map((/** @type {any} */ p) => ({ m: p.material, uvAt: p.uvAt, layer: p.layer, poly: p.poly,
    b: p.form === 'box' ? p.box : [p.x[0], p.x[1], Math.min(...p.poly.map((/** @type {number[]} */ q) => q[0])), Math.max(...p.poly.map((/** @type {number[]} */ q) => q[0])), Math.min(...p.poly.map((/** @type {number[]} */ q) => q[1])), Math.max(...p.poly.map((/** @type {number[]} */ q) => q[1]))] }));
  /** two solids overlapping (more than a touch) @param {number[]} a @param {number[]} b */
  const meet = (a, b) => [0, 1, 2].every(k => Math.min(a[2 * k + 1], b[2 * k + 1]) - Math.max(a[2 * k], b[2 * k]) > 0.1);
  /** @template {{ m: string }} S @param {S[]} ss @returns {S[]} */
  const tilesOf = ss => ss.filter(s => /^tile:[^:]+:\d/.test(s.m));   // a tile (not the slab)
  const floor = solidsOf(ft), floorTiles = tilesOf(floor);
  check('floor tiles: a slab in the grout\'s colour (0 … 11), on it each tile a millimetre thick (11 … 12) its product\'s photo from its corner; nothing in one plane twice',
    floor.some(s => s.m === 'grout:#686a68' && s.b[4] === 0 && s.b[5] === 11) && floorTiles.length > 0 && floorTiles.every(s => s.m.startsWith('tile:paradyz-authority-graphite:') && s.b[4] === 11 && s.b[5] === 12 && s.uvAt?.[2] === 12)
    && ft.parts.filter((/** @type {any} */ p) => p.layer === 'smallCuts').length === ft.count.small && !floor.some((a, i) => floor.slice(i + 1).some(b => meet(a.b, b.b))));
  check('a tile\'s photo: one of the product\'s images, turned, at the tile\'s own size (tile:<product>:<image>:<u>x<v>:<turn>)', floorTiles.every(s => /^tile:paradyz-authority-graphite:[0-7]:\d+x\d+:[0-3]$/.test(s.m)));
  check('floor tiles: none in a room with no scene', !H.node('house/groundFloor/garage_2/floorTiles'));
  /* --- use case: the walls' tiles round the floor, from a joint over the floor's tiles up to the ceiling or the roof's slope,
     less the openings; the corners meeting, no solid in another --- */
  {
    const wt = /** @type {any} */ (H.node('house/firstFloor/bathroom_5/wallTiles')), bath5 = /** @type {any} */ (H.node('house/firstFloor/bathroom_5')), ft5 = /** @type {any} */ (H.node('house/firstFloor/bathroom_5/floorTiles'));
    check('bathroom 5\'s wall tiles: a node of its own (layer wallTiles), counted: ' + JSON.stringify(wt?.count), wt?.layer === 'wallTiles' && wt.count.tiles === wt.count.whole + wt.count.cut && wt.count.area > 15 && wt.count.area < 30.74);
    const W = tilesOf(solidsOf(wt)).filter(s => s.b[5] - s.b[4] > 1);   // upright ones (not a casing's top)
    check('from a joint (2) over the floor\'s tiles (12): no wall\'s tile lower than 14', W.every(s => s.b[4] >= 14 - 1e-6));
    /** the roof's underside over y, in the room's axes @param {number} y */
    const roof = y => Math.min(bath5.ceilingHeight, ...bath5.slopes.map((/** @type {any} */ l) => l.a + l.s * y));
    /** a prism's section: [y, h] (a wall along y: its outline; along x: across it) */
    const over = W.filter(s => s.poly ? s.poly.some(q => q[1] > roof(q[0]) + 0.5) : s.b[5] > Math.min(roof(s.b[2]), roof(s.b[3])) + 0.5);
    check('under the roof: none above its slope (cut on the slant)' + (over.length ? ': ' + over.length + ' over' : ''), over.length === 0 && W.some(s => s.poly && s.poly.length !== 4));
    const face = (/** @type {number[]} */ b) => b[1] - b[0] <= 1 + 1e-6 ? [b[0], b[1]] : [b[2], b[3]];   // across its millimetre
    check('the tiles\' face 12 off the wall (the room 2730 × 3010; the casing\'s at 262, 1772)', W.every(s => [11, 12, 2718, 2719, 2998, 2999, 262, 263, 1771, 1772].some(v => face(s.b).some(f => Math.abs(f - v) < 1e-6))));
    const all = [...solidsOf(wt), ...solidsOf(ft5)];
    check('no solid in another (slabs, tiles: nothing in one plane twice)', !all.some((a, i) => all.slice(i + 1).some(b => meet(a.b, b.b))));
    check('none where the room has no wall tiles (the kitchen)', !H.node(room + 'wallTiles'));
  }

  /* --- use case: a casing built before the tiles (bathroom 7: the WC's, its niche): none under it, none behind it; its faces
     tiled, the niche's back, sides, floor and top too; at an outer corner the face along y past, over the other's end --- */
  {
    const b7 = 'house/groundFloor/bathroom_7/', wt = /** @type {any} */ (H.node(b7 + 'wallTiles')), ft7 = /** @type {any} */ (H.node(b7 + 'floorTiles'));
    const S = [...solidsOf(wt), ...solidsOf(ft7)], F = tilesOf(S);
    const casing = [2230, 2510, 0, 850, 0, 2720], niche = [2230, 2380, 373, 797, 1188, 2012];
    check('nothing in the casing (under it, behind it), but in its niche', !S.some(s => meet(s.b, casing) && !meet(s.b, niche)));
    check('its front tiled, its face 12 in front of it (2218), to the outer corner past (862)', F.some(s => s.b[0] === 2218 && s.b[1] === 2219 && s.b[3] === 862));
    check('the niche: its back (2368), sides (385, 785), floor (1200) and top (2000) tiled', [F.some(s => s.b[0] === 2368 && s.b[1] === 2369), F.some(s => s.b[3] === 385), F.some(s => s.b[2] === 785), F.some(s => s.b[5] === 1200), F.some(s => s.b[4] === 2000)].every(Boolean));
    const cab = /** @type {any} */ (H.node(b7 + 'cabinet'));
    check('the wall cabinet in the niche: between its tiles (400 × 800 × 150, from 1200, its front at the front\'s tiles)', !S.some(s => meet(s.b, [2218, 2368, 385, 785, 1200, 2000])) && cab.offset[0] - 150 === 2218);
    check('no solid in another', !S.some((a, i) => S.slice(i + 1).some(b => meet(a.b, b.b))));
  }

  /* every function in a use case: assembleRooms through the house (it assembles the rooms on the house's hierarchy) */
  const left = missing().filter(k => k !== 'assembleRooms');
  check('the API: every function in a use case (assembleRooms through the house: its rooms built)' + (left.length ? ': not ' + left.join(', ') : ''), left.length === 0 && /** @type {any} */ (H.node(room + 'g1')).type === 'cabinetGroup');
}
