// @ts-check
// test/core/surfaces.js: core/surfaces.js by examples, as the scene uses it: one box, its faces and welded corners; two boxes of one
// group (their joint gone), of two groups (a contact piece each side, raw); a small box on a big one (its corners on the big
// face's edges: no T-junctions); a face's material by its side; the welding itself.

import { createSurfaces } from '../../core/surfaces.js';
import { prism } from '../../core/geometry.js';

/** @typedef {import('../../core/surfaces.js').Cell} Cell */
/** @typedef {import('../../core/surfaces.js').Piece} Piece */

/** @param {(what: string, ok: boolean) => void} check */
export default async function (check) {
  /** a cell of a box @param {number[]} b @param {Partial<Cell>} [look] @returns {Cell} */
  const box = (b, look = {}) => ({ S: prism(b), group: 'a', material: 'concrete', ...look });
  /** the welded points of the pieces @param {Piece[]} pieces */
  const points = pieces => new Set(pieces.flatMap(f => f.poly));
  const area = (/** @type {Piece} */ f) => { let a = 0; const p = f.poly; for (let i = 1; i < p.length - 1; i++) { const u = p[i].map((v, k) => v - p[0][k]), w = p[i + 1].map((v, k) => v - p[0][k]); a += Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) / 2; } return a; };

  /* ---------- one box ---------- */
  {
    const pieces = createSurfaces().piecesOf([box([0, 1000, 0, 1000, 0, 1000])]);
    check('one box: six faces', pieces.length === 6);
    check('welded: eight corners, each one object for its three faces', points(pieces).size === 8);
    check('a face\'s normal, outward', pieces.some(f => f.n.join() === '0,0,1') && pieces.some(f => f.n.join() === '-1,0,0'));
  }

  /* ---------- two boxes side by side ---------- */
  {
    const one = createSurfaces().piecesOf([box([0, 1000, 0, 1000, 0, 1000]), box([1000, 2000, 0, 1000, 0, 1000])]);
    check('one group: the joint gone, ten faces, twelve corners', one.length === 10 && points(one).size === 12);
    const two = createSurfaces().piecesOf([box([0, 1000, 0, 1000, 0, 1000]), box([1000, 2000, 0, 1000, 0, 1000], { group: 'b', raw: 'block' })]);
    const contact = two.filter(f => f.cover);
    check('two groups: the joint kept, a contact piece on each side, each covered by the other group', two.length === 12 && contact.length === 2
      && contact.some(f => f.group === 'a' && f.cover === 'b') && contact.some(f => f.group === 'b' && f.cover === 'a'));
    check('a contact piece: the raw material, where the cell has one', contact.find(f => f.group === 'b')?.material === 'block' && contact.find(f => f.group === 'a')?.material === 'concrete');
  }

  /* ---------- a small box on a big one: no T-junctions ---------- */
  {
    const pieces = createSurfaces().piecesOf([box([0, 3000, 0, 3000, 0, 1000]), box([1000, 2000, 0, 1000, 1000, 1500])]);
    const top = pieces.filter(f => f.n.join() === '0,0,1' && f.poly.every(p => p[2] === 1000));
    check('the big top less the small box\'s foot', Math.abs(top.reduce((s, f) => s + area(f), 0) - (9e6 - 1e6)) < 1e-3);
    const front = pieces.find(f => f.n.join() === '0,-1,0' && f.poly.every(p => p[2] <= 1000));
    check('conform: the small box\'s corners on the big front\'s edge are its vertices too', !!front && front.poly.length === 6);
  }

  /* ---------- a face's material by its side ---------- */
  {
    const roof = { S: prism([0, 1000, 0, 1000, 0, 100]), group: 'a', faceMaterial: (/** @type {number[]} */ n) => n[2] > 0.3 ? 'roofGraphite' : 'plasterWhite' };
    const pieces = createSurfaces().piecesOf([roof]);
    check('faceMaterial: the top tiles, the rest white', pieces.filter(f => f.material === 'roofGraphite').length === 1 && pieces.filter(f => f.material === 'plasterWhite').length === 5);
    check('uv: a face\'s texture coordinates, mm', pieces.every(f => f.uv(f.poly[0]).length === 2));
  }

  /* ---------- the welding ---------- */
  {
    const { weld } = createSurfaces();
    const a = weld([100, 200, 300]);
    check('weld: a point within 0.05 mm is the same point', weld([100.04, 200, 299.96]) === a);
    check('weld: further, another point', weld([100.2, 200, 300]) !== a);
    check('a drawing of its own: another createSurfaces welds apart', createSurfaces().weld([100, 200, 300]) !== a);
  }
}
