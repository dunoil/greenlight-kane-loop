---
test: ../mark-paid-flow_test.md
status: passed
started: 2026-11-19T03:21:32.290Z
duration_s: 54
session_id: 15efc2ca-6e47-47c5-bdb2-dd10bfcc491b
---

# Mark an invoice as paid — Result

## Open InvoiceForge ✓ passed (20.4s)
md5: 25c13645bdf0de0603c08cf79ceae07e
Open http://localhost:4173.

Verify the invoice list shows invoice INV-1001 with status Sent.

## Mark INV-1001 as paid ✓ passed (11.6s)
md5: 221ca3741488005b64938ff11db6b411
In the row for invoice INV-1001, click the "Mark as Paid" button.

## Verify the status changed ✓ passed (18.3s)
md5: ba4afd04647dfe20d21039157854364d
Verify invoice INV-1001 now shows status Paid in the invoice list.
