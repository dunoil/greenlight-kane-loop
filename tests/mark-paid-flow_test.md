---
mode: testing
tags: [smoke, status, paid]
---

# Mark an invoice as paid

Covers AC-8: "Mark as Paid" changes an invoice's status to Paid and the
change is visible in the list. The seeded invoice INV-1001 starts with
status Sent. If the button silently does nothing, this test fails.

## Open InvoiceForge

Open http://localhost:4173.

Verify the invoice list shows invoice INV-1001 with status Sent.

## Mark INV-1001 as paid

In the row for invoice INV-1001, click the "Mark as Paid" button.

## Verify the status changed

Verify invoice INV-1001 now shows status Paid in the invoice list.
