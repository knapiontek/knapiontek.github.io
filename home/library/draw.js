/* library/draw.js: how a product of the library is drawn, whatever room it stands in. A product names its drawing (its field
   draw); the room places it and hands over a drawing context D and the place: the frame of its group (x along the group,
   y out from the carcass backs, h up from the floor, mm) and the anchors the drawing starts from. The sizes are the maker's
   (the product); the shapes the maker does not give (a knob, a tap's spout, a lamp's shade) are drawn here.
   D: box(list, r, gb, key, layer, info) with gb [x0, x1, y0, y1, h0, h1], cylinder(a, radius, length, key, x, y, h, axis,
   segments, shadow), detail(a, geometry, key, x, y, h, shadow), display(a, text, w, high, x, y, h), at(r, layer, mover, also),
   mover(r, kind, x, y, h), envelope(r, gb, name, kind), openFront / openTop(list, r, gb, t, key, layer, info), profile(list,
   r, x0, x1, prof [[y, h]], info, faceMaterial), part(), lamp(light, from, to, shadow), point(r, x, y, h), frame(r): {X, Y},
   material(key), STATIC, CEILING. A mesh of a detail keeps three.js's own axes: x along, y up, z out of the wall.
   Needs THREE when it draws, nothing when it loads. */
(function () {
'use strict';

/* ---------- an oven or a microwave built into a carcass: the body on its feet behind the carcass front, the fascia in
   front of it; the appliance door turns on its hinge edge. place: {r, item (item.fit: model.js), front (y of the carcass
   front)}. d = how far a detail stands out of the appliance face: y = 2·face − d. ---------- */
function builtIn(D, type, A, { r, item, front: carcassFront }) {
  const { box, cylinder, display, at, mover, envelope, openFront, STATIC } = D;
  const { feet, bodyH0: b0, fasciaH0: h0, fasciaH1: h1 } = item.fit, floor = b0 - feet, xc = (item.x0 + item.x1) / 2;
  const x0 = xc - A.fascia.width / 2, x1 = xc + A.fascia.width / 2, face = carcassFront + A.fascia.thickness, { width: bw, height: bh, depth: bd } = A.body;
  const bx0 = xc - bw / 2, bx1 = xc + bw / 2, fixed = at(r, type), I = { name: A.name, part: D.part() };
  if (feet > 0) for (const fx of [bx0 + 30, bx1 - 30]) for (const fy of [carcassFront - bd + 30, carcassFront - 30]) cylinder(fixed, 10, feet, 'blackMetal', fx, fy, floor + feet / 2, null, 16);
  envelope(r, [bx0, bx1, carcassFront - bd, carcassFront, b0, b0 + bh], A.name + ' – body ' + bw + ' × ' + bh + ' × ' + bd + (feet > 0 ? ' on feet ' + Math.round(feet * 10) / 10 : ''));
  envelope(r, [x0, x1, carcassFront, face, h0, h1], A.name + ' – fascia ' + A.fascia.width + ' × ' + A.fascia.height);
  /* the door: an oven's below its control panel, full width; a microwave's over the body opening, left of its control column */
  const door = type === 'oven' ? { x0, x1, h0, h1: h1 - A.controlPanelHeight } : { x0: bx0 + 2, x1: x1 - A.controlColumnWidth, h0: b0 + 4, h1: b0 + bh - 4 };
  const hinge = A.door.hinge, bottom = hinge === 'bottom';
  const m = mover(r, type, bottom ? 0 : hinge === 'left' ? door.x0 : door.x1, face, bottom ? door.h0 : 0);
  Object.assign(m, { sign: hinge === 'left' ? 1 : -1, swing: bottom ? 'x' : 'h', item, label: A.name + ' – door ' + Math.round(door.x1 - door.x0) + ' × ' + Math.round(door.h1 - door.h0) });
  const DI = { name: A.name, mover: m }, moving = at(r, type, m);
  const fixedBox = (gb, key) => box(STATIC, r, gb, key, type, I), doorBox = (gb, key) => box(m.cells, r, gb, key, type, DI);
  const outBox = (put, d0, d1, lo, hi, a0, a1, key) => put([a0, a1, 2 * face - d1, 2 * face - d0, lo, hi], key);
  openFront(STATIC, r, [bx0, bx1, carcassFront - bd, carcassFront, b0, b0 + bh], 4, 'applianceBody', type, { name: A.name });
  fixedBox([bx0 + 4, bx1 - 4, carcassFront - bd + 4, carcassFront - bd + 6, b0 + 4, b0 + bh - 4], 'ovenInside');   // the back of the cavity
  const fascia = (a0, a1, lo, hi) => fixedBox([a0, a1, carcassFront, face - 6, lo, hi], 'blackMetal');
  doorBox([door.x0, door.x1, carcassFront + 2, face - 6, door.h0, door.h1], 'blackMetal');   // the leaf, 2 off the carcass front
  outBox(doorBox, face - 2, face + 6, door.h0, door.h1, door.x0, door.x1, 'blackMetal');      // its trim
  if (type === 'oven') {
    fascia(x0, x1, door.h1, h1);
    outBox(fixedBox, face - 2, face + 6, door.h1, h1, x0, x1, 'blackMetal');
    const panel = door.h1 + 3, mid = (panel + h1 - 10) / 2;
    outBox(fixedBox, face - 8, face - 2, panel, h1 - 10, x0 + 10, x1 - 10, 'glassBlack');
    for (const a of [x0 + 85, x1 - 85]) {           // knobs
      cylinder(fixed, 19, 20, 'steelPolished', a, face + 18, mid, 'y', 32);
      cylinder(fixed, 21, 3, 'steelPolished', a, face + 9, mid, 'y', 32);
    }
    display(fixed, '12:30', 110, 34, xc, face + 8.5, mid);
    for (const lift of [b0 + 150, b0 + 290]) cylinder(fixed, 3, bw - 40, 'steelPolished', xc, carcassFront - bd / 2, lift, 'x', 8);   // shelf rails
    const d0 = door.h0 + 10, d1 = door.h1 - 3;
    outBox(doorBox, face - 10, face - 8, d0 + 70, d1 - 80, x0 + 70, x1 - 70, 'smokedGlass');       // the door glass in a black border
    outBox(doorBox, face - 12, face - 8, d1 - 80, d1, x0 + 10, x1 - 10, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0, d0 + 70, x0 + 10, x1 - 10, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, x0 + 10, x0 + 70, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, x1 - 70, x1 - 10, 'glassBlack');
    cylinder(moving, 10, x1 - x0 - 140, 'steelPolished', xc, face + 48, d1 - 40, 'x', 24);   // bar handle
    for (const a of [x0 + 80, x1 - 80]) cylinder(moving, 7, 36, 'steelPolished', a, face + 28, d1 - 40, 'y', 16);
  } else {
    fascia(x0, door.x0 - 2, h0, h1); fascia(door.x1 + 2, x1, h0, h1); fascia(door.x0 - 2, door.x1 + 2, h0, door.h0 - 2); fascia(door.x0 - 2, door.x1 + 2, door.h1 + 2, h1);
    const panelLeft = door.x1 + 3;
    for (const [a0, a1, lo, hi] of [[x0, door.x0 - 2, h0, h1], [door.x1 + 2, x1, h0, h1], [door.x0 - 2, door.x1 + 2, h0, door.h0 - 2], [door.x0 - 2, door.x1 + 2, door.h1 + 2, h1]]) {
      outBox(fixedBox, face - 4, face + 6, lo, hi, a0, a1, 'blackMetal');
    }
    outBox(fixedBox, face - 10, face - 4, h0 + 10, h1 - 10, panelLeft + 8, x1 - 10, 'glassBlack');
    display(fixed, '0:45', 90, 28, (panelLeft + x1) / 2, face + 10.5, h1 - 70);
    cylinder(fixed, 14, 4, 'steelPolished', (panelLeft + x1) / 2, face + 12, h0 + 90, 'y', 32);
    const { x0: a0, x1: a1, h0: lo, h1: hi } = door, f = 40;
    outBox(doorBox, face - 10, face - 8, lo + f, hi - f, a0 + f, a1 - f, 'smokedGlass');
    outBox(doorBox, face - 12, face - 8, hi - f, hi, a0, a1, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, lo, lo + f, a0, a1, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, lo + f, hi - f, a0, a0 + f, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, lo + f, hi - f, a1 - f, a1, 'glassBlack');
  }
}

/* ---------- a sink in its worktop cut-out: rim, bowl, drain. place: {r, x (the axis), y (the middle of the cut-out),
   top (the worktop's top)}. Returns what the tap and the trap start from. ---------- */
function sink(D, S, { r, x: sinkX, y: sy, top }) {
  const { box, cylinder, at, envelope, STATIC } = D, rim = S.rim, wall = S.wall, I = { name: S.name, part: D.part() };
  granite(D);
  const s0 = sinkX - S.body.width / 2, s1 = sinkX + S.body.width / 2, sy0 = sy - S.body.depth / 2, sy1 = sy + S.body.depth / 2;
  const b0 = sinkX - S.bowl.width / 2, b1 = sinkX + S.bowl.width / 2, by0 = sy - S.bowl.depth / 2, by1 = sy + S.bowl.depth / 2, bottom = top - S.bowl.height;
  const g = gb => box(STATIC, r, gb, 'granite', 'sink', I);
  for (const [x0, x1, y0, y1] of [[s0, s1, sy0, by0 - wall], [s0, s1, by1 + wall, sy1], [s0, b0 - wall, by0 - wall, by1 + wall], [b1 + wall, s1, by0 - wall, by1 + wall]]) g([x0, x1, y0, y1, top, top + rim]);   // the rim
  g([b0 - wall, b0, by0 - wall, by1 + wall, bottom, top + rim]); g([b1, b1 + wall, by0 - wall, by1 + wall, bottom, top + rim]);   // the bowl walls
  g([b0, b1, by0 - wall, by0, bottom, top + rim]); g([b0, b1, by1, by1 + wall, bottom, top + rim]);
  g([b0 - wall, b1 + wall, by0 - wall, by1 + wall, bottom - wall, bottom]);   // the bowl bottom
  envelope(r, [b0 - wall, b1 + wall, by0 - wall, by1 + wall, bottom - wall, top], 'Sink – bowl ' + (b1 - b0 + 2 * wall) + ' × ' + (by1 - by0 + 2 * wall) + ' × ' + (top - bottom + wall));
  const a = at(r, 'sink'), bc = (by0 + by1) / 2;
  cylinder(a, 45, 3, 'steelPolished', sinkX, bc, bottom + 1.5, null, 32);             // drain
  cylinder(a, 30, 4, 'ovenInside', sinkX, bc, bottom + 2, null, 32);
  return { bottom: bottom - wall, rimTop: top + rim, drain: bc };
}
/* the sink's granite: a speckled map drawn once */
function granite(D) {
  const V = D.V, m = D.material('granite');
  if (m.map) return;
  const t = V.canvasTexture(256, 256, (g, w, ch) => {
    g.fillStyle = '#2a2b2d'; g.fillRect(0, 0, w, ch);
    for (let i = 0; i < 5200; i++) {
      const k = V.hash01(i, 3), s = 0.6 + V.hash01(i, 4) * 1.4;
      g.fillStyle = k > 0.78 ? `rgba(190,190,186,${0.2 + V.hash01(i, 5) * 0.3})` : k > 0.35 ? 'rgba(90,90,92,.6)' : 'rgba(10,10,11,.7)';
      g.fillRect(V.hash01(i, 1) * w, V.hash01(i, 2) * ch, s, s);
    }
  });
  t.repeat.set(1 / 250, 1 / 250);
  m.map = t;
}
/* a kitchen tap on the worktop with its soap dispenser. place: {r, x (the sink's axis), y, top (the rim's top)} */
function tap(D, { r, x: sinkX, y: tapY, top: t }) {
  const { cylinder, at } = D, a = at(r, 'sink');
  cylinder(a, 18, 3, 'steelPolished', sinkX + 250, tapY, t + 1.5, null, 24);           // dispenser plate
  cylinder(a, 28, 8, 'handle', sinkX, tapY, t + 4, null, 32);                  // tap
  cylinder(a, 20, 172, 'handle', sinkX, tapY, t + 94, null, 32);
  cylinder(a, 21, 6, 'handle', sinkX, tapY, t + 183, null, 32);
  cylinder(a, 11, 220, 'handle', sinkX, tapY + 110, t + 166, 'y', 20);
  cylinder(a, 13, 26, 'handle', sinkX, tapY + 214, t + 152, null, 20);
  cylinder(a, 7, 70, 'handle', sinkX + 55, tapY, t + 140, 'x', 16);
}
/* a space-saving trap: a short drop, a flat body against the back, the outlet into the wall. place: {r, x, from (the bottom
   of the bowl), drain (y of the drain), top (of the body), outlet (h of the wall outlet), back (y of the carcass back)} */
function trap(D, { r, x: sinkX, from: fromH, drain: bc, top: topH, outlet: outletH, back: carcassBack }) {
  const { box, cylinder, at, STATIC } = D, p = at(r, 'trap'), yb = carcassBack + 31, P = { name: 'Trap', part: D.part() };
  cylinder(p, 20, fromH - topH, 'pipe', sinkX, bc, (fromH + topH) / 2, null, 20);
  cylinder(p, 20, bc - yb, 'pipe', sinkX, (bc + yb) / 2, topH, 'y', 20);
  box(STATIC, r, [sinkX - 70, sinkX + 70, carcassBack + 6, carcassBack + 56, outletH - 25, topH + 25], 'pipe', 'trap', P);
  cylinder(p, 20, 70, 'pipe', sinkX + 105, yb - 25, outletH, 'y', 20);
  box(STATIC, r, [sinkX + 70, sinkX + 125, carcassBack + 6, carcassBack + 36, outletH - 20, outletH + 20], 'pipe', 'trap', P);
}

/* ---------- an induction hob in its cut-out. place: {r, x (the axis), cut {x0, x1, y0, y1}, top (the worktop's top)} ---------- */
function hob(D, H, { r, x: hobX, cut: hobCut, top: h }) {
  const { box, detail, at, envelope, STATIC } = D, gy = (hobCut.y0 + hobCut.y1) / 2 - H.glass.depth / 2, I = { name: H.name };
  box(STATIC, r, [hobX - H.glass.width / 2, hobX + H.glass.width / 2, gy, gy + H.glass.depth, h, h + 5], 'glassBlack', 'hob', I);
  box(STATIC, r, [hobCut.x0, hobCut.x1, hobCut.y0, hobCut.y1, h - H.body.height, h], 'applianceBody', 'hob', I);
  envelope(r, [hobCut.x0, hobCut.x1, hobCut.y0, hobCut.y1, h - H.body.height, h], 'Hob – body ' + (hobCut.x1 - hobCut.x0) + ' × ' + (hobCut.y1 - hobCut.y0) + ' × ' + H.body.height);
  const a = at(r, 'hob');
  for (const [dx, y, radius] of [[-150, gy + 140, 100], [150, gy + 140, 85], [-150, gy + 370, 85], [150, gy + 370, 110]]) {
    detail(a, new THREE.RingGeometry(radius - 3, radius, 64), 'ringGrey', hobX + dx, y, h + 5.5, false).rotation.x = -Math.PI / 2;   // cooking zones
  }
  detail(a, new THREE.PlaneGeometry(220, 30), 'ringGrey', hobX, gy + 490, h + 5.5, false).rotation.x = -Math.PI / 2;   // the slider
}

/* ---------- a chimney hood on the wall. place: {r, x (the axis), bottom (h of its underside), ceiling (h), worktop (h of
   the worktop's top, where its lights point)} ---------- */
function hood(D, A, { r, x: xc, bottom, ceiling: CEILING, worktop }) {
  const { box, detail, at, profile, lamp, point, STATIC } = D, { width: w, height: bh, depth: d } = A.body, { width: cw, depth: cd } = A.chimney;
  const I = { name: A.name, layer: 'hood' }, a = at(r, 'hood'), { X } = D.frame(r);
  const prof = [[0, bottom], [d, bottom], [d, bottom + 40], [110, bottom + bh], [0, bottom + bh]];   // (y, h): an angled glass front
  const sides = normal => (Math.abs(normal[0] * X[0] + normal[1] * X[1]) > 0.5 ? 'blackMetal' : 'glassBlack');
  if (!profile(STATIC, r, xc - w / 2, xc + w / 2, prof, I, sides)) {   // a group across x: the same body as a plain mesh
    const shape = new THREE.Shape(prof.map(([y, h]) => new THREE.Vector2(y, h - bottom)));
    const body = detail(a, new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false }), 'blackMetal', xc + w / 2, 0, bottom);
    body.geometry.rotateY(-Math.PI / 2); body.material = [D.material('blackMetal'), D.material('glassBlack')];
  }
  box(STATIC, r, [xc - w / 2 + 20, xc + w / 2 - 20, 20, d - 20, bottom - 1, bottom], 'ovenInside', 'hood', I);   // the filter
  box(STATIC, r, [xc - cw / 2, xc + cw / 2, 0, cd, bottom + bh, CEILING], 'blackMetal', 'hood', I);              // the chimney
  const angle = Math.atan2(bh - 40, d - 110), panel = detail(a, new THREE.PlaneGeometry(200, 12), 'led', xc,
    d - (d - 110) * 0.18 + Math.sin(angle) * 1.2, bottom + 40 + (bh - 40) * 0.18 + Math.cos(angle) * 1.2, false);
  panel.rotation.x = -(Math.PI / 2 - angle);
  for (const x of [xc - 150, xc + 150]) {
    detail(a, new THREE.PlaneGeometry(160, 12), 'led', x, d - 90, bottom - 1.5, false).rotation.x = Math.PI / 2;
    lamp(new THREE.SpotLight(0xfff0dc, 4.5, 0, 1.05, 0.8, 2), point(r, x, d - 90, bottom - 5), point(r, x, d - 170, worktop), false);
  }
}

