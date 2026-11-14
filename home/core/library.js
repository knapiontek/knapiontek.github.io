/* core/library.js: the library (../library) for a page: a product by its key, whatever its group; the textures, loaded when
   the page needs them (one file per image, library/textures/<key>.dat.js, an image as a data URL, so the pages work opened
   from disk). Knows no project. */
(function (CORE) {
'use strict';

/* base: the library folder ('../library/'); keys: the textures the page uses. Resolves with all loaded textures
   (key -> {name, kind, size [along, across] mm, grout, faces: [image]}). */
function load(base, keys) {
  const T = window.LIBRARY_TEXTURES = window.LIBRARY_TEXTURES || {};
  const one = key => new Promise((done, failed) => {
    const s = document.createElement('script');
    s.src = base + 'textures/' + key + '.dat.js';
    s.onload = () => (T[key] ? done() : failed(new Error('brak tekstury ' + key)));
    s.onerror = () => failed(new Error('nie można wczytać ' + s.src));
    document.head.append(s);
  });
  return Promise.all([...new Set(keys)].filter(k => k && !T[k]).map(one)).then(() => T);
}

/* a product by its key, in whichever group of library/products it is */
function product(key) {
  for (const group of Object.values(window.LIBRARY_PRODUCTS || {})) if (group[key]) return group[key];
  throw new Error('brak produktu ' + key + ' w bibliotece (library/products)');
}

CORE.library = { load, product };
})(window.CORE = window.CORE || {});
