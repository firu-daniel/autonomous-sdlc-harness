### Task 4 — Planning core: continue a saved walk, and the **review** and **continue** outcomes

**Goal:** State in `plugin/instructions/task_plan_writing_instructions_core.md`, mode-free, how a (re-)entry finds and continues a saved walk through `current`, what makes a saved walk unusable, and the two new `## Setup` step 5 outcomes and how `## Setup` step 7 maps them:

- **review** sends a draft no reviewer passed back through its loop's first gate.
- **continue** resumes the saved walk and issues no `start`.

**Depends on:** Task 1. Its graph `entries` are `["plan_writer", "business_parity_review", "ui_writer", "ui_review", "convergence"]`, so the step 7 mapping for **review** may name `business_parity_review` and `ui_review`. Its walker header states the contract this task relies on:

- `current` is read-only and re-prints the saved pending action byte for byte, including every `skip:` and `ledger:` line it carried.
- What it prints shows the `awaiting` value: `action: dispatch` is `awaiting=dispatch`, `binding: <ask>` is `awaiting=answer`, and any other `binding:` is `awaiting=done`.
- It exits 1 when no walk of this flow and branch is saved. That covers no state file, and a state file the walker refuses as another flow's or another branch's.
- Only `start` resets the counter.

**Where this layer stops, and where this file stops.** The core is mode-free and literal-free (`plugin/instructions/mode_contract.md`, rules (3) and (4)). It names **no** ledger entry id, no `Override` label and no slash command. Which fork decision selects **review** or **continue**, and the ledger checks that can overrule a saved walk, are the autonomous fork's (**Task 5**). The semi-autonomous fork's statement that it never selects either outcome is **Task 6**'s. This task only makes the core accept the checks a fork adds, in the words given below.

**Phrases this task must write verbatim.** `cli/test/flow-walker-resume.test.mjs` (Task 2) cites each one as a quoted substring, so each must appear exactly as written here, on one line:

- in `## The walker — routing is its, judgement is yours`:
  - `**Continuing a saved walk.**`
  - "`action: dispatch` — a dispatch was pending when the last session ended"
  - "the counter and every `review_<n>` series carry on"
  - "`binding: <ask>` — a writer's `## Questions` parked the walk"
  - "any other `binding:` — the walk finished"
  - "exit 1 — no walk of this flow is saved for this branch"
- in `## Setup (once per session)` step 7: "**review** gives the first gate of the loop whose draft no reviewer has passed"

### Targets

- `plugin/instructions/task_plan_writing_instructions_core.md` — `## Mode contract — bindings this file uses` (the `<existing_artifact_decision>` row), `## Setup (once per session)` steps 5 and 7, `## The walker — routing is its, judgement is yours`, `## Convergence` (one bullet).

**Work:**

- [ ] **`## The walker` — add a paragraph opening with `**Continuing a saved walk.**`**, placed after **Acting on what it prints:** and before the paragraph on a non-zero exit. Content, in this order:
  - (i) It runs where `<existing_artifact_decision>` weighs a saved walk. Issue the `current` form first, because it is read-only.
  - (ii) Four bullets read what it prints:
    - "`action: dispatch` — a dispatch was pending when the last session ended": continue by acting on the printed action exactly as **`action: dispatch`** above states. `## Safety contract` comes first, then the dispatch, and its `skip:` and `ledger:` lines are acted on too, because a printed-again `ledger:` line is the fork's to make harmless. Say that "the counter and every `review_<n>` series carry on".
    - "`binding: <ask>` — a writer's `## Questions` parked the walk": continue only where the answers to that park reach this session through `<ask>`'s channel. Pass `answered`, then dispatch the writer the walker prints, with the answers appended as `## Loop` step 1 states. The walker's `resume:` line names that writer, and its prompt variant is the one the writer parked on. Without the answers the walk is not continued.
    - "any other `binding:` — the walk finished": that is `<terminal_handoff>`, or `<escalate>` at a cap, an `error` or a `blocker`. It is **not** continued, and nothing it printed is acted on again, because acting again would repeat the escalation or the hand-off.
    - "exit 1 — no walk of this flow is saved for this branch": this is the answer, **not** a blocker. The decision falls back to its other cases.
  - (iii) A saved walk is **unusable**, whatever `current` printed, when the artifact its pending action works on is absent:
    - the story index, for `business_parity_review`, `architecture_review`, `plan_review` and a `plan_writer` whose `prompt:` is `revision`;
    - the UI-test index, for `ui_review` and a `ui_writer` whose `prompt:` is `revision`;
    - the `arg.findings_file` of any revision.

    Check each with a plain `ls` of its `## Setup` step 2 path. That checks existence without reading content, so the path-only rule still holds. An unusable walk is treated exactly as exit 1.
  - (iv) A fork may name further conditions under which a saved walk is not used. Where the fork keeps a durable record of progress, that record wins over the saved walk, which is machine-local and never a second record.
