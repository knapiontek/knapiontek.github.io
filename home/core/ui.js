/* core/ui.js: the screen of every page: helpers, the stored state, the skeleton of the screen, the modes, the layers,
   the checks, the menus, the panel and its tabs, the corner (◐, ☀, ?), the 2D sheet, the widths of a table's columns.
   Knows no project. Touches the browser only when called: loading it changes nothing. */
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

/* ================= THE SKELETON =================
   One screen for every page: the stage (the 3D canvas, the 2D sheet, Documents, Test, the menus over them, the walk's
   pad, the corner) and the panel on the right. spec: {label (of the canvas), help: {mode: html}, panel: html (sections
   <section data-tab="…">)}. The elements are found by their ids. */
const MODES = { '3d': '3D', '2d': '2D', documents: 'Documents', test: 'Test' };
function screen(box, spec) {
  showPanel(); showTheme();                // before anything is built: the panel and the theme do not flash
  box.className = 'app';
  box.innerHTML = `
  <nav class="nav" id="nav" aria-label="House" hidden></nav>
  <div class="stage" id="stage">
    <canvas id="gl" aria-label="${esc(spec.label)}"></canvas>
    <div id="loading">Loading…</div>
    <div class="hud"><div id="context" aria-label="View menu"></div></div>
    <div class="toggle modes" id="mode" role="group" aria-label="Mode"></div>
    <div id="plan2d" hidden aria-label="2D plan"><p class="sheetnote" id="planNote"></p><div id="sheet"></div></div>
    <div id="test" hidden aria-label="Test"><div id="checks"></div></div>
    <div id="documents" hidden aria-label="Documents"></div>
    <div class="dock" id="dock" aria-label="Bottom menu"></div>
    <div class="pad" id="pad" aria-label="Walk" hidden>
      <button data-k="ArrowUp" aria-label="Forward">▲</button>
      <button data-k="ArrowLeft" aria-label="Turn left">◀</button>
      <button data-k="ArrowDown" aria-label="Back">▼</button>
      <button data-k="ArrowRight" aria-label="Turn right">▶</button>
    </div>
    <div class="float sunfloat" id="sun" role="dialog" aria-label="Sun" hidden></div>
    <div class="float" id="help" role="dialog" aria-label="Help" hidden>${Object.entries(spec.help || {}).map(([m, h]) => `<div data-help="${m}">${h}</div>`).join('')}</div>
    <div class="corner">
      <button class="round" id="themebtn" aria-label="Light / dark" title="Light / dark"><svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 1.4a6.6 6.6 0 0 1 0 13.2z" fill="currentColor"/></svg></button>
      <button class="round" id="sunbtn" aria-label="Sun" title="Sun" aria-expanded="false" aria-controls="sun">☀</button>
      <button class="round" id="helpbtn" aria-label="Help" title="Help" aria-expanded="false" aria-controls="help">?</button>
    </div>
  </div>
  <aside id="panel">
    <h1 id="title"></h1>
    <p class="sub" id="subtitle"></p>
    <div class="toggle" id="tabs" role="tablist" aria-label="Panel"></div>
    ${spec.panel || ''}
  </aside>`;
  themeButton($('themebtn'));
  corner([[$('sunbtn'), $('sun')], [$('helpbtn'), $('help')]]);
  panelToggle($('stage'));
}
/* an error while a page loads shows where the model would be */
function failed(e) { const l = $('loading'); if (l) { l.hidden = false; l.textContent = 'Error: ' + (e.message || e); } }

