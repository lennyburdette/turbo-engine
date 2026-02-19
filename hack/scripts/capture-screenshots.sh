#!/usr/bin/env bash
# capture-screenshots.sh — Captures screenshots of the console UI using a
# headless browser (playwright).  Falls back to saving raw HTML via curl if
# playwright is not available.
#
# Pages captured:
#   - Dashboard        (/)
#   - Packages list    (/packages)
#   - Environments list (/environments)
#
# Output: ci-report/screenshots/
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

if command -v npx &>/dev/null; then
  # Check if playwright is installed (either globally or in node_modules).
  if npx playwright --version &>/dev/null 2>&1; then
    USE_PLAYWRIGHT=true
  fi
fi

if $USE_PLAYWRIGHT; then
  info "Using Playwright for screenshot capture."
else
  warn "Playwright not available. Falling back to curl (HTML capture)."
fi

# ---------------------------------------------------------------------------
# Capture with Playwright
# ---------------------------------------------------------------------------
capture_with_playwright() {
  local name="$1"
  local path="$2"
  local url="${CONSOLE_URL}${path}"
  local output="${SCREENSHOT_DIR}/${name}.png"

  info "  Capturing ${name} (${url})..."

  # Create a temporary Playwright script.
  local tmp_script
  tmp_script=$(mktemp /tmp/pw-screenshot-XXXXXX.js)

  cat > "$tmp_script" <<PLAYWRIGHT_EOF
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto('${url}', { waitUntil: 'networkidle', timeout: 30000 });
    // Wait a moment for any client-side rendering.
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '${output}', fullPage: true });
    console.log('Screenshot saved: ${output}');
  } catch (err) {
    console.error('Error capturing ${name}:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
PLAYWRIGHT_EOF

  if npx playwright test --config=/dev/null -- "$tmp_script" 2>/dev/null || node "$tmp_script" 2>/dev/null; then
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
# Main
# ---------------------------------------------------------------------------
info "Capturing screenshots of the console UI..."
info "Console URL: ${CONSOLE_URL}"
info "Output dir:  ${SCREENSHOT_DIR}"
echo ""

for name in "${!PAGES[@]}"; do
  path="${PAGES[$name]}"
  if $USE_PLAYWRIGHT; then
    capture_with_playwright "$name" "$path"
  else
    capture_with_curl "$name" "$path"
  fi
done

echo ""
ok "Screenshots captured in: ${SCREENSHOT_DIR}"
ls -la "${SCREENSHOT_DIR}/"
