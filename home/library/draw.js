// @ts-check
/* library/draw.js: how a product of the library is drawn, whatever room it stands in. A product names its drawing (its field
   draw); the room places it and hands over a drawing context D (DrawContext, made by room/room.js) and the place: the frame
   of its group (x along the group, y out from the carcass backs, h up from the floor, mm) and the anchors the drawing starts
   from. The sizes are the maker's (the product); the shapes the maker does not give (a knob, a tap's spout, a lamp's shade)
   are drawn here. A mesh of a detail keeps three.js's own axes: x along, y up, z out of the wall. Needs THREE when it draws,
   nothing when it loads. */
/** @typedef {{ r: string, frame: any, layers: string[], mover?: DrawMover | null, pivot?: boolean }} Anchor  where details go: group r, its layers, the moving part they move with */
/** @typedef {Cell & { element: string, cap?: string, part: any, r: string, gb?: Box, hb?: Box, info: Object<string, any> }} DrawCell  a solid of a room: in group r, its box gb there, hb in the house */
/**
 * @typedef {object} DrawMover  a moving part as drawn: its cells and details, made a part of core when all is drawn
 * @property {string} r
 * @property {string} kind  door, drawer, fridge, dishwasher, oven, microwave
 * @property {Vec3} P  a point of its axis, in the house
 * @property {any} holder  its details' three.js group
 * @property {DrawCell[]} cells
 * @property {number} sign
 * @property {string} label
 * @property {DrawMover | null} parent  what must open first
 * @property {DrawMover[]} children
 * @property {any} item
 * @property {number | null} travel
 * @property {string | null} swing
 * @property {any} [core]  the part of core, once made
 */
/** @typedef {Object<string, any>} DrawPlace  a drawing's place: its group r and the anchors it starts from (each drawing names its own) */
/**
 * @typedef {object} DrawContext  what a room hands a drawing (room/room.js)
 * @property {SceneView} V
 * @property {(list: DrawCell[], r: string, gb: Box, key: string, layer: string, info?: Object<string, any>) => DrawCell | null} box  a solid of group r, gb [x0, x1, y0, y1, h0, h1]
 * @property {(r: string, layer: string, mover?: DrawMover | null, also?: string[]) => Anchor} at
 * @property {(a: Anchor, geometry: any, key: any, x: number, y: number, h: number, shadow?: boolean) => any} detail  a mesh at (x, y, h) of a's frame
 * @property {(a: Anchor, radius: number, length: number, key: any, x: number, y: number, h: number, axis: string | null, segments?: number, shadow?: boolean) => any} cylinder  upright, or along x or y
 * @property {(a: Anchor, text: string, w: number, high: number, x: number, y: number, h: number) => any} display
 * @property {(r: string, kind: string, x: number, y: number, h: number) => DrawMover} mover
 * @property {(parent: DrawMover, child: DrawMover) => void} linkTo
 * @property {(r: string, gb: Box, name: string, kind?: string) => number} envelope  an appliance's outline (for Test)
 * @property {(list: DrawCell[], r: string, gb: Box, t: number, key: string, layer: string, info?: Object<string, any>) => void} openFront  a box open at the front, walls t thick
 * @property {(list: DrawCell[], r: string, gb: Box, t: number, key: string, layer: string, info?: Object<string, any>) => void} openTop  a box open at the top
 * @property {(list: DrawCell[], r: string, x0: number, x1: number, prof: number[][], info: Object<string, any>, faceMaterial: (n: Vec3) => string) => DrawCell | null} profile  a prism over a profile [[y, h]]
 * @property {() => number} part  a new part: its solids meet without a line
 * @property {(light: any, from: Vec3, to: Vec3 | null, shadow: boolean) => void} lamp
 * @property {(r: string, x: number, y: number, h: number) => Vec3} point  of group r, in the house
 * @property {(a: Anchor, x: number, y: number, h: number, angle: number) => Anchor} pivot  a frame at (x, y, h) turned about h: its details from its own zero
 * @property {(r: string) => { O: number[], X: number[], Y: number[], box: Box }} frame  group r's axes in the house
 * @property {(key: string) => any} material
 * @property {(key: string) => boolean} has  a look in the page's library
 * @property {string} metal  the room's metal
 * @property {DrawCell[]} STATIC  the solids that stand still
 * @property {number} CEILING
 */
