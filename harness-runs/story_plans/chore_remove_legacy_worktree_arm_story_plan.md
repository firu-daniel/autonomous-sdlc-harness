# Story: Remove the legacy worktree run arm — run copies are clones only

## Context

Every run since `feat_clone_per_run_switch` executes in a clone, recorded in the run registry with `copy_kind` `clone`. The arm that let a run made as a linked worktree finish is still shipped: the watcher defaults a record with no `copy_kind` to `worktree` and renders a `worktree`-kind per-run profile for it, the sweep removes such a record's copy with `git worktree remove --force`, the run-copy check (`hr_run_copy_check_var`) accepts a linked worktree as a run copy, and the documents describe a migration window "until no worktree run is left". No legacy run is in flight, so this branch removes that arm. All script changes land in `cli/templates/scripts/`; this repository's self-adopted `scripts/` copies are not touched by a run.

**The user's decision (clarification park 1, Option A) bounds the work.** A linked worktree **a person made by hand** with `git worktree add` keeps working with the main checkout's wrappers: `hr_wrapper_target_check_var`'s worktree branch, `hr_wrapper_branch_var`'s `worktrees/<name>/HEAD` read, `hr_copy_kind`'s `worktree` answer and the `config.worktree` check (`hr_worktree_config_check_var`) all stay, and only their prose is reframed to describe a hand-made checkout, never a run copy. Everything that treats a linked worktree as a **run copy** goes: the watcher's `copy_kind` default to `worktree`, the per-run profile's `worktree` kind (its own `<copy>/.git` pointer entry), the sweep's `git worktree remove` arm, the run-copy check's acceptance of a linked worktree, the gate launcher's and `setup-worktree.sh --target`'s acceptance of one, the legacy-run test suites (`run-copy-migration.test.mjs`, `cleanup-worktree-record.test.mjs`) and the legacy docs. `push-branch-worktree-config.test.mjs` and `refresh-branch-worktree-config.test.mjs` stay, because they exercise the wrappers' hand-made-worktree arm. The task prompt's sentence "A linked worktree is refused" no longer applies to the wrappers; `docs/cli.md` §6 instead states that the legacy worktree run arm was removed and that a hand-made linked worktree is still accepted by the wrappers.

**Three decisions stand from the clarification and bind several tasks.** (1) A registry record with no `copy_kind` names no arm: the watcher's parked and paused resumes and the sweep **skip** it with a one-line note — there is no prune, nothing writes the registry for it, it is never treated as a clone, and nothing errors on it; each skip has its own test. (2) `hr_worktree_config_check_var` stays. (3) The per-run profile keeps the `.git`-pointer entries for every **other** linked worktree `git worktree list` names: they now protect a person's hand-made worktree, and the lessons ledger forbids dropping a protection whose alternative route has not been measured.

**The run library is where "no code path accepts a linked worktree as a run copy" is made structural, in one place.** Task 1 adds `hr_run_target_check_var <main> <dir>`, which runs `hr_wrapper_target_check_var` and refuses its `worktree` kind with one sentence (`'<dir>' is a linked worktree of <main>, and a run copy is a clone the run registry records`), reading no registry and no tip; `hr_run_copy_check_var` calls it, so it refuses a linked worktree too (the main checkout and a registered clone stay accepted — job mode and `hr_commit_placed` pass the main checkout itself). The watcher's review reuse, stall watchdog, launch check and exit sync, `hr_commit_placed`, `create-worktree.sh` and `remote-run.sh review`'s mirror detection go through it. So a legacy record whose linked worktree still exists is refused there by the existing refusal routes rather than reused. Two scripts that treat their target as a run copy but need none of `hr_run_copy_check_var`'s registry and tip reads call `hr_wrapper_target_check_var` directly today; each switches that call to `hr_run_target_check_var`, keeping its own exit route and writing no refusal sentence of its own. `launch-sandboxed-gates.sh` refuses at check 6 (Task 11, `refuse` / exit 2), before it reads a branch or a leftover record's `run_profile`. `setup-worktree.sh --target` refuses in its placement block, before anything is written (Task 12, the ` — refusing to bootstrap` tail and exit 1). A hand-made linked worktree is bootstrapped with no argument. The three git wrappers, `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`, also call `hr_wrapper_target_check_var` directly and are unaffected, because Option A keeps them for a hand-made worktree.

**Ship order** is bottom-up by layer: `cli` (Tasks 1–4, 11, 12, 5, 6, in that order; Tasks 11 and 12 were added in revision and keep their numbers), then `plugin` (Task 7), then the catch-all `general` (Tasks 8–10), which documents what the `cli` tasks built.

