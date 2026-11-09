## Conventions corpus is stale on who reads `forge`
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## Not determined`, the bullet "What the configuration key `forge` means beyond the issue trigger is not settled." states `forge` is read only by `init`, by `remote-run.sh trigger` and by `doctor`'s `forge` check; this branch's `branch-protection` check (`cli/src/doctor/checks.ts`) also reads it — `"github"` is what lets that check read GitHub's rulesets and branch protection under `--check-github`.
- **cost this run:** none this run; the bullet owes a follow-up restatement adding the `branch-protection` reader — a supervised `/autonomous-sdlc-harness:harness-analyze` re-run or a hand edit.

## An implementer reported no tree guard selected for a `cli/src/**/*.ts` change
- **category:** agent-contract
- **evidence:** dispatch `[A2 · Item 2 · cli · iter 0] → layer-implementer (#18)` changed `cli/src/doctor/branchProtection.ts` and `cli/src/doctor/checks.ts` (commit 44487562) and returned "No tree guard was selected", while `harness.config.json` `treeGuards` maps `cli/src/**/*.ts` to `test/retrieval-loading.test.mjs`; the other `cli/src` units in this run (#16, #27, #29, #34) reported running that guard.
- **cost this run:** that guard did not run for the unit; the Phase G round-1 gate run (`task_round_1`) passed, so no defect resulted.
