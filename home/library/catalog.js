// @ts-check
/* library/catalog.js: the library for a page: the products of every group and the shops (what is bought), the materials,
   the textures, loaded by key when a page needs them. The only file that knows the library's files. Gets the loader of
   core/load.js. */
/**
 * @typedef {object} Product  a product of the library (library/project.md: format products); the fields of its group too
 * @property {string} name
 * @property {string} [spec]
 * @property {string} [code]
 * @property {string} [maker]
 * @property {string} [unit]
 * @property {number | null} [price]  zł gross per unit
 * @property {string} [priceNote]
 * @property {string} [shop]
 * @property {{ name: string, url: string }[]} [links]
 * @property {string} [note]
 * @property {string} [family]
 * @property {string} [metal]
 * @property {string} [draw]  its drawing in library/shapes.js
 * @property {string} [texture]
 * @property {any} [more]
 */
/** @typedef {Product & Object<string, any>} AnyProduct  a product with the fields of its group */
/**
 * @typedef {object} Library  the library a page has
 * @property {Object<string, Object<string, AnyProduct>>} groups  group -> key -> product
 * @property {Object<string, { name: string, links?: object[] }>} shops
 * @property {Object<string, MaterialLook>} materials
 * @property {(key: string) => AnyProduct} product  throws for a key not in the library
 * @property {(key: string) => string | undefined} group
 * @property {Object<string, Texture>} textures  those loaded
 * @property {(keys: (string | undefined)[]) => Promise<Object<string, Texture>>} loadTextures
 * @property {() => Check[]} checks
 * @property {{ k: string, name: string }[]} metals  the materials that are a metal finish
 * @property {(key: string) => string} boardName  a board by its code and decor (or its name)
 * @property {(key: string) => string[]} standIns  the boards that may take a board's place
 * @property {(key: string, metal: string | null, codes: Object<string, string>) => string} variant  a product of a family in another metal or decor
 */
/** @param {(path: string, format: string, version: number) => Promise<any>} load  a data file by its path, checked (core/load.js) */
function libraryCatalogModule(load) {
'use strict';

const VERSION = 1;                         // of every library format: library, materials, shops, products, texture
/* the library's files, from the home folder */
const file = {
  library: () => 'library/library.js',
  materials: () => 'library/materials.js',
  shops: () => 'library/shops.js',
  products: (/** @type {string} */ group) => `library/products/${group}.js`,
  texture: (/** @type {string} */ key) => `library/textures/${key}.js`,
};

/** @returns {Promise<Library>} */
async function open() {
  const index = await load(file.library(), 'library', VERSION);
  const [materials, shops, ...lists] = await Promise.all([load(file.materials(), 'materials', VERSION), load(file.shops(), 'shops', VERSION),
    ...index.groups.map(g => load(file.products(g), 'products', VERSION))]);
  const /** @type {Library['groups']} */ groups = {}, /** @type {Object<string, string>} */ groupOf = {}, /** @type {string[]} */ twice = [];
  index.groups.forEach((/** @type {string} */ g, /** @type {number} */ i) => {
    groups[g] = lists[i].products;
    for (const key of Object.keys(groups[g])) { if (groupOf[key]) twice.push(`${key}: in ${groupOf[key]} and in ${g}`); groupOf[key] = g; }
  });
  const product = (/** @type {string} */ key) => {
    if (!groupOf[key]) throw new Error('no product ' + key + ' in the library');
    return groups[groupOf[key]][key];
  };
  const /** @type {Object<string, Texture>} */ textures = {};
  const loadTextures = (/** @type {(string | undefined)[]} */ keys) => Promise.all([...new Set(keys)].filter(/** @returns {k is string} */ k => !!k && !textures[k])
    .map(k => load(file.texture(k), 'texture', VERSION).then(t => { textures[k] = t; }))).then(() => textures);
  const checks = () => [
    { name: 'Library: every product key in one group only', about: 'A product is named by its key everywhere; the same key in two groups would make it two products.', items: twice },
    { name: 'Library: every shop named by a product exists', about: 'Each product\'s shop is a key of shops.js.', items: Object.keys(groupOf).filter(k => { const s = product(k).shop; return s && !shops.shops[s]; }).map(k => `${k}: shop ${product(k).shop}`) }];
  /* the finishes: the metals (of handles, taps, rails), a board's stand-ins (of its kind: by the sheet or the m², lacquered or
     not, a frame or not, a worktop's depth, within a millimetre of its thickness), a product of a family (the same thing in
     other metals or decors) in the metal and the decor asked for, if the family has it */
  const M = materials.materials, B = groups.boards || {}, all = Object.assign({}, ...Object.values(groups));
  const metals = Object.entries(M).filter(([, m]) => m.finish === 'metal').map(([k, m]) => ({ k, name: m.name }));
  const boardName = (/** @type {string} */ k) => B[k] ? (B[k].code ? `${B[k].code} ${B[k].decor}` : B[k].name) : k;
  const standIns = (/** @type {string} */ k) => { const a = B[k]; return a ? Object.keys(B).filter(j => { const b = B[j];
    return b.unit === a.unit && !!b.lacquered === !!a.lacquered && !b.frameWidth === !a.frameWidth && b.depth === a.depth && Math.abs(b.thickness - a.thickness) < 1; }) : [k]; };
  const variant = (/** @type {string} */ k, /** @type {string | null} */ metal, /** @type {Object<string, string>} */ codes) => {
    const p = all[k]; if (!p || !p.family) return k;
    const metal1 = p.metal && metal || p.metal, code1 = p.code && codes[p.code] || p.code;
    if (metal1 === p.metal && code1 === p.code) return k;
    return Object.keys(all).find(j => all[j].family === p.family && all[j].metal === metal1 && all[j].code === code1) || k;
  };
  return { groups, shops: shops.shops, materials: M, product, group: (/** @type {string} */ key) => groupOf[key], textures, loadTextures, checks, metals, boardName, standIns, variant };
}

return { open };
}
