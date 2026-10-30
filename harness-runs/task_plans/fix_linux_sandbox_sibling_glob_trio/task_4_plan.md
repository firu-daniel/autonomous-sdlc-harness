### Task 4 — Refresh the self-adopted outer-loop scripts from their templates

**Goal:** Make this repository's own copies under `scripts/` byte-identical to the templates Tasks 1 and 2 changed. Gate 15's re-take runs these root copies:

- `scripts/sandbox-probe.sh` renders the per-run profile through `scripts/autonomous-watcher.sh` (`scripts/lib/sandbox-probe/session.sh` → `sp__render`);
- `scripts/sandbox-absent-path-check.sh` sources `scripts/lib/harness-run-lib.sh`, and Task 5 calls `hr_profile_deny_paths` from it.

**Depends on:**

- **Task 1**, which adds `hr_deny_glob_expand` and `hr_profile_deny_paths` to `cli/templates/scripts/lib/harness-run-lib.sh`.
- **Task 2**, which changes `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_glob_drops`, `run_profile_entries`, `run_profile_render`, `run_profile_check`, `spawn_engine`'s manifest block).

This task copies bytes and changes nothing in them.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` decides it: `scripts/` at this root is `init`'s output in this checkout.

### Targets

- `scripts/autonomous-watcher.sh`
- `scripts/lib/harness-run-lib.sh`

**Work:**

- [ ] Replace each target with its template's bytes: `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/lib/harness-run-lib.sh`. Neither carries a `{{…}}` token, so a byte copy is the rendering. Keep each file's executable bit as the index has it.

**Verification:**

- `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh` and `cmp scripts/lib/harness-run-lib.sh cli/templates/scripts/lib/harness-run-lib.sh` each print nothing and exit 0.
- `git diff --stat -- scripts` lists exactly these two files.
