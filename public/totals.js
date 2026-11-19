/*
 * InvoiceForge money math — the single source of truth for totals.
 * Loaded in the browser as window.InvoiceMath and required by
 * tools/check-math.js in Node, so the check exercises the app's real logic.
 *
 * Rules (spec.md): round every step to 2dp; discount applies to the
 * subtotal; tax applies to the discounted subtotal; total = discounted + tax.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.InvoiceMath = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function round2(n) {
    // Epsilon nudge so 1.005 rounds to 1.01, not 1.00.
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function computeTotals(items, discountPct, taxPct, chaos) {
    chaos = chaos || {};
    var list = Array.isArray(items) ? items : [];
    var subtotal = round2(
      list.reduce(function (sum, it) {
        return sum + (Number(it.qty) || 0) * (Number(it.price) || 0);
      }, 0)
    );
    var discount = round2(subtotal * ((Number(discountPct) || 0) / 100));
    var discountedSubtotal = round2(subtotal - discount);
    // CHAOS (a): tax on the full subtotal, before the discount (breaks AC-5).
    var taxBase = chaos.taxOrder ? subtotal : discountedSubtotal;
    var tax = round2(taxBase * ((Number(taxPct) || 0) / 100));
    var total = round2(discountedSubtotal + tax);
    // CHAOS (b): one-cent rounding drift on the total (breaks AC-6).
    if (chaos.roundingDrift) total = round2(total + 0.01);
    return {
      subtotal: subtotal,
      discount: discount,
      discountedSubtotal: discountedSubtotal,
      tax: tax,
      total: total,
    };
  }

  return { round2: round2, computeTotals: computeTotals };
});
