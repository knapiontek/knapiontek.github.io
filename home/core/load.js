// @ts-check
/* core/load.js: the one loader of data. A data file is JSON handed to HOME.data, so the pages work opened from disk;
   it says its format and version. A page loads a file by its path from the home folder (file gives the path of a key);
   the data comes back only when its format and version are the ones the caller knows. Must be the first script of a page:
   it finds the home folder from its own address. Knows no project. */
(/** @param {Home} HOME */ function (HOME) {
'use strict';

const BASE = /** @type {HTMLScriptElement} */ (document.currentScript).src.replace(/core\/load\.js(\?.*)?$/, '');   // the home folder
const DATA = new Map(), PENDING = new Map();                                       // address -> data, address -> its loading

/* called by every data file: its data, kept under the file's address */
HOME.data = json => { DATA.set(/** @type {HTMLScriptElement} */ (document.currentScript).src, json); };

/* the path of every kind of data file, from the home folder */
const file = {
  house: () => 'house/house.js',
  room: (key, role) => `room/${key}.${role}.js`,
  library: () => 'library/library.js',
  materials: () => 'library/materials.js',
  shops: () => 'library/shops.js',
  products: group => `library/products/${group}.js`,
  texture: key => `library/textures/${key}.js`,
};

function script(url, path) {
  if (!PENDING.has(url)) PENDING.set(url, new Promise((/** @type {(value?: any) => void} */ done, failed) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => (DATA.has(url) ? done() : failed(new Error(path + ': no data in the file')));
    s.onerror = () => { s.remove(); failed(new Error(path + ': cannot be loaded')); };
    document.head.append(s);
  }));
  return PENDING.get(url);
}

/* the data of a file, loaded once, checked: its format and version must be those given */
async function load(path, format, version) {
  const url = new URL(path, BASE).href;
  if (!DATA.has(url)) await script(url, path);
  const d = DATA.get(url);
  if (d.format !== format || d.version !== version) throw new Error(`${path}: ${d.format ? d.format + ' ' + d.version : 'no format'}, the code knows ${format} ${version}`);
  return d;
}

load.file = file;
HOME.load = load;
})(window.HOME = window.HOME || {});
