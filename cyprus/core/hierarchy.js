// @ts-check
// core/hierarchy.js: the hierarchy of nodes, built from its root down: whoever builds a branch adds it under a node already in
// it (add). A node's place is its parent's place plus its offset, in the parent's axes; a node's axes may be its parent's
// turned about h by quarter turns (turn: no trigonometry, an integer matrix); every axes right-handed. Its settings are the defaults of its branch; its layer (what
// it is) and its floor (where it is) are its own, or else its parent's. It says what belongs to what (where a thing stands or hangs), not what lies inside
// what: a child may stand outside its parent (a sink over its carcass). Knows no project and nothing of what a node is: its
// type is only a name here.

/**
 * @typedef {object} HierarchyNode  a node
 * @property {string} id  letters, digits, - and _: one step of a path
 * @property {string} [name]
 * @property {string} type
 * @property {number[]} offset  [x, y, h] mm: its zero in its parent's axes
 * @property {number} [turn]  its axes: its parent's turned about h by quarter turns, counterclockwise (0 to 3); none: 0
 * @property {number[]} size  [x, y, h] mm
 * @property {Record<string, any>} [settings]  the defaults of its branch
 * @property {string[]} [refs]  the paths of the nodes it refers to (what for, its type says)
 * @property {string} [layer]  what it is, as the panel switches it; none: its parent's
 * @property {string} [floor]  the floor it is on; none: its parent's
 * @property {HierarchyNode[]} [children]
 */
/** @typedef {{ name: string, about: string, items: string[], info?: boolean }} Check  OK when items is empty; info: to know, not to correct */

const AXES = ['x', 'y', 'h'];
/** a point turned about h by quarter turns, counterclockwise @param {number[]} v @param {number} t @returns {number[]} */
export function turned([x, y, h], t) {
  const k = ((t % 4) + 4) % 4;
  return k === 0 ? [x, y, h] : k === 1 ? [-y, x, h] : k === 2 ? [-x, -y, h] : [y, -x, h];
}
const ID = /^[A-Za-z0-9_-]+$/;   // no spaces, no '/': an id is a step of a path

/**
 * A hierarchy from root and what lies under it already; add grows it. Nodes are not changed, but for the children add puts
 * under them.
 * @template {HierarchyNode} N
 * @param {N} root
 */
