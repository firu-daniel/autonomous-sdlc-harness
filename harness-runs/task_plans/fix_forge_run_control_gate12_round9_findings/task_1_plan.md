### Task 1 — `push-branch.sh` never pushes back a tracked branch its remote deleted

**Goal:** A run stopped because its branch was deleted no longer re-creates that branch. Gate 12 round 9, finding 1: after the deletion's stop cancelled the job, the job's `Push the branch` step, which runs `if: always()`, ran `push-branch.sh` and logged `push-branch.sh: pushed feat_invoices_7 to origin`, re-creating the branch on origin. The rule this task adds to `push-branch.sh`: **a branch this checkout tracks on its remote is never pushed when that remote no longer lists it.**

**Why the script and not the workflow step.** The run's own commit points push through this script too: the `committer` with `push: true`, the orchestrators' direct pushes, and the watcher. One of them can push in the seconds between the deletion and the cancel. A check inside `push-branch.sh` covers every caller. A guard on the step would cover only the post-step.

**Where this task stops.** This task changes when `push-branch.sh` pushes, plus one comment in `harness-run.yml`. The deletion's stop, and what it posts and labels, belong to `remote-run.sh` and to **Tasks 2 and 3**. The adopter documents are **Tasks 5 to 7 and 9**. Task 9 records this task's new outcome in `docs/outer-loop-verification.md` → `### 1.2` and cites the test file below by name, along with its cases *Deleted on origin* and *Still on origin*. Keep that file name, and make each case's test name begin with the case's bold label below. `push-branch.sh` keeps its contract for every caller:
- one call;
- exit `0` on every path;
- only a fast-forward push;
- no `--force` and no `--force-with-lease`. The task prompt's `--force-with-lease=<branch>:<sha>` suggestion is declined for this reason.

### Targets

- `cli/templates/scripts/push-branch.sh`: a check placed between the protected-branch decision and the push block, plus the header paragraphs `WHAT IT NEVER DOES`, a new `A BRANCH ITS REMOTE DELETED STAYS DELETED.` paragraph, and `REPRO`.
- `cli/templates/github/workflows/harness-run.yml`: a YAML comment directly above the `- name: Push the branch` step. Change no key and no `run:` line.
- `cli/test/push-branch-deleted-upstream.test.mjs` (new): the skip, and its positive controls.

**Work:**

- [ ] **The check.** After the protected-branch `case` and before `push_cmd` is chosen:
  1. **Does the branch track a remote branch?** It does when `git -C "$top" config --get "branch.$branch.merge"` prints a value, or when `git -C "$top" rev-parse --verify --quiet "refs/remotes/origin/$branch"` resolves. If neither holds, run no check, so a new branch's first push is unchanged.
  2. **Which remote and ref to ask.** The remote is `branch.$branch.remote` when it is set, else `origin`. The ref is `branch.$branch.merge` when it is set, else `refs/heads/$branch`.
  3. **Ask the remote.** Run `git -C "$top" ls-remote --exit-code --heads "$remote" "$ref"`, with its output discarded.
     - Exit `2` means the remote does not list the branch. Print exactly `push-branch.sh: <remote> no longer has <branch>, which this checkout tracks; not pushing it back (a branch deleted on its remote stays deleted). To publish it again on purpose: git push --set-upstream <remote> <branch>`, then `exit 0`.
     - Any other non-zero exit means the remote cannot answer. Print one line naming that exit, `push-branch.sh: could not ask <remote> whether it still has <branch> (ls-remote exited <n>); pushing as before`, and go on to the existing push. A remote that cannot answer `ls-remote` is not evidence of a deletion, and the push itself then reports its own failure.

  The check runs once, before the retry loop, and never inside it.
