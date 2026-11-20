/* core/estimate.js: its public API, each part with what it gives (test/test.md) */
function estimateTest(HOME, data, check) {
  check('the public API', Object.keys(HOME.estimate).join(' ') === 'estimate');

  const { sheet, row } = HOME.estimate.estimate({ title: 'Kitchen', categories: [
    { name: 'Boards', items: [{ id: 'oak', name: 'Oak board', unit: 'm²', qty: 4, price: 100 }] },
    { name: 'Hardware', items: [{ id: 'hinge', name: 'Hinge', unit: 'pc', qty: 10, price: null }] }] });
  check('estimate: a sheet named Estimate', sheet.name === 'Estimate');
  check('estimate: the row of each item, by its id', typeof row.oak === 'number' && typeof row.hinge === 'number' && row.oak !== row.hinge);
}
