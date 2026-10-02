### Task 10 — Never re-dispatch a branch that is absent on `origin`

**Goal:** Implement item 5's *"Make `harness-resume.yml` and the automatic resume skip a branch absent on `origin`"*. When a branch is deleted, the resume poller (`poll`) and a job's own `continue` dispatch nothing for it: no re-dispatch, no poller enable, no notification. They print one line.

**Depends on:** Task 9, the previous editor of `cli/templates/scripts/remote-run.sh` and `cli/test/remote-run.test.mjs`. Task 9's `stop --branch-gone` stops the runs of a deleted branch. This task closes the other door, the automatic resumes that would otherwise re-dispatch it.

**Where this task stops.** `poll_branch`, `continue_redispatch` and `continue_wait_poller` only. Recognising the deletion event is **Task 11**'s, and the workflow event is **Task 13**'s.

### Targets

- `cli/templates/scripts/remote-run.sh` — a new `remote_branch_exists`, `poll_branch`, `continue_redispatch`, `continue_wait_poller`, and the header paragraphs on `continue` and `poll`.
- `cli/test/remote-run.test.mjs` — new cases.

**Work:**

- [ ] Add `remote_branch_exists <branch>`. It runs `git -C "$root" ls-remote --exit-code --heads origin "refs/heads/<branch>"`, with a fixed argument vector and no pipeline, and returns 0 when the branch is listed, 1 when `ls-remote` answers 2 (no match), and 2 on any other failure, with `GH_ERR`-style text in a variable of its own.
- [ ] `poll_branch`: after the stop check, an absent branch is `remote-run.sh: poll: <branch> no longer exists on origin; skipped` and is not waiting (return 1). Drop its poll state with `poll_state_drop` so a later branch of the same name starts clean. An unknown answer (2) proceeds as today, with one line.
- [ ] `continue_redispatch` and `continue_wait_poller`: after the stop check, an absent branch is one line (`… no longer exists on origin; not re-dispatched` / `…; the resume poller is not enabled`), with no `notify` and no dispatch. An unknown answer proceeds as today, with one line, because the dispatch itself would then fail loudly.
- [ ] Header: in the `continue` and `poll` paragraphs, the absent-branch skip sits beside the stopped-branch skip, and an unknown answer proceeds.
- [ ] `cli/test/remote-run.test.mjs`. The fixture's `origin` is a bare repository the test controls, so delete the branch there:
  - `poll` over a usage-paused branch that is due skips it, and records no `workflow run` call;
  - `continue` on a `continue` bundle records no `workflow run` call;
  - `continue` on a `wait-poller` bundle records no `workflow enable`;
  - with the branch present, each case still dispatches as before.

**Verification:**

- `npm test -- test/remote-run.test.mjs` from `cli/` passes.
- `grep -n "ls-remote" cli/templates/scripts/remote-run.sh` shows the new helper and `verb_list`'s existing call, and no `ls-remote` composed into a pipe.
- The poll tick's `POLL_WAITING_COUNT` excludes the absent branch, so a tick whose only waiting branch was deleted disables the poller, as the existing *"nothing waiting"* path does.