- [ ] **The header.**
  - New paragraph `A BRANCH ITS REMOTE DELETED STAYS DELETED.`, after `EVERY FAILURE PATH IS NON-FATAL`. Give the rule and both tracking tests. Give its reason: Gate 12 round 9, finding 1, where a stop caused by a deletion was undone by the job's `always()` push. Name the accepted costs:
    - a deletion that lands between the `ls-remote` and the push is still pushed back;
    - a local branch that reuses the name of one deleted on origin is not pushed while its stale `refs/remotes/origin/<branch>` survives, and the line names the hand push that publishes it.
  - `WHAT IT NEVER DOES`: add "and never pushes back a branch it tracks after its remote deleted it".
  - The comment above the push block: say that the check above has already run.
  - `REPRO`: add a `deleted on origin` case against the existing fixture. After the first push (`no upstream yet`), run `git -C "$b" update-ref -d refs/heads/feat_x`, then `push-branch.sh "$d"`. Expected: exit 0, the `no longer has feat_x` line, and `git -C "$b" branch` lists no `feat_x`.
- [ ] **`harness-run.yml`.** Above `- name: Push the branch`, add a comment of at most three lines. It says the step runs under `always()`, so a cancelled or failed job still pushes its commits, and that `push-branch.sh` pushes nothing back for a branch origin no longer has, so a run stopped by its branch's deletion does not re-create it (Gate 12 round 9, finding 1). Keep every GitHub expression's spacing rule: write no `{{`, and no `${{` without the space after it.
- [ ] **`push-branch-deleted-upstream.test.mjs`.** Open with the rule this suite enforces: a tracked branch whose remote no longer lists it is not pushed, every path exits 0, and a branch that tracks nothing is pushed as before. Build each fixture under the system temp directory with `cli/test/helpers/fixture.mjs`, run `init` so the installed `scripts/push-branch.sh` is the one exercised, and use a bare origin, as `cli/test/push-branch-retry.test.mjs` does. Cases:
  - **Deleted on origin, tracking ref still present.** Push once, which sets the upstream. Delete the ref in the bare repository with `update-ref -d`, commit, then run the script. Expected: exit 0, the `no longer has` line, and the bare repository lists no branch.
  - **Deleted on origin, tracking ref pruned.** Push once, then `git push origin --delete <branch>` from the same clone, which also drops `refs/remotes/origin/<branch>` while `branch.<b>.merge` stays. Commit and run. Same expectations: the config test alone triggers the skip.
  - **Still on origin.** Positive control: a tracked branch whose remote still has it moves to `HEAD`, with `pushed <branch> to origin`.
  - **Never pushed.** Positive control: a new branch with neither tracking test is pushed with `--set-upstream`, and no `ls-remote` line is printed.
  - **Remote cannot answer.** Point `origin` at a path that does not exist after the upstream is set. Expected: the `could not ask` line, then the existing failure line, and exit 0.
- [ ] **The suites that delete a pushed branch.** Run:

  ```
  git grep -nE "push-branch|--delete|update-ref -d refs/heads" -- cli/test
  ```

  For each case a hit sets up, judge whether `push-branch.sh` now runs against a tracked branch that origin no longer lists, where the case expects the branch to be pushed back. Update only such a case's expectation. Name in your return each suite you edited and each one you judged and left alone.

**Verification:**

- `npm test --workspace cli -- test/push-branch-deleted-upstream.test.mjs`, from the repository root, passes. Run each further suite this task edited the same way, one file at a time.
- `bash scripts/typecheck.sh` exits 0.
- Grep the executable lines of `push-branch.sh` for `--force`, `fetch` and `rebase`: there are no hits.
- `cli/test/workflow-templates.test.mjs` is not run here, because this task does not edit it. Read its `continue runs unless cancelled; the upload and the final push always run` case and confirm that the `Push the branch` step's `if:` still reads `always() && env.SCRIPTS_DIR != ''`, byte for byte.
- End-to-end, the path the story index's first `Top risks:` names: the *Never pushed* case shows that a first push through the `--set-upstream` route is unchanged. A first push is the route `remote-run.sh start` takes for a newly cut branch.
