// @ts-check
// library/shapes.js: a product as parts (types.js: Shape), by its field draw: the sizes are the maker's; the shapes the maker
// does not give (a knob, a spout, a handle) are described here. Described in the design's axes (zero at its back, its left end
// as one sees its front, bottom; x from the left, y from its back toward its front, h up), given in the model's
// (core/tools.js: y the other way). Draws nothing, knows no three.js, no room, no layers: the scene places the parts and gives them their look.

import { shapeToModel } from '../core/tools.js';

/** @typedef {import('../types.js').Product} Product */
/** @typedef {import('../types.js').Shape} Shape */
/** @typedef {import('../types.js').Part} Part */
/** @typedef {import('../types.js').Vec} Vec */
/** @typedef {import('../types.js').ShapeOptions} ShapeOptions */

const X = [1, 0, 0], Y = [0, 1, 0], H = [0, 0, 1], DOWN = [0, 0, -1];

/** a shape being described: its parts, moving parts, lights, the boxes documents give @param {Vec} size */
function describe(size) {
  /** @type {Shape} */
  const S = { size, parts: [], movers: [], lights: [], envelopes: [] };
  /** @param {Part} p @param {string} [mover] */
  const add = (p, mover) => { S.parts.push(mover ? Object.assign(p, { mover }) : p); };
  return {
    S,
    add,
    /** @param {number[]} box @param {string} material @param {string} [mover] */
    box: (box, material, mover) => add({ form: 'box', box, material }, mover),
    /** an upright cylinder, or along the axis given @param {number} radius @param {number} length @param {string} material @param {Vec} at @param {Vec} [axis] @param {number} [segments] @param {string} [mover] */
    cylinder: (radius, length, material, at, axis = H, segments = 20, mover) => add({ form: 'cylinder', radius: [radius, radius], length, material, at, axis, segments }, mover),
    /** a box open at its front (y1): its sides, bottom, top and back, t thick @param {number[]} b @param {number} t @param {string} material @param {string} [mover] */
    openFront([x0, x1, y0, y1, h0, h1], t, material, mover) {
      for (const b of [[x0, x0 + t, y0, y1, h0, h1], [x1 - t, x1, y0, y1, h0, h1], [x0 + t, x1 - t, y0, y1, h0, h0 + t], [x0 + t, x1 - t, y0, y1, h1 - t, h1], [x0 + t, x1 - t, y0, y0 + t, h0 + t, h1 - t]]) this.box(b, material, mover);
    },
    /** a box open at its top @param {number[]} b @param {number} t @param {string} material @param {string} [mover] */
    openTop([x0, x1, y0, y1, h0, h1], t, material, mover) {
      for (const b of [[x0, x0 + t, y0, y1, h0, h1], [x1 - t, x1, y0, y1, h0, h1], [x0 + t, x1 - t, y0, y0 + t, h0, h1], [x0 + t, x1 - t, y1 - t, y1, h0, h1], [x0 + t, x1 - t, y0 + t, y1 - t, h0, h0 + t]]) this.box(b, material, mover);
    },
    /** a display's text, facing the front @param {string} text @param {number} w @param {number} h @param {Vec} at @param {string} [mover] */
    text: (text, w, h, at, mover) => add({ form: 'text', text, size: [w, h], at, axis: Y, material: 'glassBlack' }, mover),
    /** @param {number[]} box @param {string} name */
    envelope: (box, name) => { S.envelopes.push({ box, name }); }
  };
}

/* ---------- an oven or a microwave built into a carcass: the body on its feet, the fascia in front of it, the door turning
   on its hinge edge. y: the body 0 … its depth (the carcass front), the fascia in front. d = how far a detail stands out of
   the appliance face: y = 2·face − d. options.feet: the feet under the body ---------- */
