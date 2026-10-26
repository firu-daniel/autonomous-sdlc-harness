# Story: Tree guards — the unit loop runs the whole-tree source guards a unit's change reaches

## Context

A unit runs only the test files it created or edited (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 3). Some tests do not test one module: they read a whole directory tree as text and enforce a rule over every file in it, so a unit can break one without touching it, and the break surfaces only in the Run gates round. Seen on `feat_run_gates_flake_resilience`, where a new `cli/test/*.mjs` file with a bare `process.env` spread passed its own run and then failed `cli/test/main-anchor-isolation.test.mjs` in Run gates round 1.

This branch adds an optional `treeGuards` key to `harness.config.json` — a list of `{ test, covers }` entries — and makes the unit loop run, after a unit's own test run, every guard whose `covers` glob matches a path the unit's change touched. Matching is mechanical: a glob check over the changed-path list two bare, read-only git commands print. No agent searches for guards or judges which apply, and no plan lists them.

**The contract, stated once here so every task restates the same shape.**

- `treeGuards` is an optional top-level array; each entry is an object with exactly two required non-empty string keys, `test` and `covers`, and no other key. Absent means *no tree guards*; the schema gives it `default: []`, mirrored in `DEFAULTS`, and no generator seeds it.
- `test` is the **argument the single-file test command takes**, verbatim — in this repository `test/main-anchor-isolation.test.mjs`, because the command is `npm test --workspace cli -- test/<name>.test.mjs`. It is therefore **not necessarily repo-relative**, and its schema description says so (the `appDir` description already admits "except where a key's own description says otherwise"). `doctor` resolves it against the repository root and then against each `layers[].path`, and warns when none of those holds a file.
- `covers` is a **repo-relative glob** over the files the guard reads. `**` matches zero or more whole path segments, `*` any run of characters inside one segment, `?` one character inside one segment; every other character is literal, and the glob must match the whole path.
- The **changed-path set** is the union of the output of `git diff --name-only HEAD` (staged and unstaged edits) and `git ls-files --others --exclude-standard` (new, untracked files), each run bare from the checkout root. Both are already in the generated unattended profile's allow list (`cli/templates/claude/settings.autonomous.json` → `Bash(git diff:*)`, `Bash(git ls-files:*)`), and the guard run itself goes through the same `<test_file_cmd>` string a unit already runs, so the permission profile does not change.
- The rule lives in **one place**, `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (a new point 7 plus the exception it adds to point 1). Every other plugin file points at it (lesson: *state a new behaviour once, in the section that decides it, and cite it from everywhere else*).

The work is cut into eight single-layer tasks in the configured layer order — `cli`, then `plugin`, then the catch-all `general` last. Tasks 1–3 build the CLI half (model and shape check, the `doctor` check, the adopter templates), Tasks 4–5 the plugin half (the rule and its implementer, then the planners and reviewers that must stay out of it or police it), Tasks 6–8 the root (schema and its negative fixture, the documents of record, and this repository's own seeded config). The schema lands after the model and check that mirror it because the catch-all ships last; within this branch nothing reads the key before Task 1 lands, and this repository's own config does not carry it until Task 8, after the schema accepts it.

This repository's own conventions document `.claude/context/conventions.md` → `## The testing bar` states the single-test-file rule this branch widens and has no rule that a new tree-reading test registers itself; that document is never a plannable target, so the restatement is raised in the plan writer's `## Corpus staleness` return rather than planned here.

**Top risks:** the acceptance case is a **new, untracked** test file, which `git diff --name-only` alone never lists — Task 4's changed-path definition is the union with `git ls-files --others --exclude-standard`, and its verification walks that exact case. Second, a new `doctor` check id breaks the frozen `PRE_BRANCH_CHECK_IDS` list in `cli/test/doctor.test.mjs` and any position assertion around it; Task 2 owns that edit and the grep that finds every other exhaustive id list. Third, `test` is deliberately not repo-relative while every other path in the file is; Tasks 1, 2, 6 and 7 each state that exception in the words above, so a reader of any one of the four contract places reaches the same answer.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. **Only the committing role flips a marker to `[x]`** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised flow, which dispatches none: no implementer changes a marker here, and no implementer edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational progress markers only — the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_unit_tree_guards/task_<K>_plan.md`. Ordered by the configured layer order (`cli`, `plugin`, then the catch-all `general` last).

1. [x] **Task 1** — Add the `treeGuards` key to the config model and the shape check _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Add the `tree-guards` doctor check that warns on a `test` naming no file _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Teach the adopter conventions templates the tree-guard run and the self-registration rule _(layer: cli)_ _(points: 10)_
4. [ ] **Task 4** — State the tree-guard run in the test-run rule and wire it into the layer implementer _(layer: plugin)_ _(points: 20)_
5. [ ] **Task 5** — Keep planners out of the guard list and have reviewers police registration _(layer: plugin)_ _(points: 15)_
6. [ ] **Task 6** — Declare `treeGuards` in the schema with a negative fixture _(layer: general)_ _(points: 15)_
7. [ ] **Task 7** — Document `treeGuards` and the `tree-guards` check in the documents of record _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — Seed this repository's `harness.config.json` with its three tree guards _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"A unit runs only the test files it created or edited (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 3)."* — read as: every durable corpus site that states which test files a unit runs, or that a plan may not name a test file the unit neither creates nor edits; plus every corpus site that lists the configuration keys or the `doctor` checks this branch adds one of.

**Derivation entry A — test-run statements (command).** Re-run verbatim from the checkout root:
`git grep -lE "test file the unit did not create or edit|neither creates nor edits|neither created nor edited|runs only those files|runs only that file|created or edited, with its|only test file|Used only for test files|Used for a unit's own test files|runs the one test file it created or edited|only the test files?|test files? it wrote" -- plugin cli/templates docs README.md .claude/context`

