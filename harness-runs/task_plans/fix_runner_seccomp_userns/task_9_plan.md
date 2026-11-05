### Task 9 — Refresh the self-adopted run library and watcher from their templates

**Goal:** Make this repository's own copies under `scripts/` byte-identical to the two templates Task 5 changed, so this checkout's own watcher runs the new launch check. Before this branch, `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` were byte-identical to their templates (`cmp` exits 0 on both).

**Depends on:** Task 5, which changes:

- `cli/templates/scripts/lib/harness-run-lib.sh`: `hr_sandbox_prereq_judge_var`, `hr_sandbox_prereq_probe_var` and the header's two sandbox `MIRROR OF` blocks.
- `cli/templates/scripts/autonomous-watcher.sh`: the **THE SANDBOX PREFLIGHT** comment block only.

This task copies bytes and changes nothing in them.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` decides it: `scripts/` at this root is `init`'s output in this checkout. The precedent is `fix_linux_sandbox_sibling_glob_trio` Task 4, which refreshed the same two copies the same way.

### Targets

- `scripts/lib/harness-run-lib.sh`
- `scripts/autonomous-watcher.sh`

**Work:**

- [ ] Replace each target with its template's bytes: `cli/templates/scripts/lib/harness-run-lib.sh` and `cli/templates/scripts/autonomous-watcher.sh`. Neither carries a `{{…}}` token, so a byte copy is the rendering. Keep each file's executable bit as the index has it.

**Verification:**

- `cmp scripts/lib/harness-run-lib.sh cli/templates/scripts/lib/harness-run-lib.sh` and `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh` each print nothing and exit 0.
- `git diff --stat -- scripts` lists exactly these two files.
