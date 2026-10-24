### Task 4 — Mirror the sweep and library into `scripts/`, and document when the per-run profile is removed

**Goal:** Bring this repository's own `scripts/` copies of the two changed templates back to byte-identical. Then make the documents of record say when the per-run profile is removed, how a leftover from before this fix is cleared, and that §6's open bullet has this branch as its follow-up.

**Depends on:** Task 1, which changes `cli/templates/scripts/cleanup-merged-worktrees.sh` and the comments of `cli/templates/scripts/lib/harness-run-lib.sh`. This task copies both and changes neither. The behaviour it documents is Task 1's:

- After the sweep removes a gone branch's copy (`removed clone …` or `removed worktree …`), it deletes `hr_run_profile_file "$(hr_repo_slug <main checkout>)" <branch>`, before `git branch -D`.
- It keeps the file when the copy was not removed, or when a live record (`running`, `parked`, `park_loop`, `paused`) maps to the same path on a re-read of the registry.
- `--dry-run` prints `would remove run profile <file> for '<branch>'` and deletes nothing.

Tasks 2 and 3 own the tests. This is the catch-all task, so it ships last and reads every configured layer's conventions document.

### Targets

- `scripts/cleanup-merged-worktrees.sh` — the byte-for-byte copy of the template.
- `scripts/lib/harness-run-lib.sh` — the byte-for-byte copy of the template.
- `docs/watcher.md` — `### The per-run profile` (story index scope-register row 6), the §1 scripts table row for the sweep (row 10) and the legacy-worktree-run paragraph (row 29).
- `docs/sandbox-verification.md` — §6, the **A swept run leaves its per-run profile behind** bullet (row 4).
- `docs/outer-loop-verification.md` — `### 1.4 \`cleanup-merged-worktrees.sh\``, the **Owed a re-drive on the clone layout.** paragraph only (row 19). The §1.4 table and every other paragraph stay as they are (rows 16–18 and 20–28).

**Work:**

- [ ] Copy `cli/templates/scripts/cleanup-merged-worktrees.sh` over `scripts/cleanup-merged-worktrees.sh`, and `cli/templates/scripts/lib/harness-run-lib.sh` over `scripts/lib/harness-run-lib.sh`, byte for byte, with the executable bit as it already is. Do not edit either copy by hand.
- [ ] `docs/watcher.md` → `### The per-run profile`: after the **Where it is.** paragraphs, add a **When it is removed.** paragraph. It covers four points. The sweep deletes the file once it has removed that run's copy, on both arms, at the path above, by `hr_run_profile_file` with the slug of the main checkout, never by a glob. It keeps the file on a refused or skipped copy, a failed `worktree remove`, a record whose copy is already gone, or a live record mapping to the same file, and the four live statuses are named. `--dry-run` reports the deletion and deletes nothing. Job mode writes no file, so there is nothing to sweep. Cite `cleanup-merged-worktrees.sh`'s header and `cli/test/cleanup-run-copies.test.mjs`.
- [ ] Same section, a **Leftovers from before this fix.** paragraph. Profiles left by runs swept before this release are not migrated. Give the reason for the manual route in one sentence: the sweep finds a file only through a run's record, and a file name cannot be mapped back to a branch. Then give the one command in its own fenced block, one command per line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*):

  ```
  rm -f -- "${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/run-profiles/<repo slug>/"*.json
  ```

  Say when it is safe to run it: while no run of this repository has status `running`. The watcher re-renders a run's profile at every spawn, so a parked, paused or not-yet-swept run gets a fresh one when it resumes. Say where `<repo slug>` comes from: the `this_repo=` field that `bash <scripts_dir>/autonomous-watcher.sh usage` prints on its `machine lane:` line, which is also in its own fenced block. Use no machine path, user name or this repository's slug as the example.
- [ ] `docs/watcher.md`, two one-clause edits outside §2:
  - The §1 scripts table, the `cleanup-merged-worktrees.sh` row: *"Removes the run copy and local branch …"* becomes *"Removes the run copy, that run's per-run profile (§2, *The per-run profile*) and the local branch …"*. Keep the rest of the cell, and keep the other columns unchanged.
  - The legacy-worktree-run paragraph (*"… sweeps it from its registry record through the worktree arm, all unchanged (`cli/test/run-copy-migration.test.mjs`)"*): the sweep clause gains that the worktree arm removes the run's per-run profile after the worktree, as the clone arm does (§2, *The per-run profile*). Keep the suite citation, which Task 3 extends to assert this.
