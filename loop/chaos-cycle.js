/*
 * Greenlight chaos cycle — the "Kane catches it" half of the story.
 *
 *   node loop/chaos-cycle.js
 *
 * Runs every tests/chaos/*_test.md through Kane CLI. Each chaos test arms
 * a deliberate regression in the app (Chaos mode) and then asserts the
 * CORRECT behaviour, so Kane is expected to FAIL the run. A failed chaos
 * run is therefore a SUCCESS for this script: it means Kane caught the
 * injected bug. The results are appended to loop/loop-log.json next to
 * the main suite's iterations, with a fix note recording that the fix
 * is turning Chaos mode off — which the main suite passing proves.
 *
 * Exit codes: 0 every regression was caught (Kane failed each chaos
 * test as designed) · 1 a chaos test PASSED (regression NOT caught) or
 * timed out · 2 did-not-start (sign-in / Chrome / URL — nothing ran).
 */
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CHAOS_DIR = path.join(ROOT, 'tests', 'chaos');
const LOG_PATH = path.join(__dirname, 'loop-log.json');

const FIX_NOTES = {
  'chaos-tax-order_test.md':
    'Expected failure: the "Tax before discount" chaos regression was ON, so the worked example totalled $200.00 instead of $198.00 and Kane caught it. Fix: turn Chaos mode off — no app code change needed. The main discount-tax-math suite passing proves the app is correct with chaos off.',
  'chaos-mark-paid_test.md':
    'Expected failure: the chaos regression that makes "Mark as Paid" silently do nothing was ON, so INV-1001 stayed at status Sent and Kane caught it. Fix: turn Chaos mode off — no app code change needed. The main mark-paid-flow suite passing proves the app is correct with chaos off.',
};

function loadLog() {
  try {
    const data = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    if (!data || !Array.isArray(data.iterations)) throw new Error('bad shape');
    return data;
  } catch {
    return { project: 'greenlight', iterations: [] };
  }
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n');
}

function parseNdjson(stdout) {
  const events = [];
  for (const line of String(stdout || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      /* ignore non-JSON lines */
    }
  }
  return events;
}

function runKane(testFile) {
  const rel = path.join('tests', 'chaos', testFile);
  const cmd = ['testmd', 'run', rel, '--agent', '--headless', '--timeout', '180'];
  if (process.env.LT_USERNAME && process.env.LT_ACCESS_KEY) {
    cmd.push('--username', process.env.LT_USERNAME, '--access-key', process.env.LT_ACCESS_KEY);
  }
  const result = spawnSync('kane-cli', cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, KANE_CLI_USER_AGENT: process.env.KANE_CLI_USER_AGENT || 'greenlight-chaos-cycle' },
  });

  if (result.error && result.error.code === 'ENOENT') {
    return { verdict: 'did-not-start', summary: 'Did not start — kane-cli is not installed on this machine.', failing: [], testUrl: null };
  }
  if (result.error && result.error.code === 'ETIMEDOUT') {
    return { verdict: 'timeout', summary: 'Timed out — the cycle killed the Kane run after 240s.', failing: [], testUrl: null };
  }

  const events = parseNdjson(result.stdout);
  const failing = events
    .filter((e) => e && e.status === 'failed' && e.remark)
    .map((e) => (e.step != null ? `Step ${e.step}: ${e.remark}` : String(e.remark)));
  const runEnd = [...events].reverse().find((e) => e && e.type === 'run_end');
  const testUrl = (runEnd && runEnd.test_url) || null;
  const exit = result.status;

  if (exit === 2) {
    return {
      verdict: 'did-not-start',
      summary: 'Did not start (exit 2) — nothing ran. Kane CLI sign-in, Chrome, or the start URL needs fixing. No credits were used.',
      failing: [],
      testUrl: null,
    };
  }
  if (exit === 3) {
    return { verdict: 'timeout', summary: (runEnd && runEnd.summary) || 'The Kane run timed out or was cancelled (exit 3).', failing, testUrl };
  }
  if (exit === 0) {
    return {
      verdict: 'passed',
      summary: (runEnd && runEnd.summary) || 'The chaos test passed — the injected regression was NOT caught.',
      failing: [],
      testUrl,
    };
  }
  return {
    verdict: 'failed',
    summary: (runEnd && runEnd.summary) || 'Kane ran the flow and it did not pass — the injected regression was caught.',
    failing,
    testUrl,
  };
}

function main() {
  const tests = fs.existsSync(CHAOS_DIR)
    ? fs.readdirSync(CHAOS_DIR).filter((f) => f.endsWith('_test.md')).sort()
    : [];
  if (!tests.length) {
    console.error('No tests/chaos/*_test.md files found. Nothing to run.');
    process.exit(2);
  }

  const log = loadLog();
  let next = log.iterations.reduce((m, i) => Math.max(m, i.iteration || 0), 0) + 1;
  let worst = 0;

  console.log(`Greenlight chaos cycle — ${tests.length} regression(s) armed; Kane must catch every one`);

  for (const testFile of tests) {
    console.log(`\n▶ ${testFile} — running Kane against the armed regression…`);
    const outcome = runKane(testFile);
    const caught = outcome.verdict === 'failed';
    const entry = {
      iteration: next++,
      timestamp: new Date().toISOString(),
      suite: `tests/chaos/${testFile}`,
      mode: 'kane-chaos',
      verdict: outcome.verdict,
      failing_step_remarks: outcome.failing,
      summary: outcome.summary,
      test_url: outcome.testUrl,
      fix_note: caught ? FIX_NOTES[testFile] || 'Expected failure: chaos regression was ON and Kane caught it. Fix: turn Chaos mode off.' : '',
    };
    log.iterations.push(entry);
    saveLog(log);

    console.log(`  #${entry.iteration} ${testFile}: ${entry.verdict} — ${caught ? 'CAUGHT as designed' : 'NOT the expected catch'}`);
    console.log(`    ${entry.summary}`);
    for (const r of entry.failing_step_remarks) console.log(`    ✗ ${r}`);

    if (!caught) {
      if (outcome.verdict === 'did-not-start') worst = worst === 1 ? 1 : 2;
      else worst = 1;
    }
  }

  console.log(`\nChaos cycle done: loop/loop-log.json now holds ${log.iterations.length} iteration(s) total`);
  process.exit(worst);
}

main();
