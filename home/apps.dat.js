/* apps.dat.js: the applications of the home, in the order of the top-left menu: the only place that knows them all.
   page: from this folder; null while the application is planned (shown, but not a link).
   room: the file that implements the interface room.js for this application (a room sub-project), from this folder. */
window.APPS = [
  { id: 'house', name: 'Dom', page: 'house/index.html' },
  { id: 'kitchen', name: 'Kuchnia', page: 'rooms/kitchen/index.html', room: 'rooms/kitchen/room.js' },
  { id: 'bathroom', name: 'Łazienki', page: 'rooms/bathroom/index.html', room: 'rooms/bathroom/room.js' },
  { id: 'wardrobe', name: 'Garderoby', page: null },
];