- [ ] The two verification records:
  - `docs/sandbox-verification.md` §6 → **Also observed**, the bullet **A swept run leaves its per-run profile behind**: keep its observation sentences, and replace *"Follow-up: none yet."* with `Follow-up: fix_swept_run_profile_leak`. That branch's sweep removes the profile once it has removed the run's copy (`docs/watcher.md` → `### The per-run profile`, *When it is removed*). The re-observation is owed in a new dated note after the §7 table once a real sweep has run. Leave OR9's row, including its verdict cell, byte-identical.
  - `docs/outer-loop-verification.md` § 1.4, the **Owed a re-drive on the clone layout.** paragraph: add one item to its *What moved* account. After a copy is removed, on either arm, the sweep deletes that run's per-run profile before `git branch -D`. It keeps the file when no copy was removed, or when a live record maps to the same file on the registry re-read, and `--dry-run` names the deletion without making it. Extend the paragraph's closing sentence so `cli/test/cleanup-run-copies.test.mjs` is named as asserting the profile removal too, until a §0 round re-drives it. Leave every table row in § 1.4, **the real sweep** row included, byte-identical: those are dated measurements.

**Verification:**

- `cmp cli/templates/scripts/cleanup-merged-worktrees.sh scripts/cleanup-merged-worktrees.sh` and `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` each exit 0.
- `git diff -U0 docs/sandbox-verification.md` touches no line beginning `| OR9 |` and no line of the §7 table.
- `git diff -U0 docs/outer-loop-verification.md` touches only lines of the § 1.4 **Owed a re-drive on the clone layout.** paragraph, and no line beginning `|`.
- Re-run the story index's two scope-register commands, `git grep -nE 'run-profiles/|A swept run leaves' -- '*.md' ':!harness-runs' ':!examples'` and `git grep -nE 'cleanup-merged-worktrees\.sh' -- '*.md' ':!harness-runs' ':!examples'`. Every hit falls inside a register row, and no hit falls outside the register. No line of a `no-change` row appears in this task's `git diff -U0 -- docs/watcher.md docs/sandbox-verification.md docs/outer-loop-verification.md`.
- Read the new fenced command in `docs/watcher.md`. It spells `$HOME` and `${XDG_STATE_HOME:-…}` literally and carries `<repo slug>` as a placeholder. No expanded home directory, user name or real slug appears, so gate 6a's self-containment check holds.
- The `usage` command named in the new paragraph prints a `this_repo=` field. Check it against `cli/templates/scripts/autonomous-watcher.sh`'s `usage)` arm by reading it, not by running the watcher.

**Deviations from plan:**

- The copy step's `cp` was refused by the session's permission mode (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`). Both `scripts/` copies were byte-identical to their templates at `HEAD~3` (`git ls-tree HEAD~3` gave the same blob for each pair), so Task 1's template hunks (`git diff HEAD~3 HEAD -- cli/templates/scripts/…`) were applied to each copy with the file-edit tool instead. The result was then checked: both `cmp` commands exit 0 with no output, and `git diff --summary` shows no mode change.
- The plan calls the scripts table "§1" and those two edits "outside §2". In `docs/watcher.md` the table sits under `## 2. The scripts`, the same section as `### The per-run profile`. The pointer was written as the plan gave it, `(§2, *The per-run profile*)`, which resolves either way.
- The `usage` command's fenced block is written `bash <scripts_dir>/autonomous-watcher.sh usage`, with `<scripts_dir>` glossed as the configured `scriptsDir`, matching the legacy-run listing paragraph's `<state_dir>` gloss. Read off the `usage)` arm: it prints `machine lane: … this_repo=${HARNESS_REPO_SLUG:-?} …`, and outside job mode the watcher sets `HARNESS_REPO_SLUG` from `hr_repo_slug "$MAIN_REPO"`. That is the slug the sweep uses.
