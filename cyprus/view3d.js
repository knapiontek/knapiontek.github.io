// @ts-check
// view3d.js: the 3D view (the menu's 3D): a branch of a hierarchy in three.js. Every box and prism of the branch (its
// nodes' parts, or their products' shapes) is a solid with its group (its layer and its floor): the solids' faces are welded,
// a face against a face of its own group is gone, what lies against another group is its raw material, seen while that group
// is hidden (core/surfaces.js); the pieces are batched into one mesh per group and material; edges come from the topology: no
// line on a seam, a corner always. The other forms (a cylinder) are meshes of their own. Placed by the hierarchy; the look by
// the material's key (the catalog's materials, their generated surfaces; 'metal': the setting metal). Knows no house and no
// room. Without a canvas it builds the scene only (the test). three.js from its CDN.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/controls/OrbitControls.js/+esm';
import { shapeOf } from './library/shapes.js';
import { prism, edgesOf } from './core/geometry.js';
import { createSurfaces, sub3, dot3, cross3 } from './core/surfaces.js';
import { turned } from './core/hierarchy.js';

/** @typedef {{ at: number[], turn: number }} Frame  a node's axes in the branch's: its zero, its quarter turns about h */
/** @typedef {import('./types.js').Catalog} Catalog */
/** @typedef {import('./types.js').Part} Part */
/** @typedef {import('./types.js').Light} LampLight  a lamp's light */
/** @typedef {import('./core/surfaces.js').Cell} Cell */
/** @typedef {import('./core/surfaces.js').Piece} Piece */
/** @typedef {import('./core/surfaces.js').Vec3} Vec3 */
/** @typedef {import('./core/hierarchy.js').HierarchyNode & { parts?: Part[], product?: string, options?: object, children?: Node[], [field: string]: any }} Node  parts: what is drawn of it; else its product's shape, when the product has a drawing */
/** @typedef {ReturnType<typeof import('./core/hierarchy.js').createHierarchy<Node>>} Hierarchy */
/** @typedef {{ az: number, el: number, k: number, clouds: number, night: boolean }} Sun  degrees (azimuth from East toward North); brightness; 0 clear to 1 overcast */
/**
 * @typedef {object} Light  the view's light (index.json: view.light)
 * @property {number} exposure
 * @property {{ intensity: number, color?: string, reach?: number }} sun  reach: m its shadow covers
 * @property {{ intensity: number, color: string, groundColor: string, gradient?: [number, string][] }} sky
 * @property {{ color: string, near: number, far: number }} fog  mm
 * @property {{ value: number, sun: number, sky: number, blur: number }} clouds  the factors of the sun, the sky and the shadow's blur at full cloud
 */
/** @typedef {{ color: string, opacity: number }} Edges  how edges are drawn */

const MM = 0.001, DEG = Math.PI / 180;
/* our axes (x East, y North, h up: right-handed, as three's) are three's x, y, z as they are, in metres; h is up (the camera's) */
const UP = new THREE.Vector3(0, 0, 1);
const ALONG = new THREE.Vector3(0, 1, 0);   // a three.js cylinder's own axis
const FACING = new THREE.Vector3(0, 0, 1);  // the way a three.js ring, disc, plane faces; a torus's axis
const NIGHT = { fog: '#141a26', gradient: [[0, '#070b16'], [0.36, '#121a2e'], [0.47, '#24304a'], [0.5, '#3a3f52'], [0.52, '#151a22'], [1, '#0b0e13']], stars: 420 };

/* triangles of the pieces' convex polygons, batched into one mesh; a fan around the centre: no thin triangles */
class Batch {
  constructor() {
    /** @type {number[]} */
    this.p = [];
    /** @type {number[]} */
    this.n = [];
    /** @type {number[]} */
    this.uv = [];
  }
  /** @param {Vec3[]} points @param {Vec3} n @param {(v: Vec3) => number[]} uv */
  polygon(points, n, uv) {
    const c = [0, 1, 2].map(i => points.reduce((s, v) => s + v[i], 0) / points.length);
    for (let i = 0; i < points.length; i++) {
      let b = points[i], d = points[(i + 1) % points.length];
      if (dot3(cross3(sub3(b, c), sub3(d, c)), n) < 0) [b, d] = [d, b];
      for (const v of [c, b, d]) { this.p.push(v[0], v[1], v[2]); this.n.push(...n); this.uv.push(...uv(v)); }
    }
  }
  /** @param {any} material */
  mesh(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    const m = new THREE.Mesh(g, material); m.castShadow = !material.transparent; m.receiveShadow = true;
    return m;
  }
}

/**
 * The 3D view.
 * @param {{ catalog: Catalog, canvas?: HTMLCanvasElement, light?: Light, edges?: Edges }} options
 */
