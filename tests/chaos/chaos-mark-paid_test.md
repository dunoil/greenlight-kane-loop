---
mode: testing
tags: [chaos, status, paid]
---

# Chaos detection — dead "Mark as Paid" button must be caught

This is a chaos-cycle test: it deliberately turns ON the chaos
regression that makes the "Mark as Paid" button silently do nothing,
then runs the normal mark-paid flow on the seeded invoice INV-1001
(which starts with status Sent) and asserts the status becomes Paid.
Kane is EXPECTED TO FAIL this test because the status stays Sent —
that failure is the detection evidence. The fix is turning chaos off,
which the main mark-paid-flow suite proves by passing. Never weaken
this test to make it pass while chaos is on.

## Open InvoiceForge and arm the regression

Open http://localhost:4173.

In the "Chaos mode — demo only" panel, turn ON the toggle labelled
"Mark as Paid does nothing".

Verify the page shows a banner saying Chaos mode is ON.

Verify the invoice list shows invoice INV-1001 with status Sent.

## Mark INV-1001 as paid

In the row for invoice INV-1001, click the "Mark as Paid" button.

## Verify the status changed (expected to fail while chaos is on)

Verify invoice INV-1001 now shows status Paid in the invoice list.
