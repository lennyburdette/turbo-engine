#!/usr/bin/env python3
"""k8s-run-scenario.py — Executes a single E2E scenario against the Turbo Engine
platform running in Kubernetes.

Reads a scenario JSON file and performs:
  1. Publish packages via the registry API
  2. Create an environment via the environment manager API
  3. Trigger and poll a build via the builder API
  4. Reconcile components via the operator API
  5. Wait for K8s pods to become available (via kubectl)
  6. Execute HTTP requests with assertions

The script outputs a JSON results array to stdout.  All diagnostic output goes
to stderr so the caller can capture results cleanly.

Usage:
    python3 k8s-run-scenario.py <scenario.json> \\
        --registry-port 18081 \\
        --builder-port 18082 \\
        --envmanager-port 18083 \\
        --operator-port 18084 \\
        --gateway-port 18080 \\
        --namespace turbo-engine-e2e

The caller (k8s-e2e-tests.sh) is responsible for:
  - Setting up the K8s cluster and deploying the control plane
  - Port-forwarding control plane services
  - Port-forwarding the gateway
  - Cleaning up resources after the scenario

Exit code:
  0 — all tests passed
  1 — one or more tests failed
  2 — scenario could not be loaded / infrastructure error
"""

import argparse
import contextlib
import json
import os
import re
import secrets
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html import escape as html_escape
from typing import Any, Generator


# ---------------------------------------------------------------------------
# Shared HTML template (self-contained, no Jekyll dependency)
# ---------------------------------------------------------------------------
REPORT_CSS = """\
:root {
  --bg: #fff; --fg: #24292e; --fg-muted: #586069;
  --border: #e1e4e8; --bg-code: #f6f8fa; --link: #0366d6;
  --pass: #22863a; --fail: #cb2431;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117; --fg: #c9d1d9; --fg-muted: #8b949e;
    --border: #30363d; --bg-code: #161b22; --link: #58a6ff;
    --pass: #3fb950; --fail: #f85149;
  }
}
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
               Arial, sans-serif;
  font-size: 15px; line-height: 1.5; color: var(--fg);
  background: var(--bg); margin: 0; padding: 16px;
  max-width: 100vw; overflow-x: hidden;
}
.container { max-width: 900px; margin: 0 auto; }
h1 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
h2 { font-size: 1.25em; margin-top: 1.5em; }
h3 { font-size: 1.1em; }
a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; }
pre {
  background: var(--bg-code); border: 1px solid var(--border);
  border-radius: 6px; padding: 12px; overflow-x: auto;
  font-size: 13px; line-height: 1.4; max-width: 100%;
}
code {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.9em;
}
p code, li code, td code {
  background: var(--bg-code); padding: 2px 6px; border-radius: 3px;
}
table {
  border-collapse: collapse; width: 100%; font-size: 14px;
  margin: 12px 0; overflow-x: auto; display: block;
}
th, td {
  border: 1px solid var(--border); padding: 6px 10px;
  text-align: left; white-space: nowrap;
}
th { background: var(--bg-code); font-weight: 600; }
details { margin: 8px 0; }
summary { cursor: pointer; font-weight: 600; }
hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
.breadcrumb { font-size: 13px; color: var(--fg-muted); margin-bottom: 8px; }
.breadcrumb a { color: var(--fg-muted); }
.pass { color: var(--pass); font-weight: 600; }
.fail { color: var(--fail); font-weight: 600; }
img { max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: 6px; margin: 8px 0; }
blockquote { border-left: 3px solid var(--border); margin: 8px 0; padding: 4px 12px; color: var(--fg-muted); }
.log-line { border-bottom: 1px solid var(--border); padding: 3px 0; font-size: 13px; font-family: SFMono-Regular, Consolas, monospace; display: flex; flex-wrap: wrap; gap: 4px; align-items: baseline; }
.log-line:last-child { border-bottom: none; }
.log-time { color: var(--fg-muted); font-size: 11px; flex-shrink: 0; }
.log-level { font-size: 11px; font-weight: 600; padding: 0 4px; border-radius: 3px; flex-shrink: 0; }
.log-level-info { color: var(--pass); }
.log-level-warn { color: #b08800; }
.log-level-error { color: var(--fail); }
.log-level-debug { color: var(--fg-muted); }
.log-msg { font-weight: 500; }
.log-meta { color: var(--fg-muted); font-size: 12px; }
.log-meta-key { color: var(--fg-muted); }
.log-meta-val { color: var(--fg); }
.log-raw { font-size: 13px; font-family: SFMono-Regular, Consolas, monospace; white-space: pre-wrap; word-break: break-all; }
.log-container { background: var(--bg-code); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; overflow-x: auto; max-width: 100%; }

/* Timeline layout */
.tl { display: grid; grid-template-columns: 52px 1fr; font-size: 13px; }
.tl-epoch {
  color: var(--fg-muted); font-size: 11px; font-family: SFMono-Regular, Consolas, monospace;
  text-align: right; padding: 2px 8px 2px 0; border-right: 2px solid var(--border);
  white-space: nowrap; user-select: none;
}
.tl-epoch-dot { position: relative; }
.tl-epoch-dot::after {
  content: ''; position: absolute; right: -5px; top: 8px;
  width: 8px; height: 8px; border-radius: 50%; background: var(--border);
}
.tl-event { padding: 2px 0 2px 12px; min-height: 22px; }

/* Landmark headers */
.tl-landmark {
  padding: 8px 0 4px 12px; font-weight: 600; font-size: 14px;
  display: flex; align-items: center; gap: 8px; cursor: pointer;
}
.tl-landmark-toggle { font-size: 10px; color: var(--fg-muted); }
.tl-landmark-name { text-transform: uppercase; letter-spacing: 0.5px; }
.tl-landmark-dur { color: var(--fg-muted); font-weight: 400; font-size: 12px; }
.tl-landmark-badge { font-size: 11px; margin-left: auto; padding: 1px 6px; border-radius: 3px; }
.tl-lm-pass .tl-epoch-dot::after { background: var(--pass); }
.tl-lm-fail .tl-epoch-dot::after { background: var(--fail); }

/* Event type icons */
.tl-icon { display: inline-block; width: 18px; text-align: center; flex-shrink: 0; }
.tl-test { display: flex; align-items: baseline; gap: 4px; }
.tl-test-detail { color: var(--fg-muted); }
.tl-test-dur { color: var(--fg-muted); font-size: 11px; }
.tl-http { color: var(--fg-muted); font-family: SFMono-Regular, Consolas, monospace; font-size: 12px; }
.tl-http-status { font-weight: 600; }
.tl-http-ok { color: var(--pass); }
.tl-http-err { color: var(--fail); }
.tl-info-msg { color: var(--fg-muted); }
.tl-warn-msg { color: #b08800; }
.tl-k8s { color: var(--fg-muted); font-size: 12px; }
.tl-k8s-obj { font-weight: 500; color: var(--fg); }
.tl-screenshot { display: flex; align-items: center; gap: 8px; }
.tl-screenshot img {
  max-width: 120px; height: auto; border: 1px solid var(--border);
  border-radius: 4px; cursor: pointer; transition: max-width 0.2s;
}
.tl-screenshot img:hover { max-width: 300px; }
.tl-screenshot-label { font-weight: 500; }
.tl-log-entry { font-size: 12px; font-family: SFMono-Regular, Consolas, monospace; }
.tl-gap { height: 8px; }
"""


def html_page(title: str, body: str, breadcrumbs: list[tuple[str, str]] | None = None) -> str:
    """Wrap body HTML in a full self-contained page."""
    bc = ""
    if breadcrumbs:
        links = " / ".join(
            f'<a href="{html_escape(href)}">{html_escape(label)}</a>'
            for label, href in breadcrumbs
        )
        bc = f'<nav class="breadcrumb">{links}</nav>\n'
    return (
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
        "  <meta charset=\"utf-8\">\n"
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
        f"  <title>{html_escape(title)}</title>\n"
        f"  <style>{REPORT_CSS}</style>\n"
        "</head>\n<body>\n<div class=\"container\">\n"
        f"{bc}{body}"
        "</div>\n</body>\n</html>\n"
    )


