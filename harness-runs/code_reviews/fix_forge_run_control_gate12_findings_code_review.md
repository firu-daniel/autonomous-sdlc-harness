# Code Review: fix_forge_run_control_gate12_findings

## Context

**Branch:** `fix_forge_run_control_gate12_findings`
**Date:** 2026-10-02
**Reviewed:** the whole branch diff against `dev` (27 files, +2483/−266). The scope is the story index's 20 tasks:

- Item 7, the archive set: `launch_answered_set`, `top_level_answered_pairs` and the `classify_run_exit` union in `cli/templates/scripts/autonomous-watcher.sh`.
- Item 3 and item 10: the question comment drops lines naming `answer_<n>.md` and gains a copy block (`forge_question_body`). A `parked` report with no open question posts nothing.
- Item 12, the pause note scoped in job mode: `pause_note_stale`, and `hr_remote_move_aside` in `cli/templates/scripts/lib/harness-run-lib.sh`.
- Item 9: the `wrong-ref` job in `harness-run.yml`.
- Item 11: `stopped` naming in every `control` reply.
- Item 1: the read-only `status` verb.
- `stop --note/--pr/--branch-gone`.
- The skip of a branch absent on `origin` in `continue` and `poll`.
- Item 5: the close and deletion stop in `control_close`, with the `issues`, `pull_request` and `delete` triggers in `harness-control.yml`.
- Item 2: the `|| [ $? -eq 2 ]` mapping.
- The plugin clarification-channel and pause-protocol edits.
- The `docs/` and `ARCHITECTURE.md` updates.
- The new and extended suites under `cli/test/`.

28 run-artifact files excluded from the reviewed diff.

**Headline.** Every behaviour change ships with a `gh`-stub or fixture case: `remote-control-close.test.mjs`, `watcher-remote-park-sequence.test.mjs` (the four multi-job sequences), the `hr_remote_move_aside` case in `outer-loop-scripts.test.mjs`, and the workflow-template assertions. This review ran no suite; whether they pass is for the Run gates phase to establish. The shell verbs' header paragraphs were read against their code and match, apart from the three places the findings below amend. `COMMAND_VERBS` is extended in `cli/src/remote/githubActions.ts` and in its declared mirror in `remote-run.sh` together, and `remote-names.test.mjs` pins both. The `init` and `doctor` texts and the pull-request body derive the verb list from that constant. The Pass 0 sweep of added lines found no `console`, `process.exit`, shelled-out recursive removal, `git add -A` or line-number coordinate outside test `gh` stubs. Every new shell function has a caller. Parity is off (`phases.parity: false`), so no parity review applies.

**The `plugin` layer (three files: `task_plan_writing_instructions_autonomous.md`, `autonomous_pause_and_ledger.md`, `plugin/docs/AUTONOMOUS_FLOW.md`).** `.claude/context/plugin.md` treats the clarification-file shape as a wire (`## The placeholder vocabulary`). It also says a wire change is checked by the grep that re-derives its readers (`## Verifying a change in this layer`). Two greps were run under `plugin/`.

- **Readers of the consume-then-archive contract:** `grep -rnE 'answered/|onsume-then-archive|archiv' plugin`. Each reader found was checked against the rewritten **Consume-then-archive** bullet, which now archives *"every pair answered at the top level when that session launched"*.
  - `plugin/instructions/task_plan_writing_instructions_autonomous.md` → Override 2(a) reads every top-level pair, so it agrees.
  - `plugin/instructions/clarification_digest_instructions.md` → `## What is digested` reads both the top level and `answered/`, so it agrees.
  - `plugin/commands/branch-answer.md` steps 4–6 only write `answer_<n>.md` and leave the lifecycle to the contract, so it agrees.
  - `plugin/instructions/plan_orchestration_instructions_autonomous.md` and `plugin/instructions/user_review_fixes_instructions_autonomous.md` cite the contract without restating it, so they agree.
  - `plugin/docs/AUTONOMOUS_FLOW.md`, as rewritten, agrees.
  - `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → the Override 2 `(a)` bullet **disagrees**. It deliberately leaves a Phase A/QA/D pair unconsumed, and the fix-implementation **On resume** paragraph reads such a pair only when that phase reaches the blocked item. So a session that exits other than by a pause before then has that pair archived unread. The new justification sentence says this cannot happen (Finding 6).
- **Readers of the `PAUSE_PROGRESS.md` keep rule:** `grep -rn 'PAUSE_PROGRESS' plugin`.
  - `plugin/commands/branch-resume.md` → `## Context` and `plugin/commands/branch-pause.md` describe the local watcher, which still keeps the note; their GitHub routes state no keep rule. Both agree.
  - The forks' PAUSE checks only append to the note, so they agree.
  - `plugin/docs/AUTONOMOUS_FLOW.md` → the pause section names no keep rule, so it agrees.
  - The new job-mode rule in `autonomous_pause_and_ledger.md` → `### 2.3 Resuming` matches the `autonomous-watcher.sh` header and `docs/remote-execution.md`.
