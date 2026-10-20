### Task 20 — Make `branch-prompt.md`'s collision guard check the run copy's path, not `git worktree list` alone

**Goal:** Step 4, **Collision guard**, of `plugin/commands/branch-prompt.md` checks (b), *"a sibling worktree `<work_root>/<project_name>-<branch>` via `git worktree list`"*. A clone is not a worktree, so `git worktree list` never shows one, and (b) would pass a branch that has a live clone. Restate (b) as the library's one-live-copy rule states it, in this command's own words: the run copy exists at the path the registry record names or at the derived path, or a checkout already has the branch checked out.

**Depends on:** Task 1's `hr_run_copy_live_var`. A live copy exists when any one of these holds:
1. the derived path `<work_root>/<project_name>-<sanitized branch>` exists in any form;
2. the registry record's `worktree` for the branch names a path that exists;
3. the main checkout or a linked worktree has the branch checked out (`git worktree list --porcelain`).

This command cannot source the library: the plugin never executes `cli/` code (`.claude/context/conventions.md` → `## The layers`). So it states the three conditions as checks of its own, through bare single-statement commands.

### Targets

- `plugin/commands/branch-prompt.md`

**Work:**

- [ ] Rewrite check (b) to the three conditions above, and name their owner in one prose citation: the conditions restate `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_copy_live_var` (`.claude/context/plugin.md` → `## Citation`), so a later change to that rule has a grep path back to check (b).
  - Test a path's existence with a bare `test -e <path>`.
  - Read the record's `worktree` with a bare `jq -r '.runs["<branch>"].worktree // empty' <MAIN_REPO>/<state_dir>/autonomous_logs/registry.json`.
  - Keep `git worktree list --porcelain` for the checked-out test.
  - Keep (a) and (c) and the paragraph explaining (c) byte-for-byte, and keep the step's heading text.
- [ ] Keep every placeholder as the file already spells it (`<MAIN_REPO>`, `<state_dir>`, `<work_root>`, `<project_name>`, `<branch>`), and add no adopter literal. Name the derived path's sanitized branch the way the file's `## Resolved values` already resolves `<branch>`. If the sanitized form needs a token of its own, add it to that table with its class, rather than spelling the rule inline.
- [ ] Confine the edit to check (b) and the one sentence after it that says why (a) and (b) miss a queued drop. That sentence keeps its meaning: a queued drop has no record and no copy yet. State each rule once, as a direct instruction (`.claude/context/plugin.md` → `## Writing agent prose`).

**Verification:**

- `claude plugin validate --strict plugin` still passes, if `claude` is on `PATH`; otherwise record it as not run.
- `grep -n 'worktree list' plugin/commands/branch-prompt.md` lists only the anchor fallback in step 1 and the checked-out test in (b). No line uses `git worktree list` as the whole of a run-copy test.
- `grep -n 'hr_run_copy_live_var' plugin/commands/branch-prompt.md` prints the one citation in check (b).
- `git diff plugin/commands/branch-prompt.md` touches step 4 and, if a token was added, the `## Resolved values` table, and nothing else.

- **Deviations from plan:** The derived path needed the sanitized branch (`hr_sanitize_branch`: every `/` → `-`), so a `<sanitized_branch>` row (class `derived at runtime`) was added to `## Resolved values`; the table's lead sentence said "one pair is derived at runtime", which the new row would falsify, so it now reads "two are derived at runtime" — a one-phrase edit to the `## Resolved values` section outside the table itself. Condition 1 adds a bare `test -L <path>` beside `test -e <path>`, because `hr_run_copy_live_var` counts a dangling link as existing (`[ -e "$p" ] || [ -L "$p" ]`) and `test -e` alone does not. `claude plugin validate --strict plugin` was run and printed `✔ Validation passed`, with one pre-existing `plugin/README.md` marketplace-install-line warning unrelated to this change.
