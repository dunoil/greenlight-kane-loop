---
test: ../chaos-tax-order_test.md
status: failed
started: 2026-11-19T03:24:14.225Z
duration_s: 104
session_id: 37c3cf94-42b9-45d2-9dd1-9125d35ed5b5
---

# Chaos detection — tax-before-discount regression must be caught — Result

## Open InvoiceForge and arm the regression ✓ passed (25s)
md5: 696b984c468bce6e29a9edb2714d67a2
Open http://localhost:4173.

In the "Chaos mode — demo only" panel, turn ON the toggle labelled
"Tax before discount".

Verify the page shows a banner saying Chaos mode is ON.

## Enter the worked example ✓ passed (43.4s)
md5: 04acd10856ee259bcfe6a5c3a0a44e1a
Click the "New Invoice" button.

Type "Chaos Check Co" into the Client name field.

In the first line item row, type "Audit service" into the Description
field, set Qty to 1 and Unit price to 200.

Set the Discount % field to 10 and the Tax % field to 10.

## Verify the correct total (expected to fail while chaos is on) ✗ failed (31.5s)
md5: d6670124c28ae56e7339bda13f6ed5fe
Reason: Checkpoint assertion failed: "the totals preview shows Tax $18.00" — bug verdict: Invoice preview calculates tax before discount [application_issue/ui_data_defect, confidence 0.99]
Verify the totals preview shows Tax $18.00.

Verify the totals preview shows Total $198.00.