function drawModule() {
'use strict';

/* ---------- an oven or a microwave built into a carcass: the body on its feet behind the carcass front, the fascia in
   front of it; the appliance door turns on its hinge edge. place: {r, item (item.fit: model.js), front (y of the carcass
   front)}. d = how far a detail stands out of the appliance face: y = 2·face − d. ---------- */
/** @param {DrawContext} D @param {string} type @param {AnyProduct} A @param {DrawPlace} place */
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
/** @param {DrawContext} D */
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
/** @param {DrawContext} D */
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
/** @param {DrawContext} D */
function tap(D, { r, x: sinkX, y: tapY, top: t }) {
  const { cylinder, at } = D, a = at(r, 'sink');
  cylinder(a, 18, 3, 'steelPolished', sinkX + 250, tapY, t + 1.5, null, 24);           // dispenser plate
  cylinder(a, 28, 8, D.metal, sinkX, tapY, t + 4, null, 32);                  // tap
  cylinder(a, 20, 172, D.metal, sinkX, tapY, t + 94, null, 32);
  cylinder(a, 21, 6, D.metal, sinkX, tapY, t + 183, null, 32);
  cylinder(a, 11, 220, D.metal, sinkX, tapY + 110, t + 166, 'y', 20);
  cylinder(a, 13, 26, D.metal, sinkX, tapY + 214, t + 152, null, 20);
  cylinder(a, 7, 70, D.metal, sinkX + 55, tapY, t + 140, 'x', 16);
}
/* a space-saving trap: a short drop, a flat body against the back, the outlet into the wall. place: {r, x, from (the bottom
   of the bowl), drain (y of the drain), top (of the body), outlet (h of the wall outlet), back (y of the carcass back), wall (y of
   the wall: the outlet ends there)} */
/** @param {DrawContext} D */
function trap(D, { r, x: sinkX, from: fromH, drain: bc, top: topH, outlet: outletH, back: carcassBack, wall }) {
  const { box, cylinder, at, STATIC } = D, p = at(r, 'trap'), yb = carcassBack + 31, P = { name: 'Trap', part: D.part() };
  cylinder(p, 20, fromH - topH, 'pipe', sinkX, bc, (fromH + topH) / 2, null, 20);
  cylinder(p, 20, bc - yb, 'pipe', sinkX, (bc + yb) / 2, topH, 'y', 20);
  box(STATIC, r, [sinkX - 70, sinkX + 70, carcassBack + 6, carcassBack + 56, outletH - 25, topH + 25], 'pipe', 'trap', P);
  cylinder(p, 20, yb + 10 - wall, 'pipe', sinkX + 105, (wall + yb + 10) / 2, outletH, 'y', 20);   // the outlet, to the wall
  box(STATIC, r, [sinkX + 70, sinkX + 125, carcassBack + 6, carcassBack + 36, outletH - 20, outletH + 20], 'pipe', 'trap', P);
}

/* ---------- an induction hob in its cut-out. place: {r, x (the axis), cut {x0, x1, y0, y1}, top (the worktop's top)} ---------- */
/** @param {DrawContext} D */
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
/** @param {DrawContext} D */
function hood(D, A, { r, x: xc, bottom: lowest, ceiling: CEILING, worktop }) {
  const bottom = lowest + 2;                // the body: its filter and its lights under it, down to the hood's lowest point
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
/** @param {DrawContext} D */
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
/** @param {DrawContext} D */
function fridgeDoor(D, A, { r, m, freezer, fit, front: carcassFront, shelves: [s0, s1] }) {
  const { box, envelope } = D, I = { mover: m }, fridgeDoorPlane = doorPlane(A, carcassFront), Dr = freezer ? A.doors.freezer : A.doors.fridge;
  const bx0 = fit.bodyX0, bx1 = fit.bodyX1, d0 = fit.bodyH0 + Dr.bottom, d1 = fit.bodyH0 + Dr.top;
  envelope(r, [bx0, bx1, fridgeDoorPlane, carcassFront, d0, d1], A.name + ' – ' + (freezer ? 'freezer' : 'fridge') + ' door ' + (Dr.top - Dr.bottom));
  box(m.cells, r, [bx0, bx1, fridgeDoorPlane, carcassFront - 2, d0, d1], 'fridgeWhite', 'fridge', I);
  if (!freezer) for (const k of [0.25, 0.5, 0.75]) { const lift = d0 + (d1 - d0) * k; box(m.cells, r, [s0, s1, fridgeDoorPlane - 54, fridgeDoorPlane, lift, lift + 80], 'frost', 'fridge', I); }
}

/* ---------- a built-in dishwasher: the tub and racks stand, its door moves with the front it carries. place: {r, m, item
   (item.fit: model.js), front, back} ---------- */
/** @param {DrawContext} D */
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
/** @param {DrawContext} D */
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
/** @param {DrawContext} D */
function pendant(D, { a, r, x, y, bottom: h, ceiling: CEILING }) {
  const { cylinder, detail, lamp, point } = D;
  cylinder(a, 2, CEILING - h - 90, 'gasket', x, y, (CEILING + h + 90) / 2, null, 6);   // cable
  detail(a, new THREE.SphereGeometry(150, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), 'shade', x, y, h + 60);
  const inside = detail(a, new THREE.SphereGeometry(148, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), 'shadeInside', x, y, h + 60, false);
  inside.material = D.material('shadeInside').clone(); inside.material.side = THREE.BackSide;
  detail(a, new THREE.TorusGeometry(150, 4, 8, 48), D.metal, x, y, h + 60).rotation.x = Math.PI / 2;
  cylinder(a, 14, 40, 'gasket', x, y, h + 180, null, 16);
  detail(a, new THREE.SphereGeometry(32, 20, 12), 'bulb', x, y, h + 135, false);
  lamp(new THREE.PointLight(0xffd9a8, 1.2, 0.9, 2), point(r, x, y, h + 135), null, false);
  lamp(new THREE.SpotLight(0xffd9a8, 7, 5, 1.2, 0.8, 2), point(r, x, y, h + 135), point(r, x, y, 0), true);
}
/* a downlight in the ceiling. place: {a, r, x, y, ceiling} */
/** @param {DrawContext} D */
function downlight(D, { a, r, x, y, ceiling: CEILING }) {
  const { detail, lamp, point } = D;
  const tube = detail(a, new THREE.CylinderGeometry(35, 35, 100, 40, 1, true), 'tube', x, y, CEILING - 50);
  tube.material = D.material('tube').clone(); tube.material.side = THREE.DoubleSide;
  detail(a, new THREE.CircleGeometry(27, 32), 'bulb', x, y, CEILING - 85, false).rotation.x = Math.PI / 2;
  lamp(new THREE.SpotLight(0xfff0dc, 11, 0, 1.0, 1, 2), point(r, x, y, CEILING - 90), point(r, x, y, 0), true);
}

/* ================= hardware: each piece in its own coordinates, from the zero of its node (its left, back, bottom
   corner); size: its node's [x, y, h]; r its group, m the mover it goes with ================= */

/* an adjustable leg: the post and its foot, centred in its node, as tall as the node. leg: {radius, footRadius, footHeight} */
/** @param {DrawContext} D */
function leg(D, L, { r, size, name }) {
  const { cylinder, at, envelope } = D, a = at(r, 'legs'), x = size[0] / 2, y = size[1] / 2, h = size[2], f = L.footRadius;
  cylinder(a, L.radius, h - L.footHeight, 'foot', x, y, (h - L.footHeight) / 2, null, 16);
  cylinder(a, f, L.footHeight, 'foot', x, y, h - L.footHeight / 2, null, 20);
  envelope(r, [x - f, x + f, y - f, y + f, h - L.footHeight, h], name, 'leg');
}
/* an aluminium grille in the plinth: a frame 5 wide round louvres every 12 */
/** @param {DrawContext} D */
function grille(D, { r, size: [w, d, h] }) {
  const I = { name: 'Ventilation grille in the plinth', part: D.part() }, z = gb => D.box(D.STATIC, r, gb, 'zinc', 'plinth', I);
  z([0, w, 0, d, 0, 5]); z([0, w, 0, d, h - 5, h]); z([0, 5, 0, d, 5, h - 5]); z([w - 5, w, 0, d, 5, h - 5]);
  for (let x = 17; x < w - 8; x += 12) z([x - 2, x + 2, 0, d - 1, 5, h - 5]);
}
/* a shelf pin: its node */
/** @param {DrawContext} D */
function shelfPin(D, { r, size, name }) { D.box(D.STATIC, r, [0, size[0], 0, size[1], 0, size[2]], 'zinc', 'shelves', { name }); }
/* a door's bumper: a soft head filling the gap between the carcass and the door */
/** @param {DrawContext} D */
function bumper(D, { r, size }) { D.cylinder(D.at(r, 'hardware'), size[0] / 2, size[1], 'gasket', size[0] / 2, size[1] / 2, size[2] / 2, 'y', 16); }
/* a hinge: its mounting plate and arm on the carcass, its cup in the door (moving with it). place: {r, m, dir (1: the
   door hinged on its left), side (x of the hinge edge), cupX, h (the hinge's axis), carcassFront, doorBack (y), cupRadius} */
/** @param {DrawContext} D */
function hinge(D, HG, { r, m, dir, side, cupX, h, carcassFront, doorBack, cupRadius }) {
  const { box, cylinder, at, STATIC } = D, I = { name: 'Hinge', part: D.part() }, span = (a, b) => [Math.min(a, b), Math.max(a, b)];
  box(STATIC, r, [...span(side, side + dir * 10), carcassFront - 75, carcassFront - 30, h - 22, h + 22], 'zinc', 'hardware', I);   // mounting plate
  box(STATIC, r, [...span(side + dir * 3, side + dir * 20), carcassFront - 70, carcassFront - 2, h - 9, h + 9], 'zinc', 'hardware', I);   // arm
  const a = at(r, 'hardware', m);
  cylinder(a, cupRadius, HG.cupDepth, 'zinc', cupX, doorBack + HG.cupDepth / 2, h, 'y', 24);   // the cup in the door
  cylinder(a, 24, 1.5, 'zinc', cupX, carcassFront - 1, h, 'y', 24);
}
/* a handle, both kinds: a cup (an open quarter shell with its end caps, a lip and two pads) and a bar on two posts; the
   handle setting shows one (layers cup / bar). Lying along x, or upright on a door's side (turn left or right). y 0: the
   front's face. handle: {cupLength, barLength} */
const CUPS = {};
function cupShape(length) {
  if (CUPS[length]) return CUPS[length];
  const L = length, R = 24, drop = -12, parts = [];
  const shell = new THREE.CylinderGeometry(R, R, L - 6, 28, 1, true, 0, Math.PI / 2); shell.rotateZ(Math.PI / 2); shell.translate(0, drop, 0); parts.push(shell);
  for (const sx of [-1, 1]) { const c = new THREE.CircleGeometry(R, 20, 0, Math.PI / 2); c.rotateY(-Math.PI / 2); c.translate(sx * (L / 2 - 3), drop, 0); parts.push(c); }
  const lip = new THREE.CylinderGeometry(2.2, 2.2, L - 6, 10); lip.rotateZ(Math.PI / 2); lip.translate(0, drop, R); parts.push(lip);
  for (const sx of [-1, 1]) { const pad = new THREE.BoxGeometry(12, 26, 4); pad.translate(sx * 32, drop + 13, 2); parts.push(pad); }
  return (CUPS[length] = parts);
}
/** @param {DrawContext} D */
function handle(D, H, { r, m, size, turn, info }) {
  const { box, detail, at } = D, L = H.barLength, x = size[0] / 2, h = size[2] / 2, y = 4;
  const cup = D.pivot(at(r, 'handles', m, ['cup']), x, 0, h, turn === 'left' ? Math.PI / 2 : turn === 'right' ? -Math.PI / 2 : 0);
  for (const g of cupShape(H.cupLength)) detail(cup, g, D.metal, 0, 0, 0);
  const I = Object.assign({ also: ['bar'], part: D.part() }, info), bar = gb => box(m.cells, r, gb, D.metal, 'handles', I);
  if (!turn) {
    bar([x - L / 2, x + L / 2, y + 20, y + 30, h - 6, h + 6]); bar([x - L / 2 + 8, x - L / 2 + 18, y, y + 20, h - 5, h + 5]); bar([x + L / 2 - 18, x + L / 2 - 8, y, y + 20, h - 5, h + 5]);
  } else {
    bar([x - 6, x + 6, y + 20, y + 30, h - L / 2, h + L / 2]); bar([x - 5, x + 5, y, y + 20, h - L / 2 + 8, h - L / 2 + 18]); bar([x - 5, x + 5, y, y + 20, h + L / 2 - 18, h + L / 2 - 8]);
  }
}
/* a runner: its fixed part on the carcass, its moving part with m. kind: 'drawer' (a drawer's, the fixed rail width wide on
   the carcass side), 'ball' (a ball runner by a drawer behind a door), 'pullOut' (under a pull-out shelf); side: the
   carcass's side it stands by, 'left' or 'right' */
/** @param {DrawContext} D */
function runner(D, { r, m, size: [w, d, h], kind, side, width }) {
  const { box, STATIC } = D, left = side === 'left', fixed = gb => box(STATIC, r, gb, 'zinc', 'hardware', { name: NAMES[kind] }), moving = gb => box(m.cells, r, gb, 'zinc', 'hardware', { mover: m });
  if (kind === 'drawer') {
    fixed([...(left ? [0, width] : [w - width, w]), 0, d, 0, h - 2]);
    moving([...(left ? [width, w] : [0, w - width]), 8, d - 4, 4, h]);
  } else if (kind === 'ball') {
    fixed([...(left ? [0, w / 2] : [w / 2, w]), 0, d, 0, h]);
    moving([...(left ? [w / 2, w] : [0, w / 2]), 4, d - 2, 4, h - 4]);
  } else {
    fixed([0, w, 0, d, 0, 14]);
    moving([0, w, 8, d - 4, 14, h]);
  }
}
const NAMES = { drawer: 'Drawer runner', ball: 'Ball runner', pullOut: 'Pull-out shelf runner' };
/* a metal part of a drawer system filling its node: a side, a gallery rail, an inner drawer's front */
/** @param {DrawContext} D */
function drawerPart(D, { r, m, size, info }) { D.box(m.cells, r, [0, size[0], 0, size[1], 0, size[2]], 'drawerSide', 'drawers', info); }
/* waste bins side by side, 10 apart, each open at the top with a handle at its front. bins: {count} */
/** @param {DrawContext} D */
function bins(D, B, { r, m, size: [w, d, h], info }) {
  const bw = (w - 10 * (B.count - 1)) / B.count;
  for (let j = 0; j < B.count; j++) {
    const a = j * (bw + 10), b = a + bw;
    D.openTop(m.cells, r, [a, b, 0, d - 4, 0, h], 4, 'binGrey', 'drawers', info);
    D.box(m.cells, r, [a + bw * 0.3, b - bw * 0.3, d - 14, d, h - 14, h - 4], 'binGrey', 'drawers', info);
  }
}
/* a cutlery insert: four dividers on a base; inset: the dividers' share starts this far in from each end */
/** @param {DrawContext} D */
function cutleryInsert(D, { r, m, size: [w, d, h], inset, info }) {
  for (let j = 1; j < 5; j++) { const x = inset + (w - 2 * inset) * j / 5; D.box(m.cells, r, [x - 3, x + 3, 0, d, 0, h], 'insertGrey', 'drawers', info); }
  D.box(m.cells, r, [0, w, 0, d, 0, 4], 'insertGrey', 'drawers', info);
}

/* by a product's field draw */
/* ---------- a basin standing on the top: its walls, its bottom, a shelf at the back for the tap (the maker's sizes:
   body, wall, shelf). place: {r, x, y (its centre), top (of the top it stands on)} ---------- */
/** @param {DrawContext} D */
function basin(D, A, { r, x, y, top }) {
  const { box, envelope, STATIC } = D, I = { name: A.name, part: D.part() }, { width: w, depth: d, height: h } = A.body, t = A.wall, key = A.material;
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, s1 = y0 + A.shelf, g = gb => box(STATIC, r, gb, key, 'basin', I);
  g([x0, x1, y0, s1, top, top + h]);                          // the shelf at the back, the tap's
  g([x0, x1, y1 - t, y1, top, top + h]);                      // the front wall
  g([x0, x0 + t, s1, y1 - t, top, top + h]); g([x1 - t, x1, s1, y1 - t, top, top + h]);   // the side walls
  g([x0 + t, x1 - t, s1, y1 - t, top, top + t]);              // the bottom
  envelope(r, [x0, x1, y0, y1, top, top + h], A.name + ' ' + w + ' × ' + d + ' × ' + h);
  D.cylinder(D.at(r, 'basin'), 21, 3, key, x, (s1 + y1) / 2, top + t + 1.5, null, 32);   // the plug, in the basin's colour
}
/* a basin tap on the basin's shelf: its body, the spout over the bowl, the lever. place: {r, x, y (the tap's axis), top (the shelf)} */
/** @param {DrawContext} D */
function basinTap(D, A, { r, x, y, top }) {
  const { cylinder, at } = D, a = at(r, 'basin'), m = D.metal;
  cylinder(a, 25, 6, m, x, y, top + 3, null, 32);
  cylinder(a, 18, A.height - 30, m, x, y, top + (A.height - 30) / 2, null, 32);
  cylinder(a, 9, A.spout, m, x, y + A.spout / 2, top + A.height - 40, 'y', 20);
  cylinder(a, 6, 70, m, x, y - 30, top + A.height - 10, 'y', 16);   // the lever, toward the back
}

/* ---------- the fixtures of a room (a bathroom's): each in its own frame, x along its wall (0 … w), y out of it (0 … d), h up
   from the floor (from h0, its offset); place: {r, a (where its details go), w, d, h, h0, f (the scene's fixture)} ---------- */
const fixtureInfo = (/** @type {DrawContext} */ D, /** @type {AnyProduct} */ A) => ({ name: A.name, part: D.part() });
/* a mirror with its light: the glass on a frame of light */
/** @param {DrawContext} D */
function mirror(D, A, { r, w, d, h, h0 }) {
  D.box(D.STATIC, r, [0, w, 0, d - 8, h0, h0 + h], 'led', 'sanitary', fixtureInfo(D, A));
  D.box(D.STATIC, r, [15, w - 15, d - 8, d, h0 + 15, h0 + h - 15], 'mirror', 'sanitary', fixtureInfo(D, A));
}
/* a wall cabinet: its carcass, open at the front, and its door */
/** @param {DrawContext} D */
function wallCabinet(D, A, { r, w, d, h, h0 }) {
  D.openFront(D.STATIC, r, [0, w, 0, d - 18, h0, h0 + h], 16, A.material, 'sanitary', fixtureInfo(D, A));
  D.box(D.STATIC, r, [1, w - 1, d - 18, d, h0 + 1, h0 + h - 1], A.material, 'sanitary', fixtureInfo(D, A));
}
/* a walk-in screen across the shower: a fixed pane at the wall's end (x = w − fixed … w) and a door on it, turning about its
   inner edge; the profiles in the fittings' metal */
/** @param {DrawContext} D */
function showerScreen(D, A, { r, w, d, h, h0, f }) {
  const metal = D.metal, I = fixtureInfo(D, A), t = 8, y0 = d / 2 - t / 2, y1 = d / 2 + t / 2, fx = w - A.fixed;
  D.box(D.STATIC, r, [fx, w, y0, y1, h0, h0 + h], 'glass', 'sanitary', I);
  D.box(D.STATIC, r, [w - 12, w, 0, d, h0, h0 + h], metal, 'sanitary', fixtureInfo(D, A));      // the wall profile
  D.box(D.STATIC, r, [fx, w, 0, d, h0, h0 + 12], metal, 'sanitary', fixtureInfo(D, A));       // the bottom profile
  const m = D.mover(r, 'door', fx - 5, d / 2, 0);
  Object.assign(m, { sign: f.opens === 'in' ? -1 : 1, label: A.name + ' – door ' + (fx - 10), travel: f.angle || 90 });   // degrees
  const J = { name: A.name + ' – door', part: D.part() };
  D.box(m.cells, r, [5, fx - 5, y0, y1, h0 + 5, h0 + h], 'glass', 'sanitary', J);
  D.box(m.cells, r, [20, 40, y0 - 6, y1 + 6, h0 + 840, h0 + 1260], metal, 'sanitary', { name: A.name + ' – handle', part: D.part() });
}
/* a linear drain at the far wall of the shower: its frame and its grate (tiled over) */
/** @param {DrawContext} D */
function linearDrain(D, A, { r, w, d, h, h0 }) {
  D.box(D.STATIC, r, [0, w, 0, d, h0, h0 + h], 'steelPolished', 'sanitary', fixtureInfo(D, A));
}
/* a product drawn by its shape (library: its parts in its own axes, u along it, v out of the wall, h up from its bottom):
   boxes are solids; cylinders, tubes and lofts are details. A part's m: a material, or metal (the fittings' finish),
   ceramic (the product's); its l: the layer (sanitary, or installations: what the casing hides) */
const SEG = 72;   // the points of a loft's section
const superellipse = (t, n) => { const c = Math.cos(t), s = Math.sin(t); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / n), Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; };
/* a solid lofted through superellipse sections {y, a, b, n, nb, cx, cz}, capped at both ends (a WC bowl) */
function loft(sections) {
  const ring = s => Array.from({ length: SEG }, (_, j) => {
    const t = j / SEG * Math.PI * 2, n = Math.sin(t) < 0 ? (s.nb || s.n || 2.5) : (s.n || 2.5), [cx, cz] = superellipse(t, n);
    return [s.a * cx + (s.cx || 0), s.y, s.b * cz + (s.cz || 0)];
  });
  const positions = [], index = [], rings = sections.map(ring);
  rings.forEach(r => r.forEach(p => positions.push(...p)));
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < SEG; j++) {
    const a = i * SEG + j, b = i * SEG + (j + 1) % SEG, c = (i + 1) * SEG + j, d = (i + 1) * SEG + (j + 1) % SEG;
    index.push(a, c, b, b, c, d);
  }
  const cap = (r, s, up) => {
    const base = positions.length / 3;
    r.forEach(p => positions.push(...p)); positions.push(s.cx || 0, s.y, s.cz || 0);
    for (let j = 0; j < SEG; j++) { const a = base + j, b = base + (j + 1) % SEG; up ? index.push(base + SEG, b, a) : index.push(base + SEG, a, b); }
  };
  cap(rings[0], sections[0], false); cap(rings[rings.length - 1], sections[sections.length - 1], true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(index); g.computeVertexNormals();
  return g;
}
/** @param {DrawContext} D */
function shaped(D, A, { r, w, d, h, h0, f }) {
  const metal = D.metal, key = m => m === 'metal' ? metal : m === 'ceramic' ? A.material || 'ceramicWhite' : m;
  const up = (u, v, z) => new THREE.Vector3(u, h0 + z, v);                 // the frame's three axes: x along, y up, z out of the wall
  /* a door (its parts mv): turning about its hinge at door.at [u, v], door.angle degrees, toward door.sign */
  const door = A.door && Object.assign(D.mover(r, 'door', A.door.at[0], A.door.at[1], 0), { sign: A.door.sign || 1, label: A.name + ' – door', travel: A.door.angle });
  for (const p0 of A.shape) {
    /* fit: a part that runs the fixture's length (u) or height (h), as the scene gives it */
    const p = p0.fit === 'u' ? Object.assign({}, p0, { h: w, at: [w / 2, p0.at[1], p0.at[2]] }) : p0.fit === 'h' ? Object.assign({}, p0, { h, at: [p0.at[0], p0.at[1], h / 2] }) : p0;
    if (p.k === 'box') { D.box(p.mv && door ? door.cells : D.STATIC, r, [p.b[0], p.b[1], p.b[2], p.b[3], h0 + p.b[4], h0 + p.b[5]], key(p.m), p.l, fixtureInfo(D, A)); continue; }
    const a = D.at(r, p.l);
    if (p.k === 'cyl') {
      const m = D.detail(a, new THREE.CylinderGeometry(p.r[0], p.r[1], p.h, p.s), key(p.m), p.at[0], p.at[1], h0 + p.at[2]);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(p.ax[0], p.ax[2], p.ax[1]).normalize());
    } else if (p.k === 'tube') {
      D.detail(a, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.p.map(q => up(...q))), p.s, p.r, 12, false), key(p.m), 0, 0, 0);
    } else if (p.k === 'loft') {
      const m = D.detail(a, loft(p.sec), key(p.m), 0, 0, 0), [U, V, H] = p.M;   // its rows: u, v, h of its own axes and its place
      m.matrixAutoUpdate = false;
      m.matrix.set(...U, ...H.slice(0, 3), H[3] + h0, ...V, 0, 0, 0, 1);
    }
  }
  D.envelope(r, [0, w, 0, d, h0, h0 + h], A.name);
}

return {
  oven: (/** @type {DrawContext} */ D, /** @type {AnyProduct} */ A, /** @type {DrawPlace} */ place) => builtIn(D, 'oven', A, place),
  microwave: (/** @type {DrawContext} */ D, /** @type {AnyProduct} */ A, /** @type {DrawPlace} */ place) => builtIn(D, 'microwave', A, place),
  sink, tap, trap, basin, basinTap, shaped, mirror, wallCabinet, showerScreen, linearDrain, hob, hood, fridgeFreezer, fridgeDoor, dishwasher, coffeeMachine, pendant, downlight,
  leg, grille, shelfPin, bumper, hinge, handle, runner, drawerPart, bins, cutleryInsert
};
}
