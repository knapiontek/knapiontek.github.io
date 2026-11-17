/* library/draw.js: how a product of the library is drawn, whatever room it stands in. A product names its drawing (its field
   draw); the room places it and hands over a drawing context D and the place: the frame of its group (u along the group,
   v up from the floor, n out from the carcass backs, mm) and the anchors the drawing starts from. The sizes are the maker's
   (the product); the shapes the maker does not give (a knob, a tap's spout, a lamp's shade) are drawn here.
   D: box(list, r, gb, key, layer, info), cylinder(a, radius, length, key, u, v, n, axis, segments, shadow),
   detail(a, geometry, key, u, v, n, shadow), display(a, text, w, h, u, v, n), at(r, layer, mover, also), mover(r, kind, u, v, n),
   envelope(r, gb, name, kind), openFront / openTop(list, r, gb, t, key, layer, info), profile(list, r, u0, u1, prof, info,
   faceMaterial), part(), lamp(light, from, to, shadow), point(r, u, v, n), frame(r): {U, N}, material(key), STATIC, CEILING.
   Needs THREE when it draws, nothing when it loads. */
(function () {
'use strict';

/* ---------- an oven or a microwave built into a carcass: the body on its feet behind the carcass front, the fascia in
   front of it; the appliance door turns on its hinge edge. place: {r, item (item.fit: model.js), front (n of the carcass
   front)}. d = how far a detail stands out of the appliance face: n = 2·face − d. ---------- */
function builtIn(D, type, A, { r, item, front: carcassFront }) {
  const { box, cylinder, display, at, mover, envelope, openFront, STATIC } = D;
  const { feet, bodyV0: b0, fasciaV0: v0, fasciaV1: v1 } = item.fit, floor = b0 - feet, uc = (item.u0 + item.u1) / 2;
  const u0 = uc - A.fascia.width / 2, u1 = uc + A.fascia.width / 2, face = carcassFront + A.fascia.thickness, { width: bw, height: bh, depth: bd } = A.body;
  const bu0 = uc - bw / 2, bu1 = uc + bw / 2, fixed = at(r, type), I = { name: A.name, part: D.part() };
  if (feet > 0) for (const fu of [bu0 + 30, bu1 - 30]) for (const fn of [carcassFront - bd + 30, carcassFront - 30]) cylinder(fixed, 10, feet, 'blackMetal', fu, floor + feet / 2, fn, null, 16);
  envelope(r, [bu0, bu1, b0, b0 + bh, carcassFront - bd, carcassFront], A.name + ' – body ' + bw + ' × ' + bh + ' × ' + bd + (feet > 0 ? ' on feet ' + Math.round(feet * 10) / 10 : ''));
  envelope(r, [u0, u1, v0, v1, carcassFront, face], A.name + ' – fascia ' + A.fascia.width + ' × ' + A.fascia.height);
  /* the door: an oven's below its control panel, full width; a microwave's over the body opening, left of its control column */
  const door = type === 'oven' ? { u0, u1, v0, v1: v1 - A.controlPanelHeight } : { u0: bu0 + 2, u1: u1 - A.controlColumnWidth, v0: b0 + 4, v1: b0 + bh - 4 };
  const hinge = A.door.hinge, bottom = hinge === 'bottom';
  const m = mover(r, type, bottom ? 0 : hinge === 'left' ? door.u0 : door.u1, bottom ? door.v0 : 0, face);
  Object.assign(m, { sign: hinge === 'left' ? 1 : -1, swing: bottom ? 'u' : 'v', item, label: A.name + ' – door ' + Math.round(door.u1 - door.u0) + ' × ' + Math.round(door.v1 - door.v0) });
  const DI = { name: A.name, mover: m }, moving = at(r, type, m);
  const fixedBox = (gb, key) => box(STATIC, r, gb, key, type, I), doorBox = (gb, key) => box(m.cells, r, gb, key, type, DI);
  const outBox = (put, d0, d1, y0, y1, a0, a1, key) => put([a0, a1, y0, y1, 2 * face - d1, 2 * face - d0], key);
  openFront(STATIC, r, [bu0, bu1, b0, b0 + bh, carcassFront - bd, carcassFront], 4, 'applianceBody', type, { name: A.name });
  fixedBox([bu0 + 4, bu1 - 4, b0 + 4, b0 + bh - 4, carcassFront - bd + 4, carcassFront - bd + 6], 'ovenInside');   // the back of the cavity
  const fascia = (a0, a1, y0, y1) => fixedBox([a0, a1, y0, y1, carcassFront, face - 6], 'blackMetal');
  doorBox([door.u0, door.u1, door.v0, door.v1, carcassFront + 2, face - 6], 'blackMetal');   // the leaf, 2 off the carcass front
  outBox(doorBox, face - 2, face + 6, door.v0, door.v1, door.u0, door.u1, 'blackMetal');      // its trim
  if (type === 'oven') {
    fascia(u0, u1, door.v1, v1);
    outBox(fixedBox, face - 2, face + 6, door.v1, v1, u0, u1, 'blackMetal');
    const panel = door.v1 + 3, mid = (panel + v1 - 10) / 2;
    outBox(fixedBox, face - 8, face - 2, panel, v1 - 10, u0 + 10, u1 - 10, 'glassBlack');
    for (const a of [u0 + 85, u1 - 85]) {           // knobs
      cylinder(fixed, 19, 20, 'steelPolished', a, mid, face + 18, 'z', 32);
      cylinder(fixed, 21, 3, 'steelPolished', a, mid, face + 9, 'z', 32);
    }
    display(fixed, '12:30', 110, 34, uc, mid, face + 8.5);
    for (const y of [b0 + 150, b0 + 290]) cylinder(fixed, 3, bw - 40, 'steelPolished', uc, y, carcassFront - bd / 2, 'x', 8);   // shelf rails
    const d0 = door.v0 + 10, d1 = door.v1 - 3;
    outBox(doorBox, face - 10, face - 8, d0 + 70, d1 - 80, u0 + 70, u1 - 70, 'smokedGlass');       // the door glass in a black border
    outBox(doorBox, face - 12, face - 8, d1 - 80, d1, u0 + 10, u1 - 10, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0, d0 + 70, u0 + 10, u1 - 10, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, u0 + 10, u0 + 70, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, u1 - 70, u1 - 10, 'glassBlack');
    cylinder(moving, 10, u1 - u0 - 140, 'steelPolished', uc, d1 - 40, face + 48, 'x', 24);   // bar handle
    for (const a of [u0 + 80, u1 - 80]) cylinder(moving, 7, 36, 'steelPolished', a, d1 - 40, face + 28, 'z', 16);
  } else {
    fascia(u0, door.u0 - 2, v0, v1); fascia(door.u1 + 2, u1, v0, v1); fascia(door.u0 - 2, door.u1 + 2, v0, door.v0 - 2); fascia(door.u0 - 2, door.u1 + 2, door.v1 + 2, v1);
    const panelLeft = door.u1 + 3;
    for (const [a0, a1, y0, y1] of [[u0, door.u0 - 2, v0, v1], [door.u1 + 2, u1, v0, v1], [door.u0 - 2, door.u1 + 2, v0, door.v0 - 2], [door.u0 - 2, door.u1 + 2, door.v1 + 2, v1]]) {
      outBox(fixedBox, face - 4, face + 6, y0, y1, a0, a1, 'blackMetal');
    }
    outBox(fixedBox, face - 10, face - 4, v0 + 10, v1 - 10, panelLeft + 8, u1 - 10, 'glassBlack');
    display(fixed, '0:45', 90, 28, (panelLeft + u1) / 2, v1 - 70, face + 10.5);
    cylinder(fixed, 14, 4, 'steelPolished', (panelLeft + u1) / 2, v0 + 90, face + 12, 'z', 32);
    const { u0: a0, u1: a1, v0: y0, v1: y1 } = door, f = 40;
    outBox(doorBox, face - 10, face - 8, y0 + f, y1 - f, a0 + f, a1 - f, 'smokedGlass');
    outBox(doorBox, face - 12, face - 8, y1 - f, y1, a0, a1, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, y0, y0 + f, a0, a1, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, y0 + f, y1 - f, a0, a0 + f, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, y0 + f, y1 - f, a1 - f, a1, 'glassBlack');
  }
}

/* ---------- a sink in its worktop cut-out: rim, bowl, drain. place: {r, u (the axis), n (the middle of the cut-out),
   top (the worktop's top)}. Returns what the tap and the trap start from. ---------- */
function sink(D, S, { r, u: sinkU, n: sn, top }) {
  const { box, cylinder, at, envelope, STATIC } = D, rim = S.rim, wall = S.wall, I = { name: S.name, part: D.part() };
  granite(D);
  const s0 = sinkU - S.body.width / 2, s1 = sinkU + S.body.width / 2, sn0 = sn - S.body.depth / 2, sn1 = sn + S.body.depth / 2;
  const b0 = sinkU - S.bowl.width / 2, b1 = sinkU + S.bowl.width / 2, bn0 = sn - S.bowl.depth / 2, bn1 = sn + S.bowl.depth / 2, bottom = top - S.bowl.height;
  const g = gb => box(STATIC, r, gb, 'granite', 'sink', I);
  for (const [u0, u1, n0, n1] of [[s0, s1, sn0, bn0 - wall], [s0, s1, bn1 + wall, sn1], [s0, b0 - wall, bn0 - wall, bn1 + wall], [b1 + wall, s1, bn0 - wall, bn1 + wall]]) g([u0, u1, top, top + rim, n0, n1]);   // the rim
  g([b0 - wall, b0, bottom, top + rim, bn0 - wall, bn1 + wall]); g([b1, b1 + wall, bottom, top + rim, bn0 - wall, bn1 + wall]);   // the bowl walls
  g([b0, b1, bottom, top + rim, bn0 - wall, bn0]); g([b0, b1, bottom, top + rim, bn1, bn1 + wall]);
  g([b0 - wall, b1 + wall, bottom - wall, bottom, bn0 - wall, bn1 + wall]);   // the bowl bottom
  envelope(r, [b0 - wall, b1 + wall, bottom - wall, top, bn0 - wall, bn1 + wall], 'Sink – bowl ' + (b1 - b0 + 2 * wall) + ' × ' + (bn1 - bn0 + 2 * wall) + ' × ' + (top - bottom + wall));
  const a = at(r, 'sink'), bc = (bn0 + bn1) / 2;
  cylinder(a, 45, 3, 'steelPolished', sinkU, bottom + 1.5, bc, null, 32);             // drain
  cylinder(a, 30, 4, 'ovenInside', sinkU, bottom + 2, bc, null, 32);
  return { bottom: bottom - wall, rimTop: top + rim, drain: bc };
}
/* the sink's granite: a speckled map drawn once */
function granite(D) {
  const V = D.V, m = D.material('granite');
  if (m.map) return;
  const t = V.canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#2a2b2d'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++) {
      const k = V.hash01(i, 3), s = 0.6 + V.hash01(i, 4) * 1.4;
      g.fillStyle = k > 0.78 ? `rgba(190,190,186,${0.2 + V.hash01(i, 5) * 0.3})` : k > 0.35 ? 'rgba(90,90,92,.6)' : 'rgba(10,10,11,.7)';
      g.fillRect(V.hash01(i, 1) * w, V.hash01(i, 2) * h, s, s);
    }
  });
  t.repeat.set(1 / 250, 1 / 250);
  m.map = t;
}
/* a kitchen tap on the worktop with its soap dispenser. place: {r, u (the sink's axis), n, top (the rim's top)} */
function tap(D, { r, u: sinkU, n: tapN, top: t }) {
  const { cylinder, at } = D, a = at(r, 'sink');
  cylinder(a, 18, 3, 'steelPolished', sinkU + 250, t + 1.5, tapN, null, 24);           // dispenser plate
  cylinder(a, 28, 8, 'handle', sinkU, t + 4, tapN, null, 32);                  // tap
  cylinder(a, 20, 172, 'handle', sinkU, t + 94, tapN, null, 32);
  cylinder(a, 21, 6, 'handle', sinkU, t + 183, tapN, null, 32);
  cylinder(a, 11, 220, 'handle', sinkU, t + 166, tapN + 110, 'z', 20);
  cylinder(a, 13, 26, 'handle', sinkU, t + 152, tapN + 214, null, 20);
  cylinder(a, 7, 70, 'handle', sinkU + 55, t + 140, tapN, 'x', 16);
}
/* a space-saving trap: a short drop, a flat body against the back, the outlet into the wall. place: {r, u, from (the bottom
   of the bowl), drain (n of the drain), top (of the body), outlet (v of the wall outlet), back (n of the carcass back)} */
