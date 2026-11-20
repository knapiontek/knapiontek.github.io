/* core/geometry.js: its public API, each part with what it gives (test/test.md) */
function geometryTest(HOME, data, check) {
  const G = HOME.geometry;
  check('the public API', Object.keys(G).join(' ') === 'SIDES hash01 DEG INF EPS SOLID_TOL area2 ccw rect2 clipHalf leftOf edgesOf intersect2 minus2 prism emptyPrism hRange centreH prismIntersect prismMinus splitH sectionAt cutBy volume subtractAll overlaps rectArea rectMinus mergeRects');

  const square = G.rect2(0, 2, 0, 2);
  check('area2: a square 2 × 2 has the area 4', G.area2(square) === 4);
  check('ccw: a polygon turned clockwise comes back counter-clockwise', G.area2(G.ccw(square.slice().reverse())) === 4);
  check('minus2: a square less its half leaves the other half', G.minus2(square, G.rect2(0, 1, 0, 2), G.EPS).reduce((s, P) => s + G.area2(P), 0) === 2);

  const room = G.prism([0, 1000, 0, 2000, 0, 3000]);
  check('prism and volume: a box 1000 × 2000 × 3000', G.volume(room) === 6e9);
  check('hRange: from the floor to the ceiling', G.hRange(room).join() === '0,3000');
  check('prismMinus: a box less a box inside it keeps the rest', G.prismMinus(room, G.prism([0, 1000, 0, 1000, 0, 3000])).reduce((s, S) => s + G.volume(S), 0) === 3e9);
  check('splitH: cut at 1000, two parts of the whole', G.splitH(room, 1000).length === 2);

  check('rectArea: 4 × 4', G.rectArea([0, 4, 0, 4]) === 16);
  check('rectMinus: a hole of 1 × 1 leaves 15', G.rectMinus([0, 4, 0, 4], [1, 2, 1, 2]).reduce((s, q) => s + G.rectArea(q), 0) === 15);
  check('mergeRects: two halves side by side are one rectangle', G.mergeRects([[0, 2, 0, 4], [2, 4, 0, 4]]).length === 1);
  check('hash01: the same numbers give the same value, from 0 to 1', G.hash01(1, 2) === G.hash01(1, 2) && G.hash01(1, 2) >= 0 && G.hash01(1, 2) < 1);
}
