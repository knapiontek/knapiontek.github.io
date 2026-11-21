// @ts-check
/* core/drawing.js: what is drawn, described as data: exact solids (cells of core), details (shapes only for the look),
   moving parts, lamps. Whoever draws (a room's cabinets, a product of the library) describes into it in the frame of a
   group: x along the group, y out of its wall, h up from the floor (mm); core/scene.js turns a description into 3D, with
   the same calls in the same order. Knows no project and no three.js. Gets core/geometry.js. */
/**
 * @typedef {object} Shape  a detail's shape in its own axes (three.js's: x along, y up, z out of the wall), mm
 * @property {'box' | 'cylinder' | 'sphere' | 'disc' | 'ring' | 'plane' | 'torus' | 'tube' | 'extrude' | 'mesh' | 'parts'} kind
 * @property {number[]} [size]  box: [x, y, z]; plane: [w, h]
 * @property {number[]} [r]  cylinder: [top, bottom]; ring: [inner, outer]
 * @property {number} [radius]  sphere, disc, torus, tube
 * @property {number} [length]  cylinder
 * @property {number[]} [segments]  as three.js takes them, in its order
 * @property {boolean} [open]  cylinder: no ends
 * @property {number[]} [arc]  cylinder, disc: [start, length]; sphere: [phiStart, phiLength, thetaStart, thetaLength] (radians)
 * @property {number} [tube]  torus: the tube's radius
 * @property {number[][]} [points]  tube: the curve's points
 * @property {number[][]} [outline]  extrude: the profile [[x, y]]
 * @property {number} [depth]  extrude
 * @property {number[]} [positions]  mesh: x, y, z of each point
 * @property {number[]} [index]  mesh: three points a triangle
 * @property {Shape[]} [parts]  parts: shapes merged into one
 * @property {any[][]} [then]  what is done to the shape, in order: ['rotateX' | 'rotateY' | 'rotateZ', angle], ['translate', x, y, z]
 */
/** @typedef {string | string[] | { key: string, side: 'back' | 'double' } | { text: string }} DetailMaterial  a material's key; a list (one a face group); a key seen from inside or both sides; a display's text */
/** @typedef {{ x?: number, y?: number, z?: number }} Turn  angles (radians) about the detail's own axes */
/**
 * @typedef {object} Detail  a shape for the look only: not counted, not in the 2D plan's cut
 * @property {number} n  its place in the order things are described
 * @property {Shape} shape
 * @property {DetailMaterial} material
 * @property {DescFrame} frame
 * @property {number[]} at  [x, y, h] in its frame
 * @property {Turn} [turn]
 * @property {number[]} [up]  its own y turned to this direction (its frame's x, y, h)
 * @property {number[]} [matrix]  its place as a matrix (16 numbers, by rows), instead of at, turn and up
 * @property {boolean} shadow
 * @property {string[]} layers
 * @property {boolean} moves
 */
/** @typedef {{ n: number, r: string, mover: DescMover | null, parent: DescFrame | null, at?: number[], angle?: number }} DescFrame  a group's frame (parent null), in a moving part or not; or a frame turned by angle about h at a point of its parent */
/**
 * @typedef {object} DescMover  a moving part: its cells and details, the way it opens
 * @property {number} n
 * @property {string} r
 * @property {string} kind  door, drawer, fridge, dishwasher, oven, microwave
 * @property {number[]} P  a point of its axis, in the house
 * @property {any[]} cells
 * @property {number} sign
 * @property {string} label
 * @property {DescMover | null} parent  what must open first
 * @property {DescMover[]} children
 * @property {any} item
 * @property {number | null} travel
 * @property {string | null} swing
 * @property {{ slide?: number[], axis?: number[], angle?: number }} [how]  how it opens (made when all is described)
 */
/** @typedef {{ n: number, kind: 'point' | 'spot', color: number, intensity: number, distance: number, decay: number, angle?: number, penumbra?: number, from: number[], to: number[] | null, shadow: boolean }} DescLamp  in the house's axes */
/** @typedef {{ n: number, key: string, speckle: { size: number, background: string, count: number, dots: { above: number, color: string, alpha?: number[] }[], dot: number[], repeat: number } }} DescLook  a material painted when first drawn */

