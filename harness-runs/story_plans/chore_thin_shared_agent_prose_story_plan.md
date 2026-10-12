# Story: Thin the agent prose that more than one family shares

## Context

This branch is the base session of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 2). It shortens the prose that agents from more than one family load, so that the eight family sessions after it start from one standard and never need to touch each other's files. The families, used for scoping only: **task plan** (`task-plan-writer`, `task-plan-reviewer`); **unit loop** (`layer-implementer`, `layer-reviewer`, `committer`); **branch review** (`branch-reviewer`, `skeptic-reviewer`, `review-plan-reviewer`); **plan/diff gates** (`architecture-reviewer`, `business-parity-reviewer`); **UI tests and QA** (`ui-tests-plan-writer`, `ui-tests-plan-reviewer`, `qa-tester`, `qa-tester-mobile-maestro`, `qa-tester-mobile-mcp`); **fix-plan and statistics writers** (`user-review-fix-plan-writer`, `test-fix-plan-writer`, `statistics-plan-writer`); **docs** (`docs-writer`, `docs-reviewer`); **conventions** (`conventions-writer`, `conventions-reviewer`). Text shared only inside one family is that family's session's work, not this one's.

**What is thinned, and how.** Every block, row or sentence that appears byte-identical in agent definitions from two or more families is rewritten once, and the identical result is written into every copy; the copies stay in each definition (`plugin/instructions/dispatch_discipline_instructions.md` → `## The receiving side — the roster that carries the backstop` keeps the rule body in the definitions, and a shared base file would move words rather than cut them). Where a row is a shared core with per-agent tails — `<repo_root>`, `<state_dir>`, the parity row — the unit is the **shared sentence**: it is thinned identically wherever it occurs and each agent's own sentences stay. Where copies differ only in a word, the difference is kept and the rest is thinned the same way. Every per-task file gives the **old** text to find and the **new** text to write; an implementer replaces exactly that, adds no wording of its own, and returns a blocker naming the file and the missing text if the old text is not found exactly. Tasks 2–9 each own one group of blocks and touch nothing else in a file, so their edits never overlap; they ship in a chain only to fix the order. Of the shared instruction and sample files the task prompt lists, exactly one section is read by agents of more than one family — `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (eleven agents, six families), Task 1. Every other cited section is a dispatch-site back-pointer, a structure read by one family (the `## Phase <letter>` heading list, the substitution table's `Detail file` cells), or a sample read up front by one family and by `layer-reviewer` only on a unit that edits a sample fixture; the `## Scope register` rows record each settlement and its reason. `plugin/instructions/improvement_observations_instructions.md` → `## Dispositioned units`, cited by `committer` and `statistics-plan-writer`, is not on the task prompt's file list and is left for a later pass.

**The standard every task applies** — the task prompt asks for it to be written into `.claude/context/plugin.md`, which is a conventions document no run may edit, so it is raised in the return's `## Corpus staleness` for a hand edit and stated here so this branch's implementers and reviewers apply it now: rules are direct instructions; each rule is stated once; rationale the agent does not act on is dropped; every edge case stays; a wire literal or a cited anchor is never paraphrased, only carried byte-for-byte (`## Unsolicited dispatch guidance`, `(disregarded for verdict purposes)`, `## Rejected findings`, the two rejected-findings entry shapes, `call stands`, `no confident match`, `mcp__harness-docs__search_docs`, `review_{iteration}.md`, every `<placeholder>` and every `→ ## heading` target); and a change to an agent definition never raises its up-front word count.

**Read-list precedence.** Ten definitions read less than the generated `CLAUDE.md` routing table routes them to (the shared conventions document for any implementation, review or planning; the lessons ledger for branch-level work). Task 10 gives each one identical sentence saying the definition's list wins, and records which agents get it, why, and why the other twelve do not. Nothing is added to `CLAUDE.md`, its template or `cli/src/generators/claudeContext.ts`.

**Measurement.** An agent's up-front words are its definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents; a back-pointer and a conditional read are not counted. The figures in `## Up-front word counts` were measured at `b7ebf1f0` by the probe Task 11 carries; Task 11 re-measures after every edit has landed and fills the `After` column, and no agent's figure may rise. A planning-time dry run of every replacement in Tasks 1–10, applied to a copy of `plugin/` at `b7ebf1f0`, found each old text exactly once in each named file and no agent's figure rising; the tightest margins are the two recipients of Task 10's sentence that carry the fewest shared blocks, `conventions-writer` (11 words down) and `statistics-plan-writer` (13 words down). The task prompt's line-repetition check is recorded the same way in `## Repeated lines — before and after`.

**Copies that differ, and the call on each.** No two copies of a thinned rule contradict each other. These differences are domain wording or an addition, and each is kept: `test-fix-plan-writer`'s rejected-findings rule has no user-observation sentence (a test fix plan has no user observations); the unit-loop pair's parity row says "no parity clause in this file applies" where the others say "every parity clause … is inert"; the docs-retrieval bullet's "wins" clause names `<reference_impl>` in three agents and its fallback names "the index-first reading above" or "your own reading of the code" by whether the agent reads `<docs_root>`; the five-copy `<state_dir>` form adds the git-pathspec rule for agents that build pathspecs; `review-plan-reviewer` and `task-plan-reviewer` add one sentence to `**Guard carve-out.**`; the docs pair's `<app_dir>` sentence names "the application root"; `qa-tester`'s says "the application's directory".

The verification bar for the branch as a whole — `cli/test` and `scripts/run-gates.sh` passing — is the Run gates phase's, not any unit's; no task runs either.

