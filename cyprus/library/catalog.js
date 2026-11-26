// @ts-check
// library/catalog.js: the library (types.js: Library) from its JSON files: the products by group, the materials, the shops,
// the textures read by key when asked. The only code that knows the library's files. Calls nothing but fetch.

/** @type {LibraryModule} */
function libraryCatalogModule(base) {
  const VERSION = 1;   // of every library format: library, products, materials, shops, texture

  /**
   * A file of the library, its format and version checked.
   * @param {string} path  from library/
   * @param {string} format
   * @returns {Promise<any>}
   */
  async function read(path, format) {
    const response = await fetch(base + 'library/' + path);
    if (!response.ok) throw new Error(`library: ${path}: ${response.status}`);
    const data = await response.json();
    if (data.format !== format || data.version !== VERSION) throw new Error(`library: ${path}: ${data.format} ${data.version}, the code reads ${format} ${VERSION}`);
    return data;
  }

  /** @param {any} data @returns {any} the data, frozen through: nothing changes it */
  const frozen = data => {
    if (data && typeof data === 'object' && !Object.isFrozen(data)) { Object.values(data).forEach(frozen); Object.freeze(data); }
    return data;
  };

  /** @param {string} what @param {Record<string, any>} map @param {string} key */
  const get = (what, map, key) => {
    if (!Object.hasOwn(map, key)) throw new Error(`library: no ${what} ${key}`);
    return map[key];
  };

  /** @returns {Promise<Library>} */
  async function open() {
    /** @type {LibraryFile} */
    const index = await read('library.json', 'library');
    /** @type {[MaterialsFile, ShopsFile, ...ProductsFile[]]} */
    const [materials, shops, ...lists] = await Promise.all([read('materials.json', 'materials'), read('shops.json', 'shops'),
      ...index.groups.map(g => read(`products/${g}.json`, 'products'))]);

    /* every product with its group in it, by key; a key in two groups is an error */
    /** @type {Record<string, Product>} */
    const products = {};
    /** @type {Record<string, string[]>} */
    const keys = {};
    index.groups.forEach((group, i) => {
      keys[group] = Object.keys(lists[i].products);
      for (const key of keys[group]) {
        if (products[key]) throw new Error(`library: product ${key} in ${products[key].group} and in ${group}`);
        products[key] = frozen(/** @type {Product} */ ({ ...lists[i].products[key], group }));
      }
    });
    frozen(materials); frozen(shops); frozen(keys);

    /** @type {Map<string, Promise<Texture>>} */
    const textures = new Map();

    return Object.freeze({
      groups: frozen([...index.groups]),
      products: (/** @type {string} */ group) => get('group', keys, group),
      product: (/** @type {string} */ key) => get('product', products, key),
      variants: (/** @type {string} */ key) => {
        const family = get('product', products, key).family;
        return family ? Object.keys(products).filter(k => products[k].family === family) : [key];
      },
      materials: () => Object.keys(materials.materials),
      material: (/** @type {string} */ key) => get('material', materials.materials, key),
      texture: (/** @type {string} */ key) => {
        if (!textures.has(key)) textures.set(key, read(`textures/${key}.json`, 'texture').then(frozen));
        return /** @type {Promise<Texture>} */ (textures.get(key));
      },
      shop: (/** @type {string} */ key) => get('shop', shops.shops, key)
    });
  }

  return { open };
}
