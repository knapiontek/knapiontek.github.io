/* core/library.js: loads the textures of the library (../library) when a page needs them: one file per image,
   library/textures/<key>.js, an image as a data URL, so the pages work opened from disk. Knows no product. */
(function (CORE) {
'use strict';

/* base: the library folder ('../library/'); keys: the textures the page uses. Resolves with all loaded textures
   (key -> {name, kind, size [along, across] mm, grout, faces: [image]}). */
function load(base, keys) {
  const T = window.LIBRARY_TEXTURES = window.LIBRARY_TEXTURES || {};
  const one = key => new Promise((done, failed) => {
    const s = document.createElement('script');
    s.src = base + 'textures/' + key + '.js';
    s.onload = () => (T[key] ? done() : failed(new Error('brak tekstury ' + key)));
    s.onerror = () => failed(new Error('nie można wczytać ' + s.src));
    document.head.append(s);
  });
  return Promise.all([...new Set(keys)].filter(k => k && !T[k]).map(one)).then(() => T);
}

CORE.library = { load };
})(window.CORE = window.CORE || {});
