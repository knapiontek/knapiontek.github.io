# test/dependencies

One test per module, at the module's own path: it imports only that module and calls only its public API.

| File | Tests |
|---|---|
| `library/catalog.js` | `library/catalog.js`: every call of the catalog, unknown keys, frozen data, a texture read once, every library file against its type |
