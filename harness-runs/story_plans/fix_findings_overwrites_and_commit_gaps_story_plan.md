# Story: Fix findings-file overwrites, uncommitted run artifacts and caller/contract drift

## Context

This branch fixes the ten flow-contract defects listed in the task prompt (`docs/work-report-research/README.md` → `## Pre-existing bugs found along the way (confirmed by a reviewer)`). **All ten were re-verified against this checkout at `17f8966a` before planning, and all ten still reproduce, so none is dropped.** The work is prose and contract text: plugin agent and instruction files (`plugin` layer), plus the state-dir README contracts (including the QA-review README's description of the blocked outcome) `init` copies into an adopting repository (`cli` layer, `cli/templates/state-dir/`). No script, generator, schema or `cli/src` module changes, so no new `cli/test` case is owed. The only automated check is the suite Phase G runs. The `general` layer has no target.

**Group A — the keying scheme, and why.** Every overwritten-findings site moves to **one scheme: the next free `review_<n>.md` index in the findings folder, resolved by the caller immediately before each reviewer dispatch and passed as the existing `iteration:` argument.** To resolve it, list the folder (`ls <folder>`) and take one past the highest `review_<n>.md`, or `0` when the folder is absent or holds none. The loop's own counter is kept, but only as the cap counter and the heartbeat's `iter` value, never as a file index. This is chosen over a round or layer component in the folder or file name for three reasons:

- It is already the rule this corpus states: `plugin/instructions/docs_phase_instructions.md` ("Resolve `<i>` to the next free index in the slug directory — never assume `0`"), the task-plan walker's `arg.iteration:`, and the `iteration` rows of `task-plan-reviewer`, `architecture-reviewer`, `business-parity-reviewer` and `ui-tests-plan-reviewer`, which already say "at the gates that resolve it that way, it is the next free index in `findings_folder`".
- No folder or file is renamed. So no new state-dir directory, no `cli/src/generators/stateDir.ts` row and no `cli/test` layout change is needed.
- Every existing glob consumer keeps working unchanged: the `review_*.md` listings, the walker's `fw_round_count`, `branch-reviewer`'s highest-numbered-per-`task_<N>/` read, and `review-plan-reviewer`'s orphan check, which reads `finding_<N>.md` and never `review_*`.

Next-free alone does not tell a reader which layer a file belongs to. So for the multi-layer unit loop (defect 3), **the fix iteration reads the `findings_file:` path its own layer's `layer-reviewer` returned on that layer's last FAIL, never a folder listing**. The round-counting consumers (`improvement_observations_instructions.md`, both autonomous forks' `Override I`) are told the folders are now branch-wide series that continue across rounds.

**Group B — where each run artifact is committed.** Each artifact gets exactly one disposition:

- `<state_dir>/lessons.md` (defect 5):
  - Autonomous fix-plan fork: a **new explicit commit point**, `Override 5`, runs right after each initial-write writer return, so a later gate-cap park leaves it committed. Its subject is `chore: Record lessons for <branch>`.
  - Supervised fork: an **explicit path in the human's fix-plan commit**, named in step 9's uncommitted-artifact list.
- Per-unit `layer-reviewer` findings (defect 6): an **explicit path in the unit's own commit** (a new committer argument, `unit_findings_folder`) **plus a stated exclusion from subject reconciliation**, so `staged: index-only` survives.
- The autonomous QA.0 augment (defect 7): a **new explicit commit point**, `Override L` in the autonomous user-review fixes fork. It reuses the existing fixed subject `chore: Add UI-test plan for <branch>`.

**Group C — contracts that disagree with their callers:**

- **Defect 8, `qa-tester`.** A test the environment prevents running returns the single line `error: blocked — test <T>: <one-line cause>`. This follows the corpus's marked-blocker precedent (`layer-implementer`'s `blocker: prohibited — `). Callers match the literal `error: blocked — `: it writes no file, the test stays `[ ]`, it is reported, and **the QA phase continues**. Any other `error:` still halts.
- **Defect 9, `layer-reviewer`.** Its description is rewritten to its real dispatch sites: the unit loop wherever `<per_unit_review>` is `on`, which is the semi-autonomous plan and user-review flows and the autonomous user-review flow. That excludes the autonomous plan flow and every supervised flow.
- **Defect 10, the augment prompt.** `ui-tests-plan-writer.md` becomes the single source of the augment prompt, and both callers quote it byte-for-byte. **Decision: the augmented plan is not re-reviewed, and QA.0 states why.**
  - The augment's only input is a fix plan that has already passed the plan gates.
  - `ui-tests-plan-reviewer` grades against the task prompt, story index and per-task files, not a fix plan, so it would grade the augment against the wrong requirement.
  - A review loop would add another findings folder that needs a commit point, plus more dispatches, in a branch whose purpose is closing exactly those gaps.

**Done-when grep — which hits remain, and why each is collision-safe.** After this branch, `git grep -n -E -e 'iteration = 0' -e 'start .?i=0' -e 'same folder' -- plugin/instructions` may still hit:

- the user-review gates' `parity_iteration = 0` / `arch_iteration = 0`;
- `## Phase B`'s B.2, `## Phase C2`'s C2.2 and `## Phase G`'s G.2 `iteration = 0`;
- `unit_loop_core.md` step 3's per-layer `iteration = 0`.

Each of these is now a cap counter only, and the file index is next-free. Also allowed:

- `### E.1`'s and `qa_test_instructions.md`'s `iteration = 0`. Each QA round has its own folder, and every per-dispatch file name carries the test id.
- the autonomous fix-plan fork's "same folder" sentence, which is now true.

No `start i=0` survives.

**Out of scope, stated rather than silent:**

- **(a)** The **semi-autonomous** user-review fork's QA.0 augment is also left uncommitted until a later committer sweeps it. The task prompt names only the autonomous fork (defect 7), and the semi-autonomous fork has no direct-commit mechanism to host a commit point.
- **(b)** The task-plan flow's own Phase E keeps its re-test `<round>` only in session memory, so a resumed session can rebind round 1's folder. That is a resume defect in round resolution, not in `iteration` keying, and it is not among the ten.
- **(c)** The tracked copies of the state-dir READMEs under `harness-runs/` are this checkout's `init` output. They are refreshed by a maintainer's `init --force`, not hand-edited by a task (`.claude/context/conventions.md` → `## Documents of record`).

**Top risks:**

1. **A wire changed on one side only.** The new literals are the `error: blocked — ` marker, the `unit_findings_folder` argument, the two new commit points and the canonical augment prompt. Each producer task and every consumer task greps its literal across `plugin/` and `cli/templates/`, and a consumer task restates the exact form it matches (Tasks 9–16).
2. **The multi-layer reader still picking by folder listing.** Under next-free a listing returns another layer's file, so Task 7 replaces every "most recent `review_*.md`" read with the returned path, and its verification walks a two-layer unit end to end.
3. **A new commit point that stalls or dirties an unattended run.** Tasks 4 and 16 use plain wrapper invocations with no `$(`, `<` or `if`, pass paths with no existence guard, and add their entries to the single-source clean-tree list.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_findings_overwrites_and_commit_gaps/task_<K>_plan.md`. Entries are ordered bottom-up in the configured layer order (`cli`, then `plugin`). The catch-all `general` layer has no task.

1. [x] **Task 1** — Rewrite the gate, meta-review, test-fix-review, UI-test-plan and QA-review state-dir READMEs for next-free keying and the blocked-test outcome _(layer: cli)_ _(points: 18)_
2. [x] **Task 2** — Rewrite the eight per-item point-review state-dir READMEs for next-free keying, own-layer reads and unit commits _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Key the user-review fix-plan gates by next free index _(layer: plugin)_ _(points: 12)_
4. [x] **Task 4** — Commit the lessons ledger in both user-review fix-plan forks _(layer: plugin)_ _(points: 15)_
5. [x] **Task 5** — Key the B.2 / C2.2 meta-review loops and the G.2 gate by next free index _(layer: plugin)_ _(points: 18)_
6. [x] **Task 6** — Resolve the docs catalog review index to the next free slot _(layer: plugin)_ _(points: 8)_
7. [x] **Task 7** — Key per-unit layer reviews by next free index and hand each fix the file its own layer returned _(layer: plugin)_ _(points: 15)_
8. [x] **Task 8** — Rewrite `layer-reviewer`'s description to its real dispatch sites _(layer: plugin)_ _(points: 5)_
9. [x] **Task 9** — Add the committer's `unit_findings_folder` argument and exclude it from subject reconciliation _(layer: plugin)_ _(points: 15)_
10. [x] **Task 10** — Pass `unit_findings_folder` from the unit loop's commit step _(layer: plugin)_ _(points: 8)_
11. [x] **Task 11** — Give every qa-tester per-test block a defined return, with the `error: blocked — ` marker _(layer: plugin)_ _(points: 20)_
12. [x] **Task 12** — Parse the per-test blocked marker in the task-plan flow's Phase E _(layer: plugin)_ _(points: 15)_
13. [ ] **Task 13** — Parse the per-test blocked marker in the supervised QA flow and the user-review fixes core _(layer: plugin)_ _(points: 10)_
14. [ ] **Task 14** — Let the `E` / `R4` ledger entries resolve over a blocked-only remainder _(layer: plugin)_ _(points: 8)_
15. [ ] **Task 15** — Make `ui-tests-plan-writer` the single source of the augment prompt, and state why the augment is not re-reviewed _(layer: plugin)_ _(points: 15)_
16. [ ] **Task 16** — Add the autonomous QA.0 augment commit point _(layer: plugin)_ _(points: 10)_
17. [ ] **Task 17** — Teach both autonomous `Override I` round counts the branch-wide next-free series _(layer: plugin)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Grep every field name, folder name and wire string you change across `plugin/`, `cli/templates/`, `cli/test/` and `docs/`, and change every quoting site together."*

`docs/work-report-research/` is excluded from every command entry below. It is the research record that diagnosed these ten defects, a document of record that quotes the pre-fix text on purpose. It is not a quoting site of a live wire.

**Derivation entry E1 — Group A keying wires (command).** Re-run verbatim: `git grep -l -E -e 'iteration = 0' -e 'start .?i=0' -e 'same folder' -e 'most recent .?review_' -e 'review_\{iteration\}' -e 'plain counter' -e 'parity_iteration' -e 'arch_iteration' -e 'legitimately starts' -e 'folder.s most recent' -- plugin cli/templates cli/test docs ':(exclude)docs/work-report-research'`

**Derivation entry E1b — round-counting and latest-file readers (command).** Re-run verbatim: `git grep -l -E -e 'consecutive .?review_' -e 'review_\*' -e 'highest-numbered .?review_' -- plugin cli/templates`

**Derivation entry E1m — the self-adoption copies of the state-dir READMEs (command).** Re-run verbatim: `git grep -l -E -e 'iteration = 0' -e 'start .?i=0' -e 'same folder' -e 'most recent .?review_' -e 'review_\{iteration\}' -e 'plain counter' -e 'parity_iteration' -e 'arch_iteration' -e 'legitimately starts' -e 'folder.s most recent' -e 'can be augmented' -- 'harness-runs/*/README.md'`

**Derivation entry E2 — Group B commit and staging wires (command).** Re-run verbatim: `git grep -l -E -e 'staged: index-only' -e 'code files shown by' -e 'Autonomous-fork commit points' -e 'uncommitted artifacts' -e 'lessons\.md' -e 'ui_test_pass' -- plugin/instructions plugin/agents/committer.md plugin/agents/user-review-fix-plan-writer.md`

**Derivation entry E3 — qa-tester outcome wires (command).** Re-run verbatim: `git grep -l -E -e 'record a finding' -e 'documented assumption' -e 'report .?blocked' -e 'Round PASS' -e 'per-test .?error:' -e 'QA passed \(' -e 'recorded .?blocked' -e 'failed or .?blocked' -e 'pass/fail/blocked' -e 'as .?blocked' -- plugin cli/templates`

**Derivation entry E4 — `layer-reviewer` dispatch-site claims (command).** Re-run verbatim: `git grep -l -E -e 'supervised, semi-autonomous and autonomous flows' -e 'no reviewer agents' -- plugin`

**Derivation entry E5 — the augment prompt and its quoting sites (command).** Re-run verbatim: `git grep -l -E -e 'Augment the UI-test plan' -e 'can be augmented' -- plugin cli/templates docs`

**Derivation entry E6 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** the standing lessons ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it names a findings folder, a review index, a commit point, a committer argument, a qa-tester return or a UI-test augment, which are the surfaces this branch changes. On this branch it reaches no rule. The nearest is *"Every automatic retry in an unattended path is bounded by a count or a deadline"*, and Task 12 keeps the blocked-test re-run inside the existing `MAX_QA_ROUNDS` bound, so the rule is satisfied rather than changed.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/state-dir/architecture_user_review_reviews/README.md` ("a **plain counter, not a free-index resolution**") | template | E1 | `change` | Task 1 |
| 2 | `cli/templates/state-dir/business_parity_user_review_reviews/README.md` ("so an index an earlier round already used is **overwritten**") | template | E1 | `change` | Task 1 |
| 3 | `cli/templates/state-dir/review_plan_reviews/README.md` ("a second round's B.2 starts at `0` again") | template | E1 | `change` | Task 1 |
| 4 | `cli/templates/state-dir/skeptic_review_plan_reviews/README.md` ("a second round's C2.2 starts at `0` again") | template | E1 | `change` | Task 1 |
| 5 | `cli/templates/state-dir/test_fix_plan_reviews/README.md` ("`<i>` starts at `review_0.md`") | template | named by Task 1. No entry reaches it; it is listed because Task 1 edits it | `change` | Task 1 |
| 6 | `cli/templates/state-dir/ui_test_plans/README.md` ("can be augmented later") | template | E5 | `change` | Task 1 |
| 7 | `cli/templates/state-dir/task_plan_point_reviews/README.md` ("handed the folder's most recent file") | template | E1 | `change` | Task 2 |
| 8 | `cli/templates/state-dir/review_plan_point_reviews/README.md` ("handed the folder's most recent file") | template | E1 | `change` | Task 2 |
| 9 | `cli/templates/state-dir/skeptic_review_point_reviews/README.md` (`review_<iteration>.md` per re-check) | template | E1 | `change` | Task 2 |
| 10 | `cli/templates/state-dir/architecture_branch_review_point_reviews/README.md` (`review_<iteration>.md` per re-check) | template | E1 | `change` | Task 2 |
| 11 | `cli/templates/state-dir/business_parity_branch_review_point_reviews/README.md` (`review_<iteration>.md` per re-check) | template | E1 | `change` | Task 2 |
| 12 | `cli/templates/state-dir/qa_review_point_reviews/README.md` (`review_<iteration>.md` per re-check) | template | E1 | `change` | Task 2 |
| 13 | `cli/templates/state-dir/test_fix_point_reviews/README.md` ("handed the folder's most recent file") | template | E1 | `change` | Task 2 |
| 14 | `cli/templates/state-dir/user_review_fix_plan_point_reviews/README.md` ("handed the folder's most recent file") | template | E1 | `change` | Task 2 |
| 15 | `cli/templates/state-dir/architecture_reviews/README.md` (`review_{iteration}.md`) | template | E1 | `no-change` | Task-plan gate folder whose index the walker already resolves next-free (`arg.iteration`); untouched by this branch |
| 16 | `cli/templates/state-dir/business_parity_reviews/README.md` (`review_{iteration}.md`) | template | E1 | `no-change` | Same as row 15 |
| 17 | `cli/templates/state-dir/task_plan_reviews/README.md` ("the **next free one**") | template | E1 | `no-change` | Already describes the next-free rule this branch adopts everywhere |
| 18 | `cli/templates/state-dir/ui_test_plan_reviews/README.md` ("a new file takes the **next free index**") | template | E1 | `no-change` | Already next-free. QA.0 dispatches no reviewer into it (Task 15's decision) |
| 19 | `cli/test/flow-walker-ui-and-reentry.test.mjs` (header quoting "`iteration = 0`. Loop:") | — | E1 | `no-change` | Quotes the pre-walker task-plan core as history and pins the walker, which this branch does not touch |
| 20 | `docs/flow-graph-walker.md` (`git show 1fd5ce9:…` quotation) | — | E1 | `no-change` | Decision record quoting a past revision; editing it would falsify the record |
| 21 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` steps 7 and 8 ("Set `parity_iteration = 0`", "Set `arch_iteration = 0`") | — | E1 | `change` | Task 3 |
| 22 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3` ("a later round appends findings into the same folder") | — | E1, E2, E3 | `change` | Task 3 (keying sentence), Task 4 (`Override 5` and lessons) |
| 23 | `plugin/instructions/user_review_fix_plan_writing_instructions.md` → `### <terminal_handoff>` step 9 ("uncommitted artifacts") | — | E2 | `change` | Task 4 |
| 24 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`, `## Override G` `E` bullet, `## Override I` (a)/(b) | — | E1b, E2, E3 | `change` | Task 4 (entry 13), Task 14 (`E` flip), Task 16 (entry 14), Task 17 (`Override I`) |
| 25 | `plugin/instructions/plan_orchestration_instructions_core.md` → B.2, B.3, C2.2, C2.3, G.2, `## Phase E`, `### D.2`, `## Stop conditions` | — | E1, E2, E3 | `change` | Task 5 (B/C2/G), Task 12 (Phase E, D.2, stop conditions) |
| 26 | `plugin/agents/review-plan-reviewer.md` → `## Invocation contract` `iteration` row, and the `iteration:` line of the quoted B.2 and C2.2 dispatch blocks | — | E1 | `change` | Task 5 (row reworded; both quoted blocks renamed to `<meta_review_index>`, byte-identical to the caller's) |
| 27 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Per-entry loop` step 2, `## Final entry — INDEX` ("start `i=0`") | — | E1 | `change` | Task 6 |
| 28 | `plugin/instructions/docs_phase_instructions.md` → `## Loop` step 2 ("legitimately starts at `i=0`") | — | E1 | `change` | Task 6 |
| 29 | `plugin/instructions/unit_loop_core.md` → step 3, step 5, `### Per-unit review step` | — | E1, E1b, E2 | `change` | Task 7 (keying and reader), Task 10 (step 5 argument) |
| 30 | `plugin/agents/layer-reviewer.md` → `description:`, `## Resolved values` lead sentence (its fenced-block placeholder list), `iteration` row, the `iteration:` line of the quoted unit fenced block | — | E1, E4 | `change` | Task 7 (`iteration` row; quoted block's `iteration:` line renamed to `<review_index>`; `## Resolved values` lead sentence lists `<review_index>` instead of `<iteration>`), Task 8 (description) |
| 31 | `plugin/instructions/improvement_observations_instructions.md` → the net-new / re-raised paragraph | — | E1b, E2 | `change` | Task 7 (multi-layer per-item series). Its `(d)` row is `no-change`: it reads committed subjects, which Tasks 9–10 make correct upstream |
| 32 | `plugin/agents/committer.md` → `## Invocation contract`, `### Which caller sends which mode`, **Subject reconciliation**, step 3 | — | E2 | `change` | Task 9 |
| 33 | `plugin/agents/qa-tester.md` → `## Which MCP to use`, `## How it tests`, `## Output contract` | — | E1, E3 | `change` | Task 11 |
| 34 | `plugin/instructions/qa_test_instructions.md` → `### 1.` step 3 augment block, `### 3.` collect sentence, `### 4.` aggregation | — | E1, E1b, E2, E3, E5 | `change` | Task 13 (`### 3.` collect sentence and `### 4.` aggregation), Task 15 (augment). Its `iteration = 0` line is `no-change`: the round folder is resolved next-free from disk |
| 35 | `plugin/instructions/user_review_fixes_instructions_core.md` → `### QA.0`, `### D.2`, `## Stop conditions` | — | E1b, E2, E5 | `change` | Task 13 (D.2, stop), Task 15 (QA.0). Its `item_*/review_*.md` listing is `no-change`: it lists every file |
| 36 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override G` `R4` bullet, new `## Override L`, `## Override I` (a) | — | E1, E1b, E2 | `change` | Task 14 (`R4`), Task 16 (`Override L`), Task 17 (`Override I`) |
| 37 | `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3` template lines `E.` / `R4.` | — | E2, E3 | `change` | Task 14 (ids unchanged). Its `## 3` pointer to the commit-point set is `no-change` |
| 38 | `plugin/agents/ui-tests-plan-writer.md` → `## Invocation contract` **Augment after user-review fixes** | — | E5 | `change` | Task 15 |
| 39 | `plugin/agents/architecture-reviewer.md` → `## Invocation contract` insertion-point-3 block (`iteration: <arch_iteration>`) and insertion-point-4 block (`iteration: <fix_plan_iteration>`) | — | E1 | `change` | Task 3 (insertion-point-3 block → `<arch_review_index>`), Task 5 (insertion-point-4 block → `<test_fix_review_index>`). Its `iteration` row and `review_{iteration}.md` shape stay unchanged: the row already reads "the next free index in `findings_folder`" at gates that resolve it so |
| 40 | `plugin/agents/business-parity-reviewer.md` → `## Invocation contract` insertion-point-3 block (`iteration: <parity_iteration>`) | — | E1 | `change` | Task 3 (→ `<parity_review_index>`). Its `iteration` row and `review_{iteration}.md` shape stay unchanged, as in row 39 |
| 41 | `plugin/agents/task-plan-reviewer.md` (`review_{iteration}.md`) | — | E1 | `no-change` | Dispatched only by the walker, which already resolves next-free |
| 42 | `plugin/agents/ui-tests-plan-reviewer.md` (`review_{iteration}.md`) | — | E1 | `no-change` | Same as row 41. Task 15 keeps QA.0 reviewer-free |
| 43 | `cli/templates/scripts/lib/flow-walker-gates.sh` (`fw_next_review_index`, `fw_round_count`) | — | E1b | `no-change` | The walker's own next-free and round count for the task-plan flow, which already follows the adopted scheme |
| 44 | `plugin/agents/branch-reviewer.md` → Pass 2 ("find the highest-numbered `review_*.md`") | — | E1b | `no-change` | Reads `task_<N>/` only. A story task is single-layer, so under next-free the highest index is still that unit's latest verdict |
| 45 | `plugin/instructions/task_plan_writing_instructions_core.md` (`review_*.md` in `## Context discipline`) | — | E1b | `no-change` | Walker-driven flow, already next-free |
| 46 | `plugin/agents/user-review-fix-plan-writer.md` → step 6 (appends `lessons.md`) | — | E2 | `no-change` | It writes the ledger in initial-write mode only. Committing it is the flow's job (Task 4) |
| 47 | `plugin/instructions/dispatch_discipline_instructions.md` (points at the commit-point set) | — | E2 | `no-change` | Cites the set by heading. Tasks 4 and 16 extend the set at its single source |
| 48 | `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` class (ii) | — | E2 | `no-change` | Already sanctions the commit-point list and the reciprocal fork sentences that Tasks 4 and 16 add to |
| 49 | `plugin/instructions/run_mode_instructions.md` (names a `lessons.md` rule) | — | E2 | `no-change` | A reader citation, not a write or commit site |
| 50 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` (its own commit points; ask-vs-assume "documented assumption") | — | E2, E3 | `no-change` | The task flow's own planning commits and policy, which no defect here touches |
| 51 | `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` (plan-review folders named for the human commit) | — | E2 | `no-change` | The task-plan flow writes no ledger lesson and its gate folders are walker-keyed |
| 52 | `cli/templates/claude/qa_test_scenarios.md` ("the test agent reports it **`blocked`**") | — | E3 | `no-change` | States when a test is blocked, not how the agent returns it. The return shape is `qa-tester.md`'s (Task 11) |
| 53 | `plugin/commands/branch-status.md` ("documented assumptions" bucket) | — | E3 | `no-change` | A read-only digest bucket, not a qa-tester wire |
| 54 | `plugin/agents/layer-implementer.md` → `description:` ("supervised, semi-autonomous and autonomous flows") | — | E4 | `no-change` | True for the implementer: the supervised item loop dispatches it (`plugin/instructions/plan_orchestration_instructions.md` step 1, the **Single-layer** specialist table) |
| 55 | `plugin/instructions/plan_orchestration_instructions.md` ("no reviewer agents") | — | E4 | `no-change` | The source of the fact Task 8 aligns to |
| 56 | `harness-runs/architecture_user_review_reviews/README.md` | self-adoption copy | E1m | `no-change` | `init` output in this checkout (Context, out-of-scope (c)); refreshed by `init --force` from row 1 |
| 57 | `harness-runs/review_plan_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 3 |
| 58 | `harness-runs/skeptic_review_plan_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 4 |
| 59 | `harness-runs/task_plan_point_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 7 |
| 60 | `harness-runs/review_plan_point_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 8 |
| 61 | `harness-runs/skeptic_review_point_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 9 |
| 62 | `harness-runs/architecture_branch_review_point_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 10 |
| 63 | `harness-runs/test_fix_point_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 13 |
| 64 | `harness-runs/user_review_fix_plan_point_reviews/README.md` | self-adoption copy | E1m | `no-change` | Same as row 56, refreshed from row 14 |
| 65 | `harness-runs/architecture_reviews/README.md` | self-adoption copy | E1m | `no-change` | Mirror of row 15, which is itself `no-change` |
| 66 | `harness-runs/task_plan_reviews/README.md` | self-adoption copy | E1m | `no-change` | Mirror of row 17, which is itself `no-change` |
| 67 | `cli/templates/state-dir/qa_reviews/README.md` ("recording each test as **passed, failed or blocked**", "is recorded `blocked`", "An index appears only on a round with something to report") | template | E3 | `change` | Task 1. No self-adoption copy exists (`harness-runs/qa_reviews/` is absent in this checkout), so no E1m mirror row is owed |