**Top risks:** the likeliest failure is a thinned copy that drops a rule or paraphrases a wire literal the flow walker or another file parses; every task lists the literals it must keep and verifies them by grep against `b7ebf1f0`, and Task 9 checks `## Rejected findings` and `call stands` — the strings `scripts/lib/flow-walker-gates.sh` parses out of a plan index — in all eight agent files that teach them. The second is copies that drift apart — one file given a slightly different "new" text — which every task guards by listing, with one `git grep -l -F`, exactly the files that carry the new sentence, and Task 11 re-checks with the task prompt's line-repetition probe. The third is an agent whose up-front figure rises because Task 10 adds a sentence; Task 10 checks each recipient against its `b7ebf1f0` figure before saving, and Task 11 measures all twenty-two.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]` — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised flow, which dispatches none — so no implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_shared_agent_prose/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin `## The test-run rule` in `unit_loop_core.md`, keeping every rule and the citer roster _(layer: plugin)_ _(points: 10)_
2. [x] **Task 2** — Thin `## Unsolicited dispatch guidance` and its return-contract pointers, identically in every copy _(layer: plugin)_ _(points: 15)_
3. [x] **Task 3** — Thin the `<docs_root>` and `<docs_retrieval>` rows and the docs-retrieval tool bullet, identically in every copy _(layer: plugin)_ _(points: 15)_
4. [x] **Task 4** — Thin the `<state_dir>` rows, identically in every copy _(layer: plugin)_ _(points: 10)_
5. [x] **Task 5** — Thin the shared sentences of the `<repo_root>` and `<repo_root>` / `<app_dir>` rows, identically in every copy _(layer: plugin)_ _(points: 20)_
6. [x] **Task 6** — Thin the `<parity_vocabulary>` / `<reference_impl>`, `<default_branch>` and `<scripts_dir>` rows, identically in every copy _(layer: plugin)_ _(points: 10)_
7. [x] **Task 7** — Thin the shared sentences of the `<layer_names>`, `<convention_symbols>` and `iteration` rows, identically in every copy _(layer: plugin)_ _(points: 15)_
8. [x] **Task 8** — Thin the reviewers' shared grading blocks — the severity ladder, `**Guard carve-out.**` and `**Prose volume — the receiving side.**` — identically in every copy _(layer: plugin)_ _(points: 10)_
9. [x] **Task 9** — Thin the rejected-findings rules on both sides, and the reviewers' "If there are Must Fix issues" line, identically in every copy _(layer: plugin)_ _(points: 15)_
10. [x] **Task 10** — Add the read-list precedence sentence to the ten agents whose read list is narrower than the `CLAUDE.md` routing table _(layer: plugin)_ _(points: 10)_
11. [ ] **Task 11** — Measure every agent's up-front words after the thinning, and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Thin every block that appears in agent definitions from more than one family (list below) once, and write the identical result into every copy."* — with its two companions, *"For each file above, work out which sections agents from more than one family read, either up front or through a cited anchor, and thin those sections."* and *"Add one sentence to each agent definition whose read list is narrower than the generated `CLAUDE.md` routing table."*

**Derivation entries — shared blocks (commands).** Each is read-only and re-runnable verbatim against the base commit, so it reaches the same sites after the branch's edits as before them; each prints `b7ebf1f0:<path>` lines, one per site file.

| Entry | Command |
|---|---|
| R1 | `git grep -l -F -e '## The test-run rule' b7ebf1f0 -- plugin` |
| R2a | `git grep -l -F -e '**How to report.** Emit a' b7ebf1f0 -- plugin/agents` |
| R2b | `git grep -l -F -e 'section (see the section above)' b7ebf1f0 -- plugin/agents` |
| R3a | `git grep -l -F -e 'the repo-relative directory holding the documentation corpus' b7ebf1f0 -- plugin/agents` |
| R3b | `git grep -l -F -e 'whether the docs-retrieval search tool is wired' b7ebf1f0 -- plugin/agents` |
| R3c | `git grep -l -F -e 'the docs-retrieval search tool, **only when' b7ebf1f0 -- plugin/agents` |
| R4 | `git grep -l -F -e 'the run-artifact tree' b7ebf1f0 -- plugin/agents` |
| R5a | `git grep -l -F -e 'build every literal path from the result' b7ebf1f0 -- plugin/agents` |
| R5b | `git grep -l -F -e 'directory inside that checkout, repo-relative' b7ebf1f0 -- plugin/agents` |
| R5c | `git grep -l -F -e 'resolve against: those are repo-relative, like every path in' b7ebf1f0 -- plugin/agents` |
| R5d | `git grep -l -F -e 'Bound for completeness' b7ebf1f0 -- plugin/agents` |
| R6a | `git grep -l -F -e 'the name of the reference implementation this project is kept in parity with, and the path to it' b7ebf1f0 -- plugin/agents` |
| R6b | `git grep -l -F -e 'the branch work starts from and merges back into' b7ebf1f0 -- plugin/agents` |
| R6c | `git grep -l -F -e 'the repo-relative directory the generated wrapper and outer-loop scripts live in' b7ebf1f0 -- plugin/agents` |
| R7a | `git grep -l -F -e 'travel through this file unchanged.' b7ebf1f0 -- plugin/agents` |
| R7b | `git grep -l -F -e 'this file names none of them' b7ebf1f0 -- plugin/agents` |
| R7c | `git grep -l -F -e 'Integer supplied by the caller' b7ebf1f0 -- plugin/agents` |
| R8a | `git grep -l -F -e '**Should Fix** — the code or claim is wrong or unclear' b7ebf1f0 -- plugin/agents` |
| R8b | `git grep -l -F -e '**Guard carve-out.**' b7ebf1f0 -- plugin/agents` |
| R8c | `git grep -l -F -e '**Prose volume — the receiving side.**' b7ebf1f0 -- plugin/agents` |
| R9a | `git grep -l -F -e '**If there are Must Fix issues**, save findings to' b7ebf1f0 -- plugin/agents` |
| R9b | `git grep -l -F -e '**A reviewer finding you judge wrong is resolved or recorded' b7ebf1f0 -- plugin/agents` |
| R9c | `git grep -l -F -e '**A recorded rejection is an addressed finding only once you have tested it.**' b7ebf1f0 -- plugin/agents` |

