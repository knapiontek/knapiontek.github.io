/* apps.dat.js: the applications of the home, in the order of the top-left menu, and the wiring of their
   parts (project.md, Rules: Furniture in the house): the only place that names a sub-project for another page.
   page: from this folder; null while the application is planned (shown, but not a link).
   parts: the files that build the application's furniture as a part (core/parts.js), in their order, from this folder;
   a page (the house) loads those it does not have yet. */
window.APPS = [
  { id: 'house', name: 'Dom', page: 'house/view.html' },
  { id: 'kitchen', name: 'Kuchnia', page: 'kitchen/view.html',
    parts: ['house/house-clip.js', 'kitchen/design.dat.js', 'kitchen/view.dat.js', 'kitchen/engine.js', 'kitchen/parts.js'] },
  { id: 'bathroom', name: 'Łazienki', page: 'bathroom/view.html',
    parts: ['house/house-clip.js', 'bathroom/data.dat.js', 'bathroom/parts.js'] },
  { id: 'wardrobe', name: 'Garderoby', page: null },
];