/* ---------- a built-in fridge-freezer where model.js fits it: the body, its doors at the carcass front. place: {r, fit,
   front (y of the carcass front), back (y of the carcass back)} ---------- */
const doorPlane = (A, carcassFront) => carcassFront - A.doorDepth;
function fridgeFreezer(D, A, { r, fit, front: carcassFront, back: carcassBack }) {
  const { box, envelope, openFront, STATIC } = D, I = { name: A.name }, fridgeDoorPlane = doorPlane(A, carcassFront);
  const { bodyX0: x0, bodyX1: x1, bodyH0: h0, bodyH1: h1 } = fit, f = (gb, key) => box(STATIC, r, gb, key, 'fridge', I);
  envelope(r, [x0, x1, carcassFront - A.body.depth, fridgeDoorPlane, h0, h1], A.name + ' – body ' + A.body.width + ' × ' + A.body.height + ' (without the doors)');
  openFront(STATIC, r, [x0, x1, carcassFront - A.body.depth, fridgeDoorPlane, h0, h1], 24, 'fridgeWhite', 'fridge', I);
  const split = h0 + (A.doors.freezer.top + A.doors.fridge.bottom) / 2, top = h1 - 24, lo = split + 14;
  f([x0 + 24, x1 - 24, carcassBack + 42, fridgeDoorPlane, split - 14, split + 14], 'fridgeWhite');
  for (const k of [0.34, 0.56, 0.78]) { const lift = lo + (top - lo) * k; f([x0 + 26, x1 - 26, carcassBack + 44, carcassFront - 124, lift, lift + 5], 'glassShelf'); }
  f([x0 + 40, x1 - 40, carcassBack + 60, carcassFront - 134, lo + 8, lo + 190], 'frost');
  const f0 = h0 + 24, f1 = split - 14, dh = (f1 - f0) / 3;
  for (let j = 0; j < 3; j++) f([x0 + 34, x1 - 34, carcassBack + 50, carcassFront - 84, f0 + j * dh + 8, f0 + (j + 1) * dh - 8], 'frost');
  f([x0 + 140, x1 - 140, carcassBack + 226, carcassBack + 316, top - 5, top], 'led');
}
/* one door of it, moving with the cabinet front it carries. place: {r, m (the front's moving part), freezer, fit, front,
   shelves: [u0, u1] of the door shelves} */
