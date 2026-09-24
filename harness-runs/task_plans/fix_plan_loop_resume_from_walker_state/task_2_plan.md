### Task 2 — Tests: a resumed planning walk continues where it stopped, and falls back only when nothing is pending

**Goal:** Pin, against the walker that `init` writes into a throwaway fixture, every walk sequence the rewritten re-entry rules prescribe:

- a reviewer in flight is re-dispatched;
- a revision that a `FAIL` queued is re-dispatched with its findings file;
- a UI reviewer in flight is re-dispatched rather than the UI plan being rewritten;
- a parked `<ask>` resumes at the writer that parked;
- a finished walk is recognised as finished and replaced by the ledger's fallback;
- a draft with no saved walk is reviewed, and neither skipped nor rewritten;
- a `ledger: P1` line printed again flips nothing twice.

**Depends on:** Task 1. That task adds `business_parity_review` and `ui_review` to the graph's `entries`, so `start --entry business_parity_review` and `start --entry ui_review` are accepted. It also documents in the walker's header that `current` is read-only and that what it prints shows the saved `awaiting` value: `action: dispatch` for dispatch, `binding: <ask>` for answer, and any other `binding:` for done. This task drives those behaviours and changes neither file.

**Where this layer stops.** The walker cannot see the ledger or the plan artifacts, so this suite pins the **walker half** of each rule: what `current` prints for each saved state, what continuing with `next` produces, and what the fallback `start --entry …` produces. The orchestrator's choice between those, using the ledger and whether an artifact exists, is prose. Task 4 owns it in the planning core and Task 5 in the autonomous fork. Every expectation cites that prose **by heading and by quoted substring**, using the exact phrases listed below. Tasks 4 and 5 are required to write these phrases verbatim and to check each one with `grep -F`, so a citation here always resolves.

**The quoted substrings this suite cites, and their owners.** Cite each phrase exactly as written here:

- `plugin/instructions/task_plan_writing_instructions_core.md` → `## The walker — routing is its, judgement is yours` → **Continuing a saved walk.** (Task 4):
  - "`action: dispatch` — a dispatch was pending when the last session ended"
  - "the counter and every `review_<n>` series carry on"
  - "`binding: <ask>` — a writer's `## Questions` parked the walk"
  - "any other `binding:` — the walk finished"
  - "exit 1 — no walk of this flow is saved for this branch"
- `plugin/instructions/task_plan_writing_instructions_core.md` → `## Setup (once per session)` step 7 (Task 4): "**review** gives the first gate of the loop whose draft no reviewer has passed"
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` (Task 5): "Skip the task-plan write loop only when `P1` is `[x]`" and "send the draft back through review — never rewrite it, never skip it"
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 5 — pause/resume + flow-progress ledger (planning half)` (Task 5): "A `ledger:` line the walker prints again is re-applied"
- `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch`, text that already exists: "**Idempotency:** re-flipping an already-`[x]`"

### Targets

- `cli/test/flow-walker-resume.test.mjs` (new) — a sibling suite, named per `.claude/CLAUDE.md` → `## File naming conventions` (*CLI test suite*: `cli/test/<kebab-case>.test.mjs`).

**Work:**

- [ ] **Header and shared builders.** Open the file with the rule it enforces, in the words of `.claude/context/conventions.md` → `## The testing bar`: *"a planning (re-)entry continues a saved walk where the last session stopped — the loop counter, each findings folder's `review_<n>` series, the prompt variant and the recorded findings file all carry over — and falls back to the ledger's `start --entry …` only when no walk is pending; every expected action is a literal written here, citing the rewritten rule by heading and quoted substring, never read out of the graph."* State in the header, as a behaviour this suite deliberately does not cover, that the choice between continuing and falling back uses the ledger and whether artifacts exist. That choice is the orchestrator's prose, and the walker cannot observe it. Import `run`, `walk`, `walkerFixture`, `walkerStatePath`, `walkerUnavailable`, `stateDirOf` and `WALKER_FLOW` from `./helpers/walker.mjs`, and `runGit` / `runBash` from `./helpers/fixture.mjs`. Define `writer`, `architecture`, `planReview`, `uiWriter`, `uiReview` and `heartbeat` builders locally, in the same shape as `cli/test/flow-walker-ui-and-reentry.test.mjs`. That suite keeps its builders file-local, and `.claude/context/cli.md` → `## Not determined` leaves sharing them unsettled. Add an `assertCurrentUnchanged(dir, expected)` helper: it calls `current`, asserts exit 0, `action` deep-equal to `expected`, and the state file byte-identical before and after. Use `phases: { parity: false, qa: true }` unless a case says otherwise.
- [ ] **Task-plan loop in flight.** Three cases:
  - **(1) Reviewer in flight.** Drive `start`, `returned`, an architecture `FAIL` (plant `architecture_reviews` `review_0`), `returned`, `PASS`. `plan_review` is now pending as `planReview(0, 1)`. That is the pause point. `assertCurrentUnchanged` against `planReview(0, 1)` ("`action: dispatch` — a dispatch was pending when the last session ended"). Then `next FAIL` (plant `task_plan_reviews` `review_0`) prints `writer(2, …task_plan_reviews/…/review_0.md)`, and `returned` prints `architecture(1, 2)`. The heartbeat's counter is 2, not 0, and the architecture index is 1 ("the counter and every `review_<n>` series carry on").
  - **(2) Pause after a `FAIL`.** Drive to a `plan_review` `FAIL`, which leaves the writer's revision pending. `current` re-prints `prompt: revision` and `arg.findings_file:` with the exact path the `FAIL` recorded.
  - **(3) Repeated ledger line.** Drive `TO_UI_LOOP` (`start`, `returned`, `PASS`, `PASS`) so `ui_writer` is pending with `ledger: P1`. Call `current` twice. Each call prints exactly one `ledger` / `P1` pair, both calls are byte-identical, and the state is unchanged. Then, in the same fixture:
    - check out `feat_x` with `runGit` (`checkout -q -b feat_x`);
    - write `<stateDir>/flow_progress/feat_x_progress.md` with the line `- [x] P1.`;
    - run `runBash(dir, ['scripts/commit-on-branch.sh', '--repo', dir, '<stateDir>/flow_progress/feat_x_progress.md', '--', 'chore: Flow progress P1 for feat_x'])` and assert status 0;
    - read `git rev-parse HEAD`, run the **identical** call again, and assert status 3 and that `HEAD` is unchanged ("A `ledger:` line the walker prints again is re-applied"; §1.6 "**Idempotency:** re-flipping an already-`[x]`").