function trap(D, { r, u: sinkU, from: yb, drain: bc, top: yt, outlet: yo, back: carcassBack }) {
  const { box, cylinder, at, STATIC } = D, p = at(r, 'trap'), nb = carcassBack + 31, P = { name: 'Trap', part: D.part() };
  cylinder(p, 20, yb - yt, 'pipe', sinkU, (yb + yt) / 2, bc, null, 20);
  cylinder(p, 20, bc - nb, 'pipe', sinkU, yt, (bc + nb) / 2, 'z', 20);
  box(STATIC, r, [sinkU - 70, sinkU + 70, yo - 25, yt + 25, carcassBack + 6, carcassBack + 56], 'pipe', 'trap', P);
  cylinder(p, 20, 70, 'pipe', sinkU + 105, yo, nb - 25, 'z', 20);
  box(STATIC, r, [sinkU + 70, sinkU + 125, yo - 20, yo + 20, carcassBack + 6, carcassBack + 36], 'pipe', 'trap', P);
}

/* ---------- an induction hob in its cut-out. place: {r, u (the axis), cut {u0, u1, n0, n1}, top (the worktop's top)} ---------- */
function hob(D, H, { r, u: hobU, cut: hobCut, top: v }) {
  const { box, detail, at, envelope, STATIC } = D, gn = (hobCut.n0 + hobCut.n1) / 2 - H.glass.depth / 2, I = { name: H.name };
  box(STATIC, r, [hobU - H.glass.width / 2, hobU + H.glass.width / 2, v, v + 5, gn, gn + H.glass.depth], 'glassBlack', 'hob', I);
  box(STATIC, r, [hobCut.u0, hobCut.u1, v - H.body.height, v, hobCut.n0, hobCut.n1], 'applianceBody', 'hob', I);
  envelope(r, [hobCut.u0, hobCut.u1, v - H.body.height, v, hobCut.n0, hobCut.n1], 'Hob – body ' + (hobCut.u1 - hobCut.u0) + ' × ' + (hobCut.n1 - hobCut.n0) + ' × ' + H.body.height);
  const a = at(r, 'hob');
  for (const [du, n, radius] of [[-150, gn + 140, 100], [150, gn + 140, 85], [-150, gn + 370, 85], [150, gn + 370, 110]]) {
    detail(a, new THREE.RingGeometry(radius - 3, radius, 64), 'ringGrey', hobU + du, v + 5.5, n, false).rotation.x = -Math.PI / 2;   // cooking zones
  }
  detail(a, new THREE.PlaneGeometry(220, 30), 'ringGrey', hobU, v + 5.5, gn + 490, false).rotation.x = -Math.PI / 2;   // the slider
}

