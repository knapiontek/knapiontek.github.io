// @ts-check
// scene.js: the 3D view: a branch of a hierarchy in three.js. A node is drawn by its parts (types.js: Part), or by its
// product's shape (library/shapes.js) when it has a drawing; placed by the hierarchy; its look by its material's key (the catalog's materials; 'metal':
// the fittings' metal, the setting metal); a prism's faces each by its side. Knows no house and no room: what it draws comes from the builders. Without a canvas
// it builds the scene only (the test). three.js from its CDN.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/controls/OrbitControls.js/+esm';
import { shapeOf } from './library/shapes.js';

/** @typedef {import('./types.js').Catalog} Catalog */
/** @typedef {import('./types.js').Part} Part */
/** @typedef {import('./core/hierarchy.js').HierarchyNode & { parts?: Part[], product?: string, options?: object, children?: Node[], [field: string]: any }} Node  parts: what is drawn of it; else its product's shape, when the product has a drawing */
/** @typedef {ReturnType<typeof import('./core/hierarchy.js').createHierarchy<Node>>} Hierarchy */
/** @typedef {{ az: number, el: number, k: number, clouds: number, night: boolean }} Sun  degrees (azimuth from +x toward +y); brightness; 0 clear to 1 overcast */
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
/* our axes (x East, y South, h up, mm) in three's (x, y up, z toward the viewer, m): x → x, h → y, y → z */
const AXES = new THREE.Matrix4().set(MM, 0, 0, 0, 0, 0, MM, 0, 0, MM, 0, 0, 0, 0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);

/**
 * The 3D view.
 * @param {{ catalog: Catalog, canvas?: HTMLCanvasElement, light?: Light, edges?: Edges }} options
 */
