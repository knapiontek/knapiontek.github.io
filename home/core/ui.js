// @ts-check
/* core/ui.js: the screen of every page, on Alpine.js: helpers, the state kept in the browser, the page's Alpine part
   (HOME.ui.page) and the pieces of the screen its HTML puts together (<template x-part="…">), light or dark, the layers, the
   sun, the 2D sheet, the widths of a table's columns. Knows no project. Touches the browser only when called. */
/** @typedef {{ name: string, items: string[], info?: boolean, about?: string }} Check  OK when items is empty; info: to know, not to correct */
/** @typedef {{ name: string, go: () => void, label?: string, cls?: string, pressed?: boolean }} MenuItem  a button of the bottom menu */
/** @typedef {Object<string, { name: string, parent: string | null }>} LayerTree  layer -> its name and parent */
/** @typedef {{ k: string, name: string, on: boolean, child: boolean, off: boolean }} LayerItem  a layer as the panel lists it */
function uiModule() {
'use strict';

const { LOCALE, fmt } = HOME.tools;        // core/tools.js, until ui gets it as a parameter (plan.md)
const $ = (/** @type {string} */ id) => document.getElementById(id);
/**
 * @template {{ id: string }} T
 * @param {T[]} list
 * @returns {Record<string, T>}
 */
function byId(list) { return Object.fromEntries(list.map(e => [e.id, e])); }
/** @param {string} tag @param {object} attrs @param {string} [html] @returns {any} an element with attrs */
const el = (tag, attrs, html) => { const e = document.createElement(tag); Object.assign(e, attrs); if (html !== undefined) e.innerHTML = html; return e; };
const esc = (/** @type {any} */ v) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);   // text into HTML

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
   A page is one Alpine part on its .app: HOME.ui.page(name, spec). Its HTML puts the shared pieces where it wants them,
   <template x-part="dock"></template>, and writes what is its own (its view, its help, its panel's sections) into a piece
   that takes it: <template x-part="panel">…</template>. The pieces read these fields of the page:
     title, subtitle, loading, ready · nav {links, groups} · modes, mode, pick(m) · tabs, tab, pickTab(t) · menu (groups of
     {name, go, label, cls, pressed}) · float ('sun', 'help' or null) · sun · plan {svg, note} · docs ·
     layerBlocks [{name, id, tab, items}], setLayer(k, on) · state (kept in the browser: mode, tab, zoom, layers, …)
   spec: key, fresh(), valid(s) (the state kept), modes, tabs {mode: [tab]}, load() (async: builds the page), and the page's
   own fields, getters and methods: onMode(m), menus() ({mode: groups}), onLayers(); a getter that needs the page built
   asks this.ready first. */
const MODES = { '3d': '3D', '2d': '2D', documents: 'Documents', cabinets: 'Cabinets' };
const TAB_NAMES = { view: 'View', layers: 'Layers', finish: 'Finish' };
/* the menu's one button for the moving parts: Open opens them all, then it is Close */
/** @param {{ opened: boolean }} ui @param {{ toggleAll: (on: boolean) => void }} V @returns {MenuItem} */
function openAll(ui, V) {
  return { name: ui.opened ? 'Close' : 'Open', cls: 'open', pressed: ui.opened, go: () => { ui.opened = !ui.opened; V.toggleAll(ui.opened); } };
}
/* a state kept in the browser and reactive: every change is saved */
function kept(key, fresh, valid) {
  const s = store(key, fresh, valid), state = Alpine.reactive(s.state);
  Alpine.effect(() => { JSON.stringify(state); s.save(); });
  return state;
}
/** the page's Alpine part, on its .app (x-data="name") @param {string} name @param {object} spec */
function page(name, spec) {
  start();
  document.addEventListener('alpine:init', () => Alpine.data(name, () => screen(spec)));
}
function screen(spec) {
  const { key, fresh, valid, modes = [], tabs = {} } = spec, own = Object.getOwnPropertyDescriptors(spec);   // getters stay getters
  for (const k of ['key', 'fresh', 'valid', 'modes', 'tabs']) delete own[k];
  const part = {
    ready: false, loading: 'Loading…', title: '', subtitle: '', nav: { links: [], groups: [] }, navOpen: null, modes,
    float: null, sun: null, docs: null, plan: { svg: '', note: '' }, walking: false, opened: false, tabOff: () => false,
    state: key ? kept(key, fresh, valid) : { tab: null, zoom: 1, layers: {} },
    get mode() { return this.state.mode ?? null; },
    get tabs() { return tabs[this.mode] || []; },
    get tab() { const t = this.tabs; return t.includes(this.state.tab) ? this.state.tab : t[0] || null; },
    get menu() {                             // menus(): groups by mode, or the groups of a page without modes
      const m = this.ready && this.menus ? this.menus() : [];
      return (Array.isArray(m) ? m : m[this.mode] || []).filter(g => g.length);
    },
    layerBlocks: [],
    pick(m) {
      if (m === this.mode || !modes.includes(m)) return;
      this.state.mode = m;
      if (m !== '3d' && this.float === 'sun') this.float = null;
      if (this.onMode) this.onMode(m);
    },
    pickTab(t) { this.state.tab = t; },
    toggle(f) { this.float = this.float === f ? null : f; },
    setLayer(k, on) { this.state.layers[k] = on; if (this.onLayers) this.onLayers(); },
    async init() {
      await this.$nextTick();                // the pieces are in
      try { await this.load(); this.loading = ''; this.ready = true; }
      catch (e) { console.error(e && e.stack || e); this.loading = 'Error: ' + (e.message || e); }
    },
    /* the 2D sheet: the wheel zooms about the cursor (the point under it stays), a drag moves the sheet */
    wheel(e) {
      const sheet = e.currentTarget, was = this.state.zoom, now = Math.min(8, Math.max(1, was * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      if (now === was) return;
      const r = sheet.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
      const px = (sheet.scrollLeft + cx) / sheet.scrollWidth, py = (sheet.scrollTop + cy) / sheet.scrollHeight;   // the point under the cursor
      this.state.zoom = now; sheet.style.setProperty('--zoom', now);   // now, so the scroll below is right
      sheet.scrollLeft = px * sheet.scrollWidth - cx; sheet.scrollTop = py * sheet.scrollHeight - cy;
    },
    down(e) { if (e.button === 0) { const s = e.currentTarget; DRAG = { x: e.clientX, y: e.clientY, l: s.scrollLeft, t: s.scrollTop }; s.setPointerCapture(e.pointerId); } },
    move(e) { if (DRAG) { const s = e.currentTarget; s.scrollLeft = DRAG.l - (e.clientX - DRAG.x); s.scrollTop = DRAG.t - (e.clientY - DRAG.y); } },
    up() { DRAG = null; }
  };
  return Object.defineProperties(part, own);
}
let DRAG = null;

/* light or dark: the system's, until the viewer picks one with ◐; the panel shown or hidden with » and «: one choice for
   every page, applied before anything shows (nothing flashes); the store 'screen' for ◐ and » «; the pieces */
let THEME = null, PANEL = null;
function showScreen() {
  const root = document.documentElement;
  if (THEME.state.mode) root.dataset.theme = THEME.state.mode; else delete root.dataset.theme;
  root.toggleAttribute('data-panel-closed', !PANEL.state.open);
}
function start() {
  THEME = store('home-theme', () => ({ mode: null }), s => [null, 'light', 'dark'].includes(s.mode));
  PANEL = store('home-panel', () => ({ open: true }), s => typeof s.open === 'boolean');
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
    Alpine.directive('part', (el, { expression }) => {
      const t = document.createElement('template');
      t.innerHTML = PARTS[expression];
      const slot = t.content.querySelector('[data-slot]');
      if (slot) { slot.removeAttribute('data-slot'); slot.append(el.content.cloneNode(true)); }
      const nodes = [...t.content.children];
      Alpine.mutateDom(() => { el.after(t.content); nodes.forEach(n => Alpine.initTree(n)); });
    });
  });
}

/* ================= LAYERS ================= */
/* the layers tree: {id: {name, layers: {...}}} -> id -> {name, parent} */
/** @param {Object<string, { name: string, layers?: object }>} tree @returns {LayerTree} */
function layerTree(tree) {
  /** @type {LayerTree} */ const LAYER = {};
  (function walk(t, /** @type {string|null} */ parent) { for (const [k, v] of Object.entries(t)) { LAYER[k] = { name: v.name, parent }; if (v.layers) walk(v.layers, k); } })(tree, null);
  return LAYER;
}
/* a layer is on when it and all its parents are on; an object is shown when all its layers are on */
/** @param {LayerTree} LAYER @param {() => Object<string, boolean>} getLayers */
function layerSwitch(LAYER, getLayers) {
  /** @type {(k: string) => boolean} */
  const layerOn = k => getLayers()[k] !== false && (!LAYER[k].parent || layerOn(LAYER[k].parent));
  const shown = (/** @type {string[]} */ layers) => layers.every(layerOn);
  return { layerOn, shown };
}
/* the layers as a list for the panel: each top layer with its children under it; off: a child whose parent is off */
/** @param {LayerTree} LAYER @param {string[]} top @param {Object<string, boolean>} state @param {(k: string) => boolean} layerOn @returns {LayerItem[]} */
function layerList(LAYER, top, state, layerOn) {
  return top.flatMap(k => [{ k, name: LAYER[k].name, on: state[k] !== false, child: false, off: false },
    ...Object.keys(LAYER).filter(c => LAYER[c].parent === k).map(c => ({ k: c, name: LAYER[c].name, on: state[c] !== false, child: true, off: !layerOn(k) }))]);
}

/* ================= THE SUN =================
   ☀: a compass with the plan in the middle (rects [x1, x2, y1, y2] mm, x down and y right as on the 2D plan) and the sun
   dragged round it (the direction, from +x toward +y as core/scene.js); an arc beside it (the height); brightness; clouds;
   day or night. The page sets sun {rects, mark, sun, change}: sun {az, el, k, clouds, night} is changed in place, change()
   after every move; mark: rects picked out on the plan (the part of the house shown). */
const SUN_RANGE = { azStep: 5, el: [8, 75], k: [0.3, 1.6, 0.05], clouds: [0, 1, 0.05] };   // degrees, degrees, a factor, a share
const SC = 80, SR = 64, SA = 120, STOP = 20;   // svg units: compass centre and radius; the arc's radius and top margin
/* one sun for every page, stored once: every page shows the same time of day. light: the light of the page's data */
const sunStore = (/** @type {Light} */ light) => store('home-sun', () => ({ az: light.sun.azimuth, el: light.sun.elevation, k: 1, clouds: light.clouds.value, night: false }),
  s => [s.az, s.el, s.k, s.clouds].every(Number.isFinite));
function sunBox({ rects, mark = [], sun, change }) {
  const raw = Alpine.raw(sun);
  const x1 = Math.min(...rects.map(q => q[0])), x2 = Math.max(...rects.map(q => q[1])), y1 = Math.min(...rects.map(q => q[2])), y2 = Math.max(...rects.map(q => q[3]));
  const s = 0.62 * SR * 2 / Math.hypot(x2 - x1, y2 - y1), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const rect = q => `<rect x="${SC + (q[2] - cy) * s}" y="${SC + (q[0] - cx) * s}" width="${(q[3] - q[2]) * s}" height="${(q[1] - q[0]) * s}"/>`;
  let dragging = null;
  return {
    fmt, plan: rects.map(rect).join('') + `<g class="mark">${mark.map(rect).join('')}</g>`,
    az: raw.az, el: raw.el, k: raw.k, clouds: raw.clouds, night: !!raw.night,
    get compass() { const a = this.az * Math.PI / 180; return [SC + SR * Math.sin(a), SC + SR * Math.cos(a)]; },
    get arc() { const e = this.el * Math.PI / 180; return [10 + SA * Math.cos(e), SA + STOP - SA * Math.sin(e)]; },
    set(key, v) { this[key] = raw[key] = v; change(); },
    /* a drag on an svg: the pointer in its own units */
    down(e, what) { e.currentTarget.setPointerCapture(e.pointerId); dragging = what; this.move(e); },
    move(e) {
      if (!dragging) return;
      const svg = e.currentTarget, p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(svg.getScreenCTM().inverse());
      if (dragging === 'az') { const d = Math.atan2(q.x - SC, q.y - SC) * 180 / Math.PI; this.set('az', (Math.round(d / SUN_RANGE.azStep) * SUN_RANGE.azStep + 360) % 360); }
      else { const d = Math.atan2(SA + STOP - q.y, q.x - 10) * 180 / Math.PI; this.set('el', Math.min(SUN_RANGE.el[1], Math.max(SUN_RANGE.el[0], Math.round(d)))); }
    },
    up() { dragging = null; }
  };
}

/* a text or an svg as a download */
/** @param {string} text @param {string} type @param {string} file */
function download(text, type, file) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type })), download: file });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ================= THE PIECES ================= */
const ROUND = 'class="round" aria-controls';
const PARTS = {
  nav: `<nav class="nav" id="nav" aria-label="Rooms"><template x-for="it in nav.links"><a :href="it.href" :data-on="it.on && ''" x-text="it.name"></a></template><template x-for="(g, i) in nav.groups"><details :open="navOpen === i" :data-on="g.on && ''" @click.outside="navOpen === i && (navOpen = null)"><summary @click.prevent="navOpen = navOpen === i ? null : i" x-text="g.name"></summary><div class="navlist"><template x-for="it in g.items"><a :href="it.href" :data-on="it.on && ''" x-text="it.name"></a></template></div></details></template></nav>`,
  view: `<canvas id="gl" aria-label="3D view" :hidden="mode !== '3d'"></canvas>`,
  loading: `<div id="loading" x-show="loading" x-text="loading"></div>`,
  modes: `<div class="toggle modes" id="mode" role="group" aria-label="Mode"><template x-for="m in modes"><button :data-mode="m" :aria-pressed="String(mode === m)" :data-on="mode === m && ''" @click="pick(m)" x-text="HOME.ui.MODES[m]"></button></template></div>`,
  plan: `<div id="plan2d" aria-label="2D plan" x-show="mode === '2d'" x-cloak><p class="sheetnote" id="planNote" x-text="plan.note"></p><div id="sheet" x-html="plan.svg" :style="'--zoom: ' + state.zoom" @wheel.prevent="wheel($event)" @pointerdown="down($event)" @pointermove="move($event)" @pointerup="up()" @pointercancel="up()"></div></div>`,
  docs: `<div id="documents" aria-label="Documents" x-show="mode === 'documents'" x-cloak><template x-if="docs"><div class="docview" x-data="HOME.sheet.view(docs)"><template x-part="sheet"></template></div></template></div>`,
  dock: `<div class="dock" id="dock" aria-label="Bottom menu"><template x-for="(g, gi) in menu"><span class="group"><span class="sep" x-show="gi"></span><template x-for="it in g"><button :class="it.cls || false" :aria-label="it.label || false" :aria-pressed="it.pressed === undefined ? false : String(it.pressed)" @click="it.go($event)" x-text="it.name"></button></template></span></template></div>`,
  pad: `<div class="pad" id="pad" aria-label="Walk" hidden><button data-k="ArrowUp" aria-label="Forward">▲</button><button data-k="ArrowLeft" aria-label="Turn left">◀</button><button data-k="ArrowDown" aria-label="Back">▼</button><button data-k="ArrowRight" aria-label="Turn right">▶</button></div>`,
  sun: `<div class="float sunfloat" id="sun" role="dialog" aria-label="Sun" x-show="float === 'sun'" x-cloak><template x-if="sun"><div x-data="HOME.ui.sunBox(sun)"><template x-part="sunbox"></template></div></template></div>`,
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
    <div class="toggle" id="tabs" role="tablist" aria-label="Panel" x-show="tabs.length > 1" x-cloak><template x-for="t in tabs"><button role="tab" :data-tab-id="t" :aria-selected="String(t === tab)" :data-on="t === tab && ''" :disabled="tabOff(t)" @click="pickTab(t)" x-text="HOME.ui.TAB_NAMES[t]"></button></template></div></aside>`,
  layers: `<template x-for="b in layerBlocks" :key="b.id"><section x-show="tab === b.tab && b.items.length" x-cloak><h2 x-text="b.name"></h2><div class="layers" :id="b.id"><template x-for="l in b.items" :key="l.k"><div :class="l.child ? 'child' : ''" :data-off="l.off && ''"><label><input type="checkbox" :checked="l.on" @change="setLayer(l.k, $event.target.checked)"> <span x-text="l.name"></span></label></div></template></div></section></template>`
};

/* ================= COLUMN WIDTHS =================
   cols: one per column, {fix: n} for numbers, codes and units (n characters, as wide as their longest value), or
   {share: k, min?, max?} for text (the room left, in proportion to k, from min to max characters; min 8). A fixed column
   is never narrower than the longest word of its header, and no column narrower than the fields and buttons in it. If the
   text columns reach their max, the table is narrower than its box; if they cannot get their min, it is wider and scrolls. */
let measure = null;
function textWidth(text, font) {
  measure = measure || document.createElement('canvas').getContext('2d');
  if (measure.font !== font) measure.font = font;
  return measure.measureText(text).width;
}
function setColumns(table, cols, room) {
  if (!cols || !cols.length || !(room > 0)) return;
  const cell = table.querySelector('tbody td, tr:not(.title):not(.head):not(.cat):not(.sum):not(.grand) td') || table, cs = getComputedStyle(cell);   // an item's cell
  const ch = parseFloat(cs.fontSize) * 0.6, pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 1;
  /* the header's longest word under each column */
  const headWord = new Array(cols.length).fill(0);
  const head = [...table.rows].find(r => r.cells.length > 1 && (r.cells[0].tagName === 'TH' || /\bhead\b/.test(r.className)));
  if (head) {
    let at = 0;
    for (const c of head.cells) {
      if (c.colSpan === 1) {
        const hs = getComputedStyle(c), up = hs.textTransform === 'uppercase', ls = parseFloat(hs.letterSpacing) || 0;
        const t = c.textContent.trim(), words = (hs.whiteSpace === 'nowrap' ? [t] : t.split(/\s+/)).map(w => (up ? w.toUpperCase() : w));   // a header that does not wrap: whole
        headWord[at] = Math.max(0, ...words.map(w => textWidth(w, hs.font) + ls * w.length)) + parseFloat(hs.paddingLeft) + parseFloat(hs.paddingRight) + 2;
      }
      at += c.colSpan;
    }
  }
  /* the controls in each column (fields, buttons): a column is never narrower than they need, so nothing sticks out */
  const ctrl = new Array(cols.length).fill(0);
  for (const r of table.rows) {
    let at = 0;
    for (const c of r.cells) {
      if (c.colSpan === 1) {
        const parts = [...c.querySelectorAll('input:not([type=hidden]), select, button')];
        if (parts.length) {
          /* side by side (a cell that does not wrap): the sum of their widths; else what each needs at least. A field fills
             its cell (it is as wide as the column was last time): it counts with its min-width, so a fit does not feed the next */
          const cc = getComputedStyle(c), inLine = cc.whiteSpace === 'nowrap';
          const need = parts.reduce((a, e) => { const es = getComputedStyle(e), m = (parseFloat(es.marginLeft) || 0) + (parseFloat(es.marginRight) || 0);
            const own = e.tagName === 'BUTTON' ? e.offsetWidth : parseFloat(es.minWidth) || 0;
            return inLine ? a + own + m : Math.max(a, (parseFloat(es.minWidth) || 0) + m); }, 0);
          ctrl[at] = Math.max(ctrl[at], need + parseFloat(cc.paddingLeft) + parseFloat(cc.paddingRight) + 1);
        }
      }
      at += c.colSpan;
    }
  }
  const spec = cols.map(c => (c && (c.fix || c.share) ? c : { share: 1 }));
  const w = spec.map((c, i) => (c.fix ? Math.max(c.fix * ch + pad, headWord[i], ctrl[i]) : 0));
  const text = spec.map((c, i) => !c.fix ? i : -1).filter(i => i >= 0);
  let left = room - w.reduce((a, b) => a + b, 0), open = text.slice();
  /* the text columns share what is left; one that reaches its min or max is held there and the rest share again */
  for (let pass = 0; pass < 4 && open.length; pass++) {
    const k = open.reduce((a, i) => a + spec[i].share, 0), next = [];
    for (const i of open) {
      const c = spec[i], lo = Math.max((c.min || 8) * ch + pad, ctrl[i]), hi = c.max ? c.max * ch + pad : Infinity;
      w[i] = Math.min(hi, Math.max(lo, left * c.share / k));
      if (w[i] > lo && w[i] < hi) next.push(i);
    }
    const fixedText = open.filter(i => !next.includes(i)).reduce((a, i) => a + w[i], 0);
    if (next.length === open.length) break;
    left -= fixedText; open = next;
  }
  let cg = table.querySelector(':scope > colgroup');
  if (!cg) { cg = document.createElement('colgroup'); table.prepend(cg); }
  cg.innerHTML = w.map(x => `<col style="width:${Math.floor(x)}px">`).join('');
  table.style.tableLayout = 'fixed';
  table.style.width = w.reduce((a, b) => a + Math.floor(b), 0) + 'px';
}
/* sets a table's columns now and again when its box changes size or the fonts arrive */
function autoFit(table, box, cols) {
  const fit = () => { const room = box.clientWidth - 2; if (room > 0) setColumns(table, cols, room); };
  fit();
  new ResizeObserver(() => requestAnimationFrame(fit)).observe(box);
  if (document.fonts) document.fonts.ready.then(fit);
  return fit;
}

return { LOCALE, MODES, TAB_NAMES, PARTS, $, fmt, byId, el, esc, page, openAll, layerTree, layerSwitch, layerList, sunStore, sunBox, download,
  setColumns, autoFit };
}
HOME.ui = uiModule();
