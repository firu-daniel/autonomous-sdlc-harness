## Implementers could not run `bash -n` on the edited watcher template, so its shell syntax went unchecked until Run gates
- **category:** tooling-gap
- **evidence:** three `layer-implementer` returns reported a `bash -n` syntax check on `cli/templates/scripts/autonomous-watcher.sh` refused or needing approval: Task 2 (`[A · Task 2 · cli · iter 0]`, commit 570b3ae), Task 4 (`[A · Task 4 · cli · iter 0]`, commit 57af609) and skeptic Finding 1's `cli` layer (`[C2 · Item 2 · cli · iter 0]`, commit 0d30b03). Each fell back to reading the diff; `bash scripts/typecheck.sh` compiles `cli/src` only and does not cover the template.
- **cost this run:** the watcher edits of three units shipped with syntax verified by reading only; Task 5's implementer flagged that its tests would be the first code to execute Task 4's changes.

## No single-file test command is stated in the `cli` or catch-all conventions documents, so units skipped their own test runs
- **category:** tooling-gap
- **evidence:** `layer-implementer` returns for Tasks 1, 2, 5 and 6, code-review Finding 1 (a07688e), test-fix round-1 Findings 1–3 (a7c6410, fda74d5, f86996f) and round-2 Finding 1 (a4d656b) each reported "skipped, no single-file command stated" against `.claude/context/cli.md` and `.claude/context/conventions.md`; the Tasks 3 and 7 implementers instead ran `node --test <file>` directly. The row-`G.4` already-passing close on round-1 Finding 2 (fda74d5) rested on reading the fix site rather than running the named test.
- **cost this run:** Run gates round 1 failed on three findings and round 2 on one, all in test files whose unit had not run them (`cli/test/test-timeout.test.mjs`, the suite's `--test-timeout`); two extra gate rounds.

## Row A's branch-name `commit_prefix` rule passed `fix` on every task commit, and the committer overrode it each time
- **category:** agent-contract
- **evidence:** every Phase A `committer` dispatch carried `commit_prefix: fix` (row `A` of `unit_loop_core.md`'s substitution table: `fix_` → `fix`); all eight returns (3deaf7a, 570b3ae, b4697f9, 57af609, 606adc1, e786d24, 10eaa64, 32cf3c8) reported dropping it because `.claude/context/conventions.md` → `## Commit-message policy` gives story-task commits no prefix and allows only `chore`.
- **cost this run:** eight committer returns spent reporting the same override; no wrong commit landed.
- **hypothesis:** the row's `commit_prefix rule` predates the project's own commit policy and the fix rows' designation rule.

## Env-prefixed commands (`VAR=value node --test …`, `env VAR=value …`) are refused by the unattended profile
- **category:** tooling-gap
- **evidence:** the Task 7 `layer-implementer` return (`[A · Task 7 · cli · iter 0]`, commit 10eaa64) reported both forms refused when running `cli/test/watcher-remote-job.test.mjs` with `HARNESS_JOB_USAGE_REPEAT` set, and routed the runs through `scripts/scratch-run.sh` with a probe script instead.
- **cost this run:** Task 7 took 1003 s (the longest unit), partly on the probe workaround.