**Derivation entry B — the configuration-key contract (procedure).** **Artifact:** `.claude/context/conventions.md`. **Traversal:** `### The order files are created, so a half-built feature is still coherent` → item 1 (*A configuration key*), then `## What accompanies a new unit of each kind` → the *A configuration key* and *A negative schema fixture* rows. **Decision rule:** every file either passage names as a place a new key must land is a site.

**Derivation entry C — the doctor-check catalogue (command).** Re-run verbatim: `git grep -l "layer-drift" -- docs README.md cli/README.md plugin` — every document that names a neighbouring check id is a candidate for listing the new one.

**Derivation entry D — the token catalogue (command).** Re-run verbatim: `git grep -lE "^\| .<typecheck_cmd>. \| config value" -- docs` — the document that maps each plugin token to its configuration key.

**Closure invariant:** every site any derivation entry above reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/instructions/unit_loop_core.md` → `## The test-run rule` points 1, 3, 4, and `## Resolved values` → `<test_file_cmd>` row ("Used for a unit's own test files") | — | entry A | `change` | Task 4 |
| 2 | `plugin/agents/layer-implementer.md` → `## Resolved values` `<test_file_cmd>` row ("Used only for test files"), **What you run, in every mode.**, `## Output contract` item 5 ("created or edited, with its") | — | entry A | `change` | Task 4 |
| 3 | `plugin/agents/task-plan-writer.md` → `## Process` step 7 (b), the `**Work:**` / `**Verification:**` bullet ("neither creates nor edits") | — | entry A | `change` | Task 5 |
| 4 | `plugin/agents/task-plan-reviewer.md` → the test-run Must Fix bullet ("neither creates nor edits") | — | entry A | `change` | Task 5 |
| 5 | `plugin/agents/architecture-reviewer.md` → **No plan asks for a test run.** | — | entry A | `no-change` | cites `## The test-run rule`; point 4 as Task 4 rewrites it already makes a plan naming a guard a breach, so the pointer carries the new rule without an edit |
| 6 | `plugin/agents/business-parity-reviewer.md` → **No plan asks for a test run.** | — | entry A | `no-change` | same as row 5 — a pointer to the rule, which carries the change |
| 7 | `plugin/agents/review-plan-reviewer.md` → the test-run Must Fix bullet | — | entry A | `no-change` | same as row 5; the task prompt names only the task-plan writer and reviewer as owing an explicit line |
| 8 | `plugin/agents/user-review-fix-plan-writer.md` → "No finding's fix asks for a test run" | — | entry A | `no-change` | same as row 5 |
| 9 | `cli/templates/claude/context/conventions.md` → the testing-bar bullet ("runs only that file") | — | entry A | `change` | Task 3 |
| 10 | `cli/templates/claude/context/layer.md` → the "What \"done\" means here" bullet ("runs only that file") | — | entry A | `change` | Task 3 |
| 11 | `.claude/context/conventions.md` → `## The testing bar` ("runs the one test file it created or edited") | — | entry A | `no-change` | a conventions document is never a plannable target; the branch falsifies this sentence, so it is raised as a `stale-rule` entry in `## Corpus staleness` |
| 12 | `docs/work-report-research/architecture-reviewer.md` → checklist row K10 | — | entry A | `no-change` | a research record of a past measurement — a document of record of what was measured then, not a statement of current behaviour |
| 13 | `schemas/harness.config.schema.json` → `properties` | — | entry B | `change` | Task 6 |
| 14 | `cli/src/config/model.ts` → `HarnessConfig`, `DEFAULTS` | — | entry B | `change` | Task 1 |
| 15 | `cli/src/config/check.ts` → `TOP_LEVEL_KEYS`, the module header's *What it checks* | — | entry B | `change` | Task 1 |
| 16 | `docs/config.md` → `## 5. Key reference` | — | entry B | `change` | Task 7 |
| 17 | `schemas/negative/` + `package.json` → `validate:config:negative` + `schemas/negative/README.md` | — | entry B (*A negative schema fixture* row) | `change` | Task 6 |
| 18 | `docs/cli.md` → §7 check table and its per-check bullets | — | entry C | `change` | Task 7 |
| 19 | `docs/analyze.md` → the `layer-profile` / `layer-drift` paragraph | — | entry C | `no-change` | describes the checks the analyze command clears; `tree-guards` is not one of them |
| 20 | `docs/development.md` → the `layer-drift` mention in its verification criteria | — | entry C | `no-change` | names one check as an example inside a gate's pass criteria, not a catalogue of checks |
| 21 | `plugin/commands/harness-analyze.md` → "never silences `layer-drift`" | — | entry C | `no-change` | concerns the layer-profile record, which tree guards do not touch |
| 22 | `plugin/agents/task-plan-writer.md` → the `undescribed-layer` output entry naming `layer-drift` | — | entry C | `no-change` | concerns layer coverage, not test guards; the file's own change is row 3 |
| 23 | `docs/config.md` → `## 4. Token → class → home` | — | entry D | `change` | Task 7 — the new `<tree_guards>` token Task 4 declares gets its row |
| 24 | `plugin/docs/AUTONOMOUS_FLOW.md` → `**5. The Run gates phase (Phase G).**` paragraph ("runs only the test files it wrote") | — | entry A | `change` | Task 5 — the sentence restates the rule point 7 widens; reworded as a pointer to what `## The test-run rule` admits |
| 25 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → the bullet "The implementer runs `<typecheck_cmd>` and only the test files … `## The test-run rule` admits" | — | entry A | `no-change` | already a pointer: "only the test files `## The test-run rule` admits" carries point 7 once Task 4 lands it, with no restatement to go stale |
