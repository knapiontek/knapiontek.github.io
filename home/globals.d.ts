// Only for the check (jsconfig.json): the one global HOME, each module's interface taken from its code, and what the pages get from outside. Not loaded by any page.
interface Home {
  data: ReturnType<typeof loadModule>['data']; load: ReturnType<typeof loadModule>['load'];
  geometry: ReturnType<typeof geometryModule>; tools: ReturnType<typeof toolsModule>; surface: ReturnType<typeof surfaceModule>; scene: ReturnType<typeof sceneModule>;
  ui: ReturnType<typeof uiModule>; plan2d: ReturnType<typeof plan2dModule>; sheet: ReturnType<typeof sheetModule>;
  tree: ReturnType<typeof treeModule>; catalog: ReturnType<typeof catalogModule>; estimate: ReturnType<typeof estimateModule>;
  model: ReturnType<typeof modelModule>; draw: ReturnType<typeof drawModule>; cabinets: ReturnType<typeof cabinetsModule>;
  room: ReturnType<typeof roomModule>; tiles: ReturnType<typeof tilesModule>; docs: ReturnType<typeof docsModule>;
}
declare var HOME: Home;
declare var THREE: any;      // three.js r128, from its CDN
declare var Alpine: any;     // Alpine.js 3, from its CDN
interface Window { HOME: Home; XLSX: any; }