/* ---------- a chimney hood on the wall. place: {r, u (the axis), bottom (v of its underside), ceiling (v), worktop (v of
   the worktop's top, where its lights point)} ---------- */
function hood(D, A, { r, u: uc, bottom, ceiling: CEILING, worktop }) {
  const { box, detail, at, profile, lamp, point, STATIC } = D, { width: w, height: h, depth: d } = A.body, { width: cw, depth: cd } = A.chimney;
  const I = { name: A.name, layer: 'hood' }, a = at(r, 'hood'), { U } = D.frame(r);
  const prof = [[0, bottom], [d, bottom], [d, bottom + 40], [110, bottom + h], [0, bottom + h]];   // (n, v): an angled glass front
  const sides = n => (Math.abs(n[0] * U[0] + n[1] * U[1]) > 0.5 ? 'blackMetal' : 'glassBlack');
  if (!profile(STATIC, r, uc - w / 2, uc + w / 2, prof, I, sides)) {   // a group across x: the same body as a plain mesh
    const shape = new THREE.Shape(prof.map(([n, v]) => new THREE.Vector2(n, v - bottom)));
    const body = detail(a, new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false }), 'blackMetal', uc + w / 2, bottom, 0);
    body.geometry.rotateY(-Math.PI / 2); body.material = [D.material('blackMetal'), D.material('glassBlack')];
  }
  box(STATIC, r, [uc - w / 2 + 20, uc + w / 2 - 20, bottom - 1, bottom, 20, d - 20], 'ovenInside', 'hood', I);   // the filter
  box(STATIC, r, [uc - cw / 2, uc + cw / 2, bottom + h, CEILING, 0, cd], 'blackMetal', 'hood', I);              // the chimney
  const angle = Math.atan2(h - 40, d - 110), panel = detail(a, new THREE.PlaneGeometry(200, 12), 'led', uc,
    bottom + 40 + (h - 40) * 0.18 + Math.cos(angle) * 1.2, d - (d - 110) * 0.18 + Math.sin(angle) * 1.2, false);
  panel.rotation.x = -(Math.PI / 2 - angle);
  for (const u of [uc - 150, uc + 150]) {
    detail(a, new THREE.PlaneGeometry(160, 12), 'led', u, bottom - 1.5, d - 90, false).rotation.x = Math.PI / 2;
    lamp(new THREE.SpotLight(0xfff0dc, 4.5, 0, 1.05, 0.8, 2), point(r, u, bottom - 5, d - 90), point(r, u, worktop, d - 170), false);
  }
}