**Top risks:** the watcher's skip changes how every resumed test record is read — the shared fixture's `seedRecord` seeds records with no `copy_kind` today, so without Task 2's default of `copy_kind: 'clone'` most watcher suites would silently stop resuming; Task 2 owns that helper change and its verification names it. Second, the run-copy check's new refusal breaks every test that hands it a linked worktree — Task 1 moves the two `outer-loop-scripts.test.mjs` cases and `remote-review-payloads.test.mjs`'s (M5) onto the new behaviour, and Task 3 removes the watcher payload suites' legacy cases. Third, the docs could keep describing a shipped worktree run arm or, in over-correcting, stop describing the hand-made worktree the wrappers still accept; Tasks 8–9 work from the `## Scope register` below, and each row states which of the two it is.

**Manual setup required:**

1. After merge, re-render this repository's self-adopted outer-loop scripts and profile by hand with a forced self-adopt `init` (this branch changes only `cli/templates/scripts/` and `cli/templates/claude/settings.autonomous.json`; a run never rewrites `scripts/` or `.claude/`), then restart the watcher. The branch's closing summary states this. Depends on: Tasks 1–6, 11 and 12.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. **Only the committing role flips a marker to `[x]`** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised flow, which dispatches none: no implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational progress markers only — never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_remove_legacy_worktree_arm/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Make the run-copy check refuse a linked worktree, and reframe the library's worktree prose as a hand-made checkout _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Watcher: drop the `worktree` copy kind, skip a parked or paused record with no `copy_kind`, and seed test records as clones _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Remove the legacy-worktree cases from the watcher review-drop and stall payload suites, and reword `remote-start.test.mjs`'s worktree case as a hand-made one _(layer: cli)_ _(points: 18)_
4. [x] **Task 4** — Sweep: remove the `git worktree remove` arm and skip a record with no `copy_kind` _(layer: cli)_ _(points: 15)_
5. [x] **Task 11** — Gate launcher: refuse a linked-worktree target _(layer: cli)_ _(points: 12)_
6. [x] **Task 12** — `setup-worktree.sh --target`: refuse a linked-worktree target _(layer: cli)_ _(points: 15)_
7. [x] **Task 5** — Reframe the wrapper and outer-loop script headers: a linked worktree is a hand-made checkout, never a run copy _(layer: cli)_ _(points: 10)_
8. [x] **Task 6** — Reword the legacy-worktree-run prose in `cli/src` comments and the autonomous profile template _(layer: cli)_ _(points: 10)_
9. [x] **Task 7** — Drop the legacy-worktree-run clause from the three autonomous commit instructions _(layer: plugin)_ _(points: 8)_
10. [x] **Task 8** — `docs/watcher.md` and `docs/cli.md` §6: remove the migration section and the legacy-run sentences _(layer: general)_ _(points: 15)_
11. [x] **Task 9** — `docs/sandbox-verification.md`, `docs/development.md` and `docs/outer-loop-verification.md`: close CS5 and re-target the worktree rows at a hand-made worktree _(layer: general)_ _(points: 15)_
12. [ ] **Task 10** — Re-render the `notes-app` example profile's `_README` line and record the re-render _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt's `## Done when`: *"No code path accepts a linked worktree as a run copy."* and *"The documents above no longer describe a worktree arm that ships."* — bounded by the clarification answer (park 1, Option A): a hand-made linked worktree the wrappers accept is **not** a worktree arm that ships for runs, and text describing it stays, reframed where it says "run".

**Derivation entry 1 — corpus files (command).** Re-run verbatim from the checkout root:

```
git grep -n -i -E 'legacy (linked )?worktree|worktree run|legacy run|no worktree run is left|both layouts|run started before clones|worktree arm|worktree remove' -- ':!harness-runs' ':!cli/templates/scripts' ':!cli/src' ':!cli/test' ':!scripts' ':!githooks'
```

