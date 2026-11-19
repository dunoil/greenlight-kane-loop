/*
 * Money-math check — exercises the app's real logic (public/totals.js,
 * the same file the browser loads) in Node. Run: npm run check
 * Covers AC-3..AC-6 plus the three chaos regressions (AC-12), which must
 * produce the exact wrong answers the Kane suite is built to catch.
 */
'use strict';

const assert = require('node:assert');
const { computeTotals, round2 } = require('../public/totals.js');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('  ok — ' + name);
}

console.log('InvoiceForge totals check (public/totals.js)');

check('rounding: 1.005 -> 1.01, 2.675 -> 2.68', () => {
  assert.strictEqual(round2(1.005), 1.01);
  assert.strictEqual(round2(2.675), 2.68);
});

check('AC-3: subtotal is sum of qty x price (2 x $50 = $100)', () => {
  const t = computeTotals([{ qty: 2, price: 50 }], 0, 0);
  assert.deepStrictEqual(t, { subtotal: 100, discount: 0, discountedSubtotal: 100, tax: 0, total: 100 });
});

check('AC-4/5/6: spec worked example — $200, 10% discount, 10% tax -> tax $18, total $198', () => {
  const t = computeTotals([{ qty: 1, price: 200 }], 10, 10);
  assert.strictEqual(t.subtotal, 200);
  assert.strictEqual(t.discount, 20);
  assert.strictEqual(t.discountedSubtotal, 180);
  assert.strictEqual(t.tax, 18);
  assert.strictEqual(t.total, 198);
});

check('AC-3/6: multi-item with cents — 3 x $33.33, 11% tax, no discount', () => {
  const t = computeTotals([{ qty: 3, price: 33.33 }], 0, 11);
  assert.strictEqual(t.subtotal, 99.99);
  assert.strictEqual(t.tax, 11); // round2(99.99 * 0.11) = round2(10.9989) = 11.00
  assert.strictEqual(t.total, 110.99);
});

check('seed invoice INV-1001 totals — $2000, 10% off, 11% tax -> $1998', () => {
  const t = computeTotals(
    [
      { qty: 1, price: 1500 },
      { qty: 2, price: 250 },
    ],
    10,
    11
  );
  assert.strictEqual(t.subtotal, 2000);
  assert.strictEqual(t.discount, 200);
  assert.strictEqual(t.tax, 198);
  assert.strictEqual(t.total, 1998);
});

check('empty invoice totals are all zero', () => {
  const t = computeTotals([], 10, 10);
  assert.deepStrictEqual(t, { subtotal: 0, discount: 0, discountedSubtotal: 0, tax: 0, total: 0 });
});

check('CHAOS (a) taxOrder: worked example wrongly totals $200 (Kane must catch)', () => {
  const t = computeTotals([{ qty: 1, price: 200 }], 10, 10, { taxOrder: true });
  assert.strictEqual(t.tax, 20);
  assert.strictEqual(t.total, 200);
});

check('CHAOS (b) roundingDrift: worked example wrongly totals $198.01 (Kane must catch)', () => {
  const t = computeTotals([{ qty: 1, price: 200 }], 10, 10, { roundingDrift: true });
  assert.strictEqual(t.total, 198.01);
});

check('chaos off is the default: no flags -> correct $198', () => {
  assert.strictEqual(computeTotals([{ qty: 1, price: 200 }], 10, 10).total, 198);
  assert.strictEqual(computeTotals([{ qty: 1, price: 200 }], 10, 10, {}).total, 198);
});

console.log(`\nAll ${passed} checks passed.`);
