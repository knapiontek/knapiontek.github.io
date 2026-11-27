// @ts-check
// house/assembly.js: the site and its house from their model (model.json, next to this file) as a hierarchy (core/hierarchy.js):
// the site at the root, the house on it, its assemblies and floors, their elements, the openings in their walls, the rooms as
// places, what stands in them (room/assembly.js). A node without its own layer or floor takes its type's (geometry.types): the model names them once, per type. What is
// drawn of the house: house/shapes.js; of the site: its lawn round the house and its surfaces.

import { createHierarchy } from '../core/hierarchy.js';
import { houseShapes } from './shapes.js';
import { assembleRooms } from '../room/assembly.js';

/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {import('../types.js').Part} Part */
/** @typedef {HierarchyNode & { children?: HouseNode[], parts?: Part[], movers?: import('../types.js').Mover[], [field: string]: any }} HouseNode  a node of model.json: the hierarchy's fields and its own (house/project.md); parts: what is drawn of it, in its own axes; movers: its moving parts */
/** @typedef {{ name: string, layer?: string, floor?: string, [field: string]: any }} HouseType  a type of model.json (geometry.types) */

const VERSION = 1;   // of model.json's format, house

/**
 * The hierarchy of the site and its house, from model.json, and what stands in its rooms (room/assembly.js), with the problems
 * of their cabinets. The house is the node house; its geometry (types, frames, finishes) stays on it; its axes are
 * archon/analysis.md's: x East, y North, h up (right-handed), zero at its front-right (South-West) corner at ±0.00.
 * @param {import('../types.js').Catalog} catalog
 * @returns {Promise<{ hierarchy: ReturnType<typeof createHierarchy<HouseNode>>, problems: import('../room/assembly.js').RoomProblem[] }>}
 */
export async function assembleHouse(catalog) {
  const response = await fetch(new URL('model.json', import.meta.url));
  if (!response.ok) throw new Error(`house: model.json: ${response.status}`);
  const { format, version, ...root } = await response.json();
  if (format !== 'house' || version !== VERSION) throw new Error(`house: model.json: ${format} ${version}, the code reads house ${VERSION}`);
  const house = /** @type {HouseNode} */ (root.children.find((/** @type {HouseNode} */ n) => n.id === 'house'));
  /** @type {Record<string, HouseType>} */
  const types = house.geometry.types;
  /** its own layer and floor, or its type's @param {HouseNode} n */
  (function typed(n) {
    const t = types[n.type];
    if (n.layer === undefined && t?.layer !== undefined) n.layer = t.layer;
    if (n.floor === undefined && t?.floor !== undefined) n.floor = t.floor;
    (n.children || []).forEach(typed);
  })(house);
  const hierarchy = createHierarchy(/** @type {HouseNode} */ (root));
  houseShapes(hierarchy, house);
  root.parts = siteParts(hierarchy, root, house);
  const problems = await assembleRooms(/** @type {any} */ (hierarchy), catalog);
  return { hierarchy, problems };
}

/**
 * The site's parts, in its axes: the lawn round the house's footprint (the box round its elements), the surfaces on the lawn.
 * @param {ReturnType<typeof createHierarchy<HouseNode>>} H @param {HouseNode} site @param {HouseNode} house @returns {Part[]}
 */
function siteParts(H, site, house) {
  const L = site.lawn;
  /** @type {number[][]} */
  const boxes = [];
  H.walk(n => { if (n.parts && n !== site && H.chain(n).includes(house)) boxes.push(H.box(n)); });
  const foot = [Math.min(...boxes.map(b => b[0])), Math.max(...boxes.map(b => b[1])), Math.min(...boxes.map(b => b[2])), Math.max(...boxes.map(b => b[3]))];
  const [x0, x1, y0, y1] = L.rect, h0 = L.h - L.depth, h1 = L.h;
  /** @type {number[][]} the lawn: the four strips round the footprint */
  const lawn = L.aroundBuilding ? [[x0, x1, y0, foot[2]], [x0, x1, foot[3], y1], [x0, foot[0], foot[2], foot[3]], [foot[1], x1, foot[2], foot[3]]] : [[x0, x1, y0, y1]];
  return [
    ...lawn.filter(r => r[0] < r[1] && r[2] < r[3]).map(r => /** @type {Part} */ ({ form: 'box', box: [...r, h0, h1], material: L.material, edges: false })),
    ...site.surfaces.map((/** @type {{ rect: number[], h: number, material: string }} */ s) => /** @type {Part} */ ({ form: 'box', box: [...s.rect, h1, s.h], material: s.material, edges: false }))];
}
