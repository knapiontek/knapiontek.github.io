# Cyprus

The house "Dom w papawerach 5 (G)" (archon.pl), as built: its model in 3D and 2D, its documents, its cabinets. The prototype
(`home.proto`) is the functional base; this project rebuilds it cleanly, by the plan.

Served over HTTP (Caddy, `start-caddy.sh`): `http://localhost:8080/` the page, `/test/` the tests.

| File / folder | What |
|---|---|
| `index.html` | the page: its pieces (Alpine) |
| `index.js` | joins the page to the modules: the page's Alpine part; for now a sketch with stand-in data |
| `types.js` | the contracts between modules (types only, never loaded by the browser) |
| `globals.d.ts`, `jsconfig.json` | the type check (`tsc -p jsconfig.json`): Alpine's global, strict checks of every `.js` |
| `start-caddy.sh` | serves this folder at port 8080 |
| `TODO.md` | what is left, step by step |
| `archon/` | the source: archon's drawings and their reading |
| `core/` | general code, no project |
| `library/` | the outside world: products, materials, textures, shops |
| `test/` | dependency tests and samples |

## Rules

1. The prototype is the functional base; a change only where the plan says or we agree.
2. `core` knows no project: every name and rule comes from its caller.
3. `types.js` holds only what one module counts on from another; a module takes a type by `import('…/types.js')` in a comment.
4. A folder is a set of modules; one imports the module it needs (`library/catalog.js` → `openCatalog`).
5. Data is plain JSON, frozen once read: no code changes it.
6. Every module has a dependency test (its public API only) and a sample (its use on the project's own data).
7. Pages run on Alpine from its CDN; nothing is loaded locally.
8. No dead code: code comes in when something uses it.
9. Before every delivery: `tsc` strict, the tests, a click through the page.
10. English in code and data; Polish only for proper and trade names.