- [ ] **UI loop in flight, and a parked `<ask>`.** Two cases:
  - **(4) UI reviewer in flight.** Drive `TO_UI_LOOP`, then `returned`, a UI `FAIL` (plant `ui_test_plan_reviews` `review_0`), `returned`. `uiReview(1, 1)` is now pending. `assertCurrentUnchanged` against `uiReview(1, 1)`. Then `next PASS` prints the `<terminal_handoff>` binding with `report: ui_test passed` and `ledger: P2`. Assert that no action printed after the pause carries `node: ui_writer` with `prompt: initial`: the UI plan was not rewritten.
  - **(5) Parked `<ask>` from `ui_writer`.** Drive `TO_UI_LOOP`, `returned`, a UI `FAIL` (`review_0`), then `questions`. The walker prints `action: binding`, `binding: <ask>`, `node: ui_writer`, `agent: ui-tests-plan-writer`, `resume: ui_writer`. `assertCurrentUnchanged` against that action ("`binding: <ask>` — a writer's `## Questions` parked the walk"). Then `next answered` prints `uiWriter(1, …ui_test_plan_reviews/…/review_0.md)`: the stored `revision` variant, the recorded findings file, and the counter still at 1.
- [ ] **Finished walk, and no saved walk.** Two cases:
  - **(6) Finished walk.** Drive the plan loop to its cap: five `plan_review` `FAIL`s, planting `task_plan_reviews` `review_0` to `review_4`. `current` exits 0 and its second line is `binding: <escalate>` ("any other `binding:` — the walk finished"). `next --outcome PASS` is refused with exit 1 and the state is byte-identical. Then the ledger fallback, `start --entry business_parity_review`, prints `architecture(0, 0)` with `skip: business_parity_review skipped`. The counter is back at 0. Repeat the classification for a walk finished at `<terminal_handoff>`, driven through `TO_UI_LOOP` plus `returned` and `PASS`: `current`'s second line is `binding: <terminal_handoff>`.
  - **(7) No saved walk, draft on disk.** In a fresh fixture, plant `<stateDir>/story_plans/feat_x_story_plan.md` as the draft. `current` exits 1, stdout is empty, stderr is one `flow-walker:` line, and no state file is written ("exit 1 — no walk of this flow is saved for this branch"). The fallback `start --entry business_parity_review` ("send the draft back through review — never rewrite it, never skip it"; "**review** gives the first gate of the loop whose draft no reviewer has passed") prints `architecture(0, 0)` with the parity skip. It prints no `node: plan_writer` and no `node: ui_writer`. A following `FAIL` prints `writer(1, …)` with `prompt: revision`, never `prompt: initial`. Also run the same fallback in a `parity: true` fixture, where the first action is `node: business_parity_review`, and `start --entry ui_review` in a `qa: true` fixture, where the first action is `uiReview(0, 0)`.
  - Close the file with a comment table mapping the task prompt's `## Verification` list to the cases: reviewer in flight → (1); pause after a `FAIL` → (2); UI reviewer in flight → (4); parked `<ask>` → (5); finished walk → (6); no state, draft on disk → (7); repeated ledger line → (3).

**Verification:**

- `bash scripts/test.sh` exits 0 with every case in `cli/test/flow-walker-resume.test.mjs` passing, and no existing suite regressing.
- Every expected action in the file is a literal built by the local builders. None is read from `task_plan_writing.graph.json`: `grep -n "graph.json\|WALKER_GRAPH_PATH" cli/test/flow-walker-resume.test.mjs` prints nothing.
- Every quoted substring the file cites appears in the list above, character for character. Tasks 4 and 5 check the owning side of each one with `grep -F`.
- No fixture is created inside this checkout: every fixture comes from `walkerFixture`, which builds under the system temp directory and tears down in process.
