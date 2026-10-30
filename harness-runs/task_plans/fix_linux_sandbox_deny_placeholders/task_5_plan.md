### Task 5 — Refresh the self-adopted outer-loop scripts from their templates

**Goal:** Make this repository's own `scripts/` copies byte-identical to the templates Tasks 2 and 4 changed. Gate 15's container re-take (Task 6, and the record branch afterwards) drives the root copies: `scripts/sandbox-probe.sh` renders through `scripts/autonomous-watcher.sh`, and the check script sources `scripts/lib/harness-run-lib.sh`.

**Depends on:** Task 2, which changes `cli/templates/scripts/lib/harness-run-lib.sh` and `cli/templates/scripts/cleanup-merged-worktrees.sh`, Task 4, which changes `cli/templates/scripts/autonomous-watcher.sh`, and Task 11, which changes `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/lib/harness-run-lib.sh` (it adds `hr_registry_live_count` and `hr_main_checkout_past_leftovers_nogit`). This task copies bytes and changes nothing in them.

### Targets

- `scripts/autonomous-watcher.sh`
- `scripts/lib/harness-run-lib.sh`
- `scripts/cleanup-merged-worktrees.sh`

**Work:**

- [ ] Replace each target with its template's bytes: `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` and `cli/templates/scripts/cleanup-merged-worktrees.sh`. All three carry no `{{…}}` token, so a byte copy is the rendering. Keep each file's executable bit as it is in the index.

**Verification:**

- `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh`, `cmp scripts/lib/harness-run-lib.sh cli/templates/scripts/lib/harness-run-lib.sh` and `cmp scripts/cleanup-merged-worktrees.sh cli/templates/scripts/cleanup-merged-worktrees.sh` each print nothing and exit 0.
- `git diff --stat -- scripts` lists exactly these three files.