- **The new "names no answer channel" rule** has no reader that tells a question file to name a channel. The `<escalate>` reroutes in both orchestration forks defer the format to the canonical section, so they agree.

The one Must Fix is cross-event. Deleting a run's branch while its pull request is open also closes that pull request, and the `pull_request` job stops through the deleted ref and fails red (Finding 1).

**Pass 2:** the per-unit findings root `harness-runs/task_plan_point_reviews/fix_forge_run_control_gate12_findings_task_plan/` does not exist, so no per-unit review was written, and the reconciliation carried nothing over.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else (sub-step bullets inside the per-finding files) are informational only.

1. [x] **Finding 5** — Restore the column alignment of the `actions: write` permissions comment line in `harness-control.yml` _(layer: cli)_
2. [x] **Finding 4** — State in `harness-control.yml`'s prefilter paragraph that every closed same-repository pull request also starts a job _(layer: cli)_
3. [ ] **Finding 6** — Make the consume-then-archive bullet's consumption claims true for the user-review-fix flow's Phase A/QA/D pairs _(layer: plugin)_
4. [ ] **Finding 2** — Fail a close whose permission check failed with `::error::` and exit 3, instead of ignoring it as unauthorised _(layer: cli)_
5. [ ] **Finding 3** — Give a closed pull request's `stopped` comment a way on that works there (reopen first, or use the issue) _(layer: cli, general)_
6. [ ] **Finding 1** — Ignore a pull-request close whose head branch is already gone from `origin`, leaving the `delete` job to stop the run _(layer: cli, general)_

---

## Must Fix

### 1. Deleting a run's branch while its pull request is open also fires a `pull_request: closed` job, which stops through the deleted ref and fails
→ [finding_1.md](fix_forge_run_control_gate12_findings_code_review/finding_1.md)

---

## Should Fix

### 2. A failed permission check on a close is logged as "not authorised" and exits 0, so an authorised close silently stops nothing
→ [finding_2.md](fix_forge_run_control_gate12_findings_code_review/finding_2.md)

### 3. The `stopped` comment on a closed pull request tells the reader to comment `resume` there, which is refused on a closed pull request
→ [finding_3.md](fix_forge_run_control_gate12_findings_code_review/finding_3.md)

### 6. The new consume-then-archive justification says every top-level answered pair is consumed on re-entry, but the user-review-fix flow reads a Phase A/QA/D pair only when its fix-implementation phase reaches the blocked item
→ [finding_6.md](fix_forge_run_control_gate12_findings_code_review/finding_6.md)

---

## Nice to Have

### 4. The prefilter paragraph names branch deletions as the one event that starts a job for any branch, but every same-repository pull-request close does too
→ [finding_4.md](fix_forge_run_control_gate12_findings_code_review/finding_4.md)

### 5. The `actions: write` line of the permissions comment lost its column alignment
→ [finding_5.md](fix_forge_run_control_gate12_findings_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None. `phases.parity` is `false`, so there is no reference implementation to diverge from. The split of items 4, 13 and 6 into a follow-up branch is authorised by the task prompt's own *"If the plan judges the whole set too large for one branch, it says so and proposes a split"*. The story index's `## Follow-up task prompt` and roadmap row 19 in `docs/development.md` → `## 6.` both carry it.
