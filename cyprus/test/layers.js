// @ts-check
// test/layers.js: layers.json: the panel's blocks at its top level; a layer its name, or its name and the layers under it;
// every key once in the file, as the nodes of the hierarchy name them; a hierarchy with a layer the file has not.

import { createHierarchy } from '../core/hierarchy.js';

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /** @type {Record<string, any>} */
  const blocks = await (await fetch(new URL('../layers.json', import.meta.url))).json();
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

  /* the hierarchy's nodes name the file's keys */
  const h = createHierarchy({ id: 'house', type: 'house', offset: [0, 0, 0], size: [1, 1, 1], children: [
    { id: 'wall', type: 'wall', offset: [0, 0, 0], size: [1, 1, 1], layers: ['groundFloor', 'blocks'] },
    { id: 'lamp', type: 'lamp', offset: [0, 0, 0], size: [1, 1, 1], layers: ['lamps'] }] });
  const found = h.checks(keys).find(c => c.name === 'Hierarchy: every layer is known');
  check('a layer the file has not: found', found?.items.join() === 'lamp: lamps');
  check('without the layers, not checked', !h.checks().some(c => c.name === 'Hierarchy: every layer is known'));
}
