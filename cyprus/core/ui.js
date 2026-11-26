// @ts-check
// core/ui.js: the screen of every page, on Alpine.js (from its CDN): the state kept in the browser, the page's Alpine part
// (page) and the pieces of the screen its HTML puts together (<template x-part="…">), light or dark, the layers as a tree,
// the sun. Knows no project. Touches the browser only when called.

import { fmt } from './tools.js';

/** @typedef {{ name: string, go: () => void, label?: string, cls?: string, pressed?: boolean }} MenuItem  a button of the bottom menu */
/** @typedef {{ name: string, layers?: LayerTree }} Layer */
/** @typedef {Record<string, Layer>} LayerTree  a layer by its key, the layers under it in its layers */
/** @typedef {{ k: string, name: string, depth: number, branch: boolean, open: boolean, on: boolean, partly: boolean, off: boolean }} LayerRow  a layer as the panel lists it: partly, on with a layer under it off; off, a parent off */
/** @typedef {{ az: number, el: number, k: number, clouds: number, night: boolean }} Sun */

/* the viewer's choices stay in the browser; a stored state that fails valid() is dropped for fresh() */
/** @template T @param {string} key @param {() => T} fresh @param {(s: any) => boolean} valid @returns {{ state: T, save: () => void }} */
function store(key, fresh, valid) {
  let state;
  try { state = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { state = null; }
  if (!state || !valid(state)) state = fresh();
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* private mode: nothing kept */ } };
  return { state, save };
}

/* ================= THE SCREEN =================
   A page is one Alpine part on its .app: page(name, spec). Its HTML puts the shared pieces where it wants them,
   <template x-part="dock"></template>, and writes what is its own (its view, its help, its panel's sections) into a piece
   that takes it: <template x-part="panel">…</template>. The pieces read these fields of the page:
     title, subtitle, loading, ready · nav {links, groups} · modes, modeNames, mode, pick(m), modeOff(m) · tabs, tabNames, tab, pickTab(t), tabOff(t) ·
     menu (groups of MenuItem) · float ('sun', 'help' or null) · sun · layerBlocks [{id, name, tab, tree}], rows(b), setLayer(k, on),
     openLayer(k) · state (kept in the browser: mode, tab, layers, open)
   spec: key, fresh(), valid(s) (the state kept), modes, modeNames {mode: name}, tabs {mode: [tab]}, tabNames {tab: name}, load() (async: builds the page), and the page's own
   fields, getters and methods: onMode(m), menus() ({mode: groups}), onLayers(); a getter that needs the page built asks this.ready. */

/* a state kept in the browser and reactive: every change is saved */
/** @param {string} key @param {() => any} fresh @param {(s: any) => boolean} valid */
function kept(key, fresh, valid) {
  const s = store(key, fresh, valid), state = Alpine.reactive(s.state);
  Alpine.effect(() => { JSON.stringify(state); s.save(); });
  return state;
}

/* the Alpine parts a piece of the screen names (x-data="sunBox(sun)"), by name; a file adds its own with component() */
/** @type {Record<string, (...args: any[]) => object>} */
const COMPONENTS = {};
/** an Alpine part a piece may name @param {string} name @param {(...args: any[]) => object} make */
export const component = (name, make) => { COMPONENTS[name] = make; };

/** the page's Alpine part, on its .app (x-data="name") @param {string} name @param {any} spec */
export function page(name, spec) {
  start();
  document.addEventListener('alpine:init', () => {
    Alpine.data(name, () => screen(spec));
    for (const [n, make] of Object.entries(COMPONENTS)) Alpine.data(n, make);
  });
}

