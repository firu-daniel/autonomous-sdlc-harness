## The planner reports `scripts/` as a directory no layer's conventions describe
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return for this branch carried a `## Corpus staleness` section with one `undescribed-layer` entry: directory `scripts/`, holding this repository's hand-written gate tooling (`scripts/run-gates.sh`, `scripts/lib/gate-round-lib.sh`, `scripts/lib/test-timing-reporter.mjs`), which Tasks 3–4 edited. Only the catch-all `general` row covers it, and `.claude/context/conventions.md` → `## The layers` does not list it among what `general` owns.
- **cost this run:** Tasks 3 and 4 were planned, implemented and reviewed against a conventions document that does not describe `scripts/`. The remedy the writer gave is supervised: run `/autonomous-sdlc-harness:harness-analyze` in this repository, answering `skip` for every already-filled document (never `--yes`), then apply the profile with `npx autonomous-sdlc-harness config set layers`.

## A test run prefixed with an environment variable was refused, so a planned check never ran
- **category:** tooling-gap
- **evidence:** the Task 2 `layer-implementer` (dispatch `[A · Task 2 · cli · iter 0]`, #3 of the implementation half) reported that `HARNESS_TEST_CONCURRENCY=abc npm test --workspace cli -- test/helpers/concurrency.mjs` was refused by the tool layer ("don't ask mode"). Its plan named that run as the check that a bad `HARNESS_TEST_CONCURRENCY` value is still refused at load time after `cli/test/helpers/concurrency.mjs` was cut down to the bound.
- **cost this run:** that behaviour shipped verified only by reading the file (`caseConcurrency()` unchanged), which the implementer recorded as an evidence downgrade and a deviation note in `harness-runs/task_plans/fix_test_timing_attribution/task_2_plan.md`. The full-suite Run gates round still passed.
- **hypothesis:** a leading `VAR=value` assignment does not match the `npm test` prefix entries in the unattended profile.

## The planner could not run Node to confirm the event field the design keys on
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return stated that "the sandbox blocked my probe on Node 20.19.5". So the field Task 3 keys on (an event whose `data.name` resolves to its `data.file` is Node's file-level entry) was taken from Node's runner source instead. The return does not quote the refused command.
- **cost this run:** the design's central assumption went into planning, review and Task 3 unconfirmed. It was first exercised by Task 5's real `node --test` run, four units later, which passed.

## Implementers broke the test-run rule's foreground clause and said so
- **category:** agent-contract
- **evidence:** the Task 1 `layer-implementer` return says it piped two baseline test runs through `grep` and `tail`, and ran two suites together in one command. The code-review Finding 1 `layer-implementer` return says it ran `bash scripts/typecheck.sh` with a `cd` in front. Both are against `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6 (main checkout). Each agent reported its own breach.
- **cost this run:** none measurable. The breached runs were baseline or evidence runs, and the whole-tree gates passed on round 1.

## The configured default branch has no local ref in the run copy, so reviewers diffed against its remote-tracking ref
- **category:** tooling-gap
- **evidence:** `harness.config.json` `defaultBranch` is `dev`, and Phase A2 and Phase B passed `diff_base: dev`. The `branch-reviewer` and the B.2 `review-plan-reviewer` both reported that this run copy has no local `dev` branch and diffed against `origin/dev`. The `branch-reviewer` recorded this in the Context paragraph of `harness-runs/code_reviews/fix_test_timing_attribution_code_review.md`. This step's own `git log` over the branch range also used `origin/dev`.
- **cost this run:** none here, because the reviewers fell back on their own. A reviewer that does not fall back would compute no diff.