export function createScene({ catalog, canvas, light, edges }) {
  const scene = new THREE.Scene(), world = new THREE.Group();
  world.matrixAutoUpdate = false; world.matrix.copy(AXES);
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
  /** @type {Map<Node, any>} a node's group: its meshes and their edges */
  const GROUPS = new Map();
  /** @type {Map<string, any>} */
  const MATERIALS = new Map();
  const edgeLook = edges && new THREE.LineBasicMaterial({ color: edges.color, transparent: edges.opacity < 1, opacity: edges.opacity });
  let showEdges = true, skipped = 0;

  /* ---------- the look of a material key; a wood its decor's image, tiled by the image's size (in a page only) ---------- */
  /** @param {string} key */
  function material(key) {
    if (!MATERIALS.has(key)) {
      const L = /** @type {Record<string, any>} */ (catalog.material(key)), opacity = L.opacity ?? 1;
      const m = new THREE.MeshStandardMaterial({ color: L.color ?? '#ffffff', roughness: L.roughness ?? 1, metalness: L.metalness ?? 0,
        transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
      MATERIALS.set(key, m);
      if (L.wood && typeof document !== 'undefined') catalog.texture(L.wood.decor).then(t => {
        const map = new THREE.TextureLoader().load(t.faces[0], redraw);
        map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
        map.repeat.set(1000 / t.size[0], 1000 / t.size[1]);
        if (L.wood.vertical) map.rotation = Math.PI / 2;
        m.map = map; m.needsUpdate = true;
      });
    }
    return MATERIALS.get(key);
  }

  /* ---------- a prism: along x over its section; each face its material by its side (faces), uv in metres ---------- */
  /** @param {Part} p @returns {{ geometry: any, looks: string[] }} */
  function prismGeometry(p) {
    const [x1, x2] = /** @type {number[]} */ (p.x), P = /** @type {number[][]} */ (p.poly), F = p.faces, eaves = p.eaves;
    /** @type {number[]} */ const pos = [];
    /** @type {number[]} */ const nor = [];
    /** @type {number[]} */ const uv = [];
    /** @type {string[]} */ const looks = [];
    /** @type {{ start: number, count: number, look: number }[]} */ const groups = [];
    /** the face's material by its outward normal n and its points @param {number[]} n @param {number[][]} pts */
    const lookOf = (n, pts) => {
      if (!F) return p.material;
      if (n[2] > 0.3) return F.top;
      if (n[2] < -0.3) return F.bottom;
      if (Math.abs(n[0]) > 0.5) return F.ends;
      return eaves && pts.every(q => q[1] <= eaves[0] + 1e-6 || q[1] >= eaves[1] - 1e-6) ? F.eaves : F.reveals;
    };
    /** a convex face: its points (x, y, h), its outward normal @param {number[][]} pts @param {number[]} n */
    const face = (pts, n) => {
      const look = lookOf(n, pts);
      let k = looks.indexOf(look); if (k < 0) { k = looks.length; looks.push(look); }
      const start = pos.length / 3, ax = Math.abs(n[0]), ay = Math.abs(n[1]), ah = Math.abs(n[2]);
      const plane = ax >= ay && ax >= ah ? [1, 2] : ay >= ah ? [0, 2] : [0, 1];
      for (let i = 1; i < pts.length - 1; i++) {
        let tri = [pts[0], pts[i], pts[i + 1]];
        const u = tri[1].map((v, j) => v - tri[0][j]), w = tri[2].map((v, j) => v - tri[0][j]);
        const c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        if (c[0] * n[0] + c[1] * n[1] + c[2] * n[2] < 0) tri = [tri[0], tri[2], tri[1]];
        for (const q of tri) { pos.push(...q); nor.push(...n); uv.push(q[plane[0]] / 1000, q[plane[1]] / 1000); }
      }
      groups.push({ start, count: pos.length / 3 - start, look: k });
    };
    face(P.map(q => [x1, q[0], q[1]]), [-1, 0, 0]);
    face(P.map(q => [x2, q[0], q[1]]), [1, 0, 0]);
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], dy = b[0] - a[0], dh = b[1] - a[1], l = Math.hypot(dy, dh);
      if (l < 1e-9) continue;
      face([[x1, a[0], a[1]], [x2, a[0], a[1]], [x2, b[0], b[1]], [x1, b[0], b[1]]], [0, dh / l, -dy / l]);   // the section counter-clockwise: outward is to the right of a → b
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    for (const g of groups) geometry.addGroup(g.start, g.count, g.look);
    return { geometry, looks };
  }

  /* ---------- a part as a mesh, in its node's axes ---------- */
  /** @param {Part} p @param {string} look  its material's key */
  function mesh(p, look) {
    let geometry, at = [0, 0, 0];
    if (p.form === 'prism') {
      const g = prismGeometry(p), m = new THREE.Mesh(g.geometry, g.looks.length > 1 ? g.looks.map(material) : material(p.faces ? g.looks[0] : look));
      m.castShadow = m.receiveShadow = true;
      return m;
    } else if (p.form === 'box') {
      const [x0, x1, y0, y1, h0, h1] = /** @type {number[]} */ (p.box);
      geometry = new THREE.BoxGeometry(x1 - x0, y1 - y0, h1 - h0); at = [(x0 + x1) / 2, (y0 + y1) / 2, (h0 + h1) / 2];
    } else if (p.form === 'cylinder') {
      const [r0, r1] = /** @type {number[]} */ (p.radius);
      geometry = new THREE.CylinderGeometry(r1, r0, p.length, p.segments || 20, 1, !!p.open);
      at = /** @type {number[]} */ (p.at);
    } else { skipped++; return null; }
    const m = new THREE.Mesh(geometry, material(look));
    m.position.set(at[0], at[1], at[2]);
    if (p.form === 'cylinder') m.quaternion.setFromUnitVectors(UP, new THREE.Vector3(...(p.axis || [0, 0, 1])).normalize());
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  /* ---------- the branch shown ---------- */
  /** @type {Hierarchy | null} */
  let H = null;
  function clear() {
    for (const g of GROUPS.values()) { world.remove(g); g.traverse((/** @type {any} */ o) => o.geometry?.dispose()); }
    GROUPS.clear(); skipped = 0;
  }
  /**
   * Draws the branch of node, in node's axes.
   * @param {Hierarchy} hierarchy @param {Node} node
   */
  function show(hierarchy, node) {
    clear(); H = hierarchy;
    const zero = H.place(node);
    /** @param {Node} n */
    (function draw(n) {
      const product = n.product ? catalog.product(n.product) : null;
      const parts = n.parts || (product?.draw ? shapeOf(product, n.size, n.options).parts : null);
      if (parts?.length) {
        const g = new THREE.Group(), p = /** @type {Hierarchy} */ (H).place(n);
        g.position.set(p[0] - zero[0], p[1] - zero[1], p[2] - zero[2]);
        for (const part of parts) {
          const look = part.material === 'metal' ? metalOf(n) : part.material, m = mesh(part, look);
          if (!m) continue;
          Object.assign(m.userData, { node: n, layer: part.layer, floor: part.floor, finish: part.finish, look: m.material, raw: part.raw && material(part.raw) });
          g.add(m);
          if (edgeLook && part.edges !== false) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeLook); e.userData.edge = true; e.visible = showEdges; m.add(e); }
        }
        g.userData.node = n;
        world.add(g); GROUPS.set(n, g);
      }
      (n.children || []).forEach(draw);
    })(node);
    world.updateMatrixWorld(true);
    resize();
    view('front');
  }
  /** the fittings' metal where node stands: the setting metal @param {Node} n */
  function metalOf(n) {
    const m = H?.setting(n, 'metal')?.value;
    if (typeof m !== 'string') throw new Error(`scene: ${H?.path(n)}: a part in the fittings' metal, and no setting metal`);
    return m;
  }

  /* ---------- what the panel switches: a part shows when its layer and its floor (its own, else its node's) are on; with its
     finish's layer off, its raw material ---------- */
  /** @param {(key: string | undefined) => boolean} on  a layer's or a floor's key, or none (on) */
  function visible(on) {
    const h = /** @type {Hierarchy} */ (H);
    for (const [n, g] of GROUPS) for (const m of g.children) {
      const d = m.userData;
      m.visible = !!on(d.layer ?? h.layer(n)) && !!on(d.floor ?? h.floor(n));
      if (d.raw) m.material = on(d.finish) ? d.look : d.raw;
    }
    redraw();
  }
  /** @param {boolean} on */
  function showEdgesOf(on) { showEdges = on; for (const g of GROUPS.values()) g.traverse((/** @type {any} */ o) => { if (o.userData.edge) o.visible = on; }); redraw(); }

  /* ---------- the cameras: from the front (West), from the garden (East), from above (North up) ---------- */
  /** @param {'front' | 'garden' | 'above'} name */
  function view(name) {
    const box = new THREE.Box3();
    for (const g of GROUPS.values()) if (g.visible) box.expandByObject(g);
    if (box.isEmpty()) return;
    /* far enough that the box's sphere fits the narrower of the two angles of view */
    const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
    const v = camera.fov * DEG, narrow = Math.min(v, 2 * Math.atan(Math.tan(v / 2) * camera.aspect)), d = r / Math.sin(narrow / 2);
    const dir = new THREE.Vector3(...{ front: [-1, 0.35, 0.25], garden: [1, 0.35, -0.25], above: [0, 1, 0.01] }[name]).normalize();
    camera.position.copy(c).addScaledVector(dir, d);
    camera.lookAt(c);
    if (controls) { controls.target.copy(c); controls.update(); }
    redraw();
  }

  /* ---------- the renderer, the light, the sun: only with a canvas ---------- */
  /** @type {any} */ let renderer = null;
  /** @type {any} */ let controls = null;
  /** @type {any} */ let hemi = null;
  /** @type {any} */ let sun = null;
  let frame = 0;
  function redraw() { if (renderer && !frame) frame = requestAnimationFrame(() => { frame = 0; renderer.render(scene, camera); }); }
  if (canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    controls = new OrbitControls(camera, canvas);
    controls.addEventListener('change', redraw);
    if (light) {
      renderer.toneMappingExposure = light.exposure;
      scene.fog = new THREE.Fog(light.fog.color, light.fog.near * MM, light.fog.far * MM);
      scene.background = new THREE.Color(light.fog.color);
      hemi = new THREE.HemisphereLight(light.sky.color, light.sky.groundColor, light.sky.intensity * Math.PI);
      sun = new THREE.DirectionalLight(light.sun.color ?? '#ffffff', light.sun.intensity * Math.PI);
      const reach = light.sun.reach ?? 16;
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
   * The sun: azimuth from +x toward +y, elevation, brightness, clouds (the light's factors in proportion); by night none, a faint sky.
   * @param {Sun} s
   */
  function setSun(s) {
    if (!sun || !light) return;
    const az = s.az * DEG, el = s.el * DEG, box = new THREE.Box3();
    for (const g of GROUPS.values()) box.expandByObject(g);
    const centre = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)).applyMatrix4(AXES).normalize();
    sun.position.copy(centre).addScaledVector(dir, 40); sun.target.position.copy(centre);
    const C = light.clouds, toward = (/** @type {number} */ full) => 1 + (full - 1) * s.clouds;
    sun.visible = !s.night;
    sun.intensity = light.sun.intensity * Math.PI * s.k * toward(C.sun);
    hemi.intensity = light.sky.intensity * Math.PI * (s.night ? 0.14 : (0.6 + 0.4 * s.k) * toward(C.sky));
    sun.shadow.radius = toward(C.blur);
    redraw();
  }
  function dispose() { clear(); controls?.dispose(); renderer?.dispose(); for (const m of MATERIALS.values()) m.dispose(); }

  return {
    show, visible, view, resize, dispose, sun: setSun, edges: showEdgesOf,
    /** the view's camera */
    camera,
    /** a node's group: its meshes and their edges, in the branch's axes; none: not drawn @param {Node} n */
    group: (/** @type {Node} */ n) => GROUPS.get(n) || null,
    /** what is drawn: nodes, meshes, parts of a form not drawn yet */
    count() { let meshes = 0; for (const g of GROUPS.values()) meshes += g.children.length; return { nodes: GROUPS.size, meshes, skipped }; }
  };
}
