#!/usr/bin/env bash
# Stands in for scripts/autonomous-watcher.sh wherever a suite drives session.sh → sp__render, so no test
# sources the real watcher. Sourced with `status`, it defines the three functions sp__render's child shell
# calls. run_profile_render writes RENDER_STUB_JSON (default `{}`) to RENDER_STUB_PROFILE and sets
# RUN_PROFILE_FILE to that path; run_profile_check accepts.
hr_placeholder_host_probe_var() {
  HR_PLACEHOLDER_HOST=0
}
run_profile_render() {
  local json="${RENDER_STUB_JSON-}"
  [ -n "$json" ] || json='{}'
  RUN_PROFILE_REFUSAL=""
  RUN_PROFILE_FILE="$RENDER_STUB_PROFILE"
  printf '%s\n' "$json" >"$RUN_PROFILE_FILE"
}
run_profile_check() {
  return 0
}
