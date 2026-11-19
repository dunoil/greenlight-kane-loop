/* Loop Log page — renders loop/loop-log.json (AC-13). */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function badgeClass(verdict) {
    return String(verdict || '').toLowerCase().replace(/[^a-z]+/g, '-');
  }

  fetch('/loop-log.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var iterations = (data && data.iterations) || [];
      var summary = document.getElementById('loopSummary');
      var box = document.getElementById('iterations');
      if (!iterations.length) {
        summary.textContent = 'No runs yet';
        box.innerHTML = '<div class="empty">No loop iterations recorded yet.<br>Run <code>npm run loop</code> (or <code>npm run loop:dry</code>) to record the first one.</div>';
        return;
      }
      var passed = iterations.filter(function (i) { return i.verdict === 'passed'; }).length;
      summary.textContent = iterations.length + ' run(s) · ' + passed + ' passed';
      box.innerHTML = iterations.slice().reverse().map(function (it) {
        var fails = (it.failing_step_remarks || []).map(function (r) {
          return '<p class="fail">✗ ' + esc(r) + '</p>';
        }).join('');
        var link = it.test_url
          ? '<p class="fix">Kane evidence: <a href="' + esc(it.test_url) + '" target="_blank" rel="noopener">Test Manager run</a></p>'
          : '';
        var fix = it.fix_note ? '<p class="fix">Fix: ' + esc(it.fix_note) + '</p>' : '';
        var when = it.timestamp ? new Date(it.timestamp).toLocaleString() : '';
        return '<article class="iteration">' +
          '<header><strong>#' + esc(it.iteration) + '</strong>' +
          '<span class="badge ' + badgeClass(it.verdict) + '">' + esc(it.verdict) + '</span>' +
          '<span>' + esc(it.suite || '') + '</span>' +
          (it.mode ? '<span class="when">mode: ' + esc(it.mode) + '</span>' : '') +
          '<span class="when">' + esc(when) + '</span></header>' +
          (it.summary ? '<p class="summary">' + esc(it.summary) + '</p>' : '') +
          fails + fix + link +
          '</article>';
      }).join('');
    })
    .catch(function () {
      document.getElementById('iterations').innerHTML =
        '<div class="empty">Could not load loop-log.json — is the server running?</div>';
    });
})();