function fridgeDoor(D, A, { r, m, freezer, fit, front: carcassFront, shelves: [s0, s1] }) {
  const { box, envelope } = D, I = { mover: m }, fridgeDoorPlane = doorPlane(A, carcassFront), Dr = freezer ? A.doors.freezer : A.doors.fridge;
  const bx0 = fit.bodyX0, bx1 = fit.bodyX1, d0 = fit.bodyH0 + Dr.bottom, d1 = fit.bodyH0 + Dr.top;
  envelope(r, [bx0, bx1, fridgeDoorPlane, carcassFront, d0, d1], A.name + ' – ' + (freezer ? 'freezer' : 'fridge') + ' door ' + (Dr.top - Dr.bottom));
  box(m.cells, r, [bx0, bx1, fridgeDoorPlane, carcassFront - 2, d0, d1], 'fridgeWhite', 'fridge', I);
  if (!freezer) for (const k of [0.25, 0.5, 0.75]) { const lift = d0 + (d1 - d0) * k; box(m.cells, r, [s0, s1, fridgeDoorPlane - 54, fridgeDoorPlane, lift, lift + 80], 'frost', 'fridge', I); }
}

/* ---------- a built-in dishwasher: the tub and racks stand, its door moves with the front it carries. place: {r, m, item
   (item.fit: model.js), front, back} ---------- */