/* ---------- a built-in fridge-freezer where model.js fits it: the body, its doors at the carcass front. place: {r, fit,
   front (n of the carcass front), back (n of the carcass back)} ---------- */
const doorPlane = (A, carcassFront) => carcassFront - A.doorDepth;
function fridgeFreezer(D, A, { r, fit, front: carcassFront, back: carcassBack }) {
  const { box, envelope, openFront, STATIC } = D, I = { name: A.name }, fridgeDoorPlane = doorPlane(A, carcassFront);
  const { bodyU0: u0, bodyU1: u1, bodyV0: v0, bodyV1: v1 } = fit, f = (gb, key) => box(STATIC, r, gb, key, 'fridge', I);
  envelope(r, [u0, u1, v0, v1, carcassFront - A.body.depth, fridgeDoorPlane], A.name + ' – body ' + A.body.width + ' × ' + A.body.height + ' (without the doors)');
  openFront(STATIC, r, [u0, u1, v0, v1, carcassFront - A.body.depth, fridgeDoorPlane], 24, 'fridgeWhite', 'fridge', I);
  const split = v0 + (A.doors.freezer.top + A.doors.fridge.bottom) / 2, top = v1 - 24, lo = split + 14;
  f([u0 + 24, u1 - 24, split - 14, split + 14, carcassBack + 42, fridgeDoorPlane], 'fridgeWhite');
  for (const k of [0.34, 0.56, 0.78]) { const y = lo + (top - lo) * k; f([u0 + 26, u1 - 26, y, y + 5, carcassBack + 44, carcassFront - 124], 'glassShelf'); }
  f([u0 + 40, u1 - 40, lo + 8, lo + 190, carcassBack + 60, carcassFront - 134], 'frost');
  const f0 = v0 + 24, f1 = split - 14, dh = (f1 - f0) / 3;
  for (let j = 0; j < 3; j++) f([u0 + 34, u1 - 34, f0 + j * dh + 8, f0 + (j + 1) * dh - 8, carcassBack + 50, carcassFront - 84], 'frost');
  f([u0 + 140, u1 - 140, top - 5, top, carcassBack + 226, carcassBack + 316], 'led');
}
/* one door of it, moving with the cabinet front it carries. place: {r, m (the front's moving part), freezer, fit, front,
   shelves: [u0, u1] of the door shelves} */
