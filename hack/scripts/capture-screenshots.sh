#!/usr/bin/env bash
# capture-screenshots.sh — Captures screenshots of the console UI using a
# headless browser (playwright).  Falls back to saving raw HTML via curl if
# playwright is not available.
#
# Pages captured:
#   Console UI (port 3000):
#   - Dashboard        (/)
#   - Packages list    (/packages)
#   - Environments list (/environments)
#
#   Explorer UI (port 3001):
#   - Explorer         (/)
#
# Output: ci-report/screenshots/
#
# Environment variables (for CI — used to proxy API calls via Playwright):
#   REGISTRY_URL    — e.g. http://localhost:18081
#   BUILDER_URL     — e.g. http://localhost:18082
#   ENVMANAGER_URL  — e.g. http://localhost:18083
#   GATEWAY_URL     — e.g. http://localhost:18080
#   JAEGER_URL      — e.g. http://localhost:18686
#
# Usage:
#   ./hack/scripts/capture-screenshots.sh
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/ci-report"
SCREENSHOT_DIR="${REPORT_DIR}/screenshots"

CONSOLE_URL="${CONSOLE_URL:-http://localhost:3000}"
EXPLORER_URL="${EXPLORER_URL:-http://localhost:3001}"

# Backend service URLs — used to proxy API calls in the browser.
# When set, Playwright intercepts /api/<service>/* requests and forwards
# them to the real backend, replicating the Vite dev-server proxy.
REGISTRY_URL="${REGISTRY_URL:-}"
BUILDER_URL="${BUILDER_URL:-}"
ENVMANAGER_URL="${ENVMANAGER_URL:-}"
GATEWAY_URL="${GATEWAY_URL:-}"
JAEGER_URL="${JAEGER_URL:-}"

mkdir -p "${SCREENSHOT_DIR}"

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

