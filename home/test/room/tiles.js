/* room/tiles.js: its public API, each part with what it gives (test/test.md) */
function roomTilesTest({ roomTilesModule, coreGeometryModule }, data, check) {
  const T = roomTilesModule(coreGeometryModule());
  check('the public API', Object.keys(T).join(' ') === 'PATTERNS DIRS rooms lay clip clipHalf count fit corePieces slabEdges');

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
}
