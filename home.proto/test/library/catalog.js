/* library/catalog.js: its public API, each part with what it gives, on the library's own data (test/test.md) */
async function libraryCatalogTest({ libraryCatalogModule }, data, check) {
  /* the loader the catalog gets: a data file by its path; a texture is one made up here */
  const asked = [];
  const load = async (path, format, version) => {
    asked.push(path);
    return path.startsWith('library/textures/') ? { format, version, name: 'a texture', kind: 'wood', size: [1000, 1000], faces: ['data:'] } : data(path);
  };
  const catalog = libraryCatalogModule(load);
  check('the public API', Object.keys(catalog).join(' ') === 'open');

  const L = await catalog.open();
  check('open: the API of a library', Object.keys(L).join(' ') === 'groups shops materials product group textures loadTextures checks metals boardName standIns variant');
  const groups = data('library/library.js').groups;
  check('open: every group of library.js, its products', Object.keys(L.groups).join() === groups.join() && groups.every(g => L.groups[g] === data(`library/products/${g}.js`).products));
  check('open: the library\'s files, asked by their paths', ['library/library.js', 'library/materials.js', 'library/shops.js'].every(p => asked.includes(p)));
  const [key] = Object.keys(L.groups.boards);
  check('product and group: a product by its key, its group', L.product(key) === L.groups.boards[key] && L.group(key) === 'boards');
  let threw = false; try { L.product('no such product'); } catch (e) { threw = true; }
  check('product: a key not in the library is an error', threw);
  check('shops and materials: those of shops.js and materials.js', L.shops === data('library/shops.js').shops && L.materials === data('library/materials.js').materials);
  check('checks: the library is sound', L.checks().every(c => c.items.length === 0));

  const textures = await L.loadTextures(['oak', 'oak', undefined]);
  check('loadTextures: each key once, kept in textures', textures === L.textures && textures.oak.name === 'a texture' && asked.filter(p => p === 'library/textures/oak.js').length === 1);

  /* the finishes: the metals, a board's stand-ins (itself among them), a product of a family in another metal */
  check('metals: the materials of finish metal', L.metals.length > 0 && L.metals.every(m => L.materials[m.k].finish === 'metal'));
  check('standIns: a board stands in for itself, and only for boards as thick', L.standIns(key).includes(key) && L.standIns(key).every(j => Math.abs(L.groups.boards[j].thickness - L.groups.boards[key].thickness) < 1));
  check('boardName: by its code and decor', L.boardName(key).length > 0);
  const all = Object.assign({}, ...Object.values(L.groups)), [k] = Object.keys(all).filter(j => all[j].family && all[j].metal);
  const other = k && Object.keys(all).find(j => j !== k && all[j].family === all[k].family && all[j].metal && all[j].metal !== all[k].metal);
  check('variant: the same product of its family in another metal; a product with none stays', !other || L.variant(k, all[other].metal, {}) === other);
  check('variant: a product of no family stays', L.variant(key, 'brass', {}) === key || !!all[key].family);
}
