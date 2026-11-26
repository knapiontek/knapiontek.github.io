// @ts-check
// test/core/geometry.js: core/geometry.js by examples, as the house uses it: a wall as a prism, its top cut by the roof, less its
// window, split between the floors; polygons clipped, intersected and subtracted; rectangles (rooms' floors); the compass sides
// in our axes (x East, y North, h up).

import { DEG, SOLID_TOL, SIDES, area2, ccw, rect2, clipHalf, leftOf, edgesOf, intersect2, minus2, prism, emptyPrism, hRange, centreH,
  prismIntersect, prismMinus, splitH, sectionAt, cutBy, volume, subtractAll, overlaps, rectArea, rectMinus, mergeRects, hash01 } from '../../core/geometry.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const near = (/** @type {number} */ a, /** @type {number} */ b, e = 1e-6) => Math.abs(a - b) < e;

  /* ---------- polygons in the y-h plane ---------- */
  {
    const R = rect2(0, 4000, 0, 3000);
    check('rect2: a rectangle, counter-clockwise, its area', R.length === 4 && area2(R) === 12e6);
    check('ccw: a clockwise polygon turned', area2(ccw([...R].reverse())) === 12e6);
    check('edgesOf: each side as [p, q]', edgesOf(R).length === 4 && edgesOf(R)[3][1] === R[0]);
    const half = clipHalf(R, p => 2000 - p[0]);   // what lies where y ≤ 2000
    check('clipHalf: the part where f ≥ 0', near(area2(half), 6e6));
    check('leftOf: a point left of a → b is positive', leftOf([0, 0], [1, 0])([0, 1]) > 0 && leftOf([0, 0], [1, 0])([0, -1]) < 0);
    const W = rect2(1000, 3000, 1000, 2000);
    check('intersect2: the common part', near(area2(/** @type {number[][]} */ (intersect2(R, W, SOLID_TOL))), 2e6) && intersect2(R, rect2(5000, 6000, 0, 1), SOLID_TOL) === null);
    const pieces = minus2(R, W, SOLID_TOL);
    check('minus2: A less B, convex pieces, their area A − B', pieces.length > 1 && near(pieces.reduce((s, P) => s + area2(P), 0), 10e6));
  }

  /* ---------- a wall as a prism along x ---------- */
  {
    const TAN = Math.tan(42 * DEG);
    /* the gable wall of the First Floor, 240 thick along x, 9100 across y, h 3060 up to the roof: h = 3864 + tan 42° · y on the
       one slope, 3864 + tan 42° · (9100 − y) on the other */
    const roof = [{ a: 3864, s: TAN }, { a: 3864 + TAN * 9100, s: -TAN }];
    const gable = prism([12760, 13000, 0, 9100, 3060, 9000], roof);
    const [lo, hi] = hRange(gable);
    check('prism: a box cut by the roof\'s lines: its ridge at y 4550', lo === 3060 && near(hi, 3864 + TAN * 4550) && gable.poly.some(p => near(p[0], 4550)));
    check('sectionAt: the wall\'s width at a height, under the slopes', (() => { const s = /** @type {number[]} */ (sectionAt(gable, 5000)); return near(s[0], (5000 - 3864) / TAN) && near(s[1], 9100 - (5000 - 3864) / TAN); })());
    check('cutBy: a section at its top still cuts it; above it not', cutBy(gable, 3060.5) && !cutBy(gable, 9000));
    const wall = prism([12760, 13000, 440, 8660, 0, 2720]), window = prism([12760, 13200, 1550, 7550, 0, 2400]);
    const rest = prismMinus(wall, window);
    check('prismMinus: the wall less its window, its volume less the window\'s in it', near(rest.reduce((s, S) => s + volume(S), 0), volume(wall) - 240 * 6000 * 2400));
    check('prismIntersect: what the window takes of the wall', near(volume(/** @type {any} */ (prismIntersect(wall, window))), 240 * 6000 * 2400));
    check('subtractAll: the same, through a list', near(subtractAll([wall], [window]).reduce((s, S) => s + volume(S), 0), volume(wall) - 240 * 6000 * 2400));
    const eps = prism([13000, 13200, 440, 8660, -920, 9000]), floors = splitH(eps, 2720);
    check('splitH: the EPS split at 2720, below and above, the same volume', floors.length === 2 && hRange(floors[0])[1] === 2720 && hRange(floors[1])[0] === 2720 && near(volume(floors[0]) + volume(floors[1]), volume(eps)));
    check('centreH: the middle height of a section', centreH(prism([0, 1, 0, 1, 0, 2720])) === 1360);
    check('emptyPrism: thinner than the tolerance is nothing', emptyPrism(prism([0, SOLID_TOL / 2, 0, 1000, 0, 1000])) && !emptyPrism(wall));
    const both = overlaps([{ S: wall }, { S: window }, { S: prism([0, 1, 0, 1, 0, 1]) }]);
    check('overlaps: the pairs that share a volume', both.length === 1 && near(both[0].volume, 240 * 6000 * 2400));
  }

  /* ---------- rectangles [x1, x2, y1, y2]: a room's floor ---------- */
  {
    const room = [0, 4000, 0, 3000];
    check('rectArea', rectArea(room) === 12e6);
    const left = rectMinus(room, [1000, 2000, -100, 3100]);
    check('rectMinus: a room less a strip across it, two pieces', left.length === 2 && left.reduce((s, q) => s + rectArea(q), 0) === 9e6);
    check('mergeRects: two rectangles sharing a whole side, one', JSON.stringify(mergeRects([[0, 1000, 0, 500], [1000, 2500, 0, 500]])) === '[[0,2500,0,500]]');
  }

  /* ---------- the compass in our axes; a stable random number ---------- */
  {
    check('SIDES: East +x, West −x, North +y, South −y', SIDES.E.axis === 0 && SIDES.E.sign === 1 && SIDES.W.sign === -1 && SIDES.N.axis === 1 && SIDES.N.sign === 1 && SIDES.S.sign === -1);
    check('hash01: the same numbers, the same result, in [0, 1)', hash01(3, 7) === hash01(3, 7) && hash01(3, 7) !== hash01(7, 3) && hash01(3, 7) >= 0 && hash01(3, 7) < 1);
  }
}
