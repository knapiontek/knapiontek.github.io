// @ts-check
// app.js: the page. Sketch: the layout of the screen only; every value in SKETCH stands in for what the modules will give.

/** @typedef {'house' | 'floor' | 'room'} Scope  what the view shows: the house, one floor, one room */
/** @typedef {{ scopes?: Scope[], furniture?: boolean, modes?: string[] }} Needs  where a control belongs; missing: everywhere. Cabinet and Finish grey out elsewhere, the rest is not shown */
/** @typedef {{ id: string, number: number, name: string, furniture?: boolean }} Room  id and number as archon gives them */
/** @typedef {{ id: string, name: string, rooms: Room[] }} Floor */
/** @typedef {{ id: string, name: string } & Needs} Item  a mode, a tab, an action */
/** @typedef {{ id: string, name: string, children?: Layer[] }} Layer  a layer and the layers under it */
/** @typedef {{ id: string, name: string, layers: Layer[] } & Needs} LayerBlock */
/** @typedef {{ mode: string, floor: string | null, room: string | null, tab: string, off: string[], panelOpen: boolean, float: string | null, list: string | null }} State */

const SKETCH = {
  house: { name: 'Dom w papawerach 5 (G)', subtitle: 'archon.pl, as built' },
  /** @type {Floor[]} */
  floors: [
    { id: 'groundFloor', name: 'Ground Floor', rooms: [
      { id: 'vestibule_1', number: 1, name: 'Vestibule' },
      { id: 'garage_2', number: 2, name: 'Garage' },
      { id: 'room_356', number: 356, name: 'Room', furniture: true },
      { id: 'bathroom_7', number: 7, name: 'Bathroom', furniture: true },
      { id: 'boiler_8', number: 8, name: 'Boiler room' }] },
    { id: 'firstFloor', name: 'First Floor', rooms: [
      { id: 'hall_1', number: 1, name: 'Hall' },
      { id: 'bedroom_2', number: 2, name: 'Bedroom' },
      { id: 'wardrobe_3', number: 3, name: 'Wardrobe', furniture: true },
      { id: 'wardrobe_4', number: 4, name: 'Wardrobe', furniture: true },
      { id: 'bathroom_5', number: 5, name: 'Bathroom', furniture: true },
      { id: 'bedroom_6', number: 6, name: 'Bedroom', furniture: true },
      { id: 'bedroom_7', number: 7, name: 'Bedroom' },
      { id: 'wardrobe_8', number: 8, name: 'Wardrobe', furniture: true }] }
  ],
  /** @type {Item[]} */
  modes: [
    { id: '3d', name: '3D' },
    { id: '2d', name: '2D' },
    { id: 'documents', name: 'Documents' },
    { id: 'cabinet', name: 'Cabinet', scopes: ['room'], furniture: true }
  ],
  /** @type {Item[]} the panel's tabs */
  tabs: [
    { id: 'view', name: 'View', modes: ['3d'] },
    { id: 'finish', name: 'Finish', modes: ['3d'], scopes: ['floor', 'room'] }
  ],
  /** @type {Record<string, (Item & { group: string })[]>} the actions under the view, by mode */
  actions: {
    '3d': [
      { id: 'walk', name: 'Walk', group: 'walk', scopes: ['house'] },
      { id: 'open', name: 'Open', group: 'doors' },
      { id: 'close', name: 'Close', group: 'doors' },
      { id: 'front', name: 'Front', group: 'cameras' },
      { id: 'garden', name: 'Garden', group: 'cameras' },
      { id: 'above', name: 'Above', group: 'cameras' }
    ],
    '2d': [
      { id: 'fit', name: 'Fit', group: 'plan' },
      { id: 'svg', name: 'Save SVG', group: 'plan' }
    ],
    documents: [
      { id: 'xlsx', name: 'Save XLSX', group: 'sheet' }
    ],
    cabinet: [
      { id: 'import', name: 'Import', group: 'file' },
      { id: 'export', name: 'Export', group: 'file' },
      { id: 'show3d', name: 'Show in 3D', group: 'show' }
    ]
  },
  /** @type {LayerBlock[]} the View's layer blocks: where (Floors), the shell in the order it is built (Construction), what is in the rooms (Interiors) */
  layerBlocks: [
    { id: 'floors', name: 'Floors', layers: [
      { id: 'groundFloor', name: 'Ground Floor' },
      { id: 'firstFloor', name: 'First Floor' },
      { id: 'attic', name: 'Attic' }] },
    { id: 'construction', name: 'Construction', layers: [
      { id: 'foundation', name: 'Foundation', children: [
        { id: 'footings', name: 'Footings' }, { id: 'foundationWalls', name: 'Foundation walls' }, { id: 'groundSlab', name: 'Ground slab' }] },
      { id: 'walls', name: 'Walls', children: [
        { id: 'blocks', name: 'Blocks' }, { id: 'chimney', name: 'Chimney' }] },
      { id: 'slabs', name: 'Slabs', children: [
        { id: 'ringBeams', name: 'Ring beams' }, { id: 'slab', name: 'Slab' }, { id: 'ceiling', name: 'Attic ceiling' }] },
      { id: 'roof', name: 'Roof', children: [
        { id: 'roofPlanes', name: 'Roof planes' }, { id: 'roofWindows', name: 'Roof windows' }] },
      { id: 'openings', name: 'Openings', children: [
        { id: 'windows', name: 'Windows' }, { id: 'outerDoors', name: 'Outer doors' }, { id: 'innerDoors', name: 'Inner doors' }] },
      { id: 'stair', name: 'Stair' },
      { id: 'insulation', name: 'Insulation', children: [
        { id: 'eps', name: 'EPS' }, { id: 'facade', name: 'Facade' }] },
      { id: 'site', name: 'Site', children: [
        { id: 'lawn', name: 'Lawn' }, { id: 'terraces', name: 'Terraces' }, { id: 'paving', name: 'Paving' }] }] },
    { id: 'interiors', name: 'Interiors', layers: [
      { id: 'tiles', name: 'Tiles', children: [
        { id: 'floorTiles', name: 'Floor tiles' }, { id: 'wallTiles', name: 'Wall tiles' }, { id: 'smallCuts', name: 'Small cuts' }] },
      { id: 'carcasses', name: 'Carcasses', children: [
        { id: 'boards', name: 'Boards' }, { id: 'backs', name: 'Backs' }, { id: 'shelves', name: 'Shelves' }, { id: 'drawers', name: 'Drawers' },
        { id: 'hardware', name: 'Hinges and runners' }, { id: 'holes', name: 'Holes' }, { id: 'legs', name: 'Legs' }] },
      { id: 'fronts', name: 'Fronts', children: [
        { id: 'doorsAndDrawers', name: 'Doors and drawers' }, { id: 'handles', name: 'Handles' }, { id: 'strips', name: 'Front strips' }, { id: 'frontPanels', name: 'Panels' }, { id: 'plinth', name: 'Plinth' }] },
      { id: 'worktops', name: 'Worktops', children: [
        { id: 'worktop', name: 'Worktop' }, { id: 'endPanels', name: 'End panels' }, { id: 'wallPanel', name: 'Wall panel' }] },
      { id: 'appliances', name: 'Appliances', children: [
        { id: 'sink', name: 'Sink' }, { id: 'trap', name: 'Trap' }, { id: 'hob', name: 'Hob' }, { id: 'hood', name: 'Hood' }, { id: 'oven', name: 'Oven' },
        { id: 'microwave', name: 'Microwave' }, { id: 'coffee', name: 'Coffee machine' }, { id: 'fridge', name: 'Fridge' }, { id: 'dishwasher', name: 'Dishwasher' }] },
      { id: 'sanitary', name: 'Sanitary', children: [
        { id: 'basin', name: 'Basin' }, { id: 'wc', name: 'WC' }, { id: 'shower', name: 'Shower' }, { id: 'mirror', name: 'Mirror' }, { id: 'radiator', name: 'Radiator' }] },
      { id: 'builtIns', name: 'Built-ins', children: [
        { id: 'casings', name: 'Casings' }, { id: 'plasterboard', name: 'Plasterboard' }] },
      { id: 'installations', name: 'Installations', children: [
        { id: 'riser', name: 'Riser' }, { id: 'wcFrame', name: 'WC frame' }] },
      { id: 'lights', name: 'Lights', children: [
        { id: 'pendants', name: 'Pendants' }, { id: 'downlights', name: 'Downlights' }] }] },
    { id: 'drawing', name: 'Drawing', layers: [
      { id: 'edges', name: 'Edges' }] }
  ],
  /** @type {(Item & { fields: string[] })[]} the Finish's blocks */
  finishBlocks: [
    { id: 'furniture', name: 'Furniture', scopes: ['room'], furniture: true, fields: ['Metal', 'Carcass board', 'Front board', 'Worktop'] },
    { id: 'tiles', name: 'Floor tiles', fields: ['Tile', 'Pattern', 'Direction', 'Origin along (mm)', 'Origin across (mm)', 'Grout'] }
  ],
  /** @type {Record<Scope, string[]>} the Documents' sheets */
  sheets: {
    house: ['Rooms', 'Floor tiles', 'Doors', 'Notes', 'Elements', 'Test'],
    floor: ['Rooms', 'Floor tiles', 'Doors', 'Notes', 'Elements', 'Test'],
    room: ['Estimate', 'Cut list', 'Notes', 'Elements', 'Test']
  },
  /** @type {Item[]} the bottom-right corner: a click toggles the theme or opens its box over the view */
  corner: [
    { id: 'theme', name: '◐' },
    { id: 'sun', name: '☀' },
    { id: 'help', name: '?' }
  ]
};

