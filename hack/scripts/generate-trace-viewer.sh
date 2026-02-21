#!/usr/bin/env bash
# generate-trace-viewer.sh — Generates a visual HTML trace viewer and a
# textual trace summary from Jaeger trace data (traces.json).
#
# Produces:
#   ci-report/traces.html   — Interactive waterfall viewer (for humans)
#   ci-report/traces.txt    — Machine-readable summary (for Claude)
#
# Usage:
#   ./hack/scripts/generate-trace-viewer.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/ci-report"
TRACES_FILE="${REPORT_DIR}/traces.json"

if [[ ! -f "$TRACES_FILE" ]]; then
  echo "No traces.json found — skipping trace viewer generation."
  exit 0
fi

# ---------------------------------------------------------------------------
# 1. Generate textual trace summary (for Claude)
# ---------------------------------------------------------------------------
python3 -c "
import json, sys

data = json.load(open('${TRACES_FILE}'))
captured = data.get('captured_at', 'unknown')
services = data.get('services', {})

print(f'Trace Summary (captured {captured})')
print('=' * 60)
print()

# Deduplicate traces by traceID across services.
# Jaeger returns the same trace from each service query.
by_id = {}
for svc_name, svc_data in services.items():
    for t in svc_data.get('data', []):
        tid = t['traceID']
        existing = by_id.get(tid)
        if not existing or len(t.get('spans', [])) > len(existing.get('spans', [])):
            by_id[tid] = t

# Attribute each trace to its root span's service.
unique_traces = []
for tid, t in sorted(by_id.items(), key=lambda x: min((s.get('startTime', 0) for s in x[1].get('spans', [0])), default=0)):
    spans = t.get('spans', [])
    processes = t.get('processes', {})
    span_ids = {s['spanID'] for s in spans}

    root = None
    for s in spans:
        refs = s.get('references', [])
        if not any(r.get('spanID') in span_ids and r.get('refType') == 'CHILD_OF' for r in refs):
            if root is None or s.get('startTime', 0) < root.get('startTime', 0):
                root = s
    if root is None and spans:
        root = spans[0]
    root_svc = processes.get(root.get('processID', ''), {}).get('serviceName', '?') if root else '?'
    unique_traces.append((root_svc, t, root))

# Per-service summary.
from collections import Counter
svc_counts = Counter(svc for svc, _, _ in unique_traces)
for svc in sorted(svc_counts):
    print(f'{svc}: {svc_counts[svc]} traces')

print()

total_spans = 0
for root_svc, t, root in unique_traces:
    spans = t.get('spans', [])
    processes = t.get('processes', {})
    total_spans += len(spans)
    tid = t['traceID'][:12]
    if root:
        dur_ms = root.get('duration', 0) / 1000
        print(f'[{tid}] {root_svc}/{root[\"operationName\"]} {dur_ms:.1f}ms ({len(spans)} spans)')

        children = sorted(spans, key=lambda s: s.get('startTime', 0))
        for child in children:
            if child['spanID'] == root['spanID']:
                continue
            child_dur = child.get('duration', 0) / 1000
            child_proc = processes.get(child.get('processID', ''), {}).get('serviceName', '?')
            error_tags = [tag for tag in child.get('tags', []) if tag.get('key') == 'error' and tag.get('value') == True]
            status = ' ERROR' if error_tags else ''
            print(f'  {child_proc}/{child[\"operationName\"]} {child_dur:.1f}ms{status}')
    print()

print(f'Total: {len(unique_traces)} traces, {total_spans} spans across {len(services)} services')
" > "${REPORT_DIR}/traces.txt" 2>/dev/null || echo "Failed to generate trace summary" > "${REPORT_DIR}/traces.txt"

echo "Generated traces.txt ($(wc -c < "${REPORT_DIR}/traces.txt") bytes)"

# ---------------------------------------------------------------------------
# 2. Generate visual HTML trace viewer (for humans)
# ---------------------------------------------------------------------------
# Inline the trace JSON into a self-contained HTML file.
TRACE_JSON=$(cat "$TRACES_FILE")

