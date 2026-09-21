### Task 13 — Mirror the changed templates into this repository's own copies

**Goal:** Keep this repository's own `init` output byte-identical to the templates this branch changed, so the watcher this repository runs is the fixed one once it is restarted, and close the branch with the retired-form sweep over every channel consumer.

**Depends on:** Tasks 1, 2, 3 and 6 — the four scripts and two READMEs below are copied from the template files those tasks finished, and must not be copied earlier. Tasks 7–12 must also have landed for the closing sweep to pass. **The catch-all task ships last for this reason**: it copies and checks what the other layers built and authors nothing of its own.

**Where this task stops.** It edits nothing by hand: each target becomes the byte-for-byte copy of its template, keeping its executable bit. Restarting the live watcher is a human step recorded in the story index's `Manual setup required:` list — `restart-watcher.sh` is withheld from agents — and is not attempted here.

### Targets

- `scripts/autonomous-watcher.sh` ← `cli/templates/scripts/autonomous-watcher.sh`
- `scripts/autonomous-notify.sh` ← `cli/templates/scripts/autonomous-notify.sh`
- `scripts/cleanup-merged-worktrees.sh` ← `cli/templates/scripts/cleanup-merged-worktrees.sh`
- `scripts/restart-watcher.sh` ← `cli/templates/scripts/restart-watcher.sh`
- `harness-runs/clarifications/README.md` ← `cli/templates/state-dir/clarifications/README.md`
- `harness-runs/clarification_digests/README.md` ← `cli/templates/state-dir/clarification_digests/README.md`

**Work:**

- [ ] Copy each of the four scripts over its `scripts/` counterpart byte for byte, preserving mode `755`.
- [ ] Copy each of the two READMEs over its `harness-runs/` counterpart byte for byte.
- [ ] Run the closing sweeps under **Verification** and report their output in the task's commit summary.

**Verification:**

- `cmp` exits 0 for each of the six template/copy pairs listed under `### Targets`, and `ls -l scripts/autonomous-watcher.sh scripts/autonomous-notify.sh scripts/cleanup-merged-worktrees.sh scripts/restart-watcher.sh` shows each executable.
- Retired-form sweep: `grep -rn "one file per blocking question\|one question per file\|one or more self-contained\|question file(s)\|lowest answered index\|for each blocking question\|a sibling answer file\|THE LOWEST INDEX WINS" plugin cli/src cli/templates cli/test docs README.md scripts harness-runs/clarifications/README.md harness-runs/clarification_digests/README.md` — invariant: no hits.
- Consumer closure: re-run the story index's `## Scope register` command entries C1–C4 — invariant: every file each prints is a row of that register (⊆ the register rows), so no consumer appeared that no task owns.
- `bash scripts/run-gates.sh` prints no failure that is not already present on this branch's base commit.
