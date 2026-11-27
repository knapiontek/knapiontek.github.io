// @ts-check
// room/assembly.js: what stands in the rooms, from their scenes (room/<room>.scene.json, format scene): a room's scene places
// its things and nothing else: each group of its cabinets (room/<room>.cabinets.json, built by room/cabinets.js, which knows no
// room) and each fixture (a product of the library: a WC, a mirror, a shower) by its zero, at the wall, at its left end as one
// sees its front, and the way it faces; what the owner builds (a casing: a box less its cuts); its lamps (a downlight in the
// ceiling, a pendant over a table), lit at night; the room's one metal; and its tiles, the floor's and the walls' (each its
// product, size, depth, the way it runs, pattern, the point it is laid from in every direction and the grout's colour: kept
// on the room's node, as tiles). A room with no scene has none of these. The ceiling: the lowest slab or ceiling of the
// house over the room. A room has a scene when its node lists
// it in files. Adds them under the room's node: the hierarchy grows from the house down. What reaches the ceiling (a hood's
// chimney) is made as tall as the room over it.

import { cabinetsOf } from './cabinets.js';
import { doorHalves, layTiles, under, wallFace, wallsOf } from './tiles.js';

const TOL = 0.5;   // mm: walls meet within it
import { bodyOf, formatsOf, tileOf } from '../library/shapes.js';
import { pointToModel } from '../core/tools.js';

/** @typedef {import('../types.js').Catalog} Catalog */
/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {ReturnType<typeof import('../core/hierarchy.js').createHierarchy<HierarchyNode & Record<string, any>>>} Hierarchy */
/** @typedef {import('./cabinets.js').Problem & { room: string }} RoomProblem */

const VERSION = 1;   // of the format scene
/**
 * A room's floor tiles, a node under it (layer floorTiles): the grout over the floor, the tiles on it, up to the tiles'
 * depth; a small cut marked (layer smallCuts). The floor: the room's rectangles and the halves of the doors at its floor.
 * @param {Hierarchy} H @param {HierarchyNode & Record<string, any>} room @param {any} t  the scene's tiles.floor @param {Catalog} catalog
 */
function floorTiles(H, room, t, catalog) {
  const rects = /** @type {import('./tiles.js').Rect[]} */ (room.area || [[0, room.size[0], 0, room.size[1]]]);
  const floor = [...rects, ...doorHalves(rects, room.openings.filter((/** @type {number[]} */ b) => Math.abs(b[4]) < 50))];
  const { pieces, count } = layTiles(floor, /** @type {any} */ (tileOf(catalog.product(t.product), t.size)), t);
  const d = t.depth, grout = 'grout:' + t.grout, look = 'tile:' + t.product;
  const parts = [
    ...floor.map(([x0, x1, y0, y1]) => ({ form: 'box', box: [x0 + 0.5, x1 - 0.5, y0 + 0.5, y1 - 0.5, 0.5, d - 1], material: grout })),   // none of its faces in a tile's plane
    ...pieces.map(({ rect: [x0, x1, y0, y1] }) => ({ form: 'box', box: [x0, x1, y0, y1, 0, d], material: grout, face: { n: [0, 0, 1], material: look } })),   // the tile its face up, its body the bed and the grout
    ...pieces.filter(p => p.small).map(({ rect: [x0, x1, y0, y1] }) => ({ form: 'box', box: [x0, x1, y0, y1, d, d + 0.5], material: 'smallCut', layer: 'smallCuts' }))
  ];
  H.add(room, { id: 'floorTiles', name: 'Floor tiles', type: 'tiles', layer: 'floorTiles', offset: [0, 0, 0], size: [room.size[0], room.size[1], d], parts, count });
}

/**
 * A room's wall tiles, a node under it (layer wallTiles): each wall round its floor, from a joint over the floor's tiles (the
 * silicone there) up to the ceiling or the roof's underside over it (the room's slopes: a tile cut on the slant), less its
 * openings; at an inner corner the wall along y stops at the face of the tiles on the wall along x, a joint from them. The grout
 * on the wall, the tiles on it, out to their depth; a small cut marked. Laid from the scene's point [x, y, h]: a wall along x
 * from its x and h, along y from its y and h; dir x: the tiles' length along the wall, y: upright. Counted together.
 * @param {Hierarchy} H @param {HierarchyNode & Record<string, any>} room @param {any} t  the scene's tiles.walls @param {number} floor  the floor's tiles' depth (0: none) @param {Catalog} catalog
 */
