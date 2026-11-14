/* furniture.js: the interface of a sub-project's furniture in the house. Knows no sub-project: apps.dat.js names the file
   that implements it for each application; that file registers its implementation here. The house uses only what this
   interface names, through a view that has nothing else in it; a sub-project's own page uses its implementation directly. */
(function (root) {
'use strict';

/* THE INTERFACE: every member, its kind and what it is. An implementation has all of them (it may have more, for its own
   page); a missing one is an error that names it. */
const INTERFACE = {
  furniture: {                             // what an implementation file registers
    needs: ['list', "its own inner files, in their order, from its folder: loaded before make (its own page has them already)"],
    textures: ['function', '() → the keys of the library textures its furniture uses: loaded before make'],
    make: ['function', "(env {materials, textures, houseModel}) → its design (below); materials and textures: the page's libraries for core, the furniture adds its own keys; houseModel: the house's solids (HouseEngine.build)"],
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
    night: ['function', '(on) its lamps at night'],
  },
};

const kindOf = v => (Array.isArray(v) ? 'list' : typeof v);
/* the members of one level of the interface, checked; the view holds only them (functions bound to the implementation) */
function only(level, id, object) {
  const view = {};
  for (const [name, [kind]] of Object.entries(INTERFACE[level])) {
    const v = object && object[name];
    if (kindOf(v) !== kind) throw new Error(`${id}: brak ${level}.${name} (${kind}) wymaganego przez interfejs furniture.js`);
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
/* the applications that have furniture, in the order of apps.dat.js */
const listed = () => (root.APPS || []).filter(a => a.furniture).map(a => a.id);

const onPage = src => [...document.scripts].some(s => s.src === new URL(src, location.href).href);
const script = src => new Promise((ok, fail) => {
  const s = document.createElement('script');
  s.src = src; s.onload = ok; s.onerror = () => fail(new Error('Nie można wczytać ' + src));
  document.head.append(s);
});
const inOrder = files => files.filter(src => !onPage(src)).reduce((p, src) => p.then(() => script(src)), Promise.resolve());
/* an application's furniture for a host: its implementation file (apps.dat.js), checked against the interface, then its
   own inner files and its textures. base: the home folder seen from the page ('../'). */
function load(id, base) {
  const app = (root.APPS || []).find(a => a.id === id);
  if (!app || !app.furniture) return Promise.reject(new Error(`Aplikacja ${id} nie ma mebli (apps.dat.js: furniture).`));
  const file = base + app.furniture, folder = file.slice(0, file.lastIndexOf('/') + 1);
  return inOrder([file]).then(() => {
    const impl = REGISTERED[id];
    if (!impl) throw new Error(`${app.furniture} nie zarejestrował mebli ${id}.`);
    const view = viewOf(id, impl);
    return inOrder(view.needs.map(f => folder + f))
      .then(() => root.CORE.library.load(base + 'library/', view.textures()))
      .then(() => view);
  });
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

root.FURNITURE = { INTERFACE, register, listed, load, shownWith };
})(window);
