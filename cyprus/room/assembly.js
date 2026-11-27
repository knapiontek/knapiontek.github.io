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
import { layTiles, pointOf, tiledSurfaces, under } from './tiles.js';

const TOL = 0.5;   // mm

import { bodyOf, formatsOf, tileOf } from '../library/shapes.js';
import { pointToModel } from '../core/tools.js';

/** @typedef {import('../types.js').Catalog} Catalog */
/** @typedef {import('../core/hierarchy.js').HierarchyNode} HierarchyNode */
/** @typedef {ReturnType<typeof import('../core/hierarchy.js').createHierarchy<HierarchyNode & Record<string, any>>>} Hierarchy */
/** @typedef {import('./cabinets.js').Problem & { room: string }} RoomProblem */

const VERSION = 1;   // of the format scene
/** @typedef {import('./tiles.js').Surface} Surface */
/** a tile's number by chance, the same for the same tile @param {string} id */
const hashOf = id => { let h = 2166136261; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };

/**
 * A room's tiles, as its scene lays them over its surfaces (room/tiles.js: the floor, the walls, the faces of what is built
 * before them): on each a slab from what it lies on out to the tiles' face, a solid as the house's are (its edge the tile's,
 * tile:<product>:edge); on its face the grout, over it each tile's face (form faces), its photo the whole tile (one of the
 * product's images, by chance, turned by chance), a small cut marked over it (layer smallCuts). Two nodes under the room:
 * floorTiles (layer floorTiles), wallTiles (wallTiles: the casings' too), each counted.
 * @param {Hierarchy} H @param {HierarchyNode & Record<string, any>} room @param {any} tiles  the scene's @param {import('./tiles.js').BuiltIn[]} built @param {Catalog} catalog
 */
function roomTiles(H, room, tiles, built, catalog) {
  const rects = room.area || [[0, room.size[0], 0, room.size[1]]], C = room.ceilingHeight;
  const tile = /** @type {Record<string, any>} */ ({});
  for (const k of ['floor', 'walls']) if (tiles[k]) tile[k] = tileOf(catalog.product(tiles[k].product), tiles[k].size);
  const surfaces = tiledSurfaces({ rects, height: C, slopes: room.slopes || [], openings: room.openings, built },
    tiles.floor ? { depth: tiles.floor.depth } : null, tiles.walls ? { depth: tiles.walls.depth, joint: tile.walls.joint } : null);
  for (const k of /** @type {('floor' | 'walls')[]} */ (['floor', 'walls'])) {
    const t = tiles[k], T = tile[k];
    if (!t) continue;
    const d = t.depth, [U, V] = t.dir === 'x' ? [T.len, T.wid] : [T.wid, T.len], look = `tile:${t.product}`, size = `${T.len}x${T.wid}`;
    /** @type {Map<string, any>} the faces by their material, their way and layer: a part each */
    const parts = new Map();
    const add = (/** @type {string} */ material, /** @type {number[]} */ n, /** @type {number[][]} */ poly, /** @type {number[][] | null} */ uv, /** @type {string} */ layer = '') => {
      const key = material + '|' + n.join() + '|' + (layer || '');
      if (!parts.has(key)) parts.set(key, { form: 'faces', n, polys: [], uvs: [], material, ...(layer ? { layer } : {}) });
      const p = parts.get(key); p.polys.push(poly); p.uvs.push(uv || poly.map(() => [0, 0]));
    };
    const total = { area: 0, tiles: 0, whole: 0, cut: 0, small: 0 };
    for (const s of surfaces.filter(x => x.layout === k)) {
      const P = (/** @type {number[]} */ q, o = 0) => pointOf(s, q, o);
      const offset = s.axis === 2 ? [t.offset[0], t.offset[1]] : [t.offset[s.axis], t.offset[t.offset.length - 1]];   // a wall's point: along it, h
      const { pieces, count } = layTiles(s.rects, T, { dir: t.dir, pattern: t.pattern, offset, under: s.lines });
      for (const c of /** @type {(keyof typeof total)[]} */ (Object.keys(total))) total[c] += count[c];
      /* the slab: from what it lies on out to the face, a solid of its own (the house's surfaces: what touches welded, what is covered not drawn, its edges) */
      for (const r of s.rects) {
        const poly = under(r, s.lines);
        if (!poly) continue;
        const [a, b] = s.n.some(v => v < 0) ? [s.at, s.at + d] : [s.at - d, s.at];   // across the plane
        if (s.axis === 1) { parts.set('slab' + parts.size, { form: 'prism', x: [a, b], poly, material: look + ':edge' }); continue; }   // along x: its section [y, h], cut on the slant
        const [u0, u1, v0, v1] = [Math.min(...poly.map(q => q[0])), Math.max(...poly.map(q => q[0])), Math.min(...poly.map(q => q[1])), Math.max(...poly.map(q => q[1]))];
        parts.set('slab' + parts.size, { form: 'box', box: s.axis === 0 ? [u0, u1, a, b, v0, v1] : [u0, u1, v0, v1, a, b], material: look + ':edge' });
        add('grout:' + t.grout, s.n, poly.map(q => P(q)), null);   // on its face, under the tiles
      }
      /* each tile's face on it: its photo from its corner over the whole tile, turned */
      for (const p of pieces) {
        const poly = p.poly || [[p.rect[0], p.rect[2]], [p.rect[1], p.rect[2]], [p.rect[1], p.rect[3]], [p.rect[0], p.rect[3]]];
        const h = hashOf(k + s.id + p.tile), turns = T.len === T.wid ? h % 4 : 2 * (h % 2);
        const uv = poly.map(q => { let a = (q[0] - p.at[0]) / U, b = (q[1] - p.at[1]) / V; if (t.dir !== 'x') [a, b] = [b, a]; for (let i = 0; i < turns; i++) [a, b] = [1 - b, a]; return [a, b]; });
        add(`${look}:${(h >>> 4) % 8}:${size}`, s.n, poly.map(q => P(q)), uv);
        if (p.small) add('smallCut', s.n, poly.map(q => P(q, 0.5)), null, 'smallCuts');
      }
    }
    total.area = Math.round(total.area * 100) / 100;
    const id = k === 'floor' ? 'floorTiles' : 'wallTiles';
    H.add(room, { id, name: k === 'floor' ? 'Floor tiles' : 'Wall tiles', type: 'tiles', layer: id, offset: [0, 0, 0], size: [room.size[0], room.size[1], k === 'floor' ? d : C], parts: [...parts.values()], count: total });
  }
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
      roomTiles(H, room, scene.tiles, (scene.builtIns || []).map((/** @type {{ box: number[], cuts?: number[][] }} */ b) => ({ box: b.box, cuts: b.cuts || [] })), catalog);
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
