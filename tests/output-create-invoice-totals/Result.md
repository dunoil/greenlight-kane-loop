---
test: ../create-invoice-totals_test.md
status: passed
started: 2026-11-19T03:17:36.541Z
duration_s: 117
session_id: 7740fc11-57ed-4fa7-9362-5a4ef7d47a11
---

# Create invoice and verify totals — Result

## Open InvoiceForge ✓ passed (15.8s)
md5: 97b91df9bd925f3df2babf39781d4309
Open http://localhost:4173.

Verify the page heading "InvoiceForge" is visible and an invoice list is shown.

## Start a new invoice ✓ passed (22.5s)
md5: 7ace9f71fad1e0549fe7c61c7580992f
Click the "New Invoice" button.

Verify the invoice editor is shown with a Client name field.

## Fill in the client and one line item ✓ passed (31.5s)
md5: 1c895910a2d372aaa57b2dafe8d85a09
Type "Kane Check Co" into the Client name field.

In the first line item row, type "Verification widget" into the Description
field, set Qty to 2 and Unit price to 50.

Verify the line item amount shows $100.00.

## Verify the totals preview ✓ passed (18.1s)
md5: 1a31af261986340cd841335f2a5a7fb7
Verify the totals preview shows Subtotal $100.00 and Total $100.00.

## Save and verify the invoice in the list ✓ passed (24.8s)
md5: dc8c82f190eb3fd5e86dfcc6f6592f90
Click the "Save Invoice" button.

Verify the invoice list is shown again, and it contains an invoice for
"Kane Check Co" with total $100.00.