info()  { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}[OK]${RESET}    %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }
fail()  { printf "${RED}[FAIL]${RESET}  %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Pages to capture
# ---------------------------------------------------------------------------
declare -A PAGES=(
  [dashboard]="/"
  [packages]="/packages"
  [environments]="/environments"
)

# ---------------------------------------------------------------------------
# Check for playwright availability
# ---------------------------------------------------------------------------
USE_PLAYWRIGHT=false

if command -v node &>/dev/null; then
  # Check if the playwright package is importable by node.
  # NODE_PATH may be set by CI to point to a custom install prefix.
  if node -e "require('playwright')" 2>/dev/null; then
    USE_PLAYWRIGHT=true
  else
    info "require('playwright') failed from CWD=$(pwd)"
    info "NODE_PATH=${NODE_PATH:-<unset>}"
    # Try common locations
    for candidate in ./node_modules /tmp/pw/node_modules; do
      if [ -d "${candidate}/playwright" ]; then
        info "Found playwright at ${candidate}/playwright — setting NODE_PATH"
        export NODE_PATH="${candidate}"
        if node -e "require('playwright')" 2>/dev/null; then
          USE_PLAYWRIGHT=true
          break
        fi
      fi
    done
  fi
fi

if $USE_PLAYWRIGHT; then
  info "Using Playwright for screenshot capture (NODE_PATH=${NODE_PATH:-<default>})."
else
  warn "Playwright not available. Falling back to curl (HTML capture)."
  warn "To get PNG screenshots, install playwright: npm install playwright && npx playwright install chromium"
fi

# ---------------------------------------------------------------------------
# Build the Playwright API-route setup snippet.
#
# Both UIs use a Vite dev-server proxy that maps:
#   /api/registry/*   → registry:8081/*     (strips prefix)
#   /api/builder/*    → builder:8082/*      (strips prefix)
#   /api/envmanager/* → envmanager:8083/*    (strips prefix)
#   /api/gateway/*    → gateway:8080/*      (strips prefix)
#   /api/jaeger/*     → jaeger:16686/*      (strips prefix)
#
# In CI the UIs are served as static SPAs, so these paths hit the SPA
# fallback and return index.html (hence "Unexpected token <" errors).
# We replicate the Vite proxy using Playwright's page.route() API.
# ---------------------------------------------------------------------------
build_api_routes_js() {
  local routes_js=""
  if [ -n "$REGISTRY_URL" ]; then
    routes_js+="    ['/api/registry', '${REGISTRY_URL}'],"$'\n'
  fi
  if [ -n "$BUILDER_URL" ]; then
    routes_js+="    ['/api/builder', '${BUILDER_URL}'],"$'\n'
  fi
  if [ -n "$ENVMANAGER_URL" ]; then
    routes_js+="    ['/api/envmanager', '${ENVMANAGER_URL}'],"$'\n'
  fi
  if [ -n "$GATEWAY_URL" ]; then
    routes_js+="    ['/api/gateway', '${GATEWAY_URL}'],"$'\n'
  fi
  if [ -n "$JAEGER_URL" ]; then
    routes_js+="    ['/api/jaeger', '${JAEGER_URL}'],"$'\n'
  fi

  if [ -z "$routes_js" ]; then
    # No backend URLs configured — no API routing needed.
    echo "  // No backend URLs configured; skipping API route interception."
    return
  fi

  cat <<ROUTES_JS
  // Intercept API calls and proxy to real backend services (replicates Vite proxy).
  const apiRoutes = [
${routes_js}  ];
  for (const [prefix, target] of apiRoutes) {
    await page.route('**' + prefix + '/**', async (route) => {
      const url = new URL(route.request().url());
      const newPath = url.pathname.replace(prefix, '') + url.search;
      try {
        const resp = await route.fetch({ url: target + newPath });
        await route.fulfill({ response: resp });
      } catch (e) {
        consoleLogs.push('[ROUTE-ERROR] ' + prefix + ': ' + e.message);
        await route.abort();
      }
    });
  }
ROUTES_JS
}

# ---------------------------------------------------------------------------
# Capture with Playwright — console pages (desktop viewport)
# ---------------------------------------------------------------------------
capture_with_playwright() {
  local name="$1"
  local path="$2"
  local url="${CONSOLE_URL}${path}"
  local output="${SCREENSHOT_DIR}/${name}.png"
  local log_output="${SCREENSHOT_DIR}/${name}.log"

  info "  Capturing ${name} (${url})..."

  local tmp_script
  tmp_script=$(mktemp /tmp/pw-screenshot-XXXXXX.js)

  local api_routes_js
  api_routes_js=$(build_api_routes_js)

  cat > "$tmp_script" <<PLAYWRIGHT_EOF
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const consoleLogs = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Capture browser console output.
  page.on('console', msg => {
    consoleLogs.push('[' + msg.type() + '] ' + msg.text());
  });
  page.on('pageerror', err => {
    consoleLogs.push('[PAGE-ERROR] ' + err.message);
  });
  page.on('requestfailed', req => {
    consoleLogs.push('[REQ-FAILED] ' + req.url() + ' ' + (req.failure()?.errorText || ''));
  });

${api_routes_js}

  try {
    await page.goto('${url}', { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for client-side rendering.
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '${output}', fullPage: true });
    console.log('Screenshot saved: ${output}');
  } catch (err) {
    consoleLogs.push('[CAPTURE-ERROR] ' + err.message);
    console.error('Error capturing ${name}:', err.message);
    process.exitCode = 1;
  } finally {
    if (consoleLogs.length > 0) {
      fs.writeFileSync('${log_output}', consoleLogs.join('\\n') + '\\n');
      console.log('Console log saved: ${log_output} (' + consoleLogs.length + ' entries)');
    } else {
      console.log('No browser console output captured for ${name}');
    }
    await browser.close();
  }
})();
PLAYWRIGHT_EOF

  if node "$tmp_script" 2>&1; then
    ok "  ${name} -> ${output}"
  else
    warn "  Playwright failed for ${name}, falling back to curl."
    capture_with_curl "$name" "$path"
  fi

  rm -f "$tmp_script"
}

# ---------------------------------------------------------------------------
# Fallback: capture with curl (save HTML)
# ---------------------------------------------------------------------------
capture_with_curl() {
  local name="$1"
  local path="$2"
  local url="${CONSOLE_URL}${path}"
  local output="${SCREENSHOT_DIR}/${name}.html"

  info "  Capturing ${name} via curl (${url})..."

  local http_code
  http_code=$(curl -s -o "${output}" -w '%{http_code}' "${url}" 2>/dev/null || echo "000")

  if [[ "$http_code" == "200" ]]; then
    local size
    size=$(wc -c < "${output}" 2>/dev/null || echo "0")
    ok "  ${name} -> ${output} (${size} bytes, HTML)"
  elif [[ "$http_code" == "000" ]]; then
    fail "  ${name}: Console unreachable at ${url}"
    echo "<html><body><h1>Console unreachable</h1><p>URL: ${url}</p><p>Time: $(date -u)</p></body></html>" > "${output}"
  else
    warn "  ${name}: HTTP ${http_code} (saved response to ${output})"
  fi
}

