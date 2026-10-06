### Task 6 — `docs/remote-execution.md`: a deleted branch stays deleted, and the poller's unverified schedule

**Goal:** The remote-execution design document says three things:
- `push-branch.sh` no longer pushes back a branch deleted on origin, so a run stopped by its branch's deletion does not re-create it (finding 1);
- the deletion's stop reports on the run's pull request (finding 3);
- a scheduled poller tick on a reused workflow record is not verified, and can be replaced by a hand dispatch (finding 4).

**Depends on:** Task 5, the task before this one. The facts it documents:
- **Task 1:** `push-branch.sh` skips its push when the branch tracks a remote branch (`branch.<b>.merge` set, or `refs/remotes/origin/<b>` present) and `git ls-remote --exit-code` on that remote answers `2`. It prints `… no longer has <branch>, which this checkout tracks; not pushing it back …` with the hand push that publishes it again, and exits 0. A new branch's first push is unchanged. A remote that cannot answer is pushed to as before. The `Push the branch` step still runs under `always()`.
- **Task 3:** the deletion's stop reports on each unmerged same-repository pull request of the branch still labelled `running`, `parked` or `paused`, as well as on the issue. Its wording is `docs/github-run-control.md` → `## 5.`, which **Task 5** wrote.

**Where this task stops.** Only `docs/remote-execution.md`. The round-9 record and the Gate 12 procedure are **Tasks 7 and 8**. `docs/outer-loop-verification.md` is **Task 9's**. This document's other statements of when `push-branch.sh` pushes stay true and are not edited: **Guards.**, **Central state.**, **The draft pull request is the job's, not the flow's.**, **Moving a run in flight to the new version, on purpose.**, both **Decision:** paragraphs of `### When GitHub fails or lags`, and the `## 6.` `! [rejected]` row. The story index's `## Scope register` gives each one's reason. Finding 4's cause is unknown, so nothing here calls it a GitHub defect or a harness defect, and nothing in the harness changes for it.

### Targets

- `docs/remote-execution.md`:
  - `## 1.` → step 6, **The end of the job.**;
  - `## 3.` → `### The kill switch and stopping` → **Closing or deleting stops a run too.**;
  - `### Resuming without the local watcher` → the poller bullet;
  - `## 4.` → **Push frequency — a finding, not a change.**, its last paragraph;
  - `## 6.` → one new table row.

**Work:**

- [ ] **Step 6, and Push frequency.**
  - **Step 6:** after "Under `always()`: `push-branch.sh`", add: "which pushes nothing back for a branch origin no longer has, so a run stopped because its branch was deleted does not re-create it".
  - **Push frequency:** in the paragraph after the `grep -n "Post-commit push"` block, the sentence ends "and the job's final `push-branch.sh` under `always()` retries the second whenever that step still runs". Add to it: "unless origin no longer has the branch, which that push then leaves deleted (§3, *Closing or deleting stops a run too*)". Leave the rest of that paragraph unchanged, including "Nothing was added to the flows.", which stays true.
- [ ] **Closing or deleting stops a run too.** Add a **Decision** / **Reason** pair, in the document's own form:
  - **Decision:** `push-branch.sh` never pushes back a branch this checkout tracks once its remote no longer lists it, and the deletion's stop reports on the run's unfinished pull request as well as on its issue.
  - **Reason:** Gate 12 round 9, findings 1 and 3, in [`development.md`](development.md). The cancelled job's `always()` push re-created a deleted branch, and the pull request GitHub closed with the deletion kept `sdlc-harness: running`.
  - **What it costs:** a deletion that lands between the check and the push is still pushed back, and a local branch reusing a deleted branch's name is not pushed while its stale remote-tracking ref survives. Its line names the hand push.
  - Point to `push-branch.sh` → the header's `A BRANCH ITS REMOTE DELETED STAYS DELETED.` and to `github-run-control.md` → `## 5.`, *Closed or deleted*.
- [ ] **The poller bullet.** After "The poller is a `schedule` workflow, every 30 minutes as shipped, …", add one sentence. A scheduled tick is GitHub's to deliver. Round 9 saw none in about 2.5 hours on a workflow record GitHub reused after the file was deleted and added again (§6). A tick can always be started by hand:

  ```
  gh workflow run harness-resume.yml
  ```

  Keep that command in a fenced block of its own.
- [ ] **`## 6.` table.** Add a row after the `schedule` row:
  - **Behaviour:** a `schedule` workflow whose record GitHub reused, `deleted` and then `active` again on the same path, ticks on its schedule.
  - **What rests on it:** the poller resuming a usage-paused run (§3, *Resuming without the local watcher*).
  - **Source:** not verified. Gate 12 round 9, finding 4, in [`development.md`](development.md): record `370113793` came back `active` after round 8 deleted its file, and no scheduled run followed in about 2.5 hours, while a hand dispatch ran. The cause is unknown: GitHub not re-registering the schedule, or its best-effort delays. Gate 12 (xiv)'s setup records it next round.
  - **If it is wrong:** a usage-paused run waits until the poller is dispatched by hand or until `/autonomous-sdlc-harness:branch-resume`.

  Leave the opening paragraph of `## 6.` unchanged, since this round moved no row to a *Verified* table.

**Verification:**

- The `## 6.` table keeps four columns in every row.
- The quoted `push-branch.sh` line fragment matches the script: grep `cli/templates/scripts/push-branch.sh` for `no longer has`.
- `git diff docs/remote-execution.md` touches only the sites under Targets, and the poller command sits alone in its fenced block.
- Grep the document for `always()`. Every hit that says what the end-of-job push does now names the deleted-branch exception, or is one of the unedited sites listed under **Where this task stops**.
