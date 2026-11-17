/* core/library.js: the library for a page: the products of every group and the shops (what is bought), the materials,
   the textures, loaded by key when a page needs them. Knows no project. Needs core/load.js. */
(function (HOME) {
'use strict';

const VERSION = 1;                         // of every library format: library, materials, shops, products, texture

/* resolves with {groups: name -> {key -> product}, shops, materials, product(key), group(key), textures (key -> texture,
   those loaded), loadTextures(keys), checks()} */
async function load() {
  const load = HOME.load, file = HOME.load.file;
  const index = await load(file.library(), 'library', VERSION);
  const [materials, shops, ...lists] = await Promise.all([load(file.materials(), 'materials', VERSION), load(file.shops(), 'shops', VERSION),
    ...index.groups.map(g => load(file.products(g), 'products', VERSION))]);
  const groups = {}, groupOf = {}, twice = [];
  index.groups.forEach((g, i) => {
    groups[g] = lists[i].products;
    for (const key of Object.keys(groups[g])) { if (groupOf[key]) twice.push(`${key}: in ${groupOf[key]} and in ${g}`); groupOf[key] = g; }
  });
  const product = key => {
    if (!groupOf[key]) throw new Error('no product ' + key + ' in the library');
    return groups[groupOf[key]][key];
  };
  const textures = {};
  const loadTextures = keys => Promise.all([...new Set(keys)].filter(k => k && !textures[k])
    .map(k => load(file.texture(k), 'texture', VERSION).then(t => { textures[k] = t; }))).then(() => textures);
  const checks = () => [
    { name: 'Library: every product key in one group only', items: twice },
    { name: 'Library: every shop named by a product exists', items: Object.keys(groupOf).filter(k => product(k).shop && !shops.shops[product(k).shop]).map(k => `${k}: shop ${product(k).shop}`) }];
  return { groups, shops: shops.shops, materials: materials.materials, product, group: key => groupOf[key], textures, loadTextures, checks };
}

HOME.library = { load };
})(window.HOME = window.HOME || {});