/** @param {ReturnType<typeof coreGeometryModule>} geometry */
function coreDrawingModule(geometry) {
'use strict';
const G = geometry;

/* a description to draw into. place: group -> its frame {O, X, Y} in the house; level: the floor's h; layers: added to
   all; looks: the page's materials (glass draws no edges); metal: the finish's */
/** @param {{ place: Object<string, { O: number[], X: number[], Y: number[] }>, level: number, layers?: string[], looks: Object<string, MaterialLook>, metal: string, ceiling: number }} spec */
function create({ place: PLACE, level: LEVEL, layers: EXTRA = [], looks: MATERIALS, metal, ceiling }) {
  /** @type {any[]} */ const STATIC = [], UNDRAWN = [], ENVELOPES = [];
  /** @type {DescMover[]} */ const MOVERS = [];
  /** @type {Detail[]} */ const DETAILS = [];
  /** @type {DescLamp[]} */ const LAMPS = [];
  /** @type {DescFrame[]} */ const FRAMES = [];
  /** @type {DescLook[]} */ const LOOKS = [];
  let N = 0, PART = 0;
  const next = () => ++N;
  const part = () => ++PART;
  const point = (/** @type {string} */ r, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ h) => { const { O, X, Y } = PLACE[r]; return [O[0] + x * X[0] + y * Y[0], O[1] + x * X[1] + y * Y[1], LEVEL + h]; };
  /* a box of group r [x0, x1, y0, y1, h0, h1] -> a box of the house [x1, x2, y1, y2, h1, h2] */
  function houseBox(/** @type {string} */ r, /** @type {number[]} */ b) {
    const xs = [], ys = [];
    for (const x of [b[0], b[1]]) for (const y of [b[2], b[3]]) { const p = point(r, x, y, 0); xs.push(p[0]); ys.push(p[1]); }
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), LEVEL + b[4], LEVEL + b[5]];
  }
  /* a solid is a cell of core: {S, material, layers, part, info}. part: one board or piece (a joint between two parts shows
     a line, a box of the same part none); info: what it is. Layers: its group, its layer, the host's. Glass and wire draw no edges. */
  /** @param {any[]} list @param {string} r @param {number[]} gb @param {string} key @param {string} layer @param {Object<string, any>} [info] */
  function box(list, r, gb, key, layer, info = {}) {
    if (!gb.every(Number.isFinite)) { UNDRAWN.push((info.name || layer) + ': ' + gb.join(', ')); return null; }
    if (!(gb[1] > gb[0] && gb[5] > gb[4] && gb[3] > gb[2])) return null;   // an empty box: nothing drawn
    const hb = houseBox(r, gb);
    const c = { S: G.prism(hb), element: info.name || layer, material: key, cap: key, layers: ['g' + r, layer].concat(info.also || [], EXTRA),
      edges: MATERIALS[key].opacity === undefined, part: info.part || part(), r, gb, hb, info, batch: info.batch };
    list.push(c);
    return c;
  }
  /* a prism over a convex profile [[y, h]] across x0..x1 of group r: only where the group runs along the house's x */
  /** @param {any[]} list @param {string} r @param {number} x0 @param {number} x1 @param {number[][]} prof @param {any} info @param {(n: number[]) => string} faceMaterial */
  function profile(list, r, x0, x1, prof, info, faceMaterial) {
    const { O, X, Y } = PLACE[r];
    if (Math.abs(X[0]) < 0.5) return null;
    const xs = [O[0] + x0 * X[0], O[0] + x1 * X[0]];
    const c = /** @type {any} */ ({ S: { x1: Math.min(...xs), x2: Math.max(...xs), poly: G.ccw(prof.map(([y, h]) => [O[1] + y * Y[1], LEVEL + h])) }, material: faceMaterial([0, 0, 1]),
      element: info.name, layers: ['g' + r, info.layer].concat(EXTRA), edges: true, part: part(), r, info, faceMaterial });
    c.cap = c.material;
    list.push(c);
    return c;
  }
  /* a group's frame, in a moving part or not: one for each */
  const frameOf = (/** @type {string} */ r, /** @type {DescMover | null} */ mover) => {
    let f = FRAMES.find(f => f.r === r && f.mover === mover && !f.parent);
    if (!f) { f = { n: next(), r, mover, parent: null }; FRAMES.push(f); }
    return f;
  };
  /* where details go: group r, layers, the moving part they move with */
  /** @param {string} r @param {string} layer @param {DescMover | null} [mover] @param {string[]} [also] */
  const at = (r, layer, mover, also = []) => ({ r, frame: frameOf(r, mover || null), layers: (layer === 'lamps' ? [] : ['g' + r]).concat(layer, also, EXTRA), mover: mover || null });
  /* a detail: a shape at (x, y, h) of a's frame; more: how it is turned (turn, up or matrix) */
  /** @param {any} a @param {Shape} shape @param {DetailMaterial} key @param {number} x @param {number} y @param {number} h @param {boolean} [shadow] @param {{ turn?: Turn, up?: number[], matrix?: number[] }} [more] */
  function detail(a, shape, key, x, y, h, shadow = true, more = {}) {
    const d = Object.assign({ n: next(), shape, material: key, frame: a.frame, at: [x, y, h], shadow, layers: a.layers, moves: !!a.mover }, more);
    DETAILS.push(d);
    return d;
  }
  /* a cylinder upright, or along x ('x') or y ('y'), centred on (x, y, h) */
  /** @param {any} a @param {number} radius @param {number} length @param {string} key @param {number} x @param {number} y @param {number} h @param {string | null} [axis] @param {number} [segments] @param {boolean} [shadow] */
  const cylinder = (a, radius, length, key, x, y, h, axis, segments = 20, shadow) =>
    detail(a, { kind: 'cylinder', r: [radius, radius], length, segments: [segments] }, key, x, y, h, shadow, axis === 'x' ? { turn: { z: Math.PI / 2 } } : axis === 'y' ? { turn: { x: Math.PI / 2 } } : {});
  /* a display: its text lit on a black plane */
  /** @param {any} a @param {string} text @param {number} w @param {number} high @param {number} x @param {number} y @param {number} h */
  const display = (a, text, w, high, x, y, h) => detail(a, { kind: 'plane', size: [w, high] }, { text }, x, y, h, false);

  /* moving parts: a door, a drawer or an appliance door; its cells (built closed) and details are collected first. parent /
     children: what opens only behind it (an inner drawer, drawers behind a door) */
  /** @returns {DescMover} */
  function mover(/** @type {string} */ r, /** @type {string} */ kind, /** @type {number} */ px, /** @type {number} */ py, /** @type {number} */ ph) {
    const m = { n: next(), r, kind, P: point(r, px, py, ph), cells: [], sign: 1, label: '', parent: null, children: [], item: null, travel: null, swing: null };
    MOVERS.push(m);
    return m;
  }
  const linkTo = (/** @type {DescMover} */ parent, /** @type {DescMover} */ child) => { child.parent = parent; parent.children.push(child); };
  const envelope = (/** @type {string} */ r, /** @type {number[]} */ gb, /** @type {string} */ name, kind = 'appliance') => ENVELOPES.push({ kind, name, r, gb });
  /* boxes open at the front (+y) or at the top (+h), walls t thick; one part */
  /** @param {any[]} list @param {string} r @param {number[]} b @param {number} t @param {string} key @param {string} layer @param {Object<string, any>} [info] */
  function openFront(list, r, [x0, x1, y0, y1, h0, h1], t, key, layer, info) {
    const I = Object.assign({ part: part() }, info);
    for (const b of [[x0, x0 + t, y0, y1, h0, h1], [x1 - t, x1, y0, y1, h0, h1], [x0 + t, x1 - t, y0, y1, h0, h0 + t], [x0 + t, x1 - t, y0, y1, h1 - t, h1], [x0 + t, x1 - t, y0, y0 + t, h0 + t, h1 - t]]) box(list, r, b, key, layer, I);
  }
  /** @param {any[]} list @param {string} r @param {number[]} b @param {number} t @param {string} key @param {string} layer @param {Object<string, any>} [info] */
  function openTop(list, r, [x0, x1, y0, y1, h0, h1], t, key, layer, info) {
    const I = Object.assign({ part: part() }, info);
    for (const b of [[x0, x0 + t, y0, y1, h0, h1], [x1 - t, x1, y0, y1, h0, h1], [x0 + t, x1 - t, y0, y0 + t, h0, h1], [x0 + t, x1 - t, y1 - t, y1, h0, h1], [x0 + t, x1 - t, y0 + t, y1 - t, h0, h0 + t]]) box(list, r, b, key, layer, I);
  }
  /* a lamp: off by day; from, to: points of the house */
  /** @param {{ kind: 'point' | 'spot', color: number, intensity: number, distance: number, decay: number, angle?: number, penumbra?: number }} light @param {number[]} from @param {number[] | null} to @param {boolean} shadow */
  const lamp = (light, from, to, shadow) => { LAMPS.push(Object.assign({ n: next(), from, to, shadow }, light)); };
  /* a frame at (x, y, h) of a's, turned by angle about h: what is described in it starts from its own zero */
  /** @param {any} a @param {number} x @param {number} y @param {number} h @param {number} angle */
  function pivot(a, x, y, h, angle) {
    const f = { n: next(), r: a.frame.r, mover: a.frame.mover, parent: a.frame, at: [x, y, h], angle };
    FRAMES.push(f);
    return Object.assign({}, a, { frame: f, pivot: true });
  }
  /* a material painted with specks when first drawn (core/scene.js paints it once) */
  /** @param {string} key @param {DescLook['speckle']} speckle */
  const look = (key, speckle) => { LOOKS.push({ n: next(), key, speckle }); };

  return { box, profile, at, detail, cylinder, display, mover, linkTo, envelope, openFront, openTop, part, lamp, point, pivot, look,
    STATIC, CEILING: ceiling, LEVEL, frame: (/** @type {string} */ r) => PLACE[r], has: (/** @type {string} */ key) => key in MATERIALS, metal,
    /* what was described */
    MOVERS, DETAILS, LAMPS, FRAMES, LOOKS, ENVELOPES, UNDRAWN };
}

return { create };
}
