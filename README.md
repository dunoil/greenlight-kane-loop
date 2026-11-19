# Greenlight — InvoiceForge, verified by Kane CLI

**Build it with any agent. Verify it with Kane. Ship only on green.**

Greenlight is an invoicing app that refuses to call itself done until an
independent verifier — [Kane CLI](https://www.testmuai.com/kane-cli/) by
TestMu AI — has driven it in a real browser and returned a pass. The
coding agent builds; Kane checks the agent's work; a failure is handed
back to the agent as a written fix prompt; the loop repeats until green.
Every iteration is on the record in the app's own Loop Log.

Built for the [Kane CLI Hackathon](https://www.kaneclihack.sh)
(12–26 Nov 2026) by Duan (@dunoil), solo, with an AI coding agent.

## The app: InvoiceForge

A small invoicing tool for freelancers and studios — dashboard, invoice
editor with dynamic line items, discount + tax, draft/sent/paid statuses,
printable invoice view. Zero npm dependencies; data persists in
`localStorage`. Its numbers are its contract (see `spec.md`): subtotal →
discount → **tax on the discounted amount** → total, rounded to the cent.

### Run it (one command)

```bash
npm start          # http://localhost:4173
```

Node 18+, nothing to install — there are no dependencies.

## The loop

```
agent edits code ──▶ node loop/loop.js ──▶ kane-cli testmd run --agent
                          ▲                          │
                          │                    NDJSON verdict
                          │                          ▼
              loop/last-failure.md ◀── parse run_end / exit code
              (fix prompt for the agent)     append loop/loop-log.json
```

```bash
npm run loop         # real run: Kane CLI verifies every suite in tests/
npm run loop:dry     # simulate the loop without invoking Kane
npm run check        # unit-check the money math against public/totals.js
```

- `loop/loop.js` runs each `tests/*_test.md`, parses Kane's NDJSON
  (`run_end` / `test_md_done`) and exit code — 0 pass, 1 fail,
  2 did-not-start (e.g. not signed in; reported plainly, no credits used),
  3 timeout — and appends an iteration to `loop/loop-log.json`.
- On failure it writes `loop/last-failure.md`: the failing step remarks
  verbatim plus a fix prompt the agent works from. The agent fixes the
  **app**, never the test, and re-runs.
- Open **http://localhost:4173/loop-log.html** to see every iteration:
  verdict, failing step, summary, and the Kane Test Manager evidence link.

Prerequisite for real runs: `npm install -g @testmuai/kane-cli`, then
`kane-cli login` (or set `LT_USERNAME` / `LT_ACCESS_KEY`).

## Chaos mode — the demo

InvoiceForge ships with a clearly-labelled **Chaos mode** panel that
injects realistic regressions: tax calculated before the discount, a
one-cent rounding drift, and a "Mark as Paid" button that silently does
nothing. Turn one on, run the loop, and watch Kane catch the exact wrong
number in a real browser — then turn it off and watch the same suite go
green. That inject → fail → fix → pass cycle is the whole point.

## Acceptance criteria → Kane coverage

The suite is derived from `spec.md`. Each test file ends in assertions on
visible outcomes (exact totals, exact status), never on implementation.

| Spec criteria | Kane test |
|---|---|
| AC-2 create invoice, AC-3 subtotal = Σ qty×price, AC-7 live preview | `tests/create-invoice-totals_test.md` |
| AC-4 discount on subtotal, AC-5 tax after discount, AC-6 total & 2dp rounding | `tests/discount-tax-math_test.md` (spec's worked example: $200, 10% off, 10% tax → **$198.00**) |
| AC-8 mark-as-paid persists and shows in list | `tests/mark-paid-flow_test.md` |
| AC-1 dashboard, AC-9 delete, AC-10 print, AC-11 seed/persistence, AC-14 one-command run | Exercised manually + via `npm run check`; dashboard state is asserted as the opening step of every suite |
| AC-12 chaos regressions | The same three suites, run with chaos on — each must fail, and pass again with chaos off |
| AC-13 Loop Log page | `loop/loop.js` writes the data; the page renders whatever the loop recorded |

## CI

`.github/workflows/kane.yml` runs the full loop on every pull request
with `LT_USERNAME` / `LT_ACCESS_KEY` repository secrets. A red Kane run
fails the check — no merge without a greenlight.

## Layout

```
spec.md                  the contract: money rules + AC-1..AC-14
server.js                zero-dependency Node http server (port 4173)
public/                  InvoiceForge (index, totals.js = the only math,
                         app.js, loop-log page)
loop/loop.js             the closed-loop engine
loop/loop-log.json       every verification iteration, on the record
tests/*_test.md          Kane CLI suites (committable, replayable)
tools/check-math.js      Node check of totals incl. chaos regressions
AGENTS.md                instructions for coding agents working here
```

## Hackathon notes

- Lane: **Apps that verify themselves** (with a workflow spine).
- Repo initialized 19 Nov 2026, inside the event window (≥ 12 Nov).
- Demo video, live URL, and launch posts: linked from the submission.
