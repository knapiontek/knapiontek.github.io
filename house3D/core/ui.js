/* core/ui.js: the page shell shared by every view: helpers, the stored state, the layers tree, the help, the checks, the
   view menu (views, top parts, cameras), panel sections and tabs, the 2D sheet.
   Knows no project. */
(function (CORE) {
'use strict';

const $ = id => document.getElementById(id);
const fmt = (v, d) => v.toLocaleString('pl-PL', { minimumFractionDigits: d, maximumFractionDigits: d });
const byId = list => Object.fromEntries(list.map(e => [e.id, e]));
const el = (tag, attrs, html) => { const e = document.createElement(tag); Object.assign(e, attrs); if (html !== undefined) e.innerHTML = html; return e; };
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

function helpToggle(button, box) {
  button.onclick = () => { box.hidden = !box.hidden; button.setAttribute('aria-expanded', !box.hidden); };
}

/* checks: [{name, items}]: OK when nothing is listed */
const checksHtml = checks => checks.map(c => `<div class="check"><span class="chip ${c.items.length ? 'warn' : 'ok'}">${c.items.length || 'OK'}</span>${c.name}${c.items.length ? `<ul>${c.items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}</div>`).join('');

/* ================= THE VIEW SHELL =================
   One menu on every page. Over the stage: the views of the project (3D, 2D, Analiza) as a toggle; under it, in a view
   with a menu, the project's top parts (floors and roof, groups of a kitchen, the bathrooms) as switches; the cameras of
   the view in the dock. In the panel: the sections the view lists, and tabs where a project has much to show. */

/* views: {id: {name}}; pick(id) on a click of another view */
function modeToggle(box, views, mode, pick) {
  box.innerHTML = Object.entries(views).map(([k, v]) => `<button data-mode="${k}" aria-pressed="${mode === k}"${mode === k ? ' data-on' : ''}>${v.name}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('[data-mode]'); if (b && b.dataset.mode !== mode) pick(b.dataset.mode); };
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
/* the dock: the walk button {name, on, toggle} if any, then groups of cameras [{name, go}] with a line before each */
function cameraDock(box, groups, walk) {
  box.innerHTML = '';
  if (walk) { const b = el('button', { className: 'walk', textContent: walk.name, onclick: walk.toggle }); b.setAttribute('aria-pressed', walk.on); box.append(b); }
  groups.forEach((list, i) => {
    if (walk || i) box.append(el('span', { className: 'sep' }));
    for (const c of list) box.append(el('button', { textContent: c.name, onclick: c.go }));
  });
}
/* the panel sections ([data-panel]) the view lists; hide(name): one that also needs something the view lacks */
function panels(view, hide = () => false) {
  for (const s of document.querySelectorAll('[data-panel]')) s.hidden = !view.panels.includes(s.dataset.panel) || hide(s.dataset.panel);
}
/* tabs: {id: name} as a toggle; the sections [data-tab] of the current one show */
function tabs(box, list, current, pick) {
  box.innerHTML = Object.entries(list).map(([k, t]) => `<button role="tab" data-tab-id="${k}" aria-selected="${k === current}"${k === current ? ' data-on' : ''}>${t}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('[data-tab-id]'); if (b && b.dataset.tabId !== current) pick(b.dataset.tabId); };
  for (const s of document.querySelectorAll('[data-tab]')) s.hidden = s.dataset.tab !== current;
}
/* the 2D sheet: svg() drawn at state.zoom, zoom buttons and the download; returns draw() */
function planSheet({ sheet, zoomIn, zoomOut, download, state, save, svg, file }) {
  const draw = () => { sheet.innerHTML = svg(); sheet.style.setProperty('--zoom', state.zoom); };
  zoomIn.onclick = () => { state.zoom = Math.min(4, state.zoom * 1.25); save(); draw(); };
  zoomOut.onclick = () => { state.zoom = Math.max(0.5, state.zoom / 1.25); save(); draw(); };
  download.onclick = () => { const a = el('a', { href: URL.createObjectURL(new Blob([svg()], { type: 'image/svg+xml' })), download: file }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  return draw;
}

CORE.ui = { $, fmt, byId, el, option, store, layerTree, layerSwitch, layersPanel, helpToggle, checksHtml, modeToggle, menuRow, cameraDock, panels, tabs, planSheet };
})(window.CORE = window.CORE || {});
