/* core/ui.js: the page shell shared by every view: helpers, the stored state, the layers tree, the help, the checks.
   Knows no house and no kitchen. */
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

CORE.ui = { $, fmt, byId, el, option, store, layerTree, layerSwitch, layersPanel, helpToggle, checksHtml };
})(window.CORE = window.CORE || {});
