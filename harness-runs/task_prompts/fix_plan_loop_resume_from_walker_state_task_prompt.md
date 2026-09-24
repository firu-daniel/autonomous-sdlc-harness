`fix_plan_loop_resume_from_walker_state` closes a resume hole in autonomous planning. If a planning run pauses
or parks partway through a loop, the resumed session loses its place. It can then do one of two wrong things:
send an **unreviewed plan** on to implementation, or **redo work** that was already done. It never continues at
the step it stopped on. The walker that `feat_orchestrator_flow_graph_planning_pilot` shipped already keeps that
step on disk. The resume rules throw it away.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The fixes below
> are **candidate approaches, not instructions**. Check each one against the real code and the real contracts
> before planning it. If a better approach exists, or one of these is wrong, say so in the plan.

---

## The hole

**Scenario.** The task-plan writer has returned, and the architecture gate has passed. `task-plan-reviewer` is
now in flight. The run pauses: an operator `PAUSE`, the watcher's usage-limit `PAUSE`
(`plugin/instructions/autonomous_pause_and_ledger.md` → `### 2.0`), or an API-overload self-pause (`### 2.5`).
The story index and per-task files are untracked, and the pause tolerates that
(`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 5`, "Honoring a PAUSE during
planning"). So the pause is taken and the resume is not blocked.

**What the resumed session does, by the written rules:**

1. **The pause note is only a hint.** `PAUSE_PROGRESS.md` records "the exact next step" (§2.2a), but §1.7 step 5,
   §2.3 and the watcher's resume prompt (`cli/templates/scripts/autonomous-watcher.sh` → `pause_resume_clause`,
   "resume strictly from the committed flow-progress ledger") all make it a hint.
2. **The ledger has no finer position.** It says `P1 [ ]`, and planning has no detail index below that entry.
3. **So `## Override 2 — resumability` picks the entry.** Case (b) applies: "Story index exists with a
   complete Phase 2 Readiness list and no pending clarification". Its action is **Skip the task-plan write
   loop**. A first draft already has a complete readiness list, so (b) fires on a plan that no reviewer has
   passed.
4. **The walker starts past the loop.** `## Setup` step 7 maps **skip** to `--entry ui_writer`, or to
   `convergence`. The walker prints `ledger: P1` only on the `plan_review` → `PASS` edge
   (`cli/templates/scripts/flows/task_plan_writing.graph.json`), so `P1` stays `[ ]`.
5. **Nothing catches it until Phase D.** The whole implementation runs on the unreviewed plan. Only then does
   `### 1.8 Completion check` find `P1 [ ]` and escalate.

**If the last reviewer returned `FAIL`, it is worse.** The pause is honored at the safety-contract checkpoint
before the revision dispatch. The findings are never applied, and the next session skips the loop as above.

**The UI-test-plan loop has the same problem, in a milder form.** Suppose a run pauses while
`ui-tests-plan-reviewer` is in flight, or just before a UI revision. On resume, `P2 [ ]` sends the walk to
`start --entry ui_writer`. `start` always renders the entry with the **initial** prompt and resets the counter
(`flow-walker.sh` → `arrive "$entry" initial`). The finished UI plan is rewritten from scratch, and any pending
findings are lost. Override 2(b) also makes a loose claim about this loop: "(or, if that is also complete or
not enabled …)". That wording lets an unreviewed UI-test plan count as complete.

**What the walker already has.** `<state_dir>/.flow_walker_state` is machine-local, but it lives in the run's
worktree and survives a pause. It holds:

- the pending node and `awaiting` (`dispatch`, `answer` or `done`);
- `counter.iteration`;
- each node's prompt variant and the last findings file;
- the exact lines of the pending action, which `current` prints again unchanged.

The pilot deliberately ignores this file on re-entry. `docs/flow-graph-walker.md` → `### Item 3a` explains that
`start` resets the counter to match the pre-walker loop, which only ever held the counter in context. This task
reverses that decision for the case where the state file is present.

## What to deliver

### 1. Prefer the saved walker state on re-entry

On every planning (re-)entry, check the saved state before choosing a `start --entry`. Use `current`, because it
is read-only. When a walk for this flow and branch is in progress, continue it instead of starting a new one:

- **`awaiting=dispatch`:** run the printed dispatch again, under the safety contract as usual. This continues at
  the reviewer that was in flight, or at the writer's **revision** with its `arg.findings_file`. The counter
  and the `review_<n>` series both carry on.
- **`awaiting=answer`:** a writer's `<ask>` parked the run. Once the answers are consumed as Override 2(a)
  requires, pass `next --outcome answered`. The walker sends them to the stored `resume` node with that node's
  stored prompt variant. This path could also replace the `## Setup` step 7 mapping from **extend** to
  `plan_writer`/`ui_writer` that skeptic Finding 2 of the pilot had to add. Say whether it should.
