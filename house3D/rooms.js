/* rooms.js: the room of a sub-project (kitchen, bath), copied from the house as it is. The house's own solids (walls,
   slabs, floor, windows, roof) are trimmed to the box its link in house.js gives and handed over unchanged: mm, house axes
   (x along the house, y across, z up). Nothing is re-measured. No THREE, no DOM. Needs core/geometry.js and engine.js. */
(function (root) {
'use strict';

const TOL = 1;                             // mm: a solid this close to a face of the room lies beyond it

/* which side of the room a solid lies on, so a page can hide it while the camera is behind it: -z under the floor,
   +z over the room (a slab, ceiling or roof above the floor), else +x/-x/+y/-y beyond the wall face of the floor area
   it shares most of */
const OVER = ['slabs', 'roof'];            // house layers that close the room from above
function sideOf(c, S, inside, level, zRange) {
  const ys = S.poly.map(p => p[0]), [z1, z2] = zRange(S), b = [S.x1, S.x2, Math.min(...ys), Math.max(...ys)];
  if (z2 <= level + TOL) return '-z';
  if (z1 >= level + TOL && c.layers.some(l => OVER.includes(l))) return '+z';
  const overlap = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1);
  let best = null;
  for (const r of inside) for (const [side, d, along] of [
    ['+x', b[0] - r[1], overlap(b[2], b[3], r[2], r[3])], ['-x', r[0] - b[1], overlap(b[2], b[3], r[2], r[3])],
    ['+y', b[2] - r[3], overlap(b[0], b[1], r[0], r[1])], ['-y', r[2] - b[3], overlap(b[0], b[1], r[0], r[1])]]) {
    if (d < -TOL || along <= TOL) continue;
    if (!best || along > best.along + TOL || (Math.abs(along - best.along) <= TOL && d < best.d)) best = { side, d, along };
  }
  return best ? best.side : '+z';
}

/* the room of HOUSE whose link points to href (one per floor: the bath has two), with MODEL = HouseEngine.build(HOUSE) */
function roomsFor(HOUSE, MODEL, href) {
  const GEO = HOUSE.geometry, COPY = GEO.copy, G = root.CORE.geometry;
  const kindOf = Object.fromEntries(GEO.elements.map(e => [e.id, e.kind]));
  const take = []
    .concat(MODEL.CELLS.filter(c => COPY.kinds.includes(kindOf[c.element])))
    .concat(COPY.fixtures ? MODEL.FIXTURES : [])
    .concat(COPY.roof ? MODEL.ROOF_CELLS : []);
  const roofUnder = y => Math.min(...MODEL.ROOF_UNDER.map(l => l.a + l.s * y));   // the underside of the roof over y
  const out = [];
  for (const floor of GEO.floors) for (const room of floor.rooms) {
    if (!room.link || !room.link.href.endsWith(href)) continue;
    const L = room.link, R = G.prism(L.box);
    const trimmed = [];
    for (const c of take) {
      const S = G.prismIntersect(c.S, R);
      if (S && !G.emptyPrism(S)) trimmed.push(Object.assign({}, c, { S, side: sideOf(c, S, L.inside, floor.level, G.zRange) }));
    }
    /* what lies under the floor or over the room is kept only over the room and its walls, not over the next room */
    const plan = S => { const ys = S.poly.map(p => p[0]); return [S.x1, S.x2, Math.min(...ys), Math.max(...ys)]; };
    const walls = trimmed.filter(c => c.side[1] !== 'z').map(c => plan(c.S));
    const footprint = walls.reduce((union, w) => union.concat(union.reduce((rest, u) => rest.flatMap(r => G.rectMinus(r, u)), [w])), L.inside.slice());
    const cells = trimmed.flatMap(c => c.side[1] !== 'z' ? [c] : footprint.flatMap(f => {
      const S = G.prismIntersect(c.S, G.prism([f[0], f[1], f[2], f[3], -G.INF, G.INF]));
      return S && !G.emptyPrism(S) ? [Object.assign({}, c, { S })] : [];
    }));
    const flat = cells.filter(c => c.side === '+z' && c.layers.includes('slabs')).map(c => G.zRange(c.S)[0]);
    const crosses = b => b[0] < L.box[1] && b[1] > L.box[0] && b[2] < L.box[3] && b[3] > L.box[2] && b[4] < L.box[5] && b[5] > L.box[4];
    out.push({
      floor: floor.id, floorName: floor.name, room: room.id, number: room.numbers ? room.numbers[0] : null, name: room.name,
      level: floor.level, top: floor.top ?? null, inside: L.inside, box: L.box, cells,
      ceiling: flat.length ? Math.min(...flat) : floor.top,   // the underside of the slab or flat ceiling over the room
      openings: GEO.openings.filter(o => crosses(o.b)),
      roofWindows: GEO.roof.windows.filter(w => crosses([w.x[0], w.x[1], w.y[0], w.y[1], roofUnder(w.y[1]), roofUnder(w.y[0])].map(Math.round))),
      roofUnder,
      pitch: GEO.roof.pitch
    });
  }
  return out;
}

root.HouseRooms = { roomsFor };
})(typeof window !== 'undefined' ? window : globalThis);
