### Task 4 — `hr_push_landed` tells a moved remote from a refused push, and `start` and `review` name which

**Goal:** When a placement's push does not land, the reason a person reads names what happened. Either the remote refused the push, or `origin/<branch>` moved to a commit this branch does not have. It never says `origin/<branch> is not HEAD`.

Gate 12 round 8, finding 2, is the evidence. The `collect` job's round placement was refused server-side (`remote: fatal error in commit_refs`). The branch tip `44fcc26` had not moved and nothing else had pushed. The pull request was still told *"…could not start the next round: … (origin/feat_invoices_5 is not HEAD)"*, which reads as a moved remote.

**Depends on:**
- **Task 3.** `push-branch.sh` now retries a refused push up to three attempts and never retries a `[rejected]` one. It still exits 0 on every path, so its status is still never the answer, and this task tells the cases apart by refs alone.
- **Task 2**, which edited the bundle-schema comment in `lib/harness-run-lib.sh`.
- **Task 1**, which edited `remote-run.sh`'s header exit map.

**Where this task stops.** This task changes `hr_push_landed`, the library header's write fence that covers it, and the messages of two of its three callers, `verb_start` and `verb_review`. The third caller is `cli/templates/scripts/autonomous-watcher.sh` → `remote_commit_and_push`, the inbox pass's `if ! hr_push_landed "$PUSH_BRANCH" "$worktree" "$branch" >>"$log_path" 2>&1`. It treats `1` and `2` alike, as a push that did not land, which stays correct, and it is **not edited**. After this task it also fetches `origin/<branch>` after a failed landing, through the same function, and the amended fence entry states that. `collect`'s pull-request comment quotes `review`'s last stderr line, so it gains the new wording without an edit here. Its own text, and the offer to re-run `collect`, are **Task 8's**.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`:
  - `hr_push_landed` and its comment;
  - the header's enumerated write-fence list, entry 4 (`THE ARTIFACT PLACEMENT`).
- `cli/templates/scripts/remote-run.sh`:
  - the two `hr_push_landed … || placement_fail / review_fail "pushing $branch (origin/$branch is not HEAD)"` call sites in `verb_start` and `verb_review`;
  - the header paragraph `WHAT IT NEVER DOES.`, its `start` and `review` write clauses only. **Task 7** later amends that paragraph's `fetch`, `status`, `sync` and `control` clauses, and **Task 8** its `collect` clause; this task touches neither.
- `cli/test/outer-loop-scripts.test.mjs`: the `hr_push_landed` cases.
- `cli/test/remote-start.test.mjs`: the refused-push case, and a moved-remote case.

**Work:**

- [ ] **`hr_push_landed <push_wrapper> <worktree> <branch>`.** The interface Tasks 4 and 8 rely on:
  - `0` — `HEAD` and `refs/remotes/origin/<branch>` both resolve and are equal, as today;
  - `2` — the remote moved: after a failed landing, `git -C <worktree> fetch --quiet origin "+refs/heads/<branch>:refs/remotes/origin/<branch>"` succeeds, and `refs/remotes/origin/<branch>` resolves to a commit that is not an ancestor of `HEAD` (`git merge-base --is-ancestor` fails). Set `HR_PUSH_REMOTE_TIP` to that commit's short id;
  - `1` — every other failure: the push was refused, the fetch failed, or a ref did not resolve.

  A sourced library sets no shell options, so the function uses only `return`. Rewrite its comment to state the three answers and that it never retries or rebases. The retry lives in `push-branch.sh`.
- [ ] **The header's write fence, entry 4, and `remote-run.sh`'s `WHAT IT NEVER DOES.`** The fetch is a network read and a forced write of a remote-tracking ref, made by the library function itself rather than by a caller-named wrapper, so the fence as written no longer holds. Amend entry 4 (`THE ARTIFACT PLACEMENT`) so it names the one extra write: `hr_push_landed`'s fetch of `refs/remotes/origin/<branch>` in `<worktree>`, made only after a failed landing, to name the commit the remote moved to. Keep its "Written only by `hr_place_artifact`, `hr_commit_placed` and `hr_push_landed`" sentence. Leave the `THE ARTIFACT PLACEMENT` section banner's `THE CONTRACT.` paragraph as it is: "landed" still means `origin/<branch>` equal to `HEAD`.

  The same write reaches `remote-run.sh`'s header paragraph `WHAT IT NEVER DOES.`, which enumerates each verb's writes. Its clauses "`start`'s writes are the prompt committed on `origin/<branch>`, through a working copy and a local branch it removes before it returns" and "`review`'s are the round committed on `origin/<branch>`, through …" become false. Add to each: after a push that did not land, a fetch that force-writes `refs/remotes/origin/<branch>` (`hr_push_landed`'s, to name the commit the remote moved to). Edit only those two clauses.
- [ ] **`verb_start` and `verb_review`.** Capture the status (`status=0; hr_push_landed … >&2 || status=$?`), then fail with:
  - `2` → `pushing $branch: origin/$branch moved to $HR_PUSH_REMOTE_TIP, which this branch does not have (something else pushed)`;
  - `1` → `pushing $branch: the remote refused the push (push-branch.sh names the refusal above)`.

  Each goes through the existing `placement_fail` or `review_fail`. Their messages still read `… failed at pushing <branch>…`, and `remote-start.test.mjs` already matches that prefix.
- [ ] **`outer-loop-scripts.test.mjs`.** Beside the existing `hr_push_landed` cases (the `push-nothing.sh` stub gives `1`; the real push gives `0`), add:
  - a stub push wrapper that pushes nothing while origin's branch is an ancestor of `HEAD` returns `1`;
  - origin's branch advanced by another clone's commit, with the real `push-branch.sh` and `PUSH_RETRY_DELAY_SECS=0`, returns `2`, and `HR_PUSH_REMOTE_TIP` echoes that commit's short id.
- [ ] **`remote-start.test.mjs`.** The existing case *"…rejects the one carrying the prompt commit"* also asserts stderr matches `the remote refused the push`. Add a case where origin's `feat_x` gains a commit from another clone between the cut and the push. A `pre-receive` hook can't do this, so run the cut through `create-worktree.sh`, push from a second clone, then run `start` against the existing remote branch, or use whatever the suite's helpers allow. Assert exit 4, `moved to`, nothing dispatched, and nothing left behind (`f.assertNothingLeft()`). If the suite cannot stage a moved remote without a new helper, cover `2` in `outer-loop-scripts.test.mjs` alone, and say so in your return.

**Deviations from plan:** The moved-remote `start` case stages the move with a `post-receive` hook on the fixture's bare origin (on the cut's creating push of `feat_x`, it lands a `someone else` commit on top), not with a second clone, so no new helper was needed and `2` is covered in both suites. `outer-loop-scripts.test.mjs`'s moved case does use a second clone, as planned.

**Verification:**

- `npm test --workspace cli -- test/outer-loop-scripts.test.mjs` and `npm test --workspace cli -- test/remote-start.test.mjs`, from the repository root, pass.
- `bash scripts/typecheck.sh` exits 0.
- Grep `cli/templates/scripts` for `is not HEAD`: none.
- Read `harness-run-lib.sh`'s header fence entry 4 against the new `hr_push_landed`: every write the function makes, the fetch's remote-tracking ref included, is named there.
- Read `remote-run.sh`'s `WHAT IT NEVER DOES.` `start` and `review` clauses: each names the remote-tracking ref the landed check fetches after a failed landing.
