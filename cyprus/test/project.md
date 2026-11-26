# test

Open `index.html` over HTTP. Each test runs in a worker of its own and imports what it tests.

| File / folder | What |
|---|---|
| `index.html`, `index.js` | the test page (Alpine): every test, what it imports, OK or what failed |
| `run.js` | runs one test module in its worker |
| `dependencies/` | a module alone: its public API only; the same path as the module (`library/catalog.js`) |
| `samples/` | how the other modules use a module, on the project's own data |

A test module's default export gets `check(what, ok)`.
