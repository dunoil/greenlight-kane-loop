# Working in this repo — instructions for coding agents

This project is **Greenlight**: InvoiceForge plus a Kane CLI verification
loop. The full Kane CLI instructions for agents live at
https://www.testmuai.com/kane-cli-agent/AGENTS.md — read them; they
govern every `kane-cli` invocation here. The essentials:

## The verify-and-fix loop (mandatory before saying "done")

1. Start the app: `npm start` (http://localhost:4173).
2. Run the loop: `node loop/loop.js`. It runs every `tests/*_test.md`
   via `kane-cli testmd run <file> --agent --headless --timeout 180`,
   parses the NDJSON verdict, and appends to `loop/loop-log.json`.
3. Read the exit code first: **0** pass · **1** fail · **2** did-not-start
   (sign-in / Chrome / URL — nothing ran, no credits used) · **3** timeout.
4. On a fail, open `loop/last-failure.md`. It contains the failing step
   remarks verbatim and your fix prompt. Fix the **application code**,
   then re-run the loop. Repeat until every suite logs `passed`.
5. Report results in plain language: verdict, Kane's summary, duration,
   credits, and the Test Manager link (`test_url`) when present.

## Rules

- **Never edit a test to make it pass.** Never weaken, delete, or reword
  an assertion. If a test looks wrong, say so and stop — a human decides.
- **Money math lives only in `public/totals.js`.** The contract is in
  `spec.md`: discount on the subtotal, tax on the *discounted* subtotal,
  everything rounded to 2dp. The worked example ($200, 10%, 10% → $198.00)
  must always hold with Chaos mode off.
- **Chaos mode is a demo feature, not a bug.** Its toggles in the app
  deliberately break AC-5, AC-6, and AC-8 so Kane can catch them. If a
  run fails, check the chaos banner before touching code.
- New user-visible behavior needs a Kane flow: add or extend a
  `tests/*_test.md` (frontmatter `mode: testing`, one `##` section per
  step, every flow ends in a verify/assert on a visible outcome) and map
  it to its acceptance criteria in the README table.
- Commit the `output-<name>/` recording folder next to any test Kane
  authors, so replays stay fast and cheap. Never commit
  `.testmuai/evidence/`.
- Tag Kane runs with your runtime, e.g.
  `KANE_CLI_USER_AGENT=claude-code kane-cli run ...` (the loop sets
  `greenlight-loop` by default).
