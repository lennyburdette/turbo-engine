#!/usr/bin/env python3
"""enrich-timeline-traces.py — Post-processes scenario timeline reports to embed
matching trace spans from Jaeger.

After the scenario runner generates report.html (with trace_ids on HTTP events)
and k8s-dump-report.sh captures traces.json from Jaeger, this script:

1. Reads each scenario's timeline.json to collect trace IDs from HTTP events
2. Reads traces.json to find matching traces
3. Injects the matched trace data + JavaScript into report.html so that
   HTTP events with traces get an expandable inline waterfall

Usage:
    python3 enrich-timeline-traces.py [--report-dir ci-report]
"""

import json
import os
import sys
from html import escape as html_escape


def main() -> None:
    report_dir = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("REPORT_DIR", "ci-report")
    traces_file = os.path.join(report_dir, "traces.json")
    scenarios_dir = os.path.join(report_dir, "scenarios")

    if not os.path.isfile(traces_file):
        print("No traces.json found — skipping trace enrichment.", file=sys.stderr)
        return

    if not os.path.isdir(scenarios_dir):
        print("No scenarios directory found — skipping.", file=sys.stderr)
        return

    # Load all traces, deduplicating by traceID.
    with open(traces_file) as f:
        traces_data = json.load(f)

    trace_by_id: dict[str, dict] = {}
    for svc_name, svc_data in traces_data.get("services", {}).items():
        for t in svc_data.get("data", []):
            tid = t.get("traceID", "")
            if not tid:
                continue
            existing = trace_by_id.get(tid)
            if not existing or len(t.get("spans", [])) > len(existing.get("spans", [])):
                trace_by_id[tid] = t

    if not trace_by_id:
        print("No traces found in traces.json.", file=sys.stderr)
        return

    print(f"Loaded {len(trace_by_id)} unique traces.", file=sys.stderr)

    # Process each scenario.
    for scenario_name in os.listdir(scenarios_dir):
        scenario_dir = os.path.join(scenarios_dir, scenario_name)
        timeline_file = os.path.join(scenario_dir, "timeline.json")
        report_file = os.path.join(scenario_dir, "report.html")

        if not os.path.isfile(timeline_file) or not os.path.isfile(report_file):
            continue

        with open(timeline_file) as f:
            timeline = json.load(f)

        # Collect trace IDs referenced in HTTP events.
        referenced_ids: set[str] = set()
        for ev in timeline.get("events", []):
            tid = ev.get("trace_id", "")
            if tid:
                referenced_ids.add(tid)

        if not referenced_ids:
            print(f"  {scenario_name}: no trace IDs in timeline, skipping.", file=sys.stderr)
            continue

        # Build a subset of trace data matching our events.
        matched: dict[str, dict] = {}
        for tid in referenced_ids:
            if tid in trace_by_id:
                matched[tid] = trace_by_id[tid]

        print(f"  {scenario_name}: {len(referenced_ids)} trace IDs, {len(matched)} matched in Jaeger.", file=sys.stderr)

        if not matched:
            continue

        # Inject into report.html: add <script> before </body>.
        with open(report_file) as f:
            html = f.read()

        # Build the injection: trace data + rendering JS.
        injection = build_trace_injection(matched)

        if "</body>" in html:
            html = html.replace("</body>", injection + "\n</body>", 1)
        else:
            html += injection

        with open(report_file, "w") as f:
            f.write(html)

        print(f"  {scenario_name}: injected {len(matched)} traces into report.html.", file=sys.stderr)


def build_trace_injection(traces: dict[str, dict]) -> str:
    """Build the <script> block that contains trace data and waterfall rendering."""
    # Minify: strip logs/process tags to keep payload small.
    compact: dict[str, dict] = {}
    for tid, t in traces.items():
        compact[tid] = {
            "traceID": t["traceID"],
            "spans": [
                {
                    "spanID": s["spanID"],
                    "traceID": s["traceID"],
                    "operationName": s["operationName"],
                    "startTime": s["startTime"],
                    "duration": s["duration"],
                    "processID": s.get("processID", ""),
                    "references": s.get("references", []),
                    "tags": s.get("tags", []),
                    "logs": s.get("logs", []),
                }
                for s in t.get("spans", [])
            ],
            "processes": t.get("processes", {}),
        }

    trace_json = json.dumps(compact, separators=(",", ":"))

    return f"""<script>
var INLINE_TRACES = {trace_json};
{TRACE_WATERFALL_JS}
</script>"""


