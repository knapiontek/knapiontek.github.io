// @ts-check
// house/build.js: the house from its model (model.json, next to this file) as a hierarchy (core/hierarchy.js): the house, its
// assemblies and floors, their elements, the openings in their walls, the rooms as places; the site under the house. Each node
// takes the layers of its type (geometry.types) and of its floor field: the model names them once, per type.

import { createHierarchy } from '../core/hierarchy.js';

/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {HierarchyNode & { floor?: string, children?: HouseNode[], [field: string]: any }} HouseNode  a node of model.json: the hierarchy's fields and its own (house/project.md) */
/** @typedef {{ name: string, layers?: string[], floor?: string, [field: string]: any }} HouseType  a type of model.json (geometry.types) */

const VERSION = 1;   // of model.json's format, house

/**
 * The house's hierarchy, from model.json. Its root is the house; its geometry (types, frames, finishes) stays on it.
 * @returns {Promise<ReturnType<typeof createHierarchy<HouseNode>>>}
 */
export async function buildHouse() {
  const response = await fetch(new URL('model.json', import.meta.url));
  if (!response.ok) throw new Error(`house: model.json: ${response.status}`);
  const { format, version, ...root } = await response.json();
  if (format !== 'house' || version !== VERSION) throw new Error(`house: model.json: ${format} ${version}, the code reads house ${VERSION}`);
  /** @type {Record<string, HouseType>} */
  const types = root.geometry.types;
  /** its own layers, its type's, its floor's: each once @param {HouseNode} n */
  (function layer(n) {
    const t = types[n.type], floor = n.floor || t?.floor;
    const all = [...(n.layers || []), ...(t?.layers || []), ...(floor ? [floor] : [])];
    if (all.length) n.layers = [...new Set(all)];
    (n.children || []).forEach(layer);
  })(/** @type {HouseNode} */ (root));
  return createHierarchy(/** @type {HouseNode} */ (root));
}