# Known message/metadata keys in JSON logs (order matters for display).
_LOG_MSG_KEYS = {"msg", "message"}
_LOG_META_KEYS = {"time", "ts", "timestamp", "level", "lvl", "msg", "message"}


def _render_log_line_html(line: str) -> str:
    """Render a single log line.  If it's JSON, show structured output;
    otherwise fall back to plain escaped text."""
    stripped = line.strip()
    if not stripped:
        return ""
    try:
        obj = json.loads(stripped)
        if not isinstance(obj, dict):
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        return f'<div class="log-raw">{html_escape(stripped)}</div>\n'

    parts: list[str] = []

    # Time
    ts = obj.get("time") or obj.get("ts") or obj.get("timestamp") or ""
    if ts:
        # Trim nanosecond precision and trailing Z for readability
        ts_str = str(ts)
        if "T" in ts_str:
            ts_str = ts_str.split("T", 1)[1].rstrip("Z")
            # Truncate sub-second to 3 digits
            if "." in ts_str:
                base, frac = ts_str.split(".", 1)
                ts_str = f"{base}.{frac[:3]}"
        parts.append(f'<span class="log-time">{html_escape(ts_str)}</span>')

    # Level
    level = str(obj.get("level") or obj.get("lvl") or "").upper()
    if level:
        lcls = "info"
        if level in ("WARN", "WARNING"):
            lcls = "warn"
        elif level in ("ERROR", "ERR", "FATAL", "PANIC"):
            lcls = "error"
        elif level in ("DEBUG", "TRACE"):
            lcls = "debug"
        parts.append(f'<span class="log-level log-level-{lcls}">{html_escape(level)}</span>')

    # Message
    msg = ""
    for k in _LOG_MSG_KEYS:
        if k in obj:
            msg = str(obj[k])
            break
    if msg:
        parts.append(f'<span class="log-msg">{html_escape(msg)}</span>')

    # Remaining metadata keys
    meta_parts: list[str] = []
    for k, v in obj.items():
        if k in _LOG_META_KEYS:
            continue
        sv = str(v) if not isinstance(v, str) else v
        if len(sv) > 80:
            sv = sv[:77] + "..."
        meta_parts.append(
            f'<span class="log-meta-key">{html_escape(k)}</span>='
            f'<span class="log-meta-val">{html_escape(sv)}</span>'
        )
    if meta_parts:
        parts.append('<span class="log-meta">' + " ".join(meta_parts) + "</span>")

    return '<div class="log-line">' + " ".join(parts) + "</div>\n"


def render_logs_html(log_content: str) -> str:
    """Render a block of log lines — structured for JSON, raw otherwise."""
    lines = log_content.split("\n")
    # Quick check: if any line parses as JSON, use structured rendering
    has_json = False
    for line in lines[:5]:
        stripped = line.strip()
        if stripped and stripped.startswith("{"):
            try:
                json.loads(stripped)
                has_json = True
                break
            except json.JSONDecodeError:
                pass
    if not has_json:
        return f'<pre><code>{html_escape(log_content)}</code></pre>\n'
    out: list[str] = ['<div class="log-container">\n']
    for line in lines:
        rendered = _render_log_line_html(line)
        if rendered:
            out.append(rendered)
    out.append("</div>\n")
    return "".join(out)


# ---------------------------------------------------------------------------
# Logging helpers (all output to stderr)
# ---------------------------------------------------------------------------
CYAN = "\033[0;36m"
GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[0;33m"
RESET = "\033[0m"


def info(msg: str) -> None:
    print(f"{CYAN}[INFO]{RESET}  {msg}", file=sys.stderr)


def ok(msg: str) -> None:
    print(f"{GREEN}[PASS]{RESET}  {msg}", file=sys.stderr)


def fail(msg: str) -> None:
    print(f"{RED}[FAIL]{RESET}  {msg}", file=sys.stderr)


def warn(msg: str) -> None:
    print(f"{YELLOW}[WARN]{RESET}  {msg}", file=sys.stderr)


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------
def http_request(
    url: str,
    method: str = "GET",
    body: dict | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 30,
) -> tuple[int, Any]:
    """Make an HTTP request and return (status_code, parsed_json_or_text)."""
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)

    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw
    except Exception as e:
        warn(f"HTTP error: {e}")
        return 0, str(e)


# ---------------------------------------------------------------------------
# JSON path helper
# ---------------------------------------------------------------------------
def json_path_get(obj: Any, path: str) -> Any:
    """Navigate a dotted path like 'result.pet.name' through nested dicts/lists."""
    parts = path.split(".")
    current = obj
    for part in parts:
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list) and part.isdigit():
            idx = int(part)
            current = current[idx] if idx < len(current) else None
        else:
            return None
        if current is None:
            return None
    return current


# ---------------------------------------------------------------------------
# Assertion checker
# ---------------------------------------------------------------------------
def check_assertion(
    assertion: dict, status_code: int, body: Any
) -> tuple[bool, str]:
    """Check a single assertion against the response.  Returns (passed, detail)."""
    atype = assertion["type"]

    if atype == "status":
        expected = assertion["expect"]
        if status_code == expected:
            return True, f"HTTP {status_code}"
        return False, f"expected HTTP {expected}, got {status_code}"

    if atype == "json_field":
        field = assertion["field"]
        expected = assertion["expect"]
        actual = body.get(field) if isinstance(body, dict) else None
        # Allow int/string comparison (e.g., 200 == "200")
        if str(actual) == str(expected):
            return True, f"{field}={actual}"
        return False, f"{field}: expected {expected!r}, got {actual!r}"

    if atype == "json_path":
        path = assertion["path"]
        expected = assertion.get("expect")
        expect_type = assertion.get("expect_type")
        value = json_path_get(body, path)

        if expect_type == "array_min_length":
            min_len = assertion.get("value", 1)
            if isinstance(value, list) and len(value) >= min_len:
                return True, f"{path} has {len(value)} items (>= {min_len})"
            actual_len = len(value) if isinstance(value, list) else 0
            return False, f"{path}: expected >= {min_len} items, got {actual_len}"

        if expected is not None:
            if str(value) == str(expected):
                return True, f"{path}={value}"
            return False, f"{path}: expected {expected!r}, got {value!r}"

        # Just check existence
        if value is not None:
            return True, f"{path} exists"
        return False, f"{path} is missing"

    return False, f"unknown assertion type: {atype}"


# ---------------------------------------------------------------------------
# kubectl helper
# ---------------------------------------------------------------------------
def kubectl(namespace: str, *args: str, timeout: int = 60) -> tuple[int, str]:
    """Run a kubectl command and return (exit_code, stdout)."""
    cmd = ["kubectl", "-n", namespace] + list(args)
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout
        )
        return result.returncode, result.stdout.strip()
    except subprocess.TimeoutExpired:
        return 1, "kubectl timed out"
    except FileNotFoundError:
        return 1, "kubectl not found"


