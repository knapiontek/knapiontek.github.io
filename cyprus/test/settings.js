// @ts-check
// test/settings.js: index.json, the app's settings: its layers, the panel's blocks at its top level, a layer its name, or its
// name and the layers under it, every key once, the Floors block the floors, the others the layers, as the nodes name them;
// its view: edges, light, the cameras of the house and its floors, the plans, the walk.

import { createHierarchy } from '../core/hierarchy.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /** @type {Record<string, any>} */
  const settings = await (await fetch(new URL('../index.json', import.meta.url))).json(), blocks = settings.layers;
  check('index.json: format index, version 1; its layers and its view', settings.format === 'index' && settings.version === 1 && Object.keys(settings).join() === 'format,version,layers,view');
  /** @type {string[]} */
  const keys = [];
  /** @type {string[]} */
  const bad = [];
  /** @param {Record<string, any>} tree */
  const walk = tree => {
    for (const [k, l] of Object.entries(tree)) {
      keys.push(k);
      if (typeof l === 'string') { if (!l) bad.push(k); continue; }
      if (!l || typeof l.name !== 'string' || !l.name || !l.layers || typeof l.layers !== 'object' || !Object.keys(l.layers).length || Object.keys(l).length !== 2) bad.push(k);
      else walk(l.layers);
    }
  };
  walk(blocks);
  check('blocks: Floors, Construction, Interiors, Drawing', Object.keys(blocks).join() === 'floors,construction,interiors,drawing');
  check('blocks: each with its name and its layers', Object.values(blocks).every(b => typeof b === 'object'));
  check('a layer: its name, or its name and the layers under it' + (bad.length ? ': not ' + bad.join(', ') : ''), bad.length === 0);
  const twice = keys.filter((k, i) => keys.indexOf(k) !== i);
  check('every key once in the file' + (twice.length ? ': not ' + twice.join(', ') : ''), twice.length === 0);
  check('keys: as ids, letters and digits', keys.every(k => /^[A-Za-z][A-Za-z0-9]*$/.test(k)));

  /* the hierarchy's nodes name the file's keys: a floor of the Floors block, a layer of the others */
  const floors = Object.keys(blocks.floors.layers), known = { floors, layers: keys.filter(k => k !== 'floors' && !floors.includes(k)) };
  check('floors: Ground Floor, First Floor, Attic', floors.join() === 'groundFloor,firstFloor,attic');
  const h = createHierarchy({ id: 'house', type: 'house', offset: [0, 0, 0], size: [1, 1, 1], children: [
    { id: 'wall', type: 'wall', offset: [0, 0, 0], size: [1, 1, 1], floor: 'groundFloor', layer: 'blocks' },
    { id: 'lamp', type: 'lamp', offset: [0, 0, 0], size: [1, 1, 1], floor: 'cellar', layer: 'lamps' }] });
  const found = h.checks(known).find(c => c.name === 'Hierarchy: every layer and floor is known');
  check('a layer or a floor the file has not: found', found?.items.join() === 'lamp: layer lamps,lamp: floor cellar');
  check('without them, not checked', !h.checks().some(c => c.name === 'Hierarchy: every layer and floor is known'));

  /* the view: what it holds; a camera an eye and a target in mm; the cameras and the plans of the house and its floors */
  const view = settings.view, point = (/** @type {any} */ p) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
  check('view: edges, light, cameras, plan, walk', Object.keys(view).join() === 'edges,light,cameras,plan,walk');
  check('view: the edges in their layer, edges', view.edges.layer === 'edges' && keys.includes('edges'));
  check('view.cameras: the house\'s and the floors\'', Object.keys(view.cameras).join() === 'house,groundFloor,firstFloor' && Object.keys(view.cameras).slice(1).every(k => floors.includes(k)));
  check('a camera: its name, an eye and a target', Object.values(view.cameras).flat().every((/** @type {any} */ c) => typeof c.name === 'string' && c.name && point(c.eye) && point(c.target)));
  check('view.plan: a floor\'s cut, in mm', Object.entries(view.plan).every(([k, h]) => floors.includes(k) && Number.isFinite(h) && h > 0));
}
