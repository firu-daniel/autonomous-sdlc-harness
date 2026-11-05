### Task 2 — Refresh this repository's self-adopted `scripts/lib/harness-run-lib.sh` from its template

**Goal:** This repository runs its own harness from `scripts/`, so its copy of the run library carries Task 1's fix too, and this checkout's own watcher does not keep the defect.

**Depends on:** Task 1. It changes `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_status_write` and that function's doc comment only. This task copies; it changes no template and decides nothing. It is a catch-all task (`general`), so read every configured layer's conventions document: `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`.

### Targets

- `scripts/lib/harness-run-lib.sh`: a byte copy of `cli/templates/scripts/lib/harness-run-lib.sh`.

**Work:**

- [ ] Before copying, confirm the two files were byte-identical before this branch. Use `git ls-tree` of the branch's merge base with `origin/dev` over both paths: the blob ids must match. If they differ, stop and report. A copy would then overwrite a difference this task does not own.
- [ ] Bring `scripts/lib/harness-run-lib.sh` to the template's exact bytes. Where `cp` is refused, apply the template's branch hunk through the Edit tool, as `fix_job_mode_scripts_git_placeholder`'s Task 10 recorded doing. Keep the file's mode.

**Verification:**

- `git diff --no-index --stat cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` reports no content change.
- `bash scripts/typecheck.sh`, the configured type-check, exits 0.
