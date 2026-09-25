### Task 6 — Semi-autonomous binding row and the autonomous flow document

**Goal:** Close the two remaining plugin sites that describe planning re-entry:

- The semi-autonomous fork's `<existing_artifact_decision>` row states which of the core's step 5 outcomes it selects, and why it never selects **continue** or **review**.
- `plugin/docs/AUTONOMOUS_FLOW.md` says in one sentence that a resumed planning run continues its saved position.

**Depends on:** Task 4 and Task 5.

- **Task 4** changes the core's `## Setup (once per session)` step 5 outcomes to **proceed fresh**, **extend**, **review**, **continue** and **skip**, and adds `## The walker — routing is its, judgement is yours` → **Continuing a saved walk.**, the mode-free rule for probing a saved walk with `current`.
- **Task 5** makes the autonomous fork's `## Override 2 — resumability` take a usable saved walk first, unless the ledger contradicts it, with the ledger winning. It makes (b) require `P1` `[x]`, and adds (d), which reviews a draft whose entry is `[ ]`. In the same commit it writes `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.7` step 4's planning sentence: `P1`/`P2` have no detail index, their within-phase position is the planning walker's saved walk as the fork's `## Override 2 — resumability` applies it, and where the walk and the ledger disagree the ledger wins. This task's flow-document sentence points at that algorithm and restates none of it.

**Where this task stops.** The rules themselves are the core's and the autonomous fork's, and §1.7 step 4 is Task 5's. The two files here only point at them, per `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` (*"A policy file is activated by pointer and never restated"*). This task does not edit `plugin/instructions/autonomous_pause_and_ledger.md`.

### Targets

- `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` — the `<existing_artifact_decision>` row of `## Mode contract — bindings`.
- `plugin/docs/AUTONOMOUS_FLOW.md` — `## Pause / resume a run`, the **Why it resumes cleanly.** paragraph.

**Work:**

- [ ] **Semi-autonomous row.** Change *"Their answer selects one of the three outcomes the core's Setup step 5 names:"* so it says the answer selects one of the core's Setup step 5 outcomes, keeping the three mappings verbatim: "extend" → **extend**, "rewrite from scratch" → **proceed fresh**, and "stop" → **skip**, which here ends the session. Add a sentence saying the row **never selects continue or review**. The reason is that this mode keeps no flow-progress ledger. A saved walk would have no durable record to be checked against, and would become the only record of progress, which the walker's state must never be. The user, asked here, is that check. Keep the closing parenthetical that points at the core's prohibitions. This is the whole semi-autonomous change. The fork's binding table, its `<terminal_handoff>` and its `## What this fork does NOT redefine` list are otherwise unchanged.
- [ ] **AUTONOMOUS_FLOW.md.** In **Why it resumes cleanly.**, after *"A resumed run reads the ledger and continues at the first `[ ]` phase"*, add one sentence covering these points:
  - Inside the planning phase, which has no per-item index, a resumed run continues the planning walker's saved position. That is the reviewer that was in flight, or the revision a `FAIL` had queued, rather than restarting or skipping the loop.
  - A draft no reviewer has passed is reviewed again, never taken as converged.
  - The ledger still wins where the two disagree.

  Cite `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` for the algorithm, as the paragraph after it already does, and restate no rule. No heading in the file changes.

**Verification:**

- `grep -n 'never selects' plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` prints the row, and `grep -n 'one of the three outcomes' plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` prints nothing.
- `git diff --name-only` for this task's commit lists no `plugin/instructions/autonomous_pause_and_ledger.md`: §1.7 step 4 is Task 5's.
- `plugin/docs/README.md`'s `AUTONOMOUS_FLOW` citer sweep still resolves. No heading of `plugin/docs/AUTONOMOUS_FLOW.md` changed: `git diff plugin/docs/AUTONOMOUS_FLOW.md` shows no line starting with `#`.
- The new flow-document sentence agrees with §1.7 step 4 as Task 5 wrote it: read the two side by side and confirm both say the saved walk is the planning position and the ledger wins.
- Three files make one consistent chain, read in this order: the semi-autonomous row (never continue or review, so no ledger check is needed), §1.7 step 4 (the planning position, and the ledger wins), and the flow document. None contradicts the core's step 5 outcome list or the autonomous Override 2.