function fridgeDoor(D, A, { r, m, freezer, fit, front: carcassFront, shelves: [s0, s1] }) {
  const { box, envelope } = D, I = { mover: m }, fridgeDoorPlane = doorPlane(A, carcassFront), Dr = freezer ? A.doors.freezer : A.doors.fridge;
  const bu0 = fit.bodyU0, bu1 = fit.bodyU1, d0 = fit.bodyV0 + Dr.bottom, d1 = fit.bodyV0 + Dr.top;
  envelope(r, [bu0, bu1, d0, d1, fridgeDoorPlane, carcassFront], A.name + ' – ' + (freezer ? 'freezer' : 'fridge') + ' door ' + (Dr.top - Dr.bottom));
  box(m.cells, r, [bu0, bu1, d0, d1, fridgeDoorPlane, carcassFront - 2], 'fridgeWhite', 'fridge', I);
  if (!freezer) for (const k of [0.25, 0.5, 0.75]) { const y = d0 + (d1 - d0) * k; box(m.cells, r, [s0, s1, y, y + 80, fridgeDoorPlane - 54, fridgeDoorPlane], 'frost', 'fridge', I); }
}

/* ---------- a built-in dishwasher: the tub and racks stand, its door moves with the front it carries. place: {r, m, item
   (item.fit: model.js), front, back} ---------- */