/** @param {'oven' | 'microwave'} type @param {any} A @param {ShapeOptions} options */
function builtIn(type, A, { feet = 0 }) {
  const F = A.fascia, { width: bw, height: bh, depth: bd } = A.body, x0 = 0, x1 = F.width, xc = x1 / 2;
  const front = bd, face = front + F.thickness, b0 = feet + Math.max(0, -(feet + F.bottom)), h0 = b0 + F.bottom, h1 = h0 + F.height, floor = b0 - feet;
  const bx0 = xc - bw / 2, bx1 = xc + bw / 2;
  const D = describe([x1, face, Math.max(h1, b0 + bh)]), { box, cylinder, envelope, text } = D;
  if (feet > 0) for (const fx of [bx0 + 30, bx1 - 30]) for (const fy of [30, front - 30]) cylinder(10, feet, 'blackMetal', [fx, fy, floor + feet / 2], H, 16);
  envelope([bx0, bx1, 0, front, b0, b0 + bh], A.name + ' – body ' + bw + ' × ' + bh + ' × ' + bd + (feet > 0 ? ' on feet ' + Math.round(feet * 10) / 10 : ''));
  envelope([x0, x1, front, face, h0, h1], A.name + ' – fascia ' + F.width + ' × ' + F.height);
  /* the door: an oven's below its control panel, full width; a microwave's over the body opening, left of its control column */
  const door = type === 'oven' ? { x0, x1, h0, h1: h1 - A.controlPanelHeight } : { x0: bx0 + 2, x1: x1 - A.controlColumnWidth, h0: b0 + 4, h1: b0 + bh - 4 };
  const hinge = A.door.hinge, bottom = hinge === 'bottom';
  D.S.movers.push({ id: 'door', pivot: bottom ? [0, face, door.h0] : [hinge === 'left' ? door.x0 : door.x1, face, 0], axis: bottom ? X : H, sign: hinge === 'left' ? 1 : -1, travel: 90 });
  const fixedBox = (/** @type {number[]} */ b, /** @type {string} */ m) => box(b, m), doorBox = (/** @type {number[]} */ b, /** @type {string} */ m) => box(b, m, 'door');
  /** @param {(b: number[], m: string) => void} put @param {number} d0 @param {number} d1 @param {number} lo @param {number} hi @param {number} a0 @param {number} a1 @param {string} m */
  const outBox = (put, d0, d1, lo, hi, a0, a1, m) => put([a0, a1, 2 * face - d1, 2 * face - d0, lo, hi], m);
  D.openFront([bx0, bx1, 0, front, b0, b0 + bh], 4, 'applianceBody');
  fixedBox([bx0 + 4, bx1 - 4, 4, 6, b0 + 4, b0 + bh - 4], 'ovenInside');                    // the back of the cavity
  const fascia = (/** @type {number} */ a0, /** @type {number} */ a1, /** @type {number} */ lo, /** @type {number} */ hi) => fixedBox([a0, a1, front, face - 6, lo, hi], 'blackMetal');
  doorBox([door.x0, door.x1, front + 2, face - 6, door.h0, door.h1], 'blackMetal');           // the leaf, 2 off the carcass front
  outBox(doorBox, face - 2, face + 6, door.h0, door.h1, door.x0, door.x1, 'blackMetal');      // its trim
  if (type === 'oven') {
    fascia(x0, x1, door.h1, h1);
    outBox(fixedBox, face - 2, face + 6, door.h1, h1, x0, x1, 'blackMetal');
    const panel = door.h1 + 3, mid = (panel + h1 - 10) / 2;
    outBox(fixedBox, face - 8, face - 2, panel, h1 - 10, x0 + 10, x1 - 10, 'glassBlack');
    for (const a of [x0 + 85, x1 - 85]) {           // knobs
      cylinder(19, 20, 'steelPolished', [a, face + 18, mid], Y, 32);
      cylinder(21, 3, 'steelPolished', [a, face + 9, mid], Y, 32);
    }
    text('12:30', 110, 34, [xc, face + 8.5, mid]);
    for (const lift of [b0 + 150, b0 + 290]) cylinder(3, bw - 40, 'steelPolished', [xc, front - bd / 2, lift], X, 8);   // shelf rails
    const d0 = door.h0 + 10, d1 = door.h1 - 3;
    outBox(doorBox, face - 10, face - 8, d0 + 70, d1 - 80, x0 + 70, x1 - 70, 'smokedGlass');       // the door glass in a black border
    outBox(doorBox, face - 12, face - 8, d1 - 80, d1, x0 + 10, x1 - 10, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0, d0 + 70, x0 + 10, x1 - 10, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, x0 + 10, x0 + 70, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, d0 + 70, d1 - 80, x1 - 70, x1 - 10, 'glassBlack');
    cylinder(10, x1 - x0 - 140, 'steelPolished', [xc, face + 48, d1 - 40], X, 24, 'door');   // bar handle
    for (const a of [x0 + 80, x1 - 80]) cylinder(7, 36, 'steelPolished', [a, face + 28, d1 - 40], Y, 16, 'door');
  } else {
    fascia(x0, door.x0 - 2, h0, h1); fascia(door.x1 + 2, x1, h0, h1); fascia(door.x0 - 2, door.x1 + 2, h0, door.h0 - 2); fascia(door.x0 - 2, door.x1 + 2, door.h1 + 2, h1);
    const panelLeft = door.x1 + 3;
    for (const [a0, a1, lo, hi] of [[x0, door.x0 - 2, h0, h1], [door.x1 + 2, x1, h0, h1], [door.x0 - 2, door.x1 + 2, h0, door.h0 - 2], [door.x0 - 2, door.x1 + 2, door.h1 + 2, h1]]) {
      outBox(fixedBox, face - 4, face + 6, lo, hi, a0, a1, 'blackMetal');
    }
    outBox(fixedBox, face - 10, face - 4, h0 + 10, h1 - 10, panelLeft + 8, x1 - 10, 'glassBlack');
    text('0:45', 90, 28, [(panelLeft + x1) / 2, face + 10.5, h1 - 70]);
    cylinder(14, 4, 'steelPolished', [(panelLeft + x1) / 2, face + 12, h0 + 90], Y, 32);
    const { x0: a0, x1: a1, h0: lo, h1: hi } = door, f = 40;
    outBox(doorBox, face - 10, face - 8, lo + f, hi - f, a0 + f, a1 - f, 'smokedGlass');
    outBox(doorBox, face - 12, face - 8, hi - f, hi, a0, a1, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, lo, lo + f, a0, a1, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, lo + f, hi - f, a0, a0 + f, 'glassBlack');
    outBox(doorBox, face - 12, face - 8, lo + f, hi - f, a1 - f, a1, 'glassBlack');
  }
  return D.S;
}

