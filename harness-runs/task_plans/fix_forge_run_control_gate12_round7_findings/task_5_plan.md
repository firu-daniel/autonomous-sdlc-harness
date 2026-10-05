### Task 5 — `forge_report` posts nothing for any job event a stop has overtaken

**Goal:** Nothing from a stopped job may change a label or post a lifecycle comment.

Gate 12 round 7, leg (h), shows what goes wrong today:
1. The pull request was closed while a resumed job was starting.
2. The close's control job stopped the run and labelled both items `sdlc-harness: stopped`.
3. One second later, the job's watcher sent its own `resumed` report. With the pull request closed, that report fell back to the issue.
4. The issue got *"The harness run on `feat_invoices_4` resumed."* and was relabelled `sdlc-harness: running`, for a stopped run.

The root cause is in `forge_report`, in `cli/templates/scripts/remote-run.sh`. It asks `remote_branch_stopped` only for `failed`. `parked`, `park_loop`, `paused`, `resumed` and `round` are reported unconditionally.

**Decisions this task carries, from the story index.**
- **The guard covers every event a job reports:** `parked`, `park_loop`, `paused`, `resumed`, `round` and `failed`. It never covers `stopped`, which the stop itself posts. `completed`, `launched` and any unknown event return before the guard, as today.
- **A `resumed` that a stop overtook says nothing**, as `failed` already does. The existing log line `remote-run.sh: report: $br was stopped, and the stop already reported the run; nothing posted` is kept byte for byte and now covers every guarded event.
- **The guard re-lists the runs** rather than trusting the invocation's cached `ALL_RUNS`. `review` dispatches a `harness run` and then reports `round` in the same invocation, so a listing cached before that dispatch would read the branch as stopped and silence a legitimate round.
- **A listing that fails still reports**, as `failed` does today, with one stderr line naming gh's error. Failing open matters most for `paused`: `continue` already posts one `paused` naming that error, and the header's `WHY RE-DISPATCH IS NOT LEFT TO !cancelled() ALONE` paragraph promises it.
- **Not taken: sending `resumed` before the job's slow setup steps.** The prompt says this alone is not a fix, and the guard closes the window.

**Where this task stops.** It edits `forge_report`, its comment, and the header's `report` paragraph only. `control_status` and its header sentence are in this same file, but they belong to Task 6, which `**Depends on:**` this task.

### Targets

- `cli/templates/scripts/remote-run.sh`: `forge_report`, its comment, and the header's `` `report` TURNS A LIFECYCLE EVENT INTO ONE COMMENT AND ONE STATE LABEL `` paragraph.
- `cli/test/remote-report.test.mjs`: the guard cases and the suite header.
- Any further `cli/test/*.test.mjs` that the grep in the last Work bullet finds asserting an exact `gh` call list on a path that reaches `forge_report`.

**Work:**

- [ ] **`forge_report`.** Replace the `if [ "$event" = failed ]; then … fi` block with a guard that runs for every event reaching that point except `stopped`. The guard does three things in order:
  1. sets `ALL_RUNS_LISTED=0`, so `list_all_runs` re-lists;
  2. calls `remote_branch_stopped "$br"`;
  3. acts on its status:
     - **0** → the existing `report: $br was stopped, and the stop already reported the run; nothing posted` line, then `return 0`. No comment, no label call.
     - **1** → continue.
     - **2** → `echo "remote-run.sh: report: whether $br was stopped is unknown ($GH_ERR); reporting the $event" >&2`, then continue.

  The guard sits where the `failed` check sits today: after `forge_on` and `forge_repo_var`, before any target lookup. A stopped branch then costs no fetch and no `pr list`.
- [ ] **`forge_report`'s own comment.** Add one sentence saying that every event but `stopped` is withheld when the branch's newest `harness stop` run is newer than its newest `harness run` run, read from a fresh listing.
- [ ] **The header's `report` paragraph.** Replace "`failed` posts nothing when `remote_branch_stopped` finds the branch stopped, so a cancelled job never overwrites `stopped`" with the general rule:
  - every job event — `parked`, `park_loop`, `paused`, `resumed`, `round` and `failed` — posts nothing and sets no label when `remote_branch_stopped`, asked afresh, finds the branch stopped. A job that a stop overtook therefore never overwrites `stopped`;
  - a failed listing reports anyway;
  - `stopped` is never withheld.
- [ ] **`remote-report.test.mjs`.** The stub already answers `run list` from `STUB_RUN_LIST`. Plant a `harness stop feat_x` run whose `createdAt` is newer than the newest `harness run feat_x`. Then add these cases:
  - **The acceptance case.** A stop has landed between a resumed job's start and its report. `report resumed feat_x` posts no comment, makes no label call (neither `--method POST` nor `DELETE` on `/labels`), and prints the `stopped … nothing posted` line.
  - **The same case for `paused`, `parked` and `round`**, and for `park_loop`. For `parked`, plant an open question with the suite's existing helper, so the guard, not "no open question", is what silences it.
  - **A `harness run feat_x` newer than the stop.** This is a resume after the stop: `resumed` posts and sets `sdlc-harness: running`.
  - **`STUB_FAIL_ON` set to `run list`.** `resumed` still posts, and stderr names `whether feat_x was stopped is unknown`.
  - **Amend the header.** It now lists "the stop check on every job event" where it said "the stop check on `failed`".
- [ ] **Other suites that pin exact `gh` call lists.** Grep for them:

  ```
  git grep -nE "report (resumed|paused|parked|park_loop|round)|'report'|forge_report" -- cli/test
  ```

  Read each hit that asserts an exact sequence or count of `gh` calls on a path that reaches `forge_report`. The guard adds one `run list` before the target lookup, for every guarded event. Update each such assertion. A suite you edit is one you may then run (`.claude/context/conventions.md` → `## The testing bar`). Name in your return every suite you judged and left alone.

**Verification:**

- From `cli/`, run `npm test -- test/remote-report.test.mjs`. It passes. Also run each further suite this task edited, one file at a time.
- `bash scripts/typecheck.sh` exits 0.
- Grep `forge_report` for `[ "$event" = failed ]` and find no stop check gated on `failed` alone.
- The `harness-run.yml` step `Notify a cancelled job` (`report failed … || true`) still logs the same `stopped … nothing posted` line. It is the literal round 7 quoted, and this task keeps it byte for byte.
