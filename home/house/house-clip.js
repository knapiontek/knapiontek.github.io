/* house-clip.js: the room of a sub-project (kitchen, bathroom), copied from the house as it is. The house's own solids (walls,
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

/* the room of HOUSE whose link points to href (one per floor: the bathroom project has two), with MODEL = HouseEngine.build(HOUSE) */
function roomsFor(HOUSE, MODEL, href) {
  const GEO = HOUSE.geometry, COPY = GEO.copy, G = root.CORE.geometry;
  const kindOf = Object.fromEntries(GEO.elements.map(e => [e.id, e.kind]));
  const take = []
    .concat(MODEL.CELLS.filter(c => COPY.kinds.includes(kindOf[c.element])))
    .concat(COPY.fixtures ? MODEL.FIXTURES.map(c => Object.assign({}, c, { fixture: true })) : [])
    .concat(COPY.roof ? MODEL.ROOF_CELLS : []);
  const roofUnder = y => Math.min(...MODEL.ROOF_UNDER.map(l => l.a + l.s * y));   // the underside of the roof over y
  const PLAN_CUT = Object.values(HOUSE.views).find(v => v.plan).cut;               // the house's 2D cut height, per floor
  const out = [];
  for (const floor of GEO.floors) for (const room of floor.rooms) {
    if (!room.link || !room.link.href.endsWith(href)) continue;
    const L = room.link, R = G.prism(L.box);
    const trimmed = [];
    for (const c of take) {
      const S = G.prismIntersect(c.S, R);
      if (S && !G.emptyPrism(S)) trimmed.push(Object.assign({}, c, { S, side: sideOf(c, S, L.inside, floor.level, G.zRange) }));
    }
    /* a wall belongs to the room when it stands on the edge of its floor area (shares a face with it); a window frame
       when it sits in such a wall. Anything else in the box (the wall of the next room) is not this room's. */
    const plan = S => { const ys = S.poly.map(p => p[0]); return [S.x1, S.x2, Math.min(...ys), Math.max(...ys)]; };
    const overlap = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1);
    const touches = b => L.inside.some(r =>
      (overlap(b[2], b[3], r[2], r[3]) > TOL && (Math.abs(b[0] - r[1]) <= TOL || Math.abs(b[1] - r[0]) <= TOL)) ||
      (overlap(b[0], b[1], r[0], r[1]) > TOL && (Math.abs(b[2] - r[3]) <= TOL || Math.abs(b[3] - r[2]) <= TOL)));
    const within = (b, w) => b[0] >= w[0] - TOL && b[1] <= w[1] + TOL && b[2] >= w[2] - TOL && b[3] <= w[3] + TOL;
    const isFixture = c => !!c.fixture;
    const kept = trimmed.filter(c => c.side[1] === 'z' || (isFixture(c)
      ? trimmed.some(w => !isFixture(w) && w.side === c.side && touches(plan(w.S)) && within(plan(c.S), plan(w.S)))
      : touches(plan(c.S))));
    /* what lies under the floor or over the room covers exactly the room's own floor areas (house.js rects, within the box)
       and the walls kept around it: nothing of the next room, no wall that is not there */
    const walls = kept.filter(c => c.side[1] !== 'z').map(c => plan(c.S));
    const clip = r => [Math.max(r[0], L.box[0]), Math.min(r[1], L.box[1]), Math.max(r[2], L.box[2]), Math.min(r[3], L.box[3])];
    const parts = (room.rects || []).map(clip).filter(r => r[1] > r[0] && r[3] > r[2]).concat(walls);
    const footprint = G.mergeRects(parts.reduce((union, w) => union.concat(union.reduce((rest, u) => rest.flatMap(r => G.rectMinus(r, u)), [w])), []));
    const cells = kept.flatMap(c => c.side[1] !== 'z' ? [c] : footprint.flatMap(f => {
      const S = G.prismIntersect(c.S, G.prism([f[0], f[1], f[2], f[3], -G.INF, G.INF]));
      return S && !G.emptyPrism(S) ? [Object.assign({}, c, { S })] : [];
    }));
    const flat = cells.filter(c => c.side === '+z' && c.layers.includes('slabs')).map(c => G.zRange(c.S)[0]);
    const crosses = b => b[0] < L.box[1] && b[1] > L.box[0] && b[2] < L.box[3] && b[3] > L.box[2] && b[4] < L.box[5] && b[5] > L.box[4];
    /* objects as a person sees the room: each wall one object (its element), the floor one (the slab and the foundation tops
       under the walls, flush underneath), the ceiling one (slab, flat ceiling, roof), each window one (its frames and glass) */
    const holes = GEO.openings.map((o, i) => ({ id: 'window ' + (o.label || i), b: o.b }))
      .concat(GEO.roof.windows.map(w => ({ id: 'roof window ' + w.name, b: [w.x[0], w.x[1], w.y[0], w.y[1]] })));
    const holding = b => holes.find(o => b[0] >= o.b[0] - TOL && b[1] <= o.b[1] + TOL && b[2] >= o.b[2] - TOL && b[3] <= o.b[3] + TOL);
    const objects = new Map();
    for (const c of cells) {
      const role = c.side === '-z' ? 'floor' : c.fixture ? 'window' : c.side === '+z' ? 'ceiling' : 'wall';
      const hole = role === 'window' && holding(plan(c.S));
      const id = role === 'wall' ? c.element : role === 'window' ? (hole ? hole.id + ' @' + hole.b.slice(0, 4).join(',') : c.element) : role;
      if (!objects.has(id)) objects.set(id, { id, role, sides: {}, cells: [] });
      const o = objects.get(id); o.cells.push(c); o.sides[c.side] = (o.sides[c.side] || 0) + 1;
    }
    for (const o of objects.values()) o.side = Object.entries(o.sides).sort((p, q) => q[1] - p[1])[0][0];
    /* a window belongs to the wall (or roof) it sits in: it is shown and hidden with it, never on its own */
    const boxOf = o => { const b = o.cells.map(c => plan(c.S)); return [Math.min(...b.map(r => r[0])), Math.max(...b.map(r => r[1])), Math.min(...b.map(r => r[2])), Math.max(...b.map(r => r[3]))]; };
    for (const w of objects.values()) if (w.role === 'window') {
      const wb = boxOf(w), host = [...objects.values()].find(o => (o.role === 'wall' || o.role === 'ceiling') && o.side === w.side &&
        wb[0] >= boxOf(o)[0] - TOL && wb[1] <= boxOf(o)[1] + TOL && wb[2] >= boxOf(o)[2] - TOL && wb[3] <= boxOf(o)[3] + TOL);
      w.host = host ? host.id : null;
    }
    out.push({
      floor: floor.id, floorName: floor.name, room: room.id, number: room.numbers ? room.numbers[0] : null, numbers: room.numbers, name: room.name,
      area: (room.rects || []).reduce((a, q) => a + G.rectArea(q), 0) / 1e6,   // m², as the house's plan gives it
      planCut: PLAN_CUT[floor.id], level: floor.level, top: floor.top ?? null, inside: L.inside, box: L.box, cells, objects: [...objects.values()],
      ceiling: flat.length ? Math.min(...flat) : floor.top,   // the underside of the slab or flat ceiling over the room
      openings: GEO.openings.filter(o => crosses(o.b)),
      roofWindows: GEO.roof.windows.filter(w => crosses([w.x[0], w.x[1], w.y[0], w.y[1], roofUnder(w.y[1]), roofUnder(w.y[0])].map(Math.round))),
      roofUnder,
      pitch: GEO.roof.pitch
    });
  }
  return out;
}

/* the light of a room seen from inside (a sub-project's page): the house's sky, fog and sun, with the house's own
   settings for an interior (house.js light.inside) */
function insideLight(HOUSE) {
  const L = Object.values(HOUSE.views).find(v => v.menu).light, I = L.inside;
  return { exposure: I.exposure, fog: L.fog, sun: Object.assign({}, L.sun, I.sun), sky: Object.assign({}, L.sky, I.sky) };
}

root.HouseClip = { roomsFor, insideLight };
})(typeof window !== 'undefined' ? window : globalThis);
