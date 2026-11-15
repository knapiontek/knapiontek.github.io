/* room.js: the interface of a room sub-project in the house: what it gives the house of its room (its furniture, its
   finishes, its lamps). Knows no sub-project: apps.dat.js names the file
   that implements it for each application; that file registers its implementation here. The house uses only what this
   interface names, through a view that has nothing else in it; a sub-project's own page uses its implementation directly. */
(function (root) {
'use strict';

/* THE INTERFACE: every member, its kind and what it is. An implementation has all of them (it may have more, for its own
   page); a missing one is an error that names it. */
const INTERFACE = {
  furniture: {                             // what an implementation file registers
    needs: ['list', "its own inner files, in their order, from its folder and never outside it: loaded before make (its own page has them already)"],
    textures: ['function', '(library {products}) → the keys of the library textures its furniture uses: the host loads them before make'],
    make: ['function', "(env {materials, textures, library, shell}) → its design (below); materials and textures: the page's libraries for core, the furniture adds its own keys; library: {products, textures} of library/; shell: the shell of its rooms from the house (the interface shell.js)"],
  },
  design: {                                // what make returns
    rooms: ['function', '() → [{floor, opts}]: the rooms it furnishes, one build each (the kitchen one, the bathrooms one per floor); floor: the house\'s floor id'],
    build: ['function', "(view, opts) → its furniture built in the view (core's scene), in house axes and mm; opts: a room's opts, and layers: added to every solid and detail (the house: the furniture's layer and the room's floor)"],
  },
  built: {                                 // what build returns
    solids: ['list', 'its static solids (for the caps of a cut)'],
    finishes: ['list', "the finishes of its room on the host's faces, as data (core's finishPieces): the bathrooms' wall tiles"],
    shown: ['function', '(layers) → whether a solid of these layers shows in a host, which has none of its layer switches (all on)'],
    showDetails: ['function', "(shown) its details (plain meshes) shown by the host's shown"],
    click: ['function', '(ray) → true if the ray hit a door or a drawer of it (it opens or closes)'],
    obstacles: ['function', "(shown) → [[x1, x2, y1, y2, z1, z2]]: what a person walking bumps into, of what the host's shown shows: its solids, its doors and drawers closed, its details; house axes, mm (core's boxes)"],
    night: ['function', '(on) its lamps at night'],
  },
};

const kindOf = v => (Array.isArray(v) ? 'list' : typeof v);
/* the members of one level of the interface, checked; the view holds only them (functions bound to the implementation) */
function only(level, id, object) {
  const view = {};
  for (const [name, [kind]] of Object.entries(INTERFACE[level])) {
    const v = object && object[name];
    if (kindOf(v) !== kind) throw new Error(`${id}: brak ${level}.${name} (${kind}) wymaganego przez interfejs room.js`);
    view[name] = kind === 'function' ? v.bind(object) : v;
  }
  return view;
}
/* the house's view of an implementation: make gives a design view, build a built view */
function viewOf(id, impl) {
  const f = only('furniture', id, impl);
  return Object.assign(f, {
    make: env => {
      const d = only('design', id, impl.make(env)), build = d.build;
      return Object.assign(d, { build: (view, opts) => only('built', id, build(view, opts)) });
    },
  });
}

/* ================= THE REGISTER AND THE LOADING ================= */
const REGISTERED = {};
const register = (id, impl) => { REGISTERED[id] = impl; };

/* the registered implementation of an application's furniture, checked against the interface: the view a host uses. The
   host loads its file (the interface loads nothing and knows no file). */
function implementation(id) {
  if (!REGISTERED[id]) throw new Error(`brak zarejestrowanych mebli ${id} (interfejs room.js)`);
  return viewOf(id, REGISTERED[id]);
}

/* a host's shown with furniture in it. furniture: [{layer, on(), shown(layers)}]; a solid of a furniture carries its
   layer: the furniture's switch, then the host's own layers among its layers (its floor, the edges) as the host's, the
   rest as the furniture's */
function shownWith(LAYER, hostShown, furniture) {
  return layers => {
    const f = furniture.find(q => layers.includes(q.layer));
    if (!f) return hostShown(layers);
    return f.on() && hostShown(layers.filter(k => LAYER[k])) && f.shown(layers.filter(k => !LAYER[k] && k !== f.layer));
  };
}

/* Test: the dependencies on this page. A file of a sub-project is on its own page, or loaded through this interface;
   nowhere else (the host loads them with core's implementation). base: the home folder seen from the page ('../');
   paths: the sub-projects' implementation files. */
function dependencies(base, paths) {
  const folders = [...new Set(paths.map(p => p.slice(0, p.lastIndexOf('/') + 1)))];
  const items = root.CORE.ui.scriptsOutside(base, folders).map(path => path + ': plik podprojektu poza jego stroną i poza interfejsem room.js');
  return { name: 'Zależności: pliki podprojektów tylko na ich stronach albo przez interfejs room.js', items };
}

root.ROOM_INTERFACE = { INTERFACE, register, implementation, shownWith, dependencies };
})(window);
