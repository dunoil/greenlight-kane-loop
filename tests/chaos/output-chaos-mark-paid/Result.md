---
test: ../chaos-mark-paid_test.md
status: failed
started: 2026-11-19T03:22:35.509Z
duration_s: 96
session_id: 46aa7225-aaee-42e5-9a05-59aeb594fd40
---

# Chaos detection — dead "Mark as Paid" button must be caught — Result

## Open InvoiceForge and arm the regression ✓ passed (55.8s)
md5: 5bc50b29b912b241f360481fb193093f
Open http://localhost:4173.

In the "Chaos mode — demo only" panel, turn ON the toggle labelled
"Mark as Paid does nothing".

Verify the page shows a banner saying Chaos mode is ON.

Verify the invoice list shows invoice INV-1001 with status Sent.

## Mark INV-1001 as paid ✓ passed (10s)
md5: 221ca3741488005b64938ff11db6b411
In the row for invoice INV-1001, click the "Mark as Paid" button.

## Verify the status changed (expected to fail while chaos is on) ✗ failed (25.6s)
md5: ba4afd04647dfe20d21039157854364d
Reason: Final verification failed: "invoice INV-1001 now shows status Paid in the invoice list" — bug verdict: Mark as Paid leaves INV-1001 in Sent status [application_issue/functional_defect, confidence 0.99]
Verify invoice INV-1001 now shows status Paid in the invoice list.
