// @ts-check
// test/worker.js: one test in a worker of its own: the test module's address comes in, what passed and what failed goes back.
// A test module's default export gets check(what, ok) and imports what it tests itself.

const worker = /** @type {any} */ (globalThis);   // a worker's own scope: onmessage, postMessage

worker.onmessage = async (/** @type {{ data: string }} */ { data: address }) => {
  /** @type {string[]} */
  const passed = [];
  /** @type {string[]} */
  const failed = [];
  try {
    const { default: test } = await import(address);
    await test((/** @type {string} */ what, /** @type {boolean} */ ok) => (ok ? passed : failed).push(what));
    worker.postMessage({ passed, failed });
  } catch (e) {
    worker.postMessage({ passed, failed, error: String(e) });
  }
};