- **`awaiting=done`:** this is not a walk to continue. The walk already ended in `<terminal_handoff>` or in an
  `<escalate>` (a cap, `error` or `blocker`), and printing that again would repeat the escalation. Fall back to
  the ledger and Override 2. Also decide whether a finished `<terminal_handoff>` walk with `P3 [ ]` should go to
  `--entry convergence`.
- **No state file, or the flow or branch refused:** fall back to the ledger and Override 2, as tightened in 2
  below.

**The ledger lines the walker prints again must be safe to repeat.** `current` repeats every line of the
pending action, including any `ledger: P1` / `ledger: P2`. A session can die after the walker printed such a
line but before the fork flipped it. Establish that re-applying the flip is harmless: an already-`[x]` entry
should give wrapper exit 3 (nothing to commit). Say so where the flip is described.

**Record the reversed decision** in `docs/flow-graph-walker.md` → `### Item 3a`. Cover the new re-entry rule,
why the counter now survives a pause, and what still resets it (`start`).

### 2. Tighten Override 2(b), for both loops

- **Skip the task-plan loop only when `P1` is `[x]`.** Never skip it because a story index exists and looks
  complete. Apply the same rule to the UI-test-plan loop: skip it only when `P2` is `[x]` or `[-]`.
- **When there is no usable walker state, re-review the draft.** If a loop's ledger entry is `[ ]`, its
  artifact exists on disk, and there is no usable walker state (a lost state file), send the draft back
  through review. Do not rewrite it or skip it.
  - **Candidate:** add the first gate of each loop to the graph's `entries`. That is `business_parity_review`,
    whose skip gates then pass the walk through to `architecture_review` as usual, and `ui_review`. Map this
    case to them in `## Setup` step 7.
  - **Revision cost:** re-running every gate costs at most one extra round, which matches the loop's existing
    "every gate runs again" rule.
- **Keep Override 2(a) and (c) unchanged**, and keep the three outcome names (**extend** / **skip** / **proceed
  fresh**) the core's `## Setup` step 5 gives. If a fourth outcome is needed for "re-review the draft", say so
  and apply it everywhere step 5 is cited.

## Establish, do not assume

- **Whether the semi-autonomous fork should also prefer the saved state.** Its `<existing_artifact_decision>`
  asks the user (extend / rewrite / stop). Decide whether "a walk is in progress, continue it?" belongs in that
  question, or whether the semi-autonomous flow is interactive enough to leave unchanged.
- **Whether a saved state can be stale in a way `current` cannot detect.** For example, an operator deleted the
  draft plan by hand, but the state is still past `plan_writer`. Also check a state file from an earlier walk
  on the same branch in the same worktree. Decide what makes a saved state unusable, and whether the walker
  or the fork checks it.
- **Whether `P1` can be `[x]` while the saved state still points into the task-plan loop**, and the reverse.
  If either is possible, name which record wins. The ledger is the durable record and must stay the only one
  (the pilot's task prompt, item 3a).
- **Every file that cites the re-entry rules you change.** At least: `## Setup` step 7 and `## The walker` in
  `task_plan_writing_instructions_core.md`, and `## Override 2` / `## Override 5` in the autonomous fork. Also
  the walker's header comment (`STATE`, and the `start` / `current` usage), `docs/flow-graph-walker.md` and
  `plugin/docs/AUTONOMOUS_FLOW.md`. Re-derive the rest with a grep. Don't rely on this list.
- **Whether the graph format and `scripts/check-flow-graph.sh` need changes** for the new entries. Check the
  reachability and entry checks in particular.

## Verification

Add walker scenario tests to `cli/test/flow-walker-ui-and-reentry.test.mjs`, or to a sibling suite named per
`.claude/CLAUDE.md`. Derive the expected sequences from the resume rules as rewritten, not from the graph. At
minimum:

- **Reviewer in flight:** a pause while `plan_review` is pending re-dispatches `task-plan-reviewer`, with the
  counter and the next `review_<n>` index both continued.
- **Pause after a `FAIL`:** the resume dispatches the writer's revision with the recorded findings file.
- **UI reviewer in flight:** a pause while `ui_review` is pending re-dispatches `ui-tests-plan-reviewer`, and
  does not rewrite the UI plan.
- **Parked `<ask>`:** a parked `<ask>` from `ui_writer`, resumed with `answered`, reaches `ui_writer`.
- **Finished walk:** a walk that ended in `<escalate>` is not printed again. Resume falls back to the ledger.
- **No state, draft on disk:** with `P1 [ ]` and no state file, a draft story index is reviewed, not skipped
  and not rewritten.
- **Repeated ledger line:** a `ledger: P1` printed again after a lost session flips nothing twice.

`bash scripts/run-gates.sh` must show no new failure. Gates 1a and 6a already fail on this branch for reasons
outside it; name them if they still do.

## Out of scope

- Every flow other than task-plan writing. The implementation, review, fix and user-review flows resume from
  their own checklists.
- The pause protocol itself (§2.0–§2.5), the watcher, and `PAUSE_PROGRESS.md`'s status as a hint.
- Any change to the loop's routing: gate order, the cap value, the skip semantics, or the escalation payload.
