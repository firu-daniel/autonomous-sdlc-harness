## `bash scripts/test.sh` cannot exit 0 inside a worktree: gate 6a scans the worktree's own `.git` pointer file

- **category:** tooling-gap
- **evidence:** every implementer dispatch of this run (25 task dispatches plus 11 fix dispatches) reported `bash scripts/test.sh` exiting 1 with exactly one failing gate, `6a no machine paths`, whose hits are the worktree's untracked `.git` pointer file (`gitdir: /Users/daniel/Work/autonomous-sdlc-harness/.git/worktrees/…`) and `harness-runs/` artifacts quoting that same line — among them `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, which records the identical failure on all 16 dispatches of an earlier branch. Gate 4 (`npm test`) passed on every run.
- **cost this run:** the configured `commands.test` string never returns a pass in a worktree, so no dispatch could use it as a gate; each of the 36 dispatches instead had to diagnose 6a's hits by hand and argue the failure was pre-existing.

## Plugin manifest validation is unavailable to an unattended run

- **category:** tooling-gap
- **evidence:** the implementers for Tasks 15, 16 and 17 each tried `claude plugin validate --strict plugin` and each was refused with "This command requires approval"; Task 16's implementer tried twice. All three landed `tools:` frontmatter edits across ten `plugin/agents/*.md` files with the manifest check unrun, resting the claim on reading the diff.
- **cost this run:** the ten-agent `search_docs` grant shipped without the validator ever running; all three detail files carry it as a deviation and ask for a hand run.

## Unit-loop row `A`'s branch-name `commit_prefix` rule yields a token this repository's commit policy excludes

- **category:** agent-contract
- **evidence:** `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## Substitution table` row `A` derives `commit_prefix` from the branch name (`feat_` → `feat`), but `.claude/context/conventions.md` → `## Commit-message policy` gives a story task's commit **`none`** and states `chore` is the only prefix token in use here. Task 1 was dispatched with `feat` and committed as `d474d15 feat: Add docs.retrieval to the config model and the structural check`; the committer flagged the conflict in its return and asked for `commit_prefix: none`, which the remaining 24 tasks used.
- **cost this run:** one commit on the branch (`d474d15`) carries a prefix the repository's own policy does not admit, and it was already pushed when the conflict surfaced.

## An architecture finding's `_(layer: …)_` tag named one layer while its fix spanned two

