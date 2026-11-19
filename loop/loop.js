/*
 * Greenlight loop engine — the closed loop between the coding agent and Kane CLI.
 *
 *   node loop/loop.js              run every tests/*_test.md through Kane CLI
 *   node loop/loop.js --dry-run    simulate runs without invoking Kane
 *   node loop/loop.js totals       only run test files whose name contains "totals"
 *
 * For each test it spawns:
 *   kane-cli testmd run tests/<file> --agent --headless --timeout 180
 * (plus --username/--access-key when LT_USERNAME / LT_ACCESS_KEY are set, e.g. in CI),
 * parses the NDJSON stream, and appends one iteration to loop/loop-log.json.
 * On failure it (re)writes loop/last-failure.md with the failing step remarks
 * and a ready-to-use fix prompt for a coding agent.
 *
 * Exit codes mirror Kane's: 0 all passed, 1 a test failed, 2 did-not-start
 * (e.g. Kane not signed in — reported plainly, never a crash), 3 timeout.
 */
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TESTS_DIR = path.join(ROOT, 'tests');
const LOG_PATH = path.join(__dirname, 'loop-log.json');
const FAILURE_PATH = path.join(__dirname, 'last-failure.md');
const APP_URL = process.env.GREENLIGHT_URL || 'http://localhost:4173';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filter = args.find((a) => !a.startsWith('--')) || '';

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

function discoverTests() {
  if (!fs.existsSync(TESTS_DIR)) return [];
  return fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith('_test.md'))
    .filter((f) => !filter || f.includes(filter))
    .sort();
}

function parseNdjson(stdout) {
  const events = [];
  for (const line of String(stdout || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      /* not a JSON line — ignore */
    }
  }
  return events;
}

function runKane(testFile) {
  const rel = path.join('tests', testFile);
  const cmd = ['testmd', 'run', rel, '--agent', '--headless', '--timeout', '180'];
  if (process.env.LT_USERNAME && process.env.LT_ACCESS_KEY) {
    cmd.push('--username', process.env.LT_USERNAME, '--access-key', process.env.LT_ACCESS_KEY);
  }
  const result = spawnSync('kane-cli', cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, KANE_CLI_USER_AGENT: process.env.KANE_CLI_USER_AGENT || 'greenlight-loop' },
  });

  if (result.error && result.error.code === 'ENOENT') {
    return {
      verdict: 'did-not-start',
      summary:
        'Did not start — kane-cli is not installed on this machine. Install it with: npm install -g @testmuai/kane-cli',
      failing: [],
      testUrl: null,
    };
  }
  if (result.error && result.error.code === 'ETIMEDOUT') {
    return {
      verdict: 'timeout',
      summary: 'Timed out — the loop killed the Kane run after 240s. Split the test or raise the timeout.',
      failing: [],
      testUrl: null,
    };
  }

  const events = parseNdjson(result.stdout);
  const combined = String(result.stdout || '') + '\n' + String(result.stderr || '');
  const failing = events
    .filter((e) => e && e.status === 'failed' && e.remark)
    .map((e) => (e.step != null ? `Step ${e.step}: ${e.remark}` : String(e.remark)));
  const runEnd = [...events].reverse().find((e) => e && e.type === 'run_end');
  const mdDone = [...events].reverse().find((e) => e && e.type === 'test_md_done');
  const testUrl = (runEnd && runEnd.test_url) || null;
  const exit = result.status;

  if (exit === 2) {
    const authHint = /not authenticated|not logged in|login/i.test(combined)
      ? ' Kane CLI is not signed in: run `kane-cli login` (or set LT_USERNAME / LT_ACCESS_KEY). No credits were used.'
      : ' Fix sign-in, Chrome, or the start URL, then run the loop again. No credits were used.';
    return {
      verdict: 'did-not-start',
      summary: 'Did not start (exit 2) — nothing ran.' + authHint,
      failing: [],
      testUrl: null,
    };
  }
  if (exit === 3) {
    return {
      verdict: 'timeout',
      summary: (runEnd && runEnd.summary) || 'The Kane run timed out or was cancelled (exit 3).',
      failing,
      testUrl,
    };
  }
  if (exit === 0 || (mdDone && mdDone.overall_status === 'passed' && exit !== 1)) {
    return {
      verdict: 'passed',
      summary: (runEnd && runEnd.summary) || 'Kane verified the flow end to end — every assertion passed.',
      failing: [],
      testUrl,
    };
  }
  return {
    verdict: 'failed',
    summary:
      (runEnd && runEnd.summary) ||
      'Kane ran the flow and it did not pass. See the failing steps below.',
    failing,
    testUrl,
  };
}

