// @ts-check
// test/view3d.js: view3d.js by use cases, without a canvas (the scene only), as index.js uses it: two blocks drawn (of one
// wall: welded, no line on the seam; of two: a contact piece, raw); a carcass by the East wall (a turned node); the house shown
// (its axes and three's, a material's look, a prism's faces); the panel switching layers, floors, the Attic, the facade,
// edges; the menu's cameras; the site; a product drawn by its shape in the room's metal; the page without a canvas, closed.
// Every call in one.

import * as API from '../view3d.js';
import { openCatalog } from '../library/catalog.js';
import { assembleHouse } from '../house/assembly.js';
import { createHierarchy } from '../core/hierarchy.js';

/** @typedef {import('../view3d.js').Node} Node */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const catalog = await openCatalog(), { hierarchy: H } = await assembleHouse(catalog);
  const house = /** @type {Node} */ (H.node('house'));
  /** @type {Set<string>} the calls a use case makes */
  const used = new Set(['createView3d']);
  const made = /** @type {Record<string, any>} */ (API.createView3d({ catalog, edges: { color: '#7d807b', opacity: 0.45 } }));
  const scene = /** @type {ReturnType<typeof API.createView3d>} */ (new Proxy(made, { get: (v, k) => { if (typeof v[/** @type {string} */ (k)] === 'function') used.add(String(k)); return v[/** @type {string} */ (k)]; } }));
  /** the meshes of a layer and floor @param {string} layer @param {string} floor */
  const of = (layer, floor) => scene.meshes().filter((/** @type {any} */ m) => m.userData.layer === layer && m.userData.floor === floor);
  /** a mesh's colour @param {any} m */
  const colour = m => '#' + m.material.color.getHexString();
  /** the line segments shown @returns {number} */
  const segments = () => scene.lines().filter((/** @type {any} */ l) => l.visible).reduce((s, /** @type {any} */ l) => s + l.geometry.attributes.position.count / 2, 0);

  /* --- use case: two blocks side by side: of one wall (welded), of two (a contact piece each) --- */
  {
    /** two boxes 1000 × 1000 × 1000 along x, of layers a and b @param {string} a @param {string} b */
    const two = (a, b) => createHierarchy(/** @type {Node} */ ({ id: 'site', type: 'site', offset: [0, 0, 0], size: [2000, 1000, 1000], children: [
      { id: 'one', type: 't', offset: [0, 0, 0], size: [1000, 1000, 1000], layer: a, parts: [{ form: 'box', box: [0, 1000, 0, 1000, 0, 1000], material: 'concrete' }] },
      { id: 'two', type: 't', offset: [1000, 0, 0], size: [1000, 1000, 1000], layer: b, parts: [{ form: 'box', box: [0, 1000, 0, 1000, 0, 1000], material: 'concrete', raw: 'block', finish: 'f' }] }] }));
    const same = two('a', 'a');
    scene.show(same, same.root);
    check('welded: one group, the joint between them gone (10 faces of 12)', scene.count().pieces === 10);
    check('edges: none on the seam: 16 segments round the two (the long edges in two)', segments() === 16);
    const apart = two('a', 'b');
    scene.show(apart, apart.root);
    check('two groups: the joint kept on each side, a contact piece', scene.count().pieces === 12);
    check('a contact piece: the raw material', scene.meshes().some((/** @type {any} */ m) => m.userData.material === 'block'));
    scene.visible(k => k !== 'a');
    check('a contact piece\'s line shows while the other group is hidden', segments() === 12);
    scene.visible(() => true);
    /* a chimney (a), a wall against it in its plane (b), a balustrade's end against the wall by the joint (c): no line on the joint */
    const three = createHierarchy(/** @type {Node} */ ({ id: 'site', type: 'site', offset: [0, 0, 0], size: [1, 1, 1], children: [
      { id: 'chimney', type: 't', offset: [0, 0, 0], size: [1, 1, 1], layer: 'a', parts: [{ form: 'box', box: [0, 1000, 0, 1000, 0, 1000], material: 'concrete' }] },
      { id: 'wall', type: 't', offset: [0, 0, 0], size: [1, 1, 1], layer: 'b', parts: [{ form: 'box', box: [0, 240, -1000, 0, 0, 1000], material: 'concrete' }] },
      { id: 'balustrade', type: 't', offset: [0, 0, 0], size: [1, 1, 1], layer: 'c', parts: [{ form: 'box', box: [-500, 0, -100, 0, 0, 500], material: 'concrete' }] }] }));
    scene.show(three, three.root);
    const joint = () => scene.lines().filter((/** @type {any} */ l) => l.visible).some((/** @type {any} */ l) => { const p = l.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 6) if (p[i] === 0 && p[i + 3] === 0 && p[i + 1] === 0 && p[i + 4] === 0 && Math.min(p[i + 2], p[i + 5]) < 500) return true; return false; });
    check('edges: a joint in one plane hides, also where the wall is against a third solid', !joint());
    scene.visible(k => k !== 'c');
    check('edges: the third solid hidden, the joint still without a line (no marks where it lay)', !joint());
    scene.visible(() => true);
  }

  /* --- use case: a turned node: a side of a carcass in a run by the East wall, fronts West (turn 3: x South, y East toward the wall);
     its zero at the wall, at its left end as one sees the fronts ---------- */
  {
    const room = createHierarchy(/** @type {Node} */ ({ id: 'room', type: 'room', offset: [0, 0, 0], size: [4000, 3000, 2700], children: [
      { id: 'group', type: 'g', offset: [4000, 3000, 0], turn: 3, size: [1200, -600, 900], children: [
        { id: 'side', type: 'board', offset: [100, -28, 0], size: [18, -550, 720], layer: 'boards', parts: [{ form: 'box', box: [0, 18, -550, 0, 0, 720], material: 'concrete' }] }] }] }));
    scene.show(room, room.root);
    const box = scene.meshes()[0].geometry.boundingBox || (scene.meshes()[0].geometry.computeBoundingBox(), scene.meshes()[0].geometry.boundingBox);
    const mm = [box.min.x, box.max.x, box.min.y, box.max.y, box.min.z, box.max.z].map(v => Math.round(v));   // the geometry in mm, the world scaled to m
    check('turn: the side in the room\'s axes (x 3422–3972 from the East wall, y 2882–2900)', mm.join() === '3422,3972,2882,2900,0,720');
  }

  /* --- use case: index.js shows the house --- */
  {
    scene.show(H, house);
    const count = scene.count();
    check('show: the house\'s parts, every one drawn', count.pieces > 1000 && count.meshes > 30 && count.lines > 30 && count.skipped === 0);
    const blocks = of('blocks', 'groundFloor');
    check('a mesh per group and material: the Ground Floor\'s blocks, plaster', blocks.length === 1 && colour(blocks[0]) === catalog.material('plasterInside').color);
    const p = blocks[0].position.clone().set(12760, 440, 0);
    blocks[0].localToWorld(p);
    check('three\'s axes: ours as they are (x East, y North, h up), in metres', p.toArray().map((/** @type {number} */ v) => Math.round(v * 1000)).join() === '12760,440,0');
    check('a prism\'s faces by their side: the roof, graphite tiles, a white underside, graphite eaves', ['roofGraphite', 'plasterWhite', 'graphite'].every(k => of('roofPlanes', 'attic').some((/** @type {any} */ m) => m.userData.material === k)));
    check('drawn: the windows\' frames and glass', ['frame', 'glass'].every(k => of('windows', 'groundFloor').some((/** @type {any} */ m) => m.userData.material === k)));
  }

  /* --- use case: the panel switches layers, floors, the Attic, the facade, edges --- */
  {
    const shown = (/** @type {any[]} */ ms) => ms.length > 0 && ms.every(m => m.visible), hidden = (/** @type {any[]} */ ms) => ms.length > 0 && ms.every(m => !m.visible);
    scene.visible(k => k !== 'blocks');
    check('Blocks off hides the walls, not the EPS', hidden(of('blocks', 'groundFloor')) && shown(of('eps', 'groundFloor')));
    scene.visible(k => k !== 'groundFloor');
    check('Ground Floor off hides its walls and the EPS below 2720, not above', hidden(of('blocks', 'groundFloor')) && hidden(of('eps', 'groundFloor')) && shown(of('eps', 'firstFloor')));
    scene.visible(k => k !== 'attic');
    check('Attic off hides the roof, its windows, the ceiling', hidden(of('roofPlanes', 'attic')) && hidden(of('roofWindows', 'attic')) && hidden(of('ceiling', 'attic')) && shown(of('blocks', 'firstFloor')));
    scene.visible(k => k !== 'facade');
    check('Facade off: the EPS raw', of('eps', 'groundFloor').every((/** @type {any} */ m) => colour(m) === catalog.material('insulation').color));
    scene.visible(() => true);
    check('Facade on: the EPS finished', of('eps', 'groundFloor').some((/** @type {any} */ m) => colour(m) === catalog.material('graphite').color));
    scene.edges(false);
    check('edges: off', segments() === 0);
    scene.edges(true);
    check('edges: on', segments() > 0);
  }

  /* --- use case: the menu's cameras: Front, Garden, Above --- */
  {
    scene.view('front');
    const front = scene.camera.position.x;
    scene.view('garden');
    const garden = scene.camera.position.x;
    scene.view('above');
    check('view: the front from the West, the garden from the East, above from over it; h up', front < 0 && garden > 13.2 && scene.camera.position.z > 15 && scene.camera.up.toArray().join() === '0,0,1');
  }

  /* --- use case: the site shown, with its house --- */
  {
    scene.show(H, /** @type {Node} */ (H.root));
    check('the site: the lawn, the decking, the paving, with the house', ['lawn', 'woodHorizontal', 'paving'].every(k => of('site', /** @type {any} */ (undefined)).some((/** @type {any} */ m) => m.userData.material === k)) && of('blocks', 'groundFloor').length === 1);
  }

  /* --- use case: a product drawn by its shape, in the room's metal (Finish) --- */
  {
    /** @param {Record<string, any>} [settings] */
    const room = settings => createHierarchy(/** @type {Node} */ ({ id: 'room', type: 'room', offset: [0, 0, 0], size: [2000, 2000, 2500], settings, children: [
      { id: 'tap', type: 'tap', offset: [500, 100, 850], size: [50, 180, 175], layer: 'basin', product: 'hansgrohe-tecturis-e-110-73010140' }] }));
    const R = room({ metal: 'brass' });
    scene.show(R, R.root);
    const tap = of('basin', /** @type {any} */ (undefined));
    check('a product: its shape\'s parts (four cylinders)', tap.length === 4);
    check('the fittings\' metal: the room\'s setting', tap.every((/** @type {any} */ m) => colour(m) === catalog.material('brass').color));
    const bare = room();
    let error = '';
    try { scene.show(bare, bare.root); } catch (e) { error = String(e); }
    check('no setting metal: it says where', error.includes('tap') && error.includes('metal'));
  }

  /* --- use case: a product lofted through a mirroring matrix (the bath): its faces out, its inner floor seen from above --- */
  {
    const R = createHierarchy(/** @type {Node} */ ({ id: 'room', type: 'room', offset: [0, 0, 0], size: [3000, 3000, 2500], settings: { metal: 'nickel' }, children: [
      { id: 'bath', type: 'product', offset: [2340, 230, 12], turn: 2, size: [1700, -750, 580], layer: 'bath', product: 'castorama-bath-freestanding-170x75' }] }));
    scene.show(R, R.root);
    const g = of('bath', /** @type {any} */ (undefined)).find((/** @type {any} */ m) => m.geometry.index)?.geometry;
    const P = g.attributes.position, I = g.index.array, zs = /** @type {number[]} */ ([]);
    for (let k = 0; k < P.count; k++) zs.push(P.getZ(k));
    const floorOf = (/** @type {number} */ z) => { let up = 0, down = 0; for (let k = 0; k < I.length; k += 3) {
      const [a, b, c] = [I[k], I[k + 1], I[k + 2]];
      if (![a, b, c].every(i => Math.abs(P.getZ(i) - z) < 0.01)) continue;
      const ux = P.getX(b) - P.getX(a), uy = P.getY(b) - P.getY(a), vx = P.getX(c) - P.getX(a), vy = P.getY(c) - P.getY(a);
      if (ux * vy - uy * vx > 0) up++; else down++;
    } return { up, down }; };
    const low = Math.min(...zs), inner = floorOf(low + 100), outer = floorOf(low);
    check('its inner floor faces up (seen from above), its bottom down', inner.up > 0 && inner.down === 0 && outer.down > 0 && outer.up === 0);
  }

  /* --- use case: the page without a canvas (a test, a worker): resize and the sun do nothing; closed, nothing left drawn --- */
  {
    scene.resize(); scene.sun({ az: 200, el: 40, k: 1, clouds: 0, night: false });
    scene.dispose();
    check('without a canvas: resize and the sun do nothing; closed: no meshes, no lines', scene.meshes().length === 0 && scene.lines().length === 0);
  }

  const missing = [...Object.keys(API), ...Object.keys(made).filter(k => typeof made[k] === 'function')].filter(k => !used.has(k));
  check('the API: every call in a use case' + (missing.length ? ': not ' + missing.join(', ') : ''), missing.length === 0);
}