/* ================= MODES ================= */
/* modes: the ids of MODES the page has; pick(id) on a click of another one */
function modeToggle(box, modes, mode, pick) {
  box.innerHTML = modes.map(k => `<button data-mode="${k}" aria-pressed="${mode === k}"${mode === k ? ' data-on' : ''}>${MODES[k]}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('[data-mode]'); if (b && b.dataset.mode !== mode) pick(b.dataset.mode); };
}
/* the main view of a mode, ☀ only in 3D, its help and the mode switch */
function showMode(modes, mode, pick) {
  const is3d = mode === '3d';
  $('gl').hidden = !is3d; $('plan2d').hidden = mode !== '2d'; $('documents').hidden = mode !== 'documents'; $('test').hidden = mode !== 'test';
  $('sunbtn').hidden = !is3d; if (!is3d) $('sun').hidden = true;
  for (const s of $('help').querySelectorAll('[data-help]')) s.hidden = s.dataset.help !== mode;
  modeToggle($('mode'), modes, mode, pick);
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
/* the layers in the panel: each top layer with its children under it */
function layersPanel(box, LAYER, top, state, layerOn, setLayer) {
  box.innerHTML = '';
  const add = (k, child) => {
    const d = el('div', { className: child ? 'child' : '' }, `<label><input type="checkbox"${state[k] !== false ? ' checked' : ''}> ${esc(LAYER[k].name)}</label>`);
    if (child && !layerOn(LAYER[k].parent)) d.dataset.off = '';
    d.querySelector('input').onchange = e => setLayer(k, e.target.checked);
    box.append(d);
  };
  for (const k of top) { add(k, false); for (const c of Object.keys(LAYER).filter(c => LAYER[c].parent === k)) add(c, true); }
}

/* checks: [{name, items, info}]: OK when nothing is listed; info: what it lists is to know, not to correct */
const checksHtml = checks => checks.map(c => `<div class="check"><span class="chip ${c.info ? 'info' : c.items.length ? 'warn' : 'ok'}">${c.info ? 'i' : c.items.length || 'OK'}</span>${esc(c.name)}${c.items.length ? `<ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</div>`).join('');

/* ================= MENUS AND PANEL ================= */
/* the top-left menu: items [{name, href, on, items}]; an item with items opens a list of them */
function nav(items) {
  const box = $('nav'), link = it => it.href ? el('a', { href: it.href, textContent: it.name }) : el('span', { textContent: it.name });
  box.innerHTML = '';
  for (const it of items) {
    let item = link(it);
    if (it.items) {
      item = el('details', {}, `<summary>${esc(it.name)}</summary>`);
      const list = el('div', { className: 'navlist' });
      for (const sub of it.items) { const a = link(sub); if (sub.on) a.dataset.on = ''; list.append(a); }
      item.append(list);
    }
    if (it.on) item.dataset.on = '';
    box.append(item);
  }
  box.hidden = !items.length;
}
/* one row of switches over the view: items [{name, on, set(on), radio}], then elements (a tag, a link) */
function menuRow(box, items, extra = []) {
  const row = el('div', { className: 'menurow' });
  for (const it of items) {
    const l = el('label', { className: 'chk' }, `<input type="${it.radio ? 'radio' : 'checkbox'}"${it.on ? ' checked' : ''}> ${esc(it.name)}`);
    l.querySelector('input').onchange = e => it.set(e.target.checked);
    row.append(l);
  }
  row.append(...extra);
  box.append(row);
  return row;
}
/* the panel's tabs: the same names on every page, each showing only what it has */
const TAB_NAMES = { layers: 'Layers', finish: 'Finish' };
/* tabs: the tabs of the current mode; shows the sections [data-tab] of the current tab (fallback: the first); hide(part):
   a section [data-part] that needs something the view lacks now. Returns the tab shown. */
function panelTabs(tabs, current, pick, hide = () => false) {
  const box = $('tabs'), aside = $('panel'), tab = tabs.includes(current) ? current : tabs[0] || null;
  box.hidden = tabs.length < 2;
  box.innerHTML = tabs.map(k => `<button role="tab" data-tab-id="${k}" aria-selected="${k === tab}"${k === tab ? ' data-on' : ''}>${TAB_NAMES[k]}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('[data-tab-id]'); if (b && b.dataset.tabId !== tab) pick(b.dataset.tabId); };
  for (const s of aside.querySelectorAll('[data-tab]')) s.hidden = s.dataset.tab !== tab || hide(s.dataset.part);
  aside.closest('.app').dataset.ready = '';   // the sections show from now on
  return tab;
}
/* » and « on the edge of the stage: the viewer hides or shows the panel; one choice for every page */
let PANEL = null;
const showPanel = () => {
  PANEL ||= store('home-panel', () => ({ open: true }), s => typeof s.open === 'boolean');
  document.documentElement.toggleAttribute('data-panel-closed', !PANEL.state.open);
};
function panelToggle(stage) {
  const button = el('button', { className: 'panelbtn' });
  const show = () => {
    showPanel();
    button.textContent = PANEL.state.open ? '»' : '«';
    button.title = PANEL.state.open ? 'Hide the panel' : 'Show the panel'; button.setAttribute('aria-label', button.title);
  };
  button.onclick = () => { PANEL.state.open = !PANEL.state.open; PANEL.save(); show(); };
  stage.append(button); show();
}
/* the bottom menu: groups of one-off actions, a line between groups; an item is {name, go, label} or an element */
function bottomMenu(groups) {
  const box = $('dock');
  box.innerHTML = '';
  groups.filter(g => g.length).forEach((list, i) => {
    if (i) box.append(el('span', { className: 'sep' }));
    for (const it of list) box.append(it instanceof Element ? it : el('button', { textContent: it.name, onclick: it.go, ...(it.label ? { ariaLabel: it.label } : {}) }));
  });
  box.hidden = !box.children.length;
}
/* the corner: buttons that each open their floating box [[button, box]], one box at a time */
function corner(pairs) {
  const close = () => { for (const [b, x] of pairs) { x.hidden = true; b.setAttribute('aria-expanded', false); } };
  for (const [b, x] of pairs) b.onclick = () => { const open = x.hidden; close(); x.hidden = !open; b.setAttribute('aria-expanded', open); };
  return close;
}
/* light or dark: the system's, until the viewer picks one with ◐; one choice for every page */
let THEME = null;
const showTheme = () => {
  THEME ||= store('home-theme', () => ({ mode: null }), s => [null, 'light', 'dark'].includes(s.mode));
  if (THEME.state.mode) document.documentElement.dataset.theme = THEME.state.mode; else delete document.documentElement.dataset.theme;
};
function themeButton(button) {
  button.onclick = () => {
    const dark = THEME.state.mode ? THEME.state.mode === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    THEME.state.mode = dark ? 'light' : 'dark'; THEME.save(); showTheme();
  };
}

/* ================= THE SUN =================
   ☀: a compass with the plan in the middle (rects [x1, x2, y1, y2] mm, x down and y right as on the 2D plan) and the sun
   dragged round it (the direction, from +x toward +y as core/scene.js); an arc beside it (the height); brightness; clouds;
   day or night. sun {az, el, k, clouds, night} is changed in place; change() after every move. */
const SUN_RANGE = { azStep: 5, el: [8, 75], k: [0.3, 1.6, 0.05], clouds: [0, 1, 0.05] };   // degrees, degrees, a factor, a share
/* one sun for every page, stored once: every page shows the same time of day. light: the light of the page's data */
const sunStore = light => store('home-sun', () => ({ az: light.sun.azimuth, el: light.sun.elevation, k: 1, clouds: light.clouds.value, night: false }),
  s => [s.az, s.el, s.k, s.clouds].every(Number.isFinite));
/* mark: rects picked out on the plan (the part of the house shown) */
function sunPanel(box, rects, sun, change, mark = []) {
  const C = 80, R = 64, A = 120, top = 20;   // svg units: compass centre and radius; the arc's radius and top margin
  const x1 = Math.min(...rects.map(q => q[0])), x2 = Math.max(...rects.map(q => q[1])), y1 = Math.min(...rects.map(q => q[2])), y2 = Math.max(...rects.map(q => q[3]));
  const s = 0.62 * R * 2 / Math.hypot(x2 - x1, y2 - y1), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const rect = q => `<rect x="${C + (q[2] - cy) * s}" y="${C + (q[0] - cx) * s}" width="${(q[3] - q[2]) * s}" height="${(q[1] - q[0]) * s}"/>`;
  const plan = rects.map(rect).join('') + `<g class="mark">${mark.map(rect).join('')}</g>`;
  box.innerHTML = `<div class="sunrow">
    <svg class="compass" viewBox="0 0 ${2 * C} ${2 * C}" aria-label="Direction of the sun"><circle cx="${C}" cy="${C}" r="${R}" class="ring"/><g class="plan">${plan}</g>
      <line class="ray" x1="${C}" y1="${C}"/><circle class="sundot" r="9"/></svg>
    <svg class="arc" viewBox="0 0 ${A + 20} ${A + top + 10}" aria-label="Height of the sun"><path class="ring" d="M10 ${A + top} A${A} ${A} 0 0 0 ${A + 10} ${top}" fill="none"/>
      <line class="ground" x1="10" y1="${A + top}" x2="${A + 14}" y2="${A + top}"/><line class="ray" x1="10" y1="${A + top}"/><circle class="sundot" r="9"/></svg></div>
    <p class="sunread"></p>
    <div class="rng"><label for="sunk">Brightness</label><span></span><input id="sunk" type="range" min="${SUN_RANGE.k[0]}" max="${SUN_RANGE.k[1]}" step="${SUN_RANGE.k[2]}"></div>
    <div class="rng"><label for="sunc">Clouds</label><span></span><input id="sunc" type="range" min="${SUN_RANGE.clouds[0]}" max="${SUN_RANGE.clouds[1]}" step="${SUN_RANGE.clouds[2]}"></div>
    <div class="toggle daynight" role="group" aria-label="Time of day"><button data-night="">Day</button><button data-night="1">Night</button></div>`;
  const [compass, arc] = box.querySelectorAll('svg'), [k, clouds] = box.querySelectorAll('input');
  /* the sun of an svg at (x, y): its dot and the ray to it */
  const place = (svg, x, y) => {
    for (const [a, v] of [['cx', x], ['cy', y]]) svg.querySelector('.sundot').setAttribute(a, v);
    for (const [a, v] of [['x2', x], ['y2', y]]) svg.querySelector('.ray').setAttribute(a, v);
  };
  const draw = () => {
    const a = sun.az * Math.PI / 180, e = sun.el * Math.PI / 180;
    place(compass, C + R * Math.sin(a), C + R * Math.cos(a));
    place(arc, 10 + A * Math.cos(e), A + top - A * Math.sin(e));
    box.querySelector('.sunread').textContent = `Direction ${sun.az}° · height ${sun.el}°`;
    const [kv, cv] = box.querySelectorAll('.rng span');
    k.value = sun.k; kv.textContent = fmt(sun.k, 2);
    clouds.value = sun.clouds; cv.textContent = Math.round(sun.clouds * 100) + '%';
    for (const b of box.querySelectorAll('[data-night]')) { const on = !!b.dataset.night === !!sun.night; b.toggleAttribute('data-on', on); b.setAttribute('aria-pressed', on); }
  };
  /* a drag on an svg: the pointer in its own units */
  const drag = (svg, set) => {
    const at = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    const move = e => { set(at(e)); draw(); change(); };
    svg.onpointerdown = e => { svg.setPointerCapture(e.pointerId); move(e); svg.onpointermove = move; };
    svg.onpointerup = svg.onpointercancel = () => { svg.onpointermove = null; };
  };
  drag(compass, p => { const d = Math.atan2(p.x - C, p.y - C) * 180 / Math.PI; sun.az = (Math.round(d / SUN_RANGE.azStep) * SUN_RANGE.azStep + 360) % 360; });
  drag(arc, p => { const d = Math.atan2(A + top - p.y, p.x - 10) * 180 / Math.PI; sun.el = Math.min(SUN_RANGE.el[1], Math.max(SUN_RANGE.el[0], Math.round(d))); });
  k.oninput = () => { sun.k = +k.value; draw(); change(); };
  clouds.oninput = () => { sun.clouds = +clouds.value; draw(); change(); };
  box.querySelector('.daynight').onclick = e => { const b = e.target.closest('[data-night]'); if (b) { sun.night = !!b.dataset.night; draw(); change(); } };
  draw();
}

/* ================= THE 2D SHEET ================= */
/* svg() drawn at state.zoom; the zoom and the download in the bottom menu; returns {draw, menu} */
function planSheet({ state, save, svg, file }) {
  const sheet = $('sheet');
  const draw = () => { sheet.innerHTML = svg(); sheet.style.setProperty('--zoom', state.zoom); };
  const zoom = k => { state.zoom = Math.min(4, Math.max(0.5, state.zoom * k)); save(); draw(); };
  const download = () => { const a = el('a', { href: URL.createObjectURL(new Blob([svg()], { type: 'image/svg+xml' })), download: file }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  return { draw, menu: [{ name: '−', label: 'Zoom out', go: () => zoom(1 / 1.25) }, { name: '+', label: 'Zoom in', go: () => zoom(1.25) }, { name: 'Save SVG', go: download }] };
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
          /* side by side (a cell that does not wrap): the sum of their widths; else what each needs at least */
          const cc = getComputedStyle(c), inLine = cc.whiteSpace === 'nowrap';
          const need = parts.reduce((a, e) => { const es = getComputedStyle(e), m = (parseFloat(es.marginLeft) || 0) + (parseFloat(es.marginRight) || 0);
            return inLine ? a + e.offsetWidth + m : Math.max(a, (parseFloat(es.minWidth) || 0) + m); }, 0);
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

HOME.ui = { LOCALE, MODES, $, fmt, byId, el, esc, option, store, screen, failed, modeToggle, showMode, layerTree, layerSwitch, layersPanel,
  checksHtml, nav, menuRow, panelTabs, bottomMenu, sunStore, sunPanel, planSheet, setColumns, autoFit };
})(window.HOME = window.HOME || {});
