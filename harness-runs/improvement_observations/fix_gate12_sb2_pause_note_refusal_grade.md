## The plan writer reported an undescribed layer: `scripts/lib/gate12-sandbox-round/`
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return (planning iteration 0) carried a `## Corpus staleness` section with one `undescribed-layer` entry: `scripts/lib/gate12-sandbox-round/`, the repository's own Gate 12 sandbox-round driver (row table, plants, graders, sourced by `scripts/gate12-sandbox-round.sh`). Only the catch-all `general` row covers it, and `.claude/context/conventions.md` → `## Documents of record` calls `scripts/` at this root `init`'s output, which this driver is not.
- **cost this run:** none on this branch. It owes the supervised remedy, in the writer's own spelling: run `/autonomous-sdlc-harness:harness-analyze` in a session in this repository, answering `skip` for every already-filled document (never `--yes`), then apply the profile with `npx autonomous-sdlc-harness config set layers`.

## A bare `bash -n` syntax check was refused in the unattended run
- **category:** tooling-gap
- **evidence:** the Phase A Task 1 `layer-implementer` return (`[A · Task 1 · general · iter 0]`) reported that both bare `bash -n` calls its task file asked for, on `scripts/lib/gate12-sandbox-round/grade-state.sh` and `scripts/lib/gate12-sandbox-round/core.sh`, were "refused by the permission layer (\"don't ask mode\")". The task's "parses" claim instead rested on `bash scripts/typecheck.sh`'s shell-parse step and on a `--list` run.
- **cost this run:** the per-file parse check the plan named was not run as written. The evidence was downgraded to the whole-tree typecheck.
- **hypothesis:** a guess: `bash -n <path>` is not on the unattended profile's allow list, while `bash scripts/typecheck.sh` is.

## `printenv HOME` was refused for the test-fix-plan writer's machine-path self-check
- **category:** tooling-gap
- **evidence:** the Phase G round 1 `test-fix-plan-writer` return reported "I couldn't run `printenv HOME` because the command was denied." It checked for the checkout-root prefix in its two plan files instead.
- **cost this run:** the home-directory needle of the writer's own path check was not resolved directly. It was covered indirectly, by the checkout-root prefix it shares.