/** @param {any} spec */
function screen(spec) {
  const { key, fresh, valid, modes = [], tabs = {} } = spec, own = Object.getOwnPropertyDescriptors(spec);   // getters stay getters
  for (const k of ['key', 'fresh', 'valid', 'modes', 'tabs']) delete own[k];
  /** @type {any} open: the page's own fields, getters and methods join it, and Alpine's ($nextTick) */
  const part = {
    ready: false, loading: 'Loading…', title: '', subtitle: '', nav: { links: [], groups: [] }, navOpen: null, modes, modeNames: {}, tabNames: {},
    float: null, sun: null, opened: false, modeOff: () => false, tabOff: () => false,
    state: key ? kept(key, fresh, valid) : { tab: null, layers: {}, open: {} },
    get mode() { return this.state.mode ?? null; },
    get tabs() { return tabs[this.mode] || []; },
    get tab() { const t = this.tabs; return t.includes(this.state.tab) ? this.state.tab : t[0] || null; },
    get menu() {                             // menus(): groups by mode, or the groups of a page without modes
      const m = this.ready && this.menus ? this.menus() : [];
      return (Array.isArray(m) ? m : m[this.mode] || []).filter((/** @type {MenuItem[]} */ g) => g.length);
    },
    layerBlocks: [],
    /** @param {string} m */
    pick(m) {
      if (m === this.mode || !modes.includes(m) || this.modeOff(m)) return;
      this.state.mode = m;
      if (m !== '3d' && this.float === 'sun') this.float = null;
      if (this.onMode) this.onMode(m);
    },
    /** @param {string} t */
    pickTab(t) { if (!this.tabOff(t)) this.state.tab = t; },
    /** @param {string} f */
    toggle(f) { this.float = this.float === f ? null : f; },
    /** @param {{ tree: LayerTree }} b */
    rows(b) { return layerRows(b.tree, this.state.layers, this.state.open); },
    /** @param {string} k @param {boolean} on */
    setLayer(k, on) { this.state.layers[k] = on; if (this.onLayers) this.onLayers(); },
    /** @param {string} k */
    openLayer(k) { this.state.open[k] = !this.state.open[k]; },
    async init() {
      await this.$nextTick();                // the pieces are in
      try { await this.load(); this.loading = ''; this.ready = true; }
      catch (e) { console.error(e); this.loading = 'Error: ' + (e instanceof Error ? e.message : e); }
    }
  };
  return Object.defineProperties(part, own);
}

/* light or dark: the system's, until the viewer picks one with ◐; the panel shown or hidden with » and «: one choice for
   every page, applied before anything shows (nothing flashes); the store 'screen' for ◐ and » «; the pieces */
/** @type {{ state: { mode: string | null }, save: () => void }} */
let THEME;
/** @type {{ state: { open: boolean }, save: () => void }} */
let PANEL;
function showScreen() {
  const root = document.documentElement;
  if (THEME.state.mode) root.dataset.theme = THEME.state.mode; else delete root.dataset.theme;
  root.toggleAttribute('data-panel-closed', !PANEL.state.open);
}
function start() {
  THEME = store('cyprus-theme', () => ({ mode: null }), s => [null, 'light', 'dark'].includes(s.mode));
  PANEL = store('cyprus-panel', () => ({ open: true }), s => typeof s.open === 'boolean');
  showScreen();
  document.addEventListener('alpine:init', () => {
    Alpine.store('screen', {
      open: PANEL.state.open,
      togglePanel() { this.open = PANEL.state.open = !this.open; PANEL.save(); showScreen(); },
      toggleTheme() {
        const dark = THEME.state.mode ? THEME.state.mode === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
        THEME.state.mode = dark ? 'light' : 'dark'; THEME.save(); showScreen();
      }
    });
    /* <template x-part="name">…</template>: the piece in its place, what the template holds put into its [data-slot] */
    Alpine.directive('part', (/** @type {HTMLTemplateElement} */ el, /** @type {{ expression: string }} */ { expression }) => {
      const t = document.createElement('template');
      t.innerHTML = PARTS[expression];
      const slot = t.content.querySelector('[data-slot]');
      if (slot) { slot.removeAttribute('data-slot'); slot.append(el.content.cloneNode(true)); }
      const nodes = [...t.content.children];
      Alpine.mutateDom(() => { el.after(t.content); nodes.forEach(n => Alpine.initTree(n)); });
    });
  });
}

