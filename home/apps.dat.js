/* apps.dat.js: the applications of the home, in the order of the top-left menu: the only place that knows them all.
   page: from this folder; null while the application is planned (shown, but not a link).
   room: the file that implements the interface room.js for this application (a room sub-project), from this folder.
   rooms: the house's rooms (their ids) this application furnishes; the house gives each its shell (shell.js).
   link: the text of the link to its page beside such a room in the house.
   shell: the file that implements the interface shell.js (the shell of a sub-project's room), from this folder. */
window.APPS = [
  { id: 'house', name: 'Dom', page: 'house/index.html', shell: 'house/shell.js' },
  { id: 'kitchen', name: 'Kuchnia', page: 'rooms/kitchen/index.html', room: 'rooms/kitchen/room.js', rooms: ['salon'], link: 'Projekt kuchni' },
  { id: 'bathroom', name: 'Łazienki', page: 'rooms/bathroom/index.html', room: 'rooms/bathroom/room.js', rooms: ['lazienka', 'lazienka5'], link: 'Projekt łazienki' },
  { id: 'wardrobe', name: 'Garderoby', page: null },
];
