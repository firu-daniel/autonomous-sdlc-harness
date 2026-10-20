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

- [ ] `remote-start.test.mjs`: replace each *"neither the sibling copy, its `git worktree list` entry, nor `refs/heads/feat_x` remains"* assertion with the clone equivalent: no derived directory, no `refs/heads/feat_x`, and no registry record for `feat_x` when none existed before.
- [ ] `remote-start.test.mjs`: the case that registers a working tree, so that `git worktree remove --force` would delete it were the guard gone, moves to a pre-existing clone at the derived path with its own record. Assert that the verb refuses on the live copy and leaves the clone, its record and the branch intact. Keep one legacy case with a pre-existing linked worktree at the derived path, refused the same way.
- [ ] `remote-review-payloads.test.mjs`: each payload is now planted in the clone `review` cuts, or in the mirror. Where a plant was worktree-only (a record's `config.worktree`), plant its clone equivalent: the clone's `.git/config.worktree`, `.git/commondir` or a `.git/config` key off the allow-list, each of which the clone trust check refuses. Keep the worktree plant as a legacy-mirror case only where the mirror is a linked worktree.
- [ ] `remote-review-payloads.test.mjs`: case C1 (`create-worktree.sh --existing`'s tip surface check skipped) still asserts the verb's own refusal. Make sure the cut copy is removed afterwards in every refused case.
- [ ] Update both headers' rule and `RED ONCE` notes for the clone layout.

**Verification:**

- `npm test --workspace cli -- test/remote-start.test.mjs` passes.
- `npm test --workspace cli -- test/remote-review-payloads.test.mjs` passes.
- No case aims at this checkout: every fixture and its bare `origin` live under the system temp directory.
