## The configured test gate exits 1 on every run in this worktree because gate 11's retrieval runtime is not installed
- **category:** tooling-gap
- **evidence:** every `layer-implementer` return in Phases A, A2, C and C2 (33 tasks, 12 findings) reported `bash scripts/test.sh` → exit 1 with gate 11 (docs-retrieval relevance floor) failing on "the retrieval runtime is not installed … missing: autonomous-sdlc-harness", thrown from `evals/docs-retrieval/index-build.mjs`; gate 4 (`npm test`) passed in each of those runs.
- **cost this run:** no unit on this branch had a clean `commands.test` result; every implementer carried a "not caused by this change" caveat instead of a pass, and none checked the failure against a pre-change tree.
- **hypothesis:** the gate treats a missing optional runtime as a failure (exit 1) rather than as BLOCKED (exit 3).

## One implementer's gitignored scratch log failed gate 6a for every later unit
- **category:** shared-state
- **evidence:** from Task 4 onward, every `layer-implementer` return reported gate 6a (no machine paths) failing on `harness-runs/scratch/t3-test.log`, a gitignored log holding absolute stack-trace paths that the Task 3 implementer left in the shared scratch directory; every later implementer declined to delete it because it was not its own file.
- **cost this run:** gate 6a red on 41 consecutive implementer runs (Tasks 4–33 and all 12 review-fix units) for a file no commit contains; the log is still on disk.

## Read-only checks the implementers needed were gated by the unattended profile
- **category:** tooling-gap
- **evidence:** `bash -n` on a shell template was refused or needed approval (Task 7 `remote-run.sh`, Task 9 and Task 12 `autonomous-watcher.sh`); `jq -f` was refused (Task 15, worked around with a Node probe through `scripts/scratch-run.sh`); the `ajv` CLI was blocked (Task 25, worked around with the `ajv` library in a probe); no web-fetch tool was available for the GitHub docs pages (Tasks 15, 28, 29), so every source in `docs/remote-execution.md` §6/§9/§10 is labelled carried-forward rather than re-fetched.
- **cost this run:** syntax checks replaced by indirect evidence (suites that run the script); three GitHub behaviours in `docs/remote-execution.md` §6 left unverified pending hand-run Gate 12.

## Row A's commit_prefix rule and the adopter's commit policy disagree for story-task commits
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` row `A` derives `commit_prefix` from the branch name (`feat_` → `feat`), while `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for "Adding new work — a story task's commit"; the `committer` flagged the mismatch on its Task 23 (`a35a00b`) and Task 28 (`8b2a96d`) returns and used the passed `feat` as its contract requires. All 33 Phase A commits carry `feat:`; the 12 review-fix commits carry no prefix.
- **cost this run:** 33 commit subjects off the adopter's stated policy; two subjects shortened to stay under the 72-character cap after the prefix was added.

## The plan unit needed 7 review rounds before converging, including one park at the 5-revision cap
- **category:** optimization
- **evidence:** `harness-runs/architecture_reviews/feat_remote_execution_github_actions/review_0.md`…`review_3.md` (4 rounds) and `harness-runs/task_plan_reviews/feat_remote_execution_github_actions/review_0.md`…`review_2.md` (3 rounds) — 7 round artifacts, plus architecture PASS rounds that wrote no file. Must Fix per round, architecture root: 4, 2, 1, 1 — every round's Must Fix net-new, 0 re-raised. Task-plan root: 5, 2, 1 — every round net-new, 0 re-raised; its Should Fix list re-raised 5 of round 1's 5 items unchanged in round 2. The walker parked the plan once at `reason: cap` (`harness-runs/clarifications/feat_remote_execution_github_actions/question_1.md`) before the operator granted 5 more rounds.
- **cost this run:** one park-and-resume cycle; 8 planning dispatches in the resumed session on top of the first session's.

## The task-plan writer reported corpus staleness in three conventions rules
- **category:** tooling-gap
- **evidence:** `stale-rule` — `.claude/context/conventions.md` → `## Commit-message policy`: Task 11 adds the watcher commit subject `chore: add user review for <branch>`, absent from the fixed-form list. `stale-rule` — `.claude/context/cli.md` → `## Naming and file layout`, "One template subdirectory per adopter-side home": Tasks 15–17 add `cli/templates/github/`. `stale-rule` — `.claude/context/cli.md` → `## Naming and file layout`, the `cli/src/` area list: Task 2 adds `remote/`, and `retrieval/` from an earlier branch is also missing.
- **cost this run:** each owes a follow-up restatement of the named rule — a supervised `/autonomous-sdlc-harness:harness-analyze` re-run or a hand edit.
