// @ts-check
/* core/scene.js: renderer, materials, meshes and edges of pieces, moving parts, light, camera, navigation,
   walk, loop. Knows no project: the page hands it a material library, textures, the light and the edges.
   The model is built in mm (x along, y across, h up) and turned into the scene's metres with y up.
   Needs core/geometry.js, core/surface.js, THREE and OrbitControls. */
(/** @param {Home} HOME */ function (HOME) {
'use strict';
const { DEG, hRange, edgesOf } = HOME.geometry;
const { sub3, dot3, cross3, weld } = HOME.surface;

/* opts: {canvas, stage, materials (key -> {color, roughness, ...}), textures (key -> {faces: [image], size: [u, v] mm}),
   light, edges, sunCentre: [x, y, h]} */
const MM = 0.001;                          // the scene is in metres, the model in mm

/* triangles of the pieces' convex polygons, batched per (layers, material) into one three.js mesh; uv in mm on the face
   plane. owner: what a triangle belongs to (a cell), so a pick can name it: mesh.userData.owners[faceIndex] */
class Batch {
  constructor() { this.p = []; this.n = []; this.uv = []; this.owners = []; }
  polygon(points, n, uv, owner) {          // a fan around the centre: no thin triangles from collinear points
    const c = [0, 1, 2].map(i => points.reduce((s, v) => s + v[i], 0) / points.length);
    for (let i = 0; i < points.length; i++) this.tri(c, points[i], points[(i + 1) % points.length], n, uv, owner);
  }
  tri(a, b, c, n, uv, owner) {
    if (dot3(cross3(sub3(b, a), sub3(c, a)), n) < 0) [b, c] = [c, b];
    for (const v of [a, b, c]) { const w = weld(v); this.p.push(...w); this.n.push(...n); this.uv.push(...uv(v)); }
    this.owners.push(owner);
  }
  mesh(mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    const m = new THREE.Mesh(g, mat); m.castShadow = !mat.transparent; m.receiveShadow = true;
    m.userData.owners = this.owners; return m;
  }
}

const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

function create(opts) {
  const { canvas, stage } = opts, MATERIAL_LIB = opts.materials, TEX = opts.textures;

  /* ================= RENDERER AND MATERIALS ================= */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.physicallyCorrectLights = true;   // lamps in physical units; a light in the old units is scaled (units())
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // its shadows take a radius: the clouds soften them
  const scene = new THREE.Scene();
  const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  let needsRender = true;
  const redraw = () => { needsRender = true; };

  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; root.scale.setScalar(MM); scene.add(root);
  const toWorld = (x, y, h) => new THREE.Vector3(x * MM, h * MM, -y * MM);

  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const hash01 = HOME.geometry.hash01;
  const CANVASES = new Map();               // a generated picture drawn once for its key (a core's colour), shared by its textures
  /** @param {number} w @param {number} h @param {(g: CanvasRenderingContext2D, w: number, h: number) => void} draw @param {boolean} [srgb] @param {string | null} [key] */
  function canvasTexture(w, h, draw, srgb = true, key = null) {
    let c = /** @type {HTMLCanvasElement | undefined} */ (key ? CANVASES.get(key) : undefined);
    if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h); if (key) CANVASES.set(key, c); }
    const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }
  const loadImage = (src, fn) => { const im = new Image(); im.onload = () => fn(im); im.src = src; };
  /* specks darker and lighter over what is drawn: squares of size px, blended into the pixels (wrapping round) */
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
  /* generated surfaces: each sets the map of a material, uv in mm */
  const SURFACES = {
    texture(d, m) {
      m.map = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); specks(g, w, h, d.strength, d.grain); }, false, `texture:${d.strength}:${d.grain}`);
      m.map.repeat.set(1 / d.tile, 1 / d.tile);
    },
    chipboard(d, m, def) {                 // the bare core of a chipboard: flakes lighter and darker than its colour, every way
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
    wood(d, m) {                           // boards cut at random from the decor photo, with a dark joint
      const T = TEX[d.decor], boards = 8, len = T.size[0], px = 0.4;   // px per mm of the board texture
      loadImage(T.faces[0], im => {
        const across = boards * d.board * px, along = len * px, sh = im.height * d.board / T.size[1];
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
      });
    },
    image(d, m) {                          // a photo of textures (a board decor), its size in mm; face: which of its images (0); turn: its u runs along the face's v
      const T = TEX[d.key];
      loadImage(T.faces[d.face || 0], im => {
        const t = new THREE.Texture(im); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (d.turn) { t.repeat.set(1 / T.size[1], 1 / T.size[0]); t.rotation = Math.PI / 2; } else t.repeat.set(1 / T.size[0], 1 / T.size[1]);
        t.needsUpdate = true; m.map = t; m.needsUpdate = true; redraw();
      });
    }
  };
  const MATERIALS = {};
  function material(key) {
    if (MATERIALS[key]) return MATERIALS[key];
    const def = MATERIAL_LIB[key];
    const o = { color: lin(def.color || '#ffffff'), roughness: def.roughness ?? 0.9, metalness: def.metalness || 0, envMapIntensity: def.reflect ?? 1,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };   // the faces a little back in depth, by the depth buffer's own steps at any distance: an edge on them shows, one behind them does not
    if (def.ahead) Object.assign(o, { polygonOffsetFactor: -1, polygonOffsetUnits: -4 });   // a face over another close behind it (a tile over its floor and grout): it wins at any distance
    if (def.emissive) Object.assign(o, { emissive: lin(def.emissive), emissiveIntensity: def.glow ?? 1 });
    const m = def.clearcoat === undefined ? new THREE.MeshStandardMaterial(o)   // a lacquer: a clear coat over the colour
      : new THREE.MeshPhysicalMaterial(Object.assign(o, { clearcoat: def.clearcoat, clearcoatRoughness: def.clearcoatRoughness ?? 0.5 }));
    if (def.opacity !== undefined) Object.assign(m, { transparent: true, opacity: def.opacity, depthWrite: false });
    for (const [k, make] of Object.entries(SURFACES)) if (def[k]) make(def[k], m, def);
    return (MATERIALS[key] = m);
  }
  /* a ready three.js material under a key, for a page whose look is its own (cells name it like any other) */
  const useMaterial = (key, m) => (MATERIALS[key] = m);

  /* ================= MESHES AND EDGES OF PIECES ================= */
  /* One mesh per (layers, material, finish, cell.batch): cell.batch keeps apart what a page recolours on its own (a selected
     cabinet). parent: the root (model mm), or a group under it that moves (a door). */
  const GROUPS = [];                       // {mesh, cell, layers, finish: {layer, on, off} | null}
  function buildMeshes(pieces, parent = root) {
    const batches = new Map(), made = [];
    for (const f of pieces) {
      const k = f.group + '|' + f.material + '|' + (f.cell.finish || '') + '|' + (f.cell.raw || '') + '|' + (f.cell.batch || '');
      if (!batches.has(k)) batches.set(k, { cell: f.cell, material: f.material, batch: new Batch() });
      batches.get(k).batch.polygon(f.poly, f.n, f.uv, f.cell);
    }
    for (const { cell, material: key, batch } of batches.values()) {
      const mesh = batch.mesh(material(key)); parent.add(mesh);
      const switchable = cell.finish && key !== cell.raw;   // a finished face shows its bare material while its finish layer is off
      const g = { mesh, cell, layers: cell.layers, base: mesh.material, finish: switchable ? { layer: cell.finish, on: material(key), off: material(cell.raw) } : null };
      GROUPS.push(g); made.push(g);
    }
    return made;
  }
  /* meshes of buildMeshes taken back (a host drawn again with the finishes of a part) */
  function removeMeshes(made) {
    for (const g of made) { g.mesh.parent.remove(g.mesh); g.mesh.geometry.dispose(); GROUPS.splice(GROUPS.indexOf(g), 1); }
    redraw();
  }

  /* ================= MOVING PARTS =================
     A door or a drawer: its pieces, built once and closed, under a pivot that turns about an axis or slides; the
     animation only moves the pivot. part: {pieces, at: [x, y, h] a point of the axis, axis: [x, y, h] a unit vector and
     angle (degrees, by the right hand about the axis), or slide: [x, y, h] mm; behind: the part that must be open first} */
  const MOVERS = [], MOVE_SPEED = 1.8;     // of the whole way per second
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;   // then a part and a flight move at once
  function mover(part) {
    const at = part.at || [0, 0, 0], pivot = new THREE.Group(), inner = new THREE.Group();
    pivot.position.set(...at); inner.position.set(-at[0], -at[1], -at[2]); pivot.add(inner); root.add(pivot);
    buildMeshes(part.pieces, inner); buildEdges(part.pieces, inner);
    const m = Object.assign({}, part, { at, pivot, inner, progress: 0, goal: 0, children: [] });
    if (m.behind) m.behind.children.push(m);
    pivot.userData.mover = m; MOVERS.push(m);
    return m;
  }
  function pose(m) {
    const e = ease(m.progress);
    if (m.slide) m.pivot.position.set(m.at[0] + e * m.slide[0], m.at[1] + e * m.slide[1], m.at[2] + e * m.slide[2]);
    else m.pivot.quaternion.setFromAxisAngle(new THREE.Vector3(...m.axis), e * m.angle * DEG);
  }
  function setGoal(m, goal) { m.goal = goal; if (reducedMotion) { m.progress = goal; pose(m); } redraw(); }
  /* on: true, false, or undefined to switch; a part behind a closed one opens that one first; closing closes what is behind */
  function toggle(m, on) {
    const goal = on === undefined ? (m.goal ? 0 : 1) : on ? 1 : 0;
    if (goal && m.behind && !m.behind.goal) return setGoal(m.behind, 1);
    setGoal(m, goal);
    if (!goal) for (const c of m.children) toggle(c, false);
  }
  /* every moving part opened (on) or closed */
  function toggleAll(on) { for (const m of MOVERS) toggle(m, on); }
  /* the moving part a ray meets first, before anything else drawn; null when none */
  function moverAt(ray) {
    const meshes = [];
    const moving = o => { for (let p = o; p; p = p.parent) if (p.userData.mover) return true; return false; };
    /* glass is seen through, so a click passes it; a moving one (a shower's door) is still taken */
    root.traverse(o => { if (o.isMesh && visibleChain(o) && o.material !== GHOST && (!(o.material.transparent && o.material.opacity < 0.5) || moving(o))) meshes.push(o); });
    const hit = ray.intersectObjects(meshes, false)[0];
    for (let o = hit && hit.object; o; o = o.parent) if (o.userData.mover) return o.userData.mover;
    return null;
  }

  /* Edges from the topology of the pieces. For each segment between two welded points and each group on it: two pieces
     of the group in one plane are a seam (no line) unless they are of two parts (cell.part: two boards of a cabinet meet
     in a joint); two outside pieces at an angle are a corner (always a line); otherwise the line hides exactly while every
     group that closes it is shown. */
  const EDGE_GROUPS = [];
  function buildEdges(pieces, parent = root) {
    const E = opts.edges, segs = new Map();
    for (const f of pieces) {
      if (!f.cell.edges) continue;
      for (const [a, b] of edgesOf(f.poly)) {
        const k = Math.min(a.id, b.id) + '-' + Math.max(a.id, b.id);
        if (!segs.has(k)) segs.set(k, { a, b, on: [] });
        segs.get(k).on.push(f);
      }
    }
    const mat = new THREE.LineBasicMaterial({ color: lin(E.color), transparent: true, opacity: E.opacity });
    const same = (m, n) => dot3(m, n) > 1 - 1e-9;
    const lines = new Map();
    for (const s of segs.values()) {
      const groups = new Map();
      for (const f of s.on) { if (!groups.has(f.group)) groups.set(f.group, []); groups.get(f.group).push(f); }
      for (const [g, fs] of groups) {
        if (fs.length === 2 && same(fs[0].n, fs[1].n) && fs[0].cell.part === fs[1].cell.part) continue;   // a seam
        const outside = fs.filter(f => !f.cover), unless = fs.filter(f => f.cover).map(f => f.cover);
        let always = outside.length >= 2;                                   // a corner of the group
        if (outside.length === 1) {
          const next = s.on.find(o => o.group !== g && !o.cover && same(o.n, outside[0].n));
          if (next) unless.push(next.cell.layers); else always = true;      // nothing continues it: a corner against another group
        }
        const layers = fs[0].cell.layers.concat(E.layers);
        const hideWhen = always ? [] : [...new Map(unless.map(u => [u.join('+'), u])).values()];
        const k = layers.join('+') + '!' + hideWhen.map(u => u.join('+')).sort().join('/');
        if (!lines.has(k)) lines.set(k, { layers, hideWhen, p: [] });
        lines.get(k).p.push(...s.a, ...s.b);
      }
    }
    for (const v of lines.values()) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v.p, 3));
      const mesh = new THREE.LineSegments(geo, mat); parent.add(mesh);
      EDGE_GROUPS.push({ mesh, layers: v.layers, hideWhen: v.hideWhen });
    }
  }

  /* what a layer state shows: faces, finishes, edges, ghosts */
  /* ghost(layers): shown, but drawn as a ghost: not seen, still casting its shadow (a wall in front of the camera) */
  const GHOST = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  function showPieces(shown, layerOn, ghost = /** @type {(layers: string[]) => boolean} */ (() => false)) {
    for (const g of GROUPS) {
      g.mesh.visible = shown(g.layers);
      g.mesh.material = g.mesh.visible && ghost(g.layers) ? GHOST : g.finish ? (layerOn(g.finish.layer) ? g.finish.on : g.finish.off) : g.base;
    }
    const closes = layers => shown(layers) && !ghost(layers);   // a ghost closes no line: what it would cover shows its edge
    for (const g of EDGE_GROUPS) g.mesh.visible = closes(g.layers) && !(g.hideWhen.length && g.hideWhen.every(closes));
  }
  /* the camera's place in the house's axes, mm */
  const cameraAt = () => { const p = root.worldToLocal(camera.position.clone()); return [p.x, p.y, p.z]; };

  /* ================= LIGHT AND CAMERA ================= */
  let hemi = null, sun = null, MARKER = null;
  /* the sun's and the sky's intensities as given: physical, or the old units (three's legacy lights: π less) */
  const units = () => (opts.physical ? 1 : Math.PI);   // MARKER: the pivot's mark of the navigation
  /* the sky behind the model: the light's gradient by day; by night (gradient null) a dark sky with stars and a glow
     over the horizon (the middle of the picture); the same on every page */
  const NIGHT = { fog: '#141a26', gradient: [[0, '#070b16'], [0.36, '#121a2e'], [0.47, '#24304a'], [0.5, '#3a3f52'], [0.52, '#151a22'], [1, '#0b0e13']], stars: 420 };
  let skyTexture = null, skyOf = null, nightTexture = null, dayEnvironment = null;
  function nightSky() {
    if (nightTexture) return nightTexture;
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // the same stars on every load
    nightTexture = canvasTexture(4096, 2048, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); for (const [t, c] of NIGHT.gradient) gr.addColorStop(/** @type {number} */ (t), /** @type {string} */ (c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < NIGHT.stars; i++) {
        const y = (0.12 + 0.34 * random()) * h;   // from well under the zenith (no stretching) down to the glow over the horizon
        g.fillStyle = `rgba(255,255,255,${0.45 + 0.55 * random()})`;
        g.fillRect(random() * w, y, 2, 2);
      }
    });
    nightTexture.mapping = THREE.EquirectangularReflectionMapping;
    nightTexture.generateMipmaps = false; nightTexture.minFilter = THREE.LinearFilter;   // sharp points, not smudges
    return nightTexture;
  }
  function setSky(gradient) {
    if (!gradient) { scene.background = nightSky(); return redraw(); }
    if (skyOf !== gradient) {
      skyTexture = canvasTexture(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); for (const [t, c] of gradient) gr.addColorStop(t, c); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      skyTexture.mapping = THREE.EquirectangularReflectionMapping; skyOf = gradient;
    }
    scene.background = skyTexture; redraw();
  }
  /* the light of another view (the house's, a room's): light, the centre the sun's shadow covers, its sun and sky in physical
     units or not (the renderer is always physical: the shaders are made once for every view) */
  function relight(light, sunCentre, physical) {
    Object.assign(opts, { light, sunCentre });
    if (hemi) scene.remove(hemi);
    if (sun) scene.remove(sun, sun.target);
    if (scene.environment) scene.environment.dispose();
    opts.physical = physical;
    addLight();
  }
  /* everything drawn taken away (another view is built in the same scene): meshes, edges, moving parts, lamps */
  function clear() {
    const keep = new Set([root, hemi, sun, sun && sun.target, MARKER]);
    for (const o of [...root.children, ...scene.children.filter(o => !keep.has(o))]) {
      o.parent.remove(o); o.traverse(x => { if (x.geometry) x.geometry.dispose(); });
    }
    GROUPS.length = 0; EDGE_GROUPS.length = 0; MOVERS.length = 0; flight = null; redraw();
  }
  function addLight() {
    const LIGHT = opts.light, SKY = LIGHT.sky;
    renderer.toneMappingExposure = LIGHT.exposure;
    setSky(SKY.gradient);
    scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(skyTexture).texture;
    scene.fog = new THREE.Fog(lin(LIGHT.fog.color), LIGHT.fog.near * MM, LIGHT.fog.far * MM);
    hemi = new THREE.HemisphereLight(lin(SKY.color), lin(SKY.groundColor), SKY.intensity * units()); scene.add(hemi);
    sun = new THREE.DirectionalLight(lin(LIGHT.sun.color), LIGHT.sun.intensity * units());
    const reach = LIGHT.sun.reach ?? 16;   // m around the sun's centre that its shadow covers
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 80 });
    scene.add(sun, sun.target);
  }
  /* the sun {az, el, k, clouds, night}: azimuth from +x towards +y, elevation, brightness, clouds from 0 (clear) to 1
     (overcast: the light's clouds give the sun's and the sky's factors and the shadow's blur then; between, in proportion);
     by night no sun, a faint sky light, the night sky and fog */
  function placeSun(s) {
    const LIGHT = opts.light, az = s.az * DEG, el = s.el * DEG;
    const centre = toWorld(...opts.sunCentre), dir = toWorld(Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)).divideScalar(MM);   // a unit direction, in metres
    sun.position.copy(centre).addScaledVector(dir, 40);
    sun.target.position.copy(centre);
    sun.visible = !s.night;
    dayEnvironment ||= scene.environment;
    scene.environment = s.night ? null : dayEnvironment;   // by night nothing reflects the day's sky
    const C = LIGHT.clouds, c = s.clouds, toward = full => 1 + (full - 1) * c;
    sun.intensity = LIGHT.sun.intensity * units() * s.k * toward(C.sun);
    hemi.intensity = LIGHT.sky.intensity * units() * (s.night ? 0.14 : (0.6 + 0.4 * s.k) * toward(C.sky));   // by night just enough to see the house's outline
    sun.shadow.radius = toward(C.blur);
    setSky(s.night ? null : LIGHT.sky.gradient);
    if (scene.fog) scene.fog.color.copy(lin(s.night ? NIGHT.fog : LIGHT.fog.color));
    redraw();
  }

  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 400);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.addEventListener('change', redraw);


  function setCamera(c, level = 0) {
    camera.position.copy(toWorld(c.eye[0], c.eye[1], c.eye[2] + level));
    controls.target.copy(toWorld(c.target[0], c.target[1], c.target[2] + level));
    controls.update(); redraw();
  }

  /* ================= NAVIGATION =================
     The wheel zooms toward the surface under the cursor. A drag with the left button turns the view about the point under
     the cursor where the drag starts (a dot marks it while it turns; on no surface, about the point it turned about last);
     the right button moves the view at the depth of what is under the cursor. */
  const walk = { on: false, keys: new Set(), last: 0, drag: /** @type {number[]|null} */ (null) };
  const ray = new THREE.Raycaster();
  const ndcOf = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }; };
  const visibleChain = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  function surfaceAt(ndc) {                // the first drawn surface along the ray through a screen point
    ray.setFromCamera(ndc, camera);
    const meshes = []; root.traverse(o => { if (o.isMesh && visibleChain(o) && o.material !== GHOST) meshes.push(o); });
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? hit.point : null;
  }
  /* a click (no drag) on the canvas: the page picks what is under it */
  function onClick(fn) {
    let downAt = null;
    canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', e => {
      if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;   // a click, not a drag (also on a walk)
      ray.setFromCamera(ndcOf(e), camera);
      fn(ray);
    });
  }
  const ZOOM_IN = 0.2, ZOOM_OUT = 0.25, NEAREST = 0.05;   // fraction of the way per wheel notch; closest approach, m
  const viewAxis = () => new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
  function seatTarget(point, dir = viewAxis()) {   // the target moves along the view axis to the depth of the point: no jump
    const depth = Math.max(new THREE.Vector3().subVectors(point, camera.position).dot(dir), NEAREST);
    controls.target.copy(camera.position).addScaledVector(dir, depth);
  }
  function enableNavigation() {
    canvas.parentElement.addEventListener('wheel', e => {   // captured before OrbitControls
      if (e.target !== canvas || walk.on) return;
      e.preventDefault(); e.stopPropagation();
      const p = surfaceAt(ndcOf(e)) || ray.ray.at(camera.position.distanceTo(controls.target), new THREE.Vector3());
      const notches = Math.min(Math.abs(e.deltaY) * (e.deltaMode === 1 ? 33 : 1) / 100, 3);   // a mouse notch is 1, a touchpad many small ones
      const k = e.deltaY < 0 ? 1 - Math.pow(1 - ZOOM_IN, notches) : 1 - Math.pow(1 + ZOOM_OUT, notches);
      if (k > 0 && camera.position.distanceTo(p) * (1 - k) < NEAREST) return;
      const dir = viewAxis();              // taken before the move: the camera slides, it does not turn
      camera.position.lerp(p, k);
      seatTarget(p, dir); controls.update(); redraw();
    }, { capture: true, passive: false });
    controls.enableRotate = false;           // the turn is ours: about the point under the cursor
    const UP = new THREE.Vector3(0, 1, 0), SPEED = 2 * Math.PI, pointers = new Set();
    const marker = MARKER = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd9822b, depthTest: false, transparent: true, opacity: 0.85 }));
    marker.renderOrder = 999; marker.visible = false; scene.add(marker);
    const showMarker = p => { marker.position.copy(p); marker.scale.setScalar(Math.max(camera.position.distanceTo(p) * 0.008, 0.004)); marker.visible = true; redraw(); };
    let orbit = null, pivot = null;
    canvas.addEventListener('pointerdown', e => {
      pointers.add(e.pointerId);
      if (walk.on) return;
      if (pointers.size > 1) { orbit = null; marker.visible = false; redraw(); return; }   // two fingers: the controls zoom and move
      const p = surfaceAt(ndcOf(e));
      if (e.button === 2) { if (p) { seatTarget(p); controls.update(); } return; }   // the move follows what is under the cursor
      if (e.button !== 0) return;
      pivot = p || pivot || controls.target.clone();
      orbit = { x: e.clientX, y: e.clientY };
      showMarker(pivot);
    });
    canvas.addEventListener('pointermove', e => {
      if (!orbit || walk.on) return;
      const h = canvas.clientHeight || 1, yaw = -SPEED * (e.clientX - orbit.x) / h, pitch = -SPEED * (e.clientY - orbit.y) / h;
      orbit.x = e.clientX; orbit.y = e.clientY;
      const turn = (axis, angle) => {
        const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        camera.position.sub(pivot).applyQuaternion(q).add(pivot);
        camera.quaternion.premultiply(q);
      };
      turn(UP, yaw);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const next = forward.clone().applyAxisAngle(right, pitch);
      if (Math.abs(next.y) < 0.995) turn(right, pitch);   // never over the top: the view stays upright
      const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      controls.target.copy(camera.position).addScaledVector(ahead, Math.max(camera.position.distanceTo(pivot), NEAREST));
      controls.update(); showMarker(pivot);
    });
    const end = e => { pointers.delete(e.pointerId); if (orbit) { orbit = null; marker.visible = false; redraw(); } };
    for (const k of ['pointerup', 'pointercancel', 'pointerleave']) canvas.addEventListener(k, end);
  }

  /* ================= WALK =================
     w: {config, solids (what it bumps into), more() (more it bumps into, when the walk starts: boxes, as boxes gives them),
         ground (walkable cells), startLevel, pad (element), canStart(), onToggle(), home (camera)}; parts not fully open
     stop it too */
  let W = null, OBSTACLES = [], GROUND = [];
  /* boxes [x1, x2, y1, y2, h1, h2] in house axes (mm) of cells (their solids) and of the meshes of objects that show */
  function boxes(cells, objects = []) {
    const out = cells.map(c => { const ys = c.S.poly.map(p => p[0]), h = hRange(c.S); return [c.S.x1, c.S.x2, Math.min(...ys), Math.max(...ys), h[0], h[1]]; });
    const shows = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    for (const o of objects) o.traverse(m => {
      if (!m.isMesh || !shows(m)) return;
      const b = new THREE.Box3().setFromObject(m); if (b.isEmpty()) return;
      const a = root.worldToLocal(b.min.clone()), c = root.worldToLocal(b.max.clone());
      out.push([Math.min(a.x, c.x), Math.max(a.x, c.x), Math.min(a.y, c.y), Math.max(a.y, c.y), Math.min(a.z, c.z), Math.max(a.z, c.z)]);
    });
    return out;
  }
  const obstacle = ([x1, x2, y1, y2, h1, h2]) => ({ x1, x2, y1, y2, h: [h1, h2] });
  let BASE = [];
  function groundAt(x, y, h) {             // the highest walkable top under (x, y) within a step up of h
    let best = null;
    for (const c of GROUND) {
      const S = c.S; if (x < S.x1 || x > S.x2) continue;
      const y12 = [Math.min(...S.poly.map(p => p[0])), Math.max(...S.poly.map(p => p[0]))]; if (y < y12[0] || y > y12[1]) continue;
      const top = hRange(S)[1]; if (top <= h + W.config.step && (best === null || top > best)) best = top;
    }
    return best;
  }
  const STEP_CLEAR = 10;                   // mm over a step: what is lower is walked onto, not bumped into
  const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
  const inReach = (o, h) => { const C = W.config; return o.h[1] >= h + C.step + STEP_CLEAR && o.h[0] <= h + C.eye + C.headroom; };
  function blocked(x, y, h) {
    const r = W.config.radius - 1;         // what pushOut leaves touching is free
    return OBSTACLES.some(o => inReach(o, h) && (clamp(x, o.x1, o.x2) - x) ** 2 + (clamp(y, o.y1, o.y2) - y) ** 2 < r * r);
  }
  /* the body (a circle of the radius) pushed out of every solid it overlaps, by the shortest way: along a wall it slides,
     at the corner of a jamb it turns into the doorway */
  function pushOut(x, y, h) {
    const r = W.config.radius;
    for (let round = 0; round < 4; round++) {
      let moved = false;
      for (const o of OBSTACLES) {
        if (x < o.x1 - r || x > o.x2 + r || y < o.y1 - r || y > o.y2 + r || !inReach(o, h)) continue;
        const cx = clamp(x, o.x1, o.x2), cy = clamp(y, o.y1, o.y2), dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d >= r) continue;
        if (d > 1e-6) { x = cx + dx / d * r; y = cy + dy / d * r; }
        else {                             // the centre inside: out by the nearest side
          const [, ox, oy] = [[x - o.x1, -1, 0], [o.x2 - x, 1, 0], [y - o.y1, 0, -1], [o.y2 - y, 0, 1]].sort((a, b) => a[0] - b[0])[0];
          x = ox ? (ox < 0 ? o.x1 : o.x2) + ox * r : x; y = oy ? (oy < 0 ? o.y1 : o.y2) + oy * r : y;
        }
        moved = true;
      }
      if (!moved) break;
    }
    return [x, y];
  }
  function placeWalkCamera() {
    const a = walk.heading * DEG, p = walk.pitch * DEG, eye = walk.h + W.config.eye;
    camera.position.copy(toWorld(walk.x, walk.y, eye));
    const ahead = 1000;                    // mm: a point in front of the eye to look at
    camera.lookAt(toWorld(walk.x + Math.cos(a) * Math.cos(p) * ahead, walk.y + Math.sin(a) * Math.cos(p) * ahead, eye + Math.sin(p) * ahead));
    redraw();
  }
  /* what it bumps into: the solids, the parts not fully open (as closed) and what more() gives now */
  const refreshObstacles = () => {
    const closed = boxes(MOVERS.filter(m => m.progress < 1).flatMap(m => m.pieces.map(f => f.cell)).filter((c, i, a) => a.indexOf(c) === i));
    OBSTACLES = BASE.concat(closed.map(obstacle), (W.more ? W.more() : []).map(obstacle));
  };
  function startWalk() {
    refreshObstacles();
    walk.on = true; controls.enabled = false; walk.h = groundAt(walk.x, walk.y, W.startLevel) ?? W.startLevel;
    W.pad.hidden = false; W.onToggle(); placeWalkCamera();
  }
  function stopWalk() {
    if (!walk.on) return;
    walk.on = false; controls.enabled = true; W.pad.hidden = true; W.onToggle();
    setCamera(W.home());
  }
  /* each key: what it changes per second */
  const WALK_KEYS = {
    ArrowLeft: (dt, f) => { walk.heading += W.config.turn * dt * f; },
    ArrowRight: (dt, f) => { walk.heading -= W.config.turn * dt * f; },
    PageUp: dt => { walk.pitch = Math.min(60, walk.pitch + W.config.look * dt); },
    PageDown: dt => { walk.pitch = Math.max(-60, walk.pitch - W.config.look * dt); },
    ArrowUp: () => [1, 0], ArrowDown: () => [-1, 0], a: () => [0, 1], d: () => [0, -1], Shift: () => {}
  };
  function stepWalk(dt) {
    const C = W.config, fast = walk.keys.has('Shift') ? C.run : 1;
    let fwd = 0, side = 0;
    for (const k of walk.keys) { const m = WALK_KEYS[k](dt, fast); if (m) { fwd += m[0]; side += m[1]; } }
    if (fwd || side) {
      const a = walk.heading * DEG, dx = fwd * Math.cos(a) - side * Math.sin(a), dy = fwd * Math.sin(a) + side * Math.cos(a);
      const v = C.speed * fast * dt / Math.hypot(dx, dy), steps = Math.ceil(Math.hypot(dx, dy) * v / (C.radius / 3));   // never through a wall
      /* each small step: out of what it walks into (the shortest way, so it slides along a wall), onto the floor there
         (at most a step up); no floor, or still inside something: it stands */
      for (let i = 0; i < steps; i++) {
        const [tx, ty] = pushOut(walk.x + dx * v / steps, walk.y + dy * v / steps, walk.h), g = groundAt(tx, ty, walk.h);
        if (g === null || blocked(tx, ty, g)) break;
        Object.assign(walk, { x: tx, y: ty, h: g });
      }
    }
    placeWalkCamera();
  }
  /* again for another view: its walk; the keys and the pad are listened to once */
  function enableWalk(w) {
    const first = !W;
    W = w;
    Object.assign(walk, { x: w.config.start.x, y: w.config.start.y, h: 0, heading: w.config.start.heading, pitch: 0 });
    OBSTACLES = BASE = boxes(w.solids).map(obstacle);
    GROUND = w.ground;
    if (!first) return;
    const keyName = e => e.key.length === 1 ? e.key.toLowerCase() : e.key;
    window.addEventListener('keydown', e => {
      if (e.target instanceof Element && e.target.closest('input,select')) return;
      if (W.canStart() && !walk.on && e.key === 'ArrowUp') startWalk();
      if (!walk.on) return;
      if (e.key === 'Escape') return stopWalk();
      if (WALK_KEYS[keyName(e)]) { walk.keys.add(keyName(e)); e.preventDefault(); }
    });
    window.addEventListener('keyup', e => walk.keys.delete(keyName(e)));
    for (const b of w.pad.querySelectorAll('button')) {
      b.addEventListener('pointerdown', e => { e.preventDefault(); walk.keys.add(b.dataset.k); });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => walk.keys.delete(b.dataset.k));
    }
    canvas.addEventListener('pointerdown', e => { if (walk.on) walk.drag = [e.clientX, e.clientY]; });
    window.addEventListener('pointermove', e => {
      if (!walk.on || !walk.drag) return;
      walk.heading -= (e.clientX - walk.drag[0]) * 0.25;
      walk.pitch = Math.max(-60, Math.min(60, walk.pitch - (e.clientY - walk.drag[1]) * 0.25));
      walk.drag = [e.clientX, e.clientY]; placeWalkCamera();
    });
    window.addEventListener('pointerup', () => { walk.drag = null; });
  }

  /* ================= LOOP =================
     It draws only after a change. A page that animates (doors, a camera flight) adds a step: fn(dt) runs every frame and
     returns true while something moved. */
  const STEPS = [];
  const onFrame = fn => STEPS.push(fn);
  onFrame(dt => {                          // the moving parts toward their goals
    let moved = false;
    for (const m of MOVERS) {
      if (m.progress === m.goal) continue;
      m.progress = m.goal > m.progress ? Math.min(m.goal, m.progress + dt * MOVE_SPEED) : Math.max(m.goal, m.progress - dt * MOVE_SPEED);
      pose(m); moved = true;
    }
    if (moved && walk.on) refreshObstacles();
    return moved;
  });
  /* a camera flight to c (as setCamera), eased; at once when instant or when the viewer asks for reduced motion */
  const FLIGHT_MS = 900;
  let flight = null;
  function flyTo(c, instant = false, level = 0) {
    if (instant || reducedMotion) { flight = null; setCamera(c, level); return; }
    flight = { p0: camera.position.clone(), t0: controls.target.clone(), s: performance.now(),
      p: toWorld(c.eye[0], c.eye[1], c.eye[2] + level), t: toWorld(c.target[0], c.target[1], c.target[2] + level) };
    redraw();
  }
  onFrame(() => {
    if (!flight) return false;
    const k = Math.min(1, (performance.now() - flight.s) / FLIGHT_MS), e = ease(k);
    camera.position.lerpVectors(flight.p0, flight.p, e); controls.target.lerpVectors(flight.t0, flight.t, e);
    if (k >= 1) flight = null;
    return true;
  });
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); redraw();
  }
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (t - (walk.last || t)) / 1000); walk.last = t;
    if (walk.on && walk.keys.size) stepWalk(dt);
    for (const step of STEPS) if (step(dt)) needsRender = true;
    if (!walk.on) controls.update();
    if (needsRender) { needsRender = false; renderer.render(scene, camera); }
  }
  function start() { new ResizeObserver(resize).observe(stage); resize(); }
  const run = () => requestAnimationFrame(frame);

  return { renderer, scene, root, camera, controls, lin, redraw, toWorld, MM, hash01, canvasTexture, loadImage, material, useMaterial,
    buildMeshes, removeMeshes, buildEdges, showPieces, clear, relight, cameraAt, GROUPS, EDGE_GROUPS, mover, toggle, toggleAll, moverAt, MOVERS, addLight, setSky, placeSun, setCamera, flyTo, reducedMotion,
    onClick, enableNavigation, walk, boxes, enableWalk, startWalk, stopWalk, refreshObstacles, stepWalk, onFrame, start, run,
    get hemi() { return hemi; }, get sun() { return sun; } };
}

HOME.scene = { create };
})(window.HOME = window.HOME || {});