# ---------------------------------------------------------------------------
# Main — Console UI
# ---------------------------------------------------------------------------
info "Capturing screenshots of the console UI..."
info "Console URL: ${CONSOLE_URL}"
info "Output dir:  ${SCREENSHOT_DIR}"
[ -n "$REGISTRY_URL" ] && info "Backend proxy: registry=${REGISTRY_URL} builder=${BUILDER_URL:-<none>} envmanager=${ENVMANAGER_URL:-<none>}"
echo ""

for name in "${!PAGES[@]}"; do
  path="${PAGES[$name]}"
  if $USE_PLAYWRIGHT; then
    capture_with_playwright "$name" "$path"
  else
    capture_with_curl "$name" "$path"
  fi
done

# ---------------------------------------------------------------------------
# Explorer UI — mobile SPA on port 3001
# ---------------------------------------------------------------------------
echo ""
info "Capturing Explorer UI..."
info "Explorer URL: ${EXPLORER_URL}"
echo ""

capture_explorer() {
  local name="explorer"
  local url="${EXPLORER_URL}/"
  local output="${SCREENSHOT_DIR}/${name}.png"
  local log_output="${SCREENSHOT_DIR}/${name}.log"

  if $USE_PLAYWRIGHT; then
    info "  Capturing ${name} (${url})..."
    local tmp_script
    tmp_script=$(mktemp /tmp/pw-screenshot-XXXXXX.js)

    local api_routes_js
    api_routes_js=$(build_api_routes_js)

    cat > "$tmp_script" <<EXPLORER_PW_EOF
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const consoleLogs = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  // Capture browser console output.
  page.on('console', msg => {
    consoleLogs.push('[' + msg.type() + '] ' + msg.text());
  });
  page.on('pageerror', err => {
    consoleLogs.push('[PAGE-ERROR] ' + err.message);
  });
  page.on('requestfailed', req => {
    consoleLogs.push('[REQ-FAILED] ' + req.url() + ' ' + (req.failure()?.errorText || ''));
  });

${api_routes_js}

  try {
    await page.goto('${url}', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    // Clip to viewport so fixed-position elements (tab bar) are visible.
    await page.screenshot({ path: '${output}', fullPage: false });
    console.log('Screenshot saved: ${output}');
  } catch (err) {
    consoleLogs.push('[CAPTURE-ERROR] ' + err.message);
    console.error('Error capturing ${name}:', err.message);
    process.exitCode = 1;
  } finally {
    if (consoleLogs.length > 0) {
      fs.writeFileSync('${log_output}', consoleLogs.join('\\n') + '\\n');
      console.log('Console log saved: ${log_output} (' + consoleLogs.length + ' entries)');
    } else {
      console.log('No browser console output captured for ${name}');
    }
    await browser.close();
  }
})();
EXPLORER_PW_EOF

    if node "$tmp_script" 2>&1; then
      ok "  ${name} -> ${output}"
    else
      warn "  Playwright failed for ${name}, falling back to curl."
      capture_with_curl_explorer
    fi
    rm -f "$tmp_script"
  else
    capture_with_curl_explorer
  fi
}

capture_with_curl_explorer() {
  local name="explorer"
  local url="${EXPLORER_URL}/"
  local output="${SCREENSHOT_DIR}/${name}.html"
  info "  Capturing ${name} via curl (${url})..."
  local http_code
  http_code=$(curl -s -o "${output}" -w '%{http_code}' "${url}" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]]; then
    local size
    size=$(wc -c < "${output}" 2>/dev/null || echo "0")
    ok "  ${name} -> ${output} (${size} bytes, HTML)"
  elif [[ "$http_code" == "000" ]]; then
    warn "  ${name}: Explorer unreachable at ${url} (skipping)"
  else
    warn "  ${name}: HTTP ${http_code} (saved response to ${output})"
  fi
}

capture_explorer

echo ""
ok "Screenshots captured in: ${SCREENSHOT_DIR}"
ls -la "${SCREENSHOT_DIR}/"
