// @ts-check
// test/index.js: the test page's Alpine part: every test in a worker of its own (test/run.js), its imports read from its file.

/* the tests, from this folder */
const TESTS = [
  { table: 'dependencies', file: 'dependencies/library/catalog.js' },
  { table: 'samples', file: 'samples/library.js' }
];
const TABLES = [
  { id: 'dependencies', name: 'Dependencies', what: 'Test', about: 'A module alone: its test imports only that module and calls only its public API.' },
  { id: 'samples', name: 'Samples', what: 'Sample', about: 'How the other modules use a module\'s public API, on the project\'s own data; what comes out is checked.' }
];

/** what a test imports, from the project folder: read from its import lines @param {string} address */
async function imports(address) {
  const code = await (await fetch(address)).text();
  const project = new URL('..', location.href).href;
  return [...code.matchAll(/^import\s.*?from\s+'([^']+)'/gm)].map(m => new URL(m[1], address).href.slice(project.length));
}

/** a test in a worker of its own @param {string} address @returns {Promise<{ passed: string[], failed: string[], error?: string }>} */
function run(address) {
  const worker = new Worker(new URL('run.js', location.href), { type: 'module' });
  return new Promise(done => {
    worker.onmessage = ({ data }) => { worker.terminate(); done(data); };
    worker.onerror = e => { worker.terminate(); done({ passed: [], failed: [], error: e.message }); };
    worker.postMessage(address);
  });
}

document.addEventListener('alpine:init', () => {
  Alpine.data('tests', () => ({
    tables: TABLES,
    rows: TESTS.map(t => ({ ...t, imports: /** @type {string[]} */ ([]), done: false, ok: false, passed: /** @type {string[]} */ ([]), failed: /** @type {string[]} */ ([]), error: '' })),
    async init() {
      for (const r of this.rows) {
        const address = new URL(r.file, location.href).href;
        r.imports = await imports(address);
        const result = await run(address);
        Object.assign(r, result, { done: true, ok: !result.error && !result.failed.length });
      }
    }
  }));
});
