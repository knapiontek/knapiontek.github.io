/* ================= THE CABINET DESIGN =================
   the mode Cabinets: the active room's cabinets file in tables, its elevations drawn: tables -> the file -> the model
   (room/cabinets.js) -> the drawing. The checks of the data are the model's; it only checks that the cells are numbers.
   Export writes the file as the files are written; Show in 3D puts it in place of the room's for this page (until it is
   loaded again). Its screen is in index.html; its Alpine part (part(host)) is merged into the page's. */
/** @param {ReturnType<typeof roomCabinetsModule>} cabinets @param {ReturnType<typeof coreToolsModule>} tools @param {ReturnType<typeof coreUiModule>} ui */
function roomDesignModule(cabinets, tools, ui) {
const C = cabinets, { esc } = tools;
const { TYPES, TAGS, TAG_NAMES, FRONT_TYPES, parseTags, plural } = C;
const HANDLES = ['', ...C.SIDES], HINGES = ['', ...C.HINGE_SIDES];
const SIDE_NAME = { '': 'none', top: 'top', bottom: 'bottom', left: 'left', right: 'right' };
/* the drawing: sizes in mm (1 unit); each part in its material's colour, the lines as on the 2D plan; the appliances as
   they look */
const DRAW = { groupGap: 100, margin: 40, line: '#5f6a66', empty: '#e3e6e4', handle: '#c4c9cf',
  appliance: { glass: '#1c1f24', panel: '#0d0f12', edge: '#000000', window: '#2b313a', knob: '#a1a7b0', bar: '#c4c9cf', display: '#06080a', text: '#7dd3fc' },
  handleSize: { thickness: 16, edgeOffset: 20, minSpan: 30, maxSpan: 80, maxSpanVertical: 120, endClearance: 80 } };

/* the columns of each table: fix, characters (numbers, codes); share, the text's part of the room left (min, max characters) */
const COLS = {
  materials: [{ share: 3, min: 18, max: 44 }, { fix: 17 }, { fix: 6 }, { fix: 7 }, { share: 2, min: 11 }],
  groups: [{ fix: 5 }, { share: 1, min: 9 }, { fix: 6 }, { fix: 5 }, { fix: 2 }],
  columns: [{ fix: 5 }, { fix: 6 }, { fix: 3 }],
  components: [{ fix: 5 }, { fix: 4 }, { fix: 4 }, { share: 2, min: 9 }, { share: 2, min: 8 }, { fix: 7 }, { fix: 6 }, { fix: 7 }, { fix: 7 }, { fix: 5 }, { fix: 5 }, { fix: 5 }, { fix: 5 }, { share: 3, min: 7 }, { fix: 3 }],
  notes: [{ share: 1, min: 10, max: 22 }, { share: 2 }, { share: 3 }, { fix: 3 }]
};

/* ---------- cells and rows ---------- */
const blank = (...values) => values.every(v => String(v ?? '').trim() === '');
const number = v => { const s = String(v ?? '').trim(); return s === '' ? NaN : Number(s); };   // an empty cell is not 0
let nextId = 1;
const ROW = {
  groups: (g = {}) => ({ id: nextId++, group: g.group ?? '', name: g.name ?? '', backGap: g.backGap ?? '', depth: g.depth ?? '' }),
  columns: (group = '', width = '') => ({ id: nextId++, group, width }),
  components: (c = {}) => {
    const gaps = c.gaps || {};
    return { id: nextId++, group: c.group ?? '', column: c.column ?? '', span: c.span ?? '', type: c.type !== undefined ? C.readType(c.type) || String(c.type).trim() : '',
      tags: parseTags(c.tags).words.join(' '), carcass: c.carcass || '', height: c.height ?? '', handle: c.handle ?? '', hinge: c.hinge ?? '',
      gapLeft: gaps.left ?? '', gapRight: gaps.right ?? '', gapTop: gaps.top ?? '', gapBottom: gaps.bottom ?? '', note: c.note || '' };
  },
  notes: (n = {}) => ({ id: nextId++, name: n.name ?? '', description: n.description ?? '', details: n.details ?? '' })
};
const EMPTY = { groups: r => blank(r.group, r.name, r.backGap, r.depth), columns: r => blank(r.group, r.width), components: r => blank(r.group, r.column, r.span, r.height),
  notes: r => blank(r.name, r.description, r.details) };
/* a component row -> a component of the file (in the order the files have); empty fields left out; gaps on fronts only */
function component(r) {
  const c = { group: number(r.group), column: number(r.column), span: number(r.span), type: r.type };
  const tags = parseTags(r.tags).words;
  if (tags.length) c.tags = tags;
  if (String(r.carcass).trim()) c.carcass = String(r.carcass).trim();
  c.height = number(r.height);
  if (r.handle) c.handle = r.handle;
  if (r.hinge) c.hinge = r.hinge;
  const gaps = { left: r.gapLeft, right: r.gapRight, top: r.gapTop, bottom: r.gapBottom };
  if (FRONT_TYPES.includes(r.type) && !blank(...Object.values(gaps))) c.gaps = Object.fromEntries(Object.entries(gaps).map(([s, g]) => [s, number(g)]));
  if (String(r.note).trim()) c.note = String(r.note).trim();
  return c;
}
/* the tables as a cabinets file (base: the file loaded, its settings and appliances kept); rows that cannot be read are
   left out and flagged empty or invalid */
function readTables(base, rows) {
  const warnings = [], flags = /** @type {{ groups: string[], columns: string[], components: string[] }} */ ({ groups: [], columns: [], components: [] }), whole = (n, min) => Number.isInteger(n) && n >= min;
  const groups = [];
  rows.groups.forEach((r, i) => {
    if (EMPTY.groups(r)) return (flags.groups[i] = 'empty');
    const group = number(r.group), backGap = number(r.backGap), depth = blank(r.depth) ? null : number(r.depth);
    if (!whole(group, 1) || !(backGap >= 0) || (depth !== null && !whole(depth, 1)) || groups.some(g => g.group === group)) { flags.groups[i] = 'invalid'; warnings.push(`Groups, row ${i + 1}: the group a whole number ≥ 1 (each once), the back gap ≥ 0, the depth empty or whole mm.`); return; }
    groups.push(Object.assign({ group, name: String(r.name).trim(), backGap }, depth !== null ? { depth } : {}, { columns: [] }));
  });
  rows.columns.forEach((r, i) => {
    if (EMPTY.columns(r)) return (flags.columns[i] = 'empty');
    const group = number(r.group), width = number(r.width), g = groups.find(x => x.group === group);
    if (!whole(group, 1) || !(width >= 0) || !g) { flags.columns[i] = 'invalid'; warnings.push(`Columns, row ${i + 1}: the group in the table Groups, the width ≥ 0.`); return; }
    g.columns.push(width);
  });
  const components = [], rowOf = [];
  rows.components.forEach((r, i) => {
    if (EMPTY.components(r)) return (flags.components[i] = 'empty');
    const places = [r.group, r.column, r.span].map(number), height = number(r.height), cells = [r.gapLeft, r.gapRight, r.gapTop, r.gapBottom];
    const gaps = blank(...cells) ? [] : cells.map(number);
    if (!places.every(n => whole(n, 1)) || !(height >= 0) || !gaps.every(g => g >= 0)) {
      flags.components[i] = 'invalid'; warnings.push(`Components, row ${i + 1}: group, column and span whole numbers ≥ 1, the height ≥ 0, the gaps empty or all four ≥ 0.`); return;
    }
    components.push(component(r)); rowOf.push(i);
  });
  const notes = rows.notes.filter(n => !EMPTY.notes(n)).map(({ name, description, details }) => ({ name, description, details }));
  return { file: { format: 'cabinets', version: 1, settings: base.settings, appliances: base.appliances, notes, groups, components }, warnings, flags, rowOf };
}

/* ---------- the drawing: the model's modules side by side, a group after another ---------- */
const box = (x, y, w, h, fill, extra = '') => `<rect fill="${fill}" stroke="${DRAW.line}" stroke-width="2" x="${x}" y="${y}" width="${w}" height="${h}"${extra}/>`;
const rect = (s, y) => box(s.x, y, s.width, s.height, s.color);
function front(s, y) {                       // the outer rectangle and a shaker front's panel, its rail in from every edge
  const r = s.rail, outer = box(s.x, y, s.width, s.height, s.color);
  return !r || s.width <= r * 2 || s.height <= r * 2 ? outer : outer + box(s.x + r, y + r, s.width - r * 2, s.height - r * 2, s.color);
}
function handle(s, y) {
  const { thickness: t, edgeOffset: e, minSpan, maxSpan, maxSpanVertical, endClearance } = DRAW.handleSize;
  const along = Math.min(maxSpan, Math.max(minSpan, s.width - endClearance)), up = Math.min(maxSpanVertical, Math.max(minSpan, s.height - endClearance));
  const b = { top: [s.x + (s.width - along) / 2, y + e, along, t], bottom: [s.x + (s.width - along) / 2, y + s.height - e - t, along, t],
    left: [s.x + e, y + (s.height - up) / 2, t, up], right: [s.x + s.width - e - t, y + (s.height - up) / 2, t, up] }[s.handle];
  return b ? `<rect fill="${DRAW.handle}" stroke="${DRAW.line}" stroke-width="1.5" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="3"/>` : '';
}
const K = DRAW.appliance;
function oven(s, y) {                        // black glass, a control strip with a display and two knobs, a bar handle, a tinted door
  const { x, width: w, height: h } = s, p = Math.min(95, h * 0.17), kr = Math.min(17, p * 0.25), hy = y + p + 28;
  return `<rect fill="${K.glass}" stroke="${K.edge}" stroke-width="2" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><rect fill="${K.panel}" x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${p - 8}" rx="2"/>`
    + `<circle cx="${x + w * 0.16}" cy="${y + p / 2}" r="${kr}" fill="${K.knob}" stroke="${K.edge}" stroke-width="1.5"/><circle cx="${x + w * 0.84}" cy="${y + p / 2}" r="${kr}" fill="${K.knob}" stroke="${K.edge}" stroke-width="1.5"/>`
    + `<rect fill="${K.display}" x="${x + w / 2 - 70}" y="${y + p / 2 - 14}" width="140" height="28" rx="3"/><text x="${x + w / 2}" y="${y + p / 2 + 7}" fill="${K.text}" font-family="monospace" font-size="20" text-anchor="middle">12:00</text>`
    + `<rect fill="${K.bar}" stroke="${K.edge}" stroke-width="1" x="${x + w * 0.1}" y="${hy}" width="${w * 0.8}" height="16" rx="8"/><rect fill="${K.window}" stroke="${K.edge}" stroke-width="1" x="${x + 70}" y="${hy + 50}" width="${w - 140}" height="${Math.max(0, y + h - hy - 100)}" rx="10"/>`;
}
function microwave(s, y) {                   // black glass, a window on the left, a control column on the right
  const { x, width: w, height: h } = s, pw = Math.min(150, w * 0.25), px = x + w - pw;
  return `<rect fill="${K.glass}" stroke="${K.edge}" stroke-width="2" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><rect fill="${K.window}" stroke="${K.edge}" stroke-width="1" x="${x + 40}" y="${y + 45}" width="${Math.max(0, w - pw - 80)}" height="${Math.max(0, h - 90)}" rx="8"/>`
    + `<line x1="${px}" y1="${y + 10}" x2="${px}" y2="${y + h - 10}" stroke="${K.edge}" stroke-width="1.5"/><rect fill="${K.display}" x="${px + 18}" y="${y + 40}" width="${pw - 36}" height="34" rx="3"/>`
    + `<text x="${px + pw / 2}" y="${y + 64}" fill="${K.text}" font-family="monospace" font-size="20" text-anchor="middle">0:30</text>`
    + [0, 1, 2].map(i => `<circle cx="${px + pw / 2}" cy="${y + 120 + i * 55}" r="12" fill="none" stroke="${K.knob}" stroke-width="2"/>`).join('')
    + `<rect fill="none" stroke="${K.knob}" stroke-width="2" x="${px + pw / 2 - 28}" y="${y + h - 60}" width="56" height="26" rx="4"/>`;
}
const SHAPE = { cabinet: (s, y) => front(s, y) + handle(s, y), drawer: (s, y) => front(s, y) + handle(s, y), oven, microwave };
function drawing(model) {
  const groups = Object.values(model.groups).filter(g => g.length > 0), at = new Map();
  let x = 0;
  for (const g of groups) { at.set(g, x); x += g.length + DRAW.groupGap; }
  const height = Math.max(0, ...groups.flatMap(g => g.items.map(i => i.h1)));
  if (!groups.length || height <= 0) return '';
  const material = use => model.materials[model.materialFor[use]], m = DRAW.margin;
  const rail = material('cabinet') ? material('cabinet').frameWidth : 0;
  const items = groups.flatMap(g => g.items.map(i => {
    const width = i.x1 - i.x0, h = i.h1 - i.h0, f = i.front;
    const own = C.hasTag(i, 'open') ? material('carcass') : material(i.type);   // an open module shows its carcass
    const s = { type: i.type, x: i.x0 + at.get(g), width, height: h, handle: i.handle, rail, color: (own || {}).color || DRAW.empty };
    const fw = f ? Math.max(0, f.width) : width, fh = f ? Math.max(0, f.height) : h;
    return `<g class="item" data-g="${i.group}" data-c="${i.column}" data-s="${i.span}" data-tags="${esc([i.type, ...i.tags].join(' '))}" data-k="${esc(i.carcass || '')}" data-w="${width}" data-h="${h}" data-fw="${fw}" data-fh="${fh}" data-gaps="${f && i.gaps ? C.gapsText(i.gaps) : ''}" data-type="${i.type}" data-note="${esc(i.note || '')}">${(SHAPE[i.type] || rect)(s, height - i.h1)}</g>`;
  })).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-m} ${-m} ${x - DRAW.groupGap + 2 * m} ${height + 2 * m}" role="img" aria-label="The fronts">${items}</svg>`;
}
/* place · carcass · type and tags · module · front · gaps left:right:top:bottom · note */
function describe(g) {
  const a = n => g.getAttribute('data-' + n);
  const parts = [C.placeLabel(+a('g'), +a('c'), +a('s')), a('k'), C.tagsLabel(a('tags').split(' ')), `${a('w')} × ${a('h')}`];
  if (FRONT_TYPES.includes(a('type')) && a('gaps')) parts.push(`front ${a('fw')} × ${a('fh')}`, `gaps ${a('gaps')}`);
  parts.push(a('note'));
  return parts.filter(Boolean).join(' · ');
}
/* a cabinets file as the tables' rows (each row an object of the table's cells) */
function rowsOf(f) {
  return { groups: (f.groups || []).map(g => ROW.groups(g)), columns: (f.groups || []).flatMap(g => (g.columns || []).map(w => ROW.columns(g.group, w))),
    components: (f.components || []).map(c => ROW.components(c)), notes: (f.notes || []).map(n => ROW.notes(n)) };
}
/* tables -> file -> model -> the drawing and the problems */
function build(base, rows, boards, appliances) {
  const t = readTables(base, rows);
  let warnings = t.warnings.slice(), svg = '';
  try {
    const project = C.withLibrary(t.file, boards), stops = C.checkSettings(project);
    if (stops.length) warnings = warnings.concat(stops);
    else {
      const model = C.build(project, C.appliances(project, appliances));
      for (const issue of model.issues) if (issue.skipped && issue.index != null) t.flags.components[t.rowOf[issue.index]] = 'invalid';
      svg = drawing(model); warnings = warnings.concat(model.warnings);
    }
  } catch (e) { warnings.push(e.message); }
  return { file: t.file, flags: t.flags, warnings, svg };
}
/* a cabinets file (HOME.data({...}) or its JSON) as an object */
function readFile(text) {
  const f = JSON.parse(text.trim().replace(/^HOME\.data\(/, '').replace(/\);?\s*$/, ''));
  if (f.format !== 'cabinets' || f.version !== 1) throw new Error(`not a cabinets file of version 1 (format ${f.format}, version ${f.version})`);
  if (!f.settings || !Array.isArray(f.groups) || !Array.isArray(f.components)) throw new Error('no settings, groups or components in it');
  return f;
}
/* number cells hold whole mm: only digits can be typed or pasted (the page's document, once its part is made) */
const isNumberCell = t => t.matches && t.matches('table.edit input[type="number"]');
function digitsOnly() {
  document.addEventListener('keydown', e => { if (isNumberCell(e.target) && e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); });
  document.addEventListener('paste', e => { if (isNumberCell(e.target) && !/^\d+$/.test((e.clipboardData ? e.clipboardData.getData('text') : '').trim())) e.preventDefault(); });
}