The `worktree remove` alternative reaches the shipped-asset lists that name the sweep's `git worktree remove` call, which Task 4 removes (row 34; its `docs/watcher.md` hits fall on rows 19 and 20). The excluded pathspecs are application source, its comments and tests — not corpus text — the run-artifact tree, and the self-adopted `scripts/` / `githooks/` copies a run never rewrites. `cli/templates/scripts` and `cli/src` are owned by Tasks 1, 2, 4, 5, 6, 11 and 12 by their own targets. Under `cli/test`, every file the same pattern (plus `migration coverage`) reaches — `git grep -l -i -E 'legacy (linked )?worktree|worktree run|legacy run|no worktree run is left|both layouts|run started before clones|worktree arm|worktree remove|migration coverage' -- cli/test` — is owned by its task's `### Targets`: `remote-review-payloads.test.mjs` (Task 1), `watcher-run-profile.test.mjs` and `run-copy-migration.test.mjs` (Task 2, the latter deleted), `watcher-review-drop-payloads.test.mjs`, `watcher-stall-reset-payloads.test.mjs` and `remote-start.test.mjs` (Task 3), `cleanup-run-copies.test.mjs` and `cleanup-worktree-record.test.mjs` (Task 4, the latter deleted). The one exception is `wrapper-clone-arm.test.mjs`, whose *"worktree arm"* hits name the wrappers' hand-made-worktree arm that Option A keeps, so it carries no legacy-run wording and no task targets it. `remote-start.test.mjs`'s header sentence *"one legacy case plants a linked worktree"* wraps across two lines, so the pattern reaches that file through its case name only; Task 3 owns both.

**Derivation entry 2 — the sandbox-verification rows the clarification names (command).** Re-run verbatim:

```
grep -n -E '^\| (CS5|CW1|CW2|CW4|C2|K2|G1|G4|G7|WR2|WR3|WR4) ' docs/sandbox-verification.md
```

**Standing artifacts.** `grep -l -i -E 'legacy (linked )?worktree|worktree run|no worktree run is left|both layouts|worktree arm' harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md` lists none; no standing check-id matrix under `harness-runs/` covers these targets, so no procedure entry is owed.

