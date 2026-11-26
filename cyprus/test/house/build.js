// @ts-check
// test/house/build.js: house/build.js and its model.json: the hierarchy sound, every layer and floor in layers.json, every type
// known; the layer and the floor of a wall, a window, a door, the ceiling, the EPS; then the house in its own axes against
// archon/analysis.md: walls, openings, slab, chimney, foundations, finishes, roof, site, rooms.

import { buildHouse } from '../../house/build.js';

/** @typedef {import('../../house/build.js').HouseNode} HouseNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const H = await buildHouse();
  /** @type {Record<string, any>} */
  const blocks = await (await fetch(new URL('../../layers.json', import.meta.url))).json();
  /** @type {string[]} */
  const keys = [];
  (function walk(/** @type {Record<string, any>} */ t) { for (const [k, l] of Object.entries(t)) { keys.push(k); if (typeof l !== 'string') walk(l.layers); } })(blocks);
  const floors = Object.keys(blocks.floors.layers), known = { floors, layers: keys.filter(k => k !== 'floors' && !floors.includes(k)) };
  /** a node of the house by its path in it @param {string} path */
  const at = path => /** @type {HouseNode} */ (H.node(path ? 'house/' + path : 'house'));
  const house = at(''), zero = H.place(house);
  /** its box in the house's axes, as analysis.md gives it @param {string} path */
  const box = path => H.box(at(path)).map((v, i) => Math.round((v - zero[i >> 1]) * 10) / 10).join();
  const geometry = house.geometry;

  /* ---------- the hierarchy ---------- */
  {
    check('buildHouse: the site at the root, the house on it', H.root.id === 'site' && (H.root.children || []).map(n => n.id).join() === 'house' && !('format' in H.root));
    check('the house: its branches foundation, the two floors, facade, roof, stair', (house.children || []).map(n => n.id).join() === 'foundation,groundFloor,firstFloor,facade,roof,stair');
    const faults = H.checks(known).filter(c => !c.info && c.items.length);
    check('checks: nothing to correct, every layer and floor in layers.json' + (faults.length ? ': ' + faults.map(c => c.name + ' ' + c.items.slice(0, 3).join('; ')).join(' | ') : ''), faults.length === 0);
    const types = geometry.types, GROUPS = ['site', 'house', 'assembly', 'floor'];
    /** @type {string[]} */
    const unknown = [];
    H.walk(n => { if (!types[n.type] && !GROUPS.includes(n.type) && !/** @type {HouseNode} */ (n).area) unknown.push(H.path(n) + ': ' + n.type); });
    check('every element of a type in geometry.types' + (unknown.length ? ': not ' + unknown.join(', ') : ''), unknown.length === 0);
    check('every type that is drawn has its layer', Object.entries(types).every(([k, t]) => k.startsWith('void') || typeof t.layer === 'string'));
  }

  /* ---------- the layer (what it is) and the floor (where it is), as the panel switches them ---------- */
  {
    /** @param {string} path */
    const both = path => H.layer(at(path)) + ' ' + H.floor(at(path));
    check('a wall of the Ground Floor: blocks, groundFloor', both('groundFloor/blockGarden') === 'blocks groundFloor');
    check('the garage window in its wall: windows, not blocks', both('groundFloor/blockLeft/window_garage_2') === 'windows groundFloor');
    check('an inner door of the First Floor: innerDoors', both('firstFloor/attic3b/door_hall_1_bathroom_5') === 'innerDoors firstFloor');
    check('the ceiling under the roof: ceiling, in the Attic', both('roof/ceiling') === 'ceiling attic');
    check('the wall by the cathedral ceiling: blocks, the First Floor\'s (the bedroom\'s wall)', both('roof/loftWall') === 'blocks firstFloor');
    check('a roof window: roofWindows, the roof\'s floor, the Attic', both('roof/roofWindow_hall_1') === 'roofWindows attic' && H.layer(at('roof')) === 'roof');
    check('the site: site', H.layer(H.root) === 'site');
  }

  /* ---------- in the house's axes, against archon/analysis.md ---------- */
  {
    check('the house on the site: its zero 15800, 14900, 520 from the site\'s corner', zero.join() === '15800,14900,520');
    check('§ 8.1: the garden wall, x 12760 – 13000, y 440 – 8660, h 0 → 2720', box('groundFloor/blockGarden') === '12760,13000,440,8660,0,2720');
    check('§ 8.1: the left wall through both wings, x −800 – 14000', box('groundFloor/blockLeft') === '-800,14000,8660,8900,0,2720');
    check('§ 9: the garage window 2000/1000, x 3580 – 5580, h 1100 → 2100', box('groundFloor/blockLeft/window_garage_2') === '3580,5580,8660,9100,1100,2100');
    check('§ 9: the garden window 6000/2400', box('groundFloor/blockGarden/window_living_5') === '12760,13200,1550,7550,0,2400');
    check('§ 9 #1, § 13: the chimney 760 × 760, h 0 → 9000', box('groundFloor/chimney') === '7730,8490,4750,5510,0,9000');
    check('§ 7: the slab with its ring beam, h 2720 – 3060', box('groundFloor/slab') === '200,13000,200,8900,2720,3060');
    check('§ 7.1: the footing of #2 (as built), h −1320 → −920', box('foundation/footingWall2') === '7550,8150,5690,8480,-1320,-920');
    check('§ 8.3, § 13: the recess soffit EPS 470, h 2250 – 2720', box('facade/epsSoffit') === '0,900,640,4550,2250,2720');
    check('§ 13: the door in #9, 900, x 1675 – 2575', box('groundFloor/wall9/door_vestibule_1_garage_2') === '1675,2575,4870,4990,0,2050');
    check('§ 13: the First Floor bathroom door, x 6000 – 6900', box('firstFloor/attic3b/door_hall_1_bathroom_5') === '6000,6900,3450,3570,3060,5110');
    check('§ 10: the garden gable window, x 12760 – 13200, h 3060 → 6520', box('firstFloor/gableGarden/window_bedroom_2') === '12760,13200,1550,7550,3060,6520');
    check('§ 6: the roof window above the stairs, x 5870 – 6810, y 7820 – 8860', box('roof/roofWindow_hall_1').startsWith('5870,6810,7820,8860'));
    check('§ 5, § 6: the roof underside at the outer face, 3864', at('roof').eave === 3864);
    check('§ 5: the floors split at the slab, 2720; the body x 0 – 13200', geometry.split === 2720 && geometry.body.join() === '0,13200');
    const band = geometry.finishes.find((/** @type {any} */ f) => f.material === 'plasterWhite');
    check('§ 8.5: the white band over the garage and the recess, x 0 – 200, h 2250 – 3060', band?.x.join() === '0,200' && band.h.join() === '2250,3060');
    const site = /** @type {HouseNode} */ (H.root), terrace = site.surfaces[0];
    const tx = terrace.rect.map((/** @type {number} */ v, /** @type {number} */ i) => v - zero[i < 2 ? 0 : 1]);
    check('§ 14: the lawn at −320; the garden terrace x 14200 – 15700, y 300 – 8800, top −20', site.lawn.h - zero[2] === -320 && tx.join() === '14200,15700,300,8800' && terrace.h - zero[2] === -20);
  }

  /* ---------- what is drawn (house/parts.js): cut by the openings and the roof, split between the floors ---------- */
  {
    /** @type {{ materials: Record<string, unknown> }} */
    const library = await (await fetch(new URL('../../library/materials.json', import.meta.url))).json();
    /** @type {string[]} */
    const unknown = [];
    let parts = 0;
    H.walk(n => { for (const p of /** @type {HouseNode} */ (n).parts || []) { parts++; for (const m of [p.material, p.raw, ...Object.values(p.faces || {})]) if (m && !(m in library.materials)) unknown.push(H.path(n) + ': ' + m); } });
    check('parts: every material in the library' + (unknown.length ? ': not ' + [...new Set(unknown)].slice(0, 5).join(', ') : ''), parts > 400 && unknown.length === 0);
    /** the highest and lowest h of a node's parts, in the house's axes @param {string} path */
    const hs = path => { const n = at(path), h0 = H.place(n)[2] - zero[2]; const all = (n.parts || []).flatMap(p => (p.poly || []).map(q => q[1] + h0)); return [Math.min(...all), Math.max(...all)]; };
    const garden = at('groundFloor/blockGarden').parts || [];
    check('§ 3: the garden wall less its window (y 1550 – 7550, h 0 → 2400)', garden.length > 1 && garden.every(p => /** @type {number[][]} */ (p.poly).every(q => q[0] + 440 <= 1550 || q[0] + 440 >= 7550 || q[1] >= 2400)
      || /** @type {number[][]} */ (p.poly).every(q => q[0] + 440 <= 1550) || /** @type {number[][]} */ (p.poly).every(q => q[0] + 440 >= 7550) || /** @type {number[][]} */ (p.poly).every(q => q[1] >= 2400)));
    check('§ 6, § 13: the roof\'s ridge ≈ 8820', Math.abs(hs('roof')[1] - 8822) < 1);
    check('§ 3: the knee wall cut by the roof: 3060 up to its underside, not 9000', hs('firstFloor/kneeLeft')[0] === 3060 && hs('firstFloor/kneeLeft')[1] < 4300);
    const eps = (at('facade/epsLeft').parts || []).map(p => p.floor);
    check('§ 5: the EPS split at 2720, Ground Floor below, First Floor above', eps.includes('groundFloor') && eps.includes('firstFloor'));
    check('the roof\'s planes: their own layer', (at('roof').parts || []).every(p => p.layer === 'roofPlanes'));
    const door = at('groundFloor/wall9/door_vestibule_1_garage_2');
    check('an inner door: its frame and its leaf, the leaf on its hinge', (door.parts || []).some(p => p.mover === 'leaf') && door.movers?.[0].id === 'leaf');
  }

  /* ---------- the rooms, as archon numbers them; their floors in m² (§ 9, § 10) ---------- */
  {
    /** @type {string[]} */
    const rooms = [];
    /** @type {Record<string, number>} */
    const m2 = {};
    H.walk(n => { const r = /** @type {HouseNode} */ (n); if (r.area) { rooms.push(r.id); m2[r.id] = Math.round(r.area.reduce((/** @type {number} */ s, /** @type {number[]} */ q) => s + (q[1] - q[0]) * (q[3] - q[2]), 0) / 1e4) / 100; } });
    check('rooms: archon\'s, on each floor', rooms.join() === 'vestibule_1,garage_2,room_356,bathroom_7,boiler_8,hall_1,bedroom_2,wardrobe_3,wardrobe_4,bathroom_5,bedroom_6,bedroom_7,wardrobe_8');
    check('rooms: Ground Floor m² as § 9', m2.vestibule_1 === 5.01 && m2.garage_2 === 25.56 && m2.room_356 === 50.74 && m2.bathroom_7 === 4.83 && m2.boiler_8 === 5.43);
    check('rooms: First Floor m² as § 10', m2.hall_1 === 7.26 && m2.bedroom_2 === 28.79 && m2.wardrobe_3 === 5.2 && m2.wardrobe_4 === 4.79 && m2.bathroom_5 === 8.22
      && m2.bedroom_6 === 17.43 && m2.bedroom_7 === 14.41 && m2.wardrobe_8 === 4.33);
  }
}