function dishwasher(D, A, { r, m, item, front: carcassFront, back: carcassBack }) {
  const { box, envelope, openFront, openTop, STATIC } = D, I = { mover: m }, W = { name: A.name };
  const xc = (item.x0 + item.x1) / 2, { bodyX0: w0, bodyX1: w1, bodyH1: bodyTop, doorH0: db, doorH1: dt } = item.fit;
  const t0 = db, t1 = bodyTop - 6;
  openFront(STATIC, r, [w0 + 3, w1 - 3, carcassBack + 8, carcassFront - 24, t0, t1], 2, 'steelPolished', 'dishwasher', W);   // the tub
  for (const [lo, hi] of [[t0 + 80, t0 + 220], [t1 - 380, t1 - 250]]) openTop(STATIC, r, [w0 + 29, w1 - 29, carcassBack + 40, carcassFront - 50, lo, hi], 3, 'wire', 'dishwasher', W);   // racks
  box(STATIC, r, [xc - 200, xc + 200, (carcassBack + carcassFront) / 2 - 25, (carcassBack + carcassFront) / 2 + 25, t0 + 63, t0 + 71], 'steelPolished', 'dishwasher', W);   // spray arm
  box(m.cells, r, [w0, w1, carcassFront - 22, carcassFront, db, bodyTop - 6], 'steelPolished', 'dishwasher', I);      // the appliance door
  box(m.cells, r, [w0, w1, carcassFront - 22, carcassFront, bodyTop - 6, bodyTop], 'glassBlack', 'dishwasher', I);  // its control strip
  envelope(r, [w0, w1, carcassFront - A.body.depth, carcassFront, db, bodyTop], A.name + ' – ' + A.body.width + ' × ' + Math.round(bodyTop) + ' × ' + A.body.depth + ', door ' + Math.round(dt - db));
  envelope(r, [w0, w1, carcassFront - A.body.depth, carcassFront - A.baseSetback, 0, db], A.name + ' – base, ' + A.baseSetback + ' behind the front');
}

