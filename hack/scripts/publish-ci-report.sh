#!/usr/bin/env bash
# publish-ci-report.sh — Pushes the ci-report/ directory to the ci-reports
# branch so it's browsable via GitHub Pages and readable by Claude.
#
# Usage:
#   REPORT_TYPE=k8s-e2e PR_NUMBER=3 RUN_NUMBER=5 RUN_ID=12345 \
#     ./hack/scripts/publish-ci-report.sh
#
# Environment variables:
#   REPORT_TYPE    — "k8s-e2e" or "e2e" (determines subdirectory)
#   PR_NUMBER      — Pull request number (or "push" for push events)
#   RUN_NUMBER     — GitHub Actions run number (incrementing counter)
#   RUN_ID         — GitHub Actions run ID (unique, used in URLs)
#   GITHUB_SERVER_URL — e.g. https://github.com
#   GITHUB_REPOSITORY — e.g. lennyburdette/turbo-engine
#   PAGES_BASE_URL — Override for Pages URL (auto-detected if unset)
set -euo pipefail
trap 'echo "::error title=publish-ci-report.sh::Script failed at line $LINENO (exit code $?)"' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

REPORT_TYPE="${REPORT_TYPE:?REPORT_TYPE is required (k8s-e2e or e2e)}"
PR_NUMBER="${PR_NUMBER:?PR_NUMBER is required}"
RUN_NUMBER="${RUN_NUMBER:?RUN_NUMBER is required}"
RUN_ID="${RUN_ID:-unknown}"
GITHUB_SERVER_URL="${GITHUB_SERVER_URL:-https://github.com}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}"

CI_REPORT_DIR="${ROOT_DIR}/ci-report"

# Write (or overwrite) Jekyll config, layout, and CSS.  Called on every run
# so improvements propagate to existing ci-reports branches.
write_site_scaffolding() {
  # Jekyll config — no remote theme, just plain HTML layout.
  cat > _config.yml <<'JEKYLL_EOF'
title: Turbo Engine CI Reports
description: E2E test results, traces, logs, and screenshots
exclude:
  - "*.json"
JEKYLL_EOF

  # Custom layout — self-contained HTML with viewport meta and mobile CSS.
  # No dependency on a remote Jekyll theme.
  mkdir -p _layouts
  cat > _layouts/default.html <<'LAYOUT_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ page.title | default: site.title }}</title>
  <style>
    :root {
      --bg: #fff;
      --fg: #24292e;
      --fg-muted: #586069;
      --border: #e1e4e8;
      --bg-code: #f6f8fa;
      --link: #0366d6;
      --pass: #22863a;
      --fail: #cb2431;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117;
        --fg: #c9d1d9;
        --fg-muted: #8b949e;
        --border: #30363d;
        --bg-code: #161b22;
        --link: #58a6ff;
        --pass: #3fb950;
        --fail: #f85149;
      }
    }

    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
                   Arial, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      color: var(--fg);
      background: var(--bg);
      margin: 0;
      padding: 16px;
      max-width: 100vw;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      overflow-x: hidden;
    }

    h1 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    h2 { font-size: 1.25em; margin-top: 1.5em; }
    h3 { font-size: 1.1em; }

    a { color: var(--link); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Code blocks: horizontally scrollable, never expand the page */
    pre {
      background: var(--bg-code);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      font-size: 13px;
      line-height: 1.4;
      max-width: 100%;
    }
    code {
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.9em;
    }
    p code, li code, td code {
      background: var(--bg-code);
      padding: 2px 6px;
      border-radius: 3px;
    }

    /* Tables: scrollable wrapper, never expand the page */
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 12px 0;
      max-width: 100%;
    }
    table {
      border-collapse: collapse;
      min-width: 100%;
      font-size: 14px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 6px 10px;
      text-align: left;
      white-space: nowrap;
    }
    th { background: var(--bg-code); font-weight: 600; }

    /* Details/summary */
    details { margin: 8px 0; }
    summary { cursor: pointer; font-weight: 600; }

    /* Status badges */
    hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

    /* Breadcrumb nav */
    .breadcrumb {
      font-size: 13px;
      color: var(--fg-muted);
      margin-bottom: 8px;
    }
    .breadcrumb a { color: var(--fg-muted); }
  </style>
