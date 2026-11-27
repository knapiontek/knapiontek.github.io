// @ts-check
// room/assembly.js: what stands in the rooms, from their scenes (room/<room>.scene.json, format scene): a room's scene places
// its things and nothing else: each group of its cabinets (room/<room>.cabinets.json, built by room/cabinets.js, which knows no
// room) by its zero, at the wall, and the way its fronts face; and the room's one metal. A room has a scene when its node lists
// it in files. Adds them under the room's node: the hierarchy grows from the house down. What reaches the ceiling (a hood's
// chimney) is made as tall as the room over it.

import { cabinetsOf } from './cabinets.js';

/** @typedef {import('../types.js').Catalog} Catalog */
/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {ReturnType<typeof import('../core/hierarchy.js').createHierarchy<HierarchyNode & Record<string, any>>>} Hierarchy */
/** @typedef {import('./cabinets.js').Problem & { room: string }} RoomProblem */

const VERSION = 1;   // of the format scene
/** @type {Record<string, number>} the way a group's fronts face: its turn (its y, toward the wall, the other way) */
const FRONT = { S: 0, E: 1, N: 2, W: 3 };

/** a room's file, next to this module @param {string} name */
async function read(name) {
  const response = await fetch(new URL(name, import.meta.url));
  if (!response.ok) throw new Error(`room: ${name}: ${response.status}`);
  return response.json();
}

/**
 * What stands in every room with a scene, added under the room's node; the cabinets' problems, by room. A fault in a scene
 * throws.
 * @param {Hierarchy} H @param {Catalog} catalog @returns {Promise<RoomProblem[]>}
 */
export async function assembleRooms(H, catalog) {
  /** @type {(HierarchyNode & Record<string, any>)[]} */
  const rooms = [];
  H.walk(n => { if (Array.isArray(n.files) && n.files.includes('scene')) rooms.push(n); });
  /** @type {RoomProblem[]} */
  const problems = [];
  for (const room of rooms) {
    const scene = await read(`${room.id}.scene.json`);
    if (scene.format !== 'scene' || scene.version !== VERSION) throw new Error(`room: ${room.id}.scene.json: ${scene.format} ${scene.version}, the code reads scene ${VERSION}`);
    if (scene.metal !== undefined) room.settings = { ...room.settings, metal: scene.metal };
    if (!scene.cabinets) continue;
    const built = cabinetsOf(await read(`${room.id}.cabinets.json`), catalog);
    problems.push(...built.problems.map(p => ({ ...p, room: room.id })));
    for (const group of built.groups) {
      const n = group.id.slice(1), at = scene.cabinets[n];
      if (!at) { problems.push({ room: room.id, index: null, text: `Group ${n} is not in the scene - not placed.`, skipped: true }); continue; }
      if (!(at.front in FRONT) || !(Array.isArray(at.offset) && at.offset.length === 3 && at.offset.every(Number.isFinite))) {
        throw new Error(`room: ${room.id}.scene.json: cabinets ${n}: front N, E, S or W and an offset [x, y, h]`);
      }
      H.add(room, Object.assign(group, { offset: at.offset, turn: FRONT[at.front] }));
      /* what reaches the ceiling (a hood's chimney): as tall as the room over it */
      H.walk(n => { if (n.ceiling && H.chain(n).includes(group)) n.size[2] = room.size[2] - H.fromRoot(room, H.place(n))[2]; });
    }
    for (const n of Object.keys(scene.cabinets)) if (!built.groups.some(g => g.id === 'g' + n)) problems.push({ room: room.id, index: null, text: `The scene places group ${n}, the cabinets have none.`, skipped: false });
  }
  return problems;
}
