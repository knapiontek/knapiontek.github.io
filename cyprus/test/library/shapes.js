// @ts-check
// test/library/shapes.js: library/shapes.js: every product with a drawing, its parts sound; then the shapes as the scene and
// documents use them: an oven, a microwave, a basin tap, a shower screen, a WC bowl.

import { openCatalog } from '../../library/catalog.js';
import { shapeOf } from '../../library/shapes.js';

/** @typedef {import('../../types.js').Shape} Shape */
/** @typedef {import('../../types.js').Part} Part */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const catalog = await openCatalog();
  const drawn = catalog.groups.flatMap(g => catalog.products(g)).filter(k => catalog.product(k).draw);
  /** @param {string} key */
  const of = key => shapeOf(catalog.product(key), undefined, catalog.product(key).draw === 'hood' ? { worktop: 650 } : {});
  /** @param {() => unknown} f */
  const throws = f => { try { f(); return false; } catch (e) { return true; } };

  /* ---------- every product with a drawing ---------- */
  {
    /** @type {Record<string, Shape>} */
    const shapes = Object.fromEntries(drawn.map(k => [k, of(k)]));
    check('shapeOf: every product with a drawing (' + drawn.length + ')', drawn.length > 0 && drawn.every(k => shapes[k].parts.length > 0));
    const materials = new Set(catalog.materials());
    /** @type {string[]} */
    const unknown = [];
    for (const k of drawn) for (const p of shapes[k].parts) if (p.material !== 'metal' && !materials.has(p.material)) unknown.push(k + ': ' + p.material);
    check('materials: of materials.json, or metal' + (unknown.length ? ': not ' + [...new Set(unknown)].join(', ') : ''), unknown.length === 0);
    const ROOM = ['freezer', 'fridge'];   // carried by the cabinet fronts
    check('movers: a part moves with a mover of its shape, or the room\'s', drawn.every(k => shapes[k].parts.every(p => !p.mover
      || shapes[k].movers.some(m => m.id === p.mover) || ROOM.includes(p.mover))));
    check('boxes: x0 < x1, y0 < y1, h0 < h1', drawn.every(k => shapes[k].parts.every(p => p.form !== 'box'
      || (p.box && p.box[0] < p.box[1] && p.box[2] < p.box[3] && p.box[4] < p.box[5]))));
    const sizes = (/** @type {Shape} */ s) => s.size.length === 3 && s.size.every(v => v > 0);
    check('size: three, above 0', drawn.every(k => sizes(shapes[k])));
    check('meshes: every corner a point', drawn.every(k => shapes[k].parts.every(p => p.form !== 'mesh'
      || (p.positions && p.index && p.positions.length % 3 === 0 && p.index.every(i => i < /** @type {number[]} */ (p.positions).length / 3) && p.matrix?.length === 12))));
    check('the same product, the same shape', drawn.every(k => JSON.stringify(of(k)) === JSON.stringify(shapes[k])));
    check('a product with no drawing throws', throws(() => shapeOf(catalog.product('egger-u708-st9-18'))));
    check('a hood without its worktop throws', throws(() => shapeOf(catalog.product('electrolux-lfv416k'))));
  }

  /* ---------- as the scene and documents use them ---------- */
  {
    /* an oven: the maker's sizes, its door on its bottom edge */
    const oven = of('bosch-hba534bb3');
    check('oven: 594 × 548 × 595, the fascia before the body', oven.size.join() === '594,548,595');
    check('oven: documents give the body and the fascia', oven.envelopes.map(e => e.name).join(' | ') === 'Piekarnik Bosch Serie 4 – body 558 × 570 × 528.5 | Piekarnik Bosch Serie 4 – fascia 594 × 595');
    check('oven: the door turns down about its bottom edge', JSON.stringify(oven.movers) === JSON.stringify([{ id: 'door', pivot: [0, 548, 0], axis: [1, 0, 0], sign: -1, travel: 90 }]));
    check('oven: the leaf, its glass and its handle move with the door', oven.parts.filter(p => p.mover === 'door').length === 10);
    const feet = shapeOf(catalog.product('bosch-hba534bb3'), undefined, { feet: 20 });
    check('oven: on feet, four of them, the rest 20 up', feet.parts.length === oven.parts.length + 4 && feet.size[2] === 615);

    /* a microwave: hinged on its left, the fascia 13 below the body */
    const micro = of('bosch-bfl623mb3');
    check('microwave: the door turns about its left edge, upright', micro.movers[0].axis.join() === '0,0,1' && micro.movers[0].sign === 1 && micro.movers[0].pivot[0] === (595 - 442) / 2 + 2);
    check('microwave: the fascia from 0, the body 13 up', micro.envelopes[1].box[4] === 0 && micro.envelopes[0].box[4] === 13);

    /* Finish: a basin tap all in the fittings' metal */
    const tap = of('hansgrohe-tecturis-e-110-73010140');
    check('Finish: the basin tap in the fittings\' metal', tap.parts.length === 4 && tap.parts.every(p => p.material === 'metal'));

    /* a shower screen opening in */
    const screen = shapeOf(catalog.product('shower-screen-1000-door-600'), undefined, { opens: 'in', angle: 80 });
    check('shower screen: the door 600 opens in, 80°', screen.movers[0].sign === -1 && screen.movers[0].travel === 80 && screen.movers[0].pivot[0] === 595);

    /* a WC bowl: lofted, in the product's ceramic */
    const bowl = of('wc-bowl-wall-hung-360x530');
    check('WC bowl: three lofts in ceramic, two fittings in metal', bowl.parts.filter(p => p.form === 'mesh' && p.material === 'ceramicWhite').length === 3
      && bowl.parts.filter(p => p.material === 'metal').length === 2);

    /* a pipe fitted to its node: as long as the node */
    const pipe = shapeOf(catalog.product('pvc-pipe-90'), [2400, 110, 110]);
    check('pipe: as long as its node', pipe.parts[0].length === 2400 && /** @type {number[]} */ (pipe.parts[0].at)[0] === 1200);
  }
}
