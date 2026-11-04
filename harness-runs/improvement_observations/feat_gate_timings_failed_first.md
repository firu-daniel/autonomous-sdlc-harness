## The plan writer reported conventions-corpus debt this branch creates
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return (planning iteration 0) carried a `## Corpus staleness` section with two entries. `stale-rule`: `.claude/context/conventions.md` → `## The testing bar` says `scripts/run-gates.sh` "runs every gate a process can run without a terminal, a browser, a model session or a network"; after this branch a round whose previous round failed may run only those failures first and stop with `fail`. `undescribed-layer`: `scripts/` holds hand-written repository tooling (`run-gates.sh`, the `check-*.sh` gates, the sandbox probe, and now `scripts/lib/gate-round-lib.sh` and `scripts/lib/test-timing-reporter.mjs`), which the layer profile describes only as `init`'s output.
- **cost this run:** the `stale-rule` entry owes a follow-up restatement of that `## The testing bar` sentence (a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run or a hand edit); the `undescribed-layer` entry owes a supervised `/autonomous-sdlc-harness:harness-analyze` run answering `skip` for every already-filled document (never `--yes`), with the profile applied through `npx autonomous-sdlc-harness config set layers`.

## Implementers reported no tree guard selected for edits the `treeGuards` globs cover
- **category:** agent-contract
- **evidence:** Task 4 (edits to `plugin/instructions/plan_orchestration_instructions_core.md` and `plugin/agents/test-fix-plan-writer.md`) returned "no tree guard was selected because the change is plugin prose only"; Task 5 (edits to three `plugin/instructions/*.md` files) returned "Tree guards: none selected". `harness.config.json` `treeGuards` maps `plugin/**/*.md` to `test/main-repo-resolution-corpus.test.mjs` and `**/*.md` to `test/no-container-home-paths.test.mjs`. The code-review Finding 1 implementer, editing the same `plugin/instructions/plan_orchestration_instructions_core.md`, selected and ran both guards. Task 8 likewise reported none selected while its return lists `harness-runs/task_plans/feat_gate_timings_failed_first/task_8_plan.md` as modified, which `**/*.md` matches.
- **cost this run:** the guards for those three units ran only in the Phase G round-1 suite (which passed), not at unit time.
- **hypothesis:** guess — the implementers matched only the files they considered the change and not the full `git diff --name-only HEAD` / untracked set.

## Implementer shell commands refused by the tool layer, worked around by hand
- **category:** tooling-gap
- **evidence:** Task 6 return: "`cp` was refused, so I applied the template diffs with Edit and then checked each file with `cmp`". Task 9 return: "the tool layer refused a combined `sort` / `comm` pipeline. I ran the plan's commands one at a time and compared their output by reading". Code-review Finding 2 return: "A one-shot `perl` rewrite of the file was refused by the tool layer, so I made the same edits one at a time with the Edit tool". Task 11 return: "removing the scratch files was refused in don't-ask mode" (`harness-runs/scratch/task11-mutations.mjs`, `harness-runs/scratch/task11/` left behind, gitignored).
- **cost this run:** byte-for-byte template copies (Task 6) and a mechanical multi-site rewrite (Finding 2) were done as manual Edit sequences; one plan verification (Task 9) was compared by reading rather than by command; scratch files remain on disk.

## Node documentation fetch refused, so the timing reporter's Node floor is unverified
- **category:** tooling-gap
- **evidence:** Task 7 return: the fetch of Node's documentation history "was refused, first because the host is outside the sandbox's network allowlist, then as a denied command", so `scripts/lib/test-timing-reporter.mjs` → `THE FLOOR` confirms the reporter fields and the `--test-reporter` / `--test-reporter-destination` flags only on Node 20.19.5, not at the package's `>=20.11.0` floor. The `branch-reviewer` (Phase B) carried this forward as a `## Questions` item.
- **cost this run:** a task-prompt goal ("check the floor") shipped unverified and became an operator question.

## Plan architecture review returned FAIL with no Must Fix
- **category:** agent-contract
- **evidence:** the `architecture-reviewer` plan-review dispatch at iteration 1 returned `verdict: FAIL`, `findings_file: harness-runs/architecture_reviews/feat_gate_timings_failed_first/review_1.md`, `must_fix_count: 0`. The walker routed it back to `task-plan-writer`, whose return applied two Should Fix items and stated "The review raised no Must Fix"; iteration 2 then passed.
- **cost this run:** one extra writer dispatch and one extra architecture-review dispatch in the planning loop (7 planning dispatches instead of 5).

## The configured default branch has no local ref in this run copy
- **category:** agent-contract
- **evidence:** `harness.config.json` `defaultBranch` is `dev`; `git log --format='%h %s%n%b' --name-only dev..HEAD` failed with `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.` The Phase A2 `architecture-reviewer` was dispatched with the core's `diff_base: dev`; the `branch-reviewer`, `skeptic-reviewer` and `statistics-plan-writer` returns each reported diffing against `origin/dev` instead because no local `dev` exists.
- **cost this run:** each diffing agent resolved the base itself; no failure, but the base each used is reported only in its own return.
