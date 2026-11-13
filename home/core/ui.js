/* core/ui.js: the page shell shared by every view: helpers, the stored state, the layers tree, the help, the checks, the
   view menu (views, top parts, cameras), panel sections and tabs, the 2D sheet.
   Knows no project. */
(function (CORE) {
'use strict';

const $ = id => document.getElementById(id);
const fmt = (v, d) => v.toLocaleString('pl-PL', { minimumFractionDigits: d, maximumFractionDigits: d });
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
/* the Warstwy panel: each top layer with its children under it */
function layersPanel(box, LAYER, top, state, layerOn, setLayer) {
  box.innerHTML = '';
  const add = (k, child) => {
    const d = el('div', { className: child ? 'child' : '' }, `<label><input type="checkbox"${state[k] ? ' checked' : ''}> ${LAYER[k].name}</label>`);
    if (child && !layerOn(LAYER[k].parent)) d.dataset.off = '';
    d.querySelector('input').onchange = e => setLayer(k, e.target.checked);
    box.append(d);
  };
  for (const k of top) { add(k, false); for (const c of Object.keys(LAYER).filter(c => LAYER[c].parent === k)) add(c, true); }
}

/* checks: [{name, items}]: OK when nothing is listed */
const checksHtml = checks => checks.map(c => `<div class="check"><span class="chip ${c.items.length ? 'warn' : 'ok'}">${c.items.length || 'OK'}</span>${c.name}${c.items.length ? `<ul>${c.items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}</div>`).join('');

/* ================= THE MENUS =================
   The top-left menu (the applications), the top-right menu (the modes of the project's views data), and under it, in
   3D, the project's top parts (floors and roof, the groups of a kitchen, the bathrooms) as switches. */

/* the top-left menu: the applications [{id, name, page}] (page null: planned), current = this page's id. A link carries
   the current mode (mode()), so another application opens in the same one when it has it (askedMode). */
function appMenu(box, apps, current, base, mode) {
  box.innerHTML = '';
  for (const a of apps) {
    const item = a.page ? el('a', { href: base + a.page, textContent: a.name }) : el('span', { textContent: a.name, title: 'W przygotowaniu' });
    if (a.id === current) { item.setAttribute('aria-current', 'page'); item.dataset.on = ''; }
    if (a.page) item.onclick = () => { const url = new URL(item.href); url.searchParams.set('mode', mode()); item.href = url.href; };
    box.append(item);
  }
}
/* the mode a link from another application asked for, if this page has it; taken off the address so a reload keeps the stored one */
function askedMode(views) {
  const url = new URL(location.href), m = url.searchParams.get('mode');
  if (m === null) return null;
  url.searchParams.delete('mode');
  try { history.replaceState(null, '', url.href); } catch (e) { /* opened from disk in a browser that refuses: the address keeps it */ }
  return views[m] ? m : null;
}

/* views: {id: {name}}; pick(id) on a click of another view */
function modeToggle(box, views, mode, pick) {
  box.innerHTML = Object.entries(views).map(([k, v]) => `<button data-mode="${k}" aria-pressed="${mode === k}"${mode === k ? ' data-on' : ''}>${v.name}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('[data-mode]'); if (b && b.dataset.mode !== mode) pick(b.dataset.mode); };
}
/* the screen of mode in views (../project.md, Flow): its main view (#plan2d for a plan, #analysis for test, #info for
   info, canvas for a view with a menu), ☀ only in 3D, its help and the top-right menu; pick(id) on a click of another mode */
function showMode(views, mode, canvas, pick) {
  const v = views[mode], is3d = !!v.menu;
  $('plan2d').hidden = !v.plan; $('analysis').hidden = !v.test; $('info').hidden = !v.info; canvas.hidden = !is3d;
  $('sunbtn').hidden = !is3d; if (!is3d) $('sun').hidden = true;
  helpMode($('help'), mode);
  modeToggle($('mode'), views, mode, pick);
  return v;
}
/* one row of switches: items [{name, on, set(on), radio}] (radio: one of them), then elements (a room tag, a link) */
function menuRow(box, items, extra = []) {
  const row = el('div', { className: 'menurow' });
  for (const it of items) {
    const l = el('label', { className: 'chk' }, `<input type="${it.radio ? 'radio' : 'checkbox'}"${it.on ? ' checked' : ''}> ${it.name}`);
    l.querySelector('input').onchange = e => it.set(e.target.checked);
    row.append(l);
  }
  row.append(...extra);
  box.append(row);
  return row;
}
/* ================= THE SCREEN (../project.md, Flow) =================
   top-left menu (appMenu), top-right menu (modeToggle), the main view, the bottom menu, the right panel in tabs, the
   bottom-right corner (☀, ?). A view of the project's data says which tabs it shows: view.tabs. The panel is always there;
   only the viewer hides it (panelToggle). */

/* the right panel's tabs: the same names in every application, each showing only what it has */
const TAB_NAMES = { layers: 'Warstwy', finish: 'Wykończenie' };
/* shows the panel's tabs of view, the sections [data-tab] of the current one (fallback: the first); hide(part): a section
   [data-part] that also needs something the view lacks now. Returns the tab shown. */
function panelTabs(box, aside, view, current, pick, hide = () => false) {
  const list = view.tabs || [], tab = list.includes(current) ? current : list[0] || null;
  box.hidden = list.length < 2;
  box.innerHTML = list.map(k => `<button role="tab" data-tab-id="${k}" aria-selected="${k === tab}"${k === tab ? ' data-on' : ''}>${TAB_NAMES[k]}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('[data-tab-id]'); if (b && b.dataset.tabId !== tab) pick(b.dataset.tabId); };
  for (const s of aside.querySelectorAll('[data-tab]')) s.hidden = s.dataset.tab !== tab || hide(s.dataset.part);
  aside.closest('.app').dataset.ready = '';   // the sections show from now on
  return tab;
}
/* » and « on the edge of the main view: the viewer hides or shows the panel; one choice for every application, set on
   the page the moment this file loads, so the panel does not show and vanish while the model is built */
const PANEL = store('home-panel', () => ({ open: true }), s => typeof s.open === 'boolean');
const showPanel = () => document.documentElement.toggleAttribute('data-panel-closed', !PANEL.state.open);
showPanel();
function panelToggle(stage) {
  const kept = PANEL, button = el('button', { className: 'panelbtn' });
  const show = () => {
    showPanel();
    button.textContent = kept.state.open ? '»' : '«';
    button.setAttribute('aria-label', kept.state.open ? 'Ukryj panel' : 'Pokaż panel'); button.title = button.getAttribute('aria-label');
  };
  button.onclick = () => { kept.state.open = !kept.state.open; kept.save(); show(); };
  stage.append(button); show();
}
/* the bottom menu: groups of one-off actions, a line between groups; an item is {name, go, label} or an element */
function bottomMenu(box, groups) {
  box.innerHTML = '';
  groups.filter(g => g.length).forEach((list, i) => {
    if (i) box.append(el('span', { className: 'sep' }));
    for (const it of list) box.append(it instanceof Element ? it : el('button', { textContent: it.name, onclick: it.go, ...(it.label ? { ariaLabel: it.label } : {}) }));
  });
  box.hidden = !box.children.length;
}
/* the bottom-right corner: buttons that each open their floating box [[button, box]], one box at a time */
function corner(pairs) {
  const close = () => { for (const [b, x] of pairs) { x.hidden = true; b.setAttribute('aria-expanded', false); } };
  for (const [b, x] of pairs) b.onclick = () => { const open = x.hidden; close(); x.hidden = !open; b.setAttribute('aria-expanded', open); };
  return close;
}
/* light or dark: the system's, until the viewer picks one with ◐ (in every mode); one choice for every application, set
   the moment this file loads */
const THEME = store('home-theme', () => ({ mode: null }), s => [null, 'light', 'dark'].includes(s.mode));
const showTheme = () => { if (THEME.state.mode) document.documentElement.dataset.theme = THEME.state.mode; else delete document.documentElement.dataset.theme; };
showTheme();
function toggleTheme() {
  const dark = THEME.state.mode ? THEME.state.mode === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  THEME.state.mode = dark ? 'light' : 'dark'; THEME.save(); showTheme();
}
/* ◐ in the corner: light or dark */
function themeButton(button) { button.onclick = toggleTheme; }
/* the help of the current mode: the [data-help] sections of box */
function helpMode(box, mode) { for (const s of box.querySelectorAll('[data-help]')) s.hidden = s.dataset.help !== mode; }

/* ☀: a compass with the plan in the middle (rects [x1, x2, y1, y2] mm, x down and y right as on the 2D plan) and the sun
   dragged round it (the direction, from +x toward +y as core/scene.js); an arc beside it (the height); brightness.
   sun {az, el, k} is changed in place; change() after every move. */
const SUN_RANGE = { azStep: 5, el: [8, 75], k: [0.3, 1.6, 0.05] };   // degrees, degrees, a factor
/* one sun for every application, stored once: the kitchen has the house's afternoon, the house the kitchen's night.
   fresh: {azimuth, elevation}; night: false by day */
const sunStore = fresh => store('home-sun', () => ({ az: fresh.azimuth, el: fresh.elevation, k: 1, night: false }), s => [s.az, s.el, s.k].every(Number.isFinite));
/* mark: the rects of this application's room, picked out on the plan */
function sunPanel(box, rects, sun, change, mark = []) {
  const C = 80, R = 64, A = 120, top = 20;   // svg units: compass centre and radius; the arc's radius and top margin
  const x1 = Math.min(...rects.map(q => q[0])), x2 = Math.max(...rects.map(q => q[1])), y1 = Math.min(...rects.map(q => q[2])), y2 = Math.max(...rects.map(q => q[3]));
  const s = 0.62 * R * 2 / Math.hypot(x2 - x1, y2 - y1), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const rect = q => `<rect x="${C + (q[2] - cy) * s}" y="${C + (q[0] - cx) * s}" width="${(q[3] - q[2]) * s}" height="${(q[1] - q[0]) * s}"/>`;
  const plan = rects.map(rect).join('') + `<g class="mark">${mark.map(rect).join('')}</g>`;
  box.innerHTML = `<div class="sunrow">
    <svg class="compass" viewBox="0 0 ${2 * C} ${2 * C}" aria-label="Kierunek słońca"><circle cx="${C}" cy="${C}" r="${R}" class="ring"/><g class="plan">${plan}</g>
      <line class="ray" x1="${C}" y1="${C}"/><circle class="sundot" r="9"/></svg>
    <svg class="arc" viewBox="0 0 ${A + 20} ${A + top + 10}" aria-label="Wysokość słońca"><path class="ring" d="M10 ${A + top} A${A} ${A} 0 0 0 ${A + 10} ${top}" fill="none"/>
      <line class="ground" x1="10" y1="${A + top}" x2="${A + 14}" y2="${A + top}"/><line class="ray" x1="10" y1="${A + top}"/><circle class="sundot" r="9"/></svg></div>
    <p class="sunread"></p>
    <div class="rng"><label for="sunk">Jasność</label><span></span><input id="sunk" type="range" min="${SUN_RANGE.k[0]}" max="${SUN_RANGE.k[1]}" step="${SUN_RANGE.k[2]}"></div>
    <div class="toggle daynight" role="group" aria-label="Pora dnia"><button data-night="">Dzień</button><button data-night="1">Noc</button></div>`;
  const [compass, arc] = box.querySelectorAll('svg'), k = box.querySelector('input');
  /* the sun of an svg at (x, y): its dot and the ray to it */
  const place = (svg, x, y) => {
    for (const [a, v] of [['cx', x], ['cy', y]]) svg.querySelector('.sundot').setAttribute(a, v);
    for (const [a, v] of [['x2', x], ['y2', y]]) svg.querySelector('.ray').setAttribute(a, v);
  };
  const draw = () => {
    const a = sun.az * Math.PI / 180, e = sun.el * Math.PI / 180;
    place(compass, C + R * Math.sin(a), C + R * Math.cos(a));
    place(arc, 10 + A * Math.cos(e), A + top - A * Math.sin(e));
    box.querySelector('.sunread').textContent = `Kierunek ${sun.az}° · wysokość ${sun.el}°`;
    k.value = sun.k; box.querySelector('.rng span').textContent = fmt(sun.k, 2);
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
  const dayNight = box.querySelector('.daynight');
  dayNight.onclick = e => { const b = e.target.closest('[data-night]'); if (b) { sun.night = !!b.dataset.night; draw(); change(); } };
  draw();
}

/* the 2D sheet: svg() drawn at state.zoom, zoom buttons and the download; returns draw() */
function planSheet({ sheet, zoomIn, zoomOut, download, state, save, svg, file }) {
  const draw = () => { sheet.innerHTML = svg(); sheet.style.setProperty('--zoom', state.zoom); };
  zoomIn.onclick = () => { state.zoom = Math.min(4, state.zoom * 1.25); save(); draw(); };
  zoomOut.onclick = () => { state.zoom = Math.max(0.5, state.zoom / 1.25); save(); draw(); };
  download.onclick = () => { const a = el('a', { href: URL.createObjectURL(new Blob([svg()], { type: 'image/svg+xml' })), download: file }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  return draw;
}

CORE.ui = { $, fmt, byId, el, esc, option, store, layerTree, layerSwitch, layersPanel, checksHtml, appMenu, askedMode, showMode, menuRow,
  panelTabs, panelToggle, bottomMenu, corner, themeButton, sunStore, sunPanel, planSheet };
})(window.CORE = window.CORE || {});
