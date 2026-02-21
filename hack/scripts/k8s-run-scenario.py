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
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from typing import Any


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
        if passed:
            ok(f"{prefixed_name}: {detail}")
            self.pass_count += 1
        else:
            fail(f"{prefixed_name}: {detail}")
            self.fail_count += 1

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
            status, body = http_request(url, method="POST", body=payload)
            duration = time.monotonic_ns() // 1_000_000 - t0

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
        status, body = http_request(url, method="POST", body=payload)
        duration = time.monotonic_ns() // 1_000_000 - t0

        if status in (200, 201):
            self.env_id = body.get("id", env_cfg["name"]) if isinstance(body, dict) else env_cfg["name"]
            self._record("create-environment", True, f"Created {self.env_id}", duration)
            return True
        self.env_id = env_cfg["name"]
        self._record("create-environment", False, f"HTTP {status}", duration)
        return False

    def trigger_and_poll_build(self) -> bool:
        env_cfg = self.scenario["environment"]
        t0 = time.monotonic_ns() // 1_000_000

        payload = {
            "environmentId": self.env_id,
            "rootPackageName": env_cfg["root_package"],
            "rootPackageVersion": env_cfg["root_version"],
        }
        url = f"{self._base_url('builder')}/v1/builds"
        status, body = http_request(url, method="POST", body=payload)
        duration = time.monotonic_ns() // 1_000_000 - t0

        if status not in (200, 201, 202):
            self._record("trigger-build", False, f"HTTP {status}", duration)
            return False

        self.build_id = body.get("id", "unknown") if isinstance(body, dict) else "unknown"
        self._record("trigger-build", True, f"Build {self.build_id} triggered", duration)

        # Poll build status
        t0 = time.monotonic_ns() // 1_000_000
        deadline = time.time() + 90
        build_status = "unknown"
        while time.time() < deadline:
            poll_url = f"{self._base_url('builder')}/v1/builds/{self.build_id}"
            _, poll_body = http_request(poll_url, method="GET")
            build_status = poll_body.get("status", "unknown") if isinstance(poll_body, dict) else "unknown"
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
        status, body = http_request(url, method="POST", body=payload)
        duration = time.monotonic_ns() // 1_000_000 - t0

        if status == 200:
            time.sleep(5)  # Give operator time to create resources
            self._record("operator-reconcile", True, f"Reconciled {len(components)} components", duration)
            return True
        detail = body if isinstance(body, str) else json.dumps(body)[:200]
        self._record("operator-reconcile", False, f"HTTP {status}: {detail}", duration)
        return False

    def verify_k8s_resources(self) -> bool:
        t0 = time.monotonic_ns() // 1_000_000
        all_ok = True
        for comp in self.scenario["components"]:
            name = comp["package_name"]
            for resource in [f"deployment/deploy-{name}", f"service/svc-{name}", f"configmap/cm-{name}"]:
                rc, _ = kubectl(self.args.namespace, "get", resource)
                if rc != 0:
                    warn(f"  Missing {resource}")
                    all_ok = False
                else:
                    info(f"  Found {resource}")

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
        t0 = time.monotonic_ns() // 1_000_000
        all_ok = True
        for comp in self.scenario["components"]:
            name = comp["package_name"]
            rc, _ = kubectl(
                self.args.namespace,
                "wait", "--for=condition=available", f"deployment/deploy-{name}", "--timeout=60s",
            )
            if rc != 0:
                warn(f"  deploy-{name} did not become available")
                all_ok = False

        duration = time.monotonic_ns() // 1_000_000 - t0
        self._record("pods-running", all_ok, "All pods running" if all_ok else "Some pods not available", duration)
        return all_ok

    def wait_for_gateway_routes(self) -> bool:
        """Poll the gateway until ingress routes are active.

        Uses the first gateway-bound request from the scenario as a probe.
        A 404 means the gateway hasn't picked up the route yet; any other
        status (including errors from the upstream) means routing is active.
        """
        # Find the first request that goes via gateway.
        probe_req = None
        for req in self.scenario.get("requests", []):
            if req.get("via", "gateway") == "gateway":
                probe_req = req
                break
        if probe_req is None:
            return True  # No gateway requests in this scenario.

        probe_path = probe_req["path"]
        probe_method = probe_req.get("method", "GET")
        probe_url = f"{self._base_url('gateway')}{probe_path}"

        t0 = time.monotonic_ns() // 1_000_000
        info(f"  Waiting for gateway route {probe_path} to become active...")

        deadline = time.time() + 45
        last_code = 0
        while time.time() < deadline:
            status, _ = http_request(probe_url, method=probe_method, timeout=5)
            last_code = status
            # 404 means the gateway hasn't loaded the route yet.
            # Any other status (200, 500, 502, etc.) means the route exists.
            if status != 404:
                duration = time.monotonic_ns() // 1_000_000 - t0
                self._record("gateway-routing", True, f"Gateway route {probe_path} active (HTTP {status})", duration)
                return True
            time.sleep(5)

        duration = time.monotonic_ns() // 1_000_000 - t0
        self._record("gateway-routing", False, f"Route {probe_path} not ready after 45s (HTTP {last_code})", duration)
        return False

    def run_requests(self) -> None:
        """Execute the scenario's HTTP requests with assertions."""
        for req in self.scenario.get("requests", []):
            t0 = time.monotonic_ns() // 1_000_000
            req_name = req["name"]
            method = req.get("method", "GET")
            path = req["path"]
            via = req.get("via", "gateway")
            extra_headers = req.get("headers", {})

            # Determine the target URL
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

            status_code, body = http_request(url, method=method, headers=extra_headers if extra_headers else None)

            # Check all assertions
            all_passed = True
            details = []
            for assertion in req.get("assertions", []):
                passed, detail = check_assertion(assertion, status_code, body)
                details.append(detail)
                if not passed:
                    all_passed = False

            duration = time.monotonic_ns() // 1_000_000 - t0
            self._record(req_name, all_passed, "; ".join(details), duration)

    def capture_logs(self) -> None:
        """Dump pod logs to the report directory."""
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

            self.capture_logs()
        finally:
            self.cleanup()

        return self._build_output()

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
