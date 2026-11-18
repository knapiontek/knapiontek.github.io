/* core/tree.js: the tree of nodes. A node is {id, name, type, offset: [x, y, h], size: [x, y, h], settings, refs, children};
   its type is only a name here; refs are the paths of the nodes it refers to (what for, its type says). A node's place is
   its parent's place plus its offset; its settings are the defaults of its branch. The tree says what belongs to what, not
   what lies inside what: a child may stand outside its parent (a sink over its carcass). Knows no project and nothing of
   what a node is. */
(function (HOME) {
'use strict';
const AXES = ['x', 'y', 'h'];
const ID = /^[A-Za-z0-9_-]+$/;             // no spaces, no '/': an id is a step of a path

/* a tree over root, indexed once; the nodes are not changed */
function create(root) {
  const PARENT = new Map(), PATH = new Map(), BY_PATH = new Map();
  (function index(n, parent, path) {
    PARENT.set(n, parent); PATH.set(n, path);
    if (!BY_PATH.has(path)) BY_PATH.set(path, n);
    for (const c of n.children || []) index(c, n, path ? path + '/' + c.id : c.id);
  })(root, null, '');

  /* the path of ids from the root (the root itself not in it): the node's global identifier */
  const path = n => PATH.get(n);
  /* the node of a path; null when there is none */
  const node = p => BY_PATH.get(p) || null;
  const parent = n => PARENT.get(n);
  /* the nodes from the root down to n */
  const chain = n => { const out = []; for (let m = n; m; m = PARENT.get(m)) out.unshift(m); return out; };
  /* the node's corner in the root's axes: the sum of the offsets */
  const place = n => chain(n).reduce((p, m) => p.map((v, i) => v + ((m.offset || [])[i] || 0)), [0, 0, 0]);
  /* the node's box [x1, x2, y1, y2, h1, h2] in the root's axes */
  const box = n => { const p = place(n), s = n.size; return [p[0], p[0] + s[0], p[1], p[1] + s[1], p[2], p[2] + s[2]]; };
  /* a setting by its key (dots go into nested objects): the value of the nearest node, n or above, that sets it, and that
     node; undefined when none does */
  function setting(n, key) {
    const parts = key.split('.');
    for (let m = n; m; m = PARENT.get(m)) {
      let v = m.settings;
      for (const k of parts) v = v && typeof v === 'object' ? v[k] : undefined;
      if (v !== undefined) return { value: v, from: m };
    }
    return undefined;
  }
  /* the nodes a node refers to, in the order of its refs; null for a path with no node */
  const refs = n => (n.refs || []).map(node);
  /* every node below the root, parents first: fn(node) */
  function walk(fn) { (function each(n) { for (const c of n.children || []) { fn(c); each(c); } })(root); }

  /* the checks of the tree, as Test shows them: [{name, items}] */
  function checks() {
    const shape = [], ids = [], twice = [], below = [], empty = [], broken = [];
    const vector = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
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
    (function siblings(n) {
      const seen = new Set();
      for (const c of n.children || []) { if (seen.has(c.id)) twice.push((path(n) ? path(n) + '/' : '') + c.id); seen.add(c.id); siblings(c); }
    })(root);
    return [
      { name: 'Tree: every node has a type, an offset and a size', items: shape },
      { name: 'Tree: ids without spaces or slashes', items: ids },
      { name: 'Tree: ids unique among siblings', items: twice },
      { name: 'Tree: sizes above 0', items: empty },
      { name: 'Tree: what lies below the root\'s zero (to know: only what is outside, as the foundations)', items: below, info: true },
      { name: 'Tree: every ref is the path of a node', items: broken }];
  }

  return { root, path, node, parent, chain, place, box, setting, refs, walk, checks };
}

HOME.tree = { create };
})(window.HOME = window.HOME || {});