The blocks themselves were found with the task prompt's line-repetition command (lines over 80 characters in three or more definitions) widened to lines over 40 characters in exactly two, each kept only when its copies span two or more families; the entries above are one distinctive substring per block.

**Derivation entry P1 — read-list precedence (procedure).** **Artifact:** the twenty-two `plugin/agents/*.md` definitions at `b7ebf1f0`, against the generated `.claude/CLAUDE.md` → `## Context files (read on demand)` routing table. **Traversal:** each definition's read list in file order — `## Read first`, `## Read on demand (no auto-loaded context)`, and any read rule in `## Resolved values` or `## Invocation contract`. **Decision rule:** `change` when, for the work the agent does, its list omits a document a table row routes it to (the shared conventions document for implementation, review or planning; the lessons ledger for branch-level planning or review); `no-change` otherwise, with the reason.

**Derivation entry P2 — shared instruction and sample sections (procedure).** **Artifact:** the ten files the task prompt lists (`unit_loop_core.md`, `plan_orchestration_instructions_core.md`, `task_plan_writing_instructions_core.md`, `sample_code_review.md`, `sample_story_plan.md`, `sample_task_plan.md`, `sample_user_review_fix_plan.md`, `user_review_fix_plan_writing_instructions_core.md`, `qa_test_instructions.md`, `docs_phase_instructions.md`, with their per-item sample files). **Traversal:** every `${CLAUDE_PLUGIN_ROOT}/instructions/…` and `${CLAUDE_PLUGIN_ROOT}/samples/…` citation of them in `plugin/agents/*.md` at `b7ebf1f0`, grouped by the section it names. **Decision rule:** `change` when agents of two or more families read that section on every dispatch or through a cited anchor; `no-change` when every citation is a dispatch-site back-pointer, the reading agents are one family, or the read is conditional.

**Derivation entry P3 — sites the task prompt names outside `plugin/` (procedure).** **Artifact:** the task prompt's goals 3 and 4. **Traversal:** each file either goal names. **Decision rule:** `no-change` for a conventions document (never a task target) and for each file goal 3 bars.

No standing tracked matrix under `harness-runs/` covers `plugin/agents/` or `plugin/instructions/`, so no row-class entry is owed.

**Closure invariant:** every file each command entry prints, and every site each procedure entry reaches, appears as a row below.

