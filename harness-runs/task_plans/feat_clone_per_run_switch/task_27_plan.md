### Task 27 — Move `remote-run.test.mjs`'s `review` cases to the clone layout

**Goal:** `cli/test/remote-run.test.mjs` drives `remote-run.sh review` end to end against a real `create-worktree.sh`. After Task 11, `review` cuts a clone, and a clone never appears in `git worktree list`. So the case *"review places the next round by exact branch equality, commits it, and dispatches once"* asserts `assert.doesNotMatch((await runGit(fx.dir, ['worktree', 'list'])).stdout, /-feat_x\b/)`, which can no longer fail. Replace it with the clone equivalent, and assert the registry record Task 11 now drops. No assertion is left that can no longer fail (task prompt goal 6).

**Depends on:** Task 11, for these `review` behaviours:
- It uses the registry record's mirror when that is a trusted copy on the branch, and never removes it.
- Otherwise it cuts a clone through `create-worktree.sh --existing --no-bootstrap` at the derived path `<parent of main>/<projectName>-feat_x`.
- On every exit it removes what it made: the clone, the local `refs/heads/feat_x` it created, the registry record it created (when none existed before the cut), and the registry directory `<stateDir>/autonomous_logs/` when it did not exist before the cut and is empty after the drop (Task 11's `start_remove_copy` step 5; `create-worktree.sh` creates the directory when absent, Task 7).
- Its refusal lines are unchanged.

**Where this task stops.** It changes no script, and it touches only the `review` cases and the file's header rule for them. `remote-start.test.mjs` and `remote-review-payloads.test.mjs` are Task 12's.

`cli/test/remote-collect.test.mjs` needs no change, and this task does not edit it. Its header says *"`review` cuts its own working copy of `feat_x`, which `create-worktree.sh` refuses for a branch already checked out"*. That stays true under Task 7: `hr_run_copy_live_var`'s third condition, the main checkout having the branch checked out, still refuses. The suite asserts nothing about `git worktree list`, the copy's form or its record.

### Targets

- `cli/test/remote-run.test.mjs`

**Work:**

- [ ] In *"review places the next round by exact branch equality, commits it, and dispatches once"*, replace the `git worktree list` assertion with the clone equivalent. Keep the existing `existsSync(fx.copy) === false` and no-local-`feat_x` assertions. Add that the registry at `<fx.dir>/<STATE_DIR>/autonomous_logs/registry.json`, when it exists, has no `runs.feat_x` record, because the fixture had none before.
- [ ] Add one perturbation case in a `reviewFixture`: a registry record for `feat_x` that existed **before** the verb, whose `worktree` names a path that does not exist, so it is not a live copy. After a successful `review`, the record is the one seeded, byte for byte. This shows the drop removes only what `review` created.
- [ ] In *"review is refused while the newest run is in progress, or its bundle is parked; origin unchanged"*, add that no registry record for `feat_x` exists afterwards, beside the existing `existsSync(fx.copy) === false`.
- [ ] Update the header's `review` rule paragraph (the one beginning *"For `review`, the rule is that a round lands"*) to say the copy `review` cuts is a clone, and that it removes the clone, the branch and the record it created.

**Verification:**

- `npm test --workspace cli -- test/remote-run.test.mjs` passes.
- `grep -n "'worktree', 'list'" cli/test/remote-run.test.mjs` prints nothing.
- No case aims at this checkout: every fixture and its bare `origin` live under the system temp directory.