function dishwasher(D, A, { r, m, item, front: carcassFront, back: carcassBack }) {
  const { box, envelope, openFront, openTop, STATIC } = D, I = { mover: m }, W = { name: A.name };
  const uc = (item.u0 + item.u1) / 2, { bodyU0: w0, bodyU1: w1, bodyV1: h, doorV0: db, doorV1: dt } = item.fit;
  const t0 = db, t1 = h - 6;
  openFront(STATIC, r, [w0 + 3, w1 - 3, t0, t1, carcassBack + 8, carcassFront - 24], 2, 'steelPolished', 'dishwasher', W);   // the tub
  for (const [y0, y1] of [[t0 + 80, t0 + 220], [t1 - 380, t1 - 250]]) openTop(STATIC, r, [w0 + 29, w1 - 29, y0, y1, carcassBack + 40, carcassFront - 50], 3, 'wire', 'dishwasher', W);   // racks
  box(STATIC, r, [uc - 200, uc + 200, t0 + 63, t0 + 71, (carcassBack + carcassFront) / 2 - 25, (carcassBack + carcassFront) / 2 + 25], 'steelPolished', 'dishwasher', W);   // spray arm
  box(m.cells, r, [w0, w1, db, h - 6, carcassFront - 22, carcassFront], 'steelPolished', 'dishwasher', I);      // the appliance door
  box(m.cells, r, [w0, w1, h - 6, h, carcassFront - 22, carcassFront], 'glassBlack', 'dishwasher', I);  // its control strip
  envelope(r, [w0, w1, db, h, carcassFront - A.body.depth, carcassFront], A.name + ' – ' + A.body.width + ' × ' + Math.round(h) + ' × ' + A.body.depth + ', door ' + Math.round(dt - db));
  envelope(r, [w0, w1, 0, db, carcassFront - A.body.depth, carcassFront - A.baseSetback], A.name + ' – base, ' + A.baseSetback + ' behind the front');
}

