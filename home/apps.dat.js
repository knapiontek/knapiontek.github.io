/* apps.dat.js: the applications of the home, in the order of the top-left menu: the only place that knows them all.
   page: from this folder; null while the application is planned (shown, but not a link).
   furniture: the file that implements the interface furniture.js for this application, from this folder. */
window.APPS = [
  { id: 'house', name: 'Dom', page: 'house/view.html' },
  { id: 'kitchen', name: 'Kuchnia', page: 'kitchen/view.html', furniture: 'kitchen/furniture.js' },
  { id: 'bathroom', name: 'Łazienki', page: 'bathroom/view.html', furniture: 'bathroom/furniture.js' },
  { id: 'wardrobe', name: 'Garderoby', page: null },
];
