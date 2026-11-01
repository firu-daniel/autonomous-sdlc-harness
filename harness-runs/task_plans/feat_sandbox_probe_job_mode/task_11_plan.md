### Task 11 — Take the wrappers leg's prefix and compound rows on the checkout in job mode

**Goal:** In job mode the `wrappers` leg (`scripts/lib/sandbox-probe/legs-wrappers.sh`) takes its job rows P1c, CW5, P1b and CW6 on the checkout itself. These are the compound and assignment-prefix calls on the checkout's own wrappers, aimed at the checkout, which reach its origin over the HTTPS remote `actions/checkout` sets up. Its clone-arm rows do not carry over: CS4 (the main checkout's wrappers landing on a clone), and P3 and CW2 (the clone's own copies). Each is printed `not run`, *clone layout only*. Every expected result stands as the rows state it in `docs/sandbox-verification.md` §3: the compound and both prefixes stay sandboxed or are neutralised, and each call is allowed through its own exact `--allowedTools` rule.

**One row reads differently over HTTPS.** P1b's prefix is `GIT_SSH_COMMAND=<helper>`, whose helper drops a marker when SSH runs. Over an HTTPS remote git never runs `GIT_SSH_COMMAND`, so the marker's absence proves nothing. In job mode P1b is graded on `ls-remote` alone, unchanged or moved. The marker is recorded, and the evidence says the remote's scheme and that the marker cannot fire over it. P1c, CW5 and CW6 are graded as today.

**Depends on:**

- **Task 1:** the job rows `P1c,CW5,P1b,CW6`, `SP_JOB_MODE`, and `sp_job_skip_clone_rows <leg>`. In job mode `sp_result_line` refuses any verdict but `not run` for a non-job row.
- **Task 2:** `sp_job_git_note`, which prints `; read before the placeholder sweep` in job mode, appended to each row's evidence, because each reads refs or `ls-remote`. In job mode `SP_CLONE` and `SP_MAIN` are the checkout, and `SP_BRANCH` is the probe branch, checked out and published to origin **without** an upstream. A push that runs excluded and lands would add `--set-upstream` and change `<checkout>/.git/config`, which the `shasum` guard watches. That is already a `fail` for each of these rows, and the guard's `FAILED` line then names the same event.

It reuses, unchanged: `sp__wr_seed`, `sp__wr_session`, `sp__wr_reached`, `sp__wr_push_held`, `sp__wr_commit_held` and `sp__wr_cw6_grade`, which read `SP_CLONE` and `SP_BRANCH` and so act on the checkout in job mode.

**Where this task stops.** It edits `legs-wrappers.sh` only. Tests are Task 21's.

### Targets

- `scripts/lib/sandbox-probe/legs-wrappers.sh`

**Work:**

- [ ] **`sp_leg_wrappers` in job mode.** First `sp_job_skip_clone_rows wrappers`, which prints CS4, P3 and CW2 `not run`. Then run only the sessions that carry P1c, CW5, P1b and CW6. The CS4 session and the clone's-own-copy calls (P3, CW2) are not launched, so no clone-only call is issued. With `SP_JOB_MODE` at `0`, the leg is byte-for-byte as today.
- [ ] **P1b over HTTPS, in job mode only.** Read the remote's URL once with `git -C "$SP_MAIN" remote get-url origin`. When `SP_JOB_MODE` is `1` and it is not an SSH URL (`git@…:` or `ssh://`):
  - P1b's verdict is the `ls-remote` judgement alone: unchanged → `pass`; moved → `fail`; a permission-layer refusal → `not run`, as today;
  - the evidence adds *origin is <scheme>, so GIT_SSH_COMMAND is never run and the marker is recorded, not graded: <present|absent>*.

  An SSH origin in job mode, and every origin in the clone layout, the container's HTTPS clone included, grades P1b exactly as today.
- [ ] **Every job-mode row's evidence** ends with `sp_job_git_note`.
- [ ] **The header** gains a *JOB MODE* paragraph: the four job rows, the three clone-only rows, P1b's HTTPS reading, and the `.git/config` consequence above.

**Verification:**

- The type check passes.
- `git diff scripts/lib/sandbox-probe/legs-wrappers.sh` shows every change behind an `SP_JOB_MODE` test, and no grading function's existing arms changed.

**Deviations from plan:**

- The SSH test matches `ssh://`, `git+ssh://`, `ssh+git://` and any scp-like `user@host:path`, not only `git@…:` and `ssh://`: a non-`git` scp-like user is SSH too, and reading it as HTTPS would skip grading the marker. For a `scheme://` origin the evidence names the scheme only, so a credential in an HTTPS URL is never printed.
- The `sp_job_git_note` appends at the result-line call sites carry no `SP_JOB_MODE` test of their own: `sp_job_git_note` tests it and prints nothing outside job mode, so clone-layout output is byte-for-byte unchanged. The URL read and the two new P1b arms are behind an explicit `SP_JOB_MODE` test (`unread` is empty otherwise). No arm of `sp__wr_reached`, `sp__wr_push_held`, `sp__wr_commit_held` or `sp__wr_cw6_grade` changed.
- A row that `sp_row_result` downgrades to `not run` because its control failed carries `controls.sh`'s own evidence, without the note; `controls.sh` is outside this task's target.
- Verification: `bash scripts/typecheck.sh` (the configured `commands.typecheck`) ran and printed `PASS: typecheck`, its shell-parse check covering this file under `/bin/bash` 3.2. A bare `bash -n` on the file was refused by the permission layer; the typecheck's parse check stands in for it. No test ran: tests are Task 21's.
</content>
</invoke>