- [ ] **`## The walker` — two edits to existing sentences.** In *"**A non-zero exit is a blocker**"*, add the exception: `current`'s exit 1 under **Continuing a saved walk.** is not a blocker. Its exit 2 still is. In *"`current` is also how you recover the pending action after an auto-compaction."*, add that it is also how a (re-)entry finds a saved walk.
- [ ] **`## Setup` step 5.** Keep the three outcome names and add two:
  - **proceed fresh** (write from scratch);
  - **extend** (pass that instruction to the writer);
  - **review** (send the existing draft back through its loop's gates, neither rewritten nor skipped);
  - **continue** (a saved walk is continued where it stopped, as `## The walker` → **Continuing a saved walk.** states);
  - **skip** (this loop has nothing to do).

  Add one sentence: a fork's decision may select **continue** whether or not a story index exists, because a writer can park before it writes one. Change *"do not pick one of the three yourself"* to *"do not pick one yourself"*. In `## Mode contract — bindings this file uses`, change the `<existing_artifact_decision>` row's meaning to *"How this flow decides what to do when a story index or a saved walk already exists on (re-)entry."*
- [ ] **`## Setup` step 7.** Retitle it **Start or continue the walker.**
  - First clause: **continue** issues no `start`. Continue the saved walk as **Continuing a saved walk.** states.
  - Every other outcome picks `<entry>`. **proceed fresh** → `plan_writer`, unchanged.
  - **extend** → `plan_writer`, and the existing `ui_writer` exception stays verbatim. Append that where a saved walk parked at `<ask>` is usable, **continue** reaches the writer that parked instead, through the walker's `resume:` line. The exception is for a park at a loop's cap, which is a finished walk, and for a lost saved walk.
  - Add, verbatim, "**review** gives the first gate of the loop whose draft no reviewer has passed": `business_parity_review` for the task-plan draft, whose skip gates pass the walk to `architecture_review` as usual, and `ui_review` for the UI-test-plan draft when the task-plan loop is skipped.
  - **skip** → unchanged.
  - Keep *"A fork's own resume rule that skips a loop maps the same way."* and extend it to a fork rule that reviews a draft.
- [ ] **`## Convergence`.** In the bullet *"A key with no `report:` line was not walked this session, because `## Setup` step 7 entered past it"*, change "this session" to "by this walk". Add that a continued walk prints the keys an earlier session recorded, and that a **review** entry at `ui_review` records no task-plan gate.

**Verification:**

- Each of the seven phrases above is on one line of the core. Check each by eye against the list, and mechanically by its backtick-free tail, one `grep -F` each against `plugin/instructions/task_plan_writing_instructions_core.md`. The tails are:
  - `grep -F -- 'Continuing a saved walk.**'`
  - `grep -F -- 'a dispatch was pending when the last session ended'`
  - `grep -F -- 'series carry on'`
  - `grep -F -- 'parked the walk'`
  - `grep -F -- 'the walk finished'`
  - `grep -F -- 'exit 1 — no walk of this flow is saved for this branch'`
  - `grep -F -- 'gives the first gate of the loop whose draft no reviewer has passed'`

  Each prints a hit. Keep every command free of backticks and pipes, so an unattended run can issue it. These are the strings `cli/test/flow-walker-resume.test.mjs` (Task 2) cites.
- Mode-freedom: `grep -n -e 'P1' -e 'P2' -e 'P3' -e 'Override [0-9]' -e '/autonomous-sdlc-harness:' plugin/instructions/task_plan_writing_instructions_core.md` prints nothing, as it does before this branch. The core stays free of ledger ids, fork labels and command names.
- `bash scripts/check-flow-graph.sh` exits 0. `findings-folder-in-core` still finds every findings folder in `## Setup` step 2's table, and `cap-matches-core` still reads `5` from step 4 and `## Safety contract` step 2, both of which this task leaves byte-identical.
- Walk the chain by hand. A draft on disk with no saved walk, for which the fork selects **review**, reaches `start --entry business_parity_review` through step 7. A saved `plan_review` dispatch reaches a re-dispatch of `task-plan-reviewer` with no `start`. A saved `<escalate>` is not acted on. Each path is read off this file's text alone, with the fork's choice taken as given.
- `claude plugin validate --strict plugin` behaves as it did before this branch. It is gate `1a`, which already fails on this branch for a reason outside it; name it if it still does, and confirm no new message is added.
