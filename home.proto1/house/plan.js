// @ts-check
/* house/plan.js: the house's 2D plan, one sheet per floor (core/plan2d.js draws), the garden at the top: what the cut
   meets, the stair, the roof's clear heights and windows, the inner doors open, the openings' labels, the rooms' areas and
   names, the dimensions. A room's view: its rooms only, its furniture as its view gives it. */
/** @param {ReturnType<typeof coreGeometryModule>} geometry @param {ReturnType<typeof corePlan2dModule>} plan2d */
function housePlanModule(geometry, plan2d) {
'use strict';
const { hRange, EPS } = geometry;

/** the plan of a house's model (house/model.js), drawn in the page's materials
    @param {any} MODEL @param {Object<string, MaterialLook>} materials */
function create(MODEL, materials) {
const PLAN = plan2d.create(materials), PS = PLAN.SIZE, HOUSE = MODEL.HOUSE, { ROOF, WIDTH, FLOORS, ROOMS } = MODEL;
const level = F => F.offset[2], floorTop = F => level(F) + F.size[2];
/* the height of a floor's cut (its setting view.plan) */
const cut = (/** @type {HouseNode} */ F) => { const s = MODEL.T.setting(F, 'view.plan'); if (!s) throw new Error(`${F.id}: no setting view.plan`); return s.value; };
const inside = (b, x, y) => x >= b[0] - EPS && x <= b[1] + EPS && y >= b[2] - EPS && y <= b[3] + EPS;
/* the stair: a full line under the cut, dashed over it; from the floor above, all of it shows through the hole */
function planStair(F, X, h, holes) {
  let s = '';
  for (const c of MODEL.STAIR_CELLS) {
    const top = hRange(c.S)[1], ys = c.S.poly.map(p => p[0]), y1 = Math.min(...ys), y2 = Math.max(...ys);
    const own = top > level(F) && top <= floorTop(F) + EPS, seen = top < h && holes.some(b => inside(b, (c.S.x1 + c.S.x2) / 2, (y1 + y2) / 2));
    if (!own && !seen) continue;
    const stroke = top <= h ? `stroke="#5f6a66" stroke-width="${PS.line.cut}"` : `stroke="#8a8d88" stroke-width="${PS.line.over}" stroke-dasharray="${PS.line.dash}"`;
    s += PLAN.rect(X, c.S.x1, c.S.x2, y1, y2, `fill="none" ${stroke}`);
  }
  return s;
}
/* under the roof: the clear heights, the roof windows, the stair hole */
function planUnderRoof(F, X, holes) {
  const x1 = Math.min(...F.inside.map(q => q[0])), x2 = Math.max(...F.inside.map(q => q[1])), C = PS.clear;
  let s = '';
  for (const ch of ROOF.clearHeights) {
    const d = (level(F) + ch - ROOF.eave) / MODEL.TAN;
    for (const y of [d, WIDTH - d]) {
      const left = y < WIDTH / 2;
      s += `<line x1="${X + y}" y1="${x1}" x2="${X + y}" y2="${x2}" stroke="#8a8d88" stroke-dasharray="${PS.line.clear}" stroke-width="${PS.line.over}"/>`
        + `<text x="${X + y + (left ? C.inset : -C.inset)}" y="${x1 + C.down}" font-size="${C.font}" fill="#8a8d88" text-anchor="${left ? 'start' : 'end'}">${ch}</text>`;
    }
  }
  for (const w of ROOF.windows) s += PLAN.rect(X, w.x[0], w.x[1], w.y[0], w.y[1], `fill="none" stroke="#3a6f8f" stroke-dasharray="${PS.line.window}" stroke-width="${PS.line.cut}"`);
  for (const b of holes) s += PLAN.rect(X, b[0], b[1], b[2], b[3], `fill="none" stroke="#a3a7a2" stroke-dasharray="${PS.line.hole}" stroke-width="${PS.line.thin}"`);
  return s;
}
/* the inner doors: the leaf open and its swing, as the drawings show them */
function planDoors(F, X, doors) {
  const turn = (p, d) => { const c = Math.cos(d.angle), s = Math.sin(d.angle), dx = p[0] - d.axis[0], dy = p[1] - d.axis[1]; return [d.axis[0] + dx * c - dy * s, d.axis[1] + dx * s + dy * c]; };
  const at = p => `${X + p[1]},${p[0]}`;
  let s = '';
  for (const d of doors.filter(d => d.floor === F.id)) {
    const L = d.cells[0].S, ys = L.poly.map(p => p[0]), y1 = Math.min(...ys), y2 = Math.max(...ys);
    const leaf = [[L.x1, y1], [L.x2, y1], [L.x2, y2], [L.x1, y2]].map(p => turn(p, d)), open = turn(d.free, d);
    const r = Math.hypot(d.free[0] - d.axis[0], d.free[1] - d.axis[1]);
    s += `<polygon points="${leaf.map(at).join(' ')}" fill="#fff" stroke="#5f6a66" stroke-width="${PS.line.thin}"/>`
      + `<path d="M ${at(d.free)} A ${r} ${r} 0 0 ${d.angle > 0 ? 0 : 1} ${at(open)}" fill="none" stroke="#8a8d88" stroke-width="${PS.line.thin}" stroke-dasharray="${PS.line.dash}"/>`;
  }
  return s;
}
const roomLabel = r => ({ rects: r.rects, numbers: [r.node.number], name: r.node.name });
/* the whole house's dimensions on each side: the openings of that side's walls on this floor, then the whole */
function planChains(F, X) {
  const box = [ROOF.x[0], ROOF.x[1], 0, WIDTH], mine = o => MODEL.floorOf((o.b[4] + o.b[5]) / 2) === F.id;
  return /** @type {Side[]} */ (['E', 'W', 'N', 'S']).map(side => {
    const along = side === 'E' || side === 'W' ? 2 : 0, ends = [box[along], box[along + 1]];
    const openings = MODEL.OPENINGS.filter(o => o.outer === side && mine(o)).flatMap(o => [o.b[along], o.b[along + 1]]);
    return PLAN.chain(X, box, side, 0, ends.concat(openings)) + PLAN.chain(X, box, side, 1, ends);
  }).join('');
}
/** the sheets of the floors shown, one SVG: view: { parts: the rooms cut out (none: the whole house), still: their solids,
    doors: the inner doors drawn, furniture: [{ floor, plan: a room's furniture as its view draws it in 2D }] } */
function svg(view) {
  const PARTS = view.parts, WHOLE = !PARTS.length, PART = PARTS.map(p => p.room.id), STILL = view.still, FURNITURE = view.furniture;
  const floors = WHOLE ? FLOORS : FLOORS.filter(F => PARTS.some(p => p.floor === F));
  return PLAN.sheets(floors.map(F => {
    const own = WHOLE ? null : PARTS.filter(p => p.floor === F), rooms = WHOLE ? ROOMS.filter(r => r.floor === F) : own.map(p => p.room);
    const box = WHOLE ? [...HOUSE.geometry.body, 0, WIDTH] : [0, 1, 2, 3].map(k => (k % 2 ? Math.max : Math.min)(...own.map(p => p.box[k])));
    const solids = WHOLE ? MODEL.SOLIDS.filter(c => c.floor === F.id) : STILL.filter(c => rooms.some(r => r.id === c.room));
    const borders = MODEL.BORDERS.filter(b => b.floor === F && (WHOLE || b.rooms.some(id => PART.includes(id)))).map(b => b.line);
    const furniture = FURNITURE.filter(f => f.floor === F).map(f => f.plan);
    return { extent: WHOLE ? [ROOF.x[0], ROOF.x[1], 0, WIDTH] : box, title: `${F.name} · cut ${cut(F)} mm`,
      draw: X => {
        const h = level(F) + cut(F), holes = MODEL.voidsAt(level(F));
        return PLAN.floorArea(X, rooms.flatMap(r => r.rects)) + (WHOLE ? planStair(F, X, h, holes) : '') + PLAN.cut(X, solids, h)
          + furniture.map(p => PLAN.seen(X, p.shapes, h) + PLAN.cut(X, p.cells, h, c => !c.layers.includes('holes'))).join('')
          + (WHOLE && F === FLOORS[FLOORS.length - 1] ? planUnderRoof(F, X, holes) : '') + planDoors(F, X, view.doors)
          + PLAN.labels(X, MODEL.OPENINGS, h, MODEL.SIDE, o => MODEL.floorOf((o.b[4] + o.b[5]) / 2) === F.id && (WHOLE || inside(box, (o.b[0] + o.b[1]) / 2, (o.b[2] + o.b[3]) / 2)))
          + PLAN.borders(X, borders) + PLAN.rooms(X, rooms.map(roomLabel)) + (WHOLE ? planChains(F, X) : PLAN.dims(X, box));
      } };
  }));
}
/* what the sheets say under them: each floor's cut, and the house's note */
const note = () => `The cut over the floor: ${FLOORS.map(F => `${(F.name || F.id).toLowerCase()} ${cut(F)} mm`).join(', ')}. ${MODEL.T.setting(HOUSE, 'view').value.planNote}`;
return { svg, note };
}

return { create };
}