export function createHierarchy(root) {
  /** @type {Map<N, N | null>} */
  const PARENT = new Map();
  /** @type {Map<N, string>} */
  const PATH = new Map();
  /** @type {Map<string, N>} */
  const BY_PATH = new Map();
  /** @param {N} n @param {N | null} parent @param {string} path */
  function index(n, parent, path) {
    PARENT.set(n, parent); PATH.set(n, path);
    if (!BY_PATH.has(path)) BY_PATH.set(path, n);
    for (const c of /** @type {N[]} */ (n.children || [])) index(c, n, path ? path + '/' + c.id : c.id);
  }
  index(root, null, '');

  /**
   * A branch under a node of the hierarchy: node and what lies under it, the last of parent's children. A parent not in the
   * hierarchy, a node already in it, or an id its siblings have, throws.
   * @param {N} parent @param {N} node @returns {N} node
   */
  function add(parent, node) {
    if (!PATH.has(parent)) throw new Error(`hierarchy: the parent ${parent.id} is not in it`);
    if (PATH.has(node)) throw new Error(`hierarchy: ${PATH.get(node) || node.id} is in it already`);
    const children = /** @type {N[]} */ (parent.children || (parent.children = []));
    if (children.some(c => c.id === node.id)) throw new Error(`hierarchy: ${path(parent) ? path(parent) + '/' : ''}${node.id} is there already`);
    children.push(node);
    index(node, parent, path(parent) ? path(parent) + '/' + node.id : node.id);
    return node;
  }

  /** the path of ids from the root (the root itself not in it): the node's address @param {N} n */
  const path = n => /** @type {string} */ (PATH.get(n));
  /** the node of a path; null when there is none @param {string} p */
  const node = p => BY_PATH.get(p) || null;
  /** @param {N} n */
  const parent = n => PARENT.get(n) || null;
  /** the nodes from the root down to n @param {N} n @returns {N[]} */
  const chain = n => { /** @type {N[]} */ const out = []; for (let /** @type {N | null | undefined} */ m = n; m; m = PARENT.get(m)) out.unshift(m); return out; };
  /** its axes' turn against the root's: quarter turns counterclockwise about h, 0 to 3 @param {N} n */
  const turnOf = n => chain(n).slice(1).reduce((t, m) => t + (m.turn || 0), 0) % 4;
  /** a point of n's axes in the root's axes @param {N} n @param {number[]} v @returns {number[]} */
  const toRoot = (n, v) => chain(n).slice(1).reduceRight((p, m) => turned(p, m.turn || 0).map((c, i) => c + m.offset[i]), v);
  /** a point of the root's axes in n's axes @param {N} n @param {number[]} v @returns {number[]} */
  const fromRoot = (n, v) => chain(n).slice(1).reduce((p, m) => turned(p.map((c, i) => c - m.offset[i]), 4 - (m.turn || 0)), v);
  /** the node's zero in the root's axes @param {N} n @returns {number[]} */
  const place = n => toRoot(n, [0, 0, 0]);
  /** the box [x1, x2, y1, y2, h1, h2] in the root's axes that the node's size fills @param {N} n @returns {number[]} */
  const box = n => {
    const a = toRoot(n, [0, 0, 0]), b = toRoot(n, n.size);
    return [0, 1, 2].flatMap(i => [Math.min(a[i], b[i]), Math.max(a[i], b[i])]);
  };
  /**
   * A setting by its key (dots go into nested objects): the value of the nearest node, n or above, that sets it, and that node;
   * undefined when none does.
   * @param {N} n @param {string} key @returns {{ value: any, from: N } | undefined}
   */
  function setting(n, key) {
    const parts = key.split('.');
    for (let /** @type {N | null | undefined} */ m = n; m; m = PARENT.get(m)) {
      /** @type {any} */
      let v = m.settings;
      for (const k of parts) v = v && typeof v === 'object' ? v[k] : undefined;
      if (v !== undefined) return { value: v, from: m };
    }
    return undefined;
  }
  /** the nodes a node refers to, in the order of its refs; null for a path with no node @param {N} n */
  const refs = n => (n.refs || []).map(node);
  /** the value of a field: its own, or the nearest node's above it that has one @param {N} n @param {'layer' | 'floor'} f */
  const nearest = (n, f) => { for (let /** @type {N | null | undefined} */ m = n; m; m = PARENT.get(m)) if (m[f] !== undefined) return m[f]; return undefined; };
  /** its layer: its own, or its parent's @param {N} n @returns {string | undefined} */
  const layer = n => nearest(n, 'layer');
  /** its floor: its own, or its parent's @param {N} n @returns {string | undefined} */
  const floor = n => nearest(n, 'floor');
  /** every node below the root, parents first @param {(n: N) => void} fn */
  function walk(fn) { (function each(/** @type {N} */ n) { for (const c of /** @type {N[]} */ (n.children || [])) { fn(c); each(c); } })(root); }

  /**
   * What is wrong in the hierarchy, as Test shows it.
   * @param {{ layers: string[], floors: string[] }} [known]  the layers and the floors there are; none: not checked
   * @returns {Check[]}
   */
  function checks(known) {
    /** @type {string[][]} */
    const [shape, ids, twice, empty, below, broken, unknown] = [[], [], [], [], [], [], []];
    const vector = (/** @type {unknown} */ v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
    walk(n => {
      const at = path(n) || '(' + (n.name || n.type || 'a node') + ')';
      if (n.refs !== undefined && !(Array.isArray(n.refs) && n.refs.every(r => typeof r === 'string'))) broken.push(`${at}: refs is not a list of paths`);
      else for (const r of n.refs || []) if (!node(r)) broken.push(`${at}: ${r}`);
      if (known && n.layer !== undefined && !known.layers.includes(n.layer)) unknown.push(`${at}: layer ${n.layer}`);
      if (known && n.floor !== undefined && !known.floors.includes(n.floor)) unknown.push(`${at}: floor ${n.floor}`);
      if (typeof n.id !== 'string' || !ID.test(n.id)) ids.push(`${at}: id ${JSON.stringify(n.id)}`);
      if (n.turn !== undefined && ![0, 1, 2, 3].includes(n.turn)) shape.push(`${at}: turn ${JSON.stringify(n.turn)}`);
      if (!n.type || !vector(n.offset) || !vector(n.size)) {
        shape.push(`${at}: ${[!n.type && 'type', !vector(n.offset) && 'offset', !vector(n.size) && 'size'].filter(Boolean).join(', ')}`);
        return;
      }
      AXES.forEach((a, i) => { if (n.size[i] <= 0) empty.push(`${at}: size ${a} ${n.size[i]}`); });
      const p = place(n), low = AXES.map((a, i) => p[i] < 0 ? `${a} ${p[i]}` : '').filter(Boolean);
      if (low.length) below.push(`${at}: ${low.join(', ')}`);
    });
    (function siblings(/** @type {N} */ n) {
      const seen = new Set();
      for (const c of /** @type {N[]} */ (n.children || [])) { if (seen.has(c.id)) twice.push((path(n) ? path(n) + '/' : '') + c.id); seen.add(c.id); siblings(c); }
    })(root);
    return [
      { name: 'Hierarchy: every node has a type, an offset and a size', about: 'Each node says what it is and where it stands: a type, an offset [x, y, h] and a size [x, y, h]; a turn, if any, of 0 to 3 quarter turns.', items: shape },
      { name: 'Hierarchy: ids without spaces or slashes', about: 'An id is one step of a path, so it holds letters, digits, - and _ only.', items: ids },
      { name: 'Hierarchy: ids unique among siblings', about: 'Two children of one node with the same id would have the same path: one of them could not be found.', items: twice },
      { name: 'Hierarchy: sizes above 0', about: 'Every node has a size above 0 along x, y and h.', items: empty },
      { name: 'Hierarchy: what lies below the zero', about: 'To know, not a fault: the nodes at negative numbers from the root\'s zero.', items: below, info: true },
      { name: 'Hierarchy: every ref is the path of a node', about: 'A node may refer to others by their paths; every such path leads to a node.', items: broken },
      ...(known ? [{ name: 'Hierarchy: every layer and floor is known', about: 'A node\'s layer is one of the layers there are, its floor one of the floors.', items: unknown }] : [])];
  }

  return { root, add, path, node, parent, chain, place, turnOf, toRoot, fromRoot, box, setting, refs, layer, floor, walk, checks };
}
