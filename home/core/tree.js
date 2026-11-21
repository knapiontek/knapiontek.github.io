// @ts-check
/* core/tree.js: the tree of nodes. A node is {id, name, type, offset: [x, y, h], size: [x, y, h], settings, refs, children};
   its type is only a name here; refs are the paths of the nodes it refers to (what for, its type says). A node's place is
   its parent's place plus its offset; its settings are the defaults of its branch. The tree says what belongs to what, not
   what lies inside what: a child may stand outside its parent (a sink over its carcass). Knows no project and nothing of
   what a node is. */
/**
 * @typedef {object} TreeNode  a node (core/project.md: format tree)
 * @property {string} id
 * @property {string} [name]
 * @property {string} type
 * @property {number[]} offset  [x, y, h] mm from the parent's origin
 * @property {number[]} size  [x, y, h] mm
 * @property {Object<string, any>} [settings]
 * @property {string[]} [refs]  paths from the root
 * @property {TreeNode[]} [children]
 */
/** @typedef {ReturnType<ReturnType<typeof treeModule>['create']>} Tree */
function treeModule() {
'use strict';
const AXES = ['x', 'y', 'h'];
const ID = /^[A-Za-z0-9_-]+$/;             // no spaces, no '/': an id is a step of a path

/** a tree over root, indexed once; the nodes are not changed @template {TreeNode} N @param {N} root */
function create(root) {
  const PARENT = /** @type {Map<N, N | null>} */ (new Map()), PATH = /** @type {Map<N, string>} */ (new Map()), BY_PATH = /** @type {Map<string, N>} */ (new Map());
  (function index(/** @type {N} */ n, /** @type {N | null} */ parent, /** @type {string} */ path) {
    PARENT.set(n, parent); PATH.set(n, path);
    if (!BY_PATH.has(path)) BY_PATH.set(path, n);
    for (const c of /** @type {N[]} */ (n.children || [])) index(c, n, path ? path + '/' + c.id : c.id);
  })(root, null, '');

  /* the path of ids from the root (the root itself not in it): the node's global identifier */
  const path = (/** @type {N} */ n) => /** @type {string} */ (PATH.get(n));
  /* the node of a path; null when there is none */
  const node = (/** @type {string} */ p) => BY_PATH.get(p) || null;
  const parent = (/** @type {N} */ n) => PARENT.get(n) || null;
  /* the nodes from the root down to n */
  const chain = (/** @type {N} */ n) => { /** @type {N[]} */ const out = []; for (let /** @type {N | null | undefined} */ m = n; m; m = PARENT.get(m)) out.unshift(m); return out; };
  /* the node's corner in the root's axes: the sum of the offsets */
  const place = (/** @type {N} */ n) => chain(n).slice(1).reduce((p, m) => p.map((v, i) => v + ((m.offset || [])[i] || 0)), [0, 0, 0]);   // the root's own offset is its place in its parent: not in its axes
  /* the node's box [x1, x2, y1, y2, h1, h2] in the root's axes */
  /** @returns {Box} */
  const box = (/** @type {N} */ n) => { const p = place(n), s = n.size; return [p[0], p[0] + s[0], p[1], p[1] + s[1], p[2], p[2] + s[2]]; };
  /* a setting by its key (dots go into nested objects): the value of the nearest node, n or above, that sets it, and that
     node; undefined when none does */
  /** @param {N} n @param {string} key @returns {{ value: any, from: N } | undefined} */
  function setting(n, key) {
    const parts = key.split('.');
    for (let /** @type {N | null | undefined} */ m = n; m; m = PARENT.get(m)) {
      let v = m.settings;
      for (const k of parts) v = v && typeof v === 'object' ? v[k] : undefined;
      if (v !== undefined) return { value: v, from: m };
    }
    return undefined;
  }
  /* the nodes a node refers to, in the order of its refs; null for a path with no node */
  const refs = (/** @type {N} */ n) => (n.refs || []).map(node);
  /* every node below the root, parents first: fn(node) */
  /** @param {(n: N) => void} fn */
  function walk(fn) { (function each(/** @type {N} */ n) { for (const c of /** @type {N[]} */ (n.children || [])) { fn(c); each(c); } })(root); }

  /* the checks of the tree, as Test shows them: [{name, items}] */
  /** @returns {Check[]} */
  function checks() {
    /** @type {string[]} */ const shape = [], ids = [], twice = [], below = [], empty = [], broken = [];
    const vector = (/** @type {any} */ v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
    walk(n => {
      const at = path(n) || '(' + (n.name || n.type || 'a node') + ')';
      if (n.refs !== undefined && !(Array.isArray(n.refs) && n.refs.every(r => typeof r === 'string'))) broken.push(`${at}: refs is not a list of paths`);
      else for (const r of n.refs || []) if (!node(r)) broken.push(`${at}: ${r}`);
      if (typeof n.id !== 'string' || !ID.test(n.id)) ids.push(`${at}: id ${JSON.stringify(n.id)}`);
      if (!n.type || !vector(n.offset) || !vector(n.size)) { shape.push(`${at}: ${['type', 'offset', 'size'].filter(k => k === 'type' ? !n.type : !vector(n[k])).join(', ')}`); return; }
      AXES.forEach((a, i) => { if (n.size[i] <= 0) empty.push(`${at}: size ${a} ${n.size[i]}`); });
      const p = place(n), low = AXES.filter((a, i) => p[i] < 0);
      if (low.length) below.push(`${at}: ${low.map(a => a + ' ' + p[AXES.indexOf(a)]).join(', ')}`);
    });
    (function siblings(/** @type {N} */ n) {
      const seen = new Set();
      for (const c of /** @type {N[]} */ (n.children || [])) { if (seen.has(c.id)) twice.push((path(n) ? path(n) + '/' : '') + c.id); seen.add(c.id); siblings(c); }
    })(root);
    return [
      { name: 'Tree: every node has a type, an offset and a size', about: 'Each node of the tree says what it is and where it stands: a type, an offset [x, y, h] and a size [x, y, h].', items: shape },
      { name: 'Tree: ids without spaces or slashes', about: 'An id is one step of a path (ground/kitchen_6/g1/K11), so it may hold letters, digits, - and _ only.', items: ids },
      { name: 'Tree: ids unique among siblings', about: 'Two children of one node with the same id would have the same path: one of them could not be found.', items: twice },
      { name: 'Tree: sizes above 0', about: 'Every node has a size above 0 along x, y and h: nothing is flat or turned inside out.', items: empty },
      { name: 'Tree: what lies below the zero', about: 'To know, not a fault: the nodes that lie at negative numbers from the root\'s zero. In the house only what is outside it may: the foundations, the insulation, the site.', items: below, info: true },
      { name: 'Tree: every ref is the path of a node', about: 'A node may refer to others by their paths (refs); every such path must lead to a node.', items: broken }];
  }

  return { root, path, node, parent, chain, place, box, setting, refs, walk, checks };
}

return { create };
}
