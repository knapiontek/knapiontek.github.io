// @ts-check
// test/room/cabinets.js: room/cabinets.js: the kitchen's file (room_356.cabinets.json): no problems, its groups, its carcasses
// stacked and their kinds, the tree (a carcass under the worktop or the plasterboard over it, measured from it), the design's
// axes (from the wall, from the left) in the model's (y toward the wall); then a faulty file: what stops it, what is skipped.

import { cabinetsOf } from '../../room/cabinets.js';
import { openCatalog } from '../../library/catalog.js';
import { createHierarchy } from '../../core/hierarchy.js';

/** @typedef {import('../../room/cabinets.js').CabinetNode} CabinetNode */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const catalog = await openCatalog();
  const file = await (await fetch(new URL('../../room/room_356.cabinets.json', import.meta.url))).json();
  /** @param {() => unknown} f */
  const throws = f => { try { f(); return false; } catch { return true; } };

  /* ---------- the kitchen ---------- */
  {
    const { groups, layout, problems } = cabinetsOf(file, catalog);
    check('kitchen: no problems' + (problems.length ? ': ' + problems.map(p => p.text).join(' | ') : ''), problems.length === 0);
    check('kitchen: three groups, g1 g2 g3', groups.map(g => g.id).join() === 'g1,g2,g3');
    const carcass = (/** @type {string} */ name) => layout.flatMap(G => G.carcasses).find(c => c.name === name);
    check('carcasses: by name, in their groups', layout.map(G => G.carcasses.map(c => c.name).join(' ')).join(' | ') === 'K11 K12 K13 K1X | K21 K22 K23 K24 K25 K26 K27 K28 K29 K2X | K31 K32');
    check('kinds: a base under the worktop, with a hob; a sink', carcass('K11')?.kind === 'base' && carcass('K11')?.flags.join() === 'hob' && carcass('K12')?.flags.join() === 'sink');
    check('stack: K21 on the spaces of group 2 (plinth 150 + 720 + 38): at 908, on the worktop of group 1', carcass('K21')?.h0 === 908 && carcass('K21')?.kind === 'wall');
    check('kinds: a tall one on the plinth, the oven\'s; a fridge', carcass('K25')?.kind === 'tall' && carcass('K25')?.legs === 4 && carcass('K27')?.flags.join() === 'fridge' && carcass('K27')?.grille === true);

    /** a node by its path in a group @param {CabinetNode} g @param {string} path */
    const at = (g, path) => path.split('/').reduce((/** @type {CabinetNode | undefined} */ n, id) => n?.children?.find(c => c.id === id), g);
    const [g1, g2, g3] = groups;
    const k11 = at(g1, 'worktop/K11');
    check('tree: K11 under the worktop, measured from it: 59 from its left, 28 from the wall, 720 under it', k11?.offset.join() === '59,-28,-720' && k11?.size.join() === '800,-550,720');
    check('tree: the worktop from the wall (its zero) to 20 before the fronts: 28 + 550 + 2 + 18 + 20', at(g1, 'worktop')?.offset.join() === '0,0,870' && at(g1, 'worktop')?.size.join() === '3513,-618,38');
    check('tree: the tall units under the plasterboard over them, 14 from it', ['K21', 'K23', 'K25', 'K27', 'K29'].every(k => at(g2, 'plasterboard_1/' + k)?.offset[1] === -14) && at(g2, 'plasterboard_1/K21')?.offset[2] === 908 - 2568);
    check('tree: the island\'s carcasses 310 from the back of its worktop; its back panel', at(g3, 'worktop/K31')?.offset[1] === -310 && !!at(g3, 'islandBackPanel'));
    check('tree: a carcass\'s modules bottom up: the oven, the microwave in K25', (at(g2, 'plasterboard_1/K25')?.children || []).map(c => c.id).join() === 'cabinet_1,oven,microwave,cabinet_2');
    check('tree: what runs along a group, its layer', at(g1, 'plinth')?.layer === 'plinth' && at(g1, 'strip_1')?.layer === 'strips' && at(g1, 'worktop')?.layer === 'worktop' && k11?.layer === 'boards');

    /* the model's axes: every size toward the room at negative y; K11 as the maker measures it, 28 – 578 from the wall */
    /** @param {CabinetNode} n @returns {CabinetNode[]} */
    const sizes = n => [n, ...(n.children || []).flatMap(sizes)];
    check('axes: every node from its zero at its back toward the room: a negative y', groups.flatMap(sizes).every(n => n.size[1] < 0 && n.size[0] > 0 && n.size[2] > 0));
    const H = createHierarchy(/** @type {CabinetNode} */ (JSON.parse(JSON.stringify(g1))));
    check('axes: K11 in its group, 28 – 578 from the wall at y −28 – −578', H.box(/** @type {CabinetNode} */ (H.node('worktop/K11'))).join() === '59,859,-578,-28,150,870');
    check('the hierarchy of a group: sound', H.checks().filter(c => !c.info).every(c => c.items.length === 0));
    check('the same file, the same nodes', JSON.stringify(cabinetsOf(file, catalog).groups) === JSON.stringify(groups));
  }

  /* ---------- a faulty file ---------- */
  {
    const copy = () => JSON.parse(JSON.stringify(file));
    check('format: another version throws', throws(() => cabinetsOf({ ...copy(), version: 2 }, catalog)));
    const noDepth = copy(); delete noDepth.settings.carcass.depth;
    check('settings: one missing stops the build', throws(() => cabinetsOf(noDepth, catalog)));
    const noOffset = copy(); delete noOffset.groups[0].carcass;
    check('groups: no carcasses\' offset (the group\'s or the settings\') stops it', throws(() => cabinetsOf(noOffset, catalog)));
    const bad = copy();
    bad.components.push({ group: 1, column: 4, span: 1, type: 'shelf', height: 100 }, { group: 1, column: 12, span: 3, type: 'space', height: 10 }, { group: 9, column: 1, type: 'space', height: 1 });
    const { problems } = cabinetsOf(bad, catalog), skipped = problems.filter(p => p.skipped).map(p => p.text);
    check('components: an unknown type, beyond the columns, no such group: skipped', skipped.length === 3 && skipped.some(t => t.includes('unknown type "shelf"')) && skipped.some(t => t.includes('runs out')) && skipped.some(t => t.includes('no group 9')));
  }
}
