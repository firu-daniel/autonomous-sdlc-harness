### Task 12 — Move `remote-start.test.mjs` and `remote-review-payloads.test.mjs` to the clone layout

**Goal:** The two suites that run `remote-run.sh start` and `review` against a real `create-worktree.sh` assert the clone layout:
- the copy each verb cut is a clone;
- after the verb, no clone directory, no branch it cut and no registry record it created remain;
- a copy, branch or record that existed before is left alone;
- the review payloads are refused by the same checks on a clone.

No assertion is left that reads `git worktree list` for a copy that can no longer appear there.

**Depends on:** Task 11, for these behaviours:
- **`start`:** cuts a clone through `create-worktree.sh --no-bootstrap`, commits and pushes the prompt, then removes the clone, the branch it cut and the registry record it created, on every exit.
- **`review`:** uses the registry record's mirror when it is a trusted copy on the branch, and never removes it. Otherwise it cuts a clone through `--existing --no-bootstrap` and removes what it made on every exit. Its refusal lines are unchanged (`the working copy (create-worktree.sh exited <n>)`).

### Targets

- `cli/test/remote-start.test.mjs`
- `cli/test/remote-review-payloads.test.mjs`

**Work:**

- [x] `remote-start.test.mjs`: replace each *"neither the sibling copy, its `git worktree list` entry, nor `refs/heads/feat_x` remains"* assertion with the clone equivalent: no derived directory, no `refs/heads/feat_x`, and no registry record for `feat_x` when none existed before.
- [x] `remote-start.test.mjs`: the case that registers a working tree, so that `git worktree remove --force` would delete it were the guard gone, moves to a pre-existing clone at the derived path with its own record. Assert that the verb refuses on the live copy and leaves the clone, its record and the branch intact. Keep one legacy case with a pre-existing linked worktree at the derived path, refused the same way.
- [x] `remote-review-payloads.test.mjs`: each payload is now planted in the clone `review` cuts, or in the mirror. Where a plant was worktree-only (a record's `config.worktree`), plant its clone equivalent: the clone's `.git/config.worktree`, `.git/commondir` or a `.git/config` key off the allow-list, each of which the clone trust check refuses. Keep the worktree plant as a legacy-mirror case only where the mirror is a linked worktree.
- [x] `remote-review-payloads.test.mjs`: case C1 (`create-worktree.sh --existing`'s tip surface check skipped) still asserts the verb's own refusal. Make sure the cut copy is removed afterwards in every refused case.
- [x] Update both headers' rule and `RED ONCE` notes for the clone layout.

**Verification:**

- `npm test --workspace cli -- test/remote-start.test.mjs` passes.
- `npm test --workspace cli -- test/remote-review-payloads.test.mjs` passes.
- No case aims at this checkout: every fixture and its bare `origin` live under the system temp directory.

**Deviations from plan:**

- (M7) in `remote-review-payloads.test.mjs` changed outcome from *placed and dispatched* to *refused*: its record names the redirected mirror, which exists, so `hr_run_copy_live_var` (the one-live-copy rule) refuses the `--existing` cut with `the working copy (create-worktree.sh exited 2)`. The case now asserts that refusal, the redirected mirror's branch unmoved, no round placed there, no copy cut, the registry unchanged and no local `feat_x`. The plan did not name this case; the change follows from the Task 1 / Task 7 rule rather than from a defect.
- Added (C3) to `remote-review-payloads.test.mjs`: a clone cut from an honest pre-existing local `feat_x`, refused at the fast-forward to a payload tip. It asserts the clone and its record removed and the pre-existing branch left at its tip, so a refusal *after* a successful cut is covered by "the cut copy is removed afterwards in every refused case". C1 only covers a refusal inside the cut.
- The clone-equivalent plants are three cases: (P1) `.git/config.worktree`, (P1) `.git/commondir`, and (P2) a `.git/config` key off the allow-list. The commondir plant names a `.git` that holds `feat_x` at the mirror's tip. A first draft named a bare `common.git`, but that stayed green under the P1 mutation, because sync-in refused it first (`the clone's refs/heads/feat_x is not one object id`).
- RED ONCE was re-measured on the clone layout for every note, through `bash scripts/scratch-run.sh harness-runs/scratch/task12_mutate.py apply|revert <name>`. Three failure modes changed from the old notes, and the headers now record what was observed. (M1) now fails on the refusal reason, the push (`origin/feat_x moved`), instead of a marker. M4's second mutation now fails on the refusal, not the exit status. (C2) now fails on exit 4 (`commit-on-branch.sh: nothing to commit`) instead of `a commit hook ran`. (C1) now has to skip the tip surface check in both `create-worktree.sh` and `hr_clone_create_var`, because the library repeats it. The two new notes in `remote-start.test.mjs`, (S1) and (S2), were measured the same way.
- Verification ran both suites through `npm test --workspace cli -- test/<name>.test.mjs`, exactly as written in the plan's two bullets. The third bullet was confirmed by reading: every fixture comes from `createFixture` or from `${dir}-*` paths under the system temp directory.
