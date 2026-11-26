// @ts-check
// app.js: the page. Sketch: the layout of the screen only; every value in SKETCH stands in for what the modules will give.

/** @typedef {'house' | 'floor' | 'room'} Scope  what the view shows: the house, one floor, one room */
/** @typedef {{ scopes?: Scope[], furniture?: boolean, modes?: string[] }} Needs  where a control belongs; missing: everywhere. Cabinet and Finish grey out elsewhere, the rest is not shown */
/** @typedef {{ id: string, number: number, name: string, furniture?: boolean }} Room  id and number as archon gives them */
/** @typedef {{ id: string, name: string, rooms: Room[] }} Floor */
/** @typedef {{ id: string, name: string, title?: string } & Needs} Item  a mode, a tab, an action, a corner button */
/** @typedef {{ id: string, name: string, children?: Layer[] }} Layer  a layer and the layers under it (core/ui.js TreeNode) */
/** @typedef {{ id: string, name: string, layers: Layer[] } & Needs} LayerBlock */
/** @typedef {{ mode: string, floor: string | null, room: string | null, tab: string, off: string[], open: string[], panelOpen: boolean, float: string | null, list: string | null }} State */

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
    { id: 'theme', name: '◐', title: 'Light / Dark' },
    { id: 'sun', name: '☀', title: 'Sun' },
    { id: 'help', name: '?', title: 'Help' }
  ]
};

/**
 * The page: what the view shows (the house, a floor, a room), what belongs to it, and the screen drawn with core/ui.js.
 * @param {ReturnType<typeof uiModule>} ui
 * @param {typeof SKETCH} data
 */
function appModule(ui, data) {
  /** @type {State} */
  const state = { mode: '3d', floor: null, room: null, tab: 'view', off: [], open: [], panelOpen: true, float: null, list: null };

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

  /* a picked mode or tab that stops working gives way to the first */
  function settle() {
    const mode = data.modes.find(m => m.id === state.mode);
    if (mode && !works(mode)) state.mode = data.modes[0].id;
    const tab = data.tabs.find(t => t.id === state.tab);
    if (tab && !works(tab)) state.tab = data.tabs[0].id;
  }

  /* House, then each floor: its name picks it and opens its list of rooms */
  function drawFloors() {
    const r = room();
    ui.byId('floors').replaceChildren(
      ...ui.choice([{ id: 'house', name: 'House', on: scope() === 'house' }], () => pick({ floor: null, room: null, list: null })),
      ...data.floors.map(f => ui.listButton(
        { id: f.id, name: f.name, on: state.floor === f.id, open: state.list === f.id, label: state.floor === f.id && r ? `${f.name} · ${roomName(r)}` : f.name },
        f.rooms.map(x => ({ id: x.id, name: roomName(x), on: state.room === x.id, title: x.id, mark: x.furniture ? '●' : '' })),
        id => pick({ floor: id, room: null, list: state.list === id ? null : id }),
        id => pick({ floor: f.id, room: id, list: null }))));
  }

  /* the modes; greyed where they do not belong (Cabinet) */
  function drawModes() {
    ui.byId('modes').replaceChildren(...ui.choice(data.modes.map(m => ({ ...m, on: state.mode === m.id, enabled: works(m) })), id => pick({ mode: id })));
    ui.showOne('.view', 'data-mode', state.mode);
  }

  /* the mode's actions that belong to the view; the others are not shown */
  function drawDock() {
    ui.byId('dock').replaceChildren(...ui.actionGroups(data.actions[state.mode].filter(works), () => {}));
  }

  function drawDocTabs() {
    ui.byId('doc-tabs').replaceChildren(...ui.choice(data.sheets[scope()].map((name, i) => ({ id: name, name, on: i === 0 })), () => {}));
  }

  /* ◐ switches the theme, ☀ and ? open their box over the view */
  function drawCorner() {
    ui.byId('corner').replaceChildren(...ui.choice(data.corner.map(c => ({ ...c, on: state.float === c.id })),
      id => id === 'theme' ? ui.toggleTheme() : pick({ float: state.float === id ? null : id })));
    ui.showOne('.float', 'data-float', state.float);
  }

  const viewTab = () => data.layerBlocks.filter(works).map(b =>
    ui.block(b.name, [ui.tree(b.layers, { off: state.off, open: state.open }, next => pick(next))]));

  const finishTab = () => data.finishBlocks.filter(works).map(b =>
    ui.block(b.name, [ui.el('div', { class: 'fields' }, b.fields.map(f => ui.field(f, ui.el('select', {}, [ui.el('option', {}, ['—'])]))))]));

  /* the panel: the view's name, View and Finish (Finish greyed where it does not belong), the tab's blocks */
  function drawPanel() {
    ui.panel(ui.byId('app'), ui.byId('panel-toggle'), state.panelOpen);
    const r = room();
    ui.byId('title').textContent = r ? roomName(r) : floor()?.name || data.house.name;
    ui.byId('subtitle').textContent = r ? `${floor()?.name} · ${r.id}` : state.floor ? data.house.name : data.house.subtitle;
    ui.byId('tabs').replaceChildren(...ui.choice(data.tabs.map(t => ({ ...t, on: state.tab === t.id, enabled: works(t) })), id => pick({ tab: id })));
    ui.byId('sections').replaceChildren(...(state.mode !== '3d' ? [] : state.tab === 'finish' ? finishTab() : viewTab()));
  }

  function render() {
    settle();
    drawFloors(); drawModes(); drawDock(); drawDocTabs(); drawCorner(); drawPanel();
  }

  /** @param {Partial<State>} change */
  function pick(change) { Object.assign(state, change); render(); }

  ui.byId('panel-toggle').addEventListener('click', () => pick({ panelOpen: !state.panelOpen }));
  ui.onClickOutside('.list-button', () => { if (state.list) pick({ list: null }); });

  return { state: () => ({ ...state, scope: scope() }), works, pick, render };
}

appModule(uiModule(document), SKETCH).render();
