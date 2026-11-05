### Task 7 — Refresh the self-adopted `scripts/` copies of the library, `setup-worktree.sh` and the watcher from their templates

**Goal:** Make this repository's own `scripts/` copies byte-identical to the templates Tasks 1 and 3 changed, as self-adoption requires (task prompt, `## Constraints`). This checkout's bootstrap, wrappers and watcher are then the ones the branch ships.

**Depends on:**
- Task 1, which changes `cli/templates/scripts/lib/harness-run-lib.sh` (new function `hr_worktree_config_drop_inert_sparse_var`) and `cli/templates/scripts/setup-worktree.sh` (its step 4 calls).
- Task 3, which changes `cli/templates/scripts/autonomous-watcher.sh` (`classify_run_exit`).

This task copies bytes and changes nothing in them. All three copies were byte-identical to their templates at this branch's base (`git diff --no-index --stat` showed no content change).

**Why a byte copy, and not the forced self-adopt run.** `docs/development.md` → *"Regenerating this repository's adoption after a `cli/templates/` change is one forced self-adopt run"* documents `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force …`. That run also rewrites `.claude/CLAUDE.md` and the three `.claude/context/` conventions documents, which a run may not target. For an outer-loop script the route's output is the template's bytes, since these three carry no `{{…}}` token. A byte copy is therefore the documented route's result for these files, the shape `fix_background_agent_wait_ceiling` Task 9 used. No rendered workflow is committed in this repository, so `harness-run.yml` (Task 6) has no copy here.

**How the catch-all implementer reads the conventions.** This is the `general` task: read `.claude/context/conventions.md` → `## Documents of record`, *"This repository has adopted its own harness"*.

### Targets

- `scripts/lib/harness-run-lib.sh`
- `scripts/setup-worktree.sh`
- `scripts/autonomous-watcher.sh`

**Work:**

- [ ] Replace each target with its template's bytes: `cli/templates/scripts/lib/harness-run-lib.sh`, `cli/templates/scripts/setup-worktree.sh` and `cli/templates/scripts/autonomous-watcher.sh`. Keep each file's executable bit as the index has it.
  - **If `cp` is refused** by the run's permission mode, bring each copy to its template's bytes by applying the hunks of `git diff --no-index <template> <copy>` with the file-edit tool, which leaves each file's mode untouched.
  - **Never run the forced self-adopt `init`.**

**Verification:**

- `cmp scripts/lib/harness-run-lib.sh cli/templates/scripts/lib/harness-run-lib.sh`, `cmp scripts/setup-worktree.sh cli/templates/scripts/setup-worktree.sh` and `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh` each print nothing and exit 0.
- `git diff --stat -- scripts` lists exactly these three files, and `git diff --summary -- scripts` shows no mode change.
