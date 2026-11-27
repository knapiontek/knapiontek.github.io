// @ts-check
// room/assembly.js: what stands in the rooms, from their scenes (room/<room>.scene.json, format scene): a room's scene places
// its things and nothing else: each group of its cabinets (room/<room>.cabinets.json, built by room/cabinets.js, which knows no
// room) and each fixture (a product of the library: a WC, a mirror, a shower) by its zero, at the wall, at its left end as one
// sees its front, and the way it faces; what the owner builds (a casing: a box less its cuts); its lamps (a downlight in the
// ceiling, a pendant over a table), lit at night; and the room's one metal. The ceiling: the lowest slab or ceiling of the
// house over the room. A room has a scene when its node lists
// it in files. Adds them under the room's node: the hierarchy grows from the house down. What reaches the ceiling (a hood's
// chimney) is made as tall as the room over it.

import { cabinetsOf } from './cabinets.js';
import { pointToModel } from '../core/tools.js';

/** @typedef {import('../types.js').Catalog} Catalog */
/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {ReturnType<typeof import('../core/hierarchy.js').createHierarchy<HierarchyNode & Record<string, any>>>} Hierarchy */
/** @typedef {import('./cabinets.js').Problem & { room: string }} RoomProblem */

const VERSION = 1;   // of the format scene
/** @type {Record<string, number>} the way a group's fronts face: its turn (its y, toward the wall, the other way) */
const FRONT = { S: 0, E: 1, N: 2, W: 3 };

/**
 * The ceiling over a room, from its floor: the lowest slab or ceiling of the house over its footprint; none: the room's height.
 * @param {Hierarchy} H @param {HierarchyNode} room
 */
function ceilingOver(H, room) {
  const r = H.box(room);
  let low = r[5];
  H.walk(n => {
    if (n.type !== 'slab' && n.type !== 'ceiling') return;
    const b = H.box(n);
    if (b[0] < r[1] && b[1] > r[0] && b[2] < r[3] && b[3] > r[2] && b[4] > r[4] + 100) low = Math.min(low, b[4]);
  });
  return low - r[4];
}

/**
 * A lamp's bodies and lights, in its node's axes (its zero on the floor under it): a downlight in the ceiling (a tube, its bulb,
 * a spot down); a pendant (a cable, a dome shade, a ring in the room's metal, a bulb; a soft point and a spot down), its shade's
 * rim at bottom.
 * @param {string} kind @param {number} C  the ceiling @param {number} [bottom]
 * @returns {{ parts: import('../types.js').Part[], lights: import('../types.js').Light[] }}
 */
function lampOf(kind, C, bottom = 1750) {
  const UP = [0, 0, 1], DOWN = [0, 0, -1];
  if (kind === 'downlight') return {
    parts: [{ form: 'cylinder', radius: [35, 35], length: 100, segments: 40, open: true, side: 'double', at: [0, 0, C - 50], axis: UP, material: 'tube' },
      { form: 'disc', radius: [27], segments: 32, at: [0, 0, C - 85], axis: DOWN, material: 'bulb' }],
    lights: [{ kind: 'spot', at: [0, 0, C - 90], target: [0, 0, 0], color: '#fff0dc', intensity: 11, distance: 0, angle: 1.0, penumbra: 1, decay: 2, shadow: false }] };
  const h = bottom;
  return {
    parts: [{ form: 'cylinder', radius: [2, 2], length: C - h - 90, segments: 6, at: [0, 0, (C + h + 90) / 2], axis: UP, material: 'gasket' },
      { form: 'sphere', radius: [150], segments: 32, arc: [0, Math.PI / 2], at: [0, 0, h + 60], material: 'blackMetal' },
      { form: 'sphere', radius: [148], segments: 32, arc: [0, Math.PI / 2], side: 'back', at: [0, 0, h + 60], material: 'shadeInside' },
      { form: 'torus', radius: [150], tube: 4, segments: 48, at: [0, 0, h + 60], axis: UP, material: 'metal' },
      { form: 'cylinder', radius: [14, 14], length: 40, segments: 16, at: [0, 0, h + 180], axis: UP, material: 'gasket' },
      { form: 'sphere', radius: [32], segments: 20, at: [0, 0, h + 135], material: 'bulb' }],
    lights: [{ kind: 'point', at: [0, 0, h + 135], color: '#ffd9a8', intensity: 1.2, distance: 0.9, decay: 2, shadow: false },
      { kind: 'spot', at: [0, 0, h + 135], target: [0, 0, 0], color: '#ffd9a8', intensity: 7, distance: 5, angle: 1.2, penumbra: 0.8, decay: 2, shadow: false }] };
}