/* ---------- a sink in its worktop cut-out: rim, bowl, drain. h: the bowl's bottom 0, the worktop's top at the bowl's
   height + its wall, the rim on it ---------- */
/** @param {any} A */
function sink(A) {
  const rim = A.rim, wall = A.wall, top = A.bowl.height + wall, sinkX = A.body.width / 2, sy = A.body.depth / 2;
  const D = describe([A.body.width, A.body.depth, top + rim]), g = (/** @type {number[]} */ b) => D.box(b, 'granite');
  const s0 = 0, s1 = A.body.width, sy0 = 0, sy1 = A.body.depth;
  const b0 = sinkX - A.bowl.width / 2, b1 = sinkX + A.bowl.width / 2, by0 = sy - A.bowl.depth / 2, by1 = sy + A.bowl.depth / 2, bottom = top - A.bowl.height;
  for (const [x0, x1, y0, y1] of [[s0, s1, sy0, by0 - wall], [s0, s1, by1 + wall, sy1], [s0, b0 - wall, by0 - wall, by1 + wall], [b1 + wall, s1, by0 - wall, by1 + wall]]) g([x0, x1, y0, y1, top, top + rim]);   // the rim
  g([b0 - wall, b0, by0 - wall, by1 + wall, bottom, top + rim]); g([b1, b1 + wall, by0 - wall, by1 + wall, bottom, top + rim]);   // the bowl walls
  g([b0, b1, by0 - wall, by0, bottom, top + rim]); g([b0, b1, by1, by1 + wall, bottom, top + rim]);
  g([b0 - wall, b1 + wall, by0 - wall, by1 + wall, bottom - wall, bottom]);   // the bowl bottom
  D.envelope([b0 - wall, b1 + wall, by0 - wall, by1 + wall, bottom - wall, top], 'Sink – bowl ' + (b1 - b0 + 2 * wall) + ' × ' + (by1 - by0 + 2 * wall) + ' × ' + (top - bottom + wall));
  const bc = (by0 + by1) / 2;
  D.cylinder(45, 3, 'steelPolished', [sinkX, bc, bottom + 1.5], H, 32);             // drain
  D.cylinder(30, 4, 'ovenInside', [sinkX, bc, bottom + 2], H, 32);
  return D.S;
}

/* ---------- an induction hob: the glass on the worktop, the body in the cut-out under it. h: the body 0 … its height (the
   worktop's top), the glass on it ---------- */