function wallTiles(H, room, t, floor, catalog) {
  const rects = /** @type {import('./tiles.js').Rect[]} */ (room.area || [[0, room.size[0], 0, room.size[1]]]), tile = /** @type {any} */ (tileOf(catalog.product(t.product), t.size));
  const d = t.depth, j = tile.joint, h0 = floor ? floor + j : 0, grout = 'grout:' + t.grout, look = 'tile:' + t.product, parts = /** @type {any[]} */ ([]);
  const total = { area: 0, tiles: 0, whole: 0, cut: 0, small: 0 }, walls = wallsOf(rects);
  for (const w of walls) {
    /* an inner corner: a wall along y stops short of the tiles on the wall along x it meets */
    let { from, to } = w;
    if (w.axis === 1) for (const o of walls) if (o.axis === 0 && o.from - TOL <= w.at && w.at <= o.to + TOL) {
      if (o.inward > 0 && Math.abs(o.at - from) < TOL) from += d + j;
      if (o.inward < 0 && Math.abs(o.at - to) < TOL) to -= d + j;
    }
    if (to - from < TOL) continue;
    /* what the tiles stay under: the ceiling, the roof's slopes (over y: along a wall along y they slant, along x they stand at its line) */
    const lines = [{ a: room.ceilingHeight, s: 0 }, ...(room.slopes || [])].map((/** @type {{ a: number, s: number }} */ l) => w.axis === 1 ? l : { a: l.a + l.s * w.at, s: 0 });
    const face = wallFace({ ...w, from, to }, h0, room.ceilingHeight, room.openings);
    if (!face.length) continue;
    const { pieces, count } = layTiles(face, tile, { dir: t.dir, pattern: t.pattern, offset: [t.offset[w.axis], t.offset[2]], under: lines });
    for (const k of /** @type {(keyof typeof total)[]} */ (Object.keys(total))) total[k] += count[k];
    /* the face toward the room: its tile; the rest of a piece the bed and the grout */
    const n = w.axis === 0 ? [0, w.inward, 0] : [w.inward, 0, 0];
    /** a piece of the face [u0, u1, v0, v1] (or its outline), from a to b off the wall, in the room's axes: a box, or a prism along x (a wall along y) @param {number[]} r @param {number[][] | undefined} poly @param {number} a @param {number} b @param {string} material @param {any} [extra] */
    const part = (r, poly, a, b, material, extra) => {
      const [p, q] = w.inward > 0 ? [w.at + a, w.at + b] : [w.at - b, w.at - a], L = extra || {};
      if (poly && w.axis === 1) return { form: 'prism', x: [p, q], poly, material, ...L };
      const [u0, u1, v0, v1] = poly ? [Math.min(...poly.map(c => c[0])), Math.max(...poly.map(c => c[0])), Math.min(...poly.map(c => c[1])), Math.max(...poly.map(c => c[1]))] : r;
      return { form: 'box', box: w.axis === 0 ? [u0, u1, p, q, v0, v1] : [p, q, u0, u1, v0, v1], material, ...L };
    };
    for (const r of face) {   /* the grout behind the joints: half a millimetre in from the face's edges and the wall, none of its faces in a tile's plane */
      const inset = /** @type {import('./tiles.js').Rect} */ ([r[0] + 0.5, r[1] - 0.5, r[2] + 0.5, r[3] - 0.5]), poly = under(inset, lines);
      if (poly) parts.push(part(inset, poly, 0.5, d - 1, grout));
    }
    for (const p of pieces) parts.push(part(p.rect, p.poly, 0, d, grout, { face: { n, material: look } }));
    for (const p of pieces.filter(q => q.small)) parts.push(part(p.rect, p.poly, d, d + 0.5, 'smallCut', { layer: 'smallCuts' }));
  }
  total.area = Math.round(total.area * 100) / 100;
  H.add(room, { id: 'wallTiles', name: 'Wall tiles', type: 'tiles', layer: 'wallTiles', offset: [0, 0, 0], size: [room.size[0], room.size[1], room.ceilingHeight], parts, count: total });
}
/** @type {Record<string, number>} the way a group's fronts face: its turn (its y, toward the wall, the other way) */
const FRONT = { S: 0, E: 1, N: 2, W: 3 };
/** @type {string[]} the tiles' patterns: a row's shift along the length, none, a half, a third, a quarter of a tile, at random */
export const PATTERNS = ['grid', 'half', 'third', 'quarter', 'random'];

