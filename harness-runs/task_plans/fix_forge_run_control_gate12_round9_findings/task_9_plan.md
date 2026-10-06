### Task 9 — `docs/outer-loop-verification.md`: the drift block's comment-only scripts re-graded, and `### 1.2`'s deleted-on-origin row

**Goal:** The outer-loop verification record stops saying that any script's mechanism has not moved since the 2026-08-13 stamp when its diff shows it has, and records the outcome Task 1 added. The file's readers are "anyone changing a script under `cli/templates/scripts/`". Its rows are "rows a later change re-runs rather than re-argues". After Task 1, two statements in it are false:
- the **Drift since that stamp** block names five scripts — `commit-on-branch.sh`, `push-branch.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`, `autonomous-notify.sh` — as "the other five", which "have comment-only diffs since the stamp, so no §1 row's mechanism moved". The block's own grade, run over all five at plan time, shows non-comment lines in `push-branch.sh` (round 8's bounded retry, and Task 1's check once it lands), `cleanup-merged-worktrees.sh` (`run_bounded()`, the `park_loop` status in its `jq` selection, the bounded `fetch --prune`) and `autonomous-notify.sh` (the `park_loop)` case and its usage line). The sentence is therefore false for three of its five names, not one;
- the `### 1.2` table has no row for a tracked branch that origin no longer lists.

**Depends on:** Task 1, which this task documents. Task 9 restates the facts it relies on:
- `push-branch.sh` skips its push when the branch tracks a remote branch and `git ls-remote --exit-code --heads <remote> <ref>` exits `2`. The branch tracks a remote branch when `branch.<b>.merge` is set or `refs/remotes/origin/<b>` resolves.
- On a skip it prints `push-branch.sh: <remote> no longer has <branch>, which this checkout tracks; not pushing it back (a branch deleted on its remote stays deleted). To publish it again on purpose: git push --set-upstream <remote> <branch>` and exits `0`.
- The skip is measured by `cli/test/push-branch-deleted-upstream.test.mjs`, in its *Deleted on origin, tracking ref still present* and *Deleted on origin, tracking ref pruned* cases, against an `init`-built fixture with a bare origin.

