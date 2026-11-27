// @ts-check
// index.js: joins index.html to the modules: the page's Alpine part. The 3D view: the house (house/assembly.js) drawn by scene.js,
// its layers and floors switched from the panel (layers.json). The rest is still a sketch: the values in SKETCH stand in for
// what the modules will give.

import { page, sunStore } from './core/ui.js';
import { openCatalog } from './library/catalog.js';
import { assembleHouse } from './house/assembly.js';
import { createScene } from './scene.js';

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
  sun: { az: 225, el: 35, k: 1, clouds: 0.7, night: false }
};

const SUN = sunStore(SKETCH.sun);

/* what the page builds once (outside Alpine: three.js's objects stay plain) */
/** @type {ReturnType<typeof createScene> | null} */
let PLOT = null;
/** @type {Awaited<ReturnType<typeof assembleHouse>> | null} */
let SITE = null;
/** @type {Record<string, string[]>} a layer's key, and the keys of the layers above it in the panel */
const ABOVE = {};

page('sketch', {
  key: 'cyprus-sketch',
  fresh: () => ({ mode: '3d', tab: 'view', floor: null, room: null, layers: {}, open: {} }),
  valid: (/** @type {any} */ s) => typeof s.mode === 'string' && typeof s.layers === 'object' && typeof s.open === 'object',
  modes: ['3d', '2d', 'documents', 'cabinets'],
  modeNames: { '3d': '3D', '2d': '2D', documents: 'Documents', cabinets: 'Cabinet' },
  tabs: { '3d': ['view', 'finish'] },
  tabNames: { view: 'View', finish: 'Finish' },
  sun: { rects: SKETCH.house.rects, sun: SUN.state, change: () => { SUN.save(); PLOT?.sun(SUN.state); } },

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
        [{ name: 'Open', go: none }], [{ name: 'Front', go: () => PLOT?.view('front') }, { name: 'Garden', go: () => PLOT?.view('garden') }, { name: 'Above', go: () => PLOT?.view('above') }]],
      '2d': [[{ name: 'Save SVG', go: none }]],
      documents: [[{ name: 'Save XLSX', go: none }]],
      cabinets: [[{ name: 'Import', go: none }, { name: 'Export', go: none }], [{ name: 'Show in 3D', go: none }]]
    };
  },
  /* the View's layers: layers.json, a block of the panel at its top level; the house in 3D */
  async load() {
    /** @type {Record<string, { name: string, layers: LayerTree }>} */
    const layers = await (await fetch(new URL('layers.json', import.meta.url))).json();
    this.layerBlocks = Object.entries(layers).map(([id, b]) => ({ id, name: b.name, tab: 'view', tree: b.layers }));
    (function above(/** @type {LayerTree} */ t, /** @type {string[]} */ up) {
      for (const [k, l] of Object.entries(t)) { ABOVE[k] = up; if (typeof l !== 'string') above(l.layers, [...up, k]); }
    })(Object.fromEntries(Object.values(layers).flatMap(b => Object.entries(b.layers))), []);
    const [catalog, site] = await Promise.all([openCatalog(), assembleHouse()]);
    const house = /** @type {any} */ (site.node('house')), view = house.settings.view;
    SITE = site;
    PLOT = createScene({ catalog, canvas: /** @type {HTMLCanvasElement} */ (document.getElementById('gl')), light: view.light, edges: view.edges });
    PLOT.show(site, house);
    PLOT.sun(SUN.state);
    this.onLayers();
  },
  /** a layer or a floor is on when it and every layer above it in the panel are; none: on @param {string | undefined} k */
  on(k) { return !k || [...(ABOVE[k] || []), k].every(a => this.state.layers[a] !== false); },
  /* the panel switched a layer: what the view shows */
  onLayers() {
    if (!PLOT || !SITE) return;
    PLOT.visible(k => this.on(k));
    PLOT.edges(this.on('edges'));
  },
  /** @param {string} m */
  onMode(m) { if (m === '3d') PLOT?.resize(); }
});
