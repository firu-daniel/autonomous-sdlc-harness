## Implementer returns report "no tree guard was selected" for changed paths a `covers` glob matches
- **category:** agent-contract
- **evidence:** `layer-implementer` returns in this run stated that no tree guard was selected while the unit's changed path matches a `treeGuards[].covers` glob in `harness.config.json`: Task 1 (`cli/templates/scripts/scratch-run.sh` vs `cli/templates/scripts/**/*.sh` and `cli/templates/scripts/**`), Task 8 (`docs/remote-execution.md` vs `**/*.md`), Task 11 (`docs/development.md`, `docs/sandbox-record.md` vs `**/*.md`), skeptic Finding 2 fix (`plugin/hooks/README.md` vs `plugin/**/*.md` and `**/*.md`), skeptic Finding 1 fix (`docs/remote-execution.md` vs `**/*.md`). Other units in the same run (Tasks 4, 6, 7, 9, 10) did select `test/no-container-home-paths.test.mjs` for `.md` changes. Commits: fb2e03bb, f2cdbeeb, 20d94aaf, 227e036e, 9f31253c.
- **cost this run:** five units shipped without the guard runs `unit_loop_core.md` → `## The test-run rule` point 7 owes; Phase G round 1 passed, so no defect resulted this time.
- **hypothesis:** guess — the glob match is applied by eye rather than mechanically, and `**` matching zero segments is missed.

## Implementers ran test files behind a `cd` prefix and a pipe
- **category:** agent-contract
- **evidence:** three `layer-implementer` returns self-reported running `<test_file_cmd>` or `bash scripts/typecheck.sh` with a `cd <root> &&` prefix and/or output piped to `tail` / `grep`, which `unit_loop_core.md` → `## The test-run rule` point 6 forbids: Task 9 (ec3af165), code-review Finding 1 fix (73796504), code-review Finding 2 fix (197ef84b). None was refused in this session.
- **cost this run:** none observed; each return flagged the breach itself.

## Read-only checks refused in sub-agents under don't-ask mode
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` iteration-2 return reported "Two of my read-only Bash checks were refused by the permission mode"; the Task 2 `layer-implementer` return reported "the session's don't-ask mode refused the combined command" for its plan's grep checks and fell back to reading `jq -r '._README[]'` output (recorded as a deviation in `harness-runs/task_plans/chore_sandbox_honesty_paragraphs/task_2_plan.md`). The orchestrator's own `cd <plugin instructions dir>; grep …` compound was refused the same way at session start.
- **cost this run:** two plan verification checks downgraded to manual reads.

## The configured `defaultBranch` has no local ref in the run copy
- **category:** shared-state
- **evidence:** `git log --format='%h %s%n%b' --name-only dev..HEAD` (the command `improvement_observations_instructions.md` → `## Dispositioned units` prescribes) failed at Phase D with `fatal: ambiguous argument 'dev..HEAD': unknown revision`. The `branch-reviewer` (Phase B) and `statistics-plan-writer` (D.1) returns both reported the same missing local `dev` and fell back to `origin/dev`.
- **cost this run:** three agents re-derived the base by hand; the disposition derivation here was run over `origin/dev..HEAD` instead.

## A test scratch file left behind because `rm` is refused
- **category:** tooling-gap
- **evidence:** the Task 3 `layer-implementer` return reported its mutation script `harness-runs/scratch/task3-headless-mutation.mjs` "is still on disk because `rm` was refused in this session"; the file is gitignored.
- **cost this run:** one untracked scratch file in the run copy needing manual deletion.

## The plan needed 3 review rounds
- **category:** optimization
- **evidence:** plan rounds across the plan-convergence roots: `harness-runs/architecture_reviews/chore_sandbox_honesty_paragraphs/` (`review_0.md`) and `harness-runs/task_plan_reviews/chore_sandbox_honesty_paragraphs/` (`review_0.md`, `review_1.md`) — 3 in total; `business_parity_reviews` has none (`phases.parity` false). The net-new vs re-raised split for `review_1.md` against `review_0.md` is not measurable from headings: neither file carries per-finding headings, only `## Must Fix` / `## Should Fix` / `## Nice to Have`.
- **cost this run:** 9 planning dispatches before convergence.