/** a box less boxes cut out of it: boxes, split along x, then y, then h @param {number[]} box @param {number[][]} cuts @returns {number[][]} */
function minus(box, cuts) {
  let pieces = [box];
  for (const c of cuts) pieces = pieces.flatMap(p => {
    if (![0, 1, 2].every(i => Math.min(p[2 * i + 1], c[2 * i + 1]) > Math.max(p[2 * i], c[2 * i]))) return [p];
    /** @type {number[][]} */ const out = [];
    let rest = p.slice();
    for (const i of [0, 1, 2]) {
      const lo = Math.max(rest[2 * i], c[2 * i]), hi = Math.min(rest[2 * i + 1], c[2 * i + 1]);
      if (rest[2 * i] < lo) { const q = rest.slice(); q[2 * i + 1] = lo; out.push(q); }
      if (hi < rest[2 * i + 1]) { const q = rest.slice(); q[2 * i] = hi; out.push(q); }
      rest = rest.slice(); rest[2 * i] = lo; rest[2 * i + 1] = hi;
    }
    return out;
  });
  return pieces;
}

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
    /* fixtures: a product, its body's size (or the scene's depth, length, height: as it is built here), at its zero, turned */
    for (const [id, f] of Object.entries(scene.fixtures || {})) {
      const A = /** @type {any} */ (catalog.product(f.product)), b = { ...A.body, ...(f.depth ? { depth: f.depth } : {}), ...(f.length ? { width: f.length } : {}), ...(f.height ? { height: f.height } : {}) };
      if (!(f.front in FRONT)) throw new Error(`room: ${room.id}.scene.json: fixture ${id}: front N, E, S or W`);
      H.add(room, { id, name: A.name, type: 'product', product: f.product, layer: f.layer, offset: f.offset, turn: FRONT[f.front], size: pointToModel([b.width, b.depth, b.height]) });
    }
    /* what the owner builds: a box less its cuts (a niche), in the room's axes */
    (scene.builtIns || []).forEach((/** @type {{ name: string, box: number[], cuts?: number[][], material: string }} */ b, /** @type {number} */ k) => {
      const [x0, x1, y0, y1, h0, h1] = b.box, local = (/** @type {number[]} */ q) => q.map((v, i) => v - b.box[i & ~1]);
      H.add(room, { id: 'builtIn' + (k + 1), name: b.name, type: 'builtIn', layer: 'casings', offset: [x0, y0, h0], size: [x1 - x0, y1 - y0, h1 - h0],
        parts: minus(local(b.box), (b.cuts || []).map(local)).map(box => ({ form: 'box', box, material: b.material })) });
    });
    /* lamps: under the ceiling over the room, at their place in its axes */
    const ceiling = ceilingOver(H, room);
    for (const [id, l] of Object.entries(scene.lamps || {})) {
      if (!['downlight', 'pendant'].includes(l.kind) || !(Array.isArray(l.at) && l.at.length === 2)) throw new Error(`room: ${room.id}.scene.json: lamp ${id}: kind downlight or pendant, at [x, y]`);
      H.add(room, { id, name: l.kind === 'pendant' ? 'Pendant' : 'Downlight', type: 'lamp', layer: l.kind + 's', offset: [l.at[0], l.at[1], 0], size: [1, 1, ceiling], ...lampOf(l.kind, ceiling, l.bottom) });
    }
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