/**
 * A room's tiles from its scene: the floor's, the walls'. Each: a product of the tiles, its size (one of its formats; none:
 * its own), its depth (mm), dir (x or y: the tiles' length along x, or along the wall; on a wall along y, along y), its
 * pattern, the point it is laid from (the floor: [x, y]; the walls: [x, y, h], a wall along x takes x and h, along y y and h)
 * and the grout's colour. What is wrong: a list.
 * @param {any} tiles @param {Catalog} catalog @returns {string[]}
 */
export function tilesFaults(tiles, catalog) {
  const faults = [];
  if (typeof tiles !== 'object' || !tiles) return ['tiles: floor and walls'];
  for (const k of Object.keys(tiles)) if (!['floor', 'walls'].includes(k)) faults.push(`tiles: ${k}: only floor and walls`);
  for (const [k, n] of /** @type {[string, number][]} */ ([['floor', 2], ['walls', 3]])) {
    const t = tiles[k];
    if (t === undefined) continue;
    let p = /** @type {any} */ (null);
    try { p = catalog.product(t.product); } catch { /* below */ }
    if (!p || !tileOf(p)) { faults.push(`tiles.${k}: product: not a tile (${t.product})`); continue; }
    if (t.size !== undefined && !tileOf(p, t.size)) faults.push(`tiles.${k}: size: one of ${formatsOf(p).map(f => f.join('x')).join(', ')}`);
    if (!(Number.isFinite(t.depth) && t.depth > 0)) faults.push(`tiles.${k}: depth: mm > 0`);
    if (!['x', 'y'].includes(t.dir)) faults.push(`tiles.${k}: dir: x or y`);
    if (!PATTERNS.includes(t.pattern)) faults.push(`tiles.${k}: pattern: ${PATTERNS.join(', ')}`);
    if (!(Array.isArray(t.offset) && t.offset.length === n && t.offset.every(Number.isFinite))) faults.push(`tiles.${k}: offset: ${n === 2 ? '[x, y]' : '[x, y, h]'}`);
    if (!(typeof t.grout === 'string' && /^#[0-9a-f]{6}$/i.test(t.grout))) faults.push(`tiles.${k}: grout: a colour #rrggbb`);
    const extra = Object.keys(t).filter(a => !['product', 'size', 'depth', 'dir', 'pattern', 'offset', 'grout'].includes(a));
    if (extra.length) faults.push(`tiles.${k}: ${extra.join(', ')}: not known`);
  }
  return faults;
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
    if (scene.tiles !== undefined) {
      const faults = tilesFaults(scene.tiles, catalog);
      if (faults.length) throw new Error(`room: ${room.id}.scene.json: ${faults.join('; ')}`);
      room.tiles = scene.tiles;
      if (scene.tiles.floor) floorTiles(H, room, scene.tiles.floor, catalog);
      if (scene.tiles.walls) wallTiles(H, room, scene.tiles.walls, scene.tiles.floor?.depth || 0, catalog);
    }
    /* fixtures: a product, its body's size (or the scene's depth, length, height: as it is built here), at its zero, turned */
    for (const [id, f] of Object.entries(scene.fixtures || {})) {
      const A = catalog.product(f.product), size = bodyOf(A, { width: f.length, depth: f.depth, height: f.height });
      if (!(f.front in FRONT)) throw new Error(`room: ${room.id}.scene.json: fixture ${id}: front N, E, S or W`);
      H.add(room, { id, name: A.name, type: 'product', product: f.product, layer: f.layer, offset: f.offset, turn: FRONT[f.front], size: pointToModel(size) });
    }
    /* what the owner builds: a box less its cuts (a niche), in the room's axes */
    (scene.builtIns || []).forEach((/** @type {{ name: string, box: number[], cuts?: number[][], material: string }} */ b, /** @type {number} */ k) => {
      const [x0, x1, y0, y1, h0, h1] = b.box, local = (/** @type {number[]} */ q) => q.map((v, i) => v - b.box[i & ~1]);
      H.add(room, { id: 'builtIn' + (k + 1), name: b.name, type: 'builtIn', layer: 'casings', offset: [x0, y0, h0], size: [x1 - x0, y1 - y0, h1 - h0],
        parts: minus(local(b.box), (b.cuts || []).map(local)).map(box => ({ form: 'box', box, material: b.material })) });
    });
    /* lamps: under the ceiling over the room, at their place in its axes */
    const ceiling = room.ceilingHeight;
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
