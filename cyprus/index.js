// @ts-check
// index.js: joins index.html to the modules: the page's Alpine part. Sketch: the layout of the screen only; every value in
// SKETCH stands in for what the modules will give.

import { page, sunStore } from './core/ui.js';

/** @typedef {import('./core/ui.js').LayerTree} LayerTree */
/** @typedef {import('./core/ui.js').MenuItem} MenuItem */
/** @typedef {{ id: string, number: number, name: string, furniture?: boolean }} Room  id and number as archon gives them */

const SKETCH = {
  house: { name: 'Dom w papawerach 5 (G)', subtitle: 'archon.pl, as built', rects: [[0, 13200, 0, 9100]] },
  /** @type {{ id: string, name: string, rooms: Room[] }[]} */
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
  /** @type {{ id: string, name: string, tree: LayerTree }[]} the View's layer blocks */
  layerBlocks: [
    { id: 'floors', name: 'Floors', tree: {
      groundFloor: { name: 'Ground Floor' }, firstFloor: { name: 'First Floor' }, attic: { name: 'Attic' } } },
    { id: 'construction', name: 'Construction', tree: {
      foundation: { name: 'Foundation', layers: { footings: { name: 'Footings' }, foundationWalls: { name: 'Foundation walls' }, groundSlab: { name: 'Ground slab' } } },
      walls: { name: 'Walls', layers: { blocks: { name: 'Blocks' }, chimney: { name: 'Chimney' } } },
      slabs: { name: 'Slabs', layers: { ringBeams: { name: 'Ring beams' }, slab: { name: 'Slab' }, ceiling: { name: 'Attic ceiling' } } },
      roof: { name: 'Roof', layers: { roofPlanes: { name: 'Roof planes' }, roofWindows: { name: 'Roof windows' } } },
      openings: { name: 'Openings', layers: { windows: { name: 'Windows' }, outerDoors: { name: 'Outer doors' }, innerDoors: { name: 'Inner doors' } } },
      stair: { name: 'Stair' },
      insulation: { name: 'Insulation', layers: { eps: { name: 'EPS' }, facade: { name: 'Facade' } } },
      site: { name: 'Site', layers: { lawn: { name: 'Lawn' }, terraces: { name: 'Terraces' }, paving: { name: 'Paving' } } } } },
    { id: 'interiors', name: 'Interiors', tree: {
      tiles: { name: 'Tiles', layers: { floorTiles: { name: 'Floor tiles' }, wallTiles: { name: 'Wall tiles' }, smallCuts: { name: 'Small cuts' } } },
      carcasses: { name: 'Carcasses', layers: { boards: { name: 'Boards' }, backs: { name: 'Backs' }, shelves: { name: 'Shelves' }, drawers: { name: 'Drawers' },
        hardware: { name: 'Hinges and runners' }, holes: { name: 'Holes' }, legs: { name: 'Legs' } } },
      fronts: { name: 'Fronts', layers: { doorsAndDrawers: { name: 'Doors and drawers' }, handles: { name: 'Handles' }, strips: { name: 'Front strips' }, frontPanels: { name: 'Panels' }, plinth: { name: 'Plinth' } } },
      worktops: { name: 'Worktops', layers: { worktop: { name: 'Worktop' }, endPanels: { name: 'End panels' }, wallPanel: { name: 'Wall panel' } } },
      appliances: { name: 'Appliances', layers: { sink: { name: 'Sink' }, trap: { name: 'Trap' }, hob: { name: 'Hob' }, hood: { name: 'Hood' }, oven: { name: 'Oven' },
        microwave: { name: 'Microwave' }, coffee: { name: 'Coffee machine' }, fridge: { name: 'Fridge' }, dishwasher: { name: 'Dishwasher' } } },
      sanitary: { name: 'Sanitary', layers: { basin: { name: 'Basin' }, wc: { name: 'WC' }, shower: { name: 'Shower' }, mirror: { name: 'Mirror' }, radiator: { name: 'Radiator' } } },
      builtIns: { name: 'Built-ins', layers: { casings: { name: 'Casings' }, plasterboard: { name: 'Plasterboard' } } },
      installations: { name: 'Installations', layers: { riser: { name: 'Riser' }, wcFrame: { name: 'WC frame' } } },
      lights: { name: 'Lights', layers: { pendants: { name: 'Pendants' }, downlights: { name: 'Downlights' } } } } },
    { id: 'drawing', name: 'Drawing', tree: { edges: { name: 'Edges' } } }
  ],
  sun: { az: 225, el: 35, k: 1, clouds: 0.7, night: false }
};