function writeFailureFile(failures) {
  const lines = [];
  lines.push('# Last Kane failure — fix prompt');
  lines.push('');
  lines.push(`Generated by loop/loop.js at ${new Date().toISOString()}.`);
  lines.push('');
  for (const f of failures) {
    lines.push(`## ${f.suite} — ${f.verdict}`);
    lines.push('');
    lines.push(`Summary: ${f.summary}`);
    lines.push('');
    if (f.failing.length) {
      lines.push('Failing steps (from the Kane NDJSON stream):');
      for (const r of f.failing) lines.push(`- ${r}`);
      lines.push('');
    }
    if (f.testUrl) lines.push(`Evidence: ${f.testUrl}`);
    lines.push('');
  }
  lines.push('## Fix prompt — hand this to your coding agent');
  lines.push('');
  lines.push('```text');
  lines.push(`You are fixing the InvoiceForge app in this repository. Kane CLI ran the`);
  lines.push(`test suite(s) above against ${APP_URL} and they FAILED.`);
  lines.push('The failing step remarks are quoted verbatim in this file — trust them');
  lines.push('over your assumptions about the code.');
  lines.push('');
  lines.push('Rules:');
  lines.push('1. Read spec.md first. The money rules (AC-3 to AC-6) and the status');
  lines.push('   rules (AC-8) are the contract; public/totals.js is the only place');
  lines.push('   totals may be computed.');
  lines.push('2. Check whether Chaos mode is ON in the app — if a chaos regression');
  lines.push('   explains the failure, the fix is turning chaos off, not editing code.');
  lines.push('3. Fix the application code, never the test. Do not weaken, delete, or');
  lines.push('   reword any assertion to make a run pass.');
  lines.push(`4. Restart the app (npm start), then re-run: node loop/loop.js`);
  lines.push('5. You are done only when the loop logs a "passed" verdict for every');
  lines.push('   suite and you can quote the run summary.');
  lines.push('```');
  lines.push('');
  fs.writeFileSync(FAILURE_PATH, lines.join('\n'));
}

function main() {
  const tests = discoverTests();
  if (!tests.length) {
    console.error('No tests/*_test.md files found' + (filter ? ` matching "${filter}"` : '') + '. Nothing to run.');
    process.exit(2);
  }

  const log = loadLog();
  let next = log.iterations.reduce((m, i) => Math.max(m, i.iteration || 0), 0) + 1;
  const failures = [];
  let worstExit = 0;

  console.log(
    `Greenlight loop — ${tests.length} suite(s), mode: ${dryRun ? 'dry-run (Kane not invoked)' : 'kane-cli testmd run'}`
  );

  for (const testFile of tests) {
    let outcome;
    if (dryRun) {
      outcome = {
        verdict: 'simulated',
        summary: `Dry run — Kane CLI was not invoked. Simulated pass for ${testFile}; no verification happened.`,
        failing: [],
        testUrl: null,
      };
    } else {
      console.log(`\n▶ ${testFile} — running Kane (this can take a few minutes)…`);
      outcome = runKane(testFile);
    }

    const entry = {
      iteration: next++,
      timestamp: new Date().toISOString(),
      suite: testFile,
      mode: dryRun ? 'dry-run' : 'kane',
      verdict: outcome.verdict,
      failing_step_remarks: outcome.failing,
      summary: outcome.summary,
      test_url: outcome.testUrl,
      fix_note: '',
    };
    log.iterations.push(entry);
    saveLog(log);

    console.log(`  #${entry.iteration} ${testFile}: ${entry.verdict} — ${entry.summary}`);
    for (const r of entry.failing_step_remarks) console.log(`    ✗ ${r}`);
    if (entry.test_url) console.log(`    evidence: ${entry.test_url}`);

    if (entry.verdict === 'failed' || entry.verdict === 'timeout') {
      failures.push(entry);
      worstExit = entry.verdict === 'failed' ? 1 : 3;
    } else if (entry.verdict === 'did-not-start' && worstExit === 0) {
      worstExit = 2;
    }
  }

  if (failures.length) {
    writeFailureFile(failures);
    console.log(`\n✗ ${failures.length} suite(s) need attention — fix prompt written to loop/last-failure.md`);
  }
  console.log(`\nLoop log updated: loop/loop-log.json (${log.iterations.length} iteration(s) total)`);
  process.exit(worstExit);
}

main();