export function createView3d({ catalog, canvas, light, edges }) {
  const scene = new THREE.Scene(), world = new THREE.Group();
  scene.backgroundRotation.set(Math.PI / 2, 0, 0); scene.environmentRotation.set(Math.PI / 2, 0, 0);   // the sky's pictures are made y up: turned to h up
  world.scale.setScalar(MM);
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
  camera.up.copy(UP);
  const page = typeof document !== 'undefined';   // a page draws pictures; the test's worker does not

  /* ================= MATERIALS: a library look, its generated surface (uv in mm) ================= */
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  /** @type {Map<string, HTMLCanvasElement>} a picture drawn once for its key */
  const CANVASES = new Map();
  /** @param {number} w @param {number} h @param {(g: CanvasRenderingContext2D, w: number, h: number) => void} draw @param {boolean} [srgb] @param {string | null} [key] */
  function canvasTexture(w, h, draw, srgb = true, key = null) {
    let c = key ? CANVASES.get(key) : undefined;
    if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h); if (key) CANVASES.set(key, c); }
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; if (renderer) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  /* specks darker and lighter over what is drawn: squares of size px, blended into the pixels */
  /** @param {CanvasRenderingContext2D} g @param {number} w @param {number} h @param {number} strength @param {number} size */
  function specks(g, w, h, strength, size) {
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < w * h / (size * size) * 0.9; i++) {
      const dark = rnd() < 0.5, a = dark ? strength * 0.22 * rnd() : strength * 0.3 * rnd(), to = dark ? 0 : 255;
      const x0 = Math.floor(rnd() * w), y0 = Math.floor(rnd() * h);
      for (let y = y0; y < y0 + size; y++) for (let x = x0; x < x0 + size; x++) {
        const k = ((y % h) * w + (x % w)) * 4;
        for (let c = 0; c < 3; c++) d[k + c] += (to - d[k + c]) * a;
      }
    }
    g.putImageData(im, 0, 0);
  }
  /** @param {string} src @param {(im: HTMLImageElement) => void} fn */
  const loadImage = (src, fn) => { const im = new Image(); im.onload = () => fn(im); im.src = src; };
  /** @type {Record<string, (d: any, m: any, def: any) => void>} generated surfaces: each sets the map of a material */
  const SURFACES = {
    texture(d, m) {
      m.map = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); specks(g, w, h, d.strength, d.grain); }, false, `texture:${d.strength}:${d.grain}`);
      m.map.repeat.set(1 / d.tile, 1 / d.tile);
    },
    chipboard(d, m, def) {
      const base = new THREE.Color(def.color);
      m.map = canvasTexture(256, 256, (g, w, h) => {
        g.fillStyle = '#' + base.getHexString(); g.fillRect(0, 0, w, h);
        for (let i = 0; i < 2600; i++) {
          const c = base.clone().offsetHSL((rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.15, (rnd() - 0.5) * 0.32);
          g.save(); g.translate(rnd() * w, rnd() * h); g.rotate(rnd() * Math.PI);
          g.fillStyle = '#' + c.getHexString(); g.fillRect(0, 0, 2 + rnd() * 9, 1 + rnd() * 2.5); g.restore();
        }
        specks(g, w, h, 1, 1);
      }, true, 'chipboard:' + def.color);
      m.map.repeat.set(1 / d.tile, 1 / d.tile); m.color.set(0xffffff);
    },
    grass(d, m, def) {
      m.map = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = def.color; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `hsla(${80 + rnd() * 30},${30 + rnd() * 25}%,${25 + rnd() * 25}%,0.5)`; g.fillRect(rnd() * w, rnd() * h, 1, 2 + rnd() * 3); } });
      m.map.repeat.set(1 / d.tile, 1 / d.tile); m.color.set(0xffffff);
    },
    slabs(d, m, def) {
      m.map = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = def.color; g.fillRect(0, 0, w, h); specks(g, w, h, 0.5, 2); g.fillStyle = d.joint; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); }, true, `slabs:${def.color}:${d.joint}`);
      m.map.repeat.set(1 / d.size, 1 / d.size); m.color.set(0xffffff);
    },
    wood(d, m) {                           // boards cut at random from the decor's photo, with a dark joint
      catalog.texture(d.decor).then(T => loadImage(T.faces[0], im => {
        const boards = 8, len = T.size[0], px = 0.4, across = boards * d.board * px, along = len * px, sh = im.height * d.board / T.size[1];
        const t = canvasTexture(d.vertical ? across : along, d.vertical ? along : across, g => {
          for (let i = 0; i < boards; i++) {
            const sy = rnd() * (im.height - sh);
            g.save();
            if (d.vertical) { g.translate(i * d.board * px, 0); g.rotate(Math.PI / 2); g.drawImage(im, 0, sy, im.width, sh, 0, -d.board * px, along, d.board * px); }
            else g.drawImage(im, 0, sy, im.width, sh, 0, i * d.board * px, along, d.board * px);
            g.restore();
            g.fillStyle = 'rgba(20,14,8,0.55)';
            if (d.vertical) g.fillRect(i * d.board * px, 0, 2, along); else g.fillRect(0, i * d.board * px, along, 2);
          }
        });
        t.repeat.set(d.vertical ? 1 / (boards * d.board) : 1 / len, d.vertical ? 1 / len : 1 / (boards * d.board));
        m.map = t; m.color.set(0xffffff); m.needsUpdate = true; redraw();
      }));
    },
    image(d, m) {                          // a photo of textures, its size in mm; face: which of its images; turn: its u along the face's v
      catalog.texture(d.key).then(T => loadImage(T.faces[d.face || 0], im => {
        const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
        if (d.turn) { t.repeat.set(1 / T.size[1], 1 / T.size[0]); t.rotation = Math.PI / 2; } else t.repeat.set(1 / T.size[0], 1 / T.size[1]);
        t.needsUpdate = true; m.map = t; m.needsUpdate = true; redraw();
      }));
    }
  };
  /** @type {Map<string, any>} */
  const MATERIALS = new Map();
  /** a board's look from its product: its decor's photo, a lacquer, or a colour @param {string} key  a board of the library @returns {Record<string, any>} */
  function boardLook(key) {
    const b = /** @type {any} */ (catalog.product(key));
    return b.texture ? { color: '#ffffff', image: { key: b.texture }, roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.55, reflect: 0.5 }
      : b.lacquered ? { color: b.color, roughness: 0.42, clearcoat: 0.2, clearcoatRoughness: 0.45, reflect: 0.7 }
      : { color: b.color, roughness: 0.8, reflect: 0.45 };
  }
  /** the three.js material of a library look, made once @param {string} key */
  function material(key) {
    if (MATERIALS.has(key)) return MATERIALS.get(key);
    const def = key.startsWith('board:') ? boardLook(key.slice(6)) : /** @type {Record<string, any>} */ (catalog.material(key));
    /** @type {Record<string, any>} */
    const o = { color: def.color || '#ffffff', roughness: def.roughness ?? 0.9, metalness: def.metalness || 0, envMapIntensity: def.reflect ?? 1,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };   // the faces a little back: an edge on them shows, one behind them does not
    if (def.ahead) Object.assign(o, { polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
    if (def.emissive) Object.assign(o, { emissive: def.emissive, emissiveIntensity: def.glow ?? 1 });
    const m = def.clearcoat === undefined ? new THREE.MeshStandardMaterial(o)
      : new THREE.MeshPhysicalMaterial(Object.assign(o, { clearcoat: def.clearcoat, clearcoatRoughness: def.clearcoatRoughness ?? 0.5 }));
    if (def.opacity !== undefined) Object.assign(m, { transparent: true, opacity: def.opacity, depthWrite: false });
    if (page) for (const [k, make] of Object.entries(SURFACES)) if (def[k]) make(def[k], m, def);
    MATERIALS.set(key, m);
    return m;
  }
  const edgeLook = edges && new THREE.LineBasicMaterial({ color: edges.color, transparent: true, opacity: edges.opacity });

  /* ================= THE BRANCH SHOWN ================= */
  /** @type {Hierarchy | null} */
  let H = null;
  /** @type {{ mesh: any, layer?: string, floor?: string, finish: { layer: string, on: any, off: any } | null, base: any }[]} the meshes, each of one group */
  let MESHES = [];
  /** @type {{ mesh: any, layer?: string, floor?: string, hideWhen: { layer?: string, floor?: string }[][] }[]} */
  let LINES = [];
  /** @type {Map<string, { layer?: string, floor?: string }>} a group's layer and floor */
  let GROUPS = new Map();
  /** @type {{ light: any, layer?: string, floor?: string }[]} the lamps' lights, each of one group: lit at night, while its group shows */
  let LIGHTS = [];
  let showEdges = true, skipped = 0, pieceCount = 0, night = false;
  /** @type {(key: string | undefined) => boolean} */
  let ON = () => true;
  function clear() {
    for (const o of [...world.children]) { world.remove(o); o.traverse((/** @type {any} */ x) => x.geometry?.dispose()); }
    for (const { light } of LIGHTS) { scene.remove(light); if (light.target) scene.remove(light.target); light.dispose(); }
    MESHES = []; LINES = []; LIGHTS = []; GROUPS = new Map(); skipped = 0; pieceCount = 0;
  }
  /** a group's key @param {string | undefined} layer @param {string | undefined} floor */
  const groupOf = (layer, floor) => { const k = (layer ?? '') + '|' + (floor ?? ''); if (!GROUPS.has(k)) GROUPS.set(k, { layer, floor }); return k; };

  /**
   * Draws the branch of node, in node's axes.
   * @param {Hierarchy} hierarchy @param {Node} node
   */
  function show(hierarchy, node) {
    clear(); H = hierarchy;
    const h = hierarchy, F = createSurfaces();
    /** @type {Cell[]} */ const still = [];
    /** @type {Map<string, Cell[]>} the solids of each moving part, apart: they turn on their own */
    const moving = new Map();
    /** @param {Node} n */
    (function collect(n) {
      const product = n.product ? catalog.product(n.product) : null;
      const shape = product?.draw && !n.parts ? shapeOf(product, n.size.map(Math.abs), n.options) : null;   // a shape's size: its extent
      const parts = n.parts || shape?.parts || null;
      /** @type {Frame} n's axes in node's: its zero, its quarter turns */
      const at = { at: h.fromRoot(node, h.place(n)), turn: (h.turnOf(n) - h.turnOf(node) + 4) % 4 };
      for (const part of parts || []) {
        const look = part.material === 'metal' ? metalOf(n) : part.material;
        const group = groupOf(part.layer ?? h.layer(n), part.floor ?? h.floor(n));
        const S = solidOf(part, at);
        if (!S) { other(part, look, at, group); continue; }
        const F2 = part.faces, eaves = part.eaves && at.turn === 0 ? part.eaves.map(y => y + at.at[1]) : undefined;
        /** @type {Cell} */
        const cell = { S, group, edges: part.edges !== false, owner: n, part: part.mover ? h.path(n) + '#' + part.mover : undefined,
          ...(F2 ? { faceMaterial: (/** @type {Vec3} */ v, /** @type {Vec3[]} */ pts) => faceLook(F2, eaves, v, pts) } : { material: look }),
          ...(part.raw ? { raw: part.raw, finish: part.finish } : {}) };
        if (part.mover) { const k = h.path(n) + '#' + part.mover; (moving.get(k) || moving.set(k, []).get(k))?.push(cell); } else still.push(cell);
      }
      for (const l of /** @type {LampLight[]} */ (n.lights || shape?.lights || [])) lamp(l, at, groupOf(h.layer(n), h.floor(n)));
      (n.children || []).forEach(collect);
    })(node);
    draw(F.piecesOf(still));
    for (const cells of moving.values()) draw(F.piecesOf(cells));
    world.updateMatrixWorld(true);
    visible(ON);
    resize();
    view('front');
  }
  /** a point of a node's axes in the branch's @param {Frame} f @param {number[]} v */
  const put = (f, v) => turned(v, f.turn).map((c, i) => c + f.at[i]);
  /** a box or a prism in the branch's axes; none: another form, or a prism turned a quarter (along y: not yet) @param {Part} p @param {Frame} f */
  function solidOf(p, f) {
    if (p.form === 'box') {
      const b = /** @type {number[]} */ (p.box), a = put(f, [b[0], b[2], b[4]]), c = put(f, [b[1], b[3], b[5]]);
      return prism([0, 1, 2].flatMap(i => [Math.min(a[i], c[i]), Math.max(a[i], c[i])]));
    }
    if (p.form === 'prism' && f.turn % 2 === 0) {
      const x = /** @type {number[]} */ (p.x), poly = /** @type {number[][]} */ (p.poly), [ax, ay, ah] = f.at;
      if (f.turn === 0) return { x1: x[0] + ax, x2: x[1] + ax, poly: poly.map(q => [q[0] + ay, q[1] + ah]) };
      return { x1: ax - x[1], x2: ax - x[0], poly: poly.map(q => [ay - q[0], q[1] + ah]).reverse() };   // half a turn: y against itself, the polygon's sense kept
    }
    return null;
  }
  /** a face's material by its side @param {Record<string, string>} F @param {number[] | undefined} eaves @param {Vec3} n @param {Vec3[]} pts */
  function faceLook(F, eaves, n, pts) {
    if (n[2] > 0.3) return F.top;
    if (n[2] < -0.3) return F.bottom;
    if (Math.abs(n[0]) > 0.5) return F.ends;
    return eaves && pts.every(q => q[1] <= eaves[0] + 1e-6 || q[1] >= eaves[1] - 1e-6) ? F.eaves : F.reveals;
  }
  /** the pieces as meshes (one per group, material, finish) and their edges @param {Piece[]} pieces */
  function draw(pieces) {
    pieceCount += pieces.length;
    /** @type {Map<string, { cell: any, material: string, batch: Batch }>} */
    const batches = new Map();
    for (const f of pieces) {
      const k = f.group + '|' + f.material + '|' + (f.cell.finish || '') + '|' + (f.cell.raw || '');
      if (!batches.has(k)) batches.set(k, { cell: f.cell, material: f.material, batch: new Batch() });
      batches.get(k)?.batch.polygon(f.poly, f.n, f.uv);
    }
    for (const { cell, material: key, batch } of batches.values()) {
      const mesh = batch.mesh(material(key)), g = GROUPS.get(cell.group) || {};
      world.add(mesh);
      const finish = cell.finish && key !== cell.raw ? { layer: cell.finish, on: material(key), off: material(cell.raw) } : null;
      MESHES.push({ mesh, layer: g.layer, floor: g.floor, finish, base: mesh.material });
      Object.assign(mesh.userData, { layer: g.layer, floor: g.floor, material: key });
    }
    if (edgeLook) lines(pieces);
  }
  /* Edges from the topology of the pieces. For each segment between two welded points and each group on it: two pieces of the
     group in one plane are a seam (no line) unless they are of two parts; two outside pieces at an angle are a corner (always a
     line); the group's pieces in one plane, continued in it by another group's face (open, or itself against a third solid: a
     wall behind a tread's end), make a joint: it hides while that group shows, whatever lies against them; otherwise the line
     hides exactly while every group that closes it is shown. */
  /** @param {Piece[]} pieces */
  function lines(pieces) {
    /** @type {Map<string, { a: any, b: any, on: Piece[] }>} */
    const segs = new Map();
    for (const f of pieces) {
      if (!f.cell.edges) continue;
      for (const [a, b] of edgesOf(f.poly)) {
        const k = Math.min(Number(a.id), Number(b.id)) + '-' + Math.max(Number(a.id), Number(b.id));
        if (!segs.has(k)) segs.set(k, { a, b, on: [] });
        segs.get(k)?.on.push(f);
      }
    }
    const same = (/** @type {Vec3} */ m, /** @type {Vec3} */ n) => dot3(m, n) > 1 - 1e-9;
    /** @type {Map<string, { group: string, hideWhen: string[][], p: number[] }>} */
    const out = new Map();
    for (const s of segs.values()) {
      /** @type {Map<string, Piece[]>} */
      const groups = new Map();
      for (const f of s.on) (groups.get(f.group) || groups.set(f.group, []).get(f.group))?.push(f);
      for (const [g, fs] of groups) {
        if (fs.length === 2 && same(fs[0].n, fs[1].n) && fs[0].cell.part === fs[1].cell.part) continue;   // a seam
        const outside = fs.filter(f => !f.cover), covers = /** @type {string[]} */ ([...new Set(fs.filter(f => f.cover).map(f => f.cover))]);
        /** the face of another group that continues a plane of this group on the segment, open or against a third solid @param {Vec3} n */
        const nextTo = n => s.on.find(o => o.group !== g && same(o.n, n));
        /** @type {string[][]} each a set of groups that, all shown, hide the line */
        const hideWhen = [];
        if (outside.length < 2) {
          if (!outside.length && covers.length) hideWhen.push(covers);                         // inside what covers it
          const planes = fs.filter((f, i) => fs.findIndex(o => same(o.n, f.n)) === i);
          if (planes.length === 1) { const next = nextTo(planes[0].n); if (next) hideWhen.push([next.group]); }   // a joint in one plane
          else if (planes.length === 2) for (const [a, b] of [[planes[0], planes[1]], [planes[1], planes[0]]]) {   // a corner: one side goes on in another group, the other is covered
            const next = nextTo(a.n), cover = fs.filter(f => same(f.n, b.n)).every(f => f.cover) ? fs.filter(f => same(f.n, b.n)).map(f => /** @type {string} */ (f.cover)) : null;
            if (next && cover) hideWhen.push([...new Set([next.group, ...cover])]);
          }
        }
        const k = g + '!' + hideWhen.map(h => h.sort().join('+')).sort().join('/');
        if (!out.has(k)) out.set(k, { group: g, hideWhen, p: [] });
        out.get(k)?.p.push(s.a[0], s.a[1], s.a[2], s.b[0], s.b[1], s.b[2]);
      }
    }
    for (const v of out.values()) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v.p, 3));
      const mesh = new THREE.LineSegments(geo, edgeLook); world.add(mesh);
      const g = GROUPS.get(v.group) || {};
      LINES.push({ mesh, layer: g.layer, floor: g.floor, hideWhen: v.hideWhen.map(h => h.map(k => GROUPS.get(k) || {})) });
      Object.assign(mesh.userData, { layer: g.layer, floor: g.floor, hideWhen: v.hideWhen });
    }
  }
  /**
   * Another form: a mesh of its own, in its group; made in its node's axes, set in the branch's by the node's zero and turn.
   * cylinder, ring, disc, plane, text (facing its axis), sphere (its poles on its axis, its arc down from the top), torus (round its axis), extrude (its outline [y, h] along x),
   * tube (along its points), mesh (its points through its matrix).
   * @param {Part} p @param {string} look @param {Frame} at @param {string} group
   */
  function other(p, look, at, group) {
    const r = /** @type {number[]} */ (p.radius || []), seg = p.segments || 24, arc = p.arc || [0, 2 * Math.PI];
    const facing = (/** @type {any} */ o, /** @type {any} */ from) => o.quaternion.setFromUnitVectors(from, new THREE.Vector3(...(p.axis || [0, 0, 1])).normalize());
    let m = material(look);
    if (p.side === 'double' || p.side === 'back') { m = m.clone(); m.side = p.side === 'double' ? THREE.DoubleSide : THREE.BackSide; }
    /** @type {any} */
    let geometry = null;
    /** @type {any} */
    let materials = m;
    const AT = /** @type {number[]} */ (p.at || [0, 0, 0]);
    switch (p.form) {
      case 'cylinder': geometry = new THREE.CylinderGeometry(r[1] ?? r[0], r[0], p.length, seg, 1, !!p.open, arc[0], arc[1] - arc[0]); break;
      case 'ring': geometry = new THREE.RingGeometry(r[0], r[1], seg); break;
      case 'disc': geometry = new THREE.CircleGeometry(r[0], seg, arc[0], arc[1] - arc[0]); break;
      case 'plane': geometry = new THREE.PlaneGeometry(...(/** @type {number[]} */ (p.size))); break;
      case 'sphere': geometry = new THREE.SphereGeometry(r[0], seg, Math.max(6, seg >> 1), 0, 2 * Math.PI, ...(p.arc || [0, Math.PI])); break;
      case 'torus': geometry = new THREE.TorusGeometry(r[0], /** @type {number} */ (p.tube), 12, seg); break;
      case 'text': {
        const [w, h] = /** @type {number[]} */ (p.size);
        if (!page) { geometry = new THREE.PlaneGeometry(w, h); break; }   // no page: no letters
        const c = document.createElement('canvas');
        c.width = 512; c.height = Math.max(16, Math.round(512 * h / w));
        const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
        g.fillStyle = '#d8dde2'; g.font = `${Math.round(c.height * 0.7)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(p.text), c.width / 2, c.height / 2);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        materials = new THREE.MeshBasicMaterial({ map: t, transparent: true });
        geometry = new THREE.PlaneGeometry(w, h);
        break;
      }
      case 'extrude': {   /* the outline (y, h) along x from at: x ← the extrusion, y ← the outline's first, h ← its second */
        const shape = new THREE.Shape(/** @type {number[][]} */ (p.outline).map(([y, h]) => new THREE.Vector2(y, h)));
        geometry = new THREE.ExtrudeGeometry(shape, { depth: p.length, bevelEnabled: false });
        geometry.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
        if (p.ends) materials = [material(p.ends), m];
        break;
      }
      case 'tube': {
        const pts = /** @type {number[][]} */ (p.points).map(q => new THREE.Vector3(...q)), path = new THREE.CurvePath();
        for (let k = 0; k + 1 < pts.length; k++) path.add(new THREE.LineCurve3(pts[k], pts[k + 1]));
        geometry = new THREE.TubeGeometry(path, Math.max(8, 8 * (pts.length - 1)), r[0], 12, false);
        break;
      }
      case 'mesh': {
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(/** @type {number[]} */ (p.positions), 3));
        geometry.setIndex(/** @type {number[]} */ (p.index));
        const M = /** @type {number[]} */ (p.matrix);
        geometry.applyMatrix4(new THREE.Matrix4().set(...M, 0, 0, 0, 1));
        geometry.computeVertexNormals();
        break;
      }
      default: skipped++; return;
    }
    const mesh = new THREE.Mesh(geometry, materials);
    if (!['extrude', 'tube', 'mesh'].includes(p.form)) {
      mesh.position.set(AT[0], AT[1], AT[2]);
      if (p.form === 'cylinder' || p.form === 'sphere') facing(mesh, ALONG); else facing(mesh, FACING);   // a sphere's poles on its axis (h): its arc from the top down
    } else if (p.form === 'extrude') mesh.position.set(AT[0], AT[1], AT[2]);
    mesh.castShadow = mesh.receiveShadow = p.form !== 'text';
    const node = new THREE.Group();   /* the node's axes in the branch's */
    node.position.set(...at.at); node.rotation.z = at.turn * Math.PI / 2;
    node.add(mesh); world.add(node);
    const g = GROUPS.get(group) || {};
    MESHES.push({ mesh, layer: g.layer, floor: g.floor, finish: null, base: mesh.material });
    Object.assign(mesh.userData, { layer: g.layer, floor: g.floor, material: look });
  }
  /**
   * A lamp's light, in its group: a point or a spot (to its target), in the node's axes; lit at night (setSun).
   * @param {LampLight} l @param {Frame} at @param {string} group
   */
  function lamp(l, at, group) {
    const color = new THREE.Color(l.color), p = put(at, l.at);
    const light = l.kind === 'spot' ? new THREE.SpotLight(color, l.intensity, l.distance, l.angle ?? Math.PI / 3, l.penumbra ?? 0, l.decay) : new THREE.PointLight(color, l.intensity, l.distance, l.decay);
    light.position.set(p[0] * MM, p[1] * MM, p[2] * MM);   // the world is in mm, scaled to m
    if (l.kind === 'spot') { const t = put(at, l.target || [l.at[0], l.at[1], 0]); light.target.position.set(t[0] * MM, t[1] * MM, t[2] * MM); scene.add(light.target); }
    light.castShadow = false;
    scene.add(light);
    const g = GROUPS.get(group) || {};
    LIGHTS.push({ light, layer: g.layer, floor: g.floor });
  }
  /** the fittings' metal where node stands: the setting metal @param {Node} n */
  function metalOf(n) {
    const m = H?.setting(n, 'metal')?.value;
    if (typeof m !== 'string') throw new Error(`scene: ${H?.path(n)}: a part in the fittings' metal, and no setting metal`);
    return m;
  }

  /* ================= WHAT THE PANEL SWITCHES =================
     A mesh shows when its layer and its floor are on; with its finish's layer off, its raw material; a line also hides while all
     the groups of one of its hiding sets show. */
  /** @param {(key: string | undefined) => boolean} on  a layer's or a floor's key, or none (on) */
  function visible(on) {
    ON = on;
    const shown = (/** @type {{ layer?: string, floor?: string }} */ g) => !!on(g.layer) && !!on(g.floor);
    for (const g of MESHES) { g.mesh.visible = shown(g); g.mesh.material = g.finish ? (on(g.finish.layer) ? g.finish.on : g.finish.off) : g.base; }
    for (const l of LINES) l.mesh.visible = showEdges && shown(l) && !l.hideWhen.some(h => h.every(shown));
    for (const l of LIGHTS) l.light.visible = night && shown(l);
    redraw();
  }
  /** @param {boolean} on */
  function showEdgesOf(on) { showEdges = on; visible(ON); }

  /* ================= THE CAMERAS: from the front (West), from the garden (East), from above (North up on the screen) ================= */
  /** @param {'front' | 'garden' | 'above'} name */
  function view(name) {
    const box = new THREE.Box3();
    for (const g of MESHES) if (g.mesh.visible) box.expandByObject(g.mesh);
    if (box.isEmpty()) return;
    /* far enough that the box's sphere fits the narrower of the two angles of view */
    const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
    const v = camera.fov * DEG, narrow = Math.min(v, 2 * Math.atan(Math.tan(v / 2) * camera.aspect)), d = r / Math.sin(narrow / 2);
    const dir = new THREE.Vector3(...{ front: [-1, -0.25, 0.35], garden: [1, 0.25, 0.35], above: [0, -0.01, 1] }[name]).normalize();
    camera.position.copy(c).addScaledVector(dir, d);
    camera.lookAt(c);
    if (controls) { controls.target.copy(c); controls.update(); }
    redraw();
  }

  /* ================= THE RENDERER, THE SKY, THE LIGHT, THE SUN: only with a canvas ================= */
  /** @type {any} */ let renderer = null;
  /** @type {any} */ let controls = null;
  /** @type {any} */ let hemi = null;
  /** @type {any} */ let sun = null;
  /** @type {any} */ let skyTexture = null;
  /** @type {any} */ let nightTexture = null;
  /** @type {any} */ let dayEnvironment = null;
  let frame = 0;
  function redraw() { if (renderer && !frame) frame = requestAnimationFrame(() => { frame = 0; renderer.render(scene, camera); }); }
  /** the sky behind: a gradient by day; by night a dark sky with stars @param {[number, string][] | null} gradient */
  function setSky(gradient) {
    if (!gradient) {
      if (!nightTexture) {
        let s = 7;
        const random = () => (s = (s * 16807) % 2147483647) / 2147483647;
        nightTexture = canvasTexture(4096, 2048, (g, w, h) => {
          const gr = g.createLinearGradient(0, 0, 0, h); for (const [t, c] of NIGHT.gradient) gr.addColorStop(/** @type {number} */ (t), /** @type {string} */ (c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
          for (let i = 0; i < NIGHT.stars; i++) { const y = (0.12 + 0.34 * random()) * h; g.fillStyle = `rgba(255,255,255,${0.45 + 0.55 * random()})`; g.fillRect(random() * w, y, 2, 2); }
        });
        nightTexture.mapping = THREE.EquirectangularReflectionMapping; nightTexture.generateMipmaps = false; nightTexture.minFilter = THREE.LinearFilter;
      }
      scene.background = nightTexture; return redraw();
    }
    if (!skyTexture) {
      skyTexture = canvasTexture(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); for (const [t, c] of gradient) gr.addColorStop(t, c); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      skyTexture.mapping = THREE.EquirectangularReflectionMapping;
    }
    scene.background = skyTexture; redraw();
  }
  if (canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    controls = new OrbitControls(camera, canvas);
    controls.addEventListener('change', redraw);
    if (light) {
      renderer.toneMappingExposure = light.exposure;
      if (light.sky.gradient) {
        setSky(light.sky.gradient);
        dayEnvironment = scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(skyTexture).texture;
      } else scene.background = new THREE.Color(light.fog.color);
      scene.fog = new THREE.Fog(light.fog.color, light.fog.near * MM, light.fog.far * MM);
      hemi = new THREE.HemisphereLight(light.sky.color, light.sky.groundColor, light.sky.intensity * Math.PI);
      hemi.position.copy(UP);
      sun = new THREE.DirectionalLight(light.sun.color ?? '#ffffff', light.sun.intensity * Math.PI);
      const reach = light.sun.reach ?? 16;
      sun.shadow.camera.up.copy(UP);
      sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
      Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 80 });
      scene.add(hemi, sun, sun.target);
    }
    new ResizeObserver(resize).observe(canvas);
    navigation(canvas);
  }

  /* ================= NAVIGATION =================
     The wheel zooms toward the surface under the cursor. A drag with the left button turns the view about the point under the
     cursor where the drag starts (a ball marks it while it turns; on no surface, about the point it turned about last); the
     right button moves the view at the depth of what is under the cursor. Never over the top: h stays up on the screen. */
  const ZOOM_IN = 0.2, ZOOM_OUT = 0.25, NEAREST = 0.05, SPEED = 2 * Math.PI;   // a wheel notch's share of the way; closest, m
  const ray = new THREE.Raycaster();
  /** @param {HTMLCanvasElement} canvas */
  function navigation(canvas) {
    const ndcOf = (/** @type {MouseEvent} */ e) => { const r = canvas.getBoundingClientRect(); return new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); };
    /** the first surface shown along the ray through a point of the screen @param {any} ndc */
    const surfaceAt = ndc => {
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(MESHES.filter(g => g.mesh.visible).map(g => g.mesh), false)[0];
      return hit ? hit.point : null;
    };
    const viewAxis = () => new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
    /** the target slides along the view axis to the point's depth: the view does not jump @param {any} point */
    const seatTarget = (point, dir = viewAxis()) => {
      const depth = Math.max(new THREE.Vector3().subVectors(point, camera.position).dot(dir), NEAREST);
      controls.target.copy(camera.position).addScaledVector(dir, depth);
    };
    /** @type {HTMLElement} */ (canvas.parentElement).addEventListener('wheel', e => {   // before the controls
      if (e.target !== canvas) return;
      e.preventDefault(); e.stopPropagation();
      const p = surfaceAt(ndcOf(e)) || ray.ray.at(camera.position.distanceTo(controls.target), new THREE.Vector3());
      const notches = Math.min(Math.abs(e.deltaY) * (e.deltaMode === 1 ? 33 : 1) / 100, 3);   // a mouse notch is 1, a touchpad many small ones
      const k = e.deltaY < 0 ? 1 - Math.pow(1 - ZOOM_IN, notches) : 1 - Math.pow(1 + ZOOM_OUT, notches);
      if (k > 0 && camera.position.distanceTo(p) * (1 - k) < NEAREST) return;
      const dir = viewAxis();
      camera.position.lerp(p, k);
      seatTarget(p, dir); controls.update(); redraw();
    }, { capture: true, passive: false });
    controls.enableRotate = false;   // the turn is ours: about the point under the cursor
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd9822b, depthTest: false, transparent: true, opacity: 0.85, fog: false }));
    ball.renderOrder = 999; ball.visible = false; scene.add(ball);
    const showBall = (/** @type {any} */ p) => { ball.position.copy(p); ball.scale.setScalar(Math.max(camera.position.distanceTo(p) * 0.008, 0.004)); ball.visible = true; redraw(); };
    const pointers = new Set();
    /** @type {{ x: number, y: number } | null} */ let orbit = null;
    /** @type {any} */ let pivot = null;
    canvas.addEventListener('pointerdown', e => {
      pointers.add(e.pointerId);
      if (pointers.size > 1) { orbit = null; ball.visible = false; redraw(); return; }   // two fingers: the controls zoom and move
      const p = surfaceAt(ndcOf(e));
      if (e.button === 2) { if (p) { seatTarget(p); controls.update(); } return; }       // the move follows what is under the cursor
      if (e.button !== 0) return;
      pivot = p || pivot || controls.target.clone();
      orbit = { x: e.clientX, y: e.clientY };
      showBall(pivot);
    });
    canvas.addEventListener('pointermove', e => {
      if (!orbit) return;
      const h = canvas.clientHeight || 1, yaw = -SPEED * (e.clientX - orbit.x) / h, pitch = -SPEED * (e.clientY - orbit.y) / h;
      orbit.x = e.clientX; orbit.y = e.clientY;
      const turn = (/** @type {any} */ axis, /** @type {number} */ angle) => {
        const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        camera.position.sub(pivot).applyQuaternion(q).add(pivot);
        camera.quaternion.premultiply(q);
      };
      turn(UP, yaw);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      if (Math.abs(forward.clone().applyAxisAngle(right, pitch).dot(UP)) < 0.995) turn(right, pitch);
      const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      controls.target.copy(camera.position).addScaledVector(ahead, Math.max(camera.position.distanceTo(pivot), NEAREST));
      controls.update(); showBall(pivot);
    });
    const end = (/** @type {PointerEvent} */ e) => { pointers.delete(e.pointerId); if (orbit) { orbit = null; ball.visible = false; redraw(); } };
    for (const k of ['pointerup', 'pointercancel', 'pointerleave']) canvas.addEventListener(k, /** @type {any} */ (end));
  }
  function resize() {
    if (!renderer || !canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); redraw();
  }
  /**
   * The sun: azimuth from +x toward +y, elevation, brightness, clouds (the light's factors in proportion); by night none, a faint
   * sky, the night sky and its fog.
   * @param {Sun} s
   */
  function setSun(s) {
    if (!sun || !light) return;
    const az = s.az * DEG, el = s.el * DEG, box = new THREE.Box3();
    for (const g of MESHES) box.expandByObject(g.mesh);
    const centre = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el));
    sun.position.copy(centre).addScaledVector(dir, 40); sun.target.position.copy(centre);
    const C = light.clouds, toward = (/** @type {number} */ full) => 1 + (full - 1) * s.clouds;
    sun.visible = !s.night;
    night = !!s.night;
    for (const l of LIGHTS) l.light.visible = night && (!ON || (!!ON(l.layer) && !!ON(l.floor)));
    scene.environment = s.night ? null : dayEnvironment;
    sun.intensity = light.sun.intensity * Math.PI * s.k * toward(C.sun);
    hemi.intensity = light.sky.intensity * Math.PI * (s.night ? 0.14 : (0.6 + 0.4 * s.k) * toward(C.sky));
    sun.shadow.radius = toward(C.blur);
    if (light.sky.gradient) setSky(s.night ? null : light.sky.gradient);
    if (scene.fog) scene.fog.color.set(s.night ? NIGHT.fog : light.fog.color);
    redraw();
  }
  function dispose() { clear(); controls?.dispose(); renderer?.dispose(); for (const m of MATERIALS.values()) m.dispose(); }

  return {
    show, visible, view, resize, dispose, sun: setSun, edges: showEdgesOf,
    /** the view's camera */
    camera,
    /** the meshes drawn, each of one group and one material (userData: layer, floor, material) */
    meshes: () => MESHES.map(g => g.mesh),
    /** the edges drawn, each a set of lines of one group */
    lines: () => LINES.map(l => l.mesh),
    /** what is drawn: the pieces of faces, the meshes, the sets of lines, parts of a form not drawn yet */
    count: () => ({ pieces: pieceCount, meshes: MESHES.length, lines: LINES.length, skipped })
  };
}
