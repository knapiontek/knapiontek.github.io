/* core/scene.js: renderer, materials, meshes and edges of pieces, section caps, light, camera, navigation, walk, loop.
   Knows no project: the page hands it a material library, textures, the light, the edges and the body box.
   The model is built in mm (x along, y across, z up) and turned into the scene's metres with y up.
   Needs core/geometry.js, core/mesh.js, THREE and OrbitControls. */
(function (CORE) {
'use strict';
const { DEG, INF, zRange, cutBy, sectionAt, edgesOf } = CORE.geometry;
const { dot3, Batch } = CORE.mesh;

/* opts: {canvas, stage, materials (library: key -> {color, roughness, ...}), textures (key -> {faces: [image], size: [u, v] mm}),
   light, edges, body: [[x, y, z], [x, y, z]], sunCentre: [x, y, z]} */
const MM = 0.001;                          // the scene is in metres, the model in mm

CORE.createView = function (opts) {
  const { canvas, stage } = opts, MATERIAL_LIB = opts.materials, TEX = opts.textures;

  /* ================= RENDERER AND MATERIALS ================= */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  let needsRender = true;
  const redraw = () => { needsRender = true; };

  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; root.scale.setScalar(MM); scene.add(root);
  const toWorld = (x, y, z) => new THREE.Vector3(x * MM, z * MM, -y * MM);
  const CUT = new THREE.Plane(new THREE.Vector3(0, -1, 0), INF), CLIP = [CUT];

  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function hash01(...k) {                  // a stable random number: a layout looks the same every time
    let h = 2166136261;
    for (const v of k) { h ^= (v | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); h ^= h >>> 13; }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
  }
  function canvasTexture(w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }
  const loadImage = (src, fn) => { const im = new Image(); im.onload = () => fn(im); im.src = src; };
  function specks(g, w, h, strength, size) {
    for (let i = 0; i < w * h / (size * size) * 0.9; i++) {
      g.fillStyle = rnd() < 0.5 ? `rgba(0,0,0,${strength * 0.22 * rnd()})` : `rgba(255,255,255,${strength * 0.3 * rnd()})`;
      g.fillRect(rnd() * w, rnd() * h, size, size);
    }
  }
  /* generated surfaces: each sets the map of a material, uv in mm */
  const SURFACES = {
    texture(d, m) {
      m.map = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); specks(g, w, h, d.strength, d.grain); }, false);
      m.map.repeat.set(1 / d.tile, 1 / d.tile);
    },
    grass(d, m, def) {
      m.map = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = def.color; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `hsla(${80 + rnd() * 30},${30 + rnd() * 25}%,${25 + rnd() * 25}%,0.5)`; g.fillRect(rnd() * w, rnd() * h, 1, 2 + rnd() * 3); } });
      m.map.repeat.set(1 / d.tile, 1 / d.tile); m.color.set(0xffffff);
    },
    slabs(d, m, def) {
      m.map = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = def.color; g.fillRect(0, 0, w, h); specks(g, w, h, 0.5, 2); g.fillStyle = d.joint; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); });
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
    image(d, m) {                          // a photo of textures (a board decor), its size in mm; turn: its u runs along the face's v
      const T = TEX[d.key];
      loadImage(T.faces[0], im => {
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
    const o = { color: lin(def.color || '#ffffff'), roughness: def.roughness ?? 0.9, metalness: def.metalness || 0, envMapIntensity: def.reflect ?? 1, clippingPlanes: CLIP, clipShadows: true };
    if (def.emissive) Object.assign(o, { emissive: lin(def.emissive), emissiveIntensity: def.glow ?? 1 });
    const m = def.clearcoat === undefined ? new THREE.MeshStandardMaterial(o)   // a lacquer: a clear coat over the colour
      : new THREE.MeshPhysicalMaterial(Object.assign(o, { clearcoat: def.clearcoat, clearcoatRoughness: def.clearcoatRoughness ?? 0.5 }));
    if (def.opacity !== undefined) Object.assign(m, { transparent: true, opacity: def.opacity, depthWrite: false });
    for (const [k, make] of Object.entries(SURFACES)) if (def[k]) make(def[k], m, def);
    return (MATERIALS[key] = m);
  }
  /* a ready three.js material under a key, for a page whose look is its own (cells name it like any other) */
  const useMaterial = (key, m) => (MATERIALS[key] = m);
  const CAP_MATERIALS = {};
  const capMaterial = key => CAP_MATERIALS[key] || (CAP_MATERIALS[key] = new THREE.MeshLambertMaterial({ color: lin(MATERIAL_LIB[key].color), side: THREE.DoubleSide }));

  /* ================= MESHES AND EDGES OF PIECES ================= */
  /* One mesh per (layers, material, finish, cell.batch): cell.batch keeps apart what a page recolours on its own (a selected
     cabinet). parent: the root (model mm), or a group under it that moves (a door). */
  const GROUPS = [];                       // {mesh, cell, layers, finish: {layer, on, off} | null}
  function buildMeshes(pieces, parent = root) {
    const batches = new Map();
    for (const f of pieces) {
      const k = f.group + '|' + f.material + '|' + (f.cell.finish || '') + '|' + (f.cell.raw || '') + '|' + (f.cell.batch || '');
      if (!batches.has(k)) batches.set(k, { cell: f.cell, material: f.material, batch: new Batch() });
      batches.get(k).batch.polygon(f.poly, f.n, f.uv, f.cell);
    }
    for (const { cell, material: key, batch } of batches.values()) {
      const mesh = batch.mesh(material(key)); parent.add(mesh);
      const switchable = cell.finish && key !== cell.raw;   // a finished face shows its bare material while its finish layer is off
      GROUPS.push({ mesh, cell, layers: cell.layers, finish: switchable ? { layer: cell.finish, on: material(key), off: material(cell.raw) } : null });
    }
  }

  /* Edges from the topology of the pieces. For each segment between two welded points and each group on it: two pieces
     of the group in one plane are a seam (no line) unless they are of two parts (cell.part: two boards of a cabinet meet
     in a joint); two outside pieces at an angle are a corner (always a line); otherwise the line hides exactly while every
     group that closes it is shown. */
  const EDGE_GROUPS = [];
  const EDGE_PULL = 0.002;                 // 20 mm at 10 m: in front of the faces of its corner, behind any wall
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
    const mat = new THREE.LineBasicMaterial({ color: lin(E.color), transparent: true, opacity: E.opacity, clippingPlanes: CLIP });
    mat.onBeforeCompile = sh => {          // pulled toward the eye along its view ray: nothing lies between the eye and a visible edge
      sh.uniforms.edgePull = { value: EDGE_PULL };
      sh.vertexShader = 'uniform float edgePull;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n  mvPosition.xyz *= 1.0 - edgePull;\n  gl_Position = projectionMatrix * mvPosition;');
    };
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

  /* what a layer state shows: faces, finishes, edges */
  function showPieces(shown, layerOn) {
    for (const g of GROUPS) {
      g.mesh.visible = shown(g.layers);
      if (g.finish) g.mesh.material = layerOn(g.finish.layer) ? g.finish.on : g.finish.off;
    }
    for (const g of EDGE_GROUPS) g.mesh.visible = shown(g.layers) && !(g.hideWhen.length && g.hideWhen.every(shown));
  }

  /* ================= LIGHT AND CAMERA ================= */
  let hemi = null, sun = null;
  /* the sky behind the model: the house's gradient by day; by night (gradient null) a dark sky with stars and a glow
     over the horizon (the middle of the picture); the same in every application */
  const NIGHT = { fog: '#141a26', gradient: [[0, '#070b16'], [0.36, '#121a2e'], [0.47, '#24304a'], [0.5, '#3a3f52'], [0.52, '#151a22'], [1, '#0b0e13']], stars: 420 };
  let skyTexture = null, skyOf = null, nightTexture = null, dayEnvironment = null;
  function nightSky() {
    if (nightTexture) return nightTexture;
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // the same stars on every load
    nightTexture = canvasTexture(4096, 2048, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); for (const [t, c] of NIGHT.gradient) gr.addColorStop(t, c); g.fillStyle = gr; g.fillRect(0, 0, w, h);
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
  function addLight() {
    const LIGHT = opts.light, SKY = LIGHT.sky;
    renderer.toneMappingExposure = LIGHT.exposure;
    setSky(SKY.gradient);
    scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(skyTexture).texture;
    scene.fog = new THREE.Fog(lin(LIGHT.fog.color), LIGHT.fog.near * MM, LIGHT.fog.far * MM);
    hemi = new THREE.HemisphereLight(lin(SKY.color), lin(SKY.groundColor), SKY.intensity); scene.add(hemi);
    sun = new THREE.DirectionalLight(lin(LIGHT.sun.color), LIGHT.sun.intensity);
    const reach = LIGHT.sun.reach ?? 16;   // m around the sun's centre that its shadow covers
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 80 });
    scene.add(sun, sun.target);
  }
  /* s: {az, el, k}: azimuth from +x towards +y, elevation, brightness */
  /* the sun {az, el, k, night}: by night no sun, a faint sky light, the night sky and fog */
  function placeSun(s) {
    const LIGHT = opts.light, az = s.az * DEG, el = s.el * DEG;
    const centre = toWorld(...opts.sunCentre), dir = toWorld(Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)).divideScalar(MM);   // a unit direction, in metres
    sun.position.copy(centre).addScaledVector(dir, 40);
    sun.target.position.copy(centre);
    sun.visible = !s.night;
    dayEnvironment ||= scene.environment;
    scene.environment = s.night ? null : dayEnvironment;   // by night nothing reflects the day's sky
    sun.intensity = LIGHT.sun.intensity * s.k; hemi.intensity = LIGHT.sky.intensity * (s.night ? 0.14 : 0.6 + 0.4 * s.k);   // by night just enough to see the house's outline
    setSky(s.night ? null : LIGHT.sky.gradient);
    if (scene.fog) scene.fog.color.copy(lin(s.night ? NIGHT.fog : LIGHT.fog.color));
    redraw();
  }

  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 400);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.addEventListener('change', redraw);

  /* the body of the model: from outside it the camera turns about its centre */
  const BODY = new THREE.Box3().setFromPoints(opts.body.map(p => toWorld(...p)));
  const BODY_CENTRE = BODY.getCenter(new THREE.Vector3());

  function setCamera(c, level = 0) {
    camera.position.copy(toWorld(c.eye[0], c.eye[1], c.eye[2] + level));
    controls.target.copy(toWorld(c.target[0], c.target[1], c.target[2] + level));
    controls.update(); redraw();
  }

  /* ================= SECTION CAPS ================= */
  const CAP_BIAS = 0.5;                    // mm under the cut: a cap never lies in the plane of a face it closes
  let capGroup = null;
  function addCaps() { capGroup = new THREE.Group(); root.add(capGroup); }
  function buildCaps(h, solids, shown) {
    for (const m of capGroup.children.splice(0)) m.geometry.dispose();
    if (h === null) return;
    const batches = {}, up = [0, 0, 1], uv = v => [v[0], v[1]];
    for (const c of solids) {
      if (!shown(c.layers) || !cutBy(c.S, h)) continue;
      const y = sectionAt(c.S, h); if (!y) continue;
      (batches[c.cap] ||= new Batch()).polygon([[c.S.x1, y[0], h], [c.S.x2, y[0], h], [c.S.x2, y[1], h], [c.S.x1, y[1], h]], up, uv);
    }
    for (const [k, b] of Object.entries(batches)) { const m = b.mesh(capMaterial(k)); m.castShadow = false; m.position.z = -CAP_BIAS; capGroup.add(m); }
  }
  const setCut = h => { CUT.constant = h === null ? INF : h * MM; };

  /* ================= NAVIGATION =================
     The wheel zooms toward the surface under the cursor; the pivot stays in front of the camera: the body centre from
     outside, the surface in the middle of the view inside. */
  const walk = { on: false, keys: new Set(), last: 0, drag: null };
  const ray = new THREE.Raycaster();
  const ndcOf = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }; };
  const visibleChain = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  function surfaceAt(ndc) {                // the first drawn, uncut surface along the ray through a screen point
    ray.setFromCamera(ndc, camera);
    const meshes = []; root.traverse(o => { if (o.isMesh && visibleChain(o)) meshes.push(o); });
    const hit = ray.intersectObjects(meshes, false).find(h => CUT.distanceToPoint(h.point) >= 0);
    return hit ? hit.point : null;
  }
  /* a click (no drag) on the canvas: the page picks what is under it */
  function onClick(fn) {
    let downAt = null;
    canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', e => {
      if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5 || walk.on) return;
      ray.setFromCamera(ndcOf(e), camera);
      fn(ray);
    });
  }
  const ZOOM_IN = 0.2, ZOOM_OUT = 0.25, NEAREST = 0.05;   // fraction of the way per wheel notch; closest approach, m
  const viewAxis = () => new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
  const outside = () => !BODY.containsPoint(camera.position);
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
      seatTarget(outside() ? BODY_CENTRE : p, dir); controls.update(); redraw();
    }, { capture: true, passive: false });
    canvas.addEventListener('pointerdown', () => {
      if (walk.on) return;
      const p = outside() ? BODY_CENTRE : surfaceAt({ x: 0, y: 0 });
      if (p) { seatTarget(p); controls.update(); }
    });
  }

  /* ================= WALK =================
     w: {config, solids (what it bumps into), ground (walkable cells), startLevel, pad (element), canStart(), onToggle(), home (camera)} */
  let W = null, OBSTACLES = [], GROUND = [];
  function groundAt(x, y, z) {             // the highest walkable top under (x, y) within a step of z
    let best = null;
    for (const c of GROUND) {
      const S = c.S; if (x < S.x1 || x > S.x2) continue;
      const y12 = [Math.min(...S.poly.map(p => p[0])), Math.max(...S.poly.map(p => p[0]))]; if (y < y12[0] || y > y12[1]) continue;
      const top = zRange(S)[1]; if (top <= z + W.config.step && (best === null || top > best)) best = top;
    }
    return best;
  }
  const STEP_CLEAR = 10;                   // mm over a step: what is lower is walked onto, not bumped into
  function blocked(x, y, z) {
    const C = W.config, lo = z + C.step + STEP_CLEAR, hi = z + C.eye + C.headroom;
    return OBSTACLES.some(o => {
      if (o.z[1] < lo || o.z[0] > hi) return false;
      const ys = o.S.poly.map(p => p[0]), cx = Math.max(o.S.x1, Math.min(x, o.S.x2)), cy = Math.max(Math.min(...ys), Math.min(y, Math.max(...ys)));
      return (cx - x) ** 2 + (cy - y) ** 2 < C.radius ** 2;
    });
  }
  function placeWalkCamera() {
    const h = walk.heading * DEG, p = walk.pitch * DEG, eye = walk.z + W.config.eye;
    camera.position.copy(toWorld(walk.x, walk.y, eye));
    const ahead = 1000;                    // mm: a point in front of the eye to look at
    camera.lookAt(toWorld(walk.x + Math.cos(h) * Math.cos(p) * ahead, walk.y + Math.sin(h) * Math.cos(p) * ahead, eye + Math.sin(p) * ahead));
    redraw();
  }
  function startWalk() {
    walk.on = true; controls.enabled = false; walk.z = groundAt(walk.x, walk.y, W.startLevel) ?? W.startLevel;
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
      const h = walk.heading * DEG, dx = fwd * Math.cos(h) - side * Math.sin(h), dy = fwd * Math.sin(h) + side * Math.cos(h);
      const v = C.speed * fast * dt / Math.hypot(dx, dy), nx = walk.x + dx * v, ny = walk.y + dy * v;
      for (const [tx, ty] of [[nx, ny], [nx, walk.y], [walk.x, ny]]) {   // slide along a wall
        const g = groundAt(tx, ty, walk.z);
        if (g !== null && !blocked(tx, ty, g)) { Object.assign(walk, { x: tx, y: ty, z: g }); break; }
      }
    }
    placeWalkCamera();
  }
  function enableWalk(w) {
    W = w;
    Object.assign(walk, { x: w.config.start.x, y: w.config.start.y, z: 0, heading: w.config.start.heading, pitch: 0 });
    OBSTACLES = w.solids.map(c => ({ S: c.S, z: zRange(c.S) }));
    GROUND = w.ground;
    const keyName = e => e.key.length === 1 ? e.key.toLowerCase() : e.key;
    window.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,select')) return;
      if (w.canStart() && !walk.on && e.key === 'ArrowUp') startWalk();
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

  return { renderer, scene, root, camera, controls, lin, redraw, toWorld, MM, CUT, CLIP, hash01, canvasTexture, loadImage, material, useMaterial, capMaterial,
    buildMeshes, buildEdges, showPieces, GROUPS, EDGE_GROUPS, addLight, setSky, placeSun, setCamera, addCaps, buildCaps, setCut,
    onClick, enableNavigation, walk, enableWalk, startWalk, stopWalk, onFrame, start, run, get hemi() { return hemi; }, get sun() { return sun; } };
};
})(window.CORE = window.CORE || {});