/** @param {any} A */
function hob(A) {
  const gw = A.glass.width, gd = A.glass.depth, bh = A.body.height, xc = gw / 2, h = bh;
  const D = describe([gw, gd, bh + 5]);
  const body = [xc - A.body.width / 2, xc + A.body.width / 2, gd / 2 - A.body.depth / 2, gd / 2 + A.body.depth / 2, 0, bh];
  D.box([0, gw, 0, gd, h, h + 5], 'glassBlack');
  D.box(body, 'applianceBody');
  D.envelope(body, 'Hob – body ' + A.body.width + ' × ' + A.body.depth + ' × ' + bh);
  for (const [dx, y, radius] of [[-150, 140, 100], [150, 140, 85], [-150, 370, 85], [150, 370, 110]]) {
    D.add({ form: 'ring', radius: [radius - 3, radius], segments: 64, material: 'ringGrey', at: [xc + dx, y, h + 5.5], axis: H });   // cooking zones
  }
  D.add({ form: 'plane', size: [220, 30], material: 'ringGrey', at: [xc, 490, h + 5.5], axis: H });   // the slider
  return D.S;
}

/* ---------- a chimney hood on the wall: y from the wall; h: its lowest point 0, the chimney up to the size's top (the
   ceiling). options.worktop: how far below its lowest point the worktop is, where its lights point ---------- */
/** @param {any} A @param {Vec | undefined} size @param {ShapeOptions} options */
function hood(A, size, { worktop }) {
  if (worktop === undefined) throw new Error('shapes: a hood needs options.worktop');
  const bottom = 2, { width: w, height: bh, depth: d } = A.body, { width: cw, depth: cd } = A.chimney, xc = w / 2;
  const top = Math.max(size ? size[2] : 0, bottom + bh), D = describe([w, d, top]);
  const prof = [[0, bottom], [d, bottom], [d, bottom + 40], [110, bottom + bh], [0, bottom + bh]];   // (y, h): an angled glass front
  D.add({ form: 'extrude', outline: prof, at: [0, 0, 0], axis: X, length: w, material: 'glassBlack', ends: 'blackMetal' });
  D.box([xc - w / 2 + 20, xc + w / 2 - 20, 20, d - 20, bottom - 1, bottom], 'ovenInside');   // the filter
  if (top > bottom + bh) D.box([xc - cw / 2, xc + cw / 2, 0, cd, bottom + bh, top], 'blackMetal');   // the chimney
  const angle = Math.atan2(bh - 40, d - 110);
  D.add({ form: 'plane', size: [200, 12], material: 'led', at: [xc, d - (d - 110) * 0.18 + Math.sin(angle) * 1.2, bottom + 40 + (bh - 40) * 0.18 + Math.cos(angle) * 1.2], axis: [0, Math.sin(angle), Math.cos(angle)] });
  for (const x of [xc - 150, xc + 150]) {
    D.add({ form: 'plane', size: [160, 12], material: 'led', at: [x, d - 90, bottom - 1.5], axis: DOWN });
    D.S.lights.push({ kind: 'spot', color: '#fff0dc', intensity: 4.5, distance: 0, angle: 1.05, penumbra: 0.8, decay: 2, at: [x, d - 90, bottom - 5], target: [x, d - 170, -worktop], shadow: false });
  }
  return D.S;
}

/* ---------- a built-in fridge-freezer: the body, open at its door plane, its doors in front of it. Its doors move with the
   cabinet fronts they carry (movers 'freezer' and 'fridge': the room's) ---------- */
/** @param {any} A */
function fridgeFreezer(A) {
  const { width: w, height: h1, depth: front } = A.body, doorPlane = front - A.doorDepth, x0 = 0, x1 = w, h0 = 0;
  const D = describe([w, front, h1]), f = (/** @type {number[]} */ b, /** @type {string} */ m) => D.box(b, m);
  D.envelope([x0, x1, 0, doorPlane, h0, h1], A.name + ' – body ' + w + ' × ' + h1 + ' (without the doors)');
  D.openFront([x0, x1, 0, doorPlane, h0, h1], 24, 'fridgeWhite');
  const split = h0 + (A.doors.freezer.top + A.doors.fridge.bottom) / 2, top = h1 - 24, lo = split + 14;
  f([x0 + 24, x1 - 24, 42, doorPlane, split - 14, split + 14], 'fridgeWhite');
  for (const k of [0.34, 0.56, 0.78]) { const lift = lo + (top - lo) * k; f([x0 + 26, x1 - 26, 44, front - 124, lift, lift + 5], 'glassShelf'); }
  f([x0 + 40, x1 - 40, 60, front - 134, lo + 8, lo + 190], 'frost');
  const f0 = h0 + 24, f1 = split - 14, dh = (f1 - f0) / 3;
  for (let j = 0; j < 3; j++) f([x0 + 34, x1 - 34, 50, front - 84, f0 + j * dh + 8, f0 + (j + 1) * dh - 8], 'frost');
  f([x0 + 140, x1 - 140, 226, 316, top - 5, top], 'led');
  for (const freezer of [true, false]) {
    const Dr = freezer ? A.doors.freezer : A.doors.fridge, d0 = h0 + Dr.bottom, d1 = h0 + Dr.top, m = freezer ? 'freezer' : 'fridge';
    D.envelope([x0, x1, doorPlane, front, d0, d1], A.name + ' – ' + m + ' door ' + (Dr.top - Dr.bottom));
    D.box([x0, x1, doorPlane, front - 2, d0, d1], 'fridgeWhite', m);
    if (!freezer) for (const k of [0.25, 0.5, 0.75]) { const lift = d0 + (d1 - d0) * k; D.box([x0 + 55, x1 - 55, doorPlane - 54, doorPlane, lift, lift + 80], 'frost', m); }
  }
  return D.S;
}

