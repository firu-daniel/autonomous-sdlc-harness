## `commands.test` gate 6a fails on every run inside a git worktree
- **category:** tooling-gap
- **evidence:** all 16 `layer-implementer` dispatches this run (Tasks 1–10, code-review Findings 1–5, skeptic Finding 1) reported `bash scripts/test.sh` exit 1 with `6a no machine paths` as the sole failure, its only hit `./.git:1:gitdir: <main checkout>/.git/worktrees/autonomous-sdlc-harness-feat_readme_summary_compact_llms_txt` — the worktree's untracked `.git` pointer file. Every other automated gate passed on each run.
- **cost this run:** no unit on this branch was verified by a passing `commands.test`; each implementer reported a red gate and the run proceeded on its per-hit reading.
- **hypothesis:** (guess) the 6a grep's `--exclude-dir=.git` does not skip `.git` when it is a file, as one implementer reported.

## Row `A`'s branch-name `commit_prefix` was rejected by the committer on all 10 task commits
- **category:** agent-contract
- **evidence:** the orchestrator passed `commit_prefix: feat` (unit_loop_core.md row `A`: `feat_` → `feat`) on commits 16e7379, cacf9c1, 2987e1f, 067261f, 1c75636, 4144015, 6a804da, 008cc26, 275e5b5, 34fad8d; each committer return stated `feat` is not a legal value under `.claude/context/conventions.md` → `## Commit-message policy` (story-task class = `none`) and committed with no prefix.
- **cost this run:** none to the commits; ten committer returns each carried a paragraph explaining the override.

## Permission profile refused verification commands implementers attempted
- **category:** tooling-gap
- **evidence:** Task 8 implementer: `npm pack --dry-run` refused in both the `--workspace cli` and `cli/` forms. Task 9 implementer: `chmod +x scripts/check-llms-txt.sh`, `bash -n`, `/bin/bash` and `bash --version` needed approval. Task 10 implementer: a process-substitution `grep` comparison refused. Code-review Finding 1 implementer: running the check under `/bin/bash` (3.2) refused.
- **cost this run:** `scripts/check-llms-txt.sh` is committed as mode `100644` (`git ls-files -s`), unlike `scripts/run-gates.sh` at `100755`; the npm-package exclusion of `llms.txt` and the script's bash 3.2 compatibility rest on reading, not on a run.

# User-review fix round 1 — adopter commands in fenced blocks

## `commands.test` gate 6a now also flags this branch's own improvement-observations intake file
- **category:** tooling-gap
- **evidence:** the Finding 1 `layer-implementer` reported `bash scripts/test.sh` exit 1 with `6a no machine paths` as the sole failure, hitting two files: the worktree's untracked `.git` pointer file and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, whose task-run block (commit 0e2f1ce) quotes that pointer's absolute path verbatim.
- **cost this run:** the Finding 1 fix (e9b9cb5) was committed on a red `commands.test`; the second hit persists outside a worktree too.

## `user-review-fix-plan-writer` edited the tracked lessons ledger, and no fix-planning commit stages it
- **category:** silent-failure
- **evidence:** after the initial-write dispatch `git status --short` showed ` M harness-runs/lessons.md` (the writer's step-6 append). The fix-plan fork's Override 3 path list (fix-plan index, review, per-finding folder, two gate folders) does not name it, so it stayed dirty through R1/R2 and was swept into the Finding 1 fix commit e9b9cb5 by the `review_item` committer (`files_committed: 5`, lessons.md among them).
- **cost this run:** the new lesson landed inside an unrelated fix commit rather than with the fix plan; on a zero-finding round no committer would have run and it would have stayed uncommitted.

## Fix-plan fork found a task-engine ledger at the path §1.4's round comparison reads
- **category:** agent-contract
- **evidence:** at Setup `harness-runs/flow_progress/feat_readme_summary_compact_llms_txt_progress.md` carried the header `(engine: task)` with no round; autonomous_pause_and_ledger.md §1.4 names only equal-round, older-round and absent cases. The orchestrator treated it as a re-seed and overwrote it with the user-review template (commit 2b14cef).
- **cost this run:** none measurable; the task-engine ledger survives only in history before 2b14cef.

## Row `UR-A`'s severity `commit_prefix` was rejected by the committer
- **category:** agent-contract
- **evidence:** the orchestrator passed `commit_prefix: fix` (unit_loop_core.md → Row UR-A: `## Must Fix` → `fix`); the committer returned that `.claude/context/conventions.md` → `## Commit-message policy` gives fix commits no prefix and committed e9b9cb5 unprefixed.
- **cost this run:** none to the commit; one committer note explaining the override.