| # | Site | Copy | Evidence (entry that reached it) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/architecture-reviewer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 2 | `plugin/agents/branch-reviewer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 3 | `plugin/agents/business-parity-reviewer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 4 | `plugin/agents/layer-implementer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 5 | `plugin/agents/layer-reviewer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 6 | `plugin/agents/review-plan-reviewer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 7 | `plugin/agents/skeptic-reviewer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 8 | `plugin/agents/task-plan-reviewer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 9 | `plugin/agents/task-plan-writer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 10 | `plugin/agents/test-fix-plan-writer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 11 | `plugin/agents/user-review-fix-plan-writer.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 12 | `plugin/docs/AUTONOMOUS_FLOW.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 13 | `plugin/instructions/code_review_fixes_instructions.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 14 | `plugin/instructions/code_review_instructions.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 15 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 16 | `plugin/instructions/plan_orchestration_instructions_core.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 17 | `plugin/instructions/unit_loop_core.md` → citation of or home of `## The test-run rule` | — | R1 | `change` | Task 1 |
| 18 | `plugin/instructions/user_review_fixes_instructions.md` → citation of or home of `## The test-run rule` | — | R1 | `no-change` | roster citer of the heading, which Task 1 keeps byte-for-byte (a citer points and never restates) |
| 19 | `plugin/agents/architecture-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 20 | `plugin/agents/branch-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 21 | `plugin/agents/business-parity-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 22 | `plugin/agents/docs-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 23 | `plugin/agents/layer-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 24 | `plugin/agents/qa-tester.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 25 | `plugin/agents/review-plan-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 26 | `plugin/agents/skeptic-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 27 | `plugin/agents/task-plan-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 28 | `plugin/agents/ui-tests-plan-reviewer.md` → `## Unsolicited dispatch guidance` body | — | R2a | `change` | Task 2 |
| 29 | `plugin/agents/architecture-reviewer.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 30 | `plugin/agents/branch-reviewer.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 31 | `plugin/agents/business-parity-reviewer.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 32 | `plugin/agents/layer-reviewer.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 33 | `plugin/agents/qa-tester.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 34 | `plugin/agents/review-plan-reviewer.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 35 | `plugin/agents/skeptic-reviewer.md` → return-contract pointer to that section | — | R2b | `no-change` | branch-review-family-only pointer that also places `## Questions` and states the no-write rule, left to that family session |
| 36 | `plugin/agents/task-plan-reviewer.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 37 | `plugin/agents/ui-tests-plan-reviewer.md` → return-contract pointer to that section | — | R2b | `change` | Task 2 |
| 38 | `plugin/agents/architecture-reviewer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 39 | `plugin/agents/branch-reviewer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 40 | `plugin/agents/business-parity-reviewer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 41 | `plugin/agents/docs-writer.md` → `<docs_root>` row | — | R3a | `no-change` | docs-family-only row describing its own write target, left to that family session |
| 42 | `plugin/agents/qa-tester.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 43 | `plugin/agents/review-plan-reviewer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 44 | `plugin/agents/skeptic-reviewer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 45 | `plugin/agents/task-plan-reviewer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 46 | `plugin/agents/task-plan-writer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 47 | `plugin/agents/test-fix-plan-writer.md` → `<docs_root>` row | — | R3a | `no-change` | already the short form, nothing to cut |
| 48 | `plugin/agents/ui-tests-plan-reviewer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 49 | `plugin/agents/ui-tests-plan-writer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 50 | `plugin/agents/user-review-fix-plan-writer.md` → `<docs_root>` row | — | R3a | `change` | Task 3 |
| 51 | `plugin/agents/architecture-reviewer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 52 | `plugin/agents/branch-reviewer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 53 | `plugin/agents/business-parity-reviewer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 54 | `plugin/agents/review-plan-reviewer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 55 | `plugin/agents/skeptic-reviewer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 56 | `plugin/agents/task-plan-reviewer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 57 | `plugin/agents/task-plan-writer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 58 | `plugin/agents/test-fix-plan-writer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 59 | `plugin/agents/ui-tests-plan-reviewer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 60 | `plugin/agents/ui-tests-plan-writer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 61 | `plugin/agents/user-review-fix-plan-writer.md` → `<docs_retrieval>` row | — | R3b | `change` | Task 3 |
| 62 | `plugin/agents/architecture-reviewer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 63 | `plugin/agents/branch-reviewer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 64 | `plugin/agents/business-parity-reviewer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 65 | `plugin/agents/review-plan-reviewer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 66 | `plugin/agents/skeptic-reviewer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 67 | `plugin/agents/task-plan-reviewer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 68 | `plugin/agents/task-plan-writer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 69 | `plugin/agents/ui-tests-plan-reviewer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 70 | `plugin/agents/ui-tests-plan-writer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 71 | `plugin/agents/user-review-fix-plan-writer.md` → `mcp__harness-docs__search_docs` read bullet | — | R3c | `change` | Task 3 |
| 72 | `plugin/agents/architecture-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 73 | `plugin/agents/branch-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 74 | `plugin/agents/business-parity-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 75 | `plugin/agents/committer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 76 | `plugin/agents/conventions-reviewer.md` → `<state_dir>` row | — | R4 | `no-change` | conventions-family-only row sharing no sentence with the other copies, left to that family session |
| 77 | `plugin/agents/conventions-writer.md` → `<state_dir>` row | — | R4 | `no-change` | conventions-family-only row sharing no sentence with the other copies, left to that family session |
| 78 | `plugin/agents/docs-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 79 | `plugin/agents/docs-writer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 80 | `plugin/agents/layer-implementer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 81 | `plugin/agents/layer-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 82 | `plugin/agents/qa-tester.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 83 | `plugin/agents/review-plan-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 84 | `plugin/agents/skeptic-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 85 | `plugin/agents/statistics-plan-writer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 86 | `plugin/agents/task-plan-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 87 | `plugin/agents/task-plan-writer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 88 | `plugin/agents/test-fix-plan-writer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 89 | `plugin/agents/ui-tests-plan-reviewer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 90 | `plugin/agents/ui-tests-plan-writer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 91 | `plugin/agents/user-review-fix-plan-writer.md` → `<state_dir>` row | — | R4 | `change` | Task 4 |
| 92 | `plugin/agents/architecture-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 93 | `plugin/agents/branch-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 94 | `plugin/agents/business-parity-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 95 | `plugin/agents/committer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 96 | `plugin/agents/conventions-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 97 | `plugin/agents/conventions-writer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 98 | `plugin/agents/docs-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 99 | `plugin/agents/docs-writer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 100 | `plugin/agents/layer-implementer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 101 | `plugin/agents/layer-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 102 | `plugin/agents/qa-tester.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 103 | `plugin/agents/review-plan-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 104 | `plugin/agents/skeptic-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 105 | `plugin/agents/statistics-plan-writer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 106 | `plugin/agents/task-plan-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 107 | `plugin/agents/task-plan-writer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 108 | `plugin/agents/test-fix-plan-writer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 109 | `plugin/agents/ui-tests-plan-reviewer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 110 | `plugin/agents/ui-tests-plan-writer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 111 | `plugin/agents/user-review-fix-plan-writer.md` → `<repo_root>` row, its three shared sentences | — | R5a | `change` | Task 5 |
| 112 | `plugin/agents/branch-reviewer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 113 | `plugin/agents/business-parity-reviewer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 114 | `plugin/agents/docs-reviewer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 115 | `plugin/agents/docs-writer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 116 | `plugin/agents/qa-tester.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 117 | `plugin/agents/review-plan-reviewer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 118 | `plugin/agents/skeptic-reviewer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 119 | `plugin/agents/task-plan-reviewer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 120 | `plugin/agents/task-plan-writer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 121 | `plugin/agents/ui-tests-plan-writer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 122 | `plugin/agents/user-review-fix-plan-writer.md` → `<app_dir>` sentence | — | R5b | `change` | Task 5 |
| 123 | `plugin/agents/docs-writer.md` → "It is **not** what the `layers[].path` scopes" sentence | — | R5c | `change` | Task 5 |
| 124 | `plugin/agents/qa-tester.md` → "It is **not** what the `layers[].path` scopes" sentence | — | R5c | `change` | Task 5 |
| 125 | `plugin/agents/review-plan-reviewer.md` → "It is **not** what the `layers[].path` scopes" sentence | — | R5c | `change` | Task 5 |
| 126 | `plugin/agents/task-plan-reviewer.md` → "It is **not** what the `layers[].path` scopes" sentence | — | R5c | `change` | Task 5 |
| 127 | `plugin/agents/task-plan-writer.md` → "It is **not** what the `layers[].path` scopes" sentence | — | R5c | `change` | Task 5 |
| 128 | `plugin/agents/ui-tests-plan-writer.md` → "It is **not** what the `layers[].path` scopes" sentence | — | R5c | `change` | Task 5 |
| 129 | `plugin/agents/branch-reviewer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 130 | `plugin/agents/business-parity-reviewer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 131 | `plugin/agents/conventions-reviewer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 132 | `plugin/agents/conventions-writer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 133 | `plugin/agents/layer-implementer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 134 | `plugin/agents/review-plan-reviewer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 135 | `plugin/agents/skeptic-reviewer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 136 | `plugin/agents/task-plan-reviewer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 137 | `plugin/agents/task-plan-writer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 138 | `plugin/agents/ui-tests-plan-writer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 139 | `plugin/agents/user-review-fix-plan-writer.md` → "Bound for completeness" sentence | — | R5d | `change` | Task 5 |
| 140 | `plugin/agents/architecture-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 141 | `plugin/agents/branch-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 142 | `plugin/agents/business-parity-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 143 | `plugin/agents/layer-implementer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 144 | `plugin/agents/layer-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 145 | `plugin/agents/review-plan-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 146 | `plugin/agents/skeptic-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 147 | `plugin/agents/task-plan-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 148 | `plugin/agents/task-plan-writer.md` → `<parity_vocabulary>` / `<reference_impl>` row | — | R6a | `change` | Task 6 |
| 149 | `plugin/agents/architecture-reviewer.md` → `<default_branch>` row | — | R6b | `change` | Task 6 |
| 150 | `plugin/agents/branch-reviewer.md` → `<default_branch>` row | — | R6b | `change` | Task 6 |
| 151 | `plugin/agents/business-parity-reviewer.md` → `<default_branch>` row | — | R6b | `change` | Task 6 |
| 152 | `plugin/agents/review-plan-reviewer.md` → `<default_branch>` row | — | R6b | `change` | Task 6 |
| 153 | `plugin/agents/skeptic-reviewer.md` → `<default_branch>` row | — | R6b | `change` | Task 6 |
| 154 | `plugin/agents/layer-reviewer.md` → `<scripts_dir>` row | — | R6c | `change` | Task 6 |
| 155 | `plugin/agents/task-plan-writer.md` → `<scripts_dir>` row | — | R6c | `change` | Task 6 |
| 156 | `plugin/agents/architecture-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 157 | `plugin/agents/branch-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 158 | `plugin/agents/business-parity-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 159 | `plugin/agents/conventions-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 160 | `plugin/agents/conventions-writer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 161 | `plugin/agents/docs-writer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 162 | `plugin/agents/qa-tester.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 163 | `plugin/agents/review-plan-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 164 | `plugin/agents/skeptic-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 165 | `plugin/agents/statistics-plan-writer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 166 | `plugin/agents/task-plan-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 167 | `plugin/agents/task-plan-writer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 168 | `plugin/agents/ui-tests-plan-reviewer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 169 | `plugin/agents/ui-tests-plan-writer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 170 | `plugin/agents/user-review-fix-plan-writer.md` → `<layer_names>` row, its "No substitution" sentence | — | R7a | `change` | Task 7 |
| 171 | `plugin/agents/architecture-reviewer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 172 | `plugin/agents/branch-reviewer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 173 | `plugin/agents/business-parity-reviewer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 174 | `plugin/agents/docs-writer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 175 | `plugin/agents/layer-implementer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 176 | `plugin/agents/layer-reviewer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 177 | `plugin/agents/qa-tester.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 178 | `plugin/agents/review-plan-reviewer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 179 | `plugin/agents/skeptic-reviewer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 180 | `plugin/agents/task-plan-reviewer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 181 | `plugin/agents/task-plan-writer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 182 | `plugin/agents/ui-tests-plan-writer.md` → `<convention_symbols>` row, its closing clause | — | R7b | `change` | Task 7 |
| 183 | `plugin/agents/architecture-reviewer.md` → `iteration` row | — | R7c | `change` | Task 7 |
| 184 | `plugin/agents/business-parity-reviewer.md` → `iteration` row | — | R7c | `change` | Task 7 |
| 185 | `plugin/agents/layer-reviewer.md` → `iteration` row | — | R7c | `change` | Task 7 |
| 186 | `plugin/agents/review-plan-reviewer.md` → `iteration` row | — | R7c | `change` | Task 7 |
| 187 | `plugin/agents/task-plan-reviewer.md` → `iteration` row | — | R7c | `change` | Task 7 |
| 188 | `plugin/agents/ui-tests-plan-reviewer.md` → `iteration` row | — | R7c | `change` | Task 7 |
| 189 | `plugin/agents/branch-reviewer.md` → the Must Fix / Should Fix / Nice to Have ladder | — | R8a | `change` | Task 8 |
| 190 | `plugin/agents/layer-reviewer.md` → the Must Fix / Should Fix / Nice to Have ladder | — | R8a | `change` | Task 8 |
| 191 | `plugin/agents/skeptic-reviewer.md` → the Must Fix / Should Fix / Nice to Have ladder | — | R8a | `change` | Task 8 |
| 192 | `plugin/agents/branch-reviewer.md` → `**Guard carve-out.**` paragraph | — | R8b | `change` | Task 8 |
| 193 | `plugin/agents/layer-reviewer.md` → `**Guard carve-out.**` paragraph | — | R8b | `change` | Task 8 |
| 194 | `plugin/agents/review-plan-reviewer.md` → `**Guard carve-out.**` paragraph | — | R8b | `change` | Task 8 |
| 195 | `plugin/agents/skeptic-reviewer.md` → `**Guard carve-out.**` paragraph | — | R8b | `change` | Task 8 |
| 196 | `plugin/agents/task-plan-reviewer.md` → `**Guard carve-out.**` paragraph | — | R8b | `change` | Task 8 |
| 197 | `plugin/agents/branch-reviewer.md` → `**Prose volume — the receiving side.**` paragraph | — | R8c | `change` | Task 8 |
| 198 | `plugin/agents/layer-reviewer.md` → `**Prose volume — the receiving side.**` paragraph | — | R8c | `change` | Task 8 |
| 199 | `plugin/agents/skeptic-reviewer.md` → `**Prose volume — the receiving side.**` paragraph | — | R8c | `change` | Task 8 |
| 200 | `plugin/agents/review-plan-reviewer.md` → "If there are Must Fix issues" line | — | R9a | `change` | Task 9 |
| 201 | `plugin/agents/task-plan-reviewer.md` → "If there are Must Fix issues" line | — | R9a | `change` | Task 9 |
| 202 | `plugin/agents/ui-tests-plan-reviewer.md` → "If there are Must Fix issues" line | — | R9a | `change` | Task 9 |
| 203 | `plugin/agents/task-plan-writer.md` → writer-side rejected-findings rule | — | R9b | `change` | Task 9 |
| 204 | `plugin/agents/test-fix-plan-writer.md` → writer-side rejected-findings rule | — | R9b | `change` | Task 9 |
| 205 | `plugin/agents/ui-tests-plan-writer.md` → writer-side rejected-findings rule | — | R9b | `change` | Task 9 |
| 206 | `plugin/agents/user-review-fix-plan-writer.md` → writer-side rejected-findings rule | — | R9b | `change` | Task 9 |
| 207 | `plugin/agents/architecture-reviewer.md` → reviewer-side recorded-rejection rule | — | R9c | `change` | Task 9 |
| 208 | `plugin/agents/business-parity-reviewer.md` → reviewer-side recorded-rejection rule | — | R9c | `change` | Task 9 |
| 209 | `plugin/agents/task-plan-reviewer.md` → reviewer-side recorded-rejection rule | — | R9c | `change` | Task 9 |
| 210 | `plugin/agents/ui-tests-plan-reviewer.md` → reviewer-side recorded-rejection rule | — | R9c | `change` | Task 9 |
| 211 | `plugin/agents/architecture-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | reads every conventions document and the lessons ledger |
| 212 | `plugin/agents/branch-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | reads every conventions document and the lessons ledger |
| 213 | `plugin/agents/business-parity-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reviews at branch level without the lessons ledger |
| 214 | `plugin/agents/committer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | the generated `CLAUDE.md` already narrows it to one section |
| 215 | `plugin/agents/conventions-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads only the members sent, on iteration 2 |
| 216 | `plugin/agents/conventions-writer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — opens no conventions document of its own accord |
| 217 | `plugin/agents/docs-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | states no read list narrower than the table |
| 218 | `plugin/agents/docs-writer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | states no read list narrower than the table |
| 219 | `plugin/agents/layer-implementer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads only the dispatched layer's document |
| 220 | `plugin/agents/layer-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads only the dispatched layer's document |
| 221 | `plugin/agents/qa-tester.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | reads every conventions document; tests rather than plans or reviews |
| 222 | `plugin/agents/qa-tester-mobile-maestro.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | stub: reads no plan, does no implementation, review or planning; carries no thinned block, so the sentence would raise its count |
| 223 | `plugin/agents/qa-tester-mobile-mcp.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | stub: reads no plan, does no implementation, review or planning; carries no thinned block, so the sentence would raise its count |
| 224 | `plugin/agents/review-plan-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | reads every conventions document and the lessons ledger |
| 225 | `plugin/agents/skeptic-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | reads every conventions document and the lessons ledger |
| 226 | `plugin/agents/statistics-plan-writer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads no conventions document |
| 227 | `plugin/agents/task-plan-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | reads every conventions document and the lessons ledger |
| 228 | `plugin/agents/task-plan-writer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `no-change` | reads every conventions document and the lessons ledger |
| 229 | `plugin/agents/test-fix-plan-writer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads one layer's document, on demand only |
| 230 | `plugin/agents/ui-tests-plan-reviewer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads only the surface layer's document |
| 231 | `plugin/agents/ui-tests-plan-writer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads only the surface layer's document |
| 232 | `plugin/agents/user-review-fix-plan-writer.md` → its read list against the `CLAUDE.md` routing table | — | P1 | `change` | Task 10 — reads one layer's document, on demand only |
| 233 | `plugin/instructions/unit_loop_core.md` → `## The test-run rule` | — | P2 | `change` | Task 1 — read on every dispatch by eleven agents in six families (same site as row 17) |
| 234 | `plugin/instructions/unit_loop_core.md` → `## The unit loop` | — | P2 | `no-change` | cited by `committer`, `layer-implementer`, `review-plan-reviewer` and `skeptic-reviewer` only as the loop that dispatches or consumes them; no agent reads it; orchestrator-only |
| 235 | `plugin/instructions/unit_loop_core.md` → `## Substitution table` | — | P2 | `no-change` | read only by `layer-implementer` (the row `G.4` `Detail file` cell, unit-loop family); `test-fix-plan-writer` cites it as a back-pointer; a table of wire values |
| 236 | `plugin/instructions/plan_orchestration_instructions_core.md` → its `## Phase …` sections | — | P2 | `no-change` | every agent citation is a dispatch-site back-pointer; `layer-implementer` and `review-plan-reviewer` read only the `## Phase <letter>` heading list as a run order, and heading text is a wire |
| 237 | `plugin/instructions/task_plan_writing_instructions_core.md` → `## Loop`, `### 2.`, `### 3.`, `## UI-test-plan write loop` | — | P2 | `no-change` | each anchor is a dispatch-site back-pointer cited by one family only |
| 238 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` | — | P2 | `no-change` | dispatch-site back-pointers only (`architecture-reviewer`, `business-parity-reviewer`, `user-review-fix-plan-writer`) |
| 239 | `plugin/instructions/qa_test_instructions.md` | — | P2 | `no-change` | dispatch-site back-pointers (`qa-tester`, `ui-tests-plan-writer`) and one quoted phrase (`conventions-writer`); no section is read |
| 240 | `plugin/instructions/docs_phase_instructions.md` | — | P2 | `no-change` | dispatch-site back-pointers (`docs-writer`, `docs-reviewer`) and `committer`'s scope note; no section is read |
| 241 | `plugin/samples/sample_code_review.md` and `plugin/samples/sample_code_review/finding_1.md` | — | P2 | `no-change` | read up front by the branch-review family only; `layer-reviewer` reads them only on a unit that edits a sample fixture; that family's session |
| 242 | `plugin/samples/sample_task_plan.md`, `plugin/samples/sample_story_plan.md`, `plugin/samples/sample_story/task_<N>_plan.md` | — | P2 | `no-change` | read up front by the task-plan family only; `layer-reviewer` reads them only on a unit that edits a sample fixture; that family's session |
| 243 | `plugin/samples/sample_user_review_fix_plan.md` and `plugin/samples/sample_user_review_fix_plan/finding_1.md` | — | P2 | `no-change` | read up front by the fix-plan family only (`user-review-fix-plan-writer`, `test-fix-plan-writer`); `layer-reviewer` reads them only on a unit that edits a sample fixture; that family's session |
| 244 | `.claude/context/plugin.md` → the thinning standard the task prompt asks for | — | P3 | `no-change` | a conventions document is never a task target; raised as a `stale-rule` entry in `## Corpus staleness`, with the text to add |
| 245 | `.claude/CLAUDE.md`, `cli/templates/claude/CLAUDE.md`, `cli/src/generators/claudeContext.ts` → the routing table | — | P3 | `no-change` | the task prompt bars the precedence sentence from all three |
| 246 | `plugin/instructions/unit_loop_core.md` → `## Layer routing table` | — | P2 | `no-change` | cited only by `layer-implementer` (`## Invocation contract`: "three values its `## Layer routing table` supplies") and `layer-reviewer` (`## Invocation contract`: "from that file's `## Layer routing table`"), both unit-loop family, as the source of their dispatch values; no other family reads it |

