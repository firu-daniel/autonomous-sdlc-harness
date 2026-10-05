### Task 8 — Add the read-only `@sdlc-harness status` command

**Goal:** Implement item 1, which is decided **yes**. `@sdlc-harness status` on the run's issue or pull request replies with four things:
- the run's state, with its pause reason and its detail when expired;
- the next unticked flow-progress ledger entry, with the section it sits under;
- the open questions;
- the latest run's URL.

It changes no label and dispatches nothing. It is accepted in every state, `none` included, and is never refused because a run is in flight.

**Depends on:** Task 7, which adds `control_state_word_var`: called with no argument right after a successful `control_state_var`, it sets `CS_STOPPED` (`1` when `CS_STATE` is one of the unfinished states `running`, `parked`, `park_loop`, `paused` and `remote_branch_stopped "$CONTROL_BRANCH"` answers 0, else `0`) and `CS_WORD` (`stopped` when `CS_STOPPED` is `1`, else `CS_STATE`; a failed stop check leaves `CS_WORD="$CS_STATE"` and prints one line). `completed`, `failed` and `none` are never renamed. This task names the state through `CS_WORD`, so a stopped run reads `stopped` here too, whichever unfinished state its bundle or run list still reports; when `CS_STOPPED` is `1` and `CS_STATE` is not `paused`, the reply adds the underlying state in Task 7's words (*"it was parked, waiting for an answer"*, *"it was held by the park-loop guard"*, *"its cancelled job is still finishing"*). Task 7 also edited `cli/test/remote-control.test.mjs` and `cli/templates/scripts/remote-run.sh` before this task.

**Where this task stops.** The verb, its mirrors and its tests:
- the documentation, §1's table and the six-command reply, is **Task 16**'s;
- the Gate 12 leg is **Task 19**'s.

### Targets

- `cli/src/remote/githubActions.ts` — `COMMAND_VERBS`, and its doc comment.
- `cli/templates/scripts/remote-run.sh` — the `COMMAND_VERBS` mirror, `control_verb_handled`, `verb_control`'s dispatch case, a new `control_status`, and the header's `control` paragraph.
- `cli/test/remote-names.test.mjs` — the mirror assertion.
- `cli/test/remote-control.test.mjs` — new cases.
- Any other `cli/test/*.test.mjs` that asserts the verb list's text. Find them with `git grep -n "clear\`" cli/test` and `git grep -n "'clear'" cli/test`. `doctor`'s `forge` line and `init`'s summary render the list from `COMMAND_VERBS` through `nameList`.

**Work:**

- [ ] `githubActions.ts`: `COMMAND_VERBS = ['answer', 'pause', 'resume', 'stop', 'clear', 'status']`, with the doc comment saying `status` is read-only. `remote-run.sh`: `COMMAND_VERBS='answer pause resume stop clear status'`. The header's declared-mirror line is already there. Add `status` to `control_verb_handled` and `status) control_status ;;` to `verb_control`'s case.
- [ ] Write `control_status`. Read the state with `control_state_var`, then `control_state_word_var`. Read the ledger from `refs/remotes/origin/<branch>:<state_dir>/flow_progress/<branch>_progress.md`; `control_check_branch` already fetched it. The next entry is the first line opening `- [ ] `, without that prefix, and its section is the last `## ` heading above it. When every entry is ticked, say so. Reply in one comment, through `control_reply "$EXIT_OK"`:
  - *"@<login>: `<branch>` is `<CS_WORD>`"*, plus `` (`<reason>`) `` when set, and `CS_DETAIL` for an expired bundle, reported as expired and never as absent;
  - the next ledger entry and its section;
  - the open questions, each with its `@sdlc-harness answer <n>` form, when any;
  - *"Latest run: <url>"* when `CS_URL` is set.

  State `none` replies *"no harness run is listed for `<branch>`"*. No `forge_set_state` and no child verb but `fetch`.
- [ ] A failed state read is a refusal through the existing pattern (`control_refuse "$EXIT_GH" … "Comment again to retry."`). An unreadable ledger leaves its line out and says so, and never fails the reply.
- [ ] Header: add `status` to the `control` paragraph's ARMS, with what it reads and that it changes nothing. Update the refusal list's *"the verb is empty, not a `COMMAND_VERBS` word"* sentence if it counts verbs.
- [ ] Tests:
  - `remote-names.test.mjs`: the six-verb assertion and the mirror line;
  - `remote-control.test.mjs`: `status` on a `parked` run names `parked`, question 1 and its answer form, the ledger's next entry and the run URL; on a `running` run it is not refused; on `none` it says no run is listed; a stopped run reads `stopped`, both for a bundle that says `running` (read as `paused`) and for one that says `parked` (with *"it was parked"* and question 1 still listed); and the `gh` stub records **no** `labels` write and **no** `workflow run` call in any case;
  - the unknown-verb reply lists `@sdlc-harness status`;
  - fix every other suite's asserted verb list that the grep finds.

**Verification:**

- `npm test -- test/remote-names.test.mjs` and `npm test -- test/remote-control.test.mjs` from `cli/` pass, plus each other test file this task edited for the verb list, run by name.
- The configured type check, `bash scripts/typecheck.sh` from the checkout root, passes. `COMMAND_VERBS` is `as const`, and `CommandVerb` widens with it.
- `git grep -n "answer pause resume stop clear" cli/templates` finds only the six-verb mirror.
