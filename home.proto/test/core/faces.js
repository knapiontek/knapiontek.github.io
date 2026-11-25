/* core/faces.js: its public API, each part with what it gives (test/test.md) */
function coreFacesTest({ coreFacesModule, coreGeometryModule }, data, check) {
  const geometry = coreGeometryModule(), S = coreFacesModule(geometry), prism = geometry.prism;
  check('the public API', Object.keys(S).join(' ') === 'sub3 dot3 cross3 weld piecesOf');

  check('sub3, dot3, cross3', S.sub3([3, 2, 1], [1, 1, 1]).join() === '2,1,0' && S.dot3([1, 2, 3], [4, 5, 6]) === 32 && S.cross3([1, 0, 0], [0, 1, 0]).join() === '0,0,1');
  check('weld: two points 0.01 mm apart are one point', S.weld([10, 20, 30]) === S.weld([10.01, 20, 30]));

  /* the area of a piece: half the length of the sum of its corners' cross products */
  const area = p => Math.hypot(...p.poly.reduce((s, a, i) => { const c = S.cross3(a, p.poly[(i + 1) % p.poly.length]); return s.map((v, k) => v + c[k]); }, [0, 0, 0])) / 2;
  const total = pieces => pieces.reduce((s, p) => s + area(p), 0);
  const cell = (box, material) => ({ S: prism(box), material, layers: ['walls'] });

  const one = S.piecesOf([cell([0, 1000, 0, 1000, 0, 1000], 'plaster')]);
  check('piecesOf: a cube of 1000 shows 6 faces of 1 m²', total(one) === 6e6 && new Set(one.map(p => p.n.join())).size === 6);
  check('piecesOf: a piece has its material and its layers', one.every(p => p.material === 'plaster' && p.group === 'walls'));
  const two = S.piecesOf([cell([0, 1000, 0, 1000, 0, 1000], 'plaster'), cell([1000, 2000, 0, 1000, 0, 1000], 'plaster')]);
  check('piecesOf: two cubes side by side hide the face between them', total(two) === 10e6);
}