## Up-front word counts

Up-front words = the agent definition plus every plugin file or section it reads on every dispatch (Task 11's `harness-runs/scratch/measure_upfront.mjs`, whose `READS` table is the read set). `Before` was measured at `b7ebf1f0`; `After` and `Δ` are filled by Task 11. No `Δ` may be above `0`.

| Agent | Family | Reads counted (besides the definition) | Before — definition | Before — reads | Before — up-front | After — up-front | Δ |
|---|---|---|---|---|---|---|---|
| architecture-reviewer | plan/diff gates | `## The test-run rule` | 5139 | 732 | 5871 | | |
| branch-reviewer | branch review | `## The test-run rule`, `sample_code_review.md`, `sample_code_review/finding_1.md` | 6175 | 2255 | 8430 | | |
| business-parity-reviewer | plan/diff gates | `## The test-run rule` | 6158 | 732 | 6890 | | |
| committer | unit loop | — | 8430 | 0 | 8430 | | |
| conventions-reviewer | conventions | `agents/conventions-writer.md` | 5893 | 5108 | 11001 | | |
| conventions-writer | conventions | — | 5108 | 0 | 5108 | | |
| docs-reviewer | docs | `agents/docs-writer.md` | 2528 | 3481 | 6009 | | |
| docs-writer | docs | — | 3481 | 0 | 3481 | | |
| layer-implementer | unit loop | `## The test-run rule`, `## Substitution table` | 6287 | 5118 | 11405 | | |
| layer-reviewer | unit loop | `## The test-run rule` | 4043 | 732 | 4775 | | |
| qa-tester | UI tests and QA | — | 8063 | 0 | 8063 | | |
| qa-tester-mobile-maestro | UI tests and QA | — | 1186 | 0 | 1186 | | |
| qa-tester-mobile-mcp | UI tests and QA | — | 1340 | 0 | 1340 | | |
| review-plan-reviewer | branch review | `## The test-run rule`, `sample_code_review.md`, `sample_code_review/finding_1.md` | 4440 | 2255 | 6695 | | |
| skeptic-reviewer | branch review | `## The test-run rule`, `sample_code_review.md`, `sample_code_review/finding_1.md` | 5373 | 2255 | 7628 | | |
| statistics-plan-writer | fix-plan and statistics | `sample_statistics.md` | 2941 | 1509 | 4450 | | |
| task-plan-reviewer | task plan | `## The test-run rule`, `sample_task_plan.md`, `sample_story_plan.md`, `sample_story/task_1–3_plan.md` | 6038 | 4968 | 11006 | | |
| task-plan-writer | task plan | `## The test-run rule`, `sample_task_plan.md`, `sample_story_plan.md`, `sample_story/task_1–3_plan.md` | 6476 | 4968 | 11444 | | |
| test-fix-plan-writer | fix-plan and statistics | `## The test-run rule`, `sample_user_review_fix_plan.md`, `sample_user_review_fix_plan/finding_1.md` | 2411 | 1999 | 4410 | | |
| ui-tests-plan-reviewer | UI tests and QA | `agents/ui-tests-plan-writer.md`, `agents/qa-tester.md` | 4530 | 13829 | 18359 | | |
| ui-tests-plan-writer | UI tests and QA | `agents/qa-tester.md` | 5766 | 8063 | 13829 | | |
| user-review-fix-plan-writer | fix-plan and statistics | `## The test-run rule`, `sample_user_review_fix_plan.md`, `sample_user_review_fix_plan/finding_1.md` | 4095 | 1999 | 6094 | | |

## Repeated lines — before and after

The task prompt's line-repetition check (lines over 80 characters found in three or more `plugin/agents/*.md` files) at `b7ebf1f0`: 25 lines. Task 11 re-runs it as `harness-runs/scratch/repeated_lines.mjs` and fills the `After` cells; each thinned block must keep its copy count (or have fallen to 80 characters or fewer) with fewer words.

| # | Block (line at `b7ebf1f0` begins) | Owner | Before copies | Before words | New line begins | After copies | After words |
|---|---|---|---|---|---|---|---|
| 1 | `<docs_retrieval>` row | Task 3 | 11 | 56 | "… whether the docs-retrieval search tool is wired. Read **only** when" | | |
| 2 | `<docs_root>` row | Task 3 | 11 | 38 | "… otherwise the corpus does not exist." | | |
| 3 | "Your dispatch prompt is defined by your own contract" | Task 2 | 10 | 111 | "Your dispatch prompt is your own contract plus" | | |
| 4 | "**How to report.** Emit a" | Task 2 | 10 | 84 | "- **Report it** in a" | | |
| 5 | "Two things are not steering. A **bare pointer**" | Task 2 | 10 | 67 | "Two things are not steering: a **bare pointer**" | | |
| 6 | "This report **never** changes your verdict" | Task 2 | 10 | 30 | "- The report never changes your verdict" | | |
| 7 | `<state_dir>` row, form A | Task 4 | 8 | 36 | "… Default `sdlc-harness/`; no path segment of it begins with a dot. \|" | | |
| 8 | `<repo_root>` row, five-copy form | Task 5 | 5 | 77 | "… The absolute root of the checkout this run executes in" | | |
| 9 | `<state_dir>` row, form B | Task 4 | 5 | 61 | "… strip any trailing slash first" | | |
| 10 | `<parity_vocabulary>` / `<reference_impl>` row | Task 6 | 5 | 54 | "… the name and path of the reference implementation" | | |
| 11 | `iteration` row | Task 7 | 5 | 41 | "\| `iteration` \| Integer from the caller" | | |
| 12 | `<default_branch>` row | Task 6 | 5 | 36 | "… merges into, so the diff base" | | |
| 13 | "Where the dispatch carried steering" | Task 2 | 5 | 30 | "An optional `## Unsolicited dispatch guidance` section precedes whichever fixed return applies" | | |
| 14 | `<layer_names>` row, four-copy form | Task 7 | 4 | 37 | "… **No substitution of the names themselves.** They are also" | | |
| 15 | "**Prose volume — the receiving side.**" | Task 8 | 3 | 172 | "**Prose volume — the receiving side.** This binds durable text" | | |
| 16 | `<repo_root>` / `<app_dir>` row, three-copy form | Task 5 | 3 | 140 | "… this run executes in" (the three-copy form) | | |
| 17 | docs-retrieval tool bullet, variant A | Task 3 | 3 | 132 | "… the code wins. … fall back to the index-first reading above." | | |
| 18 | docs-retrieval tool bullet, variant D | Task 3 | 3 | 130 | "… fall back to your own reading of the code." | | |
| 19 | "**A reviewer finding you judge wrong is resolved or recorded" | Task 9 | 3 | 124 | "… Record it as one line of a" | | |
| 20 | "- **Should Fix** — the code or claim is wrong" | Task 8 | 3 | 74 | "- **Should Fix** — wrong or unclear, but" | | |
| 21 | `<convention_symbols>` row, three-copy form | Task 7 | 3 | 55 | "… Read them off the conventions documents `<layer_path_map>` names. \|" | | |
| 22 | "**Guard carve-out.**" | Task 8 | 3 | 45 | "**Guard carve-out.** … It never binds a line coordinate" | | |
| 23 | "- **Must Fix** — a consumer acting on this diff" | Task 8 | 3 | 38 | "- **Must Fix** — … wrong behaviour," | | |
| 24 | "- **Nice to Have** — style, wording, ordering;" | Task 8 | 3 | 31 | "- **Nice to Have** — style, wording, ordering; also a stale line hint beside a resolving anchor" | | |
| 25 | "**If there are Must Fix issues**, save findings to" | Task 9 | 3 | 28 | "**If there are Must Fix issues**, run `mkdir -p" | | |