/**
 * The screen: its state, what works in it, and its drawing into the page.
 * @param {Document} doc
 * @param {typeof SKETCH} data
 */
function appModule(doc, data) {
  /** @type {State} */
  const state = { mode: '3d', floor: null, room: null, tab: 'view', off: [], panelOpen: true, float: null, list: null };

  /** @param {string} id */
  const byId = id => /** @type {HTMLElement} */ (doc.getElementById(id));

  /** @returns {Scope} */
  const scope = () => state.room ? 'room' : state.floor ? 'floor' : 'house';
  const floor = () => data.floors.find(f => f.id === state.floor) || null;
  const room = () => floor()?.rooms.find(r => r.id === state.room) || null;
  /** @param {Room} r */
  const roomName = r => `${r.number}. ${r.name}`;

  /** @param {Needs} needs @returns {boolean} whether a control belongs to the present view */
  function works(needs) {
    if (needs.scopes && !needs.scopes.includes(scope())) return false;
    if (needs.furniture && !room()?.furniture) return false;
    if (needs.modes && !needs.modes.includes(state.mode)) return false;
    return true;
  }

  /* a picked mode, tab or box that stops working gives way */
  function settle() {
    const mode = data.modes.find(m => m.id === state.mode);
    if (mode && !works(mode)) state.mode = data.modes[0].id;
    const tab = data.tabs.find(t => t.id === state.tab);
    if (tab && !works(tab)) state.tab = data.tabs[0].id;
  }

  /**
   * @param {string} tag
   * @param {Record<string, string | boolean | ((e: Event) => void)>} [attrs]  on*: a listener; true: an empty attribute; false: none
   * @param {(Node | string)[]} [children]
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

  /** @param {string} name @param {boolean} on @param {boolean} enabled @param {() => void} go */
  const button = (name, on, enabled, go) =>
    el('button', { type: 'button', 'data-on': on, disabled: !enabled, 'aria-pressed': String(on), onclick: go }, [name]);

  /* a floor: its name picks it and opens its list, the list picks one of its rooms */
  function drawFloors() {
    byId('floors').replaceChildren(
      button('House', scope() === 'house', true, () => pick({ floor: null, room: null })),
      ...data.floors.map(f => {
        const on = state.floor === f.id;
        const rooms = el('div', { class: 'dropdown', role: 'menu' }, f.rooms.map(r =>
          el('button', { type: 'button', 'data-on': state.room === r.id, title: r.id, onclick: () => pick({ floor: f.id, room: r.id, list: null }) },
            [roomName(r), r.furniture ? el('span', { class: 'mark', title: 'Furniture' }, ['●']) : ''])));
        const r = room();
        const label = on && r ? `${f.name} · ${roomName(r)}` : f.name;
        const open = (/** @type {Event} */ e) => { e.preventDefault(); pick({ floor: f.id, room: null, list: state.list === f.id ? null : f.id }); };
        return el('details', { class: 'floor', 'data-on': on, open: state.list === f.id }, [el('summary', { onclick: open }, [label]), rooms]);
      }));
  }

  function drawModes() {
    byId('modes').replaceChildren(...data.modes.map(m => button(m.name, state.mode === m.id, works(m), () => pick({ mode: m.id }))));
    for (const view of doc.querySelectorAll('.view')) /** @type {HTMLElement} */ (view).hidden = view.getAttribute('data-mode') !== state.mode;
  }

  function drawDock() {
    /** @type {Record<string, HTMLElement>} */
    const groups = {};
    for (const a of data.actions[state.mode].filter(works)) {
      groups[a.group] = groups[a.group] || el('span', { class: 'group' });
      groups[a.group].append(button(a.name, false, true, () => {}));
    }
    byId('dock').replaceChildren(...Object.values(groups));
  }

  function drawDocTabs() {
    byId('doc-tabs').replaceChildren(...data.sheets[scope()].map((s, i) => button(s, i === 0, true, () => {})));
  }

  /* ◐ ☀ ? and the box one of them has open */
  function drawCorner() {
    byId('corner').replaceChildren(...data.corner.map(c => {
      const b = button(c.name, state.float === c.id, true, () => c.id === 'theme' ? toggleTheme() : pick({ float: state.float === c.id ? null : c.id }));
      b.className = 'round box';
      b.title = c.id === 'theme' ? 'Light / Dark' : c.id === 'sun' ? 'Sun' : 'Help';
      return b;
    }));
    for (const box of doc.querySelectorAll('.float')) /** @type {HTMLElement} */ (box).hidden = box.getAttribute('data-float') !== state.float;
  }

  /** @param {string} name @param {Node[]} body */
  const block = (name, body) => el('section', { class: 'block' }, [el('h2', {}, [name]), ...body]);

  /** @param {string} id */
  function toggleLayer(id) {
    pick({ off: state.off.includes(id) ? state.off.filter(k => k !== id) : state.off.concat(id) });
  }

  /* a layer and, indented under it, its children: a child is greyed while its parent is off */
  /** @param {Layer[]} layers @param {boolean} enabled  false: its parent is off @returns {HTMLElement} */
  function layerTree(layers, enabled) {
    return el('ul', { class: 'tree' }, layers.map(l => {
      const on = !state.off.includes(l.id);
      const row = el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked: on, disabled: !enabled, onchange: () => toggleLayer(l.id) }), l.name]);
      return el('li', {}, l.children ? [row, layerTree(l.children, enabled && on)] : [row]);
    }));
  }

  const viewTab = () => data.layerBlocks.filter(works).map(b => block(b.name, [layerTree(b.layers, true)]));

  const finishTab = () => data.finishBlocks.filter(works).map(b => block(b.name, [
    el('div', { class: 'fields' }, b.fields.map(f => el('label', {}, [f, el('select', {}, [el('option', {}, ['—'])])])))]));

  function drawPanel() {
    byId('app').toggleAttribute('data-panel-closed', !state.panelOpen);
    const toggle = byId('panel-toggle');
    toggle.textContent = state.panelOpen ? '»' : '«';
    toggle.title = state.panelOpen ? 'Hide the panel' : 'Show the panel';
    const r = room();
    byId('title').textContent = r ? roomName(r) : floor()?.name || data.house.name;
    byId('subtitle').textContent = r ? `${floor()?.name} · ${r.id}` : state.floor ? data.house.name : data.house.subtitle;
    byId('tabs').replaceChildren(...data.tabs.map(t => button(t.name, state.tab === t.id, works(t), () => pick({ tab: t.id }))));
    byId('sections').replaceChildren(...(state.mode !== '3d' ? [] : state.tab === 'finish' ? finishTab() : viewTab()));
  }

  function render() {
    settle();
    drawFloors(); drawModes(); drawDock(); drawDocTabs(); drawCorner(); drawPanel();
  }

  /** @param {Partial<State>} change */
  function pick(change) { Object.assign(state, change); render(); }

  function toggleTheme() {
    const root = doc.documentElement;
    root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }

  byId('panel-toggle').addEventListener('click', () => pick({ panelOpen: !state.panelOpen }));
  doc.addEventListener('click', e => {
    const target = /** @type {Element} */ (e.target);
    if (state.list && !target.closest('.floor')) pick({ list: null });
  });

  return { state: () => ({ ...state, scope: scope() }), works, pick, render };
}

appModule(document, SKETCH).render();
