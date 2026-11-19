---
test: ../discount-tax-math_test.md
status: passed
started: 2026-11-19T03:19:42.265Z
duration_s: 101
session_id: 09c5e4bb-a4f1-4a55-b0c4-dc26271bbcb2
---

# Discount and tax math — tax applies after the discount — Result

## Open InvoiceForge and start a new invoice ✓ passed (21.6s)
md5: bdd46ac4060e281835635f1d75461909
Open http://localhost:4173.

Click the "New Invoice" button.

Verify the invoice editor is shown.

## Enter the worked example ✓ passed (26.2s)
md5: dd6a25960440b50628e84d6633be5c3e
Type "Math Proof Ltd" into the Client name field.

In the first line item row, type "Audit service" into the Description
field, set Qty to 1 and Unit price to 200.

Set the Discount % field to 10 and the Tax % field to 10.

## Verify every totals figure ✓ passed (24.1s)
md5: f35ba8cffbfe8eb0bcf4a7b09392d692
Verify the totals preview shows Subtotal $200.00.

Verify the totals preview shows Discount −$20.00.

Verify the totals preview shows Tax $18.00.

Verify the totals preview shows Total $198.00.

## Save and verify the persisted total ✓ passed (24.8s)
md5: 91c9777308b53af9fa183ada30ac7033
Click the "Save Invoice" button.

Verify the invoice list contains an invoice for "Math Proof Ltd" with
total $198.00.