/* ---------- a built-in dishwasher: the tub and racks stand, its door turns on its bottom edge. h: its base 0 … the door's
   bottom, the body over it ---------- */
/** @param {any} A */
function dishwasher(A) {
  const { width: w, height: bodyTop, depth: front } = A.body, db = bodyTop - A.door.height, xc = w / 2, t0 = db, t1 = bodyTop - 6;
  const D = describe([w, front, bodyTop]);
  D.S.movers.push({ id: 'door', pivot: [0, front, db], axis: X, sign: -1, travel: 90 });
  D.openFront([3, w - 3, 8, front - 24, t0, t1], 2, 'steelPolished');                  // the tub
  for (const [lo, hi] of [[t0 + 80, t0 + 220], [t1 - 380, t1 - 250]]) D.openTop([29, w - 29, 40, front - 50, lo, hi], 3, 'wire');   // racks
  D.box([xc - 200, xc + 200, front / 2 - 25, front / 2 + 25, t0 + 63, t0 + 71], 'steelPolished');   // spray arm
  D.box([0, w, front - 22, front, db, bodyTop - 6], 'steelPolished', 'door');           // the appliance door
  D.box([0, w, front - 22, front, bodyTop - 6, bodyTop], 'glassBlack', 'door');         // its control strip
  D.envelope([0, w, 0, front, db, bodyTop], A.name + ' – ' + w + ' × ' + bodyTop + ' × ' + front + ', door ' + A.door.height);
  D.envelope([0, w, 0, front - A.baseSetback, 0, db], A.name + ' – base, ' + A.baseSetback + ' behind the front');
  return D.S;
}

/* ---------- a coffee machine standing on a shelf ---------- */
/** @param {any} A */
function coffeeMachine(A) {
  const { width: w, height: bh, depth: d } = A.body, x0 = 0, x1 = w, xc = w / 2, y0 = 0, y1 = d, h = 0, top = h + bh, head = top - 115, fp = y1 - 45;
  const D = describe([w, d, bh]), c = (/** @type {number[]} */ b, /** @type {string} */ m) => D.box(b, m), { cylinder } = D;
  D.envelope([x0, x1, y0, y1, h, top], A.name + ' ' + w + ' × ' + bh + ' × ' + d);
  c([x0, x1, y0, fp, h, top], 'blackMetal');                                        // body
  c([x0, x0 + 28, fp, y1, h, head], 'steelPolished'); c([x1 - 28, x1, fp, y1, h, head], 'steelPolished');   // front side columns
  c([x0, x1, fp, y1, head, top], 'steelPolished');                                  // head with the controls
  c([x0 + 18, x1 - 18, y1, y1 + 2, head + 28, top - 14], 'glassBlack');
  D.text('ESPRESSO', 110, 30, [xc, y1 + 2.5, top - 40]);
  for (let i = 0; i < 4; i++) cylinder(6, 3, 'steelPolished', [x0 + 50 + i * (w - 100) / 3, y1 + 3, head + 40], Y, 16);
  c([x0 + 28, x1 - 28, fp, fp + 3, h + 32, head], 'ovenInside');                    // brew recess
  c([xc - 32, xc + 32, fp, y1 - 8, head - 34, head], 'steelPolished');              // spout unit
  for (const dx of [-12, 12]) cylinder(5, 16, 'steelPolished', [xc + dx, y1 - 24, head - 42], H, 12);
  c([x0 + 6, x1 - 6, fp - 60, y1 + 6, h, h + 30], 'steelPolished');                 // drip tray
  c([x0 + 22, x1 - 22, fp - 40, y1 - 4, h + 30, h + 32], 'zinc');
  cylinder(32, 62, 'fridgeWhite', [xc, y1 - 26, h + 63], H, 28);                    // a cup
  c([xc - 70, xc + 70, y0 + 30, y0 + 190, top, top + 6], 'blackMetal');             // bean container lid
  cylinder(5, 150, 'steelPolished', [x1 + 10, y1 - 40, head - 60], H, 12);          // steam wand
  cylinder(8, 20, 'blackMetal', [x1 + 10, y1 - 40, head + 20], H, 16);
  return D.S;
}