- **category:** agent-contract
- **evidence:** `harness-runs/architecture_branch_reviews/feat_docs_catalog_retrieval_arch_review.md` readiness entry 3 is tagged `_(layer: cli)_`, but the finding's part 3 edits `harness-runs/story_plans/feat_docs_catalog_retrieval_story_plan.md` → `## Corpus staleness`. The `cli` implementer (#57) applied parts 1–2 and returned part 3 unapplied as outside its path scope, without the `prohibited — ` marker the unit loop reads as a disposition.
- **cost this run:** the orchestrator had to decide between parking and a second, `general`-layer dispatch (#58) for the same unit; it took the second dispatch, which is the one addition recorded in `harness-runs/dispatch_additions/feat_docs_catalog_retrieval.md`.

## `.claude/context/cli.md` now names one `spawnSync` site where the branch leaves two

- **category:** convention
- **evidence:** the C2 fix implementer (#85) changed `doctor`'s `retrieval-index` check to `spawnSync` so the child's stderr survives a zero exit, and reported that `.claude/context/cli.md` → `## How a module in this layer is written` states `cli/src/commands/doctor.ts` → `runNotifier` is the single exception to `execFileSync`. That sentence is false as of commit `55d0ca1`.
- **cost this run:** none on this branch — the rule is a conventions document under `.claude/`, which the implementers report as outside their writable scope, so it is left as corpus debt for a supervised `/harness-analyze cli` run or a hand edit.

## Convergence churn: the task plan needed 10 review rounds across its two live gates, and round 5 re-raised most of round 4

- **category:** optimization
- **evidence:** `ls harness-runs/task_plan_reviews/feat_docs_catalog_retrieval | grep -c '^review_'` = 5 and the same over `harness-runs/architecture_reviews/feat_docs_catalog_retrieval` = 5, so 10 rounds for one unit (the plan); the business-parity gate contributed 0, `phases.parity` being `false`. Diffing the last two task-plan rounds by finding title: `review_4.md` carries **1 net-new** Must Fix (`Task 24 leaves "who starts the rest" false in the paragraph it edits`) and **8 re-raised** items, which it groups under its own literal heading *"These items were raised before and are still open"* (concurrent PGlite opens, the launcher's silent exit, `MACHINE_DIR_MODE`, the `agentInvocable` doc comment, `invokedPath`'s export, missing `## Corpus staleness` entries, baked-in counts in three task files, Task 20's remedy block, `cli/README.md`'s `doctor` description) — each of which also appears in `review_3.md`. The loop hit its 5-revision cap twice and parked twice on the clarification channel (`question_4.md`, `question_5.md`); `answer_5.md` closed it by accepting the last Must Fix without a re-gate.
- **cost this run:** two clarification parks and two operator decisions before planning converged; the branch entered implementation with those 8 re-raised non-blocking items still open.
- **hypothesis:** (a guess) the re-raised set is non-blocking severity the writer is not required to close, so each round re-reports it — the count says nothing about whether the writer or the reviewer is at fault.

# User-review fix round 1 — six user-review findings implemented across cli, plugin and general

## The same `commit_prefix` argument was rendered two different ways by the same agent on one branch

- **category:** agent-contract
- **evidence:** six `committer` `mode: review_item` dispatches on this round each passed a `commit_prefix` token from unit-loop row `UR-A`'s three-way rule (`chore` / `refactor` / `fix`). Five returns reported that the repository's `## Commit-message policy` designates `none` for the review-fix class and rendered the subject with no prefix — `2f00807`, `dc269cf`, `fa34268`, `15ca3a2`, `e8e2786`. One, `e08d1a4` (Finding 1, dispatched with the identical `commit_prefix: chore`), rendered `chore: Split the retrieval Trade-offs section into buys / next / costs`. The branch's fix commits are therefore not uniform in subject form.
- **cost this run:** one commit subject on this branch carries a prefix the other five do not.
- **hypothesis:** (a guess) row `UR-A`'s three-way rule and the adopter's own policy name different vocabularies, and which one a dispatch lands on is decided per dispatch rather than by the contract.

## The fix-plan convergence commit stages no path for `lessons.md`, which the fix-plan writer appends to

- **category:** silent-failure
- **evidence:** `user-review-fix-plan-writer.md` step 6 appends net-new lessons to `<state_dir>/lessons.md` in initial-write mode, and this round's writer did (three lines). `user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3` lists five explicit staging paths and `lessons.md` is not among them; `git grep -l "lessons.md" plugin/instructions/` returns only `run_mode_instructions.md`, so no step of this flow stages it. After the writer returned, `git status --short` showed ` M harness-runs/lessons.md` — a modified **tracked** file, which the engine's own clean-tree checkpoints treat as dirty. This run added the path to the Override 3 wrapper call by hand (commit `7add756`) rather than leave it dangling.
- **cost this run:** one orchestrator-side deviation from the Override's stated path list; left unmodified, the round's lessons would have been uncommitted at "branch ready for review".

## A multi-layer unit's second layer-reviewer overwrites the first's findings file

- **category:** shared-state
- **evidence:** unit-loop row `UR-A`'s `Per-item findings folder` is keyed by item alone (`<per_item_findings_root>item_<K>/`), and step 3 resets `iteration = 0` on entering each layer, so every layer's first reviewer dispatch writes `review_0.md` into the same folder. On Finding 3 (`_(layer: cli, general)_`) the `cli` reviewer wrote `item_3/review_0.md` at dispatch `#16` (returning PASS with a Should Fix about `queryLog.ts`'s inherited-environment list) and the `general` reviewer wrote the same path at `#18`. `ls harness-runs/user_review_fix_plan_point_reviews/feat_docs_catalog_retrieval_fix_plan/item_3/` returns exactly `review_0.md`, carrying the `general` reviewer's findings; the `cli` reviewer's are gone. The same shape held for Findings 6 and 2 (two and three layers).
- **cost this run:** the `cli` reviewer's Should Fix on Finding 3 survives only in that dispatch's transcript, and the D.2 Nice-to-Have scan under-counts multi-layer units.
