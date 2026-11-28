// @ts-check
// test/library/shapes.js: library/shapes.js: every product with a drawing, its parts sound; then the shapes as the scene and
// documents use them: an oven, a microwave, a basin tap, a shower screen, a WC bowl; then the API by use cases, as a room asks
// for it (a product checked, a door hung, a drawer of a system, runners, a pull-out shelf, a sink with its tap and trap, a basin,
// boards and tiles, a fixture), every exported function in one.

import { openCatalog } from '../../library/catalog.js';
import * as API from '../../library/shapes.js';
import { bodyOf, boardOf, cutoutOf, drainOf, faultsOf, formatsOf, fitOf, hingeHeights, hingePost, holeOf, holesOf, innerOver, lookOf, pullOutFit, runnerFit, runnerFor, shapeOf, systemDrawer, systemFor, tileOf, trapFit, travelOf } from '../../library/shapes.js';

/** @typedef {import('../../types.js').Shape} Shape */
/** @typedef {import('../../types.js').Part} Part */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  const catalog = await openCatalog();
  const drawn = catalog.groups.flatMap(g => catalog.products(g)).filter(k => catalog.product(k).draw);
  /** @param {string} key */
  const of = key => shapeOf(catalog.product(key), undefined, catalog.product(key).draw === 'hood' ? { worktop: 650 } : {});
  /** @param {() => unknown} f */
  const throws = f => { try { f(); return false; } catch (e) { return true; } };

  /* ---------- every product with a drawing ---------- */
  {
    /** @type {Record<string, Shape>} */
    const shapes = Object.fromEntries(drawn.map(k => [k, of(k)]));
    check('shapeOf: every product with a drawing (' + drawn.length + ')', drawn.length > 0 && drawn.every(k => shapes[k].parts.length > 0));
    const materials = new Set(catalog.materials());
    /** @type {string[]} */
    const unknown = [];
    for (const k of drawn) for (const p of shapes[k].parts) if (p.material !== 'metal' && !materials.has(p.material)) unknown.push(k + ': ' + p.material);
    check('materials: of materials.json, or metal' + (unknown.length ? ': not ' + [...new Set(unknown)].join(', ') : ''), unknown.length === 0);
    const ROOM = ['freezer', 'fridge', 'door'];   // the room's: carried by the cabinet fronts (a fridge's doors), a hinge's cup with the door it hangs
    check('movers: a part moves with a mover of its shape, or the room\'s', drawn.every(k => shapes[k].parts.every(p => !p.mover
      || shapes[k].movers.some(m => m.id === p.mover) || ROOM.includes(p.mover))));
    check('boxes: x0 < x1, y0 < y1, h0 < h1', drawn.every(k => shapes[k].parts.every(p => p.form !== 'box'
      || (p.box && p.box[0] < p.box[1] && p.box[2] < p.box[3] && p.box[4] < p.box[5]))));
    const sizes = (/** @type {Shape} */ s) => s.size.length === 3 && s.size.every(v => v > 0);
    check('size: three, above 0', drawn.every(k => sizes(shapes[k])));
    check('meshes: every corner a point', drawn.every(k => shapes[k].parts.every(p => p.form !== 'mesh'
      || (p.positions && p.index && p.positions.length % 3 === 0 && p.index.every(i => i < /** @type {number[]} */ (p.positions).length / 3) && p.matrix?.length === 12))));
    check('the same product, the same shape', drawn.every(k => JSON.stringify(of(k)) === JSON.stringify(shapes[k])));
    check('a product with no drawing throws', throws(() => shapeOf(catalog.product('egger-u708-st9-18'))));
    check('a hood without its worktop throws', throws(() => shapeOf(catalog.product('electrolux-lfv416k'))));
  }

  /* ---------- as the scene and documents use them ---------- */
  {
    /* an oven: the maker's sizes, its door on its bottom edge */
    const oven = of('bosch-hba534bb3');
    check('oven: 594 × 548 × 595, the fascia before the body', oven.size.join() === '594,548,595');
    check('oven: documents give the body and the fascia', oven.envelopes.map(e => e.name).join(' | ') === 'Piekarnik Bosch Serie 4 – body 558 × 570 × 528.5 | Piekarnik Bosch Serie 4 – fascia 594 × 595');
    check('oven: the door turns down about its bottom edge (the front at y −548)', JSON.stringify(oven.movers) === JSON.stringify([{ id: 'door', pivot: [0, -548, 0], axis: [1, 0, 0], sign: 1, travel: 90 }]));
    check('oven: the leaf, its glass and its handle move with the door', oven.parts.filter(p => p.mover === 'door').length === 10);
    const feet = shapeOf(catalog.product('bosch-hba534bb3'), undefined, { feet: 20 });
    check('oven: on feet, four of them, the rest 20 up', feet.parts.length === oven.parts.length + 4 && feet.size[2] === 615);

    /* a microwave: hinged on its left, the fascia 13 below the body */
    const micro = of('bosch-bfl623mb3');
    check('microwave: the door turns about its left edge, upright, clockwise seen from above', micro.movers[0].axis.join() === '0,0,1' && micro.movers[0].sign === -1 && micro.movers[0].pivot[0] === (595 - 442) / 2 + 2);
    check('microwave: the fascia from 0, the body 13 up', micro.envelopes[1].box[4] === 0 && micro.envelopes[0].box[4] === 13);

    /* Finish: a basin tap all in the fittings' metal */
    const tap = of('hansgrohe-tecturis-e-110-73010140');
    check('Finish: the basin tap in the fittings\' metal', tap.parts.length === 4 && tap.parts.every(p => p.material === 'metal'));

    /* a shower screen opening in */
    const screen = shapeOf(catalog.product('shower-screen-1000-door-600'), undefined, { opens: 'in', angle: 80 });
    check('shower screen: the door 600 opens in, 80°', screen.movers[0].sign === 1 && screen.movers[0].travel === 80 && screen.movers[0].pivot[0] === 595);
    /* the model's axes: zero at the back, x from the left, the front at negative y */
    check('axes: the oven\'s parts behind its back, none; before it, at negative y', oven.parts.every(p => p.form !== 'box' || /** @type {number[]} */ (p.box)[3] <= 0) && oven.parts.some(p => p.form === 'box' && /** @type {number[]} */ (p.box)[2] < -500));

    /* a WC bowl: lofted, in the product's ceramic */
    const bowl = of('wc-bowl-wall-hung-360x530');
    check('WC bowl: three lofts in ceramic, two fittings in metal', bowl.parts.filter(p => p.form === 'mesh' && p.material === 'ceramicWhite').length === 3
      && bowl.parts.filter(p => p.material === 'metal').length === 2);

    /* a pipe fitted to its node: as long as the node */
    const pipe = shapeOf(catalog.product('pvc-pipe-90'), [2400, 110, 110]);
    check('pipe: as long as its node', pipe.parts[0].length === 2400 && /** @type {number[]} */ (pipe.parts[0].at)[0] === 1200);
  }

  /* ================= THE API BY USE CASES: what a room asks of the library, in the order it asks ================= */
  const P = (/** @type {string} */ k) => /** @type {any} */ (catalog.product(k));
  /** where a product's zero goes when its anchor is put at a point (as room/cabinets.js places it) @param {any} S @param {number[]} at */
  const zeroAt = (S, at) => at.map((v, k) => v - (S.anchor || [0, 0, 0])[k]);
  /** @type {Set<string>} the API's functions a use case calls */
  const used = new Set();
  /** @template {(...a: any[]) => any} F @param {string} name @param {F} f @returns {F} */
  const api = (name, f) => /** @type {F} */ ((...a) => { used.add(name); return f(...a); });
  const $ = {
    shapeOf: api('shapeOf', shapeOf), faultsOf: api('faultsOf', faultsOf), hingeHeights: api('hingeHeights', hingeHeights), hingePost: api('hingePost', hingePost), travelOf: api('travelOf', travelOf),
    systemFor: api('systemFor', systemFor), systemDrawer: api('systemDrawer', systemDrawer), innerOver: api('innerOver', innerOver), runnerFor: api('runnerFor', runnerFor),
    runnerFit: api('runnerFit', runnerFit), pullOutFit: api('pullOutFit', pullOutFit), boardOf: api('boardOf', boardOf), cutoutOf: api('cutoutOf', cutoutOf),
    drainOf: api('drainOf', drainOf), holeOf: api('holeOf', holeOf), trapFit: api('trapFit', trapFit), lookOf: api('lookOf', lookOf), tileOf: api('tileOf', tileOf),
    formatsOf: api('formatsOf', formatsOf), bodyOf: api('bodyOf', bodyOf), holesOf: api('holesOf', holesOf), fitOf: api('fitOf', fitOf)
  };

  /* --- use case: a product is chosen for a role; the room checks it has what its drawing needs --- */
  {
    const all = catalog.groups.flatMap(g => catalog.products(g)), faulty = all.filter(k => P(k).draw && $.faultsOf(P(k)).length).map(k => k + ': ' + $.faultsOf(P(k)).join(', '));
    check('a chosen product: every one with a drawing has what it needs' + (faulty.length ? ': not ' + faulty.join(' | ') : ''), faulty.length === 0);
    check('a chosen product: a hinge without its plate says what it lacks', $.faultsOf({ ...P('blum-clip-top-blumotion-110-71b3550'), plate: undefined }).includes('plate.height'));
  }

  /* --- use case: hanging a door 1197 high (hinged left, its edge 3 in from the side, its back 2 before the carcass) by a shelf at 600 --- */
  {
    const hinge = P('blum-clip-top-blumotion-110-71b3550');
    const heights = $.hingeHeights(hinge, 0, 1197, [600], 18);
    check('a door: where its hinges go: three by its height, 100 from its ends; the middle one over the shelf, its plate clear', JSON.stringify(heights) === '[100,631,1097]');
    check('a door over the last row of the hinge: none, the room warns', $.hingeHeights({ ...hinge, perDoor: [{ maxHeight: 900, count: 2 }] }, 0, 1197, [], 18) === null);
    const S = $.shapeOf(hinge, undefined, { hand: 'left', gap: 2, edge: 3 }), cup = S.parts.find(p => p.form === 'cylinder' && /** @type {number[]} */ (p.radius)[0] === 17);
    check('each hinge placed by its anchor (the side\'s face, the carcass\'s front, its height): its cup 22 in from the door\'s edge, 25 from the side', /** @type {number[]} */ (cup?.at)[0] - /** @type {number[]} */ (S.anchor)[0] === 25);
    check('on the right hand, mirrored', /** @type {number[]} */ ($.shapeOf(hinge, undefined, { hand: 'right', gap: 2, edge: 3 }).parts.find(p => p.form === 'cylinder' && /** @type {number[]} */ (p.radius)[0] === 17)?.at)[0] - /** @type {number[]} */ ($.shapeOf(hinge, undefined, { hand: 'right', gap: 2, edge: 3 }).anchor)[0] === -25);
    check('its holes come with it (layer holes): two for the plate, one for the cup', S.parts.filter(p => p.layer === 'holes').length === 3);
    check('a door short of the carcass\'s side: a post as deep as the hinge needs (80)', $.hingePost(hinge) === 80);
  }

  /* --- use case: a drawer of a system in a carcass 564 wide inside, 550 deep: its front 400 high; an inner drawer over it --- */
  {
    const D = P('blum-tandembox-antaro-d-500'), M = P('blum-tandembox-antaro-m-500'), inner = P('blum-tandembox-antaro-m-500-inner');
    const W = $.systemFor(D, M, 400, 350);
    check('a drawer: its system by its front (400 over 350: D; 350: M)', W === D && $.systemFor(D, M, 350, 350) === M);
    const { lift, boards } = $.systemDrawer(W, true, 564, 16);
    check('its bottom 35 over the carcass\'s bottom; its boards to cut: the bottom 564 − 75 by 476, the back 564 − 87 by 199', lift === 35 && boards[0].join() === '37.5,526.5,38,514,0,16' && boards[1].join() === '43.5,520.5,38,54,16,215');
    check('over another drawer, 22', $.systemDrawer(W, false, 564, 16).lift === 22);
    const metal = $.shapeOf(W, undefined, { width: 564, depth: 550 });
    check('its metal placed by its anchor (the inner left side, the back, the bottom): runners, sides, gallery rails, the runners\' holes', metal.parts.some(p => p.material === 'zinc' && /** @type {number[]} */ (p.box)[0] === /** @type {number[]} */ (metal.anchor)[0]) && metal.parts.some(p => p.material === 'drawerSide') && metal.parts.filter(p => p.layer === 'holes').length === 6);
    check('an inner drawer: its bottom over the outer\'s sides and the maker\'s gap (224 + 40)', $.innerOver(W, inner) === 264);
  }

  /* --- use case: drawers on ball runners: the room has 499 behind the front; the family 300 – 600 --- */
  {
    const family = catalog.variants('hafele-ball-runners-494-02-184').map(P);
    const R = $.runnerFor(family, 499);
    check('the longest runner of the family that fits: 450; none under 300', R?.length === 450 && $.runnerFor(family, 299) === undefined);
    const fit = $.runnerFit(R);
    check('the drawer\'s box on it: as long as the runner, the runner\'s gap each side (13)', fit.length === 450 && fit.gap === 13);
    check('the runners placed by their anchor (the box\'s left, its back, their bottom), beside a box 500 wide', $.shapeOf(R, undefined, { width: 500 }).size[0] === 526);
  }

  /* --- use case: a coffee machine's pull-out shelf --- */
  {
    const fit = $.pullOutFit(P('blum-movento-760h5000s'));
    check('a pull-out shelf: as long as its runners (500), their gap each side (5)', fit.length === 500 && fit.gap === 5);
  }

  /* --- use case: a sink in the worktop (top at 870, its middle 320 from the wall), the tap behind it, the trap under it --- */
  {
    const sink = P('ikea-kilsviken'), tap = P('deante-silia-bqs-z73m'), trap = P('deante-space-saver-zxy-9917');
    check('the worktop\'s cut-out: the sink maker\'s, 680 × 420', JSON.stringify($.cutoutOf(sink)) === '{"width":680,"depth":420}');
    const S = $.shapeOf(sink);
    check('the sink placed by its anchor, its middle on the worktop: its rim on the top', zeroAt(S, [0, 320, 870])[2] === 870 - (sink.bowl.height + sink.wall));
    const T = $.shapeOf(tap);
    check('the tap by its anchor, its axis on the worktop: its zero 39 behind (272 − 233)', zeroAt(T, [0, 45, 870])[1] === 6);
    const drain = $.drainOf(sink), fit = $.trapFit(trap, 320);
    check('the drain: the bowl\'s bottom under the sink\'s anchor (180)', drain[2] === -180);
    check('the trap: as short as its maker allows (250), its outlet at the wall: reach 234, no pipe', JSON.stringify(fit) === '{"drop":250,"reach":234,"toWall":0}');
    check('beyond its reach a pipe to the wall (drain 400 from it: 34); too near the wall: none', $.trapFit(trap, 400)?.toWall === 34 && $.trapFit(trap, 250) === null);
    check('the trap placed by its anchor, the drain\'s axis at its rim', $.shapeOf(trap, undefined, /** @type {any} */ (fit)).anchor?.join() === '57,320,250');
  }

  /* --- use case: a basin on a vanity's top and its tap over its hole --- */
  {
    const basin = P('catalano-green-lux-60x40-white'), hole = $.holeOf(basin, 'tap');
    check('the tap\'s hole, from the basin\'s anchor (its middle at its back, on the top): 55 in, on its rim (140)', hole?.join() === '0,55,140');
    check('no such hole: none', $.holeOf(basin, 'overflow') === undefined);
  }

  /* --- use case: boards and tiles: what the cabinets cut, what the view draws --- */
  {
    check('a board as cut: its thickness, its depth (a sheet\'s width), a shaker\'s frame', $.boardOf(P('egger-u708-st9-18')).thickness === 18 && $.boardOf(P('egger-u708-st9-18')).depth > 0 && $.boardOf(P('shaker-english-navy-18')).frameWidth > 0);
    check('a board\'s look: a decor\'s photo, a lacquer\'s colour', $.lookOf(P('egger-h1180-st37')).finish === 'decor' && $.lookOf(P('shaker-english-navy-18')).finish === 'lacquer');
    const tile = P('paradyz-authority-grey');
    check('a tile as laid: the scene\'s size, one of its formats (598 × 1198: 1198 long); else its own', $.tileOf(tile, [598, 1198])?.len === 1198 && $.tileOf(tile)?.wid === 898);
    check('a size it is not made in, or no tile: none; its formats to say so', $.tileOf(tile, [600, 600]) === null && $.tileOf(P('shelf-pins-5-zinc')) === null && $.formatsOf(tile).length === 5);
    check('a tile\'s look: its face\'s photo', $.lookOf(tile).finish === 'tile' && !!$.lookOf(tile).texture);
  }

  /* --- use case: a fixture the room builds to its own size --- */
  check('a fixture\'s body, the room\'s own sizes over the maker\'s', $.bodyOf(P('catalano-green-lux-60x40-white')).join() === '600,400,140' && $.bodyOf(P('catalano-green-lux-60x40-white'), { depth: 450 }).join() === '600,450,140');

  /* --- use case: how far a fitting opens, as its maker gives it: the room moves its front or its drawer by it --- */
  check('travelOf: a hinge its angle (Blum CLIP top 110°), a drawer system its length (TANDEMBOX antaro 500: out all the way), runners theirs', $.travelOf(catalog.product('blum-clip-top-blumotion-110-71b3550')) === 110
    && $.travelOf(catalog.product('blum-tandembox-antaro-d-500')) === 500 && $.travelOf(catalog.product('hafele-ball-runners-494-02-183')) === 400);
  /* --- use case: how an appliance sits where the room places it (the documents give it), from its anchor's height --- */
  {
    const micro = $.fitOf(catalog.product('bosch-bfl623mb3'), { feet: 4 }), dish = $.fitOf(catalog.product('bosch-smv4hvx00e'), { feet: 55 });
    check('a microwave on feet 4: its body 4 … 342, its fascia 13 below the body (−9 … 373)', !!micro && micro.bodyH0 === 4 && micro.bodyH1 === 342 && micro.fasciaH0 === -9 && micro.fasciaH1 === 373);
    check('a dishwasher: its body 815 from its feet, its door the top 719 of it; a fridge its body; a sink no fit',
      !!dish && dish.bodyH1 === 815 && dish.doorH0 === 96 && dish.feet === 55 && $.fitOf(catalog.product('bosch-kis86afe0'))?.bodyH1 === 1772 && $.fitOf(catalog.product('ikea-kilsviken')) === null);
  }
  /* --- use case: the holes a fitting needs drilled, placed as the room places it (from its anchor, the design's axes) --- */
  {
    const hinge = $.holesOf(catalog.product('blum-clip-top-blumotion-110-71b3550'), { hand: 'left', gap: 2, edge: 1 });
    const plate = hinge.filter(o => o.kind === 'plate'), cup = hinge.find(o => o.kind === 'cup');
    check('a hinge on the left: 2 plate holes Ø2.5 × 10 in the side (into it: −x), 37 behind the carcass\'s front, 32 apart; the cup Ø35 × 13 in the door, 2 + 1 + 22 from the side, with the door',
      plate.length === 2 && plate.every(o => o.diameter === 2.5 && o.depth === 10 && o.at[0] === 0 && o.at[1] === -37 && o.axis[0] === -1) && Math.abs(plate[0].at[2] - plate[1].at[2]) === 32
      && !!cup && cup.diameter === 35 && cup.depth === 13 && cup.at[0] === 23 && cup.at[1] === 2 && cup.axis[1] === 1 && cup.mover === 'door');
    const right = $.holesOf(catalog.product('blum-clip-top-blumotion-110-71b3550'), { hand: 'right', gap: 2, edge: 1 });
    check('… on the right: mirrored (the plate into +x, the cup at −23)', right.filter(o => o.kind === 'plate').every(o => o.axis[0] === 1) && right.some(o => o.kind === 'cup' && o.at[0] === -23));
    const runners = $.holesOf(catalog.product('hafele-ball-runners-494-02-183'), { width: 500 });
    check('ball runners 400 under a box 500 wide: the holes within the runner (37, 229 from its front; 421 not), each side 13 out, 23 over the box\'s bottom',
      runners.length === 4 && runners.every(o => o.at[2] === 23 && (o.at[0] === -13 || o.at[0] === 513)) && runners.filter(o => o.at[0] === -13).map(o => o.at[1]).sort((a, b) => a - b).join() === '171,363');
    const pin = $.holesOf(catalog.product('shelf-pins-5-zinc'), { hand: 'right' });
    check('a shelf pin on the right side: its hole Ø5 × 10, 3 under the shelf, into +x', pin.length === 1 && pin[0].diameter === 5 && pin[0].depth === 10 && pin[0].at[2] === -3 && pin[0].axis[0] === 1);
    check('a fitting with no holes: none', $.holesOf(catalog.product('hafele-axilo-h150'), { height: 150 }).length === 0);
  }
  check('a hinge: its cup and its hole\'s marker in the door turn with it (the door\'s mover), its plate and arm stand', of('blum-clip-top-blumotion-110-71b3550').parts.filter(p => p.mover === 'door').length === 3
    && of('blum-clip-top-blumotion-110-71b3550').parts.some(p => !p.mover && p.form === 'box'));

  /* every function of the API in a use case: the module's exports, each */
  const missing = Object.keys(API).filter(k => !used.has(k));
  check('the API: every function in a use case' + (missing.length ? ': not ' + missing.join(', ') : ''), missing.length === 0);
}
