#!/usr/bin/env bash
# Stands in for scripts/autonomous-watcher.sh in cli/test/sandbox-probe-invalid-profile.test.mjs, so no
# test sources the real watcher. Sourced with `status`: prints one stdout and one stderr line, which
# sp__cs8b_check must discard, and defines run_profile_check from CS8B_STUB_REFUSAL and CS8B_STUB_RC.
# hr_placeholder_host_probe_var sets HR_PLACEHOLDER_HOST from CS8B_STUB_HOST; run_profile_check refuses
# with CS8B_STUB_REFUSAL when CS8B_STUB_WANT_HOST is set and differs from it, so a case can tell whether
# the host answer was taken before the check (§5 PD26).
echo "cs8b-stub: status on stdout"
echo "cs8b-stub: status on stderr" >&2
hr_placeholder_host_probe_var() {
  HR_PLACEHOLDER_HOST="${CS8B_STUB_HOST:-0}"
}
run_profile_check() {
  RUN_PROFILE_REFUSAL="${CS8B_STUB_REFUSAL:-}"
  if [ -n "${CS8B_STUB_WANT_HOST:-}" ] && [ "$CS8B_STUB_WANT_HOST" != "${HR_PLACEHOLDER_HOST:-}" ]; then
    return 1
  fi
  return "${CS8B_STUB_RC:-0}"
}