# JavaScript for inline trace waterfalls in the timeline.
TRACE_WATERFALL_JS = r"""
(function() {
  if (!INLINE_TRACES || Object.keys(INLINE_TRACES).length === 0) return;

  // Utility functions.
  function esc(s) {
    var d = document.createElement('div'); d.textContent = s; return d.innerHTML;
  }
  function fmtDur(us) {
    if (us < 1000) return us + '\u03bcs';
    if (us < 1000000) return (us / 1000).toFixed(1) + 'ms';
    return (us / 1000000).toFixed(2) + 's';
  }
  function fmtTime(us) {
    var d = new Date(us / 1000);
    return d.toISOString().replace('T', ' ').replace('Z', '');
  }

  // Service color palette.
  var svcColors = {};
  var colorIdx = 0;
  var palette = [
    '#0366d6','#28a745','#6f42c1','#d73a49','#e36209','#005cc5'
  ];
  var paletteDark = [
    '#58a6ff','#3fb950','#bc8cff','#f85149','#f0883e','#79c0ff'
  ];
  var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function svcColor(name) {
    if (!(name in svcColors)) {
      svcColors[name] = colorIdx % 6;
      colorIdx++;
    }
    return (isDark ? paletteDark : palette)[svcColors[name]];
  }

  // Inject CSS for trace panels.
  var style = document.createElement('style');
  style.textContent = [
    '.tl-trace-btn { cursor:pointer; color:var(--link); font-size:11px; margin-left:4px; text-decoration:underline; }',
    '.tl-trace-panel { grid-column:2; padding:8px 12px; border:1px solid var(--accent,var(--link)); border-radius:6px; margin:2px 0 6px 12px; background:var(--bg-code); overflow-x:auto; }',
    '.tl-trace-panel .tp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }',
    '.tl-trace-panel .tp-header h4 { margin:0; font-size:13px; }',
    '.tl-trace-panel .tp-close { background:none; border:1px solid var(--border); border-radius:4px; color:var(--fg-muted); cursor:pointer; padding:1px 6px; font-size:11px; }',
    '.tl-trace-panel .tp-close:hover { background:var(--border); }',
    '.tp-wf-row { display:flex; align-items:center; border-top:1px solid var(--border); font-size:11px; min-height:22px; cursor:pointer; }',
    '.tp-wf-row:first-child { border-top:none; }',
    '.tp-wf-row:hover { background:var(--border); }',
    '.tp-wf-row.selected { outline:2px solid var(--link); outline-offset:-2px; }',
    '.tp-wf-label { min-width:140px; max-width:240px; padding:1px 6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:SFMono-Regular,Consolas,monospace; flex-shrink:0; }',
    '.tp-wf-label .indent { color:var(--fg-muted); }',
    '.tp-wf-bar-area { flex:1; min-width:120px; position:relative; height:22px; }',
    '.tp-wf-bar { position:absolute; top:4px; height:14px; border-radius:2px; min-width:2px; opacity:0.85; }',
    '.tp-wf-bar:hover { opacity:1; }',
    '.tp-wf-bar.error { background:var(--fail) !important; }',
    '.tp-wf-dur { font-size:10px; color:var(--fg-muted); padding:1px 4px; white-space:nowrap; flex-shrink:0; min-width:50px; text-align:right; }',
    '.tp-detail { border:1px solid var(--border); border-radius:4px; margin:4px 0; padding:8px; font-size:12px; background:var(--bg); }',
    '.tp-detail table { width:100%; display:table; border-collapse:collapse; font-size:12px; margin:4px 0; }',
    '.tp-detail th, .tp-detail td { border:1px solid var(--border); padding:3px 6px; text-align:left; white-space:normal; word-break:break-all; }',
    '.tp-detail th { background:var(--bg-code); font-weight:600; width:100px; }',
    '.tp-detail-section { margin-top:8px; }',
    '.tp-detail-section h5 { margin:0 0 2px; font-size:11px; color:var(--fg-muted); text-transform:uppercase; }',
    '.tp-tag-error { color:var(--fail); font-weight:600; }',
    '.tp-event { background:var(--bg-code); border:1px solid var(--border); border-radius:3px; padding:3px 6px; margin:2px 0; font-size:11px; font-family:SFMono-Regular,Consolas,monospace; }',
    '.tp-event-time { color:var(--fg-muted); }',
  ].join('\n');
  document.head.appendChild(style);

  // Find all HTTP event divs with data-trace-id attributes.
  var httpDivs = document.querySelectorAll('.tl-event.tl-http[data-trace-id]');
  httpDivs.forEach(function(div) {
    var traceId = div.getAttribute('data-trace-id');
    var traceData = INLINE_TRACES[traceId];
    if (!traceData) return;
    addTraceButton(div, traceData, traceId);
  });

  function addTraceButton(httpDiv, traceData, traceId) {
    var spans = traceData.spans || [];
    if (spans.length === 0) return;

    var btn = document.createElement('span');
    btn.className = 'tl-trace-btn';
    btn.textContent = spans.length + ' spans';
    btn.title = 'Click to expand trace ' + traceId.substring(0, 12);
    httpDiv.appendChild(btn);

    btn.addEventListener('click', function(e) {
      e.stopPropagation();

      // Toggle: if panel already exists, remove it.
      var existing = httpDiv.parentElement.querySelector('.tl-trace-panel[data-trace="' + traceId + '"]');
      if (existing) {
        existing.remove();
        return;
      }

      // Remove any other open trace panel in the timeline.
      var old = document.querySelectorAll('.tl-trace-panel');
      old.forEach(function(p) { p.remove(); });

      var panel = buildTracePanel(traceData, traceId);
      // Insert after the http div's grid row (need to insert after the next tl-epoch).
      var next = httpDiv.nextElementSibling;
      // The grid structure: tl-epoch | tl-event.  We want to insert a new
      // row spanning the event column.  Insert a pair: empty epoch + panel.
      var epochPlaceholder = document.createElement('div');
      epochPlaceholder.className = 'tl-epoch';
      epochPlaceholder.setAttribute('data-trace-epoch', traceId);

      if (httpDiv.parentElement) {
        // Insert after httpDiv in the grid.
        var ref = httpDiv.nextElementSibling;
        httpDiv.parentElement.insertBefore(panel, ref);
        httpDiv.parentElement.insertBefore(epochPlaceholder, panel);
      }
    });
  }

  function buildTracePanel(traceData, traceId) {
    var spans = traceData.spans || [];
    var processes = traceData.processes || {};

    // Find root span.
    var spanIds = {};
    spans.forEach(function(s) { spanIds[s.spanID] = true; });
    var rootSpan = null;
    spans.forEach(function(s) {
      var refs = s.references || [];
      var hasParent = refs.some(function(r) { return r.refType === 'CHILD_OF' && spanIds[r.spanID]; });
      if (!hasParent) {
        if (!rootSpan || s.startTime < rootSpan.startTime) rootSpan = s;
      }
    });
    if (!rootSpan && spans.length) rootSpan = spans[0];

    var traceStart = Math.min.apply(null, spans.map(function(s) { return s.startTime; }));
    var traceEnd = Math.max.apply(null, spans.map(function(s) { return s.startTime + s.duration; }));
    var totalDuration = traceEnd - traceStart;

    // Build span tree and flatten via DFS.
    var childMap = {};
    spans.forEach(function(s) {
      (s.references || []).forEach(function(r) {
        if (r.refType === 'CHILD_OF' && spanIds[r.spanID]) {
          if (!childMap[r.spanID]) childMap[r.spanID] = [];
          childMap[r.spanID].push(s);
        }
      });
    });

    var flat = [];
    function dfs(span, depth) {
      flat.push({ span: span, depth: depth });
      var children = childMap[span.spanID] || [];
      children.sort(function(a, b) { return a.startTime - b.startTime; });
      children.forEach(function(c) { dfs(c, depth + 1); });
    }
    if (rootSpan) dfs(rootSpan, 0);
    var visited = {};
    flat.forEach(function(f) { visited[f.span.spanID] = true; });
    spans.forEach(function(s) {
      if (!visited[s.spanID]) flat.push({ span: s, depth: 0 });
    });

    // Build panel DOM.
    var panel = document.createElement('div');
    panel.className = 'tl-event tl-trace-panel';
    panel.setAttribute('data-trace', traceId);

    // Header.
    var hdr = document.createElement('div');
    hdr.className = 'tp-header';
    var rootProc = processes[(rootSpan || {}).processID] || {};
    hdr.innerHTML = '<h4>Trace: ' + esc((rootProc.serviceName || '?') + ' / ' + ((rootSpan || {}).operationName || '?')) + ' <span style="color:var(--fg-muted);font-weight:400;font-size:11px">(' + fmtDur(totalDuration) + ', ' + spans.length + ' spans)</span></h4>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'tp-close';
    closeBtn.textContent = '\u2715';
    closeBtn.onclick = function(e) {
      e.stopPropagation();
      var epochEl = panel.previousElementSibling;
      if (epochEl && epochEl.getAttribute('data-trace-epoch') === traceId) epochEl.remove();
      panel.remove();
    };
    hdr.appendChild(closeBtn);
    panel.appendChild(hdr);

    // Waterfall rows.
    var wf = document.createElement('div');
    var detailContainer = document.createElement('div');

    flat.forEach(function(item) {
      var s = item.span;
      var depth = item.depth;
      var sProc = processes[s.processID] || {};
      var sSvc = sProc.serviceName || '?';
      var hasError = (s.tags || []).some(function(tag) { return tag.key === 'error' && tag.value === true; });

      var row = document.createElement('div');
      row.className = 'tp-wf-row';

      var indent = '';
      for (var d = 0; d < depth; d++) indent += '\u00a0\u00a0';

      var label = document.createElement('div');
      label.className = 'tp-wf-label';
      label.innerHTML = '<span class="indent">' + indent + '</span>' + esc(sSvc) + '/' + esc(s.operationName);
      label.title = sSvc + '/' + s.operationName;

      var barArea = document.createElement('div');
      barArea.className = 'tp-wf-bar-area';
      var bar = document.createElement('div');
      var leftPct = totalDuration > 0 ? ((s.startTime - traceStart) / totalDuration * 100) : 0;
      var widthPct = totalDuration > 0 ? (s.duration / totalDuration * 100) : 100;
      bar.className = 'tp-wf-bar' + (hasError ? ' error' : '');
      bar.style.left = leftPct + '%';
      bar.style.width = Math.max(widthPct, 1) + '%';
      bar.style.background = hasError ? '' : svcColor(sSvc);
      bar.title = fmtDur(s.duration);
      barArea.appendChild(bar);

      var dur = document.createElement('div');
      dur.className = 'tp-wf-dur';
      dur.textContent = fmtDur(s.duration);

      row.appendChild(label);
      row.appendChild(barArea);
      row.appendChild(dur);

      // Click to show span detail.
      (function(span, rowEl) {
        rowEl.onclick = function(e) {
          e.stopPropagation();
          var wasSelected = rowEl.classList.contains('selected');
          // Deselect all.
          wf.querySelectorAll('.tp-wf-row.selected').forEach(function(r) { r.classList.remove('selected'); });
          detailContainer.innerHTML = '';
          if (wasSelected) return;

          rowEl.classList.add('selected');
          detailContainer.appendChild(buildSpanDetail(span, processes, traceStart));
        };
      })(s, row);

      wf.appendChild(row);
    });

    panel.appendChild(wf);
    panel.appendChild(detailContainer);
    return panel;
  }

  function buildSpanDetail(span, processes, traceStart) {
    var proc = processes[span.processID] || {};
    var svc = proc.serviceName || '?';
    var tags = span.tags || [];
    var logs = span.logs || [];

    var el = document.createElement('div');
    el.className = 'tp-detail';

    var rows = [
      ['Service', esc(svc)],
      ['Operation', esc(span.operationName)],
      ['Span ID', '<code>' + esc(span.spanID) + '</code>'],
      ['Trace ID', '<code>' + esc(span.traceID) + '</code>'],
      ['Start', fmtTime(span.startTime)],
      ['Duration', fmtDur(span.duration)],
      ['Offset', '+' + fmtDur(span.startTime - traceStart)]
    ];
    var html = '<table><tbody>';
    rows.forEach(function(r) { html += '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>'; });
    html += '</tbody></table>';

    if (tags.length > 0) {
      html += '<div class="tp-detail-section"><h5>Tags (' + tags.length + ')</h5>';
      html += '<table><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
      tags.forEach(function(tag) {
        var cls = (tag.key === 'error' && tag.value === true) ? ' class="tp-tag-error"' : '';
        html += '<tr><td' + cls + '>' + esc(tag.key) + '</td><td' + cls + '>' + esc(String(tag.value)) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    if (logs.length > 0) {
      html += '<div class="tp-detail-section"><h5>Events (' + logs.length + ')</h5>';
      logs.forEach(function(log) {
        var offsetUs = log.timestamp - span.startTime;
        html += '<div class="tp-event"><span class="tp-event-time">+' + fmtDur(offsetUs) + '</span> ';
        (log.fields || []).forEach(function(f) {
          html += esc(f.key) + '=' + esc(String(f.value)) + ' ';
        });
        html += '</div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;
    return el;
  }
})();
"""


if __name__ == "__main__":
    main()
