/* core/scene.js: its public API; it draws only in the browser (three.js), so here it is only made: making it touches
   nothing outside its parameters (test/test.md) */
function sceneTest({ sceneModule, geometryModule, facesModule }, data, check) {
  const geometry = geometryModule(), scene = sceneModule(geometry, facesModule(geometry));
  check('the public API', Object.keys(scene).join(' ') === 'create');
  check('create: a 3D view, made when a page asks', typeof scene.create === 'function');
}
