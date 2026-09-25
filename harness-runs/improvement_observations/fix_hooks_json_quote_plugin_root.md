## `commands.test` fails gate 11 in the run's worktree because the retrieval runtime is not installed
- **category:** tooling-gap
- **evidence:** every `layer-implementer` dispatch this run (Task 1, Task 2, code-review Finding 1, Finding 2 plugin layer, Finding 2 general layer — 5 of 5) reported `bash scripts/test.sh` exit 1 with `run-gates: 1 failed, 19 passed`, the failure being gate `11 docs-retrieval relevance floor`: `the retrieval runtime is not installed, so the optional peers cannot be loaded; missing: autonomous-sdlc-harness`. The `skeptic-reviewer` reproduced it with `bash scripts/run-gates.sh`.
- **cost this run:** the configured test gate was red on every unit, so no unit had a green `commands.test`; each implementer re-diagnosed the same failure in its return.
- **hypothesis:** (guess) the per-branch worktree is created without the retrieval setup step that gate 11 needs.

## Row A's branch-derived `commit_prefix` contradicts the repository's commit policy for story-task commits
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` maps branch `fix_` → `fix`, so Tasks 1 and 2 committed as `b86feed fix: Task 1 — …` and `34512f5 fix: Task 2 — …`. `.claude/context/conventions.md` → `## Commit-message policy` says a story task's commit takes `none`, and `chore` is the only prefix token in use. The committer's return on `b86feed` flagged the conflict: "`fix:` a subject the policy doesn't allow". The previous branch's task commits (`30208c4`, `6d56366`, `8ecc5ed`) carry the same `fix:` prefix.
- **cost this run:** two pushed task commits carry a prefix the repository's own policy disallows; rewording them would need a force-push.

## A gitignored scratch file left by one implementer failed gate 6a for the next
- **category:** tooling-gap
- **evidence:** the Task 1 `layer-implementer` return says `harness-runs/scratch/test_out.txt` "may still be there, because its cleanup command was not approved". The Task 2 `layer-implementer` return says its first gate run failed `6a no machine paths` only because that file held the checkout's absolute path, and passed after it deleted the file.
- **cost this run:** one extra full gate run inside Task 2.

## The branch reviewer could not run the validator the acceptance criteria name
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return says "The permission profile refused a bare `claude …` command", so the three acceptance checks (`claude plugin validate --strict plugin` among them) rest on the output Task 2 recorded in `docs/development.md` §3 rather than on the reviewer's own run.
- **cost this run:** the end-of-branch review graded the validator result second-hand. The skeptic reviewer later confirmed `ok 1a` via `bash scripts/run-gates.sh`.
