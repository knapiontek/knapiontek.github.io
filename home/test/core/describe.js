/* core/describe.js: its public API, each part with what it gives: a description is data, in the order described
   (test/test.md) */
function describeTest({ describeModule, geometryModule }, data, check) {
  const describe = describeModule(geometryModule());
  check('the public API', Object.keys(describe).join(' ') === 'create');

  /* group 1 along the house's x from (1000, 2000), its y the house's y; the floor at h 0 */
  const D = describe.create({ place: { 1: { O: [1000, 2000], X: [1, 0], Y: [0, 1] } }, level: 0, layers: ['room'], looks: { oak: {}, glass: { opacity: 0.3 } }, metal: 'steel', ceiling: 2600 });
  check('create: the API of a description', Object.keys(D).join(' ') === 'box profile at detail cylinder display mover linkTo envelope openFront openTop part lamp point pivot look STATIC CEILING LEVEL frame has metal MOVERS DETAILS LAMPS FRAMES LOOKS ENVELOPES UNDRAWN');

  const c = D.box(D.STATIC, '1', [0, 600, 0, 500, 0, 700], 'oak', 'carcasses', { name: 'Side' });
  check('box: a solid of the house, its group and layer and the host\'s', c.hb.join() === '1000,1600,2000,2500,0,700' && c.layers.join() === 'g1,carcasses,room' && D.STATIC[0] === c && c.edges);
  check('box: glass draws no edges; an empty box nothing', D.box(D.STATIC, '1', [0, 1, 0, 1, 0, 1], 'glass', 'x').edges === false && D.box(D.STATIC, '1', [0, 0, 0, 1, 0, 1], 'oak', 'x') === null);
  check('box: a box with no number is listed, not drawn', D.box(D.STATIC, '1', [0, NaN, 0, 1, 0, 1], 'oak', 'x', { name: 'Shelf' }) === null && D.UNDRAWN[0] === 'Shelf: 0, NaN, 0, 1, 0, 1');

  const door = D.mover('1', 'door', 0, 500, 0), a = D.at('1', 'handles', door);
  const d = D.cylinder(a, 10, 100, 'steel', 300, 520, 400, 'x');
  check('cylinder: a detail described, turned along x, in the door\'s frame', d.shape.kind === 'cylinder' && d.shape.r.join() === '10,10' && d.turn.z === Math.PI / 2 && d.frame.mover === door && d.moves && D.DETAILS[0] === d);
  check('at: one frame per group and moving part', D.at('1', 'hardware', door).frame === a.frame && D.at('1', 'hardware').frame !== a.frame);
  const p = D.pivot(a, 10, 0, 20, Math.PI / 2);
  check('pivot: a frame in a frame, turned', p.frame.parent === a.frame && p.frame.angle === Math.PI / 2 && p.pivot);
  D.lamp({ kind: 'spot', color: 0xffffff, intensity: 5, distance: 0, decay: 2, angle: 1, penumbra: 1 }, D.point('1', 0, 0, 2500), D.point('1', 0, 0, 0), true);
  check('lamp and point: a light from a point of the house to another', D.LAMPS[0].from.join() === '1000,2000,2500' && D.LAMPS[0].to.join() === '1000,2000,0' && D.LAMPS[0].kind === 'spot');
  const all = [].concat(D.FRAMES, D.MOVERS, D.DETAILS, D.LAMPS).map(x => x.n);
  check('the order described: every frame, part, detail and lamp numbered once', new Set(all).size === all.length);
  check('has, frame, metal: what a drawing asks', D.has('oak') && !D.has('pine') && D.frame('1').O[0] === 1000 && D.metal === 'steel');
}
