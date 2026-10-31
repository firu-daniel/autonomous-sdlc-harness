#!/usr/bin/env bash
# Stands in for scripts/autonomous-watcher.sh in cli/test/sandbox-probe-invalid-profile.test.mjs, so no
# test sources the real watcher. Sourced with `status`: prints one stdout and one stderr line, which
# sp__cs8b_check must discard, and defines run_profile_check from CS8B_STUB_REFUSAL and CS8B_STUB_RC.
echo "cs8b-stub: status on stdout"
echo "cs8b-stub: status on stderr" >&2
run_profile_check() {
  RUN_PROFILE_REFUSAL="${CS8B_STUB_REFUSAL:-}"
  return "${CS8B_STUB_RC:-0}"
}
