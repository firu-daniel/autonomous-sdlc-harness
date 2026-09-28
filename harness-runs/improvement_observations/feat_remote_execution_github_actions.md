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

# User-review fix round 1 — poller race and retry bound, state-bundle retention and expiry, QA declared unsupported remotely

## Per-layer reviewers of a multi-layer finding write the same `review_<i>.md` name into one shared folder
- **category:** silent-failure
- **evidence:** every Phase A item carried two or three layers (`_(layer: cli, general)_`, `_(layer: cli, plugin, general)_`), each layer's `layer-reviewer` was dispatched with the same `findings_folder: harness-runs/user_review_fix_plan_point_reviews/feat_remote_execution_github_actions_fix_plan/item_<K>/`, and `iteration` restarts at 0 per layer (`plugin/instructions/unit_loop_core.md` step 3). On Finding 2 the cli reviewer (PASS) left a Nice to Have in `item_2/review_0.md`, which the general implementer then quoted; the general reviewer's FAIL at iteration 0 was written to the same `item_2/review_0.md` (mtime 10:56), replacing it. On Finding 3, `item_3/review_0.md` went from 2881 bytes (11:22, cli) to 5670 bytes (11:55, general). On Finding 4 the general reviewer wrote `item_4/review_0_general.md` instead, and both it and the next implementer returned a note that the naming collides.
- **cost this run:** at least one layer's per-unit review file on Finding 2 is no longer on disk, so the D.2 Nice-to-Have scan and any later round count see one file where two reviews ran.
- **hypothesis:** the folder is keyed per unit while the counter is per layer.

## The configured test gate stayed red for every implementer this round, on the same two gates as the task run
- **category:** tooling-gap
- **evidence:** all 12 `layer-implementer` returns in Phase A (Findings 1–4, first and fix iterations) reported `bash scripts/test.sh` → `run-gates: 2 failed, 18 passed`: gate 6a on the gitignored `harness-runs/scratch/t3-test.log` (dated 2026-09-25), and gate 11 on "the retrieval runtime is not installed". Gate 4 (`npm test`) passed in each.
- **cost this run:** no fix commit this round has a clean `commands.test` result behind it; each implementer carried a "not caused by this change" caveat, and the scratch log is still on disk.

## Read-only checks and doc fetches were gated again for the implementers
- **category:** tooling-gap
- **evidence:** Finding 3's cli implementer could not run `bash -n` or `curl` and its fetch of the `actions/upload-artifact` v4 README was refused, so the claim that `retention-days: 400` is capped rather than rejected is recorded as unverified; Finding 3's general implementer had `curl` to docs.github.com refused and carried the storage/cache/disk figures from the user review; Finding 1's general implementer had no web access and marked its `docs/remote-execution.md` §6 row "None retrieved".
- **cost this run:** two new §6 "not verified" rows and one set of carried-forward figures in `docs/remote-execution.md`; shell syntax checked only through the test suite.

## Row UR-A's commit_prefix rule was overridden by the committer on every fix commit
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `#### Row UR-A` maps `## Must Fix` → `fix`, and all four commit dispatches passed `commit_prefix: fix`; each `committer` return declined it, citing `.claude/context/conventions.md` → `## Commit-message policy` (review-fix commits take no prefix), and committed unprefixed: `15314fc`, `ab309d9`, `51bec02`, `583e6e3`.
- **cost this run:** four committer returns carried the same override note; subjects match the policy, not the loop's rule.

## The fix-plan writer's lessons-ledger append was left for an unrelated fix commit to sweep up
- **category:** silent-failure
- **evidence:** the initial `user-review-fix-plan-writer` dispatch appended four lines under `## Unattended control loops` in the tracked `harness-runs/lessons.md`; the fix-plan convergence commit `f778317` stages only the fix-plan index, its folder, the source review and the two gate folders, so `git status` showed ` M harness-runs/lessons.md` entering Phase A. The Finding 1 `committer` staged it into `15314fc` and noted it carried all four lessons, not only Finding 1's.
- **cost this run:** the round's lessons landed in a finding's fix commit rather than the plan commit, and Phase A started on a dirty tracked tree.

## Finding 4 needed 3 per-unit review rounds
- **category:** optimization
- **evidence:** `harness-runs/user_review_fix_plan_point_reviews/feat_remote_execution_github_actions_fix_plan/item_4/` holds `review_0.md` (plugin, iteration 0), `review_0_general.md` (general, iteration 0) and `review_1.md` (plugin, iteration 1), plus PASS rounds that wrote no file. Sorted in that order: round 1 vs round 0 — 2 net-new findings, 0 re-raised; round 2 vs round 1 — 1 net-new, 0 re-raised. Two layer reviewers share this root, so consecutive entries are not always the same reviewer.
- **cost this run:** 2 extra implementer and 2 extra reviewer dispatches on Finding 4.
