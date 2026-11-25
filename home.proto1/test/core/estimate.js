/* core/estimate.js: its public API, each part with what it gives (test/test.md) */
function coreEstimateTest({ coreEstimateModule, coreToolsModule }, data, check) {
  const E = coreEstimateModule(coreToolsModule());
  check('the public API', Object.keys(E).join(' ') === 'estimate');

  const { sheet, row } = E.estimate({ title: 'Kitchen', categories: [
    { name: 'Boards', items: [{ id: 'oak', name: 'Oak board', unit: 'm²', qty: 4, price: 100 }] },
    { name: 'Hardware', items: [{ id: 'hinge', name: 'Hinge', unit: 'pc', qty: 10, price: null }] }] });
  check('estimate: a sheet named Estimate', sheet.name === 'Estimate');
  check('estimate: the row of each item, by its id', typeof row.oak === 'number' && typeof row.hinge === 'number' && row.oak !== row.hinge);
  const cells = r => sheet.rows[r - 1].cells;
  check('estimate: an item\'s value is its quantity × its price, rounded to the grosz', cells(row.oak)[7].f === `ROUND(E${row.oak}*G${row.oak},2)` && cells(row.oak)[4].input === true && cells(row.oak)[6].input === true);
  check('estimate: an item with no price yet has no value', cells(row.hinge)[6] === '' && cells(row.hinge)[7] === '');
  check('estimate: a category sums its items', cells(row.oak - 1)[1] === 'Boards' && cells(row.oak - 1)[7].f === `SUM(H${row.oak}:H${row.oak})`);
  const total = sheet.rows.find(r => r.kind === 'grand');
  check('estimate: the total is the sum of the categories', total.cells[1] === 'TOTAL GROSS' && total.cells[7].f === `H${row.oak - 1}+H${row.hinge - 1}`);
}
