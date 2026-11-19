---
mode: testing
tags: [smoke, totals, create]
---

# Create invoice and verify totals

Covers AC-2, AC-3, AC-7: a user can create an invoice and the totals
preview and the saved invoice show the exact expected total.

## Open InvoiceForge

Open http://localhost:4173.

Verify the page heading "InvoiceForge" is visible and an invoice list is shown.

## Start a new invoice

Click the "New Invoice" button.

Verify the invoice editor is shown with a Client name field.

## Fill in the client and one line item

Type "Kane Check Co" into the Client name field.

In the first line item row, type "Verification widget" into the Description
field, set Qty to 2 and Unit price to 50.

Verify the line item amount shows $100.00.

## Verify the totals preview

Verify the totals preview shows Subtotal $100.00 and Total $100.00.

## Save and verify the invoice in the list

Click the "Save Invoice" button.

Verify the invoice list is shown again, and it contains an invoice for
"Kane Check Co" with total $100.00.