/* ---------- a coffee machine standing on a shelf, moving with it. place: {r, m, u (its middle), v (the shelf's top), n (its front)} ---------- */
function coffeeMachine(D, A, { r, m, u: uc, v: y, n: n1 }) {
  const { box, cylinder, display, at, envelope } = D;
  const { width: w, height: h, depth: d } = A.body, u0 = uc - w / 2, u1 = uc + w / 2, n0 = n1 - d, top = y + h, head = top - 115, fp = n1 - 45;
  const I = { mover: m, name: A.name }, c = (gb, key) => box(m.cells, r, gb, key, 'coffee', I), a = at(r, 'coffee', m);
  envelope(r, [u0, u1, y, top, n0, n1], A.name + ' ' + w + ' × ' + h + ' × ' + d);
  c([u0, u1, y, top, n0, fp], 'blackMetal');                                        // body
  c([u0, u0 + 28, y, head, fp, n1], 'steelPolished'); c([u1 - 28, u1, y, head, fp, n1], 'steelPolished');   // front side columns
  c([u0, u1, head, top, fp, n1], 'steelPolished');                                          // head with the controls
  c([u0 + 18, u1 - 18, head + 28, top - 14, n1, n1 + 2], 'glassBlack');
  display(a, 'ESPRESSO', 110, 30, uc, top - 40, n1 + 2.5);
  for (let i = 0; i < 4; i++) cylinder(a, 6, 3, 'steelPolished', u0 + 50 + i * (w - 100) / 3, head + 40, n1 + 3, 'z', 16);
  c([u0 + 28, u1 - 28, y + 32, head, fp, fp + 3], 'ovenInside');                    // brew recess
  c([uc - 32, uc + 32, head - 34, head, fp, n1 - 8], 'steelPolished');                      // spout unit
  for (const du of [-12, 12]) cylinder(a, 5, 16, 'steelPolished', uc + du, head - 42, n1 - 24, null, 12);
  c([u0 + 6, u1 - 6, y, y + 30, fp - 60, n1 + 6], 'steelPolished');                         // drip tray
  c([u0 + 22, u1 - 22, y + 30, y + 32, fp - 40, n1 - 4], 'zinc');
  cylinder(a, 32, 62, 'fridgeWhite', uc, y + 63, n1 - 26, null, 28);                     // a cup
  c([uc - 70, uc + 70, top, top + 6, n0 + 30, n0 + 190], 'blackMetal');             // bean container lid
  cylinder(a, 5, 150, 'steelPolished', u1 + 10, head - 60, n1 - 40, null, 12);              // steam wand
  cylinder(a, 8, 20, 'blackMetal', u1 + 10, head + 20, n1 - 40, null, 16);
}

/* ---------- lamps, lit at night ---------- */
/* a pendant: cable, a dome shade in the fronts' colour, a ring, a bulb. place: {a (where details go), r, u, n, bottom (v of
   the shade's rim), ceiling} */
function pendant(D, { a, r, u, n, bottom: y, ceiling: CEILING }) {
  const { cylinder, detail, lamp, point } = D;
  cylinder(a, 2, CEILING - y - 90, 'gasket', u, (CEILING + y + 90) / 2, n, null, 6);   // cable
  detail(a, new THREE.SphereGeometry(150, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), 'shade', u, y + 60, n);
  const inside = detail(a, new THREE.SphereGeometry(148, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), 'shadeInside', u, y + 60, n, false);
  inside.material = D.material('shadeInside').clone(); inside.material.side = THREE.BackSide;
  detail(a, new THREE.TorusGeometry(150, 4, 8, 48), 'handle', u, y + 60, n).rotation.x = Math.PI / 2;
  cylinder(a, 14, 40, 'gasket', u, y + 180, n, null, 16);
  detail(a, new THREE.SphereGeometry(32, 20, 12), 'bulb', u, y + 135, n, false);
  lamp(new THREE.PointLight(0xffd9a8, 1.2, 0.9, 2), point(r, u, y + 135, n), null, false);
  lamp(new THREE.SpotLight(0xffd9a8, 7, 5, 1.2, 0.8, 2), point(r, u, y + 135, n), point(r, u, 0, n), true);
}
/* a downlight in the ceiling. place: {a, r, u, n, ceiling} */
function downlight(D, { a, r, u, n, ceiling: CEILING }) {
  const { detail, lamp, point } = D;
  const tube = detail(a, new THREE.CylinderGeometry(35, 35, 100, 40, 1, true), 'tube', u, CEILING - 50, n);
  tube.material = D.material('tube').clone(); tube.material.side = THREE.DoubleSide;
  detail(a, new THREE.CircleGeometry(27, 32), 'bulb', u, CEILING - 85, n, false).rotation.x = Math.PI / 2;
  lamp(new THREE.SpotLight(0xfff0dc, 11, 0, 1.0, 1, 2), point(r, u, CEILING - 90, n), point(r, u, 0, n), true);
}

/* by a product's field draw */
HOME.draw = {
  oven: (D, A, place) => builtIn(D, 'oven', A, place),
  microwave: (D, A, place) => builtIn(D, 'microwave', A, place),
  sink, tap, trap, hob, hood, fridgeFreezer, fridgeDoor, dishwasher, coffeeMachine, pendant, downlight
};
})();
