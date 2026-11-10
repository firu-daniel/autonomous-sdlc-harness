## The plan reported corpus staleness the branch's own work creates
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return (park-4 resume revision, and again on the next revision) carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## Commit-message policy` → **Fixed-form subjects** does not list `chore: Commit re-screened input edit for <branch>`, the fixed subject this branch adds in `plugin/instructions/prompt_injection_screen.md` → `## The steps` step 4 (quoted as entry 15 of the clean-tree commit-point list).
- **cost this run:** owes a follow-up restatement of that conventions list — a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run or a hand edit once this branch lands.

## Implementers' file-mode and copy commands were refused in the unattended profile
- **category:** tooling-gap
- **evidence:** implementer returns in this run report refused calls: `chmod 755 scripts/prompt-injection-screen.sh` (Task 16, returned as an unmarked `blocker:`), `chmod` and direct `/bin/bash` calls (Task 1), `bash -n` on the new script (Tasks 1–5), `cp` of a template over its self-adopted copy (Task 16; code-review Findings 1, 2 and 3), and `git checkout --` to undo a deliberate red-once mutation (Task 9). Each copy was re-made with the file-edit tool and checked with `cmp`.
- **cost this run:** `scripts/prompt-injection-screen.sh` was committed at mode `100644` rather than `100755` (Task 16, commit `eca1f541`), left for the operator; the bash 3.2 runtime check of the new script never ran inside a unit.
- **hypothesis:** the refused forms are all ones the unattended profile does not list; whether that is intended was not checked.

## The run copy carries no local ref for the configured default branch
- **category:** agent-contract
- **evidence:** `git rev-parse --verify --quiet dev` exited 1 in this run copy while `origin/dev` resolved (merge-base `a05560de`); the A2.1 dispatch block's `diff_base: <default_branch>` and the branch/skeptic reviewers' diff base therefore named a ref that does not exist. A `context_notes:` line carrying that fact was added to three dispatches (`harness-runs/dispatch_additions/feat_prompt_injection_reviewer.md`), and `statistics-plan-writer` independently fell back to `origin/dev..HEAD`.
- **cost this run:** three dispatch additions recorded; no reviewer failed on it.

## A unit whose own tree guard went red returned no blocker line
- **category:** agent-contract
- **evidence:** the Task 8 (`plugin`) implementer reported `test/untrusted-input-corpus.test.mjs` failing 5 of 19, every failure naming its new `plugin/agents/prompt-injection-reviewer.md`, and returned no `blocker:` line; the plan sequenced the repair to Task 19 (`cli`) at the next walk position. Task 8 committed as `18f237fb` with that guard red; Task 19 (`4f3aa618`) turned it green.
- **cost this run:** one commit (`18f237fb`) on the branch with a selected tree guard failing; the story index's "Manual setup required" records the underlying single-layer-versus-guard conflict for the maintainer.

## A single-layer finding tag left a self-adopted copy out of sync
- **category:** agent-contract
- **evidence:** architecture-review Finding 5 (`harness-runs/architecture_branch_reviews/feat_prompt_injection_reviewer_arch_review.md`) was tagged `_(layer: cli)_`; its implementer edited `cli/templates/scripts/prompt-injection-screen.sh` only and reported the root `scripts/prompt-injection-screen.sh` as outside its path. The branch review then raised the drift as code-review Finding 3 (`harness-runs/code_reviews/feat_prompt_injection_reviewer_code_review.md`), fixed in `1bbdba80`.
- **cost this run:** one extra review finding and its implementer + committer dispatches.

## The plan needed 7 review rounds across its gates
- **category:** optimization
- **evidence:** plan-convergence round artifacts: `harness-runs/architecture_reviews/feat_prompt_injection_reviewer/review_0.md`–`review_4.md` (5) and `harness-runs/task_plan_reviews/feat_prompt_injection_reviewer/review_0.md`–`review_1.md` (2) = 7, plus PASS dispatches that wrote no file. Per round, by finding-title match against the same root's predecessor — architecture: r1 1 net-new / 4 re-raised; r2 2 net-new / 3 re-raised; r3 0 net-new / 3 re-raised; r4 1 net-new / 0 re-raised. Task-plan: r1 7 net-new / 3 re-raised. The run parked 4 times during planning (`harness-runs/clarifications/feat_prompt_injection_reviewer/`).
- **cost this run:** four clarification parks before implementation started.