cat > "${REPORT_DIR}/traces.html" <<'VIEWER_TOP'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trace Viewer — Turbo Engine CI</title>
<style>
  :root {
    --bg: #fff; --fg: #24292e; --fg-muted: #586069;
    --border: #e1e4e8; --bg-code: #f6f8fa; --link: #0366d6;
    --accent: #0366d6; --error: #cb2431; --warn: #b08800;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0d1117; --fg: #c9d1d9; --fg-muted: #8b949e;
      --border: #30363d; --bg-code: #161b22; --link: #58a6ff;
      --accent: #58a6ff; --error: #f85149; --warn: #d29922;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 14px; line-height: 1.5; color: var(--fg); background: var(--bg);
    padding: 16px; max-width: 100vw; overflow-x: hidden;
    -webkit-text-size-adjust: 100%;
  }
  .container { max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 1.4em; margin-bottom: 4px; }
  .subtitle { color: var(--fg-muted); font-size: 13px; margin-bottom: 16px; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .breadcrumb { font-size: 13px; color: var(--fg-muted); margin-bottom: 8px; }
  .breadcrumb a { color: var(--fg-muted); }

  /* Stats bar */
  .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
  .stat { background: var(--bg-code); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; }
  .stat-value { font-size: 1.3em; font-weight: 600; }
  .stat-label { font-size: 11px; color: var(--fg-muted); text-transform: uppercase; }

  /* Service filter */
  .filters { margin-bottom: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
  .filter-btn {
    border: 1px solid var(--border); background: var(--bg); color: var(--fg);
    padding: 4px 10px; border-radius: 16px; cursor: pointer; font-size: 12px;
  }
  .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

  /* Trace list */
  .trace { border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; overflow: hidden; }
  .trace-header {
    padding: 8px 12px; background: var(--bg-code); cursor: pointer;
    display: flex; align-items: center; gap: 8px; font-size: 13px;
  }
  .trace-header:hover { background: var(--border); }
  .trace-toggle { font-size: 10px; color: var(--fg-muted); flex-shrink: 0; }
  .trace-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .trace-meta { color: var(--fg-muted); white-space: nowrap; margin-left: auto; font-size: 12px; }
  .trace-svc {
    font-size: 11px; padding: 1px 6px; border-radius: 3px;
    background: var(--accent); color: #fff; flex-shrink: 0;
  }
  .trace-body { display: none; padding: 0; }
  .trace.open .trace-body { display: block; }
  .trace.open .trace-toggle::after { content: "▼"; }
  .trace-toggle::after { content: "▶"; }

  /* Waterfall */
  .waterfall { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .wf-row {
    display: flex; align-items: center; border-top: 1px solid var(--border);
    font-size: 12px; min-height: 28px;
  }
  .wf-row:hover { background: var(--bg-code); }
  .wf-label {
    min-width: 200px; max-width: 300px; padding: 2px 8px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    flex-shrink: 0; font-family: SFMono-Regular, Consolas, monospace;
  }
  .wf-label .indent { color: var(--fg-muted); }
  .wf-bar-area { flex: 1; min-width: 200px; position: relative; height: 28px; }
  .wf-bar {
    position: absolute; top: 6px; height: 16px; border-radius: 3px;
    min-width: 2px; opacity: 0.85;
  }
  .wf-bar:hover { opacity: 1; }
  .wf-duration {
    font-size: 11px; color: var(--fg-muted); padding: 2px 6px;
    white-space: nowrap; flex-shrink: 0; min-width: 60px; text-align: right;
  }
  .wf-bar.error { background: var(--error) !important; }

  /* Color palette for services */
  .svc-0 { background: #0366d6; } .svc-1 { background: #28a745; }
  .svc-2 { background: #6f42c1; } .svc-3 { background: #d73a49; }
  .svc-4 { background: #e36209; } .svc-5 { background: #005cc5; }

  @media (prefers-color-scheme: dark) {
    .svc-0 { background: #58a6ff; } .svc-1 { background: #3fb950; }
    .svc-2 { background: #bc8cff; } .svc-3 { background: #f85149; }
    .svc-4 { background: #f0883e; } .svc-5 { background: #79c0ff; }
  }

  .empty-state { padding: 32px; text-align: center; color: var(--fg-muted); }
</style>
</head>
<body>
<div class="container">
  <nav class="breadcrumb"><a href="./">← Back to report</a></nav>
  <h1>Trace Viewer</h1>
  <div class="subtitle" id="subtitle"></div>
  <div class="stats" id="stats"></div>
  <div class="filters" id="filters"></div>
  <div id="traces"></div>
</div>
<script>
VIEWER_TOP

# Inject the trace data as a JS variable.
printf "var TRACE_DATA = " >> "${REPORT_DIR}/traces.html"
cat "$TRACES_FILE" >> "${REPORT_DIR}/traces.html"
printf ";\n" >> "${REPORT_DIR}/traces.html"

cat >> "${REPORT_DIR}/traces.html" <<'VIEWER_BOTTOM'

(function() {
  var services = TRACE_DATA.services || {};
  var capturedAt = TRACE_DATA.captured_at || 'unknown';

  document.getElementById('subtitle').textContent = 'Captured at ' + capturedAt;

  // Collect all traces, deduplicating by traceID.
  // Jaeger returns the same trace from each service's query, so a trace
  // spanning gateway → registry → builder would appear 3 times.  We keep
  // only the copy with the most spans (most complete) and attribute the
  // trace to the service that owns the root span.
  var traceById = {};
  var svcNames = Object.keys(services).sort();
  var svcColorMap = {};
  svcNames.forEach(function(name, i) { svcColorMap[name] = 'svc-' + (i % 6); });

  svcNames.forEach(function(svcName) {
    var svcData = services[svcName];
    var traces = (svcData && svcData.data) || [];
    traces.forEach(function(t) {
      var tid = t.traceID;
      var existing = traceById[tid];
      // Keep the copy with the most spans (most complete).
      if (!existing || (t.spans || []).length > (existing.trace.spans || []).length) {
        traceById[tid] = { svcName: svcName, trace: t };
      }
    });
  });

  // Re-attribute each trace to its root span's service.
  var allTraces = Object.keys(traceById).map(function(tid) {
    var item = traceById[tid];
    var t = item.trace;
    var spans = t.spans || [];
    var processes = t.processes || {};
    var spanIds = {};
    spans.forEach(function(s) { spanIds[s.spanID] = true; });

    // Find root span (no parent in this trace).
    var rootSpan = null;
    spans.forEach(function(s) {
      var refs = s.references || [];
      var hasParentInTrace = refs.some(function(r) {
        return r.refType === 'CHILD_OF' && spanIds[r.spanID];
      });
      if (!hasParentInTrace) {
        if (!rootSpan || s.startTime < rootSpan.startTime) rootSpan = s;
      }
    });
    if (rootSpan) {
      var proc = processes[rootSpan.processID] || {};
      if (proc.serviceName) item.svcName = proc.serviceName;
    }
    return item;
  });

  // Sort traces chronologically by earliest span start time.
  allTraces.sort(function(a, b) {
    var aStart = Math.min.apply(null, (a.trace.spans || []).map(function(s) { return s.startTime; }));
    var bStart = Math.min.apply(null, (b.trace.spans || []).map(function(s) { return s.startTime; }));
    return aStart - bStart;
  });

  // Stats (after deduplication).
  var totalSpans = allTraces.reduce(function(sum, t) {
    return sum + (t.trace.spans || []).length;
  }, 0);

  var statsEl = document.getElementById('stats');
  statsEl.innerHTML =
    '<div class="stat"><div class="stat-value">' + svcNames.length + '</div><div class="stat-label">Services</div></div>' +
    '<div class="stat"><div class="stat-value">' + allTraces.length + '</div><div class="stat-label">Traces</div></div>' +
    '<div class="stat"><div class="stat-value">' + totalSpans + '</div><div class="stat-label">Spans</div></div>';

  if (allTraces.length === 0) {
    document.getElementById('traces').innerHTML = '<div class="empty-state">No traces captured. The OTLP collector may not have been reachable.</div>';
    return;
  }

  // Filter buttons.
  var activeFilters = new Set(svcNames);
  var filtersEl = document.getElementById('filters');

  function renderFilters() {
    filtersEl.innerHTML = '';
    var allBtn = document.createElement('button');
    allBtn.className = 'filter-btn' + (activeFilters.size === svcNames.length ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.onclick = function() {
      if (activeFilters.size === svcNames.length) {
        activeFilters.clear();
      } else {
        svcNames.forEach(function(n) { activeFilters.add(n); });
      }
      renderFilters();
      renderTraces();
    };
    filtersEl.appendChild(allBtn);

    svcNames.forEach(function(name) {
      var btn = document.createElement('button');
      btn.className = 'filter-btn' + (activeFilters.has(name) ? ' active' : '');
      btn.textContent = name;
      btn.onclick = function() {
        if (activeFilters.has(name)) activeFilters.delete(name);
        else activeFilters.add(name);
        renderFilters();
        renderTraces();
      };
      filtersEl.appendChild(btn);
    });
  }

  function formatDuration(us) {
    if (us < 1000) return us + 'μs';
    if (us < 1000000) return (us / 1000).toFixed(1) + 'ms';
    return (us / 1000000).toFixed(2) + 's';
  }

  function renderTraces() {
    var container = document.getElementById('traces');
    container.innerHTML = '';

    var filtered = allTraces.filter(function(t) { return activeFilters.has(t.svcName); });
    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">No traces match the selected filters.</div>';
      return;
    }

    filtered.forEach(function(item, idx) {
      var t = item.trace;
      var spans = t.spans || [];
      var processes = t.processes || {};
      if (spans.length === 0) return;

      // Find root span and total duration.
      var spanIds = {};
      spans.forEach(function(s) { spanIds[s.spanID] = true; });

      var rootSpan = null;
      spans.forEach(function(s) {
        var refs = s.references || [];
        var hasParentInTrace = refs.some(function(r) {
          return r.refType === 'CHILD_OF' && spanIds[r.spanID];
        });
        if (!hasParentInTrace) {
          if (!rootSpan || s.startTime < rootSpan.startTime) rootSpan = s;
        }
      });
      if (!rootSpan) rootSpan = spans[0];

      var traceStart = Math.min.apply(null, spans.map(function(s) { return s.startTime; }));
      var traceEnd = Math.max.apply(null, spans.map(function(s) { return s.startTime + s.duration; }));
      var totalDuration = traceEnd - traceStart;

      var proc = processes[rootSpan.processID] || {};
      var svcName = proc.serviceName || item.svcName;

      var traceEl = document.createElement('div');
      traceEl.className = 'trace';

      var header = document.createElement('div');
      header.className = 'trace-header';
      header.innerHTML =
        '<span class="trace-toggle"></span>' +
        '<span class="trace-svc ' + (svcColorMap[svcName] || 'svc-0') + '">' + svcName + '</span>' +
        '<span class="trace-name">' + rootSpan.operationName + '</span>' +
        '<span class="trace-meta">' + spans.length + ' spans · ' + formatDuration(totalDuration) + '</span>';
      header.onclick = function() { traceEl.classList.toggle('open'); };

      var body = document.createElement('div');
      body.className = 'trace-body';

      // Build span tree.
      var childMap = {};
      spans.forEach(function(s) {
        var refs = s.references || [];
        refs.forEach(function(r) {
          if (r.refType === 'CHILD_OF' && spanIds[r.spanID]) {
            if (!childMap[r.spanID]) childMap[r.spanID] = [];
            childMap[r.spanID].push(s);
          }
        });
      });

      // DFS to flatten with depth.
      var flatSpans = [];
      function dfs(span, depth) {
        flatSpans.push({ span: span, depth: depth });
        var children = childMap[span.spanID] || [];
        children.sort(function(a, b) { return a.startTime - b.startTime; });
        children.forEach(function(c) { dfs(c, depth + 1); });
      }
      dfs(rootSpan, 0);

      // Also add any orphan spans not reached by DFS.
      var visited = {};
      flatSpans.forEach(function(f) { visited[f.span.spanID] = true; });
      spans.forEach(function(s) {
        if (!visited[s.spanID]) flatSpans.push({ span: s, depth: 0 });
      });

      var wf = document.createElement('div');
      wf.className = 'waterfall';

      flatSpans.forEach(function(item) {
        var s = item.span;
        var depth = item.depth;
        var sProc = processes[s.processID] || {};
        var sSvc = sProc.serviceName || '?';
        var hasError = (s.tags || []).some(function(tag) {
          return tag.key === 'error' && tag.value === true;
        });

        var row = document.createElement('div');
        row.className = 'wf-row';

        var indent = '';
        for (var d = 0; d < depth; d++) indent += '  ';

        var label = document.createElement('div');
        label.className = 'wf-label';
        label.innerHTML = '<span class="indent">' + indent + '</span>' + sSvc + '/' + s.operationName;
        label.title = sSvc + '/' + s.operationName;

        var barArea = document.createElement('div');
        barArea.className = 'wf-bar-area';

        var bar = document.createElement('div');
        var leftPct = totalDuration > 0 ? ((s.startTime - traceStart) / totalDuration * 100) : 0;
        var widthPct = totalDuration > 0 ? (s.duration / totalDuration * 100) : 100;
        bar.className = 'wf-bar ' + (svcColorMap[sSvc] || 'svc-0') + (hasError ? ' error' : '');
        bar.style.left = leftPct + '%';
        bar.style.width = Math.max(widthPct, 0.5) + '%';
        bar.title = formatDuration(s.duration);
        barArea.appendChild(bar);

        var dur = document.createElement('div');
        dur.className = 'wf-duration';
        dur.textContent = formatDuration(s.duration);

        row.appendChild(label);
        row.appendChild(barArea);
        row.appendChild(dur);
        wf.appendChild(row);
      });

      body.appendChild(wf);
      traceEl.appendChild(header);
      traceEl.appendChild(body);
      container.appendChild(traceEl);
    });
  }

  renderFilters();
  renderTraces();

  // Auto-expand first trace.
  var first = document.querySelector('.trace');
  if (first) first.classList.add('open');
})();
</script>
</body>
</html>
VIEWER_BOTTOM

echo "Generated traces.html ($(wc -c < "${REPORT_DIR}/traces.html") bytes)"