**Closure invariant:** every site either derivation entry reaches appears as a row below; a later re-run of either command printing a site outside this table is a closure failure.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/claude/settings.autonomous.json` → `_README` line *"FOUR COMMANDS RUN OUTSIDE THE SANDBOX"* (*"in a legacy worktree run, it cannot write the linked worktree's record"*) | template | entry 1, `legacy worktree` | `change` | Task 6 |
| 2 | `examples/notes-app/.claude/settings.autonomous.json` → the same `_README` line | notes-app render | entry 1, `legacy worktree` | `change` | Task 10 |
| 3 | `docs/cli.md` §6 → *"Four scripts run outside the sandbox, each in one spelling."* (*"A legacy worktree run is closed one step earlier"*) | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 4 | `docs/cli.md` §6 → *"The excluded rule's `:*` accepts any argument"* (*"A legacy worktree run, recorded with no `copy_kind`, keeps the worktree arm until it finishes"*; also *"the worktree arm's sentence"*) | — | entry 1, `legacy worktree`, `worktree arm` | `change` | Task 8 — the legacy-run sentence becomes the removal statement; *"the worktree arm's sentence"* names the wrappers' hand-made-worktree refusal text and stays |
| 5 | `docs/cli.md` §6 → *"Everything that runs outside the sandbox is write-protected on both sides"* (*"a legacy worktree run's record lies under it too"*) | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 6 | `docs/cli.md` §6 → the per-run-profile bullet *"on a legacy worktree, its `.git` pointer;"* | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 7 | `docs/cli.md` §6 → residual 1, item 3 (*"a legacy worktree run keeps it only in a session launched under a profile from before…"*) | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 8 | `docs/cli.md` §6 → residual 2 (*"a legacy worktree run keeps that race only as residual 1's item 3 states"*) | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 9 | `docs/cli.md` §7 → the `remote` check bullet (*"while a worktree run is being created"*) | — | entry 1, `worktree run` | `change` | Task 8 — a run being created is a clone |
| 10 | `docs/development.md` → *"The rows this probe does not take"* (CS5 as the one clone-layout hand row) | — | entry 1, `legacy worktree` | `change` | Task 9 |
| 11 | `docs/guard-verification.md` → row N16 (*"the baseline's worktree arm let a mid-pattern `*` span `/`"*) | — | entry 1, `worktree arm` | `no-change` | names a guard's sibling-path pattern arm, not a run-copy layout |
| 12 | `docs/outer-loop-verification.md` → *"Owed a re-drive on the clone layout."* (*"a record with no `copy_kind` — a legacy worktree — through the existing arm"*) | — | entry 1, `legacy worktree` | `change` | Task 9 |
| 13 | `docs/sandbox-verification.md` §2 → row CS5 | — | entry 1 `legacy worktree`; entry 2 | `change` | Task 9 — closed, with the reason |
| 14 | `docs/sandbox-verification.md` §2 → the CL-defect cause bullet (*"A legacy worktree run shares the main checkout's `.git/config`, so the defect began with the clone layout."*) | — | entry 1, `legacy worktree` | `no-change` | a dated record of a past defect's cause; true of the layout it describes |
| 15 | `docs/sandbox-verification.md` §8 → row GS2 (*"in both layouts"*) | — | entry 1, `both layouts` | `no-change` | the two layouts there are the clone and job layouts, both shipped |
| 16 | `docs/watcher.md` §1 step 4 (*"A reused copy can still be a legacy linked worktree"*) | — | entry 1, `legacy linked worktree` | `change` | Task 8 |
| 17 | `docs/watcher.md` §2 table → `cleanup-merged-worktrees.sh` row (*"a legacy worktree … through its worktree arm"*) | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 18 | `docs/watcher.md` → `### Where the family runs git in a run's copy` lead (*"The legacy worktree arm holds until no worktree run is left"*) | — | entry 1 | `change` | Task 8 |
| 19 | `docs/watcher.md` → same section's `cleanup-merged-worktrees.sh: removing the copy` row (*"A legacy worktree: `worktree remove --force`…"*) | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 20 | `docs/watcher.md` → `### The per-run profile` → **When it is removed.** (*"on the clone arm and the worktree arm alike"*) | — | entry 1, `worktree arm` | `change` | Task 8 |
| 21 | `docs/watcher.md` → `### The per-run profile` → **What it adds.** bullet *"on a legacy worktree, its `.git` pointer;"* | — | entry 1, `legacy worktree` | `change` | Task 8 |
| 22 | `docs/watcher.md` → `### Migration: both layouts until no worktree run is left` (whole section) | — | entry 1 | `change` | Task 8 — section removed |
| 23 | `plugin/hooks/allow-safe-compounds.sh` → comment *"sibling-worktree arm"* | — | entry 1, `worktree arm` | `no-change` | a guard's sibling-path matching arm, not a run-copy layout |
| 24 | `plugin/instructions/autonomous_pause_and_ledger.md` → the wrapper-commit paragraph (*"in a legacy worktree run, cannot write the worktree's record"*) | — | entry 1, `legacy worktree` | `change` | Task 7 |
| 25 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → *"Spell both calls literally"* paragraph (same clause) | — | entry 1, `legacy worktree` | `change` | Task 7 |
| 26 | `plugin/instructions/improvement_observations_instructions.md` → **Commit through the wrapper** bullet (same clause) | — | entry 1, `legacy worktree` | `change` | Task 7 |
| 27 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` → `<repo_root>` row (*"a worktree run resolves the same way"*) | — | entry 1, `worktree run` | `no-change` | a supervised session in a hand-made linked worktree, which Option A keeps supported |
| 28 | `plugin/instructions/user_review_fix_plan_writing_instructions.md` → `<repo_root>` row (same) | — | entry 1, `worktree run` | `no-change` | as row 27 |
| 29 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` → `<repo_root>` row (same) | — | entry 1, `worktree run` | `no-change` | as row 27 |
| 30 | `docs/sandbox-verification.md` §2 → rows G1, G4, G7 | — | entry 2 | `change` | Task 9 — stay `not run — owed` (or their recorded result); re-targeted at a hand-made linked worktree by §2's note and, where a Check names a legacy run, a watcher-resumed record or a `worktree`-kind per-run profile, by rewording that Check; tracked in #275 §7a |
| 31 | `docs/sandbox-verification.md` §3 → rows CW1, CW2 (worktree form), C2, K2, CW4 (their `config.worktree` arms) | — | entry 2 | `change` | Task 9 — as row 30 |
| 32 | `docs/sandbox-verification.md` §4 → rows WR2, WR3, WR4 (the worktree record) | — | entry 2 | `change` | Task 9 — as row 30; recorded results stay as they are |
| 33 | `docs/sandbox-verification.md` §8 → rows `CW2 (Linux)`, `C2 (Linux)`, `K2 (Linux)`, `CW4 (Linux)` | — | entry 2 | `no-change` | clone-layout measurements; no worktree arm |
| 34 | `docs/outer-loop-verification.md` → the opening paragraph *"These are the only shipped assets that mutate a repository — `git commit`, `git push`, `git worktree remove`, `git branch -D`, `kill` — …"* | — | entry 1, `worktree remove` | `change` | Task 9 — drop `git worktree remove` from the list, since no shipped asset runs it once Task 4 removes the sweep's worktree arm; the rows' dated cells stay |
