## Story-task commit prefix: the unit loop's branch-name rule contradicts the repo's commit-message policy
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` (main checkout) → `## The unit loop` substitution table, row `A`, `commit_prefix rule` cell: "from the branch name: `feat_` → `feat`, `fix_` → `fix`, `refactor_` → `refactor`, else `chore`". `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for "**Adding new work** — a story task's commit". The orchestrator followed row `A` and passed `commit_prefix: chore`, so all eight task commits (1c0eff14, 7024427d, b0f617e7, 3b474541, 6ba62caa, 08fdb03e, 5bdd67f2, 5dd49e30) carry `chore:`. The committer flagged the conflict on its Task 7 and Task 8 returns and used the value given. The fix rows (`C`) resolve from the policy and passed `none`, so this branch mixes both forms (7a3f071f, cccca6ab, fcf2099f, bd8702c7 have no prefix).
- **cost this run:** eight story-task subjects off the repository's own policy; no rework.
- **hypothesis:** row `A`'s rule predates the per-class designation that the fix rows already read.

## `push-branch.sh` took `--repo` as its target path and pushed nothing, exiting 0
- **category:** silent-failure
- **evidence:** the orchestrator invoked `bash scripts/push-branch.sh --repo <run copy root>` (main checkout copy) by analogy with `commit-on-branch.sh --repo`. It printed `push-branch.sh: '--repo' is not a git repository — nothing to push` and exited 0. The ledger `A` flip commit a082806e was pushed only after a second call with the root as the positional argument. `commit-on-branch.sh` takes `--repo <root>`; `push-branch.sh` takes the root positionally.
- **cost this run:** one unpushed commit until the re-issue; noticed only because the line was read.

## branch-reviewer's Pass-0 grep sweep did not run: its sweep table is an empty stub
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return, `### Pass 0 gaps`: "**Grep sweep: did not run.** The sweep table in `branch-reviewer` is still the empty stub, so no regex ran. Treat that as a configuration gap, not a clean result."
- **cost this run:** Phase B ran with no mechanical regex sweep over the diff.

## Zero-yield phases: the architecture and skeptic reviews of the implemented branch found nothing
- **category:** optimization
- **evidence:** Phase A2 `architecture-reviewer` (dispatch #17) and Phase C2 `skeptic-reviewer` (dispatch #29) each returned `verdict: PASS` over the whole 8-task branch diff and wrote no index — no file exists under `harness-runs/architecture_branch_reviews/` or `harness-runs/skeptic_reviews/` for this branch. The diff touched one layer (`general`) across five files.
- **cost this run:** two end-of-branch dispatches with no change.
