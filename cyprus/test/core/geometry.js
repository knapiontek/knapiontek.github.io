// @ts-check
// test/core/geometry.js: core/geometry.js by use cases, as the house uses it (x East, y North, h up): the gable wall cut by the
// roof; a wall less its window; the facade's EPS split between the floors; a wall's face in its plane (polygons clipped,
// intersected, subtracted); a room's floor (rectangles); the compass sides, a stable random number. Every function in one.

import * as geometry from '../../core/geometry.js';
import { uses } from '../uses.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const { $, missing } = uses(geometry);
  const near = (/** @type {number} */ a, /** @type {number} */ b, e = 1e-6) => Math.abs(a - b) < e;

  /* --- use case: the gable wall of the First Floor, 240 thick along x, 9100 across y, from 3060 up to the roof's two slopes
     (h = 3864 + tan 42° · y, and from the other side) --- */
  {
    const TAN = Math.tan(42 * $.DEG), roof = [{ a: 3864, s: TAN }, { a: 3864 + TAN * 9100, s: -TAN }];
    const gable = $.prism([12760, 13000, 0, 9100, 3060, 9000], roof);
    const [lo, hi] = $.hRange(gable);
    check('the wall as a prism, its top cut by the roof: its ridge at y 4550', lo === 3060 && near(hi, 3864 + TAN * 4550) && gable.poly.some(p => near(p[0], 4550)));
    const s = /** @type {number[]} */ ($.sectionAt(gable, 5000));
    check('its width at a height, under the slopes', near(s[0], (5000 - 3864) / TAN) && near(s[1], 9100 - (5000 - 3864) / TAN));
    check('a floor\'s line at its foot still cuts it; one over its ridge not', $.cutBy(gable, 3060.5) && !$.cutBy(gable, 9000));
  }

  /* --- use case: a wall less its window (the window's box through it, deeper than the wall) --- */
  {
    const wall = $.prism([12760, 13000, 440, 8660, 0, 2720]), window = $.prism([12760, 13200, 1550, 7550, 0, 2400]), hole = 240 * 6000 * 2400;
    check('the wall less its window: its volume less the window\'s in it', near($.prismMinus(wall, window).reduce((v, S) => v + $.volume(S), 0), $.volume(wall) - hole));
    check('what the window takes of the wall', near($.volume(/** @type {any} */ ($.prismIntersect(wall, window))), hole));
    check('the same through a list of walls and openings', near($.subtractAll([wall], [window]).reduce((v, S) => v + $.volume(S), 0), $.volume(wall) - hole));
    const both = $.overlaps([{ S: wall }, { S: window }, { S: $.prism([0, 1, 0, 1, 0, 1]) }]);
    check('the test: which pieces share a volume, and how much', both.length === 1 && near(both[0].volume, hole));
  }

  /* --- use case: the facade's EPS from the footing to the roof, split at the floor between the storeys --- */
  {
    const eps = $.prism([13000, 13200, 440, 8660, -920, 9000]), floors = $.splitH(eps, 2720);
    check('split at 2720: below and above, the same volume', floors.length === 2 && $.hRange(floors[0])[1] === 2720 && $.hRange(floors[1])[0] === 2720 && near($.volume(floors[0]) + $.volume(floors[1]), $.volume(eps)));
    check('a storey\'s middle height', $.centreH($.prism([0, 1, 0, 1, 0, 2720])) === 1360);
    check('a sliver thinner than the tolerance is nothing', $.emptyPrism($.prism([0, $.SOLID_TOL / 2, 0, 1000, 0, 1000])) && !$.emptyPrism(eps));
  }

  /* --- use case: a wall's face in its plane (y, h): clipped by a line, its window taken out --- */
  {
    const R = $.rect2(0, 4000, 0, 3000);
    check('a face 4000 × 3000: counter-clockwise, its area; turned when given clockwise', R.length === 4 && $.area2(R) === 12e6 && $.area2($.ccw([...R].reverse())) === 12e6);
    check('its sides as [p, q]', $.edgesOf(R).length === 4 && $.edgesOf(R)[3][1] === R[0]);
    check('a point left of a line a → b: positive', $.leftOf([0, 0], [1, 0])([0, 1]) > 0 && $.leftOf([0, 0], [1, 0])([0, -1]) < 0);
    check('clipped where y ≤ 2000: half of it', near($.area2($.clipHalf(R, p => 2000 - p[0])), 6e6));
    const W = $.rect2(1000, 3000, 1000, 2000);
    check('its window: what they share; nothing with one beside it', near($.area2(/** @type {number[][]} */ ($.intersect2(R, W, $.SOLID_TOL))), 2e6) && $.intersect2(R, $.rect2(5000, 6000, 0, 1), $.SOLID_TOL) === null);
    const pieces = $.minus2(R, W, $.SOLID_TOL);
    check('the face less its window: convex pieces, the area less the window\'s', pieces.length > 1 && near(pieces.reduce((v, P) => v + $.area2(P), 0), 10e6));
  }

  /* --- use case: a room's floor, rectangles [x1, x2, y1, y2] --- */
  {
    const room = [0, 4000, 0, 3000];
    check('its area', $.rectArea(room) === 12e6);
    const left = $.rectMinus(room, [1000, 2000, -100, 3100]);
    check('less a strip across it (a wall): two pieces', left.length === 2 && left.reduce((v, q) => v + $.rectArea(q), 0) === 9e6);
    check('two sharing a whole side: one', JSON.stringify($.mergeRects([[0, 1000, 0, 500], [1000, 2500, 0, 500]])) === '[[0,2500,0,500]]');
  }

  /* --- use case: a facade by its compass side; a texture's random but stable speckle --- */
  check('the sides: East +x, West −x, North +y, South −y', $.SIDES.E.axis === 0 && $.SIDES.E.sign === 1 && $.SIDES.W.sign === -1 && $.SIDES.N.axis === 1 && $.SIDES.N.sign === 1 && $.SIDES.S.sign === -1);
  check('a stable random number: the same for the same, in [0, 1)', $.hash01(3, 7) === $.hash01(3, 7) && $.hash01(3, 7) !== $.hash01(7, 3) && $.hash01(3, 7) >= 0 && $.hash01(3, 7) < 1);

  check('the API: every function in a use case' + (missing().length ? ': not ' + missing().join(', ') : ''), missing().length === 0);
}
