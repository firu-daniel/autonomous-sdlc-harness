## `commands.test` gate 6a fails on every run inside a git worktree
- **category:** tooling-gap
- **evidence:** all 16 `layer-implementer` dispatches this run (Tasks 1–10, code-review Findings 1–5, skeptic Finding 1) reported `bash scripts/test.sh` exit 1 with `6a no machine paths` as the sole failure, its only hit `./.git:1:gitdir: /Users/daniel/Work/autonomous-sdlc-harness/.git/worktrees/autonomous-sdlc-harness-feat_readme_summary_compact_llms_txt` — the worktree's untracked `.git` pointer file. Every other automated gate passed on each run.
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
