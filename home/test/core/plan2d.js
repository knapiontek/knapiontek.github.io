/* core/plan2d.js: its public API, each part with what it gives (test/test.md) */
function plan2dTest({ plan2dModule, geometryModule, formatModule }, data, check) {
  const geometry = geometryModule(), P = plan2dModule(geometry, formatModule()), prism = geometry.prism;
  check('the public API', Object.keys(P).join(' ') === 'create solidShape');

  const shape = P.solidShape({ S: prism([0, 3000, 0, 4000, 0, 2500]), layers: [] });
  check('solidShape: a solid seen from above, from its bottom to its top', shape.poly.length === 4 && shape.bottom === 0 && shape.top === 2500);

  const plan = P.create(data('library/materials.js').materials);
  check('create: the API of a plan', Object.keys(plan).join(' ') === 'SIZE rect floorArea cut seen labels rooms borders chain dims sheets');
  const room = plan.rooms(0, [{ rects: [[0, 3000, 0, 4000]], numbers: [6], name: 'Kitchen' }]);
  check('rooms: a room\'s number, name and area', room.includes('>6<') && room.includes('>Kitchen<') && room.includes('m²'));
  const svg = plan.sheets([{ extent: [0, 3000, 0, 4000], title: 'Ground floor', draw: X => plan.floorArea(X, [[0, 3000, 0, 4000]]) }]);
  check('sheets: one drawing with each sheet\'s title', svg.startsWith('<svg') && svg.endsWith('</svg>') && svg.includes('>Ground floor<'));
}
