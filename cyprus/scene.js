// @ts-check
// scene.js: the 3D view: a branch of a hierarchy in three.js, as the prototype drew it. Every box and prism of the branch (its
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

/** @typedef {import('./types.js').Catalog} Catalog */
/** @typedef {import('./types.js').Part} Part */
/** @typedef {import('./core/surfaces.js').Cell} Cell */
/** @typedef {import('./core/surfaces.js').Piece} Piece */
/** @typedef {import('./core/surfaces.js').Vec3} Vec3 */
/** @typedef {import('./core/hierarchy.js').HierarchyNode & { parts?: Part[], product?: string, options?: object, children?: Node[], [field: string]: any }} Node  parts: what is drawn of it; else its product's shape, when the product has a drawing */
/** @typedef {ReturnType<typeof import('./core/hierarchy.js').createHierarchy<Node>>} Hierarchy */
/** @typedef {{ az: number, el: number, k: number, clouds: number, night: boolean }} Sun  degrees (azimuth from East toward North); brightness; 0 clear to 1 overcast */
/**
 * @typedef {object} Light  the view's light (settings.view.light)
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
export function createScene({ catalog, canvas, light, edges }) {
  const scene = new THREE.Scene(), world = new THREE.Group();
  scene.backgroundRotation.set(-Math.PI / 2, 0, 0); scene.environmentRotation.set(-Math.PI / 2, 0, 0);   // the sky's pictures are made y up: turned to h up
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
  /** the three.js material of a library look, made once @param {string} key */
  function material(key) {
    if (MATERIALS.has(key)) return MATERIALS.get(key);
    const def = /** @type {Record<string, any>} */ (catalog.material(key));
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
  /** @type {{ mesh: any, layer?: string, floor?: string, hideWhen: { layer?: string, floor?: string }[] }[]} */
  let LINES = [];
  /** @type {Map<string, { layer?: string, floor?: string }>} a group's layer and floor */
  let GROUPS = new Map();
  let showEdges = true, skipped = 0, pieceCount = 0;
  /** @type {(key: string | undefined) => boolean} */
  let ON = () => true;
  function clear() {
    for (const o of [...world.children]) { world.remove(o); o.traverse((/** @type {any} */ x) => x.geometry?.dispose()); }
    MESHES = []; LINES = []; GROUPS = new Map(); skipped = 0; pieceCount = 0;
  }
  /** a group's key @param {string | undefined} layer @param {string | undefined} floor */
  const groupOf = (layer, floor) => { const k = (layer ?? '') + '|' + (floor ?? ''); if (!GROUPS.has(k)) GROUPS.set(k, { layer, floor }); return k; };

  /**
   * Draws the branch of node, in node's axes.
   * @param {Hierarchy} hierarchy @param {Node} node
   */
  function show(hierarchy, node) {
    clear(); H = hierarchy;
    const h = hierarchy, zero = h.place(node), F = createSurfaces();
    /** @type {Cell[]} */ const still = [];
    /** @type {Map<string, Cell[]>} the solids of each moving part, apart: they turn on their own */
    const moving = new Map();
    /** @param {Node} n */
    (function collect(n) {
      const product = n.product ? catalog.product(n.product) : null;
      const parts = n.parts || (product?.draw ? shapeOf(product, n.size, n.options).parts : null);
      const p = h.place(n), at = [p[0] - zero[0], p[1] - zero[1], p[2] - zero[2]];
      for (const part of parts || []) {
        const look = part.material === 'metal' ? metalOf(n) : part.material;
        const group = groupOf(part.layer ?? h.layer(n), part.floor ?? h.floor(n));
        const S = solidOf(part, at);
        if (!S) { other(part, look, at, group); continue; }
        const F2 = part.faces, eaves = part.eaves && part.eaves.map(y => y + at[1]);
        /** @type {Cell} */
        const cell = { S, group, edges: part.edges !== false, owner: n, part: part.mover ? h.path(n) + '#' + part.mover : undefined,
          ...(F2 ? { faceMaterial: (/** @type {Vec3} */ v, /** @type {Vec3[]} */ pts) => faceLook(F2, eaves, v, pts) } : { material: look }),
          ...(part.raw ? { raw: part.raw, finish: part.finish } : {}) };
        if (part.mover) { const k = h.path(n) + '#' + part.mover; (moving.get(k) || moving.set(k, []).get(k))?.push(cell); } else still.push(cell);
      }
      (n.children || []).forEach(collect);
    })(node);
    draw(F.piecesOf(still));
    for (const cells of moving.values()) draw(F.piecesOf(cells));
    world.updateMatrixWorld(true);
    visible(ON);
    resize();
    view('front');
  }
  /** a box or a prism in the branch's axes; none: another form @param {Part} p @param {number[]} at */
  function solidOf(p, at) {
    if (p.form === 'box') { const b = /** @type {number[]} */ (p.box); return prism([b[0] + at[0], b[1] + at[0], b[2] + at[1], b[3] + at[1], b[4] + at[2], b[5] + at[2]]); }
    if (p.form === 'prism') { const x = /** @type {number[]} */ (p.x); return { x1: x[0] + at[0], x2: x[1] + at[0], poly: /** @type {number[][]} */ (p.poly).map(q => [q[0] + at[1], q[1] + at[2]]) }; }
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
     line); one outside piece continued in its plane by another group's face (open, or itself against a third solid: a wall
     behind a balustrade's end) hides while that group shows; otherwise the line hides exactly while every group that closes it
     is shown. */
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
    /** @type {Map<string, { group: string, hideWhen: string[], p: number[] }>} */
    const out = new Map();
    for (const s of segs.values()) {
      /** @type {Map<string, Piece[]>} */
      const groups = new Map();
      for (const f of s.on) (groups.get(f.group) || groups.set(f.group, []).get(f.group))?.push(f);
      for (const [g, fs] of groups) {
        if (fs.length === 2 && same(fs[0].n, fs[1].n) && fs[0].cell.part === fs[1].cell.part) continue;   // a seam
        const outside = fs.filter(f => !f.cover), unless = /** @type {string[]} */ (fs.filter(f => f.cover).map(f => f.cover));
        let always = outside.length >= 2;
        if (outside.length === 1) {
          const next = s.on.find(o => o.group !== g && same(o.n, outside[0].n));   // continued by another group's face, open or against a third solid
          if (next) unless.push(next.group); else always = true;
        }
        const hideWhen = always ? [] : [...new Set(unless)];
        const k = g + '!' + hideWhen.sort().join('/');
        if (!out.has(k)) out.set(k, { group: g, hideWhen, p: [] });
        out.get(k)?.p.push(s.a[0], s.a[1], s.a[2], s.b[0], s.b[1], s.b[2]);
      }
    }
    for (const v of out.values()) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v.p, 3));
      const mesh = new THREE.LineSegments(geo, edgeLook); world.add(mesh);
      const g = GROUPS.get(v.group) || {};
      LINES.push({ mesh, layer: g.layer, floor: g.floor, hideWhen: v.hideWhen.map(k => GROUPS.get(k) || {}) });
      Object.assign(mesh.userData, { layer: g.layer, floor: g.floor, hideWhen: v.hideWhen });
    }
  }
  /** another form (a cylinder): a mesh of its own, in its group @param {Part} p @param {string} look @param {number[]} at @param {string} group */
  function other(p, look, at, group) {
    if (p.form !== 'cylinder') { skipped++; return; }
    const [r0, r1] = /** @type {number[]} */ (p.radius), c = /** @type {number[]} */ (p.at);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, p.length, p.segments || 20, 1, !!p.open), material(look));
    mesh.position.set(c[0] + at[0], c[1] + at[1], c[2] + at[2]);
    mesh.quaternion.setFromUnitVectors(ALONG, new THREE.Vector3(...(p.axis || [0, 0, 1])).normalize());
    mesh.castShadow = mesh.receiveShadow = true;
    world.add(mesh);
    const g = GROUPS.get(group) || {};
    MESHES.push({ mesh, layer: g.layer, floor: g.floor, finish: null, base: mesh.material });
    Object.assign(mesh.userData, { layer: g.layer, floor: g.floor, material: look });
  }
  /** the fittings' metal where node stands: the setting metal @param {Node} n */
  function metalOf(n) {
    const m = H?.setting(n, 'metal')?.value;
    if (typeof m !== 'string') throw new Error(`scene: ${H?.path(n)}: a part in the fittings' metal, and no setting metal`);
    return m;
  }

  /* ================= WHAT THE PANEL SWITCHES =================
     A mesh shows when its layer and its floor are on; with its finish's layer off, its raw material; a line also hides while every
     group that closes it shows. */
  /** @param {(key: string | undefined) => boolean} on  a layer's or a floor's key, or none (on) */
  function visible(on) {
    ON = on;
    const shown = (/** @type {{ layer?: string, floor?: string }} */ g) => !!on(g.layer) && !!on(g.floor);
    for (const g of MESHES) { g.mesh.visible = shown(g); g.mesh.material = g.finish ? (on(g.finish.layer) ? g.finish.on : g.finish.off) : g.base; }
    for (const l of LINES) l.mesh.visible = showEdges && shown(l) && !(l.hideWhen.length && l.hideWhen.every(shown));
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
