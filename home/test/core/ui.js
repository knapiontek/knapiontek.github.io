/* core/ui.js: its public API, each part with what it gives; what needs the browser (the page, its pieces) is not called
   here (test/test.md) */
function uiTest({ uiModule, toolsModule }, data, check) {
  const ui = uiModule(toolsModule());
  check('the public API', Object.keys(ui).join(' ') === 'MODES TAB_NAMES $ byId el part component page openAll layerTree layerSwitch layerList sunStore sunBox download setColumns autoFit');

  check('MODES and TAB_NAMES: the names on the screen', ui.MODES['3d'] === '3D' && ui.MODES.documents === 'Documents' && ui.TAB_NAMES.layers === 'Layers');
  check('byId: a list by its ids', ui.byId([{ id: 'a', n: 1 }, { id: 'b', n: 2 }]).b.n === 2);

  const LAYER = ui.layerTree({ walls: { name: 'Walls', layers: { doors: { name: 'Doors' } } }, roof: { name: 'Roof' } });
  check('layerTree: each layer, its name and its parent', LAYER.walls.parent === null && LAYER.doors.parent === 'walls' && LAYER.doors.name === 'Doors' && LAYER.roof.parent === null);
  const state = { walls: false };
  const { layerOn, shown } = ui.layerSwitch(LAYER, () => state);
  check('layerSwitch: a layer is off when its parent is off', !layerOn('walls') && !layerOn('doors') && layerOn('roof'));
  check('layerSwitch: shown when all its layers are on', shown(['roof']) && !shown(['roof', 'doors']));
  const list = ui.layerList(LAYER, ['walls', 'roof'], state, layerOn);
  check('layerList: each top layer, its children under it', list.map(i => i.k).join() === 'walls,doors,roof' && list[1].child && list[1].off && !list[0].on);

  const moving = { opened: false }, asked = [];
  const item = ui.openAll(moving, { toggleAll: on => asked.push(on) });
  item.go();
  check('openAll: one button, Open, then everything opens', item.name === 'Open' && moving.opened === true && asked.join() === 'true');
  let made = null;
  ui.component('test', () => (made = {}));
  check('part and component: a piece and its Alpine part are kept for the page', typeof ui.part === 'function' && made === null);
}