**Where this task stops.** Only `docs/outer-loop-verification.md`. Do not restamp the file. Restamping means re-running §0's recipe whole, and this task does not do that. The file's own rule is that the drift block's counts are re-derived by its grading recipe, never edited by hand, so this task re-runs that recipe's grade over **every** script the "The other …" sentence names and records what it shows. Leave the four existing executable-change bullets and the "Nine of the eleven files" sentence as they are: the five scripts are already among the nine changed files, so only their grading moves. `### 1.6`'s `jq`-absent row for `push-branch.sh` and the permission-surface rows are unchanged; the story index's `## Scope register` (row 78 and D11's exclusions) gives the reason.

### Targets

- `docs/outer-loop-verification.md`:
  - **Drift since that stamp, disclosed rather than restamped.**: the "Four carry executable change:" line, one new bullet in its list per script the grade moves, and the "The other five — …" sentence;
  - `### 1.2 \`push-branch.sh\` — refuses **visibly and non-fatally**`: one new table row;
  - **Not re-confirmed by a run:**: the sentence beginning "Two cells —".

**Work:**

- [ ] **Grade every script the "The other …" sentence names, by the block's own rule.** The block grades a changed file's diff with `git diff <base> HEAD -U0 -- <path> | grep -E '^[+-]' | grep -vE '^[+-][[:space:]]*#'`. Its base is the last commit dated at or before the stamp. This repository's history begins after the stamp, so use the commit that added the files, from `git log --diff-filter=A --format=%h -- cli/templates/scripts/push-branch.sh` (one commit adds all five). That base gives a lower bound, which is enough to show executable change, and a script whose lower-bound diff has no non-comment line is the only kind this task may leave in the sentence. Run the grade once per script, with `<path>` set in turn to `cli/templates/scripts/commit-on-branch.sh`, `push-branch.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh` and `autonomous-notify.sh` (each under `cli/templates/scripts/`). Record, per script, whether the output has any non-comment line. For `push-branch.sh` the output must include Task 1's `ls-remote` check; if it does not, stop and return a blocker rather than editing the block.
- [ ] **The drift block, derived from that grade — never by hand.**
  - For each script whose grade has non-comment lines, add one bullet to the executable-change list, after the `refresh-branch.sh` bullet, in the list's own form (script, an em dash, what changed; say which `§1` rows were driven before the change only where a row's own stamp shows it). Name only what the grade output shows. The plan-time grade gives these, to be checked against your own output, not copied over it:
    - `push-branch.sh` — the bounded retry of a push the remote refused (`PUSH_ATTEMPTS`, `PUSH_RETRY_DELAY_SECS`, the `! [rejected]` no-retry arm; Gate 12 round 8, finding 2), and the check that leaves a tracked branch unpushed when its remote no longer lists it (Gate 12 round 9, finding 1). Every `### 1.2` row was driven before both, except the row this task adds.
    - `cleanup-merged-worktrees.sh` — `run_bounded()` and the `HARNESS_FETCH_TIMEOUT`-bounded `fetch --prune` with its changed skip line (PR #15, *cleanup fetch hang*), and `park_loop` added to the active-status `jq` selection (PR #9, *watcher multi question resume loop*).
    - `autonomous-notify.sh` — the `park_loop)` case and its usage line (PR #9, *watcher multi question resume loop*).
  - Rewrite "Four carry executable change:" with the count of bullets the list now holds, spelled as the block spells its counts.
  - Rewrite the "The other five — … —" sentence to name exactly the scripts whose grade had no non-comment line, with their count spelled the same way ("The other two — `commit-on-branch.sh`, `setup-worktree.sh` —" if your grade matches the plan-time one). Keep the rest of that sentence and the "Any later touch …" sentence after it as they are.
  - Every script graded appears in exactly one of the two places.
- [ ] **`### 1.2`'s new row.** Add it after the `origin` pointed at a path that does not exist row, using the table's three columns:
  - **Condition:** a branch with its upstream set, whose ref origin no longer lists (deleted in the bare repository, or deleted with `git push origin --delete`, which also prunes the remote-tracking ref).
  - **Effect:** no push. The bare repository lists no branch of that name, the `no longer has <branch>` line is printed, and the exit is still 0. This is a **unit measurement, not a §0 row**: `cli/test/push-branch-deleted-upstream.test.mjs`, against an `init`-built fixture.
  - **Perturbation:** the same suite's *Still on origin* case: a tracked branch that origin still lists moves to `HEAD`.
- [ ] **The `Not re-confirmed by a run` sentence.** "Two cells — the shim-reach sentence in §1.6 and the `hr_main_repo` row of §2.4 — rest on a `node:test` case …" becomes "Three cells — the shim-reach sentence in §1.6, the `hr_main_repo` row of §2.4 and §1.2's deleted-on-origin row — rest on a `node:test` case …". Keep the rest of the sentence.

**Verification:**

- The `### 1.2` table keeps three columns in every row, the new row included.
- The test file and both case names the new row cites exist: grep `cli/test/push-branch-deleted-upstream.test.mjs` for `Still on origin` and `Deleted on origin`.
- The quoted fragment `no longer has` matches the script: grep `cli/templates/scripts/push-branch.sh` for it.
- The block's lists agree with each other. Every script named in the executable-change bullets is absent from the "The other …" sentence, `push-branch.sh` appears in the bullets only, and each count word matches the number of names it heads.
- Re-run the grade from the first **Work** bullet, with the same base, over every script left in the rewritten "The other …" sentence. The invariant: each produces no non-comment line. Then re-run it over every script this task moved into the bullets. The invariant: each produces at least one non-comment line, and each bullet names only changes visible in its script's output.
- `git diff docs/outer-loop-verification.md` touches only the sites under Targets.