</head>
<body>
  <div class="container">
    <nav class="breadcrumb">
      <a href="{{ '/' | relative_url }}">CI Reports</a>
    </nav>
    {{ content }}
  </div>
  <script>
    // Wrap all tables in a scrollable div so they don't blow out the viewport.
    document.querySelectorAll('table').forEach(function(table) {
      if (table.parentElement.classList.contains('table-wrapper')) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  </script>
</body>
</html>
LAYOUT_EOF
}

if [ ! -d "$CI_REPORT_DIR" ]; then
  echo "No ci-report/ directory found. Nothing to publish."
  exit 0
fi

# Derive the Pages URL.
if [ -n "$GITHUB_REPOSITORY" ]; then
  OWNER="${GITHUB_REPOSITORY%%/*}"
  REPO="${GITHUB_REPOSITORY##*/}"
  PAGES_BASE_URL="${PAGES_BASE_URL:-https://${OWNER}.github.io/${REPO}}"
fi

# Path on the ci-reports branch: <type>/pr-<N>/run-<N>/
REPORT_PATH="${REPORT_TYPE}/pr-${PR_NUMBER}/run-${RUN_NUMBER}"

echo "Publishing ci-report/ to ci-reports branch at ${REPORT_PATH}"

# Work in a temporary directory to avoid messing with the main checkout.
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

cd "$WORK_DIR"

# Set up git auth. actions/checkout only configures credentials for the main
# working copy; this temp directory needs its own.  Use a credential helper
# that returns the token — this avoids embedding the token in the git config
# file (which url.insteadOf would do) and works reliably across git versions.
CLONE_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}.git"
if [ -n "${GH_TOKEN:-}" ]; then
  git config --global credential.helper '!f() { echo "username=x-access-token"; echo "password='"${GH_TOKEN}"'"; }; f'
  echo "Configured git credential helper for CI"
fi

echo "Cloning ci-reports branch from ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}..."

# Clone just the ci-reports branch (shallow, single-branch).
if git clone --depth 1 --branch ci-reports "$CLONE_URL" repo 2>&1; then
  cd repo
  echo "Cloned ci-reports branch successfully."
else
  # Branch doesn't exist yet — create it as an orphan.
  echo "ci-reports branch does not exist (or clone failed), creating it..."
  mkdir repo && cd repo
  git init
  git remote add origin "$CLONE_URL"
  git checkout --orphan ci-reports

  # Bootstrap root index.
  cat > index.md <<'INDEX_EOF'
---
layout: default
title: CI Reports
---

# CI Reports

Browse E2E test results by type:

- [**K8s E2E**](./k8s-e2e/) — Kubernetes end-to-end tests
- [**E2E**](./e2e/) — Docker Compose end-to-end tests
INDEX_EOF

  git add -A
  git commit -m "Initialize ci-reports branch"
fi

# Always write/update the Jekyll config and layout files so existing
# ci-reports branches pick up improvements.
write_site_scaffolding

# Create the report directory.
mkdir -p "${REPORT_PATH}"

# Copy all ci-report contents.
cp -r "${CI_REPORT_DIR}/"* "${REPORT_PATH}/"

# Generate an index.md for this specific run.
RUN_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${RUN_ID}"

cat > "${REPORT_PATH}/index.md" <<RUN_EOF
---
layout: default
title: "${REPORT_TYPE} — PR #${PR_NUMBER}, Run #${RUN_NUMBER}"
---

# ${REPORT_TYPE} — PR #${PR_NUMBER}, Run #${RUN_NUMBER}

[View workflow run](${RUN_URL})

## Report

RUN_EOF

# Append the main REPORT.md content if it exists.
if [ -f "${REPORT_PATH}/REPORT.md" ]; then
  cat "${REPORT_PATH}/REPORT.md" >> "${REPORT_PATH}/index.md"
fi

# If there are screenshots, add an image gallery section.
if [ -d "${REPORT_PATH}/screenshots" ]; then
  {
    echo ""
    echo "## Screenshots"
    echo ""
    for img in "${REPORT_PATH}/screenshots/"*.png "${REPORT_PATH}/screenshots/"*.jpg "${REPORT_PATH}/screenshots/"*.html; do
      [ -f "$img" ] || continue
      fname=$(basename "$img")
      if [[ "$fname" == *.html ]]; then
        echo "- [${fname}](./screenshots/${fname})"
      else
        echo "### ${fname%.png}"
        echo "![${fname}](./screenshots/${fname})"
        echo ""
      fi
    done
  } >> "${REPORT_PATH}/index.md"
