// @ts-check
// test/core/tools.js: core/tools.js by use cases: a number written in a document; a carcass the designer draws from the wall
// (left-handed: y toward the front) taken into the model (right-handed: y toward the wall); a worktop's section, a pipe, a
// lofted bowl; a product's shape with its turning door, its light, its envelope and its anchor; twice, as it was.

import * as tools from '../../core/tools.js';
import { uses } from '../uses.js';

/** @typedef {import('../../types.js').Shape} Shape */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(tools);

  /* --- use case: a number in a document: exactly the decimals asked, thousands grouped --- */
  check('a price, an area: the decimals asked, thousands grouped', $.fmt(12, 2) === '12.00' && $.fmt(1234.5, 1) === '1,234.5');

  /* --- use case: the designer draws a carcass 550 deep, 28 from the wall (y 28 – 578); the model has y toward the wall --- */
  check('a point: x and h kept, y the other way', $.pointToModel([100, 28, 900]).join() === '100,-28,900');
  check('a box: y 28 – 578 → −578 – −28, still from the lower to the higher', $.boxToModel([0, 600, 28, 578, 0, 720]).join() === '0,600,-578,-28,0,720');

  /* --- use case: the parts a product is drawn of: a worktop's section, a pipe, a lofted bowl --- */
  {
    /** a polygon's signed area, [y, h] @param {number[][]} p */
    const area = p => p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0) / 2;
    const section = [[0, 0], [600, 0], [600, 38], [0, 38]];
    const prism = $.partToModel({ form: 'prism', x: [0, 1000], poly: section, material: 'm' });
    check('a worktop\'s section: mirrored, still counter-clockwise', area(section) > 0 && area(/** @type {number[][]} */ (prism.poly)) > 0 && prism.poly?.map(q => q.join()).sort().join(' ') === '-600,0 -600,38 0,0 0,38');
    const pipe = $.partToModel({ form: 'cylinder', radius: [5, 5], length: 100, at: [10, 20, 30], axis: [0, 1, 0], material: 'm' });
    check('a pipe: its middle and its axis', pipe.at?.join() === '10,-20,30' && pipe.axis?.join() === '0,-1,0');
    const bowl = $.partToModel({ form: 'mesh', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], index: [0, 1, 2], matrix: [1, 0, 0, 5, 0, 1, 0, 6, 0, 0, 1, 7], material: 'm' });
    check('a lofted bowl: the row of y the other way, a triangle\'s sense kept', bowl.matrix?.join() === '1,0,0,5,0,-1,0,-6,0,0,1,7' && bowl.index?.join() === '0,2,1');
  }

  /* --- use case: a product's shape: a door turning about h, a flap about x, a drawer along y; a light, an envelope, its anchor --- */
  {
    /** @type {Shape} */
    const S = { size: [600, 550, 720], parts: [{ form: 'box', box: [0, 600, 0, 550, 0, 720], material: 'm' }],
      movers: [{ id: 'door', pivot: [0, 550, 0], axis: [0, 0, 1], sign: 1, travel: 90 }, { id: 'flap', pivot: [0, 550, 0], axis: [1, 0, 0], sign: -1, travel: 90 }, { id: 'y', pivot: [0, 0, 0], axis: [0, 1, 0], sign: 1, travel: 10 }],
      lights: [{ kind: 'spot', at: [300, 500, 700], target: [300, 600, 0], color: '#fff', intensity: 1, distance: 0, decay: 2, shadow: false }],
      envelopes: [{ box: [0, 600, 0, 550, 0, 720], name: 'body' }], anchor: [300, 550, 0] };
    const M = $.shapeToModel(S);
    check('its size kept', M.size.join() === '600,550,720');
    check('its turns: about h or x the other way (the axis kept), about y the same', M.movers.map(m => m.sign).join() === '-1,1,1' && M.movers[0].pivot.join() === '0,-550,0');
    check('its light and its envelope', M.lights[0].at.join() === '300,-500,700' && M.lights[0].target?.join() === '300,-600,0' && M.envelopes[0].box.join() === '0,600,-550,0,0,720');
    check('its anchor kept in the design\'s axes: the room places it by it', M.anchor?.join() === '300,550,0');
    check('twice: as it was (the mirror its own inverse)', JSON.stringify($.shapeToModel(M)) === JSON.stringify(S));
  }

  check('the API: every function in a use case' + (missing().length ? ': not ' + missing().join(', ') : ''), missing().length === 0);
}
