---
mode: testing
tags: [smoke, math, discount, tax]
---

# Discount and tax math — tax applies after the discount

Covers AC-4, AC-5, AC-6 using the worked example from spec.md:
1 × $200.00, discount 10%, tax 10% → subtotal $200.00, discount $20.00,
taxable $180.00, tax $18.00, total $198.00.
If tax were calculated before the discount the total would be $200.00;
a one-cent rounding drift would make it $198.01. Both must fail this test.

## Open InvoiceForge and start a new invoice

Open http://localhost:4173.

Click the "New Invoice" button.

Verify the invoice editor is shown.

## Enter the worked example

Type "Math Proof Ltd" into the Client name field.

In the first line item row, type "Audit service" into the Description
field, set Qty to 1 and Unit price to 200.

Set the Discount % field to 10 and the Tax % field to 10.

## Verify every totals figure

Verify the totals preview shows Subtotal $200.00.

Verify the totals preview shows Discount −$20.00.

Verify the totals preview shows Tax $18.00.

Verify the totals preview shows Total $198.00.

## Save and verify the persisted total

Click the "Save Invoice" button.

Verify the invoice list contains an invoice for "Math Proof Ltd" with
total $198.00.
