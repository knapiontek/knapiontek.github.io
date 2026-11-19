/* core/ui.js: what every page's screen shares: helpers, the stored state, light or dark and the panel (start(): an Alpine
   store), the layers as lists, the sun box and the 2D sheet's zoom (Alpine parts), the widths of a table's columns. The pages
   declare their screens in their HTML with Alpine.js. Knows no project. Touches the browser only when called. */
(function (HOME) {
'use strict';

const LOCALE = 'en-GB';                    // numbers on every page and in every sheet
const $ = id => document.getElementById(id);
const fmt = (v, d) => v.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });
const byId = list => Object.fromEntries(list.map(e => [e.id, e]));
const el = (tag, attrs, html) => { const e = document.createElement(tag); Object.assign(e, attrs); if (html !== undefined) e.innerHTML = html; return e; };
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);   // text into HTML
const option = (v, t, sel) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`;

/* the viewer's choices stay in the browser; a stored state that fails valid() is dropped for fresh() */
function store(key, fresh, valid) {
  let state;
  try { state = JSON.parse(localStorage.getItem(key)); } catch (e) { state = null; }
  if (!state || !valid(state)) state = fresh();
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* private mode: nothing kept */ } };
  return { state, save };
}

/* ================= THE SCREEN =================
   The modes every page names the same way; the panel's tabs; the result of a check as its chip. */
const MODES = { '3d': '3D', '2d': '2D', documents: 'Documents', test: 'Test' };
const TAB_NAMES = { view: 'View', layers: 'Layers', finish: 'Finish' };
/* checks: [{name, items, info}]: OK when nothing is listed; info: what it lists is to know, not to correct */
const chip = c => (c.info ? ['info', 'i'] : c.items.length ? ['warn', String(c.items.length)] : ['ok', 'OK']);

/* light or dark: the system's, until the viewer picks one with ◐; the panel shown or hidden with » and «; one choice for
   every page, kept in the browser. start(): called by a page at the top of its script, before Alpine starts: the stored
   choices applied at once (nothing flashes) and the Alpine store 'screen' for ◐ and » « */
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
  document.addEventListener('alpine:init', () => Alpine.store('screen', {
    open: PANEL.state.open,
    togglePanel() { this.open = PANEL.state.open = !this.open; PANEL.save(); showScreen(); },
    toggleTheme() {
      const dark = THEME.state.mode ? THEME.state.mode === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      THEME.state.mode = dark ? 'light' : 'dark'; THEME.save(); showScreen();
    }
  }));
}

/* ================= LAYERS ================= */
/* the layers tree: {id: {name, layers: {...}}} -> id -> {name, parent} */
function layerTree(tree) {
  const LAYER = {};
  (function walk(t, parent) { for (const [k, v] of Object.entries(t)) { LAYER[k] = { name: v.name, parent }; if (v.layers) walk(v.layers, k); } })(tree, null);
  return LAYER;
}
/* a layer is on when it and all its parents are on; an object is shown when all its layers are on */
function layerSwitch(LAYER, getLayers) {
  const layerOn = k => getLayers()[k] !== false && (!LAYER[k].parent || layerOn(LAYER[k].parent));
  const shown = layers => layers.every(layerOn);
  return { layerOn, shown };
}
/* the layers as a list for the panel: each top layer with its children under it; off: a child whose parent is off */
function layerList(LAYER, top, state, layerOn) {
  return top.flatMap(k => [{ k, name: LAYER[k].name, on: state[k] !== false, child: false, off: false },
    ...Object.keys(LAYER).filter(c => LAYER[c].parent === k).map(c => ({ k: c, name: LAYER[c].name, on: state[c] !== false, child: true, off: !layerOn(k) }))]);
}

/* ================= THE SUN =================
   ☀: a compass with the plan in the middle (rects [x1, x2, y1, y2] mm, x down and y right as on the 2D plan) and the sun
   dragged round it (the direction, from +x toward +y as core/scene.js); an arc beside it (the height); brightness; clouds;
   day or night. An Alpine part: x-data="HOME.ui.sunBox({rects, mark, sun, change})" x-html="HOME.ui.SUN"; sun {az, el, k,
   clouds, night} is changed in place, change() after every move. */
const SUN_RANGE = { azStep: 5, el: [8, 75], k: [0.3, 1.6, 0.05], clouds: [0, 1, 0.05] };   // degrees, degrees, a factor, a share
const SC = 80, SR = 64, SA = 120, STOP = 20;   // svg units: compass centre and radius; the arc's radius and top margin
/* one sun for every page, stored once: every page shows the same time of day. light: the light of the page's data */
const sunStore = light => store('home-sun', () => ({ az: light.sun.azimuth, el: light.sun.elevation, k: 1, clouds: light.clouds.value, night: false }),
  s => [s.az, s.el, s.k, s.clouds].every(Number.isFinite));
const SUN = `<div class="sunrow">
    <svg class="compass" viewBox="0 0 ${2 * SC} ${2 * SC}" aria-label="Direction of the sun" @pointerdown="down($event, 'az')" @pointermove="move($event)" @pointerup="up()" @pointercancel="up()">
      <circle cx="${SC}" cy="${SC}" r="${SR}" class="ring"/><g class="plan" x-html="plan"></g>
      <line class="ray" x1="${SC}" y1="${SC}" :x2="compass[0]" :y2="compass[1]"/><circle class="sundot" r="9" :cx="compass[0]" :cy="compass[1]"/></svg>
    <svg class="arc" viewBox="0 0 ${SA + 20} ${SA + STOP + 10}" aria-label="Height of the sun" @pointerdown="down($event, 'el')" @pointermove="move($event)" @pointerup="up()" @pointercancel="up()">
      <path class="ring" d="M10 ${SA + STOP} A${SA} ${SA} 0 0 0 ${SA + 10} ${STOP}" fill="none"/>
      <line class="ground" x1="10" y1="${SA + STOP}" x2="${SA + 14}" y2="${SA + STOP}"/><line class="ray" x1="10" y1="${SA + STOP}" :x2="arc[0]" :y2="arc[1]"/><circle class="sundot" r="9" :cx="arc[0]" :cy="arc[1]"/></svg></div>
  <p class="sunread" x-text="'Direction ' + az + '° · height ' + el + '°'"></p>
  <div class="rng"><label for="sunk">Brightness</label><span x-text="fmt(k, 2)"></span><input id="sunk" type="range" min="${SUN_RANGE.k[0]}" max="${SUN_RANGE.k[1]}" step="${SUN_RANGE.k[2]}" :value="k" @input="set('k', +$event.target.value)"></div>
  <div class="rng"><label for="sunc">Clouds</label><span x-text="Math.round(clouds * 100) + '%'"></span><input id="sunc" type="range" min="${SUN_RANGE.clouds[0]}" max="${SUN_RANGE.clouds[1]}" step="${SUN_RANGE.clouds[2]}" :value="clouds" @input="set('clouds', +$event.target.value)"></div>
  <div class="toggle daynight" role="group" aria-label="Time of day">
    <button :data-on="!night && ''" :aria-pressed="String(!night)" @click="set('night', false)">Day</button><button :data-on="night && ''" :aria-pressed="String(night)" @click="set('night', true)">Night</button></div>`;
/* mark: rects picked out on the plan (the part of the house shown) */
function sunBox({ rects, mark = [], sun, change }) {
  const raw = window.Alpine ? Alpine.raw(sun) : sun;
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

/* ================= THE 2D SHEET =================
   The wheel zooms about the cursor (the point under it stays), a drag moves the sheet; state.zoom kept. The page binds
   these to its sheet: @wheel.prevent="z.wheel($event)" @pointerdown="z.down($event)" @pointermove="z.move($event)"
   @pointerup="z.up()" @pointercancel="z.up()". */
function sheetZoom(state, save) {
  let drag = null;
  return {
    wheel(e) {
      const sheet = e.currentTarget, was = state.zoom, now = Math.min(8, Math.max(1, was * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      if (now === was) return;
      const r = sheet.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
      const px = (sheet.scrollLeft + cx) / sheet.scrollWidth, py = (sheet.scrollTop + cy) / sheet.scrollHeight;   // the point under the cursor
      state.zoom = now; sheet.style.setProperty('--zoom', now);
      sheet.scrollLeft = px * sheet.scrollWidth - cx; sheet.scrollTop = py * sheet.scrollHeight - cy;
      save();
    },
    down(e) { if (e.button === 0) { const s = e.currentTarget; drag = { x: e.clientX, y: e.clientY, l: s.scrollLeft, t: s.scrollTop }; s.setPointerCapture(e.pointerId); } },
    move(e) { if (drag) { const s = e.currentTarget; s.scrollLeft = drag.l - (e.clientX - drag.x); s.scrollTop = drag.t - (e.clientY - drag.y); } },
    up() { drag = null; }
  };
}
/* a text or an svg as a download */
function download(text, type, file) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type })), download: file });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

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

HOME.ui = { LOCALE, MODES, TAB_NAMES, $, fmt, byId, el, esc, option, store, start, chip, layerTree, layerSwitch, layerList, sunStore, SUN, sunBox, sheetZoom, download,
  setColumns, autoFit };
})(window.HOME = window.HOME || {});
