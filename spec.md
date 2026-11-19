# InvoiceForge — Specification

Greenlight's app. Written **before** the code; the Kane suite in `tests/` is
derived from the acceptance criteria (AC) below, and the README carries the
AC → test coverage table.

InvoiceForge is a small invoicing app for freelancers and small studios.
Its numbers are its contract: if a total on screen is wrong, the app is
wrong. That is exactly what Kane CLI verifies in a real browser.

## Money rules (the contract)

- All money is rounded to 2 decimal places at every step (`round2`).
- **Subtotal** = Σ (quantity × unit price) over all line items.
- **Discount** = discount % applied to the subtotal.
- **Taxable amount** = subtotal − discount.
- **Tax** = tax % applied to the **taxable amount** (i.e. tax is calculated
  *after* the discount, never on the full subtotal).
- **Total** = taxable amount + tax.

Worked example (used verbatim by the Kane suite): one item, 1 × $200.00,
discount 10%, tax 10% → subtotal $200.00, discount $20.00, taxable $180.00,
tax $18.00, **total $198.00**. Any other total is a bug.

## Acceptance criteria

| ID | Criterion |
|---|---|
| AC-1 | The dashboard lists every invoice with its number, client name, total, and status (draft / sent / paid), plus summary counts per status. |
| AC-2 | A user can create an invoice with a client name, client email, notes, a status, and one or more line items (description, quantity, unit price), and can add and remove line-item rows while editing. |
| AC-3 | Subtotal equals Σ (quantity × unit price), rounded to 2dp. |
| AC-4 | Discount % is applied to the subtotal. |
| AC-5 | Tax % is applied to the discounted subtotal (subtotal − discount), never to the full subtotal. |
| AC-6 | Total equals (subtotal − discount) + tax, with every displayed money value rounded to 2dp — no rounding drift. |
| AC-7 | The editor shows a live totals preview (subtotal, discount, tax, total) that updates as items, discount %, or tax % change, before saving. |
| AC-8 | An invoice has a status of draft, sent, or paid. "Mark as paid" changes a draft/sent invoice to paid and the change persists and is visible in the list. |
| AC-9 | A user can delete an invoice (with a confirmation) and it disappears from the list. |
| AC-10 | A printable invoice view renders a clean document (client, items, totals, notes) suitable for browser printing / PDF. |
| AC-11 | Invoices persist in `localStorage`; on first run the app seeds three demo invoices with correct totals. |
| AC-12 | Chaos mode (demo-only, clearly labelled, persisted in `localStorage`) can inject three named regressions: (a) tax calculated before discount, (b) a one-cent rounding drift on the total, (c) "Mark as paid" silently doing nothing. With chaos off, none of these occur. |
| AC-13 | The Loop Log page renders every iteration recorded in `loop/loop-log.json`: iteration number, time, suite, verdict, failing step, and the Kane test link when present. |
| AC-14 | The app runs with one command — `npm start` — on port 4173, with zero npm dependencies (Node's built-in `http` only). |

## Out of scope

Accounts/login, a backend database, payments, multi-currency, emailing
invoices. Judges must be able to run everything with no credentials.