/* ---------- a basin standing on a top: its walls, its bottom, a shelf at the back for the tap ---------- */
/** @param {any} A */
function basin(A) {
  const { width: w, depth: d, height: h } = A.body, t = A.wall, key = A.material, s1 = A.shelf;
  const D = describe([w, d, h]), g = (/** @type {number[]} */ b) => D.box(b, key);
  g([0, w, 0, s1, 0, h]);                            // the shelf at the back, the tap's
  g([0, w, d - t, d, 0, h]);                         // the front wall
  g([0, t, s1, d - t, 0, h]); g([w - t, w, s1, d - t, 0, h]);   // the side walls
  g([t, w - t, s1, d - t, 0, t]);                    // the bottom
  D.envelope([0, w, 0, d, 0, h], A.name + ' ' + w + ' × ' + d + ' × ' + h);
  D.cylinder(21, 3, key, [w / 2, (s1 + d) / 2, t + 1.5], H, 32);   // the plug, in the basin's colour
  return D.S;
}

/* ---------- a basin tap: its body, the spout toward the front, the lever toward the back; in the fittings' metal ---------- */
/** @param {any} A */
function basinTap(A) {
  const x = 25, y = 65, D = describe([50, y + A.spout, A.height]), { cylinder } = D;
  cylinder(25, 6, 'metal', [x, y, 3], H, 32);
  cylinder(18, A.height - 30, 'metal', [x, y, (A.height - 30) / 2], H, 32);
  cylinder(9, A.spout, 'metal', [x, y + A.spout / 2, A.height - 40], Y, 20);
  cylinder(6, 70, 'metal', [x, y - 30, A.height - 10], Y, 16);   // the lever
  return D.S;
}

/* ---------- a kitchen tap on the worktop, as its maker draws it: its body on the worktop, the tube leaning forward to its bend,
   the spout over the sink (toward the front), the lever at its side; in the fittings' metal. Its zero: the back of its body,
   on the worktop ---------- */
/** @param {any} A */
function kitchenTap(A) {
  const r = A.base.diameter / 2, rt = A.tube / 2, back = A.length - A.spout.reach, x = r, y = back, top = A.height - rt;
  const D = describe([A.base.diameter + 12, A.length, A.height]), { cylinder } = D;
  cylinder(r, A.base.height, 'metal', [x, y, A.base.height / 2], H, 32);   // the body
  const dy = A.bend, dh = top - A.base.height, l = Math.hypot(dy, dh);
  cylinder(rt, l, 'metal', [x, y + dy / 2, A.base.height + dh / 2], [0, dy / l, dh / l], 24);   // the tube, leaning to its bend
  cylinder(rt, A.spout.reach - dy, 'metal', [x, y + (dy + A.spout.reach) / 2, top], Y, 24);   // the spout
  cylinder(rt * 0.8, top - A.spout.height, 'metal', [x, y + A.spout.reach, (top + A.spout.height) / 2], H, 24);   // its head, down to the outlet
  D.box([2 * r, 2 * r + 12, y - 9, y + A.lever.length - 9, A.lever.height - 18, A.lever.height], 'metal');   // the lever, at the side
  return D.S;
}

/* ---------- a sink's trap, as its maker draws it: the drain in the bowl, the arm back to the trap, the trap's body down to its
   bottom, the outlet toward the wall and the pipe into it. Its zero: the trap's bottom, at the wall (y 0), at its left.
   options.drop: from the drain's rim to the trap's bottom, options.reach: from the drain's axis to the trap's, both within the
   maker's ranges; options.toWall: the pipe from the outlet to the wall ---------- */
