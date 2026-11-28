// @ts-check
// core/tools.js: short pieces that belong to no one file: how numbers are written (the same on every page); a file of a format
// read and checked; from the design's axes to the model's. Knows no project.
//
// The design's axes and the model's: a thing is designed (a product's shape, a run of cabinets) as a person sees it: zero at the
// wall (its back), at its left end as one sees its front, at the bottom; x from the left, y from the wall toward the front, h up:
// left-handed. The model is right-handed everywhere (the house, the hierarchy, three.js): the same zero, x and h, y the other way
// (toward the wall; the front at negative y). One mirror, y → −y, done here and nowhere else; where the thing stands is then only
// offsets and quarter turns (core/hierarchy.js).

const LOCALE = 'en-GB';

/** a number with exactly d decimals: fmt(12, 2) = '12.00', fmt(1234.5, 1) = '1,234.5' @param {number} v @param {number} d */
export const fmt = (v, d) => v.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * Data of a format and its version, checked: else it throws, saying where.
 * @param {any} data @param {string} format @param {number} version @param {string} where  who reads it, the file @returns {any}
 */
export function checkFormat(data, format, version, where) {
  if (data?.format !== format || data.version !== version) throw new Error(`${where}: ${data?.format} ${data?.version}, the code reads ${format} ${version}`);
  return data;
}
/**
 * A file of a format, read and checked (checkFormat).
 * @param {URL} url @param {string} format @param {number} version @param {string} where  who reads it, the file @returns {Promise<any>}
 */
export async function readFormat(url, format, version, where) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${where}: ${response.status}`);
  return checkFormat(await response.json(), format, version, where);
}

/** @typedef {import('../types.js').Vec} Vec */
/** @typedef {import('../types.js').Part} Part */
/** @typedef {import('../types.js').Shape} Shape */

/** a point, or a direction, of the design's axes in the model's @param {Vec} v @returns {Vec} */
export const pointToModel = ([x, y, h]) => [x, -y, h];

/** a box [x0, x1, y0, y1, h0, h1] of the design's axes in the model's @param {number[]} b @returns {number[]} */
export const boxToModel = ([x0, x1, y0, y1, h0, h1]) => [x0, x1, -y1, -y0, h0, h1];

/** a section [y, h] of the design's axes in the model's, its sense kept (a mirror turns it) @param {number[][]} poly */
const sectionToModel = poly => poly.map(([y, h]) => [-y, h]).reverse();

/**
 * A moving part of the design's axes in the model's: its pivot mirrored; a turn about x or h the other way, about y the same;
 * a slide along y the other way, along x or h the same. Its axis kept (a unit along x, y or h).
 * @param {import('../types.js').Mover} m @returns {import('../types.js').Mover}
 */
export function moverToModel(m) {
  if (m.axis.filter(Boolean).length !== 1) throw new Error('tools: a mover along or about an axis not of x, y or h');
  return { ...m, pivot: pointToModel(m.pivot), sign: /** @type {1 | -1} */ ((m.slide ? !m.axis[1] : !!m.axis[1]) ? m.sign : -m.sign) };
}

/**
 * A part of the design's axes in the model's.
 * @param {Part} p @returns {Part}
 */
export function partToModel(p) {
  const q = /** @type {any} */ ({ ...p });
  if (p.box) q.box = boxToModel(p.box);
  if (p.poly) q.poly = sectionToModel(p.poly);
  if (p.outline) {
    if (!p.axis || p.axis[1] || p.axis[2]) throw new Error('tools: an extrusion not along x');
    q.outline = sectionToModel(p.outline);
  }
  if (p.at) q.at = pointToModel(p.at);
  if (p.axis) q.axis = pointToModel(p.axis);
  if (p.points) q.points = p.points.map(pointToModel);
  if (p.matrix) { const m = p.matrix; q.matrix = [...m.slice(0, 4), ...m.slice(4, 8).map(v => -v), ...m.slice(8)]; }   // the row of y
  if (p.index) { const i = p.index, out = []; for (let k = 0; k < i.length; k += 3) out.push(i[k], i[k + 2], i[k + 1]); q.index = out; }   // a triangle's sense
  return q;
}

/**
 * A shape of the design's axes in the model's: its parts, the turns of its moving parts, its lights, its envelopes. A turn's axis
 * (an axial vector) through a mirror: along y it keeps its sense, along x or h it turns the other way; written with the axis kept
 * and the sign the other way.
 * @param {Shape} S @returns {Shape}
 */
export function shapeToModel(S) {
  return {
    size: S.size,
    parts: S.parts.map(partToModel),
    movers: S.movers.map(moverToModel),
    lights: S.lights.map(l => ({ ...l, at: pointToModel(l.at), ...(l.target ? { target: pointToModel(l.target) } : {}) })),
    envelopes: S.envelopes.map(e => ({ ...e, box: boxToModel(e.box) })),
    ...(S.anchor ? { anchor: S.anchor } : {})   // in the design's axes, as the room places it
  };
}
