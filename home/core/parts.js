/* core/parts.js: the contract of a part (../project.md, Plan 1). A sub-project draws its furniture as a part: the same
   code in its own page and in the house. Knows no project: apps.js names the files of each application's part, the part
   registers itself here, a page (its own, or the house) asks for it.

   A part registers {textures(): [library texture keys], make(env)}.
     env    {materials, textures (the page's libraries for core: the part adds its own keys), houseModel (HouseEngine.build)}
     make   -> the part's data, rooms() and build(V, opts): its solids, moving parts and details in the view V (core/scene.js),
            in house axes and mm.
     rooms  [{floor (the house's floor id), opts}]: what a host builds, one build each (the kitchen one, the bathrooms two)
     opts   a room's opts, and room: its room too (its own page only: the house draws its own); layers: added to every
            solid and detail (the house: the part's layer and the room's floor).
   What build returns, every part:
     solids                 the static solids (for the caps of a cut)
     shown(layers)          the part's own layers as a host without its layer panel shows them (all on)
     showDetails(shown)     the details (plain meshes) by the host's shown
     click(ray)             a click: true if it hit a moving part of this part (it opens or closes)
     night(on)              its lamps at night */
(function (CORE) {
'use strict';

const PARTS = {};
const register = (id, part) => { PARTS[id] = part; };

/* the files of an application's part (apps.js `parts`, from the home folder) not on the page yet, in their order; then
   the part's textures (core/library.js). base: the home folder seen from the page ('../'). */
const onPage = src => [...document.scripts].some(s => s.src === new URL(src, location.href).href);
const script = src => new Promise((ok, fail) => {
  const s = document.createElement('script');
  s.src = src; s.onload = ok; s.onerror = () => fail(new Error('Nie można wczytać ' + src));
  document.head.append(s);
});
function load(id, base) {
  const app = (window.APPS || []).find(a => a.id === id);
  const files = ((app && app.parts) || []).map(f => base + f).filter(src => !onPage(src));
  return files.reduce((p, src) => p.then(() => script(src)), Promise.resolve()).then(() => {
    const part = PARTS[id];
    if (!part) throw new Error('Aplikacja ' + id + ' nie ma części (apps.js: parts).');
    return CORE.library.load(base + 'library/', part.textures()).then(() => part);
  });
}
const make = (id, env) => PARTS[id].make(env);
/* the applications that have a part, in the order of apps.js */
const listed = () => (window.APPS || []).filter(a => a.parts).map(a => a.id);

/* a host's shown with parts in it. parts: [{layer, on(), shown(layers)}]; a solid of a part carries the part's layer:
   the part's switch, then the host's own layers among its layers (its floor, the edges) as the host's, the rest as the part's */
function shownWith(LAYER, hostShown, parts) {
  return layers => {
    const p = parts.find(q => layers.includes(q.layer));
    if (!p) return hostShown(layers);
    return p.on() && hostShown(layers.filter(k => LAYER[k])) && p.shown(layers.filter(k => !LAYER[k] && k !== p.layer));
  };
}

CORE.parts = { register, load, make, listed, shownWith };
})(window.CORE = window.CORE || {});