/* ---------- a coffee machine standing on a shelf, moving with it. place: {r, m, x (its middle), h (the shelf's top), y (its front)} ---------- */
function coffeeMachine(D, A, { r, m, x: xc, h: h, y: y1 }) {
  const { box, cylinder, display, at, envelope } = D;
  const { width: w, height: bh, depth: d } = A.body, x0 = xc - w / 2, x1 = xc + w / 2, y0 = y1 - d, top = h + bh, head = top - 115, fp = y1 - 45;
  const I = { mover: m, name: A.name }, c = (gb, key) => box(m.cells, r, gb, key, 'coffee', I), a = at(r, 'coffee', m);
  envelope(r, [x0, x1, y0, y1, h, top], A.name + ' ' + w + ' × ' + bh + ' × ' + d);
  c([x0, x1, y0, fp, h, top], 'blackMetal');                                        // body
  c([x0, x0 + 28, fp, y1, h, head], 'steelPolished'); c([x1 - 28, x1, fp, y1, h, head], 'steelPolished');   // front side columns
  c([x0, x1, fp, y1, head, top], 'steelPolished');                                          // head with the controls
  c([x0 + 18, x1 - 18, y1, y1 + 2, head + 28, top - 14], 'glassBlack');
  display(a, 'ESPRESSO', 110, 30, xc, y1 + 2.5, top - 40);
  for (let i = 0; i < 4; i++) cylinder(a, 6, 3, 'steelPolished', x0 + 50 + i * (w - 100) / 3, y1 + 3, head + 40, 'y', 16);
  c([x0 + 28, x1 - 28, fp, fp + 3, h + 32, head], 'ovenInside');                    // brew recess
  c([xc - 32, xc + 32, fp, y1 - 8, head - 34, head], 'steelPolished');                      // spout unit
  for (const dx of [-12, 12]) cylinder(a, 5, 16, 'steelPolished', xc + dx, y1 - 24, head - 42, null, 12);
  c([x0 + 6, x1 - 6, fp - 60, y1 + 6, h, h + 30], 'steelPolished');                         // drip tray
  c([x0 + 22, x1 - 22, fp - 40, y1 - 4, h + 30, h + 32], 'zinc');
  cylinder(a, 32, 62, 'fridgeWhite', xc, y1 - 26, h + 63, null, 28);                     // a cup
  c([xc - 70, xc + 70, y0 + 30, y0 + 190, top, top + 6], 'blackMetal');             // bean container lid
  cylinder(a, 5, 150, 'steelPolished', x1 + 10, y1 - 40, head - 60, null, 12);              // steam wand
  cylinder(a, 8, 20, 'blackMetal', x1 + 10, y1 - 40, head + 20, null, 16);
}

