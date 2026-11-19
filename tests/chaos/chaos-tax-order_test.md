---
mode: testing
tags: [chaos, math, discount, tax]
---

# Chaos detection — tax-before-discount regression must be caught

This is a chaos-cycle test: it deliberately turns ON the "Tax before
discount" chaos regression, then runs the spec.md worked example and
asserts the CORRECT total. Kane is EXPECTED TO FAIL this test with the
invoice totalling $200.00 instead of $198.00 — that failure is the
detection evidence. The fix is turning chaos off, which the main
discount-tax-math suite proves by passing. Never weaken this test to
make it pass while chaos is on.

## Open InvoiceForge and arm the regression

Open http://localhost:4173.

In the "Chaos mode — demo only" panel, turn ON the toggle labelled
"Tax before discount".

Verify the page shows a banner saying Chaos mode is ON.

## Enter the worked example

Click the "New Invoice" button.

Type "Chaos Check Co" into the Client name field.

In the first line item row, type "Audit service" into the Description
field, set Qty to 1 and Unit price to 200.

Set the Discount % field to 10 and the Tax % field to 10.

## Verify the correct total (expected to fail while chaos is on)

Verify the totals preview shows Tax $18.00.

Verify the totals preview shows Total $198.00.