# ---------------------------------------------------------------------------
# Scenario execution
# ---------------------------------------------------------------------------
class ScenarioRunner:
    def __init__(self, scenario: dict, args: argparse.Namespace):
        self.scenario = scenario
        self.name = scenario["name"]
        self.args = args
        self.results: list[dict] = []
        self.pass_count = 0
        self.fail_count = 0
        self.env_id = ""
        self.build_id = ""
        self.component_ports: dict[str, int] = {}
        self._pf_procs: list[subprocess.Popen] = []
        self._next_port = 19000

        # Timeline: flat list of timestamped events.
        self._epoch_mono_ms = time.monotonic_ns() // 1_000_000
        self._epoch_wall = datetime.now(timezone.utc)
        self.timeline: list[dict] = []
        self._current_landmark: str = ""

    # -- Timeline helpers ---------------------------------------------------

    def _now_ms(self) -> int:
        """Milliseconds elapsed since scenario start."""
        return time.monotonic_ns() // 1_000_000 - self._epoch_mono_ms

    def _emit(self, etype: str, data: dict | None = None) -> None:
        """Append a timestamped event to the timeline."""
        self.timeline.append({
            "t": self._now_ms(),
            "type": etype,
            "landmark": self._current_landmark,
            **(data or {}),
        })

    @contextlib.contextmanager
    def _landmark(self, name: str) -> Generator[None, None, None]:
        """Context manager that emits landmark-start / landmark-end events."""
        self._current_landmark = name
        self._emit("landmark-start", {"name": name})
        try:
            yield
        finally:
            self._emit("landmark-end", {"name": name})
            self._current_landmark = ""

    def _base_url(self, service: str) -> str:
        ports = {
            "registry": self.args.registry_port,
            "builder": self.args.builder_port,
            "envmanager": self.args.envmanager_port,
            "operator": self.args.operator_port,
            "gateway": self.args.gateway_port,
        }
        return f"http://localhost:{ports[service]}"

    def _record(self, name: str, passed: bool, detail: str, duration_ms: int) -> None:
        status = "pass" if passed else "fail"
        prefixed_name = f"{self.name}/{name}"
        self.results.append(
            {
                "name": prefixed_name,
                "status": status,
                "detail": detail,
                "duration_ms": duration_ms,
            }
        )
        self._emit("test", {
            "name": name, "status": status, "detail": detail,
            "duration_ms": duration_ms,
        })
        if passed:
            ok(f"{prefixed_name}: {detail}")
            self.pass_count += 1
        else:
            fail(f"{prefixed_name}: {detail}")
            self.fail_count += 1

    def _emit_http(self, method: str, url: str, status: int, duration_ms: int,
                   trace_id: str = "") -> None:
        """Emit an HTTP request/response event to the timeline."""
        # Shorten URL for display: keep path only
        path = url.split("//", 1)[-1].split("/", 1)[-1] if "//" in url else url
        data: dict[str, Any] = {
            "method": method, "url": f"/{path}", "status": status,
            "duration_ms": duration_ms,
        }
        if trace_id:
            data["trace_id"] = trace_id
        self._emit("http", data)

    @staticmethod
    def _make_traceparent() -> tuple[str, str]:
        """Generate a W3C traceparent header. Returns (header_value, trace_id)."""
        trace_id = secrets.token_hex(16)  # 32 hex chars
        span_id = secrets.token_hex(8)    # 16 hex chars
        return f"00-{trace_id}-{span_id}-01", trace_id

    def _traced_request(
        self, url: str, method: str = "GET",
        body: dict | None = None,
        headers: dict[str, str] | None = None,
        timeout: int = 30,
    ) -> tuple[int, Any, str]:
        """Like http_request() but injects a traceparent and returns the trace_id."""
        hdrs = dict(headers) if headers else {}
        # Don't override an explicit traceparent (e.g. trace-propagation test).
        if "traceparent" in hdrs:
            # Extract the trace_id from the existing header.
            parts = hdrs["traceparent"].split("-")
            trace_id = parts[1] if len(parts) >= 3 else ""
        else:
            traceparent, trace_id = self._make_traceparent()
            hdrs["traceparent"] = traceparent
        status, resp_body = http_request(url, method=method, body=body,
                                         headers=hdrs, timeout=timeout)
        return status, resp_body, trace_id

    def _port_forward_component(self, component_name: str) -> int:
        """Set up a port-forward to a component service and return the local port."""
        if component_name in self.component_ports:
            return self.component_ports[component_name]

        local_port = self._next_port
        self._next_port += 1
        svc_name = f"svc-{component_name}"

        proc = subprocess.Popen(
            [
                "kubectl", "-n", self.args.namespace,
                "port-forward", f"svc/{svc_name}", f"{local_port}:8080",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        self._pf_procs.append(proc)
        self.component_ports[component_name] = local_port
        time.sleep(2)
        return local_port

    def cleanup(self) -> None:
        for proc in self._pf_procs:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except Exception:
                proc.kill()

    # -- Step runners -------------------------------------------------------

    def publish_packages(self) -> bool:
        """Publish all packages defined in the scenario."""
        all_ok = True
        with self._landmark("publish"):
            for pkg in self.scenario["packages"]:
                t0 = time.monotonic_ns() // 1_000_000
                payload = {
                    "package": {
                        "name": pkg["name"],
                        "kind": pkg["kind"],
                        "version": pkg["version"],
                        "schema": pkg.get("schema", "{}"),
                        "dependencies": pkg.get("dependencies", []),
                    }
                }
                if "upstream_url" in pkg:
                    payload["package"]["upstreamConfig"] = {"url": pkg["upstream_url"]}

                url = f"{self._base_url('registry')}/v1/packages"
                status, body, trace_id = self._traced_request(url, method="POST", body=payload)
                duration = time.monotonic_ns() // 1_000_000 - t0
                self._emit_http("POST", url, status, duration, trace_id=trace_id)

                if status in (200, 201):
                    self._record(
                        f"publish-{pkg['name']}",
                        True,
                        f"Published {pkg['name']}@{pkg['version']} (HTTP {status})",
                        duration,
                    )
                else:
                    self._record(
                        f"publish-{pkg['name']}",
                        False,
                        f"HTTP {status}",
                        duration,
                    )
                    all_ok = False
        return all_ok

    def create_environment(self) -> bool:
        with self._landmark("environment"):
            env_cfg = self.scenario["environment"]
            t0 = time.monotonic_ns() // 1_000_000
            payload = {
                "name": env_cfg["name"],
                "baseRootPackage": env_cfg["root_package"],
                "baseRootVersion": env_cfg["root_version"],
                "branch": env_cfg["branch"],
                "createdBy": "k8s-e2e-scenario",
            }
            url = f"{self._base_url('envmanager')}/v1/environments"
            status, body, trace_id = self._traced_request(url, method="POST", body=payload)
            duration = time.monotonic_ns() // 1_000_000 - t0
            self._emit_http("POST", url, status, duration, trace_id=trace_id)

            if status in (200, 201):
                self.env_id = body.get("id", env_cfg["name"]) if isinstance(body, dict) else env_cfg["name"]
                self._record("create-environment", True, f"Created {self.env_id}", duration)
                return True
            self.env_id = env_cfg["name"]
            self._record("create-environment", False, f"HTTP {status}", duration)
            return False

    def trigger_and_poll_build(self) -> bool:
        with self._landmark("build"):
            env_cfg = self.scenario["environment"]
            t0 = time.monotonic_ns() // 1_000_000

            payload = {
                "environmentId": self.env_id,
                "rootPackageName": env_cfg["root_package"],
                "rootPackageVersion": env_cfg["root_version"],
            }
            url = f"{self._base_url('builder')}/v1/builds"
            status, body, trace_id = self._traced_request(url, method="POST", body=payload)
            duration = time.monotonic_ns() // 1_000_000 - t0
            self._emit_http("POST", url, status, duration, trace_id=trace_id)

            if status not in (200, 201, 202):
                self._record("trigger-build", False, f"HTTP {status}", duration)
                return False

            self.build_id = body.get("id", "unknown") if isinstance(body, dict) else "unknown"
            self._record("trigger-build", True, f"Build {self.build_id} triggered", duration)

            # Poll build status
            t0 = time.monotonic_ns() // 1_000_000
            deadline = time.time() + 90
            build_status = "unknown"
            poll_count = 0
            while time.time() < deadline:
                poll_url = f"{self._base_url('builder')}/v1/builds/{self.build_id}"
                poll_status, poll_body = http_request(poll_url, method="GET")
                poll_count += 1
                build_status = poll_body.get("status", "unknown") if isinstance(poll_body, dict) else "unknown"
                self._emit("info", {"msg": f"Build poll #{poll_count}: {build_status}"})
                if build_status in ("succeeded", "completed", "failed"):
                    break
                time.sleep(3)

            duration = time.monotonic_ns() // 1_000_000 - t0
            if build_status in ("succeeded", "completed"):
                self._record("build-status", True, f"Build {self.build_id} succeeded", duration)
                return True
            self._record("build-status", False, f"Build status: {build_status}", duration)
            return False

    def reconcile(self) -> bool:
        with self._landmark("reconcile"):
            t0 = time.monotonic_ns() // 1_000_000

            components = []
            for comp in self.scenario["components"]:
                c = {
                    "packageName": comp["package_name"],
                    "packageVersion": comp["package_version"],
                    "kind": comp["kind"],
                    "artifactHash": f"{comp['package_name']}-hash",
                    "runtime": {
                        "replicas": comp.get("replicas", 1),
                        "image": comp["image"],
                        "resources": {"cpuRequest": "50m", "memoryRequest": "64Mi"},
                    },
                }
                if comp.get("env"):
                    c["runtime"]["env"] = comp["env"]
                components.append(c)

            ingress_cfg = self.scenario.get("ingress", {})
            routes = []
            for r in ingress_cfg.get("routes", []):
                routes.append({
                    "path": r["path"],
                    "targetComponent": r["component"],
                    "targetPort": r["port"],
                })

            payload = {
                "spec": {
                    "environmentId": self.env_id,
                    "buildId": self.build_id,
                    "rootPackage": self.scenario["environment"]["root_package"],
                    "components": components,
                    "ingress": {
                        "host": ingress_cfg.get("host", "localhost"),
                        "routes": routes,
                    },
                }
            }

            url = f"{self._base_url('operator')}/v1/reconcile"
            status, body, trace_id = self._traced_request(url, method="POST", body=payload)
            duration = time.monotonic_ns() // 1_000_000 - t0
            self._emit_http("POST", url, status, duration, trace_id=trace_id)

            if status == 200:
                self._emit("info", {"msg": "Waiting 5s for operator to settle..."})
                time.sleep(5)  # Give operator time to create resources
                self._record("operator-reconcile", True, f"Reconciled {len(components)} components", duration)
                return True
            detail = body if isinstance(body, str) else json.dumps(body)[:200]
            self._record("operator-reconcile", False, f"HTTP {status}: {detail}", duration)
            return False

    def verify_k8s_resources(self) -> bool:
        with self._landmark("k8s-resources"):
            t0 = time.monotonic_ns() // 1_000_000
            all_ok = True
            for comp in self.scenario["components"]:
                name = comp["package_name"]
                for resource in [f"deployment/deploy-{name}", f"service/svc-{name}", f"configmap/cm-{name}"]:
                    rc, _ = kubectl(self.args.namespace, "get", resource)
                    if rc != 0:
                        warn(f"  Missing {resource}")
                        self._emit("info", {"msg": f"Missing: {resource}", "level": "warn"})
                        all_ok = False
                    else:
                        info(f"  Found {resource}")
                        self._emit("info", {"msg": f"Found: {resource}"})

            duration = time.monotonic_ns() // 1_000_000 - t0
            count = len(self.scenario["components"]) * 3
            self._record(
                "verify-k8s-resources",
                all_ok,
                f"{'All' if all_ok else 'Some'} {count} resources {'created' if all_ok else 'missing'}",
                duration,
            )
            return all_ok

    def wait_for_pods(self) -> bool:
        with self._landmark("pods"):
            t0 = time.monotonic_ns() // 1_000_000
            all_ok = True
            for comp in self.scenario["components"]:
                name = comp["package_name"]
                self._emit("info", {"msg": f"Waiting for deploy-{name}..."})
                rc, _ = kubectl(
                    self.args.namespace,
                    "wait", "--for=condition=available", f"deployment/deploy-{name}", "--timeout=60s",
                )
                if rc != 0:
                    warn(f"  deploy-{name} did not become available")
                    self._emit("info", {"msg": f"deploy-{name} not available", "level": "warn"})
                    all_ok = False
                else:
                    self._emit("info", {"msg": f"deploy-{name} available"})

            duration = time.monotonic_ns() // 1_000_000 - t0
            self._record("pods-running", all_ok, "All pods running" if all_ok else "Some pods not available", duration)
            return all_ok

    def wait_for_gateway_routes(self) -> bool:
        """Poll the gateway until ingress routes are active."""
        with self._landmark("gateway"):
            probe_req = None
            for req in self.scenario.get("requests", []):
                if req.get("via", "gateway") == "gateway":
                    probe_req = req
                    break
            if probe_req is None:
                return True

            probe_path = probe_req["path"]
            probe_method = probe_req.get("method", "GET")
            probe_url = f"{self._base_url('gateway')}{probe_path}"

            t0 = time.monotonic_ns() // 1_000_000
            info(f"  Waiting for gateway route {probe_path} to become active...")

            deadline = time.time() + 45
            last_code = 0
            attempt = 0
            while time.time() < deadline:
                attempt += 1
                status, _, gw_trace_id = self._traced_request(probe_url, method=probe_method, timeout=5)
                last_code = status
                self._emit_http(probe_method, probe_url, status, 0, trace_id=gw_trace_id)
                if status != 404:
                    duration = time.monotonic_ns() // 1_000_000 - t0
                    self._record("gateway-routing", True, f"Gateway route {probe_path} active (HTTP {status})", duration)
                    return True
                self._emit("info", {"msg": f"Route not ready (attempt {attempt}, HTTP 404), retrying..."})
                time.sleep(5)

            duration = time.monotonic_ns() // 1_000_000 - t0
            self._record("gateway-routing", False, f"Route {probe_path} not ready after 45s (HTTP {last_code})", duration)
            return False

    def run_requests(self) -> None:
        """Execute the scenario's HTTP requests with assertions."""
        with self._landmark("requests"):
            for req in self.scenario.get("requests", []):
                t0 = time.monotonic_ns() // 1_000_000
                req_name = req["name"]
                method = req.get("method", "GET")
                path = req["path"]
                via = req.get("via", "gateway")
                extra_headers = req.get("headers", {})

                if via == "gateway":
                    base = self._base_url("gateway")
                elif via.startswith("component:"):
                    comp_name = via.split(":", 1)[1]
                    port = self._port_forward_component(comp_name)
                    base = f"http://localhost:{port}"
                else:
                    base = self._base_url(via)

                url = f"{base}{path}"
                info(f"  {method} {url}")

                status_code, body, req_trace_id = self._traced_request(
                    url, method=method,
                    headers=extra_headers if extra_headers else None,
                )
                duration = time.monotonic_ns() // 1_000_000 - t0
                self._emit_http(method, url, status_code, duration, trace_id=req_trace_id)

                all_passed = True
                details = []
                for assertion in req.get("assertions", []):
                    passed, detail = check_assertion(assertion, status_code, body)
                    details.append(detail)
                    if not passed:
                        all_passed = False

                self._record(req_name, all_passed, "; ".join(details), duration)

    def capture_screenshots(self) -> None:
        """Capture screenshots defined in the scenario using Playwright."""
        screenshots = self.scenario.get("screenshots", [])
        if not screenshots:
            return

        self._current_landmark = "screenshots"
        self._emit("landmark-start", {"name": "screenshots"})

        report_dir = os.environ.get("REPORT_DIR", "ci-report")
        screenshot_dir = os.path.join(report_dir, "screenshots", self.name)
        os.makedirs(screenshot_dir, exist_ok=True)

        # Check if Playwright is available.
        node_path = os.environ.get("NODE_PATH", "")
        try:
            subprocess.run(
                ["node", "-e", "require('playwright')"],
                capture_output=True, timeout=10,
                env={**os.environ, "NODE_PATH": node_path} if node_path else None,
            )
        except Exception:
            warn("Playwright not available; skipping screenshots")
            self._emit("landmark-end", {"name": "screenshots"})
            self._current_landmark = ""
            return

        console_url = os.environ.get("CONSOLE_URL", "http://localhost:13000")
        explorer_url = os.environ.get("EXPLORER_URL", "http://localhost:13001")
        registry_url = os.environ.get("REGISTRY_URL", "")
        builder_url = os.environ.get("BUILDER_URL", "")
        envmanager_url = os.environ.get("ENVMANAGER_URL", "")
        gateway_url = os.environ.get("GATEWAY_URL", "")
        jaeger_url = os.environ.get("JAEGER_URL", "")

        # Build API route interception JS.
        api_routes = []
        if registry_url:
            api_routes.append(f"    ['/api/registry', '{registry_url}']")
        if builder_url:
            api_routes.append(f"    ['/api/builder', '{builder_url}']")
        if envmanager_url:
            api_routes.append(f"    ['/api/envmanager', '{envmanager_url}']")
        if gateway_url:
            api_routes.append(f"    ['/api/gateway', '{gateway_url}']")
        if jaeger_url:
            api_routes.append(f"    ['/api/jaeger', '{jaeger_url}']")

        if api_routes:
            route_js = (
                "  const apiRoutes = [\n"
                + ",\n".join(api_routes) + "\n"
                "  ];\n"
                "  for (const [prefix, target] of apiRoutes) {\n"
                "    await page.route('**' + prefix + '/**', async (route) => {\n"
                "      const url = new URL(route.request().url());\n"
                "      const newPath = url.pathname.replace(prefix, '') + url.search;\n"
                "      try {\n"
                "        const resp = await route.fetch({ url: target + newPath });\n"
                "        await route.fulfill({ response: resp });\n"
                "      } catch (e) { await route.abort(); }\n"
                "    });\n"
                "  }\n"
            )
        else:
            route_js = "  // No backend URLs configured.\n"

        for ss in screenshots:
            name = ss["name"]
            ui = ss.get("ui", "console")
            path = ss.get("path", "/")
            is_mobile = ui == "explorer"
            base_url = explorer_url if is_mobile else console_url
            url = f"{base_url}{path}"
            output_path = os.path.join(screenshot_dir, f"{name}.png")
            log_path = os.path.join(screenshot_dir, f"{name}.log")

            info(f"  Screenshot: {name} ({url})")

            if is_mobile:
                browser_setup = (
                    "  const context = await browser.newContext({\n"
                    "    viewport: { width: 390, height: 844 },\n"
                    "    deviceScaleFactor: 3,\n"
                    "    isMobile: true,\n"
                    "    hasTouch: true,\n"
                    "    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',\n"
                    "  });\n"
                    "  const page = await context.newPage();\n"
                )
                screenshot_opts = "{ path: OUTPUT, fullPage: false }"
            else:
                browser_setup = (
                    "  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });\n"
                )
                screenshot_opts = "{ path: OUTPUT, fullPage: true }"

            script = (
                "const { chromium } = require('playwright');\n"
                "const fs = require('fs');\n"
                "const OUTPUT = " + json.dumps(output_path) + ";\n"
                "const LOG_OUTPUT = " + json.dumps(log_path) + ";\n"
                "(async () => {\n"
                "  const consoleLogs = [];\n"
                "  const browser = await chromium.launch({ headless: true });\n"
                + browser_setup +
                "  page.on('console', msg => consoleLogs.push('[' + msg.type() + '] ' + msg.text()));\n"
                "  page.on('pageerror', err => consoleLogs.push('[PAGE-ERROR] ' + err.message));\n"
                "  page.on('requestfailed', req => consoleLogs.push('[REQ-FAILED] ' + req.url()));\n"
                + route_js +
                "  try {\n"
                f"    await page.goto({json.dumps(url)}, {{ waitUntil: 'networkidle', timeout: 30000 }});\n"
                "    await page.waitForTimeout(3000);\n"
                f"    await page.screenshot({screenshot_opts});\n"
                "  } catch (err) {\n"
                "    consoleLogs.push('[CAPTURE-ERROR] ' + err.message);\n"
                "    process.exitCode = 1;\n"
                "  } finally {\n"
                "    if (consoleLogs.length > 0) fs.writeFileSync(LOG_OUTPUT, consoleLogs.join('\\n') + '\\n');\n"
                "    await browser.close();\n"
                "  }\n"
                "})();\n"
            )

            tmp_path = f"/tmp/pw-scenario-{self.name}-{name}.js"
            with open(tmp_path, "w") as f:
                f.write(script)

            env = {**os.environ}
            if node_path:
                env["NODE_PATH"] = node_path

            try:
                result = subprocess.run(
                    ["node", tmp_path],
                    capture_output=True, text=True, timeout=60, env=env,
                )
                if result.returncode == 0:
                    ok(f"  Screenshot saved: {output_path}")
                    self._emit("screenshot", {
                        "name": name, "ui": ui, "path": path,
                        "description": ss.get("description", name),
                        "img_src": f"../../screenshots/{self.name}/{name}.png",
                    })
                else:
                    warn(f"  Screenshot failed: {result.stderr[:200]}")
                    self._emit("info", {"msg": f"Screenshot {name} failed", "level": "warn"})
            except subprocess.TimeoutExpired:
                warn(f"  Screenshot timed out: {name}")
                self._emit("info", {"msg": f"Screenshot {name} timed out", "level": "warn"})
            finally:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

        self._emit("landmark-end", {"name": "screenshots"})
        self._current_landmark = ""

    def capture_logs(self) -> None:
        """Dump pod logs to the report directory."""
        with self._landmark("logs"):
            report_dir = os.environ.get("REPORT_DIR", "ci-report")
            k8s_dir = os.path.join(report_dir, "k8s")
            os.makedirs(k8s_dir, exist_ok=True)

            for comp in self.scenario["components"]:
                name = comp["package_name"]
                rc, pod_name = kubectl(
                    self.args.namespace,
                    "get", "pods",
                    "-l", f"app.kubernetes.io/name={name}",
                    "-o", "jsonpath={.items[0].metadata.name}",
                )
                if rc == 0 and pod_name:
                    _, logs = kubectl(self.args.namespace, "logs", pod_name, "--tail=50")
                    log_file = os.path.join(k8s_dir, f"{self.name}-{name}-logs.txt")
                    with open(log_file, "w") as f:
                        f.write(logs)
                    self._emit("info", {"msg": f"Captured {name} logs ({logs.count(chr(10)) + 1} lines)"})

    # -- Main entry point ---------------------------------------------------

    def run(self) -> dict:
        """Execute the full scenario and return the aggregated results."""
        info(f"=== Scenario: {self.name} ===")
        info(f"  {self.scenario.get('description', '')}")

        try:
            if not self.publish_packages():
                warn("Package publishing had failures; continuing anyway")

            if not self.create_environment():
                warn("Environment creation failed; continuing anyway")

            if not self.trigger_and_poll_build():
                warn("Build failed; continuing anyway")

            if not self.reconcile():
                warn("Reconciliation failed; skipping pod/request tests")
                return self._build_output()

            resources_ok = self.verify_k8s_resources()

            if resources_ok:
                pods_ok = self.wait_for_pods()
            else:
                self._record("pods-running", False, "Skipped — resources missing", 0)
                pods_ok = False

            if pods_ok:
                # Wait for gateway routes before running requests that go via gateway.
                has_gateway_requests = any(
                    r.get("via", "gateway") == "gateway"
                    for r in self.scenario.get("requests", [])
                )
                gateway_ok = True
                if has_gateway_requests:
                    gateway_ok = self.wait_for_gateway_routes()

                self.run_requests()
            else:
                for req in self.scenario.get("requests", []):
                    self._record(req["name"], False, "Skipped — pods not running", 0)

            # Capture screenshots after requests (so UIs reflect scenario state).
            self.capture_screenshots()
            self.capture_logs()
            self.generate_report()
            self.generate_timeline_html()
        finally:
            self.cleanup()

        return self._build_output()

    def generate_report(self) -> None:
        """Write a concise per-scenario report.md."""
        report_dir = os.environ.get("REPORT_DIR", "ci-report")
        scenario_dir = os.path.join(report_dir, "scenarios", self.name)
        os.makedirs(scenario_dir, exist_ok=True)

        lines: list[str] = []

        # --- Banner ---
        total = self.pass_count + self.fail_count
        if self.fail_count == 0:
            lines.append(f"# {self.name}: ALL {total} TESTS PASSED\n")
        else:
            lines.append(f"# {self.name}: {self.fail_count} FAILED ({self.pass_count}/{total} passed)\n")

        desc = self.scenario.get("description", "")
        if desc:
            lines.append(f"> {desc}\n")
        lines.append("")

        # --- Test results table ---
        lines.append("## Test Results\n")
        lines.append("| Test | Result | Detail | Time |")
        lines.append("|------|--------|--------|------|")
        for r in self.results:
            short_name = r["name"].split("/", 1)[-1]
            icon = "PASS" if r["status"] == "pass" else "**FAIL**"
            dur = f"{r['duration_ms']}ms" if r["duration_ms"] else "-"
            lines.append(f"| {short_name} | {icon} | {r['detail']} | {dur} |")
        lines.append("")

        # --- Screenshots (inline images) ---
        screenshot_dir = os.path.join(report_dir, "screenshots", self.name)
        screenshots = self.scenario.get("screenshots", [])
        has_screenshots = False
        for ss in screenshots:
            png = os.path.join(screenshot_dir, f"{ss['name']}.png")
            if os.path.isfile(png):
                has_screenshots = True
                break

        if has_screenshots:
            lines.append("## Screenshots\n")
            for ss in screenshots:
                name = ss["name"]
                png = os.path.join(screenshot_dir, f"{name}.png")
                if not os.path.isfile(png):
                    continue
                desc_text = ss.get("description", name)
                # Relative path: scenarios/{name}/ → ../../screenshots/{name}/
                lines.append(f"### {desc_text}\n")
                lines.append(f"![{name}](../../screenshots/{self.name}/{name}.png)\n")

                # Console log (collapsed)
                logfile = os.path.join(screenshot_dir, f"{name}.log")
                if os.path.isfile(logfile):
                    with open(logfile) as lf:
                        content = lf.read().strip()
                    if content:
                        linecount = content.count("\n") + 1
                        lines.append(f"<details><summary>Browser console ({linecount} lines)</summary>\n")
                        lines.append(f"```\n{content}\n```\n")
                        lines.append("</details>\n")
                lines.append("")

        # --- Component logs (collapsed, only errors highlighted) ---
        k8s_dir = os.path.join(report_dir, "k8s")
        comp_logs: list[tuple[str, str]] = []
        for comp in self.scenario.get("components", []):
            name = comp["package_name"]
            log_file = os.path.join(k8s_dir, f"{self.name}-{name}-logs.txt")
            if os.path.isfile(log_file):
                with open(log_file) as f:
                    comp_logs.append((name, f.read().strip()))

        if comp_logs:
            has_errors = False
            error_lines: list[str] = []
            for comp_name, log_content in comp_logs:
                for line in log_content.split("\n"):
                    low = line.lower()
                    if any(kw in low for kw in ['"error"', "panic", "fatal"]):
                        if not has_errors:
                            error_lines.append("## Errors\n")
                            has_errors = True
                        error_lines.append(f"**{comp_name}**: `{line.strip()[:200]}`\n")

            if has_errors:
                lines.extend(error_lines)
                lines.append("")

            lines.append("## Component Logs\n")
            for comp_name, log_content in comp_logs:
                linecount = log_content.count("\n") + 1 if log_content else 0
                lines.append(f"<details><summary>{comp_name} ({linecount} lines)</summary>\n")
                lines.append(f"```\n{log_content}\n```\n")
                lines.append("</details>\n")
            lines.append("")

        report_path = os.path.join(scenario_dir, "report.md")
        with open(report_path, "w") as f:
            f.write("\n".join(lines))
        ok(f"Scenario report: {report_path}")

    def generate_html_report(self) -> None:
        """Write a self-contained per-scenario report.html (no Jekyll)."""
        report_dir = os.environ.get("REPORT_DIR", "ci-report")
        scenario_dir = os.path.join(report_dir, "scenarios", self.name)
        os.makedirs(scenario_dir, exist_ok=True)

        h: list[str] = []

        # --- Banner ---
        total = self.pass_count + self.fail_count
        if self.fail_count == 0:
            h.append(f'<h1><span class="pass">ALL {total} TESTS PASSED</span> &mdash; {html_escape(self.name)}</h1>\n')
        else:
            h.append(f'<h1><span class="fail">{self.fail_count} FAILED</span> ({self.pass_count}/{total} passed) &mdash; {html_escape(self.name)}</h1>\n')

        desc = self.scenario.get("description", "")
        if desc:
            h.append(f"<blockquote>{html_escape(desc)}</blockquote>\n")

        # --- Test results table ---
        h.append("<h2>Test Results</h2>\n")
        h.append("<table>\n<thead><tr><th>Test</th><th>Result</th><th>Detail</th><th>Time</th></tr></thead>\n<tbody>\n")
        for r in self.results:
            short_name = r["name"].split("/", 1)[-1]
            if r["status"] == "pass":
                icon = '<span class="pass">PASS</span>'
            else:
                icon = '<span class="fail">FAIL</span>'
            dur = f"{r['duration_ms']}ms" if r["duration_ms"] else "-"
            h.append(f"<tr><td>{html_escape(short_name)}</td><td>{icon}</td>"
                      f"<td>{html_escape(r['detail'])}</td><td>{dur}</td></tr>\n")
        h.append("</tbody></table>\n")

        # --- Screenshots ---
        screenshot_dir = os.path.join(report_dir, "screenshots", self.name)
        screenshots = self.scenario.get("screenshots", [])
        has_screenshots = any(
            os.path.isfile(os.path.join(screenshot_dir, f"{ss['name']}.png"))
            for ss in screenshots
        )

        if has_screenshots:
            h.append("<h2>Screenshots</h2>\n")
            for ss in screenshots:
                name = ss["name"]
                png = os.path.join(screenshot_dir, f"{name}.png")
                if not os.path.isfile(png):
                    continue
                desc_text = ss.get("description", name)
                # Path from scenarios/{name}/ up to report root, then into screenshots/
                img_src = f"../../screenshots/{self.name}/{name}.png"
                h.append(f"<h3>{html_escape(desc_text)}</h3>\n")
                h.append(f'<img src="{html_escape(img_src)}" alt="{html_escape(name)}">\n')

                logfile = os.path.join(screenshot_dir, f"{name}.log")
                if os.path.isfile(logfile):
                    with open(logfile) as lf:
                        content = lf.read().strip()
                    if content:
                        linecount = content.count("\n") + 1
                        h.append(f"<details><summary>Browser console ({linecount} lines)</summary>\n")
                        h.append(f"<pre><code>{html_escape(content)}</code></pre>\n")
                        h.append("</details>\n")

        # --- Errors ---
        k8s_dir = os.path.join(report_dir, "k8s")
        comp_logs: list[tuple[str, str]] = []
        for comp in self.scenario.get("components", []):
            name = comp["package_name"]
            log_file = os.path.join(k8s_dir, f"{self.name}-{name}-logs.txt")
            if os.path.isfile(log_file):
                with open(log_file) as f:
                    comp_logs.append((name, f.read().strip()))

        if comp_logs:
            error_html: list[str] = []
            for comp_name, log_content in comp_logs:
                for line in log_content.split("\n"):
                    low = line.lower()
                    if any(kw in low for kw in ['"error"', "panic", "fatal"]):
                        if not error_html:
                            error_html.append("<h2>Errors</h2>\n")
                        error_html.append(f"<p><strong>{html_escape(comp_name)}</strong>: "
                                          f"<code>{html_escape(line.strip()[:200])}</code></p>\n")
            h.extend(error_html)

            # --- Component logs ---
            h.append("<h2>Component Logs</h2>\n")
            for comp_name, log_content in comp_logs:
                linecount = log_content.count("\n") + 1 if log_content else 0
                h.append(f"<details><summary>{html_escape(comp_name)} ({linecount} lines)</summary>\n")
                h.append(render_logs_html(log_content))
                h.append("</details>\n")

        body = "".join(h)
        page = html_page(
            title=f"Scenario: {self.name}",
            body=body,
            breadcrumbs=[("Report", "../../")],
        )

        html_path = os.path.join(scenario_dir, "report.html")
        with open(html_path, "w") as f:
            f.write(page)
        ok(f"Scenario HTML report: {html_path}")

    def _backfill_k8s_events(self) -> None:
        """Parse K8s events and component logs, inserting them into the timeline
        at approximate positions based on timestamps."""
        report_dir = os.environ.get("REPORT_DIR", "ci-report")
        k8s_dir = os.path.join(report_dir, "k8s")
        events_file = os.path.join(k8s_dir, "events.txt")

        # Determine which landmarks span which time ranges.
        landmarks: dict[str, tuple[int, int]] = {}
        for ev in self.timeline:
            if ev["type"] == "landmark-start":
                landmarks[ev["name"]] = (ev["t"], 0)
            elif ev["type"] == "landmark-end" and ev["name"] in landmarks:
                start, _ = landmarks[ev["name"]]
                landmarks[ev["name"]] = (start, ev["t"])

        # Find the best landmark for an event at a given time offset.
        def best_landmark(t_ms: int) -> str:
            for name, (start, end) in landmarks.items():
                if start <= t_ms <= end:
                    return name
            # Fall back to the landmark with the closest end time.
            closest = ""
            closest_dist = float("inf")
            for name, (start, end) in landmarks.items():
                dist = abs(t_ms - (start + end) / 2)
                if dist < closest_dist:
                    closest = name
                    closest_dist = dist
            return closest

        # --- K8s events (relative timestamps like "94s", "2m3s") ---
        if os.path.isfile(events_file):
            # The events file was captured at a known wall-clock time.
            # We can figure out the scenario end time and work backwards.
            scenario_end_ms = max((ev["t"] for ev in self.timeline), default=0)
            try:
                with open(events_file) as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("LAST SEEN"):
                            continue
                        # Parse: "94s   Normal   Scheduled   pod/foo   message"
                        parts = line.split(None, 4)
                        if len(parts) < 5:
                            continue
                        age_str, event_type, reason, obj, message = parts
                        # Parse age string (e.g. "94s", "2m3s", "5m")
                        age_s = 0
                        m = re.findall(r"(\d+)([smh])", age_str)
                        for val, unit in m:
                            if unit == "s":
                                age_s += int(val)
                            elif unit == "m":
                                age_s += int(val) * 60
                            elif unit == "h":
                                age_s += int(val) * 3600
                        if age_s == 0 and not m:
                            continue
                        # Approximate: event happened (age_s) seconds before capture.
                        # Capture ~ scenario end. Convert to ms offset from epoch.
                        t_ms = max(0, scenario_end_ms - age_s * 1000)
                        lm = best_landmark(t_ms)
                        self.timeline.append({
                            "t": t_ms,
                            "type": "k8s-event",
                            "landmark": lm,
                            "reason": reason,
                            "object": obj,
                            "message": message.strip(),
                        })
            except Exception:
                pass  # Non-critical

        # --- Component log lines (JSON with "time" field) ---
        for comp in self.scenario.get("components", []):
            comp_name = comp["package_name"]
            log_file = os.path.join(k8s_dir, f"{self.name}-{comp_name}-logs.txt")
            if not os.path.isfile(log_file):
                continue
            try:
                with open(log_file) as f:
                    for line in f:
                        stripped = line.strip()
                        if not stripped or not stripped.startswith("{"):
                            continue
                        try:
                            obj = json.loads(stripped)
                        except json.JSONDecodeError:
                            continue
                        ts = obj.get("time") or obj.get("ts") or obj.get("timestamp")
                        if not ts or not isinstance(ts, str) or "T" not in ts:
                            continue
                        # Parse ISO timestamp, compute offset from epoch.
                        try:
                            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                            offset_ms = int((dt - self._epoch_wall).total_seconds() * 1000)
                            if offset_ms < 0:
                                offset_ms = 0
                        except (ValueError, TypeError):
                            continue
                        lm = best_landmark(offset_ms)
                        level = str(obj.get("level") or obj.get("lvl") or "").upper()
                        msg = obj.get("msg") or obj.get("message") or ""
                        # Only include interesting log lines (avoid noise)
                        if level in ("ERROR", "ERR", "FATAL", "PANIC", "WARN", "WARNING"):
                            pass  # always include
                        elif any(kw in str(msg).lower() for kw in ["start", "listen", "reload", "ready", "fail", "connect"]):
                            pass  # include notable events
                        else:
                            continue
                        self.timeline.append({
                            "t": offset_ms,
                            "type": "log",
                            "landmark": lm,
                            "component": comp_name,
                            "level": level,
                            "msg": str(msg)[:120],
                        })
            except Exception:
                pass  # Non-critical

        # Re-sort timeline by time.
        self.timeline.sort(key=lambda e: e["t"])

    def generate_timeline_html(self) -> None:
        """Generate a timeline-based HTML report showing all events chronologically."""
        report_dir = os.environ.get("REPORT_DIR", "ci-report")
        scenario_dir = os.path.join(report_dir, "scenarios", self.name)
        os.makedirs(scenario_dir, exist_ok=True)

        # Backfill external events before rendering.
        self._backfill_k8s_events()

        # Write timeline.json
        timeline_path = os.path.join(scenario_dir, "timeline.json")
        with open(timeline_path, "w") as f:
            json.dump({"epoch": self._epoch_wall.isoformat(), "events": self.timeline}, f)

        # Group events by landmark.
        landmark_order: list[str] = []
        landmark_events: dict[str, list[dict]] = {}
        landmark_times: dict[str, tuple[int, int]] = {}

        for ev in self.timeline:
            if ev["type"] == "landmark-start":
                name = ev["name"]
                if name not in landmark_events:
                    landmark_order.append(name)
                    landmark_events[name] = []
                    landmark_times[name] = (ev["t"], ev["t"])
            elif ev["type"] == "landmark-end":
                name = ev["name"]
                if name in landmark_times:
                    start, _ = landmark_times[name]
                    landmark_times[name] = (start, ev["t"])
            else:
                lm = ev.get("landmark", "")
                if lm and lm not in landmark_events:
                    landmark_order.append(lm)
                    landmark_events[lm] = []
                    landmark_times[lm] = (ev["t"], ev["t"])
                if lm:
                    landmark_events[lm].append(ev)

        # Compute per-landmark pass/fail.
        landmark_status: dict[str, str] = {}
        for lm, events in landmark_events.items():
            tests = [e for e in events if e["type"] == "test"]
            if not tests:
                landmark_status[lm] = ""
            elif all(t["status"] == "pass" for t in tests):
                landmark_status[lm] = "pass"
            else:
                landmark_status[lm] = "fail"

        h: list[str] = []

        # --- Banner ---
        total = self.pass_count + self.fail_count
        if self.fail_count == 0:
            h.append(f'<h1><span class="pass">ALL {total} TESTS PASSED</span>'
                      f' &mdash; {html_escape(self.name)}</h1>\n')
        else:
            h.append(f'<h1><span class="fail">{self.fail_count} FAILED</span>'
                      f' ({self.pass_count}/{total} passed)'
                      f' &mdash; {html_escape(self.name)}</h1>\n')

        desc = self.scenario.get("description", "")
        if desc:
            h.append(f"<blockquote>{html_escape(desc)}</blockquote>\n")

        # Summary stats
        total_dur = max((ev["t"] for ev in self.timeline), default=0)
        ss_count = sum(1 for ev in self.timeline if ev["type"] == "screenshot")
        k8s_count = sum(1 for ev in self.timeline if ev["type"] == "k8s-event")
        h.append(f'<p style="color:var(--fg-muted);font-size:13px">'
                  f'Total: {total_dur / 1000:.1f}s &middot; '
                  f'{total} tests &middot; '
                  f'{ss_count} screenshots &middot; '
                  f'{k8s_count} K8s events</p>\n')

        # --- Timeline ---
        h.append('<div class="tl">\n')

        def fmt_epoch(ms: int) -> str:
            """Format ms offset as +Xs or +M:SS."""
            s = ms / 1000
            if s < 60:
                return f"+{s:.1f}s"
            m = int(s) // 60
            sec = s - m * 60
            return f"+{m}:{sec:04.1f}"

        last_epoch_sec = -1  # Track the last displayed second to avoid repeats

        for lm_name in landmark_order:
            events = landmark_events.get(lm_name, [])
            start_t, end_t = landmark_times.get(lm_name, (0, 0))
            dur_ms = end_t - start_t
            status = landmark_status.get(lm_name, "")

            # Landmark header row
            epoch_sec = int(start_t / 1000)
            epoch_cls = "tl-epoch tl-epoch-dot"
            if status == "pass":
                epoch_cls += " tl-lm-pass"
            elif status == "fail":
                epoch_cls += " tl-lm-fail"
            h.append(f'<div class="{epoch_cls}">{fmt_epoch(start_t)}</div>\n')

            badge = ""
            if status == "pass":
                badge = '<span class="tl-landmark-badge pass">PASS</span>'
            elif status == "fail":
                badge = '<span class="tl-landmark-badge fail">FAIL</span>'

            dur_label = ""
            if dur_ms >= 1:
                if dur_ms < 1000:
                    dur_label = f"{dur_ms}ms"
                else:
                    dur_label = f"{dur_ms / 1000:.1f}s"

            h.append(f'<div class="tl-landmark">'
                      f'<span class="tl-landmark-name">{html_escape(lm_name)}</span>'
                      f'<span class="tl-landmark-dur">({dur_label})</span>'
                      f'{badge}</div>\n')

            last_epoch_sec = epoch_sec

            # Event rows
            for ev in events:
                ev_sec = int(ev["t"] / 1000)
                if ev_sec != last_epoch_sec:
                    epoch_display = fmt_epoch(ev["t"])
                    last_epoch_sec = ev_sec
                else:
                    epoch_display = ""

                h.append(f'<div class="tl-epoch">{epoch_display}</div>\n')

                etype = ev["type"]
                if etype == "test":
                    icon = '<span class="pass">&#10003;</span>' if ev["status"] == "pass" else '<span class="fail">&#10007;</span>'
                    dur_s = f' <span class="tl-test-dur">({ev["duration_ms"]}ms)</span>' if ev.get("duration_ms") else ""
                    h.append(f'<div class="tl-event tl-test">'
                              f'<span class="tl-icon">{icon}</span>'
                              f'<span>{html_escape(ev["name"])}</span>'
                              f'<span class="tl-test-detail">{html_escape(ev["detail"])}</span>'
                              f'{dur_s}</div>\n')

                elif etype == "http":
                    status_code = ev.get("status", 0)
                    ok_cls = "tl-http-ok" if 200 <= status_code < 400 else "tl-http-err"
                    dur_s = f" ({ev['duration_ms']}ms)" if ev.get("duration_ms") else ""
                    trace_attr = ""
                    if ev.get("trace_id"):
                        trace_attr = f' data-trace-id="{html_escape(ev["trace_id"])}"'
                    h.append(f'<div class="tl-event tl-http"{trace_attr}>'
                              f'<span class="tl-icon">&rarr;</span>'
                              f'{html_escape(ev.get("method", ""))} {html_escape(ev.get("url", ""))}'
                              f' <span class="tl-http-status {ok_cls}">{status_code}</span>'
                              f'{dur_s}</div>\n')

                elif etype == "screenshot":
                    img_src = html_escape(ev.get("img_src", ""))
                    desc_text = html_escape(ev.get("description", ev.get("name", "")))
                    h.append(f'<div class="tl-event tl-screenshot">'
                              f'<span class="tl-icon">&#128248;</span>'
                              f'<span class="tl-screenshot-label">{desc_text}</span>'
                              f'</div>\n')
                    if img_src:
                        h.append(f'<div class="tl-epoch"></div>\n')
                        h.append(f'<div class="tl-event">'
                                  f'<img src="{img_src}" alt="{html_escape(ev.get("name", ""))}"'
                                  f' style="max-width:200px;margin:4px 0 4px 26px"></div>\n')

                elif etype == "k8s-event":
                    obj_name = html_escape(ev.get("object", ""))
                    msg = html_escape(ev.get("message", ""))
                    reason = html_escape(ev.get("reason", ""))
                    h.append(f'<div class="tl-event tl-k8s">'
                              f'<span class="tl-icon">&#9881;</span>'
                              f'<span class="tl-k8s-obj">{obj_name}</span> '
                              f'{reason}: {msg}</div>\n')

                elif etype == "log":
                    level = ev.get("level", "")
                    comp = html_escape(ev.get("component", ""))
                    msg = html_escape(ev.get("msg", ""))
                    lcls = "log-level-info"
                    if level in ("ERROR", "ERR", "FATAL", "PANIC"):
                        lcls = "log-level-error"
                    elif level in ("WARN", "WARNING"):
                        lcls = "log-level-warn"
                    h.append(f'<div class="tl-event tl-log-entry">'
                              f'<span class="tl-icon">&#128203;</span>'
                              f'<span class="log-level {lcls}">{html_escape(level)}</span> '
                              f'<strong>{comp}</strong>: {msg}</div>\n')

                elif etype == "info":
                    msg = html_escape(ev.get("msg", ""))
                    level = ev.get("level", "")
                    if level == "warn":
                        h.append(f'<div class="tl-event tl-warn-msg">'
                                  f'<span class="tl-icon">&#9888;</span>{msg}</div>\n')
                    else:
                        h.append(f'<div class="tl-event tl-info-msg">'
                                  f'<span class="tl-icon">&#8505;</span>{msg}</div>\n')

            # Gap between landmarks
            h.append('<div class="tl-epoch"></div><div class="tl-gap"></div>\n')

        h.append('</div>\n')  # Close .tl

        # --- Component logs (full, collapsible, at the bottom) ---
        k8s_dir = os.path.join(report_dir, "k8s")
        comp_logs: list[tuple[str, str]] = []
        for comp in self.scenario.get("components", []):
            name = comp["package_name"]
            log_file = os.path.join(k8s_dir, f"{self.name}-{name}-logs.txt")
            if os.path.isfile(log_file):
                with open(log_file) as f:
                    comp_logs.append((name, f.read().strip()))

        if comp_logs:
            h.append("<h2>Component Logs</h2>\n")
            for comp_name, log_content in comp_logs:
                linecount = log_content.count("\n") + 1 if log_content else 0
                h.append(f"<details><summary>{html_escape(comp_name)} ({linecount} lines)</summary>\n")
                h.append(render_logs_html(log_content))
                h.append("</details>\n")

        body = "".join(h)
        page = html_page(
            title=f"Scenario: {self.name}",
            body=body,
            breadcrumbs=[("Report", "../../")],
        )

        html_path = os.path.join(scenario_dir, "report.html")
        with open(html_path, "w") as f:
            f.write(page)
        ok(f"Timeline report: {html_path}")

    def _build_output(self) -> dict:
        return {
            "scenario": self.name,
            "total": self.pass_count + self.fail_count,
            "passed": self.pass_count,
            "failed": self.fail_count,
            "tests": self.results,
        }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Run a K8s E2E scenario")
    parser.add_argument("scenario_file", help="Path to scenario JSON file")
    parser.add_argument("--registry-port", type=int, default=18081)
    parser.add_argument("--builder-port", type=int, default=18082)
    parser.add_argument("--envmanager-port", type=int, default=18083)
    parser.add_argument("--operator-port", type=int, default=18084)
    parser.add_argument("--gateway-port", type=int, default=18080)
    parser.add_argument("--namespace", default="turbo-engine-e2e")
    args = parser.parse_args()

    try:
        with open(args.scenario_file) as f:
            scenario = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        fail(f"Failed to load scenario: {e}")
        sys.exit(2)

    runner = ScenarioRunner(scenario, args)
    output = runner.run()

    # Write results to stdout as JSON
    json.dump(output, sys.stdout, indent=2)
    print()  # trailing newline

    total = output["total"]
    passed = output["passed"]
    failed = output["failed"]
    info(f"=== Scenario {runner.name}: {passed}/{total} passed, {failed} failed ===")

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