/* ---------- lamps, lit at night ---------- */
/* a pendant: cable, a dome shade in the fronts' colour, a ring, a bulb. place: {a (where details go), r, x, y, bottom (h of
   the shade's rim), ceiling} */
function pendant(D, { a, r, x, y, bottom: h, ceiling: CEILING }) {
  const { cylinder, detail, lamp, point } = D;
  cylinder(a, 2, CEILING - h - 90, 'gasket', x, y, (CEILING + h + 90) / 2, null, 6);   // cable
  detail(a, new THREE.SphereGeometry(150, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), 'shade', x, y, h + 60);
  const inside = detail(a, new THREE.SphereGeometry(148, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), 'shadeInside', x, y, h + 60, false);
  inside.material = D.material('shadeInside').clone(); inside.material.side = THREE.BackSide;
  detail(a, new THREE.TorusGeometry(150, 4, 8, 48), 'handle', x, y, h + 60).rotation.x = Math.PI / 2;
  cylinder(a, 14, 40, 'gasket', x, y, h + 180, null, 16);
  detail(a, new THREE.SphereGeometry(32, 20, 12), 'bulb', x, y, h + 135, false);
  lamp(new THREE.PointLight(0xffd9a8, 1.2, 0.9, 2), point(r, x, y, h + 135), null, false);
  lamp(new THREE.SpotLight(0xffd9a8, 7, 5, 1.2, 0.8, 2), point(r, x, y, h + 135), point(r, x, y, 0), true);
}
/* a downlight in the ceiling. place: {a, r, x, y, ceiling} */
function downlight(D, { a, r, x, y, ceiling: CEILING }) {
  const { detail, lamp, point } = D;
  const tube = detail(a, new THREE.CylinderGeometry(35, 35, 100, 40, 1, true), 'tube', x, y, CEILING - 50);
  tube.material = D.material('tube').clone(); tube.material.side = THREE.DoubleSide;
  detail(a, new THREE.CircleGeometry(27, 32), 'bulb', x, y, CEILING - 85, false).rotation.x = Math.PI / 2;
  lamp(new THREE.SpotLight(0xfff0dc, 11, 0, 1.0, 1, 2), point(r, x, y, CEILING - 90), point(r, x, y, 0), true);
}

/* by a product's field draw */
HOME.draw = {
  oven: (D, A, place) => builtIn(D, 'oven', A, place),
  microwave: (D, A, place) => builtIn(D, 'microwave', A, place),
  sink, tap, trap, hob, hood, fridgeFreezer, fridgeDoor, dishwasher, coffeeMachine, pendant, downlight
};
})();
