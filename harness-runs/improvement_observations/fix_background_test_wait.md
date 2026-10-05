## The plan reported corpus staleness in the shared conventions document's testing bar
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## The testing bar`, the bullet starting "A unit's own verification runs the one test file". This branch's test-run rule point 6 (`plugin/instructions/unit_loop_core.md`) falsifies two parts of it: it gives the per-unit command as `npm test -- test/<name>.test.mjs` run from `cli/` (a directory change, the shape point 6 now rules out), and it quotes spec-reporter output (`ℹ tests 1`, `ℹ pass 1`), which a captured run never prints (a captured `node --test` prints TAP, `# tests 1`). The writer's suggested rewrite: `npm test --workspace cli -- test/<name>.test.mjs` from the repository root, both output forms named, and a pointer to point 6.
- **cost this run:** owes a follow-up restatement of that bullet, by hand or through a supervised `/autonomous-sdlc-harness:harness-analyze` re-run. Until it lands, this repository's own units still read the priming text the task prompt's goal 5 asked to fix.

## A committer subject exceeded the 72-character cap the commit policy sets
- **category:** agent-contract
- **evidence:** commit `9fd94b4` (Phase C, code-review Finding 3) has the subject "Add never piped to the single-file command shape sentence in both adopter conventions templates", 92 characters. `.claude/context/conventions.md` → `## Commit-message policy` sets a 72-character cap for every non-fixed-form subject. Every other unit commit in this run was shortened to fit, and the Task 1 and Task 2 committers said so in their returns.
- **cost this run:** one commit subject over the documented cap is on the branch history.

## An implementer piped its typecheck through `tail` in the run that added the rule against it
- **category:** agent-contract
- **evidence:** the Phase C `layer-implementer` dispatch for code-review Finding 1 reported "I piped it through `tail`, which point 6 says not to do, so the exit status wasn't captured; the result rests on that printed line" for `bash scripts/typecheck.sh`. Point 6 of `## The test-run rule` (`plugin/instructions/unit_loop_core.md`) was on the branch from commit `e80523b`, before that dispatch.
- **cost this run:** that unit's typecheck pass rests on its printed line, not on a captured exit status.
- **hypothesis:** the implementer read point 6 as covering the test command only.

## Row A's branch-name commit prefix disagreed with this repository's commit policy
- **category:** agent-contract
- **evidence:** row `A`'s `commit_prefix rule` (`plugin/instructions/unit_loop_core.md` → `## Substitution table`) maps the `fix_` branch prefix to `fix`, so the orchestrator passed `commit_prefix: fix` on all three task commits. The committer dropped it each time under `.claude/context/conventions.md` → `## Commit-message policy` (story-task commits take `none`), as its returns for `3977415` and `e80523b` state. The fix rows' designation rule resolved `none` from the same policy with no disagreement.
- **cost this run:** no wrong commit landed; three dispatches carried a prefix the committer had to override.