const SUN = sunStore(SKETCH.sun);

page('sketch', {
  key: 'cyprus-sketch',
  fresh: () => ({ mode: '3d', tab: 'view', floor: null, room: null, layers: {}, open: {} }),
  valid: (/** @type {any} */ s) => typeof s.mode === 'string' && typeof s.layers === 'object' && typeof s.open === 'object',
  modes: ['3d', '2d', 'documents', 'cabinets'],
  modeNames: { '3d': '3D', '2d': '2D', documents: 'Documents', cabinets: 'Cabinet' },
  tabs: { '3d': ['view', 'finish'] },
  tabNames: { view: 'View', finish: 'Finish' },
  layerBlocks: SKETCH.layerBlocks.map(b => ({ ...b, tab: 'view' })),
  sun: { rects: SKETCH.house.rects, sun: SUN.state, change: SUN.save },

  /* what the view shows: the house, a floor, a room of it */
  get floor() { return SKETCH.floors.find(f => f.id === this.state.floor) || null; },
  get room() { return this.floor?.rooms.find((/** @type {Room} */ r) => r.id === this.state.room) || null; },
  get scope() { return this.room ? 'room' : this.floor ? 'floor' : 'house'; },
  /** @param {Room} r */
  roomName: r => `${r.number}. ${r.name}`,
  get title() { return this.room ? this.roomName(this.room) : this.floor ? this.floor.name : SKETCH.house.name; },
  get subtitle() { return this.room ? `${this.floor.name} · ${this.room.id}` : this.floor ? SKETCH.house.name : SKETCH.house.subtitle; },

  /* House, then each floor: its name picks it and opens its list of rooms */
  get nav() {
    return {
      links: [{ name: 'House', on: this.scope === 'house', go: () => this.show(null, null) }],
      groups: SKETCH.floors.map(f => ({
        label: f.id === this.state.floor && this.room ? `${f.name} · ${this.roomName(this.room)}` : f.name,
        on: f.id === this.state.floor, go: () => this.show(f.id, null),
        items: f.rooms.map(r => ({ name: this.roomName(r), title: r.id, on: r.id === this.state.room, go: () => this.show(f.id, r.id) }))
      }))
    };
  },
  /** @param {string | null} floor @param {string | null} room */
  show(floor, room) {
    this.state.floor = floor; this.state.room = room;
    if (this.modeOff(this.mode)) this.state.mode = '3d';
    if (this.tabOff(this.state.tab)) this.state.tab = 'view';
  },
  /* greyed where they do not apply: Cabinet, a room with furniture only; Finish, a floor or a room */
  /** @param {string} m */
  modeOff(m) { return m === 'cabinets' && !this.room?.furniture; },
  /** @param {string} t */
  tabOff(t) { return t === 'finish' && this.scope === 'house'; },

  /** @returns {Record<string, MenuItem[][]>} the bottom menu by mode */
  menus() {
    const none = () => {};
    return {
      '3d': [this.scope === 'house' ? [{ name: 'Walk', cls: 'walk', go: none }] : [],
        [{ name: 'Open', go: none }], [{ name: 'Front', go: none }, { name: 'Garden', go: none }, { name: 'Above', go: none }]],
      '2d': [[{ name: 'Save SVG', go: none }]],
      documents: [[{ name: 'Save XLSX', go: none }]],
      cabinets: [[{ name: 'Import', go: none }, { name: 'Export', go: none }], [{ name: 'Show in 3D', go: none }]]
    };
  },
  async load() { }
});
