// @ts-check
// test/library/catalog.js: library/catalog.js: every call of the catalog (types.js: Catalog), unknown keys, frozen data, a
// texture read once, every library file against its type; then the catalog as the other modules use it, on its own data.

import { openCatalog } from '../../library/catalog.js';

/** @typedef {import('../../types.js').Board} Board */
/** @typedef {import('../../types.js').Tile} Tile */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /* ---------- every call ---------- */
  {
    /* every address fetched is noted: this slate is the test's own, so its fetch may be watched */
    /** @type {string[]} */
    const fetched = [];
    const fetchItself = fetch;
    globalThis.fetch = (input, init) => { fetched.push(String(input)); return fetchItself(input, init); };
    /** @param {string} path  from the library's folder @returns {Promise<any>} a file as it lies, read past the library */
    const file = async path => (await fetchItself(new URL('../../library/' + path, import.meta.url))).json();
    /** @param {() => unknown} f */
    const throws = f => { try { f(); return false; } catch (e) { return true; } };

    const L = await openCatalog();

    /* groups and products */
    /** @type {{ groups: string[] }} */
    const index = await file('catalog.json');
    /** @type {Record<string, { products: Record<string, Record<string, unknown>> }>} */
    const lists = {};
    for (const g of index.groups) lists[g] = await file(`products/${g}.json`);
    check('groups: those of catalog.json, in order', L.groups.join() === index.groups.join());
    check('products: each group\'s keys, in the order of its file', index.groups.every(g => L.products(g).join() === Object.keys(lists[g].products).join()));
    check('products: an unknown group throws', throws(() => L.products('no such group')));
    const all = index.groups.flatMap(g => L.products(g));
    check('product: the data of its file, with its group', index.groups.every(g => L.products(g).every(k => {
      const p = /** @type {Record<string, unknown>} */ (L.product(k)), d = lists[g].products[k];
      return p.group === g && Object.keys(d).every(f => JSON.stringify(p[f]) === JSON.stringify(d[f]));
    })));
    check('product: an unknown key throws', throws(() => L.product('no such product')));
    check('product: frozen, inside too', all.every(k => Object.isFrozen(L.product(k)) && Object.values(L.product(k)).every(v => typeof v !== 'object' || v === null || Object.isFrozen(v))));
    check('product: each key in one group only', new Set(all).size === all.length);
    /* a catalog whose catalog.json names a group twice: its products are in two groups, which is an error */
    const watching = globalThis.fetch;
    globalThis.fetch = async (input, init) => String(input).endsWith('library/catalog.json')
      ? new Response(JSON.stringify({ format: 'catalog', version: 1, groups: ['boards', 'boards'] })) : watching(input, init);
    let twice = '';
    try { await openCatalog(); } catch (e) { twice = String(e); }
    globalThis.fetch = watching;
    check('openCatalog: a product in two groups throws', twice.includes('in boards and in boards'));

    /* variants: the products of a family */
    const inFamily = all.filter(k => L.product(k).family);
    check('variants: all of a family\'s products, itself among them', inFamily.length > 0 && inFamily.every(k =>
      L.variants(k).join() === all.filter(j => L.product(j).family === L.product(k).family).join()));
    check('variants: no family, only itself', all.filter(k => !L.product(k).family).every(k => L.variants(k).join() === k));

    /* materials, shops */
    /** @type {{ materials: Record<string, Record<string, unknown>> }} */
    const materials = await file('materials.json');
    /** @type {{ shops: Record<string, { name: unknown }> }} */
    const shops = await file('shops.json');
    check('materials: every key of materials.json', L.materials().join() === Object.keys(materials.materials).join());
    check('material: the look of materials.json', L.materials().every(k => JSON.stringify(L.material(k)) === JSON.stringify(materials.materials[k])));
    check('material: an unknown key throws', throws(() => L.material('no such material')));
    check('shop: those of shops.json', Object.keys(shops.shops).every(k => JSON.stringify(L.shop(k)) === JSON.stringify(shops.shops[k])));
    check('shop: an unknown key throws', throws(() => L.shop('no such shop')));

    /* textures: read when asked, once */
    const key = /** @type {Tile} */ (L.product(/** @type {string} */ (all.find(k => L.product(k).group === 'tiles')))).texture;
    const address = new URL(`../../library/textures/${key}.json`, import.meta.url).href;
    const [t1, t2] = await Promise.all([L.texture(key), L.texture(key)]);
    check('texture: its file, read once', t1 === t2 && t1.faces.length > 0 && fetched.filter(a => a === address).length === 1);
    let missing = false;
    try { await L.texture('no such texture'); } catch (e) { missing = true; }
    check('texture: an unknown key fails', missing);

    /* what a product names exists */
    check('names: every product\'s shop is a shop', all.every(k => { const s = L.product(k).shop; return !s || !throws(() => L.shop(s)); }));
    check('names: every product\'s metal is a metal finish', all.every(k => { const m = L.product(k).metal; return !m || L.material(m).finish === 'metal'; }));
    const named = [...new Set(all.map(k => /** @type {{ texture?: unknown }} */ (L.product(k)).texture).filter(t => typeof t === 'string'))];
    check('names: every texture a product names is read', (await Promise.allSettled(named.map(t => L.texture(/** @type {string} */ (t))))).every(r => r.status === 'fulfilled'));

    /* each file against its type (types.js): the fields every reader counts on */
    /** @param {unknown} v @param {string} type */
    const is = (v, type) => type === 'number?' ? v === undefined || typeof v === 'number' : type === 'string?' ? v === undefined || typeof v === 'string' : typeof v === type;
    /** @param {unknown} v @param {number} n */
    const numbers = (v, n) => Array.isArray(v) && v.length === n && v.every(x => typeof x === 'number');
    /** @type {Record<string, (p: any) => boolean>} what a group's product must have */
    const GROUP = {
      appliances: p => p.body && is(p.body.width, 'number') && is(p.body.depth, 'number'),
      boards: p => is(p.thickness, 'number') && is(p.color, 'string'),
      tiles: p => is(p.texture, 'string') && is(p.len, 'number') && is(p.wid, 'number') && is(p.joint, 'number') && numbers(p.minCut, 2)
        && ['grid', 'half', 'third', 'quarter', 'random'].includes(p.pattern)
    };
    const bad = all.filter(k => {
      const p = /** @type {any} */ (L.product(k));
      return !is(p.name, 'string') || !(p.price === undefined || p.price === null || typeof p.price === 'number') || !is(p.unit, 'string?') || !is(p.shop, 'string?')
        || !(p.priced === undefined || (typeof p.price === 'number' && typeof p.priced === 'string' && /^20\d\d-(0[1-9]|1[0-2])$/.test(p.priced)))
        || !(p.links === undefined || (Array.isArray(p.links) && p.links.every((/** @type {any} */ l) => is(l.name, 'string') && is(l.url, 'string'))))
        || (GROUP[p.group] && !GROUP[p.group](p));
    });
    check('types: every product has its fields' + (bad.length ? ': not ' + bad.join(', ') : ''), bad.length === 0);
    check('types: catalog.json, a list of groups', Array.isArray(index.groups) && index.groups.every(g => is(g, 'string')));
    check('types: every material\'s look', Object.values(materials.materials).every(m => is(m.color, 'string?') && is(m.roughness, 'number?')
      && is(m.metalness, 'number?') && is(m.opacity, 'number?') && (m.finish === undefined || m.finish === 'metal')));
    check('types: every shop has a name', Object.values(shops.shops).every(s => is(s.name, 'string')));
    const images = await Promise.all(named.map(t => L.texture(/** @type {string} */ (t))));
    check('types: every texture, wood or stone, its size, its images', images.every(t => ['wood', 'stone'].includes(t.kind) && numbers(t.size, 2)
      && t.faces.length > 0 && t.faces.every(f => f.startsWith('data:image/'))));
  }

  /* ---------- as the other modules use it ---------- */
  {
    /* index.js opens the catalog once */
    const catalog = await openCatalog();

    /* an estimate: a board by its key, its price per unit, the shop it is bought in */
    const board = /** @type {Board} */ (catalog.product('egger-u708-st9-18'));   // a board: its group says so, so it has a thickness
    check('an estimate: a board, 18 mm, a sheet 2800 × 2070 at 268.18 zł',
      board.group === 'boards' && board.thickness === 18 && board.length === 2800 && board.width === 2070 && board.unit === 'sheet' && board.price === 268.18);
    const bought = catalog.products('boards').map(k => catalog.product(k)).filter(p => p.shop);
    check('an estimate: each board bought in a shop, by its name', bought.length > 0 && bought.every(p => catalog.shop(/** @type {string} */ (p.shop)).name.length > 0));

    /* Finish: a tap in another metal, among its family */
    const tap = 'hansgrohe-tecturis-e-110-73010140';
    const metals = catalog.variants(tap).map(k => /** @type {string} */ (catalog.product(k).metal));
    check('Finish: the tap\'s family in brass and nickel', metals.join() === 'brass,nickel');
    check('Finish: the metals by their names', metals.map(m => catalog.material(m).name).join(' / ') === 'Gold (brass) / Silver (chrome, nickel)');
    const nickel = catalog.variants(tap).find(k => catalog.product(k).metal === 'nickel');
    check('Finish: the tap in nickel', nickel === 'hansgrohe-tecturis-e-110-73010000');

    /* a tile layout: a tile's size, joint, smallest piece; its texture, loaded when the tiles are drawn */
    const tile = /** @type {Tile} */ (catalog.product('paradyz-authority-graphite'));
    check('tiles: 898 × 898, joint 2, smallest piece 300 × 300, laid in a grid',
      tile.group === 'tiles' && tile.len === 898 && tile.wid === 898 && tile.joint === 2 && tile.minCut.join() === '300,300' && tile.pattern === 'grid');
    const image = await catalog.texture(tile.texture);
    check('tiles: its texture, stone, one image covers 898 × 898', image.kind === 'stone' && image.size.join() === '898,898' && image.faces.length > 0);

    /* the 2D plan: how a cut material is filled */
    check('2D: a block cut is filled dark, EPS hatched', catalog.material('block').plan === '#2d2f31' && typeof catalog.material('insulation').plan === 'object');
  }
}
