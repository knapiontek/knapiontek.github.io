// @ts-check
// core/ui.js: the screen's general pieces, for any project: elements, buttons, a choice, a list behind a button, actions in groups,
// a tree of switches, a block of the panel, the panel's toggle, the theme. It knows no project: every name and rule comes from its caller.

/** @typedef {{ id: string, name: string, children?: TreeNode[] }} TreeNode  a switch and the switches under it */
/** @typedef {{ off: string[], open: string[] }} TreeState  the switches turned off, the branches opened */
/** @typedef {{ id: string, name: string, on?: boolean, enabled?: boolean, title?: string, mark?: string }} Choice  one button of a choice */

/** @param {Document} doc  the page the screen is drawn in */
export function createUi(doc) {

  /** @param {string} id */
  const byId = id => /** @type {HTMLElement} */ (doc.getElementById(id));

  /**
   * @param {string} tag
   * @param {Record<string, string | boolean | ((e: Event) => void)>} [attrs]  on*: a listener; true: an empty attribute; false: none
   * @param {(Node | string)[]} [children]
   * @returns {HTMLElement}
   */
  function el(tag, attrs = {}, children = []) {
    const node = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else if (v !== false) node.setAttribute(k, v);
    }
    node.append(...children);
    return node;
  }

  /** @param {Choice} c @param {() => void} go */
  const button = (c, go) => el('button', {
    type: 'button', 'data-on': !!c.on, 'aria-pressed': String(!!c.on), disabled: c.enabled === false, title: c.title || false, onclick: go
  }, [c.name, c.mark ? el('span', { class: 'mark' }, [c.mark]) : '']);

  /** @param {string[]} list @param {string} id @returns {string[]} the list with id added, or without it if it was there */
  const flip = (list, id) => list.includes(id) ? list.filter(k => k !== id) : list.concat(id);

  /** @param {Choice[]} choices @param {(id: string) => void} go @returns {HTMLElement[]} one button each */
  const choice = (choices, go) => choices.map(c => button(c, () => go(c.id)));

  /**
   * A button with a list under it: the button picks itself and opens or closes the list, an item of the list picks that item.
   * @param {Choice & { open: boolean, label: string }} head  label: what the button says
   * @param {Choice[]} items
   * @param {(id: string) => void} goHead  the button clicked
   * @param {(id: string) => void} goItem  an item clicked
   */
  function listButton(head, items, goHead, goItem) {
    const summary = el('summary', { onclick: e => { e.preventDefault(); goHead(head.id); } }, [head.label]);
    return el('details', { class: 'list-button', 'data-on': !!head.on, open: head.open }, [summary,
      el('div', { class: 'dropdown', role: 'menu' }, choice(items, goItem))]);
  }

  /** @param {(Choice & { group: string })[]} actions @param {(id: string) => void} go @returns {HTMLElement[]} the actions, in groups as they come */
  function actionGroups(actions, go) {
    /** @type {Record<string, HTMLElement>} */
    const groups = {};
    for (const a of actions) (groups[a.group] = groups[a.group] || el('span', { class: 'group' })).append(button(a, () => go(a.id)));
    return Object.values(groups);
  }

  /** @param {string} name @param {Node[]} body */
  const block = (name, body) => el('section', { class: 'block' }, [el('h2', {}, [name]), ...body]);

  /** @param {string} label @param {Node} control */
  const field = (label, control) => el('label', { class: 'field' }, [label, control]);

  /** @param {TreeNode} n @param {string[]} off @returns {boolean} whether a switch somewhere under it is off */
  const partlyOff = (n, off) => (n.children || []).some(c => off.includes(c.id) || partlyOff(c, off));

  /**
   * The tree of switches. A branch: its box switches it and everything under it, its name opens or closes it (closed until opened);
   * on with a switch under it off, its box shows a dash. A leaf: its name switches it like its box. Under a branch that is off, all is greyed.
   * @param {TreeNode[]} nodes
   * @param {TreeState} state
   * @param {(next: TreeState) => void} change  called with the state after a click
   * @param {boolean} [enabled]  false: a parent is off
   * @returns {HTMLElement}
   */
  function tree(nodes, state, change, enabled = true) {
    return el('ul', { class: 'tree' }, nodes.map(n => {
      const on = !state.off.includes(n.id);
      const box = /** @type {HTMLInputElement} */ (el('input', {
        type: 'checkbox', checked: on, disabled: !enabled, 'aria-label': n.name, onchange: () => change({ ...state, off: flip(state.off, n.id) })
      }));
      if (!n.children) return el('li', {}, [el('label', { class: 'check' }, [box, n.name])]);
      box.indeterminate = on && partlyOff(n, state.off);
      const open = state.open.includes(n.id);
      const name = el('button', { type: 'button', class: 'branch', 'aria-expanded': String(open), onclick: () => change({ ...state, open: flip(state.open, n.id) }) },
        [el('span', { class: 'arrow' }, [open ? '▾' : '▸']), n.name]);
      return el('li', {}, [el('div', { class: 'check' }, [box, name]), ...(open ? [tree(n.children, state, change, enabled && on)] : [])]);
    }));
  }

  /** @param {string} selector @param {string} attr @param {string | null} value  shows the one whose attr is value, hides the others */
  function showOne(selector, attr, value) {
    for (const node of doc.querySelectorAll(selector)) /** @type {HTMLElement} */ (node).hidden = node.getAttribute(attr) !== value;
  }

  /** @param {HTMLElement} page @param {HTMLElement} toggle @param {boolean} open  the panel shown or hidden, and the » « that does it */
  function panel(page, toggle, open) {
    page.toggleAttribute('data-panel-closed', !open);
    toggle.textContent = open ? '»' : '«';
    toggle.title = open ? 'Hide the panel' : 'Show the panel';
  }

  /** @param {string} selector @param {() => void} go  called on a click anywhere outside the elements of selector */
  function onClickOutside(selector, go) {
    doc.addEventListener('click', e => { if (!/** @type {Element} */ (e.target).closest(selector)) go(); });
  }

  /* light or dark */
  function toggleTheme() {
    const root = doc.documentElement;
    root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }

  return { byId, el, button, flip, choice, listButton, actionGroups, block, field, tree, showOne, panel, onClickOutside, toggleTheme };
}
