// @ts-check
// test/index.js: the test page's Alpine part: every test in a worker of its own (test/worker.js). A test lies at the path of
// the module it tests.

/* the tests, from this folder, at the path of what they test */
const TESTS = [['core/hierarchy.js'], ['core/geometry.js'], ['core/surfaces.js'], ['library/catalog.js'], ['library/shapes.js'], ['layers.js', 'layers.json'], ['house/build.js', 'house/build.js, house/model.json'], ['scene.js']];

/** a test in a worker of its own @param {string} address @returns {Promise<{ passed: string[], failed: string[], error?: string }>} */
function run(address) {
  const worker = new Worker(new URL('worker.js', location.href), { type: 'module' });
  return new Promise(done => {
    worker.onmessage = ({ data }) => { worker.terminate(); done(data); };
    worker.onerror = e => { worker.terminate(); done({ passed: [], failed: [], error: e.message }); };
    worker.postMessage(address);
  });
}

document.addEventListener('alpine:init', () => {
  Alpine.data('tests', () => ({
    rows: TESTS.map(([file, of = file]) => ({ file, of, done: false, ok: false, passed: /** @type {string[]} */ ([]), failed: /** @type {string[]} */ ([]), error: '' })),
    async init() {
      await Promise.all(this.rows.map(async r => {
        const result = await run(new URL(r.file, location.href).href);
        Object.assign(r, result, { done: true, ok: !result.error && !result.failed.length });
      }));
    }
  }));
});