/** @param {any} A @param {ShapeOptions} options */
function trap(A, { drop = A.drop[0], reach = A.reach[0], toWall = 0 }) {
  const R = A.drain.diameter / 2, ro = A.outlet.diameter / 2, rs = A.outlet.socket / 2, rb = 30, x = R;
  const yr = toWall + A.outlet.length, yd = yr + reach, arm = drop - 45;
  const D = describe([2 * R, yd + R, drop]), { cylinder } = D;
  cylinder(R, 4, 'pipe', [x, yd, drop - 2], H, 32);   // the drain's rim, in the bowl
  cylinder(35, 60, 'pipe', [x, yd, drop - 34], H, 24);   // its body, under the bowl
  cylinder(ro, reach, 'pipe', [x, (yd + yr) / 2, arm], Y, 16);   // the arm, back to the trap
  cylinder(rb, arm + ro, 'pipe', [x, yr, (arm + ro) / 2], H, 24);   // the trap's body, down to its bottom
  cylinder(ro, A.outlet.length, 'pipe', [x, yr - A.outlet.length / 2, A.outlet.height], Y, 16);   // the outlet
  if (toWall > 0) cylinder(rs, toWall, 'pipe', [x, toWall / 2, A.outlet.height], Y, 16);   // the pipe into the wall
  return D.S;
}

/* ---------- the fixtures of a bathroom: x along the wall, y out of it ---------- */
/* a mirror with its light: the glass on a frame of light */
/** @param {any} A @param {Vec} size */
function mirror(A, [w, d, h]) {
  const D = describe([w, d, h]);
  D.box([0, w, 0, d - 8, 0, h], 'led');
  D.box([15, w - 15, d - 8, d, 15, h - 15], 'mirror');
  return D.S;
}
/* a wall cabinet: its carcass, open at the front, and its door */
/** @param {any} A @param {Vec} size */
function wallCabinet(A, [w, d, h]) {
  const D = describe([w, d, h]);
  D.openFront([0, w, 0, d - 18, 0, h], 16, A.material);
  D.box([1, w - 1, d - 18, d, 1, h - 1], A.material);
  return D.S;
}
/* a walk-in screen across the shower: a fixed pane at the end (x = w − fixed … w) and a door on it, turning about its inner
   edge; the profiles in the fittings' metal. options: opens 'in' or 'out', angle (degrees, 90 if none) */
/** @param {any} A @param {Vec} size @param {ShapeOptions} options */
function showerScreen(A, [w, d, h], { opens, angle }) {
  const D = describe([w, d, h]), t = 8, y0 = d / 2 - t / 2, y1 = d / 2 + t / 2, fx = w - A.fixed;
  D.box([fx, w, y0, y1, 0, h], 'glass');
  D.box([w - 12, w, 0, d, 0, h], 'metal');          // the wall profile
  D.box([fx, w, 0, d, 0, 12], 'metal');             // the bottom profile
  D.S.movers.push({ id: 'door', pivot: [fx - 5, d / 2, 0], axis: H, sign: opens === 'in' ? -1 : 1, travel: angle || 90 });
  D.box([5, fx - 5, y0, y1, 5, h], 'glass', 'door');
  D.box([20, 40, y0 - 6, y1 + 6, 840, 1260], 'metal', 'door');   // the handle
  return D.S;
}
/* a linear drain: its frame and its grate (tiled over) */
/** @param {any} A @param {Vec} size */
function linearDrain(A, [w, d, h]) {
  const D = describe([w, d, h]);
  D.box([0, w, 0, d, 0, h], 'steelPolished');
  return D.S;
}

/* ---------- a product drawn by its shape (its field shape: its parts in its own axes, u along it, v out of the wall, h up from
   its bottom). A part's m: a material, or metal (the fittings'), or ceramic (the product's material); fit: a part that runs
   the size's length (u) or height (h). Its l (a layer) is the tree's business, not read here ---------- */
const SEG = 72;   // the points of a loft's section
/** @param {number} t @param {number} n */
const superellipse = (t, n) => { const c = Math.cos(t), s = Math.sin(t); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / n), Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; };
/* a solid lofted through superellipse sections {y, a, b, n, nb, cx, cz}, capped at both ends (a WC bowl): its points in its
   own axes */
