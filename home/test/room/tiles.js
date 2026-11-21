/* room/tiles.js: its public API, each part with what it gives (test/test.md) */
function roomTilesTest({ roomTilesModule, coreGeometryModule }, data, check) {
  const T = roomTilesModule(coreGeometryModule());
  check('the public API', Object.keys(T).join(' ') === 'PATTERNS DIRS rooms lay clip clipHalf count fit corePieces slabEdges outline floor floorPieces checks');

  /* a tile 600 × 300, no joint; a floor 1200 × 600 at the level 0, a door 900 wide in its wall at x = 1200 */
  const tile = { len: 600, wid: 300, joint: 0, minCut: [100, 100], pattern: 'grid', texture: 'any' };
  const laying = { product: 'tile', dir: 'x', pattern: 'grid', oa: null, ob: null };
  const door = [1200, 1300, 0, 600, 0, 2050];
  const laid = T.rooms([{ id: 'a', rects: [[0, 1200, 0, 600]] }], [door], 0);
  check('rooms: a room gets the half of its door', laid.length === 1 && laid[0].rects.length === 2 && laid[0].rects[1].door === true);

  const floor = T.rooms([{ id: 'a', rects: [[0, 1200, 0, 600]] }], [], 0);
  const whole = T.count(tile, T.lay(laying, tile, floor, 0, 0));
  check('lay and count: from the corner, 4 whole tiles, 0.72 m²', whole.full === 4 && whole.cut === 0 && Math.abs(whole.area - 0.72) < 1e-9);
  const shifted = T.count(tile, T.lay(laying, tile, floor, 50, 0));
  check('count: shifted by 50, small cuts at both ends', shifted.small > 0);
  const best = T.fit(laying, tile, floor);
  check('fit: the origin with no cut', best.oa === 0 && best.ob === 0);

  const two = T.rooms([{ id: 'a', rects: [[0, 1000, 0, 600]] }, { id: 'b', rects: [[1000, 2000, 0, 600]] }], [], 0);
  check('rooms: rooms that meet with no wall are one zone', two[0].zone === two[1].zone);

  /* floor: laid and counted at once; the origin fitted when the laying has none */
  const F = T.floor(laying, tile, [{ id: 'a', rects: [[0, 1200, 0, 600]] }], [], 0);
  check('floor: fitted, 4 whole tiles', F.oa === 0 && F.ob === 0 && F.count.full === 4 && F.laid.length === 1);

  /* outline: an L of two rectangles is one floor, one slab: its edges only round it, none where the two meet */
  const L = [[0, 1000, 0, 600], [1000, 2000, 0, 300]], inL = (x, y) => L.some(q => x > q[0] && x < q[1] && y > q[2] && y < q[3]);
  const edges = T.outline(L), length = edges.reduce((s, [p, q]) => s + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);
  check('outline: round the L, 5200 mm', Math.abs(length - 5200) < 1e-9);
  check('outline: every edge has the floor on its left only', edges.every(([p, q]) => {
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = [q[0] - p[0], q[1] - p[1]], n = Math.hypot(...d), left = [-d[1] / n, d[0] / n];
    return inL(m[0] + left[0], m[1] + left[1]) && !inL(m[0] - left[0], m[1] - left[1]);
  }));

  /* checks: a layout whose tile the library has not; a small cut, to know */
  const C = T.checks([{ key: 'ground', product: 'tile' }, { key: 'attic', product: 'none' }], { tile }, { any: {} }, [{ key: 'ground', count: shifted }]);
  check('checks: the layout with no tile in the library, the small cuts to know', C[0].items.join() === 'attic: none' && C[1].info && C[1].items[0] === 'ground: ' + shifted.small);
}