/* ================= LAYERS =================
   In the panel a branch is closed until opened; a layer under a branch that is off is greyed; a branch on with a layer under it off shows a dash. */
/** @param {LayerTree} tree @param {Record<string, boolean>} on  false: off @param {Record<string, boolean>} open  true: open @returns {LayerRow[]} */
function layerRows(tree, on, open) {
  /** @param {Layer} l @returns {boolean} */
  const partly = l => Object.entries(l.layers || {}).some(([k, c]) => on[k] === false || partly(c));
  /** @param {LayerTree} t @param {number} depth @param {boolean} off @returns {LayerRow[]} */
  const rows = (t, depth, off) => Object.entries(t).flatMap(([k, l]) => {
    const row = { k, name: l.name, depth, branch: !!l.layers, open: !!l.layers && !!open[k], on: on[k] !== false, partly: false, off };
    row.partly = row.on && partly(l);
    return row.open ? [row, ...rows(/** @type {LayerTree} */ (l.layers), depth + 1, off || !row.on)] : [row];
  });
  return rows(tree, 0, false);
}

/* ================= THE SUN =================
   ☀: a compass with the plan in the middle (rects [x1, x2, y1, y2] mm) and the sun dragged round it; an arc beside it (the
   height); brightness; clouds; day or night. The page sets sun {rects, mark, sun, change}: sun is changed in place, change()
   after every move; mark: rects picked out on the plan (the part shown). */
const SUN_RANGE = { azStep: 5, el: [8, 75], k: [0.3, 1.6, 0.05], clouds: [0, 1, 0.05] };   // degrees, degrees, a factor, a share
const SC = 80, SR = 64, SA = 120, STOP = 20;   // svg units: compass centre and radius; the arc's radius and top margin
/* one sun for every page, stored once: every page shows the same time of day */
/** @param {Sun} start */
export const sunStore = start => store('cyprus-sun', () => ({ ...start }), s => [s.az, s.el, s.k, s.clouds].every(Number.isFinite));
/** @param {{ rects: number[][], mark?: number[][], sun: Sun, change: () => void }} spec */
function sunBox({ rects, mark = [], sun, change }) {
  const raw = Alpine.raw(sun);
  const x1 = Math.min(...rects.map(q => q[0])), x2 = Math.max(...rects.map(q => q[1])), y1 = Math.min(...rects.map(q => q[2])), y2 = Math.max(...rects.map(q => q[3]));
  const s = 0.62 * SR * 2 / Math.hypot(x2 - x1, y2 - y1), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const rect = (/** @type {number[]} */ q) => `<rect x="${SC + (q[2] - cy) * s}" y="${SC + (q[0] - cx) * s}" width="${(q[3] - q[2]) * s}" height="${(q[1] - q[0]) * s}"/>`;
  /** @type {string | null} */
  let dragging = null;
  return {
    fmt, plan: rects.map(rect).join('') + `<g class="mark">${mark.map(rect).join('')}</g>`,
    az: raw.az, el: raw.el, k: raw.k, clouds: raw.clouds, night: !!raw.night,
    get compass() { const a = this.az * Math.PI / 180; return [SC + SR * Math.sin(a), SC + SR * Math.cos(a)]; },
    get arc() { const e = this.el * Math.PI / 180; return [10 + SA * Math.cos(e), SA + STOP - SA * Math.sin(e)]; },
    /** @param {'az' | 'el' | 'k' | 'clouds' | 'night'} key @param {number | boolean} v */
    set(key, v) { /** @type {any} */ (this)[key] = raw[key] = v; change(); },
    /* a drag on an svg: the pointer in its own units */
    /** @param {PointerEvent} e @param {string} what */
    down(e, what) { /** @type {Element} */ (e.currentTarget).setPointerCapture(e.pointerId); dragging = what; this.move(e); },
    /** @param {PointerEvent} e */
    move(e) {
      if (!dragging) return;
      const svg = /** @type {SVGSVGElement} */ (e.currentTarget), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(/** @type {DOMMatrix} */ (svg.getScreenCTM()).inverse());
      if (dragging === 'az') { const d = Math.atan2(q.x - SC, q.y - SC) * 180 / Math.PI; this.set('az', (Math.round(d / SUN_RANGE.azStep) * SUN_RANGE.azStep + 360) % 360); }
      else { const d = Math.atan2(SA + STOP - q.y, q.x - 10) * 180 / Math.PI; this.set('el', Math.min(SUN_RANGE.el[1], Math.max(SUN_RANGE.el[0], Math.round(d)))); }
    },
    up() { dragging = null; }
  };
}

