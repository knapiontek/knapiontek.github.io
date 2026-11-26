// @ts-check
// house/build.js: the site and its house from their model (model.json, next to this file) as a hierarchy (core/hierarchy.js):
// the site at the root, the house on it, its assemblies and floors, their elements, the openings in their walls, the rooms as
// places. A node without its own layer or floor takes its type's (geometry.types): the model names them once, per type.

import { createHierarchy } from '../core/hierarchy.js';

/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {HierarchyNode & { floor?: string, children?: HouseNode[], [field: string]: any }} HouseNode  a node of model.json: the hierarchy's fields and its own (house/project.md) */
/** @typedef {{ name: string, layer?: string, floor?: string, [field: string]: any }} HouseType  a type of model.json (geometry.types) */

const VERSION = 1;   // of model.json's format, house

/**
 * The hierarchy of the site and its house, from model.json. The house is the node house; its geometry (types, frames, finishes)
 * stays on it; its axes are archon/analysis.md's: x East, y South, h up, zero at its front-left corner at ±0.00.
 * @returns {Promise<ReturnType<typeof createHierarchy<HouseNode>>>}
 */
export async function buildHouse() {
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
  return createHierarchy(/** @type {HouseNode} */ (root));
}