/** @param {any[]} sections @returns {{ positions: number[], index: number[] }} */
function loft(sections) {
  const ring = (/** @type {any} */ s) => Array.from({ length: SEG }, (_, j) => {
    const t = j / SEG * Math.PI * 2, n = Math.sin(t) < 0 ? (s.nb || s.n || 2.5) : (s.n || 2.5), [cx, cz] = superellipse(t, n);
    return [s.a * cx + (s.cx || 0), s.y, s.b * cz + (s.cz || 0)];
  });
  /** @type {number[]} */
  const positions = [], index = [], rings = sections.map(ring);
  rings.forEach(r => r.forEach(p => positions.push(...p)));
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < SEG; j++) {
    const a = i * SEG + j, b = i * SEG + (j + 1) % SEG, c = (i + 1) * SEG + j, d = (i + 1) * SEG + (j + 1) % SEG;
    index.push(a, c, b, b, c, d);
  }
  const cap = (/** @type {number[][]} */ r, /** @type {any} */ s, /** @type {boolean} */ up) => {
    const base = positions.length / 3;
    r.forEach(p => positions.push(...p)); positions.push(s.cx || 0, s.y, s.cz || 0);
    for (let j = 0; j < SEG; j++) { const a = base + j, b = base + (j + 1) % SEG; up ? index.push(base + SEG, b, a) : index.push(base + SEG, a, b); }
  };
  cap(rings[0], sections[0], false); cap(rings[rings.length - 1], sections[sections.length - 1], true);
  return { positions, index };
}
/** @param {any} A @param {Vec} size */
function shaped(A, [w, d, h]) {
  const D = describe([w, d, h]), key = (/** @type {string} */ m) => m === 'ceramic' ? A.material || 'ceramicWhite' : m;
  if (A.door) D.S.movers.push({ id: 'door', pivot: [A.door.at[0], A.door.at[1], 0], axis: H, sign: A.door.sign || 1, travel: A.door.angle });
  for (const p0 of A.shape) {
    const p = p0.fit === 'u' ? Object.assign({}, p0, { h: w, at: [w / 2, p0.at[1], p0.at[2]] }) : p0.fit === 'h' ? Object.assign({}, p0, { h, at: [p0.at[0], p0.at[1], h / 2] }) : p0;
    const mover = p.mv && A.door ? 'door' : undefined;
    if (p.k === 'box') D.box(p.b, key(p.m), mover);
    else if (p.k === 'cyl') D.add({ form: 'cylinder', radius: [p.r[0], p.r[1]], length: p.h, segments: p.s, material: key(p.m), at: p.at, axis: p.ax }, mover);
    else if (p.k === 'tube') D.add({ form: 'tube', points: p.p, radius: [p.r], segments: p.s, material: key(p.m) }, mover);
    else if (p.k === 'loft') D.add({ form: 'mesh', ...loft(p.sec), matrix: p.M.flat(), material: key(p.m) }, mover);
  }
  D.envelope([0, w, 0, d, 0, h], A.name);
  return D.S;
}

/**
 * A product's shape, by its field draw.
 * @param {Product} product
 * @param {Vec} [size]  its node's size, for what fits to it; none: the maker's body
 * @param {ShapeOptions} [options]
 * @returns {Shape}
 */
export function shapeOf(product, size, options = {}) {
  return shapeToModel(described(product, size, options));
}

/** @param {Product} product @param {Vec} [size] @param {ShapeOptions} [options] @returns {Shape} */
function described(product, size, options = {}) {
  const A = /** @type {any} */ (product), body = A.body ? [A.body.width, A.body.depth, A.body.height] : undefined, own = size || body;
  /** @param {string} what */
  const needs = what => { if (!own) throw new Error(`shapes: ${A.name}: ${what} needs a size`); return own; };
  switch (A.draw) {
    case 'oven': case 'microwave': return builtIn(A.draw, A, options);
    case 'sink': return sink(A);
    case 'hob': return hob(A);
    case 'hood': return hood(A, size, options);
    case 'fridgeFreezer': return fridgeFreezer(A);
    case 'dishwasher': return dishwasher(A);
    case 'coffeeMachine': return coffeeMachine(A);
    case 'basin': return basin(A);
    case 'basinTap': return basinTap(A);
    case 'kitchenTap': return kitchenTap(A);
    case 'trap': return trap(A, options);
    case 'mirror': return mirror(A, needs('a mirror'));
    case 'wallCabinet': return wallCabinet(A, needs('a wall cabinet'));
    case 'showerScreen': return showerScreen(A, needs('a shower screen'), options);
    case 'linearDrain': return linearDrain(A, needs('a drain'));
    case 'shaped': return shaped(A, needs('a shape'));
    default: throw new Error(`shapes: ${A.name}: no drawing ${A.draw}`);
  }
}