/* ================= THE PIECES ================= */
const ROUND = 'class="round" aria-controls';
/** @type {Record<string, string>} */
const PARTS = {
  nav: `<nav class="nav" id="nav" aria-label="Places"><template x-for="it in nav.links"><a href="#" :data-on="it.on && ''" @click.prevent="it.go()" x-text="it.name"></a></template><template x-for="(g, i) in nav.groups"><details :open="navOpen === i" :data-on="g.on && ''" @click.outside="navOpen === i && (navOpen = null)"><summary @click.prevent="g.go(); navOpen = navOpen === i ? null : i" x-text="g.label"></summary><div class="navlist"><template x-for="it in g.items"><a href="#" :data-on="it.on && ''" :title="it.title || false" @click.prevent="it.go(); navOpen = null" x-text="it.name"></a></template></div></details></template></nav>`,
  view: `<canvas id="gl" aria-label="3D view" :hidden="mode !== '3d'"></canvas>`,
  loading: `<div id="loading" x-show="loading" x-text="loading"></div>`,
  modes: `<div class="toggle modes" id="mode" role="group" aria-label="Mode"><template x-for="m in modes"><button :data-mode="m" :aria-pressed="String(mode === m)" :data-on="mode === m && ''" :disabled="modeOff(m)" @click="pick(m)" x-text="modeNames[m]"></button></template></div>`,
  dock: `<div class="dock" id="dock" aria-label="Bottom menu"><template x-for="(g, gi) in menu"><span class="group"><span class="sep" x-show="gi"></span><template x-for="it in g"><button :class="it.cls || false" :aria-label="it.label || false" :aria-pressed="it.pressed === undefined ? false : String(it.pressed)" @click="it.go($event)" x-text="it.name"></button></template></span></template></div>`,
  sun: `<div class="float sunfloat" id="sun" role="dialog" aria-label="Sun" x-show="float === 'sun'" x-cloak><template x-if="sun"><div x-data="sunBox(sun)"><template x-part="sunbox"></template></div></template></div>`,
  sunbox: `<div class="sunrow">
    <svg class="compass" viewBox="0 0 ${2 * SC} ${2 * SC}" aria-label="Direction of the sun" @pointerdown="down($event, 'az')" @pointermove="move($event)" @pointerup="up()" @pointercancel="up()">
      <circle cx="${SC}" cy="${SC}" r="${SR}" class="ring"/><g class="plan" x-html="plan"></g>
      <line class="ray" x1="${SC}" y1="${SC}" :x2="compass[0]" :y2="compass[1]"/><circle class="sundot" r="9" :cx="compass[0]" :cy="compass[1]"/></svg>
    <svg class="arc" viewBox="0 0 ${SA + 20} ${SA + STOP + 10}" aria-label="Height of the sun" @pointerdown="down($event, 'el')" @pointermove="move($event)" @pointerup="up()" @pointercancel="up()">
      <path class="ring" d="M10 ${SA + STOP} A${SA} ${SA} 0 0 0 ${SA + 10} ${STOP}" fill="none"/>
      <line class="ground" x1="10" y1="${SA + STOP}" x2="${SA + 14}" y2="${SA + STOP}"/><line class="ray" x1="10" y1="${SA + STOP}" :x2="arc[0]" :y2="arc[1]"/><circle class="sundot" r="9" :cx="arc[0]" :cy="arc[1]"/></svg></div>
  <p class="sunread" x-text="'Direction ' + az + '° · height ' + el + '°'"></p>
  <div class="rng"><label for="sunk">Brightness</label><span x-text="fmt(k, 2)"></span><input id="sunk" type="range" min="${SUN_RANGE.k[0]}" max="${SUN_RANGE.k[1]}" step="${SUN_RANGE.k[2]}" :value="k" @input="set('k', +$event.target.value)"></div>
  <div class="rng"><label for="sunc">Clouds</label><span x-text="Math.round(clouds * 100) + '%'"></span><input id="sunc" type="range" min="${SUN_RANGE.clouds[0]}" max="${SUN_RANGE.clouds[1]}" step="${SUN_RANGE.clouds[2]}" :value="clouds" @input="set('clouds', +$event.target.value)"></div>
  <div class="toggle daynight" role="group" aria-label="Time of day"><button :data-on="!night && ''" :aria-pressed="String(!night)" @click="set('night', false)">Day</button><button :data-on="night && ''" :aria-pressed="String(night)" @click="set('night', true)">Night</button></div>`,
  help: `<div class="float" id="help" role="dialog" aria-label="Help" x-show="float === 'help'" x-cloak data-slot></div>`,
  corner: `<div class="corner">
    <button ${ROUND}="" id="themebtn" aria-label="Light / dark" title="Light / dark" @click="$store.screen.toggleTheme()"><svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 1.4a6.6 6.6 0 0 1 0 13.2z" fill="currentColor"/></svg></button>
    <button ${ROUND}="sun" id="sunbtn" aria-label="Sun" title="Sun" :aria-expanded="String(float === 'sun')" x-show="sun && mode === '3d'" @click="toggle('sun')">☀</button>
    <button ${ROUND}="help" id="helpbtn" aria-label="Help" title="Help" :aria-expanded="String(float === 'help')" @click="toggle('help')">?</button></div>
  <button class="panelbtn" @click="$store.screen.togglePanel()" x-text="$store.screen.open ? '»' : '«'" :title="$store.screen.open ? 'Hide the panel' : 'Show the panel'" :aria-label="$store.screen.open ? 'Hide the panel' : 'Show the panel'"></button>`,
  panel: `<aside id="panel" data-slot><h1 id="title" x-text="title"></h1><p class="sub" id="subtitle" x-text="subtitle"></p>
    <div class="toggle" id="tabs" role="tablist" aria-label="Panel" x-show="tabs.length > 1" x-cloak><template x-for="t in tabs"><button role="tab" :data-tab-id="t" :aria-selected="String(t === tab)" :data-on="t === tab && ''" :disabled="tabOff(t)" @click="pickTab(t)" x-text="tabNames[t]"></button></template></div></aside>`,
  layers: `<template x-for="b in layerBlocks" :key="b.id"><section x-show="tab === b.tab" x-cloak><h2 x-text="b.name"></h2><div class="layers" :id="b.id"><template x-for="l in rows(b)" :key="l.k"><div class="row" :data-off="l.off && ''" :style="'padding-left:' + l.depth * 22 + 'px'">
    <input type="checkbox" :aria-label="l.name" :checked="l.on" :disabled="l.off" x-effect="$el.indeterminate = l.partly" @change="setLayer(l.k, $event.target.checked)">
    <template x-if="l.branch"><button type="button" class="branch" :aria-expanded="String(l.open)" @click="openLayer(l.k)"><span class="arrow" x-text="l.open ? '▾' : '▸'"></span><span x-text="l.name"></span></button></template>
    <template x-if="!l.branch"><span x-text="l.name" @click="!l.off && setLayer(l.k, !l.on)" style="cursor:pointer"></span></template></div></template></div></section></template>`
};
/** a piece of the screen a file adds (<template x-part="name">) @param {string} name @param {string} html */
export const part = (name, html) => { PARTS[name] = html; };
component('sunBox', sunBox);