fi

# Update the per-type index (e.g. k8s-e2e/index.md) listing all runs.
TYPE_DIR="${REPORT_TYPE}"
mkdir -p "${TYPE_DIR}"

cat > "${TYPE_DIR}/index.md" <<TYPE_HEADER
---
layout: default
title: "${REPORT_TYPE} Reports"
---

# ${REPORT_TYPE} Reports

| PR | Run | Link |
|----|-----|------|
TYPE_HEADER

# List all run directories for this type, most recent first.
for pr_dir in "${TYPE_DIR}"/pr-*/; do
  [ -d "$pr_dir" ] || continue
  pr_name=$(basename "$pr_dir")
  for run_dir in "$pr_dir"/run-*/; do
    [ -d "$run_dir" ] || continue
    run_name=$(basename "$run_dir")
    echo "| ${pr_name} | ${run_name} | [View](./${pr_name}/${run_name}/) |" >> "${TYPE_DIR}/index.md"
  done
done

# Regenerate root index.md with recent runs across all types.
cat > index.md <<'ROOT_HEADER'
---
layout: default
title: CI Reports
---

# CI Reports

## Recent runs

| Type | PR | Run | Link |
|------|-----|-----|------|
ROOT_HEADER

# Collect all runs, sort by run number descending, take the 20 most recent.
for type_dir in k8s-e2e e2e; do
  [ -d "$type_dir" ] || continue
  for pr_dir in "$type_dir"/pr-*/; do
    [ -d "$pr_dir" ] || continue
    pr_name=$(basename "$pr_dir")
    for run_dir in "$pr_dir"/run-*/; do
      [ -d "$run_dir" ] || continue
      run_name=$(basename "$run_dir")
      run_num=${run_name#run-}
      echo "${run_num}|${type_dir}|${pr_name}|${run_name}"
    done
  done
done | sort -t'|' -k1 -rn | head -20 | while IFS='|' read -r _ type pr run; do
  echo "| ${type} | ${pr} | ${run} | [View](./${type}/${pr}/${run}/) |" >> index.md
done

{
  echo ""
  echo "## Browse by type"
  echo ""
  echo "- [**K8s E2E**](./k8s-e2e/) — Kubernetes end-to-end tests"
  echo "- [**E2E**](./e2e/) — Docker Compose end-to-end tests"
} >> index.md

# Commit and push.
git add -A
git commit -m "CI report: ${REPORT_TYPE} PR #${PR_NUMBER} run #${RUN_NUMBER}" --allow-empty

# Push with retry.  Two concurrent workflows (E2E + K8s E2E) may race to
# push to ci-reports.  On each retry, fetch + rebase so we incorporate the
# other workflow's commit before re-pushing.
MAX_RETRIES=5
for i in $(seq 1 $MAX_RETRIES); do
  if git push origin ci-reports 2>&1; then
    echo "Pushed to ci-reports branch successfully."
    break
  else
    if [ "$i" -lt "$MAX_RETRIES" ]; then
      WAIT=$((2 ** i))
      echo "Push failed (attempt ${i}/${MAX_RETRIES}), rebasing and retrying in ${WAIT}s..."
      sleep "$WAIT"
      # Fetch latest ci-reports and rebase our commit on top.
      git fetch origin ci-reports 2>&1 || true
      git rebase origin/ci-reports 2>&1 || git rebase --abort 2>/dev/null || true
    else
      echo "::error title=Report Publish Failed::Failed to push to ci-reports branch after ${MAX_RETRIES} attempts"
      exit 0  # Non-fatal — don't fail the workflow over this.
    fi
  fi
done

# Output the Pages URL for downstream steps.
if [ -n "${PAGES_BASE_URL:-}" ]; then
  REPORT_URL="${PAGES_BASE_URL}/${REPORT_PATH}/"
  echo "Report URL: ${REPORT_URL}"
  # Set GitHub Actions output if running in CI.
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "report_url=${REPORT_URL}" >> "$GITHUB_OUTPUT"
    echo "report_path=${REPORT_PATH}" >> "$GITHUB_OUTPUT"
  fi
fi