/* ---------- the Alpine part, merged into the page's: host.open() gives the active room's {id, name, file, base: the
   file as loaded or a blank one, boards, appliances, note} (a promise); host.show(id, file) shows a file in 3D: '' or why
   not ---------- */
const DRAFTS = new Map();                  // a room's tables as the viewer left them (this page only)
/** @param {any} host @returns {any} the page's part (Alpine) */
function part(host) {
  digitsOnly();
  return /** @type {any} */ ({
    C, TYPES, SIDE_NAME, EMPTY, parseTags, plural,
    editing: null, base: null, boards: {}, applianceProducts: {}, materials: [],
    groups: [], columns: [], components: [], notes: [],
    built: { file: null, flags: { groups: [], columns: [], components: [] }, warnings: [], svg: '' },
    picker: { row: null, mode: 'type', x: 0, y: 0 },
    tip: { show: false, x: 0, y: 0, text: '' }, hoverText: 'The cursor on a part of the drawing shows its sizes.',
    status: { text: "", error: false }, fitted: false,
    /* the active room's file into the tables (its draft, if the viewer left one); once, the watchers and the drawing */
    async editRoom() {
      const R = await host.open();
      if (this.editing && this.editing.id === R.id && this.base) return;   // already this room's
      if (this.editing && this.built.file) DRAFTS.set(this.editing.id, this.built.file);
      this.editing = R; this.boards = R.boards; this.applianceProducts = R.appliances;
      this.setFile(DRAFTS.get(R.id) || R.file, R.base);
      if (R.note) this.say(R.note); else this.status = { text: '', error: false };
      if (!this.watching) {
        this.watching = true;
        for (const k of ['groups', 'columns', 'components', 'notes']) this.$watch(k, () => this.keepEmpty(k));
        Alpine.effect(() => { if (this.base) this.built = build(this.base, { groups: this.groups, columns: this.columns, components: this.components, notes: this.notes }, this.boards, this.applianceProducts); });
      }
      if (!this.fitted) this.$nextTick(() => { this.fitted = true; for (const [k, cols] of Object.entries(COLS)) ui.autoFit(this.$refs[k], this.$refs[k].parentElement, cols); });
    },
    watching: false,
    designMenus() {
      return [[{ name: 'Import', go: () => this.$refs.importFile.click() }, { name: 'Export', go: () => this.exportFile() }],
        [{ name: 'Show in 3D', go: () => this.showIn3d() }, { name: 'Back to the file', go: () => { DRAFTS.delete(this.editing.id); this.setFile(this.editing.file, this.editing.base); this.say('The file as loaded.'); } }]];
    },
    showIn3d() {
      const n = this.built.warnings.length;
      if (!this.built.file) return;
      const why = host.show(this.editing.id, this.built.file);
      if (why) this.say(why, true); else this.say('Shown in 3D, not exported' + (n ? ' (' + n + ' ' + plural(n, 'problem', 'problems') + ' in the data)' : '') + ': Export saves the file.', n > 0);
    },
    setFile(f, base = f) {
      this.base = Object.assign({}, f, { settings: base.settings, appliances: f.appliances || base.appliances });
      try { this.materials = Object.entries(C.withLibrary(this.base, this.boards).materials).map(([code, m]) => ({ ...m, code })).sort((a, b) => b.thickness - a.thickness); }
      catch (e) { this.materials = []; this.say(e.message, true); }
      Object.assign(this, rowsOf(f));
      for (const k of ['groups', 'columns', 'components', 'notes']) this.keepEmpty(k);
    },
    keepEmpty(k) {
      const list = this[k], empty = EMPTY[k];
      if (!list.length || !empty(list[list.length - 1])) list.push(k === 'columns' ? ROW.columns() : ROW[k]());
      while (list.length > 1 && empty(list[list.length - 1]) && empty(list[list.length - 2])) list.pop();
    },
    /* a new row below: a copy of the current one (a component without its note), an empty note */
    insert(k, i) {
      const r = this[k][i];
      const copy = k === 'columns' ? ROW.columns(r.group, r.width) : k === 'components' ? Object.assign(ROW.components(), r, { id: nextId++, note: '' }) : ROW.notes();
      this[k].splice(i + 1, 0, copy);
      this.$nextTick(() => this.$refs[k].querySelectorAll('tr[data-row]')[i + 1]?.querySelector('input,textarea')?.focus());
    },
    isFront: r => FRONT_TYPES.includes(r.type),
    /* the tags in the order of TAG_NAMES, so the file stays stable; unknown ones at the end */
    writeTags(r, tags) { r.tags = [...TAG_NAMES.filter(t => tags.includes(t)), ...parseTags(r.tags).unknown].join(' '); },
    /* a new type keeps only the tags it allows; a handle, hinges and gaps belong to fronts only */
    setType(r, type) {
      r.type = type;
      this.writeTags(r, parseTags(r.tags).tags.filter(t => TAGS[t].includes(type)));
      if (!FRONT_TYPES.includes(type)) { r.handle = r.hinge = ''; r.gapLeft = r.gapRight = r.gapTop = r.gapBottom = ''; }
    },
    toggleTag(r, tag) { const t = parseTags(r.tags).tags; this.writeTags(r, t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]); },
    /* the picker's choices: the types, the type's tags (several), or the sides of a handle or of hinges */
    get pickerOptions() {
      const { row: r, mode } = this.picker;
      if (!r) return [];
      if (mode === 'type') return TYPES.map(t => ({ key: t, name: C.typeLabel(t), on: r.type === t, pick: () => { this.setType(r, t); this.picker.row = null; } }));
      if (mode === 'tags') return C.tagsOf(r.type).map(t => ({ key: t, name: C.LABELS.tag[t], many: true, on: parseTags(r.tags).tags.includes(t), pick: () => this.toggleTag(r, t) }));
      return (mode === 'handle' ? HANDLES : HINGES).map(s => ({ key: s || 'none', name: SIDE_NAME[s], on: (r[mode] || '') === s, pick: () => { r[mode] = s; this.picker.row = null; } }));
    },
    /* the picker opens below its cell, or above it when there is no room */
    openPicker(row, event, mode) {
      if (this.picker.row === row && this.picker.mode === mode) { this.picker.row = null; return; }
      const b = event.currentTarget.getBoundingClientRect(), h = { type: 220, tags: 40 + 30 * C.tagsOf(row.type).length, handle: 190, hinge: 120 }[mode];
      this.picker = { row, mode, x: Math.min(b.left, innerWidth - 260), y: b.bottom + h < innerHeight ? b.bottom + 2 : Math.max(4, b.top - h - 2) };
    },
    hover(e) {
      const g = e.target.closest('.item');
      if (!g) { this.tip.show = false; return; }
      const r = this.$refs.drawing.getBoundingClientRect();
      this.tip = { show: true, x: e.clientX - r.left + 15, y: e.clientY - r.top - 35, text: describe(g) };
      this.hoverText = this.tip.text;
    },
    say(text, error) {
      clearTimeout(this.sayTimer);
      this.status = { text, error: !!error };
      if (!error) this.sayTimer = setTimeout(() => { this.status = { text: '', error: false }; }, 4000);
    },
    sayTimer: 0,
    exportFile() {
      const n = this.built.warnings.length, FILE = this.editing.id + '.cabinets.js';
      if (!this.built.file) { this.say('Nothing to export.', true); return; }
      ui.download(C.cabinetsText(this.built.file), 'text/javascript;charset=utf-8', FILE);
      this.say('Exported ' + FILE + (n ? ' with ' + n + ' ' + plural(n, 'problem', 'problems') + ' in the data (listed in the panel)' : '') + '. Put it in room/ (a new room: add cabinets to its files in house.js) and load the page again.', n > 0);
    },
    importFile(e) {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { try { this.setFile(readFile(String(reader.result)), this.editing.base); this.say(`Imported "${f.name}".`); } catch (err) { this.say('Import failed: ' + err.message, true); } e.target.value = ''; };
      reader.readAsText(f);
    }
  });
}

return { rowsOf, build, readFile, part };
}
