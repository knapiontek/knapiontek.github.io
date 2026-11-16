/* shell.js: the interface of a room's shell from the house: what a room sub-project gets of its room (the house's own
   solids trimmed to it, its numbers, the house's light). Knows no implementation: apps.dat.js names the file that
   implements it (the house's); that file registers its implementation here. A sub-project uses only what this interface
   names, through a view that has nothing else in it. */
(function (root) {
'use strict';

/* THE INTERFACE: every member, its kind (with ?: or null) and what it is. The implementation has all of them (it may have more, for the
   house's own page); a missing one is an error that names it. */
const INTERFACE = {
  shell: {                                 // what the implementation file registers
    needs: ['list', "its own inner files, in their order, from its folder and never outside it: loaded before rooms (its own page has them already)"],
    rooms: ['function', "(app) → [room] (below): the rooms of the house that apps.dat.js gives application app (its id), one per floor"],
    light: ['function', '() → {exposure, fog, sun, sky}: the light of a room seen from inside (core\'s scene)'],
    sun: ['function', '() → the house\'s sun, one for every application (core\'s sunStore)'],
    edges: ['function', '() → the house\'s edges of a 3D view (core\'s scene)'],
    footprint: ['function', '() → [[x1, x2, y1, y2]]: the house in plan, for the compass of the sun'],
  },
  room: {                                  // what rooms gives, for each room
    floor: ['string', "the house's floor id"],
    floorName: ['string', 'the name of the floor'],
    name: ['string', 'the name of the room'],
    numbers: ['list', 'its numbers in the drawings'],
    area: ['number', 'm², as the house\'s plan gives it'],
    level: ['number', 'the top of its floor'],
    ceiling: ['number?', 'the underside of the slab or flat ceiling over it; null under a roof with none (roofUnder)'],
    roofUnder: ['function', '(y) → the underside of the roof over y'],
    planCut: ['number', 'the 2D cut height over its floor'],
    inside: ['list', '[[x1, x2, y1, y2]]: its floor area'],
    box: ['list', '[x1, x2, y1, y2, z1, z2]: the box it is trimmed to'],
    objects: ['list', "[{id, role (wall | floor | ceiling | window | door), side, host, cells, leaf?}]: the house's solids trimmed to the box, as a person sees them; a window or a door shown with its host; a door's leaf {cells, axis [x, y], angle}: closed, it turns about the vertical axis by angle (rad) when open"],
    openings: ['list', "[{b, kind, label, glazed, …}]: the house's openings in its box, as the house has them"],
    sides: ['object', "the house's sides of an opening (core's plan labels)"],
  },
};

const kindOf = v => (Array.isArray(v) ? 'list' : v === null ? 'null' : typeof v);
/* the members of one level of the interface, checked; the view holds only them (functions bound to the implementation) */
function only(level, object) {
  const view = {};
  for (const [name, [kind]] of Object.entries(INTERFACE[level])) {
    const v = object && object[name], k = kind.replace('?', '');
    if (kindOf(v) !== k && !(kind.endsWith('?') && v === null)) throw new Error(`brak ${level}.${name} (${kind}) wymaganego przez interfejs shell.js`);
    view[name] = k === 'function' ? v.bind(object) : v;
  }
  return view;
}
/* a sub-project's view of the implementation: rooms gives checked room views */
function viewOf(impl) {
  const s = only('shell', impl), rooms = s.rooms;
  return Object.assign(s, { rooms: app => rooms(app).map(r => only('room', r)) });
}

/* ================= THE REGISTER AND THE LOADING ================= */
let REGISTERED = null;
const register = impl => { REGISTERED = impl; };

/* the registered implementation of the shell, checked against the interface: the view a sub-project uses. The host loads
   its file (the interface loads nothing and knows no file). */
function implementation() {
  if (!REGISTERED) throw new Error('brak zarejestrowanej skorupy domu (interfejs shell.js)');
  return viewOf(REGISTERED);
}

/* Test: the dependencies on this page. A file of the shell's folder (the house) is on its own pages, or loaded through
   this interface (the host loads them with core's implementation); nowhere else. base: the home folder seen from the page ('../../'); path: the shell's implementation file. */
function dependencies(base, path) {
  const folders = path ? [path.slice(0, path.lastIndexOf('/') + 1)] : [];
  const items = root.CORE.ui.scriptsOutside(base, folders).map(p => p + ': plik domu poza jego stroną i poza interfejsem shell.js');
  return { name: 'Zależności: pliki domu tylko na jego stronie albo przez interfejs shell.js', items };
}

root.SHELL_INTERFACE = { INTERFACE, register, implementation, dependencies };
})(window);
