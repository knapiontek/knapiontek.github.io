// @ts-check
// test/house/build.js: house/build.js and its model.json: the hierarchy sound, every layer in layers.json, every type known;
// then the house against archon/analysis.md: walls, openings, slab, chimney, foundations, finishes, rooms.

import { buildHouse } from '../../house/build.js';

/** @typedef {import('../../house/build.js').HouseNode} HouseNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const house = await buildHouse();
  /** @type {Record<string, any>} */
  const layers = await (await fetch(new URL('../../layers.json', import.meta.url))).json();
  /** @type {string[]} */
  const keys = [];
  (function walk(/** @type {Record<string, any>} */ t) { for (const [k, l] of Object.entries(t)) { keys.push(k); if (typeof l !== 'string') walk(l.layers); } })(layers);
  /** @param {string} path */
  const at = path => /** @type {HouseNode} */ (house.node(path));
  /** @param {string} path */
  const box = path => house.box(at(path)).map(v => Math.round(v * 10) / 10).join();

  /* ---------- the hierarchy ---------- */
  {
    check('buildHouse: the house at the root, at the zero', house.root.id === 'house' && house.place(house.root).join() === '0,0,0' && !('format' in house.root));
    check('its branches: foundation, the two floors, facade, roof, stair, site', (house.root.children || []).map(n => n.id).join() === 'foundation,groundFloor,firstFloor,facade,roof,stair,site');
    const checks = house.checks(keys);
    const faults = checks.filter(c => !c.info && c.items.length);
    check('checks: nothing to correct, every layer in layers.json' + (faults.length ? ': ' + faults.map(c => c.name + ' ' + c.items.slice(0, 3).join('; ')).join(' | ') : ''), faults.length === 0);
    const types = house.root.geometry.types, GROUPS = ['house', 'assembly', 'floor', 'site'];
    /** @type {string[]} */
    const unknown = [];
    house.walk(n => { if (!types[n.type] && !GROUPS.includes(n.type) && !/** @type {HouseNode} */ (n).area) unknown.push(house.path(n) + ': ' + n.type); });
    check('every element of a type in geometry.types' + (unknown.length ? ': not ' + unknown.join(', ') : ''), unknown.length === 0);
    check('every type that is drawn has its layers', Object.entries(types).every(([k, t]) => k.startsWith('void') || (t.layers?.length > 0)));
  }

  /* ---------- the layers, as the panel switches them ---------- */
  {
    check('layers: a wall of the Ground Floor', house.layers(at('groundFloor/blockGarden')).join() === 'groundFloor,blocks');
    check('layers: the garage window, in its wall', house.layers(at('groundFloor/blockLeft/window_garage_2')).join() === 'groundFloor,blocks,windows');
    check('layers: an inner door', house.layers(at('firstFloor/attic3b/door_hall_1_bathroom_5')).join() === 'firstFloor,blocks,innerDoors');
    check('layers: the ceiling, in the Attic', house.layers(at('roof/ceiling')).join() === 'roof,ceiling,attic');
    check('layers: EPS, its own', house.layers(at('facade/epsGarden')).join() === 'eps');
  }

  /* ---------- against archon/analysis.md (x East, y South, h up from ±0.00) ---------- */
  {
    check('§ 8.1: the garden wall, x 12760 – 13000, y 440 – 8660, h 0 → 2720', box('groundFloor/blockGarden') === '12760,13000,440,8660,0,2720');
    check('§ 8.1: the left wall through both wings, x −800 – 14000', box('groundFloor/blockLeft') === '-800,14000,200,440,0,2720');
    check('§ 9: the garage window 2000/1000, x 3580 – 5580, h 1100 → 2100', box('groundFloor/blockLeft/window_garage_2') === '3580,5580,0,440,1100,2100');
    check('§ 9: the garden window 6000/2400', box('groundFloor/blockGarden/window_living_5') === '12760,13200,1550,7550,0,2400');
    check('§ 9 #1, § 13: the chimney 760 × 760, h 0 → 9000', box('groundFloor/chimney') === '7730,8490,3590,4350,0,9000');
    check('§ 7: the slab with its ring beam, h 2720 – 3060', box('groundFloor/slab') === '200,13000,200,8900,2720,3060');
    check('§ 7.1: the footing of #2 (as built), h −1320 → −920', box('foundation/footingWall2') === '7550,8150,620,3410,-1320,-920');
    check('§ 8.3, § 13: the recess soffit EPS 470, h 2250 – 2720', box('facade/epsSoffit') === '0,900,4550,8460,2250,2720');
    check('§ 13: the door in #9, 900, x 1675 – 2575', box('groundFloor/wall9/door_vestibule_1_garage_2') === '1675,2575,4110,4230,0,2050');
    check('§ 13: the First Floor bathroom door, x 6000 – 6900', box('firstFloor/attic3b/door_hall_1_bathroom_5') === '6000,6900,5530,5650,3060,5110');
    check('§ 10: the garden gable window, x 12760 – 13200, h 3060 → 6520', box('firstFloor/gableGarden/window_bedroom_2') === '12760,13200,1550,7550,3060,6520');
    check('§ 6: the roof window above the stairs, x 5870 – 6810, y 240 – 1280', box('roof/roofWindow_hall_1').startsWith('5870,6810,240,1280'));
    check('§ 5, § 6: the roof underside at the outer face, 3864', at('roof').eave === 3864);
    check('§ 5: the floors split at the slab, 2720; the body x 0 – 13200', house.root.geometry.split === 2720 && house.root.geometry.body.join() === '0,13200');
    const band = house.root.geometry.finishes.find((/** @type {any} */ f) => f.material === 'plasterWhite');
    check('§ 8.5: the white band over the garage and the recess, x 0 – 200, h 2250 – 3060', band?.x.join() === '0,200' && band.h.join() === '2250,3060');
    const site = at('site'), lawn = site.offset[2] + site.lawn.h;
    const terrace = site.surfaces[0], tx = terrace.rect.map((/** @type {number} */ v, /** @type {number} */ i) => v + site.offset[i < 2 ? 0 : 1]);
    check('§ 14: the lawn at −320; the garden terrace x 14200 – 15700, y 300 – 8800, top −20', lawn === -320 && tx.join() === '14200,15700,300,8800' && site.offset[2] + terrace.h === -20);
  }

  /* ---------- the rooms, as archon numbers them; their floors in m² (§ 9, § 10, § 13) ---------- */
  {
    /** @type {string[]} */
    const rooms = [];
    /** @type {Record<string, number>} */
    const m2 = {};
    house.walk(n => { const r = /** @type {HouseNode} */ (n); if (r.area) { rooms.push(r.id); m2[r.id] = Math.round(r.area.reduce((/** @type {number} */ s, /** @type {number[]} */ q) => s + (q[1] - q[0]) * (q[3] - q[2]), 0) / 1e4) / 100; } });
    check('rooms: archon\'s, on each floor', rooms.join() === 'vestibule_1,garage_2,room_356,bathroom_7,boiler_8,hall_1,bedroom_2,wardrobe_3,wardrobe_4,bathroom_5,bedroom_6,bedroom_7,wardrobe_8');
    check('rooms: Ground Floor m² as § 9', m2.vestibule_1 === 5.01 && m2.garage_2 === 25.56 && m2.room_356 === 50.74 && m2.bathroom_7 === 4.83 && m2.boiler_8 === 5.43);
    check('rooms: First Floor m² as § 10', m2.hall_1 === 7.26 && m2.wardrobe_3 === 5.2 && m2.wardrobe_4 === 4.79 && m2.bathroom_5 === 8.22 && m2.bedroom_7 === 14.41 && m2.wardrobe_8 === 4.33);
    check('rooms: the bedroom and room 6 as built (§ 13: the wardrobe walls, #12 to 5650): 28.79 and 17.43', m2.bedroom_2 === 28.79 && m2.bedroom_6 === 17.43);
  }
}
