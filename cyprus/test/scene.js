// @ts-check
// test/scene.js: scene.js without a canvas (the scene only): the house drawn from its parts, in its axes, three's axes, the
// look of a material, a prism's faces, what the panel switches (layers, floors part by part, the facade), the cameras; a
// product drawn by its shape, in the fittings' metal.

import { createScene } from '../scene.js';
import { openCatalog } from '../library/catalog.js';
import { buildHouse } from '../house/build.js';
import { createHierarchy } from '../core/hierarchy.js';

/** @typedef {import('../scene.js').Node} Node */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const catalog = await openCatalog(), H = await buildHouse();
  const at = (/** @type {string} */ path) => /** @type {Node} */ (H.node('house/' + path));
  const house = /** @type {Node} */ (H.node('house'));
  const plot = createScene({ catalog, edges: { color: '#7d807b', opacity: 0.45 } });

  /* ---------- the house ---------- */
  {
    plot.show(H, house);
    let nodes = 0, parts = 0;
    H.walk(n => { const d = /** @type {Node} */ (n); if (d.parts && H.chain(d).includes(house)) { nodes++; parts += d.parts.length; } });
    const count = plot.count();
    check('show: every node of the house with parts, every part a mesh', count.nodes === nodes && count.meshes === parts && count.skipped === 0 && nodes > 70);
    const wall = plot.group(at('groundFloor/blockGarden'));
    check('show: a node at its place in the house\'s axes (the garden wall 12760, 440, 0)', wall?.position.toArray().join() === '12760,440,0');
    wall.children[0].geometry.computeBoundingBox();
    const bb = wall.children[0].geometry.boundingBox;
    check('show: a prism of it, in its axes: 240 thick, up to 2720', bb.min.x === 0 && bb.max.x === 240 && bb.max.z === 2720);
    const p = wall.getWorldPosition(wall.position.clone());
    check('three\'s axes: x → x, h → y, y → z, metres', p.toArray().map((/** @type {number} */ v) => Math.round(v * 1000)).join() === '12760,0,440');
    check('the look: a block\'s plaster, as the catalog gives it', '#' + wall.children[0].material.color.getHexString() === catalog.material('plasterInside').color);
    check('edges: with each mesh, its lines', wall.children[0].children.some((/** @type {any} */ o) => o.userData.edge));
    const roof = plot.group(at('roof')), faces = roof.children[0].material;
    check('a prism\'s faces by their side: the roof, graphite tiles on top, white under', Array.isArray(faces) && faces.some(m => '#' + m.color.getHexString() === catalog.material('roofGraphite').color)
      && faces.some(m => '#' + m.color.getHexString() === catalog.material('plasterWhite').color));
    check('drawn: a window\'s frame and glass; not drawn: a room', plot.group(at('groundFloor/blockLeft/window_garage_2'))?.children.length > 1 && plot.group(at('groundFloor/room_356')) === null);
  }

  /* ---------- what the panel switches ---------- */
  {
    /** a mesh's material's colour @param {any} m */
    const colour = m => '#' + m.material.color.getHexString();
    const eps = plot.group(at('facade/epsLeft')).children, low = eps.filter((/** @type {any} */ m) => m.userData.floor === 'groundFloor'), high = eps.filter((/** @type {any} */ m) => m.userData.floor === 'firstFloor');
    plot.visible(k => k !== 'blocks');
    check('visible: Blocks off hides the walls, not the EPS', plot.group(at('groundFloor/blockGarden')).children.every((/** @type {any} */ m) => !m.visible) && eps.every((/** @type {any} */ m) => m.visible));
    plot.visible(k => k !== 'groundFloor');
    check('visible: Ground Floor off hides its walls and the EPS below 2720, not above', plot.group(at('groundFloor/blockGarden')).children.every((/** @type {any} */ m) => !m.visible)
      && low.length > 0 && high.length > 0 && low.every((/** @type {any} */ m) => !m.visible) && high.every((/** @type {any} */ m) => m.visible) && plot.group(at('firstFloor/gableGarden')).children.every((/** @type {any} */ m) => m.visible));
    plot.visible(k => k !== 'facade');
    check('visible: Facade off, the EPS raw', eps.every((/** @type {any} */ m) => colour(m) === catalog.material('insulation').color));
    plot.visible(() => true);
    check('visible: Facade on, the EPS finished', eps.some((/** @type {any} */ m) => colour(m) === catalog.material('graphite').color));
    plot.edges(false);
    check('edges: off', !plot.group(at('groundFloor/blockGarden')).children[0].children.some((/** @type {any} */ o) => o.visible));
    plot.edges(true);
  }

  /* ---------- the cameras ---------- */
  {
    plot.view('front');
    const front = plot.camera.position.x;
    plot.view('garden');
    const garden = plot.camera.position.x;
    plot.view('above');
    check('view: the front from the West, the garden from the East, above from over it', front < 0 && garden > 13.2 && plot.camera.position.y > 15);
  }

  /* ---------- the site ---------- */
  {
    plot.show(H, /** @type {Node} */ (H.root));
    const site = plot.group(/** @type {Node} */ (H.root));
    check('the site: the lawn round the house and the surfaces, without edges', site?.children.length === 9 && site.children.every((/** @type {any} */ o) => o.children.length === 0));
  }

  /* ---------- a product, by its shape, in the fittings' metal ---------- */
  {
    /** @param {Record<string, any>} [settings] */
    const room = settings => createHierarchy(/** @type {Node} */ ({ id: 'room', type: 'room', offset: [0, 0, 0], size: [2000, 2000, 2500], settings, children: [
      { id: 'tap', type: 'tap', offset: [500, 100, 850], size: [50, 180, 175], product: 'hansgrohe-tecturis-e-110-73010140' }] }));
    const R = room({ metal: 'brass' });
    plot.show(R, R.root);
    const tap = plot.group(/** @type {Node} */ (R.node('tap')));
    check('a product: its shape\'s parts', tap?.children.length === 4);
    check('the fittings\' metal: the room\'s setting', '#' + tap.children[0].material.color.getHexString() === catalog.material('brass').color);
    const bare = room();
    let error = '';
    try { plot.show(bare, bare.root); } catch (e) { error = String(e); }
    check('no setting metal: it says where', error.includes('tap') && error.includes('metal'));
  }
}
